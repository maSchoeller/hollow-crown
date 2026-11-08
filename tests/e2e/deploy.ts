import type { Page } from '@playwright/test';

/** The board of the running screen as the tests read it (`__board` exists where `navigator.webdriver` is set). */
type Board = { screenOf(x: number, y: number): { x: number; y: number }; overlays: { move?: Array<[number, number]> }; state: { units: Array<{ uid: string; team: string; pos: [number, number] | null }> } };

/** Taps the middle of tile (x, y) on the board canvas, once the camera has come to rest (a relayout glides it). */
export async function tapTile(page: Page, at: [number, number]): Promise<void> {
  const where = () =>
    page.evaluate(([x, y]) => {
      const b = (window as unknown as { __board: Board }).__board;
      const r = document.querySelector('canvas.hc-stage')!.getBoundingClientRect();
      const s = b.screenOf(x + 0.5, y + 0.5);
      return { x: Math.round(r.left + s.x), y: Math.round(r.top + s.y) };
    }, at);
  let p = await where();
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(100);
    const q = await where();
    if (q.x === p.x && q.y === p.y) break;
    p = q;
  }
  await page.mouse.click(p.x, p.y);
}

/** The deploy slots (the blue fields) and where each player unit stands on the deploy board. */
export async function deployView(page: Page): Promise<{ slots: Array<[number, number]>; at: Record<string, [number, number]> }> {
  return page.evaluate(() => {
    const b = (window as unknown as { __board: Board }).__board;
    const at: Record<string, [number, number]> = {};
    for (const u of b.state.units) if (u.team === 'player' && u.pos) at[u.uid] = u.pos;
    return { slots: b.overlays.move ?? [], at };
  });
}

/** Story 6.11: every mission opens on the deploy board first; this starts it with the default deploy. */
export async function startFromDeploy(page: Page): Promise<void> {
  await page.locator('.prp .prp-start').click({ timeout: 120_000 });
}
