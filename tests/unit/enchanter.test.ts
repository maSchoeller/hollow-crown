/**
 * Story 16.16: the enchanter's workbench. Rules: a stone into a chosen setting (`insertRune` with `index`, swap into the convoy),
 * `buyRune`, the checks the dimmed stones use, the vault and merge state, determinism and replay, old journals without `index`.
 * Model: the large/small setting, the probe and the main button.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  buyRuneError,
  clone,
  defaultSetting,
  mergeStatus,
  newCampaign,
  newItem,
  replayCampaign,
  runeOffers,
  runeSetError,
  runeStones,
  validateCampaign,
  type CampaignCommand,
  type CampaignState,
  type GameData,
  type ItemInstance,
} from '../../src/core';
import { BAR_CONVOY } from '../../src/app/screens/PersonBar';
import { enchantables, gemIndex, mainAction, personOf, probeOf, stoneWhy } from '../../src/app/screens/enchanterModel';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

function camp(): { c: CampaignState; axe: ItemInstance } {
  const c = newCampaign(data, 5, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  c.home = { kind: 'castle', rooms: { enchanter: 2 } };
  c.act = 2;
  c.convoy = [];
  c.gold = 5000;
  const axe = newItem(c, 'hammer', data);
  c.roster[0]!.equip = { mainHand: axe };
  return { c, axe };
}
const give = (c: CampaignState, id: string): ItemInstance => {
  const i = newItem(c, id, data);
  c.convoy.push(i);
  return i;
};
const ok = (c: CampaignState, cmd: CampaignCommand) => {
  expect(validateCampaign(data, c, cmd)).toBeNull();
  return applyCampaign(data, c, cmd).campaign;
};
const axeOf = (c: CampaignState, uid: string) => [...c.roster.flatMap((u) => Object.values(u.equip)), ...c.convoy].find((i) => i?.uid === uid)!;

describe('insertRune with a setting', () => {
  it('sets the stone into the chosen setting and leaves the other one alone', () => {
    const { c, axe } = camp();
    const edge = give(c, 'edge_rune');
    const r = ok(c, { type: 'insertRune', item: axe.uid, rune: edge.uid, index: 1 });
    expect(axeOf(r, axe.uid).runes[1]).toBe('edge_rune');
    expect(axeOf(r, axe.uid).runes[0] ?? null).toBeNull();
    expect(r.convoy).toHaveLength(0);
  });

  it('swaps a taken setting: the old rune goes to the convoy, the count stays', () => {
    const { c, axe } = camp();
    const a = give(c, 'edge_rune');
    const b = give(c, 'precision_rune');
    const one = ok(c, { type: 'insertRune', item: axe.uid, rune: a.uid, index: 0 });
    const r = applyCampaign(data, one, { type: 'insertRune', item: axe.uid, rune: b.uid, index: 0 });
    expect(axeOf(r.campaign, axe.uid).runes[0]).toBe('precision_rune');
    expect(r.campaign.convoy.map((i) => i.def)).toEqual(['edge_rune']);
    expect(r.events.map((e) => e.t)).toEqual(expect.arrayContaining(['itemLost', 'itemGained', 'itemChanged']));
  });

  it('without an index it still takes the first empty setting (old journals)', () => {
    const { c, axe } = camp();
    const a = give(c, 'edge_rune');
    const r = ok(c, { type: 'insertRune', item: axe.uid, rune: a.uid });
    expect(axeOf(r, axe.uid).runes[0]).toBe('edge_rune');
  });

  it('keeps at most one element rune; replacing the element rune with another is allowed', () => {
    const { c, axe } = camp();
    const fire = give(c, 'fire_rune_1');
    const water = give(c, 'water_rune_1');
    const one = ok(c, { type: 'insertRune', item: axe.uid, rune: fire.uid, index: 0 });
    expect(runeSetError(data, axeOf(one, axe.uid), 'water_rune_1', 1)).toBe('element_taken');
    expect(validateCampaign(data, one, { type: 'insertRune', item: axe.uid, rune: water.uid, index: 1 })).toBe('no_slot');
    expect(runeSetError(data, axeOf(one, axe.uid), 'water_rune_1', 0)).toBeNull();
    const two = ok(one, { type: 'insertRune', item: axe.uid, rune: water.uid, index: 0 });
    expect(axeOf(two, axe.uid).runes[0]).toBe('water_rune_1');
    expect(two.convoy.map((i) => i.def)).toEqual(['fire_rune_1']);
  });

  it('refuses a missing setting and a stone that is not in the convoy', () => {
    const { c, axe } = camp();
    const a = give(c, 'edge_rune');
    expect(validateCampaign(data, c, { type: 'insertRune', item: axe.uid, rune: a.uid, index: 9 })).toBe('no_slot');
    expect(validateCampaign(data, c, { type: 'insertRune', item: axe.uid, rune: 'nope', index: 0 })).toBe('unknown_item');
  });

  it('shields and body armour take element runes only, shields no light or dark', () => {
    const { c } = camp();
    const shield = newItem(c, 'iron_shield', data);
    expect(runeSetError(data, shield, 'edge_rune', 0)).toBe('wrong_item');
    expect(runeSetError(data, shield, 'light_rune_1', 0)).toBe('wrong_item');
    expect(runeSetError(data, shield, 'fire_rune_1', 0)).toBeNull();
    expect(stoneWhy(data, shield, 'edge_rune', 0)).toBe('shield');
    expect(stoneWhy(data, shield, 'light_rune_1', 0)).toBe('shieldElement');
    const vest = newItem(c, 'plate_armor', data);
    expect(stoneWhy(data, vest, 'edge_rune', 0)).toBe('body');
    expect(defaultSetting(data, shield, 'fire_rune_1')).toBe(0);
    expect(defaultSetting(data, shield, 'edge_rune')).toBeNull();
  });
});

describe('buyRune', () => {
  it('buys a rune I and sets it at once, for the price the shop shows', () => {
    const { c, axe } = camp();
    const price = runeOffers(data, c).find((o) => o.id === 'fire_rune_1')!.price;
    const r = ok(c, { type: 'buyRune', rune: 'fire_rune_1', item: axe.uid, index: 0 });
    expect(r.gold).toBe(c.gold - price);
    expect(axeOf(r, axe.uid).runes[0]).toBe('fire_rune_1');
    expect(r.convoy).toHaveLength(0);
  });

  it('swapping needs a convoy place for the old rune; checks gold, sale and setting in order', () => {
    const { c, axe } = camp();
    const old = give(c, 'edge_rune');
    const one = ok(c, { type: 'insertRune', item: axe.uid, rune: old.uid, index: 0 });
    const r = ok(one, { type: 'buyRune', rune: 'fire_rune_1', item: axe.uid, index: 0 });
    expect(r.convoy.map((i) => i.def)).toEqual(['edge_rune']);
    const full = clone(one);
    for (let i = 0; i < data.balance.economy.convoySize; i += 1) give(full, 'edge_rune');
    expect(buyRuneError(data, full, 'fire_rune_1', axeOf(full, axe.uid), 0)).toBe('convoy_full');
    expect(validateCampaign(data, full, { type: 'buyRune', rune: 'fire_rune_1', item: axe.uid, index: 0 })).toBe('convoy_full');
    expect(buyRuneError(data, c, 'fire_rune_2', axe, 0)).toBe('not_for_sale');
    expect(buyRuneError(data, c, 'fire_rune_1', undefined, 0)).toBe('unknown_item');
    expect(buyRuneError(data, c, 'fire_rune_1', axe, 7)).toBe('no_slot');
    const poor = { ...clone(c), gold: 1 };
    expect(buyRuneError(data, poor, 'fire_rune_1', axe, 0)).toBe('not_enough_gold');
  });

  it('is deterministic and replays through the journal, with the old removeRune/insertRune kinds in the same log', () => {
    const { c, axe } = camp();
    const edge = give(c, 'edge_rune');
    const cmds: CampaignCommand[] = [
      { type: 'buyRune', rune: 'fire_rune_1', item: axe.uid, index: 0 },
      { type: 'insertRune', item: axe.uid, rune: edge.uid, index: 1 },
      { type: 'removeRune', item: axe.uid, index: 0 },
    ];
    let a = c;
    for (const cmd of cmds) a = ok(a, cmd);
    expect(replayCampaign(data, c, cmds)).toEqual(a);
    expect(a.convoy.map((i) => i.def)).toEqual(['fire_rune_1']);
  });
});

describe('vault and merge state', () => {
  it('groups the convoy runes by kind with tier and count, element runes first', () => {
    const { c } = camp();
    for (const id of ['edge_rune', 'fire_rune_1', 'fire_rune_1', 'water_rune_2', 'fire_rune_2']) give(c, id);
    const list = runeStones(data, c).map((s) => `${s.id}:${s.count}`);
    expect(list).toEqual(['fire_rune_1:2', 'fire_rune_2:1', 'water_rune_2:1', 'edge_rune:1']);
  });

  it('says how many stones are there, the gold and why it cannot merge', () => {
    const { c } = camp();
    give(c, 'fire_rune_1');
    give(c, 'fire_rune_1');
    expect(mergeStatus(data, c, 'fire_rune_1')).toMatchObject({ have: 2, need: 3, error: 'not_enough_materials' });
    give(c, 'fire_rune_1');
    const st = mergeStatus(data, c, 'fire_rune_1');
    expect(st.error).toBeNull();
    expect(st.gold).toBe(200);
    expect(st.next?.id).toBe('fire_rune_2');
    expect(mergeStatus(data, c, 'fire_rune_3').error).toBe('max_level');
    expect(mergeStatus(data, c, 'edge_rune').error).toBe('unknown_item');
  });
});

describe('enchanter model', () => {
  it('lists the pieces of a person and of the convoy that have a setting; knows the owner', () => {
    const { c, axe } = camp();
    const spare = give(c, 'iron_sword');
    give(c, 'edge_rune');
    const person = c.roster[0]!.id;
    expect(enchantables(data, c, person).map((i) => i.uid)).toEqual([axe.uid]);
    expect(enchantables(data, c, BAR_CONVOY).map((i) => i.uid)).toEqual([spare.uid]);
    expect(personOf(c, axe.uid)).toBe(person);
    expect(personOf(c, spare.uid)).toBe(BAR_CONVOY);
    expect(personOf(c, 'nope')).toBeNull();
  });

  it('puts the large setting where the element rune sits and probes without changing the piece', () => {
    const { axe } = camp();
    const two = { ...axe, runes: [null, 'fire_rune_1'] };
    expect(gemIndex(data, axe, 'main')).toBe(0);
    expect(gemIndex(data, axe, 'small')).toBe(1);
    expect(gemIndex(data, two, 'main')).toBe(1);
    expect(gemIndex(data, two, 'small')).toBe(0);
    const probe = probeOf(data, axe, 'edge_rune', 1);
    expect(probe.runes).toEqual([null, 'edge_rune']);
    expect(axe.runes.includes('edge_rune')).toBe(false);
  });

  it('main button: insert, swap, buy, remove for free, or dimmed with the reason', () => {
    const { c, axe } = camp();
    const edge = give(c, 'edge_rune');
    expect(mainAction(data, c, axe, 0, null).kind).toBe('none');
    const ins = mainAction(data, c, axe, 0, { kind: 'stone', id: 'edge_rune' });
    expect(ins).toMatchObject({ kind: 'insert', cmd: { type: 'insertRune', item: axe.uid, rune: edge.uid, index: 0 } });
    const set = ok(c, ins.cmd!);
    const held = axeOf(set, axe.uid);
    expect(mainAction(data, set, held, 0, null)).toMatchObject({ kind: 'remove', cmd: { type: 'removeRune', index: 0 } });
    give(set, 'precision_rune');
    expect(mainAction(data, set, held, 0, { kind: 'stone', id: 'precision_rune' }).kind).toBe('swap');
    const buy = mainAction(data, set, held, 0, { kind: 'offer', id: 'fire_rune_1' });
    expect(buy).toMatchObject({ kind: 'buy', cmd: { type: 'buyRune' } });
    expect(buy.price).toBe(runeOffers(data, set).find((o) => o.id === 'fire_rune_1')!.price);
    const poor = { ...clone(set), gold: 0 };
    expect(mainAction(data, poor, axeOf(poor, axe.uid), 0, { kind: 'offer', id: 'fire_rune_1' }).why).toBe('gold');
    const shield = newItem(c, 'iron_shield', data);
    expect(mainAction(data, c, shield, 0, { kind: 'stone', id: 'edge_rune' })).toMatchObject({ kind: 'none', why: 'shield' });
  });
});

describe('workbench screen', () => {
  const read = (p: string) => readFileSync(p, 'utf8');
  it('lives in its own files; the old room, its styles and its texts are gone', () => {
    expect(read('src/app/screens/Rooms.tsx')).not.toMatch(/function EnchanterRoom/);
    expect(read('src/app/screens/Rooms.tsx')).toContain("from './Enchanter'");
    expect(read('src/ui/camp.css')).not.toContain('hm-offer--merge');
    for (const f of ['de', 'en']) expect(read(`content/core/locales/${f}.yaml`)).not.toContain('ui.camp.enchanter.hint');
  });
  it('every enchanter text exists in German and English', () => {
    const keys = (f: string) => [...read(`content/core/locales/${f}.yaml`).matchAll(/^(ui\.enchanter\.[\w.]+):/gm)].map((m) => m[1]).sort();
    expect(keys('de')).toEqual(keys('en'));
    expect(keys('de').length).toBeGreaterThan(20);
  });
});
