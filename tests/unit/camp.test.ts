import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  canPromote,
  clone,
  equipCandidates,
  equipPreview,
  expProgress,
  isMercenary,
  newCampaign,
  newItem,
  supportTalksOf,
  usableBy,
  validateCampaign,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

const unit = (c: CampaignState, id: string) => c.roster.find((u) => u.id === id)!;

describe('troop helpers (story 6.1)', () => {
  it('story characters are not mercenaries; every class has a role group', () => {
    expect(base.roster.every((u) => !isMercenary(u))).toBe(true);
    expect(Object.values(data.classes).every((c) => ['melee', 'ranged', 'support'].includes(c.roleGroup))).toBe(true);
  });

  it('promotion needs the level and a promotion of the class', () => {
    const c = clone(base);
    const brenna = unit(c, 'brenna');
    expect(canPromote(data, brenna)).toBe(false);
    brenna.level = data.balance.levels.promoteFrom;
    expect(canPromote(data, brenna)).toBe(true);
    expect(expProgress(data, brenna).need).toBe(data.balance.experience.levelUpAt);
  });

  it('counts the conversations of a unit', () => {
    expect(supportTalksOf(data, base, 'kael')).toBe(0);
  });
});

describe('equip list and comparison (story 6.2)', () => {
  it('offers items of the place from bag and convoy; what the role may not hold carries the reason', () => {
    const c = clone(base);
    c.convoy.push(newItem(c, 'iron_sword', data), newItem(c, 'hand_axe', data), newItem(c, 'leather_cap', data));
    const list = equipCandidates(data, c, unit(c, 'brenna'), 'mainHand');
    const sword = list.find((x) => x.inst.def === 'iron_sword')!;
    expect(sword.error).toBe('weapon_type');
    expect(list.find((x) => x.inst.def === 'hand_axe')!.error).toBeNull();
    expect(list.some((x) => x.inst.def === 'leather_cap')).toBe(false);
    // her own spare axe sits in the bag and is offered too
    expect(list.some((x) => x.where === 'bag')).toBe(true);
  });

  it('the bag place lists convoy items and blocks when the bag is full', () => {
    const c = clone(base);
    c.convoy.push(newItem(c, 'vulnerary', data));
    const u = unit(c, 'kael');
    expect(equipCandidates(data, c, u, 'bag').find((x) => x.inst.def === 'vulnerary')!.error).toBeNull();
    while (u.bag.length < data.balance.bag.size) u.bag.push(newItem(c, 'torch', data));
    expect(equipCandidates(data, c, u, 'bag').find((x) => x.inst.def === 'vulnerary')!.error).toBe('bag_full');
  });

  it('the preview uses the battle formulas: lighter weapon, shorter damage, longer reach', () => {
    const c = clone(base);
    const brenna = unit(c, 'brenna');
    const javelin = newItem(c, 'hand_axe', data);
    const d = equipPreview(data, brenna, javelin, 'mainHand');
    const by = Object.fromEntries(d.map((x) => [x.key, x]));
    expect(by.mt!.delta).toBeLessThan(0);
    expect(by.mt!.better).toBe(false);
    expect(by.rng!.delta).toBeGreaterThan(0);
    expect(by.rng!.better).toBe(true);
    if (by.wt) expect(by.wt.better).toBe(by.wt.delta < 0);
    // a preview never changes the unit
    expect(brenna.equip.mainHand!.def).toBe('iron_axe');
  });

  it('armor previews show the defence gain and the load', () => {
    const c = clone(base);
    const tobin = unit(c, 'tobin');
    const mail = newItem(c, 'chainmail', data);
    const keys = equipPreview(data, tobin, mail, 'body').map((x) => x.key);
    expect(keys).toContain('def');
    expect(equipPreview(data, tobin, mail, 'bag')).toEqual([]);
  });

  it('equipping from the list runs the equip command and the displaced item returns to the convoy', () => {
    const c = clone(base);
    const javelin = newItem(c, 'hand_axe', data);
    c.convoy.push(javelin);
    const cmd = { type: 'equip', unit: 'brenna', uid: javelin.uid, slot: 'mainHand' } as const;
    expect(validateCampaign(data, c, cmd)).toBeNull();
    const r = applyCampaign(data, c, cmd).campaign;
    expect(unit(r, 'brenna').equip.mainHand!.def).toBe('hand_axe');
    expect(r.convoy.some((i) => i.def === 'iron_axe')).toBe(true);
  });

  it('"For whom?": only roles that can wield the weapon', () => {
    const who = usableBy(data, base, 'iron_axe').map((u) => u.id);
    expect(who).toContain('brenna');
    expect(who).not.toContain('kael');
  });
});
