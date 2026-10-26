import type {
  AiDef,
  DeathMode,
  Difficulty,
  Element,
  EquipSlot,
  FlagValue,
  HauntVariant,
  HomeKind,
  ItemRef,
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
  /** movement cost of this phase's walk (set by every move; only meaningful while `moved`): Nachsetzen counts it off MOV */
  moveSpent?: number;
  downed: boolean;
  /** own phases spent downed (Standard: bleeds out at `balance.death.bleedOutTurns`) */
  bleed: number;
  /** left the map: rescued, escaped, retreated (casual) or dead */
  gone?: 'rescued' | 'escaped' | 'retreated' | 'dead' | 'fled';
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
  /** uid of the unit that drove a lieutenant off (`gone: 'fled'`); set by story 3.2 */
  fledBy?: string;
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
  /** level before the first EXP of this battle counted; lets the result show the level-up of units that joined mid-battle */
  levelAtExpStart?: number;
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
  /** the campaign node; of a haunt the story node of its map (story 5.6) */
  nodeId: string;
  /** set when the battle is a haunt (story 5.6): its id in `c.haunts` */
  hauntId?: string;
  /** haunt only: the expected army level of the next story mission; units above it earn a part of the haunt EP (`haunt.catchUpExpPct`) */
  hauntLevel?: number;
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
  /**
   * Nachsetzen (story 2.4): set by the attack of a skirmisher, with the movement it has left; the next command of any kind
   * clears it. Plain JSON, so the replay needs nothing besides the command log.
   */
  pursue?: { unit: string; left: number };
  /**
   * Wirken with wind (story 2.5): fog lifted for `team` on the tiles within `radius` of `at`, `turns` more round ends;
   * Story 2.6 adds `liftedTiles(state, team)` to the team's vision. Missing = nothing lifted.
   */
  fogLifted?: Array<{ team: Team; at: Pos; radius: number; turns: number }>;
  /** core roles whose class action is not introduced yet (`lockedRoles`; missing in old saves = none locked) */
  lockedRoles?: string[];
  /**
   * How each lieutenant of the map is built (review R1): `createBattle` works it out from the campaign for every lieutenant unit
   * of the map (line-up, reinforcements, trigger spawns), so a lieutenant who arrives later is the same as one who starts on the
   * board, and `applyCommand` needs no campaign. A lieutenant missing from the plan has joined the company and does not spawn.
   * Missing in old states = build the unit as the map says.
   */
  lieutenantPlan?: Record<string, LieutenantPlan>;
  /** ids of the lieutenants the company has seen in this battle (review R2; `noteLieutenantSight`); missing = none yet */
  ltSeen?: string[];
}

/** The scaling of one lieutenant for one battle (review R1): level, tiered items, grudge skills, grudge and its target. */
export interface LieutenantPlan {
  level: number;
  items: ItemRef[];
  /** positions in `items` of the items that drop, when the map unit names drops */
  drops?: number[];
  skills: string[];
  /** set where the campaign holds a record of him */
  grudge?: number;
  target?: string;
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
   * the day change (story 5.4, architecture §5.6): `last` = the newest day number the app sent (null until the first
   * lieutenant is met, so the first meeting brings a packet at once); `pending` is unused since story 5.5 turns the packets
   * into haunts directly (kept for saves)
   */
  day: { last: number | null; pending: number[] };
  /** open haunts, oldest first (story 5.5); more than `balance.haunt.maxOpen` and the oldest lapses */
  haunts: HauntState[];
  /** map id -> variant of the haunt played there last (story 5.6 writes it; the generator avoids it) */
  hauntLast: Record<string, string>;
  /** haunts cleared since the last story mission (story 5.6: the reward halves from `balance.haunt.halveFromNth`) */
  hauntsSinceStory: number;
  /** acts whose backup reminder was shown after the finale (story 7.3, AR21): it comes once per act */
  backupReminded: number[];
  /** lieutenants the company has met (AR5; Epic 3 adds grudge, target, routs …); absent until the first meeting */
  lieutenants?: Record<string, LieutenantState>;
}

/**
 * An enemy of a haunt, made when the haunt arises and kept so that playing and replaying agree (story 5.5). The lieutenant's
 * entry holds only `lieutenant` and `at`: he is built at play time (level with grudge, kit of his class) like in `createBattle`.
 */
export interface HauntEnemy {
  at: Pos;
  /** set on the lieutenant of the haunt; then the fields below are absent */
  lieutenant?: string;
  class?: string;
  sprite?: string;
  nameKey?: string;
  level?: number;
  items?: ItemRef[];
}

/** An open haunt on a known map (story 5.5, architecture §5.6). `new` = the player has not looked at it yet. */
export interface HauntState {
  id: string;
  /** day number of the packet that made it */
  day: number;
  map: string;
  variant: HauntVariant;
  /** the lieutenant it is against */
  lt: string;
  /** expected army level when it arose */
  level: number;
  enemies: HauntEnemy[];
  new: boolean;
}

/** What the campaign knows about one lieutenant (story 3.3, architecture §5.5). */
export interface LieutenantState {
  /** the company has won a mission against him */
  met: boolean;
  /** missions won with him on the map */
  encounters: number;
  /** 0-3 notches */
  grudge: number;
  /** roster id of the unit that drove him off last; stays after that unit has fallen */
  target?: string;
  /** times he was driven off */
  routs: number;
  /** his signature item has fallen (story 3.5); it falls once per lieutenant */
  signatureDropped: boolean;
}

export type MapLookup = (id: string) => MapDef;
