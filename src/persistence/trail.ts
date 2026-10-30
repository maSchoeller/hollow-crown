/**
 * Store of the action trail (concept/24-architecture §6.2a): its own IndexedDB, so the save database and its format stay
 * untouched. Entries get increasing keys; after a write the oldest are dropped down to the capacity. The entry type is
 * the app's (`src/app/trail.ts`); this layer only stores plain JSON.
 */
import { openDB, type IDBPDatabase } from 'idb';

export const TRAIL_DB_NAME = 'hollow-crown-trail';
const STORE = 'entries';

let dbp: Promise<IDBPDatabase> | null = null;
function trailDb(): Promise<IDBPDatabase> {
  dbp ??= openDB(TRAIL_DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore(STORE, { autoIncrement: true });
    },
  });
  return dbp;
}

export async function closeTrailDb(): Promise<void> {
  const p = dbp;
  dbp = null;
  if (p) (await p).close();
}

export interface TrailDbStore<E> {
  write(entries: E[]): Promise<void>;
  read(): Promise<E[]>;
  clear(): Promise<void>;
}

export function createTrailStore<E>(capacity: number): TrailDbStore<E> {
  return {
    async write(entries) {
      const tx = (await trailDb()).transaction(STORE, 'readwrite');
      for (const e of entries) void tx.store.add(e);
      let extra = (await tx.store.count()) - capacity;
      let cur = extra > 0 ? await tx.store.openCursor() : null;
      while (cur && extra-- > 0) {
        await cur.delete();
        cur = await cur.continue();
      }
      await tx.done;
    },
    async read() {
      return (await (await trailDb()).getAll(STORE)) as E[];
    },
    async clear() {
      await (await trailDb()).clear(STORE);
    },
  };
}
