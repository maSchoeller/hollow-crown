import { expect, test } from '@playwright/test';
import { savedBeforeWin } from './lastMove';
import { reachAction } from './lastMoveUi';

/**
 * Story 9.7, AC 10: the player wins 1-6 "Die Paktwacht" (seize by Kael) on a production build (`pnpm preview` has no dev helpers).
 * The way there is the player's own: an exported save is imported on the title screen's campaign list. The save is made here from the content on
 * disk: the company at the expected level, every earlier story node done, the battle played by the simulator's player up to the winning command.
 * Kael has only walked onto the throne field; the test gives "Seize" through the action bar, then goes through the outro: panel "Das Banner auf
 * der Ruine", the conversation, decision E4 (first tap marks, second confirms), the consequence card, the result screen ("New home") and the
 * world map, whose home node is now the castle.
 */

test('winning 1-6: panel, conversation, decision E4, consequence card, result, and the castle is home', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone13', 'a long run on software WebGL: one project is enough');
  test.setTimeout(300_000);
  const { save, unit } = savedBeforeWin('m1_6', 'e2e-m1-6', [1, 2, 3, 4, 5, 6, 7, 8]);
  expect(unit).toBe('kael');

  await page.goto('./');
  await page.getByRole('button', { name: /^(Campaigns|Kampagnen)/ }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'm1-6.json', mimeType: 'application/json', buffer: Buffer.from(save) });

  // the imported battle resumes with Kael standing on the throne field and nobody else ready: select him, tap his field, the action bar opens
  const seize = page.locator('.hud-ctx').filter({ hasText: /Seize|Einnehmen/ });
  await reachAction(page, seize);
  await seize.click();

  // the scene after the win: walk through it, noting what came up (the panel, the decision, the consequence card)
  const seen = { panel: false, choice: false, card: false };
  let marked = false;
  await expect
    .poll(
      async () => {
        if (await page.getByRole('button', { name: /To the world map|Zur Weltkarte/ }).isVisible()) return true;
        if (await page.locator('.vn-panel').isVisible()) seen.panel = true;
        if (await page.locator('.cq-card').isVisible()) {
          seen.card = true;
          await page.locator('.cq-card').getByRole('button').click().catch(() => undefined);
        } else if (await page.locator('.vn-option').first().isVisible()) {
          seen.choice = true;
          const option = page.locator('.vn-option').first();
          // first tap marks the answer, the second confirms it
          if (!marked) {
            await option.click();
            marked = true;
            await expect(option).toHaveClass(/is-selected/);
          } else await option.click();
        } else if (await page.locator('.vn').isVisible()) {
          marked = false;
          await page.locator('.vn').click({ position: { x: 40, y: 120 } }).catch(() => undefined);
        }
        return false;
      },
      { timeout: 150_000, intervals: [400] },
    )
    .toBe(true);
  expect(seen.choice).toBe(true);
  expect(seen.card).toBe(true);
  // the panel shows only once its picture is built (pnpm art:build); CI runs without the art, so check it only when it is there
  const built = await page.evaluate(() => fetch('./assets/locations/paktwacht_banner.webp', { method: 'HEAD' }).then((r) => r.ok && !/html/.test(r.headers.get('content-type') ?? '')));
  if (built) expect(seen.panel).toBe(true);

  // the result names the new home; the world map shows the castle as home
  await expect(page.getByText(/New home|Neue Heimat/)).toContainText(/Pact ?[Ww]atch|Paktwacht/);
  await page.getByRole('button', { name: /To the world map|Zur Weltkarte/ }).click();
  await expect(page.getByRole('button', { name: /Pact Watch|Paktwacht/ }).first()).toBeVisible({ timeout: 20_000 });
});
