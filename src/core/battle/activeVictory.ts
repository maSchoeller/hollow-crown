import type { EscapeObjectiveDef, MapDef, ObjectiveDef } from '../mapDefs';
import type { BattleState, BattleUnit } from '../state';
import { findUnit, onMap } from '../util';

/**
 * The victory goal that applies now (story 11.8): the `then` of a `survive` goal once the battle has changed to it
 * (`objectivePhase` 1), otherwise the goal of the map. Everything that acts on the goal reads it here. A leaf module, so the
 * rules (`cast.ts`) can use it without pulling in the battle flow.
 */
export function activeVictory(map: MapDef, s: BattleState): ObjectiveDef {
  const v = map.objectives.victory;
  return (s.objectivePhase ?? 0) > 0 && v.type === 'survive' && v.then ? v.then : v;
}

/** The escape of a map's victory goal, now or later: the goal itself or the `then` of a `survive` (story 11.8). */
export function escapeOf(map: MapDef): EscapeObjectiveDef | undefined {
  const v = map.objectives.victory;
  return v.type === 'escape' ? v : v.type === 'survive' ? v.then : undefined;
}

/** The ids an escape's `must` names, each once (story 11.8). */
export function mustIds(v: ObjectiveDef | undefined): string[] {
  return v?.type === 'escape' && v.must ? [...new Set(v.must)] : [];
}

/**
 * The units of the battle an escape's `must` names (story 11.8), resolved like every unit id of a map (`findUnit`: id or
 * character). An id with no unit in the battle (a companion left at home) asks nothing of it.
 */
export function mustUnits(s: BattleState, v: ObjectiveDef | undefined): BattleUnit[] {
  return mustIds(v)
    .map((id) => findUnit(s, id))
    .filter((u): u is BattleUnit => !!u);
}

/**
 * How many units an escape needs out: `min`, else one per `must` unit, at least 1 (story 11.8). With the battle given, no more
 * than can still get out (Produktinhaber 2026-11-21, Kronfeld 2-8): those already out, every able unit on the map and, while
 * somebody is left to carry them, the downed ones. A full company still needs `min`; a smaller one wins with all who can leave.
 */
export function escapeMin(v: EscapeObjectiveDef, s?: BattleState): number {
  const base = v.min ?? Math.max(1, mustIds(v).length);
  if (!s) return base;
  const company = s.units.filter((u) => u.team === 'player');
  const able = company.filter((u) => onMap(u) && !u.downed).length;
  const downed = able ? company.filter((u) => onMap(u) && u.downed).length : 0;
  return Math.min(base, Math.max(1, company.filter(leftAlive).length + able + downed));
}

/** A unit has left the map alive: escaped, or carried off by a rescue (story 11.8: both count for `must` and `min`). */
export function leftAlive(u: BattleUnit): boolean {
  return u.gone === 'escaped' || u.gone === 'rescued';
}

/** "have of min" of an escape: units of the company that left the map alive (story 11.8). */
export function escapeProgress(s: BattleState, v: EscapeObjectiveDef): { have: number; min: number } {
  return { have: s.units.filter((u) => u.team === 'player' && leftAlive(u)).length, min: escapeMin(v, s) };
}
