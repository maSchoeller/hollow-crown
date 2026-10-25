/** Which backgrounds were built (manifest `backgrounds`): a scene panel whose picture is missing falls back to the scene background. */
import { signal } from '@preact/signals';
import { loadManifest } from '../../render/shared/assets';

/** Ids of the built backgrounds (`bg_camp_night` ...); `null` until the manifest is read. */
export const builtBackgrounds = signal<ReadonlySet<string> | null>(null);

let started = false;
/** Reads the manifest once. */
export function loadBuiltBackgrounds(): void {
  if (started) return;
  started = true;
  void loadManifest().then((m) => {
    builtBackgrounds.value = new Set(m.backgrounds ?? []);
  });
}
