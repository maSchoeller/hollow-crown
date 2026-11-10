/**
 * Terrain of the 3D board (concept/01-decisions.md D1, D3, D6, D10): tile blocks with painted ground
 * blended by a splat map, cliff faces, wall caps, sunk water and darkened scenery around the map.
 *
 * World space: tile (x, y) spans x…x+1 and −y−1…−y on the ground (north = +Z), its top at the
 * terrain height (tiles). Scenery tiles extend the map by `render.board.skirt` on every side.
 */
import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MixMaterial } from '@babylonjs/materials/mix/mixMaterial';
import { DIR_STEP, type BattleState, type GameData, type LadderDef, type TerrainDef, type TerrainSurface, type TerrainWaterLook } from '../../core';
import type { AssetStore } from '../host';
import { BOARDWALK_DECK } from '../board/wallKit';
import { connectorProfile, connectorSurface, riseDir } from './connectors';
import { battleSeason, seasonGround } from '../../content/season';
import { addSnow } from './snow';

/** Ground textures by name (tools/art/ground.py). */
export type GroundTextures = Record<string, Texture>;

export const GROUND_TEXTURES = ['grass', 'dirt', 'road', 'sand', 'ash', 'riverbed', 'stone', 'wall', 'earth_side', 'rock_side', 'rock_top', 'planks', 'peat', 'vault', 'water_0', 'water_1', 'water_2', 'water_3', 'mire_0', 'mire_1', 'mire_2', 'creek_0', 'creek_1', 'creek_2'];

/**
 * The ground textures from the shared cache (loaded once for board and world map, story 5.1), plus `extra` ones: the season's ground of
 * the board shown (story 15.15, `seasonTextures`), so the other seasons' textures are never downloaded.
 */
export async function loadGroundTextures(store: AssetStore, extra: readonly string[] = []): Promise<GroundTextures> {
  const names = [...new Set([...GROUND_TEXTURES, ...extra])];
  const list = await Promise.all(names.map((name) => store.texture(`ground/${name}.png`)));
  return Object.fromEntries(names.map((name, i) => [name, list[i]!]));
}

// ------------------------------------------------------------------ noise (deterministic, render only)

export function hash3(x: number, y: number, z: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function vnoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const h = (i: number, j: number) => (hash3(i, j, seed) & 0xffff) / 65535;
  const s = (t: number) => t * t * (3 - 2 * t);
  const a = h(xi, yi);
  const b = h(xi + 1, yi);
  const c = h(xi, yi + 1);
  const d = h(xi + 1, yi + 1);
  const u = s(xf);
  const v = s(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// ------------------------------------------------------------------ terrain grid

/** What the terrain needs of a map: its size and tiles (a battle state; the world map's layout has the same shape). */
export type TerrainSource = Pick<BattleState, 'width' | 'height' | 'terrain' | 'timers' | 'levels'>;

/** Terrain ids of map + scenery skirt, row-major, (W + 2·skirt) × (H + 2·skirt). */
export interface TerrainGrid {
  w: number;
  h: number;
  skirt: number;
  ids: string[];
  /** the map lies under a roof: rock all around, stone under the rock */
  interior: boolean;
  at(gx: number, gy: number): TerrainDef | undefined;
  inMap(gx: number, gy: number): boolean;
}

const SKIRT_FLAT = new Set(['tree', 'rock']);

/** Visible terrain per tile: burning tiles show what burns; the skirt continues the map's edges as wild land. */
export function terrainGrid(data: GameData, state: BattleState, seed: number): TerrainGrid {
  const s = data.render.board.skirt;
  const w = state.width + 2 * s;
  const h = state.height + 2 * s;
  const mapId = (x: number, y: number) => {
    let t = state.terrain[y * state.width + x]!;
    if (t === 'burning') t = state.timers[`${x},${y}`]?.revertTo ?? t;
    return t;
  };
  const wild = ['forest', 'mountain', 'grass'].every((t) => data.terrain[t]);
  const interior = !!data.maps[state.mapId]?.interior && !!data.terrain.mountain;
  const ids: string[] = [];
  for (let gy = 0; gy < h; gy++)
    for (let gx = 0; gx < w; gx++) {
      const x = gx - s;
      const y = gy - s;
      if (x >= 0 && y >= 0 && x < state.width && y < state.height) {
        ids.push(mapId(x, y));
        continue;
      }
      // under a roof the rock simply goes on
      if (interior) {
        ids.push('mountain');
        continue;
      }
      let t = mapId(Math.min(Math.max(x, 0), state.width - 1), Math.min(Math.max(y, 0), state.height - 1));
      const def = data.terrain[t];
      // a moor runs on as a moor, its boardwalks stay on the map
      if (def?.water && def.surface === 'peat') {
        ids.push(def.prop ? 'creek' : t);
        continue;
      }
      if (def?.water && def.surface === 'riverbed') {
        // rivers run on; bridges and fords belong to the map only
        ids.push(Object.values(data.terrain).find((d) => d.water && d.surface === 'riverbed' && !d.prop)?.id ?? t);
        continue;
      }
      if (!wild || !def || def.cliff === 'wall' || (def.prop && !SKIRT_FLAT.has(def.prop)) || def.water) t = wild ? 'grass' : t;
      if (wild) {
        const r = hash3(gx, gy, seed) % 100;
        // a massif at the map's edge runs on as a massif; single raised blocks in the meadow read as crates
        if (def?.id === 'mountain') t = r < 88 ? 'mountain' : 'forest';
        else if (r < 30) t = 'forest';
        else if (r < 70) t = 'grass';
      }
      ids.push(t);
    }
  return {
    w,
    h,
    skirt: s,
    ids,
    interior,
    at: (gx, gy) => {
      if (gx < 0 || gy < 0 || gx >= w || gy >= h) return undefined;
      const def = data.terrain[ids[gy * w + gx]!];
      // a tile a map raises stands that many levels above its terrain
      const level = state.levels?.[`${gx - s},${gy - s}`];
      if (!def || level === undefined || level === def.level) return def;
      return { ...def, level, height: def.height + (level - def.level) * data.render.board.levelHeight };
    },
    inMap: (gx, gy) => gx >= s && gy >= s && gx < s + state.width && gy < s + state.height,
  };
}

/** Where feet stand on the board: per tile and, on ramps, stairs and the foot of a ladder, per point of the tile (story 15.13). */
/** Props whose tile carries a deck (`floorOf`): they shape where a figure stands, so they belong to the blocks. */
const DECK_PROPS = new Set(['bridge', 'boardwalk']);

/**
 * Story 11.26: whether two grids build the same blocks, so a terrain change (a fire that catches or burns out, ash) only repaints
 * the ground and its props instead of rebuilding every mesh of a 30 × 40 map (1–2 s at 2× CPU throttling). Compares what the
 * geometry, the floor and the water read: height (with a map's level), standing height, cliff, water and its look, connector
 * and a deck prop; the surface (splat map) and other props may differ.
 */
export function sameBlocks(a: TerrainGrid, b: TerrainGrid): boolean {
  if (a.w !== b.w || a.h !== b.h || a.skirt !== b.skirt || a.interior !== b.interior) return false;
  for (let gy = 0; gy < a.h; gy++)
    for (let gx = 0; gx < a.w; gx++) {
      const p = a.at(gx, gy);
      const q = b.at(gx, gy);
      if (p === q) continue;
      if (!p || !q) return false;
      if (p.height !== q.height || p.stand !== q.stand || p.cliff !== q.cliff || p.water !== q.water || p.waterLook !== q.waterLook || p.connector !== q.connector) return false;
      if ((DECK_PROPS.has(p.prop ?? '') || DECK_PROPS.has(q.prop ?? '')) && p.prop !== q.prop) return false;
    }
  return true;
}

export interface Floor {
  /** where a unit's feet are on map tile (x, y): bridges carry their deck, water its surface, a connector its middle */
  standOn(x: number, y: number): number;
  /** the same at a point between tiles (x, y in tiles, whole numbers = tile centres): a connector's surface under it */
  surfaceAt(x: number, y: number): number;
  /** the block of map tile (x, y), off the map too (story 2.6: the fog lies on it like on the terrain) */
  shapeOf(x: number, y: number): TileShape;
}

/** The terrain block of a tile: its cliff faces end at `height`, its top lies at `stand`, on a connector along `rise.profile`. */
export interface TileShape {
  /** height of the block: its cliff faces run from here down to a lower neighbour's */
  height: number;
  /** where its flat top is: where a figure stands (`standOn`, a bridge's deck), on water its surface */
  stand: number;
  /** a ramp, stairs or the foot of a ladder: direction of the rise (map tiles, x east, y south) and its surface from the low edge (0) to the high edge (1) */
  rise: { dir: readonly [number, number]; profile: ReadonlyArray<readonly [number, number]> } | null;
}

export function floorOf(data: GameData, grid: TerrainGrid, width: number, height: number, ladders: readonly LadderDef[] = []): Floor {
  const board = data.render.board;
  const S = grid.skirt;
  // the foot of a ladder (fix 2026-11-08) is flat ground; only in front of the wall, under the rungs, do the feet climb to the tile above
  const ladderAt = new Map<number, LadderDef>();
  for (const l of ladders) if (!ladderAt.has((l.at[1] + S) * grid.w + l.at[0] + S)) ladderAt.set((l.at[1] + S) * grid.w + l.at[0] + S, l);
  const flat = (def: TerrainDef) => {
    if (def.prop === 'bridge') return 0.02;
    if (def.prop === 'boardwalk') return BOARDWALK_DECK;
    return def.water ? Math.max(def.height, board.waterLevel - 0.05) : def.height + def.stand;
  };
  // a connector's rise per tile, worked out once: placing a figure asks every frame
  const rises = new Map<number, { dir: [number, number]; top: number } | null>();
  const riseOf = (gx: number, gy: number) => {
    const k = gy * grid.w + gx;
    let r = rises.get(k);
    if (r === undefined) {
      const ladder = ladderAt.get(k);
      const dir = ladder ? ([...DIR_STEP[ladder.up]] as [number, number]) : riseDir((ax, ay) => grid.at(ax, ay)?.height ?? 0, gx, gy);
      // the model ends one level up, at the higher tile's top: a roof's ridge (`stand`) or the next connector's foot start there
      r = dir ? { dir, top: grid.at(gx + dir[0], gy + dir[1])!.height } : null;
      rises.set(k, r);
    }
    return r;
  };
  const shapeAt = (x: number, y: number, def: TerrainDef) =>
    def.connector ? board.connectors[def.connector] : ladderAt.has((y + S) * grid.w + x + S) ? board.connectors.ladder : undefined;
  const surface = (x: number, y: number, ox: number, oy: number): number => {
    const def = grid.at(x + S, y + S);
    if (!def) return 0;
    const shape = shapeAt(x, y, def);
    const rise = shape ? riseOf(x + S, y + S) : null;
    if (!shape || !rise) return flat(def);
    return connectorSurface(shape, flat(def), rise.top, rise.dir, ox, oy);
  };
  return {
    standOn: (x, y) => surface(x, y, 0, 0),
    surfaceAt: (x, y) => {
      const tx = Math.min(Math.max(Math.round(x), 0), width - 1);
      const ty = Math.min(Math.max(Math.round(y), 0), height - 1);
      return surface(tx, ty, Math.min(0.5, Math.max(-0.5, x - tx)), Math.min(0.5, Math.max(-0.5, y - ty)));
    },
    shapeOf: (x, y) => {
      const def = grid.at(x + S, y + S);
      if (!def) return { height: -board.baseDepth, stand: -board.baseDepth, rise: null };
      const shape = shapeAt(x, y, def);
      const rise = shape ? riseOf(x + S, y + S) : null;
      // water: on its surface, not where feet sink in (that lies under the water and its fog would not show)
      const stand = def.water ? Math.max(flat(def), board.waterLevel) : flat(def);
      return { height: def.height, stand, rise: shape && rise ? { dir: rise.dir, profile: connectorProfile(shape, flat(def), rise.top) } : null };
    },
  };
}

// ------------------------------------------------------------------ geometry

class Geo {
  p: number[] = [];
  n: number[] = [];
  u: number[] = [];
  i: number[] = [];
  quad(a: number[], b: number[], c: number[], d: number[], n: number[], uv: number[]): void {
    const o = this.p.length / 3;
    this.p.push(...a, ...b, ...c, ...d);
    for (let k = 0; k < 4; k++) this.n.push(n[0]!, n[1]!, n[2]!);
    this.u.push(...uv);
    this.i.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  /** Horizontal quad over the tile whose north-west corner is (x, −y). */
  flat(x: number, y: number, top: number, uv: number[], inset = 0): void {
    const x0 = x + inset;
    const x1 = x + 1 - inset;
    const zn = -y - inset;
    const zs = -y - 1 + inset;
    this.quad([x0, top, zn], [x1, top, zn], [x1, top, zs], [x0, top, zs], [0, 1, 0], uv);
  }
  mesh(name: string, scene: Scene, material: StandardMaterial | MixMaterial): Mesh | null {
    if (!this.i.length) return null;
    const m = new Mesh(name, scene);
    const vd = new VertexData();
    vd.positions = this.p;
    vd.normals = this.n;
    vd.uvs = this.u;
    vd.indices = this.i;
    vd.applyToMesh(m);
    m.material = material;
    m.receiveShadows = true;
    m.isPickable = false;
    m.freezeWorldMatrix();
    // static: always drawn, bounding box not kept in step (story 7.7)
    m.alwaysSelectAsActiveMesh = true;
    m.doNotSyncBoundingInfo = true;
    return m;
  }
}

// neighbours: dx, dy (south +), outward normal in world space
const SIDES: Array<[number, number, number[]]> = [
  [0, -1, [0, 0, 1]],
  [1, 0, [1, 0, 0]],
  [0, 1, [0, 0, -1]],
  [-1, 0, [-1, 0, 0]],
];

// splat layers: mix map 1 (R, G, B, 1 − A) and mix map 2 (R, G, B, 1 − A)
const SPLAT_LAYERS: TerrainSurface[] = ['grass', 'dirt', 'road', 'sand', 'ash', 'riverbed', 'peat', 'vault'];
const SPLAT_PX = 8; // splat texels per tile

/**
 * MixMaterial blends its textures one after another (lerp), not as a weighted sum. Turns layer weights
 * (summing to 1) into those successive blend factors.
 */
export function splatFactors(weights: number[]): number[] {
  const out: number[] = [];
  let sum = 0;
  weights.forEach((w, i) => {
    sum += w;
    out.push(i === 0 ? 1 : sum > 1e-6 ? w / sum : 0);
  });
  return out;
}

/** The warp noise of the splat map, per texel (two values: x and y); it depends on the size and seed only, so a rebuild (fire) reuses it. */
let warpCache: { key: string; n: Float64Array } | null = null;
function warpNoise(w: number, h: number, seed: number): Float64Array {
  const key = `${w}x${h}:${seed}`;
  if (warpCache?.key === key) return warpCache.n;
  const n = new Float64Array(w * h * 2);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const tx = x / SPLAT_PX;
      const ty = y / SPLAT_PX;
      n[(y * w + x) * 2] = (vnoise(tx * 3, ty * 3, seed + 1) - 0.5) * 2;
      n[(y * w + x) * 2 + 1] = (vnoise(tx * 3, ty * 3, seed + 2) - 0.5) * 2;
    }
  warpCache = { key, n };
  return n;
}

/**
 * The two mix maps of the top faces as RGBA bytes (`grid.w` × `grid.h` tiles at `SPLAT_PX` texels each). Pure, for the test; on a
 * 30 × 40 map with its skirt that is 400 × 480 texels, worked out again on every terrain change (story 11.26 made it cheaper).
 */
export function splatData(grid: TerrainGrid, seed: number): [Uint8Array, Uint8Array] {
  const w = grid.w * SPLAT_PX;
  const h = grid.h * SPLAT_PX;
  const layers = SPLAT_LAYERS.length;
  const noise = warpNoise(w, h, seed);
  // per tile, once (story 11.26; `grid.at` per texel was half the time): its splat layer and how far its edge is warped
  const tiles = grid.w * grid.h;
  const layerOf = new Uint8Array(tiles);
  const warpOf = new Float64Array(tiles);
  for (let gy = 0; gy < grid.h; gy++)
    for (let gx = 0; gx < grid.w; gx++) {
      const def = grid.at(gx, gy);
      const surface = grid.interior && def?.cliff === 'rock' ? 'vault' : (def?.surface ?? 'grass');
      const li = SPLAT_LAYERS.indexOf(surface);
      layerOf[gy * grid.w + gx] = li < 0 ? 1 : li;
      // roads keep crisper edges than grass or sand
      warpOf[gy * grid.w + gx] = def?.surface === 'road' ? 0.18 : 0.42;
    }
  const raw = new Float32Array(w * h * layers);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const tx = x / SPLAT_PX;
      const ty = y / SPLAT_PX;
      const warp = warpOf[Math.floor(ty) * grid.w + Math.floor(tx)]!;
      const nx = tx + noise[(y * w + x) * 2]! * warp;
      const ny = ty + noise[(y * w + x) * 2 + 1]! * warp;
      const gx = Math.min(grid.w - 1, Math.max(0, Math.floor(nx)));
      const gy = Math.min(grid.h - 1, Math.max(0, Math.floor(ny)));
      raw[(y * w + x) * layers + layerOf[gy * grid.w + gx]!] = 1;
    }
  // soften the edges (one 5 × 5 box blur, edges clamped). Story 11.26: two passes (rows, then columns) with a running sum of the
  // five texels, the same sums (whole numbers, exact in floats) with 2 instead of 25 reads per texel
  const clampX = (x: number) => Math.min(w - 1, Math.max(0, x));
  const clampY = (y: number) => Math.min(h - 1, Math.max(0, y));
  const across = new Float32Array(raw.length);
  for (let y = 0; y < h; y++)
    for (let c = 0; c < layers; c++) {
      const at = (x: number) => raw[(y * w + clampX(x)) * layers + c]!;
      let sum = at(-2) + at(-1) + at(0) + at(1) + at(2);
      for (let x = 0; x < w; x++) {
        across[(y * w + x) * layers + c] = sum;
        sum += at(x + 3) - at(x - 2);
      }
    }
  const soft = new Float32Array(raw.length);
  for (let x = 0; x < w; x++)
    for (let c = 0; c < layers; c++) {
      const at = (y: number) => across[(clampY(y) * w + x) * layers + c]!;
      let sum = at(-2) + at(-1) + at(0) + at(1) + at(2);
      for (let y = 0; y < h; y++) {
        soft[(y * w + x) * layers + c] = sum / 25;
        sum += at(y + 3) - at(y - 2);
      }
    }
  const a = new Uint8Array(w * h * 4);
  const b = new Uint8Array(w * h * 4);
  // the blend factors of `splatFactors`, worked out in place (story 11.26: no two arrays per texel)
  const f = new Float64Array(layers);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let c = 0; c < layers; c++) {
        const wt = soft[(y * w + x) * layers + c]!;
        sum += wt;
        f[c] = c === 0 ? 1 : sum > 1e-6 ? wt / sum : 0;
      }
      // rows flipped: v = 1 is the northern edge of the top faces
      const k = ((h - 1 - y) * w + x) * 4;
      a[k] = f[0]! * 255;
      a[k + 1] = f[1]! * 255;
      a[k + 2] = f[2]! * 255;
      a[k + 3] = (1 - f[3]!) * 255;
      b[k] = f[4]! * 255;
      b[k + 1] = f[5]! * 255;
      b[k + 2] = f[6]! * 255;
      b[k + 3] = (1 - f[7]!) * 255;
    }
  return [a, b];
}

function splatTextures(scene: Scene, grid: TerrainGrid, seed: number): [RawTexture, RawTexture] {
  const w = grid.w * SPLAT_PX;
  const h = grid.h * SPLAT_PX;
  const [a, b] = splatData(grid, seed);
  const mk = (data: Uint8Array) => {
    const t = RawTexture.CreateRGBATexture(data, w, h, scene, false, false, Texture.BILINEAR_SAMPLINGMODE);
    t.wrapU = t.wrapV = Texture.CLAMP_ADDRESSMODE;
    return t;
  };
  return [mk(a), mk(b)];
}

// ------------------------------------------------------------------ build

export interface TerrainView extends Floor {
  grid: TerrainGrid;
  /**
   * Story 11.26: shows `grid`, which builds the same blocks (`sameBlocks`), by writing the ground's splat maps anew; the meshes,
   * the floor and the water stay. The caller rebuilds the props if they changed.
   */
  repaint(grid: TerrainGrid): void;
  /** shadow casters among the terrain meshes */
  casters: Mesh[];
  /** top height of map tile (x, y), null outside the map */
  topOf(x: number, y: number): number | null;
  /** advances the water animation */
  tick(now: number): void;
  /** wet shine of the ground (rain, story 8.6): specular strength and power of the block materials; null restores them */
  setWet(wet: { specular: number; power: number } | null): void;
  dispose(): void;
}

function material(scene: Scene, name: string, tex: Texture | undefined): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseTexture = tex ?? null;
  m.specularColor = new Color3(0.03, 0.03, 0.03);
  m.backFaceCulling = false;
  return m;
}

export function buildTerrain(scene: Scene, data: GameData, state: BattleState, tex: GroundTextures, seed: number, maxLights: number): TerrainView {
  const board = data.render.board;
  const grid = terrainGrid(data, state, seed);
  const S = grid.skirt;
  const top = (gx: number, gy: number) => grid.at(gx, gy)?.height ?? -board.baseDepth;
  const wx = (gx: number) => gx - S;
  const wy = (gy: number) => gy - S;

  const tops = new Geo();
  const caps = new Geo();
  const rockCaps = new Geo();
  const sides: Record<string, Geo> = { earth: new Geo(), rock: new Geo(), wall: new Geo() };
  const water: Record<TerrainWaterLook, Geo> = { clear: new Geo(), mire: new Geo(), creek: new Geo() };
  const veil = new Geo();
  const decks = new Geo();
  for (let gy = 0; gy < grid.h; gy++)
    for (let gx = 0; gx < grid.w; gx++) {
      const def = grid.at(gx, gy)!;
      const h = def.height;
      const x = wx(gx);
      const y = wy(gy);
      if (def.cliff === 'wall') caps.flat(x, y, h, [x / 2, -y / 2, (x + 1) / 2, -y / 2, (x + 1) / 2, (-y - 1) / 2, x / 2, (-y - 1) / 2]);
      else if (def.cliff === 'rock') rockCaps.flat(x, y, h, [x / 2, -y / 2, (x + 1) / 2, -y / 2, (x + 1) / 2, (-y - 1) / 2, x / 2, (-y - 1) / 2]);
      else {
        const u0 = gx / grid.w;
        const u1 = (gx + 1) / grid.w;
        const vt = 1 - gy / grid.h;
        const vb = 1 - (gy + 1) / grid.h;
        tops.flat(x, y, h, [u0, vt, u1, vt, u1, vb, u0, vb]);
      }
      if (def.water) water[def.waterLook].flat(x, y, board.waterLevel, [x / 2, -y / 2, (x + 1) / 2, -y / 2, (x + 1) / 2, (-y - 1) / 2, x / 2, (-y - 1) / 2]);
      if (def.prop === 'bridge') decks.flat(x, y, 0.02, [0, 1, 1, 1, 1, 0, 0, 0]);
      if (!grid.inMap(gx, gy)) {
        const vy = Math.max(h, def.water ? board.waterLevel : h) + 0.012;
        veil.flat(x, y, vy, [0, 1, 1, 1, 1, 0, 0, 0]);
      }
      for (const [dx, dy, n] of SIDES) {
        const hn = top(gx + dx, gy + dy);
        if (hn >= h) continue;
        // edge corners, counter-clockwise seen from outside
        const ex = dx === 0 ? null : x + (dx > 0 ? 1 : 0);
        const ez = dy === 0 ? null : -y - (dy > 0 ? 1 : 0);
        const a = ez !== null ? [dy > 0 ? x : x + 1, ez] : [ex!, dx > 0 ? -y - 1 : -y];
        const b = ez !== null ? [dy > 0 ? x + 1 : x, ez] : [ex!, dx > 0 ? -y : -y - 1];
        sides[def.cliff]!.quad([a[0]!, h, a[1]!], [b[0]!, h, b[1]!], [b[0]!, hn, b[1]!], [a[0]!, hn, a[1]!], n, [0, h, 1, h, 1, hn, 0, hn]);
      }
    }

  const meshes: Mesh[] = [];
  const casters: Mesh[] = [];
  /** the block materials that shine when wet, with the specular values they were made with */
  const wetMats: Array<{ m: StandardMaterial | MixMaterial; colour: Color3; power: number }> = [];
  const [mix1, mix2] = splatTextures(scene, grid, seed);
  const mix = new MixMaterial('terrain-tops', scene);
  mix.mixTexture1 = mix1;
  mix.mixTexture2 = mix2;
  // the season's ground (story 15.15) swaps the texture of a layer, never the layer: a tile keeps its surface and its look of the rules
  const map = data.maps[state.mapId];
  const season = map ? battleSeason(data.render, map, state) : 'summer';
  const layer = (k: number, surface: string) => {
    const name = seasonGround(data.render, season, surface, !!map?.interior);
    const t = (tex[name] ?? tex[surface]!).clone();
    t.uScale = grid.w / 2;
    t.vScale = grid.h / 2;
    (mix as unknown as Record<string, Texture>)[`diffuseTexture${k}`] = t;
  };
  SPLAT_LAYERS.forEach((s, i) => layer(i + 1, s));
  mix.specularColor = new Color3(0.03, 0.03, 0.03);
  mix.backFaceCulling = false;
  mix.maxSimultaneousLights = maxLights + 2;
  const add = (g: Geo, name: string, mat: StandardMaterial | MixMaterial, cast = false) => {
    const m = g.mesh(name, scene, mat);
    if (!m) return;
    meshes.push(m);
    if (cast) casters.push(m);
    if (!name.startsWith('terrain-water') && !wetMats.some((w) => w.m === mat)) wetMats.push({ m: mat, colour: mat.specularColor.clone(), power: mat.specularPower });
  };
  const std = (name: string, t: string) => {
    const m = material(scene, name, tex[t]);
    m.maxSimultaneousLights = maxLights + 2;
    return m;
  };
  add(tops, 'terrain-tops', mix);
  const capMat = std('terrain-caps', 'stone');
  const rockCapMat = std('terrain-rock-caps', 'rock_top');
  // winter (story 15.15): snow on the tops of rock and wall blocks too, as on the props (way B); not under a roof
  if (season === 'winter' && !map?.interior) for (const m of [capMat, rockCapMat]) addSnow(m, data.render.board.snow.winter);
  add(caps, 'terrain-caps', capMat, true);
  add(rockCaps, 'terrain-rock-caps', rockCapMat, true);
  add(sides.earth!, 'terrain-earth', std('terrain-earth', 'earth_side'));
  add(sides.rock!, 'terrain-rock', std('terrain-rock', 'rock_side'), true);
  add(sides.wall!, 'terrain-wall', std('terrain-wall', 'wall'), true);
  add(decks, 'terrain-decks', std('terrain-decks', 'planks'), true);

  // the moor's waters are calmer and duller than the river; three pictures, the middle one twice (a cross-fade there and back)
  const waters = (
    [
      ['clear', [0, 1, 2, 3], 'water', 0.86, 0.35],
      ['mire', [0, 1, 2, 1], 'mire', 0.8, 0.12],
      ['creek', [0, 1, 2, 1], 'creek', 0.92, 0.22],
    ] as const
  ).map(([look, frames, name, alpha, shine]) => {
    const mat = std(look === 'clear' ? 'terrain-water' : `terrain-water-${look}`, `${name}_0`);
    mat.alpha = alpha;
    mat.specularColor = new Color3(shine, shine, shine * 1.14);
    mat.specularPower = 48;
    add(water[look], mat.name, mat);
    return { mat, frames: frames.map((k) => tex[`${name}_${k}`]!) };
  });

  const veilMat = new StandardMaterial('terrain-veil', scene);
  veilMat.disableLighting = true;
  veilMat.emissiveColor = Color3.FromHexString('#0e1220');
  veilMat.alpha = board.skirtDim;
  veilMat.backFaceCulling = false;
  veilMat.zOffset = -1;
  const vm = veil.mesh('terrain-veil', scene, veilMat);
  if (vm) {
    vm.receiveShadows = false;
    meshes.push(vm);
  }

  // bridge rails along both outer edges of each bridge tile
  const wood = material(scene, 'terrain-rails', tex.planks);
  const rails = new Geo();
  const uv = [0, 1, 1, 1, 1, 0, 0, 0];
  for (let y = 0; y < state.height; y++)
    for (let x = 0; x < state.width; x++) {
      if (grid.at(x + S, y + S)?.prop !== 'bridge') continue;
      const vertical = grid.at(x + S, y + S - 1)?.water !== true || grid.at(x + S, y + S + 1)?.water !== true;
      for (const side of [0.06, 0.94]) {
        const [rx, rz] = vertical ? [x + side, -y - 0.5] : [x + 0.5, -y - side];
        const ax = vertical ? 0.04 : 0.5;
        const az = vertical ? 0.5 : 0.04;
        const y0 = 0.02;
        const y1 = 0.26;
        rails.quad([rx - ax, y1, rz + az], [rx + ax, y1, rz + az], [rx + ax, y1, rz - az], [rx - ax, y1, rz - az], [0, 1, 0], uv);
        if (vertical) {
          rails.quad([rx - ax, y1, rz + az], [rx - ax, y1, rz - az], [rx - ax, y0, rz - az], [rx - ax, y0, rz + az], [-1, 0, 0], uv);
          rails.quad([rx + ax, y1, rz - az], [rx + ax, y1, rz + az], [rx + ax, y0, rz + az], [rx + ax, y0, rz - az], [1, 0, 0], uv);
        } else {
          rails.quad([rx + ax, y1, rz - az], [rx - ax, y1, rz - az], [rx - ax, y0, rz - az], [rx + ax, y0, rz - az], [0, 0, -1], uv);
          rails.quad([rx - ax, y1, rz + az], [rx + ax, y1, rz + az], [rx + ax, y0, rz + az], [rx - ax, y0, rz + az], [0, 0, 1], uv);
        }
      }
    }
  add(rails, 'terrain-rails', wood, true);

  let frame = -1;
  const floor = floorOf(data, grid, state.width, state.height, data.maps[state.mapId]?.ladders);
  const view: TerrainView = {
    grid,
    casters,
    ...floor,
    repaint: (next) => {
      const [a, b] = splatData(next, seed);
      mix1.update(a);
      mix2.update(b);
      view.grid = next;
    },
    topOf: (x, y) => {
      if (x < 0 || y < 0 || x >= state.width || y >= state.height) return null;
      const def = grid.at(x + S, y + S);
      // a connector's top is where a figure stands on it, like everywhere a figure stands (story 15.13)
      if (def?.connector) return floor.standOn(x, y);
      return (def?.height ?? 0) + (def?.stand ?? 0);
    },
    setWet: (wet) => {
      for (const w of wetMats) {
        if (wet) {
          w.m.specularColor = new Color3(wet.specular, wet.specular, wet.specular);
          w.m.specularPower = wet.power;
        } else {
          w.m.specularColor = w.colour.clone();
          w.m.specularPower = w.power;
        }
      }
    },
    tick: (now) => {
      const f = Math.floor(now / board.waterFrameMs) % 4;
      if (f !== frame) {
        frame = f;
        for (const w of waters) w.mat.diffuseTexture = w.frames[f]!;
      }
    },
    dispose: () => {
      // the mix material owns its splat maps and texture clones; the others share the loaded textures
      for (const t of mix.getActiveTextures()) t.dispose();
      mix.dispose();
      for (const m of meshes) {
        if (m.material !== mix) m.material?.dispose(false, false);
        m.dispose();
      }
    },
  };
  return view;
}
