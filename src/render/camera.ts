/**
 * Camera framing shared by the board renderers (concept/01-decisions.md D10).
 * Pure math in world units; the caller converts HUD sizes from CSS px.
 */

/** Parts of the view covered by HUD (top bar, bottom sheet, …). */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Clamps the camera centre on one axis. `view` is the visible extent, `lo`/`hi` the HUD-covered parts at
 * its low/high end, `size` the map extent (map spans 0…size). The map may be pushed past each edge by
 * `margin` × the free extent; when it fits that easily it stays centred in the free area.
 */
export function clampAxis(pos: number, view: number, lo: number, hi: number, size: number, margin: number): number {
  const free = Math.max(0, view - lo - hi);
  const push = margin * free;
  const min = view / 2 - lo - push;
  const max = size + push - view / 2 + hi;
  return min > max ? (min + max) / 2 : Math.min(Math.max(pos, min), max);
}

/** Camera centre on one axis that shows world coordinate `p` in the middle of the free area. */
export function centreOn(p: number, lo: number, hi: number): number {
  return p - (lo - hi) / 2;
}

/** Is world coordinate `p` inside the free area, at least `pad` away from its edges? */
export function inFreeArea(p: number, centre: number, view: number, lo: number, hi: number, pad: number): boolean {
  const start = centre - view / 2 + lo;
  const end = centre + view / 2 - hi;
  return p >= start + pad && p <= end - pad;
}
