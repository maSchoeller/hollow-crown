import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Color4, Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Constants } from '@babylonjs/core/Engines/constants';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture';
import type { BattleState, BattleUnit, GameData, GameEvent, Pos, Team } from '../core';
import { itemDef } from '../core';
import { MAX_LIGHTS } from './shaders';
import { loadFx, loadPropSheet, loadTiles, loadUnitSheet, TILE, type FxInfo, type Sheet, type TileAssets } from './assets';
import { composeGround, groundGrid, groundObjects } from './tilemap';
import './shaders';

export interface BoardHooks {
  onTap?(tile: Pos): void;
  onLongPress?(tile: Pos): void;
  onHover?(tile: Pos | null): void;
  onCancel?(): void;
  /** called for events the UI presents (dialogue, phase banner, level up …); may await */
  onEvent?(e: GameEvent): Promise<void> | void;
  /** hp changed during playback (UI hp bars) */
  onUnitHp?(uid: string, hp: number): void;
}

export interface Overlays {
  move?: Pos[];
  attack?: Pos[];
  heal?: Pos[];
  danger?: Pos[];
  path?: Pos[];
  targets?: Pos[];
  cursor?: Pos | null;
  ghost?: { uid: string; pos: Pos } | null;
  goal?: Pos[];
  reinforce?: Pos[];
}

interface UnitSprite {
  uid: string;
  sheet: Sheet;
  team: Team;
  x: number; // feet position in art px
  y: number;
  anim: string;
  animStart: number;
  flip: boolean;
  desat: number;
  flash: number;
  alpha: number;
  visible: boolean;
  downed: boolean;
  offX: number;
  offY: number;
}

interface PropSprite {
  sheet: Sheet;
  row: string;
  x: number;
  y: number;
  key: string;
}

interface FxSprite {
  anim: string;
  x: number;
  y: number;
  start: number;
  loop: boolean;
  tint?: number;
  key?: string;
}

interface Batch {
  opaque: Mesh;
  blend: Mesh;
  matOpaque: ShaderMaterial;
  matBlend: ShaderMaterial;
  sheet: Sheet;
}

const TEAM_INDEX: Record<Team, number> = { player: 0, enemy: 1, other: 2 };
// Hollow-64 team ramps (palette indices 52–63): player blue, enemy red, other green
const TEAM_RAMP = [
  '16285a', '2a52b0', '3d7be0', '8fbaf5',
  '4a1018', '9e2a2a', 'd9413a', 'f59a8a',
  '123a24', '2a7a3e', '3fa65a', '9be08f',
];
const TEAM_RING: Record<Team, [number, number, number]> = {
  player: [0.24, 0.48, 0.88],
  enemy: [0.85, 0.25, 0.23],
  other: [0.25, 0.65, 0.35],
};

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(0, 2), 16) / 255,
  parseInt(h.slice(2, 4), 16) / 255,
  parseInt(h.slice(4, 6), 16) / 255,
];
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

export class BoardView {
  readonly engine: Engine;
  readonly scene: Scene;
  private camera: FreeCamera;
  private hooks: BoardHooks;
  private data: GameData;
  private state!: BattleState;
  private canvas: HTMLCanvasElement;
  private floatLayer: HTMLDivElement;
  scale = 3;
  private camX = 0;
  private camY = 0;
  private dirty = true;
  private disposed = false;
  private tiles!: TileAssets;
  private fx?: FxInfo;
  private fxTexture?: Texture;
  private groundMesh?: Mesh;
  private groundMat?: ShaderMaterial;
  private groundTextures: DynamicTexture[] = [];
  private groundFrame = -1;
  private batches = new Map<string, Batch>();
  private units = new Map<string, UnitSprite>();
  private props: PropSprite[] = [];
  private fxSprites: FxSprite[] = [];
  private overlayMesh?: Mesh;
  private overlayMat?: ShaderMaterial;
  private fxMesh?: Mesh;
  private fxMat?: ShaderMaterial;
  private overlays: Overlays = {};
  private ambient: [number, number, number] = [1, 1, 1];
  private mapLights: Array<{ x: number; y: number; color: [number, number, number]; radius: number; intensity: number }> = [];
  private shake = 0;
  speed = 1;
  skip = false;
  quality: 'low' | 'mid' | 'high' = 'mid';
  private pointer = new Map<number, { x: number; y: number; sx: number; sy: number }>();
  private panMoved = false;
  private longTimer: number | undefined;
  private longFired = false;
  private pinchStart = 0;
  private pinchScale = 3;
  private readyPromise: Promise<void> | null = null;
  private ringTexture!: DynamicTexture;
  private maskTexture!: DynamicTexture;

  constructor(canvas: HTMLCanvasElement, floatLayer: HTMLDivElement, data: GameData, hooks: BoardHooks) {
    this.canvas = canvas;
    this.floatLayer = floatLayer;
    this.data = data;
    this.hooks = hooks;
    this.engine = new Engine(canvas, false, { preserveDrawingBuffer: false, stencil: false, antialias: false, adaptToDeviceRatio: true }, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.08, 0.1, 0.16, 1);
    this.scene.skipPointerMovePicking = true;
    this.scene.autoClear = true;
    this.camera = new FreeCamera('cam', new Vector3(0, 0, -100), this.scene);
    this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this.camera.setTarget(new Vector3(0, 0, 0));
    this.camera.minZ = 0.1;
    this.camera.maxZ = 1000;
    this.camera.inputs.clear();
    this.makeHelperTextures();
    this.bindInput();
    this.engine.runRenderLoop(() => {
      this.lastFrameAt = performance.now();
      this.frame();
    });
    // background pages pause requestAnimationFrame; keep state rendering alive at a low rate
    this.fallbackTimer = window.setInterval(() => {
      if (performance.now() - this.lastFrameAt > 400) {
        this.dirty = true;
        this.frame();
      }
    }, 250);
    if (import.meta.env.DEV) (window as unknown as { __board: BoardView }).__board = this;
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this.engine.resize();
    this.clampCamera();
    this.dirty = true;
  };

  dispose(): void {
    this.disposed = true;
    clearInterval(this.fallbackTimer);
    window.removeEventListener('resize', this.onResize);
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }

  // ------------------------------------------------------------------ setup

  private makeHelperTextures(): void {
    this.ringTexture = new DynamicTexture('ring', { width: 48, height: 24 }, this.scene, false, Texture.NEAREST_SAMPLINGMODE);
    const rc = this.ringTexture.getContext() as CanvasRenderingContext2D;
    rc.clearRect(0, 0, 48, 24);
    rc.fillStyle = '#ffffff';
    // pixel ellipse outline, 2 px
    for (let a = 0; a < 360; a += 2) {
      const r = (a * Math.PI) / 180;
      const x = Math.round(24 + Math.cos(r) * 19);
      const y = Math.round(12 + Math.sin(r) * 7);
      rc.fillRect(x - 1, y, 2, 2);
    }
    this.ringTexture.update(true);
    this.maskTexture = new DynamicTexture('mask', { width: 48, height: 48 }, this.scene, false, Texture.NEAREST_SAMPLINGMODE);
    const mc = this.maskTexture.getContext() as CanvasRenderingContext2D;
    mc.fillStyle = 'rgba(255,255,255,0.75)';
    mc.fillRect(0, 0, 48, 48);
    mc.fillStyle = 'rgba(255,255,255,1)';
    mc.fillRect(0, 0, 48, 2);
    mc.fillRect(0, 46, 48, 2);
    mc.fillRect(0, 0, 2, 48);
    mc.fillRect(46, 0, 2, 48);
    this.maskTexture.update(true);
  }

  private spriteMaterial(name: string, sheet: Sheet, blend: boolean): ShaderMaterial {
    const mat = new ShaderMaterial(
      name,
      this.scene,
      { vertex: 'hcSprite', fragment: 'hcSprite' },
      {
        attributes: ['position', 'uv', 'uvRect', 'params', 'params2', 'world0', 'world1', 'world2', 'world3'],
        uniforms: ['world', 'viewProjection', 'ambient', 'lightPos', 'lightColor', 'lightCount', 'teamRamp', 'useNormals'],
        samplers: ['colorMap', 'normalMap'],
        needAlphaBlending: blend,
      },
    );
    const color = this.textureFromImage(`${name}-c`, sheet.image);
    mat.setTexture('colorMap', color);
    mat.setTexture('normalMap', sheet.normal ? this.textureFromImage(`${name}-n`, sheet.normal) : color);
    mat.setFloat('useNormals', sheet.normal ? 1 : 0);
    mat.setArray3('teamRamp', TEAM_RAMP.flatMap(hex));
    mat.backFaceCulling = false;
    if (blend) {
      mat.alphaMode = Constants.ALPHA_COMBINE;
      mat.disableDepthWrite = true;
    }
    return mat;
  }

  private textureFromImage(name: string, img: HTMLImageElement | HTMLCanvasElement): DynamicTexture {
    const t = new DynamicTexture(name, { width: img.width, height: img.height }, this.scene, false, Texture.NEAREST_SAMPLINGMODE);
    const ctx = t.getContext() as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);
    t.update(true, true);
    t.hasAlpha = true;
    t.wrapU = Texture.CLAMP_ADDRESSMODE;
    t.wrapV = Texture.CLAMP_ADDRESSMODE;
    return t;
  }

  private batchFor(sheet: Sheet): Batch {
    let b = this.batches.get(sheet.id);
    if (b) return b;
    const opaque = CreatePlane(`b-${sheet.id}`, { size: 1 }, this.scene);
    const blend = CreatePlane(`bb-${sheet.id}`, { size: 1 }, this.scene);
    const matOpaque = this.spriteMaterial(`m-${sheet.id}`, sheet, false);
    const matBlend = this.spriteMaterial(`mb-${sheet.id}`, sheet, true);
    opaque.material = matOpaque;
    blend.material = matBlend;
    opaque.renderingGroupId = 2;
    blend.renderingGroupId = 3;
    opaque.alwaysSelectAsActiveMesh = true;
    blend.alwaysSelectAsActiveMesh = true;
    b = { opaque, blend, matOpaque, matBlend, sheet };
    this.batches.set(sheet.id, b);
    return b;
  }

  /** Loads assets and builds the static map. Call once per battle. */
  async load(state: BattleState): Promise<void> {
    this.readyPromise = (async () => {
      this.state = state;
      const map = this.data.maps[state.mapId]!;
      const amb = map.ambient ?? { color: '#ffffff', intensity: 1 };
      const a = hex(amb.color.replace('#', ''));
      this.ambient = [a[0] * amb.intensity, a[1] * amb.intensity, a[2] * amb.intensity];
      this.mapLights = (map.lights ?? []).map((l) => ({
        x: l.at[0] * TILE + TILE / 2,
        y: l.at[1] * TILE + TILE / 2,
        color: hex(l.color.replace('#', '')),
        radius: l.radius * TILE,
        intensity: 0.6,
      }));
      [this.tiles, this.fx] = await Promise.all([loadTiles(), loadFx()]);
      if (this.fx) this.fxTexture = this.textureFromImage('fx', this.fx.image);
      this.buildGround();
      await this.buildProps();
      await this.syncUnits(state, true);
      this.buildOverlayMeshes();
      this.fitCamera();
      this.dirty = true;
    })();
    return this.readyPromise;
  }

  private revertMap(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, t] of Object.entries(this.state.timers)) out[k] = t.revertTo;
    return out;
  }

  private buildGround(): void {
    const s = this.state;
    const grid = groundGrid(this.data, s.terrain, s.width, s.height, this.revertMap());
    const objs = groundObjects(this.data, s.terrain, s.width, s.height);
    const blocked = new Set<string>();
    for (let y = 0; y < s.height; y++)
      for (let x = 0; x < s.width; x++) if (this.data.terrain[s.terrain[y * s.width + x]!]?.prop) blocked.add(`${x},${y}`);
    for (const o of objs) blocked.add(`${o.x},${o.y}`);
    const seed = [...s.mapId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    const canvases = composeGround(this.tiles, grid, objs, seed, blocked);
    for (const t of this.groundTextures) t.dispose();
    this.groundTextures = canvases.map((c, i) => this.textureFromImage(`ground${i}`, c));
    if (!this.groundMesh) {
      this.groundMesh = CreatePlane('ground', { width: 1, height: 1 }, this.scene);
      this.groundMat = new ShaderMaterial(
        'groundMat',
        this.scene,
        { vertex: 'hcGround', fragment: 'hcGround' },
        { attributes: ['position', 'uv'], uniforms: ['world', 'viewProjection', 'ambient', 'lightPos', 'lightColor', 'lightCount', 'alpha'], samplers: ['colorMap'] },
      );
      this.groundMat.backFaceCulling = false;
      this.groundMat.setFloat('alpha', 1);
      this.groundMesh.material = this.groundMat;
      this.groundMesh.renderingGroupId = 0;
    }
    const w = s.width * TILE;
    const h = s.height * TILE;
    this.groundMesh.scaling.set(w, h, 1);
    this.groundMesh.position.set(w / 2, -h / 2, 10);
    this.groundFrame = -1;
  }

  private async buildProps(): Promise<void> {
    const s = this.state;
    const out: PropSprite[] = [];
    for (let y = 0; y < s.height; y++)
      for (let x = 0; x < s.width; x++) {
        let t = s.terrain[y * s.width + x]!;
        if (t === 'burning') t = s.timers[`${x},${y}`]?.revertTo ?? t;
        const prop = this.data.terrain[t]?.prop;
        if (!prop || ['bridge', 'throne', 'gate', 'door_closed', 'door_open', 'rockwall'].includes(prop)) continue;
        const sheet = await loadPropSheet(prop);
        let row = sheet.rows[0]!.name;
        if (prop === 'tree' && sheet.rows.length > 1) row = sheet.rows[(x * 7 + y * 13) % sheet.rows.length]!.name;
        if (prop === 'house') {
          const obj = s.objects.find((o) => o.at[0] === x && o.at[1] === y);
          row = obj?.state === 'visited' ? 'visited' : obj?.state === 'razed' ? 'razed' : 'intact';
          if (!sheet.rowIndex[row]) row = sheet.rows[0]!.name;
        }
        out.push({ sheet, row, x: x * TILE + TILE / 2, y: y * TILE + 42, key: `${x},${y}` });
      }
    // ruins created by raiders use the house "razed" row if available
    for (const o of s.objects) {
      if (o.type === 'chest') {
        const sheet = await loadPropSheet('chest');
        out.push({ sheet, row: o.state === 'open' ? 'open' : 'closed', x: o.at[0] * TILE + TILE / 2, y: o.at[1] * TILE + 42, key: `chest:${o.id}` });
      }
    }
    this.props = out;
  }

  private buildOverlayMeshes(): void {
    if (this.overlayMesh) return;
    this.overlayMesh = CreatePlane('overlay', { size: 1 }, this.scene);
    this.overlayMat = new ShaderMaterial(
      'overlayMat',
      this.scene,
      { vertex: 'hcOverlay', fragment: 'hcOverlay' },
      { attributes: ['position', 'uv', 'tint', 'uvRect', 'world0', 'world1', 'world2', 'world3'], uniforms: ['world', 'viewProjection'], samplers: ['maskMap'], needAlphaBlending: true },
    );
    this.overlayMat.setTexture('maskMap', this.maskTexture);
    this.overlayMat.backFaceCulling = false;
    this.overlayMat.disableDepthWrite = true;
    this.overlayMesh.material = this.overlayMat;
    this.overlayMesh.renderingGroupId = 1;
    this.overlayMesh.alwaysSelectAsActiveMesh = true;
    // rings share the overlay shader with a ring mask
    const ring = CreatePlane('rings', { size: 1 }, this.scene);
    const ringMat = this.overlayMat.clone('ringMat');
    ringMat.setTexture('maskMap', this.ringTexture);
    ring.material = ringMat;
    ring.renderingGroupId = 1;
    ring.alwaysSelectAsActiveMesh = true;
    (this as unknown as { ringMesh: Mesh }).ringMesh = ring;
    if (this.fxTexture) {
      this.fxMesh = CreatePlane('fx', { size: 1 }, this.scene);
      this.fxMat = new ShaderMaterial(
        'fxMat',
        this.scene,
        { vertex: 'hcOverlay', fragment: 'hcOverlay' },
        { attributes: ['position', 'uv', 'tint', 'uvRect', 'world0', 'world1', 'world2', 'world3'], uniforms: ['world', 'viewProjection'], samplers: ['maskMap'], needAlphaBlending: true },
      );
      this.fxMat.setTexture('maskMap', this.fxTexture);
      this.fxMat.backFaceCulling = false;
      this.fxMat.disableDepthWrite = true;
      this.fxMesh.material = this.fxMat;
      this.fxMesh.renderingGroupId = 3;
      this.fxMesh.alwaysSelectAsActiveMesh = true;
    }
  }

  // ------------------------------------------------------------------ state sync

  private unitSpriteId(u: BattleUnit): string {
    return u.sprite ?? u.charId ?? u.classId;
  }

  async syncUnits(state: BattleState, instant = false): Promise<void> {
    this.state = state;
    const seen = new Set<string>();
    for (const u of state.units) {
      if (!u.pos || u.gone) continue;
      seen.add(u.uid);
      let sp = this.units.get(u.uid);
      const weapon = u.equip.mainHand ? itemDef(this.data, u.equip.mainHand).weaponType : undefined;
      if (!sp) {
        const sheet = await loadUnitSheet(this.unitSpriteId(u), { classId: u.classId, weapon });
        sp = {
          uid: u.uid,
          sheet,
          team: u.team,
          x: u.pos[0] * TILE + TILE / 2,
          y: u.pos[1] * TILE + 42,
          anim: 'idle_s',
          animStart: performance.now() + (u.uid.length * 137) % 500,
          flip: false,
          desat: 0,
          flash: 0,
          alpha: 1,
          visible: true,
          downed: false,
          offX: 0,
          offY: 0,
        };
        this.units.set(u.uid, sp);
      }
      sp.team = u.team;
      void instant;
      sp.x = u.pos[0] * TILE + TILE / 2;
      sp.y = u.pos[1] * TILE + 42;
      sp.downed = u.downed;
      sp.anim = u.downed ? 'downed_s' : 'idle_s';
      sp.desat = u.downed ? 1 : u.acted && u.team === state.phase ? 0.65 : 0;
      sp.alpha = 1;
      sp.visible = true;
      sp.offX = sp.offY = 0;
    }
    for (const uid of [...this.units.keys()]) if (!seen.has(uid)) this.units.delete(uid);
    this.dirty = true;
  }

  /** Full refresh after a command: terrain, props, units. */
  async setState(state: BattleState): Promise<void> {
    const terrainChanged = !this.state || this.state.terrain.join() !== state.terrain.join() || JSON.stringify(this.state.timers) !== JSON.stringify(state.timers);
    const objChanged = !this.state || JSON.stringify(this.state.objects) !== JSON.stringify(state.objects);
    this.state = state;
    if (terrainChanged) this.buildGround();
    if (terrainChanged || objChanged) await this.buildProps();
    await this.syncUnits(state);
  }

  setOverlays(o: Overlays): void {
    this.overlays = o;
    this.dirty = true;
  }

  // ------------------------------------------------------------------ camera

  private fitCamera(): void {
    const s = this.state;
    const w = this.engine.getRenderWidth();
    const dpr = window.devicePixelRatio || 1;
    // default zoom: ~9–11 columns on a phone in portrait (concept/15 §2)
    const cols = Math.min(s.width, w / dpr < 600 ? 10 : 16);
    this.scale = Math.max(1, Math.round(w / (cols * TILE)));
    const player = s.units.filter((u) => u.team === 'player' && u.pos);
    if (player.length) {
      const cx = player.reduce((t, u) => t + u.pos![0], 0) / player.length;
      const cy = player.reduce((t, u) => t + u.pos![1], 0) / player.length;
      this.camX = (cx + 0.5) * TILE;
      this.camY = (cy + 0.5) * TILE - 48;
    } else {
      this.camX = (s.width * TILE) / 2;
      this.camY = (s.height * TILE) / 2;
    }
    this.clampCamera();
  }

  private clampCamera(): void {
    if (!this.state) return;
    const w = this.engine.getRenderWidth() / this.scale;
    const h = this.engine.getRenderHeight() / this.scale;
    const mw = this.state.width * TILE;
    const mh = this.state.height * TILE;
    const marginTop = 72; // UI bars
    const marginBottom = 160;
    this.camX = w >= mw ? mw / 2 : Math.min(Math.max(this.camX, w / 2), mw - w / 2);
    const minY = h / 2 - marginTop / this.scale;
    const maxY = mh - h / 2 + marginBottom / this.scale;
    this.camY = h >= mh + (marginTop + marginBottom) / this.scale ? mh / 2 : Math.min(Math.max(this.camY, minY), maxY);
  }

  zoom(delta: number): void {
    const dpr = window.devicePixelRatio || 1;
    const min = Math.max(1, Math.floor(dpr));
    const max = Math.max(min + 1, Math.round(6 * dpr));
    this.scale = Math.min(max, Math.max(min, this.scale + delta));
    this.clampCamera();
    this.dirty = true;
  }

  centerOn(p: Pos, smooth = true): Promise<void> {
    const tx = (p[0] + 0.5) * TILE;
    const ty = (p[1] + 0.5) * TILE;
    if (!smooth || this.skip) {
      this.camX = tx;
      this.camY = ty;
      this.clampCamera();
      this.dirty = true;
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

  /** Is the tile comfortably on screen? */
  isVisible(p: Pos): boolean {
    const w = this.engine.getRenderWidth() / this.scale;
    const h = this.engine.getRenderHeight() / this.scale;
    const x = (p[0] + 0.5) * TILE;
    const y = (p[1] + 0.5) * TILE;
    return Math.abs(x - this.camX) < w / 2 - TILE && Math.abs(y - this.camY) < h / 2 - TILE * 2;
  }

  private updateCamera(): void {
    const w = this.engine.getRenderWidth();
    const h = this.engine.getRenderHeight();
    const s = this.scale;
    const cx = Math.round(this.camX * s) / s + (this.shake ? (Math.random() - 0.5) * this.shake : 0);
    const cy = Math.round(this.camY * s) / s + (this.shake ? (Math.random() - 0.5) * this.shake : 0);
    this.camera.orthoLeft = -w / 2 / s;
    this.camera.orthoRight = w / 2 / s;
    this.camera.orthoTop = h / 2 / s;
    this.camera.orthoBottom = -h / 2 / s;
    this.camera.position.set(cx, -cy, -100);
    this.camera.setTarget(new Vector3(cx, -cy, 0));
  }

  /** Screen (CSS px relative to canvas) → tile. */
  tileAt(clientX: number, clientY: number): Pos | null {
    const r = this.canvas.getBoundingClientRect();
    const dpr = this.engine.getRenderWidth() / r.width;
    const px = (clientX - r.left) * dpr;
    const py = (clientY - r.top) * dpr;
    const ax = this.camX + (px - this.engine.getRenderWidth() / 2) / this.scale;
    const ay = this.camY + (py - this.engine.getRenderHeight() / 2) / this.scale;
    const tx = Math.floor(ax / TILE);
    const ty = Math.floor(ay / TILE);
    if (!this.state || tx < 0 || ty < 0 || tx >= this.state.width || ty >= this.state.height) return null;
    return [tx, ty];
  }

  /** Tile centre → CSS px relative to the canvas (for HTML overlays). */
  screenOf(artX: number, artY: number): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    const dpr = this.engine.getRenderWidth() / Math.max(1, r.width);
    return {
      x: ((artX - this.camX) * this.scale + this.engine.getRenderWidth() / 2) / dpr,
      y: ((artY - this.camY) * this.scale + this.engine.getRenderHeight() / 2) / dpr,
    };
  }

  // ------------------------------------------------------------------ input

  private bindInput(): void {
    const c = this.canvas;
    c.style.touchAction = 'none';
    c.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.hooks.onCancel?.();
    });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom(e.deltaY < 0 ? 1 : -1);
    }, { passive: false });
    c.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return;
      c.setPointerCapture(e.pointerId);
      this.pointer.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
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
        this.pinchScale = this.scale;
        this.panMoved = true;
      }
    });
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
        const ratio = d / Math.max(1, this.pinchStart);
        const target = Math.round(this.pinchScale * ratio);
        if (target !== this.scale) this.zoom(target - this.scale);
        // two-finger pan
        const r = this.canvas.getBoundingClientRect();
        const dpr = this.engine.getRenderWidth() / r.width;
        this.camX -= (dx * dpr) / this.scale / 2;
        this.camY -= (dy * dpr) / this.scale / 2;
        this.clampCamera();
        this.dirty = true;
        return;
      }
      if (!this.panMoved && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 10) {
        this.panMoved = true;
        clearTimeout(this.longTimer);
      }
      if (this.panMoved) {
        const r = this.canvas.getBoundingClientRect();
        const dpr = this.engine.getRenderWidth() / r.width;
        this.camX -= (dx * dpr) / this.scale;
        this.camY -= (dy * dpr) / this.scale;
        this.clampCamera();
        this.dirty = true;
      }
    });
    const up = (e: PointerEvent) => {
      const p = this.pointer.get(e.pointerId);
      this.pointer.delete(e.pointerId);
      clearTimeout(this.longTimer);
      if (!p || this.pointer.size > 0) return;
      if (!this.panMoved && !this.longFired) {
        const t = this.tileAt(e.clientX, e.clientY);
        if (t) this.hooks.onTap?.(t);
      }
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', (e) => {
      this.pointer.delete(e.pointerId);
      clearTimeout(this.longTimer);
    });
  }

  // ------------------------------------------------------------------ frame

  private animating = 0;
  private lastFrameAt = 0;
  private fallbackTimer: number | undefined;
  private lastTick = -1;

  private frame(): void {
    if (this.disposed || !this.state || !this.groundMesh) return;
    const now = performance.now();
    // animation tick ~12 fps for sprite/water/fire frames (battery friendly, concept/16 §7)
    const tick = Math.floor(now / 83);
    if (tick !== this.lastTick) {
      this.lastTick = tick;
      if (this.units.size || this.fxSprites.length || this.groundTextures.length > 1) this.dirty = true;
    }
    if (!this.dirty && this.animating === 0 && !this.shake) return;
    this.dirty = false;
    this.updateCamera();
    this.updateGround(now);
    this.updateLights(now);
    this.updateSprites(now);
    this.updateOverlays(now);
    this.updateFx(now);
    this.scene.render();
    this.updateFloaters();
  }

  private updateGround(now: number): void {
    if (!this.groundMat || !this.groundTextures.length) return;
    const f = this.groundTextures.length > 1 ? Math.floor(now / 166) % this.groundTextures.length : 0;
    if (f !== this.groundFrame) {
      this.groundFrame = f;
      this.groundMat.setTexture('colorMap', this.groundTextures[f]!);
    }
  }

  private updateLights(now: number): void {
    const lights: Array<{ x: number; y: number; color: [number, number, number]; radius: number; intensity: number }> = [];
    if (this.quality !== 'low') {
      lights.push(...this.mapLights);
      for (const [k, t] of Object.entries(this.state.timers)) {
        if (t.kind !== 'burning') continue;
        const [x, y] = k.split(',').map(Number) as [number, number];
        const flicker = 0.75 + 0.15 * Math.sin(now / 90 + x * 3 + y * 7);
        lights.push({ x: x * TILE + 24, y: y * TILE + 24, color: [1, 0.55, 0.22], radius: TILE * 2.6, intensity: flicker });
      }
      for (const f of this.fxSprites) {
        if (f.anim === 'fire_bolt' || f.anim === 'light_pillar' || f.anim === 'levelup' || f.anim === 'heal') {
          const col: [number, number, number] = f.anim === 'heal' ? [0.5, 1, 0.6] : f.anim === 'fire_bolt' ? [1, 0.5, 0.2] : [1, 0.9, 0.6];
          lights.push({ x: f.x, y: f.y - 16, color: col, radius: TILE * 2.2, intensity: 0.9 });
        }
      }
    }
    const max = this.quality === 'high' ? MAX_LIGHTS : 8;
    const list = lights.slice(0, max);
    const pos: number[] = [];
    const col: number[] = [];
    for (let i = 0; i < MAX_LIGHTS; i++) {
      const l = list[i];
      pos.push(l ? l.x : 0, l ? -l.y : 0, l ? 40 : 0, l ? l.radius : 1);
      col.push(l ? l.color[0] : 0, l ? l.color[1] : 0, l ? l.color[2] : 0, l ? l.intensity : 0);
    }
    const apply = (m?: ShaderMaterial) => {
      if (!m) return;
      m.setVector3('ambient', new Vector3(this.ambient[0], this.ambient[1], this.ambient[2]));
      m.setArray4('lightPos', pos);
      m.setArray4('lightColor', col);
      m.setInt('lightCount', list.length);
    };
    apply(this.groundMat);
    for (const b of this.batches.values()) {
      apply(b.matOpaque);
      apply(b.matBlend);
    }
  }

  private frameOf(sheet: Sheet, anim: string, start: number, now: number): { row: number; col: number; done: boolean } {
    const ri = sheet.rowIndex[anim] ?? sheet.rowIndex['idle_s'] ?? 0;
    const row = sheet.rows[ri]!;
    if (row.frames <= 1) return { row: ri, col: 0, done: true };
    const fps = (row.fps ?? 8) * (this.speed > 1 ? 1.6 : 1);
    const n = Math.floor(((now - start) / 1000) * fps);
    if (row.loop === 'once') return { row: ri, col: Math.min(n, row.frames - 1), done: n >= row.frames };
    if (row.loop === 'pingpong') {
      const period = row.frames * 2 - 2;
      const k = ((n % period) + period) % period;
      return { row: ri, col: k < row.frames ? k : period - k, done: false };
    }
    return { row: ri, col: ((n % row.frames) + row.frames) % row.frames, done: false };
  }

  private updateSprites(now: number): void {
    type Inst = { m: number[]; uv: number[]; p: number[]; p2: number[] };
    const buckets = new Map<string, { opaque: Inst[]; blend: Inst[]; sheet: Sheet }>();
    const push = (sheet: Sheet, blend: boolean, inst: Inst) => {
      let b = buckets.get(sheet.id);
      if (!b) buckets.set(sheet.id, (b = { opaque: [], blend: [], sheet }));
      (blend ? b.blend : b.opaque).push(inst);
    };
    const quad = (sheet: Sheet, row: number, col: number, x: number, y: number, z: number): { m: number[]; uv: number[] } => {
      const [cw, ch] = sheet.cell;
      const W = sheet.image.width;
      const H = sheet.image.height;
      const left = Math.round(x - sheet.anchor[0]);
      const top = Math.round(y - sheet.anchor[1]);
      const m = Matrix.Scaling(cw, ch, 1).multiply(Matrix.Translation(left + cw / 2, -(top + ch / 2), z));
      return { m: Array.from(m.asArray()), uv: [(col * cw) / W, 1 - ((row + 1) * ch) / H, cw / W, ch / H] };
    };
    for (const p of this.props) {
      const ri = p.sheet.rowIndex[p.row] ?? 0;
      const { m, uv } = quad(p.sheet, ri, 0, p.x, p.y, -p.y * 0.001);
      push(p.sheet, false, { m, uv, p: [0, 0, 0, 1], p2: [0, 0, 0, 0] });
    }
    const rings: Array<{ m: number[]; c: number[] }> = [];
    for (const sp of this.units.values()) {
      if (!sp.visible) continue;
      const f = this.frameOf(sp.sheet, sp.anim, sp.animStart, now);
      const x = sp.x + sp.offX;
      const y = sp.y + sp.offY;
      const { m, uv } = quad(sp.sheet, f.row, f.col, x, y, -y * 0.001 - 0.0005);
      push(sp.sheet, sp.alpha < 0.99, {
        m,
        uv,
        p: [TEAM_INDEX[sp.team], sp.desat, sp.flash, sp.alpha],
        p2: [sp.flip ? 1 : 0, 0, 0, 0],
      });
      if (!sp.downed && sp.alpha > 0.5) {
        const rm = Matrix.Scaling(48, 24, 1).multiply(Matrix.Translation(Math.round(sp.x), -Math.round(sp.y - 1), 4));
        const c = TEAM_RING[sp.team];
        rings.push({ m: Array.from(rm.asArray()), c: [c[0], c[1], c[2], sp.desat > 0.3 ? 0.35 : 0.65] });
      }
    }
    // ghost
    const g = this.overlays.ghost;
    if (g) {
      const sp = this.units.get(g.uid);
      if (sp) {
        const f = this.frameOf(sp.sheet, 'idle_s', sp.animStart, now);
        const y = g.pos[1] * TILE + 42;
        const { m, uv } = quad(sp.sheet, f.row, f.col, g.pos[0] * TILE + TILE / 2, y, -y * 0.001 - 0.0008);
        push(sp.sheet, true, { m, uv, p: [TEAM_INDEX[sp.team], 0, 0.15, 0.6], p2: [0, 0, 0, 0] });
      }
    }
    for (const [id, b] of this.batches) if (!buckets.has(id)) buckets.set(id, { opaque: [], blend: [], sheet: b.sheet });
    for (const { opaque, blend, sheet } of buckets.values()) {
      const batch = this.batchFor(sheet);
      this.fill(batch.opaque, opaque);
      this.fill(batch.blend, blend);
    }
    const ringMesh = (this as unknown as { ringMesh?: Mesh }).ringMesh;
    if (ringMesh) this.fillColor(ringMesh, rings.map((r) => ({ m: r.m, c: r.c, uv: [0, 0, 1, 1] })));
  }

  private fill(mesh: Mesh, list: Array<{ m: number[]; uv: number[]; p: number[]; p2: number[] }>): void {
    const n = list.length;
    mesh.isVisible = n > 0;
    if (!n) return;
    const mat = new Float32Array(n * 16);
    const uv = new Float32Array(n * 4);
    const p = new Float32Array(n * 4);
    const p2 = new Float32Array(n * 4);
    list.forEach((it, i) => {
      mat.set(it.m, i * 16);
      uv.set(it.uv, i * 4);
      p.set(it.p, i * 4);
      p2.set(it.p2, i * 4);
    });
    mesh.thinInstanceSetBuffer('matrix', mat, 16, false);
    mesh.thinInstanceSetBuffer('uvRect', uv, 4, false);
    mesh.thinInstanceSetBuffer('params', p, 4, false);
    mesh.thinInstanceSetBuffer('params2', p2, 4, false);
  }

  private fillColor(mesh: Mesh, list: Array<{ m: number[]; c: number[]; uv: number[] }>): void {
    const n = list.length;
    mesh.isVisible = n > 0;
    if (!n) return;
    const mat = new Float32Array(n * 16);
    const col = new Float32Array(n * 4);
    const uv = new Float32Array(n * 4);
    list.forEach((it, i) => {
      mat.set(it.m, i * 16);
      col.set(it.c, i * 4);
      uv.set(it.uv, i * 4);
    });
    mesh.thinInstanceSetBuffer('matrix', mat, 16, false);
    mesh.thinInstanceSetBuffer('tint', col, 4, false);
    mesh.thinInstanceSetBuffer('uvRect', uv, 4, false);
  }

  private updateOverlays(now: number): void {
    if (!this.overlayMesh) return;
    const list: Array<{ m: number[]; c: number[]; uv: number[] }> = [];
    const tile = (p: Pos, c: number[], inset = 0) => {
      const m = Matrix.Scaling(TILE - inset * 2, TILE - inset * 2, 1).multiply(Matrix.Translation(p[0] * TILE + TILE / 2, -(p[1] * TILE + TILE / 2), 5));
      list.push({ m: Array.from(m.asArray()), c, uv: [0, 0, 1, 1] });
    };
    const o = this.overlays;
    const pulse = 0.5 + 0.5 * Math.sin(now / 250);
    for (const p of o.danger ?? []) tile(p, [0.85, 0.2, 0.25, 0.28]);
    for (const p of o.goal ?? []) tile(p, [0.95, 0.8, 0.3, 0.3 + 0.15 * pulse]);
    for (const p of o.move ?? []) tile(p, [0.25, 0.5, 0.95, 0.42]);
    for (const p of o.attack ?? []) tile(p, [0.95, 0.3, 0.3, 0.38]);
    for (const p of o.heal ?? []) tile(p, [0.35, 0.9, 0.5, 0.4]);
    for (const p of o.reinforce ?? []) tile(p, [0.95, 0.5, 0.2, 0.25 + 0.2 * pulse], 8);
    for (const p of o.path ?? []) tile(p, [1, 1, 1, 0.55], 16);
    for (const p of o.targets ?? []) tile(p, [1, 0.85, 0.35, 0.35 + 0.35 * pulse], 2);
    if (o.cursor) tile(o.cursor, [1, 0.95, 0.75, 0.55 + 0.3 * pulse], 0);
    this.fillColor(this.overlayMesh, list);
    if (o.targets?.length || o.cursor || o.goal?.length || o.reinforce?.length) this.dirty = true;
  }

  private updateFx(now: number): void {
    if (!this.fxMesh || !this.fx) return;
    const list: Array<{ m: number[]; c: number[]; uv: number[] }> = [];
    const fx = this.fx;
    const W = fx.image.width;
    const H = fx.image.height;
    const [cw, ch] = fx.cell;
    const add = (anim: string, x: number, y: number, start: number, loop: boolean, alpha = 1): boolean => {
      const a = fx.anims[anim];
      if (!a) return false;
      const n = Math.floor(((now - start) / 1000) * a.fps * (this.speed > 1 ? 1.6 : 1));
      if (!loop && n >= a.frames) return false;
      const col = loop ? n % a.frames : n;
      const m = Matrix.Scaling(cw, ch, 1).multiply(Matrix.Translation(Math.round(x), -Math.round(y), 1));
      list.push({ m: Array.from(m.asArray()), c: [1, 1, 1, alpha], uv: [(col * cw) / W, 1 - ((a.row + 1) * ch) / H, cw / W, ch / H] });
      return true;
    };
    // persistent fire on burning tiles
    for (const [k, t] of Object.entries(this.state.timers)) {
      if (t.kind !== 'burning') continue;
      const [x, y] = k.split(',').map(Number) as [number, number];
      add('flame', x * TILE + 24, y * TILE + 22, (x * 97 + y * 31) * 13, true);
    }
    for (const k of Object.keys(this.state.timers)) void k;
    this.fxSprites = this.fxSprites.filter((f) => add(f.anim, f.x, f.y, f.start, f.loop));
    this.fillColor(this.fxMesh, list);
  }

  // ------------------------------------------------------------------ floating text

  private floaters: Array<{ el: HTMLDivElement; x: number; y: number; start: number; dur: number }> = [];

  floatText(tileX: number, tileY: number, text: string, cls: string, dur = 900): void {
    if (this.skip) return;
    const el = document.createElement('div');
    el.className = `hc-float ${cls}`;
    el.textContent = text;
    this.floatLayer.appendChild(el);
    this.floaters.push({ el, x: tileX * TILE + TILE / 2, y: tileY * TILE + 6, start: performance.now(), dur: dur / this.speed });
    this.dirty = true;
  }

  private updateFloaters(): void {
    const now = performance.now();
    this.floaters = this.floaters.filter((f) => {
      const t = (now - f.start) / f.dur;
      if (t >= 1) {
        f.el.remove();
        return false;
      }
      const p = this.screenOf(f.x, f.y - t * 20);
      f.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      f.el.style.opacity = String(t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25);
      this.dirty = true;
      return true;
    });
  }

  // ------------------------------------------------------------------ animation helpers

  private tween(ms: number, fn: (t: number) => void): Promise<void> {
    if (this.skip) {
      fn(1);
      this.dirty = true;
      return Promise.resolve();
    }
    const dur = ms / this.speed;
    const start = performance.now();
    this.animating++;
    return new Promise((resolve) => {
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / dur);
        fn(t);
        this.dirty = true;
        if (t < 1 && !this.disposed) schedule(step);
        else {
          this.animating--;
          resolve();
        }
      };
      schedule(step);
    });
  }

  private wait(ms: number): Promise<void> {
    return this.skip ? Promise.resolve() : sleep(ms / this.speed);
  }

  private dirOf(from: Pos, to: Pos): { anim: string; flip: boolean } {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) return { anim: 'e', flip: dx < 0 };
    return { anim: dy < 0 ? 'n' : 's', flip: false };
  }

  spawnFx(anim: string, tx: number, ty: number, loop = false): void {
    if (this.skip || !this.fx?.anims[anim]) return;
    this.fxSprites.push({ anim, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, start: performance.now(), loop });
    this.dirty = true;
  }

  private unitPos(uid: string): Pos | null {
    const sp = this.units.get(uid);
    if (!sp) return null;
    return [Math.floor(sp.x / TILE), Math.floor((sp.y - 42) / TILE)];
  }

  // ------------------------------------------------------------------ event playback

  /** Plays core events as board animations, then syncs to the final state. */
  async play(events: GameEvent[], finalState: BattleState): Promise<void> {
    if (this.readyPromise) await this.readyPromise;
    let lastCombat: { a: string; d: string } | null = null;
    for (const e of events) {
      if (this.disposed) return;
      switch (e.t) {
        case 'moved': {
          const sp = this.units.get(e.unit);
          if (!sp || e.path.length < 2) break;
          if (!this.isVisible(e.path[e.path.length - 1]!)) void this.centerOn(e.path[e.path.length - 1]!);
          for (let i = 1; i < e.path.length; i++) {
            const a = e.path[i - 1]!;
            const b = e.path[i]!;
            const d = this.dirOf(a, b);
            sp.anim = `walk_${d.anim}`;
            sp.flip = d.flip;
            const ax = a[0] * TILE + TILE / 2;
            const ay = a[1] * TILE + 42;
            const bx = b[0] * TILE + TILE / 2;
            const by = b[1] * TILE + 42;
            await this.tween(110, (t) => {
              sp.x = ax + (bx - ax) * t;
              sp.y = ay + (by - ay) * t;
            });
          }
          sp.anim = 'idle_s';
          sp.flip = false;
          break;
        }
        case 'aiTurn': {
          const p = this.unitPos(e.unit);
          if (p && !this.isVisible(p)) await this.centerOn(p);
          break;
        }
        case 'combat':
          lastCombat = { a: e.attacker, d: e.defender };
          await this.hooks.onEvent?.(e);
          break;
        case 'strike': {
          const a = this.units.get(e.attacker);
          const d = this.units.get(e.defender);
          const ap = this.unitPos(e.attacker);
          const dp = this.unitPos(e.defender);
          if (!a || !d || !ap || !dp) break;
          if (e.tandem) this.floatText(ap[0], ap[1], '⚔', 'hc-float-tandem');
          const dir = this.dirOf(ap, dp);
          a.anim = `attack_${dir.anim}`;
          a.flip = dir.flip;
          a.animStart = performance.now();
          const row = a.sheet.rows[a.sheet.rowIndex[a.anim] ?? 0];
          const fps = (row?.fps ?? 12) * (this.speed > 1 ? 1.6 : 1);
          const hitAt = ((row?.hitFrame ?? 3) / fps) * 1000;
          // lunge for placeholders / readability
          const lx = Math.sign(dp[0] - ap[0]) * 6;
          const ly = Math.sign(dp[1] - ap[1]) * 6;
          void this.tween(hitAt, (t) => {
            a.offX = lx * Math.sin(t * Math.PI * 0.5);
            a.offY = ly * Math.sin(t * Math.PI * 0.5);
          });
          await this.wait(hitAt);
          if (e.hit) {
            if (e.magic && e.element) this.spawnFx(e.element === 'fire' ? 'fire_bolt' : e.element === 'wind' ? 'wind_slash' : e.element === 'water' ? 'water_burst' : e.element === 'earth' ? 'earth_spikes' : e.element === 'light' ? 'light_pillar' : 'dark_tendrils', dp[0], dp[1]);
            this.spawnFx(e.crit ? 'hit_star_crit' : 'hit_spark', dp[0], dp[1]);
            d.flash = 1;
            d.anim = 'hit_s';
            d.animStart = performance.now();
            if (e.crit) {
              this.shake = 5;
              setTimeout(() => (this.shake = 0), 220 / this.speed);
            }
            this.floatText(dp[0], dp[1], e.guarded ? '🛡 0' : String(e.dmg), e.crit ? 'hc-float-crit' : 'hc-float-dmg');
            this.hooks.onUnitHp?.(e.defender, e.hpAfter);
            await this.hooks.onEvent?.(e);
            await this.tween(110, (t) => {
              d.flash = 1 - t;
              d.offX = Math.sin(t * Math.PI * 3) * 2;
            });
          } else {
            this.floatText(dp[0], dp[1], 'miss', 'hc-float-miss');
            await this.hooks.onEvent?.(e);
            await this.tween(140, (t) => {
              d.offX = Math.sin(t * Math.PI) * 4 * (dir.flip ? -1 : 1);
            });
          }
          d.offX = 0;
          await this.tween(90, (t) => {
            a.offX = lx * (1 - t);
            a.offY = ly * (1 - t);
          });
          a.anim = 'idle_s';
          a.flip = false;
          if (!d.downed) d.anim = 'idle_s';
          await this.wait(60);
          break;
        }
        case 'combatEnd':
          lastCombat = null;
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
          const sp = this.units.get(e.unit);
          if (sp && !e.blocked) {
            const fx = sp.x;
            const fy = sp.y;
            const tx = e.to[0] * TILE + TILE / 2;
            const ty = e.to[1] * TILE + 42;
            await this.tween(140, (t) => {
              sp.x = fx + (tx - fx) * t;
              sp.y = fy + (ty - fy) * t;
            });
          }
          break;
        }
        case 'terrain':
          this.state = { ...this.state, terrain: [...this.state.terrain], timers: { ...this.state.timers } };
          this.state.terrain[e.at[1] * this.state.width + e.at[0]] = e.terrain;
          if (e.terrain === 'burning') {
            const k = `${e.at[0]},${e.at[1]}`;
            const fin = finalState.timers[k];
            this.state.timers[k] = fin ?? { kind: 'burning', turns: 1, revertTo: 'grass' };
            this.spawnFx('smoke', e.at[0], e.at[1]);
          } else delete this.state.timers[`${e.at[0]},${e.at[1]}`];
          this.buildGround();
          if (e.cause === 'raze') await this.buildProps();
          await this.wait(200);
          break;
        case 'downed': {
          const sp = this.units.get(e.unit);
          if (sp) {
            sp.downed = true;
            sp.anim = 'downed_s';
            sp.desat = 1;
          }
          await this.hooks.onEvent?.(e);
          await this.wait(350);
          break;
        }
        case 'died':
        case 'retreated':
        case 'rescued':
        case 'escaped': {
          const sp = this.units.get(e.unit);
          if (sp) {
            if (e.t === 'died') this.spawnFx('smoke', Math.floor(sp.x / TILE), Math.floor((sp.y - 42) / TILE));
            const y0 = sp.y;
            await this.tween(e.t === 'died' ? 500 : 300, (t) => {
              sp.alpha = 1 - t;
              sp.desat = t;
              sp.offY = e.t === 'died' ? -t * 10 : 0;
              void y0;
            });
            sp.visible = false;
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
          const u = finalState.units.find((x) => x.uid === e.unit);
          if (u) {
            const st = { ...this.state, units: [...this.state.units.filter((x) => x.uid !== u.uid), u] };
            await this.syncUnits(st);
            const sp = this.units.get(u.uid);
            if (sp) {
              if (u.pos && !this.isVisible(u.pos)) await this.centerOn(u.pos);
              await this.tween(260, (t) => (sp.alpha = t));
            }
          }
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'exhausted': {
          const sp = this.units.get(e.unit);
          if (sp) sp.desat = 0.65;
          break;
        }
        case 'refreshed': {
          const sp = this.units.get(e.unit);
          if (sp) sp.desat = 0;
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
          const u = finalState.units.find((x) => x.uid === e.unit);
          const sp = this.units.get(e.unit);
          if (sp && u) sp.team = u.team;
          await this.hooks.onEvent?.(e);
          break;
        }
        case 'phase': {
          // reset exhaustion display for the new phase owner
          for (const sp of this.units.values()) if (sp.team === e.phase && !sp.downed) sp.desat = 0;
          await this.hooks.onEvent?.(e);
          break;
        }
        default:
          await this.hooks.onEvent?.(e);
      }
    }
    void lastCombat;
    await this.setState(finalState);
  }
}

export { Color3 };
