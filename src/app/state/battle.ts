/** The running battle: session signal, player commands, restart. Mission flow around it lives in flow.ts. */
import { signal } from '@preact/signals';
import {
  applyCommand,
  beginBattle,
  replayBattle,
  validateCampaign,
  type BattleState,
  type CampaignCommand,
  type Command,
  type GameEvent,
  type RestartScope,
} from '../../core';
import { autosave, campaign, campaignCommand, data } from './session';
import { guarded } from './fault';
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
  const r = guarded(() => applyCommand(data, b.state, cmd), null);
  if (!r) return []; // invariant violated: the fault screen takes over, the battle stays as it was
  battle.value = { ...b, state: r.state, log: [...b.log, cmd] };
  autosave('battle');
  return r.events;
}

function restartCommand(scope: RestartScope): CampaignCommand | null {
  const b = battle.value;
  if (!b) return null;
  return { type: scope === 'turn' ? 'restartTurn' : 'restartMission', start: b.start, commands: b.log };
}

/** Whether the death mode lets the player restart the running battle this way (Classic: no round, mission only after a defeat). */
export function canRestart(scope: RestartScope): boolean {
  const c = campaign.value;
  const cmd = restartCommand(scope);
  return !!c && !!cmd && validateCampaign(data, c, cmd) === null;
}

/**
 * Restarts the running battle at the start of the round or of the mission: a campaign command (validated per
 * death mode, journaled), then a replay of the kept part of the log. Returns false when the rules refuse.
 */
export function restartBattle(scope: RestartScope): boolean {
  const b = battle.value;
  const cmd = restartCommand(scope);
  if (!b || !cmd) return false;
  const r = campaignCommand(cmd);
  if (!r.ok) return false;
  const restarted = r.events.find((e) => e.t === 'battleRestarted');
  const log = b.log.slice(0, restarted?.t === 'battleRestarted' ? restarted.keep : 0);
  battle.value = { start: b.start, state: replayBattle(data, b.start, log), log };
  screen.value = { name: 'battle' };
  autosave('battle');
  return true;
}
