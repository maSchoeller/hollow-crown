/**
 * The loaded content and the active campaign: campaign commands, auto-save, journal, play clock, and the
 * campaign list (new, import, delete). Knows nothing about screens or battles; whatever it needs from them
 * (what to save, where to resume) it asks through `bindLive`, which flow.ts wires up.
 */
import { signal } from '@preact/signals';
import {
  applyCampaign,
  newCampaign,
  normalizeCampaign,
  renameLegacyBattleClasses,
  renameLegacyClasses,
  turnStartIndex,
  validateCampaign,
  type AvatarSettings,
  type BattleSettings,
  type BattleState,
  type CampaignCommand,
  type CampaignError,
  type CampaignEvent,
  type CampaignState,
  type Command,
  type GameData,
  type QueuedEffects,
} from '../../core';
import { loadContent } from '../../content/browser';
import { setAvatar, setLocales } from '../../i18n';
import { createAutoSaver, createPlayClock } from '../../persistence/autosave';
import { createJournalWriter, needsUpdateCheckpoint, type CheckpointReason } from '../../persistence/journal';
import { log } from '../log';
import {
  CampaignLimitError,
  contentVersionOf,
  APP_VERSION,
  createCampaign,
  deleteCampaign,
  listCampaigns,
  readSave,
  setSaveDbBlockedHandler,
  SlotNotAllowedError,
  writeSave,
  type SavePayload,
  type SaveRecord,
  type SlotId,
} from '../../persistence/save';
import { guarded } from './fault';
import { afterFirstSave, devSaveFailure, noteSaveResult } from './protection';

const loaded = loadContent();
export const data: GameData = loaded.data;
setLocales(loaded.locales);
export const contentVersion = contentVersionOf(data);

export const campaign = signal<CampaignState | null>(null);
/** id of the active campaign in the save database (format 2); lives outside CampaignState */
export const campaignId = signal<string | null>(null);

/** What the auto-save needs to know about the app right now; provided by flow.ts. */
export interface LiveSnapshot {
  /** where a restore should land */
  where: SavePayload['screen'];
  /** the running battle (start state and command log), if any */
  battle: { start: BattleState; commands: Command[]; effects: QueuedEffects[] } | null;
}
let live: () => LiveSnapshot = () => ({ where: 'camp', battle: null });
export function bindLive(source: () => LiveSnapshot): void {
  live = source;
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

function snapshotPayload(c: CampaignState, where: SavePayload['screen']): SavePayload {
  const b = where === 'battle' ? live().battle : null;
  return {
    campaign: c,
    screen: where,
    battle: b ? { start: b.start, commands: b.commands, turnStartIndex: turnStartIndex(b.commands), effects: b.effects } : undefined,
  };
}

/** The active campaign as a save record, built now and not read from the database (export when saving fails). */
export function currentSaveRecord(): SaveRecord | null {
  const c = campaign.value;
  const id = campaignId.value;
  if (!c || !id) return null;
  return {
    format: 2,
    campaignId: id,
    slot: 'auto',
    createdAt: nowIso(),
    appVersion: APP_VERSION,
    contentVersion,
    payload: snapshotPayload(c, live().where),
  };
}

/**
 * Queues the auto-save of the active campaign; the snapshot is taken now, the write happens later. A failed
 * write raises the "saving failed" banner; the next commit tries again (§5.15).
 */
export function autosave(where: SavePayload['screen']): void {
  const c = campaign.value;
  const id = campaignId.value;
  if (!c || !id) return;
  const payload = snapshotPayload(c, where);
  saver.schedule(async () => {
    try {
      if (import.meta.env.DEV && devSaveFailure.on) throw new Error('simulated save failure');
      await writeSave(id, 'auto', payload, { now: nowIso(), contentVersion, playtimeDeltaMs: takePlaytime() });
      noteSaveResult();
      afterFirstSave();
    } catch (e) {
      noteSaveResult(e);
    }
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
      autosave(live().where);
      void flushAutosave();
    } else playClock.show();
  });
  window.addEventListener('pagehide', () => void flushAutosave());
}

/** Saves a manual slot (Standard, Casual; out of battle only). Throws `SlotNotAllowedError` otherwise. */
export async function saveSlot(slot: SlotId): Promise<void> {
  const c = campaign.value;
  const id = campaignId.value;
  if (!c || !id) return;
  if (live().battle) throw new SlotNotAllowedError('in_battle');
  await writeSave(id, slot, { campaign: c, screen: 'camp' }, { now: nowIso(), contentVersion, playtimeDeltaMs: takePlaytime() });
}

function showCampaign(c: CampaignState): void {
  campaign.value = c;
  setAvatar(c.avatar.name, c.avatar.pronoun);
}

const journal = createJournalWriter((e) => log.warn('save', 'journal write failed', e));

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
  const r = guarded(() => applyCampaign(data, c, cmd), null);
  if (!r) return { ok: false, error: 'not_available' }; // invariant violated: the fault screen takes over
  showCampaign(r.campaign);
  const id = campaignId.value;
  if (id) void journal.append(id, { kind: 'command', cmd });
  autosave(live().where);
  return { ok: true, events: r.events };
}

/**
 * Creates and activates a new campaign (save record, checkpoint, first auto-save). Resolves `false` when
 * three campaigns exist (the caller asks the player to delete one first, concept/24-architecture §5.15).
 * The screen and battle side of starting a game is `startNewGame` in flow.ts.
 */
export async function createNewCampaign(settingsIn: BattleSettings, avatar: AvatarSettings): Promise<boolean> {
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
  playClock.reset();
  autosave('worldmap');
  return true;
}

/** Deletes a campaign with all its saves; when it is the active one, the app forgets it too (returns true). */
export async function deleteCampaignData(id: string): Promise<boolean> {
  await Promise.all([saver.flush().catch(() => undefined), journal.flush().catch(() => undefined)]);
  await deleteCampaign(id);
  if (campaignId.value !== id) return false;
  campaignId.value = null;
  campaign.value = null;
  return true;
}

/** Auto-save of the most recently played campaign that has one ("Continue"). */
export async function latestAutoSave(): Promise<SaveRecord | undefined> {
  for (const m of await listCampaigns()) {
    const rec = await readSave(m.id, 'auto');
    if (rec) return rec;
  }
  return undefined;
}

/** Reads a slot of a campaign (default: the active one) after the pending auto-save has landed. */
export async function readSlot(slot: SlotId, id: string | null = campaignId.value): Promise<SaveRecord | undefined> {
  if (!id) return undefined;
  await saver.flush();
  return readSave(id, slot);
}

/**
 * Stores an exported save: overwrites the campaign with the same id or registers it as a new one.
 * Resolves `false` when that would exceed three campaigns.
 */
export async function storeImportedRecord(rec: SaveRecord): Promise<boolean> {
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
  return true;
}

/** Makes a save record the active campaign (journal checkpoint, play clock) and returns its normalized payload. */
export function adoptRecord(rec: SaveRecord, reason: 'load' | 'import'): SavePayload {
  // saves from before a field existed get its default (architecture §8.7)
  const p = { ...rec.payload, campaign: renameLegacyClasses(data, normalizeCampaign(data, rec.payload.campaign)) };
  if (p.battle) p.battle = { ...p.battle, start: renameLegacyBattleClasses(data, p.battle.start) };
  campaignId.value = rec.campaignId;
  playClock.reset();
  showCampaign(p.campaign);
  if (reason === 'import') checkpoint(rec.campaignId, p.campaign, 'import');
  else checkpointOnLoad(rec.campaignId, p.campaign);
  return p;
}
