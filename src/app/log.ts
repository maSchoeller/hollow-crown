/**
 * Local log (concept/24-architecture §6.2): a ring buffer of the last 500 entries that ends up in the bug
 * report. No telemetry and no network. `src/core` does not log; it returns events and errors.
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogArea = 'core' | 'content' | 'packs' | 'save' | 'render' | 'audio' | 'worker' | 'ui';

export interface LogEntry {
  /** ISO time */
  t: string;
  level: LogLevel;
  area: LogArea;
  msg: string;
  data?: unknown;
}

export const LOG_CAPACITY = 500;

export interface Log {
  add(level: LogLevel, area: LogArea, msg: string, data?: unknown): void;
  error(area: LogArea, msg: string, data?: unknown): void;
  warn(area: LogArea, msg: string, data?: unknown): void;
  info(area: LogArea, msg: string, data?: unknown): void;
  debug(area: LogArea, msg: string, data?: unknown): void;
  /** Entries oldest first (a copy). */
  entries(): LogEntry[];
  clear(): void;
}

export interface LogOptions {
  capacity?: number;
  /** whether `debug` entries are kept (dev build or `?debug`) */
  debug?: boolean;
  now?: () => string;
}

/** Plain JSON copy of log data so later changes to the object do not rewrite history; errors become their parts. */
function plainData(data: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(data, (_k, v: unknown) => (v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v)),
    );
  } catch {
    return String(data);
  }
}

export function createLog(opts: LogOptions = {}): Log {
  const capacity = opts.capacity ?? LOG_CAPACITY;
  const now = opts.now ?? (() => new Date().toISOString());
  const keepDebug = opts.debug ?? false;
  const buf: LogEntry[] = [];

  const add: Log['add'] = (level, area, msg, data) => {
    if (level === 'debug' && !keepDebug) return;
    const e: LogEntry = { t: now(), level, area, msg };
    if (data !== undefined) e.data = plainData(data);
    buf.push(e);
    if (buf.length > capacity) buf.splice(0, buf.length - capacity);
  };

  return {
    add,
    error: (a, m, d) => add('error', a, m, d),
    warn: (a, m, d) => add('warn', a, m, d),
    info: (a, m, d) => add('info', a, m, d),
    debug: (a, m, d) => add('debug', a, m, d),
    entries: () => buf.slice(),
    clear: () => {
      buf.length = 0;
    },
  };
}

const debugOn = (): boolean => {
  if (import.meta.env?.DEV) return true;
  try {
    return typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');
  } catch {
    return false;
  }
};

/** The app's log. */
export const log: Log = createLog({ debug: debugOn() });
