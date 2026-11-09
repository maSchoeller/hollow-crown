import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  activeSkillIds,
  applyCommand,
  canEquip,
  clone,
  newCampaign,
  newItem,
  promote,
  promotionTargets,
  skillRadius,
  skillTotals,
  skillUses,
  skillUsable,
  weaponGroupsOf,
  type CampaignState,
  type GameData,
  type UnitRecord,
} from '../../src/core';
import { labState, labUnit } from '../fixtures/lab';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

const NEW = ['blade_dancer', 'ranger', 'hexer', 'battle_priest', 'bard', 'standard_bearer', 'shadow', 'trapper', 'grand_strategist', 'banner_lord'];
const LATER = ['shadow', 'trapper'];

/** A company member of `role`, promoted to `classId` (rules only, no academy). */
function proOf(role: string, classId: string): UnitRecord {
  const c = clone(base);
  const u = role === 'tactician' ? c.roster[0]! : c.roster.find((r) => r.classId === role) ?? { ...clone(c.roster[1]!), classId: role };
  u.level = data.balance.levels.promoteFrom;
  promote(data, u, classId);
  return u;
}

describe('pro classes (story 10.3)', () => {
  it('has 16 pro classes; each comes from a role that names it, the later ones are not playable yet', () => {
    const pros = Object.values(data.classes).filter((c) => c.tier === 'pro');
    expect(pros).toHaveLength(16);
    for (const id of NEW) {
      const c = data.classes[id]!;
      expect(c.tier).toBe('pro');
      expect(data.classes[c.role]!.proPaths).toContain(id);
      expect(c.mov).toBe(Math.min(6, data.classes[c.role]!.mov + 1));
      expect(c.weaponGroups).toEqual(data.classes[c.role]!.weaponGroups);
      expect(c.skill).toBe(data.classes[c.role]!.skill);
      expect(c.playable).toBe(!LATER.includes(id));
      for (const r of c.proSkills ?? []) expect(r.startsWith('pro_') && data.skills[r]?.source === 'class').toBe(true);
    }
    expect(promotionTargets(data, 'minstrel')).toEqual(['bard', 'standard_bearer']);
    expect(promotionTargets(data, 'scout')).toEqual([]);
    expect(promotionTargets(data, 'tactician')).toEqual(['grand_strategist']);
    expect(promotionTargets(data, 'captain')).toEqual(['banner_lord']);
  });

  it('bulwark and breaker are armored with movement 5', () => {
    for (const id of ['bulwark', 'breaker']) {
      expect(data.classes[id]!.moveType).toBe('armored');
      expect(data.classes[id]!.mov).toBe(5);
    }
  });

  it('blade dancer: +15 avoid, +10 crit', () => {
    const u = proOf('skirmisher', 'blade_dancer');
    const t = skillTotals(data, { unit: u }, 'stats');
    const plain = skillTotals(data, { unit: { ...u, classId: 'skirmisher' } }, 'stats');
    expect(t.avoid - plain.avoid).toBe(15);
    expect(t.crit - plain.crit).toBe(10);
  });

  it('ranger: forest costs 1 and swords join the bow', () => {
    const u = proOf('marksman', 'ranger');
    expect(skillTotals(data, { unit: u }, 'stats').terrainCost.forest).toBe(1);
    expect(weaponGroupsOf(data, u)).toEqual(expect.arrayContaining(['bow', 'sword']));
    const c = clone(base);
    expect(canEquip(data, u, newItem(c, 'iron_sword', data), 'mainHand', activeSkillIds(data, u, null))).toBeNull();
    expect(canEquip(data, { ...u, classId: 'marksman' }, newItem(c, 'iron_sword', data), 'mainHand')).toBe('weapon_group');
  });

  it('hexer: +20 status chance and dark magic; battle priest: axes', () => {
    const h = proOf('elementalist', 'hexer');
    const plain = skillTotals(data, { unit: { ...h, classId: 'sage' } }, 'stats');
    expect(skillTotals(data, { unit: h }, 'stats').statusChance - plain.statusChance).toBe(20);
    expect(weaponGroupsOf(data, h)).toContain('dark');
    expect(weaponGroupsOf(data, proOf('healer', 'battle_priest'))).toEqual(expect.arrayContaining(['staff', 'light', 'axe']));
  });

  it('a second path learned in the academy brings its weapon groups', () => {
    const u = proOf('marksman', 'sharpshooter');
    expect(weaponGroupsOf(data, u)).not.toContain('sword');
    expect(weaponGroupsOf(data, { ...u, secondPath: 'ranger' })).toContain('sword');
  });

  it('grand strategist commands twice, banner lord rallies with radius 3 (lab: profi-wege)', () => {
    const { state } = labState(data, 'profi-wege');
    const lucan = labUnit(state, 'lab_lord');
    const avatar = labUnit(state, 'lab_strategist');
    expect(skillUses(data, avatar, 'tactician_command', null)).toBe(2);
    expect(skillUses(data, { ...avatar, classId: 'tactician' }, 'tactician_command', null)).toBe(1);
    expect(skillRadius(data, lucan, 'rally', null)).toBe(3);
    const r = applyCommand(data, state, { type: 'act', unit: lucan.uid, to: lucan.pos!, action: { kind: 'rally' } });
    const rally = r.events.find((e) => e.t === 'rally') as { affected: string[] } | undefined;
    expect(rally?.affected).toContain(labUnit(state, 'lab_archer').uid);
    expect(rally?.affected).not.toContain(labUnit(state, 'lab_far').uid);
    // command: two uses
    const a = labUnit(r.state, 'lab_strategist');
    a.usedPerMap.tactician_command = 1;
    expect(skillUsable(data, a, 'tactician_command', null)).toBe(true);
    a.usedPerMap.tactician_command = 2;
    expect(skillUsable(data, a, 'tactician_command', null)).toBe(false);
  });
});
