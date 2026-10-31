/**
 * Base of the battle board (see board.ts): its state, the shared types and constants, constructor and teardown.
 * Part of the class chain BoardBase → BoardSetup → BoardProps → BoardUnits → BoardCamera → BoardFrame → BoardView.
 */
import type { Engine } from '@babylonjs/core/Engines/engine';
import type { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Material } from '@babylonjs/core/Materials/material';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Particles/particleSystemComponent';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture';
import type { BattleState, GameData, Pos, StatusId, Team, TimeOfDay, Weather } from '../../core';
import type { FxInfo } from '../shared/assets';
import type { GroundTextures, TerrainView } from '../shared/terrain3d';
import type { Glow } from '../shared/models';
import type { Facing, Figure, FigureAnim } from '../shared/figures';
import type { ResolvedLook } from '../shared/look';
import { renderHost, type AssetStore, type Hold, type HostedView, type Quality, type RenderHost } from '../host';
import type { OverlayMesh, Overlays } from './overlays';
import { Badges } from './badges';
import type { PropBox } from './fade';
import { RingLayer } from './rings';
import { WeatherView } from './weather';
import { AshBurst } from './ash';
import { StatusIcons } from './statusIcons';
import './board.css';
import { GrudgeLine } from './lieutenant';
import type { BoardHooks, GridLevel, PinOffset, FigureStyle } from './boardTypes';

export interface UnitView {
  uid: string;
  team: Team;
  sprite: string;
  /** weapon models on the figure's hands (GA9); a change rebuilds the figure */
  gear: string;
  figure: Figure;
  /** gold edge of a lieutenant's ring (story 3.1); its own mesh, there are only a few lieutenants */
  gold?: Mesh;
  /** tile position (float while moving) and a small offset for lunges/knockback, tiles */
  x: number;
  y: number;
  offX: number;
  offY: number;
  lift: number;
  facing: Facing;
  anim: FigureAnim;
  desat: number;
  flash: number;
  alpha: number;
  visible: boolean;
  downed: boolean;
  /** the tile (and visibility) the prop fade last saw this unit on; a change asks for a new fade pass (story 7.8) */
  fadeX: number;
  fadeY: number;
  fadeSeen: boolean;
}

export interface FxSprite {
  mesh: Mesh;
  mat: StandardMaterial;
  anim: string;
  start: number;
  loop: boolean;
}

/** Instances of one prop template; those hiding a unit move into its see-through twin (story 8.10). */
export interface PropSet {
  tpl: Mesh;
  shadow: boolean;
  mats: Float32Array;
  cols: Float32Array;
  boxes: PropBox[];
  faded: Uint8Array;
}

/** distance of the camera from its target along the view axis, tiles */
export const CAM_DIST = 60;
export const MAX_FIRES = 12;
/** Frames between a change of lights, fog, shadows or meshes and the next freeze of the static materials */
export const FREEZE_FRAMES = 12;
/** a figure this many tiles beyond the edge of the view is still worked out (it may step in next frame); farther ones are switched off */
export const OFFSCREEN_TILES = 1.5;
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** rAF with a timer fallback (rAF stops in background panes; animations must still finish). */
export const schedule = (fn: () => void): void => {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  requestAnimationFrame(run);
  setTimeout(run, 50);
};

export abstract class BoardBase implements HostedView {
  readonly engine: Engine;
  readonly scene: Scene;
  protected host: RenderHost;
  protected store: AssetStore;
  /** removes the input listeners from the shared canvas */
  protected input = new AbortController();
  protected camera: FreeCamera;
  protected hooks: BoardHooks;
  protected data: GameData;
  state!: BattleState;
  protected canvas: HTMLCanvasElement;
  protected floatLayer: HTMLDivElement;
  protected disposed = false;
  speed = 1;
  skip = false;
  quality: Quality = 'mid';
  figures: FigureStyle = '3d';
  /**
   * The clock of the figures' animations in ms: it runs with the frames but stops while the board freezes a critical hit
   * (`scene.animationTimeScale` 0), as the engine's own animations do. Baked figures (story 7.8) read their rows from it.
   */
  protected animClock = 0;
  protected animWall = -1;
  /** camera shake on critical hits and deaths (option "shake", off with prefers-reduced-motion) */
  shakeEnabled = true;
  /** prefers-reduced-motion: the markings of the board do not pulse */
  calmMotion = false;
  /** what the map looks like: light, sky, figure floor and rim, weather (story 8.6) */
  protected look!: ResolvedLook;
  protected weather: WeatherView;
  protected ash: AshBurst | null = null;
  protected statusIcons: StatusIcons;
  /** statuses shown per unit; the `status` events change them as they play, a sync sets them from the state */
  protected statuses = new Map<string, Set<StatusId>>();
  /** while everything stands still for a critical hit's freeze: the time it stopped at */
  protected frozenAt: number | null = null;
  protected shakeEnd = 0;

  // camera: ground point at the screen centre (tiles, y = south) and CSS px per tile
  protected camX = 0;
  protected camY = 0;
  protected ppt = 40;
  protected step = 1;
  protected shake = 0;

  protected rings: RingLayer;
  protected hemi: HemisphericLight;
  protected sun: DirectionalLight;
  protected shadows: ShadowGenerator | null = null;
  protected pointLights: PointLight[] = [];
  protected textures!: GroundTextures;
  protected terrain: TerrainView | null = null;
  protected seed = 7;
  protected propMat: StandardMaterial;
  protected propTemplates = new Map<string, Promise<Mesh | null>>();
  protected propMeshes: Mesh[] = [];
  protected propSets: PropSet[] = [];
  /** see-through twin per prop template and material (story 8.10) */
  protected propTwins = new Map<Mesh, Mesh>();
  protected fadeMats = new Map<StandardMaterial, StandardMaterial>();
  /** height and footprint radius of a template's model */
  protected propSizes = new Map<Mesh, { top: number; r: number }>();
  /** a unit moved to another tile, appeared, left or changed its visibility since the fade was last worked out (story 7.8: no key string per frame) */
  protected fadeDirty = true;
  /** Frames until the static materials freeze again (0 = frozen or nothing to do), see `thawStatic` */
  protected freezeIn = 0;
  protected frozen: Material[] = [];
  protected fires: ParticleSystem[] = [];
  protected flameTexture: DynamicTexture;
  protected units = new Map<string, UnitView>();
  protected ghost: { uid: string; figure: Figure } | null = null;
  protected overlays: Overlays = {};
  protected overlayMeshes: OverlayMesh[] = [];
  protected fx?: FxInfo;
  protected fxTexture?: Texture;
  protected fxSprites: FxSprite[] = [];
  protected floaters: Array<{ el: HTMLDivElement; x: number; y: number; h: number; start: number; dur: number }> = [];
  /** bleed-out counters over downed units (phases left), kept in sync by `syncUnits` and the `downed`/`bleed` events */
  protected bleedLabels = new Map<string, HTMLDivElement>();
  /** grudge pennants over the lieutenants (story 3.1) */
  protected pennants = new Map<string, HTMLDivElement>();
  /** uid of the lieutenant whose line to the grudge target is shown (set by a tap on him) */
  /** HP bars, kill/warning markers and done checks over the figures (epic 13) */
  protected badges: Badges;
  protected done = new Set<string>();
  /** foes that reach the chosen field glow reddish (story 13.6); one glow value for all, so the figures' tint cache compares it by reference */
  protected reach = new Set<string>();
  protected reachGlow: Glow;
  protected gridLevel: GridLevel = 'subtle';
  protected gridMesh: OverlayMesh | null = null;
  /** DOM elements the UI pins to a field (story 13.6 terrain chip, 13.9 back stone): placed each frame */
  protected pins = new Map<string, { el: HTMLElement; tile: Pos; at: PinOffset; x: number; y: number }>();
  /** a tap on a figure waiting for a second one (double tap, story 13.9) */
  protected pendingTap: { tile: Pos; timer: number } | null = null;
  protected hoverKey = '';
  protected grudgeFor: string | null = null;
  protected grudgeLine?: GrudgeLine;
  protected readyPromise: Promise<void> | null = null;
  protected pointer = new Map<number, { x: number; y: number; sx: number; sy: number }>();
  protected panMoved = false;
  protected longTimer: number | undefined;
  protected longFired = false;
  protected pinchStart = 0;
  protected zoomTween: { from: number; to: number; start: number } | null = null;
  // the host caps the frame rate: full while something moves, lower at rest (render.yaml board.fpsActive/fpsIdle)
  protected activeUntil = 0;

  /** Time of day and weather chosen on the console (`__board.setLook('night', 'rain')`, acceptance and tuning); none = the map's plain light. */
  protected lookSwitch: { timeOfDay?: TimeOfDay; weather?: Weather } | null = null;
  /**
   * The canvas size in CSS px. Cached: reading it with `getBoundingClientRect` for every label of every frame forced a layout
   * after the previous label's style write (story 7.8). A `ResizeObserver` and `resize()` drop the cache.
   */
  protected size: { w: number; h: number } | null = null;
  protected sizeObserver: ResizeObserver | null = null;
  /** the view's axes for the camera tilt, worked out once per tilt value (callers do not change the vectors) */
  protected basisCache: { tiltDeg: number; forward: Vector3; up: Vector3; sin: number; cos: number } | null = null;
  /** the camera values the view was last set from; a frame with the same ones leaves the camera alone */
  protected camSet = { x: NaN, y: NaN, ppt: NaN, w: NaN, h: NaN, jitter: NaN };
  /** the canvas size (CSS px) the camera was last set up for */
  protected viewW = 1;
  protected viewH = 1;

  // implemented by the later classes of the chain; declared here for the calls from earlier ones
  abstract busy(now: number): boolean;
  abstract frame(now: number): void;
  abstract syncUnits(state: BattleState, instant?: boolean): Promise<void>;
  protected abstract makeFlameTexture(): DynamicTexture;
  protected abstract buildTerrain(): Promise<void>;
  protected abstract thawStatic(): void;
  protected abstract fadeTwin(set: PropSet): Mesh;
  protected abstract writeProps(set: PropSet): void;
  protected abstract buildGrid(): void;
  protected abstract pptFor(step: number): number;
  protected abstract fitCamera(): void;
  protected abstract clampCamera(margin?: number): void;
  protected abstract screenOfXYZ(x: number, y: number, z: number): { x: number; y: number };
  protected abstract onScreen(x: number, y: number, z: number): boolean;
  protected abstract bindInput(): void;
  protected abstract wake(ms?: number): void;
  protected abstract makeFx(anim: string, tx: number, ty: number, loop: boolean): FxSprite | null;
  protected abstract disposeFx(f: FxSprite): void;
  protected abstract tween(ms: number, fn: (t: number) => void): Promise<void>;

  /** `slot`: empty element that takes the host's canvas (story 5.1: one engine and canvas for all scenes) */
  constructor(slot: HTMLElement, floatLayer: HTMLDivElement, data: GameData, hooks: BoardHooks) {
    this.host = renderHost(data);
    this.host.mount(slot);
    this.canvas = this.host.canvas;
    this.floatLayer = floatLayer;
    this.data = data;
    this.hooks = hooks;
    this.engine = this.host.engine;
    this.scene = this.host.scene;
    this.store = this.host.store(this);
    this.host.activate(this);
    this.camera = new FreeCamera('cam', new Vector3(0, 30, -30), this.scene);
    this.scene.activeCamera = this.camera;
    this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 400;
    this.camera.inputs.clear();
    this.hemi = new HemisphericLight('ambient', new Vector3(0.2, 1, -0.3), this.scene);
    this.sun = new DirectionalLight('sun', new Vector3(0.5, -1, 0.4), this.scene);
    const teams = data.render.look.teams;
    this.rings = new RingLayer(this.scene, { player: teams.player.ui, enemy: teams.enemy.ui, other: teams.other.ui });
    this.weather = new WeatherView(this.scene, CAM_DIST);
    this.statusIcons = new StatusIcons(floatLayer, data.render.look.fx.status.fadeMs, data.render.look.fx.status.sizePx);
    this.badges = new Badges(floatLayer, data.render.legibility.hpBar);
    const reach = data.render.legibility.reach;
    const rc = Color3.FromHexString(reach.color);
    this.reachGlow = [rc.r * reach.strength, rc.g * reach.strength, rc.b * reach.strength];
    this.propMat = new StandardMaterial('props', this.scene);
    this.propMat.specularColor = new Color3(0.05, 0.05, 0.05);
    this.propMat.backFaceCulling = false;
    this.flameTexture = this.makeFlameTexture();
    if (typeof ResizeObserver !== 'undefined') {
      this.sizeObserver = new ResizeObserver(() => (this.size = null));
      this.sizeObserver.observe(this.canvas);
    }
    this.bindInput();
    // dev tools and E2E tests (Playwright sets navigator.webdriver) inspect the board
    if (import.meta.env.DEV || navigator.webdriver) (window as unknown as { __board: unknown }).__board = this;
  }

  /** A dialogue over the board: `idle` draws at `board.fpsIdle`, `pause` not at all, `run` as usual (story 5.1). */
  hold(mode: Hold): void {
    this.host.hold(mode);
  }

  /** The host calls this when the canvas changed size. */
  resize(): void {
    this.size = null;
    this.ppt = this.pptFor(this.step);
    this.clampCamera();
  }

  /** Leaves the stage: the host clears what the board built; the models stay in its cache for the next scene. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.input.abort();
    this.sizeObserver?.disconnect();
    for (const f of this.floaters) f.el.remove();
    for (const el of this.bleedLabels.values()) el.remove();
    this.badges.dispose();
    if (this.pendingTap) clearTimeout(this.pendingTap.timer);
    this.gridMesh?.mesh.dispose();
    this.gridMesh?.mat.dispose();
    for (const el of this.pennants.values()) el.remove();
    this.statusIcons.dispose();
    this.weather.dispose();
    this.ash?.dispose();
    this.grudgeLine?.clear();
    this.scene.animationTimeScale = 1;
    this.host.release(this);
  }

}
