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
  | { kind: 'seize' }
  | { kind: 'escape' };

export interface TradeOp {
  item: string;
  to: string;
  slot: EquipSlot | 'bag';
}

/** Commands are the only way to change a battle (concept/10 §3). Plain JSON for the replay log. */
export type Command =
  | { type: 'move'; unit: string; to: Pos }
  | { type: 'act'; unit: string; to: Pos; action: Action }
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
  | 'not_allowed';
