import type { GameData, Pos } from '../defs';
import type { GameEvent } from '../events';
import { availableActions, hasKey, mustStayForRest } from '../battle/actions';
import { applyCommand } from '../battle/apply';
import type { Command } from '../battle/commands';
import { itemDef } from '../rules/items';
import { destinations, reachable, threatTiles } from '../rules/movement';
import { isScout } from '../rules/scout';
import { computeStats } from '../rules/stats';
import type { BattleState, BattleUnit } from '../state';
import { active, areaTiles, dist, inBounds, neighbors, posKey } from '../util';
import { attackPlans } from './ai';
import { wardLine } from './wardLine';

function dangerCounts(data: GameData, s: BattleState): Map<string, number> {
  const m = new Map<string, number>();
  for (const o of s.units) {
    if (o.team !== 'enemy' || !active(o)) continue;
    const hold = o.ai && (o.ai.profile === 'hold' || o.ai.profile === 'guard' || (o.ai.profile === 'trigger' && !o.ai.awake));
    for (const k of threatTiles(data, s, o, !!hold)) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
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

function approach(
  s: BattleState,
  u: BattleUnit,
  dests: Pos[],
  targets: Pos[],
  danger: Map<string, number>,
  maxDanger: number,
  walk?: Map<string, number>,
): Pos {
  let best = u.pos!;
  let bestScore = Infinity;
  for (const p of dests) {
    const d = danger.get(posKey(p)) ?? 0;
    if (d > maxDanger) continue;
    const near = walk ? (walk.get(posKey(p)) ?? 999) : Math.min(...targets.map((t) => dist(p, t)), 999);
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
    const nearestTo = (p: Pos, needsRoom = false) =>
      s.units
        .filter((o) => o.team === 'player' && active(o) && o.pos && !o.acted && (!needsRoom || o.bag.length < data.balance.bag.size))
        .sort((a, b) => dist(a.pos!, p) - dist(b.pos!, p))[0]?.uid;
    // defend: while a foe is within `ai.wardGuardRadius` of the ward, the company meets it there instead of running errands
    const guarding = !!ward && enemies.some((o) => dist(o.pos!, ward.pos!) <= data.balance.ai.wardGuardRadius);
    // treasure (story 9.8): a key dropped by a foe lies on the ground until somebody steps on it; the closest unit with room in its bag fetches it
    // (a full bag sends the pick-up to the convoy, out of reach during the battle)
    const keyLoot = openable ? s.loot.filter((l) => itemDef(data, l.item).use?.open).map((l) => l.at) : [];
    const errands = guarding ? [] : [...villages.filter((p) => nearestTo(p) === u.uid), ...keyLoot.filter((p) => nearestTo(p, true) === u.uid), ...recruitable(u)];
    // treasure: whoever can open a chest heads for the closest one still shut
    const keys = openable && openable.size && (isScout(data, s, u) || hasKey(data, u)) ? s.objects.filter((o) => openable.has(o.id)).map((o) => o.at) : [];
    const nearWard = guarding ? [...enemies].sort((a, b) => dist(a.pos!, ward!.pos!) - dist(b.pos!, ward!.pos!)).map((o) => o.pos!) : [];
    const targets = isGoalUnit ? goal! : errands.length ? errands : keys.length ? keys : nearWard.length ? [ward!.pos!] : ward ? [ward.pos!] : enemies.map((o) => o.pos!);
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
    const maxDanger = guarding && hpPct >= 60 ? (vip ? 1 : 2) : errands.length && hpPct >= 60 ? 1 : vip || hpPct < 60 ? 0 : isGoalUnit ? 2 : 1;
    const to = approach(s, u, dests, targets.length ? targets : [u.pos], danger, maxDanger, openable && targets.length ? walkDistances(data, s, targets) : undefined);
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
