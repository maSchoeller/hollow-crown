/**
 * Testlabor M1: the questions `pnpm lab` asks of a scenario's battle, as plain functions that return data (the CLI formats them, tests
 * assert on them). Every answer comes from the core's own code: `forecast` and `applyCommand` for attacks, `reachable` for ways,
 * `endPhase` for the enemy phase, `autoplay` for the rest of the battle. Deterministic: the same state and seed give the same answer.
 */
import {
  applyCommand,
  autoplay,
  clone,
  forecast,
  isHazard,
  moveBudget,
  pathTo,
  posKey,
  reachable,
  seedRng,
  sideObjectiveDone,
  terrainAt,
  type BattleState,
  type BattleUnit,
  type Forecast,
  type GameData,
  type Pos,
} from '../core';
import { LabError, unitIds } from './scenario';

/** A unit on the board by uid, id or character id. */
export function labUnit(s: BattleState, ref: string): BattleUnit {
  const u = s.units.find((x) => x.uid === ref) ?? s.units.find((x) => x.id === ref) ?? s.units.find((x) => x.charId === ref);
  if (!u || !u.pos || u.gone) throw new LabError(`no unit "${ref}" on the board; valid: ${unitIds(s).join(', ')}`);
  return u;
}

export interface AttackOutcome {
  /** the core's preview, the same numbers the game shows */
  forecast: Forecast;
  /** resolved with `applyCommand` over `seeds` seeds: share of runs in which the target / the attacker went down (0 HP, downed or dead) */
  targetFalls: number;
  attackerFalls: number;
  seeds: number;
}

function falls(s: BattleState, uid: string): boolean {
  const u = s.units.find((x) => x.uid === uid);
  return !u || u.hp <= 0 || u.downed || u.gone === 'dead' || u.gone === 'fled';
}

/**
 * `attacker` attacks `target` from where it stands (or from `from`, as the preview of a move): the forecast and how often each side
 * falls when the attack is resolved for real with `seeds` seeds (counter included; crits and skills as the game rolls them).
 */
export function labAttack(data: GameData, s: BattleState, attacker: string, target: string, opts: { from?: Pos; seeds?: number } = {}): AttackOutcome {
  const a = labUnit(s, attacker);
  const d = labUnit(s, target);
  const from = opts.from ?? a.pos!;
  const f = forecast(data, s, a.uid, d.uid, undefined, from);
  const seeds = opts.seeds ?? 200;
  let tf = 0;
  let af = 0;
  if (f.attacker.canStrike) {
    for (let i = 0; i < seeds; i++) {
      const st = clone(s);
      const u = st.units.find((x) => x.uid === a.uid)!;
      // the question is the exchange: the attacker may act, in its own side's phase (an enemy attack is resolved in the enemy phase)
      st.phase = u.team;
      u.acted = false;
      u.moved = false;
      st.rng = seedRng(i + 1);
      const r = applyCommand(data, st, { type: 'act', unit: a.uid, to: from, action: { kind: 'attack', target: d.uid } });
      if (falls(r.state, d.uid)) tf++;
      if (falls(r.state, a.uid)) af++;
    }
  }
  return { forecast: f, targetFalls: tf / seeds, attackerFalls: af / seeds, seeds };
}

export interface PathStep {
  pos: Pos;
  terrain: string;
  /** movement cost to here */
  cost: number;
  hazard: boolean;
}

export interface PathAnswer {
  unit: string;
  from: Pos;
  to: Pos;
  /** the way the core's search picks (also beyond this turn's movement), empty when the tile cannot be reached at all */
  path: PathStep[];
  cost: number | null;
  /** movement points this turn */
  budget: number;
  /** the target is within this turn's movement */
  thisTurn: boolean;
  /** harmful tiles (burning) entered on the way */
  hazards: Pos[];
}

/** The way of `unit` to `to` as the game's own search finds it (`reachable` + `pathTo`), with costs and the burning tiles on it. */
export function labPath(data: GameData, s: BattleState, unit: string, to: Pos): PathAnswer {
  const u = labUnit(s, unit);
  if (to[0] < 0 || to[1] < 0 || to[0] >= s.width || to[1] >= s.height) throw new LabError(`tile ${to.join(',')} is outside the ${s.width}×${s.height} map`);
  const budget = moveBudget(data, s, u);
  const far = reachable(data, s, u, undefined, 999);
  const raw = pathTo(far, to);
  const path = raw.map((p) => ({ pos: p, terrain: terrainAt(s, p), cost: far.get(posKey(p))!.cost, hazard: isHazard(s, p) }));
  const cost = path.length ? path[path.length - 1]!.cost : null;
  return {
    unit: u.uid,
    from: u.pos!,
    to,
    path,
    cost,
    budget,
    thisTurn: cost !== null && cost <= budget,
    hazards: path.slice(1).filter((p) => p.hazard).map((p) => p.pos),
  };
}

export interface UnitChange {
  uid: string;
  team: string;
  from: Pos | null;
  to: Pos | null;
  hpBefore: number;
  hpAfter: number;
  fell: boolean;
}

export interface EnemyPhaseAnswer {
  turn: number;
  outcome: BattleState['outcome'];
  /** every unit whose place or HP changed */
  changes: UnitChange[];
  state: BattleState;
}

/** Ends the player's phase as it stands: the enemy (and third-party) phase plays in the core with the scenario's seed. */
export function labEnemyPhase(data: GameData, s: BattleState): EnemyPhaseAnswer {
  const r = applyCommand(data, s, { type: 'endPhase' });
  const changes: UnitChange[] = [];
  for (const before of s.units) {
    if (!before.pos || before.gone) continue;
    const after = r.state.units.find((x) => x.uid === before.uid);
    const to = after && !after.gone ? after.pos : null;
    const hpAfter = after?.hp ?? 0;
    const moved = !to || to[0] !== before.pos[0] || to[1] !== before.pos[1];
    if (!moved && hpAfter === before.hp) continue;
    changes.push({ uid: before.uid, team: before.team, from: before.pos, to, hpBefore: before.hp, hpAfter, fell: falls(r.state, before.uid) });
  }
  return { turn: r.state.turn, outcome: r.state.outcome, changes, state: r.state };
}

export interface PlayRun {
  seed: number;
  outcome: 'victory' | 'defeat' | 'timeout';
  turns: number;
  fallen: string[];
  side: Record<string, boolean>;
}

/** Autoplay (both sides) from the scenario's situation to the end, once per seed `seed … seed + runs − 1`. */
export function labPlay(data: GameData, s: BattleState, runs: number, seed: number): PlayRun[] {
  const map = data.maps[s.mapId]!;
  const out: PlayRun[] = [];
  for (let i = 0; i < runs; i++) {
    const st = clone(s);
    st.rng = seedRng(seed + i);
    const end = autoplay(data, st).state;
    const victory = end.outcome === 'victory';
    out.push({
      seed: seed + i,
      outcome: end.outcome ?? 'timeout',
      turns: end.turn,
      fallen: end.units.filter((u) => u.team === 'player' && (u.gone === 'dead' || u.downed)).map((u) => u.uid),
      side: Object.fromEntries(map.objectives.side.map((o) => [o.id, victory && sideObjectiveDone(data, end, o)])),
    });
  }
  return out;
}
