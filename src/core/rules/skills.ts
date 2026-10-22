import type { GameData, Pos, SkillCondition, SkillDef, StatMods, StatKey } from '../defs';
import type { BattleState, BattleUnit, UnitRecord } from '../state';
import { active, dist, isAlly, neighbors, samePos, terrainAt, unitAt } from '../util';
import type { WeaponProfile } from './items';
import { itemDef } from './items';

/** Skills granted by an equipped set (count thresholds). */
export function setBonuses(data: GameData, unit: UnitRecord) {
  const counts: Record<string, number> = {};
  for (const inst of Object.values(unit.equip)) {
    if (!inst) continue;
    const setId = itemDef(data, inst).setId;
    if (setId) counts[setId] = (counts[setId] ?? 0) + 1;
  }
  const out: Array<NonNullable<GameData['sets'][string]>['bonuses'][number]['mods']> = [];
  for (const [setId, n] of Object.entries(counts)) {
    const set = data.sets[setId];
    if (!set) continue;
    for (const b of set.bonuses) if (n >= b.count) out.push(b.mods);
  }
  return out;
}

/** All skill ids currently active on a unit: personal, class, equipped item skills, loadout, set skills. */
export function activeSkillIds(data: GameData, unit: UnitRecord): string[] {
  const ids = new Set<string>();
  if (unit.personalSkill) ids.add(unit.personalSkill);
  const cls = data.classes[unit.classId];
  if (cls?.skill) ids.add(cls.skill);
  for (const inst of Object.values(unit.equip)) {
    if (!inst) continue;
    const g = itemDef(data, inst).grantsSkill;
    if (g) ids.add(g.skill);
  }
  for (const s of unit.loadout) if (unit.mastered.includes(s)) ids.add(s);
  for (const m of setBonuses(data, unit)) if (m.grantSkill) ids.add(m.grantSkill);
  return [...ids].filter((id) => !!data.skills[id]);
}

export interface SkillCtx {
  state?: BattleState;
  unit: UnitRecord | BattleUnit;
  pos?: Pos | null;
  opponent?: BattleUnit;
  distance?: number;
  initiator?: boolean;
  ownWeapon?: WeaponProfile;
  opponentWeapon?: WeaponProfile;
  opponentEffective?: boolean;
  maxHp?: number;
}

const isBattleUnit = (u: UnitRecord | BattleUnit): u is BattleUnit => 'uid' in u && 'hp' in u;

export function conditionMet(data: GameData, c: SkillCondition | undefined, ctx: SkillCtx): boolean {
  if (!c) return true;
  const s = ctx.state;
  const u = ctx.unit;
  const bu = isBattleUnit(u) ? u : undefined;
  const pos = ctx.pos ?? bu?.pos ?? null;
  if (c.notMovedThisTurn !== undefined) {
    if (!bu || bu.moved === c.notMovedThisTurn) return false;
  }
  if (c.adjacentAllies !== undefined) {
    if (!s || !bu || !pos) return false;
    const n = neighbors(pos).filter((p) => {
      const o = unitAt(s, p);
      return o && o.uid !== bu.uid && active(o) && isAlly(o.team, bu.team);
    }).length;
    if (n < c.adjacentAllies) return false;
  }
  if (c.distanceAtLeast !== undefined && (ctx.distance ?? 0) < c.distanceAtLeast) return false;
  if (c.hpBelowPercent !== undefined) {
    if (!bu || !ctx.maxHp) return false;
    if ((bu.hp * 100) / ctx.maxHp >= c.hpBelowPercent) return false;
  }
  if (c.hpAbove !== undefined && (!bu || bu.hp <= c.hpAbove)) return false;
  if (c.adjacentTo !== undefined) {
    if (!s || !bu || !pos) return false;
    const ok = neighbors(pos).some((p) => {
      const o = unitAt(s, p);
      return o && active(o) && (o.charId === c.adjacentTo || o.id === c.adjacentTo) && isAlly(o.team, bu.team);
    });
    if (!ok) return false;
  }
  if (c.enemyLevelHigher && (!ctx.opponent || effectiveLevel(data, ctx.opponent) <= effectiveLevel(data, u)))
    return false;
  if (c.selfOnTerrain !== undefined && (!s || !pos || terrainAt(s, pos) !== c.selfOnTerrain)) return false;
  if (c.attackerDamageType !== undefined && ctx.opponentWeapon?.damageType !== c.attackerDamageType) return false;
  if (c.alliesAdjacentToTarget !== undefined) {
    if (!s || !bu || !ctx.opponent?.pos) return false;
    const n = neighbors(ctx.opponent.pos).filter((p) => {
      const o = unitAt(s, p);
      return o && active(o) && isAlly(o.team, bu.team) && !samePos(p, pos);
    }).length;
    if (n < c.alliesAdjacentToTarget) return false;
  }
  if (c.initiator !== undefined && !!ctx.initiator !== c.initiator) return false;
  if (c.targetStatus !== undefined && !ctx.opponent?.status.some((x) => x.id === c.targetStatus)) return false;
  if (c.targetTag !== undefined) {
    const tags = ctx.opponent ? (data.classes[ctx.opponent.classId]?.tags ?? []) : [];
    if (!tags.includes(c.targetTag)) return false;
  }
  if (c.weaponType !== undefined && ctx.ownWeapon?.weaponType !== c.weaponType) return false;
  if (c.attackerNoElement && ctx.opponentWeapon?.element) return false;
  if (c.notEffective && ctx.opponentEffective) return false;
  return true;
}

export function effectiveLevel(data: GameData, u: UnitRecord): number {
  const cls = data.classes[u.classId];
  return u.level + (cls?.tier === 'advanced' ? data.balance.experience.advancedLevelOffset : 0);
}

export interface SkillTotals {
  stats: StatMods;
  hit: number;
  avoid: number;
  crit: number;
  damage: number;
  /** multiplicative, 100 = unchanged */
  damageTakenPercent: number;
  statusChance: number;
  healBonus: number;
  rangeBonus: number;
  strikeFirst: boolean;
  moveThroughEnemies: boolean;
  terrainCost: Record<string, number>;
  procs: Array<{ skill: string; chance: number; effect: SkillDef['effect'] }>;
  /** skills that contributed (for UI) */
  used: string[];
}

export type SkillPhase = 'stats' | 'combat_attack' | 'combat_defend';

/**
 * Sums the effects of all active skills whose trigger and condition apply.
 * 'stats' = only passive skills (stat screen); combat phases add on_attack/on_defend/on_hit.
 */
export function skillTotals(data: GameData, ctx: SkillCtx, phase: SkillPhase): SkillTotals {
  const t: SkillTotals = {
    stats: {},
    hit: 0,
    avoid: 0,
    crit: 0,
    damage: 0,
    damageTakenPercent: 100,
    statusChance: 0,
    healBonus: 0,
    rangeBonus: 0,
    strikeFirst: false,
    moveThroughEnemies: false,
    terrainCost: {},
    procs: [],
    used: [],
  };
  for (const id of activeSkillIds(data, ctx.unit)) {
    const sk = data.skills[id]!;
    const trig = sk.trigger;
    const applies =
      trig === 'passive' ||
      (phase === 'combat_attack' && (trig === 'on_attack' || trig === 'on_hit')) ||
      (phase === 'combat_defend' && (trig === 'on_defend' || trig === 'on_hit')) ||
      ((phase === 'combat_attack' || phase === 'combat_defend') && trig === 'on_lethal');
    if (!applies) continue;
    if (!conditionMet(data, sk.condition, ctx)) continue;
    const e = sk.effect;
    if (sk.chanceFrom) {
      const stat = ctx.unit.stats[sk.chanceFrom as StatKey] ?? 0;
      t.procs.push({ skill: id, chance: Math.floor(stat / (sk.chanceDivisor ?? 1)), effect: e });
      continue;
    }
    for (const [k, v] of Object.entries(e.stats ?? {})) {
      const key = k as keyof StatMods;
      t.stats[key] = (t.stats[key] ?? 0) + (v ?? 0);
    }
    t.hit += e.hitBonus ?? 0;
    t.avoid += e.avoidBonus ?? 0;
    t.crit += e.critBonus ?? 0;
    t.damage += e.damageBonus ?? 0;
    if (e.damageTakenPercent !== undefined) t.damageTakenPercent = (t.damageTakenPercent * e.damageTakenPercent) / 100;
    t.statusChance += e.statusChanceBonus ?? 0;
    t.healBonus += e.healBonus ?? 0;
    t.rangeBonus += e.rangeBonus ?? 0;
    if (e.strikeFirst) t.strikeFirst = true;
    if (e.moveThroughEnemies) t.moveThroughEnemies = true;
    if (e.terrainCost) Object.assign(t.terrainCost, e.terrainCost);
    if (
      e.stats ||
      e.hitBonus ||
      e.avoidBonus ||
      e.critBonus ||
      e.damageBonus ||
      e.damageTakenPercent !== undefined ||
      e.strikeFirst
    )
      t.used.push(id);
  }
  return t;
}

export const distance = dist;
