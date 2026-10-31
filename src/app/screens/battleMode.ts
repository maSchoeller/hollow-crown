/** Selection modes of the battle screen (Battle.tsx). */
import type { ActionOption, Pos } from '../../core';

export type Mode =
  | { k: 'idle' }
  | { k: 'selected'; uid: string }
  | { k: 'moved'; uid: string; to: Pos }
  | { k: 'target'; uid: string; to: Pos; action: 'attack' | 'staff' | 'talk' | 'rescue' | 'command' | 'item' | 'steal' | ClassKind; targets: string[]; item?: string }
  | { k: 'forecast'; uid: string; to: Pos; target: string; weapon?: string; aim?: boolean }
  /** preview of Fernbergen / Anfeuern before it is confirmed */
  | { k: 'classPreview'; uid: string; to: Pos; action: 'farRescue' | 'cheer'; target: string }
  /** Nachsetzen right after an attack (story 2.4): `to` is the chosen tile, null until one is tapped */
  | { k: 'pursue'; uid: string; to: Pos | null }
  /** rule card of a passive role (Halten, Nachsetzen), reached by a tap on its dock slot */
  | { k: 'passive'; uid: string; to: Pos }
  /** Wirken (story 2.5): pick a field in range (`at` null), then the preview of the affected fields and the confirmation */
  | { k: 'cast'; uid: string; to: Pos; at: Pos | null }
  /** Stehlen (story 2.6): the bag of the chosen foe is shown, one tap on an item takes it */
  | { k: 'steal'; uid: string; to: Pos; target: string };

/** Class slot of the dock: role actions (Zielen, Fernbergen, Anfeuern, story 2.3) and the skill actions of the PoC classes. */
export const CLASS_KINDS: ActionOption['kind'][] = ['aim', 'farRescue', 'cheer', 'cast', 'steal', 'staff', 'command', 'rally'];
/** Class actions with a preview and a confirmation before they run. */
export type ClassKind = 'aim' | 'farRescue' | 'cheer';
