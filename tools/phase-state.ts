/**
 * Story 15.11: the battle state right before the longest enemy phase of a story mission, for the browser measurement of that phase
 * (`PERF_PHASE=<file> pnpm perf`, tests/perf/perf.spec.ts). Plays the act chained as `pnpm sim --campaign` does and keeps, over all
 * runs, the first attempt's phase with the longest plan for „Gemeinsam“ (before the time budget).
 *
 *   pnpm tsx tools/phase-state.ts m1_8 [--runs 3] [--seed 1] [--difficulty normal] [--out .phase/m1_8.json]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { applyCommand, autoplay, beginBattle, type BattleState, type Difficulty } from '../src/core';
import { loadContentFromDisk } from '../src/content/node';
import { aiPhaseTimes } from './enemyPhase';
import { simulateCampaign } from './simCampaign';

const args = process.argv.slice(2);
const opt = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
};
const node = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) ?? 'm1_8';
const out = opt('out', `.phase/${node}.json`);
const { data } = loadContentFromDisk();

let best: { state: BattleState; march: number; shown: number; turn: number; run: number } | null = null;
simulateCampaign(data, {
  runs: Number(opt('runs', '3')),
  seed: Number(opt('seed', '1')),
  difficulty: opt('difficulty', 'normal') as Difficulty,
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
    if (end.outcome !== 'victory') return; // the simulation counts the phases of first attempts won only
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
