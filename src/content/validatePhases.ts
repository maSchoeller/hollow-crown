import type { MapDef } from '../core/mapDefs';

/**
 * Checks of the objective phases (story 11.8): an escape's `min` and `must`, and that the trigger action `advance_objective` and
 * the trigger `objective_changed` only stand on a map whose victory goal has a second phase. Whether the escape area of the
 * second phase can be reached is part of the goal-area check in `validate.ts`.
 */
export function validatePhases(map: MapDef, err: (f: string, m: string) => void): void {
  const f = `maps/${map.id}`;
  const v = map.objectives.victory;
  const escape = v.type === 'escape' ? v : v.type === 'survive' ? v.then : undefined;
  if (escape) {
    if (escape.min !== undefined && escape.min < 1) err(f, 'escape: min must be at least 1');
    const known = new Set([...map.deploy.forced, ...map.units.flatMap((u) => [u.id, u.char].filter((x): x is string => !!x))]);
    for (const id of escape.must ?? []) if (!known.has(id)) err(f, `escape: must names ${id}, who is neither a unit of the map nor in deploy.forced`);
    const min = escape.min ?? 1;
    if (escape.must && new Set(escape.must).size > min) err(f, `escape: must names more units than min (${min}) asks for`);
  }
  const phased = v.type === 'survive' && !!v.then;
  for (const t of map.triggers) {
    if (phased) continue;
    if (t.when.type === 'objective_changed') err(f, `${t.id}: objective_changed needs a victory goal with a second phase (then)`);
    if (t.then.some((a) => a.action === 'advance_objective')) err(f, `${t.id}: advance_objective needs a victory goal with a second phase (then)`);
  }
}
