/**
 * The render host (story 5.1, concept/24-architecture §5.12): one engine and one canvas for the whole app, the quality
 * level, the frame cap and the scene that is showing. Only one scene is active (today the board; the home may follow
 * later); the one before is disposed. The world map is a flat HTML picture, not a host scene. Babylon binds a loaded
 * model file to the scene it was loaded into, so the host keeps a single Babylon scene as the stage: each of our scenes
 * builds its camera, lights and meshes on it, and when it goes the host clears the stage except for the shared asset
 * cache. Switching scenes therefore loads no model again.
 */
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import type { AssetContainer } from '@babylonjs/core/assetContainer';
import type { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { GameData } from '../core';
import { assetUrl } from './shared/assets';
import { RefCache } from './shared/cache';
import { loadContainer } from './shared/models';

export type Quality = 'low' | 'mid' | 'high';

/**
 * How the active scene is drawn: `run` at full rate while it moves, `idle` capped at `board.fpsIdle` (a dialogue lies
 * over it), `pause` not at all (it is fully covered).
 */
export type Hold = 'run' | 'idle' | 'pause';

/** What the host needs of a scene. */
export interface HostedView {
  /** something moves (input, animation, camera): draw at `fpsActive`, else at `fpsIdle` */
  busy(now: number): boolean;
  /** updates and draws one frame */
  frame(now: number): void;
  /** the canvas changed size */
  resize(): void;
  dispose(): void;
}

/** The shared caches as one scene sees them: whatever it loads through here stays loaded while it lives. */
export interface AssetStore {
  scene: Scene;
  /** a model file (`models/…glb`); `materials` keeps the glTF materials (textured image-to-3D figures) */
  container(path: string, materials?: boolean): Promise<AssetContainer | null>;
  /** a painted texture by asset path (ground, tiling, mipmapped), created on the stage once */
  texture(path: string): Promise<Texture>;
  /** materials the scene shares between its figures (story 7.7), keyed by the scene; they go with the stage clear */
  materials: Map<string, StandardMaterial>;
}

export class RenderHost {
  readonly canvas: HTMLCanvasElement;
  readonly engine: Engine;
  /** the stage all scenes build on */
  readonly scene: Scene;
  private models: RefCache<AssetContainer | null>;
  private textures: RefCache<Texture>;
  /** loaded cached textures: they live in the stage's texture list but survive a scene switch */
  private kept = new Set<BaseTexture>();
  private view: HostedView | null = null;
  private holdMode: Hold = 'run';
  private lastFrame = 0;
  private running = false;

  constructor(private data: GameData) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'hc-stage';
    this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: false, stencil: true, antialias: true, adaptToDeviceRatio: false }, false);
    this.scene = new Scene(this.engine);
    this.scene.skipPointerMovePicking = true;
    const keep = data.render.assets.keepUnused;
    this.models = new RefCache(
      (key) => loadContainer(this.scene, key.slice(2), key.startsWith('m:')),
      (c) => c?.dispose(),
      keep,
    );
    this.textures = new RefCache(
      async (path) => {
        const t = new Texture(assetUrl(path), this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE);
        t.anisotropicFilteringLevel = 8;
        this.kept.add(t);
        return t;
      },
      (t) => {
        this.kept.delete(t);
        t.dispose();
      },
      keep,
    );
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this.engine.resize();
    this.view?.resize();
  };

  /** Puts the canvas into `slot` (an empty element the UI never renders into). */
  mount(slot: HTMLElement): void {
    if (this.canvas.parentElement !== slot) slot.appendChild(this.canvas);
    this.engine.resize();
  }

  /** The asset store of a scene (`holder` is the scene; it releases its entries with `release`). */
  store(holder: object): AssetStore {
    return {
      scene: this.scene,
      materials: new Map(),
      container: (path, materials = false) => this.models.use(`${materials ? 'm' : '-'}:${path}`, holder),
      texture: (path) => this.textures.use(path, holder),
    };
  }

  /** Software WebGL (no GPU) cannot carry shadows and full resolution; it always gets the low level (D8, D17). */
  softwareGl(): boolean {
    const r = this.engine.getGlInfo().renderer ?? '';
    return /swiftshader|llvmpipe|software|basic render/i.test(r);
  }

  /** Sets the render resolution for a quality level and returns the level in effect (software WebGL: always low). */
  setQuality(quality: Quality): Quality {
    const software = this.softwareGl();
    const q = software ? 'low' : quality;
    const def = this.data.render.quality[q];
    // software rendering also draws at half resolution to stay responsive
    this.engine.setHardwareScalingLevel(software ? 2 : 1 / Math.min(window.devicePixelRatio || 1, def.maxDpr));
    this.engine.resize();
    return q;
  }

  /** Makes `view` the active scene; the scene before is disposed first. */
  activate(view: HostedView): void {
    if (this.view && this.view !== view) this.view.dispose();
    this.view = view;
    this.holdMode = 'run';
    if (!this.running) {
      this.running = true;
      this.engine.runRenderLoop(this.frame);
    }
  }

  /** Called by a scene from its `dispose`: stops drawing it, clears the stage, releases its cached assets. */
  release(view: HostedView): void {
    if (this.view === view) {
      this.view = null;
      this.engine.stopRenderLoop(this.frame);
      this.running = false;
    }
    this.clearStage();
    this.models.release(view);
    this.textures.release(view);
  }

  hold(mode: Hold): void {
    this.holdMode = mode;
  }

  /** Is `view` the scene showing? */
  isActive(view: HostedView): boolean {
    return this.view === view;
  }

  private frame = (): void => {
    const v = this.view;
    if (!v || this.holdMode === 'pause') return;
    const now = performance.now();
    const { fpsActive, fpsIdle } = this.data.render.board;
    const fps = this.holdMode === 'run' && v.busy(now) ? fpsActive : fpsIdle;
    // 2 ms slack so a 60 Hz display does not drop every other frame
    if (now - this.lastFrame < 1000 / fps - 2) return;
    this.lastFrame = now;
    v.frame(now);
  };

  /** Disposes everything a scene left on the stage; the cache's model files are not on it, its textures are kept. */
  private clearStage(): void {
    const s = this.scene;
    for (const p of [...s.particleSystems]) p.dispose();
    for (const g of [...s.animationGroups]) g.dispose();
    for (const m of [...s.meshes]) m.dispose(true, false);
    for (const n of [...s.transformNodes]) n.dispose(true, false);
    for (const k of [...s.skeletons]) k.dispose();
    for (const l of [...s.lights]) l.dispose();
    for (const c of [...s.cameras]) c.dispose();
    for (const m of [...s.materials]) m.dispose(false, false);
    for (const m of [...s.multiMaterials]) m.dispose(false, false);
    for (const t of [...s.textures]) if (!this.kept.has(t)) t.dispose();
    s.activeCamera = null;
  }
}

let host: RenderHost | null = null;

/** The app's render host, made on first use. */
export function renderHost(data: GameData): RenderHost {
  host ??= new RenderHost(data);
  // dev tools and E2E tests inspect the host (draw calls, cache)
  if (import.meta.env.DEV || navigator.webdriver) (window as unknown as { __host: RenderHost }).__host = host;
  return host;
}
