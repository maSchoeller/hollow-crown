import { expect, test } from '@playwright/test';
import { loadContentFromDisk } from '../../src/content/node';
import { addToRoster, applyCommand, autoCommand, beginBattle, levelUp, newCampaign, turnStartIndex, type BattleState, type Command } from '../../src/core';
import { APP_VERSION, contentVersionOf, exportSave } from '../../src/persistence/save';

/**
 * Story 9.9: the end of act 1 on a production build (`pnpm preview` has no dev helpers).
 * The way to the finale is the player's own: an exported save is imported on the title screen's campaign list. The save is made here from the
 * content on disk: the army of the last mission, and the finale m1_8 played by the simulator's player up to the start of round 12. The test then
 * ends round 12, so the steward has held, plays the outro to the reward moment and checks panel, sparks, the card "2 × Ember spark" and the
 * world map hint "coming soon" for act 2 (there is no pack for it).
 */

/** The finale up to the start of round 12 (player phase) with the steward alive, as an exported save. */
function finaleSave(): string {
  const { data } = loadContentFromDisk();
  for (let seed = 1; seed < 30; seed++) {
    const c = newCampaign(data, seed, { difficulty: 'easy', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    for (const id of ['lucan', 'brenna', 'tobin', 'fenn', 'mira', 'liora', 'varek']) addToRoster(data, c, id);
    const level = data.acts[1]!.nodes.find((n) => n.id === 'm1_8')!.expectedLevel!;
    for (const u of c.roster) while (u.level < level) levelUp(data, u, c.rng);
    c.completed = data.acts[1]!.nodes.filter((n) => n.id !== 'm1_8').map((n) => n.id);
    // the story nodes before it that this content has; m1_8 is the last of them
    const start = beginBattle(data, c, 'm1_8', c.roster.map((u) => u.id)).state;
    let s: BattleState = start;
    const commands: Command[] = [];
    while (!s.outcome && !(s.turn === 12 && s.phase === 'player')) {
      const cmd = autoCommand(data, s);
      s = applyCommand(data, s, cmd).state;
      commands.push(cmd);
    }
    if (s.outcome || !s.units.some((u) => u.id === 'steward' && !u.gone && !u.downed)) continue;
    return exportSave({
      format: 2,
      campaignId: 'e2e-finale',
      slot: 'auto',
      createdAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      contentVersion: contentVersionOf(data),
      payload: { campaign: c, battle: { start, commands, turnStartIndex: turnStartIndex(commands), effects: [] }, screen: 'battle' },
    });
  }
  throw new Error('no seed reaches round 12 with the steward alive');
}

test('the finale ends act 1: outro, panel, sparks, card "2 x ember spark", world map moves on to act 2', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone13', 'a long run on software WebGL: one project is enough');
  test.setTimeout(300_000);
  const save = finaleSave();
  await page.goto('./');
  await page.getByRole('button', { name: /^(Campaigns|Kampagnen)/ }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'finale.json', mimeType: 'application/json', buffer: Buffer.from(save) });

  // the imported battle resumes at the start of round 12: end the phase (units are ready, so it asks once more)
  await page.getByRole('button', { name: /End phase|Phase beenden/ }).click({ timeout: 120_000 });
  await page.getByRole('button', { name: /Sure\?|Wirklich\?/ }).click();

  // the enemy phase plays (speech bubbles may come up: skip them), then the round is over and the outro begins
  const skip = page.getByRole('button', { name: /Skip|Überspringen/ });
  await expect
    .poll(
      async () => {
        if (await page.locator('.vn-panel, .vn-bg').first().isVisible()) return true;
        if (await skip.isVisible()) await skip.click().catch(() => undefined);
        return false;
      },
      { timeout: 200_000, intervals: [500] },
    )
    .toBe(true);

  // skip through the outro: it halts at the reward moment (the panel "Glutfunken" is up and two sparks rise)
  await expect
    .poll(
      async () => {
        if (await skip.isVisible()) await skip.click().catch(() => undefined);
        return page.locator('.vn-sparks').isVisible();
      },
      { timeout: 60_000, intervals: [500] },
    )
    .toBe(true);
  // the panel shows only once its picture is built (pnpm art:build); CI runs without the art, so check it only when it is there
  const built = await page.evaluate(() => fetch('./assets/locations/glutfunken.webp', { method: 'HEAD' }).then((r) => r.ok && !/html/.test(r.headers.get('content-type') ?? '')));
  if (built) await expect(page.locator('.vn-panel')).toHaveCSS('background-image', /glutfunken/);

  // going on opens the card: "2 ×" and the item, one line
  await expect
    .poll(
      async () => {
        if (await page.locator('.cq-card').isVisible()) return true;
        await page.locator('.vn').click({ position: { x: 40, y: 120 } }).catch(() => undefined);
        return false;
      },
      { timeout: 30_000, intervals: [300] },
    )
    .toBe(true);
  await expect(page.locator('.cq-card')).toContainText(/2\s*×\s*(Ember spark|Glutfunke)/);
  await page.locator('.cq-card').getByRole('button').click();

  // the last line of the scene, then the result screen and the world map
  await expect
    .poll(
      async () => {
        const toMap = page.getByRole('button', { name: /To the world map|Zur Weltkarte/ });
        if (await toMap.isVisible()) return true;
        if (await page.locator('.vn').isVisible()) await page.locator('.vn').click({ position: { x: 40, y: 120 } }).catch(() => undefined);
        return false;
      },
      { timeout: 60_000, intervals: [400] },
    )
    .toBe(true);
  await page.getByRole('button', { name: /To the world map|Zur Weltkarte/ }).click();

  // the backup reminder of the act that was just finished comes first (story 7.3): with act 2 released the company is already in
  // act 2 here, so the sheet names act 1 and holds the title card back until it is answered
  const later = page.getByRole('button', { name: /Later|Später/ });
  await expect(later).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#act-title-name')).toHaveCount(0);
  await later.click();

  // act 2 is in the build since 2026-11-13: its title card comes up (story 11.3) instead of the "coming soon" hint of story 7.3
  await expect(page.locator('#act-title-name')).toHaveText(/Akt 2|Act 2/, { timeout: 20_000 });
});
