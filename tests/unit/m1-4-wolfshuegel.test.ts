/** Mission 1-4 on the Wolf Hills: levels and ramps, the rockfall lever, waves that stay away, the campaign order around it, and what content:check now refuses. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import { applyCommand, availableActions, availableNodes, createBattle, levelAt, newCampaign, reachable, type BattleState, type CampaignState, type GameData } from '../../src/core';
import { clone } from '../../src/core/util';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];
const MAP = 'm1_4_wolfslager';

const fresh = (difficulty: 'easy' | 'normal' | 'hard' = 'normal'): CampaignState => newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const battle = (difficulty: 'easy' | 'normal' | 'hard' = 'normal'): BattleState => {
  const c = fresh(difficulty);
  return createBattle(data, c, 'm1_4', c.roster.map((r) => r.id));
};
const problems = (edit: (d: GameData) => void): string[] => {
  const d = clone(data);
  edit(d);
  return validateContent(d, locales).map((i) => i.message);
};
const tile = (d: GameData, x: number, y: number) => d.maps[MAP]!.legend[d.maps[MAP]!.terrain.split('\n')[y]![x]!];

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

describe('map m1_4_wolfslager', () => {
  it('has three levels split by the ridges, with ramps on the lower row of each', () => {
    const s = battle();
    const at = (x: number, y: number) => levelAt(data, s, [x, y]);
    expect([at(10, 22), at(10, 20), at(10, 19), at(10, 14), at(10, 10), at(10, 9), at(10, 7), at(10, 2)]).toEqual([0, 0, 1, 1, 1, 2, 2, 2]);
    expect(at(18, 11)).toBe(2);
    for (const [x, y] of [[3, 20], [10, 20], [11, 20], [18, 20], [2, 10], [10, 10], [11, 10], [17, 10]] as const) expect(tile(data, x, y)).toBe('ramp');
    expect(tile(data, 18, 12)).toBe('stairs');
  });

  it('a figure at the foot of a ridge gets up only over a ramp, never through the rock', () => {
    const s = battle();
    const unit = s.units.find((u) => u.team === 'player')!;
    const range = [...reachable(data, s, unit, [10, 21], 2).keys()];
    expect(range).toContain('10,20');
    expect(range).toContain('10,19');
    expect([...reachable(data, s, unit, [5, 21], 4).keys()]).not.toContain('5,20');
  });

  it('keeps the E2 units and the story hooks of the old map', () => {
    const map = data.maps[MAP]!;
    for (const id of ['wr3', 'wr4', 'g3', 'g4']) expect(map.units.find((u) => u.id === id)?.requires).toEqual([{ not: { flag: { e02: 'hand_over' } } }]);
    const osric = map.units.find((u) => u.id === 'osric')!;
    expect(osric.quote).toBe('scn.m1_4.dunn_battle');
    expect(map.units.find((u) => u.id === 'ysolde')!.recruit).toEqual({ by: ['avatar'], dialogue: 'scn.m1_4.ysolde_talk' });
    expect(map.music).toBe('battle_a');
    expect(map.haunts?.map((h) => h.variant).sort()).toEqual(['boss', 'defend', 'rout']);
  });
});

describe('the rockfall', () => {
  const beside = (s: BattleState) => {
    const u = s.units.find((x) => x.id === 'lucan')!;
    u.pos = [18, 11];
    u.acted = false;
    u.moved = false;
    return u;
  };
  const pull = (s: BattleState) => {
    const u = beside(s);
    return applyCommand(data, s, { type: 'act', unit: u.uid, to: [18, 11], action: { kind: 'lever', object: 'l_rock' } });
  };
  const riders = (s: BattleState) => s.units.filter((u) => u.team === 'enemy' && u.pos && u.pos[0] >= 19 && u.pos[1] >= 13 && u.pos[1] <= 16).length;

  it('the lever is pulled from the crag beside it, by a player figure', () => {
    const s = battle();
    const u = beside(s);
    expect(availableActions(data, s, u, [18, 11]).some((a) => a.kind === 'lever' && a.object === 'l_rock')).toBe(true);
    expect(availableActions(data, s, u, [17, 11]).some((a) => a.kind === 'lever')).toBe(false);
  });

  it('pulling it buries the east cave and sets the flag', () => {
    const s = pull(battle()).state;
    for (const [x, y] of [[19, 14], [19, 15], [20, 14], [21, 14]] as const) {
      expect(s.terrain[y * s.width + x]).toBe('rockwall');
      expect(levelAt(data, s, [x, y])).toBe(1);
    }
    expect(s.flags).toContain('m1_4_rockfall');
  });

  it('the waves of the east cave stay away after it, the west wave still comes', () => {
    const s = pull(battle()).state;
    const map = data.maps[MAP]!;
    expect(map.reinforcements.map((r) => [r.turn, r.unlessFlag])).toEqual([[3, 'm1_4_rockfall'], [5, undefined], [6, 'm1_4_rockfall'], [8, undefined]]);
    s.units = s.units.filter((u) => u.team !== 'enemy' || u.id === 'osric');
    let cur = s;
    for (const turn of [3, 6]) {
      cur = clone(cur);
      cur.turn = turn;
      cur.phase = 'player';
      cur = applyCommand(data, cur, { type: 'endPhase' }).state;
      expect(riders(cur)).toBe(0);
    }
    expect(cur.reinforcementsDone).toContain(0);
    expect(cur.reinforcementsDone).toContain(2);
  });

  it('without the lever they come', () => {
    const s = battle();
    s.turn = 3;
    s.phase = 'player';
    s.units = s.units.filter((u) => u.team !== 'enemy' || u.id === 'osric');
    expect(riders(applyCommand(data, s, { type: 'endPhase' }).state)).toBeGreaterThan(0);
  });
});

describe('campaign order of the mission list', () => {
  const open = (completed: string[], flags: CampaignState['flags'] = {}) => {
    const c = fresh();
    c.completed = completed;
    c.flags = flags;
    return availableNodes(data, c).map((n) => n.id);
  };

  it('runs P, 1-1, the pair 1-2 and 1-3, then one after the other', () => {
    expect(open(['prologue'])).toEqual(['m1_1']);
    expect(open(['prologue', 'm1_1'])).toEqual(['m1_2', 'm1_3']);
    expect(open(['prologue', 'm1_1', 'm1_2'])).toEqual(['m1_3']);
    expect(open(['prologue', 'm1_1', 'm1_2', 'm1_3'])).toEqual(['m1_4']);
    expect(open(['prologue', 'm1_1', 'm1_2', 'm1_3', 'm1_4'])).toEqual(['m1_5']);
    expect(open(['prologue', 'm1_1', 'm1_2', 'm1_3', 'm1_4', 'm1_5'])).toEqual(['n2', 'm1_6']);
  });

  it('opens N1 only after 1-4, and only with E2 "protect"', () => {
    const before = ['prologue', 'm1_1', 'm1_2', 'm1_3'];
    expect(open(before, { e02: 'protect' })).not.toContain('n1');
    expect(open([...before, 'm1_4'], { e02: 'protect' })).toContain('n1');
    expect(open([...before, 'm1_4'], { e02: 'hand_over' })).not.toContain('n1');
  });
});

describe('content:check along the levels', () => {
  it('the shipped content is clean', () => {
    expect(validateContent(data, locales)).toEqual([]);
  });

  /** a small map: terrace on the north half, the goal or boss up there, and no way up unless `way` */
  const terraced = (d: GameData, victory: GameData['maps'][string]['objectives']['victory'], terrain: string) => {
    const m = d.maps.m1_1_steckbriefe!;
    m.size = [4, 4];
    m.legend = { '.': 'plain', '=': 'terrace', r: 'ramp' };
    m.terrain = terrain;
    m.levels = [];
    m.objects = [];
    m.haunts = [];
    m.triggers = [];
    m.reinforcements = [];
    m.deploy = { max: 1, forced: [], slots: [[0, 3]] };
    m.objectives.victory = victory;
    m.objectives.side = [];
    m.units = [{ id: 'foe', team: 'enemy', class: 'brigand', level: 1, at: [3, 0], items: [], ai: { profile: 'hold' }, nameKey: 'unit.osric.name' } as never];
  };
  const CLOSED = '====\n====\n....\n....\n';
  const OPEN = '====\n====\nr...\n....\n';
  const area = { rect: [0, 0, 3, 1] as [number, number, number, number] };

  it('a terrace without a ramp cuts a reach goal off, a ramp restores it', () => {
    const msg = 'victory area not reachable on foot from the deploy area';
    expect(problems((d) => terraced(d, { type: 'reach', area }, CLOSED))).toContain(msg);
    expect(problems((d) => terraced(d, { type: 'reach', area }, OPEN))).not.toContain(msg);
  });

  it('a boss on a terrace without a ramp is refused', () => {
    expect(problems((d) => terraced(d, { type: 'boss', unit: 'foe' }, CLOSED))).toContainEqual(expect.stringContaining('boss foe not reachable'));
    expect(problems((d) => terraced(d, { type: 'boss', unit: 'foe' }, OPEN)).filter((m) => m.includes('boss foe'))).toEqual([]);
  });

  it('an attacking foe walled in on a terrace is refused, a holding one is not', () => {
    const attacking = (d: GameData, terrain: string, profile: 'aggressive' | 'hold') => {
      terraced(d, { type: 'rout' }, terrain);
      d.maps.m1_1_steckbriefe!.units[0]!.ai = { profile };
    };
    expect(problems((d) => attacking(d, CLOSED, 'aggressive'))).toContainEqual(expect.stringContaining('cannot walk to the deploy area'));
    expect(problems((d) => attacking(d, CLOSED, 'hold')).filter((m) => m.includes('cannot walk'))).toEqual([]);
    expect(problems((d) => attacking(d, OPEN, 'aggressive')).filter((m) => m.includes('cannot walk'))).toEqual([]);
  });

  it('a deploy slot on impassable terrain is refused', () => {
    expect(problems((d) => (d.maps[MAP]!.deploy.slots[0] = [0, 0]))).toContainEqual(expect.stringContaining('deploy slot 0,0 on impassable mountain'));
  });

  it('a wave naming an undeclared flag is refused', () => {
    expect(problems((d) => (d.maps[MAP]!.reinforcements[0]!.unlessFlag = 'ghost_flag'))).toContainEqual(expect.stringContaining('ghost_flag'));
  });
});
