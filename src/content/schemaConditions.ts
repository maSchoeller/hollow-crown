/** Schemas of conditions, effects and the flag register (architecture §5.3, §5.9). */
import { z } from 'zod';
import type { Condition, Effect } from '../core/storyDefs';
import { PERMANENT_COMPANIONS } from '../core/defs';
import { itemRefSchema, rank } from './schemaBase';

// --- conditions and effects (architecture §5.3): an object with exactly one key; a list of conditions means AND ---
const flagValue = z.union([z.string(), z.number(), z.literal(true)]);
const flagRef = z.union([
  z.string().min(1),
  z.record(z.string(), flagValue).refine((r) => Object.keys(r).length === 1, 'exactly one flag'),
]);
const companion = z.string().min(1);
/** `recruit`/`leave` never apply to the avatar or Lucan. */
const movableCompanion = companion.refine((id) => !PERMANENT_COMPANIONS.includes(id), 'avatar and lucan never join or leave');
const stance = z.enum(['warm', 'sober', 'defiant']);

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.strictObject({ flag: flagRef }),
    z.strictObject({ alive: companion }),
    z.strictObject({ dead: companion }),
    z.strictObject({ left: companion }),
    z.strictObject({ completed: z.string().min(1) }),
    z.strictObject({
      storyCount: z
        .strictObject({ min: z.number().int().min(0).optional(), max: z.number().int().min(0).optional() })
        .refine((r) => r.min !== undefined || r.max !== undefined, 'min or max'),
    }),
    z.strictObject({ act: z.number().int().min(1) }),
    z.strictObject({ castleTier: z.number().int().min(1).max(3) }),
    z.strictObject({ support: z.strictObject({ pair: z.tuple([companion, companion]), rank }) }),
    z.strictObject({ stance }),
    z.strictObject({ met: z.string().min(1) }),
    z.strictObject({ chronicle: z.union([z.strictObject({ min: z.number().int().min(1) }), z.array(z.string().min(1)).min(1)]) }),
    z.strictObject({ any: z.array(conditionSchema).min(1) }),
    z.strictObject({ not: conditionSchema }),
  ]),
);
export const conditionsSchema = z.union([conditionSchema, z.array(conditionSchema)]);
export const conditionsListSchema = z.array(conditionSchema);

export const effectSchema: z.ZodType<Effect> = z.union([
  z.strictObject({ setFlag: flagRef }),
  z.strictObject({ recruit: z.union([movableCompanion, z.strictObject({ lt: z.string().min(1) })]) }),
  z.strictObject({ leave: movableCompanion }),
  z.strictObject({ grudge: z.strictObject({ lt: z.string().min(1), delta: z.number().int() }) }),
  z.strictObject({ meet: z.strictObject({ lt: z.string().min(1) }) }),
  z.strictObject({ gold: z.number().int() }),
  z.strictObject({ material: z.record(z.string(), z.number().int()) }),
  z.strictObject({ item: itemRefSchema }),
  z.strictObject({ priceMod: z.strictObject({ pct: z.number(), act: z.number().int().min(1) }) }),
  z.strictObject({ villageAid: z.strictObject({ act: z.number().int().min(1) }) }),
  z.strictObject({ openQuest: z.string().min(1) }),
  z.strictObject({ stance }),
  z.strictObject({ chronicle: z.string().min(1) }),
  z.strictObject({ setHome: z.enum(['camp', 'castle']) }),
]);

/** Flag register `acts/actN/flags.yaml` (architecture §5.9). */
export const flagSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  kind: z.enum(['decision', 'story', 'quest', 'battle']),
  values: z.array(z.union([z.string(), z.number()])).min(1).optional(),
  season2: z.boolean().optional(),
});
