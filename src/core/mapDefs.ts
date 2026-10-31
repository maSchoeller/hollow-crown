/** Map definitions as the rules core sees them: terrain, units, objects, objectives, triggers, reinforcements, maps and haunts. */
import type { Difficulty, ItemRef, MoveType, Pos, SupportRank, Team, TimeOfDay, WeaponType, Weather } from './defs';
import type { Condition } from './storyDefs';

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
