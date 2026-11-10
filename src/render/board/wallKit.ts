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

const isGate = (id: string | null): boolean => id === 'gate' || id === 'gate_closed';
/** Walkable tops of the kit: no tower of their own, a figure stands there. */
const WALKABLE = new Set(['rampart', 'tower_top', 'terrace']);
export const isWallTop = (id: string | null): boolean => id !== null && WALKABLE.has(id);
const closesWall = (id: string | null): boolean =>
  id === 'wall' || id === 'door' || id === 'door_open' || isGate(id) || isWallTop(id) || id === 'ramp' || id === 'stairs' || id === 'ladder';

const SOUTH = Math.PI;
const EAST = Math.PI / 2;
const NORTH = 0;
const WEST = -Math.PI / 2;

/** Pieces of a walkable top: a parapet on each free edge, the centre stays free; a terrace has none. */
export function topPieces(at: TerrainAt, gx: number, gy: number): KitPiece[] {
  if (at(gx, gy) === 'terrace') return [];
  const out: KitPiece[] = [];
  if (!closesWall(at(gx, gy + 1))) out.push({ model: 'wallrim_idle', dx: 0, dy: 0, rot: SOUTH, ground: false });
  if (!closesWall(at(gx, gy - 1))) out.push({ model: 'wallrim_idle', dx: 0, dy: 0, rot: NORTH, ground: false });
  if (!closesWall(at(gx + 1, gy))) out.push({ model: 'wallrim_idle', dx: 0, dy: 0, rot: EAST, ground: false });
  if (!closesWall(at(gx - 1, gy))) out.push({ model: 'wallrim_idle', dx: 0, dy: 0, rot: WEST, ground: false });
  return out;
}

/** Turn of a ladder (fix 2026-11-08): modelled against a wall to the north like a ramp, turned towards the tile it leads up to. */
export function ladderRot(up: 'n' | 'e' | 's' | 'w'): number {
  return { n: SOUTH, e: WEST, w: EAST, s: NORTH }[up];
}

/** Turn of a ramp or stairs: its models rise to the north as modelled (like every prop, at `rot` = pi), so it faces the neighbour higher than it (`heightAt`). */
export function connectorRot(heightAt: (gx: number, gy: number) => number, gx: number, gy: number): number {
  const h = heightAt(gx, gy);
  if (heightAt(gx, gy - 1) > h) return SOUTH;
  if (heightAt(gx + 1, gy) > h) return WEST;
  if (heightAt(gx - 1, gy) > h) return EAST;
  return NORTH;
}

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

/** Turn of a door or one-tile gate: it faces along the wall it stands in; in a vault the rock is that wall. */
export function faceRot(at: TerrainAt, gx: number, gy: number): number {
  const closes = (id: string | null) => closesWall(id) || id === 'mountain';
  return closes(at(gx, gy - 1)) || closes(at(gx, gy + 1)) ? EAST : SOUTH;
}

/** Pieces of a gate tile: runs of gates pair up from the west (or north) into one two-tile gatehouse; a tile left over gets the one-tile gate. */
export function gatePieces(at: TerrainAt, gx: number, gy: number): KitPiece[] {
  // open and closed wings do not pair: a gate half open draws two narrow gates
  const self = at(gx, gy);
  const closed = self === 'gate_closed';
  const same = (id: string | null) => id === self;
  const runBefore = (dx: number, dy: number): number => {
    let k = 0;
    while (same(at(gx - dx * (k + 1), gy - dy * (k + 1)))) k++;
    return k;
  };
  const horizontal = same(at(gx - 1, gy)) || same(at(gx + 1, gy));
  const vertical = !horizontal && (same(at(gx, gy - 1)) || same(at(gx, gy + 1)));
  if (horizontal || vertical) {
    const [dx, dy] = horizontal ? [1, 0] : [0, 1];
    const before = runBefore(dx, dy);
    if (before % 2 === 1) return [];
    if (same(at(gx + dx, gy + dy))) return [{ model: closed ? 'gatehouse_closed' : 'gatehouse_open', dx: dx * 0.5, dy: dy * 0.5, rot: horizontal ? SOUTH : EAST, ground: true }];
  }
  return [{ model: closed ? 'door_closed_idle' : 'gate_idle', dx: 0, dy: 0, rot: faceRot(at, gx, gy), ground: true }];
}

/** Height of a boardwalk's deck above its tile's ground level, and of the deck within the model (tools/art/props/nature_map.py DECK). */
export const BOARDWALK_DECK = 0.04;
export const BOARDWALK_MODEL_DECK = 0.16;

/**
 * Piece of a boardwalk tile, from the fields it reaches (`joins`: another boardwalk or dry walkable ground). The models of
 * tools/art/props/nature_map.py, at `rot` = pi: `straight` runs north-south, `corner` joins south and east, `end` is open to the south.
 */
export function boardwalkPiece(joins: (gx: number, gy: number) => boolean, gx: number, gy: number): { model: string; rot: number } {
  const n = joins(gx, gy - 1);
  const s = joins(gx, gy + 1);
  const e = joins(gx + 1, gy);
  const w = joins(gx - 1, gy);
  const count = +n + +s + +e + +w;
  if (count === 1) return { model: 'boardwalk_end', rot: s ? SOUTH : n ? NORTH : e ? WEST : EAST };
  if (count === 2 && n !== s) {
    if (s) return { model: 'boardwalk_corner', rot: e ? SOUTH : WEST };
    return { model: 'boardwalk_corner', rot: e ? EAST : NORTH };
  }
  return { model: 'boardwalk_straight', rot: n || s ? SOUTH : EAST };
}

/**
 * Pieces of a paddock tile (story 11.14), from the neighbouring paddock tiles (`joins`: paddock fence or gate). The models of
 * tools/art/props/village.py at `rot` = 0: `paddock_straight` and `paddock_gate` run east-west, `paddock_corner` has its rails to the
 * west and the north. A line picks straight (or the gate), two joins at a right angle a corner, a junction a straight per axis.
 */
export function paddockPiece(joins: (gx: number, gy: number) => boolean, gx: number, gy: number, gate: boolean): Array<{ model: string; rot: number }> {
  const n = joins(gx, gy - 1);
  const s = joins(gx, gy + 1);
  const e = joins(gx + 1, gy);
  const w = joins(gx - 1, gy);
  const across = e || w;
  const along = n || s;
  const line = gate ? 'paddock_gate' : 'paddock_straight';
  if (!across && along) return [{ model: line, rot: EAST }];
  if (across && !along) return [{ model: line, rot: NORTH }];
  if (!across) return [{ model: line, rot: NORTH }];
  if (!gate && +n + +s + +e + +w === 2) {
    // corner: rails west+north at 0, north+east at pi/2, east+south at pi, south+west at -pi/2
    if (w && n) return [{ model: 'paddock_corner', rot: NORTH }];
    if (n && e) return [{ model: 'paddock_corner', rot: EAST }];
    if (e && s) return [{ model: 'paddock_corner', rot: SOUTH }];
    return [{ model: 'paddock_corner', rot: WEST }];
  }
  return [
    { model: line, rot: NORTH },
    { model: 'paddock_straight', rot: EAST },
  ];
}
