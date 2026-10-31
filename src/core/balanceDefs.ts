/** The balance values (content/core/balance.yaml) as the rules core sees them. */
import type { Difficulty, MoveType, Rarity, StatusId, SupportRank } from './defs';
import type { TavernDef } from './storyDefs';

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
