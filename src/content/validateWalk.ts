import type { MoveType, Pos } from '../core/defs';
import type { GameData } from '../core/gameData';
import type { MapDef, MapUnitDef } from '../core/mapDefs';
import { ladderBetween } from '../core/ladders';
import { areaTiles, posKey } from '../core/util';

/**
 * Move types a unit of the company can have: the classes of the story characters, everything they promote into and the player
 * units the maps place. A deploy slot has to be open to all of them, since the slots are one list for the whole company.
 */
export function companyMoveTypes(data: GameData): MoveType[] {
  const seen = new Set<string>();
  const out = new Set<MoveType>();
  const walkClass = (classId: string) => {
    if (seen.has(classId)) return;
    seen.add(classId);
    const cls = data.classes[classId];
    if (!cls) return;
    out.add(cls.moveType);
    for (const next of cls.proPaths ?? []) if (data.classes[next]?.playable) walkClass(next);
  };
  for (const ch of Object.values(data.chars)) walkClass(ch.class);
  for (const m of Object.values(data.maps)) for (const u of m.units) if (u.team === 'player') walkClass(u.class);
  return [...out];
}

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
  /** whether a ladder of the map leans from `low` against its neighbour `high` (fix 2026-11-08) */
  ladder: (low: Pos, high: Pos) => boolean;
  /** move types that may climb a ladder (`balance.elevation.climb`) */
  climb: Partial<Record<string, number>>;
};

/** The `Terr` parts every map shares: the elevation rules of the balance and the ladders of the map. */
export const elevationOf = (data: GameData, map: MapDef): Pick<Terr, 'freeMoveTypes' | 'ladder' | 'climb'> => ({
  freeMoveTypes: data.balance.elevation.freeMoveTypes,
  ladder: (low, high) => ladderBetween(map.ladders, low, high),
  climb: data.balance.elevation.climb,
});

/**
 * The tiles a unit of move type `mt` can reach from `from`, ignoring units (story 4.8). A closed door counts as passable
 * (a scout or a key opens it); every other tile follows the move cost of the terrain. Across one level it takes a connector on
 * the lower tile or a ladder this move type may climb.
 */
export function walkable(from: Pos, mt: string, { inside, terr, level, freeMoveTypes, ladder, climb }: Terr): Set<string> {
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
      const [low, high] = a < b ? [p, n] : [n, p];
      if (a === b || freeMoveTypes.includes(mt) || (Math.abs(a - b) === 1 && (terr(low)?.connector || (climb[mt] !== undefined && ladder(low, high))))) queue.push(n);
    }
  }
  return seen;
}

/** The terrain of a map for `walkable`, without reporting format errors (`validateMap` does that for content maps). */
export function mapTerr(data: GameData, map: MapDef): Terr {
  const [w, h] = map.size;
  const grid = map.terrain.replace(/\r/g, '').split('\n').filter((r) => r.length > 0).map((row) => [...row].map((ch) => map.legend[ch] ?? 'plain'));
  const inside = (p: Pos) => p[0] >= 0 && p[1] >= 0 && p[0] < w && p[1] < h;
  const terr = (p: Pos) => data.terrain[grid[p[1]]?.[p[0]] ?? 'plain'];
  const levels = new Map<string, number>();
  for (const l of map.levels ?? []) for (const p of areaTiles(l.area)) levels.set(posKey(p), l.level);
  const level = (p: Pos) => levels.get(posKey(p)) ?? terr(p)?.level ?? 0;
  return { inside, terr, level, ...elevationOf(data, map) };
}

/**
 * Objects the company uses by stepping on them or next to them (PO find 2026-11-08: a chest of m1_5 stood in a tent and never
 * opened): a chest or village needs a tile the company can stand on, reached on foot from a deploy slot, and no civilian who
 * holds his tile on it; a door or lever needs such a neighbour (a door may instead be opened by a lever that has one). Doors
 * count as passable, as for `treasure` (a key or a scout opens them). Haunt anchors check their own chests (validateHaunts.ts).
 */
export function validateObjectAccess(data: GameData, map: MapDef, g: Terr, err: (f: string, m: string) => void): void {
  const f = `maps/${map.id}`;
  const reach = new Set<string>();
  for (const s of map.deploy.slots) if (g.inside(s) && !reach.has(posKey(s))) for (const k of walkable(s, 'foot', g)) reach.add(k);
  if (!reach.size) return;
  const holders = new Set(map.units.filter((u) => u.team === 'other' && u.ai?.profile === 'hold').map((u) => posKey(u.at)));
  const near = (p: Pos) => ([[p[0] + 1, p[1]], [p[0] - 1, p[1]], [p[0], p[1] + 1], [p[0], p[1] - 1]] as Pos[]).some((n) => g.inside(n) && reach.has(posKey(n)) && !g.terr(n)?.opensTo);
  const ok = new Set<string>();
  for (const o of map.objects) {
    if (!g.inside(o.at)) continue;
    const t = g.terr(o.at);
    if (o.type === 'chest' || o.type === 'village') {
      if (!t || t.cost.foot === null) err(f, `${o.id}: ${o.type} on ${t?.id ?? 'no terrain'} at ${o.at}, a tile nobody stands on (it opens only from its own tile)`);
      else if (!reach.has(posKey(o.at))) err(f, `${o.id}: ${o.type} at ${o.at} not reachable on foot from the deploy area`);
      else if (holders.has(posKey(o.at))) err(f, `${o.id}: ${o.type} at ${o.at} lies under a civilian who holds his tile`);
      else ok.add(o.id);
    } else if (o.type === 'lever' || o.type === 'door') {
      if (near(o.at)) ok.add(o.id);
    }
  }
  for (const o of map.objects) {
    if (!g.inside(o.at) || ok.has(o.id)) continue;
    if (o.type === 'lever') err(f, `${o.id}: lever at ${o.at} has no neighbour reachable on foot from the deploy area`);
    if (o.type === 'door' && !map.objects.some((l) => l.type === 'lever' && ok.has(l.id) && l.links?.includes(o.id)))
      err(f, `${o.id}: door at ${o.at} has no neighbour reachable on foot from the deploy area and no reachable lever opens it`);
  }
}
