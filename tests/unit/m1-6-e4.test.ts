/** Story 9.7: effects priceMod and villageAid (rules, state), node m1_6 (setHome, reachability) and decision E4. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  availableNodes,
  chargeCap,
  consequenceLines,
  newCampaign,
  normalizeCampaign,
  shopPrice,
  validateCampaign,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
let data2: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  // the same content, but the running act is 2 (there is no act 2 package yet)
  data2 = { ...data, campaign: { ...data.campaign, act: 2 } };
  base = newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

const choose = (c: CampaignState, option: string) => applyCampaign(data, c, { type: 'choose', scene: 'scn.m1_6.outro', line: 'l19', option }).campaign;

describe('priceMod', () => {
  it('lowers merchant prices by pct in its act only, rounded down; selling is untouched', () => {
    const c = applyCampaign(data, base, { type: 'effects', effects: [{ priceMod: { pct: -10, act: 2 } }] }).campaign;
    expect(shopPrice(data2, c, 300)).toBe(270);
    expect(shopPrice(data2, c, 255)).toBe(229);
    expect(shopPrice(data, c, 300)).toBe(300);
    expect(shopPrice(data2, base, 300)).toBe(300);
  });

  it('the purchase charges the discounted price in act 2 and the full price in act 1', () => {
    const c = applyCampaign(data, base, { type: 'effects', effects: [{ priceMod: { pct: -10, act: 2 } }] }).campaign;
    const rich = { ...c, gold: 1000 };
    expect(applyCampaign(data2, rich, { type: 'buy', item: 'vulnerary' }).campaign.gold).toBe(1000 - 270);
    expect(applyCampaign(data, rich, { type: 'buy', item: 'vulnerary' }).campaign.gold).toBe(1000 - 300);
    // not enough for the full price but enough for the reduced one
    const poor = { ...c, gold: 280 };
    expect(validateCampaign(data2, poor, { type: 'buy', item: 'vulnerary' })).toBeNull();
    expect(validateCampaign(data, poor, { type: 'buy', item: 'vulnerary' })).toBe('not_enough_gold');
  });
});

describe('villageAid', () => {
  it('raises the potion to the cap of balance.yaml in its act only', () => {
    const c = applyCampaign(data, base, { type: 'effects', effects: [{ villageAid: { act: 2 } }] }).campaign;
    expect(data.balance.villageAid).toEqual({ item: 'vulnerary', charges: 4 });
    expect(chargeCap(data2, c, 'vulnerary')).toBe(4);
    expect(chargeCap(data, c, 'vulnerary')).toBe(3);
    expect(chargeCap(data2, base, 'vulnerary')).toBe(3);
    expect(chargeCap(data2, c, 'remedy_salve')).toBe(2);
  });

  it('a purchase in the aid act holds the raised charges', () => {
    const c = { ...applyCampaign(data, base, { type: 'effects', effects: [{ villageAid: { act: 2 } }] }).campaign, gold: 1000 };
    const bought = applyCampaign(data2, c, { type: 'buy', item: 'vulnerary' }).campaign;
    expect(bought.convoy.at(-1)!.charges).toBe(4);
    expect(applyCampaign(data, c, { type: 'buy', item: 'vulnerary' }).campaign.convoy.at(-1)!.charges).toBe(3);
  });

  it('is saved and loaded with the campaign; older saves get the defaults', () => {
    const c = applyCampaign(data, base, { type: 'effects', effects: [{ villageAid: { act: 2 } }, { priceMod: { pct: -10, act: 2 } }] }).campaign;
    const loaded = normalizeCampaign(data, JSON.parse(JSON.stringify(c)));
    expect(loaded.villageAid).toEqual([2]);
    expect(loaded.priceMods).toEqual([{ pct: -10, act: 2 }]);
    const { priceMods: _p, villageAid: _v, ...old } = c;
    const fresh = normalizeCampaign(data, old as unknown as CampaignState);
    expect(fresh.villageAid).toEqual([]);
    expect(fresh.priceMods).toEqual([]);
  });
});

describe('node m1_6 and decision E4', () => {
  it('moves the company to the castle and follows ch02; nothing opens after it yet', () => {
    const node = data.campaign.nodes.find((n) => n.id === 'm1_6')!;
    expect(node.effects).toEqual([{ setHome: 'castle' }]);
    expect(node.map).toBe('m1_6_paktwacht');
    const afterCh02 = { ...base, completed: ['prologue', 'm1_1', 'ch01', 'ch02'] };
    expect(availableNodes(data, afterCh02).map((n) => n.id)).toEqual(['m1_6']);
    expect(availableNodes(data, { ...afterCh02, completed: [...afterCh02.completed, 'm1_6'] })).toEqual([]);
    expect(availableNodes(data, { ...base, completed: ['prologue', 'm1_1', 'ch01'] }).map((n) => n.id)).not.toContain('m1_6');
  });

  it('"shelter" sets the flag and Village aid for act 2; the card names both', () => {
    const c = choose(base, 'shelter');
    expect(c.flags.e04).toBe('shelter');
    expect(c.villageAid).toEqual([2]);
    expect(c.priceMods).toEqual([]);
    expect(c.stance.warm).toBe(1);
    expect(c.decisions.at(-1)).toMatchObject({ scene: 'scn.m1_6.outro', line: 'l19', option: 'shelter' });
    const line = data.scenes['scn.m1_6.outro']!.lines.find((l) => l.id === 'l19')!;
    const opt = 'choice' in line ? line.choice.find((o) => o.id === 'shelter')! : null;
    expect(consequenceLines(opt!.effects ?? [])).toEqual([{ kind: 'villageAid', act: 2 }, { kind: 'noted' }]);
  });

  it('"secret" sets the flag and the price cut for act 2; the card names both', () => {
    const c = choose(base, 'secret');
    expect(c.flags.e04).toBe('secret');
    expect(c.priceMods).toEqual([{ pct: -10, act: 2 }]);
    expect(c.villageAid).toEqual([]);
    expect(c.stance.sober).toBe(1);
    const line = data.scenes['scn.m1_6.outro']!.lines.find((l) => l.id === 'l19')!;
    const opt = 'choice' in line ? line.choice.find((o) => o.id === 'secret')! : null;
    expect(consequenceLines(opt!.effects ?? [])).toEqual([{ kind: 'priceMod', pct: -10, act: 2 }, { kind: 'noted' }]);
  });
});
