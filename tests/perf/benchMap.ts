/**
 * The reference battle of the performance run (story 7.5, NFR1): 24×32 tiles, 40 units (12 player, 28 enemies that
 * all advance in the enemy phase). Built here instead of in content/ so it never ships; checked with the map schema.
 */
import { mapSchema } from '../../src/content/schemas';
import type { MapDef } from '../../src/core/defs';

export const BENCH_MAP_ID = 'perf_bench_large';
export const BENCH_SIZE: [number, number] = [24, 32];

/** Deterministic terrain: grass and plain, forest clumps, a road down the middle and a ford of shallow ground. */
function terrainRows(w: number, h: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const n = (x * 73 + y * 151 + x * y * 7) % 23;
      if (x === 11 || x === 12) row += '_';
      else if (n < 3 && y > 9 && y < 24) row += 'T';
      else if (n < 9) row += ',';
      else row += '.';
    }
    rows.push(row);
  }
  return rows;
}

const ENEMY_KINDS = [
  { class: 'brigand', sprite: 'brigand', items: [{ def: 'iron_axe' }] },
  { class: 'vanguard', sprite: 'soldier', items: [{ def: 'iron_lance' }] },
  { class: 'marksman', sprite: 'archer', items: [{ def: 'iron_bow' }] },
  { class: 'skirmisher', sprite: 'thief', items: [{ def: 'iron_sword' }] },
];
const PLAYER_KINDS = [
  { class: 'vanguard', items: [{ def: 'iron_lance' }] },
  { class: 'skirmisher', items: [{ def: 'iron_sword' }] },
  { class: 'marksman', items: [{ def: 'iron_bow' }] },
  { class: 'healer', items: [{ def: 'heal_staff' }] },
];

export function benchMapRaw(): unknown {
  const [w, h] = BENCH_SIZE;
  const units: unknown[] = [];
  for (let i = 0; i < 28; i++) {
    const k = ENEMY_KINDS[i % ENEMY_KINDS.length]!;
    units.push({ id: `e${i}`, team: 'enemy', level: 3, at: [2 + (i % 10) * 2, 2 + Math.floor(i / 10) * 2], ...k, ai: { profile: 'aggressive' } });
  }
  for (let i = 0; i < 12; i++) {
    const k = PLAYER_KINDS[i % PLAYER_KINDS.length]!;
    units.push({ id: `p${i}`, team: 'player', level: 3, at: [6 + (i % 6) * 2, 26 + Math.floor(i / 6) * 2], ...k });
  }
  return {
    id: BENCH_MAP_ID,
    nameKey: 'map.prologue_paktnacht.name',
    size: [w, h],
    fog: false,
    legend: { '.': 'plain', ',': 'grass', _: 'road', T: 'forest' },
    terrain: terrainRows(w, h).join('\n'),
    objects: [],
    initialEffects: [],
    deploy: { max: 0, forced: [], slots: [] },
    units,
    objectives: { victory: { type: 'rout' }, defeat: [], side: [] },
  };
}

/** The bench map as the game reads it; throws with the schema message when content changes break it. */
export function benchMap(): MapDef {
  return mapSchema.parse(benchMapRaw()) as MapDef;
}
