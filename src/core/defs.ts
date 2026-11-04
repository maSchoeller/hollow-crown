/**
 * Content definitions as the rules core sees them. The content layer (src/content) parses YAML,
 * validates it with Zod and produces a GameData object of these types.
 */
export const STAT_KEYS = ['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;
export type StatMods = Partial<Record<StatKey | 'mov', number>>;

export const ELEMENTS = ['fire', 'wind', 'earth', 'water', 'light', 'dark'] as const;
export type Element = (typeof ELEMENTS)[number];
export type WeaponType = 'sword' | 'lance' | 'axe' | 'dagger' | 'bow' | 'anima' | 'light' | 'dark' | 'staff' | 'breath';
/**
 * Weapon group of an item (items.md §4): what a role may carry. `weaponType` stays the rules type of a weapon
 * (triangle, ranged/melee); the group decides who may equip it, so shields, foci and lutes have a group, too.
 */
export const WEAPON_GROUPS = [
  'sword', 'lance', 'axe', 'dagger', 'bow', 'light_bow', 'anima', 'light', 'dark', 'staff', 'shield', 'focus', 'lute', 'breath',
] as const;
export type WeaponGroup = (typeof WEAPON_GROUPS)[number];
/** The seven core roles plus the two single roles of the main characters (GDD Rollenklassen). */
export const CORE_ROLES = ['vanguard', 'skirmisher', 'marksman', 'elementalist', 'healer', 'scout', 'minstrel', 'tactician', 'captain'] as const;
export type MoveType = 'foot' | 'armored' | 'mounted' | 'flier' | 'monster';
export type Team = 'player' | 'enemy' | 'other';
export type StatusId = 'burning' | 'wet' | 'slowed' | 'knockback';
/** Time of day and weather of a battle map (story 8.6, art-direction §2.5); render only, the rules never read them. */
export const TIMES_OF_DAY = ['morning', 'noon', 'evening', 'night'] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];
export const WEATHERS = ['clear', 'rain', 'fog', 'ash', 'snow'] as const;
export type Weather = (typeof WEATHERS)[number];
export type ItemSlot = 'mainHand' | 'offHand' | 'head' | 'body' | 'accessory' | 'bag';
export type EquipSlot = 'mainHand' | 'offHand' | 'head' | 'body' | 'accessory1' | 'accessory2';
export const EQUIP_SLOTS: readonly EquipSlot[] = ['mainHand', 'offHand', 'head', 'body', 'accessory1', 'accessory2'];
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Difficulty = 'easy' | 'normal' | 'hard';
/** Rules that the campaign introduces step by step (campaign.yaml `mechanics`). */
export type Mechanic = 'triangle' | 'magic' | 'elements' | 'status' | 'runes' | 'supports';
export type DeathMode = 'classic' | 'standard' | 'casual';
export type SupportRank = 'C' | 'B' | 'A' | 'S';
export const SUPPORT_RANKS: readonly SupportRank[] = ['C', 'B', 'A', 'S'];
/** Value of a story flag in `CampaignState.flags` (architecture §5.9); `true` = plainly set. */
export type FlagValue = string | number | true;
/** The avatar's stance profile counters (architecture §5.9); a tie is decided warm > sober > defiant. */
export type Stance = 'warm' | 'sober' | 'defiant';
export const STANCES: readonly Stance[] = ['warm', 'sober', 'defiant'];
export const HOME_KINDS = ['camp', 'castle'] as const;
export type HomeKind = (typeof HOME_KINDS)[number];
/** Companions the story never lets join or leave (the schema forbids `recruit`/`leave` for them). */
/** A scene illustration panel stands for 1–4 text boxes (narrative); `content:check` refuses a longer one. */
export const MAX_PANEL_LINES = 4;

export const PERMANENT_COMPANIONS: readonly string[] = ['avatar', 'kael'];
export type Pos = [number, number];

export interface ItemUse {
  heal?: number;
  cureStatus?: boolean;
  open?: string[];
  damage?: number;
  element?: Element;
  rng?: [number, number];
  status?: StatusId;
  terrain?: 'ignite' | 'extinguish';
  target?: 'ally' | 'self';
  statMods?: StatMods;
  duration?: 'round' | number;
  vision?: number;
  promote?: boolean;
  minLevel?: number;
  removeScar?: boolean;
}

export interface ItemDef {
  id: string;
  kind: 'weapon' | 'tome' | 'staff' | 'shield' | 'armor' | 'accessory' | 'consumable' | 'key' | 'seal' | 'material' | 'rune';
  slot: ItemSlot;
  weaponType?: WeaponType;
  /** weapon group: required for weapons, tomes, staves and shields; foci and lutes are accessories with a group */
  group?: WeaponGroup;
  damageType?: 'physical' | 'magical';
  element?: Element;
  mt?: number;
  hit?: number;
  crit?: number;
  rng?: [number, number];
  wt: number;
  twoHanded?: boolean;
  armorClass?: 'light' | 'medium' | 'heavy';
  statMods?: StatMods;
  combatMods?: { hit?: number; avoid?: number; crit?: number };
  effectiveVs?: string[];
  statusOnHit?: { status: StatusId; chance: number };
  terrainOnHit?: 'ignite' | 'extinguish';
  grantsSkill?: { skill: string; masteryCost: number };
  runeSlots?: number;
  setId?: string;
  rarity: Rarity;
  price: number;
  charges?: number;
  refillAfterMission?: boolean;
  use?: ItemUse;
  heal?: number;
  cureStatus?: boolean;
  utility?: { createTerrain: string; rng: [number, number] };
  tags?: string[];
  /** painted image art/items/<image>.png; defaults to the id (concept/25-ux/DESIGN.md item-image) */
  image?: string;
}

export interface AffixMods {
  stats?: StatMods;
  might?: number;
  weight?: number;
  crit?: number;
  hit?: number;
  avoid?: number;
  effectiveVs?: string[];
  statusOnHit?: { status: StatusId; chance: number };
  damageVsTag?: { tag: string; bonus: number };
}

export interface AffixDef {
  id: string;
  position: 'prefix' | 'suffix';
  appliesTo: Array<'weapon' | 'armor' | 'shield' | 'accessory'>;
  mods: AffixMods;
  rarityMin?: Rarity;
}

export interface RuneDef {
  id: string;
  element?: Element;
  tier?: number;
  utility?: boolean;
  mods?: AffixMods;
  price?: number;
  terrainOnHit?: 'ignite' | 'extinguish';
  statusOnHit?: StatusId;
  effectiveVs?: string[];
  /** painted image art/items/<image>.png; defaults to the id */
  image?: string;
}

export interface SetDef {
  id: string;
  pieces: string[];
  bonuses: Array<{ count: number; mods: { stats?: StatMods; grantSkill?: string; statusChanceBonus?: { element: Element; value: number } } }>;
}

/** Role group of a class: the filter of the troop view (concept/25-ux mockup 06). */
export type RoleGroup = 'melee' | 'ranged' | 'support';
export const ROLE_GROUPS: readonly RoleGroup[] = ['melee', 'ranged', 'support'];

/** Class action of a role (GDD Rollenklassen). Only data here; the actions themselves arrive with Epic 2. */
export interface ClassAction {
  id: string;
  /** passive rules need no button; active ones replace the action of the turn */
  kind: 'passive' | 'active';
  /** limited uses per map (Befehl, Sammelruf) */
  perMap?: number;
}

/** A class is a role (GDD): movement, allowed weapon groups, class action, growth. Weapons and skills come from gear. */
export interface ClassDef {
  id: string;
  /** core role (vanguard …), `tactician`, `captain` or an enemy type; pro classes name the role they promote from */
  role: string;
  tier: 'base' | 'pro' | 'unique';
  roleGroup: RoleGroup;
  moveType: MoveType;
  mov: number;
  weaponGroups: WeaponGroup[];
  classAction?: ClassAction;
  /** the two pro paths of a base role (ids of pro classes; undefined ids are defined with the academy) */
  proPaths: string[];
  /** class ids this class replaced (saves written before story 2.2 still name them) */
  legacyIds?: string[];
  tags: string[];
  skill?: string;
  base: Stats;
  growth: Stats;
  growthMod: Partial<Stats>;
  caps: Stats;
  promotionBonus?: Partial<Stats>;
  playable: boolean;
  sprite?: string;
  /** portrait id for generic units: art class_<art> (defaults to the class id) */
  art?: string;
}

export interface ItemRef {
  def: string;
  upgrade?: number;
  affixes?: string[];
  runes?: string[];
}

export interface CharDef {
  id: string;
  class: string;
  level: number;
  affinity: Element | 'chosen';
  personalSkill?: string;
  base: Stats;
  growth: Stats;
  items: ItemRef[];
  flags: string[];
  supports: string[];
  /** node id of the chapter he joins in, `prologue` at the start, or `lieutenant`: he joins as a lieutenant through the effect `recruit: { lt }` (story 3.7) */
  joins: string;
  portrait?: string;
  sprite?: string;
  recruit?: { chapter: string; by: string[] | 'any'; dialogue?: string };
}

export type SkillTrigger =
  | 'passive'
  | 'on_attack'
  | 'on_defend'
  | 'on_hit'
  | 'on_turn_start'
  | 'action'
  | 'after_action'
  | 'on_lethal';

export interface SkillCondition {
  notMovedThisTurn?: boolean;
  adjacentAllies?: number;
  distanceAtLeast?: number;
  hpBelowPercent?: number;
  hpAbove?: number;
  adjacentTo?: string;
  enemyLevelHigher?: boolean;
  selfOnTerrain?: string;
  attackerDamageType?: 'physical' | 'magical';
  alliesAdjacentToTarget?: number;
  initiator?: boolean;
  targetStatus?: StatusId;
  targetTag?: string;
  weaponType?: WeaponType;
  attackerNoElement?: boolean;
  notEffective?: boolean;
  /** an ally of the bearer lies downed on the field within this many tiles (Erbstück, story 9.12) */
  allyDownedWithin?: number;
}

export interface SkillEffect {
  stats?: StatMods;
  hitBonus?: number;
  avoidBonus?: number;
  critBonus?: number;
  damageBonus?: number;
  damageTakenPercent?: number;
  statusChanceBonus?: number;
  healBonus?: number;
  terrainCost?: Record<string, number>;
  rangeBonus?: number;
  lifestealPercent?: number;
  ignoreDefPercent?: number;
  extraMove?: number;
  healPercent?: number;
  surviveWith?: number;
  strikeFirst?: boolean;
  moveThroughEnemies?: boolean;
  bagChargeSaveChance?: number;
  refreshAction?: boolean;
  allowArmorClass?: string;
  /** Stehlen also takes equipped items of the foe (Elster, story 9.10) */
  stealEquipped?: boolean;
  until?: string;
}

export interface SkillDef {
  id: string;
  source: 'class' | 'personal' | 'item' | 'grudge';
  trigger: SkillTrigger;
  condition?: SkillCondition;
  effect: SkillEffect;
  usesPerMap?: number;
  chanceFrom?: StatKey;
  chanceDivisor?: number;
  area?: { radius: number; allies?: boolean };
  /**
   * Aura (Schild der Paktwächter, story 9.11): a passive skill whose `effect.stats` do not go to the bearer but to every
   * active ally within `radius` tiles of him, as long as the bearer stands (is on the map and not downed).
   */
  aura?: { radius: number };
  target?: { ally?: boolean; adjacent?: boolean; exhausted?: boolean };
}

/** A weapon library model (art/models/weapons/<model>.glb), the hand it is held in and its attack animation. */
export interface GearPiece {
  model: string;
  hand: 'left' | 'right';
  /** the figure plays attack_<motion> instead of attack, if it has it (art-direction §4.5) */
  motion?: string;
  /** degrees about the hand socket's X outside attacks: the model is built in its striking grip */
  hold?: number;
}
