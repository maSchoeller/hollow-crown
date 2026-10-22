import { type GameData, type Rarity } from './defs';
import { nextInt, type RngState } from './rng';
import { itemCategory, itemDef } from './rules/items';

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

/** Rolls 0–2 affixes for an item of a rarity (concept/05 §5). No duplicates. */
export function rollAffixes(data: GameData, rng: RngState, defId: string, rarity: Rarity, exclude: string[] = []): string[] {
  const d = itemDef(data, defId);
  const cat = itemCategory(d);
  if (!cat) return [];
  const count = data.balance.economy.rarityAffixes[rarity];
  const pool = Object.values(data.affixes)
    .filter((a) => a.appliesTo.includes(cat))
    .filter((a) => !a.rarityMin || RARITY_ORDER.indexOf(a.rarityMin) <= RARITY_ORDER.indexOf(rarity))
    .map((a) => a.id)
    .filter((id) => !exclude.includes(id))
    .sort();
  const out: string[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = nextInt(rng, pool.length);
    out.push(pool[idx]!);
    pool.splice(idx, 1);
  }
  return out;
}

/** Rarity of an affixed instance: the base rarity, raised by the number of affixes. */
export function instanceRarity(data: GameData, defId: string, affixCount: number): Rarity {
  const base = itemDef(data, defId).rarity;
  if (base === 'legendary') return base;
  const byAffix: Rarity = affixCount >= 2 ? 'epic' : affixCount === 1 ? 'rare' : 'common';
  return RARITY_ORDER.indexOf(byAffix) > RARITY_ORDER.indexOf(base) ? byAffix : base;
}
