/** Schemas of items, affixes, runes, sets, classes, characters and skills. */
import { z } from 'zod';
import { element, moveType, partialStats, range, rarity, statMods, statsSchema, statusId, weaponGroup, weaponType } from './schemaBase';

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
  /** empty = the class carries no weapon (civilian) */
  weaponGroups: z.array(weaponGroup),
  classAction: z.object({ id: z.string(), kind: z.enum(['passive', 'active']), perMap: z.number().int().positive().optional() }).optional(),
  proPaths: z.array(z.string()).max(2).default([]),
  legacyIds: z.array(z.string()).default([]),
  tags: z.array(z.string()),
  skill: z.string().optional(),
  /** skills of a pro path (story 10.2/10.3): active for the class and for a unit that learned it as its second path */
  proSkills: z.array(z.string()).max(2).default([]),
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
    allyDownedWithin: z.number().int().min(1),
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
      stealEquipped: z.boolean(),
      until: z.string(),
    })
    .partial(),
  usesPerMap: z.number().optional(),
  chanceFrom: z.enum(['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res']).optional(),
  chanceDivisor: z.number().optional(),
  area: z.object({ radius: z.number(), allies: z.boolean().optional() }).optional(),
  aura: z.object({ radius: z.number().int().min(1) }).optional(),
  target: z.object({ ally: z.boolean(), adjacent: z.boolean(), exhausted: z.boolean() }).partial().optional(),
});
