import { SUPPORT_RANKS, type Condition, type EquipSlot, type GameData, type RoomDef, type RuneDef, type SupportRank } from '../defs';
import { canEquip, isWeapon, itemCategory, itemDef, itemStatMods, slotFits, weaponProfile, type EquipError } from '../rules/items';
import { promotionTargets } from '../rules/progression';
import { activeSkillIds } from '../rules/skills';
import { computeStats } from '../rules/stats';
import { pendingRank, rankIndex } from '../rules/supports';
import type { CampaignState, ItemInstance, UnitRecord } from '../state';
import { clone } from '../util';
import { conditionContext, evalCondition } from './conditions';

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

/** Highest rank the campfire of the home unlocks (story 4.9): `balance.supports.campfireMaxRank` by campfire level. */
export function campfireMaxRank(data: GameData, c: CampaignState): SupportRank {
  const ranks = data.balance.supports.campfireMaxRank;
  return ranks[Math.min(ranks.length, Math.max(1, roomLevel(c, 'campfire'))) - 1]!;
}

/**
 * The rank pair `key` can unlock at the campfire now, or null: points at the threshold, within the pair's highest rank
 * (S only for core pairs) and what the campfire allows. Shared by the campfire, the troop mark and `unlockSupport`.
 */
export function unlockableRank(data: GameData, c: CampaignState, key: string): SupportRank | null {
  const st = c.supports[key];
  const rank = st ? pendingRank(data, st, key) : null;
  return rank && rankIndex(rank) <= rankIndex(campfireMaxRank(data, c)) ? rank : null;
}

/** The talk waiting at the campfire for pair `key`: both companions in the company, a rank to unlock and its scene. */
export function supportTalk(data: GameData, c: CampaignState, key: string): { key: string; rank: SupportRank; dialogue: string } | null {
  if (!key.split('|').every((id) => c.roster.some((r) => r.id === id))) return null;
  const rank = unlockableRank(data, c, key);
  const dialogue = rank ? data.supports[key]?.talks[rank] : undefined;
  return rank && dialogue ? { key, rank, dialogue } : null;
}

/** Support conversations that can be watched at the campfire ("Gespräche bereit"). */
export function availableSupportTalks(data: GameData, c: CampaignState): Array<{ key: string; rank: SupportRank; dialogue: string }> {
  return Object.keys(c.supports)
    .map((key) => supportTalk(data, c, key))
    .filter((x): x is { key: string; rank: SupportRank; dialogue: string } => !!x);
}

/** Level of a room of the home; camp stations and rooms not built yet are level 1. */
export const roomLevel = (c: CampaignState, id: string): number => c.home.rooms[id] ?? 1;

/** A room of the current home with its state: open, or locked by the first condition that fails. */
export interface RoomStatus {
  room: RoomDef;
  open: boolean;
  /** first unfulfilled `requires` condition (for the reason shown on a locked stone) */
  unmet?: Condition;
}

/**
 * The rooms of the current home in display order (story 6.3): those that belong to `c.home.kind` and exist in
 * the act reached. Replaces the unlock list of the PoC (`facilities`); `requires` is evaluated like every condition.
 */
export function homeRooms(data: GameData, c: CampaignState): RoomStatus[] {
  const ctx = conditionContext(data, c);
  return Object.values(data.rooms)
    .filter((r) => r.homes.includes(c.home.kind) && r.fromAct <= ctx.act)
    .map((room) => {
      const unmet = room.requires.find((x) => !evalCondition(ctx, x));
      return { room, open: !unmet, unmet };
    });
}

/** Mercenaries are the company members without a story character (hired in the tavern). */
export const isMercenary = (u: UnitRecord): boolean => !u.charId;

/** Company members counted against the limits: story companions and hired mercenaries. */
export function armyCount(c: CampaignState): { companions: number; mercenaries: number } {
  const mercenaries = c.roster.filter(isMercenary).length;
  return { companions: c.roster.length - mercenaries, mercenaries };
}

/** Gold a mercenary of this level costs in the tavern (balance.yaml `recruitCost`). */
export function hireCost(data: GameData, level: number): number {
  const r = data.balance.economy.recruitCost;
  return r.base + r.perLevel * level;
}

/** Why a mercenary cannot be hired now, or null. Companions join through the story and ignore the mercenary limit. */
export function hireError(data: GameData, c: CampaignState, offerId: string): 'not_available' | 'army_full' | 'not_enough_gold' | null {
  const offer = c.tavern.find((u) => u.id === offerId);
  if (!offer) return 'not_available';
  if (armyCount(c).mercenaries >= data.balance.economy.mercenaryLimit) return 'army_full';
  return c.gold < hireCost(data, offer.level) ? 'not_enough_gold' : null;
}

/** Highest upgrade the smith of this home reaches (rooms.yaml level via `balance.economy.smithMaxUpgrade`). */
export function upgradeLimit(data: GameData, c: CampaignState): number {
  const caps = data.balance.economy.smithMaxUpgrade;
  return caps[Math.min(roomLevel(c, 'smith'), caps.length) - 1]!;
}

/** The smith rerolls affixes from `rerollFromSmithLevel` on. */
export const rerollAllowed = (data: GameData, c: CampaignState): boolean => roomLevel(c, 'smith') >= data.balance.economy.rerollFromSmithLevel;

/** What one more upgrade level adds (same functions as in battle), for the smith's list. */
export function upgradePreview(data: GameData, inst: ItemInstance): Array<{ key: 'mt' | 'hit' | 'def' | 'res'; delta: number }> {
  const next = { ...inst, upgrade: inst.upgrade + 1 };
  const out: Array<{ key: 'mt' | 'hit' | 'def' | 'res'; delta: number }> = [];
  if (isWeapon(itemDef(data, inst))) {
    const a = weaponProfile(data, next);
    const b = weaponProfile(data, inst);
    if (a.might !== b.might) out.push({ key: 'mt', delta: a.might - b.might });
    if (a.hit !== b.hit) out.push({ key: 'hit', delta: a.hit - b.hit });
  } else {
    const a = itemStatMods(data, next);
    const b = itemStatMods(data, inst);
    if ((a.def ?? 0) !== (b.def ?? 0)) out.push({ key: 'def', delta: (a.def ?? 0) - (b.def ?? 0) });
    if ((a.res ?? 0) !== (b.res ?? 0)) out.push({ key: 'res', delta: (a.res ?? 0) - (b.res ?? 0) });
  }
  return out;
}

/** A unit may be promoted: level reached and the class has a promotion (the seal is checked by the command). */
export function canPromote(data: GameData, u: UnitRecord): boolean {
  return u.level >= data.balance.levels.promoteFrom && promotionTargets(data, u.classId).length > 0;
}

/** Experience bar of a unit: gained / needed for the next level; `full` at the top level. */
export function expProgress(data: GameData, u: UnitRecord): { exp: number; need: number; full: boolean } {
  const need = data.balance.experience.levelUpAt;
  return { exp: u.exp, need, full: u.level >= data.balance.levels.max };
}

/** Pairs of the unit with a conversation ready at the campfire. */
export function supportTalksOf(data: GameData, c: CampaignState, unitId: string): number {
  return availableSupportTalks(data, c).filter((x) => x.key.split('|').includes(unitId)).length;
}

/** What the equip list shows for a place: where the item is now and whether the unit may hold it there. */
export interface EquipCandidate {
  inst: ItemInstance;
  where: 'convoy' | 'bag';
  /** null = may be equipped (`two_handed` counts as allowed: the other hand goes to the convoy) */
  error: EquipError | null;
}

/**
 * Items for one place of a unit, from its bag and the convoy (story 6.2). Items of the wrong kind for the place
 * are left out; items the role may not hold stay in the list with the reason in `error`.
 */
export function equipCandidates(data: GameData, c: CampaignState, unit: UnitRecord, slot: EquipSlot | 'bag'): EquipCandidate[] {
  const skills = activeSkillIds(data, unit);
  const out: EquipCandidate[] = [];
  const consider = (inst: ItemInstance, where: 'convoy' | 'bag') => {
    const d = itemDef(data, inst);
    if (slot === 'bag') {
      if (where === 'bag' || d.tags?.includes('convoyOnly')) return;
      out.push({ inst, where, error: unit.bag.length >= data.balance.bag.size ? 'bag_full' : null });
      return;
    }
    if (d.tags?.includes('convoyOnly') || !slotFits(d, slot)) return;
    const err = canEquip(data, unit, inst, slot, skills);
    out.push({ inst, where, error: err === 'two_handed' ? null : err });
  };
  for (const i of unit.bag) consider(i, 'bag');
  for (const i of c.convoy) consider(i, 'convoy');
  return out;
}

/** One changed value of an equip preview; `better` decides the colour (green/red). */
export interface EquipDelta {
  key: 'mt' | 'hit' | 'crit' | 'rng' | 'wt' | 'hp' | 'str' | 'mag' | 'skl' | 'spd' | 'lck' | 'def' | 'res' | 'mov' | 'avoid' | 'load';
  delta: number;
  better: boolean;
}

/**
 * What changes when `inst` goes into `slot` of `unit`: the same formulas as the battle (`computeStats`,
 * `weaponProfile`), shown green/red against what is worn now. Empty for a bag place.
 */
export function equipPreview(data: GameData, unit: UnitRecord, inst: ItemInstance, slot: EquipSlot | 'bag'): EquipDelta[] {
  if (slot === 'bag') return [];
  const after = clone(unit);
  after.bag = after.bag.filter((i) => i.uid !== inst.uid);
  after.equip[slot] = clone(inst);
  const d = itemDef(data, inst);
  if (slot === 'mainHand' && d.twoHanded) delete after.equip.offHand;
  if (slot === 'offHand' && after.equip.mainHand && itemDef(data, after.equip.mainHand).twoHanded) delete after.equip.mainHand;
  const out: EquipDelta[] = [];
  const push = (key: EquipDelta['key'], delta: number, lowerIsBetter = false) => {
    if (delta) out.push({ key, delta, better: lowerIsBetter ? delta < 0 : delta > 0 });
  };
  const cur = unit.equip[slot];
  const weaponSlot = slot === 'mainHand' && isWeapon(d);
  if (weaponSlot) {
    const a = weaponProfile(data, inst);
    const b = cur && isWeapon(itemDef(data, cur)) ? weaponProfile(data, cur) : null;
    push('mt', a.might - (b?.might ?? 0));
    push('hit', a.hit - (b?.hit ?? 0));
    push('crit', a.crit - (b?.crit ?? 0));
    push('rng', a.range[1] - (b?.range[1] ?? 1));
    push('wt', a.weight - (b?.weight ?? 0), true);
  }
  const s0 = computeStats(data, unit);
  const s1 = computeStats(data, after);
  push('hp', s1.maxHp - s0.maxHp);
  for (const k of ['str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'] as const) push(k, s1.stats[k] - s0.stats[k]);
  push('mov', s1.mov - s0.mov);
  push('avoid', s1.avoid - s0.avoid);
  if (!weaponSlot) {
    push('hit', s1.hit - s0.hit);
    push('crit', s1.crit - s0.crit);
  }
  push('load', s1.load - s0.load, true);
  return out;
}

/** Company members who can hold an item in some place (the merchant's "For whom?"). */
export function usableBy(data: GameData, c: CampaignState, defId: string): UnitRecord[] {
  const d = itemDef(data, defId);
  if (d.slot === 'bag') return c.roster;
  const slots: EquipSlot[] = d.slot === 'accessory' ? ['accessory1', 'accessory2'] : [d.slot as EquipSlot];
  const probe: ItemInstance = { uid: 'probe', def: defId, upgrade: 0, affixes: [], runes: [] };
  return c.roster.filter((u) => {
    const skills = activeSkillIds(data, u);
    return slots.some((sl) => {
      const err = canEquip(data, u, probe, sl, skills);
      return !err || err === 'two_handed' || err === 'duplicate_accessory';
    });
  });
}

export { SUPPORT_RANKS };
