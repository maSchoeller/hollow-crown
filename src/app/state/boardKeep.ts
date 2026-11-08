/**
 * The built battle board between two screens. A board is built only when that is needed (another map, other render
 * settings): the deploy board goes on into its battle, the battle's board waits behind the options and after a restart.
 * A screen that leaves parks its board here; the next board screen claims it, or builds anew when it does not fit.
 */
import type { BoardView } from '../../render/board/board';
import { settings } from './settings';

/** What a board was built for: the same map and the same look can be taken over. */
export interface BoardKey {
  mapId: string;
  quality: string;
  figures: string;
}

/** The key of a board for `mapId` built with the render options now set. */
export function boardKey(mapId: string): BoardKey {
  return { mapId, quality: settings.value.quality, figures: settings.value.figures };
}

interface Parked {
  board: BoardView;
  key: BoardKey;
  /** what the parking screen showed (the battle session; `null` from the deploy board) */
  tag: unknown;
}

let parked: Parked | null = null;

/** A screen leaves: its board waits, not drawn, until the next screen claims it or `dropBoard` clears it. */
export function parkBoard(board: BoardView, key: BoardKey, tag: unknown = null): void {
  if (parked && parked.board !== board) parked.board.dispose();
  parked = { board, key, tag };
  board.hold('pause');
}

/**
 * The parked board when it was built for `key` and is still on the stage (another scene disposes it when it activates the
 * host), with the tag it was parked with; otherwise it is disposed and the caller builds anew.
 */
export function claimBoard(key: BoardKey): { board: BoardView; tag: unknown } | null {
  const p = parked;
  parked = null;
  if (!p) return null;
  if (fits(p, key)) return { board: p.board, tag: p.tag };
  p.board.dispose();
  return null;
}

/** Would `claimBoard(key)` take a board over (the battle screen then shows no loading cover)? */
export function boardWaits(key: BoardKey): boolean {
  return parked !== null && fits(parked, key);
}

function fits(p: Parked, key: BoardKey): boolean {
  return p.board.alive && p.key.mapId === key.mapId && p.key.quality === key.quality && p.key.figures === key.figures;
}

/** No board screen follows: the parked board leaves the stage. */
export function dropBoard(): void {
  parked?.board.dispose();
  parked = null;
}

