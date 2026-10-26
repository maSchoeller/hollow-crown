/**
 * Weather of the board (story 8.6, concept/23-art-direction §2.5): falling particles (rain, ash, snow), scene mist, drifting
 * ground mist between the blocks, wet shine and puddles. The recipe comes from `resolveLook` / `weatherPlan` (render.yaml
 * `look.weather`); what is drawn depends on the quality level (`low`: no particles, layers or puddles).
 *
 * Particles are GPU particles where the browser can (WebGL 2 with transform feedback: they cost the main thread nothing per
 * frame), else CPU particles. The emitter box follows the camera, and only when the camera moved. Everything is made once when
 * the board loads (`BoardView.precompile` waits for `ready()`), so the first rain drop of a battle compiles nothing.
 */
import type { Scene } from '@babylonjs/core/scene';
import { Scene as SceneClass } from '@babylonjs/core/scene';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateDisc } from '@babylonjs/core/Meshes/Builders/discBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { GPUParticleSystem } from '@babylonjs/core/Particles/gpuParticleSystem';
import '@babylonjs/core/Particles/particleSystemComponent';
import '@babylonjs/core/Particles/webgl2ParticleSystem';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture';
import type { WeatherDef } from '../../core/defs';
import type { ResolvedLook, WeatherPlan } from '../shared/look';
import { hash3, type TerrainGrid, type TerrainView } from '../shared/terrain3d';

type Particles = ParticleSystem | GPUParticleSystem;

/** Height of the particle column above the ground, tiles. */
const COLUMN = 7;
/** Longest life of a particle, s: slow flakes dissolve in the air instead of needing the whole column to fill. */
const MAX_LIFE = 3.5;

const hex = (h: string, a = 1) => {
  const c = Color3.FromHexString(h);
  return new Color4(c.r, c.g, c.b, a);
};

/** Map tiles that can hold a puddle: open ground without water, props or height steps, picked by a fixed hash so the same map always gets the same puddles. */
export function puddleSpots(grid: TerrainGrid, count: number, seed: number): Array<{ gx: number; gy: number }> {
  const cand: Array<{ gx: number; gy: number; k: number }> = [];
  for (let gy = 0; gy < grid.h; gy++)
    for (let gx = 0; gx < grid.w; gx++) {
      if (!grid.inMap(gx, gy)) continue;
      const def = grid.at(gx, gy);
      if (!def || def.water || def.prop || def.cliff === 'wall') continue;
      cand.push({ gx, gy, k: hash3(gx, gy, seed + 97) });
    }
  return cand
    .sort((a, b) => a.k - b.k)
    .slice(0, count)
    .map(({ gx, gy }) => ({ gx, gy }));
}

export class WeatherView {
  private systems: Particles[] = [];
  private meshes: Mesh[] = [];
  private mats: StandardMaterial[] = [];
  /** the puddles are rebuilt with the terrain, apart from the rest */
  private puddles: Mesh[] = [];
  private puddleMat: StandardMaterial | null = null;
  private plan: WeatherPlan | null = null;
  private seed = 0;
  private textures: DynamicTexture[] = [];
  private terrain: TerrainView | null = null;
  private key = '';
  /** the box the particles fall in: centre (x, z) and half sizes, tiles */
  private boxes: Array<{ ps: Particles; centre: Vector3; half: Vector3; area: number; rate: number }> = [];
  private layers: Array<{ tex: DynamicTexture; speed: number }> = [];
  private sunSpecular: Color3 | null = null;

  constructor(
    private scene: Scene,
    /** distance of the camera from its target, tiles: the mist is measured from there */
    private cameraDistance: number,
  ) {}

  /** Builds the weather of `look` at `plan`; replaces what was there. Call after the terrain (re)built. */
  apply(look: ResolvedLook, plan: WeatherPlan, terrain: TerrainView, mapSize: [number, number], seed: number, sun: { specular: Color3 }): void {
    this.clear();
    this.terrain = terrain;
    this.plan = plan;
    this.seed = seed;
    const def = look.weatherDef;
    const scene = this.scene;
    // scene mist: linear fog measured along the view; everything that must stay clear (rings, markings, cloth) opts out
    if (plan.mist) {
      scene.fogMode = SceneClass.FOGMODE_LINEAR;
      scene.fogColor = Color3.FromHexString(plan.mist.color);
      scene.fogStart = this.cameraDistance + plan.mist.near;
      scene.fogEnd = this.cameraDistance + plan.mist.far;
    } else scene.fogMode = SceneClass.FOGMODE_NONE;
    // wet shine: the ground materials and a sun that is allowed to glint
    terrain.setWet(plan.wet);
    this.sunSpecular = plan.wet ? new Color3(1, 1, 1) : null;
    if (this.sunSpecular) sun.specular = this.sunSpecular;
    if (plan.particles > 0 && def.particles) this.addParticles(look.weather, def, plan.particles);
    if (plan.ground) this.addGroundMist(plan.ground, mapSize);
    if (plan.puddles) this.addPuddles(plan.puddles, terrain, seed);
    this.key = '';
  }

  /** The terrain was rebuilt (fire, razed house): the new block materials get their wet shine and the puddles their new heights. */
  terrainChanged(terrain: TerrainView): void {
    this.terrain = terrain;
    if (!this.plan) return;
    terrain.setWet(this.plan.wet);
    this.clearPuddles();
    if (this.plan.puddles) this.addPuddles(this.plan.puddles, terrain, this.seed);
  }

  private clearPuddles(): void {
    for (const m of this.puddles) m.dispose();
    this.puddles = [];
    this.puddleMat?.dispose(false, false);
    this.puddleMat = null;
  }

  private clear(): void {
    for (const ps of this.systems) ps.dispose();
    this.systems = [];
    this.boxes = [];
    for (const m of this.meshes) m.dispose();
    this.meshes = [];
    for (const m of this.mats) m.dispose(false, false);
    this.mats = [];
    for (const t of this.textures) t.dispose();
    this.textures = [];
    this.layers = [];
    this.clearPuddles();
    this.terrain?.setWet(null);
    this.plan = null;
  }

  // ------------------------------------------------------------------ particles

  private streak(): DynamicTexture {
    const t = new DynamicTexture('weather:streak', { width: 8, height: 64 }, this.scene, false);
    const g = t.getContext() as CanvasRenderingContext2D;
    const grd = g.createLinearGradient(0, 0, 0, 64);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.35, 'rgba(255,255,255,1)');
    grd.addColorStop(1, 'rgba(255,255,255,0.2)');
    g.fillStyle = grd;
    g.fillRect(2, 0, 4, 64);
    t.update(true);
    t.hasAlpha = true;
    this.textures.push(t);
    return t;
  }

  private dot(): DynamicTexture {
    const t = new DynamicTexture('weather:dot', { width: 32, height: 32 }, this.scene, false);
    const g = t.getContext() as CanvasRenderingContext2D;
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.55, 'rgba(255,255,255,0.7)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 32, 32);
    t.update(true);
    t.hasAlpha = true;
    this.textures.push(t);
    return t;
  }

  private newSystem(name: string, capacity: number): Particles {
    if (GPUParticleSystem.IsSupported) return new GPUParticleSystem(name, { capacity, randomTextureSize: 256 }, this.scene);
    return new ParticleSystem(name, capacity, this.scene);
  }

  /** One falling-particle system: `count` at the reference view, more or less as the view grows or shrinks (`follow`). */
  private fall(name: string, texture: Texture, count: number, p: { fall: number; size: number; length?: number; colour: string; alpha: number; additive?: boolean; drift: number }): void {
    const life = Math.min(MAX_LIFE, COLUMN / p.fall);
    const ps = this.newSystem(name, Math.ceil(count * 2.5));
    ps.particleTexture = texture;
    ps.emitter = new Vector3(0, 0, 0);
    ps.minEmitBox = new Vector3(-1, 0, -1);
    ps.maxEmitBox = new Vector3(1, COLUMN, 1);
    ps.direction1 = new Vector3(-p.drift, -1, -p.drift * 0.5);
    ps.direction2 = new Vector3(p.drift, -1, p.drift * 0.5);
    ps.minEmitPower = p.fall * 0.9;
    ps.maxEmitPower = p.fall * 1.1;
    ps.minLifeTime = life * 0.8;
    ps.maxLifeTime = life;
    ps.gravity = new Vector3(0, 0, 0);
    ps.minSize = ps.maxSize = 1;
    ps.minScaleX = ps.maxScaleX = p.size;
    ps.minScaleY = ps.maxScaleY = p.length ?? p.size;
    ps.billboardMode = p.length ? ParticleSystem.BILLBOARDMODE_Y : ParticleSystem.BILLBOARDMODE_ALL;
    ps.blendMode = p.additive ? ParticleSystem.BLENDMODE_ADD : ParticleSystem.BLENDMODE_STANDARD;
    const c = hex(p.colour, p.alpha);
    const clear = new Color4(c.r, c.g, c.b, 0);
    ps.addColorGradient(0, clear);
    ps.addColorGradient(0.12, c);
    ps.addColorGradient(0.8, c);
    ps.addColorGradient(1, clear);
    ps.renderingGroupId = 1;
    ps.emitRate = count / life;
    ps.start();
    this.systems.push(ps);
    this.boxes.push({ ps, centre: new Vector3(), half: new Vector3(), area: 0, rate: count / life });
  }

  private addParticles(weather: ResolvedLook['weather'], def: WeatherDef, count: number): void {
    const p = def.particles!;
    if (weather === 'rain') {
      this.fall('weather:rain', this.streak(), count, { fall: p.fallSpeed, size: p.size, length: p.length ?? 0.5, colour: p.color, alpha: p.alpha, drift: 0.04 });
    } else {
      const dot = this.dot();
      this.fall(`weather:${weather}`, dot, count, { fall: p.fallSpeed, size: p.size, colour: p.color, alpha: p.alpha, drift: weather === 'snow' ? 0.25 : 0.35 });
      if (p.emberShare && p.emberShare > 0) this.fall('weather:embers', dot, Math.max(1, Math.round(count * p.emberShare)), { fall: p.fallSpeed * 0.8, size: p.size * 0.8, colour: '#ff9a3c', alpha: 1, additive: true, drift: 0.35 });
    }
  }

  /**
   * Keeps the emitter boxes over what the camera sees (call when the camera moved). `cx`/`cz`: the camera target on the ground
   * (x east, z north), `halfW`/`halfD`: half the visible ground, tiles, `tilt`: camera tilt in radians (a falling particle at
   * height h is seen shifted by h·tan(tilt) towards the horizon), `ref`: ground area of the reference view, tiles².
   */
  follow(cx: number, cz: number, halfW: number, halfD: number, tilt: number, ref: number): void {
    if (!this.boxes.length) return;
    const key = `${cx.toFixed(2)}|${cz.toFixed(2)}|${halfW.toFixed(2)}|${halfD.toFixed(2)}`;
    if (key === this.key) return;
    this.key = key;
    const shift = COLUMN * Math.tan(tilt);
    const area = 4 * halfW * halfD;
    for (const b of this.boxes) {
      const em = b.ps.emitter as Vector3;
      // a higher particle is seen further towards the top of the screen (north): the box reaches that much further north than the view does
      em.set(cx, 0, cz + shift / 2);
      b.ps.minEmitBox.set(-halfW - 1, 0, -halfD - 1 - shift / 2);
      b.ps.maxEmitBox.set(halfW + 1, COLUMN, halfD + 1 + shift / 2);
      // the same density at every zoom: the rate follows the area of the view, within what the capacity allows
      b.ps.emitRate = b.rate * Math.min(2.4, Math.max(0.35, area / Math.max(1, ref)));
    }
  }

  /** All shaders of the weather are compiled (the board waits for it while loading). */
  ready(): boolean {
    return this.systems.every((s) => s.isReady()) && this.meshes.every((m) => m.isReady(true)) && this.puddles.every((m) => m.isReady(true));
  }

  // ------------------------------------------------------------------ ground mist

  private fogTexture(): DynamicTexture {
    const size = 256;
    const t = new DynamicTexture('weather:mist', { width: size, height: size }, this.scene, true);
    const g = t.getContext() as CanvasRenderingContext2D;
    g.clearRect(0, 0, size, size);
    // soft clouds, wrapping at the edges so the texture tiles and drifts without a seam
    for (let i = 0; i < 46; i++) {
      const h = hash3(i, 3, 11);
      const x = (h & 0xff) / 255 * size;
      const y = ((h >>> 8) & 0xff) / 255 * size;
      const r = 24 + ((h >>> 16) & 0x3f);
      for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]] as const) {
        const grd = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        grd.addColorStop(0, 'rgba(255,255,255,0.55)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd;
        g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
      }
    }
    t.update(true);
    t.hasAlpha = true;
    t.wrapU = t.wrapV = Texture.WRAP_ADDRESSMODE;
    this.textures.push(t);
    return t;
  }

  private addGroundMist(g: NonNullable<WeatherPlan['ground']>, mapSize: [number, number]): void {
    const [w, h] = mapSize;
    const tex = this.fogTexture();
    for (let i = 0; i < g.layers; i++) {
      const mesh = CreatePlane(`weather:ground${i}`, { width: w + 6, height: h + 6 }, this.scene);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(w / 2, g.height * (i + 1), -h / 2);
      mesh.isPickable = false;
      mesh.alwaysSelectAsActiveMesh = true;
      const m = new StandardMaterial(`weather:ground${i}`, this.scene);
      const layerTex = tex.clone() as DynamicTexture;
      layerTex.uScale = (w + 6) / 9;
      layerTex.vScale = (h + 6) / 9;
      layerTex.vOffset = i * 0.37;
      this.textures.push(layerTex);
      m.diffuseTexture = layerTex;
      m.useAlphaFromDiffuseTexture = true;
      m.emissiveColor = Color3.FromHexString(g.color);
      m.disableLighting = true;
      m.alpha = g.alpha;
      m.backFaceCulling = false;
      m.disableDepthWrite = true;
      m.fogEnabled = false;
      m.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
      mesh.material = m;
      mesh.receiveShadows = false;
      this.meshes.push(mesh);
      this.mats.push(m);
      this.layers.push({ tex: layerTex, speed: g.driftSpeed * (i % 2 ? -1 : 1) });
    }
  }

  /** Drifts the ground mist; cheap (one texture offset per layer). */
  tick(now: number): void {
    for (const l of this.layers) l.tex.uOffset = (now / 1000) * l.speed * 0.1;
  }

  /** Is anything of the weather moving (the board then keeps drawing at full rate)? */
  animated(): boolean {
    return this.systems.length > 0 || this.layers.length > 0;
  }

  // ------------------------------------------------------------------ puddles

  private addPuddles(p: NonNullable<WeatherPlan['puddles']>, terrain: TerrainView, seed: number): void {
    const spots = puddleSpots(terrain.grid, p.count, seed);
    if (!spots.length) return;
    const disc = CreateDisc('weather:puddle', { radius: 0.5, tessellation: 20 }, this.scene);
    disc.bakeTransformIntoVertices(Matrix.RotationX(Math.PI / 2));
    disc.isPickable = false;
    disc.alwaysSelectAsActiveMesh = true;
    disc.receiveShadows = false;
    const s = terrain.grid.skirt;
    const mats = new Float32Array(spots.length * 16);
    spots.forEach(({ gx, gy }, i) => {
      const x = gx - s;
      const y = gy - s;
      const hsh = hash3(gx, gy, seed + 5);
      const sc = 0.55 + ((hsh >>> 4) % 40) / 100;
      const ox = (((hsh >>> 12) % 30) - 15) / 100;
      const oy = (((hsh >>> 18) % 30) - 15) / 100;
      Matrix.Compose(new Vector3(sc, sc * 0.7, sc), Quaternion.RotationAxis(Vector3.Up(), ((hsh >>> 8) % 360) * (Math.PI / 180)), new Vector3(x + 0.5 + ox, (terrain.topOf(x, y) ?? 0) + 0.018, -y - 0.5 + oy)).copyToArray(mats, i * 16);
    });
    disc.thinInstanceSetBuffer('matrix', mats, 16, true);
    const m = new StandardMaterial('weather:puddle', this.scene);
    m.diffuseColor = Color3.FromHexString(p.color);
    m.specularColor = new Color3(1, 1, 1);
    m.specularPower = 90;
    m.alpha = p.alpha;
    m.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
    m.zOffset = -1;
    m.backFaceCulling = false;
    disc.material = m;
    this.puddles.push(disc);
    this.puddleMat = m;
  }

  dispose(): void {
    this.clear();
    this.scene.fogMode = SceneClass.FOGMODE_NONE;
  }
}
