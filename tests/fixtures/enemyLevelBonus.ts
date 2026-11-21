/** Shared helper of the board-level tests: the levels a generic enemy gets on top of its map level (Produktinhaber 2026-11-21). */
import type { BattleState, GameData } from '../../src/core';

/**
 * The difficulty's `enemyLevelBonus` for a story battle of `s` (as `atBattleLevel` reads it): the entry of the battle's act, the last one for
 * later acts, 0 without an entry. Lieutenants, characters, haunts and maps with `enemyLevelBonus: false` do not get it; the test decides that.
 */
export function enemyLevelBonus(data: GameData, s: Pick<BattleState, 'settings' | 'act'>): number {
  const byAct = data.balance.difficulty[s.settings.difficulty]?.enemyLevelBonus ?? [];
  return byAct.length ? byAct[Math.min(s.act ?? 1, byAct.length) - 1]! : 0;
}
