/** The running battle: session signal, player commands, restart. Mission flow around it lives in flow.ts. */
import { signal } from '@preact/signals';
import { applyCommand, beginBattle, type BattleState, type Command, type GameEvent } from '../../core';
import { autosave, campaign, data } from './session';
import { screen } from './screen';

export interface BattleSession {
  start: BattleState;
  state: BattleState;
  log: Command[];
}
export const battle = signal<BattleSession | null>(null);

/** Events from startBattle waiting for the board (opening phase banner, turn-1 dialogue). */
export const pendingEvents = signal<GameEvent[]>([]);

export function startBattle(nodeId: string, deploy: string[]): GameEvent[] {
  const c = campaign.value!;
  const r = beginBattle(data, c, nodeId, deploy);
  battle.value = { start: r.state, state: r.state, log: [] };
  screen.value = { name: 'battle' };
  autosave('battle');
  return r.events;
}

/** Executes a player command. Returns events for the board to play. */
export function command(cmd: Command): GameEvent[] {
  const b = battle.value!;
  const r = applyCommand(data, b.state, cmd);
  battle.value = { ...b, state: r.state, log: [...b.log, cmd] };
  autosave('battle');
  return r.events;
}

/** Restart the current round (Standard/Casual) or the whole mission. */
export function restartBattle(fromRound: boolean): void {
  const b = battle.value;
  if (!b) return;
  let log = b.log;
  if (fromRound) {
    const last = log.map((c) => c.type).lastIndexOf('endPhase');
    log = last >= 0 ? log.slice(0, last + 1) : [];
  } else log = [];
  let s = b.start;
  for (const cmd of log) s = applyCommand(data, s, cmd).state;
  battle.value = { start: b.start, state: s, log };
  screen.value = { name: 'battle' };
  autosave('battle');
}
