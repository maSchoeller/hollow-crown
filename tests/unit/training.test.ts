/** Story 10.8: Übungsplatz und Lagerfeuer-Ränge – reserve EP by level, rounding, mercenaries, act cap, haunts, determinism, campfire ranks. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  beginBattle,
  campfireLock,
  clone,
  finishBattle,
  firstNode,
  levelCap,
  missionResultView,
  newCampaign,
  normalizeCampaign,
  reservePct,
  reserveShare,
  seedRng,
  trainReserve,
  unlockableRank,
  type BattleState,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** Act 2 in the castle with the training ground at `level` (0: still in the act 1 camp); Tobin's clone `bench` and a mercenary wait in the reserve. */
function castle(level = 1): CampaignState {
  const c = clone(base);
  c.completed.push('prologue');
  if (level > 0) {
    c.act = 2;
    c.home = { kind: 'castle', rooms: level > 1 ? { training: level } : {} };
  }
  const tobin = c.roster.find((u) => u.id === 'tobin') ?? c.roster[c.roster.length - 1]!;
  const bench = { ...clone(tobin), id: 'bench', charId: undefined, nameKey: 'unit.merc.name', name: 'Bank', level: 5, exp: 0 };
  const merc = { ...clone(tobin), id: 'merc9', charId: undefined, nameKey: 'unit.merc.name', name: 'Odo', level: 5, exp: 90 };
  c.roster.push(bench, merc);
  return c;
}

/** A battle stand-in: the deployed units (by id) and the haunt fields the reserve looks at. */
const battle = (ids: string[], over: Partial<BattleState> = {}) => ({ units: ids.map((id) => ({ id })), act: 2, ...over }) as unknown as BattleState;

describe('training ground share (story 10.8)', () => {
  it('names the share of each level from balance.yaml, nothing in the act 1 camp', () => {
    const by = data.balance.training.reservePctByLevel;
    expect(reservePct(data, castle(0))).toBe(0);
    expect([1, 2, 3].map((l) => reservePct(data, castle(l)))).toEqual(by);
    expect(reservePct(data, castle(1), 3)).toBe(by[2]);
  });

  it('rounds avg × pct / 100 to the nearest EP', () => {
    expect(reserveShare(12.5, 20)).toBe(3);
    expect(reserveShare(41, 35)).toBe(14);
    expect(reserveShare(0, 50)).toBe(0);
  });
});

describe('trainReserve (story 10.8)', () => {
  it('gives every living member who was not deployed, mercenaries too, the share of the average in company order', () => {
    const c = castle(2);
    const deployed = c.roster.filter((u) => u.id !== 'bench' && u.id !== 'merc9').map((u) => u.id);
    const out = trainReserve(data, c, battle(deployed), [{ exp: 40 }, { exp: 60 }], seedRng(1));
    const share = reserveShare(50, data.balance.training.reservePctByLevel[1]!);
    expect(out.map((r) => r.unit)).toEqual(['bench', 'merc9']);
    expect(out.every((r) => r.exp === share)).toBe(true);
    expect(c.roster.find((u) => u.id === 'bench')!.exp).toBe(share);
  });

  it('levels up through the battle EP core and is deterministic with the same RNG', () => {
    const run = () => {
      const c = castle(3);
      const out = trainReserve(data, c, battle([]), [{ exp: 100 }], seedRng(5));
      return { out, merc: c.roster.find((u) => u.id === 'merc9')! };
    };
    const a = run();
    const b = run();
    // the mercenary held 90 EP: half of 100 lifts it to the next level, the rest stays
    expect(a.out.find((r) => r.unit === 'merc9')).toMatchObject({ levelBefore: 5, levelAfter: 6 });
    expect(a.merc.exp).toBe(40);
    expect(a.merc.stats).toEqual(b.merc.stats);
    expect(a.out).toEqual(b.out);
  });

  it('keeps the act cap: a member at the cap gets nothing, one below it at most up to the cap', () => {
    const c = castle(3);
    const cap = levelCap(data, 2);
    c.roster.find((u) => u.id === 'bench')!.level = cap;
    c.roster.find((u) => u.id === 'merc9')!.level = cap - 1;
    const out = trainReserve(data, c, battle(c.roster.filter((u) => u.id !== 'bench' && u.id !== 'merc9').map((u) => u.id)), [{ exp: 400 }], seedRng(1));
    expect(out.find((r) => r.unit === 'bench')).toMatchObject({ exp: 0, levelAfter: cap });
    expect(out.find((r) => r.unit === 'merc9')).toMatchObject({ exp: 10, levelAfter: cap });
  });

  it('takes the average on the haunt share and gives a member above the expected level only the catch-up part', () => {
    const d: GameData = { ...data, balance: { ...data.balance, haunt: { ...data.balance.haunt, expPct: 60, catchUpExpPct: 50 } } };
    const c = castle(3);
    c.roster.find((u) => u.id === 'merc9')!.level = 12;
    // the deployed earned 60 % of 100 in the haunt: that is the average the reserve shares in
    const out = trainReserve(d, c, battle(c.roster.filter((u) => u.id !== 'bench' && u.id !== 'merc9').map((u) => u.id), { hauntId: 'h2_0', hauntLevel: 8 }), [{ exp: 60 }], seedRng(1));
    expect(out.find((r) => r.unit === 'bench')!.exp).toBe(30);
    expect(out.find((r) => r.unit === 'merc9')!.exp).toBe(15);
  });

  it('gives nothing without an open training ground or when the average is 0', () => {
    expect(trainReserve(data, castle(0), battle([]), [{ exp: 80 }], seedRng(1))).toEqual([]);
    expect(trainReserve(data, castle(2), battle([]), [{ exp: 0 }], seedRng(1))).toEqual([]);
    expect(trainReserve(data, castle(2), battle([]), [], seedRng(1))).toEqual([]);
  });
});

describe('finishBattle with the training ground (story 10.8)', () => {
  function won(c: CampaignState, outcome: 'victory' | 'defeat' = 'victory') {
    const ids = c.roster.filter((u) => u.id !== 'bench' && u.id !== 'merc9').map((u) => u.id);
    const s = beginBattle(data, c, firstNode(data).id, ids).state;
    for (const u of s.units) if (u.team === 'player') u.battleExp = 50;
    s.outcome = outcome;
    return finishBattle(data, c, s);
  }

  it('puts the reserve into the result and the campaign, and the result view draws its line', () => {
    const { campaign, result } = won(castle(1));
    const share = reserveShare(50, data.balance.training.reservePctByLevel[0]!);
    expect(result.reserve.map((r) => [r.unit, r.exp])).toEqual([
      ['bench', share],
      ['merc9', share],
    ]);
    expect(campaign.reserveLast).toEqual(result.reserve);
    expect(missionResultView(result).reserve).toMatchObject({ exp: share });
  });

  it('gives no reserve EP on a defeat or in the act 1 camp', () => {
    const lost = won(castle(2), 'defeat');
    expect(lost.result.reserve).toEqual([]);
    expect(lost.campaign.roster.find((u) => u.id === 'bench')!.exp).toBe(0);
    const camp = won(castle(0));
    expect(camp.result.reserve).toEqual([]);
    expect(missionResultView(camp.result).reserve).toBeNull();
  });

  it('loads older saves with an empty reserve', () => {
    const old = clone(castle(1)) as Partial<CampaignState>;
    delete old.reserveLast;
    expect(normalizeCampaign(data, old as CampaignState).reserveLast).toEqual([]);
  });
});

describe('campfire ranks (story 10.8)', () => {
  const t = () => data.balance.supports.thresholds;
  const core = () => Object.values(data.supports).find((p) => p.core && p.pair.every((id) => base.roster.some((u) => u.id === id)))!;
  const plain = () => Object.values(data.supports).find((p) => !p.core)!;

  function at(level: number, key: string, rank: 'B' | 'A', points: number): CampaignState {
    const c = castle(level);
    c.supports[key] = { rank, points };
    return c;
  }

  it('opens rank A only after building the campfire to level 2, with the reason before', () => {
    const key = core().key;
    expect(unlockableRank(data, at(1, key, 'B', t().A), key)).toBeNull();
    expect(campfireLock(data, at(1, key, 'B', t().A), key)).toEqual({ rank: 'A', reason: 'level', level: 2 });
    expect(unlockableRank(data, { ...at(1, key, 'B', t().A), home: { kind: 'castle', rooms: { campfire: 2 } } }, key)).toBe('A');
    expect(campfireLock(data, { ...at(1, key, 'B', t().A), home: { kind: 'castle', rooms: { campfire: 2 } } }, key)).toBeNull();
  });

  it('opens rank S at campfire level 3 only for core pairs', () => {
    const key = core().key;
    const lvl2 = { ...at(1, key, 'A', t().S), home: { kind: 'castle' as const, rooms: { campfire: 2 } } };
    expect(campfireLock(data, lvl2, key)).toEqual({ rank: 'S', reason: 'level', level: 3 });
    const lvl3 = { ...lvl2, home: { kind: 'castle' as const, rooms: { campfire: 3 } } };
    expect(unlockableRank(data, lvl3, key)).toBe('S');
    const other = plain().key;
    const c = { ...at(1, other, 'A', t().A), home: { kind: 'castle' as const, rooms: { campfire: 3 } } };
    expect(unlockableRank(data, c, other)).toBeNull();
    expect(campfireLock(data, c, other)).toEqual({ rank: 'S', reason: 'core' });
  });
});
