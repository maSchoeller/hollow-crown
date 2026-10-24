/**
 * Mission flow: the glue between campaign, battle and screens. Starting and restoring games, camp →
 * dialogue → battle → result, story conditions and effects. Also wires the auto-save to the live app state.
 */
import {
  CoreInvariantError,
  applyCommand,
  conditionContext,
  type AvatarSettings,
  type BattleSettings,
  type ConditionContext,
  type Effect,
} from '../../core';
import type { SaveRecord, SlotId } from '../../persistence/save';
import {
  adoptRecord,
  autosave,
  bindLive,
  campaign,
  campaignCommand,
  createNewCampaign,
  data,
  deleteCampaignData,
  readSlot,
  storeImportedRecord,
} from './session';
import { battle, command, pendingEvents, startBattle } from './battle';
import { fault, reportFault } from './fault';
import { devResetHint, devSaveFailure } from './protection';
import { screen, type From } from './screen';

bindLive(() => ({
  where: battle.value ? 'battle' : screen.value.name === 'camp' ? 'camp' : 'worldmap',
  battle: battle.value ? { start: battle.value.start, commands: battle.value.log } : null,
}));

export function nodeDef(id: string) {
  return data.campaign.nodes.find((n) => n.id === id)!;
}

/** Default deployment: forced units first, then the company in roster order up to the map's limit. */
export function defaultDeploy(nodeId: string): string[] {
  const c = campaign.value!;
  const map = data.maps[nodeDef(nodeId).map]!;
  const list = map.deploy.forced.filter((id) => c.roster.some((r) => r.id === id));
  for (const r of c.roster) if (list.length < map.deploy.max && !list.includes(r.id)) list.push(r.id);
  return list;
}

/**
 * World map → pre dialogue → battle (U20). The preparation screen only appears when asked for or when
 * there is a real choice (more company members than deployment slots); `from` is where its back stone leads.
 */
export function playNode(nodeId: string, opts: { prep?: boolean; from?: From } = {}): void {
  const node = nodeDef(nodeId);
  const map = data.maps[node.map]!;
  const choice = campaign.value!.roster.length > map.deploy.max;
  const go = () => {
    if (opts.prep || choice) screen.value = { name: 'prep', node: nodeId, from: opts.from };
    else pendingEvents.value = startBattle(nodeId, defaultDeploy(nodeId));
  };
  if (node.pre) screen.value = { name: 'dialogue', id: node.pre, next: go };
  else go();
}

/** Starts a new campaign and plays its first node. Resolves `false` when the campaign limit is reached. */
export async function startNewGame(settingsIn: BattleSettings, avatar: AvatarSettings): Promise<boolean> {
  if (!(await createNewCampaign(settingsIn, avatar))) return false;
  battle.value = null;
  playNode(data.campaign.start);
  return true;
}

/** Restores a slot of a campaign (default: the active one): replays a running battle's command log (concept/13 acceptance 8). */
export async function loadSlot(slot: SlotId, id?: string | null): Promise<boolean> {
  const rec = await readSlot(slot, id);
  if (!rec) return false;
  restore(rec);
  return true;
}

/** Imports an exported save and makes it the active campaign. Resolves `false` when that would exceed three campaigns. */
export async function importRecord(rec: SaveRecord): Promise<boolean> {
  if (!(await storeImportedRecord(rec))) return false;
  restore(rec, 'import');
  return true;
}

/** Deletes a campaign with all its saves; when it is the active one, its battle goes too. */
export async function removeCampaign(id: string): Promise<void> {
  if (await deleteCampaignData(id)) battle.value = null;
}

export function restore(rec: SaveRecord, reason: 'load' | 'import' = 'load'): void {
  const p = adoptRecord(rec, reason);
  if (p.battle) {
    let s = p.battle.start;
    try {
      for (const cmd of p.battle.commands) s = applyCommand(data, s, cmd).state;
    } catch (e) {
      // the saved battle no longer replays; surface it, let the caller decide (recovery shows the fault screen again)
      reportFault(e);
      throw e;
    }
    battle.value = { start: p.battle.start, state: s, log: [...p.battle.commands] };
    screen.value = { name: 'battle' };
  } else {
    battle.value = null;
    screen.value = { name: 'worldmap' }; // the world map is the hub (story 5.3), also on "Continue"
  }
}

/** Battle ended: apply results, show outro and result screen. */
export function concludeBattle(): void {
  const b = battle.value!;
  if (b.state.outcome !== 'victory') {
    screen.value = { name: 'defeat' };
    return;
  }
  battle.value = null;
  const r = campaignCommand({ type: 'finishMission', start: b.start, commands: b.log });
  if (!r.ok) {
    if (fault.value !== null) return; // invariant violated while applying: the fault screen takes over
    throw new Error(`finishMission rejected: ${r.error}`);
  }
  const result = r.events.find((e) => e.t === 'missionFinished')!.result;
  const node = nodeDef(b.state.nodeId);
  const toResult = () => (screen.value = { name: 'result', result });
  if (node.post) screen.value = { name: 'dialogue', id: node.post, next: toResult };
  else toResult();
}

/** What conditions in dialogues and the camp read: the running campaign (or an empty story). */
export function storyContext(): ConditionContext {
  return conditionContext(data, campaign.value);
}

export function runEffects(effects: Effect[]): void {
  // battle state stays untouched so battle replays remain pure; effects go through the campaign journal
  campaignCommand({ type: 'effects', effects });
}

/** Dev helper: lets the simulator play the current battle (manual testing only). */
if (import.meta.env.DEV) {
  void import('../../core/ai/autoplay').then(({ autoCommand }) => {
    (window as unknown as { __hc: unknown }).__hc = {
      autoStep: () => command(autoCommand(data, battle.value!.state)),
      autoWin: () => {
        for (let i = 0; i < 3000 && battle.value && !battle.value.state.outcome; i++) command(autoCommand(data, battle.value.state));
        concludeBattle();
      },
      campaign,
      battle,
      screen,
      /** fault screen: an invalid battle command hits applyCommand's invariant check (or a plain fault outside battle) */
      crash: () =>
        battle.value
          ? command({ type: 'move', unit: 'nobody', to: [0, 0] })
          : reportFault(new CoreInvariantError('dev_test', { note: 'triggered with __hc.crash()' })),
      /** save-failed banner: `failSaves(true)` makes auto-saves fail until `failSaves(false)` */
      failSaves: (on = true) => {
        devSaveFailure.on = on;
        if (campaign.value) autosave(battle.value ? 'battle' : 'camp');
      },
      /** home-screen hint again, as after a first save */
      showHomeHint: devResetHint,
    };
  });
}
