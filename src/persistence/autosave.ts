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
