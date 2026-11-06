/**
 * Runs the tone test of story 8.1 (`?tonbruch`, dev: `__hc.toneTest()`): Gerrit's grave, Fenn's farewell card, the memorial
 * variant of N1, then back to the title. Plays on a throwaway campaign without a campaign id, so nothing is ever saved
 * and no real save is touched. What the run shows lives in toneTestPlan.ts; the test sheet is concept/23-art-direction/tonbruch-test.md.
 */
import { TONE_TEST, toneTestCampaign, toneTestResult } from '../toneTestPlan';
import { battle } from './battle';
import { afterPrepare, ensurePack } from './packs';
import { screen } from './screen';
import { campaign, campaignId, data } from './session';

/** The act pack holds part 2 (farewell lines, N1); part 1 is in core and starts at once. */
const PART2_PACK = 'act1';

export async function startToneTest(): Promise<void> {
  await afterPrepare();
  const part2 = ensurePack(PART2_PACK);
  campaignId.value = null;
  campaign.value = toneTestCampaign(data);
  battle.value = null;
  const end = () => {
    campaign.value = null;
    screen.value = { name: 'title' };
  };
  const toFarewell = async () => {
    await part2;
    screen.value = { name: 'farewell', result: toneTestResult(data), index: 0, then: { name: 'dialogue', id: TONE_TEST.memorial, next: end } };
  };
  screen.value = { name: 'dialogue', id: TONE_TEST.grave, next: () => void toFarewell() };
}
