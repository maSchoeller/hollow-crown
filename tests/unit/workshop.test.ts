/** Story 10.6: Verzauberer und Werkstatt – merging by enchanter level, recipes and `craft`, Starkes Gegengift, Fallen-Set, replay. */
import { beforeAll, describe, expect, it } from 'vitest';
import { buildContent } from '../../src/content/load';
import { loadContentFromDisk, readContentFiles } from '../../src/content/node';
import { validateRecipes } from '../../src/content/validateUnits';
import {
  applyCampaign,
  applyCommand,
  applyStatus,
  availableActions,
  clone,
  craftCost,
  itemTiles,
  mergeLevelFor,
  newCampaign,
  newItem,
  replayBattle,
  replayCampaign,
  runeMergeLimit,
  runeSlotCount,
  trapsOf,
  validateCampaign,
  type BattleState,
  type BattleUnit,
  type CampaignCommand,
  type CampaignState,
  type Command,
  type GameData,
  type GameEvent,
  type ItemInstance,
  type Pos,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** Act 2 in the castle with the given room levels, gold and materials; `act: 1` gives the camp of act 1. */
function castle(opts: { rooms?: Record<string, number>; gold?: number; materials?: Record<string, number>; items?: string[]; act?: number } = {}): CampaignState {
  const c = clone(base);
  c.act = opts.act ?? 2;
  c.home = c.act >= 2 ? { kind: 'castle', rooms: { ...(opts.rooms ?? {}) } } : { kind: 'camp', rooms: {} };
  c.gold = opts.gold ?? 10000;
  c.materials = { ...(opts.materials ?? {}) };
  for (const id of opts.items ?? []) c.convoy.push(newItem(c, id, data));
  return c;
}

/** Validates, applies twice from the same state (determinism) and returns the result. */
function run(c: CampaignState, cmd: CampaignCommand) {
  expect(validateCampaign(data, c, cmd)).toBeNull();
  const a = applyCampaign(data, c, cmd);
  expect(applyCampaign(data, clone(c), cmd)).toEqual(a);
  return a;
}

const merge = (rune: string): CampaignCommand => ({ type: 'mergeRunes', rune });
const three = (id: string) => [id, id, id];

describe('content (story 10.6)', () => {
  it('has the recipes, the merge limits and the two workshop items', () => {
    expect(data.balance.economy.enchanterMergeMaxTier).toEqual([1, 2, 3]);
    expect(Object.keys(data.recipes)).toEqual(['fire_bomb', 'door_key', 'haste_scroll', 'strong_remedy', 'trap_kit', 'fire_rune_1', 'wind_rune_1', 'earth_rune_1', 'water_rune_1', 'light_rune_1']);
    expect(data.recipes.strong_remedy).toEqual({ id: 'strong_remedy', item: 'strong_remedy', roomLevel: 2, materials: { moonsteel: 1 }, gold: 0 });
    expect(data.items.strong_remedy).toMatchObject({ kind: 'consumable', price: 500, tags: ['craftOnly'], use: { cureStatus: true, statusImmuneRounds: 1 } });
    expect(data.items.trap_kit).toMatchObject({ kind: 'consumable', price: 600, tags: ['craftOnly'], use: { trap: true, rng: [1, 1] } });
  });

  it('content:check refuses a recipe with an unknown item, a missing or non-material material, and an id twice', () => {
    const d = structuredClone(data);
    d.recipes.bad = { id: 'bad', item: 'nothing', roomLevel: 1, materials: { iron_ore: 1, gold_dust: 1, vulnerary: 1 }, gold: 0 };
    const msgs: string[] = [];
    validateRecipes(d, (_f, m) => msgs.push(m), new Set(['iron_ore', 'moonsteel']));
    expect(msgs).toEqual(['bad: unknown item nothing', 'bad: unknown material gold_dust', 'bad: vulnerary is not a material']);
    const noImage: string[] = [];
    validateRecipes(data, (_f, m) => noImage.push(m), new Set(['iron_ore']));
    expect(noImage).toContain('fire_rune_1: material moonsteel has no image art/items/moonsteel.png');
    const files = readContentFiles();
    const key = Object.keys(files).find((k) => k.endsWith('core/recipes.yaml'))!;
    files[key] = [...(files[key] as unknown[]), { id: 'fire_bomb', item: 'fire_bomb', roomLevel: 1, materials: { iron_ore: 1 } }];
    expect(buildContent(files).issues.map((i) => i.message)).toContain('recipe fire_bomb is listed twice');
  });
});

describe('enchanter: merging by level (story 10.6)', () => {
  it('level 1 merges nothing, level 2 up to rune II, level 3 up to rune III', () => {
    expect(runeMergeLimit(data, castle())).toBe(1);
    expect(runeMergeLimit(data, castle({ act: 1 }))).toBe(0);
    expect(validateCampaign(data, castle({ items: three('fire_rune_1') }), merge('fire_rune_1'))).toBe('room_locked');
    expect(validateCampaign(data, castle({ act: 1, items: three('fire_rune_1') }), merge('fire_rune_1'))).toBe('room_locked');

    const two = castle({ rooms: { enchanter: 2 }, gold: 1000, items: [...three('fire_rune_1'), ...three('fire_rune_2')] });
    const r = run(two, merge('fire_rune_1'));
    expect(r.campaign.convoy.filter((i) => i.def === 'fire_rune_2')).toHaveLength(4);
    expect(r.campaign.gold).toBe(1000 - data.balance.economy.runeMerge.goldPerTier);
    expect(validateCampaign(data, two, merge('fire_rune_2'))).toBe('room_locked');

    const top = castle({ rooms: { enchanter: 3 }, items: three('fire_rune_2') });
    expect(run(top, merge('fire_rune_2')).campaign.convoy.some((i) => i.def === 'fire_rune_3')).toBe(true);
    expect(validateCampaign(data, top, merge('fire_rune_3'))).toBe('max_level');
    expect(mergeLevelFor(data, 2)).toBe(2);
    expect(mergeLevelFor(data, 3)).toBe(3);
  });

  it('checks id, top tier, level, runes and gold in this order', () => {
    const c = castle({ rooms: { enchanter: 2 }, gold: 0 });
    expect(validateCampaign(data, c, merge('iron_sword'))).toBe('unknown_item');
    expect(validateCampaign(data, c, merge('fire_rune_3'))).toBe('max_level');
    expect(validateCampaign(data, c, merge('fire_rune_2'))).toBe('room_locked');
    expect(validateCampaign(data, c, merge('fire_rune_1'))).toBe('not_enough_materials');
    expect(validateCampaign(data, castle({ rooms: { enchanter: 2 }, gold: 0, items: three('fire_rune_1') }), merge('fire_rune_1'))).toBe('not_enough_gold');
  });

  it('sets and takes out a rune of every tier on enchanter level 1', () => {
    const weapon = Object.values(data.items).find((d) => d.kind === 'weapon' && runeSlotCount(data, { uid: 'p', def: d.id, upgrade: 0, affixes: [], runes: [] }) > 0)!;
    const c = castle({ items: [weapon.id, 'earth_rune_3'] });
    const [gear, rune] = c.convoy.slice(-2) as [ItemInstance, ItemInstance];
    const ins = run(c, { type: 'insertRune', item: gear.uid, rune: rune.uid });
    const set = ins.campaign.convoy.find((i) => i.uid === gear.uid)!;
    expect(set.runes).toContain('earth_rune_3');
    const out = run(ins.campaign, { type: 'removeRune', item: gear.uid, index: set.runes.indexOf('earth_rune_3') });
    expect(out.campaign.convoy.some((i) => i.def === 'earth_rune_3')).toBe(true);
  });
});

describe('workshop: craft (story 10.6)', () => {
  it('makes an item: materials and gold go, the item joins the convoy', () => {
    const c = castle({ materials: { iron_ore: 3 }, gold: 500 });
    const n = c.convoy.length;
    expect(craftCost(data, c, 'fire_bomb')).toMatchObject({ gold: 100, materials: [{ id: 'iron_ore', need: 2, have: 3 }], error: null });
    const r = run(c, { type: 'craft', recipe: 'fire_bomb' });
    expect(r.campaign.materials.iron_ore).toBe(1);
    expect(r.campaign.gold).toBe(400);
    expect(r.campaign.convoy).toHaveLength(n + 1);
    const made = r.campaign.convoy.at(-1)!;
    expect(made.def).toBe('fire_bomb');
    expect(r.events).toEqual(
      expect.arrayContaining([
        { t: 'itemGained', uid: made.uid, def: 'fire_bomb' },
        { t: 'materialChanged', id: 'iron_ore', delta: -2 },
        { t: 'goldChanged', delta: -100, gold: 400 },
      ]),
    );
  });

  it('a recipe without gold gives no goldChanged', () => {
    const r = run(castle({ rooms: { workshop: 2 }, materials: { moonsteel: 1 } }), { type: 'craft', recipe: 'strong_remedy' });
    expect(r.events.some((e) => e.t === 'goldChanged')).toBe(false);
    expect(r.campaign.convoy.at(-1)!.def).toBe('strong_remedy');
    expect(r.campaign.materials.moonsteel).toBe(0);
  });

  it('refuses without change: unknown recipe, workshop closed or too low, materials, gold, convoy full', () => {
    const craft = (recipe: string): CampaignCommand => ({ type: 'craft', recipe });
    const rich = { materials: { iron_ore: 9, moonsteel: 9 } };
    expect(validateCampaign(data, castle(rich), craft('nothing'))).toBe('unknown_item');
    expect(validateCampaign(data, castle({ ...rich, act: 1 }), craft('fire_bomb'))).toBe('room_locked');
    expect(validateCampaign(data, castle(rich), craft('haste_scroll'))).toBe('room_locked');
    expect(validateCampaign(data, castle({ ...rich, rooms: { workshop: 2 } }), craft('trap_kit'))).toBe('room_locked');
    expect(validateCampaign(data, castle({ ...rich, rooms: { workshop: 3 } }), craft('trap_kit'))).toBeNull();
    expect(validateCampaign(data, castle({ materials: { iron_ore: 1 } }), craft('fire_bomb'))).toBe('not_enough_materials');
    expect(validateCampaign(data, castle({ ...rich, gold: 99 }), craft('fire_bomb'))).toBe('not_enough_gold');
    const full = castle(rich);
    while (full.convoy.length < data.balance.economy.convoySize) full.convoy.push(newItem(full, 'iron_ore', data));
    expect(validateCampaign(data, full, craft('fire_bomb'))).toBe('convoy_full');
  });

  it('replays: start state + journal give the same campaign', () => {
    const c = castle({ rooms: { workshop: 3, enchanter: 2 }, materials: { iron_ore: 6, moonsteel: 4 }, items: three('wind_rune_1') });
    const cmds: CampaignCommand[] = [
      { type: 'craft', recipe: 'fire_bomb' },
      { type: 'craft', recipe: 'trap_kit' },
      { type: 'craft', recipe: 'light_rune_1' },
      merge('wind_rune_1'),
    ];
    let live = c;
    for (const cmd of cmds) live = run(live, cmd).campaign;
    expect(replayCampaign(data, c, cmds)).toEqual(live);
    expect(live.convoy.map((i) => i.def).slice(-4)).toEqual(['fire_bomb', 'trap_kit', 'light_rune_1', 'wind_rune_2']);
  });
});

// ------------------------------------------------------------------ battle

function field(): BattleState {
  const s = arena(data);
  s.locked = [];
  s.phase = 'player';
  return s;
}

const unitOf = (s: BattleState, uid: string): BattleUnit => s.units.find((u) => u.uid === uid)!;
const give = (u: BattleUnit, def: string, charges = 1): string => {
  const uid = `${def}-${u.uid}`;
  u.bag.push({ uid, def, upgrade: 0, affixes: [], runes: [], charges });
  return uid;
};
const useItem = (u: BattleUnit, item: string, extra: { target?: string; at?: Pos } = {}): Command => ({ type: 'act', unit: u.uid, to: u.pos!, action: { kind: 'item', item, ...extra } });

describe('Starkes Gegengift (story 10.6)', () => {
  it('cures every condition of itself or a neighbour, which then takes no new one until the enemy phase is over', () => {
    let s = field();
    const u = place(data, s, 'player', 'vanguard', [5, 5], 'iron_sword');
    const ally = place(data, s, 'player', 'vanguard', [6, 5], 'iron_sword');
    ally.status = [
      { id: 'burning', turns: 2 },
      { id: 'slowed', turns: 2 },
    ];
    const remedy = give(u, 'strong_remedy', 2);
    expect(availableActions(data, s, u, u.pos!).find((o) => o.kind === 'item')?.items).toContain(remedy);
    const r = applyCommand(data, s, useItem(u, remedy, { target: ally.uid }));
    s = r.state;
    const cured = unitOf(s, ally.uid);
    expect(cured.status).toEqual([]);
    expect(cured.buffs.some((b) => b.statusImmune)).toBe(true);
    expect(applyStatus(data, s, cured, 'burning', [])).toBe(false);
    expect(cured.status).toEqual([]);
    // the enemy phase: still immune; after it the buff is gone
    s = applyCommand(data, s, { type: 'endPhase' }).state;
    const after = unitOf(s, ally.uid);
    expect(after.buffs.some((b) => b.statusImmune)).toBe(false);
    expect(applyStatus(data, s, after, 'burning', [])).toBe(true);
  });
});

describe('Fallen-Set (story 10.6)', () => {
  it('any unit lays an item trap on a free neighbour tile, besides the two class traps of a trapper', () => {
    let s = field();
    const t = place(data, s, 'player', 'trapper', [5, 5], 'iron_dagger');
    s.traps = [
      { id: 'trap1', at: [4, 5], owner: t.uid, source: 'class', seq: 1 },
      { id: 'trap2', at: [6, 5], owner: t.uid, source: 'class', seq: 2 },
    ];
    const kit = give(t, 'trap_kit');
    expect(itemTiles(data, s, t, t.pos!, kit)).toEqual([
      [5, 4],
      [5, 6],
    ]);
    const events: GameEvent[] = [];
    const r = applyCommand(data, s, useItem(t, kit, { at: [5, 4] }));
    s = r.state;
    events.push(...r.events);
    expect(trapsOf(s).map((x) => [x.id, x.source])).toEqual([
      ['trap1', 'class'],
      ['trap2', 'class'],
      ['trap3', 'item'],
    ]);
    expect(events.some((e) => e.t === 'trapRemoved')).toBe(false);
    expect(unitOf(s, t.uid).bag.some((i) => i.uid === kit)).toBe(false);

    const v = place(data, s, 'player', 'vanguard', [9, 9], 'iron_sword');
    const kit2 = give(v, 'trap_kit');
    expect(() => applyCommand(data, s, useItem(v, kit2))).toThrow();
    expect(() => applyCommand(data, s, useItem(v, kit2, { at: [9, 7] }))).toThrow();
    expect(applyCommand(data, s, useItem(v, kit2, { at: [9, 8] })).state.traps!.at(-1)).toMatchObject({ owner: v.uid, source: 'item', at: [9, 8] });
  });

  it('replays the same', () => {
    const start = field();
    const v = place(data, start, 'player', 'vanguard', [5, 5], 'iron_sword');
    const kit = give(v, 'trap_kit');
    const log: Command[] = [useItem(v, kit, { at: [6, 5] }), { type: 'endPhase' }];
    let s = start;
    for (const cmd of log) s = applyCommand(data, s, cmd).state;
    expect(replayBattle(data, start, log)).toEqual(s);
  });
});
