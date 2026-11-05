/**
 * Screenshots of the world map on a phone (375 × 812, DPR 3) against the running dev server, sound off (story 15.7).
 *   node tools/art/worldmap-shots.mjs <out-prefix> [nodeId …]
 * For every node: the campaign up to that node (`__hc.devNode`), straight back to the world map, then
 *   <prefix>-<node>-overview.png  the first view (the open node in the middle)
 *   <prefix>-<node>-near.png      after a tap on the open stone (near zoom step plus focus zoom)
 * Base URL from BASE (default http://localhost:5173/); HOME_KIND=castle shows the castle as home.
 */
import { chromium } from '@playwright/test';

const [prefix, ...nodes] = process.argv.slice(2);
if (!prefix) throw new Error('usage: node tools/art/worldmap-shots.mjs <out-prefix> [nodeId …]');
const base = process.env.BASE ?? 'http://localhost:5173/';
const homeKind = process.env.HOME_KIND ?? null;
if (homeKind && !['camp', 'castle'].includes(homeKind)) throw new Error('HOME_KIND must be camp or castle');
const browser = await chromium.launch({ channel: 'chromium' });
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.addInitScript(() => localStorage.setItem('hc.settings', JSON.stringify({ music: 0, sfx: 0, voice: 0 })));
page.on('pageerror', (e) => console.error('pageerror', e.message));

await page.goto(base);
await page.getByRole('button', { name: /^(Campaigns|Kampagnen)/ }).click({ timeout: 60_000 });
await page.getByRole('button', { name: /New campaign|Neue Kampagne/ }).click();
await page.getByRole('button', { name: /Set out|Aufbrechen/ }).click();
await page.waitForFunction(() => !!window.__hc, null, { timeout: 60_000 });

for (const node of nodes.length ? nodes : ['m1_2']) {
  for (let i = 0; ; i++) {
    const err = await page.evaluate((id) => window.__hc.devNode(id).then(() => null, (e) => String(e)), node);
    if (!err) break;
    if (i > 40) throw new Error(err);
    await page.waitForTimeout(1000);
  }
  // devNode starts the node's scene: leave it at once and show the world map of that campaign
  await page.evaluate((home) => {
    // HOME_KIND=castle: the castle as home (devNode does not run the effects of the completed nodes, e.g. setHome after 1-6)
    if (home) window.__hc.campaign.value = { ...window.__hc.campaign.value, home: { ...window.__hc.campaign.value.home, kind: home } };
    window.__hc.battle.value = null;
    window.__hc.screen.value = { name: 'worldmap' };
  }, homeKind);
  await page.waitForSelector('.wm');
  await page.waitForFunction(() => !document.querySelector('.wm__loading'), null, { timeout: 60_000 }).catch(() => console.warn(`${node}: the map still shows its loading notice`));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${prefix}-${node}-overview.png` });
  const stone = page.locator('.wm-node--story:not(.wm-node--done), .wm-node--side:not(.wm-node--done)').first();
  if (await stone.count()) {
    // near zoom step first (wheel), then the tap on the stone adds the focus zoom
    await page.mouse.move(187, 406);
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(600);
    await stone.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${prefix}-${node}-near.png` });
  }
}
await browser.close();
