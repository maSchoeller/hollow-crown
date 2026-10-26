/**
 * 3D models of the board (concept/01-decisions.md D4, D5, D12, D13), exported by tools/art/export_models.py.
 * Vertex colours come in linear; team cloth carries its key index (K0–K3) in vertex alpha.
 */
import type { Scene } from '@babylonjs/core/scene';
import type { AssetContainer } from '@babylonjs/core/assetContainer';
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import type { Skeleton } from '@babylonjs/core/Bones/skeleton';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
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
import { unitModelPath, type GearPiece, type Team } from '../../core';
import type { AssetStore } from '../host';
import { assetUrl } from './assets';
import { FigurePlugin, type FigureLook } from './figurePlugin';

// Image-to-3D figures are meshopt-compressed (tools/art/tripo_units.py). Babylon looks for a global decoder that it would
// otherwise fetch from its CDN; the bundled one keeps the game offline, an empty script satisfies the loader.
(globalThis as { MeshoptDecoder?: typeof MeshoptDecoder }).MeshoptDecoder = MeshoptDecoder;
MeshoptCompression.Configuration = { decoder: { url: 'data:text/javascript,' } };

const toGamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const hexRgb = (h: string): [number, number, number] => [parseInt(h.slice(-6, -4), 16) / 255, parseInt(h.slice(-4, -2), 16) / 255, parseInt(h.slice(-2), 16) / 255];

/**
 * Rewrites a mesh's vertex colours to gamma space with team cloth in the team's ramp (`ramp` = four hex colours, dark → light).
 * The cloth keeps its key in the vertex alpha (alpha = (k + 1) / 8 marks key k; other vertices get 1): the figure material's
 * plug-in (figurePlugin.ts) reads it to draw the cloth unlit. The mesh stays opaque (`hasVertexAlpha` off).
 */
export function teamColours(mesh: Mesh, ramp: readonly string[]): void {
  const src = mesh.getVerticesData(VertexBuffer.ColorKind);
  if (!src) return;
  const colours = ramp.map(hexRgb);
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3]!;
    if (a < 0.9) {
      const k = Math.min(3, Math.max(0, Math.round(a * 8) - 1));
      const c = colours[k]!;
      out.set([c[0], c[1], c[2], (k + 1) / 8], i);
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

/**
 * Copies a cached container's models into the scene. Instances share the container's glTF materials, and Babylon puts
 * those into the scene's material list; the render host clears that list on a scene switch, which would dispose the
 * cache's materials (and leave the next scene's props without their texture). They go back off the list right away.
 */
function instantiate(c: AssetContainer, scene: Scene, rename: (n: string) => string) {
  const inst = c.instantiateModelsToScene(rename, false, { doNotInstantiate: true });
  for (const m of c.materials) scene.removeMaterial(m);
  return inst;
}

/** A unit's 3D figure: animated node tree under `root`; its meshes sit in groups that share materials (body, weapons). */
export interface UnitModel {
  root: TransformNode;
  meshes: Mesh[];
  /** mesh groups, each wearing one material at a time: the body (with the figure's base colour texture, if any) and the weapons */
  groups: { meshes: Mesh[]; texture: BaseTexture | null }[];
  /** the materials of resting figures, shared by all figures of the scene (`AssetStore.materials`) */
  shared: Map<string, StandardMaterial>;
  /** the plug-in values of the scene's figure materials (`AssetStore.figureLook`) */
  look: FigureLook;
  skeletons: Skeleton[];
  anims: Record<string, AnimationGroup>;
  /** one node per weapon between socket and model; turned by `hold` radians about the socket's X outside attacks */
  grips: { node: TransformNode; hold: number }[];
  dispose(): void;
}

/** Board material: matt, both faces (the image-to-3D meshes are not always closed); the plug-in draws cloth unlit, floor and rim light. */
export function figureMaterial(name: string, scene: Scene, look: FigureLook, texture: BaseTexture | null = null): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.specularColor = new Color3(0.06, 0.06, 0.06);
  m.backFaceCulling = false;
  m.diffuseTexture = texture;
  new FigurePlugin(m, look);
  return m;
}

/** Desaturation (acted/downed) 0–1, white flash 0–1 and opacity 0–1 as material values. */
export function tintMaterial(m: StandardMaterial, desat: number, flash: number, alpha: number): void {
  const k = 1 - desat * 0.45;
  m.diffuseColor.set(k, k, k * 1.04);
  m.emissiveColor.set(flash * 0.8, flash * 0.8, flash * 0.8);
  m.alpha = alpha;
}

/**
 * The material of a figure at rest (opaque, no flash): one per base colour texture and desaturation for the whole scene
 * instead of one per figure and hand. Team colours sit in the vertex colours, not in the material.
 */
export function sharedFigureMaterial(cache: Map<string, StandardMaterial>, scene: Scene, look: FigureLook, texture: BaseTexture | null, desat: number): StandardMaterial {
  const key = `${texture ? texture.uniqueId : 0}|${desat}`;
  let m = cache.get(key);
  if (!m) {
    m = figureMaterial(`figure:${key}`, scene, look, texture);
    tintMaterial(m, desat, 0, 1);
    cache.set(key, m);
  }
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
  ramp: readonly string[],
  name: string,
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
    const inst = instantiate(c, store.scene, (n) => `${name}:${piece.model}:${n}`);
    for (const glRoot of inst.rootNodes) {
      // the socket already sits in the figure's glTF space: keep the meshes' glTF-local transforms and drop the
      // weapon file's own handedness root
      for (const n of glRoot.getChildren()) (n as TransformNode).parent = grip;
      for (const m of glRoot.getChildMeshes(false).concat(grip.getChildMeshes(false))) {
        if (!(m instanceof Mesh) || !m.getTotalVertices() || meshes.includes(m) || !m.name.startsWith(`${name}:${piece.model}:`)) continue;
        // the team's cloth colours are written into the vertex buffer: own geometry only where there are vertex colours
        if (m.isVerticesDataPresent(VertexBuffer.ColorKind)) {
          m.makeGeometryUnique();
          teamColours(m, ramp);
        }
        m.isPickable = false;
        m.receiveShadows = true;
        meshes.push(m);
      }
      glRoot.dispose();
    }
  }
  return { meshes, grips };
}

export async function loadUnitModel(store: AssetStore, id: string, team: Team, name: string, gear: GearPiece[] = [], unitPacks?: Readonly<Record<string, string>>): Promise<UnitModel | null> {
  const { scene } = store;
  const ramp = store.figureLook.teams[team];
  const c = await store.container(unitModelPath(id, unitPacks), true);
  if (!c) return null;
  const inst = instantiate(c, scene, (n) => `${name}:${n}`);
  const root = new TransformNode(name, scene);
  for (const n of inst.rootNodes) n.parent = root;
  const body: Mesh[] = [];
  let texture: BaseTexture | null = null;
  for (const n of inst.rootNodes)
    for (const m of n.getChildMeshes(false)) {
      if (!(m instanceof Mesh) || !m.getTotalVertices()) continue;
      // team cloth sits in vertex alpha (Blender figures: vertex colours; Tripo figures: white vertices over their
      // base colour map, the cloth in a neutral grey that the team ramp tints)
      if (m.isVerticesDataPresent(VertexBuffer.ColorKind)) {
        m.makeGeometryUnique();
        teamColours(m, ramp);
      }
      texture ??= (m.material as PBRMaterial | null)?.albedoTexture ?? null;
      m.isPickable = false;
      m.receiveShadows = true;
      body.push(m);
    }
  const held = await attachGear(store, root, gear, ramp, name);
  // the figure's own PBR materials belong to the cached container; every mesh wears a board material from here on
  const shared = store.materials;
  const look = store.figureLook;
  for (const m of body) m.material = sharedFigureMaterial(shared, scene, look, texture, 0);
  for (const m of held.meshes) m.material = sharedFigureMaterial(shared, scene, look, null, 0);
  const anims: Record<string, AnimationGroup> = {};
  for (const g of inst.animationGroups) {
    g.stop();
    anims[g.name.slice(g.name.lastIndexOf(':') + 1)] = g;
  }
  return {
    root,
    meshes: [...body, ...held.meshes],
    groups: [
      { meshes: body, texture },
      { meshes: held.meshes, texture: null },
    ],
    shared,
    look,
    skeletons: inst.skeletons,
    anims,
    grips: held.grips,
    dispose: () => {
      for (const g of inst.animationGroups) g.dispose();
      // meshes, their geometry and skeletons are the figure's own; the materials and the textures are shared
      root.dispose(false, false);
      for (const k of inst.skeletons) k.dispose();
    },
  };
}

/**
 * One static mesh per prop state with baked transform and the player's colours on team cloth (forts, wagons).
 * A prop with a base colour texture (low-poly Blender props, tools/art/props) gets its own material built from the
 * settings of `material` with that texture; the texture stays owned by the cached container, the material never
 * disposes it (the host's stage clear disposes materials without textures). Others share `material`.
 */
export async function loadPropMesh(store: AssetStore, pid: string, state: string, material: StandardMaterial): Promise<Mesh | null> {
  const c = await store.container(`models/props/${pid}_${state}.glb`, true);
  if (!c) return null;
  const inst = instantiate(c, store.scene, (n) => `prop:${pid}_${state}:${n}`);
  const parts: Mesh[] = [];
  let texture: BaseTexture | null = null;
  for (const n of inst.rootNodes)
    for (const m of n.getChildMeshes(false)) {
      if (!(m instanceof Mesh) || !m.getTotalVertices()) continue;
      m.makeGeometryUnique();
      m.computeWorldMatrix(true);
      m.setParent(null);
      m.bakeCurrentTransformIntoVertices();
      texture ??= (m.material as PBRMaterial | null)?.albedoTexture ?? null;
      teamColours(m, store.figureLook.teams.player);
      parts.push(m);
    }
  // the glTF material belongs to the shared container (instances do not clone it): keep it for the next scene
  for (const n of inst.rootNodes) n.dispose(false, false);
  if (!parts.length) return null;
  const mesh = parts.length > 1 ? Mesh.MergeMeshes(parts, true, true)! : parts[0]!;
  mesh.name = `prop:${pid}_${state}`;
  if (texture) {
    const own = new StandardMaterial(`prop:${pid}_${state}:mat`, store.scene);
    own.specularColor = material.specularColor.clone();
    own.backFaceCulling = material.backFaceCulling;
    own.maxSimultaneousLights = material.maxSimultaneousLights;
    own.diffuseTexture = texture;
    mesh.material = own;
    mesh.onDisposeObservable.add(() => {
      own.diffuseTexture = null; // owned by the container
      own.dispose(false, false);
    });
  } else mesh.material = material;
  mesh.isPickable = false;
  mesh.receiveShadows = true;
  return mesh;
}
