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
