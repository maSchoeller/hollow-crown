/** Checks of relic stages (story 11.9, items.md §5): conditions, images and skills of every stage. */
import type { GameData } from '../core/gameData';
import type { ContentRefs, Err } from './validateRefs';

export function validateRelics(data: GameData, err: Err, { conditions }: ContentRefs, itemImages?: Set<string>): void {
  for (const it of Object.values(data.items)) {
    if (!it.stages) continue;
    it.stages.forEach((st, i) => {
      const where = `${it.id}: stage ${i + 2}`;
      if (!st.when.length) err('items.yaml', `${where} needs a condition (when)`);
      conditions('items.yaml', st.when, where);
      if (itemImages && !itemImages.has(st.image)) err('items.yaml', `${where}: no image art/items/${st.image}.png`);
      for (const id of st.skills ?? []) {
        const sk = data.skills[id];
        if (!sk) err('items.yaml', `${where}: unknown skill ${id}`);
        else if (sk.trigger !== 'passive') err('items.yaml', `${where}: skill ${id} must be passive (it works while the relic is worn)`);
      }
    });
  }
}
