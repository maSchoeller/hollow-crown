/**
 * Setup of the battle board: render quality, shadows, light and weather of the map, loading and warming up the scene.
 * Part of the class chain BoardBase → BoardSetup → BoardProps → BoardUnits → BoardCamera → BoardFrame → BoardView.
 */
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture';
import type { BattleState, TimeOfDay, Weather } from '../../core';
import { loadFx } from '../shared/assets';
import { loadGroundTextures } from '../shared/terrain3d';
import { warmTints } from '../shared/figures';
import { applyLight } from '../shared/season';
import { lookOverride, resolveLook, weatherPlan } from '../shared/look';
import { AshBurst } from './ash';
import { BoardBase, sleep } from './boardBase';

export abstract class BoardSetup extends BoardBase {
  // ------------------------------------------------------------------ setup

  protected makeFlameTexture(): DynamicTexture {
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

  protected applyQuality(): void {
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

  protected castShadows(meshes: Mesh[]): void {
    if (!this.shadows) return;
    for (const m of meshes) this.shadows.addShadowCaster(m, true);
  }

  /**
   * Draws the static shadow map anew on the next frame; call whenever terrain or props were rebuilt. The sun's frustum
   * follows the casters for that pass only and is then kept, so the lookup in later frames matches the map even when a
   * template's bounding box changes (props fading in and out).
   */
  protected refreshShadows(): void {
    const map = this.shadows?.getShadowMap();
    if (!map) return;
    this.sun.autoUpdateExtends = true;
    map.onAfterRenderObservable.addOnce(() => (this.sun.autoUpdateExtends = false));
    map.resetRefreshCounter();
  }

  /** The map as it is shown: its own time of day and weather, or those of `?look=` (dev build and `?debug` only). */
  protected lookMap() {
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


  /** Dev tool: shows the board with another time of day and weather at once, without reloading. */
  setLook(timeOfDay?: TimeOfDay, weather?: Weather): void {
    this.lookSwitch = { timeOfDay, weather };
    this.applyMapLight();
    this.applyWeather();
    this.refreshShadows();
    this.wake(1500);
  }

  /** Light, sky and the figures' floor and rim light from the map's look (story 8.6); a map without time of day and weather looks as before. */
  protected applyMapLight(): void {
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
  protected applyWeather(): void {
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
  protected async precompile(): Promise<void> {
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
  protected idleProp(m: Mesh): void {
    m.isVisible = false;
    m.setEnabled(false);
  }

  /** The templates sit at the origin (the instances carry the transforms): their world matrix never changes, so it is not recomputed each frame. */
  protected freezeProp(m: Mesh): Mesh {
    m.freezeWorldMatrix();
    return m;
  }

  /** Makes the twin of every prop template and gives it one instance, so that its shader variants (with instances) can compile and draw. */
  protected showTwins(): Mesh[] {
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
  protected warmDraw(): void {
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

  protected textureFromImage(name: string, img: HTMLImageElement | HTMLCanvasElement): DynamicTexture {
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
}
