import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { mayFade } from '../../src/render/board/fade';
import { connectorRot } from '../../src/render/board/wallKit';
import { connectorProfile, connectorSurface, riseDir } from '../../src/render/shared/connectors';
import { floorOf, terrainGrid } from '../../src/render/shared/terrain3d';

const { data } = loadContentFromDisk();
const board = data.render.board;
const L = board.levelHeight;

/**
 * 3 × 4 map: a terrace on level 1 in the north (row 0), the connector at (1, 1) rising north to it, grass at its foot.
 * `level` lifts the whole map (1-4 has its stairs on level 1, leading to level 2).
 */
function floor(connector: 'ramp' | 'stairs' | 'ladder', level = 0, upper = 'grass') {
  // a ladder is no terrain (fix 2026-11-08): grass at (1, 1) with a ladder leaning against the face of the tile north of it
  const rows = [
    ['grass', upper, 'grass'],
    ['grass', connector === 'ladder' ? 'grass' : connector, 'grass'],
    ['grass', 'grass', 'grass'],
    ['grass', 'grass', 'grass'],
  ];
  const levels: Record<string, number> = {};
  rows.forEach((r, y) => r.forEach((_, x) => (levels[`${x},${y}`] = level + (y === 0 ? 1 : 0))));
  const state = { mapId: 'test', width: 3, height: 4, terrain: rows.flat(), timers: {}, levels } as unknown as BattleState;
  return floorOf(data, terrainGrid(data, state, 7), 3, 4, connector === 'ladder' ? [{ at: [1, 1], up: 'n' }] : []);
}

describe('connector surface (story 15.13)', () => {
  const ramp = { from: 0, to: 1, steps: 0 };
  const stairs = { from: 0, to: 1, steps: 5 };
  const north = [0, -1] as const;

  it('rises along the direction to the higher neighbour', () => {
    expect(connectorSurface(ramp, 0, 1, north, 0, 0.5)).toBeCloseTo(0);
    expect(connectorSurface(ramp, 0, 1, north, 0, 0)).toBeCloseTo(0.5);
    expect(connectorSurface(ramp, 0, 1, north, 0, -0.5)).toBeCloseTo(1);
    // sideways the height stays
    expect(connectorSurface(ramp, 0, 1, north, 0.4, 0)).toBeCloseTo(0.5);
    expect(connectorSurface(ramp, 0, 1, [1, 0], 0.25, 0)).toBeCloseTo(0.75);
  });

  it('carries a figure on the tread under it, step by step', () => {
    const at = (oy: number) => connectorSurface(stairs, 0, 1, north, 0, oy);
    expect(at(0.45)).toBeCloseTo(0.2);
    expect(at(0.25)).toBeCloseTo(0.4);
    expect(at(0)).toBeCloseTo(0.6);
    expect(at(-0.25)).toBeCloseTo(0.8);
    expect(at(-0.5)).toBeCloseTo(1);
    // never falls while climbing
    for (let oy = 0.5; oy > -0.5; oy -= 0.05) expect(at(oy - 0.05)).toBeGreaterThanOrEqual(at(oy));
  });

  it('rises the way connectorRot turns the model, in all four directions', () => {
    // the model rises to the north at rot = pi (wallKit.ts); turned by rot, its rise points that way
    const rotOf: Record<string, number> = { '0,-1': Math.PI, '1,0': -Math.PI / 2, '-1,0': Math.PI / 2, '0,1': 0 };
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [-1, 0],
      [0, 1],
    ] as const) {
      const h = (gx: number, gy: number) => (gx === 1 + dx && gy === 1 + dy ? 1 : 0);
      expect(riseDir(h, 1, 1)).toEqual([dx, dy]);
      expect(connectorRot(h, 1, 1)).toBeCloseTo(rotOf[`${dx},${dy}`]!);
    }
    expect(riseDir(() => 0, 1, 1)).toBeNull();
  });

  it('keeps the flat run in front of a shape that starts later on the ground', () => {
    expect(connectorSurface({ from: 0.3, to: 1, steps: 5 }, 0, 1, north, 0, 0.4)).toBe(0);
  });
});

describe('floor of the board (story 15.13)', () => {
  it('has the shapes of the three connector models in render.yaml', () => {
    expect(Object.keys(board.connectors).sort()).toEqual(['ladder', 'ramp', 'stairs']);
  });

  for (const level of [0, 1])
    it(`puts a figure on the stairs' tread on level ${level}`, () => {
      const f = floor('stairs', level);
      const base = level * L;
      // the middle of the tile is the third of five treads, not the old fixed `stand`
      expect(f.standOn(1, 1)).toBeCloseTo(base + (3 / 5) * L);
      expect(f.surfaceAt(1, 1)).toBeCloseTo(f.standOn(1, 1));
      // the top edge meets the terrace, the bottom edge is the first tread above the grass
      expect(f.surfaceAt(1, 0.5)).toBeCloseTo(f.standOn(1, 0));
      expect(f.standOn(1, 0)).toBeCloseTo(base + L);
      expect(f.surfaceAt(1, 1.49)).toBeCloseTo(base + L / 5);
      expect(f.standOn(1, 2)).toBeCloseTo(base);
    });

  it('walks a figure up the stairs without sinking or floating', () => {
    const f = floor('stairs');
    let last = f.surfaceAt(1, 2);
    for (let y = 2; y >= 0; y -= 0.05) {
      const h = f.surfaceAt(1, y);
      expect(h).toBeGreaterThanOrEqual(last - 1e-9);
      // never more than one tread above the step before
      expect(h - last).toBeLessThanOrEqual(L / 5 + 1e-9);
      last = h;
    }
    expect(last).toBeCloseTo(L);
  });

  it('follows a ramp smoothly from the grass to the terrace', () => {
    const f = floor('ramp');
    expect(f.surfaceAt(1, 1.49)).toBeCloseTo(0, 1);
    expect(f.standOn(1, 1)).toBeCloseTo(L / 2);
    expect(f.surfaceAt(1, 0.75)).toBeCloseTo((3 / 4) * L);
    expect(f.surfaceAt(1, 0.5)).toBeCloseTo(L);
  });

  it('keeps a figure on the ground of the tile in front of a ladder and lifts it along the rungs at the wall', () => {
    const f = floor('ladder');
    expect(f.surfaceAt(1, 1.4)).toBeCloseTo(0);
    // the tile in front is ground: a figure stands on it, and one passing sideways stays down (fix 2026-11-08)
    expect(f.standOn(1, 1)).toBeCloseTo(0);
    expect(f.surfaceAt(0.6, 1)).toBeCloseTo(0);
    expect(f.surfaceAt(1, 0.65)).toBeGreaterThan(0.2 * L);
    expect(f.surfaceAt(1, 0.5)).toBeCloseTo(L);
    expect(f.shapeOf(1, 1).rise?.dir).toEqual([0, -1]);
  });

  it('ends a ladder at the roof edge, not at the ridge a figure stands on up there', () => {
    const f = floor('ladder', 0, 'roof');
    expect(f.surfaceAt(1, 0.51)).toBeCloseTo(L);
    expect(f.standOn(1, 0)).toBeGreaterThan(L);
  });

  it('runs stairs into stairs one level up without a drop', () => {
    // row 0 on level 1 is stairs too (rising further north, off the map: no higher neighbour, so flat)
    const f = floor('stairs', 0, 'stairs');
    expect(f.surfaceAt(1, 0.51)).toBeCloseTo(L);
    expect(f.surfaceAt(1, 0.49)).toBeGreaterThanOrEqual(L);
  });

  it('leaves flat tiles as they were', () => {
    const f = floor('stairs');
    expect(f.surfaceAt(0.3, 2.2)).toBe(f.standOn(0, 2));
    expect(f.surfaceAt(0, 0)).toBeCloseTo(L);
  });
});

describe('the terrain the fog lies on (story 2.6)', () => {
  /** height of a profile at `s` along the rise; on a riser the upper end */
  const heightOf = (profile: ReadonlyArray<readonly [number, number]>, s: number) => {
    let h = profile[0]![1];
    for (let i = 1; i < profile.length; i++) {
      const [s0, h0] = profile[i - 1]!;
      const [s1, h1] = profile[i]!;
      if (s >= s1) h = h1;
      else if (s > s0) h = h0 + ((h1 - h0) * (s - s0)) / (s1 - s0);
    }
    return h;
  };

  for (const [name, shape] of Object.entries(board.connectors))
    it(`follows the surface a figure stands on: ${name}`, () => {
      const profile = connectorProfile(shape, 0.2, 1.05);
      expect(profile[0]).toEqual([0, 0.2]);
      expect(profile.at(-1)).toEqual([1, 1.05]);
      // never back along the rise nor down
      for (let i = 1; i < profile.length; i++) {
        expect(profile[i]![0]).toBeGreaterThanOrEqual(profile[i - 1]![0]);
        expect(profile[i]![1]).toBeGreaterThanOrEqual(profile[i - 1]![1]);
      }
      for (let s = 0.013; s < 1; s += 0.05) expect(heightOf(profile, s)).toBeCloseTo(connectorSurface(shape, 0.2, 1.05, [1, 0], s - 0.5, 0));
    });

  it('gives a stairs tile its treads and risers, rising to the terrace', () => {
    const f = floor('stairs');
    const t = f.shapeOf(1, 1);
    expect(t.height).toBeCloseTo(0);
    expect(t.rise?.dir).toEqual([0, -1]);
    // the foot at the low edge, then five risers, each with its tread (the last one runs to the high edge)
    expect(t.rise?.profile).toHaveLength(1 + 2 * 5);
    expect(t.rise?.profile.at(-1)![1]).toBeCloseTo(L);
  });

  it('gives flat tiles their block height and where a figure stands, the water its surface', () => {
    const f = floor('stairs');
    expect(f.shapeOf(1, 0)).toEqual({ height: L, stand: f.standOn(1, 0), rise: null });
    expect(f.shapeOf(0, 2).rise).toBeNull();
    // beyond the board's skirt: the diorama's bottom
    expect(f.shapeOf(-50, 0).height).toBe(-board.baseDepth);
    const rows = [['shallows', 'grass']];
    const state = { mapId: 'test', width: 2, height: 1, terrain: rows.flat(), timers: {}, levels: {} } as unknown as BattleState;
    const w = floorOf(data, terrainGrid(data, state, 7), 2, 1);
    expect(w.shapeOf(0, 0).stand).toBeCloseTo(Math.max(board.waterLevel, data.terrain.shallows!.height));
    expect(w.shapeOf(0, 0).stand).toBeGreaterThan(w.standOn(0, 0));
  });
});

describe('models that may fade (story 15.13)', () => {
  const solid = board.fade.solid;

  it('never fades the models a figure stands on', () => {
    for (const k of ['stairs_idle', 'ramp_idle', 'ladder_idle']) expect(mayFade(k, solid)).toBe(false);
  });

  it('never fades a boardwalk or footbridge, whose deck a figure crosses', () => {
    // the key is the model name: class `boardwalk`, piece after the last underscore
    for (const k of ['boardwalk_straight', 'boardwalk_corner', 'boardwalk_end']) expect(mayFade(k, solid)).toBe(false);
  });

  it('still fades buildings, roofs, walls and trees', () => {
    for (const k of ['house_a_intact', 'lodge_b_intact', 'roof_idle', 'wallrim_idle', 'tower_idle', 'gatehouse_open', 'tree_a_idle', 'fort_idle', 'massif_a'])
      expect(mayFade(k, solid)).toBe(true);
  });
});
