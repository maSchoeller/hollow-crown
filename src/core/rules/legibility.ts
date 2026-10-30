/**
 * Numbers behind the board's legibility aids (epic 13, architecture §5.12): how many foes reach a field, who reaches the chosen
 * field, which foes the selected unit can fell this phase, which own units could fall in the next foe phase, and the recap of
 * a foe phase. Pure functions over `threatTiles` and `forecast` (the preview code, never a copy of the formula); the board only
 * draws what they return.
 */
import type { GameData, Pos } from '../defs';
import type { GameEvent } from '../events';
import type { BattleState, BattleUnit } from '../state';
import { active, dist, isHostile, onMap, posKey } from '../util';
import { asleep } from '../ai/ai';
import { forecast, type Forecast } from './combat';
import { usableWeapons } from './items';
import { destinations, reachNow, reachable, threatTiles, weaponRange } from './movement';
import { computeStats } from './stats';
import { bleedsOut } from './effects';

/** Foes of `team` that would act in their next phase: active, on the map, hostile, not asleep. */
function threatening(data: GameData, s: BattleState, team: BattleUnit['team']): BattleUnit[] {
  return s.units.filter((u) => onMap(u) && active(u) && isHostile(u.team, team) && !asleep(data, s, u));
}

/** hold/guard units strike from where they stand (as in `dangerZone`). */
const standsStill = (u: BattleUnit) => !!u.ai && (u.ai.profile === 'hold' || u.ai.profile === 'guard');

export interface ThreatMap {
  /** field key -> uids of the foes that can attack it in their next phase */
  byTile: Map<string, string[]>;
  /** fields only sleeping foes reach (drawn as a dashed edge, they do not count) */
  sleeping: Set<string>;
}

/**
 * Who reaches which field (story 13.5): every foe of `team` that acts next counts once per field it can attack; hold/guard
 * count without moving, sleeping `trigger` foes do not count and give the `sleeping` fields instead. `only`: just these foes
 * (the zone of single foes the player switched on).
 */
export function threatMap(data: GameData, s: BattleState, team: BattleUnit['team'], only?: readonly string[]): ThreatMap {
  const byTile = new Map<string, string[]>();
  const sleeping = new Set<string>();
  for (const u of s.units) {
    if (!onMap(u) || !active(u) || !isHostile(u.team, team)) continue;
    if (only && !only.includes(u.uid)) continue;
    if (asleep(data, s, u)) {
      for (const k of threatTiles(data, s, u)) sleeping.add(k);
      continue;
    }
    for (const k of threatTiles(data, s, u, standsStill(u))) {
      const list = byTile.get(k);
      if (list) list.push(u.uid);
      else byTile.set(k, [u.uid]);
    }
  }
  for (const k of byTile.keys()) sleeping.delete(k);
  return { byTile, sleeping };
}

/** Number of attackers per field (story 13.5): the tier of the danger zone and the count in its circle. */
export function threatCounts(data: GameData, s: BattleState, team: BattleUnit['team'], only?: readonly string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const [k, list] of threatMap(data, s, team, only).byTile) out.set(k, list.length);
  return out;
}

/** The foes of `unit` that can attack field `at` in their next phase (story 13.6), counted like the danger zone. */
export function tileThreats(data: GameData, s: BattleState, unit: BattleUnit, at: Pos): string[] {
  const k = posKey(at);
  // the unit leaves its own field: foes may then stand there
  const saved = unit.pos;
  unit.pos = at;
  try {
    return threatening(data, s, unit.team)
      .filter((u) => threatTiles(data, s, u, standsStill(u)).has(k))
      .map((u) => u.uid);
  } finally {
    unit.pos = saved;
  }
}

/** HP the defender loses in the strike order of `f` when the attacker's strikes all hit; `critFirst`: its first strike crits. Tandem left out. */
function lossAtHit(data: GameData, f: Forecast, critFirst: boolean): number {
  const a = f.attacker;
  const d = f.defender;
  let aHp = a.hpBefore;
  let dHp = d.hpBefore;
  let first = critFirst;
  for (const who of f.order) {
    if (aHp <= 0 || dHp <= 0) break;
    if (who === 'a') {
      if (!a.canStrike) continue;
      dHp = Math.max(0, dHp - (first ? a.damage * data.balance.combat.critMultiplier : a.damage));
      first = false;
    } else if (d.canStrike) aHp = Math.max(0, aHp - d.damage);
  }
  return d.hpBefore - dHp;
}

/** HP the attack of `f` takes from the defender when every strike of the attacker hits (doubles included, no crit, no tandem): the flashing part of the HP bar (story 13.4). */
export function damageAtHit(data: GameData, f: Forecast): number {
  return lossAtHit(data, f, false);
}

export interface KillMark {
  target: string;
  /** `hit`: falls when the strikes hit; `crit`: falls only with a critical hit */
  kind: 'hit' | 'crit';
  /** a lieutenant flees instead of dying (the board shows the flee mark) */
  flees: boolean;
}

/**
 * Kill markers of the selected unit (story 13.4): every foe it can attack this phase from a field it can reach, with the best
 * usable weapon from the most favourable field. Falls at hit (doubles included) beats falls only with a crit.
 */
export function killMarks(data: GameData, s: BattleState, unit: BattleUnit): KillMark[] {
  if (!onMap(unit) || !active(unit) || unit.acted) return [];
  const origins = destinations(s, unit, reachNow(data, s, unit));
  const weapons = usableWeapons(data, unit).map((w) => ({ uid: w.uid, range: weaponRange(data, s, unit, w.uid) }));
  const out: KillMark[] = [];
  for (const foe of s.units) {
    if (!onMap(foe) || !active(foe) || !isHostile(unit.team, foe.team)) continue;
    let best: KillMark['kind'] | null = null;
    for (const w of weapons) {
      for (const o of origins) {
        const d = dist(o, foe.pos!);
        if (d < w.range[0] || d > w.range[1]) continue;
        const f = forecast(data, s, unit.uid, foe.uid, w.uid, o);
        if (lossAtHit(data, f, false) >= foe.hp) best = 'hit';
        else if (!best && f.attacker.crit > 0 && lossAtHit(data, f, true) >= foe.hp) best = 'crit';
        if (best === 'hit') break;
      }
      if (best === 'hit') break;
    }
    if (best) out.push({ target: foe.uid, kind: best, flees: !!foe.lieutenant });
  }
  return out;
}

/**
 * Own units in danger (story 13.6): the damage at hit of all foes that can reach a unit in their next phase (doubles, no crit,
 * no hit chance; each foe with its best weapon) reaches its current HP. Foes count like the danger zone.
 */
export function perilWarnings(data: GameData, s: BattleState, team: BattleUnit['team'] = 'player'): string[] {
  const foes = threatening(data, s, team).map((u) => ({
    u,
    zone: threatTiles(data, s, u, standsStill(u)),
    origins: standsStill(u) ? [u.pos!] : destinations(s, u, reachable(data, s, u)),
    weapons: usableWeapons(data, u).map((w) => ({ uid: w.uid, range: weaponRange(data, s, u, w.uid) })),
  }));
  const out: string[] = [];
  for (const me of s.units) {
    if (me.team !== team || !onMap(me) || !active(me)) continue;
    let total = 0;
    for (const f of foes) {
      if (!f.zone.has(posKey(me.pos!))) continue;
      let most = 0;
      for (const w of f.weapons) {
        const from = f.origins.find((o) => {
          const d = dist(o, me.pos!);
          return d >= w.range[0] && d <= w.range[1];
        });
        if (!from) continue;
        most = Math.max(most, damageAtHit(data, forecast(data, s, f.u.uid, me.uid, w.uid, from, true)));
      }
      total += most;
      if (total >= me.hp) break;
    }
    if (total >= me.hp) out.push(me.uid);
  }
  return out;
}

export type RecapRow =
  /** own unit downed; `left` = phases before it bleeds out (null: it does not bleed out) */
  | { kind: 'downed'; unit: string; left: number | null }
  | { kind: 'died'; unit: string }
  /** own unit struck: HP before and after; `dodged` when every strike missed */
  | { kind: 'hit'; unit: string; before: number; after: number; dodged: boolean }
  | { kind: 'reinforce'; unit: string; at: Pos | null }
  | { kind: 'woke'; unit: string; at: Pos | null };

/**
 * What happened in a foe phase (story 13.7), from its events (as the player saw them) and the states before and after: downed
 * and fallen own units first, then strikes on own units, then reinforcements and foes that woke up. Empty when nothing happened.
 */
export function phaseRecap(data: GameData, before: BattleState, after: BattleState, events: readonly GameEvent[], team: BattleUnit['team'] = 'player'): RecapRow[] {
  const teamOf = new Map<string, BattleUnit['team']>();
  for (const u of [...before.units, ...after.units]) teamOf.set(u.uid, u.team);
  const own = (uid: string) => teamOf.get(uid) === team;
  const fallen: RecapRow[] = [];
  const out = new Set<string>();
  const hits = new Map<string, { before: number; after: number; landed: boolean }>();
  const arrivals: RecapRow[] = [];
  const hpOf = (uid: string) => before.units.find((u) => u.uid === uid)?.hp ?? 0;
  for (const e of events) {
    if (e.t === 'downed' && own(e.unit)) {
      const u = after.units.find((x) => x.uid === e.unit);
      const left = u && !u.gone && bleedsOut(data, after, u) ? Math.max(0, data.balance.death.bleedOutTurns - (u.bleed ?? 0)) : null;
      fallen.push({ kind: 'downed', unit: e.unit, left });
      out.add(e.unit);
    } else if (e.t === 'died' && own(e.unit)) {
      const i = fallen.findIndex((r) => r.unit === e.unit);
      if (i >= 0) fallen.splice(i, 1);
      fallen.push({ kind: 'died', unit: e.unit });
      out.add(e.unit);
    } else if ((e.t === 'strike' && own(e.defender)) || (e.t === 'damage' && own(e.unit))) {
      const uid = e.t === 'strike' ? e.defender : e.unit;
      const h = hits.get(uid) ?? { before: hpOf(uid), after: hpOf(uid), landed: false };
      if (e.t === 'damage' || e.hit) {
        h.after = e.hpAfter;
        h.landed = true;
      }
      hits.set(uid, h);
    } else if (e.t === 'spawned' && e.reinforcement && teamOf.get(e.unit) !== team) {
      arrivals.push({ kind: 'reinforce', unit: e.unit, at: e.at ?? after.units.find((u) => u.uid === e.unit)?.pos ?? null });
    }
  }
  for (const u of before.units) {
    if (teamOf.get(u.uid) === team || !onMap(u) || !asleep(data, before, u)) continue;
    const now = after.units.find((x) => x.uid === u.uid);
    if (now && onMap(now) && active(now) && !asleep(data, after, now)) arrivals.push({ kind: 'woke', unit: u.uid, at: now.pos });
  }
  const struck: RecapRow[] = [];
  for (const [uid, h] of hits) if (!out.has(uid)) struck.push({ kind: 'hit', unit: uid, before: h.before, after: h.after, dodged: !h.landed });
  return [...fallen, ...struck, ...arrivals];
}

/** Max HP of a unit as the HP bar counts it (story 13.3). */
export function maxHpOf(data: GameData, s: BattleState, u: BattleUnit): number {
  return computeStats(data, u, { state: s }).maxHp;
}
