/**
 * View maths of the flat world map (stories 5.2, 15.7 and 15.12): the painted picture lies under the screen at scale `s` (screen px
 * per picture px) with its top-left corner at (x, y); places are percentages of the picture. Which stone stands at a place,
 * the fog areas and their soft mask, the picture level to load and the town picture of a place are worked out here too. Pure, so it is unit tested.
 */
import { evalConditions, type ConditionContext, type HomeKind, type WorldDef, type WorldPlace, type WorldRoadKind } from '../../core';

export type Size = readonly [number, number];
export interface Screen {
  w: number;
  h: number;
}
/** Where the picture lies: screen offset of its top-left corner and the scale. */
export interface MapView {
  x: number;
  y: number;
  s: number;
}

/** How far the picture may be pushed past its top and bottom edge, so places at the edge can come out from under the HUD (px). */
export interface Pad {
  top: number;
  bottom: number;
}
const NO_PAD: Pad = { top: 0, bottom: 0 };

/** Scale at which the picture just covers the screen. */
export const coverScale = (scr: Screen, size: Size): number => Math.max(scr.w / size[0], scr.h / size[1]);

/** Scale of a zoom step: the picture is `zoomSteps[step]` screen widths wide (but never smaller than the cover scale). */
export function stepScale(scr: Screen, size: Size, zoomSteps: readonly number[], step: number, focus = 1): number {
  const i = Math.min(zoomSteps.length - 1, Math.max(0, step));
  return Math.max(coverScale(scr, size), (scr.w * zoomSteps[i]!) / size[0]) * focus;
}

/** The view pushed back so the picture covers the screen (up to `pad` at the top and bottom). */
export function clampView(v: MapView, scr: Screen, size: Size, pad: Pad = NO_PAD): MapView {
  const s = Math.max(v.s, coverScale(scr, size));
  return {
    s,
    x: Math.min(0, Math.max(scr.w - size[0] * s, v.x)),
    y: Math.min(pad.top, Math.max(scr.h - pad.bottom - size[1] * s, v.y)),
  };
}

/** Screen position of a place (percent of the picture). */
export const screenOf = (v: MapView, size: Size, at: readonly [number, number]): [number, number] => [v.x + (at[0] / 100) * size[0] * v.s, v.y + (at[1] / 100) * size[1] * v.s];

/** The view at scale `s` that puts `at` on the screen point (`rest[0]` of the width, `rest[1]` of the height). */
export function focusView(scr: Screen, size: Size, s: number, at: readonly [number, number], rest: readonly [number, number], pad: Pad = NO_PAD): MapView {
  return clampView({ s, x: scr.w * rest[0] - (at[0] / 100) * size[0] * s, y: scr.h * rest[1] - (at[1] / 100) * size[1] * s }, scr, size, pad);
}

/** The view at scale `s2` that keeps the screen point `anchor` over the same spot of the picture. */
export function zoomAround(v: MapView, scr: Screen, size: Size, s2: number, anchor: readonly [number, number], pad: Pad = NO_PAD): MapView {
  const k = Math.max(s2, coverScale(scr, size)) / v.s;
  return clampView({ s: v.s * k, x: anchor[0] - (anchor[0] - v.x) * k, y: anchor[1] - (anchor[1] - v.y) * k }, scr, size, pad);
}

/** The fog: the areas of every region whose act lies after `act` (polygons in percent of the picture). */
export function fogAreas(world: WorldDef, act: number): Array<Array<[number, number]>> {
  return world.regions.filter((r) => r.act > act).flatMap((r) => r.areas);
}

/**
 * Fog patches over the places of the running act that hold no playable mission yet (story 11.3: act 2 goes live mission by
 * mission, unfinished places stay under fog). Only from act 2: act 1 is complete and keeps its look. A place with slots counts
 * as known when one of its nodes shows a stone (open or done); `radius` is in percent of the width (the map is square).
 */
export function veilAreas(world: WorldDef, act: number, known: ReadonlySet<string>, veil: { radius: number; corners: number }): Array<Array<[number, number]>> {
  if (act < 2) return [];
  return world.places
    .filter((p) => p.act === act && p.slots.length > 0 && !known.has(p.id))
    .map((p) =>
      Array.from({ length: veil.corners }, (_, i): [number, number] => {
        const a = (i / veil.corners) * 2 * Math.PI;
        return [p.at[0] + veil.radius * Math.cos(a), p.at[1] + veil.radius * Math.sin(a)];
      }),
    );
}

/** A drawn path between two places: its ends (percent), its kind and whether it leads to a place without an unlocked stone. */
export interface Road {
  key: string;
  a: [number, number];
  b: [number, number];
  kind: WorldRoadKind;
  dim: boolean;
}

/**
 * The paths to draw (story 15.12): the road network of the world, without roads into the fog of a later act. A road is full
 * when both its places hold a stone that is open or done (`known`), otherwise it is drawn dimmed. The flight of the prologue
 * (kind `escape`) shows always, through the fog too, and never dimmed; where it runs along a road, only the flight is drawn.
 */
export function roadsOf(world: WorldDef, act: number, known: ReadonlySet<string>): Road[] {
  const place = new Map(world.places.map((p) => [p.id, p]));
  const pair = (a: string, b: string) => [a, b].sort().join('|');
  const flight = new Set(world.roads.filter((r) => r[2] === 'escape').map(([a, b]) => pair(a, b)));
  const out: Road[] = [];
  for (const [a, b, kind = 'road'] of world.roads) {
    const pa = place.get(a);
    const pb = place.get(b);
    if (!pa || !pb || (kind === 'road' && flight.has(pair(a, b)))) continue;
    if (kind === 'escape') {
      out.push({ key: `${kind}:${a}|${b}`, a: pa.at, b: pb.at, kind, dim: false });
      continue;
    }
    if (pa.act > act || pb.act > act) continue;
    out.push({ key: `${kind}:${a}|${b}`, a: pa.at, b: pb.at, kind, dim: !known.has(a) || !known.has(b) });
  }
  return out;
}

/** The place whose slot holds a campaign node. */
export function placeOf(world: WorldDef, node: string): WorldPlace | undefined {
  return world.places.find((p) => p.slots.some((s) => s.node === node));
}

/** The label of a node's slot (P, 1-1, N1), or null for a node without a place. */
export function labelOf(world: WorldDef, node: string): string | null {
  for (const p of world.places) for (const s of p.slots) if (s.node === node) return s.label;
  return null;
}

/** Tip of the home stone for the current kind of home. */
export const homeAt = (world: WorldDef, kind: HomeKind): [number, number] => world.home[kind];

/** A stone on the map: the node it opens, where it points, and its place in a fan of open stones at the same place. */
export interface Stone {
  node: string;
  at: [number, number];
  done: boolean;
  /** offset in the fan: 0 alone, otherwise −(n−1)/2 … (n−1)/2 */
  fan: number;
}

/**
 * The stones of the shown nodes: one per place. A place with open nodes shows those (fanned out side by side); otherwise the
 * node completed last. A node without a place stands on the home stone, so it never disappears (fallback).
 */
export function stonesOf(world: WorldDef, shown: readonly string[], open: readonly string[], completed: readonly string[], home: [number, number]): Stone[] {
  const groups = new Map<string, { at: [number, number]; nodes: string[] }>();
  for (const id of shown) {
    const p = placeOf(world, id);
    const key = p ? p.id : '';
    const g = groups.get(key) ?? { at: p ? p.at : home, nodes: [] };
    g.nodes.push(id);
    groups.set(key, g);
  }
  const stones: Stone[] = [];
  for (const g of groups.values()) {
    const opened = g.nodes.filter((n) => open.includes(n));
    const last = [...g.nodes].sort((a, b) => completed.indexOf(b) - completed.indexOf(a))[0]!;
    const pick = opened.length ? opened : [last];
    pick.forEach((node, i) => stones.push({ node, at: g.at, done: completed.includes(node) && !open.includes(node), fan: i - (pick.length - 1) / 2 }));
  }
  return stones;
}

/**
 * The town picture of a place: the first variant whose conditions hold, otherwise the base picture named like the place.
 * A picture in `missing` (it failed to load) is skipped, so a missing variant falls back to the base picture; null when the
 * base picture is missing too (the plateau then shows a place sign). `'none'` when nothing is to be drawn: the place has no
 * base picture of its own (`site.base: false`, the painted map shows it; story 11.3) and no variant holds.
 */
export function siteImage(place: WorldPlace, ctx: ConditionContext, missing: readonly string[] = []): string | null | 'none' {
  const variant = place.site?.variants?.find((v) => evalConditions(ctx, v.requires))?.image;
  if (variant && !missing.includes(variant)) return variant;
  if (place.site?.base === false) return 'none';
  return missing.includes(place.id) ? null : place.id;
}

/** Whether a point (percent of the picture) lies inside a polygon (even-odd rule). */
function inside(x: number, y: number, poly: ReadonlyArray<readonly [number, number]>): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** One pass of a box blur of radius `r` along the rows (`x`) or the columns (`y`), clamped at the picture edge. */
function boxBlur(src: Float32Array, n: number, r: number, along: 'x' | 'y'): Float32Array {
  const out = new Float32Array(n * n);
  const at = (line: number, k: number) => src[along === 'x' ? line * n + k : k * n + line]!;
  for (let line = 0; line < n; line++) {
    for (let k = 0; k < n; k++) {
      let sum = 0;
      for (let d = -r; d <= r; d++) sum += at(line, Math.min(n - 1, Math.max(0, k + d)));
      out[along === 'x' ? line * n + k : k * n + line] = sum / (2 * r + 1);
    }
  }
  return out;
}

/**
 * The fog of later acts as a small square alpha mask (story 15.12): `n` × `n` cells over the picture, 1 inside an area, softened
 * by two box blur passes of radius `blur` (close to a Gaussian). The edge is clamped, so fog that touches the picture border stays
 * dense there. Drawn once per act into a small canvas that is stretched over the map, instead of an SVG blur filter over the
 * whole picture, which the phone had to rasterise again and again.
 */
export function fogMask(areas: ReadonlyArray<ReadonlyArray<readonly [number, number]>>, n: number, blur: number): Float32Array {
  let m: Float32Array = new Float32Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const px = ((x + 0.5) / n) * 100;
      const py = ((y + 0.5) / n) * 100;
      if (areas.some((a) => inside(px, py, a))) m[y * n + x] = 1;
    }
  if (blur > 0) for (let pass = 0; pass < 2; pass++) m = boxBlur(boxBlur(m, n, blur, 'x'), n, blur, 'y');
  return m;
}

/**
 * Which resolution level of the picture to load (story 15.12): the smallest that is at least `needPx` wide (the picture width in
 * device pixels at the nearest zoom), else the largest.
 */
export function pickLevel(levels: readonly number[], needPx: number): number {
  return levels.find((w) => w >= needPx) ?? levels[levels.length - 1]!;
}

/**
 * The level for a screen: wide enough for the nearest zoom with the tap focus at the device's pixel density. One level per
 * visit, not one per zoom step: on a phone with DPR 3 already the overview step needs the full picture, and a second picture
 * would cost a decode and a swap in the middle of a zoom.
 */
export function levelFor(world: Pick<WorldDef, 'size' | 'levels'>, scr: Screen, zoom: { zoomSteps: readonly number[]; focusZoom: number }, dpr: number): number {
  const near = stepScale(scr, world.size, zoom.zoomSteps, zoom.zoomSteps.length - 1, zoom.focusZoom);
  return pickLevel(world.levels, world.size[0] * near * dpr);
}

/** What the map says while the overview and the sharp picture load: nothing once either shows, "missing" when both failed. */
export function mapNotice(overview: Loaded, sharp: Loaded): 'loading' | 'missing' | null {
  if (overview === 'ready' || sharp === 'ready') return null;
  return overview === 'failed' && sharp === 'failed' ? 'missing' : 'loading';
}
export type Loaded = 'loading' | 'ready' | 'failed';

/**
 * Whether the map should say "more missions follow": no node is open, the act is not finished, and no act pack is loading
 * (a loading pack explains the quiet map by itself).
 */
export const moreMissionsFollow = (openNodes: number, actFinished: boolean, packLoading: boolean): boolean => openNodes === 0 && !actFinished && !packLoading;
