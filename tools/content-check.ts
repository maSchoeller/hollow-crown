/** pnpm content:check – validates all content YAML (schema, references, i18n). concept/10 §8 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { loadContentFromDisk, contentFiles } from '../src/content/node';
import { checkPacks, parsePacks, type PackDef } from '../src/content/packs';
import { validateContent } from '../src/content/validate';

const { data, locales, issues } = loadContentFromDisk();
const spriteDir = join(process.cwd(), 'art', 'sprites', 'units');
const sprites = existsSync(spriteDir) ? new Set(readdirSync(spriteDir)) : undefined;
const itemDir = join(process.cwd(), 'art', 'items');
const itemImages = new Set(existsSync(itemDir) ? readdirSync(itemDir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)) : []);
const placeDir = join(process.cwd(), 'art', 'mockups', 'locations-s1');
const placeImages = existsSync(placeDir) ? new Set(readdirSync(placeDir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4))) : undefined;
const bgDir = join(process.cwd(), 'art', 'backgrounds');
const backgroundImages = existsSync(bgDir) ? new Set(readdirSync(bgDir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4))) : undefined;
let packs: PackDef[] = [];
const packIssues: { file: string; message: string }[] = [];
try {
  packs = parsePacks(parse(readFileSync(join(process.cwd(), 'content', 'packs.yaml'), 'utf8')));
  packIssues.push(...checkPacks(packs, contentFiles(), data.campaign));
} catch (e) {
  packIssues.push({ file: 'packs.yaml', message: e instanceof Error ? e.message : String(e) });
}
const found = [...issues, ...packIssues, ...validateContent(data, locales, sprites, itemImages, placeImages, backgroundImages)];
// missing sprites are warnings: the renderer draws placeholders in the final format (concept/16 §12.1)
const warnings = found.filter((i) => i.message.startsWith('unknown sprite'));
const all = found.filter((i) => !warnings.includes(i));
for (const w of warnings) console.warn(`! ${w.file}: ${w.message} (placeholder)`);
const counts = {
  maps: Object.keys(data.maps).length,
  scenes: Object.keys(data.scenes).length,
  items: Object.keys(data.items).length,
  classes: Object.keys(data.classes).length,
  de: Object.keys(locales.de ?? {}).length,
  en: Object.keys(locales.en ?? {}).length,
  packs: packs.length,
};
console.log('content:', JSON.stringify(counts));
if (all.length) {
  for (const i of all) console.error(`✗ ${i.file}: ${i.message}`);
  console.error(`${all.length} problem(s)`);
  process.exit(1);
}
console.log('✓ content OK');
