import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  beginBattle,
  computeStats,
  farewellScene,
  farewellView,
  finishBattle,
  getUnit,
  lineKey,
  newCampaign,
  pairKey,
  type BattleState,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
let locales: Record<string, Record<string, string>>;
let base: CampaignState;

beforeAll(() => {
  const content = loadContentFromDisk();
  data = content.data;
  locales = content.locales;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** Campaign with the given support ranks set on its pairs (all other pairs keep their rank). */
function withRanks(c: CampaignState, ranks: Record<string, 'C' | 'B' | 'A' | 'S' | null>): CampaignState {
  const supports = { ...c.supports };
  for (const [key, rank] of Object.entries(ranks)) supports[key] = { ...(supports[key] ?? { points: 0 }), rank };
  return { ...c, supports };
}

/** Every fixed pair of `id` at rank C. */
function rankedWith(c: CampaignState, id: string, rank: 'C' | 'B' | 'A' | 'S' | null = 'C'): CampaignState {
  const ranks: Record<string, 'C' | 'B' | 'A' | 'S' | null> = {};
  for (const [a, b] of data.campaign.supportPairs) if (a === id || b === id) ranks[pairKey(a, b)] = rank;
  return withRanks(c, ranks);
}

/** Prologue battle won with `dead` fallen. */
function wonWith(c: CampaignState, dead: string[], tweak?: (s: BattleState) => void) {
  const s = beginBattle(data, c, data.campaign.start, c.roster.map((r) => r.id)).state;
  for (const id of dead) getUnit(s, id).gone = 'dead';
  tweak?.(s);
  s.outcome = 'victory';
  return finishBattle(data, c, s);
}

describe('grief (story 6.7)', () => {
  it('gives every surviving fixed support partner at rank C or higher grief for griefMissions missions', () => {
    expect(base.roster.map((r) => r.id)).toContain('brenna');
    const { campaign, result } = wonWith(rankedWith(base, 'brenna'), ['brenna']);
    const partners = data.campaign.supportPairs.filter((p) => p.includes('brenna')).map((p) => (p[0] === 'brenna' ? p[1] : p[0]));
    const alive = partners.filter((id) => campaign.roster.some((r) => r.id === id));
    expect(alive.length).toBeGreaterThan(0);
    for (const id of alive) expect(campaign.roster.find((r) => r.id === id)!.grief).toBe(data.balance.supports.griefMissions);
    expect(result.fallen[0]!.grief!.map((g) => g.id).sort()).toEqual([...alive].sort());
    expect(campaign.fallen.at(-1)).toMatchObject({ id: 'brenna', classId: 'vanguard', node: data.campaign.start });
    expect(campaign.fallen.at(-1)).not.toHaveProperty('mercenary');
  });

  it('spares partners without a support rank and grieves those at rank C', () => {
    const partners = data.campaign.supportPairs.filter((p) => p.includes('brenna')).map((p) => (p[0] === 'brenna' ? p[1] : p[0]));
    const alive = partners.filter((id) => base.roster.some((r) => r.id === id));
    expect(alive.length).toBeGreaterThan(0);
    const none = wonWith(rankedWith(base, 'brenna', null), ['brenna']);
    expect(none.result.fallen[0]!.grief).toEqual([]);
    for (const id of alive) expect(none.campaign.roster.find((r) => r.id === id)!.grief ?? 0).toBe(0);
    const [first, ...rest] = alive;
    const mixed = wonWith(withRanks(rankedWith(base, 'brenna', null), { [pairKey('brenna', first!)]: 'C' }), ['brenna']);
    expect(mixed.result.fallen[0]!.grief!.map((g) => g.id)).toEqual([first]);
    expect(mixed.campaign.roster.find((r) => r.id === first)!.grief).toBe(data.balance.supports.griefMissions);
    for (const id of rest) expect(mixed.campaign.roster.find((r) => r.id === id)!.grief ?? 0).toBe(0);
  });

  it('costs hit while it lasts and wears off after griefMissions missions', () => {
    const { campaign } = wonWith(rankedWith(base, 'brenna'), ['brenna']);
    const kael = campaign.roster.find((r) => r.id === 'kael')!;
    const clear = { ...kael, grief: 0 };
    expect(computeStats(data, clear).hit - computeStats(data, kael).hit).toBe(data.balance.supports.griefHitPenalty);
    let c = campaign;
    for (let i = 0; i < data.balance.supports.griefMissions; i++) {
      c = wonWith({ ...c, completed: [] }, []).campaign;
    }
    expect(c.roster.find((r) => r.id === 'kael')!.grief ?? 0).toBe(0);
  });
});

describe('farewellView (story 6.7)', () => {
  it('builds one card per fallen figure with last line and grief from the farewell scene', () => {
    const { result } = wonWith(rankedWith(base, 'brenna'), ['brenna']);
    const cards = farewellView(data, result);
    expect(cards).toHaveLength(1);
    const card = cards[0]!;
    expect(card).toMatchObject({ id: 'brenna', mercenary: false, nodeId: data.campaign.start, lastKey: lineKey(farewellScene('brenna'), 'last') });
    const kael = card.grief.find((g) => g.id === 'kael')!;
    expect(kael).toEqual({ id: 'kael', missions: 3, hitPenalty: 10, lineKey: lineKey('scn.farewell.brenna', 'grief_kael') });
    expect(locales.en?.[card.lastKey!]).toBeTruthy();
  });

  it('gives a tavern mercenary the short form and keeps them for the memorial stone', () => {
    const { result, campaign } = wonWith(base, ['brenna'], (s) => {
      delete getUnit(s, 'brenna').charId;
    });
    const card = farewellView(data, result)[0]!;
    expect(card).toMatchObject({ mercenary: true, grief: [] });
    expect(card.lastKey).toBeUndefined();
    expect(campaign.fallen.at(-1)).toMatchObject({ id: 'brenna', mercenary: true });
  });

  it('falls back when the companion has no farewell scene, and is empty without deaths or on defeat', () => {
    const { result } = wonWith(base, ['brenna']);
    const other = { ...result, fallen: [{ ...result.fallen[0]!, id: 'nobody' }] };
    expect(farewellView(data, other)[0]!.lastKey).toBeUndefined();
    expect(farewellView(data, wonWith(base, []).result)).toEqual([]);
    expect(farewellView(data, { ...result, outcome: 'defeat' })).toEqual([]);
  });

  it('every companion who can fall has a last line in German and English', () => {
    for (const id of Object.keys(data.chars).filter((id) => id !== 'avatar' && id !== 'kael')) {
      const key = lineKey(farewellScene(id), 'last');
      expect(locales.de?.[key], id).toBeTruthy();
      expect(locales.en?.[key], id).toBeTruthy();
    }
  });
});
