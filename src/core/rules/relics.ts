/** Relic stages (story 11.9, items.md §5): a relic awakens with the story; its stage is a pure function of the campaign. */
import type { ItemDef } from '../defs';
import type { GameData } from '../gameData';
import { CoreInvariantError } from '../errors';
import type { ItemInstance } from '../state';

/**
 * Where the rules read relic stages from: the battle (`BattleState.relicStages`, set up from the campaign) or, outside a
 * battle, `relicCtx(data, campaign)`. `null` means "no story known": every relic sleeps (stage 1). Deliberately not
 * optional in the rule functions, so every caller decides and the preview never sees other values than the resolution.
 */
export type RelicCtx = { relicStages?: Readonly<Record<string, number>> } | null;

// own lookup instead of `itemDef`, so items.ts can use this module without an import cycle
function defOf(data: GameData, inst: ItemInstance | string): ItemDef {
  const id = typeof inst === 'string' ? inst : inst.def;
  const d = data.items[id];
  if (!d) throw new CoreInvariantError('unknown_item', { id });
  return d;
}

/** Stage (1 = sleeping) of the item definition `defId` under `rc`. */
export function relicStageOf(rc: RelicCtx, defId: string): number {
  return rc?.relicStages?.[defId] ?? 1;
}

/**
 * The item as the rules see it at its current stage: image and `statMods` of the stage replace those of the item, the
 * stage's `skills` add to `grantsSkill` (see `stageSkills`). Items without `stages`, and relics on stage 1, are returned as is.
 */
export function stagedItemDef(data: GameData, inst: ItemInstance | string, rc: RelicCtx): ItemDef {
  const d = defOf(data, inst);
  if (!d.stages) return d;
  const stage = Math.min(relicStageOf(rc, d.id), d.stages.length + 1);
  if (stage <= 1) return d;
  const st = d.stages[stage - 2]!;
  return { ...d, image: st.image, statMods: st.statMods ?? d.statMods };
}

/** Passive skills the item's current stage adds while it is equipped (no mastery needed). */
export function stageSkills(data: GameData, inst: ItemInstance | string, rc: RelicCtx): readonly string[] {
  const d = defOf(data, inst);
  if (!d.stages) return [];
  const stage = Math.min(relicStageOf(rc, d.id), d.stages.length + 1);
  return stage <= 1 ? [] : (d.stages[stage - 2]!.skills ?? []);
}
