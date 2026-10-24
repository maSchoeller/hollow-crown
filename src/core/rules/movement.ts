import { CoreInvariantError } from '../errors';
import type { GameData, Pos } from '../defs';
import type { BattleState, BattleUnit } from '../state';
import { active, inBounds, isHostile, neighbors, onMap, posKey, samePos, terrainAt, unitAt } from '../util';
import { usableStaves, usableWeapons, weaponProfile } from './items';
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

/** Dijkstra over the grid. Allies can be passed, hostile units (also downed ones) block. */
export function reachable(data: GameData, s: BattleState, unit: BattleUnit, from?: Pos, mov?: number): Map<string, ReachNode> {
  const start = from ?? unit.pos;
  const out = new Map<string, ReachNode>();
  if (!start) return out;
  const st = computeStats(data, unit, { state: s, pos: start });
  const budget = mov ?? st.mov;
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
      const prev = out.get(k);
      if (prev && prev.cost <= total) continue;
      const node = { cost: total, prev: posKey(cur.pos), pos: n };
      out.set(k, node);
      open.push(node);
    }
  }
  return out;
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
