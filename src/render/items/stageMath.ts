/**
 * Story 16.14: the pure part of the item stage (no Babylon, no DOM): the turntable's motion (drag, fling, damping, auto spin,
 * reset), the fit distance of the camera and the angle that stands a model's long axis up. All numbers come from
 * `render.yaml` `itemStage` (`ItemStageDef`).
 */
import type { ItemStageDef } from '../../core/renderDefs';

const RAD = Math.PI / 180;
const TAU = Math.PI * 2;

/** `a` moved to the nearest equivalent of `b` (so a reset turns the short way round). */
function nearest(a: number, b: number): number {
  return b + ((((a - b + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
}

/**
 * The turntable: yaw and pitch of the model. It spins slowly until the player first drags; a release keeps the swing and lets
 * it die out by damping; a reset glides back to the start pose. `busy()` is false at rest (the stage then draws at the idle rate).
 */
export class StageMotion {
  yaw: number;
  pitch: number;
  private startYaw: number;
  private startPitch: number;
  /** swing in rad per second (yaw, pitch) */
  private vYaw = 0;
  private vPitch = 0;
  private spinning: boolean;
  private dragging = false;
  private last: { t: number; dx: number; dy: number } | null = null;
  private glide: { fromYaw: number; fromPitch: number; t: number } | null = null;

  constructor(
    private def: ItemStageDef,
    yawDeg: number,
  ) {
    this.startYaw = yawDeg * RAD;
    this.startPitch = def.startPitchDeg * RAD;
    this.yaw = this.startYaw;
    this.pitch = this.startPitch;
    this.spinning = def.spinDegPerSec > 0;
  }

  /** The player holds the model: the auto spin ends for good, a running reset stops. */
  press(): void {
    this.dragging = true;
    this.spinning = false;
    this.glide = null;
    this.vYaw = 0;
    this.vPitch = 0;
    this.last = null;
  }

  /** A drag of `dx`, `dy` pixels over `dtMs` since the last move. */
  drag(dx: number, dy: number, dtMs: number): void {
    if (!this.dragging) return;
    const k = this.def.dragDegPerPx * RAD;
    this.yaw += dx * k;
    this.pitch = this.clampPitch(this.pitch + dy * k);
    if (dtMs > 0) this.last = { t: dtMs, dx: dx * k, dy: dy * k };
  }

  /** Let go: the swing of the last move goes on and dies out. */
  release(): void {
    if (!this.dragging) return;
    this.dragging = false;
    const l = this.last;
    if (l && l.t > 0 && l.t < 120) {
      this.vYaw = (l.dx / l.t) * 1000;
      this.vPitch = (l.dy / l.t) * 1000;
    }
    this.last = null;
  }

  /** Back to the start pose (double tap); the spin stays off. */
  reset(): void {
    this.dragging = false;
    this.vYaw = 0;
    this.vPitch = 0;
    this.glide = { fromYaw: this.yaw, fromPitch: this.pitch, t: 0 };
  }

  private clampPitch(p: number): number {
    const lim = this.def.tiltLimitDeg * RAD;
    return Math.max(-lim, Math.min(lim, p));
  }

  /** Advances by `dt` seconds. */
  step(dt: number): void {
    if (this.dragging) return;
    if (this.glide) {
      const g = this.glide;
      g.t += dt * 1000;
      const k = this.def.resetMs <= 0 ? 1 : Math.min(1, g.t / this.def.resetMs);
      const e = 1 - (1 - k) * (1 - k); // ease out
      const toYaw = nearest(this.startYaw, g.fromYaw);
      this.yaw = g.fromYaw + (toYaw - g.fromYaw) * e;
      this.pitch = g.fromPitch + (this.startPitch - g.fromPitch) * e;
      if (k >= 1) this.glide = null;
      return;
    }
    if (this.spinning) this.yaw += this.def.spinDegPerSec * RAD * dt;
    if (this.vYaw !== 0 || this.vPitch !== 0) {
      this.yaw += this.vYaw * dt;
      this.pitch = this.clampPitch(this.pitch + this.vPitch * dt);
      const f = Math.exp(-this.def.dampingPerSec * dt);
      this.vYaw *= f;
      this.vPitch *= f;
      const rest = this.def.restDegPerSec * RAD;
      if (Math.hypot(this.vYaw, this.vPitch) < rest) this.vYaw = this.vPitch = 0;
    }
  }

  /** Does anything move (input, swing, glide, spin)? */
  busy(): boolean {
    return this.dragging || this.spinning || !!this.glide || this.vYaw !== 0 || this.vPitch !== 0;
  }
}

/** Distance of a camera that fits a sphere of `radius` into the narrower of the two fields of view, times `margin`. */
export function fitDistance(radius: number, fovDeg: number, aspect: number, margin: number): number {
  const v = fovDeg * RAD;
  const h = 2 * Math.atan(Math.tan(v / 2) * Math.max(0.1, aspect));
  const eff = Math.min(v, h);
  return (radius / Math.sin(eff / 2)) * margin;
}

/**
 * The rotation about the X axis (rad) that stands the long axis of a point cloud, given as (y, z) pairs, up (+Y), with the longer
 * end on top. A model built in a tilted grip (the lance) stands upright on the stage with it; 0 for a cloud without a clear axis.
 */
export function uprightAngle(yz: ArrayLike<number>): number {
  const n = Math.floor(yz.length / 2);
  if (n < 3) return 0;
  let my = 0;
  let mz = 0;
  for (let i = 0; i < n; i++) {
    my += yz[2 * i]!;
    mz += yz[2 * i + 1]!;
  }
  my /= n;
  mz /= n;
  let syy = 0;
  let szz = 0;
  let syz = 0;
  for (let i = 0; i < n; i++) {
    const y = yz[2 * i]! - my;
    const z = yz[2 * i + 1]! - mz;
    syy += y * y;
    szz += z * z;
    syz += y * z;
  }
  // principal axis: angle `a` from +Y towards +Z
  const a = 0.5 * Math.atan2(2 * syz, syy - szz);
  // the longer end up: project the cloud on the axis and compare the two reaches
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < n; i++) {
    const p = (yz[2 * i]! - my) * Math.cos(a) + (yz[2 * i + 1]! - mz) * Math.sin(a);
    lo = Math.min(lo, p);
    hi = Math.max(hi, p);
  }
  const axis = hi >= -lo ? a : a + Math.PI;
  // rotating by `angle` about X takes (cos axis, sin axis) in (y, z) to (1, 0): the angle is -axis (in the (y, z) plane)
  const angle = -axis;
  return Math.abs(angle) < 1e-3 ? 0 : angle;
}
