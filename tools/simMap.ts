/**
 * One mission, many runs (`pnpm sim <mapId>`): each run is a pure function of its seed (`simulateMapRun`), so the runs can go to
 * worker threads in any order and are summed up in run order afterwards (`summarizeMap`, Testlabor S1/S2).
 */
import { addToRoster, autoplay, beginBattle, finishBattle, newCampaign, sideObjectiveDone, type DeathMode, type Difficulty, type GameData } from '../src/core';
import { applyNodeRewards } from './simCampaign';

export interface MapSimOptions {
  node: string;
  difficulty: Difficulty;
  /** difficulty of the missions played before the target (chained runs) */
  chainDifficulty: Difficulty;
  deathMode: DeathMode;
  /** play the missions before the target with autoplay (default), or start with a fresh roster */
  chained: boolean;
  /** `--flag name=value` as given */
  flags: string[];
  /** `--leave` companions */
  leave: string[];
}

/** One run. `arrived` is false when a chained run lost a mission before the target. */
export interface MapRun {
  run: number;
  seed: number;
  arrived: boolean;
  outcome?: 'victory' | 'defeat' | 'timeout';
  defeatReason?: string;
  turns?: number;
  /** every fall to 0 HP during the battle (stats.downs), also those rescued later */
  downs?: number;
  /** player units down or dead at the end */
  fallen?: string[];
  /** defeat objectives about a unit that was lost */
  lost?: string[];
  villages?: number;
  recruited?: string[];
  /** side objective id → fulfilled (counts only on a victory, as in `finishBattle`) */
  side?: Record<string, boolean>;
  ms?: number;
}

const AVATAR = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;

export function campaignAt(d: GameData, seed: number, nodeId: string, difficulty: Difficulty, deathMode: DeathMode) {
  const c = newCampaign(d, seed, { difficulty, deathMode }, { ...AVATAR });
  // recruit chars who would have joined before this node
  const order = d.acts[1]!.nodes.map((n) => n.id);
  const idx = order.indexOf(nodeId);
  for (const ch of Object.values(d.chars)) {
    const j = order.indexOf(ch.joins);
    if (j >= 0 && j < idx) addToRoster(d, c, ch.id);
  }
  c.completed = order.slice(0, idx);
  return c;
}

/** Plays the campaign up to the target node with autoplay so units carry their progression; null if a mission before it is lost. */
export function campaignChained(d: GameData, seed: number, nodeId: string, difficulty: Difficulty, chainDifficulty: Difficulty, deathMode: DeathMode) {
  // the missions before the target can run on another difficulty (e.g. hard target with a normal chain, so enough runs arrive)
  let c = newCampaign(d, seed, { difficulty: chainDifficulty, deathMode }, { ...AVATAR });
  for (const n of d.acts[1]!.nodes) {
    if (n.id === nodeId) {
      c.settings.difficulty = difficulty;
      return c;
    }
    const { state } = autoplay(d, beginBattle(d, c, n.id, c.roster.map((u) => u.id)).state);
    if (state.outcome !== 'victory') return null;
    c = finishBattle(d, c, state).campaign;
    applyNodeRewards(d, c, n.id);
  }
  return c;
}

export function simulateMapRun(data: GameData, o: MapSimOptions, run: number, seed: number): MapRun {
  const c = o.chained ? campaignChained(data, seed, o.node, o.difficulty, o.chainDifficulty, o.deathMode) : campaignAt(data, seed, o.node, o.difficulty, o.deathMode);
  if (!c) return { run, seed, arrived: false };
  for (const f of o.flags) {
    const [name, value] = f.split('=');
    c.flags[name!] = value === undefined ? true : /^-?\d+$/.test(value) ? Number(value) : value;
  }
  c.roster = c.roster.filter((u) => !o.leave.includes(u.id));
  const t0 = performance.now();
  const start = beginBattle(data, c, o.node, c.roster.map((u) => u.id)).state;
  const { state } = autoplay(data, start);
  const ms = performance.now() - t0;
  const map = data.maps[state.mapId]!;
  const lost: string[] = [];
  if (state.outcome === 'defeat')
    for (const d of map.objectives.defeat) {
      const u = 'unit' in d ? state.units.find((x) => x.id === d.unit) : undefined;
      if (u && (u.downed || u.gone === 'dead')) lost.push(u.id);
    }
  const victory = state.outcome === 'victory';
  return {
    run,
    seed,
    arrived: true,
    outcome: state.outcome ?? 'timeout',
    ...(state.defeatReason ? { defeatReason: state.defeatReason } : {}),
    turns: state.turn,
    downs: state.stats.downs,
    fallen: state.units.filter((u) => u.team === 'player' && (u.gone === 'dead' || u.downed)).map((u) => u.id),
    lost,
    villages: state.stats.villagesVisited.length,
    recruited: [...state.stats.recruited],
    side: Object.fromEntries(map.objectives.side.map((s) => [s.id, victory && sideObjectiveDone(data, state, s)])),
    ms,
  };
}

/** Nearest-rank percentile of sorted values (p 0.5 is the old median `sorted[floor(n/2)]`). */
export function percentile(sorted: number[], p: number): number | null {
  return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]! : null;
}

export interface TurnStats {
  p10: number | null;
  p50: number | null;
  p90: number | null;
  /** rounds → number of won runs that took that many */
  dist: Record<string, number>;
}

export function turnStats(turns: number[]): TurnStats {
  const sorted = [...turns].sort((a, b) => a - b);
  const dist: Record<string, number> = {};
  for (const t of sorted) dist[t] = (dist[t] ?? 0) + 1;
  return { p10: percentile(sorted, 0.1), p50: percentile(sorted, 0.5), p90: percentile(sorted, 0.9), dist };
}

export interface MapSummary {
  kind: 'map';
  node: string;
  map: string;
  options: MapSimOptions & { runs: number; seed: number };
  sets: Record<string, unknown>;
  runs: number;
  /** runs that reached the target mission */
  arrived: number;
  arrivalRate: number;
  winRate: number;
  avgTurns: number | null;
  turns: TurnStats;
  avgDowns: number;
  villagesPerRun: number;
  /** player units down or dead at the end, outcomes other than victory, defeat units lost */
  causes: Record<string, number>;
  recruited: Record<string, number>;
  /** per side objective: type, runs that fulfilled it, rate over the arrived runs */
  side: Record<string, { type: string; turns?: number; done: number; rate: number }>;
  /** all side objectives in the same run */
  allSide: { done: number; rate: number } | null;
  timing: { msPerRun: number; seconds: number; workers: number };
  perRun: MapRun[];
}

/** Sums the runs in run order; the same runs give the same summary whatever order they finished in. */
export function summarizeMap(data: GameData, o: MapSimOptions & { runs: number; seed: number }, sets: Record<string, unknown>, runs: MapRun[], timing: MapSummary['timing']): MapSummary {
  const all = [...runs].sort((a, b) => a.run - b.run);
  const played = all.filter((r) => r.arrived);
  const wins = played.filter((r) => r.outcome === 'victory');
  const per = (n: number, d: number) => n / Math.max(1, d);
  const causes: Record<string, number> = {};
  const recruited: Record<string, number> = {};
  const add = (rec: Record<string, number>, k: string) => (rec[k] = (rec[k] ?? 0) + 1);
  for (const r of played) {
    for (const u of r.fallen ?? []) add(causes, u);
    if (r.outcome !== 'victory') add(causes, `outcome:${r.outcome}${r.defeatReason ? `:${r.defeatReason}` : ''}`);
    for (const u of r.lost ?? []) add(causes, `lost:${u}`);
    for (const u of r.recruited ?? []) add(recruited, u);
  }
  const node = data.acts[1]!.nodes.find((n) => n.id === o.node)!;
  const sideDefs = data.maps[node.map]!.objectives.side;
  const side = Object.fromEntries(
    sideDefs.map((s) => {
      const done = played.filter((r) => r.side?.[s.id]).length;
      return [s.id, { type: s.type, ...(s.turns !== undefined ? { turns: s.turns } : {}), done, rate: per(done, played.length) }];
    }),
  );
  const allDone = played.filter((r) => sideDefs.every((s) => r.side?.[s.id])).length;
  const winTurns = wins.map((r) => r.turns!);
  return {
    kind: 'map',
    node: node.id,
    map: node.map,
    options: o,
    sets,
    runs: all.length,
    arrived: played.length,
    arrivalRate: per(played.length, all.length),
    winRate: per(wins.length, played.length),
    avgTurns: wins.length ? per(winTurns.reduce((a, b) => a + b, 0), wins.length) : null,
    turns: turnStats(winTurns),
    avgDowns: per(played.reduce((a, r) => a + (r.downs ?? 0), 0), played.length),
    villagesPerRun: per(played.reduce((a, r) => a + (r.villages ?? 0), 0), played.length),
    causes,
    recruited,
    side,
    allSide: sideDefs.length ? { done: allDone, rate: per(allDone, played.length) } : null,
    timing,
    perRun: all,
  };
}

const pct = (x: number) => `${(x * 100).toFixed(0)} %`;

/** Text output: the three lines of before, then rounds, side objectives and a hint when few chained runs arrive. */
export function printMap(s: MapSummary): void {
  const o = s.options;
  console.log(`${s.node} (${s.map}) – ${s.arrived}/${s.runs} runs ${o.chained ? '(chained campaign)' : '(fresh roster)'}, ${o.difficulty}/${o.deathMode}`);
  console.log(
    `win rate ${pct(s.winRate)}, avg turns ${(s.avgTurns ?? 0).toFixed(1)}, median turns ${s.turns.p50 ?? '-'}, avg losses ${s.avgDowns.toFixed(2)}, avg ${s.timing.msPerRun.toFixed(0)} ms/run`,
  );
  console.log('downs/deaths:', JSON.stringify(s.causes));
  console.log(`villages/run ${s.villagesPerRun.toFixed(1)}, recruited: ${JSON.stringify(s.recruited)}`);
  const dist = Object.entries(s.turns.dist)
    .map(([t, n]) => `${t}:${n}`)
    .join(' ');
  console.log(`turns p10/p50/p90 ${s.turns.p10 ?? '-'}/${s.turns.p50 ?? '-'}/${s.turns.p90 ?? '-'} (won runs, rounds:count ${dist || '-'})`);
  const side = Object.entries(s.side).map(([id, x]) => `${id}${x.type === 'turn_limit' ? ` (≤${x.turns})` : ''} ${x.done}/${s.arrived} ${pct(x.rate)}`);
  if (side.length) console.log(`side ${side.join(', ')}; all ${s.allSide!.done}/${s.arrived} ${pct(s.allSide!.rate)} (only on victory; autoplay does not chase side objectives)`);
  if (o.chained && s.arrivalRate < 0.5)
    console.log(`only ${s.arrived} of ${s.runs} chained runs arrived (${pct(s.arrivalRate)}): try --chain easy or --fresh for more runs at the target`);
  if (Object.keys(s.sets).length) console.log(`--set ${JSON.stringify(s.sets)}`);
  console.log(`${s.timing.seconds.toFixed(1)} s with ${s.timing.workers} worker${s.timing.workers === 1 ? '' : 's'}`);
}
