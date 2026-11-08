/**
 * Campaign journal (concept/24-architecture §5.2): every applied campaign command with a running number,
 * plus checkpoints (full state) where replays begin. Lives in the `journal` store of the save database.
 * Bounded (review 2026-11-07, M2): it serves the bug report and replays from a checkpoint, so a checkpoint
 * drops every entry before the last `keepCheckpoints` checkpoints, and the app writes a `compact` checkpoint
 * after `compactAfter` commands (`balance.journal`).
 */
import type { IDBPObjectStore } from 'idb';
import type { CampaignCommand, CampaignState } from '../core';
import { APP_VERSION, saveDb } from './save';

/**
 * Why a checkpoint was written: a new campaign, a load (the loaded state need not match the journal's end),
 * a load after an app or content update (commands may replay differently), or an import.
 */
export type CheckpointReason = 'new' | 'load' | 'update' | 'import' | 'compact';

/** How much of a campaign's journal stays (`balance.journal`). */
export interface JournalRetention {
  /** checkpoints kept with the commands after them, the newest included (at least 1) */
  keepCheckpoints: number;
}

export type JournalEntry =
  | { campaignId: string; seq: number; kind: 'command'; cmd: CampaignCommand }
  | {
      campaignId: string;
      seq: number;
      kind: 'checkpoint';
      reason: CheckpointReason;
      appVersion: string;
      contentVersion: string;
      campaign: CampaignState;
    };

export type NewJournalEntry =
  | { kind: 'command'; cmd: CampaignCommand }
  | { kind: 'checkpoint'; reason: CheckpointReason; contentVersion: string; campaign: CampaignState };

const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const range = (id: string) => IDBKeyRange.bound([id, -Infinity], [id, Infinity]);

/**
 * Appends one entry with the next running number; returns the stored entry. With `retention`, a checkpoint
 * also deletes the entries before the oldest checkpoint kept (same transaction).
 */
export async function appendJournal(campaignId: string, e: NewJournalEntry, retention?: JournalRetention): Promise<JournalEntry> {
  const tx = (await saveDb()).transaction('journal', 'readwrite');
  const store = tx.objectStore('journal');
  const last = await store.openCursor(range(campaignId), 'prev');
  const seq = last ? (last.value as JournalEntry).seq + 1 : 0;
  const entry: JournalEntry =
    e.kind === 'command'
      ? { campaignId, seq, kind: 'command', cmd: plain(e.cmd) }
      : { campaignId, seq, kind: 'checkpoint', reason: e.reason, appVersion: APP_VERSION, contentVersion: e.contentVersion, campaign: plain(e.campaign) };
  await store.add(entry);
  if (entry.kind === 'checkpoint' && retention) await prune(store, campaignId, Math.max(1, retention.keepCheckpoints));
  await tx.done;
  return entry;
}

type JournalStore = IDBPObjectStore<unknown, ['journal'], 'journal', 'readwrite'>;

/** Deletes everything before the `keep`-th newest checkpoint. */
async function prune(store: JournalStore, campaignId: string, keep: number): Promise<void> {
  let seen = 0;
  let cur = await store.openCursor(range(campaignId), 'prev');
  while (cur) {
    const e = cur.value as JournalEntry;
    if (e.kind === 'checkpoint' && ++seen === keep) {
      if (e.seq > 0) await store.delete(IDBKeyRange.bound([campaignId, -Infinity], [campaignId, e.seq], false, true));
      return;
    }
    cur = await cur.continue();
  }
}

/** Entries of a campaign in order. */
export async function readJournal(campaignId: string): Promise<JournalEntry[]> {
  return (await (await saveDb()).getAll('journal', range(campaignId))) as JournalEntry[];
}

/** The last checkpoint and every command after it: what a replay needs (and the bug report, story 1.7). */
export async function journalSinceCheckpoint(
  campaignId: string,
): Promise<{ checkpoint: Extract<JournalEntry, { kind: 'checkpoint' }>; commands: CampaignCommand[] } | null> {
  const tx = (await saveDb()).transaction('journal');
  const commands: CampaignCommand[] = [];
  let cur = await tx.store.openCursor(range(campaignId), 'prev');
  while (cur) {
    const e = cur.value as JournalEntry;
    if (e.kind === 'checkpoint') return { checkpoint: e, commands: commands.reverse() };
    commands.push(e.cmd);
    cur = await cur.continue();
  }
  return null;
}

/** Whether the campaign's last checkpoint was written by another app or content version. */
export async function needsUpdateCheckpoint(campaignId: string, contentVersion: string): Promise<boolean> {
  const tail = await journalSinceCheckpoint(campaignId);
  return !tail || tail.checkpoint.appVersion !== APP_VERSION || tail.checkpoint.contentVersion !== contentVersion;
}

/**
 * Serial writer: entries keep their order although callers do not wait. A failed write is reported and
 * does not stop later ones (the auto-save still holds the state).
 */
export function createJournalWriter(onError: (e: unknown) => void = (e) => console.warn('journal write failed', e), retention?: JournalRetention) {
  let chain: Promise<unknown> = Promise.resolve();
  return {
    append(campaignId: string, e: NewJournalEntry): Promise<void> {
      const next = chain.then(() => appendJournal(campaignId, e, retention)).then(() => undefined, onError);
      chain = next;
      return next;
    },
    /** Resolves when every queued entry is written. */
    flush(): Promise<void> {
      return chain.then(() => undefined);
    },
  };
}
