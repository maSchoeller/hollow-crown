import type { GameData, MapDef, MapUnitDef, Pos, SideObjectiveDef, Team, TriggerDef, WeaponType } from '../defs';
import type { GameEvent } from '../events';
import { burningTileHit } from '../rules/effects';
import type { BattleState, BattleUnit } from '../state';
import { active, findUnit, inArea, inBounds, neighbors, onDifficulty, onMap, unitAt } from '../util';
import { battleUnitFromPlan } from './create';
import { noteLieutenantSight } from './lieutenantSight';

export function mapOf(data: GameData, s: BattleState): MapDef {
  return data.maps[s.mapId]!;
}

function endBattle(s: BattleState, outcome: 'victory' | 'defeat', events: GameEvent[], reason?: string): void {
  if (s.outcome) return;
  s.outcome = outcome;
  if (outcome === 'defeat' && reason) s.defeatReason = reason;
  events.push({ t: 'battleEnd', outcome, reason });
}

/** Checks victory/defeat conditions (concept/06 §5). `phaseStart` is set when a new round begins. */
export function checkObjectives(data: GameData, s: BattleState, events: GameEvent[], phaseStart = false): void {
  if (s.outcome) return;
  const map = mapOf(data, s);
  for (const d of map.objectives.defeat) {
    if (d.type === 'unit_dies') {
      const u = findUnit(s, d.unit);
      if (u && (u.gone === 'dead' || (u.team !== 'player' && u.downed))) return endBattle(s, 'defeat', events, d.unit);
    } else if (d.type === 'turn_limit' && phaseStart && s.turn > d.turns) return endBattle(s, 'defeat', events, 'turns');
  }
  const v = map.objectives.victory;
  switch (v.type) {
    case 'rout':
      if (!s.units.some((u) => u.team === 'enemy' && onMap(u) && !u.ignoreForRout)) endBattle(s, 'victory', events);
      break;
    case 'boss': {
      const b = findUnit(s, v.unit);
      if (!b || b.gone === 'dead' || b.gone === 'fled' || b.team !== 'enemy') endBattle(s, 'victory', events);
      break;
    }
    case 'reach': {
      const ok = s.units.some(
        (u) => u.team === 'player' && active(u) && u.pos && inArea(v.area, u.pos) && (!v.unit || u.id === v.unit),
      );
      if (ok) endBattle(s, 'victory', events);
      break;
    }
    case 'defend':
    case 'survive':
      if ((phaseStart && s.turn > v.turns) || noFoesToCome(map, s)) endBattle(s, 'victory', events);
      break;
    case 'escape': {
      const left = s.units.filter((u) => u.team === 'player' && onMap(u) && !u.downed);
      const escaped = s.units.filter((u) => u.team === 'player' && u.gone === 'escaped').length;
      if (left.length === 0 && escaped >= (v.min ?? 1)) endBattle(s, 'victory', events);
      break;
    }
    case 'seize':
      break; // resolved by the seize action
    case 'escort': {
      // story 4.8: the NPC leaves the map on the exit (profile `follow`); its fall (downed counts, it is not a player) loses
      const npc = findUnit(s, v.unit);
      if (!npc) break; // not on the map yet (spawned later)
      if (npc.gone === 'dead' || npc.downed) return endBattle(s, 'defeat', events, v.unit);
      if (npc.gone === 'escaped' || (onMap(npc) && inArea(v.area, npc.pos!))) endBattle(s, 'victory', events);
      break;
    }
    case 'treasure': {
      const { have, total } = chestProgress(s, v.chests);
      if (have >= total) endBattle(s, 'victory', events);
      else if (phaseStart && s.turn > v.turns) endBattle(s, 'defeat', events, 'turns');
      break;
    }
  }
}

const PHASE_ORDER: Record<Team, number> = { player: 0, enemy: 1, other: 2 };

/** Whether (turn, phase) still lies ahead of the battle clock, the phase in progress included. */
function notPast(s: BattleState, turn: number, phase: Team): boolean {
  return turn > s.turn || (turn === s.turn && PHASE_ORDER[phase] >= PHASE_ORDER[s.phase]);
}

/**
 * True when `defend`/`survive` is decided before the round limit: no foe stands on the map (as for `rout`), no reinforcement wave
 * is still due and no spawn trigger can still fire, so the empty rounds up to the limit would only be skipped. Triggers on events
 * (unit enters, dies, ...) count as able to fire as long as they have not; only a timed one whose round has passed cannot.
 */
function noFoesToCome(map: MapDef, s: BattleState): boolean {
  if (s.units.some((u) => u.team === 'enemy' && onMap(u) && !u.ignoreForRout)) return false;
  const waveDue = map.reinforcements.some((r, i) => !s.reinforcementsDone.includes(i) && notPast(s, r.turn, r.phase));
  if (waveDue) return false;
  return !map.triggers.some(
    (t) =>
      t.then.some((a) => a.action === 'spawn') &&
      !((t.once ?? true) && s.firedTriggers.includes(t.id)) &&
      (t.when.type !== 'turn_start' || notPast(s, t.when.turn, t.when.phase)),
  );
}

/** "have of total" for the chests of a `treasure` goal: open means recovered (story 4.8); a missing object counts as not recovered. */
export function chestProgress(s: BattleState, chests: string[]): { have: number; total: number } {
  const have = chests.filter((id) => s.objects.some((o) => o.id === id && o.state === 'open')).length;
  return { have, total: chests.length };
}

/** Name key of a unit of the map by its id (map `nameKey`, else the character's name, else `unit.<id>.name`), for goal texts that name someone. */
export function mapUnitNameKey(map: MapDef, id: string): string {
  const def = map.units.find((u) => u.id === id);
  return def?.nameKey ?? `unit.${def?.char ?? id}.name`;
}

/** What a side objective's text names: the unit (`recruit`, `protect_npc`) as name key and the weapon group (`kill_with`). */
export function sideSubject(map: MapDef, o: SideObjectiveDef): { nameKey?: string; weaponType?: WeaponType } {
  return { ...(o.unit ? { nameKey: mapUnitNameKey(map, o.unit) } : {}), ...(o.weaponType ? { weaponType: o.weaponType } : {}) };
}

export function sideObjectiveDone(data: GameData, s: BattleState, o: SideObjectiveDef): boolean {
  const map = mapOf(data, s);
  switch (o.type) {
    case 'visit_villages': {
      const villages = map.objects.filter((x) => x.type === 'village').map((x) => x.id);
      return villages.every((id) => s.stats.villagesVisited.includes(id));
    }
    case 'open_chests': {
      const chests = map.objects.filter((x) => x.type === 'chest').map((x) => x.id);
      return chests.every((id) => s.stats.chestsOpened.includes(id));
    }
    case 'no_downs':
      return s.stats.downs === 0;
    case 'turn_limit':
      return s.turn <= (o.turns ?? Infinity);
    case 'kill_with':
      return s.stats.bossKilledWith === o.weaponType;
    case 'recruit':
      return !!o.unit && s.stats.recruited.includes(o.unit);
    case 'protect_npc': {
      const u = o.unit ? findUnit(s, o.unit) : undefined;
      return !!u && u.gone !== 'dead';
    }
  }
  return false;
}

/** "have of total" for side objectives that count something (villages, chests); the HUD shows it as "0/1". */
export function sideObjectiveProgress(data: GameData, s: BattleState, o: SideObjectiveDef): { have: number; total: number } | undefined {
  const map = mapOf(data, s);
  const count = (type: 'village' | 'chest', done: string[]) => {
    const ids = map.objects.filter((x) => x.type === type).map((x) => x.id);
    return { have: ids.filter((id) => done.includes(id)).length, total: ids.length };
  };
  if (o.type === 'visit_villages') return count('village', s.stats.villagesVisited);
  if (o.type === 'open_chests') return count('chest', s.stats.chestsOpened);
  return undefined;
}

/**
 * The places a side objective points at that are still open (HUD: the player taps the objective and the board marks them): the
 * houses not visited yet, the closed chests, the unit to recruit or protect and the boss of a `kill_with`. Units count only when
 * they stand on the (visible) map. Empty for objectives without a place (`no_downs`, `turn_limit`) and for finished ones.
 */
export function sideObjectiveSpots(data: GameData, s: BattleState, o: SideObjectiveDef): Pos[] {
  // protect_npc counts as done while the unit lives (a keep-it-so goal), yet its place is what the player wants to see
  if (o.type !== 'protect_npc' && sideObjectiveDone(data, s, o)) return [];
  const where = (id: string | undefined): Pos[] => {
    const u = id ? findUnit(s, id) : undefined;
    return u && u.pos && onMap(u) ? [u.pos] : [];
  };
  switch (o.type) {
    case 'visit_villages':
      return s.objects.filter((x) => x.type === 'village' && x.state === 'closed').map((x) => x.at);
    case 'open_chests':
      return s.objects.filter((x) => x.type === 'chest' && x.state === 'closed').map((x) => x.at);
    case 'recruit':
    case 'protect_npc':
      return where(o.unit);
    case 'kill_with': {
      const v = mapOf(data, s).objectives.victory;
      return v.type === 'boss' ? where(v.unit) : [];
    }
    default:
      return [];
  }
}

/** Spawns map-defined units near their position if the tile is taken. */
export function spawnUnits(data: GameData, s: BattleState, defs: MapUnitDef[], reinforcement: boolean, events: GameEvent[]): void {
  const pct = data.balance.difficulty[s.settings.difficulty].enemyStatPercent;
  for (const def of onDifficulty(defs, s.settings.difficulty)) {
    // a lieutenant is built from the plan of the battle start; one who joined the company is not in it and stays off the board
    const known = !!def.lieutenant && !!data.lieutenants?.[def.lieutenant];
    const plan = known && s.lieutenantPlan ? s.lieutenantPlan[def.lieutenant!] : undefined;
    if (known && s.lieutenantPlan && !plan) continue;
    const at = freeTileNear(s, def.at);
    if (!at) continue;
    const uid = def.id ?? `r${s.nextUid++}`;
    const u = battleUnitFromPlan(data, { ...def, at }, s, def.team === 'enemy' ? pct : 0, uid, plan);
    if (def.team === s.phase && !(reinforcement && data.balance.difficulty[s.settings.difficulty].ambushReinforcements)) {
      u.acted = true;
    }
    s.units.push(u);
    events.push({ t: 'spawned', unit: u.uid, reinforcement });
  }
  noteLieutenantSight(data, s);
}

export function freeTileNear(s: BattleState, p: Pos): Pos | null {
  const seen = new Set<string>();
  const queue: Pos[] = [p];
  while (queue.length) {
    const c = queue.shift()!;
    const k = `${c[0]},${c[1]}`;
    if (seen.has(k) || !inBounds(s, c)) continue;
    seen.add(k);
    if (!unitAt(s, c) && s.terrain[c[1] * s.width + c[0]] !== 'wall') return c;
    queue.push(...neighbors(c));
  }
  return null;
}

export function runReinforcements(data: GameData, s: BattleState, events: GameEvent[]): void {
  mapOf(data, s).reinforcements.forEach((r, i) => {
    if (s.reinforcementsDone.includes(i) || r.turn !== s.turn || r.phase !== s.phase) return;
    s.reinforcementsDone.push(i);
    spawnUnits(data, s, r.units, true, events);
  });
}

function whenMatches(s: BattleState, t: TriggerDef, ctx: TriggerCtx): boolean {
  const w = t.when;
  switch (w.type) {
    case 'turn_start':
      return ctx.kind === 'phase' && s.turn === w.turn && s.phase === w.phase;
    case 'unit_enters':
      return (
        ctx.kind === 'moved' &&
        !!ctx.unit?.pos &&
        inArea(w.area, ctx.unit.pos) &&
        (!w.team || ctx.unit.team === w.team) &&
        (!w.unit || ctx.unit.id === w.unit)
      );
    case 'unit_dies': {
      const u = findUnit(s, w.unit);
      return !!u && u.gone === 'dead';
    }
    case 'object_destroyed':
      return s.objects.some((o) => o.id === w.object && o.state === 'razed');
    case 'object_activated':
      return s.objects.some((o) => o.id === w.object && (o.state === 'open' || o.state === 'visited'));
    case 'talked':
      return s.stats.recruited.includes(w.unit);
    case 'hp_below': {
      const u = findUnit(s, w.unit);
      return !!u && onMap(u) && u.hp > 0 && (u.hp * 100) / Math.max(1, u.stats.hp) < w.percent;
    }
  }
}

export interface TriggerCtx {
  kind: 'phase' | 'moved' | 'action';
  unit?: BattleUnit;
}

export function runTriggers(data: GameData, s: BattleState, ctx: TriggerCtx, events: GameEvent[]): void {
  for (const t of mapOf(data, s).triggers) {
    if ((t.once ?? true) && s.firedTriggers.includes(t.id)) continue;
    if (!whenMatches(s, t, ctx)) continue;
    s.firedTriggers.push(t.id);
    for (const a of t.then) {
      if (a.action === 'dialogue') {
        const on = a.onBoard ? findUnit(s, a.onBoard) : undefined;
        if (!a.onBoard || (on && on.pos && !on.gone)) events.push({ t: 'dialogue', id: a.id });
      } else if (a.action === 'set_flag') {
        if (!s.flags.includes(a.flag)) s.flags.push(a.flag);
      } else if (a.action === 'set_ai') {
        for (const id of a.units) {
          const u = findUnit(s, id);
          if (u?.ai) {
            u.ai.profile = a.profile;
            u.ai.awake = true;
          }
        }
      } else if (a.action === 'spawn') spawnUnits(data, s, a.units, true, events);
    }
  }
}

/** Common bookkeeping at the start of a team's phase. */
export function beginPhase(data: GameData, s: BattleState, team: Team, events: GameEvent[]): void {
  s.phase = team;
  for (const u of s.units) {
    if (u.team !== team) continue;
    u.acted = false;
    u.moved = false;
    u.freeUsed = {};
  }
  events.push({ t: 'phase', phase: team, turn: s.turn });
  runReinforcements(data, s, events);
  runTriggers(data, s, { kind: 'phase' }, events);
}

export function afterUnitMoved(data: GameData, s: BattleState, u: BattleUnit, events: GameEvent[]): void {
  burningTileHit(data, s, u, events);
  runTriggers(data, s, { kind: 'moved', unit: u }, events);
}
