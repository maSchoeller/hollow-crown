import { CoreInvariantError } from '../errors';
import type { MoveType, Pos } from '../defs';
import type { GameData } from '../gameData';
import type { BattleState, BattleUnit, ObjectState } from '../state';
import { active, dist, inBounds, isHostile, neighbors, onMap, posKey, samePos, terrainAt, unitAt } from '../util';
import { usableStaves, usableWeapons, weaponProfile } from './items';
import { ballistaRange, ballistasOf, canCrew, firesBallista } from './ballistaBase';
import { ladderBetween, laddersOf } from '../ladders';
import { classActionId } from './roles';
import { computeStats } from './stats';

export function terrainDef(data: GameData, s: BattleState, p: Pos) {
  const id = terrainAt(s, p);
  const t = data.terrain[id];
  if (!t) throw new CoreInvariantError('unknown_terrain', { id });
  return t;
}

/**
 * `s.levels` as a dense grid (-1 = the map says nothing), so that the path searches do not build a string key per step on a large map with a raised area
 * of hundreds of tiles. Derived and invisible: kept per `levels` object, which is never written to (an event puts a new one on the state).
 */
const levelGrids = new WeakMap<Record<string, number>, Int8Array>();

function levelGrid(s: BattleState, levels: Record<string, number>): Int8Array {
  let grid = levelGrids.get(levels);
  if (!grid) {
    grid = new Int8Array(s.width * s.height).fill(-1);
    for (const k in levels) {
      const comma = k.indexOf(',');
      grid[Number(k.slice(comma + 1)) * s.width + Number(k.slice(0, comma))] = levels[k]!;
    }
    levelGrids.set(levels, grid);
  }
  return grid;
}

/** Height level of a tile: what the map says for it, else what its terrain says. */
export function levelAt(data: GameData, s: BattleState, p: Pos): number {
  const own = s.levels && inBounds(s, p) ? levelGrid(s, s.levels)[p[1] * s.width + p[0]]! : -1;
  return own >= 0 ? own : (data.terrain[terrainAt(s, p)]?.level ?? 0);
}

/**
 * What the step between two neighbouring tiles costs a unit of this move type on top of entering the tile, as far as their levels
 * go (both ways): nothing on the same level or across one level with a connector on the lower tile (who may use a ramp or stairs
 * at all is its movement cost); `balance.elevation.climb` across a ladder the map leans against that edge (fix 2026-11-08);
 * null = the levels part them. Fliers (`freeMoveTypes`) need neither.
 */
export function levelStep(data: GameData, s: BattleState, a: Pos, b: Pos, moveType: MoveType): number | null {
  const la = levelAt(data, s, a);
  const lb = levelAt(data, s, b);
  if (la === lb || data.balance.elevation.freeMoveTypes.includes(moveType)) return 0;
  if (Math.abs(la - lb) !== 1) return null;
  const [low, high] = la < lb ? [a, b] : [b, a];
  if (data.terrain[terrainAt(s, low)]?.connector) return 0;
  if (!ladderBetween(laddersOf(data.maps, s.mapId), low, high)) return null;
  return data.balance.elevation.climb[moveType] ?? null;
}

/** Whether a unit of this move type can step between two neighbouring tiles as far as their levels go (both ways); see `levelStep`. */
export function levelsLink(data: GameData, s: BattleState, a: Pos, b: Pos, moveType: MoveType): boolean {
  return levelStep(data, s, a, b, moveType) !== null;
}

/** Movement cost of the step from `from` onto its neighbour `to`, a climb up or down a ladder included; null = this unit cannot make it. */
export function stepCost(data: GameData, s: BattleState, unit: BattleUnit, from: Pos, to: Pos, overrides?: Record<string, number>): number | null {
  if (!inBounds(s, to)) return null;
  const climb = levelStep(data, s, from, to, data.classes[unit.classId]!.moveType);
  if (climb === null) return null;
  const enter = moveCost(data, s, unit, to, overrides);
  return enter === null ? null : enter + climb;
}

/** Movement cost of entering tile p for this unit, whatever the level of the tile it comes from; null = impassable. */
export function moveCost(data: GameData, s: BattleState, unit: BattleUnit, p: Pos, overrides?: Record<string, number>): number | null {
  if (!inBounds(s, p)) return null;
  const id = terrainAt(s, p);
  if (overrides && overrides[id] !== undefined) return overrides[id]!;
  const cls = data.classes[unit.classId]!;
  return data.terrain[id]?.cost[cls.moveType] ?? null;
}

export interface ReachNode {
  cost: number;
  /** harmful tiles (`isHazard`) entered on the way here: among ways of the same cost the search keeps the one with the fewest */
  hazard: number;
  prev: string | null;
  pos: Pos;
}

/** A tile that hurts a unit entering it (`burningTileHit`): the path search walks around it when a way of the same cost exists. */
export const isHazard = (s: BattleState, p: Pos): boolean => terrainAt(s, p) === 'burning';

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
 * Of two ways of the same cost it keeps the one over fewer harmful tiles (`isHazard`); what is reachable and at what cost
 * does not depend on it, and on a map without such tiles the ways are the same as without the tie-breaker.
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
  // who stands where, once: a search asks for every tile, the list of units is long on a large map (first on the list wins, as in `unitAt`)
  const standing = new Map<number, BattleUnit>();
  for (const o of s.units) {
    if (!onMap(o)) continue;
    const i = o.pos![1] * s.width + o.pos![0];
    if (!standing.has(i)) standing.set(i, o);
  }
  out.set(posKey(start), { cost: 0, hazard: 0, prev: null, pos: start });
  const open: ReachNode[] = [{ cost: 0, hazard: 0, prev: null, pos: start }];
  while (open.length) {
    // the order leaves `hazard` out on purpose: tiles are found in the same order as without the tie-breaker (the AI breaks its own
    // ties by that order, so its play stays as it was); a way over fewer harmful tiles found later is queued again and passed on
    open.sort((a, b) => a.cost - b.cost || a.pos[1] - b.pos[1] || a.pos[0] - b.pos[0]);
    const cur = open.shift()!;
    for (const n of neighbors(cur.pos)) {
      const c = stepCost(data, s, unit, cur.pos, n, overrides);
      if (c === null) continue;
      const total = cur.cost + c;
      if (total > budget) continue;
      const occ = standing.get(n[1] * s.width + n[0]);
      if (occ && occ.uid !== unit.uid && isHostile(occ.team, unit.team) && !pass) continue;
      const k = posKey(n);
      const held = hold.has(k);
      if (held && occ && occ.uid !== unit.uid) continue;
      const hazard = cur.hazard + (isHazard(s, n) ? 1 : 0);
      const prev = out.get(k);
      if (prev && (prev.cost < total || (prev.cost === total && prev.hazard <= hazard))) continue;
      const node = { cost: total, hazard, prev: posKey(cur.pos), pos: n };
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
    const c = stepCost(data, s, unit, tiles[tiles.length - 1]!, p, st.skills.terrainCost);
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
  return new Map([[posKey(unit.pos), { cost: 0, hazard: 0, prev: null, pos: unit.pos }]]);
}

/** Nachsetzen (story 2.4): what the skirmisher may still walk right after its attack; null when the possibility is not open for it. */
export function pursueReach(data: GameData, s: BattleState, unit: BattleUnit): Map<string, ReachNode> | null {
  if (!s.pursue || s.pursue.unit !== unit.uid || !unit.pos || !active(unit)) return null;
  return reachable(data, s, unit, unit.pos, s.pursue.left);
}

/** Tiles the unit may end its move on (not occupied by another unit). */
export function destinations(s: BattleState, unit: BattleUnit, reach: Map<string, ReachNode>): Pos[] {
  const out: Pos[] = [];
  const taken = new Set<string>();
  for (const o of s.units) if (onMap(o) && o.uid !== unit.uid) taken.add(posKey(o.pos!));
  for (const [k, node] of reach) if (!taken.has(k)) out.push(node.pos);
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

/**
 * Whether an attack with this range can be made from `from` on `to`: the one rule for preview, resolution, counter, threat zones and AI.
 * A ranged weapon (reach of 2 or more) reaches `elevation.rangedBonus` further from above. A blow between neighbours lands
 * on the same level, or across one level when the lower one stands on a connector made for it (ramp, stairs), never up or down a ladder.
 * The level rule for a blow holds for no fight with a flier (`elevation.freeMoveTypes`) in it, on either side. `target`: who is struck,
 * by default whoever stands on `to`; pass it for a tile the target would only move to.
 */
export function canStrike(
  data: GameData,
  s: BattleState,
  unit: BattleUnit,
  from: Pos,
  to: Pos,
  range: readonly [number, number],
  target?: BattleUnit,
): boolean {
  const d = dist(from, to);
  if (d < range[0] || d > range[1] + data.balance.elevation.rangedBonus) return false;
  const lf = levelAt(data, s, from);
  const lt = levelAt(data, s, to);
  if (d > range[1] && (range[1] < 2 || lf <= lt)) return false;
  if (d !== 1 || lf === lt) return true;
  const flies = (u: BattleUnit) => data.balance.elevation.freeMoveTypes.includes(data.classes[u.classId]!.moveType);
  const struck = target ?? unitAt(s, to);
  if (flies(unit) || (struck && flies(struck))) return true;
  if (Math.abs(lf - lt) !== 1) return false;
  const connector = data.terrain[terrainAt(s, lf < lt ? from : to)]?.connector;
  return !!connector && data.balance.elevation.meleeConnectors.includes(connector);
}

/** The tiles an attack with this range can reach from `from`, against `target` if given, else against whoever stands there; see `canStrike`. */
export function strikeTiles(data: GameData, s: BattleState, unit: BattleUnit, from: Pos, range: readonly [number, number], target?: BattleUnit): Pos[] {
  // only a ranged weapon can gain reach from above, so a melee one looks at its own tiles alone
  const far = range[1] < 2 ? range[1] : range[1] + data.balance.elevation.rangedBonus;
  return tilesInRange(s, from, [range[0], far]).filter((p) => canStrike(data, s, unit, from, p, range, target));
}

/** Attack range of a weapon for a unit, including skill range bonuses (pro_far_shot) and `extraRange` (Zielen), capped by `rangeCap`. */
export function weaponRange(data: GameData, s: BattleState, unit: BattleUnit, weaponUid: string, extraRange = 0): [number, number] {
  const inst = [unit.equip.mainHand, ...unit.bag].find((i) => i?.uid === weaponUid);
  if (!inst) return [1, 1];
  const wp = weaponProfile(data, inst, s);
  const st = computeStats(data, unit, { state: s, ownWeapon: wp });
  // Scharfschütze (story 10.4): `rangeCap` limits the whole reach, Zielen included
  const max = Math.min(wp.range[1] + st.skills.rangeBonus + extraRange, Math.max(wp.range[1], st.skills.rangeCap));
  return [wp.range[0], max];
}

/** Union of min/max range over all usable weapons (or staves). */
export function combinedRange(data: GameData, s: BattleState, unit: BattleUnit, staves = false): [number, number] | null {
  const list = staves ? usableStaves(data, unit) : usableWeapons(data, unit);
  if (!list.length) return null;
  let lo = Infinity;
  let hi = -Infinity;
  for (const w of list) {
    const r = staves ? (weaponProfile(data, w, s).range) : weaponRange(data, s, unit, w.uid);
    lo = Math.min(lo, r[0]);
    hi = Math.max(hi, r[1]);
  }
  return [lo, hi];
}

/** All tiles the unit can attack this turn (move + range) – used for the red overlay and danger zones. `target`: for a unit that might step onto them. */
export function threatTiles(data: GameData, s: BattleState, unit: BattleUnit, ignoreMove = false, target?: BattleUnit): Set<string> {
  const out = new Set<string>();
  if (!unit.pos || !active(unit) || waitsToJoin(unit)) return out;
  const range = combinedRange(data, s, unit);
  const siege = ballistasOf(s).length > 0;
  // one path search for the weapons and the ballistas (story 11.6)
  const dests = !ignoreMove && (range || siege) ? destinations(s, unit, reachable(data, s, unit)) : undefined;
  if (range) {
    const origins = dests ?? [unit.pos];
    for (const o of origins) for (const t of strikeTiles(data, s, unit, o, range, target)) out.add(posKey(t));
  }
  // a crew beside a ballista reaches what the ballista reaches (story 11.6)
  if (siege)
    for (const c of crewSpots(data, s, unit, ignoreMove, dests)) for (const t of strikeTiles(data, s, unit, c.ballista.at, ballistaRange(data), target)) out.add(posKey(t));
  return out;
}

/**
 * Balliste (story 11.6): the tiles from which the unit would fire a ballista this turn, with the ballista: a neighbouring tile on
 * the ballista's own level. A foe fires with any waking profile but `flee` (`firesBallista`; none means aggressive): `hold` walks
 * to a ballista for it, the others only fire when they stand beside one already. A unit of the player may walk to one, unless
 * `ignoreMove`. `dests`: the unit's destinations when the caller has them already. Empty on a map without ballista. Shared by
 * the AI and the danger zone.
 */
export function crewSpots(data: GameData, s: BattleState, unit: BattleUnit, ignoreMove = false, dests?: Pos[]): Array<{ ballista: ObjectState; from: Pos }> {
  const list = ballistasOf(s);
  if (!list.length || !unit.pos || !canCrew(data, unit)) return [];
  // the AI moves every unit but the player's; a foe without a profile is aggressive (as in `aiAct`)
  const profile = unit.ai?.profile ?? (unit.team === 'player' ? undefined : 'aggressive');
  if (profile !== undefined && !firesBallista(profile)) return [];
  const walks = profile === undefined ? !ignoreMove : profile === 'hold';
  const origins = walks ? (dests ?? destinations(s, unit, reachable(data, s, unit))) : [unit.pos];
  const out: Array<{ ballista: ObjectState; from: Pos }> = [];
  for (const from of origins)
    for (const b of list) if (dist(from, b.at) === 1 && crewLevelFits(data, s, from, b.at)) out.push({ ballista: b, from });
  return out;
}

/** The crew stands on the level of the ballista (story 11.6), so the shot's reach and the crew's tile agree on the height. */
export const crewLevelFits = (data: GameData, s: BattleState, from: Pos, ballistaAt: Pos): boolean => levelAt(data, s, from) === levelAt(data, s, ballistaAt);

/** A foe on `hold` who can be talked over (Varek in N2, Ysolde in 1-4) strikes nobody until then; a blow against it is still countered. */
export const waitsToJoin = (u: Pick<BattleUnit, 'recruit' | 'ai'>): boolean => !!u.recruit && u.ai?.profile === 'hold';

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
