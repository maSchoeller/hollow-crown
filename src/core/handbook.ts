/**
 * The rules handbook (epic 14, architecture §8.3): values of an entry are paths into the content, resolved here against
 * GameData, so the handbook says what the rules do after every balancing pass. Pure; the UI only draws the result.
 */
import type { GameData, HandbookDef, HandbookEntryDef, HandbookFormat, HandbookValueDef } from './defs';

/** Locale key of a part of an entry: `title`, `text`, `where`, `keywords`, class lines `strong.1` … */
export const handbookEntryKey = (id: string, part: string): string => `handbook.entry.${id}.${part}`;
export const handbookCategoryKey = (id: string, part: 'name' | 'sub'): string => `handbook.cat.${id}.${part}`;
export const handbookLabelKey = (v: HandbookValueDef): string => `handbook.label.${v.label ?? v.id}`;

/**
 * The number a value path points at: `balance.triangle.hit` → data.balance.triangle.hit, `terrain.forest.cost.foot`,
 * `balance.economy.upgradeCost.0.gold`. `null` where the content says "none" (an impassable tile); `undefined` when the
 * path does not exist or ends at something that is not a number (content:check refuses that).
 */
export function resolveHandbookRef(data: GameData, ref: string): number | null | undefined {
  let at: unknown = data;
  for (const part of ref.split('.')) {
    if (at === null || typeof at !== 'object' || !Object.prototype.hasOwnProperty.call(at, part)) return undefined;
    at = (at as Record<string, unknown>)[part];
  }
  if (at === null) return null;
  return typeof at === 'number' && Number.isFinite(at) ? at : undefined;
}

export interface HandbookValue {
  def: HandbookValueDef;
  value: number | null | undefined;
}

/** The values of an entry in YAML order, resolved. */
export function handbookValues(data: GameData, entry: HandbookEntryDef): HandbookValue[] {
  return entry.values.map((def) => ({ def, value: resolveHandbookRef(data, def.ref) }));
}

/** Writes a resolved value: `null` (none) and unknown values become "–"; negatives use the minus sign. */
export function formatHandbookValue(v: number | null | undefined, format: HandbookFormat, locale: string): string {
  if (v === null || v === undefined) return '–';
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const num = (n: number) => nf.format(Math.abs(n));
  const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '');
  switch (format) {
    case 'plain':
      return `${v < 0 ? '−' : ''}${num(v)}`;
    case 'signed':
      return `${sign(v)}${num(v)}`;
    case 'percent':
      return `${v < 0 ? '−' : ''}${num(v)}%`;
    case 'signedPercent':
      return `${sign(v)}${num(v)}%`;
    case 'factor':
      return `×${num(v)}`;
    case 'factorPercent': {
      const pct = Math.round((v - 1) * 100);
      return `${sign(pct)}${num(pct)}%`;
    }
    case 'share':
      return `${num(Math.round(v * 100))}%`;
  }
}

/** Text parameters of an entry: `{id}` → the formatted value (entry texts carry no numbers of their own). */
export function handbookParams(data: GameData, entry: HandbookEntryDef, locale: string): Record<string, string> {
  return Object.fromEntries(
    handbookValues(data, entry).map(({ def, value }) => [def.id, formatHandbookValue(value, def.format, locale)]),
  );
}

/** Context anchors of an entry: its own `anchor` and one per terrain, class and lesson it explains. */
export function entryAnchors(entry: HandbookEntryDef): string[] {
  return [
    ...(entry.anchor ? [entry.anchor] : []),
    ...(entry.terrain ?? []).map((id) => `terrain.${id}`),
    ...(entry.class ? [`class.${entry.class}`] : []),
    ...(entry.lesson ? [`lesson.${entry.lesson}`] : []),
  ];
}

/** The entry a "?" in the game opens, or undefined (the "?" is then not shown). */
export function entryByAnchor(hb: HandbookDef | undefined, anchor: string): HandbookEntryDef | undefined {
  return hb?.entries.find((e) => entryAnchors(e).includes(anchor));
}

/** Entries of a category in YAML order. */
export function categoryEntries(hb: HandbookDef, category: string): HandbookEntryDef[] {
  return hb.entries.filter((e) => e.category === category);
}

/** Lower case without accents and umlaut dots, so "groll", "Größe" and "grosse" find each other. */
export function normalizeSearch(s: string): string {
  return s.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/\p{M}/gu, '').trim();
}

/**
 * Entries whose title or keywords (comma separated, in the current language) contain every word of the query; title hits
 * first, then YAML order. `text` looks a locale key up. An empty query finds nothing.
 */
export function searchHandbook(hb: HandbookDef, query: string, text: (key: string) => string): HandbookEntryDef[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored: Array<{ e: HandbookEntryDef; score: number; i: number }> = [];
  hb.entries.forEach((e, i) => {
    const title = normalizeSearch(text(handbookEntryKey(e.id, 'title')));
    const keys = normalizeSearch(text(handbookEntryKey(e.id, 'keywords')));
    if (!words.every((w) => title.includes(w) || keys.includes(w))) return;
    scored.push({ e, score: words.every((w) => title.includes(w)) ? 0 : 1, i });
  });
  return scored.sort((a, b) => a.score - b.score || a.i - b.i).map((x) => x.e);
}

/** Order of a "beats" map as a cycle for the pictures: start at the first key and follow it (sword → axe → lance). */
export function cycleOrder(beats: Record<string, string>): string[] {
  const first = Object.keys(beats)[0];
  const out: string[] = [];
  for (let k = first; k !== undefined && !out.includes(k); k = beats[k]) out.push(k);
  return out;
}
