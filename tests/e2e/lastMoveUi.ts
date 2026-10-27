import { expect, type Locator, type Page } from '@playwright/test';

type Spot = { x: number; y: number } | null;

/** Finds the blue square that marks the selected unit's field in a screenshot (CSS pixels), or null while it is not (yet) on the board. */
async function findSquare(page: Page, top: number, bottom: number): Promise<Spot> {
  const shot = await page.screenshot();
  return page.evaluate(
    async ({ png, top, bottom }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d')!;
      g.drawImage(img, 0, 0);
      const scale = img.width / window.innerWidth;
      const px = g.getImageData(0, Math.floor(top * scale), img.width, Math.floor((bottom - top) * scale)).data;
      // pixels of the blue tint of the square (it differs from map to map in lightness); cells of 60 device pixels count them
      const cell = 60;
      const cols = Math.ceil(img.width / cell) + 2;
      const rows = Math.ceil(((bottom - top) * scale) / cell) + 2;
      const grid = new Array<number>(cols * rows).fill(0);
      const hits: [number, number][] = [];
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i]!;
        const gr = px[i + 1]!;
        const b = px[i + 2]!;
        if (b >= 150 && b - r >= 60 && b - gr >= 25 && gr >= 70) {
          const p = i / 4;
          const x = p % img.width;
          const y = Math.floor(p / img.width);
          hits.push([x, y]);
          grid[(Math.floor(y / cell) + 1) * cols + Math.floor(x / cell) + 1]!++;
        }
      }
      // the densest neighbourhood of 3 x 3 cells is the square, not the blue clothes of other units
      let best = -1;
      let at = 0;
      for (let cy = 1; cy < rows - 1; cy++)
        for (let cx = 1; cx < cols - 1; cx++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += grid[(cy + dy) * cols + cx + dx]!;
          if (sum > best) {
            best = sum;
            at = cy * cols + cx;
          }
        }
      if (best < 600) return null;
      const bx = (at % cols) - 1;
      const by = Math.floor(at / cols) - 1;
      const near = hits.filter(([x, y]) => Math.abs(Math.floor(x / cell) - bx) <= 1 && Math.abs(Math.floor(y / cell) - by) <= 1);
      const mx = near.reduce((a, h) => a + h[0], 0) / near.length;
      const my = near.reduce((a, h) => a + h[1], 0) / near.length;
      return { x: mx / scale, y: top + my / scale };
    },
    { png: shot.toString('base64'), top, bottom },
  );
}

/**
 * Browser side of `savedBeforeWin`: exactly one unit is still ready. "Next" (Space) selects it and the board marks its field with a blue square.
 * The board is a canvas and the camera cannot always centre on the unit (it stops at the map edge), and tapping around blindly would hit foes
 * (their forecast) and other units, so the square is found in screenshots, once it has stopped moving, and tapped: that is a tap on the unit's own
 * field, which opens the action bar with `action`.
 */
export async function reachAction(page: Page, action: Locator): Promise<void> {
  await expect(page.locator('canvas.hc-stage')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole('button', { name: /^(Next|Nächste)$/ })).toBeEnabled({ timeout: 120_000 });
  // the board is built after the battle shows ("Building the map" covers it and takes taps): wait until it is gone
  await expect(page.getByRole('progressbar')).toBeHidden({ timeout: 180_000 });
  await page.waitForTimeout(1000);
  const back = page.getByRole('button', { name: /^(Back|Zurück)$/ });
  const box = (await page.locator('canvas.hc-stage').boundingBox())!;
  const top = box.y + 100;
  const bottom = box.y + box.height * 0.62;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (!(await back.isVisible())) await page.keyboard.press('Space');
    await expect(back).toBeVisible({ timeout: 20_000 });
    // the camera glides to the unit: tap once two looks, a second apart, find the square on the same spot
    let spot: Spot = null;
    for (let look = 0; look < 40; look++) {
      await page.waitForTimeout(1000);
      const now = await findSquare(page, top, bottom);
      if (now && spot && Math.abs(now.x - spot.x) < 3 && Math.abs(now.y - spot.y) < 3) {
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
