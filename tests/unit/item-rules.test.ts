/**
 * Item rules (concept/05 §5–7): what affixes and runes change on weapons and armor, and every reason `canEquip` refuses.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  activeSkillIds,
  canEquip,
  CoreInvariantError,
  itemDef,
  itemElement,
  itemStatMods,
  itemWeight,
  newItem,
  runeSlotCount,
  weaponProfile,
  type BattleState,
  type GameData,
  type ItemInstance,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
let s: BattleState;
beforeAll(() => {
  data = loadContentFromDisk().data;
});
beforeEach(() => {
  s = arena(data);
});

const item = (id: string, mods: Partial<Pick<ItemInstance, 'affixes' | 'runes' | 'upgrade'>> = {}): ItemInstance => ({ ...newItem(s, id, data), ...mods });

describe('weapon profile: affixes and runes', () => {
  it('weapon affixes add might, weight, crit, hit, effectiveness, status and tag damage', () => {
    const base = weaponProfile(data, item('iron_sword'));
    const p = weaponProfile(data, item('iron_sword', { affixes: ['heavy', 'keen', 'accurate', 'dragonslayer', 'of_embers', 'of_the_hunt'] }));
    expect(p.might).toBe(base.might + 2);
    expect(p.weight).toBe(base.weight + 2);
    expect(p.crit).toBe(base.crit + 5);
    expect(p.hit).toBe(base.hit + 10);
    expect(p.effectiveVs).toEqual([...base.effectiveVs, 'dragon']);
    expect(p.statusOnHit).toEqual([{ status: 'burning', chance: 15 }]);
    expect(p.damageVsTag).toEqual([{ tag: 'flier', bonus: 2 }]);
  });

  it('weight never drops below 0', () => {
    const light = data.items.iron_dagger!.wt;
    const p = weaponProfile(data, item('iron_dagger', { affixes: ['featherlight'], runes: ['feather_rune'] }));
    expect(p.weight).toBe(Math.max(0, light - 4));
  });

  it('utility runes add their mods; the first element rune sets the element, a built-in element wins', () => {
    const base = weaponProfile(data, item('iron_sword'));
    const p = weaponProfile(data, item('iron_sword', { runes: ['force_rune', 'precision_rune', 'edge_rune'] }));
    expect([p.might, p.weight, p.hit, p.crit]).toEqual([base.might + 2, base.weight + 2, base.hit + 10, base.crit + 5]);
    expect(weaponProfile(data, item('iron_sword', { runes: ['water_rune_1', 'fire_rune_1'] })).element).toBe('water');
    expect(weaponProfile(data, item('ember', { runes: ['water_rune_1'] })).element).toBe('fire');
    expect(itemElement(data, item('iron_sword', { runes: ['earth_rune_1'] }))).toBe('earth');
    expect(itemElement(data, item('iron_sword'))).toBeUndefined();
  });

  it('element runes of tier 2 add their status, tier 3 a stronger chance, terrain and effectiveness', () => {
    const b = data.balance;
    expect(weaponProfile(data, item('iron_sword', { runes: ['fire_rune_1'] })).statusOnHit).toEqual([]);
    expect(weaponProfile(data, item('iron_sword', { runes: ['fire_rune_2'] })).statusOnHit).toEqual([{ status: 'burning', chance: b.status.rune2StatusChance }]);
    const t3 = weaponProfile(data, item('iron_sword', { runes: ['fire_rune_3'] }));
    expect(t3.statusOnHit).toEqual([{ status: 'burning', chance: b.status.rune3StatusChance }]);
    expect(t3.terrainOnHit).toBe('ignite');
    expect(weaponProfile(data, item('iron_sword', { runes: ['light_rune_3'] })).effectiveVs).toEqual(expect.arrayContaining(['monster', 'undead']));
  });

  it('runes do nothing while the rune mechanic is not introduced', () => {
    const locked = { locked: ['runes' as const] };
    const p = weaponProfile(data, item('iron_sword', { runes: ['fire_rune_3', 'force_rune'] }), locked);
    expect(p).toEqual(weaponProfile(data, item('iron_sword')));
    expect(itemElement(data, item('iron_sword', { runes: ['fire_rune_1'] }), locked)).toBeUndefined();
  });

  it('upgrades raise might and hit of weapons by the balance step', () => {
    const base = weaponProfile(data, item('iron_sword'));
    const up = weaponProfile(data, item('iron_sword', { upgrade: 2 }));
    const step = data.balance.economy.upgradePerLevel;
    expect([up.might, up.hit]).toEqual([base.might + 2 * step.weaponMight, base.hit + 2 * step.weaponHit]);
  });
});

describe('armor and accessories', () => {
  it('armor affixes add stats, avoid, and weight changes; upgrades raise the main defence', () => {
    const helm = item('iron_helm', { affixes: ['sturdy', 'of_the_watch', 'featherlight'], upgrade: 1 });
    const m = itemStatMods(data, helm, null);
    expect(m.def).toBe(data.items.iron_helm!.statMods!.def! + 1 + data.balance.economy.upgradePerLevel.armorDefOrRes);
    expect(m.avoid).toBe(5);
    expect(itemWeight(data, helm)).toBe(Math.max(0, data.items.iron_helm!.wt - 2));
    // the hood guards mainly against magic: its upgrade goes to RES
    const hood = itemStatMods(data, item('mage_hood', { upgrade: 2 }), null);
    expect(hood.res).toBe(data.items.mage_hood!.statMods!.res! + 2 * data.balance.economy.upgradePerLevel.armorDefOrRes);
    expect(hood.def).toBeUndefined();
  });

  it('a weapon affix with hit counts in the weapon profile, not again in the stat mods', () => {
    expect(itemStatMods(data, item('iron_sword', { affixes: ['accurate', 'of_might'] }), null)).toEqual({ str: 1 });
  });

  it('body armor with an element rune gives the wearer its affinity; rune slots by rarity or explicit', () => {
    const u = place(data, s, 'player', 'captain', [1, 1]);
    u.equip.body = item('chainmail', { runes: ['wind_rune_1'] });
    expect(itemElement(data, u.equip.body)).toBe('wind');
    expect(runeSlotCount(data, item('chainmail'))).toBe(data.items.chainmail!.runeSlots ?? 1);
    expect(runeSlotCount(data, item('iron_sword'))).toBe(data.items.iron_sword!.runeSlots ?? data.balance.economy.rarityRuneSlots.common);
    expect(runeSlotCount(data, item('iron_helm'))).toBe(data.items.iron_helm!.runeSlots ?? 0);
  });

  it('an unknown item id is a broken invariant', () => {
    expect(() => itemDef(data, 'no_such_item')).toThrow(CoreInvariantError);
  });
});

describe('canEquip', () => {
  it('names every reason to refuse', () => {
    const cap = place(data, s, 'player', 'captain', [2, 2]);
    const sk = () => activeSkillIds(data, cap, null);
    expect(canEquip(data, cap, item('iron_sword'), 'bag')).toBeNull();
    expect(canEquip(data, cap, item('iron_ore'), 'mainHand')).toBe('wrong_slot');
    expect(canEquip(data, cap, item('iron_helm'), 'body')).toBe('wrong_slot');
    expect(canEquip(data, cap, item('iron_axe'), 'mainHand')).toBe('weapon_group');
    expect(canEquip(data, cap, item('drake_breath'), 'mainHand')).toBe('monster_only');
    expect(canEquip(data, cap, item('plate_armor'), 'body', sk())).toBe('heavy_armor');
    cap.equip.accessory1 = item('lucky_charm');
    expect(canEquip(data, cap, item('lucky_charm'), 'accessory2')).toBe('duplicate_accessory');
    expect(canEquip(data, cap, item('lucky_charm'), 'accessory1')).toBeNull(); // replacing itself is fine

    const mm = place(data, s, 'player', 'marksman', [3, 3]);
    mm.equip.mainHand = item('iron_bow');
    const v = place(data, s, 'player', 'vanguard', [4, 4]);
    v.equip.mainHand = item('hammer');
    expect(canEquip(data, v, item('iron_shield'), 'offHand')).toBe('two_handed');
    v.equip = { offHand: item('iron_shield') };
    expect(canEquip(data, v, item('hammer'), 'mainHand')).toBe('two_handed');
    expect(canEquip(data, v, item('iron_axe'), 'mainHand')).toBeNull();
  });

  it('heavy armor fits an armored class or a unit with the heavy-armor skill', () => {
    const knight = place(data, s, 'player', 'knight', [5, 5]);
    expect(canEquip(data, knight, item('plate_armor'), 'body', activeSkillIds(data, knight, null))).toBeNull();
    const drake = place(data, s, 'enemy', 'drake_young', [6, 6]);
    expect(canEquip(data, drake, item('drake_breath'), 'mainHand')).toBeNull();
  });
});
