/**
 * 3D models of the board (concept/01-decisions.md D4, D5, D12, D13), exported by tools/art/export_models.py.
 * Vertex colours come in linear; team cloth carries its key index (K0–K3) in vertex alpha.
 */
import type { Scene } from '@babylonjs/core/scene';
import type { AssetContainer } from '@babylonjs/core/assetContainer';
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import '@babylonjs/core/Animations/animatable';
import '@babylonjs/loaders/glTF/glTFFileLoader';
import '@babylonjs/loaders/glTF/2.0/glTFLoader';
import type { Team } from '../core';
import { assetUrl } from './assets';

/** Team ramps of Hollow-64 (dark → light), the same the sprite shader swaps in (GA10). */
export const TEAM_RAMP: Record<Team, string[]> = {
  player: ['16285a', '2a52b0', '3d7be0', '8fbaf5'],
  enemy: ['4a1018', '9e2a2a', 'd9413a', 'f59a8a'],
  other: ['123a24', '2a7a3e', '3fa65a', '9be08f'],
};

const toGamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const hexRgb = (h: string): [number, number, number] => [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];

/** Rewrites a mesh's vertex colours to gamma space with team cloth in the team's ramp (alpha = (k + 1) / 8 marks key k). */
export function teamColours(mesh: Mesh, team: Team): void {
  const src = mesh.getVerticesData(VertexBuffer.ColorKind);
  if (!src) return;
  const ramp = TEAM_RAMP[team].map(hexRgb);
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3]!;
    if (a < 0.9) {
      const c = ramp[Math.min(3, Math.max(0, Math.round(a * 8) - 1))]!;
      out.set([c[0], c[1], c[2], 1], i);
    } else out.set([toGamma(src[i]!), toGamma(src[i + 1]!), toGamma(src[i + 2]!), 1], i);
  }
  mesh.setVerticesData(VertexBuffer.ColorKind, out, false, 4);
  mesh.hasVertexAlpha = false;
}

const containers = new Map<string, Promise<AssetContainer | null>>();
function container(scene: Scene, path: string): Promise<AssetContainer | null> {
  const key = `${scene.uid}:${path}`;
  let p = containers.get(key);
  if (!p) {
    // the board assigns its own vertex-colour materials; skipping the glTF ones avoids compiling PBR shaders
    p = LoadAssetContainerAsync(assetUrl(path), scene, { pluginOptions: { gltf: { skipMaterials: true } } }).catch(() => null);
    containers.set(key, p);
  }
  return p;
}

/** Frees the model files loaded for a scene (call when the board is disposed). */
export function releaseModels(scene: Scene): void {
  for (const [key, p] of [...containers]) {
    if (!key.startsWith(`${scene.uid}:`)) continue;
    containers.delete(key);
    void p.then((c) => c?.dispose());
  }
}

/** A unit's 3D figure: animated node tree under `root`, one material for tinting. */
export interface UnitModel {
  root: TransformNode;
  meshes: Mesh[];
  material: StandardMaterial;
  anims: Record<string, AnimationGroup>;
  dispose(): void;
}

export async function loadUnitModel(scene: Scene, id: string, team: Team, name: string): Promise<UnitModel | null> {
  const c = await container(scene, `models/units/${id}.glb`);
  if (!c) return null;
  const inst = c.instantiateModelsToScene((n) => `${name}:${n}`, false, { doNotInstantiate: true });
  const root = new TransformNode(name, scene);
  for (const n of inst.rootNodes) n.parent = root;
  const material = new StandardMaterial(`${name}:mat`, scene);
  material.specularColor = new Color3(0.06, 0.06, 0.06);
  material.backFaceCulling = false;
  const meshes: Mesh[] = [];
  for (const n of inst.rootNodes)
    for (const m of n.getChildMeshes(false)) {
      if (!(m instanceof Mesh) || !m.getTotalVertices()) continue;
      m.makeGeometryUnique();
      teamColours(m, team);
      m.material = material;
      m.isPickable = false;
      m.receiveShadows = true;
      meshes.push(m);
    }
  const anims: Record<string, AnimationGroup> = {};
  for (const g of inst.animationGroups) {
    g.stop();
    anims[g.name.slice(g.name.lastIndexOf(':') + 1)] = g;
  }
  return {
    root,
    meshes,
    material,
    anims,
    dispose: () => {
      for (const g of inst.animationGroups) g.dispose();
      root.dispose(false, true);
      material.dispose();
    },
  };
}

/** One static mesh per prop state with baked transform and the player's colours on team cloth (forts, wagons). */
export async function loadPropMesh(scene: Scene, pid: string, state: string, material: StandardMaterial): Promise<Mesh | null> {
  const c = await container(scene, `models/props/${pid}_${state}.glb`);
  if (!c) return null;
  const inst = c.instantiateModelsToScene((n) => `prop:${pid}_${state}:${n}`, false, { doNotInstantiate: true });
  const parts: Mesh[] = [];
  for (const n of inst.rootNodes)
    for (const m of n.getChildMeshes(false)) {
      if (!(m instanceof Mesh) || !m.getTotalVertices()) continue;
      m.makeGeometryUnique();
      m.computeWorldMatrix(true);
      m.setParent(null);
      m.bakeCurrentTransformIntoVertices();
      teamColours(m, 'player');
      parts.push(m);
    }
  for (const n of inst.rootNodes) n.dispose(false, true);
  if (!parts.length) return null;
  const mesh = parts.length > 1 ? Mesh.MergeMeshes(parts, true, true)! : parts[0]!;
  mesh.name = `prop:${pid}_${state}`;
  mesh.material = material;
  mesh.isPickable = false;
  mesh.receiveShadows = true;
  return mesh;
}
