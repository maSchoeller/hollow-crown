/**
 * Which pieces of the fortification kit a wall or gate tile draws (concept/23-art-direction/map-assets): picked from the
 * neighbouring fields, the way the ground picks its splat. Pure, render only; the rules never read it.
 * Rotations are for the models of tools/art/props/fortify.py: `wallrim` stands on the south edge at `rot` = pi.
 */

export interface KitPiece {
  model: string;
  /** offset from the tile, in fields, along x and y of the map */
  dx: number;
  dy: number;
  rot: number;
  /** stands on the ground instead of on the wall's cap */
  ground: boolean;
}

/** Id of the terrain on a field, null outside the grid. */
export type TerrainAt = (gx: number, gy: number) => string | null;

const isGate = (id: string | null): boolean => id === 'gate';
const closesWall = (id: string | null): boolean => id === 'wall' || id === 'door' || id === 'door_open' || isGate(id);

const SOUTH = Math.PI;
const EAST = Math.PI / 2;
const NORTH = 0;
const WEST = -Math.PI / 2;

/** Pieces of a wall tile: a tower on corners and free ends (not beside a gate, it brings its own), otherwise a parapet on each free edge. */
export function wallPieces(at: TerrainAt, gx: number, gy: number): KitPiece[] {
  const n = at(gx, gy - 1);
  const s = at(gx, gy + 1);
  const e = at(gx + 1, gy);
  const w = at(gx - 1, gy);
  const [cn, cs, ce, cw] = [n, s, e, w].map(closesWall) as [boolean, boolean, boolean, boolean];
  const count = +cn + +cs + +ce + +cw;
  const corner = count === 2 && cn !== cs && ce !== cw;
  // a block two fields thick has no corners to crown: its diagonal is wall too
  const thick = corner && closesWall(at(gx + (ce ? 1 : -1), gy + (cs ? 1 : -1)));
  const beside = [n, s, e, w].some(isGate);
  if (!beside && ((corner && !thick) || count <= 1)) return [{ model: 'tower_idle', dx: 0, dy: 0, rot: SOUTH, ground: true }];
  const out: KitPiece[] = [];
  if (!cs) out.push({ model: 'wallrim_idle', dx: 0, dy: 0, rot: SOUTH, ground: false });
  if (!cn) out.push({ model: 'wallrim_idle', dx: 0, dy: 0, rot: NORTH, ground: false });
  if (!ce) out.push({ model: 'wallrim_idle', dx: 0, dy: 0, rot: EAST, ground: false });
  if (!cw) out.push({ model: 'wallrim_idle', dx: 0, dy: 0, rot: WEST, ground: false });
  return out;
}

/** Turn of a door or one-tile gate: it faces along the wall it stands in. */
export function faceRot(at: TerrainAt, gx: number, gy: number): number {
  return closesWall(at(gx, gy - 1)) || closesWall(at(gx, gy + 1)) ? EAST : SOUTH;
}

/** Pieces of a gate tile: runs of gates pair up from the west (or north) into one two-tile gatehouse; a tile left over gets the one-tile gate. */
export function gatePieces(at: TerrainAt, gx: number, gy: number): KitPiece[] {
  const runBefore = (dx: number, dy: number): number => {
    let k = 0;
    while (isGate(at(gx - dx * (k + 1), gy - dy * (k + 1)))) k++;
    return k;
  };
  const horizontal = isGate(at(gx - 1, gy)) || isGate(at(gx + 1, gy));
  const vertical = !horizontal && (isGate(at(gx, gy - 1)) || isGate(at(gx, gy + 1)));
  if (horizontal || vertical) {
    const [dx, dy] = horizontal ? [1, 0] : [0, 1];
    const before = runBefore(dx, dy);
    if (before % 2 === 1) return [];
    if (isGate(at(gx + dx, gy + dy))) return [{ model: 'gatehouse_open', dx: dx * 0.5, dy: dy * 0.5, rot: horizontal ? SOUTH : EAST, ground: true }];
  }
  return [{ model: 'gate_idle', dx: 0, dy: 0, rot: faceRot(at, gx, gy), ground: true }];
}
