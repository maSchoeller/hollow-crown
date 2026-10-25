import { z } from 'zod';
import type { Condition, Effect } from '../core/defs';
import { PERMANENT_COMPANIONS, WEAPON_GROUPS } from '../core/defs';

const stat = z.number();
export const statsSchema = z.object({ hp: stat, str: stat, mag: stat, skl: stat, spd: stat, lck: stat, def: stat, res: stat });
const partialStats = statsSchema.partial();
const statMods = z
  .object({ hp: stat, str: stat, mag: stat, skl: stat, spd: stat, lck: stat, def: stat, res: stat, mov: stat })
  .partial();
const element = z.enum(['fire', 'wind', 'earth', 'water', 'light', 'dark']);
const weaponType = z.enum(['sword', 'lance', 'axe', 'dagger', 'bow', 'anima', 'light', 'dark', 'staff', 'breath']);
const weaponGroup = z.enum(WEAPON_GROUPS);
const moveType = z.enum(['foot', 'armored', 'mounted', 'flier', 'monster']);
const statusId = z.enum(['burning', 'wet', 'slowed', 'knockback']);
const rarity = z.enum(['common', 'rare', 'epic', 'legendary']);
const team = z.enum(['player', 'enemy', 'other']);
const rank = z.enum(['C', 'B', 'A', 'S']);
const pos = z.tuple([z.number().int(), z.number().int()]);
const range = z.tuple([z.number().int(), z.number().int()]);
const area = z.union([
  z.object({ rect: z.tuple([z.number().int(), z.number().int(), z.number().int(), z.number().int()]) }),
  z.object({ tiles: z.array(pos) }),
]);

export const itemRefSchema = z.object({
  def: z.string(),
  upgrade: z.number().int().min(0).max(5).optional(),
  affixes: z.array(z.string()).optional(),
  runes: z.array(z.string()).optional(),
});

export const itemSchema = z.object({
  id: z.string(),
  kind: z.enum(['weapon', 'tome', 'staff', 'shield', 'armor', 'accessory', 'consumable', 'key', 'seal', 'material', 'rune']),
  slot: z.enum(['mainHand', 'offHand', 'head', 'body', 'accessory', 'bag']),
  weaponType: weaponType.optional(),
  group: weaponGroup.optional(),
  damageType: z.enum(['physical', 'magical']).optional(),
  element: element.optional(),
  mt: z.number().optional(),
  hit: z.number().optional(),
  crit: z.number().optional(),
  rng: range.optional(),
  wt: z.number(),
  twoHanded: z.boolean().optional(),
  armorClass: z.enum(['light', 'medium', 'heavy']).optional(),
  statMods: statMods.optional(),
  combatMods: z.object({ hit: z.number(), avoid: z.number(), crit: z.number() }).partial().optional(),
  effectiveVs: z.array(z.string()).optional(),
  statusOnHit: z.object({ status: statusId, chance: z.number() }).optional(),
  terrainOnHit: z.enum(['ignite', 'extinguish']).optional(),
  grantsSkill: z.object({ skill: z.string(), masteryCost: z.number() }).optional(),
  runeSlots: z.number().optional(),
  setId: z.string().optional(),
  rarity,
  price: z.number(),
  charges: z.number().optional(),
  refillAfterMission: z.boolean().optional(),
  use: z
    .object({
      heal: z.number(),
      cureStatus: z.boolean(),
      open: z.array(z.string()),
      damage: z.number(),
      element,
      rng: range,
      status: statusId,
      terrain: z.enum(['ignite', 'extinguish']),
      target: z.enum(['ally', 'self']),
      statMods,
      duration: z.union([z.literal('round'), z.number()]),
      vision: z.number(),
      promote: z.boolean(),
      minLevel: z.number(),
      removeScar: z.boolean(),
    })
    .partial()
    .optional(),
  heal: z.number().optional(),
  cureStatus: z.boolean().optional(),
  utility: z.object({ createTerrain: z.string(), rng: range }).optional(),
  tags: z.array(z.string()).optional(),
  /** painted image art/items/<image>.png; defaults to the id */
  image: z.string().optional(),
});

const affixMods = z
  .object({
    stats: statMods,
    might: z.number(),
    weight: z.number(),
    crit: z.number(),
    hit: z.number(),
    avoid: z.number(),
    effectiveVs: z.array(z.string()),
    statusOnHit: z.object({ status: statusId, chance: z.number() }),
    damageVsTag: z.object({ tag: z.string(), bonus: z.number() }),
  })
  .partial();

export const affixSchema = z.object({
  id: z.string(),
  position: z.enum(['prefix', 'suffix']),
  appliesTo: z.array(z.enum(['weapon', 'armor', 'shield', 'accessory'])),
  mods: affixMods,
  rarityMin: rarity.optional(),
});

export const runeSchema = z.object({
  id: z.string(),
  element: element.optional(),
  tier: z.number().int().optional(),
  utility: z.boolean().optional(),
  mods: affixMods.optional(),
  price: z.number().optional(),
  terrainOnHit: z.enum(['ignite', 'extinguish']).optional(),
  statusOnHit: statusId.optional(),
  effectiveVs: z.array(z.string()).optional(),
  /** painted image art/items/<image>.png; defaults to the id */
  image: z.string().optional(),
});

export const setSchema = z.object({
  id: z.string(),
  pieces: z.array(z.string()),
  bonuses: z.array(
    z.object({
      count: z.number().int(),
      mods: z
        .object({ stats: statMods, grantSkill: z.string(), statusChanceBonus: z.object({ element, value: z.number() }) })
        .partial(),
    }),
  ),
});

export const classSchema = z.object({
  id: z.string(),
  role: z.string(),
  tier: z.enum(['base', 'pro', 'unique']),
  roleGroup: z.enum(['melee', 'ranged', 'support']),
  moveType,
  mov: z.number().int(),
  weaponGroups: z.array(weaponGroup).min(1),
  classAction: z.object({ id: z.string(), kind: z.enum(['passive', 'active']), perMap: z.number().int().positive().optional() }).optional(),
  proPaths: z.array(z.string()).max(2).default([]),
  legacyIds: z.array(z.string()).default([]),
  tags: z.array(z.string()),
  skill: z.string().optional(),
  base: statsSchema,
  growth: statsSchema,
  growthMod: partialStats,
  caps: statsSchema,
  promotionBonus: partialStats.optional(),
  playable: z.boolean(),
  sprite: z.string().optional(),
  art: z.string().optional(),
});

export const charSchema = z.object({
  id: z.string(),
  class: z.string(),
  level: z.number().int(),
  affinity: z.union([element, z.literal('chosen')]),
  personalSkill: z.string().optional(),
  base: statsSchema,
  growth: statsSchema,
  items: z.array(itemRefSchema),
  flags: z.array(z.string()).default([]),
  supports: z.array(z.string()).default([]),
  joins: z.string(),
  portrait: z.string().optional(),
  sprite: z.string().optional(),
  recruit: z
    .object({ chapter: z.string(), by: z.union([z.array(z.string()), z.literal('any')]), dialogue: z.string().optional() })
    .optional(),
});

const skillCondition = z
  .object({
    notMovedThisTurn: z.boolean(),
    adjacentAllies: z.number(),
    distanceAtLeast: z.number(),
    hpBelowPercent: z.number(),
    hpAbove: z.number(),
    adjacentTo: z.string(),
    enemyLevelHigher: z.boolean(),
    selfOnTerrain: z.string(),
    attackerDamageType: z.enum(['physical', 'magical']),
    alliesAdjacentToTarget: z.number(),
    initiator: z.boolean(),
    targetStatus: statusId,
    targetTag: z.string(),
    weaponType,
    attackerNoElement: z.boolean(),
    notEffective: z.boolean(),
  })
  .partial();

export const skillSchema = z.object({
  id: z.string(),
  source: z.enum(['class', 'personal', 'item', 'grudge']),
  trigger: z.enum(['passive', 'on_attack', 'on_defend', 'on_hit', 'on_turn_start', 'action', 'after_action', 'on_lethal']),
  condition: skillCondition.optional(),
  effect: z
    .object({
      stats: statMods,
      hitBonus: z.number(),
      avoidBonus: z.number(),
      critBonus: z.number(),
      damageBonus: z.number(),
      damageTakenPercent: z.number(),
      statusChanceBonus: z.number(),
      healBonus: z.number(),
      terrainCost: z.record(z.string(), z.number()),
      rangeBonus: z.number(),
      lifestealPercent: z.number(),
      ignoreDefPercent: z.number(),
      extraMove: z.number(),
      healPercent: z.number(),
      surviveWith: z.number(),
      strikeFirst: z.boolean(),
      moveThroughEnemies: z.boolean(),
      bagChargeSaveChance: z.number(),
      refreshAction: z.boolean(),
      allowArmorClass: z.string(),
      until: z.string(),
    })
    .partial(),
  usesPerMap: z.number().optional(),
  chanceFrom: z.enum(['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res']).optional(),
  chanceDivisor: z.number().optional(),
  area: z.object({ radius: z.number(), allies: z.boolean().optional() }).optional(),
  target: z.object({ ally: z.boolean(), adjacent: z.boolean(), exhausted: z.boolean() }).partial().optional(),
});

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
  surface: z.enum(['grass', 'dirt', 'road', 'sand', 'ash', 'stone', 'riverbed']),
  cliff: z.enum(['earth', 'rock', 'wall']).default('earth'),
  water: z.boolean().default(false),
});

const aiProfile = z.enum(['aggressive', 'hold', 'guard', 'trigger', 'hunt', 'raider', 'flee', 'support', 'follow']);
const aiSchema = z.object({
  profile: aiProfile,
  radius: z.number().optional(),
  then: aiProfile.optional(),
  target: z.string().optional(),
  area: area.optional(),
});

export const mapUnitSchema = z.object({
  id: z.string().optional(),
  char: z.string().optional(),
  team,
  /** may be left out when `lieutenant` is set: the loader takes the class of the lieutenant (story 3.1) */
  class: z.string().optional(),
  level: z.number().int(),
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
  difficulty: z.array(z.enum(['easy', 'normal', 'hard'])).optional(),
});

const reward = z
  .object({
    gold: z.number(),
    item: itemRefSchema,
    material: z.record(z.string(), z.number()),
    recruit: z.string(),
    dialogue: z.string(),
  })
  .partial();

const objective = z.discriminatedUnion('type', [
  z.object({ type: z.literal('rout') }),
  z.object({ type: z.literal('boss'), unit: z.string() }),
  z.object({ type: z.literal('reach'), unit: z.string().optional(), area }),
  z.object({ type: z.literal('seize'), area }),
  z.object({ type: z.literal('defend'), unit: z.string(), turns: z.number().int() }),
  z.object({ type: z.literal('survive'), turns: z.number().int() }),
  z.object({ type: z.literal('escape'), area, min: z.number().int().optional() }),
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
]);

const triggerAction = z.discriminatedUnion('action', [
  z.object({ action: z.literal('dialogue'), id: z.string() }),
  z.object({ action: z.literal('set_ai'), units: z.array(z.string()), profile: aiProfile }),
  z.object({ action: z.literal('spawn'), units: z.array(mapUnitSchema) }),
  z.object({ action: z.literal('set_flag'), flag: z.string() }),
]);

export const mapSchema = z.object({
  id: z.string(),
  nameKey: z.string(),
  size: z.tuple([z.number().int().min(4), z.number().int().min(4)]),
  fog: z.boolean().default(false),
  legend: z.record(z.string(), z.string()),
  terrain: z.string(),
  ambient: z.object({ color: z.string(), intensity: z.number() }).optional(),
  lights: z.array(z.object({ at: pos, color: z.string(), radius: z.number() })).optional(),
  sun: z
    .object({ color: z.string(), intensity: z.number(), azimuthDeg: z.number(), elevationDeg: z.number().min(1).max(90) })
    .optional(),
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
    .array(z.object({ turn: z.number().int(), phase: team, announce: z.boolean().optional(), units: z.array(mapUnitSchema) }))
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
  music: z.string().optional(),
  devNote: z.string().optional(),
});

// --- conditions and effects (architecture §5.3): an object with exactly one key; a list of conditions means AND ---
const flagValue = z.union([z.string(), z.number(), z.literal(true)]);
const flagRef = z.union([
  z.string().min(1),
  z.record(z.string(), flagValue).refine((r) => Object.keys(r).length === 1, 'exactly one flag'),
]);
const companion = z.string().min(1);
/** `recruit`/`leave` never apply to the avatar or Kael. */
const movableCompanion = companion.refine((id) => !PERMANENT_COMPANIONS.includes(id), 'avatar and kael never join or leave');
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
    z.strictObject({ support: z.strictObject({ pair: z.tuple([companion, companion]), rank }) }),
    z.strictObject({ stance }),
    z.strictObject({ met: z.string().min(1) }),
    z.strictObject({ chronicle: z.union([z.strictObject({ min: z.number().int().min(1) }), z.array(z.string().min(1)).min(1)]) }),
    z.strictObject({ any: z.array(conditionSchema).min(1) }),
    z.strictObject({ not: conditionSchema }),
  ]),
);
export const conditionsSchema = z.union([conditionSchema, z.array(conditionSchema)]);
const conditionsListSchema = z.array(conditionSchema);

export const roomSchema = z.object({
  id: z.string(),
  function: z.enum(['convoy', 'merchant', 'smith', 'healer', 'tavern', 'campfire', 'memorial', 'enchanter']),
  icon: z.string(),
  fromAct: z.number().int().min(1).default(1),
  homes: z.array(z.enum(['camp', 'castle'])).min(1),
  requires: z.array(conditionSchema).default([]),
  // level 2 and 3 of a castle room: one entry each, in order
  levels: z.array(z.strictObject({ requires: z.array(conditionSchema).default([]) })).max(2).default([]),
  unlocks: z.array(z.strictObject({ id: z.string().regex(/^[a-z][a-z0-9_]*$/), requires: z.array(conditionSchema).default([]) })).default([]),
});

export const effectSchema: z.ZodType<Effect> = z.union([
  z.strictObject({ setFlag: flagRef }),
  z.strictObject({ recruit: z.union([movableCompanion, z.strictObject({ lt: z.string().min(1) })]) }),
  z.strictObject({ leave: movableCompanion }),
  z.strictObject({ grudge: z.strictObject({ lt: z.string().min(1), delta: z.number().int() }) }),
  z.strictObject({ gold: z.number().int() }),
  z.strictObject({ material: z.record(z.string(), z.number().int()) }),
  z.strictObject({ item: itemRefSchema }),
  z.strictObject({ priceMod: z.strictObject({ pct: z.number(), act: z.number().int().min(1) }) }),
  z.strictObject({ villageAid: z.literal(true) }),
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
      pos,
      place: z.string().optional(),
      merchantTier: z.number().int(),
      expectedLevel: z.number().int().min(1),
      grants: z.array(z.object({ unit: z.string(), item: itemRefSchema })).optional(),
      effects: z.array(effectSchema).optional(),
    }),
  ),
  mechanics: z.partialRecord(z.enum(['triangle', 'magic', 'elements', 'supports']), z.number().int().min(0)).default({}),
  home: z.enum(['camp', 'castle']).default('camp'),
  homePos: pos.default([50, 50]),
  merchant: z.array(z.object({ tier: z.number().int(), items: z.array(z.string()) })),
  scars: z.array(
    z.object({
      id: z.string(),
      mods: statMods.extend({ hit: z.number().optional(), crit: z.number().optional(), avoid: z.number().optional() }),
    }),
  ),
});

/** The flat world map (story 5.2, architecture §5.12): the painted picture, regions with fog, places on it. */
const percentPos = z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]);
export const worldSchema = z.object({
  id: z.string(),
  image: z.string().regex(/^[a-z0-9_]+$/),
  size: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  regions: z.array(z.object({ id: z.string(), act: z.number().int().min(1), at: percentPos })).min(1),
  fog: z.array(z.object({ act: z.number().int().min(2), y: z.number().min(0).max(100) })).default([]),
  places: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9_]+$/),
        label: z.string().min(1).max(4),
        act: z.number().int().min(1),
        kind: z.enum(['story', 'side', 'home']),
        at: percentPos,
        node: z.string().optional(),
      }),
    )
    .min(1),
});

const qualityLevel = z.object({ maxDpr: z.number().positive(), shadowMap: z.number().int().min(0) });
const gearPiece = z.object({ model: z.string().regex(/^[a-z0-9_]+$/), hand: z.enum(['left', 'right']), motion: z.string().regex(/^[a-z]+$/).optional(), hold: z.number().min(-180).max(180).optional() });
const decorSchema = z.object({ model: z.string(), map: z.number().min(0).max(1), scenery: z.number().min(0).max(1), scale: z.tuple([z.number().positive(), z.number().positive()]) });

export const renderSchema = z.object({
  camera: z.object({
    tiltDeg: z.number().min(0).max(80),
    margin: z.number().min(0).max(1),
    zoomSteps: z.array(z.number().positive()).min(1),
    zoomMs: z.number().min(0),
  }),
  board: z.object({
    skirt: z.number().int().min(0),
    skirtDim: z.number().min(0).max(1),
    waterLevel: z.number(),
    baseDepth: z.number().positive(),
    waterFrameMs: z.number().positive(),
    lightsMax: z.object({ high: z.number().int().min(0), mid: z.number().int().min(0), low: z.number().int().min(0) }),
    figureScale: z.number().positive(),
    fade: z.object({ alpha: z.number().min(0).max(1), cover: z.number().min(0), figureWidth: z.number().min(0) }),
    fpsActive: z.number().positive(),
    fpsIdle: z.number().positive(),
    idleHz: z.number().positive(),
    precompileMs: z.number().int().min(0),
    sceneryPropsLow: z.number().int().min(0),
    trees: z.record(z.string(), z.array(z.object({ model: z.string(), weight: z.number().positive() })).min(1)),
    decor: z.object({ bushes: decorSchema, stones: decorSchema }),
  }),
  gear: z.object({
    weapons: z.partialRecord(weaponType, gearPiece),
    offHand: z.partialRecord(weaponGroup, gearPiece),
  }),
  quality: z.object({ high: qualityLevel, mid: qualityLevel, low: qualityLevel }),
  assets: z.object({ keepUnused: z.number().int().min(0) }),
  worldMap: z.object({
    zoomSteps: z.array(z.number().positive()).length(2),
    zoomMs: z.number().min(0),
    focusZoom: z.number().positive(),
  }),
});

/** Balance is validated structurally (all sections present, numbers numeric); see core/defs.ts Balance. */
export const balanceSchema = z.object({
  combat: z.record(z.string(), z.union([z.number(), z.boolean()])),
  triangle: z.object({ hit: z.number(), damage: z.number(), beats: z.record(z.string(), z.string()) }),
  element: z.object({
    cycle: z.record(z.string(), z.string()),
    opposed: z.array(z.tuple([z.string(), z.string()])),
    advantage: z.number(),
    disadvantage: z.number(),
    sameElement: z.number(),
    maxBonusPercent: z.number(),
    lightEffectiveVs: z.array(z.string()),
    darkBonusVs: z.array(z.string()),
    statusOf: z.record(z.string(), statusId),
  }),
  status: z.record(z.string(), z.number()),
  terrainEffects: z.record(z.string(), z.number()),
  weight: z.object({
    carryBonus: z.record(z.string(), z.number()),
    movPenalty: z.array(z.object({ overload: z.number(), mov: z.number() })),
  }),
  supports: z.looseObject({
    thresholds: z.record(z.string(), z.number()),
    campfireMaxRank: z.array(z.enum(['C', 'B', 'A', 'S'])).min(1),
    seasonPairs: z.number().int().min(1),
    corePairs: z.number().int().min(0),
  }),
  experience: z.record(z.string(), z.number()),
  growth: z.record(z.string(), z.union([z.number(), z.boolean()])),
  levels: z.record(z.string(), z.number()),
  skills: z.record(z.string(), z.number()),
  death: z.record(z.string(), z.number()),
  day: z.strictObject({ resetHour: z.number().int().min(0).max(23), catchUp: z.number().int().min(1) }),
  scene: z.strictObject({
    autoBaseMs: z.number().int().min(0),
    autoPerCharMs: z.number().int().min(0),
    typeCharsPerTick: z.number().int().min(1),
    typeTickMs: z.number().int().min(1),
    bubbleAutoMs: z.number().int().min(500),
    bubbleMaxChars: z.number().int().min(20),
  }),
  loading: z.object({ fetchTimeoutMs: z.number().int().min(1000), packRetryBaseMs: z.number().int().min(100), packRetryMaxMs: z.number().int().min(100) }),
  chronicle: z.strictObject({ seasonPages: z.number().int().min(1) }),
  farewell: z.object({ lockMs: z.number().int().min(0) }),
  simulation: z.object({
    armySize: z.number().int().min(1),
    levelTolerance: z.number().min(0),
    corridors: z.record(
      z.enum(['easy', 'normal', 'hard']),
      z.object({ winMin: z.number().optional(), winMax: z.number().optional(), downsMin: z.number().optional(), downsMax: z.number().optional() }),
    ),
    gold: z.object({
      perNode: z.record(z.string(), z.tuple([z.number(), z.number()])),
      perAct: z.record(z.string(), z.tuple([z.number(), z.number()])),
      sideShare: z.tuple([z.number(), z.number()]),
    }),
  }),
  fog: z.object({
    baseVision: z.number().int().min(1),
    roleBonus: z.record(z.string(), z.number().int().min(0)),
    moveTypeBonus: z.partialRecord(moveType, z.number().int().min(0)),
    blockers: z.array(z.string()),
  }),
  rally: z.record(z.string(), z.number()),
  classActions: z.object({
    aim: z.object({ rangeBonus: z.number().int().min(0), hit: z.number() }),
    farRescue: z.object({ range: z.number().int().min(1) }),
    cheer: z.object({ mov: z.number().int(), hit: z.number() }),
    hold: z.object({ detourMax: z.number().int().min(0) }),
    cast: z.object({ waterRadius: z.number().int().min(0), fogDuration: z.number().int().min(1) }),
  }),
  bag: z.object({ size: z.number().int() }),
  economy: z.looseObject({
    rarityAffixes: z.record(z.string(), z.number()),
    rarityRuneSlots: z.record(z.string(), z.number()),
    mercenaryLimit: z.number().int().min(0),
    smithMaxUpgrade: z.array(z.number().int().min(0)).min(1),
    rerollFromSmithLevel: z.number().int().min(1),
    tavern: z.object({
      levelSpread: z.number().int().min(0),
      names: z.array(z.string()).min(1),
      classes: z.array(z.object({ class: z.string(), items: z.array(z.string()), requires: z.array(conditionSchema).optional() })).min(1),
    }),
  }),
  difficulty: z.record(z.string(), z.looseObject({ enemyStatPercent: z.number() })),
  ai: z.record(z.string(), z.number()),
  lieutenant: z.strictObject({
    bounty: z.strictObject({
      goldPerLevel: z.number().int().min(0),
      materials: z.strictObject({ min: z.number().int().min(0), max: z.number().int().min(0) }).refine((m) => m.min <= m.max, 'materials: min above max'),
      materialByAct: z.record(z.string(), z.string()),
    }),
    signature: z.strictObject({ chance: z.number().min(0).max(1), guaranteedRout: z.number().int().min(1) }),
  }),
});
