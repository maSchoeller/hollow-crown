import type { Effect, EquipSlot, FlagValue, HauntVariant, HomeKind, Stance, SupportRank } from '../defs';
import type { Command } from '../battle/commands';
import type { BattleState, CampaignState } from '../state';
import type { BattleResult } from './campaign';
import type { RestartScope } from './restart';

/**
 * Effects of a dialogue answer given during a battle. They wait in the battle session and run with
 * `finishMission` (victory only); `at` = number of battle commands applied when the dialogue fired, so a
 * restart that keeps the first `keep` commands keeps exactly the entries with `at <= keep`.
 */
export interface QueuedEffects {
  at: number;
  effects: Effect[];
}

/**
 * Commands are the only way to change a campaign between battles (concept/24-architecture §5.2).
 * Plain JSON: every applied command goes into the journal, start state + journal replays the campaign.
 */
export type CampaignCommand =
  | { type: 'buy'; item: string }
  | { type: 'buyOffer'; uid: string }
  | { type: 'sell'; uid: string }
  | { type: 'equip'; unit: string; uid: string; slot: EquipSlot | 'bag' }
  | { type: 'unequip'; uid: string }
  | { type: 'upgrade'; uid: string }
  | { type: 'reroll'; uid: string; index: number }
  | { type: 'insertRune'; item: string; rune: string }
  | { type: 'removeRune'; item: string; index: number }
  | { type: 'mergeRunes'; rune: string }
  | { type: 'healScar'; unit: string; index: number; herb?: boolean }
  | { type: 'unlockSupport'; pair: string }
  | { type: 'setLoadout'; unit: string; skills: string[] }
  | { type: 'promote'; unit: string; classId: string }
  /** hire the tavern's mercenary `offer` (a record id `merc<n>` of `c.tavern`) */
  | { type: 'hire'; offer: string }
  /** let go of the hired mercenary `unit` (a record id `merc<n>` of `c.roster`); his gear goes to the convoy (story 3.7: the way out of an over-full company) */
  | { type: 'dismiss'; unit: string }
  /** the player saw scene `scene` to the end or skipped it (a record, not story state; idempotent) */
  | { type: 'markSceneSeen'; scene: string }
  /** the answer `option` to choice line `line` of scene `scene`: runs its effects, counts its stance (story 4.6) */
  | { type: 'choose'; scene: string; line: string; option: string }
  /** effects of content (dialogue answers, rewards); the only way effects ever run */
  | { type: 'effects'; effects: Effect[] }
  /**
   * a won or lost battle: start snapshot + full command log, replayed by the handler; `effects` are the dialogue
   * effects queued during the battle (absent in older journals): applied in order before the result on a
   * victory, dropped on a defeat
   */
  | { type: 'finishMission'; start: BattleState; commands: Command[]; effects?: QueuedEffects[] }
  /**
   * Restart the running battle at the start of the round / of the mission (the app replays the kept part of its log,
   * so downs and deaths are undone too). The battle lives in the app session; the command carries only what the rules
   * need: the node and, for the round, how many commands are kept. Classic: `restartTurn` never.
   */
  | { type: 'restartTurn'; node: string; keep: number }
  /**
   * Classic only allows it after a defeat and does not trust the app: `lost` (start + log) is replayed to check.
   * Standard and Casual leave it out.
   */
  | { type: 'restartMission'; node: string; lost?: { start: BattleState; commands: Command[] } }
  /**
   * A new day began (story 5.4): `day` is the app's day number (local date, change at `balance.day.resetHour`). The core
   * never reads a clock; it only counts forwards (architecture §5.6, ADR-2).
   */
  | { type: 'advanceDay'; day: number }
  /** the backup reminder of act `act` was shown (exported or put off); once per act, after its finale (story 7.3, AR21; idempotent) */
  | { type: 'markBackupReminded'; act: number };

export type CampaignError =
  | 'not_enough_gold'
  | 'not_enough_materials'
  | 'unknown_item'
  | 'unknown_unit'
  | 'unknown_class'
  | 'max_level'
  | 'not_upgradable'
  | 'not_for_sale'
  | 'cannot_equip'
  | 'bag_full'
  | 'no_slot'
  | 'not_available'
  | 'convoy_full'
  /** the company is at its limit (companions or mercenaries) */
  | 'army_full'
  | 'node_unavailable'
  /** the death mode does not allow this restart (Classic: round never, mission only after a defeat) */
  | 'restart_forbidden'
  /** an effect refers to something that cannot take it (undeclared flag or value, fallen companion ...) */
  | 'effect_invalid'
  /** scene, choice line or answer does not exist */
  | 'unknown_choice'
  /** this choice was answered before: answers are never taken back */
  | 'already_chosen'
  /** the effect's state or rules do not exist yet (priceMod, villageAid) */
  | 'effect_unsupported'
  /** a day number that is no whole number of days */
  | 'invalid_day';

/** What changed, for hints and banners in the UI (narrative: consequences are always shown). */
export type CampaignEvent =
  | { t: 'goldChanged'; delta: number; gold: number }
  | { t: 'materialChanged'; id: string; delta: number }
  | { t: 'itemGained'; uid: string; def: string }
  | { t: 'itemLost'; uid: string; def: string }
  | { t: 'itemChanged'; uid: string }
  | { t: 'equipped'; unit: string; uid: string; slot: EquipSlot | 'bag' }
  | { t: 'unitChanged'; unit: string }
  | { t: 'promoted'; unit: string; classId: string }
  | { t: 'supportUnlocked'; pair: string; rank: SupportRank }
  | { t: 'flagSet'; flag: string; value: FlagValue }
  | { t: 'unitJoined'; unit: string }
  /** a lieutenant joined the company (effect `recruit: { lt }`, story 3.7); reported instead of `unitJoined` */
  | { t: 'companionJoined'; unit: string }
  | { t: 'unitLeft'; unit: string }
  | { t: 'stanceGained'; stance: Stance }
  | { t: 'chronicleAdded'; page: string }
  /** the company moved (effect `setHome`); the rooms keep their levels */
  | { t: 'homeChanged'; home: HomeKind }
  /** a side quest became available (effect `openQuest`) */
  | { t: 'questOpened'; node: string }
  | { t: 'sceneSeen'; scene: string }
  /** an answer was given; `decision` = the choice is one of the decisions with consequences */
  | { t: 'choiceMade'; scene: string; line: string; option: string; decision: boolean }
  | { t: 'missionFinished'; result: BattleResult }
  /** a battle restart was accepted: keep the first `keep` commands of the log and replay them from `start` */
  | { t: 'battleRestarted'; scope: RestartScope; keep: number }
  /** the day moved on; `packets` = days that brought a day packet, `haunts` = haunts they made (story 5.5) */
  | { t: 'dayAdvanced'; day: number; packets: number[]; haunts: number }
  /** a haunt arose on a known map (story 5.5) */
  | { t: 'hauntSpawned'; id: string; map: string; variant: HauntVariant; lt: string }
  /** an open haunt lapsed because more than `balance.haunt.maxOpen` were open (story 5.5) */
  | { t: 'hauntExpired'; id: string }
  /** the grudge of a lieutenant changed (effect `grudge`); `grudge` = the new value */
  | { t: 'grudgeChanged'; lt: string; grudge: number }
  /** the backup reminder of an act was noted (story 7.3) */
  | { t: 'backupReminded'; act: number };

export interface CampaignApplyResult {
  campaign: CampaignState;
  events: CampaignEvent[];
}
