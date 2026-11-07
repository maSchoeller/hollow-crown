/**
 * Equipping in camp (campaign commands): two-handed weapons and shields push each other into the convoy, a bag swap keeps
 * the bag place, and runes only go where a slot is free and the item takes them.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCampaign, newCampaign, newItem, validateCampaign, type CampaignState, type GameData, type UnitRecord } from '../../src/core';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

function camp(): { c: CampaignState; u: UnitRecord } {
  const c = newCampaign(data, 5, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const u = c.roster[0]!;
  u.classId = 'vanguard'; // lance, axe, shield
  u.equip = {};
  u.bag = [];
  return { c, u };
}

const add = (c: CampaignState, id: string) => {
  const i = newItem(c, id, data);
  c.convoy.push(i);
  return i;
};
const roster = (c: CampaignState, id: string) => c.roster.find((r) => r.id === id)!;

describe('two-handed weapons and shields', () => {
  it('a two-handed weapon sends the shield to the convoy, a shield sends the two-handed weapon', () => {
    const { c, u } = camp();
    const shield = add(c, 'iron_shield');
    const hammer = add(c, 'hammer');
    const axe = add(c, 'iron_axe');
    u.equip = { mainHand: c.convoy.splice(c.convoy.indexOf(axe), 1)[0]!, offHand: c.convoy.splice(c.convoy.indexOf(shield), 1)[0]! };
    expect(validateCampaign(data, c, { type: 'equip', unit: u.id, uid: hammer.uid, slot: 'mainHand' })).toBeNull();
    const r = applyCampaign(data, c, { type: 'equip', unit: u.id, uid: hammer.uid, slot: 'mainHand' }).campaign;
    expect(roster(r, u.id).equip).toEqual({ mainHand: hammer });
    expect(r.convoy.map((i) => i.uid)).toEqual(expect.arrayContaining([axe.uid, shield.uid]));

    const back = applyCampaign(data, r, { type: 'equip', unit: u.id, uid: shield.uid, slot: 'offHand' }).campaign;
    expect(roster(back, u.id).equip).toEqual({ offHand: shield });
    expect(back.convoy.map((i) => i.uid)).toContain(hammer.uid);
  });

  it('a slot equip cannot replace a bag item and refuses items the class cannot use', () => {
    const { c, u } = camp();
    const sword = add(c, 'iron_sword');
    const lance = add(c, 'iron_lance');
    expect(validateCampaign(data, c, { type: 'equip', unit: u.id, uid: sword.uid, slot: 'mainHand' })).toBe('cannot_equip');
    expect(validateCampaign(data, c, { type: 'equip', unit: u.id, uid: lance.uid, slot: 'mainHand', replace: sword.uid })).toBe('unknown_item');
  });
});

describe('bag swaps', () => {
  it('a swap puts the new item where the old one was and sends the old one to the convoy', () => {
    const { c, u } = camp();
    const a = newItem(c, 'vulnerary', data);
    const b = newItem(c, 'iron_lance', data);
    const d = newItem(c, 'iron_axe', data);
    u.bag = [a, b, d];
    const salve = add(c, 'remedy_salve');
    const cmd = { type: 'equip' as const, unit: u.id, uid: salve.uid, slot: 'bag' as const, replace: b.uid };
    expect(validateCampaign(data, c, cmd)).toBeNull(); // the bag is full, but the swap frees a place
    const r = applyCampaign(data, c, cmd).campaign;
    expect(roster(r, u.id).bag.map((i) => i.uid)).toEqual([a.uid, salve.uid, d.uid]);
    expect(r.convoy.map((i) => i.uid)).toContain(b.uid);
  });

  it('refuses to replace an item that is not in the bag, the item itself, or a key; a full bag without a swap is full', () => {
    const { c, u } = camp();
    const key = newItem(c, 'door_key', data);
    const lance = newItem(c, 'iron_lance', data);
    u.bag = [key, lance, newItem(c, 'iron_axe', data), newItem(c, 'vulnerary', data)];
    const salve = add(c, 'remedy_salve');
    const eq = (replace?: string) => validateCampaign(data, c, { type: 'equip', unit: u.id, uid: salve.uid, slot: 'bag', replace });
    expect(eq('nope')).toBe('unknown_item');
    expect(eq(salve.uid)).toBe('unknown_item');
    expect(eq(key.uid)).toBe('unknown_item'); // keys take no place: swapping one frees nothing
    expect(eq()).toBe('bag_full');
    expect(eq(lance.uid)).toBeNull();
  });

  it('a key swapped into the bag joins the key stack and the replaced item still leaves', () => {
    const { c, u } = camp();
    const keyA = newItem(c, 'door_key', data);
    const lance = newItem(c, 'iron_lance', data);
    u.bag = [keyA, lance];
    const keyB = add(c, 'door_key');
    const r = applyCampaign(data, c, { type: 'equip', unit: u.id, uid: keyB.uid, slot: 'bag', replace: lance.uid }).campaign;
    const bag = roster(r, u.id).bag;
    expect(bag.map((i) => i.def)).toEqual(['door_key']);
    expect(bag[0]!.charges).toBe((keyA.charges ?? 1) + (keyB.charges ?? 1));
    expect(r.convoy.map((i) => i.uid)).toContain(lance.uid);
  });
});

describe('runes', () => {
  it('body armor takes only an element rune, a weapon only one element rune', () => {
    const { c } = camp();
    const mail = add(c, 'chainmail');
    const util = add(c, 'precision_rune');
    expect(validateCampaign(data, c, { type: 'insertRune', item: mail.uid, rune: util.uid })).toBe('no_slot');
    const wind = add(c, 'wind_rune_1');
    expect(validateCampaign(data, c, { type: 'insertRune', item: mail.uid, rune: wind.uid })).toBeNull();
    expect(validateCampaign(data, c, { type: 'insertRune', item: mail.uid, rune: mail.uid })).toBe('unknown_item'); // not a rune
  });

  it('an item without rune slots takes none', () => {
    const { c } = camp();
    const helm = add(c, 'iron_helm');
    const rune = add(c, 'fire_rune_1');
    expect(validateCampaign(data, c, { type: 'insertRune', item: helm.uid, rune: rune.uid })).toBe('no_slot');
  });
});
