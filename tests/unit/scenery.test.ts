import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { pickWeighted, planFence, treeSetOfAct } from '../../src/render/shared/scenery';

const { data } = loadContentFromDisk();

describe('season tree sets', () => {
  it('act 1 (summer) has no set of its own: the board uses the plain trees', () => {
    expect(treeSetOfAct(data, 1)).toBeNull();
  });
  it('act 2 is autumn, act 3 winter', () => {
    expect(treeSetOfAct(data, 2)!.map((m) => m.model)).toEqual(['autumn_a', 'autumn_b', 'tree_c']);
    expect(treeSetOfAct(data, 3)!.map((m) => m.model)).toEqual(['snowfir_a', 'tree_c']);
  });
  it('an unknown act falls back to summer', () => {
    expect(treeSetOfAct(data, undefined)).toBeNull();
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
