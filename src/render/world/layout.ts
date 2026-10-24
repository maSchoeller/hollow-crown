/**
 * The world map as data (story 5.2): tiles and regions from content/world/valmora.yaml, the dragon signs of the acts
 * reached, the fog over later acts and which miniature each place shows. Pure; the scene (world.ts) and tests use it.
 */
import type { ConditionContext, Pos, WorldDef, WorldLocation } from '../../core';
import { evalConditions, gridRows } from '../../core';
import type { TerrainSource } from '../shared/terrain3d';

export interface WorldLayout extends TerrainSource {
  /** region id per tile (row-major), null for the sea */
  region: Array<string | null>;
  /** tiles under fog (regions of later acts), row-major */
  fog: boolean[];
}

/** Tiles of the world for the act being played: legend → terrain ids, ash of the dragon signs of reached acts. */
export function worldLayout(world: WorldDef, act: number): WorldLayout {
  const rows = gridRows(world.tiles);
  const regionRows = gridRows(world.regionGrid);
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const byChar = new Map(world.regions.map((r) => [r.char, r]));
  const terrain: string[] = [];
  const region: Array<string | null> = [];
  const fog: boolean[] = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      terrain.push(world.legend[rows[y]![x]!] ?? 'grass');
      const r = byChar.get(regionRows[y]?.[x] ?? '.');
      region.push(r?.id ?? null);
      fog.push(!!r && r.act > act);
    }
  // ash lies on open ground only: roads, water, woods and settlements keep their look
  for (const sign of world.signs)
    if (sign.act <= act && sign.kind === 'ash')
      for (const [ax, ay, w, h] of sign.areas)
        for (let y = ay; y < ay + h; y++)
          for (let x = ax; x < ax + w; x++) {
            const i = y * width + x;
            if (x >= 0 && y >= 0 && x < width && y < height && (terrain[i] === 'grass' || terrain[i] === 'plain')) terrain[i] = 'ash';
          }
  return { width, height, terrain, timers: {}, region, fog };
}

/** The miniature a place shows: the first variant whose conditions hold, else its own model. */
export function locationModel(loc: WorldLocation, ctx: ConditionContext): string {
  return loc.variants.find((v) => evalConditions(ctx, v.requires))?.model ?? loc.model;
}

/** Where to write the name of each fogged region: the middle of its fogged tiles (tile units, centre of a tile = +0.5). */
export function fogLabels(world: WorldDef, layout: WorldLayout): Array<{ id: string; at: [number, number] }> {
  const sums = new Map<string, { x: number; y: number; n: number }>();
  layout.fog.forEach((f, i) => {
    const id = layout.region[i];
    if (!f || !id) return;
    const s = sums.get(id) ?? { x: 0, y: 0, n: 0 };
    s.x += (i % layout.width) + 0.5;
    s.y += Math.floor(i / layout.width) + 0.5;
    s.n++;
    sums.set(id, s);
  });
  return world.regions.filter((r) => sums.has(r.id)).map((r) => {
    const s = sums.get(r.id)!;
    return { id: r.id, at: [s.x / s.n, s.y / s.n] };
  });
}

/**
 * Fog density at each tile corner, (width + 1) × (height + 1) row-major: the share of the four tiles around the corner
 * that lie under fog, so the fog fades out over one tile at its edge.
 */
export function fogCorners(layout: WorldLayout): number[] {
  const { width: w, height: h, fog } = layout;
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h && fog[y * w + x] ? 1 : 0);
  const out: number[] = [];
  for (let y = 0; y <= h; y++) for (let x = 0; x <= w; x++) out.push((at(x - 1, y - 1) + at(x, y - 1) + at(x - 1, y) + at(x, y)) / 4);
  return out;
}

/** The place of a campaign node, or of the home. */
export function locationOf(world: WorldDef, key: { node: string } | { home: string }): WorldLocation | undefined {
  return world.locations.find((l) => ('node' in key ? l.node === key.node : l.home === key.home));
}

/** Centre of a tile in tile units. */
export const tileCentre = (p: Pos): [number, number] => [p[0] + 0.5, p[1] + 0.5];

/** Heights of the Blender terrain (public/assets/world/valmora_heights.json): `res` samples per tile over map + skirt. */
export interface HeightField {
  res: number;
  skirt: number;
  /** samples per row and rows */
  w: number;
  h: number;
  water: number;
  data: number[];
}

/** Bilinear height at tile point (x, y) of the map (x east, y south, a tile's centre = +0.5); outside: the edge value. */
export function heightSampler(f: HeightField): (x: number, y: number) => number {
  return (x, y) => {
    const gx = Math.min(f.w - 1, Math.max(0, (x + f.skirt) * f.res));
    const gy = Math.min(f.h - 1, Math.max(0, (y + f.skirt) * f.res));
    const x0 = Math.min(f.w - 2, Math.floor(gx));
    const y0 = Math.min(f.h - 2, Math.floor(gy));
    const tx = gx - x0;
    const ty = gy - y0;
    const at = (i: number, j: number) => f.data[j * f.w + i]!;
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
    const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
    return top + (bottom - top) * ty;
  };
}
