/**
 * Story 16.10: the stance of a 3D figure, as pure functions (no Babylon). Which clips of the baked file a figure plays at rest
 * and when it is chosen (`rest_<s>`, `gesture_<s>_*`, `ready_<s>`, `ready_in_<s>`, tools/art/stance_poses.py), and the
 * deterministic plan of its idle gestures. Nothing here uses `Math.random` or the clock: the plan comes from a hash of the
 * figure's name, so screenshots and replays look the same every time.
 */
import type { GearPiece } from '../../core';
import type { VatClip } from './vat';

/** The stance key of a figure: `blade`, `blade_shield`, `bow`, `none` ... */
export function stanceKeyOf(main: Pick<GearPiece, 'stance' | 'stanceMod'> | undefined, off?: Pick<GearPiece, 'stance' | 'stanceMod'>): string {
  // an off-hand piece with a stance of its own (lute, focus book) replaces the weapon's [ASSUMPTION A2]
  const base = off?.stance ?? main?.stance ?? 'none';
  return off?.stanceMod === 'shield' ? `${base}_shield` : base;
}

/** The clips a stance key resolves to in one baked file. */
export interface ResolvedStance {
  /** the key that was found (`blade_shield`, or after the fallback `blade`, `none`); '' = none, the file's `idle` is used */
  key: string;
  rest: VatClip | undefined;
  /** looping calm in the ready stance; absent for `none` */
  ready: VatClip | undefined;
  /** rest -> ready in `board.stance.switchS`; played backwards for the way back */
  readyIn: VatClip | undefined;
  /** the gesture clips (look, shift, regrip) the file has for the key; they start and end on the first row of `rest` */
  gestures: VatClip[];
}

const GESTURES = ['look', 'shift', 'regrip'] as const;

/** `<s>_shield` -> `<s>` -> `none`; the first key with a `rest_<key>` clip wins, else the file's `idle` [ASSUMPTION A3]. */
export function resolveStance(clips: ReadonlyMap<string, VatClip>, key: string): ResolvedStance {
  const tries = [key, key.replace(/_shield$/, ''), 'none'];
  for (const k of tries) {
    const rest = clips.get(`rest_${k}`);
    if (!rest) continue;
    return {
      key: k,
      rest,
      ready: clips.get(`ready_${k}`),
      readyIn: clips.get(`ready_in_${k}`),
      gestures: GESTURES.map((g) => clips.get(`gesture_${k}_${g}`)).filter((c): c is VatClip => !!c),
    };
  }
  return { key: '', rest: clips.get('idle'), ready: undefined, readyIn: undefined, gestures: [] };
}

/** A 32-bit hash of a figure's name. */
export function hashName(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/** A well-mixed 32-bit value of a seed and a counter. */
export function mix(seed: number, n: number): number {
  let h = (seed ^ Math.imul(n + 1, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Start offset (seconds) of a figure's rest loop within one period, so a row of figures does not breathe in step. */
export function startOffset(seed: number, restS: number): number {
  return (mix(seed, 0) / 4294967296) * restS;
}

/**
 * How many rest loops run before the next gesture: one or two, as long as the distance between the starts of two gestures
 * (the previous gesture's length plus the loops) stays inside `everyS`. If neither fits, up to six loops are tried, last the
 * nearest to the middle of the range [ASSUMPTION: the range wins over "1 or 2 loops" when the baked clip lengths disagree].
 */
export function gestureLoops(seed: number, n: number, restS: number, prevGestureS: number, everyS: readonly [number, number]): number {
  const ok = (l: number) => {
    const gap = prevGestureS + l * restS;
    return gap >= everyS[0] - 1e-9 && gap <= everyS[1] + 1e-9;
  };
  let pool = [1, 2].filter(ok);
  if (!pool.length) pool = [1, 2, 3, 4, 5, 6].filter(ok);
  if (!pool.length) return Math.max(1, Math.round(((everyS[0] + everyS[1]) / 2 - prevGestureS) / restS));
  return pool[mix(seed, n * 2 + 1) % pool.length]!;
}

/** What the rest timeline shows at a time: the rest loop (`gesture` -1) or the gesture clip with that index, `local` seconds into it. */
export interface RestFrame {
  gesture: number;
  local: number;
}

/**
 * The deterministic plan of a resting figure: loops of `rest`, then a gesture, then loops again. Ask `at(t)` with a
 * non-decreasing time in seconds; a gesture begins and ends at a rest loop's boundary, so the clips join without a jump.
 */
export class RestTimeline {
  private n = 0;
  private gesture = -1;
  private segStart: number;
  private segEnd = Infinity;
  private prevGestureS = 0;

  constructor(
    private seed: number,
    private restS: number,
    private gestureS: readonly number[],
    private everyS: readonly [number, number],
    offsetS = 0,
  ) {
    this.segStart = -offsetS;
    this.beginRest();
  }

  private beginRest(): void {
    this.gesture = -1;
    this.segEnd = this.gestureS.length ? this.segStart + gestureLoops(this.seed, this.n, this.restS, this.prevGestureS, this.everyS) * this.restS : Infinity;
  }

  at(t: number): RestFrame {
    while (t >= this.segEnd) {
      this.segStart = this.segEnd;
      if (this.gesture < 0) {
        this.gesture = mix(this.seed, this.n * 2 + 2) % this.gestureS.length;
        this.prevGestureS = this.gestureS[this.gesture]!;
        this.segEnd = this.segStart + this.prevGestureS;
      } else {
        this.n++;
        this.beginRest();
      }
    }
    return { gesture: this.gesture, local: t - this.segStart };
  }
}

/** The row of `readyIn` at progress `p` (0 = rest, 1 = ready); the clip plays forwards to ready and backwards to rest. */
export function readyInRow(clip: VatClip, p: number): number {
  return clip.first + Math.round(Math.min(Math.max(p, 0), 1) * (clip.rows - 1));
}
