import { CoreInvariantError } from '../errors';
import type { GameData, Pos } from '../defs';
import type { BattleState, BattleUnit } from '../state';
import { active, dist, inBounds, isHostile, neighbors, onMap, posKey, samePos, terrainAt, unitAt } from '../util';
import { usableStaves, usableWeapons, weaponProfile } from './items';
import { classActionId } from './roles';
import { computeStats } from './stats';

export function terrainDef(data: GameData, s: BattleState, p: Pos) {
  const id = terrainAt(s, p);
  const t = data.terrain[id];
  if (!t) throw new CoreInvariantError('unknown_terrain', { id });
  return t;
}

/** Movement cost of entering tile p for this unit; null = impassable. */
export function moveCost(data: GameData, s: BattleState, unit: BattleUnit, p: Pos, overrides?: Record<string, number>): number | null {
  if (!inBounds(s, p)) return null;
  const id = terrainAt(s, p);
  if (overrides && overrides[id] !== undefined) return overrides[id]!;
  const cls = data.classes[unit.classId]!;
  return data.terrain[id]?.cost[cls.moveType] ?? null;
}

export interface ReachNode {
  cost: number;
  prev: string | null;
  pos: Pos;
}

/**
 * Halten (Vorkämpfer, story 2.4): the neighbour tiles of every active unit hostile to `team` whose class action is `hold`.
 * A unit of `team` that enters one of them ends its move there. Derived from the state, never stored.
 */
export function holdZone(data: GameData, s: BattleState, team: BattleUnit['team']): Set<string> {
  const out = new Set<string>();
  for (const o of s.units) {
    if (!active(o) || !o.pos || !isHostile(o.team, team) || classActionId(data, o, s) !== 'hold') continue;
    for (const n of neighbors(o.pos)) out.add(posKey(n));
  }
  return out;
}

/** The unit's movement points standing on `from` (default: where it is), buffs such as Anfeuern included. */
export function moveBudget(data: GameData, s: BattleState, unit: BattleUnit, from?: Pos): number {
  return computeStats(data, unit, { state: s, pos: from ?? unit.pos ?? undefined }).mov;
}

/**
 * Dijkstra over the grid. Allies can be passed, hostile units (also downed ones) block. Entering a tile of a hostile
 * hold zone ends the move there: the tile is reachable (normal cost) but nothing is explored behind it, and an occupied
 * one is neither passed nor entered. A unit that starts inside a zone moves freely; only entering counts.
 */
export function reachable(data: GameData, s: BattleState, unit: BattleUnit, from?: Pos, mov?: number): Map<string, ReachNode> {
  const start = from ?? unit.pos;
  const out = new Map<string, ReachNode>();
  if (!start) return out;
  const st = computeStats(data, unit, { state: s, pos: start });
  const budget = mov ?? st.mov;
  const hold = holdZone(data, s, unit.team);
  const overrides = st.skills.terrainCost;
  const pass = st.skills.moveThroughEnemies;
  out.set(posKey(start), { cost: 0, prev: null, pos: start });
  const open: ReachNode[] = [{ cost: 0, prev: null, pos: start }];
  while (open.length) {
    open.sort((a, b) => a.cost - b.cost || a.pos[1] - b.pos[1] || a.pos[0] - b.pos[0]);
    const cur = open.shift()!;
    for (const n of neighbors(cur.pos)) {
      const c = moveCost(data, s, unit, n, overrides);
      if (c === null) continue;
      const total = cur.cost + c;
      if (total > budget) continue;
      const occ = unitAt(s, n);
      if (occ && occ.uid !== unit.uid && isHostile(occ.team, unit.team) && !pass) continue;
      const k = posKey(n);
      const held = hold.has(k);
      if (held && occ && occ.uid !== unit.uid) continue;
      const prev = out.get(k);
      if (prev && prev.cost <= total) continue;
      const node = { cost: total, prev: posKey(cur.pos), pos: n };
      out.set(k, node);
      if (!held) open.push(node);
    }
  }
  return out;
}

/** A walk along a planned path (`walkPath`): the tiles really walked, their cost, and the foe that stopped it short, if any. */
export interface Walk {
  tiles: Pos[];
  cost: number;
  /** Hinterhalt (story 2.6): the walk ended before the end of the path because a foe stood in the way (`by`: its uid) */
  cut: { by: string } | null;
}

/**
 * Walks `unit` along the path the player planned (the UI plans it on what the player sees, so on a fog map it may lead through
 * a foe it does not see). The state alone decides what happens: the unit stops on the last free tile before a foe that
 * blocks the path or before a tile it may not pass (a hold zone it would enter on its way on, a tile a hostile hold
 * zone covers and an ally occupies), and `cut` names the foe. Returns null when the path is not a legal walk: it does not start
 * on the unit, a step is not to a neighbour, a tile is impassable, the cost exceeds the movement (`mov`, default the unit's), or the
 * end of an uncut walk is occupied. Replays need nothing but the command.
 */
export function walkPath(data: GameData, s: BattleState, unit: BattleUnit, path: Pos[], mov?: number): Walk | null {
  const start = unit.pos;
  if (!start || !path.length || !samePos(path[0], start)) return null;
  const st = computeStats(data, unit, { state: s, pos: start });
  const budget = mov ?? st.mov;
  const hold = holdZone(data, s, unit.team);
  const pass = st.skills.moveThroughEnemies;
  const tiles: Pos[] = [start];
  const costs: number[] = [0];
  let total = 0;
  let cut: Walk['cut'] = null;
  const holder = (p: Pos) =>
    s.units.find((o) => active(o) && o.pos && isHostile(o.team, unit.team) && classActionId(data, o, s) === 'hold' && dist(o.pos, p) === 1)?.uid ?? '';
  for (let i = 1; i < path.length && !cut; i++) {
    const p = path[i]!;
    if (dist(tiles[tiles.length - 1]!, p) !== 1 || !inBounds(s, p)) return null;
    const c = moveCost(data, s, unit, p, st.skills.terrainCost);
    if (c === null || total + c > budget) return null;
    const occ = unitAt(s, p);
    const foe = occ && occ.uid !== unit.uid && isHostile(occ.team, unit.team) && !pass;
    const held = hold.has(posKey(p));
    if (foe) {
      cut = { by: occ!.uid };
      break;
    }
    if (held && occ && occ.uid !== unit.uid) {
      cut = { by: holder(p) };
      break;
    }
    total += c;
    tiles.push(p);
    costs.push(total);
    // entering a hold zone ends the walk there (the same rule as in `reachable`); it only counts as a cut when the path went on
    if (held && i < path.length - 1) cut = { by: holder(p) };
  }
  // the unit ends on a free tile: back up over tiles allies stand on
  while (tiles.length > 1 && unitAt(s, tiles[tiles.length - 1]!)?.uid !== undefined && unitAt(s, tiles[tiles.length - 1]!)!.uid !== unit.uid) {
    if (!cut) return null;
    tiles.pop();
    costs.pop();
  }
  return { tiles, cost: costs[costs.length - 1]!, cut };
}

/** What the player may still walk this turn: the unit's own tile once it has moved (trade, convoy), otherwise its full reach. */
export function reachNow(data: GameData, s: BattleState, unit: BattleUnit): Map<string, ReachNode> {
  if (!unit.moved || !unit.pos) return reachable(data, s, unit);
  return new Map([[posKey(unit.pos), { cost: 0, prev: null, pos: unit.pos }]]);
}

/** Nachsetzen (story 2.4): what the skirmisher may still walk right after its attack; null when the possibility is not open for it. */
export function pursueReach(data: GameData, s: BattleState, unit: BattleUnit): Map<string, ReachNode> | null {
  if (!s.pursue || s.pursue.unit !== unit.uid || !unit.pos || !active(unit)) return null;
  return reachable(data, s, unit, unit.pos, s.pursue.left);
}

/** Tiles the unit may end its move on (not occupied by another unit). */
export function destinations(s: BattleState, unit: BattleUnit, reach: Map<string, ReachNode>): Pos[] {
  const out: Pos[] = [];
  for (const node of reach.values()) {
    const occ = unitAt(s, node.pos);
    if (!occ || occ.uid === unit.uid) out.push(node.pos);
  }
  return out;
}

export function pathTo(reach: Map<string, ReachNode>, target: Pos): Pos[] {
  const path: Pos[] = [];
  let k: string | null = posKey(target);
  while (k) {
    const n = reach.get(k);
    if (!n) return [];
    path.unshift(n.pos);
    k = n.prev;
  }
  return path;
}

export function tilesInRange(s: BattleState, from: Pos, range: [number, number]): Pos[] {
  const out: Pos[] = [];
  for (let dy = -range[1]; dy <= range[1]; dy++)
    for (let dx = -range[1]; dx <= range[1]; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d < range[0] || d > range[1]) continue;
      const p: Pos = [from[0] + dx, from[1] + dy];
      if (inBounds(s, p)) out.push(p);
    }
  return out;
}

/** Attack range of a weapon for a unit, including skill range bonuses (longshot) and `extraRange` (Zielen). */
export function weaponRange(data: GameData, s: BattleState, unit: BattleUnit, weaponUid: string, extraRange = 0): [number, number] {
  const inst = [unit.equip.mainHand, ...unit.bag].find((i) => i?.uid === weaponUid);
  if (!inst) return [1, 1];
  const wp = weaponProfile(data, inst);
  const st = computeStats(data, unit, { state: s, ownWeapon: wp });
  return [wp.range[0], wp.range[1] + st.skills.rangeBonus + extraRange];
}

/** Union of min/max range over all usable weapons (or staves). */
export function combinedRange(data: GameData, s: BattleState, unit: BattleUnit, staves = false): [number, number] | null {
  const list = staves ? usableStaves(data, unit) : usableWeapons(data, unit);
  if (!list.length) return null;
  let lo = Infinity;
  let hi = -Infinity;
  for (const w of list) {
    const r = staves ? (weaponProfile(data, w).range) : weaponRange(data, s, unit, w.uid);
    lo = Math.min(lo, r[0]);
    hi = Math.max(hi, r[1]);
  }
  return [lo, hi];
}

/** All tiles the unit can attack this turn (move + range) – used for the red overlay and danger zones. */
export function threatTiles(data: GameData, s: BattleState, unit: BattleUnit, ignoreMove = false): Set<string> {
  const out = new Set<string>();
  if (!unit.pos || !active(unit)) return out;
  const range = combinedRange(data, s, unit);
  if (!range) return out;
  const origins = ignoreMove ? [unit.pos] : destinations(s, unit, reachable(data, s, unit));
  for (const o of origins) for (const t of tilesInRange(s, o, range)) out.add(posKey(t));
  return out;
}

/** Danger zone: union of threat tiles of all active units hostile to `team`. */
export function dangerZone(data: GameData, s: BattleState, team: BattleUnit['team'], only?: string[]): Set<string> {
  const out = new Set<string>();
  for (const u of s.units) {
    if (!active(u) || !isHostile(u.team, team)) continue;
    if (only && !only.includes(u.uid)) continue;
    const holds = u.ai && (u.ai.profile === 'hold' || u.ai.profile === 'guard');
    for (const k of threatTiles(data, s, u, !!holds)) out.add(k);
  }
  return out;
}

export function isOccupied(s: BattleState, p: Pos, except?: string): boolean {
  return s.units.some((u) => onMap(u) && samePos(u.pos, p) && u.uid !== except);
}
