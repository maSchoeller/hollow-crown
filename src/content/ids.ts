/**
 * Stable content IDs (architecture §5.16, AR19, story 7.4): after an act release `pnpm content:lock` writes every ID a
 * save can hold into `content/released-ids.json`. From then on `content:check` fails when a locked ID is gone, unless
 * `content/renames.yaml` names its successor (the save migration of that release reads the same file).
 */
import { z } from 'zod';
import type { GameData } from '../core/gameData';

/** Kinds of IDs a save refers to (lieutenants since story 3.1). */
export const ID_KINDS = ['chars', 'classes', 'items', 'skills', 'affixes', 'sets', 'nodes', 'maps', 'flags', 'rooms', 'scenes', 'lieutenants'] as const;
export type IdKind = (typeof ID_KINDS)[number];

export type IdSets = Record<IdKind, string[]>;

const idLists = z.object(Object.fromEntries(ID_KINDS.map((k) => [k, z.array(z.string()).default([])])) as Record<IdKind, z.ZodDefault<z.ZodArray<z.ZodString>>>);

/** `content/released-ids.json` */
export const releasedIdsSchema = z.object({
  /** date of the last lock (YYYY-MM-DD) */
  lockedAt: z.string(),
  /** packs whose content was locked */
  packs: z.array(z.string()),
  ids: idLists,
});
export type ReleasedIds = z.infer<typeof releasedIdsSchema>;

/** `content/renames.yaml`: per kind, old ID → new ID. */
export const renamesSchema = z
  .object(Object.fromEntries(ID_KINDS.map((k) => [k, z.record(z.string(), z.string()).optional()])) as Record<IdKind, z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>>)
  .strict();
export type Renames = z.infer<typeof renamesSchema>;

const sorted = (ids: Iterable<string>): string[] => [...new Set(ids)].sort();

/**
 * The IDs of loaded content, per kind. `released` limits a kind to the IDs of released packs (the content on disk also holds
 * unreleased ones: maps, scenes, and since story 11.10 the flag registers, lieutenants and characters of later acts); a kind
 * without a test takes every loaded ID (core and the act's campaign files).
 */
export function collectIds(data: GameData, released: Partial<Record<IdKind, (id: string) => boolean>> = {}): IdSets {
  const all: IdSets = {
    chars: Object.keys(data.chars),
    classes: Object.keys(data.classes),
    items: Object.keys(data.items),
    skills: Object.keys(data.skills),
    affixes: Object.keys(data.affixes),
    sets: Object.keys(data.sets),
    nodes: Object.values(data.acts).flatMap((a) => a.nodes.map((n) => n.id)),
    maps: Object.keys(data.maps),
    flags: Object.keys(data.flags),
    rooms: Object.keys(data.rooms),
    scenes: Object.keys(data.scenes),
    lieutenants: Object.keys(data.lieutenants ?? {}),
  };
  return Object.fromEntries(ID_KINDS.map((k) => [k, sorted(all[k].filter(released[k] ?? (() => true)))])) as IdSets;
}

/** A new lock: the earlier locked IDs stay locked (a renamed ID too), the current ones join. */
export function mergeLock(previous: ReleasedIds | null, current: IdSets, packs: readonly string[], date: string): ReleasedIds {
  const ids = Object.fromEntries(ID_KINDS.map((k) => [k, sorted([...(previous?.ids[k] ?? []), ...current[k]])])) as IdSets;
  return { lockedAt: date, packs: sorted([...(previous?.packs ?? []), ...packs]), ids };
}

/**
 * Problems of the current content against the lock: a locked ID that is missing needs a rename, a rename needs a target
 * that exists, and a rename chain must not loop.
 */
export function checkLockedIds(locked: ReleasedIds, current: IdSets, renames: Renames = {}): { file: string; message: string }[] {
  const issues: { file: string; message: string }[] = [];
  for (const kind of ID_KINDS) {
    const have = new Set(current[kind]);
    const map = renames[kind] ?? {};
    for (const id of locked.ids[kind]) {
      if (have.has(id)) continue;
      if (map[id] === undefined) {
        issues.push({ file: 'released-ids.json', message: `${kind} ${id} is locked but missing; add it to renames.yaml` });
        continue;
      }
      const to = renamedId(renames, kind, id);
      if (!have.has(to)) issues.push({ file: 'renames.yaml', message: `${kind} ${id} is renamed to ${to}, which does not exist` });
    }
    for (const [from, to] of Object.entries(map)) {
      if (!have.has(to) && !(to in map)) issues.push({ file: 'renames.yaml', message: `${kind} ${from} → ${to}: ${to} does not exist` });
    }
  }
  return issues;
}

/** The current ID of a possibly renamed one (follows chains; for save migrations). */
export function renamedId(renames: Renames, kind: IdKind, id: string): string {
  const map = renames[kind] ?? {};
  const seen = new Set<string>();
  let cur = id;
  while (map[cur] !== undefined && !seen.has(cur)) {
    seen.add(cur);
    cur = map[cur]!;
  }
  return cur;
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A save value with every renamed ID replaced (story 7.4, for the save migrations): an ID of any kind is replaced where
 * a string is that ID or starts with it plus `#` (answers are keyed `<scene>#<line>`); a character ID also inside the
 * keys built from it (`unit.<id>.name`, support pairs `a|b`, `scn.support.a_b.A`, bark scenes), as a whole word between
 * non-alphanumerics. Object keys are treated like strings; the custom names of the avatar and recruits (`name`) stay.
 */
export function applyRenames<T>(value: T, renames: Renames): T {
  const exact = new Map<string, string>();
  for (const kind of ID_KINDS) for (const from of Object.keys(renames[kind] ?? {})) exact.set(from, renamedId(renames, kind, from));
  const chars = Object.keys(renames.chars ?? {});
  if (exact.size === 0) return value;
  const word = chars.length ? new RegExp(`(?<![A-Za-z0-9])(${chars.map(escapeRe).join('|')})(?![A-Za-z0-9])`, 'g') : null;
  const str = (s: string): string => {
    const hash = s.indexOf('#');
    const head = hash < 0 ? s : s.slice(0, hash);
    const hit = exact.get(head);
    if (hit !== undefined) return hit + s.slice(head.length);
    return word ? s.replace(word, (id) => renamedId(renames, 'chars', id)) : s;
  };
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return str(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [str(k), k === 'name' ? x : walk(x)]));
    }
    return v;
  };
  return walk(value) as T;
}
