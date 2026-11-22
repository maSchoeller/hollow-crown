/**
 * Story 16.8: the one place that says which model an item shows (board, figure sheet, weapon view, armory): `render.yaml`
 * `gear.items` by item id first, else the group's piece (`gear.weapons` by weapon type, `gear.offHand` by group). Pure, no Babylon.
 */
import type { GearPiece, ItemDef } from '../../core';
import type { GameData } from '../../core/gameData';

type Gear = GameData['render']['gear'];

/** The model piece of an item (model, hand, motion, hold of the group unless the item's entry overrides); undefined for an item without a model. */
export function modelFor(item: ItemDef, gear: Gear): GearPiece | undefined {
  const base = (item.weaponType && gear.weapons[item.weaponType]) || (item.group && gear.offHand[item.group]) || undefined;
  const own = gear.items[item.id];
  if (!own) return base;
  // an accessory (dragon_ember) has no group piece: no hand of its own, `left` is only a placeholder, the board never hangs it
  return { ...base, ...own, hand: own.hand ?? base?.hand ?? 'left', ...(base ? { fallback: base.model } : {}) };
}

/** The rune a signature piece shows in its main setting: the single `fixedRune`, or the one of the relic `stage` (1-based, clamped to the list). */
export function fixedRuneOf(item: ItemDef, stage = 1): string | undefined {
  const f = item.fixedRune;
  if (!f) return undefined;
  return typeof f === 'string' ? f : f[Math.min(Math.max(stage, 1), f.length) - 1];
}
