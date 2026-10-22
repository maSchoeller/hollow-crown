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
export type WeaponType = 'sword' | 'lance' | 'axe' | 'bow' | 'anima' | 'light' | 'dark' | 'staff' | 'breath';
export type MoveType = 'foot' | 'armored' | 'mounted' | 'flier' | 'monster';
export type Team = 'player' | 'enemy' | 'other';
export type StatusId = 'burning' | 'wet' | 'slowed' | 'knockback';
export type ItemSlot = 'mainHand' | 'offHand' | 'head' | 'body' | 'accessory' | 'bag';
export type EquipSlot = 'mainHand' | 'offHand' | 'head' | 'body' | 'accessory1' | 'accessory2';
export const EQUIP_SLOTS: readonly EquipSlot[] = ['mainHand', 'offHand', 'head', 'body', 'accessory1', 'accessory2'];
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type DeathMode = 'classic' | 'standard' | 'casual';
export type SupportRank = 'C' | 'B' | 'A' | 'S';
export const SUPPORT_RANKS: readonly SupportRank[] = ['C', 'B', 'A', 'S'];
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
}

export interface SetDef {
  id: string;
  pieces: string[];
  bonuses: Array<{ count: number; mods: { stats?: StatMods; grantSkill?: string; statusChanceBonus?: { element: Element; value: number } } }>;
}

export interface ClassDef {
  id: string;
  tier: 'base' | 'advanced' | 'unique';
  moveType: MoveType;
  mov: number;
  weapons: WeaponType[];
  tags: string[];
  skill?: string;
  base: Stats;
  growth: Stats;
  growthMod: Partial<Stats>;
  caps: Stats;
  promotesTo: string[];
  promotionBonus?: Partial<Stats>;
  playable: boolean;
  sprite?: string;
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
  until?: string;
}

export interface SkillDef {
  id: string;
  source: 'class' | 'personal' | 'item';
  trigger: SkillTrigger;
  condition?: SkillCondition;
  effect: SkillEffect;
  usesPerMap?: number;
  chanceFrom?: StatKey;
  chanceDivisor?: number;
  area?: { radius: number; allies?: boolean };
  target?: { ally?: boolean; adjacent?: boolean; exhausted?: boolean };
}

export interface TerrainDef {
  id: string;
  def: number;
  avoid: number;
  heal: number;
  flammable: boolean;
  /** movement cost per move type; null = impassable */
  cost: Record<MoveType, number | null>;
  /** ground layer used by the renderer's dual-grid composition */
  ground: string;
  /** optional prop drawn on top (tree, house, …) */
  prop?: string;
  seizable?: boolean;
  visitable?: boolean;
}

export type Area = { rect: [number, number, number, number] } | { tiles: Pos[] };

export interface MapUnitDef {
  id?: string;
  char?: string;
  team: Team;
  class: string;
  level: number;
  at: Pos;
  boss?: boolean;
  nameKey?: string;
  sprite?: string;
  portrait?: string;
  items: ItemRef[];
  drops?: number[];
  ai?: AiDef;
  quote?: string;
  recruit?: { by: string[] | 'any'; dialogue?: string };
  ignoreForRout?: boolean;
}

export interface AiDef {
  profile: 'aggressive' | 'hold' | 'guard' | 'trigger' | 'hunt' | 'raider' | 'flee' | 'support';
  radius?: number;
  then?: AiDef['profile'];
  target?: string;
  area?: Area;
}

export interface MapObjectDef {
  id: string;
  type: 'village' | 'chest' | 'door' | 'lever' | 'ballista';
  at: Pos;
  reward?: Reward;
  contents?: Reward;
  links?: string[];
}

export interface Reward {
  gold?: number;
  item?: ItemRef;
  material?: Record<string, number>;
  recruit?: string;
  dialogue?: string;
}

export type ObjectiveDef =
  | { type: 'rout' }
  | { type: 'boss'; unit: string }
  | { type: 'reach'; unit?: string; area: Area }
  | { type: 'seize'; area: Area }
  | { type: 'defend'; unit: string; turns: number }
  | { type: 'survive'; turns: number }
  | { type: 'escape'; area: Area; min?: number };

export type DefeatDef = { type: 'unit_dies'; unit: string } | { type: 'turn_limit'; turns: number };

export interface SideObjectiveDef {
  id: string;
  type: 'visit_villages' | 'no_downs' | 'turn_limit' | 'kill_with' | 'recruit' | 'open_chests' | 'protect_npc';
  turns?: number;
  unit?: string;
  weaponType?: WeaponType;
  reward: Reward;
}

export type TriggerWhen =
  | { type: 'turn_start'; turn: number; phase: Team }
  | { type: 'unit_enters'; team?: Team; unit?: string; area: Area }
  | { type: 'unit_dies'; unit: string }
  | { type: 'object_destroyed'; object: string }
  | { type: 'object_activated'; object: string }
  | { type: 'talked'; unit: string }
  | { type: 'hp_below'; unit: string; percent: number };

export type TriggerAction =
  | { action: 'dialogue'; id: string }
  | { action: 'set_ai'; units: string[]; profile: AiDef['profile'] }
  | { action: 'spawn'; units: MapUnitDef[] }
  | { action: 'set_flag'; flag: string };

export interface TriggerDef {
  id: string;
  once?: boolean;
  when: TriggerWhen;
  then: TriggerAction[];
}

export interface ReinforcementDef {
  turn: number;
  phase: Team;
  announce?: boolean;
  units: MapUnitDef[];
}

export interface MapDef {
  id: string;
  nameKey: string;
  size: [number, number];
  fog: boolean;
  legend: Record<string, string>;
  terrain: string;
  ambient?: { color: string; intensity: number };
  lights?: Array<{ at: Pos; color: string; radius: number }>;
  objects: MapObjectDef[];
  initialEffects: Array<{ effect: 'burning'; tiles: Pos[]; turns: number }>;
  deploy: { max: number; forced: string[]; slots: Pos[] };
  units: MapUnitDef[];
  pairs: Array<{ a: string; b: string; rank: SupportRank }>;
  reinforcements: ReinforcementDef[];
  objectives: { victory: ObjectiveDef; defeat: DefeatDef[]; side: SideObjectiveDef[] };
  triggers: TriggerDef[];
  goldReward: number;
  music?: string;
  devNote?: string;
}

export type DialogueLine =
  | { speaker?: string; mood?: string; side?: 'left' | 'right'; key: string; if?: { flag?: string; notFlag?: string } }
  | { choice: Array<{ key: string; setFlag?: string }> };

export interface DialogueDef {
  id: string;
  background?: string;
  music?: string;
  lines: DialogueLine[];
}

export interface CampaignNodeDef {
  id: string;
  map: string;
  titleKey: string;
  pre?: string;
  post?: string;
  next: string[];
  pos: Pos;
  merchantTier: number;
}

export interface CampaignDef {
  nodes: CampaignNodeDef[];
  start: string;
  startGold: number;
  startConvoy: ItemRef[];
  merchant: Array<{ tier: number; items: string[] }>;
  supportPairs: Array<[string, string]>;
  supportDialogues: Record<string, Partial<Record<SupportRank, string>>>;
  scars: Array<{ id: string; mods: StatMods & { hit?: number; crit?: number; avoid?: number } }>;
}

export interface Balance {
  combat: {
    hitPerSkl: number;
    hitPerLckDivisor: number;
    avoidPerAs: number;
    critPerSklDivisor: number;
    critMultiplier: number;
    doubleAttackThreshold: number;
    effectiveMightMultiplier: number;
    twoRnHit: boolean;
  };
  triangle: { hit: number; damage: number; beats: Record<string, string> };
  element: {
    cycle: Record<string, string>;
    opposed: Array<[string, string]>;
    advantage: number;
    disadvantage: number;
    sameElement: number;
    maxBonusPercent: number;
    lightEffectiveVs: string[];
    darkBonusVs: string[];
    statusOf: Record<string, StatusId>;
  };
  status: {
    durationRounds: number;
    burnPercentMaxHp: number;
    wetSpdPenalty: number;
    slowMovPenalty: number;
    knockbackBlockedDamage: number;
    rune2StatusChance: number;
    rune3StatusChance: number;
  };
  terrainEffects: {
    burningDuration: number;
    burningEnterDamage: number;
    burningSpreadChance: number;
    rockwallDuration: number;
    windFogClearRadius: number;
  };
  weight: { carryBonus: Record<MoveType, number>; movPenalty: Array<{ overload: number; mov: number }> };
  supports: {
    thresholds: Record<SupportRank, number>;
    adjacencyBonus: Record<SupportRank, { hit?: number; avoid?: number; crit?: number }>;
    adjacencyBonusCap: { hit: number; avoid: number };
    pointsAdjacentEnd: number;
    pointsTandemHealRescue: number;
    tandemMinRank: SupportRank;
    tandemDamagePercent: number;
    guardChance: Partial<Record<SupportRank, number>>;
    griefHitPenalty: number;
    griefMissions: number;
  };
  experience: {
    levelUpAt: number;
    advancedLevelOffset: number;
    combatBase: number;
    combatMin: number;
    combatMax: number;
    killBase: number;
    killPerLevelDiff: number;
    killMin: number;
    killMax: number;
    bossBonus: number;
    heal: number;
    healExtraTarget: number;
    rescueOrTalk: number;
  };
  growth: { smoothingLower: number; smoothingUpper: number; minOneStatPerLevel: boolean };
  levels: { max: number; promoteFrom: number };
  skills: { spPerCombat: number; spPerMissionEnd: number; loadoutBase: number; loadoutAdvanced: number };
  death: { scarsUntilInstantDeath: number };
  fog: { baseVision: number; visionBonus: Record<string, number> };
  rally: { radius: number; damage: number; hit: number };
  bag: { size: number };
  economy: {
    sellRatio: number;
    upgradeCost: Array<{ level: number; gold: number; materials: Record<string, number> }>;
    upgradePerLevel: { weaponMight: number; weaponHit: number; armorDefOrRes: number };
    rerollAffix: { gold: number; arcane_dust: number; epicGold: number; epicArcaneDust: number };
    runeMerge: { count: number; goldPerTier: number };
    recruitCost: { base: number; perLevel: number };
    scarRemoval: { gold: number; altItem: string };
    potionUpgrade: Array<{ gold: number; heal: number }>;
    tavernOffersPerChapter: number;
    armyLimit: number;
    convoySize: number;
    rarityAffixes: Record<Rarity, number>;
    rarityRuneSlots: Record<Rarity, number>;
  };
  difficulty: Record<
    Difficulty,
    {
      enemyStatPercent: number;
      aiFinishDowned: 'never' | 'fallback' | 'prefer';
      enemyAffixes: boolean;
      aiDangerAware?: boolean;
      ambushReinforcements?: boolean;
    }
  >;
  ai: {
    killChanceWeight: number;
    counterWeight: number;
    healerBonus: number;
    lowestHpBonus: number;
    objectiveBonus: number;
    dangerPerAttacker: number;
    supportHealBelowPercent: number;
    selfHealBelowPercent: number;
  };
}

export interface GameData {
  balance: Balance;
  classes: Record<string, ClassDef>;
  chars: Record<string, CharDef>;
  items: Record<string, ItemDef>;
  skills: Record<string, SkillDef>;
  affixes: Record<string, AffixDef>;
  runes: Record<string, RuneDef>;
  sets: Record<string, SetDef>;
  terrain: Record<string, TerrainDef>;
  maps: Record<string, MapDef>;
  dialogues: Record<string, DialogueDef>;
  campaign: CampaignDef;
}
