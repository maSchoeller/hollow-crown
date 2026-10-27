import { expect, type Locator, type Page } from '@playwright/test';

type Spot = { x: number; y: number } | null;

/**
 * Where to tap the one player unit that is still ready: its tile on the screen, from the board itself (`__board` is set when Playwright drives
 * the page). The tile's centre is projected at a few heights until `tileAt` gives that same tile back, so raised ground does not shift the tap.
 * Page coordinates (CSS px); null while the unit is off the visible board.
 */
async function readyUnitSpot(page: Page): Promise<Spot> {
  return page.evaluate(() => {
    type Board = {
      state: { units: Array<{ team: string; acted?: boolean; pos?: [number, number] | null; gone?: string; downed?: boolean }> } | null;
      screenOf(x: number, y: number, h?: number): { x: number; y: number };
      tileAt(clientX: number, clientY: number): [number, number] | null;
    };
    const board = (window as unknown as { __board?: Board }).__board;
    const canvas = document.querySelector('canvas.hc-stage')?.getBoundingClientRect();
    if (!board?.state || !canvas) return null;
    const u = board.state.units.find((o) => o.team === 'player' && !o.acted && o.pos && !o.gone && !o.downed);
    if (!u?.pos) return null;
    const [tx, ty] = u.pos;
    for (let h = 0; h <= 3; h += 0.25) {
      const p = board.screenOf(tx + 0.5, ty + 0.5, h);
      const x = canvas.left + p.x;
      const y = canvas.top + p.y;
      if (x < canvas.left || x > canvas.right || y < canvas.top || y > canvas.bottom) continue;
      const t = board.tileAt(x, y);
      if (t && t[0] === tx && t[1] === ty) return { x, y };
    }
    return null;
  });
}

/**
 * Browser side of `savedBeforeWin`: exactly one unit is still ready. "Next" (Space) selects it and the camera glides to it; then its own field
 * is tapped (found through the board, not by pixels), which opens the action bar with `action`.
 */
export async function reachAction(page: Page, action: Locator): Promise<void> {
  await expect(page.locator('canvas.hc-stage')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole('button', { name: /^(Next|Nächste)$/ })).toBeEnabled({ timeout: 120_000 });
  // the board is built after the battle shows ("Building the map" covers it and takes taps): wait until it is gone
  await expect(page.getByRole('progressbar')).toBeHidden({ timeout: 180_000 });
  await page.waitForTimeout(1000);
  const back = page.getByRole('button', { name: /^(Back|Zurück)$/ });
  for (let attempt = 0; attempt < 4; attempt++) {
    if (!(await back.isVisible())) await page.keyboard.press('Space');
    await expect(back).toBeVisible({ timeout: 20_000 });
    // the camera glides to the unit: take the spot once two looks, half a second apart, agree
    let spot: Spot = null;
    for (let look = 0; look < 40; look++) {
      await page.waitForTimeout(500);
      const now = await readyUnitSpot(page);
      if (now && spot && Math.abs(now.x - spot.x) < 2 && Math.abs(now.y - spot.y) < 2) {
        spot = now;
        break;
      }
      spot = now;
    }
    if (spot) {
      await page.mouse.move(spot.x, spot.y);
      await page.waitForTimeout(300);
      await page.mouse.down();
      await page.waitForTimeout(80);
      await page.mouse.up();
      if (await action.waitFor({ timeout: 8000 }).then(() => true, () => false)) return;
    }
    await page.keyboard.press('Escape');
  }
  throw new Error('the unit that is still ready was not found on the board');
}
