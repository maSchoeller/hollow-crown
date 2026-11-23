/**
 * Story 16.15: the pure part of the figure sheet's dress-up doll (no Preact, no DOM): the six places, the performance values, the
 * bag and its commands, the element chips and the strongest stats. Every number comes from the core's own formulas (`unitPerformance`,
 * `computeStats`, `weaponProfile`), never from a copy; the component only draws what this returns.
 */
import {
  armorGuard,
  computeStats,
  equipCandidates,
  EQUIP_SLOTS,
  isWeapon,
  itemDef,
  runeSlotCount,
  unitPerformance,
  weaponProfile,
  type CampaignCommand,
  type CampaignState,
  type ChangeStatKey,
  type Element,
  type EquipCandidate,
  type EquipSlot,
  type GameData,
  type RoleGroup,
  type ItemInstance,
  type RuneLook,
  type StatKey,
  type UnitRecord,
} from '../../core';
import { isKey } from '../../core/rules/items';
import { fixedRuneOf } from '../../render/shared/gearModel';
import { gearRunesOf, runeLookOf } from '../../render/shared/runeLook';

type Relics = NonNullable<Parameters<typeof computeStats>[2]>['relics'];

/** The places over the picture: left main hand, head, body; right off hand and the two accessories. */
export const LEFT_SLOTS: readonly EquipSlot[] = ['mainHand', 'head', 'body'];
export const RIGHT_SLOTS: readonly EquipSlot[] = ['offHand', 'accessory1', 'accessory2'];

/** Icon of a role group (the pill's sub line). */
export const ROLE_ICON: Record<RoleGroup, string> = { melee: 'blade', ranged: 'bow', support: 'healer' };

/** What is chosen on the doll: a place, or a bag place (`index` counts the places without keys, as the equip list does). */
export type DollPick = { kind: 'slot'; slot: EquipSlot } | { kind: 'bag'; index: number };

export const pickKey = (p: DollPick | null): string => (!p ? '' : p.kind === 'slot' ? p.slot : `bag${p.index}`);
export const samePick = (a: DollPick | null, b: DollPick | null): boolean => pickKey(a) === pickKey(b);

/** The rune dot of an item: the large setting's rune, else a signature piece's fixed rune, else the small one; null without a rune. */
export function runeDotOf(data: GameData, item: ItemInstance): RuneLook | null {
  const def = itemDef(data, item);
  const set = gearRunesOf(data.runes, item.runes, runeSlotCount(data, item), def.metal);
  const fixed = item.runes[0] ? null : runeLookOf(data.runes, fixedRuneOf(def));
  return set.main ?? fixed ?? set.small ?? null;
}

export interface DollSlot {
  slot: EquipSlot;
  item?: ItemInstance;
  rune: RuneLook | null;
}

/** The three places of one side with what they carry. */
export function dollSlots(data: GameData, unit: UnitRecord, keys: readonly EquipSlot[]): DollSlot[] {
  return keys.map((slot) => {
    const item = unit.equip[slot];
    return { slot, item, rune: item ? runeDotOf(data, item) : null };
  });
}

/** One cell of the performance grid: the change-list key (icon and name come from it), the shown value. */
export interface PerfCell {
  key: Extract<ChangeStatKey, 'hp' | 'attack' | 'hit' | 'crit' | 'avoid' | 'defense' | 'move' | 'range'>;
  value: string;
  /** the figure has no value here (no weapon in the main hand) */
  none: boolean;
}

/** The eight values of the grid (assumption A3: the main hand against a neutral enemy, the same reference as the change list). */
export function performanceCells(data: GameData, unit: UnitRecord, relics?: Relics): PerfCell[] {
  const p = unitPerformance(data, unit, { relics });
  const num = (key: PerfCell['key'], v: number | null): PerfCell => ({ key, value: v === null ? '–' : String(v), none: v === null });
  return [
    num('hp', p.hp),
    num('attack', p.attack),
    num('hit', p.hit),
    num('crit', p.crit),
    num('avoid', p.avoid),
    num('defense', p.defense),
    num('move', p.move),
    { key: 'range', value: p.range ? (p.range[0] === p.range[1] ? String(p.range[0]) : `${p.range[0]}–${p.range[1]}`) : '–', none: !p.range },
  ];
}

/** Stats that can be "strongest": the three of them with the highest value are marked (zero never is). */
const RANKED: readonly StatKey[] = ['str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'];
export function strongestStats(stats: Record<StatKey, number>, n = 3): StatKey[] {
  return RANKED.map((k, i) => ({ k, i, v: stats[k] }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v || a.i - b.i)
    .slice(0, n)
    .map((x) => x.k);
}

/** Change-list name of a base stat (full name `ui.change.stat.<name>`). */
export const STAT_NAME: Record<StatKey, ChangeStatKey> = {
  hp: 'hp',
  str: 'strength',
  mag: 'magic',
  skl: 'skill',
  spd: 'speed',
  lck: 'luck',
  def: 'defense',
  res: 'resistance',
};

/** The bag: `balance.bag.size` places without keys (the keys sit on the ring beside them, fixed). */
export interface BagPlace {
  index: number;
  item?: ItemInstance;
}
export function bagPlaces(data: GameData, unit: UnitRecord): BagPlace[] {
  const items = unit.bag.filter((b) => !isKey(data, b));
  return Array.from({ length: data.balance.bag.size }, (_, index) => ({ index, item: items[index] }));
}
export const keyRing = (data: GameData, unit: UnitRecord): ItemInstance[] => unit.bag.filter((b) => isKey(data, b));

/** Items of the convoy that fit an empty bag place (the same list as the equip list's bag place). */
export const bagCandidates = (data: GameData, c: CampaignState, unit: UnitRecord): EquipCandidate[] =>
  equipCandidates(data, c, unit, 'bag').sort((a, b) => Number(!!a.error) - Number(!!b.error));

/** Tap on a convoy item for an empty bag place. */
export const bagEquipCommand = (unit: UnitRecord, uid: string): CampaignCommand => ({ type: 'equip', unit: unit.id, uid, slot: 'bag' });
/** "Back to the convoy" for a full bag place. */
export const bagReturnCommand = (uid: string): CampaignCommand => ({ type: 'unequip', uid });
/** The convoy has no place for the item that would go back (the button is dimmed with the reason `convoy_full`). */
export const convoyIsFull = (data: GameData, c: CampaignState): boolean => c.convoy.length >= data.balance.economy.convoySize;

/** What the pick shows: the item in it (undefined: an empty place). */
export function pickedItem(data: GameData, unit: UnitRecord, pick: DollPick | null): ItemInstance | undefined {
  if (!pick) return undefined;
  return pick.kind === 'slot' ? unit.equip[pick.slot] : bagPlaces(data, unit)[pick.index]?.item;
}

/** An element chip of the raised sheet: weapon, shield or armour with the element it gives (none: the place gives none). */
export interface ElementChip {
  source: 'weapon' | 'shield' | 'armor';
  /** the item the chip speaks of (undefined for the armour's affinity, which may also come from the figure itself) */
  item?: ItemInstance;
  element?: Element;
  tier?: number;
}

/** The elements of weapon, shield and armour; the combat's own readings (`weaponProfile`, `shield`/`affinity` of `computeStats`, `armorGuard`). */
export function elementChips(data: GameData, unit: UnitRecord, relics?: Relics): ElementChip[] {
  const st = computeStats(data, unit, { relics });
  const out: ElementChip[] = [];
  const main = unit.equip.mainHand;
  if (main && isWeapon(itemDef(data, main))) {
    const wp = weaponProfile(data, main);
    out.push({ source: 'weapon', item: main, element: wp.element, tier: wp.elementTier ?? (wp.element ? 1 : undefined) });
  }
  if (unit.equip.offHand && itemDef(data, unit.equip.offHand).kind === 'shield') {
    out.push({ source: 'shield', item: unit.equip.offHand, element: st.shield?.element, tier: st.shield?.tier });
  }
  const guard = armorGuard(data, unit);
  out.push({ source: 'armor', element: st.affinity, tier: guard?.element === st.affinity ? guard?.tier : undefined });
  return out;
}

/** The rebuild key of the stage: what changes the model or its dressing (figure, class, the hands and their runes). */
export function dressKey(unit: Pick<UnitRecord, 'id' | 'classId' | 'portrait' | 'sprite' | 'equip'>): string {
  const worn = EQUIP_SLOTS.map((s) => {
    const i = unit.equip[s];
    return i ? `${i.def}:${i.runes.map((r) => r ?? '-').join('/')}` : '-';
  });
  return [unit.id, unit.classId, unit.portrait ?? '', unit.sprite ?? '', ...worn].join('|');
}
