/** pnpm content:check – validates all content YAML (schema, references, i18n). concept/10 §8 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { loadContentFromDisk, contentFiles } from '../src/content/node';
import { checkPackProps, checkPacks, parsePacks, type PackDef } from '../src/content/packs';
import { checkLockedIds, collectIds, ID_KINDS, releasedIdsSchema, renamesSchema, type IdSets, type Renames } from '../src/content/ids';
import { validateContent } from '../src/content/validate';
import { checkDrafts, draftAct } from '../src/content/drafts';
import { mapSchema } from '../src/content/schemaMap';
import { checkReachability } from '../src/content/validateReach';
import type { MapDef } from '../src/core/mapDefs';
import { mapTerr, validateObjectAccess } from '../src/content/validateWalk';
import { unshippedGalleryModels, validateBoardModels, validateSeasons } from '../src/content/validateLook';

const { data, locales, issues } = loadContentFromDisk();
const spriteDir = join(process.cwd(), 'art', 'sprites', 'units');
// a board figure is a sprite sheet folder or a 3D model (art/models/units/<id>.glb)
const modelDir = join(process.cwd(), 'art', 'models', 'units');
// checked whenever either folder exists (the sprite folder is gone since 2026-11-02, the models are in Git)
const sprites =
  existsSync(spriteDir) || existsSync(modelDir)
    ? new Set([...(existsSync(spriteDir) ? readdirSync(spriteDir) : []), ...(existsSync(modelDir) ? readdirSync(modelDir).filter((f) => f.endsWith('.glb')).map((f) => f.slice(0, -4)) : [])])
    : undefined;
const itemDir = join(process.cwd(), 'art', 'items');
const itemImages = new Set(existsSync(itemDir) ? readdirSync(itemDir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)) : []);
const statusDir = join(process.cwd(), 'art', 'status', 'source');
const statusImages = existsSync(statusDir) ? new Set(readdirSync(statusDir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4))) : undefined;
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
  packIssues.push(...checkPackProps(packs, stems(join(process.cwd(), 'art', 'models', 'props'), '.glb') ?? new Set()));
} catch (e) {
  packIssues.push({ file: 'packs.yaml', message: e instanceof Error ? e.message : String(e) });
}
// prop models the board draws by content (story 15.8): a file under art/models/props and no gallery model the build leaves out
const galleryDir = join(process.cwd(), 'concept', '23-art-direction', 'map-assets', 'groups');
const propModels = stems(join(process.cwd(), 'art', 'models', 'props'), '.glb');
if (!propModels || !existsSync(galleryDir)) packIssues.push({ file: 'art/models/props', message: 'prop models or gallery groups not found: board models not checked' });
else {
  const groups = readdirSync(galleryDir).filter((n) => n.endsWith('.yaml')).map((f) => parse(readFileSync(join(galleryDir, f), 'utf8')) as unknown);
  packIssues.push(...validateBoardModels(data, propModels, unshippedGalleryModels(groups)));
}
// story 15.15: the season's ground textures are ones tools/art/ground.py builds (keys of its TEXTURES)
const groundPy = join(process.cwd(), 'tools', 'art', 'ground.py');
const textures = existsSync(groundPy) ? /\r?\nTEXTURES = \{([\s\S]*?)\r?\n\}/.exec(readFileSync(groundPy, 'utf8'))?.[1] : undefined;
const groundNames = textures ? new Set([...textures.matchAll(/^\s+"([a-z_0-9]+)":/gm)].map((m) => m[1]!)) : undefined;
if (!groundNames?.size) packIssues.push({ file: 'tools/art/ground.py', message: 'TEXTURES not found: season ground textures not checked' });
else packIssues.push(...validateSeasons(data, groundNames).filter((i) => i.message.includes('no ground texture')));
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
  } else {
    // before the first lock the save migration already applies renames.yaml (players keep their saves): its targets must exist
    const none = Object.fromEntries(ID_KINDS.map((k) => [k, []])) as unknown as IdSets;
    idIssues.push(...checkLockedIds({ lockedAt: '', packs: [], ids: none }, collectIds(data), renames));
  }
} catch (e) {
  idIssues.push({ file: 'released-ids.json / renames.yaml', message: e instanceof Error ? e.message : String(e) });
}
const found = [...issues, ...packIssues, ...idIssues, ...validateContent(data, locales, sprites, itemImages, placeImages, lieutenantFiles, statusImages)];
// story 11.10: the level drafts of every act whose pack is not released yet, checked as if they lay in it (src/content/drafts.ts)
const draftDir = join(process.cwd(), 'concept', '27-ueberarbeitung', 'levels');
const planned = new Set(packs.filter((p) => !p.released && p.id === `act${p.act}`).map((p) => p.act));
const draftFiles = existsSync(draftDir) ? readdirSync(draftDir).filter((f) => planned.has(draftAct(f) ?? -1)).sort() : [];
const draftYaml: Record<string, unknown> = Object.fromEntries(draftFiles.map((f) => [f, parse(readFileSync(join(draftDir, f), 'utf8'))]));
const drafts = checkDrafts(
  data,
  locales,
  draftYaml,
  [sprites, itemImages, placeImages, lieutenantFiles, statusImages],
);
// the message stays as validateContent words it, so the warning filter below treats a draft like content (missing sprites)
for (const d of drafts) found.push(...d.issues.map((i) => ({ file: `levels/${d.file} ${i.file}`, message: i.message })));
// the fixture maps of tests and the lab (tests/fixtures/maps): chests, villages, doors and levers must be usable there too
const fixtureDir = join(process.cwd(), 'tests', 'fixtures', 'maps');
for (const file of existsSync(fixtureDir) ? readdirSync(fixtureDir).filter((n) => n.endsWith('.yaml')).sort() : []) {
  const p = mapSchema.safeParse(parse(readFileSync(join(fixtureDir, file), 'utf8')));
  if (!p.success) {
    found.push({ file: `fixtures/${file}`, message: `schema: ${p.error.issues[0]?.path.join('.')}: ${p.error.issues[0]?.message}` });
    continue;
  }
  const map = p.data as MapDef;
  validateObjectAccess(data, map, mapTerr(data, map), (f, message) => found.push({ file: `fixtures/${file} ${f}`, message }));
}
const openRefs = drafts.reduce((n, d) => n + d.open.length, 0);
// missing sprites are warnings: the renderer draws placeholders in the final format (concept/16 §12.1)
const warnings = found.filter((i) => i.message.startsWith('unknown sprite') || (i.file === 'lieutenants.yaml' && i.message.startsWith('missing portrait')) || (i.file === 'lieutenants.yaml' && i.message.startsWith('missing model')));
const all = found.filter((i) => !warnings.includes(i));
for (const w of warnings) console.warn(`! ${w.file}: ${w.message} (placeholder)`);
// reachability (review 2026-11-07, M6): dead scenes and one-sided flags, warnings until the content is clean
const draftMaps = Object.values(draftYaml).flatMap((y) => {
  const p = mapSchema.safeParse(y);
  return p.success ? [p.data as MapDef] : [];
});
const unreachable = checkReachability(data, draftMaps);
for (const w of unreachable) console.warn(`! ${w.file}: ${w.message} (reachability)`);
const counts = {
  maps: Object.keys(data.maps).length,
  scenes: Object.keys(data.scenes).length,
  items: Object.keys(data.items).length,
  classes: Object.keys(data.classes).length,
  de: Object.keys(locales.de ?? {}).length,
  en: Object.keys(locales.en ?? {}).length,
  packs: packs.length,
  lockedIds: lockedCount,
  drafts: drafts.length,
  draftOpen: openRefs,
  unreachable: unreachable.length,
};
console.log('content:', JSON.stringify(counts));
if (all.length) {
  for (const i of all) console.error(`✗ ${i.file}: ${i.message}`);
  console.error(`${all.length} problem(s)`);
  process.exit(1);
}
console.log('✓ content OK');
