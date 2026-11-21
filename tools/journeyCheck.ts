/**
 * Reading the play history of a save (concept/24-architecture §6.2b) behind `pnpm journey`: one row per battle record, a
 * summary (levels per map, time to level) and the replay check of the stored battle logs. Pure functions, so tests can use them.
 */
import { applyCommand, stateHash, type BattleRecord, type BattleState, type GameData, type PlayHistory } from '../src/core';
import { checkBattle, type ReplayCheck } from './reportCheck';

export interface JourneyRow {
  n: number;
  node: string;
  haunt?: string;
  map: string;
  attempt: number;
  result: BattleRecord['outcome'];
  rounds: number | null;
  /** army level before the battle and the level the node expects */
  army: number;
  expected: number | null;
  /** levels the deployed units gained in the battle (sum) */
  levels: number;
  ep: number;
  /** gold change of the battle (rewards) */
  gold: number;
  /** gold change of the camp actions before the battle, and how many there were */
  campGold: number;
  campActions: number;
  turnRestarts: number;
  downs: number | null;
  fallen: string[];
  side: number;
}

export function journeyRows(h: PlayHistory): JourneyRow[] {
  return h.battles.map((b) => ({
    n: b.n,
    node: b.node,
    ...(b.haunt ? { haunt: b.haunt } : {}),
    map: b.map,
    attempt: b.attempt,
    result: b.outcome,
    rounds: b.rounds,
    army: b.army,
    expected: b.expected,
    levels: b.units.reduce((n, u) => n + (u.levelAfter - u.level), 0),
    ep: b.ep,
    gold: b.goldAfter - b.goldBefore,
    campGold: b.camp.reduce((n, a) => n + a.gold, 0),
    campActions: b.camp.length,
    turnRestarts: b.turnRestarts,
    downs: b.downs,
    fallen: b.fallen,
    side: b.side.length,
  }));
}

export interface JourneySummary {
  since: PlayHistory['since'];
  battles: number;
  outcomes: Record<string, number>;
  turnRestarts: number;
  /** per map: attempts, victories, levels gained, gold of the battles */
  maps: Record<string, { attempts: number; victories: number; levels: number; gold: number }>;
  /** the first record whose army level (before the battle) reached each whole level */
  timeToLevel: Array<{ level: number; battle: number; node: string }>;
  /** camp: gold spent and gained, actions per command */
  camp: { spent: number; gained: number; actions: Record<string, number> };
  /** camp actions after the last battle */
  pendingCamp: number;
}

export function journeySummary(h: PlayHistory): JourneySummary {
  const outcomes: Record<string, number> = {};
  const maps: JourneySummary['maps'] = {};
  const actions: Record<string, number> = {};
  const timeToLevel: JourneySummary['timeToLevel'] = [];
  let spent = 0;
  let gained = 0;
  let turnRestarts = h.turnRestarts;
  let reached = 0;
  for (const b of h.battles) {
    outcomes[b.outcome] = (outcomes[b.outcome] ?? 0) + 1;
    const m = (maps[b.map] ??= { attempts: 0, victories: 0, levels: 0, gold: 0 });
    m.attempts++;
    if (b.outcome === 'victory') m.victories++;
    m.levels += b.units.reduce((n, u) => n + (u.levelAfter - u.level), 0);
    m.gold += b.goldAfter - b.goldBefore;
    turnRestarts += b.turnRestarts;
    for (const a of b.camp) {
      actions[a.cmd] = (actions[a.cmd] ?? 0) + 1;
      if (a.gold < 0) spent -= a.gold;
      else gained += a.gold;
    }
    for (let l = reached + 1; l <= Math.floor(b.army); l++) timeToLevel.push({ level: l, battle: b.n, node: b.node });
    reached = Math.max(reached, Math.floor(b.army));
  }
  return { since: h.since, battles: h.battles.length, outcomes, turnRestarts, maps, timeToLevel, camp: { spent, gained, actions }, pendingCamp: h.camp.length };
}

/**
 * Replays a stored battle with this checkout's content: the start must match its hash, every command must apply (checkBattle
 * of `pnpm report`), and the end must give the recorded outcome, rounds and downs.
 */
export function replayRecord(data: GameData, b: BattleRecord): ReplayCheck {
  if (!b.start || !b.commands) return { status: 'unchecked', detail: 'no battle log in the record' };
  if (stateHash(b.start) !== b.startHash) return { status: 'diverged', detail: 'start state differs from its hash' };
  const applied = checkBattle(data, { battle: { start: b.start, commands: b.commands }, trail: [] });
  if (applied.status !== 'ok') return applied;
  let s: BattleState = b.start;
  for (const c of b.commands) s = applyCommand(data, s, c).state;
  const outcome = s.outcome ?? 'unfinished';
  if (outcome !== b.outcome) return { status: 'diverged', detail: `replay ends in ${outcome}, the record says ${b.outcome}` };
  if (s.turn !== b.rounds || s.stats.downs !== b.downs) return { status: 'diverged', detail: `replay: ${s.turn} rounds, ${s.stats.downs} downs; record: ${b.rounds}, ${b.downs}` };
  return { status: 'ok', detail: `${b.commands.length} commands replay to ${outcome} in ${s.turn} rounds` };
}
