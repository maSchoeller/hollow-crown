import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  firstNode,
  beginBattle,
  combatExp,
  effectiveLevel,
  expProgress,
  getUnit,
  grantExp,
  levelCap,
  missionResultView,
  newCampaign,
  seedRng,
  type BattleResult,
  type BattleUnit,
  type CampaignState,
  type GameData,
  type GameEvent,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

const lucan = (): BattleUnit => getUnit(beginBattle(data, base, firstNode(data).id, base.roster.map((r) => r.id)).state, 'lucan');

describe('level cap (story 6.5)', () => {
  it('comes from the act campaign and never exceeds the top level', () => {
    expect(data.campaign.levelCap).toBe(10);
    expect(levelCap(data)).toBe(10);
    expect(levelCap({ ...data, campaign: { ...data.campaign, levelCap: undefined } })).toBe(data.balance.levels.max);
    expect(levelCap({ ...data, campaign: { ...data.campaign, levelCap: 99 } })).toBe(data.balance.levels.max);
  });

  it('forfeits EXP at the cap and reports capped', () => {
    const u = lucan();
    u.level = 10;
    u.exp = 0;
    u.battleExp = 0;
    const events: GameEvent[] = [];
    grantExp(data, u, 40, seedRng(1), events);
    expect(u.level).toBe(10);
    expect(u.exp).toBe(0);
    expect(u.battleExp).toBe(0);
    expect(events).toEqual([{ t: 'exp', unit: u.uid, amount: 40, before: 0, after: 0, capped: true }]);
  });

  it('counts EXP up to the cap and drops the rest', () => {
    const u = lucan();
    u.level = 9;
    u.exp = 70;
    u.battleExp = 0;
    const events: GameEvent[] = [];
    grantExp(data, u, 80, seedRng(1), events);
    expect(u.level).toBe(10);
    expect(u.exp).toBe(0);
    expect(u.battleExp).toBe(30);
    const exp = events.find((e) => e.t === 'exp');
    expect(exp).toMatchObject({ amount: 80, before: 70, capped: true });
    expect(events.filter((e) => e.t === 'levelUp')).toHaveLength(1);
  });

  it('levels normally below the cap without capped', () => {
    const u = lucan();
    u.level = 3;
    u.exp = 50;
    const events: GameEvent[] = [];
    grantExp(data, u, 60, seedRng(1), events);
    expect(u.level).toBe(4);
    expect(u.exp).toBe(10);
    expect(events.find((e) => e.t === 'exp')).not.toHaveProperty('capped');
  });

  it('shows the cap in the figure and the result', () => {
    const u = lucan();
    u.level = 10;
    expect(expProgress(data, u)).toMatchObject({ full: true, capped: true, cap: 10, act: 1 });
    u.level = 9;
    expect(expProgress(data, u)).toMatchObject({ full: false, capped: false });
    const r = { units: [{ id: 'lucan', nameKey: 'unit.lucan.name', levelBefore: 9, levelAfter: 10, exp: 30, capped: true, mastered: [] }], fallen: [] };
    const v = missionResultView({ ...r, outcome: 'victory', nodeId: 'prologue', turns: 3, side: [], gold: 0, materials: {}, items: [], bounty: [], scars: [], recruited: [], supportsReady: [], granted: [] } as BattleResult);
    expect(v.figures[0]).toMatchObject({ capped: true, leveledUp: true });
  });
});

describe('EXP rules (GDD Figurensystem)', () => {
  const at = (u: BattleUnit, level: number): BattleUnit => ({ ...u, level });

  // values from balance.yaml `experience` (story 15.10, 2026-11-07: combatBase 11, killBase 34, killPerLevelDiff 0)
  const e = () => data.balance.experience;
  const clampTo = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  it('combat = base + level delta within min-max', () => {
    const u = lucan();
    expect(combatExp(data, at(u, 5), at(u, 5), false, false)).toBe(e().combatBase);
    expect(combatExp(data, at(u, 5), at(u, 8), false, false)).toBe(e().combatBase + 3);
    expect(combatExp(data, at(u, 15), at(u, 1), false, false)).toBe(e().combatMin);
    expect(combatExp(data, at(u, 1), at(u, 20), false, false)).toBe(clampTo(e().combatBase + 19, e().combatMin, e().combatMax));
  });

  it('defeat = base + killPerLevelDiff · delta within min-max, boss and lieutenant + bossBonus', () => {
    const u = lucan();
    const kill = (delta: number) => clampTo(e().killBase + e().killPerLevelDiff * delta, e().killMin, e().killMax);
    expect(combatExp(data, at(u, 5), at(u, 5), true, false)).toBe(e().killBase);
    expect(combatExp(data, at(u, 5), at(u, 7), true, false)).toBe(kill(2));
    expect(combatExp(data, at(u, 20), at(u, 1), true, false)).toBe(kill(-19));
    expect(combatExp(data, at(u, 5), at(u, 5), true, true)).toBe(e().killBase + e().bossBonus);
    expect(combatExp(data, at(u, 5), { ...at(u, 5), lieutenant: 'hask' }, true, false)).toBe(e().killBase + e().bossBonus);
    // a lieutenant only adds the bonus when driven off, not for a plain exchange
    expect(combatExp(data, at(u, 5), { ...at(u, 5), lieutenant: 'hask' }, false, false)).toBe(e().combatBase);
    // weaker foes are worth as much as equal ones (killPerLevelDiff 0): late in act 1 the foes stand below the army
    expect(e().killPerLevelDiff).toBe(0);
  });

  it('pro classes count 15 levels higher', () => {
    const pro = Object.values(data.classes).find((c) => c.tier === 'pro');
    expect(pro).toBeDefined();
    const u = lucan();
    const foe = { ...at(u, 5), classId: pro!.id };
    expect(effectiveLevel(data, foe) - effectiveLevel(data, at(u, 5))).toBe(data.balance.experience.advancedLevelOffset);
  });

  it('balance holds the GDD values', () => {
    const e = data.balance.experience;
    expect([e.levelUpAt, e.heal, e.healExtraTarget, e.rescueOrTalk, e.bossBonus]).toEqual([100, 12, 3, 10, 20]);
  });
});
