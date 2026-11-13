/**
 * Acceptance screenshots of the attached parts of the pro paths (story 10.13), one per part at 375 × 812 with the game
 * camera (tools/art/part-one.html), against the running dev server (`pnpm dev --port 5173`).
 *   node tools/art/part-shots.mjs [part ...]        default: every part of content/core/render.yaml `gear.proParts`
 * Writes art/models/parts/shots/<part>.png.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { parse } from 'yaml';

const base = process.env.BASE ?? 'http://localhost:5173/';
const proParts = parse(readFileSync('content/core/render.yaml', 'utf8')).gear.proParts;
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(proParts);
const out = 'art/models/parts/shots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
// the reference phone of the project: 375 x 812 CSS pixels (concept/25-ux/DESIGN.md), one device pixel each, so the
// acceptance pictures stay small in Git LFS
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
let fail = 0;
for (const id of ids) {
  const piece = proParts[id];
  if (!piece) {
    console.log('no such part', id);
    fail++;
    continue;
  }
  if (!existsSync(`art/models/parts/${piece.model}.glb`)) {
    console.log('no model', piece.model, '(git lfs pull? blender_proparts.py?)');
    fail++;
    continue;
  }
  try {
    await page.goto(`${base}tools/art/part-one.html?part=${piece.model}&socket=${piece.socket}`);
    await page.waitForFunction(() => window.catalogReady === true, null, { timeout: 60_000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/${id}.png` });
  } catch (e) {
    console.log('failed', id, String(e).slice(0, 160));
    fail++;
  }
}
await browser.close();
console.log('rendered', ids.length - fail, 'of', ids.length, 'into', out);
