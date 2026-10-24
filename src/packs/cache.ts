/**
 * Pack files in the Cache API (story 7.2): a pack lives in `hc-pack-<id>-<hash>`; a marker entry with the pack's file
 * list is written last, so a cache with the marker is complete. The service worker answers asset requests from any cache
 * first (vite.config.ts), so pages and the content import read these files offline.
 */
import type { BuiltPack, PackFile } from '../content/packs';
import { packCacheName, planDownload, staleCaches } from './plan';

/** Header that tells the service worker not to copy the response into the on-demand cache (the pack cache keeps it). */
export const PACK_REQUEST_HEADER = 'x-hc-pack';

export interface PackDownloadProgress {
  doneBytes: number;
  totalBytes: number;
  doneFiles: number;
  totalFiles: number;
}

export interface PackDownloadOptions {
  /** site root, `import.meta.env.BASE_URL` */
  base: string;
  timeoutMs: number;
  parallel: number;
  onProgress?: (p: PackDownloadProgress) => void;
  /** stops between files (a running request finishes) */
  signal?: AbortSignal;
}

export const hasCacheApi = (): boolean => typeof caches !== 'undefined';

const markerUrl = (base: string, id: string): string => `${base}__hc-pack/${id}.json`;
const fileUrl = (base: string, path: string): string => `${base}${path}`;

/** The file list a complete pack cache was written with, or null when the cache is missing or incomplete. */
async function markerOf(cacheName: string, base: string, id: string): Promise<PackFile[] | null> {
  if (!(await caches.has(cacheName))) return null;
  const res = await (await caches.open(cacheName)).match(markerUrl(base, id));
  if (!res) return null;
  try {
    return ((await res.json()) as BuiltPack).files;
  } catch {
    return null;
  }
}

/** Whether this version of the pack is completely on the device. */
export async function isPackComplete(pack: BuiltPack, base: string): Promise<boolean> {
  if (!hasCacheApi()) return false;
  return (await markerOf(packCacheName(pack.id, pack.hash), base, pack.id)) !== null;
}

/**
 * Puts every file of the pack into its cache. Files from an interrupted earlier attempt stay; files an older complete
 * version has with the same hash are copied from it (an update fetches only what changed). After success the marker is
 * written and older caches of the pack are deleted. Throws when a file did not arrive (the caller retries).
 */
export async function downloadPack(pack: BuiltPack, opts: PackDownloadOptions): Promise<void> {
  const name = packCacheName(pack.id, pack.hash);
  const cache = await caches.open(name);
  const keys = await cache.keys();
  const have = new Set(keys.map((r) => new URL(r.url).pathname.slice(new URL(opts.base, location.href).pathname.length)));
  const stale = staleCaches(await caches.keys(), pack.id, pack.hash);
  let old: { cache: Cache; files: PackFile[] } | null = null;
  for (const s of stale) {
    const files = await markerOf(s, opts.base, pack.id);
    if (files) {
      old = { cache: await caches.open(s), files };
      break;
    }
  }
  const plan = planDownload(pack.files, old?.files, have);
  const progress: PackDownloadProgress = {
    totalBytes: pack.files.reduce((n, f) => n + f.size, 0),
    totalFiles: pack.files.length,
    doneBytes: pack.files.filter((f) => have.has(f.path)).reduce((n, f) => n + f.size, 0),
    doneFiles: pack.files.filter((f) => have.has(f.path)).length,
  };
  const step = (f: PackFile) => {
    progress.doneBytes += f.size;
    progress.doneFiles++;
    opts.onProgress?.({ ...progress });
  };
  opts.onProgress?.({ ...progress });

  const todo = [...plan.fetch];
  for (const f of plan.reuse) {
    const res = await old!.cache.match(fileUrl(opts.base, f.path));
    if (!res) {
      todo.push(f);
      continue;
    }
    await cache.put(fileUrl(opts.base, f.path), res);
    step(f);
  }

  let failed: unknown = null;
  const queue = [...todo];
  const worker = async () => {
    for (let f = queue.shift(); f !== undefined && !opts.signal?.aborted; f = queue.shift()) {
      try {
        const url = fileUrl(opts.base, f.path);
        const res = await fetch(url, { headers: { [PACK_REQUEST_HEADER]: pack.id }, signal: AbortSignal.timeout(opts.timeoutMs) });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${f.path}`);
        await cache.put(url, res);
        step(f);
      } catch (e) {
        failed ??= e;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(opts.parallel, queue.length)) }, worker));
  if (opts.signal?.aborted) throw new Error('aborted');
  if (failed) throw failed;

  await cache.put(markerUrl(opts.base, pack.id), new Response(JSON.stringify(pack), { headers: { 'content-type': 'application/json' } }));
  for (const s of stale) await caches.delete(s);
}
