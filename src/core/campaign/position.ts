import { STAT_KEYS, type CharDef, type Stats } from '../defs';
import type { GameData } from '../gameData';
import type { MapUnitDef } from '../mapDefs';
import type { CampaignNodeDef } from '../storyDefs';
import type { BattleUnit, CampaignState, UnitRecord } from '../state';
import { roundDiv } from '../battle/create';
import { growthRate } from '../rules/progression';
import { computeStats } from '../rules/stats';
import { actOf, campaignOfAct, nodeAct } from './acts';

/**
 * The position level of an act (story 11.2, architecture §5.4): in an act with `positionLevel` the level a mission expects is not
 * a field of the node but its position in the campaign, P = `base` + story nodes of the act done + the node's `levelBonus`. Map foes
 * stand relative to it (`levelOffset`), companions of the act join one below it. Acts without `positionLevel` (act 1) keep
 * `expectedLevel`. Pure: everything comes from the campaign state, so replays and the simulation agree.
 */

/** The `positionLevel` of act `act`, if it has one. */
export const positionOf = (data: GameData, act: number): { base: number } | undefined => campaignOfAct(data, act).positionLevel;

/** Story nodes of act `act` the campaign has done, leaving out `except` (the node asked about counts as not yet played). */
function storyDone(data: GameData, c: Pick<CampaignState, 'completed'>, act: number, except?: string): number {
  return (data.acts[act]?.nodes ?? []).filter((n) => n.kind === 'story' && n.id !== except && c.completed.includes(n.id)).length;
}

/**
 * The level node `node` expects: `expectedLevel` in an act without `positionLevel` (act 1 as before), else its position P. The act is
 * the one whose `campaign.yaml` holds the node (a side quest of act 1 played in act 2 keeps its `expectedLevel`). For every reader of
 * the expected level: tavern, haunts, world map, preparation, dev start, simulation.
 */
export function nodeLevel(data: GameData, c: Pick<CampaignState, 'completed'> & { act?: number }, node: CampaignNodeDef): number {
  const act = nodeAct(data, node.id) ?? actOf(c);
  const pos = positionOf(data, act);
  if (!pos) return node.expectedLevel ?? 1;
  return Math.max(1, pos.base + storyDone(data, c, act, node.id) + (node.levelBonus ?? 0));
}

/** The position level of the act the campaign is in right now (`base` + its story nodes done); undefined in an act without one. */
export function positionNow(data: GameData, c: Pick<CampaignState, 'completed'> & { act?: number }): number | undefined {
  const act = actOf(c);
  const pos = positionOf(data, act);
  return pos ? pos.base + storyDone(data, c, act) : undefined;
}

/** A map unit at its level: a `levelOffset` stands on the battle's position level (never below 1); any other unit comes back unchanged. */
export function atPosition(def: MapUnitDef, position: number | undefined): MapUnitDef {
  if (def.levelOffset === undefined) return def;
  return { ...def, level: Math.max(1, (position ?? 1) + def.levelOffset) };
}

/**
 * The level a companion joins with (story 11.2): a character of an act with `positionLevel` joins with max(his level, P − 1), P the
 * position of the battle he joins in, else the position of the act now (`positionNow`); any other character with his own level.
 */
export function joinLevel(data: GameData, def: Pick<CharDef, 'act' | 'level'>, position: number | undefined): number {
  if (!positionOf(data, def.act ?? 1) || position === undefined) return def.level;
  return Math.max(def.level, position - 1);
}

/**
 * Raises a record made from a definition at `fromLevel` with `base` stats to `level` without dice: each stat grows by the expected value
 * of its growth (rate x levels, commercial rounding, class caps), as a lieutenant who joins (`joinLieutenant`). Mutates `rec`.
 */
export function raiseToLevel(data: GameData, rec: UnitRecord, base: Stats, fromLevel: number, level: number): void {
  rec.level = level;
  const steps = Math.max(0, level - fromLevel);
  const caps = data.classes[rec.classId]!.caps;
  for (const k of STAT_KEYS) {
    const rate = Math.max(0, growthRate(data, rec, k));
    const gain = Math.min(roundDiv(rate * steps, 100), Math.max(0, caps[k] - base[k]));
    rec.stats[k] = base[k] + gain;
    rec.gained[k] = gain;
    rec.expected[k] = (rate * steps) / 100;
  }
}

/** A companion's fresh record on his join level (`joinLevel`, `raiseToLevel`); returns whether it changed. Mutates `rec`. */
export function raiseOnJoin(data: GameData, def: CharDef, rec: UnitRecord, position: number | undefined): boolean {
  const level = joinLevel(data, def, position);
  if (level <= def.level) return false;
  raiseToLevel(data, rec, def.base, def.level, level);
  return true;
}

/**
 * A story character on the board of an act-2 battle stands on the level he would join with (P − 1 of the battle), so whoever talks
 * him over gets him as he fought; hit points follow. Units without a character and battles without a position stay as they are.
 */
export function raiseMapChar(data: GameData, unit: BattleUnit, charId: string | undefined, position: number | undefined): void {
  const def = charId ? data.chars[charId] : undefined;
  if (def && raiseOnJoin(data, def, unit, position)) unit.hp = computeStats(data, unit).maxHp;
}
