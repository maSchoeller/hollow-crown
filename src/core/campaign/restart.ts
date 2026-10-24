import type { GameData } from '../defs';
import { applyCommand } from '../battle/apply';
import type { Command } from '../battle/commands';
import type { BattleState } from '../state';

/** What a restart goes back to: the start of the current round or the start of the mission. */
export type RestartScope = 'turn' | 'mission';

/** Log length at the start of the current round (the `endPhase` that opened it is the last one in the log). */
export function turnStartIndex(log: readonly Pick<Command, 'type'>[]): number {
  return log.map((c) => c.type).lastIndexOf('endPhase') + 1;
}

/** How many commands of the log a restart keeps (the replay target, concept/24-architecture §5.15). */
export function restartKeep(scope: RestartScope, log: readonly Pick<Command, 'type'>[]): number {
  return scope === 'turn' ? turnStartIndex(log) : 0;
}

/** Start snapshot + command log → the battle state they lead to. Deaths and downs are part of the log, so a shorter log undoes them. */
export function replayBattle(data: GameData, start: BattleState, commands: readonly Command[]): BattleState {
  let s = start;
  for (const cmd of commands) s = applyCommand(data, s, cmd).state;
  return s;
}
