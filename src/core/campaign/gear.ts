/**
 * Convoy of levels 2 and 3 (story 10.10): the gear template of a figure and "equip the best". Both only move items
 * between the convoy and one figure; they share `equipInto` with the `equip` command and `pickBestGear` with `autoEquip`,
 * so no rule is copied. Nothing here draws from the RNG: a replay gives the same result.
 */
import { EQUIP_SLOTS, type EquipSlot } from '../defs';
import type { GameData } from '../gameData';
import type { CampaignState, GearTemplate, ItemInstance, UnitRecord } from '../state';
import { pickBestGear } from '../battle/create';
import { addToBag, allItems, bagIsFull, canEquip, isKey, itemDef } from '../rules/items';
import { activeSkillIds } from '../rules/skills';
import { relicCtx } from './relics';
import { roomLevel } from './castle';
import { locateItem, takeItem } from './camp';

/** Level of the convoy of the home: the room with `function: convoy` (the camp never builds, so it stays 1 there). */
export function convoyLevel(data: GameData, c: CampaignState): number {
  const room = Object.values(data.rooms).find((r) => r.function === 'convoy');
  return room ? roomLevel(c, room.id) : 1;
}

/** Gear templates can be saved and applied (`economy.gearTemplateFromConvoyLevel`, story 10.10). */
export const gearTemplatesOpen = (data: GameData, c: CampaignState): boolean =>
  convoyLevel(data, c) >= data.balance.economy.gearTemplateFromConvoyLevel;

/** "Equip the best" is available (`economy.equipBestFromConvoyLevel`, story 10.10). */
export const equipBestOpen = (data: GameData, c: CampaignState): boolean =>
  convoyLevel(data, c) >= data.balance.economy.equipBestFromConvoyLevel;

/** The template of what a figure wears right now: the uids of its six places and of its bag (keys stay on the key ring). */
export function gearTemplateOf(data: GameData, u: UnitRecord): GearTemplate {
  const equip: Partial<Record<EquipSlot, string>> = {};
  for (const slot of EQUIP_SLOTS) {
    const inst = u.equip[slot];
    if (inst) equip[slot] = inst.uid;
  }
  return { equip, bag: u.bag.filter((i) => !isKey(data, i)).map((i) => i.uid) };
}

/**
 * Puts `inst` (already taken out of wherever it was) into one place of `u`; the displaced item goes to the convoy. The core
 * of the `equip` command, which the gear template and "equip the best" use as well. `replace` (bag only) is the uid of the
 * item of that bag place, which leaves in the same step.
 */
export function equipInto(data: GameData, c: CampaignState, u: UnitRecord, inst: ItemInstance, slot: EquipSlot | 'bag', replace?: string): void {
  if (slot === 'bag') {
    // a swap keeps the bag place: the new item takes the index of the one that leaves
    const at = replace ? u.bag.findIndex((i) => i.uid === replace) : -1;
    if (at >= 0 && !isKey(data, inst)) c.convoy.push(...u.bag.splice(at, 1, inst));
    else {
      if (at >= 0) c.convoy.push(...u.bag.splice(at, 1));
      addToBag(data, u.bag, inst);
    }
    return;
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
}

/** An item of a template that stayed where it was: `unit` names the figure that holds it now (absent: it no longer fits). */
export interface SkippedItem {
  uid: string;
  def: string;
  unit?: string;
}

/** What applying a template or "equip the best" did: the places filled, the items left out and how many are gone (sold). */
export interface GearRun {
  equipped: Array<{ uid: string; slot: EquipSlot | 'bag' }>;
  skipped: SkippedItem[];
  gone: number;
}

/** Moves the item `uid` into `slot` of `u` when it may go there; returns what kept it out. */
function moveIfPossible(data: GameData, c: CampaignState, u: UnitRecord, uid: string, slot: EquipSlot | 'bag', run: GearRun, skills: string[]): void {
  const loc = locateItem(c, uid);
  if (!loc) {
    run.gone += 1;
    return;
  }
  if (loc.owner && loc.owner.id !== u.id) {
    run.skipped.push({ uid, def: loc.inst.def, unit: loc.owner.id });
    return;
  }
  if (loc.owner === u && loc.slot === slot) return;
  const d = itemDef(data, loc.inst);
  if (slot === 'bag') {
    if (d.tags?.includes('convoyOnly') || bagIsFull(data, u.bag, loc.inst)) {
      run.skipped.push({ uid, def: loc.inst.def });
      return;
    }
  }
  else {
    const err = canEquip(data, u, loc.inst, slot, skills);
    if (err !== null && err !== 'two_handed') {
      run.skipped.push({ uid, def: loc.inst.def });
      return;
    }
  }
  equipInto(data, c, u, takeItem(c, uid)!, slot);
  run.equipped.push({ uid, slot });
}

/**
 * Applies the saved template of `u` (story 10.10): the equipment places in their order, then the bag. Items that were sold
 * count as gone, items another figure holds and items the figure may no longer hold stay where they are and are named.
 * Mutates `c`; the caller works on a copy (`validateCampaign` on a clone, `applyCampaign` on its own).
 */
export function runGearTemplate(data: GameData, c: CampaignState, unitId: string): GearRun {
  const run: GearRun = { equipped: [], skipped: [], gone: 0 };
  const u = c.roster.find((r) => r.id === unitId);
  const tpl = u?.gearTemplate;
  if (!u || !tpl) return run;
  const skills = activeSkillIds(data, u, relicCtx(data, c));
  for (const slot of EQUIP_SLOTS) {
    const uid = tpl.equip[slot];
    if (uid) moveIfPossible(data, c, u, uid, slot, run, skills);
  }
  for (const uid of tpl.bag) moveIfPossible(data, c, u, uid, 'bag', run, skills);
  return run;
}

/**
 * Puts the best weapon and armor of convoy and own gear on `u` (story 10.10, convoy level 3) through `pickBestGear`.
 * Mutates `c` like `runGearTemplate`.
 */
export function runEquipBest(data: GameData, c: CampaignState, unitId: string): GearRun {
  const run: GearRun = { equipped: [], skipped: [], gone: 0 };
  const u = c.roster.find((r) => r.id === unitId);
  if (!u) return run;
  const rc = relicCtx(data, c);
  const pool = [...allItems(u), ...c.convoy].filter((i) => !itemDef(data, i).tags?.includes('convoyOnly'));
  for (const { slot, inst } of pickBestGear(data, u, pool, rc, activeSkillIds(data, u, rc))) {
    // a pick can be gone already: a two-handed weapon in hand moves the shield of the same run back to the convoy
    if (!locateItem(c, inst.uid)) continue;
    equipInto(data, c, u, takeItem(c, inst.uid)!, slot);
    run.equipped.push({ uid: inst.uid, slot });
  }
  return run;
}
