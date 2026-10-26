import { CoreInvariantError } from '../errors';
import { STAT_KEYS, type GameData, type StatKey, type Stats } from '../defs';
import type { GameEvent } from '../events';
import { nextFloat, type RngState } from '../rng';
import type { BattleState, BattleUnit, UnitRecord } from '../state';
import { clamp } from '../util';
import { itemDef } from './items';
import { effectiveLevel } from './skills';

export function growthRate(data: GameData, u: UnitRecord, k: StatKey): number {
  const cls = data.classes[u.classId]!;
  return u.growth[k] + (cls.growthMod[k] ?? 0);
}

/**
 * One level up with smoothed growth (concept/04 §3). Mutates the unit, returns the gains.
 */
export function levelUp(data: GameData, u: UnitRecord, rng: RngState): Partial<Stats> {
  const g = data.balance.growth;
  const cls = data.classes[u.classId]!;
  const gains: Partial<Stats> = {};
  for (const k of STAT_KEYS) {
    const rate = Math.max(0, growthRate(data, u, k));
    const sure = Math.floor(rate / 100);
    const chance = (rate % 100) / 100;
    const roll = nextFloat(rng);
    u.expected[k] += rate / 100;
    const ist = u.gained[k] + sure;
    let gain = sure;
    if (ist <= u.expected[k] - g.smoothingLower) gain += 1;
    else if (ist >= u.expected[k] + g.smoothingUpper) gain += 0;
    else if (roll < chance) gain += 1;
    const room = Math.max(0, cls.caps[k] - u.stats[k]);
    gain = Math.min(gain, room);
    if (gain > 0) {
      u.stats[k] += gain;
      u.gained[k] += gain;
      gains[k] = gain;
    }
  }
  if (g.minOneStatPerLevel && Object.keys(gains).length === 0) {
    const best = [...STAT_KEYS]
      .filter((k) => u.stats[k] < cls.caps[k])
      .sort((a, b) => growthRate(data, u, b) - growthRate(data, u, a))[0];
    if (best) {
      u.stats[best] += 1;
      u.gained[best] += 1;
      gains[best] = 1;
    }
  }
  u.level += 1;
  return gains;
}

/** Highest level of the current act (`campaign.yaml` levelCap, never above `balance.levels.max`). */
export function levelCap(data: GameData): number {
  const max = data.balance.levels.max;
  return Math.min(data.campaign.levelCap ?? max, max);
}

/**
 * Grants EXP, levelling up as often as needed. At the act's level cap further EXP are forfeited:
 * the `exp` event reports `capped` and only the EXP that still counted go into `battleExp`.
 */
export function grantExp(data: GameData, u: BattleUnit, amount: number, rng: RngState, events: GameEvent[], percent = 100): void {
  const e = data.balance.experience;
  // a haunt pays a part of the EP (story 5.6, `expPercent`); a gain that counts is never rounded down to nothing
  if (percent !== 100 && amount > 0) amount = Math.max(1, Math.round((amount * percent) / 100));
  const cap = levelCap(data);
  if (amount <= 0) return;
  const before = u.exp;
  if (u.level >= cap) {
    u.exp = 0;
    events.push({ t: 'exp', unit: u.uid, amount, before: 0, after: 0, capped: true });
    return;
  }
  const room = (cap - u.level) * e.levelUpAt - u.exp;
  const counted = Math.min(amount, room);
  u.exp += counted;
  u.levelAtExpStart ??= u.level;
  u.battleExp = (u.battleExp ?? 0) + counted;
  const ev: GameEvent = { t: 'exp', unit: u.uid, amount, before, after: Math.min(u.exp, e.levelUpAt) };
  if (counted === room) ev.capped = true;
  events.push(ev);
  while (u.exp >= e.levelUpAt && u.level < cap) {
    u.exp -= e.levelUpAt;
    const hpBefore = u.stats.hp;
    const gains = levelUp(data, u, rng);
    u.hp += u.stats.hp - hpBefore;
    events.push({ t: 'levelUp', unit: u.uid, level: u.level, gains });
  }
  if (u.level >= cap) u.exp = 0;
}

/**
 * Share of EP (percent) a unit earns in this battle: 100 on a story map; in a haunt `haunt.expPct`, and for a unit above the
 * expected army level of the next story mission only `haunt.catchUpExpPct` percent of that (story 5.6). The unit's level counts
 * as it was when the battle began, so a level gained on the way does not cut the rest.
 */
export function expPercent(data: GameData, s: Pick<BattleState, 'hauntId' | 'hauntLevel'>, u: BattleUnit): number {
  if (!s.hauntId) return 100;
  const cfg = data.balance.haunt;
  const level = effectiveLevel(data, { classId: u.classId, level: u.levelAtExpStart ?? u.level } as UnitRecord);
  return s.hauntLevel !== undefined && level > s.hauntLevel ? Math.round((cfg.expPct * cfg.catchUpExpPct) / 100) : cfg.expPct;
}

/** Lieutenants count like bosses for EP (GDD: "Boss oder Leutnant +20"). */
export function combatExp(
  data: GameData,
  u: UnitRecord,
  foe: UnitRecord & { lieutenant?: string },
  killed: boolean,
  boss: boolean,
): number {
  const e = data.balance.experience;
  const delta = effectiveLevel(data, foe) - effectiveLevel(data, u);
  if (!killed) return clamp(e.combatBase + delta, e.combatMin, e.combatMax);
  const bossLike = boss || !!foe.lieutenant;
  return clamp(e.killBase + e.killPerLevelDiff * delta, e.killMin, e.killMax) + (bossLike ? e.bossBonus : 0);
}

/** Adds skill points to every item skill of equipped items; masters skills at the cost threshold. */
export function grantSp(data: GameData, u: UnitRecord & { uid?: string }, amount: number, events: GameEvent[]): void {
  for (const inst of Object.values(u.equip)) {
    if (!inst) continue;
    const g = itemDef(data, inst).grantsSkill;
    if (!g || u.mastered.includes(g.skill)) continue;
    u.sp[g.skill] = (u.sp[g.skill] ?? 0) + amount;
    if (u.sp[g.skill]! >= g.masteryCost) {
      u.mastered.push(g.skill);
      const slots = loadoutSlots(data, u);
      if (u.loadout.length < slots) u.loadout.push(g.skill);
      events.push({ t: 'mastered', unit: u.uid ?? u.id, skill: g.skill });
    }
  }
}

export function loadoutSlots(data: GameData, u: UnitRecord): number {
  const cls = data.classes[u.classId]!;
  return cls.tier === 'pro' ? data.balance.skills.loadoutAdvanced : data.balance.skills.loadoutBase;
}

/** Pro classes a unit of `classId` can be promoted to: the role's pro paths that exist in the content. */
export function promotionTargets(data: GameData, classId: string): string[] {
  return (data.classes[classId]?.proPaths ?? []).filter((id) => !!data.classes[id]);
}

/** Class promotion with a seal (concept/04 §4). Mutates the unit. */
export function promote(data: GameData, u: UnitRecord, classId: string): Partial<Stats> {
  if (!promotionTargets(data, u.classId).includes(classId)) throw new CoreInvariantError('invalid_promotion', { from: u.classId, to: classId });
  const target = data.classes[classId]!;
  const bonus = target.promotionBonus ?? {};
  for (const k of STAT_KEYS) {
    u.stats[k] = Math.min(target.caps[k], u.stats[k] + (bonus[k] ?? 0));
  }
  u.classId = classId;
  u.level = 1;
  u.exp = 0;
  return bonus;
}
