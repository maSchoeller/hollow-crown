/**
 * The goals `escort` and `treasure` (story 4.8): schema, content checks, victory and defeat, the profile `follow`, the round
 * limit, joining after the mission, the autoplay and replay. Built on the developer maps `tests/fixtures/maps/dev_escort.yaml`
 * and `dev_treasure.yaml` (no content, never shipped).
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { mapSchema } from '../../src/content/schemas';
import { validateContent } from '../../src/content/validate';
import {
  applyCommand,
  attackPlans,
  autoplay,
  chestProgress,
  createBattle,
  defeatSentence,
  dist,
  finishBattle,
  newCampaign,
  replayBattle,
  startBattle,
  threatTiles,
  type BattleState,
  type BattleUnit,
  type GameData,
  type MapDef,
  type Pos,
} from '../../src/core';
import { addDevObjectiveMap, devObjectiveMap, type DevObjectiveMapId } from '../fixtures/devObjectiveMaps';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];
const restore: Array<() => void> = [];

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});
afterEach(() => {
  while (restore.length) restore.pop()!();
});

const unit = (s: BattleState, id: string): BattleUnit => s.units.find((u) => u.id === id)!;
const put = (s: BattleState, id: string, at: Pos): BattleUnit => {
  const u = unit(s, id);
  u.pos = at;
  return u;
};
/** Takes the units out of the battle (they are neither on the map nor count for anything). */
function remove(s: BattleState, ...ids: string[]): void {
  for (const id of ids) {
    const u = unit(s, id);
    u.pos = null;
    u.gone = 'retreated';
  }
}
const foes = (s: BattleState) => s.units.filter((u) => u.team === 'enemy').map((u) => u.id);
const endPhase = (s: BattleState) => applyCommand(data, s, { type: 'endPhase' });
const open = (s: BattleState, id: string) => (s.objects.find((o) => o.id === id)!.state = 'open');
const key = (p: Pos) => `${p[0]},${p[1]}`;
/** The validation messages of the map `m` registered in `data` (undone after the test). */
function issuesOf(m: MapDef): string[] {
  const was = data.maps[m.id];
  data.maps[m.id] = m;
  restore.push(() => (was ? (data.maps[m.id] = was) : delete data.maps[m.id]));
  return validateContent(data, locales)
    .filter((i) => i.file === `maps/${m.id}`)
    .map((i) => i.message);
}
function withTile(m: MapDef, [x, y]: Pos, ch: string): void {
  const rows = m.terrain.split('\n');
  rows[y] = rows[y]!.slice(0, x) + ch + rows[y]!.slice(x + 1);
  m.terrain = rows.join('\n');
}

describe('schema', () => {
  it('reads both goals from the developer maps', () => {
    expect(devObjectiveMap('dev_escort').objectives.victory).toEqual({ type: 'escort', unit: 'liora', area: { rect: [12, 3, 13, 5] } });
    expect(devObjectiveMap('dev_treasure').objectives.victory).toEqual({
      type: 'treasure',
      chests: ['dev_chest_a', 'dev_chest_b', 'dev_chest_c', 'dev_chest_d'],
      turns: 10,
    });
  });
  const accepts = (id: DevObjectiveMapId, victory: unknown) => {
    const raw = structuredClone(devObjectiveMap(id)) as unknown as { objectives: { victory: unknown } };
    raw.objectives.victory = victory;
    return mapSchema.safeParse(raw).success;
  };
  it('rejects a treasure hunt without chests or rounds and an escort without NPC or exit', () => {
    expect(accepts('dev_treasure', { type: 'treasure', chests: [], turns: 5 })).toBe(false);
    expect(accepts('dev_treasure', { type: 'treasure', chests: ['a'], turns: 0 })).toBe(false);
    expect(accepts('dev_treasure', { type: 'treasure', chests: ['a'] })).toBe(false);
    expect(accepts('dev_treasure', { type: 'treasure', chests: ['a'], turns: 3 })).toBe(true);
    expect(accepts('dev_escort', { type: 'escort', area: { rect: [12, 3, 13, 5] } })).toBe(false);
    expect(accepts('dev_escort', { type: 'escort', unit: 'liora' })).toBe(false);
    expect(accepts('dev_escort', { type: 'escort', unit: 'liora', area: { tiles: [[13, 4]] }, join: false })).toBe(true);
  });
  it('keeps both goals out of the side objectives', () => {
    const raw = structuredClone(devObjectiveMap('dev_treasure')) as unknown as { objectives: { side: unknown[] } };
    raw.objectives.side = [{ id: 'x', type: 'treasure', turns: 3, reward: {} }];
    expect(mapSchema.safeParse(raw).success).toBe(false);
  });
  it('keeps the follow values in the balance', () => {
    expect(data.balance.ai).toMatchObject({ followRadius: 4, followDanger: 100 });
  });
});

describe('content:check', () => {
  it('accepts the developer maps', () => {
    expect(issuesOf(devObjectiveMap('dev_escort'))).toEqual([]);
    expect(issuesOf(devObjectiveMap('dev_treasure'))).toEqual([]);
  });

  describe('escort', () => {
    const base = () => devObjectiveMap('dev_escort');
    it('wants the NPC on the map, of team other, with the profile follow', () => {
      const m = base();
      (m.objectives.victory as { unit: string }).unit = 'nobody';
      expect(issuesOf(m)).toContainEqual(expect.stringMatching(/unit nobody not on the map/));
      const a = base();
      a.units.find((u) => u.id === 'liora')!.ai = { profile: 'hold' };
      expect(issuesOf(a)).toContainEqual(expect.stringMatching(/liora needs the AI profile follow/));
      const b = base();
      b.units.find((u) => u.id === 'liora')!.team = 'player';
      expect(issuesOf(b)).toContainEqual(expect.stringMatching(/liora must be team other/));
    });
    it('wants the NPC to start outside the exit and to be able to walk there', () => {
      const m = base();
      m.units.find((u) => u.id === 'liora')!.at = [12, 4];
      expect(issuesOf(m)).toContainEqual(expect.stringMatching(/liora starts on the exit/));
      const walled = base();
      for (let y = 0; y < 9; y++) withTile(walled, [10, y], '#');
      walled.units = walled.units.filter((u) => u.team !== 'enemy');
      expect(issuesOf(walled)).toContainEqual(expect.stringMatching(/exit is not reachable by liora/));
    });
    it('wants the deploy area to reach the NPC', () => {
      const m = base();
      for (let y = 0; y < 9; y++) withTile(m, [3, y], '#');
      m.units.find((u) => u.id === 'liora')!.at = [5, 4];
      expect(issuesOf(m).some((x) => /liora not reachable on foot from deploy slot/.test(x))).toBe(true);
    });
    it('wants the name of the NPC in both languages', () => {
      const m = base();
      const npc = m.units.find((u) => u.id === 'liora')!;
      npc.id = 'dev_npc';
      (m.objectives.victory as { unit: string; join?: boolean }).unit = 'dev_npc';
      (m.objectives.victory as { join?: boolean }).join = false;
      const issues = issuesOf(m);
      expect(issues).toContainEqual('escort: missing locale key unit.dev_npc.name in de');
      expect(issues).toContainEqual('escort: missing locale key unit.dev_npc.name in en');
      expect(issuesOf(base())).toEqual([]);
    });
    it('wants a character of the same id when the NPC joins, unless join is false', () => {
      const m = base();
      const npc = m.units.find((u) => u.id === 'liora')!;
      npc.id = 'dev_npc';
      delete npc.char;
      (m.objectives.victory as { unit: string }).unit = 'dev_npc';
      expect(issuesOf(m)).toContainEqual(expect.stringMatching(/dev_npc joins afterwards/));
      (m.objectives.victory as { join?: boolean }).join = false;
      expect(issuesOf(m).filter((x) => !/locale key/.test(x))).toEqual([]);
    });
  });

  describe('treasure', () => {
    const base = () => devObjectiveMap('dev_treasure');
    it('wants every chest to be a chest of the map, and each once', () => {
      const m = base();
      (m.objectives.victory as { chests: string[] }).chests.push('dev_chest_nope', 'dev_chest_a');
      const issues = issuesOf(m);
      expect(issues).toContainEqual(expect.stringMatching(/dev_chest_nope is no chest/));
      expect(issues).toContainEqual(expect.stringMatching(/chest listed twice/));
    });
    it('wants every chest to be reachable from every deploy slot', () => {
      const m = base();
      for (const p of [[11, 7], [13, 7], [12, 6], [12, 8]] as Pos[]) withTile(m, p, '#');
      expect(issuesOf(m)).toContainEqual(expect.stringMatching(/chest dev_chest_d not reachable on foot from deploy slot 0,3/));
    });
    it('wants a scout or a key from the map: a player unit, a forced character or a village reward', () => {
      const strip = (m: MapDef) => {
        m.units = m.units.filter((u) => u.class !== 'scout');
        m.units.find((u) => u.id === 'dev_vanguard')!.items = [{ def: 'iron_lance' }];
      };
      const m = base();
      strip(m);
      expect(issuesOf(m)).toContainEqual(expect.stringMatching(/no scout or key available/));
      // a key in the bag of a player unit is enough
      m.units.find((u) => u.id === 'dev_marksman')!.items.push({ def: 'door_key' });
      expect(issuesOf(m)).toEqual([]);
      // so is a village that hands one out
      const v = base();
      strip(v);
      v.objects.push({ id: 'dev_village', type: 'village', at: [2, 6], reward: { item: { def: 'door_key' } } });
      expect(issuesOf(v)).toEqual([]);
    });
  });
});

describe('escort: victory and defeat', () => {
  it('is won when the NPC reaches the exit: it leaves the map there', () => {
    const s = addDevObjectiveMap(data, 'dev_escort');
    remove(s, ...foes(s));
    put(s, 'liora', [10, 4]);
    put(s, 'dev_vanguard', [9, 4]);
    const r = endPhase(s);
    expect(r.state.outcome).toBe('victory');
    expect(unit(r.state, 'liora').gone).toBe('escaped');
    expect(r.events.filter((e) => e.t === 'escaped')).toEqual([{ t: 'escaped', unit: 'liora' }]);
    expect(r.events).toContainEqual(expect.objectContaining({ t: 'battleEnd', outcome: 'victory' }));
  });
  it('is not won by a player unit on the exit', () => {
    const s = addDevObjectiveMap(data, 'dev_escort');
    remove(s, ...foes(s));
    put(s, 'dev_vanguard', [12, 4]);
    const r = applyCommand(data, s, { type: 'act', unit: unit(s, 'dev_marksman').uid, to: [1, 5], action: { kind: 'wait' } });
    expect(r.state.outcome).toBeNull();
  });
  it('is lost when the NPC falls in the enemy phase (the reason is the NPC)', () => {
    const s = addDevObjectiveMap(data, 'dev_escort');
    remove(s, 'dev_brigand_s', 'dev_archer');
    put(s, 'dev_brigand_n', [5, 4]);
    put(s, 'liora', [4, 4]).hp = 1;
    put(s, 'dev_vanguard', [0, 8]);
    put(s, 'dev_marksman', [1, 8]);
    put(s, 'dev_scout', [0, 0]);
    const r = endPhase(s);
    expect(r.state.outcome).toBe('defeat');
    expect(r.state.defeatReason).toBe('liora');
    expect(defeatSentence(data, r.state)).toMatchObject({ kind: 'unit', nameKey: 'unit.liora.name' });
  });
  it('is lost at once when the NPC is down, with no defeat entry in the map', () => {
    const s = addDevObjectiveMap(data, 'dev_escort');
    expect(data.maps.dev_escort!.objectives.defeat).toEqual([]);
    unit(s, 'liora').downed = true;
    const r = endPhase(s);
    expect(r.state.outcome).toBe('defeat');
    expect(r.state.defeatReason).toBe('liora');
  });
  it('lets the foes aim at the NPC as at the ward of a defend goal (objectiveBonus)', () => {
    const s = addDevObjectiveMap(data, 'dev_escort');
    remove(s, 'dev_brigand_s', 'dev_archer');
    const brigand = put(s, 'dev_brigand_n', [5, 4]);
    put(s, 'liora', [4, 4]);
    put(s, 'dev_vanguard', [6, 4]);
    const score = (target: string) =>
      attackPlans(data, s, brigand, [brigand.pos!]).find((p) => p.action.kind === 'attack' && p.action.target === unit(s, target).uid)!.score;
    const [l1, v1] = [score('liora'), score('dev_vanguard')];
    const was = data.balance.ai.objectiveBonus;
    data.balance.ai.objectiveBonus = 0;
    restore.push(() => (data.balance.ai.objectiveBonus = was));
    expect(l1 - score('liora')).toBe(was);
    expect(v1 - score('dev_vanguard')).toBe(0);
  });
});

describe('escort: profile follow', () => {
  const quiet = () => {
    const s = addDevObjectiveMap(data, 'dev_escort');
    remove(s, ...foes(s));
    return s;
  };
  it('waits while no player unit is within the radius', () => {
    const s = quiet();
    put(s, 'dev_vanguard', [8, 0]);
    put(s, 'dev_marksman', [9, 0]);
    put(s, 'dev_scout', [10, 0]);
    const r = endPhase(s);
    expect(unit(r.state, 'liora').pos).toEqual([2, 4]);
    expect(r.events.some((e) => e.t === 'moved' && e.unit === unit(s, 'liora').uid)).toBe(false);
    expect(r.state.outcome).toBeNull();
  });
  it('walks towards the exit and ends within the radius of a player unit', () => {
    const r = endPhase(quiet());
    const npc = unit(r.state, 'liora');
    expect(npc.pos![0]).toBeGreaterThan(2);
    const near = r.state.units.filter((u) => u.team === 'player' && u.pos).map((u) => dist(u.pos!, npc.pos!));
    expect(Math.min(...near)).toBeLessThanOrEqual(data.balance.ai.followRadius);
  });
  it('keeps the radius from the balance (a smaller one keeps it closer to its guard)', () => {
    const was = data.balance.ai.followRadius;
    data.balance.ai.followRadius = 2;
    restore.push(() => (data.balance.ai.followRadius = was));
    const r = endPhase(quiet());
    const npc = unit(r.state, 'liora');
    expect(Math.min(...r.state.units.filter((u) => u.team === 'player' && u.pos).map((u) => dist(u.pos!, npc.pos!)))).toBeLessThanOrEqual(2);
  });
  it('avoids tiles that a foe threatens, which it takes with followDanger 0', () => {
    const arrange = () => {
      const s = addDevObjectiveMap(data, 'dev_escort');
      remove(s, 'dev_brigand_s', 'dev_archer');
      put(s, 'dev_brigand_n', [11, 4]);
      put(s, 'liora', [5, 4]);
      put(s, 'dev_vanguard', [6, 4]);
      put(s, 'dev_marksman', [5, 3]);
      put(s, 'dev_scout', [5, 5]);
      return s;
    };
    const s0 = arrange();
    const threat = threatTiles(data, s0, unit(s0, 'dev_brigand_n'));
    const safe = unit(endPhase(s0).state, 'liora').pos!;
    expect(threat.has(key(safe))).toBe(false);
    const was = data.balance.ai.followDanger;
    data.balance.ai.followDanger = 0;
    restore.push(() => (data.balance.ai.followDanger = was));
    const bold = unit(endPhase(arrange()).state, 'liora').pos!;
    expect(threat.has(key(bold))).toBe(true);
  });
  it('never attacks, even with a foe next to it', () => {
    const s = addDevObjectiveMap(data, 'dev_escort');
    remove(s, 'dev_brigand_s', 'dev_archer');
    put(s, 'dev_brigand_n', [3, 4]).hp = 1;
    const r = endPhase(s);
    expect(r.events.some((e) => e.t === 'combat' && e.attacker === unit(s, 'liora').uid)).toBe(false);
  });
});

describe('treasure: victory, defeat, limit', () => {
  const quiet = () => {
    const s = addDevObjectiveMap(data, 'dev_treasure');
    remove(s, ...foes(s));
    return s;
  };
  const list = () => (data.maps.dev_treasure!.objectives.victory as { chests: string[] }).chests;
  it('counts the open chests of the goal only', () => {
    const s = quiet();
    expect(chestProgress(s, list())).toEqual({ have: 0, total: 4 });
    open(s, 'dev_chest_extra');
    expect(chestProgress(s, list())).toEqual({ have: 0, total: 4 });
    open(s, 'dev_chest_a');
    expect(chestProgress(s, list())).toEqual({ have: 1, total: 4 });
  });
  it('is won with the last chest, whether a scout opens it or a unit with a key stands on it', () => {
    for (const how of ['scout', 'key'] as const) {
      const s = quiet();
      for (const id of ['dev_chest_a', 'dev_chest_b', 'dev_chest_c']) open(s, id);
      put(s, 'dev_vanguard', [12, 7]);
      put(s, 'dev_scout', [11, 7]);
      const r =
        how === 'scout'
          ? applyCommand(data, s, { type: 'act', unit: unit(s, 'dev_scout').uid, to: [11, 7], action: { kind: 'open', object: 'dev_chest_d' } })
          : applyCommand(data, s, { type: 'act', unit: unit(s, 'dev_vanguard').uid, to: [12, 7], action: { kind: 'chest' } });
      expect(r.state.objects.find((o) => o.id === 'dev_chest_d')!.state).toBe('open');
      expect(r.state.outcome).toBe('victory');
    }
  });
  it('is not won while a chest of the list is shut, the extra chest does not help', () => {
    const s = quiet();
    for (const id of ['dev_chest_a', 'dev_chest_b', 'dev_chest_extra']) open(s, id);
    const r = applyCommand(data, s, { type: 'act', unit: unit(s, 'dev_marksman').uid, to: [1, 5], action: { kind: 'wait' } });
    expect(r.state.outcome).toBeNull();
  });
  it('can still be won in the last player phase of round N', () => {
    const s = quiet();
    s.turn = 10;
    for (const id of ['dev_chest_a', 'dev_chest_b', 'dev_chest_c']) open(s, id);
    put(s, 'dev_scout', [11, 7]);
    const r = applyCommand(data, s, { type: 'act', unit: unit(s, 'dev_scout').uid, to: [11, 7], action: { kind: 'open', object: 'dev_chest_d' } });
    expect(r.state.outcome).toBe('victory');
  });
  it('is lost at the start of round N+1, not before', () => {
    const s = quiet();
    s.turn = 9;
    const mid = endPhase(s).state;
    expect(mid.turn).toBe(10);
    expect(mid.outcome).toBeNull();
    const r = endPhase(mid);
    expect(r.state.turn).toBe(11);
    expect(r.state.outcome).toBe('defeat');
    expect(r.state.defeatReason).toBe('turns');
    expect(defeatSentence(data, r.state)).toEqual({ kind: 'turns', turns: 10 });
  });
  it('is won, not lost, when every chest is open as round N ends', () => {
    const s = quiet();
    s.turn = 10;
    for (const id of list()) open(s, id);
    expect(endPhase(s).state.outcome).toBe('victory');
  });
  it('counts a chest opened by the scout and one opened with a key the same way', () => {
    const s = quiet();
    const a = applyCommand(data, s, { type: 'act', unit: unit(s, 'dev_scout').uid, to: [2, 1], action: { kind: 'open', object: 'dev_chest_a' } }).state;
    expect(a.stats.chestsOpened).toEqual(['dev_chest_a']);
    put(a, 'dev_vanguard', [7, 4]);
    const b = applyCommand(data, a, { type: 'act', unit: unit(a, 'dev_vanguard').uid, to: [7, 4], action: { kind: 'chest' } }).state;
    expect(chestProgress(b, ['dev_chest_a', 'dev_chest_c'])).toEqual({ have: 2, total: 2 });
  });
});

describe('joining after the mission', () => {
  const won = (join?: boolean) => {
    const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    addDevObjectiveMap(data, 'dev_escort');
    if (join === false) (data.maps.dev_escort!.objectives.victory as { join?: boolean }).join = false;
    const s = startBattle(data, createBattle(data, c, 'dev_escort', [])).state;
    remove(s, ...foes(s));
    unit(s, 'liora').pos = null;
    unit(s, 'liora').gone = 'escaped';
    s.outcome = 'victory';
    return finishBattle(data, c, s);
  };
  it('lets the escorted character join the company', () => {
    const { campaign, result } = won();
    expect(campaign.roster.some((r) => r.id === 'liora')).toBe(true);
    expect(result.recruited).toContain('liora');
  });
  it('lets an NPC with join: false leave for good', () => {
    const { campaign, result } = won(false);
    expect(campaign.roster.some((r) => r.id === 'liora')).toBe(false);
    expect(result.recruited).not.toContain('liora');
  });
});

describe('autoplay and replay', () => {
  for (const id of ['dev_escort', 'dev_treasure'] as const) {
    it(`wins ${id}; the same commands replay to the same state`, () => {
      for (const seed of [1, 2, 3]) {
        const start = addDevObjectiveMap(data, id, seed);
        const r = autoplay(data, start);
        expect(r.state.outcome, `${id} seed ${seed}`).toBe('victory');
        expect(replayBattle(data, start, r.log)).toEqual(r.state);
        expect(structuredClone(r.state)).toEqual(r.state);
        expect(structuredClone(r.events)).toEqual(r.events);
        expect(autoplay(data, addDevObjectiveMap(data, id, seed)).events).toEqual(r.events);
      }
    }, 60_000);
  }
  it('has the escort NPC leave and the treasure hunt end with every listed chest open', () => {
    const e = autoplay(data, addDevObjectiveMap(data, 'dev_escort'));
    expect(unit(e.state, 'liora').gone).toBe('escaped');
    const t = autoplay(data, addDevObjectiveMap(data, 'dev_treasure'));
    expect(chestProgress(t.state, (data.maps.dev_treasure!.objectives.victory as { chests: string[] }).chests)).toEqual({ have: 4, total: 4 });
  });
});
