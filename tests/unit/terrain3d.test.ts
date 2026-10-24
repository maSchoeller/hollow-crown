import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { splatFactors, terrainGrid } from '../../src/render/shared/terrain3d';

const { data } = loadContentFromDisk();

/** Replays MixMaterial's successive blending with constant colours per layer. */
function blend(factors: number[], colours: number[]): number {
  let c = colours[0]! * factors[0]!;
  for (let i = 1; i < factors.length; i++) c = c + (colours[i]! - c) * factors[i]!;
  return c;
}

describe('splat factors (D6)', () => {
  it('turn layer weights into the successive blend of MixMaterial', () => {
    const colours = [10, 20, 40, 80, 160, 320];
    for (const w of [
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0.5, 0.5, 0, 0, 0, 0],
      [0.2, 0.3, 0.1, 0.25, 0.05, 0.1],
    ]) {
      const expected = w.reduce((s, x, i) => s + x * colours[i]!, 0);
      expect(blend(splatFactors(w), colours)).toBeCloseTo(expected);
    }
  });
});

describe('terrain grid', () => {
  const map = data.maps.ch01_varnhold!;
  const rows = map.terrain.trim().split('\n');
  const terrain = rows.flatMap((r) => [...r].map((c) => map.legend[c]!));
  const state = { mapId: map.id, width: map.size[0], height: map.size[1], terrain, timers: {} } as unknown as BattleState;

  it('keeps the map and surrounds it with scenery', () => {
    const g = terrainGrid(data, state, 7);
    const s = data.render.board.skirt;
    expect(g.w).toBe(state.width + 2 * s);
    expect(g.h).toBe(state.height + 2 * s);
    for (let y = 0; y < state.height; y++)
      for (let x = 0; x < state.width; x++) expect(g.ids[(y + s) * g.w + x + s]).toBe(terrain[y * state.width + x]);
    expect(g.inMap(s, s)).toBe(true);
    expect(g.inMap(s - 1, s)).toBe(false);
  });

  it('never puts buildings or walls into the scenery, but lets rivers run on', () => {
    const g = terrainGrid(data, state, 7);
    const riverRows = new Set<number>();
    for (let gy = 0; gy < g.h; gy++)
      for (let gx = 0; gx < g.w; gx++) {
        if (g.inMap(gx, gy)) continue;
        const def = g.at(gx, gy)!;
        expect(def.cliff).not.toBe('wall');
        expect(['house', 'fort', 'wagon', 'shrine', 'ruins', 'bridge']).not.toContain(def.prop);
        if (def.water) riverRows.add(gy);
      }
    // Varnhold's river crosses the map from west to east, so it continues into the scenery
    expect(riverRows.size).toBeGreaterThan(0);
  });

  it('shows the terrain a burning tile will turn back into', () => {
    const forest = terrain.indexOf('forest');
    const burning = [...terrain];
    burning[forest] = 'burning';
    const x = forest % state.width;
    const y = Math.floor(forest / state.width);
    const st = { ...state, terrain: burning, timers: { [`${x},${y}`]: { kind: 'burning', turns: 2, revertTo: 'forest' } } } as unknown as BattleState;
    const g = terrainGrid(data, st, 7);
    expect(g.ids[(y + g.skirt) * g.w + x + g.skirt]).toBe('forest');
  });
});
