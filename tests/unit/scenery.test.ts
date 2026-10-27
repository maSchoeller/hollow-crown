import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { variantClassOf, variantList } from '../../src/content/propVariants';
import { modelAvailable, modelKnown, pickVariant, pickWeighted, planFence, withState } from '../../src/render/shared/scenery';
import { hash3 } from '../../src/render/shared/terrain3d';

const { data } = loadContentFromDisk();

describe('season tree lists', () => {
  it('act 1 is the summer list with five trees', () => {
    expect(variantList(data, 'tree', 1).map((m) => m.model)).toEqual(['tree_a', 'tree_b', 'tree_c', 'tree_d', 'tree_e']);
  });
  it('act 2 is autumn, act 3 winter', () => {
    expect(variantList(data, 'tree', 2).map((m) => m.model)).toEqual(['autumn_a', 'autumn_b', 'autumn_c', 'tree_c']);
    expect(variantList(data, 'tree', 3).map((m) => m.model)).toEqual(['snowfir_a', 'snowfir_b', 'tree_c']);
  });
  it('an unknown act falls back to summer', () => {
    expect(variantList(data, 'tree', undefined)).toEqual(variantList(data, 'tree', 1));
    expect(variantList(data, 'tree', 9)).toEqual(variantList(data, 'tree', 1));
  });
  it('the scenery uses only the first sceneryVariants models, the map all of them', () => {
    const n = data.render.board.sceneryVariants;
    expect(n).toBeGreaterThanOrEqual(1);
    expect(variantList(data, 'tree', 1, true).map((m) => m.model)).toEqual(variantList(data, 'tree', 1).slice(0, n).map((m) => m.model));
    expect(variantList(data, 'lodge', 1, true)).toEqual(variantList(data, 'lodge', 1));
    expect(variantList(data, 'tree', 1).length).toBe(5);
  });
  it('picks by weight over the roll', () => {
    const mix = [{ model: 'a', weight: 4 }, { model: 'b', weight: 1 }];
    expect(pickWeighted(mix, 0).model).toBe('a');
    expect(pickWeighted(mix, 0.79).model).toBe('a');
    expect(pickWeighted(mix, 0.81).model).toBe('b');
  });
  it('the loader sets the act of every map from its folder', () => {
    for (const m of Object.values(data.maps)) expect(m.act).toBe(1);
  });
});

describe('prop variants', () => {
  const list = [{ model: 'house_intact', weight: 3 }, { model: 'house_b_intact', weight: 1 }, { model: 'house_c_intact', weight: 1 }];
  const all = () => true;

  it('classes: houses, lodges, rocks (rockwall too) and trees have variants, the rest not', () => {
    expect(variantClassOf('house')).toBe('house');
    expect(variantClassOf('lodge')).toBe('lodge');
    expect(variantClassOf('rock')).toBe('rock');
    expect(variantClassOf('rockwall')).toBe('rock');
    expect(variantClassOf('tree')).toBe('tree');
    expect(variantClassOf('fort')).toBeNull();
    expect(variantClassOf(undefined)).toBeNull();
  });

  it('the content names the classes the board draws; building and village use different houses', () => {
    expect(data.terrain.village!.prop).toBe('lodge');
    expect(data.terrain.building!.prop).toBe('house');
    expect(variantList(data, 'lodge').map((v) => v.model)).toEqual(['lodge_intact']);
    expect(variantList(data, 'house').length).toBeGreaterThan(1);
    expect(variantList(data, 'rock').map((v) => v.model)).toContain('rock_idle');
  });

  it('is deterministic for the same rolls', () => {
    for (const r of [0, 0.3, 0.61, 0.99]) expect(pickVariant(list, [r], { has: all })).toBe(pickVariant(list, [r], { has: all }));
  });

  it('follows the weights over the roll', () => {
    expect(pickVariant(list, [0], { has: all })).toBe('house_intact');
    expect(pickVariant(list, [0.59], { has: all })).toBe('house_intact');
    expect(pickVariant(list, [0.7], { has: all })).toBe('house_b_intact');
    expect(pickVariant(list, [0.95], { has: all })).toBe('house_c_intact');
  });

  it('over many fields every variant shows up near its weight', () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      const m = pickVariant(list, [((hash3(i % 50, Math.floor(i / 50), 12) >>> 20) % 1000) / 1000], { has: all });
      counts[m] = (counts[m] ?? 0) + 1;
    }
    expect(counts.house_intact! / 2000).toBeGreaterThan(0.5);
    expect(counts.house_intact! / 2000).toBeLessThan(0.7);
    expect(counts.house_b_intact).toBeGreaterThan(250);
    expect(counts.house_c_intact).toBeGreaterThan(250);
  });

  it('a model the manifest lacks drops out; without any the first one stands', () => {
    const has = (m: string) => m !== 'house_b_intact';
    for (const r of [0, 0.4, 0.7, 0.99]) expect(pickVariant(list, [r], { has })).not.toBe('house_b_intact');
    expect(pickVariant(list, [0.99], { has: () => false })).toBe('house_intact');
    expect(pickVariant(list, [0.99], { has: (m) => m === 'house_intact' })).toBe('house_intact');
  });

  it('a map override wins when the model exists, else the roll decides', () => {
    expect(pickVariant(list, [0], { has: all, override: 'house_c_intact' })).toBe('house_c_intact');
    expect(pickVariant(list, [0], { has: (m) => m !== 'house_c_intact', override: 'house_c_intact' })).toBe('house_intact');
  });

  it('avoids the model of a neighbour with the next roll, but keeps it when every roll repeats it', () => {
    expect(pickVariant(list, [0, 0.7], { has: all, avoid: ['house_intact'] })).toBe('house_b_intact');
    expect(pickVariant(list, [0, 0.1, 0.2], { has: all, avoid: ['house_intact'] })).toBe('house_intact');
    // a single usable model cannot avoid anyone
    expect(pickVariant([list[0]!], [0, 0.5], { has: all, avoid: ['house_intact'] })).toBe('house_intact');
    // no neighbour: the first roll
    expect(pickVariant(list, [0, 0.7], { has: all, avoid: [] })).toBe('house_intact');
  });

  it('the manifest check splits at the first underscore like the asset build', () => {
    const props = { house: ['intact', 'b_intact'], rock: ['idle', 'b'], tree: ['a'] };
    expect(modelKnown(props, 'house_intact')).toBe(true);
    expect(modelKnown(props, 'house_b_intact')).toBe(true);
    expect(modelKnown(props, 'house_c_intact')).toBe(false);
    expect(modelKnown(props, 'rock_b')).toBe(true);
    expect(modelKnown(props, 'tree_d')).toBe(false);
    expect(modelKnown(props, 'lodge_intact')).toBe(false);
    expect(modelKnown(undefined, 'anything_idle')).toBe(true);
  });

  it('a state replaces the end of the intact model', () => {
    expect(withState('lodge_intact', 'visited')).toBe('lodge_visited');
    expect(withState('house_b_intact', 'razed')).toBe('house_b_razed');
    expect(withState('house_b_intact', 'intact')).toBe('house_b_intact');
    expect(withState('rock_b', 'visited')).toBe('rock_b');
  });

  it('the stand-ins in render.yaml point at models that exist today', () => {
    expect(data.render.board.propFallback.well_idle).toBe('rock_idle');
    expect(data.render.board.propFallback.lodge_visited).toBe('house_visited');
  });
});

describe('field fences', () => {
  const none = [false, false, false, false];
  it('a lone side stays a full straight piece, a broken roll swaps the model', () => {
    expect(planFence([true, false, false, false], none)).toEqual([{ kind: 'straight', dx: 0, dz: 0.5, rot: 0, stretch: 1 }]);
    expect(planFence([false, false, true, false], [false, false, true, false])[0]!.kind).toBe('broken');
  });
  it('two meeting sides get a corner of the right orientation and shortened straights', () => {
    const p = planFence([true, false, true, false], none); // N + W = north-west corner
    const corner = p.find((x) => x.kind === 'corner')!;
    expect(corner).toMatchObject({ dx: -0.5, dz: 0.5, rot: Math.PI / 2 });
    const straights = p.filter((x) => x.kind === 'straight');
    expect(straights).toHaveLength(2);
    for (const s of straights) expect(s.stretch).toBeCloseTo(0.5 / 0.95);
  });
  it('a closed ring has four corners and no straights; opposite sides get no corner', () => {
    const ring = planFence([true, true, true, true], [true, true, true, true]);
    expect(ring.filter((x) => x.kind === 'corner').map((x) => x.rot).sort()).toEqual([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]);
    expect(ring.some((x) => x.kind !== 'corner')).toBe(false);
    expect(planFence([true, true, false, false], none).some((x) => x.kind === 'corner')).toBe(false);
  });
  it('is deterministic', () => {
    expect(planFence([true, true, true, false], none)).toEqual(planFence([true, true, true, false], none));
  });
});

describe('prop availability by pack', () => {
  const models = { props: { house: ['intact', 'b_intact'], tree: ['a', 'd'] }, propPacks: { house_b_intact: 'act1', tree_d: 'act1' } };
  it('holds back models of a pack that is not ready, keeps core ones', () => {
    const none = () => false;
    expect(modelAvailable(models, 'house_intact', none)).toBe(true);
    expect(modelAvailable(models, 'tree_a', none)).toBe(true);
    expect(modelAvailable(models, 'tree_d', none)).toBe(false);
    expect(modelAvailable(models, 'tree_d', (p) => p === 'act1')).toBe(true);
    expect(modelAvailable(models, 'rock_b', () => true)).toBe(false);
    expect(modelAvailable(undefined, 'anything_idle', none)).toBe(true);
  });
  it('picks only available models and falls back to the first (core) one, deterministically per availability', () => {
    const list = [
      { model: 'tree_a', weight: 1 },
      { model: 'tree_d', weight: 1 },
    ];
    const offline = (m: string) => modelAvailable(models, m, () => false);
    const online = (m: string) => modelAvailable(models, m, () => true);
    for (const r of [0, 0.4, 0.6, 0.99]) {
      expect(pickVariant(list, [r], { has: offline })).toBe('tree_a');
      expect(pickVariant(list, [r], { has: offline })).toBe(pickVariant(list, [r], { has: offline }));
    }
    expect(pickVariant(list, [0.99], { has: online })).toBe('tree_d');
    expect(pickVariant(list, [0.99], { has: offline, override: 'tree_d' })).toBe('tree_a');
  });
});
