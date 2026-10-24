/**
 * Loading before a mission (story 7.6): fetches the on-demand files a mission needs (place image, unit models) that are
 * not in the cache yet, and tells the loading screen how far it is. Knows nothing of campaigns or battles; the mission
 * flow (`flow.ts`) decides which files and what happens afterwards.
 */
import { signal } from '@preact/signals';
import { ON_DEMAND_CACHE } from '../loading/cacheName';
import { failureStatus, missingAssets, type MissionLoadStatus } from '../loading/plan';
import { isPackRegistered } from '../../content/browser';
import { ensurePack, packStates, retryPacksNow, type PackState } from './packs';
import { screen, type Screen } from './screen';
import { data } from './session';

export interface MissionLoad {
  node: string;
  /** `locations/<place>.webp` of the loading screen */
  place: string;
  total: number;
  done: number;
  status: MissionLoadStatus;
}

/** The running mission load, `null` when none is shown. */
export const missionLoad = signal<MissionLoad | null>(null);

const PARALLEL = 3;
/** Files that arrived in this session; also answers for browsers without a Cache API (dev server, plain http). */
const arrived = new Set<string>();

const urlOf = (path: string): string => `${import.meta.env.BASE_URL}assets/${path}`;

/** Whether the file is in any cache of the service worker (or has been fetched in this session). */
export async function isCached(path: string): Promise<boolean> {
  if (arrived.has(path)) return true;
  if (typeof caches === 'undefined') return false;
  return (await caches.match(urlOf(path))) !== undefined;
}

let run = 0;
let retryNow: (() => void) | null = null;
let finish: ((ok: boolean) => void) | null = null;

/**
 * Fetches one file completely. A page the service worker controls lets its runtime cache keep the file; on the very
 * first session the page is not controlled yet (no `clientsClaim`), so the file goes into the same cache from here.
 * A request that hangs longer than `balance.loading.fetchTimeoutMs` fails, which shows the retry.
 */
async function fetchFile(path: string): Promise<void> {
  const url = urlOf(path);
  const res = await fetch(url, { signal: AbortSignal.timeout(data.balance.loading.fetchTimeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  if (typeof caches !== 'undefined' && !navigator.serviceWorker?.controller) {
    try {
      await (await caches.open(ON_DEMAND_CACHE)).put(url, res);
    } catch {
      // e.g. quota: the file is in memory of this session only; a body that broke off fails below the same way
      await res.arrayBuffer().catch(() => undefined);
    }
  } else {
    await res.arrayBuffer();
  }
  arrived.add(path);
}

/**
 * Fetches files nobody waits for (music of the next screens) one after the other, without any display; failures are
 * ignored, the file then loads when it is first needed.
 */
export function prefetchQuietly(paths: readonly string[]): void {
  void (async () => {
    for (const p of await missingAssets(paths, isCached)) {
      try {
        await fetchFile(p);
      } catch {
        return;
      }
    }
  })();
}

/**
 * Makes sure the files are there. Everything cached: resolves `true` at once and shows nothing. Otherwise the loading
 * screen appears and the promise resolves `true` when all files have arrived (a failed round waits for a retry: the
 * button, or the browser coming back online) or `false` when the player leaves with the back stone (`back` is shown then).
 */
export async function ensureMissionAssets(opts: { node: string; place: string; paths: readonly string[]; back: Screen }): Promise<boolean> {
  const missing = await missingAssets(opts.paths, isCached);
  if (missing.length === 0) return true;
  const mine = ++run;
  const alive = () => run === mine && missionLoad.value !== null;
  missionLoad.value = { node: opts.node, place: opts.place, total: missing.length, done: 0, status: 'loading' };
  screen.value = { name: 'loading' };
  const onOnline = () => retryNow?.();
  window.addEventListener('online', onOnline);
  const leave = (ok: boolean) => {
    window.removeEventListener('online', onOnline);
    retryNow = null;
    finish = null;
    missionLoad.value = null;
    if (!ok) screen.value = opts.back;
    return ok;
  };
  return new Promise<boolean>((resolve) => {
    finish = (ok) => resolve(leave(ok));
    const round = async () => {
      let todo = missing.filter((p) => !arrived.has(p));
      let failed = false;
      missionLoad.value = { ...missionLoad.value!, total: missing.length, done: missing.length - todo.length, status: 'loading' };
      const queue = [...todo];
      const worker = async () => {
        for (let p = queue.shift(); p !== undefined && alive(); p = queue.shift()) {
          try {
            await fetchFile(p);
            if (alive()) missionLoad.value = { ...missionLoad.value!, done: missionLoad.value!.done + 1 };
          } catch {
            failed = true;
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, worker));
      if (!alive()) return;
      todo = missing.filter((p) => !arrived.has(p));
      if (!failed && todo.length === 0) {
        resolve(leave(true));
        return;
      }
      missionLoad.value = { ...missionLoad.value!, status: failureStatus(navigator.onLine) };
      retryNow = () => {
        retryNow = null;
        void round();
      };
    };
    void round();
  });
}

const packStatus = (s: PackState | undefined): MissionLoadStatus => (s?.phase === 'offline' ? 'offline' : s?.phase === 'retry' ? 'failed' : 'loading');

/**
 * Makes sure the act pack of a mission is there (story 7.2): its map and dialogues come with the pack. Registered: resolves
 * `true` at once. Otherwise the loading screen shows the pack's progress (files) until it is registered, `false` when
 * the player leaves with the back stone; the download itself goes on in the background either way.
 */
export async function ensureMissionPack(opts: { node: string; place: string; pack: string; back: Screen }): Promise<boolean> {
  if (isPackRegistered(opts.pack)) return true;
  const mine = ++run;
  const show = () => {
    if (run !== mine) return;
    const s = packStates.value[opts.pack];
    missionLoad.value = { node: opts.node, place: opts.place, total: s?.totalFiles ?? 0, done: s?.doneFiles ?? 0, status: packStatus(s) };
  };
  show();
  screen.value = { name: 'loading' };
  const stop = packStates.subscribe(show);
  return new Promise<boolean>((resolve) => {
    retryNow = retryPacksNow;
    finish = (ok) => {
      stop();
      retryNow = null;
      finish = null;
      missionLoad.value = null;
      if (!ok) screen.value = opts.back;
      resolve(ok);
    };
    void ensurePack(opts.pack).then(() => {
      if (run === mine) finish?.(true);
    });
  });
}

/** "Erneut versuchen" on the loading screen. */
export function retryMissionLoad(): void {
  retryNow?.();
}

/** The back stone of the loading screen: stops loading and returns to where the mission was started from. */
export function cancelMissionLoad(): void {
  run++;
  finish?.(false);
}
