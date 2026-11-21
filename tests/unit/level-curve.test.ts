import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  addExp,
  atBattleLevel,
  beginBattle,
  clone,
  combatExp,
  effectiveLevel,
  expToNext,
  joinLieutenant,
  levelForEffective,
  lieutenantLevel,
  newCampaign,
  seedRng,
  type CampaignEvent,
  type CampaignState,
  type GameData,
  type MapUnitDef,
  type UnitRecord,
} from '../../src/core';

// Produktinhaber 2026-11-21 (GDD Figurensystem): EP curve by effective level, more EP for stronger foes, an enemy level bonus per
// difficulty, and lieutenants who join on their effective level
let data: GameData;
let base: CampaignState;
const avatar = { name: 'Rhen', pronoun: 'they' as const, portrait: 'avatar_a', affinity: 'wind' as const };

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, avatar);
});

const withBalance = (patch: (b: GameData['balance']) => void): GameData => {
  const balance = clone(data.balance);
  patch(balance);
  return { ...data, balance };
};

const unit = (classId: string, level: number): UnitRecord => ({ ...clone(base.roster.find((r) => r.id === 'brenna')!), classId, level, exp: 0 });

describe('levelCurve', () => {
  it('takes the entry of the effective level, the last one past the end', () => {
    const d = withBalance((b) => (b.levelCurve = [100, 150, 300]));
    expect(expToNext(d, unit('vanguard', 1))).toBe(100);
    expect(expToNext(d, unit('vanguard', 2))).toBe(150);
    expect(expToNext(d, unit('vanguard', 9))).toBe(300);
    // a pro of level 1 counts advancedLevelOffset on top: the promotion is no cheap restart of the curve
    const pro = Object.values(d.classes).find((c) => c.tier === 'pro')!;
    const d2 = withBalance((b) => (b.levelCurve = Array.from({ length: 30 }, (_, i) => 100 + i * 10)));
    expect(expToNext(d2, unit(pro.id, 1))).toBe(100 + (effectiveLevel(d2, unit(pro.id, 1)) - 1) * 10);
  });

  it('levels several times with the growing need and keeps the rest', () => {
    const d = withBalance((b) => (b.levelCurve = [100, 150, 300]));
    const u = unit('vanguard', 1);
    const gain = addExp(d, u, 270, seedRng(1), 20);
    expect(gain.levelUps.map((l) => l.level)).toEqual([2, 3]);
    expect(u.level).toBe(3);
    expect(u.exp).toBe(20);
  });

  it('counts the EP only up to the cap along the curve', () => {
    const d = withBalance((b) => (b.levelCurve = [100, 150, 300]));
    const u = unit('vanguard', 1);
    const gain = addExp(d, u, 1000, seedRng(1), 3);
    expect(gain.counted).toBe(250);
    expect(gain.capped).toBe(true);
    expect(u.level).toBe(3);
    expect(u.exp).toBe(0);
  });
});

describe('killPerLevelAbove', () => {
  it('pays more for a foe above the unit and takes nothing off below', () => {
    const d = withBalance((b) => {
      b.experience.killPerLevelAbove = 4;
      b.experience.killPerLevelDiff = 0;
    });
    const me = unit('vanguard', 10);
    const e = d.balance.experience;
    expect(combatExp(d, me, unit('vanguard', 13), true, false)).toBe(e.killBase + 12);
    expect(combatExp(d, me, unit('vanguard', 5), true, false)).toBe(e.killBase);
  });
});

describe('enemyLevelBonus', () => {
  const foe = { class: 'brigand', team: 'enemy', level: 7, at: [0, 0] } as unknown as MapUnitDef;

  it('raises plain enemies of a story map, not lieutenants, characters, allies or haunts', () => {
    const d = withBalance((b) => (b.difficulty.normal.enemyLevelBonus = [2]));
    const s = { positionLevel: undefined, settings: { difficulty: 'normal' as const, deathMode: 'standard' as const } };
    expect(atBattleLevel(d, foe, s).level).toBe(9);
    expect(atBattleLevel(d, { ...foe, levelOffset: -3 }, { ...s, positionLevel: 15 }).level).toBe(14);
    expect(atBattleLevel(d, { ...foe, lieutenant: 'hask' }, s).level).toBe(7);
    expect(atBattleLevel(d, { ...foe, char: 'mira' }, s).level).toBe(7);
    expect(atBattleLevel(d, { ...foe, team: 'other' } as MapUnitDef, s).level).toBe(7);
    expect(atBattleLevel(d, foe, { ...s, hauntId: 'h1' }).level).toBe(7);
    expect(atBattleLevel(d, foe, { ...s, settings: { difficulty: 'easy', deathMode: 'standard' } }).level).toBe(7 + (d.balance.difficulty.easy.enemyLevelBonus?.[0] ?? 0));
  });

  it('leaves a map with enemyLevelBonus: false as it is (act 2 finale)', () => {
    const d = withBalance((b) => (b.difficulty.normal.enemyLevelBonus = [2]));
    expect(d.maps.m2_8_kronfeld!.enemyLevelBonus).toBe(false);
    const s = { positionLevel: undefined, settings: { difficulty: 'normal' as const, deathMode: 'standard' as const } };
    expect(atBattleLevel(d, foe, { ...s, mapId: 'm2_8_kronfeld' }).level).toBe(7);
    expect(atBattleLevel(d, foe, { ...s, mapId: 'm1_1_steckbriefe' }).level).toBe(9);
  });

  it('takes the entry of the act, the last one for later acts', () => {
    const d = withBalance((b) => (b.difficulty.normal.enemyLevelBonus = [1, 3]));
    const s = { positionLevel: undefined, settings: { difficulty: 'normal' as const, deathMode: 'standard' as const } };
    expect(atBattleLevel(d, foe, s).level).toBe(8);
    expect(atBattleLevel(d, foe, { ...s, act: 2 }).level).toBe(10);
    expect(atBattleLevel(d, foe, { ...s, act: 3 }).level).toBe(10);
  });

  it('reaches the board of a story battle', () => {
    const d = withBalance((b) => (b.difficulty.normal.enemyLevelBonus = [3]));
    const plain = beginBattle(data, base, 'm1_1', base.roster.map((r) => r.id)).state;
    const raised = beginBattle(d, base, 'm1_1', base.roster.map((r) => r.id)).state;
    const levels = (s: typeof plain) => s.units.filter((u) => u.team === 'enemy' && !u.lieutenant).map((u) => u.level);
    expect(levels(raised)).toEqual(levels(plain).map((l) => l + 3 - (data.balance.difficulty.normal.enemyLevelBonus?.[0] ?? 0)));
  });
});

describe('lieutenant level of a pro class', () => {
  it('stands advancedLevelOffset lower than the effective company level (Sable joined on 21, fault 2026-11-21)', () => {
    const pro = data.classes.duelist!;
    expect(pro.tier).toBe('pro');
    const off = data.balance.experience.advancedLevelOffset;
    expect(levelForEffective(data, 'duelist', 28)).toBe(28 - off);
    expect(levelForEffective(data, 'duelist', 10)).toBe(1);
    expect(levelForEffective(data, 'brigand', 18)).toBe(18);

    const c = clone(base);
    for (const r of c.roster) r.level = 20;
    const expected = Math.max(data.chars.sable!.level, lieutenantLevel(data, c, 0) - off);
    const events: CampaignEvent[] = [];
    joinLieutenant(data, c, 'sable', events);
    const sable = c.roster.find((r) => r.id === 'sable')!;
    expect(sable.level).toBe(expected);
    expect(sable.level).toBeLessThanOrEqual(data.balance.levels.max);
  });
});
