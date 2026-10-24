import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  applyCommand,
  autoplay,
  beginBattle,
  clone,
  newCampaign,
  newItem,
  queuedFlags,
  replayCampaign,
  rerollCost,
  upgradeCost,
  validateCampaign,
  type BattleState,
  type CampaignCommand,
  type CampaignState,
  type Command,
  type GameData,
  type QueuedEffects,
  promotionTargets,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, {
    name: 'Rhen',
    pronoun: 'they',
    portrait: 'avatar_a',
    affinity: 'wind',
  });
});

/** A campaign copy with extra gold, materials and convoy items. */
function rich(opts: { gold?: number; materials?: Record<string, number>; items?: string[] } = {}): CampaignState {
  const c = clone(base);
  c.gold = opts.gold ?? 100000;
  c.materials = { ...(opts.materials ?? {}) };
  for (const id of opts.items ?? []) c.convoy.push(newItem(c, id, data));
  return c;
}

const lastUid = (c: CampaignState) => c.convoy[c.convoy.length - 1]!.uid;

/** Applies twice from the same state: same result (determinism, concept/24-architecture §8.1). */
function run(c: CampaignState, cmd: CampaignCommand) {
  expect(validateCampaign(data, c, cmd)).toBeNull();
  const a = applyCampaign(data, c, cmd);
  const b = applyCampaign(data, clone(c), cmd);
  expect(b).toEqual(a);
  return a;
}

describe('campaign commands', () => {
  it('buy: pays the price, adds the item, reports gold and item', () => {
    const c = rich({ gold: 500 });
    const r = run(c, { type: 'buy', item: 'iron_sword' });
    const price = data.items.iron_sword!.price;
    expect(r.campaign.gold).toBe(500 - price);
    expect(r.campaign.convoy.some((i) => i.def === 'iron_sword')).toBe(true);
    expect(r.events).toEqual([
      { t: 'goldChanged', delta: -price, gold: 500 - price },
      { t: 'itemGained', uid: expect.any(String), def: 'iron_sword' },
    ]);
    expect(c.gold).toBe(500); // input untouched
  });

  it('buy: error codes', () => {
    expect(validateCampaign(data, rich(), { type: 'buy', item: 'steel_sword' })).toBe('not_for_sale');
    expect(validateCampaign(data, rich({ gold: 0 }), { type: 'buy', item: 'iron_sword' })).toBe('not_enough_gold');
    const full = rich();
    while (full.convoy.length < data.balance.economy.convoySize) full.convoy.push(newItem(full, 'vulnerary', data));
    expect(validateCampaign(data, full, { type: 'buy', item: 'iron_sword' })).toBe('convoy_full');
    expect(() => applyCampaign(data, rich({ gold: 0 }), { type: 'buy', item: 'iron_sword' })).toThrow(/not_enough_gold/);
  });

  it('buy: tier-1 runes are always for sale', () => {
    expect(validateCampaign(data, rich(), { type: 'buy', item: 'fire_rune_1' })).toBeNull();
    expect(validateCampaign(data, rich(), { type: 'buy', item: 'fire_rune_2' })).toBe('not_for_sale');
  });

  it('buyOffer and sell', () => {
    const c = rich({ gold: 100000 });
    c.offers = [newItem(c, 'iron_sword', data)];
    const offer = c.offers[0]!.uid;
    const bought = run(c, { type: 'buyOffer', uid: offer });
    expect(bought.campaign.offers).toEqual([]);
    expect(bought.campaign.convoy.some((i) => i.uid === offer)).toBe(true);
    expect(validateCampaign(data, c, { type: 'buyOffer', uid: 'nope' })).toBe('not_for_sale');
    expect(validateCampaign(data, { ...c, gold: 0 }, { type: 'buyOffer', uid: offer })).toBe('not_enough_gold');

    const sold = run(bought.campaign, { type: 'sell', uid: offer });
    expect(sold.campaign.gold).toBeGreaterThan(bought.campaign.gold);
    expect(sold.events.at(-1)).toEqual({ t: 'itemLost', uid: offer, def: 'iron_sword' });
    expect(validateCampaign(data, c, { type: 'sell', uid: 'nope' })).toBe('unknown_item');
    const herb = rich({ items: ['seers_herb'] });
    expect(validateCampaign(data, herb, { type: 'sell', uid: lastUid(herb) })).toBe('not_for_sale');
  });

  it('equip, bag and unequip move items between convoy and unit', () => {
    const c = rich({ items: ['iron_lance'] });
    const unit = c.roster.find((u) => validateCampaign(data, c, { type: 'equip', unit: u.id, uid: lastUid(c), slot: 'mainHand' }) === null)!;
    expect(unit).toBeDefined();
    const uid = lastUid(c);
    const r = run(c, { type: 'equip', unit: unit.id, uid, slot: 'mainHand' });
    expect(r.campaign.roster.find((u) => u.id === unit.id)!.equip.mainHand!.uid).toBe(uid);
    expect(r.events).toEqual([{ t: 'equipped', unit: unit.id, uid, slot: 'mainHand' }]);
    const back = run(r.campaign, { type: 'unequip', uid });
    expect(back.campaign.convoy.some((i) => i.uid === uid)).toBe(true);
    expect(back.events).toEqual([{ t: 'unitChanged', unit: unit.id }]);
    const bag = run(c, { type: 'equip', unit: unit.id, uid, slot: 'bag' });
    expect(bag.campaign.roster.find((u) => u.id === unit.id)!.bag.some((i) => i.uid === uid)).toBe(true);

    expect(validateCampaign(data, c, { type: 'equip', unit: 'nobody', uid, slot: 'bag' })).toBe('unknown_unit');
    expect(validateCampaign(data, c, { type: 'equip', unit: unit.id, uid: 'nope', slot: 'bag' })).toBe('unknown_item');
    expect(validateCampaign(data, c, { type: 'equip', unit: unit.id, uid, slot: 'body' })).toBe('cannot_equip');
    expect(validateCampaign(data, c, { type: 'unequip', uid: 'nope' })).toBe('unknown_item');
    const full = clone(c);
    const fu = full.roster.find((u) => u.id === unit.id)!;
    while (fu.bag.length < data.balance.bag.size) fu.bag.push(newItem(full, 'vulnerary', data));
    expect(validateCampaign(data, full, { type: 'equip', unit: unit.id, uid, slot: 'bag' })).toBe('bag_full');
  });

  it('upgrade uses upgradeCost (same code as the smith preview)', () => {
    const c = rich({ gold: 5000, materials: { iron_ore: 5 }, items: ['iron_sword'] });
    const uid = lastUid(c);
    const cost = upgradeCost(data, c.convoy.at(-1)!)!;
    const r = run(c, { type: 'upgrade', uid });
    expect(r.campaign.gold).toBe(5000 - cost.gold);
    expect(r.campaign.convoy.at(-1)!.upgrade).toBe(1);
    expect(r.events).toContainEqual({ t: 'materialChanged', id: 'iron_ore', delta: -2 });
    expect(r.events).toContainEqual({ t: 'itemChanged', uid });

    expect(validateCampaign(data, c, { type: 'upgrade', uid: 'nope' })).toBe('unknown_item');
    const potion = rich({ items: ['vulnerary'] });
    expect(validateCampaign(data, potion, { type: 'upgrade', uid: lastUid(potion) })).toBe('not_upgradable');
    expect(validateCampaign(data, { ...c, gold: 0 }, { type: 'upgrade', uid })).toBe('not_enough_gold');
    expect(validateCampaign(data, { ...c, materials: {} }, { type: 'upgrade', uid })).toBe('not_enough_materials');
    const maxed = clone(c);
    maxed.convoy.at(-1)!.upgrade = data.balance.economy.upgradeCost.length;
    expect(validateCampaign(data, maxed, { type: 'upgrade', uid })).toBe('max_level');
  });

  it('reroll draws from the campaign RNG and charges rerollCost', () => {
    const c = rich({ gold: 5000, materials: { arcane_dust: 5 }, items: ['iron_sword'] });
    const inst = c.convoy.at(-1)!;
    inst.affixes = [Object.keys(data.affixes)[0]!];
    // the camp smith (level 1) cannot reroll; from the configured level on it can
    expect(validateCampaign(data, c, { type: 'reroll', uid: inst.uid, index: 0 })).toBe('not_available');
    c.home.rooms.smith = data.balance.economy.rerollFromSmithLevel;
    const cost = rerollCost(data, inst);
    const r = run(c, { type: 'reroll', uid: inst.uid, index: 0 });
    expect(r.campaign.rng).not.toEqual(c.rng);
    expect(r.campaign.gold).toBe(5000 - cost.gold);
    expect(r.campaign.materials.arcane_dust).toBe(5 - cost.dust);
    expect(validateCampaign(data, c, { type: 'reroll', uid: inst.uid, index: 3 })).toBe('unknown_item');
    expect(validateCampaign(data, { ...c, gold: 0 }, { type: 'reroll', uid: inst.uid, index: 0 })).toBe('not_enough_gold');
    expect(validateCampaign(data, { ...c, materials: {} }, { type: 'reroll', uid: inst.uid, index: 0 })).toBe('not_enough_materials');
  });

  it('runes: insert, remove, merge', () => {
    const c = rich({ gold: 5000, items: ['iron_sword', 'fire_rune_1'] });
    const sword = c.convoy.at(-2)!.uid;
    const rune = lastUid(c);
    const ins = run(c, { type: 'insertRune', item: sword, rune });
    expect(ins.campaign.convoy.find((i) => i.uid === sword)!.runes).toContain('fire_rune_1');
    expect(ins.campaign.convoy.some((i) => i.uid === rune)).toBe(false);
    expect(validateCampaign(data, c, { type: 'insertRune', item: sword, rune: 'nope' })).toBe('unknown_item');

    const second = clone(ins.campaign);
    second.convoy.push(newItem(second, 'wind_rune_1', data));
    expect(validateCampaign(data, second, { type: 'insertRune', item: sword, rune: lastUid(second) })).toBe('no_slot');

    const idx = ins.campaign.convoy.find((i) => i.uid === sword)!.runes.indexOf('fire_rune_1');
    const rem = run(ins.campaign, { type: 'removeRune', item: sword, index: idx });
    expect(rem.campaign.convoy.some((i) => i.def === 'fire_rune_1')).toBe(true);
    expect(validateCampaign(data, rem.campaign, { type: 'removeRune', item: sword, index: idx })).toBe('unknown_item');

    const three = rich({ gold: 5000, items: ['fire_rune_1', 'fire_rune_1', 'fire_rune_1'] });
    const merged = run(three, { type: 'mergeRunes', rune: 'fire_rune_1' });
    expect(merged.campaign.convoy.filter((i) => i.def === 'fire_rune_1')).toHaveLength(0);
    expect(merged.campaign.convoy.some((i) => i.def === 'fire_rune_2')).toBe(true);
    expect(merged.campaign.gold).toBe(5000 - data.balance.economy.runeMerge.goldPerTier);
    expect(validateCampaign(data, rich(), { type: 'mergeRunes', rune: 'fire_rune_1' })).toBe('not_enough_materials');
    expect(validateCampaign(data, { ...three, gold: 0 }, { type: 'mergeRunes', rune: 'fire_rune_1' })).toBe('not_enough_gold');
    expect(validateCampaign(data, three, { type: 'mergeRunes', rune: 'fire_rune_3' })).toBe('max_level');
    expect(validateCampaign(data, three, { type: 'mergeRunes', rune: 'iron_sword' })).toBe('unknown_item');
  });

  it('healScar with gold or with a herb', () => {
    const c = rich({ gold: 5000, items: ['seers_herb'] });
    const u = c.roster[0]!;
    u.scars = [data.campaign.scars[0]!.id];
    const gold = run(c, { type: 'healScar', unit: u.id, index: 0 });
    expect(gold.campaign.roster[0]!.scars).toEqual([]);
    expect(gold.campaign.gold).toBe(5000 - data.balance.economy.scarRemoval.gold);
    const herb = run(c, { type: 'healScar', unit: u.id, index: 0, herb: true });
    expect(herb.campaign.gold).toBe(5000);
    expect(herb.campaign.convoy.some((i) => i.def === 'seers_herb')).toBe(false);
    expect(validateCampaign(data, c, { type: 'healScar', unit: u.id, index: 2 })).toBe('unknown_unit');
    expect(validateCampaign(data, { ...c, gold: 0 }, { type: 'healScar', unit: u.id, index: 0 })).toBe('not_enough_gold');
    expect(validateCampaign(data, { ...c, convoy: [] }, { type: 'healScar', unit: u.id, index: 0, herb: true })).toBe('not_enough_materials');
  });

  it('unlockSupport and setLoadout', () => {
    const c = rich();
    const pair = Object.keys(c.supports)[0]!;
    expect(validateCampaign(data, c, { type: 'unlockSupport', pair })).toBe('not_available');
    c.supports[pair]!.points = data.balance.supports.thresholds.C;
    const r = run(c, { type: 'unlockSupport', pair });
    expect(r.campaign.supports[pair]!.rank).toBe('C');
    expect(r.events).toEqual([{ t: 'supportUnlocked', pair, rank: 'C' }]);

    const u = c.roster[0]!;
    u.mastered = ['a', 'b'];
    const lo = run(c, { type: 'setLoadout', unit: u.id, skills: ['b', 'x', 'b'] });
    expect(lo.campaign.roster[0]!.loadout).toEqual(['b']);
    expect(validateCampaign(data, c, { type: 'setLoadout', unit: 'nobody', skills: [] })).toBe('unknown_unit');
  });

  it('promote spends a seal and changes the class', () => {
    const c = rich({ items: ['promotion_seal'] });
    const u = c.roster.find((r) => promotionTargets(data, r.classId).length > 0)!;
    const target = promotionTargets(data, u.classId)[0]!;
    expect(validateCampaign(data, c, { type: 'promote', unit: u.id, classId: target })).toBe('not_available');
    u.level = data.balance.levels.promoteFrom;
    const r = run(c, { type: 'promote', unit: u.id, classId: target });
    expect(r.campaign.roster.find((x) => x.id === u.id)!.classId).toBe(target);
    expect(r.campaign.convoy.some((i) => i.def === 'promotion_seal')).toBe(false);
    expect(r.events).toContainEqual({ t: 'promoted', unit: u.id, classId: target });
    expect(validateCampaign(data, c, { type: 'promote', unit: u.id, classId: 'nonsense' })).toBe('unknown_class');
    expect(validateCampaign(data, { ...c, convoy: [] }, { type: 'promote', unit: u.id, classId: target })).toBe('not_enough_materials');
    expect(validateCampaign(data, c, { type: 'promote', unit: 'nobody', classId: target })).toBe('unknown_unit');
    // a seal in the unit's bag works too
    const bagged = clone(c);
    const bu = bagged.roster.find((x) => x.id === u.id)!;
    bu.bag.push(bagged.convoy.pop()!);
    expect(run(bagged, { type: 'promote', unit: u.id, classId: target }).campaign.roster.find((x) => x.id === u.id)!.bag.some((i) => i.def === 'promotion_seal')).toBe(false);
  });

  it('setFlag effect is idempotent', () => {
    const r = run(rich(), { type: 'effects', effects: [{ setFlag: 'avatar_honest' }] });
    expect(r.campaign.flags).toEqual({ avatar_honest: true });
    expect(r.events).toEqual([{ t: 'flagSet', flag: 'avatar_honest', value: true }]);
    expect(run(r.campaign, { type: 'effects', effects: [{ setFlag: 'avatar_honest' }] }).events).toEqual([]);
  });

  it('finishMission replays the battle log and applies the result', () => {
    const start = beginBattle(data, base, data.campaign.start, base.roster.map((r) => r.id)).state;
    const played = autoplay(data, start);
    expect(played.state.outcome).toBe('victory');
    const r = run(base, { type: 'finishMission', start, commands: played.log });
    expect(r.campaign.completed).toContain(data.campaign.start);
    const done = r.events.find((e) => e.t === 'missionFinished');
    expect(done && done.t === 'missionFinished' && done.result.outcome).toBe('victory');
    expect(validateCampaign(data, r.campaign, { type: 'finishMission', start, commands: played.log })).toBe('node_unavailable');
  });
});

describe('finishMission with dialogue effects queued during the battle', () => {
  const start = () => beginBattle(data, base, data.campaign.start, base.roster.map((r) => r.id)).state;
  const queue = [
    { at: 0, effects: [{ setFlag: 'ch02_hold' }, { gold: 7 }] },
    { at: 2, effects: [{ stance: 'warm' as const }, { chronicle: 'p_test' }] },
  ];
  /** The player idles until the enemy wins. */
  function lost(c: CampaignState): { start: BattleState; log: Command[] } {
    const s0 = beginBattle(data, c, data.campaign.start, c.roster.map((r) => r.id)).state;
    let s = s0;
    const log: Command[] = [];
    for (let i = 0; i < 60 && !s.outcome; i++) {
      const cmd: Command = { type: 'endPhase' };
      s = applyCommand(data, s, cmd).state;
      log.push(cmd);
    }
    expect(s.outcome).toBe('defeat');
    return { start: s0, log };
  }

  it('victory: applies them once, in order, together with the result', () => {
    const s0 = start();
    const played = autoplay(data, s0);
    const plain = run(base, { type: 'finishMission', start: s0, commands: played.log });
    const r = run(base, { type: 'finishMission', start: s0, commands: played.log, effects: queue });
    expect(r.campaign.flags.ch02_hold).toBe(true);
    expect(r.campaign.gold).toBe(plain.campaign.gold + 7);
    expect(r.campaign.stance.warm).toBe(base.stance.warm + 1);
    expect(r.campaign.chronicle.filter((p) => p === 'p_test')).toHaveLength(1);
    expect(r.events.filter((e) => e.t === 'flagSet')).toEqual([{ t: 'flagSet', flag: 'ch02_hold', value: true }]);
    expect(r.events.filter((e) => e.t === 'stanceGained')).toHaveLength(1);
    expect(r.events.at(-1)!.t).toBe('missionFinished');
    expect(r.campaign.completed).toContain(data.campaign.start);
  });

  it('defeat: applies none and leaves the campaign unchanged', () => {
    // an idle company only loses on hard
    const hard = newCampaign(data, 7, { difficulty: 'hard', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    const l = lost(hard);
    const r = run(hard, { type: 'finishMission', start: l.start, commands: l.log, effects: queue });
    expect(r.campaign).toEqual(hard);
    expect(r.events.filter((e) => e.t === 'flagSet' || e.t === 'stanceGained' || e.t === 'chronicleAdded' || e.t === 'goldChanged')).toEqual([]);
  });

  it('skips a dialogue group that no longer fits after the battle, the mission still ends', () => {
    const s0 = start();
    const log = autoplay(data, s0).log;
    const bad: QueuedEffects[] = [
      { at: 0, effects: [{ gold: -1e9 }] },
      { at: 0, effects: [{ setFlag: 'no_such_flag' }] },
      { at: 0, effects: [{ gold: 7 }] },
    ];
    const cmd: CampaignCommand = { type: 'finishMission', start: s0, commands: log, effects: bad };
    expect(validateCampaign(data, base, cmd)).toBeNull();
    const plain = applyCampaign(data, base, { type: 'finishMission', start: s0, commands: log }).campaign;
    const r = applyCampaign(data, base, cmd).campaign;
    expect(r.gold).toBe(plain.gold + 7);
    expect(r.flags.no_such_flag).toBeUndefined();
  });

  it('an item granted by a battle dialogue stays in the convoy after the mission', () => {
    const s0 = start();
    const cmd: CampaignCommand = { type: 'finishMission', start: s0, commands: autoplay(data, s0).log, effects: [{ at: 0, effects: [{ item: { def: 'iron_sword' } }] }] };
    const plain = applyCampaign(data, base, { type: 'finishMission', start: s0, commands: cmd.commands }).campaign;
    const r = applyCampaign(data, base, cmd).campaign;
    expect(r.convoy.filter((i) => i.def === 'iron_sword').length).toBe(plain.convoy.filter((i) => i.def === 'iron_sword').length + 1);
  });

  it('flags in the queue are visible to conditions during the battle', () => {
    expect(queuedFlags([])).toEqual({});
    expect(queuedFlags(queue)).toEqual({ ch02_hold: true });
    expect(queuedFlags([{ at: 1, effects: [{ setFlag: { e02: 'protect' } }] }])).toEqual({ e02: 'protect' });
  });

  it('journal replay of finishMission with effects gives the same campaign', () => {
    const s0 = start();
    const cmd: CampaignCommand = { type: 'finishMission', start: s0, commands: autoplay(data, s0).log, effects: queue };
    const journal = [JSON.parse(JSON.stringify(cmd)) as CampaignCommand];
    const direct = applyCampaign(data, base, cmd).campaign;
    const replayed = replayCampaign(data, base, journal);
    expect(replayed).toEqual(direct);
    expect(JSON.stringify(replayed)).toBe(JSON.stringify(direct));
    // a journal entry written before the queue existed still replays
    const old = JSON.parse(JSON.stringify({ ...cmd, effects: undefined })) as CampaignCommand;
    expect(replayCampaign(data, base, [old]).flags.ch02_hold).toBeUndefined();
  });
});

describe('journal replay', () => {
  it('start state + journal gives exactly the same campaign', () => {
    let c = clone(base);
    const journal: CampaignCommand[] = [];
    const exec = (cmd: CampaignCommand) => {
      c = applyCampaign(data, c, cmd).campaign;
      journal.push(JSON.parse(JSON.stringify(cmd)) as CampaignCommand);
    };
    exec({ type: 'buy', item: 'iron_sword' });
    exec({ type: 'effects', effects: [{ setFlag: 'ch02_hold' }] });
    const start = beginBattle(data, c, data.campaign.start, c.roster.map((r) => r.id)).state;
    exec({ type: 'finishMission', start, commands: autoplay(data, start).log });
    exec({ type: 'equip', unit: c.roster[0]!.id, uid: c.convoy.find((i) => i.def === 'iron_sword')!.uid, slot: 'bag' });
    exec({ type: 'sell', uid: c.convoy.find((i) => i.def === 'vulnerary')!.uid });

    const replayed = replayCampaign(data, base, journal);
    expect(replayed).toEqual(c);
    expect(JSON.stringify(replayed)).toBe(JSON.stringify(c));
  });
});
