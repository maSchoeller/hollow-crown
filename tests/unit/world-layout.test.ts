import { describe, expect, it } from 'vitest';
import { conditionContext, newCampaign, type WorldDef } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import { fogCorners, fogLabels, locationModel, locationOf, worldLayout } from '../../src/render/world/layout';

const { data, locales } = loadContentFromDisk();

/** A 4 × 3 world: sea column, act-1 land and an act-2 corner (story 5.2). */
const tiny: WorldDef = {
  id: 'tiny',
  legend: { '~': 'river', '.': 'grass', T: 'forest' },
  tiles: '~..T\n~...\n~..T',
  regions: [
    { id: 'low', char: '1', act: 1, season: 'late_summer' },
    { id: 'high', char: '2', act: 2, season: 'autumn' },
  ],
  regionGrid: '.122\n.112\n.111',
  miniatures: { a: [{ prop: 'house_intact', at: [0, 0], rot: 0, scale: 1 }], b: [{ prop: 'house_razed', at: [0, 0], rot: 0, scale: 1 }] },
  locations: [{ node: 'prologue', at: [1, 1], model: 'a', variants: [{ model: 'b', requires: [{ completed: 'prologue' }] }] }],
  signs: [{ act: 1, kind: 'ash', areas: [[1, 0, 3, 1]] }],
};

describe('world map layout (story 5.2)', () => {
  it('reads tiles through the legend and lays ash on open ground of reached acts only', () => {
    const l = worldLayout(tiny, 1);
    expect([l.width, l.height]).toEqual([4, 3]);
    // row 0: sea, ash, ash, forest stays forest
    expect(l.terrain.slice(0, 4)).toEqual(['river', 'ash', 'ash', 'forest']);
    const later = worldLayout({ ...tiny, signs: [{ act: 2, kind: 'ash', areas: [[1, 0, 3, 1]] }] }, 1);
    expect(later.terrain[1]).toBe('grass');
  });

  it('puts the regions of later acts under fog and names them in their middle', () => {
    const l = worldLayout(tiny, 1);
    expect(l.fog.filter(Boolean).length).toBe(3);
    expect(l.region[0]).toBeNull();
    expect(fogLabels(tiny, l)).toEqual([{ id: 'high', at: [(2.5 + 3.5 + 3.5) / 3, (0.5 + 0.5 + 1.5) / 3] }]);
    expect(fogLabels(tiny, worldLayout(tiny, 2))).toEqual([]);
  });

  it('fades the fog over one tile at its edge', () => {
    const l = worldLayout(tiny, 1);
    const c = fogCorners(l);
    expect(c.length).toBe(5 * 4);
    // corner (3, 1) touches fogged (2,0), (3,0), (3,1) and open (2,1)
    expect(c[1 * 5 + 3]).toBe(0.75);
    expect(c[3 * 5 + 0]).toBe(0);
  });

  it('shows the first variant whose conditions hold, else the base miniature', () => {
    const c = newCampaign(data, 1, { difficulty: 'normal', death: 'standard' } as never, { name: 'A', portrait: 'avatar_a' } as never);
    const loc = locationOf(tiny, { node: 'prologue' })!;
    expect(locationModel(loc, conditionContext(data, c))).toBe('a');
    expect(locationModel(loc, conditionContext(data, { ...c, completed: ['prologue'] }))).toBe('b');
  });

  it('places every campaign node and the home of Valmora', () => {
    for (const n of data.campaign.nodes) expect(locationOf(data.world, { node: n.id }), n.id).toBeDefined();
    expect(locationOf(data.world, { home: data.campaign.home })).toBeDefined();
    const l = worldLayout(data.world, data.campaign.act);
    expect(l.terrain.length).toBe(l.width * l.height);
  });

  it('content:check catches a node without a place and a broken grid', () => {
    const broken = { ...data, world: { ...data.world, tiles: data.world.tiles.replace('~~~~s', '~~~~?'), locations: data.world.locations.filter((l) => l.node !== 'ch02') } };
    const msgs = validateContent(broken, locales).map((i) => i.message);
    expect(msgs).toContain('node ch02 has no place on the world map');
    expect(msgs.some((m) => m.includes('"?" is not in the legend'))).toBe(true);
    expect(validateContent(data, locales).filter((i) => i.file.startsWith('world'))).toEqual([]);
  });
});
