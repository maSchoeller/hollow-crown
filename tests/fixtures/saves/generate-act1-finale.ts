/**
 * The save of a finished act 1 (story 11.1): `pnpm tsx tests/fixtures/saves/generate-act1-finale.ts` plays act 1 to its finale with the
 * campaign simulation (autoplay and the home heuristic, Normal) and writes `format3-act1-finale-done.json`, standing on the world map
 * after m1_8. Run it on a checkout of the act-1 release (the fixture of story 11.1 came from main at 6586e7b, before `c.act`
 * existed), so it is a save as players have it; the migration test then checks that it moves on to act 2.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContentFromDisk } from '../../../src/content/node';
import { autoplay, availableNodes, beginBattle, finishBattle, newCampaign, type CampaignState } from '../../../src/core';
import { applyNodeRewards, homeHeuristic } from '../../../tools/simCampaign';

const { data } = loadContentFromDisk();
const avatar = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;

function play(seed: number): CampaignState | null {
  let c = newCampaign(data, seed, { difficulty: 'normal', deathMode: 'standard' }, avatar);
  const spent = { heal: 0, buy: 0, upgrade: 0, rooms: 0, hire: 0, craft: 0 };
  for (let id = availableNodes(data, c).find((n) => n.kind === 'story')?.id; id; id = availableNodes(data, c).find((n) => n.kind === 'story')?.id) {
    let won = false;
    for (let attempt = 0; attempt < 3 && !won; attempt++) {
      const from = { ...c, seed: (c.seed + attempt * 104729) >>> 0 };
      const { state } = autoplay(data, beginBattle(data, from, id, from.roster.map((u) => u.id)).state);
      if (state.outcome !== 'victory') continue;
      const done = finishBattle(data, from, state).campaign;
      applyNodeRewards(data, done, id);
      done.seed = c.seed;
      c = homeHeuristic(data, done, spent);
      won = true;
    }
    if (!won) return null;
  }
  return c.completed.includes('m1_8') ? c : null;
}

let campaign: CampaignState | null = null;
for (let seed = 1; !campaign && seed < 20; seed++) campaign = play(seed);
if (!campaign) throw new Error('act 1 not finished by autoplay');
const record = {
  format: 3,
  campaignId: '00000000-0000-4000-8000-000000000011',
  slot: 'auto',
  createdAt: '2026-11-08T12:00:00.000Z',
  appVersion: '0.3.0',
  contentVersion: 'fixture',
  payload: { campaign, screen: 'worldmap' },
};
writeFileSync(join(process.cwd(), 'tests/fixtures/saves/format3-act1-finale-done.json'), JSON.stringify(record, null, 1) + '\n');
console.log(`act 1 done: ${campaign.completed.join(', ')}; gold ${campaign.gold}, roster ${campaign.roster.length}`);
