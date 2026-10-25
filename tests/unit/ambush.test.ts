/** Hinterhalt (story 2.6): a path of the player's side that leads through a foe it does not see stops in front of it. */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  beginBattle,
  computeStats,
  CoreInvariantError,
  newCampaign,
  newItem,
  replayBattle,
  validate,
  walkPath,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameData,
  type Pos,
} from '../../src/core';

let data: GameData;
const restore: Array<() => void> = [];

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
  const map = data.maps[s.mapId]!;
  const was = map.fog;
  map.fog = true;
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

const row = (y: number, x0: number, x1: number): Pos[] => Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y] as Pos);
const unit = (s: BattleState, uid: string) => s.units.find((u) => u.uid === uid)!;

beforeAll(() => {
  data = loadContentFromDisk().data;
});
afterEach(() => {
  while (restore.length) restore.pop()!();
});

describe('Hinterhalt on a planned path', () => {
  function scene() {
    const s = arena();
    const me = place(s, 'player', 'scout', [1, 5], 'iron_dagger');
    const foe = place(s, 'enemy', 'brigand', [4, 5], 'iron_axe');
    return { s, me, foe };
  }

  it('stops the unit on the last free tile before the foe, names the foe and ends the turn', () => {
    const { s, me, foe } = scene();
    const r = applyCommand(data, s, { type: 'move', unit: me.uid, to: [6, 5], path: row(5, 1, 6) });
    const u = unit(r.state, me.uid);
    expect(u.pos).toEqual([3, 5]);
    expect(u.acted).toBe(true);
    expect(r.events.find((e) => e.t === 'moved')).toMatchObject({ unit: me.uid, path: row(5, 1, 3) });
    expect(r.events.find((e) => e.t === 'ambush')).toEqual({ t: 'ambush', unit: me.uid, by: foe.uid, at: [3, 5] });
    expect(r.events.map((e) => e.t)).toEqual(expect.arrayContaining(['moved', 'ambush', 'exhausted']));
    expect(u.moveSpent).toBe(2);
  });

  it('cancels the action of an act command (move and attack) and uses up the unit', () => {
    const { s, me, foe } = scene();
    const far = place(s, 'enemy', 'brigand', [7, 5]);
    const r = applyCommand(data, s, { type: 'act', unit: me.uid, to: [6, 5], path: row(5, 1, 6), action: { kind: 'attack', target: far.uid } });
    expect(unit(r.state, me.uid).pos).toEqual([3, 5]);
    expect(unit(r.state, me.uid).acted).toBe(true);
    expect(r.events.some((e) => e.t === 'combat' || e.t === 'strike')).toBe(false);
    expect(r.events.find((e) => e.t === 'ambush')).toMatchObject({ by: foe.uid });
    expect(unit(r.state, far.uid).hp).toBe(far.hp);
  });

  it('stops a Nachsetzen walk the same way', () => {
    const { s, me, foe } = scene();
    me.classId = 'skirmisher';
    me.acted = true;
    s.pursue = { unit: me.uid, left: 5 };
    const r = applyCommand(data, s, { type: 'pursue', unit: me.uid, to: [6, 5], path: row(5, 1, 6) });
    expect(unit(r.state, me.uid).pos).toEqual([3, 5]);
    expect(r.events.find((e) => e.t === 'ambush')).toMatchObject({ by: foe.uid });
    expect(r.state.pursue).toBeUndefined();
  });

  it('walks back over tiles an ally stands on to the last free tile', () => {
    const { s, me, foe } = scene();
    place(s, 'player', 'vanguard', [3, 5], 'iron_lance');
    const r = applyCommand(data, s, { type: 'move', unit: me.uid, to: [6, 5], path: row(5, 1, 6) });
    expect(unit(r.state, me.uid).pos).toEqual([2, 5]);
    expect(r.events.find((e) => e.t === 'ambush')).toMatchObject({ by: foe.uid, at: [2, 5] });
  });

  it('stops in a hold zone of an unseen vanguard when the path would go on, and not when it ends there', () => {
    const s = arena();
    const me = place(s, 'player', 'scout', [1, 4], 'iron_dagger');
    const van = place(s, 'enemy', 'vanguard', [4, 5], 'iron_lance');
    const r = applyCommand(data, s, { type: 'move', unit: me.uid, to: [6, 4], path: row(4, 1, 6) });
    expect(unit(r.state, me.uid).pos).toEqual([4, 4]);
    expect(r.events.find((e) => e.t === 'ambush')).toMatchObject({ by: van.uid, at: [4, 4] });
    const ends = applyCommand(data, s, { type: 'move', unit: me.uid, to: [4, 4], path: row(4, 1, 4) });
    expect(ends.events.some((e) => e.t === 'ambush')).toBe(false);
    expect(unit(ends.state, me.uid).acted).toBe(false);
  });

  it('behaves like a normal move when nothing is in the way, with or without the path', () => {
    const s = arena();
    const me = place(s, 'player', 'scout', [1, 5], 'iron_dagger');
    place(s, 'enemy', 'brigand', [9, 9]);
    const withPath = applyCommand(data, s, { type: 'move', unit: me.uid, to: [4, 5], path: row(5, 1, 4) });
    const plain = applyCommand(data, s, { type: 'move', unit: me.uid, to: [4, 5] });
    expect(withPath.state).toEqual(plain.state);
    expect(withPath.events).toEqual(plain.events);
  });

  it('refuses a path that is no legal walk', () => {
    const { s, me } = scene();
    const bad = (path: Pos[], to: Pos) => validate(data, s, { type: 'move', unit: me.uid, to, path });
    expect(bad(row(5, 2, 3), [3, 5])).toBe('unreachable'); // does not start on the unit
    expect(bad([[1, 5], [3, 5]], [3, 5])).toBe('unreachable'); // a step is no neighbour
    expect(bad(row(5, 1, 3), [4, 5])).toBe('unreachable'); // does not end on `to`
    expect(bad(row(5, 1, 3).concat([[3, 4], [3, 3], [3, 2], [3, 1], [3, 0]]), [3, 0])).toBe('unreachable'); // beyond the movement
    expect(() => applyCommand(data, s, { type: 'move', unit: me.uid, to: [3, 5], path: row(5, 2, 3) })).toThrow(CoreInvariantError);
    expect(walkPath(data, s, me, row(5, 1, 3))).toMatchObject({ cut: null, cost: 2 });
  });

  it('is deterministic and does not depend on the fog flag: the log replays to the same state', () => {
    const { s, me } = scene();
    const log: Command[] = [{ type: 'move', unit: me.uid, to: [6, 5], path: row(5, 1, 6) }, { type: 'endPhase' }];
    const a = replayBattle(data, s, log);
    const map = data.maps[s.mapId]!;
    map.fog = false;
    expect(replayBattle(data, s, log)).toEqual(a);
    expect(structuredClone(a)).toEqual(a);
    expect(unit(a, me.uid).pos).toEqual([3, 5]);
  });
});
