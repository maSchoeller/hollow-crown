/** Story definitions as the rules core sees them: conditions and effects, supports, lieutenants, chronicle, flags, scenes, campaign nodes, home rooms and the campaign. */
import type { FlagValue, HomeKind, ItemRef, Mechanic, Pos, Stance, StatMods, SupportRank } from './defs';

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
