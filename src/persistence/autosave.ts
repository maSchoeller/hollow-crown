/**
 * Non-blocking auto-save (concept/24-architecture §5.15 "Schreiben"): callers schedule a snapshot after
 * every command; the write runs later, coalesced to the latest snapshot, and `flush` writes at once
 * (visibilitychange → hidden).
 */
export type Snapshot = () => Promise<void>;

export interface AutoSaver {
  /** Queues `write`; replaces any queued but not yet started write. */
  schedule(write: Snapshot): void;
  /** Starts the queued write now and resolves when everything queued so far is written. */
  flush(): Promise<void>;
}

export function createAutoSaver(
  opts: { defer?: (fn: () => void) => void; onError?: (e: unknown) => void } = {},
): AutoSaver {
  const defer = opts.defer ?? ((fn) => setTimeout(fn, 0));
  const onError = opts.onError ?? ((e) => console.warn('autosave failed', e));
  let queued: Snapshot | null = null;
  let timer = false;
  let running: Promise<void> = Promise.resolve();

  const run = (): Promise<void> => {
    const w = queued;
    queued = null;
    if (!w) return running;
    running = running.then(() => w().catch(onError));
    return running;
  };

  return {
    schedule(write) {
      queued = write;
      if (timer) return;
      timer = true;
      defer(() => {
        timer = false;
        void run();
      });
    },
    flush() {
      return run();
    },
  };
}

export interface PlayClock {
  /** Play time since the last call, including visible time banked before the page was hidden. */
  take(): number;
  /** Page went to the background: bank the visible time so far. */
  hide(): void;
  /** Page is visible again. */
  show(): void;
  /** Another campaign is active: drop banked time. */
  reset(): void;
}

/** Counts play time only while the page is visible (campaign meta `playtimeMs`). */
export function createPlayClock(now: () => number, visible: () => boolean): PlayClock {
  let since = now();
  let banked = 0;
  let hidden = false;
  return {
    take() {
      const t = now();
      const d = banked + (!hidden && visible() ? t - since : 0);
      banked = 0;
      since = t;
      return d;
    },
    hide() {
      const t = now();
      if (!hidden) banked += t - since;
      hidden = true;
      since = t;
    },
    show() {
      hidden = false;
      since = now();
    },
    reset() {
      banked = 0;
      since = now();
    },
  };
}
