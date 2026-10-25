/** Nebel des Krieges (story 2.6): vision, the state and the events the player's side sees, the developer map. Built on fixtures. */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import {
  applyCommand,
  autoplay,
  beginBattle,
  computeStats,
  filterEvents,
  fogBands,
  fogOn,
  isVisible,
  newCampaign,
  newItem,
  posKey,
  replayBattle,
  visibleState,
  visibleTiles,
  visionRadius,
  type BattleState,
  type BattleUnit,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';
import { addDevFogMap, DEV_FOG_MAP_ID } from '../fixtures/devFogMap';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];
const restore: Array<() => void> = [];

/** Prologue state with every unit removed from the map except the ones a test places itself, on an open field. */
function arena(fog = true): BattleState {
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
  const map = data.maps[s.mapId]!;
  const was = map.fog;
  map.fog = fog;
  restore.push(() => (map.fog = was));
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
  u.ai = u.team === 'enemy' ? { profile: 'hold' } : undefined;
  u.hp = computeStats(data, u).maxHp;
  if (weapon) u.equip.mainHand = newItem(s, weapon, data);
  return u;
}

const setTile = (s: BattleState, p: Pos, terrain: string) => (s.terrain[p[1] * s.width + p[0]] = terrain);
const sees = (s: BattleState, p: Pos, team: BattleUnit['team'] = 'player') => visibleTiles(data, s, team).has(posKey(p));

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});
afterEach(() => {
  while (restore.length) restore.pop()!();
});

describe('fog numbers come from balance.yaml', () => {
  it('has base 3, +2 for marksman and scout, +1 for fliers, and the blockers wall, door and rockwall', () => {
    expect(data.balance.fog).toEqual({ baseVision: 3, roleBonus: { marksman: 2, scout: 2 }, moveTypeBonus: { flier: 1 }, blockers: ['wall', 'door', 'rockwall'] });
  });
  it('keeps the bonus keys to roles and terrain that exist (content:check)', () => {
    expect(validateContent(data, locales).filter((i) => i.file === 'balance.yaml' && /fog\./.test(i.message))).toEqual([]);
  });
});

describe('vision radius', () => {
  const s = () => arena();
  it('is 3 for a vanguard, 5 for a marksman and a scout, 4 for a flier', () => {
    const st = s();
    expect(visionRadius(data, place(st, 'player', 'vanguard', [1, 1]))).toBe(3);
    expect(visionRadius(data, place(st, 'player', 'marksman', [1, 2]))).toBe(5);
    expect(visionRadius(data, place(st, 'player', 'scout', [1, 3]))).toBe(5);
    expect(visionRadius(data, place(st, 'player', 'pegasus_knight', [1, 4]))).toBe(4);
  });
  it('does not stack: the highest bonus counts (a flying scout sees 5, not 6)', () => {
    const st = s();
    const u = place(st, 'player', 'scout', [1, 1]);
    const cls = data.classes.scout!;
    const was = cls.moveType;
    cls.moveType = 'flier';
    restore.push(() => (cls.moveType = was));
    expect(visionRadius(data, u)).toBe(5);
  });
  it('sees a diamond of tiles on open ground: 25 for radius 3, 61 for radius 5', () => {
    const st = s();
    place(st, 'player', 'vanguard', [6, 6]);
    expect(visibleTiles(data, st, 'player').size).toBe(25);
    expect(sees(st, [9, 6])).toBe(true);
    expect(sees(st, [10, 6])).toBe(false);
    expect(sees(st, [8, 8])).toBe(false);
    const st2 = s();
    place(st2, 'player', 'scout', [6, 6]);
    expect(visibleTiles(data, st2, 'player').size).toBe(61);
  });
  it('stays on the map', () => {
    const st = s();
    place(st, 'player', 'scout', [0, 0]);
    for (const k of visibleTiles(data, st, 'player')) {
      const [x, y] = k.split(',').map(Number) as Pos;
      expect(x >= 0 && y >= 0 && x < st.width && y < st.height).toBe(true);
    }
  });
});

describe('who sees what', () => {
  it('sees the whole map without fog', () => {
    const st = arena(false);
    place(st, 'player', 'vanguard', [6, 6]);
    expect(fogOn(data, st)).toBe(false);
    expect(visibleTiles(data, st, 'player').size).toBe(st.width * st.height);
  });
  it('shares the sight of the third party with the player (allies), not with the enemy', () => {
    const st = arena();
    const npc = place(st, 'player', 'vanguard', [2, 2]);
    npc.team = 'other';
    expect(sees(st, [2, 2], 'player')).toBe(true);
    expect(sees(st, [2, 2], 'enemy')).toBe(false);
  });
  it('counts only active units: a downed unit sees nothing', () => {
    const st = arena();
    const u = place(st, 'player', 'vanguard', [6, 6]);
    u.downed = true;
    expect(visibleTiles(data, st, 'player').size).toBe(0);
  });
  it('adds the fields wind lifts for the team', () => {
    const st = arena();
    place(st, 'player', 'vanguard', [1, 1]);
    expect(sees(st, [8, 8])).toBe(false);
    st.fogLifted = [{ team: 'player', at: [8, 8], radius: 2, turns: 2 }];
    expect(sees(st, [8, 8])).toBe(true);
    expect(sees(st, [9, 9])).toBe(true);
    expect(sees(st, [8, 8], 'enemy')).toBe(false);
    expect(isVisible(data, st, 'player', [10, 8])).toBe(true);
  });
});

describe('line of sight', () => {
  /** A vanguard (radius 3) at [2,5] looks east along row 5. */
  function row(block: string, at = 4) {
    const st = arena();
    place(st, 'player', 'vanguard', [2, 5]);
    setTile(st, [at, 5], block);
    return st;
  }
  it('stops behind a wall, but the wall tile itself is seen', () => {
    const st = row('wall');
    expect(sees(st, [3, 5])).toBe(true);
    expect(sees(st, [4, 5])).toBe(true);
    expect(sees(st, [5, 5])).toBe(false);
  });
  it('stops behind a closed door and goes through an open one', () => {
    const closed = row('door');
    expect(sees(closed, [4, 5])).toBe(true);
    expect(sees(closed, [5, 5])).toBe(false);
    const open = row('door_open');
    expect(sees(open, [5, 5])).toBe(true);
  });
  it('stops behind a rock wall of the elementalist', () => {
    expect(sees(row('rockwall'), [5, 5])).toBe(false);
  });
  it('is not stopped by forest, mountain or water', () => {
    for (const t of ['forest', 'mountain', 'river']) expect(sees(row(t), [5, 5])).toBe(true);
  });
  it('is symmetric: what a unit sees around a corner sees the unit back', () => {
    const st = arena();
    const u = place(st, 'player', 'scout', [4, 4]);
    setTile(st, [5, 4], 'wall');
    setTile(st, [5, 5], 'wall');
    setTile(st, [4, 6], 'wall');
    const seeable = [...visibleTiles(data, st, 'player')].map((k) => k.split(',').map(Number) as Pos);
    expect(seeable.length).toBeGreaterThan(10);
    for (const from of seeable) {
      u.pos = from;
      expect(visibleTiles(data, st, 'player').has('4,4')).toBe(true);
    }
  });
});

describe('the state and the board the player sees', () => {
  it('leaves foes in the fog out of the visible state and keeps own units, seen foes and gone units', () => {
    const st = arena();
    const me = place(st, 'player', 'vanguard', [2, 2]);
    const near = place(st, 'enemy', 'brigand', [4, 2]);
    const far = place(st, 'enemy', 'brigand', [9, 9]);
    const seen = visibleState(data, st, 'player');
    const ids = seen.units.filter((u) => u.pos && !u.gone).map((u) => u.uid);
    expect(ids).toContain(me.uid);
    expect(ids).toContain(near.uid);
    expect(ids).not.toContain(far.uid);
    expect(seen.units.some((u) => u.gone === 'retreated')).toBe(true);
    expect(st.units).toContain(far); // the state itself is untouched
  });
  it('hides loot in the fog and returns the same state without fog', () => {
    const st = arena();
    place(st, 'player', 'vanguard', [2, 2]);
    st.loot = [
      { at: [3, 2], item: newItem(st, 'vulnerary', data) },
      { at: [10, 10], item: newItem(st, 'vulnerary', data) },
    ];
    expect(visibleState(data, st, 'player').loot.map((l) => l.at)).toEqual([[3, 2]]);
    const clear = arena(false);
    expect(visibleState(data, clear, 'player')).toBe(clear);
  });
  it('the enemy side keeps seeing the player: foes see through the same function for their own team only', () => {
    const st = arena();
    place(st, 'player', 'vanguard', [9, 9]);
    const foe = place(st, 'enemy', 'brigand', [2, 2]);
    expect(visibleState(data, st, 'enemy').units.map((u) => u.uid)).toContain(foe.uid);
    expect(visibleState(data, st, 'enemy').units.filter((u) => u.team === 'player' && u.pos && !u.gone)).toEqual([]);
  });
  it('splits the covered fields into fog and a fringe next to the seen ones', () => {
    const st = arena();
    place(st, 'player', 'vanguard', [6, 6]);
    const seen = visibleTiles(data, st, 'player');
    const { fog, edge } = fogBands(st, seen);
    expect(fog.length + edge.length + seen.size).toBe(st.width * st.height);
    expect(edge.some((p) => p[0] === 10 && p[1] === 6)).toBe(true);
    expect(fog.some((p) => p[0] === 11 && p[1] === 6)).toBe(true);
    expect([...fog, ...edge].some((p) => seen.has(posKey(p)))).toBe(false);
    expect(fogBands(st, new Set([...Array(st.width * st.height).keys()].map((i) => posKey([i % st.width, Math.floor(i / st.width)]))))).toEqual({ fog: [], edge: [] });
  });
  it('is plain data that survives structuredClone (the worker protocol)', () => {
    const st = arena();
    place(st, 'player', 'scout', [3, 3]);
    place(st, 'enemy', 'brigand', [4, 4]);
    const view = visibleState(data, st, 'player');
    expect(structuredClone(view)).toEqual(view);
  });
});

describe('the events the player sees played', () => {
  /** A scout at [1,1] sees to radius 5; foes: one in sight at [3,1], one far away at [10,10]. */
  function scene() {
    const st = arena();
    const me = place(st, 'player', 'scout', [1, 1]);
    const near = place(st, 'enemy', 'brigand', [3, 1]);
    const far = place(st, 'enemy', 'brigand', [10, 10]);
    return { st, me, near, far };
  }
  const path = (...p: Pos[]): Pos[] => p;

  it('returns the events as they are without fog', () => {
    const st = arena(false);
    const ev: GameEvent[] = [{ t: 'aiTurn', unit: 'x' }];
    expect(filterEvents(data, st, ev, 'player')).toBe(ev);
  });
  it('drops what a foe does in the fog and keeps its own side', () => {
    const { st, me, far } = scene();
    const ev: GameEvent[] = [
      { t: 'aiTurn', unit: far.uid },
      { t: 'moved', unit: far.uid, path: path([10, 10], [10, 9], [10, 8]) },
      { t: 'status', unit: far.uid, status: 'burning', on: true },
      { t: 'terrain', at: [10, 9], terrain: 'burning', cause: 'ignite' },
      { t: 'died', unit: far.uid },
      { t: 'gold', amount: 5 },
      { t: 'exp', unit: me.uid, amount: 3, before: 0, after: 3 },
      { t: 'phase', phase: 'player', turn: 2 },
    ];
    expect(filterEvents(data, st, ev, 'player').map((e) => e.t)).toEqual(['gold', 'exp', 'phase']);
  });
  it('shows what a seen foe does', () => {
    const { st, near } = scene();
    const ev: GameEvent[] = [
      { t: 'aiTurn', unit: near.uid },
      { t: 'moved', unit: near.uid, path: path([3, 1], [3, 2]) },
      { t: 'terrain', at: [3, 2], terrain: 'burning', cause: 'ignite' },
    ];
    expect(filterEvents(data, st, ev, 'player')).toEqual(ev);
  });
  it('cuts a move out of the fog to its seen part and lets the foe in on its first seen tile', () => {
    const { st, far } = scene();
    const before = structuredClone(st);
    // the foe walks from the fog into sight and ends on a seen tile
    far.pos = [3, 3];
    const ev: GameEvent[] = [{ t: 'moved', unit: far.uid, path: path([8, 3], [7, 3], [6, 3], [5, 3], [4, 3], [3, 3]) }];
    const out = filterEvents(data, st, ev, 'player', before);
    // radius 5 from [1,1]: [6,3] is at distance 7 (fog), [5,3] distance 6, [4,3] distance 5 (seen)
    expect(out).toEqual([
      { t: 'spawned', unit: far.uid, reinforcement: false, at: [4, 3] },
      { t: 'moved', unit: far.uid, path: [[4, 3], [3, 3]] },
    ]);
  });
  it('fades a foe out where it walks into the fog and shows nothing of a walk that stays in the fog', () => {
    const { st, near, far } = scene();
    const before = structuredClone(st);
    near.pos = [8, 1];
    const out = filterEvents(data, st, [{ t: 'moved', unit: near.uid, path: path([3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1]) }], 'player', before);
    // seen up to distance 5: [6,1]
    expect(out).toEqual([
      { t: 'moved', unit: near.uid, path: [[3, 1], [4, 1], [5, 1], [6, 1]] },
      { t: 'retreated', unit: near.uid },
    ]);
    expect(filterEvents(data, st, [{ t: 'moved', unit: far.uid, path: path([10, 10], [10, 9]) }], 'player', before)).toEqual([]);
  });
  it('shows no foe that passes through the seen area and ends in the fog without having been on the board', () => {
    const { st, far } = scene();
    const before = structuredClone(st);
    far.pos = [8, 4];
    const out = filterEvents(data, st, [{ t: 'moved', unit: far.uid, path: path([8, 3], [5, 3], [4, 3], [8, 4]) }], 'player', before);
    expect(out).toEqual([]);
  });
  it('lets a foe from the fog into a fight with a seen unit for its length, and drops fights nobody sees', () => {
    const { st, me, near, far } = scene();
    const strike = (attacker: string, defender: string, hit = true): GameEvent => ({ t: 'strike', attacker, defender, hit, crit: false, dmg: 6, hpAfter: 11, ranged: true, magic: false });
    const fromFog: GameEvent[] = [{ t: 'combat', attacker: far.uid, defender: me.uid }, strike(far.uid, me.uid), { t: 'combatEnd', attacker: far.uid, defender: me.uid }];
    // a foe that fights a seen unit is on the board for the fight only
    expect(filterEvents(data, st, fromFog, 'player')).toEqual([
      { t: 'spawned', unit: far.uid, reinforcement: false, at: [10, 10] },
      ...fromFog,
      { t: 'retreated', unit: far.uid },
    ]);
    // a single blow without its fight around it shows as damage only
    expect(filterEvents(data, st, [strike(far.uid, me.uid)], 'player')).toEqual([{ t: 'damage', unit: me.uid, amount: 6, hpAfter: 11, cause: 'item' }]);
    expect(filterEvents(data, st, [strike(far.uid, me.uid, false)], 'player')).toEqual([]);
    // a blow from the fog on a foe that is seen shows as damage; a fight between two foes in the fog shows nothing
    expect(filterEvents(data, st, [strike(far.uid, near.uid)], 'player').map((e) => e.t)).toEqual(['damage']);
    const other = place(st, 'enemy', 'brigand', [11, 11]);
    expect(filterEvents(data, st, [{ t: 'combat', attacker: far.uid, defender: other.uid }, strike(far.uid, other.uid), { t: 'combatEnd', attacker: far.uid, defender: other.uid }], 'player')).toEqual([]);
    const open: GameEvent[] = [{ t: 'combat', attacker: near.uid, defender: me.uid }, strike(near.uid, me.uid)];
    expect(filterEvents(data, st, open, 'player')).toEqual(open);
  });
  it('lets the foe of an ambush onto the board, next to the unit it stopped', () => {
    const { st, me, far } = scene();
    far.pos = [2, 1];
    const before = structuredClone(st);
    before.units.find((u) => u.uid === far.uid)!.pos = [2, 1];
    const ev: GameEvent[] = [{ t: 'ambush', unit: me.uid, by: far.uid, at: [1, 1] }];
    // seen before the command: nothing to let in
    expect(filterEvents(data, st, ev, 'player', before)).toEqual(ev);
    // not on the board before (it stood in the fog): let in at its tile
    const out = filterEvents(data, st, ev, 'player', { ...before, units: before.units.map((u) => (u.uid === far.uid ? { ...u, pos: [9, 9] as Pos } : u)) });
    expect(out.map((e) => e.t)).toEqual(['spawned', 'ambush']);
    expect(out[0]).toMatchObject({ unit: far.uid, at: [9, 9] });
  });
  it('plays the quote of a hidden foe as a plain dialogue, without a speaker to point the camera at', () => {
    const { st, near, far } = scene();
    expect(filterEvents(data, st, [{ t: 'quote', unit: far.uid, id: 'scn.x' }], 'player')).toEqual([{ t: 'dialogue', id: 'scn.x' }]);
    expect(filterEvents(data, st, [{ t: 'quote', unit: near.uid, id: 'scn.x' }], 'player')).toEqual([{ t: 'quote', unit: near.uid, id: 'scn.x' }]);
  });
  it('counts a tile as seen when it was seen before the command', () => {
    const { st, me, far } = scene();
    far.pos = [2, 4]; // distance 4 from the scout: in sight
    const before = structuredClone(st);
    me.pos = [0, 0]; // after the command the scout has stepped back: distance 6
    const ev: GameEvent[] = [{ t: 'aiTurn', unit: far.uid }];
    expect(filterEvents(data, st, ev, 'player')).toEqual([]);
    expect(filterEvents(data, st, ev, 'player', before)).toEqual(ev);
  });
  it('does not touch the events or the state it was given', () => {
    const { st, far } = scene();
    const ev: GameEvent[] = [{ t: 'moved', unit: far.uid, path: path([8, 3], [4, 3], [3, 3]) }];
    const evCopy = structuredClone(ev);
    const stCopy = structuredClone(st);
    filterEvents(data, st, ev, 'player');
    expect(ev).toEqual(evCopy);
    expect(st).toEqual(stCopy);
  });
});

describe('the foes keep seeing everything (the fog is the player side only)', () => {
  function duel() {
    const st = arena();
    const me = place(st, 'player', 'vanguard', [1, 1], 'iron_lance');
    const foe = place(st, 'enemy', 'brigand', [9, 9], 'iron_axe');
    foe.ai = { profile: 'aggressive' };
    return { st, me, foe };
  }
  it('plays the enemy phase the same with and without fog', () => {
    const a = duel();
    const b = duel();
    const fogged = applyCommand(data, a.st, { type: 'endPhase' });
    const map = data.maps[a.st.mapId]!;
    map.fog = false;
    const clear = applyCommand(data, b.st, { type: 'endPhase' });
    expect(fogged.state).toEqual(clear.state);
    expect(fogged.events).toEqual(clear.events);
    // the foe really did walk towards the unit it cannot "see"
    expect(fogged.state.units.find((u) => u.uid === a.foe.uid)!.pos).not.toEqual([9, 9]);
  });
});

describe('the developer map', () => {
  it('is a valid map (content checks) with fog, a door tied to door terrain, a chest, a scout and foes', () => {
    const s = addDevFogMap(data);
    const issues = validateContent(data, locales).filter((i) => i.file === `maps/${DEV_FOG_MAP_ID}`);
    expect(issues).toEqual([]);
    expect(data.maps[DEV_FOG_MAP_ID]!.fog).toBe(true);
    expect(s.objects.map((o) => o.type).sort()).toEqual(['chest', 'door']);
    expect(s.terrain[2 * s.width + 5]).toBe('door');
    expect(s.units.filter((u) => u.team === 'player').map((u) => u.classId).sort()).toEqual(['marksman', 'scout', 'vanguard']);
    expect(s.units.filter((u) => u.team === 'enemy')).toHaveLength(3);
  });
  it('hides the hall behind the closed door and shows it once the door is open', () => {
    const s = addDevFogMap(data);
    const guard = s.units.find((u) => u.uid === 'dev_guard')!;
    const view = visibleState(data, s, 'player');
    expect(view.units.some((u) => u.uid === guard.uid)).toBe(false);
    const open = applyCommand(data, s, { type: 'act', unit: 'dev_scout', to: [4, 2], action: { kind: 'open', object: 'dev_door' } });
    expect(visibleState(data, open.state, 'player').units.some((u) => u.uid === guard.uid)).toBe(true);
  });
  it('is not part of the game: no pack, no campaign node besides the test node', () => {
    const fresh = loadContentFromDisk().data;
    expect(fresh.maps[DEV_FOG_MAP_ID]).toBeUndefined();
    expect(fresh.campaign.nodes.some((n) => n.map === DEV_FOG_MAP_ID)).toBe(false);
  });
});

describe('replays stay deterministic', () => {
  it('an automatic game on the developer map ends the same with and without fog', () => {
    const s = addDevFogMap(data);
    const withFog = autoplay(data, s, 400);
    const map = data.maps[DEV_FOG_MAP_ID]!;
    map.fog = false;
    restore.push(() => (map.fog = true));
    const without = autoplay(data, s, 400);
    expect(withFog.log).toEqual(without.log);
    expect(withFog.state).toEqual(without.state);
    map.fog = true;
    expect(replayBattle(data, s, withFog.log)).toEqual(withFog.state);
  });
});
