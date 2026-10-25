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

type Pos = readonly [number, number];

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

/** Flight of a lieutenant at 0 HP (story 3.2): the backward jump, the falling pennant and the fade-out add up to under 600 ms at speed 1. */
export const FLEE_JUMP_MS = 320;
export const FLEE_FADE_MS = 160;

/**
 * The tile the fleeing lieutenant jumps to: one tile straight away from the unit that drove him off (along the longer
 * axis; down the screen when there is none). Stays where he is when that tile lies off the board.
 */
export function fleeTarget(at: Pos, from: Pos | null, width: number, height: number): [number, number] {
  const dx = from ? at[0] - from[0] : 0;
  const dy = from ? at[1] - from[1] : 1;
  const step: [number, number] = Math.abs(dx) >= Math.abs(dy) && dx !== 0 ? [Math.sign(dx), 0] : [0, Math.sign(dy) || 1];
  const to: [number, number] = [at[0] + step[0], at[1] + step[1]];
  return to[0] < 0 || to[1] < 0 || to[0] >= width || to[1] >= height ? [at[0], at[1]] : to;
}

/** Height of the jump's arc in tiles at `t` (0 to 1): a short bow, back on the ground at the end. */
export const fleeArc = (t: number): number => Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * 0.45;

/** Lets the grudge pennant fall (CSS animation of `pennant.css`); `ms` is the duration at the current speed. */
export function dropPennant(el: HTMLElement, ms: number): void {
  el.style.setProperty('--hc-fall', `${Math.round(ms)}ms`);
  el.classList.add('is-falling');
}
