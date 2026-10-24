/**
 * Bug report (concept/24-architecture §6.1): one JSON file with everything needed to replay what happened.
 * Built only on the device and shared by the player; nothing is sent anywhere.
 */
import { CoreInvariantError, type BattleState, type CampaignCommand, type CampaignState, type Command } from '../core';
import { LOG_CAPACITY, type LogEntry } from './log';

export const REPORT_FORMAT = 'hollow-crown-bug-report';

export interface ReportInput {
  now: string;
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
}

export interface BugReport {
  format: typeof REPORT_FORMAT;
  createdAt: string;
  appVersion: string;
  contentVersion: string;
  device: ReportInput['device'];
  error: { name: string; message: string; code?: string; details?: unknown; stack?: string };
  campaignId: string | null;
  campaign: CampaignState | null;
  checkpoint: unknown;
  journal: CampaignCommand[];
  battle: { start: BattleState; commands: Command[] } | null;
  log: LogEntry[];
}

export function describeError(e: unknown): BugReport['error'] {
  if (e instanceof CoreInvariantError) {
    return { name: e.name, message: e.message, code: e.code, details: e.details, stack: e.stack };
  }
  if (e instanceof Error) return { name: e.name, message: e.message, stack: e.stack };
  return { name: 'Unknown', message: String(e) };
}

export function assembleReport(i: ReportInput): BugReport {
  return {
    format: REPORT_FORMAT,
    createdAt: i.now,
    appVersion: i.appVersion,
    contentVersion: i.contentVersion,
    device: i.device,
    error: describeError(i.error),
    campaignId: i.campaignId,
    campaign: i.campaign,
    checkpoint: i.journal?.checkpoint ?? null,
    journal: i.journal?.commands ?? [],
    battle: i.battle,
    log: i.log.slice(-LOG_CAPACITY),
  };
}
