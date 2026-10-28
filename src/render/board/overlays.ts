/**
 * Tile markings of the board (concept/01-decisions.md D15): movement, attack, danger, path, goal, cursor. Unlit flat
 * quads just above the terrain, one mesh per kind.
 */
import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Pos } from '../../core';

export interface Overlays {
  move?: Pos[];
  attack?: Pos[];
  heal?: Pos[];
  danger?: Pos[];
  path?: Pos[];
  targets?: Pos[];
  cursor?: Pos | null;
  ghost?: { uid: string; pos: Pos } | null;
  goal?: Pos[];
  reinforce?: Pos[];
  /** hold zones of vanguards (Halten, story 2.4): diagonal hatching */
  hold?: Pos[];
  /** fields Wirken would change (story 2.5) */
  cast?: Pos[];
  /** fields under fog (story 2.6): dark with a blue cast; `fogEdge` is the lighter fringe next to seen fields */
  fog?: Pos[];
  fogEdge?: Pos[];
  /** places of a tapped side objective (goal marking): a light ring with a dark outline on the field, see `MarkerStyle` */
  mark?: Pos[];
}

/** Look of the goal marking (render.yaml `look.marker`): light ring, dark outline, opacity and its pulse. Unlit, never ember orange nor a team colour. */
export interface MarkerStyle {
  color: string;
  outline: string;
  alpha: number;
  pulse: number;
  /** outer radius of the light ring, ring width and outline width (tiles) */
  radius: number;
  width: number;
  outlineWidth: number;
  /** arrow above the field: height over the tile top, width and bobbing amplitude (tiles) */
  chevronHeight: number;
  chevronSize: number;
  bobTiles: number;
}

export interface OverlayMesh {
  mesh: Mesh;
  mat: StandardMaterial;
  /** base opacity and how much it pulses */
  alpha: number;
  pulse: number;
  /** the mesh bobs up and down by this many tiles (0 = stays) */
  bob?: number;
}

// overlay colours and opacities (same reading as the 2D board)
const OVERLAY: Record<string, { color: string; alpha: number; inset: number; pulse?: number }> = {
  fog: { color: '#1a2440', alpha: 0.6, inset: 0 },
  fogEdge: { color: '#1a2440', alpha: 0.3, inset: 0 },
  danger: { color: '#d9333f', alpha: 0.28, inset: 0 },
  goal: { color: '#f2cc4d', alpha: 0.3, inset: 0, pulse: 0.15 },
  move: { color: '#4080f2', alpha: 0.42, inset: 0.02 },
  attack: { color: '#f24d4d', alpha: 0.38, inset: 0.02 },
  heal: { color: '#59e680', alpha: 0.4, inset: 0.02 },
  reinforce: { color: '#f2802e', alpha: 0.25, inset: 0.16, pulse: 0.2 },
  hold: { color: '#8a2be2', alpha: 0.5, inset: 0 },
  cast: { color: '#2ec4d6', alpha: 0.5, inset: 0.06, pulse: 0.2 },
  path: { color: '#ffffff', alpha: 0.55, inset: 0.33 },
  targets: { color: '#ffd959', alpha: 0.35, inset: 0.04, pulse: 0.35 },
};

function overlayMesh(scene: Scene, name: string, p: number[], idx: number[], color: string, alpha: number, pulse: number): OverlayMesh {
  const mesh = new Mesh(name, scene);
  const vd = new VertexData();
  vd.positions = p;
  vd.indices = idx;
  vd.normals = p.map((_, i) => (i % 3 === 1 ? 1 : 0));
  vd.applyToMesh(mesh);
  const mat = new StandardMaterial(name, scene);
  mat.disableLighting = true;
  mat.fogEnabled = false; // markings stay legible in mist (art-direction 2.5)
  mat.emissiveColor = Color3.FromHexString(color);
  mat.alpha = alpha;
  // always in the blended pass, even at opacity 1: an opaque mesh is drawn first and the blended ones (the dark outline below it) would cover it
  mat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
  mat.backFaceCulling = false;
  mat.zOffset = -2;
  mat.disableDepthWrite = true;
  mesh.material = mat;
  mesh.isPickable = false;
  return { mesh, mat, alpha, pulse };
}

/** Ring segments of a marked field. */
const RING_STEPS = 32;

/** Flat ring around a field's centre, as vertices and triangles appended to `p` and `idx` (x east, z north = -y). */
export function addRing(p: number[], idx: number[], tile: Pos, h: number, inner: number, outer: number): void {
  const cx = tile[0] + 0.5;
  const cz = -tile[1] - 0.5;
  const k = p.length / 3;
  for (let i = 0; i < RING_STEPS; i++) {
    const a = (i / RING_STEPS) * Math.PI * 2;
    p.push(cx + Math.cos(a) * inner, h, cz + Math.sin(a) * inner, cx + Math.cos(a) * outer, h, cz + Math.sin(a) * outer);
  }
  for (let i = 0; i < RING_STEPS; i++) {
    const a = k + i * 2;
    const b = k + ((i + 1) % RING_STEPS) * 2;
    idx.push(a, a + 1, b + 1, a, b + 1, b);
  }
}

/**
 * Arrow pointing down over a field, standing in the plane that faces the camera (tilted by `tiltDeg` like the view's up axis),
 * so it reads at full size from the board camera. Two bars from the tip to the arm ends; `half` = half the bar thickness,
 * `extend` = how far the bars reach past their ends (the outline sticks out a little all round).
 */
export function addChevron(p: number[], idx: number[], tile: Pos, base: number, tiltDeg: number, size: number, half: number, extend: number): void {
  const cx = tile[0] + 0.5;
  const cz = -tile[1] - 0.5;
  const sin = Math.sin((tiltDeg * Math.PI) / 180);
  const cos = Math.cos((tiltDeg * Math.PI) / 180);
  const at = (a: number, v: number): [number, number, number] => [cx + a, base + v * sin, cz + v * cos];
  const tip: [number, number] = [0, -extend * half];
  for (const side of [-1, 1]) {
    const end: [number, number] = [side * size * 0.5, size * 0.5];
    const dx = end[0] - tip[0];
    const dv = end[1] - tip[1];
    const len = Math.hypot(dx, dv);
    const nx = (-dv / len) * half;
    const nv = (dx / len) * half;
    const k = p.length / 3;
    for (const [a, v] of [[tip[0] + nx, tip[1] + nv], [tip[0] - nx, tip[1] - nv], [end[0] - nx, end[1] - nv], [end[0] + nx, end[1] + nv]] as const) p.push(...at(a, v));
    idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
}

/** Builds the meshes for `o`; `top` gives the height a marking lies on; `marker` styles `o.mark` (its arrow stands tilted by `tiltDeg`, the camera's). */
export function buildOverlayMeshes(scene: Scene, o: Overlays, top: (p: Pos) => number, marker?: MarkerStyle, tiltDeg = 35): OverlayMesh[] {
  const out: OverlayMesh[] = [];
  const lists: Record<string, Pos[]> = {
    fog: o.fog ?? [],
    fogEdge: o.fogEdge ?? [],
    danger: o.danger ?? [],
    goal: o.goal ?? [],
    move: o.move ?? [],
    attack: o.attack ?? [],
    heal: o.heal ?? [],
    reinforce: o.reinforce ?? [],
    hold: o.hold ?? [],
    cast: o.cast ?? [],
    path: o.path ?? [],
    targets: o.targets ?? [],
  };
  let order = 0;
  for (const [key, tiles] of Object.entries(lists)) {
    order++;
    if (!tiles.length) continue;
    const spec = OVERLAY[key]!;
    const p: number[] = [];
    const idx: number[] = [];
    for (const t of tiles) {
      const h = top(t) + 0.02 + order * 0.002;
      if (key === 'hold') {
        // diagonal stripes inside the tile (u right, v down)
        const w = 0.05;
        for (const d of [-0.6, -0.3, 0, 0.3, 0.6]) {
          const a = d >= 0 ? [d, 0] : [0, -d];
          const b = d >= 0 ? [1, 1 - d] : [1 + d, 1];
          const k = p.length / 3;
          for (const [u, v] of [[a[0]! - w, a[1]! + w], [a[0]! + w, a[1]! - w], [b[0]! + w, b[1]! - w], [b[0]! - w, b[1]! + w]] as const) {
            p.push(t[0] + Math.min(1, Math.max(0, u)), h, -t[1] - Math.min(1, Math.max(0, v)));
          }
          idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
        }
        continue;
      }
      const x0 = t[0] + spec.inset;
      const x1 = t[0] + 1 - spec.inset;
      const zn = -t[1] - spec.inset;
      const zs = -t[1] - 1 + spec.inset;
      const k = p.length / 3;
      p.push(x0, h, zn, x1, h, zn, x1, h, zs, x0, h, zs);
      idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
    }
    out.push(overlayMesh(scene, `overlay:${key}`, p, idx, spec.color, spec.alpha, spec.pulse ?? 0));
  }
  if (marker && o.mark?.length) {
    // dark outline below, light ring above: legible on grass, dirt and cobbles alike
    const dark = { p: [] as number[], idx: [] as number[] };
    const light = { p: [] as number[], idx: [] as number[] };
    const chev = { dark: { p: [] as number[], idx: [] as number[] }, light: { p: [] as number[], idx: [] as number[] } };
    for (const t of o.mark) {
      const h = top(t) + 0.06;
      addRing(dark.p, dark.idx, t, h, marker.radius - marker.width - marker.outlineWidth, marker.radius + marker.outlineWidth);
      addRing(light.p, light.idx, t, h + 0.002, marker.radius - marker.width, marker.radius);
      if (marker.chevronHeight > 0) {
        addChevron(chev.dark.p, chev.dark.idx, t, top(t) + marker.chevronHeight, tiltDeg, marker.chevronSize, 0.09 + marker.outlineWidth, 0.5);
        addChevron(chev.light.p, chev.light.idx, t, top(t) + marker.chevronHeight, tiltDeg, marker.chevronSize, 0.09, 0);
      }
    }
    const outline = overlayMesh(scene, 'overlay:mark-outline', dark.p, dark.idx, marker.outline, 0.95, 0);
    outline.mesh.alphaIndex = 10;
    const ring = overlayMesh(scene, 'overlay:mark', light.p, light.idx, marker.color, marker.alpha, marker.pulse);
    ring.mesh.alphaIndex = 11;
    out.push(outline, ring);
    if (chev.light.p.length) {
      const cd = overlayMesh(scene, 'overlay:mark-arrow-outline', chev.dark.p, chev.dark.idx, marker.outline, 0.95, 0);
      cd.mesh.alphaIndex = 12;
      cd.bob = marker.bobTiles;
      const cl = overlayMesh(scene, 'overlay:mark-arrow', chev.light.p, chev.light.idx, marker.color, 1, 0);
      cl.mesh.alphaIndex = 13;
      cl.bob = marker.bobTiles;
      out.push(cd, cl);
    }
  }
  const c = o.cursor;
  if (c) {
    // gold corner frame on the tile
    const h = top(c) + 0.04;
    const p: number[] = [];
    const idx: number[] = [];
    const bar = (x0: number, z0: number, x1: number, z1: number) => {
      const k = p.length / 3;
      p.push(x0, h, z0, x1, h, z0, x1, h, z1, x0, h, z1);
      idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
    };
    const [x, y] = c;
    const t = 0.07;
    const l = 0.3;
    for (const [cx, cz, sx, sz] of [[x, -y, 1, -1], [x + 1, -y, -1, -1], [x, -y - 1, 1, 1], [x + 1, -y - 1, -1, 1]] as const) {
      bar(cx, cz, cx + sx * l, cz + sz * t);
      bar(cx, cz, cx + sx * t, cz + sz * l);
    }
    out.push(overlayMesh(scene, 'overlay:cursor', p, idx, '#fff2bf', 0.7, 0.25));
  }
  return out;
}
