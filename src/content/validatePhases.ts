import { escapeOf, mustIds } from '../core/battle/activeVictory';
import type { MapDef, MapUnitDef } from '../core/mapDefs';

/** The unit of the map's line-up an id names, by the same rule as `findUnit` in the battle: its id or its character. */
function lineUpUnit(map: MapDef, id: string): MapUnitDef | undefined {
  return map.units.find((u) => u.id === id) ?? map.units.find((u) => u.char === id);
}

/**
 * Checks of the objective phases (story 11.8): an escape's `min` and `must`, and that the trigger action `advance_objective` and
 * the trigger `objective_changed` only stand on a map whose victory goal has a second phase. Whether the escape area of the
 * second phase can be reached is part of the goal-area check in `validate.ts`.
 */
export function validatePhases(map: MapDef, err: (f: string, m: string) => void): void {
  const f = `maps/${map.id}`;
  const v = map.objectives.victory;
  const escape = escapeOf(map);
  if (escape) {
    if (escape.min !== undefined && escape.min < 1) err(f, 'escape: min must be at least 1');
    const must = mustIds(escape);
    if (must.length !== (escape.must?.length ?? 0)) err(f, 'escape: must names a unit twice');
    for (const id of must) {
      // a unit of `must` is always there and on the company's side: the forced deploy, or a player unit of the map without conditions
      if (map.deploy.forced.includes(id)) continue;
      const u = lineUpUnit(map, id);
      if (!u) err(f, `escape: must names ${id}, who is neither a unit of the map nor in deploy.forced`);
      else if (u.team !== 'player') err(f, `escape: must names ${id}, who is not of team player`);
      else if (u.requires || u.difficulty) err(f, `escape: must names ${id}, who can be left out (requires or difficulty)`);
    }
    if (escape.min !== undefined && must.length > escape.min) err(f, `escape: must names more units than min (${escape.min}) asks for`);
  }
  const phased = v.type === 'survive' && !!v.then;
  for (const t of map.triggers) {
    if (phased) continue;
    if (t.when.type === 'objective_changed') err(f, `${t.id}: objective_changed needs a victory goal with a second phase (then)`);
    if (t.then.some((a) => a.action === 'advance_objective')) err(f, `${t.id}: advance_objective needs a victory goal with a second phase (then)`);
  }
}
