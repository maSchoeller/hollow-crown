import { SUPPORT_RANKS, type EquipSlot, type GameData, type RuneDef, type SupportRank } from '../defs';
import { itemCategory, itemDef } from '../rules/items';
import { pendingRank } from '../rules/supports';
import type { CampaignState, ItemInstance, UnitRecord } from '../state';

/**
 * Camp helpers shared by the campaign command handlers (`apply.ts`) and the UI: lookups, costs and
 * previews. The UI shows what the handler will charge by calling the same functions.
 */

/** Where an item currently is: convoy or a unit's slot/bag. */
export function locateItem(c: CampaignState, uid: string): { inst: ItemInstance; owner?: UnitRecord; slot?: EquipSlot | 'bag' } | null {
  const conv = c.convoy.find((i) => i.uid === uid);
  if (conv) return { inst: conv };
  for (const u of c.roster) {
    for (const [slot, inst] of Object.entries(u.equip)) if (inst?.uid === uid) return { inst, owner: u, slot: slot as EquipSlot };
    const b = u.bag.find((i) => i.uid === uid);
    if (b) return { inst: b, owner: u, slot: 'bag' };
  }
  return null;
}

/** Removes an item from wherever it is (mutates `c`). */
export function takeItem(c: CampaignState, uid: string): ItemInstance | null {
  const loc = locateItem(c, uid);
  if (!loc) return null;
  if (!loc.owner) c.convoy = c.convoy.filter((i) => i.uid !== uid);
  else if (loc.slot === 'bag') loc.owner.bag = loc.owner.bag.filter((i) => i.uid !== uid);
  else delete loc.owner.equip[loc.slot as EquipSlot];
  return loc.inst;
}

export function offerPrice(data: GameData, inst: ItemInstance): number {
  return Math.floor(itemDef(data, inst).price * (1 + 0.5 * inst.affixes.length));
}

export function upgradable(data: GameData, inst: ItemInstance): boolean {
  const cat = itemCategory(itemDef(data, inst));
  return cat === 'weapon' || cat === 'armor' || cat === 'shield';
}

export function upgradeCost(data: GameData, inst: ItemInstance) {
  return data.balance.economy.upgradeCost.find((x) => x.level === inst.upgrade + 1);
}

export function rerollCost(data: GameData, inst: ItemInstance) {
  const r = data.balance.economy.rerollAffix;
  const epic = inst.affixes.length >= 2;
  return { gold: epic ? r.epicGold : r.gold, dust: epic ? r.epicArcaneDust : r.arcane_dust };
}

/** Next rune tier and the gold it costs to merge `runeId` into it; null when the rune cannot be merged. */
export function runeMerge(data: GameData, runeId: string): { next: RuneDef; gold: number; count: number } | null {
  const r = data.runes[runeId];
  if (!r?.element || !r.tier) return null;
  const next = Object.values(data.runes).find((x) => x.element === r.element && x.tier === (r.tier ?? 0) + 1);
  if (!next) return null;
  const m = data.balance.economy.runeMerge;
  return { next, gold: m.goldPerTier * r.tier, count: m.count };
}

/** Support conversations that can be watched at the campfire. */
export function availableSupportTalks(data: GameData, c: CampaignState): Array<{ key: string; rank: SupportRank; dialogue: string }> {
  const out: Array<{ key: string; rank: SupportRank; dialogue: string }> = [];
  for (const [key, st] of Object.entries(c.supports)) {
    const [a, b] = key.split('|') as [string, string];
    if (!c.roster.some((r) => r.id === a) || !c.roster.some((r) => r.id === b)) continue;
    const rank = pendingRank(data, st);
    if (!rank) continue;
    const dialogue = data.campaign.supportDialogues[key]?.[rank];
    if (dialogue) out.push({ key, rank, dialogue });
  }
  return out;
}

export { SUPPORT_RANKS };
