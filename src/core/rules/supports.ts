import { SUPPORT_RANKS, type Pos, type SupportRank } from '../defs';
import type { GameData } from '../gameData';
import type { BattleState, BattleUnit, SupportState } from '../state';
import { active, isAlly, neighbors, pairKey, ruleOn, unitAt } from '../util';

export const rankIndex = (r: SupportRank | null | undefined): number => (r ? SUPPORT_RANKS.indexOf(r) : -1);

/** Rank currently in effect between two units (unlocked rank, or map-defined enemy pair rank). */
export function supportRank(s: BattleState, a: BattleUnit, b: BattleUnit): SupportRank | null {
  return s.supports[pairKey(a.id, b.id)]?.rank ?? null;
}

/** Adjacent partners of a unit at a position with their rank. */
export function adjacentPartners(s: BattleState, unit: BattleUnit, pos: Pos): Array<{ unit: BattleUnit; rank: SupportRank }> {
  const out: Array<{ unit: BattleUnit; rank: SupportRank }> = [];
  if (!ruleOn(s, 'supports')) return out;
  for (const p of neighbors(pos)) {
    const o = unitAt(s, p);
    if (!o || o.uid === unit.uid || !active(o) || !isAlly(o.team, unit.team)) continue;
    const r = supportRank(s, unit, o);
    if (r) out.push({ unit: o, rank: r });
  }
  return out;
}

export function adjacencyBonus(data: GameData, s: BattleState, unit: BattleUnit, pos: Pos) {
  const b = data.balance.supports;
  let hit = 0;
  let avoid = 0;
  let crit = 0;
  for (const { rank } of adjacentPartners(s, unit, pos)) {
    const bonus = b.adjacencyBonus[rank];
    hit += bonus.hit ?? 0;
    avoid += bonus.avoid ?? 0;
    crit += bonus.crit ?? 0;
  }
  return { hit: Math.min(hit, b.adjacencyBonusCap.hit), avoid: Math.min(avoid, b.adjacencyBonusCap.avoid), crit };
}

/**
 * Highest rank a pair can reach (story 4.9): S only for the core pairs of `supports.yaml`, A for the other fixed
 * pairs. Pairs a map defines for a battle (enemy pairs) are not fixed pairs and keep S.
 */
export function maxRank(data: GameData, key: string): SupportRank {
  const def = data.supports[key];
  return !def || def.core ? 'S' : 'A';
}

/** The rank after `st.rank`, if the pair can still reach one. */
function nextRank(data: GameData, st: SupportState, key?: string): SupportRank | undefined {
  const next = SUPPORT_RANKS[rankIndex(st.rank) + 1];
  return next && (key === undefined || rankIndex(next) <= rankIndex(maxRank(data, key))) ? next : undefined;
}

/** Next rank whose threshold the points have reached but which is not unlocked yet (with `key`: within the pair's highest rank). */
export function pendingRank(data: GameData, st: SupportState, key?: string): SupportRank | null {
  const next = nextRank(data, st, key);
  if (!next) return null;
  return st.points >= data.balance.supports.thresholds[next] ? next : null;
}

/**
 * Adds support points; points pile up at the threshold of the next locked rank
 * until the camp conversation unlocks it (concept/03 §8).
 */
export function addSupportPoints(data: GameData, supports: Record<string, SupportState>, key: string, pts: number): number {
  const st = supports[key];
  if (!st) return 0;
  const next = nextRank(data, st, key);
  const cap = next ? data.balance.supports.thresholds[next] : st.points;
  const before = st.points;
  st.points = Math.min(cap, st.points + pts);
  return st.points - before;
}
