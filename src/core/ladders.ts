/**
 * Ladders against wall faces (fix 2026-11-08, GDD height levels): a map lists them as edges between a tile and its neighbour one
 * level higher (`MapDef.ladders`). The tile in front keeps its own terrain; only the step across the edge is a climb. Shared by the
 * rules (`levelsLink`, `stepCost`), the content check and the board.
 */
import type { Pos } from './defs';
import type { LadderDef, MapDef, MapDir } from './mapDefs';

/** Step of each direction in map tiles (x east, y south). */
export const DIR_STEP: Record<MapDir, readonly [number, number]> = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };

/** The tile a ladder leads up to. */
export function ladderTop(l: LadderDef): Pos {
  const d = DIR_STEP[l.up];
  return [l.at[0] + d[0], l.at[1] + d[1]];
}

const edgeKey = (a: Pos, b: Pos) => `${a[0]},${a[1]}>${b[0]},${b[1]}`;
const edgeSets = new WeakMap<readonly LadderDef[], Set<string>>();

/** Whether a ladder of `ladders` leans from tile `low` against its neighbour `high` (one way: low is its foot). */
export function ladderBetween(ladders: readonly LadderDef[] | undefined, low: Pos, high: Pos): boolean {
  if (!ladders?.length) return false;
  let set = edgeSets.get(ladders);
  if (!set) {
    set = new Set(ladders.map((l) => edgeKey(l.at, ladderTop(l))));
    edgeSets.set(ladders, set);
  }
  return set.has(edgeKey(low, high));
}

/** The ladders of a map (none when the id is unknown, as for a hand-made test state). */
export const laddersOf = (maps: Record<string, MapDef>, mapId: string): readonly LadderDef[] | undefined => maps[mapId]?.ladders;
