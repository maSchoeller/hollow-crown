/**
 * Renders every model of concept/23-art-direction/map-assets/groups/*.yaml from the game camera (tools/art/prop-one.html), against the dev server.
 *   node tools/art/gallery-shots.mjs [id ...]
 * Writes art/props/previews/game/<id>.png (not checked in: the gallery keeps its own copy).
 */
import { mkdirSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { parse } from 'yaml';

const base = process.env.BASE ?? 'http://localhost:5173/';
const groups = 'concept/23-art-direction/map-assets/groups';
const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(groups).flatMap((f) => (parse(readFileSync(join(groups, f), 'utf8')).items ?? []).map((i) => i.id));
const out = 'concept/23-art-direction/map-assets/gallery_game';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 420, height: 420 }, deviceScaleFactor: 1.5 });
let fail = 0;
for (const id of ids) {
  if (!existsSync(`art/models/props/${id}.glb`)) {
    console.log('no model', id);
    fail++;
    continue;
  }
  try {
    await page.goto(`${base}tools/art/prop-one.html?id=${id}`);
    await page.waitForFunction(() => window.catalogReady === true, null, { timeout: 60_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${id}.jpg`, type: 'jpeg', quality: 86 });
  } catch (e) {
    console.log('failed', id, String(e).slice(0, 120));
    fail++;
  }
}
await browser.close();
console.log('rendered', ids.length - fail, 'of', ids.length);
