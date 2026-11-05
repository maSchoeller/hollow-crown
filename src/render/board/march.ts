/**
 * Marching together (story 15.11): on a large map most foes of an enemy phase only walk. Turns that are nothing but a way are
 * played at the same time instead of one after the other; strikes, spells and everything else stay one by one. Pure: it only
 * reads the events the core produced, so commands, events and replays are the same either way.
 */
import type { GameEvent, Pos } from '../../core';

export interface March {
  unit: string;
  path: Pos[];
}

export interface MarchRun {
  /** the ways walked at the same time, in the order of the events */
  marches: March[];
  /** units of the run that end their turn (`exhausted`), walkers and waiters alike */
  exhausted: string[];
  /** index of the first event after the run */
  end: number;
}

/** What may follow a simple turn: the next unit's turn, the next phase, or nothing. Anything else belongs to the turn. */
const isBoundary = (e: GameEvent | undefined): boolean => !e || e.t === 'aiTurn' || e.t === 'phase';

/**
 * One simple turn starting at `i` (`aiTurn`, optionally a way of at least two tiles, optionally `exhausted`, then a boundary):
 * its way (if any), whether it ended the turn, and the index after it. Null when the turn does more than walk or wait.
 */
function simpleTurn(events: readonly GameEvent[], i: number): { march: March | null; exhausted: string | null; end: number } | null {
  const turn = events[i];
  if (turn?.t !== 'aiTurn') return null;
  let j = i + 1;
  let march: March | null = null;
  let exhausted: string | null = null;
  const moved = events[j];
  if (moved?.t === 'moved') {
    if (moved.unit !== turn.unit || moved.path.length < 2) return null;
    march = { unit: moved.unit, path: moved.path };
    j++;
  }
  const done = events[j];
  if (done?.t === 'exhausted') {
    if (done.unit !== turn.unit) return null;
    exhausted = done.unit;
    j++;
  }
  return isBoundary(events[j]) ? { march, exhausted, end: j } : null;
}

/**
 * The run of simple turns starting at `i`, when at least `min` of them walk; turns that only wait may sit between them. Null
 * when the turn at `i` is not simple or fewer than `min` units walk (then the board plays the turn as before).
 */
export function marchRun(events: readonly GameEvent[], i: number, min = 2): MarchRun | null {
  const marches: March[] = [];
  const exhausted: string[] = [];
  let end = i;
  let lastWalk = i;
  let lastExhausted = 0;
  for (;;) {
    const turn = simpleTurn(events, end);
    if (!turn) break;
    end = turn.end;
    if (turn.exhausted) exhausted.push(turn.exhausted);
    if (turn.march) {
      marches.push(turn.march);
      lastWalk = end;
      lastExhausted = exhausted.length;
    }
  }
  if (marches.length < min) return null;
  // waiters after the last walker are left to the normal playback, so the run ends with a way
  return { marches, exhausted: exhausted.slice(0, lastExhausted), end: lastWalk };
}
