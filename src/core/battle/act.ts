/**
 * Moving and acting of one unit, shared by `applyCommand` (apply.ts) and the enemy AI. Split from apply.ts so the AI
 * does not import apply.ts: apply → ai → act, no import cycle (review 2026-11-07, S10).
 */
import type { Pos } from '../defs';
import type { GameData } from '../gameData';
import type { Reward } from '../mapDefs';
import type { GameEvent } from '../events';
import { roll1 } from '../rng';
import { resolveAttack } from '../rules/combat';
import { applyStatus, damageUnit, extinguishTile, igniteTile } from '../rules/effects';
import { addToBag, itemDef } from '../rules/items';
import { resolveCast } from '../rules/cast';
import { ballistaMods } from '../rules/ballista';
import { goesToConvoy } from '../rules/scout';
import { pathTo, reachable, type Walk } from '../rules/movement';
import { disarmTrap, layTrap, springTrap, trapStop } from '../rules/traps';
import { revealAfterAttack } from '../rules/stealth';
import { expPercent, grantExp } from '../rules/progression';
import { healStaff, staffHeal } from '../rules/heal';
import { computeStats } from '../rules/stats';
import { addSupportPoints, adjacentPartners } from '../rules/supports';
import { activeSkillIds, skillRadius } from '../rules/skills';
import type { BattleState, BattleUnit, ItemInstance, ObjectState } from '../state';
import { active, getUnit, neighbors, onMap, pairKey, posKey, samePos } from '../util';
import { aimTargets, attackTargets, CHEER_BUFF, hasKey } from './actions';
import type { Action } from './commands';
import { newItem } from './create';
import { noteLieutenantSight } from './lieutenantSight';
import { afterUnitMoved, checkObjectives, freeTileNear, mapOf, runTriggers, spawnUnits } from './objectives';

/** The walk of the enemy AI after its action (Wolfslauf, review R3): the same move as `pursue`, limited to `fields`. */
export function moveAfterAction(data: GameData, s: BattleState, u: BattleUnit, to: Pos, fields: number, events: GameEvent[]): void {
  doMove(data, s, u, to, events, fields);
  checkObjectives(data, s, events);
}

/** Hinterhalt: the walk was stopped by a foe the player did not see (the unit stands where the walk ended). */
export function ambush(u: BattleUnit, w: Walk, events: GameEvent[]): void {
  events.push({ t: 'ambush', unit: u.uid, by: w.cut!.by, at: [u.pos![0], u.pos![1]] });
}

/**
 * `walked`: the walk along the player's planned path (it may end before `to`); without it the core finds the way. A trap of a foe on
 * the way (story 10.5) ends the move on its tile and springs; returns true then.
 */
export function doMove(data: GameData, s: BattleState, u: BattleUnit, to: Pos, events: GameEvent[], mov?: number, walked?: Walk): boolean {
  if (!u.pos) return false;
  let path: Pos[];
  if (walked) {
    path = walked.tiles;
    to = path[path.length - 1]!;
    if (samePos(u.pos, to)) {
      u.moved = true;
      return false;
    }
    u.moveSpent = walked.cost;
  } else {
    if (samePos(u.pos, to)) return false;
    const reach = reachable(data, s, u, u.pos, mov);
    path = pathTo(reach, to);
    const sprung = trapStop(s, u, path);
    u.moveSpent = reach.get(posKey(sprung > 0 ? path[sprung]! : to))?.cost ?? 0;
  }
  const stop = trapStop(s, u, path);
  if (stop > 0) {
    path = path.slice(0, stop + 1);
    to = path[stop]!;
  }
  u.pos = [to[0], to[1]];
  u.moved = true;
  events.push({ t: 'moved', unit: u.uid, path });
  if (stop > 0) springTrap(data, s, u, events);
  if (active(u)) pickUpLoot(data, s, u, events);
  afterUnitMoved(data, s, u, events);
  noteLieutenantSight(data, s);
  return stop > 0;
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
      const at = freeTileNear(data, s, u.pos, data.classes[def.class]!.moveType) ?? u.pos;
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
  const save = activeSkillIds(data, u, null)
    .map((id) => data.skills[id]!.effect.bagChargeSaveChance ?? 0)
    .reduce((a, b) => Math.max(a, b), 0);
  void save;
  inst.charges = (inst.charges ?? 1) - 1;
  if (inst.charges <= 0 && !itemDef(data, inst).refillAfterMission) {
    u.bag = u.bag.filter((i) => i.uid !== inst.uid);
  }
}

function useChargeRolled(data: GameData, s: BattleState, u: BattleUnit, inst: ItemInstance): void {
  const save = activeSkillIds(data, u, s)
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
  grantExp(data, u, b.experience.rescueOrTalk, s.rng, events, expPercent(data, s, u), s.act);
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
  openPassage(data, s, u, obj, events);
  runTriggers(data, s, { kind: 'action', unit: u }, events);
}

/** A door or gate opens, together with what it is linked to (the second wing of a gatehouse). */
function openPassage(data: GameData, s: BattleState, u: BattleUnit, obj: ObjectState, events: GameEvent[]): void {
  obj.state = 'open';
  const idx = obj.at[1] * s.width + obj.at[0];
  const open = data.terrain[s.terrain[idx]!]?.opensTo ?? 'door_open';
  s.terrain[idx] = open;
  events.push({ t: 'opened', unit: u.uid, object: obj.id });
  events.push({ t: 'terrain', at: obj.at, terrain: open, cause: 'raze' });
  pullLinks(data, s, u, obj, events);
}

/** What the map links to an object opens with it. */
function pullLinks(data: GameData, s: BattleState, u: BattleUnit, obj: ObjectState, events: GameEvent[]): void {
  for (const id of mapOf(data, s).objects.find((o) => o.id === obj.id)?.links ?? []) {
    const other = s.objects.find((o) => o.id === id);
    if (other?.type === 'door' && other.state === 'closed') openPassage(data, s, u, other, events);
  }
}

/** The first blow at a unit with a battle line: the line once (`quote:<uid>` in `firedTriggers`). */
function quoteOnce(s: BattleState, target: BattleUnit, events: GameEvent[]): void {
  if (!target.quote || s.firedTriggers.includes(`quote:${target.uid}`)) return;
  s.firedTriggers.push(`quote:${target.uid}`);
  events.push({ t: 'quote', unit: target.uid, id: target.quote });
}

export function doAction(data: GameData, s: BattleState, u: BattleUnit, a: Action, events: GameEvent[]): void {
  const b = data.balance;
  switch (a.kind) {
    case 'wait':
      break;
    case 'attack': {
      const target = getUnit(s, a.target);
      const weapon = a.weapon ?? attackTargets(data, s, u, u.pos!)[a.target]?.[0];
      quoteOnce(s, target, events);
      revealAfterAttack(data, s, u);
      resolveAttack(data, s, u.uid, target.uid, weapon, events);
      break;
    }
    case 'aim': {
      const target = getUnit(s, a.target);
      const weapon = a.weapon ?? aimTargets(data, s, u, u.pos!)[a.target]?.[0];
      events.push({ t: 'classAction', unit: u.uid, action: 'aim', target: target.uid });
      quoteOnce(s, target, events);
      revealAfterAttack(data, s, u);
      resolveAttack(data, s, u.uid, target.uid, weapon, events, { hit: b.classActions.aim.hit });
      break;
    }
    case 'ballista': {
      // Balliste (story 11.6): the ballista has fired for this phase; the shot is an attack with its fixed weapon
      const obj = s.objects.find((o) => o.id === a.object)!;
      const target = getUnit(s, a.target);
      obj.state = 'open';
      quoteOnce(s, target, events);
      revealAfterAttack(data, s, u);
      resolveAttack(data, s, u.uid, target.uid, undefined, events, ballistaMods(data, s, obj.id));
      break;
    }
    case 'staff': {
      const target = getUnit(s, a.target);
      const staff = healStaff(data, u, a.staff);
      if (!staff) break;
      const d = itemDef(data, staff);
      // the target, and with `healRadius` (Bischof, story 10.4) every hurt ally next to it, by the same amount
      const heal = staffHeal(data, s, u, target, staff);
      for (const h of heal.heals) {
        const o = getUnit(s, h.uid);
        o.hp += h.amount;
        events.push({ t: 'heal', unit: o.uid, amount: h.amount, hpAfter: o.hp, by: u.uid, cause: 'staff' });
      }
      if (d.cureStatus && target.status.length) {
        for (const x of target.status) events.push({ t: 'status', unit: target.uid, status: x.id, on: false });
        target.status = [];
      }
      if (u.team === 'player') grantExp(data, u, heal.exp, s.rng, events, expPercent(data, s, u), s.act);
      const gained = addSupportPoints(data, s.supports, pairKey(u.id, target.id), b.supports.pointsTandemHealRescue);
      if (gained) events.push({ t: 'support', a: u.uid, b: target.uid, points: gained });
      break;
    }
    case 'item': {
      const inst = u.bag.find((i) => i.uid === a.item)!;
      const use = itemDef(data, inst).use!;
      const target = a.target ? getUnit(s, a.target) : u;
      events.push({ t: 'itemUsed', unit: u.uid, item: inst.def, target: target.uid });
      // Fallen-Set (story 10.6): a trap like the trapper's, of its own kind, so it never pushes out one of the trapper's two
      if (use.trap && a.at) layTrap(data, s, u, a.at, events, 'item');
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
      // Starkes Gegengift (story 10.6): no new condition to the end of the round, the enemy phase after it included
      if (use.statusImmuneRounds) target.buffs.push({ source: inst.def, statusImmune: true, untilTurn: s.turn + use.statusImmuneRounds - 1, untilPhase: 'enemy' });
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
    case 'lever': {
      // anybody beside it can pull it; it stays down (`object_activated` fires, the linked doors and gates open)
      const obj = s.objects.find((o) => o.id === a.object)!;
      obj.state = 'open';
      events.push({ t: 'opened', unit: u.uid, object: obj.id });
      pullLinks(data, s, u, obj, events);
      runTriggers(data, s, { kind: 'action', unit: u }, events);
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
      for (const uid of a.second ? [a.target, a.second] : [a.target]) {
        const t = getUnit(s, uid);
        t.buffs.push({ source: CHEER_BUFF, mov: b.classActions.cheer.mov, hit: b.classActions.cheer.hit, untilTurn: s.turn, untilPhase: t.team });
        events.push({ t: 'classAction', unit: u.uid, action: 'cheer', target: t.uid });
      }
      break;
    }
    case 'cast':
      resolveCast(data, s, u, a.at, events);
      break;
    case 'trap':
      layTrap(data, s, u, a.at, events);
      break;
    case 'disarm':
      disarmTrap(s, u, a.at, events);
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
      grantExp(data, u, b.experience.rescueOrTalk, s.rng, events, expPercent(data, s, u), s.act);
      runTriggers(data, s, { kind: 'action', unit: u }, events);
      break;
    }
    case 'command': {
      const t = getUnit(s, a.target);
      const sk = activeSkillIds(data, u, s).find((id) => data.skills[id]!.effect.refreshAction)!;
      u.usedPerMap[sk] = (u.usedPerMap[sk] ?? 0) + 1;
      t.acted = false;
      t.moved = false;
      events.push({ t: 'refreshed', unit: t.uid, by: u.uid });
      break;
    }
    case 'rally': {
      const sk = activeSkillIds(data, u, s).find((id) => data.skills[id]!.trigger === 'action' && data.skills[id]!.area)!;
      const def = data.skills[sk]!;
      u.usedPerMap[sk] = (u.usedPerMap[sk] ?? 0) + 1;
      const affected: string[] = [];
      for (const o of s.units) {
        if (!active(o) || o.team !== u.team || !o.pos || !u.pos) continue;
        if (Math.abs(o.pos[0] - u.pos[0]) + Math.abs(o.pos[1] - u.pos[1]) > skillRadius(data, u, sk, s)) continue;
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
export function finishUnit(data: GameData, s: BattleState, u: BattleUnit, events: GameEvent[]): void {
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

/** Exposed for the AI: performs an act for any team (no phase-owner check beyond validation). */
export function applyAct(data: GameData, s: BattleState, u: BattleUnit, to: Pos, action: Action, events: GameEvent[]): void {
  doMove(data, s, u, to, events);
  if (active(u) && !s.outcome) doAction(data, s, u, action, events);
  finishUnit(data, s, u, events);
  checkObjectives(data, s, events);
}
