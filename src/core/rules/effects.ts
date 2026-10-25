import type { Element, GameData, Pos, StatusId, Team } from '../defs';
import type { GameEvent } from '../events';
import { nextInt, roll1 } from '../rng';
import type { BattleState, BattleUnit } from '../state';
import { inBounds, neighbors, onMap, posKey, terrainAt, tileIndex, unitAt } from '../util';
import { allItems, itemDef } from './items';
import { computeStats } from './stats';
import { activeSkillIds } from './skills';

const STATUS_ELEMENT: Record<StatusId, Element> = { burning: 'fire', wet: 'water', slowed: 'earth', knockback: 'wind' };

export function hasStatus(u: BattleUnit, id: StatusId): boolean {
  return u.status.some((s) => s.id === id);
}

/** Applies a lasting status (not knockback). Respects immunities (concept/03 §6–7). */
export function applyStatus(data: GameData, s: BattleState, u: BattleUnit, id: StatusId, events: GameEvent[]): boolean {
  if (!onMap(u) || u.downed) return false;
  const aff = computeStats(data, u, { state: s }).affinity;
  if (aff && aff === STATUS_ELEMENT[id]) return false;
  if (id === 'burning' && hasStatus(u, 'wet')) return false;
  if (id === 'wet' && hasStatus(u, 'burning')) {
    u.status = u.status.filter((x) => x.id !== 'burning');
    events.push({ t: 'status', unit: u.uid, status: 'burning', on: false });
  }
  const turns = data.balance.status.durationRounds;
  const existing = u.status.find((x) => x.id === id);
  if (existing) existing.turns = turns;
  else u.status.push({ id, turns });
  events.push({ t: 'status', unit: u.uid, status: id, on: true });
  return true;
}

export function setTerrain(s: BattleState, p: Pos, terrain: string): void {
  s.terrain[tileIndex(s, p)] = terrain;
}

export function igniteTile(data: GameData, s: BattleState, p: Pos, cause: 'ignite' | 'spread', events: GameEvent[]): boolean {
  if (!inBounds(s, p)) return false;
  const cur = terrainAt(s, p);
  if (!data.terrain[cur]?.flammable) return false;
  s.timers[posKey(p)] = { kind: 'burning', turns: data.balance.terrainEffects.burningDuration, revertTo: cur };
  setTerrain(s, p, 'burning');
  events.push({ t: 'terrain', at: p, terrain: 'burning', cause });
  return true;
}

export function extinguishTile(s: BattleState, p: Pos, events: GameEvent[]): boolean {
  const key = posKey(p);
  const t = s.timers[key];
  if (!t || t.kind !== 'burning') return false;
  delete s.timers[key];
  setTerrain(s, p, t.revertTo);
  events.push({ t: 'terrain', at: p, terrain: t.revertTo, cause: 'extinguish' });
  return true;
}

export function raiseRockwall(data: GameData, s: BattleState, p: Pos, events: GameEvent[]): boolean {
  if (unitAt(s, p)) return false;
  const cur = terrainAt(s, p);
  s.timers[posKey(p)] = { kind: 'rockwall', turns: data.balance.terrainEffects.rockwallDuration, revertTo: cur };
  setTerrain(s, p, 'rockwall');
  events.push({ t: 'terrain', at: p, terrain: 'rockwall', cause: 'rockwall' });
  return true;
}

/** Damage outside of combat (burn, fire tiles, bombs). Returns true if the unit was knocked out. */
export function damageUnit(
  data: GameData,
  s: BattleState,
  u: BattleUnit,
  amount: number,
  cause: 'burn' | 'fire' | 'item',
  events: GameEvent[],
): boolean {
  if (!onMap(u) || u.downed || amount <= 0) return false;
  u.hp = Math.max(0, u.hp - amount);
  events.push({ t: 'damage', unit: u.uid, amount, hpAfter: u.hp, cause });
  if (u.hp <= 0) {
    knockOut(data, s, u, events);
    return true;
  }
  return false;
}

/**
 * Map flag `noDeath` (tutorial): downed player units never die in this battle, no matter the death mode; they stay
 * downed and return after the mission. Exempt are units whose death loses the battle (`unit_dies` defeat objectives,
 * `mustSurvive`): for them everything stays as before.
 */
export function deathless(data: GameData, s: BattleState, u: BattleUnit): boolean {
  const map = data.maps[s.mapId];
  if (!map?.noDeath || u.team !== 'player' || u.flags.includes('mustSurvive')) return false;
  return !map.objectives.defeat.some((d) => d.type === 'unit_dies' && (d.unit === u.id || d.unit === u.uid));
}

/** Whether a downed unit runs a bleed-out countdown (HUD, board label); false on `noDeath` maps for the deathless. */
export function bleedsOut(data: GameData, s: BattleState, u: BattleUnit): boolean {
  return !deathless(data, s, u);
}

/** 0 HP handling by death mode (concept/03 §9). */
export function knockOut(data: GameData, s: BattleState, u: BattleUnit, events: GameEvent[]): void {
  u.hp = 0;
  u.status = [];
  if (u.team !== 'player') {
    dropLoot(s, u, events);
    u.gone = 'dead';
    events.push({ t: 'died', unit: u.uid });
    return;
  }
  const mustSurvive = u.flags.includes('mustSurvive');
  const mode = s.settings.deathMode;
  if (deathless(data, s, u)) {
    // tutorial map: stays downed whatever happens (no bleed-out, no finishing blow)
    if (!u.downed) {
      s.stats.downs += 1;
      u.downed = true;
      u.bleed = 0;
      events.push({ t: 'downed', unit: u.uid });
    }
    return;
  }
  s.stats.downs += 1;
  if (u.downed) {
    u.gone = 'dead';
    u.downed = false;
    events.push({ t: 'died', unit: u.uid });
  } else if (mode === 'classic' || u.scars.length >= data.balance.death.scarsUntilInstantDeath) {
    u.gone = 'dead';
    events.push({ t: 'died', unit: u.uid });
  } else if (mode === 'standard') {
    u.downed = true;
    u.bleed = 0;
    events.push({ t: 'downed', unit: u.uid });
  } else {
    u.gone = 'retreated';
    events.push({ t: 'retreated', unit: u.uid });
  }
  if (mustSurvive && !s.outcome) {
    s.outcome = 'defeat';
    s.defeatReason = u.id;
    events.push({ t: 'battleEnd', outcome: 'defeat', reason: u.id });
  }
}

function dropLoot(s: BattleState, u: BattleUnit, events: GameEvent[]): void {
  if (!u.pos) return;
  for (const uid of u.dropUids) {
    const item = allItems(u).find((i) => i.uid === uid);
    if (!item) continue;
    s.loot.push({ at: [u.pos[0], u.pos[1]], item });
    events.push({ t: 'lootDropped', at: [u.pos[0], u.pos[1]], item });
  }
}

/** Unit enters or stands on a burning tile. */
export function burningTileHit(data: GameData, s: BattleState, u: BattleUnit, events: GameEvent[]): void {
  if (!u.pos || terrainAt(s, u.pos) !== 'burning') return;
  if (data.classes[u.classId]?.moveType === 'flier') return;
  applyStatus(data, s, u, 'burning', events);
  damageUnit(data, s, u, data.balance.terrainEffects.burningEnterDamage, 'fire', events);
}

/**
 * Round start: burning tiles spread (seeded) and burn down, rockwalls crumble (concept/03 §7).
 */
export function tickTerrain(data: GameData, s: BattleState, events: GameEvent[]): void {
  const te = data.balance.terrainEffects;
  const keys = Object.keys(s.timers).sort();
  const spread: Pos[] = [];
  for (const k of keys) {
    const t = s.timers[k]!;
    if (t.kind !== 'burning') continue;
    if (!roll1(s.rng, te.burningSpreadChance)) continue;
    const [x, y] = k.split(',').map(Number) as [number, number];
    const cands = neighbors([x, y]).filter((p) => inBounds(s, p) && data.terrain[terrainAt(s, p)]?.flammable);
    if (cands.length) spread.push(cands[nextInt(s.rng, cands.length)]!);
  }
  for (const k of keys) {
    const t = s.timers[k]!;
    t.turns -= 1;
    if (t.turns > 0) continue;
    const [x, y] = k.split(',').map(Number) as [number, number];
    delete s.timers[k];
    const to = t.kind === 'burning' ? 'ash' : t.revertTo;
    setTerrain(s, [x, y], to);
    events.push({ t: 'terrain', at: [x, y], terrain: to, cause: t.kind === 'burning' ? 'burnout' : 'rockwall' });
  }
  for (const p of spread) igniteTile(data, s, p, 'spread', events);
}

/** Downed units count their own phases; at `bleedOutTurns` they die unless rescued before (GDD, Verbluten). */
function bleedOut(data: GameData, s: BattleState, team: Team, events: GameEvent[]): void {
  const max = data.balance.death.bleedOutTurns;
  for (const u of s.units) {
    if (u.team !== team || !u.downed || u.gone || deathless(data, s, u)) continue;
    u.bleed = (u.bleed ?? 0) + 1;
    events.push({ t: 'bleed', unit: u.uid, turns: u.bleed, max });
    if (u.bleed >= max) {
      u.downed = false;
      u.gone = 'dead';
      events.push({ t: 'died', unit: u.uid });
    }
  }
}

/** Start of a team's phase: burn damage, terrain healing, renewal, standing in fire. */
export function startOfPhase(data: GameData, s: BattleState, team: Team, events: GameEvent[]): void {
  bleedOut(data, s, team, events);
  for (const u of s.units) {
    if (u.team !== team || !onMap(u) || u.downed) continue;
    const st = computeStats(data, u, { state: s });
    if (hasStatus(u, 'burning')) {
      const dmg = Math.max(1, Math.floor((st.maxHp * data.balance.status.burnPercentMaxHp) / 100));
      if (damageUnit(data, s, u, dmg, 'burn', events)) continue;
    }
    if (u.pos && terrainAt(s, u.pos) === 'burning') {
      burningTileHit(data, s, u, events);
      if (!onMap(u) || u.downed) continue;
    }
    let healPct = u.pos ? (data.terrain[terrainAt(s, u.pos)]?.heal ?? 0) : 0;
    for (const id of activeSkillIds(data, u)) {
      const sk = data.skills[id]!;
      if (sk.trigger === 'on_turn_start' && sk.effect.healPercent) healPct += sk.effect.healPercent;
    }
    if (healPct > 0 && u.hp < st.maxHp) {
      const amount = Math.min(st.maxHp - u.hp, Math.max(1, Math.floor((st.maxHp * healPct) / 100)));
      u.hp += amount;
      events.push({ t: 'heal', unit: u.uid, amount, hpAfter: u.hp, cause: 'terrain' });
    }
  }
}

/** End of a team's phase: status durations tick down, buffs expire. */
export function endOfPhase(s: BattleState, team: Team, events: GameEvent[]): void {
  for (const u of s.units) {
    if (u.team === team) {
      for (const st of u.status) st.turns -= 1;
      const expired = u.status.filter((x) => x.turns <= 0);
      u.status = u.status.filter((x) => x.turns > 0);
      for (const x of expired) events.push({ t: 'status', unit: u.uid, status: x.id, on: false });
    }
    u.buffs = u.buffs.filter((b) => !(b.untilPhase === team && b.untilTurn <= s.turn));
  }
}

export function healAmountOfItem(data: GameData, defId: string): number {
  return itemDef(data, defId).use?.heal ?? 0;
}
