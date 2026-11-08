import type { BattleUnit, GameEvent, StatusId } from '../../core';

/**
 * The unit a `spawned` event (events[n]) lets in, as it is at that moment. The board only has the state after the command, and that
 * already holds what befalls the unit later in the same command: the blows of a counter, a status, its fall. Shown from it, a foe
 * coming out of the fog walked up with the HP bar of after the counter (fix HP timing, map 1-5). So:
 * - HP from the event (`hp`, set by the core and the fog filter), else those of the final state;
 * - standing on the board (not gone, not downed): a unit that falls later in the command still walks and strikes first;
 * - statuses rolled back over the `status` events that follow it: one switched on later was not there yet, one switched off was.
 */
export function unitAtSpawn(final: BattleUnit, e: Extract<GameEvent, { t: 'spawned' }>, events: readonly GameEvent[], n: number): BattleUnit {
  const ids = new Set<StatusId>(final.status.map((s) => s.id));
  const settled = new Set<StatusId>();
  for (let i = n + 1; i < events.length; i++) {
    const x = events[i]!;
    if (x.t !== 'status' || x.unit !== e.unit || settled.has(x.status)) continue;
    settled.add(x.status);
    if (x.on) ids.delete(x.status);
    else ids.add(x.status);
  }
  const status = [...final.status.filter((s) => ids.has(s.id)), ...[...ids].filter((id) => !final.status.some((s) => s.id === id)).map((id) => ({ id, turns: 1 }))];
  return { ...final, pos: e.at ?? final.pos, hp: e.hp ?? final.hp, gone: undefined, downed: false, status };
}
