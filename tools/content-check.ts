/** pnpm content:check – validates all content YAML (schema, references, i18n). concept/10 §8 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadContentFromDisk } from '../src/content/node';
import { validateContent } from '../src/content/validate';

const { data, locales, issues } = loadContentFromDisk();
const spriteDir = join(process.cwd(), 'art', 'sprites', 'units');
const sprites = existsSync(spriteDir) ? new Set(readdirSync(spriteDir)) : undefined;
const all = [...issues, ...validateContent(data, locales, sprites)];
const counts = {
  maps: Object.keys(data.maps).length,
  dialogues: Object.keys(data.dialogues).length,
  items: Object.keys(data.items).length,
  classes: Object.keys(data.classes).length,
  de: Object.keys(locales.de ?? {}).length,
  en: Object.keys(locales.en ?? {}).length,
};
console.log('content:', JSON.stringify(counts));
if (all.length) {
  for (const i of all) console.error(`✗ ${i.file}: ${i.message}`);
  console.error(`${all.length} problem(s)`);
  process.exit(1);
}
console.log('✓ content OK');
