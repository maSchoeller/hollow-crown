import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

/**
 * Deployment before mission 1-1 (story 6.10). The mission is only reachable after the prologue battle, which runs on
 * software WebGL for minutes, so the test imports a generated export (tests/fixtures/saves/generate.ts): the world map after
 * the prologue with six companions (4 places, Rhen and Kael required), the same way a player restores a save file.
 */
const SAVE = join(process.cwd(), 'tests/fixtures/saves/prep-worldmap-export.json');

/** The intro of 1-1 plays before the deployment: Skip jumps ahead and halts at an answer if there is one; pick it, then skip the rest. */
async function skipIntro(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
  await skip.click();
  const option = page.locator('.vn-option').first();
  await option.or(page.locator('.prp')).first().waitFor();
  if (await option.isVisible()) {
    await option.click();
    await skip.click();
  }
}

async function openPrep(page: Page): Promise<void> {
  await page.goto('./');
  await page.getByRole('button', { name: /^(Campaigns|Kampagnen)/ }).click();
  await page.setInputFiles('input[type=file]', SAVE);
  // the import lands on the world map; mission 1-1 is open after the prologue
  await page.locator('button.wm-node--story[aria-label]').filter({ hasText: '1-1' }).click();
  // the card shows the buttons once the act pack is there (story 7.2)
  await page.locator('.wm-card').getByRole('button', { name: /^(Deployment|Aufstellung)$/ }).click({ timeout: 60_000 });
  await skipIntro(page);
  await expect(page.locator('.prp')).toBeVisible();
}

const places = (page: Page) => page.locator('.prp-tag').first();
const unit = (page: Page, name: string) => page.locator('.prp-unit').filter({ has: page.locator(`b:text-is("${name}")`) });

test('deployment: required units stay, places are counted, a full company gives a hint, the button starts the battle', async ({ page }) => {
  await openPrep(page);

  // six companions in the fixed order, four places, the first four are along
  await expect(page.locator('.prp-unit')).toHaveCount(6);
  await expect(places(page)).toHaveText(/4\/4/);
  await expect(page.locator('.prp-unit b')).toHaveText(['Rhen', 'Kael', 'Brenna', 'Tobin', 'Fenn', 'Varek']);

  // required units carry the fixed reason and have no switch to tap
  for (const name of ['Rhen', 'Kael']) {
    const card = unit(page, name);
    await expect(card).toContainText(/Required for this mission|Pflicht in dieser Mission/);
    await expect(card.locator('.prp-tog')).toHaveClass(/is-lock/);
    await expect(card.locator('button.prp-tog')).toHaveCount(0);
  }
  await expect(unit(page, 'Brenna')).not.toContainText(/Required for this mission|Pflicht in dieser Mission/);

  // all places taken: the plus of Fenn is dashed (aria-disabled, not disabled); a tap shows the hint and changes nothing
  const fennTake = page.getByRole('button', { name: /Take Fenn|Fenn mitnehmen/ });
  await expect(fennTake).toHaveAttribute('aria-disabled', 'true');
  // Playwright treats aria-disabled as not enabled, but the stone is tappable on purpose: it answers with the hint
  await fennTake.click({ force: true });
  await expect(page.locator('.toast')).toHaveText(/All places taken|Alle Plätze besetzt/);
  await expect(places(page)).toHaveText(/4\/4/);
  await expect(unit(page, 'Fenn')).toHaveClass(/is-off/);

  // leave Brenna behind: a place is free, the card dims, the order does not change
  await page.getByRole('button', { name: /Leave Brenna behind|Brenna zurücklassen/ }).click();
  await expect(places(page)).toHaveText(/3\/4/);
  await expect(unit(page, 'Brenna')).toHaveClass(/is-off/);
  await expect(page.locator('.prp-unit b')).toHaveText(['Rhen', 'Kael', 'Brenna', 'Tobin', 'Fenn', 'Varek']);

  // take Fenn instead: full again
  await page.getByRole('button', { name: /Take Fenn|Fenn mitnehmen/ }).click();
  await expect(places(page)).toHaveText(/4\/4/);
  await expect(unit(page, 'Fenn')).not.toHaveClass(/is-off/);

  // the bag opens the figure with its equipment; back brings the same choice again
  await page.getByRole('button', { name: /Brenna: open equipment|Brenna: Ausrüstung öffnen/ }).click();
  await expect(page.locator('.prp')).toHaveCount(0);
  await page.getByRole('button', { name: /^(Back|Zurück)$/ }).first().click();
  await expect(page.locator('.prp')).toBeVisible();
  await expect(places(page)).toHaveText(/4\/4/);
  await expect(unit(page, 'Brenna')).toHaveClass(/is-off/);
  await expect(unit(page, 'Fenn')).not.toHaveClass(/is-off/);

  // no horizontal page scroll
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // the one ember button begins the battle
  await page.getByRole('button', { name: /Begin battle|Kampf beginnen/ }).click();
  await expect(page.locator('canvas.hc-stage')).toBeVisible({ timeout: 90_000 });
});

test('leaving a running mission (story 1.9): the menu asks first, then the world map shows and the mission can be started again', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one project is enough');
  test.setTimeout(360_000);
  await openPrep(page);
  await page.getByRole('button', { name: /Begin battle|Kampf beginnen/ }).click();
  await expect(page.locator('canvas.hc-stage')).toBeVisible({ timeout: 90_000 });

  // the battle opens with dialogue and a loading cover: skip and wait until the board is free
  const menu = page.getByRole('button', { name: /^(Menu|Menü)$/ });
  const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
  await expect(async () => {
    if (await skip.isVisible()) await skip.click();
    await expect(skip).toBeHidden({ timeout: 3_000 });
    await expect(page.locator('.ld-cover')).toHaveCount(0, { timeout: 3_000 });
  }).toPass({ timeout: 200_000 });

  const leave = page.getByRole('button', { name: /^(Leave mission|Mission verlassen)$/ });
  // asked first: cancelling keeps the battle
  await menu.click();
  await leave.click();
  await expect(page.getByRole('dialog')).toContainText(/campaign stays unchanged|Kampagne bleibt unverändert/);
  await page.getByRole('button', { name: /^(Cancel|Abbrechen)$/ }).click();
  await expect(page.locator('canvas.hc-stage')).toBeVisible();

  // confirmed (cancel went back to the menu): the world map shows, mission 1-1 is open again
  await leave.click();
  await leave.click();
  await expect(page.locator('canvas.hc-stage')).toHaveCount(0);
  await expect(page.locator('button.wm-node--story[aria-label]').filter({ hasText: '1-1' })).toBeVisible();
});
