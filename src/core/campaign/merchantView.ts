/**
 * The merchant's list for one shopper (story 16.17): what the figure can wear grouped by place, what changes for it, and what it
 * cannot wear with the reason. For the convoy medallion every row carries the figures that can hold the item instead.
 * Pure: the screen only draws it; prices come from the functions the commands charge with.
 */
import { itemDef, type EquipError } from '../rules/items';
import { changeList, type ChangeResult } from '../rules/changes';
import type { GameData } from '../gameData';
import type { CampaignState, ItemInstance, UnitRecord } from '../state';
import { dailyOffersOpen, shopPrice } from './aid';
import { buyPlan, type BuyPlan } from './buyFor';
import { offerPrice, usableBy } from './camp';
import { shopStock } from './campaign';

/** The shopper of the convoy medallion (no figure). */
export const CONVOY_SHOPPER = 'convoy';

/** The groups of the list, in order (the place of the item's kind). */
export const MERCHANT_GROUPS = ['weapon', 'offHand', 'head', 'body', 'accessory', 'bag'] as const;
export type MerchantGroup = (typeof MERCHANT_GROUPS)[number];

/** What a row buys: an item of the stock (def id) or a deal of the day (uid). */
export type MerchantPick = { kind: 'stock'; id: string } | { kind: 'offer'; uid: string };

export interface MerchantRow {
  /** stable list key (`id` of the stock or `offer:<uid>`) */
  key: string;
  pick: MerchantPick;
  inst: ItemInstance;
  price: number;
  /** a deal of the day (marked in the list) */
  offer: boolean;
  /** the plan for the shopper (`null` in convoy mode) */
  plan: BuyPlan | null;
  /** what changes against what is worn (`null`: nothing to compare, e.g. supplies, or convoy mode) */
  change: ChangeResult | null;
  /** the figure already wears this very item in the place */
  same: boolean;
  /** convoy mode: the figures that can hold the item */
  users: UnitRecord[];
}

export interface MerchantList {
  mode: 'unit' | 'convoy';
  unit?: UnitRecord;
  groups: Array<{ group: MerchantGroup; rows: MerchantRow[] }>;
  /** unit mode: what the figure cannot wear, with the equip code as reason */
  cannot: Array<{ row: MerchantRow; error: EquipError | 'duplicate_accessory' }>;
}

const groupOf = (data: GameData, inst: ItemInstance): MerchantGroup => {
  const slot = itemDef(data, inst).slot;
  return slot === 'mainHand' ? 'weapon' : slot;
};

/** The shop's rows (the deals of the day first, then the range), each with its price. */
function entries(data: GameData, c: CampaignState): Array<Pick<MerchantRow, 'key' | 'pick' | 'inst' | 'price' | 'offer'>> {
  const out: Array<Pick<MerchantRow, 'key' | 'pick' | 'inst' | 'price' | 'offer'>> = [];
  if (dailyOffersOpen(data, c)) {
    for (const o of c.offers) out.push({ key: `offer:${o.uid}`, pick: { kind: 'offer', uid: o.uid }, inst: o, price: offerPrice(data, o, c), offer: true });
  }
  for (const id of shopStock(data, c)) {
    const inst: ItemInstance = { uid: `shop-${id}`, def: id, upgrade: 0, affixes: [], runes: [] };
    out.push({ key: id, pick: { kind: 'stock', id }, inst, price: shopPrice(data, c, itemDef(data, id).price), offer: false });
  }
  return out;
}

/** `who` is a figure's id or `CONVOY_SHOPPER`; an unknown id counts as the first figure. */
export function merchantList(data: GameData, c: CampaignState, who: string): MerchantList {
  const unit = who === CONVOY_SHOPPER ? undefined : (c.roster.find((u) => u.id === who) ?? c.roster[0]);
  const groups = new Map<MerchantGroup, MerchantRow[]>(MERCHANT_GROUPS.map((g) => [g, []]));
  const cannot: MerchantList['cannot'] = [];
  for (const e of entries(data, c)) {
    if (!unit) {
      groups.get(groupOf(data, e.inst))!.push({ ...e, plan: null, change: null, same: false, users: usableBy(data, c, e.inst.def) });
      continue;
    }
    const plan = buyPlan(data, c, unit.id, e.inst);
    const bagItem = itemDef(data, e.inst).slot === 'bag';
    const change = !bagItem && plan.slot && plan.slot !== 'bag' ? changeList(data, unit, e.inst, { slot: plan.slot, base: plan.base }) : null;
    const row: MerchantRow = { ...e, plan, change, same: !bagItem && !!plan.base && plan.base.def === e.inst.def, users: [] };
    if (plan.error && plan.error !== 'bag_full' && plan.error !== 'convoy_full' && plan.error !== 'unknown_unit') cannot.push({ row, error: plan.error });
    else groups.get(groupOf(data, e.inst))!.push(row);
  }
  return { mode: unit ? 'unit' : 'convoy', unit, groups: MERCHANT_GROUPS.map((group) => ({ group, rows: groups.get(group)! })).filter((g) => g.rows.length > 0), cannot };
}
