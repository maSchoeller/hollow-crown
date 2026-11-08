/**
 * Shape check of an imported save (concept/24-architecture §5.15: size limit, Zod validation). It checks what the
 * app dereferences when it loads a save and what the migrations rewrite; whether the IDs exist in the build is checked
 * by the rules when played (and for the fixtures by tests/unit/migrations.test.ts).
 */
import { z } from 'zod';

const deathMode = z.enum(['classic', 'standard', 'casual']);
const difficulty = z.enum(['easy', 'normal', 'hard']);

// review 2026-11-07 (M7, first step): what the migrations rename and the load dereferences has a shape now – units,
// items, flags. Further fields stay loose, so saves from before a field existed still load (normalizeCampaign fills them).
const item = z.looseObject({ uid: z.string(), def: z.string() });
const unitRecord = z.looseObject({
  id: z.string(),
  nameKey: z.string(),
  classId: z.string(),
  equip: z.record(z.string(), item).optional(),
  bag: z.array(item).optional(),
});
// a record of flag values (architecture §5.9); saves from before flags had values stored a list of names
const flags = z.union([z.record(z.string(), z.union([z.string(), z.number(), z.literal(true)])), z.array(z.string())]);

const campaignState = z.looseObject({
  settings: z.looseObject({ difficulty, deathMode }),
  avatar: z.looseObject({ name: z.string(), portrait: z.string() }),
  roster: z.array(unitRecord),
  convoy: z.array(item),
  gold: z.number(),
  materials: z.record(z.string(), z.number()),
  completed: z.array(z.string()),
  // saves from before story 4.3 stored the available nodes; the graph works them out now
  available: z.array(z.string()).optional(),
  flags: flags.optional(),
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
