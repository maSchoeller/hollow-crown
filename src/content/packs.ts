/**
 * Content and asset packs (architecture §5.14, story 7.1): `content/packs.yaml` assigns files to packs by glob. Pure
 * functions shared by the build (vite.config.ts), the tools (content check, bundle size) and the app.
 */
import { z } from 'zod';

export const CORE_PACK = 'core';

/** YAML in content/ that describes the content instead of being content (packs, ID renames of story 7.4). */
export const META_FILES: readonly string[] = ['packs.yaml', 'renames.yaml'];

export const packLoadSchema = z.enum(['precache', 'background', 'voice']);
export type PackLoad = z.infer<typeof packLoadSchema>;

export const packDefSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(\.[a-z0-9]+)*$/),
  released: z.boolean(),
  load: packLoadSchema,
  /** act the pack belongs to; a background pack loads once the campaign has reached it */
  act: z.number().int().min(1),
  /** language of a voice pack */
  lang: z.enum(['de', 'en']).optional(),
  /** transfer budget in MB (gzip; images and audio as they are) */
  budgetMb: z.number().positive(),
  /** YAML files, relative to content/ */
  content: z.array(z.string()).default([]),
  /** built assets, relative to public/assets/ */
  assets: z.array(z.string()).default([]),
});
export type PackDef = z.infer<typeof packDefSchema>;

export const packsFileSchema = z
  .object({ packs: z.array(packDefSchema).min(1) })
  .refine((f) => f.packs[0]?.id === CORE_PACK && f.packs[0].released && f.packs[0].load === 'precache', {
    message: 'the first pack must be core (released, precache)',
  })
  .refine((f) => new Set(f.packs.map((p) => p.id)).size === f.packs.length, { message: 'pack ids must be unique' });

/** Reads the parsed `content/packs.yaml`; throws with the Zod message when it is malformed. */
export function parsePacks(raw: unknown): PackDef[] {
  return packsFileSchema.parse(raw).packs;
}

const globCache = new Map<string, RegExp>();

/** `**` any depth (also none), `*` within one path segment, `?` one character; everything else literal. */
export function globToRegExp(glob: string): RegExp {
  let re = globCache.get(glob);
  if (re) return re;
  let s = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === '*' && glob[i + 1] === '*') {
      i++;
      if (glob[i + 1] === '/') {
        i++;
        s += '(?:.*/)?';
      } else s += '.*';
    } else if (c === '*') s += '[^/]*';
    else if (c === '?') s += '[^/]';
    else s += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  re = new RegExp(`^${s}$`);
  globCache.set(glob, re);
  return re;
}

export const matchesGlob = (path: string, glob: string): boolean => globToRegExp(glob).test(path);

/** The pack a file belongs to: the first whose globs match, otherwise core. `kind` picks content or asset globs. */
export function packOf(packs: readonly PackDef[], path: string, kind: 'content' | 'assets'): PackDef {
  for (const p of packs) if (p[kind].some((g) => matchesGlob(path, g))) return p;
  return packs[0]!;
}

/** Groups paths by pack id (every pack appears, possibly empty). */
export function groupByPack(packs: readonly PackDef[], paths: readonly string[], kind: 'content' | 'assets'): Map<string, string[]> {
  const out = new Map<string, string[]>(packs.map((p) => [p.id, []]));
  for (const path of paths) out.get(packOf(packs, path, kind).id)!.push(path);
  return out;
}

/** Name of the virtual module that holds a pack's content (all YAML of the pack as one JSON chunk). */
export const packModuleId = (id: string): string => `virtual:hc-pack/${id}`;

/** One file of a built pack, as `packs.json` lists it (path relative to the site root). */
export interface PackFile {
  path: string;
  hash: string;
  size: number;
}

/** A built pack in `packs.json`. */
export interface BuiltPack {
  id: string;
  load: PackLoad;
  act: number;
  lang?: 'de' | 'en';
  budgetMb: number;
  /** hash over all file hashes: a new value means something in the pack changed */
  hash: string;
  bytes: number;
  files: PackFile[];
}

/** `packs.json`, written by the build next to `index.html`. */
export interface PacksManifest {
  version: string;
  packs: BuiltPack[];
}

/** Minimal view of the campaign for the pack checks. */
export interface PackCheckCampaign {
  /** the opening mission is the node with `fixed: first` (campaign graph, story 4.3) */
  nodes: readonly { id: string; map: string; pre?: string; post?: string; fixed?: string }[];
}

/**
 * Checks the pack assignment (content check): every content file is named by a pack's globs (a new act without a pack
 * would otherwise land in core silently), and the first node can be played from core alone (map and its dialogues).
 */
export function checkPacks(
  packs: readonly PackDef[],
  contentFiles: readonly string[],
  campaign: PackCheckCampaign,
): { file: string; message: string }[] {
  const issues: { file: string; message: string }[] = [];
  for (const f of contentFiles) {
    if (!packs.some((p) => p.content.some((g) => matchesGlob(f, g)))) issues.push({ file: 'packs.yaml', message: `${f} is in no pack` });
  }
  const inCore = (dir: string, id: string) =>
    contentFiles.some((f) => (f.endsWith(`/${dir}/${id}.yaml`) || f.endsWith(`/${dir}/${id}.yml`)) && packOf(packs, f, 'content').id === CORE_PACK);
  const start = campaign.nodes.find((n) => n.fixed === 'first');
  if (start) {
    if (!inCore('maps', start.map)) issues.push({ file: 'packs.yaml', message: `map ${start.map} of the first node must be in core` });
    for (const s of [start.pre, start.post]) {
      if (s && !inCore('scenes', s)) issues.push({ file: 'packs.yaml', message: `scene ${s} of the first node must be in core` });
    }
  }
  for (const p of packs) if (p.load === 'voice' && !p.lang) issues.push({ file: 'packs.yaml', message: `voice pack ${p.id} needs a lang` });
  return issues;
}
