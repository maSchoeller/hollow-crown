import type { GameData, Pos } from '../defs';
import { itemDef, usableStaves, usableWeapons, weaponProfile } from '../rules/items';
import { forecast, type Forecast } from '../rules/combat';
import { tilesInRange, weaponRange } from '../rules/movement';
import { computeStats } from '../rules/stats';
import { activeSkillIds } from '../rules/skills';
import type { BattleState, BattleUnit, UnitRecord } from '../state';
import { active, dist, inArea, isAlly, isHostile, neighbors, onMap, samePos, unitAt } from '../util';
import type { Action } from './commands';
import { mapOf } from './objectives';

export interface ActionOption {
  kind: Action['kind'] | 'trade' | 'convoy';
  targets?: string[];
  /** attack: weapon uids usable per target */
  weapons?: Record<string, string[]>;
  items?: string[];
  object?: string;
}

export function hasKey(data: GameData, u: BattleUnit): string | undefined {
  return u.bag.find((i) => itemDef(data, i).use?.open)?.uid;
}

export function skillUsable(data: GameData, u: BattleUnit, skillId: string): boolean {
  if (!activeSkillIds(data, u).includes(skillId)) return false;
  const sk = data.skills[skillId]!;
  return (u.usedPerMap[skillId] ?? 0) < (sk.usesPerMap ?? Infinity);
}

/** Id of the unit's class action (`aim`, `far_rescue`, `inspire`, ...), if its class has one. */
export function classActionId(data: GameData, u: BattleUnit | UnitRecord): string | undefined {
  return data.classes[u.classId]?.classAction?.id;
}

export function attackTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos, extraRange = 0): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const finishAllowed = true;
  for (const w of usableWeapons(data, u)) {
    const r = weaponRange(data, s, u, w.uid, extraRange);
    for (const t of tilesInRange(s, pos, r)) {
      const o = unitAt(s, t);
      if (!o || !onMap(o) || !isHostile(o.team, u.team)) continue;
      if (o.downed && !finishAllowed) continue;
      (out[o.uid] ??= []).push(w.uid);
    }
  }
  return out;
}

export function staffTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): string[] {
  const out = new Set<string>();
  for (const st of usableStaves(data, u)) {
    const d = itemDef(data, st);
    for (const t of tilesInRange(s, pos, weaponProfile(data, st).range)) {
      const o = unitAt(s, t);
      if (!o || !active(o) || !isAlly(o.team, u.team) || o.uid === u.uid) continue;
      const hurt = o.hp < computeStats(data, o).maxHp;
      if (hurt || (d.cureStatus && o.status.length)) out.add(o.uid);
    }
  }
  return [...out];
}

function adjacentUnits(s: BattleState, pos: Pos, u: BattleUnit): BattleUnit[] {
  return neighbors(pos)
    .map((p) => unitAt(s, p))
    .filter((o): o is BattleUnit => !!o && o.uid !== u.uid);
}

export function nearConvoy(s: BattleState, u: BattleUnit, pos: Pos): boolean {
  if (u.team !== 'player') return false;
  if (u.flags.includes('convoyAccess')) return true;
  return adjacentUnits(s, pos, u).some((o) => o.flags.includes('convoyAccess') && active(o) && o.team === 'player');
}

/**
 * Zielen (Schütze): only a unit that has not moved and stays on its tile; it attacks with +range and +hit.
 * Returns the weapons per target with the extended range, empty when not possible.
 */
export function aimTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): Record<string, string[]> {
  if (classActionId(data, u) !== 'aim' || u.moved || !u.pos || !samePos(u.pos, pos)) return {};
  return attackTargets(data, s, u, pos, data.balance.classActions.aim.rangeBonus);
}

/** Fernbergen (Heiler): downed allies exactly `range` tiles away, rescued like normal Bergen; adjacent ones use normal Bergen. */
export function farRescueTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): string[] {
  if (classActionId(data, u) !== 'far_rescue' || u.team !== 'player') return [];
  const range = data.balance.classActions.farRescue.range;
  return s.units
    .filter((o) => o.uid !== u.uid && onMap(o) && o.downed && o.team === u.team && dist(o.pos!, pos) === range)
    .map((o) => o.uid);
}

/** Anfeuern (Spielmann): adjacent allies that have not acted and are not cheered already. */
export function cheerTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): string[] {
  if (classActionId(data, u) !== 'inspire') return [];
  return adjacentUnits(s, pos, u)
    .filter((o) => active(o) && o.team === u.team && !o.acted && !o.buffs.some((b) => b.source === CHEER_BUFF))
    .map((o) => o.uid);
}

/** `source` of the buff Anfeuern puts on its target. */
export const CHEER_BUFF = 'cheer';

/** Preview of a class action, built from the numbers of the resolution (`forecast`, `balance.classActions`). */
export type ClassPreview =
  | { kind: 'aim'; forecast: Forecast; hit: number; rangeBonus: number }
  | { kind: 'farRescue'; target: string; distance: number }
  | { kind: 'cheer'; target: string; mov: number; hit: number };

export function classPreview(data: GameData, s: BattleState, u: BattleUnit, pos: Pos, a: Action): ClassPreview | null {
  const cfg = data.balance.classActions;
  switch (a.kind) {
    case 'aim': {
      const weapon = a.weapon ?? aimTargets(data, s, u, pos)[a.target]?.[0];
      return { kind: 'aim', forecast: forecast(data, s, u.uid, a.target, weapon, pos, true, { hit: cfg.aim.hit }), hit: cfg.aim.hit, rangeBonus: cfg.aim.rangeBonus };
    }
    case 'farRescue': {
      const t = s.units.find((o) => o.uid === a.target);
      return t?.pos ? { kind: 'farRescue', target: t.uid, distance: dist(t.pos, pos) } : null;
    }
    case 'cheer':
      return { kind: 'cheer', target: a.target, mov: cfg.cheer.mov, hit: cfg.cheer.hit };
    default:
      return null;
  }
}

/** All actions the unit could take from `pos` (UI action bar and AI share this). */
export function availableActions(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): ActionOption[] {
  const out: ActionOption[] = [];
  const atk = attackTargets(data, s, u, pos);
  if (Object.keys(atk).length) out.push({ kind: 'attack', targets: Object.keys(atk), weapons: atk });
  const heal = staffTargets(data, s, u, pos);
  if (heal.length) out.push({ kind: 'staff', targets: heal });
  const usable = u.bag.filter((i) => {
    const d = itemDef(data, i);
    if (!d.use || (i.charges ?? 1) <= 0) return false;
    if (d.use.heal) return u.hp < computeStats(data, u).maxHp;
    if (d.use.cureStatus) return u.status.length > 0;
    if (d.use.damage) return true;
    if (d.use.statMods) return true;
    return false;
  });
  if (usable.length) out.push({ kind: 'item', items: usable.map((i) => i.uid) });
  const adj = adjacentUnits(s, pos, u);
  const map = mapOf(data, s);
  const objHere = s.objects.find((o) => samePos(o.at, pos));
  if (u.team === 'player') {
    if (objHere?.type === 'village' && objHere.state === 'closed') out.push({ kind: 'visit', object: objHere.id });
    if (objHere?.type === 'chest' && objHere.state === 'closed' && hasKey(data, u))
      out.push({ kind: 'chest', object: objHere.id });
    const door = s.objects.find(
      (o) => o.type === 'door' && o.state === 'closed' && neighbors(pos).some((p) => samePos(p, o.at)),
    );
    if (door && hasKey(data, u)) out.push({ kind: 'door', object: door.id });
    const downed = adj.filter((o) => o.downed && o.team === 'player');
    if (downed.length) out.push({ kind: 'rescue', targets: downed.map((o) => o.uid) });
    const talk = adj.filter(
      (o) => active(o) && o.recruit && o.team !== 'player' && (o.recruit.by === 'any' || o.recruit.by.includes(u.id)),
    );
    if (talk.length) out.push({ kind: 'talk', targets: talk.map((o) => o.uid) });
    const trade = adj.filter((o) => active(o) && o.team === 'player');
    if (trade.length && !u.freeUsed.trade) out.push({ kind: 'trade', targets: trade.map((o) => o.uid) });
    if (nearConvoy(s, u, pos) && !u.freeUsed.convoy) out.push({ kind: 'convoy' });
    const v = map.objectives.victory;
    if (v.type === 'seize' && u.flags.includes('seizer') && inArea(v.area, pos)) out.push({ kind: 'seize' });
    if (v.type === 'escape' && inArea(v.area, pos)) out.push({ kind: 'escape' });
  }
  for (const id of activeSkillIds(data, u)) {
    const sk = data.skills[id]!;
    if (sk.trigger !== 'action' || !skillUsable(data, u, id)) continue;
    if (sk.effect.refreshAction) {
      const t = adj.filter((o) => active(o) && o.acted && isAlly(o.team, u.team) && o.team === u.team);
      if (t.length) out.push({ kind: 'command', targets: t.map((o) => o.uid) });
    } else if (sk.area) out.push({ kind: 'rally' });
  }
  const aim = aimTargets(data, s, u, pos);
  if (Object.keys(aim).length) out.push({ kind: 'aim', targets: Object.keys(aim), weapons: aim });
  const far = farRescueTargets(data, s, u, pos);
  if (far.length) out.push({ kind: 'farRescue', targets: far });
  const cheer = cheerTargets(data, s, u, pos);
  if (cheer.length) out.push({ kind: 'cheer', targets: cheer });
  out.push({ kind: 'wait' });
  return out;
}

export function itemTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos, itemUid: string): string[] {
  const inst = u.bag.find((i) => i.uid === itemUid);
  if (!inst) return [];
  const use = itemDef(data, inst).use;
  if (!use) return [];
  if (use.damage) {
    const r = use.rng ?? [1, 1];
    return s.units
      .filter((o) => active(o) && isHostile(o.team, u.team) && o.pos && dist(o.pos, pos) >= r[0] && dist(o.pos, pos) <= r[1])
      .map((o) => o.uid);
  }
  if (use.target === 'ally') {
    const r = use.rng ?? [0, 1];
    return s.units
      .filter((o) => active(o) && o.team === u.team && o.pos && dist(o.pos, pos) >= r[0] && dist(o.pos, pos) <= r[1])
      .map((o) => (o.uid === u.uid ? u.uid : o.uid));
  }
  return [u.uid];
}

export { weaponRange };
