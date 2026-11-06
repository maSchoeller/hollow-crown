import type { GameData } from '../gameData';
import type { CampaignState } from '../state';

/** Level of a room of the home; camp stations and rooms not built yet are level 1. */
export const roomLevel = (c: CampaignState, id: string): number => c.home.rooms[id] ?? 1;

/**
 * Stage of the castle's walls and land (0 ruin, 1 secured, 2 fortified, 3 fortress): grows with every room upgrade, from the
 * sum of the levels above 1 of all rooms (art direction §7). Only a view of `c.home`, no state of its own. Its own module, so the
 * conditions (`castleTier`, story 15.12) can read it without an import cycle through camp.ts.
 */
export function castleTier(data: GameData, c: CampaignState): number {
  let upgrades = 0;
  for (const room of Object.values(data.rooms)) upgrades += Math.max(0, roomLevel(c, room.id) - 1);
  let tier = 0;
  for (const at of data.balance.castle.tierAt) if (upgrades >= at) tier++;
  return tier;
}
