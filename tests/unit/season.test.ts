import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { variantList } from '../../src/content/propVariants';
import { seasonGround, seasonModel, seasonOf, seasonTextures, takesSnow } from '../../src/content/season';
import { validateBoardModels, validateSeasons } from '../../src/content/validateLook';
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
    for (const own of ['snowfir_a', 'grove_snow_a', 'snowcap_wall_idle', 'bush_snow_a']) expect(takesSnow(render, 'winter', own)).toBe(false);
  });

  it('story 15.16: in winter the low decoration is the snowy bush, the stones stay', () => {
    const bushes = render.board.decor.bushes.model;
    expect(seasonModel(render, 'winter', bushes)).toBe('bush_snow_a');
    expect(seasonModel(render, 'autumn', bushes)).toBe(bushes);
    expect(seasonModel(render, 'winter', render.board.decor.stones.model)).toBe(render.board.decor.stones.model);
  });

  it('story 15.16: a forest tile rolls from three groves in every season, autumn and winter only from their own', () => {
    for (const [season, prefix] of [['summer', 'grove_'], ['autumn', 'grove_autumn_'], ['winter', 'grove_snow_']] as const) {
      const list = variantList(data, 'tree', season);
      expect(list.filter((e) => e.weight > 0)).toHaveLength(3);
      for (const e of list) expect(e.model.startsWith(prefix)).toBe(true);
    }
  });

  it('the map schema knows the season', () => {
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

  it('content:check: a season texture tools/art/ground.py does not build and a missing snow-cap model are errors', () => {
    expect(validateSeasons(data, new Set(['grass_autumn', 'snow', 'dirt_frozen', 'road_snow']))).toEqual([]);
    expect(validateSeasons(data, new Set(['snow', 'dirt_frozen', 'road_snow'])).map((i) => i.message)).toEqual([expect.stringContaining('grass_autumn is no ground texture')]);
    const models = (skip: string) => new Set([...validateBoardModels(data, new Set(), new Set()).map((i) => /missing model (\S+)/.exec(i.message)![1]!)].filter((m) => m !== skip));
    const issues = validateBoardModels(data, models('snowcap_wall_idle'), new Set()).map((i) => i.file + ' ' + i.message);
    expect(issues).toEqual([expect.stringContaining('board.seasonModels.winter missing model snowcap_wall_idle')]);
  });
});
