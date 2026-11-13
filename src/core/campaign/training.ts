/**
 * Training ground (story 10.8): after a won mission the reserve — every living company member who was not deployed,
 * mercenaries included — gets a share of the average EP the deployed survivors earned, through the same EP core as the battle.
 */
import type { GameData } from '../gameData';
import type { RngState } from '../rng';
import { addExp, expShare, hauntCatchUp, levelCap } from '../rules/progression';
import type { BattleState, CampaignState, ReserveGain } from '../state';
import { openRoomLevel } from './camp';

/** Share (percent) of the average EP the reserve gets: `training.reservePctByLevel` by the level of the open training ground, else 0. */
export function reservePct(data: GameData, c: CampaignState, level = openRoomLevel(data, c, 'training')): number {
  const by = data.balance.training.reservePctByLevel;
  return level > 0 ? by[Math.min(level, by.length) - 1]! : 0;
}

/** EP each reserve member gets: `round(avg × pct / 100)`. */
export function reserveShare(avg: number, pct: number): number {
  return Math.round((avg * pct) / 100);
}

/**
 * Grants the reserve its EP after a won mission and returns what each member got, in company order. `deployed` are the EP the
 * deployed survivors actually earned (in a haunt already on its share); a reserve member above a haunt's expected level gets
 * only the catch-up share of it, like a deployed one. Level-ups draw from `rng` (the battle RNG after the deployed figures).
 * Nothing without an open training ground or when the average is 0.
 */
export function trainReserve(data: GameData, c: CampaignState, s: Pick<BattleState, 'units' | 'hauntId' | 'hauntLevel' | 'act'>, deployed: ReadonlyArray<{ exp: number }>, rng: RngState): ReserveGain[] {
  const pct = reservePct(data, c);
  const avg = deployed.length ? deployed.reduce((n, u) => n + u.exp, 0) / deployed.length : 0;
  const share = reserveShare(avg, pct);
  if (share <= 0) return [];
  const inBattle = new Set(s.units.map((u) => u.id));
  const cap = levelCap(data, s.act);
  const out: ReserveGain[] = [];
  for (const u of c.roster) {
    if (inBattle.has(u.id)) continue;
    const amount = hauntCatchUp(data, s, u.classId, u.level) ? expShare(share, data.balance.haunt.catchUpExpPct) : share;
    const levelBefore = u.level;
    const gain = addExp(data, u, amount, rng, cap);
    out.push({ unit: u.id, exp: gain.counted, levelBefore, levelAfter: u.level });
  }
  return out;
}
