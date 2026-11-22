/**
 * Change list (story 16.13): what changes for a figure when an item goes into a place, or what an item gives now.
 * One pure function for the equip list, smith, merchant, enchanter and weapon view; it only calls the battle formulas
 * (`computeStats`, `weaponProfile`, `itemElement`, `armorAffinity`, `elementMultiplier`, `hitDamage`), never a copy.
 *
 * Modes: `diff` (a probe against what is worn or `ctx.base`: only changed values, an empty list means no change) and
 * `state` (no probe: what the worn item or `ctx.base` gives, no differences).
 *
 * Line order: attack, hit, crit, range, weight (weapon values, main hand only), hp, strength, magic, skill, speed, luck,
 * defense, resistance, move, (hit, crit of a non-weapon), avoid, load, then the element change, damage per enemy element,
 * armor element factors, and last the effects that appear or fall away.
 */
import { ELEMENTS, type Element, type EquipSlot } from '../defs';
import type { GameData } from '../gameData';
import type { ItemInstance, UnitRecord } from '../state';
import { clone } from '../util';
import { elementMultiplier, hitDamage } from './combat';
import { armorAffinity, isWeapon, itemDef, itemElement, slotFits, weaponProfile, type WeaponProfile } from './items';
import { computeStats, type EffectiveStats } from './stats';

export type ChangeMode = 'diff' | 'state';

/** Keys of the `stat` lines (the UI maps each to an icon and a label `ui.change.stat.<key>`). */
export type ChangeStatKey =
  | 'attack'
  | 'hit'
  | 'crit'
  | 'range'
  | 'weight'
  | 'hp'
  | 'strength'
  | 'magic'
  | 'skill'
  | 'speed'
  | 'luck'
  | 'defense'
  | 'resistance'
  | 'move'
  | 'avoid'
  | 'load';

/** What an effect line is about: a status on hit, a terrain effect on hit, "effective against" a tag, or bonus damage against a tag. */
export type ChangeEffectKind = 'status' | 'terrain' | 'effective' | 'tagBonus';

/**
 * One line. `key` is stable (use it as list key). `better` decides green/red.
 * - `stat`: `value` is the new value (in `state` mode what the item gives), `delta` the difference (0 in `state` mode).
 *   `attack` is the weapon's might, `range` its far reach; weight and load are better when lower.
 * - `element`: the weapon element changes from `from` to `to` (`from` missing: "new", `to` missing: it falls away).
 * - `elementDamage`: damage of one hit against a neutral reference enemy (no tags, 0 defence and resistance, no triangle)
 *   of element `against`; only for enemy elements whose multiplier changes (the rest only echoes the attack change).
 * - `armorElement`: a hit of element `against` on the wearer is multiplied by `factor` now; only where the factor changes.
 * - `effect`: `appears` false means "falls away"; `id` is the status, terrain effect or tag.
 */
export type ChangeLine =
  | { kind: 'stat'; key: ChangeStatKey; value: number; delta: number; better: boolean }
  | { kind: 'element'; key: 'element'; from?: Element; to?: Element; better: boolean }
  | { kind: 'elementDamage'; key: `damage.${Element}`; against: Element; value: number; delta: number; better: boolean }
  | { kind: 'armorElement'; key: `armor.${Element}`; against: Element; factor: number; better: boolean }
  | { kind: 'effect'; key: string; effect: ChangeEffectKind; id: string; appears: boolean; better: boolean };

export interface ChangeResult {
  mode: ChangeMode;
  lines: ChangeLine[];
}

export interface ChangeCtx {
  /** place of the probe; default: the item's place (the first accessory place for accessories) */
  slot?: EquipSlot | 'bag';
  /** what the probe is compared with (or what the state shows); default: what is worn in `slot`. `null`: an empty place. */
  base?: ItemInstance | null;
}

/** The unit with `item` in `slot` (a copy; the item leaves the bag; a two-hander clears the off hand, a shield clears a two-hander). */
function place(data: GameData, unit: UnitRecord, slot: EquipSlot, item: ItemInstance | null): UnitRecord {
  const after = clone(unit);
  if (!item) {
    delete after.equip[slot];
    return after;
  }
  after.bag = after.bag.filter((i) => i.uid !== item.uid);
  after.equip[slot] = clone(item);
  if (slot === 'mainHand' && itemDef(data, item).twoHanded) delete after.equip.offHand;
  if (slot === 'offHand' && after.equip.mainHand && itemDef(data, after.equip.mainHand).twoHanded) delete after.equip.mainHand;
  return after;
}

interface Snap {
  stats: EffectiveStats;
  wp: WeaponProfile | null;
  element?: Element;
  affinity?: Element;
}

function snap(data: GameData, unit: UnitRecord, slot: EquipSlot): Snap {
  const worn = unit.equip[slot];
  const wp = slot === 'mainHand' && worn && isWeapon(itemDef(data, worn)) ? weaponProfile(data, worn) : null;
  return {
    stats: computeStats(data, unit),
    wp,
    element: wp ? itemElement(data, worn!) : undefined,
    affinity: slot === 'body' ? armorAffinity(data, unit) : undefined,
  };
}

const LOWER_IS_BETTER: ChangeStatKey[] = ['weight', 'load'];

/** Damage of one hit of the weapon against a neutral enemy of element `against` (the damage kernel of the battle). */
function damageVs(data: GameData, s: Snap, against: Element): number {
  const wp = s.wp!;
  const atk = (wp.damageType === 'magical' ? s.stats.stats.mag : s.stats.stats.str) + wp.might + s.stats.skills.damage;
  return Math.max(0, hitDamage(data, atk, 0, 0, elementMultiplier(data, wp.element, against, [])));
}

type EffectMap = Map<string, { effect: ChangeEffectKind; id: string }>;

function effectsOf(wp: WeaponProfile | null): EffectMap {
  const out: EffectMap = new Map();
  if (!wp) return out;
  const add = (effect: ChangeEffectKind, id: string) => out.set(`effect.${effect}.${id}`, { effect, id });
  for (const s of wp.statusOnHit) add('status', s.status);
  if (wp.terrainOnHit) add('terrain', wp.terrainOnHit);
  for (const t of wp.effectiveVs) add('effective', t);
  for (const t of wp.damageVsTag) add('tagBonus', t.tag);
  return out;
}

function defaultSlot(data: GameData, item: ItemInstance): EquipSlot | 'bag' {
  const d = itemDef(data, item);
  if (d.slot === 'bag') return 'bag';
  return d.slot === 'accessory' ? 'accessory1' : (d.slot as EquipSlot);
}

/**
 * The change list of `probe` for `unit`. Without a probe (`null`) the state of what is worn in `ctx.slot` (or `ctx.base`)
 * is shown. A bag place, an item that does not fit the place and an empty place give an empty list.
 */
export function changeList(data: GameData, unit: UnitRecord, probe: ItemInstance | null, ctx: ChangeCtx = {}): ChangeResult {
  const mode: ChangeMode = probe ? 'diff' : 'state';
  const diff = mode === 'diff';
  const slot = ctx.slot ?? (probe ? defaultSlot(data, probe) : undefined);
  if (!slot || slot === 'bag') return { mode, lines: [] };
  const base = ctx.base !== undefined ? ctx.base : (unit.equip[slot] ?? null);
  const shown = probe ?? base;
  if (!shown || !slotFits(itemDef(data, shown), slot)) return { mode, lines: [] };

  // a probe replaces the base; the state compares the item with an empty place
  const beforeUnit = place(data, unit, slot, diff ? base : null);
  const afterUnit = place(data, unit, slot, shown);
  const a = snap(data, beforeUnit, slot);
  const b = snap(data, afterUnit, slot);

  const lines: ChangeLine[] = [];
  // `absolute`: the value is the new value itself (weapon values), otherwise in `state` what the item adds
  const stat = (key: ChangeStatKey, after: number, before: number, absolute = false) => {
    const delta = after - before;
    const value = diff || absolute ? after : delta;
    if (diff ? delta === 0 : value === 0) return;
    const lower = LOWER_IS_BETTER.includes(key);
    lines.push({ kind: 'stat', key, value, delta: diff ? delta : 0, better: diff ? (lower ? delta < 0 : delta > 0) : !lower });
  };

  if (b.wp) {
    stat('attack', b.wp.might, a.wp?.might ?? 0, true);
    stat('hit', b.wp.hit, a.wp?.hit ?? 0, true);
    stat('crit', b.wp.crit, a.wp?.crit ?? 0, true);
    stat('range', b.wp.range[1], a.wp?.range[1] ?? 1, true);
    stat('weight', b.wp.weight, a.wp?.weight ?? 0, true);
  }
  stat('hp', b.stats.maxHp, a.stats.maxHp);
  stat('strength', b.stats.stats.str, a.stats.stats.str);
  stat('magic', b.stats.stats.mag, a.stats.stats.mag);
  stat('skill', b.stats.stats.skl, a.stats.stats.skl);
  stat('speed', b.stats.stats.spd, a.stats.stats.spd);
  stat('luck', b.stats.stats.lck, a.stats.stats.lck);
  stat('defense', b.stats.stats.def, a.stats.stats.def);
  stat('resistance', b.stats.stats.res, a.stats.stats.res);
  stat('move', b.stats.mov, a.stats.mov);
  if (!b.wp) {
    stat('hit', b.stats.hit, a.stats.hit);
    stat('crit', b.stats.crit, a.stats.crit);
  }
  stat('avoid', b.stats.avoid, a.stats.avoid);
  stat('load', b.stats.load, a.stats.load);

  if (b.wp) {
    if (diff ? a.element !== b.element : !!b.element) {
      lines.push({ kind: 'element', key: 'element', from: diff ? a.element : undefined, to: b.element, better: !!b.element });
    }
    for (const el of ELEMENTS) {
      const same = elementMultiplier(data, a.element, el, []) === elementMultiplier(data, b.element, el, []);
      if (diff ? same : !b.element) continue;
      const value = damageVs(data, b, el);
      const before = diff && a.wp ? damageVs(data, a, el) : value;
      lines.push({ kind: 'elementDamage', key: `damage.${el}`, against: el, value, delta: diff ? value - before : 0, better: diff ? value > before : true });
    }
  }
  if (slot === 'body') {
    for (const el of ELEMENTS) {
      const fa = elementMultiplier(data, el, a.affinity, []);
      const fb = elementMultiplier(data, el, b.affinity, []);
      if (diff ? fa === fb : fb === 1) continue;
      lines.push({ kind: 'armorElement', key: `armor.${el}`, against: el, factor: fb, better: diff ? fb < fa : fb < 1 });
    }
  }
  const ea = effectsOf(a.wp);
  const eb = effectsOf(b.wp);
  for (const [key, e] of eb) if (!diff || !ea.has(key)) lines.push({ kind: 'effect', key, effect: e.effect, id: e.id, appears: true, better: true });
  if (diff) for (const [key, e] of ea) if (!eb.has(key)) lines.push({ kind: 'effect', key, effect: e.effect, id: e.id, appears: false, better: false });
  return { mode, lines };
}
