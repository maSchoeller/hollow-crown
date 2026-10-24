import { CoreInvariantError } from './errors';
import type { Area, Difficulty, Mechanic, Pos, Team } from './defs';
import type { BattleState, BattleUnit } from './state';

export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Whether a step-by-step introduced mechanic applies in this battle. */
export const ruleOn = (s: { locked?: Mechanic[] }, m: Mechanic): boolean => !s.locked?.includes(m);

/** Map units / reinforcements present on a difficulty. */
export const onDifficulty = <T extends { difficulty?: Difficulty[] }>(defs: T[], d: Difficulty): T[] =>
  defs.filter((x) => !x.difficulty || x.difficulty.includes(d));

export const dist = (a: Pos, b: Pos): number => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
export const samePos = (a: Pos | null | undefined, b: Pos | null | undefined): boolean =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1];
export const posKey = (p: Pos): string => `${p[0]},${p[1]}`;
export const NEIGHBORS: readonly Pos[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
export const neighbors = (p: Pos): Pos[] => NEIGHBORS.map(([dx, dy]) => [p[0] + dx, p[1] + dy] as Pos);

export const inBounds = (s: { width: number; height: number }, p: Pos): boolean =>
  p[0] >= 0 && p[1] >= 0 && p[0] < s.width && p[1] < s.height;
export const tileIndex = (s: { width: number }, p: Pos): number => p[1] * s.width + p[0];
export const terrainAt = (s: BattleState, p: Pos): string => s.terrain[tileIndex(s, p)]!;

export function areaTiles(area: Area): Pos[] {
  if ('tiles' in area) return area.tiles;
  const [x1, y1, x2, y2] = area.rect;
  const out: Pos[] = [];
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) out.push([x, y]);
  return out;
}
export const inArea = (area: Area, p: Pos): boolean => areaTiles(area).some((t) => samePos(t, p));

export const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Player and third party are allied; enemies are hostile to both. */
export const isHostile = (a: Team, b: Team): boolean => (a === 'enemy') !== (b === 'enemy');
export const isAlly = (a: Team, b: Team): boolean => !isHostile(a, b);

export const onMap = (u: BattleUnit): boolean => !!u.pos && !u.gone;
/** Unit that can still act and be targeted (downed units are on the map but out of play). */
export const active = (u: BattleUnit): boolean => onMap(u) && !u.downed;

export function unitAt(s: BattleState, p: Pos): BattleUnit | undefined {
  return s.units.find((u) => onMap(u) && samePos(u.pos, p));
}
export function getUnit(s: BattleState, uid: string): BattleUnit {
  const u = s.units.find((x) => x.uid === uid);
  if (!u) throw new CoreInvariantError('unknown_unit', { uid });
  return u;
}
/** Finds a unit by uid or by its character/record id (map data refers to ids). */
export function findUnit(s: BattleState, id: string): BattleUnit | undefined {
  return s.units.find((u) => u.uid === id) ?? s.units.find((u) => u.id === id || u.charId === id);
}

export function sum(list: readonly number[]): number {
  let t = 0;
  for (const v of list) t += v;
  return t;
}
export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
