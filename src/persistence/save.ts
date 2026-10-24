/**
 * Save games, format 2 (concept/24-architecture §5.15): IndexedDB `hollow-crown` v2 with up to three
 * campaigns, an auto slot + 3 manual slots each, a command journal and the untouched PoC saves (`legacy`).
 */
import { openDB, type IDBPDatabase, type IDBPTransaction } from 'idb';
import { saveRecordSchema } from './schema';
import type { BattleState, CampaignState, Command, DeathMode, Difficulty, QueuedEffects } from '../core';

export const SAVE_FORMAT = 2;
export const DB_NAME = 'hollow-crown';
export const DB_VERSION = 2;
export const MAX_CAMPAIGNS = 3;
/** Largest save file an import reads (architecture 5.15). */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export type SlotId = 'auto' | '1' | '2' | '3';

export interface SavePayload {
  campaign: CampaignState;
  /**
   * running battle: start snapshot + command log (replayed on load); `turnStartIndex` = log length at the current round's start;
   * `effects` = dialogue effects queued during the battle, applied by `finishMission` (absent in older saves = none)
   */
  battle?: { start: BattleState; commands: Command[]; turnStartIndex: number; effects?: QueuedEffects[] };
  /** where to resume */
  screen: 'worldmap' | 'camp' | 'battle';
}

export interface SaveRecord {
  format: 2;
  campaignId: string;
  slot: SlotId;
  createdAt: string;
  appVersion: string;
  contentVersion: string;
  payload: SavePayload;
}

export interface CampaignMeta {
  id: string;
  name: string;
  /** avatar portrait id */
  avatar: string;
  deathMode: DeathMode;
  difficulty: Difficulty;
  act: number;
  /** completed story nodes */
  progress: number;
  playtimeMs: number;
  contentVersion: string;
  createdAt: string;
  updatedAt: string;
}

/** Proof-of-concept save (format 1), kept as found: exportable, never loaded (AR17). */
export interface LegacyRecord {
  slot: SlotId;
  version: 1;
  createdAt: string;
  appVersion: string;
  payload: { campaign: CampaignState; battle?: { start: BattleState; commands: Command[] }; screen: string };
}

/** A manual slot was refused: Classic saves only automatically, and nothing is saved by hand during a battle. */
export class SlotNotAllowedError extends Error {
  constructor(readonly reason: 'classic' | 'in_battle') {
    super(`slot_${reason}`);
  }
}

export class CampaignLimitError extends Error {
  constructor() {
    super('campaign_limit');
  }
}

export const APP_VERSION: string = import.meta.env?.VITE_APP_VERSION ?? '0.1.0';

/**
 * Migrations by from-format (only for saves of released act builds). Each needs a fixture `format<n>-*.json` in
 * tests/fixtures/saves/ written by the release it migrates from; `tests/unit/migrations.test.ts` fails without one.
 * A migration that follows a rename reads `content/renames.yaml` through `renamedId` (src/content/ids.ts, story 7.4).
 */
const migrations: Record<number, (r: SaveRecord) => SaveRecord> = {};

/** From-formats that have a migration (for the fixture test). */
export const migrationFormats = (): number[] => Object.keys(migrations).map(Number);

type Tx = IDBPTransaction<unknown, string[], 'versionchange'>;

/** v0/v1 → v2. Format-1 records move unchanged from the old `saves` store to `legacy`. */
async function upgrade(d: IDBPDatabase, oldVersion: number, tx: Tx): Promise<void> {
  let old: unknown[] = [];
  if (oldVersion === 1) {
    old = await tx.objectStore('saves').getAll();
    d.deleteObjectStore('saves');
  }
  d.createObjectStore('campaigns', { keyPath: 'id' });
  d.createObjectStore('saves', { keyPath: ['campaignId', 'slot'] });
  d.createObjectStore('journal', { keyPath: ['campaignId', 'seq'] });
  const legacy = d.createObjectStore('legacy', { keyPath: 'slot' });
  for (const r of old) await tx.objectStore(legacy.name).put(r);
}

let onBlocked: () => void = () => console.warn('save database upgrade blocked by another tab');
/** Called when an older tab (e.g. the PoC build) keeps the upgrade to v2 waiting; the app shows a hint. */
export function setSaveDbBlockedHandler(fn: () => void): void {
  onBlocked = fn;
}

let dbp: Promise<IDBPDatabase> | null = null;
/** The save database connection (shared with the journal). */
export function saveDb(): Promise<IDBPDatabase> {
  dbp ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(d, oldVersion, _newVersion, tx) {
      // a failed move must not leave a v2 database without the PoC saves
      upgrade(d, oldVersion, tx as unknown as Tx).catch(() => {
        try {
          tx.abort();
        } catch {
          /* already aborted by the failed request */
        }
      });
    },
    blocked() {
      onBlocked();
    },
    // a newer version opened in another tab: let it upgrade, reconnect on the next access
    blocking(_cur, _next, event) {
      (event.target as IDBDatabase).close();
      dbp = null;
    },
  }).catch((e: unknown) => {
    // retry on the next access instead of failing until reload
    dbp = null;
    throw e;
  });
  return dbp;
}

/** `crypto.randomUUID` only exists in secure contexts (not on http://<LAN-IP> during phone tests). */
function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Closes the connection (tests, or before deleting the database). */
export async function closeSaveDb(): Promise<void> {
  const p = dbp;
  dbp = null;
  if (p) (await p).close();
}

const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function migrate(rec: SaveRecord): SaveRecord {
  let r = rec;
  while (r.format < SAVE_FORMAT) {
    const m = migrations[r.format];
    if (!m) throw new Error('migration');
    r = m(r);
  }
  return r;
}

/** Meta fields derived from the campaign state on every save. */
export function metaFromCampaign(
  c: CampaignState,
): Pick<CampaignMeta, 'name' | 'avatar' | 'deathMode' | 'difficulty' | 'act' | 'progress'> {
  // acts arrive with Epic 4; until then the whole PoC campaign counts as act 1
  return {
    name: c.avatar.name,
    avatar: c.avatar.portrait,
    deathMode: c.settings.deathMode,
    difficulty: c.settings.difficulty,
    act: 1,
    progress: c.completed.length,
  };
}

export interface NewCampaignMeta {
  campaign: CampaignState;
  now: string;
  contentVersion: string;
  /** reuse an id (import overwrites the campaign with the same id) */
  id?: string;
}

/** Registers a campaign. Throws `CampaignLimitError` when three exist and `id` is not one of them. */
export async function createCampaign({ campaign, now, contentVersion, id }: NewCampaignMeta): Promise<CampaignMeta> {
  const tx = (await saveDb()).transaction('campaigns', 'readwrite');
  const store = tx.objectStore('campaigns');
  const all = (await store.getAll()) as CampaignMeta[];
  const existing = id ? all.find((m) => m.id === id) : undefined;
  if (!existing && all.length >= MAX_CAMPAIGNS) {
    tx.abort();
    await tx.done.catch(() => undefined);
    throw new CampaignLimitError();
  }
  const meta: CampaignMeta = {
    id: id ?? newId(),
    ...metaFromCampaign(campaign),
    playtimeMs: existing?.playtimeMs ?? 0,
    contentVersion,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await store.put(meta);
  await tx.done;
  return meta;
}

/** Campaigns, most recently played first. */
export async function listCampaigns(): Promise<CampaignMeta[]> {
  const all = (await (await saveDb()).getAll('campaigns')) as CampaignMeta[];
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Removes a campaign with all its saves and journal entries. */
export async function deleteCampaign(id: string): Promise<void> {
  const tx = (await saveDb()).transaction(['campaigns', 'saves', 'journal'], 'readwrite');
  const range = IDBKeyRange.bound([id], [id, []]);
  await Promise.all([
    tx.objectStore('campaigns').delete(id),
    tx.objectStore('saves').delete(range),
    tx.objectStore('journal').delete(range),
    tx.done,
  ]);
}

export interface WriteOptions {
  now: string;
  contentVersion: string;
  /** play time added since the last save */
  playtimeDeltaMs?: number;
}

/** Writes a slot and refreshes the campaign meta in one transaction. */
export async function writeSave(
  campaignId: string,
  slot: SlotId,
  payload: SavePayload,
  opts: WriteOptions,
): Promise<SaveRecord> {
  if (slot !== 'auto') {
    if (payload.campaign.settings.deathMode === 'classic') throw new SlotNotAllowedError('classic');
    if (payload.battle) throw new SlotNotAllowedError('in_battle');
  }
  const rec: SaveRecord = plain({
    format: SAVE_FORMAT,
    campaignId,
    slot,
    createdAt: opts.now,
    appVersion: APP_VERSION,
    contentVersion: opts.contentVersion,
    payload,
  });
  const tx = (await saveDb()).transaction(['campaigns', 'saves'], 'readwrite');
  const meta = (await tx.objectStore('campaigns').get(campaignId)) as CampaignMeta | undefined;
  if (!meta) {
    tx.abort();
    await tx.done.catch(() => undefined);
    throw new Error('campaign_missing');
  }
  const next: CampaignMeta = {
    ...meta,
    ...metaFromCampaign(payload.campaign),
    playtimeMs: meta.playtimeMs + Math.max(0, opts.playtimeDeltaMs ?? 0),
    contentVersion: opts.contentVersion,
    updatedAt: opts.now,
  };
  await Promise.all([tx.objectStore('saves').put(rec), tx.objectStore('campaigns').put(next), tx.done]);
  return rec;
}

export async function readSave(campaignId: string, slot: SlotId): Promise<SaveRecord | undefined> {
  const r = (await (await saveDb()).get('saves', [campaignId, slot])) as SaveRecord | undefined;
  return r ? migrate(r) : undefined;
}

export async function listSaves(campaignId: string): Promise<SaveRecord[]> {
  const range = IDBKeyRange.bound([campaignId], [campaignId, []]);
  return ((await (await saveDb()).getAll('saves', range)) as SaveRecord[]).map(migrate);
}

export async function deleteSave(campaignId: string, slot: SlotId): Promise<void> {
  await (await saveDb()).delete('saves', [campaignId, slot]);
}

/** PoC saves found at the upgrade to v2. */
export async function listLegacy(): Promise<LegacyRecord[]> {
  return (await (await saveDb()).getAll('legacy')) as LegacyRecord[];
}

/** FNV-1a over a string, hex. */
export function checksum(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

/** Content version until packs carry one (Epic 7): checksum of the loaded content. */
export function contentVersionOf(data: unknown): string {
  return checksum(JSON.stringify(data));
}

export function exportSave(rec: SaveRecord | LegacyRecord): string {
  const body = JSON.stringify(rec);
  return JSON.stringify({ format: 'hollow-crown-save', checksum: checksum(body), body });
}

/** Reads an exported save. Throws `size`, `format`, `checksum`, `legacy` (PoC save, not loadable) or `content`. */
export function importSave(text: string): SaveRecord {
  if (text.length > MAX_IMPORT_BYTES) throw new Error('size');
  let outer: { format?: string; checksum?: string; body?: string };
  try {
    outer = JSON.parse(text) as typeof outer;
  } catch {
    throw new Error('format');
  }
  if (outer.format !== 'hollow-crown-save' || typeof outer.body !== 'string') throw new Error('format');
  if (checksum(outer.body) !== outer.checksum) throw new Error('checksum');
  let rec: Partial<SaveRecord> & { version?: number };
  try {
    rec = JSON.parse(outer.body) as typeof rec;
  } catch {
    throw new Error('format');
  }
  if (rec.version === 1) throw new Error('legacy');
  if (!saveRecordSchema.safeParse(rec).success) throw new Error('content');
  return migrate(rec as SaveRecord);
}
