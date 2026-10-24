import type { z } from 'zod';
import { sceneTexts } from '../core/campaign/scene';
import type {
  AffixDef,
  Balance,
  CampaignDef,
  CharDef,
  ClassDef,
  FlagDef,
  GameData,
  ItemDef,
  MapDef,
  Rarity,
  RenderDef,
  WorldDef,
  RoomDef,
  RuneDef,
  SceneDef,
  SetDef,
  SkillDef,
  TerrainDef,
} from '../core/defs';
import {
  affixSchema,
  balanceSchema,
  campaignSchema,
  worldSchema,
  charSchema,
  classSchema,
  sceneSchema,
  flagSchema,
  itemSchema,
  mapSchema,
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
  const maps: Record<string, MapDef> = {};
  const scenes: Record<string, SceneDef> = {};
  const locales: Locales = {};
  for (const [k, raw] of Object.entries(files)) {
    const p = contentPath(k);
    if (/^acts\/[^/]+\/maps\//.test(p)) {
      const m = parseOne<MapDef>(p, raw, mapSchema, issues);
      if (m) maps[m.id] = m;
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
  // the German text sits in the scene itself
  for (const sc of Object.values(scenes)) locales.de = { ...(locales.de ?? {}), ...sceneTexts(sc) };
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
    campaign: campaign as CampaignDef,
    world: world as WorldDef,
  };
  return { data, locales, issues };
}
