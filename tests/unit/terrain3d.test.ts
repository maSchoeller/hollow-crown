import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { sameBlocks, splatData, splatFactors, terrainGrid, vnoise, type TerrainGrid } from '../../src/render/shared/terrain3d';

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
  const map = data.maps.m1_2_erlbach!;
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
        expect(['house', 'lodge', 'fort', 'wagon', 'shrine', 'ruins', 'bridge']).not.toContain(def.prop);
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

/** The splat map as it was worked out before story 11.26 (one 25-tap blur, two arrays per texel): the reference for the faster one. */
function splatBefore(grid: TerrainGrid, seed: number): [Uint8Array, Uint8Array] {
  const LAYERS = ['grass', 'dirt', 'road', 'sand', 'ash', 'riverbed', 'peat', 'vault'];
  const PX = 8;
  const w = grid.w * PX;
  const h = grid.h * PX;
  const layers = LAYERS.length;
  const raw = new Float32Array(w * h * layers);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const tx = x / PX;
      const ty = y / PX;
      const own = grid.at(Math.floor(tx), Math.floor(ty));
      const warp = own?.surface === 'road' ? 0.18 : 0.42;
      const nx = tx + (vnoise(tx * 3, ty * 3, seed + 1) - 0.5) * 2 * warp;
      const ny = ty + (vnoise(tx * 3, ty * 3, seed + 2) - 0.5) * 2 * warp;
      const def = grid.at(Math.min(grid.w - 1, Math.max(0, Math.floor(nx))), Math.min(grid.h - 1, Math.max(0, Math.floor(ny))));
      const surface = grid.interior && def?.cliff === 'rock' ? 'vault' : (def?.surface ?? 'grass');
      const li = LAYERS.indexOf(surface);
      raw[(y * w + x) * layers + (li < 0 ? 1 : li)] = 1;
    }
  const soft = new Float32Array(raw.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < layers; c++) {
        let s = 0;
        for (let j = -2; j <= 2; j++)
          for (let i = -2; i <= 2; i++) s += raw[(Math.min(h - 1, Math.max(0, y + j)) * w + Math.min(w - 1, Math.max(0, x + i))) * layers + c]!;
        soft[(y * w + x) * layers + c] = s / 25;
      }
  const a = new Uint8Array(w * h * 4);
  const b = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const f = splatFactors(Array.from(soft.subarray((y * w + x) * layers, (y * w + x + 1) * layers)));
      const k = ((h - 1 - y) * w + x) * 4;
      [a[k], a[k + 1], a[k + 2], a[k + 3]] = [f[0]! * 255, f[1]! * 255, f[2]! * 255, (1 - f[3]!) * 255];
      [b[k], b[k + 1], b[k + 2], b[k + 3]] = [f[4]! * 255, f[5]! * 255, f[6]! * 255, (1 - f[7]!) * 255];
    }
  return [a, b];
}

describe('same blocks (story 11.26)', () => {
  const map = data.maps.m1_2_erlbach!;
  const terrain = map.terrain.trim().split('\n').flatMap((r) => [...r].map((c) => map.legend[c]!));
  const state = { mapId: map.id, width: map.size[0], height: map.size[1], terrain, timers: {} } as unknown as BattleState;
  const grid = (t: string[], timers = {}) => terrainGrid(data, { ...state, terrain: t, timers } as BattleState, 7);
  const forest = terrain.indexOf('forest');
  const at = `${forest % state.width},${Math.floor(forest / state.width)}`;
  const swap = (id: string) => terrain.map((t, i) => (i === forest ? id : t));

  it('lets a fire catch and burn out without a rebuild: only the ground and the props change', () => {
    const g0 = grid(terrain);
    expect(sameBlocks(g0, grid(swap('burning'), { [at]: { kind: 'burning', turns: 2, revertTo: 'forest' } }))).toBe(true);
    expect(sameBlocks(g0, grid(swap('ash')))).toBe(true);
  });

  it('rebuilds when a block changes: a height, a cliff or water', () => {
    const g0 = grid(terrain);
    expect(sameBlocks(g0, grid(swap('mountain')))).toBe(false);
    const water = Object.values(data.terrain).find((d) => d.water)!.id;
    expect(sameBlocks(g0, grid(swap(water)))).toBe(false);
    const raised = terrainGrid(data, { ...state, levels: { [at]: 2 } } as unknown as BattleState, 7);
    expect(sameBlocks(g0, raised)).toBe(false);
  });
});

describe('splat map (story 11.26)', () => {
  it('is byte for byte the map of before, also when a rebuild reuses the warp noise', () => {
    const map = data.maps.m1_2_erlbach!;
    const terrain = map.terrain.trim().split('\n').flatMap((r) => [...r].map((c) => map.legend[c]!));
    const state = { mapId: map.id, width: map.size[0], height: map.size[1], terrain, timers: {} } as unknown as BattleState;
    const grid = terrainGrid(data, state, 7);
    const [a0, b0] = splatBefore(grid, 7);
    const [a1, b1] = splatData(grid, 7);
    expect(Buffer.from(a1).equals(Buffer.from(a0))).toBe(true);
    expect(Buffer.from(b1).equals(Buffer.from(b0))).toBe(true);
    // the same size and seed again (a fire changed a tile): the cached noise gives the same as working it out anew
    const burnt = [...terrain];
    burnt[terrain.indexOf('forest')] = 'ash';
    const grid2 = terrainGrid(data, { ...state, terrain: burnt } as BattleState, 7);
    expect(Buffer.from(splatData(grid2, 7)[0]).equals(Buffer.from(splatBefore(grid2, 7)[0]))).toBe(true);
  });
});
