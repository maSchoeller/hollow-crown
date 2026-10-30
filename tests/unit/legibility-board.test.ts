/** Board side of epic 13: shapes of the markings (outer edge, dashes, grid marks, range tiles, arrow) and the HP bar rules. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { GameData } from '../../src/core';
import { arrow, dashes, geo, gridTile, outerEdges, roundedTile } from '../../src/render/board/shapes';
import { barLook, barShown } from '../../src/render/board/badges';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('outer edge of a set of tiles (stories 13.2, 13.5)', () => {
  it('gives the four sides of a single tile', () => {
    expect(outerEdges(new Set(['2,3']))).toHaveLength(4);
  });

  it('leaves out the sides two tiles of the set share', () => {
    const segs = outerEdges(new Set(['0,0', '1,0']));
    expect(segs).toHaveLength(6);
    expect(segs.some((s) => s.a[0] === 1 && s.b[0] === 1 && s.tile[0] === 0)).toBe(false);
  });

  it('runs round a hole, too', () => {
    const ring = new Set<string>();
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) if (x !== 1 || y !== 1) ring.add(`${x},${y}`);
    // 12 outside, 4 round the hole
    expect(outerEdges(ring)).toHaveLength(16);
  });
});

describe('dashes (stories 13.5, 13.6)', () => {
  it('cuts a line into dashes with gaps, the last one ending at the line end', () => {
    const d = dashes([0, 0], [1, 0], 0.2, 0.1);
    expect(d).toHaveLength(4);
    expect(d[0]).toEqual([[0, 0], [0.2, 0]]);
    expect(d[3]![1][0]).toBeCloseTo(1);
  });

  it('gives nothing for a line of no length', () => {
    expect(dashes([1, 1], [1, 1], 0.2, 0.1)).toEqual([]);
  });
});

describe('grid marks (story 13.1)', () => {
  it('draws eight arm pieces per tile when subtle and four side strokes when strong, at the tile height', () => {
    const g = geo();
    gridTile(g, [0, 0], 0.5, 'subtle', 0.03, 0.12);
    expect(g.idx.length / 6).toBe(8);
    expect(new Set(g.p.filter((_, i) => i % 3 === 1))).toEqual(new Set([0.5]));
    const s = geo();
    gridTile(s, [0, 0], 0, 'strong', 0.02, 0.12);
    expect(s.idx.length / 6).toBe(4);
  });

  it('keeps every stroke inside its own tile, so neighbours never draw over each other', () => {
    const g = geo();
    gridTile(g, [3, 2], 0, 'subtle', 0.04, 0.15);
    const xs = g.p.filter((_, i) => i % 3 === 0);
    const zs = g.p.filter((_, i) => i % 3 === 2);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...xs)).toBeLessThanOrEqual(4);
    expect(Math.max(...zs)).toBeLessThanOrEqual(-2);
    expect(Math.min(...zs)).toBeGreaterThanOrEqual(-3);
  });
});

describe('range tiles and path arrow (story 13.2)', () => {
  it('draws a tile smaller by the gap with rounded corners', () => {
    const g = geo();
    roundedTile(g, [1, 1], 0, 0.06, 0.14);
    const xs = g.p.filter((_, i) => i % 3 === 0);
    expect(Math.min(...xs)).toBeCloseTo(1.03);
    expect(Math.max(...xs)).toBeCloseTo(1.97);
    expect(g.idx.length % 3).toBe(0);
  });

  it('puts the arrow head past the centre of the goal tile', () => {
    const g = geo();
    arrow(g, [[0, 0], [1, 0], [2, 0]], () => 0, 0.03, 0.17, 0.42, 0.36);
    const xs = g.p.filter((_, i) => i % 3 === 0);
    expect(Math.max(...xs)).toBeGreaterThan(2.5);
    expect(Math.max(...xs)).toBeLessThan(3);
    const none = geo();
    arrow(none, [[0, 0]], () => 0, 0, 0.17, 0.42, 0.36);
    expect(none.p).toEqual([]);
  });
});

describe('HP bar (story 13.3)', () => {
  it('has the values of render.yaml: ticks per 5 HP, per 10 from 40, critical under 25 %', () => {
    expect(data.render.legibility.hpBar).toMatchObject({ tick: 5, tickWide: 10, wideFrom: 40, critical: 0.25 });
  });

  it('ticks every 5 HP below 40 max. HP and every 10 from 40', () => {
    const look = data.render.legibility.hpBar;
    expect(barLook(look, 20, 30).tick).toBeCloseTo(5 / 30);
    expect(barLook(look, 20, 40).tick).toBeCloseTo(10 / 40);
  });

  it('is critical under the share, never at 0', () => {
    const look = data.render.legibility.hpBar;
    expect(barLook(look, 7, 30).critical).toBe(true);
    expect(barLook(look, 8, 30).critical).toBe(false);
    expect(barLook(look, 0, 30).critical).toBe(false);
    expect(barLook(look, 40, 30).share).toBe(1);
  });

  it('shows by the option: always, only hurt (lieutenants always), off', () => {
    const full = { team: 'enemy' as const, hp: 20, maxHp: 20, lieutenant: false };
    expect(barShown('always', full)).toBe(true);
    expect(barShown('hurt', full)).toBe(false);
    expect(barShown('hurt', { ...full, hp: 19 })).toBe(true);
    expect(barShown('hurt', { ...full, lieutenant: true })).toBe(true);
    expect(barShown('off', { ...full, hp: 1 })).toBe(false);
  });
});
