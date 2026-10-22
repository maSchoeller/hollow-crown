import type { GameData } from '../core/defs';
import { TILE, type TileAssets } from './assets';

/** Ground layers bottom → top (art/tiles/README.md). */
export const GROUND_ORDER = ['river', 'shallows', 'plain', 'sand', 'road', 'grass', 'ash', 'wall'];
const PRIO: Record<string, number> = Object.fromEntries(GROUND_ORDER.map((g, i) => [g, i]));

function hash(x: number, y: number, z: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Terrain → ground id, honouring burning tiles that remember their former terrain. */
export function groundGrid(data: GameData, terrain: string[], width: number, height: number, revert: Record<string, string>): string[][] {
  const out: string[][] = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      let t = terrain[y * width + x]!;
      if (t === 'burning' && revert[`${x},${y}`]) t = revert[`${x},${y}`]!;
      row.push(data.terrain[t]?.ground ?? 'plain');
    }
    out.push(row);
  }
  return out;
}

/** Tile objects drawn flat into the ground (bridges, throne, gates, rock walls, fort bases). */
export function groundObjects(data: GameData, terrain: string[], width: number, height: number): Array<{ x: number; y: number; id: string }> {
  const out: Array<{ x: number; y: number; id: string }> = [];
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= width || y >= height ? 'wall' : terrain[y * width + x]!);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const t = at(x, y);
      if (t === 'bridge') {
        const vertical = at(x, y - 1) !== 'river' || at(x, y + 1) !== 'river';
        out.push({ x, y, id: vertical ? 'bridge_v' : 'bridge_h' });
      } else if (t === 'fort') out.push({ x, y, id: 'fort_base' });
      else if (t === 'throne') out.push({ x, y, id: 'throne' });
      else if (t === 'gate') out.push({ x, y, id: 'gate_open' });
      else if (t === 'door') out.push({ x, y, id: 'door_closed' });
      else if (t === 'door_open') out.push({ x, y, id: 'door_open' });
      else if (t === 'rockwall') out.push({ x, y, id: 'rockwall' });
      else if (t === 'mountain') out.push({ x, y, id: 'cliff' });
    }
  return out;
}

/**
 * Composes the ground of a map into one canvas per water animation frame (dual-grid, art/README.md).
 * Decals are placed deterministically from the map id.
 */
export function composeGround(
  tiles: TileAssets,
  grid: string[][],
  objects: Array<{ x: number; y: number; id: string }>,
  seed: number,
  decalFree: Set<string>,
): HTMLCanvasElement[] {
  const H = grid.length;
  const W = grid[0]!.length;
  const cell = (x: number, y: number) => grid[Math.min(Math.max(y, 0), H - 1)]![Math.min(Math.max(x, 0), W - 1)]!;
  const present = new Set(grid.flat());
  const prios = [...present].map((g) => PRIO[g] ?? 2);
  const lo = Math.min(...prios);
  const hi = Math.max(...prios);
  const animated = present.has('river') || present.has('shallows');
  const frames = animated ? 4 : 1;
  const out: HTMLCanvasElement[] = [];
  for (let f = 0; f < frames; f++) {
    const c = document.createElement('canvas');
    c.width = W * TILE;
    c.height = H * TILE;
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#1a1625';
    g.fillRect(0, 0, c.width, c.height);
    for (const layer of GROUND_ORDER.slice(lo, hi + 1)) {
      const p = PRIO[layer]!;
      const imgs = tiles.grounds[layer];
      if (!imgs?.length) continue;
      const img = imgs[f % imgs.length]!;
      const full = tiles.full[layer];
      const variants = full ? Math.max(1, Math.floor(full.width / TILE)) : 1;
      for (let dy = 0; dy <= H; dy++)
        for (let dx = 0; dx <= W; dx++) {
          const corners = [cell(dx - 1, dy - 1), cell(dx, dy - 1), cell(dx - 1, dy), cell(dx, dy)];
          let idx = 0;
          if (p === lo) idx = 15;
          else corners.forEach((cg, k) => ((PRIO[cg] ?? 2) >= p ? (idx |= 1 << k) : 0));
          if (idx === 0) continue;
          const px = dx * TILE - TILE / 2;
          const py = dy * TILE - TILE / 2;
          if (idx === 15 && full && variants > 1 && layer !== 'river' && layer !== 'shallows') {
            const v = hash(dx, dy, p) % variants;
            g.drawImage(full, v * TILE, 0, TILE, TILE, px, py, TILE, TILE);
          } else {
            g.drawImage(img, (idx % 4) * TILE, Math.floor(idx / 4) * TILE, TILE, TILE, px, py, TILE, TILE);
          }
        }
    }
    // decals (deterministic per map)
    if (tiles.decals) {
      const { image, allowed } = tiles.decals;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (decalFree.has(`${x},${y}`)) continue;
          const h = hash(x, y, seed);
          if (h % 100 >= 22) continue;
          const ground = grid[y]![x]!;
          const options = allowed.map((a, i) => (a.includes(ground) ? i : -1)).filter((i) => i >= 0);
          if (!options.length) continue;
          const d = options[(h >>> 8) % options.length]!;
          g.drawImage(image, d * TILE, 0, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
        }
    }
    if (tiles.objects) {
      for (const o of [...objects].sort((a, b) => a.y - b.y)) {
        const pos = tiles.objects.items[o.id];
        if (!pos) continue;
        g.drawImage(tiles.objects.image, pos[0] * TILE, pos[1] * TILE, TILE, TILE, o.x * TILE, o.y * TILE, TILE, TILE);
      }
    }
    out.push(c);
  }
  return out;
}
