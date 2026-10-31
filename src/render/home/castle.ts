/**
 * EVALUATION SPIKE (dev only, `?castle3d=1`): the Paktwacht as a 3D diorama (concept/23-art-direction §7) on the render host
 * (story 5.1), so the product owner can compare it with the painted picture. Not the final feature: the castle is built
 * from the board's low-poly prop models (tools/art/props) plus Babylon primitives, in the evening light preset of
 * `render.yaml`. Rooms sit where the anchors of `content/home/home.yaml` put their stones; each room has parts per
 * build-up level (1: scaffolding and tarps, 2: new roof and windows, 3: banners, light and smoke).
 *
 * Layout and colours below are spike placeholders [C], deliberately in code (no game values; a real home scene would move
 * them into content next to the anchors).
 */
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
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
import { loadPropMesh, loadStaticMesh } from '../shared/models';
import { resolveLook } from '../shared/look';
import { applyLight } from '../shared/season';

export interface CastleRoom {
  id: string;
  /** stone position in % of the painted picture (home.yaml anchors); rooms without anchor get a spike spot */
  at: [number, number];
  level: number;
}

export interface CastleHooks {
  /** a building was tapped */
  onRoom(id: string): void;
}

type Kind = 'stall' | 'forge' | 'garden' | 'hall' | 'tavern' | 'wagon' | 'fire' | 'tower' | 'academy' | 'workshop' | 'yard';

/** [C] which building stands for which room */
const KIND: Record<string, Kind> = {
  merchant: 'stall',
  smith: 'forge',
  healer: 'garden',
  memorial: 'hall',
  tavern: 'tavern',
  convoy: 'wagon',
  campfire: 'fire',
  enchanter: 'tower',
  academy: 'academy',
  workshop: 'workshop',
  training: 'yard',
};

/** [C] act-2 rooms have no anchor yet: spike spots in % of the picture */
export const SPIKE_SPOTS: Record<string, [number, number]> = {
  enchanter: [27, 28],
  academy: [73, 28],
  workshop: [13, 75],
  training: [87, 76],
};

const C = {
  stone: '#d8c9b0',
  stoneDark: '#b3a288',
  stoneWarm: '#e4d3b6',
  wood: '#7a5232',
  woodLight: '#a77a4c',
  roof: '#b85a3c',
  slate: '#4f5d80',
  canvas: '#eadfc4',
  banner: '#d9662a',
  bannerDark: '#a8441d',
  grass: '#86a24c',
  grassDark: '#6d8a3e',
  earth: '#6e4c33',
  ivy: '#5f8a3a',
  window: '#ffc861',
  ember: '#ff9a3c',
  violet: '#b58cff',
};

/** half extent of the diorama ground in world units */
const R = 7.6;
const ROOM_SCALE = 1.35;
/** picture % → world: x across, z from the back (top of the picture) to the front */
const toWorld = ([x, y]: [number, number]): [number, number] => [((x - 50) / 100) * 12.4, ((50 - y) / 100) * 14];

/** One room's building with its level parts. */
interface RoomView {
  id: string;
  root: TransformNode;
  /** level 1 only (scaffolding, tarps, ruin variant) */
  l1: TransformNode;
  /** level 2 and up (roof, windows, intact variant) */
  l2: TransformNode;
  /** level 3 (banners, light, smoke) */
  l3: TransformNode;
  smoke: ParticleSystem[];
  lights: PointLight[];
  /** point the room's stone sits over */
  pin: Vector3;
}

export class CastleView implements HostedView {
  private host: RenderHost;
  private store: AssetStore;
  private scene;
  private camera: FreeCamera;
  private hemi: HemisphericLight;
  private sun: DirectionalLight;
  private shadows: ShadowGenerator | null = null;
  private mats = new Map<string, StandardMaterial>();
  private propMat: StandardMaterial;
  private smokeTex: DynamicTexture;
  private rooms = new Map<string, RoomView>();
  private pins = new Map<string, HTMLElement>();
  private disposed = false;
  private input = new AbortController();
  private yaw = 0;
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
    this.camera.minZ = 0.5;
    this.camera.maxZ = 120;
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
    this.propMat = new StandardMaterial('castle:props', this.scene);
    this.propMat.specularColor = new Color3(0.05, 0.05, 0.05);
    this.propMat.backFaceCulling = false;
    this.smokeTex = this.makeSmokeTexture();
    this.placeCamera();
    this.bindInput();
    if (import.meta.env.DEV) (window as unknown as { __castle: CastleView }).__castle = this;
  }

  // ------------------------------------------------------------------ host

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
    this.placeCamera();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.input.abort();
    this.shadows?.dispose();
    this.smokeTex.dispose();
    this.host.release(this);
  }

  /** dev readout: frames drawn in the last second, draw calls and active meshes of the last frame */
  stats(): { fps: number; drawCalls: number; meshes: number; vertices: number } {
    return {
      fps: this.frames.length,
      drawCalls: this.drawCalls,
      meshes: this.scene.getActiveMeshes().length,
      vertices: this.scene.getTotalVertices(),
    };
  }

  // ------------------------------------------------------------------ build

  async build(rooms: CastleRoom[]): Promise<void> {
    this.buildGround();
    this.buildShell();
    // model files load in parallel (the cache loads each once)
    await Promise.all([this.buildScenery(), ...rooms.map((r) => this.buildRoom(r))]);
    await this.buildKeepsakes();
    if (this.disposed) return;
    this.mergeStatic();
    for (const r of rooms) this.setLevel(r.id, r.level);
    if (this.shadows) {
      for (const m of this.scene.meshes) if (m.isEnabled() && m.name !== 'castle:ground' && m.name !== 'castle:plinth') this.shadows.addShadowCaster(m, false);
      this.refreshShadows();
    }
    this.freeze();
  }

  /** Shows `level` (1–3) for one room. */
  setLevel(id: string, level: number): void {
    const v = this.rooms.get(id);
    if (!v) return;
    v.l1.setEnabled(level <= 1);
    v.l2.setEnabled(level >= 2);
    v.l3.setEnabled(level >= 3);
    for (const p of v.smoke) {
      if (level >= 3) p.start();
      else p.stop();
    }
    for (const l of v.lights) l.setEnabled(level >= 3);
    this.refreshShadows();
  }

  /** The DOM stone of a room: placed over its building each frame. */
  setPin(id: string, el: HTMLElement | null): void {
    if (el) this.pins.set(id, el);
    else this.pins.delete(id);
  }

  // ------------------------------------------------------------------ helpers

  private mat(hex: string, emissive = false): StandardMaterial {
    const key = `${hex}|${emissive ? 'e' : ''}`;
    let m = this.mats.get(key);
    if (!m) {
      m = new StandardMaterial(`castle:${key}`, this.scene);
      const c = Color3.FromHexString(hex);
      m.diffuseColor = c;
      m.specularColor = new Color3(0.04, 0.04, 0.04);
      if (emissive) {
        m.emissiveColor = c;
        m.disableLighting = true;
      }
      this.mats.set(key, m);
    }
    return m;
  }

  private box(parent: TransformNode | null, w: number, h: number, d: number, color: string, x: number, y: number, z: number, rotY = 0, emissive = false): Mesh {
    const m = CreateBox('castle:box', { width: w, height: h, depth: d }, this.scene);
    m.material = this.mat(color, emissive);
    m.position.set(x, y + h / 2, z);
    m.rotation.y = rotY;
    m.parent = parent;
    m.receiveShadows = true;
    m.isPickable = false;
    return m;
  }

  private cyl(parent: TransformNode | null, dTop: number, dBottom: number, h: number, color: string, x: number, y: number, z: number, tess = 16): Mesh {
    const m = CreateCylinder('castle:cyl', { diameterTop: dTop, diameterBottom: dBottom, height: h, tessellation: tess }, this.scene);
    m.material = this.mat(color);
    m.position.set(x, y + h / 2, z);
    m.parent = parent;
    m.receiveShadows = true;
    m.isPickable = false;
    return m;
  }

  private ball(parent: TransformNode | null, d: number, color: string, x: number, y: number, z: number, emissive = false): Mesh {
    const m = CreateSphere('castle:ball', { diameter: d, segments: 8 }, this.scene);
    m.material = this.mat(color, emissive);
    m.position.set(x, y, z);
    m.parent = parent;
    m.receiveShadows = true;
    m.isPickable = false;
    return m;
  }

  /** a gable roof (triangular prism) along x */
  private gable(parent: TransformNode, w: number, h: number, d: number, color: string, x: number, y: number, z: number, rotY = 0): Mesh {
    const m = CreateCylinder('castle:roof', { diameter: 1, height: 1, tessellation: 3 }, this.scene);
    m.material = this.mat(color);
    m.rotation.set(0, rotY, Math.PI / 2);
    m.bakeCurrentTransformIntoVertices();
    // a unit prism lying along x with its ridge up; scale to the roof
    m.scaling.set(w, h / 0.75, d / 0.866);
    m.position.set(x, y + h * 0.333, z);
    m.parent = parent;
    m.receiveShadows = true;
    m.isPickable = false;
    return m;
  }

  /** a flat cloth (banner, tarp) facing the camera side (-z) */
  private cloth(parent: TransformNode, w: number, h: number, color: string, x: number, y: number, z: number, rotX = 0, rotY = 0): Mesh {
    const m = CreatePlane('castle:cloth', { width: w, height: h, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
    m.material = this.mat(color);
    m.position.set(x, y, z);
    m.rotation.set(rotX, rotY, 0);
    m.parent = parent;
    m.receiveShadows = true;
    m.isPickable = false;
    return m;
  }

  /** a prop model scaled so its larger footprint side is `size`; null when the file is missing */
  private async prop(parent: TransformNode, model: string, size: number, x: number, z: number, rotY = 0, y = 0): Promise<Mesh | null> {
    const i = model.lastIndexOf('_');
    const m = await loadPropMesh(this.store, model.slice(0, i), model.slice(i + 1), this.propMat);
    if (!m || this.disposed) return null;
    this.fit(m, size, false);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.parent = parent;
    return m;
  }

  /** a weapon model standing on its own, scaled to `height` */
  private async weapon(parent: TransformNode, model: string, height: number, x: number, y: number, z: number, rot: Vector3): Promise<Mesh | null> {
    const m = await loadStaticMesh(this.store, `models/weapons/${model}.glb`, `castle:${model}`, this.propMat);
    if (!m || this.disposed) return null;
    this.fit(m, height, true);
    m.position.set(x, y, z);
    m.rotation.copyFrom(rot);
    m.parent = parent;
    return m;
  }

  /** scales a mesh to `size` (footprint, or its longest side) and puts its base on y = 0 */
  private fit(m: Mesh, size: number, longest: boolean): void {
    m.refreshBoundingInfo();
    const b = m.getBoundingInfo().boundingBox;
    const ext = b.maximum.subtract(b.minimum);
    const s = size / Math.max(longest ? Math.max(ext.x, ext.y, ext.z) : Math.max(ext.x, ext.z), 1e-3);
    const centre = b.minimum.add(b.maximum).scale(0.5);
    m.bakeTransformIntoVertices(Matrix.Translation(-centre.x, -b.minimum.y, -centre.z).multiply(Matrix.Scaling(s, s, s)));
    m.refreshBoundingInfo();
  }

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
      p.minSize = 0.18;
      p.maxSize = 0.4;
      p.minLifeTime = 0.3;
      p.maxLifeTime = 0.7;
      p.emitRate = 40;
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
    l.range = range;
    return l;
  }

  /** deterministic jitter for the spike's scattering */
  private rnd = (() => {
    let s = 7;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  })();

  // ------------------------------------------------------------------ ground and walls

  private buildGround(): void {
    const ground = CreateCylinder('castle:ground', { diameter: R * 2, height: 0.5, tessellation: 48 }, this.scene);
    ground.position.y = -0.25;
    ground.material = this.mat(C.grass);
    ground.receiveShadows = true;
    ground.isPickable = false;
    const plinth = CreateCylinder('castle:plinth', { diameterTop: R * 2 + 0.3, diameterBottom: R * 2 - 0.4, height: 0.9, tessellation: 48 }, this.scene);
    plinth.position.y = -0.9;
    plinth.material = this.mat(C.earth);
    plinth.isPickable = false;
    // stone path from the front edge to the hall
    for (let z = -R + 0.4; z < -0.6; z += 0.55)
      for (let x = -0.75; x <= 0.76; x += 0.5) {
        const w = 0.42 + this.rnd() * 0.08;
        this.box(null, w, 0.06, 0.46, this.rnd() > 0.5 ? C.stoneWarm : C.stone, x + (this.rnd() - 0.5) * 0.06, 0, z, (this.rnd() - 0.5) * 0.2);
      }
    // courtyard paving
    for (let i = 0; i < 26; i++) {
      const a = this.rnd() * Math.PI * 2;
      const r = 1.2 + this.rnd() * 2.3;
      this.box(null, 0.5, 0.05, 0.45, C.stone, Math.cos(a) * r, 0, Math.sin(a) * r * 0.6 - 0.8, a);
    }
  }

  /** curtain wall around the back, towers at its ends, ruined stubs and the two carved pillars at the front */
  private buildShell(): void {
    const shell = new TransformNode('castle:shell', this.scene);
    const wallR = R - 0.7;
    const from = 0.12 * Math.PI;
    const to = 0.88 * Math.PI;
    const seg = 14;
    for (let i = 0; i < seg; i++) {
      const a0 = from + ((to - from) * i) / seg;
      const a1 = from + ((to - from) * (i + 1)) / seg;
      const a = (a0 + a1) / 2;
      const len = wallR * (a1 - a0) + 0.05;
      const h = 2.1 - (i % 5 === 2 ? 0.7 : 0) - this.rnd() * 0.25;
      const x = Math.cos(a) * wallR;
      const z = Math.sin(a) * wallR;
      const rot = -a + Math.PI / 2;
      this.box(shell, len, h, 0.6, i % 2 ? C.stone : C.stoneDark, x, 0, z, rot);
      // battlements
      if (h > 1.8) for (const o of [-0.3, 0.3]) this.box(shell, 0.28, 0.3, 0.62, C.stone, x + Math.cos(rot) * o, h, z - Math.sin(rot) * o, rot);
      if (i % 3 === 1) this.ball(shell, 0.7, C.ivy, x * 0.97, h * 0.6, z * 0.97);
    }
    for (const a of [from - 0.06, to + 0.06]) this.tower(shell, Math.cos(a) * wallR, Math.sin(a) * wallR, 1.5, 3.4);
    this.tower(shell, 0, wallR + 0.1, 1.8, 4.2);
    // ruined front wall stubs
    for (const side of [-1, 1])
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 + side * (0.32 + i * 0.22);
        this.box(shell, 1.3, 0.35 + this.rnd() * 0.5, 0.5, C.stoneDark, Math.cos(a) * wallR, 0, Math.sin(a) * wallR, -a + Math.PI / 2);
      }
    // the two carved pillars at the entrance (dragon left, crown right, as in the painting)
    for (const side of [-1, 1]) {
      const x = side * 1.6;
      const z = -R + 1.0;
      this.box(shell, 0.9, 0.25, 0.9, C.stoneDark, x, 0, z);
      this.box(shell, 0.7, 1.5, 0.7, C.stoneWarm, x, 0.25, z);
      this.box(shell, 0.9, 0.25, 0.9, C.stone, x, 1.75, z);
      this.box(shell, 0.42, 0.6, 0.04, C.stoneDark, x, 0.7, z - 0.36);
      this.ball(shell, 0.5, C.ivy, x + side * 0.3, 1.7, z - 0.15);
    }
  }

  private tower(parent: TransformNode, x: number, z: number, d: number, h: number): void {
    this.cyl(parent, d, d * 1.08, h, C.stone, x, 0, z, 20);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.box(parent, 0.3, 0.32, 0.3, C.stone, x + (Math.cos(a) * d) / 2.2, h, z + (Math.sin(a) * d) / 2.2, -a);
    }
    this.box(parent, 0.18, 0.4, 0.05, '#3a2c22', x, h * 0.6, z - d / 2 - 0.01);
  }

  private async buildScenery(): Promise<void> {
    const node = new TransformNode('castle:scenery', this.scene);
    const trees = ['autumn_a', 'autumn_b', 'autumn_c', 'tree_a', 'autumn_b'];
    const spots: Array<[number, number, number]> = [
      [-6.4, 2.6, 2.6],
      [6.5, 2.2, 2.4],
      [-6.8, -1.2, 2.2],
      [6.9, -1.6, 2.3],
      [-5.4, -4.4, 2],
      [5.6, -4.6, 2.1],
      [-2.6, 6.8, 2.4],
      [3.1, 6.8, 2.2],
    ];
    for (let i = 0; i < spots.length; i++) {
      const [x, z, s] = spots[i]!;
      await this.prop(node, trees[i % trees.length]!, s, x, z, this.rnd() * 6);
    }
    for (const [x, z] of [
      [-3.2, -6.4],
      [3.4, -6.2],
      [-6.6, 0.6],
      [6.2, 0.2],
    ] as const)
      await this.prop(node, 'rocks_small', 0.8, x, z, this.rnd() * 6);
    for (const [x, z] of [
      [-2.2, -5.6],
      [2.4, -5.8],
      [-1.9, -3.2],
      [1.8, -3.4],
    ] as const)
      await this.prop(node, 'bush_a', 0.7, x, z, this.rnd() * 6);
  }

  // ------------------------------------------------------------------ rooms

  private async buildRoom(r: CastleRoom): Promise<void> {
    const kind = KIND[r.id];
    if (!kind) return;
    const [x, z] = toWorld(r.at);
    const root = new TransformNode(`castle:room:${r.id}`, this.scene);
    root.position.set(x, 0, z);
    // chibi proportions: buildings a bit large for the walls, so they read on a phone
    root.scaling.setAll(ROOM_SCALE);
    // face the courtyard centre a little
    root.rotation.y = Math.atan2(-x, 6) * 0.35;
    const l1 = new TransformNode(`castle:${r.id}:l1`, this.scene);
    const l2 = new TransformNode(`castle:${r.id}:l2`, this.scene);
    const l3 = new TransformNode(`castle:${r.id}:l3`, this.scene);
    for (const n of [l1, l2, l3]) n.parent = root;
    const v: RoomView = { id: r.id, root, l1, l2, l3, smoke: [], lights: [], pin: new Vector3(0, 2.2, 0) };
    await this.buildKind(kind, v);
    // a generous invisible tap area over the building
    const hit = CreateCylinder(`castle:hit:${r.id}`, { diameter: 2, height: 2.6, tessellation: 8 }, this.scene);
    hit.parent = root;
    hit.position.y = 1.3;
    hit.visibility = 0;
    hit.isPickable = true;
    hit.metadata = { room: r.id };
    this.rooms.set(r.id, v);
  }

  /** scaffolding around a box of size w × h × d centred on (x, z) */
  private scaffold(parent: TransformNode, w: number, h: number, d: number, x = 0, z = 0): void {
    const poles: Array<[number, number]> = [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [-w / 2, d / 2],
      [w / 2, d / 2],
    ];
    for (const [px, pz] of poles) this.box(parent, 0.07, h, 0.07, C.woodLight, x + px, 0, z + pz);
    for (const y of [h * 0.45, h * 0.9]) {
      this.box(parent, w + 0.1, 0.06, 0.06, C.woodLight, x, y, z - d / 2);
      this.box(parent, 0.06, 0.06, d + 0.1, C.woodLight, x - w / 2, y, z);
      this.box(parent, 0.06, 0.06, d + 0.1, C.woodLight, x + w / 2, y, z);
      this.box(parent, w, 0.04, 0.3, C.wood, x, y + 0.05, z - d / 2 - 0.15);
    }
    const diag = this.box(parent, 0.05, Math.hypot(w, h * 0.45), 0.05, C.woodLight, x, h * 0.02, z - d / 2 - 0.02);
    diag.rotation.z = Math.atan2(w, h * 0.45);
  }

  private tarp(parent: TransformNode, w: number, h: number, x: number, y: number, z: number, rotY = 0): void {
    this.cloth(parent, w, h, C.canvas, x, y, z, 0.18, rotY);
  }

  private windows(parent: TransformNode, xs: number[], y: number, z: number): void {
    for (const x of xs) {
      this.box(parent, 0.22, 0.32, 0.04, C.wood, x, y - 0.03, z + 0.01);
      this.box(parent, 0.16, 0.26, 0.04, C.window, x, y, z - 0.01, 0, true);
    }
  }

  private bannerPole(parent: TransformNode, x: number, z: number, h: number): void {
    this.box(parent, 0.06, h, 0.06, C.wood, x, 0, z);
    this.cloth(parent, 0.4, 0.75, C.banner, x + 0.24, h - 0.45, z);
    this.ball(parent, 0.1, '#e8c35a', x, h + 0.03, z);
  }

  private wallBanner(parent: TransformNode, x: number, y: number, z: number): void {
    this.cloth(parent, 0.34, 0.7, C.banner, x, y, z - 0.03);
    this.box(parent, 0.44, 0.04, 0.04, C.wood, x, y + 0.36, z - 0.04);
  }

  private lantern(parent: TransformNode, x: number, y: number, z: number): void {
    this.ball(parent, 0.14, C.window, x, y, z, true);
  }

  private async buildKind(kind: Kind, v: RoomView): Promise<void> {
    const { root, l1, l2, l3 } = v;
    switch (kind) {
      case 'stall': {
        await this.prop(l1, 'house_razed', 1.7, 0, 0.5);
        await this.prop(l2, 'house_b_intact', 1.7, 0, 0.5);
        // market stall in front
        for (const [px, pz] of [
          [-0.55, -0.6],
          [0.55, -0.6],
          [-0.55, -1.1],
          [0.55, -1.1],
        ] as const)
          this.box(root, 0.06, 0.8, 0.06, C.wood, px, 0, pz);
        this.box(root, 1.2, 0.08, 0.5, C.woodLight, 0, 0.45, -0.85);
        await this.prop(root, 'chest_closed', 0.4, 0.75, -0.6, 0.3);
        this.tarp(l1, 1.3, 0.6, 0, 0.9, -0.85);
        for (let i = 0; i < 4; i++) this.cloth(l2, 0.33, 0.6, i % 2 ? C.canvas : C.banner, -0.5 + i * 0.33, 0.95, -0.85, Math.PI / 2 - 0.35);
        this.scaffold(l1, 1.4, 1.4, 1.2, 0, 0.5);
        this.bannerPole(l3, -0.8, -0.3, 1.6);
        this.lantern(l3, 0.6, 0.85, -1.15);
        break;
      }
      case 'forge': {
        await this.prop(l1, 'house_razed', 1.6, 0.2, 0.5);
        await this.prop(l2, 'house_c_intact', 1.6, 0.2, 0.5);
        this.box(root, 0.4, 1.9, 0.4, C.stoneDark, -0.75, 0, 0.3);
        // anvil
        this.box(root, 0.28, 0.3, 0.2, '#4a4644', 0.3, 0, -0.75);
        this.box(root, 0.4, 0.1, 0.18, '#5a5654', 0.3, 0.3, -0.75);
        this.box(root, 0.5, 0.4, 0.4, C.stoneDark, -0.4, 0, -0.7);
        this.ball(root, 0.22, C.ember, -0.4, 0.45, -0.7, true);
        this.scaffold(l1, 0.6, 2, 0.6, -0.75, 0.3);
        this.tarp(l1, 1, 0.6, 0.3, 1.1, -0.4);
        this.wallBanner(l3, 0.2, 1.0, -0.25);
        v.smoke.push(this.smoke(root, -0.75, 2, 0.3));
        v.lights.push(this.light(root, C.ember, -0.4, 0.8, -0.9, 1.4, 4));
        break;
      }
      case 'garden': {
        await this.prop(l1, 'house_razed', 1.5, 0, 0.6);
        await this.prop(l2, 'house_d_intact', 1.5, 0, 0.6);
        for (let i = 0; i < 3; i++) {
          this.box(root, 0.36, 0.14, 0.9, C.wood, -0.6 + i * 0.5, 0, -0.6);
          for (let k = 0; k < 3; k++) this.ball(root, 0.18, k % 2 ? '#d58ab0' : '#9fc75a', -0.6 + i * 0.5, 0.2, -0.9 + k * 0.3);
        }
        this.scaffold(l1, 1.3, 1.3, 1.1, 0, 0.6);
        this.bannerPole(l3, 0.85, -0.4, 1.4);
        this.lantern(l3, -0.8, 0.7, -0.2);
        break;
      }
      case 'hall': {
        // the vaulted library behind the gate
        const w = 3;
        const d = 2.2;
        this.box(root, w, 2.1, d, C.stone, 0, 0, 0.9);
        this.box(root, 1.1, 1.5, 0.1, '#3b2b20', 0, 0, -0.21);
        this.cyl(root, 1.1, 1.1, 0.1, '#3b2b20', 0, 1.2, -0.21, 16).rotation.x = Math.PI / 2;
        for (const s of [-1, 1]) {
          this.box(root, 0.6, 3, 0.6, C.stoneWarm, s * 1.0, 0, -0.1);
          this.ball(root, 0.8, C.ivy, s * 1.15, 2.4, -0.15);
        }
        // L1: broken top
        for (let i = 0; i < 6; i++) this.box(l1, 0.45, 0.2 + this.rnd() * 0.6, 0.5, C.stoneDark, -1.2 + i * 0.48, 2.1, 0.1 + this.rnd() * 1.4);
        this.scaffold(l1, 1.1, 2.4, 0.8, 0, -0.55);
        this.tarp(l1, 1.4, 0.8, 0.9, 2.0, 0.4, 0.4);
        // L2: slate roof and lit windows
        this.gable(l2, w + 0.2, 1.1, d + 0.3, C.slate, 0, 2.1, 0.9);
        this.windows(l2, [-1.4, 1.4], 1.35, -0.21);
        this.box(l2, 0.9, 1.3, 0.04, C.window, 0, 0.05, -0.17, 0, true);
        // L3
        this.wallBanner(l3, -0.62, 1.6, -0.3);
        this.wallBanner(l3, 0.62, 1.6, -0.3);
        this.bannerPole(l3, 0, 2.9, 1.3);
        v.lights.push(this.light(root, C.window, 0, 1, -0.9, 1.2, 4));
        v.pin.y = 3.6;
        break;
      }
      case 'tavern': {
        await this.prop(l1, 'lodge_razed', 1.9, 0, 0.4);
        await this.prop(l2, 'lodge_intact', 1.9, 0, 0.4);
        for (const [px, pz] of [
          [-0.8, -0.6],
          [-0.55, -0.75],
          [0.85, -0.5],
        ] as const)
          this.cyl(root, 0.28, 0.32, 0.38, C.wood, px, 0, pz, 10);
        this.box(root, 0.8, 0.06, 0.4, C.woodLight, 0.15, 0.4, -0.8);
        this.scaffold(l1, 1.6, 1.4, 1.2, 0, 0.4);
        this.tarp(l1, 1.2, 0.5, 0, 1.3, -0.2);
        v.smoke.push(this.smoke(root, 0.5, 1.8, 0.6));
        this.lantern(l3, -0.3, 1, -0.3);
        this.lantern(l3, 0.4, 1, -0.3);
        this.wallBanner(l3, 0.05, 1.1, -0.2);
        break;
      }
      case 'wagon': {
        await this.prop(root, 'wagon_idle', 1.5, 0, 0, 0.4);
        await this.prop(root, 'chest_closed', 0.45, 0.9, -0.3, -0.3);
        await this.prop(root, 'chest_open', 0.45, -0.9, -0.4, 0.4);
        this.tarp(l1, 1.3, 0.7, 0, 0.4, 0.75, 0);
        // L2: a lean-to shed over the wagon
        for (const px of [-0.95, 0.95]) {
          this.box(l2, 0.08, 1.4, 0.08, C.wood, px, 0, 0.6);
          this.box(l2, 0.08, 1.0, 0.08, C.wood, px, 0, -0.5);
        }
        const roof = this.box(l2, 2.1, 0.08, 1.4, C.roof, 0, 1.15, 0.05);
        roof.rotation.x = -0.35;
        this.bannerPole(l3, 1.1, 0.4, 1.7);
        this.lantern(l3, -0.9, 1.0, -0.5);
        break;
      }
      case 'fire': {
        await this.prop(root, 'campfire_idle', 0.8, 0, 0);
        for (let i = 0; i < 3; i++) {
          const a = -Math.PI / 2 + (i - 1) * 1.2 + Math.PI;
          const log = this.cyl(root, 0.18, 0.18, 0.9, C.wood, Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8, 8);
          log.rotation.set(0, -a, Math.PI / 2);
          log.position.y = 0.1;
        }
        // the fire burns and lights at every level
        this.smoke(root, 0, 0.15, 0, true).start();
        this.light(root, C.ember, 0, 0.7, 0, 1.5, 4.5);
        this.tarp(l1, 1.2, 0.6, 0.9, 0.35, 0.6, 0.6);
        // L2: a little pavilion of posts and a cloth roof
        for (const [px, pz] of [
          [-0.95, 0.75],
          [0.95, 0.75],
        ] as const)
          this.box(l2, 0.07, 1.5, 0.07, C.wood, px, 0, pz);
        this.cloth(l2, 2, 0.8, C.canvas, 0, 1.35, 0.45, Math.PI / 2 - 0.6);
        for (let i = 0; i < 5; i++) this.lantern(l3, -0.9 + i * 0.45, 1.3 - Math.sin((i / 4) * Math.PI) * 0.2, 0.7);
        v.smoke.push(this.smoke(root, 0, 0.6, 0));
        break;
      }
      case 'tower': {
        this.cyl(root, 1.2, 1.3, 3.0, C.stoneWarm, 0, 0, 0, 20);
        for (let i = 0; i < 5; i++) this.box(l1, 0.3, 0.2 + this.rnd() * 0.4, 0.3, C.stoneDark, Math.cos(i * 1.3) * 0.5, 3.0, Math.sin(i * 1.3) * 0.5, i);
        this.scaffold(l1, 1.4, 3.2, 1.4);
        this.tarp(l1, 0.8, 0.9, 0, 1.8, -0.75);
        this.cyl(l2, 0, 1.6, 1.4, '#6a5a9a', 0, 3.0, 0, 20);
        this.box(l2, 0.16, 0.3, 0.04, C.violet, 0, 1.5, -0.64, 0, true);
        this.box(l2, 0.16, 0.3, 0.04, C.violet, 0, 2.4, -0.62, 0, true);
        this.cloth(l3, 0.3, 0.6, C.banner, 0.15, 4.4, 0);
        this.box(l3, 0.05, 0.9, 0.05, C.wood, 0, 4.3, 0);
        v.lights.push(this.light(root, C.violet, 0, 2, -1, 1.2, 3.5));
        v.pin.y = 4.6;
        break;
      }
      case 'academy': {
        await this.prop(l1, 'house_razed', 1.7, 0, 0.3);
        await this.prop(l2, 'house_intact', 1.7, 0, 0.3);
        this.scaffold(l1, 1.4, 1.5, 1.2, 0, 0.3);
        this.tarp(l1, 1.1, 0.6, 0.2, 1.2, -0.35);
        this.bannerPole(l3, -0.9, -0.3, 1.6);
        this.lantern(l3, 0.5, 0.9, -0.45);
        break;
      }
      case 'workshop': {
        for (const [px, pz] of [
          [-0.8, -0.5],
          [0.8, -0.5],
          [-0.8, 0.6],
          [0.8, 0.6],
        ] as const)
          this.box(root, 0.09, 1.2, 0.09, C.wood, px, 0, pz);
        this.box(root, 1.0, 0.08, 0.45, C.woodLight, 0, 0.5, 0.1);
        for (let i = 0; i < 3; i++) this.box(root, 0.32, 0.32, 0.32, C.woodLight, -0.6 + i * 0.25, 0, -0.85 + (i % 2) * 0.1, i * 0.3);
        this.cloth(l1, 1.9, 1.3, C.canvas, 0, 1.25, 0.05, Math.PI / 2 - 0.2);
        this.gable(l2, 1.9, 0.6, 1.4, C.roof, 0, 1.2, 0.05);
        this.bannerPole(l3, 0.95, -0.7, 1.5);
        this.lantern(l3, 0, 1.05, -0.5);
        break;
      }
      case 'yard': {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          this.box(root, 0.07, 0.45, 0.07, C.wood, Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95);
        }
        for (const [px, pz] of [
          [-0.35, 0.1],
          [0.35, -0.15],
        ] as const) {
          this.cyl(root, 0.18, 0.22, 0.75, '#c9a46a', px, 0, pz, 8);
          this.ball(root, 0.26, '#c9a46a', px, 0.9, pz);
          this.box(root, 0.6, 0.07, 0.07, C.wood, px, 0.6, pz);
        }
        this.tarp(l1, 1, 0.5, 0, 0.3, 0.9);
        for (let i = 0; i < 8; i++) {
          const a0 = (i / 8) * Math.PI * 2;
          const a1 = ((i + 1) / 8) * Math.PI * 2;
          const rail = this.box(l2, 0.76, 0.06, 0.06, C.woodLight, Math.cos((a0 + a1) / 2) * 0.92, 0.35, Math.sin((a0 + a1) / 2) * 0.92);
          rail.rotation.y = -((a0 + a1) / 2) + Math.PI / 2;
        }
        this.bannerPole(l3, 0.95, 0, 1.5);
        this.bannerPole(l3, -0.95, 0, 1.5);
        break;
      }
    }
  }

  /** Companion keepsakes at fixed places (§7): Brenna's axe stand, Jory's lute, Ysolde's book stack. */
  private async buildKeepsakes(): Promise<void> {
    const node = new TransformNode('castle:keepsakes', this.scene);
    const fire = this.rooms.get('campfire')?.root.position ?? new Vector3(2, 0, -3.5);
    const smith = this.rooms.get('smith')?.root.position ?? new Vector3(4, 0, 2);
    const hall = this.rooms.get('memorial')?.root.position ?? new Vector3(0, 0, 0);
    // Brenna's axe stand near the smithy
    const ax = smith.x - 1.3;
    const az = smith.z - 1.2;
    this.box(node, 0.6, 0.06, 0.25, C.wood, ax, 0, az);
    this.box(node, 0.06, 0.7, 0.06, C.wood, ax - 0.25, 0, az);
    this.box(node, 0.06, 0.7, 0.06, C.wood, ax + 0.25, 0, az);
    this.box(node, 0.6, 0.06, 0.06, C.wood, ax, 0.6, az);
    await this.weapon(node, 'axe', 0.75, ax - 0.1, 0.02, az - 0.06, new Vector3(0, 0, 0.12));
    await this.weapon(node, 'axe', 0.75, ax + 0.12, 0.02, az - 0.06, new Vector3(0, Math.PI, -0.12));
    // Jory's lute leaning at a barrel by the fire
    this.cyl(node, 0.3, 0.34, 0.42, C.wood, fire.x - 0.95, 0, fire.z - 0.55, 10);
    await this.weapon(node, 'lute', 0.7, fire.x - 0.95, 0.02, fire.z - 0.8, new Vector3(-0.35, 0.4, 0));
    // Ysolde's book stack at the foot of the hall
    for (let i = 0; i < 3; i++) await this.weapon(node, 'book', 0.32, hall.x - 1.35, 0.01 + i * 0.09, hall.z - 0.8, new Vector3(0, i * 0.5, 0));
  }

  // ------------------------------------------------------------------ view

  /**
   * Fewer draw calls: the primitives under each group (shell, room, level part, keepsakes) are merged per material. Prop
   * models, tap areas and emitters stay as they are.
   */
  private mergeStatic(): void {
    const groups = new Set<TransformNode>();
    for (const m of this.scene.meshes) if (m instanceof Mesh && m.parent instanceof TransformNode && m.name.startsWith('castle:') && !m.isPickable) groups.add(m.parent);
    for (const g of groups) {
      const byMat = new Map<StandardMaterial, Mesh[]>();
      for (const m of g.getChildMeshes(true))
        if (m instanceof Mesh && m.name.startsWith('castle:') && !m.isPickable && m.material instanceof StandardMaterial && m.getTotalVertices() > 0) {
          const list = byMat.get(m.material) ?? [];
          list.push(m);
          byMat.set(m.material, list);
        }
      for (const list of byMat.values()) {
        if (list.length < 2) continue;
        for (const m of list) m.computeWorldMatrix(true);
        const merged = Mesh.MergeMeshes(list, true, true);
        if (!merged) continue;
        merged.name = 'castle:merged';
        merged.setParent(g);
        merged.receiveShadows = true;
        merged.isPickable = false;
      }
    }
    // loose meshes without a group (path, paving)
    const loose = new Map<StandardMaterial, Mesh[]>();
    for (const m of this.scene.meshes)
      if (m instanceof Mesh && !m.parent && m.name === 'castle:box' && m.material instanceof StandardMaterial) {
        const list = loose.get(m.material) ?? [];
        list.push(m);
        loose.set(m.material, list);
      }
    for (const list of loose.values()) if (list.length > 1) Mesh.MergeMeshes(list, true, true)!.receiveShadows = true;
  }

  private freeze(): void {
    for (const m of this.mats.values()) m.freeze();
  }

  private refreshShadows(): void {
    const map = this.shadows?.getShadowMap();
    if (!map) return;
    this.sun.autoUpdateExtends = true;
    map.onAfterRenderObservable.addOnce(() => (this.sun.autoUpdateExtends = false));
    map.resetRefreshCounter();
  }

  private placeCamera(): void {
    const w = this.slot.clientWidth || 1;
    const h = this.slot.clientHeight || 1;
    const pitch = 0.82;
    // fit the diorama's width; a tall view (phone) has room above and below, the HUD and the room list cover it
    const dist = (R + 0.4) / Math.tan(this.camera.fov / 2) / (h > w * 1.2 ? 1.05 : 1);
    // aim a little behind the centre so the diorama sits low, in the band between the HUD and the room list
    const target = new Vector3(0, 0, 1.3);
    this.camera.position.set(target.x + Math.sin(this.yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z - Math.cos(this.yaw) * Math.cos(pitch) * dist);
    this.camera.setTarget(target);
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
      const world = Vector3.TransformCoordinates(new Vector3(0, v.pin.y, 0), v.root.getWorldMatrix());
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
