/** Fixed support pairs (story 4.9): pairs as content, S only for core pairs, the campfire allows C and B in act 1. */
import { beforeAll, describe, expect, it } from 'vitest';
import { buildContent } from '../../src/content/load';
import type { Locales } from '../../src/content/load';
import { loadContentFromDisk, readContentFiles } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import {
  addSupportPoints,
  applyCampaign,
  availableSupportTalks,
  campfireMaxRank,
  maxRank,
  newCampaign,
  normalizeCampaign,
  pendingRank,
  supportTalk,
  supportTalksOf,
  unlockableRank,
  validateCampaign,
  type CampaignState,
  type GameData,
} from '../../src/core';
import { clone } from '../../src/core/util';

let data: GameData;
let locales: Locales;

const fresh = (): CampaignState => newCampaign(data, 4, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const th = () => data.balance.supports.thresholds;

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

describe('supports.yaml', () => {
  it('holds the eight pairs of act 1, four of them core pairs (narrative)', () => {
    expect(Object.keys(data.supports).sort()).toEqual(['avatar|kael', 'avatar|liora', 'brenna|kael', 'brenna|tobin', 'brenna|varek', 'fenn|mira', 'liora|ysolde', 'mira|tobin']);
    expect(Object.values(data.supports).filter((p) => p.core).map((p) => p.key).sort()).toEqual(['avatar|kael', 'avatar|liora', 'brenna|kael', 'brenna|tobin']);
    expect(data.supports['avatar|kael']!.talks).toEqual({ C: 'scn.support.avatar_kael.C', B: 'scn.support.avatar_kael.B', A: 'scn.support.avatar_kael.A', S: 'scn.support.avatar_kael.S' });
  });

  it('a new campaign starts every pair at zero; pairs added later get an entry when a save loads', () => {
    const c = fresh();
    expect(Object.keys(c.supports).sort()).toEqual(Object.keys(data.supports).sort());
    expect(c.supports['brenna|kael']).toEqual({ points: 0, rank: null });
    const old = clone(c);
    delete old.supports['mira|tobin'];
    old.supports['brenna|kael'] = { points: 12, rank: 'C' };
    const n = normalizeCampaign(data, old);
    expect(n.supports['mira|tobin']).toEqual({ points: 0, rank: null });
    expect(n.supports['brenna|kael']).toEqual({ points: 12, rank: 'C' });
  });

  it('the loader keys pairs by pairKey and refuses a pair listed twice', () => {
    const files = readContentFiles();
    const twice = buildContent({ ...files, 'content/acts/act2/supports.yaml': [{ pair: ['tobin', 'brenna'] }] });
    expect(twice.issues).toContainEqual({ file: 'acts/act2/supports.yaml', message: 'support pair brenna|tobin is listed twice' });
  });
});

describe('ranks and thresholds (C 10, B 25, A 45, S 70)', () => {
  it('uses the GDD thresholds', () => {
    expect(th()).toEqual({ C: 10, B: 25, A: 45, S: 70 });
  });

  it('S only for core pairs: the others stop at A and their points stop growing there', () => {
    expect(maxRank(data, 'brenna|kael')).toBe('S');
    expect(maxRank(data, 'mira|tobin')).toBe('A');
    expect(maxRank(data, 'enemy|pair')).toBe('S'); // pairs a map sets for a battle are no fixed pairs
    const s = { 'mira|tobin': { points: 50, rank: 'A' as const }, 'brenna|kael': { points: 50, rank: 'A' as const } };
    expect(addSupportPoints(data, s, 'mira|tobin', 5)).toBe(0);
    expect(s['mira|tobin'].points).toBe(50);
    expect(addSupportPoints(data, s, 'brenna|kael', 30)).toBe(20);
    expect(s['brenna|kael'].points).toBe(th().S);
    expect(pendingRank(data, { points: 70, rank: 'A' }, 'mira|tobin')).toBeNull();
    expect(pendingRank(data, { points: 70, rank: 'A' }, 'brenna|kael')).toBe('S');
  });

  it('points pile up at the threshold of the next rank until it is unlocked', () => {
    const s = { 'brenna|kael': { points: 0, rank: null } };
    expect(addSupportPoints(data, s, 'brenna|kael', 30)).toBe(th().C);
    expect(pendingRank(data, s['brenna|kael'], 'brenna|kael')).toBe('C');
  });
});

describe('the campfire of act 1 allows C and B', () => {
  const at = (key: string, points: number, rank: CampaignState['supports'][string]['rank']) => {
    const c = fresh();
    c.supports[key] = { points, rank };
    return c;
  };

  it('campfireMaxRank follows the campfire level (balance.yaml): camp = B, later levels A and S', () => {
    const c = fresh();
    expect(campfireMaxRank(data, c)).toBe('B');
    c.home.rooms.campfire = 2;
    expect(campfireMaxRank(data, c)).toBe('A');
    c.home.rooms.campfire = 3;
    expect(campfireMaxRank(data, c)).toBe('S');
    c.home.rooms.campfire = 9;
    expect(campfireMaxRank(data, c)).toBe('S');
  });

  it('a talk is ready at C and B, A only with campfire level 2', () => {
    expect(supportTalk(data, at('brenna|kael', th().C, null), 'brenna|kael')).toEqual({ key: 'brenna|kael', rank: 'C', dialogue: 'scn.support.brenna_kael.C' });
    expect(supportTalk(data, at('brenna|kael', th().B, 'C'), 'brenna|kael')).toEqual({ key: 'brenna|kael', rank: 'B', dialogue: 'scn.support.brenna_kael.B' });
    const a = at('brenna|kael', th().A, 'B');
    expect(unlockableRank(data, a, 'brenna|kael')).toBeNull();
    expect(supportTalk(data, a, 'brenna|kael')).toBeNull();
    a.home.rooms.campfire = 2;
    expect(unlockableRank(data, a, 'brenna|kael')).toBe('A');
    expect(supportTalk(data, a, 'brenna|kael')).toEqual({ key: 'brenna|kael', rank: 'A', dialogue: 'scn.support.brenna_kael.A' }); // story 9.13
  });

  it('no talk without both companions in the company or without a scene', () => {
    expect(supportTalk(data, at('mira|tobin', th().C, null), 'mira|tobin')).toBeNull(); // Mira has not joined
    expect(supportTalk(data, at('liora|ysolde', th().C, null), 'liora|ysolde')).toBeNull();
  });

  it('unlockSupport follows the same rule', () => {
    expect(validateCampaign(data, at('brenna|kael', th().B, 'C'), { type: 'unlockSupport', pair: 'brenna|kael' })).toBeNull();
    expect(validateCampaign(data, at('brenna|kael', th().A, 'B'), { type: 'unlockSupport', pair: 'brenna|kael' })).toBe('not_available');
    expect(validateCampaign(data, at('brenna|kael', 5, null), { type: 'unlockSupport', pair: 'brenna|kael' })).toBe('not_available');
    const r = applyCampaign(data, at('brenna|kael', th().B, 'C'), { type: 'unlockSupport', pair: 'brenna|kael' });
    expect(r.campaign.supports['brenna|kael']!.rank).toBe('B');
    expect(r.events).toContainEqual({ t: 'supportUnlocked', pair: 'brenna|kael', rank: 'B' });
  });

  it('"Gespräche bereit": the camp counts the ready talks, the troop each member\'s', () => {
    const c = at('brenna|kael', th().C, null);
    c.supports['brenna|tobin'] = { points: th().C, rank: null };
    expect(availableSupportTalks(data, c).map((x) => x.key).sort()).toEqual(['brenna|kael', 'brenna|tobin']);
    expect(supportTalksOf(data, c, 'brenna')).toBe(2);
    expect(supportTalksOf(data, c, 'kael')).toBe(1);
    expect(supportTalksOf(data, c, 'avatar')).toBe(0);
  });
});

describe('content:check of the pairs', () => {
  const problems = (mutate: (d: GameData) => void) => {
    const d = clone(data);
    mutate(d);
    return validateContent(d, locales).map((i) => `${i.file}: ${i.message}`);
  };

  it('the shipped pairs are clean', () => {
    expect(problems(() => {})).toEqual([]);
  });

  it('unknown companions, S talks of other pairs, missing scenes, too many pairs fail', () => {
    expect(problems((d) => (d.supports['ghost|kael'] = { key: 'ghost|kael', pair: ['kael', 'ghost'], core: false, talks: {} }))).toContainEqual(expect.stringContaining('unknown companion ghost'));
    expect(problems((d) => (d.supports['mira|tobin']!.talks.S = 'scn.support.mira_tobin.C'))).toContainEqual(expect.stringContaining('only core pairs reach S'));
    expect(problems((d) => (d.supports['mira|tobin']!.talks.B = 'scn.nope'))).toContainEqual(expect.stringContaining('unknown scene scn.nope'));
    expect(
      problems((d) => {
        for (const k of ['mira|tobin', 'brenna|varek', 'liora|ysolde']) d.supports[k]!.core = true;
      }),
    ).toContainEqual(expect.stringContaining('7 core pairs, the season has 6'));
    expect(
      problems((d) => {
        for (let i = 0; i < 20; i++) d.supports[`kael|x${i}`] = { key: `kael|x${i}`, pair: ['kael', 'kael'], core: false, talks: {} };
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining('28 support pairs, the season has 25'), expect.stringContaining('cannot be its own partner')]));
  });

  it('a support condition needs a known pair', () => {
    expect(
      problems((d) => d.scenes['scn.prologue.intro']!.lines.push({ id: 'x1', mood: 'neutral', text: 'x', requires: [{ support: { pair: ['kael', 'tobin'], rank: 'C' } }] } as never)),
    ).toContainEqual(expect.stringContaining('unknown support pair kael|tobin'));
  });
});
