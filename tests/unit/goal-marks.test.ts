/** Goal marking: the places a side objective points at, and the toggle with its timeout (HUD tap on a side objective). */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { beginBattle, newCampaign, sideObjectiveSpots, type BattleState, type GameData, type MapDef, type SideObjectiveDef } from '../../src/core';
import { clearGoalMark, goalMarkTiles, markedGoal, toggleGoalMark } from '../../src/app/state/goalMarks';

let data: GameData;
let s: BattleState;
beforeAll(() => {
  data = loadContentFromDisk().data;
});
beforeEach(() => {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  s = beginBattle(data, c, 'm1_1', c.roster.map((u) => u.id)).state;
});
afterEach(() => {
  clearGoalMark();
  vi.useRealTimers();
});

const side = (over: Partial<SideObjectiveDef> & Pick<SideObjectiveDef, 'type'>): SideObjectiveDef => ({ id: 'x', reward: {}, ...over });
const key = (p: readonly [number, number]) => `${p[0]},${p[1]}`;

describe('sideObjectiveSpots', () => {
  it('visit_villages: the houses not visited yet', () => {
    const o = side({ type: 'visit_villages' });
    const houses = s.objects.filter((x) => x.type === 'village');
    expect(houses.length).toBeGreaterThan(1);
    expect(sideObjectiveSpots(data, s, o).map(key).sort()).toEqual(houses.map((h) => key(h.at)).sort());
    houses[0]!.state = 'visited';
    s.stats.villagesVisited.push(houses[0]!.id);
    expect(sideObjectiveSpots(data, s, o).map(key)).not.toContain(key(houses[0]!.at));
    expect(sideObjectiveSpots(data, s, o)).toHaveLength(houses.length - 1);
  });

  it('a razed house is no place any more, a finished objective has none', () => {
    const o = side({ type: 'visit_villages' });
    const houses = s.objects.filter((x) => x.type === 'village');
    houses[0]!.state = 'razed';
    expect(sideObjectiveSpots(data, s, o)).toHaveLength(houses.length - 1);
    for (const h of houses) s.stats.villagesVisited.push(h.id);
    expect(sideObjectiveSpots(data, s, o)).toEqual([]);
  });

  it('open_chests: the closed chests', () => {
    const map = data.maps[s.mapId]!;
    const chests: MapDef['objects'] = [{ id: 'c1', type: 'chest', at: [3, 3] }, { id: 'c2', type: 'chest', at: [4, 4] }];
    const d = { ...data, maps: { ...data.maps, [s.mapId]: { ...map, objects: [...map.objects, ...chests] } } };
    s.objects.push({ id: 'c1', type: 'chest', at: [3, 3], state: 'closed' }, { id: 'c2', type: 'chest', at: [4, 4], state: 'open' });
    s.stats.chestsOpened.push('c2');
    expect(sideObjectiveSpots(d, s, side({ type: 'open_chests' }))).toEqual([[3, 3]]);
  });

  it('recruit and protect_npc: the unit where it stands, nothing once it is gone or recruited', () => {
    const u = s.units.find((x) => x.team === 'player' && x.pos)!;
    expect(sideObjectiveSpots(data, s, side({ type: 'protect_npc', unit: u.uid }))).toEqual([u.pos]);
    const foe = s.units.find((x) => x.team === 'enemy' && x.pos)!;
    expect(sideObjectiveSpots(data, s, side({ type: 'recruit', unit: foe.uid }))).toEqual([foe.pos]);
    s.stats.recruited.push(foe.uid);
    expect(sideObjectiveSpots(data, s, side({ type: 'recruit', unit: foe.uid }))).toEqual([]);
    foe.gone = 'dead';
    expect(sideObjectiveSpots(data, s, side({ type: 'recruit', unit: foe.uid }))).toEqual([]);
    expect(sideObjectiveSpots(data, s, side({ type: 'protect_npc', unit: 'nobody' }))).toEqual([]);
  });

  it('objectives without a place have none', () => {
    expect(sideObjectiveSpots(data, s, side({ type: 'no_downs' }))).toEqual([]);
    expect(sideObjectiveSpots(data, s, side({ type: 'turn_limit', turns: 9 }))).toEqual([]);
  });

  it('mission 1-1 marks its four houses', () => {
    const sides = data.maps[s.mapId]!.objectives.side;
    const o = sides.find((x) => x.type === 'visit_villages')!;
    expect(sideObjectiveSpots(data, s, o)).toHaveLength(4);
    expect(goalMarkTiles(data, s, sides, o.id)).toHaveLength(4);
    expect(goalMarkTiles(data, s, sides, null)).toEqual([]);
    expect(goalMarkTiles(data, s, sides, 'unknown')).toEqual([]);
  });
});

describe('toggleGoalMark', () => {
  it('a tap marks, a second tap on the same objective takes it away', () => {
    expect(toggleGoalMark('a', 4000)).toBe(true);
    expect(markedGoal.value).toBe('a');
    expect(toggleGoalMark('a', 4000)).toBe(false);
    expect(markedGoal.value).toBeNull();
  });

  it('goes away by itself after the time from render.yaml', () => {
    vi.useFakeTimers();
    expect(data.render.board.markMs).toBeGreaterThan(0);
    toggleGoalMark('a', data.render.board.markMs);
    vi.advanceTimersByTime(data.render.board.markMs - 1);
    expect(markedGoal.value).toBe('a');
    vi.advanceTimersByTime(1);
    expect(markedGoal.value).toBeNull();
  });

  it('another objective takes over and restarts the time', () => {
    vi.useFakeTimers();
    toggleGoalMark('a', 1000);
    vi.advanceTimersByTime(800);
    toggleGoalMark('b', 1000);
    expect(markedGoal.value).toBe('b');
    vi.advanceTimersByTime(800);
    expect(markedGoal.value).toBe('b');
    vi.advanceTimersByTime(200);
    expect(markedGoal.value).toBeNull();
  });

  it('clear stops the old timer, so a new marking is not cut short', () => {
    vi.useFakeTimers();
    toggleGoalMark('a', 1000);
    clearGoalMark();
    toggleGoalMark('a', 1000);
    vi.advanceTimersByTime(900);
    expect(markedGoal.value).toBe('a');
  });
});
