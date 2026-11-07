/** content:check of the ballista's fixed weapon (story 11.6): `balance.ballista.item` names a weapon with a range and the tag `fixed`. */
import type { GameData } from '../core/gameData';

export function ballistaItemIssues(data: GameData): string[] {
  const id = data.balance.ballista.item;
  const d = data.items[id];
  if (!d) return [`ballista.item: unknown item ${id}`];
  const out: string[] = [];
  if (d.kind !== 'weapon' || d.mt === undefined) out.push(`ballista.item: ${id} is no weapon with might`);
  if (!d.rng) out.push(`ballista.item: ${id} has no range (rng)`);
  if (!d.tags?.includes('fixed')) out.push(`ballista.item: ${id} needs the tag fixed`);
  return out;
}
