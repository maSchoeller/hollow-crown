/** Autoplay on a treasure hunt: locks and keys are shared out by the way around walls, idle units walk on without blocking a lock. Synthetic arenas, no content maps. */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCommand, autoCommand, newItem, treasurePlan, type BattleState, type GameData, type MapDef, type Pos } from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
const restore: Array<() => void> = [];

beforeAll(() => {
  data = loadContentFromDisk().data;
});

afterEach(() => {
  while (restore.length) restore.pop()!();
});

function victory(s: BattleState, v: MapDef['objectives']['victory']): void {
  const map = data.maps[s.mapId]!;
  const was = map.objectives.victory;
  map.objectives.victory = v;
  restore.push(() => (map.objectives.victory = was));
}

function setTerrain(s: BattleState, at: Pos, id: string): void {
  s.terrain[at[1] * s.width + at[0]] = id;
}

/** Two chests in an arena; a wall across column 6 (rows 0-11) with a gap at the south end makes the east chest a long walk from the west. */
function hunt(): BattleState {
  const s = arena(data);
  victory(s, { type: 'treasure', chests: ['west', 'east'], turns: 12 });
  for (let y = 0; y < 12; y++) setTerrain(s, [6, y], 'wall');
  s.objects.push({ id: 'west', type: 'chest', at: [2, 2], state: 'closed' }, { id: 'east', type: 'chest', at: [10, 2], state: 'closed' });
  return s;
}

describe('treasurePlan', () => {
  it('gives each key carrier the lock closest by foot, not by straight line', () => {
    const s = hunt();
    // a stands just behind the wall next to the east chest side, b on the west side: by straight line a is nearer to "west"
    const a = place(data, s, 'player', 'vanguard', [7, 2], 'iron_lance');
    const b = place(data, s, 'player', 'vanguard', [5, 2], 'iron_lance');
    a.bag.push(newItem(s, 'door_key', data));
    b.bag.push(newItem(s, 'door_key', data));
    const plan = treasurePlan(data, s, new Set(['west', 'east']));
    expect(plan.lock.get(a.uid)).toEqual([10, 2]);
    expect(plan.lock.get(b.uid)).toEqual([2, 2]);
  });

  it('does not give two carriers the same lock while another one is free', () => {
    const s = hunt();
    const a = place(data, s, 'player', 'vanguard', [1, 1], 'iron_lance');
    const b = place(data, s, 'player', 'vanguard', [3, 1], 'iron_lance');
    a.bag.push(newItem(s, 'door_key', data));
    b.bag.push(newItem(s, 'door_key', data));
    const plan = treasurePlan(data, s, new Set(['west', 'east']));
    expect(plan.lock.get(a.uid)).not.toEqual(plan.lock.get(b.uid));
  });

  it('sends a key on the ground to the unit with room that is closest by foot', () => {
    const s = hunt();
    const near = place(data, s, 'player', 'vanguard', [7, 3], 'iron_lance'); // straight-line close, behind the wall
    const far = place(data, s, 'player', 'vanguard', [3, 5], 'iron_lance');
    const full = place(data, s, 'player', 'vanguard', [5, 3], 'iron_lance');
    for (let i = 0; i < data.balance.bag.size; i++) full.bag.push(newItem(s, 'vulnerary', data));
    s.loot.push({ at: [5, 4], item: newItem(s, 'door_key', data) });
    const plan = treasurePlan(data, s, new Set(['west', 'east']));
    expect(plan.loot.get(far.uid)).toEqual([5, 4]);
    expect(plan.loot.has(near.uid)).toBe(false);
    expect(plan.loot.has(full.uid)).toBe(false);
  });
});

describe('autoplay on a treasure hunt', () => {
  it('walks on towards the locks when no foe is left, without ending next to a lock', () => {
    const s = hunt();
    const u = place(data, s, 'player', 'vanguard', [1, 10], 'iron_lance');
    const cmd = autoCommand(data, s);
    expect(cmd.type).toBe('act');
    const end = applyCommand(data, s, cmd).state;
    const at = end.units.find((x) => x.uid === u.uid)!.pos!;
    expect(at).not.toEqual([1, 10]);
    for (const o of end.objects) expect(Math.abs(at[0] - o.at[0]) + Math.abs(at[1] - o.at[1])).toBeGreaterThan(1);
  });

  it('puts spare gear into the convoy when the bag is full and the convoy is at hand', () => {
    const s = hunt();
    const kael = place(data, s, 'player', 'vanguard', [1, 10], 'iron_lance');
    kael.flags.push('convoyAccess');
    kael.bag.push(newItem(s, 'iron_sword', data), newItem(s, 'vulnerary', data), newItem(s, 'vulnerary', data));
    const cmd = autoCommand(data, s);
    expect(cmd).toMatchObject({ type: 'convoy', unit: kael.uid, put: kael.bag[0]!.uid });
    expect(applyCommand(data, s, cmd).state.units.find((x) => x.uid === kael.uid)!.bag).toHaveLength(2);
  });
});
