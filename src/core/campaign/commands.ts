import type { Effect, EquipSlot, FlagValue, Stance, SupportRank } from '../defs';
import type { Command } from '../battle/commands';
import type { BattleState, CampaignState } from '../state';
import type { BattleResult } from './campaign';

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
  /** effects of content (dialogue answers, rewards); the only way effects ever run */
  | { type: 'effects'; effects: Effect[] }
  /** a won or lost battle: start snapshot + full command log, replayed by the handler */
  | { type: 'finishMission'; start: BattleState; commands: Command[] };

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
  | 'node_unavailable'
  /** an effect refers to something that cannot take it (undeclared flag or value, fallen companion ...) */
  | 'effect_invalid'
  /** the effect's state or rules do not exist yet (grudge, priceMod, villageAid, openQuest, setHome, recruit by lieutenant) */
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
  | { t: 'missionFinished'; result: BattleResult };

export interface CampaignApplyResult {
  campaign: CampaignState;
  events: CampaignEvent[];
}
