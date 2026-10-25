/** Bounty and signature item of the lieutenants driven off (story 3.5): formula, material, drop chance, order of the draws. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import {
  beginBattle,
  bountyGold,
  finishBattle,
  missionResultView,
  newCampaign,
  nextFloat,
  nextInt,
  normalizeCampaign,
  seedRng,
  type BattleState,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const fresh = (): CampaignState => newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

type Known = Record<string, { grudge: number; routs: number; signatureDropped?: boolean }>;

/** Campaign that has met the given lieutenants with their grudge and routs. */
function known(over: Known = { hask: { grudge: 0, routs: 0 } }): CampaignState {
  const c = fresh();
  c.lieutenants = Object.fromEntries(
    Object.entries(over).map(([id, v]) => [id, { met: true, encounters: v.routs, grudge: v.grudge, routs: v.routs, signatureDropped: v.signatureDropped ?? false, target: 'kael' }]),
  );
  return c;
}

/** A won prologue with the lieutenants on the map, each driven off (`fled`) or standing; `seed` sets the battle RNG. */
function won(c: CampaignState, lts: Array<[string, boolean]> = [['hask', true]], seed = 1): BattleState {
  const s = beginBattle(data, c, 'prologue', c.roster.map((r) => r.id)).state;
  const kael = s.units.find((u) => u.id === 'kael')!;
  lts.forEach(([id, fled], i) => {
    const lt = clone(s.units.find((u) => u.team === 'enemy' && !u.lieutenant)!);
    lt.uid = `lt${i}`;
    lt.lieutenant = id;
    if (fled) Object.assign(lt, { gone: 'fled', fledBy: kael.uid, pos: null });
    s.units.push(lt);
  });
  s.outcome = 'victory';
  s.rng = seedRng(seed);
  return s;
}

/** The campaign RNG after a mission without a rout whose battle RNG was moved on by `draws` numbers first. */
function plainRng(c0: CampaignState, draws: number) {
  const s = won(c0, [['hask', false]]);
  for (let i = 0; i < draws; i++) nextFloat(s.rng);
  return finishBattle(data, c0, s).campaign.rng;
}

const chance = () => data.balance.lieutenant.signature.chance;

/** The first seed whose plain roll drops the signature (lieutenant at grudge 0), with its finished mission. */
function firstDrop() {
  for (let seed = 1; seed < 500; seed++) {
    const c0 = known();
    const { campaign, result } = finishBattle(data, c0, won(c0, [['hask', true]], seed));
    if (result.bounty[0]!.signature) return { campaign, result, seed };
  }
  throw new Error('no seed drops the signature');
}

/** A seed whose roll does not drop the signature. */
function seedWithoutRoll() {
  for (let seed = 1; seed < 500; seed++) {
    const r = seedRng(seed);
    nextInt(r, 2);
    if (nextFloat(r) >= chance()) return seed;
  }
  throw new Error('no seed');
}

describe('bountyGold (AC 2)', () => {
  it('is 200 x (grudge before the rout + 1), the value from balance.yaml', () => {
    expect([0, 1, 2, 3].map((g) => bountyGold(data, g))).toEqual([200, 400, 600, 800]);
    const d = clone(data);
    d.balance.lieutenant.bounty.goldPerLevel = 50;
    expect(bountyGold(d, 1)).toBe(100);
  });
});

describe('the bounty of a rout (AC 2, 5)', () => {
  it('pays 200 x (grudge + 1) gold and iron ore, credits both to the campaign but keeps them out of the loot', () => {
    const c0 = known({ hask: { grudge: 1, routs: 1 } });
    const { campaign, result } = finishBattle(data, c0, won(c0));
    const b = result.bounty[0]!;
    expect(b).toMatchObject({ id: 'hask', gold: 400, grudge: 2 });
    expect(campaign.lieutenants!.hask).toMatchObject({ grudge: 2, routs: 2 });
    expect(b.material!.id).toBe('iron_ore');
    expect(b.material!.count).toBeGreaterThanOrEqual(1);
    expect(b.material!.count).toBeLessThanOrEqual(2);
    expect(campaign.gold - c0.gold).toBe(result.gold + 400);
    expect(campaign.materials.iron_ore! - (c0.materials.iron_ore ?? 0)).toBe((result.materials.iron_ore ?? 0) + b.material!.count);
  });

  it('computes with the grudge before this rout: 0 -> 200, 2 -> 600, 3 stays at 3 and pays 800', () => {
    for (const [grudge, gold, after] of [[0, 200, 1], [2, 600, 3], [3, 800, 3]] as const) {
      const c0 = known({ hask: { grudge, routs: grudge } });
      const b = finishBattle(data, c0, won(c0)).result.bounty[0]!;
      expect([b.gold, b.grudge]).toEqual([gold, after]);
    }
  });

  it('a lieutenant who stayed on the board pays nothing and draws no randomness', () => {
    const c0 = known();
    const { campaign, result } = finishBattle(data, c0, won(c0, [['hask', false]]));
    expect(result.bounty).toEqual([]);
    expect(campaign.rng).toEqual(plainRng(c0, 0));
    expect(campaign.gold - c0.gold).toBe(result.gold);
  });

  it('a defeat pays nothing and leaves the campaign as it was', () => {
    const c0 = known();
    const s = won(c0);
    s.outcome = 'defeat';
    const r = finishBattle(data, c0, s);
    expect(r.campaign).toBe(c0);
    expect(r.result.bounty).toEqual([]);
  });

  it('is repeatable: same state, same result', () => {
    const c0 = known({ hask: { grudge: 1, routs: 1 } });
    const a = finishBattle(data, c0, won(c0, [['hask', true]], 5));
    const b = finishBattle(data, c0, won(c0, [['hask', true]], 5));
    expect(b).toEqual(a);
  });

  it('takes the material from balance.yaml by act, none when the act has none', () => {
    const c0 = known();
    const d = clone(data);
    d.balance.lieutenant.bounty.materialByAct = { '1': 'moonsteel' };
    expect(finishBattle(d, c0, won(c0)).result.bounty[0]!.material!.id).toBe('moonsteel');
    d.balance.lieutenant.bounty.materialByAct = {};
    const r = finishBattle(d, c0, won(c0)).result.bounty[0]!;
    expect(r.material).toBeUndefined();
    expect(r.gold).toBe(200);
  });
});

describe('material and signature draws (AC 3, 4)', () => {
  it('gives 1 or 2 ore, both occur', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const c0 = known();
      seen.add(finishBattle(data, c0, won(c0, [['hask', true]], seed)).result.bounty[0]!.material!.count);
    }
    expect([...seen].sort()).toEqual([1, 2]);
  });

  it('the signature falls with the chance of balance.yaml: first the amount, then the roll, from the battle RNG', () => {
    let drops = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const c0 = known();
      const r = seedRng(seed);
      const count = 1 + nextInt(r, 2);
      const expected = nextFloat(r) < chance();
      const { result } = finishBattle(data, c0, won(c0, [['hask', true]], seed));
      expect(result.bounty[0]!.material!.count).toBe(count);
      expect(!!result.bounty[0]!.signature).toBe(expected);
      if (expected) drops += 1;
    }
    expect(drops).toBeGreaterThan(10);
    expect(drops).toBeLessThan(60);
  });

  it('a fallen item is a new instance in the convoy, signatureDropped is set, and it is not in the loot list', () => {
    const { campaign, result } = firstDrop();
    const sig = result.bounty[0]!.signature!;
    expect(sig.def).toBe(data.lieutenants.hask!.signatureItem);
    expect(campaign.convoy.filter((i) => i.uid === sig.uid)).toHaveLength(1);
    expect(campaign.lieutenants!.hask!.signatureDropped).toBe(true);
    expect(result.items.some((i) => i.uid === sig.uid)).toBe(false);
  });

  it('at the 4th rout it falls for sure, whatever the roll', () => {
    const noDrop = seedWithoutRoll();
    const c0 = known({ hask: { grudge: 3, routs: 3 } });
    const { campaign, result } = finishBattle(data, c0, won(c0, [['hask', true]], noDrop));
    expect(campaign.lieutenants!.hask).toMatchObject({ routs: 4, signatureDropped: true });
    expect(result.bounty[0]!.signature!.def).toBe('tinder');
    // before the 4th rout the same seed gives nothing
    const c1 = known({ hask: { grudge: 2, routs: 2 } });
    expect(finishBattle(data, c1, won(c1, [['hask', true]], noDrop)).result.bounty[0]!.signature).toBeUndefined();
  });

  it('falls at most once per lieutenant: not again at the guaranteed rout, not on a lucky roll', () => {
    const c0 = known({ hask: { grudge: 3, routs: 4, signatureDropped: true } });
    for (const seed of [firstDrop().seed, seedWithoutRoll()]) {
      const { campaign, result } = finishBattle(data, c0, won(c0, [['hask', true]], seed));
      expect(result.bounty[0]!.signature).toBeUndefined();
      expect(campaign.convoy.filter((i) => i.def === 'tinder')).toHaveLength(c0.convoy.filter((i) => i.def === 'tinder').length);
      expect(campaign.lieutenants!.hask!.signatureDropped).toBe(true);
    }
  });

  it('two lieutenants in one mission draw in the order of the units: amount, roll, amount, roll', () => {
    const c0 = known({ hask: { grudge: 0, routs: 0 }, morra: { grudge: 2, routs: 2 } });
    const r = seedRng(1);
    const counts: number[] = [];
    const rolls: boolean[] = [];
    for (let i = 0; i < 2; i++) {
      counts.push(1 + nextInt(r, 2));
      rolls.push(nextFloat(r) < chance());
    }
    const { campaign, result } = finishBattle(data, c0, won(c0, [['hask', true], ['morra', true]], 1));
    expect(result.bounty.map((b) => [b.id, b.gold, b.material!.count, !!b.signature])).toEqual([
      ['hask', 200, counts[0], rolls[0]],
      ['morra', 600, counts[1], rolls[1]],
    ]);
    // exactly four draws were taken (the market and tavern draw after them from the same state)
    expect(campaign.rng).toEqual(plainRng(c0, 4));
    expect(campaign.gold - c0.gold).toBe(result.gold + 800);
  });
});

describe('save and view (AC 3, 5)', () => {
  it('takes an older signatureDropped 0/1 as false/true', () => {
    const c = known({ hask: { grudge: 1, routs: 1 }, morra: { grudge: 0, routs: 0 } });
    (c.lieutenants!.hask as unknown as { signatureDropped: number }).signatureDropped = 1;
    (c.lieutenants!.morra as unknown as { signatureDropped: number }).signatureDropped = 0;
    const n = normalizeCampaign(data, c).lieutenants!;
    expect([n.hask!.signatureDropped, n.morra!.signatureDropped]).toEqual([true, false]);
  });

  it('the result view carries the bounty with material and item', () => {
    const { result } = firstDrop();
    const v = missionResultView(result);
    expect(v.bounty).toHaveLength(1);
    expect(v.bounty[0]).toMatchObject({ id: 'hask', gold: 200, grudge: 1, material: { id: 'iron_ore' }, signature: { def: 'tinder' } });
    expect(v.gold).toBe(result.gold);
  });

  it('content:check knows the material of the act', () => {
    const issues = (mutate: (d: GameData) => void) => {
      const d = clone(data);
      const l = clone(locales);
      for (const x of Object.values(d.lieutenants)) for (const lang of ['de', 'en']) l[lang]![x.titleKey] ??= 'Title';
      mutate(d);
      return validateContent(d, l).map((i) => i.message);
    };
    expect(issues(() => {}).filter((m) => m.includes('materialByAct'))).toEqual([]);
    expect(issues((d) => (d.balance.lieutenant.bounty.materialByAct = { '1': 'nope' }))).toContainEqual(expect.stringContaining('unknown item nope'));
    expect(issues((d) => (d.balance.lieutenant.bounty.materialByAct = { '1': 'tinder' }))).toContainEqual(expect.stringContaining('tinder is no material'));
    expect(issues((d) => (d.balance.lieutenant.bounty.materialByAct = {}))).toContainEqual(expect.stringContaining('no material for act 1'));
  });
});
