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
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
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
import type { BattleState, BattleUnit, GameData, GameEvent, GearPiece, Pos, Team } from '../../core';
import { itemDef, modelId, unitFigureId } from '../../core';
import { centreOn, clampAxis, inFreeArea, NO_INSETS, type Insets } from '../shared/camera';
import { loadFx, loadManifest, loadUnitSheet, UNIT_ROWS, type FxInfo } from '../shared/assets';
import { buildTerrain, hash3, loadGroundTextures, type GroundTextures, type TerrainView } from '../shared/terrain3d';
import { loadPropMesh, loadUnitModel } from '../shared/models';
import { ModelFigure, SpriteFigure, type Facing, type Figure, type FigureAnim } from '../shared/figures';
import { applyLight } from '../shared/season';
import { pickWeighted, treeSetOfAct } from '../shared/scenery';
import { renderHost, type AssetStore, type Hold, type HostedView, type Quality, type RenderHost } from '../host';
import { buildOverlayMeshes, type OverlayMesh, type Overlays } from './overlays';
import { marchToTile } from './picking';
import { fadeRule, hidesFigure, type PropBox } from './fade';
import { RingLayer } from './rings';
import { disposeGoldRing, GrudgeLine, makeGoldRing, makePennant, pennantNotches, setPennantNotches } from './lieutenant';

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

const RING_COLOR: Record<Team, string> = { player: '#3d7be0', enemy: '#d9413a', other: '#3fa65a' };
const MAX_FIRES = 12;
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
  /** camera shake on critical hits (option "shake", off with prefers-reduced-motion) */
  shakeEnabled = true;

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
  /** unit tiles the fade was last worked out for; '' forces a new pass */
  private fadeKey = '';
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
    this.scene.clearColor = new Color4(0.06, 0.07, 0.11, 1);
    this.camera = new FreeCamera('cam', new Vector3(0, 30, -30), this.scene);
    this.scene.activeCamera = this.camera;
    this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 400;
    this.camera.inputs.clear();
    this.hemi = new HemisphericLight('ambient', new Vector3(0.2, 1, -0.3), this.scene);
    this.sun = new DirectionalLight('sun', new Vector3(0.5, -1, 0.4), this.scene);
    this.rings = new RingLayer(this.scene, RING_COLOR);
    this.propMat = new StandardMaterial('props', this.scene);
    this.propMat.specularColor = new Color3(0.05, 0.05, 0.05);
    this.propMat.backFaceCulling = false;
    this.flameTexture = this.makeFlameTexture();
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
    this.ppt = this.pptFor(this.step);
    this.clampCamera();
  }

  /** Leaves the stage: the host clears what the board built; the models stay in its cache for the next scene. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.input.abort();
    for (const f of this.floaters) f.el.remove();
    for (const el of this.bleedLabels.values()) el.remove();
    for (const el of this.pennants.values()) el.remove();
    this.grudgeLine?.clear();
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

  private applyMapLight(): void {
    const map = this.data.maps[this.state.mapId]!;
    applyLight(this.hemi, this.sun, map.ambient, map.sun);
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
    const jobs: Promise<unknown>[] = [this.scene.whenReadyAsync()];
    if (fx) jobs.push(fx.mat.forceCompilationAsync(fx.mesh).catch(() => undefined));
    await Promise.race([Promise.all(jobs), sleep(this.data.render.board.precompileMs)]);
    if (fx) this.disposeFx(fx);
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
    this.terrain?.dispose();
    this.terrain = buildTerrain(this.scene, this.data, this.state, this.textures, this.seed, this.lightsMax());
    this.castShadows(this.terrain.casters);
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
    for (const m of this.propMeshes) m.thinInstanceCount = 0;
    const sets: PropSet[] = [];
    const s = this.state;
    const grid = this.terrain!.grid;
    type Place = { x: number; y: number; h: number; rot: number; scale: number; dim: boolean };
    const places = new Map<string, Place[]>();
    const put = (key: string, p: Place) => {
      const list = places.get(key);
      if (list) list.push(p);
      else places.set(key, [p]);
    };
    const manifest = await loadManifest();
    const trees = manifest.models?.props.tree ?? ['a'];
    // trees of the season of the act the map belongs to (summer: the manifest's plain trees)
    const map = this.data.maps[s.mapId]!;
    const treeSet = treeSetOfAct(this.data, map.act);
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
            put(treeSet ? pickWeighted(treeSet, ((r >>> 20) % 1000) / 1000).model : `tree_${trees[r % trees.length]}`, { ...base, rot: ((r >>> 4) % 360) * (Math.PI / 180), scale: 0.88 + ((r >>> 12) % 25) / 100 });
            break;
          case 'rock':
          case 'rockwall':
            put('rock_idle', { ...base, rot: ((r >>> 4) % 4) * (Math.PI / 2), scale: def.prop === 'rock' ? 1.05 : 0.9 });
            break;
          case 'house': {
            const obj = s.objects.find((o) => o.at[0] === x && o.at[1] === y);
            put(`house_${obj?.state === 'visited' ? 'visited' : obj?.state === 'razed' ? 'razed' : 'intact'}`, base);
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
    for (const m of this.propMeshes) if (!m.thinInstanceCount) m.isVisible = false;
    this.fadeKey = '';
    this.updateFade();
    this.refreshShadows();
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
    twin.isVisible = false;
    twin.isPickable = false;
    twin.alwaysSelectAsActiveMesh = true;
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
      if (!mats.length) {
        m.thinInstanceCount = 0;
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
   * reached another tile (moves, enemy phase, deployment), appeared or left.
   */
  private updateFade(): void {
    if (!this.terrain || !this.state) return;
    let key = '';
    const spots: Array<{ x: number; y: number; h: number }> = [];
    for (const v of this.units.values()) {
      if (!v.visible) continue;
      const tx = Math.round(v.x + v.offX);
      const ty = Math.round(v.y + v.offY);
      key += `${tx},${ty};`;
      spots.push({ x: tx + 0.5, y: ty + 0.5, h: this.terrain.standOn(tx, ty) });
    }
    if (key === this.fadeKey) return;
    this.fadeKey = key;
    const { cover, figureWidth } = this.data.render.board.fade;
    const rule = fadeRule(this.data.render.camera.tiltDeg, cover, figureWidth);
    for (const set of this.propSets) {
      let changed = false;
      set.boxes.forEach((b, k) => {
        const hide = spots.some((f) => hidesFigure(b, f, rule)) ? 1 : 0;
        if (set.faded[k] !== hide) {
          set.faded[k] = hide;
          changed = true;
        }
      });
      if (changed) this.writeProps(set);
    }
  }

  private buildFires(): void {
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
      const model = await loadUnitModel(this.store, mid, u.team, name, this.gearOf(u), manifestModels?.unitPacks);
      if (model) {
        model.root.scaling.setAll(this.data.render.board.figureScale);
        return new ModelFigure(model, this.weaponOf(u)?.motion, this.data.render.board.idleHz);
      }
    }
    const weapon = u.equip.mainHand ? itemDef(this.data, u.equip.mainHand).weaponType : undefined;
    const sheet = await loadUnitSheet(id, { classId: u.classId, weapon });
    return new SpriteFigure(this.scene, sheet, u.team, name);
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
    for (const u of state.units) this.setBleedLabel(u.uid, u.downed && !u.gone ? u.bleed ?? 0 : null);
    for (const u of state.units) this.setPennant(u);
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
    setPennantNotches(el, pennantNotches(u.grudge));
  }

  private placePennants(): void {
    for (const [uid, el] of this.pennants) {
      const v = this.units.get(uid);
      if (!v) continue;
      const p = this.screenOfWorld(new Vector3(v.x + v.offX + 0.5, this.tileTop([Math.round(v.x), Math.round(v.y)]) + 1.2, -(v.y + v.offY + 0.5)));
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
    return this.screenOfWorld(new Vector3(v.x + v.offX + 0.5, this.tileTop([Math.round(v.x), Math.round(v.y)]) + 1.05, -(v.y + v.offY + 0.5)));
  }

  private placeBleedLabels(): void {
    for (const [uid, el] of this.bleedLabels) {
      const v = this.units.get(uid);
      if (!v) continue;
      const p = this.screenOfWorld(new Vector3(v.x + v.offX + 0.5, this.tileTop([Math.round(v.x), Math.round(v.y)]) + 1.05, -(v.y + v.offY + 0.5)));
      el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
    }
  }

  private removeUnit(v: UnitView): void {
    this.setBleedLabel(v.uid, null); // the counter goes with the figure (a unit that drops out of the fog while downed)
    v.figure.dispose();
    if (v.gold) disposeGoldRing(v.gold);
    this.rings.remove(v.uid);
    this.units.delete(v.uid);
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

  private buildOverlays(): void {
    for (const o of this.overlayMeshes) {
      o.mesh.dispose();
      o.mat.dispose();
    }
    this.overlayMeshes = buildOverlayMeshes(this.scene, this.overlays, (p) => this.tileTop(p));
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

  private cssSize(): { w: number; h: number } {
    const r = this.canvas.getBoundingClientRect();
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
  }

  private cosTilt(): number {
    return Math.cos((this.data.render.camera.tiltDeg * Math.PI) / 180);
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

  /** Is the tile comfortably on screen, clear of the HUD? */
  isVisible(p: Pos): boolean {
    const { w, h } = this.cssSize();
    const hud = this.hudInsets();
    return inFreeArea(p[0] + 0.5, this.camX, w / this.ppt, hud.left, hud.right, 1) && inFreeArea(p[1] + 0.5, this.camY, h / this.ppt / this.cosTilt(), hud.top, hud.bottom, 1);
  }

  private basis() {
    const t = (this.data.render.camera.tiltDeg * Math.PI) / 180;
    return { forward: new Vector3(0, -Math.cos(t), Math.sin(t)), up: new Vector3(0, Math.sin(t), Math.cos(t)) };
  }

  /** the camera values the view was last set from; a frame with the same ones leaves the camera alone */
  private cameraKey = '';

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
    const jitter = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const key = `${this.camX}|${this.camY}|${this.ppt}|${w}|${h}|${jitter}`;
    if (key === this.cameraKey) return;
    this.cameraKey = key;
    const target = new Vector3(this.camX + jitter, 0, -this.camY);
    this.camera.position.copyFrom(target.subtract(forward.scale(60)));
    this.camera.setTarget(target);
    this.camera.orthoLeft = -w / 2 / this.ppt;
    this.camera.orthoRight = w / 2 / this.ppt;
    this.camera.orthoTop = h / 2 / this.ppt;
    this.camera.orthoBottom = -h / 2 / this.ppt;
  }

  /** World point → CSS px relative to the canvas (for HTML overlays and tests). */
  screenOfWorld(p: Vector3): { x: number; y: number } {
    const { w, h } = this.cssSize();
    const { up } = this.basis();
    const rel = p.subtract(new Vector3(this.camX, 0, -this.camY));
    return { x: w / 2 + rel.x * this.ppt, y: h / 2 - Vector3.Dot(rel, up) * this.ppt };
  }

  /** the canvas size (CSS px) the camera was last set up for */
  private viewW = 1;
  private viewH = 1;

  /** Is the world point (x east, y up, z north) in the view, with room for a figure around its feet? Cheaper than a projection. */
  private onScreen(x: number, y: number, z: number): boolean {
    const t = (this.data.render.camera.tiltDeg * Math.PI) / 180;
    const rx = x - this.camX;
    const rz = z + this.camY;
    const sx = this.viewW / 2 + rx * this.ppt;
    const sy = this.viewH / 2 - (y * Math.sin(t) + rz * Math.cos(t)) * this.ppt;
    const m = this.ppt * OFFSCREEN_TILES;
    return sx > -m && sx < this.viewW + m && sy > -m * 2 && sy < this.viewH + m;
  }

  /** Ground point of tile coordinates (x east, y south, in tiles) at height `h` → CSS px. */
  screenOf(x: number, y: number, h = 0): { x: number; y: number } {
    return this.screenOfWorld(new Vector3(x, h, -y));
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
    const pulse = 0.5 + 0.5 * Math.sin(now / 250);
    for (const o of this.overlayMeshes) o.mat.alpha = o.alpha + o.pulse * pulse;
    for (const v of this.units.values()) this.placeUnit(v, now);
    this.rings.flush();
    this.updateFade();
    this.updateGrudgeLine();
    if (this.ghost) this.ghost.figure.tick(now, this.speed);
    this.pointLights.forEach((l, k) => (l.intensity = 0.9 + Math.sin(now / 90 + k * 2) * 0.12 + Math.sin(now / 37 + k) * 0.08));
    this.updateFx(now);
    this.scene.render();
    this.updateFloaters(now);
    this.placeBleedLabels();
    this.placePennants();
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
    this.fxSprites = this.fxSprites.filter((f) => {
      const a = fx.anims[f.anim]!;
      const n = Math.floor(((now - f.start) / 1000) * a.fps * (this.speed > 1 ? 1.6 : 1));
      if (!f.loop && n >= a.frames) {
        this.disposeFx(f);
        return false;
      }
      const col = f.loop ? n % a.frames : n;
      const tex = f.mat.diffuseTexture as Texture;
      tex.uOffset = (col * fx.cell[0]) / fx.image.width;
      tex.vOffset = 1 - ((a.row + 1) * fx.cell[1]) / fx.image.height;
      return true;
    });
  }

  // ------------------------------------------------------------------ floating text

  floatText(tileX: number, tileY: number, text: string, cls: string, dur = 900): void {
    if (this.skip) return;
    const el = document.createElement('div');
    el.className = `hc-float ${cls}`;
    el.textContent = text;
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
      const p = this.screenOfWorld(new Vector3(f.x, f.h + t * 0.4, -f.y));
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
    for (const e of events) {
      if (this.disposed) return;
      switch (e.t) {
        case 'moved': {
          const v = this.units.get(e.unit);
          if (!v || e.path.length < 2) break;
          if (!this.isVisible(e.path[e.path.length - 1]!)) void this.centerOn(e.path[e.path.length - 1]!);
          for (let i = 1; i < e.path.length; i++) {
            const a = e.path[i - 1]!;
            const b = e.path[i]!;
            v.facing = this.facingOf(a, b);
            this.setAnim(v, 'walk');
            await this.tween(140, (t) => {
              v.x = a[0] + (b[0] - a[0]) * t;
              v.y = a[1] + (b[1] - a[1]) * t;
            });
          }
          this.setAnim(v, 'idle');
          break;
        }
        case 'aiTurn': {
          const p = this.unitPos(e.unit);
          if (p && !this.isVisible(p)) await this.centerOn(p);
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
          void this.tween(hitAt, (t) => {
            a.offX = lx * Math.sin(t * Math.PI * 0.5);
            a.offY = ly * Math.sin(t * Math.PI * 0.5);
          });
          await this.wait(hitAt);
          if (e.hit) {
            if (e.magic && e.element) this.spawnFx(e.element === 'fire' ? 'fire_bolt' : e.element === 'wind' ? 'wind_slash' : e.element === 'water' ? 'water_burst' : e.element === 'earth' ? 'earth_spikes' : e.element === 'light' ? 'light_pillar' : 'dark_tendrils', dp[0], dp[1]);
            this.spawnFx(e.crit ? 'hit_star_crit' : 'hit_spark', dp[0], dp[1]);
            d.flash = 1;
            this.setAnim(d, 'hit');
            if (e.crit && this.shakeEnabled) {
              this.shake = 0.12;
              setTimeout(() => (this.shake = 0), 220 / this.speed);
            }
            this.floatText(dp[0], dp[1], e.guarded ? '🛡 0' : String(e.dmg), e.crit ? 'hc-float-crit' : 'hc-float-dmg');
            this.hooks.onUnitHp?.(e.defender, e.hpAfter);
            await this.hooks.onEvent?.(e);
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
          await this.tween(90, (t) => {
            a.offX = lx * (1 - t);
            a.offY = ly * (1 - t);
          });
          this.setAnim(a, 'idle');
          if (!d.downed) this.setAnim(d, 'idle');
          await this.wait(60);
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
          if (p && e.on) this.floatText(p[0], p[1], e.status, `hc-float-status hc-status-${e.status}`);
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
            this.setBleedLabel(e.unit, 0);
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
        case 'died':
        case 'retreated':
        case 'rescued':
        case 'escaped': {
          const v = this.units.get(e.unit);
          this.setBleedLabel(e.unit, null);
          if (v) {
            if (e.t === 'died') this.spawnFx('smoke', Math.round(v.x), Math.round(v.y));
            await this.tween(e.t === 'died' ? 500 : 300, (t) => {
              v.alpha = 1 - t;
              v.desat = t;
              v.lift = e.t === 'died' ? t * 0.2 : 0;
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
