/**
 * Which lieutenants the company has seen in this battle (review R2): `BattleState.ltSeen`, kept by the core so the mission
 * result is the same for every replay. Sight is the real sight of `vision.ts` (without fog everything on the board is seen).
 */
import type { GameData } from '../defs';
import { fogOn, visibleTiles } from '../rules/vision';
import type { BattleState } from '../state';
import { posKey } from '../util';

/**
 * Adds every lieutenant now on a tile the player's side sees to `s.ltSeen` (in the order of the units). Call wherever the
 * sight can change: after a move, a spawn and each command, and at the start of the battle. Cheap when nobody is left to see.
 */
export function noteLieutenantSight(data: GameData, s: BattleState): void {
  const open = s.units.filter((u) => u.lieutenant && u.team !== 'player' && u.pos && !u.gone && !s.ltSeen?.includes(u.lieutenant));
  if (!open.length) return;
  const seen = fogOn(data, s) ? visibleTiles(data, s, 'player') : null;
  for (const u of open) {
    if (seen && !seen.has(posKey(u.pos!))) continue;
    const list = (s.ltSeen ??= []);
    if (!list.includes(u.lieutenant!)) list.push(u.lieutenant!);
  }
}
