/**
 * Story 15.10: how long a player waits through the AI phases of a battle, estimated from the events the core produced and the
 * board's pace (`render.yaml aiPace`, `src/render/board/board.ts play()`). Two figures per phase: "single" plays every turn one
 * after the other, "march" groups the turns that only walk (`marchRun`, option „Gegnerzüge: Gemeinsam“, story 15.11). Tempo 1×,
 * camera glides and level-up panels left out, so it is a lower bound of the real playback (story 15.11 measured it in a browser).
 */
import type { GameData, GameEvent } from '../src/core';
import { marchRun } from '../src/render/board/march';

/** A strike on the board: wind-up to the hit frame (attack_s, 3 frames at 12 fps), lunge back 140 ms and 90 ms, then the pause. */
const STRIKE_MS = 250 + 140 + 90;

export interface PhaseTime {
  turn: number;
  single: number;
  march: number;
}

/** Walks a way of `tiles` steps and pauses on the goal, as the board does for foes and third parties. */
const walkMs = (data: GameData, tiles: number): number => tiles * data.render.aiPace.stepMs + data.render.aiPace.afterMoveMs;

/** The time of one event of an AI turn, when the board plays it alone. */
function eventMs(data: GameData, events: readonly GameEvent[], n: number): number {
  const e = events[n]!;
  const pace = data.render.aiPace;
  if (e.t === 'moved') return e.path.length < 2 ? 0 : walkMs(data, e.path.length - 1);
  if (e.t === 'strike') return STRIKE_MS + pace.afterStrikeMs;
  if (e.t === 'aiTurn') {
    // a unit that only waits is not announced; otherwise it pulses before it moves or strikes
    const next = events[n + 1];
    return !next || next.t === 'aiTurn' || next.t === 'phase' || next.t === 'exhausted' || next.t === 'battleEnd' ? 0 : pace.focusMs;
  }
  return 0;
}

/** Every AI phase (enemy and third party, up to the next player phase) of the event log, in ms at tempo 1×. */
export function aiPhaseTimes(data: GameData, events: readonly GameEvent[]): PhaseTime[] {
  const out: PhaseTime[] = [];
  let cur: PhaseTime | null = null;
  for (let n = 0; n < events.length; n++) {
    const e = events[n]!;
    if (e.t === 'phase') {
      if (e.phase === 'player') cur = null;
      else if (!cur) out.push((cur = { turn: e.turn, single: 0, march: 0 }));
      continue;
    }
    if (!cur) continue;
    cur.single += eventMs(data, events, n);
    if (e.t !== 'aiTurn') {
      cur.march += eventMs(data, events, n);
      continue;
    }
    const run = marchRun(events, n, data.render.aiPace.marchMin);
    if (!run) {
      cur.march += eventMs(data, events, n);
      continue;
    }
    // the walkers of a run go at the same time: the longest way sets the time
    cur.march += walkMs(data, Math.max(...run.marches.map((m) => m.path.length - 1)));
    for (let k = n; k < run.end; k++) cur.single += k === n ? 0 : eventMs(data, events, k);
    n = run.end - 1;
  }
  return out;
}
