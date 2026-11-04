/** Public types of the battle board (board.ts). */
import type { Element, GameEvent, Pos } from '../../core';
import type { Insets } from '../shared/camera';

export interface BoardHooks {
  onTap?(tile: Pos): void;
  onLongPress?(tile: Pos): void;
  /** two taps on a figure within `legibility.doubleTapMs` (story 13.9); while set, a tap on a figure waits that long for the second one */
  onDoubleTap?(tile: Pos): void;
  /** the mouse rests over another field (PC hover, story 13.6); `null` when it left the board */
  onHover?(tile: Pos | null): void;
  onCancel?(): void;
  /** called for events the UI presents (dialogue, phase banner, level up …); may await */
  onEvent?(e: GameEvent): Promise<void> | void;
  /** hp changed during playback (UI hp bars) */
  onUnitHp?(uid: string, hp: number): void;
  /** HUD covering the canvas edges, CSS px (camera keeps the map clear of it) */
  insets?(): Insets;
  /** a critical hit begins (story 8.6): the UI slides its band over the board; times in real ms, the board keeps its own count */
  onCutIn?(c: CutInEvent): void;
}

/** What the UI needs to draw the cut-in band of a critical hit. */
export interface CutInEvent {
  /** the attacker */
  unit: string;
  element?: Element;
  /** the skill that fired, if any (else the UI names the weapon) */
  skill?: string;
  inMs: number;
  holdMs: number;
  outMs: number;
}

export type GridLevel = 'off' | 'subtle' | 'strong';
/** Where a pinned element sits relative to its field's centre, in tiles (story 13.6, 13.9). */
export interface PinOffset {
  east?: number;
  south?: number;
  lift?: number;
}
export type FigureStyle = '3d' | '2d';
