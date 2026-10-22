import { expect, test } from '@playwright/test';

/** New game → prologue dialogue → battle (no preparation: deployment is fixed) → enemy phase (concept/13 §6.1, shortened). */
test('new game reaches the prologue battle and survives a round', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /New Game|Neues Spiel/ }).click();
  await page.getByRole('button', { name: /Set out|Aufbrechen/ }).click();
  // prologue intro dialogue → skip; the prologue has no choice of units, so the battle starts at once
  await page.getByRole('button', { name: /Skip|Überspringen/ }).click();
  await expect(page.locator('canvas.board-canvas')).toBeVisible();
  // turn-1 tutorial dialogue
  await page.getByRole('button', { name: /Skip|Überspringen/ }).click({ timeout: 15_000 });
  // units are still ready, so ending the phase asks once more
  await page.getByRole('button', { name: /End phase|Phase beenden/ }).click();
  await page.getByRole('button', { name: /Sure\?|Wirklich\?/ }).click();
  // enemy phase plays, then the turn-2 tutorial appears
  await page.getByRole('button', { name: /Skip|Überspringen/ }).click({ timeout: 60_000 });
  await expect(page.locator('.topbar')).toContainText('2');
  // no horizontal page scroll on phones (concept/13 §6.1)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('the last map row can be pulled clear of the bottom sheet (concept/01 D10)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /New Game|Neues Spiel/ }).click();
  await page.getByRole('button', { name: /Set out|Aufbrechen/ }).click();
  await page.getByRole('button', { name: /Skip|Überspringen/ }).click();
  // turn-1 lesson; the board loads slowly under software WebGL when several projects run in parallel
  await page.getByRole('button', { name: /Skip|Überspringen/ }).click({ timeout: 40_000 });
  const box = (await page.locator('canvas.board-canvas').boundingBox())!;
  // drag the map upwards as far as it goes, i.e. towards its southern edge
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.4;
  for (let i = 0; i < 2; i++) {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 1500, { steps: 15 });
    await page.mouse.up();
  }
  const view = await page.evaluate(() => {
    const board = (window as unknown as { __board: { screenOf(x: number, y: number): { y: number }; state: { height: number } } }).__board;
    const tile = 48; // art px per tile (GA4b)
    const canvas = document.querySelector('canvas.board-canvas')!.getBoundingClientRect();
    const top = document.querySelector('.topbar')!.getBoundingClientRect();
    const sheet = document.querySelector('.battle .bottom')?.getBoundingClientRect();
    const mapTop = board.screenOf(0, 0).y;
    const mapBottom = board.screenOf(0, board.state.height * tile).y;
    const sheetTop = (sheet ? sheet.top : canvas.bottom) - canvas.top;
    return { mapBottom, mapHeight: mapBottom - mapTop, sheetTop, free: sheetTop - (top.bottom - canvas.top) };
  });
  // the southern edge sits above the bottom sheet …
  expect(view.mapBottom).toBeLessThan(view.sheetTop);
  // … and a map taller than the free area stops a quarter of that area above the sheet (render.yaml camera.margin)
  if (view.mapHeight > view.free) expect(view.sheetTop - view.mapBottom).toBeCloseTo(view.free * 0.25, -1);
});

test('autosave restores the running battle after reload (concept/13 §6.8)', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /New Game|Neues Spiel/ }).click();
  await page.getByRole('button', { name: /Set out|Aufbrechen/ }).click();
  await page.getByRole('button', { name: /Skip|Überspringen/ }).click();
  await page.getByRole('button', { name: /Skip|Überspringen/ }).click({ timeout: 15_000 });
  await page.reload();
  await page.getByRole('button', { name: /Continue|Fortsetzen/ }).click();
  await expect(page.locator('canvas.board-canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: /End phase|Phase beenden/ })).toBeVisible();
});
