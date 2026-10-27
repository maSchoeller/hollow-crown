import type { GameData, Pos } from '../defs';
import type { GameEvent } from '../events';
import { availableActions, hasKey, mustStayForRest } from '../battle/actions';
import { applyCommand } from '../battle/apply';
import type { Command } from '../battle/commands';
import { itemDef } from '../rules/items';
import { destinations, moveCost, reachable, threatTiles } from '../rules/movement';
import { isScout } from '../rules/scout';
import { computeStats } from '../rules/stats';
import type { BattleState, BattleUnit } from '../state';
import { active, areaTiles, dist, inBounds, neighbors, posKey, samePos } from '../util';
import { attackPlans, bestApproach } from './ai';
import { wardLine } from './wardLine';

function dangerCounts(data: GameData, s: BattleState): Map<string, number> {
  const m = new Map<string, number>();
  for (const o of s.units) {
    if (o.team !== 'enemy' || !active(o)) continue;
    const hold = staysPut(o);
    for (const k of threatTiles(data, s, o, !!hold)) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/**
 * Movement-cost distance of every tile to the nearest goal (units ignored), so a fence or a wall is walked around, not
 * stared at. With `doorsOpen` the closed doors count as floor: the field shows the way once somebody has opened them.
 */
function walkField(data: GameData, s: BattleState, u: BattleUnit, goals: Pos[], doorsOpen: boolean): Map<string, number> {
  const out = new Map<string, number>();
  const over = doorsOpen ? { door: 1 } : undefined;
  const buckets: Pos[][] = [];
  for (const g of goals) {
    if (!inBounds(s, g)) continue;
    out.set(posKey(g), 0);
    (buckets[0] ??= []).push(g);
  }
  for (let c = 0; c < buckets.length; c++) {
    for (const p of buckets[c] ?? []) {
      if (out.get(posKey(p)) !== c) continue;
      const total = c + Math.max(1, moveCost(data, s, u, p, over) ?? 1);
      for (const n of neighbors(p)) {
        if (moveCost(data, s, u, n, over) === null) continue;
        const k = posKey(n);
        if ((out.get(k) ?? Infinity) <= total) continue;
        out.set(k, total);
        (buckets[total] ??= []).push(n);
      }
    }
  }
  return out;
}

/**
 * Steps to the closest target around walls (story 9.8, treasure hunts in rooms): breadth-first from the targets over every tile a foot unit
 * could ever stand on; closed doors count as open because the hunt opens them. Straight-line distance gets stuck behind a wall.
 */
function walkDistances(data: GameData, s: BattleState, targets: Pos[]): Map<string, number> {
  const out = new Map<string, number>();
  const queue: Pos[] = [];
  for (const t of targets) {
    out.set(posKey(t), 0);
    queue.push(t);
  }
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i]!;
    for (const n of neighbors(c)) {
      if (!inBounds(s, n) || out.has(posKey(n))) continue;
      const terrain = s.terrain[n[1] * s.width + n[0]]!;
      if (terrain !== 'door' && data.terrain[terrain]?.cost.foot == null) continue;
      out.set(posKey(n), out.get(posKey(c))! + 1);
      queue.push(n);
    }
  }
  return out;
}

/** The closed door the way along `field` (doors counted as floor) runs into first, starting at `from`; null when it meets none. */
function doorOnTheWay(s: BattleState, field: Map<string, number>, from: Pos): { id: string; at: Pos } | null {
  let p = from;
  let v = field.get(posKey(p));
  while (v !== undefined && v > 0) {
    const door = s.objects.find((o) => o.type === 'door' && o.state === 'closed' && samePos(o.at, p));
    if (door) return { id: door.id, at: door.at };
    let next: Pos | null = null;
    let nv = v;
    for (const n of neighbors(p)) {
      const w = field.get(posKey(n));
      if (w !== undefined && w < nv) {
        next = n;
        nv = w;
      }
    }
    if (!next) return null;
    p = next;
    v = nv;
  }
  return null;
}

/** Foes that stay where they are until somebody comes close (hold, guard, a trigger not yet awake). */
const staysPut = (o: BattleUnit): boolean => !!o.ai && (o.ai.profile === 'hold' || o.ai.profile === 'guard' || (o.ai.profile === 'trigger' && !o.ai.awake));

/**
 * The foe will do nothing next phase: it stays put (hold, guard, a trigger not yet awake), or it would move but has no attack
 * to make and no tile that brings it closer (e.g. a foe fenced off from the player it wants to reach).
 */
function idleFoe(data: GameData, s: BattleState, o: BattleUnit): boolean {
  if (staysPut(o)) return true;
  if (attackPlans(data, s, o, destinations(s, o, reachable(data, s, o))).length) return false;
  const goals = s.units.filter((p) => p.team === 'player' && active(p) && p.pos).flatMap((p) => neighbors(p.pos!));
  return !bestApproach(data, s, o, goals);
}

function approach(s: BattleState, u: BattleUnit, dests: Pos[], targets: Pos[], danger: Map<string, number>, maxDanger: number, field?: Map<string, number>): Pos {
  let best = u.pos!;
  let bestScore = Infinity;
  for (const p of dests) {
    const d = danger.get(posKey(p)) ?? 0;
    if (d > maxDanger) continue;
    const manhattan = Math.min(...targets.map((t) => dist(p, t)), 999);
    const near = field ? (field.get(posKey(p)) ?? 500 + manhattan) : manhattan;
    const score = near * 10 + d;
    if (score < bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

/**
 * defend (story 9.9 follow-up): the line the company holds in front of the ward. The tankiest non-lord units (as many as the line has tiles)
 * take one tile each, the nearest first; everybody else waits behind the line, close to it. Null while there is no narrow line (an open
 * village) or a foe already stands on or behind it: then the company crowds and meets the foes at the ward as before.
 */
function holdLine(data: GameData, s: BattleState, ward: BattleUnit | undefined, enemies: BattleUnit[]): { posts: Map<string, Pos>; cut: Pos[]; inside: Set<string> } | null {
  if (!ward?.pos) return null;
  const line = wardLine(data, s, ward.pos, enemies.map((o) => o.pos!));
  if (!line) return null;
  const cutKeys = new Set(line.cut.map(posKey));
  if (enemies.some((o) => cutKeys.has(posKey(o.pos!)) || line.inside.has(posKey(o.pos!)))) return null;
  const toughness = (u: BattleUnit) => {
    const st = computeStats(data, u, { state: s });
    return st.maxHp + st.stats.def + st.stats.res;
  };
  const company = s.units
    .filter((u) => u.team === 'player' && active(u) && u.pos)
    .map((u) => ({ u, vip: u.flags.includes('mustSurvive'), t: toughness(u) }))
    .sort((a, b) => Number(a.vip) - Number(b.vip) || b.t - a.t || (a.u.uid < b.u.uid ? -1 : 1));
  const holders = company.slice(0, line.cut.length).map((c) => c.u);
  const walk = line.cut.map((tile) => walkDistances(data, s, [tile]));
  const posts = new Map<string, Pos>();
  const freeTiles = new Set(line.cut.map((_, i) => i));
  while (freeTiles.size && holders.length > posts.size) {
    let best: { uid: string; i: number; d: number } | null = null;
    for (const h of holders) {
      if (posts.has(h.uid)) continue;
      for (const i of freeTiles) {
        const d = walk[i]!.get(posKey(h.pos!)) ?? 999;
        if (!best || d < best.d) best = { uid: h.uid, i, d };
      }
    }
    if (!best) break;
    posts.set(best.uid, line.cut[best.i]!);
    freeTiles.delete(best.i);
  }
  return { posts, cut: line.cut, inside: line.inside };
}

/**
 * Treasure hunt (story 9.8): who goes to which lock, who fetches which key. Greedy by walking distance around walls, stable order
 * (shortest way first, ties by unit id), each lock has at most one opener and each key at most one fetcher.
 * `lock`: unit uid -> the closest shut lock no other opener is closer to. `loot`: unit uid -> the key on the ground it fetches
 * (the unit with room in its bag that is closest by foot; those without a key themselves first).
 */
export function treasurePlan(data: GameData, s: BattleState, openable: Set<string>): { lock: Map<string, Pos>; loot: Map<string, Pos> } {
  const lock = new Map<string, Pos>();
  const loot = new Map<string, Pos>();
  const units = s.units.filter((o) => o.team === 'player' && active(o) && o.pos);
  const canOpen = (o: BattleUnit) => isScout(data, s, o) || !!hasKey(data, o);
  const locks = s.objects.filter((o) => openable.has(o.id));
  const pairs: Array<{ d: number; uid: string; id: string; at: Pos }> = [];
  for (const l of locks) {
    const field = walkDistances(data, s, [l.at]);
    for (const u of units) {
      const d = canOpen(u) ? field.get(posKey(u.pos!)) : undefined;
      if (d !== undefined) pairs.push({ d, uid: u.uid, id: l.id, at: l.at });
    }
  }
  const order = (a: { d: number; uid: string; id: string }, b: { d: number; uid: string; id: string }) =>
    a.d - b.d || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : a.id < b.id ? -1 : 1);
  const takenLocks = new Set<string>();
  for (const p of pairs.sort(order)) {
    if (lock.has(p.uid) || takenLocks.has(p.id)) continue;
    lock.set(p.uid, p.at);
    takenLocks.add(p.id);
  }
  // openers left over (more keys than locks) head for the closest lock all the same
  for (const p of pairs) if (!lock.has(p.uid)) lock.set(p.uid, p.at);
  const keys = s.loot.filter((l) => itemDef(data, l.item).use?.open);
  const fetchers = units.filter((o) => !o.acted);
  const fetched = new Set<number>();
  // keys already in the company's bags count first: loot is only fetched while the charges in hand fall short of the locks still shut
  const inHand = units.reduce((n, o) => n + (isScout(data, s, o) ? locks.length : o.bag.reduce((m, i) => m + (itemDef(data, i).use?.open ? (i.charges ?? 1) : 0), 0)), 0);
  let need = locks.length - inHand;
  for (const round of [false, true]) {
    const found: Array<{ d: number; uid: string; id: string; i: number }> = [];
    keys.forEach((k, i) => {
      const field = walkDistances(data, s, [k.at]);
      for (const u of fetchers) {
        const d = canOpen(u) === round ? field.get(posKey(u.pos!)) : undefined;
        if (d !== undefined) found.push({ d, uid: u.uid, id: String(i), i });
      }
    });
    for (const p of found.sort(order)) {
      if ((round && need <= 0) || loot.has(p.uid) || fetched.has(p.i)) continue;
      need--;
      loot.set(p.uid, keys[p.i]!.at);
      fetched.add(p.i);
    }
  }
  return { lock, loot };
}

/** A visit or talk this unit can do this turn without stepping into more than `maxDanger` threats. `chests`: the chests of a treasure hunt it may open. */
function errand(data: GameData, s: BattleState, u: BattleUnit, dests: Pos[], danger: Map<string, number>, maxDanger: number, chests?: Set<string>): Command | null {
  for (const p of dests) {
    const d = danger.get(posKey(p)) ?? 0;
    for (const o of availableActions(data, s, u, p)) {
      // story 4.8: a scout opens the chest from next to it, a unit with a key stands on it
      if (chests && o.object && chests.has(o.object) && d <= maxDanger) {
        if (o.kind === 'open') return { type: 'act', unit: u.uid, to: p, action: { kind: 'open', object: o.object } };
        if (o.kind === 'chest') return { type: 'act', unit: u.uid, to: p, action: { kind: 'chest' } };
        // story 9.8: a closed door is a lock of the hunt as well (a scout opens it from next to it, a unit with a key from next to it)
        if (o.kind === 'door') return { type: 'act', unit: u.uid, to: p, action: { kind: 'door', object: o.object } };
      }
      if (o.kind === 'visit' && d <= maxDanger) return { type: 'act', unit: u.uid, to: p, action: { kind: 'visit' } };
      // talking turns the foe at once, so its own threat does not count
      if (o.kind === 'talk' && o.targets?.[0] && d <= maxDanger + 1)
        return { type: 'act', unit: u.uid, to: p, action: { kind: 'talk', target: o.targets[0] } };
    }
  }
  return null;
}

/**
 * Picks a command for the player side (simulator / tests), playing like a careful human:
 * visit villages and talk to recruitable foes, heal when low, attack the best target without walking
 * into crowds, Kael walks to reach/seize goals, protect units that must survive. Deterministic.
 */
export function autoCommand(data: GameData, s: BattleState): Command {
  const map = data.maps[s.mapId]!;
  const v = map.objectives.victory;
  const goal = v.type === 'reach' || v.type === 'seize' || v.type === 'escape' ? areaTiles(v.area) : null;
  const danger = dangerCounts(data, s);
  const enemies = s.units.filter((o) => o.team === 'enemy' && active(o) && o.pos);
  const villages = s.objects.filter((o) => o.type === 'village' && o.state === 'closed').map((o) => o.at);
  const recruitable = (u: BattleUnit) =>
    enemies.filter((o) => o.recruit && (o.recruit.by === 'any' || o.recruit.by.includes(u.id))).map((o) => o.pos!);
  // story 4.8: the chests of a treasure hunt still shut, and the escort NPC with the radius it follows within
  const openable =
    v.type === 'treasure'
      ? new Set([...v.chests, ...s.objects.filter((o) => o.type === 'door').map((o) => o.id)].filter((id) => s.objects.some((o) => o.id === id && o.state === 'closed')))
      : undefined;
  const npc = v.type === 'escort' ? s.units.find((o) => o.id === v.unit && active(o) && o.pos) : undefined;
  const defended = v.type === 'defend' ? s.units.find((o) => (o.id === v.unit || o.uid === v.unit) && active(o) && o.pos) : undefined;
  const line = holdLine(data, s, defended, enemies);
  const plan0 = openable?.size ? treasurePlan(data, s, openable) : undefined;
  // downed allies of the company: a careful player carries them off before they bleed out (Standard death mode)
  const downedAllies = s.units.filter((o) => o.team === 'player' && o.downed && o.pos && !o.gone);
  const rescuer = (() => {
    if (!downedAllies.length) return undefined;
    const spot = downedAllies[0]!.pos!;
    return s.units
      .filter((o) => o.team === 'player' && active(o) && o.pos && !o.acted && !o.flags.includes('mustSurvive'))
      .sort((a, b) => dist(a.pos!, spot) - dist(b.pos!, spot) || (a.uid < b.uid ? -1 : 1))[0]?.uid;
  })();
  for (const u of s.units) {
    if (u.team !== 'player' || !active(u) || u.acted || !u.pos) continue;
    const reach = reachable(data, s, u);
    let dests = destinations(s, u, reach);
    const vip = u.flags.includes('mustSurvive');
    const st = computeStats(data, u, { state: s });
    const hpPct = (u.hp * 100) / st.maxHp;
    const isGoalUnit =
      goal && (v.type !== 'reach' || !v.unit || v.unit === u.id) && (v.type !== 'seize' || u.flags.includes('seizer'));
    // the lord leaves last: until then he walks up to the exit but keeps its tiles free for the others
    if (isGoalUnit && v.type === 'escape' && mustStayForRest(s, u)) {
      const exit = new Set(goal.map(posKey));
      dests = dests.filter((p) => !exit.has(posKey(p)));
    }
    if (isGoalUnit) {
      const onGoal = dests.find((p) => goal.some((g) => posKey(g) === posKey(p)));
      if (onGoal) {
        const action = v.type === 'seize' ? { kind: 'seize' as const } : v.type === 'escape' ? { kind: 'escape' as const } : { kind: 'wait' as const };
        return { type: 'act', unit: u.uid, to: onGoal, action };
      }
    }
    // rescue: whoever can carry a downed ally off this turn does so, unless the tile is too dangerous or it would leave the line
    if (downedAllies.length) {
      const risk = vip ? 0 : data.balance.ai.rescueMaxDanger;
      const held = line?.posts.get(u.uid);
      const fits = (to: Pos) => !line || (held ? posKey(to) === posKey(held) : line.inside.has(posKey(to)));
      let pick: { to: Pos; danger: number; action: Command & { type: 'act' } } | null = null;
      for (const p of dests) {
        const d = danger.get(posKey(p)) ?? 0;
        if (d > risk || !fits(p) || (pick && d >= pick.danger)) continue;
        for (const o of availableActions(data, s, u, p)) {
          const target = o.kind === 'rescue' || o.kind === 'farRescue' ? o.targets?.[0] : undefined;
          if (!target) continue;
          pick = {
            to: p,
            danger: d,
            action: { type: 'act', unit: u.uid, to: p, action: o.kind === 'rescue' ? { kind: 'rescue', target } : { kind: 'farRescue', target } },
          };
          break;
        }
      }
      if (pick) return pick.action;
    }
    const job = line ? null : errand(data, s, u, dests, danger, vip ? 0 : 2, openable);
    if (job) return job;
    const potion = u.bag.find((i) => itemDef(data, i).use?.heal && (i.charges ?? 1) > 0);
    if (hpPct < 50 && potion) {
      const safe = approach(s, u, dests, [u.pos], danger, 0);
      return { type: 'act', unit: u.uid, to: safe, action: { kind: 'item', item: potion.uid } };
    }
    const spare = new Set(recruitable(u).map(posKey));
    const post = line?.posts.get(u.uid);
    // holding the line: the holders fight only from their tile, the rest from behind the line
    const placed = (to: Pos) => (!line ? true : post ? posKey(to) === posKey(post) : line.inside.has(posKey(to)));
    const plans = attackPlans(data, s, u, dests)
      .filter((p) => placed(p.to))
      .filter((p) => p.action.kind !== 'attack' || !spare.has(posKey(s.units.find((o) => o.uid === (p.action as { target: string }).target)!.pos!)))
      .map((p) => ({ ...p, score: p.score - (danger.get(posKey(p.to)) ?? 0) * (vip || hpPct < 60 ? 12 : 4) }))
      .sort((a, b) => b.score - a.score);
    const plan = plans.find((p) => p.score > 0);
    if (plan && !(isGoalUnit && plan.score < 30)) return { type: 'act', unit: u.uid, to: plan.to, action: plan.action };
    const ward = defended;
    // the unit closest to an unvisited village heads there; a unit that can recruit seeks its target
    const nearestTo = (p: Pos) =>
      s.units
        .filter((o) => o.team === 'player' && active(o) && o.pos && !o.acted)
        .sort((a, b) => dist(a.pos!, p) - dist(b.pos!, p))[0]?.uid;
    // defend: while a foe is within `ai.wardGuardRadius` of the ward, the company meets it there instead of running errands
    const guarding = !!ward && enemies.some((o) => dist(o.pos!, ward.pos!) <= data.balance.ai.wardGuardRadius);
    // treasure (story 9.8): a key dropped by a foe lies on the ground until somebody steps on it; the closest unit with room in its bag fetches it
    // (a full bag sends the pick-up to the convoy, out of reach during the battle)
    const keyLoot = openable ? s.loot.filter((l) => itemDef(data, l.item).use?.open).map((l) => l.at) : [];
    const fetchAt = plan0?.loot.get(u.uid);
    const errands = guarding
      ? []
      : [...villages.filter((p) => nearestTo(p) === u.uid), ...(plan0 ? (fetchAt ? [fetchAt] : []) : keyLoot.filter((p) => nearestTo(p) === u.uid)), ...recruitable(u)];
    // treasure: whoever can open a chest heads for the lock the allocation gave it
    const lockAt = plan0?.lock.get(u.uid);
    const keys = lockAt ? [lockAt] : [];
    const nearWard = guarding ? [...enemies].sort((a, b) => dist(a.pos!, ward!.pos!) - dist(b.pos!, ward!.pos!)).map((o) => o.pos!) : [];
    // one healthy unit (the closest) walks to a downed ally when nothing more urgent calls
    const fetch = rescuer === u.uid && hpPct >= 60 ? downedAllies.map((o) => o.pos!) : [];
    // treasure, no foe left: whoever has no key, no room and no errand walks on towards the locks and keys still open, but not onto the tiles next to a lock
    const treasureIdle = openable ? s.objects.filter((o) => openable.has(o.id)).map((o) => o.at) : [];
    const idleHunt = !!openable && !enemies.length && treasureIdle.length > 0;
    const targets = isGoalUnit
      ? goal!
      : errands.length
        ? errands
        : keys.length
          ? keys
          : nearWard.length
            ? [ward!.pos!]
            : fetch.length
              ? fetch
              : ward
                ? [ward.pos!]
                : idleHunt
                  ? treasureIdle
                  : enemies.map((o) => o.pos!);
    if (line) {
      // the line: a holder walks to its tile, everybody else stands as close behind the line as it can (a tile of the line is for its holder)
      const reserved = new Set(line.cut.map(posKey));
      const free = dests.filter((p) => !reserved.has(posKey(p)) || (post && posKey(p) === posKey(post)));
      const behind = free.filter((p) => line.inside.has(posKey(p)));
      const aim = post ? [post] : line.cut;
      const to = approach(s, u, post ? free : behind.length ? behind : free, aim, danger, 99, walkDistances(data, s, aim));
      return { type: 'act', unit: u.uid, to, action: { kind: 'wait' } };
    }
    if (npc && v.type === 'escort') {
      // escort: walk to the exit but end the turn within the radius the NPC follows in; too far off, walk back to it
      const radius = data.balance.ai.followRadius;
      const close = dests.filter((p) => dist(p, npc.pos!) <= radius);
      const lead = close.length ? approach(s, u, close, areaTiles(v.area), danger, vip || hpPct < 60 ? 0 : 1) : null;
      const to = lead ?? approach(s, u, dests, [npc.pos!], danger, 1);
      return { type: 'act', unit: u.uid, to, action: { kind: 'wait' } };
    }
    let maxDanger = guarding && hpPct >= 60 ? (vip ? 1 : 2) : errands.length && hpPct >= 60 ? 1 : vip || hpPct < 60 ? 0 : isGoalUnit ? 2 : 1;
    let aim = targets.length ? targets : [u.pos];
    let field: Map<string, number> | undefined;
    const hunting = !isGoalUnit && !errands.length && !keys.length && !ward;
    // siege: the foes that are left never come and the victory needs them down; whoever is healthy takes the risk of their reach
    const siege = hunting && enemies.length > 0 && (v.type === 'rout' || v.type === 'boss') && enemies.every((o) => idleFoe(data, s, o));
    if (siege) {
      if (!vip && hpPct >= 60) maxDanger = Infinity;
      field = walkField(data, s, u, aim, false);
    }
    if (targets.length && s.objects.some((o) => o.type === 'door' && o.state === 'closed') && !walkField(data, s, u, targets, false).has(posKey(u.pos))) {
      // nothing the unit heads for is reachable on foot: a closed door may be in the way
      const open = walkField(data, s, u, targets, true);
      const door = open.has(posKey(u.pos)) ? doorOnTheWay(s, open, u.pos) : null;
      if (door) {
        const canOpen = (o: BattleUnit) => isScout(data, s, o) || !!hasKey(data, o);
        const company = s.units.some((o) => o.team === 'player' && active(o) && o.pos && canOpen(o));
        const keyAt = s.loot.filter((l) => itemDef(data, l.item).use?.open).map((l) => l.at);
        if (canOpen(u)) {
          for (const p of dests) {
            if ((danger.get(posKey(p)) ?? 0) > maxDanger) continue;
            const o = availableActions(data, s, u, p).find((a) => (a.kind === 'open' || a.kind === 'door') && a.object === door.id);
            if (o) return { type: 'act', unit: u.uid, to: p, action: o.kind === 'open' ? { kind: 'open', object: door.id } : { kind: 'door', object: door.id } };
          }
          aim = [door.at];
          field = walkField(data, s, u, aim, false);
        } else if (!company && keyAt.length) {
          // a key lies on the ground (a thief dropped it): somebody picks it up
          aim = keyAt;
          field = walkField(data, s, u, aim, false);
        } else {
          // the others gather in front of the door and leave the tiles next to it to the one who opens it
          field = open;
          if (company) {
            const next = new Set(neighbors(door.at).map(posKey));
            const rest = dests.filter((p) => !next.has(posKey(p)));
            if (rest.length) dests = rest;
          }
        }
      }
    }
    // treasure hunts in rooms (story 9.8): steps around walls, closed doors counted open
    field ??= openable && targets.length ? walkDistances(data, s, targets) : undefined;
    if (idleHunt && !isGoalUnit && !errands.length && !keys.length && !ward) {
      const blocked = new Set([...treasureIdle, ...keyLoot, ...treasureIdle.flatMap(neighbors)].map(posKey));
      const rest = dests.filter((p) => !blocked.has(posKey(p)));
      if (rest.length) dests = rest;
    }
    const to = approach(s, u, dests, aim, danger, maxDanger, field);
    return { type: 'act', unit: u.uid, to, action: { kind: 'wait' } };
  }
  return { type: 'endPhase' };
}

/** Plays a battle to the end with autoCommand; returns the final state and the command log. */
export function autoplay(
  data: GameData,
  start: BattleState,
  maxCommands = 2000,
): { state: BattleState; log: Command[]; events: GameEvent[] } {
  let s = start;
  const log: Command[] = [];
  const events: GameEvent[] = [];
  for (let i = 0; i < maxCommands && !s.outcome; i++) {
    const cmd = autoCommand(data, s);
    const r = applyCommand(data, s, cmd);
    s = r.state;
    log.push(cmd);
    events.push(...r.events);
    if (s.turn > 40) break;
  }
  return { state: s, log, events };
}
