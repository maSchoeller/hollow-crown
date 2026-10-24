import type { GameData, Pos, Team } from '../defs';
import type { GameEvent } from '../events';
import { attackTargets, staffTargets } from '../battle/actions';
import { applyAct } from '../battle/apply';
import type { Action } from '../battle/commands';
import { mapOf, runTriggers } from '../battle/objectives';
import { expectedDamage, forecast } from '../rules/combat';
import { holdZone, moveCost, destinations, reachable, threatTiles } from '../rules/movement';
import { computeStats } from '../rules/stats';
import { itemDef } from '../rules/items';
import type { BattleState, BattleUnit } from '../state';
import { active, areaTiles, dist, getUnit, inBounds, isHostile, neighbors, onMap, posKey, samePos, terrainAt } from '../util';

interface Plan {
  to: Pos;
  action: Action;
  score: number;
}

/**
 * Multi-source distance field (movement cost, ignoring units) – used to walk towards goals. With `avoid` (hold zone tiles,
 * story 2.4) a tile of the set is never passed through: it may start a way (the unit stands there) or end one (a goal).
 */
function distanceField(data: GameData, s: BattleState, u: BattleUnit, goals: Pos[], avoid?: Set<string>): Map<string, number> {
  const out = new Map<string, number>();
  const open: Array<[Pos, number]> = goals.filter((g) => inBounds(s, g)).map((g) => [g, 0]);
  for (const [g] of open) out.set(posKey(g), 0);
  while (open.length) {
    open.sort((a, b) => a[1] - b[1]);
    const [p, c] = open.shift()!;
    if (avoid && c > 0 && avoid.has(posKey(p))) continue;
    for (const n of neighbors(p)) {
      // cost of stepping from n into p (symmetric enough for grids)
      const step = moveCost(data, s, u, p);
      const enter = moveCost(data, s, u, n);
      if (enter === null) continue;
      const total = c + (step ?? 1);
      const k = posKey(n);
      if ((out.get(k) ?? Infinity) <= total) continue;
      out.set(k, total);
      open.push([n, total]);
    }
  }
  return out;
}

function hostileUnits(s: BattleState, u: BattleUnit): BattleUnit[] {
  return s.units.filter((o) => onMap(o) && isHostile(o.team, u.team));
}

/** The goal tile the field leads to from `from` (follows the falling values down to 0). */
function descendToGoal(field: Map<string, number>, from: Pos): Pos | null {
  let p = from;
  let v = field.get(posKey(p));
  while (v !== undefined && v > 0) {
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
  return v === 0 ? p : null;
}

/**
 * Halten (story 2.4): if a way around the hold zones of hostile vanguards costs at most `classActions.hold.detourMax` more
 * movement than the shortest way to the same goal tile, the AI takes the way around (returned field, with the hold tiles
 * it must not stop on); otherwise it walks in and is stopped there.
 */
function detourAround(data: GameData, s: BattleState, u: BattleUnit, field: Map<string, number>, hold: Set<string>): { field: Map<string, number>; skip: Set<string> } | null {
  const here = field.get(posKey(u.pos!));
  const goal = here === undefined ? null : descendToGoal(field, u.pos!);
  if (here === undefined || !goal) return null;
  const around = distanceField(data, s, u, [goal], hold);
  const way = around.get(posKey(u.pos!));
  if (way === undefined || way - here > data.balance.classActions.hold.detourMax) return null;
  const skip = new Set(hold);
  skip.delete(posKey(goal));
  return { field: around, skip };
}

export function bestApproach(data: GameData, s: BattleState, u: BattleUnit, goals: Pos[]): Pos | null {
  if (!goals.length || !u.pos) return null;
  let field = distanceField(data, s, u, goals);
  const reach = reachable(data, s, u);
  const hold = holdZone(data, s, u.team);
  let skip: Set<string> | undefined;
  if (hold.size) {
    const detour = detourAround(data, s, u, field, hold);
    if (detour) {
      field = detour.field;
      skip = detour.skip;
    }
  }
  let best: Pos | null = null;
  let bestVal = Infinity;
  let bestCost = Infinity;
  for (const p of destinations(s, u, reach)) {
    if (skip?.has(posKey(p))) continue;
    const v = field.get(posKey(p)) ?? Infinity;
    const c = reach.get(posKey(p))!.cost;
    if (v < bestVal || (v === bestVal && c < bestCost)) {
      best = p;
      bestVal = v;
      bestCost = c;
    }
  }
  if (!best || bestVal === Infinity) return null;
  return samePos(best, u.pos) ? null : best;
}

export function attackPlans(data: GameData, s: BattleState, u: BattleUnit, origins: Pos[], onlyTarget?: string): Plan[] {
  const diff = data.balance.difficulty[s.settings.difficulty];
  const w = data.balance.ai;
  const plans: Plan[] = [];
  const map = mapOf(data, s);
  const objectiveUnit = map.objectives.victory.type === 'defend' ? map.objectives.victory.unit : undefined;
  const danger = diff.aiDangerAware ? dangerMap(data, s, u) : undefined;
  for (const pos of origins) {
    const targets = attackTargets(data, s, u, pos);
    for (const [tid, weapons] of Object.entries(targets)) {
      if (onlyTarget && tid !== onlyTarget) continue;
      const t = getUnit(s, tid);
      if (t.downed && diff.aiFinishDowned === 'never') continue;
      for (const wid of weapons) {
        const f = forecast(data, s, u.uid, tid, wid, pos);
        const e = expectedDamage(f);
        let score = e.dealt + w.killChanceWeight * e.killChance - w.counterWeight * e.taken;
        const tCls = data.classes[t.classId]!;
        if (tCls.weaponGroups.includes('staff') || tCls.weaponGroups.includes('anima')) score += w.healerBonus;
        if (t.hp <= Math.min(...hostileUnits(s, u).filter(active).map((o) => o.hp))) score += w.lowestHpBonus;
        if (objectiveUnit && (t.id === objectiveUnit || t.uid === objectiveUnit)) score += w.objectiveBonus;
        if (t.downed) score = diff.aiFinishDowned === 'prefer' ? score + w.objectiveBonus : -1000 + score;
        const terr = data.terrain[terrainAt(s, pos)];
        score += ((terr?.def ?? 0) + (terr?.avoid ?? 0) / 10) * 0.5;
        if (danger) score -= (danger.get(posKey(pos)) ?? 0) * w.dangerPerAttacker;
        plans.push({ to: pos, action: { kind: 'attack', target: tid, weapon: wid }, score });
      }
    }
  }
  plans.sort((a, b) => b.score - a.score || a.to[1] - b.to[1] || a.to[0] - b.to[0]);
  // fallback rule on Normal: finish downed units only if nothing else is attackable
  return plans;
}

function dangerMap(data: GameData, s: BattleState, u: BattleUnit): Map<string, number> {
  const m = new Map<string, number>();
  for (const o of hostileUnits(s, u)) {
    if (!active(o)) continue;
    for (const k of threatTiles(data, s, o)) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function healPlan(data: GameData, s: BattleState, u: BattleUnit, origins: Pos[]): Plan | null {
  const below = data.balance.ai.supportHealBelowPercent;
  let best: Plan | null = null;
  for (const pos of origins) {
    for (const tid of staffTargets(data, s, u, pos)) {
      const t = getUnit(s, tid);
      const max = computeStats(data, t).maxHp;
      const pct = (t.hp * 100) / max;
      if (pct >= below) continue;
      const score = 100 - pct;
      if (!best || score > best.score) best = { to: pos, action: { kind: 'staff', target: tid }, score };
    }
  }
  return best;
}

function wake(s: BattleState, u: BattleUnit): void {
  const ai = u.ai!;
  if (ai.profile !== 'trigger' || ai.awake) return;
  const r = ai.radius ?? 3;
  const near = hostileUnits(s, u).some((o) => o.pos && u.pos && dist(o.pos, u.pos) <= r);
  if (near) {
    ai.awake = true;
    ai.profile = ai.then ?? 'aggressive';
  }
}

/** Decides and performs one unit's turn. */
function aiAct(data: GameData, s: BattleState, u: BattleUnit, events: GameEvent[]): void {
  if (!u.pos) return;
  const ai = u.ai ?? { profile: 'aggressive' as const };
  if (u.ai) wake(s, u);
  const profile = u.ai?.profile ?? ai.profile;
  const here: Pos[] = [u.pos];
  const reach = reachable(data, s, u);
  const all = destinations(s, u, reach);
  let plan: Plan | null;
  const act = (p: Plan | null) => {
    events.push({ t: 'aiTurn', unit: u.uid });
    if (p) applyAct(data, s, u, p.to, p.action, events);
    else applyAct(data, s, u, u.pos!, { kind: 'wait' }, events);
  };
  const potion = u.bag.find((i) => itemDef(data, i).use?.heal && (i.charges ?? 1) > 0);
  if (potion && u.hp * 100 < computeStats(data, u).maxHp * data.balance.ai.selfHealBelowPercent) {
    return act({ to: u.pos, action: { kind: 'item', item: potion.uid }, score: 0 });
  }
  switch (profile) {
    case 'trigger':
    case 'hold':
    case 'guard': {
      plan = attackPlans(data, s, u, here)[0] ?? null;
      if (!plan && data.classes[u.classId]!.weaponGroups.includes('staff')) plan = healPlan(data, s, u, here);
      return act(plan);
    }
    case 'support': {
      plan = healPlan(data, s, u, all) ?? attackPlans(data, s, u, here)[0] ?? null;
      return act(plan);
    }
    case 'raider': {
      const target = s.objects.find(
        (o) => o.type === 'village' && o.state === 'closed' && (!ai.target || o.id === ai.target),
      );
      const kill = attackPlans(data, s, u, all).find((p) => p.score > 40);
      if (kill) return act(kill);
      if (target && samePos(u.pos, target.at)) {
        target.state = 'razed';
        s.terrain[target.at[1] * s.width + target.at[0]] = 'ruins';
        events.push({ t: 'aiTurn', unit: u.uid });
        events.push({ t: 'razed', unit: u.uid, object: target.id });
        events.push({ t: 'terrain', at: target.at, terrain: 'ruins', cause: 'raze' });
        runTriggers(data, s, { kind: 'action', unit: u }, events);
        applyAct(data, s, u, u.pos, { kind: 'wait' }, events);
        return;
      }
      if (target) {
        if (reach.has(posKey(target.at)) && !s.units.some((o) => onMap(o) && samePos(o.pos, target.at))) {
          return act({ to: target.at, action: { kind: 'wait' }, score: 0 });
        }
        const to = bestApproach(data, s, u, [target.at]);
        return act(to ? { to, action: { kind: 'wait' }, score: 0 } : null);
      }
      break;
    }
    case 'flee': {
      const goals = ai.area ? areaTiles(ai.area) : [];
      const to = bestApproach(data, s, u, goals);
      if (to && ai.area && goals.some((g) => samePos(g, to))) {
        applyAct(data, s, u, to, { kind: 'wait' }, events);
        u.gone = 'escaped';
        events.push({ t: 'escaped', unit: u.uid });
        return;
      }
      return act(to ? { to, action: { kind: 'wait' }, score: 0 } : null);
    }
    case 'hunt': {
      const target = ai.target ? s.units.find((o) => (o.id === ai.target || o.uid === ai.target) && onMap(o)) : undefined;
      const plans = attackPlans(data, s, u, all);
      const onTarget = target ? plans.find((p) => p.action.kind === 'attack' && p.action.target === target.uid) : undefined;
      const kill = plans.find((p) => p.score > 40);
      plan = onTarget ?? kill ?? null;
      if (plan) return act(plan);
      if (target?.pos) {
        const to = bestApproach(data, s, u, neighbors(target.pos));
        return act(to ? { to, action: { kind: 'wait' }, score: 0 } : null);
      }
      break;
    }
    default:
      break;
  }
  // aggressive (and fallback)
  const plans = attackPlans(data, s, u, all);
  plan = plans.find((p) => p.score > -500) ?? plans[0] ?? null;
  if (plan) return act(plan);
  const goals = hostileUnits(s, u)
    .filter(active)
    .flatMap((o) => neighbors(o.pos!));
  const to = bestApproach(data, s, u, goals);
  act(to ? { to, action: { kind: 'wait' }, score: 0 } : null);
}

/** Runs a whole AI phase deterministically (concept/06 §7). Order is fixed at phase start. */
export function runAiPhase(data: GameData, s: BattleState, team: Team, events: GameEvent[]): void {
  const ready = s.units.filter((u) => u.team === team && active(u) && !u.acted);
  // units that can kill first, then by distance to the nearest hostile
  const scored = ready.map((u) => {
    const plans = attackPlans(data, s, u, destinations(s, u, reachable(data, s, u)));
    const canKill = plans.some((p) => p.action.kind === 'attack' && p.score > 40);
    const near = Math.min(
      ...hostileUnits(s, u)
        .filter((o) => o.pos)
        .map((o) => dist(o.pos!, u.pos!)),
      999,
    );
    return { u, canKill, near };
  });
  scored.sort(
    (a, b) => Number(b.canKill) - Number(a.canKill) || a.near - b.near || (a.u.uid < b.u.uid ? -1 : a.u.uid > b.u.uid ? 1 : 0),
  );
  for (const { u } of scored) {
    if (s.outcome) return;
    if (!active(u) || u.acted || u.team !== team) continue;
    aiAct(data, s, u, events);
  }
}
