/**
 * The level drafts of an act still in planning (story 11.10, `concept/27-ueberarbeitung/levels/s<act>_*.yaml`) checked like content:
 * map schema and every map rule of `validateContent` (asset checks included when the caller passes them), as if the draft lay in
 * the act's pack. Only references to content that later stories write are `open`, counted but no error: a scene, a character, a
 * lieutenant, a chronicle page, an item that does not exist yet, and the locale key of the map's name or of an escort's name.
 * Everything else, the format above all, is an issue. Pure: the caller reads the files (content:check, tests).
 */
import type { GameData } from '../core/gameData';
import type { MapDef } from '../core/mapDefs';
import type { ContentIssue, Locales } from './load';
import { mapSchema } from './schemas';
import { validateContent } from './validate';

/** Messages about content a later story brings (missions, 11.5 companions and lieutenants), exactly as `validateContent` words them. */
const OPEN_MESSAGES = [
  /: unknown scene [\w.]+$/,
  /: unknown char \w+$/,
  /: unknown lieutenant \w+$/,
  /: unknown chronicle page \w+ \(acts\/\*\/chronicle\.yaml\)$/,
  /: unknown item \w+$/,
  /^escort: missing locale key unit\.\w+\.name in (de|en)$/,
];
/** the name of the map itself (`map.<id>.name`): the mission story writes it */
const openIssue = (i: ContentIssue, mapId: string) =>
  OPEN_MESSAGES.some((r) => r.test(i.message)) || (/^locales\/(de|en)$/.test(i.file) && i.message === `missing key map.${mapId}.name`);

export interface DraftResult {
  file: string;
  issues: ContentIssue[];
  open: ContentIssue[];
}

/** The act of a draft by its file name (`s2_…` = act 2); undefined for samples and other files. */
export function draftAct(file: string): number | undefined {
  const m = /^s(\d+)_[\w.-]*\.ya?ml$/.exec(file);
  return m ? Number(m[1]) : undefined;
}

/** What `validateContent` takes besides data and locales (sprites, item, place, lieutenant and status images). */
export type AssetArgs = Parameters<typeof validateContent> extends [unknown, unknown, ...infer R] ? R : never;

/**
 * Checks the drafts (`raw`: file name → parsed YAML) against `data`. `base` are the issues of the content alone; a draft only
 * answers for what it adds. A file name without an act (`s<act>_`), a map id that is already content or that two drafts share
 * is an issue.
 */
export function checkDrafts(data: GameData, locales: Locales, raw: Record<string, unknown>, assets: AssetArgs = [] as unknown as AssetArgs): DraftResult[] {
  const known = new Set(validateContent(data, locales, ...assets).map((i) => `${i.file}\u0000${i.message}`));
  const ids = new Map<string, string>();
  return Object.entries(raw).map(([file, yaml]) => {
    const fail = (message: string): DraftResult => ({ file, issues: [{ file, message }], open: [] });
    const act = draftAct(file);
    if (act === undefined) return fail('a draft file is named s<act>_<name>.yaml');
    const parsed = mapSchema.safeParse(yaml);
    if (!parsed.success) return { file, issues: parsed.error.issues.map((i) => ({ file, message: `${i.path.join('.')}: ${i.message}` })), open: [] };
    const map = { ...parsed.data, act } as MapDef;
    if (data.maps[map.id]) return fail(`map id ${map.id} is already content`);
    if (ids.has(map.id)) return fail(`map id ${map.id} is also the id of the draft ${ids.get(map.id)}`);
    ids.set(map.id, file);
    const found = validateContent({ ...data, maps: { ...data.maps, [map.id]: map } }, locales, ...assets).filter((i) => !known.has(`${i.file}\u0000${i.message}`));
    return { file, issues: found.filter((i) => !openIssue(i, map.id)), open: found.filter((i) => openIssue(i, map.id)) };
  });
}
