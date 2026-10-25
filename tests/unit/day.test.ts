import { describe, expect, it } from 'vitest';
import { applyCampaign, newCampaign, normalizeCampaign, packetDays, replayCampaign, validateCampaign, type CampaignCommand, type CampaignState } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { dayNumber } from '../../src/app/day';

const { data } = loadContentFromDisk();
const fresh = (): CampaignState => newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' } as never, { name: 'Rhen', portrait: 'avatar_a' } as never);
const met = (c: CampaignState): CampaignState => ({ ...c, lieutenants: { hask: { met: true, encounters: 1, grudge: 0, routs: 0, signatureDropped: 0 } } });
const advance = (c: CampaignState, day: number) => applyCampaign(data, c, { type: 'advanceDay', day });

describe('day change in the core (story 5.4)', () => {
  it('starts without a day and fills it in for old saves', () => {
    expect(fresh().day).toEqual({ last: null, pending: [] });
    const { day: _day, ...old } = fresh();
    expect(normalizeCampaign(data, old as CampaignState).day).toEqual({ last: null, pending: [] });
  });

  it('makes no day packet before the first lieutenant, but moves the day on', () => {
    const r = advance(fresh(), 100);
    expect(r.campaign.day).toEqual({ last: 100, pending: [] });
    expect(r.events).toContainEqual({ t: 'dayAdvanced', day: 100, packets: [], haunts: 0 });
  });

  it('brings one packet per new day, at most catchUp for days away', () => {
    expect(data.balance.day.catchUp).toBe(3);
    let c = advance(met(fresh()), 100).campaign;
    expect(c.day.pending).toEqual([100]);
    c = advance(c, 101).campaign;
    expect(c.day.pending).toEqual([100, 101]);
    // a week away: only the last three days
    c = advance(c, 108).campaign;
    expect(c.day).toEqual({ last: 108, pending: [100, 101, 106, 107, 108] });
  });

  it('does nothing when the clock goes back or stays (a turned-back clock brings nothing)', () => {
    const c = advance(met(fresh()), 100).campaign;
    for (const day of [100, 99, 3]) {
      const r = advance(c, day);
      expect(r.campaign.day).toEqual(c.day);
      expect(r.events.filter((e) => e.t === 'dayAdvanced')).toEqual([]);
    }
  });

  it('rejects a day number that is no whole day', () => {
    expect(validateCampaign(data, fresh(), { type: 'advanceDay', day: 1.5 })).toBe('invalid_day');
    expect(validateCampaign(data, fresh(), { type: 'advanceDay', day: -1 })).toBe('invalid_day');
  });

  it('replays from the journal to the same day state', () => {
    const start = met(fresh());
    const log: CampaignCommand[] = [100, 102, 90, 109].map((day) => ({ type: 'advanceDay', day }));
    let c = start;
    for (const cmd of log) c = applyCampaign(data, c, cmd).campaign;
    expect(replayCampaign(data, start, log).day).toEqual(c.day);
  });

  it('counts the packet days', () => {
    expect(packetDays(null, 50, 3)).toEqual([50]);
    expect(packetDays(49, 50, 3)).toEqual([50]);
    expect(packetDays(40, 50, 3)).toEqual([48, 49, 50]);
    expect(packetDays(50, 50, 3)).toEqual([]);
  });
});

describe('day number (src/app/day.ts)', () => {
  // the test process runs in Europe/Berlin so summer time applies (vitest runs each file in its own process)
  process.env.TZ = 'Europe/Berlin';
  const at = (iso: string) => new Date(iso).getTime();

  it('changes at 04:00 local time', () => {
    const d = dayNumber(at('2026-07-10T03:59:00+02:00'));
    expect(dayNumber(at('2026-07-10T04:00:00+02:00'))).toBe(d + 1);
    expect(dayNumber(at('2026-07-11T03:00:00+02:00'))).toBe(d + 1);
  });

  it('is not moved by the change to and from summer time', () => {
    // 2026-03-29: clocks go from 02:00 to 03:00; 2026-10-25: from 03:00 back to 02:00
    const before = dayNumber(at('2026-03-28T12:00:00+01:00'));
    expect(dayNumber(at('2026-03-29T03:30:00+02:00'))).toBe(before); // still the night of the 28th
    expect(dayNumber(at('2026-03-29T04:00:00+02:00'))).toBe(before + 1);
    expect(dayNumber(at('2026-03-30T04:00:00+02:00'))).toBe(before + 2);
    const autumn = dayNumber(at('2026-10-24T12:00:00+02:00'));
    expect(dayNumber(at('2026-10-25T02:30:00+01:00'))).toBe(autumn);
    expect(dayNumber(at('2026-10-25T03:59:00+01:00'))).toBe(autumn);
    expect(dayNumber(at('2026-10-25T04:00:00+01:00'))).toBe(autumn + 1);
    expect(dayNumber(at('2026-10-26T04:00:00+01:00'))).toBe(autumn + 2);
  });

  it('follows the reset hour', () => {
    const t = at('2026-07-10T05:00:00+02:00');
    expect(dayNumber(t, 6)).toBe(dayNumber(t, 4) - 1);
  });
});
