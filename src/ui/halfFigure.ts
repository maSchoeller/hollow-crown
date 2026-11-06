/**
 * Half figures of scenes (`halves/<id>.webp`, `halves/<id>_<mood>.webp`, built by `pnpm art:build`). A mood variant
 * that is not built falls back to the neutral figure; a speaker without any half figure is shown without a picture.
 */
import { asset } from './asset';

/** Id of the image of a speaker: the avatar maps to its look (`avatar_a` → `rhen_a`), everyone else to their id. */
export function figureId(speaker: string, avatarPortrait: string): string {
  return speaker === 'avatar' ? avatarPortrait.replace(/^avatar_/, 'rhen_') : speaker;
}

/**
 * The stem of the half figure to show, or `null` when the speaker has none (the caller shows no figure).
 * `built` = stems of the manifest (`lucan`, `lucan_sad` ...); without a manifest the neutral figure is tried.
 */
export function pickHalf(id: string, mood: string, built: ReadonlySet<string> | null | undefined): string | null {
  if (mood !== 'neutral' && built?.has(`${id}_${mood}`)) return `${id}_${mood}`;
  return !built || built.has(id) ? id : null;
}

/**
 * Half figure for a dialogue side. Portraits face the right edge, so a figure on the left looks into the scene as is;
 * on the right it is mirrored, unless a figure drawn facing left exists (`<id>_l`, `<id>_l_<mood>`), which keeps
 * asymmetric signature parts on their side (portrait_master.md §5, rule 15).
 */
export function pickSideHalf(
  id: string,
  mood: string,
  side: 'left' | 'right',
  built: ReadonlySet<string> | null | undefined,
): { stem: string; mirror: boolean } | null {
  if (side === 'right' && built) {
    const facingLeft = pickHalf(`${id}_l`, mood, built);
    if (facingLeft) return { stem: facingLeft, mirror: false };
  }
  const stem = pickHalf(id, mood, built);
  return stem ? { stem, mirror: side === 'right' } : null;
}

/** URL of a half-figure stem. */
export const halfUrl = (stem: string): string => asset(`halves/${stem}.webp`);
