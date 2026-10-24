/** The running battle: session signal, player commands, restart. Mission flow around it lives in flow.ts. */
import { signal } from '@preact/signals';
import {
  applyCommand,
  beginBattle,
  keepQueued,
  replayBattle,
  restartKeep,
  validateCampaign,
  type BattleState,
  type CampaignCommand,
  type CampaignState,
  type Command,
  type GameEvent,
  type QueuedEffects,
  type RestartScope,
} from '../../core';
import { autosave, campaign, campaignCommand, data } from './session';
import { guarded } from './fault';
import { screen } from './screen';

export interface BattleSession {
  start: BattleState;
  state: BattleState;
  log: Command[];
  /**
   * Effects of dialogue answers given in this battle. They are not applied to the campaign while it runs (a restart
   * or a defeat would leave them behind or apply them twice); `finishMission` applies them on a victory.
   */
  effects: QueuedEffects[];
}
export const battle = signal<BattleSession | null>(null);

/** Events from startBattle waiting for the board (opening phase banner, turn-1 dialogue). */
export const pendingEvents = signal<GameEvent[]>([]);

export function startBattle(nodeId: string, deploy: string[]): GameEvent[] {
  const c = campaign.value!;
  const r = beginBattle(data, c, nodeId, deploy);
  battle.value = { start: r.state, state: r.state, log: [], effects: [] };
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

/** The campaign command for a restart; it carries the battle's log only where Classic has to verify a defeat. */
function restartCommand(scope: RestartScope, b: BattleSession, c: CampaignState): CampaignCommand {
  const node = b.start.nodeId;
  if (scope === 'turn') return { type: 'restartTurn', node, keep: restartKeep('turn', b.log) };
  return c.settings.deathMode === 'classic' ? { type: 'restartMission', node, lost: { start: b.start, commands: b.log } } : { type: 'restartMission', node };
}

/** `canRestart` runs while screens render; the answer only changes with the campaign or the battle's log. */
let restartMemo: { c: CampaignState; start: BattleState; len: number; answer: Partial<Record<RestartScope, boolean>> } | null = null;

/** Whether the death mode lets the player restart the running battle this way (Classic: no round, mission only after a defeat). */
export function canRestart(scope: RestartScope): boolean {
  const c = campaign.value;
  const b = battle.value;
  if (!c || !b) return false;
  // Classic: only a lost battle can be started over, which the session state already tells without replaying the log
  if (scope === 'mission' && c.settings.deathMode === 'classic' && b.state.outcome !== 'defeat') return false;
  if (!restartMemo || restartMemo.c !== c || restartMemo.start !== b.start || restartMemo.len !== b.log.length) {
    restartMemo = { c, start: b.start, len: b.log.length, answer: {} };
  }
  // the core stays the judge (it replays the log for Classic), once per battle state
  return (restartMemo.answer[scope] ??= validateCampaign(data, c, restartCommand(scope, b, c)) === null);
}

/**
 * Restarts the running battle at the start of the round or of the mission: a campaign command (validated per
 * death mode, journaled), then a replay of the kept part of the log. Returns false when the rules refuse.
 */
export function restartBattle(scope: RestartScope): boolean {
  const b = battle.value;
  const c = campaign.value;
  if (!b || !c) return false;
  const r = campaignCommand(restartCommand(scope, b, c));
  if (!r.ok) return false;
  const restarted = r.events.find((e) => e.t === 'battleRestarted');
  const keep = restarted?.t === 'battleRestarted' ? restarted.keep : 0;
  const log = b.log.slice(0, keep);
  // dialogues that fired in the discarded part will fire again when it is played again; their effects go with it
  battle.value = { start: b.start, state: replayBattle(data, b.start, log), log, effects: keepQueued(b.effects, keep) };
  screen.value = { name: 'battle' };
  autosave('battle');
  return true;
}
