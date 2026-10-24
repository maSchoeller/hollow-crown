/** Base weapons for the dagger, light-bow and lute groups (product owner 2026-10-24, items.md §6.1). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  canEquip,
  merchantStock,
  newCampaign,
  newItem,
  triangleOf,
  usableWeapons,
  weaponProfile,
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

function unitOf(classId: string): UnitRecord {
  const u = structuredClone(base.roster.find((r) => r.id === 'brenna')!);
  u.classId = classId;
  u.equip = {};
  u.bag = [];
  return u;
}
const fits = (classId: string, item: string, slot: 'mainHand' | 'offHand' = 'mainHand') =>
  canEquip(data, unitOf(classId), newItem(base, item, data), slot);

describe('base weapons for dagger, light bow and lute', () => {
  it('the three items exist in their groups', () => {
    expect(data.items.iron_dagger).toMatchObject({ group: 'dagger', weaponType: 'dagger', slot: 'mainHand', rarity: 'common' });
    expect(data.items.hunting_bow).toMatchObject({ group: 'light_bow', weaponType: 'bow', slot: 'mainHand', twoHanded: true });
    expect(data.items.travel_lute).toMatchObject({ group: 'lute', kind: 'accessory', slot: 'offHand' });
  });

  it('the scout can equip the dagger and the hunting bow, not the lute', () => {
    expect(fits('scout', 'iron_dagger')).toBeNull();
    expect(fits('scout', 'hunting_bow')).toBeNull();
    expect(fits('scout', 'iron_bow')).toBe('weapon_group');
    expect(fits('scout', 'travel_lute', 'offHand')).toBe('weapon_group');
  });

  it('the minstrel can equip the dagger and the lute, not the hunting bow', () => {
    expect(fits('minstrel', 'iron_dagger')).toBeNull();
    expect(fits('minstrel', 'travel_lute', 'offHand')).toBeNull();
    expect(fits('minstrel', 'hunting_bow')).toBe('weapon_group');
  });

  it('other roles follow their groups', () => {
    expect(fits('skirmisher', 'iron_dagger')).toBeNull();
    expect(fits('marksman', 'hunting_bow')).toBe('weapon_group');
    expect(fits('vanguard', 'iron_dagger')).toBe('weapon_group');
    expect(fits('vanguard', 'travel_lute', 'offHand')).toBe('weapon_group');
  });

  it('scout and minstrel now have a usable weapon', () => {
    const scout = unitOf('scout');
    scout.bag = [newItem(base, 'iron_dagger', data), newItem(base, 'hunting_bow', data), newItem(base, 'iron_sword', data)];
    expect(usableWeapons(data, scout).map((i) => i.def)).toEqual(['iron_dagger', 'hunting_bow']);
    const minstrel = unitOf('minstrel');
    minstrel.bag = [newItem(base, 'iron_dagger', data), newItem(base, 'travel_lute', data)];
    expect(usableWeapons(data, minstrel).map((i) => i.def)).toEqual(['iron_dagger']);
  });

  it('the dagger stands outside the weapon triangle', () => {
    const dagger = weaponProfile(data, newItem(base, 'iron_dagger', data));
    for (const other of ['iron_sword', 'iron_lance', 'iron_axe']) {
      const p = weaponProfile(data, newItem(base, other, data));
      expect(triangleOf(data, dagger, p)).toBe(0);
      expect(triangleOf(data, p, dagger)).toBe(0);
    }
  });

  it('the first merchant tier sells all three next to the iron weapons', () => {
    const stock = merchantStock(data, 0);
    for (const id of ['iron_sword', 'iron_dagger', 'hunting_bow', 'travel_lute']) expect(stock).toContain(id);
  });
});
