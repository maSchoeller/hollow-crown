/**
 * Shared asset cache of the render host (story 5.1, concept/24-architecture §5.12): every model file and ground texture is
 * loaded once and stays while a scene uses it. Holders are the scenes (board, world map, home); a scene that is disposed
 * releases everything it used. Entries no scene holds stay loaded up to `keepUnused`, the longest unused go first, so a
 * switch board ↔ world map does not load anything again.
 */
interface Entry<T> {
  value: Promise<T>;
  holders: Set<object>;
  /** when the last holder let go (order of eviction) */
  idleSince: number;
}

export class RefCache<T> {
  private entries = new Map<string, Entry<T>>();
  private clock = 0;

  constructor(
    private load: (key: string) => Promise<T>,
    private free: (value: T) => void,
    public keepUnused: number,
  ) {}

  /** The value for `key`, loaded on first use; `holder` keeps it until it is released. */
  use(key: string, holder: object): Promise<T> {
    let e = this.entries.get(key);
    if (!e) {
      e = { value: this.load(key), holders: new Set(), idleSince: 0 };
      this.entries.set(key, e);
    }
    e.holders.add(holder);
    return e.value;
  }

  /** Number of holders of `key` (0 = loaded but unused, undefined = not loaded). */
  refs(key: string): number | undefined {
    return this.entries.get(key)?.holders.size;
  }

  /** Whether `key` is loaded (or loading). */
  has(key: string): boolean {
    return this.entries.has(key);
  }

  /** Lets go of everything `holder` used, then trims the unused entries to `keepUnused`. */
  release(holder: object): void {
    for (const e of this.entries.values()) if (e.holders.delete(holder) && e.holders.size === 0) e.idleSince = ++this.clock;
    this.trim();
  }

  private trim(): void {
    const idle = [...this.entries].filter(([, e]) => e.holders.size === 0).sort((a, b) => a[1].idleSince - b[1].idleSince);
    for (const [key, e] of idle.slice(0, Math.max(0, idle.length - this.keepUnused))) {
      this.entries.delete(key);
      void e.value.then(this.free, () => undefined);
    }
  }

  /** Frees everything (the host is torn down). */
  clear(): void {
    for (const e of this.entries.values()) void e.value.then(this.free, () => undefined);
    this.entries.clear();
  }
}
