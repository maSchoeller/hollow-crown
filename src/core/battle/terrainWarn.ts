/**
 * Warnings before a map event changes the ground (story 11.10, architecture §5.3a): a `set_terrain` action with `warn` in a
 * trigger on `turn_start` is announced from the start of the round before its round until it happens. Pure: the board marks the
 * tiles and the HUD shows one line per warning, both from this function; nothing is stored in the battle state.
 */
import type { Pos } from '../defs';
import type { GameData } from '../gameData';
import type { BattleState } from '../state';
import { areaTiles } from '../util';
import { mapOf, notPast } from './objectives';

export interface TerrainWarning {
  /** the trigger that will change the ground */
  trigger: string;
  /** the round of the change */
  turn: number;
  /** the terrain the tiles become */
  terrain: string;
  tiles: Pos[];
  /** locale key of the line; absent = the general line (`ui.terrainWarn.line`) */
  key?: string;
}

/** The changes of the ground still to come that are due by the next round, in the order of the map's triggers. */
export function terrainWarnings(data: GameData, s: BattleState): TerrainWarning[] {
  if (s.outcome) return [];
  const out: TerrainWarning[] = [];
  for (const t of mapOf(data, s).triggers) {
    const w = t.when;
    if (w.type !== 'turn_start' || s.turn < w.turn - 1 || !notPast(s, w.turn, w.phase)) continue;
    // a trigger on the start of a round fires once at most, so a fired one (also with `once: false`) has changed the ground already;
    // its only condition is the moment (`whenMatches` in objectives.ts), checked above as by `runTriggers`
    if (s.firedTriggers.includes(t.id)) continue;
    for (const a of t.then) {
      if (a.action !== 'set_terrain' || !a.warn) continue;
      out.push({ trigger: t.id, turn: w.turn, terrain: a.terrain, tiles: areaTiles(a.area), ...(a.warn === true ? {} : { key: a.warn }) });
    }
  }
  return out;
}
