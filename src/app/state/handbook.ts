/** The handbook over the current screen (epic 14): opened from the battle menu or a context "?"; the full-screen view is `screen`. */
import { signal } from '@preact/signals';
import { entryByAnchor } from '../../core';
import { data } from './session';

/** null = closed; `entry` opens that entry directly (a "?" in the game), without it the categories show. */
export const handbookSheet = signal<{ entry?: string } | null>(null);

/** The entry a context anchor (`forecast`, `terrain.forest`, `status.wet`, `lesson.<scene>`) opens, or undefined. */
export const helpEntry = (anchor: string): string | undefined => entryByAnchor(data.handbook, anchor)?.id;

export function openHandbook(entry?: string): void {
  handbookSheet.value = { entry };
}

export function closeHandbook(): void {
  handbookSheet.value = null;
}
