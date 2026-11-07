/**
 * Skill conditions and totals (concept/04 §3): every condition of `conditionMet` holds exactly in its situation, totals
 * combine as the rules say (damage taken multiplies), and set pieces, loadout and pro tier feed the active skills.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  activeSkillIds,
  computeStats,
  conditionMet,
  effectiveLevel,
  newItem,
  setBonuses,
  skillTotals,
  weaponProfile,
  type BattleState,
  type GameData,
  type SkillCondition,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

const cond = (c: object) => c as SkillCondition;

function board() {
  const s: BattleState = arena(data);
  const me = place(data, s, 'player', 'captain', [5, 5], 'iron_sword');
  const foe = place(data, s, 'enemy', 'brigand', [6, 5], 'iron_axe');
  return { s, me, foe };
}

describe('conditionMet', () => {
  it('no condition always holds', () => {
    const { me } = board();
    expect(conditionMet(data, undefined, { unit: me })).toBe(true);
  });

  it('notMovedThisTurn reads the moved flag of a unit on the board', () => {
    const { me } = board();
    const c = cond({ notMovedThisTurn: true });
    expect(conditionMet(data, c, { unit: me })).toBe(true);
    me.moved = true;
    expect(conditionMet(data, c, { unit: me })).toBe(false);
    const { hp: _hp, uid: _uid, ...record } = me;
    expect(conditionMet(data, c, { unit: record as never })).toBe(false); // off the board: no
  });

  it('adjacentAllies counts active allies next to the tile, not foes and not downed ones', () => {
    const { s, me } = board();
    const c = cond({ adjacentAllies: 2 });
    const ally = place(data, s, 'player', 'captain', [5, 6]);
    expect(conditionMet(data, c, { state: s, unit: me })).toBe(false);
    const second = place(data, s, 'player', 'captain', [4, 5]);
    expect(conditionMet(data, c, { state: s, unit: me })).toBe(true);
    second.downed = true;
    expect(conditionMet(data, c, { state: s, unit: me })).toBe(false);
    expect(conditionMet(data, c, { unit: me })).toBe(false); // needs the board
    void ally;
  });

  it('distance, HP and initiator conditions', () => {
    const { me } = board();
    expect(conditionMet(data, cond({ distanceAtLeast: 2 }), { unit: me, distance: 1 })).toBe(false);
    expect(conditionMet(data, cond({ distanceAtLeast: 2 }), { unit: me, distance: 2 })).toBe(true);
    me.hp = 10;
    expect(conditionMet(data, cond({ hpBelowPercent: 50 }), { unit: me, maxHp: 20 })).toBe(false); // exactly half is not below
    expect(conditionMet(data, cond({ hpBelowPercent: 50 }), { unit: me, maxHp: 21 })).toBe(true);
    expect(conditionMet(data, cond({ hpBelowPercent: 50 }), { unit: me })).toBe(false);
    expect(conditionMet(data, cond({ hpAbove: 10 }), { unit: me })).toBe(false);
    expect(conditionMet(data, cond({ hpAbove: 9 }), { unit: me })).toBe(true);
    expect(conditionMet(data, cond({ initiator: true }), { unit: me, initiator: false })).toBe(false);
    expect(conditionMet(data, cond({ initiator: false }), { unit: me })).toBe(true);
  });

  it('adjacentTo names an ally by character or unit id', () => {
    const { s, me } = board();
    const friend = place(data, s, 'player', 'captain', [5, 4]);
    expect(conditionMet(data, cond({ adjacentTo: friend.id }), { state: s, unit: me })).toBe(true);
    expect(conditionMet(data, cond({ adjacentTo: 'someone_else' }), { state: s, unit: me })).toBe(false);
    friend.pos = [5, 2];
    expect(conditionMet(data, cond({ adjacentTo: friend.id }), { state: s, unit: me })).toBe(false);
    expect(conditionMet(data, cond({ adjacentTo: friend.id }), { unit: me })).toBe(false);
  });

  it('enemyLevelHigher compares effective levels, a pro class counts its offset', () => {
    const { me, foe } = board();
    me.level = 5;
    foe.level = 5;
    const c = cond({ enemyLevelHigher: true });
    expect(conditionMet(data, c, { unit: me, opponent: foe })).toBe(false);
    foe.level = 6;
    expect(conditionMet(data, c, { unit: me, opponent: foe })).toBe(true);
    expect(conditionMet(data, c, { unit: me })).toBe(false);
    me.classId = 'duelist'; // pro tier
    expect(effectiveLevel(data, me)).toBe(5 + data.balance.experience.advancedLevelOffset);
    expect(conditionMet(data, c, { unit: me, opponent: foe })).toBe(false);
  });

  it('selfOnTerrain reads the tile the unit stands or would stand on', () => {
    const { s, me } = board();
    const c = cond({ selfOnTerrain: 'forest' });
    expect(conditionMet(data, c, { state: s, unit: me })).toBe(false);
    s.terrain[5 * s.width + 4] = 'forest';
    expect(conditionMet(data, c, { state: s, unit: me, pos: [4, 5] })).toBe(true);
    expect(conditionMet(data, c, { unit: me, pos: [4, 5] })).toBe(false);
  });

  it('conditions on the weapons of both sides', () => {
    const { s, me, foe } = board();
    const sword = weaponProfile(data, me.equip.mainHand!, s);
    const ember = weaponProfile(data, newItem(s, 'ember', data), s);
    expect(conditionMet(data, cond({ attackerDamageType: 'magical' }), { unit: me, opponentWeapon: sword })).toBe(false);
    expect(conditionMet(data, cond({ attackerDamageType: 'magical' }), { unit: me, opponentWeapon: ember })).toBe(true);
    expect(conditionMet(data, cond({ weaponType: 'sword' }), { unit: me, ownWeapon: sword })).toBe(true);
    expect(conditionMet(data, cond({ weaponType: 'axe' }), { unit: me, ownWeapon: sword })).toBe(false);
    expect(conditionMet(data, cond({ attackerNoElement: true }), { unit: me, opponentWeapon: ember })).toBe(false);
    expect(conditionMet(data, cond({ attackerNoElement: true }), { unit: me, opponentWeapon: sword })).toBe(true);
    expect(conditionMet(data, cond({ notEffective: true }), { unit: me, opponentEffective: true })).toBe(false);
    expect(conditionMet(data, cond({ notEffective: true }), { unit: me, opponentEffective: false })).toBe(true);
    void foe;
  });

  it('conditions on the target: status, class tag, allies around it', () => {
    const { s, me, foe } = board();
    expect(conditionMet(data, cond({ targetStatus: 'wet' }), { unit: me, opponent: foe })).toBe(false);
    foe.status = [{ id: 'wet', turns: 1 }] as typeof foe.status;
    expect(conditionMet(data, cond({ targetStatus: 'wet' }), { unit: me, opponent: foe })).toBe(true);
    expect(conditionMet(data, cond({ targetTag: 'armored' }), { unit: me, opponent: foe })).toBe(false);
    expect(conditionMet(data, cond({ targetTag: 'armored' }), { unit: me })).toBe(false);
    foe.classId = 'knight';
    expect(conditionMet(data, cond({ targetTag: 'armored' }), { unit: me, opponent: foe })).toBe(data.classes.knight!.tags.includes('armored'));

    const c = cond({ alliesAdjacentToTarget: 1 });
    expect(conditionMet(data, c, { state: s, unit: me, opponent: foe })).toBe(false); // the attacker itself does not count
    place(data, s, 'player', 'captain', [7, 5]);
    expect(conditionMet(data, c, { state: s, unit: me, opponent: foe })).toBe(true);
    expect(conditionMet(data, c, { unit: me, opponent: foe })).toBe(false);
  });

  it('allyDownedWithin sees a downed ally on the map within range', () => {
    const { s, me } = board();
    const c = cond({ allyDownedWithin: 2 });
    const ally = place(data, s, 'player', 'captain', [5, 8]);
    ally.downed = true;
    expect(conditionMet(data, c, { state: s, unit: me })).toBe(false);
    ally.pos = [5, 7];
    expect(conditionMet(data, c, { state: s, unit: me })).toBe(true);
    expect(conditionMet(data, c, { unit: me })).toBe(false);
  });
});

describe('skillTotals and active skills', () => {
  it('damage taken multiplies over several skills', () => {
    const { s, foe } = board();
    const drake = place(data, s, 'enemy', 'drake_young', [3, 3]);
    drake.equip.head = newItem(s, 'mage_hood', data); // magic ward: 70 % against magic
    const ember = weaponProfile(data, newItem(s, 'ember', data), s);
    const sword = weaponProfile(data, newItem(s, 'iron_sword', data), s);
    // dragonhide halves only damage without element; magic ward cuts magic
    const vsSword = skillTotals(data, { state: s, unit: drake, opponentWeapon: sword }, 'combat_defend');
    expect(vsSword.damageTakenPercent).toBe(50);
    expect(vsSword.used).toContain('dragonhide');
    const vsEmber = skillTotals(data, { state: s, unit: drake, opponentWeapon: ember }, 'combat_defend');
    expect(vsEmber.damageTakenPercent).toBe(70);
    const magicNoElement = { ...ember, element: undefined };
    expect(skillTotals(data, { state: s, unit: drake, opponentWeapon: magicNoElement }, 'combat_defend').damageTakenPercent).toBe(35);
    // on_defend skills do nothing on the stat screen
    expect(skillTotals(data, { state: s, unit: drake, opponentWeapon: sword }, 'stats').damageTakenPercent).toBe(100);
    void foe;
  });

  it('set pieces grant their bonuses by count; mastered loadout skills count, unmastered ones do not', () => {
    const { s, me } = board();
    me.equip.head = newItem(s, 'iron_helm', data);
    expect(setBonuses(data, me)).toEqual([]);
    me.equip.offHand = newItem(s, 'iron_shield', data);
    expect(setBonuses(data, me)).toEqual([{ stats: { def: 2 } }]);
    const bare = computeStats(data, { ...me, equip: {} }).stats.def;
    expect(computeStats(data, me).stats.def).toBe(bare + 2 + 4 + 2 + 3); // set + shield + helm + shield wall (not moved)
    me.moved = true;
    expect(computeStats(data, me).stats.def).toBe(bare + 2 + 4 + 2);

    me.loadout = ['miracle'];
    expect(activeSkillIds(data, me)).not.toContain('miracle');
    me.mastered = ['miracle'];
    expect(activeSkillIds(data, me)).toContain('miracle');
    me.personalSkill = 'no_such_skill';
    expect(activeSkillIds(data, me)).not.toContain('no_such_skill');
  });
});
