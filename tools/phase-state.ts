/**
 * Story 15.11: the battle state right before the longest enemy phase of a story mission, for the browser measurement of that phase
 * (`PERF_PHASE=<file> pnpm perf`, tests/perf/perf.spec.ts). Plays the act chained as `pnpm sim --campaign` does and keeps, over all
 * runs, the first attempt's phase with the longest plan for „Gemeinsam“ (before the time budget).
 *
 *   pnpm tsx tools/phase-state.ts m1_8 [--runs 3] [--seed 1] [--difficulty normal] [--out .phase/m1_8.json]
 *
 * Story 11.26: a node of a later act (`m2_8`) plays that act; the acts before it are skipped (`--start expected`, as
 * `pnpm sim --campaign act2 --start expected`), `--start chained` plays them first. `--lost` keeps lost first attempts too.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { applyCommand, autoplay, beginBattle, type BattleState, type Difficulty } from '../src/core';
import { loadContentFromDisk } from '../src/content/node';
import { aiPhaseTimes } from './enemyPhase';
import { prepareActData, simulateCampaign } from './simCampaign';

const args = process.argv.slice(2);
const opt = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
};
const node = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) ?? 'm1_8';
const out = opt('out', `.phase/${node}.json`);
// story 11.26: `--lost` also takes first attempts that were lost (a mission not tuned yet still has its heavy early phases)
const lost = args.includes('--lost');
const { data: disk } = loadContentFromDisk();

let best: { state: BattleState; march: number; shown: number; turn: number; run: number } | null = null;
// story 11.26: the act whose campaign holds the node
const act = Number(Object.entries(disk.acts).find(([, a]) => a.nodes.some((n) => n.id === node))?.[0]);
if (!act) throw new Error(`no node ${node} in any act`);
const difficulty = opt('difficulty', 'normal') as Difficulty;
const acts = act > 1 ? { act, start: opt('start', 'expected') as 'chained' | 'expected' } : {};
// a later act is opened for the run as `pnpm sim --campaign actN` does (act 1 comes back unchanged)
const data = prepareActData(disk, { ...acts, difficulty, deathMode: 'standard' });
simulateCampaign(data, {
  ...acts,
  runs: Number(opt('runs', '3')),
  seed: Number(opt('seed', '1')),
  difficulty,
  deathMode: 'standard',
  onMission: (id, c, run) => {
    if (id !== node) return;
    // the first attempt, as the simulation plays it
    let state = beginBattle(
      data,
      c,
      id,
      c.roster.map((u) => u.id),
    ).state;
    const { log, state: end } = autoplay(data, state);
    if (end.outcome !== 'victory' && !lost) return; // the simulation counts the phases of first attempts won only (`--lost`: all)
    for (const cmd of log) {
      if (cmd.type === 'endPhase') {
        const r = applyCommand(data, state, cmd);
        const teams = new Map([...state.units, ...r.state.units].map((u) => [u.uid, u.team]));
        const [p] = aiPhaseTimes(data, r.events, (uid) => teams.get(uid));
        if (p && (!best || p.march > best.march)) best = { state, march: p.march, shown: p.shown, turn: p.turn, run };
        state = r.state;
      } else state = applyCommand(data, state, cmd).state;
    }
  },
});
if (!best) throw new Error(`no enemy phase of ${node} (not reached?)`);
const b = best as { state: BattleState; march: number; shown: number; turn: number; run: number };
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify({
    node,
    run: b.run,
    turn: b.turn,
    planMarchMs: Math.round(b.march),
    planShownMs: Math.round(b.shown),
    state: b.state,
  }),
);
console.log(
  `${node}: longest enemy phase in run ${b.run}, turn ${b.turn}: plan ${(b.march / 1000).toFixed(1)} s, shown ${(b.shown / 1000).toFixed(1)} s → ${out}`,
);
