import type { GameData } from '../core/gameData';
import type { MapDef, MapUnitDef } from '../core/mapDefs';
import { allUnits } from './validateWalk';

/**
 * Story 11.2 (GDD-Log 2026-11-05): foes on a map of an act with `positionLevel` stand relative to the position P of the node. The
 * band of `levelOffset` is the rule of the GDD (start P−3, waves P−2, elite P−1, lieutenants P+1, boss P+2), not a game value.
 */
export const LEVEL_OFFSET_RANGE = [-3, 2] as const;

/** Message for a foe without `levelOffset` on a map of an act with a position level (drafts count it as open, `drafts.ts`). */
export const missingOffset = (ctx: string, act: number) => `${ctx}: levelOffset missing (act ${act} has a positionLevel)`;

const label = (u: MapUnitDef, i: number) => u.id ?? u.char ?? u.lieutenant ?? `unit ${i}`;

/**
 * Levels of the units of one map: every unit has `level` or `levelOffset` (with both, as in the drafts, `level` is only a comment and
 * `levelOffset` counts); `levelOffset` only on maps of an act with `positionLevel`, there within `LEVEL_OFFSET_RANGE` and required for every foe without a character of his own (also in waves and
 * `spawn` triggers). A character keeps the level of his definition, so neither is needed for him.
 */
export function validateUnitLevels(data: GameData, map: MapDef, err: (f: string, m: string) => void): void {
  const f = `maps/${map.id}`;
  const act = map.act ?? 1;
  const position = data.acts[act]?.positionLevel;
  const [lo, hi] = LEVEL_OFFSET_RANGE;
  allUnits(map).forEach((u, i) => {
    const ctx = label(u, i);
    if (u.level === undefined && u.levelOffset === undefined && !u.char) err(f, `${ctx}: level or levelOffset missing`);
    if (u.levelOffset === undefined) {
      if (position && u.team === 'enemy' && !u.char) err(f, missingOffset(ctx, act));
      return;
    }
    if (!position) err(f, `${ctx}: levelOffset needs a positionLevel in act ${act}`);
    else if (u.levelOffset < lo || u.levelOffset > hi) err(f, `${ctx}: levelOffset ${u.levelOffset} outside ${lo}..${hi}`);
  });
}
