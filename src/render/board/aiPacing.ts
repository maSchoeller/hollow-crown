/**
 * How long the board plays an enemy phase (stories 15.10, 15.11): the playback times of `board.ts play()` (`render.yaml aiPace`, `aiPace.play`) and a plan
 * worked out from the events the core produced. The board uses the plan to keep a long enemy phase within the time budget of
 * `render.yaml aiPace.phaseBudgetMs` (it plays such a phase faster, never skips or merges a strike); the campaign simulation
 * (`tools/enemyPhase.ts`) uses the same plan to report the wait per map. Pure: reads events and render values, nothing else, so
 * commands, events and replays are the same with or without it.
 */
import type { GameData, GameEvent } from '../../core';
import { marchRun } from './march';

/** Flight of a lieutenant at 0 HP (story 3.2): the backward jump, the falling pennant and the fade-out add up to under 600 ms at speed 1. */
export const FLEE_JUMP_MS = 320;
export const FLEE_FADE_MS = 160;


/** A unit's turn that only waits (no event of its own follows) is not announced: no glide, no pulse. */
export function announces(events: readonly GameEvent[], n: number): boolean {
  const next = events[n + 1];
  return !(!next || next.t === 'aiTurn' || next.t === 'phase' || next.t === 'exhausted' || next.t === 'battleEnd');
}

/** A foe's or third party's way of `tiles` steps and the pause on its goal. */
export const walkMs = (data: GameData, tiles: number): number =>
  tiles * data.render.aiPace.stepMs + data.render.aiPace.afterMoveMs;

/**
 * The time of event `n` when the board plays it on its own, at speed 1×. Camera glides are counted for every announced turn and
 * reinforcement (the board glides only to tiles out of view), so the plan is an upper bound there; panels that wait for the
 * player (level-up, dialogue) and critical-hit freezes are left out.
 */
export function eventMs(
  data: GameData,
  events: readonly GameEvent[],
  n: number,
  team: (uid: string) => string | undefined,
): number {
  const e = events[n]!;
  const pace = data.render.aiPace;
  const P = pace.play;
  switch (e.t) {
    case 'phase':
      return e.phase === 'player' ? 0 : pace.phaseBannerMs;
    case 'aiTurn':
      return announces(events, n) ? P.glide + pace.focusMs : 0;
    case 'moved':
      if (e.path.length < 2) return 0;
      return team(e.unit) === 'player' ? (e.path.length - 1) * P.ownStep : walkMs(data, e.path.length - 1);
    case 'strike':
      return (
        P.hit +
        P.recoil +
        P.lungeBack +
        (team(e.attacker) === 'player' ? P.playerStrikePause : pace.afterStrikeMs)
      );
    case 'damage':
      return P.damage;
    case 'heal':
      return P.heal;
    case 'downed':
      return P.downed;
    case 'bleed':
      return P.bleed;
    case 'knockback':
      return P.knockback;
    case 'terrain':
      // tiles changing in a row are rebuilt once (board.ts)
      return events[n + 1]?.t === 'terrain' ? 0 : P.terrain;
    case 'rally':
      return P.rally;
    case 'spawned':
      return P.glide + P.spawn;
    case 'fled':
      return FLEE_JUMP_MS + FLEE_FADE_MS;
    case 'died':
      return data.render.look.fx.death.fadeMs;
    case 'retreated':
    case 'rescued':
    case 'escaped':
      return P.vanish;
    default:
      return 0;
  }
}

/**
 * Story 15.11: the clock of an enemy phase played with „Gemeinsam“: when it began (ms, `performance.now()`), the index of the player
 * phase that ends it and the plan at 1× of what is still to come. Waiting for the player (level-up panel, dialogue, flee line) moves
 * `start` on (`pausedFor`), so it does not use up the budget.
 */
export interface PhaseClock {
  start: number;
  end: number;
  leftMs: number;
}

/**
 * The clock after event `n`: started at the first enemy or third-party `phase` when `march` is on (the option is read once, at the
 * start), stopped at the player phase, otherwise its plan brought up to date. Null outside such a phase.
 */
export function phaseClock(
  data: GameData,
  events: readonly GameEvent[],
  n: number,
  march: boolean,
  prev: PhaseClock | null,
  now: number,
  team: (uid: string) => string | undefined,
): PhaseClock | null {
  const e = events[n]!;
  let clock = prev;
  if (e.t === 'phase') {
    if (e.phase === 'player') return null;
    if (!clock && march) clock = { start: now, end: aiSpanEnd(events, n), leftMs: 0 };
  }
  return clock && { ...clock, leftMs: planMs(data, events, n, clock.end, true, team) };
}

/** The clock after `ms` of waiting for the player: that time does not count against the budget. */
export const pausedFor = (clock: PhaseClock | null, ms: number): PhaseClock | null => clock && { ...clock, start: clock.start + ms };

/**
 * What of the tile timers the terrain shows (tile, kind, what it reverts to), not the turns left: the board rebuilds the terrain only
 * when this changes (story 15.11; a rebuild of a 30 × 40 map takes over a second, and a fire's turns change every enemy phase).
 */
export const timerLook = (timers: Readonly<Record<string, { kind: string; revertTo: string }>>): string =>
  Object.entries(timers)
    .map(([k, t]) => `${k}:${t.kind}:${t.revertTo}`)
    .sort()
    .join();

/** The events of the AI phases between two player phases: from the first enemy or third-party `phase` to the next player one. */
export function aiSpanEnd(events: readonly GameEvent[], start: number): number {
  let n = start + 1;
  for (; n < events.length; n++) {
    const e = events[n]!;
    if (e.t === 'phase' && e.phase === 'player') break;
  }
  return n;
}

/**
 * Planned time of `events[start, end)` at speed 1×: `march` false plays every turn one after the other, true plays the turns that
 * only walk together (`marchRun`, option „Gegnerzüge: Gemeinsam“) as the board does.
 */
export function planMs(
  data: GameData,
  events: readonly GameEvent[],
  start: number,
  end: number,
  march: boolean,
  team: (uid: string) => string | undefined,
): number {
  let ms = 0;
  for (let n = start; n < end; n++) {
    const run = march && events[n]!.t === 'aiTurn' ? marchRun(events, n, data.render.aiPace.marchMin) : null;
    if (run && run.end <= end) {
      // the walkers go at the same time: one glide, the longest way sets the time
      ms += data.render.aiPace.play.glide + walkMs(data, Math.max(0, ...run.marches.map((m) => m.path.length - 1)));
      n = run.end - 1;
      continue;
    }
    ms += eventMs(data, events, n, team);
  }
  return ms;
}

/**
 * How much faster than the chosen tempo the rest of a phase, `plannedMs` at 1×, plays so that it ends within the `leftMs` that remain
 * of `aiPace.phaseBudgetMs` (the whole budget at the start): 1 when it fits, at most `aiPace.maxBoost`. The board asks again at every
 * event with the time really gone, so frames slower than the plan (a tween ends on the first frame after its time) are caught up.
 * Strikes stay one by one and in order; the phase only runs faster.
 */
export function phaseBoost(data: GameData, plannedMs: number, speed: number, leftMs = data.render.aiPace.phaseBudgetMs): number {
  const pace = data.render.aiPace;
  const atSpeed = plannedMs / Math.max(1, speed);
  // a phase already over its budget plays the rest as fast as allowed
  return Math.min(pace.maxBoost, Math.max(1, atSpeed / Math.max(1, leftMs)));
}
