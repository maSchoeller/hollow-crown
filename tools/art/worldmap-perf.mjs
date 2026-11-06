/**
 * Frame measurement of the world map on a phone (375 × 812, DPR 3) with a throttled CPU, sound off (story 15.12).
 *   node tools/art/worldmap-perf.mjs [--rate 4] [--node m1_2] [--out file.json] [--headed]
 * Against the running dev server (BASE, default http://localhost:5173/): starts a campaign up to the node, opens the world map and
 * drags, glides, zooms in and out with the wheel and taps a stone. While it moves, the page records every frame (rAF), long
 * animation frames and the Chrome trace (main thread, raster, decode); afterwards the composited layers and the decoded pictures.
 * Prints a summary and writes the details as JSON. The CPU throttle slows the main thread only, raster and GPU run at host speed.
 */
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  const v = i < 0 ? undefined : args[i + 1];
  return v === undefined || v.startsWith('--') ? def : v;
};
const rate = Number(opt('rate', '4'));
const node = opt('node', 'm1_2');
const out = opt('out', null);
const base = process.env.BASE ?? 'http://localhost:5173/';

const browser = await chromium.launch({ channel: 'chromium', headless: !args.includes('--headed') });
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.addInitScript(() => localStorage.setItem('hc.settings', JSON.stringify({ music: 0, sfx: 0, voice: 0 })));
page.on('pageerror', (e) => console.error('pageerror', e.message));

const log = (m) => console.error(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
await page.goto(base);
log('page open');
await page.getByRole('button', { name: /^(Campaigns|Kampagnen)/ }).click({ timeout: 60_000 });
await page.getByRole('button', { name: /New campaign|Neue Kampagne/ }).click();
await page.getByRole('button', { name: /Set out|Aufbrechen/ }).click();
await page.waitForFunction(() => !!window.__hc, null, { timeout: 60_000 });
for (let i = 0; ; i++) {
  const err = await page.evaluate((id) => window.__hc.devNode(id).then(() => null, (e) => String(e)), node);
  if (!err) break;
  if (i > 40) throw new Error(err);
  await page.waitForTimeout(1000);
}
await page.evaluate(() => {
  window.__hc.battle.value = null;
  window.__hc.screen.value = { name: 'worldmap' };
});
log('campaign at node');
await page.waitForSelector('.wm');
log('world map open');
await page.waitForFunction(() => !document.querySelector('.wm__loading'), null, { timeout: 60_000 }).catch(() => console.warn('the map still shows its loading notice'));
await page.waitForTimeout(3000);

log('measuring');
const cdp = await page.context().newCDPSession(page);
await cdp.send('Performance.enable');
await cdp.send('Emulation.setCPUThrottlingRate', { rate });
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));

// frame recorder: every rAF interval and the long animation frames while the actions run
await page.evaluate(() => {
  const rec = (window.__perf = { frames: [], loaf: [], long: {}, phase: 'idle', run: true });
  let last = performance.now();
  const tick = (now) => {
    rec.frames.push(now - last);
    if (now - last > 50) rec.long[rec.phase] = (rec.long[rec.phase] ?? 0) + 1;
    last = now;
    if (rec.run) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  try {
    new PerformanceObserver((l) =>
      l.getEntries().forEach((e) => {
        rec.loaf.push(e.duration);
        (rec.loafDetail ??= []).push({
          phase: rec.phase,
          d: Math.round(e.duration),
          script: Math.round(e.scripts.reduce((x, sc) => x + sc.duration, 0)),
          layout: e.styleAndLayoutStart ? Math.round(e.duration - (e.styleAndLayoutStart - e.startTime)) : 0,
          render: Math.round(e.renderStart ? e.duration - (e.renderStart - e.startTime) : 0),
          top: e.scripts.map((sc) => `${sc.invoker}:${Math.round(sc.duration)}`).slice(0, 3),
        });
      }),
    ).observe({ type: 'long-animation-frame' });
  } catch {
    /* no LoAF API */
  }
});
const m0 = await metrics();
await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc', 'blink'] });

const phase = (p) => page.evaluate((x) => (window.__perf.phase = x), p);
const mid = [187, 406];
const drag = async (dx, dy, steps = 40) => {
  await page.mouse.move(mid[0], mid[1]);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(mid[0] + (dx * i) / steps, mid[1] + (dy * i) / steps);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(700); // the glide after the release
};
await phase('drag');
for (const [dx, dy] of [[-150, -200], [150, 220], [-120, 150], [130, -170]]) await drag(dx, dy);
log('dragged');
await phase('zoom');
for (const d of [-100, -100, 100, 100, -100]) {
  await page.mouse.move(mid[0], mid[1]);
  await page.mouse.wheel(0, d);
  await page.waitForTimeout(700);
}
await phase('drag near');
for (const [dx, dy] of [[-150, -200], [150, 220]]) await drag(dx, dy);
await phase('tap stone');
const stone = page.locator('.wm-node--story:not(.wm-node--done)').first();
if (await stone.count()) {
  await stone.click();
  await page.waitForTimeout(900);
}
await phase('idle');

log('actions done');
const trace = JSON.parse((await browser.stopTracing()).toString());
const m1 = await metrics();
const rec = await page.evaluate(() => {
  window.__perf.run = false;
  return window.__perf;
});
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

// composited layers and their pixel area, the decoded pictures and their size on the screen
log('trace read');
const layers = await new Promise((resolve) => {
  cdp.once('LayerTree.layerTreeDidChange', (e) => resolve(e.layers ?? []));
  setTimeout(() => resolve([]), 5000);
  void cdp.send('LayerTree.enable').then(() => page.mouse.move(100, 100));
});
const images = await page.evaluate(() =>
  [...document.querySelectorAll('.wm img, .wm canvas')].map((el) => {
    const r = el.getBoundingClientRect();
    const w = el.naturalWidth ?? el.width;
    const h = el.naturalHeight ?? el.height;
    return { src: (el.currentSrc || el.tagName).split('/').slice(-2).join('/'), w, h, onScreen: [Math.round(r.width), Math.round(r.height)] };
  }),
);
await browser.close();

const sorted = rec.frames.slice(5).sort((a, b) => a - b);
const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
const sum = {};
for (const e of trace.traceEvents ?? []) {
  if (e.ph !== 'X' || !e.dur) continue;
  if (!/^(RasterTask|ImageDecodeTask|Decode Image|Layout|UpdateLayoutTree|Paint|PrePaint|Layerize|UpdateLayer|CompositeLayers|FireAnimationFrame|EventDispatch|FunctionCall|GPUTask|Commit|ScheduledAction)$/.test(e.name)) continue;
  sum[e.name] = (sum[e.name] ?? 0) + e.dur / 1000;
}
const drawn = layers.filter((l) => l.drawsContent);
const result = {
  rate,
  node,
  frames: { count: sorted.length, median: q(0.5), p95: q(0.95), max: sorted.at(-1) ?? 0, over33: sorted.filter((f) => f > 33.4).length, over50: sorted.filter((f) => f > 50).length },
  longFramesByPhase: rec.long,
  loafDetail: rec.loafDetail ?? [],
  loaf: { count: rec.loaf.length, total: rec.loaf.reduce((a, b) => a + b, 0), max: Math.max(0, ...rec.loaf) },
  main: Object.fromEntries(['LayoutCount', 'RecalcStyleCount', 'LayoutDuration', 'RecalcStyleDuration', 'ScriptDuration', 'TaskDuration'].map((k) => [k, +((m1[k] ?? 0) - (m0[k] ?? 0)).toFixed(3)])),
  trace: Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, Math.round(v)])),
  layers: { count: drawn.length, megapixels: +(drawn.reduce((a, l) => a + l.width * l.height, 0) / 1e6).toFixed(1), biggest: drawn.map((l) => [Math.round(l.width), Math.round(l.height)]).sort((a, b) => b[0] * b[1] - a[0] * a[1]).slice(0, 4) },
  images: { count: images.length, decodedMB: +(images.reduce((a, i) => a + i.w * i.h * 4, 0) / 1048576).toFixed(1), list: images },
};
const fmt = (n) => (typeof n === 'number' ? Math.round(n * 10) / 10 : n);
console.log(`CPU ${rate}× · frames ${result.frames.count}: median ${fmt(result.frames.median)} ms, p95 ${fmt(result.frames.p95)} ms, max ${fmt(result.frames.max)} ms, >33 ms ${result.frames.over33}, >50 ms ${result.frames.over50}`);
console.log(`long animation frames ${result.loaf.count} (${fmt(result.loaf.total)} ms, max ${fmt(result.loaf.max)} ms) · layout ${result.main.LayoutCount}× / ${fmt(result.main.LayoutDuration * 1000)} ms, style ${result.main.RecalcStyleCount}× / ${fmt(result.main.RecalcStyleDuration * 1000)} ms, script ${fmt(result.main.ScriptDuration * 1000)} ms`);
console.log(`frames over 50 ms by phase: ${JSON.stringify(result.longFramesByPhase)}`);
for (const l of result.loafDetail) console.log(`  LoAF ${JSON.stringify(l)}`);
console.log(`trace ms: ${Object.entries(result.trace).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`layers ${result.layers.count} drawing, ${result.layers.megapixels} MPx, biggest ${JSON.stringify(result.layers.biggest)} · pictures ${result.images.count}, ${result.images.decodedMB} MB decoded`);
if (out) writeFileSync(out, JSON.stringify(result, null, 1));
