import type { z } from 'zod';
import { chronicleTexts } from '../core/campaign/chronicle';
import { memorialTexts } from '../core/campaign/memorial';
import { sceneTexts } from '../core/campaign/scene';
import type {
  AffixDef,
  Balance,
  CampaignDef,
  CharDef,
  ChroniclePageDef,
  ClassDef,
  FlagDef,
  GameData,
  HomeKind,
  HomeViewDef,
  ItemDef,
  LieutenantDef,
  MapDef,
  MapUnitDef,
  MemorialDef,
  Rarity,
  RenderDef,
  WorldDef,
  RoomDef,
  RuneDef,
  SceneDef,
  SetDef,
  SkillDef,
  SupportPairDef,
  TerrainDef,
} from '../core/defs';
import { pairKey } from '../core/util';
import {
  affixSchema,
  balanceSchema,
  campaignSchema,
  worldSchema,
  charSchema,
  chroniclePageSchema,
  classSchema,
  sceneSchema,
  supportPairSchema,
  flagSchema,
  homeSchema,
  itemSchema,
  lieutenantSchema,
  mapSchema,
  memorialSchema,
  renderSchema,
  roomSchema,
  runeSchema,
  setSchema,
  skillSchema,
  terrainSchema,
} from './schemas';

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

const RUNE_RARITY: Record<number, Rarity> = { 1: 'common', 2: 'rare', 3: 'epic' };

interface PackParts {
  maps: Record<string, MapDef>;
  scenes: Record<string, SceneDef>;
  chronicle: Record<string, ChroniclePageDef>;
  memorials: Record<string, MemorialDef>;
  supports: Record<string, SupportPairDef>;
  lieutenants: Record<string, LieutenantDef>;
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
  return { maps, scenes, chronicle, memorials, supports, lieutenants, locales };
}

/**
 * Adds the maps, scenes, chronicle pages, support pairs and texts of a pack to already loaded content, in place: modules that hold `data` or the
 * locale tables see the new entries without reloading (story 7.2). Returns the problems of the pack's files.
 */
export function mergePackContent(loaded: LoadedContent, files: Record<string, unknown>): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const { maps, scenes, chronicle, memorials, supports, lieutenants, locales } = parsePackFiles(files, issues);
  resolveLieutenantClasses(maps, { ...loaded.data.lieutenants, ...lieutenants }, issues);
  Object.assign(loaded.data.maps, maps);
  Object.assign(loaded.data.scenes, scenes);
  Object.assign(loaded.data.chronicle, chronicle);
  Object.assign(loaded.data.memorials, memorials);
  Object.assign(loaded.data.supports, supports);
  Object.assign((loaded.data.lieutenants ??= {}), lieutenants);
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
  const chars = parseList<CharDef>('units.yaml', get('acts/act1/units.yaml'), charSchema, issues);
  const items = parseList<ItemDef>('items.yaml', get('core/items.yaml'), itemSchema, issues);
  const skills = parseList<SkillDef>('skills.yaml', get('core/skills.yaml'), skillSchema, issues);
  const affixes = parseList<AffixDef>('affixes.yaml', get('core/affixes.yaml'), affixSchema, issues);
  const runes = parseList<RuneDef>('runes.yaml', get('core/runes.yaml'), runeSchema, issues);
  const sets = parseList<SetDef>('sets.yaml', get('core/sets.yaml'), setSchema, issues);
  const rooms = parseList<RoomDef>('rooms.yaml', get('core/rooms.yaml'), roomSchema, issues);
  const terrain = parseList<TerrainDef>('terrain.yaml', get('core/terrain.yaml'), terrainSchema, issues);
  const flagList = parseList<FlagDef>('flags.yaml', get('acts/act1/flags.yaml'), flagSchema, issues);
  const campaign = parseOne<CampaignDef>('campaign.yaml', get('acts/act1/campaign.yaml'), campaignSchema, issues);
  const world = parseOne<WorldDef>('valmora.yaml', get('world/valmora.yaml'), worldSchema, issues);
  const home = parseOne<Record<HomeKind, HomeViewDef>>('home.yaml', get('home/home.yaml'), homeSchema, issues);
  const { maps, scenes, chronicle, memorials, supports, lieutenants, locales } = parsePackFiles(files, issues);
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
    campaign: campaign as CampaignDef,
    world: world as WorldDef,
    lieutenants,
  };
  return { data, locales, issues };
}
