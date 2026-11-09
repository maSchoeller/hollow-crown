/**
 * Relic stages the item pieces show (story 11.9): image, values and skills of an awakened relic. Display only: the rules
 * read the stages from the battle or the campaign themselves. The app keeps it up to date (`src/app/state/battle.ts`).
 */
import { signal } from '@preact/signals';
import { itemDef, type GameData, type ItemInstance, type RelicCtx } from '../core';

export const shownRelics = signal<RelicCtx>(null);

/** Whether an item is a relic (it has stages or the tag `relic`): its frame and rarity line show the hollow crown (DESIGN.md item-image). */
export function isRelic(data: GameData, item: ItemInstance | string): boolean {
  const def = itemDef(data, item);
  return !!def.stages || !!def.tags?.includes('relic');
}
