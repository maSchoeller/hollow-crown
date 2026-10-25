import type {
  AiDef,
  DeathMode,
  Difficulty,
  Element,
  EquipSlot,
  FlagValue,
  HomeKind,
  MapDef,
  Mechanic,
  Pos,
  Stance,
  Stats,
  StatusId,
  SupportRank,
  Team,
} from './defs';
import type { RngState } from './rng';

/** One concrete item. Plain JSON. */
export interface ItemInstance {
  uid: string;
  def: string;
  upgrade: number;
  affixes: string[];
  runes: Array<string | null>;
  charges?: number;
}

/** A member of the company (persists between missions). */
export interface UnitRecord {
  id: string;
  charId?: string;
  /** custom name (avatar, generic recruits); otherwise nameKey is used */
  name?: string;
  nameKey: string;
  classId: string;
  level: number;
  exp: number;
  stats: Stats;
  growth: Stats;
  /** actual stat gains and expected (Σ growth/100) since recruitment, per stat – for smoothing */
  gained: Stats;
  expected: Stats;
  affinity?: Element;
  personalSkill?: string;
  flags: string[];
  equip: Partial<Record<EquipSlot, ItemInstance>>;
  bag: ItemInstance[];
  scars: string[];
  mastered: string[];
  loadout: string[];
  /** skill points per item skill */
  sp: Record<string, number>;
  portrait?: string;
  sprite?: string;
  /** missions left with grief penalty */
  grief?: number;
}

export interface Buff {
  source: string;
  damage?: number;
  hit?: number;
  mov?: number;
  /** buff ends when this turn's phase of `untilPhase` ends */
  untilTurn: number;
  untilPhase: Team;
}

export interface AiState extends AiDef {
  /** trigger profile became active */
  awake?: boolean;
}

export interface BattleUnit extends UnitRecord {
  uid: string;
  team: Team;
  pos: Pos | null;
  hp: number;
  acted: boolean;
  moved: boolean;
  downed: boolean;
  /** own phases spent downed (Standard: bleeds out at `balance.death.bleedOutTurns`) */
  bleed: number;
  /** left the map: rescued, escaped, retreated (casual) or dead */
  gone?: 'rescued' | 'escaped' | 'retreated' | 'dead';
  status: Array<{ id: StatusId; turns: number }>;
  buffs: Buff[];
  usedPerMap: Record<string, number>;
  freeUsed: { trade?: boolean; convoy?: boolean; swap?: boolean };
  ai?: AiState;
  boss?: boolean;
  lieutenant?: string;
  /** grudge of a lieutenant against the company, 0-3 (story 3.1: always unset; story 3.3 takes it from the campaign) */
  grudge?: number;
  /** unit id of the grudge target (story 3.3) */
  grudgeTarget?: string;
  dropUids: string[];
  quote?: string;
  recruit?: { by: string[] | 'any'; dialogue?: string };
  ignoreForRout?: boolean;
  /** generic map unit (no company record) */
  generic: boolean;
  /** unit was in the company before the battle */
  fromRoster: boolean;
  /** positioned on the map turn the unit was rescued etc. */
  startPos?: Pos;
  /** exp/levels gained this battle (result screen) */
  battleExp?: number;
  scarGained?: string;
}

export interface ObjectState {
  id: string;
  type: 'village' | 'chest' | 'door' | 'lever' | 'ballista';
  at: Pos;
  state: 'closed' | 'open' | 'visited' | 'razed';
}

export interface SupportState {
  points: number;
  /** highest rank unlocked (conversation seen) */
  rank: SupportRank | null;
}

export interface TileTimer {
  kind: 'burning' | 'rockwall';
  turns: number;
  revertTo: string;
}

export interface BattleSettings {
  difficulty: Difficulty;
  deathMode: DeathMode;
}

export interface BattleState {
  mapId: string;
  nodeId: string;
  turn: number;
  phase: Team;
  rng: RngState;
  width: number;
  height: number;
  /** current terrain id per tile (index y * width + x) */
  terrain: string[];
  timers: Record<string, TileTimer>;
  units: BattleUnit[];
  objects: ObjectState[];
  loot: Array<{ at: Pos; item: ItemInstance }>;
  firedTriggers: string[];
  reinforcementsDone: number[];
  stats: {
    villagesVisited: string[];
    chestsOpened: string[];
    downs: number;
    recruited: string[];
    bossKilledWith?: string;
  };
  outcome: 'victory' | 'defeat' | null;
  /** why the battle was lost: a unit id (a unit that had to survive fell) or 'turns' (turn limit); missing in old saves */
  defeatReason?: string;
  settings: BattleSettings;
  convoy: ItemInstance[];
  goldGained: number;
  materialsGained: Record<string, number>;
  itemsGained: ItemInstance[];
  supports: Record<string, SupportState>;
  flags: string[];
  nextUid: number;
  avatarName: string;
  /** mechanics not introduced yet at this point of the campaign (missing in old saves = none locked) */
  locked?: Mechanic[];
  /** core roles whose class action is not introduced yet (`lockedRoles`; missing in old saves = none locked) */
  lockedRoles?: string[];
}

export interface AvatarSettings {
  name: string;
  pronoun: 'she' | 'he' | 'they';
  portrait: string;
  affinity: Element;
}

/** Where the company lives: the camp of act 1 or the castle, and the level of each built room (architecture §5.10). */
export interface HomeState {
  kind: HomeKind;
  /** room id → level; a room that is not listed has level 1 (camp stations have no levels yet) */
  rooms: Record<string, number>;
}

/** A decision as the chronicle keeps it: act, scene, choice line and the chosen answer. */
export interface DecisionRecord {
  act: number;
  scene: string;
  line: string;
  option: string;
}

export interface CampaignState {
  version: number;
  seed: number;
  rng: RngState;
  settings: BattleSettings;
  avatar: AvatarSettings;
  roster: UnitRecord[];
  /** the fallen, for their memorial stones (story 6.7; mercenaries get one too) */
  fallen: Array<{ id: string; nameKey: string; name?: string; node: string; classId?: string; portrait?: string; mercenary?: true }>;
  convoy: ItemInstance[];
  gold: number;
  materials: Record<string, number>;
  /** story flags with their value (architecture §5.9) */
  flags: Record<string, FlagValue>;
  /** companions that left the company (effect `leave`) */
  left: string[];
  /** counters of the avatar's stance profile */
  stance: Record<Stance, number>;
  /** collected chronicle pages */
  chronicle: string[];
  /** every answer given: `<scene>#<line>` → option id; a choice is never asked twice (story 4.6) */
  choices: Record<string, string>;
  /** decisions in the order they were made: the chronicle's record of them (story 4.6/4.7) */
  decisions: DecisionRecord[];
  /** ids of the scenes the player has seen to the end (or skipped): a seen scene can be skipped whole (story 4.5) */
  scenesSeen: string[];
  completed: string[];
  /** side quests opened by the effect `openQuest` (the graph works out what is available: `availableNodes`) */
  quests: string[];
  /** roles a company member has brought along; a core role's class action works from then on (architecture §5.4) */
  rolesSeen: string[];
  supports: Record<string, SupportState>;
  nextUid: number;
  /** merchant special offers for the current chapter */
  offers: ItemInstance[];
  /** the company's home: `c.home = { kind: 'camp', rooms }` (story 6.3) */
  home: HomeState;
  /** mercenaries the tavern offers for the current chapter (finished company records, id `merc<n>`) */
  tavern: UnitRecord[];
  /**
   * the day change (story 5.4, architecture §5.6): `last` = the newest day number the app sent (null before the first),
   * `pending` = day packets not yet turned into haunts (the generator of story 5.5 takes them)
   */
  day: { last: number | null; pending: number[] };
  /** lieutenants the company has met (AR5; Epic 3 adds grudge, target, routs …); absent until the first meeting */
  lieutenants?: Record<string, LieutenantState>;
}

/** What the campaign knows about one lieutenant (Epic 3 extends it). */
export interface LieutenantState {
  met: boolean;
}

export type MapLookup = (id: string) => MapDef;
