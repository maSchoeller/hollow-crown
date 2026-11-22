/**
 * Buying for a figure (story 16.17): the merchant buys an item and puts it on the figure in one step. One pure plan
 * (place, what leaves, what keeps it out) that the UI preview and `validateCampaign`/`applyCampaign` both call.
 */
import type { EquipSlot } from '../defs';
import type { GameData } from '../gameData';
import { bagIsFull, canEquip, itemDef, slotFits, type EquipError } from '../rules/items';
import { activeSkillIds } from '../rules/skills';
import type { CampaignState, ItemInstance } from '../state';
import { clone } from '../util';
import { equipInto } from './gear';
import { relicCtx } from './relics';

/** Where a bought item goes (field `for` of `buy` and `buyOffer`); `replace` is the bag place that leaves (bag only). */
export interface BuyTarget {
  unit: string;
  slot: EquipSlot | 'bag';
  replace?: string;
}

/** Why a figure cannot get the item: the equip codes (`two_handed` resolves by itself), a full bag or a full convoy. */
export type BuyForError = Exclude<EquipError, 'two_handed'> | 'unknown_unit' | 'convoy_full';

export interface BuyPlan {
  /** the place the item goes to (`null` when the figure cannot hold it at all) */
  slot: EquipSlot | 'bag' | null;
  /** what the item replaces in that place (the item the change list compares with) */
  base: ItemInstance | null;
  /** everything that goes to the convoy because of it (the worn item, a two-hander also the off hand) */
  displaced: ItemInstance[];
  error: BuyForError | null;
}

/** The place for an item on a figure: weapons main hand, shields off hand, accessories a free place, else one without the same item. */
function pickSlot(data: GameData, c: CampaignState, unitId: string, inst: ItemInstance): EquipSlot | 'bag' {
  const d = itemDef(data, inst);
  if (d.slot === 'bag') return 'bag';
  if (d.slot !== 'accessory') return d.slot as EquipSlot;
  const u = c.roster.find((r) => r.id === unitId)!;
  const [a, b] = [u.equip.accessory1, u.equip.accessory2];
  // a free place first (unless the other one holds the same item), else the place whose neighbour is a different item
  if (!a && b?.def !== inst.def) return 'accessory1';
  if (!b && a?.def !== inst.def) return 'accessory2';
  if (a && b) return a.def === inst.def ? 'accessory2' : b.def === inst.def ? 'accessory1' : 'accessory1';
  return 'accessory1';
}

/**
 * What happens when `inst` (a probe or the bought item) is bought for `unitId`. Without `slot` the place is chosen;
 * with `slot` (the command's `for.slot`) that place is checked. `replace` is the bag place that leaves in a bag swap.
 * `convoy_full` counts the displaced items against `economy.convoySize` (the bought item itself does not take a convoy place).
 */
export function buyPlan(data: GameData, c: CampaignState, unitId: string, inst: ItemInstance, slot?: EquipSlot | 'bag', replace?: string): BuyPlan {
  const u = c.roster.find((r) => r.id === unitId);
  if (!u) return { slot: null, base: null, displaced: [], error: 'unknown_unit' };
  const place = slot ?? pickSlot(data, c, unitId, inst);
  const d = itemDef(data, inst);
  if (place === 'bag') {
    if (d.tags?.includes('convoyOnly') || d.tags?.includes('fixed')) return { slot: null, base: null, displaced: [], error: 'wrong_slot' };
    const bag = u.bag.filter((i) => i.uid !== replace);
    if (bagIsFull(data, bag, inst)) return { slot: 'bag', base: null, displaced: [], error: 'bag_full' };
  } else {
    if (!slotFits(d, place)) return { slot: null, base: null, displaced: [], error: 'wrong_slot' };
    const err = canEquip(data, u, inst, place, activeSkillIds(data, u, relicCtx(data, c)));
    if (err && err !== 'two_handed') return { slot: null, base: null, displaced: [], error: err };
  }
  // the dry run on a copy shows what leaves: everything that lands in the convoy
  const dry = clone(c);
  const du = dry.roster.find((r) => r.id === unitId)!;
  const before = dry.convoy.length;
  const base = place === 'bag' ? (replace ? (u.bag.find((i) => i.uid === replace) ?? null) : null) : (u.equip[place] ?? null);
  equipInto(data, dry, du, clone(inst), place, replace);
  const displaced = dry.convoy.slice(before);
  const error: BuyForError | null = dry.convoy.length > data.balance.economy.convoySize ? 'convoy_full' : null;
  return { slot: place, base, displaced, error };
}

/** Puts the bought `inst` onto the figure (mutates `c`; the displaced items go to the convoy). */
export function placeBought(data: GameData, c: CampaignState, inst: ItemInstance, target: BuyTarget): void {
  const u = c.roster.find((r) => r.id === target.unit)!;
  equipInto(data, c, u, inst, target.slot, target.replace);
}
