import type { GameData, Pos } from '../defs';
import { itemDef, usableStaves, usableWeapons, weaponProfile } from '../rules/items';
import { tilesInRange, weaponRange } from '../rules/movement';
import { computeStats } from '../rules/stats';
import { activeSkillIds } from '../rules/skills';
import type { BattleState, BattleUnit } from '../state';
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

export function attackTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const finishAllowed = true;
  for (const w of usableWeapons(data, u)) {
    const r = weaponRange(data, s, u, w.uid);
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
