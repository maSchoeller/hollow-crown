/**
 * Wirken (Elementarist, story 2.5): the class action that shapes the terrain with the element of the equipped spell weapon.
 * Range = weapon range of that tome (at least 1), unlimited per map, replaces the action of the turn. Fire only on flammable
 * tiles, water puts out fire around the target and makes units there wet, earth raises a rockwall on a free tile, wind lifts
 * fog (Story 2.6 reads `liftedTiles`). `castArea` serves the preview and the resolution, so both always agree. Casting
 * itself never draws a random number; only the spread of fire (`tickTerrain`) does.
 */
import type { Element, GameData, Pos } from '../defs';
import type { GameEvent } from '../events';
import type { BattleState, BattleUnit } from '../state';
import { active, areaTiles, inBounds, neighbors, posKey, samePos, terrainAt, unitAt } from '../util';
import { applyStatus, extinguishTile, igniteTile, raiseRockwall } from './effects';
import { itemDef, weaponProfile } from './items';
import { tilesInRange, weaponRange } from './movement';
import { classActionId } from './roles';

/** The elements Wirken can use; light and dark come with the pro paths. */
export const CAST_ELEMENTS = ['fire', 'water', 'earth', 'wind'] as const;
export type CastElement = (typeof CAST_ELEMENTS)[number];

/** Why Wirken is not possible: no tome in the main hand, an element it cannot cast, wind on a map without fog, no valid tile. */
export type CastBlock = 'tome' | 'element' | 'fog' | 'target';

export interface CastSource {
  weapon: string;
  element: CastElement;
  /** tiles from the caster: 1 up to the weapon's range */
  range: [number, number];
}

const isCastElement = (e: Element | undefined): e is CastElement => !!e && (CAST_ELEMENTS as readonly string[]).includes(e);

/** The tome Wirken works with (main hand; a rune's element counts) or the reason there is none. */
export function castSource(data: GameData, s: BattleState, u: BattleUnit): { src?: CastSource; block?: CastBlock } {
  const w = u.equip.mainHand;
  if (!w || itemDef(data, w).kind !== 'tome') return { block: 'tome' };
  const element = weaponProfile(data, w, s).element;
  if (!isCastElement(element)) return { block: 'element' };
  if (element === 'wind' && !data.maps[s.mapId]?.fog) return { block: 'fog' };
  // a tome with `utility.rng` (stone_wall) casts that far, any other the range of its weapon
  const hi = itemDef(data, w).utility?.rng[1] ?? weaponRange(data, s, u, w.uid)[1];
  return { src: { weapon: w.uid, element, range: [1, hi] } };
}

/** Tiles within `r` of `at` (the tile itself included), on the map. */
export function diamond(s: BattleState, at: Pos, r: number): Pos[] {
  return tilesInRange(s, at, [0, r]);
}

/** Brand area (also the AI's): the target and the flammable neighbours the fire may spread to in the next round. */
export function fireArea(data: GameData, s: BattleState, at: Pos): Pos[] {
  return [at, ...neighbors(at).filter((p) => inBounds(s, p) && data.terrain[terrainAt(s, p)]?.flammable)];
}

function canCastOn(data: GameData, s: BattleState, u: BattleUnit, element: CastElement, p: Pos): boolean {
  const cur = terrainAt(s, p);
  const timer = s.timers[posKey(p)];
  switch (element) {
    case 'fire':
      return !!data.terrain[cur]?.flammable || (cur === 'burning' && timer?.kind === 'burning');
    case 'water':
      return cur !== 'rockwall';
    case 'wind':
      return true;
    case 'earth': {
      const o = unitAt(s, p);
      if (o && o.uid !== u.uid) return false;
      if (s.objects.some((x) => samePos(x.at, p)) || s.loot.some((l) => samePos(l.at, p))) return false;
      if (cur === 'rockwall') return timer?.kind === 'rockwall';
      // only ground a foot unit can enter, and never a goal of the mission (throne, gate, the tiles a seize/reach/escape goal names)
      const def = data.terrain[cur];
      if (!def || def.cost.foot === null || def.seizable) return false;
      const v = data.maps[s.mapId]?.objectives.victory;
      return !(v && (v.type === 'reach' || v.type === 'seize' || v.type === 'escape') && areaTiles(v.area).some((g) => samePos(g, p)));
    }
  }
}

/** Tiles the unit could cast on from `pos` (before it has moved there; its own old tile counts as free). */
export function castTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): Pos[] {
  if (classActionId(data, u, s) !== 'cast') return [];
  const { src } = castSource(data, s, u);
  if (!src) return [];
  return tilesInRange(s, pos, src.range).filter((p) => canCastOn(data, s, u, src.element, p));
}

/** Why the dock slot Wirken is dimmed on `pos`; null when casting is possible (or the unit has no Wirken). */
export function castBlock(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): CastBlock | null {
  if (classActionId(data, u, s) !== 'cast') return null;
  const { src, block } = castSource(data, s, u);
  if (!src) return block!;
  return castTargets(data, s, u, pos).length ? null : 'target';
}

export interface CastArea {
  element: CastElement;
  at: Pos;
  effect: 'ignite' | 'extinguish' | 'rockwall' | 'fog';
  /** the fields the effect touches (fire: target plus flammable neighbours the fire may spread to) */
  tiles: Pos[];
  /** units standing there and affected: on the burning tile, wet from water */
  units: string[];
  /** rounds the effect lasts (`burningDuration`, `rockwallDuration`, `classActions.cast.fogDuration`; water: wet status) */
  turns: number;
  radius: number;
  /** the field already has this effect, so its duration is renewed */
  renews: boolean;
  /** burning fields water puts out */
  extinguished: number;
}

/** What Wirken with the unit's tome does on `at`: shared by the preview and the resolution. */
/** `from`: the tile the caster stands on when it casts (the preview runs before the walk). */
export function castArea(data: GameData, s: BattleState, u: BattleUnit, at: Pos, from: Pos | null = u.pos): CastArea | null {
  const { src } = castSource(data, s, u);
  if (!src) return null;
  const te = data.balance.terrainEffects;
  const cast = data.balance.classActions.cast;
  const on = (tiles: Pos[]) => s.units.filter((o) => active(o) && tiles.some((p) => samePos(p, o.uid === u.uid ? from : o.pos))).map((o) => o.uid);
  const cur = terrainAt(s, at);
  switch (src.element) {
    case 'fire':
      return { element: 'fire', at, effect: 'ignite', tiles: fireArea(data, s, at), units: on([at]), turns: te.burningDuration, radius: 1, renews: cur === 'burning', extinguished: 0 };
    case 'water': {
      const tiles = diamond(s, at, cast.waterRadius);
      const units = on(tiles.filter((p) => terrainAt(s, p) !== 'rockwall'));
      const extinguished = tiles.filter((p) => s.timers[posKey(p)]?.kind === 'burning').length;
      return { element: 'water', at, effect: 'extinguish', tiles, units, turns: data.balance.status.durationRounds, radius: cast.waterRadius, renews: false, extinguished };
    }
    case 'earth':
      return { element: 'earth', at, effect: 'rockwall', tiles: [at], units: [], turns: te.rockwallDuration, radius: 0, renews: cur === 'rockwall', extinguished: 0 };
    case 'wind': {
      const radius = te.windFogClearRadius;
      return { element: 'wind', at, effect: 'fog', tiles: diamond(s, at, radius), units: [], turns: cast.fogDuration, radius, renews: liftedAt(s, u.team, at, radius), extinguished: 0 };
    }
  }
}

const liftedAt = (s: BattleState, team: BattleUnit['team'], at: Pos, radius: number) =>
  !!s.fogLifted?.some((l) => l.team === team && l.radius === radius && samePos(l.at, at));

/** Fields the fog is lifted on for `team` right now (Story 2.6 adds them to the team's vision), as `x,y` keys. */
export function liftedTiles(s: BattleState, team: BattleUnit['team']): Set<string> {
  const out = new Set<string>();
  for (const l of s.fogLifted ?? []) if (l.team === team) for (const p of diamond(s, l.at, l.radius)) out.add(posKey(p));
  return out;
}

/** Resolves Wirken of `u` (standing on its final tile) on `at`; `castTargets` has validated the tile. */
export function resolveCast(data: GameData, s: BattleState, u: BattleUnit, at: Pos, events: GameEvent[]): void {
  const area = castArea(data, s, u, at)!;
  events.push({ t: 'classAction', unit: u.uid, action: 'cast', at, element: area.element });
  switch (area.element) {
    case 'fire':
      igniteTile(data, s, at, 'ignite', events, true);
      break;
    case 'water':
      for (const p of area.tiles) extinguishTile(s, p, events);
      for (const uid of area.units) {
        const o = s.units.find((x) => x.uid === uid);
        if (o) applyStatus(data, s, o, 'wet', events);
      }
      break;
    case 'earth':
      raiseRockwall(data, s, at, events);
      break;
    case 'wind': {
      const lifted = (s.fogLifted ??= []);
      const same = lifted.find((l) => l.team === u.team && l.radius === area.radius && samePos(l.at, at));
      if (same) same.turns = area.turns;
      else lifted.push({ team: u.team, at: [at[0], at[1]], radius: area.radius, turns: area.turns });
      break;
    }
  }
}
