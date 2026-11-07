/**
 * Balliste (story 11.6, GDD Gelände): who can fire which ballista at whom, and the preview of the shot. The preview is
 * `forecast` with `AttackMods.siege`, the same call the resolution makes, so the numbers can never drift apart.
 */
import type { Pos } from '../defs';
import type { GameData } from '../gameData';
import type { BattleState, BattleUnit } from '../state';
import { dist, isHostile, onMap, posKey, unitAt } from '../util';
import { ballistaRange, ballistaReady, ballistasOf, ballistaWeapon, canCrew } from './ballistaBase';
import { forecast, type AttackMods, type Forecast } from './combat';
import { crewLevelFits, strikeTiles } from './movement';
import { fogOn, visibleTiles } from './vision';

export { BALLISTA_PREFIX, ballistaRange, ballistasOf, ballistaWeapon, canCrew, ballistaReady, firesBallista } from './ballistaBase';

/**
 * The ballistas the unit can fire from `pos`, with their targets: ballista id → uids of the foes in reach. A ballista stands on a
 * neighbouring tile on the crew's level and has not fired this phase; reach is measured from its tile, a higher level adds
 * `elevation.rangedBonus` (`canStrike`). Under fog the player's crew sees its targets, with the crew standing on `pos` (the AI
 * sees everything, as for any attack, balance.yaml `fog`).
 */
export function ballistaTargets(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const list = ballistasOf(s);
  if (!list.length || !canCrew(data, u)) return out;
  const range = ballistaRange(data);
  let seen: Set<string> | null | undefined;
  for (const b of list) {
    if (!ballistaReady(b) || dist(b.at, pos) !== 1 || !crewLevelFits(data, s, pos, b.at)) continue;
    if (seen === undefined) seen = u.team === 'player' && fogOn(data, s) ? sightFrom(data, s, u, pos) : null;
    const targets: string[] = [];
    for (const t of strikeTiles(data, s, u, b.at, range)) {
      const o = unitAt(s, t);
      if (!o || !onMap(o) || !isHostile(o.team, u.team) || o.untargetable) continue;
      if (seen && !seen.has(posKey(t))) continue;
      targets.push(o.uid);
    }
    if (targets.length) out[b.id] = targets;
  }
  return out;
}

/** What the player's side sees with `u` standing on `pos` (the preview after a move, as `forecast` does with its ghost tile). */
function sightFrom(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): Set<string> {
  const saved = u.pos;
  u.pos = pos;
  try {
    return visibleTiles(data, s, 'player');
  } finally {
    u.pos = saved;
  }
}

/** The attack options of a shot from ballista `objectId`; the one object for preview and resolution. */
export function ballistaMods(data: GameData, s: BattleState, objectId: string): AttackMods {
  const b = s.objects.find((o) => o.id === objectId && o.type === 'ballista');
  if (!b) return {};
  return { siege: { weapon: ballistaWeapon(data, objectId), from: b.at } };
}

/** Preview of a shot: `forecast` with the ballista's options, the crew standing on `fromPos` (default: where it is). */
export function ballistaForecast(data: GameData, s: BattleState, crewUid: string, objectId: string, targetUid: string, fromPos?: Pos): Forecast {
  return forecast(data, s, crewUid, targetUid, undefined, fromPos, true, ballistaMods(data, s, objectId));
}
