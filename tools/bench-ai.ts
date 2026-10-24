/**
 * pnpm bench:ai [--runs 10] [--warmup 3] [--rounds 6]
 * Budget check for the enemy phase (NFR3, story 2.8, architecture §5.13): `applyCommand(endPhase)` on the reference
 * battle of the performance run (tests/perf/benchMap.ts, 24×32, 28 enemies) must take at most `TARGETS.aiMsPerUnit` per
 * enemy unit; the slowest measurement counts. `ch02_silverbrook` (the largest map in the content) is reported too.
 * Each run plays several rounds with an idle player, so the enemy walks up, meets the player and attacks. Exit code 1
 * when the reference battle is over budget. Runs in Node on the CI runner, the same function the worker calls.
 */
import { addToRoster, applyCommand, beginBattle, createBattle, newCampaign, startBattle, type BattleState, type GameData } from '../src/core';
import { loadContentFromDisk } from '../src/content/node';
import { BENCH_MAP_ID, benchMap } from '../tests/perf/benchMap';
import { TARGETS } from '../tests/perf/profile';

const args = process.argv.slice(2);
const opt = (name: string, def: number) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const runs = opt('runs', 10);
const warmup = opt('warmup', 3);
const rounds = opt('rounds', 6);

const { data } = loadContentFromDisk();
data.maps[BENCH_MAP_ID] = benchMap();
const first = data.campaign.nodes[0]!;
data.campaign.nodes.push({ ...first, id: 'perf', map: BENCH_MAP_ID, pre: undefined, post: undefined });

const avatar = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;
const settings = { difficulty: 'normal', deathMode: 'standard' } as const;

/** The opening state of a map, seeded; companions who joined before the node are in the roster and deployed. */
function opening(d: GameData, nodeId: string, seed: number): BattleState {
  const c = newCampaign(d, seed, settings, avatar);
  if (nodeId === 'perf') return startBattle(d, createBattle(d, c, nodeId, [])).state;
  const order = d.campaign.nodes.map((n) => n.id);
  const idx = order.indexOf(nodeId);
  for (const ch of Object.values(d.chars)) {
    const j = order.indexOf(ch.joins);
    if (j >= 0 && j < idx) addToRoster(d, c, ch.id);
  }
  c.completed = order.slice(0, idx);
  return beginBattle(d, c, nodeId, c.roster.map((u) => u.id)).state;
}

const acting = (s: BattleState) => s.units.filter((u) => u.team !== 'player' && u.pos && !u.gone).length;

interface Result {
  map: string;
  size: string;
  units: number;
  phases: number;
  maxMsPerUnit: number;
  avgMsPerUnit: number;
  maxPhaseMs: number;
}

function measure(nodeId: string, mapId: string): Result {
  let max = 0;
  let sum = 0;
  let phases = 0;
  let maxPhase = 0;
  let units = 0;
  for (let r = -warmup; r < runs; r++) {
    let s = opening(data, nodeId, 100 + Math.max(r, 0));
    for (let round = 0; round < rounds && !s.outcome; round++) {
      const n = acting(s);
      if (n === 0) break;
      const t0 = performance.now();
      const res = applyCommand(data, s, { type: 'endPhase' });
      const ms = performance.now() - t0;
      s = res.state;
      if (r < 0) continue; // warm-up: JIT and caches, not counted
      units = Math.max(units, n);
      phases++;
      sum += ms / n;
      max = Math.max(max, ms / n);
      maxPhase = Math.max(maxPhase, ms);
    }
  }
  const [w, h] = data.maps[mapId]!.size;
  return { map: mapId, size: `${w}x${h}`, units, phases, maxMsPerUnit: +max.toFixed(2), avgMsPerUnit: +(sum / Math.max(1, phases)).toFixed(2), maxPhaseMs: +maxPhase.toFixed(1) };
}

const reference = measure('perf', BENCH_MAP_ID);
const silverbrook = data.campaign.nodes.find((n) => n.map === 'ch02_silverbrook');
const results = [reference, ...(silverbrook ? [measure(silverbrook.id, silverbrook.map)] : [])];
console.log(`enemy phase per enemy unit, ${runs} runs after ${warmup} warm-up, up to ${rounds} rounds each (budget ${TARGETS.aiMsPerUnit} ms):`);
console.table(results);
if (reference.maxMsPerUnit > TARGETS.aiMsPerUnit) {
  console.error(`✗ enemy phase over budget on ${reference.map}: ${reference.maxMsPerUnit} ms per unit (max ${TARGETS.aiMsPerUnit})`);
  process.exit(1);
}
console.log(`✓ within budget (${reference.maxMsPerUnit} ms per unit on ${reference.map})`);
