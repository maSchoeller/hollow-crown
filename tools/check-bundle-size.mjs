/**
 * Fails the build if the initial download (shell + prologue) exceeds the budget (concept/16 §9).
 * 3D unit figures load only when a battle needs them (they are not precached), so only the prologue's figures count:
 * the companions joining in the prologue (the avatar with both portrait variants) and the prologue map's units.
 * Places, half figures and the world map load when first shown and do not count either (vite.config.ts).
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const BUDGET = 15 * 1024 * 1024;
const dist = join(process.cwd(), 'dist');
const content = (f) => parse(readFileSync(join(process.cwd(), 'content', f), 'utf8'));
const act = 'acts/act1';

const prologue = new Set();
const campaign = content(`${act}/campaign.yaml`);
const start = campaign.nodes?.find((n) => n.id === campaign.start);
for (const c of content(`${act}/units.yaml`)) {
  if (c.joins !== campaign.start) continue;
  prologue.add(c.sprite ?? c.id);
  if (c.flags?.includes('avatar')) for (const p of ['avatar_a', 'avatar_b']) prologue.add(p);
}
const map = start && content(`${act}/maps/${start.map}.yaml`);
const mapUnits = [...(map?.units ?? []), ...(map?.reinforcements ?? []).flatMap((r) => r.units ?? [])];
for (const u of mapUnits) prologue.add(u.sprite ?? u.id ?? u.class);
// places, half figures and the world map are not precached; they load when first shown (vite.config.ts ON_DEMAND_ASSETS)
const onDemand = /[\\/]assets[\\/](locations|busts|world)[\\/]/;
const later = (p) => {
  if (onDemand.test(p)) return true;
  const m = /[\\/]models[\\/]units[\\/]([^\\/]+)\.glb$/.exec(p);
  return m !== null && !prologue.has(m[1]);
};

let raw = 0;
let packed = 0;
let skipped = 0;
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (later(p)) skipped++;
    else {
      const size = statSync(p).size;
      raw += size;
      // already compressed formats count as-is
      packed += /\.(png|webp|jpg|mp3|webm|m4a|woff2?)$/.test(f) ? size : gzipSync(readFileSync(p)).length;
    }
  }
};
walk(dist);
const mb = (n) => (n / 1024 / 1024).toFixed(2);
console.log(`bundle: ${mb(raw)} MB raw, ${mb(packed)} MB transfer (budget ${mb(BUDGET)} MB); ${skipped} on-demand files not counted (later unit figures, places, half figures, world map)`);
if (packed > BUDGET) {
  console.error('✗ initial download over budget');
  process.exit(1);
}
