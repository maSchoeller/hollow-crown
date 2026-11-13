import type { z } from 'zod';
import { chronicleTexts } from '../core/campaign/chronicle';
import { memorialTexts } from '../core/campaign/memorial';
import { sceneTexts } from '../core/campaign/scene';
import type { AffixDef, CharDef, ClassDef, HomeKind, ItemDef, Rarity, RecipeDef, RuneDef, SetDef, SkillDef } from '../core/defs';
import type { Balance } from '../core/balanceDefs';
import type { GameData } from '../core/gameData';
import type { HauntPoolsDef, MapDef, MapUnitDef, TerrainDef } from '../core/mapDefs';
import type { HandbookDef, RenderDef, WorldDef } from '../core/renderDefs';
import type { CampaignDef, ChroniclePageDef, FlagDef, HomeViewDef, LieutenantDef, MemorialDef, RoomDef, SceneDef, SupportPairDef } from '../core/storyDefs';
import { pairKey } from '../core/util';
import { balanceSchema } from './schemaBalance';
import { campaignSchema, chroniclePageSchema, hauntPoolsSchema, homeSchema, lieutenantSchema, memorialSchema, roomSchema, sceneSchema, supportPairSchema, worldSchema } from './schemaCampaign';
import { flagSchema } from './schemaConditions';
import { mapSchema, terrainSchema } from './schemaMap';
import { handbookSchema, renderSchema } from './schemaRender';
import { affixSchema, charSchema, classSchema, itemSchema, recipeSchema, runeSchema, setSchema, skillSchema } from './schemaUnits';

export type Locales = Record<string, Record<string, string>>;

export interface ContentIssue {
  file: string;
  message: string;
}

export interface LoadedContent {
  data: GameData;
  locales: Locales;
  issues: ContentIssue[];
}

/** Normalises a glob/file path to "acts/act1/maps/x.yaml" relative to the content root. */
export function contentPath(p: string): string {
  const n = p.replace(/\\/g, '/');
  const i = n.lastIndexOf('content/');
  return i >= 0 ? n.slice(i + 'content/'.length) : n;
}

function flatten(obj: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else if (obj !== undefined && obj !== null) out[prefix] = String(obj);
  return out;
}

function parseList<T>(file: string, raw: unknown, schema: z.ZodType, issues: ContentIssue[]): T[] {
  if (!Array.isArray(raw)) {
    issues.push({ file, message: 'expected a list' });
    return [];
  }
  const out: T[] = [];
  raw.forEach((entry, i) => {
    const r = schema.safeParse(entry);
    if (r.success) out.push(r.data as T);
    else
      issues.push({
        file,
        message: `entry ${i} (${(entry as { id?: string })?.id ?? '?'}): ${r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`,
      });
  });
  return out;
}

function parseOne<T>(file: string, raw: unknown, schema: z.ZodType, issues: ContentIssue[]): T | null {
  const r = schema.safeParse(raw);
  if (r.success) return r.data as T;
  issues.push({ file, message: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') });
  return null;
}

const byId = <T extends { id: string }>(list: T[]): Record<string, T> => Object.fromEntries(list.map((x) => [x.id, x]));

/** The document of `path` (relative to content/) in a set of files, or undefined. */
const fileAt = (files: Record<string, unknown>, path: string): unknown => files[Object.keys(files).find((k) => contentPath(k) === path) ?? ''];

/** Act numbers of the folders that hold `acts/actN/<file>`, ascending. */
function actFolders(files: Record<string, unknown>, file: string): number[] {
  const out = new Set<number>();
  for (const k of Object.keys(files)) {
    const [root, folder, name, ...more] = contentPath(k).split('/');
    const m = /^act(\d+)$/.exec(folder ?? '');
    if (root === 'acts' && m && name === file && !more.length) out.add(Number(m[1]));
  }
  return [...out].sort((a, b) => a - b);
}

/** Adds companions of one act; one id in two acts is an error (the later one is dropped, story 11.1). */
function addChars(into: CharDef[], list: CharDef[], file: string, issues: ContentIssue[]): void {
  for (const ch of list) {
    if (into.some((x) => x.id === ch.id)) issues.push({ file, message: `companion ${ch.id} is declared twice (acts/*/units.yaml)` });
    else into.push(ch);
  }
}

const RUNE_RARITY: Record<number, Rarity> = { 1: 'common', 2: 'rare', 3: 'epic' };

interface PackParts {
  maps: Record<string, MapDef>;
  scenes: Record<string, SceneDef>;
  chronicle: Record<string, ChroniclePageDef>;
  memorials: Record<string, MemorialDef>;
  supports: Record<string, SupportPairDef>;
  lieutenants: Record<string, LieutenantDef>;
  hauntPools: Record<number, HauntPoolsDef>;
  locales: Locales;
}

/** Units of a map in every place the file can name them (placed, reinforcements, spawned by a trigger). */
function mapUnits(m: MapDef): MapUnitDef[] {
  return [
    ...m.units,
    ...m.reinforcements.flatMap((r) => r.units),
    ...m.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : []))),
  ];
}

/** A unit with `lieutenant:` and no class of its own gets the class of the lieutenant (story 3.1; the map's own value wins). */
function resolveLieutenantClasses(maps: Record<string, MapDef>, lieutenants: Record<string, LieutenantDef>, issues: ContentIssue[]): void {
  for (const m of Object.values(maps))
    for (const u of mapUnits(m)) {
      if (u.class) continue;
      const lt = u.lieutenant ? lieutenants[u.lieutenant] : undefined;
      if (lt) u.class = lt.class;
      else issues.push({ file: `maps/${m.id}`, message: `${u.id ?? 'unit'}: class is required unless the unit names a known lieutenant` });
    }
}

/**
 * Maps, scenes, chronicle pages, support pairs and texts of a set of YAML documents (also the parts a pack other than
 * core adds, story 7.2). The German text of a scene or chronicle page comes from the page itself.
 */
function parsePackFiles(files: Record<string, unknown>, issues: ContentIssue[]): PackParts {
  const maps: Record<string, MapDef> = {};
  const scenes: Record<string, SceneDef> = {};
  const chronicle: Record<string, ChroniclePageDef> = {};
  const memorials: Record<string, MemorialDef> = {};
  const supports: Record<string, SupportPairDef> = {};
  const lieutenants: Record<string, LieutenantDef> = {};
  const hauntPools: Record<number, HauntPoolsDef> = {};
  const locales: Locales = {};
  for (const [k, raw] of Object.entries(files)) {
    const p = contentPath(k);
    if (/^acts\/[^/]+\/maps\//.test(p)) {
      const m = parseOne<Omit<MapDef, 'act'>>(p, raw, mapSchema, issues);
      // the act of the folder (acts/act2/maps/…) decides the season of the board
      if (m) maps[m.id] = { ...m, act: Number(/^acts\/act(\d+)\//.exec(p)?.[1] ?? 1) };
    } else if (/^acts\/act\d+\/supports\.yaml$/.test(p)) {
      for (const sp of parseList<Omit<SupportPairDef, 'key'>>(p, raw ?? [], supportPairSchema, issues)) {
        const key = pairKey(sp.pair[0], sp.pair[1]);
        if (supports[key]) issues.push({ file: p, message: `support pair ${key} is listed twice` });
        supports[key] = { ...sp, key };
      }
    } else if (/^acts\/act\d+\/lieutenants\.yaml$/.test(p)) {
      const act = Number(/^acts\/act(\d+)\//.exec(p)![1]);
      for (const lt of parseList<Omit<LieutenantDef, 'act'>>(p, raw ?? [], lieutenantSchema, issues)) {
        if (lieutenants[lt.id]) issues.push({ file: p, message: `lieutenant ${lt.id} is listed twice` });
        lieutenants[lt.id] = { ...lt, act };
      }
    } else if (/^acts\/act\d+\/haunts\.yaml$/.test(p)) {
      const act = Number(/^acts\/act(\d+)\//.exec(p)![1]);
      const pools = parseOne<Omit<HauntPoolsDef, 'act'>>(p, raw, hauntPoolsSchema, issues);
      if (pools) hauntPools[act] = { ...pools, act };
    } else if (/^acts\/act\d+\/chronicle\.yaml$/.test(p)) {
      const act = Number(/^acts\/act(\d+)\//.exec(p)![1]);
      for (const page of parseList<Omit<ChroniclePageDef, 'act'>>(p, raw ?? [], chroniclePageSchema, issues)) chronicle[page.id] = { ...page, act };
    } else if (/^acts\/act\d+\/memorials\.yaml$/.test(p)) {
      const act = Number(/^acts\/act(\d+)\//.exec(p)![1]);
      for (const m of parseList<Omit<MemorialDef, 'act'>>(p, raw ?? [], memorialSchema, issues)) memorials[m.id] = { ...m, act };
    } else if (/^acts\/[^/]+\/scenes\//.test(p)) {
      const d = parseOne<SceneDef>(p, raw, sceneSchema, issues);
      if (d) scenes[d.id] = d;
    } else if (/^locales\/[a-z]+\//.test(p)) {
      // content/locales/<lang>/<act>.dialogue.yaml: the English (or other) texts of scenes
      const lang = p.split('/')[1]!;
      locales[lang] = { ...(locales[lang] ?? {}), ...flatten(raw) };
    } else if (/^(core|acts\/[^/]+)\/locales\//.test(p)) {
      const lang = p.slice(p.lastIndexOf('/') + 1).split('.')[0]!;
      locales[lang] = { ...(locales[lang] ?? {}), ...flatten(raw) };
    }
  }
  // the German text sits in the scene and the chronicle page itself
  for (const sc of Object.values(scenes)) locales.de = { ...(locales.de ?? {}), ...sceneTexts(sc) };
  for (const pg of Object.values(chronicle)) locales.de = { ...(locales.de ?? {}), ...chronicleTexts(pg) };
  for (const m of Object.values(memorials)) locales.de = { ...(locales.de ?? {}), ...memorialTexts(m) };
  return { maps, scenes, chronicle, memorials, supports, lieutenants, hauntPools, locales };
}

/**
 * Adds the maps, scenes, chronicle pages, support pairs and texts of a pack to already loaded content, in place: modules that hold `data` or the
 * locale tables see the new entries without reloading (story 7.2). Returns the problems of the pack's files.
 */
export function mergePackContent(loaded: LoadedContent, files: Record<string, unknown>): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const { maps, scenes, chronicle, memorials, supports, lieutenants, hauntPools, locales } = parsePackFiles(files, issues);
  resolveLieutenantClasses(maps, { ...loaded.data.lieutenants, ...lieutenants }, issues);
  // story 11.1: the head files of a later act (campaign, companions, flags) come with its pack, not with core
  for (const act of actFolders(files, 'campaign.yaml')) {
    const camp = parseOne<CampaignDef>(`acts/act${act}/campaign.yaml`, fileAt(files, `acts/act${act}/campaign.yaml`), campaignSchema, issues);
    if (camp) loaded.data.acts[act] = { ...camp, act };
  }
  for (const act of actFolders(files, 'units.yaml')) {
    const list: CharDef[] = Object.values(loaded.data.chars);
    const before = list.length;
    addChars(list, parseList<CharDef>(`acts/act${act}/units.yaml`, fileAt(files, `acts/act${act}/units.yaml`), charSchema, issues).map((ch) => ({ ...ch, act })), `acts/act${act}/units.yaml`, issues);
    for (const ch of list.slice(before)) loaded.data.chars[ch.id] = ch;
  }
  for (const act of actFolders(files, 'flags.yaml'))
    for (const f of parseList<FlagDef>(`acts/act${act}/flags.yaml`, fileAt(files, `acts/act${act}/flags.yaml`) ?? [], flagSchema, issues)) {
      if (loaded.data.flags[f.id]) issues.push({ file: `acts/act${act}/flags.yaml`, message: `flag ${f.id} is declared twice (acts/*/flags.yaml)` });
      else loaded.data.flags[f.id] = f;
    }
  Object.assign(loaded.data.maps, maps);
  Object.assign(loaded.data.scenes, scenes);
  Object.assign(loaded.data.chronicle, chronicle);
  Object.assign(loaded.data.memorials, memorials);
  Object.assign(loaded.data.supports, supports);
  Object.assign((loaded.data.lieutenants ??= {}), lieutenants);
  Object.assign((loaded.data.hauntPools ??= {}), hauntPools);
  for (const [lang, table] of Object.entries(locales)) loaded.locales[lang] = Object.assign(loaded.locales[lang] ?? {}, table);
  loaded.issues.push(...issues);
  return issues;
}

/** Builds GameData from parsed YAML documents keyed by path (browser: import.meta.glob, Node: fs). */
export function buildContent(files: Record<string, unknown>): LoadedContent {
  const issues: ContentIssue[] = [];
  const get = (p: string) => {
    const key = Object.keys(files).find((k) => contentPath(k) === p);
    if (!key) issues.push({ file: p, message: 'missing file' });
    return key ? files[key] : undefined;
  };
  const balance = parseOne<Balance>('balance.yaml', get('core/balance.yaml'), balanceSchema, issues);
  const render = parseOne<RenderDef>('render.yaml', get('core/render.yaml'), renderSchema, issues);
  const classes = parseList<ClassDef>('classes.yaml', get('core/classes.yaml'), classSchema, issues);
  const items = parseList<ItemDef>('items.yaml', get('core/items.yaml'), itemSchema, issues);
  const skills = parseList<SkillDef>('skills.yaml', get('core/skills.yaml'), skillSchema, issues);
  const affixes = parseList<AffixDef>('affixes.yaml', get('core/affixes.yaml'), affixSchema, issues);
  const runes = parseList<RuneDef>('runes.yaml', get('core/runes.yaml'), runeSchema, issues);
  const recipes = parseList<RecipeDef>('recipes.yaml', get('core/recipes.yaml'), recipeSchema, issues);
  for (const [i, r] of recipes.entries()) if (recipes.findIndex((x) => x.id === r.id) !== i) issues.push({ file: 'recipes.yaml', message: `recipe ${r.id} is listed twice` });
  const sets = parseList<SetDef>('sets.yaml', get('core/sets.yaml'), setSchema, issues);
  const rooms = parseList<RoomDef>('rooms.yaml', get('core/rooms.yaml'), roomSchema, issues);
  const terrain = parseList<TerrainDef>('terrain.yaml', get('core/terrain.yaml'), terrainSchema, issues);
  // act 1 always; the registers of later acts where their pack is loaded (story 11.10: act 2, unreleased, for the drafts)
  const later = Object.keys(files)
    .map(contentPath)
    .filter((p) => /^acts\/act([2-9]|\d{2,})\/flags\.yaml$/.test(p))
    .sort();
  const flagList: FlagDef[] = [];
  for (const p of ['acts/act1/flags.yaml', ...later])
    for (const f of parseList<FlagDef>(p, get(p), flagSchema, issues)) {
      // one flag lives in one register: an id twice across the acts is an error (the later one is dropped)
      if (flagList.some((x) => x.id === f.id)) issues.push({ file: p, message: `flag ${f.id} is declared twice (acts/*/flags.yaml)` });
      else flagList.push(f);
    }
  // story 11.1: the campaign and the companions of every act folder whose files are here (act 1 always; act 2 in Node and once its
  // pack is released and loaded in the browser, then through mergePackContent)
  const acts: Record<number, CampaignDef> = {};
  const chars: CharDef[] = [];
  for (const act of [1, ...actFolders(files, 'campaign.yaml').filter((a) => a !== 1)]) {
    const camp = parseOne<CampaignDef>(`acts/act${act}/campaign.yaml`, get(`acts/act${act}/campaign.yaml`), campaignSchema, issues);
    if (camp) acts[act] = { ...camp, act };
  }
  for (const act of [1, ...actFolders(files, 'units.yaml').filter((a) => a !== 1)]) addChars(chars, parseList<CharDef>(`acts/act${act}/units.yaml`, get(`acts/act${act}/units.yaml`), charSchema, issues).map((ch) => ({ ...ch, act })), `acts/act${act}/units.yaml`, issues);
  const world = parseOne<WorldDef>('valmora.yaml', get('world/valmora.yaml'), worldSchema, issues);
  const home = parseOne<Record<HomeKind, HomeViewDef>>('home.yaml', get('home/home.yaml'), homeSchema, issues);
  const handbook = parseOne<HandbookDef>('handbook.yaml', get('core/handbook.yaml'), handbookSchema, issues);
  const { maps, scenes, chronicle, memorials, supports, lieutenants, hauntPools, locales } = parsePackFiles(files, issues);
  resolveLieutenantClasses(maps, lieutenants, issues);
  // runes are items too (they sit in the convoy and get sold/bought)
  const runeItems: ItemDef[] = runes.map((r) => ({
    id: r.id,
    kind: 'rune',
    slot: 'bag',
    wt: 0,
    rarity: r.utility ? 'rare' : (RUNE_RARITY[r.tier ?? 1] ?? 'common'),
    price: r.price ?? 0,
    element: r.element,
    tags: ['convoyOnly'],
    image: r.image,
  }));
  const data: GameData = {
    balance: balance as Balance,
    render: render as RenderDef,
    classes: byId(classes),
    chars: byId(chars),
    items: byId([...items, ...runeItems]),
    skills: byId(skills),
    affixes: byId(affixes),
    runes: byId(runes),
    recipes: byId(recipes),
    sets: byId(sets),
    rooms: byId(rooms),
    terrain: byId(terrain),
    maps,
    scenes,
    flags: byId(flagList),
    supports,
    chronicle,
    memorials,
    home: home as Record<HomeKind, HomeViewDef>,
    acts,
    world: world as WorldDef,
    lieutenants,
    hauntPools,
    handbook: handbook ?? undefined,
  };
  return { data, locales, issues };
}
