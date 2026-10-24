import type {
  AiDef,
  DeathMode,
  Difficulty,
  Element,
  EquipSlot,
  FlagValue,
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
}

export interface AvatarSettings {
  name: string;
  pronoun: 'she' | 'he' | 'they';
  portrait: string;
  affinity: Element;
}

export interface CampaignState {
  version: number;
  seed: number;
  rng: RngState;
  settings: BattleSettings;
  avatar: AvatarSettings;
  roster: UnitRecord[];
  fallen: Array<{ id: string; nameKey: string; name?: string; node: string }>;
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
  completed: string[];
  /** node ids available on the world map */
  available: string[];
  supports: Record<string, SupportState>;
  nextUid: number;
  /** merchant special offers for the current chapter */
  offers: ItemInstance[];
}

export type MapLookup = (id: string) => MapDef;
