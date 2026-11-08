/**
 * Fix HP timing (map 1-5, enemy phase): a foe that came out of the fog walked up to the player's unit with the HP bar of after the
 * counter it was about to take. The board let it in from the state after the command, which already holds every blow of it.
 * Now the `spawned` event carries the HP the unit has when it appears (core and fog filter), the board shows it so, and the HUD
 * keeps the HP of before the command until each unit's own event (battleCommands.ts, checked in the browser). Lab scenario: tests/fixtures/lab/nebel-gegenschlag.yaml.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { type BattleState, type BattleUnit, type GameData, type GameEvent, type Pos, applyCommand, filterEvents, visibleState } from '../../src/core';
import { BoardView } from '../../src/render/board/board';
import type { UnitView } from '../../src/render/board/boardBase';
import { unitAtSpawn } from '../../src/render/board/spawnUnit';
import { labState } from '../fixtures/lab';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

type Spawned = Extract<GameEvent, { t: 'spawned' }>;

describe('fog filter: a foe let in carries its HP of that moment', () => {
  it('the raider out of the fog appears with full HP, though the counter leaves it with 3 after the command', () => {
    const before = labState(data, 'nebel-gegenschlag').state;
    const raider = before.units.find((u) => u.id === 'lab_raider')!;
    const { state: after, events } = applyCommand(data, before, { type: 'endPhase' });
    const shown = filterEvents(data, after, events, 'player', before);
    const spawn = shown.find((e): e is Spawned => e.t === 'spawned' && e.unit === raider.uid);
    expect(spawn?.at).toBeDefined();
    expect(spawn?.hp).toBe(raider.hp);
    // the scenario holds what it is about: the counter hits after the foe has come into sight
    const final = after.units.find((u) => u.uid === raider.uid)!;
    expect(final.hp).toBeLessThan(raider.hp);
    const counters = shown.filter((e) => e.t === 'strike' && e.defender === raider.uid && e.hit);
    expect(shown.indexOf(counters[0]!)).toBeGreaterThan(shown.indexOf(spawn!));
  });
});

describe('unitAtSpawn: the unit as it is when it appears', () => {
  const final = {
    uid: 'r1',
    pos: [4, 4],
    hp: 3,
    gone: 'dead',
    downed: false,
    status: [{ id: 'wet', turns: 2 }],
  } as unknown as BattleUnit;
  it('takes HP and tile from the event and stands, though it falls later in the command', () => {
    const e: Spawned = { t: 'spawned', unit: 'r1', reinforcement: false, at: [1, 1], hp: 20 };
    const u = unitAtSpawn(final, e, [e], 0);
    expect([u.hp, u.pos, u.gone, u.downed]).toEqual([20, [1, 1], undefined, false]);
  });
  it('rolls statuses back over the status events that follow it', () => {
    const e: Spawned = { t: 'spawned', unit: 'r1', reinforcement: true };
    const later: GameEvent[] = [e, { t: 'status', unit: 'r1', status: 'wet', on: true }, { t: 'status', unit: 'r1', status: 'burning', on: false }, { t: 'status', unit: 'x', status: 'slowed', on: false }];
    const u = unitAtSpawn(final, e, later, 0);
    expect(u.status.map((s) => s.id).sort()).toEqual(['burning']);
    // without a later event the final values stand
    expect(unitAtSpawn(final, e, [e], 0)).toMatchObject({ hp: 3, pos: [4, 4], status: [{ id: 'wet', turns: 2 }] });
  });
});

const unit = (uid: string, team: BattleUnit['team'], pos: Pos, hp: number): BattleUnit =>
  ({ uid, team, pos, hp, downed: false, gone: undefined, acted: false, status: [] }) as unknown as BattleUnit;

const view = (u: BattleUnit): UnitView =>
  ({ uid: u.uid, team: u.team, sprite: 'x', gear: '', x: u.pos![0], y: u.pos![1], offX: 0, offY: 0, lift: 0, alpha: 1, visible: true, desat: 0, flash: 0, downed: false }) as unknown as UnitView;

/** A board without a scene (as in board-playback.test.ts) that writes down every HP its bars and the HUD hook are given. */
function bareBoard(state: BattleState, bars: Array<[string, string, number]>): BoardView {
  const b = Object.create(BoardView.prototype) as BoardView;
  const units = new Map(state.units.map((u) => [u.uid, view(u)] as const));
  const noop = () => undefined;
  let at = '';
  Object.assign(b, {
    data,
    state,
    units,
    disposed: false,
    skip: true,
    march: false,
    phase: null,
    done: new Set(),
    hooks: { onEvent: (e: GameEvent) => void (at = e.t), onUnitHp: (uid: string, hp: number) => bars.push([`hud@${at}`, uid, hp]) },
    badges: { set: noop, setHp: (uid: string, hp: number) => bars.push([`bar@${at}`, uid, hp]), setDone: noop },
    rings: { add: noop },
    notePhase: noop,
    isVisible: () => true,
    centerOn: async () => undefined,
    setAnim: noop,
    tween: async (_ms: number, f: (t: number) => void) => f(1),
    tweenReal: async (_ms: number, f: (t: number) => void) => f(1),
    wait: async () => undefined,
    waitReal: async () => undefined,
    hitDelay: () => 0,
    facingOf: () => 's',
    floatText: noop,
    spawnFx: noop,
    unitSpriteId: () => 'x',
    gearKey: () => '',
    makeFigure: async () => ({ play: noop, dispose: noop }),
    setBleedLabel: noop,
    setPennant: noop,
    setStatuses: noop,
    setBadge: (u: BattleUnit) => bars.push([`badge@${at}`, u.uid, u.hp]),
    removeUnit: (v: UnitView) => units.delete(v.uid),
    setState: async () => undefined,
  });
  return b;
}

describe('board playback: the bars follow the events, not the final state', () => {
  it('a foe out of the fog shows full HP while it walks and strikes, and loses them only at the counter', async () => {
    const before = labState(data, 'nebel-gegenschlag').state;
    const raider = before.units.find((u) => u.id === 'lab_raider')!;
    const { state: after, events } = applyCommand(data, before, { type: 'endPhase' });
    const shown = filterEvents(data, after, events, 'player', before);
    const bars: Array<[string, string, number]> = [];
    const start = visibleState(data, before, 'player');
    await bareBoard(start, bars).play(shown, visibleState(data, after, 'player'), after.units);
    const mine = bars.filter(([, uid]) => uid === raider.uid);
    // appears (badge and HUD) with the HP it had, then each counter lowers it in turn down to the final HP
    expect(mine[0]!.slice(1)).toEqual([raider.uid, raider.hp]);
    expect(mine.filter(([k]) => k.startsWith('badge')).map(([, , hp]) => hp)).toEqual([raider.hp]);
    const hits = shown.filter((e): e is Extract<GameEvent, { t: 'strike' }> => e.t === 'strike' && e.defender === raider.uid && e.hit).map((e) => e.hpAfter);
    expect(mine.filter(([k]) => k.startsWith('bar')).map(([, , hp]) => hp)).toEqual(hits);
    expect(hits[hits.length - 1]).toBe(after.units.find((u) => u.uid === raider.uid)!.hp);
  });

  it('a reinforcement that falls later in the same command is let in standing, with the HP it came with', async () => {
    const start = { units: [unit('hero', 'player', [5, 5], 20)], phase: 'enemy' } as unknown as BattleState;
    const events: GameEvent[] = [
      { t: 'spawned', unit: 'r1', reinforcement: true, hp: 18 },
      { t: 'strike', attacker: 'hero', defender: 'r1', hit: true, crit: false, dmg: 18, hpAfter: 0, ranged: false, magic: false },
      { t: 'died', unit: 'r1' },
    ];
    const final = { ...start, units: [unit('hero', 'player', [5, 5], 20)] } as unknown as BattleState;
    const pool = [...final.units, { ...unit('r1', 'enemy', [5, 4], 0), gone: 'dead' } as BattleUnit];
    const bars: Array<[string, string, number]> = [];
    const board = bareBoard(start, bars);
    await board.play(events, final, pool);
    expect(bars.filter(([, uid]) => uid === 'r1').map(([k, , hp]) => `${k.split('@')[0]}:${hp}`)).toEqual(['hud:18', 'badge:18', 'hud:0', 'bar:0']);
  });
});
