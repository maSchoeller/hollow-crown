/**
 * The home castle: the Paktwacht in the mountain flank as a 3D scene on the render host (concept/23-art-direction §7).
 *
 * One model file, `models/castle/paktwacht.glb`, built by tools/art/blender_paktwacht.py and loaded on demand. It holds one
 * mesh per part, named `<group>_<tag>`, all modelled in place. Tag `a` always shows, any other tag lists the levels it shows
 * at: `shell` and `land` go by the castle tier 0-3 (`castleTier` in src/core/campaign/camp.ts), rooms and keepsakes by the
 * room level 1-3. Colours are vertex colours; glowing parts wear an unlit material. Evening light preset of `render.yaml`.
 *
 * The view looks at the castle from the south at 30° and only pans (drag): a little sideways, and down to the fields and the
 * river. Nothing turns, so the backs of the mountain and buildings do not exist.
 */
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
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

export interface CastleHooks {
  /** a building was tapped */
  onRoom(id: string): void;
}

const MODEL = 'models/castle/paktwacht.glb';

/** the rooms the castle model has */
export const CASTLE_ROOMS = ['convoy', 'workshop', 'merchant', 'campfire', 'tavern', 'smith', 'academy', 'healer', 'training', 'memorial', 'enchanter'];

const KEEPSAKES = ['axe', 'lute', 'books'];

/** [C] camera: angle above the horizon, horizontal field of view (kept on every screen), distance to the aim, height of the aim */
const PITCH = (30 * Math.PI) / 180;
const FOV = 0.426;
const DIST = 82;
const AIM_Y = 11;
/** the tip of the keep's roof (x, height, z), kept just under TOP of the view; it sets the aim's depth */
const KEEP_TIP = new Vector3(-5.5, 25.8, 19.2);
const TOP = 0.11;
/** [C] the scene fills the screen, but the room list covers its lower part: the picture's centre sits this much above the screen's (share of the height) */
const CENTRE_UP = 0.16;
/** [C] how far the view pans from there: sideways, and forwards (down to the river, negative) */
const PAN_X = 5;
const PAN_Z: [number, number] = [-27, 1];
const PAN_SPEED = 0.05;

/** [C] chimney smoke from level 3 (x, height, z in castle space, from LAYOUT and the room models) */
const SMOKE: Record<string, Array<[number, number, number]>> = {
  smith: [[-9.6, 12.4, 8]],
  tavern: [[-6.4, 13.1, 10.5]],
  healer: [[-8.7, 10.2, 3.3]],
};
const FIRE: [number, number, number] = [0, 7.3, 6.4];
/** [C] warm and rune light from level 3 */
const LIGHTS: Record<string, [string, number, number, number, number, number]> = {
  smith: ['#ff9a3c', -10.9, 8.1, 5.1, 1.2, 7],
  enchanter: ['#c9a2ff', 9.1, 14.5, 14.5, 1.2, 6],
};
const FIRE_LIGHT: [string, number, number, number, number, number] = ['#ff9a3c', 0, 8.6, 6.4, 1.4, 9];

/** part names of the model file (glTF primitives get a `_primitive<n>` suffix) */
const PART = /^(?:castle:)?([a-z]+)_(a|[0-9]+)(?:_primitive\d+)?$/;

/** One group's parts, each under its own node so it can switch as a whole. */
type Tagged = Array<{ tag: string; node: TransformNode }>;

function shown(tag: string, level: number): boolean {
  return tag === 'a' || tag.includes(String(level));
}

interface RoomView {
  id: string;
  root: TransformNode;
  parts: Tagged;
  smoke: ParticleSystem[];
  lights: PointLight[];
  /** where the room's stone sits */
  pin: Vector3;
  level: number;
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
  private tiered: Tagged = [];
  private tier = -1;
  private pins = new Map<string, HTMLElement>();
  private disposed = false;
  private input = new AbortController();
  /** the aim's depth at rest (fit, on resize) */
  private aimZ = -10;
  private panX = 0;
  private panZ = 0;
  private drag: { x: number; y: number; panX: number; panZ: number; id: number; moved: boolean } | null = null;
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
    this.camera = new FreeCamera('castle:cam', new Vector3(0, 40, -70), this.scene);
    this.camera.inputs.clear();
    this.camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    this.camera.fov = FOV;
    this.camera.minZ = 2;
    this.camera.maxZ = 300;
    this.scene.activeCamera = this.camera;
    this.hemi = new HemisphericLight('castle:ambient', new Vector3(0.2, 1, -0.3), this.scene);
    this.sun = new DirectionalLight('castle:sun', new Vector3(0.5, -1, 0.7), this.scene);
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
    this.fit();
    this.bindInput();
    if (import.meta.env.DEV) (window as unknown as { __castle: CastleView }).__castle = this;
  }

  // ------------------------------------------------------------------ host

  /** Always drawing: smoke and fire run. */
  busy(): boolean {
    return true;
  }

  frame(now: number): void {
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

  /** Loads the model; afterwards `show` sets the levels. False if the model could not be loaded. */
  async build(): Promise<boolean> {
    const parts = await this.loadParts();
    if (this.disposed || !parts) return false;
    for (const [key, meshes] of parts) {
      const at = key.lastIndexOf('_');
      const group = key.slice(0, at);
      const tag = key.slice(at + 1);
      if (group === 'shell' || group === 'land') this.tiered.push({ tag, node: this.attach(meshes, `tier:${key}`) });
    }
    for (const id of CASTLE_ROOMS) this.buildRoom(id, parts);
    for (const id of KEEPSAKES) this.attach(parts.get(`${id}_a`) ?? [], `keepsake:${id}`);
    // the campfire burns at every level
    this.smoke(FIRE, true).start();
    this.light(FIRE_LIGHT);
    if (this.shadows) {
      for (const m of this.scene.meshes) if (m.material === this.lit) this.shadows.addShadowCaster(m, false);
    }
    this.lit.freeze();
    this.glow.freeze();
    return true;
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

  private attach(meshes: Mesh[], name: string): TransformNode {
    const node = new TransformNode(`castle:${name}`, this.scene);
    for (const m of meshes) {
      m.parent = node;
      m.computeWorldMatrix(true);
      m.freezeWorldMatrix();
    }
    return node;
  }

  private buildRoom(id: string, parts: Map<string, Mesh[]>): void {
    if (!parts.has(`${id}_a`)) return;
    const root = new TransformNode(`castle:room:${id}`, this.scene);
    const v: RoomView = { id, root, parts: [], smoke: [], lights: [], pin: Vector3.Zero(), level: 0 };
    // footprint and height for the tap area and the stone
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);
    for (const [key, meshes] of parts) {
      const at = key.lastIndexOf('_');
      if (key.slice(0, at) !== id) continue;
      const tag = key.slice(at + 1);
      if (tag === 'a' || tag === '23')
        for (const m of meshes) {
          const b = m.getBoundingInfo().boundingBox;
          min.minimizeInPlace(b.minimum);
          max.maximizeInPlace(b.maximum);
        }
      const node = this.attach(meshes, `${id}:${tag}`);
      node.parent = root;
      v.parts.push({ tag, node });
    }
    const cx = (min.x + max.x) / 2;
    const cz = (min.z + max.z) / 2;
    v.pin = new Vector3(cx, max.y + 0.6, cz);
    for (const at of SMOKE[id] ?? []) v.smoke.push(this.smoke(at));
    const l = LIGHTS[id];
    if (l) v.lights.push(this.light(l));
    // a generous invisible tap area over the building
    const height = max.y - min.y + 0.6;
    const d = Math.max(4, Math.min(8, Math.max(max.x - min.x, max.z - min.z) * 0.9));
    const hit = CreateCylinder(`castle:hit:${id}`, { diameter: d, height, tessellation: 8 }, this.scene);
    hit.parent = root;
    hit.position.set(cx, min.y + height / 2, cz);
    hit.visibility = 0;
    hit.isPickable = true;
    hit.metadata = { room: id };
    this.rooms.set(id, v);
  }

  /** Shows a room at `level` (1-3), or not at all (0: not there yet). */
  setLevel(id: string, level: number): void {
    const v = this.rooms.get(id);
    if (!v || v.level === level) return;
    v.level = level;
    v.root.setEnabled(level > 0);
    for (const { tag, node } of v.parts) node.setEnabled(shown(tag, level));
    for (const p of v.smoke) {
      if (level >= 3) p.start();
      else p.stop();
    }
    for (const l of v.lights) l.setEnabled(level >= 3);
    this.refreshShadows();
  }

  /** Shows walls, keep and land at castle tier 0-3. */
  setTier(tier: number): void {
    if (tier === this.tier) return;
    this.tier = tier;
    for (const { tag, node } of this.tiered) node.setEnabled(shown(tag, tier));
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

  private smoke([x, y, z]: [number, number, number], fire = false): ParticleSystem {
    const p = new ParticleSystem('castle:smoke', fire ? 40 : 60, this.scene);
    p.particleTexture = this.smokeTex;
    p.emitter = new Vector3(x, y, z);
    p.minEmitBox = new Vector3(-0.1, 0, -0.1);
    p.maxEmitBox = new Vector3(0.1, 0, 0.1);
    if (fire) {
      p.color1 = new Color4(1, 0.75, 0.35, 1);
      p.color2 = new Color4(1, 0.45, 0.15, 1);
      p.colorDead = new Color4(0.6, 0.2, 0.05, 0);
      p.minSize = 0.25;
      p.maxSize = 0.6;
      p.minLifeTime = 0.3;
      p.maxLifeTime = 0.7;
      p.emitRate = 30;
      p.blendMode = ParticleSystem.BLENDMODE_ADD;
      p.direction1 = new Vector3(-0.1, 1, -0.1);
      p.direction2 = new Vector3(0.1, 1.4, 0.1);
      p.minEmitPower = 0.8;
      p.maxEmitPower = 1.5;
    } else {
      p.color1 = new Color4(0.85, 0.82, 0.8, 0.45);
      p.color2 = new Color4(0.75, 0.72, 0.72, 0.35);
      p.colorDead = new Color4(0.7, 0.7, 0.72, 0);
      p.minSize = 0.45;
      p.maxSize = 1.1;
      p.minLifeTime = 2;
      p.maxLifeTime = 3.5;
      p.emitRate = 9;
      p.blendMode = ParticleSystem.BLENDMODE_STANDARD;
      p.direction1 = new Vector3(0.1, 1, 0);
      p.direction2 = new Vector3(0.35, 1, 0.1);
      p.minEmitPower = 0.4;
      p.maxEmitPower = 0.8;
      p.minAngularSpeed = -0.4;
      p.maxAngularSpeed = 0.4;
    }
    p.gravity = new Vector3(0, 0, 0);
    p.preWarmCycles = 60;
    return p;
  }

  private light([color, x, y, z, intensity, range]: [string, number, number, number, number, number]): PointLight {
    const l = new PointLight('castle:light', new Vector3(x, y, z), this.scene);
    l.diffuse = Color3.FromHexString(color);
    l.specular = new Color3(0, 0, 0);
    l.intensity = intensity;
    l.range = range;
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
    const aim = new Vector3(this.panX, AIM_Y, this.aimZ + this.panZ);
    this.camera.position.set(aim.x, aim.y + Math.sin(PITCH) * DIST, aim.z - Math.cos(PITCH) * DIST);
    this.camera.setTarget(aim);
  }

  /** The aim's depth that puts the keep's tip just under the top of the view, whatever the screen's height; a few rounds of measuring. */
  private fit(): void {
    const w = this.slot.clientWidth || 1;
    const h = this.slot.clientHeight || 1;
    const vp = new Viewport(0, 0, w, h);
    const { panX, panZ } = this;
    this.panX = this.panZ = 0;
    this.shiftLens();
    for (let round = 0; round < 5; round++) {
      this.placeCamera();
      const m = this.camera.getViewMatrix(true).multiply(this.camera.getProjectionMatrix(true));
      const tip = Vector3.Project(KEEP_TIP, Matrix.IdentityReadOnly, m, vp).y;
      const a = Vector3.Project(new Vector3(0, AIM_Y, this.aimZ), Matrix.IdentityReadOnly, m, vp).y;
      const b = Vector3.Project(new Vector3(0, AIM_Y, this.aimZ + 1), Matrix.IdentityReadOnly, m, vp).y;
      this.aimZ += (h * TOP - tip) / Math.max(1e-3, a - b);
    }
    this.panX = panX;
    this.panZ = panZ;
    this.placeCamera();
  }

  /** Moves the picture's centre up without moving or tilting the camera, so the castle keeps its size on every screen height. */
  private shiftLens(): void {
    this.camera.unfreezeProjectionMatrix();
    const m = Array.from(this.camera.getProjectionMatrix(true).m);
    m[9] = CENTRE_UP * 2;
    this.camera.freezeProjectionMatrix(Matrix.FromArray(m));
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
      const p = Vector3.Project(v.pin, Matrix.IdentityReadOnly, tm, vp);
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      // panned away: no stone over the HUD
      el.style.visibility = p.y < h * TOP ? 'hidden' : '';
    }
  }

  private bindInput(): void {
    const c = this.host.canvas;
    const opts = { signal: this.input.signal };
    c.addEventListener(
      'pointerdown',
      (e) => {
        this.drag = { x: e.clientX, y: e.clientY, panX: this.panX, panZ: this.panZ, id: e.pointerId, moved: false };
      },
      opts,
    );
    c.addEventListener(
      'pointermove',
      (e) => {
        const d = this.drag;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (Math.hypot(dx, dy) > 8) d.moved = true;
        if (d.moved) {
          this.panX = Math.max(-PAN_X, Math.min(PAN_X, d.panX - dx * PAN_SPEED));
          this.panZ = Math.max(PAN_Z[0], Math.min(PAN_Z[1], d.panZ + dy * PAN_SPEED * 2));
        }
      },
      opts,
    );
    const end = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      this.drag = null;
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

/** `<group>_<tag>` of a loaded mesh, from its own name or its glTF node's */
function partKey(m: Node): string | null {
  for (let n: Node | null = m; n; n = n.parent) {
    const hit = PART.exec(n.name);
    if (hit) return `${hit[1]}_${hit[2]}`;
  }
  return null;
}
