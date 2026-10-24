/** Which half figures were built (manifest `halves`): scenes pick mood variants from it, or fall back to neutral. */
import { signal } from '@preact/signals';
import { loadManifest } from '../../render/assets';

/** Stems of the built half figures (`kael`, `kael_sad` ...); `null` until the manifest is read. */
export const halfFigures = signal<ReadonlySet<string> | null>(null);

let started = false;
/** Reads the manifest once. */
export function loadHalfFigures(): void {
  if (started) return;
  started = true;
  void loadManifest().then((m) => {
    halfFigures.value = new Set(m.halves ?? []);
  });
}
