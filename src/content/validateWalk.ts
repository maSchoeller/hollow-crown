import type { Pos } from '../core/defs';
import type { MapDef, MapUnitDef } from '../core/mapDefs';

/** All units of a map: the placed ones, reinforcements and those triggers spawn. */
export function allUnits(m: MapDef): MapUnitDef[] {
  return [
    ...m.units,
    ...m.reinforcements.flatMap((r) => r.units),
    ...m.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : []))),
  ];
}

export type Terr = {
  inside: (p: Pos) => boolean;
  terr: (p: Pos) => { id: string; cost: Record<string, number | null>; opensTo?: string; connector?: string } | undefined;
  level: (p: Pos) => number;
  freeMoveTypes: readonly string[];
};

/**
 * The tiles a unit of move type `mt` can reach from `from`, ignoring units (story 4.8). A closed door counts as passable
 * (a scout or a key opens it); every other tile follows the move cost of the terrain.
 */
export function walkable(from: Pos, mt: string, { inside, terr, level, freeMoveTypes }: Terr): Set<string> {
  const seen = new Set<string>();
  const queue: Pos[] = [from];
  while (queue.length) {
    const p = queue.shift()!;
    const k = `${p[0]},${p[1]}`;
    if (seen.has(k) || !inside(p)) continue;
    const t = terr(p);
    if (!t || (t.cost[mt] === null && !t.opensTo)) continue;
    seen.add(k);
    for (const n of [[p[0] + 1, p[1]], [p[0] - 1, p[1]], [p[0], p[1] + 1], [p[0], p[1] - 1]] as Pos[]) {
      if (!inside(n)) continue;
      const [a, b] = [level(p), level(n)];
      if (a === b || freeMoveTypes.includes(mt) || (Math.abs(a - b) === 1 && terr(a < b ? p : n)?.connector)) queue.push(n);
    }
  }
  return seen;
}
