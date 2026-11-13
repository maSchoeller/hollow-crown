/**
 * The four optional interactions of act 2 that the battle AI never uses, and that the automatic QA run of act 2 therefore
 * left untested: the crane lever of 2-7, the ford of 2-8, the gate lever of N5 and the stage of N6.
 *
 * The map tests of those missions (m2-7-kontor, m2-8-kronfeld, n5-kupfermine, n6-auemarkt) put a unit on the tile by hand
 * and call `runTriggers` directly. Here every interaction goes the whole way instead, so nothing between the deploy slot and
 * the effect can be broken without a test noticing:
 *   1. the tile is reachable — the game's own path search (`reachable` / `pathTo`, as `pnpm lab --path`) from the real deploy slot,
 *   2. the trigger fires from a real command — `move` / `act` through `applyCommand`, never `runTriggers` by hand,
 *   3. the effect is there and is worth something — the new terrain carries a way that was not there before, the goal advances,
 *   4. and it stays: a running battle is saved as a start snapshot plus its command log, so the log replayed from the snapshot
 *      (`replayBattle`, what loading a save does) has to give exactly the same state again.
 * The situations are the lab scenarios tests/fixtures/lab/{kontor-2-7-kran, kronfeld-2-8-furt, kupfermine-n5-gatter, auemarkt-n6-buehne}.yaml,
 * each with the foes removed so that the way to the interaction is the question, not the fight.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  availableActions,
  replayBattle,
  terrainAt,
  type BattleState,
  type Command,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';
import { labPath, labState, labUnit } from '../fixtures/lab';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

const dialogues = (ev: GameEvent[]): string[] => ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));

/** The way `unit` has to `to` as the game finds it: total cost (`null` = no way at all) and the terrain stepped on. */
function way(s: BattleState, unit: string, to: Pos): { cost: number | null; turns: number | null; terrain: string[] } {
  const a = labPath(data, s, unit, to);
  return {
    cost: a.cost,
    turns: a.cost === null ? null : Math.ceil(a.cost / a.budget),
    terrain: a.path.slice(1).map((p) => p.terrain),
  };
}

/**
 * Plays the commands one after the other, as the player's taps do, and checks on the way that the log is a save: the same
 * commands replayed from the start snapshot give the same state again (story: format 2 keeps a running battle as start + log).
 */
function play(start: BattleState, commands: Command[]): { state: BattleState; events: GameEvent[] } {
  let state = start;
  const events: GameEvent[] = [];
  for (const cmd of commands) {
    const r = applyCommand(data, state, cmd);
    state = r.state;
    events.push(...r.events);
  }
  expect(replayBattle(data, start, commands)).toEqual(state);
  return { state, events };
}

describe('2-7 "Das Kontor am Silbermeer": the crane lever', () => {
  const situation = () => labState(data, 'kontor-2-7-kran').state;
  const LEVER: Pos = [16, 15];
  const BESIDE: Pos = [15, 15];
  const SPAN: Pos[] = [
    [15, 12],
    [15, 13],
    [15, 14],
  ];

  it('has the tile beside the lever reachable from the deploy slot, over the south quay', () => {
    const s = situation();
    // the lever tile itself is no place to stand (terrain `lever` is closed to everyone on foot)
    expect(data.terrain.lever!.cost.foot).toBeNull();
    const fromSlot = way(s, 'lucan', BESIDE);
    expect(labUnit(s, 'lucan').pos).toEqual([7, 23]);
    expect(fromSlot.cost).toBe(16);
    expect(fromSlot.turns).toBe(4);
    expect(new Set(fromSlot.terrain)).toEqual(new Set(['plain', 'quay', 'road']));
  });

  it('swings the gangway over the basin when a unit walks up and pulls it, and the new span is a crossing that was not there before', () => {
    const start = situation();
    for (const p of SPAN) expect(terrainAt(start, p)).toBe('river');
    // before the crane the north quay is only to be had over the bridge in the middle: a long way around
    expect(way(start, 'avatar', [15, 11]).cost).toBe(13);

    const avatar = labUnit(start, 'avatar');
    expect(availableActions(data, start, avatar, avatar.pos!).some((a) => a.kind === 'lever')).toBe(false);
    expect(availableActions(data, start, avatar, BESIDE).find((a) => a.kind === 'lever')).toEqual({ kind: 'lever', object: 'l_crane' });

    const { state, events } = play(start, [{ type: 'act', unit: avatar.uid, to: BESIDE, action: { kind: 'lever', object: 'l_crane' } }]);
    expect(labUnit(state, 'avatar').pos).toEqual(BESIDE);
    expect(dialogues(events)).toEqual(['scn.m2_7.crane']);
    expect(state.firedTriggers).toContain('t_crane');
    for (const p of SPAN) expect(terrainAt(state, p)).toBe('footbridge');
    // and now the span is the short way to the north quay, four steps straight north
    const crossing = way(state, 'avatar', [15, 11]);
    expect(crossing.cost).toBe(4);
    expect(crossing.terrain).toEqual(['footbridge', 'footbridge', 'footbridge', 'quay']);
    // the lever stays down, so the trigger never fires a second time
    expect(state.objects.find((o) => o.id === 'l_crane')!.state).toBe('open');

    // loading the save (start snapshot + command log) brings the gangway back
    const loaded = replayBattle(data, start, [{ type: 'act', unit: avatar.uid, to: BESIDE, action: { kind: 'lever', object: 'l_crane' } }]);
    for (const p of SPAN) expect(terrainAt(loaded, p)).toBe('footbridge');
    expect(loaded.firedTriggers).toContain('t_crane');
    expect(terrainAt(start, SPAN[0]!)).toBe('river');
  });
});

describe('2-8 "Kronfeld": the ford in the east', () => {
  const situation = () => labState(data, 'kronfeld-2-8-furt').state;
  const FORD: Pos = [23, 5];

  it('has the ford reachable from the deploy slot, and only on foot: the shallows are closed to armour', () => {
    const s = situation();
    expect(terrainAt(s, FORD)).toBe('shallows');
    expect(data.terrain.shallows!.cost).toMatchObject({ foot: 3, armored: null });
    const fromSlot = way(s, 'lucan', FORD);
    expect(labUnit(s, 'lucan').pos).toEqual([12, 18]);
    expect(fromSlot.cost).toBe(26);
    expect(fromSlot.turns).toBe(6);
    expect(fromSlot.terrain.at(-1)).toBe('shallows');
  });

  it('starts the escape as soon as a unit wades in, and the ford really leads into the escape area', () => {
    const start = situation();
    const escape = data.maps.m2_8_kronfeld!.objectives.victory;
    expect(escape).toMatchObject({ type: 'survive', turns: 5, then: { type: 'escape', area: { rect: [0, 0, 29, 1] }, min: 6 } });
    expect(start.objectivePhase ?? 0).toBe(0);

    const avatar = labUnit(start, 'avatar');
    const commands: Command[] = [{ type: 'move', unit: avatar.uid, to: FORD }];
    const { state, events } = play(start, commands);
    expect(labUnit(state, 'avatar').pos).toEqual(FORD);
    expect(dialogues(events)).toContain('scn.m2_8.ford');
    expect(state.firedTriggers).toContain('t_ford');
    // the goal is in its second phase at once, in round 1 instead of after round 5
    expect(state.objectivePhase).toBe(1);
    expect(state.turn).toBe(1);
    // from the ford the north bank (row 1, inside the escape area) is four more steps through the water
    const out = way(state, 'avatar', [23, 1]);
    expect(out.cost).toBe(10);
    expect(out.terrain).toEqual(['shallows', 'shallows', 'shallows', 'grass']);

    const loaded = replayBattle(data, start, commands);
    expect(loaded.objectivePhase).toBe(1);
    expect(loaded.firedTriggers).toContain('t_ford');
    expect(start.objectivePhase ?? 0).toBe(0);
  });
});

describe('N5 "Glut unter dem Berg": the gate lever in the east tunnel', () => {
  const situation = () => labState(data, 'kupfermine-n5-gatter').state;
  const LEVER_TILE: Pos = [14, 12];
  const BESIDE: Pos = [14, 13];
  const GATE: Pos = [12, 9];
  /** the first tile behind the gate, on the way up to the bone hall */
  const BEHIND: Pos = [12, 8];

  it('has the tile beside the lever reachable from the deploy slot, through the east tunnel', () => {
    const s = situation();
    expect(terrainAt(s, LEVER_TILE)).toBe('lever');
    const fromSlot = way(s, 'lucan', BESIDE);
    expect(labUnit(s, 'lucan').pos).toEqual([6, 17]);
    expect(fromSlot.cost).toBe(12);
    expect(fromSlot.turns).toBe(3);
    expect(new Set(fromSlot.terrain)).toEqual(new Set(['vault']));
  });

  it('lifts the gate so the bone hall can be reached without a key, where no way led before', () => {
    const start = situation();
    expect(terrainAt(start, GATE)).toBe('gate_closed');
    // closed gate, closed middle door: from the east tunnel there is no way up at all
    expect(way(start, 'avatar', BEHIND).cost).toBeNull();
    expect(way(start, 'avatar', [7, 4]).cost).toBeNull();

    const avatar = labUnit(start, 'avatar');
    expect(availableActions(data, start, avatar, BESIDE).find((a) => a.kind === 'lever')).toEqual({ kind: 'lever', object: 'l_gate' });

    const commands: Command[] = [{ type: 'act', unit: avatar.uid, to: BESIDE, action: { kind: 'lever', object: 'l_gate' } }];
    const { state } = play(start, commands);
    expect(labUnit(state, 'avatar').pos).toEqual(BESIDE);
    expect(state.firedTriggers).toContain('t_gate');
    expect(terrainAt(state, GATE)).toBe('gate');
    // the open gate is the way into the bone hall, and the chronicle page up there is now to be had
    const up = way(state, 'avatar', BEHIND);
    expect(up.cost).toBe(7);
    expect(up.terrain).toEqual(['vault', 'vault', 'torch', 'vault', 'vault', 'gate', 'vault']);
    expect(way(state, 'avatar', [7, 4]).cost).not.toBeNull();

    const loaded = replayBattle(data, start, commands);
    expect(terrainAt(loaded, GATE)).toBe('gate');
    expect(loaded.firedTriggers).toContain('t_gate');
    expect(terrainAt(start, GATE)).toBe('gate_closed');
  });
});

describe('N6 "Die Gauklertruppe": the stage of the troupe', () => {
  const situation = () => labState(data, 'auemarkt-n6-buehne').state;
  const STAIRS: Pos = [8, 5];
  const STAGE: Pos = [9, 5];
  /** the market grass west of the terrace, at ground level: beside the stage, not on it */
  const BESIDE_STAGE: Pos = [8, 6];

  it('has the stage terrace on level 1, reachable from the deploy slot over the stairs only', () => {
    const s = situation();
    expect(data.terrain.terrace!.level).toBe(1);
    expect(data.terrain.stairs!.connector).toBe('stairs');
    expect([terrainAt(s, STAIRS), terrainAt(s, STAGE)]).toEqual(['stairs', 'terrace']);
    const fromSlot = way(s, 'lucan', STAGE);
    expect(labUnit(s, 'lucan').pos).toEqual([8, 15]);
    expect(fromSlot.cost).toBe(13);
    expect(fromSlot.turns).toBe(3);
    expect(fromSlot.terrain.slice(-2)).toEqual(['stairs', 'terrace']);
    // the troupe master waits up there, so whoever climbs the stage stands next to her
    expect(labUnit(s, 'troupe_master').pos).toEqual([10, 5]);
  });

  it('plays the talk with the master when a unit climbs onto the terrace', () => {
    const start = situation();
    const avatar = labUnit(start, 'avatar');
    const commands: Command[] = [{ type: 'move', unit: avatar.uid, to: STAGE }];
    const { state, events } = play(start, commands);
    expect(labUnit(state, 'avatar').pos).toEqual(STAGE);
    expect(dialogues(events)).toEqual(['scn.n6.master_talk']);
    expect(state.firedTriggers).toContain('t_stage');
    expect(data.scenes['scn.n6.master_talk']).toBeDefined();

    const loaded = replayBattle(data, start, commands);
    expect(loaded.firedTriggers).toContain('t_stage');
    expect(start.firedTriggers).not.toContain('t_stage');
  });

  it('keeps quiet while a unit only walks past the stage on the market floor', () => {
    const start = situation();
    const avatar = labUnit(start, 'avatar');
    expect(terrainAt(start, BESIDE_STAGE)).toBe('grass');
    const { state, events } = play(start, [{ type: 'move', unit: avatar.uid, to: BESIDE_STAGE }]);
    expect(dialogues(events)).toEqual([]);
    expect(state.firedTriggers).not.toContain('t_stage');
    // and from there one step up the stairs onto the stage still plays it
    const stepUp = play(state, [{ type: 'endPhase' }]).state;
    const up = play(stepUp, [{ type: 'move', unit: labUnit(stepUp, 'avatar').uid, to: STAGE }]);
    expect(dialogues(up.events)).toEqual(['scn.n6.master_talk']);
  });
});
