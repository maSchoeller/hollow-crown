/**
 * Story 16.18: the armoury vault (art direction §7, mockup `ausruestung-2026-11/vitrine.html` variant C): a stone hall with a
 * turntable of round stands. A swipe turns the wheel and it snaps onto a stand; the front piece stands in the light, every piece
 * turns slowly and its runes glow as on the board. Worn pieces stand as a bright, half transparent outline; a piece without a model
 * shows its item picture as a billboard. The scene knows no game state: the app hands it one `ArmoryStandSpec` per stand and it
 * reports the front stand and taps. Name plates are DOM elements that the scene puts under their stand each frame (`setPlate`).
 * Models and stones are held through `host.store(this)` (the shared cache); `dispose()` frees everything the view made.
 */
import { Camera } from '@babylonjs/core/Cameras/camera';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { SpotLight } from '@babylonjs/core/Lights/spotLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import '@babylonjs/core/Culling/ray';
import type { GameData, GearRunes } from '../../core';
import { renderHost, type AssetStore, type HostedView, type Quality, type RenderHost } from '../host';
import { dressRuneWeapon, RuneKit } from '../shared/runeGlow';
import { figureMaterial, instantiate, stoneLoader, teamColours } from '../shared/models';
import { Carousel, plateVisible, standPosition } from './armoryMath';
import { fitDistance, uprightAngle } from './stageMath';

/** What one stand shows (made by the app from the campaign, see `armoryOf`). */
export interface ArmoryStandSpec {
  /** stable id of the stand (item uid or def id) */
  key: string;
  /** no piece on the stand: a hidden relic or a signature within reach */
  empty: boolean;
  /** the model file (`models/....glb`); null: the item picture shows */
  model: string | null;
  /** the item picture's URL, for a piece without (or without a loadable) model */
  image: string | null;
  /** the key into `itemStage.models` that poses the model (the group's model name) */
  poseKey?: string;
  runes: GearRunes;
  /** colour of the ring on the stand (`#rrggbb`): the rune's, gold without rune, grey for an empty stand */
  ring: string;
  /** worn by a figure: the piece shows as a half transparent outline */
  worn: boolean;
}

export interface ArmoryHooks {
  /** another stand came to the front (also while the wheel still turns) */
  onFront(index: number): void;
  /** a piece was tapped (the index of its stand) */
  onOpen(index: number): void;
}

const RAD = Math.PI / 180;
const hex = (h: string): Color3 => Color3.FromHexString(h);
/** height of the wheel's top, where the stands stand */
const WHEEL_TOP = 0.16;

interface Stand {
  index: number;
  node: TransformNode;
  parts: Array<{ dispose(): void }>;
  pivot: TransformNode | null;
  /** start yaw of the model (rad), spin on top */
  yaw0: number;
  spin: number;
  /** scale that fits the piece's hull to `pieceSize`; `spins`: a model (not a billboard) turns */
  fit: number;
  spins: boolean;
  dead: boolean;
}

export class ArmoryView implements HostedView {
  private host: RenderHost;
  private store: AssetStore;
  private scene;
  private camera: FreeCamera;
  private fixed: Array<{ dispose(): void }> = [];
  private metal: StandardMaterial;
  private ghost: StandardMaterial;
  private stoneMat: StandardMaterial;
  private stands: Stand[] = [];
  private specs: ArmoryStandSpec[] = [];
  private carousel: Carousel;
  private plates = new Map<number, HTMLElement>();
  private lastFront = -1;
  private last = 0;
  private disposed = false;
  private input = new AbortController();
  private touchAction: string;
  private gen = 0;

  constructor(
    private slot: HTMLElement,
    private data: GameData,
    private hooks: ArmoryHooks,
    quality: Quality,
  ) {
    const def = data.render.armory;
    this.host = renderHost(data);
    this.host.mount(slot);
    this.scene = this.host.scene;
    this.store = this.host.store(this);
    this.host.activate(this);
    this.host.setQuality(quality);
    const wall = hex(def.colors.wall);
    this.scene.clearColor = new Color4(wall.r, wall.g, wall.b, 1);
    this.camera = new FreeCamera('armory:cam', new Vector3(0, def.camera.height, -def.wheelRadius - def.camera.distance), this.scene);
    this.camera.inputs.clear();
    this.camera.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
    this.camera.fov = def.fov * RAD;
    this.scene.activeCamera = this.camera;
    this.metal = figureMaterial('armory:metal', this.scene, this.store.figureLook);
    this.ghost = new StandardMaterial('armory:ghost', this.scene);
    this.ghost.diffuseColor = hex(def.colors.ghost);
    this.ghost.emissiveColor = hex(def.colors.ghost).scale(0.7);
    this.ghost.specularColor = Color3.Black();
    this.ghost.alpha = def.ghostAlpha;
    this.ghost.backFaceCulling = false;
    this.stoneMat = this.matte('armory:stone', def.colors.stone);
    this.buildHall();
    this.carousel = new Carousel(def, 0);
    this.touchAction = slot.style.touchAction;
    slot.style.touchAction = 'none';
    this.fit();
    this.listen();
  }

  // ------------------------------------------------------------------ hall

  private matte(name: string, colour: string): StandardMaterial {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = hex(colour);
    m.specularColor = Color3.Black();
    this.fixed.push(m);
    return m;
  }

  /** Floor, curved wall, pillars, the wheel and the lights; all of it stays for the life of the view. */
  private buildHall(): void {
    const def = this.data.render.armory;
    const keep = <T extends { dispose(): void }>(x: T): T => {
      this.fixed.push(x);
      return x;
    };
    const floor = keep(CreateCylinder('armory:floor', { diameter: def.hall.radius * 2, height: 0.2, tessellation: 48 }, this.scene));
    floor.position.y = -0.1;
    floor.material = this.matte('armory:floorMat', def.colors.floor);
    const wall = keep(CreateCylinder('armory:wall', { diameter: def.hall.radius * 2, height: def.hall.height, tessellation: 48, cap: Mesh.NO_CAP, sideOrientation: Mesh.BACKSIDE }, this.scene));
    wall.position.y = def.hall.height / 2;
    wall.material = this.matte('armory:wallMat', def.colors.wall);
    // pillars in a half ring behind the wheel
    const ring = def.hall.radius - def.pillarRadius * 1.6;
    for (let i = 0; i < def.pillars; i++) {
      const a = def.pillars === 1 ? Math.PI / 2 : (i / (def.pillars - 1)) * Math.PI;
      const p = keep(CreateCylinder(`armory:pillar:${i}`, { diameter: def.pillarRadius * 2, height: def.hall.height, tessellation: 14 }, this.scene));
      p.position.set(Math.cos(a) * ring, def.hall.height / 2, Math.sin(a) * ring);
      p.material = this.stoneMat;
    }
    const wheel = keep(CreateCylinder('armory:wheel', { diameter: (def.wheelRadius + def.standRadius + 0.35) * 2, height: WHEEL_TOP, tessellation: 48 }, this.scene));
    wheel.position.y = WHEEL_TOP / 2;
    wheel.material = this.matte('armory:wheelMat', def.colors.wheel);
    const ambient = keep(new HemisphericLight('armory:ambient', new Vector3(0, 1, 0), this.scene));
    ambient.diffuse = hex(def.lights.ambient.color);
    ambient.groundColor = hex(def.lights.ambient.color).scale(0.5);
    ambient.specular = Color3.Black();
    ambient.intensity = def.lights.ambient.intensity;
    const k = def.lights.key;
    const key = keep(new DirectionalLight('armory:key', new Vector3(k.direction[0], k.direction[1], k.direction[2]).normalize(), this.scene));
    key.diffuse = hex(k.color);
    key.specular = Color3.Black();
    key.intensity = k.intensity;
    // the warm cone from above on the front stand
    const s = def.lights.spot;
    const spot = keep(new SpotLight('armory:spot', new Vector3(0, s.height, -def.wheelRadius), new Vector3(0, -1, 0), s.angleDeg * RAD, s.exponent, this.scene));
    spot.diffuse = hex(s.color);
    spot.specular = Color3.Black();
    spot.intensity = s.intensity;
  }

  /** The camera backs off until the front stand and its neighbours fit the narrow side of a phone. */
  private fit(): void {
    const def = this.data.render.armory;
    const e = this.host.engine;
    const aspect = e.getRenderWidth() / Math.max(1, e.getRenderHeight());
    const d = Math.max(def.camera.distance, fitDistance(def.wheelRadius * 0.62 + def.standRadius, def.fov, aspect, 1.15));
    this.camera.position.set(0, def.camera.height, -def.wheelRadius - d);
    this.camera.setTarget(new Vector3(0, def.camera.aimY, -def.wheelRadius * 0.5));
    this.camera.minZ = 0.3;
    this.camera.maxZ = 120;
  }

  // ------------------------------------------------------------------ stands

  /** Sets the stands (rebuilds all of them, keeping the front index where it can); resolves when every piece is built. */
  async setStands(specs: ArmoryStandSpec[], front = this.carousel.front()): Promise<void> {
    if (this.disposed) return;
    this.clearStands();
    this.specs = specs;
    this.carousel.setCount(specs.length, front);
    this.lastFront = -1;
    const gen = ++this.gen;
    this.stands = specs.map((s, i) => this.makeStand(s, i));
    await Promise.all(this.stands.map((st, i) => this.buildPiece(st, specs[i]!, gen)));
  }

  /** Brings stand `i` to the front. */
  goTo(i: number): void {
    this.carousel.snapTo(i);
  }

  front(): number {
    return this.carousel.front();
  }

  /** The DOM plate of stand `i` (null removes it): placed under its stand each frame. */
  setPlate(i: number, el: HTMLElement | null): void {
    if (el) this.plates.set(i, el);
    else this.plates.delete(i);
  }

  private makeStand(spec: ArmoryStandSpec, index: number): Stand {
    const def = this.data.render.armory;
    const node = new TransformNode(`armory:stand:${index}`, this.scene);
    const st: Stand = { index, node, parts: [], pivot: null, yaw0: 0, spin: 0, fit: 1, spins: false, dead: false };
    const base = CreateCylinder(`armory:base:${index}`, { diameter: def.standRadius * 2, height: def.standHeight, tessellation: 28 }, this.scene);
    base.parent = node;
    base.position.y = def.standHeight / 2 + WHEEL_TOP;
    base.material = this.stoneMat;
    base.metadata = { armoryStand: index };
    const ring = CreateTorus(`armory:ring:${index}`, { diameter: def.standRadius * 1.7, thickness: def.ringWidth, tessellation: 36 }, this.scene);
    ring.parent = node;
    ring.position.y = def.standHeight + WHEEL_TOP + def.ringWidth * 0.2;
    const mat = new StandardMaterial(`armory:ringMat:${index}`, this.scene);
    mat.disableLighting = true;
    mat.emissiveColor = hex(spec.ring);
    ring.material = mat;
    ring.metadata = { armoryStand: index };
    st.parts.push(base, ring, mat);
    return st;
  }

  private clearStands(): void {
    for (const st of this.stands) {
      st.dead = true;
      for (const p of st.parts) p.dispose();
      st.node.dispose(false, false);
    }
    this.stands = [];
  }

  /** The piece on a stand: its model, posed and fitted (dressed with runes, or the outline when worn), else its picture; nothing for an empty stand. */
  private async buildPiece(st: Stand, spec: ArmoryStandSpec, gen: number): Promise<void> {
    if (spec.empty) return;
    const alive = (): boolean => !this.disposed && !st.dead && gen === this.gen;
    if (spec.model && (await this.buildModel(st, spec, alive))) return;
    if (alive() && spec.image) this.buildBillboard(st, spec);
  }

  private async buildModel(st: Stand, spec: ArmoryStandSpec, alive: () => boolean): Promise<boolean> {
    const def = this.data.render.armory;
    const glow = this.store.runeGlow;
    const c = await this.store.container(spec.model!);
    if (!c || !alive()) return false;
    const prefix = `armory:${st.index}:`;
    const pivot = new TransformNode(`${prefix}pivot`, this.scene);
    const lift = new TransformNode(`${prefix}lift`, this.scene);
    lift.parent = pivot;
    const grip = new TransformNode(`${prefix}grip`, this.scene);
    grip.parent = lift;
    const inst = instantiate(c, this.scene, (n) => `${prefix}item:${n}`);
    const own: Mesh[] = [];
    for (const root of inst.rootNodes) {
      // the file's handedness root is dropped, as on the board and the item stage
      for (const n of root.getChildren()) (n as TransformNode).parent = grip;
      root.dispose();
    }
    for (const m of grip.getChildMeshes(false)) {
      if (!(m instanceof Mesh) || !m.getTotalVertices() || !m.name.startsWith(`${prefix}item:`)) continue;
      if (!spec.worn && m.isVerticesDataPresent(VertexBuffer.ColorKind)) {
        m.makeGeometryUnique();
        teamColours(m, this.store.figureLook.teams.player);
      }
      m.isPickable = true;
      m.metadata = { armoryStand: st.index };
      own.push(m);
    }
    let metal = own;
    if (spec.worn) {
      // a pale outline: the model's vertex colours (wood, leather) would tint it
      for (const m of own) {
        m.useVertexColors = false;
        m.material = this.ghost;
      }
    } else {
      if (glow) {
        const kit = new RuneKit(this.store.materials, this.scene, glow);
        kit.setState('full');
        metal = await dressRuneWeapon(kit, glow, spec.runes, grip, own, stoneLoader(this.store, `${prefix}item`, () => !alive()));
      }
      for (const m of metal) m.material = this.metal;
    }
    if (!alive()) {
      pivot.dispose(false, false);
      return false;
    }
    const pose = this.data.render.itemStage.models[spec.poseKey ?? ''];
    lift.rotation.set(0, 0, 0);
    lift.position.setAll(0);
    if (pose?.upright) {
      const yz: number[] = [];
      for (const m of metal) {
        const p = m.getVerticesData(VertexBuffer.PositionKind);
        if (p) for (let i = 0; i < p.length; i += 3) yz.push(p[i + 1]!, p[i + 2]!);
      }
      lift.rotation.x = uprightAngle(yz);
    }
    pivot.computeWorldMatrix(true);
    for (const m of grip.getChildMeshes(false)) m.computeWorldMatrix(true);
    const { min, max } = lift.getHierarchyBoundingVectors(true);
    lift.position = min.add(max).scale(-0.5);
    const radius = Math.max(0.05, max.subtract(min).length() / 2);
    st.fit = def.pieceSize / 2 / radius;
    st.yaw0 = (pose?.yaw ?? 0) * RAD;
    st.pivot = pivot;
    st.spins = true;
    pivot.parent = st.node;
    st.parts.push({ dispose: () => pivot.dispose(false, false) });
    return true;
  }

  private buildBillboard(st: Stand, spec: ArmoryStandSpec): void {
    const def = this.data.render.armory;
    const plane = CreatePlane(`armory:image:${st.index}`, { size: def.pieceSize * 0.8 }, this.scene);
    plane.billboardMode = Mesh.BILLBOARDMODE_Y;
    plane.parent = st.node;
    plane.metadata = { armoryStand: st.index };
    const tex = new Texture(spec.image!, this.scene);
    tex.hasAlpha = true;
    const mat = new StandardMaterial(`armory:imageMat:${st.index}`, this.scene);
    mat.disableLighting = true;
    mat.emissiveTexture = tex;
    mat.opacityTexture = tex;
    mat.backFaceCulling = false;
    if (spec.worn) mat.alpha = def.ghostAlpha;
    plane.material = mat;
    st.pivot = plane;
    st.fit = 1;
    st.spins = false;
    st.parts.push(plane, mat, tex);
  }

  // ------------------------------------------------------------------ input

  /** A swipe turns the wheel; a tap on a piece opens it (an empty stand is brought to the front). Listeners go with `input.abort()`. */
  private listen(): void {
    const def = this.data.render.armory;
    const sig = { signal: this.input.signal };
    let down: { id: number; x: number; t: number; moved: number } | null = null;
    this.slot.addEventListener(
      'pointerdown',
      (e) => {
        if (down || e.button > 0) return;
        down = { id: e.pointerId, x: e.clientX, t: performance.now(), moved: 0 };
        this.carousel.press();
        // capture can throw for a pointer the browser no longer tracks; the swipe still works without it
        try {
          this.slot.setPointerCapture?.(e.pointerId);
        } catch {
          /* no capture */
        }
      },
      sig,
    );
    this.slot.addEventListener(
      'pointermove',
      (e) => {
        if (!down || e.pointerId !== down.id) return;
        const now = performance.now();
        const dx = e.clientX - down.x;
        down.moved += Math.abs(dx);
        this.carousel.drag(dx, now - down.t);
        down.x = e.clientX;
        down.t = now;
      },
      sig,
    );
    const up = (e: PointerEvent): void => {
      if (!down || e.pointerId !== down.id) return;
      const tap = down.moved <= def.tapSlopPx && e.type === 'pointerup';
      down = null;
      this.carousel.release();
      if (!tap) return;
      const r = this.host.canvas.getBoundingClientRect();
      const hit = this.scene.pick(e.clientX - r.left, e.clientY - r.top, (m) => (m.metadata as { armoryStand?: number } | null)?.armoryStand !== undefined && m.isEnabled());
      const i = (hit?.pickedMesh?.metadata as { armoryStand?: number } | null)?.armoryStand;
      if (i === undefined) return;
      if (this.specs[i]?.empty) this.carousel.snapTo(i);
      else this.hooks.onOpen(i);
    };
    this.slot.addEventListener('pointerup', up, sig);
    this.slot.addEventListener('pointercancel', up, sig);
  }

  // ------------------------------------------------------------------ frame

  busy(): boolean {
    return this.carousel.busy() || (this.data.render.armory.spinDegPerSec > 0 && this.stands.some((s) => s.spins));
  }

  frame(now: number): void {
    const def = this.data.render.armory;
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    this.carousel.step(dt);
    const n = this.stands.length;
    const front = this.carousel.front();
    if (front !== this.lastFront) {
      this.lastFront = front;
      if (n > 0) this.hooks.onFront(front);
    }
    for (const st of this.stands) {
      const p = standPosition(st.index, n, this.carousel.rot, def.wheelRadius);
      st.node.position.set(p.x, 0, p.z);
      const pv = st.pivot;
      if (!pv) continue;
      // 0 away, 1 in front: the front piece grows and rises a little
      const k = Math.min(1, Math.max(0, (-p.z / def.wheelRadius - 0.5) / 0.5));
      const grow = 1 + (def.frontScale - 1) * k;
      pv.position.set(0, def.standHeight + WHEEL_TOP + def.pieceLift + (def.pieceSize / 2) * grow + def.frontLift * k, 0);
      if (st.spins) {
        st.spin += def.spinDegPerSec * RAD * dt;
        pv.rotation.set(0, st.yaw0 + st.spin, 0);
        pv.scaling.setAll(st.fit * grow);
      }
    }
    this.scene.render();
    this.placePlates(front);
  }

  /** Puts each plate under its stand; only the front stand and its neighbours show. */
  private placePlates(front: number): void {
    if (!this.plates.size) return;
    const def = this.data.render.armory;
    const n = this.stands.length;
    const vp = new Viewport(0, 0, this.slot.clientWidth, this.slot.clientHeight);
    const tm = this.scene.getTransformMatrix();
    for (const [i, el] of this.plates) {
      const st = this.stands[i];
      if (!st || !plateVisible(i, front, n, def.plateReach)) {
        el.style.visibility = 'hidden';
        continue;
      }
      // the stand hangs on the turning wheel: its world position, not the local one
      const at = st.node.getAbsolutePosition().add(new Vector3(0, def.plateAnchorY + WHEEL_TOP, 0));
      const p = Vector3.Project(at, Matrix.IdentityReadOnly, tm, vp);
      // a neighbour's plate near the edge stays whole on the screen
      const half = el.offsetWidth / 2 + 6;
      el.style.left = `${Math.min(Math.max(p.x, half), vp.width - half)}px`;
      el.style.top = `${p.y}px`;
      // the stylesheet hides a plate until the scene has placed it: an empty inline value would fall back to that
      el.style.visibility = 'visible';
    }
  }

  resize(): void {
    this.fit();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.input.abort();
    this.slot.style.touchAction = this.touchAction;
    this.clearStands();
    for (const f of this.fixed) f.dispose();
    this.ghost.dispose(false, false);
    this.metal.dispose(false, false);
    this.camera.dispose();
    this.host.release(this);
    if (this.host.canvas.parentElement === this.slot) this.slot.removeChild(this.host.canvas);
  }
}
