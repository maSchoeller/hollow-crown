/**
 * Story 16.17: buy and equip in one campaign command (`buy` / `buyOffer` with `for`): plan, validation order, convoy for what
 * leaves, events, determinism, replay and old journals without the field.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  buyPlan,
  clone,
  newCampaign,
  newItem,
  replayCampaign,
  shopStock,
  validateCampaign,
  type CampaignCommand,
  type CampaignState,
  type GameData,
  type ItemInstance,
  type UnitRecord,
} from '../../src/core';

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
  c.convoy = [];
  c.gold = 5000;
  return { c, u };
}

const inst = (c: CampaignState, id: string): ItemInstance => newItem(clone(c), id, data);
const stockOf = (c: CampaignState, pred: (id: string) => boolean) => shopStock(data, c).find(pred);
const slotOf = (id: string) => data.items[id]!.slot;
const wear = (c: CampaignState, u: UnitRecord, slot: 'mainHand' | 'offHand' | 'accessory1' | 'accessory2', id: string) => {
  u.equip[slot] = newItem(c, id, data);
  return u.equip[slot]!;
};

describe('buyPlan', () => {
  it('weapons go to the main hand, shields to the off hand, the worn item is displaced', () => {
    const { c, u } = camp();
    const axe = wear(c, u, 'mainHand', 'iron_axe');
    const plan = buyPlan(data, c, u.id, inst(c, 'iron_lance'));
    expect(plan).toMatchObject({ slot: 'mainHand', error: null });
    expect(plan.base?.uid).toBe(axe.uid);
    expect(plan.displaced.map((i) => i.uid)).toEqual([axe.uid]);
    expect(buyPlan(data, c, u.id, inst(c, 'iron_shield')).slot).toBe('offHand');
  });

  it('a two-hander also displaces the off hand', () => {
    const { c, u } = camp();
    const axe = wear(c, u, 'mainHand', 'iron_axe');
    const shield = wear(c, u, 'offHand', 'iron_shield');
    const plan = buyPlan(data, c, u.id, inst(c, 'hammer'));
    expect(plan.error).toBeNull();
    expect(plan.displaced.map((i) => i.uid).sort()).toEqual([axe.uid, shield.uid].sort());
  });

  it('accessories take a free place first, else the one without the same item', () => {
    const { c, u } = camp();
    const [ring, other] = Object.entries(data.items).filter(([, d]) => d.slot === 'accessory').map(([id]) => id);
    expect(buyPlan(data, c, u.id, inst(c, ring!)).slot).toBe('accessory1');
    wear(c, u, 'accessory1', ring!);
    expect(buyPlan(data, c, u.id, inst(c, other!)).slot).toBe('accessory2');
    // the same item twice is not allowed: an explicit second place is refused
    expect(buyPlan(data, c, u.id, inst(c, ring!), 'accessory2').error).toBe('duplicate_accessory');
    wear(c, u, 'accessory2', other!);
    // both places taken: the place without the same item as its neighbour
    expect(buyPlan(data, c, u.id, inst(c, ring!)).slot).toBe('accessory1');
    expect(buyPlan(data, c, u.id, inst(c, other!)).slot).toBe('accessory2');
  });

  it('gives the equip codes and a bag place for supplies', () => {
    const { c, u } = camp();
    expect(buyPlan(data, c, u.id, inst(c, 'iron_sword')).error).toBe('weapon_group');
    expect(buyPlan(data, c, 'nobody', inst(c, 'iron_axe')).error).toBe('unknown_unit');
    expect(buyPlan(data, c, u.id, inst(c, 'vulnerary'))).toMatchObject({ slot: 'bag', error: null });
    for (let i = 0; i < data.balance.bag.size; i++) u.bag.push(newItem(c, 'vulnerary', data));
    expect(buyPlan(data, c, u.id, inst(c, 'vulnerary')).error).toBe('bag_full');
  });

  it('counts only what leaves against the convoy', () => {
    const { c, u } = camp();
    wear(c, u, 'mainHand', 'iron_axe');
    for (let i = 0; i < data.balance.economy.convoySize; i++) c.convoy.push(newItem(c, 'vulnerary', data));
    expect(buyPlan(data, c, u.id, inst(c, 'iron_lance')).error).toBe('convoy_full');
    delete u.equip.mainHand;
    expect(buyPlan(data, c, u.id, inst(c, 'iron_lance')).error).toBeNull();
  });
});

describe('buy with `for`', () => {
  const weapon = (c: CampaignState) => stockOf(c, (id) => slotOf(id) === 'mainHand' && !buyPlan(data, c, c.roster[0]!.id, inst(c, id)).error)!;

  it('is valid, charges once, puts the item on the figure and the worn one into the convoy', () => {
    const { c, u } = camp();
    const old = wear(c, u, 'mainHand', 'iron_axe');
    const id = weapon(c);
    expect(id).toBeTruthy();
    const cmd: CampaignCommand = { type: 'buy', item: id, for: { unit: u.id, slot: 'mainHand' } };
    expect(validateCampaign(data, c, cmd)).toBeNull();
    const r = applyCampaign(data, c, cmd);
    expect(r.campaign.roster[0]!.equip.mainHand?.def).toBe(id);
    expect(r.campaign.convoy.map((i) => i.uid)).toEqual([old.uid]);
    expect(r.campaign.gold).toBeLessThan(c.gold);
    expect(r.events.map((e) => e.t)).toEqual(expect.arrayContaining(['itemGained', 'equipped']));
  });

  it('is deterministic and replays through the journal (one command)', () => {
    const { c, u } = camp();
    wear(c, u, 'mainHand', 'iron_axe');
    const cmd: CampaignCommand = { type: 'buy', item: weapon(c), for: { unit: u.id, slot: 'mainHand' } };
    const a = applyCampaign(data, c, cmd).campaign;
    const b = applyCampaign(data, c, cmd).campaign;
    expect(a).toEqual(b);
    expect(replayCampaign(data, c, [cmd])).toEqual(a);
  });

  it('checks unit, availability, place, gold and convoy', () => {
    const { c, u } = camp();
    const id = weapon(c);
    expect(validateCampaign(data, c, { type: 'buy', item: id, for: { unit: 'nobody', slot: 'mainHand' } })).toBe('unknown_unit');
    expect(validateCampaign(data, c, { type: 'buy', item: 'no_such_item', for: { unit: u.id, slot: 'mainHand' } })).toBe('not_for_sale');
    expect(validateCampaign(data, c, { type: 'buy', item: id, for: { unit: u.id, slot: 'offHand' } })).toBe('cannot_equip');
    const poor = clone(c);
    poor.gold = 0;
    expect(validateCampaign(data, poor, { type: 'buy', item: id, for: { unit: u.id, slot: 'mainHand' } })).toBe('not_enough_gold');
    const full = clone(c);
    full.roster[0]!.equip.mainHand = newItem(full, 'iron_axe', data);
    for (let i = 0; i < data.balance.economy.convoySize; i++) full.convoy.push(newItem(full, 'vulnerary', data));
    expect(validateCampaign(data, full, { type: 'buy', item: id, for: { unit: u.id, slot: 'mainHand' } })).toBe('convoy_full');
    // an empty place needs no convoy place at all
    delete full.roster[0]!.equip.mainHand;
    expect(validateCampaign(data, full, { type: 'buy', item: id, for: { unit: u.id, slot: 'mainHand' } })).toBeNull();
  });

  it('supplies go into the bag; a full bag refuses, a swap keeps the place and sends the old one to the convoy', () => {
    const { c, u } = camp();
    const potion = stockOf(c, (id) => slotOf(id) === 'bag' && !data.items[id]!.tags?.includes('convoyOnly'));
    expect(potion).toBeTruthy();
    const cmd: CampaignCommand = { type: 'buy', item: potion!, for: { unit: u.id, slot: 'bag' } };
    expect(applyCampaign(data, c, cmd).campaign.roster[0]!.bag.map((i) => i.def)).toEqual([potion]);
    const full = clone(c);
    const first = newItem(full, 'iron_lance', data);
    full.roster[0]!.bag = [first];
    for (let i = 1; i < data.balance.bag.size; i++) full.roster[0]!.bag.push(newItem(full, 'iron_lance', data));
    expect(validateCampaign(data, full, cmd)).toBe('bag_full');
    const swap: CampaignCommand = { type: 'buy', item: potion!, for: { unit: u.id, slot: 'bag', replace: first.uid } };
    expect(validateCampaign(data, full, swap)).toBeNull();
    const r = applyCampaign(data, full, swap).campaign;
    expect(r.roster[0]!.bag[0]!.def).toBe(potion);
    expect(r.convoy.map((i) => i.uid)).toContain(first.uid);
  });

  it('buyOffer with `for` takes the offer out of the list and onto the figure', () => {
    const { c, u } = camp();
    c.home = { kind: 'castle', rooms: { merchant: 3 } };
    c.act = 2;
    const offer = newItem(c, 'iron_axe', data);
    c.offers = [offer];
    const cmd: CampaignCommand = { type: 'buyOffer', uid: offer.uid, for: { unit: u.id, slot: 'mainHand' } };
    expect(validateCampaign(data, c, cmd)).toBeNull();
    const r = applyCampaign(data, c, cmd).campaign;
    expect(r.offers).toHaveLength(0);
    expect(r.roster[0]!.equip.mainHand?.uid).toBe(offer.uid);
  });

  it('old commands and journals without `for` still put the item into the convoy', () => {
    const { c } = camp();
    const id = weapon(c);
    const r = applyCampaign(data, c, { type: 'buy', item: id }).campaign;
    expect(r.convoy.map((i) => i.def)).toEqual([id]);
    expect(replayCampaign(data, c, [{ type: 'buy', item: id }])).toEqual(r);
  });
});
