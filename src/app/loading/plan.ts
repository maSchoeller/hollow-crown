/**
 * Pure rules of the loading display (story 7.6): which on-demand files a mission needs, which of them are missing,
 * and the numbers the stones show. No DOM, no cache access: `state/loading.ts` and `state/prepare.ts` do the I/O.
 */

/** Place image of a mission without its own (`CampaignNodeDef.place`). */
export const DEFAULT_PLACE = 'lager_unterwegs';

/** The fields of a battle unit (or a map definition) that decide which 3D model shows it. */
export interface ModelSource {
  portrait?: string;
  sprite?: string;
  charId?: string;
  classId?: string;
}

/** Same choice as the board: a figure per chosen portrait where one exists (avatar_a / avatar_b), else the unit's own. */
export function unitModelId(u: ModelSource, models: readonly string[]): string {
  const own = u.sprite ?? u.charId ?? u.classId ?? '';
  return u.portrait && models.includes(u.portrait) ? u.portrait : own;
}

export interface MissionAssetInput {
  /** units on the board at the start and those arriving later (reinforcements, spawns) */
  units: readonly ModelSource[];
  /** model ids the manifest lists (`manifest.models.units`); without it figures are drawn as sprites and need no file */
  models: readonly string[] | undefined;
  /** `CampaignNodeDef.place` */
  place?: string;
}

/** Paths below `public/assets` that load on demand and that a mission needs: its place image and its unit models. */
export function missionAssets({ units, models, place }: MissionAssetInput): string[] {
  const out = new Set<string>([`locations/${place ?? DEFAULT_PLACE}.webp`]);
  if (models) {
    for (const u of units) {
      const id = unitModelId(u, models);
      if (id && models.includes(id)) out.add(`models/units/${id}.glb`);
    }
  }
  return [...out].sort();
}

/** The paths for which `isCached` says no. */
export async function missingAssets(paths: readonly string[], isCached: (path: string) => Promise<boolean>): Promise<string[]> {
  const flags = await Promise.all(paths.map((p) => isCached(p).catch(() => false)));
  return paths.filter((_, i) => !flags[i]);
}

/** 0..1; an empty list counts as done. */
export function ratio(done: number, total: number): number {
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, done / total));
}

/** Share of the first download that is in the precache so far (`cached` entries of `total`). */
export function installProgress(cached: number, total: number): number {
  return ratio(cached, total);
}

/** "12,4 MB" / "12.4 MB" / "830 KB"; sizes below 1 MB in whole KB. */
export function formatBytes(bytes: number, locale: string): string {
  if (bytes >= 1024 * 1024) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

/** What the loading screen can be in (the stone's sentence follows from it). */
export type MissionLoadStatus = 'loading' | 'offline' | 'failed';

/**
 * After a failed round: offline (the browser says so) or failed (online, but a file did not arrive).
 * Offline with nothing missing never reaches here: the mission just starts.
 */
export function failureStatus(online: boolean): Exclude<MissionLoadStatus, 'loading'> {
  return online ? 'failed' : 'offline';
}
