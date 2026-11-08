/**
 * The save "act 2 without missions" (story 11.3, first live step of act 2): `pnpm tsx tests/fixtures/saves/generate-act2-no-missions.ts`
 * loads `format3-act1-finale-done.json` as the app does with act 2 in the build (migration, `normalizeCampaign` moves it on to
 * act 2), closes the title card (`markActTitleSeen`) and writes `format3-act2-no-missions.json`: on the world map of act 2, no
 * mission of act 2 playable yet. The following live steps of act 2 check with it that such saves still load.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContentFromDisk } from '../../../src/content/node';
import { applyCampaign, normalizeCampaign } from '../../../src/core';
import { migrate, type SaveRecord } from '../../../src/persistence/save';

const dir = join(process.cwd(), 'tests/fixtures/saves');
const { data } = loadContentFromDisk();
const open = { ...data, releasedActs: [1, 2] };
const rec = migrate(JSON.parse(readFileSync(join(dir, 'format3-act1-finale-done.json'), 'utf8')) as SaveRecord);
const moved = normalizeCampaign(open, rec.payload.campaign);
if (moved.act !== 2) throw new Error('the save did not move on to act 2');
const campaign = applyCampaign(open, moved, { type: 'markActTitleSeen', act: 2 }).campaign;
const record = {
  ...rec,
  campaignId: '00000000-0000-4000-8000-000000000012',
  createdAt: '2026-11-08T23:00:00.000Z',
  payload: { campaign, screen: 'worldmap' },
};
writeFileSync(join(dir, 'format3-act2-no-missions.json'), JSON.stringify(record, null, 1) + '\n');
console.log(`act ${campaign.act}, title seen ${campaign.actTitleSeen}; roster ${campaign.roster.map((u) => u.id).join(', ')}`);
