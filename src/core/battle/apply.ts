import { CoreInvariantError } from '../errors';
import type { GameData, Pos, Reward } from '../defs';
import type { GameEvent } from '../events';
import { roll1 } from '../rng';
import { resolveAttack } from '../rules/combat';
import { applyStatus, damageUnit, endOfPhase, extinguishTile, igniteTile, startOfPhase, tickTerrain } from '../rules/effects';
import { canEquip, itemDef, isRune, weaponProfile } from '../rules/items';
import { pathTo, reachable } from '../rules/movement';
import { grantExp } from '../rules/progression';
import { computeStats } from '../rules/stats';
import { addSupportPoints, adjacentPartners } from '../rules/supports';
import { activeSkillIds } from '../rules/skills';
import type { BattleState, BattleUnit, ItemInstance } from '../state';
import { active, clone, getUnit, neighbors, onMap, pairKey, posKey, samePos } from '../util';
import { attackTargets, availableActions, hasKey, itemTargets, nearConvoy, staffTargets } from './actions';
import type { Action, Command, CommandError } from './commands';
import { newItem } from './create';
import { afterUnitMoved, beginPhase, checkObjectives, freeTileNear, mapOf, runTriggers, spawnUnits } from './objectives';
import { runAiPhase } from '../ai/ai';

export interface ApplyResult {
  state: BattleState;
  events: GameEvent[];
}

function moveValid(data: GameData, s: BattleState, u: BattleUnit, to: Pos): CommandError | null {
  if (samePos(u.pos, to)) return null;
  if (u.moved) return 'already_moved';
  const reach = reachable(data, s, u);
  if (!reach.has(posKey(to))) return 'unreachable';
  if (s.units.some((o) => o.uid !== u.uid && onMap(o) && samePos(o.pos, to))) return 'occupied';
  return null;
}

function actionValid(data: GameData, s: BattleState, u: BattleUnit, to: Pos, a: Action): CommandError | null {
  const opts = availableActions(data, s, u, to);
  const opt = opts.find((o) => o.kind === a.kind);
  if (!opt) return 'not_allowed';
  switch (a.kind) {
    case 'attack': {
      const ws = opt.weapons?.[a.target];
      if (!ws) return 'invalid_target';
      if (a.weapon && !ws.includes(a.weapon)) return 'out_of_range';
      return null;
    }
    case 'staff':
    case 'rescue':
    case 'talk':
    case 'command':
      return opt.targets?.includes(a.target) ? null : 'invalid_target';
    case 'item': {
      if (!opt.items?.includes(a.item)) return 'invalid_target';
      const targets = itemTargets(data, s, u, to, a.item);
      if (a.target && !targets.includes(a.target)) return 'invalid_target';
      if (!a.target && targets.length && !targets.includes(u.uid)) return 'invalid_target';
      return null;
    }
    case 'door':
      return opt.object === a.object ? null : 'invalid_target';
    default:
      return null;
  }
}

export function validate(data: GameData, s: BattleState, cmd: Command): CommandError | null {
  if (s.outcome) return 'battle_over';
  if (cmd.type === 'endPhase') return s.phase === 'player' ? null : 'not_your_phase';
  const u = s.units.find((x) => x.uid === cmd.unit);
  if (!u || !active(u)) return 'unknown_unit';
  if (u.team !== s.phase) return 'not_your_phase';
  if (u.acted) return 'unit_exhausted';
  switch (cmd.type) {
    case 'move':
      if (u.moved) return 'already_moved';
      return moveValid(data, s, u, cmd.to);
    case 'act':
      return moveValid(data, s, u, cmd.to) ?? actionValid(data, s, u, cmd.to, cmd.action);
    case 'equip': {
      const inst = [...Object.values(u.equip), ...u.bag].find((i) => i?.uid === cmd.item);
      if (!inst) return 'invalid_target';
      if (cmd.slot === 'bag') return null;
      return canEquip(data, u, inst, cmd.slot, activeSkillIds(data, u)) ? 'cannot_equip' : null;
    }
    case 'trade': {
      if (u.freeUsed.trade) return 'already_used';
      const o = s.units.find((x) => x.uid === cmd.with);
      if (!o || !active(o) || o.team !== u.team || !u.pos || !o.pos) return 'invalid_target';
      if (!neighbors(u.pos).some((p) => samePos(p, o.pos))) return 'not_adjacent';
      return null;
    }
    case 'convoy':
      if (u.freeUsed.convoy) return 'already_used';
      if (!u.pos || !nearConvoy(s, u, u.pos)) return 'not_adjacent';
      return null;
  }
}

/** Applies a validated command to a copy of the state and returns the new state and its events. */
export function applyCommand(data: GameData, prev: BattleState, cmd: Command): ApplyResult {
  const err = validate(data, prev, cmd);
  if (err) throw new CoreInvariantError('invalid_command', { command: cmd.type, reason: err });
  const s = clone(prev);
  const events: GameEvent[] = [];
  switch (cmd.type) {
    case 'move': {
      const u = getUnit(s, cmd.unit);
      doMove(data, s, u, cmd.to, events);
      u.moved = true;
      break;
    }
    case 'act': {
      const u = getUnit(s, cmd.unit);
      doMove(data, s, u, cmd.to, events);
      if (active(u) && !s.outcome) doAction(data, s, u, cmd.action, events);
      finishUnit(data, s, u, events);
      break;
    }
    case 'equip':
      doEquip(data, getUnit(s, cmd.unit), cmd.item, cmd.slot, events);
      break;
    case 'trade':
      doTrade(data, s, cmd, events);
      break;
    case 'convoy':
      doConvoy(data, s, cmd, events);
      break;
    case 'endPhase':
      endPlayerPhase(data, s, events);
      break;
  }
  checkObjectives(data, s, events);
  return { state: s, events };
}

function doMove(data: GameData, s: BattleState, u: BattleUnit, to: Pos, events: GameEvent[]): void {
  if (!u.pos || samePos(u.pos, to)) return;
  const path = pathTo(reachable(data, s, u), to);
  u.pos = [to[0], to[1]];
  u.moved = true;
  events.push({ t: 'moved', unit: u.uid, path });
  pickUpLoot(data, s, u, events);
  afterUnitMoved(data, s, u, events);
}

function pickUpLoot(data: GameData, s: BattleState, u: BattleUnit, events: GameEvent[]): void {
  if (u.team !== 'player' || !u.pos) return;
  const here = s.loot.filter((l) => samePos(l.at, u.pos));
  if (!here.length) return;
  s.loot = s.loot.filter((l) => !samePos(l.at, u.pos));
  for (const l of here) giveItem(data, s, u, l.item, events);
}

export function giveItem(data: GameData, s: BattleState, u: BattleUnit, item: ItemInstance, events: GameEvent[]): void {
  const d = itemDef(data, item);
  const toConvoy = u.bag.length >= data.balance.bag.size || !!d.tags?.includes('convoyOnly') || isRune(data, item);
  if (toConvoy) s.convoy.push(item);
  else u.bag.push(item);
  s.itemsGained.push(item);
  events.push({ t: 'loot', unit: u.uid, item, toConvoy });
}

function grantReward(data: GameData, s: BattleState, u: BattleUnit, r: Reward | undefined, events: GameEvent[]): void {
  if (!r) return;
  if (r.dialogue) events.push({ t: 'dialogue', id: r.dialogue });
  if (r.gold) {
    s.goldGained += r.gold;
    events.push({ t: 'gold', amount: r.gold });
  }
  for (const [id, n] of Object.entries(r.material ?? {})) {
    s.materialsGained[id] = (s.materialsGained[id] ?? 0) + n;
    events.push({ t: 'material', id, amount: n });
  }
  if (r.item) giveItem(data, s, u, newItem(s, r.item, data), events);
  if (r.recruit) {
    const def = data.chars[r.recruit];
    if (def && u.pos) {
      const at = freeTileNear(s, u.pos) ?? u.pos;
      spawnUnits(data, s, [{ char: r.recruit, team: 'player', class: def.class, level: def.level, at, items: [] }], false, events);
      const nu = s.units[s.units.length - 1]!;
      nu.uid = r.recruit;
      nu.acted = true;
      s.stats.recruited.push(r.recruit);
      events.push({ t: 'recruited', unit: nu.uid });
    }
  }
}

function useCharge(data: GameData, u: BattleUnit, inst: ItemInstance): void {
  const save = activeSkillIds(data, u)
    .map((id) => data.skills[id]!.effect.bagChargeSaveChance ?? 0)
    .reduce((a, b) => Math.max(a, b), 0);
  void save;
  inst.charges = (inst.charges ?? 1) - 1;
  if (inst.charges <= 0 && !itemDef(data, inst).refillAfterMission) {
    u.bag = u.bag.filter((i) => i.uid !== inst.uid);
  }
}

function useChargeRolled(data: GameData, s: BattleState, u: BattleUnit, inst: ItemInstance): void {
  const save = activeSkillIds(data, u)
    .map((id) => data.skills[id]!.effect.bagChargeSaveChance ?? 0)
    .reduce((a, b) => Math.max(a, b), 0);
  if (save > 0 && roll1(s.rng, save)) return;
  useCharge(data, u, inst);
}

function doAction(data: GameData, s: BattleState, u: BattleUnit, a: Action, events: GameEvent[]): void {
  const b = data.balance;
  switch (a.kind) {
    case 'wait':
      break;
    case 'attack': {
      const target = getUnit(s, a.target);
      const weapon = a.weapon ?? attackTargets(data, s, u, u.pos!)[a.target]?.[0];
      if (target.quote && !s.firedTriggers.includes(`quote:${target.uid}`)) {
        s.firedTriggers.push(`quote:${target.uid}`);
        events.push({ t: 'quote', unit: target.uid, id: target.quote });
      }
      resolveAttack(data, s, u.uid, target.uid, weapon, events);
      break;
    }
    case 'staff': {
      const target = getUnit(s, a.target);
      const staff =
        (a.staff ? [u.equip.mainHand, ...u.bag].find((i) => i?.uid === a.staff) : undefined) ??
        [u.equip.mainHand, ...u.bag].find((i) => i && itemDef(data, i).kind === 'staff');
      if (!staff) break;
      const d = itemDef(data, staff);
      const st = computeStats(data, u, { state: s });
      const tmax = computeStats(data, target).maxHp;
      const amount = Math.min(tmax - target.hp, (d.heal ?? 0) + st.stats.mag + st.skills.healBonus);
      target.hp += amount;
      events.push({ t: 'heal', unit: target.uid, amount, hpAfter: target.hp, by: u.uid, cause: 'staff' });
      if (d.cureStatus && target.status.length) {
        for (const x of target.status) events.push({ t: 'status', unit: target.uid, status: x.id, on: false });
        target.status = [];
      }
      if (u.team === 'player') grantExp(data, u, b.experience.heal, s.rng, events);
      const gained = addSupportPoints(data, s.supports, pairKey(u.id, target.id), b.supports.pointsTandemHealRescue);
      if (gained) events.push({ t: 'support', a: u.uid, b: target.uid, points: gained });
      break;
    }
    case 'item': {
      const inst = u.bag.find((i) => i.uid === a.item)!;
      const use = itemDef(data, inst).use!;
      const target = a.target ? getUnit(s, a.target) : u;
      events.push({ t: 'itemUsed', unit: u.uid, item: inst.def, target: target.uid });
      if (use.heal) {
        const max = computeStats(data, target).maxHp;
        const amount = Math.min(max - target.hp, use.heal + (inst.upgrade ?? 0) * (b.economy.potionUpgrade[0]?.heal ?? 0));
        target.hp += amount;
        events.push({ t: 'heal', unit: target.uid, amount, hpAfter: target.hp, cause: 'item' });
      }
      if (use.cureStatus) {
        for (const x of target.status) events.push({ t: 'status', unit: target.uid, status: x.id, on: false });
        target.status = [];
      }
      if (use.damage) {
        damageUnit(data, s, target, use.damage, 'item', events);
        if (use.status && active(target)) applyStatus(data, s, target, use.status, events);
        if (use.terrain === 'ignite' && target.pos) igniteTile(data, s, target.pos, 'ignite', events);
        if (use.terrain === 'extinguish' && target.pos) extinguishTile(s, target.pos, events);
      }
      if (use.statMods?.mov) {
        target.buffs.push({ source: inst.def, mov: use.statMods.mov, untilTurn: s.turn, untilPhase: target.team });
      }
      useChargeRolled(data, s, u, inst);
      break;
    }
    case 'visit': {
      const obj = s.objects.find((o) => samePos(o.at, u.pos) && o.type === 'village')!;
      obj.state = 'visited';
      s.stats.villagesVisited.push(obj.id);
      events.push({ t: 'visited', unit: u.uid, object: obj.id });
      grantReward(data, s, u, mapOf(data, s).objects.find((o) => o.id === obj.id)?.reward, events);
      runTriggers(data, s, { kind: 'action', unit: u }, events);
      break;
    }
    case 'chest': {
      const obj = s.objects.find((o) => samePos(o.at, u.pos) && o.type === 'chest')!;
      const key = u.bag.find((i) => i.uid === hasKey(data, u))!;
      useCharge(data, u, key);
      obj.state = 'open';
      s.stats.chestsOpened.push(obj.id);
      events.push({ t: 'opened', unit: u.uid, object: obj.id });
      grantReward(data, s, u, mapOf(data, s).objects.find((o) => o.id === obj.id)?.contents, events);
      break;
    }
    case 'door': {
      const obj = s.objects.find((o) => o.id === a.object)!;
      const key = u.bag.find((i) => i.uid === hasKey(data, u))!;
      useCharge(data, u, key);
      obj.state = 'open';
      s.terrain[obj.at[1] * s.width + obj.at[0]] = 'door_open';
      events.push({ t: 'opened', unit: u.uid, object: obj.id });
      events.push({ t: 'terrain', at: obj.at, terrain: 'door_open', cause: 'raze' });
      runTriggers(data, s, { kind: 'action', unit: u }, events);
      break;
    }
    case 'rescue': {
      const t = getUnit(s, a.target);
      t.gone = 'rescued';
      t.downed = false;
      events.push({ t: 'rescued', unit: t.uid, by: u.uid });
      grantExp(data, u, b.experience.rescueOrTalk, s.rng, events);
      const gained = addSupportPoints(data, s.supports, pairKey(u.id, t.id), b.supports.pointsTandemHealRescue);
      if (gained) events.push({ t: 'support', a: u.uid, b: t.uid, points: gained });
      break;
    }
    case 'talk': {
      const t = getUnit(s, a.target);
      if (t.recruit?.dialogue) events.push({ t: 'dialogue', id: t.recruit.dialogue });
      t.team = 'player';
      t.ai = undefined;
      t.acted = true;
      t.recruit = undefined;
      t.dropUids = [];
      s.stats.recruited.push(t.id);
      events.push({ t: 'recruited', unit: t.uid, by: u.uid });
      grantExp(data, u, b.experience.rescueOrTalk, s.rng, events);
      runTriggers(data, s, { kind: 'action', unit: u }, events);
      break;
    }
    case 'command': {
      const t = getUnit(s, a.target);
      const sk = activeSkillIds(data, u).find((id) => data.skills[id]!.effect.refreshAction)!;
      u.usedPerMap[sk] = (u.usedPerMap[sk] ?? 0) + 1;
      t.acted = false;
      t.moved = false;
      events.push({ t: 'refreshed', unit: t.uid, by: u.uid });
      break;
    }
    case 'rally': {
      const sk = activeSkillIds(data, u).find((id) => data.skills[id]!.trigger === 'action' && data.skills[id]!.area)!;
      const def = data.skills[sk]!;
      u.usedPerMap[sk] = (u.usedPerMap[sk] ?? 0) + 1;
      const affected: string[] = [];
      for (const o of s.units) {
        if (!active(o) || o.team !== u.team || !o.pos || !u.pos) continue;
        if (Math.abs(o.pos[0] - u.pos[0]) + Math.abs(o.pos[1] - u.pos[1]) > (def.area?.radius ?? 0)) continue;
        o.buffs.push({
          source: sk,
          damage: def.effect.damageBonus,
          hit: def.effect.hitBonus,
          untilTurn: s.turn + (u.team === 'player' ? 1 : 1),
          untilPhase: 'enemy',
        });
        affected.push(o.uid);
      }
      events.push({ t: 'rally', unit: u.uid, affected });
      break;
    }
    case 'seize':
      events.push({ t: 'seized', unit: u.uid });
      if (!s.outcome) {
        s.outcome = 'victory';
        events.push({ t: 'battleEnd', outcome: 'victory' });
      }
      break;
    case 'escape':
      u.gone = 'escaped';
      events.push({ t: 'escaped', unit: u.uid });
      break;
  }
}

/** End of a unit's action: exhausted, support points for adjacent partners, triggers. */
function finishUnit(data: GameData, s: BattleState, u: BattleUnit, events: GameEvent[]): void {
  u.acted = true;
  u.moved = true;
  if (!active(u)) return;
  events.push({ t: 'exhausted', unit: u.uid });
  if (u.pos) {
    for (const { unit: p } of adjacentPartnersAny(s, u, u.pos)) {
      const gained = addSupportPoints(data, s.supports, pairKey(u.id, p.id), data.balance.supports.pointsAdjacentEnd);
      if (gained) events.push({ t: 'support', a: u.uid, b: p.uid, points: gained });
    }
  }
  runTriggers(data, s, { kind: 'action', unit: u }, events);
}

/** Partners regardless of unlocked rank (points accumulate before the first rank). */
function adjacentPartnersAny(s: BattleState, u: BattleUnit, pos: Pos): Array<{ unit: BattleUnit }> {
  const ranked = adjacentPartners(s, u, pos).map((x) => x.unit.uid);
  const out: Array<{ unit: BattleUnit }> = [];
  for (const p of neighbors(pos)) {
    const o = s.units.find((x) => onMap(x) && samePos(x.pos, p));
    if (!o || !active(o) || o.team !== u.team) continue;
    if (s.supports[pairKey(u.id, o.id)] || ranked.includes(o.uid)) out.push({ unit: o });
  }
  return out;
}

function findInventory(u: BattleUnit, uid: string): { inst: ItemInstance; remove: () => void } | null {
  for (const [slot, inst] of Object.entries(u.equip)) {
    if (inst?.uid === uid) return { inst, remove: () => delete u.equip[slot as keyof typeof u.equip] };
  }
  const idx = u.bag.findIndex((i) => i.uid === uid);
  if (idx >= 0) return { inst: u.bag[idx]!, remove: () => u.bag.splice(u.bag.indexOf(u.bag.find((i) => i.uid === uid)!), 1) };
  return null;
}

/** Puts an item into a slot of a unit; a displaced item goes to the bag (or is returned). */
function place(data: GameData, u: BattleUnit, inst: ItemInstance, slot: Parameters<typeof canEquip>[3]): ItemInstance | null {
  if (slot === 'bag') {
    if (u.bag.length >= data.balance.bag.size) return inst;
    u.bag.push(inst);
    return null;
  }
  const old = u.equip[slot];
  u.equip[slot] = inst;
  if (slot === 'mainHand' && itemDef(data, inst).twoHanded && u.equip.offHand) {
    const off = u.equip.offHand;
    delete u.equip.offHand;
    if (u.bag.length < data.balance.bag.size) u.bag.push(off);
    else return off;
  }
  if (old) {
    if (u.bag.length < data.balance.bag.size) u.bag.push(old);
    else return old;
  }
  return null;
}

function doEquip(data: GameData, u: BattleUnit, item: string, slot: Parameters<typeof canEquip>[3], events: GameEvent[]): void {
  const found = findInventory(u, item);
  if (!found) return;
  found.remove();
  const rest = place(data, u, found.inst, slot);
  if (rest) u.bag.push(rest); // bag overflow is tolerated for a swap (one item can be over the limit)
  events.push({ t: 'equipped', unit: u.uid, item });
}

function doTrade(data: GameData, s: BattleState, cmd: Extract<Command, { type: 'trade' }>, events: GameEvent[]): void {
  const a = getUnit(s, cmd.unit);
  const b = getUnit(s, cmd.with);
  a.freeUsed.trade = true;
  for (const op of cmd.ops) {
    const fromA = findInventory(a, op.item);
    const from = fromA ?? findInventory(b, op.item);
    if (!from) continue;
    const to = op.to === a.uid ? a : b;
    if (op.slot !== 'bag' && canEquip(data, to, from.inst, op.slot, activeSkillIds(data, to))) continue;
    if (op.slot === 'bag' && to.bag.length >= data.balance.bag.size) continue;
    from.remove();
    const rest = place(data, to, from.inst, op.slot);
    if (rest) (to === a ? b : a).bag.push(rest);
  }
  events.push({ t: 'equipped', unit: a.uid, item: 'trade' });
}

function doConvoy(data: GameData, s: BattleState, cmd: Extract<Command, { type: 'convoy' }>, events: GameEvent[]): void {
  const u = getUnit(s, cmd.unit);
  u.freeUsed.convoy = true;
  if (cmd.put) {
    const f = findInventory(u, cmd.put);
    if (f) {
      f.remove();
      s.convoy.push(f.inst);
    }
  }
  if (cmd.take) {
    const idx = s.convoy.findIndex((i) => i.uid === cmd.take);
    if (idx >= 0) {
      const inst = s.convoy[idx]!;
      s.convoy.splice(idx, 1);
      const rest = place(data, u, inst, cmd.slot ?? 'bag');
      if (rest) s.convoy.push(rest);
    }
  }
  events.push({ t: 'equipped', unit: u.uid, item: 'convoy' });
}

/** Player ends the phase: enemy phase, third-party phase, next round (concept/03 §1). */
function endPlayerPhase(data: GameData, s: BattleState, events: GameEvent[]): void {
  endOfPhase(s, 'player', events);
  for (const team of ['enemy', 'other'] as const) {
    checkObjectives(data, s, events);
    if (s.outcome) return;
    if (team === 'other' && !s.units.some((u) => u.team === 'other' && onMap(u))) continue;
    beginPhase(data, s, team, events);
    startOfPhase(data, s, team, events);
    checkObjectives(data, s, events);
    if (s.outcome) return;
    runAiPhase(data, s, team, events);
    endOfPhase(s, team, events);
  }
  checkObjectives(data, s, events);
  if (s.outcome) return;
  s.turn += 1;
  tickTerrain(data, s, events);
  beginPhase(data, s, 'player', events);
  startOfPhase(data, s, 'player', events);
  checkObjectives(data, s, events, true);
}

/** First events of a battle (phase banner, turn-1 triggers). */
export function startBattle(data: GameData, s: BattleState): ApplyResult {
  const st = clone(s);
  const events: GameEvent[] = [];
  beginPhase(data, st, 'player', events);
  return { state: st, events };
}

/** Exposed for the AI: performs an act for any team (no phase-owner check beyond validation). */
export function applyAct(data: GameData, s: BattleState, u: BattleUnit, to: Pos, action: Action, events: GameEvent[]): void {
  doMove(data, s, u, to, events);
  if (active(u) && !s.outcome) doAction(data, s, u, action, events);
  finishUnit(data, s, u, events);
  checkObjectives(data, s, events);
}

export { staffTargets, weaponProfile };
