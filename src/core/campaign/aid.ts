import type { GameData } from '../defs';
import { itemDef } from '../rules/items';
import type { CampaignState, ItemInstance } from '../state';

/**
 * Charges a refillable item holds in the running act (`data.campaign.act`): its own `charges`, raised to
 * `villageAid.charges` of balance.yaml for the potion when the company was granted Village aid (decision E4) for this act.
 * Used wherever charges are set to full: new items, the refill after a mission, the start of a battle.
 */
export function chargeCap(data: GameData, c: CampaignState, defId: string): number {
  const d = itemDef(data, defId);
  const base = d.charges ?? 0;
  const aid = data.balance.villageAid;
  return base > 0 && defId === aid.item && c.villageAid.includes(data.campaign.act) ? Math.max(base, aid.charges) : base;
}

/** Raises refillable items below the cap of the running act to it (a new act's Village aid reaches potions filled earlier). */
export function topUpCharges(data: GameData, c: CampaignState, items: ItemInstance[]): void {
  for (const i of items) {
    const d = itemDef(data, i);
    if (!d.refillAfterMission || !d.charges) continue;
    const cap = chargeCap(data, c, i.def);
    if ((i.charges ?? d.charges) < cap) i.charges = cap;
  }
}

/**
 * What the merchant asks for an item that costs `base`: the sum of the `priceMod` percentages granted for the running
 * act applied once, rounded down to whole coins. The one formula for the buy button and the purchase itself; selling stays
 * at `sellRatio` of the base price.
 */
export function shopPrice(data: GameData, c: CampaignState, base: number): number {
  const pct = c.priceMods.filter((m) => m.act === data.campaign.act).reduce((sum, m) => sum + m.pct, 0);
  return Math.max(0, Math.floor((base * (100 + pct)) / 100));
}
