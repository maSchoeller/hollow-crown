/** Key ring (decision 2026-10-27): keys (`use.open`) take no bag place and stack as one bag entry whose charges count them. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCommand, newCampaign, newItem, normalizeCampaign, type BattleState, type CampaignState, type GameData } from '../../src/core';
import { addToBag, bagIsFull, bagUsed, stackKeys } from '../../src/core/rules/items';
import { arena, place } from '../fixtures/arena';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

const fillBag = (s: BattleState, u: { bag: ReturnType<typeof newItem>[] }) => {
  for (let i = 0; i < data.balance.bag.size; i++) u.bag.push(newItem(s, 'vulnerary', data));
};

const keyCharges = (u: { bag: Array<{ def: string; charges?: number }> }) => u.bag.filter((i) => i.def === 'door_key').reduce((n, i) => n + (i.charges ?? 1), 0);

describe('key ring helpers', () => {
  it('counts keys out of the bag places and always has room for a key', () => {
    const s = arena(data);
    const u = place(data, s, 'player', 'vanguard', [2, 2], 'iron_lance');
    fillBag(s, u);
    const key = newItem(s, 'door_key', data);
    expect(bagIsFull(data, u.bag)).toBe(true);
    expect(bagIsFull(data, u.bag, key)).toBe(false);
    addToBag(data, u.bag, key);
    expect(bagUsed(data, u.bag)).toBe(data.balance.bag.size);
    expect(bagIsFull(data, u.bag, newItem(s, 'vulnerary', data))).toBe(true);
  });

  it('stacks keys of one kind into one entry whose charges add up', () => {
    const s = arena(data);
    const u = place(data, s, 'player', 'vanguard', [2, 2], 'iron_lance');
    for (let i = 0; i < 4; i++) addToBag(data, u.bag, newItem(s, 'door_key', data));
    expect(u.bag).toHaveLength(1);
    expect(u.bag[0]!.charges).toBe(4);
  });

  it('merges the loose keys of an old bag and leaves other items alone', () => {
    const s = arena(data);
    const old = [newItem(s, 'door_key', data), newItem(s, 'vulnerary', data), newItem(s, 'door_key', data), newItem(s, 'door_key', data)];
    const bag = stackKeys(data, old);
    expect(bag.map((i) => i.def)).toEqual(['door_key', 'vulnerary']);
    expect(bag[0]!.charges).toBe(3);
    expect(stackKeys(data, bag)).toBe(bag);
  });
});

describe('keys in battle', () => {
  it('picks up a key from the ground into a full bag, not into the convoy', () => {
    const s = arena(data);
    const u = place(data, s, 'player', 'vanguard', [2, 2], 'iron_lance');
    fillBag(s, u);
    s.loot.push({ at: [3, 2], item: newItem(s, 'door_key', data) }, { at: [2, 3], item: newItem(s, 'door_key', data) });
    const convoy = s.convoy.length;
    const a = applyCommand(data, s, { type: 'act', unit: u.uid, to: [3, 2], action: { kind: 'wait' } }).state;
    const got = a.units.find((x) => x.uid === u.uid)!;
    expect(keyCharges(got)).toBe(1);
    expect(a.convoy).toHaveLength(convoy);
    expect(got.bag).toHaveLength(data.balance.bag.size + 1);
  });

  it('adds picked-up keys to the stack and uses one charge per opening', () => {
    const s = arena(data);
    const u = place(data, s, 'player', 'vanguard', [2, 2], 'iron_lance');
    addToBag(data, u.bag, newItem(s, 'door_key', data));
    s.loot.push({ at: [3, 2], item: newItem(s, 'door_key', data) });
    s.objects.push({ id: 'gate', type: 'door', at: [3, 3], state: 'closed' });
    const a = applyCommand(data, s, { type: 'act', unit: u.uid, to: [3, 2], action: { kind: 'wait' } }).state;
    expect(a.units.find((x) => x.uid === u.uid)!.bag).toHaveLength(1);
    expect(keyCharges(a.units.find((x) => x.uid === u.uid)!)).toBe(2);
    a.units.find((x) => x.uid === u.uid)!.acted = false;
    const b = applyCommand(data, a, { type: 'act', unit: u.uid, to: [3, 2], action: { kind: 'door', object: 'gate' } }).state;
    expect(b.objects.find((o) => o.id === 'gate')!.state).toBe('open');
    expect(keyCharges(b.units.find((x) => x.uid === u.uid)!)).toBe(1);
  });

  it('trades a key stack into a full bag and merges it with the keys there', () => {
    const s = arena(data);
    const a = place(data, s, 'player', 'vanguard', [2, 2], 'iron_lance');
    const b = place(data, s, 'player', 'vanguard', [3, 2], 'iron_lance');
    fillBag(s, b);
    addToBag(data, b.bag, newItem(s, 'door_key', data));
    const key = newItem(s, 'door_key', data);
    key.charges = 2;
    addToBag(data, a.bag, key);
    const r = applyCommand(data, s, { type: 'trade', unit: a.uid, with: b.uid, ops: [{ item: key.uid, to: b.uid, slot: 'bag' }] }).state;
    const ra = r.units.find((x) => x.uid === a.uid)!;
    const rb = r.units.find((x) => x.uid === b.uid)!;
    expect(ra.bag).toHaveLength(0);
    expect(keyCharges(rb)).toBe(3);
    expect(rb.bag.filter((i) => i.def === 'door_key')).toHaveLength(1);
    expect(bagUsed(data, rb.bag)).toBe(data.balance.bag.size);
  });

  it('takes a key from the convoy into a full bag', () => {
    const s = arena(data);
    const u = place(data, s, 'player', 'vanguard', [2, 2], 'iron_lance');
    u.flags.push('convoyAccess');
    fillBag(s, u);
    const key = newItem(s, 'door_key', data);
    s.convoy.push(key);
    const r = applyCommand(data, s, { type: 'convoy', unit: u.uid, take: key.uid }).state;
    expect(keyCharges(r.units.find((x) => x.uid === u.uid)!)).toBe(1);
    expect(r.convoy.some((i) => i.uid === key.uid)).toBe(false);
  });
});

describe('old saves', () => {
  it('stacks the single keys of a roster bag when the campaign loads', () => {
    const c = newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' }) as CampaignState;
    const bag = c.roster[0]!.bag;
    const mk = (n: number) => ({ uid: `k${n}`, def: 'door_key', upgrade: 0, affixes: [], runes: [], charges: 1 });
    bag.push(mk(1), mk(2), mk(3));
    const loaded = normalizeCampaign(data, JSON.parse(JSON.stringify(c)) as CampaignState);
    const keys = loaded.roster[0]!.bag.filter((i) => i.def === 'door_key');
    expect(keys).toHaveLength(1);
    expect(keys[0]!.charges).toBe(3);
    expect(normalizeCampaign(data, loaded).roster[0]!.bag).toEqual(loaded.roster[0]!.bag);
  });
});
