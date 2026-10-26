/** Which screen is showing. A leaf module: state modules and screens read it, the mission flow writes it. */
import { signal } from '@preact/signals';
import type { BattleResult } from '../../core';

/** Where the preparation and the troop lead back to: the view they were opened from. */
export type From = 'camp' | 'worldmap';

export type Screen =
  | { name: 'title' }
  | { name: 'campaigns' }
  | { name: 'newGame' }
  | { name: 'worldmap' }
  | { name: 'dialogue'; id: string; next: () => void }
  /** `haunt`: the preparation of a haunt (story 5.6); `node` is the story node of its map */
  | { name: 'prep'; node: string; from?: From; haunt?: string }
  | { name: 'loading' }
  | { name: 'battle' }
  | { name: 'result'; result: BattleResult }
  | { name: 'farewell'; result: BattleResult; index: number }
  | { name: 'defeat' }
  | { name: 'camp'; tab?: string }
  | { name: 'troop'; unit?: string; from?: From }
  | { name: 'chronicle'; from?: From }
  | { name: 'wanted'; unit?: string; from?: From }
  | { name: 'options'; back: Screen };

export const screen = signal<Screen>({ name: 'title' });
