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
 * The IDs of loaded content, per kind. `released` limits maps and scenes to those of released packs (the content on disk
 * also holds unreleased ones); everything else lives in core or in the act's campaign files.
 */
export function collectIds(data: GameData, released: { maps: (id: string) => boolean; scenes: (id: string) => boolean } = { maps: () => true, scenes: () => true }): IdSets {
  return {
    chars: sorted(Object.keys(data.chars)),
    classes: sorted(Object.keys(data.classes)),
    items: sorted(Object.keys(data.items)),
    skills: sorted(Object.keys(data.skills)),
    affixes: sorted(Object.keys(data.affixes)),
    sets: sorted(Object.keys(data.sets)),
    nodes: sorted(data.campaign.nodes.map((n) => n.id)),
    maps: sorted(Object.keys(data.maps).filter(released.maps)),
    flags: sorted(Object.keys(data.flags)),
    rooms: sorted(Object.keys(data.rooms)),
    scenes: sorted(Object.keys(data.scenes).filter(released.scenes)),
    lieutenants: sorted(Object.keys(data.lieutenants ?? {})),
  };
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
