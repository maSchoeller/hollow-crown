/**
 * Regenerates the save fixtures (concept/24-architecture §5.15): `pnpm tsx tests/fixtures/saves/generate.ts`.
 * Format 1 is the PoC record as the old app wrote it; format 2 carries a running prologue battle.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContentFromDisk } from '../../../src/content/node';
import { applyCommand, autoCommand, beginBattle, newCampaign, type Command } from '../../../src/core';

const dir = join(process.cwd(), 'tests/fixtures/saves');
const { data } = loadContentFromDisk();
const avatar = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;
const createdAt = '2026-10-01T12:00:00.000Z';

const c1 = newCampaign(data, 11, { difficulty: 'normal', deathMode: 'standard' }, avatar);
const format1 = {
  slot: 'auto',
  version: 1,
  createdAt,
  appVersion: '0.1.0',
  payload: { campaign: c1, screen: 'worldmap' },
};
writeFileSync(join(dir, 'format1-auto.json'), JSON.stringify(format1, null, 1) + '\n');

const c2 = newCampaign(
  data,
  22,
  { difficulty: 'hard', deathMode: 'classic' },
  { ...avatar, name: 'Ilsa', pronoun: 'she', portrait: 'avatar_b' },
);
const node = data.campaign.start;
const deploy = c2.roster.map((r) => r.id);
const start = beginBattle(data, c2, node, deploy).state;
let s = start;
const commands: Command[] = [];
// play into the second player round so the log holds a full round and the start of the next
while (commands.filter((x) => x.type === 'endPhase').length < 2 && !s.outcome) {
  const cmd = autoCommand(data, s);
  s = applyCommand(data, s, cmd).state;
  commands.push(cmd);
}
const turnStartIndex = commands.map((x) => x.type).lastIndexOf('endPhase') + 1;
// and one command into the new round, so restarting the round has something to undo
if (!s.outcome) commands.push(autoCommand(data, s));
const format2 = {
  format: 2,
  campaignId: '00000000-0000-4000-8000-000000000002',
  slot: 'auto',
  createdAt,
  appVersion: '0.2.0',
  contentVersion: 'fixture',
  payload: { campaign: c2, battle: { start, commands, turnStartIndex }, screen: 'battle' },
};
writeFileSync(join(dir, 'format2-auto.json'), JSON.stringify(format2, null, 1) + '\n');
console.log({ commands: commands.length, turnStartIndex });
