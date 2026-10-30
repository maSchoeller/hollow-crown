/**
 * Reading a bug report (concept/24-architecture §6.2a): the action trail as lines and the replay checks behind
 * `pnpm report`. Pure functions over the report and the content, so tests can use them.
 */
import { applyCampaign, applyCommand, normalizeCampaign, stateHash, type BattleState, type CampaignState, type GameData } from '../src/core';
import type { BugReport } from '../src/app/report';
import type { TrailEntry } from '../src/app/trail';

export interface ReplayCheck {
  /** `unchecked`: nothing to replay; `failed`: the replay threw; `diverged`: a state differs from what the device had */
  status: 'ok' | 'unchecked' | 'failed' | 'diverged';
  detail: string;
  /** index of the command where it failed or first diverged */
  at?: number;
}

/** JSON with sorted keys: two states are the same whatever order their fields were built in. */
function canonical(v: unknown): string {
  return JSON.stringify(v, (_k, x: unknown) =>
    x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : x,
  );
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * Replays the running battle (start + commands) and compares the state after each command with the checksum the trail
 * recorded for it on the device (entries after the battle's `battleStart`; after a restart the latest entry per index counts).
 */
export function checkBattle(data: GameData, report: Pick<BugReport, 'battle' | 'trail'>): ReplayCheck {
  const b = report.battle;
  if (!b) return { status: 'unchecked', detail: 'no running battle in the report' };
  const trail = report.trail ?? [];
  const startHash = stateHash(b.start);
  const from = trail.findLastIndex((e) => e.kind === 'battleStart' && e.hash === startHash);
  const expected = new Map<number, string>();
  if (from >= 0) {
    for (const e of trail.slice(from + 1)) {
      if (e.kind === 'battleStart') break;
      if (e.kind === 'battle' && e.ok === true && e.hash) expected.set(e.i, e.hash);
    }
  }
  let s: BattleState = b.start;
  let compared = 0;
  for (let i = 0; i < b.commands.length; i++) {
    try {
      s = applyCommand(data, s, b.commands[i]!).state;
    } catch (e) {
      return { status: 'failed', at: i, detail: `command ${i} (${b.commands[i]!.type}) throws: ${message(e)}` };
    }
    const want = expected.get(i);
    if (want === undefined) continue;
    compared++;
    if (want !== stateHash(s)) return { status: 'diverged', at: i, detail: `state after command ${i} (${b.commands[i]!.type}) differs from the device` };
  }
  const note = from < 0 ? ', battle start not in the trail' : '';
  return { status: 'ok', detail: `${b.commands.length} commands replay, ${compared} checked against the trail${note}` };
}

/**
 * Replays the campaign from the journal's last checkpoint and compares the result with the campaign the app held. A checkpoint
 * of the same app version is taken as it is (the device's own object); an older one is normalized first, as a load does.
 */
export function checkCampaign(data: GameData, report: Pick<BugReport, 'checkpoint' | 'journal' | 'campaign' | 'appVersion' | 'trail'>): ReplayCheck {
  const cp = report.checkpoint as { campaign?: CampaignState; appVersion?: string } | null;
  if (!cp?.campaign || !report.campaign) return { status: 'unchecked', detail: 'no checkpoint or campaign in the report' };
  let c = cp.appVersion === report.appVersion ? cp.campaign : normalizeCampaign(data, cp.campaign);
  const seen = new Set((report.trail ?? []).flatMap((e) => (e.kind === 'campaign' && e.ok && e.hash ? [e.hash] : [])));
  let firstUnseen: number | undefined;
  let anySeen = false;
  for (let i = 0; i < report.journal.length; i++) {
    const cmd = report.journal[i]!;
    try {
      c = applyCampaign(data, c, cmd).campaign;
    } catch (e) {
      return { status: 'failed', at: i, detail: `journal command ${i} (${cmd.type}) throws: ${message(e)}` };
    }
    if (seen.has(stateHash(c))) anySeen = true;
    else firstUnseen ??= i;
  }
  if (canonical(c) === canonical(report.campaign)) return { status: 'ok', detail: `${report.journal.length} journal commands replay to the campaign in the report` };
  const hint = anySeen && firstUnseen !== undefined ? `; first command whose result is not in the trail: ${firstUnseen} (${report.journal[firstUnseen]!.type})` : '';
  return { status: 'diverged', at: anySeen ? firstUnseen : undefined, detail: `replayed campaign differs from the one in the report${hint}` };
}

const short = (v: unknown): string => {
  const s = JSON.stringify(v) ?? '';
  return s.length > 160 ? `${s.slice(0, 157)}...` : s;
};

/** The parameters of a command after its type, compactly. */
function args(cmd: Record<string, unknown>): string {
  const { type: _type, ...rest } = cmd;
  return Object.keys(rest).length ? ` ${short(rest)}` : '';
}

function eventTypes(events: Array<{ t: string }> | undefined, count?: number): string {
  if (!events?.length) return '';
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.t, (counts.get(e.t) ?? 0) + 1);
  const list = [...counts].map(([t, n]) => (n > 1 ? `${t}×${n}` : t)).join(', ');
  return ` → ${count ?? events.length} events: ${list}${count ? ' …' : ''}`;
}

const mark = (ok: boolean | 'dropped', error?: string): string => (ok === true ? 'ok' : ok === 'dropped' ? 'DROPPED' : `REFUSED ${error ?? ''}`.trim());

/** One trail entry as a line: time, kind and what happened. */
export function describeEntry(e: TrailEntry): string {
  const time = e.t.slice(11, 19);
  const head = `${time} #${e.n}`;
  switch (e.kind) {
    case 'app':
      return `${head} APP START ${e.appVersion} content ${e.contentVersion} ${short(e.device)}`;
    case 'screen':
      return `${head} screen ${short(e.screen)}`;
    case 'load':
      return `${head} campaign ${e.reason} ${e.campaignId}${e.battle ? ' (with running battle)' : ''}`;
    case 'battleStart':
      return `${head} BATTLE START ${e.node}${e.haunt ? ` haunt ${e.haunt}` : ''} deploy ${e.deploy.join(',')} #${e.hash}`;
    case 'battle':
      return `${head} battle[${e.i}] T${e.turn} ${e.phase} ${e.cmd.type}${args(e.cmd)} ${mark(e.ok, e.error)}${eventTypes(e.events, e.eventCount)}${e.hash ? ` #${e.hash}` : ''}`;
    case 'campaign':
      return `${head} campaign ${String(e.cmd.type)}${args(e.cmd)} ${mark(e.ok, e.error)}${eventTypes(e.events, e.eventCount)}${e.hash ? ` #${e.hash}` : ''}`;
    case 'effects':
      return `${head} dialogue effects ${e.queued ? 'queued' : `REFUSED ${e.error ?? ''}`} ${short(e.effects)}`;
    case 'settings':
      return `${head} settings ${short(e.changed)}`;
    case 'fault':
      return `${head} FAULT ${e.name}${e.code ? ` ${e.code}` : ''}: ${e.message}`;
  }
}
