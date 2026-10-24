/**
 * Loading a pack (architecture §5.14, story 7.2): `packs.json` says what belongs to it, `downloadPack` puts the files
 * into the pack cache, `loadPack` imports the content module and registers data and texts. A worker that needs the
 * content imports the same module and calls `registerPackContent` there (AR14; the board AI runs synchronously so far).
 */
import { loaders } from 'virtual:hc-packs';
import { isPackRegistered, registerPackContent } from '../content/browser';
import type { PacksManifest } from '../content/packs';

/** `packs.json` of the running build (precached with core, so it answers offline too); null when it cannot be read. */
export async function fetchPacksManifest(base: string): Promise<PacksManifest | null> {
  try {
    const res = await fetch(`${base}packs.json`);
    if (!res.ok) return null;
    return (await res.json()) as PacksManifest;
  } catch {
    return null;
  }
}

/** Imports the content of a pack and registers it (its files must be cached or reachable). Core is always there. */
export async function loadPack(id: string): Promise<void> {
  if (isPackRegistered(id)) return;
  const load = loaders[id];
  if (!load) throw new Error(`pack ${id} is not in this build`);
  registerPackContent(id, await load());
}
