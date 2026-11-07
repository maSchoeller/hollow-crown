/**
 * Effective values (concept/04 §1): scars, grief, status, buffs and overload change exactly the numbers they name;
 * affix rolls and the rarity of an affixed item (concept/05 §5).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { computeStats, seedRng, instanceRarity, rollAffixes, type BattleUnit, type GameData } from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

function unit(weapon?: string): BattleUnit {
  const s = arena(data);
  return place(data, s, 'player', 'breaker', [5, 5], weapon);
}

describe('scars and grief', () => {
  it('each scar lowers what it names; an unknown scar id changes nothing', () => {
    const u = unit();
    const base = computeStats(data, u);
    u.scars = ['lame_leg', 'shaky_hand', 'broken_ribs', 'weak_eye', 'shattered_shoulder', 'nightmares', 'no_such_scar'];
    const s = computeStats(data, u);
    expect(s.mov).toBe(base.mov - 1);
    expect(s.maxHp).toBe(base.maxHp - 3);
    expect(s.hit).toBe(base.hit - 15);
    expect(s.crit).toBe(base.crit - 5);
    expect(s.avoid).toBe(base.avoid - 5);
    expect(s.stats.str).toBe(base.stats.str - 2);
    expect(s.stats.lck).toBe(base.stats.lck - 3);
  });

  it('a stat never drops below 0', () => {
    const u = unit();
    u.stats.str = 1;
    u.scars = ['shattered_shoulder'];
    expect(computeStats(data, u).stats.str).toBe(0);
  });

  it('grief costs hit while missions of mourning remain', () => {
    const u = unit();
    const base = computeStats(data, u).hit;
    u.grief = 2;
    expect(computeStats(data, u).hit).toBe(base - data.balance.supports.griefHitPenalty);
    u.grief = 0;
    expect(computeStats(data, u).hit).toBe(base);
  });
});

describe('status and buffs on the board', () => {
  it('wet lowers SPD and with it the attack speed, slowed lowers MOV', () => {
    const u = unit();
    const base = computeStats(data, u);
    u.status = [{ id: 'wet', turns: 1 }] as BattleUnit['status'];
    const wet = computeStats(data, u);
    expect(wet.stats.spd).toBe(Math.max(0, base.stats.spd - data.balance.status.wetSpdPenalty));
    expect(wet.as).toBe(wet.stats.spd - wet.overload);
    expect(wet.mov).toBe(base.mov);
    u.status = [{ id: 'slowed', turns: 1 }] as BattleUnit['status'];
    const slow = computeStats(data, u);
    expect(slow.mov).toBe(base.mov - data.balance.status.slowMovPenalty);
    expect(slow.stats.spd).toBe(base.stats.spd);
  });

  it('buffs add hit and MOV', () => {
    const u = unit();
    const base = computeStats(data, u);
    u.buffs = [{ source: 'test', hit: 10, mov: 2, untilTurn: 1, untilPhase: 'player' }];
    const s = computeStats(data, u);
    expect([s.hit, s.mov]).toEqual([base.hit + 10, base.mov + 2]);
  });
});

describe('weight and overload', () => {
  it('load over carry slows the attack and costs MOV at the thresholds of the balance', () => {
    const u = unit('hammer');
    const penalty = data.balance.weight.movPenalty;
    const cls = data.classes[u.classId]!;
    const carryBonus = data.balance.weight.carryBonus[cls.moveType];
    const load = computeStats(data, u).load;
    expect(load).toBeGreaterThanOrEqual(penalty[1]!.overload + carryBonus);
    const at = (overload: number) => {
      u.stats.str = load - carryBonus - overload;
      return computeStats(data, u);
    };
    expect(at(0)).toMatchObject({ overload: 0, mov: cls.mov });
    expect(at(penalty[0]!.overload - 1)).toMatchObject({ overload: penalty[0]!.overload - 1, mov: cls.mov });
    const one = at(penalty[0]!.overload);
    expect(one).toMatchObject({ overload: penalty[0]!.overload, mov: cls.mov - penalty[0]!.mov });
    expect(one.as).toBe(one.stats.spd - penalty[0]!.overload);
    expect(at(penalty[1]!.overload)).toMatchObject({ mov: cls.mov - penalty[1]!.mov });
    u.stats.str = load + 5; // more carry than load: no negative overload
    expect(computeStats(data, u).overload).toBe(0);
  });
});

describe('affixes and rarity', () => {
  it('rolls as many distinct affixes as the rarity allows, the same for the same seed, never an excluded one', () => {
    for (const rarity of ['common', 'rare', 'epic'] as const) {
      const a = rollAffixes(data, seedRng(11), 'iron_sword', rarity);
      expect(a).toEqual(rollAffixes(data, seedRng(11), 'iron_sword', rarity));
      expect(a).toHaveLength(data.balance.economy.rarityAffixes[rarity]);
      expect(new Set(a).size).toBe(a.length);
      for (const id of a) expect(data.affixes[id]!.appliesTo).toContain('weapon');
    }
    const first = rollAffixes(data, seedRng(11), 'iron_sword', 'epic');
    expect(rollAffixes(data, seedRng(11), 'iron_sword', 'epic', first)).not.toContain(first[0]);
  });

  it('an item without an affix category gets none', () => {
    expect(rollAffixes(data, seedRng(3), 'vulnerary', 'epic')).toEqual([]);
  });

  it('affixes raise the rarity (1 → rare, 2 → epic) but never lower it; legendary stays', () => {
    expect(instanceRarity(data, 'iron_sword', 0)).toBe('common');
    expect(instanceRarity(data, 'iron_sword', 1)).toBe('rare');
    expect(instanceRarity(data, 'iron_sword', 2)).toBe('epic');
    expect(instanceRarity(data, 'hammer', 0)).toBe('rare');
    expect(instanceRarity(data, 'hammer', 1)).toBe('rare');
    expect(instanceRarity(data, 'tinder', 2)).toBe('legendary');
  });
});
