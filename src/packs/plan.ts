/**
 * Pure rules of the pack download (architecture §5.14, story 7.2): cache names, which files an update has to fetch,
 * which caches go after success, which packs are due, the retry delay and the progress. No browser APIs here.
 */
import type { BuiltPack, PackFile, PackLoad } from '../content/packs';

/** Prefix of the caches that hold whole packs; the service worker answers from them first. */
export const PACK_CACHE_PREFIX = 'hc-pack-';

/**
 * Suffix of every pack cache name. Raise it when caches written by an older client cannot be trusted: before g2 the
 * download copied older files from `hc-on-demand` or the previous pack cache instead of fetching them, so a cache of
 * that time holds outdated bytes under a current hash. Caches without the suffix are replaced and never reused.
 */
export const CACHE_GENERATION = 'g2';

export const packCacheName = (id: string, hash: string): string => `${PACK_CACHE_PREFIX}${id}-${hash}${CACHE_GENERATION}`;

/** Whether a pack cache was written by a client whose downloads can be trusted (see `CACHE_GENERATION`). */
export const isTrustedCache = (name: string): boolean => name.endsWith(CACHE_GENERATION);

/** Pack id of a pack cache name, or null for other caches (`hc-pack-act1-ab12` → `act1`; ids may contain dots). */
export function packIdOfCache(name: string): string | null {
  if (!name.startsWith(PACK_CACHE_PREFIX)) return null;
  const rest = name.slice(PACK_CACHE_PREFIX.length);
  const dash = rest.lastIndexOf('-');
  return dash > 0 ? rest.slice(0, dash) : null;
}

/** Caches of older versions of a pack, to delete once the current one is complete. */
export function staleCaches(names: readonly string[], id: string, hash: string): string[] {
  const keep = packCacheName(id, hash);
  return names.filter((n) => n !== keep && packIdOfCache(n) === id);
}

export interface DownloadPlan {
  /** files that an older complete version already has with the same hash: copied, not fetched */
  reuse: PackFile[];
  /** files to fetch from the network */
  fetch: PackFile[];
}

/** An update fetches only what changed: a file whose path and hash an older version lists is copied from there. */
export function planDownload(files: readonly PackFile[], old: readonly PackFile[] = [], have: ReadonlySet<string> = new Set()): DownloadPlan {
  const oldHash = new Map(old.map((f) => [f.path, f.hash]));
  const plan: DownloadPlan = { reuse: [], fetch: [] };
  for (const f of files) {
    if (have.has(f.path)) continue;
    (oldHash.get(f.path) === f.hash ? plan.reuse : plan.fetch).push(f);
  }
  return plan;
}

/** Minimal view of a pack for choosing what to load. */
export interface PackMeta {
  id: string;
  load: PackLoad;
  act: number;
  lang?: 'de' | 'en';
}

/**
 * Packs that should be on the device: background packs of every act reached so far, then the voice packs of those acts
 * in the chosen language (after their act pack, by order). Core comes with the service worker and is never listed.
 */
export function duePacks<P extends PackMeta>(packs: readonly P[], reachedAct: number, lang: string): P[] {
  const acts = packs.filter((p) => p.load === 'background' && p.act <= reachedAct);
  const voice = packs.filter((p) => p.load === 'voice' && p.act <= reachedAct && p.lang === lang);
  return [...acts, ...voice];
}

/**
 * Whether the build holds the content pack of act `act` (story 7.3: without the next act's pack the campaign stays at its
 * act). Voice packs do not count: they carry no missions.
 */
export function hasPackForAct(packs: readonly Pick<PackMeta, 'act' | 'load'>[], act: number): boolean {
  return packs.some((p) => p.act === act && p.load !== 'voice');
}

/** Delay before retry number `attempt` (1, 2, …): doubles from `baseMs` up to `maxMs`. */
export function backoffMs(attempt: number, baseMs: number, maxMs: number): number {
  return Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
}

/** Share of a pack that is on the device, by bytes (0..1); an empty pack counts as complete. */
export function byteRatio(doneBytes: number, totalBytes: number): number {
  if (totalBytes <= 0) return 1;
  return Math.max(0, Math.min(1, doneBytes / totalBytes));
}

/** Total bytes of a pack's files. */
export const packBytes = (pack: Pick<BuiltPack, 'files'>): number => pack.files.reduce((n, f) => n + f.size, 0);
