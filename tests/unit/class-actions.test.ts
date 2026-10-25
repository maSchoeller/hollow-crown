/** Class actions Zielen, Fernbergen and Anfeuern (story 2.3, GDD Rollenklassen). Built on fixtures: no PoC map has a Spielmann. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  availableActions,
  beginBattle,
  classPreview,
  computeStats,
  endOfPhase,
  forecast,
  getUnit,
  knockOut,
  newCampaign,
  newItem,
  reachable,
  validate,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';

let data: GameData;

/** Prologue state with every unit removed from the map except the ones a test places itself. */
function arena(): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  for (const u of s.units) u.pos = null;
  s.units.forEach((u) => (u.gone = 'retreated'));
  s.outcome = null;
  s.lockedRoles = []; // the tests place roles the prologue company has not brought along yet (story 4.3)
  return s;
}

/** Places one of the state's units on the grid as `classId`, optionally with a weapon. */
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
  u.hp = computeStats(data, u).maxHp;
  if (weapon) u.equip.mainHand = newItem(s, weapon, data);
  return u;
}

/** Row y with `n` open plains/forest tiles from x0 on, so range checks do not depend on the map. */
function flatRow(s: BattleState, n: number): { x0: number; y: number } {
  for (let y = 0; y < s.height; y++)
    for (let x0 = 0; x0 + n <= s.width; x0++) {
      let ok = true;
      for (let i = 0; i < n; i++) if (data.terrain[s.terrain[y * s.width + x0 + i]!]?.cost.foot !== 1) ok = false;
      if (ok) return { x0, y };
    }
  throw new Error('no flat row');
}

const act = (s: BattleState, cmd: Command) => applyCommand(data, s, cmd);

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('class action numbers come from balance.yaml', () => {
  it('has Zielen +1 range/+15 hit, Fernbergen 2 tiles, Anfeuern +1 MOV/+10 hit (GDD)', () => {
    expect(data.balance.classActions).toEqual({ aim: { rangeBonus: 1, hit: 15 }, farRescue: { range: 2 }, cheer: { mov: 1, hit: 10 }, hold: { detourMax: 2 }, cast: { waterRadius: 1, fogDuration: 2 } });
  });
  it('binds the actions to the right roles', () => {
    expect(data.classes.marksman!.classAction?.id).toBe('aim');
    expect(data.classes.healer!.classAction?.id).toBe('far_rescue');
    expect(data.classes.minstrel!.classAction?.id).toBe('inspire');
  });
});

describe('Zielen (Schütze)', () => {
  // Marksman at x0, foe 3 tiles away: out of the iron bow's range 2, inside range 3 with Zielen
  function scene() {
    const s = arena();
    const { x0, y } = flatRow(s, 5);
    const m = place(s, 'player', 'marksman', [x0, y], 'iron_bow');
    const foe = place(s, 'enemy', 'brigand', [x0 + 3, y]);
    return { s, m, foe, x0, y };
  }

  it('offers aim only to a marksman that has not moved and reaches +1 range', () => {
    const { s, m, foe } = scene();
    const opts = availableActions(data, s, m, m.pos!);
    expect(opts.find((o) => o.kind === 'attack')).toBeUndefined();
    const aim = opts.find((o) => o.kind === 'aim');
    expect(aim?.targets).toEqual([foe.uid]);
    m.moved = true;
    expect(availableActions(data, s, m, m.pos!).find((o) => o.kind === 'aim')).toBeUndefined();
  });

  it('is not offered from another tile (it replaces the movement, not the action)', () => {
    const { s, m, x0, y } = scene();
    expect(availableActions(data, s, m, [x0 + 1, y]).find((o) => o.kind === 'aim')).toBeUndefined();
  });

  it('is not offered to other roles', () => {
    const { s, m, foe } = scene();
    m.classId = 'skirmisher';
    expect(availableActions(data, s, m, m.pos!).find((o) => o.kind === 'aim')).toBeUndefined();
    expect(foe).toBeDefined();
  });

  it('adds exactly the aim hit bonus to the forecast, and the preview shows both numbers', () => {
    const { s, m, foe } = scene();
    foe.pos = [m.pos![0] + 2, m.pos![1]];
    const plain = forecast(data, s, m.uid, foe.uid);
    const aimed = classPreview(data, s, m, m.pos!, { kind: 'aim', target: foe.uid });
    expect(aimed?.kind).toBe('aim');
    if (aimed?.kind !== 'aim') return;
    expect(aimed.hit).toBe(15);
    expect(aimed.rangeBonus).toBe(1);
    expect(aimed.forecast.attacker.hit).toBe(Math.min(100, plain.attacker.hit + 15));
    expect(aimed.forecast.attacker.damage).toBe(plain.attacker.damage);
  });

  it('resolves with the previewed hit chance and replaces the turn action', () => {
    const { s, m, foe } = scene();
    const pre = classPreview(data, s, m, m.pos!, { kind: 'aim', target: foe.uid });
    const { state, events } = act(s, { type: 'act', unit: m.uid, to: m.pos!, action: { kind: 'aim', target: foe.uid } });
    expect(events.find((e) => e.t === 'classAction')).toEqual({ t: 'classAction', unit: m.uid, action: 'aim', target: foe.uid });
    expect(events.some((e) => e.t === 'strike' && e.attacker === m.uid)).toBe(true);
    expect(getUnit(state, m.uid).acted).toBe(true);
    expect(pre?.kind === 'aim' && pre.forecast.attacker.hit).toBeGreaterThan(0);
  });

  it('rejects aiming after a move or at a target out of the extended range', () => {
    const { s, m, foe } = scene();
    foe.pos = [m.pos![0] + 4, m.pos![1]];
    expect(validate(data, s, { type: 'act', unit: m.uid, to: m.pos!, action: { kind: 'aim', target: foe.uid } })).toBe('not_allowed');
    foe.pos = [m.pos![0] + 3, m.pos![1]];
    const stepped = { ...m, pos: [m.pos![0] + 1, m.pos![1]] as Pos };
    expect(stepped.pos).toBeDefined();
    expect(validate(data, s, { type: 'act', unit: m.uid, to: [m.pos![0] + 1, m.pos![1]], action: { kind: 'aim', target: foe.uid } })).toBe('not_allowed');
  });

  it('is replay-safe: the same commands give the same state', () => {
    const { s, m, foe } = scene();
    const cmd: Command = { type: 'act', unit: m.uid, to: m.pos!, action: { kind: 'aim', target: foe.uid } };
    const a = act(structuredClone(s), cmd);
    const b = act(structuredClone(s), cmd);
    expect(a.state).toEqual(b.state);
    expect(a.events).toEqual(b.events);
    expect(JSON.parse(JSON.stringify(a.state))).toEqual(a.state);
  });
});

describe('Fernbergen (Heiler)', () => {
  function scene(gap: number) {
    const s = arena();
    const { x0, y } = flatRow(s, 5);
    const h = place(s, 'player', 'healer', [x0, y], 'heal_staff');
    const down = place(s, 'player', 'vanguard', [x0 + gap, y]);
    const events: GameEvent[] = [];
    down.hp = 0;
    knockOut(data, s, down, events);
    s.outcome = null;
    return { s, h, down, x0, y };
  }

  it('rescues a downed ally 2 tiles away like normal Bergen', () => {
    const { s, h, down } = scene(2);
    expect(down.downed).toBe(true);
    const opt = availableActions(data, s, h, h.pos!).find((o) => o.kind === 'farRescue');
    expect(opt?.targets).toEqual([down.uid]);
    // plain Bergen needs adjacency
    expect(availableActions(data, s, h, h.pos!).find((o) => o.kind === 'rescue')).toBeUndefined();
    const { state, events } = act(s, { type: 'act', unit: h.uid, to: h.pos!, action: { kind: 'farRescue', target: down.uid } });
    const t = getUnit(state, down.uid);
    expect(t.gone).toBe('rescued');
    expect(t.downed).toBe(false);
    expect(events).toContainEqual({ t: 'rescued', unit: down.uid, by: h.uid });
    expect(getUnit(state, h.uid).acted).toBe(true);
    // same effects as adjacent Bergen: EXP for the rescuer
    expect(events.some((e) => e.t === 'exp' && e.unit === h.uid)).toBe(true);
  });

  it('an adjacent downed ally is rescued by normal Bergen, not Fernbergen', () => {
    const { s, h, down } = scene(1);
    expect(availableActions(data, s, h, h.pos!).find((o) => o.kind === 'farRescue')).toBeUndefined();
    expect(availableActions(data, s, h, h.pos!).find((o) => o.kind === 'rescue')?.targets).toEqual([down.uid]);
  });

  it('does not reach 3 tiles, but can move first and then rescue', () => {
    const { s, h, down, x0, y } = scene(3);
    expect(availableActions(data, s, h, h.pos!).find((o) => o.kind === 'farRescue')).toBeUndefined();
    const to: Pos = [x0 + 1, y];
    expect(availableActions(data, s, h, to).find((o) => o.kind === 'farRescue')?.targets).toEqual([down.uid]);
    expect(reachable(data, s, h).has(`${to[0]},${to[1]}`)).toBe(true);
    const { state } = act(s, { type: 'act', unit: h.uid, to, action: { kind: 'farRescue', target: down.uid } });
    expect(getUnit(state, down.uid).gone).toBe('rescued');
  });

  it('is only for healers and only for downed allies', () => {
    const { s, h, down } = scene(2);
    h.classId = 'vanguard';
    expect(availableActions(data, s, h, h.pos!).find((o) => o.kind === 'farRescue')).toBeUndefined();
    h.classId = 'healer';
    down.downed = false;
    expect(availableActions(data, s, h, h.pos!).find((o) => o.kind === 'farRescue')).toBeUndefined();
  });

  it('previews the target and distance', () => {
    const { s, h, down } = scene(2);
    expect(classPreview(data, s, h, h.pos!, { kind: 'farRescue', target: down.uid })).toEqual({ kind: 'farRescue', target: down.uid, distance: 2 });
  });
});

describe('Anfeuern (Spielmann)', () => {
  function scene() {
    const s = arena();
    const { x0, y } = flatRow(s, 5);
    const bard = place(s, 'player', 'minstrel', [x0, y]);
    const ally = place(s, 'player', 'skirmisher', [x0 + 1, y], 'iron_sword');
    return { s, bard, ally, x0, y };
  }

  it('gives an adjacent ally +1 MOV and +10 hit until the end of the turn', () => {
    const { s, bard, ally } = scene();
    const before = computeStats(data, ally);
    const reachBefore = reachable(data, s, ally).size;
    expect(availableActions(data, s, bard, bard.pos!).find((o) => o.kind === 'cheer')?.targets).toEqual([ally.uid]);
    const { state, events } = act(s, { type: 'act', unit: bard.uid, to: bard.pos!, action: { kind: 'cheer', target: ally.uid } });
    const t = getUnit(state, ally.uid);
    const after = computeStats(data, t);
    expect(after.mov).toBe(before.mov + 1);
    expect(after.hit).toBe(before.hit + 10);
    expect(reachable(data, state, t).size).toBeGreaterThan(reachBefore);
    expect(events).toContainEqual({ t: 'classAction', unit: bard.uid, action: 'cheer', target: ally.uid });
    expect(getUnit(state, bard.uid).acted).toBe(true);
    expect(t.acted).toBe(false);
    // the bonus is in the combat forecast, too
    const foe = place(state, 'enemy', 'brigand', [t.pos![0] + 1, t.pos![1]]);
    const withBuff = forecast(data, state, t.uid, foe.uid).attacker.hit;
    t.buffs = [];
    expect(withBuff).toBe(Math.min(100, forecast(data, state, t.uid, foe.uid).attacker.hit + 10));
  });

  it('ends with the player phase', () => {
    const { s, bard, ally } = scene();
    const { state } = act(s, { type: 'act', unit: bard.uid, to: bard.pos!, action: { kind: 'cheer', target: ally.uid } });
    expect(getUnit(state, ally.uid).buffs.length).toBe(1);
    endOfPhase(state, 'player', []);
    expect(getUnit(state, ally.uid).buffs.length).toBe(0);
  });

  it('needs an adjacent ally that has not acted, and does not stack on the same ally', () => {
    const { s, bard, ally, x0, y } = scene();
    ally.acted = true;
    expect(availableActions(data, s, bard, bard.pos!).find((o) => o.kind === 'cheer')).toBeUndefined();
    ally.acted = false;
    expect(availableActions(data, s, bard, [x0 + 3, y]).find((o) => o.kind === 'cheer')).toBeUndefined();
    const { state } = act(s, { type: 'act', unit: bard.uid, to: bard.pos!, action: { kind: 'cheer', target: ally.uid } });
    const bard2 = place(state, 'player', 'minstrel', [x0 + 2, y]);
    expect(availableActions(data, state, bard2, bard2.pos!).find((o) => o.kind === 'cheer')).toBeUndefined();
  });

  it('previews the bonus and can be used after moving next to the ally', () => {
    const { s, bard, ally, x0, y } = scene();
    expect(classPreview(data, s, bard, bard.pos!, { kind: 'cheer', target: ally.uid })).toEqual({ kind: 'cheer', target: ally.uid, mov: 1, hit: 10 });
    bard.pos = [x0 + 3, y];
    const to: Pos = [x0 + 2, y];
    expect(availableActions(data, s, bard, to).find((o) => o.kind === 'cheer')?.targets).toEqual([ally.uid]);
    expect(validate(data, s, { type: 'act', unit: bard.uid, to, action: { kind: 'cheer', target: ally.uid } })).toBeNull();
  });
});
