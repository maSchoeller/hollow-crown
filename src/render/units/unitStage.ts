/**
 * Story 16.15: the unit stage of the dress-up doll (figure sheet, art direction §4.6, DESIGN `dress-doll`): the figure's board model,
 * big, in the light ready stance (`ModelFigure` with `stanceSetup`, 16.10), its weapon and shield with the full rune glow (16.6),
 * turnable about the vertical axis by dragging. The scene knows no game state: it gets the parts of a unit (`StageUnit`) and what
 * `render.yaml` says (`unitStage`, `board`). The model, its baked animation and the dressing are the board's (`modelId`, `unitVatPath`,
 * `loadUnitModel`, `unitGear.ts`), and the files are held through `host.store(this)` (the shared cache), not loaded a second time.
 *
 * Contract: `show(unit)` loads the figure and dresses it (false: no model, the frame then shows the bust; a call that a newer `show`
 * has overtaken ends with false and leaves the newer one alone), `reset()` returns to the start pose, `dispose()` frees everything.
 */
import { Camera } from '@babylonjs/core/Cameras/camera';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { modelId, unitVatPath, type GameData } from '../../core';
import { renderHost, type AssetStore, type HostedView, type Quality, type RenderHost } from '../host';
import { loadManifest } from '../shared/assets';
import { ModelFigure } from '../shared/figures';
import { loadUnitModel } from '../shared/models';
import { gearOf, unitStanceKey, weaponOf, type GearOwner } from '../shared/unitGear';
import { listenTurntable } from '../items/stageInput';
import { fitDistance, StageMotion } from '../items/stageMath';

/** What the stage needs of a unit: the fields that pick its model (`modelId`) and what it wears. */
export interface StageUnit extends GearOwner {
  portrait?: string;
  sprite?: string;
  charId?: string;
}

export interface UnitStage {
  /** Loads the unit's board model, dresses it and sets it in its ready stance; false if there is no model (the frame shows the bust). */
  show(unit: StageUnit): Promise<boolean>;
  /** Back to the start pose (also a double tap). */
  reset(): void;
  dispose(): void;
}

const RAD = Math.PI / 180;
const hexColor = (h: string): Color3 => Color3.FromHexString(h);
const dir = (d: readonly [number, number, number]): Vector3 => new Vector3(d[0], d[1], d[2]);

export class UnitStageView implements HostedView, UnitStage {
  private host: RenderHost;
  private store: AssetStore;
  private scene;
  private camera: FreeCamera;
  private lights: Array<HemisphericLight | DirectionalLight> = [];
  private pivot: TransformNode;
  private figure: ModelFigure | null = null;
  private motion: StageMotion;
  private height: number;
  private disposed = false;
  private last = 0;
  /** every `show` takes a number; a load that finds a higher one when it ends gives its figure up */
  private turn = 0;
  /** the animation clock (ms) until which the stage draws at the active rate: the stance switch of a new figure */
  private settleUntil = 0;
  private input = new AbortController();
  private touchAction: string;

  constructor(
    private slot: HTMLElement,
    private data: GameData,
    quality: Quality,
  ) {
    const def = data.render.unitStage;
    this.height = def.fallbackHeight;
    this.host = renderHost(data);
    this.host.mount(slot);
    this.scene = this.host.scene;
    this.store = this.host.store(this);
    this.host.activate(this);
    this.host.setQuality(quality);
    this.scene.clearColor = new Color4(0, 0, 0, 0);
    this.camera = new FreeCamera('doll:cam', new Vector3(0, 0, -1), this.scene);
    this.camera.inputs.clear();
    this.camera.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
    this.camera.fov = def.fov * RAD;
    this.scene.activeCamera = this.camera;
    const hemi = new HemisphericLight('doll:ambient', new Vector3(0, 1, 0), this.scene);
    hemi.diffuse = hexColor(def.lights.ambient.color);
    hemi.groundColor = hexColor(def.lights.ambient.color).scale(0.55);
    hemi.specular = Color3.Black();
    hemi.intensity = def.lights.ambient.intensity;
    this.lights.push(hemi);
    for (const [name, l] of [
      ['key', def.lights.key],
      ['rim', def.lights.rim],
    ] as const) {
      const light = new DirectionalLight(`doll:${name}`, dir(l.direction).normalize(), this.scene);
      light.diffuse = hexColor(l.color);
      light.specular = Color3.Black();
      light.intensity = l.intensity;
      this.lights.push(light);
    }
    this.pivot = new TransformNode('doll:pivot', this.scene);
    // yaw only: the pitch stays at 0 (tilt limit 0, and the vertical drag is not passed on)
    this.motion = new StageMotion({ ...def, startPitchDeg: 0, tiltLimitDeg: 0 }, def.startYawDeg);
    this.touchAction = slot.style.touchAction;
    slot.style.touchAction = 'none';
    listenTurntable(slot, def, () => this.motion, this.input.signal, true);
    this.fit();
  }

  async show(unit: StageUnit): Promise<boolean> {
    const turn = ++this.turn;
    const manifest = (await loadManifest()).models;
    const mid = modelId(unit, manifest?.units ?? [], this.data.classes);
    const board = this.data.render.board;
    // the baked animation of the board's figures (the manifest lists them), as on the board
    const vatPath = board.vat && manifest?.vat?.includes(mid) ? unitVatPath(mid, manifest.unitPacks) : undefined;
    const model = await loadUnitModel(this.store, mid, 'player', `doll:${turn}`, gearOf(this.data, unit), manifest?.unitPacks, vatPath);
    if (!model) {
      // a unit without a model (sprite figure, Blender figure without a rig): the stage shows nothing, the frame shows the bust
      if (turn === this.turn) {
        this.figure?.dispose();
        this.figure = null;
      }
      return false;
    }
    if (this.disposed || turn !== this.turn) {
      model.dispose();
      return false;
    }
    this.figure?.dispose();
    this.figure = null;
    model.root.scaling.setAll(board.figureScale);
    const { switchS, gestureEveryS } = board.stance;
    const fig = new ModelFigure(model, weaponOf(this.data, unit)?.motion, board.idleHz, board.tintPool, { key: unitStanceKey(this.data, unit), switchS, gestureEveryS });
    fig.node.parent = this.pivot;
    fig.play('idle', 's', 1);
    fig.tint(0, 0, 1);
    // the chosen figure of the board: full rune glow and the ready stance
    fig.setRuneGlow('full');
    fig.setStance(true);
    this.figure = fig;
    this.settleUntil = performance.now() + switchS * 1000 + 400;
    this.measure();
    this.fit();
    return true;
  }

  reset(): void {
    this.motion.reset();
  }

  /** The figure's height from its bounds (the weapons hang on sockets and count); the yaml's fallback when they are not usable. */
  private measure(): void {
    const node = this.figure?.node;
    if (!node) return;
    node.computeWorldMatrix(true);
    const { min, max } = node.getHierarchyBoundingVectors(true);
    const h = max.y - min.y;
    this.height = Number.isFinite(h) && h > 0.2 && h < 20 ? h : this.data.render.unitStage.fallbackHeight;
  }

  private fit(): void {
    const def = this.data.render.unitStage;
    const e = this.host.engine;
    const aspect = e.getRenderWidth() / Math.max(1, e.getRenderHeight());
    const d = fitDistance(this.height / 2, def.fov, aspect, def.margin);
    const aimY = this.height * def.aimFraction;
    this.camera.position.set(0, aimY, -d);
    this.camera.setTarget(new Vector3(0, aimY, 0));
    this.camera.minZ = Math.max(0.05, d - this.height * 1.5);
    this.camera.maxZ = d + this.height * 3;
  }

  busy(now: number): boolean {
    return this.motion.busy() || now < this.settleUntil;
  }

  frame(now: number): void {
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    this.motion.step(dt);
    this.pivot.rotation.y = this.motion.yaw;
    this.figure?.tick(now, 1, true);
    this.scene.render();
  }

  resize(): void {
    this.fit();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.turn++;
    this.input.abort();
    this.slot.style.touchAction = this.touchAction;
    this.figure?.dispose();
    this.figure = null;
    this.pivot.dispose(false, false);
    for (const l of this.lights) l.dispose();
    this.camera.dispose();
    this.host.release(this);
    if (this.host.canvas.parentElement === this.slot) this.slot.removeChild(this.host.canvas);
  }
}
