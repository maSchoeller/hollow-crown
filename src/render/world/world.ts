/**
 * The world map as a 3D scene of the render host (story 5.2, concept/23-art-direction §6): Valmora as one landscape
 * modelled in Blender (tools/art/blender_world.py, product owner 2026-10-24: real topography instead of tile blocks),
 * covered with the board's ground textures and props, an island in the Silbermeer. Places stand as miniatures (the variant
 * whose conditions hold), regions of later acts lie under fog, the dragon signs of the acts reached lie on top (act 1:
 * ash). The camera works like the board's (orthographic, tilted) with two zoom steps; the hub screen puts its nodes,
 * paths and region names as HTML on top, using `screenOf` after every frame (`onFrame`).
 */
import type { Engine } from '@babylonjs/core/Engines/engine';
import type { AssetContainer } from '@babylonjs/core/assetContainer';
import type { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Particles/particleSystemComponent';
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture';
import type { ConditionContext, GameData } from '../../core';
import { renderHost, type AssetStore, type HostedView, type Quality, type RenderHost } from '../host';
import { assetUrl, loadManifest } from '../shared/assets';
import { clampAxis } from '../shared/camera';
import { PropLayer, type PropPlace } from '../shared/props';
import { applyLight } from '../shared/season';
import { pickWeighted, planFence } from '../shared/scenery';
import { hash3 } from '../shared/terrain3d';
import { fogCorners, fogLabels, heightSampler, locationModel, worldLayout, type HeightField, type WorldLayout } from './layout';

let heights: Promise<HeightField | null> | null = null;
/** Heights of the Blender terrain (tools/art/world_height.py), loaded once. */
function loadHeights(): Promise<HeightField | null> {
  heights ??= fetch(assetUrl('world/valmora_heights.json'))
    .then((r) => (r.ok ? (r.json() as Promise<HeightField>) : null))
    .catch(() => null);
  return heights;
}

export interface WorldHooks {
  /** after every drawn frame: the UI places its HTML over the scene (nodes, paths, region names) */
  onFrame?(): void;
}

/** Share of the free view the map may be pushed past its edge: places at the rim can still rise above the node card. */
const CLAMP_MARGIN = 0.5;
/** longest wait for shader compilation before the map shows anyway */
const READY_WAIT_MS = 4000;

/** Landscape props by terrain prop (the board's look, D12); trees pick one of the manifest's tree models. */
const PROP_STATE: Record<string, string> = { rock: 'rock_idle', house: 'house_intact', fort: 'fort_idle', ruins: 'ruins_idle', shrine: 'shrine_idle', wagon: 'wagon_idle' };

export class WorldView implements HostedView {
  readonly engine: Engine;
  readonly scene: Scene;
  quality: Quality = 'mid';
  private host: RenderHost;
  private store: AssetStore;
  private camera: FreeCamera;
  private hemi: HemisphericLight;
  private sun: DirectionalLight;
  private shadows: ShadowGenerator | null = null;
  private propMat: StandardMaterial;
  private props: PropLayer;
  private layout: WorldLayout | null = null;
  /** heights of the Blender terrain in tiles (null until loaded: everything stands at 0) */
  private height: ((x: number, y: number) => number) | null = null;
  private water: { bump: Texture; drift: [number, number]; scale: number } | null = null;
  private ash: ParticleSystem | null = null;
  private disposed = false;
  private ready: Promise<string[]> | null = null;

  // camera: ground point at the screen centre (tiles, y = south), CSS px per tile, zoom step (0 near, 1 overview)
  private camX = 0;
  private camY = 0;
  private ppt = 30;
  private step = 1;
  /** extra closeness while a place is chosen (render.yaml world.focusZoom) */
  private close = false;
  private tween: { from: [number, number, number]; to: [number, number, number]; start: number; ms: number } | null = null;
  private activeUntil = 0;

  constructor(
    slot: HTMLElement,
    private data: GameData,
    private hooks: WorldHooks = {},
  ) {
    this.host = renderHost(data);
    this.host.mount(slot);
    this.engine = this.host.engine;
    this.scene = this.host.scene;
    this.store = this.host.store(this);
    this.host.activate(this);
    // the sea beyond the skirt, the same blue as the hub's ground
    // the open sea beyond the painted sea floor (under the water sheet)
    this.scene.clearColor = Color4.FromHexString(`${data.render.world.water.deep}ff`);
    this.camera = new FreeCamera('world:cam', new Vector3(0, 30, -30), this.scene);
    this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 400;
    this.camera.inputs.clear();
    this.scene.activeCamera = this.camera;
    this.hemi = new HemisphericLight('world:ambient', new Vector3(0.2, 1, -0.3), this.scene);
    this.sun = new DirectionalLight('world:sun', new Vector3(0.5, -1, 0.4), this.scene);
    this.propMat = new StandardMaterial('world:props', this.scene);
    this.propMat.specularColor = new Color3(0.05, 0.05, 0.05);
    this.propMat.backFaceCulling = false;
    this.props = new PropLayer(this.store, this.propMat, (m) => this.castShadows(m));
    if (import.meta.env.DEV || navigator.webdriver) (window as unknown as { __world: WorldView }).__world = this;
  }

  /** Map size in tiles (0 until loaded). */
  get size(): { w: number; h: number } {
    return { w: this.layout?.width ?? 0, h: this.layout?.height ?? 0 };
  }

  // ------------------------------------------------------------------ build

  /**
   * Builds the world for the act being played; `ctx` decides the variants of the places. Resolves with the prop models
   * that were missing (shown as nothing; listed as placeholders).
   */
  load(act: number, ctx: ConditionContext): Promise<string[]> {
    this.ready ??= this.build(act, ctx);
    return this.ready;
  }

  private async build(act: number, ctx: ConditionContext): Promise<string[]> {
    const world = this.data.world;
    const conf = this.data.render.world;
    this.quality = this.host.setQuality(this.quality);
    this.layout = worldLayout(world, act);
    this.applyQuality();
    // light of the season of the region being played
    const season = world.regions.find((r) => r.act === act)?.season ?? world.regions[0]!.season;
    const light = conf.seasons[season];
    applyLight(this.hemi, this.sun, light?.ambient, light?.sun);
    this.fitCamera();
    const [field, land] = await Promise.all([loadHeights(), this.store.container(`world/${world.id}.glb`)]);
    if (this.disposed) return [];
    const seed = [...world.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    if (field) this.height = heightSampler(field);
    if (land) this.buildLand(land);
    this.buildWater(field);
    this.buildFog();
    this.buildAsh(act);
    this.wake();
    const missing = await this.props.place(await this.propGroups(ctx, seed));
    // shaders compile in the background; until they are, the scene would draw an empty sea (the hub shows its stone)
    // (bounded: one stray unready entity must not keep the stone up for good)
    if (!this.disposed) await Promise.race([this.scene.whenReadyAsync(), new Promise((r) => setTimeout(r, READY_WAIT_MS))]);
    this.wake();
    return missing;
  }

  /** The landscape from Blender with its painted ground (tools/art/world_height.py: grass, autumn grass, rock, snow, sand, roads). */
  private buildLand(container: AssetContainer): void {
    const inst = container.instantiateModelsToScene((n) => `world:${n}`, false, { doNotInstantiate: true });
    const mat = new StandardMaterial('world:land', this.scene);
    // glTF texture coordinates have their origin on top: no flip
    const t = new Texture(assetUrl(`world/${this.data.world.id}_ground.webp`), this.scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
    t.anisotropicFilteringLevel = 8;
    t.wrapU = t.wrapV = Texture.CLAMP_ADDRESSMODE;
    mat.diffuseTexture = t;
    mat.specularColor = new Color3(0.03, 0.03, 0.03);
    mat.backFaceCulling = false;
    // Blender writes tile (x, y) at glTF (x, h, y) and the loader turns that into (−x, h, y); half a turn brings it onto
    // the board's convention (x, h, −y)
    const turn = new TransformNode('world:land', this.scene);
    turn.rotation.y = Math.PI;
    for (const root of inst.rootNodes) root.parent = turn;
    for (const root of inst.rootNodes)
      for (const m of root.getChildMeshes(false)) {
        if (!(m instanceof Mesh) || !m.getTotalVertices()) continue;
        m.material = mat;
        m.receiveShadows = true;
        m.isPickable = false;
        this.castShadows([m]);
      }
  }

  /**
   * The sea and the rivers: one calm water sheet at the water level of the height map. The sea floor is painted (foam at
   * the coast, turquoise shallows, deep blue); the sheet adds a light tint and slowly drifting long waves as a normal map
   * that catch the sun in soft glints (render.yaml world.water).
   */
  private buildWater(field: HeightField | null): void {
    const s = this.data.render.world.skirt.width;
    const conf = this.data.render.world.water;
    const { w, h } = this.size;
    const level = field?.water ?? this.data.render.board.waterLevel;
    const mesh = new Mesh('world:water', this.scene);
    const vd = new VertexData();
    // the sea reaches far out to the south and west (the camera may look past the map there), land ends the east and north
    const far = conf.reach;
    const x0 = -s - far;
    const x1 = w + s;
    const z0 = s;
    const z1 = -h - s - far;
    vd.positions = [x0, level, z0, x1, level, z0, x1, level, z1, x0, level, z1];
    vd.indices = [0, 1, 2, 0, 2, 3];
    vd.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
    vd.uvs = [0, 1, 1, 1, 1, 0, 0, 0];
    vd.applyToMesh(mesh);
    const bump = new Texture(assetUrl('world/water_normal.png'), this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE);
    bump.wrapU = bump.wrapV = Texture.WRAP_ADDRESSMODE;
    bump.uScale = (x1 - x0) / conf.normalScale;
    bump.vScale = (z0 - z1) / conf.normalScale;
    bump.level = conf.bump;
    const mat = new StandardMaterial('world:water', this.scene);
    mat.diffuseColor = Color3.FromHexString(conf.tint);
    // a little own light, so the waves do not turn the sea grey in their shadowed slopes
    mat.emissiveColor = Color3.FromHexString(conf.tint).scale(conf.glow);
    mat.bumpTexture = bump;
    mat.alpha = conf.alpha;
    mat.specularColor = new Color3(0.55, 0.58, 0.6);
    mat.specularPower = 96;
    mat.backFaceCulling = false;
    mesh.material = mat;
    mesh.isPickable = false;
    mesh.receiveShadows = true;
    this.water = { bump, drift: conf.drift, scale: conf.normalScale };
  }

  private applyQuality(): void {
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
      this.shadows = sg;
    }
  }

  private castShadows(meshes: Mesh[]): void {
    if (!this.shadows) return;
    for (const m of meshes) this.shadows.addShadowCaster(m, true);
  }

  /** Landscape props of the tiles and the miniatures of the places. */
  private async propGroups(ctx: ConditionContext, seed: number): Promise<Map<string, PropPlace[]>> {
    const layout = this.layout!;
    const world = this.data.world;
    const water = this.data.render.board.waterLevel;
    const conf = this.data.render.world;
    const groups = new Map<string, PropPlace[]>();
    const put = (key: string, p: PropPlace) => {
      const list = groups.get(key);
      if (list) list.push(p);
      else groups.set(key, [p]);
    };
    const manifest = await loadManifest();
    const trees = manifest.models?.props.tree ?? ['a'];
    const bushes = manifest.models?.props.bush ?? [];
    const sc = conf.scenery;
    const W = layout.width;
    const terrainAt = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= layout.height ? '' : layout.terrain[y * W + x]!);
    const nearPlace = (x: number, y: number, d: number) => world.locations.some((l) => Math.abs(l.at[0] - x) <= d && Math.abs(l.at[1] - y) <= d);
    const shadeAt = (x: number, y: number) => (layout.fog[y * W + x] ? 0.8 : 1);
    const taken = this.ruralProps(seed, put, terrainAt, nearPlace, shadeAt);
    for (let y = 0; y < layout.height; y++)
      for (let x = 0; x < layout.width; x++) {
        const def = this.data.terrain[layout.terrain[y * layout.width + x]!];
        // dead trees on the ash and on the open tiles next to it
        const open = def?.id === 'grass' || def?.id === 'plain';
        if (def?.id === 'ash' || open) {
          let chance = 0;
          if (def?.id === 'ash') chance = sc.deadTrees.onAsh;
          else if ([-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => terrainAt(x + dx, y + dy) === 'ash'))) chance = sc.deadTrees.nearAsh;
          const d = hash3(x, y, seed + 41);
          const dh = this.groundAt(x + 0.5, y + 0.5);
          if (chance > 0 && (d & 0xffff) / 0x10000 < chance && dh >= water + 0.05 && !nearPlace(x, y, 1))
            put(sc.deadTrees.model, { x: x + 0.5 + (((d >>> 16) % 5) - 2) * 0.07, z: -y - 0.5 + (((d >>> 20) % 5) - 2) * 0.07, h: dh, rot: ((d >>> 8) % 360) * (Math.PI / 180), scale: 0.85 + ((d >>> 4) % 31) / 100, shade: shadeAt(x, y) });
        }
        if (def?.prop === 'bridge') {
          // along the road: east-west unless the road runs north-south
          const road = (tx: number, ty: number) => ['road', 'bridge'].includes(terrainAt(tx, ty));
          const ns = Number(road(x, y - 1)) + Number(road(x, y + 1));
          const ew = Number(road(x - 1, y)) + Number(road(x + 1, y));
          put('bridge_idle', { x: x + 0.5, z: -y - 0.5, h: Math.max(this.groundAt(x + 0.5, y + 0.5), water), rot: ns > ew ? Math.PI / 2 : 0, scale: sc.bridgeScale, shade: shadeAt(x, y) });
          continue;
        }
        // the peaks are the terrain now; rocks only where the grid has them outside the mountains
        if (!def?.prop && bushes.length && def?.id === 'grass') {
          // a few bushes on open grass, away from roads and places
          const b = hash3(x, y, seed + 17);
          const bh = this.groundAt(x + 0.5, y + 0.5);
          if (b % 12 === 0 && bh >= water + 0.05 && !nearPlace(x, y, 1))
            put(`bush_${bushes[(b >>> 8) % bushes.length]}`, { x: x + 0.5 + (((b >>> 12) % 5) - 2) * 0.06, z: -y - 0.5, h: bh, rot: ((b >>> 16) % 360) * (Math.PI / 180), scale: 0.8 + ((b >>> 4) % 21) / 100, shade: layout.fog[y * layout.width + x] ? 0.8 : 1 });
        }
        if (!def?.prop && !taken.has(y * W + x) && open && layout.region[y * W + x] === sc.rural.region) {
          // sparse small rocks in the borderland
          const k = hash3(x, y, seed + 53);
          const kh = this.groundAt(x + 0.5, y + 0.5);
          if ((k & 0xffff) / 0x10000 < sc.rural.rocks && kh >= water + 0.05 && !nearPlace(x, y, sc.rural.clearance))
            put(sc.rural.rocksModel, { x: x + 0.5 + (((k >>> 16) % 5) - 2) * 0.08, z: -y - 0.5 + (((k >>> 20) % 5) - 2) * 0.08, h: kh, rot: ((k >>> 8) % 360) * (Math.PI / 180), scale: 0.8 + ((k >>> 4) % 31) / 100, shade: shadeAt(x, y) });
        }
        if (!def?.prop || def.prop === 'rock') continue;
        const r = hash3(x, y, seed + 5);
        const h = this.groundAt(x + 0.5, y + 0.5);
        if (h < water + 0.05) continue; // the outer tiles of the map may lie in the sea
        const base: PropPlace = { x: x + 0.5, z: -y - 0.5, h, rot: Math.PI, scale: 1, shade: layout.fog[y * layout.width + x] ? 0.8 : 1 };
        const mix = sc.trees[layout.region[y * W + x] ?? ''];
        if (def.prop === 'tree' && mix) {
          // weighted pick from the region's tree set (autumn in Eisenmark, snow firs in Aurenhall)
          const pick = pickWeighted(mix, ((r >>> 20) % 1000) / 1000);
          put(pick.model, { ...base, rot: ((r >>> 4) % 360) * (Math.PI / 180), scale: 0.88 + ((r >>> 12) % 25) / 100 });
        } else if (def.prop === 'tree') put(`tree_${trees[r % trees.length]}`, { ...base, rot: ((r >>> 4) % 360) * (Math.PI / 180), scale: 0.88 + ((r >>> 12) % 25) / 100 });
        else if (def.prop === 'rock' || def.prop === 'rockwall') put('rock_idle', { ...base, rot: ((r >>> 4) % 4) * (Math.PI / 2), scale: 1.05 });
        else put(PROP_STATE[def.prop] ?? `${def.prop}_idle`, { ...base, rot: Math.PI + (((r >>> 4) % 3) - 1) * 0.4 });
      }
    for (const loc of world.locations) {
      const parts = world.miniatures[locationModel(loc, ctx)] ?? [];
      const [lx, ly] = loc.at;
      for (const part of parts)
        put(part.prop, {
          x: lx + 0.5 + part.at[0],
          z: -(ly + 0.5 + part.at[1]),
          h: this.groundAt(lx + 0.5 + part.at[0], ly + 0.5 + part.at[1]),
          rot: Math.PI + (part.rot * Math.PI) / 180,
          scale: conf.miniatureScale * part.scale,
        });
    }
    return groups;
  }

  /** Fields and fences around the decorative villages of the rural region; returns the tiles taken by fields. */
  private ruralProps(
    seed: number,
    put: (key: string, p: PropPlace) => void,
    terrainAt: (x: number, y: number) => string,
    nearPlace: (x: number, y: number, d: number) => boolean,
    shadeAt: (x: number, y: number) => number,
  ): Set<number> {
    const layout = this.layout!;
    const W = layout.width;
    const rural = this.data.render.world.scenery.rural;
    const water = this.data.render.board.waterLevel;
    const taken = new Set<number>();
    const eligible = (x: number, y: number) =>
      ['grass', 'plain'].includes(terrainAt(x, y)) && layout.region[y * W + x] === rural.region && !taken.has(y * W + x) && !nearPlace(x, y, rural.clearance) && this.groundAt(x + 0.5, y + 0.5) >= water + 0.05;
    for (let vy = 0; vy < layout.height; vy++)
      for (let vx = 0; vx < W; vx++) {
        if (terrainAt(vx, vy) !== 'village' || layout.region[vy * W + vx] !== rural.region) continue;
        const cands: Array<[number, number, number]> = [];
        for (let dy = -rural.radius; dy <= rural.radius; dy++)
          for (let dx = -rural.radius; dx <= rural.radius; dx++) if (eligible(vx + dx, vy + dy)) cands.push([vx + dx, vy + dy, hash3(vx + dx, vy + dy, seed + 31)]);
        cands.sort((a, b) => a[2] - b[2]);
        const [lo, hi] = rural.fields;
        const fields = cands.slice(0, Math.min(cands.length, lo + (hash3(vx, vy, seed + 37) % (hi - lo + 1))));
        for (const [fx, fy] of fields) taken.add(fy * W + fx);
        for (const [fx, fy, f] of fields) {
          put(rural.fieldModel, { x: fx + 0.5, z: -fy - 0.5, h: this.groundAt(fx + 0.5, fy + 0.5), rot: ((f >>> 8) % 4) * (Math.PI / 2), scale: 1, shade: shadeAt(fx, fy) });
          // a fence on some sides along the field's edge; corners where two sides meet, some pieces broken
          const present = [0, 1, 2, 3].map((i) => (hash3(fx, fy, seed + 43 + i) & 0xffff) / 0x10000 < rural.fenceChance);
          const broken = [0, 1, 2, 3].map((i) => (hash3(fx, fy, seed + 51 + i) & 0xffff) / 0x10000 < rural.brokenChance);
          for (const piece of planFence(present, broken)) {
            const ex = fx + 0.5 + piece.dx;
            const ey = fy + 0.5 - piece.dz;
            const model = piece.kind === 'corner' ? rural.cornerModel : piece.kind === 'broken' ? rural.brokenModel : rural.fenceModel;
            // a broken piece sometimes faces the other way, so its leaning end is not always on the same side
            const turn = piece.kind === 'broken' && (hash3(Math.round(ex * 4), Math.round(ey * 4), seed + 59) & 0x100) !== 0 ? Math.PI : 0;
            put(model, { x: ex, z: -ey, h: this.groundAt(ex, ey), rot: piece.rot + turn, scale: 1, stretch: piece.stretch, shade: shadeAt(fx, fy) });
          }
        }
      }
    return taken;
  }

  /** Fog over the regions of later acts: a sheet above the ground, its edge fading over one tile (DESIGN.md fog). */
  private buildFog(): void {
    const layout = this.layout!;
    const fog = this.data.render.world.fog;
    const s = this.data.render.world.skirt.width;
    const corners = fogCorners(layout, s);
    const w = layout.width + 2 * s + 1;
    const positions: number[] = [];
    const colors: number[] = [];
    const c = Color3.FromHexString(fog.color);
    const sea = this.data.render.board.waterLevel;
    corners.forEach((a, i) => {
      const x = (i % w) - s;
      const y = Math.floor(i / w) - s;
      positions.push(x, Math.max(this.groundAt(x, y), sea) + fog.height, -y);
      // a little cloud texture in the density, so the sheet does not look like a flat lid
      const n = 0.86 + ((hash3(x, y, 91) & 0xff) / 255) * 0.14;
      colors.push(c.r, c.g, c.b, Math.min(1, a * n) * fog.alpha);
    });
    const indices: number[] = [];
    for (let y = 0; y < layout.height + 2 * s; y++)
      for (let x = 0; x < layout.width + 2 * s; x++) {
        const i = y * w + x;
        if (corners[i]! + corners[i + 1]! + corners[i + w]! + corners[i + w + 1]! === 0) continue;
        indices.push(i, i + 1, i + w + 1, i, i + w + 1, i + w);
      }
    if (!indices.length) return;
    const mesh = new Mesh('world:fog', this.scene);
    const vd = new VertexData();
    vd.positions = positions;
    vd.indices = indices;
    vd.colors = colors;
    vd.normals = positions.map((_, k) => (k % 3 === 1 ? 1 : 0));
    vd.applyToMesh(mesh);
    mesh.hasVertexAlpha = true;
    const mat = new StandardMaterial('world:fog', this.scene);
    mat.disableLighting = true;
    mat.emissiveColor = Color3.White();
    mat.backFaceCulling = false;
    mat.disableDepthWrite = true;
    mat.alpha = 0.999; // blended: the vertex alpha carries the density
    mesh.material = mat;
    mesh.isPickable = false;
  }

  /** Falling ash over the ash fields of the dragon sign of act 1 (none on the low level). */
  private buildAsh(act: number): void {
    const count = this.data.render.world.ash[this.quality];
    const areas = this.data.world.signs.filter((s) => s.act <= act && s.kind === 'ash').flatMap((s) => s.areas);
    if (!count || !areas.length) return;
    const x0 = Math.min(...areas.map((a) => a[0]));
    const y0 = Math.min(...areas.map((a) => a[1]));
    const x1 = Math.max(...areas.map((a) => a[0] + a[2]));
    const y1 = Math.max(...areas.map((a) => a[1] + a[3]));
    const flake = new DynamicTexture('world:ash', { width: 16, height: 16 }, this.scene, false);
    const g = flake.getContext() as CanvasRenderingContext2D;
    const grd = g.createRadialGradient(8, 8, 0, 8, 8, 8);
    grd.addColorStop(0, 'rgba(235,232,228,1)');
    grd.addColorStop(1, 'rgba(120,116,112,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 16, 16);
    flake.update(true);
    flake.hasAlpha = true;
    const ps = new ParticleSystem('world:ash', count, this.scene);
    ps.particleTexture = flake;
    ps.emitter = new Vector3((x0 + x1) / 2, 3.2, -(y0 + y1) / 2);
    ps.minEmitBox = new Vector3(-(x1 - x0) / 2, 0, -(y1 - y0) / 2);
    ps.maxEmitBox = new Vector3((x1 - x0) / 2, 0.6, (y1 - y0) / 2);
    ps.color1 = new Color4(0.85, 0.83, 0.8, 0.9);
    ps.color2 = new Color4(0.55, 0.53, 0.52, 0.8);
    ps.colorDead = new Color4(0.4, 0.4, 0.4, 0);
    ps.minSize = 0.05;
    ps.maxSize = 0.12;
    ps.minLifeTime = 3.5;
    ps.maxLifeTime = 6;
    ps.emitRate = count / 5;
    ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    ps.gravity = new Vector3(0.12, -0.35, 0);
    ps.direction1 = new Vector3(-0.15, -0.2, -0.1);
    ps.direction2 = new Vector3(0.2, -0.05, 0.1);
    ps.minEmitPower = 0.1;
    ps.maxEmitPower = 0.3;
    ps.minAngularSpeed = -1;
    ps.maxAngularSpeed = 1;
    ps.preWarmCycles = 60;
    ps.start();
    this.ash = ps;
  }

  /** Names of the fogged regions with their place in tiles. */
  regionLabels(): Array<{ id: string; at: [number, number]; h: number }> {
    if (!this.layout) return [];
    return fogLabels(this.data.world, this.layout).map((l) => ({ ...l, h: this.groundAt(l.at[0], l.at[1]) + this.data.render.world.fog.height }));
  }

  /** Height of the ground at tile point (x, y) (tile units, a tile's centre = +0.5). */
  groundAt(x: number, y: number): number {
    return this.height?.(x, y) ?? 0;
  }

  // ------------------------------------------------------------------ camera

  private cssSize(): { w: number; h: number } {
    const r = this.host.canvas.getBoundingClientRect();
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
  }

  private tilt(): number {
    return (this.data.render.world.tiltDeg * Math.PI) / 180;
  }

  private pptFor(step: number, close = false): number {
    const { w, h } = this.cssSize();
    const steps = this.data.render.world.zoomSteps;
    const base = Math.min(w, h) / steps[Math.max(0, Math.min(steps.length - 1, step))]!;
    return close ? base * this.data.render.world.focusZoom : base;
  }

  /** Land continues east and north into the skirt, the sea lies south and west: the view never leaves the land's edge. */
  private landEdge(axis: number, view: number): number {
    return this.data.render.world.skirt.width + axis - view / 2;
  }

  private clampX(x: number, ppt = this.ppt): number {
    const view = this.cssSize().w / ppt;
    return Math.min(clampAxis(x, view, 0, 0, this.size.w, CLAMP_MARGIN), Math.max(view / 2 - this.data.render.world.skirt.width, this.landEdge(this.size.w, view)));
  }

  private clampY(y: number, ppt = this.ppt): number {
    const view = this.cssSize().h / ppt / Math.cos(this.tilt());
    // north = small y: the top of the view stays on the skirt
    return Math.max(clampAxis(y, view, 0, 0, this.size.h, CLAMP_MARGIN), view / 2 - this.data.render.world.skirt.width);
  }

  private fitCamera(): void {
    this.step = 1;
    this.ppt = this.pptFor(this.step);
    this.camX = this.clampX(this.size.w / 2);
    this.camY = this.clampY(this.size.h / 2);
  }

  /** Camera centre that shows tile point (x, y) at height h horizontally centred and at share `restY` of the height. */
  private centreFor(x: number, y: number, h: number, restY: number, ppt: number): [number, number] {
    const t = this.tilt();
    const { h: sh } = this.cssSize();
    const cy = y + ((sh * (0.5 - restY)) / ppt - h * Math.sin(t)) / Math.cos(t);
    return [this.clampX(x, ppt), this.clampY(cy, ppt)];
  }

  /**
   * Brings tile point (x, y) (tile units, a tile's centre = +0.5) to the horizontal middle and `restY` of the height;
   * `close` goes a little nearer (a chosen place) and back.
   */
  focus(x: number, y: number, restY: number, opts: { close?: boolean; smooth?: boolean } = {}): void {
    this.close = !!opts.close;
    const ppt = this.pptFor(this.step, this.close);
    const [cx, cy] = this.centreFor(x, y, this.groundAt(x, y), restY, ppt);
    this.moveTo(cx, cy, ppt, opts.smooth !== false);
  }

  /** Leaves the chosen place: back to the zoom step, the view stays where it is. */
  release(): void {
    if (!this.close) return;
    this.close = false;
    const ppt = this.pptFor(this.step);
    this.moveTo(this.clampX(this.camX, ppt), this.clampY(this.camY, ppt), ppt, true);
  }

  private moveTo(x: number, y: number, ppt: number, smooth: boolean): void {
    if (!smooth) {
      this.tween = null;
      [this.camX, this.camY, this.ppt] = [x, y, ppt];
      this.wake();
      return;
    }
    this.tween = { from: [this.camX, this.camY, this.ppt], to: [x, y, ppt], start: performance.now(), ms: this.data.render.world.zoomMs };
    this.wake();
  }

  /** Moves the view with the finger (CSS px). */
  pan(dxCss: number, dyCss: number): void {
    this.tween = null;
    this.camX = this.clampX(this.camX - dxCss / this.ppt);
    this.camY = this.clampY(this.camY - dyCss / this.ppt / Math.cos(this.tilt()));
    this.wake();
  }

  /** Switches between the two zoom steps: +1 = nearer. The point at the screen centre stays. */
  zoom(delta: number): void {
    const steps = this.data.render.world.zoomSteps.length;
    const next = Math.max(0, Math.min(steps - 1, this.step - Math.sign(delta)));
    if (next === this.step) return;
    this.step = next;
    const ppt = this.pptFor(next, this.close);
    this.moveTo(this.clampX(this.camX, ppt), this.clampY(this.camY, ppt), ppt, true);
  }

  /** Zoom step: 0 near, 1 overview. */
  get zoomStep(): number {
    return this.step;
  }

  /** Tile point (x east, y south, in tiles) at height h → CSS px relative to the canvas. */
  screenOf(x: number, y: number, h = 0): { x: number; y: number } {
    const { w, h: sh } = this.cssSize();
    const t = this.tilt();
    const rx = x - this.camX;
    const rz = -y + this.camY;
    return { x: w / 2 + rx * this.ppt, y: sh / 2 - (h * Math.sin(t) + rz * Math.cos(t)) * this.ppt };
  }

  private updateCamera(now: number): void {
    if (this.tween) {
      const k = Math.min(1, (now - this.tween.start) / Math.max(1, this.tween.ms));
      const e = 1 - Math.pow(1 - k, 3);
      const [fx, fy, fp] = this.tween.from;
      const [tx, ty, tp] = this.tween.to;
      this.camX = fx + (tx - fx) * e;
      this.camY = fy + (ty - fy) * e;
      this.ppt = fp + (tp - fp) * e;
      if (k >= 1) this.tween = null;
    }
    const { w, h } = this.cssSize();
    const t = this.tilt();
    const forward = new Vector3(0, -Math.cos(t), Math.sin(t));
    const target = new Vector3(this.camX, 0, -this.camY);
    this.camera.position.copyFrom(target.subtract(forward.scale(60)));
    this.camera.setTarget(target);
    this.camera.orthoLeft = -w / 2 / this.ppt;
    this.camera.orthoRight = w / 2 / this.ppt;
    this.camera.orthoTop = h / 2 / this.ppt;
    this.camera.orthoBottom = -h / 2 / this.ppt;
  }

  private wake(ms = 600): void {
    this.activeUntil = Math.max(this.activeUntil, performance.now() + ms);
  }

  // ------------------------------------------------------------------ host

  busy(now: number): boolean {
    return this.tween !== null || now < this.activeUntil;
  }

  frame(now: number): void {
    if (this.disposed) return;
    this.updateCamera(now);
    if (this.water) {
      // the waves drift slowly (tiles per second → texture repeats) and sway a little across, so they do not slide like a belt
      const { bump, drift, scale } = this.water;
      const sec = now / 1000;
      bump.uOffset = (drift[0] * sec) / scale;
      bump.vOffset = (drift[1] * sec) / scale + 0.012 * Math.sin(sec * 0.35);
    }
    this.scene.render();
    this.hooks.onFrame?.();
  }

  resize(): void {
    this.ppt = this.pptFor(this.step, this.close);
    this.camX = this.clampX(this.camX);
    this.camY = this.clampY(this.camY);
    this.wake();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.ash = null;
    this.host.release(this);
  }
}
