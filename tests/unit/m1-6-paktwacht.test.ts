/** Mission 1-6 on the Pactwatch: levels and wall walks, the closed castle gate and its lever, archers above the bottlenecks. E4 and the node: tests/unit/m1-6-e4.test.ts. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { addToRoster, applyCommand, autoplay, availableActions, canStrike, createBattle, levelAt, newCampaign, reachable, stateHash, type BattleState, type Command, type GameData, type GameEvent, type CampaignState } from '../../src/core';

let data: GameData;
const MAP = 'm1_6_paktwacht';

const fresh = (difficulty: 'easy' | 'normal' | 'hard' = 'normal'): CampaignState => {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  for (const id of ['fenn', 'mira', 'liora', 'ysolde']) addToRoster(data, c, id);
  return c;
};
const battle = (difficulty: 'easy' | 'normal' | 'hard' = 'normal'): BattleState => {
  const c = fresh(difficulty);
  return createBattle(data, c, 'm1_6', c.roster.map((r) => r.id));
};
const unit = (s: BattleState, id: string) => s.units.find((u) => u.id === id)!;
const ter = (s: BattleState, x: number, y: number) => s.terrain[y * s.width + x];
const put = (s: BattleState, id: string, at: [number, number]) => {
  const u = unit(s, id);
  u.pos = at;
  u.acted = false;
  u.moved = false;
  return u;
};
const clearFoes = (s: BattleState) => {
  for (const u of s.units) if (u.team === 'enemy') Object.assign(u, { gone: 'dead', pos: null });
};

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map m1_6_paktwacht', () => {
  it('is the large map of the act: 30 × 40, 12 places, seize the throne, Hask and Ulvric, 28 / 31 / 43 foes, never haunted', () => {
    // balancing 2026-11-05: normal without the two wolf riders at the forest edge, hard with three strong wolves in the turn-5 wave
    const m = data.maps[MAP]!;
    expect(m.size).toEqual([30, 40]);
    expect(m.deploy.max).toBe(12);
    expect(m.objectives.victory).toEqual({ type: 'seize', area: { rect: [15, 5, 15, 5] } });
    const all = [...m.units, ...m.reinforcements.flatMap((r) => r.units)].filter((u) => u.team === 'enemy');
    const count = (d: 'easy' | 'normal' | 'hard') => all.filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
    expect([count('easy'), count('normal'), count('hard')]).toEqual([28, 31, 43]);
    expect(all.filter((u) => u.lieutenant).map((u) => u.lieutenant).sort()).toEqual(['hask', 'ulvric']);
    expect([m.noHaunts, m.haunts]).toEqual([true, undefined]);
  });

  it('has the levels the owner set: fields 0, terraces and courtyards 1, wall walks and corner towers 2', () => {
    const s = battle();
    const at = (x: number, y: number) => levelAt(data, s, [x, y]);
    expect([at(15, 35), at(15, 26), at(15, 25), at(15, 24), at(15, 20), at(15, 15), at(15, 8), at(15, 5), at(5, 2)]).toEqual([0, 0, 0, 1, 1, 1, 1, 1, 1]);
    expect([at(12, 18), at(17, 18), at(8, 18), at(21, 18), at(11, 12), at(18, 12)]).toEqual([2, 2, 2, 2, 2, 2]);
    expect(ter(s, 12, 18)).toBe('rampart');
    expect(ter(s, 8, 18)).toBe('tower_top');
    for (const [x, y] of [[9, 16], [20, 16], [7, 10], [17, 13]] as const) expect(ter(s, x, y)).toBe('stairs');
  });

  it('goes up from the fields only over the middle ramp, the ramp in the east wood and the stairs of the goat path', () => {
    const s = battle();
    const way = [[14, 25], [15, 25], [25, 25], [28, 25]] as const;
    expect(way.map(([x, y]) => ter(s, x, y))).toEqual(['ramp', 'ramp', 'ramp', 'stairs']);
    clearFoes(s);
    const u = put(s, 'kael', [10, 26]);
    expect([...reachable(data, s, u, [10, 26], 3).keys()]).not.toContain('10,25');
    const up = reachable(data, s, u, [15, 26], 2);
    expect([...up.keys()]).toContain('15,24');
  });

  it('keeps the wall walks to their stairs: no melee from the yard, one step up the stairs', () => {
    const s = battle();
    clearFoes(s);
    const u = put(s, 'kael', [10, 16]);
    const walk = [...reachable(data, s, u, [10, 16], 4).keys()];
    expect(walk).toContain('9,16'); // the stairs
    expect(walk).toContain('8,16'); // the wall walk
    expect(walk).toContain('8,18'); // the corner tower
    expect([...reachable(data, s, u, [12, 17], 3).keys()]).not.toContain('12,18');
    expect(canStrike(data, s, u, [12, 17], [12, 18], [1, 1])).toBe(false);
    expect(canStrike(data, s, u, [9, 16], [8, 16], [1, 1])).toBe(true);
  });

  it('puts archers on the walls and over the ramp, where they reach one tile further', () => {
    const m = data.maps[MAP]!;
    const archers = m.units.filter((u) => u.class === 'marksman' && u.ai?.profile === 'hold').map((u) => u.at);
    for (const p of [[12, 18], [17, 18], [8, 18], [21, 18], [11, 12], [18, 12], [17, 24]]) expect(archers).toContainEqual(p);
  });
});

describe('the castle gate', () => {
  const ready = () => {
    const s = battle();
    clearFoes(s);
    return s;
  };

  it('is closed, the outer gate and the east postern stand open', () => {
    const s = ready();
    expect([ter(s, 14, 12), ter(s, 15, 12)]).toEqual(['gate_closed', 'gate_closed']);
    expect([ter(s, 14, 18), ter(s, 15, 18), ter(s, 21, 15)]).toEqual(['gate', 'gate', 'gate']);
    const u = put(s, 'kael', [15, 13]);
    expect([...reachable(data, s, u, [15, 13], 40).keys()]).not.toContain('15,11');
  });

  it('the lever is reached only over the wall walk, never from the yard below it', () => {
    const s = ready();
    const u = put(s, 'kael', [19, 13]);
    expect(availableActions(data, s, u, [19, 13]).some((a) => a.kind === 'lever')).toBe(false);
    expect(ter(s, 20, 13)).toBe('wall');
    expect(availableActions(data, s, u, [19, 12]).some((a) => a.kind === 'lever' && a.object === 'l_gate')).toBe(true);
    expect([...reachable(data, s, u, [19, 13], 8).keys()]).toContain('19,12');
  });

  it('pulling it opens both wings and plays the line; a foe cannot pull it', () => {
    const s = ready();
    const u = put(s, 'kael', [19, 12]);
    const r = applyCommand(data, s, { type: 'act', unit: u.uid, to: [19, 12], action: { kind: 'lever', object: 'l_gate' } });
    expect([ter(r.state, 14, 12), ter(r.state, 15, 12)]).toEqual(['gate', 'gate']);
    expect(r.events).toContainEqual({ t: 'dialogue', id: 'scn.m1_6.gate' });
    const k = unit(r.state, 'kael');
    expect([...reachable(data, r.state, k, [15, 13], 3).keys()]).toContain('15,11');
    expect(levelAt(data, r.state, [15, 12])).toBe(1);
  });

  it('a scout opens it without the lever and without a key', () => {
    const s = ready();
    const u = put(s, 'fenn', [14, 13]);
    expect(availableActions(data, s, u, [14, 13]).some((a) => a.kind === 'open' && a.object === 'gate_w')).toBe(true);
  });

  it('the simulator player takes the way over the lever and seizes the throne', { timeout: 120000 }, () => {
    const c = fresh();
    for (const u of c.roster) u.level = Math.max(u.level, 12);
    const s = createBattle(data, c, 'm1_6', c.roster.map((r) => r.id));
    clearFoes(s);
    const played = autoplay(data, s, 600);
    expect(played.state.outcome).toBe('victory');
    expect(played.log.some((cmd) => cmd.type === 'act' && cmd.action.kind === 'lever')).toBe(true);
  });
});

describe('Hask withdraws through the east postern (product owner 2026-11-06)', () => {
  /** Only Hask is left; he is brought below the threshold, a player figure waits (the trigger runs after an action), then phases end until he is gone. */
  const flight = () => {
    const start = battle();
    for (const u of start.units) if (u.team === 'enemy' && u.id !== 'hask') Object.assign(u, { gone: 'dead', pos: null });
    const hask = unit(start, 'hask');
    hask.hp = Math.floor(hask.stats.hp * 0.3);
    const waiter = start.units.find((u) => u.team === 'player' && u.pos)!;
    const log: Command[] = [{ type: 'act', unit: waiter.uid, to: waiter.pos!, action: { kind: 'wait' } }];
    let s = start;
    const events: GameEvent[] = [];
    const path: Array<[number, number]> = [];
    for (let i = 0; i < 12 && !unit(s, 'hask').gone; i++) {
      const r = applyCommand(data, s, log[log.length - 1]!);
      s = r.state;
      events.push(...r.events);
      const at = unit(s, 'hask').pos;
      if (at) path.push([...at]);
      log.push({ type: 'endPhase' });
    }
    return { start, s, events, path, log: log.slice(0, -1) };
  };

  it('below 40 % HP he calls the retreat, walks to the postern and leaves there as driven off', () => {
    const { s, events, path } = flight();
    expect(events).toContainEqual({ t: 'dialogue', id: 'scn.m1_6.hask_flight' });
    expect(unit(s, 'hask').gone).toBe('fled');
    expect(events.some((e) => e.t === 'fled' && e.unit === unit(s, 'hask').uid)).toBe(true);
    expect(path.length).toBeGreaterThan(1);
    expect(path.at(-1)).toEqual([21, 15]);
    // he walks, he does not vanish where he stood: more than one tile on the way
    expect(new Set(path.map((p) => p.join(','))).size).toBeGreaterThan(1);
  });

  it('above the threshold nothing happens', () => {
    const s = battle();
    const waiter = s.units.find((u) => u.team === 'player' && u.pos)!;
    const r = applyCommand(data, s, { type: 'act', unit: waiter.uid, to: waiter.pos!, action: { kind: 'wait' } });
    expect(r.events).not.toContainEqual({ t: 'dialogue', id: 'scn.m1_6.hask_flight' });
    expect(unit(r.state, 'hask').ai?.profile).toBe('guard');
  });

  it('replays to the same state from start and command log', () => {
    const a = flight();
    let s = a.start;
    for (const cmd of a.log) s = applyCommand(data, s, cmd).state;
    expect(stateHash(s)).toBe(stateHash(a.s));
    expect(stateHash(flight().s)).toBe(stateHash(a.s));
  });
});
