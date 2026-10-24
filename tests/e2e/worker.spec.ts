import { expect, test, type Page } from '@playwright/test';

/** Story 2.8: in the browser the enemy phase runs in the core worker, and it ends in the very state the main thread computes. */

async function skipIntro(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
  await skip.click();
  await page.locator('.vn-option').first().click();
  await skip.click();
}

/** New campaign with a fixed seed (the seed comes from the clock and Math.random), prologue, one enemy phase. Returns the board's state. */
async function playFirstEnemyPhase(page: Page): Promise<string> {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
    Date.now = () => 1_700_000_000_000;
  });
  await page.goto('./');
  await page.getByRole('button', { name: /^(Campaigns|Kampagnen)/ }).click();
  await page.getByRole('button', { name: /New campaign|Neue Kampagne/ }).click();
  await page.getByRole('button', { name: /Set out|Aufbrechen/ }).click();
  await skipIntro(page);
  await expect(page.locator('canvas.hc-stage')).toBeVisible();
  await page.getByRole('button', { name: /Skip|Überspringen/ }).click({ timeout: 40_000 });
  await page.getByRole('button', { name: /End phase|Phase beenden/ }).click();
  await page.getByRole('button', { name: /Sure\?|Wirklich\?/ }).click();
  // the enemy phase plays, then the turn-2 lesson appears
  await page.getByRole('button', { name: /Skip|Überspringen/ }).click({ timeout: 90_000 });
  await expect(page.locator('.hud-top')).toContainText('2');
  return page.evaluate(() => JSON.stringify((window as unknown as { __board: { state: unknown } }).__board.state));
}

test('the enemy phase runs in the core worker and gives the state the main thread gives', async ({ browser }, testInfo) => {
  // two complete rounds on software WebGL; one project is enough, the others only change the viewport
  test.skip(testInfo.project.name !== 'desktop', 'one project is enough');
  test.setTimeout(300_000);

  const withWorker = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  const page = await withWorker.newPage();
  const workers: string[] = [];
  page.on('worker', (w) => workers.push(w.url()));
  const viaWorker = await playFirstEnemyPhase(page);
  expect(workers.some((u) => /core\.worker/.test(u))).toBe(true);
  await withWorker.close();

  // without `Worker` the app computes the same request on the main thread
  const without = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  const plain = await without.newPage();
  await plain.addInitScript(() => {
    delete (window as unknown as { Worker?: unknown }).Worker;
  });
  const sync: string[] = [];
  plain.on('worker', (w) => sync.push(w.url()));
  const viaMainThread = await playFirstEnemyPhase(plain);
  expect(sync.filter((u) => /core\.worker/.test(u))).toEqual([]);
  await without.close();

  expect(viaWorker).toBe(viaMainThread);
  expect((JSON.parse(viaWorker) as { turn: number }).turn).toBe(2);
});
