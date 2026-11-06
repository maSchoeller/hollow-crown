import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { seasonGround, seasonModel, seasonOf, seasonTextures, takesSnow } from '../../src/content/season';
import { validateSeasons } from '../../src/content/validateLook';
import { mapSchema } from '../../src/content/schemas';
import type { GameData } from '../../src/core/gameData';

const { data } = loadContentFromDisk();
const render = data.render;

describe('seasons of the board (story 15.15)', () => {
  it('a map takes the season of its act, its own season wins', () => {
    expect(seasonOf(render, { act: 1 })).toBe('summer');
    expect(seasonOf(render, { act: 2 })).toBe('autumn');
    expect(seasonOf(render, { act: 3 })).toBe('winter');
    expect(seasonOf(render, { act: 2, season: 'winter' })).toBe('winter');
    expect(seasonOf(render, { act: 9 })).toBe('summer');
  });

  it('every act 1 map stays in summer', () => {
    for (const m of Object.values(data.maps).filter((x) => x.act === 1)) expect(seasonOf(render, m)).toBe('summer');
  });

  it('the season swaps only the texture of a splat layer, an interior keeps its own', () => {
    expect(seasonGround(render, 'summer', 'grass')).toBe('grass');
    expect(seasonGround(render, 'autumn', 'grass')).toBe('grass_autumn');
    expect(seasonGround(render, 'autumn', 'road')).toBe('road');
    expect(seasonGround(render, 'winter', 'grass')).toBe('snow');
    expect(seasonGround(render, 'winter', 'dirt')).toBe('dirt_frozen');
    expect(seasonGround(render, 'winter', 'road')).toBe('road_snow');
    expect(seasonGround(render, 'winter', 'vault')).toBe('vault');
    expect(seasonGround(render, 'winter', 'grass', true)).toBe('grass');
  });

  it('only the textures of the season shown are loaded', () => {
    expect(seasonTextures(render, 'summer')).toEqual([]);
    expect(seasonTextures(render, 'autumn')).toEqual(['grass_autumn']);
    expect(seasonTextures(render, 'winter').sort()).toEqual(['dirt_frozen', 'road_snow', 'snow']);
    expect(seasonTextures(render, 'winter', true)).toEqual([]);
  });

  it('wall and tower wear their snow caps in winter, the rest of the year themselves', () => {
    expect(seasonModel(render, 'winter', 'wallrim_idle')).toBe('snowcap_wall_idle');
    expect(seasonModel(render, 'winter', 'tower_idle')).toBe('snowcap_tower_idle');
    expect(seasonModel(render, 'autumn', 'wallrim_idle')).toBe('wallrim_idle');
    expect(seasonModel(render, 'winter', 'house_intact')).toBe('house_intact');
  });

  it('painted snow (way B) only in winter and never on models with their own snow', () => {
    expect(takesSnow(render, 'winter', 'massif_a')).toBe(true);
    expect(takesSnow(render, 'winter', 'house_intact')).toBe(true);
    expect(takesSnow(render, 'autumn', 'massif_a')).toBe(false);
    for (const own of ['snowfir_a', 'grove_snow_a', 'snowcap_wall_idle']) expect(takesSnow(render, 'winter', own)).toBe(false);
  });

  it('the map schema knows the season', () => {
    const base = { id: 't', nameKey: 'k', size: [1, 1], fog: false, legend: { '.': 'grass' }, terrain: '.', units: [], deploy: { slots: [] }, reinforcements: [], objectives: [] };
    expect(mapSchema.safeParse({ ...base, season: 'winter' }).success).toBeDefined();
    expect(mapSchema.shape.season.safeParse('winter').success).toBe(true);
    expect(mapSchema.shape.season.safeParse('spring').success).toBe(false);
  });

  it('content:check: the shipped content is clean, a season on an interior and a swap of an unknown surface are errors', () => {
    expect(validateSeasons(data)).toEqual([]);
    const id = Object.keys(data.maps)[0]!;
    const broken = {
      ...data,
      maps: { ...data.maps, [id]: { ...data.maps[id]!, interior: true, season: 'winter' as const }, x: { ...data.maps[id]!, id: 'x', act: 7 } },
      render: { ...render, board: { ...render.board, seasonGround: { winter: { lava: 'snow', grass: 'grass' } } } },
    } as GameData;
    const msgs = validateSeasons(broken).map((i) => i.message);
    expect(msgs.some((m) => m.includes('interior'))).toBe(true);
    expect(msgs.some((m) => m.includes('no season for act 7'))).toBe(true);
    expect(msgs.some((m) => m.includes('surface lava'))).toBe(true);
    expect(msgs.some((m) => m.includes('swaps the texture for itself'))).toBe(true);
  });
});
