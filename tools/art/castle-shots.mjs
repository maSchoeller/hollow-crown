/**
 * Acceptance screenshots of the home castle (story 10.14) at 375 × 812, against the running act-2 dev server
 * (`pnpm dev:act2 --port 5175`):
 *   node tools/art/castle-shots.mjs [level ...]     default: 1 2 3 and the picture with a fallen and a gone companion
 * Every room stands at the given level, every companion of acts 1 and 2 is in the company, so all keepsakes are at their
 * places (`__hc.devCastle`). Writes art/models/castle/shots/<name>.png.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const base = process.env.BASE ?? 'http://localhost:5175/';
const out = 'art/models/castle/shots';
mkdirSync(out, { recursive: true });
/** name → [room level, one companion fallen and one gone] */
const shots = { 'level-1': [1, false], 'level-2': [2, false], 'level-3': [3, false], loss: [3, true] };
const picked = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
// the reference phone of the project: 375 x 812 CSS pixels (concept/25-ux/DESIGN.md), one device pixel each
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
// the game stays silent while it is photographed
await page.addInitScript(() => localStorage.setItem('hc.settings', JSON.stringify({ music: 0, sfx: 0 })));
await page.goto(base);
await page.waitForFunction(() => typeof window.__hc?.devCastle === 'function', null, { timeout: 30000 });
let fail = 0;
for (const [name, [level, loss]] of Object.entries(shots)) {
  if (picked.length && !picked.includes(name)) continue;
  await page.evaluate(([l, bad]) => window.__hc.devCastle(l, bad), [level, loss]);
  // the scene module, the model file and the first frames
  await page.waitForSelector('.c3d-pin', { timeout: 30000 }).catch(() => fail++);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(name, 'level', level, loss ? '(fallen and gone)' : '');
}
await browser.close();
process.exit(fail ? 1 : 0);
