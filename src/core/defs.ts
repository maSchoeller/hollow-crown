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
  /** lieutenant id (Epic 3): flees at 0 HP and counts like a boss for EP */
  lieutenant?: string;
  nameKey?: string;
  sprite?: string;
  portrait?: string;
  items: ItemRef[];
  drops?: number[];
  ai?: AiDef;
  quote?: string;
  recruit?: { by: string[] | 'any'; dialogue?: string };
  ignoreForRout?: boolean;
  /** no foe ever targets this unit (children in the camp of mission 1-5, Story 9.6): not by the AI, not by attacks or damaging items */
  untargetable?: boolean;
  /** unit only appears on these difficulties (default: all) */
  difficulty?: Difficulty[];
  /**
   * unit only appears when all these conditions hold against the campaign at the creation of the battle (story 9.5; only
   * for the line-up `units` of a map, not for reinforcements, trigger spawns or lieutenants)
   */
  requires?: Condition[];
}

export interface AiDef {
  profile: 'aggressive' | 'hold' | 'guard' | 'trigger' | 'hunt' | 'raider' | 'flee' | 'support' | 'follow';
  radius?: number;
  then?: AiDef['profile'];
  /** `trigger` on `defend`/`survive`: the round the unit wakes by itself (default: `ai.sleeperWakePercent` of the mission's rounds) */
  wakeTurn?: number;
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
  /** chronicle page found with it (story 9.11); it reaches the campaign as the effect `{ chronicle }` when the mission is won */
  chronicle?: string;
}

export type ObjectiveDef =
  | { type: 'rout' }
  | { type: 'boss'; unit: string }
  | { type: 'reach'; unit?: string; area: Area }
  | { type: 'seize'; area: Area }
  | { type: 'defend'; unit: string; turns: number }
  | { type: 'survive'; turns: number }
  | { type: 'escape'; area: Area; min?: number }
  /** story 4.8: the third-party NPC `unit` (AI profile `follow`) walks into `area` and leaves the map there; it joins the company after the mission unless `join` is false. Its fall loses the mission. */
  | { type: 'escort'; unit: string; area: Area; join?: boolean }
  /** story 4.8: every chest of `chests` (object ids) is open within `turns` rounds (won up to the last player phase of round `turns`, lost at the start of the next) */
  | { type: 'treasure'; chests: string[]; turns: number };

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
  /** `onBoard`: plays only while this unit still stands on the map (a lieutenant's call must not come from one who has left) */
  | { action: 'dialogue'; id: string; onBoard?: string }
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
  /** act of the content folder the map lives in (`acts/actN/maps/`, set by the loader); picks the board's season */
  act: number;
  nameKey: string;
  size: [number, number];
  fog: boolean;
  /** tutorial map: downed player units never bleed out or die (except those whose death loses the battle); see `deathless` */
  noDeath?: boolean;
  legend: Record<string, string>;
  terrain: string;
  /** ambient light of the 3D board; with `timeOfDay` each field overrides the preset, without it a missing field is the plain default */
  ambient?: { color?: string; intensity?: number };
  lights?: Array<{ at: Pos; color: string; radius: number }>;
  /** directional light of the 3D board (render only, D7); compass bearing the light comes from, elevation above the horizon; each field alone may override the preset */
  sun?: { color?: string; intensity?: number; azimuthDeg?: number; elevationDeg?: number };
  /** story 8.6: light preset of the time of day (content/core/render.yaml look.timeOfDay); absent: the map's own light, exactly as before */
  timeOfDay?: TimeOfDay;
  /** story 8.6: weather (look.weather says which acts have which); absent = clear */
  weather?: Weather;
  objects: MapObjectDef[];
  initialEffects: Array<{ effect: 'burning'; tiles: Pos[]; turns: number }>;
  deploy: { max: number; forced: string[]; slots: Pos[] };
  units: MapUnitDef[];
  pairs: Array<{ a: string; b: string; rank: SupportRank }>;
  reinforcements: ReinforcementDef[];
  objectives: { victory: ObjectiveDef; defeat: DefeatDef[]; side: SideObjectiveDef[] };
  triggers: TriggerDef[];
  goldReward: number;
  /** haunt anchors (story 5.5, architecture §5.6): at most one per variant; maps without any are never haunted */
  haunts?: HauntAnchor[];
  music?: string;
  devNote?: string;
  /** model of a prop variant for single fields (`board.variants` of render.yaml names the allowed models), overriding the hash pick */
  propVariants?: Array<{ at: Pos; model: string }>;
}

/** The kinds of haunt (story 5.5): a repeat task on a known map against a lieutenant. */
export const HAUNT_VARIANTS = ['boss', 'rout', 'defend', 'escort', 'treasure'] as const;
export type HauntVariant = (typeof HAUNT_VARIANTS)[number];

/**
 * Where and how a map can be haunted (story 5.5, `haunts:` in the map file). `target.at` = tile of the lieutenant (boss, rout,
 * treasure), of the civilian (defend) or the civilian's start (escort). `deploy` and `enemySpawn` are areas; `max` = places
 * (default `deploy.max` of the map). `turns` is required for defend and treasure and optional for escort, `exit` and `chests`
 * belong to escort and treasure only.
 */
export interface HauntAnchor {
  variant: HauntVariant;
  target: { at: Pos };
  enemySpawn: Area;
  deploy: Area;
  max?: number;
  turns?: number;
  exit?: Area;
  chests?: Pos[];
}

/** One enemy type of a faction in a haunt pool (`acts/actN/haunts.yaml`): `share` is its part in percent, the shares of a faction add up to 100. */
export interface HauntEnemyType {
  class: string;
  sprite: string;
  nameKey: string;
  /** equipment tier of the act: the items the enemy carries */
  items: ItemRef[];
  share: number;
}

/** A treasure chest's content in a haunt: gold or an item (each chest takes one entry). */
export interface HauntChestLoot {
  gold?: number;
  item?: ItemRef;
}

/**
 * The enemies of the haunts of an act (story 5.5): a pool per faction of the act's lieutenants, the generic civilian for
 * defend and escort and the content of the chests of treasure. Starting values [C].
 */
export interface HauntPoolsDef {
  /** act of the file's folder (derived by the loader) */
  act: number;
  /** faction (`LieutenantDef.faction`) -> its enemy types */
  factions: Record<string, HauntEnemyType[]>;
  /** the person to defend or escort: a map unit of team `other` */
  civilian: { class: string; sprite?: string; portrait?: string; nameKey: string };
  chestLoot: HauntChestLoot[];
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
  | { meet: { lt: string } }
  | { gold: number }
  | { material: Record<string, number> }
  | { item: ItemRef }
  | { priceMod: { pct: number; act: number } }
  | { villageAid: { act: number } }
  | { openQuest: string }
  | { stance: Stance }
  | { chronicle: string }
  | { setHome: HomeKind };

/** Entry of the flag register `acts/actN/flags.yaml` (architecture §5.9); content may only use declared flags. */
/** A fixed support pair (story 4.9): the two companions, whether it is one of the core pairs that reach S, the talk per rank. */
export interface SupportPairDef {
  /** `pairKey(a, b)` */
  key: string;
  pair: [string, string];
  core: boolean;
  /** scene of the campfire talk that unlocks each rank */
  talks: Partial<Record<SupportRank, string>>;
}

/**
 * An enemy lieutenant of an act (story 3.1, `acts/actN/lieutenants.yaml`): comes back until he is beaten for good.
 * Texts: name `nameKey`, title `titleKey`, faction `faction.<faction>.name`; lines in the scene `scene` (`scn.lt.<id>`).
 */
export interface LieutenantDef {
  id: string;
  /** act of the file's folder (derived by the loader) */
  act: number;
  nameKey: string;
  /** character image id (art/mockups/characters-s1/<id>.png) */
  portrait: string;
  /** figure of the board (art/models/units/<model>.glb); a map unit takes it as `sprite` */
  model: string;
  class: string;
  /** free label without a register; display name `faction.<faction>.name` */
  faction: string;
  signatureItem: string;
  /** skills of the grudge steps 1, 2, 3 (source `grudge`); only content until story 3.4 unlocks them */
  grudgeSkills: [string, string, string];
  /** title for the profile card (story 3.6) */
  titleKey: string;
  /** scene with the lines, `scn.lt.<id>` */
  scene: string;
  /** can change sides (story 3.7); the scene then also holds the line `join` */
  joins?: boolean;
}

/** A chronicle page: found through the effect `chronicle`, read in the chronicle; texts `chronicle.<id>.title|text`. */
export interface ChroniclePageDef {
  id: string;
  act: number;
  title: string;
  text: string;
}

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
  /** title of the consequence card of a decision (`dlg.<scene>.<line>.<option>.summary`) */
  summary?: string;
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
  /** illustration panel from this line on (background id; replaces the scene background full-screen), `none` ends it; a panel stands for at most `MAX_PANEL_LINES` text lines */
  panel?: string;
  /**
   * `reward`: the moment of the node's reward (story 9.9): sparks rise over the line, and when the player goes on, the card with the items
   * the won node gave (`BattleResult.effects`) opens. The line is shown as it is when the scene has no reward to show.
   */
  moment?: 'reward';
  requires?: Condition[];
  /** extra line (key `….memorial`) after this one when the first figure of the chain has fallen */
  memorial?: { speaker: string[]; text: string; mood: Mood };
}

export interface SceneChoice {
  id: string;
  /** a choice with a title is a decision (marked, two taps, consequence card, chronicle): `dlg.<scene>.<line>.title` */
  title?: string;
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
  /** story mission (counts for `storyCount`, act structure) or side quest */
  kind: 'story' | 'side';
  /** `first`: the act's opening mission, alone available until it is done; `finale`: opens after all other story nodes */
  fixed?: 'first' | 'finale';
  /** conditions under which the node is available (a side quest also opens through the effect `openQuest`) */
  requires?: Condition[];
  /** when this holds (the quest's trigger has fallen …), `memorial` replaces the node's scenes */
  memorialIf?: Condition;
  memorial?: { pre?: string; post?: string };
  /** place image shown while the mission loads: a location (`locations/<place>`); default: the camp on the road */
  place?: string;
  merchantTier: number;
  /** expected effective army level when the node starts (GDD Figurensystem); never falls within an act */
  expectedLevel: number;
  /** items handed to company members when the node is won (e.g. the avatar's first tome) */
  grants?: Array<{ unit: string; item: ItemRef }>;
  /** effects applied when the node is won (node reward, architecture §5.3), e.g. `recruit`; never on a defeat */
  effects?: Effect[];
  /** like `effects`, but each group only when its conditions hold after the battle (e.g. a battle flag was not set) */
  effectsIf?: Array<{ requires: Condition[]; effects: Effect[] }>;
}

/**
 * A room of the home (camp station or castle room, architecture §5.10). Name and description come from the
 * locales (`room.<id>.name|desc`). A station is listed when its act has been reached and shown open when `requires`
 * holds, otherwise locked with the first condition that fails as the reason.
 */
export interface RoomDef {
  id: string;
  /** what the room does; the UI opens the matching panel */
  function: 'convoy' | 'merchant' | 'smith' | 'healer' | 'tavern' | 'campfire' | 'memorial' | 'enchanter';
  /** line icon of the room stone (icons.tsx) */
  icon: string;
  /** first act in which the room exists */
  fromAct: number;
  /** homes the room belongs to */
  homes: HomeKind[];
  requires: Condition[];
  /** what the next levels need, level 2 first (story 6.9): the build rules come with Epic 10; empty = no build-up */
  levels: RoomLevelDef[];
  /** things inside the room that open later (e.g. the lessons of the memorial hall) */
  unlocks: RoomUnlockDef[];
}

/** Conditions of one build-up step of a room (level 2 and 3). */
export interface RoomLevelDef {
  requires: Condition[];
}

/** Something a room opens once its conditions hold; the name is `room.<room>.unlock.<id>`. */
export interface RoomUnlockDef {
  id: string;
  requires: Condition[];
}

/** An anchor on the picture of a home: the room stone sits at `at` (percent of the visible picture). */
export interface HomeAnchorDef {
  room: string;
  at: Pos;
}

/** Picture and room anchors of a kind of home (`content/home/home.yaml`, story 6.9). */
export interface HomeViewDef {
  /** place image `locations/<image>` */
  image: string;
  anchors: HomeAnchorDef[];
}

/**
 * A fixed memorial stone of the act (`acts/actN/memorials.yaml`, story 6.9): a figure the story has taken before
 * anyone of the company fell. Texts `memorial.<id>.name|place|role|quote` (German in the file, English in the locale file).
 */
export interface MemorialDef {
  id: string;
  act: number;
  /** head image (`art/mockups/characters-s1/<portrait>.png`) */
  portrait: string;
  name: string;
  place: string;
  role: string;
  quote?: string;
  /** the stone stands once these hold */
  requires: Condition[];
}

export interface CampaignDef {
  /** act number of this campaign file (`content/acts/actN/campaign.yaml`) */
  act: number;
  /** place image of a node without its own `place` (`locations/<defaultPlace>.webp`) */
  defaultPlace: string;
  nodes: CampaignNodeDef[];
  /** mechanic → completed story missions of the act from which it applies; unlisted mechanics are always on */
  mechanics: Partial<Record<Mechanic, number>>;
  /** where the company lives at the start of the act (`setHome` later switches camp → castle); rooms: `content/core/rooms.yaml` */
  home: HomeKind;
  /** highest level in this act; EP above it are forfeited (falls back to `balance.levels.max`) */
  levelCap?: number;
  startGold: number;
  startConvoy: ItemRef[];
  /** `storyCount`: the tier also opens once that many story missions of the act are done, whichever they are (besides the `merchantTier` of the nodes) */
  merchant: Array<{ tier: number; items: string[]; storyCount?: number }>;
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
    /** highest rank the campfire unlocks, by its level (index 0 = level 1) */
    campfireMaxRank: SupportRank[];
    /** fixed pairs of the season, and how many of them are core pairs that reach S */
    seasonPairs: number;
    corePairs: number;
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
  /** the day change (story 5.4): new day at this local hour, at most `catchUp` day packets for days away */
  day: { resetHour: number; catchUp: number };
  /** haunts (story 5.5): how many appear, how many stay open, how many foes; the reward values are for story 5.6 */
  haunt: {
    /** haunts per day packet */
    perDay: { min: number; max: number };
    /** more than this open: the oldest one lapses */
    maxOpen: number;
    /** foes = places + this, the lieutenant included (easy -1, hard +1 as on story maps) */
    extraEnemies: number;
    /** reward in percent of the story map: gold, experience */
    goldPct: number;
    expPct: number;
    /** experience in percent when the company is above the map's expected level */
    catchUpExpPct: number;
    /** from the n-th haunt cleared since the last story mission the reward is halved */
    halveFromNth: number;
    /** material of the act (`lieutenant.bounty.materialByAct`) per cleared haunt, an amount from min to max */
    material: { min: number; max: number };
    /** the enemies of a haunt wait (profile `trigger`) until the company comes this close, then attack; the lieutenant has his own radius (story maps use 3-5) */
    triggerRadius: { enemy: number; lieutenant: number };
  };
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
  /** loading of on-demand files before a mission, and the retry pause of the act packs (story 7.2) */
  loading: { fetchTimeoutMs: number; packRetryBaseMs: number; packRetryMaxMs: number };
  /** the chronicle (story 4.7): pages of the whole season (narrative: 4 per act) */
  chronicle: {
    seasonPages: number;
    /** entries the chronicle shows once their story flag is set; they are no pages and do not count towards `seasonPages` (story 9.8) */
    sealed: Array<{ flag: string; act: number }>;
  };
  /** farewell card after a death (story 6.7): the button stays locked this long */
  farewell: { lockMs: number };
  /** targets of the chained act simulation (story 6.8, `pnpm sim --campaign`): NFR12 corridors, GDD gold curve */
  simulation: {
    /** the army level is the average effective level of this many strongest units */
    armySize: number;
    /** army level further than this from a node's `expectedLevel` is marked */
    levelTolerance: number;
    corridors: Record<Difficulty, { winMin?: number; winMax?: number; downsMin?: number; downsMax?: number }>;
    /** gold per story mission without side objectives [min, max]: by node id, else by act; side objectives' gold as share of the map reward */
    gold: { perNode: Record<string, [number, number]>; perAct: Record<string, [number, number]>; sideShare: [number, number] };
  };
  /** Nebel (story 2.6): `baseVision` plus the highest of `roleBonus` (class role) and `moveTypeBonus`; sight ends behind `blockers` terrain */
  fog: { baseVision: number; roleBonus: Record<string, number>; moveTypeBonus: Partial<Record<MoveType, number>>; blockers: string[] };
  rally: { radius: number; damage: number; hit: number };
  /** numbers of the class actions: Zielen, Fernbergen, Anfeuern (story 2.3) and the AI's detour limit around hold zones (story 2.4) */
  classActions: {
    aim: { rangeBonus: number; hit: number };
    farRescue: { range: number };
    cheer: { mov: number; hit: number };
    hold: { detourMax: number };
    /** Wirken (story 2.5): radius around the target that water puts out, rounds wind lifts fog */
    cast: { waterRadius: number; fogDuration: number };
  };
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
    /** effect `villageAid` (E1): extra charges of every healing potion (`use.heal`) until the end of the act */
    villageAid: { healCharges: number };
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
    /** score bonus for the grudge target of a lieutenant (story 3.3) */
    grudgeTargetBonus: number;
    /** Wirken of enemy elementalists (story 2.5) */
    castMinTargets: number;
    castWallDetour: number;
    castLethalChance: number;
    /** profile `follow` (story 4.8): wakes when a player unit is this close and stays this close to one while it walks */
    followRadius: number;
    /** profile `follow`: path cost of a tile that a foe threatens (per foe), so it is avoided unless nothing else leads on */
    followDanger: number;
    /** `defend` and `survive`: a sleeping `trigger` unit wakes by itself after this share (percent) of the mission's rounds, rounded up */
    sleeperWakePercent: number;
    wardGuardRadius: number;
    /** simulator player for `defend`: widest line (tiles) it holds in front of the ward; wider than this it crowds the ward instead */
    wardLineMax: number;
    rescueMaxDanger: number;
  };
  /** strength, bounty and signature drop of the lieutenants (stories 3.4, 3.5) */
  lieutenant: {
    /** the grudge goes from 0 to `max` (GDD: 3); one grudge skill and one `grudge_<n>` line per step */
    grudge: { max: number };
    scaling: {
      /** how many of the company's strongest units set the level of a lieutenant (GDD: 6) */
      armySize: number;
      /** weapon tier chain: item id -> the next tier in the same group; a weapon not listed stays (the cap) */
      tierUp: Record<string, string>;
    };
    bounty: {
      /** gold per grudge level: `goldPerLevel x (grudge before the rout + 1)` */
      goldPerLevel: number;
      /** material of the act per rout, an amount from min to max */
      materials: { min: number; max: number };
      /** act number (as text) -> material id */
      materialByAct: Record<string, string>;
    };
    signature: {
      /** chance per rout (0-1) */
      chance: number;
      /** the rout (counted after this one) at which the item falls for sure, when it has not fallen yet */
      guaranteedRout: number;
    };
  };
}

export interface PropVariant {
  model: string;
  weight: number;
}

/** Look of the board's legibility aids (render.yaml `legibility`, epic 13); lengths in tiles unless named px. */
export interface LegibilityDef {
  /** story 13.1: cream crosses at the tile corners (subtle) or thin lines round every tile (strong) */
  grid: { color: string; subtle: { alpha: number; arm: number; width: number }; strong: { alpha: number; width: number } };
  /** story 13.2: single range tiles with a gap and round corners, and the shared outer edge (cream below the line) */
  range: { gap: number; corner: number; move: { color: string; alpha: number }; attack: { color: string; alpha: number }; heal: { color: string; alpha: number }; cream: string; edge: { cream: number; line: number } };
  /** story 13.2: the path arrow */
  path: { color: string; cream: string; width: number; outline: number; head: number; headLength: number };
  /** story 13.5: danger tiers 1 / 2 / 3+, edge, dashed edge of sleeping foes, edge of one watched foe */
  threat: {
    color: string;
    alpha: [number, number, number];
    edge: { cream: number; line: number };
    sleeping: { color: string; width: number; dash: number; gap: number };
    watch: { color: string; cream: number; line: number };
  };
  /** story 13.6: the foes that reach the chosen field glow in this colour at this strength (0–1) */
  reach: { color: string; strength: number };
  /** story 13.3: HP bar over the head */
  hpBar: { tick: number; tickWide: number; wideFrom: number; critical: number; widthTiles: number; minPx: number; maxPx: number; heightPx: number; lift: number };
  /** story 13.9: the whole-map zoom step */
  view: { wholeMapMargin: number };
  doubleTapMs: number;
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
    /** goal marking: tiles of margin round the marked fields when the camera brings them into view */
    markFrameMargin: number;
  };
  /** pace of the enemy and third-party phases at speed 1x, milliseconds (the speed settings divide it) */
  aiPace: {
    /** one tile of a foe's walk (the player's own units take 140) */
    stepMs: number;
    /** the acting foe pulses this long before it moves or strikes */
    focusMs: number;
    /** pause on the new tile after a foe's walk */
    afterMoveMs: number;
    /** pause after a foe's strike before the next action */
    afterStrikeMs: number;
  };
  board: {
    /** scenery tiles around the map (D10) and how much it is darkened */
    skirt: number;
    skirtDim: number;
    waterLevel: number;
    /** depth of the diorama's bottom below ground level, tiles */
    baseDepth: number;
    /** water animation: ms per texture frame */
    waterFrameMs: number;
    lightsMax: Record<'high' | 'mid' | 'low', number>;
    /** on the low quality level, scenery props only this many tiles around the map */
    sceneryPropsLow: number;
    /** the scenery around the map uses only the first n models of each variant class (every model costs draw calls as a template of its own) */
    sceneryVariants: number;
    /** low decoration on free grass/plain tiles: chance per tile on the map and in the scenery around it, model `<prop>_<state>`, size range */
    decor: Record<'bushes' | 'stones', { model: string; map: number; scenery: number; scale: [number, number] }>;
    /**
     * prop variants (weighted `<prop>_<state>`, chosen by a field hash, see render/shared/scenery.ts): house (building), lodge (visitable
     * house, state appended), rock; tree per act (an act without an entry uses act 1)
     */
    variants: { house: PropVariant[]; lodge: PropVariant[]; rock: PropVariant[]; tree: Record<string, PropVariant[]> };
    /** stand-in model while a model is not built yet (the manifest does not know it) */
    propFallback: Record<string, string>;
    /** goal marking: how long the markings of a side objective stay (ms) */
    markMs: number;
    /** frame rate caps while something moves and at rest */
    fpsActive: number;
    fpsIdle: number;
    /** story 7.7: figures doing nothing update their skeleton this often (Hz); acting ones at the frame rate */
    idleHz: number;
    /** story 7.8: figures with a baked animation file (`.vat`, image-to-3D) play it as vertex animation instead of a skeleton; false: skeleton path for all */
    vat: boolean;
    /** story 7.8: how much the board warms up at load: 0 = precompile only, 1 = + flash/fade variants and prop twins, 2 = + a warm-up draw */
    warm: 0 | 1 | 2;
    /** Story 7.8: tint (flash/fade) materials kept per texture and case for reuse */
    tintPool: number;
    /** story 7.7: the board waits at most this long (ms) for the shaders to compile at load */
    precompileMs: number;
    /** size of 3D figures relative to their Blender scale */
    figureScale: number;
    /** story 8.10: props hiding at least `cover` tiles of a figure turn see-through at `alpha`; `figureWidth` = half width of a figure in tiles */
    fade: { alpha: number; cover: number; figureWidth: number };
  };
  /** story 8.6: team colours, light by time of day, weather, season per act and the timing of the strike effects */
  look: LookDef;
  /** GA9: weapon model per equipped weapon group / off-hand item weapon group, hung on a figure's hand socket */
  gear: { weapons: Partial<Record<WeaponType, GearPiece>>; offHand: Partial<Record<WeaponGroup, GearPiece>> };
  /** epic 13: grid, range tiles, path arrow, danger tiers, target-tile lines, HP bars, whole-map view, double tap */
  legibility: LegibilityDef;
  quality: Record<'high' | 'mid' | 'low', { maxDpr: number; shadowMap: number }>;
  /** shared asset cache of the render host (story 5.1): unused models and textures kept for the next scene */
  assets: { keepUnused: number };
  /** the flat world map (story 5.2): zoom of the picture and the camera glide */
  worldMap: {
    /** width of the picture as a multiple of the screen width: overview, near */
    zoomSteps: number[];
    zoomMs: number;
    /** how much closer the map goes on a chosen place */
    focusZoom: number;
  };
}

/** Light of a time of day or a season: colour, strength and (sun) the direction. */
export interface TimeOfDayDef {
  ambient: { color: string; intensity: number };
  sun: { color: string; intensity: number; azimuthDeg: number; elevationDeg: number };
  /** background colour of the scene (sky beyond the landscape) */
  sky: string;
  /** a figure is never darker than this share of its noon rendering (art-direction §2.5); the landscape may be */
  figureFloor: number;
  /** rim light on figures; strength 0 = off */
  rim: { color: string; strength: number };
  /** factor on the strength of point lights (torches, fires, windows) */
  pointBoost: number;
}

/** Weather: acts it may appear in (content:check), grade of light and sky, and the parts that make it. */
export interface WeatherDef {
  acts: number[];
  /** `ambientScale` multiplies the ambient strength; the sky takes the hue of `sky` at `skyMix`, keeping the brightness of the time of day */
  grade?: { ambientScale: number; sky: string; skyMix: number };
  /** falling particles per quality level (low 0) */
  particles?: { high: number; mid: number; low: number; fallSpeed: number; size: number; length?: number; color: string; alpha: number; emberShare?: number };
  /** wet shine of the ground: specular strength and power of the terrain materials */
  wet?: { specular: number; power: number };
  puddles?: { count: number; alpha: number; color: string };
  /** scene mist (kept on `low`): linear fog from `near` to `far` tiles of depth around the camera target */
  mist?: { color: string; near: number; far: number };
  /** drifting fog layers just above the blocks (not on `low`) */
  ground?: { layers: number; height: number; alpha: number; driftSpeed: number; color: string };
}

export interface LookDef {
  /** marking of the places of a side objective: light ring with a dark outline (unlit, never ember orange nor a team colour) */
  marker: { color: string; outline: string; alpha: number; pulse: number; radius: number; width: number; outlineWidth: number; chevronHeight: number; chevronSize: number; bobTiles: number };
  /** team colours (art-direction §2.1): `ui` = ring and marking colour, `ramp` = cloth dark → light (K0..K3) */
  teams: Record<Team, { ui: string; ramp: [string, string, string, string] }>;
  /** brightness of a figure at noon that the floors of `timeOfDay[..].figureFloor` refer to (share of its albedo) */
  figureReference: number;
  /** grey of the neutral texture under the team cloth of image-to-3D figures (tools/art/prepare_tripo_unit.py) */
  clothGrey: number;
  /** ramp step the cloth key K0..K3 of a figure is drawn in (K2 of image-to-3D figures -> K1, the UI colour) */
  clothSteps: [number, number, number, number];
  timeOfDay: Record<TimeOfDay, TimeOfDayDef>;
  weather: Record<Weather, WeatherDef>;
  /** season per act (art-direction §2.4), above every time of day: tint of light and sky, offset of the sun's height */
  season: Record<string, { tint: string; strength: number; sunElevationOffsetDeg: number }>;
  fx: {
    /** critical hit (story 8.6): times in ms at 1x, counted from the start of the attack */
    crit: { cutInInMs: number; cutInHoldMs: number; cutInOutMs: number; freezeMs: number; shakeMs: number; shake: number; recoilMs: number; returnMs: number; settleMs: number; numberScale: number };
    /** death in ash */
    death: { ashMs: number; fadeMs: number; rise: number; shakeMs: number; shake: number; flakes: Record<'high' | 'mid' | 'low', number>; embers: number; colour: string; emberColour: string };
    /** status icon over a figure: fade in/out ms and the size in CSS px */
    status: { fadeMs: number; sizePx: number; feet: Record<string, string> };
  };
}

/** A place on the flat world map: a stone for a campaign node (or the home) on the painted picture. */
export interface WorldPlace {
  /** slot of the plan: `prologue`, `m1_1` … `m3_8`, `n1` … `n10`, `home` */
  id: string;
  /** short text on the stone: P, 1-1, N1 */
  label: string;
  act: number;
  kind: 'story' | 'side' | 'home';
  /** position in percent of the picture's width and height */
  at: [number, number];
  /** campaign node placed here; a slot without a node is planned for a later act */
  node?: string;
}

/** The flat world map of Valmora (content/world/valmora.yaml, story 5.2). */
export interface WorldDef {
  id: string;
  /** painted picture, `public/assets/world/<image>.webp` */
  image: string;
  /** pixel size of the picture (its aspect ratio) */
  size: [number, number];
  /** regions with the place of their name; the region of a later act than the current one lies under fog */
  regions: Array<{ id: string; act: number; at: [number, number] }>;
  /** the region of `act` ends at `y` percent of the height: the fog of an earlier act reaches down to there */
  fog: Array<{ act: number; y: number }>;
  places: WorldPlace[];
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
  /** fixed support pairs of the acts by `pairKey` (`acts/actN/supports.yaml`) */
  supports: Record<string, SupportPairDef>;
  /** chronicle pages of the acts (`acts/actN/chronicle.yaml`) */
  chronicle: Record<string, ChroniclePageDef>;
  /** fixed memorial stones of the acts (`acts/actN/memorials.yaml`) */
  memorials: Record<string, MemorialDef>;
  /** picture and room anchors per kind of home (`content/home/home.yaml`) */
  home: Record<HomeKind, HomeViewDef>;
  campaign: CampaignDef;
  world: WorldDef;
  /** enemy lieutenants of the acts (`acts/actN/lieutenants.yaml`, story 3.1) */
  lieutenants: Record<string, LieutenantDef>;
  /** enemy pools of the haunts by act (`acts/actN/haunts.yaml`, story 5.5) */
  hauntPools: Record<number, HauntPoolsDef>;
}
