import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  armyCount,
  canPromote,
  clone,
  equipCandidates,
  equipPreview,
  expProgress,
  hireCost,
  homeRooms,
  isMercenary,
  normalizeCampaign,
  refreshTavern,
  upgradeLimit,
  upgradePreview,
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

describe('the camp rooms (story 6.3)', () => {
  const ids = (c: CampaignState) => homeRooms(data, c).map((r) => r.room.id);

  it('c.home starts as the camp of the act with no room levels', () => {
    expect(base.home).toEqual({ kind: 'camp', rooms: {} });
    expect(normalizeCampaign({ ...clone(base), home: undefined } as unknown as CampaignState).home).toEqual({ kind: 'camp', rooms: {} });
  });

  it('shows the six stations of act 1, in order, without the enchanter', () => {
    expect(ids(base)).toEqual(['convoy', 'merchant', 'smith', 'healer', 'tavern', 'campfire']);
  });

  it('requires per station replaces the U20 unlock list: locked ones name the first open condition', () => {
    const open = (c: CampaignState) => Object.fromEntries(homeRooms(data, c).map((r) => [r.room.id, r.open]));
    expect(open(base)).toEqual({ convoy: true, merchant: true, smith: false, healer: false, tavern: false, campfire: false });
    expect(homeRooms(data, base).find((r) => r.room.id === 'smith')!.unmet).toEqual({ completed: 'ch01' });
    const c = clone(base);
    c.completed = ['prologue', 'ch01'];
    expect(open(c)).toMatchObject({ smith: true, healer: true, tavern: true, campfire: false });
    c.completed.push('ch02');
    expect(open(c).campfire).toBe(true);
  });

  it('the castle shows its own rooms (the enchanter from act 2 on)', () => {
    const c = clone(base);
    c.home.kind = 'castle';
    expect(ids(c)).not.toContain('enchanter');
    data.campaign.act = 2;
    expect(ids(c)).toContain('enchanter');
    data.campaign.act = 1;
  });
});

describe('smith, tavern and army limits (story 6.4)', () => {
  const fresh = () => {
    const c = clone(base);
    c.completed = ['prologue', 'ch01'];
    c.available = ['ch02'];
    c.gold = 10000;
    return c;
  };

  it('the camp smith upgrades up to +3; a higher smith level raises the limit', () => {
    const c = fresh();
    c.materials = { iron_ore: 9, moonsteel: 9 };
    const sword = newItem(c, 'iron_sword', data);
    c.convoy.push(sword);
    expect(upgradeLimit(data, c)).toBe(3);
    sword.upgrade = 3;
    expect(validateCampaign(data, c, { type: 'upgrade', uid: sword.uid })).toBe('max_level');
    c.home.rooms.smith = 2;
    expect(upgradeLimit(data, c)).toBe(4);
    expect(validateCampaign(data, c, { type: 'upgrade', uid: sword.uid })).toBeNull();
  });

  it('the smith list previews the same gain the battle gets', () => {
    const c = fresh();
    const sword = newItem(c, 'iron_sword', data);
    const keys = upgradePreview(data, sword);
    expect(keys).toEqual([{ key: 'mt', delta: data.balance.economy.upgradePerLevel.weaponMight }, { key: 'hit', delta: data.balance.economy.upgradePerLevel.weaponHit }]);
    expect(upgradePreview(data, newItem(c, 'leather_vest', data))).toEqual([{ key: 'def', delta: data.balance.economy.upgradePerLevel.armorDefOrRes }]);
  });

  it('refreshTavern: offers per chapter, deterministic, levels near the next mission, magic only after chapter 1', () => {
    const a = fresh();
    const b = fresh();
    refreshTavern(data, a);
    refreshTavern(data, b);
    expect(a.tavern).toEqual(b.tavern);
    expect(a.tavern).toHaveLength(data.balance.economy.tavernOffersPerChapter);
    const expected = data.campaign.nodes.find((n) => n.id === 'ch02')!.expectedLevel;
    for (const u of a.tavern) {
      expect(u.level).toBeGreaterThanOrEqual(expected - data.balance.economy.tavern.levelSpread);
      expect(u.level).toBeLessThanOrEqual(expected);
      expect(isMercenary(u)).toBe(true);
      expect(Object.keys(u.equip).length).toBeGreaterThan(0);
    }
    const early = clone(base);
    early.available = ['ch01'];
    for (let i = 0; i < 20; i++) {
      refreshTavern(data, early);
      expect(early.tavern.every((u) => u.classId !== 'mage' && u.classId !== 'cleric')).toBe(true);
    }
  });

  it('hire: pays 600 + 150 × level, joins the company, errors and determinism', () => {
    const c = fresh();
    refreshTavern(data, c);
    const offer = c.tavern[0]!;
    const cmd = { type: 'hire', offer: offer.id } as const;
    expect(validateCampaign(data, c, cmd)).toBeNull();
    const r = applyCampaign(data, c, cmd);
    expect(applyCampaign(data, clone(c), cmd)).toEqual(r);
    expect(r.campaign.gold).toBe(10000 - (data.balance.economy.recruitCost.base + data.balance.economy.recruitCost.perLevel * offer.level));
    expect(hireCost(data, offer.level)).toBe(10000 - r.campaign.gold);
    expect(r.campaign.roster.some((u) => u.id === offer.id)).toBe(true);
    expect(r.campaign.tavern.some((u) => u.id === offer.id)).toBe(false);
    expect(r.events).toContainEqual({ t: 'unitJoined', unit: offer.id });
    expect(validateCampaign(data, c, { type: 'hire', offer: 'nope' })).toBe('not_available');
    expect(validateCampaign(data, { ...c, gold: 0 }, cmd)).toBe('not_enough_gold');
  });

  it('hire refuses at the mercenary limit, companions do not count against it', () => {
    const c = fresh();
    refreshTavern(data, c);
    expect(armyCount(c)).toEqual({ companions: c.roster.length, mercenaries: 0 });
    for (let i = 0; i < data.balance.economy.mercenaryLimit; i++) {
      const copy = clone(c.tavern[0]!);
      copy.id = `merc_full${i}`;
      c.roster.push(copy);
    }
    expect(armyCount(c).mercenaries).toBe(data.balance.economy.mercenaryLimit);
    expect(validateCampaign(data, c, { type: 'hire', offer: c.tavern[0]!.id })).toBe('army_full');
  });
});
