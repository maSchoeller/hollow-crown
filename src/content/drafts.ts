/**
 * The level drafts of an act still in planning (story 11.10, `concept/27-ueberarbeitung/levels/s<act>_*.yaml`) checked like content:
 * map schema and every map rule of `validateContent`, as if the draft lay in the act's pack. What only later stories write – a
 * scene, a character, a lieutenant, a chronicle page, an item, a locale key – is `open`, counted but no error; every other issue is
 * one. Pure: the caller reads the files (content:check, tests).
 */
import type { GameData } from '../core/gameData';
import type { MapDef } from '../core/mapDefs';
import type { ContentIssue, Locales } from './load';
import { mapSchema } from './schemas';
import { validateContent } from './validate';

/** Messages about content a later story brings (missions, 11.5 companions and lieutenants), not about the format. */
const OPEN = /unknown (scene|char|lieutenant|chronicle page|item|companion|recruit) |missing (locale )?key |needs a character of the same id/;

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

/**
 * Checks the drafts (`raw`: file name → parsed YAML) against `data`. `base` are the issues of the content alone; a draft only
 * answers for what it adds.
 */
export function checkDrafts(data: GameData, locales: Locales, raw: Record<string, unknown>, base = validateContent(data, locales)): DraftResult[] {
  const known = new Set(base.map((i) => `${i.file}\u0000${i.message}`));
  return Object.entries(raw).map(([file, yaml]) => {
    const parsed = mapSchema.safeParse(yaml);
    if (!parsed.success) return { file, issues: parsed.error.issues.map((i) => ({ file, message: `${i.path.join('.')}: ${i.message}` })), open: [] };
    const map = { ...parsed.data, act: draftAct(file) ?? 1 } as MapDef;
    if (data.maps[map.id]) return { file, issues: [{ file, message: `map id ${map.id} is already content` }], open: [] };
    const found = validateContent({ ...data, maps: { ...data.maps, [map.id]: map } }, locales).filter((i) => !known.has(`${i.file}\u0000${i.message}`));
    return { file, issues: found.filter((i) => !OPEN.test(i.message)), open: found.filter((i) => OPEN.test(i.message)) };
  });
}
