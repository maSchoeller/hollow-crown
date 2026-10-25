import type { EquipSlot, Pos } from '../defs';

export type Action =
  | { kind: 'wait' }
  | { kind: 'attack'; target: string; weapon?: string }
  | { kind: 'staff'; target: string; staff?: string }
  | { kind: 'item'; item: string; target?: string }
  | { kind: 'visit' }
  | { kind: 'chest' }
  | { kind: 'door'; object: string }
  | { kind: 'rescue'; target: string }
  | { kind: 'talk'; target: string }
  | { kind: 'command'; target: string }
  | { kind: 'rally' }
  /** class actions (story 2.3) */
  | { kind: 'aim'; target: string; weapon?: string }
  | { kind: 'farRescue'; target: string }
  | { kind: 'cheer'; target: string }
  /** Wirken (story 2.5): the tile must be in `castTargets` */
  | { kind: 'cast'; at: Pos }
  /** Öffnen (story 2.6, scout): opens a closed door or chest of `availableActions` without a key */
  | { kind: 'open'; object: string }
  /** Stehlen (story 2.6, scout): takes `item` out of the bag of the adjacent foe `target` */
  | { kind: 'steal'; target: string; item: string }
  | { kind: 'seize' }
  | { kind: 'escape' };

export interface TradeOp {
  item: string;
  to: string;
  slot: EquipSlot | 'bag';
}

/** Commands are the only way to change a battle (concept/10 §3). Plain JSON for the replay log. */
export type Command =
  /**
   * `path` (story 2.6): the way the player planned, from the unit's tile to `to`. The UI sends it on fog maps, where the plan
   * may lead through a foe the player does not see: the core then stops the unit before it (Hinterhalt, event `ambush`) and its
   * turn ends. Without `path` the core finds the way itself (the AI, tests, maps without fog).
   */
  | { type: 'move'; unit: string; to: Pos; path?: Pos[] }
  | { type: 'act'; unit: string; to: Pos; action: Action; path?: Pos[] }
  /** Nachsetzen (story 2.4): right after a skirmisher's attack, walk on with the rest of the movement */
  | { type: 'pursue'; unit: string; to: Pos; path?: Pos[] }
  | { type: 'trade'; unit: string; with: string; ops: TradeOp[] }
  | { type: 'equip'; unit: string; item: string; slot: EquipSlot | 'bag' }
  | { type: 'convoy'; unit: string; take?: string; put?: string; slot?: EquipSlot | 'bag' }
  | { type: 'endPhase' };

export type CommandError =
  | 'battle_over'
  | 'not_your_phase'
  | 'unknown_unit'
  | 'unit_exhausted'
  | 'not_your_unit'
  | 'already_moved'
  | 'unreachable'
  | 'occupied'
  | 'out_of_range'
  | 'invalid_target'
  | 'no_weapon'
  | 'no_key'
  | 'nothing_here'
  | 'already_used'
  | 'cannot_equip'
  | 'bag_full'
  | 'not_adjacent'
  | 'not_allowed'
  | 'no_pursue';
