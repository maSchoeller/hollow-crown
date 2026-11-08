/**
 * Objective phases (story 11.8): a `survive` goal with `then: escape` changes to the escape after its rounds, early when no foe is
 * left, or by the trigger action `advance_objective`; the trigger `objective_changed` follows. The escape is won when `min`
 * units escaped and every unit of `must` left the map, Lucan last. Built on `tests/fixtures/maps/dev_phases.yaml`.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { mapSchema } from '../../src/content/schemaMap';
import { validateContent } from '../../src/content/validate';
import { addTexts } from '../../src/i18n';
import { goalKey, goalLine, goalStand, mustLine } from '../../src/ui/goalText';
import {
  activeVictory,
  advanceObjective,
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
  it('rejects a must unit named twice, of another team or one that can be left out; must without min is fine', () => {
    const m = devObjectiveMap('dev_phases');
    const v = m.objectives.victory as Extract<MapDef['objectives']['victory'], { type: 'survive' }>;
    v.then = { type: 'escape', area: v.then!.area, must: ['avatar', 'lucan', 'avatar'] };
    expect(issuesOf(m)).toContain('escape: must names a unit twice');
    v.then = { type: 'escape', area: v.then.area, must: ['avatar', 'lucan'] };
    expect(issuesOf(m)).toEqual([]);
    v.then = { ...v.then, must: ['dev_brigand_w'] };
    expect(issuesOf(m)).toContain('escape: must names dev_brigand_w, who is not of team player');
    m.units = m.units.map((u) => (u.id === 'dev_marksman' ? { ...u, difficulty: ['hard' as const] } : u));
    v.then = { ...v.then, must: ['dev_marksman'] };
    expect(issuesOf(m)).toContain('escape: must names dev_marksman, who can be left out (requires or difficulty)');
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
  it('changes early even when a spawn trigger waits on objective_changed (those foes come after the change)', () => {
    const chaser = { team: 'enemy', class: 'brigand', level: 1, at: [5, 9], items: [{ def: 'iron_axe' }], ai: { profile: 'aggressive' } } as MapDef['units'][number];
    const s = start((m) => {
      m.reinforcements = [];
      m.triggers.push({ id: 't_chasers', when: { type: 'objective_changed' }, then: [{ action: 'spawn', units: [chaser] }] });
    });
    remove(s, ...enemies(s).map((u) => u.id!));
    const r = endPhase(s);
    expect(r.state.objectivePhase).toBe(1);
    expect(r.state.outcome).toBeNull();
    expect(r.events.some((e) => e.t === 'spawned')).toBe(true);
  });
  it('a second change does nothing: direct call or a trigger without once', () => {
    const s = start((m) => (m.triggers[0] = { ...m.triggers[0]!, once: false }));
    const events: GameEvent[] = [];
    advanceObjective(data, s, events);
    expect(changed(events)).toHaveLength(1);
    const again: GameEvent[] = [];
    advanceObjective(data, s, again);
    expect(again).toEqual([]);
    unit(s, 'dev_marksman').pos = [6, 4];
    const r = applyCommand(data, s, { type: 'act', unit: unit(s, 'dev_marksman').uid, to: [6, 3], action: { kind: 'wait' } });
    expect(r.state.firedTriggers).toContain('t_gate');
    expect(changed(r.events)).toEqual([]);
    expect(r.state.objectivePhase).toBe(1);
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
  it('is lost when a downed must unit is left with nobody to carry it; carried off and the carrier out, it is won', () => {
    let s = escapePhase();
    remove(s, 'dev_marksman');
    const spots: Record<string, Pos> = { dev_vanguard: [4, 1], lucan: [5, 1], avatar: [6, 1] };
    for (const [id, p] of Object.entries(spots)) unit(s, id).pos = p;
    const avatar = unit(s, 'avatar');
    avatar.hp = 0;
    avatar.downed = true;
    // the vanguard leaves; Lucan may not while Rhen lies there: no win, no loss yet
    s = escapeAt(s, 'dev_vanguard', [4, 0]).state;
    expect(s.outcome).toBeNull();
    expect(availableActions(data, s, unit(s, 'lucan'), [5, 0]).some((o) => o.kind === 'escape')).toBe(false);
    // were Lucan gone anyway, Rhen would lie alone with nobody to carry him: lost
    const lost = structuredClone(s);
    unit(lost, 'lucan').pos = null;
    unit(lost, 'lucan').gone = 'escaped';
    const r = endPhase(lost);
    expect(r.state.outcome).toBe('defeat');
    expect(r.state.defeatReason).toBe('avatar');
    // instead Lucan carries Rhen off (rescued) and leaves next round: must met, min (one per must unit) met
    s = start((m) => {
      m.reinforcements = [];
      const v = m.objectives.victory as Extract<MapDef['objectives']['victory'], { type: 'survive' }>;
      v.then = { ...v.then!, min: undefined };
    });
    remove(s, ...enemies(s).map((u) => u.id!), 'dev_marksman', 'dev_vanguard');
    s.objectivePhase = 1;
    unit(s, 'lucan').pos = [5, 1];
    const rhen = unit(s, 'avatar');
    rhen.pos = [6, 1];
    rhen.hp = 0;
    rhen.downed = true;
    s = applyCommand(data, s, { type: 'act', unit: unit(s, 'lucan').uid, to: [5, 1], action: { kind: 'rescue', target: rhen.uid } }).state;
    expect(unit(s, 'avatar').gone).toBe('rescued');
    expect(s.outcome).toBeNull();
    s = endPhase(s).state;
    const won = escapeAt(s, 'lucan', [5, 0]);
    expect(won.state.outcome).toBe('victory');
  });
  it('is lost when a must unit is gone another way (retreated)', () => {
    const s = escapePhase();
    const u = unit(s, 'avatar');
    u.pos = null;
    u.gone = 'retreated';
    const r = endPhase(s);
    expect(r.state.outcome).toBe('defeat');
    expect(r.state.defeatReason).toBe('avatar');
  });
  it('is lost on a turn limit in either phase', () => {
    for (const phase of [undefined, 1]) {
      const s = start((m) => (m.objectives.defeat = [...m.objectives.defeat, { type: 'turn_limit', turns: 1 }]));
      if (phase) s.objectivePhase = phase;
      for (const u of s.units) if (u.team === 'player') u.stats.def = 99;
      const r = endPhase(s);
      expect(r.state.outcome).toBe('defeat');
      expect(r.state.defeatReason).toBe('turns');
    }
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

describe('goal texts', () => {
  it('names both phases before, the escape stand and who still has to get out after the change', () => {
    addTexts('de', locales.de ?? {});
    const s = start();
    const map = data.maps.dev_phases!;
    expect(goalKey(map.objectives.victory)).toBe('survive_escape');
    expect(goalLine(map.objectives.victory, map)).toBe('Überlebt 3 Runden, dann flieht.');
    expect(goalStand(activeVictory(map, s), s)).toBe('');
    s.objectivePhase = 1;
    const v = activeVictory(map, s);
    expect(goalLine(v, map)).toBe('Entkommt über die Ausgänge.');
    expect(goalStand(v, s)).toBe('0/3 entkommen');
    expect(mustLine(v, s)).toMatch(/^Müssen noch entkommen: .+, Lucan$/);
    const lucan = unit(s, 'lucan');
    lucan.pos = null;
    lucan.gone = 'escaped';
    unit(s, 'dev_vanguard').gone = 'rescued';
    expect(goalStand(v, s)).toBe('2/3 entkommen');
    expect(mustLine(v, s)).not.toContain('Lucan');
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
