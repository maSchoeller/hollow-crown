/**
 * The day change of the campaign (story 5.4, architecture §5.6, ADR-2): the app sends the day number, the core counts
 * forwards only. Each new day brings a day packet, at most `balance.day.catchUp` of them for days the player was away;
 * none before the company has met its first lieutenant. Until then the day is not recorded either (`last` stays null), so the
 * first meeting brings a packet for the day it happens on at once (Produktinhaber 2026-10-26). The packets become haunts
 * right here (story 5.5, `haunts.ts`).
 */
import type { GameData } from '../gameData';
import type { CampaignState } from '../state';
import type { CampaignEvent } from './commands';
import { spawnHaunts } from './haunts';

/** Has the company met any lieutenant yet? */
export function metLieutenant(c: CampaignState): boolean {
  return Object.values(c.lieutenants ?? {}).some((l) => l.met);
}

/** Days that get a packet when the clock moves from `last` to `day` (empty when it does not move forwards). */
export function packetDays(last: number | null, day: number, catchUp: number): number[] {
  if (last !== null && day <= last) return [];
  const from = last === null ? day : Math.max(last + 1, day - catchUp + 1);
  const out: number[] = [];
  for (let d = from; d <= day; d++) out.push(d);
  return out;
}

/**
 * Applies `advanceDay` to `c` (a copy): a day that is not newer than the last one changes nothing; before the first lieutenant
 * is met nothing changes either (no event, `last` stays). Each packet day makes its haunts (`spawnHaunts`).
 */
export function advanceDay(data: GameData, c: CampaignState, day: number, events: CampaignEvent[]): void {
  if (c.day.last !== null && day <= c.day.last) return;
  if (!metLieutenant(c)) return;
  const packets = packetDays(c.day.last, day, data.balance.day.catchUp);
  c.day = { last: day, pending: c.day.pending };
  let haunts = 0;
  for (const d of packets) haunts += spawnHaunts(data, c, d, events);
  events.push({ t: 'dayAdvanced', day, packets, haunts });
}
