/**
 * Runs of `pnpm sim` on several cores (Testlabor S2). Every run depends only on its seed (`seed0 + run`), so a worker thread takes
 * the next free run, and the results are put back in run order before they are summed: serial and parallel give the same numbers.
 * Each worker loads the content itself (with the same `--set` values); the parsed YAML comes along, so it is not parsed again.
 */
import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import { parsedContent } from '../src/content/node';
import type { GameData } from '../src/core';
import { simulateCampaign, type CampaignSim, type CampaignSimOptions } from './simCampaign';
import { simulateMapRun, type MapRun, type MapSimOptions } from './simMap';

export type SimJob = { kind: 'map'; options: MapSimOptions } | { kind: 'campaign'; options: Omit<CampaignSimOptions, 'runs' | 'seed' | 'onMission'> };
export type SimResult<J extends SimJob> = J extends { kind: 'map' } ? MapRun : CampaignSim;

/** One run of a job, in this thread. */
export function runJob(data: GameData, job: SimJob, run: number, seed: number): MapRun | CampaignSim {
  return job.kind === 'map' ? simulateMapRun(data, job.options, run, seed) : simulateCampaign(data, { ...job.options, runs: 1, seed });
}

/** `--workers n`; default: one per core but one, at most one per run. */
export function workerCount(arg: string | undefined, runs: number): number {
  const n = arg === undefined ? availableParallelism() - 1 : Number(arg);
  if (!Number.isInteger(n) || n < 1) throw new Error(`--workers needs a whole number ≥ 1, got ${arg}`);
  return Math.max(1, Math.min(n, runs));
}

/** Plays runs 0..runs-1 (seed `seed0 + run`) on `workers` threads; returns the results in run order. */
export async function runParallel<J extends SimJob>(job: J, runs: number, seed0: number, workers: number, sets: Record<string, unknown>): Promise<SimResult<J>[]> {
  const results: SimResult<J>[] = new Array(runs);
  let next = 0;
  const parsed = parsedContent();
  await Promise.all(
    Array.from({ length: Math.min(workers, runs) }, async () => {
      const w = new Worker(new URL('./simWorker.ts', import.meta.url), { workerData: { job, sets, parsed } });
      try {
        await new Promise<void>((resolve, reject) => {
          const take = () => {
            if (next >= runs) return resolve();
            const run = next++;
            w.postMessage({ run, seed: seed0 + run });
          };
          w.on('message', (m: { run: number; result: SimResult<J> }) => {
            results[m.run] = m.result;
            take();
          });
          w.on('error', reject);
          w.on('exit', (code) => (next < runs || code !== 0 ? reject(new Error(`sim worker stopped with code ${code}`)) : resolve()));
          take();
        });
      } finally {
        await w.terminate();
      }
    }),
  );
  return results;
}
