/**
 * Bug report (concept/24-architecture §6.1, version 2 in §6.2a): one JSON file with everything needed to replay what
 * happened and the action trail that says it in order. Built only on the device and shared by the player; nothing is
 * sent anywhere. `pnpm report <file>` reads it.
 */
import { CoreInvariantError, type BattleState, type CampaignCommand, type CampaignState, type Command } from '../core';
import { LOG_CAPACITY, type LogEntry } from './log';
import { compactCommand, type TrailEntry } from './trail';

export const REPORT_FORMAT = 'hollow-crown-bug-report';
export const REPORT_VERSION = 2;

/** Why the report was made: the fault screen, or the player from the options ("Fehler melden"). */
export type ReportReason = 'fault' | 'manual';

/** A journal entry as the report's history shows it: checkpoints without their state, commands without battle logs. */
export type HistoryEntry =
  | { seq: number; kind: 'checkpoint'; reason: string; appVersion: string; contentVersion: string }
  | { seq: number; kind: 'command'; cmd: Record<string, unknown> };

/** The shape of a journal entry the history needs (`src/persistence/journal.ts`). */
export type JournalLike =
  | { seq: number; kind: 'command'; cmd: CampaignCommand }
  | { seq: number; kind: 'checkpoint'; reason: string; appVersion: string; contentVersion: string };

export interface ReportInput {
  now: string;
  reason?: ReportReason;
  /** what the player wrote about it */
  note?: string;
  /** the screen showing (simple parameters, see `screenInfo`) */
  screen?: Record<string, unknown> | null;
  appVersion: string;
  contentVersion: string;
  device: { userAgent: string; quality: string; [k: string]: unknown };
  error: unknown;
  campaignId: string | null;
  /** the campaign as the app holds it now */
  campaign: CampaignState | null;
  /** last journal checkpoint and the campaign commands after it, if the journal could be read */
  journal: { checkpoint: unknown; commands: CampaignCommand[] } | null;
  /** the running battle: start state and command log */
  battle: { start: BattleState; commands: Command[] } | null;
  log: LogEntry[];
  /** the whole journal of the campaign, if it could be read */
  history?: readonly JournalLike[] | null;
  trail?: TrailEntry[];
}

export interface BugReport {
  format: typeof REPORT_FORMAT;
  version: typeof REPORT_VERSION;
  reason: ReportReason;
  note: string;
  createdAt: string;
  appVersion: string;
  contentVersion: string;
  device: ReportInput['device'];
  /** `null` when the player reports without a fault */
  error: { name: string; message: string; code?: string; details?: unknown; stack?: string } | null;
  screen: Record<string, unknown> | null;
  campaignId: string | null;
  campaign: CampaignState | null;
  checkpoint: unknown;
  journal: CampaignCommand[];
  battle: { start: BattleState; commands: Command[] } | null;
  history: HistoryEntry[];
  trail: TrailEntry[];
  log: LogEntry[];
}

export function describeError(e: unknown): NonNullable<BugReport['error']> {
  if (e instanceof CoreInvariantError) {
    return { name: e.name, message: e.message, code: e.code, details: e.details, stack: e.stack };
  }
  if (e instanceof Error) return { name: e.name, message: e.message, stack: e.stack };
  return { name: 'Unknown', message: String(e) };
}

export function historyOf(journal: readonly JournalLike[]): HistoryEntry[] {
  return journal.map((e) =>
    e.kind === 'command'
      ? { seq: e.seq, kind: 'command', cmd: compactCommand(e.cmd) }
      : { seq: e.seq, kind: 'checkpoint', reason: e.reason, appVersion: e.appVersion, contentVersion: e.contentVersion },
  );
}

export function assembleReport(i: ReportInput): BugReport {
  return {
    format: REPORT_FORMAT,
    version: REPORT_VERSION,
    reason: i.reason ?? 'fault',
    note: i.note?.trim() ?? '',
    createdAt: i.now,
    appVersion: i.appVersion,
    contentVersion: i.contentVersion,
    device: i.device,
    error: i.error === null || i.error === undefined ? null : describeError(i.error),
    screen: i.screen ?? null,
    campaignId: i.campaignId,
    campaign: i.campaign,
    checkpoint: i.journal?.checkpoint ?? null,
    journal: i.journal?.commands ?? [],
    battle: i.battle,
    history: i.history ? historyOf(i.history) : [],
    trail: i.trail ?? [],
    log: i.log.slice(-LOG_CAPACITY),
  };
}
