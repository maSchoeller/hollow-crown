/**
 * Schatten (story 10.5): who the enemy AI cannot see. A unit whose active skills give `hidden` is invisible to its foes on a map
 * with fog, and on a map without fog while no foe stands closer than `balance.shadow.revealDistance` tiles. After its own attack
 * it is seen until the end of the next foe phase (`revealedUntil`); a counter does not reveal it. Pure functions over the state:
 * the AI (`enemyView`), the danger zone and the HUD mark ask the same question.
 */
import type { GameData } from '../gameData';
import type { BattleState, BattleUnit } from '../state';
import { active, dist, isHostile, onMap } from '../util';
import { activeSkillIds } from './skills';

/** Whether the unit carries a skill with `hidden` (Schatten); cheap, no stats. */
export function hasHiddenSkill(data: GameData, s: BattleState, u: BattleUnit): boolean {
  return activeSkillIds(data, u, s).some((id) => data.skills[id]?.effect.hidden);
}

/** Seen until the end of the foe phase of the round it attacked in. */
export const revealed = (s: Pick<BattleState, 'turn'>, u: Pick<BattleUnit, 'revealedUntil'>): boolean =>
  u.revealedUntil !== undefined && u.revealedUntil !== null && s.turn <= u.revealedUntil;

/** The shadow `u` is hidden from its foes right now (positions of this moment; checked before every single foe decision). */
export function shadowHidden(data: GameData, s: BattleState, u: BattleUnit): boolean {
  if (!active(u) || revealed(s, u) || !hasHiddenSkill(data, s, u)) return false;
  if (data.maps[s.mapId]?.fog) return true;
  const near = data.balance.shadow.revealDistance;
  return !s.units.some((o) => onMap(o) && active(o) && isHostile(o.team, u.team) && dist(o.pos!, u.pos!) < near);
}

/** After an attack of its own the shadow stays seen until the end of the next foe phase (only units that can hide keep the field). */
export function revealAfterAttack(data: GameData, s: BattleState, u: BattleUnit): void {
  if (hasHiddenSkill(data, s, u)) u.revealedUntil = s.turn;
}
