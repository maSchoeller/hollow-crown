import { expect, test, type Page } from '@playwright/test';

/** Story 5.6: a haunt on the world map is opened (card with lieutenant and reward), played and won; the result names it. */

async function skipIntro(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
  await skip.click();
  await page.locator('.vn-option').first().click();
  await skip.click();
}

type Hooks = { devHaunt: (map: string, variant: string) => string | null; autoWin: () => void };

test('a haunt can be opened on the world map, played and won', async ({ page }, testInfo) => {
  // a whole battle on software WebGL; one project is enough, the others only change the viewport
  test.skip(testInfo.project.name !== 'desktop', 'one project is enough');
  test.setTimeout(240_000);

  await page.goto('./');
  await page.getByRole('button', { name: /^(Campaigns|Kampagnen)/ }).click();
  await page.getByRole('button', { name: /New campaign|Neue Kampagne/ }).click();
  // easy: a fresh prologue company (level 1) against a level-2 haunt wins only about every second seed on normal
  await page.getByRole('button', { name: /^(Easy|Leicht)$/ }).click();
  await page.getByRole('button', { name: /Set out|Aufbrechen/ }).click();
  await skipIntro(page);
  await expect(page.locator('canvas.hc-stage')).toBeVisible();

  // a campaign with an open haunt on the prologue's map, then the world map (the test hook exists where `navigator.webdriver` is set)
  // the lieutenants and enemy pools come with the act pack, which loads in the background: ask until it is there
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __hcTest: Hooks }).__hcTest.devHaunt('prologue_paktnacht', 'rout')), { timeout: 60_000 })
    .toBeTruthy();

  // the red stone carries the NEU mark; opening its card takes the mark away
  const stone = page.getByRole('button', { name: /Heimsuchung: |Haunting: / });
  await expect(stone).toBeVisible({ timeout: 30_000 });
  await expect(stone.locator('.wm-node__new')).toBeVisible();
  await stone.click();
  const card = page.locator('.wm-card--haunt');
  await expect(card).toContainText(/Hask/, { timeout: 30_000 });
  await expect(card).toContainText(/flieht bei 0 TP|flees at 0 HP/, { timeout: 30_000 });
  await expect(card.locator('.hc-amount').first()).toBeVisible();
  await expect(stone.locator('.wm-node__new')).toHaveCount(0);

  // set out: no scene, straight to the battle
  await card.getByRole('button', { name: /Set out|Aufbrechen/ }).click();
  await expect(page.locator('canvas.hc-stage')).toBeVisible({ timeout: 90_000 });

  // the company wins (the simulator's player side), the result names the haunt, and the stone is gone
  await page.evaluate(() => (window as unknown as { __hcTest: Hooks }).__hcTest.autoWin());
  await expect(page.locator('.res-pill--win')).toContainText(/Heimsuchung|Haunting/, { timeout: 60_000 });
  await page.getByRole('button', { name: /To the world map|Zur Weltkarte/ }).click();
  await expect(page.getByRole('button', { name: /Heimsuchung: |Haunting: / })).toHaveCount(0);
});
