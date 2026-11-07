/**
 * Stories 15.10, 15.11: how long a player waits through the AI phases of a battle, worked out from the events the core produced with
 * the board's own plan (`src/render/board/aiPacing.ts`, the times of `board.ts play()` and `render.yaml aiPace`), tempo 1×.
 * Three figures per phase: "single" plays every turn one after the other (option „Gegnerzüge: Einzeln“), "march" groups the turns
 * that only walk (`marchRun`, „Gemeinsam“), "shown" is "march" after the time budget (`phaseBoost`): what the board plays with
 * „Gemeinsam“. Camera glides are counted for every announced turn (an upper bound), panels that wait for the player are left out.
 */
import type { GameData, GameEvent } from '../src/core';
import { aiSpanEnd, phaseBoost, planMs } from '../src/render/board/aiPacing';

export interface PhaseTime {
  turn: number;
  single: number;
  march: number;
  shown: number;
}

/**
 * Every AI phase (enemy and third party, up to the next player phase) of the event log, in ms at tempo 1×. `team` tells the side of
 * a unit (a counter of the player's side pauses shorter); unknown units count as foes.
 */
export function aiPhaseTimes(
  data: GameData,
  events: readonly GameEvent[],
  team: (uid: string) => string | undefined = () => undefined,
): PhaseTime[] {
  const out: PhaseTime[] = [];
  for (let n = 0; n < events.length; n++) {
    const e = events[n]!;
    if (e.t !== 'phase' || e.phase === 'player') continue;
    const end = aiSpanEnd(events, n);
    const march = planMs(data, events, n, end, true, team);
    out.push({
      turn: e.turn,
      single: planMs(data, events, n, end, false, team),
      march,
      shown: march / phaseBoost(data, march, 1),
    });
    n = end - 1;
  }
  return out;
}
