/**
 * Board marks of a lieutenant (story 3.1, DESIGN.md "Groll-Wimpel" and "Medaillon"): the double ground ring with a gold
 * edge, the grudge pennant with 0-3 notches over the head and the thin line to the grudge target.
 */
import type { Scene } from '@babylonjs/core/scene';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import './pennant.css';

/** Highest grudge step (GDD: three steps). */
export const GRUDGE_MAX = 3;

/** Gold of the lieutenant ring and the line (DESIGN.md `gold`). */
const GOLD = '#d9a931';

/** Notches on the pennant for a grudge value: whole numbers from 0 to 3, anything else counts as 0 or 3. */
export function pennantNotches(grudge: number | undefined): number {
  if (grudge === undefined || !Number.isFinite(grudge)) return 0;
  return Math.min(GRUDGE_MAX, Math.max(0, Math.floor(grudge)));
}

/** The pennant element over a lieutenant: one white bar per notch (the shape carries the meaning, not only the colour). */
export function makePennant(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'hc-pennant';
  el.setAttribute('aria-hidden', 'true');
  return el;
}

/** Sets the notches of a pennant element; rebuilds the bars only when the count changes. */
export function setPennantNotches(el: HTMLElement, notches: number): void {
  if (el.dataset.notches === String(notches) && el.childElementCount === notches) return;
  el.dataset.notches = String(notches);
  el.replaceChildren(...Array.from({ length: notches }, () => document.createElement('i')));
}

/**
 * The gold edge of a lieutenant's ground ring: a slim outer ring and a slim inner ring around the team-coloured disc
 * (the double ring), merged into one mesh so the board moves a single node.
 */
export function makeGoldRing(scene: Scene, uid: string): Mesh {
  const outer = CreateTorus(`gold:${uid}`, { diameter: 0.8, thickness: 0.05, tessellation: 40 }, scene);
  outer.isPickable = false;
  const inner = CreateTorus(`gold-in:${uid}`, { diameter: 0.6, thickness: 0.03, tessellation: 40 }, scene);
  inner.isPickable = false;
  inner.parent = outer;
  const m = new StandardMaterial(`gold:${uid}`, scene);
  m.disableLighting = true;
  m.emissiveColor = Color3.FromHexString(GOLD);
  outer.material = m;
  inner.material = m;
  return outer;
}

/** Disposes the ring mesh with its child and its material. */
export function disposeGoldRing(ring: Mesh): void {
  ring.material?.dispose();
  ring.getChildMeshes().forEach((c) => c.dispose());
  ring.dispose();
}

/** Radius of the line to the grudge target in tiles (about 2 px at the usual zoom): thin, but visible on the road. */
const LINE_RADIUS = 0.028;

/** The line from a lieutenant to his grudge target (a thin gold tube between two points, updated in place each frame). */
export class GrudgeLine {
  private mesh: Mesh | null = null;
  private material: StandardMaterial | null = null;
  /** end points of the last update: the tube is only rebuilt when a figure moved */
  private last = '';

  constructor(private readonly scene: Scene) {}

  /** Draws the line between two points, or hides it for `null`. */
  set(from: Vector3 | null, to: Vector3 | null): void {
    if (!from || !to) return this.clear();
    const key = `${from.x},${from.y},${from.z},${to.x},${to.y},${to.z}`;
    if (this.mesh && key === this.last) return;
    this.last = key;
    if (this.mesh) {
      this.mesh = CreateTube('grudge-line', { path: [from, to], radius: LINE_RADIUS, instance: this.mesh });
      return;
    }
    const tube = CreateTube('grudge-line', { path: [from, to], radius: LINE_RADIUS, tessellation: 6, updatable: true }, this.scene);
    const m = new StandardMaterial('grudge-line', this.scene);
    m.disableLighting = true;
    m.emissiveColor = Color3.FromHexString(GOLD);
    tube.material = m;
    tube.isPickable = false;
    tube.alwaysSelectAsActiveMesh = true;
    this.material = m;
    this.mesh = tube;
  }

  get shown(): boolean {
    return this.mesh !== null;
  }

  clear(): void {
    this.mesh?.dispose();
    this.material?.dispose();
    this.mesh = null;
    this.material = null;
    this.last = '';
  }
}
