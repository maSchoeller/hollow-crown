/**
 * Fallen (story 10.5): the trapper lays a trap on a free tile next to it (`balance.classActions.trap`); a foe of its owner that walks
 * into one stops there, takes the fixed damage and the status, and the trap is gone. Own and allied units walk over traps. Traps
 * live in `BattleState.traps` (plain JSON) and stay until the mission ends. Story 10.6 lays traps of the trap set (`source: 'item'`)
 * with the same functions.
 */
import type { Pos } from '../defs';
import type { GameData } from '../gameData';
import type { GameEvent } from '../events';
import type { BattleState, BattleUnit, TrapState } from '../state';
import { active, dist, inBounds, isHostile, onMap, samePos, terrainAt, tileIndex } from '../util';
import { applyStatus, damageUnit } from './effects';
import { activeSkillIds } from './skills';

export const trapsOf = (s: Pick<BattleState, 'traps'>): TrapState[] => s.traps ?? [];

/** The unit may lay traps: an active skill grants the action `trap` (Fallensteller: `pro_traps`). */
export function canLayTraps(data: GameData, s: BattleState, u: BattleUnit): boolean {
  return activeSkillIds(data, u, s).some((id) => data.skills[id]?.effect.grantAction === 'trap');
}

/** The team a trap belongs to: its owner's (a trap whose owner has left the board keeps working for the player's side). */
export function trapTeam(s: BattleState, t: TrapState): BattleUnit['team'] {
  return s.units.find((u) => u.uid === t.owner)?.team ?? 'player';
}

/** Class traps of the unit on the board, oldest first. */
export function ownTraps(s: BattleState, u: Pick<BattleUnit, 'uid'>, source: TrapState['source'] = 'class'): TrapState[] {
  return trapsOf(s)
    .filter((t) => t.owner === u.uid && t.source === source)
    .sort((a, b) => a.seq - b.seq);
}

/** Tiles within the trap reach of `pos` (neighbours with range 1), in tile order. */
function inReach(data: GameData, s: BattleState, pos: Pos): Pos[] {
  const r = data.balance.classActions.trap.range;
  const out: Pos[] = [];
  for (let y = pos[1] - r; y <= pos[1] + r; y++)
    for (let x = pos[0] - r; x <= pos[0] + r; x++) {
      const p: Pos = [x, y];
      const d = dist(p, pos);
      if (d >= 1 && d <= r && inBounds(s, p)) out.push(p);
    }
  return out.sort((a, b) => tileIndex(s, a) - tileIndex(s, b));
}

/**
 * Falle legen from `pos`: the tiles in reach that are free (no unit but the trapper itself, no object, no trap) and passable on foot.
 * Empty when the unit cannot lay traps.
 */
export function trapTiles(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): Pos[] {
  if (!canLayTraps(data, s, u)) return [];
  return inReach(data, s, pos).filter(
    (p) =>
      !s.units.some((o) => o.uid !== u.uid && onMap(o) && samePos(o.pos, p)) &&
      !s.objects.some((o) => samePos(o.at, p)) &&
      !trapsOf(s).some((t) => samePos(t.at, p)) &&
      (data.terrain[terrainAt(s, p)]?.cost.foot ?? null) !== null,
  );
}

/** Zurücknehmen from `pos`: the tiles in reach with a class trap of this unit. */
export function disarmTiles(data: GameData, s: BattleState, u: BattleUnit, pos: Pos): Pos[] {
  if (!canLayTraps(data, s, u)) return [];
  return inReach(data, s, pos).filter((p) => ownTraps(s, u).some((t) => samePos(t.at, p)));
}

/** Lays a trap; with `max` class traps of the unit on the board the oldest gives way first. */
export function layTrap(data: GameData, s: BattleState, u: BattleUnit, at: Pos, events: GameEvent[], source: TrapState['source'] = 'class'): void {
  const max = data.balance.classActions.trap.max;
  const own = ownTraps(s, u, source);
  if (source === 'class' && own.length >= max) for (const old of own.slice(0, own.length - max + 1)) removeTrap(s, old, u.uid, events);
  const seq = trapsOf(s).reduce((m, t) => Math.max(m, t.seq), 0) + 1;
  const trap: TrapState = { id: `trap${seq}`, at: [at[0], at[1]], owner: u.uid, source, seq };
  s.traps = [...trapsOf(s), trap];
  events.push({ t: 'trapSet', unit: u.uid, trap: trap.id, at: trap.at });
}

function removeTrap(s: BattleState, t: TrapState, by: string, events: GameEvent[]): void {
  s.traps = trapsOf(s).filter((x) => x.id !== t.id);
  events.push({ t: 'trapRemoved', trap: t.id, at: t.at, unit: by });
}

/** Takes back the unit's own class trap on `at`. */
export function disarmTrap(s: BattleState, u: BattleUnit, at: Pos, events: GameEvent[]): void {
  const t = ownTraps(s, u).find((x) => samePos(x.at, at));
  if (t) removeTrap(s, t, u.uid, events);
}

/** The trap that would stop `u` on `p`: one of a team hostile to it. */
export function trapFor(s: BattleState, u: BattleUnit, p: Pos): TrapState | undefined {
  return trapsOf(s).find((t) => samePos(t.at, p) && isHostile(trapTeam(s, t), u.team));
}

/** Index of the first tile of the walk (after the start) where a trap stops `u`; -1 when none does. */
export function trapStop(s: BattleState, u: BattleUnit, path: readonly Pos[]): number {
  if (!trapsOf(s).length) return -1;
  for (let i = 1; i < path.length; i++) if (trapFor(s, u, path[i]!)) return i;
  return -1;
}

/** The trap under `u` springs: it is gone, `u` takes the damage (no randomness, 0 HP as usual) and, still standing, the status. */
export function springTrap(data: GameData, s: BattleState, u: BattleUnit, events: GameEvent[]): void {
  const t = u.pos ? trapFor(s, u, u.pos) : undefined;
  if (!t) return;
  const cfg = data.balance.classActions.trap;
  s.traps = trapsOf(s).filter((x) => x.id !== t.id);
  events.push({ t: 'trapTriggered', trap: t.id, unit: u.uid, damage: cfg.damage, at: t.at });
  damageUnit(data, s, u, cfg.damage, 'trap', events, t.owner);
  if (active(u)) applyStatus(data, s, u, cfg.status, events);
}
