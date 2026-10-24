import { CoreInvariantError } from '../errors';
import type { Element, GameData, Pos, StatusId } from '../defs';
import type { GameEvent } from '../events';
import { roll1, roll2 } from '../rng';
import type { BattleState, BattleUnit, ItemInstance } from '../state';
import { active, clamp, dist, getUnit, inBounds, pairKey, ruleOn, terrainAt, unitAt } from '../util';
import { applyStatus, extinguishTile, igniteTile, knockOut, setTerrain } from './effects';
import { itemDef, weaponProfile, type WeaponProfile } from './items';
import { moveCost, weaponRange } from './movement';
import { combatExp, grantExp, grantSp } from './progression';
import { computeStats, type EffectiveStats } from './stats';
import { adjacencyBonus, adjacentPartners, addSupportPoints, rankIndex } from './supports';
import { setBonuses } from './skills';

export interface SideForecast {
  uid: string;
  weaponUid?: string;
  canStrike: boolean;
  damage: number;
  hit: number;
  crit: number;
  strikes: number;
  effective: boolean;
  triangle: -1 | 0 | 1;
  element?: Element;
  elementMult: number;
  status: Array<{ status: StatusId; chance: number }>;
  hpBefore: number;
  maxHp: number;
  magic: boolean;
  skills: string[];
}

/** Extra numbers of the attacker for one attack (class action Zielen); the same object feeds forecast and resolution. */
export interface AttackMods {
  hit?: number;
}

export interface Forecast {
  attacker: SideForecast;
  defender: SideForecast;
  distance: number;
  /** strike order: 'a' attacker, 'd' defender */
  order: Array<'a' | 'd'>;
  tandem?: { uid: string; damage: number; hit: number };
  guard?: { uid: string; chance: number };
  /** HP after if every strike hits (no crits) */
  attackerHpAfter: number;
  defenderHpAfter: number;
}

const TRIANGLE_TYPES = ['sword', 'axe', 'lance'];

export function triangleOf(data: GameData, a?: WeaponProfile, d?: WeaponProfile): -1 | 0 | 1 {
  if (!a || !d) return 0;
  if (!TRIANGLE_TYPES.includes(a.weaponType) || !TRIANGLE_TYPES.includes(d.weaponType)) return 0;
  const beats = data.balance.triangle.beats;
  if (beats[a.weaponType] === d.weaponType) return 1;
  if (beats[d.weaponType] === a.weaponType) return -1;
  return 0;
}

/** Element multiplier of an attack element against the defender's affinity (concept/03 §6). */
export function elementMultiplier(data: GameData, el: Element | undefined, aff: Element | undefined, defTags: string[]): number {
  const e = data.balance.element;
  let m = 1;
  if (el) {
    if (aff) {
      if (el === aff) m = e.sameElement;
      else if (e.cycle[el] === aff) m = e.advantage;
      else if (e.cycle[aff] === el) m = e.disadvantage;
      else if (e.opposed.some(([x, y]) => (x === el && y === aff) || (y === el && x === aff))) m = e.advantage;
    }
    if (el === 'dark' && defTags.some((t) => e.darkBonusVs.includes(t))) m = Math.max(m, e.advantage);
  }
  return m;
}

function equippedWeapon(u: BattleUnit): ItemInstance | undefined {
  return u.equip.mainHand;
}

interface SideCalc {
  side: SideForecast;
  wp?: WeaponProfile;
  stats: EffectiveStats;
  procs: EffectiveStats['skills']['procs'];
  def: number;
  atk: number;
}

function calcSide(
  data: GameData,
  s: BattleState,
  me: BattleUnit,
  myPos: Pos,
  opp: BattleUnit,
  oppPos: Pos,
  weapon: ItemInstance | undefined,
  oppWeapon: ItemInstance | undefined,
  initiator: boolean,
  distance: number,
  extraHit = 0,
): SideCalc {
  const b = data.balance;
  const wp = weapon && itemDef(data, weapon).mt !== undefined ? weaponProfile(data, weapon) : undefined;
  const owp = oppWeapon && itemDef(data, oppWeapon).mt !== undefined ? weaponProfile(data, oppWeapon) : undefined;
  const oppTags = data.classes[opp.classId]?.tags ?? [];
  const myTags = data.classes[me.classId]?.tags ?? [];
  const effective = !!wp && wp.effectiveVs.some((t) => oppTags.includes(t));
  const oppEffective = !!owp && owp.effectiveVs.some((t) => myTags.includes(t));
  const stats = computeStats(
    data,
    me,
    { state: s, pos: myPos, opponent: opp, distance, initiator, ownWeapon: wp, opponentWeapon: owp, opponentEffective: oppEffective },
    initiator ? 'combat_attack' : 'combat_defend',
  );
  const oppStats = computeStats(
    data,
    opp,
    { state: s, pos: oppPos, opponent: me, distance, initiator: !initiator, ownWeapon: owp, opponentWeapon: wp, opponentEffective: effective },
    initiator ? 'combat_defend' : 'combat_attack',
  );
  const magic = wp?.damageType === 'magical';
  const tri = ruleOn(s, 'triangle') ? triangleOf(data, wp, owp) : 0;
  const elements = ruleOn(s, 'elements');
  const myBonus = adjacencyBonus(data, s, me, myPos);
  const oppBonus = adjacencyBonus(data, s, opp, oppPos);
  const oppFlier = data.classes[opp.classId]?.moveType === 'flier';
  const terr = inBounds(s, oppPos) ? data.terrain[terrainAt(s, oppPos)] : undefined;
  const terrDef = oppFlier ? 0 : (terr?.def ?? 0);
  const terrAvoid = oppFlier ? 0 : (terr?.avoid ?? 0);
  const buffDamage = me.buffs.reduce((t, x) => t + (x.damage ?? 0), 0);

  let damage = 0;
  let hit = 0;
  let crit = 0;
  let elementMult = 1;
  let atk = 0;
  const def = magic ? oppStats.stats.res : oppStats.stats.def + terrDef;
  if (wp) {
    const might = effective ? wp.might * b.combat.effectiveMightMultiplier : wp.might;
    const tagBonus = wp.damageVsTag.filter((x) => oppTags.includes(x.tag)).reduce((t, x) => t + x.bonus, 0);
    atk = (magic ? stats.stats.mag : stats.stats.str) + might + stats.skills.damage + buffDamage + tagBonus;
    elementMult = elements ? elementMultiplier(data, wp.element, oppStats.affinity, oppTags) : 1;
    const base = atk - def;
    const triDmg = tri * b.triangle.damage;
    let dmg = Math.floor((base + triDmg) * elementMult);
    const cap = Math.floor(Math.max(0, base) * (1 + b.element.maxBonusPercent / 100));
    if (base > 0 && dmg > cap) dmg = cap;
    dmg = Math.floor((Math.max(0, dmg) * oppStats.skills.damageTakenPercent) / 100);
    damage = Math.max(0, dmg);
    const hitRaw =
      wp.hit +
      b.combat.hitPerSkl * stats.stats.skl +
      Math.floor(stats.stats.lck / b.combat.hitPerLckDivisor) +
      tri * b.triangle.hit +
      stats.hit +
      myBonus.hit +
      extraHit;
    const avoid = b.combat.avoidPerAs * oppStats.as + oppStats.stats.lck + terrAvoid + oppStats.avoid + oppBonus.avoid;
    hit = clamp(hitRaw - avoid, 0, 100);
    const critRaw = wp.crit + Math.floor(stats.stats.skl / b.combat.critPerSklDivisor) + stats.crit + myBonus.crit;
    crit = clamp(critRaw - oppStats.stats.lck, 0, 100);
  }
  const statusChanceBonus = stats.skills.statusChance;
  const setStatus = setBonuses(data, me)
    .map((m) => m.statusChanceBonus)
    .filter((x): x is NonNullable<typeof x> => !!x);
  const status = (elements ? (wp?.statusOnHit ?? []) : []).map((x) => {
    const el = Object.entries(b.element.statusOf).find(([, st]) => st === x.status)?.[0];
    const setB = setStatus.filter((sb) => sb.element === el).reduce((t, sb) => t + sb.value, 0);
    const immune = oppStats.affinity && el === oppStats.affinity;
    return { status: x.status, chance: immune ? 0 : clamp(x.chance + statusChanceBonus + setB, 0, 100) };
  });
  return {
    side: {
      uid: me.uid,
      weaponUid: weapon?.uid,
      canStrike: false,
      damage,
      hit,
      crit,
      strikes: 0,
      effective,
      triangle: tri,
      element: wp?.element,
      elementMult,
      status,
      hpBefore: me.hp,
      maxHp: stats.maxHp,
      magic,
      skills: stats.skills.used,
    },
    wp,
    stats,
    procs: stats.skills.procs,
    def,
    atk,
  };
}

/** Best tandem partner of the attacker (rank ≥ B, adjacent, target in range) – concept/03 §8. */
function tandemPartner(data: GameData, s: BattleState, attacker: BattleUnit, aPos: Pos, defender: BattleUnit, dPos: Pos) {
  const min = rankIndex(data.balance.supports.tandemMinRank);
  let best: { uid: string; damage: number; hit: number; rank: number } | undefined;
  for (const { unit: p, rank } of adjacentPartners(s, attacker, aPos)) {
    if (rankIndex(rank) < min || !p.pos) continue;
    const w = equippedWeapon(p);
    if (!w || itemDef(data, w).mt === undefined) continue;
    const r = weaponRange(data, s, p, w.uid);
    const d = dist(p.pos, dPos);
    if (d < r[0] || d > r[1]) continue;
    const calc = calcSide(data, s, p, p.pos, defender, dPos, w, equippedWeapon(defender), true, d);
    const damage = Math.floor((calc.side.damage * data.balance.supports.tandemDamagePercent) / 100);
    const cand = { uid: p.uid, damage, hit: calc.side.hit, rank: rankIndex(rank) };
    if (!best || cand.rank > best.rank || (cand.rank === best.rank && cand.damage > best.damage)) best = cand;
  }
  return best;
}

function guardOf(data: GameData, s: BattleState, defender: BattleUnit, dPos: Pos) {
  let best: { uid: string; chance: number } | undefined;
  for (const { unit: p, rank } of adjacentPartners(s, defender, dPos)) {
    const chance = data.balance.supports.guardChance[rank];
    if (chance && (!best || chance > best.chance)) best = { uid: p.uid, chance };
  }
  return best;
}

/**
 * Exact combat forecast without RNG. The same calculation drives resolution (concept/03 §11).
 * `fromPos` lets the UI preview an attack from the ghost position.
 */
export function forecast(
  data: GameData,
  s: BattleState,
  attackerUid: string,
  defenderUid: string,
  weaponUid?: string,
  fromPos?: Pos,
  ownPhase = true,
  mods?: AttackMods,
): Forecast {
  const a = getUnit(s, attackerUid);
  const d = getUnit(s, defenderUid);
  const aPos = fromPos ?? a.pos!;
  const dPos = d.pos!;
  const distance = dist(aPos, dPos);
  const aWeapon = weaponUid ? [a.equip.mainHand, ...a.bag].find((i) => i?.uid === weaponUid) : equippedWeapon(a);
  const dWeapon = equippedWeapon(d);
  // temporarily stand on the preview tile so adjacency-based effects use it
  const savedPos = a.pos;
  a.pos = aPos;
  try {
    const ac = calcSide(data, s, a, aPos, d, dPos, aWeapon, dWeapon, true, distance, mods?.hit ?? 0);
    const dc = calcSide(data, s, d, dPos, a, aPos, dWeapon, aWeapon, false, distance);
    ac.side.canStrike = !!ac.wp;
    let dCan = !!dc.wp && !d.downed && active(d);
    if (dCan && dWeapon) {
      const r = weaponRange(data, s, d, dWeapon.uid);
      dCan = distance >= r[0] && distance <= r[1];
    }
    dc.side.canStrike = dCan;
    const th = data.balance.combat.doubleAttackThreshold;
    const aDouble = ac.stats.as >= dc.stats.as + th;
    const dDouble = dCan && dc.stats.as >= ac.stats.as + th;
    const order: Array<'a' | 'd'> = [];
    if (dCan && dc.stats.skills.strikeFirst) order.push('d', 'a');
    else {
      order.push('a');
      if (dCan) order.push('d');
    }
    if (aDouble) order.push('a');
    else if (dDouble) order.push('d');
    if (d.downed) {
      // a downed unit is finished by any hit
      ac.side.damage = Math.max(ac.side.damage, d.hp || 1);
    }
    ac.side.strikes = order.filter((x) => x === 'a').length;
    dc.side.strikes = dCan ? order.filter((x) => x === 'd').length : 0;
    const tandem = ownPhase ? tandemPartner(data, s, a, aPos, d, dPos) : undefined;
    const guard = guardOf(data, s, d, dPos);
    let aHp = a.hp;
    let dHp = d.hp;
    for (const who of order) {
      if (aHp <= 0 || dHp <= 0) break;
      if (who === 'a') dHp = Math.max(0, dHp - ac.side.damage);
      else aHp = Math.max(0, aHp - dc.side.damage);
    }
    if (tandem && aHp > 0 && dHp > 0) dHp = Math.max(0, dHp - tandem.damage);
    return {
      attacker: ac.side,
      defender: dc.side,
      distance,
      order,
      tandem: tandem ? { uid: tandem.uid, damage: tandem.damage, hit: tandem.hit } : undefined,
      guard,
      attackerHpAfter: aHp,
      defenderHpAfter: dHp,
    };
  } finally {
    a.pos = savedPos;
  }
}

/** Moves the weapon into the main hand if it sits in the bag (free weapon swap). */
export function equipWeapon(data: GameData, u: BattleUnit, weaponUid: string, events: GameEvent[]): void {
  if (u.equip.mainHand?.uid === weaponUid) return;
  const idx = u.bag.findIndex((i) => i.uid === weaponUid);
  if (idx < 0) throw new CoreInvariantError('weapon_not_carried', { weaponUid });
  const w = u.bag[idx]!;
  u.bag.splice(idx, 1);
  if (u.equip.mainHand) u.bag.push(u.equip.mainHand);
  u.equip.mainHand = w;
  if (itemDef(data, w).twoHanded && u.equip.offHand) {
    u.bag.push(u.equip.offHand);
    delete u.equip.offHand;
  }
  events.push({ t: 'equipped', unit: u.uid, item: w.uid });
}

function knockback(data: GameData, s: BattleState, attacker: BattleUnit, target: BattleUnit, events: GameEvent[]): void {
  if (!attacker.pos || !target.pos || !active(target)) return;
  const dx = Math.sign(target.pos[0] - attacker.pos[0]);
  const dy = dx !== 0 ? 0 : Math.sign(target.pos[1] - attacker.pos[1]);
  const to: Pos = [target.pos[0] + dx, target.pos[1] + dy];
  const from: Pos = [target.pos[0], target.pos[1]];
  const blocked = !inBounds(s, to) || !!unitAt(s, to) || moveCost(data, s, target, to) === null;
  if (blocked) {
    const extra = data.balance.status.knockbackBlockedDamage;
    target.hp = Math.max(0, target.hp - extra);
    events.push({ t: 'knockback', unit: target.uid, from, to: from, blocked: true });
    events.push({ t: 'damage', unit: target.uid, amount: extra, hpAfter: target.hp, cause: 'item' });
    if (target.hp <= 0) knockOut(data, s, target, events);
  } else {
    target.pos = to;
    events.push({ t: 'knockback', unit: target.uid, from, to, blocked: false });
  }
}

function applyOnHitEffects(
  data: GameData,
  s: BattleState,
  me: BattleUnit,
  opp: BattleUnit,
  side: SideForecast,
  wp: WeaponProfile | undefined,
  events: GameEvent[],
): void {
  if (!wp) return;
  for (const st of side.status) {
    if (!active(opp) || st.chance <= 0) continue;
    if (!roll1(s.rng, st.chance)) continue;
    if (st.status === 'knockback') knockback(data, s, me, opp, events);
    else applyStatus(data, s, opp, st.status, events);
  }
  if (wp.terrainOnHit && opp.pos && ruleOn(s, 'elements')) {
    if (wp.terrainOnHit === 'ignite') igniteTile(data, s, opp.pos, 'ignite', events);
    else extinguishTile(s, opp.pos, events);
  }
}

/**
 * Resolves an attack: strikes, counters, doubles, tandem, guard, status, terrain, EXP, SP, supports.
 * Mutates state. Uses the forecast numbers so preview and resolution can never drift apart.
 */
export function resolveAttack(
  data: GameData,
  s: BattleState,
  attackerUid: string,
  defenderUid: string,
  weaponUid: string | undefined,
  events: GameEvent[],
  mods?: AttackMods,
): void {
  const a = getUnit(s, attackerUid);
  const d = getUnit(s, defenderUid);
  if (weaponUid) equipWeapon(data, a, weaponUid, events);
  const ownPhase = a.team === s.phase;
  const f = forecast(data, s, a.uid, d.uid, a.equip.mainHand?.uid, undefined, ownPhase, mods);
  const aWp = a.equip.mainHand ? weaponProfile(data, a.equip.mainHand) : undefined;
  const dWp = d.equip.mainHand ? weaponProfile(data, d.equip.mainHand) : undefined;
  const aProcs = computeStats(data, a, { state: s, opponent: d, initiator: true, distance: f.distance }, 'combat_attack').skills.procs;
  const dProcs = computeStats(data, d, { state: s, opponent: a, initiator: false, distance: f.distance }, 'combat_defend').skills.procs;
  events.push({ t: 'combat', attacker: a.uid, defender: d.uid, weapon: a.equip.mainHand?.uid });
  let guardUsed = false;
  const landed = { a: false, d: false };
  const ranged = f.distance > 1;

  const strike = (me: BattleUnit, opp: BattleUnit, side: SideForecast, procs: typeof aProcs, wp?: WeaponProfile) => {
    const hit = data.balance.combat.twoRnHit ? roll2(s.rng, side.hit) : roll1(s.rng, side.hit);
    let crit = false;
    let dmg = 0;
    let skill: string | undefined;
    let guarded: string | undefined;
    if (hit) {
      crit = roll1(s.rng, side.crit);
      dmg = side.damage;
      for (const p of procs) {
        if (!roll1(s.rng, p.chance)) continue;
        skill = p.skill;
        if (p.effect.ignoreDefPercent) {
          const oppSt = computeStats(data, opp, { state: s });
          const defVal = side.magic ? oppSt.stats.res : oppSt.stats.def;
          dmg += Math.floor((defVal * p.effect.ignoreDefPercent) / 100);
        }
      }
      if (crit) dmg *= data.balance.combat.critMultiplier;
      if (opp === d && f.guard && !guardUsed && me === a) {
        guardUsed = true;
        if (roll1(s.rng, f.guard.chance)) {
          guarded = f.guard.uid;
          dmg = 0;
        }
      }
      // on_lethal (miracle)
      if (dmg >= opp.hp && opp.hp > 1) {
        const oppProcs = opp === d ? dProcs : aProcs;
        const miracle = oppProcs.find((p) => p.effect.surviveWith);
        if (miracle && roll1(s.rng, miracle.chance)) {
          dmg = opp.hp - (miracle.effect.surviveWith ?? 1);
          skill = miracle.skill;
        }
      }
      if (opp.downed) dmg = Math.max(dmg, 1);
      opp.hp = Math.max(0, opp.hp - dmg);
      for (const p of procs) {
        if (p.skill === skill && p.effect.lifestealPercent) {
          const st = computeStats(data, me, { state: s });
          const heal = Math.min(st.maxHp - me.hp, Math.floor((dmg * p.effect.lifestealPercent) / 100));
          me.hp += heal;
        }
      }
    }
    events.push({
      t: 'strike',
      attacker: me.uid,
      defender: opp.uid,
      hit,
      crit,
      dmg,
      hpAfter: opp.hp,
      element: wp?.element,
      guarded,
      skill,
      ranged,
      magic: side.magic,
    });
    if (hit && dmg > 0) {
      if (me === a) landed.a = true;
      else landed.d = true;
    }
    if (opp.hp <= 0) knockOut(data, s, opp, events);
  };

  const wasDowned = d.downed;
  for (const who of f.order) {
    if (!active(a) || (!active(d) && !wasDowned) || d.gone) break;
    if (who === 'a') strike(a, d, f.attacker, aProcs, aWp);
    else if (!d.downed) strike(d, a, f.defender, dProcs, dWp);
    if (wasDowned) break;
  }
  // tandem: partner strikes once, 50 % damage, no crit, no counter
  if (f.tandem && active(a) && active(d)) {
    const p = getUnit(s, f.tandem.uid);
    const hit = data.balance.combat.twoRnHit ? roll2(s.rng, f.tandem.hit) : roll1(s.rng, f.tandem.hit);
    const dmg = hit ? f.tandem.damage : 0;
    d.hp = Math.max(0, d.hp - dmg);
    events.push({
      t: 'strike',
      attacker: p.uid,
      defender: d.uid,
      hit,
      crit: false,
      dmg,
      hpAfter: d.hp,
      tandem: true,
      ranged: p.pos ? dist(p.pos, d.pos!) > 1 : false,
      magic: false,
    });
    const key = pairKey(a.id, p.id);
    const gained = addSupportPoints(data, s.supports, key, data.balance.supports.pointsTandemHealRescue);
    if (gained) events.push({ t: 'support', a: a.uid, b: p.uid, points: gained });
    if (d.hp <= 0) knockOut(data, s, d, events);
  }
  if (landed.a && active(d)) applyOnHitEffects(data, s, a, d, f.attacker, aWp, events);
  if (landed.d && active(a)) applyOnHitEffects(data, s, d, a, f.defender, dWp, events);
  if (landed.a && aWp?.terrainOnHit && d.gone === 'dead' && d.pos && ruleOn(s, 'elements')) {
    // a kill still sets the tile alight (fire spreading from the strike)
    if (aWp.terrainOnHit === 'ignite') igniteTile(data, s, d.pos, 'ignite', events);
  }
  events.push({ t: 'combatEnd', attacker: a.uid, defender: d.uid });

  // EXP and SP for player units that took part and are still standing
  const sp = data.balance.skills.spPerCombat;
  for (const [me, foe] of [
    [a, d],
    [d, a],
  ] as const) {
    grantSp(data, me, sp, events);
    if (me.team !== 'player' || !active(me)) continue;
    const killed = foe.gone === 'dead' || (!wasDowned && foe.downed);
    if (killed && foe.boss && me.equip.mainHand) {
      s.stats.bossKilledWith = itemDef(data, me.equip.mainHand).weaponType;
    }
    grantExp(data, me, combatExp(data, me, foe, killed, !!foe.boss), s.rng, events);
  }
}

/** Expected-value helper for the AI. */
export function expectedDamage(f: Forecast): { dealt: number; taken: number; killChance: number } {
  const a = f.attacker;
  const d = f.defender;
  const dealt = (a.damage * a.strikes * a.hit) / 100;
  const taken = d.canStrike ? (d.damage * d.strikes * d.hit) / 100 : 0;
  let killChance = 0;
  if (a.damage > 0) {
    const need = Math.ceil(d.hpBefore / a.damage);
    if (need <= a.strikes) {
      const p = a.hit / 100;
      killChance = need === 1 ? 1 - Math.pow(1 - p, a.strikes) : Math.pow(p, need);
    }
  }
  return { dealt, taken, killChance };
}

export { setTerrain };
