/** Wolfslauf / Weiterziehen (review R3): a fixed number of fields after a real action, the AI's hit and run, replay and worker. */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { handleRequest } from '../../src/worker/handle';
import {
  afterActionMove,
  applyCommand,
  autoplay,
  beginBattle,
  computeStats,
  moveBudget,
  newCampaign,
  newItem,
  pursueReach,
  replayBattle,
  validate,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameEvent,
  type GameData,
  type Pos,
} from '../../src/core';

let data: GameData;
const restore: Array<() => void> = [];
afterEach(() => {
  while (restore.length) restore.pop()!();
});
beforeAll(() => {
  data = loadContentFromDisk().data;
});

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
  return s;
}

function place(s: BattleState, team: BattleUnit['team'], classId: string, at: Pos, weapon: string, skill?: string): BattleUnit {
  const u = s.units.find((x) => x.gone === 'retreated' && x.pos === null && x.team === team)!;
  u.gone = undefined;
  u.pos = at;
  u.classId = classId;
  u.equip = { mainHand: newItem(s, weapon, data) };
  u.bag = [];
  u.acted = false;
  u.moved = false;
  u.downed = false;
  u.status = [];
  u.buffs = [];
  u.usedPerMap = {};
  u.personalSkill = undefined;
  u.flags = [];
  u.mastered = skill ? [skill] : [];
  u.loadout = skill ? [skill] : [];
  u.ai = team === 'enemy' ? { profile: 'aggressive' } : undefined;
  u.hp = computeStats(data, u).maxHp;
  return u;
}

const attack = (u: BattleUnit, foe: BattleUnit, to: Pos): Command => ({ type: 'act', unit: u.uid, to, action: { kind: 'attack', target: foe.uid } });
const manhattan = (a: Pos, b: Pos) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

describe('afterActionMove', () => {
  it('is the extraMove of the after_action skills (Wolfslauf, Weiterziehen), the highest of them, else 0', () => {
    const s = arena();
    const none = place(s, 'player', 'vanguard', [1, 1], 'iron_lance');
    const wolf = place(s, 'player', 'vanguard', [2, 1], 'iron_lance', 'wolf_run');
    expect(afterActionMove(data, none)).toBe(0);
    expect(afterActionMove(data, wolf)).toBe(2);
    wolf.mastered.push('canto');
    wolf.loadout.push('canto');
    expect(afterActionMove(data, wolf)).toBe(2);
  });
});

describe('the player: Command pursue after an action', () => {
  function scene(skill = 'wolf_run') {
    const s = arena();
    const me = place(s, 'player', 'vanguard', [3, 5], 'iron_lance', skill);
    const foe = place(s, 'enemy', 'brigand', [5, 5], 'iron_axe');
    foe.hp = 200;
    place(s, 'player', 'vanguard', [1, 1], 'iron_lance');
    return { s, me, foe };
  }

  it('opens after an attack with exactly the fixed fields, not the rest of the movement', () => {
    const { s, me, foe } = scene();
    expect(moveBudget(data, s, me)).toBeGreaterThan(2);
    const r = applyCommand(data, s, attack(me, foe, [4, 5]));
    expect(r.state.pursue).toEqual({ unit: me.uid, left: 2 });
    const unit = r.state.units.find((u) => u.uid === me.uid)!;
    const reach = pursueReach(data, r.state, unit)!;
    expect(Math.max(...[...reach.values()].map((n) => n.cost))).toBeLessThanOrEqual(2);
    const to: Pos = [3, 5];
    expect(validate(data, r.state, { type: 'pursue', unit: me.uid, to })).toBeNull();
    expect(validate(data, r.state, { type: 'pursue', unit: me.uid, to: [4 - 3, 5] })).toBe('unreachable');
    const moved = applyCommand(data, r.state, { type: 'pursue', unit: me.uid, to });
    expect(moved.state.pursue).toBeUndefined();
    expect(manhattan(moved.state.units.find((u) => u.uid === me.uid)!.pos!, [4, 5])).toBeLessThanOrEqual(2);
  });

  it('does not open after waiting, nor for a unit without the skill', () => {
    const { s, me } = scene();
    expect(applyCommand(data, s, { type: 'act', unit: me.uid, to: [4, 5], action: { kind: 'wait' } }).state.pursue).toBeUndefined();
    const other = scene();
    other.me.mastered = [];
    other.me.loadout = [];
    expect(applyCommand(data, other.s, attack(other.me, other.foe, [4, 5])).state.pursue).toBeUndefined();
  });

  it('Canto works the same', () => {
    const { s, me, foe } = scene('canto');
    expect(applyCommand(data, s, attack(me, foe, [4, 5])).state.pursue).toEqual({ unit: me.uid, left: 2 });
  });

  it('with Nachsetzen the higher of the two values counts, they do not add up', () => {
    const { s, me, foe } = scene();
    me.classId = 'skirmisher';
    me.equip = { mainHand: newItem(s, 'iron_sword', data) };
    const rest = moveBudget(data, s, me) - 1;
    expect(rest).toBeGreaterThan(2);
    expect(applyCommand(data, s, attack(me, foe, [4, 5])).state.pursue?.left).toBe(rest);
    // a higher fixed number wins over the rest
    const sk = data.skills['wolf_run']!;
    const was = sk.effect.extraMove;
    sk.effect.extraMove = rest + 5;
    restore.push(() => (sk.effect.extraMove = was));
    expect(applyCommand(data, s, attack(me, foe, [4, 5])).state.pursue?.left).toBe(rest + 5);
  });
});

describe('the enemy AI: hit and run', () => {
  function scene(playerMov: number) {
    const s = arena();
    const me = place(s, 'player', 'vanguard', [4, 5], 'iron_lance');
    me.buffs.push({ source: 't', mov: playerMov, untilTurn: 9, untilPhase: 'player' });
    const foe = place(s, 'enemy', 'brigand', [5, 5], 'iron_axe', 'wolf_run');
    foe.hp = 200;
    me.hp = 200;
    return { s, me, foe };
  }
  const phase = (s: BattleState) => applyCommand(data, s, { type: 'endPhase' });
  /** where the unit stood when it fought, and the walks it made after that */
  function afterFight(events: GameEvent[], uid: string, from: Pos): { fought: Pos; walks: Pos[][] } {
    let fought = from;
    const walks: Pos[][] = [];
    let fighting = false;
    for (const e of events) {
      if (e.t === 'moved' && e.unit === uid) {
        if (fighting) walks.push(e.path);
        else fought = e.path[e.path.length - 1]!;
      }
      if (e.t === 'combat' && e.attacker === uid) fighting = true;
    }
    return { fought, walks };
  }

  it('after its attack it walks to the reachable tile fewest player units threaten', () => {
    const { s, me, foe } = scene(-20);
    // the player's unit cannot walk, so it only threatens the tiles next to it
    expect(moveBudget(data, s, me)).toBeLessThanOrEqual(0);
    const r = phase(s);
    expect(r.events.some((e) => e.t === 'combat' && e.attacker === foe.uid)).toBe(true);
    const { fought, walks } = afterFight(r.events, foe.uid, [5, 5]);
    expect(walks).toHaveLength(1);
    const at = r.state.units.find((u) => u.uid === foe.uid)!.pos!;
    expect(manhattan(at, fought)).toBeLessThanOrEqual(2);
    expect(manhattan(at, [4, 5])).toBeGreaterThan(1); // out of reach of the unit it hit
    // the same state gives the same choice
    expect(phase(s).state.units.find((u) => u.uid === foe.uid)!.pos).toEqual(at);
  });

  it('stays where it is when no tile is safer', () => {
    const { s, foe } = scene(8);
    const r = phase(s);
    expect(r.events.some((e) => e.t === 'combat' && e.attacker === foe.uid)).toBe(true);
    expect(afterFight(r.events, foe.uid, [5, 5]).walks).toEqual([]);
  });

  it('a unit without the skill stays where it fought', () => {
    const { s, foe } = scene(-20);
    foe.mastered = [];
    foe.loadout = [];
    const r = phase(s);
    expect(afterFight(r.events, foe.uid, [5, 5]).walks).toEqual([]);
  });
});

describe('replay and worker', () => {
  it('a battle with wolf-running enemies replays to the same state, also with the enemy phases through the worker', () => {
    const c = newCampaign(data, 11, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    const start = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
    for (const u of start.units) {
      if (u.team !== 'enemy') continue;
      u.mastered.push('wolf_run');
      u.loadout.push('wolf_run');
    }
    const played = autoplay(data, start, 600);
    expect(replayBattle(data, start, played.log)).toEqual(played.state);
    let s = start;
    let id = 1;
    for (const cmd of played.log) {
      if (cmd.type === 'endPhase') {
        const res = structuredClone(handleRequest(data, structuredClone({ id: id++, kind: 'apply' as const, packs: [], state: s, command: cmd })));
        if (!res.ok) throw new Error(res.error);
        s = res.state;
      } else s = applyCommand(data, s, cmd).state;
    }
    expect(s).toEqual(played.state);
  });
});
