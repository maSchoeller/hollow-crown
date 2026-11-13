import type { GameData } from '../gameData';
import type { CampaignState } from '../state';
import { actOf } from './acts';
import { roomLevel } from './castle';

/**
 * Level of the merchant of the home (story 10.9): the room with `function: merchant`; the camp never builds, so it stays 1 there.
 * Its own helper here (not `openRoomLevel` in camp.ts) so the price formula has no import cycle through camp.ts.
 */
export function merchantLevel(data: GameData, c: CampaignState): number {
  const room = Object.values(data.rooms).find((r) => r.function === 'merchant');
  return room ? roomLevel(c, room.id) : 1;
}

/** The merchant's own discount of its level in percent (`economy.merchantDiscountByLevel`, story 10.9). */
export function merchantDiscount(data: GameData, c: CampaignState): number {
  const by = data.balance.economy.merchantDiscountByLevel;
  return by[Math.min(merchantLevel(data, c), by.length) - 1] ?? 0;
}

/**
 * The total change of the merchant's prices in percent (story 10.9): the `priceMod` percentages granted for the running act plus
 * the merchant's discount of its level, a discount of at most `economy.maxDiscountPct` (−30 → at most −30). The panel shows it as
 * a mark, `shopPrice` applies it.
 */
export function priceChangePct(data: GameData, c: CampaignState): number {
  const pct = c.priceMods.filter((m) => m.act === actOf(c)).reduce((sum, m) => sum + m.pct, 0) - merchantDiscount(data, c);
  return Math.max(-data.balance.economy.maxDiscountPct, pct);
}

/**
 * What the merchant asks for an item that costs `base`: `priceChangePct` applied once, rounded down to whole coins. The one formula
 * for the buy button and the purchase itself; selling stays at `sellRatio` of the base price.
 */
export function shopPrice(data: GameData, c: CampaignState, base: number): number {
  return Math.max(0, Math.floor((base * (100 + priceChangePct(data, c))) / 100));
}

/** The deal of the day (`c.offers`) is on sale: the merchant has at least `economy.dailyOfferFromMerchantLevel` (story 10.9). */
export const dailyOffersOpen = (data: GameData, c: CampaignState): boolean => merchantLevel(data, c) >= data.balance.economy.dailyOfferFromMerchantLevel;

/** Completed story missions over all acts (side quests do not count): the clock of the ember spark offer (story 10.9). */
export function storiesDone(data: GameData, c: CampaignState): number {
  const done = new Set(c.completed);
  return Object.values(data.acts).reduce((n, act) => n + act.nodes.filter((x) => x.kind === 'story' && done.has(x.id)).length, 0);
}

/**
 * Whether the merchant offers an ember spark now (story 10.9, `economy.emberShop`): from its level `fromMerchantLevel`, fewer than
 * `total` sold, the first at once, every further one only after one more completed story mission than at the last purchase.
 */
export function emberSparkOffered(data: GameData, c: CampaignState): boolean {
  const cfg = data.balance.economy.emberShop;
  if (merchantLevel(data, c) < cfg.fromMerchantLevel || c.emberShop.sold >= cfg.total) return false;
  return c.emberShop.lastSoldAtStory === null || storiesDone(data, c) > c.emberShop.lastSoldAtStory;
}

/** Price of the merchant's ember spark (`emberShop.item`): the item's own price, never discounted (product owner 2026-10-31, R2). */
export const emberSparkPrice = (data: GameData): number => data.items[data.balance.economy.emberShop.item]?.price ?? 0;
