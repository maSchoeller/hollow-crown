import { CoreInvariantError } from '../errors';
import type { Pos } from '../defs';
import type { GameData } from '../gameData';
import type { Reward } from '../mapDefs';
import type { GameEvent } from '../events';
import { roll1 } from '../rng';
import { resolveAttack } from '../rules/combat';
import { applyStatus, damageUnit, endOfPhase, extinguishTile, igniteTile, startOfPhase, tickTerrain } from '../rules/effects';
import { addToBag, bagIsFull, canEquip, itemDef, weaponProfile } from '../rules/items';
import { resolveCast } from '../rules/cast';
import { goesToConvoy } from '../rules/scout';
import { destinations, pathTo, pursueReach, reachable, walkPath, type Walk } from '../rules/movement';
import { expPercent, grantExp } from '../rules/progression';
import { ensureHauntMap } from './hauntMap';
import { computeStats } from '../rules/stats';
import { addSupportPoints, adjacentPartners } from '../rules/supports';
import { activeSkillIds, afterActionMove } from '../rules/skills';
import type { BattleState, BattleUnit, ItemInstance, ObjectState } from '../state';
import { active, clone, getUnit, neighbors, onMap, pairKey, posKey, samePos } from '../util';
import { aimTargets, attackTargets, availableActions, CHEER_BUFF, classActionId, hasKey, itemTargets, nearConvoy, pursueRest, staffTargets } from './actions';
import type { Action, Command, CommandError } from './commands';
import { newItem } from './create';
import { noteLieutenantSight } from './lieutenantSight';
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

/** The walk of a command that carries its planned `path` (story 2.6): an error when it is no legal walk, else the walk (cut short by a hidden foe or not). */
function pathWalk(data: GameData, s: BattleState, u: BattleUnit, to: Pos, path: Pos[], mov?: number): Walk | CommandError {
  const w = walkPath(data, s, u, path, mov);
  return !w || !samePos(path[path.length - 1], to) ? 'unreachable' : w;
}

function actionValid(data: GameData, s: BattleState, u: BattleUnit, to: Pos, a: Action): CommandError | null {
  const opts = availableActions(data, s, u, to);
  const opt = opts.find((o) => o.kind === a.kind);
  if (!opt) return 'not_allowed';
  switch (a.kind) {
    case 'attack':
    case 'aim': {
      const ws = opt.weapons?.[a.target];
      if (!ws) return 'invalid_target';
      if (a.weapon && !ws.includes(a.weapon)) return 'out_of_range';
      return null;
    }
    case 'staff':
    case 'rescue':
    case 'farRescue':
    case 'cheer':
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
    case 'cast':
      return opt.tiles?.some((p) => samePos(p, a.at)) ? null : 'invalid_target';
    case 'door':
      return opt.object === a.object ? null : 'invalid_target';
    case 'open':
      return opts.some((o) => o.kind === 'open' && o.object === a.object) ? null : 'invalid_target';
    case 'steal':
      return opt.stealable?.[a.target]?.includes(a.item) ? null : 'invalid_target';
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
  if (cmd.type === 'pursue') {
    // Nachsetzen is the one command a unit that has acted may still get (story 2.4)
    const reach = pursueReach(data, s, u);
    if (!reach) return 'no_pursue';
    if (cmd.path) {
      const w = pathWalk(data, s, u, cmd.to, cmd.path, s.pursue?.left);
      return typeof w === 'string' ? w : null;
    }
    if (!reach.has(posKey(cmd.to)) || samePos(u.pos, cmd.to)) return 'unreachable';
    return s.units.some((o) => o.uid !== u.uid && onMap(o) && samePos(o.pos, cmd.to)) ? 'occupied' : null;
  }
  if (u.acted) return 'unit_exhausted';
  switch (cmd.type) {
    case 'move':
      if (u.moved) return 'already_moved';
      if (cmd.path) {
        const w = pathWalk(data, s, u, cmd.to, cmd.path);
        return typeof w === 'string' ? w : null;
      }
      return moveValid(data, s, u, cmd.to);
    case 'act': {
      if (cmd.path && !samePos(u.pos, cmd.to)) {
        if (u.moved) return 'already_moved';
        const w = pathWalk(data, s, u, cmd.to, cmd.path);
        if (typeof w === 'string') return w;
        // stopped by a foe: the action does not happen, so it is not checked
        return w.cut ? null : actionValid(data, s, u, cmd.to, cmd.action);
      }
      return moveValid(data, s, u, cmd.to) ?? actionValid(data, s, u, cmd.to, cmd.action);
    }
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
  ensureHauntMap(data, prev.mapId); // a haunt's map is made from its id when the state comes from a save or the worker (story 5.6)
  const err = validate(data, prev, cmd);
  if (err) throw new CoreInvariantError('invalid_command', { command: cmd.type, reason: err });
  const s = clone(prev);
  const events: GameEvent[] = [];
  // any command ends the chance to pursue; an attack of a skirmisher below opens it again
  delete s.pursue;
  let pursueLeft = 0;
  switch (cmd.type) {
    case 'move': {
      const u = getUnit(s, cmd.unit);
      const w = cmd.path && !samePos(u.pos, cmd.to) ? (walkPath(data, s, u, cmd.path) ?? undefined) : undefined;
      doMove(data, s, u, cmd.to, events, undefined, w);
      u.moved = true;
      if (w?.cut) {
        ambush(u, w, events);
        finishUnit(data, s, u, events);
      }
      break;
    }
    case 'act': {
      const u = getUnit(s, cmd.unit);
      const w = cmd.path && !samePos(u.pos, cmd.to) ? (walkPath(data, s, u, cmd.path) ?? undefined) : undefined;
      if (!w?.cut && cmd.action.kind === 'attack' && classActionId(data, u, s) === 'pursue') pursueLeft = pursueRest(data, s, u, cmd.to);
      // Wolfslauf / Weiterziehen: after a real action a fixed number of fields more; with Nachsetzen the higher of the two (review R3)
      const afterAction = !w?.cut && cmd.action.kind !== 'wait' ? afterActionMove(data, u) : 0;
      doMove(data, s, u, cmd.to, events, undefined, w);
      if (w?.cut) ambush(u, w, events);
      else if (active(u) && !s.outcome) doAction(data, s, u, cmd.action, events);
      finishUnit(data, s, u, events);
      pursueLeft = active(u) ? Math.max(pursueLeft, afterAction) : 0;
      break;
    }
    case 'pursue': {
      const u = getUnit(s, cmd.unit);
      const w = cmd.path ? (walkPath(data, s, u, cmd.path, prev.pursue!.left) ?? undefined) : undefined;
      doMove(data, s, u, cmd.to, events, prev.pursue!.left, w);
      if (w?.cut) ambush(u, w, events);
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
  noteLieutenantSight(data, s);
  if (pursueLeft > 0 && !s.outcome) openPursue(data, s, getUnit(s, (cmd as Extract<Command, { type: 'act' }>).unit), pursueLeft);
  return { state: s, events };
}

/** Nachsetzen: remembers the rest for the skirmisher that just attacked, unless there is nowhere left to go. */
function openPursue(data: GameData, s: BattleState, u: BattleUnit, left: number): void {
  s.pursue = { unit: u.uid, left };
  const reach = pursueReach(data, s, u);
  if (!reach || !destinations(s, u, reach).some((p) => !samePos(p, u.pos))) delete s.pursue;
}

/** The walk of the enemy AI after its action (Wolfslauf, review R3): the same move as `pursue`, limited to `fields`. */
export function moveAfterAction(data: GameData, s: BattleState, u: BattleUnit, to: Pos, fields: number, events: GameEvent[]): void {
  doMove(data, s, u, to, events, fields);
  checkObjectives(data, s, events);
}

/** Hinterhalt: the walk was stopped by a foe the player did not see (the unit stands where the walk ended). */
function ambush(u: BattleUnit, w: Walk, events: GameEvent[]): void {
  events.push({ t: 'ambush', unit: u.uid, by: w.cut!.by, at: [u.pos![0], u.pos![1]] });
}

/** `walked`: the walk along the player's planned path (it may end before `to`); without it the core finds the way. */
function doMove(data: GameData, s: BattleState, u: BattleUnit, to: Pos, events: GameEvent[], mov?: number, walked?: Walk): void {
  if (!u.pos) return;
  let path: Pos[];
  if (walked) {
    path = walked.tiles;
    to = path[path.length - 1]!;
    if (samePos(u.pos, to)) {
      u.moved = true;
      return;
    }
    u.moveSpent = walked.cost;
  } else {
    if (samePos(u.pos, to)) return;
    const reach = reachable(data, s, u, u.pos, mov);
    path = pathTo(reach, to);
    u.moveSpent = reach.get(posKey(to))?.cost ?? 0;
  }
  u.pos = [to[0], to[1]];
  u.moved = true;
  events.push({ t: 'moved', unit: u.uid, path });
  pickUpLoot(data, s, u, events);
  afterUnitMoved(data, s, u, events);
  noteLieutenantSight(data, s);
}

function pickUpLoot(data: GameData, s: BattleState, u: BattleUnit, events: GameEvent[]): void {
  if (u.team !== 'player' || !u.pos) return;
  const here = s.loot.filter((l) => samePos(l.at, u.pos));
  if (!here.length) return;
  s.loot = s.loot.filter((l) => !samePos(l.at, u.pos));
  for (const l of here) giveItem(data, s, u, l.item, events);
}

export function giveItem(data: GameData, s: BattleState, u: BattleUnit, item: ItemInstance, events: GameEvent[]): void {
  const toConvoy = goesToConvoy(data, u, item);
  if (toConvoy) s.convoy.push(item);
  else addToBag(data, u.bag, item);
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
  if (r.chronicle && !(s.stats.pages ?? []).includes(r.chronicle)) (s.stats.pages ??= []).push(r.chronicle);
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

/** Bergen: the downed unit leaves the map as rescued; shared by `rescue` (adjacent) and `farRescue` (class action). */
function doRescue(data: GameData, s: BattleState, u: BattleUnit, t: BattleUnit, events: GameEvent[]): void {
  const b = data.balance;
  t.gone = 'rescued';
  t.downed = false;
  events.push({ t: 'rescued', unit: t.uid, by: u.uid });
  grantExp(data, u, b.experience.rescueOrTalk, s.rng, events, expPercent(data, s, u));
  const gained = addSupportPoints(data, s.supports, pairKey(u.id, t.id), b.supports.pointsTandemHealRescue);
  if (gained) events.push({ t: 'support', a: u.uid, b: t.uid, points: gained });
}

/** Opens a chest (its contents go to `u`) or a door (the terrain turns into an open door); the key and its charge are the caller's business. */
function openObject(data: GameData, s: BattleState, u: BattleUnit, obj: ObjectState, events: GameEvent[]): void {
  obj.state = 'open';
  if (obj.type === 'chest') {
    s.stats.chestsOpened.push(obj.id);
    events.push({ t: 'opened', unit: u.uid, object: obj.id });
    grantReward(data, s, u, mapOf(data, s).objects.find((o) => o.id === obj.id)?.contents, events);
    return;
  }
  s.terrain[obj.at[1] * s.width + obj.at[0]] = 'door_open';
  events.push({ t: 'opened', unit: u.uid, object: obj.id });
  events.push({ t: 'terrain', at: obj.at, terrain: 'door_open', cause: 'raze' });
  runTriggers(data, s, { kind: 'action', unit: u }, events);
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
    case 'aim': {
      const target = getUnit(s, a.target);
      const weapon = a.weapon ?? aimTargets(data, s, u, u.pos!)[a.target]?.[0];
      events.push({ t: 'classAction', unit: u.uid, action: 'aim', target: target.uid });
      if (target.quote && !s.firedTriggers.includes(`quote:${target.uid}`)) {
        s.firedTriggers.push(`quote:${target.uid}`);
        events.push({ t: 'quote', unit: target.uid, id: target.quote });
      }
      resolveAttack(data, s, u.uid, target.uid, weapon, events, { hit: b.classActions.aim.hit });
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
      if (u.team === 'player') grantExp(data, u, b.experience.heal, s.rng, events, expPercent(data, s, u));
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
        damageUnit(data, s, target, use.damage, 'item', events, u.uid);
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
      useCharge(data, u, u.bag.find((i) => i.uid === hasKey(data, u))!);
      openObject(data, s, u, obj, events);
      break;
    }
    case 'door': {
      const obj = s.objects.find((o) => o.id === a.object)!;
      useCharge(data, u, u.bag.find((i) => i.uid === hasKey(data, u))!);
      openObject(data, s, u, obj, events);
      break;
    }
    case 'open':
      // the scout needs no key and uses no charge
      openObject(data, s, u, s.objects.find((o) => o.id === a.object)!, events);
      break;
    case 'steal': {
      const target = getUnit(s, a.target);
      // the bag first; an equipped item only reaches here when the thief wears the Elster (validated with the options)
      const item = target.bag.find((i) => i.uid === a.item) ?? Object.values(target.equip).find((i) => i?.uid === a.item)!;
      target.bag = target.bag.filter((i) => i.uid !== item.uid);
      for (const slot of Object.keys(target.equip) as Array<keyof typeof target.equip>) if (target.equip[slot]?.uid === item.uid) delete target.equip[slot];
      target.dropUids = target.dropUids.filter((uid) => uid !== item.uid);
      events.push({ t: 'stolen', unit: u.uid, target: target.uid, item });
      giveItem(data, s, u, item, events);
      break;
    }
    case 'farRescue':
      events.push({ t: 'classAction', unit: u.uid, action: 'farRescue', target: a.target });
      doRescue(data, s, u, getUnit(s, a.target), events);
      break;
    case 'rescue':
      doRescue(data, s, u, getUnit(s, a.target), events);
      break;
    case 'cheer': {
      const t = getUnit(s, a.target);
      t.buffs.push({ source: CHEER_BUFF, mov: b.classActions.cheer.mov, hit: b.classActions.cheer.hit, untilTurn: s.turn, untilPhase: t.team });
      events.push({ t: 'classAction', unit: u.uid, action: 'cheer', target: t.uid });
      break;
    }
    case 'cast':
      resolveCast(data, s, u, a.at, events);
      break;
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
      grantExp(data, u, b.experience.rescueOrTalk, s.rng, events, expPercent(data, s, u));
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
    if (bagIsFull(data, u.bag, inst)) return inst;
    addToBag(data, u.bag, inst);
    return null;
  }
  const old = u.equip[slot];
  u.equip[slot] = inst;
  if (slot === 'mainHand' && itemDef(data, inst).twoHanded && u.equip.offHand) {
    const off = u.equip.offHand;
    delete u.equip.offHand;
    if (!bagIsFull(data, u.bag, off)) addToBag(data, u.bag, off);
    else return off;
  }
  if (old) {
    if (!bagIsFull(data, u.bag, old)) addToBag(data, u.bag, old);
    else return old;
  }
  return null;
}

function doEquip(data: GameData, u: BattleUnit, item: string, slot: Parameters<typeof canEquip>[3], events: GameEvent[]): void {
  const found = findInventory(u, item);
  if (!found) return;
  found.remove();
  const rest = place(data, u, found.inst, slot);
  if (rest) addToBag(data, u.bag, rest); // bag overflow is tolerated for a swap (one item can be over the limit)
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
    if (op.slot === 'bag' && bagIsFull(data, to.bag, from.inst)) continue;
    from.remove();
    const rest = place(data, to, from.inst, op.slot);
    if (rest) addToBag(data, (to === a ? b : a).bag, rest);
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
  noteLieutenantSight(data, st);
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
