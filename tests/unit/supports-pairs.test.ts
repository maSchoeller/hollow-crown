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
  it('holds the nine pairs of act 1, four of them core pairs (narrative)', () => {
    const act1 = Object.values(data.supports).filter((p) => p.pair.every((id) => (data.chars[id]?.act ?? 1) === 1));
    expect(act1.map((p) => p.key).sort()).toEqual(['avatar|liora', 'avatar|lucan', 'brenna|lucan', 'brenna|tobin', 'brenna|varek', 'fenn|mira', 'grosk|tobin', 'liora|ysolde', 'mira|tobin']);
    expect(act1.filter((p) => p.core).map((p) => p.key).sort()).toEqual(['avatar|liora', 'avatar|lucan', 'brenna|lucan', 'brenna|tobin']); // act 2 (story 11.23): act2-supports.test.ts
    expect(data.supports['avatar|lucan']!.talks).toEqual({ C: 'scn.support.avatar_lucan.C', B: 'scn.support.avatar_lucan.B', A: 'scn.support.avatar_lucan.A', S: 'scn.support.avatar_lucan.S' });
  });

  it('a new campaign starts every pair at zero; pairs added later get an entry when a save loads', () => {
    const c = fresh();
    expect(Object.keys(c.supports).sort()).toEqual(Object.keys(data.supports).sort());
    expect(c.supports['brenna|lucan']).toEqual({ points: 0, rank: null });
    const old = clone(c);
    delete old.supports['mira|tobin'];
    old.supports['brenna|lucan'] = { points: 12, rank: 'C' };
    const n = normalizeCampaign(data, old);
    expect(n.supports['mira|tobin']).toEqual({ points: 0, rank: null });
    expect(n.supports['brenna|lucan']).toEqual({ points: 12, rank: 'C' });
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
    expect(maxRank(data, 'brenna|lucan')).toBe('S');
    expect(maxRank(data, 'mira|tobin')).toBe('A');
    expect(maxRank(data, 'enemy|pair')).toBe('S'); // pairs a map sets for a battle are no fixed pairs
    const s = { 'mira|tobin': { points: 50, rank: 'A' as const }, 'brenna|lucan': { points: 50, rank: 'A' as const } };
    expect(addSupportPoints(data, s, 'mira|tobin', 5)).toBe(0);
    expect(s['mira|tobin'].points).toBe(50);
    expect(addSupportPoints(data, s, 'brenna|lucan', 30)).toBe(20);
    expect(s['brenna|lucan'].points).toBe(th().S);
    expect(pendingRank(data, { points: 70, rank: 'A' }, 'mira|tobin')).toBeNull();
    expect(pendingRank(data, { points: 70, rank: 'A' }, 'brenna|lucan')).toBe('S');
  });

  it('points pile up at the threshold of the next rank until it is unlocked', () => {
    const s = { 'brenna|lucan': { points: 0, rank: null } };
    expect(addSupportPoints(data, s, 'brenna|lucan', 30)).toBe(th().C);
    expect(pendingRank(data, s['brenna|lucan'], 'brenna|lucan')).toBe('C');
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
    expect(supportTalk(data, at('brenna|lucan', th().C, null), 'brenna|lucan')).toEqual({ key: 'brenna|lucan', rank: 'C', dialogue: 'scn.support.brenna_lucan.C' });
    expect(supportTalk(data, at('brenna|lucan', th().B, 'C'), 'brenna|lucan')).toEqual({ key: 'brenna|lucan', rank: 'B', dialogue: 'scn.support.brenna_lucan.B' });
    const a = at('brenna|lucan', th().A, 'B');
    expect(unlockableRank(data, a, 'brenna|lucan')).toBeNull();
    expect(supportTalk(data, a, 'brenna|lucan')).toBeNull();
    a.home.rooms.campfire = 2;
    expect(unlockableRank(data, a, 'brenna|lucan')).toBe('A');
    expect(supportTalk(data, a, 'brenna|lucan')).toEqual({ key: 'brenna|lucan', rank: 'A', dialogue: 'scn.support.brenna_lucan.A' }); // story 9.13
  });

  it('no talk without both companions in the company or without a scene', () => {
    expect(supportTalk(data, at('mira|tobin', th().C, null), 'mira|tobin')).toBeNull(); // Mira has not joined
    expect(supportTalk(data, at('liora|ysolde', th().C, null), 'liora|ysolde')).toBeNull();
  });

  it('unlockSupport follows the same rule', () => {
    expect(validateCampaign(data, at('brenna|lucan', th().B, 'C'), { type: 'unlockSupport', pair: 'brenna|lucan' })).toBeNull();
    expect(validateCampaign(data, at('brenna|lucan', th().A, 'B'), { type: 'unlockSupport', pair: 'brenna|lucan' })).toBe('not_available');
    expect(validateCampaign(data, at('brenna|lucan', 5, null), { type: 'unlockSupport', pair: 'brenna|lucan' })).toBe('not_available');
    const r = applyCampaign(data, at('brenna|lucan', th().B, 'C'), { type: 'unlockSupport', pair: 'brenna|lucan' });
    expect(r.campaign.supports['brenna|lucan']!.rank).toBe('B');
    expect(r.events).toContainEqual({ t: 'supportUnlocked', pair: 'brenna|lucan', rank: 'B' });
  });

  it('"Gespräche bereit": the camp counts the ready talks, the troop each member\'s', () => {
    const c = at('brenna|lucan', th().C, null);
    c.supports['brenna|tobin'] = { points: th().C, rank: null };
    expect(availableSupportTalks(data, c).map((x) => x.key).sort()).toEqual(['brenna|lucan', 'brenna|tobin']);
    expect(supportTalksOf(data, c, 'brenna')).toBe(2);
    expect(supportTalksOf(data, c, 'lucan')).toBe(1);
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
    expect(problems((d) => (d.supports['ghost|lucan'] = { key: 'ghost|lucan', pair: ['lucan', 'ghost'], core: false, talks: {} }))).toContainEqual(expect.stringContaining('unknown companion ghost'));
    expect(problems((d) => (d.supports['mira|tobin']!.talks.S = 'scn.support.mira_tobin.C'))).toContainEqual(expect.stringContaining('only core pairs reach S'));
    expect(problems((d) => (d.supports['mira|tobin']!.talks.B = 'scn.nope'))).toContainEqual(expect.stringContaining('unknown scene scn.nope'));
    expect(
      problems((d) => {
        d.supports['mira|tobin']!.core = true;
      }),
    ).toContainEqual(expect.stringContaining('7 core pairs, the season has 6'));
    expect(
      problems((d) => {
        for (let i = 0; i < 20; i++) d.supports[`lucan|x${i}`] = { key: `lucan|x${i}`, pair: ['lucan', 'lucan'], core: false, talks: {} };
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining(`${Object.keys(data.supports).length + 20} support pairs, the season has 25`), expect.stringContaining('cannot be its own partner')]));
  });

  it('a support condition needs a known pair', () => {
    expect(
      problems((d) => d.scenes['scn.prologue.intro']!.lines.push({ id: 'x1', mood: 'neutral', text: 'x', requires: [{ support: { pair: ['lucan', 'tobin'], rank: 'C' } }] } as never)),
    ).toContainEqual(expect.stringContaining('unknown support pair lucan|tobin'));
  });
});
