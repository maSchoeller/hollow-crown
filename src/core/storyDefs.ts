/** Story definitions as the rules core sees them: conditions and effects, supports, lieutenants, chronicle, flags, scenes, campaign nodes, home rooms and the campaign. */
import type { FlagValue, HomeKind, ItemRef, Mechanic, Pos, Stance, StatMods, SupportRank } from './defs';

export type Condition =
  | { flag: string | Record<string, FlagValue> }
  | { alive: string }
  | { dead: string }
  | { left: string }
  /**
   * the companion has ever been in the company: in the roster, fallen or gone. `not: { recruited: x }` is the case
   * „never spoken to, never joined“, which `any: [alive, dead]` does not cover (QA act 2, 2026-11-13).
   */
  | { recruited: string }
  | { completed: string }
  | { storyCount: { min?: number; max?: number } }
  | { act: number }
  /** the castle has reached at least this tier (0 ruin … 3 fortress; story 15.12) */
  | { castleTier: number }
  /** a room of the current home stands on a level within these bounds; 0 = not in this home or not yet open by act (story 11.16) */
  | { roomLevel: { id: string; min?: number; max?: number } }
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
  /** replacement chain: the first companion still with the company speaks; avatar and lucan always are */
  speaker?: string[];
  /** `skip` = the line vanishes when nobody of the chain is left (allowed instead of ending the chain with avatar/lucan) */
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
  /**
   * scenes after `post` (story 11.17, the way back): played in order before the result screen, each only when its conditions hold
   * once the scenes before it have ended (answers given there count); never after a haunt
   */
  epilogues?: Array<{ scene: string; requires?: Condition[] }>;
  /** place image shown while the mission loads: a location (`locations/<place>`); default: the camp on the road */
  place?: string;
  merchantTier: number;
  /**
   * expected effective army level when the node starts (GDD Figurensystem); never falls within an act. Required in an act without
   * `positionLevel`; read it through `nodeLevel` (story 11.2), never directly
   */
  expectedLevel?: number;
  /** story 11.2: added to the position level of an act with `positionLevel` (e.g. a side quest that is meant to be harder) */
  levelBonus?: number;
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
  function: 'convoy' | 'merchant' | 'smith' | 'healer' | 'tavern' | 'campfire' | 'memorial' | 'enchanter' | 'academy' | 'workshop' | 'training';
  /** line icon of the room stone (icons.tsx) */
  icon: string;
  /** first act in which the room exists */
  fromAct: number;
  /** homes the room belongs to */
  homes: HomeKind[];
  requires: Condition[];
  /** cost and conditions of the next levels, level 2 first (stories 6.9 and 10.1, command `buildRoom`); empty = no build-up */
  levels: RoomLevelDef[];
  /** things inside the room that open later (e.g. the lessons of the memorial hall) */
  unlocks: RoomUnlockDef[];
}

/** Cost and conditions of one build-up step of a room (level 2 and 3, story 10.1). */
export interface RoomLevelDef {
  cost: { gold: number };
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
  /** the lesson this stone passes on (story 10.7, a skill of `heritage.yaml`) */
  heritage?: string;
  /** the stone stands once these hold */
  requires: Condition[];
}

/** A scene that plays once at home (story 11.23, `campaign.yaml` homeScenes). */
export interface HomeSceneDef {
  scene: string;
  home?: HomeKind;
  requires: Condition[];
  effects: Effect[];
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
  /**
   * story 11.23: scenes that play once at home (`pendingHomeScene`), in file order: in the home `home` (any when absent), once
   * `requires` holds and the scene has not been seen; `effects` run when it ends (e.g. `setFlag: chronicle_read`)
   */
  homeScenes: HomeSceneDef[];
  /** highest level in this act; EP above it are forfeited (falls back to `balance.levels.max`) */
  levelCap?: number;
  /**
   * story 11.2: the level of a node of this act is its position, not a field of the node: P = `base` + story nodes of the act done +
   * the node's `levelBonus` (`nodeLevel`); acts without it (act 1) read `expectedLevel`
   */
  positionLevel?: { base: number };
  startGold: number;
  startConvoy: ItemRef[];
  /** `storyCount`: the tier also opens once that many story missions of the act are done, whichever they are (besides the `merchantTier` of the nodes) */
  /** `roomLevel` (story 10.9): the list is on sale only from this merchant level on (default 1) */
  merchant: Array<{ tier: number; items: string[]; storyCount?: number; roomLevel?: number }>;
  scars: Array<{ id: string; mods: StatMods & { hit?: number; crit?: number; avoid?: number } }>;
}

/** What the tavern offers (`balance.yaml` economy.tavern): hireable classes with their kit, names, level spread. */
export interface TavernDef {
  /** offers per round by tavern level (index = level - 1, story 10.1): `tavernOfferCount` */
  offersByLevel: number[];
  /** story 10.11: the tavern level from which a wished-for role can be set (`c.tavernWish`) */
  wishRoleFromLevel: number;
  /** an offer's level lies between the expected level of the next mission minus `levelSpread` and that level */
  levelSpread: number;
  /** story 10.12: how many traits one offer gets, [min, max] (both ends possible, equally likely) */
  traitCount: [number, number];
  /** story 10.12: chance in percent that a trait place is drawn from the good traits, by tavern level (index = level - 1) */
  goodTraitChanceByLevel: number[];
  /** name keys of generated mercenaries (locales) */
  names: string[];
  classes: Array<{ class: string; items: string[]; requires?: Condition[] }>;
}
