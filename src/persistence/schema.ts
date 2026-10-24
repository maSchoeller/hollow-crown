/**
 * Shape check of an imported save (concept/24-architecture §5.15: size limit, Zod validation). It checks what the
 * app dereferences when it loads a save; the inner content (items, units) is checked by the rules when played.
 */
import { z } from 'zod';

const deathMode = z.enum(['classic', 'standard', 'casual']);
const difficulty = z.enum(['easy', 'normal', 'hard']);

const campaignState = z.looseObject({
  settings: z.looseObject({ difficulty, deathMode }),
  avatar: z.looseObject({ name: z.string(), portrait: z.string() }),
  roster: z.array(z.looseObject({ id: z.string() })),
  convoy: z.array(z.unknown()),
  gold: z.number(),
  materials: z.record(z.string(), z.number()),
  completed: z.array(z.string()),
  available: z.array(z.string()),
  flags: z.unknown().optional(),
});

const battleState = z.looseObject({ nodeId: z.string(), units: z.array(z.looseObject({ id: z.string() })) });

export const saveRecordSchema = z.looseObject({
  format: z.number().int().min(2),
  campaignId: z.string().min(1).max(100),
  slot: z.enum(['auto', '1', '2', '3']),
  createdAt: z.string(),
  appVersion: z.string(),
  contentVersion: z.string(),
  payload: z.looseObject({
    campaign: campaignState,
    battle: z
      .looseObject({
        start: battleState,
        commands: z.array(z.looseObject({ type: z.string() })),
        turnStartIndex: z.number().int().min(0),
        // dialogue effects waiting for the end of the battle; saves from before this field have none
        effects: z.array(z.looseObject({ at: z.number().int().min(0), effects: z.array(z.looseObject({})) })).default([]),
      })
      .optional(),
    screen: z.enum(['worldmap', 'camp', 'battle']),
  }),
});
