import type { GameData } from '../gameData';

/** The terrain ids of a map, row by row (index y * width + x), from its terrain picture and legend. */
export function parseTerrain(data: GameData, mapId: string): string[] {
  const map = data.maps[mapId]!;
  const rows = map.terrain.replace(/\r/g, '').split('\n').filter((r) => r.length > 0);
  const out: string[] = [];
  for (const row of rows) for (const ch of row) out.push(map.legend[ch]!);
  return out;
}
