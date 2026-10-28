/**
 * The 3D battle board (concept/01-decisions.md D1–D16): tilted orthographic camera with zoom steps,
 * diorama terrain, 3D props and figures (or pixel sprites), lights and shadows, and the playback of
 * core events. The public surface is what the battle screen uses; all game logic stays in src/core.
 */
import type { Engine } from '@babylonjs/core/Engines/engine';
import type { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import type { Material } from '@babylonjs/core/Materials/material';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Particles/particleSystemComponent';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture';
import type { BattleState, BattleUnit, Element, GameData, GameEvent, GearPiece, Pos, StatusId, Team, TimeOfDay, Weather } from '../../core';
import { bleedsOut, itemDef, modelId, unitFigureId, unitVatPath } from '../../core';
import { centreOn, clampAxis, framePlan, inFreeArea, NO_INSETS, type Insets } from '../shared/camera';
import { loadFx, loadManifest, loadUnitSheet, UNIT_ROWS, type FxInfo } from '../shared/assets';
import { buildTerrain, hash3, loadGroundTextures, type GroundTextures, type TerrainView } from '../shared/terrain3d';
import { loadPropMesh, loadUnitModel } from '../shared/models';
import { ModelFigure, SpriteFigure, warmTints, type Facing, type Figure, type FigureAnim } from '../shared/figures';
import { applyLight } from '../shared/season';
import { lookOverride, resolveLook, weatherPlan, type ResolvedLook } from '../shared/look';
import { t } from '../../i18n';
import { variantClassOf, variantList } from '../../content/propVariants';
import { isPackRegistered } from '../../content/browser';
import { modelAvailable, pickVariant, withState } from '../shared/scenery';
import { renderHost, type AssetStore, type Hold, type HostedView, type Quality, type RenderHost } from '../host';
import { buildOverlayMeshes, type OverlayMesh, type Overlays } from './overlays';
import { marchToTile } from './picking';
import { fadeRule, hidesFigure, type PropBox } from './fade';
import { isStaticMaterial } from './staticMaterial';
import { RingLayer } from './rings';
import { WeatherView } from './weather';
import { AshBurst } from './ash';
import { StatusIcons, iconsOf } from './statusIcons';
import { critTimeline } from './critTimeline';
import './board.css';
import { disposeGoldRing, dropPennant, fleeArc, FLEE_FADE_MS, FLEE_JUMP_MS, fleeTarget, GrudgeLine, makeGoldRing, makePennant, pennantNotches, setPennantNotches } from './lieutenant';

export interface BoardHooks {
  onTap?(tile: Pos): void;
  onLongPress?(tile: Pos): void;
  onHover?(tile: Pos | null): void;
  onCancel?(): void;
  /** called for events the UI presents (dialogue, phase banner, level up …); may await */
  onEvent?(e: GameEvent): Promise<void> | void;
  /** hp changed during playback (UI hp bars) */
  onUnitHp?(uid: string, hp: number): void;
  /** HUD covering the canvas edges, CSS px (camera keeps the map clear of it) */
  insets?(): Insets;
  /** a critical hit begins (story 8.6): the UI slides its band over the board; times in real ms, the board keeps its own count */
  onCutIn?(c: CutInEvent): void;
}

/** What the UI needs to draw the cut-in band of a critical hit. */
export interface CutInEvent {
  /** the attacker */
  unit: string;
  element?: Element;
  /** the skill that fired, if any (else the UI names the weapon) */
  skill?: string;
  inMs: number;
  holdMs: number;
  outMs: number;
}

export type { Overlays } from './overlays';
export type { Quality } from '../host';
export type FigureStyle = '3d' | '2d';

interface UnitView {
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

interface FxSprite {
  mesh: Mesh;
  mat: StandardMaterial;
  anim: string;
  start: number;
  loop: boolean;
}

/** Instances of one prop template; those hiding a unit move into its see-through twin (story 8.10). */
interface PropSet {
  tpl: Mesh;
  shadow: boolean;
  mats: Float32Array;
  cols: Float32Array;
  boxes: PropBox[];
  faded: Uint8Array;
}

/** distance of the camera from its target along the view axis, tiles */
const CAM_DIST = 60;
const MAX_FIRES = 12;
/** Frames between a change of lights, fog, shadows or meshes and the next freeze of the static materials */
const FREEZE_FRAMES = 12;
/** a figure this many tiles beyond the edge of the view is still worked out (it may step in next frame); farther ones are switched off */
const OFFSCREEN_TILES = 1.5;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** rAF with a timer fallback (rAF stops in background panes; animations must still finish). */
const schedule = (fn: () => void): void => {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  requestAnimationFrame(run);
  setTimeout(run, 50);
};

export class BoardView implements HostedView {
  readonly engine: Engine;
  readonly scene: Scene;
  private host: RenderHost;
  private store: AssetStore;
  /** removes the input listeners from the shared canvas */
  private input = new AbortController();
  private camera: FreeCamera;
  private hooks: BoardHooks;
  private data: GameData;
  state!: BattleState;
  private canvas: HTMLCanvasElement;
  private floatLayer: HTMLDivElement;
  private disposed = false;
  speed = 1;
  skip = false;
  quality: Quality = 'mid';
  figures: FigureStyle = '3d';
  /**
   * The clock of the figures' animations in ms: it runs with the frames but stops while the board freezes a critical hit
   * (`scene.animationTimeScale` 0), as the engine's own animations do. Baked figures (story 7.8) read their rows from it.
   */
  private animClock = 0;
  private animWall = -1;
  /** camera shake on critical hits and deaths (option "shake", off with prefers-reduced-motion) */
  shakeEnabled = true;
  /** prefers-reduced-motion: the markings of the board do not pulse */
  calmMotion = false;
  /** what the map looks like: light, sky, figure floor and rim, weather (story 8.6) */
  private look!: ResolvedLook;
  private weather: WeatherView;
  private ash: AshBurst | null = null;
  private statusIcons: StatusIcons;
  /** statuses shown per unit; the `status` events change them as they play, a sync sets them from the state */
  private statuses = new Map<string, Set<StatusId>>();
  /** while everything stands still for a critical hit's freeze: the time it stopped at */
  private frozenAt: number | null = null;
  private shakeEnd = 0;

  // camera: ground point at the screen centre (tiles, y = south) and CSS px per tile
  private camX = 0;
  private camY = 0;
  private ppt = 40;
  private step = 1;
  private shake = 0;

  private rings: RingLayer;
  private hemi: HemisphericLight;
  private sun: DirectionalLight;
  private shadows: ShadowGenerator | null = null;
  private pointLights: PointLight[] = [];
  private textures!: GroundTextures;
  private terrain: TerrainView | null = null;
  private seed = 7;
  private propMat: StandardMaterial;
  private propTemplates = new Map<string, Promise<Mesh | null>>();
  private propMeshes: Mesh[] = [];
  private propSets: PropSet[] = [];
  /** see-through twin per prop template and material (story 8.10) */
  private propTwins = new Map<Mesh, Mesh>();
  private fadeMats = new Map<StandardMaterial, StandardMaterial>();
  /** height and footprint radius of a template's model */
  private propSizes = new Map<Mesh, { top: number; r: number }>();
  /** a unit moved to another tile, appeared, left or changed its visibility since the fade was last worked out (story 7.8: no key string per frame) */
  private fadeDirty = true;
  /** Frames until the static materials freeze again (0 = frozen or nothing to do), see `thawStatic` */
  private freezeIn = 0;
  private frozen: Material[] = [];
  private fires: ParticleSystem[] = [];
  private flameTexture: DynamicTexture;
  private units = new Map<string, UnitView>();
  private ghost: { uid: string; figure: Figure } | null = null;
  private overlays: Overlays = {};
  private overlayMeshes: OverlayMesh[] = [];
  private fx?: FxInfo;
  private fxTexture?: Texture;
  private fxSprites: FxSprite[] = [];
  private floaters: Array<{ el: HTMLDivElement; x: number; y: number; h: number; start: number; dur: number }> = [];
  /** bleed-out counters over downed units (phases left), kept in sync by `syncUnits` and the `downed`/`bleed` events */
  private bleedLabels = new Map<string, HTMLDivElement>();
  /** grudge pennants over the lieutenants (story 3.1) */
  private pennants = new Map<string, HTMLDivElement>();
  /** uid of the lieutenant whose line to the grudge target is shown (set by a tap on him) */
  private grudgeFor: string | null = null;
  private grudgeLine?: GrudgeLine;
  private readyPromise: Promise<void> | null = null;
  private pointer = new Map<number, { x: number; y: number; sx: number; sy: number }>();
  private panMoved = false;
  private longTimer: number | undefined;
  private longFired = false;
  private pinchStart = 0;
  private zoomTween: { from: number; to: number; start: number } | null = null;
  // the host caps the frame rate: full while something moves, lower at rest (render.yaml board.fpsActive/fpsIdle)
  private activeUntil = 0;

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
    if (import.meta.env.DEV || navigator.webdriver) (window as unknown as { __board: BoardView }).__board = this;
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
    for (const el of this.pennants.values()) el.remove();
    this.statusIcons.dispose();
    this.weather.dispose();
    this.ash?.dispose();
    this.grudgeLine?.clear();
    this.scene.animationTimeScale = 1;
    this.host.release(this);
  }

  // ------------------------------------------------------------------ setup

  private makeFlameTexture(): DynamicTexture {
    const t = new DynamicTexture('flame', { width: 32, height: 32 }, this.scene, false);
    const g = t.getContext() as CanvasRenderingContext2D;
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,230,160,1)');
    grd.addColorStop(0.4, 'rgba(255,140,50,0.8)');
    grd.addColorStop(1, 'rgba(255,80,20,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 32, 32);
    t.update(true);
    t.hasAlpha = true;
    return t;
  }

  private applyQuality(): void {
    this.thawStatic();
    this.quality = this.host.setQuality(this.quality);
    const q = this.data.render.quality[this.quality];
    this.shadows?.dispose();
    this.shadows = null;
    if (q.shadowMap > 0) {
      const sg = new ShadowGenerator(q.shadowMap, this.sun);
      sg.usePercentageCloserFiltering = true;
      sg.filteringQuality = this.quality === 'high' ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_MEDIUM;
      sg.bias = 0.002;
      sg.normalBias = 0.02;
      sg.darkness = 0.35;
      // story 7.7: terrain and props cast a shadow that is drawn once and again only when they are rebuilt; units cast none
      sg.getShadowMap()!.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
      this.shadows = sg;
    }
  }

  private castShadows(meshes: Mesh[]): void {
    if (!this.shadows) return;
    for (const m of meshes) this.shadows.addShadowCaster(m, true);
  }

  /**
   * Draws the static shadow map anew on the next frame; call whenever terrain or props were rebuilt. The sun's frustum
   * follows the casters for that pass only and is then kept, so the lookup in later frames matches the map even when a
   * template's bounding box changes (props fading in and out).
   */
  private refreshShadows(): void {
    const map = this.shadows?.getShadowMap();
    if (!map) return;
    this.sun.autoUpdateExtends = true;
    map.onAfterRenderObservable.addOnce(() => (this.sun.autoUpdateExtends = false));
    map.resetRefreshCounter();
  }

  /** The map as it is shown: its own time of day and weather, or those of `?look=` (dev build and `?debug` only). */
  private lookMap() {
    const map = this.data.maps[this.state.mapId]!;
    const o = this.lookSwitch ?? (typeof location === 'undefined' ? {} : lookOverride(location.search, import.meta.env.DEV));
    // a time of day tried out through `?look=` or the console shows the pure preset: the map's own ambient and sun would hide it
    const tried = !!o.timeOfDay;
    return {
      act: map.act,
      ambient: tried ? undefined : map.ambient,
      sun: tried ? undefined : map.sun,
      timeOfDay: this.lookSwitch ? o.timeOfDay : (o.timeOfDay ?? map.timeOfDay),
      weather: this.lookSwitch ? o.weather : (o.weather ?? map.weather),
    };
  }

  /** Time of day and weather chosen on the console (`__board.setLook('night', 'rain')`, acceptance and tuning); none = the map's plain light. */
  private lookSwitch: { timeOfDay?: TimeOfDay; weather?: Weather } | null = null;

  /** Dev tool: shows the board with another time of day and weather at once, without reloading. */
  setLook(timeOfDay?: TimeOfDay, weather?: Weather): void {
    this.lookSwitch = { timeOfDay, weather };
    this.applyMapLight();
    this.applyWeather();
    this.refreshShadows();
    this.wake(1500);
  }

  /** Light, sky and the figures' floor and rim light from the map's look (story 8.6); a map without time of day and weather looks as before. */
  private applyMapLight(): void {
    this.thawStatic();
    const look = resolveLook(this.data.render, this.lookMap());
    this.look = look;
    applyLight(this.hemi, this.sun, look.ambient, look.sun);
    const sky = Color3.FromHexString(look.sky);
    this.scene.clearColor = new Color4(sky.r, sky.g, sky.b, 1);
    const fl = this.store.figureLook;
    fl.floor = look.figureFloor;
    const rim = Color3.FromHexString(look.rim.color);
    fl.rim = [rim.r, rim.g, rim.b, look.rim.strength];
  }

  /** (Re)builds the weather for the current quality: particles, mist, wet shine, puddles. */
  private applyWeather(): void {
    this.thawStatic();
    const plan = weatherPlan(this.look.weatherDef, this.quality);
    this.weather.apply(this.look, plan, this.terrain!, [this.state.width, this.state.height], this.seed, this.sun);
    this.camSet.x = NaN;
  }

  /** Loads assets and builds the board. Call once per battle. */
  async load(state: BattleState): Promise<void> {
    this.readyPromise = (async () => {
      this.state = state;
      this.seed = [...state.mapId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
      this.applyQuality();
      this.applyMapLight();
      this.textures = await loadGroundTextures(this.store);
      this.fx = await loadFx();
      // the player may leave before the assets arrive: a disposed board builds nothing into the next view's stage
      if (this.disposed) return;
      if (this.fx) this.fxTexture = this.textureFromImage('fx', this.fx.image);
      await this.buildTerrain();
      if (this.disposed) return;
      this.applyWeather();
      this.ash = new AshBurst(this.scene, this.data.render.look.fx.death, this.quality);
      this.fitCamera();
      // the terrain shows while the figures load (they load in parallel and appear together)
      await this.syncUnits(state, true);
      await this.precompile();
    })();
    return this.readyPromise;
  }

  /**
   * Compiles every shader the battle will draw with before the first frame of play: all meshes now in the scene (figures,
   * terrain, props, rings, fires) and the effect sprites. A variant first met during the enemy phase would stall that frame
   * (story 7.7). `board.precompileMs` bounds the wait, so a texture that never arrives cannot hold the board back.
   */
  private async precompile(): Promise<void> {
    if (this.disposed) return;
    const fx = this.makeFx(Object.keys(this.fx?.anims ?? {})[0] ?? '', 0, 0, false);
    const warm = this.data.render.board.warm;
    const jobs: Promise<unknown>[] = [this.scene.whenReadyAsync()];
    if (fx) jobs.push(fx.mat.forceCompilationAsync(fx.mesh).catch(() => undefined));
    // the weather's particles and the death's ash compile their shaders on first use otherwise (story 8.6)
    jobs.push(
      new Promise<void>((resolve) => {
        const poll = () => (this.disposed || (this.weather.ready() && (this.ash?.ready() ?? true)) ? resolve() : void setTimeout(poll, 30));
        poll();
      }),
    );
    if (warm >= 1) {
      // the materials of a flash and of a fade are shader variants of their own: a first hit would compile them mid-battle (story 7.8)
      jobs.push(warmTints([...this.units.values()].map((u) => u.figure)).catch(() => undefined));
      // the see-through twins of the props (story 8.10) were made, and their blended shader compiled, when the first unit
      // stepped behind a prop: the frame trace of the enemy phase showed this as two new shader variants at 4.7 s (story 7.8).
      // They compile with their instance (`useInstances`): without it the instance colour attribute has no declaration.
      for (const twin of this.showTwins()) if (twin.material) jobs.push(twin.material.forceCompilationAsync(twin, { useInstances: true }).catch(() => undefined));
    }
    await Promise.race([Promise.all(jobs), sleep(this.data.render.board.precompileMs)]);
    if (fx) this.disposeFx(fx);
    if (warm >= 2 && !this.disposed) this.warmDraw();
    // the twins go back to what the fade says (nothing faded: no instance)
    if (warm >= 1) for (const set of this.propSets) this.writeProps(set);
  }

  /**
   * A template without instances costs the frame nothing: switched off it skips the world matrix, the active-mesh test and the
   * readiness check (story 8.11: the variants and the twins doubled the templates, +2 ms of thread time per frame at 4x).
   */
  private idleProp(m: Mesh): void {
    m.isVisible = false;
    m.setEnabled(false);
  }

  /** The templates sit at the origin (the instances carry the transforms): their world matrix never changes, so it is not recomputed each frame. */
  private freezeProp(m: Mesh): Mesh {
    m.freezeWorldMatrix();
    return m;
  }

  /** Makes the twin of every prop template and gives it one instance, so that its shader variants (with instances) can compile and draw. */
  private showTwins(): Mesh[] {
    const twins: Mesh[] = [];
    for (const set of this.propSets) {
      if (!set.boxes.length) continue;
      const twin = this.fadeTwin(set);
      twin.isVisible = true;
      twin.setEnabled(true);
      twin.thinInstanceSetBuffer('matrix', set.mats.slice(0, 16), 16, true);
      twin.thinInstanceSetBuffer('color', set.cols.slice(0, 4), 4, true);
      twins.push(twin);
    }
    return twins;
  }

  /**
   * Draws everything once (story 7.8): every figure switched on, terrain and props past the view's edge too, so the driver
   * links its programs, the buffers and the skeletons' bone textures are uploaded here, not in the first frames of a battle.
   * The normal frame is drawn over it in the same task, so nothing of it reaches the screen. `scene.isReady` alone draws nothing.
   */
  private warmDraw(): void {
    const switchedOn: TransformNode[] = [];
    for (const v of this.units.values()) {
      if (v.figure.node.isEnabled(false)) continue;
      v.figure.node.setEnabled(true);
      switchedOn.push(v.figure.node);
    }
    const forced: AbstractMesh[] = [];
    for (const m of this.scene.meshes) {
      if (m.alwaysSelectAsActiveMesh || !m.isEnabled() || !m.isVisible) continue;
      m.alwaysSelectAsActiveMesh = true;
      forced.push(m);
    }
    try {
      this.scene.render();
    } finally {
      for (const m of forced) m.alwaysSelectAsActiveMesh = false;
      for (const n of switchedOn) n.setEnabled(false);
    }
    this.frame(performance.now());
  }

  private textureFromImage(name: string, img: HTMLImageElement | HTMLCanvasElement): DynamicTexture {
    const t = new DynamicTexture(name, { width: img.width, height: img.height }, this.scene, false, Texture.NEAREST_SAMPLINGMODE);
    const ctx = t.getContext() as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);
    t.update(true, true);
    t.hasAlpha = true;
    t.wrapU = t.wrapV = Texture.CLAMP_ADDRESSMODE;
    return t;
  }

  // ------------------------------------------------------------------ terrain & props

  private lightsMax(): number {
    return this.data.render.board.lightsMax[this.quality];
  }

  private async buildTerrain(): Promise<void> {
    this.thawStatic();
    this.terrain?.dispose();
    this.terrain = buildTerrain(this.scene, this.data, this.state, this.textures, this.seed, this.lightsMax());
    this.castShadows(this.terrain.casters);
    this.weather.terrainChanged(this.terrain);
    await this.buildProps();
    if (!this.disposed) this.buildFires();
  }

  /** The same prop for scenery outside the map: casts no shadow. Own geometry: Babylon keeps thin-instance buffers on the geometry. */
  private sceneryTemplate(key: string, tpl: Mesh): Mesh {
    const name = `${tpl.name}:scenery`;
    let m = this.scene.getMeshByName(name) as Mesh | null;
    if (!m) {
      m = tpl.clone(name, null, true)!;
      m.makeGeometryUnique();
      m.isVisible = false;
      m.alwaysSelectAsActiveMesh = true;
      this.freezeProp(m);
      void key;
    }
    return m;
  }

  private propTemplate(pid: string, state: string): Promise<Mesh | null> {
    const key = `${pid}_${state}`;
    let p = this.propTemplates.get(key);
    if (!p) {
      p = (async () => {
        const m = await loadPropMesh(this.store, pid, state, this.propMat);
        if (m) {
          m.isVisible = false;
          m.alwaysSelectAsActiveMesh = true;
          this.freezeProp(m);
          this.castShadows([m]);
        }
        return m ?? this.boxProp(pid, state);
      })();
      this.propTemplates.set(key, p);
    }
    return p;
  }

  /** Simple stand-ins for props without a Blender model (doors, gates, thrones). */
  private boxProp(pid: string, state: string): Mesh | null {
    const boxes: Array<[number, number, number, number, number, number]> = [];
    if (pid === 'door_closed') boxes.push([0, 0.42, 0, 0.9, 0.84, 0.14]);
    else if (pid === 'door_open') boxes.push([-0.42, 0.42, 0.3, 0.12, 0.84, 0.6]);
    else if (pid === 'gate') boxes.push([-0.4, 0.45, 0, 0.18, 0.9, 0.22], [0.4, 0.45, 0, 0.18, 0.9, 0.22], [0, 0.86, 0, 0.98, 0.12, 0.2]);
    else if (pid === 'throne') boxes.push([0, 0.25, 0, 0.5, 0.2, 0.5], [0, 0.55, 0.2, 0.5, 0.6, 0.12]);
    else return null;
    const parts = boxes.map(([x, y, z, w, h, d], i) => {
      const b = CreateBox(`box:${pid}:${i}`, { width: w, height: h, depth: d }, this.scene);
      b.position.set(x, y, z);
      return b;
    });
    const mesh = Mesh.MergeMeshes(parts, true)!;
    const color = pid === 'throne' ? new Color3(0.55, 0.5, 0.58) : new Color3(0.42, 0.28, 0.2);
    const colors: number[] = [];
    for (let i = 0; i < mesh.getTotalVertices(); i++) colors.push(color.r, color.g, color.b, 1);
    mesh.setVerticesData('color', colors);
    mesh.material = this.propMat;
    mesh.isVisible = false;
    mesh.name = `prop:${pid}_${state}`;
    this.castShadows([mesh]);
    void state;
    return mesh;
  }

  private async buildProps(): Promise<void> {
    this.thawStatic();
    for (const m of this.propMeshes) m.thinInstanceCount = 0;
    const sets: PropSet[] = [];
    const s = this.state;
    const grid = this.terrain!.grid;
    type Place = { x: number; y: number; h: number; rot: number; scale: number; dim: boolean };
    const manifest = await loadManifest();
    // props of a later pack (manifest `models.propPacks`) only count once that pack is registered on this device (offline start before the download)
    const known = (model: string) => modelAvailable(manifest.models, model, isPackRegistered);
    // a model that is not built yet (the manifest does not know it) is drawn as its stand-in, if render.yaml names one
    const fallback = this.data.render.board.propFallback;
    const resolve = (model: string) => (known(model) ? model : (fallback[model] ?? model));
    const places = new Map<string, Place[]>();
    const put = (model: string, p: Place) => {
      const key = resolve(model);
      const list = places.get(key);
      if (list) list.push(p);
      else places.set(key, [p]);
    };
    const map = this.data.maps[s.mapId]!;
    // variants: a field hash picks from the weighted list of the prop class (trees of the season of the map's act); the map can set single fields
    const overrides = new Map((map.propVariants ?? []).map((v) => [`${v.at[0]},${v.at[1]}`, v.model]));
    const chosen = new Map<string, string>();
    const variant = (prop: string, gx: number, gy: number, x: number, y: number): string => {
      const cls = variantClassOf(prop)!;
      // roll 0 is the field's own hash; the others only come into play when a neighbour (west, north: decided before) has the same model
      const rolls = [0, 1, 2].map((k) => ((hash3(gx, gy, this.seed + 5 + k * 131) >>> 20) % 1000) / 1000);
      const avoid = [chosen.get(`${gx - 1},${gy}`), chosen.get(`${gx},${gy - 1}`)].filter((m): m is string => !!m);
      const override = grid.inMap(gx, gy) ? overrides.get(`${x},${y}`) : undefined;
      const model = pickVariant(variantList(this.data, cls, map.act, !grid.inMap(gx, gy)), rolls, { has: known, override, avoid });
      chosen.set(`${gx},${gy}`, model);
      return model;
    };
    // tiles that must stay clear: objects, units, deploy slots and reinforcements
    const reserved = new Set<string>();
    for (const o of s.objects) reserved.add(`${o.at[0]},${o.at[1]}`);
    for (const u of [...map.units, ...map.reinforcements.flatMap((rf) => rf.units)]) reserved.add(`${u.at[0]},${u.at[1]}`);
    for (const p of map.deploy.slots) reserved.add(`${p[0]},${p[1]}`);
    const decor = this.data.render.board.decor;
    for (let gy = 0; gy < grid.h; gy++)
      for (let gx = 0; gx < grid.w; gx++) {
        const def = grid.at(gx, gy)!;
        const isOpen = def.id === 'grass' || def.id === 'plain';
        if ((!def.prop && !isOpen) || def.prop === 'bridge') continue;
        const x = gx - grid.skirt;
        const y = gy - grid.skirt;
        if (this.quality === 'low' && !grid.inMap(gx, gy)) {
          const away = Math.max(-x - 1, x - s.width, -y - 1, y - s.height) + 1;
          if (away > this.data.render.board.sceneryPropsLow) continue;
        }
        if (!def.prop) {
          // low decoration on free ground: one roll per tile, bushes first, then small stones; a corner of the tile, the unit keeps the centre
          const inMap = grid.inMap(gx, gy);
          if (inMap && reserved.has(`${x},${y}`)) continue;
          const d = hash3(gx, gy, this.seed + 61);
          const roll = (d & 0xffff) / 0x10000;
          const pb = inMap ? decor.bushes.map : decor.bushes.scenery;
          const ps = inMap ? decor.stones.map : decor.stones.scenery;
          const kind = roll < pb ? decor.bushes : roll < pb + ps ? decor.stones : null;
          if (!kind) continue;
          const [lo, hi] = kind.scale;
          const ox = ((d >>> 16) & 1 ? 1 : -1) * (0.2 + ((d >>> 17) % 10) / 100);
          const oy = ((d >>> 21) & 1 ? 1 : -1) * (0.2 + ((d >>> 22) % 10) / 100);
          put(`${kind.model}`, { x: x + ox, y: y + oy, h: def.height, rot: ((d >>> 8) % 360) * (Math.PI / 180), scale: lo + (((d >>> 4) % 100) / 100) * (hi - lo), dim: !inMap });
          continue;
        }
        const r = hash3(gx, gy, this.seed + 5);
        const base: Place = { x, y, h: def.height, rot: Math.PI, scale: 1, dim: !grid.inMap(gx, gy) };
        switch (def.prop) {
          case 'tree':
            put(variant('tree', gx, gy, x, y), { ...base, rot: ((r >>> 4) % 360) * (Math.PI / 180), scale: 0.88 + ((r >>> 12) % 25) / 100 });
            break;
          case 'rock':
          case 'rockwall':
            put(variant(def.prop, gx, gy, x, y), { ...base, rot: ((r >>> 4) % 4) * (Math.PI / 2), scale: def.prop === 'rock' ? 1.05 : 0.9 });
            break;
          case 'house': // scenery house (terrain building): no object, always standing
          case 'lodge': {
            // the visitable house: its object's state picks intact / visited / razed
            const obj = s.objects.find((o) => o.at[0] === x && o.at[1] === y);
            put(withState(variant(def.prop, gx, gy, x, y), obj?.state === 'visited' ? 'visited' : obj?.state === 'razed' ? 'razed' : 'intact'), base);
            break;
          }
          case 'door_closed':
          case 'door_open':
          case 'gate':
          case 'throne':
            put(`${def.prop}_idle`, base);
            break;
          default:
            put(`${def.prop}_idle`, base);
        }
      }
    for (const o of s.objects) if (o.type === 'chest') put(`chest_${o.state === 'open' ? 'open' : 'closed'}`, { x: o.at[0], y: o.at[1], h: this.terrain!.standOn(o.at[0], o.at[1]), rot: Math.PI, scale: 1, dim: false });
    // map props cast shadows; the darkened scenery around it does not (a third of the shadow pass)
    const split = new Map<string, Place[]>();
    for (const [key, list] of places) {
      const near = list.filter((p) => !p.dim);
      const far = list.filter((p) => p.dim);
      if (near.length) split.set(key, near);
      if (far.length) split.set(`${key}|scenery`, far);
    }
    for (const [fullKey, list] of split) {
      const [key, kind] = fullKey.split('|') as [string, string | undefined];
      const i = key.lastIndexOf('_');
      const base = await this.propTemplate(key.slice(0, i), key.slice(i + 1));
      if (!base) continue;
      const tpl = kind === 'scenery' ? this.sceneryTemplate(key, base) : base;
      const mats = new Float32Array(list.length * 16);
      const cols = new Float32Array(list.length * 4);
      list.forEach((p, k) => {
        Matrix.Compose(new Vector3(p.scale, p.scale, p.scale), Quaternion.RotationAxis(Vector3.Up(), p.rot), new Vector3(p.x + 0.5, p.h, -p.y - 0.5)).copyToArray(mats, k * 16);
        const f = p.dim ? 0.5 : 1;
        cols.set([f, f, f * 1.06, 1], k * 4);
      });
      const size = this.propSize(base);
      const boxes = list.map((p) => ({ x: p.x + 0.5, y: p.y + 0.5, r: size.r * p.scale, top: p.h + size.top * p.scale }));
      sets.push({ tpl, shadow: kind !== 'scenery', mats, cols, boxes, faded: new Uint8Array(list.length) });
      if (!this.propMeshes.includes(tpl)) this.propMeshes.push(tpl);
    }
    this.propSets = sets;
    for (const set of sets) this.writeProps(set);
    for (const m of this.propMeshes) if (!m.thinInstanceCount) this.idleProp(m);
    this.fadeDirty = true;
    this.updateFade();
    this.refreshShadows();
  }

  /**
   * The materials of the terrain and the props never change their shader once the board stands (same lights, fog and shadows,
   * no alpha animation): frozen, Babylon skips their per-frame readiness test and define hashing, a quarter of the frame's thread
   * time at 4x (story 7.8 AC 11). Whatever changes lights, fog, shadows or the meshes thaws them (`thawStatic`); `frame` freezes
   * them again a few frames later, when the new effects are ready.
   */
  private thawStatic(): void {
    for (const m of this.frozen) m.unfreeze();
    this.frozen = [];
    this.freezeIn = FREEZE_FRAMES;
  }

  private freezeStatic(): void {
    this.frozen = this.scene.materials.filter((m) => isStaticMaterial(m.name));
    for (const m of this.frozen) m.freeze();
  }

  /** Height and footprint radius of a template (its vertices are baked with the origin on the ground). */
  private propSize(tpl: Mesh): { top: number; r: number } {
    let size = this.propSizes.get(tpl);
    if (!size) {
      const pos = tpl.getVerticesData('position') ?? [];
      let top = 0;
      let r = 0;
      for (let i = 0; i < pos.length; i += 3) {
        top = Math.max(top, pos[i + 1]!);
        r = Math.max(r, Math.abs(pos[i]!), Math.abs(pos[i + 2]!));
      }
      size = { top, r };
      this.propSizes.set(tpl, size);
    }
    return size;
  }

  /** The see-through twin of a template: alpha-blended copy of its material, own geometry like `sceneryTemplate`. */
  private fadeTwin(set: PropSet): Mesh {
    let twin = this.propTwins.get(set.tpl);
    if (twin) return twin;
    twin = set.tpl.clone(`${set.tpl.name}:fade`, null, true)!;
    twin.makeGeometryUnique();
    twin.thinInstanceCount = 0;
    // it carries the template's instance colours from the clone, but has no instance yet (`writeProps` fills it)
    twin.thinInstanceSetBuffer('color', null);
    twin.isVisible = false;
    twin.isPickable = false;
    twin.alwaysSelectAsActiveMesh = true;
    this.freezeProp(twin);
    twin.receiveShadows = true;
    const src = set.tpl.material as StandardMaterial;
    let mat = this.fadeMats.get(src);
    if (!mat) {
      mat = new StandardMaterial(`${src.name}:fade`, this.scene);
      mat.specularColor = src.specularColor.clone();
      mat.backFaceCulling = src.backFaceCulling;
      mat.maxSimultaneousLights = src.maxSimultaneousLights;
      mat.diffuseTexture = src.diffuseTexture; // shared with the opaque material, owned by the model file
      mat.alpha = this.data.render.board.fade.alpha;
      mat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
      // depth first: only the front surface blends, the prop reads as one veil instead of a tangle of inner faces
      mat.needDepthPrePass = true;
      this.fadeMats.set(src, mat);
    }
    twin.material = mat;
    if (set.shadow) this.castShadows([twin]);
    this.propTwins.set(set.tpl, twin);
    this.propMeshes.push(twin);
    return twin;
  }

  /** Splits a template's instances by `faded` between the template and its twin. */
  private writeProps(set: PropSet): void {
    const n = set.boxes.length;
    let f = 0;
    for (let k = 0; k < n; k++) f += set.faded[k]!;
    const fill = (m: Mesh, mats: Float32Array, cols: Float32Array) => {
      m.isVisible = mats.length > 0;
      m.setEnabled(mats.length > 0);
      if (!mats.length) {
        m.thinInstanceCount = 0;
        // without the colour buffer the mesh carries no instance attribute: a readiness check of the scene compiles it without
        // instancing, and "instanceColor undeclared" would fail that shader (story 7.8)
        m.thinInstanceSetBuffer('color', null);
        // Babylon sets the define for instance colours when a mesh has instances and never clears it: a mesh that gave up its instances
        // would be compiled with the colour attribute but without instancing by the next readiness check of the scene. Fresh defines.
        for (const sm of m.subMeshes ?? []) sm.materialDefines = null;
        return;
      }
      m.thinInstanceSetBuffer('matrix', mats, 16, true);
      m.thinInstanceSetBuffer('color', cols, 4, true);
      m.thinInstanceRefreshBoundingInfo();
    };
    if (!f) {
      fill(set.tpl, set.mats, set.cols);
      const twin = this.propTwins.get(set.tpl);
      if (twin) fill(twin, new Float32Array(0), new Float32Array(0));
      return;
    }
    const split = (want: number) => {
      const count = want ? f : n - f;
      const mats = new Float32Array(count * 16);
      const cols = new Float32Array(count * 4);
      let j = 0;
      for (let k = 0; k < n; k++) {
        if (set.faded[k] !== want) continue;
        mats.set(set.mats.subarray(k * 16, k * 16 + 16), j * 16);
        cols.set(set.cols.subarray(k * 4, k * 4 + 4), j * 4);
        j++;
      }
      return [mats, cols] as const;
    };
    fill(set.tpl, ...split(0));
    fill(this.fadeTwin(set), ...split(1));
  }

  /**
   * Story 8.10: props in front of or on a unit's tile turn see-through. Runs every frame but works only when a unit
   * reached another tile (moves, enemy phase, deployment), appeared or left: `placeUnit` flags that (`fadeDirty`).
   */
  private updateFade(): void {
    if (!this.terrain || !this.state || !this.fadeDirty) return;
    this.fadeDirty = false;
    // the figures by column of their tile: a prop only asks the columns within its reach (about three), not every figure
    const columns = new Map<number, Array<{ x: number; y: number; h: number }>>();
    for (const v of this.units.values()) {
      if (!v.visible) continue;
      const tx = Math.round(v.x + v.offX);
      const ty = Math.round(v.y + v.offY);
      const column = columns.get(tx);
      const spot = { x: tx + 0.5, y: ty + 0.5, h: this.terrain.standOn(tx, ty) };
      if (column) column.push(spot);
      else columns.set(tx, [spot]);
    }
    const { cover, figureWidth } = this.data.render.board.fade;
    const rule = fadeRule(this.data.render.camera.tiltDeg, cover, figureWidth);
    for (const set of this.propSets) {
      let changed = false;
      set.boxes.forEach((b, k) => {
        const reach = b.r + rule.figureWidth;
        let hide = 0;
        for (let c = Math.floor(b.x - reach); c <= Math.floor(b.x + reach) && !hide; c++) if (columns.get(c)?.some((f) => hidesFigure(b, f, rule))) hide = 1;
        if (set.faded[k] !== hide) {
          set.faded[k] = hide;
          changed = true;
        }
      });
      if (changed) this.writeProps(set);
    }
  }

  private buildFires(): void {
    this.thawStatic();
    // keep the texture: all flames share `flameTexture`, and a system disposes its texture by default
    for (const f of this.fires) f.dispose(false);
    this.fires = [];
    for (const l of this.pointLights) l.dispose();
    this.pointLights = [];
    const max = this.lightsMax();
    const map = this.data.maps[this.state.mapId]!;
    const lights: Array<{ x: number; y: number; color: string; radius: number }> = (map.lights ?? []).map((l) => ({ x: l.at[0], y: l.at[1], color: l.color, radius: l.radius }));
    const burning = Object.entries(this.state.timers).filter(([, t]) => t.kind === 'burning');
    for (const [k] of burning.slice(0, MAX_FIRES)) {
      const [x, y] = k.split(',').map(Number) as [number, number];
      const ps = new ParticleSystem(`fire:${k}`, 50, this.scene);
      ps.particleTexture = this.flameTexture;
      ps.emitter = new Vector3(x + 0.5, (this.terrain?.topOf(x, y) ?? 0) + 0.05, -y - 0.5);
      ps.minEmitBox = new Vector3(-0.35, 0, -0.35);
      ps.maxEmitBox = new Vector3(0.35, 0, 0.35);
      ps.color1 = new Color4(1, 0.75, 0.35, 1);
      ps.color2 = new Color4(1, 0.45, 0.15, 1);
      ps.colorDead = new Color4(0.3, 0.05, 0, 0);
      ps.minSize = 0.18;
      ps.maxSize = 0.42;
      ps.minLifeTime = 0.35;
      ps.maxLifeTime = 0.8;
      ps.emitRate = 40;
      ps.blendMode = ParticleSystem.BLENDMODE_ADD;
      ps.gravity = new Vector3(0, 1.4, 0);
      ps.direction1 = new Vector3(-0.1, 1, -0.1);
      ps.direction2 = new Vector3(0.1, 1.4, 0.1);
      ps.minEmitPower = 0.3;
      ps.maxEmitPower = 0.6;
      ps.start();
      this.fires.push(ps);
      lights.push({ x, y, color: '#ff9e4f', radius: 2.6 });
    }
    for (const l of lights.slice(0, max)) {
      const p = new PointLight(`light:${l.x},${l.y}`, new Vector3(l.x + 0.5, 0.9, -l.y - 0.5), this.scene);
      p.diffuse = Color3.FromHexString(l.color);
      p.specular = new Color3(0, 0, 0);
      p.range = l.radius + 1;
      this.pointLights.push(p);
    }
  }

  // ------------------------------------------------------------------ units

  private unitSpriteId(u: BattleUnit): string {
    return unitFigureId(u, this.data.classes);
  }

  /** Weapon model of the equipped weapon group (GA9); its motion picks the figure's attack animation. */
  private weaponOf(u: BattleUnit): GearPiece | undefined {
    const main = u.equip.mainHand && itemDef(this.data, u.equip.mainHand).weaponType;
    return main ? this.data.render.gear.weapons[main] : undefined;
  }

  /** Weapon models for the equipped weapon group and off-hand item (GA9); one piece per hand, the weapon first. */
  private gearOf(u: BattleUnit): GearPiece[] {
    const { offHand } = this.data.render.gear;
    const out: GearPiece[] = [];
    const w = this.weaponOf(u);
    if (w) out.push(w);
    const group = u.equip.offHand && itemDef(this.data, u.equip.offHand).group;
    const off = group && offHand[group];
    if (off && !out.some((p) => p.hand === off.hand)) out.push(off);
    return out;
  }

  private gearKey(u: BattleUnit): string {
    return this.gearOf(u)
      .map((p) => `${p.model}@${p.hand}`)
      .join();
  }

  private async makeFigure(u: BattleUnit, name: string): Promise<Figure> {
    const id = this.unitSpriteId(u);
    if (this.figures === '3d') {
      // a figure per chosen portrait where one exists (the avatar: avatar_a / avatar_b), else the unit's own
      const manifestModels = (await loadManifest()).models;
      const mid = modelId(u, manifestModels?.units ?? [], this.data.classes);
      // a figure with a baked animation file (the manifest lists them) plays it as vertex animation (story 7.8, `board.vat`)
      const vatPath = this.data.render.board.vat && manifestModels?.vat?.includes(mid) ? unitVatPath(mid, manifestModels.unitPacks) : undefined;
      const model = await loadUnitModel(this.store, mid, u.team, name, this.gearOf(u), manifestModels?.unitPacks, vatPath);
      if (model) {
        model.root.scaling.setAll(this.data.render.board.figureScale);
        return new ModelFigure(model, this.weaponOf(u)?.motion, this.data.render.board.idleHz, this.data.render.board.tintPool);
      }
    }
    const weapon = u.equip.mainHand ? itemDef(this.data, u.equip.mainHand).weaponType : undefined;
    const sheet = await loadUnitSheet(id, { classId: u.classId, weapon });
    return new SpriteFigure(this.scene, sheet, u.team, this.data.render.look.teams[u.team].ramp, name);
  }

  async syncUnits(state: BattleState, _instant = false): Promise<void> {
    this.state = state;
    const seen = new Set<string>();
    // new figures load in parallel (model files are shared per sprite id)
    const fresh = new Map<string, Promise<Figure>>();
    for (const u of state.units) {
      if (!u.pos || u.gone) continue;
      const v = this.units.get(u.uid);
      if (!v || v.team !== u.team || v.sprite !== this.unitSpriteId(u) || v.gear !== this.gearKey(u)) fresh.set(u.uid, this.makeFigure(u, `unit:${u.uid}:${u.team}`));
    }
    for (const u of state.units) {
      if (!u.pos || u.gone) continue;
      seen.add(u.uid);
      let v = this.units.get(u.uid);
      if (v && (v.team !== u.team || v.sprite !== this.unitSpriteId(u) || v.gear !== this.gearKey(u))) {
        this.removeUnit(v);
        v = undefined;
      }
      if (!v) {
        const figure = await (fresh.get(u.uid) ?? this.makeFigure(u, `unit:${u.uid}:${u.team}`));
        if (this.disposed) {
          for (const f of fresh.values()) void f.then((g) => g.dispose());
          return;
        }
        v = {
          uid: u.uid,
          team: u.team,
          sprite: this.unitSpriteId(u),
          gear: this.gearKey(u),
          figure,
          gold: u.lieutenant ? makeGoldRing(this.scene, u.uid) : undefined,
          x: u.pos[0],
          y: u.pos[1],
          offX: 0,
          offY: 0,
          lift: 0,
          facing: 's',
          anim: 'idle',
          desat: 0,
          flash: 0,
          alpha: 1,
          visible: true,
          downed: false,
          fadeX: NaN,
          fadeY: NaN,
          fadeSeen: false,
        };
        this.units.set(u.uid, v);
        this.rings.add(u.uid, u.team);
      }
      v.x = u.pos[0];
      v.y = u.pos[1];
      v.offX = v.offY = v.lift = 0;
      v.downed = u.downed;
      v.desat = u.downed ? 1 : u.acted && u.team === state.phase ? 0.65 : 0;
      v.alpha = 1;
      v.visible = true;
      v.facing = 's';
      this.setAnim(v, u.downed ? 'downed' : 'idle');
    }
    for (const [uid, v] of [...this.units]) if (!seen.has(uid)) this.removeUnit(v);
    for (const u of state.units) this.setBleedLabel(u.uid, u.downed && !u.gone && bleedsOut(this.data, state, u) ? u.bleed ?? 0 : null);
    for (const u of state.units) this.setPennant(u);
    for (const u of state.units) this.setStatuses(u);
    if (this.grudgeFor && !this.grudgeTargetView()) this.grudgeFor = null;
  }

  /** Grudge pennant over a lieutenant on the board (0-3 notches from `BattleUnit.grudge`); everyone else has none. */
  private setPennant(u: BattleUnit): void {
    let el = this.pennants.get(u.uid);
    if (!u.lieutenant || u.gone || !this.units.has(u.uid)) {
      el?.remove();
      this.pennants.delete(u.uid);
      return;
    }
    if (!el) {
      el = makePennant();
      this.floatLayer.appendChild(el);
      this.pennants.set(u.uid, el);
    }
    setPennantNotches(el, pennantNotches(u.grudge, this.data.balance.lieutenant.grudge.max));
  }

  private placePennants(): void {
    for (const [uid, el] of this.pennants) {
      const v = this.units.get(uid);
      if (!v) continue;
      const p = this.screenOfXYZ(v.x + v.offX + 0.5, this.tileTop2(Math.round(v.x), Math.round(v.y)) + 1.2, -(v.y + v.offY + 0.5));
      el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      el.style.display = v.visible && v.alpha > 0.5 ? '' : 'none';
    }
  }

  /** The target of the grudge of the lieutenant `grudgeFor`, when both stand on the board. */
  private grudgeTargetView(): { from: UnitView; to: UnitView } | null {
    if (!this.grudgeFor) return null;
    const lt = this.state.units.find((u) => u.uid === this.grudgeFor);
    if (!lt || lt.gone || !lt.grudgeTarget || (lt.grudge ?? 0) < 1) return null;
    const target = this.state.units.find((u) => (u.uid === lt.grudgeTarget || u.id === lt.grudgeTarget) && !u.gone && u.pos);
    const from = this.units.get(lt.uid);
    const to = target ? this.units.get(target.uid) : undefined;
    return from && to ? { from, to } : null;
  }

  /** A tap on a lieutenant with grudge 1 or more shows the thin line to his target; a tap anywhere else hides it. */
  private pickGrudgeLine(tile: Pos): void {
    const at = this.state?.units.find((u) => u.pos && !u.gone && u.pos[0] === tile[0] && u.pos[1] === tile[1]);
    this.grudgeFor = at?.lieutenant && (at.grudge ?? 0) >= 1 && at.grudgeTarget ? at.uid : null;
    this.wake();
  }

  private groundOf(v: UnitView): Vector3 {
    const x = v.x + v.offX;
    const y = v.y + v.offY;
    const h = (this.terrain?.standOn(Math.min(Math.max(Math.round(x), 0), this.state.width - 1), Math.min(Math.max(Math.round(y), 0), this.state.height - 1)) ?? 0) + v.lift;
    return new Vector3(x + 0.5, h + 0.12, -y - 0.5);
  }

  private updateGrudgeLine(): void {
    const pair = this.grudgeTargetView();
    if (!pair) return void this.grudgeLine?.clear();
    this.grudgeLine ??= new GrudgeLine(this.scene);
    this.grudgeLine.set(this.groundOf(pair.from), this.groundOf(pair.to));
  }

  /** Status icons of a unit from its state (story 8.6); a unit that left the board shows none. */
  private setStatuses(u: BattleUnit): void {
    if (!u.pos || u.gone || !this.units.has(u.uid)) {
      this.statuses.delete(u.uid);
      this.statusIcons.drop(u.uid);
      return;
    }
    this.statuses.set(u.uid, new Set(u.status.map((s) => s.id)));
    this.statusIcons.set(u.uid, iconsOf(u.status));
  }

  /** A `status` event switches one icon on or off while the events play. */
  private flipStatus(uid: string, id: StatusId, on: boolean): void {
    const set = this.statuses.get(uid) ?? new Set<StatusId>();
    if (on) set.add(id);
    else set.delete(id);
    this.statuses.set(uid, set);
    if (this.units.has(uid)) this.statusIcons.set(uid, iconsOf([...set].map((s) => ({ id: s }))));
  }

  private placeStatusIcons(): void {
    for (const uid of this.statusIcons.uids()) {
      const v = this.units.get(uid);
      if (!v) continue;
      const p = this.screenOfXYZ(v.x + v.offX + 0.5, this.tileTop2(Math.round(v.x), Math.round(v.y)) + 0.95, -(v.y + v.offY + 0.5));
      // a lieutenant's pennant hangs over his head: the icons sit beside it
      const lt = this.pennants.has(uid);
      this.statusIcons.place(uid, lt ? p.x + this.ppt * 0.28 : p.x, p.y, v.visible && !v.downed && v.alpha > 0.5, !lt);
    }
  }

  /** Counter of phases a downed unit has left (pulse symbol + number, DESIGN.md `downed`); `null` removes it. */
  private setBleedLabel(uid: string, bled: number | null): void {
    const left = bled === null ? null : Math.max(0, this.data.balance.death.bleedOutTurns - bled);
    let el = this.bleedLabels.get(uid);
    if (left === null || !this.units.has(uid)) {
      el?.remove();
      this.bleedLabels.delete(uid);
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.className = 'hc-bleed';
      this.floatLayer.appendChild(el);
      this.bleedLabels.set(uid, el);
    }
    el.innerHTML = `<svg viewBox="0 0 24 12" aria-hidden="true"><path d="M1 7h5l2-5 3 9 3-7 2 3h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><b>${left}</b>`;
  }

  /** Point above the head of unit `uid` in CSS px relative to the canvas (speech bubbles); `null` when it is not on the board. */
  headScreen(uid: string): { x: number; y: number } | null {
    const v = this.units.get(uid);
    if (!v) return null;
    return this.screenOfXYZ(v.x + v.offX + 0.5, this.tileTop2(Math.round(v.x), Math.round(v.y)) + 1.05, -(v.y + v.offY + 0.5));
  }

  private placeBleedLabels(): void {
    for (const [uid, el] of this.bleedLabels) {
      const v = this.units.get(uid);
      if (!v) continue;
      const p = this.screenOfXYZ(v.x + v.offX + 0.5, this.tileTop2(Math.round(v.x), Math.round(v.y)) + 1.05, -(v.y + v.offY + 0.5));
      el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
    }
  }

  private removeUnit(v: UnitView): void {
    this.setBleedLabel(v.uid, null); // the counter goes with the figure (a unit that drops out of the fog while downed)
    this.statuses.delete(v.uid);
    this.statusIcons.drop(v.uid);
    v.figure.dispose();
    if (v.gold) disposeGoldRing(v.gold);
    this.rings.remove(v.uid);
    this.units.delete(v.uid);
    this.fadeDirty = true;
  }

  private setAnim(v: UnitView, anim: FigureAnim): void {
    v.anim = anim;
    v.figure.play(anim, v.facing, this.speed > 1 ? 1.6 : 1);
  }

  /** Full refresh after a command: terrain, props, units. */
  async setState(state: BattleState): Promise<void> {
    const terrainChanged = !this.state || this.state.terrain.join() !== state.terrain.join() || JSON.stringify(this.state.timers) !== JSON.stringify(state.timers);
    const objChanged = !this.state || JSON.stringify(this.state.objects) !== JSON.stringify(state.objects);
    this.state = state;
    if (terrainChanged) await this.buildTerrain();
    else if (objChanged) await this.buildProps();
    await this.syncUnits(state);
  }

  setOverlays(o: Overlays): void {
    this.overlays = o;
    this.wake();
    this.buildOverlays();
    void this.updateGhost();
  }

  // ------------------------------------------------------------------ overlays

  private tileTop(p: Pos): number {
    return this.terrain?.standOn(p[0], p[1]) ?? 0;
  }

  /** `tileTop` for two numbers (the labels of every frame make no position array) */
  private tileTop2(x: number, y: number): number {
    return this.terrain?.standOn(x, y) ?? 0;
  }

  private buildOverlays(): void {
    for (const o of this.overlayMeshes) {
      o.mesh.dispose();
      o.mat.dispose();
    }
    this.overlayMeshes = buildOverlayMeshes(this.scene, this.overlays, (p) => this.tileTop(p), this.data.render.look.marker, this.data.render.camera.tiltDeg);
  }

  private async updateGhost(): Promise<void> {
    const g = this.overlays.ghost;
    if (!g) {
      this.ghost?.figure.dispose();
      this.ghost = null;
      return;
    }
    if (this.ghost?.uid !== g.uid) {
      this.ghost?.figure.dispose();
      this.ghost = null;
      const u = this.state.units.find((x) => x.uid === g.uid);
      if (!u) return;
      const figure = await this.makeFigure(u, `ghost:${u.uid}`);
      if (this.overlays.ghost?.uid !== g.uid) {
        figure.dispose();
        return;
      }
      this.ghost = { uid: g.uid, figure };
      figure.tint(0, 0.15, 0.6);
    }
    const pos = this.overlays.ghost!.pos;
    this.ghost.figure.node.position.set(pos[0] + 0.5, this.tileTop(pos), -pos[1] - 0.5);
    this.ghost.figure.play('idle', 's', 1);
  }

  // ------------------------------------------------------------------ camera

  /**
   * The canvas size in CSS px. Cached: reading it with `getBoundingClientRect` for every label of every frame forced a layout
   * after the previous label's style write (story 7.8). A `ResizeObserver` and `resize()` drop the cache.
   */
  private size: { w: number; h: number } | null = null;
  private sizeObserver: ResizeObserver | null = null;

  private cssSize(): { w: number; h: number } {
    if (this.size) return this.size;
    const r = this.canvas.getBoundingClientRect();
    const size = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    // without an observer (no ResizeObserver) the size is measured anew on each call, as before
    if (this.sizeObserver) this.size = size;
    return size;
  }

  private cosTilt(): number {
    return this.basis().cos;
  }

  private pptFor(step: number): number {
    const { w, h } = this.cssSize();
    const steps = this.data.render.camera.zoomSteps;
    return Math.min(w, h) / steps[Math.max(0, Math.min(steps.length - 1, step))]!;
  }

  /** HUD insets in ground tiles (vertical ones stretched by the tilt). */
  private hudInsets(): Insets {
    const css = this.hooks.insets?.() ?? NO_INSETS;
    const k = 1 / this.ppt;
    const kv = k / this.cosTilt();
    return { top: css.top * kv, right: css.right * k, bottom: css.bottom * kv, left: css.left * k };
  }

  private fitCamera(): void {
    const s = this.state;
    this.step = Math.min(1, this.data.render.camera.zoomSteps.length - 1);
    this.ppt = this.pptFor(this.step);
    const player = s.units.filter((u) => u.team === 'player' && u.pos);
    let cx = s.width / 2;
    let cy = s.height / 2;
    if (player.length) {
      cx = player.reduce((t, u) => t + u.pos![0], 0) / player.length + 0.5;
      cy = player.reduce((t, u) => t + u.pos![1], 0) / player.length + 0.5;
    }
    const hud = this.hudInsets();
    this.camX = centreOn(cx, hud.left, hud.right);
    this.camY = centreOn(cy, hud.top, hud.bottom);
    // the opening view stays on the map; the margin is for dragging
    this.clampCamera(0);
  }

  /** Keeps the map reachable around the HUD: each edge may be pushed into the free area by the configured margin (D10). */
  private clampCamera(margin = this.data.render.camera.margin): void {
    if (!this.state) return;
    const { w, h } = this.cssSize();
    const hud = this.hudInsets();
    this.camX = clampAxis(this.camX, w / this.ppt, hud.left, hud.right, this.state.width, margin);
    this.camY = clampAxis(this.camY, h / this.ppt / this.cosTilt(), hud.top, hud.bottom, this.state.height, margin);
  }

  /** Call when the HUD changed size. */
  relayout(): void {
    this.clampCamera();
    this.wake();
  }

  /** Steps through the zoom levels of render.yaml (D9): +1 = closer. */
  zoom(delta: number): void {
    const steps = this.data.render.camera.zoomSteps.length;
    const next = Math.max(0, Math.min(steps - 1, this.step - Math.sign(delta)));
    if (next === this.step) return;
    this.step = next;
    this.zoomTween = { from: this.ppt, to: this.pptFor(next), start: performance.now() };
    this.wake();
  }

  centerOn(p: Pos, smooth = true): Promise<void> {
    const hud = this.hudInsets();
    const tx = centreOn(p[0] + 0.5, hud.left, hud.right);
    const ty = centreOn(p[1] + 0.5, hud.top, hud.bottom);
    if (!smooth || this.skip) {
      this.camX = tx;
      this.camY = ty;
      this.clampCamera();
      return Promise.resolve();
    }
    const fx = this.camX;
    const fy = this.camY;
    return this.tween(220, (t) => {
      this.camX = fx + (tx - fx) * t;
      this.camY = fy + (ty - fy) * t;
      this.clampCamera();
    });
  }

  /**
   * Goal marking: brings the marked fields into view. Fields already comfortably on screen: nothing moves. Otherwise the camera
   * glides to the middle of their bounding box and goes out zoom steps as far as needed (`framePlan`), never closer; it stays there
   * when the marking ends. Margin: render.yaml camera.markFrameMargin.
   */
  frameTiles(tiles: Pos[]): Promise<void> {
    if (!tiles.length || tiles.every((p) => this.isVisible(p))) return Promise.resolve();
    const { w, h } = this.cssSize();
    const css = this.hooks.insets?.() ?? NO_INSETS;
    const cam = this.data.render.camera;
    const plan = framePlan({ tiles, step: this.step, steps: cam.zoomSteps, viewW: w, viewH: h, hud: css, cosTilt: this.cosTilt(), margin: cam.markFrameMargin });
    const ppt = this.pptFor(plan.step);
    if (plan.step !== this.step) {
      this.step = plan.step;
      this.zoomTween = { from: this.ppt, to: ppt, start: performance.now() };
    }
    const kv = 1 / ppt / this.cosTilt();
    const tx = centreOn(plan.cx, css.left / ppt, css.right / ppt);
    const ty = centreOn(plan.cy, css.top * kv, css.bottom * kv);
    if (this.skip) {
      this.camX = tx;
      this.camY = ty;
      this.clampCamera();
      return Promise.resolve();
    }
    const fx = this.camX;
    const fy = this.camY;
    return this.tween(Math.max(220, cam.zoomMs), (t) => {
      this.camX = fx + (tx - fx) * t;
      this.camY = fy + (ty - fy) * t;
      this.clampCamera();
    });
  }

  /** Is the tile comfortably on screen, clear of the HUD? */
  isVisible(p: Pos): boolean {
    const { w, h } = this.cssSize();
    const hud = this.hudInsets();
    return inFreeArea(p[0] + 0.5, this.camX, w / this.ppt, hud.left, hud.right, 1) && inFreeArea(p[1] + 0.5, this.camY, h / this.ppt / this.cosTilt(), hud.top, hud.bottom, 1);
  }

  /** the view's axes for the camera tilt, worked out once per tilt value (callers do not change the vectors) */
  private basisCache: { tiltDeg: number; forward: Vector3; up: Vector3; sin: number; cos: number } | null = null;

  private basis() {
    const tiltDeg = this.data.render.camera.tiltDeg;
    if (this.basisCache?.tiltDeg !== tiltDeg) {
      const t = (tiltDeg * Math.PI) / 180;
      const sin = Math.sin(t);
      const cos = Math.cos(t);
      this.basisCache = { tiltDeg, forward: new Vector3(0, -cos, sin), up: new Vector3(0, sin, cos), sin, cos };
    }
    return this.basisCache!;
  }

  /** the camera values the view was last set from; a frame with the same ones leaves the camera alone */
  private camSet = { x: NaN, y: NaN, ppt: NaN, w: NaN, h: NaN, jitter: NaN };

  private updateCamera(now: number): void {
    if (this.zoomTween) {
      const k = Math.min(1, (now - this.zoomTween.start) / Math.max(1, this.data.render.camera.zoomMs));
      const e = 1 - Math.pow(1 - k, 3);
      this.ppt = this.zoomTween.from + (this.zoomTween.to - this.zoomTween.from) * e;
      this.clampCamera();
      if (k >= 1) this.zoomTween = null;
    }
    const { w, h } = this.cssSize();
    this.viewW = w;
    this.viewH = h;
    const { forward } = this.basis();
    if (this.shake && now > this.shakeEnd) this.shake = 0;
    const jitter = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const c = this.camSet;
    if (c.x === this.camX && c.y === this.camY && c.ppt === this.ppt && c.w === w && c.h === h && c.jitter === jitter) return;
    c.x = this.camX;
    c.y = this.camY;
    c.ppt = this.ppt;
    c.w = w;
    c.h = h;
    c.jitter = jitter;
    const target = new Vector3(this.camX + jitter, 0, -this.camY);
    this.camera.position.copyFrom(target.subtract(forward.scale(CAM_DIST)));
    this.camera.setTarget(target);
    this.camera.orthoLeft = -w / 2 / this.ppt;
    this.camera.orthoRight = w / 2 / this.ppt;
    this.camera.orthoTop = h / 2 / this.ppt;
    this.camera.orthoBottom = -h / 2 / this.ppt;
    // the weather's particles fall over what the camera sees, in the same density at every zoom
    const tilt = (this.data.render.camera.tiltDeg * Math.PI) / 180;
    const steps = this.data.render.camera.zoomSteps;
    const refPpt = Math.min(w, h) / steps[Math.min(1, steps.length - 1)]!;
    this.weather.follow(this.camX, -this.camY, w / 2 / this.ppt, h / 2 / this.ppt / Math.cos(tilt), tilt, (w * h) / (refPpt * refPpt * Math.cos(tilt)));
  }

  /** Shakes the camera by `strength` tiles for `ms` real ms (nothing in skip mode or when the option is off). */
  private kick(strength: number, ms: number): void {
    if (!this.shakeEnabled || this.skip || strength <= 0) return;
    this.shake = Math.max(this.shake, strength);
    this.shakeEnd = Math.max(this.shakeEnd, performance.now() + ms);
    this.wake(ms + 100);
  }

  /** Everything stands still for `ms` (a critical hit's freeze): skeletons, effects and floating numbers stop, the frame is still drawn. */
  private async freeze(ms: number): Promise<void> {
    if (ms <= 0 || this.skip) return;
    const t0 = performance.now();
    this.frozenAt = t0;
    this.scene.animationTimeScale = 0;
    await sleep(ms);
    const dt = performance.now() - t0;
    for (const f of this.fxSprites) f.start += dt;
    for (const f of this.floaters) f.start += dt;
    this.frozenAt = null;
    this.scene.animationTimeScale = 1;
  }

  /** World point → CSS px relative to the canvas (for HTML overlays and tests). */
  screenOfWorld(p: Vector3): { x: number; y: number } {
    return this.screenOfXYZ(p.x, p.y, p.z);
  }

  /** `screenOfWorld` for the three numbers: the frame's labels call it without making a vector each */
  private screenOfXYZ(x: number, y: number, z: number): { x: number; y: number } {
    const { w, h } = this.cssSize();
    const { sin, cos } = this.basis();
    return { x: w / 2 + (x - this.camX) * this.ppt, y: h / 2 - (y * sin + (z + this.camY) * cos) * this.ppt };
  }

  /** the canvas size (CSS px) the camera was last set up for */
  private viewW = 1;
  private viewH = 1;

  /** Is the world point (x east, y up, z north) in the view, with room for a figure around its feet? Cheaper than a projection. */
  private onScreen(x: number, y: number, z: number): boolean {
    const { sin, cos } = this.basis();
    const rx = x - this.camX;
    const rz = z + this.camY;
    const sx = this.viewW / 2 + rx * this.ppt;
    const sy = this.viewH / 2 - (y * sin + rz * cos) * this.ppt;
    const m = this.ppt * OFFSCREEN_TILES;
    return sx > -m && sx < this.viewW + m && sy > -m * 2 && sy < this.viewH + m;
  }

  /** Ground point of tile coordinates (x east, y south, in tiles) at height `h` → CSS px. */
  screenOf(x: number, y: number, h = 0): { x: number; y: number } {
    return this.screenOfXYZ(x, h, -y);
  }

  /** Screen (CSS px) → tile: marches the view ray down through the terrain heights. */
  tileAt(clientX: number, clientY: number): Pos | null {
    if (!this.terrain || !this.state) return null;
    const r = this.canvas.getBoundingClientRect();
    const { forward, up } = this.basis();
    const sx = (clientX - r.left - r.width / 2) / this.ppt;
    const sy = (r.height / 2 - (clientY - r.top)) / this.ppt;
    const origin = new Vector3(this.camX + sx, 0, -this.camY).add(up.scale(sy));
    const terrain = this.terrain;
    return marchToTile(origin, forward, (x, y) => terrain.topOf(x, y));
  }

  // ------------------------------------------------------------------ input

  private bindInput(): void {
    const c = this.canvas;
    const signal = this.input.signal;
    c.style.touchAction = 'none';
    c.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.hooks.onCancel?.();
    }, { signal });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom(e.deltaY < 0 ? 1 : -1);
    }, { passive: false, signal });
    c.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return;
      c.setPointerCapture(e.pointerId);
      this.pointer.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      this.wake();
      if (this.pointer.size === 1) {
        this.panMoved = false;
        this.longFired = false;
        clearTimeout(this.longTimer);
        this.longTimer = window.setTimeout(() => {
          if (this.panMoved || this.pointer.size !== 1) return;
          this.longFired = true;
          const t = this.tileAt(e.clientX, e.clientY);
          if (t) this.hooks.onLongPress?.(t);
        }, 400);
      } else if (this.pointer.size === 2) {
        clearTimeout(this.longTimer);
        const [a, b] = [...this.pointer.values()];
        this.pinchStart = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        this.panMoved = true;
      }
    }, { signal });
    c.addEventListener('pointermove', (e) => {
      const p = this.pointer.get(e.pointerId);
      if (!p) {
        if (e.pointerType === 'mouse') this.hooks.onHover?.(this.tileAt(e.clientX, e.clientY));
        return;
      }
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (this.pointer.size === 2) {
        const [a, b] = [...this.pointer.values()];
        const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        // pinch switches zoom steps (D9); two-finger drag pans
        if (d / Math.max(1, this.pinchStart) > 1.3) {
          this.zoom(1);
          this.pinchStart = d;
        } else if (d / Math.max(1, this.pinchStart) < 0.77) {
          this.zoom(-1);
          this.pinchStart = d;
        }
        this.pan(dx / 2, dy / 2);
        return;
      }
      if (!this.panMoved && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 10) {
        this.panMoved = true;
        clearTimeout(this.longTimer);
      }
      if (this.panMoved) this.pan(dx, dy);
    }, { signal });
    const up = (e: PointerEvent) => {
      const p = this.pointer.get(e.pointerId);
      this.pointer.delete(e.pointerId);
      clearTimeout(this.longTimer);
      if (!p || this.pointer.size > 0) return;
      if (!this.panMoved && !this.longFired) {
        const t = this.tileAt(e.clientX, e.clientY);
        if (t) {
          this.pickGrudgeLine(t);
          this.hooks.onTap?.(t);
        }
      }
    };
    c.addEventListener('pointerup', up, { signal });
    c.addEventListener('pointercancel', (e) => {
      this.pointer.delete(e.pointerId);
      clearTimeout(this.longTimer);
    }, { signal });
  }

  private pan(dxCss: number, dyCss: number): void {
    this.camX -= dxCss / this.ppt;
    this.camY -= dyCss / this.ppt / this.cosTilt();
    this.clampCamera();
    this.wake();
  }

  /** Keeps the full frame rate for a moment (input, animation, camera moves). */
  private wake(ms = 600): void {
    this.activeUntil = Math.max(this.activeUntil, performance.now() + ms);
  }

  // ------------------------------------------------------------------ frame

  busy(now: number): boolean {
    return now < this.activeUntil || this.zoomTween !== null || this.fxSprites.length > 0 || this.floaters.length > 0 || this.shake > 0;
  }

  frame(now: number): void {
    if (this.disposed) return;
    this.updateCamera(now);
    this.terrain?.tick(now);
    this.weather.tick(now);
    // a critical hit's freeze: the figures and effects keep the time they stopped at
    const clock = this.frozenAt ?? now;
    this.animClock += this.animWall < 0 ? 0 : Math.max(0, now - this.animWall) * this.scene.animationTimeScale;
    this.animWall = now;
    // markings breathe; under reduced motion they stand still (their middle opacity)
    const pulse = this.calmMotion ? 0.5 : 0.5 + 0.5 * Math.sin(now / 250);
    for (const o of this.overlayMeshes) {
      o.mat.alpha = o.alpha + o.pulse * pulse;
      if (o.bob) o.mesh.position.y = this.calmMotion ? 0 : Math.sin(now / 320) * o.bob;
    }
    for (const v of this.units.values()) this.placeUnit(v, this.animClock);
    this.rings.flush();
    this.updateFade();
    if (this.freezeIn > 0 && --this.freezeIn === 0) this.freezeStatic();
    this.updateGrudgeLine();
    if (this.ghost) this.ghost.figure.tick(this.animClock, this.speed);
    const boost = this.look.pointBoost;
    this.pointLights.forEach((l, k) => (l.intensity = (0.9 + Math.sin(now / 90 + k * 2) * 0.12 + Math.sin(now / 37 + k) * 0.08) * boost));
    this.updateFx(clock);
    this.scene.render();
    this.updateFloaters(clock);
    this.placeBleedLabels();
    this.placePennants();
    this.placeStatusIcons();
  }

  private placeUnit(v: UnitView, now: number): void {
    const x = v.x + v.offX;
    const y = v.y + v.offY;
    const tx = Math.min(Math.max(Math.round(x), 0), this.state.width - 1);
    const ty = Math.min(Math.max(Math.round(y), 0), this.state.height - 1);
    const h = (this.terrain?.standOn(tx, ty) ?? 0) + v.lift;
    v.figure.node.position.set(x + 0.5, h, -y - 0.5);
    // a figure outside the view is switched off: the scene then skips its meshes, bones and nodes altogether (story 7.7)
    const onScreen = this.onScreen(x + 0.5, h, -y - 0.5);
    const fx = Math.round(x);
    const fy = Math.round(y);
    if (fx !== v.fadeX || fy !== v.fadeY || v.visible !== v.fadeSeen) {
      v.fadeX = fx;
      v.fadeY = fy;
      v.fadeSeen = v.visible;
      this.fadeDirty = true;
    }
    v.figure.node.setEnabled(v.visible && onScreen);
    v.figure.tint(v.desat, v.flash, v.alpha);
    v.figure.tick(now, this.speed, onScreen);
    this.rings.place(v.uid, x + 0.5, h + 0.025, -y - 0.5, v.visible && !v.downed && v.alpha > 0.5 ? (v.desat > 0.3 ? 0.25 : 0.5) : 0);
    if (v.gold) {
      v.gold.position.set(x + 0.5, h + 0.03, -y - 0.5);
      v.gold.setEnabled(v.visible && onScreen && !v.downed && v.alpha > 0.5);
    }
  }

  // ------------------------------------------------------------------ fx

  spawnFx(anim: string, tx: number, ty: number, loop = false): void {
    if (this.skip) return;
    const f = this.makeFx(anim, tx, ty, loop);
    if (f) this.fxSprites.push(f);
  }

  private makeFx(anim: string, tx: number, ty: number, loop: boolean): FxSprite | null {
    if (!this.fx?.anims[anim] || !this.fxTexture) return null;
    const [cw, ch] = this.fx.cell;
    const mesh = CreatePlane(`fx:${anim}`, { width: cw / 48, height: ch / 48 }, this.scene);
    mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
    mesh.isPickable = false;
    mesh.position.set(tx + 0.5, this.tileTop([tx, ty]) + 0.5, -ty - 0.5);
    const mat = new StandardMaterial(`fx:${anim}`, this.scene);
    const tex = this.fxTexture.clone();
    tex.uScale = cw / this.fx.image.width;
    tex.vScale = ch / this.fx.image.height;
    mat.diffuseTexture = tex;
    mat.emissiveTexture = tex;
    mat.disableLighting = true;
    mat.fogEnabled = false;
    mat.useAlphaFromDiffuseTexture = true;
    mat.backFaceCulling = false;
    mat.disableDepthWrite = true;
    mat.zOffset = -4;
    mesh.material = mat;
    mesh.renderingGroupId = 1;
    return { mesh, mat, anim, start: performance.now(), loop };
  }

  private disposeFx(f: FxSprite): void {
    f.mat.diffuseTexture?.dispose();
    f.mat.dispose();
    f.mesh.dispose();
  }

  private updateFx(now: number): void {
    const fx = this.fx;
    if (!fx) return;
    // in place: no new array for the sprites of every frame (story 7.8)
    const list = this.fxSprites;
    let kept = 0;
    for (const f of list) {
      const a = fx.anims[f.anim]!;
      const n = Math.floor(((now - f.start) / 1000) * a.fps * (this.speed > 1 ? 1.6 : 1));
      if (!f.loop && n >= a.frames) {
        this.disposeFx(f);
        continue;
      }
      const col = f.loop ? n % a.frames : n;
      const tex = f.mat.diffuseTexture as Texture;
      tex.uOffset = (col * fx.cell[0]) / fx.image.width;
      tex.vOffset = 1 - ((a.row + 1) * fx.cell[1]) / fx.image.height;
      list[kept++] = f;
    }
    list.length = kept;
  }

  // ------------------------------------------------------------------ floating text

  floatText(tileX: number, tileY: number, text: string, cls: string, dur = 900, scale?: number): void {
    if (this.skip) return;
    const el = document.createElement('div');
    el.className = `hc-float ${cls}`;
    el.textContent = text;
    if (scale) el.style.setProperty('--hc-num-scale', String(scale));
    this.floatLayer.appendChild(el);
    this.floaters.push({ el, x: tileX + 0.5, y: tileY + 0.5, h: this.tileTop([tileX, tileY]) + 1.05, start: performance.now(), dur: dur / this.speed });
  }

  private updateFloaters(now: number): void {
    this.floaters = this.floaters.filter((f) => {
      const t = (now - f.start) / f.dur;
      if (t >= 1) {
        f.el.remove();
        return false;
      }
      const p = this.screenOfXYZ(f.x, f.h + t * 0.4, -f.y);
      f.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      f.el.style.opacity = String(t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25);
      return true;
    });
  }

  // ------------------------------------------------------------------ animation helpers

  private tween(ms: number, fn: (t: number) => void): Promise<void> {
    if (this.skip) {
      fn(1);
      return Promise.resolve();
    }
    const dur = ms / this.speed;
    const start = performance.now();
    return new Promise((resolve) => {
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / dur);
        fn(t);
        this.wake(200);
        if (t < 1 && !this.disposed) schedule(step);
        else resolve();
      };
      schedule(step);
    });
  }

  private wait(ms: number): Promise<void> {
    return this.skip ? Promise.resolve() : sleep(ms / this.speed);
  }

  /** `tween` for a duration that is already in real milliseconds at the current speed (the critical hit's time line). */
  private tweenReal(ms: number, fn: (t: number) => void): Promise<void> {
    return this.tween(ms * this.speed, fn);
  }

  private waitReal(ms: number): Promise<void> {
    return this.skip ? Promise.resolve() : sleep(ms);
  }

  private facingOf(from: Pos, to: Pos): Facing {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) return dx > 0 ? 'e' : 'w';
    return dy < 0 ? 'n' : 's';
  }

  private unitPos(uid: string): Pos | null {
    const v = this.units.get(uid);
    return v ? [Math.round(v.x), Math.round(v.y)] : null;
  }

  /** Seconds until the hit frame of an attack (sprite row timing, shared by the 3D animation). */
  private hitDelay(): number {
    const row = UNIT_ROWS.find((r) => r.name === 'attack_s')!;
    return ((row.hitFrame ?? 3) / (row.fps ?? 12) / (this.speed > 1 ? 1.6 : 1)) * 1000;
  }

  // ------------------------------------------------------------------ event playback

  /** Plays core events as board animations, then syncs to the final state. */
  async play(events: GameEvent[], finalState: BattleState, pool?: readonly BattleUnit[]): Promise<void> {
    if (this.readyPromise) await this.readyPromise;
    const pace = this.data.render.aiPace;
    for (let n = 0; n < events.length; n++) {
      const e = events[n]!;
      if (this.disposed) return;
      switch (e.t) {
        case 'moved': {
          const v = this.units.get(e.unit);
          if (!v || e.path.length < 2) break;
          // the foe's and the third party's way is walked slower than the player's own, so the eye can follow it
          const own = v.team === 'player';
          if (!this.isVisible(e.path[e.path.length - 1]!)) void this.centerOn(e.path[e.path.length - 1]!);
          for (let i = 1; i < e.path.length; i++) {
            const a = e.path[i - 1]!;
            const b = e.path[i]!;
            v.facing = this.facingOf(a, b);
            this.setAnim(v, 'walk');
            await this.tween(own ? 140 : pace.stepMs, (t) => {
              v.x = a[0] + (b[0] - a[0]) * t;
              v.y = a[1] + (b[1] - a[1]) * t;
            });
          }
          this.setAnim(v, 'idle');
          // a short pause on the new tile before the foe strikes or the next one moves
          if (!own) await this.wait(pace.afterMoveMs);
          break;
        }
        case 'aiTurn': {
          const p = this.unitPos(e.unit);
          if (p && !this.isVisible(p)) await this.centerOn(p);
          // a unit that only waits (no event of its own follows) is not announced
          const next = events[n + 1];
          if (!next || next.t === 'aiTurn' || next.t === 'phase' || next.t === 'exhausted' || next.t === 'battleEnd') break;
          // the acting unit pulses before it moves or strikes, so the player sees who is about to act
          const v = this.units.get(e.unit);
          if (v && !this.skip) {
            await this.tween(pace.focusMs, (t) => {
              v.flash = 0.45 * Math.sin(t * Math.PI);
            });
            v.flash = 0;
          }
          break;
        }
        case 'combat':
          await this.hooks.onEvent?.(e);
          break;
        case 'strike': {
          const a = this.units.get(e.attacker);
          const d = this.units.get(e.defender);
          const ap = this.unitPos(e.attacker);
          const dp = this.unitPos(e.defender);
          if (!a || !d || !ap || !dp) break;
          if (e.tandem) this.floatText(ap[0], ap[1], '⚔', 'hc-float-tandem');
          a.facing = this.facingOf(ap, dp);
          d.facing = this.facingOf(dp, ap);
          this.setAnim(a, 'attack');
          this.setAnim(d, d.anim);
          const hitAt = this.hitDelay();
          const lx = Math.sign(dp[0] - ap[0]) * 0.12;
          const ly = Math.sign(dp[1] - ap[1]) * 0.12;
          // a critical hit (story 8.6): the cut-in band runs while the attack winds up, the hit freezes, then star, shake, big number
          const crit = e.hit && e.crit ? critTimeline(this.data.render.look.fx.crit, hitAt / this.speed, this.speed, this.skip) : null;
          if (crit?.cutIn) this.hooks.onCutIn?.({ unit: e.attacker, element: e.element, skill: e.skill, ...crit.cutIn });
          void this.tween(hitAt, (t) => {
            a.offX = lx * Math.sin(t * Math.PI * 0.5);
            a.offY = ly * Math.sin(t * Math.PI * 0.5);
          });
          await this.wait(hitAt);
          if (e.hit) {
            if (e.magic && e.element) this.spawnFx(e.element === 'fire' ? 'fire_bolt' : e.element === 'wind' ? 'wind_slash' : e.element === 'water' ? 'water_burst' : e.element === 'earth' ? 'earth_spikes' : e.element === 'light' ? 'light_pillar' : 'dark_tendrils', dp[0], dp[1]);
            d.flash = 1;
            this.setAnim(d, 'hit');
            if (crit) await this.freeze(crit.freezeMs);
            this.spawnFx(e.crit ? 'hit_star_crit' : 'hit_spark', dp[0], dp[1]);
            if (crit) this.kick(crit.shake, crit.shakeMs);
            this.floatText(dp[0], dp[1], e.guarded ? '🛡 0' : String(e.dmg), e.crit ? 'hc-float-crit' : 'hc-float-dmg', 900, e.crit ? crit?.numberScale : undefined);
            this.hooks.onUnitHp?.(e.defender, e.hpAfter);
            await this.hooks.onEvent?.(e);
            if (crit) {
              // the target is thrown back along the blow and returns while its flash fades
              const kx = Math.sign(dp[0] - ap[0]) * 0.22;
              const ky = Math.sign(dp[1] - ap[1]) * 0.22;
              await this.tweenReal(crit.recoilMs, (t) => {
                d.flash = 1 - t;
                d.offX = kx * Math.sin(t * Math.PI);
                d.offY = ky * Math.sin(t * Math.PI);
              });
              d.offY = 0;
            } else
              await this.tween(140, (t) => {
                d.flash = 1 - t;
                d.offX = Math.sin(t * Math.PI * 3) * 0.04;
              });
          } else {
            this.floatText(dp[0], dp[1], 'miss', 'hc-float-miss');
            await this.hooks.onEvent?.(e);
            const side = a.facing === 'w' ? -1 : 1;
            await this.tween(140, (t) => {
              d.offX = Math.sin(t * Math.PI) * 0.1 * side;
            });
          }
          d.offX = 0;
          if (crit) await this.tweenReal(crit.returnMs, (t) => {
            a.offX = lx * (1 - t);
            a.offY = ly * (1 - t);
          });
          else await this.tween(90, (t) => {
            a.offX = lx * (1 - t);
            a.offY = ly * (1 - t);
          });
          this.setAnim(a, 'idle');
          if (!d.downed) this.setAnim(d, 'idle');
          await (crit ? this.waitReal(crit.settleMs) : this.wait(a.team === 'player' ? 60 : pace.afterStrikeMs));
          break;
        }
        case 'combatEnd':
          await this.hooks.onEvent?.(e);
          break;
        case 'damage':
        case 'heal': {
          const p = this.unitPos(e.unit);
          if (p) {
            this.floatText(p[0], p[1], (e.t === 'heal' ? '+' : '−') + e.amount, e.t === 'heal' ? 'hc-float-heal' : 'hc-float-dmg');
            if (e.t === 'heal') this.spawnFx('heal', p[0], p[1]);
          }
          this.hooks.onUnitHp?.(e.unit, e.hpAfter);
          if (e.t === 'heal') void this.hooks.onEvent?.(e);
          await this.wait(e.t === 'heal' ? 350 : 250);
          break;
        }
        case 'status': {
          const p = this.unitPos(e.unit);
          if (p && e.on) {
            // the localized short name and the effect at the feet; the icon over the head stays as long as the status does (story 8.6)
            this.floatText(p[0], p[1], t(`ui.status.${e.status}`), `hc-float-status hc-status-${e.status}`);
            const feet = this.data.render.look.fx.status.feet[e.status];
            if (feet) this.spawnFx(feet, p[0], p[1]);
          }
          this.flipStatus(e.unit, e.status, e.on);
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'knockback': {
          const v = this.units.get(e.unit);
          if (v && !e.blocked) {
            const fx = v.x;
            const fy = v.y;
            await this.tween(140, (t) => {
              v.x = fx + (e.to[0] - fx) * t;
              v.y = fy + (e.to[1] - fy) * t;
            });
          }
          break;
        }
        case 'terrain':
          this.state = { ...this.state, terrain: [...this.state.terrain], timers: { ...this.state.timers } };
          this.state.terrain[e.at[1] * this.state.width + e.at[0]] = e.terrain;
          if (e.terrain === 'burning') {
            const k = `${e.at[0]},${e.at[1]}`;
            this.state.timers[k] = finalState.timers[k] ?? { kind: 'burning', turns: 1, revertTo: 'grass' };
            this.spawnFx('smoke', e.at[0], e.at[1]);
          } else delete this.state.timers[`${e.at[0]},${e.at[1]}`];
          await this.buildTerrain();
          await this.wait(200);
          break;
        case 'downed': {
          const v = this.units.get(e.unit);
          if (v) {
            v.downed = true;
            v.desat = 1;
            this.setAnim(v, 'downed');
            const du = this.state?.units.find((x) => x.uid === e.unit);
            if (!du || bleedsOut(this.data, this.state, du)) this.setBleedLabel(e.unit, 0);
          }
          await this.hooks.onEvent?.(e);
          await this.wait(350);
          break;
        }
        case 'bleed':
          this.setBleedLabel(e.unit, e.turns);
          await this.hooks.onEvent?.(e);
          await this.wait(250);
          break;
        case 'fled': {
          // a lieutenant at 0 HP: backward jump away from the one who drove him off, smoke, the pennant falls, then he is gone;
          // the flee line (UI hook) is spoken after the jump while he still stands there (story 3.2). Skip mode only settles it.
          const v = this.units.get(e.unit);
          this.setBleedLabel(e.unit, null);
          if (v) {
            const origin: Pos = [Math.round(v.x), Math.round(v.y)];
            const by = e.by ? this.units.get(e.by) : undefined;
            const from: Pos | null = by ? [Math.round(by.x), Math.round(by.y)] : null;
            const to = fleeTarget(origin, from, this.state.width, this.state.height);
            if (from) v.facing = this.facingOf(origin, from);
            this.setAnim(v, 'idle');
            const pennant = this.pennants.get(e.unit);
            if (pennant && !this.skip) dropPennant(pennant, FLEE_JUMP_MS / this.speed);
            this.spawnFx('smoke', origin[0], origin[1]);
            await this.tween(FLEE_JUMP_MS, (t) => {
              v.x = origin[0] + (to[0] - origin[0]) * t;
              v.y = origin[1] + (to[1] - origin[1]) * t;
              v.lift = fleeArc(t);
            });
            v.lift = 0;
            pennant?.remove();
            this.pennants.delete(e.unit);
          }
          await this.hooks.onEvent?.(e);
          if (v) {
            await this.tween(FLEE_FADE_MS, (t) => {
              v.alpha = 1 - t;
              v.desat = t;
            });
            v.visible = false;
          }
          break;
        }
        case 'died':
        case 'retreated':
        case 'rescued':
        case 'escaped': {
          const v = this.units.get(e.unit);
          this.setBleedLabel(e.unit, null);
          if (v) {
            // death in ash (story 8.6): flakes with embers burst from the unit, it fades upwards, a short shake
            const death = this.data.render.look.fx.death;
            if (e.t === 'died' && !this.skip) {
              const g = this.groundOf(v);
              this.ash?.burst(g.x, g.y - 0.1, g.z);
              this.kick(death.shake, death.shakeMs / this.speed);
            }
            await this.tween(e.t === 'died' ? death.fadeMs : 300, (t) => {
              v.alpha = 1 - t;
              v.desat = t;
              v.lift = e.t === 'died' ? t * death.rise : 0;
            });
            v.visible = false;
          }
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'levelUp': {
          const p = this.unitPos(e.unit);
          if (p) this.spawnFx('levelup', p[0], p[1]);
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'spawned': {
          const final = finalState.units.find((x) => x.uid === e.unit) ?? pool?.find((x) => x.uid === e.unit);
          // `e.at`: a foe coming out of the fog appears where it first comes into sight, `pool`: the units of the whole state, for foes
          // the board is shown without but lets in for a moment (fog filter, story 2.6)
          const u = final && e.at ? { ...final, pos: e.at } : final;
          if (u) {
            await this.syncUnits({ ...this.state, units: [...this.state.units.filter((x) => x.uid !== u.uid), u] });
            const v = this.units.get(u.uid);
            if (v) {
              if (u.pos && !this.isVisible(u.pos)) await this.centerOn(u.pos);
              await this.tween(260, (t) => (v.alpha = t));
            }
          }
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'exhausted': {
          const v = this.units.get(e.unit);
          if (v) v.desat = 0.65;
          break;
        }
        case 'refreshed': {
          const v = this.units.get(e.unit);
          if (v) v.desat = 0;
          const p = this.unitPos(e.unit);
          if (p) this.spawnFx('levelup', p[0], p[1]);
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'rally': {
          for (const uid of e.affected) {
            const p = this.unitPos(uid);
            if (p) this.spawnFx('light_pillar', p[0], p[1]);
          }
          await this.hooks.onEvent?.(e);
          await this.wait(400);
          break;
        }
        case 'recruited': {
          // the figure is rebuilt in the new team's colours by the final sync
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'phase': {
          for (const v of this.units.values()) if (v.team === e.phase && !v.downed) v.desat = 0;
          await this.hooks.onEvent?.(e);
          break;
        }
        default:
          await this.hooks.onEvent?.(e);
      }
    }
    await this.setState(finalState);
  }
}
