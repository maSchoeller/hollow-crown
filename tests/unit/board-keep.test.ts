/** The built board between screens: the deploy board goes on into its battle, the options leave it waiting, another map builds anew. */
import { afterEach, describe, expect, it } from 'vitest';
import type { BoardView } from '../../src/render/board/board';
import { boardKey, boardWaits, claimBoard, dropBoard, parkBoard } from '../../src/app/state/boardKeep';

/** What the keeper uses of a board: hold, dispose, alive. */
function fakeBoard() {
  const b = {
    held: '' as string,
    drops: 0,
    get alive() {
      return b.drops === 0;
    },
    hold(mode: string) {
      b.held = mode;
    },
    dispose() {
      b.drops++;
    },
  };
  return b as unknown as BoardView & { drops: number; held: string };
}

describe('board keeper', () => {
  afterEach(() => dropBoard());

  it('hands the parked board of the same map to the next screen, paused until then', () => {
    const board = fakeBoard();
    parkBoard(board, boardKey('m01'));
    expect(board.held).toBe('pause');
    expect(boardWaits(boardKey('m01'))).toBe(true);
    const got = claimBoard(boardKey('m01'));
    expect(got?.board).toBe(board);
    expect(got?.tag).toBeNull();
    expect(board.drops).toBe(0);
    // claimed once: the next screen builds its own
    expect(claimBoard(boardKey('m01'))).toBeNull();
  });

  it('gives back the tag it was parked with (the battle run: the options keep the camera, a restart frames anew)', () => {
    const board = fakeBoard();
    parkBoard(board, boardKey('m01'), 3);
    expect(claimBoard(boardKey('m01'))?.tag).toBe(3);
  });

  it('disposes the board for another map or other render options instead of handing it over', () => {
    const board = fakeBoard();
    parkBoard(board, boardKey('m01'));
    expect(boardWaits(boardKey('m02'))).toBe(false);
    expect(claimBoard(boardKey('m02'))).toBeNull();
    expect(board.drops).toBe(1);

    const other = fakeBoard();
    parkBoard(other, { ...boardKey('m01'), quality: 'low' });
    expect(claimBoard({ ...boardKey('m01'), quality: 'high' })).toBeNull();
    expect(other.drops).toBe(1);
  });

  it('builds anew when another scene took the stage meanwhile (the host drops the parked board)', () => {
    const board = fakeBoard();
    parkBoard(board, boardKey('m01'));
    board.dispose();
    expect(boardWaits(boardKey('m01'))).toBe(false);
    expect(claimBoard(boardKey('m01'))).toBeNull();
  });

  it('drops the parked board when a screen without one follows, and replaces an older parked board', () => {
    const a = fakeBoard();
    const b = fakeBoard();
    parkBoard(a, boardKey('m01'));
    parkBoard(b, boardKey('m01'));
    expect(a.drops).toBe(1);
    dropBoard();
    expect(b.drops).toBe(1);
    expect(boardWaits(boardKey('m01'))).toBe(false);
  });
});
