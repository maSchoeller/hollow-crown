/** Relic stages from the campaign (story 11.9): nothing is stored, the stage follows `stages[].when` (architecture §5.3). */
import type { GameData } from '../gameData';
import type { RelicCtx } from '../rules/relics';
import type { CampaignState } from '../state';
import { conditionContext, evalConditions, type ConditionContext } from './conditions';

/** Stage of relic `defId` (1 sleeping, 2 awakening, 3 awake): 1 plus the number of its stages in a row whose `when` holds. */
export function relicStage(data: GameData, ctx: ConditionContext, defId: string): number {
  const stages = data.items[defId]?.stages ?? [];
  let n = 1;
  for (const st of stages) {
    if (!evalConditions(ctx, st.when)) break;
    n++;
  }
  return n;
}

/** Stages of all relics past stage 1, as `BattleState.relicStages` keeps them. */
export function relicStages(data: GameData, ctx: ConditionContext): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of Object.values(data.items)) {
    if (!d.stages) continue;
    const n = relicStage(data, ctx, d.id);
    if (n > 1) out[d.id] = n;
  }
  return out;
}

/** Relic context of a campaign for the rules outside a battle (camp, shop, troop); `null` campaign = every relic sleeps. */
export function relicCtx(data: GameData, c: CampaignState | null): RelicCtx {
  return c ? { relicStages: relicStages(data, conditionContext(data, c)) } : null;
}
