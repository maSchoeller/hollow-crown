import type { MapDef, ObjectiveDef } from '../mapDefs';
import type { BattleState } from '../state';

/**
 * The victory goal that applies now (story 11.8): the `then` of a `survive` goal once the battle has changed to it
 * (`objectivePhase` 1), otherwise the goal of the map. Everything that acts on the goal reads it here. A leaf module, so the
 * rules (`cast.ts`) can use it without pulling in the battle flow.
 */
export function activeVictory(map: MapDef, s: BattleState): ObjectiveDef {
  const v = map.objectives.victory;
  return (s.objectivePhase ?? 0) > 0 && v.type === 'survive' && v.then ? v.then : v;
}
