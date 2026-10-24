/**
 * First start (story 7.6): while the service worker installs the first download, the app shows a stone with the size and
 * a progress bar instead of the title. Without a service worker (dev server, plain http, no support) nothing is shown.
 * Later updates are handled by `update.ts`; this module only cares about the very first install.
 */
import { signal } from '@preact/signals';
import { installProgress } from '../loading/plan';

export type PreparePhase =
  /** no first install to show (or it is done) */
  | 'off'
  /** a first start without a registration yet: the screens wait a moment for it */
  | 'pending'
  | 'installing'
  /** the connection broke off; the install starts again by itself */
  | 'retry';

export interface PrepareState {
  phase: PreparePhase;
  /** 0..1 */
  progress: number;
  /** size of the first download in bytes, once known */
  bytes: number | null;
}

export const prepare = signal<PrepareState>({ phase: 'off', progress: 0, bytes: null });

const BASE = import.meta.env.BASE_URL;
const POLL_MS = 300;
const RETRY_MS = 5000;
/** How long the screens wait for a registration before they give up on a first install. */
const PENDING_MS = 4000;

const set = (patch: Partial<PrepareState>) => (prepare.value = { ...prepare.value, ...patch });

interface PrecacheInfo {
  count: number;
  bytes: number;
}

let info: PrecacheInfo | null = null;

/** `precache-info.json` is written by the build next to the service worker (vite.config.ts); missing in dev. */
async function loadInfo(): Promise<PrecacheInfo | null> {
  if (info) return info;
  try {
    const res = await fetch(`${BASE}precache-info.json`, { cache: 'no-store' });
    if (res.ok) {
      info = (await res.json()) as PrecacheInfo;
      set({ bytes: info.bytes });
    }
  } catch {
    // offline right now: the bar then stays without a total until the next poll
  }
  return info;
}

/** Number of files the install has put into the precache so far. */
async function cachedCount(): Promise<number> {
  let n = 0;
  for (const key of await caches.keys()) {
    if (key.includes('precache')) n += (await (await caches.open(key)).keys()).length;
  }
  return n;
}

/** Call once before the first render: shows the stone from the start on a first visit (no service worker in control yet). */
export function initPrepare(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || typeof caches === 'undefined') return;
  if (navigator.serviceWorker.controller) return; // installed before: nothing to wait for
  set({ phase: 'pending' });
  setTimeout(() => {
    if (prepare.value.phase === 'pending') set({ phase: 'off' });
  }, PENDING_MS);
}

let polling = 0;
let tracked: ServiceWorker | null = null;

/** Called with the registration; follows a first install, if there is one. */
export function watchFirstInstall(reg: ServiceWorkerRegistration | undefined): void {
  if (prepare.value.phase === 'off' || !reg) {
    if (prepare.value.phase === 'pending') set({ phase: 'off' });
    return;
  }
  const sw = reg.installing ?? reg.waiting;
  if (!sw) {
    // already active (e.g. a forced reload) or nothing is installing: no first download to show
    if (reg.active || prepare.value.phase === 'pending') set({ phase: 'off' });
    return;
  }
  track(reg, sw);
}

function track(reg: ServiceWorkerRegistration, sw: ServiceWorker): void {
  if (tracked === sw) return;
  tracked = sw;
  set({ phase: 'installing' });
  const run = ++polling;
  const tick = async () => {
    if (run !== polling) return;
    const total = (await loadInfo())?.count;
    if (total) set({ progress: Math.max(prepare.value.progress, installProgress(await cachedCount().catch(() => 0), total)) });
    if (run === polling) setTimeout(() => void tick(), POLL_MS);
  };
  void tick();
  sw.addEventListener('statechange', () => {
    if (sw.state === 'activated' || sw.state === 'installed') {
      // installed = every file is cached (a first install activates at once; an older worker would only wait)
      polling++;
      set({ phase: 'off', progress: 1 });
    } else if (sw.state === 'redundant') {
      polling++;
      set({ phase: 'retry' });
      scheduleRetry(reg);
    }
  });
}

let retryTimer = 0;

/** After a broken install: asks the server for the worker again, on a timer and as soon as the browser is online. */
function scheduleRetry(reg: ServiceWorkerRegistration): void {
  const attempt = async () => {
    window.removeEventListener('online', attempt);
    clearTimeout(retryTimer);
    try {
      await reg.update();
    } catch {
      // still no connection
    }
    const next = reg.installing ?? reg.waiting;
    if (next) track(reg, next);
    else if (reg.active) set({ phase: 'off' });
    else scheduleRetry(reg);
  };
  window.addEventListener('online', attempt, { once: true });
  retryTimer = window.setTimeout(() => void attempt(), RETRY_MS);
}
