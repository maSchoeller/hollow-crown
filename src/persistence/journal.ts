/**
 * Campaign journal (concept/24-architecture §5.2): every applied campaign command with a running number,
 * plus checkpoints (full state) where replays begin. Lives in the `journal` store of the save database.
 */
import type { CampaignCommand, CampaignState } from '../core';
import { APP_VERSION, saveDb } from './save';

/**
 * Why a checkpoint was written: a new campaign, a load (the loaded state need not match the journal's end),
 * a load after an app or content update (commands may replay differently), or an import.
 */
export type CheckpointReason = 'new' | 'load' | 'update' | 'import';

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

/** Appends one entry with the next running number; returns the stored entry. */
export async function appendJournal(campaignId: string, e: NewJournalEntry): Promise<JournalEntry> {
  const tx = (await saveDb()).transaction('journal', 'readwrite');
  const store = tx.objectStore('journal');
  const last = await store.openCursor(range(campaignId), 'prev');
  const seq = last ? (last.value as JournalEntry).seq + 1 : 0;
  const entry: JournalEntry =
    e.kind === 'command'
      ? { campaignId, seq, kind: 'command', cmd: plain(e.cmd) }
      : { campaignId, seq, kind: 'checkpoint', reason: e.reason, appVersion: APP_VERSION, contentVersion: e.contentVersion, campaign: plain(e.campaign) };
  await Promise.all([store.add(entry), tx.done]);
  return entry;
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
export function createJournalWriter(onError: (e: unknown) => void = (e) => console.warn('journal write failed', e)) {
  let chain: Promise<unknown> = Promise.resolve();
  return {
    append(campaignId: string, e: NewJournalEntry): Promise<void> {
      const next = chain.then(() => appendJournal(campaignId, e)).then(() => undefined, onError);
      chain = next;
      return next;
    },
    /** Resolves when every queued entry is written. */
    flush(): Promise<void> {
      return chain.then(() => undefined);
    },
  };
}
