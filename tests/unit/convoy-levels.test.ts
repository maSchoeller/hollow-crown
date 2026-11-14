/** Story 10.10: Konvoi der Stufen 2 und 3 – gear template, "equip the best", the levels and every error code. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  clone,
  convoyLevel,
  equipBestOpen,
  gearTemplateOf,
  gearTemplatesOpen,
  newCampaign,
  newItem,
  normalizeCampaign,
  replayCampaign,
  runEquipBest,
  runGearTemplate,
  validateCampaign,
  type CampaignCommand,
  type CampaignState,
  type GameData,
  type ItemInstance,
  type UnitRecord,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** Act 2 in the castle with the given convoy level; `act: 1` gives the camp of act 1 (every room at level 1). */
function castle(opts: { convoy?: number; act?: number } = {}): CampaignState {
  const c = clone(base);
  c.act = opts.act ?? 2;
  c.home = c.act >= 2 ? { kind: 'castle', rooms: opts.convoy ? { convoy: opts.convoy } : {} } : { kind: 'camp', rooms: {} };
  return c;
}

const unit = (c: CampaignState, id: string): UnitRecord => c.roster.find((r) => r.id === id)!;

/** Puts one item of every def into the convoy and returns them in the same order. */
function toConvoy(c: CampaignState, defs: string[]): ItemInstance[] {
  return defs.map((def) => {
    const inst = newItem(c, def, data);
    c.convoy.push(inst);
    return inst;
  });
}

/** Validates, applies twice from the same state (determinism) and returns the result. */
function run(c: CampaignState, cmd: CampaignCommand) {
  expect(validateCampaign(data, c, cmd)).toBeNull();
  const a = applyCampaign(data, c, cmd);
  expect(applyCampaign(data, clone(c), cmd)).toEqual(a);
  return a;
}

/** Fills the convoy up to its limit with potions, so one more item makes it overflow. */
function fillConvoy(c: CampaignState): void {
  while (c.convoy.length < data.balance.economy.convoySize) c.convoy.push(newItem(c, 'vulnerary', data));
}

describe('levels of the convoy', () => {
  it('the camp of act 1 is level 1: neither template nor the best', () => {
    const c = castle({ act: 1 });
    expect(convoyLevel(data, c)).toBe(1);
    expect(gearTemplatesOpen(data, c)).toBe(false);
    expect(equipBestOpen(data, c)).toBe(false);
    expect(validateCampaign(data, c, { type: 'saveGearTemplate', unit: 'lucan' })).toBe('not_available');
    expect(validateCampaign(data, c, { type: 'applyGearTemplate', unit: 'lucan' })).toBe('not_available');
    expect(validateCampaign(data, c, { type: 'equipBest', unit: 'lucan' })).toBe('not_available');
  });

  it('level 2 opens the template, level 3 also "equip the best"', () => {
    const two = castle({ convoy: 2 });
    expect([convoyLevel(data, two), gearTemplatesOpen(data, two), equipBestOpen(data, two)]).toEqual([2, true, false]);
    expect(validateCampaign(data, two, { type: 'saveGearTemplate', unit: 'lucan' })).toBeNull();
    expect(validateCampaign(data, two, { type: 'equipBest', unit: 'lucan' })).toBe('not_available');
    const three = castle({ convoy: 3 });
    expect([convoyLevel(data, three), gearTemplatesOpen(data, three), equipBestOpen(data, three)]).toEqual([3, true, true]);
    expect(validateCampaign(data, three, { type: 'equipBest', unit: 'lucan' })).toBeNull();
  });

  it('an unknown figure is the first error', () => {
    const c = castle({ convoy: 3 });
    for (const cmd of ['saveGearTemplate', 'applyGearTemplate', 'equipBest'] as const) {
      expect(validateCampaign(data, c, { type: cmd, unit: 'nobody' })).toBe('unknown_unit');
    }
    expect(validateCampaign(data, castle({ act: 1 }), { type: 'saveGearTemplate', unit: 'nobody' })).toBe('unknown_unit');
  });
});

describe('gear template', () => {
  it('saves the uids of the six places and the bag, without keys', () => {
    const c = castle({ convoy: 2 });
    const brenna = unit(c, 'brenna');
    const keys = brenna.bag.filter((i) => i.def === 'door_key');
    expect(keys).toHaveLength(1);
    const r = run(c, { type: 'saveGearTemplate', unit: 'brenna' });
    const tpl = unit(r.campaign, 'brenna').gearTemplate!;
    expect(tpl).toEqual(gearTemplateOf(data, brenna));
    expect(tpl.equip.mainHand).toBe(brenna.equip.mainHand!.uid);
    expect(tpl.equip.head).toBe(brenna.equip.head!.uid);
    expect(tpl.bag).toEqual(brenna.bag.filter((i) => i.def !== 'door_key').map((i) => i.uid));
    expect(tpl.bag).not.toContain(keys[0]!.uid);
    expect(r.events).toEqual([{ t: 'unitChanged', unit: 'brenna' }]);
    // one template per figure: nobody else gets one
    expect(r.campaign.roster.filter((u) => u.gearTemplate).map((u) => u.id)).toEqual(['brenna']);
  });

  it('puts the saved items back on and gives the displaced ones to the convoy', () => {
    let c = castle({ convoy: 2 });
    const sword = unit(c, 'lucan').equip.mainHand!;
    const [steel] = toConvoy(c, ['steel_sword']);
    c = run(c, { type: 'saveGearTemplate', unit: 'lucan' }).campaign;
    const start = c;
    c = run(c, { type: 'equip', unit: 'lucan', uid: steel!.uid, slot: 'mainHand' }).campaign;
    expect(unit(c, 'lucan').equip.mainHand!.def).toBe('steel_sword');
    expect(c.convoy.some((i) => i.uid === sword.uid)).toBe(true);
    const r = run(c, { type: 'applyGearTemplate', unit: 'lucan' });
    expect(unit(r.campaign, 'lucan').equip.mainHand!.uid).toBe(sword.uid);
    expect(r.campaign.convoy.map((i) => i.uid)).toContain(steel!.uid);
    expect(r.events).toEqual([
      { t: 'equipped', unit: 'lucan', uid: sword.uid, slot: 'mainHand' },
      { t: 'unitChanged', unit: 'lucan' },
    ]);
    // the template stays as it was: it can be applied again
    expect(unit(r.campaign, 'lucan').gearTemplate).toEqual(unit(c, 'lucan').gearTemplate);
    // replay: the same commands from the same start give the same campaign
    const cmds: CampaignCommand[] = [
      { type: 'equip', unit: 'lucan', uid: steel!.uid, slot: 'mainHand' },
      { type: 'applyGearTemplate', unit: 'lucan' },
    ];
    expect(replayCampaign(data, start, cmds)).toEqual(r.campaign);
  });

  it('skips items another figure holds and names them', () => {
    let c = castle({ convoy: 2 });
    const lance = unit(c, 'lucan').bag.find((i) => i.def === 'iron_lance')!;
    c = run(c, { type: 'saveGearTemplate', unit: 'lucan' }).campaign;
    // Tobin may hold lances: he takes the one from Lucan's template into his bag
    c = run(c, { type: 'equip', unit: 'tobin', uid: lance.uid, slot: 'bag' }).campaign;
    const dry = runGearTemplate(data, clone(c), 'lucan');
    expect(dry.skipped).toEqual([{ uid: lance.uid, def: 'iron_lance', unit: 'tobin' }]);
    expect(dry.gone).toBe(0);
    const r = run(c, { type: 'applyGearTemplate', unit: 'lucan' });
    expect(unit(r.campaign, 'tobin').bag.map((i) => i.uid)).toContain(lance.uid);
    expect(unit(r.campaign, 'lucan').bag.map((i) => i.uid)).not.toContain(lance.uid);
  });

  it('counts sold items as gone and changes nothing for them', () => {
    let c = castle({ convoy: 2 });
    const lance = unit(c, 'lucan').bag.find((i) => i.def === 'iron_lance')!;
    c = run(c, { type: 'saveGearTemplate', unit: 'lucan' }).campaign;
    c = run(c, { type: 'unequip', uid: lance.uid }).campaign;
    c = run(c, { type: 'sell', uid: lance.uid }).campaign;
    const dry = runGearTemplate(data, clone(c), 'lucan');
    expect([dry.gone, dry.skipped, dry.equipped]).toEqual([1, [], []]);
    expect(validateCampaign(data, c, { type: 'applyGearTemplate', unit: 'lucan' })).toBeNull();
  });

  it('errors without a change: no template, full convoy', () => {
    const c = castle({ convoy: 2 });
    expect(validateCampaign(data, c, { type: 'applyGearTemplate', unit: 'lucan' })).toBe('not_available');
    const full = castle({ convoy: 2 });
    const lucan = unit(full, 'lucan');
    const lance = lucan.bag.find((i) => i.def === 'iron_lance')!;
    // the template wants the lance of his own bag in his hand: the sword he wears goes to the convoy, which is full
    lucan.gearTemplate = { equip: { mainHand: lance.uid }, bag: [] };
    fillConvoy(full);
    expect(validateCampaign(data, full, { type: 'applyGearTemplate', unit: 'lucan' })).toBe('convoy_full');
    full.convoy.pop();
    expect(validateCampaign(data, full, { type: 'applyGearTemplate', unit: 'lucan' })).toBeNull();
  });
});

describe('equip the best', () => {
  it('takes the weapon with the highest might and the best piece for every armor place', () => {
    const c = castle({ convoy: 3 });
    const [steelSword, steelLance, chain, shield, helm, hood, axe] = toConvoy(c, ['steel_sword', 'steel_lance', 'chainmail', 'iron_shield', 'iron_helm', 'mage_hood', 'iron_axe']);
    const vest = unit(c, 'lucan').equip.body!;
    const bagBefore = unit(c, 'lucan').bag.map((i) => i.uid);
    const r = run(c, { type: 'equipBest', unit: 'lucan' });
    const lucan = unit(r.campaign, 'lucan');
    // steel lance (9) beats the steel sword (8); chainmail (def 4) beats the leather vest (def 2)
    expect(lucan.equip.mainHand!.uid).toBe(steelLance!.uid);
    expect(lucan.equip.body!.uid).toBe(chain!.uid);
    expect(lucan.equip.offHand!.uid).toBe(shield!.uid);
    // iron helm and mage hood both come to 2, def decides
    expect(lucan.equip.head!.uid).toBe(helm!.uid);
    expect(r.campaign.convoy.map((i) => i.uid)).toEqual(expect.arrayContaining([steelSword!.uid, hood!.uid, axe!.uid, vest.uid]));
    // accessories and bag stay untouched
    expect(lucan.equip.accessory1).toBeUndefined();
    expect(lucan.bag.map((i) => i.uid)).toEqual(bagBefore);
    expect(r.events.at(-1)).toEqual({ t: 'unitChanged', unit: 'lucan' });
  });

  it('breaks a tie of might by hit and then by uid', () => {
    const byHit = castle({ convoy: 3 });
    // iron lance and horseslayer both have might 6; the lance hits better (80 against 70)
    unit(byHit, 'lucan').bag = [];
    const [lance] = toConvoy(byHit, ['horseslayer', 'iron_lance']);
    expect(lance!.def).toBe('horseslayer');
    const best = unit(run(byHit, { type: 'equipBest', unit: 'lucan' }).campaign, 'lucan').equip.mainHand!;
    expect(best.def).toBe('iron_lance');
    // the weaker hit lost although its uid is lower
    expect(best.uid).not.toBe(lance!.uid);
    const byUid = castle({ convoy: 3 });
    unit(byUid, 'lucan').bag = [];
    const twins = toConvoy(byUid, ['steel_lance', 'steel_lance']);
    const first = twins.map((i) => i.uid).sort()[0];
    expect(unit(run(byUid, { type: 'equipBest', unit: 'lucan' }).campaign, 'lucan').equip.mainHand!.uid).toBe(first);
  });

  it('leaves the off hand empty when a two-handed weapon wins', () => {
    const c = castle({ convoy: 3 });
    const [hammer, shield] = toConvoy(c, ['hammer', 'iron_shield']);
    const r = run(c, { type: 'equipBest', unit: 'brenna' });
    const brenna = unit(r.campaign, 'brenna');
    expect(brenna.equip.mainHand!.uid).toBe(hammer!.uid);
    expect(brenna.equip.offHand).toBeUndefined();
    expect(r.campaign.convoy.map((i) => i.uid)).toContain(shield!.uid);
  });

  it('never puts on what the role may not hold', () => {
    const c = castle({ convoy: 3 });
    // the tactician holds no heavy armor and no axes; the mage robe (res 3) beats her leather vest (def 2)
    const [plate, robe, hatchet] = toConvoy(c, ['plate_armor', 'mage_robe', 'iron_axe']);
    const avatar = unit(run(c, { type: 'equipBest', unit: 'avatar' }).campaign, 'avatar');
    expect(avatar.equip.body!.uid).toBe(robe!.uid);
    expect(avatar.equip.body!.uid).not.toBe(plate!.uid);
    expect(avatar.equip.mainHand!.def).toBe('iron_sword');
    expect(avatar.equip.mainHand!.uid).not.toBe(hatchet!.uid);
  });

  it('never takes an item another figure holds', () => {
    let c = castle({ convoy: 3 });
    const [axe] = toConvoy(c, ['steel_axe']);
    c = run(c, { type: 'equip', unit: 'brenna', uid: axe!.uid, slot: 'bag' }).campaign;
    const r = run(c, { type: 'equipBest', unit: 'tobin' });
    expect(unit(r.campaign, 'brenna').bag.map((i) => i.uid)).toContain(axe!.uid);
    expect(unit(r.campaign, 'tobin').equip.mainHand!.uid).not.toBe(axe!.uid);
  });

  it('does nothing once the figure wears the best (the second call changes nothing)', () => {
    const c = castle({ convoy: 3 });
    toConvoy(c, ['steel_lance', 'chainmail', 'iron_shield', 'iron_helm']);
    const once = run(c, { type: 'equipBest', unit: 'lucan' }).campaign;
    const before = clone(once);
    expect(runEquipBest(data, once, 'lucan').equipped).toEqual([]);
    expect(once).toEqual(before);
    const r = run(before, { type: 'equipBest', unit: 'lucan' });
    expect(r.events).toEqual([{ t: 'unitChanged', unit: 'lucan' }]);
    expect(r.campaign).toEqual(before);
  });

  it('refuses with a full convoy', () => {
    const c = castle({ convoy: 3 });
    const mail = newItem(c, 'chainmail', data);
    unit(c, 'lucan').bag.push(mail);
    fillConvoy(c);
    // the better armor comes out of his own bag, so the leather vest he wears needs a place in the convoy
    expect(validateCampaign(data, c, { type: 'equipBest', unit: 'lucan' })).toBe('convoy_full');
    c.convoy.pop();
    expect(validateCampaign(data, c, { type: 'equipBest', unit: 'lucan' })).toBeNull();
  });

  it('old saves get the default template', () => {
    const old = clone(base);
    for (const u of old.roster) delete u.gearTemplate;
    expect(normalizeCampaign(data, old).roster.every((u) => u.gearTemplate === null)).toBe(true);
  });
});
