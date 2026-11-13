/**
 * The map of a haunt (story 5.6): the story map with the field of the anchor's variant. It is derived from map, variant and
 * lieutenant alone, kept in `data.maps` under `haunt~<map>~<variant>~<lieutenant>` and made again from that id wherever a
 * battle state needs it (`ensureHauntMap`: the core worker, a restored save), so the rules and the board find terrain,
 * objects, goal and defeat conditions through `data.maps[state.mapId]` like on any map.
 */
import type { Pos } from '../defs';
import type { GameData } from '../gameData';
import type { Area, HauntAnchor, HauntPoolsDef, MapDef, MapObjectDef, ObjectiveDef, Reward } from '../mapDefs';
import { areaTiles, posKey } from '../util';
import { companyMoveTypes } from '../moveTypes';
import { parseTerrain } from './terrain';

/**
 * The places of a haunt: the anchor's `max`, else `deploy.max` of the map, and never fewer than `haunt.minPlaces`
 * (Produktinhaber 2026-11-08: at least 5). The foes follow the places (`hauntEnemyCount`).
 */
export const hauntPlaces = (data: Pick<GameData, 'balance'>, map: Pick<MapDef, 'deploy'>, anchor: Pick<HauntAnchor, 'max'>): number =>
  Math.max(data.balance.haunt.minPlaces, anchor.max ?? map.deploy.max);

/** Unit ids of the civilian and the chests in a haunt battle. */
export const HAUNT_CIVILIAN = 'civilian';
export const hauntChestId = (i: number): string => `hc${i}`;

export const hauntMapId = (map: string, variant: string, lt: string): string => `haunt~${map}~${variant}~${lt}`;

/** Splits a haunt map id; null for any other id. */
export function parseHauntMapId(id: string): { map: string; variant: string; lt: string } | null {
  const [tag, map, variant, lt, ...rest] = id.split('~');
  return tag === 'haunt' && map && variant && lt && !rest.length ? { map, variant, lt } : null;
}

/**
 * A haunt from a save whose anchor the content no longer has (the map got `noHaunts`, the anchor was removed): it
 * lapses on load instead of breaking the battle. A map that is not loaded (a pack still on its way) says nothing yet.
 */
export function hauntAnchorGone(data: GameData, mapId: string, variant: string): boolean {
  const map = data.maps[mapId];
  return !!map && (!!map.noHaunts || !map.haunts?.some((a) => a.variant === variant));
}

/** The battle map `id` is a haunt map whose anchor is gone (`hauntAnchorGone`). */
export function staleHauntMap(data: GameData, id: string): boolean {
  const p = parseHauntMapId(id);
  return !!p && hauntAnchorGone(data, p.map, p.variant);
}

/** A saved payload without its running battle when that battle is a haunt whose anchor is gone: loading goes to the world map. */
export function withoutStaleHauntBattle<T extends { battle?: { start: { mapId: string } } }>(data: GameData, p: T): T {
  if (!p.battle || !staleHauntMap(data, p.battle.start.mapId)) return p;
  const { battle: _gone, ...rest } = p;
  return rest as T;
}

/**
 * The tiles of `area` a unit can stand on (the terrain lets it in, no object on it, a closed door is no place to stand).
 * `moveType` is one move type, or a list every tile has to be open to (QA act 2, 2026-11-13: the deploy slots of a haunt are
 * one list for the whole company, so a tile only `foot` may enter would strand a rider or an armour there). Shared with `content:check`.
 */
export function standableTiles(data: GameData, map: MapDef, area: Area, moveType: string | readonly string[]): Pos[] {
  const [w, h] = map.size;
  const terrain = parseTerrain(data, map.id);
  const objects = new Set(map.objects.map((o) => posKey(o.at)));
  const mts = typeof moveType === 'string' ? [moveType] : moveType;
  return areaTiles(area).filter((p) => {
    if (p[0] < 0 || p[1] < 0 || p[0] >= w || p[1] >= h) return false;
    const t = data.terrain[terrain[p[1]! * w + p[0]!]!];
    return !!t && !t.opensTo && mts.every((mt) => t.cost[mt as keyof typeof t.cost] !== null) && !objects.has(posKey(p));
  });
}

/**
 * The pools a haunt takes its civilian and chests from (story 11.7): those of the lieutenant's act, like his band (`hauntPool`),
 * else those of the map's act. A haunt of act 2 on a map of act 1 so brings the steel-tier loot of act 2; in act 1 both are act 1.
 */
export function hauntPoolsFor(data: GameData, mapAct: number, lt: string): HauntPoolsDef | undefined {
  const own = data.lieutenants?.[lt]?.act;
  return (own !== undefined ? data.hauntPools?.[own] : undefined) ?? data.hauntPools?.[mapAct];
}

/** What chest `i` holds: the entries of the act's `chestLoot`, in turn. */
export function hauntChestLoot(loot: readonly { gold?: number; item?: Reward['item'] }[], i: number): Reward {
  const e = loot[i % loot.length]!;
  return { ...(e.gold !== undefined ? { gold: e.gold } : {}), ...(e.item ? { item: e.item } : {}) };
}

/** The victory goal of a variant. */
function victoryOf(anchor: HauntAnchor, lt: string): ObjectiveDef {
  switch (anchor.variant) {
    case 'boss':
      return { type: 'boss', unit: lt };
    case 'rout':
      return { type: 'rout' };
    case 'defend':
      return { type: 'defend', unit: HAUNT_CIVILIAN, turns: anchor.turns! };
    case 'escort':
      return { type: 'escort', unit: HAUNT_CIVILIAN, area: anchor.exit!, join: false };
    case 'treasure':
      return { type: 'treasure', chests: anchor.chests!.map((_, i) => hauntChestId(i)), turns: anchor.turns! };
  }
}

/** Derives the map of a haunt from its story map and anchor; null when the map or anchor does not exist. */
export function buildHauntMap(data: GameData, mapId: string, variant: string, lt: string): MapDef | null {
  const base = data.maps[mapId];
  const anchor = base?.haunts?.find((a) => a.variant === variant);
  if (!base || !anchor) return null;
  const pool = hauntPoolsFor(data, base.act, lt);
  const objects: MapObjectDef[] = base.objects
    .filter((o) => o.type !== 'chest')
    // no spoils from the houses of the story map: the reward of a haunt is set by `balance.haunt`
    .map((o) => (o.type === 'village' ? { id: o.id, type: o.type, at: o.at } : o));
  if (anchor.chests) anchor.chests.forEach((at, i) => objects.push({ id: hauntChestId(i), type: 'chest', at, contents: hauntChestLoot(pool?.chestLoot ?? [{ gold: 100 }], i) }));
  // no required units in a haunt (Produktinhaber 2026-11-08): avatar and lucan go along by choice and are only downed there
  // (`deathless`); the battle is lost when the whole company is down (`checkObjectives`) or the civilian falls
  const defeat: MapDef['objectives']['defeat'] = [];
  if (anchor.variant === 'defend' || anchor.variant === 'escort') defeat.push({ type: 'unit_dies', unit: HAUNT_CIVILIAN });
  // the place itself comes over whole (terrain, `levels`, ladders, props); a field listed one by one got lost the day it was
  // added to the map (fix 2026-11-09: the terraces of 1-5 rendered flat and their rules were level 0). Left behind: the
  // story's cast, goals and texts, and the hour and weather of the story day (a haunt has always had plain light)
  const { haunts: _haunts, noHaunts: _noHaunts, devNote: _devNote, timeOfDay: _timeOfDay, weather: _weather, ...place } = base;
  return {
    ...place,
    id: hauntMapId(mapId, variant, lt),
    // fix 2026-11-09: a haunt's foes stand far from the company; under fog it found no one to fight (balance.haunt.fog)
    fog: base.fog && data.balance.haunt.fog,
    objects,
    initialEffects: base.initialEffects,
    deploy: { max: hauntPlaces(data, base, anchor), forced: [], slots: standableTiles(data, base, anchor.deploy, companyMoveTypes(data)) },
    units: [],
    pairs: [],
    reinforcements: [],
    objectives: { victory: victoryOf(anchor, lt), defeat, side: [] },
    triggers: [],
    goldReward: 0,
  };
}

/** The map of a haunt, made and kept in `data.maps` on first use. */
export function hauntMap(data: GameData, mapId: string, variant: string, lt: string): MapDef {
  const id = hauntMapId(mapId, variant, lt);
  return (data.maps[id] ??= buildHauntMap(data, mapId, variant, lt)!);
}

/** Makes sure the map with this id exists when it is a haunt map (a state that comes from a save or another thread). */
export function ensureHauntMap(data: GameData, id: string): void {
  if (data.maps[id]) return;
  const p = parseHauntMapId(id);
  if (p) hauntMap(data, p.map, p.variant, p.lt);
}
