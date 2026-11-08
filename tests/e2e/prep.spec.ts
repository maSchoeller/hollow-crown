import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { deployView, tapTile } from './deploy';

/**
 * Deploy on the board before mission 1-1 (story 6.11). The mission is only reachable after the prologue battle, which runs on
 * software WebGL for minutes, so the test imports a generated export (tests/fixtures/saves/generate.ts): the world map after
 * the prologue with six companions (4 places, Rhen and Lucan required), the same way a player restores a save file.
 */
const SAVE = join(process.cwd(), 'tests/fixtures/saves/prep-worldmap-export.json');

/** The intro of 1-1 plays before the deploy board: Skip jumps ahead and halts at an answer if there is one; pick it, then skip the rest. */
async function skipIntro(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
  await skip.click();
  const option = page.locator('.vn-option').first();
  await option.or(page.locator('.prp')).first().waitFor({ timeout: 120_000 });
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
  // the card shows its one button once the act pack is there (story 7.2); the deploy board comes before every mission
  await expect(page.locator('.wm-card').getByRole('button', { name: /^(Deployment|Aufstellung)$/ })).toHaveCount(0);
  await page.locator('.wm-card').getByRole('button', { name: /^(Set out|Aufbrechen)$/ }).click({ timeout: 60_000 });
  await skipIntro(page);
  await expect(page.locator('.prp')).toBeVisible();
  await expect(page.locator('.ld-cover')).toHaveCount(0, { timeout: 120_000 });
}

const places = (page: Page) => page.locator('.prp-tag').first();
const seats = (page: Page) => page.locator('.prp-seat .prp-seat__name');
const free = (v: Awaited<ReturnType<typeof deployView>>) => v.slots.filter((s) => !Object.values(v.at).some((p) => p[0] === s[0] && p[1] === s[1]));

test('deploy board: default deploy, move and swap on the fields, bench in and out, required units stay, the battle starts as placed', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  await openPrep(page);

  // the default deploy: four places taken, the two others on the bench
  await expect(places(page)).toHaveText(/4\/4/);
  await expect(seats(page)).toHaveText(['Fenn', 'Varek']);
  let v = await deployView(page);
  expect(Object.keys(v.at).sort()).toEqual(['avatar', 'brenna', 'lucan', 'tobin']);
  expect(v.slots.length).toBeGreaterThan(4);

  // Rhen is required: picked, the bag is there, "To bench" is not
  await tapTile(page, v.at.avatar!);
  await expect(page.locator('.prp-hint')).toContainText(/Rhen/);
  await expect(page.getByRole('button', { name: /^(To bench|Abziehen)$/ })).toBeDisabled();

  // Rhen moves to a free field
  const target = free(v)[0]!;
  await tapTile(page, target);
  await expect.poll(async () => (await deployView(page)).at.avatar).toEqual(target);

  // Rhen and Lucan swap
  v = await deployView(page);
  const [rhenAt, lucanAt] = [v.at.avatar!, v.at.lucan!];
  await tapTile(page, rhenAt);
  await tapTile(page, lucanAt);
  await expect.poll(async () => (await deployView(page)).at.avatar).toEqual(lucanAt);
  expect((await deployView(page)).at.lucan).toEqual(rhenAt);

  // all places taken: Fenn from the bench onto a free field only says so
  await page.locator('.prp-seat').filter({ hasText: 'Fenn' }).click();
  v = await deployView(page);
  await tapTile(page, free(v)[0]!);
  await expect(page.locator('.toast')).toHaveText(/All places taken|Alle Plätze besetzt/);
  await expect(places(page)).toHaveText(/4\/4/);

  // Fenn stays picked and takes Brenna's place: Brenna goes to the bench
  await expect(page.locator('.prp-seat.is-picked')).toHaveText(/Fenn/);
  const brennaAt = v.at.brenna!;
  await tapTile(page, brennaAt);
  await expect.poll(async () => (await deployView(page)).at.fenn).toEqual(brennaAt);
  await expect(seats(page)).toHaveText(['Brenna', 'Varek']);

  // Tobin to the bench: a place is free
  await tapTile(page, (await deployView(page)).at.tobin!);
  await page.getByRole('button', { name: /^(To bench|Abziehen)$/ }).click();
  await expect(places(page)).toHaveText(/3\/4/);
  await expect(seats(page)).toHaveText(['Brenna', 'Tobin', 'Varek']);

  // the bag opens the figure with its equipment over the board; back brings the board again
  await tapTile(page, (await deployView(page)).at.fenn!);
  await page.getByRole('button', { name: /Fenn: open equipment|Fenn: Ausrüstung öffnen/ }).click();
  await expect(page.locator('.prp-sheet')).toBeVisible();
  await page.locator('.prp-sheet').getByRole('button', { name: /^(Back|Zurück)$/ }).first().click();
  await expect(page.locator('.prp-sheet')).toHaveCount(0);
  await expect(places(page)).toHaveText(/3\/4/);

  // Fenn is still picked after the bag; Escape lets go (desktop)
  if (testInfo.project.name === 'desktop') {
    await expect(page.getByRole('button', { name: /^(To bench|Abziehen)$/ })).toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /^(To bench|Abziehen)$/ })).toBeDisabled();
  }

  // no horizontal page scroll
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // the ember button starts the mission with exactly this placement
  const placed = (await deployView(page)).at;
  await page.getByRole('button', { name: /^(Start mission|Mission starten)$/ }).click();
  await expect(page.locator('.prp')).toHaveCount(0, { timeout: 90_000 });
  await expect(page.locator('canvas.hc-stage')).toBeVisible({ timeout: 90_000 });
  await expect.poll(async () => (await deployView(page)).at, { timeout: 90_000 }).toEqual(placed);
});

test('leaving a running mission (story 1.9): the menu asks first, then the world map shows and the mission can be started again', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one project is enough');
  test.setTimeout(360_000);
  await openPrep(page);
  await page.getByRole('button', { name: /^(Start mission|Mission starten)$/ }).click();
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
