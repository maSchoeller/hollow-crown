/**
 * Action trail (concept/24-architecture §6.2a): every game action with its outcome, so a bug report shows what was
 * played and what followed, also when nothing crashed. Kept in memory at once and in its own IndexedDB in batches
 * (`src/persistence/trail.ts`); the last `TRAIL_CAPACITY` entries survive app starts. A leaf like `log.ts`: state
 * modules write to it, `src/core` does not. No telemetry and no network.
 */
import { log } from './log';
import { stateHash, type CampaignCommand, type CampaignEvent, type Command, type GameEvent } from '../core';

export const TRAIL_CAPACITY = 2000;
/** Events kept per entry; the rest is only counted (a replay of the report recomputes them). */
export const TRAIL_MAX_EVENTS = 50;

type Plain = Record<string, unknown>;

/** What an entry says; `n`, `run` and `t` are added when it is recorded. */
export type TrailRecord =
  | { kind: 'app'; appVersion: string; contentVersion: string; device: Plain }
  | { kind: 'screen'; screen: Plain }
  | { kind: 'load'; reason: 'new' | 'load' | 'import'; campaignId: string; battle: boolean }
  | { kind: 'battleStart'; node: string; haunt?: string; deploy: string[]; hash: string }
  | {
      kind: 'battle';
      /** index of the command in the battle's log */
      i: number;
      turn: number;
      phase: string;
      cmd: Command;
      /** `dropped`: the worker answered for a state that was replaced meanwhile */
      ok: boolean | 'dropped';
      error?: string;
      events?: GameEvent[];
      eventCount?: number;
      /** checksum of the battle state after the command */
      hash?: string;
    }
  | {
      kind: 'campaign';
      cmd: Plain;
      ok: boolean;
      error?: string;
      events?: CampaignEvent[];
      eventCount?: number;
      /** checksum of the campaign after the command */
      hash?: string;
    }
  | { kind: 'effects'; queued: boolean; error?: string; effects: unknown }
  | { kind: 'settings'; changed: Plain }
  | { kind: 'fault'; name: string; message: string; code?: string };

export type TrailEntry = TrailRecord & {
  /** running number within this app start */
  n: number;
  /** id of the app start */
  run: string;
  /** ISO time */
  t: string;
};

/** Where entries are kept beyond the page; `src/persistence/trail.ts` in the app, nothing in tests and tools. */
export interface TrailStore {
  write(entries: TrailEntry[]): Promise<void>;
  /** all kept entries, oldest first */
  read(): Promise<TrailEntry[]>;
  clear(): Promise<void>;
}

export interface Trail {
  record(r: TrailRecord): TrailEntry;
  /** Kept entries of earlier app starts and this one, oldest first, at most `capacity`. */
  entries(): Promise<TrailEntry[]>;
  /** Entries of this app start still in memory (a copy). */
  recent(): TrailEntry[];
  /** Writes what is queued; resolves when it is stored (or failed). */
  flush(): Promise<void>;
  clear(): Promise<void>;
  /** Hands the trail its store; entries recorded before are written too. */
  attach(store: TrailStore): void;
}

export interface TrailOptions {
  capacity?: number;
  run?: string;
  now?: () => string;
  store?: TrailStore | null;
  /** how long entries wait before they are written together */
  flushMs?: number;
  onError?: (e: unknown) => void;
}

/** Plain JSON copy, so later changes to the object do not rewrite what was recorded. */
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function createTrail(opts: TrailOptions = {}): Trail {
  const capacity = opts.capacity ?? TRAIL_CAPACITY;
  const run = opts.run ?? 'run';
  const now = opts.now ?? (() => new Date().toISOString());
  let store = opts.store ?? null;
  const flushMs = opts.flushMs ?? 1000;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const onError = opts.onError ?? ((e: unknown) => console.warn('trail write failed', e));
  const schedule = () => {
    timer ??= setTimeout(() => void flush(), flushMs);
  };
  const mem: TrailEntry[] = [];
  let queue: TrailEntry[] = [];
  let chain: Promise<void> = Promise.resolve();
  let n = 0;

  const flush = (): Promise<void> => {
    if (timer) clearTimeout(timer);
    timer = null;
    const st = store;
    if (st && queue.length) {
      const batch = queue;
      queue = [];
      chain = chain
        .then(() => st.write(batch))
        .catch((e: unknown) => {
          // tried again with the next write, in order; never more than the capacity waits
          queue = [...batch, ...queue].slice(-capacity);
          onError(e);
        });
    }
    return chain;
  };

  return {
    record(r) {
      let e: TrailEntry;
      try {
        e = { ...plain(r), n: n++, run, t: now() };
      } catch {
        e = { kind: 'fault', name: 'TrailError', message: `unrecordable ${r.kind} entry`, n: n++, run, t: now() };
      }
      mem.push(e);
      if (mem.length > capacity) mem.splice(0, mem.length - capacity);
      if (store) {
        queue.push(e);
        schedule();
      }
      return e;
    },
    async entries() {
      if (!store) return mem.slice();
      try {
        await flush();
        const kept = await store.read();
        // entries of this run that are not stored (yet) are still in memory
        const have = new Set(kept.filter((e) => e.run === run).map((e) => e.n));
        const all = [...kept, ...mem.filter((e) => !have.has(e.n))];
        return all.slice(-capacity);
      } catch (e) {
        onError(e);
        return mem.slice();
      }
    },
    recent: () => mem.slice(),
    flush,
    async clear() {
      if (timer) clearTimeout(timer);
      timer = null;
      queue = [];
      mem.length = 0;
      await chain;
      if (store) await store.clear();
    },
    attach(s) {
      store = s;
      queue = mem.slice();
      if (queue.length) schedule();
    },
  };
}

/** Events of one command, at most `TRAIL_MAX_EVENTS`; `eventCount` says how many there were when some were cut. */
export function trailEvents<E>(events: readonly E[]): { events: E[]; eventCount?: number } {
  if (events.length <= TRAIL_MAX_EVENTS) return { events: [...events] };
  return { events: events.slice(0, TRAIL_MAX_EVENTS), eventCount: events.length };
}

/**
 * A campaign command for the trail: the battle logs that `finishMission`, `restartMission` and `abandonMission` carry
 * become their checksum and length (the journal keeps them whole).
 */
export function compactCommand(cmd: CampaignCommand): Plain {
  const out: Plain = { ...cmd };
  if ('start' in cmd) out.start = `#${stateHash(cmd.start)}`;
  if ('commands' in cmd) out.commands = cmd.commands.length;
  if ('lost' in cmd && cmd.lost) out.lost = { start: `#${stateHash(cmd.lost.start)}`, commands: cmd.lost.commands.length };
  return out;
}

/** The simple parameters of a screen (name, ids, numbers); functions and nested results are left out, `back` becomes its name. */
export function screenInfo(s: { name: string }): Plain {
  const out: Plain = {};
  for (const [k, v] of Object.entries(s)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v;
    else if (v && typeof v === 'object' && typeof (v as { name?: unknown }).name === 'string') out[k] = (v as { name: string }).name;
  }
  return out;
}

/** The app's trail. In memory only until the app attaches its store at start (`src/app/state/rescue.ts`). */
export const trail: Trail = createTrail({
  run: `${Date.now().toString(36)}-${Math.floor(Math.random() * 36 ** 4).toString(36)}`,
  onError: (e) => log.warn('save', 'trail write failed', e),
});
