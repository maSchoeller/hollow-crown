/** Straßen und Brücken kosten ½ (story 16.1): movement knows half points, and every consumer of the cost (reach, walk, danger, AI, autoplay) agrees. Synthetic arenas. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  autoCommand,
  bestApproach,
  dangerZone,
  minStepCost,
  moveBudget,
  moveCost,
  passivePreview,
  posKey,
  pursueRest,
  reachable,
  runAiPhase,
  walkPath,
  type BattleState,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

const tile = (s: BattleState, at: Pos, id: string) => (s.terrain[at[1] * s.width + at[0]] = id);

/** Everything is wall but row 5 from x=0 to x=`end`: (0,5) is plain, then `ids[x-1]` (the last id goes on). */
function lane(ids: string[], end = 14): BattleState {
  const s = arena(data);
  s.terrain = s.terrain.map(() => 'wall');
  for (let x = 0; x <= end; x++) tile(s, [x, 5], x === 0 ? 'plain' : (ids[x - 1] ?? ids[ids.length - 1]!));
  return s;
}

const row = (n: number, id: string) => Array.from({ length: n }, () => id);
const walker = (s: BattleState, classId = 'skirmisher') => place(data, s, 'player', classId, [0, 5], 'iron_sword');
const along = (to: number): Pos[] => Array.from({ length: to + 1 }, (_, x) => [x, 5] as Pos);

describe('terrain.yaml: halves', () => {
  it('road, bridge and the footbridges cost ½ for every move type; gate, ramp, stairs and floor stay at 1', () => {
    for (const id of ['road', 'bridge', 'boardwalk', 'footbridge', 'rope_bridge']) expect(Object.values(data.terrain[id]!.cost), id).toEqual([0.5, 0.5, 0.5, 0.5, 0.5]);
    for (const id of ['gate', 'ramp', 'plain', 'door_open', 'ash', 'quay']) expect(data.terrain[id]!.cost.foot, id).toBe(1);
    expect(data.terrain.stairs!.cost.foot).toBe(1);
    expect(minStepCost(data)).toBe(0.5);
  });
});

describe('halves in the reach of a unit', () => {
  it('a unit with MOV m walks 2m road tiles', () => {
    const s = lane(row(14, 'road'));
    const u = walker(s, 'vanguard');
    expect(moveBudget(data, s, u)).toBe(4);
    const reach = reachable(data, s, u);
    expect(reach.get(posKey([8, 5]))?.cost).toBe(4);
    expect(reach.get(posKey([7, 5]))?.cost).toBe(3.5);
    expect(reach.has(posKey([9, 5]))).toBe(false);
  });

  it('a spare half point pays for one more road tile, never for a tile that costs 1', () => {
    const s = lane([...row(7, 'road'), 'plain', 'road', 'road']);
    const reach = reachable(data, s, walker(s, 'vanguard'));
    expect(reach.get(posKey([7, 5]))?.cost).toBe(3.5);
    expect(reach.has(posKey([8, 5]))).toBe(false); // plain: 3.5 + 1 > 4
    const s2 = lane(row(8, 'road'));
    expect(reachable(data, s2, walker(s2, 'vanguard')).has(posKey([8, 5]))).toBe(true);
  });

  it('the cost of a step is the half itself, with and without a skill override', () => {
    const s = lane(['road']);
    const u = walker(s);
    expect(moveCost(data, s, u, [1, 5])).toBe(0.5);
    expect(moveCost(data, s, u, [1, 5], { forest: 1 })).toBe(0.5);
  });
});

describe('Restbewegung noch 1½', () => {
  it('a walk of two plain tiles and a road tile costs 2½ and leaves 1½ of MOV 4', () => {
    const s = lane(['plain', 'plain', 'road', 'road']);
    const u = walker(s, 'vanguard');
    const w = walkPath(data, s, u, along(3));
    expect(w?.cost).toBe(2.5);
    expect(moveBudget(data, s, u) - w!.cost).toBe(1.5);
  });

  it('Nachsetzen keeps the half point as the rest after the fight, and the preview shows it', () => {
    const s = lane(['plain', 'plain', 'road', 'road']);
    const u = walker(s); // skirmisher: pursue
    const mov = moveBudget(data, s, u);
    expect(pursueRest(data, s, u, [3, 5])).toBe(mov - 2.5);
    expect(passivePreview(data, s, u, [3, 5])).toEqual({ kind: 'pursue', left: mov - 2.5 });
  });

  it('the move command stores half points as spent movement', () => {
    const s = lane(['road', 'road', 'road']);
    const u = walker(s, 'vanguard');
    const r = applyCommand(data, s, { type: 'act', unit: u.uid, to: [3, 5], path: along(3), action: { kind: 'wait' } });
    expect(r.state.units.find((x) => x.uid === u.uid)!.moveSpent).toBe(1.5);
  });
});

describe('walkPath (planned way)', () => {
  it('accepts 2m road tiles and refuses one more', () => {
    const s = lane(row(14, 'road'));
    const u = walker(s, 'vanguard');
    expect(walkPath(data, s, u, along(8))?.cost).toBe(4);
    expect(walkPath(data, s, u, along(9))).toBeNull();
  });
});

describe('danger zone', () => {
  it('a foe on the road threatens 2m road tiles plus its reach', () => {
    const s = lane(row(14, 'road'));
    const foe = place(data, s, 'enemy', 'vanguard', [0, 5], 'iron_lance');
    foe.ai = { profile: 'aggressive' };
    const zone = dangerZone(data, s, 'player');
    expect(zone.has('9,5')).toBe(true); // MOV 4 = 8 road tiles, then the blow reaches one more
    expect(zone.has('10,5')).toBe(false);
  });
});

describe('enemy AI', () => {
  /**
   * Two ways to the goal (8,5): the plain row 5 (8 tiles) and a road loop over row 7 (12 road tiles = 6). The goal field counts halves,
   * so the loop is the shorter way and the walker takes it; with whole points it was longer.
   */
  function fork(): BattleState {
    const s = arena(data);
    s.terrain = s.terrain.map(() => 'wall');
    for (let x = 0; x <= 8; x++) tile(s, [x, 5], 'plain');
    tile(s, [0, 6], 'road');
    for (let x = 0; x <= 8; x++) tile(s, [x, 7], 'road');
    tile(s, [8, 6], 'road');
    return s;
  }

  it('the approach follows the cheaper way over the road', () => {
    const s = fork();
    const u = place(data, s, 'enemy', 'skirmisher', [0, 5], 'iron_sword');
    const to = bestApproach(data, s, u, [[8, 5]]);
    expect(to).toEqual([8, 6]); // 5½ of MOV 6 over the road, beside the goal; the plain row would end at (6,5)
  });

  it('the AI phase walks eight road tiles in one turn', () => {
    const s = lane(row(14, 'road'));
    const foe = place(data, s, 'enemy', 'vanguard', [0, 5], 'iron_lance');
    foe.ai = { profile: 'aggressive' };
    place(data, s, 'player', 'skirmisher', [14, 5], 'iron_sword');
    const events: GameEvent[] = [];
    runAiPhase(data, s, 'enemy', events);
    expect(s.units.find((x) => x.uid === foe.uid)!.pos).toEqual([8, 5]);
  });
});

describe('autoplay', () => {
  it('the auto player takes the cheaper road loop (goal field in halves)', () => {
    const s = arena(data);
    s.terrain = s.terrain.map(() => 'wall');
    for (let x = 0; x <= 12; x++) tile(s, [x, 5], 'plain');
    tile(s, [0, 6], 'road');
    for (let x = 0; x <= 12; x++) tile(s, [x, 7], 'road');
    tile(s, [12, 6], 'road');
    const u = walker(s, 'vanguard');
    const foe = place(data, s, 'enemy', 'skirmisher', [12, 5], 'iron_sword');
    foe.ai = { profile: 'hold' };
    const cmd = autoCommand(data, s) as { to: Pos };
    expect(u.pos).toEqual([0, 5]);
    expect(cmd.to[1]).toBe(7);
  });
});
