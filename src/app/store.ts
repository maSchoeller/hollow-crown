/** App state: screens, campaign, running battle, settings. Connects core, persistence and UI. */
import { signal } from '@preact/signals';
import {
  applyCampaign,
  applyCommand,
  beginBattle,
  newCampaign,
  validateCampaign,
  type AvatarSettings,
  type BattleResult,
  type BattleSettings,
  type BattleState,
  type CampaignCommand,
  type CampaignError,
  type CampaignEvent,
  type CampaignState,
  type Command,
  type GameData,
  type GameEvent,
} from '../core';
import { loadContent } from '../content/browser';
import { lang, setAvatar, setLocales, type Lang } from '../i18n';
import { createAutoSaver, createPlayClock } from '../persistence/autosave';
import { createJournalWriter, needsUpdateCheckpoint, type CheckpointReason } from '../persistence/journal';
import {
  CampaignLimitError,
  contentVersionOf,
  createCampaign,
  deleteCampaign,
  listCampaigns,
  readSave,
  setSaveDbBlockedHandler,
  writeSave,
  type SavePayload,
  type SaveRecord,
  type SlotId,
} from '../persistence/save';

const loaded = loadContent();
export const data: GameData = loaded.data;
setLocales(loaded.locales);
const contentVersion = contentVersionOf(data);

export type Screen =
  | { name: 'title' }
  | { name: 'campaigns' }
  | { name: 'newGame' }
  | { name: 'worldmap' }
  | { name: 'dialogue'; id: string; next: () => void }
  | { name: 'prep'; node: string }
  | { name: 'battle' }
  | { name: 'result'; result: BattleResult }
  | { name: 'defeat' }
  | { name: 'camp'; tab?: string }
  | { name: 'options'; back: Screen }
  | { name: 'end' };

export const screen = signal<Screen>({ name: 'title' });
export const campaign = signal<CampaignState | null>(null);
/** id of the active campaign in the save database (format 2); lives outside CampaignState */
export const campaignId = signal<string | null>(null);

export interface BattleSession {
  start: BattleState;
  state: BattleState;
  log: Command[];
}
export const battle = signal<BattleSession | null>(null);

/** Events from startBattle waiting for the board (opening phase banner, turn-1 dialogue). */
export const pendingEvents = signal<GameEvent[]>([]);

export interface Settings {
  lang: Lang;
  speed: 1 | 2 | 3; // 3 = skip
  enemySpeed: 1 | 2 | 3;
  dangerDefault: boolean;
  confirmForecast: boolean;
  quality: 'low' | 'mid' | 'high';
  /** figures on the board: 3D models or pixel sprites (concept/01-decisions.md D4) */
  figures: '3d' | '2d';
  music: number;
  sfx: number;
  keepAwake: boolean;
  shake: boolean;
}

const SETTINGS_KEY = 'hc.settings';
function loadSettings(): Settings {
  const def: Settings = {
    lang: navigator.language?.startsWith('de') ? 'de' : 'en',
    speed: 1,
    enemySpeed: 2,
    dangerDefault: false,
    confirmForecast: true,
    quality: 'mid',
    figures: '3d',
    music: 0.6,
    sfx: 0.8,
    keepAwake: true,
    shake: true,
  };
  try {
    return { ...def, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Settings>) };
  } catch {
    return def;
  }
}
export const settings = signal<Settings>(loadSettings());
lang.value = settings.value.lang;
export function updateSettings(p: Partial<Settings>): void {
  settings.value = { ...settings.value, ...p };
  if (p.lang) lang.value = p.lang;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value));
  } catch {
    /* private mode */
  }
}

const nowIso = (): string => new Date().toISOString();

const saver = createAutoSaver();
/** play time is counted while the page is visible */
const playClock = createPlayClock(
  () => performance.now(),
  () => document.visibilityState === 'visible',
);
const takePlaytime = (): number => playClock.take();

/** true while an older tab keeps the save database from upgrading (title shows a hint) */
export const saveDbBlocked = signal(false);
setSaveDbBlockedHandler(() => (saveDbBlocked.value = true));

/** Log length at the start of the current round (replay target of "restart round"). */
function turnStartIndex(log: Command[]): number {
  return log.map((c) => c.type).lastIndexOf('endPhase') + 1;
}

/** Queues the auto-save of the active campaign; the snapshot is taken now, the write happens later. */
export function autosave(where: SavePayload['screen']): void {
  const c = campaign.value;
  const id = campaignId.value;
  if (!c || !id) return;
  const b = battle.value;
  const payload: SavePayload = {
    campaign: c,
    screen: where,
    battle: b && where === 'battle' ? { start: b.start, commands: b.log, turnStartIndex: turnStartIndex(b.log) } : undefined,
  };
  saver.schedule(async () => {
    await writeSave(id, 'auto', payload, { now: nowIso(), contentVersion, playtimeDeltaMs: takePlaytime() });
  });
}

/** Writes the pending auto-save at once (page goes to the background). */
export function flushAutosave(): Promise<void> {
  return saver.flush();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      playClock.hide();
      // always write on the way out, so play time survives the app being killed in the background
      autosave(battle.value ? 'battle' : screen.value.name === 'worldmap' ? 'worldmap' : 'camp');
      void flushAutosave();
    } else playClock.show();
  });
  window.addEventListener('pagehide', () => void flushAutosave());
}

export async function saveSlot(slot: SlotId): Promise<void> {
  const c = campaign.value;
  const id = campaignId.value;
  if (!c || !id) return;
  await writeSave(id, slot, { campaign: c, screen: 'camp' }, { now: nowIso(), contentVersion, playtimeDeltaMs: takePlaytime() });
}

function showCampaign(c: CampaignState): void {
  campaign.value = c;
  setAvatar(c.avatar.name, c.avatar.pronoun);
}

const journal = createJournalWriter();

/** Full campaign state into the journal; replays of this campaign start here. */
function checkpoint(id: string, c: CampaignState, reason: CheckpointReason): void {
  void journal.append(id, { kind: 'checkpoint', reason, contentVersion, campaign: c });
}

/** Checkpoint after loading: `update` when the last one came from another app or content version. */
function checkpointOnLoad(id: string, c: CampaignState): void {
  void journal
    .flush()
    .then(() => needsUpdateCheckpoint(id, contentVersion))
    .then(
      (update) => checkpoint(id, c, update ? 'update' : 'load'),
      () => checkpoint(id, c, 'load'),
    );
}

const resumeScreen = (): SavePayload['screen'] =>
  battle.value ? 'battle' : screen.value.name === 'worldmap' ? 'worldmap' : 'camp';

export type CampaignCommandResult = { ok: true; events: CampaignEvent[] } | { ok: false; error: CampaignError };

/**
 * The only way to change the campaign outside a battle (concept/24-architecture §5.2): validate, apply,
 * append to the journal, auto-save.
 */
export function campaignCommand(cmd: CampaignCommand): CampaignCommandResult {
  const c = campaign.value;
  if (!c) return { ok: false, error: 'not_available' };
  const error = validateCampaign(data, c, cmd);
  if (error) return { ok: false, error };
  const r = applyCampaign(data, c, cmd);
  showCampaign(r.campaign);
  const id = campaignId.value;
  if (id) void journal.append(id, { kind: 'command', cmd });
  autosave(resumeScreen());
  return { ok: true, events: r.events };
}

/**
 * Starts a new campaign. Resolves `false` when three campaigns exist (the caller asks the player to
 * delete one first, concept/24-architecture §5.15).
 */
export async function startNewGame(settingsIn: BattleSettings, avatar: AvatarSettings): Promise<boolean> {
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  const c = newCampaign(data, seed, settingsIn, avatar);
  try {
    const meta = await createCampaign({ campaign: c, now: nowIso(), contentVersion });
    campaignId.value = meta.id;
  } catch (e) {
    if (e instanceof CampaignLimitError) return false;
    throw e;
  }
  await saver.flush();
  showCampaign(c);
  checkpoint(campaignId.value!, c, 'new');
  battle.value = null;
  playClock.reset();
  autosave('worldmap');
  playNode(data.campaign.start);
  return true;
}

/** Restores a slot of a campaign (default: the active one): replays a running battle's command log (concept/13 acceptance 8). */
export async function loadSlot(slot: SlotId, id = campaignId.value): Promise<boolean> {
  if (!id) return false;
  await saver.flush();
  const rec = await readSave(id, slot);
  if (!rec) return false;
  restore(rec);
  return true;
}

/** Deletes a campaign with all its saves; when it is the active one, the app forgets it too. */
export async function removeCampaign(id: string): Promise<void> {
  await Promise.all([saver.flush().catch(() => undefined), journal.flush().catch(() => undefined)]);
  await deleteCampaign(id);
  if (campaignId.value === id) {
    campaignId.value = null;
    campaign.value = null;
    battle.value = null;
  }
}

/** Auto-save of the most recently played campaign that has one ("Continue"). */
export async function latestAutoSave(): Promise<SaveRecord | undefined> {
  for (const m of await listCampaigns()) {
    const rec = await readSave(m.id, 'auto');
    if (rec) return rec;
  }
  return undefined;
}

/**
 * Imports an exported save: overwrites the campaign with the same id or registers it as a new one.
 * Resolves `false` when that would exceed three campaigns.
 */
export async function importRecord(rec: SaveRecord): Promise<boolean> {
  await saver.flush();
  const isNew = !(await listCampaigns()).some((m) => m.id === rec.campaignId);
  try {
    await createCampaign({ campaign: rec.payload.campaign, now: nowIso(), contentVersion, id: rec.campaignId });
  } catch (e) {
    if (e instanceof CampaignLimitError) return false;
    throw e;
  }
  try {
    await writeSave(rec.campaignId, 'auto', rec.payload, { now: nowIso(), contentVersion });
  } catch (e) {
    // no campaign without a save: it would hide "Continue" and take one of the three places
    if (isNew) await deleteCampaign(rec.campaignId).catch(() => undefined);
    throw e;
  }
  restore(rec, 'import');
  return true;
}

export function restore(rec: SaveRecord, reason: 'load' | 'import' = 'load'): void {
  const p = rec.payload;
  campaignId.value = rec.campaignId;
  playClock.reset();
  showCampaign(p.campaign);
  if (reason === 'import') checkpoint(rec.campaignId, p.campaign, 'import');
  else checkpointOnLoad(rec.campaignId, p.campaign);
  if (p.battle) {
    let s = p.battle.start;
    for (const cmd of p.battle.commands) s = applyCommand(data, s, cmd).state;
    battle.value = { start: p.battle.start, state: s, log: [...p.battle.commands] };
    screen.value = { name: 'battle' };
  } else {
    battle.value = null;
    screen.value = { name: 'camp' };
  }
}

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
 * War camp → pre dialogue → battle (U20). The preparation screen only appears when asked for or when
 * there is a real choice (more company members than deployment slots).
 */
export function playNode(nodeId: string, opts: { prep?: boolean } = {}): void {
  const node = nodeDef(nodeId);
  const map = data.maps[node.map]!;
  const choice = campaign.value!.roster.length > map.deploy.max;
  const go = () => {
    if (opts.prep || choice) screen.value = { name: 'prep', node: nodeId };
    else pendingEvents.value = startBattle(nodeId, defaultDeploy(nodeId));
  };
  if (node.pre) screen.value = { name: 'dialogue', id: node.pre, next: go };
  else go();
}

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

/** Battle ended: apply results, show outro and result screen. */
export function concludeBattle(): void {
  const b = battle.value!;
  if (b.state.outcome !== 'victory') {
    screen.value = { name: 'defeat' };
    return;
  }
  battle.value = null;
  const r = campaignCommand({ type: 'finishMission', start: b.start, commands: b.log });
  if (!r.ok) throw new Error(`finishMission rejected: ${r.error}`);
  const result = r.events.find((e) => e.t === 'missionFinished')!.result;
  const node = nodeDef(b.state.nodeId);
  const toResult = () => (screen.value = { name: 'result', result });
  if (node.post) screen.value = { name: 'dialogue', id: node.post, next: toResult };
  else toResult();
}

export function setFlag(flag: string): void {
  // battle state stays untouched so battle replays remain pure; the flag goes through the campaign journal
  campaignCommand({ type: 'setFlag', flag });
}

/** Dev helper: lets the simulator play the current battle (manual testing only). */
if (import.meta.env.DEV) {
  void import('../core/ai/autoplay').then(({ autoCommand }) => {
    (window as unknown as { __hc: unknown }).__hc = {
      autoStep: () => command(autoCommand(data, battle.value!.state)),
      autoWin: () => {
        for (let i = 0; i < 3000 && battle.value && !battle.value.state.outcome; i++) command(autoCommand(data, battle.value.state));
        concludeBattle();
      },
      campaign,
      battle,
      screen,
    };
  });
}
