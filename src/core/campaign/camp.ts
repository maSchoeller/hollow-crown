import { SUPPORT_RANKS, type EquipSlot, type RecipeDef, type RuneDef, type SupportRank } from '../defs';
import type { GameData } from '../gameData';
import type { Condition, RoomDef } from '../storyDefs';
import { bagIsFull, canEquip, isWeapon, itemCategory, itemDef, itemStatMods, slotFits, weaponProfile, type EquipError } from '../rules/items';
import { levelCap, otherProPath, promotionTargets } from '../rules/progression';
import { activeSkillIds } from '../rules/skills';
import { relicCtx } from './relics';
import { computeStats } from '../rules/stats';
import { maxRank, pendingRank, rankIndex } from '../rules/supports';
import type { CampaignState, ItemInstance, UnitRecord } from '../state';
import { clone } from '../util';
import { shopPrice } from './aid';
import { castleTier, roomLevel } from './castle';
import { conditionContext, evalCondition } from './conditions';

export { castleTier, roomLevel };

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

export function offerPrice(data: GameData, inst: ItemInstance, c: CampaignState): number {
  return shopPrice(data, c, Math.floor(itemDef(data, inst).price * (1 + 0.5 * inst.affixes.length)));
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

/** Level of a room the current home has open (`homeRooms`), 0 when it has none (the camp, act 1 for rooms `fromAct: 2`, locked). */
export function openRoomLevel(data: GameData, c: CampaignState, roomId: string): number {
  return homeRooms(data, c).some((st) => st.room.id === roomId && st.open) ? roomLevel(c, roomId) : 0;
}

/**
 * Highest rune tier the enchanter of the home merges into (story 10.6): `economy.enchanterMergeMaxTier` by enchanter level, 0 without
 * an open enchanter. Merging tier N into N + 1 needs N + 1 ≤ this; setting and taking out runes never depends on it.
 */
export function runeMergeLimit(data: GameData, c: CampaignState): number {
  const level = openRoomLevel(data, c, 'enchanter');
  const tiers = data.balance.economy.enchanterMergeMaxTier;
  return level > 0 ? tiers[Math.min(level, tiers.length) - 1]! : 0;
}

/** Enchanter level from which merging into `tier` is allowed (for "ab Verzauberer Stufe n"); null when no level allows it. */
export function mergeLevelFor(data: GameData, tier: number): number | null {
  const i = data.balance.economy.enchanterMergeMaxTier.findIndex((max) => max >= tier);
  return i < 0 ? null : i + 1;
}

/** Why `mergeRunes` refuses, in the order it checks (id → availability → resources); null: it can merge now. */
export function mergeError(data: GameData, c: CampaignState, runeId: string): 'unknown_item' | 'max_level' | 'room_locked' | 'not_enough_materials' | 'not_enough_gold' | null {
  if (!data.runes[runeId]?.element || !data.runes[runeId]?.tier) return 'unknown_item';
  const m = runeMerge(data, runeId);
  if (!m) return 'max_level';
  if ((m.next.tier ?? 0) > runeMergeLimit(data, c)) return 'room_locked';
  if (c.convoy.filter((i) => i.def === runeId).length < m.count) return 'not_enough_materials';
  return c.gold < m.gold ? 'not_enough_gold' : null;
}

/** Why `craft` refuses (story 10.6), in the order it checks; null: the recipe can be made now. */
export type CraftError = 'unknown_item' | 'room_locked' | 'not_enough_materials' | 'not_enough_gold' | 'convoy_full';

/** One recipe as the workshop panel and `craft` see it: the materials with what the convoy holds, the gold and the first error. */
export interface CraftCost {
  recipe: RecipeDef | null;
  materials: Array<{ id: string; need: number; have: number }>;
  gold: number;
  error: CraftError | null;
}

/**
 * The one function behind the workshop panel and the command `craft` (story 10.6): a recipe of `recipes.yaml` is made while the
 * workshop of the home is open at its `roomLevel` or higher, the materials and the gold are there and the convoy has room.
 */
export function craftCost(data: GameData, c: CampaignState, recipeId: string): CraftCost {
  const recipe = data.recipes[recipeId] ?? null;
  if (!recipe) return { recipe, materials: [], gold: 0, error: 'unknown_item' };
  const materials = Object.entries(recipe.materials).map(([id, need]) => ({ id, need, have: c.materials[id] ?? 0 }));
  const out = { recipe, materials, gold: recipe.gold };
  const error: CraftError | null =
    openRoomLevel(data, c, 'workshop') < recipe.roomLevel
      ? 'room_locked'
      : materials.some((m) => m.have < m.need)
        ? 'not_enough_materials'
        : c.gold < recipe.gold
          ? 'not_enough_gold'
          : c.convoy.length >= data.balance.economy.convoySize
            ? 'convoy_full'
            : null;
  return { ...out, error };
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

/** Why the campfire holds back the next rank of a pair (story 10.8): the campfire level that opens it, or S only for core pairs. */
export type CampfireLock = { rank: SupportRank; reason: 'level'; level: number } | { rank: 'S'; reason: 'core' };

/**
 * The next rank of pair `key` that the campfire keeps locked, or null: a rank whose points are reached but which lies above
 * `campfireMaxRank` (with the campfire level that opens it), or S for a pair at A that is no core pair.
 */
export function campfireLock(data: GameData, c: CampaignState, key: string): CampfireLock | null {
  const st = c.supports[key];
  if (!st) return null;
  const rank = pendingRank(data, st, key);
  if (rank) {
    if (rankIndex(rank) <= rankIndex(campfireMaxRank(data, c))) return null;
    const level = data.balance.supports.campfireMaxRank.findIndex((r) => rankIndex(r) >= rankIndex(rank)) + 1;
    return level > 0 ? { rank, reason: 'level', level } : null;
  }
  return st.rank === 'A' && maxRank(data, key) === 'A' ? { rank: 'S', reason: 'core' } : null;
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

/** Why a room cannot be built up now, in the order `buildRoom` checks (architecture §8.1: id, availability, resources). */
export type RoomBuildError = 'unknown_room' | 'max_level' | 'room_locked' | 'not_enough_gold';

/**
 * The next build-up step of a room (story 10.1): the level it reaches, its gold, the first condition of that step that is
 * still open and the error `buildRoom` would give (null: it can be built now). `level` and `gold` are 0 when there is no
 * next step (unknown room, top level).
 */
export interface RoomBuild {
  level: number;
  gold: number;
  unmet?: Condition;
  error: RoomBuildError | null;
}

/**
 * The one function behind the build-up band, the room stones and `buildRoom` (story 10.1, replaces `nextRoomLevel`): only an
 * open room of the current home builds up, one level at a time from `levels` of rooms.yaml, while every `requires` of that
 * level holds and the gold is there. The camp never builds (its stations are the castle's rooms on level 1). The level
 * comes from `c.home.rooms` alone: a room keeps its level when its companions fall or leave.
 */
export function roomBuild(data: GameData, c: CampaignState, roomId: string): RoomBuild {
  const none = (error: RoomBuildError): RoomBuild => ({ level: 0, gold: 0, error });
  const st = data.rooms[roomId] ? homeRooms(data, c).find((r) => r.room.id === roomId) : undefined;
  if (!st?.open) return none('unknown_room');
  const level = roomLevel(c, roomId);
  const step = st.room.levels[level - 1];
  if (!step) return none('max_level');
  const unmet = step.requires.find((x) => !evalCondition(conditionContext(data, c), x));
  const out = { level: level + 1, gold: step.cost.gold, ...(unmet ? { unmet } : {}) };
  if (unmet || c.home.kind !== 'castle') return { ...out, error: 'room_locked' };
  return { ...out, error: c.gold < step.cost.gold ? 'not_enough_gold' : null };
}

/** Rooms of the current home that can be built up right now (head of the room list, "Räume 11 · n ausbaubar"). */
export const buildableRooms = (data: GameData, c: CampaignState): number => homeRooms(data, c).filter((st) => roomBuild(data, c, st.room.id).error === null).length;

/** Gold a scar costs at the healer of this home (`balance.economy.scarRemoval.goldByLevel` by healer level, story 10.1). */
export function scarCost(data: GameData, c: CampaignState): number {
  const g = data.balance.economy.scarRemoval.goldByLevel;
  return g[Math.min(roomLevel(c, 'healer'), g.length) - 1]!;
}

/** Mercenaries the tavern offers per round (`balance.economy.tavern.offersByLevel` by tavern level, story 10.1). */
export function tavernOfferCount(data: GameData, c: CampaignState): number {
  const n = data.balance.economy.tavern.offersByLevel;
  return n[Math.min(roomLevel(c, 'tavern'), n.length) - 1]!;
}

/** What a room opens later (the lessons of the memorial hall): each entry open, or locked by its first open condition. */
export function roomUnlocks(data: GameData, c: CampaignState, room: RoomDef): Array<{ id: string; open: boolean; unmet?: Condition }> {
  const ctx = conditionContext(data, c);
  return room.unlocks.map((u) => {
    const unmet = u.requires.find((x) => !evalCondition(ctx, x));
    return { id: u.id, open: !unmet, unmet };
  });
}

/** Mercenaries are the company members without a story character (hired in the tavern). */
export const isMercenary = (u: UnitRecord): boolean => !u.charId;

/** Company members counted against the limits: story companions and hired mercenaries. */
export function armyCount(c: CampaignState): { companions: number; mercenaries: number } {
  const mercenaries = c.roster.filter(isMercenary).length;
  return { companions: c.roster.length - mercenaries, mercenaries };
}

/**
 * Mercenary places now: the mercenary limit less the companions above their limit (the 20 + 6 places are one company, so a
 * companion who joins into a full army takes a mercenary's place, story 3.7). Never below zero.
 */
export function mercenaryRoom(data: GameData, c: CampaignState): number {
  const eco = data.balance.economy;
  return Math.max(0, eco.mercenaryLimit - Math.max(0, armyCount(c).companions - eco.armyLimit));
}

/** How far the company is over its limits: `companions` above `armyLimit` (information), `dismiss` mercenaries who have to go. */
export interface ArmyOver {
  companions: number;
  dismiss: number;
}

/**
 * The company's excess, or `null` when it fits (story 3.7). A lieutenant joins even into a full army; before the next
 * mission mercenaries have to go until the company fits again. Companions above their limit with no mercenary left to
 * dismiss block nothing (there is nobody to let go). Pure: the mission start, the world map and the tavern all read this.
 */
export function armyOverLimit(data: GameData, c: CampaignState): ArmyOver | null {
  const n = armyCount(c);
  const dismiss = Math.max(0, n.mercenaries - mercenaryRoom(data, c));
  if (dismiss === 0) return null;
  return { companions: Math.max(0, n.companions - data.balance.economy.armyLimit), dismiss };
}

/** Why a mercenary cannot be dismissed, or null: he must be in the company and hired (a story companion never leaves this way). */
export function dismissError(c: CampaignState, unitId: string): 'unknown_unit' | 'not_available' | null {
  const u = c.roster.find((r) => r.id === unitId);
  if (!u) return 'unknown_unit';
  return isMercenary(u) ? null : 'not_available';
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
  if (armyCount(c).mercenaries >= mercenaryRoom(data, c)) return 'army_full';
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
    // a difference: the relic stage replaces the same base on both sides, so the sleeping item is enough (story 11.9)
    const a = itemStatMods(data, next, null);
    const b = itemStatMods(data, inst, null);
    if ((a.def ?? 0) !== (b.def ?? 0)) out.push({ key: 'def', delta: (a.def ?? 0) - (b.def ?? 0) });
    if ((a.res ?? 0) !== (b.res ?? 0)) out.push({ key: 'res', delta: (a.res ?? 0) - (b.res ?? 0) });
  }
  return out;
}

/** Ember spark used for a promotion: convoy first, then the unit's bag. */
export function sealOf(data: GameData, c: CampaignState, unitId: string): { from: 'convoy' | 'bag'; index: number } | null {
  const conv = c.convoy.findIndex((i) => itemDef(data, i).use?.promote);
  if (conv >= 0) return { from: 'convoy', index: conv };
  const u = c.roster.find((r) => r.id === unitId);
  const bag = u ? u.bag.findIndex((i) => itemDef(data, i).use?.promote) : -1;
  return bag >= 0 ? { from: 'bag', index: bag } : null;
}

/** Ember sparks the company holds (convoy and bags): the academy shows them, its commands spend them. */
export function sparkCount(data: GameData, c: CampaignState): number {
  const isSpark = (i: ItemInstance) => !!itemDef(data, i).use?.promote;
  return c.convoy.filter(isSpark).length + c.roster.reduce((n, u) => n + u.bag.filter(isSpark).length, 0);
}

/** Level of the academy of the current home (story 10.2): 0 while it does not exist or is locked (`homeRooms`, `fromAct`). */
export function academyLevel(data: GameData, c: CampaignState): number {
  const st = homeRooms(data, c).find((r) => r.room.function === 'academy' && r.open);
  return st ? roomLevel(c, st.room.id) : 0;
}

export const academyOpen = (data: GameData, c: CampaignState): boolean => academyLevel(data, c) > 0;

/** Why a unit cannot be promoted yet, apart from the class chosen and the spark: 'level', 'pro' (no path left), or null. */
export function promoteBlock(data: GameData, u: UnitRecord): 'level' | 'pro' | null {
  if (promotionTargets(data, u.classId).length === 0) return 'pro';
  return u.level < data.balance.levels.promoteFrom ? 'level' : null;
}

/** A unit may be promoted: level reached, the class has a pro path and an academy is open (the spark is checked by the command). */
export function canPromote(data: GameData, c: CampaignState, u: UnitRecord): boolean {
  return academyOpen(data, c) && promoteBlock(data, u) === null;
}

/** Check of `promote` (story 10.2), in the order of the story: unit, class, availability, spark. */
export function promoteError(data: GameData, c: CampaignState, unitId: string, classId: string): 'unknown_unit' | 'unknown_class' | 'not_available' | 'not_enough_materials' | null {
  const u = c.roster.find((r) => r.id === unitId);
  if (!u) return 'unknown_unit';
  if (!promotionTargets(data, u.classId).includes(classId)) return 'unknown_class';
  if (!canPromote(data, c, u)) return 'not_available';
  return sealOf(data, c, unitId) ? null : 'not_enough_materials';
}

/** Check of `changeProPath` (academy level 2): another path of the same role, a pro without a second path, the gold. */
export function changePathError(data: GameData, c: CampaignState, unitId: string, classId: string): 'unknown_unit' | 'unknown_class' | 'not_available' | 'not_enough_gold' | null {
  const u = c.roster.find((r) => r.id === unitId);
  if (!u) return 'unknown_unit';
  if (otherProPath(data, u.classId) !== classId) return 'unknown_class';
  const cfg = data.balance.academy;
  if (academyLevel(data, c) < cfg.changePathFromLevel || data.classes[u.classId]?.tier !== 'pro' || u.secondPath) return 'not_available';
  return c.gold < cfg.changePathGold ? 'not_enough_gold' : null;
}

/** Check of `learnSecondPath` (academy level 3): a pro whose role has a second path not learned yet, and the sparks. */
export function secondPathError(data: GameData, c: CampaignState, unitId: string): 'unknown_unit' | 'not_available' | 'not_enough_materials' | null {
  const u = c.roster.find((r) => r.id === unitId);
  if (!u) return 'unknown_unit';
  const cfg = data.balance.academy;
  if (academyLevel(data, c) < cfg.secondPathFromLevel || data.classes[u.classId]?.tier !== 'pro' || u.secondPath || !otherProPath(data, u.classId)) return 'not_available';
  return sparkCount(data, c) >= cfg.secondPathSparks ? null : 'not_enough_materials';
}

/**
 * Experience bar of a unit: gained / needed for the next level; `full` at the act's level cap,
 * `capped` when that cap lies below the top level (the UI names the act).
 */
export function expProgress(
  data: GameData,
  u: UnitRecord,
  act = 1,
): { exp: number; need: number; full: boolean; capped: boolean; cap: number; act: number } {
  const need = data.balance.experience.levelUpAt;
  const cap = levelCap(data, act);
  const full = u.level >= cap;
  return { exp: u.exp, need, full, capped: full && cap < data.balance.levels.max, cap, act };
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
 * are left out; items the role may not hold stay in the list with the reason in `error`. `replace` (bag only) is the
 * item in the tapped bag place: it leaves when another comes in, so it does not count towards a full bag.
 */
export function equipCandidates(data: GameData, c: CampaignState, unit: UnitRecord, slot: EquipSlot | 'bag', replace?: string): EquipCandidate[] {
  const skills = activeSkillIds(data, unit, relicCtx(data, c));
  const bag = unit.bag.filter((i) => i.uid !== replace);
  const out: EquipCandidate[] = [];
  const consider = (inst: ItemInstance, where: 'convoy' | 'bag') => {
    const d = itemDef(data, inst);
    if (slot === 'bag') {
      if (where === 'bag' || d.tags?.includes('convoyOnly')) return;
      out.push({ inst, where, error: bagIsFull(data, bag, inst) ? 'bag_full' : null });
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
  const rc = relicCtx(data, c);
  return c.roster.filter((u) => {
    const skills = activeSkillIds(data, u, rc);
    return slots.some((sl) => {
      const err = canEquip(data, u, probe, sl, skills);
      return !err || err === 'two_handed' || err === 'duplicate_accessory';
    });
  });
}

export { SUPPORT_RANKS };

