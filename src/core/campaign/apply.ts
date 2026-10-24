import { CoreInvariantError } from '../errors';
import type { GameData } from '../defs';
import { applyCommand } from '../battle/apply';
import { newItem } from '../battle/create';
import { rollAffixes } from '../loot';
import { canEquip, isRune, itemDef, runeSlotCount, sellPrice } from '../rules/items';
import { loadoutSlots, promote } from '../rules/progression';
import { activeSkillIds } from '../rules/skills';
import { pendingRank } from '../rules/supports';
import type { CampaignState } from '../state';
import { clone } from '../util';
import { hireCost, hireError, locateItem, offerPrice, rerollAllowed, rerollCost, runeMerge, takeItem, upgradable, upgradeCost, upgradeLimit } from './camp';
import { currentTier, finishBattle, merchantStock } from './campaign';
import { replayBattle } from './restart';
import { applyEffects, validateEffects } from './effects';
import type { CampaignApplyResult, CampaignCommand, CampaignError, CampaignEvent } from './commands';

function buyPrice(data: GameData, c: CampaignState, defId: string): number | null {
  const stock = merchantStock(data, currentTier(data, c));
  const runeForSale = data.runes[defId]?.price !== undefined && (data.runes[defId]?.tier ?? 0) <= 1;
  if (!stock.includes(defId) && !runeForSale) return null;
  return itemDef(data, defId).price;
}

/** Seal used for a promotion: convoy first, then the unit's bag. */
function sealOf(data: GameData, c: CampaignState, unitId: string): { from: 'convoy' | 'bag'; index: number } | null {
  const conv = c.convoy.findIndex((i) => itemDef(data, i).use?.promote);
  if (conv >= 0) return { from: 'convoy', index: conv };
  const u = c.roster.find((r) => r.id === unitId);
  const bag = u ? u.bag.findIndex((i) => itemDef(data, i).use?.promote) : -1;
  return bag >= 0 ? { from: 'bag', index: bag } : null;
}

/** Checks a campaign command without changing anything (concept/24-architecture §8.1). */
export function validateCampaign(data: GameData, c: CampaignState, cmd: CampaignCommand): CampaignError | null {
  switch (cmd.type) {
    case 'buy': {
      const price = buyPrice(data, c, cmd.item);
      if (price === null) return 'not_for_sale';
      if (c.gold < price) return 'not_enough_gold';
      if (c.convoy.length >= data.balance.economy.convoySize) return 'convoy_full';
      return null;
    }
    case 'buyOffer': {
      const offer = c.offers.find((o) => o.uid === cmd.uid);
      if (!offer) return 'not_for_sale';
      return c.gold < offerPrice(data, offer) ? 'not_enough_gold' : null;
    }
    case 'sell': {
      const loc = locateItem(c, cmd.uid);
      if (!loc) return 'unknown_item';
      return sellPrice(data, loc.inst) <= 0 ? 'not_for_sale' : null;
    }
    case 'equip': {
      const u = c.roster.find((r) => r.id === cmd.unit);
      if (!u) return 'unknown_unit';
      const loc = locateItem(c, cmd.uid);
      if (!loc) return 'unknown_item';
      if (cmd.slot === 'bag') return u.bag.length >= data.balance.bag.size && loc.owner !== u ? 'bag_full' : null;
      const err = canEquip(data, u, loc.inst, cmd.slot, activeSkillIds(data, u));
      return err && err !== 'two_handed' ? 'cannot_equip' : null;
    }
    case 'unequip':
      return locateItem(c, cmd.uid) ? null : 'unknown_item';
    case 'upgrade': {
      const loc = locateItem(c, cmd.uid);
      if (!loc) return 'unknown_item';
      if (!upgradable(data, loc.inst)) return 'not_upgradable';
      const cost = upgradeCost(data, loc.inst);
      if (!cost || loc.inst.upgrade >= upgradeLimit(data, c)) return 'max_level';
      if (c.gold < cost.gold) return 'not_enough_gold';
      for (const [m, n] of Object.entries(cost.materials)) if ((c.materials[m] ?? 0) < n) return 'not_enough_materials';
      return null;
    }
    case 'reroll': {
      const loc = locateItem(c, cmd.uid);
      if (!loc || !loc.inst.affixes[cmd.index]) return 'unknown_item';
      if (!rerollAllowed(data, c)) return 'not_available';
      const cost = rerollCost(data, loc.inst);
      if (c.gold < cost.gold) return 'not_enough_gold';
      if ((c.materials.arcane_dust ?? 0) < cost.dust) return 'not_enough_materials';
      // dry run on a copy of the RNG: some items have no other affix to roll
      const [next] = rollAffixes(data, clone(c.rng), loc.inst.def, 'rare', loc.inst.affixes);
      return next ? null : 'not_available';
    }
    case 'insertRune': {
      const loc = locateItem(c, cmd.item);
      const rune = c.convoy.find((i) => i.uid === cmd.rune);
      if (!loc || !rune || !isRune(data, rune)) return 'unknown_item';
      const rdef = data.runes[rune.def]!;
      const runes = [...loc.inst.runes];
      while (runes.length < runeSlotCount(data, loc.inst)) runes.push(null);
      if (rdef.element && runes.some((r) => r && data.runes[r]?.element)) return 'no_slot';
      if (!runes.includes(null)) return 'no_slot';
      if (itemDef(data, loc.inst).slot === 'body' && !rdef.element) return 'no_slot';
      return null;
    }
    case 'removeRune': {
      const loc = locateItem(c, cmd.item);
      return loc?.inst.runes[cmd.index] ? null : 'unknown_item';
    }
    case 'mergeRunes': {
      if (!data.runes[cmd.rune]?.element || !data.runes[cmd.rune]?.tier) return 'unknown_item';
      const m = runeMerge(data, cmd.rune);
      if (!m) return 'max_level';
      if (c.convoy.filter((i) => i.def === cmd.rune).length < m.count) return 'not_enough_materials';
      return c.gold < m.gold ? 'not_enough_gold' : null;
    }
    case 'healScar': {
      const u = c.roster.find((r) => r.id === cmd.unit);
      if (!u || !u.scars[cmd.index]) return 'unknown_unit';
      const cfg = data.balance.economy.scarRemoval;
      if (cmd.herb) return c.convoy.some((i) => i.def === cfg.altItem) ? null : 'not_enough_materials';
      return c.gold < cfg.gold ? 'not_enough_gold' : null;
    }
    case 'unlockSupport': {
      const st = c.supports[cmd.pair];
      const rank = st && pendingRank(data, st);
      return !rank || rank === 'S' ? 'not_available' : null;
    }
    case 'setLoadout':
      return c.roster.some((r) => r.id === cmd.unit) ? null : 'unknown_unit';
    case 'promote': {
      const u = c.roster.find((r) => r.id === cmd.unit);
      if (!u) return 'unknown_unit';
      if (u.level < data.balance.levels.promoteFrom) return 'not_available';
      if (!data.classes[u.classId]?.promotesTo.includes(cmd.classId) || !data.classes[cmd.classId]) return 'unknown_class';
      return sealOf(data, c, cmd.unit) ? null : 'not_enough_materials';
    }
    case 'hire':
      return hireError(data, c, cmd.offer);
    case 'effects':
      return validateEffects(data, c, cmd.effects);
    case 'finishMission':
      // queued dialogue effects are checked when they are applied, against the state after the battle
      return c.available.includes(cmd.start.nodeId) ? null : 'node_unavailable';
    case 'restartTurn':
      if (!c.available.includes(cmd.node)) return 'node_unavailable';
      return c.settings.deathMode === 'classic' ? 'restart_forbidden' : null;
    case 'restartMission':
      if (!c.available.includes(cmd.node)) return 'node_unavailable';
      // Classic is the honour mode: a mission may only be started over once it is lost (replayed, not trusted)
      if (c.settings.deathMode === 'classic') {
        if (!cmd.lost || cmd.lost.start.nodeId !== cmd.node) return 'restart_forbidden';
        if (replayBattle(data, cmd.lost.start, cmd.lost.commands).outcome !== 'defeat') return 'restart_forbidden';
      }
      return null;
  }
}

/** Gold and material changes, derived from the states so no handler can forget them. */
function resourceEvents(before: CampaignState, after: CampaignState): CampaignEvent[] {
  const out: CampaignEvent[] = [];
  if (after.gold !== before.gold) out.push({ t: 'goldChanged', delta: after.gold - before.gold, gold: after.gold });
  const ids = [...new Set([...Object.keys(before.materials), ...Object.keys(after.materials)])].sort();
  for (const id of ids) {
    const delta = (after.materials[id] ?? 0) - (before.materials[id] ?? 0);
    if (delta) out.push({ t: 'materialChanged', id, delta });
  }
  return out;
}

/**
 * Applies a validated campaign command to a copy of the campaign. Throws on an invalid command
 * (the controller validates first), like `applyCommand` in battle.
 */
export function applyCampaign(data: GameData, prev: CampaignState, cmd: CampaignCommand): CampaignApplyResult {
  const err = validateCampaign(data, prev, cmd);
  if (err) throw new CoreInvariantError('invalid_campaign_command', { command: cmd.type, reason: err });
  if (cmd.type === 'finishMission') {
    let s = cmd.start;
    for (const bc of cmd.commands) s = applyCommand(data, s, bc).state;
    const { campaign: after, result } = finishBattle(data, prev, s);
    // dialogue effects queued during the battle count only when it was won (a lost battle leaves the campaign as it
    // was). They run after the battle result, so items land in the convoy finishBattle rebuilt; each dialogue's group
    // is checked against the state after the battle and skipped when it no longer fits (e.g. `leave` of a unit that fell).
    let campaign = after;
    const effectEvents: CampaignEvent[] = [];
    if (s.outcome === 'victory' && cmd.effects?.length) {
      campaign = clone(after);
      for (const q of cmd.effects) if (validateEffects(data, campaign, q.effects) === null) applyEffects(data, campaign, q.effects, effectEvents);
    }
    return { campaign, events: [...resourceEvents(prev, campaign), ...effectEvents, { t: 'missionFinished', result }] };
  }
  if (cmd.type === 'restartTurn') return { campaign: clone(prev), events: [{ t: 'battleRestarted', scope: 'turn', keep: cmd.keep }] };
  if (cmd.type === 'restartMission') return { campaign: clone(prev), events: [{ t: 'battleRestarted', scope: 'mission', keep: 0 }] };
  const c = clone(prev);
  const events: CampaignEvent[] = [];
  const gained = (uid: string, def: string) => events.push({ t: 'itemGained', uid, def });
  const lost = (uid: string, def: string) => events.push({ t: 'itemLost', uid, def });
  switch (cmd.type) {
    case 'buy': {
      c.gold -= buyPrice(data, c, cmd.item)!;
      const inst = newItem(c, cmd.item, data);
      c.convoy.push(inst);
      gained(inst.uid, inst.def);
      break;
    }
    case 'buyOffer': {
      const offer = c.offers.find((o) => o.uid === cmd.uid)!;
      c.gold -= offerPrice(data, offer);
      c.offers = c.offers.filter((o) => o.uid !== cmd.uid);
      c.convoy.push(offer);
      gained(offer.uid, offer.def);
      break;
    }
    case 'sell': {
      const inst = takeItem(c, cmd.uid)!;
      c.gold += sellPrice(data, inst);
      lost(inst.uid, inst.def);
      break;
    }
    case 'equip': {
      // moves an item (from convoy or any unit) into a unit's slot; the displaced item goes to the convoy
      const u = c.roster.find((r) => r.id === cmd.unit)!;
      const inst = takeItem(c, cmd.uid)!;
      if (cmd.slot === 'bag') u.bag.push(inst);
      else {
        const old = u.equip[cmd.slot];
        u.equip[cmd.slot] = inst;
        if (old) c.convoy.push(old);
        if (cmd.slot === 'mainHand' && itemDef(data, inst).twoHanded && u.equip.offHand) {
          c.convoy.push(u.equip.offHand);
          delete u.equip.offHand;
        }
        if (cmd.slot === 'offHand' && u.equip.mainHand && itemDef(data, u.equip.mainHand).twoHanded) {
          c.convoy.push(u.equip.mainHand);
          delete u.equip.mainHand;
        }
      }
      events.push({ t: 'equipped', unit: u.id, uid: inst.uid, slot: cmd.slot });
      break;
    }
    case 'unequip': {
      const loc = locateItem(c, cmd.uid)!;
      c.convoy.push(takeItem(c, cmd.uid)!);
      if (loc.owner) events.push({ t: 'unitChanged', unit: loc.owner.id });
      break;
    }
    case 'upgrade': {
      const inst = locateItem(c, cmd.uid)!.inst;
      const cost = upgradeCost(data, inst)!;
      c.gold -= cost.gold;
      for (const [m, n] of Object.entries(cost.materials)) c.materials[m] = (c.materials[m] ?? 0) - n;
      inst.upgrade += 1;
      events.push({ t: 'itemChanged', uid: inst.uid });
      break;
    }
    case 'reroll': {
      const inst = locateItem(c, cmd.uid)!.inst;
      const cost = rerollCost(data, inst);
      const [next] = rollAffixes(data, c.rng, inst.def, 'rare', inst.affixes);
      inst.affixes[cmd.index] = next!;
      c.gold -= cost.gold;
      c.materials.arcane_dust = (c.materials.arcane_dust ?? 0) - cost.dust;
      events.push({ t: 'itemChanged', uid: inst.uid });
      break;
    }
    case 'insertRune': {
      const inst = locateItem(c, cmd.item)!.inst;
      const rune = c.convoy.find((i) => i.uid === cmd.rune)!;
      const runes = [...inst.runes];
      while (runes.length < runeSlotCount(data, inst)) runes.push(null);
      runes[runes.indexOf(null)] = rune.def;
      inst.runes = runes;
      c.convoy = c.convoy.filter((i) => i.uid !== cmd.rune);
      lost(rune.uid, rune.def);
      events.push({ t: 'itemChanged', uid: inst.uid });
      break;
    }
    case 'removeRune': {
      const inst = locateItem(c, cmd.item)!.inst;
      const id = inst.runes[cmd.index]!;
      inst.runes[cmd.index] = null;
      const rune = newItem(c, id, data);
      c.convoy.push(rune);
      events.push({ t: 'itemChanged', uid: inst.uid });
      gained(rune.uid, rune.def);
      break;
    }
    case 'mergeRunes': {
      const m = runeMerge(data, cmd.rune)!;
      const used = c.convoy.filter((i) => i.def === cmd.rune).slice(0, m.count);
      const remove = new Set(used.map((i) => i.uid));
      c.convoy = c.convoy.filter((i) => !remove.has(i.uid));
      for (const i of used) lost(i.uid, i.def);
      const inst = newItem(c, m.next.id, data);
      c.convoy.push(inst);
      c.gold -= m.gold;
      gained(inst.uid, inst.def);
      break;
    }
    case 'healScar': {
      const u = c.roster.find((r) => r.id === cmd.unit)!;
      const cfg = data.balance.economy.scarRemoval;
      if (cmd.herb) {
        const herb = c.convoy.find((i) => i.def === cfg.altItem)!;
        c.convoy = c.convoy.filter((i) => i.uid !== herb.uid);
        lost(herb.uid, herb.def);
      } else c.gold -= cfg.gold;
      u.scars.splice(cmd.index, 1);
      events.push({ t: 'unitChanged', unit: u.id });
      break;
    }
    case 'unlockSupport': {
      const rank = pendingRank(data, c.supports[cmd.pair]!)!;
      c.supports[cmd.pair]!.rank = rank;
      events.push({ t: 'supportUnlocked', pair: cmd.pair, rank });
      break;
    }
    case 'setLoadout': {
      const u = c.roster.find((r) => r.id === cmd.unit)!;
      const valid = [...new Set(cmd.skills)].filter((s) => u.mastered.includes(s));
      u.loadout = valid.slice(0, loadoutSlots(data, u));
      events.push({ t: 'unitChanged', unit: u.id });
      break;
    }
    case 'promote': {
      const u = c.roster.find((r) => r.id === cmd.unit)!;
      const seal = sealOf(data, c, cmd.unit)!;
      const [used] = (seal.from === 'convoy' ? c.convoy : u.bag).splice(seal.index, 1);
      lost(used!.uid, used!.def);
      promote(data, u, cmd.classId);
      events.push({ t: 'promoted', unit: u.id, classId: cmd.classId });
      break;
    }
    case 'hire': {
      const rec = c.tavern.find((u) => u.id === cmd.offer)!;
      c.gold -= hireCost(data, rec.level);
      c.tavern = c.tavern.filter((u) => u.id !== cmd.offer);
      c.roster.push(rec);
      events.push({ t: 'unitJoined', unit: rec.id });
      break;
    }
    case 'effects':
      applyEffects(data, c, cmd.effects, events);
      break;
  }
  return { campaign: c, events: [...resourceEvents(prev, c), ...events] };
}

/** Rebuilds a campaign from a checkpoint and the commands applied after it (journal replay). */
export function replayCampaign(data: GameData, start: CampaignState, commands: readonly CampaignCommand[]): CampaignState {
  let c = start;
  for (const cmd of commands) c = applyCampaign(data, c, cmd).campaign;
  return c;
}
