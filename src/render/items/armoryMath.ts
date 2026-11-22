/**
 * Story 16.18: the pure part of the armoury's turntable (no Babylon, no DOM): the wheel that a swipe turns and that snaps onto
 * a stand, where each stand sits, which stand is in front and which name plates show. Numbers come from `render.yaml` `armory`
 * (`ArmoryDef`); the fit of the camera is `fitDistance` of `stageMath.ts`.
 */
import type { ArmoryDef } from '../../core/renderDefs';

const RAD = Math.PI / 180;
const TAU = Math.PI * 2;

/** `i` wrapped into 0..n-1. */
export const wrapIndex = (i: number, n: number): number => (n <= 0 ? 0 : ((i % n) + n) % n);

/** Circular distance between two stand indices on a wheel of `n` stands. */
export function ringDistance(a: number, b: number, n: number): number {
  const d = Math.abs(wrapIndex(a, n) - wrapIndex(b, n));
  return Math.min(d, n - d);
}

/** Angle (rad) of stand `i` on a wheel turned by `rot`: 0 is the front (towards the camera). */
export const standAngle = (i: number, n: number, rot: number): number => (n <= 0 ? 0 : (i / n) * TAU + rot);

/** Position of stand `i` on the wheel (x to the right, z away from the camera, front at z = -radius). */
export function standPosition(i: number, n: number, rot: number, radius: number): { x: number; z: number } {
  if (n <= 1) return { x: 0, z: -radius };
  const a = standAngle(i, n, rot);
  return { x: Math.sin(a) * radius, z: -Math.cos(a) * radius };
}

/** The stand in front for a wheel turned by `rot`. */
export function frontIndex(rot: number, n: number): number {
  return n <= 1 ? 0 : wrapIndex(Math.round((-rot / TAU) * n), n);
}

/** The wheel angle that puts stand `i` in front, nearest to `from` (so the wheel turns the short way round). */
export function rotFor(i: number, n: number, from: number): number {
  if (n <= 1) return 0;
  const target = -(i / n) * TAU;
  return target + Math.round((from - target) / TAU) * TAU;
}

/** Whether the plate of stand `i` shows: the front stand and `reach` neighbours each side. */
export const plateVisible = (i: number, front: number, n: number, reach: number): boolean => ringDistance(i, front, n) <= reach;

/**
 * The wheel: a swipe turns it, a release flings on a little and snaps onto a stand over `snapMs`. `front()` follows the turn, so
 * the plate of the new front stand shows while the wheel still runs. `busy()` is false at rest (the view then draws at the idle rate).
 */
export class Carousel {
  rot = 0;
  private n: number;
  private dragging = false;
  private last: { t: number; dr: number } | null = null;
  private glide: { from: number; to: number; t: number } | null = null;

  constructor(
    private def: Pick<ArmoryDef, 'dragDegPerPx' | 'flingSeconds' | 'snapMs'>,
    count: number,
    front = 0,
  ) {
    this.n = count;
    this.rot = rotFor(front, count, 0);
  }

  count(): number {
    return this.n;
  }

  /** New number of stands; the wheel keeps its front stand where it can. */
  setCount(count: number, front = this.front()): void {
    this.n = count;
    this.rot = rotFor(Math.min(front, Math.max(0, count - 1)), count, 0);
    this.glide = null;
  }

  press(): void {
    this.dragging = true;
    this.glide = null;
    this.last = null;
  }

  /** A swipe of `dx` pixels over `dtMs` since the last move. */
  drag(dx: number, dtMs: number): void {
    if (!this.dragging || this.n <= 1) return;
    const dr = dx * this.def.dragDegPerPx * RAD;
    this.rot += dr;
    if (dtMs > 0) this.last = { t: dtMs, dr };
  }

  /** Let go: the swing of the last move goes on a little (`flingSeconds`), then the wheel snaps onto a stand. */
  release(): void {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.n <= 1) return;
    const l = this.last;
    const fling = l && l.t > 0 && l.t < 120 ? (l.dr / l.t) * 1000 * this.def.flingSeconds : 0;
    this.last = null;
    this.snapTo(frontIndex(this.rot + fling, this.n));
  }

  /** Glides onto stand `i` (over `snapMs`). */
  snapTo(i: number): void {
    if (this.n <= 1) return;
    this.glide = { from: this.rot, to: rotFor(wrapIndex(i, this.n), this.n, this.rot), t: 0 };
  }

  front(): number {
    return frontIndex(this.rot, this.n);
  }

  step(dt: number): void {
    const g = this.glide;
    if (!g || this.dragging) return;
    g.t += dt * 1000;
    const k = this.def.snapMs <= 0 ? 1 : Math.min(1, g.t / this.def.snapMs);
    const e = 1 - (1 - k) * (1 - k) * (1 - k); // ease out
    this.rot = g.from + (g.to - g.from) * e;
    if (k >= 1) {
      this.rot = g.to;
      this.glide = null;
    }
  }

  busy(): boolean {
    return this.dragging || !!this.glide;
  }
}
