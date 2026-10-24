/** Which screen is showing. A leaf module: state modules and screens read it, the mission flow writes it. */
import { signal } from '@preact/signals';
import type { BattleResult } from '../../core';

export type Screen =
  | { name: 'title' }
  | { name: 'campaigns' }
  | { name: 'newGame' }
  | { name: 'worldmap' }
  | { name: 'dialogue'; id: string; next: () => void }
  | { name: 'prep'; node: string }
  | { name: 'battle' }
  | { name: 'result'; result: BattleResult }
  | { name: 'defeat' }
  | { name: 'camp'; tab?: string }
  | { name: 'troop'; unit?: string }
  | { name: 'options'; back: Screen }
  | { name: 'end' };

export const screen = signal<Screen>({ name: 'title' });
