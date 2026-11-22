/**
 * Story 16.14: what the weapon view works out, apart from drawing (no DOM, no Babylon): the 3D model of a piece, the figure and
 * place its changes are worked out for, the rune's change list against "no rune", the chronicle line and the way into smith and
 * enchanter. Numbers come from the battle formulas through `changeList`, never from a copy.
 */
import {
  changeList,
  homeRooms,
  itemDef,
  locateItem,
  pieceFolder,
  runeSlotCount,
  upgradable,
  type CampaignState,
  type ChangeResult,
  type Condition,
  type EquipSlot,
  type GameData,
  type GearRunes,
  type ItemInstance,
  type UnitRecord,
} from '../../core';
import { chronicleKey, epithetText } from '../../core/rules/chronicle';
import { gearRunesOf } from '../../render/shared/runeLook';

/** The model file of a piece on the item stage (`models/weapons-v2/<model>.glb`), or null: no model, the view shows its image. */
export function weaponStageModel(data: GameData, inst: ItemInstance): string | null {
  const d = itemDef(data, inst);
  const gear = data.render.gear;
  const piece = (d.weaponType && gear.weapons[d.weaponType]) || (d.group ? gear.offHand[d.group] : undefined);
  if (!piece || pieceFolder(piece) !== 'weapons-v2') return null;
  return `models/weapons-v2/${piece.model}.glb`;
}

/** The runes of a piece as the stage and the gems show them (main and small setting; metal from the item). */
export function stageRunes(data: GameData, inst: ItemInstance): GearRunes {
  return gearRunesOf(data.runes, inst.runes, runeSlotCount(data, inst), itemDef(data, inst).metal);
}

/** The same piece without its runes (the base of "against no rune"). */
export function withoutRunes(inst: ItemInstance): ItemInstance {
  return { ...inst, runes: inst.runes.map(() => null) };
}

/** Does the piece carry any rune? */
export const hasRune = (inst: ItemInstance): boolean => inst.runes.some((r) => !!r);

/** The place a piece is changed for: where it sits, else the place its kind belongs to (accessories: the first). */
export function placeOf(data: GameData, c: CampaignState, inst: ItemInstance): EquipSlot | 'bag' {
  const at = locateItem(c, inst.uid)?.slot;
  if (at && at !== 'bag') return at;
  const slot = itemDef(data, inst).slot;
  return slot === 'accessory' ? 'accessory1' : (slot as EquipSlot | 'bag');
}

/** The figure whose numbers the changes are worked out for: the one named, the owner, else the first of the company (A5). */
export function referenceUnit(c: CampaignState, inst: ItemInstance, hint?: string): UnitRecord | undefined {
  return (hint ? c.roster.find((u) => u.id === hint) : undefined) ?? locateItem(c, inst.uid)?.owner ?? c.roster[0];
}

/** What the piece gives, in the change list's `state` mode (weapon values, stats, effects). */
export function valuesOf(data: GameData, unit: UnitRecord, inst: ItemInstance, slot: EquipSlot | 'bag'): ChangeResult {
  return changeList(data, unit, null, { slot, base: inst });
}

/** What the runes change against the same piece without them (`diff` mode): an empty list means no change. */
export function runeChange(data: GameData, unit: UnitRecord, inst: ItemInstance, slot: EquipSlot | 'bag'): ChangeResult {
  return changeList(data, unit, inst, { slot, base: withoutRunes(inst) });
}

type T = (key: string, params?: Record<string, string | number>) => string;

/** Display name of a unit id or lieutenant id for an epithet: a company member's own name, else the content name. */
export function nameOfId(c: CampaignState, t: T, id: string): string {
  const u = c.roster.find((r) => r.id === id);
  if (u) return u.name ?? t(u.nameKey);
  return t(`unit.${id}.name`);
}

/** The epithet as text, or undefined (the weapon has none, or keeps no chronicle). */
export function epithetOf(data: GameData, c: CampaignState, t: T, inst: ItemInstance): string | undefined {
  const key = chronicleKey(data, inst);
  if (!inst.epithet || !key) return undefined;
  return epithetText(t, (id) => nameOfId(c, t, id), inst.epithet, key);
}

/**
 * The chronicle line "kills, epithet" (parts without a value drop out); undefined when nothing is to say (no kills yet, no
 * epithet) or the piece keeps no chronicle. There is no origin on the instance (16.5 stores none), so the line has none.
 */
export function chronicleLine(data: GameData, c: CampaignState, t: T, inst: ItemInstance): string | undefined {
  if (!chronicleKey(data, inst)) return undefined;
  const parts: string[] = [];
  if ((inst.kills ?? 0) > 0) parts.push(t('ui.weaponView.kills', { n: inst.kills ?? 0 }));
  const epithet = epithetOf(data, c, t, inst);
  if (epithet) parts.push(epithet);
  return parts.length ? parts.join(t('ui.weaponView.sep')) : undefined;
}

/** A room the view jumps to: its id and whether it can be used now (`unmet`: the condition that keeps it shut). */
export interface RoomAccess {
  id: string;
  open: boolean;
  unmet?: Condition;
}

/** The home's room with `fn` ('smith', 'enchanter'); null when this home has none (the key is then dimmed with its reason). */
export function roomAccess(data: GameData, c: CampaignState, fn: 'smith' | 'enchanter'): RoomAccess | null {
  const st = homeRooms(data, c).find((r) => r.room.function === fn);
  return st ? { id: st.room.id, open: st.open, ...(st.unmet ? { unmet: st.unmet } : {}) } : null;
}

/** Which keys the view shows: "Enchant" when the piece has rune settings, "Upgrade" when it can be upgraded. */
export function viewKeys(data: GameData, inst: ItemInstance): { enchant: boolean; upgrade: boolean } {
  return { enchant: runeSlotCount(data, inst) > 0, upgrade: upgradable(data, inst) };
}
