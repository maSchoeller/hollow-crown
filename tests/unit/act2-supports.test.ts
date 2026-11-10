/**
 * Story 11.23: the support pairs of act 2 (narrative "Die 25 Support-Paare"), their talks at the campfire, barks, last lines and
 * grief lines of the companions of act 2. Talks need both companions in the company: missing, gone or not yet joined figures have none.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { Locales } from '../../src/content/load';
import { BARK_LINES } from '../../src/content/barkLines';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCampaign, availableSupportTalks, farewellScene, lineKey, newCampaign, supportTalk, type CampaignState, type GameData } from '../../src/core';

let data: GameData;
let locales: Locales;

const ACT2_PAIRS = ['amos|grosk', 'amos|liora', 'brann|ilka', 'ilka|sable', 'jory|nell', 'nell|varek', 'odile|sable', 'odile|varek'];
const CORE = ['brann|ilka', 'odile|varek'];
const ACT2_COMPANIONS = ['jory', 'ilka', 'odile', 'amos', 'nell', 'brann', 'sable'];

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

const act1Story = () => data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
/** A campaign in act 2 in the castle; `ids` are recruited (act-1 companions outside the start roster included). */
function inAct2(ids: string[]): CampaignState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const base: CampaignState = { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: [...act1Story(), 'm2_1'] };
  return applyCampaign(data, base, { type: 'effects', effects: ids.map((id) => ({ recruit: id })) }).campaign;
}
/** Sable joins as a lieutenant (recruit { lt: sable } at E7 warn); her record as the company holds it then. */
function withSable(c: CampaignState): CampaignState {
  c.roster.push({ ...c.roster.find((r) => r.id === 'odile')!, id: 'sable', charId: 'sable' } as CampaignState['roster'][number]);
  return c;
}
const ready = (c: CampaignState, key: string, points = data.balance.supports.thresholds.C): CampaignState => {
  c.supports[key] = { points, rank: null };
  return c;
};
const talkKeys = (c: CampaignState) =>
  availableSupportTalks(data, c)
    .map((x) => x.key)
    .sort();
const words = (sceneId: string) =>
  data.scenes[sceneId]!.lines.flatMap((l) => ('text' in l ? [{ id: l.id, de: l.text, en: locales.en?.[lineKey(sceneId, l.id)] }] : []));

describe('support pairs of act 2', () => {
  it('are the eight pairs of the narrative, Varek × Odile and Ilka × Brann core pairs; the season stays within its pairs', () => {
    const act2 = Object.values(data.supports).filter((p) => p.pair.some((id) => data.chars[id]?.act === 2));
    expect(act2.map((p) => p.key).sort()).toEqual(ACT2_PAIRS);
    expect(
      act2
        .filter((p) => p.core)
        .map((p) => p.key)
        .sort(),
    ).toEqual(CORE);
    expect(Object.keys(data.supports).length).toBeLessThanOrEqual(data.balance.supports.seasonPairs);
    expect(Object.values(data.supports).filter((p) => p.core).length).toBe(data.balance.supports.corePairs);
  });

  it('have C, B and A, the core pairs S too, in German and English with boxes of at most 110 characters', () => {
    for (const key of ACT2_PAIRS) {
      const p = data.supports[key]!;
      expect(Object.keys(p.talks).sort(), key).toEqual(CORE.includes(key) ? ['A', 'B', 'C', 'S'] : ['A', 'B', 'C']);
      for (const id of Object.values(p.talks)) {
        const lines = words(id);
        expect(lines.length, id).toBeGreaterThanOrEqual(8);
        for (const l of lines) {
          expect(l.de.length, `${id}.${l.id}`).toBeLessThanOrEqual(110);
          expect(l.en, `${id}.${l.id} en`).toBeTruthy();
          expect(l.en!.length, `${id}.${l.id} en`).toBeLessThanOrEqual(110);
        }
      }
    }
  });

  it('the rank follows the campfire level (Epic 10): B at level 1, A at 2, S only for core pairs at 3', () => {
    const th = data.balance.supports.thresholds;
    const c = inAct2(['odile', 'nell', 'varek']);
    c.supports['odile|varek'] = { points: th.A, rank: 'B' };
    expect(supportTalk(data, c, 'odile|varek')).toBeNull();
    c.home.rooms.campfire = 2;
    expect(supportTalk(data, c, 'odile|varek')).toEqual({ key: 'odile|varek', rank: 'A', dialogue: 'scn.support.odile_varek.A' });
    c.supports['odile|varek'] = { points: th.S, rank: 'A' };
    expect(supportTalk(data, c, 'odile|varek')).toBeNull();
    c.home.rooms.campfire = 3;
    expect(supportTalk(data, c, 'odile|varek')?.dialogue).toBe('scn.support.odile_varek.S');
    c.supports['nell|varek'] = { points: th.S, rank: 'A' };
    expect(supportTalk(data, c, 'nell|varek')).toBeNull(); // no S for a pair that is no core pair
  });
});

describe('talks only with both companions in the company', () => {
  it('shows a talk once both have joined', () => {
    expect(talkKeys(ready(inAct2(['jory', 'nell']), 'jory|nell'))).toEqual(['jory|nell']);
    expect(talkKeys(ready(inAct2(['ilka', 'brann']), 'brann|ilka'))).toEqual(['brann|ilka']);
    expect(talkKeys(ready(inAct2(['amos', 'liora']), 'amos|liora'))).toEqual(['amos|liora']);
  });

  it('missing figures have none: Varek without N2, Brann without N5', () => {
    const c = inAct2(['nell', 'odile']);
    c.roster = c.roster.filter((r) => r.id !== 'varek');
    expect(talkKeys(ready(ready(c, 'nell|varek'), 'odile|varek'))).toEqual([]);
    expect(talkKeys(ready(inAct2(['ilka']), 'brann|ilka'))).toEqual([]);
  });

  it('gone figures have none: Odile after E5 (return), Varek after E6 (pardon)', () => {
    const c = ready(ready(ready(withSable(inAct2(['odile', 'varek', 'nell'])), 'odile|varek'), 'nell|varek'), 'odile|sable');
    expect(talkKeys(c)).toEqual(['nell|varek', 'odile|sable', 'odile|varek']);
    const e5 = applyCampaign(data, c, { type: 'effects', effects: [{ leave: 'odile' }] }).campaign;
    expect(talkKeys(e5)).toEqual(['nell|varek']);
    const e6 = applyCampaign(data, c, { type: 'effects', effects: [{ leave: 'varek' }] }).campaign;
    expect(talkKeys(e6)).toEqual(['odile|sable']);
  });

  it('Sable not yet joined (no E7 warn) has none; once she has joined she has', () => {
    const c = ready(ready(inAct2(['odile', 'ilka']), 'odile|sable'), 'ilka|sable');
    expect(talkKeys(c)).toEqual([]);
    expect(talkKeys(withSable(c))).toEqual(['ilka|sable', 'odile|sable']);
  });
});

describe('barks, last line and grief of the companions of act 2', () => {
  it('each has the six barks, at most bubbleMaxChars long in both languages', () => {
    const max = data.balance.scene.bubbleMaxChars;
    for (const id of ACT2_COMPANIONS)
      for (const line of BARK_LINES) {
        const key = lineKey(`scn.bark.${id}`, line);
        expect(locales.de?.[key], key).toBeTruthy();
        expect(locales.en?.[key], `${key} en`).toBeTruthy();
        expect(locales.de![key]!.length, key).toBeLessThanOrEqual(max);
        expect(locales.en![key]!.length, `${key} en`).toBeLessThanOrEqual(max);
      }
  });

  it('each has a last line and a grief line for every support partner, as do the act-1 partners of the new pairs', () => {
    const partnersOf = (id: string) =>
      Object.values(data.supports)
        .filter((p) => p.pair.includes(id))
        .map((p) => p.pair.find((x) => x !== id)!);
    for (const id of [...ACT2_COMPANIONS, 'varek', 'liora', 'grosk']) {
      const scene = farewellScene(id);
      for (const lang of ['de', 'en']) expect(locales[lang]?.[lineKey(scene, 'last')], `${id} last ${lang}`).toBeTruthy();
      for (const partner of partnersOf(id))
        for (const lang of ['de', 'en']) expect(locales[lang]?.[lineKey(scene, `grief_${partner}`)], `${scene}.grief_${partner} ${lang}`).toBeTruthy();
    }
  });
});
