/** Building blocks shared by the content schemas (schema*.ts). */
import { z } from 'zod';
import { WEAPON_GROUPS } from '../core/defs';

const stat = z.number();
export const statsSchema = z.object({ hp: stat, str: stat, mag: stat, skl: stat, spd: stat, lck: stat, def: stat, res: stat });
export const partialStats = statsSchema.partial();
export const statMods = z
  .object({ hp: stat, str: stat, mag: stat, skl: stat, spd: stat, lck: stat, def: stat, res: stat, mov: stat })
  .partial();
export const element = z.enum(['fire', 'wind', 'earth', 'water', 'light', 'dark']);
export const weaponType = z.enum(['sword', 'lance', 'axe', 'dagger', 'bow', 'anima', 'light', 'dark', 'staff', 'breath']);
export const weaponGroup = z.enum(WEAPON_GROUPS);
export const moveType = z.enum(['foot', 'armored', 'mounted', 'flier', 'monster']);
export const statusId = z.enum(['burning', 'wet', 'slowed', 'knockback']);
export const rarity = z.enum(['common', 'rare', 'epic', 'legendary']);
export const team = z.enum(['player', 'enemy', 'other']);
export const rank = z.enum(['C', 'B', 'A', 'S']);
export const pos = z.tuple([z.number().int(), z.number().int()]);
export const range = z.tuple([z.number().int(), z.number().int()]);
export const area = z.union([
  z.object({ rect: z.tuple([z.number().int(), z.number().int(), z.number().int(), z.number().int()]) }),
  z.object({ tiles: z.array(pos) }),
]);
export const slugId = z.string().regex(/^[a-z0-9_]+$/);

/** Reference to an item in content (chest, reward, starting kit): definition plus optional upgrade, affixes and runes. */
export const itemRefSchema = z.object({
  def: z.string(),
  upgrade: z.number().int().min(0).max(5).optional(),
  affixes: z.array(z.string()).optional(),
  runes: z.array(z.string()).optional(),
});
