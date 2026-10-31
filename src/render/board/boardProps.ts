/**
 * Terrain, props with their see-through twins (story 8.10), static-material freezing and fires of the battle board.
 * Part of the class chain BoardBase → BoardSetup → BoardProps → BoardUnits → BoardCamera → BoardFrame → BoardView.
 */
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { loadManifest } from '../shared/assets';
import { buildTerrain, hash3 } from '../shared/terrain3d';
import { loadPropMesh } from '../shared/models';
import { variantClassOf, variantList } from '../../content/propVariants';
import { isPackRegistered } from '../../content/browser';
import { modelAvailable, pickVariant, withState } from '../shared/scenery';
import { fadeRule, hidesFigure } from './fade';
import { isStaticMaterial } from './staticMaterial';
import { type PropSet, MAX_FIRES, FREEZE_FRAMES } from './boardBase';
import { BoardSetup } from './boardSetup';

export abstract class BoardProps extends BoardSetup {
  // ------------------------------------------------------------------ terrain & props

  protected lightsMax(): number {
    return this.data.render.board.lightsMax[this.quality];
  }

  protected async buildTerrain(): Promise<void> {
    this.thawStatic();
    this.terrain?.dispose();
    this.terrain = buildTerrain(this.scene, this.data, this.state, this.textures, this.seed, this.lightsMax());
    this.castShadows(this.terrain.casters);
    this.weather.terrainChanged(this.terrain);
    this.buildGrid();
    await this.buildProps();
    if (!this.disposed) this.buildFires();
  }

  /** The same prop for scenery outside the map: casts no shadow. Own geometry: Babylon keeps thin-instance buffers on the geometry. */
  protected sceneryTemplate(key: string, tpl: Mesh): Mesh {
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

  protected propTemplate(pid: string, state: string): Promise<Mesh | null> {
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
  protected boxProp(pid: string, state: string): Mesh | null {
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

  protected async buildProps(): Promise<void> {
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
  protected thawStatic(): void {
    for (const m of this.frozen) m.unfreeze();
    this.frozen = [];
    this.freezeIn = FREEZE_FRAMES;
  }

  protected freezeStatic(): void {
    this.frozen = this.scene.materials.filter((m) => isStaticMaterial(m.name));
    for (const m of this.frozen) m.freeze();
  }

  /** Height and footprint radius of a template (its vertices are baked with the origin on the ground). */
  protected propSize(tpl: Mesh): { top: number; r: number } {
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
  protected fadeTwin(set: PropSet): Mesh {
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
  protected writeProps(set: PropSet): void {
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
  protected updateFade(): void {
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

  protected buildFires(): void {
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
}
