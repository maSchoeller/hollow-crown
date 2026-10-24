/**
 * Pure rules of the loading display (story 7.6): which on-demand files a mission needs, which of them are missing,
 * and the numbers the stones show. No DOM, no cache access: `state/loading.ts` and `state/prepare.ts` do the I/O.
 */

import { modelId, type FigureSource, type GameData } from '../../core';

/** Classes' figure fields, as `GameData.classes` has them. */
type Classes = Parameters<typeof modelId>[2];

/** The fields of a battle unit (or a map definition) that decide which 3D model shows it. */
export type ModelSource = FigureSource;

/** A unit of the mission: what picks its model, and the ids of the item definitions whose weapon models it may show. */
export type MissionUnit = ModelSource & { gearItems?: readonly string[] };

/** `GameData.items` as far as the gear rules read it. */
type GearItems = Record<string, Pick<GameData['items'][string], 'weaponType' | 'kind'>>;
type Gear = GameData['render']['gear'];

export interface MissionAssetInput {
  /** units on the board at the start and those arriving later (reinforcements, spawns) */
  units: readonly MissionUnit[];
  /** weapon model files the manifest lists (`manifest.models.weapons`); without them no weapon file is needed */
  weaponModels?: readonly string[];
  /** `GameData.items` and `GameData.render.gear`: which weapon model a weapon group or off-hand item shows */
  items?: GearItems;
  gear?: Gear;
  /** model ids the manifest lists (`manifest.models.units`); without it figures are drawn as sprites and need no file */
  models: readonly string[] | undefined;
  /** `GameData.classes`: the class names the figure of generic units */
  classes: Classes;
  /** `CampaignNodeDef.place` */
  place?: string;
  /** place image of a mission without its own (`CampaignDef.defaultPlace`) */
  defaultPlace: string;
}

/**
 * File of a place image: `place` is a location (`locations/<place>.webp`), or a background as `backgrounds/<id>`
 * (`backgrounds/<id>.webp`, decision 2026-10-24).
 */
export function placePath(place: string): string {
  return `${place.startsWith('backgrounds/') ? place : `locations/${place}`}.webp`;
}

/** Weapon library models (`models/weapons/<model>.glb`) the items show on a figure: weapon group in the main hand, off-hand kind. */
export function gearModels(itemIds: readonly string[], items: GearItems, gear: Gear): string[] {
  const out = new Set<string>();
  for (const id of itemIds) {
    const d = items[id];
    if (!d) continue;
    const weapon = d.weaponType && gear.weapons[d.weaponType];
    const off = gear.offHand[d.kind];
    if (weapon) out.add(weapon.model);
    if (off) out.add(off.model);
  }
  return [...out];
}

/** Paths below `public/assets` that load on demand and that a mission needs: its place image, unit models and their weapon models. */
export function missionAssets({ units, models, classes, place, defaultPlace, weaponModels, items, gear }: MissionAssetInput): string[] {
  const out = new Set<string>([placePath(place ?? defaultPlace)]);
  if (models) {
    for (const u of units) {
      const id = modelId(u, models, classes);
      if (!id || !models.includes(id)) continue;
      out.add(`models/units/${id}.glb`);
      if (items && gear && weaponModels && u.gearItems)
        for (const w of gearModels(u.gearItems, items, gear)) if (weaponModels.includes(w)) out.add(`models/weapons/${w}.glb`);
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

/** A size as a number in the locale's format plus the unit's locale key: "12,4" + MB, or "830" + KB below 1 MB (whole KB). */
export function formatBytes(bytes: number, locale: string): { n: string; unitKey: 'ui.size.mb' | 'ui.size.kb' } {
  if (bytes >= 1024 * 1024) {
    return { n: new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(bytes / (1024 * 1024)), unitKey: 'ui.size.mb' };
  }
  return { n: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.max(1, Math.round(bytes / 1024))), unitKey: 'ui.size.kb' };
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
