/**
 * Screenshots of the prop catalog and of a dev map in the real board, against the running dev server (`pnpm dev --port 5173`).
 *   node tools/art/shot.mjs catalog <out.png> [query]       the prop catalog page (tools/art/prop-catalog.html)
 *   node tools/art/shot.mjs map <mapId> <out.png> [close]    a fixture map of tests/fixtures/maps or a draft of concept/27-ueberarbeitung/levels (sound off, no save written; NOFOG=1 shows it without fog of war)
 *   node tools/art/shot.mjs node <nodeId> <out.png> [close]  a campaign map (`__hc.devNode`)
 */
import { chromium } from '@playwright/test';

const [mode, a, b, c] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:5173/';
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const close = c === 'close';
const page = await browser.newPage({ viewport: mode === 'catalog' ? { width: 1100, height: 1500 } : close ? { width: 430, height: 932 } : { width: 1300, height: 1900 }, deviceScaleFactor: close || mode === 'catalog' ? 2 : 1 });
await page.addInitScript(() => localStorage.setItem('hc.settings', JSON.stringify({ quality: 'high', musicVolume: 0, sfxVolume: 0, voiceVolume: 0, masterVolume: 0 })));
page.on('pageerror', (e) => console.error('pageerror', e.message));

if (mode === 'catalog') {
  await page.goto(`${base}tools/art/prop-catalog.html${c ? `?${c}` : b ? `?${b}` : ''}`);
  await page.waitForFunction(() => window.catalogReady === true, null, { timeout: 180_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: a });
} else {
  await page.goto(base);
  // sound off for every agent test run (delegated rule), before anything plays
  await page.getByRole('button', { name: /^(Campaigns|Kampagnen)/ }).click({ timeout: 60_000 });
  await page.getByRole('button', { name: /New campaign|Neue Kampagne/ }).click();
  await page.getByRole('button', { name: /Set out|Aufbrechen/ }).click();
  await page.waitForFunction(() => !!window.__hc, null, { timeout: 60_000 });
  const fn = mode === 'map' ? 'devMap' : 'devNode';
  for (let i = 0; ; i++) {
    const err = await page.evaluate(([f, id, opts]) => window.__hc[f](id, opts).then(() => null, (e) => String(e)), [fn, a, mode === 'map' && process.env.NOFOG ? { fog: false } : undefined]);
    if (!err) break;
    if (i > 40) throw new Error(err);
    await page.waitForTimeout(1000);
  }
  // scenes and lessons in front of the battle: skip until the turn HUD stands
  const hud = page.getByRole('button', { name: /End phase|Phase beenden/ });
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline && !(await hud.count())) {
    const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
    if (await skip.count()) await skip.first().click({ timeout: 1000 }).catch(() => undefined);
    const opt = page.locator('.vn-option').first();
    if (await opt.count()) await opt.click({ timeout: 1000 }).catch(() => undefined);
    await page.waitForTimeout(1000);
  }
  await page.waitForFunction(() => !document.body.innerText.match(/Building the map|Karte wird/), null, { timeout: 180_000 }).catch(() => undefined);
  for (let i = 0; i < 3; i++) {
    const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
    if (await skip.count()) await skip.first().click({ timeout: 1000 }).catch(() => undefined);
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(3000);
  if (c !== 'close') {
    await page.evaluate(() => window.__board?.wholeMap?.(true));
    await page.waitForTimeout(3000);
  }
  // PAN=x,y: looks at this field (for close-ups)
  if (process.env.PAN) {
    const [x, y] = process.env.PAN.split(',').map(Number);
    await page.evaluate(([px, py]) => window.__board?.centerOn?.([px, py], false), [x, y]).catch(() => undefined);
    await page.waitForTimeout(2500);
  }
  await page.screenshot({ path: b });
}
await browser.close();
