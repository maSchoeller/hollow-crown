/** Screen → tile on the 3D board: a figure under the ray first (raised ones), else the view ray marches down through the terrain heights. */
import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Pos } from '../../core';

/** Size of a figure on the screen plane, in tiles: half its width, how far under its feet and how high above them it still counts. */
const FIGURE_HALF_WIDTH = 0.36;
const FIGURE_FEET = 0.12;
const FIGURE_HEIGHT = 0.72;

/** A figure a tap can hit directly: its tile and the height its feet stand at. */
export interface RaisedFigure {
  tile: Pos;
  top: number;
}

/**
 * The tile of the figure drawn under the ray, the southernmost (frontmost) one first; null when none is. At 35 degrees a figure on a
 * wall walk slides about 0.6 fields up the screen and its body hangs over the tile behind it, so the ground alone would pick the wrong tile.
 */
export function figureAt(origin: Vector3, up: Vector3, figures: RaisedFigure[]): Pos | null {
  let best: RaisedFigure | null = null;
  for (const f of figures) {
    const dx = f.tile[0] + 0.5 - origin.x;
    const dy = f.top - origin.y;
    const dz = -f.tile[1] - 0.5 - origin.z;
    const sy = -(dx * up.x + dy * up.y + dz * up.z);
    if (Math.abs(dx) > FIGURE_HALF_WIDTH || sy < -FIGURE_FEET || sy > FIGURE_HEIGHT) continue;
    if (!best || f.tile[1] > best.tile[1]) best = f;
  }
  return best?.tile ?? null;
}

/**
 * `origin`: point of the ray on the camera plane through the ground centre, `forward`: view direction, `topOf`: top
 * height of a map tile (null outside the map). Returns the first tile whose top the ray passes below, or null.
 */
export function marchToTile(origin: Vector3, forward: Vector3, topOf: (x: number, y: number) => number | null): Pos | null {
  const dy = -forward.y || 1;
  // start above the highest terrain and walk down in small steps
  let s = (origin.y - 3) / dy;
  const ds = 0.02 / dy;
  for (let i = 0; i < 300; i++, s += ds) {
    const px = origin.x + forward.x * s;
    const py = origin.y + forward.y * s;
    const pz = origin.z + forward.z * s;
    const tx = Math.floor(px);
    const ty = Math.floor(-pz);
    const top = topOf(tx, ty);
    if (top !== null && py <= top) return [tx, ty];
    if (py < -1.5) break;
  }
  return null;
}
