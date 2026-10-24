import { CoreInvariantError } from '../errors';
import type { AffixDef, Element, EquipSlot, GameData, ItemDef, RuneDef, StatMods, StatusId, WeaponType } from '../defs';
import type { ItemInstance, UnitRecord } from '../state';

export function itemDef(data: GameData, inst: ItemInstance | string): ItemDef {
  const id = typeof inst === 'string' ? inst : inst.def;
  const d = data.items[id];
  if (!d) throw new CoreInvariantError('unknown_item', { id });
  return d;
}

export const isWeapon = (d: ItemDef): boolean => d.slot === 'mainHand' && (d.kind === 'weapon' || d.kind === 'tome');
export const isStaff = (d: ItemDef): boolean => d.kind === 'staff';
export const isRune = (data: GameData, inst: ItemInstance): boolean => !!data.runes[inst.def];

export function itemCategory(d: ItemDef): AffixDef['appliesTo'][number] | null {
  if (d.kind === 'weapon' || d.kind === 'tome') return 'weapon';
  if (d.kind === 'shield') return 'shield';
  if (d.kind === 'armor') return 'armor';
  if (d.kind === 'accessory') return 'accessory';
  return null;
}

function runes(data: GameData, inst: ItemInstance): RuneDef[] {
  return inst.runes.filter((r): r is string => !!r).map((r) => data.runes[r]!).filter(Boolean);
}
function affixes(data: GameData, inst: ItemInstance): AffixDef[] {
  return inst.affixes.map((a) => data.affixes[a]!).filter(Boolean);
}

export function runeSlotCount(data: GameData, inst: ItemInstance): number {
  const d = itemDef(data, inst);
  if (d.runeSlots !== undefined) return d.runeSlots;
  const cat = itemCategory(d);
  if (cat === 'weapon') return data.balance.economy.rarityRuneSlots[d.rarity];
  if (d.slot === 'body') return 1;
  return 0;
}

/** Element of the weapon: built-in element or element rune. */
export function itemElement(data: GameData, inst: ItemInstance): Element | undefined {
  const d = itemDef(data, inst);
  if (d.element) return d.element;
  return runes(data, inst).find((r) => r.element)?.element;
}

export interface WeaponProfile {
  weaponType: WeaponType;
  damageType: 'physical' | 'magical';
  might: number;
  hit: number;
  crit: number;
  weight: number;
  range: [number, number];
  element?: Element;
  effectiveVs: string[];
  statusOnHit: Array<{ status: StatusId; chance: number }>;
  terrainOnHit?: 'ignite' | 'extinguish';
  damageVsTag: Array<{ tag: string; bonus: number }>;
}

export function weaponProfile(data: GameData, inst: ItemInstance): WeaponProfile {
  const d = itemDef(data, inst);
  const b = data.balance;
  let might = d.mt ?? 0;
  let hit = d.hit ?? 0;
  let crit = d.crit ?? 0;
  let weight = d.wt;
  const effectiveVs = [...(d.effectiveVs ?? [])];
  const statusOnHit = d.statusOnHit ? [{ ...d.statusOnHit }] : [];
  let terrainOnHit = d.terrainOnHit;
  const damageVsTag: WeaponProfile['damageVsTag'] = [];
  if (isWeapon(d)) {
    might += inst.upgrade * b.economy.upgradePerLevel.weaponMight;
    hit += inst.upgrade * b.economy.upgradePerLevel.weaponHit;
  }
  for (const a of affixes(data, inst)) {
    might += a.mods.might ?? 0;
    weight += a.mods.weight ?? 0;
    crit += a.mods.crit ?? 0;
    hit += a.mods.hit ?? 0;
    effectiveVs.push(...(a.mods.effectiveVs ?? []));
    if (a.mods.statusOnHit) statusOnHit.push({ ...a.mods.statusOnHit });
    if (a.mods.damageVsTag) damageVsTag.push(a.mods.damageVsTag);
  }
  let element = d.element;
  for (const r of runes(data, inst)) {
    if (r.utility) {
      might += r.mods?.might ?? 0;
      weight += r.mods?.weight ?? 0;
      crit += r.mods?.crit ?? 0;
      hit += r.mods?.hit ?? 0;
      continue;
    }
    if (!r.element || element) continue;
    element = r.element;
    const tier = r.tier ?? 1;
    const status = b.element.statusOf[r.element];
    if (status && tier >= 2) {
      statusOnHit.push({ status, chance: tier >= 3 ? b.status.rune3StatusChance : b.status.rune2StatusChance });
    }
    if (tier >= 3) {
      if (r.terrainOnHit) terrainOnHit = r.terrainOnHit;
      effectiveVs.push(...(r.effectiveVs ?? []));
    }
  }
  return {
    weaponType: d.weaponType ?? 'sword',
    damageType: d.damageType ?? 'physical',
    might,
    hit,
    crit,
    weight: Math.max(0, weight),
    range: d.rng ?? [1, 1],
    element,
    effectiveVs,
    statusOnHit,
    terrainOnHit,
    damageVsTag,
  };
}

export function itemWeight(data: GameData, inst: ItemInstance): number {
  const d = itemDef(data, inst);
  if (isWeapon(d)) return weaponProfile(data, inst).weight;
  let w = d.wt;
  for (const a of affixes(data, inst)) w += a.mods.weight ?? 0;
  for (const r of runes(data, inst)) w += r.mods?.weight ?? 0;
  return Math.max(0, w);
}

/** Stat modifiers an equipped item grants (armor upgrades, affixes, item stat mods). */
export function itemStatMods(data: GameData, inst: ItemInstance): StatMods & { hit?: number; avoid?: number; crit?: number } {
  const d = itemDef(data, inst);
  const out: StatMods & { hit?: number; avoid?: number; crit?: number } = {};
  const add = (k: keyof typeof out, v: number | undefined) => {
    if (v) out[k] = (out[k] ?? 0) + v;
  };
  for (const [k, v] of Object.entries(d.statMods ?? {})) add(k as keyof StatMods, v);
  if (d.combatMods) {
    add('hit', d.combatMods.hit);
    add('avoid', d.combatMods.avoid);
    add('crit', d.combatMods.crit);
  }
  if ((d.kind === 'armor' || d.kind === 'shield') && inst.upgrade > 0) {
    const mainRes = (d.statMods?.res ?? 0) > (d.statMods?.def ?? 0);
    add(mainRes ? 'res' : 'def', inst.upgrade * data.balance.economy.upgradePerLevel.armorDefOrRes);
  }
  for (const a of affixes(data, inst)) {
    for (const [k, v] of Object.entries(a.mods.stats ?? {})) add(k as keyof StatMods, v);
    if (itemCategory(d) !== 'weapon') {
      add('avoid', a.mods.avoid);
      add('hit', a.mods.hit);
      add('crit', a.mods.crit);
    }
  }
  return out;
}

/** Element given to the wearer by body armor (built-in or armor rune). */
export function armorAffinity(data: GameData, unit: UnitRecord): Element | undefined {
  const body = unit.equip.body;
  if (!body) return undefined;
  return itemElement(data, body);
}

export type EquipError =
  | 'wrong_slot'
  | 'weapon_type'
  | 'two_handed'
  | 'heavy_armor'
  | 'duplicate_accessory'
  | 'monster_only'
  | 'bag_full';

export function slotFits(d: ItemDef, slot: EquipSlot | 'bag'): boolean {
  if (slot === 'bag') return true;
  if (slot === 'accessory1' || slot === 'accessory2') return d.slot === 'accessory';
  return d.slot === slot;
}

/** Checks whether `unit` may hold `inst` in `slot` (class weapons, two-handed, armor class …). */
export function canEquip(
  data: GameData,
  unit: UnitRecord,
  inst: ItemInstance,
  slot: EquipSlot | 'bag',
  classSkills: string[] = [],
): EquipError | null {
  const d = itemDef(data, inst);
  if (slot === 'bag') return null;
  if (d.tags?.includes('convoyOnly')) return 'wrong_slot';
  if (!slotFits(d, slot)) return 'wrong_slot';
  const cls = data.classes[unit.classId]!;
  if (d.tags?.includes('monsterOnly') && !cls.tags.includes('monster')) return 'monster_only';
  if (slot === 'mainHand' && d.weaponType && !cls.weapons.includes(d.weaponType)) return 'weapon_type';
  if (slot === 'offHand') {
    const main = unit.equip.mainHand;
    if (main && itemDef(data, main).twoHanded) return 'two_handed';
  }
  if (slot === 'mainHand' && d.twoHanded && unit.equip.offHand) return 'two_handed';
  if (d.armorClass === 'heavy') {
    const allowed =
      cls.tags.includes('armored') ||
      classSkills.some((s) => data.skills[s]?.effect.allowArmorClass === 'heavy');
    if (!allowed) return 'heavy_armor';
  }
  if (slot === 'accessory1' || slot === 'accessory2') {
    const other = unit.equip[slot === 'accessory1' ? 'accessory2' : 'accessory1'];
    if (other && other.def === inst.def) return 'duplicate_accessory';
  }
  return null;
}

/** Weapons a unit could fight with: equipped main hand plus usable weapons in the bag. */
export function usableWeapons(data: GameData, unit: UnitRecord): ItemInstance[] {
  const cls = data.classes[unit.classId]!;
  const list = [unit.equip.mainHand, ...unit.bag].filter((i): i is ItemInstance => !!i);
  return list.filter((i) => {
    const d = itemDef(data, i);
    return isWeapon(d) && !!d.weaponType && cls.weapons.includes(d.weaponType) && (d.mt !== undefined || !!d.damageType);
  });
}

export function usableStaves(data: GameData, unit: UnitRecord): ItemInstance[] {
  const cls = data.classes[unit.classId]!;
  const list = [unit.equip.mainHand, ...unit.bag].filter((i): i is ItemInstance => !!i);
  return list.filter((i) => {
    const d = itemDef(data, i);
    return isStaff(d) && cls.weapons.includes('staff');
  });
}

export function allItems(unit: UnitRecord): ItemInstance[] {
  return [...Object.values(unit.equip).filter((i): i is ItemInstance => !!i), ...unit.bag];
}

export function sellPrice(data: GameData, inst: ItemInstance): number {
  const d = itemDef(data, inst);
  if (d.tags?.includes('unsellable')) return 0;
  return Math.floor(d.price * data.balance.economy.sellRatio);
}
