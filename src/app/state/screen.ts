/** Which screen is showing. A leaf module: state modules and screens read it, the mission flow writes it. */
import { signal } from '@preact/signals';
import type { BattleResult, ConsequenceLine } from '../../core';

/** Where the preparation and the troop lead back to: the view they were opened from. */
export type From = 'camp' | 'worldmap';

export type Screen =
  | { name: 'title' }
  | { name: 'campaigns' }
  | { name: 'newGame' }
  | { name: 'worldmap' }
  /** `rewards`: what the won node gave, for a scene line with `moment: reward` (the post scene of a mission) */
  | { name: 'dialogue'; id: string; next: () => void; rewards?: ConsequenceLine[] }
  /** `haunt`: the preparation of a haunt (story 5.6); `node` is the story node of its map */
  | { name: 'prep'; node: string; from?: From; haunt?: string }
  | { name: 'loading' }
  | { name: 'battle' }
  | { name: 'result'; result: BattleResult }
  /** `then`: where the last card leads (default the world map; the tone test of story 8.1 goes on to a scene) */
  | { name: 'farewell'; result: BattleResult; index: number; then?: Screen }
  | { name: 'defeat' }
  /** `tab`: a room opened at once; `unit`: the figure preselected in it (the academy, story 10.2) */
  | { name: 'camp'; tab?: string; unit?: string }
  | { name: 'troop'; unit?: string; from?: From }
  | { name: 'chronicle'; from?: From }
  | { name: 'wanted'; unit?: string; from?: From }
  | { name: 'options'; back: Screen }
  /** the rules handbook as a full-screen view (title, world map menu; epic 14) */
  | { name: 'handbook'; back: Screen }
  | { name: 'licenses'; back: Screen };

export const screen = signal<Screen>({ name: 'title' });
