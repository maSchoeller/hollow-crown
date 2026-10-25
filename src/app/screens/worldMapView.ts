/**
 * View maths of the flat world map (story 5.2): the painted picture lies under the screen at scale `s` (screen px per
 * picture px) with its top-left corner at (x, y); places are percentages of the picture. Pure, so it is unit tested.
 */
import type { WorldDef, WorldPlace } from '../../core';

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

/** Percent of the height down to which the fog of the regions after `act` reaches, or null when nothing lies under fog. */
export function fogTop(world: WorldDef, act: number): number | null {
  const edges = world.fog.filter((e) => e.act > act).map((e) => e.y);
  return edges.length ? Math.max(...edges) : null;
}

/** The place of a campaign node, or of the home. */
export function placeOf(world: WorldDef, key: { node: string } | { home: true }): WorldPlace | undefined {
  return world.places.find((p) => ('node' in key ? p.node === key.node : p.kind === 'home'));
}
