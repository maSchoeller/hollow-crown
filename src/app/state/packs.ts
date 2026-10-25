/**
 * Act packs in the background (story 7.2): after the first install, every pack of an act the campaign has reached is
 * downloaded into its cache and registered; failures retry with backoff and as soon as the browser is online again.
 * The world map shows the progress ring from `packStates`, missions wait for their pack with `ensurePack`.
 * Without a service worker build (dev server) the content is imported directly and nothing is downloaded.
 */
import { signal } from '@preact/signals';
import { packs as packList } from 'virtual:hc-packs';
import { isPackRegistered, packOfMap, packOfScene } from '../../content/browser';
import type { PacksManifest } from '../../content/packs';
import { downloadPack, hasCacheApi, isPackComplete } from '../../packs/cache';
import { fetchPacksManifest, loadPack } from '../../packs/load';
import { backoffMs, duePacks, hasPackForAct } from '../../packs/plan';
import { log } from '../log';
import { prepare } from './prepare';
import { data } from './session';
import { settings } from './settings';

export type PackPhase =
  /** waits for its turn */
  | 'queued'
  | 'loading'
  /** the browser is offline: it loads as soon as it is online */
  | 'offline'
  /** a file did not arrive: tries again after a pause */
  | 'retry'
  | 'ready';

export interface PackState {
  phase: PackPhase;
  doneBytes: number;
  totalBytes: number;
  doneFiles: number;
  totalFiles: number;
}

/** State per pack that has been asked for; core is never listed (it comes with the service worker). */
export const packStates = signal<Record<string, PackState>>({});

/** Counts registered packs; components that read content of later packs subscribe to it. */
export const contentRevision = signal(0);

const BASE = import.meta.env.BASE_URL;
const PARALLEL = 3;

const set = (id: string, patch: Partial<PackState>) => {
  const prev = packStates.value[id] ?? { phase: 'queued', doneBytes: 0, totalBytes: 0, doneFiles: 0, totalFiles: 0 };
  packStates.value = { ...packStates.value, [id]: { ...prev, ...patch } };
};

const queue: string[] = [];
const waiters = new Map<string, (() => void)[]>();
let running = false;
let manifest: PacksManifest | null = null;
let wake: (() => void) | null = null;

/** Act whose packs should be on the device (the content of the running build knows one act so far). */
const reachedAct = (): number => data.campaign.act;

function enqueue(id: string, first = false): void {
  if (isPackRegistered(id) || queue.includes(id)) {
    if (first && queue.includes(id)) queue.splice(0, 0, ...queue.splice(queue.indexOf(id), 1));
    return;
  }
  if (first) queue.unshift(id);
  else queue.push(id);
  if (!packStates.value[id]) set(id, { phase: 'queued' });
  void pump();
}

/** Waits for the given time, for the browser coming online, or for `retryPacksNow`, whatever comes first. */
function pause(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      window.removeEventListener('online', done);
      wake = null;
      resolve();
    };
    const timer = setTimeout(done, ms);
    window.addEventListener('online', done);
    wake = done;
  });
}

async function fetchFiles(id: string): Promise<void> {
  if (!import.meta.env.PROD || !hasCacheApi()) return;
  manifest ??= await fetchPacksManifest(BASE);
  if (!manifest) throw new Error('packs.json not reachable');
  const pack = manifest.packs.find((p) => p.id === id);
  if (!pack) throw new Error(`pack ${id} is not in packs.json`);
  set(id, { totalBytes: pack.bytes, totalFiles: pack.files.length });
  if (await isPackComplete(pack, BASE)) return;
  set(id, { phase: 'loading' });
  await downloadPack(pack, {
    base: BASE,
    timeoutMs: data.balance.loading.fetchTimeoutMs,
    parallel: PARALLEL,
    onProgress: (p) => set(id, { phase: 'loading', ...p }),
  });
}

async function processPack(id: string): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await fetchFiles(id);
      await loadPack(id);
      set(id, { phase: 'ready', doneBytes: packStates.value[id]?.totalBytes ?? 0, doneFiles: packStates.value[id]?.totalFiles ?? 0 });
      contentRevision.value++;
      for (const w of waiters.get(id) ?? []) w();
      waiters.delete(id);
      return;
    } catch (e) {
      const online = navigator.onLine;
      set(id, { phase: online ? 'retry' : 'offline' });
      if (online) log.warn('core', `pack ${id}: attempt ${attempt} failed`, e);
      const { packRetryBaseMs, packRetryMaxMs } = data.balance.loading;
      await pause(backoffMs(attempt, packRetryBaseMs, packRetryMaxMs));
    }
  }
}

async function pump(): Promise<void> {
  if (running) return;
  running = true;
  try {
    for (let id = queue[0]; id !== undefined; id = queue[0]) {
      await processPack(id);
      queue.splice(queue.indexOf(id), 1);
    }
  } finally {
    running = false;
  }
}

/** Waits until the first install is over, so the pack download does not compete with it. */
function afterPrepare(): Promise<void> {
  return new Promise((resolve) => {
    if (prepare.value.phase === 'off') return resolve();
    const stop = prepare.subscribe((p) => {
      if (p.phase !== 'off') return;
      queueMicrotask(() => stop());
      resolve();
    });
  });
}

/** Whether this build has a pack for the act after the campaign's (story 7.3); false = the next act is "coming soon". */
export const nextActInBuild = (): boolean => hasPackForAct(packList, data.campaign.act + 1);

/** Starts the background download of every pack the campaign has reached (call once at start-up). */
export async function startPacks(): Promise<void> {
  await afterPrepare();
  for (const p of duePacks(packList, reachedAct(), settings.value.lang)) enqueue(p.id);
}

/** "Erneut versuchen": the waiting pack tries again now instead of after its pause. */
export function retryPacksNow(): void {
  wake?.();
}

/** Resolves once the pack is registered; moves it to the front of the queue. */
export function ensurePack(id: string): Promise<void> {
  if (isPackRegistered(id)) return Promise.resolve();
  const p = new Promise<void>((resolve) => waiters.set(id, [...(waiters.get(id) ?? []), resolve]));
  enqueue(id, true);
  return p;
}

/**
 * The pack a node still needs (its map or its dialogues are not loaded), or null when it can be played now. Reads
 * `contentRevision`, so a component asking this re-renders when a pack arrives.
 */
export function packNeededFor(node: { map: string; pre?: string; post?: string }): string | null {
  void contentRevision.value;
  if (!data.maps[node.map]) return packOfMap(node.map);
  for (const s of [node.pre, node.post]) if (s && !data.scenes[s]) return packOfScene(s);
  return null;
}

/** The act pack that is loading right now (for the progress ring), or null when none is. */
export function loadingActPack(): { id: string; act: number; state: PackState } | null {
  for (const p of packList) {
    if (p.load !== 'background') continue;
    const state = packStates.value[p.id];
    if (state && state.phase !== 'ready') return { id: p.id, act: p.act, state };
  }
  return null;
}
