/** Fails the build if the initial download (shell + prologue) exceeds the budget (concept/16 §9). */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const BUDGET = 15 * 1024 * 1024;
const dist = join(process.cwd(), 'dist');
let raw = 0;
let packed = 0;
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
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
console.log(`bundle: ${mb(raw)} MB raw, ${mb(packed)} MB transfer (budget ${mb(BUDGET)} MB)`);
if (packed > BUDGET) {
  console.error('✗ initial download over budget');
  process.exit(1);
}
