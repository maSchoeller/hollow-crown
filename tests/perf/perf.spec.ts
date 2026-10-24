/**
 * Performance run (story 7.5): per reference device, one complete enemy phase of the large battle (frame times, NFR1) and
 * the cold start (NFR2), throttled with the profile in profile.ts. Writes test-results/perf/<device>.json; the
 * config's teardown (report-summary.ts) joins them into report.md. Exceedances are reported, not failed, unless
 * PERF_STRICT=1 (release check, story 9.14).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { PROFILE } from './profile';
import { exceedances, frameStats, type DeviceReport } from './report';
import type { EnemyPhaseResult } from './bench';

const OUT = join(process.cwd(), 'test-results', 'perf');

async function throttle(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: PROFILE.cpuSlowdown });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: PROFILE.network.latencyMs,
    downloadThroughput: (PROFILE.network.downloadKbps * 1024) / 8,
    uploadThroughput: (PROFILE.network.uploadKbps * 1024) / 8,
  });
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
  test.setTimeout(300_000);
  const device = info.project.name;

  // first visit: nothing cached; then the cold start of the installed app (service worker and caches in place)
  await throttle(page);
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

  // enemy phase on the bench page
  await page.goto('./tests/perf/bench.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const r = (await page.evaluate(() =>
    (window as unknown as { __bench: { enemyPhase(o: object): Promise<EnemyPhaseResult> } }).__bench.enemyPhase({ quality: 'mid', figures: '3d' }),
  )) as EnemyPhaseResult;
  expect(r.units).toBe(40);
  expect(r.frames.length).toBeGreaterThan(10);

  const dc = r.drawCalls.filter((n) => n > 0);
  const report: DeviceReport = {
    device,
    renderer: r.renderer,
    enemyPhase: {
      ...frameStats(r.frames),
      units: r.units,
      events: r.events,
      durationMs: Math.round(r.durationMs),
      loadMs: Math.round(r.loadMs),
      drawCallsAvg: dc.length ? Math.round(dc.reduce((s, n) => s + n, 0) / dc.length) : null,
      drawCallsMax: dc.length ? Math.max(...dc) : null,
    },
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
