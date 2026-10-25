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
}

export interface OverlayMesh {
  mesh: Mesh;
  mat: StandardMaterial;
  /** base opacity and how much it pulses */
  alpha: number;
  pulse: number;
}

// overlay colours and opacities (same reading as the 2D board)
const OVERLAY: Record<string, { color: string; alpha: number; inset: number; pulse?: number }> = {
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
  mat.emissiveColor = Color3.FromHexString(color);
  mat.alpha = alpha;
  mat.backFaceCulling = false;
  mat.zOffset = -2;
  mat.disableDepthWrite = true;
  mesh.material = mat;
  mesh.isPickable = false;
  return { mesh, mat, alpha, pulse };
}

/** Builds the meshes for `o`; `top` gives the height a marking lies on. */
export function buildOverlayMeshes(scene: Scene, o: Overlays, top: (p: Pos) => number): OverlayMesh[] {
  const out: OverlayMesh[] = [];
  const lists: Record<string, Pos[]> = {
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
