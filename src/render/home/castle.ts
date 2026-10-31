/**
 * EVALUATION SPIKE (dev only, `?castle3d=1`): the Paktwacht as a 3D diorama (concept/23-art-direction §7) on the render host
 * (story 5.1), so the product owner can compare it with the painted picture. Not the final feature.
 *
 * The castle is one model file, `models/castle/paktwacht.glb`, built by tools/art/blender_castle.py after the modelling
 * references in art/mockups/castle3d-refs/ and loaded on demand. It holds one mesh per part, named `<group>_<levels>`: the
 * shell (island, walls, towers, gate, keep, modelled in place), the eleven rooms and three keepsakes (modelled at the origin,
 * placed by LAYOUT below), each with parts for the build-up levels (`a` always, `1` ruin with scaffolding and tarps, `23`
 * from level 2: roofs and lit windows, `2` only level 2, `3` banners, lanterns, extras). Colours are vertex colours; glowing
 * parts (windows, fire, lanterns, runes) wear an unlit material. Evening light preset of `render.yaml`.
 *
 * Layout, smoke and light spots below are spike placeholders [C], deliberately in code (no game values; a real home scene
 * would move them into content). The picture view keeps its own anchors (`content/home/home.yaml`).
 */
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { Node } from '@babylonjs/core/node';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Particles/particleSystemComponent';
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture';
import type { GameData } from '../../core';
import { renderHost, type AssetStore, type HostedView, type Quality, type RenderHost } from '../host';
import { resolveLook } from '../shared/look';
import { applyLight } from '../shared/season';
// glTF loader and meshopt decoder (the castle file is meshopt-compressed by gltfpack)
import '../shared/models';

export interface CastleRoom {
  id: string;
  level: number;
}

export interface CastleHooks {
  /** a building was tapped */
  onRoom(id: string): void;
}

const MODEL = 'models/castle/paktwacht.glb';

/** radius of the island's top (tools/art/blender_castle.py ISLAND_R) */
const ISLAND_R = 10.8;
/** tip of the keep tower's roof pennant, x, y, z (tools/art/blender_castle.py KEEP_TOWER) */
const KEEP_TIP: [number, number, number] = [5.3, 11.4, 6.4];

/** points the camera keeps in the band: the island's rim and its underside */
const FRAME_POINTS: Vector3[] = [
  ...Array.from({ length: 16 }, (_, i) => new Vector3(Math.cos((i / 16) * Math.PI * 2) * ISLAND_R, 0, Math.sin((i / 16) * Math.PI * 2) * ISLAND_R)),
  ...Array.from({ length: 8 }, (_, i) => new Vector3(Math.cos((i / 8) * Math.PI * 2) * (ISLAND_R - 1), -2.2, Math.sin((i / 8) * Math.PI * 2) * (ISLAND_R - 1))),
  new Vector3(0, -5, 0),
];

/** the tall tops that may rise above the band, up to TOP: the keep's roof tip and the back left tower (blender_castle.py) */
const TALL_POINTS: Vector3[] = [new Vector3(KEEP_TIP[0], KEEP_TIP[1], KEEP_TIP[2]), new Vector3(-8.8, 5.7, 3.2)];

/** [C] the band the island fits in (share of the view height; the view ends just under the top of the room list): below the HUD, above the room list */
const BAND: [number, number] = [0.2, 0.92];
/** [C] the highest the tall tops may reach (share of the view height): under the coin pill and the dev bar */
const TOP = 0.2;
const PITCH = 0.82;

/**
 * [C] Room spots after the reference layout (art/mockups/castle3d-refs/paktwacht_diorama_l3.png), grounds twice the area of
 * the first spike, re-spaced for the bigger buildings (BUILDING_S): x, z in world units (z = back), yaw in degrees counter-clockwise seen from above (front = -z). Same table
 * as PREVIEW_LAYOUT in tools/art/blender_castle.py.
 */
const LAYOUT: Record<string, [number, number, number]> = {
  convoy: [-5.3, -3.7, 45],
  workshop: [3.9, -1.4, -30],
  merchant: [-3.4, 1.0, 22],
  campfire: [0, -0.4, 0],
  tavern: [1.7, 3.6, -5],
  smith: [5.6, 2.9, -50],
  academy: [7.5, -2.6, -80],
  healer: [4.4, -6.2, -30],
  training: [-3.6, -6.6, 12],
  memorial: [-5.4, 4.5, 40],
  enchanter: [-7.5, 0.3, 78],
};

/**
 * [C] the rooms and keepsakes are modelled at the first spike's size; on the doubled grounds they stand this much bigger
 * (the shell's keep, towers and gate are scaled in tools/art/blender_castle.py by the same factor, BUILDING_S)
 */
const BUILDING_S = 1.4;

/** the rooms the castle model has, in LAYOUT order */
export const CASTLE_ROOMS = Object.keys(LAYOUT);

/** [C] companion keepsakes at fixed places (§7): x, z, yaw, scale */
const KEEPSAKES: Record<string, [number, number, number, number]> = {
  axe: [2.6, -3.4, -20, 1],
  lute: [-1.9, -2.4, 10, 1],
  books: [-3.6, 4.4, 0, 1.3],
};

/** [C] chimney smoke from level 3, room-local (x, height, z) */
const SMOKE: Record<string, Array<[number, number, number]>> = {
  smith: [[0.95, 3.2, 0.85]],
  tavern: [[-1.05, 3.3, 0.3]],
  healer: [[0.05, 2.55, 0.45]],
};

const EMBER = '#ff9a3c';
const RUNE = '#c9a2ff';

/** part names of the model file: `<group>_<levels>` (glTF primitives get a `_primitive<n>` suffix) */
const PART = /^(?:castle:)?([a-z]+)_(a|1|2|23|3)(?:_primitive\d+)?$/;

/** One room's building with its level parts. */
interface RoomView {
  id: string;
  root: TransformNode;
  /** level 1 only (ruin: scaffolding, tarps, rubble) */
  l1: TransformNode;
  /** level 2 and up (roof, lit windows) */
  l23: TransformNode;
  /** level 2 only */
  l2: TransformNode;
  /** level 3 (banners, lanterns, extras) */
  l3: TransformNode;
  smoke: ParticleSystem[];
  lights: PointLight[];
  /** height the room's stone sits at, over the root */
  pin: number;
}

export class CastleView implements HostedView {
  private host: RenderHost;
  private store: AssetStore;
  private scene;
  private camera: FreeCamera;
  private hemi: HemisphericLight;
  private sun: DirectionalLight;
  private shadows: ShadowGenerator | null = null;
  private lit: StandardMaterial;
  private glow: StandardMaterial;
  private smokeTex: DynamicTexture;
  private rooms = new Map<string, RoomView>();
  private shell: Record<'l1' | 'l23' | 'l2' | 'l3', TransformNode>;
  private pins = new Map<string, HTMLElement>();
  private disposed = false;
  private input = new AbortController();
  private yaw = 0;
  /** camera distance and aim that frame the island in BAND (fit, on resize) */
  private dist = 30;
  private aim = new Vector3(0, 0, 0);
  private drag: { x: number; yaw: number; id: number; moved: boolean; t: number } | null = null;
  private lastDrag = -1e9;
  private start = performance.now();
  /** frame times and draw calls of the last frame, for the dev readout */
  private frames: number[] = [];
  private drawCalls = 0;

  constructor(
    private slot: HTMLElement,
    private data: GameData,
    private hooks: CastleHooks,
    quality: Quality,
  ) {
    this.host = renderHost(data);
    this.host.mount(slot);
    this.scene = this.host.scene;
    this.store = this.host.store(this);
    this.host.activate(this);
    const q = this.host.setQuality(quality);
    this.scene.clearColor = new Color4(0, 0, 0, 0);
    this.camera = new FreeCamera('castle:cam', new Vector3(0, 10, -20), this.scene);
    this.camera.inputs.clear();
    this.camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    this.camera.fov = 0.78;
    this.camera.minZ = 1;
    this.camera.maxZ = 160;
    this.scene.activeCamera = this.camera;
    this.hemi = new HemisphericLight('castle:ambient', new Vector3(0.2, 1, -0.3), this.scene);
    this.sun = new DirectionalLight('castle:sun', new Vector3(0.5, -1, 0.4), this.scene);
    // evening, always (§7): the time-of-day preset of render.yaml, season of act 1
    const look = resolveLook(data.render, { act: 1, timeOfDay: 'evening' });
    applyLight(this.hemi, this.sun, look.ambient, look.sun);
    const shadowMap = data.render.quality[q].shadowMap;
    if (shadowMap > 0) {
      const sg = new ShadowGenerator(shadowMap, this.sun);
      sg.usePercentageCloserFiltering = true;
      sg.filteringQuality = q === 'high' ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_MEDIUM;
      sg.bias = 0.002;
      sg.normalBias = 0.02;
      sg.darkness = 0.4;
      sg.getShadowMap()!.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
      this.shadows = sg;
    }
    this.lit = new StandardMaterial('castle:lit', this.scene);
    this.lit.specularColor = new Color3(0.04, 0.04, 0.04);
    this.lit.maxSimultaneousLights = 6;
    // [C] the evening sun stands low in the west and leaves the fronts to the dim sky light: a warm lift keeps the toy colours
    this.lit.emissiveColor = new Color3(0.2, 0.17, 0.14);
    this.glow = new StandardMaterial('castle:glow', this.scene);
    this.glow.disableLighting = true;
    this.glow.emissiveColor = new Color3(1, 1, 1);
    this.smokeTex = this.makeSmokeTexture();
    const node = (n: string) => new TransformNode(`castle:shell:${n}`, this.scene);
    this.shell = { l1: node('l1'), l23: node('l23'), l2: node('l2'), l3: node('l3') };
    this.fit();
    this.bindInput();
    if (import.meta.env.DEV) (window as unknown as { __castle: CastleView }).__castle = this;
  }

  // ------------------------------------------------------------------ host

  /** Always drawing: the idle sway moves the camera every frame (and smoke and fire run). */
  busy(): boolean {
    return true;
  }

  frame(now: number): void {
    if (!this.drag && now - this.lastDrag > 2500) {
      // gentle idle sway around the front view
      const t = (now - this.start) / 1000;
      this.yaw += (Math.sin(t * 0.18) * 0.16 - this.yaw) * 0.02;
    }
    this.placeCamera();
    const calls = this.host.engine._drawCalls;
    const before = calls?.current ?? 0;
    this.scene.render();
    this.drawCalls = (calls?.current ?? 0) - before;
    this.placePins();
    this.frames.push(now);
    while (this.frames.length && now - this.frames[0]! > 1000) this.frames.shift();
  }

  resize(): void {
    this.fit();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.input.abort();
    this.shadows?.dispose();
    this.smokeTex.dispose();
    this.host.release(this);
  }

  /** dev readout: frames drawn in the last second, draw calls, active meshes and their vertices in the last frame */
  stats(): { fps: number; drawCalls: number; meshes: number; vertices: number } {
    const active = this.scene.getActiveMeshes();
    let vertices = 0;
    for (let i = 0; i < active.length; i++) vertices += active.data[i]!.getTotalVertices();
    return { fps: this.frames.length, drawCalls: this.drawCalls, meshes: active.length, vertices };
  }

  // ------------------------------------------------------------------ build

  async build(rooms: CastleRoom[]): Promise<void> {
    const parts = await this.loadParts();
    if (this.disposed || !parts) return;
    // shell: modelled in place
    const shellRoot = new TransformNode('castle:shell', this.scene);
    for (const n of Object.values(this.shell)) n.parent = shellRoot;
    this.attach(parts.get('shell_a'), shellRoot);
    this.attach(parts.get('shell_1'), this.shell.l1);
    this.attach(parts.get('shell_23'), this.shell.l23);
    this.attach(parts.get('shell_2'), this.shell.l2);
    this.attach(parts.get('shell_3'), this.shell.l3);
    for (const r of rooms) this.buildRoom(r, parts);
    for (const [id, [x, z, yaw, s]] of Object.entries(KEEPSAKES)) {
      const n = new TransformNode(`castle:keepsake:${id}`, this.scene);
      n.position.set(x, 0, z);
      n.rotation.y = (-yaw * Math.PI) / 180;
      n.scaling.setAll(s * BUILDING_S);
      this.attach(parts.get(`${id}_a`), n);
    }
    // the campfire burns at every level
    const fire = this.rooms.get('campfire');
    if (fire) {
      this.smoke(fire.root, 0, 0.2, 0, true).start();
      this.light(fire.root, EMBER, 0, 0.9, 0, 1.4, 5);
    }
    for (const r of rooms) this.setLevel(r.id, r.level);
    if (this.shadows) {
      for (const m of this.scene.meshes) if (m.material === this.lit) this.shadows.addShadowCaster(m, false);
      this.refreshShadows();
    }
    this.lit.freeze();
    this.glow.freeze();
  }

  /**
   * The model's parts by name, each a list of meshes (one per material) baked into castle space: the glTF root turns the
   * file 180° about the vertical, the extra turn puts Blender's +X right and +Y back again (front = -z, towards the camera).
   */
  private async loadParts(): Promise<Map<string, Mesh[]> | null> {
    const c = await this.store.container(MODEL, true);
    if (!c || this.disposed) return null;
    const inst = c.instantiateModelsToScene((n) => `castle:${n}`, false, { doNotInstantiate: true });
    // the glTF materials belong to the cached container: off the scene list (the host clears it between scenes)
    for (const m of c.materials) this.scene.removeMaterial(m);
    const turn = Matrix.RotationY(Math.PI);
    const parts = new Map<string, Mesh[]>();
    for (const root of inst.rootNodes)
      for (const m of root.getChildMeshes(false)) {
        if (!(m instanceof Mesh) || !m.getTotalVertices()) continue;
        const key = partKey(m);
        if (!key) continue;
        const glow = (m.material?.name ?? '').includes('glow');
        m.makeGeometryUnique();
        m.computeWorldMatrix(true);
        m.setParent(null);
        m.bakeCurrentTransformIntoVertices();
        m.bakeTransformIntoVertices(turn);
        m.material = glow ? this.glow : this.lit;
        m.hasVertexAlpha = false;
        m.isPickable = false;
        m.receiveShadows = !glow;
        const list = parts.get(key) ?? [];
        list.push(m);
        parts.set(key, list);
      }
    for (const n of inst.rootNodes) n.dispose(false, false);
    return parts;
  }

  private attach(meshes: Mesh[] | undefined, parent: TransformNode): void {
    for (const m of meshes ?? []) {
      m.parent = parent;
      m.computeWorldMatrix(true);
      m.freezeWorldMatrix();
    }
  }

  private buildRoom(r: CastleRoom, parts: Map<string, Mesh[]>): void {
    const spot = LAYOUT[r.id];
    if (!spot || !parts.has(`${r.id}_a`)) return;
    const [x, z, yaw] = spot;
    const root = new TransformNode(`castle:room:${r.id}`, this.scene);
    root.position.set(x, 0, z);
    root.rotation.y = (-yaw * Math.PI) / 180;
    root.scaling.setAll(BUILDING_S);
    root.computeWorldMatrix(true);
    const level = (n: string) => {
      const t = new TransformNode(`castle:${r.id}:${n}`, this.scene);
      t.parent = root;
      return t;
    };
    const v: RoomView = { id: r.id, root, l1: level('l1'), l23: level('l23'), l2: level('l2'), l3: level('l3'), smoke: [], lights: [], pin: 2 };
    // footprint and height (room-local, before placing) for the tap area and the stone
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);
    for (const key of ['a', '23'])
      for (const m of parts.get(`${r.id}_${key}`) ?? []) {
        const b = m.getBoundingInfo().boundingBox;
        min.minimizeInPlace(b.minimum);
        max.maximizeInPlace(b.maximum);
      }
    this.attach(parts.get(`${r.id}_a`), root);
    this.attach(parts.get(`${r.id}_1`), v.l1);
    this.attach(parts.get(`${r.id}_23`), v.l23);
    this.attach(parts.get(`${r.id}_2`), v.l2);
    this.attach(parts.get(`${r.id}_3`), v.l3);
    v.pin = Math.max(1.2, max.y + 0.35);
    for (const [sx, sy, sz] of SMOKE[r.id] ?? []) v.smoke.push(this.smoke(root, sx, sy, sz));
    if (r.id === 'smith') v.lights.push(this.light(root, EMBER, -0.2, 0.7, -0.6, 1.2, 4));
    if (r.id === 'enchanter') v.lights.push(this.light(root, RUNE, 0.75, 0.6, -1.05, 1.2, 3.5));
    // a generous invisible tap area over the building
    const d = Math.max(1.6, Math.min(3.4, Math.max(max.x - min.x, max.z - min.z) * 0.85));
    const hit = CreateCylinder(`castle:hit:${r.id}`, { diameter: d, height: v.pin, tessellation: 8 }, this.scene);
    hit.parent = root;
    hit.position.set((min.x + max.x) / 2, v.pin / 2, (min.z + max.z) / 2);
    hit.visibility = 0;
    hit.isPickable = true;
    hit.metadata = { room: r.id };
    this.rooms.set(r.id, v);
  }

  /** Shows `level` (1–3) for one room; the shell follows the rooms. */
  setLevel(id: string, level: number): void {
    const v = this.rooms.get(id);
    if (!v) return;
    v.root.metadata = { level };
    v.l1.setEnabled(level <= 1);
    v.l23.setEnabled(level >= 2);
    v.l2.setEnabled(level === 2);
    v.l3.setEnabled(level >= 3);
    for (const p of v.smoke) {
      if (level >= 3) p.start();
      else p.stop();
    }
    for (const l of v.lights) l.setEnabled(level >= 3);
    // [C] walls, towers and keep show the rounded-down mean level of the rooms (an open product question)
    const levels = [...this.rooms.values()].map((r) => (r.root.metadata as { level?: number } | null)?.level ?? 1);
    const shell = Math.max(1, Math.min(3, Math.floor(levels.reduce((a, b) => a + b, 0) / levels.length)));
    this.shell.l1.setEnabled(shell <= 1);
    this.shell.l23.setEnabled(shell >= 2);
    this.shell.l2.setEnabled(shell === 2);
    this.shell.l3.setEnabled(shell >= 3);
    this.refreshShadows();
  }

  /** The DOM stone of a room: placed over its building each frame. */
  setPin(id: string, el: HTMLElement | null): void {
    if (el) this.pins.set(id, el);
    else this.pins.delete(id);
  }

  // ------------------------------------------------------------------ effects

  private makeSmokeTexture(): DynamicTexture {
    const t = new DynamicTexture('castle:smoke', { width: 32, height: 32 }, this.scene, false);
    const g = t.getContext() as CanvasRenderingContext2D;
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,0.9)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 32, 32);
    t.update(true);
    t.hasAlpha = true;
    return t;
  }

  private smoke(parent: TransformNode, x: number, y: number, z: number, fire = false): ParticleSystem {
    const p = new ParticleSystem('castle:smoke', fire ? 40 : 60, this.scene);
    p.particleTexture = this.smokeTex;
    const node = new TransformNode('castle:smokeAt', this.scene);
    node.parent = parent;
    node.position.set(x, y, z);
    p.emitter = node as unknown as AbstractMesh;
    p.minEmitBox = new Vector3(-0.05, 0, -0.05);
    p.maxEmitBox = new Vector3(0.05, 0, 0.05);
    if (fire) {
      p.color1 = new Color4(1, 0.75, 0.35, 1);
      p.color2 = new Color4(1, 0.45, 0.15, 1);
      p.colorDead = new Color4(0.6, 0.2, 0.05, 0);
      p.minSize = 0.15;
      p.maxSize = 0.35;
      p.minLifeTime = 0.3;
      p.maxLifeTime = 0.7;
      p.emitRate = 30;
      p.blendMode = ParticleSystem.BLENDMODE_ADD;
      p.direction1 = new Vector3(-0.1, 1, -0.1);
      p.direction2 = new Vector3(0.1, 1.4, 0.1);
      p.minEmitPower = 0.5;
      p.maxEmitPower = 0.9;
    } else {
      p.color1 = new Color4(0.85, 0.82, 0.8, 0.45);
      p.color2 = new Color4(0.75, 0.72, 0.72, 0.35);
      p.colorDead = new Color4(0.7, 0.7, 0.72, 0);
      p.minSize = 0.25;
      p.maxSize = 0.6;
      p.minLifeTime = 2;
      p.maxLifeTime = 3.5;
      p.emitRate = 9;
      p.blendMode = ParticleSystem.BLENDMODE_STANDARD;
      p.direction1 = new Vector3(0.1, 1, 0);
      p.direction2 = new Vector3(0.35, 1, 0.1);
      p.minEmitPower = 0.25;
      p.maxEmitPower = 0.45;
      p.minAngularSpeed = -0.4;
      p.maxAngularSpeed = 0.4;
    }
    p.gravity = new Vector3(0, 0, 0);
    p.preWarmCycles = 60;
    return p;
  }

  private light(parent: TransformNode, color: string, x: number, y: number, z: number, intensity: number, range: number): PointLight {
    const l = new PointLight('castle:light', new Vector3(x, y, z), this.scene);
    l.parent = parent;
    l.diffuse = Color3.FromHexString(color);
    l.specular = new Color3(0, 0, 0);
    l.intensity = intensity;
    l.range = range * BUILDING_S;
    return l;
  }

  // ------------------------------------------------------------------ view

  private refreshShadows(): void {
    const map = this.shadows?.getShadowMap();
    if (!map) return;
    this.sun.autoUpdateExtends = true;
    map.onAfterRenderObservable.addOnce(() => (this.sun.autoUpdateExtends = false));
    map.resetRefreshCounter();
  }

  private placeCamera(): void {
    const { dist, aim } = this;
    this.camera.position.set(aim.x + Math.sin(this.yaw) * Math.cos(PITCH) * dist, aim.y + Math.sin(PITCH) * dist, aim.z - Math.cos(this.yaw) * Math.cos(PITCH) * dist);
    this.camera.setTarget(aim);
  }

  /**
   * Distance and aim of the front view so the whole island (FRAME_POINTS) fits the view's width and the band between the HUD
   * and the room list (BAND); a few rounds of measuring the projected points and correcting.
   */
  private fit(): void {
    const w = this.slot.clientWidth || 1;
    const h = this.slot.clientHeight || 1;
    const top = h * BAND[0];
    const bottom = h * BAND[1];
    const vp = new Viewport(0, 0, w, h);
    const yaw = this.yaw;
    this.yaw = 0;
    for (let round = 0; round < 6; round++) {
      this.placeCamera();
      const m = this.camera.getViewMatrix(true).multiply(this.camera.getProjectionMatrix(true));
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      let tall = Infinity;
      for (const p of FRAME_POINTS) {
        const s = Vector3.Project(p, Matrix.IdentityReadOnly, m, vp);
        x0 = Math.min(x0, s.x);
        x1 = Math.max(x1, s.x);
        y0 = Math.min(y0, s.y);
        y1 = Math.max(y1, s.y);
      }
      for (const p of TALL_POINTS) tall = Math.min(tall, Vector3.Project(p, Matrix.IdentityReadOnly, m, vp).y);
      const island = Math.max((x1 - x0) / (w * 0.92), (y1 - y0) / (bottom - top));
      const tops = (y1 - tall) / (bottom - h * TOP);
      // screen pixels per world unit along z at the aim, to move the picture's centre into the band's centre, but low enough
      // for the tall tops to stay under TOP and high enough for the island's bottom to stay in the band
      const a = Vector3.Project(this.aim, Matrix.IdentityReadOnly, m, vp);
      const b = Vector3.Project(this.aim.add(new Vector3(0, 0, 1)), Matrix.IdentityReadOnly, m, vp);
      const perUnit = Math.max(1e-3, a.y - b.y);
      const off = Math.max(y1 - bottom, Math.min((y0 + y1) / 2 - (top + bottom) / 2, tall - h * TOP));
      this.aim.z -= off / perUnit;
      this.dist *= Math.max(island, tops);
    }
    this.yaw = yaw;
    this.placeCamera();
  }

  private placePins(): void {
    if (!this.pins.size) return;
    const w = this.slot.clientWidth;
    const h = this.slot.clientHeight;
    const vp = new Viewport(0, 0, w, h);
    const tm = this.scene.getTransformMatrix();
    for (const [id, el] of this.pins) {
      const v = this.rooms.get(id);
      if (!v) continue;
      const world = Vector3.TransformCoordinates(new Vector3(0, v.pin, 0), v.root.getWorldMatrix());
      const p = Vector3.Project(world, Matrix.IdentityReadOnly, tm, vp);
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
    }
  }

  private bindInput(): void {
    const c = this.host.canvas;
    const opts = { signal: this.input.signal };
    c.addEventListener(
      'pointerdown',
      (e) => {
        this.drag = { x: e.clientX, yaw: this.yaw, id: e.pointerId, moved: false, t: performance.now() };
      },
      opts,
    );
    c.addEventListener(
      'pointermove',
      (e) => {
        const d = this.drag;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 8) d.moved = true;
        if (d.moved) this.yaw = Math.max(-0.7, Math.min(0.7, d.yaw - dx * 0.006));
      },
      opts,
    );
    const end = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      this.drag = null;
      this.lastDrag = performance.now();
      if (d.moved || e.type === 'pointercancel') return;
      const r = c.getBoundingClientRect();
      const hit = this.scene.pick(e.clientX - r.left, e.clientY - r.top, (m) => (m.metadata as { room?: string } | null)?.room !== undefined && m.isEnabled());
      const room = (hit?.pickedMesh?.metadata as { room?: string } | null)?.room;
      if (room) this.hooks.onRoom(room);
    };
    c.addEventListener('pointerup', end, opts);
    c.addEventListener('pointercancel', end, opts);
  }
}

/** `<group>_<levels>` of a loaded mesh, from its own name or its glTF node's */
function partKey(m: Node): string | null {
  for (let n: Node | null = m; n; n = n.parent) {
    const hit = PART.exec(n.name);
    if (hit) return `${hit[1]}_${hit[2]}`;
  }
  return null;
}
