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
import type { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshoptCompression } from '@babylonjs/core/Meshes/Compression/meshoptCompression';
import '@babylonjs/core/Animations/animatable';
import '@babylonjs/loaders/glTF/glTFFileLoader';
import '@babylonjs/loaders/glTF/2.0/glTFLoader';
import '@babylonjs/loaders/glTF/2.0/Extensions/EXT_meshopt_compression';
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_mesh_quantization';
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_texture_transform';
import { MeshoptDecoder } from 'meshoptimizer/decoder';
import type { GearPiece, Team } from '../../core';
import type { AssetStore } from '../host';
import { assetUrl } from './assets';

/** Team ramps of Hollow-64 (dark → light), the same the sprite shader swaps in (GA10). */
export const TEAM_RAMP: Record<Team, string[]> = {
  player: ['16285a', '2a52b0', '3d7be0', '8fbaf5'],
  enemy: ['4a1018', '9e2a2a', 'd9413a', 'f59a8a'],
  other: ['123a24', '2a7a3e', '3fa65a', '9be08f'],
};

// Image-to-3D figures are meshopt-compressed (tools/art/tripo_units.py). Babylon looks for a global decoder that it would
// otherwise fetch from its CDN; the bundled one keeps the game offline, an empty script satisfies the loader.
(globalThis as { MeshoptDecoder?: typeof MeshoptDecoder }).MeshoptDecoder = MeshoptDecoder;
MeshoptCompression.Configuration = { decoder: { url: 'data:text/javascript,' } };

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

/**
 * Loads a model file into a container of `scene` (the render host's stage; the host caches it, story 5.1). The board
 * assigns its own materials; skipping the glTF ones avoids compiling PBR shaders. Textured figures (image-to-3D,
 * concept/23-art-direction) need them loaded to reuse their base colour texture; the board shades in gamma space like
 * the vertex colours, so the texture must not be decoded as sRGB.
 */
export async function loadContainer(scene: Scene, path: string, materials: boolean): Promise<AssetContainer | null> {
  try {
    const c = await LoadAssetContainerAsync(assetUrl(path), scene, { pluginOptions: { gltf: { skipMaterials: !materials, useSRGBBuffers: false } } });
    // Babylon keeps container entities off the scene with one scene-wide flag; files loading in parallel clear it for
    // each other, and some of a container's meshes and skeletons land in the scene lists anyway. Off with them: the
    // host clears the stage between scenes and must not dispose what the cache holds.
    // Cloning a skinned mesh prepares its source skeleton, which then makes its bone texture on the scene; made here,
    // the texture belongs to the container as well.
    for (const s of c.skeletons) {
      const m = c.meshes.find((x) => x.skeleton === s);
      if (!m) continue;
      s.prepare(true);
      const t = s.getTransformMatrixTexture(m);
      if (t && !c.textures.includes(t)) c.textures.push(t);
    }
    c.removeAllFromScene();
    return c;
  } catch {
    return null;
  }
}

/** A unit's 3D figure: animated node tree under `root`, its materials for tinting (figure, weapons). */
export interface UnitModel {
  root: TransformNode;
  meshes: Mesh[];
  materials: StandardMaterial[];
  anims: Record<string, AnimationGroup>;
  /** one node per weapon between socket and model; turned by `hold` radians about the socket's X outside attacks */
  grips: { node: TransformNode; hold: number }[];
  dispose(): void;
}

/** Board material: matt, both faces (the image-to-3D meshes are not always closed). */
function figureMaterial(name: string, scene: Scene): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.specularColor = new Color3(0.06, 0.06, 0.06);
  m.backFaceCulling = false;
  return m;
}

/**
 * Hangs the weapon library models (GA9, tools/art/blender_weapons.py) on the figure's hand sockets (`socket_r`,
 * `socket_l` from tools/art/prepare_tripo_unit.py). Figures without sockets carry their weapon in the model.
 */
async function attachGear(
  store: AssetStore,
  root: TransformNode,
  gear: GearPiece[],
  team: Team,
  name: string,
  material: StandardMaterial,
): Promise<{ meshes: Mesh[]; grips: UnitModel['grips'] }> {
  const sockets = root.getDescendants(false);
  const meshes: Mesh[] = [];
  const grips: UnitModel['grips'] = [];
  for (const piece of gear) {
    const socket = sockets.find((n) => n.name.endsWith(piece.hand === 'right' ? ':socket_r' : ':socket_l')) as TransformNode | undefined;
    const c = socket && (await store.container(`models/weapons/${piece.model}.glb`));
    if (!socket || !c || root.isDisposed()) continue;
    const grip = new TransformNode(`${name}:${piece.model}:grip`, store.scene);
    grip.parent = socket;
    grips.push({ node: grip, hold: ((piece.hold ?? 0) * Math.PI) / 180 });
    const inst = c.instantiateModelsToScene((n) => `${name}:${piece.model}:${n}`, false, { doNotInstantiate: true });
    for (const glRoot of inst.rootNodes) {
      // the socket already sits in the figure's glTF space: keep the meshes' glTF-local transforms and drop the
      // weapon file's own handedness root
      for (const n of glRoot.getChildren()) (n as TransformNode).parent = grip;
      for (const m of glRoot.getChildMeshes(false).concat(grip.getChildMeshes(false))) {
        if (!(m instanceof Mesh) || !m.getTotalVertices() || meshes.includes(m) || !m.name.startsWith(`${name}:${piece.model}:`)) continue;
        m.makeGeometryUnique();
        teamColours(m, team);
        m.material = material;
        m.isPickable = false;
        m.receiveShadows = true;
        meshes.push(m);
      }
      glRoot.dispose();
    }
  }
  return { meshes, grips };
}

export async function loadUnitModel(store: AssetStore, id: string, team: Team, name: string, gear: GearPiece[] = []): Promise<UnitModel | null> {
  const { scene } = store;
  const c = await store.container(`models/units/${id}.glb`, true);
  if (!c) return null;
  const inst = c.instantiateModelsToScene((n) => `${name}:${n}`, false, { doNotInstantiate: true });
  const root = new TransformNode(name, scene);
  for (const n of inst.rootNodes) n.parent = root;
  const material = figureMaterial(`${name}:mat`, scene);
  const meshes: Mesh[] = [];
  for (const n of inst.rootNodes)
    for (const m of n.getChildMeshes(false)) {
      if (!(m instanceof Mesh) || !m.getTotalVertices()) continue;
      m.makeGeometryUnique();
      // team cloth sits in vertex alpha (Blender figures: vertex colours; Tripo figures: white vertices over their
      // base colour map, the cloth in a neutral grey that the team ramp tints)
      if (m.isVerticesDataPresent(VertexBuffer.ColorKind)) teamColours(m, team);
      material.diffuseTexture ??= (m.material as PBRMaterial | null)?.albedoTexture ?? null;
      m.material = material;
      m.isPickable = false;
      m.receiveShadows = true;
      meshes.push(m);
    }
  const gearMaterial = figureMaterial(`${name}:gear`, scene);
  const held = await attachGear(store, root, gear, team, name, gearMaterial);
  meshes.push(...held.meshes);
  const anims: Record<string, AnimationGroup> = {};
  for (const g of inst.animationGroups) {
    g.stop();
    anims[g.name.slice(g.name.lastIndexOf(':') + 1)] = g;
  }
  return {
    root,
    meshes,
    materials: [material, gearMaterial],
    anims,
    grips: held.grips,
    dispose: () => {
      for (const g of inst.animationGroups) g.dispose();
      material.diffuseTexture = null; // shared with every instance of the model, owned by the container
      root.dispose(false, true);
      material.dispose();
      gearMaterial.dispose();
    },
  };
}

/** One static mesh per prop state with baked transform and the player's colours on team cloth (forts, wagons). */
export async function loadPropMesh(store: AssetStore, pid: string, state: string, material: StandardMaterial): Promise<Mesh | null> {
  const c = await store.container(`models/props/${pid}_${state}.glb`);
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
