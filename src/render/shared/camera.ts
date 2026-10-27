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

export interface FramePlan {
  /** zoom step to use (never closer than the current one) */
  step: number;
  /** ground point (tiles) the marked fields' bounding box is centred on */
  cx: number;
  cy: number;
}

/**
 * Goal marking: how the camera frames `tiles` (fields, x east, y south). The bounding box plus `margin` tiles on every side must fit the
 * free area (the view without the HUD, `hud` in CSS px); it starts at the current zoom `step` and goes out one step at a time (indices
 * grow outwards, `steps` = visible columns on the shorter side), the last step if none fits. The centre is the box's middle.
 */
export function framePlan(o: {
  tiles: ReadonlyArray<readonly [number, number]>;
  step: number;
  steps: readonly number[];
  viewW: number;
  viewH: number;
  hud: Insets;
  cosTilt: number;
  margin: number;
}): FramePlan {
  const xs = o.tiles.map((t) => t[0]);
  const ys = o.tiles.map((t) => t[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs) + 1;
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys) + 1;
  const minDim = Math.min(o.viewW, o.viewH);
  let step = o.step;
  for (; step < o.steps.length - 1; step++) {
    const ppt = minDim / o.steps[step]!;
    const freeW = (o.viewW - o.hud.left - o.hud.right) / ppt;
    const freeH = (o.viewH - o.hud.top - o.hud.bottom) / ppt / o.cosTilt;
    if (x1 - x0 + 2 * o.margin <= freeW && y1 - y0 + 2 * o.margin <= freeH) break;
  }
  return { step, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
