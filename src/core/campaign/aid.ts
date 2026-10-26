import type { GameData } from '../defs';
import type { CampaignState } from '../state';

/**
 * What the merchant asks for an item that costs `base`: the sum of the `priceMod` percentages granted for the running
 * act applied once, rounded down to whole coins. The one formula for the buy button and the purchase itself; selling stays
 * at `sellRatio` of the base price.
 */
export function shopPrice(data: GameData, c: CampaignState, base: number): number {
  const pct = c.priceMods.filter((m) => m.act === data.campaign.act).reduce((sum, m) => sum + m.pct, 0);
  return Math.max(0, Math.floor((base * (100 + pct)) / 100));
}
