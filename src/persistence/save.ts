/** Save games in IndexedDB: auto slot + 3 manual slots, versioned, export/import (concept/10 §6). */
import { openDB, type IDBPDatabase } from 'idb';
import type { BattleState, CampaignState, Command } from '../core';

export const SAVE_FORMAT = 1;
export type SlotId = 'auto' | '1' | '2' | '3';

export interface SavePayload {
  campaign: CampaignState;
  /** running battle: start snapshot + command log (replayed on load) */
  battle?: { start: BattleState; commands: Command[] };
  /** where to resume */
  screen: 'worldmap' | 'camp' | 'battle';
}

export interface SaveRecord {
  slot: SlotId;
  version: number;
  createdAt: string;
  appVersion: string;
  payload: SavePayload;
}

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.1.0';

/** Migrations by from-version (none yet). */
const migrations: Record<number, (p: unknown) => unknown> = {};

let dbp: Promise<IDBPDatabase> | null = null;
function db(): Promise<IDBPDatabase> {
  dbp ??= openDB('hollow-crown', 1, {
    upgrade(d) {
      d.createObjectStore('saves', { keyPath: 'slot' });
    },
  });
  return dbp;
}

export function migrate(rec: SaveRecord): SaveRecord {
  let r = rec;
  while (r.version < SAVE_FORMAT) {
    const m = migrations[r.version];
    r = { ...r, payload: (m ? m(r.payload) : r.payload) as SavePayload, version: r.version + 1 };
  }
  return r;
}

export async function writeSave(slot: SlotId, payload: SavePayload, now: string): Promise<void> {
  const rec: SaveRecord = { slot, version: SAVE_FORMAT, createdAt: now, appVersion: APP_VERSION, payload };
  await (await db()).put('saves', JSON.parse(JSON.stringify(rec)));
}

export async function readSave(slot: SlotId): Promise<SaveRecord | undefined> {
  const r = (await (await db()).get('saves', slot)) as SaveRecord | undefined;
  return r ? migrate(r) : undefined;
}

export async function listSaves(): Promise<SaveRecord[]> {
  return ((await (await db()).getAll('saves')) as SaveRecord[]).map(migrate);
}

export async function deleteSave(slot: SlotId): Promise<void> {
  await (await db()).delete('saves', slot);
}

function checksum(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

export function exportSave(rec: SaveRecord): string {
  const body = JSON.stringify(rec);
  return JSON.stringify({ format: 'hollow-crown-save', checksum: checksum(body), body });
}

export function importSave(text: string): SaveRecord {
  const outer = JSON.parse(text) as { format?: string; checksum?: string; body?: string };
  if (outer.format !== 'hollow-crown-save' || typeof outer.body !== 'string') throw new Error('format');
  if (checksum(outer.body) !== outer.checksum) throw new Error('checksum');
  const rec = JSON.parse(outer.body) as SaveRecord;
  if (typeof rec.version !== 'number' || !rec.payload?.campaign?.roster) throw new Error('content');
  return migrate(rec);
}
