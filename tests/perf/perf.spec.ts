/**
 * Performance run (stories 7.5, 7.7): per reference device, the enemy phase of the large battle (frame times, NFR1) at each
 * CPU throttling level of profile.ts in `PERF_RUNS` runs (default 3, each on a freshly loaded page; the report takes the
 * median) and the cold start (NFR2). Writes test-results/perf/<device>.json; the config's teardown (report-summary.ts)
 * joins them into report.md. Exceedances are reported, not failed, unless PERF_STRICT=1 (release check, story 9.14).
 * Every frame over 100 ms in any run is an exceedance (story 7.8; GPU only), and the bench traces frames over 50 ms with their cause.
 * `PERF_WARM=0|1|2` sets how much of the shader warm-up runs at load (overrides `board.warm` of render.yaml; the default 2 is the shipped behaviour).
 * `PERF_VATWORKER=0` keeps the baked animations' work on the main thread (compare with the workers).
 * `PERF_VAT=0|1` overrides `board.vat`: 0 = every figure plays its skeleton (the path before the baked animation of story 7.8).
 * `PERF_STAGES=1,2,4` overrides the throttling levels (levels without a target are only reported).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { PROFILE } from './profile';
import { exceedances, frameStats, median, type DeviceReport, type PhaseRun, type StageReport } from './report';
import type { CastleResult, EnemyPhaseResult, PreparedBattle } from './bench';

const OUT = join(process.cwd(), 'test-results', 'perf');
const RUNS = Math.max(1, Number(process.env.PERF_RUNS) || 3);
/** the bench battle: quality `mid` (what the budget is measured on); `PERF_LOOK=night,rain` gives it a time of day and weather (story 8.6) */
const BENCH_OPTIONS = { quality: 'mid', figures: '3d', look: process.env.PERF_LOOK, warm: process.env.PERF_WARM === undefined ? undefined : Number(process.env.PERF_WARM),
  vat: process.env.PERF_VAT === undefined ? undefined : process.env.PERF_VAT !== '0',
  vatWorker: process.env.PERF_VATWORKER === undefined ? undefined : process.env.PERF_VATWORKER !== '0' };

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

type Bench = {
  prepare(o: object): Promise<PreparedBattle>;
  startEnemyPhase(): Promise<{ aiMs: number }>;
  enemyPhase(): Promise<EnemyPhaseResult>;
  castle(o: object): Promise<CastleResult>;
};

/**
 * One run: loads the bench page, the battle, and plays the enemy phase under `rate`× CPU throttling. `units`: the count the battle
 * must have (the reference battle 40; null for a level draft, which brings what it brings).
 */
async function phaseRun(page: Page, cdp: CDPSession, rate: number, options: object = BENCH_OPTIONS, units: number | null = 40): Promise<{ run: PhaseRun; prepared: PreparedBattle; events: number }> {
  await setCpu(cdp, rate);
  await page.goto('./tests/perf/bench.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const prepared = (await page.evaluate((o) => (window as unknown as { __bench: Bench }).__bench.prepare(o), options)) as PreparedBattle;
  if (units !== null) expect(prepared.units).toBe(units);
  // the AI's working-out is a stall of its own (NFR3), not a frame of the playback: it is timed apart and left out of the thread time
  await page.evaluate(() => (window as unknown as { __bench: Bench }).__bench.startEnemyPhase());
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
    spikes: r.spikes,
    aiMs: Math.round(r.aiMs),
    loadMs: Math.round(prepared.loadMs),
    vatModels: prepared.vat.models,
    vatMs: prepared.vat.ms,
    vatKb: prepared.vat.kb,
    vatWorkerMs: prepared.vat.workerMs,
    vatByWorker: prepared.vat.byWorker,
    gcEvents: r.gcEvents,
    gcFreedKb: r.gcFreedKb,
    layoutMs: r.layoutMs,
    newEffectInfo: r.newEffectInfo,
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

/** `PERF_LARGE=1` (story 15.11) runs only the large-map test below, not this one. */
test('enemy phase of the large battle and cold start', async ({ page, context }, info) => {
  test.skip(process.env.PERF_LARGE === '1', 'PERF_LARGE=1 measures the large maps and the castle only');
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

/** One row of the large-map table (story 15.11): a scenario at one throttling level, medians over the runs, max over all runs. */
interface LargeRow {
  scenario: string;
  cpuSlowdown: number;
  units: number;
  avgFps: number;
  p95Ms: number;
  maxMs: number;
  drawCalls: number | null;
  /** wall time of the enemy phase playback at speed 1×, ms (none for the castle) */
  phaseMs: number | null;
  threadMsPerFrame: number | null;
}

/**
 * Story 15.11 (NFR1 on the new scale): `PERF_LARGE=1 pnpm perf` measures the level drafts 1-6 and 1-8 (30×40, the company of the act
 * deployed, every foe advancing) next to the reference battle, each with the foes walking one by one and together, and the 3D
 * castle with every room built. Writes `test-results/perf/large-<device>.json` and `.md`. Desktop throttling stands in for the phone;
 * the reference devices stay a release check (story 9.14). `PERF_LARGE_MAPS=reference,s1_1_6_paktwacht,s1_1_8_heimat,whole,castle`
 * limits the rows (`whole` = 1-6 watched in the overview).
 */
test('large maps and the castle (story 15.11)', async ({ page }, info) => {
  test.skip(process.env.PERF_LARGE !== '1', 'set PERF_LARGE=1');
  test.setTimeout(3_600_000);
  const device = info.project.name;
  const cdp = await throttle(page);
  const only = process.env.PERF_LARGE_MAPS?.split(',');
  const maps: Array<{ label: string; map?: string; whole?: boolean }> = [
    { label: 'Referenz 24×32' },
    { label: '1-6 Paktwacht 30×40', map: 's1_1_6_paktwacht' },
    { label: '1-8 Heimat 30×40', map: 's1_1_8_heimat' },
    { label: '1-6 Paktwacht 30×40 in der Übersicht', map: 's1_1_6_paktwacht', whole: true },
  ].filter((m) => !only || only.includes(m.whole ? 'whole' : (m.map ?? 'reference')));
  // `PERF_LARGE_MARCH=1`: only the foes marching together (the rows one by one do not change with the march)
  const marches = process.env.PERF_LARGE_MARCH === '1' ? [true] : [false, true];
  const rows: LargeRow[] = [];
  let renderer = '';
  for (const stage of stages()) {
    for (const m of maps) {
      for (const march of marches) {
        const runs: PhaseRun[] = [];
        let units = 0;
        for (let i = 0; i < RUNS; i++) {
          const r = await phaseRun(page, cdp, stage.cpuSlowdown, { ...BENCH_OPTIONS, map: m.map, march, whole: m.whole }, m.map ? null : 40);
          runs.push(r.run);
          units = r.prepared.units;
          renderer = r.prepared.renderer;
        }
        const row: LargeRow = {
          scenario: `${m.label}, ${march ? 'gemeinsam' : 'einzeln'}`,
          cpuSlowdown: stage.cpuSlowdown,
          units,
          avgFps: median(runs.map((r) => r.avgFps)),
          p95Ms: median(runs.map((r) => r.p95Ms)),
          maxMs: Math.max(...runs.map((r) => r.maxMs)),
          drawCalls: median(runs.map((r) => r.drawCallsAvg ?? 0)),
          phaseMs: median(runs.map((r) => r.durationMs)),
          threadMsPerFrame: median(runs.map((r) => r.threadMsPerFrame ?? 0)),
        };
        rows.push(row);
        console.log(`${device} ${stage.cpuSlowdown}× ${row.scenario}: ${row.avgFps} FPS, p95 ${row.p95Ms} ms, max ${row.maxMs} ms, phase ${row.phaseMs} ms, ${row.units} units`);
      }
    }
    if (only && !only.includes('castle')) continue;
    const castles: CastleResult[] = [];
    for (let i = 0; i < RUNS; i++) {
      await setCpu(cdp, stage.cpuSlowdown);
      await page.goto('./tests/perf/bench.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      castles.push((await page.evaluate(() => (window as unknown as { __bench: Bench }).__bench.castle({ quality: 'mid' }))) as CastleResult);
      await setCpu(cdp, 1);
    }
    const stats = castles.map((c) => frameStats(c.frames));
    const row: LargeRow = {
      scenario: 'Burg, alle Räume Stufe 3',
      cpuSlowdown: stage.cpuSlowdown,
      units: 0,
      avgFps: median(stats.map((s) => s.avgFps)),
      p95Ms: median(stats.map((s) => s.p95Ms)),
      maxMs: Math.max(...stats.map((s) => s.maxMs)),
      drawCalls: median(castles.map((c) => c.drawCalls)),
      phaseMs: null,
      threadMsPerFrame: null,
    };
    rows.push(row);
    console.log(`${device} ${stage.cpuSlowdown}× ${row.scenario}: ${row.avgFps} FPS, p95 ${row.p95Ms} ms, max ${row.maxMs} ms, ${row.drawCalls} draw calls`);
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `large-${device}.json`), JSON.stringify({ device, renderer, runs: RUNS, rows }, null, 1));
  const md = [
    `# Große Karten und Burg – ${device}`,
    '',
    `Renderer: ${renderer}; ${RUNS} Läufe je Zeile (Median, max = über alle Läufe); Gegnerphase bei Tempo 1×.`,
    '',
    '| Szenario | Drosselung | Figuren | Ø FPS | p95 ms | max ms | Draw Calls | Thread ms/Frame | Gegnerphase s |',
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.scenario} | ${r.cpuSlowdown}× | ${r.units || '–'} | ${r.avgFps} | ${r.p95Ms} | ${r.maxMs} | ${r.drawCalls ?? '–'} | ${r.threadMsPerFrame ?? '–'} | ${r.phaseMs === null ? '–' : (r.phaseMs / 1000).toFixed(1)} |`),
  ].join('\n');
  writeFileSync(join(OUT, `large-${device}.md`), md + '\n');
});
