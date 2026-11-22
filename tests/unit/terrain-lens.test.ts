/** Brett erklärt Gelände und Bewegungskosten (story 16.11): lens classes, tile effects, cost marks and "noch n" come from the same lookups as the path search. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  costLabel,
  costMarks,
  hasSpecialTerrain,
  lensKinds,
  lensPresent,
  lensTiles,
  moveBudget,
  moveCost,
  otherMoveCosts,
  posKey,
  reachable,
  restMovement,
  tileEffects,
  unitTileCost,
  walkPath,
  type BattleState,
  type GameData,
  type Pos,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

const tile = (s: BattleState, at: Pos, id: string) => (s.terrain[at[1] * s.width + at[0]] = id);

/** A lane: row 5 from x=0 holds `ids` (x=0 stays plain), the rest of the map is wall. */
function lane(ids: string[]): BattleState {
  const s = arena(data);
  s.terrain = s.terrain.map(() => 'wall');
  for (let x = 0; x <= ids.length; x++) tile(s, [x, 5], x === 0 ? 'plain' : ids[x - 1]!);
  return s;
}

describe('lensKinds', () => {
  it('forest protects and slows, road is fast, a mountain is closed on foot', () => {
    expect(lensKinds(data, 'forest')).toEqual(['cover', 'slow']);
    expect(lensKinds(data, 'road')).toEqual(['fast']);
    expect(lensKinds(data, 'bridge')).toEqual(['fast']);
    expect(lensKinds(data, 'mountain')).toEqual(['blocked']);
    expect(lensKinds(data, 'river')).toEqual(['blocked']);
  });

  it('fire slows and harms; a plain, grass and ash field are neutral; a fort only protects', () => {
    expect(lensKinds(data, 'burning')).toEqual(['slow', 'harm']);
    for (const id of ['plain', 'grass', 'ash', 'vault']) expect(lensKinds(data, id), id).toEqual([]);
    expect(lensKinds(data, 'fort')).toEqual(['cover']);
  });

  it('ground that only costs more (negative avoid) is slow, not cover', () => {
    expect(lensKinds(data, 'shallows')).toEqual(['slow']);
  });

  it('follows the move type: the mountain protects a flier and does not slow it, the forest slows armor too', () => {
    expect(lensKinds(data, 'mountain', 'flier')).toEqual(['cover']);
    expect(lensKinds(data, 'forest', 'flier')).toEqual(['cover']);
    expect(lensKinds(data, 'forest', 'armored')).toEqual(['cover', 'slow']);
  });

  it('never more than two effects, and a closed field has nothing else; an unknown id is neutral', () => {
    for (const id of Object.keys(data.terrain)) {
      for (const m of ['foot', 'armored', 'mounted', 'flier', 'monster'] as const) {
        const k = lensKinds(data, id, m);
        expect(k.length, `${id}/${m}`).toBeLessThanOrEqual(2);
        if (k.includes('blocked')) expect(k, `${id}/${m}`).toEqual(['blocked']);
      }
    }
    expect(lensKinds(data, 'nope')).toEqual([]);
  });
});

describe('lensTiles, lensPresent, hasSpecialTerrain', () => {
  it('lists every field with its effects and names only the kinds that occur, in legend order', () => {
    const s = arena(data);
    tile(s, [1, 1], 'forest');
    tile(s, [2, 1], 'road');
    const tiles = lensTiles(data, s);
    expect(tiles).toHaveLength(s.width * s.height);
    expect(tiles.find(([p]) => p[0] === 1 && p[1] === 1)![1]).toEqual(['cover', 'slow']);
    expect(tiles.find(([p]) => p[0] === 0 && p[1] === 0)![1]).toEqual([]);
    expect(lensPresent(tiles)).toEqual(['cover', 'slow', 'fast']);
  });

  it('a map of plain ground has no special terrain; one forest tile is enough', () => {
    const s = arena(data);
    expect(hasSpecialTerrain(data, s)).toBe(false);
    expect(lensPresent(lensTiles(data, s))).toEqual([]);
    tile(s, [3, 3], 'forest');
    expect(hasSpecialTerrain(data, s)).toBe(true);
  });
});

describe('tileEffects', () => {
  it('forest: defense and avoid as bonus, flammable as malus', () => {
    const s = arena(data);
    tile(s, [1, 1], 'forest');
    expect(tileEffects(data, s, [1, 1])).toEqual([
      { kind: 'def', value: data.terrain.forest!.def, good: true },
      { kind: 'avoid', value: data.terrain.forest!.avoid, good: true },
      { kind: 'flammable', good: false },
    ]);
  });

  it('fire hurts on entering with the value of balance.yaml; a fort heals; plain ground has no effect; negative avoid is a malus', () => {
    const s = arena(data);
    tile(s, [1, 1], 'burning');
    tile(s, [2, 1], 'fort');
    tile(s, [3, 1], 'shallows');
    expect(tileEffects(data, s, [1, 1])).toEqual([{ kind: 'enterDamage', value: data.balance.terrainEffects.burningEnterDamage, good: false }]);
    expect(tileEffects(data, s, [2, 1]).find((e) => e.kind === 'heal')).toEqual({ kind: 'heal', value: data.terrain.fort!.heal, good: true });
    expect(tileEffects(data, s, [3, 1])).toEqual([{ kind: 'avoid', value: data.terrain.shallows!.avoid, good: false }]);
    expect(tileEffects(data, s, [0, 0])).toEqual([]);
  });
});

describe('costLabel', () => {
  it('writes whole points as they are and halves with a half sign', () => {
    expect(costLabel(0.5)).toBe('½');
    expect(costLabel(1)).toBe('1');
    expect(costLabel(2.5)).toBe('2½');
    expect(costLabel(3)).toBe('3');
    expect(costLabel(0)).toBe('0');
  });
});

describe('costs from the path search', () => {
  it('the cost of the card is moveCost and equals the step in a reach search; the other move types come from the same table', () => {
    const s = lane(['forest', 'road', 'plain']);
    const u = place(data, s, 'player', 'skirmisher', [0, 5], 'iron_sword');
    const reach = reachable(data, s, u);
    expect(unitTileCost(data, s, u, [1, 5])).toBe(moveCost(data, s, u, [1, 5]));
    expect(reach.get(posKey([1, 5]))!.cost).toBe(unitTileCost(data, s, u, [1, 5]));
    expect(unitTileCost(data, s, u, [2, 5])).toBe(0.5);
    expect(unitTileCost(data, s, u, [0, 0])).toBeNull();
    const own = data.classes.skirmisher!.moveType;
    expect(otherMoveCosts(data, s, [1, 5], own).map((o) => o.moveType)).not.toContain(own);
    for (const o of otherMoveCosts(data, s, [1, 5], own)) expect(o.cost).toBe(data.terrain.forest!.cost[o.moveType]);
  });

  it('takes the skills of the figure into account: the light step makes the forest cost 1', () => {
    const s = lane(['forest']);
    const u = place(data, s, 'player', 'skirmisher', [0, 5], 'iron_sword');
    const plain = unitTileCost(data, s, u, [1, 5]);
    u.personalSkill = 'heritage_light_step';
    expect(plain).toBe(2);
    expect(unitTileCost(data, s, u, [1, 5])).toBe(1);
    expect(reachable(data, s, u).get(posKey([1, 5]))!.cost).toBe(1);
  });
});

describe('costMarks', () => {
  it('dots from cost 2, the half pill below 1, nothing for plain cost and closed fields', () => {
    const s = lane(['forest', 'road', 'plain', 'mountain']);
    const u = place(data, s, 'player', 'skirmisher', [0, 5], 'iron_sword');
    const tiles: Pos[] = [[1, 5], [2, 5], [3, 5], [4, 5]];
    expect(costMarks(data, s, u, tiles)).toEqual([
      { at: [1, 5], pips: 2, label: null },
      { at: [2, 5], pips: 0, label: '½' },
    ]);
  });

  it('a heavier class shows the dots of its own cost', () => {
    const s = lane(['forest']);
    const knight = place(data, s, 'player', 'vanguard', [0, 5], 'iron_sword');
    const cost = data.terrain.forest!.cost[data.classes.vanguard!.moveType]!;
    expect(costMarks(data, s, knight, [[1, 5]])).toEqual(cost >= 2 ? [{ at: [1, 5], pips: Math.ceil(cost), label: null }] : []);
  });
});

describe('restMovement ("noch n")', () => {
  it('is the budget minus the cost of the way, as the walk pays it, halves included', () => {
    const s = lane(['plain', 'plain', 'road', 'road']);
    const u = place(data, s, 'player', 'vanguard', [0, 5], 'iron_sword');
    const reach = reachable(data, s, u);
    const w = walkPath(data, s, u, [[0, 5], [1, 5], [2, 5], [3, 5]]);
    expect(restMovement(data, s, u, reach, [3, 5])).toBe(moveBudget(data, s, u) - w!.cost);
    expect(restMovement(data, s, u, reach, [3, 5])).toBe(1.5);
  });

  it('is null for a field outside the reach', () => {
    const s = lane(['plain', 'mountain']);
    const u = place(data, s, 'player', 'skirmisher', [0, 5], 'iron_sword');
    expect(restMovement(data, s, u, reachable(data, s, u), [2, 5])).toBeNull();
  });
});
