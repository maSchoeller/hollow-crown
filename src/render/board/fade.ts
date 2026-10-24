/**
 * Story 8.10: which props hide a figure from the board camera and turn see-through.
 *
 * The camera looks north, tilted `tiltDeg` from straight down. A screen row rises by `sin(tilt)` per tile of height and
 * by `cos(tilt)` per tile northwards, so a prop whose back edge lies `d` tiles south of a figure covers that figure up to
 * `top - d · cot(tilt)` above its feet. A prop counts when it covers at least `cover` tiles of the figure and overlaps it
 * sideways; a prop north of the figure is behind it and never counts.
 */

/** Prop footprint: centre in tiles (x east, y south), radius around the centre, top height above the board's zero. */
export interface PropBox {
  x: number;
  y: number;
  r: number;
  top: number;
}

/** Figure: centre of its tile and the height it stands on. */
export interface FigureSpot {
  x: number;
  y: number;
  h: number;
}

export interface FadeRule {
  /** cot of the camera tilt from straight down */
  cot: number;
  /** minimum hidden part of the figure, in tiles of height */
  cover: number;
  /** half width of a figure, in tiles */
  figureWidth: number;
}

export function fadeRule(tiltDeg: number, cover: number, figureWidth: number): FadeRule {
  const t = (tiltDeg * Math.PI) / 180;
  return { cot: Math.cos(t) / Math.max(1e-6, Math.sin(t)), cover, figureWidth };
}

export function hidesFigure(b: PropBox, f: FigureSpot, rule: FadeRule): boolean {
  if (Math.abs(b.x - f.x) >= b.r + rule.figureWidth) return false;
  // in front of the figure: some of the prop lies south of the figure's centre
  if (b.y + b.r <= f.y) return false;
  return b.top - f.h - rule.cover > (b.y - b.r - f.y) * rule.cot;
}
