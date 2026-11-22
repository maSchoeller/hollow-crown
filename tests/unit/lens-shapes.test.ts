/** Shapes of the terrain lens (story 16.11): solid tints, two effects split along the diagonal, stripes and hatching stay inside their field. */
import { describe, expect, it } from 'vitest';
import { LENS_SHAPES, lensShapes, type Geo } from '../../src/render/board/shapes';

const look = { fast: { stripe: 0.11, gap: 0.11 }, blocked: { stripe: 0.09, gap: 0.2 } };
const top = () => 0.5;

/** area of all triangles of a shape, seen from above (x east, z north) */
function area(g: Geo): number {
  let a = 0;
  for (let i = 0; i < g.idx.length; i += 3) {
    const [p, q, r] = [0, 1, 2].map((k) => g.idx[i + k]! * 3);
    const [px, pz, qx, qz, rx, rz] = [g.p[p!]!, g.p[p! + 2]!, g.p[q!]!, g.p[q! + 2]!, g.p[r!]!, g.p[r! + 2]!];
    a += Math.abs((qx - px) * (rz - pz) - (rx - px) * (qz - pz)) / 2;
  }
  return a;
}

/** every vertex lies in the square of tile [x, y] */
function inside(g: Geo, x: number, y: number): boolean {
  for (let i = 0; i < g.p.length; i += 3) {
    const [vx, vz] = [g.p[i]!, g.p[i + 2]!];
    if (vx < x - 1e-9 || vx > x + 1 + 1e-9 || vz > -y + 1e-9 || vz < -y - 1 - 1e-9) return false;
  }
  return true;
}

describe('lensShapes', () => {
  it('knows the six shapes in drawing order', () => {
    expect(LENS_SHAPES).toEqual(['neutral', 'cover', 'slow', 'fast', 'harm', 'blocked']);
  });

  it('a solid field is one quad at the height of the field; a field without effect goes to the neutral tint', () => {
    const g = lensShapes([[[2, 3], ['cover']], [[0, 0], []]], top, look);
    expect(area(g.cover)).toBeCloseTo(1);
    expect(g.cover.p.filter((_, i) => i % 3 === 1).every((h) => h > 0.5)).toBe(true);
    expect(area(g.neutral)).toBeCloseTo(1);
    expect(inside(g.cover, 2, 3)).toBe(true);
  });

  it('two effects share the field in halves, the first upper left and the second lower right', () => {
    const g = lensShapes([[[0, 0], ['cover', 'slow']]], top, look);
    expect(area(g.cover)).toBeCloseTo(0.5);
    expect(area(g.slow)).toBeCloseTo(0.5);
    // upper left: the cover half holds the corner (0, 0) = world x 0, z 0, and not the opposite corner (1, 1)
    const has = (g2: Geo, x: number, z: number) => g2.p.some((_, i) => i % 3 === 0 && Math.abs(g2.p[i]! - x) < 1e-9 && Math.abs(g2.p[i + 2]! - z) < 1e-9);
    expect(has(g.cover, 0, 0)).toBe(true);
    expect(has(g.cover, 1, -1)).toBe(false);
    expect(has(g.slow, 1, -1)).toBe(true);
  });

  it('fast is vertical stripes of about its share, blocked a hatching; both stay inside the field', () => {
    const g = lensShapes([[[4, 1], ['fast']], [[6, 1], ['blocked']]], top, look);
    expect(area(g.fast)).toBeGreaterThan(0.4);
    expect(area(g.fast)).toBeLessThan(0.6);
    expect(inside(g.fast, 4, 1)).toBe(true);
    expect(area(g.blocked)).toBeGreaterThan(0.1);
    expect(area(g.blocked)).toBeLessThan(0.5);
    expect(inside(g.blocked, 6, 1)).toBe(true);
  });

  it('a striped effect shares a field too: a fast half of a field with damage holds half of the stripes', () => {
    const whole = area(lensShapes([[[0, 0], ['fast']]], top, look).fast);
    const g = lensShapes([[[0, 0], ['fast', 'harm']]], top, look);
    expect(area(g.fast)).toBeLessThan(whole * 0.75);
    expect(area(g.fast)).toBeGreaterThan(whole * 0.25);
    expect(area(g.harm)).toBeCloseTo(0.5);
  });
});
