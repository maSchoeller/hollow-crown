/** Schemas of the campaign: rooms, scenes, supports, lieutenants, haunt pools, chronicle, memorials, homes, nodes and the world map. */
import { z } from 'zod';
import { itemRefSchema, slugId, statMods } from './schemaBase';
import { conditionSchema, conditionsListSchema, effectSchema } from './schemaConditions';

export const roomSchema = z.object({
  id: z.string(),
  function: z.enum(['convoy', 'merchant', 'smith', 'healer', 'tavern', 'campfire', 'memorial', 'enchanter', 'academy', 'workshop', 'training']),
  icon: z.string(),
  fromAct: z.number().int().min(1).default(1),
  homes: z.array(z.enum(['camp', 'castle'])).min(1),
  requires: z.array(conditionSchema).default([]),
  // level 2 and 3 of a castle room: one entry each, in order, with its gold (story 10.1)
  levels: z
    .array(z.strictObject({ cost: z.strictObject({ gold: z.number().int().positive() }), requires: z.array(conditionSchema).default([]) }))
    .max(2)
    .default([]),
  unlocks: z.array(z.strictObject({ id: z.string().regex(/^[a-z][a-z0-9_]*$/), requires: z.array(conditionSchema).default([]) })).default([]),
});

const chainSchema = z.array(z.string()).min(1).refine((c) => new Set(c).size === c.length, 'duplicate speaker in chain');
const moodSchema = z.enum(['neutral', 'happy', 'angry', 'sad']);
const lineId = z.string().regex(/^[a-z][a-z0-9_]*$/);

/** Scene `acts/actN/scenes/<id>.yaml` (architecture §5.8); German text sits in the scene, English in the locale file. */
export const sceneSchema = z.strictObject({
  id: z.string(),
  background: z.string().optional(),
  music: z.string().optional(),
  lines: z.array(
    z.union([
      z.strictObject({
        id: lineId,
        speaker: chainSchema.optional(),
        fallback: z.literal('skip').optional(),
        mood: moodSchema.default('neutral'),
        text: z.string().min(1),
        /** illustration panel from this line on: a background id, or `none` to return to the scene background (architecture §5.8) */
        panel: z.union([z.literal('none'), z.string().regex(/^[a-z0-9_]+$/)]).optional(),
        /** the moment of the node's reward (sparks, then the reward card) after this line, see `SceneSpeech.moment` */
        moment: z.literal('reward').optional(),
        requires: conditionsListSchema.optional(),
        memorial: z.strictObject({ speaker: chainSchema, text: z.string().min(1), mood: moodSchema.default('sad') }).optional(),
      }),
      z.strictObject({
        id: lineId,
        title: z.string().min(1).optional(),
        requires: conditionsListSchema.optional(),
        choice: z
          .array(
            z.strictObject({
              id: lineId,
              text: z.string().min(1),
              stance: z.enum(['warm', 'sober', 'defiant']),
              effects: z.array(effectSchema).optional(),
              summary: z.string().min(1).optional(),
            }),
          )
          .min(2),
      }),
    ]),
  ),
});

/** A fixed support pair of an act (`acts/actN/supports.yaml`, story 4.9): `core` pairs reach S, the others stop at A. */
export const supportPairSchema = z.strictObject({
  pair: z.tuple([z.string(), z.string()]),
  core: z.boolean().default(false),
  talks: z.strictObject({ C: z.string(), B: z.string(), A: z.string(), S: z.string() }).partial().default({}),
});

/** An enemy lieutenant (`acts/actN/lieutenants.yaml`, story 3.1); the act comes from the folder. */
export const lieutenantSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9_]+$/),
  nameKey: z.string().min(1),
  portrait: z.string().min(1),
  model: z.string().min(1),
  class: z.string().min(1),
  faction: z.string().regex(/^[a-z0-9_]+$/),
  signatureItem: z.string().min(1),
  grudgeSkills: z.tuple([z.string(), z.string(), z.string()]),
  titleKey: z.string().min(1),
  scene: z.string().min(1),
  joins: z.boolean().optional(),
});

/** The enemy pools of the haunts of an act (`acts/actN/haunts.yaml`, story 5.5); the act comes from the folder. */
export const hauntPoolsSchema = z.strictObject({
  factions: z.record(
    z.string().regex(/^[a-z0-9_]+$/),
    z
      .array(
        z.strictObject({
          class: z.string().min(1),
          sprite: z.string().min(1),
          nameKey: z.string().min(1),
          items: z.array(itemRefSchema),
          share: z.number().int().min(1).max(100),
        }),
      )
      .min(1),
  ),
  civilian: z.strictObject({ class: z.string().min(1), sprite: z.string().min(1).optional(), portrait: z.string().min(1).optional(), nameKey: z.string().min(1) }),
  chestLoot: z
    .array(z.strictObject({ gold: z.number().int().min(1).optional(), item: itemRefSchema.optional() }).refine((l) => (l.gold === undefined) !== (l.item === undefined), 'exactly one of gold or item'))
    .min(1),
});

/** Chronicle pages of an act (`acts/actN/chronicle.yaml`, story 4.7): German text here, English in the act's locale file. */
export const chroniclePageSchema = z.strictObject({ id: z.string().regex(/^[a-z0-9_]+$/), title: z.string().min(1), text: z.string().min(1) });

/** Fixed memorial stones of an act (`acts/actN/memorials.yaml`, story 6.9): German text here, English in the act's locale file. */
export const memorialSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9_]+$/),
  portrait: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  place: z.string().min(1),
  role: z.string().min(1),
  quote: z.string().min(1).optional(),
  /** the lesson this stone passes on (story 10.7): a skill of `heritage.yaml`; its role is the stone's role */
  heritage: z.string().optional(),
  requires: z.array(conditionSchema).default([]),
});

/** What the home shows on top (`content/home/home.yaml`, story 6.9): the picture and where each room's stone sits on it. */
const homeViewSchema = z.strictObject({
  image: z.string().regex(/^[a-z0-9_]+$/),
  anchors: z.array(z.strictObject({ room: z.string(), at: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]) })).default([]),
});
export const homeSchema = z.strictObject({ camp: homeViewSchema, castle: homeViewSchema });

export const campaignSchema = z.object({
  act: z.number().int().min(1).default(1),
  levelCap: z.number().int().min(1).optional(),
  positionLevel: z.strictObject({ base: z.number().int().min(1) }).optional(),
  startGold: z.number(),
  defaultPlace: z.string(),
  startConvoy: z.array(itemRefSchema).default([]),
  nodes: z.array(
    z.object({
      id: z.string(),
      map: z.string(),
      titleKey: z.string(),
      pre: z.string().optional(),
      post: z.string().optional(),
      kind: z.enum(['story', 'side']).default('story'),
      fixed: z.enum(['first', 'finale']).optional(),
      requires: conditionsListSchema.optional(),
      memorialIf: conditionSchema.optional(),
      memorial: z.object({ pre: z.string().optional(), post: z.string().optional() }).optional(),
      // story 11.17: scenes after post on the way back, each under its own conditions
      epilogues: z.array(z.strictObject({ scene: z.string(), requires: conditionsListSchema.optional() })).optional(),
      place: z.string().optional(),
      merchantTier: z.number().int(),
      expectedLevel: z.number().int().min(1).optional(),
      levelBonus: z.number().int().optional(),
      grants: z.array(z.object({ unit: z.string(), item: itemRefSchema })).optional(),
      effects: z.array(effectSchema).optional(),
      effectsIf: z.array(z.strictObject({ requires: z.array(conditionSchema).min(1), effects: z.array(effectSchema).min(1) })).optional(),
    }),
  ),
  mechanics: z.partialRecord(z.enum(['triangle', 'magic', 'elements', 'status', 'runes', 'supports']), z.number().int().min(0)).default({}),
  home: z.enum(['camp', 'castle']).default('camp'),
  /** story 11.23: scenes that play once at home when their conditions hold (Beat 10 „Die Chronik“ in the castle) */
  homeScenes: z
    .array(
      z.strictObject({
        scene: z.string().min(1),
        home: z.enum(['camp', 'castle']).optional(),
        requires: z.array(conditionSchema).default([]),
        effects: z.array(effectSchema).default([]),
      }),
    )
    .default([]),
  // roomLevel (story 10.9): the list is on sale only from this merchant level on (default 1)
  merchant: z.array(
    z.object({ tier: z.number().int(), items: z.array(z.string()), storyCount: z.number().int().min(1).optional(), roomLevel: z.number().int().min(1).max(3).optional() }),
  ),
  scars: z.array(
    z.object({
      id: z.string(),
      mods: statMods.extend({ hit: z.number().optional(), crit: z.number().optional(), avoid: z.number().optional() }),
    }),
  ),
});

/** The world map (stories 5.2, 15.7 and 15.12, architecture §5.12): the painted picture in resolution levels, regions with fog areas, places on it. */
const percentPos = z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]);
export const worldSchema = z.object({
  id: z.string(),
  image: slugId,
  size: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  levels: z
    .array(z.number().int().positive())
    .min(1)
    .refine((l) => l.every((w, i) => i === 0 || w > l[i - 1]!), 'levels ascending'),
  regions: z
    .array(z.object({ id: z.string(), act: z.number().int().min(1), at: percentPos, areas: z.array(z.array(percentPos).min(3)).min(1) }))
    .min(1),
  home: z.object({ camp: percentPos, castle: percentPos }),
  /**
   * drawn paths between places (story 15.12): the geography, not the campaign order; tools/art/world_roads.py writes them.
   * A third entry names the kind: `escape` is the flight of the prologue, drawn on its own and through the fog
   */
  roads: z.array(z.union([z.tuple([slugId, slugId]), z.tuple([slugId, slugId, z.enum(['road', 'escape'])])])).default([]),
  places: z
    .array(
      z.object({
        id: slugId,
        act: z.number().int().min(1),
        at: percentPos,
        site: z
          .object({
            foot: percentPos,
            width: z.number().positive().max(100),
            base: z.boolean().optional(),
            variants: z.array(z.object({ image: slugId, requires: z.array(z.lazy(() => conditionSchema)).min(1) })).optional(),
          })
          .optional(),
        slots: z.array(z.object({ label: z.string().min(1).max(4), node: z.string().optional() })),
      }),
    )
    .min(1),
});
