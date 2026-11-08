/**
 * Fix 1-3: in the enemy phase figures jumped back to the tiles they had left. A unit appearing mid-playback (`spawned`: a
 * reinforcement, a foe coming out of the fog) synced every figure from the state the playback had started with, so all who
 * had walked stood on their old tiles again, and the fallen showed again, until the final sync. The board is played here
 * without a scene: what draws is stubbed, the playback itself (`BoardView.play`) runs as it does in the game.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { BattleState, BattleUnit, GameData, GameEvent, Pos } from '../../src/core';
import { BoardView } from '../../src/render/board/board';
import type { UnitView } from '../../src/render/board/boardBase';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

const unit = (uid: string, team: BattleUnit['team'], pos: Pos): BattleUnit => ({ uid, team, pos, downed: false, gone: false, acted: false, status: [] }) as unknown as BattleUnit;

const view = (u: BattleUnit): UnitView =>
  ({ uid: u.uid, team: u.team, sprite: 'x', gear: '', x: u.pos![0], y: u.pos![1], offX: 0, offY: 0, lift: 0, alpha: 1, visible: true, desat: 0, flash: 0, downed: false }) as unknown as UnitView;

/** A board without a scene: figures are plain views, tweens jump to their end, nothing is drawn. */
function bareBoard(state: BattleState, seen: (b: BoardView, e: GameEvent) => void): { board: BoardView; synced: BattleState[] } {
  const synced: BattleState[] = [];
  const b = Object.create(BoardView.prototype) as BoardView;
  const units = new Map(state.units.map((u) => [u.uid, view(u)] as const));
  const noop = () => undefined;
  Object.assign(b, {
    data,
    state,
    units,
    disposed: false,
    skip: true,
    march: false,
    phase: null,
    done: new Set(),
    hooks: { onEvent: (e: GameEvent) => seen(b, e) },
    badges: { set: noop, setHp: noop, setDone: noop },
    rings: { add: noop },
    notePhase: noop,
    isVisible: () => true,
    centerOn: async () => undefined,
    setAnim: noop,
    tween: async (_ms: number, f: (t: number) => void) => f(1),
    wait: async () => undefined,
    unitSpriteId: () => 'x',
    gearKey: () => '',
    makeFigure: async () => ({ play: noop, dispose: noop }),
    setBleedLabel: noop,
    setPennant: noop,
    setStatuses: noop,
    setBadge: noop,
    removeUnit: (v: UnitView) => units.delete(v.uid),
    setState: async (s: BattleState) => void synced.push(s),
  });
  return { board: b, synced };
}

const tileOf = (b: BoardView, uid: string): [number, number, boolean] | undefined => {
  const v = (b as unknown as { units: Map<string, UnitView> }).units.get(uid);
  return v && [v.x, v.y, v.visible];
};

describe('board playback: a unit appearing mid-playback (fix 1-3)', () => {
  const start = { units: [unit('foe', 'enemy', [2, 2]), unit('fallen', 'enemy', [5, 5]), unit('hero', 'player', [8, 8])], phase: 'enemy' } as unknown as BattleState;
  const events: GameEvent[] = [
    { t: 'moved', unit: 'foe', path: [[2, 2], [3, 2], [4, 2]] } as GameEvent,
    { t: 'died', unit: 'fallen' } as GameEvent,
    { t: 'spawned', unit: 'late', at: [0, 9] } as GameEvent,
    { t: 'moved', unit: 'late', path: [[0, 9], [1, 9]] } as GameEvent,
  ];
  const final = { ...start, units: [unit('foe', 'enemy', [4, 2]), unit('hero', 'player', [8, 8]), unit('late', 'enemy', [1, 9])] } as unknown as BattleState;

  it('leaves the figures that walked or fell where the playback has them when another one appears', async () => {
    let atSpawn: Record<string, ReturnType<typeof tileOf>> = {};
    const { board, synced } = bareBoard(start, (b, e) => {
      if (e.t === 'spawned') atSpawn = { foe: tileOf(b, 'foe'), fallen: tileOf(b, 'fallen'), late: tileOf(b, 'late') };
    });
    await board.play(events, final, [...final.units]);
    expect(atSpawn.foe).toEqual([4, 2, true]);
    expect(atSpawn.fallen?.[2]).toBe(false);
    expect(atSpawn.late).toEqual([0, 9, true]);
    // the new figure walks on from its tile, and only the end of the playback syncs the board to the final state
    expect(tileOf(board, 'late')).toEqual([1, 9, true]);
    expect(tileOf(board, 'foe')).toEqual([4, 2, true]);
    expect(synced).toEqual([final]);
  });
});
