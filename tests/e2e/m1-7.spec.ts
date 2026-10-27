import { expect, test } from '@playwright/test';
import { savedBeforeWin } from './lastMove';
import { reachAction } from './lastMoveUi';

/**
 * Story 9.8, AC 9: the player wins 1-7 "Unter der Paktwacht" (treasure) on a production build (`pnpm preview` has no dev helpers).
 * The way there is the player's own: an exported save is imported on the title screen's campaign list. The save is made here from the content on
 * disk: the company at the expected level, every earlier story node done, the vault played by the simulator's player up to the last chest.
 * The unit that opens it has only walked next to it; the test gives "Open" through the action bar, skips the scenes, confirms the result and
 * finds the entry "Sealed Chronicle in the Castle Archive" in the chronicle (it is no page: the counter stays at 0 of 12).
 */

test('winning 1-7: the sealed chronicle is in the chronicle view and the page counter stays at 0 of 12', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone13', 'a long run on software WebGL: one project is enough');
  test.setTimeout(300_000);
  const { save } = savedBeforeWin('m1_7', 'e2e-m1-7', [1, 2, 3, 4, 5, 6, 7, 8]);

  await page.goto('./');
  await page.getByRole('button', { name: /^(Campaigns|Kampagnen)/ }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'm1-7.json', mimeType: 'application/json', buffer: Buffer.from(save) });

  // the imported battle resumes with one unit ready next to the last chest: select it, tap its field, the action bar opens
  const open = page.locator('.hud-ctx').filter({ hasText: /Open|Öffnen/ });
  await reachAction(page, open);
  await open.click();

  // the win: skip the scenes (the outro has no decision), then the result screen
  const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
  const toMap = page.getByRole('button', { name: /To the world map|Zur Weltkarte/ });
  await expect
    .poll(
      async () => {
        if (await toMap.isVisible()) return true;
        if (await skip.isVisible()) await skip.click().catch(() => undefined);
        else if (await page.locator('.vn').isVisible()) await page.locator('.vn').click({ position: { x: 40, y: 120 } }).catch(() => undefined);
        return false;
      },
      { timeout: 150_000, intervals: [400] },
    )
    .toBe(true);
  await toMap.click();

  // the chronicle is reached from the world map; its page tab shows the sealed entry and the counter says 0 of 12
  await page.getByRole('button', { name: /^(Chronicle|Chronik)/ }).click({ timeout: 30_000 });
  await expect(page.getByText(/^(0 of 12 pages|0 von 12 Seiten)$/)).toBeVisible();
  await page.getByRole('tab', { name: /Chronicle pages|Chronik-Seiten/ }).click();
  const sealed = page.getByText(/Sealed Chronicle in the Castle Archive|Versiegelte Chronik im Burgarchiv/);
  await expect(sealed).toBeVisible();
  await expect(page.getByRole('tab', { name: /Chronicle pages \(0 of 12\)|Chronik-Seiten \(0 von 12\)/ })).toBeVisible();
});
