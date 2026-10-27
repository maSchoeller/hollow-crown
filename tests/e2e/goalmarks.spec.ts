import { expect, test } from '@playwright/test';

/** Goal marking: a tap on the side objective "visit every house" marks the unvisited houses on the board, a second tap takes the marks away. */

type Hooks = { devNode: (node: string) => Promise<void> };
type Board = { overlays: { mark?: Array<[number, number]> } };

test('a tap on the house goal marks the houses of mission 1-1, a second tap clears them', async ({ page }, testInfo) => {
  // one project is enough: the board loads on software WebGL and the viewport does not matter here
  test.skip(testInfo.project.name !== 'desktop', 'one project is enough');
  test.setTimeout(240_000);

  await page.goto('./');
  // mission 1-1 on a throwaway campaign (test hook, only where `navigator.webdriver` is set); the act pack loads in the background: ask until it is there
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __hcTest?: Hooks }).__hcTest?.devNode('m1_1').then(() => true, () => false) ?? false), { timeout: 60_000 })
    .toBe(true);

  // the pre scene and the lessons: skip them (and pick an answer when one is asked) until the goal pills stand
  const pill = page.locator('.hud-goal').first();
  await expect
    .poll(async () => {
      if (await pill.count()) return true;
      const option = page.locator('.vn-option').first();
      if (await option.count()) await option.click({ timeout: 2000 }).catch(() => undefined);
      const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
      if (await skip.count()) await skip.first().click({ timeout: 2000 }).catch(() => undefined);
      return false;
    }, { timeout: 120_000, intervals: [500] })
    .toBe(true);
  await expect(page.locator('canvas.hc-stage')).toBeVisible();

  const marks = () => page.evaluate(() => (window as unknown as { __board: Board }).__board.overlays.mark?.length ?? 0);
  // the lesson of turn 1 may still stand over the pill: skip it
  await expect
    .poll(async () => {
      const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
      if (await skip.count()) await skip.first().click({ timeout: 2000 }).catch(() => undefined);
      return pill.isEnabled();
    }, { timeout: 60_000 })
    .toBe(true);

  await expect(pill).toHaveAttribute('aria-pressed', 'false');
  expect(await marks()).toBe(0);
  await pill.click();
  await expect(pill).toHaveAttribute('aria-pressed', 'true');
  expect(await marks()).toBe(4);
  // a lesson of the turn may come up meanwhile and hides the HUD: skip it before the second tap
  await expect
    .poll(async () => {
      const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
      if (await skip.count()) await skip.first().click({ timeout: 2000 }).catch(() => undefined);
      return pill.isVisible();
    }, { timeout: 60_000 })
    .toBe(true);
  await pill.click();
  await expect(pill).toHaveAttribute('aria-pressed', 'false');
  expect(await marks()).toBe(0);
});
