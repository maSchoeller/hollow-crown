/** Story 15.11: which turns of an enemy phase the board plays together (march.ts); the core's events stay as they are. */
import { describe, expect, it } from 'vitest';
import type { GameEvent, Pos } from '../../src/core';
import { marchRun } from '../../src/render/board/march';

const turn = (unit: string): GameEvent => ({ t: 'aiTurn', unit }) as GameEvent;
const moved = (unit: string, ...path: Pos[]): GameEvent => ({ t: 'moved', unit, path }) as GameEvent;
const done = (unit: string): GameEvent => ({ t: 'exhausted', unit }) as GameEvent;
const phase: GameEvent = { t: 'phase', phase: 'player', turn: 2 } as GameEvent;

describe('marchRun', () => {
  it('joins foes that only walk, up to the first turn that does more', () => {
    const events = [
      turn('a'), moved('a', [0, 0], [0, 1]), done('a'),
      turn('b'), moved('b', [5, 5], [5, 6], [5, 7]), done('b'),
      turn('c'), moved('c', [9, 9], [9, 8]), { t: 'combat' } as GameEvent, done('c'),
    ];
    const run = marchRun(events, 0)!;
    expect(run.marches.map((m) => m.unit)).toEqual(['a', 'b']);
    expect(run.marches[1]!.path).toHaveLength(3);
    expect(run.exhausted).toEqual(['a', 'b']);
    expect(run.end).toBe(6);
    expect(events[run.end]).toEqual(turn('c'));
  });

  it('carries waiting foes between walkers, but leaves waiters after the last walker to the normal playback', () => {
    const events = [turn('a'), moved('a', [0, 0], [1, 0]), done('a'), turn('w'), done('w'), turn('b'), moved('b', [3, 3], [3, 4]), done('b'), turn('x'), done('x'), phase];
    const run = marchRun(events, 0)!;
    expect(run.marches.map((m) => m.unit)).toEqual(['a', 'b']);
    expect(run.exhausted).toEqual(['a', 'w', 'b']);
    expect(run.end).toBe(8);
  });

  it('needs at least two walkers', () => {
    expect(marchRun([turn('a'), moved('a', [0, 0], [1, 0]), done('a'), phase], 0)).toBeNull();
    expect(marchRun([turn('a'), done('a'), turn('b'), done('b')], 0)).toBeNull();
  });

  it('does not join a turn whose events belong to another unit or that ends in anything but a turn or a phase', () => {
    expect(marchRun([turn('a'), moved('b', [0, 0], [1, 0]), turn('c'), moved('c', [2, 2], [2, 3])], 0)).toBeNull();
    const strike = [turn('a'), moved('a', [0, 0], [1, 0]), { t: 'strike' } as GameEvent, turn('b'), moved('b', [2, 2], [2, 3]), turn('c'), moved('c', [4, 4], [4, 5])];
    expect(marchRun(strike, 0)).toBeNull();
    // from the next turn on, the run starts anew
    expect(marchRun(strike, 3)!.marches.map((m) => m.unit)).toEqual(['b', 'c']);
    // the battle ends after a way: that turn is not a march
    expect(marchRun([turn('a'), moved('a', [0, 0], [1, 0]), turn('b'), moved('b', [2, 2], [2, 3]), { t: 'battleEnd' } as GameEvent], 0)).toBeNull();
  });

  it('only starts at a turn', () => {
    expect(marchRun([moved('a', [0, 0], [1, 0]), turn('b'), moved('b', [1, 1], [1, 2])], 0)).toBeNull();
  });
});
