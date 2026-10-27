import { STAT_KEYS, type GameData, type Pos, type StatMods, type Stats } from '../defs';
import type { BattleState, BattleUnit, UnitRecord } from '../state';
import { armorAffinity, itemStatMods, itemWeight } from './items';
import { setBonuses, skillTotals, type SkillCtx, type SkillTotals } from './skills';

export interface EffectiveStats {
  stats: Stats;
  maxHp: number;
  mov: number;
  carry: number;
  load: number;
  overload: number;
  /** attack speed = SPD − overload */
  as: number;
  hit: number;
  avoid: number;
  crit: number;
  affinity?: ReturnType<typeof armorAffinity>;
  skills: SkillTotals;
}

const isBattleUnit = (u: UnitRecord | BattleUnit): u is BattleUnit => 'uid' in u && 'hp' in u;

export function addMods(target: StatMods, mods: StatMods | undefined, factor = 1): void {
  if (!mods) return;
  for (const [k, v] of Object.entries(mods)) {
    const key = k as keyof StatMods;
    target[key] = (target[key] ?? 0) + (v ?? 0) * factor;
  }
}

/**
 * Effective values = base + equipment + upgrades + affixes + sets + skills + scars + status + buffs
 * (concept/04 §1). Pure function, used by UI, preview and resolution alike.
 */
export function computeStats(
  data: GameData,
  unit: UnitRecord | BattleUnit,
  ctx: Omit<SkillCtx, 'unit'> = {},
  phase: 'stats' | 'combat_attack' | 'combat_defend' = 'stats',
): EffectiveStats {
  const b = data.balance;
  const cls = data.classes[unit.classId]!;
  const mods: StatMods = {};
  let hit = 0;
  let avoid = 0;
  let crit = 0;
  for (const inst of Object.values(unit.equip)) {
    if (!inst) continue;
    const m = itemStatMods(data, inst);
    hit += m.hit ?? 0;
    avoid += m.avoid ?? 0;
    crit += m.crit ?? 0;
    const { hit: _h, avoid: _a, crit: _c, ...rest } = m;
    addMods(mods, rest);
  }
  for (const sb of setBonuses(data, unit)) addMods(mods, sb.stats);
  for (const scarId of unit.scars) {
    const scar = data.campaign.scars.find((s) => s.id === scarId);
    if (!scar) continue;
    const { hit: h, crit: c, avoid: a, ...rest } = scar.mods;
    hit += h ?? 0;
    crit += c ?? 0;
    avoid += a ?? 0;
    addMods(mods, rest);
  }
  if (unit.grief && unit.grief > 0) hit -= b.supports.griefHitPenalty;

  // first pass without skills to get max HP for HP-based skill conditions
  const baseMaxHp = unit.stats.hp + (mods.hp ?? 0);
  const skills = skillTotals(data, { ...ctx, unit, maxHp: baseMaxHp }, phase);
  addMods(mods, skills.stats);
  hit += skills.hit;
  avoid += skills.avoid;
  crit += skills.crit;

  let movMod = mods.mov ?? 0;
  if (isBattleUnit(unit)) {
    for (const st of unit.status) {
      if (st.id === 'wet') mods.spd = (mods.spd ?? 0) - b.status.wetSpdPenalty;
      if (st.id === 'slowed') movMod -= b.status.slowMovPenalty;
    }
    for (const buff of unit.buffs) {
      hit += buff.hit ?? 0;
      movMod += buff.mov ?? 0;
    }
  }
  const stats = {} as Stats;
  for (const k of STAT_KEYS) stats[k] = Math.max(0, unit.stats[k] + (mods[k] ?? 0));
  const carry = stats.str + b.weight.carryBonus[cls.moveType];
  let load = 0;
  for (const inst of Object.values(unit.equip)) if (inst) load += itemWeight(data, inst, ctx.state);
  const overload = Math.max(0, load - carry);
  let movPenalty = 0;
  for (const p of b.weight.movPenalty) if (overload >= p.overload) movPenalty = Math.max(movPenalty, p.mov);
  const mov = Math.max(0, cls.mov + movMod - movPenalty);
  return {
    stats,
    maxHp: stats.hp,
    mov,
    carry,
    load,
    overload,
    as: stats.spd - overload,
    hit,
    avoid,
    crit,
    affinity: armorAffinity(data, unit, ctx.state) ?? unit.affinity,
    skills,
  };
}

export function maxHp(data: GameData, unit: UnitRecord | BattleUnit): number {
  return computeStats(data, unit).maxHp;
}

export function statsAt(data: GameData, s: BattleState, unit: BattleUnit, pos?: Pos): EffectiveStats {
  return computeStats(data, unit, { state: s, pos: pos ?? unit.pos });
}
