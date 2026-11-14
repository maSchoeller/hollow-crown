/**
 * Story 10.12: mercenary traits – the number per offer, the distribution per tavern level over a fixed seed, no trait
 * twice on one offer, the effect of every trait, Greedy in the price, saves without the field, and the same replay.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  clone,
  computeStats,
  goodTraitChance,
  hireCost,
  hireError,
  newCampaign,
  normalizeCampaign,
  refreshTavern,
  replayCampaign,
  traitsOfKind,
  validateCampaign,
  type CampaignCommand,
  type CampaignState,
  type GameData,
  type UnitRecord,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** Act 2 in the castle with a tavern of this level, with the classes of the late tavern open. */
function castle(tavern = 1): CampaignState {
  const c = clone(base);
  c.act = 2;
  c.home = { kind: 'castle', rooms: { tavern } };
  c.completed = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  return c;
}

/** Offers of many rounds from one campaign (the rng runs on), for the distribution over a fixed seed. */
function rounds(c: CampaignState, n: number): UnitRecord[] {
  const out: UnitRecord[] = [];
  for (let i = 0; i < n; i++) {
    refreshTavern(data, c);
    out.push(...c.tavern);
  }
  return out;
}

const kindOf = (id: string) => data.traits[id]!.kind;

describe('traits.yaml (content)', () => {
  it('holds the seven traits of the story with their effects', () => {
    expect(Object.keys(data.traits)).toEqual(['tough', 'nimble', 'veteran', 'elemental_child', 'greedy', 'coward', 'clumsy']);
    expect(traitsOfKind(data, 'good')).toEqual(['tough', 'nimble', 'veteran', 'elemental_child']);
    expect(traitsOfKind(data, 'bad')).toEqual(['greedy', 'coward', 'clumsy']);
    expect(data.traits.tough!.effect).toEqual({ stats: { hp: 4 } });
    expect(data.traits.nimble!.effect).toEqual({ stats: { spd: 2 } });
    expect(data.traits.veteran!.effect).toEqual({ stats: { skl: 2, lck: 2 } });
    expect(data.traits.elemental_child!.effect).toEqual({ stats: { mag: 2, res: 2 } });
    expect(data.traits.greedy!).toEqual({ id: 'greedy', kind: 'bad', hireCostPct: 25 });
    expect(data.traits.coward!.effect).toEqual({ stats: { str: -2, mov: 1 } });
    expect(data.traits.clumsy!.effect).toEqual({ stats: { skl: -2 }, hitBonus: -5 });
  });
});

describe('the traits of an offer', () => {
  it('gives every offer one or two different traits', () => {
    const offers = rounds(castle(1), 12);
    expect(offers.length).toBeGreaterThan(20);
    const [min, max] = data.balance.economy.tavern.traitCount;
    for (const u of offers) {
      const traits = u.traits ?? [];
      expect(traits.length).toBeGreaterThanOrEqual(min);
      expect(traits.length).toBeLessThanOrEqual(max);
      expect(new Set(traits).size).toBe(traits.length);
      for (const id of traits) expect(data.traits[id]).toBeDefined();
    }
    // both lengths really happen over a round of twelve
    expect(new Set(offers.map((u) => (u.traits ?? []).length))).toEqual(new Set([min, max]));
  });

  it('draws good traits more often at an upgraded tavern (fixed seed)', () => {
    const share = (level: number) => {
      const traits = rounds(castle(level), 40).flatMap((u) => u.traits ?? []);
      return (traits.filter((id) => kindOf(id) === 'good').length * 100) / traits.length;
    };
    expect(goodTraitChance(data, castle(1))).toBe(50);
    expect(goodTraitChance(data, castle(2))).toBe(75);
    expect(goodTraitChance(data, castle(3))).toBe(75);
    const one = share(1);
    const two = share(2);
    // the same seed, so the numbers are fixed: around the chance of the level and clearly apart
    expect(one).toBeGreaterThan(40);
    expect(one).toBeLessThan(62);
    expect(two).toBeGreaterThan(66);
    expect(two).toBeLessThan(88);
    expect(two).toBeGreaterThan(one + 10);
  });

  it('story companions have no traits', () => {
    const c = castle(3);
    expect(c.roster.length).toBeGreaterThan(0);
    for (const u of c.roster) expect(u.traits).toEqual([]);
  });

  it('a save from before the traits loads with an empty list', () => {
    const c = castle(2);
    refreshTavern(data, c);
    const old = JSON.parse(JSON.stringify(c)) as CampaignState & { roster: Array<Partial<UnitRecord>>; tavern: Array<Partial<UnitRecord>> };
    for (const u of [...old.roster, ...old.tavern]) delete u.traits;
    const loaded = normalizeCampaign(data, old as CampaignState);
    for (const u of [...loaded.roster, ...loaded.tavern]) expect(u.traits).toEqual([]);
  });
});

describe('the effect of a trait', () => {
  /** The unit with these traits against the same unit without them. */
  const withTraits = (traits: string[]) => {
    const u = clone(base.roster[0]!);
    u.traits = traits;
    return computeStats(data, u);
  };
  const plain = () => computeStats(data, clone(base.roster[0]!));

  it('tough, nimble, veteran and the elemental child raise the stats', () => {
    expect(withTraits(['tough']).stats.hp - plain().stats.hp).toBe(4);
    expect(withTraits(['tough']).maxHp - plain().maxHp).toBe(4);
    expect(withTraits(['nimble']).stats.spd - plain().stats.spd).toBe(2);
    expect(withTraits(['veteran']).stats.skl - plain().stats.skl).toBe(2);
    expect(withTraits(['veteran']).stats.lck - plain().stats.lck).toBe(2);
    expect(withTraits(['elemental_child']).stats.mag - plain().stats.mag).toBe(2);
    expect(withTraits(['elemental_child']).stats.res - plain().stats.res).toBe(2);
  });

  it('the coward loses strength and walks one field further, the clumsy one skill and hit', () => {
    expect(withTraits(['coward']).stats.str - plain().stats.str).toBe(-2);
    expect(withTraits(['coward']).mov - plain().mov).toBe(1);
    expect(withTraits(['clumsy']).stats.skl - plain().stats.skl).toBe(-2);
    expect(withTraits(['clumsy']).hit - plain().hit).toBe(-5);
  });

  it('two traits add up, greedy changes nothing on the field', () => {
    const both = withTraits(['tough', 'nimble']);
    expect(both.stats.hp - plain().stats.hp).toBe(4);
    expect(both.stats.spd - plain().stats.spd).toBe(2);
    expect(withTraits(['greedy'])).toEqual(plain());
    // an unknown trait is ignored, it does not throw
    expect(withTraits(['no_such_trait'])).toEqual(plain());
  });
});

describe('greedy in the price', () => {
  const offerWith = (traits: string[]): UnitRecord => ({ ...clone(base.roster[0]!), id: 'offer1', level: 4, traits });

  it('raises the hire price by a quarter, rounded up', () => {
    const r = data.balance.economy.recruitCost;
    const plain = r.base + r.perLevel * 4;
    expect(hireCost(data, offerWith([]))).toBe(plain);
    expect(hireCost(data, offerWith(['tough']))).toBe(plain);
    expect(hireCost(data, offerWith(['greedy']))).toBe(Math.ceil((plain * 125) / 100));
    expect(hireCost(data, offerWith(['greedy', 'tough']))).toBe(Math.ceil((plain * 125) / 100));
  });

  it('the command books the same amount, and the surcharge can make an offer too dear', () => {
    const c = castle(2);
    c.tavern = [offerWith(['greedy'])];
    const cost = hireCost(data, c.tavern[0]!);
    c.gold = cost;
    expect(hireError(data, c, 'offer1')).toBeNull();
    const r = applyCampaign(data, c, { type: 'hire', offer: 'offer1' });
    expect(r.campaign.gold).toBe(0);
    expect(r.campaign.roster.find((u) => u.id === 'offer1')?.traits).toEqual(['greedy']);
    const poor = clone(c);
    poor.gold = cost - 1;
    expect(hireError(data, poor, 'offer1')).toBe('not_enough_gold');
    expect(validateCampaign(data, poor, { type: 'hire', offer: 'offer1' })).toBe('not_enough_gold');
  });
});

describe('replay', () => {
  it('gives the same offers and the same hired mercenary', () => {
    const start = castle(2);
    start.gold = 100_000;
    refreshTavern(data, start);
    const offer = start.tavern[0]!;
    expect(offer.traits?.length).toBeGreaterThan(0);
    const cmds: CampaignCommand[] = [{ type: 'hire', offer: offer.id }];
    let live = start;
    for (const cmd of cmds) live = applyCampaign(data, live, cmd).campaign;
    expect(replayCampaign(data, start, cmds)).toEqual(live);
    expect(live.roster.find((u) => u.id === offer.id)?.traits).toEqual(offer.traits);
  });

  it('two campaigns with the same seed draw the same traits', () => {
    const a = rounds(castle(2), 5).map((u) => `${u.nameKey}:${(u.traits ?? []).join('+')}`);
    const b = rounds(castle(2), 5).map((u) => `${u.nameKey}:${(u.traits ?? []).join('+')}`);
    expect(a).toEqual(b);
    expect(a.some((line) => line.includes('+'))).toBe(true);
  });
});
