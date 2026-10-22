import { SUPPORT_RANKS, type EquipSlot, type GameData, type SupportRank } from '../defs';
import { newItem } from '../battle/create';
import { rollAffixes } from '../loot';
import { canEquip, itemCategory, itemDef, isRune, runeSlotCount, sellPrice } from '../rules/items';
import { loadoutSlots, promote } from '../rules/progression';
import { activeSkillIds } from '../rules/skills';
import { pendingRank } from '../rules/supports';
import type { CampaignState, ItemInstance, UnitRecord } from '../state';
import { clone } from '../util';
import { currentTier, merchantStock } from './campaign';

export type CampError =
  | 'not_enough_gold'
  | 'not_enough_materials'
  | 'unknown_item'
  | 'unknown_unit'
  | 'max_level'
  | 'not_upgradable'
  | 'not_for_sale'
  | 'cannot_equip'
  | 'bag_full'
  | 'no_slot'
  | 'not_available'
  | 'convoy_full';

export type CampResult = { ok: true; campaign: CampaignState } | { ok: false; error: CampError };

const ok = (campaign: CampaignState): CampResult => ({ ok: true, campaign });
const fail = (error: CampError): CampResult => ({ ok: false, error });

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

function takeItem(c: CampaignState, uid: string): ItemInstance | null {
  const loc = locateItem(c, uid);
  if (!loc) return null;
  if (!loc.owner) c.convoy = c.convoy.filter((i) => i.uid !== uid);
  else if (loc.slot === 'bag') loc.owner.bag = loc.owner.bag.filter((i) => i.uid !== uid);
  else delete loc.owner.equip[loc.slot as EquipSlot];
  return loc.inst;
}

export function buy(data: GameData, c0: CampaignState, defId: string): CampResult {
  const stock = merchantStock(data, currentTier(data, c0));
  const runeForSale = data.runes[defId]?.price !== undefined && (data.runes[defId]?.tier ?? 0) <= 1;
  if (!stock.includes(defId) && !runeForSale) return fail('not_for_sale');
  const price = itemDef(data, defId).price;
  if (c0.gold < price) return fail('not_enough_gold');
  if (c0.convoy.length >= data.balance.economy.convoySize) return fail('convoy_full');
  const c = clone(c0);
  c.gold -= price;
  c.convoy.push(newItem(c, defId, data));
  return ok(c);
}

export function buyOffer(data: GameData, c0: CampaignState, uid: string): CampResult {
  const offer = c0.offers.find((o) => o.uid === uid);
  if (!offer) return fail('not_for_sale');
  const price = offerPrice(data, offer);
  if (c0.gold < price) return fail('not_enough_gold');
  const c = clone(c0);
  c.gold -= price;
  c.offers = c.offers.filter((o) => o.uid !== uid);
  c.convoy.push(clone(offer));
  return ok(c);
}

export function offerPrice(data: GameData, inst: ItemInstance): number {
  return Math.floor(itemDef(data, inst).price * (1 + 0.5 * inst.affixes.length));
}

export function sell(data: GameData, c0: CampaignState, uid: string): CampResult {
  const loc = locateItem(c0, uid);
  if (!loc) return fail('unknown_item');
  const price = sellPrice(data, loc.inst);
  if (price <= 0) return fail('not_for_sale');
  const c = clone(c0);
  takeItem(c, uid);
  c.gold += price;
  return ok(c);
}

/** Moves an item (from convoy or any unit) into a unit's slot; the displaced item goes to the convoy. */
export function equipItem(data: GameData, c0: CampaignState, unitId: string, uid: string, slot: EquipSlot | 'bag'): CampResult {
  const c = clone(c0);
  const u = c.roster.find((r) => r.id === unitId);
  if (!u) return fail('unknown_unit');
  const loc = locateItem(c, uid);
  if (!loc) return fail('unknown_item');
  if (slot !== 'bag') {
    const err = canEquip(data, u, loc.inst, slot, activeSkillIds(data, u));
    if (err && err !== 'two_handed') return fail('cannot_equip');
  } else if (u.bag.length >= data.balance.bag.size && loc.owner !== u) return fail('bag_full');
  const inst = takeItem(c, uid)!;
  if (slot === 'bag') {
    u.bag.push(inst);
    return ok(c);
  }
  const old = u.equip[slot];
  u.equip[slot] = inst;
  if (old) c.convoy.push(old);
  if (slot === 'mainHand' && itemDef(data, inst).twoHanded && u.equip.offHand) {
    c.convoy.push(u.equip.offHand);
    delete u.equip.offHand;
  }
  if (slot === 'offHand' && u.equip.mainHand && itemDef(data, u.equip.mainHand).twoHanded) {
    c.convoy.push(u.equip.mainHand);
    delete u.equip.mainHand;
  }
  return ok(c);
}

export function unequip(c0: CampaignState, uid: string): CampResult {
  const c = clone(c0);
  const inst = takeItem(c, uid);
  if (!inst) return fail('unknown_item');
  c.convoy.push(inst);
  return ok(c);
}

function upgradable(data: GameData, inst: ItemInstance): boolean {
  const cat = itemCategory(itemDef(data, inst));
  return cat === 'weapon' || cat === 'armor' || cat === 'shield';
}

export function upgradeCost(data: GameData, inst: ItemInstance) {
  return data.balance.economy.upgradeCost.find((x) => x.level === inst.upgrade + 1);
}

export function upgrade(data: GameData, c0: CampaignState, uid: string): CampResult {
  const loc = locateItem(c0, uid);
  if (!loc) return fail('unknown_item');
  if (!upgradable(data, loc.inst)) return fail('not_upgradable');
  const cost = upgradeCost(data, loc.inst);
  if (!cost) return fail('max_level');
  if (c0.gold < cost.gold) return fail('not_enough_gold');
  for (const [m, n] of Object.entries(cost.materials)) if ((c0.materials[m] ?? 0) < n) return fail('not_enough_materials');
  const c = clone(c0);
  c.gold -= cost.gold;
  for (const [m, n] of Object.entries(cost.materials)) c.materials[m] = (c.materials[m] ?? 0) - n;
  locateItem(c, uid)!.inst.upgrade += 1;
  return ok(c);
}

export function rerollCost(data: GameData, inst: ItemInstance) {
  const r = data.balance.economy.rerollAffix;
  const epic = inst.affixes.length >= 2;
  return { gold: epic ? r.epicGold : r.gold, dust: epic ? r.epicArcaneDust : r.arcane_dust };
}

export function rerollAffix(data: GameData, c0: CampaignState, uid: string, index: number): CampResult {
  const loc = locateItem(c0, uid);
  if (!loc || !loc.inst.affixes[index]) return fail('unknown_item');
  const cost = rerollCost(data, loc.inst);
  if (c0.gold < cost.gold) return fail('not_enough_gold');
  if ((c0.materials.arcane_dust ?? 0) < cost.dust) return fail('not_enough_materials');
  const c = clone(c0);
  const inst = locateItem(c, uid)!.inst;
  const [next] = rollAffixes(data, c.rng, inst.def, 'rare', inst.affixes);
  if (!next) return fail('not_available');
  inst.affixes[index] = next;
  c.gold -= cost.gold;
  c.materials.arcane_dust = (c.materials.arcane_dust ?? 0) - cost.dust;
  return ok(c);
}

export function insertRune(data: GameData, c0: CampaignState, itemUid: string, runeUid: string): CampResult {
  const c = clone(c0);
  const loc = locateItem(c, itemUid);
  const rune = c.convoy.find((i) => i.uid === runeUid);
  if (!loc || !rune || !isRune(data, rune)) return fail('unknown_item');
  const rdef = data.runes[rune.def]!;
  const slots = runeSlotCount(data, loc.inst);
  const runes = [...loc.inst.runes];
  while (runes.length < slots) runes.push(null);
  const hasElement = runes.some((r) => r && data.runes[r]?.element);
  if (rdef.element && hasElement) return fail('no_slot');
  const idx = runes.findIndex((r) => r === null);
  if (idx < 0) return fail('no_slot');
  const d = itemDef(data, loc.inst);
  if (d.slot === 'body' && !rdef.element) return fail('no_slot');
  runes[idx] = rune.def;
  loc.inst.runes = runes;
  c.convoy = c.convoy.filter((i) => i.uid !== runeUid);
  return ok(c);
}

export function removeRune(data: GameData, c0: CampaignState, itemUid: string, index: number): CampResult {
  const c = clone(c0);
  const loc = locateItem(c, itemUid);
  const id = loc?.inst.runes[index];
  if (!loc || !id) return fail('unknown_item');
  loc.inst.runes[index] = null;
  c.convoy.push(newItem(c, id, data));
  return ok(c);
}

export function mergeRunes(data: GameData, c0: CampaignState, runeId: string): CampResult {
  const r = data.runes[runeId];
  if (!r?.element || !r.tier) return fail('unknown_item');
  const next = Object.values(data.runes).find((x) => x.element === r.element && x.tier === (r.tier ?? 0) + 1);
  if (!next) return fail('max_level');
  const m = data.balance.economy.runeMerge;
  const have = c0.convoy.filter((i) => i.def === runeId);
  if (have.length < m.count) return fail('not_enough_materials');
  const gold = m.goldPerTier * r.tier;
  if (c0.gold < gold) return fail('not_enough_gold');
  const c = clone(c0);
  const remove = new Set(have.slice(0, m.count).map((i) => i.uid));
  c.convoy = c.convoy.filter((i) => !remove.has(i.uid));
  c.convoy.push(newItem(c, next.id, data));
  c.gold -= gold;
  return ok(c);
}

export function removeScar(data: GameData, c0: CampaignState, unitId: string, scarIndex: number, useHerb = false): CampResult {
  const c = clone(c0);
  const u = c.roster.find((r) => r.id === unitId);
  if (!u || !u.scars[scarIndex]) return fail('unknown_unit');
  const cfg = data.balance.economy.scarRemoval;
  if (useHerb) {
    const herb = c.convoy.find((i) => i.def === cfg.altItem);
    if (!herb) return fail('not_enough_materials');
    c.convoy = c.convoy.filter((i) => i.uid !== herb.uid);
  } else {
    if (c.gold < cfg.gold) return fail('not_enough_gold');
    c.gold -= cfg.gold;
  }
  u.scars.splice(scarIndex, 1);
  return ok(c);
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

export function unlockSupport(data: GameData, c0: CampaignState, key: string): CampResult {
  const st = c0.supports[key];
  if (!st) return fail('not_available');
  const rank = pendingRank(data, st);
  if (!rank || rank === 'S') return fail('not_available');
  const c = clone(c0);
  c.supports[key]!.rank = rank;
  return ok(c);
}

export function setLoadout(data: GameData, c0: CampaignState, unitId: string, skills: string[]): CampResult {
  const c = clone(c0);
  const u = c.roster.find((r) => r.id === unitId);
  if (!u) return fail('unknown_unit');
  const valid = [...new Set(skills)].filter((s) => u.mastered.includes(s));
  u.loadout = valid.slice(0, loadoutSlots(data, u));
  return ok(c);
}

export function promoteUnit(data: GameData, c0: CampaignState, unitId: string, classId: string): CampResult {
  const c = clone(c0);
  const u = c.roster.find((r) => r.id === unitId);
  if (!u) return fail('unknown_unit');
  if (u.level < data.balance.levels.promoteFrom) return fail('not_available');
  const sealIdx = c.convoy.findIndex((i) => itemDef(data, i).use?.promote);
  const bagSeal = u.bag.findIndex((i) => itemDef(data, i).use?.promote);
  if (sealIdx < 0 && bagSeal < 0) return fail('not_enough_materials');
  if (sealIdx >= 0) c.convoy.splice(sealIdx, 1);
  else u.bag.splice(bagSeal, 1);
  promote(data, u, classId);
  return ok(c);
}

export { SUPPORT_RANKS };
