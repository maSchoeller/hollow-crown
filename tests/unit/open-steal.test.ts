/** Öffnen and Stehlen of the scout (story 2.6, GDD Rollenklassen). Built on fixtures: an arena with units, doors and chests placed by the tests. */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  availableActions,
  beginBattle,
  classPreview,
  computeStats,
  CoreInvariantError,
  goesToConvoy,
  newCampaign,
  newItem,
  openTargets,
  posKey,
  replayBattle,
  stealableItems,
  stealBlock,
  stealTargets,
  validate,
  visibleTiles,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';
import { addDevFogMap } from '../fixtures/devFogMap';

let data: GameData;
const restore: Array<() => void> = [];

/** Prologue state with every unit removed from the map except the ones a test places itself, on an open field. */
function arena(): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  for (const u of s.units) u.pos = null;
  s.units.forEach((u) => (u.gone = 'retreated'));
  s.outcome = null;
  s.lockedRoles = [];
  s.terrain = s.terrain.map(() => 'plain');
  s.objects = [];
  s.loot = [];
  s.timers = {};
  return s;
}

function place(s: BattleState, team: BattleUnit['team'], classId: string, at: Pos, weapon?: string): BattleUnit {
  const u = s.units.find((x) => x.gone === 'retreated' && x.pos === null && (team === 'player' ? x.team === 'player' : x.team === 'enemy'));
  if (!u) throw new Error('out of units');
  u.gone = undefined;
  u.pos = at;
  u.classId = classId;
  u.equip = {};
  u.bag = [];
  u.acted = false;
  u.moved = false;
  u.downed = false;
  u.status = [];
  u.buffs = [];
  u.usedPerMap = {};
  u.personalSkill = undefined;
  u.flags = [];
  u.dropUids = [];
  u.ai = u.team === 'enemy' ? { profile: 'hold' } : undefined;
  u.hp = computeStats(data, u).maxHp;
  if (weapon) u.equip.mainHand = newItem(s, weapon, data);
  return u;
}

/** A closed door (terrain and object, as maps make them). */
function door(s: BattleState, id: string, at: Pos): void {
  s.terrain[at[1] * s.width + at[0]] = 'door';
  s.objects.push({ id, type: 'door', at, state: 'closed' });
}
/** A closed chest whose contents the map definition names (undone after the test). */
function chest(s: BattleState, id: string, at: Pos, contents = { gold: 150 } as { gold?: number; item?: { def: string } }): void {
  s.objects.push({ id, type: 'chest', at, state: 'closed' });
  const map = data.maps[s.mapId]!;
  const was = map.objects;
  map.objects = [...was, { id, type: 'chest', at, contents }];
  restore.push(() => (map.objects = was));
}
const giveKey = (s: BattleState, u: BattleUnit) => u.bag.push(newItem(s, 'door_key', data));
const act = (s: BattleState, u: BattleUnit, action: Extract<Command, { type: 'act' }>['action'], to?: Pos) =>
  applyCommand(data, s, { type: 'act', unit: u.uid, to: to ?? u.pos!, action });
const kinds = (s: BattleState, u: BattleUnit, at?: Pos) => availableActions(data, s, u, at ?? u.pos!).map((o) => o.kind);
const evTypes = (events: GameEvent[]) => events.map((e) => e.t);

beforeAll(() => {
  data = loadContentFromDisk().data;
});
afterEach(() => {
  while (restore.length) restore.pop()!();
});

describe('Öffnen', () => {
  it('lets a scout open a door from the neighbouring tile without a key and without a charge', () => {
    const s = arena();
    const scout = place(s, 'player', 'scout', [3, 3], 'iron_dagger');
    door(s, 'd1', [4, 3]);
    giveKey(s, scout);
    const opts = availableActions(data, s, scout, scout.pos!).filter((o) => o.kind === 'open');
    expect(opts).toEqual([{ kind: 'open', object: 'd1', objectType: 'door' }]);
    const r = act(s, scout, { kind: 'open', object: 'd1' });
    expect(r.state.objects[0]!.state).toBe('open');
    expect(r.state.terrain[3 * r.state.width + 4]).toBe('door_open');
    expect(evTypes(r.events)).toEqual(expect.arrayContaining(['opened', 'terrain']));
    expect(r.events.find((e) => e.t === 'terrain')).toMatchObject({ at: [4, 3], terrain: 'door_open' });
    // the key keeps its charge
    const key = r.state.units.find((u) => u.uid === scout.uid)!.bag.find((i) => i.def === 'door_key')!;
    expect(key.charges ?? 1).toBe(1);
    expect(r.state.units.find((u) => u.uid === scout.uid)!.acted).toBe(true);
  });

  it('opens a chest the scout stands on, or stands next to, and hands out its contents', () => {
    for (const from of [[5, 5], [5, 6]] as Pos[]) {
      const s = arena();
      const scout = place(s, 'player', 'scout', from, 'iron_sword');
      chest(s, 'c1', [5, 5], { gold: 150, item: { def: 'vulnerary' } });
      expect(kinds(s, scout)).toContain('open');
      const r = act(s, scout, { kind: 'open', object: 'c1' });
      expect(r.state.objects[0]!.state).toBe('open');
      expect(r.state.stats.chestsOpened).toEqual(['c1']);
      expect(r.state.goldGained).toBe(150);
      expect(r.events.find((e) => e.t === 'loot')).toMatchObject({ unit: scout.uid, toConvoy: false });
      expect(r.state.units.find((u) => u.uid === scout.uid)!.bag.map((i) => i.def)).toContain('vulnerary');
    }
  });

  it('walks to the tile next to the door and opens it in one command', () => {
    const s = arena();
    const scout = place(s, 'player', 'scout', [1, 3], 'iron_dagger');
    door(s, 'd1', [4, 3]);
    expect(kinds(s, scout)).not.toContain('open');
    const r = act(s, scout, { kind: 'open', object: 'd1' }, [3, 3]);
    expect(r.state.units.find((u) => u.uid === scout.uid)!.pos).toEqual([3, 3]);
    expect(r.state.objects[0]!.state).toBe('open');
  });

  it('offers one entry per object when a door and a chest are both within reach', () => {
    const s = arena();
    const scout = place(s, 'player', 'scout', [3, 3]);
    door(s, 'd1', [4, 3]);
    chest(s, 'c1', [3, 4]);
    expect(openTargets(data, s, scout, scout.pos!).map((o) => o.id).sort()).toEqual(['c1', 'd1']);
    expect(availableActions(data, s, scout, scout.pos!).filter((o) => o.kind === 'open').map((o) => o.objectType).sort()).toEqual(['chest', 'door']);
  });

  it('does not open what is open already, a door diagonally, or a chest two tiles away', () => {
    const s = arena();
    const scout = place(s, 'player', 'scout', [3, 3]);
    door(s, 'd1', [4, 4]);
    chest(s, 'c1', [5, 3]);
    expect(kinds(s, scout)).not.toContain('open');
    s.objects.push({ id: 'd2', type: 'door', at: [3, 2], state: 'open' });
    expect(kinds(s, scout)).not.toContain('open');
  });

  it('is the scout only: other roles need the key, a chest only on its own tile, a door from next to it', () => {
    const s = arena();
    const van = place(s, 'player', 'vanguard', [5, 6], 'iron_lance');
    chest(s, 'c1', [5, 5]);
    door(s, 'd1', [6, 6]);
    expect(kinds(s, van)).not.toEqual(expect.arrayContaining(['open']));
    expect(kinds(s, van)).not.toContain('door');
    expect(() => act(s, van, { kind: 'open', object: 'd1' })).toThrow(CoreInvariantError);
    giveKey(s, van);
    expect(kinds(s, van)).toContain('door');
    expect(kinds(s, van)).not.toContain('chest'); // not standing on the chest
    expect(kinds(s, van)).not.toContain('open');
    const r = act(s, van, { kind: 'door', object: 'd1' });
    expect(r.state.objects.find((o) => o.id === 'd1')!.state).toBe('open');
    expect(r.state.units.find((u) => u.uid === van.uid)!.bag.some((i) => i.def === 'door_key')).toBe(false); // the only charge is used up
    // standing on the chest with a key
    const on = act(s, van, { kind: 'chest' }, [5, 5]);
    expect(on.state.objects.find((o) => o.id === 'c1')!.state).toBe('open');
  });

  it('gives a scout with a key the free Öffnen only, not the key action for the same object', () => {
    const s = arena();
    const scout = place(s, 'player', 'scout', [5, 5]);
    chest(s, 'c1', [5, 5]);
    door(s, 'd1', [6, 5]);
    giveKey(s, scout);
    const k = kinds(s, scout);
    expect(k.filter((x) => x === 'open')).toHaveLength(2);
    expect(k).not.toContain('chest');
    expect(k).not.toContain('door');
  });

  it('refuses an object that is not in reach (invalid_target) and never offers Öffnen to foes', () => {
    const s = arena();
    const scout = place(s, 'player', 'scout', [3, 3]);
    door(s, 'd1', [4, 3]);
    chest(s, 'far', [9, 9]);
    expect(validate(data, s, { type: 'act', unit: scout.uid, to: scout.pos!, action: { kind: 'open', object: 'far' } })).toBe('invalid_target');
    expect(validate(data, s, { type: 'act', unit: scout.uid, to: scout.pos!, action: { kind: 'open', object: 'nope' } })).toBe('invalid_target');
    const foe = place(s, 'enemy', 'scout', [3, 2]);
    expect(kinds(s, foe)).not.toContain('open');
    expect(kinds(s, foe)).not.toContain('steal');
  });

  it('lets the sight go through the opened door', () => {
    const s = arena();
    const map = data.maps[s.mapId]!;
    const was = map.fog;
    map.fog = true;
    restore.push(() => (map.fog = was));
    const van = place(s, 'player', 'vanguard', [2, 3]);
    const scout = place(s, 'player', 'scout', [3, 3]);
    door(s, 'd1', [4, 3]);
    van.pos = [1, 3];
    expect(visibleTiles(data, s, 'player').has(posKey([6, 3]))).toBe(false);
    const r = act(s, scout, { kind: 'open', object: 'd1' });
    expect(visibleTiles(data, r.state, 'player').has(posKey([6, 3]))).toBe(true);
  });
});

describe('Stehlen', () => {
  function duel() {
    const s = arena();
    const scout = place(s, 'player', 'scout', [3, 3], 'iron_dagger');
    const foe = place(s, 'enemy', 'brigand', [4, 3], 'iron_axe');
    foe.bag = [newItem(s, 'vulnerary', data), newItem(s, 'remedy_salve', data)];
    return { s, scout, foe };
  }
  const steal = (s: BattleState, scout: BattleUnit, foe: BattleUnit, item: string, to?: Pos) => act(s, scout, { kind: 'steal', target: foe.uid, item }, to);

  it('takes the chosen item out of the foe\'s bag into the scout\'s bag and costs the action', () => {
    const { s, scout, foe } = duel();
    const salve = foe.bag[1]!;
    const opt = availableActions(data, s, scout, scout.pos!).find((o) => o.kind === 'steal')!;
    expect(opt.targets).toEqual([foe.uid]);
    expect(opt.stealable).toEqual({ [foe.uid]: foe.bag.map((i) => i.uid) });
    const r = steal(s, scout, foe, salve.uid);
    const me = r.state.units.find((u) => u.uid === scout.uid)!;
    const him = r.state.units.find((u) => u.uid === foe.uid)!;
    expect(me.bag.map((i) => i.uid)).toEqual([salve.uid]);
    expect(him.bag.map((i) => i.def)).toEqual(['vulnerary']);
    expect(him.equip.mainHand?.def).toBe('iron_axe');
    expect(me.acted).toBe(true);
    expect(r.events.find((e) => e.t === 'stolen')).toMatchObject({ unit: scout.uid, target: foe.uid, item: { def: 'remedy_salve' } });
    expect(r.events.find((e) => e.t === 'loot')).toMatchObject({ unit: scout.uid, toConvoy: false });
    expect(r.state.itemsGained.map((i) => i.uid)).toContain(salve.uid);
    expect(r.state.rng).toEqual(s.rng); // no roll
  });

  it('works from the tile the scout walks to, and again with the other item next time', () => {
    const { s, scout, foe } = duel();
    const r = steal(s, scout, foe, foe.bag[0]!.uid, [4, 4]);
    expect(r.state.units.find((u) => u.uid === scout.uid)!.pos).toEqual([4, 4]);
    expect(r.state.units.find((u) => u.uid === scout.uid)!.bag.map((i) => i.def)).toEqual(['vulnerary']);
  });

  it('puts the item into the convoy when the bag is full, with the loot event that says so', () => {
    const { s, scout, foe } = duel();
    scout.bag = [newItem(s, 'vulnerary', data), newItem(s, 'vulnerary', data), newItem(s, 'vulnerary', data)];
    const prev = classPreview(data, s, scout, scout.pos!, { kind: 'steal', target: foe.uid });
    expect(prev).toMatchObject({ kind: 'steal', bagFull: true });
    const r = steal(s, scout, foe, foe.bag[0]!.uid);
    expect(r.state.units.find((u) => u.uid === scout.uid)!.bag).toHaveLength(3);
    expect(r.state.convoy).toHaveLength(s.convoy.length + 1);
    expect(r.state.convoy[r.state.convoy.length - 1]!.uid).toBe(foe.bag[0]!.uid);
    expect(r.events.find((e) => e.t === 'loot')).toMatchObject({ toConvoy: true });
  });

  it('does not take equipped gear or convoyOnly goods, and says why a slot is dimmed', () => {
    const { s, scout, foe } = duel();
    foe.bag = [newItem(s, 'iron_ore', data)];
    expect(stealableItems(data, foe)).toEqual([]);
    expect(stealTargets(data, s, scout, scout.pos!)).toEqual({});
    expect(kinds(s, scout)).not.toContain('steal');
    expect(stealBlock(data, s, scout, scout.pos!)).toBe('loot');
    foe.bag = [];
    expect(stealBlock(data, s, scout, scout.pos!)).toBe('loot');
    foe.pos = [8, 8];
    expect(stealBlock(data, s, scout, scout.pos!)).toBe('foe');
    foe.bag = [newItem(s, 'vulnerary', data)];
    foe.pos = [4, 3];
    expect(stealBlock(data, s, scout, scout.pos!)).toBeNull();
    expect(stealBlock(data, s, place(s, 'player', 'vanguard', [1, 1]), [1, 1])).toBeNull(); // no scout, no slot
  });

  it('marks what goes to the convoy in the preview: runes, convoyOnly goods and everything with a full bag', () => {
    const { s, scout, foe } = duel();
    const p = classPreview(data, s, scout, scout.pos!, { kind: 'steal', target: foe.uid });
    expect(p).toMatchObject({ kind: 'steal', target: foe.uid, bagFull: false });
    expect(p && p.kind === 'steal' && p.items.map((x) => [x.item.def, x.toConvoy])).toEqual([['vulnerary', false], ['remedy_salve', false]]);
    expect(goesToConvoy(data, scout, newItem(s, 'iron_ore', data))).toBe(true);
    const rune = Object.keys(data.runes)[0];
    if (rune) expect(goesToConvoy(data, scout, newItem(s, rune, data))).toBe(true);
  });

  it('works on bosses too, and a stolen drop does not drop again when the foe dies', () => {
    const { s, scout, foe } = duel();
    foe.boss = true;
    foe.dropUids = [foe.bag[0]!.uid];
    const stolen = foe.bag[0]!.uid;
    const r = steal(s, scout, foe, stolen);
    expect(r.state.units.find((u) => u.uid === foe.uid)!.dropUids).toEqual([]);
    expect(r.state.units.find((u) => u.uid === scout.uid)!.bag.map((i) => i.uid)).toEqual([stolen]);
  });

  it('is only for the scout, only next to a foe that is alive, never from allies', () => {
    const { s, scout, foe } = duel();
    const van = place(s, 'player', 'vanguard', [4, 4], 'iron_lance');
    expect(kinds(s, van, [5, 3])).not.toContain('steal');
    expect(() => act(s, van, { kind: 'steal', target: foe.uid, item: foe.bag[0]!.uid }, [5, 3])).toThrow(CoreInvariantError);
    const ally = place(s, 'player', 'minstrel', [2, 3]);
    ally.bag = [newItem(s, 'vulnerary', data)];
    expect(stealTargets(data, s, scout, scout.pos!)).not.toHaveProperty(ally.uid);
    foe.downed = true;
    expect(stealTargets(data, s, scout, scout.pos!)).toEqual({});
  });

  it('refuses an item the foe does not carry, a foe that is not adjacent and a foe without a bag', () => {
    const { s, scout, foe } = duel();
    expect(validate(data, s, { type: 'act', unit: scout.uid, to: scout.pos!, action: { kind: 'steal', target: foe.uid, item: 'nope' } })).toBe('invalid_target');
    const eq = foe.equip.mainHand!.uid;
    expect(validate(data, s, { type: 'act', unit: scout.uid, to: scout.pos!, action: { kind: 'steal', target: foe.uid, item: eq } })).toBe('invalid_target');
    foe.pos = [6, 3];
    expect(validate(data, s, { type: 'act', unit: scout.uid, to: scout.pos!, action: { kind: 'steal', target: foe.uid, item: foe.bag[0]!.uid } })).toBe('not_allowed');
  });

  it('is deterministic: the same command log replays to the same state', () => {
    const { s, scout, foe } = duel();
    const log: Command[] = [
      { type: 'act', unit: scout.uid, to: [3, 3], action: { kind: 'steal', target: foe.uid, item: foe.bag[0]!.uid } },
      { type: 'endPhase' },
    ];
    expect(replayBattle(data, s, log)).toEqual(replayBattle(data, s, log));
    expect(structuredClone(applyCommand(data, s, log[0]!))).toEqual(applyCommand(data, s, log[0]!));
  });
});

describe('on the developer map', () => {
  it('opens the door from the courtyard, then steals from the guard in the hall', () => {
    const s0 = addDevFogMap(data);
    const opened = applyCommand(data, s0, { type: 'act', unit: 'dev_scout', to: [4, 2], action: { kind: 'open', object: 'dev_door' } });
    expect(opened.state.terrain[2 * opened.state.width + 5]).toBe('door_open');
    // next round the scout steps through the door next to the guard and takes the potion
    const guard = opened.state.units.find((u) => u.uid === 'dev_guard')!;
    const next = applyCommand(data, opened.state, { type: 'endPhase' }).state;
    const scout = next.units.find((u) => u.uid === 'dev_scout')!;
    const near: Pos = [guard.pos![0] - 1, guard.pos![1]];
    expect(availableActions(data, next, scout, near).some((o) => o.kind === 'steal' && o.targets?.includes('dev_guard'))).toBe(true);
    const stolen = applyCommand(data, next, { type: 'act', unit: 'dev_scout', to: near, action: { kind: 'steal', target: 'dev_guard', item: guard.bag[0]!.uid } });
    expect(stolen.events.map((e) => e.t)).toEqual(expect.arrayContaining(['moved', 'stolen', 'loot']));
  });

  it('opens the chest in the hall once the scout stands next to it', () => {
    const s0 = addDevFogMap(data);
    const scout = s0.units.find((u) => u.uid === 'dev_scout')!;
    scout.pos = [11, 4];
    const r = applyCommand(data, s0, { type: 'act', unit: 'dev_scout', to: [11, 4], action: { kind: 'open', object: 'dev_chest' } });
    expect(r.state.stats.chestsOpened).toEqual(['dev_chest']);
    expect(r.state.goldGained).toBe(120);
  });
});
