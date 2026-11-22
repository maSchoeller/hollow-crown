/**
 * Story 16.16: the rules behind the enchanter's workbench, kept apart from the screen. One check for "this stone in this setting"
 * (`runeSetError`) serves `insertRune`, `buyRune` and the dimmed stones of the list; the stone list, the merge state and the stones
 * for sale come from here too. A setting is a place of `ItemInstance.runes` (index 0 the large, index 1 the small one).
 */
import type { RuneDef } from '../defs';
import type { GameData } from '../gameData';
import { itemDef, runeFits, runeSlotCount } from '../rules/items';
import type { CampaignState, ItemInstance } from '../state';
import { shopPrice } from './aid';
import { mergeError, mergeLevelFor, runeMerge } from './camp';

/** Why a stone does not go into a setting: no such setting, the piece takes no such stone, or it already carries another element rune. */
export type RuneSetError = 'bad_slot' | 'wrong_item' | 'element_taken';

/** The settings of a piece as ids, padded with empty ones up to its number of settings. */
export function runeSlots(data: GameData, inst: ItemInstance): Array<string | null> {
  const runes = [...inst.runes];
  while (runes.length < runeSlotCount(data, inst)) runes.push(null);
  return runes;
}

/** Why `runeId` cannot sit in setting `index` of `inst` (the first empty one when `index` is left out); null: it can. A taken setting is swapped. */
export function runeSetError(data: GameData, inst: ItemInstance, runeId: string, index?: number): RuneSetError | null {
  const rdef = data.runes[runeId];
  if (!rdef) return 'wrong_item';
  const runes = runeSlots(data, inst);
  const at = index ?? runes.indexOf(null);
  if (!Number.isInteger(at) || at < 0 || at >= runes.length) return 'bad_slot';
  if (!runeFits(data, itemDef(data, inst), rdef)) return 'wrong_item';
  if (rdef.element && runes.some((r, i) => i !== at && r && data.runes[r]?.element)) return 'element_taken';
  return null;
}

/** The runes of the piece after `runeId` sits in setting `index` (what the probe shows); the piece itself stays as it is. */
export function runesAfterSet(data: GameData, inst: ItemInstance, runeId: string, index: number): Array<string | null> {
  const runes = runeSlots(data, inst);
  runes[index] = runeId;
  return runes;
}

/** The first setting `runeId` fits, empty ones first; null when it fits none. */
export function defaultSetting(data: GameData, inst: ItemInstance, runeId: string): number | null {
  const runes = runeSlots(data, inst);
  const order = [...runes.keys()].sort((a, b) => Number(!!runes[a]) - Number(!!runes[b]));
  return order.find((i) => runeSetError(data, inst, runeId, i) === null) ?? null;
}

/** One kind of stone in the convoy: its tier, how many and one of its uids. */
export interface RuneStone {
  id: string;
  def: RuneDef;
  /** 1-3 */
  tier: number;
  count: number;
  uid: string;
}

const ELEMENT_ORDER = ['fire', 'wind', 'earth', 'water', 'light', 'dark'];

/** The stones in the convoy grouped by kind, element runes first (by element, then tier), auxiliary runes last. */
export function runeStones(data: GameData, c: CampaignState): RuneStone[] {
  const by = new Map<string, RuneStone>();
  for (const i of c.convoy) {
    const def = data.runes[i.def];
    if (!def) continue;
    const have = by.get(i.def);
    if (have) have.count += 1;
    else by.set(i.def, { id: i.def, def, tier: def.tier ?? 1, count: 1, uid: i.uid });
  }
  const rank = (s: RuneStone) => (s.def.element && !s.def.utility ? ELEMENT_ORDER.indexOf(s.def.element) : 99);
  return [...by.values()].sort((a, b) => rank(a) - rank(b) || a.tier - b.tier || a.id.localeCompare(b.id));
}

/** The merge state of a stone kind: how many of the needed stones the convoy holds, the gold and why it cannot merge (`mergeError`). */
export interface MergeStatus {
  error: ReturnType<typeof mergeError>;
  have: number;
  need: number;
  gold: number;
  /** the enchanter level from which the next tier is merged (for "from room level n") */
  fromLevel: number | null;
  next: RuneDef | null;
}

export function mergeStatus(data: GameData, c: CampaignState, runeId: string): MergeStatus {
  const m = runeMerge(data, runeId);
  return {
    error: mergeError(data, c, runeId),
    have: c.convoy.filter((i) => i.def === runeId).length,
    need: m?.count ?? 0,
    gold: m?.gold ?? 0,
    fromLevel: m ? mergeLevelFor(data, m.next.tier ?? 0) : null,
    next: m?.next ?? null,
  };
}

/** A stone the enchanter sells (tier I and auxiliary stones with a price) and what it costs now. */
export interface RuneOffer {
  id: string;
  def: RuneDef;
  price: number;
}

export function runeOffers(data: GameData, c: CampaignState): RuneOffer[] {
  return Object.values(data.runes)
    .filter((r) => r.price !== undefined && (r.tier ?? 0) <= 1 && data.items[r.id])
    .map((r) => ({ id: r.id, def: r, price: shopPrice(data, c, itemDef(data, r.id).price) }));
}

/** Why `buyRune` refuses, in the order it checks (stone for sale → piece → setting → gold → convoy for the stone that leaves); null: it can. */
export function buyRuneError(data: GameData, c: CampaignState, runeId: string, inst: ItemInstance | undefined, index: number): 'not_for_sale' | 'unknown_item' | 'no_slot' | 'not_enough_gold' | 'convoy_full' | null {
  const offer = runeOffers(data, c).find((o) => o.id === runeId);
  if (!offer) return 'not_for_sale';
  if (!inst) return 'unknown_item';
  if (runeSetError(data, inst, runeId, index)) return 'no_slot';
  if (c.gold < offer.price) return 'not_enough_gold';
  if (runeSlots(data, inst)[index] && c.convoy.length >= data.balance.economy.convoySize) return 'convoy_full';
  return null;
}
