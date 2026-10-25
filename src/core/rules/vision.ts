/**
 * Nebel des Krieges (story 2.6). On a map with `fog: true` a team sees the tiles within a radius of its active units, as far as
 * the line of sight reaches: the radius is `balance.fog.baseVision` plus the highest bonus that applies (class role or movement
 * type, bonuses do not stack), and sight ends behind terrain of `balance.fog.blockers` (wall, closed door, rock wall; the blocking
 * tile itself is seen). Fields lifted by Wirken with wind (`liftedTiles`) count as seen. Without `fog` everything is seen.
 *
 * The fog belongs to the player's side only: the enemy AI keeps seeing everything, so none of this feeds back into the rules.
 * The functions here only read; the UI uses them to show the board, the previews and the played events (`filterEvents`) for a
 * team, never to change a state, a log or a replay. Results are plain data (sets of `x,y` keys, arrays, a state copy).
 */
import type { GameData, Pos } from '../defs';
import type { GameEvent } from '../events';
import type { BattleState, BattleUnit } from '../state';
import { active, inBounds, isAlly, onMap, posKey, terrainAt } from '../util';
import { liftedTiles } from './cast';

/** Whether the map of the battle lies under fog. */
export const fogOn = (data: GameData, s: Pick<BattleState, 'mapId'>): boolean => !!data.maps[s.mapId]?.fog;

/** How far the unit sees: base radius plus the highest bonus of its class role and its movement type. */
export function visionRadius(data: GameData, u: Pick<BattleUnit, 'classId'>): number {
  const f = data.balance.fog;
  const cls = data.classes[u.classId];
  const bonus = Math.max(f.roleBonus[cls?.role ?? ''] ?? 0, f.moveTypeBonus[cls?.moveType ?? 'foot'] ?? 0);
  return f.baseVision + bonus;
}

/** Tiles strictly between `a` and `b` on the grid line from the centre of `a` to the centre of `b` (Bresenham). */
function between(a: Pos, b: Pos): Pos[] {
  const out: Pos[] = [];
  let x = a[0];
  let y = a[1];
  const dx = Math.abs(b[0] - x);
  const dy = Math.abs(b[1] - y);
  const sx = x < b[0] ? 1 : -1;
  const sy = y < b[1] ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
    if (x === b[0] && y === b[1]) return out;
    out.push([x, y]);
  }
}

/** Line of sight between two tiles: free when the tiles between them (counted from either end, so it is symmetric) do not block. */
function lineClear(blocks: (p: Pos) => boolean, a: Pos, b: Pos): boolean {
  return !between(a, b).some(blocks) || !between(b, a).some(blocks);
}

/** The tiles `team` sees now, as `x,y` keys (`posKey`): the whole map without fog. */
export function visibleTiles(data: GameData, s: BattleState, team: BattleUnit['team']): Set<string> {
  const out = new Set<string>();
  if (!fogOn(data, s)) {
    for (let y = 0; y < s.height; y++) for (let x = 0; x < s.width; x++) out.add(posKey([x, y]));
    return out;
  }
  const blockers = new Set(data.balance.fog.blockers);
  const blocks = (p: Pos) => blockers.has(terrainAt(s, p));
  for (const k of liftedTiles(s, team)) out.add(k);
  for (const u of s.units) {
    if (!active(u) || !u.pos || !isAlly(u.team, team)) continue;
    const r = visionRadius(data, u);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -(r - Math.abs(dy)); dx <= r - Math.abs(dy); dx++) {
        const p: Pos = [u.pos[0] + dx, u.pos[1] + dy];
        if (inBounds(s, p) && !out.has(posKey(p)) && lineClear(blocks, u.pos, p)) out.add(posKey(p));
      }
    }
  }
  return out;
}

/** Whether `team` sees the tile. Computes the whole sight; ask `visibleTiles` once when several tiles are needed. */
export const isVisible = (data: GameData, s: BattleState, team: BattleUnit['team'], pos: Pos): boolean =>
  visibleTiles(data, s, team).has(posKey(pos));

/** A unit `team` sees: its own side's units always, the others on a seen tile. */
const unitSeen = (u: BattleUnit, team: BattleUnit['team'], seen: ReadonlySet<string>): boolean =>
  !u.pos || !!u.gone || isAlly(u.team, team) || seen.has(posKey(u.pos));

/**
 * The state as `team` sees it: units of other sides on tiles it does not see, and loot there, are missing. The board, the
 * previews and the action lists of the UI are built on this copy, so nothing hidden can show up there. The state itself is
 * untouched; without fog the state is returned as it is.
 */
export function visibleState(data: GameData, s: BattleState, team: BattleUnit['team']): BattleState {
  if (!fogOn(data, s)) return s;
  const seen = visibleTiles(data, s, team);
  return { ...s, units: s.units.filter((u) => unitSeen(u, team, seen)), loot: s.loot.filter((l) => seen.has(posKey(l.at))) };
}

/**
 * The fields the fog covers, for the board: `fog` lies fully under fog, `edge` is the fringe of covered fields next to a seen
 * one (drawn lighter, so the fog fades out over one field). Empty lists when everything is seen.
 */
export function fogBands(s: Pick<BattleState, 'width' | 'height'>, seen: ReadonlySet<string>): { fog: Pos[]; edge: Pos[] } {
  const fog: Pos[] = [];
  const edge: Pos[] = [];
  const has = (x: number, y: number) => x >= 0 && y >= 0 && x < s.width && y < s.height && seen.has(`${x},${y}`);
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      if (has(x, y)) continue;
      if (has(x - 1, y) || has(x + 1, y) || has(x, y - 1) || has(x, y + 1)) edge.push([x, y]);
      else fog.push([x, y]);
    }
  }
  return { fog, edge };
}

/**
 * The events the player's side may see played (story 2.6): the UI runs the events of a command through this before
 * `board.play`, and the state the board syncs to is `visibleState`. It only changes what is played, never the state, the log or
 * the replay. `before` is the state before the command; a tile counts as seen when it was seen before or after it.
 *
 * Own and allied units are always shown. For others, by what happens:
 * - `moved`: the path is cut to the part on seen tiles. A foe that comes out of the fog is let in with a `spawned` event on its
 *   first seen tile; one that walks into the fog is faded out with `retreated` after its last seen tile; one that stays in the
 *   fog is not shown at all.
 * - `combat`, `strike`, `combatEnd`: a fight with one seen fighter shows. The other one is let in with `spawned` on its tile when
 *   the fight begins and faded out with `retreated` when it ends, so it is on the board for the duration of the fight only. A
 *   fight between two fighters in the fog is dropped.
 * - `ambush`: the foe that stopped the player's unit is let in with `spawned` and stays (it is next to the unit).
 * - `quote` of an unseen unit becomes a `dialogue` (no speech bubble, so the camera does not move to it).
 * - events of an unseen unit (`aiTurn`, `status`, `damage`, `died`, `fled`, ...) and on unseen tiles (`terrain`, `lootDropped`) are dropped.
 * Everything else (phase, gold, objectives, battle end, ...) stays.
 */
export function filterEvents(data: GameData, s: BattleState, events: GameEvent[], team: BattleUnit['team'], before?: BattleState): GameEvent[] {
  if (!fogOn(data, s)) return events;
  const seen = visibleTiles(data, s, team);
  if (before) for (const k of visibleTiles(data, before, team)) seen.add(k);
  const start = before ?? s;
  const teams = new Map<string, BattleUnit['team']>();
  for (const u of [...start.units, ...s.units]) teams.set(u.uid, u.team);
  const where = new Map<string, Pos | null>(start.units.map((u) => [u.uid, u.pos]));
  // the units the board holds now: those the UI showed (`visibleState`), kept up to date as the events let units in and out
  const board = new Set(visibleState(data, start, team).units.filter(onMap).map((u) => u.uid));
  const mine = (uid: string) => {
    const t = teams.get(uid);
    return t === undefined || isAlly(t, team);
  };
  const shown = (uid: string) => {
    if (mine(uid)) return true;
    const p = where.get(uid);
    return !!p && seen.has(posKey(p));
  };
  // foes let in for the length of a fight
  const guests = new Set<string>();
  const out: GameEvent[] = [];
  for (const e of events) {
    switch (e.t) {
      case 'moved': {
        const end = e.path[e.path.length - 1];
        if (end) where.set(e.unit, end);
        if (mine(e.unit)) {
          out.push(e);
          break;
        }
        const flags = e.path.map((p) => seen.has(posKey(p)));
        const first = flags.indexOf(true);
        const last = flags.lastIndexOf(true);
        if (first < 0) break;
        const path = e.path.slice(first, last + 1);
        if (!board.has(e.unit)) {
          // comes out of the fog; a foe that ends in the fog is never shown
          if (last < e.path.length - 1) break;
          out.push({ t: 'spawned', unit: e.unit, reinforcement: false, at: path[0]! });
          board.add(e.unit);
        }
        if (path.length >= 2) out.push({ t: 'moved', unit: e.unit, path });
        if (last < e.path.length - 1) {
          out.push({ t: 'retreated', unit: e.unit });
          board.delete(e.unit);
        }
        break;
      }
      case 'combat':
        if (shown(e.attacker) || shown(e.defender)) {
          for (const uid of [e.attacker, e.defender]) {
            const p = where.get(uid);
            if (board.has(uid) || mine(uid) || !p) continue;
            out.push({ t: 'spawned', unit: uid, reinforcement: false, at: p });
            board.add(uid);
            guests.add(uid);
          }
          out.push(e);
        }
        break;
      case 'combatEnd':
        if ((board.has(e.attacker) || mine(e.attacker)) && (board.has(e.defender) || mine(e.defender))) {
          out.push(e);
          for (const uid of [e.attacker, e.defender]) {
            if (!guests.delete(uid)) continue;
            out.push({ t: 'retreated', unit: uid });
            board.delete(uid);
          }
        }
        break;
      case 'strike':
        if ((board.has(e.attacker) || mine(e.attacker)) && (board.has(e.defender) || mine(e.defender))) out.push(e);
        else if (shown(e.defender) && e.hit) out.push({ t: 'damage', unit: e.defender, amount: e.dmg, hpAfter: e.hpAfter, cause: 'item' });
        break;
      case 'ambush': {
        const p = where.get(e.by);
        if (p && !board.has(e.by)) {
          out.push({ t: 'spawned', unit: e.by, reinforcement: false, at: p });
          board.add(e.by);
        }
        out.push(e);
        break;
      }
      case 'knockback':
        where.set(e.unit, e.to);
        if (shown(e.unit)) out.push(e);
        break;
      case 'terrain':
      case 'lootDropped':
        if (seen.has(posKey(e.at))) out.push(e);
        break;
      case 'spawned': {
        const p = s.units.find((u) => u.uid === e.unit)?.pos;
        if (p) where.set(e.unit, p);
        if (mine(e.unit) || (p && seen.has(posKey(p)))) {
          out.push(e);
          board.add(e.unit);
        }
        break;
      }
      case 'quote':
        out.push(shown(e.unit) ? e : { t: 'dialogue', id: e.id });
        break;
      case 'aiTurn':
      case 'status':
      case 'damage':
      case 'heal':
      case 'downed':
      case 'bleed':
      case 'died':
      case 'fled':
      case 'retreated':
      case 'rescued':
      case 'escaped':
      case 'exp':
      case 'levelUp':
      case 'mastered':
      case 'loot':
      case 'visited':
      case 'opened':
      case 'razed':
      case 'recruited':
      case 'exhausted':
      case 'refreshed':
      case 'rally':
      case 'classAction':
      case 'itemUsed':
      case 'equipped':
      case 'stolen':
      case 'seized':
      case 'promoted':
        if (shown(e.unit)) out.push(e);
        break;
      default:
        out.push(e);
    }
  }
  return out;
}
