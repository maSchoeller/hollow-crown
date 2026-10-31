/**
 * Time line of a critical hit (story 8.6, art-direction §8, §5.4). Pure: the numbers come from `render.yaml look.fx.crit`.
 *
 *   0 ──────────── hit ── freeze ── recoil ── return ── settle
 *   band in │ hold │ out ┘          star, shake, big number
 *
 * The band slides in and holds while the attack winds up, and slides out from the hit on; at the hit everything stops for the
 * freeze, then the star, the shake and the big number come and the target recoils. At 1× the whole sequence is 550 ms
 * (hit 250 + 80 + 120 + 70 + 30), at most 600 ms. All values are real milliseconds at the given speed.
 */
import type { LookDef } from '../../core/renderDefs';

export type CritFx = LookDef['fx']['crit'];

export interface CritTimeline {
  /** the cut-in band (null: none, in skip mode) */
  cutIn: { inMs: number; holdMs: number; outMs: number } | null;
  /** everything stands still */
  freezeMs: number;
  /** screen shake after the freeze, strength in tiles */
  shakeMs: number;
  shake: number;
  /** the target recoils and its flash fades */
  recoilMs: number;
  /** the attacker steps back */
  returnMs: number;
  settleMs: number;
  /** the damage number is this many times its normal size */
  numberScale: number;
  /** from the start of the attack to the end of the sequence */
  totalMs: number;
}

/**
 * `hitMs`: real time from the start of the attack to the hit (the band's in and hold share it as in render.yaml);
 * `speed`: 1 or 2 (shortens everything after the hit); `skip`: no band, no freeze, no shake.
 */
export function critTimeline(cfg: CritFx, hitMs: number, speed: number, skip: boolean): CritTimeline {
  if (skip) return { cutIn: null, freezeMs: 0, shakeMs: 0, shake: 0, recoilMs: 0, returnMs: 0, settleMs: 0, numberScale: cfg.numberScale, totalMs: 0 };
  const k = 1 / Math.max(1, speed);
  const lead = cfg.cutInInMs + cfg.cutInHoldMs;
  const inMs = lead > 0 ? (hitMs * cfg.cutInInMs) / lead : 0;
  const freezeMs = cfg.freezeMs * k;
  const recoilMs = cfg.recoilMs * k;
  const returnMs = cfg.returnMs * k;
  const settleMs = cfg.settleMs * k;
  return {
    cutIn: { inMs, holdMs: hitMs - inMs, outMs: cfg.cutInOutMs * k },
    freezeMs,
    shakeMs: cfg.shakeMs * k,
    shake: cfg.shake,
    recoilMs,
    returnMs,
    settleMs,
    numberScale: cfg.numberScale,
    totalMs: hitMs + freezeMs + recoilMs + returnMs + settleMs,
  };
}
