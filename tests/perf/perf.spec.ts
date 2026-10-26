/**
 * Performance run (stories 7.5, 7.7): per reference device, the enemy phase of the large battle (frame times, NFR1) at each
 * CPU throttling level of profile.ts in `PERF_RUNS` runs (default 3, each on a freshly loaded page; the report takes the
 * median) and the cold start (NFR2). Writes test-results/perf/<device>.json; the config's teardown (report-summary.ts)
 * joins them into report.md. Exceedances are reported, not failed, unless PERF_STRICT=1 (release check, story 9.14).
 * `PERF_STAGES=1,2,4` overrides the throttling levels (levels without a target are only reported).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { PROFILE } from './profile';
import { exceedances, frameStats, type DeviceReport, type PhaseRun, type StageReport } from './report';
import type { EnemyPhaseResult, PreparedBattle } from './bench';

const OUT = join(process.cwd(), 'test-results', 'perf');
const RUNS = Math.max(1, Number(process.env.PERF_RUNS) || 3);
/** the bench battle: quality `mid` (what the budget is measured on); `PERF_LOOK=night,rain` gives it a time of day and weather (story 8.6) */
const BENCH_OPTIONS = { quality: 'mid', figures: '3d', look: process.env.PERF_LOOK };

/** Throttling levels of the enemy phase: the profile's, or `PERF_STAGES` (a list of CPU slowdowns). */
function stages(): Array<{ cpuSlowdown: number; fps: number | null }> {
  const env = process.env.PERF_STAGES;
  if (!env) return [...PROFILE.stages];
  return env.split(',').map((n) => ({ cpuSlowdown: Number(n), fps: PROFILE.stages.find((s) => s.cpuSlowdown === Number(n))?.fps ?? null }));
}

async function setCpu(cdp: CDPSession, rate: number): Promise<void> {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
}

async function throttle(page: Page): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);
  await setCpu(cdp, PROFILE.cpuSlowdown);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: PROFILE.network.latencyMs,
    downloadThroughput: (PROFILE.network.downloadKbps * 1024) / 8,
    uploadThroughput: (PROFILE.network.uploadKbps * 1024) / 8,
  });
  await cdp.send('Performance.enable');
  return cdp;
}

/** CPU time of the page's main thread so far, s (CDP `Performance.getMetrics`). */
async function threadTime(cdp: CDPSession): Promise<number> {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return metrics.find((m) => m.name === 'ThreadTime')?.value ?? 0;
}

type Bench = { prepare(o: object): Promise<PreparedBattle>; enemyPhase(): Promise<EnemyPhaseResult> };

/** One run: loads the bench page, the battle, and plays the enemy phase under `rate`× CPU throttling. */
async function phaseRun(page: Page, cdp: CDPSession, rate: number): Promise<{ run: PhaseRun; prepared: PreparedBattle; events: number }> {
  await setCpu(cdp, rate);
  await page.goto('./tests/perf/bench.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const prepared = (await page.evaluate((o) => (window as unknown as { __bench: Bench }).__bench.prepare(o), BENCH_OPTIONS)) as PreparedBattle;
  expect(prepared.units).toBe(40);
  const cpu0 = await threadTime(cdp);
  const r = (await page.evaluate(() => (window as unknown as { __bench: Bench }).__bench.enemyPhase())) as EnemyPhaseResult;
  const cpu1 = await threadTime(cdp);
  await setCpu(cdp, 1);
  expect(r.frames.length).toBeGreaterThan(10);
  const dc = r.drawCalls.filter((n) => n > 0);
  const run: PhaseRun = {
    ...frameStats(r.frames),
    durationMs: Math.round(r.durationMs),
    rendered: r.drawCalls.length,
    drawCallsAvg: dc.length ? Math.round(dc.reduce((s, n) => s + n, 0) / dc.length) : null,
    drawCallsMax: dc.length ? Math.max(...dc) : null,
    threadMsPerFrame: r.drawCalls.length ? Math.round(((cpu1 - cpu0) * 1000 * 10) / r.drawCalls.length) / 10 : null,
    newEffects: r.newEffects,
  };
  return { run, prepared, events: r.events };
}

/** ms since navigation start until the title answers (its buttons, not the "preparing" stone). */
async function untilTitle(page: Page, timeout: number): Promise<number> {
  const handle = await page.waitForFunction(
    () => {
      if (document.querySelector('.ld--prepare, .ld--wait')) return 0;
      const text = document.body.innerText;
      return /Campaigns|Kampagnen/.test(text) ? performance.now() : 0;
    },
    undefined,
    { polling: 'raf', timeout },
  );
  return Math.round((await handle.jsonValue()) as number);
}

test('enemy phase of the large battle and cold start', async ({ page, context }, info) => {
  test.setTimeout(3_600_000);
  const device = info.project.name;

  // first visit: nothing cached; then the cold start of the installed app (service worker and caches in place)
  const cdp = await throttle(page);
  await page.goto('./');
  const firstVisitMs = Math.round(
    (await (
      await page.waitForFunction(() => (document.getElementById('app')?.childElementCount ? performance.now() : 0), undefined, { polling: 'raf' })
    ).jsonValue()) as number,
  );
  const firstInstallMs = await untilTitle(page, 120_000);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  const cold = await context.newPage();
  await throttle(cold);
  await cold.goto('./');
  const coldStartMs = await untilTitle(cold, 60_000);
  await cold.close();

  // enemy phase on the bench page, per throttling level in several runs
  let renderer = '';
  let units = 0;
  let events = 0;
  const loads: number[] = [];
  const reports: StageReport[] = [];
  for (const stage of stages()) {
    const runs: PhaseRun[] = [];
    for (let i = 0; i < RUNS; i++) {
      const r = await phaseRun(page, cdp, stage.cpuSlowdown);
      runs.push(r.run);
      renderer = r.prepared.renderer;
      units = r.prepared.units;
      events = r.events;
      loads.push(r.prepared.loadMs);
      console.log(`${device} ${stage.cpuSlowdown}× run ${i + 1}/${RUNS}: ${r.run.avgFps} FPS, p95 ${r.run.p95Ms} ms, thread ${r.run.threadMsPerFrame} ms/frame, ${r.run.drawCallsAvg} draw calls`);
    }
    reports.push({ cpuSlowdown: stage.cpuSlowdown, targetFps: stage.fps, runs });
  }

  const report: DeviceReport = {
    device,
    renderer,
    units,
    events,
    loadMs: loads.length ? loads.reduce((s, n) => s + n, 0) / loads.length : 0,
    stages: reports,
    coldStart: { firstVisitMs, firstInstallMs, coldStartMs },
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${device}.json`), JSON.stringify(report, null, 1));
  const over = exceedances(report);
  for (const o of over) {
    info.annotations.push({ type: 'perf', description: o });
    console.log(process.env.CI ? `::warning::${o}` : `⚠ ${o}`);
  }
  if (process.env.PERF_STRICT === '1') expect(over).toEqual([]);
});
