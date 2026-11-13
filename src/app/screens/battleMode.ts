/** Selection modes of the battle screen (Battle.tsx). */
import { availableActions, itemTiles, type ActionOption, type BattleState, type BattleUnit, type GameData, type Pos } from '../../core';

export type Mode =
  | { k: 'idle' }
  | { k: 'selected'; uid: string }
  | { k: 'moved'; uid: string; to: Pos }
  | { k: 'target'; uid: string; to: Pos; action: 'attack' | 'staff' | 'talk' | 'rescue' | 'command' | 'item' | 'steal' | 'ballista' | ClassKind; targets: string[]; item?: string; object?: string }
  /** `ballista`: the shot of that ballista (story 11.6) instead of an attack with a carried weapon */
  | { k: 'forecast'; uid: string; to: Pos; target: string; weapon?: string; aim?: boolean; ballista?: string }
  /** preview of Fernbergen / Anfeuern before it is confirmed */
  | { k: 'classPreview'; uid: string; to: Pos; action: 'farRescue' | 'cheer'; target: string; second?: string }
  /** Nachsetzen right after an attack (story 2.4): `to` is the chosen tile, null until one is tapped */
  | { k: 'pursue'; uid: string; to: Pos | null }
  /** rule card of a passive role (Halten, Nachsetzen), reached by a tap on its dock slot */
  | { k: 'passive'; uid: string; to: Pos }
  /** Wirken (story 2.5): pick a field in range (`at` null), then the preview of the affected fields and the confirmation */
  | { k: 'cast'; uid: string; to: Pos; at: Pos | null }
  /** Stehlen (story 2.6): the bag of the chosen foe is shown, one tap on an item takes it */
  | { k: 'steal'; uid: string; to: Pos; target: string }
  /** Falle legen / zurücknehmen (story 10.5): the valid fields are shown as range tiles, a tap on one does it; `item`: the trap set used (story 10.6) */
  | { k: 'tile'; uid: string; to: Pos; action: 'trap' | 'disarm'; item?: string };

/** The fields of a `tile` mode: those of Falle legen / Zurücknehmen, or (story 10.6) where the chosen trap set can go. */
export function tileModeTiles(data: GameData, s: BattleState, u: BattleUnit, mode: Extract<Mode, { k: 'tile' }>): Pos[] {
  if (mode.item) return itemTiles(data, s, u, mode.to, mode.item);
  return availableActions(data, s, u, mode.to).find((o) => o.kind === mode.action)?.tiles ?? [];
}

/** Class slot of the dock: role actions (Zielen, Fernbergen, Anfeuern, story 2.3) and the skill actions of the PoC classes. */
export const CLASS_KINDS: ActionOption['kind'][] = ['aim', 'farRescue', 'cheer', 'cast', 'trap', 'disarm', 'steal', 'staff', 'command', 'rally'];
/** Class actions with a preview and a confirmation before they run. */
export type ClassKind = 'aim' | 'farRescue' | 'cheer';

/**
 * Choosing a unit: one whose move is already done (Tauschen and Konvoi walk first and stay free actions, GDD Aktionsökonomie) goes
 * straight to its action bar on its own field. "Choose a destination" would promise a move the core no longer allows.
 */
export function selectMode(u: BattleUnit): Mode {
  return u.moved && u.pos ? { k: 'moved', uid: u.uid, to: u.pos } : { k: 'selected', uid: u.uid };
}

/** "Back" from the action bar: to the destination choice while the move is only planned, else the unit is let go (it stays ready). */
export function backFromMoved(u: BattleUnit): Mode {
  return u.moved ? { k: 'idle' } : { k: 'selected', uid: u.uid };
}
