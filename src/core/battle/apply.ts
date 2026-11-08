import { CoreInvariantError } from '../errors';
import type { Pos } from '../defs';
import type { GameData } from '../gameData';
import type { GameEvent } from '../events';
import { endOfPhase, startOfPhase, tickTerrain } from '../rules/effects';
import { addToBag, bagIsFull, canEquip, itemDef, weaponProfile } from '../rules/items';
import { destinations, pursueReach, reachable, walkPath, type Walk } from '../rules/movement';
import { ensureHauntMap } from './hauntMap';
import { activeSkillIds, afterActionMove } from '../rules/skills';
import type { BattleState, BattleUnit, ItemInstance } from '../state';
import { active, clone, getUnit, neighbors, onMap, posKey, samePos } from '../util';
import { availableActions, classActionId, itemTargets, nearConvoy, pursueRest, staffTargets } from './actions';
import type { Action, Command, CommandError } from './commands';
import { noteLieutenantSight } from './lieutenantSight';
import { beginPhase, checkObjectives } from './objectives';
import { runAiPhase } from '../ai/ai';
import { ambush, doAction, doMove, finishUnit } from './act';

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
    case 'lever':
      return opt.object === a.object ? null : 'invalid_target';
    case 'open':
      return opts.some((o) => o.kind === 'open' && o.object === a.object) ? null : 'invalid_target';
    case 'steal':
      return opt.stealable?.[a.target]?.includes(a.item) ? null : 'invalid_target';
    case 'ballista':
      return opts.some((o) => o.kind === 'ballista' && o.object === a.object && o.targets?.includes(a.target)) ? null : 'invalid_target';
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
      if (cmd.take && cmd.slot && cmd.slot !== 'bag') {
        // taking straight into a slot follows the same rules as `equip`
        const inst = s.convoy.find((i) => i.uid === cmd.take);
        if (!inst) return 'invalid_target';
        if (canEquip(data, u, inst, cmd.slot, activeSkillIds(data, u))) return 'cannot_equip';
      }
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


export { staffTargets, weaponProfile };
