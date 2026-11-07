/**
 * Objective phases (story 11.8): a `survive` goal with `then: escape` changes to the escape after its rounds, early when no foe is
 * left, or by the trigger action `advance_objective`; the trigger `objective_changed` follows. The escape is won when `min`
 * units escaped and every unit of `must` left the map, Lucan last. Built on `tests/fixtures/maps/dev_phases.yaml`.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { mapSchema } from '../../src/content/schemas';
import { validateContent } from '../../src/content/validate';
import {
  activeVictory,
  applyCommand,
  autoplay,
  availableActions,
  replayBattle,
  type BattleState,
  type BattleUnit,
  type GameData,
  type GameEvent,
  type MapDef,
  type Pos,
} from '../../src/core';
import { addDevObjectiveMap, devObjectiveMap } from '../fixtures/devObjectiveMaps';

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
const enemies = (s: BattleState) => s.units.filter((u) => u.team === 'enemy');
/** Takes units out of the battle without them counting for anything. */
function remove(s: BattleState, ...ids: string[]): void {
  for (const id of ids) {
    const u = unit(s, id);
    u.pos = null;
    u.gone = 'retreated';
  }
}
/** Starts dev_phases with a changed copy of the map (undone after the test). */
function start(change?: (m: MapDef) => void, seed = 7): BattleState {
  const was = data.maps.dev_phases;
  restore.push(() => (was ? (data.maps.dev_phases = was) : delete data.maps.dev_phases));
  const s = addDevObjectiveMap(data, 'dev_phases', seed);
  if (change) {
    const m = structuredClone(data.maps.dev_phases!);
    change(m);
    data.maps.dev_phases = m;
  }
  return s;
}
const endPhase = (s: BattleState) => applyCommand(data, s, { type: 'endPhase' });
const changed = (events: GameEvent[]) => events.filter((e) => e.t === 'objectiveChanged');
/** The validation messages of the map `m` registered in `data` (undone after the test). */
function issuesOf(m: MapDef): string[] {
  const was = data.maps[m.id];
  data.maps[m.id] = m;
  restore.push(() => (was ? (data.maps[m.id] = was) : delete data.maps[m.id]));
  return validateContent(data, locales)
    .filter((i) => i.file === `maps/${m.id}`)
    .map((i) => i.message);
}
/** Walks the unit onto `to` and lets it escape there (as the player would). */
function escapeAt(s: BattleState, id: string, to: Pos) {
  return applyCommand(data, s, { type: 'act', unit: unit(s, id).uid, to, action: { kind: 'escape' } });
}

describe('schema and content check', () => {
  it('reads the second phase from the developer map', () => {
    expect(devObjectiveMap('dev_phases').objectives.victory).toEqual({
      type: 'survive',
      turns: 3,
      then: { type: 'escape', area: { rect: [0, 0, 11, 0] }, min: 3, must: ['avatar', 'lucan'] },
    });
  });
  it('accepts then only as an escape and must only as a non-empty list', () => {
    const base = { ...devObjectiveMap('dev_phases') };
    const withVictory = (victory: unknown) => mapSchema.safeParse({ ...base, objectives: { ...base.objectives, victory } }).success;
    expect(withVictory({ type: 'survive', turns: 2, then: { type: 'rout' } })).toBe(false);
    expect(withVictory({ type: 'escape', area: { rect: [0, 0, 1, 0] }, must: [] })).toBe(false);
    expect(withVictory({ type: 'escape', area: { rect: [0, 0, 1, 0] }, must: ['lucan'] })).toBe(true);
  });
  it('passes the content check', () => {
    expect(issuesOf(devObjectiveMap('dev_phases'))).toEqual([]);
  });
  it('rejects an unknown must unit, a must list larger than min, min 0 and an unreachable escape', () => {
    const m = devObjectiveMap('dev_phases');
    const v = m.objectives.victory as Extract<MapDef['objectives']['victory'], { type: 'survive' }>;
    v.then = { ...v.then!, must: ['avatar', 'lucan', 'dev_vanguard', 'nobody'] };
    const issues = issuesOf(m);
    expect(issues).toContain('escape: must names nobody, who is neither a unit of the map nor in deploy.forced');
    expect(issues).toContain('escape: must names more units than min (3) asks for');
    v.then = { ...v.then, must: undefined, min: 0 };
    expect(issuesOf(m)).toContain('escape: min must be at least 1');
    m.terrain = m.terrain.replace('#####..#####', '############');
    v.then = { ...v.then, min: 3 };
    expect(issuesOf(m)).toContain('victory area not reachable on foot from the deploy area');
  });
  it('rejects advance_objective and objective_changed on a goal without a second phase', () => {
    const m = devObjectiveMap('dev_phases');
    m.objectives.victory = { type: 'survive', turns: 3 };
    const issues = issuesOf(m);
    expect(issues).toContain('t_gate: advance_objective needs a victory goal with a second phase (then)');
    expect(issues).toContain('t_flee: objective_changed needs a victory goal with a second phase (then)');
  });
});

describe('change of phase', () => {
  it('starts with survive; the forced avatar and Lucan stand on the board', () => {
    const s = start();
    expect(s.objectivePhase).toBeUndefined();
    expect(activeVictory(data.maps.dev_phases!, s).type).toBe('survive');
    expect(unit(s, 'avatar').pos).not.toBeNull();
    expect(unit(s, 'lucan').pos).not.toBeNull();
  });
  it('changes to escape when round 3 ends instead of being won, and plays the scene of objective_changed', () => {
    let s = start();
    const all: GameEvent[] = [];
    for (let i = 0; i < 3 && !s.outcome; i++) {
      // keep the company out of reach: the foes only walk
      for (const u of s.units) if (u.team === 'player') u.stats.def = 99;
      const r = endPhase(s);
      all.push(...r.events);
      s = r.state;
      if (i < 2) expect(s.objectivePhase).toBeUndefined();
    }
    expect(s.turn).toBe(4);
    expect(s.outcome).toBeNull();
    expect(s.objectivePhase).toBe(1);
    expect(changed(all)).toEqual([{ t: 'objectiveChanged', phase: 1 }]);
    const after = all.slice(all.findIndex((e) => e.t === 'objectiveChanged'));
    expect(after).toContainEqual({ t: 'dialogue', id: 'scn.prologue.quake' });
    expect(activeVictory(data.maps.dev_phases!, s)).toMatchObject({ type: 'escape', min: 3 });
    expect(s.firedTriggers).toContain('t_flee');
  });
  it('changes early when no foe is left and none is due', () => {
    const s = start((m) => (m.reinforcements = []));
    remove(s, ...enemies(s).map((u) => u.id!));
    const r = endPhase(s);
    expect(r.state.outcome).toBeNull();
    expect(r.state.objectivePhase).toBe(1);
    expect(changed(r.events)).toHaveLength(1);
  });
  it('changes when a trigger says advance_objective (a unit steps before the gate); a second one does nothing', () => {
    const s = start();
    unit(s, 'dev_marksman').pos = [6, 4];
    unit(s, 'dev_vanguard').pos = [5, 4];
    const r = applyCommand(data, s, { type: 'act', unit: unit(s, 'dev_marksman').uid, to: [6, 3], action: { kind: 'wait' } });
    expect(r.state.objectivePhase).toBe(1);
    expect(changed(r.events)).toHaveLength(1);
    expect(r.events).toContainEqual({ t: 'dialogue', id: 'scn.prologue.quake' });
    // the phase does not change again (once fired, nothing left to change to)
    const again = applyCommand(data, r.state, { type: 'act', unit: unit(r.state, 'dev_vanguard').uid, to: [5, 3], action: { kind: 'wait' } });
    expect(changed(again.events)).toEqual([]);
  });
  it('offers the escape action only after the change', () => {
    const s = start();
    const u = unit(s, 'dev_marksman');
    expect(availableActions(data, s, u, [7, 3]).some((o) => o.kind === 'escape')).toBe(false);
    s.objectivePhase = 1;
    expect(availableActions(data, s, u, [7, 0]).some((o) => o.kind === 'escape')).toBe(true);
    expect(availableActions(data, s, u, [7, 3]).some((o) => o.kind === 'escape')).toBe(false);
  });
  it('a map without then is not touched (survive is still won)', () => {
    const s = start((m) => {
      m.objectives.victory = { type: 'survive', turns: 3 };
      m.triggers = [];
      m.reinforcements = [];
    });
    remove(s, ...enemies(s).map((u) => u.id!));
    const r = endPhase(s);
    expect(r.state.outcome).toBe('victory');
    expect('objectivePhase' in r.state).toBe(false);
    expect(changed(r.events)).toEqual([]);
  });
});

describe('escape phase', () => {
  /** In the escape phase without foes: the company can walk out. */
  function escapePhase(): BattleState {
    const s = start((m) => (m.reinforcements = []));
    remove(s, ...enemies(s).map((u) => u.id!));
    s.objectivePhase = 1;
    return s;
  }
  it('Lucan leaves last: not while another able unit or a downed must unit is on the board', () => {
    let s = escapePhase();
    const lucan = unit(s, 'lucan');
    lucan.pos = [5, 1];
    expect(availableActions(data, s, lucan, [5, 0]).some((o) => o.kind === 'escape')).toBe(false);
    for (const id of ['dev_vanguard', 'dev_marksman']) remove(s, id);
    const avatar = unit(s, 'avatar');
    avatar.hp = 0;
    avatar.downed = true;
    expect(availableActions(data, s, unit(s, 'lucan'), [5, 0]).some((o) => o.kind === 'escape')).toBe(false);
    avatar.downed = false;
    avatar.hp = 1;
    avatar.pos = [6, 1];
    s = escapeAt(s, 'avatar', [6, 0]).state;
    expect(availableActions(data, s, unit(s, 'lucan'), [5, 0]).some((o) => o.kind === 'escape')).toBe(true);
  });
  it('is won once min units escaped with avatar and Lucan, not before', () => {
    let s = escapePhase();
    const spots: Record<string, Pos> = { dev_vanguard: [4, 1], dev_marksman: [7, 1], avatar: [6, 1], lucan: [5, 1] };
    for (const [id, p] of Object.entries(spots)) unit(s, id).pos = p;
    s = escapeAt(s, 'dev_vanguard', [4, 0]).state;
    s = escapeAt(s, 'dev_marksman', [7, 0]).state;
    s = escapeAt(s, 'avatar', [6, 0]).state;
    expect(s.outcome).toBeNull();
    const r = escapeAt(s, 'lucan', [5, 0]);
    expect(r.state.outcome).toBe('victory');
  });
  it('is not won when fewer than min escaped, nor when a must unit stays behind', () => {
    let s = escapePhase();
    remove(s, 'dev_vanguard', 'dev_marksman');
    unit(s, 'avatar').pos = [6, 1];
    unit(s, 'lucan').pos = [5, 1];
    s = escapeAt(s, 'avatar', [6, 0]).state;
    s = escapeAt(s, 'lucan', [5, 0]).state;
    expect(s.outcome).toBeNull(); // 2 of 3
    const t = escapePhase();
    const v = activeVictory(data.maps.dev_phases!, t) as { must?: string[] };
    expect(v.must).toEqual(['avatar', 'lucan']);
    unit(t, 'avatar').gone = 'dead';
    unit(t, 'avatar').pos = null;
    const r = endPhase(t);
    expect(r.state.outcome).toBe('defeat');
    expect(r.state.defeatReason).toBe('avatar');
  });
  it('is lost when Lucan falls in either phase', () => {
    for (const phase of [undefined, 1]) {
      const s = start();
      if (phase) s.objectivePhase = phase;
      const lucan = unit(s, 'lucan');
      lucan.gone = 'dead';
      lucan.pos = null;
      const r = endPhase(s);
      expect(r.state.outcome).toBe('defeat');
      expect(r.state.defeatReason).toBe('lucan');
    }
  });
});

describe('autoplay and replay', () => {
  it('wins dev_phases (hold, then escape with avatar and Lucan); the same commands replay to the same state', () => {
    for (const seed of [1, 2, 3]) {
      const s0 = start(undefined, seed);
      const r = autoplay(data, s0);
      expect(r.state.outcome, `seed ${seed}`).toBe('victory');
      expect(r.state.objectivePhase).toBe(1);
      expect(unit(r.state, 'avatar').gone).toBe('escaped');
      expect(unit(r.state, 'lucan').gone).toBe('escaped');
      expect(r.events.filter((e) => e.t === 'objectiveChanged')).toHaveLength(1);
      expect(replayBattle(data, s0, r.log)).toEqual(r.state);
      expect(structuredClone(r.state)).toEqual(r.state);
      expect(autoplay(data, start(undefined, seed)).events).toEqual(r.events);
    }
  }, 60_000);
});
