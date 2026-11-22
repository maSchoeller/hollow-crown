/**
 * What the board explains about the ground (story 16.11): the terrain lens (which effect a tile has for a move type), the effects
 * of a tile for the tile card, and the costs the cost marks and the "noch n" pill show. Costs come from `moveCost` / `moveCostOf` /
 * `reachable` in `movement.ts`, the same lookups the path search uses, never from a copy of `terrain.yaml`. Pure: no DOM, no state written.
 */
import type { MoveType, Pos } from '../defs';
import type { GameData } from '../gameData';
import type { BattleState, BattleUnit } from '../state';
import { posKey, terrainAt } from '../util';
import { isHazardTerrain, moveBudget, moveCost, moveCostOf, type ReachNode } from './movement';
import { computeStats } from './stats';

/** Effect of a tile for the lens: protection, slow, fast, damage on entering, closed. Draw order = this order. */
export type LensKind = 'cover' | 'slow' | 'fast' | 'harm' | 'blocked';
export const LENS_KINDS: readonly LensKind[] = ['cover', 'slow', 'fast', 'harm', 'blocked'];

/**
 * The effects of terrain `terrainId` for a move type (default on foot), at most two in the fixed order of `LENS_KINDS`; closed excludes the others.
 * Protection = defense or avoid above 0, slow = cost above 1, fast = cost below 1 (road, bridge), damage = harmful tile (`isHazardTerrain`).
 * No effect = neutral (empty list).
 */
export function lensKinds(data: GameData, terrainId: string, moveType: MoveType = 'foot'): LensKind[] {
  const t = data.terrain[terrainId];
  if (!t) return [];
  const cost = moveCostOf(data, terrainId, moveType);
  if (cost === null) return ['blocked'];
  const out: LensKind[] = [];
  if (t.def > 0 || t.avoid > 0) out.push('cover');
  if (cost > 1) out.push('slow');
  if (cost < 1) out.push('fast');
  if (isHazardTerrain(terrainId)) out.push('harm');
  return out.slice(0, 2);
}

/** The lens kinds of every tile of the map (neutral tiles get an empty list), in tile order. */
export function lensTiles(data: GameData, s: BattleState, moveType: MoveType = 'foot'): Array<[Pos, LensKind[]]> {
  const kinds = new Map<string, LensKind[]>();
  const out: Array<[Pos, LensKind[]]> = [];
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      const id = terrainAt(s, [x, y]);
      let k = kinds.get(id);
      if (!k) kinds.set(id, (k = lensKinds(data, id, moveType)));
      out.push([[x, y], k]);
    }
  }
  return out;
}

/** The kinds that occur in `tiles`, in legend order: the legend names only what the map has. */
export function lensPresent(tiles: ReadonlyArray<readonly [Pos, readonly LensKind[]]>): LensKind[] {
  const seen = new Set<LensKind>();
  for (const [, ks] of tiles) for (const k of ks) seen.add(k);
  return LENS_KINDS.filter((k) => seen.has(k));
}

/** Whether the map has any tile with a lens effect: the one-time hint "hold Danger for the terrain" waits for it. */
export function hasSpecialTerrain(data: GameData, s: BattleState): boolean {
  const checked = new Set<string>();
  for (const id of s.terrain) {
    if (checked.has(id)) continue;
    checked.add(id);
    if (lensKinds(data, id).length) return true;
  }
  return false;
}

export type TileEffectKind = 'def' | 'avoid' | 'heal' | 'enterDamage' | 'flammable';

export interface TileEffect {
  kind: TileEffectKind;
  /** defense / avoid points, healing in percent, damage on entering; absent for `flammable` */
  value?: number;
  /** a bonus (green) or a malus (red) */
  good: boolean;
}

/** What a tile does to whoever stands on it, as chips of the tile card; only what applies (a plain field has none). */
export function tileEffects(data: GameData, s: BattleState, p: Pos): TileEffect[] {
  const id = terrainAt(s, p);
  const t = data.terrain[id];
  if (!t) return [];
  const out: TileEffect[] = [];
  if (t.def) out.push({ kind: 'def', value: t.def, good: t.def > 0 });
  if (t.avoid) out.push({ kind: 'avoid', value: t.avoid, good: t.avoid > 0 });
  if (t.heal) out.push({ kind: 'heal', value: t.heal, good: t.heal > 0 });
  if (isHazardTerrain(id)) out.push({ kind: 'enterDamage', value: data.balance.terrainEffects.burningEnterDamage, good: false });
  if (t.flammable) out.push({ kind: 'flammable', good: false });
  return out;
}

/** A movement cost as the board writes it: whole points as they are, halves with "½" ("½", "2½"). */
export function costLabel(cost: number): string {
  const whole = Math.floor(cost);
  if (cost - whole === 0.5) return whole === 0 ? '½' : `${whole}½`;
  return String(Math.round(cost * 100) / 100);
}

/** What entering tile `p` costs this unit, with the cost overrides of its skills (as the path search has it); null = it cannot go there. */
export function unitTileCost(data: GameData, s: BattleState, unit: BattleUnit, p: Pos): number | null {
  const overrides = computeStats(data, unit, { state: s, pos: unit.pos ?? undefined }).skills.terrainCost;
  return moveCost(data, s, unit, p, overrides);
}

/** The move types shown small under the cost of the unit's own (a player never has `monster`), each with its cost on tile `p`. */
export const OTHER_MOVE_TYPES: readonly MoveType[] = ['foot', 'armored', 'mounted', 'flier'];

export function otherMoveCosts(data: GameData, s: BattleState, p: Pos, own: MoveType): Array<{ moveType: MoveType; cost: number | null }> {
  const id = terrainAt(s, p);
  return OTHER_MOVE_TYPES.filter((m) => m !== own).map((moveType) => ({ moveType, cost: moveCostOf(data, id, moveType) }));
}

export interface CostMark {
  at: Pos;
  /** dots to draw (one per movement point, from cost 2), 0 for none */
  pips: number;
  /** "½" pill for a cost below 1 (road, bridge), else null */
  label: string | null;
}

/** The cost marks for tiles of a move range: dots from cost 2, the "½" pill below cost 1; tiles with a plain cost get none. */
export function costMarks(data: GameData, s: BattleState, unit: BattleUnit, tiles: readonly Pos[]): CostMark[] {
  const overrides = computeStats(data, unit, { state: s, pos: unit.pos ?? undefined }).skills.terrainCost;
  const out: CostMark[] = [];
  for (const at of tiles) {
    const cost = moveCost(data, s, unit, at, overrides);
    if (cost === null) continue;
    if (cost >= 2) out.push({ at, pips: Math.ceil(cost), label: null });
    else if (cost > 0 && cost < 1) out.push({ at, pips: 0, label: costLabel(cost) });
  }
  return out;
}

/** What is left of the unit's movement when it has walked to `to` along the way `reach` found; null when `to` is not in `reach`. */
export function restMovement(data: GameData, s: BattleState, unit: BattleUnit, reach: ReadonlyMap<string, ReachNode>, to: Pos): number | null {
  const node = reach.get(posKey(to));
  if (!node || !unit.pos) return null;
  return moveBudget(data, s, unit, unit.pos) - node.cost;
}
