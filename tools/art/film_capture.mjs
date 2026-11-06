/**
 * Smooth in-game recording of a film scene (epic 16): frame by frame on a virtual clock, so the video runs at an even
 * 30 fps however slowly the machine draws (software WebGL in the cloud managed ~6 fps in real time).
 *
 *   pnpm dev --port 5199   (in another shell)
 *   node tools/art/film_capture.mjs <outDir> [quality=high] [maxFrames] [dpr=2] [node=m1_1] [holdsMs=comma list per line]
 *   ffmpeg -framerate 30 -i <outDir>/f_%05d.png -vf "fade=t=in:d=0.7,format=yuv420p" -c:v libx264 -crf 18 ingame.mp4
 *
 * The clock: performance.now, Date.now and the requestAnimationFrame timestamp stand still once the film is shown and move
 * only by 1/30 s per frame; the page keeps drawing real frames, two of which pass before each screenshot.
 */
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const [out, quality = 'high', limitS, dprS = '2', node = 'm1_1', holdsS] = process.argv.slice(2);
const FPS = 30, STEP = 1000 / FPS;
const limit = Number(limitS ?? 1e9);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: Number(dprS), locale: 'de-DE' });
const page = await ctx.newPage();
await page.addInitScript((q) => {
  try { const s = JSON.parse(localStorage.getItem('hc.settings') || '{}'); localStorage.setItem('hc.settings', JSON.stringify({ ...s, quality: q, lang: 'de' })); } catch { /* private mode: defaults */ }
  // virtual clock: real until frozen, then it only moves when the recorder advances it
  const rn = performance.now.bind(performance);
  const rd = Date.now;
  const off = rd() - rn();
  let frozen = null;
  window.__vt = { freeze() { frozen = rn(); }, advance(ms) { frozen += ms; } };
  performance.now = () => (frozen ?? rn());
  Date.now = () => (frozen == null ? rd() : Math.round(frozen + off));
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf(() => cb(performance.now()));
}, quality);
await page.goto('http://localhost:5199/');
await page.waitForFunction(() => window.__hc, null, { timeout: 60000 });
await page.waitForTimeout(2500);
await page.addStyleTag({ content: '.film-stage{transition:none!important}' });
await page.evaluate((n) => window.__hc.devNode(n), node);
await page.waitForSelector('.film-stage.is-shown', { timeout: 300000 });
await page.evaluate(() => window.__vt.freeze());
const twoFrames = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const holds = holdsS ? holdsS.split(',').map(Number) : [7500, 4500, 4000, 4500, 4500, 6000, 3500, 5000, 4000, 4000, 5000, 5500];
let n = 0; const t0 = Date.now();
for (let line = 0; line < holds.length && n < limit; line++) {
  const frames = Math.round(holds[line] / STEP);
  for (let f = 0; f < frames && n < limit; f++) {
    await page.evaluate((ms) => window.__vt.advance(ms), STEP);
    await twoFrames();
    await page.screenshot({ path: `${out}/f_${String(n).padStart(5, '0')}.png` });
    n++;
  }
  await page.mouse.click(195, 760);
  await twoFrames();
}
console.log(`frames ${n} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
await browser.close();
