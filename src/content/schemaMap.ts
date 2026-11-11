/** Schemas of terrain and battle maps (units, objectives, triggers, haunt anchors). */
import { z } from 'zod';
import { SEASONS, TIMES_OF_DAY, WEATHERS } from '../core/defs';
import { HAUNT_VARIANTS } from '../core/mapDefs';
import { area, itemRefSchema, pos, range, rank, team, weaponType } from './schemaBase';
import { conditionSchema } from './schemaConditions';

const nullableCost = z.number().nullable();
export const terrainSchema = z.object({
  id: z.string(),
  def: z.number(),
  avoid: z.number(),
  heal: z.number(),
  flammable: z.boolean(),
  cost: z.object({ foot: nullableCost, armored: nullableCost, mounted: nullableCost, flier: nullableCost, monster: nullableCost }),
  ground: z.string(),
  prop: z.string().optional(),
  seizable: z.boolean().optional(),
  visitable: z.boolean().optional(),
  height: z.number().default(0),
  surface: z.enum(['grass', 'dirt', 'road', 'sand', 'ash', 'stone', 'riverbed', 'peat', 'vault']),
  cliff: z.enum(['earth', 'rock', 'wall']).default('earth'),
  water: z.boolean().default(false),
  level: z.number().int().min(0).max(2).default(0),
  connector: z.enum(['ramp', 'stairs']).optional(),
  opensTo: z.string().optional(),
  stand: z.number().min(0).default(0),
  waterLook: z.enum(['clear', 'mire', 'creek']).default('clear'),
  /** kept only so battles saved before it went still load; no map may use it, the handbook leaves it out */
  legacy: z.boolean().optional(),
});

const aiProfile = z.enum(['aggressive', 'hold', 'guard', 'trigger', 'hunt', 'raider', 'flee', 'support', 'follow']);
const aiSchema = z.object({
  profile: aiProfile,
  radius: z.number().optional(),
  then: aiProfile.optional(),
  wakeTurn: z.number().int().min(1).optional(),
  target: z.string().optional(),
  area: area.optional(),
  /** target preference (fix 1-3): attack and approach only units of this team while any of it is on the map */
  prefer: team.optional(),
});

export const mapUnitSchema = z.object({
  id: z.string().optional(),
  char: z.string().optional(),
  team,
  /** may be left out when `lieutenant` is set: the loader takes the class of the lieutenant (story 3.1) */
  class: z.string().optional(),
  /** fixed level; on maps of an act with `positionLevel` foes use `levelOffset` instead (story 11.2) */
  level: z.number().int().optional(),
  /** story 11.2: level relative to the node's position level P (`nodeLevel`), resolved by `createBattle` and spawns */
  levelOffset: z.number().int().optional(),
  at: pos,
  boss: z.boolean().optional(),
  lieutenant: z.string().optional(),
  nameKey: z.string().optional(),
  sprite: z.string().optional(),
  portrait: z.string().optional(),
  items: z.array(itemRefSchema).default([]),
  drops: z.array(z.number().int()).optional(),
  ai: aiSchema.optional(),
  quote: z.string().optional(),
  recruit: z.object({ by: z.union([z.array(z.string()), z.literal('any')]), dialogue: z.string().optional() }).optional(),
  ignoreForRout: z.boolean().optional(),
  untargetable: z.boolean().optional(),
  /** story 11.10: a guest of team `other` (Brann in 2-4): AI-led, does not join the company after the mission unless talked over */
  guest: z.boolean().optional(),
  difficulty: z.array(z.enum(['easy', 'normal', 'hard'])).optional(),
  /** conditions against the campaign at the creation of the battle (story 9.5); `conditionSchema` comes from schemaConditions.ts */
  requires: z.array(z.lazy(() => conditionSchema)).optional(),
});

const reward = z
  .object({
    gold: z.number(),
    item: itemRefSchema,
    material: z.record(z.string(), z.number()),
    recruit: z.string(),
    dialogue: z.string(),
    chronicle: z.string(),
  })
  .partial();

// story 11.8: `must` names units that have to leave the map too (Kronfeld: avatar and Lucan)
const escapeObjective = z.object({ type: z.literal('escape'), area, min: z.number().int().optional(), must: z.array(z.string()).min(1).optional() });

const objective = z.discriminatedUnion('type', [
  z.object({ type: z.literal('rout') }),
  z.object({ type: z.literal('boss'), unit: z.string() }),
  z.object({ type: z.literal('reach'), unit: z.string().optional(), area }),
  z.object({ type: z.literal('seize'), area }),
  z.object({ type: z.literal('defend'), unit: z.string(), turns: z.number().int() }),
  // story 11.8: `then` is the second phase of the goal, it applies after round `turns` (or a trigger `advance_objective`)
  z.object({ type: z.literal('survive'), turns: z.number().int(), then: escapeObjective.optional() }),
  escapeObjective,
  z.object({ type: z.literal('escort'), unit: z.string(), area, join: z.boolean().optional() }),
  z.object({ type: z.literal('treasure'), chests: z.array(z.string()).min(1), turns: z.number().int().min(1) }),
]);

const triggerWhen = z.discriminatedUnion('type', [
  z.object({ type: z.literal('turn_start'), turn: z.number().int(), phase: team }),
  z.object({ type: z.literal('unit_enters'), team: team.optional(), unit: z.string().optional(), area }),
  z.object({ type: z.literal('unit_dies'), unit: z.string() }),
  z.object({ type: z.literal('object_destroyed'), object: z.string() }),
  z.object({ type: z.literal('object_activated'), object: z.string() }),
  z.object({ type: z.literal('talked'), unit: z.string() }),
  z.object({ type: z.literal('hp_below'), unit: z.string(), percent: z.number() }),
  z.object({ type: z.literal('objective_changed') }),
]);

const triggerAction = z.discriminatedUnion('action', [
  z.object({ action: z.literal('dialogue'), id: z.string(), onBoard: z.string().optional() }),
  // `area`: the new goal area of the units (the way out of `flee`, the zone of `hold`); without it they keep theirs
  z.object({ action: z.literal('set_ai'), units: z.array(z.string()), profile: aiProfile, area: area.optional() }),
  z.object({ action: z.literal('spawn'), units: z.array(mapUnitSchema) }),
  z.object({ action: z.literal('set_flag'), flag: z.string() }),
  // `warn` (story 11.10): marking and HUD line from the round before the change (`true` = the general line, else a locale key)
  z.object({
    action: z.literal('set_terrain'),
    area,
    terrain: z.string(),
    level: z.number().int().min(0).max(2).optional(),
    warn: z.union([z.literal(true), z.string().min(1)]).optional(),
  }),
  // story 11.15: the flammable tiles of the area catch fire (`igniteTile`); `warn` as for set_terrain
  z.object({ action: z.literal('ignite'), area, warn: z.union([z.literal(true), z.string().min(1)]).optional() }),
  z.object({ action: z.literal('advance_objective') }),
]);

/**
 * A haunt anchor of a map (story 5.5, `haunts:`): which fields each variant needs is checked here, whether they lie on the
 * map and can be reached by `content:check`.
 */
export const hauntAnchorSchema = z
  .strictObject({
    variant: z.enum(HAUNT_VARIANTS),
    target: z.strictObject({ at: pos }),
    enemySpawn: area,
    deploy: area,
    max: z.number().int().min(1).optional(),
    turns: z.number().int().min(1).optional(),
    exit: area.optional(),
    chests: z.array(pos).min(1).optional(),
  })
  .superRefine((a, ctx) => {
    const need = (ok: boolean, key: string, message: string) => ok || ctx.addIssue({ code: 'custom', path: [key], message });
    const timed = a.variant === 'defend' || a.variant === 'treasure';
    need(!timed || a.turns !== undefined, 'turns', `${a.variant} needs turns`);
    need(timed || a.variant === 'escort' || a.turns === undefined, 'turns', `${a.variant} has no turn limit`);
    need(a.variant === 'escort' ? a.exit !== undefined : a.exit === undefined, 'exit', 'exit belongs to escort only, and escort needs it');
    need(a.variant === 'treasure' ? a.chests !== undefined : a.chests === undefined, 'chests', 'chests belong to treasure only, and treasure needs them');
  });

export const mapSchema = z.object({
  id: z.string(),
  nameKey: z.string(),
  size: z.tuple([z.number().int().min(4), z.number().int().min(4)]),
  fog: z.boolean().default(false),
  /**
   * Tutorial map (Produktinhaber 2026-10-25): downed player units neither bleed out nor die, regardless of the death mode,
   * and return after the mission. Units named in a `unit_dies` defeat objective (or flagged mustSurvive) are exempt: their death still loses.
   */
  noDeath: z.boolean().optional(),
  /**
   * How the lieutenants of the map get their level (story 11.27, Produktinhaber 2026-11-10): `company` (default) from the strongest
   * units of the company plus grudge (story 3.4); `position` from the battle's position level P plus their `levelOffset` (the act 2 finale).
   */
  lieutenantLevel: z.enum(['company', 'position']).optional(),
  legend: z.record(z.string(), z.string()),
  terrain: z.string(),
  levels: z.array(z.object({ level: z.number().int().min(0).max(2), area })).optional(),
  /** ladders against wall faces (fix 2026-11-08): from tile `at` up to its neighbour in direction `up`, one level higher */
  ladders: z.array(z.object({ at: pos, up: z.enum(['n', 'e', 's', 'w']) })).optional(),
  ambient: z.object({ color: z.string().optional(), intensity: z.number().optional() }).optional(),
  lights: z.array(z.object({ at: pos, color: z.string(), radius: z.number() })).optional(),
  sun: z
    .object({ color: z.string().optional(), intensity: z.number().optional(), azimuthDeg: z.number().optional(), elevationDeg: z.number().min(1).max(90).optional() })
    .optional(),
  /** story 8.6: light preset and weather of the board; both absent = the map looks as before */
  /** a place under a roof (render only): rock instead of wild land around the map, no bushes on the floor */
  interior: z.boolean().optional(),
  /** story 15.15: season of the board, otherwise that of the act (render.yaml board.actSeason) */
  season: z.enum(SEASONS).optional(),
  timeOfDay: z.enum(TIMES_OF_DAY).optional(),
  weather: z.enum(WEATHERS).optional(),
  objects: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(['village', 'chest', 'door', 'lever', 'ballista']),
        at: pos,
        reward: reward.optional(),
        contents: reward.optional(),
        links: z.array(z.string()).optional(),
      }),
    )
    .default([]),
  initialEffects: z.array(z.object({ effect: z.literal('burning'), tiles: z.array(pos), turns: z.number().int() })).default([]),
  deploy: z.object({ max: z.number().int(), forced: z.array(z.string()), slots: z.array(pos) }),
  units: z.array(mapUnitSchema),
  pairs: z.array(z.object({ a: z.string(), b: z.string(), rank })).default([]),
  reinforcements: z
    // `unlessFlag`: the wave stays away when this battle flag is set by then (a landslide buried its cave)
    .array(z.object({ turn: z.number().int(), phase: team, announce: z.boolean().optional(), unlessFlag: z.string().optional(), units: z.array(mapUnitSchema) }))
    .default([]),
  objectives: z.object({
    victory: objective,
    defeat: z.array(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('unit_dies'), unit: z.string() }),
        z.object({ type: z.literal('turn_limit'), turns: z.number().int() }),
      ]),
    ),
    side: z
      .array(
        z.object({
          id: z.string(),
          type: z.enum(['visit_villages', 'no_downs', 'turn_limit', 'kill_with', 'recruit', 'open_chests', 'protect_npc']),
          turns: z.number().int().optional(),
          unit: z.string().optional(),
          weaponType: weaponType.optional(),
          reward,
        }),
      )
      .default([]),
  }),
  triggers: z.array(z.object({ id: z.string(), once: z.boolean().optional(), when: triggerWhen, then: z.array(triggerAction) })).default([]),
  goldReward: z.number().default(0),
  /** the map is never haunted (GDD log 2026-11-06): the company left the place for good (prologue), it caved in (1-7) or it became home (1-6); no haunt anchors */
  noHaunts: z.boolean().optional(),
  haunts: z.array(hauntAnchorSchema).optional(),
  music: z.string().optional(),
  devNote: z.string().optional(),
  /** per field the model of a prop variant (house, rock, tree, lodge), overriding the hash pick of render.yaml board.variants; content:check checks the id */
  propVariants: z.array(z.object({ at: pos, model: z.string().min(1) })).optional(),
  /** planning notes for the level sheet (`pnpm levels`, concept/27-ueberarbeitung/level-werkzeug.md); the game ignores them */
  design: z
    .strictObject({
      /** working title of a draft that has no locale key yet */
      title: z.string().optional(),
      intent: z.string().optional(),
      mood: z.string().optional(),
      notes: z.array(z.string()).optional(),
      phases: z.array(z.strictObject({ id: z.string(), turns: range, label: z.string(), note: z.string().optional() })).optional(),
      paths: z
        .array(
          z.strictObject({
            team,
            points: z.array(pos).min(2),
            phase: z.string().optional(),
            label: z.string().optional(),
          }),
        )
        .optional(),
      zones: z.array(z.strictObject({ area, label: z.string(), phase: z.string().optional() })).optional(),
      marks: z.array(z.strictObject({ at: pos, label: z.string().max(3), note: z.string() })).optional(),
    })
    .optional(),
});
