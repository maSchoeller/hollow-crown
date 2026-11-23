/**
 * Story 16.15: what hangs on a figure, worked out from its equipment alone (no battle state), so the board (`BattleUnit`) and the
 * figure sheet's dress-up doll (`UnitRecord`) dress a figure the same way: the weapon of the equipped weapon group and the off-hand
 * piece (GA9, one piece per hand, the weapon first), the attached part of the pro path (story 10.13), the metal and runes of the
 * items (story 16.6) and the stance key of the figure's clips (story 16.10).
 */
import type { EquipSlot, FigurePiece, GameData, GearPiece, ItemInstance, PartPiece } from '../../core';
import { itemDef, runeSlotCount } from '../../core';
import { fixedRuneOf, modelFor } from './gearModel';
import { gearRunesOf, runeLookOf } from './runeLook';
import { stanceKeyOf } from './stance';

/** The part of a unit that decides how it is dressed: a battle unit and a roster record both have it. */
export interface GearOwner {
  classId: string;
  equip: Partial<Record<EquipSlot, ItemInstance>>;
}

/** Weapon model of the equipped weapon group (GA9); its motion picks the figure's attack animation. */
export function weaponOf(data: GameData, u: GearOwner): GearPiece | undefined {
  const def = u.equip.mainHand && itemDef(data, u.equip.mainHand);
  return def && def.weaponType ? modelFor(def, data.render.gear) : undefined;
}

/** The model piece of the off-hand item (shield, lute, focus), if it has one. */
export function offHandOf(data: GameData, u: GearOwner): GearPiece | undefined {
  const offDef = u.equip.offHand && itemDef(data, u.equip.offHand);
  return offDef && offDef.group ? modelFor(offDef, data.render.gear) : undefined;
}

/** Attached part of the unit's pro path (story 10.13); undefined for a class without one or an unknown part. */
export function proPartOf(data: GameData, u: GearOwner): PartPiece | undefined {
  const part = data.classes[u.classId]?.proPart;
  return part ? data.render.gear.proParts[part] : undefined;
}

/** Story 16.6: a weapon piece carries the metal and runes of the item in that hand. `relicStages`: the stage of the awakened relics (battle only). */
export function withRunes(data: GameData, piece: GearPiece, item: ItemInstance | undefined, relicStages?: Record<string, number>): GearPiece {
  if (!item) return piece;
  const def = itemDef(data, item);
  const rune = gearRunesOf(data.runes, item.runes, runeSlotCount(data, item), def.metal);
  // story 16.8: a signature piece shows its fixed rune in the main setting while slot 0 holds none (display only)
  const fixed = item.runes[0] ? null : runeLookOf(data.runes, fixedRuneOf(def, relicStages?.[def.id] ?? 1));
  return { ...piece, rune: fixed ? { ...rune, main: fixed } : rune };
}

/** What hangs on the figure: weapon, off-hand piece (the weapon first) and the attached part of the pro path. */
export function gearOf(data: GameData, u: GearOwner, relicStages?: Record<string, number>): FigurePiece[] {
  const out: GearPiece[] = [];
  const w = weaponOf(data, u);
  if (w) out.push(withRunes(data, w, u.equip.mainHand, relicStages));
  const off = offHandOf(data, u);
  if (off && !out.some((p) => p.hand === off.hand)) out.push(withRunes(data, off, u.equip.offHand, relicStages));
  const part = proPartOf(data, u);
  return part ? [...out, part] : out;
}

/** The stance key of the unit's clips: main weapon, off-hand piece (a shield adds, a lute or focus replaces), `none` unarmed. */
export function unitStanceKey(data: GameData, u: GearOwner): string {
  return stanceKeyOf(weaponOf(data, u), offHandOf(data, u));
}
