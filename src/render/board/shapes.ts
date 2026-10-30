/**
 * Flat shapes of the board's markings (epic 13): rounded single tiles, the outer edge of a set of tiles, dashes, ribbons and the
 * path arrow, grid marks. Plain vertex and index arrays in world space (x east, y up, z north = -tile row), no Babylon here, so
 * the geometry is tested on its own. `top(x, y)` gives the height a marking lies on.
 */
import type { Pos } from '../../core';

export interface Geo {
  p: number[];
  idx: number[];
}

export const geo = (): Geo => ({ p: [], idx: [] });

type Top = (x: number, y: number) => number;

/** A quad from four corners (x, z) at height h, appended to `g`. */
function quad(g: Geo, h: number, a: [number, number], b: [number, number], c: [number, number], d: [number, number]): void {
  const k = g.p.length / 3;
  g.p.push(a[0], h, a[1], b[0], h, b[1], c[0], h, c[1], d[0], h, d[1]);
  g.idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
}

/** Steps of a rounded corner. */
const CORNER_STEPS = 3;

/** One tile drawn smaller by `gap / 2` on each side with corners rounded by `r` (a fan round the centre). */
export function roundedTile(g: Geo, t: Pos, h: number, gap: number, r: number): void {
  const x0 = t[0] + gap / 2;
  const x1 = t[0] + 1 - gap / 2;
  const n0 = -t[1] - gap / 2; // north edge (z)
  const s0 = -t[1] - 1 + gap / 2; // south edge
  const rr = Math.max(0, Math.min(r, (x1 - x0) / 2));
  const cx = t[0] + 0.5;
  const cz = -t[1] - 0.5;
  const k = g.p.length / 3;
  g.p.push(cx, h, cz);
  // corner centres counter-clockwise from north-east, each with its start angle
  const corners: Array<[number, number, number]> = [
    [x1 - rr, n0 - rr, 0],
    [x0 + rr, n0 - rr, Math.PI / 2],
    [x0 + rr, s0 + rr, Math.PI],
    [x1 - rr, s0 + rr, (Math.PI * 3) / 2],
  ];
  let n = 0;
  for (const [ox, oz, a0] of corners) {
    for (let i = 0; i <= CORNER_STEPS; i++) {
      const a = a0 + (i / CORNER_STEPS) * (Math.PI / 2);
      g.p.push(ox + Math.cos(a) * rr, h, oz + Math.sin(a) * rr);
      n++;
    }
  }
  for (let i = 0; i < n; i++) g.idx.push(k, k + 1 + i, k + 1 + ((i + 1) % n));
}

/** A side of a tile on the outer edge of a set: from (ax, ay) to (bx, by) in tile corner coordinates, lying at the height of `tile`. */
export interface EdgeSegment {
  a: [number, number];
  b: [number, number];
  tile: Pos;
}

/** The sides of the tiles in `set` (keys "x,y") that border no tile of the set: the outer edge of a range or zone. */
export function outerEdges(set: ReadonlySet<string>): EdgeSegment[] {
  const out: EdgeSegment[] = [];
  for (const k of set) {
    const [x, y] = k.split(',').map(Number) as [number, number];
    const tile: Pos = [x, y];
    if (!set.has(`${x},${y - 1}`)) out.push({ a: [x, y], b: [x + 1, y], tile });
    if (!set.has(`${x + 1},${y}`)) out.push({ a: [x + 1, y], b: [x + 1, y + 1], tile });
    if (!set.has(`${x},${y + 1}`)) out.push({ a: [x + 1, y + 1], b: [x, y + 1], tile });
    if (!set.has(`${x - 1},${y}`)) out.push({ a: [x, y + 1], b: [x, y], tile });
  }
  return out;
}

/**
 * A ribbon of width `w` along the tile-coordinate line a -> b at height h, reaching `extend` past both ends (closes the corners
 * where two edge pieces meet).
 */
export function ribbon(g: Geo, a: [number, number], b: [number, number], h: number, w: number, extend = 0): void {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0 || w <= 0) return;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy * (w / 2);
  const ny = ux * (w / 2);
  const ax = a[0] - ux * extend;
  const ay = a[1] - uy * extend;
  const bx = b[0] + ux * extend;
  const by = b[1] + uy * extend;
  // tile y runs south, world z north
  quad(g, h, [ax + nx, -(ay + ny)], [bx + nx, -(by + ny)], [bx - nx, -(by - ny)], [ax - nx, -(ay - ny)]);
}

/** The outer edge of `segs` as ribbons of width w (closed corners). */
export function edgeRibbons(g: Geo, segs: readonly EdgeSegment[], top: Top, lift: number, w: number): void {
  for (const s of segs) ribbon(g, s.a, s.b, top(s.tile[0], s.tile[1]) + lift, w, w / 2);
}

/** Dashes along a -> b: `dash` long with `gap` between, the first one starting at a. Returns the pieces as [from, to] in tile coordinates. */
export function dashes(a: [number, number], b: [number, number], dash: number, gap: number): Array<[[number, number], [number, number]]> {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const out: Array<[[number, number], [number, number]]> = [];
  if (len === 0 || dash <= 0) return out;
  const at = (d: number): [number, number] => [a[0] + ((b[0] - a[0]) * d) / len, a[1] + ((b[1] - a[1]) * d) / len];
  for (let d = 0; d < len; d += dash + gap) out.push([at(d), at(Math.min(len, d + dash))]);
  return out;
}

/** A flat disc of radius r round (x, y) in tile coordinates (the round joints of the path arrow). */
export function disc(g: Geo, x: number, y: number, h: number, r: number, steps = 12): void {
  const k = g.p.length / 3;
  g.p.push(x, h, -y);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    g.p.push(x + Math.cos(a) * r, h, -y + Math.sin(a) * r);
  }
  for (let i = 0; i < steps; i++) g.idx.push(k, k + 1 + i, k + 1 + ((i + 1) % steps));
}

/**
 * The path arrow (story 13.2): a thick round line through the tile centres of `path` with its head on the last tile. `w` = line
 * width, `head` = width of the head, `headLength` = its length; the tip lies a little past the centre of the goal tile.
 */
export function arrow(g: Geo, path: readonly Pos[], top: Top, lift: number, w: number, head: number, headLength: number): void {
  if (path.length < 2) return;
  const c = (p: Pos): [number, number] => [p[0] + 0.5, p[1] + 0.5];
  const h = (p: Pos) => top(p[0], p[1]) + lift;
  const last = path[path.length - 1]!;
  const prev = path[path.length - 2]!;
  const end = c(last);
  const from = c(prev);
  const ux = end[0] - from[0];
  const uy = end[1] - from[1];
  const len = Math.hypot(ux, uy) || 1;
  const tipOut = Math.min(0.3, headLength * 0.6);
  const base: [number, number] = [end[0] - (ux / len) * (headLength - tipOut), end[1] - (uy / len) * (headLength - tipOut)];
  for (let i = 1; i < path.length; i++) {
    const a = c(path[i - 1]!);
    const b = i === path.length - 1 ? base : c(path[i]!);
    ribbon(g, a, b, Math.max(h(path[i - 1]!), h(path[i]!)), w);
    if (i > 0 && i < path.length - 1) disc(g, b[0], b[1], h(path[i]!), w / 2);
  }
  disc(g, ...c(path[0]!), h(path[0]!), w / 2);
  // the head: a triangle from the base to the tip
  const tip: [number, number] = [end[0] + (ux / len) * tipOut, end[1] + (uy / len) * tipOut];
  const nx = (-uy / len) * (head / 2);
  const ny = (ux / len) * (head / 2);
  const hh = h(last);
  const k = g.p.length / 3;
  g.p.push(base[0] + nx, hh, -(base[1] + ny), tip[0], hh, -tip[1], base[0] - nx, hh, -(base[1] - ny));
  g.idx.push(k, k + 1, k + 2);
}

/**
 * Grid marks of one tile (story 13.1). `subtle`: the quarter of a cross at each corner (arms of `arm` along both sides), each
 * tile drawing only the half of the stroke that lies on it, so neighbours meet in whole crosses at their own height;
 * `strong`: the half strokes along all four sides.
 */
export function gridTile(g: Geo, t: Pos, h: number, level: 'subtle' | 'strong', w: number, arm: number): void {
  const x0 = t[0];
  const x1 = t[0] + 1;
  const n = -t[1];
  const s = -t[1] - 1;
  const hw = w / 2;
  if (level === 'strong') {
    quad(g, h, [x0, n], [x1, n], [x1, n - hw], [x0, n - hw]);
    quad(g, h, [x0, s + hw], [x1, s + hw], [x1, s], [x0, s]);
    quad(g, h, [x0, n - hw], [x0 + hw, n - hw], [x0 + hw, s + hw], [x0, s + hw]);
    quad(g, h, [x1 - hw, n - hw], [x1, n - hw], [x1, s + hw], [x1 - hw, s + hw]);
    return;
  }
  for (const [cx, cz, sx, sz] of [[x0, n, 1, -1], [x1, n, -1, -1], [x0, s, 1, 1], [x1, s, -1, 1]] as const) {
    // along x from the corner, half width into the tile
    quad(g, h, [cx, cz], [cx + sx * arm, cz], [cx + sx * arm, cz + sz * hw], [cx, cz + sz * hw]);
    // along z, starting past the first arm's stroke
    quad(g, h, [cx, cz + sz * hw], [cx + sx * hw, cz + sz * hw], [cx + sx * hw, cz + sz * arm], [cx, cz + sz * arm]);
  }
}
