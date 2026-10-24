/** Screen → tile on the 3D board: marches the view ray down through the terrain heights (D1, heights only visual). */
import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Pos } from '../../core';

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
