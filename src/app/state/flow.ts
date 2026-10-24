/**
 * Mission flow: the glue between campaign, battle and screens. Starting and restoring games, camp →
 * dialogue → battle → result, story conditions and effects. Also wires the auto-save to the live app state.
 */
import {
  CoreInvariantError,
  applyCommand,
  conditionContext,
  createBattle,
  queuedFlags,
  validateEffects,
  flattenQueued,
  type AvatarSettings,
  type BattleSettings,
  type BattleState,
  type BattleUnit,
  type ConditionContext,
  type Effect,
  type MapUnitDef,
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
import { battle, canRestart, command, pendingEvents, restartBattle, startBattle } from './battle';
import { fault, reportFault } from './fault';
import { devResetHint, devSaveFailure } from './protection';
import { screen, type From, type Screen } from './screen';
import { log } from '../log';
import { loadManifest } from '../../render/shared/assets';
import { laterMusicAssets, missionAssets, placePath, type MissionUnit } from '../loading/plan';
import { ensureMissionAssets, prefetchQuietly } from './loading';
import { settings } from './settings';

bindLive(() => ({
  where: battle.value ? 'battle' : screen.value.name === 'camp' ? 'camp' : 'worldmap',
  battle: battle.value ? { start: battle.value.start, commands: battle.value.log, effects: battle.value.effects } : null,
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
    else void beginMission(nodeId, defaultDeploy(nodeId), opts.from === 'camp' ? { name: 'camp' } : { name: 'worldmap' });
  };
  if (node.pre) screen.value = { name: 'dialogue', id: node.pre, next: go };
  else go();
}

const defSource = (d: MapUnitDef): MissionUnit => ({
  portrait: d.portrait ?? d.char,
  sprite: d.sprite ?? d.char,
  classId: d.class,
  gearItems: d.items.map((i) => i.def),
});

/** A unit on the board as the loading plan sees it: its figure and the weapons it has in hand. */
const battleSource = (u: BattleUnit): MissionUnit => ({
  portrait: u.portrait,
  sprite: u.sprite,
  charId: u.charId,
  classId: u.classId,
  gearItems: [u.equip.mainHand?.def, u.equip.offHand?.def].filter((x): x is string => !!x),
});

/**
 * Makes sure the on-demand files of a battle are there (place image, figures and their weapon models), with the
 * loading screen when something is missing. Resolves `false` when the player left it with the back stone.
 */
async function ensureBattleAssets(nodeId: string, units: readonly BattleUnit[], back: Screen): Promise<boolean> {
  const node = nodeDef(nodeId);
  const map = data.maps[node.map]!;
  const later = [...map.reinforcements.flatMap((r) => r.units), ...map.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : [])))];
  const manifest = await loadManifest().catch(() => ({}) as Awaited<ReturnType<typeof loadManifest>>);
  const place = placePath(node.place ?? data.campaign.defaultPlace);
  const paths = missionAssets({
    units: [...units.map(battleSource), ...later.map(defSource)],
    models: manifest.models?.units,
    figures: settings.value.figures,
    sprites: manifest.units,
    music: manifest.audio,
    weaponModels: manifest.models?.weapons,
    items: data.items,
    gear: data.render.gear,
    classes: data.classes,
    place: node.place,
    defaultPlace: data.campaign.defaultPlace,
  });
  const ok = await ensureMissionAssets({ node: nodeId, place, paths, back });
  // camp and world map music come after the battle: fetch it in the background while the player is busy
  if (ok) prefetchQuietly(laterMusicAssets(manifest.audio));
  return ok;
}

/**
 * Starts the battle of a node with the chosen units. Places and unit models load on demand (decision 2026-10-24); when
 * some are not cached yet, the loading screen shows until they are there (story 7.6), then the battle starts by itself.
 * `back` is where the loading screen's back stone leads.
 */
export async function beginMission(nodeId: string, deploy: string[], back: Screen): Promise<void> {
  const start = createBattle(data, campaign.value!, nodeId, deploy);
  if (!(await ensureBattleAssets(nodeId, start.units, back))) return;
  pendingEvents.value = startBattle(nodeId, deploy);
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
    battle.value = { start: p.battle.start, state: s, log: [...p.battle.commands], effects: p.battle.effects ?? [] };
    void showRestoredBattle(s);
  } else {
    battle.value = null;
    screen.value = { name: 'worldmap' }; // the world map is the hub (story 5.3), also on "Continue"
  }
}

/**
 * A restored running battle goes through the same loading as a new one (story 7.6): the board only shows once its place
 * image, figures and weapon models are there. Leaving the loading screen drops the restored battle (the save stays).
 */
async function showRestoredBattle(s: BattleState): Promise<void> {
  const mine = battle.value;
  let ok = true;
  try {
    ok = await ensureBattleAssets(s.nodeId, s.units, { name: 'title' });
  } catch (e) {
    log.warn('core', 'loading the assets of a restored battle failed', e);
  }
  if (battle.value !== mine) return; // something else took over while loading
  if (ok) screen.value = { name: 'battle' };
  else battle.value = null;
}

/** Battle ended: apply results, show outro and result screen. */
export function concludeBattle(): void {
  const b = battle.value!;
  if (b.state.outcome !== 'victory') {
    screen.value = { name: 'defeat' };
    return;
  }
  const r = campaignCommand({ type: 'finishMission', start: b.start, commands: b.log, effects: b.effects });
  if (!r.ok) {
    // the battle stays as it is; the fault screen takes over (an invariant violation has reported itself already)
    if (fault.value === null) reportFault(new CoreInvariantError('finish_mission_rejected', { node: b.state.nodeId, reason: r.error }));
    return;
  }
  battle.value = null;
  autosave('worldmap'); // campaignCommand saved while the battle was still running; the finished one must not be resumable
  const result = r.events.find((e) => e.t === 'missionFinished')!.result;
  const node = nodeDef(b.state.nodeId);
  const toResult = () => (screen.value = { name: 'result', result });
  if (node.post) screen.value = { name: 'dialogue', id: node.post, next: toResult };
  else toResult();
}

/** What conditions in dialogues and the camp read: the running campaign (or an empty story). */
export function storyContext(): ConditionContext {
  // flags set by answers earlier in this battle count although they are only queued (see `runEffects`)
  const b = inBattle();
  return conditionContext(data, campaign.value, b ? queuedFlags(b.effects) : {});
}

/** Whether the running campaign has seen scene `id` (a scene read before is shown as skippable whole). */
export const isSceneSeen = (id: string): boolean => campaign.value?.scenesSeen.includes(id) ?? false;

/** Records that scene `id` was seen to the end or skipped (idempotent; a record only, no story state). */
export function markSceneSeen(id: string): void {
  if (!isSceneSeen(id)) campaignCommand({ type: 'markSceneSeen', scene: id });
}

function inBattle() {
  return screen.value.name === 'battle' ? battle.value : null;
}

/**
 * Effects of a dialogue answer. Outside a battle they run at once through the campaign journal. During a battle they
 * wait in the battle session (with the number of commands played so far) and run with `finishMission`: a restart
 * drops the ones that fired in the discarded part, a defeat drops all (architecture §5.3). Battle state stays untouched.
 */
export function runEffects(effects: Effect[]): void {
  const b = inBattle();
  if (!b) {
    campaignCommand({ type: 'effects', effects });
    return;
  }
  const c = campaign.value;
  // like an immediate run, an answer the rules refuse is dropped now, so it cannot stop the mission from finishing later
  const error = c ? validateEffects(data, c, [...flattenQueued(b.effects), ...effects]) : 'not_available';
  if (error) {
    log.warn('core', `dialogue effects refused: ${error}`, effects);
    return;
  }
  battle.value = { ...b, effects: [...b.effects, { at: b.log.length, effects }] };
  autosave('battle');
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
      /** answers a dialogue as the player would: `runEffects([{ setFlag: 'ch02_hold' }])`, queued during a battle */
      runEffects,
      storyContext,
      restartBattle,
      canRestart,
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
