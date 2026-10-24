import { z } from 'zod';

const stat = z.number();
export const statsSchema = z.object({ hp: stat, str: stat, mag: stat, skl: stat, spd: stat, lck: stat, def: stat, res: stat });
const partialStats = statsSchema.partial();
const statMods = z
  .object({ hp: stat, str: stat, mag: stat, skl: stat, spd: stat, lck: stat, def: stat, res: stat, mov: stat })
  .partial();
const element = z.enum(['fire', 'wind', 'earth', 'water', 'light', 'dark']);
const weaponType = z.enum(['sword', 'lance', 'axe', 'bow', 'anima', 'light', 'dark', 'staff', 'breath']);
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
  symbol: z
    .object({ shape: z.enum(['diamond', 'crescent', 'hexagon', 'drop']), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) })
    .optional(),
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
  tier: z.enum(['base', 'advanced', 'unique']),
  moveType,
  mov: z.number().int(),
  weapons: z.array(weaponType),
  tags: z.array(z.string()),
  skill: z.string().optional(),
  base: statsSchema,
  growth: statsSchema,
  growthMod: partialStats,
  caps: statsSchema,
  promotesTo: z.array(z.string()).default([]),
  promotionBonus: partialStats.optional(),
  playable: z.boolean(),
  sprite: z.string().optional(),
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
  source: z.enum(['class', 'personal', 'item']),
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

const aiProfile = z.enum(['aggressive', 'hold', 'guard', 'trigger', 'hunt', 'raider', 'flee', 'support']);
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
  class: z.string(),
  level: z.number().int(),
  at: pos,
  boss: z.boolean().optional(),
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

export const dialogueSchema = z.object({
  id: z.string(),
  background: z.string().optional(),
  music: z.string().optional(),
  lines: z.array(
    z.union([
      z.object({
        speaker: z.string().optional(),
        mood: z.string().optional(),
        side: z.enum(['left', 'right']).optional(),
        key: z.string(),
        if: z.object({ flag: z.string().optional(), notFlag: z.string().optional() }).optional(),
      }),
      z.object({ choice: z.array(z.object({ key: z.string(), setFlag: z.string().optional() })) }),
    ]),
  ),
});

export const campaignSchema = z.object({
  start: z.string(),
  startGold: z.number(),
  startConvoy: z.array(itemRefSchema).default([]),
  nodes: z.array(
    z.object({
      id: z.string(),
      map: z.string(),
      titleKey: z.string(),
      pre: z.string().optional(),
      post: z.string().optional(),
      next: z.array(z.string()),
      pos,
      merchantTier: z.number().int(),
      grants: z.array(z.object({ unit: z.string(), item: itemRefSchema })).optional(),
    }),
  ),
  mechanics: z.partialRecord(z.enum(['triangle', 'magic', 'elements', 'supports']), z.string()).default({}),
  facilities: z.record(z.string(), z.string()).default({}),
  merchant: z.array(z.object({ tier: z.number().int(), items: z.array(z.string()) })),
  supportPairs: z.array(z.tuple([z.string(), z.string()])),
  supportDialogues: z.record(z.string(), z.object({ C: z.string(), B: z.string(), A: z.string(), S: z.string() }).partial()),
  scars: z.array(
    z.object({
      id: z.string(),
      mods: statMods.extend({ hit: z.number().optional(), crit: z.number().optional(), avoid: z.number().optional() }),
    }),
  ),
});

/** Presentation values of the battle board; see core/defs.ts RenderDef. */
const qualityLevel = z.object({ maxDpr: z.number().positive(), shadowMap: z.number().int().min(0) });
const gearPiece = z.object({ model: z.string().regex(/^[a-z0-9_]+$/), hand: z.enum(['left', 'right']), motion: z.string().regex(/^[a-z]+$/).optional(), hold: z.number().min(-180).max(180).optional() });
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
    lightsMax: z.object({ high: z.number().int().min(0), mid: z.number().int().min(0), low: z.number().int().min(0) }),
    figureScale: z.number().positive(),
    fpsActive: z.number().positive(),
    fpsIdle: z.number().positive(),
    sceneryPropsLow: z.number().int().min(0),
  }),
  gear: z.object({
    weapons: z.partialRecord(weaponType, gearPiece),
    offHand: z.partialRecord(itemSchema.shape.kind, gearPiece),
  }),
  quality: z.object({ high: qualityLevel, mid: qualityLevel, low: qualityLevel }),
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
  supports: z.looseObject({ thresholds: z.record(z.string(), z.number()) }),
  experience: z.record(z.string(), z.number()),
  growth: z.record(z.string(), z.union([z.number(), z.boolean()])),
  levels: z.record(z.string(), z.number()),
  skills: z.record(z.string(), z.number()),
  death: z.record(z.string(), z.number()),
  fog: z.looseObject({}),
  rally: z.record(z.string(), z.number()),
  bag: z.object({ size: z.number().int() }),
  economy: z.looseObject({ rarityAffixes: z.record(z.string(), z.number()), rarityRuneSlots: z.record(z.string(), z.number()) }),
  difficulty: z.record(z.string(), z.looseObject({ enemyStatPercent: z.number() })),
  ai: z.record(z.string(), z.number()),
});
