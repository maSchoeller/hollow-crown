/**
 * Fails the build if the first download exceeds the budget (concept/16 §9).
 *
 * The first download is what a new player fetches before the first battle:
 *  1. everything in the service worker's precache (read from `dist/sw.js`, so a file counts exactly when it is
 *     precached, whatever the globs in vite.config.ts say), plus the worker files themselves;
 *  2. what the first mission needs and is not precached (should be nothing since 2026-10-25: vite.config.ts adds the
 *     first mission's files, tools/build/first-mission.mjs, to the precache; anything listed here is a regression).
 * Everything else in `dist` is on demand (runtime cache `hc-on-demand`, fetched by the mission loading plan in
 * `src/app/loading/plan.ts` or when first shown) and is listed separately by folder; it does not count.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { reportFigures } from './figure-budget.mjs';
import { firstMissionFigures, isFirstMissionFile } from './build/first-mission.mjs';

const dist = join(process.cwd(), 'dist');
// packs.json is written by the packs plugin (tools/build/packs-plugin.ts); core's budget comes from content/packs.yaml
const manifest = JSON.parse(readFileSync(join(dist, 'packs.json'), 'utf8'));
const BUDGET = (manifest.packs.find((p) => p.id === 'core')?.budgetMb ?? 30) * 1024 * 1024;
// informational: the expected size of the first download (precache incl. the first mission); a warning when exceeded
const TARGET = 11 * 1024 * 1024;

// the opening mission's figures (tools/build/first-mission.mjs, also the source of the precache additions)
const prologue = firstMissionFigures();

/** files of `dist` (posix-style paths relative to it) */
const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(dist, p).split(sep).join('/'));
  }
};
walk(dist);

const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
const precached = new Set([...sw.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]));
// the worker, its runtime and the size note are fetched with the first download but are not in the list
const infra = /^(sw\.js|workbox-[^/]+\.js|precache-info\.json)$/;
// not precached, but the first mission cannot start without them (loading screen of the prologue)
const firstMission = (p) => isFirstMissionFile(p, prologue);

const transfer = (p) => {
  const buf = readFileSync(join(dist, p));
  // already compressed formats count as-is
  return /\.(png|webp|jpg|mp3|webm|m4a|woff2?)$/.test(p) ? buf.length : gzipSync(buf).length;
};

const groupOf = (p) => {
  const parts = p.split('/');
  if (parts.length === 2 && parts[0] === 'assets') return 'assets/(files)';
  return parts.length > 3 ? parts.slice(0, 3).join('/') : parts.length > 1 ? parts.slice(0, 2).join('/') : '(root)';
};
const mb = (n) => (n / 1024 / 1024).toFixed(2);
const sum = { precache: 0, mission: 0, onDemand: 0 };
const counts = { precache: 0, mission: 0, onDemand: 0 };
const groups = new Map();
const note = (kind, p, size) => {
  sum[kind] += size;
  counts[kind]++;
  if (kind === 'precache') return;
  const key = `${kind === 'mission' ? 'first mission' : 'on demand'}  ${groupOf(p)}`;
  const g = groups.get(key) ?? { n: 0, b: 0 };
  g.n++;
  g.b += size;
  groups.set(key, g);
};

for (const p of files) {
  if (p.endsWith('.map')) continue;
  if (precached.has(p) || infra.test(p)) note('precache', p, transfer(p));
  else if (firstMission(p)) note('mission', p, transfer(p));
  else note('onDemand', p, transfer(p));
}
// precache entries that are missing from dist would mean a broken build
for (const p of precached) if (!files.includes(p)) console.warn(`warning: precache lists ${p}, which is not in dist`);

console.log('on demand / first-mission files by folder (transfer size):');
for (const [k, g] of [...groups].sort((a, b) => b[1].b - a[1].b)) console.log(`  ${mb(g.b).padStart(6)} MB  ${String(g.n).padStart(3)} files  ${k}`);
const total = sum.precache + sum.mission;
console.log(`precache: ${counts.precache} files, ${mb(sum.precache)} MB; first mission fetches ${counts.mission} more files, ${mb(sum.mission)} MB`);
console.log(`on demand, not counted: ${counts.onDemand} files, ${mb(sum.onDemand)} MB`);
console.log(`bundle: first download ${mb(total)} MB (budget ${mb(BUDGET)} MB, target ${mb(TARGET)} MB)`);
if (total > TARGET) console.warn(`warning: over the ${mb(TARGET)} MB target`);

// the other packs against their budgets from content/packs.yaml (story 7.1): a warning, not a failure
for (const pack of manifest.packs) {
  if (pack.id === 'core') continue;
  const size = pack.files.reduce((n, f) => n + transfer(f.path), 0);
  const budget = pack.budgetMb * 1024 * 1024;
  console.log(`pack ${pack.id}: ${pack.files.length} files, ${mb(size)} MB (budget ${mb(budget)} MB)`);
  if (size > budget) console.warn(`warning: pack ${pack.id} over its budget`);
}

// board figures against figureBudget of content/packs.yaml (art-direction §4.6): a warning, not a failure
reportFigures(files.filter((p) => /^assets\/(?:[^/]+\/)?models\/units\/[^/]+\.glb$/.test(p)).map((p) => join(dist, p)));

if (total > BUDGET) {
  console.error('✗ first download (pack core) over budget');
  process.exit(1);
}
