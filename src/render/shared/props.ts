/**
 * Props as thin instances (concept/01-decisions.md D12, D17): one hidden template mesh per prop state from the shared
 * cache, every placement one instance, so a whole forest is one draw call. Used by the world map (story 5.2); the board
 * still places its props itself.
 */
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { AssetStore } from '../host';
import { loadPropMesh } from './models';

/** One placement in world space: x east, z north (= −tile y), on height h; rot in radians about the up axis. */
export interface PropPlace {
  x: number;
  z: number;
  h: number;
  rot: number;
  scale: number;
  /** brightness 0–1 (vertex colour of the instance) */
  shade?: number;
}

export class PropLayer {
  private templates = new Map<string, Promise<Mesh | null>>();
  private used: Mesh[] = [];

  constructor(
    private store: AssetStore,
    private material: StandardMaterial,
    private casters: (meshes: Mesh[]) => void,
  ) {}

  /** `key` = `<prop>_<state>` (art/models/props); null when the model is missing. */
  private template(key: string): Promise<Mesh | null> {
    let p = this.templates.get(key);
    if (!p) {
      const i = key.lastIndexOf('_');
      p = loadPropMesh(this.store, key.slice(0, i), key.slice(i + 1), this.material).then((m) => {
        if (m) {
          m.isVisible = false;
          m.alwaysSelectAsActiveMesh = true;
          this.casters([m]);
        }
        return m;
      });
      this.templates.set(key, p);
    }
    return p;
  }

  /** Replaces all placements; keys without a model are skipped and returned (placeholders to list). */
  async place(groups: Map<string, PropPlace[]>): Promise<string[]> {
    for (const m of this.used) {
      m.thinInstanceCount = 0;
      m.isVisible = false;
    }
    this.used = [];
    const missing: string[] = [];
    for (const [key, list] of groups) {
      const tpl = await this.template(key);
      if (!tpl) {
        missing.push(key);
        continue;
      }
      if (tpl.isDisposed()) return missing;
      const mats = new Float32Array(list.length * 16);
      const cols = new Float32Array(list.length * 4);
      list.forEach((p, k) => {
        Matrix.Compose(new Vector3(p.scale, p.scale, p.scale), Quaternion.RotationAxis(Vector3.Up(), p.rot), new Vector3(p.x, p.h, p.z)).copyToArray(mats, k * 16);
        const f = p.shade ?? 1;
        cols.set([f, f, f * 1.06, 1], k * 4);
      });
      tpl.isVisible = true;
      tpl.thinInstanceSetBuffer('matrix', mats, 16, true);
      tpl.thinInstanceSetBuffer('color', cols, 4, true);
      tpl.thinInstanceRefreshBoundingInfo();
      this.used.push(tpl);
    }
    return missing;
  }
}
