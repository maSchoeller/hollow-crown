/** The running battle: session signal, player commands, restart. Mission flow around it lives in flow.ts. */
import { signal } from '@preact/signals';
import {
  CoreInvariantError,
  applyCommand,
  beginBattle,
  beginHauntBattle,
  keepQueued,
  replayBattle,
  restartKeep,
  stateHash,
  validateCampaign,
  type BattleState,
  type CampaignCommand,
  type CampaignState,
  type Command,
  type GameEvent,
  type QueuedEffects,
  type RestartScope,
} from '../../core';
import { applyCommandInWorker } from '../coreWorker';
import { trail, trailEvents } from '../trail';
import { autosave, campaign, campaignCommand, data } from './session';
import { reportFault } from './fault';
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

export function startBattle(nodeId: string, deploy: string[], hauntId?: string): GameEvent[] {
  const c = campaign.value!;
  const r = hauntId ? beginHauntBattle(data, c, hauntId, deploy) : beginBattle(data, c, nodeId, deploy);
  battle.value = { start: r.state, state: r.state, log: [], effects: [] };
  trail.record({ kind: 'battleStart', node: nodeId, ...(hauntId ? { haunt: hauntId } : {}), deploy, hash: stateHash(r.state) });
  screen.value = { name: 'battle' };
  autosave('battle');
  return r.events;
}

/** One battle command in the action trail (architecture §6.2a): where it was played, what came of it, the state's checksum after it. */
function recordCommand(from: BattleState, i: number, cmd: Command, r: { state: BattleState; events: GameEvent[] } | null, ok: boolean | 'dropped', error?: string): void {
  trail.record({
    kind: 'battle',
    i,
    turn: from.turn,
    phase: from.phase,
    cmd,
    ok,
    ...(error ? { error } : {}),
    ...(r ? { ...trailEvents(r.events), hash: stateHash(r.state) } : {}),
  });
}

/** Executes a player command. Returns events for the board to play. */
export function command(cmd: Command): GameEvent[] {
  const b = battle.value!;
  let r;
  try {
    r = applyCommand(data, b.state, cmd);
  } catch (e) {
    recordCommand(b.state, b.log.length, cmd, null, false, e instanceof CoreInvariantError ? e.code : String(e));
    if (!(e instanceof CoreInvariantError)) throw e;
    reportFault(e); // the fault screen takes over, the battle stays as it was
    return [];
  }
  recordCommand(b.state, b.log.length, cmd, r, true);
  battle.value = { ...b, state: r.state, log: [...b.log, cmd] };
  autosave('battle');
  return r.events;
}

/**
 * Executes a command in the core worker (architecture §5.13): the enemy phase, which can take long in a large battle.
 * State, log and auto-save change only after the answer. Returns the events for the board; `[]` when the core refused
 * the command (the fault screen takes over, the battle stays as it was); `null` when the battle's state was
 * replaced while the worker was computing (restart, give up, world map, load): the answer is dropped and touches nothing.
 */
export async function commandOffThread(cmd: Command): Promise<GameEvent[] | null> {
  const from = battle.value!.state;
  const i = battle.value!.log.length;
  let r;
  try {
    r = await applyCommandInWorker(data, from, cmd);
  } catch (e) {
    if (!(e instanceof CoreInvariantError)) throw e;
    recordCommand(from, i, cmd, null, battle.value?.state !== from ? 'dropped' : false, e.code);
    if (battle.value?.state !== from) return null;
    reportFault(e);
    return [];
  }
  // The answer is only valid for the state it was computed from. A restart, a new battle, leaving it or loading a save
  // replaces that state; a change that keeps it (queued dialogue effects) must not drop the answer, so the session
  // object is read again here instead of compared.
  const b = battle.value;
  if (!b || b.state !== from) {
    recordCommand(from, i, cmd, r, 'dropped');
    return null;
  }
  recordCommand(from, i, cmd, r, true);
  battle.value = { ...b, state: r.state, log: [...b.log, cmd] };
  autosave('battle');
  return r.events;
}

/** The campaign command for a restart; it carries the battle's log only where Classic has to verify a defeat. */
function restartCommand(scope: RestartScope, b: BattleSession, c: CampaignState): CampaignCommand {
  const node = b.start.nodeId;
  const haunt = b.start.hauntId ? { haunt: b.start.hauntId } : {};
  if (scope === 'turn') return { type: 'restartTurn', node, keep: restartKeep('turn', b.log), ...haunt };
  return c.settings.deathMode === 'classic' ? { type: 'restartMission', node, lost: { start: b.start, commands: b.log }, ...haunt } : { type: 'restartMission', node, ...haunt };
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

/** The campaign command for leaving the running mission (story 1.9); the core checks the log against the death mode. */
function abandonCommand(b: BattleSession): CampaignCommand {
  return { type: 'abandonMission', node: b.start.nodeId, commands: b.log, ...(b.start.hauntId ? { haunt: b.start.hauntId } : {}) };
}

/** Whether the death mode lets the player leave the running mission for the world map (Classic: only before the first action). */
export function canAbandon(): boolean {
  const c = campaign.value;
  const b = battle.value;
  if (!c || !b) return false;
  return validateCampaign(data, c, abandonCommand(b)) === null;
}

/**
 * Leaves the running mission: a campaign command (validated, journaled), then the battle is dropped and the world map
 * shows. The campaign stays as before the mission; the battle's auto-save is replaced so it cannot be resumed.
 */
export function abandonBattle(): boolean {
  const b = battle.value;
  if (!b || !campaign.value) return false;
  if (!campaignCommand(abandonCommand(b)).ok) return false;
  battle.value = null;
  pendingEvents.value = [];
  screen.value = { name: 'worldmap' };
  autosave('worldmap'); // campaignCommand saved while the battle was still running
  return true;
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
