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
import type { BattleState, GameData, TerrainDef, TerrainSurface } from '../../core';
import type { AssetStore } from '../host';

/** Ground textures by name (tools/art/ground.py). */
export type GroundTextures = Record<string, Texture>;

export const GROUND_TEXTURES = ['grass', 'dirt', 'road', 'sand', 'ash', 'riverbed', 'stone', 'wall', 'earth_side', 'rock_side', 'planks', 'water_0', 'water_1', 'water_2', 'water_3'];

/** The ground textures from the shared cache (loaded once for board and world map, story 5.1). */
export async function loadGroundTextures(store: AssetStore): Promise<GroundTextures> {
  const list = await Promise.all(GROUND_TEXTURES.map((name) => store.texture(`ground/${name}.png`)));
  return Object.fromEntries(GROUND_TEXTURES.map((name, i) => [name, list[i]!]));
}

// ------------------------------------------------------------------ noise (deterministic, render only)

export function hash3(x: number, y: number, z: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function vnoise(x: number, y: number, seed: number): number {
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

/** Terrain ids of map + scenery skirt, row-major, (W + 2·skirt) × (H + 2·skirt). */
export interface TerrainGrid {
  w: number;
  h: number;
  skirt: number;
  ids: string[];
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
  const ids: string[] = [];
  for (let gy = 0; gy < h; gy++)
    for (let gx = 0; gx < w; gx++) {
      const x = gx - s;
      const y = gy - s;
      if (x >= 0 && y >= 0 && x < state.width && y < state.height) {
        ids.push(mapId(x, y));
        continue;
      }
      let t = mapId(Math.min(Math.max(x, 0), state.width - 1), Math.min(Math.max(y, 0), state.height - 1));
      const def = data.terrain[t];
      if (def?.water && def.surface === 'riverbed') {
        // rivers run on; bridges and fords belong to the map only
        ids.push(Object.values(data.terrain).find((d) => d.water && d.surface === 'riverbed' && !d.prop)?.id ?? t);
        continue;
      }
      if (!wild || !def || def.cliff === 'wall' || (def.prop && !SKIRT_FLAT.has(def.prop)) || def.water) t = wild ? 'grass' : t;
      if (wild) {
        const r = hash3(gx, gy, seed) % 100;
        if (r < 30) t = 'forest';
        else if (r < 37) t = 'mountain';
        else if (r < 70) t = 'grass';
      }
      ids.push(t);
    }
  return {
    w,
    h,
    skirt: s,
    ids,
    at: (gx, gy) => (gx < 0 || gy < 0 || gx >= w || gy >= h ? undefined : data.terrain[ids[gy * w + gx]!]),
    inMap: (gx, gy) => gx >= s && gy >= s && gx < s + state.width && gy < s + state.height,
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

// splat layers: mix map 1 (R, G, B, 1 − A) and mix map 2 (R, G)
const SPLAT_LAYERS: TerrainSurface[] = ['grass', 'dirt', 'road', 'sand', 'ash', 'riverbed'];
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

function splatTextures(scene: Scene, grid: TerrainGrid, seed: number): [RawTexture, RawTexture] {
  const w = grid.w * SPLAT_PX;
  const h = grid.h * SPLAT_PX;
  const layers = SPLAT_LAYERS.length;
  const raw = new Float32Array(w * h * layers);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const tx = x / SPLAT_PX;
      const ty = y / SPLAT_PX;
      const own = grid.at(Math.floor(tx), Math.floor(ty));
      // roads keep crisper edges than grass or sand
      const warp = own?.surface === 'road' ? 0.18 : 0.42;
      const nx = tx + (vnoise(tx * 3, ty * 3, seed + 1) - 0.5) * 2 * warp;
      const ny = ty + (vnoise(tx * 3, ty * 3, seed + 2) - 0.5) * 2 * warp;
      const gx = Math.min(grid.w - 1, Math.max(0, Math.floor(nx)));
      const gy = Math.min(grid.h - 1, Math.max(0, Math.floor(ny)));
      const surface = grid.at(gx, gy)?.surface ?? 'grass';
      const li = SPLAT_LAYERS.indexOf(surface);
      raw[(y * w + x) * layers + (li < 0 ? 1 : li)] = 1;
    }
  // soften the edges (one 5 × 5 box blur)
  const soft = new Float32Array(raw.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < layers; c++) {
        let s = 0;
        for (let j = -2; j <= 2; j++)
          for (let i = -2; i <= 2; i++) {
            const xx = Math.min(w - 1, Math.max(0, x + i));
            const yy = Math.min(h - 1, Math.max(0, y + j));
            s += raw[(yy * w + xx) * layers + c]!;
          }
        soft[(y * w + x) * layers + c] = s / 25;
      }
  const a = new Uint8Array(w * h * 4);
  const b = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const f = splatFactors(Array.from(soft.subarray((y * w + x) * layers, (y * w + x + 1) * layers)));
      // rows flipped: v = 1 is the northern edge of the top faces
      const k = ((h - 1 - y) * w + x) * 4;
      a[k] = f[0]! * 255;
      a[k + 1] = f[1]! * 255;
      a[k + 2] = f[2]! * 255;
      a[k + 3] = (1 - f[3]!) * 255;
      b[k] = f[4]! * 255;
      b[k + 1] = f[5]! * 255;
      b[k + 2] = 0;
      b[k + 3] = 255;
    }
  const mk = (data: Uint8Array) => {
    const t = RawTexture.CreateRGBATexture(data, w, h, scene, false, false, Texture.BILINEAR_SAMPLINGMODE);
    t.wrapU = t.wrapV = Texture.CLAMP_ADDRESSMODE;
    return t;
  };
  return [mk(a), mk(b)];
}

// ------------------------------------------------------------------ build

export interface TerrainView {
  grid: TerrainGrid;
  /** shadow casters among the terrain meshes */
  casters: Mesh[];
  /** top height of map tile (x, y), null outside the map */
  topOf(x: number, y: number): number | null;
  /** where a unit's feet are on map tile (x, y): bridges carry their deck, water its surface */
  standOn(x: number, y: number): number;
  /** advances the water animation */
  tick(now: number): void;
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
  const sides: Record<string, Geo> = { earth: new Geo(), rock: new Geo(), wall: new Geo() };
  const water = new Geo();
  const veil = new Geo();
  const decks = new Geo();
  for (let gy = 0; gy < grid.h; gy++)
    for (let gx = 0; gx < grid.w; gx++) {
      const def = grid.at(gx, gy)!;
      const h = def.height;
      const x = wx(gx);
      const y = wy(gy);
      if (def.cliff === 'wall') caps.flat(x, y, h, [x / 2, -y / 2, (x + 1) / 2, -y / 2, (x + 1) / 2, (-y - 1) / 2, x / 2, (-y - 1) / 2]);
      else {
        const u0 = gx / grid.w;
        const u1 = (gx + 1) / grid.w;
        const vt = 1 - gy / grid.h;
        const vb = 1 - (gy + 1) / grid.h;
        tops.flat(x, y, h, [u0, vt, u1, vt, u1, vb, u0, vb]);
      }
      if (def.water) water.flat(x, y, board.waterLevel, [x / 2, -y / 2, (x + 1) / 2, -y / 2, (x + 1) / 2, (-y - 1) / 2, x / 2, (-y - 1) / 2]);
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
  const [mix1, mix2] = splatTextures(scene, grid, seed);
  const mix = new MixMaterial('terrain-tops', scene);
  mix.mixTexture1 = mix1;
  mix.mixTexture2 = mix2;
  const layer = (k: number, name: string) => {
    const t = tex[name]!.clone();
    t.uScale = grid.w / 2;
    t.vScale = grid.h / 2;
    (mix as unknown as Record<string, Texture>)[`diffuseTexture${k}`] = t;
  };
  SPLAT_LAYERS.forEach((s, i) => layer(i + 1, s));
  layer(7, 'dirt');
  layer(8, 'dirt');
  mix.specularColor = new Color3(0.03, 0.03, 0.03);
  mix.backFaceCulling = false;
  mix.maxSimultaneousLights = maxLights + 2;
  const add = (g: Geo, name: string, mat: StandardMaterial | MixMaterial, cast = false) => {
    const m = g.mesh(name, scene, mat);
    if (!m) return;
    meshes.push(m);
    if (cast) casters.push(m);
  };
  const std = (name: string, t: string) => {
    const m = material(scene, name, tex[t]);
    m.maxSimultaneousLights = maxLights + 2;
    return m;
  };
  add(tops, 'terrain-tops', mix);
  add(caps, 'terrain-caps', std('terrain-caps', 'stone'), true);
  add(sides.earth!, 'terrain-earth', std('terrain-earth', 'earth_side'));
  add(sides.rock!, 'terrain-rock', std('terrain-rock', 'rock_side'), true);
  add(sides.wall!, 'terrain-wall', std('terrain-wall', 'wall'), true);
  add(decks, 'terrain-decks', std('terrain-decks', 'planks'), true);

  const waterFrames = [0, 1, 2, 3].map((k) => tex[`water_${k}`]!);
  const waterMat = std('terrain-water', 'water_0');
  waterMat.alpha = 0.86;
  waterMat.specularColor = new Color3(0.35, 0.35, 0.4);
  waterMat.specularPower = 48;
  add(water, 'terrain-water', waterMat);

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
  return {
    grid,
    casters,
    topOf: (x, y) => (x < 0 || y < 0 || x >= state.width || y >= state.height ? null : (grid.at(x + S, y + S)?.height ?? 0)),
    standOn: (x, y) => {
      const def = grid.at(x + S, y + S);
      if (!def) return 0;
      if (def.prop === 'bridge') return 0.02;
      return def.water ? Math.max(def.height, board.waterLevel - 0.05) : def.height;
    },
    tick: (now) => {
      const f = Math.floor(now / 160) % waterFrames.length;
      if (f !== frame) {
        frame = f;
        waterMat.diffuseTexture = waterFrames[f]!;
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
}
