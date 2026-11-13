// Story 10.1: rooms of the castle build up with gold to level 2 and, with one of their two room companions, to level 3.
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  addToRoster,
  applyCampaign,
  buildableRooms,
  campfireMaxRank,
  clone,
  newCampaign,
  refreshTavern,
  replayCampaign,
  rerollAllowed,
  roomBuild,
  roomLevel,
  scarCost,
  tavernOfferCount,
  upgradeLimit,
  validateCampaign,
  type CampaignCommand,
  type CampaignState,
  type GameData,
} from '../../src/core';
import { buildRooms, homeHeuristic, roomUpgrades } from '../../tools/simCampaign';

let data: GameData;
let start: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  start = newCampaign(data, 11, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** Fixture of a live act-2 save: the company in the castle of act 2 with gold, no room built yet. */
function act2Castle(gold = 20000): CampaignState {
  const c = clone(start);
  c.act = 2;
  c.home = { kind: 'castle', rooms: {} };
  c.gold = gold;
  return c;
}

const build = (c: CampaignState, room: string) => applyCampaign(data, c, { type: 'buildRoom', room });
const companions = (room: string): string[] =>
  data.rooms[room]!.levels[1]!.requires.flatMap((r) => ('any' in r ? r.any.flatMap((x) => ('alive' in x ? [x.alive] : [])) : []));
const withCompanion = (c: CampaignState, id: string): CampaignState => {
  const out = clone(c);
  if (!out.roster.some((u) => u.id === id)) addToRoster(data, out, id);
  return out;
};
const without = (c: CampaignState, ids: string[], how: 'dead' | 'left'): CampaignState => {
  const out = clone(c);
  for (const id of ids) {
    const u = out.roster.find((r) => r.id === id);
    out.roster = out.roster.filter((r) => r.id !== id);
    if (how === 'left') out.left.push(id);
    else if (u) out.fallen.push({ id, nameKey: u.nameKey, classId: u.classId, node: 'm2_1' });
  }
  return out;
};

describe('rooms.yaml (story 10.1)', () => {
  it('lists the 11 rooms in display order, each castle room with 1 500 / 4 000 gold and two room companions for level 3', () => {
    expect(Object.keys(data.rooms)).toEqual(['convoy', 'merchant', 'smith', 'healer', 'tavern', 'campfire', 'memorial', 'enchanter', 'academy', 'workshop', 'training']);
    for (const r of Object.values(data.rooms)) {
      expect(r.levels.map((l) => l.cost.gold)).toEqual([1500, 4000]);
      expect(r.levels[0]!.requires).toEqual([{ act: 2 }]);
      expect(companions(r.id)).toHaveLength(2);
    }
    expect(companions('convoy')).toEqual(['tobin', 'nell']);
    expect(companions('training')).toEqual(['mira', 'ilka']);
  });
});

describe('buildRoom (story 10.1)', () => {
  it('builds 1 → 2 for gold alone, then 2 → 3 with a room companion; gold and both events', () => {
    let c = without(act2Castle(), companions('smith'), 'left');
    const r1 = build(c, 'smith');
    expect(r1.events).toEqual([
      { t: 'goldChanged', delta: -1500, gold: 18500 },
      { t: 'roomBuilt', room: 'smith', level: 2 },
    ]);
    c = r1.campaign;
    expect(roomLevel(c, 'smith')).toBe(2);
    expect(validateCampaign(data, c, { type: 'buildRoom', room: 'smith' })).toBe('room_locked');
    c = withCompanion(c, 'grosk');
    const r2 = build(c, 'smith');
    expect(r2.events).toEqual([
      { t: 'goldChanged', delta: -4000, gold: 14500 },
      { t: 'roomBuilt', room: 'smith', level: 3 },
    ]);
    expect(roomLevel(r2.campaign, 'smith')).toBe(3);
    expect(validateCampaign(data, r2.campaign, { type: 'buildRoom', room: 'smith' })).toBe('max_level');
  });

  it('gives exactly one error code in the order unknown_room, max_level, room_locked, not_enough_gold', () => {
    const c = act2Castle(0);
    expect(validateCampaign(data, c, { type: 'buildRoom', room: 'nope' })).toBe('unknown_room');
    // top level and locked and poor: max_level wins
    expect(validateCampaign(data, { ...c, home: { kind: 'castle', rooms: { smith: 3 } } }, { type: 'buildRoom', room: 'smith' })).toBe('max_level');
    // act 1: the step needs act 2, the gold is missing too: room_locked wins
    expect(validateCampaign(data, { ...c, act: 1 }, { type: 'buildRoom', room: 'convoy' })).toBe('room_locked');
    // a room of act 2 does not exist in act 1
    expect(validateCampaign(data, { ...act2Castle(), act: 1 }, { type: 'buildRoom', room: 'academy' })).toBe('unknown_room');
    expect(validateCampaign(data, c, { type: 'buildRoom', room: 'convoy' })).toBe('not_enough_gold');
    // the camp never builds; the memorial hall is not part of it
    const camp = { ...act2Castle(), home: { kind: 'camp' as const, rooms: {} } };
    expect(validateCampaign(data, camp, { type: 'buildRoom', room: 'smith' })).toBe('room_locked');
    expect(validateCampaign(data, camp, { type: 'buildRoom', room: 'memorial' })).toBe('unknown_room');
    expect(() => build(c, 'convoy')).toThrow();
  });

  it('a room keeps level 2 when both room companions are dead or gone, only level 3 is locked; level 1 still builds to 2', () => {
    for (const how of ['dead', 'left'] as const) {
      const ids = companions('academy');
      // before level 2: both gone, level 2 still builds
      let c = without(act2Castle(), ids, how);
      expect(roomBuild(data, c, 'academy')).toMatchObject({ level: 2, error: null });
      c = build(c, 'academy').campaign;
      expect(roomBuild(data, c, 'academy')).toMatchObject({ level: 3, error: 'room_locked', unmet: { any: ids.map((id) => ({ alive: id })) } });
      // after level 2: the companion joins, the room is built to 3, then he leaves; the level stays
      let d = build(withCompanion(act2Castle(), ids[1]!), 'academy').campaign;
      d = without(d, ids, how);
      expect(roomLevel(d, 'academy')).toBe(2);
      expect(validateCampaign(data, d, { type: 'buildRoom', room: 'academy' })).toBe('room_locked');
      const e = build(build(withCompanion(act2Castle(), ids[0]!), 'academy').campaign, 'academy').campaign;
      expect(roomLevel(without(e, ids, how), 'academy')).toBe(3);
    }
  });

  it('is deterministic and replays from the journal', () => {
    const c = withCompanion(act2Castle(), 'brenna');
    const cmds: CampaignCommand[] = [
      { type: 'buildRoom', room: 'smith' },
      { type: 'buildRoom', room: 'healer' },
      { type: 'buildRoom', room: 'smith' },
    ];
    let a = c;
    for (const cmd of cmds) a = applyCampaign(data, a, cmd).campaign;
    let b = c;
    for (const cmd of cmds) b = applyCampaign(data, b, cmd).campaign;
    expect(b).toEqual(a);
    expect(replayCampaign(data, c, cmds)).toEqual(a);
    expect(a.home.rooms).toEqual({ smith: 3, healer: 2 });
    expect(a.gold).toBe(20000 - 1500 - 1500 - 4000);
  });

  it('counts the rooms that can be built now (head of the room list)', () => {
    const c = act2Castle();
    const open = buildableRooms(data, c);
    expect(open).toBeGreaterThan(0);
    expect(buildableRooms(data, { ...c, gold: 0 })).toBe(0);
    expect(buildableRooms(data, { ...c, act: 1 })).toBe(0);
  });
});

describe('level effects from balance.yaml (story 10.1)', () => {
  it('smith: +4 at level 2, +5 and reroll at level 3', () => {
    let c = withCompanion(act2Castle(), 'brenna');
    expect([upgradeLimit(data, c), rerollAllowed(data, c)]).toEqual([3, false]);
    c = build(c, 'smith').campaign;
    expect([upgradeLimit(data, c), rerollAllowed(data, c)]).toEqual([4, false]);
    c = build(c, 'smith').campaign;
    expect([upgradeLimit(data, c), rerollAllowed(data, c)]).toEqual([5, true]);
  });

  it('healer: a scar costs 2 500 → 1 800 → 1 200 gold, the herb way stays', () => {
    let c = withCompanion(act2Castle(), 'liora');
    const costs = [scarCost(data, c)];
    c = build(c, 'healer').campaign;
    costs.push(scarCost(data, c));
    c = build(c, 'healer').campaign;
    costs.push(scarCost(data, c));
    expect(costs).toEqual([2500, 1800, 1200]);
    const u = c.roster[0]!;
    u.scars = ['lame_leg'];
    const healed = applyCampaign(data, c, { type: 'healScar', unit: u.id, index: 0 });
    expect(healed.campaign.gold).toBe(c.gold - 1200);
    expect(validateCampaign(data, c, { type: 'healScar', unit: u.id, index: 0, herb: true })).toBe('not_enough_materials');
  });

  it('tavern: the next round after level 2 brings 4 offers', () => {
    let c = act2Castle();
    expect(tavernOfferCount(data, c)).toBe(3);
    c = build(c, 'tavern').campaign;
    expect(tavernOfferCount(data, c)).toBe(4);
    const next = clone(c);
    refreshTavern(data, next);
    expect(next.tavern).toHaveLength(4);
  });

  it('campfire: rank cap B → A → S', () => {
    let c = withCompanion(act2Castle(), 'brenna');
    const ranks = [campfireMaxRank(data, c)];
    c = build(c, 'campfire').campaign;
    ranks.push(campfireMaxRank(data, c));
    c = build(c, 'campfire').campaign;
    ranks.push(campfireMaxRank(data, c));
    expect(ranks).toEqual(['B', 'A', 'S']);
  });
});

describe('home heuristic of the simulation (story 10.1, fixture instead of pnpm sim --campaign act2)', () => {
  it('builds smith, academy, healer, training ground first, and only while a scar and an upgrade stay paid', () => {
    // just enough for the smith, a scar (2 500 at healer level 1) and an upgrade of 1 000
    const c = act2Castle(1500 + 2500 + 1000);
    const spent = { heal: 0, buy: 0, upgrade: 0, rooms: 0, hire: 0, craft: 0 };
    const one = buildRooms(data, c, 1000, spent);
    expect(one.home.rooms).toEqual({ smith: 2 });
    expect(spent.rooms).toBe(1500);
    expect(buildRooms(data, act2Castle(1500 + 2500 + 999), 1000).home.rooms).toEqual({});
    // without room companions in the company, so no level 3 jumps the queue
    const all = Object.keys(data.rooms).flatMap(companions);
    const rich = buildRooms(data, without(act2Castle(4 * 1500 + 2500), all, 'left'), 0);
    // the healer at level 2 lowers the scar reserve, so the order is the configured one first
    expect(Object.keys(rich.home.rooms).slice(0, 4)).toEqual(['smith', 'academy', 'healer', 'training']);
    expect(roomUpgrades(data, rich)).toBe(Object.keys(rich.home.rooms).length);
  });

  it('builds nothing in act 1 and is part of the whole home heuristic', () => {
    expect(buildRooms(data, { ...act2Castle(), act: 1 }, 0).home.rooms).toEqual({});
    const spent = { heal: 0, buy: 0, upgrade: 0, rooms: 0, hire: 0, craft: 0 };
    const after = homeHeuristic(data, act2Castle(9000), spent);
    expect(spent.rooms).toBeGreaterThan(0);
    expect(spent.heal + spent.buy + spent.upgrade + spent.rooms).toBe(9000 - after.gold);
  });
});
