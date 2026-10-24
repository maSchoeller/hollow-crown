/**
 * pnpm content:lock – locks the IDs of the released content after an act release (architecture §5.16, story 7.4).
 * Writes content/released-ids.json: earlier locked IDs stay, the IDs of every pack with `released: true` join.
 * Run it as part of the release (AGENTS.md "Akt-Release"), not during development.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { collectIds, mergeLock, releasedIdsSchema } from '../src/content/ids';
import { loadContentFromDisk } from '../src/content/node';
import { contentByPack, readPacks } from './build/packs-plugin';

const root = process.cwd();
const out = join(root, 'content', 'released-ids.json');
const packs = readPacks(root);
const released = packs.filter((p) => p.released).map((p) => p.id);
const releasedFiles = new Set(released.flatMap((id) => contentByPack(root, packs).get(id) ?? []));
const inReleased = (dir: string) => (id: string) => [...releasedFiles].some((f) => f.endsWith(`/${dir}/${id}.yaml`) || f.endsWith(`/${dir}/${id}.yml`));

const { data, issues } = loadContentFromDisk(root);
if (issues.length) {
  for (const i of issues) console.error(`✗ ${i.file}: ${i.message}`);
  console.error('content has problems; run pnpm content:check first');
  process.exit(1);
}
const current = collectIds(data, { maps: inReleased('maps'), scenes: inReleased('scenes') });
const previous = existsSync(out) ? releasedIdsSchema.parse(JSON.parse(readFileSync(out, 'utf8'))) : null;
const lock = mergeLock(previous, current, released, new Date().toISOString().slice(0, 10));
writeFileSync(out, JSON.stringify(lock, null, 1) + '\n');
const n = Object.values(lock.ids).reduce((s, l) => s + l.length, 0);
console.log(`✓ locked ${n} IDs of ${lock.packs.join(', ')} in content/released-ids.json`);
