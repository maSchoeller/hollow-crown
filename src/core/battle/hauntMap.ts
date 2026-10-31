/**
 * The map of a haunt (story 5.6): the story map with the field of the anchor's variant. It is derived from map, variant and
 * lieutenant alone, kept in `data.maps` under `haunt~<map>~<variant>~<lieutenant>` and made again from that id wherever a
 * battle state needs it (`ensureHauntMap`: the core worker, a restored save), so the rules and the board find terrain,
 * objects, goal and defeat conditions through `data.maps[state.mapId]` like on any map.
 */
import { PERMANENT_COMPANIONS, type Pos } from '../defs';
import type { GameData } from '../gameData';
import type { Area, HauntAnchor, MapDef, MapObjectDef, ObjectiveDef, Reward } from '../mapDefs';
import { areaTiles, posKey } from '../util';
import { parseTerrain } from './terrain';

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
 * The tiles of `area` a unit of move type `moveType` can stand on (the terrain lets it in, no object on it, a closed door
 * is no place to stand). Shared with `content:check`.
 */
export function standableTiles(data: GameData, map: MapDef, area: Area, moveType: string): Pos[] {
  const [w, h] = map.size;
  const terrain = parseTerrain(data, map.id);
  const objects = new Set(map.objects.map((o) => posKey(o.at)));
  return areaTiles(area).filter((p) => {
    if (p[0] < 0 || p[1] < 0 || p[0] >= w || p[1] >= h) return false;
    const t = data.terrain[terrain[p[1]! * w + p[0]!]!];
    return !!t && t.id !== 'door' && t.cost[moveType as keyof typeof t.cost] !== null && !objects.has(posKey(p));
  });
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
  const pool = data.hauntPools?.[base.act];
  const objects: MapObjectDef[] = base.objects
    .filter((o) => o.type !== 'chest')
    // no spoils from the houses of the story map: the reward of a haunt is set by `balance.haunt`
    .map((o) => (o.type === 'village' ? { id: o.id, type: o.type, at: o.at } : o));
  if (anchor.chests) anchor.chests.forEach((at, i) => objects.push({ id: hauntChestId(i), type: 'chest', at, contents: hauntChestLoot(pool?.chestLoot ?? [{ gold: 100 }], i) }));
  const defeat: MapDef['objectives']['defeat'] = PERMANENT_COMPANIONS.map((unit) => ({ type: 'unit_dies' as const, unit }));
  if (anchor.variant === 'defend' || anchor.variant === 'escort') defeat.push({ type: 'unit_dies', unit: HAUNT_CIVILIAN });
  return {
    id: hauntMapId(mapId, variant, lt),
    act: base.act,
    nameKey: base.nameKey,
    size: base.size,
    fog: base.fog,
    ...(base.noDeath ? { noDeath: true } : {}),
    legend: base.legend,
    terrain: base.terrain,
    ...(base.ambient ? { ambient: base.ambient } : {}),
    ...(base.lights ? { lights: base.lights } : {}),
    ...(base.sun ? { sun: base.sun } : {}),
    objects,
    initialEffects: base.initialEffects,
    deploy: { max: anchor.max ?? base.deploy.max, forced: base.deploy.forced, slots: standableTiles(data, base, anchor.deploy, 'foot') },
    units: [],
    pairs: [],
    reinforcements: [],
    objectives: { victory: victoryOf(anchor, lt), defeat, side: [] },
    triggers: [],
    goldReward: 0,
    ...(base.music ? { music: base.music } : {}),
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
