/**
 * Story 16.14: the item stage (art direction §4.5, §4.7): one item, big, on the render host's stage, turnable by dragging. It is the
 * shared piece of the weapon view (16.14), the enchanter (16.16) and the armoury (16.18); the scene knows no game state, only a model
 * path, the runes in the settings (`GearRunes`) and what `render.yaml` says. Rune, channel glow, stones and the metal tint are the
 * ones of the board's rune weapons (`runeGlow.ts`, `runeLook.ts`), not a second implementation.
 *
 * Contract (kept stable): `show(path, runes)` loads the model and dresses it, `setRunes(runes, { grow })` swaps the runes (a new
 * stone grows in), `reset()` returns to the start pose, `dispose()` frees everything the stage made and gives the cached files back.
 * Models and stones are held through `host.store(this)` (the shared cache), so a model that the board loaded is not loaded again.
 */
import { Camera } from '@babylonjs/core/Cameras/camera';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { GameData, GearRunes } from '../../core';
import { renderHost, type AssetStore, type HostedView, type Quality, type RenderHost } from '../host';
import { dressRuneWeapon, RuneKit } from '../shared/runeGlow';
import { figureMaterial, instantiate, stoneLoader, teamColours } from '../shared/models';
import { fitDistance, StageMotion, uprightAngle } from './stageMath';

/** The stage as the UI and the other stories use it. */
export interface ItemStage {
  /** Loads the model file (`models/...glb`) and dresses it with `runes`; false if the file is missing (the frame then shows the item image). */
  show(path: string, runes: GearRunes): Promise<boolean>;
  /** Swaps the runes in the settings; `grow` lets a new stone grow in (0 to 1 over `itemStage.growMs`). */
  setRunes(runes: GearRunes, opts?: { grow?: boolean }): Promise<void>;
  /** Back to the start pose (also a double tap). */
  reset(): void;
  /** Frees the item, lights, camera, listeners and the cached files; the stage is dead afterwards. */
  dispose(): void;
}

const RAD = Math.PI / 180;
const hexColor = (h: string): Color3 => Color3.FromHexString(h);
const dir = (d: readonly [number, number, number]): Vector3 => new Vector3(d[0], d[1], d[2]);

/** `models/weapons-v2/axe.glb` gives `axe` */
function modelName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1).replace(/\.glb$/, '');
}

interface Setting {
  node: TransformNode;
  base: Vector3;
}

export class ItemStageView implements HostedView, ItemStage {
  private host: RenderHost;
  private store: AssetStore;
  private scene;
  private camera: FreeCamera;
  private lights: Array<HemisphericLight | DirectionalLight> = [];
  private metal: StandardMaterial;
  private pivot: TransformNode;
  private lift: TransformNode;
  private grip: TransformNode | null = null;
  private kit: RuneKit | null = null;
  private settings: Setting[] = [];
  private motion: StageMotion;
  private path = '';
  private runes: GearRunes | null = null;
  private radius = 0.3;
  private disposed = false;
  private last = 0;
  /** ms since the stones began to grow; null: not growing */
  private growing: number | null = null;
  private input = new AbortController();
  private touchAction: string;
  /** dressing runs one job at a time: the next `setRunes` waits for the one before */
  private working: Promise<unknown> = Promise.resolve();

  constructor(
    private slot: HTMLElement,
    private data: GameData,
    quality: Quality,
  ) {
    const def = data.render.itemStage;
    this.host = renderHost(data);
    this.host.mount(slot);
    this.scene = this.host.scene;
    this.store = this.host.store(this);
    this.host.activate(this);
    this.host.setQuality(quality);
    this.scene.clearColor = new Color4(0, 0, 0, 0);
    this.camera = new FreeCamera('stage:cam', new Vector3(0, 0, -1), this.scene);
    this.camera.inputs.clear();
    this.camera.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
    this.camera.fov = def.fov * RAD;
    this.scene.activeCamera = this.camera;
    const hemi = new HemisphericLight('stage:ambient', new Vector3(0, 1, 0), this.scene);
    hemi.diffuse = hexColor(def.lights.ambient.color);
    hemi.groundColor = hexColor(def.lights.ambient.color).scale(0.55);
    hemi.specular = Color3.Black();
    hemi.intensity = def.lights.ambient.intensity;
    this.lights.push(hemi);
    for (const [name, l] of [
      ['key', def.lights.key],
      ['rim', def.lights.rim],
    ] as const) {
      const light = new DirectionalLight(`stage:${name}`, dir(l.direction).normalize(), this.scene);
      light.diffuse = hexColor(l.color);
      light.specular = Color3.Black();
      light.intensity = l.intensity;
      this.lights.push(light);
    }
    this.metal = figureMaterial('stage:metal', this.scene, this.store.figureLook);
    this.pivot = new TransformNode('stage:pivot', this.scene);
    this.lift = new TransformNode('stage:lift', this.scene);
    this.lift.parent = this.pivot;
    this.motion = new StageMotion(def, 0);
    this.touchAction = slot.style.touchAction;
    slot.style.touchAction = 'none';
    this.listen();
  }

  // ------------------------------------------------------------------ input

  /** Drag turns the model, a quick second tap resets. Listeners go with `input.abort()`. */
  private listen(): void {
    const def = this.data.render.itemStage;
    const sig = { signal: this.input.signal };
    let down: { id: number; x: number; y: number; t: number; moved: number } | null = null;
    let lastTap = -Infinity;
    this.slot.addEventListener(
      'pointerdown',
      (e) => {
        if (down || e.button > 0) return;
        down = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
        this.slot.setPointerCapture?.(e.pointerId);
        this.motion.press();
      },
      sig,
    );
    this.slot.addEventListener(
      'pointermove',
      (e) => {
        if (!down || e.pointerId !== down.id) return;
        const now = performance.now();
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        down.moved += Math.abs(dx) + Math.abs(dy);
        this.motion.drag(dx, dy, now - down.t);
        down.x = e.clientX;
        down.y = e.clientY;
        down.t = now;
      },
      sig,
    );
    const up = (e: PointerEvent): void => {
      if (!down || e.pointerId !== down.id) return;
      const tap = down.moved <= def.tapSlopPx;
      down = null;
      this.motion.release();
      if (!tap) return;
      const now = performance.now();
      if (now - lastTap <= def.doubleTapMs) {
        lastTap = -Infinity;
        this.motion.reset();
      } else lastTap = now;
    };
    this.slot.addEventListener('pointerup', up, sig);
    this.slot.addEventListener('pointercancel', up, sig);
  }

  // ------------------------------------------------------------------ item

  async show(path: string, runes: GearRunes): Promise<boolean> {
    this.path = path;
    this.runes = runes;
    return this.queue(() => this.build(false));
  }

  async setRunes(runes: GearRunes, opts: { grow?: boolean } = {}): Promise<void> {
    this.runes = runes;
    if (!this.path) return;
    await this.queue(() => this.build(!!opts.grow));
  }

  reset(): void {
    this.motion.reset();
  }

  private queue(job: () => Promise<boolean>): Promise<boolean> {
    const run = this.working.then(job, job);
    this.working = run.catch(() => false);
    return run;
  }

  /** Throws away the dressed item (its meshes, nodes and the kit); the cached files stay. */
  private clearItem(): void {
    this.grip?.dispose(false, false);
    this.grip = null;
    this.kit = null;
    this.settings = [];
  }

  private async build(grow: boolean): Promise<boolean> {
    const runes = this.runes;
    const glow = this.store.runeGlow;
    const def = this.data.render.itemStage;
    const c = await this.store.container(this.path);
    if (!c || this.disposed || !runes) return false;
    this.clearItem();
    const grip = new TransformNode('stage:grip', this.scene);
    grip.parent = this.lift;
    this.grip = grip;
    const inst = instantiate(c, this.scene, (n) => `stage:item:${n}`);
    const own: Mesh[] = [];
    for (const glRoot of inst.rootNodes) {
      // the file's handedness root is dropped, as on the board: the meshes keep their glTF-local transforms
      for (const n of glRoot.getChildren()) (n as TransformNode).parent = grip;
      glRoot.dispose();
    }
    for (const m of grip.getChildMeshes(false)) {
      if (!(m instanceof Mesh) || !m.getTotalVertices() || !m.name.startsWith('stage:item:')) continue;
      if (m.isVerticesDataPresent(VertexBuffer.ColorKind)) {
        m.makeGeometryUnique();
        teamColours(m, this.store.figureLook.teams.player);
      }
      m.isPickable = false;
      own.push(m);
    }
    let metal = own;
    if (glow) {
      this.kit = new RuneKit(this.store.materials, this.scene, glow);
      this.kit.setState('full');
      metal = await dressRuneWeapon(this.kit, glow, runes, grip, own, stoneLoader(this.store, 'stage:item', () => this.disposed || this.grip !== grip));
      if (this.disposed || this.grip !== grip) return false;
    }
    for (const m of metal) m.material = this.metal;
    this.settings = grip
      .getDescendants(false)
      .filter((n) => /:socket_rune_[ab]/.test(n.name))
      .map((n) => ({ node: n as TransformNode, base: (n as TransformNode).scaling.clone() }));
    this.pose(metal, def.models[modelName(this.path)]);
    this.growing = grow ? 0 : null;
    if (grow) this.applyGrow(0);
    this.fit();
    return true;
  }

  /** Stands the model as `render.yaml` says (yaw, long axis up), centres it on the pivot and measures it. */
  private pose(meshes: Mesh[], pose: { yaw: number; upright?: boolean } | undefined): void {
    this.lift.rotation.set(0, 0, 0);
    this.lift.position.setAll(0);
    this.motion = new StageMotion(this.data.render.itemStage, pose?.yaw ?? 0);
    if (pose?.upright) {
      const yz: number[] = [];
      for (const m of meshes) {
        const p = m.getVerticesData(VertexBuffer.PositionKind);
        if (p) for (let i = 0; i < p.length; i += 3) yz.push(p[i + 1]!, p[i + 2]!);
      }
      this.lift.rotation.x = uprightAngle(yz);
    }
    this.pivot.rotation.set(0, 0, 0);
    this.lift.computeWorldMatrix(true);
    for (const m of this.grip!.getChildMeshes(false)) m.computeWorldMatrix(true);
    const { min, max } = this.lift.getHierarchyBoundingVectors(true);
    this.lift.position = min.add(max).scale(-0.5);
    this.radius = Math.max(0.05, max.subtract(min).length() / 2);
  }

  /** The stones of the settings at `k` (0-1) of their size. */
  private applyGrow(k: number): void {
    for (const s of this.settings) s.node.scaling.copyFrom(s.base).scaleInPlace(k);
  }

  // ------------------------------------------------------------------ frame

  private fit(): void {
    const e = this.host.engine;
    const aspect = e.getRenderWidth() / Math.max(1, e.getRenderHeight());
    const d = fitDistance(this.radius, this.data.render.itemStage.fov, aspect, this.data.render.itemStage.margin);
    this.camera.position.set(0, 0, -d);
    this.camera.setTarget(Vector3.Zero());
    this.camera.minZ = Math.max(0.01, d - this.radius * 1.5);
    this.camera.maxZ = d + this.radius * 3;
  }

  busy(): boolean {
    const r = this.runes;
    return this.motion.busy() || this.growing !== null || r?.main?.tier === 3 || r?.small?.tier === 3;
  }

  frame(now: number): void {
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    this.motion.step(dt);
    this.pivot.rotation.set(this.motion.pitch, this.motion.yaw, 0);
    if (this.growing !== null) {
      this.growing += dt * 1000;
      const gm = this.data.render.itemStage.growMs;
      const k = gm <= 0 ? 1 : Math.min(1, this.growing / gm);
      this.applyGrow(1 - (1 - k) * (1 - k));
      if (k >= 1) this.growing = null;
    }
    this.scene.render();
  }

  resize(): void {
    this.fit();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.input.abort();
    this.slot.style.touchAction = this.touchAction;
    this.clearItem();
    this.lift.dispose(false, false);
    this.pivot.dispose(false, false);
    this.metal.dispose(false, false);
    for (const l of this.lights) l.dispose();
    this.camera.dispose();
    this.host.release(this);
    if (this.host.canvas.parentElement === this.slot) this.slot.removeChild(this.host.canvas);
  }
}
