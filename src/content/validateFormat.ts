import type { GameData } from '../core/gameData';
import type { MapDef } from '../core/mapDefs';
import type { Locales } from './load';

/**
 * Checks of the format leftovers of the act-2 drafts (story 11.10): a forced deploy names someone who can be in the company
 * (the avatar or a companion of `units.yaml`, as `presentForced` reads it; one who fell or left is simply not forced), `guest` stands on team
 * `other` only, and a warned `set_terrain` sits in a trigger on the start of a round from round 2 on, with a line that exists.
 */
export function validateFormat(data: GameData, map: MapDef, locales: Locales, err: (f: string, m: string) => void): void {
  const f = `maps/${map.id}`;
  // the same ids `presentForced` looks for in the roster: the avatar and companions; a unit of the map is placed by the map anyway
  for (const id of map.deploy.forced) if (id !== 'avatar' && !data.chars[id]) err(f, `deploy.forced: unknown char ${id}`);
  const all = [...map.units, ...map.reinforcements.flatMap((r) => r.units), ...map.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : [])))];
  for (const u of all) if (u.guest && u.team !== 'other') err(f, `${u.id ?? u.char ?? u.class}: guest is only for units of team other`);
  for (const t of map.triggers)
    for (const a of t.then) {
      if ((a.action !== 'set_terrain' && a.action !== 'ignite') || !a.warn) continue;
      if (t.when.type !== 'turn_start' || t.when.turn < 2) err(f, `${t.id}: a warned ${a.action} needs a trigger on turn_start from round 2 on`);
      if (a.warn !== true) for (const lang of ['de', 'en']) if (!locales[lang]?.[a.warn]) err(`locales/${lang}`, `${t.id}: missing key ${a.warn}`);
    }
}
