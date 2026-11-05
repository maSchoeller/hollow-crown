import type { GameData } from '../gameData';
import type { MapDef } from '../mapDefs';
import { areaTiles, posKey } from '../util';

/** The terrain ids of a map, row by row (index y * width + x), from its terrain picture and legend. */
/** The `levels` of a map as the state keeps them; later entries win. */
export function parseLevels(map: MapDef): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of map.levels ?? []) for (const p of areaTiles(l.area)) out[posKey(p)] = l.level;
  return out;
}

export function parseTerrain(data: GameData, mapId: string): string[] {
  const map = data.maps[mapId]!;
  const rows = map.terrain.replace(/\r/g, '').split('\n').filter((r) => r.length > 0);
  const out: string[] = [];
  for (const row of rows) for (const ch of row) out.push(map.legend[ch]!);
  return out;
}
