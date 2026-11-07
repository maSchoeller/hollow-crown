/** Worker thread of `pnpm sim` (tools/simPool.ts): loads the content once, then plays the runs it is sent, one at a time. */
import { parentPort, workerData } from 'node:worker_threads';
import { primeParsedContent, type ParsedContent } from '../src/content/node';
import { runJob, type SimJob } from './simPool';
import { loadContentWithSets } from './simOverrides';

const { job, sets, parsed } = workerData as { job: SimJob; sets: Record<string, unknown>; parsed: ParsedContent };
primeParsedContent(parsed);
const { data } = loadContentWithSets(sets);
parentPort!.on('message', ({ run, seed }: { run: number; seed: number }) => {
  parentPort!.postMessage({ run, result: runJob(data, job, run, seed) });
});
