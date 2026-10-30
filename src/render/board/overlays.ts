/**
 * Tile markings of the board (concept/01-decisions.md D15): movement, attack, danger, path, goal, cursor. Unlit flat
 * quads just above the terrain, one mesh per kind.
 */
import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { LegibilityDef, Pos } from '../../core';
import { arrow, dashes, edgeRibbons, geo, gridTile, outerEdges, ribbon, roundedTile, type Geo } from './shapes';

export interface Overlays {
  /** story 13.2: single range tiles; `move` also gets the shared outer edge */
  move?: Pos[];
  attack?: Pos[];
  heal?: Pos[];
  /** story 13.5: the danger zone, fields with their number of attackers (the tier); `sleeping`: fields only sleeping foes reach (dashed edge) */
  threat?: { tiles: Array<[Pos, number]>; sleeping: Pos[] } | null;
  /** story 13.5: the zone of single foes (long press, wanted poster) as an outer edge in darker red */
  watch?: Pos[];
  /** story 13.2: the way of the ghost figure, drawn as an arrow with its head on the last field */
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

// overlay colours and opacities of the plain square markings (same reading as the 2D board); range tiles, path and danger zone come from render.yaml `legibility`
const OVERLAY: Record<string, { color: string; alpha: number; inset: number; pulse?: number }> = {
  fog: { color: '#1a2440', alpha: 0.6, inset: 0 },
  fogEdge: { color: '#1a2440', alpha: 0.3, inset: 0 },
  goal: { color: '#f2cc4d', alpha: 0.3, inset: 0, pulse: 0.15 },
  reinforce: { color: '#f2802e', alpha: 0.25, inset: 0.16, pulse: 0.2 },
  hold: { color: '#8a2be2', alpha: 0.5, inset: 0 },
  cast: { color: '#2ec4d6', alpha: 0.5, inset: 0.06, pulse: 0.2 },
  targets: { color: '#ffd959', alpha: 0.35, inset: 0.04, pulse: 0.35 },
};

/**
 * Draw order of the markings (alpha index of their blended meshes; all lie at about the same depth, so the order is set, not
 * sorted by distance): zone fills, edges, range tiles, path, targets; the goal marking and the cursor on top.
 */
const LAYER = {
  grid: 1,
  fog: 2,
  fogEdge: 3,
  threat: 4,
  goal: 5,
  reinforce: 6,
  hold: 7,
  threatCream: 8,
  threatLine: 9,
  sleeping: 10,
  move: 11,
  attack: 12,
  heal: 13,
  moveCream: 14,
  moveLine: 15,
  watchCream: 16,
  watchLine: 17,
  cast: 18,
  pathCream: 21,
  path: 22,
  targets: 23,
  mark: 30,
  cursor: 40,
} as const;

function overlayMesh(scene: Scene, name: string, p: number[], idx: number[], color: string, alpha: number, pulse: number, layer?: number): OverlayMesh {
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
  if (layer !== undefined) mesh.alphaIndex = layer;
  return { mesh, mat, alpha, pulse };
}

/** `overlayMesh` from a shape, or nothing when it is empty. */
function shapeMesh(scene: Scene, out: OverlayMesh[], name: string, g: Geo, color: string, alpha: number, layer: number, pulse = 0): void {
  if (g.idx.length) out.push(overlayMesh(scene, name, g.p, g.idx, color, alpha, pulse, layer));
}

const keySet = (tiles: readonly Pos[]) => new Set(tiles.map((t) => `${t[0]},${t[1]}`));

/** Grid marks of a map (story 13.1): one mesh, at the height of each tile; nothing for `off`. */
export function buildGridMesh(scene: Scene, width: number, height: number, top: (p: Pos) => number, level: 'off' | 'subtle' | 'strong', look: LegibilityDef['grid']): OverlayMesh | null {
  if (level === 'off') return null;
  const g = geo();
  const spec = level === 'strong' ? look.strong : look.subtle;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) gridTile(g, [x, y], top([x, y]) + 0.012, level, spec.width, look.subtle.arm);
  return overlayMesh(scene, 'overlay:grid', g.p, g.idx, look.color, spec.alpha, 0, LAYER.grid);
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

/**
 * Builds the meshes for `o`; `top` gives the height a marking lies on; `marker` styles `o.mark` (its arrow stands tilted by
 * `tiltDeg`, the camera's); `leg` styles the range tiles, path arrow and danger zone (render.yaml `legibility`).
 */
export function buildOverlayMeshes(scene: Scene, o: Overlays, top: (p: Pos) => number, marker: MarkerStyle | undefined, tiltDeg: number, leg: LegibilityDef): OverlayMesh[] {
  const out: OverlayMesh[] = [];
  const top2 = (x: number, y: number) => top([x, y]);
  const lists: Record<string, Pos[]> = {
    fog: o.fog ?? [],
    fogEdge: o.fogEdge ?? [],
    goal: o.goal ?? [],
    reinforce: o.reinforce ?? [],
    hold: o.hold ?? [],
    cast: o.cast ?? [],
    targets: o.targets ?? [],
  };
  // the danger zone (story 13.5): fill in three tiers, red edge on cream round all of it, dashed edge of sleeping foes
  const threat = o.threat;
  if (threat?.tiles.length) {
    const tiers = [geo(), geo(), geo()];
    for (const [t, n] of threat.tiles) {
      const g = tiers[Math.min(3, n) - 1]!;
      const h = top(t) + 0.02;
      const k = g.p.length / 3;
      g.p.push(t[0], h, -t[1], t[0] + 1, h, -t[1], t[0] + 1, h, -t[1] - 1, t[0], h, -t[1] - 1);
      g.idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
    }
    tiers.forEach((g, i) => shapeMesh(scene, out, `overlay:threat${i + 1}`, g, leg.threat.color, leg.threat.alpha[i]!, LAYER.threat));
    const segs = outerEdges(keySet(threat.tiles.map(([t]) => t)));
    const cream = geo();
    const line = geo();
    edgeRibbons(cream, segs, top2, 0.024, leg.threat.edge.cream);
    edgeRibbons(line, segs, top2, 0.025, leg.threat.edge.line);
    shapeMesh(scene, out, 'overlay:threat-cream', cream, leg.range.cream, 0.9, LAYER.threatCream);
    shapeMesh(scene, out, 'overlay:threat-edge', line, leg.threat.color, 1, LAYER.threatLine);
  }
  if (threat?.sleeping.length) {
    const sl = leg.threat.sleeping;
    const g = geo();
    for (const seg of outerEdges(keySet(threat.sleeping))) {
      for (const [a, b] of dashes(seg.a, seg.b, sl.dash, sl.gap)) ribbon(g, a, b, top(seg.tile) + 0.026, sl.width);
    }
    shapeMesh(scene, out, 'overlay:threat-sleeping', g, sl.color, 0.95, LAYER.sleeping);
  }
  if (o.watch?.length) {
    const segs = outerEdges(keySet(o.watch));
    const cream = geo();
    const line = geo();
    edgeRibbons(cream, segs, top2, 0.03, leg.threat.watch.cream);
    edgeRibbons(line, segs, top2, 0.031, leg.threat.watch.line);
    shapeMesh(scene, out, 'overlay:watch-cream', cream, leg.range.cream, 0.95, LAYER.watchCream);
    shapeMesh(scene, out, 'overlay:watch', line, leg.threat.watch.color, 1, LAYER.watchLine);
  }
  // range tiles (story 13.2): single tiles with a gap and round corners, the move range with a shared edge (cream under blue)
  const r = leg.range;
  for (const [key, tiles, spec, layer] of [
    ['move', o.move ?? [], r.move, LAYER.move],
    ['attack', o.attack ?? [], r.attack, LAYER.attack],
    ['heal', o.heal ?? [], r.heal, LAYER.heal],
  ] as const) {
    if (!tiles.length) continue;
    const g = geo();
    for (const t of tiles) roundedTile(g, t, top(t) + 0.022, r.gap, r.corner);
    shapeMesh(scene, out, `overlay:${key}`, g, spec.color, spec.alpha, layer);
  }
  if (o.move?.length) {
    const segs = outerEdges(keySet(o.move));
    const cream = geo();
    const line = geo();
    edgeRibbons(cream, segs, top2, 0.027, r.edge.cream);
    edgeRibbons(line, segs, top2, 0.028, r.edge.line);
    shapeMesh(scene, out, 'overlay:move-cream', cream, r.cream, 0.95, LAYER.moveCream);
    shapeMesh(scene, out, 'overlay:move-edge', line, r.move.color, 1, LAYER.moveLine);
  }
  // the path arrow (story 13.2)
  if (o.path && o.path.length > 1) {
    const pa = leg.path;
    const cream = geo();
    const blue = geo();
    arrow(cream, o.path, top2, 0.035, pa.width + pa.outline * 2, pa.head + pa.outline * 3, pa.headLength + pa.outline * 2);
    arrow(blue, o.path, top2, 0.036, pa.width, pa.head, pa.headLength);
    shapeMesh(scene, out, 'overlay:path-cream', cream, pa.cream, 1, LAYER.pathCream);
    shapeMesh(scene, out, 'overlay:path', blue, pa.color, 1, LAYER.path);
  }
  for (const [key, tiles] of Object.entries(lists)) {
    if (!tiles.length) continue;
    const spec = OVERLAY[key]!;
    const layer = LAYER[key as keyof typeof LAYER];
    const p: number[] = [];
    const idx: number[] = [];
    for (const t of tiles) {
      const h = top(t) + 0.02 + layer * 0.001;
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
    out.push(overlayMesh(scene, `overlay:${key}`, p, idx, spec.color, spec.alpha, spec.pulse ?? 0, layer));
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
    outline.mesh.alphaIndex = LAYER.mark;
    const ring = overlayMesh(scene, 'overlay:mark', light.p, light.idx, marker.color, marker.alpha, marker.pulse);
    ring.mesh.alphaIndex = LAYER.mark + 1;
    out.push(outline, ring);
    if (chev.light.p.length) {
      const cd = overlayMesh(scene, 'overlay:mark-arrow-outline', chev.dark.p, chev.dark.idx, marker.outline, 0.95, 0);
      cd.mesh.alphaIndex = LAYER.mark + 2;
      cd.bob = marker.bobTiles;
      const cl = overlayMesh(scene, 'overlay:mark-arrow', chev.light.p, chev.light.idx, marker.color, 1, 0);
      cl.mesh.alphaIndex = LAYER.mark + 3;
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
    out.push(overlayMesh(scene, 'overlay:cursor', p, idx, '#fff2bf', 0.7, 0.25, LAYER.cursor));
  }
  return out;
}
