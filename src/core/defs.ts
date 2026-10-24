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
export type ItemSlot = 'mainHand' | 'offHand' | 'head' | 'body' | 'accessory' | 'bag';
export type EquipSlot = 'mainHand' | 'offHand' | 'head' | 'body' | 'accessory1' | 'accessory2';
export const EQUIP_SLOTS: readonly EquipSlot[] = ['mainHand', 'offHand', 'head', 'body', 'accessory1', 'accessory2'];
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Difficulty = 'easy' | 'normal' | 'hard';
/** Rules that the campaign introduces step by step (campaign.yaml `mechanics`). */
export type Mechanic = 'triangle' | 'magic' | 'elements' | 'supports';
export type DeathMode = 'classic' | 'standard' | 'casual';
export type SupportRank = 'C' | 'B' | 'A' | 'S';
export const SUPPORT_RANKS: readonly SupportRank[] = ['C', 'B', 'A', 'S'];
/** Value of a story flag in `CampaignState.flags` (architecture §5.9); `true` = plainly set. */
export type FlagValue = string | number | true;
/** The avatar's stance profile counters (architecture §5.9); a tie is decided warm > sober > defiant. */
export type Stance = 'warm' | 'sober' | 'defiant';
export const STANCES: readonly Stance[] = ['warm', 'sober', 'defiant'];
export type HomeKind = 'camp' | 'castle';
/** Companions the story never lets join or leave (the schema forbids `recruit`/`leave` for them). */
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

export type TerrainSurface = 'grass' | 'dirt' | 'road' | 'sand' | 'ash' | 'stone' | 'riverbed';
export type TerrainCliff = 'earth' | 'rock' | 'wall';

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
  /** 3D board (render only, concept/01-decisions.md D3/D6): top height in tiles, ground texture, side wall, water plane */
  height: number;
  surface: TerrainSurface;
  cliff: TerrainCliff;
  water: boolean;
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
  /** unit only appears on these difficulties (default: all) */
  difficulty?: Difficulty[];
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
  /** directional light of the 3D board (render only, D7); compass bearing the light comes from, elevation above the horizon */
  sun?: { color: string; intensity: number; azimuthDeg: number; elevationDeg: number };
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

/**
 * One condition language for every "if" in content (architecture §5.3): an object with exactly one key.
 * A list of conditions means AND. Evaluation never changes anything (`campaign/conditions.ts`).
 */
export type Condition =
  | { flag: string | Record<string, FlagValue> }
  | { alive: string }
  | { dead: string }
  | { left: string }
  | { completed: string }
  | { storyCount: { min?: number; max?: number } }
  | { act: number }
  | { support: { pair: [string, string]; rank: SupportRank } }
  | { stance: Stance }
  | { met: string }
  | { chronicle: { min: number } | string[] }
  | { any: Condition[] }
  | { not: Condition };

/** One "then" of content (architecture §5.3): an object with exactly one key; runs only inside a campaign command. */
export type Effect =
  | { setFlag: string | Record<string, FlagValue> }
  | { recruit: string | { lt: string } }
  | { leave: string }
  | { grudge: { lt: string; delta: number } }
  | { gold: number }
  | { material: Record<string, number> }
  | { item: ItemRef }
  | { priceMod: { pct: number; act: number } }
  | { villageAid: true }
  | { openQuest: string }
  | { stance: Stance }
  | { chronicle: string }
  | { setHome: HomeKind };

/** Entry of the flag register `acts/actN/flags.yaml` (architecture §5.9); content may only use declared flags. */
export interface FlagDef {
  id: string;
  kind: 'decision' | 'story' | 'quest' | 'battle';
  /** allowed values; none = a plain on/off flag */
  values?: Array<string | number>;
  season2?: boolean;
}

/** Moods a scene line may carry (architecture §5.8). */
export type Mood = 'neutral' | 'happy' | 'angry' | 'sad';
export const MOODS: readonly Mood[] = ['neutral', 'happy', 'angry', 'sad'];

/** One answer of a scene choice; its text key is `dlg.<scene>.<line>.<id>`. */
export interface SceneOption {
  id: string;
  text: string;
  stance: Stance;
  effects?: Effect[];
}

/** A spoken line (or narration without `speaker`); its text key is `dlg.<scene>.<line>`. */
export interface SceneSpeech {
  id: string;
  /** replacement chain: the first companion still with the company speaks; avatar and kael always are */
  speaker?: string[];
  /** `skip` = the line vanishes when nobody of the chain is left (allowed instead of ending the chain with avatar/kael) */
  fallback?: 'skip';
  mood: Mood;
  text: string;
  requires?: Condition[];
  /** extra line (key `….memorial`) after this one when the first figure of the chain has fallen */
  memorial?: { speaker: string[]; text: string; mood: Mood };
}

export interface SceneChoice {
  id: string;
  choice: SceneOption[];
  requires?: Condition[];
}

export type SceneLine = SceneSpeech | SceneChoice;

export interface SceneDef {
  id: string;
  background?: string;
  music?: string;
  lines: SceneLine[];
}

export interface CampaignNodeDef {
  id: string;
  map: string;
  titleKey: string;
  pre?: string;
  post?: string;
  next: string[];
  pos: Pos;
  /** place image shown while the mission loads (`locations/<place>`); default: the camp on the road */
  place?: string;
  merchantTier: number;
  /** expected effective army level when the node starts (GDD Figurensystem); never falls within an act */
  expectedLevel: number;
  /** items handed to company members when the node is won (e.g. the avatar's first tome) */
  grants?: Array<{ unit: string; item: ItemRef }>;
}

/**
 * A room of the home (camp station or castle room, architecture §5.10). Name and description come from the
 * locales (`room.<id>.name|desc`). A station is listed when its act has been reached and shown open when `requires`
 * holds, otherwise locked with the first condition that fails as the reason.
 */
export interface RoomDef {
  id: string;
  /** what the room does; the UI opens the matching panel */
  function: 'convoy' | 'merchant' | 'smith' | 'healer' | 'tavern' | 'campfire' | 'enchanter';
  /** line icon of the room stone (icons.tsx) */
  icon: string;
  /** first act in which the room exists */
  fromAct: number;
  /** homes the room belongs to */
  homes: HomeKind[];
  requires: Condition[];
}

export interface CampaignDef {
  /** act number of this campaign file (`content/acts/actN/campaign.yaml`) */
  act: number;
  /** place image of a node without its own `place` (`locations/<defaultPlace>.webp`) */
  defaultPlace: string;
  nodes: CampaignNodeDef[];
  /** mechanic → first node where it applies; earlier nodes play without it. Unlisted mechanics are always on. */
  mechanics: Partial<Record<Mechanic, string>>;
  /** where the company lives at the start of the act (`setHome` later switches camp → castle); rooms: `content/core/rooms.yaml` */
  home: HomeKind;
  /** position of the home on the world map, percent of width and height */
  homePos: Pos;
  start: string;
  startGold: number;
  startConvoy: ItemRef[];
  merchant: Array<{ tier: number; items: string[] }>;
  supportPairs: Array<[string, string]>;
  supportDialogues: Record<string, Partial<Record<SupportRank, string>>>;
  scars: Array<{ id: string; mods: StatMods & { hit?: number; crit?: number; avoid?: number } }>;
}

/** What the tavern offers (`balance.yaml` economy.tavern): hireable classes with their kit, names, level spread. */
export interface TavernDef {
  /** an offer's level lies between the expected level of the next mission minus `levelSpread` and that level */
  levelSpread: number;
  /** name keys of generated mercenaries (locales) */
  names: string[];
  classes: Array<{ class: string; items: string[]; requires?: Condition[] }>;
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
  death: { scarsUntilInstantDeath: number; bleedOutTurns: number };
  /** timing and size of scenes and speech bubbles (story 4.5) */
  scene: {
    /** auto mode: pause after a line is shown, plus `autoPerCharMs` per character */
    autoBaseMs: number;
    autoPerCharMs: number;
    /** typewriter: characters shown per tick */
    typeCharsPerTick: number;
    typeTickMs: number;
    /** speech bubble: how long it stays in auto mode */
    bubbleAutoMs: number;
    /** speech bubble: characters per page (two lines) */
    bubbleMaxChars: number;
  };
  /** loading of on-demand files before a mission */
  loading: { fetchTimeoutMs: number };
  fog: { baseVision: number; visionBonus: Record<string, number> };
  rally: { radius: number; damage: number; hit: number };
  /** numbers of the active class actions (story 2.3): Zielen, Fernbergen, Anfeuern */
  classActions: { aim: { rangeBonus: number; hit: number }; farRescue: { range: number }; cheer: { mov: number; hit: number } };
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
    /** mercenaries on top of the `armyLimit` companions (GDD: 20 + 6) */
    mercenaryLimit: number;
    /** highest upgrade the smith reaches per room level (index 0 = level 1, the camp) */
    smithMaxUpgrade: number[];
    /** smith level from which affixes can be rerolled */
    rerollFromSmithLevel: number;
    tavern: TavernDef;
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

/** Presentation values of the battle board (content/render.yaml); never read by the rules. */
export interface RenderDef {
  camera: {
    /** tilt away from straight down, degrees (D2) */
    tiltDeg: number;
    /** share of the free view the map may be pushed past its edge (D10) */
    margin: number;
    /** visible columns on the shorter screen side, near → overview (D9) */
    zoomSteps: number[];
    zoomMs: number;
  };
  board: {
    /** scenery tiles around the map (D10) and how much it is darkened */
    skirt: number;
    skirtDim: number;
    waterLevel: number;
    /** depth of the diorama's bottom below ground level, tiles */
    baseDepth: number;
    lightsMax: Record<'high' | 'mid' | 'low', number>;
    /** on the low quality level, scenery props only this many tiles around the map */
    sceneryPropsLow: number;
    /** frame rate caps while something moves and at rest */
    fpsActive: number;
    fpsIdle: number;
    /** size of 3D figures relative to their Blender scale */
    figureScale: number;
  };
  /** GA9: weapon model per equipped weapon group / off-hand item kind, hung on a figure's hand socket */
  gear: { weapons: Partial<Record<WeaponType, GearPiece>>; offHand: Partial<Record<ItemDef['kind'], GearPiece>> };
  quality: Record<'high' | 'mid' | 'low', { maxDpr: number; shadowMap: number }>;
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

export interface GameData {
  balance: Balance;
  render: RenderDef;
  classes: Record<string, ClassDef>;
  chars: Record<string, CharDef>;
  items: Record<string, ItemDef>;
  skills: Record<string, SkillDef>;
  affixes: Record<string, AffixDef>;
  runes: Record<string, RuneDef>;
  sets: Record<string, SetDef>;
  /** home rooms in display order (`content/core/rooms.yaml`) */
  rooms: Record<string, RoomDef>;
  terrain: Record<string, TerrainDef>;
  maps: Record<string, MapDef>;
  scenes: Record<string, SceneDef>;
  /** flag register of the acts */
  flags: Record<string, FlagDef>;
  campaign: CampaignDef;
}
