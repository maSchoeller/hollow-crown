/**
 * Save games, format 2 (concept/24-architecture §5.15): IndexedDB `hollow-crown` v2 with up to three
 * campaigns, an auto slot + 3 manual slots each, a command journal and the untouched PoC saves (`legacy`).
 */
import { openDB, type IDBPDatabase, type IDBPTransaction } from 'idb';
import type { BattleState, CampaignState, Command, DeathMode, Difficulty } from '../core';

export const SAVE_FORMAT = 2;
export const DB_NAME = 'hollow-crown';
export const DB_VERSION = 2;
export const MAX_CAMPAIGNS = 3;
export type SlotId = 'auto' | '1' | '2' | '3';

export interface SavePayload {
  campaign: CampaignState;
  /** running battle: start snapshot + command log (replayed on load); `turnStartIndex` = log length at the current round's start */
  battle?: { start: BattleState; commands: Command[]; turnStartIndex: number };
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

export class CampaignLimitError extends Error {
  constructor() {
    super('campaign_limit');
  }
}

export const APP_VERSION: string = import.meta.env?.VITE_APP_VERSION ?? '0.1.0';

/** Migrations by from-format (only for saves of released act builds, each with a fixture in tests/fixtures/saves/). */
const migrations: Record<number, (r: SaveRecord) => SaveRecord> = {};

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

let dbp: Promise<IDBPDatabase> | null = null;
function db(): Promise<IDBPDatabase> {
  dbp ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(d, oldVersion, _newVersion, tx) {
      // a failed move must not leave a v2 database without the PoC saves
      upgrade(d, oldVersion, tx as unknown as Tx).catch(() => tx.abort());
    },
    // a newer version opened in another tab: let it upgrade, reconnect on the next access
    blocking(_cur, _next, event) {
      (event.target as IDBDatabase).close();
      dbp = null;
    },
  });
  return dbp;
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
  const tx = (await db()).transaction('campaigns', 'readwrite');
  const store = tx.objectStore('campaigns');
  const all = (await store.getAll()) as CampaignMeta[];
  const existing = id ? all.find((m) => m.id === id) : undefined;
  if (!existing && all.length >= MAX_CAMPAIGNS) {
    tx.abort();
    await tx.done.catch(() => undefined);
    throw new CampaignLimitError();
  }
  const meta: CampaignMeta = {
    id: id ?? crypto.randomUUID(),
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
  const all = (await (await db()).getAll('campaigns')) as CampaignMeta[];
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Removes a campaign with all its saves and journal entries. */
export async function deleteCampaign(id: string): Promise<void> {
  const tx = (await db()).transaction(['campaigns', 'saves', 'journal'], 'readwrite');
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
  const rec: SaveRecord = plain({
    format: SAVE_FORMAT,
    campaignId,
    slot,
    createdAt: opts.now,
    appVersion: APP_VERSION,
    contentVersion: opts.contentVersion,
    payload,
  });
  const tx = (await db()).transaction(['campaigns', 'saves'], 'readwrite');
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
  const r = (await (await db()).get('saves', [campaignId, slot])) as SaveRecord | undefined;
  return r ? migrate(r) : undefined;
}

export async function listSaves(campaignId: string): Promise<SaveRecord[]> {
  const range = IDBKeyRange.bound([campaignId], [campaignId, []]);
  return ((await (await db()).getAll('saves', range)) as SaveRecord[]).map(migrate);
}

export async function deleteSave(campaignId: string, slot: SlotId): Promise<void> {
  await (await db()).delete('saves', [campaignId, slot]);
}

/** PoC saves found at the upgrade to v2. */
export async function listLegacy(): Promise<LegacyRecord[]> {
  return (await (await db()).getAll('legacy')) as LegacyRecord[];
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

/** Reads an exported save. Throws `format`, `checksum`, `legacy` (PoC save, not loadable) or `content`. */
export function importSave(text: string): SaveRecord {
  const outer = JSON.parse(text) as { format?: string; checksum?: string; body?: string };
  if (outer.format !== 'hollow-crown-save' || typeof outer.body !== 'string') throw new Error('format');
  if (checksum(outer.body) !== outer.checksum) throw new Error('checksum');
  const rec = JSON.parse(outer.body) as Partial<SaveRecord> & { version?: number };
  if (rec.version === 1) throw new Error('legacy');
  if (typeof rec.format !== 'number' || typeof rec.campaignId !== 'string' || !rec.payload?.campaign?.roster)
    throw new Error('content');
  return migrate(rec as SaveRecord);
}
