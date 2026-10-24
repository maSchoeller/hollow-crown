import type { Effect, EquipSlot, FlagValue, Stance, SupportRank } from '../defs';
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
  /** the player saw scene `scene` to the end or skipped it (a record, not story state; idempotent) */
  | { type: 'markSceneSeen'; scene: string }
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
  | { type: 'restartMission'; node: string; lost?: { start: BattleState; commands: Command[] } };

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
  /** the effect's state or rules do not exist yet (grudge, priceMod, villageAid, setHome, recruit by lieutenant) */
  | 'effect_unsupported';

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
  | { t: 'unitLeft'; unit: string }
  | { t: 'stanceGained'; stance: Stance }
  | { t: 'chronicleAdded'; page: string }
  /** a side quest became available (effect `openQuest`) */
  | { t: 'questOpened'; node: string }
  | { t: 'sceneSeen'; scene: string }
  | { t: 'missionFinished'; result: BattleResult }
  /** a battle restart was accepted: keep the first `keep` commands of the log and replay them from `start` */
  | { t: 'battleRestarted'; scope: RestartScope; keep: number };

export interface CampaignApplyResult {
  campaign: CampaignState;
  events: CampaignEvent[];
}
