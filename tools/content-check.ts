/** pnpm content:check – validates all content YAML (schema, references, i18n). concept/10 §8 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { loadContentFromDisk, contentFiles } from '../src/content/node';
import { checkPacks, parsePacks, type PackDef } from '../src/content/packs';
import { checkLockedIds, collectIds, releasedIdsSchema, renamesSchema, type Renames } from '../src/content/ids';
import { validateContent } from '../src/content/validate';

const { data, locales, issues } = loadContentFromDisk();
const spriteDir = join(process.cwd(), 'art', 'sprites', 'units');
// a board figure is a sprite sheet folder or a 3D model (art/models/units/<id>.glb)
const modelDir = join(process.cwd(), 'art', 'models', 'units');
const sprites = existsSync(spriteDir) ? new Set([...readdirSync(spriteDir), ...(existsSync(modelDir) ? readdirSync(modelDir).filter((f) => f.endsWith('.glb')).map((f) => f.slice(0, -4)) : [])]) : undefined;
const itemDir = join(process.cwd(), 'art', 'items');
const itemImages = new Set(existsSync(itemDir) ? readdirSync(itemDir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)) : []);
const placeDir = join(process.cwd(), 'art', 'mockups', 'locations-s1');
const placeImages = existsSync(placeDir) ? new Set(readdirSync(placeDir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4))) : undefined;
const portraitDir = join(process.cwd(), 'art', 'mockups', 'characters-s1');
const stems = (dir: string, ext: string) => (existsSync(dir) ? new Set(readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length))) : undefined);
const lieutenantFiles = { portraits: stems(portraitDir, '.png'), models: stems(modelDir, '.glb') };
let packs: PackDef[] = [];
const packIssues: { file: string; message: string }[] = [];
try {
  packs = parsePacks(parse(readFileSync(join(process.cwd(), 'content', 'packs.yaml'), 'utf8')));
  packIssues.push(...checkPacks(packs, contentFiles(), data.campaign));
} catch (e) {
  packIssues.push({ file: 'packs.yaml', message: e instanceof Error ? e.message : String(e) });
}
// stable IDs (story 7.4): only once a release has locked them with pnpm content:lock
const lockFile = join(process.cwd(), 'content', 'released-ids.json');
const renamesFile = join(process.cwd(), 'content', 'renames.yaml');
const idIssues: { file: string; message: string }[] = [];
let lockedCount = 0;
try {
  const renames: Renames = existsSync(renamesFile) ? renamesSchema.parse(parse(readFileSync(renamesFile, 'utf8')) ?? {}) : {};
  if (existsSync(lockFile)) {
    const locked = releasedIdsSchema.parse(JSON.parse(readFileSync(lockFile, 'utf8')));
    lockedCount = Object.values(locked.ids).reduce((n, l) => n + l.length, 0);
    idIssues.push(...checkLockedIds(locked, collectIds(data), renames));
  }
} catch (e) {
  idIssues.push({ file: 'released-ids.json / renames.yaml', message: e instanceof Error ? e.message : String(e) });
}
const found = [...issues, ...packIssues, ...idIssues, ...validateContent(data, locales, sprites, itemImages, placeImages, lieutenantFiles)];
// missing sprites are warnings: the renderer draws placeholders in the final format (concept/16 §12.1)
const warnings = found.filter((i) => i.message.startsWith('unknown sprite') || (i.file === 'lieutenants.yaml' && i.message.startsWith('missing portrait')) || (i.file === 'lieutenants.yaml' && i.message.startsWith('missing model')));
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
  lockedIds: lockedCount,
};
console.log('content:', JSON.stringify(counts));
if (all.length) {
  for (const i of all) console.error(`✗ ${i.file}: ${i.message}`);
  console.error(`${all.length} problem(s)`);
  process.exit(1);
}
console.log('✓ content OK');
