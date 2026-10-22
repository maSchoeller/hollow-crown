/**
 * Asset loading for the board: manifest, sprite sheets, tiles, FX. Missing sprites fall back to
 * procedural placeholders in the final sheet format (concept/16 §12.1, `art:placeholder`).
 */
export const TILE = 48;

export interface SheetRow {
  name: string;
  frames: number;
  fps?: number;
  loop?: 'loop' | 'pingpong' | 'once' | string;
  hitFrame?: number;
}

export interface Sheet {
  id: string;
  image: HTMLCanvasElement | HTMLImageElement;
  normal?: HTMLCanvasElement | HTMLImageElement;
  cell: [number, number];
  anchor: [number, number];
  rows: SheetRow[];
  rowIndex: Record<string, number>;
  placeholder: boolean;
}

export interface Manifest {
  tileSize: number;
  tiles: string[];
  fx: boolean;
  units: Record<string, { cell: [number, number]; anchor: [number, number]; rows: SheetRow[]; normal?: boolean }>;
  props: Record<string, { cell: [number, number]; anchor: [number, number]; rows: SheetRow[]; normal?: boolean }>;
  portraits: Record<string, string[]>;
  backgrounds: string[];
  audio?: string[];
}

export interface FxInfo {
  image: HTMLImageElement | HTMLCanvasElement;
  cell: [number, number];
  anims: Record<string, { row: number; frames: number; fps: number; loop?: string }>;
}

export interface TileAssets {
  grounds: Record<string, Array<HTMLImageElement | HTMLCanvasElement>>; // frames
  full: Record<string, HTMLImageElement | undefined>;
  decals?: { image: HTMLImageElement; allowed: string[][] };
  objects?: { image: HTMLImageElement; items: Record<string, [number, number]> };
}

const BASE = import.meta.env.BASE_URL;
export const assetUrl = (p: string): string => `${BASE}assets/${p}`;

function loadImage(url: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

async function loadJson<T>(url: string): Promise<T | undefined> {
  try {
    const r = await fetch(url);
    if (!r.ok) return undefined;
    return (await r.json()) as T;
  } catch {
    return undefined;
  }
}

let manifestPromise: Promise<Manifest> | null = null;
export function loadManifest(): Promise<Manifest> {
  manifestPromise ??= loadJson<Manifest>(assetUrl('manifest.json')).then(
    (m) => m ?? { tileSize: TILE, tiles: [], fx: false, units: {}, props: {}, portraits: {}, backgrounds: [] },
  );
  return manifestPromise;
}

export const UNIT_ROWS: SheetRow[] = [
  { name: 'idle_s', frames: 4, fps: 6, loop: 'pingpong' },
  { name: 'walk_s', frames: 4, fps: 10, loop: 'loop' },
  { name: 'walk_n', frames: 4, fps: 10, loop: 'loop' },
  { name: 'walk_e', frames: 4, fps: 10, loop: 'loop' },
  { name: 'attack_s', frames: 6, fps: 12, loop: 'once', hitFrame: 3 },
  { name: 'attack_n', frames: 6, fps: 12, loop: 'once', hitFrame: 3 },
  { name: 'attack_e', frames: 6, fps: 12, loop: 'once', hitFrame: 3 },
  { name: 'hit_s', frames: 2, fps: 12, loop: 'once' },
  { name: 'downed_s', frames: 1 },
];

function rowIndex(rows: SheetRow[]): Record<string, number> {
  return Object.fromEntries(rows.map((r, i) => [r.name, i]));
}

const sheetCache = new Map<string, Promise<Sheet>>();

export function loadUnitSheet(id: string, hint: { classId: string; weapon?: string }): Promise<Sheet> {
  const key = `unit:${id}`;
  let p = sheetCache.get(key);
  if (!p) {
    p = (async () => {
      const m = await loadManifest();
      const meta = m.units[id];
      if (meta) {
        const [image, normal] = await Promise.all([
          loadImage(assetUrl(`sprites/units/${id}/sheet.png`)),
          meta.normal ? loadImage(assetUrl(`sprites/units/${id}/normal.png`)) : Promise.resolve(undefined),
        ]);
        if (image) return { id, image, normal, cell: meta.cell, anchor: meta.anchor, rows: meta.rows, rowIndex: rowIndex(meta.rows), placeholder: false };
      }
      return placeholderUnit(id, hint.classId, hint.weapon);
    })();
    sheetCache.set(key, p);
  }
  return p;
}

export function loadPropSheet(id: string): Promise<Sheet> {
  const key = `prop:${id}`;
  let p = sheetCache.get(key);
  if (!p) {
    p = (async () => {
      const m = await loadManifest();
      const meta = m.props[id];
      if (meta) {
        const [image, normal] = await Promise.all([
          loadImage(assetUrl(`sprites/props/${id}/sheet.png`)),
          meta.normal ? loadImage(assetUrl(`sprites/props/${id}/normal.png`)) : Promise.resolve(undefined),
        ]);
        if (image) return { id, image, normal, cell: meta.cell, anchor: meta.anchor, rows: meta.rows, rowIndex: rowIndex(meta.rows), placeholder: false };
      }
      return placeholderProp(id);
    })();
    sheetCache.set(key, p);
  }
  return p;
}

const GROUNDS = ['river', 'shallows', 'plain', 'sand', 'road', 'grass', 'ash', 'wall'];
let tilePromise: Promise<TileAssets> | null = null;
export function loadTiles(): Promise<TileAssets> {
  tilePromise ??= (async () => {
    const grounds: TileAssets['grounds'] = {};
    const full: TileAssets['full'] = {};
    await Promise.all(
      GROUNDS.map(async (g) => {
        const animated = g === 'river' || g === 'shallows';
        const frames = animated
          ? await Promise.all([0, 1, 2, 3].map((i) => loadImage(assetUrl(`tiles/${g}_${i}.png`))))
          : [await loadImage(assetUrl(`tiles/${g}.png`))];
        const ok = frames.filter((f): f is HTMLImageElement => !!f);
        grounds[g] = ok.length ? ok : [placeholderGround(g)];
        full[g] = await loadImage(assetUrl(`tiles/${g}_full.png`));
      }),
    );
    const [decalImg, decalMeta, objImg, objMeta] = await Promise.all([
      loadImage(assetUrl('tiles/decals.png')),
      loadJson<{ allowed?: string[][]; ground?: string[] }>(assetUrl('tiles/decals.json')),
      loadImage(assetUrl('tiles/objects.png')),
      loadJson<{ items: Record<string, [number, number]> }>(assetUrl('tiles/objects.json')),
    ]);
    return {
      grounds,
      full,
      decals: decalImg && decalMeta ? { image: decalImg, allowed: decalMeta.allowed ?? (decalMeta.ground ?? []).map((g) => [g]) } : undefined,
      objects: objImg && objMeta ? { image: objImg, items: objMeta.items } : undefined,
    };
  })();
  return tilePromise;
}

let fxPromise: Promise<FxInfo | undefined> | null = null;
export function loadFx(): Promise<FxInfo | undefined> {
  fxPromise ??= (async () => {
    const [img, meta] = await Promise.all([
      loadImage(assetUrl('fx/fx.png')),
      loadJson<{ cell: [number, number]; anims: FxInfo['anims'] }>(assetUrl('fx/fx.json')),
    ]);
    if (!img || !meta) return undefined;
    return { image: img, cell: meta.cell, anims: meta.anims };
  })();
  return fxPromise;
}

// ---------------------------------------------------------------------------------------------
// Placeholders (final format: 72×72 cells, anchor [36,63], magenta team key ramp)

const KEY = ['#400040', '#800080', '#C000C0', '#FF00FF'];
function hashColor(s: string, palette: string[]): string {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palette[h % palette.length]!;
}
const HAIR = ['#4f3426', '#2d1e1a', '#d1aa4f', '#9a3a24', '#e8e2d6', '#6e6a78'];
const CLOTH: Record<string, string> = {
  tactician: '#2a52b0', captain: '#6e6a78', mercenary: '#5a3a8e', soldier: '#a8916a', fighter: '#7a5236',
  archer: '#2f5e33', mage: '#a3172e', cleric: '#e8e2d6', brigand: '#6b5a44', knight: '#8995a8',
};

function placeholderUnit(id: string, classId: string, weapon?: string): Sheet {
  const cell: [number, number] = [72, 72];
  const anchor: [number, number] = [36, 63];
  const cols = Math.max(...UNIT_ROWS.map((r) => r.frames));
  const c = document.createElement('canvas');
  c.width = cols * cell[0];
  c.height = UNIT_ROWS.length * cell[1];
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const cloth = CLOTH[classId] ?? '#6e6a78';
  const hair = hashColor(id, HAIR);
  UNIT_ROWS.forEach((row, r) => {
    for (let f = 0; f < row.frames; f++) {
      const ox = f * cell[0];
      const oy = r * cell[1];
      const bob = row.name.startsWith('idle') ? (f % 2) : row.name.startsWith('walk') ? (f % 2 === 0 ? 0 : -1) : 0;
      const lunge = row.name.startsWith('attack') ? [0, -2, -3, 6, 4, 1][f] ?? 0 : 0;
      const down = row.name === 'downed_s';
      const fx = ox + anchor[0] + (row.name === 'attack_e' ? lunge : 0);
      const fy = oy + anchor[1] + (row.name === 'attack_s' ? lunge / 2 : row.name === 'attack_n' ? -lunge / 2 : 0);
      if (down) {
        g.fillStyle = '#2e2a3b';
        g.fillRect(fx - 14, fy - 7, 28, 7);
        g.fillStyle = cloth;
        g.fillRect(fx - 13, fy - 6, 18, 5);
        g.fillStyle = '#d89a74';
        g.fillRect(fx + 5, fy - 7, 7, 6);
        continue;
      }
      const top = fy - 38 + bob;
      // outline body
      g.fillStyle = '#1a1625';
      g.fillRect(fx - 10, top + 14, 20, 24);
      g.fillRect(fx - 8, top - 1, 16, 16);
      // legs
      g.fillStyle = '#3b2420';
      g.fillRect(fx - 8, top + 30, 6, 7);
      g.fillRect(fx + 2, top + 30, 6, 7);
      // body
      g.fillStyle = cloth;
      g.fillRect(fx - 9, top + 15, 18, 16);
      // team sash (key ramp)
      for (let i = 0; i < 4; i++) {
        g.fillStyle = KEY[[1, 2, 2, 1][i]!]!;
        g.fillRect(fx - 8 + i * 4, top + 19 + i, 4, 3);
      }
      // head
      g.fillStyle = '#d89a74';
      g.fillRect(fx - 7, top + 2, 14, 12);
      g.fillStyle = hair;
      g.fillRect(fx - 7, top, 14, 5);
      g.fillRect(fx - 7, top, 3, 9);
      if (!row.name.endsWith('_n')) {
        g.fillStyle = '#1a1625';
        g.fillRect(fx - 4, top + 7, 2, 3);
        g.fillRect(fx + 2, top + 7, 2, 3);
      } else {
        g.fillStyle = hair;
        g.fillRect(fx - 7, top, 14, 12);
      }
      // weapon
      g.fillStyle = weapon === 'staff' || weapon === 'anima' || weapon === 'light' ? '#c9a24a' : '#e8eef5';
      const wx = fx + 10 + (row.name.startsWith('attack') ? lunge : 0);
      if (weapon === 'bow') {
        g.fillStyle = '#7a5236';
        g.fillRect(wx, top + 8, 2, 22);
      } else if (weapon === 'anima' || weapon === 'light') {
        g.fillRect(wx - 2, top + 18, 7, 8);
      } else {
        g.fillRect(wx, top + (weapon === 'lance' ? -6 : 8), 3, weapon === 'lance' ? 38 : 20);
      }
    }
  });
  return { id, image: c, cell, anchor, rows: UNIT_ROWS, rowIndex: rowIndex(UNIT_ROWS), placeholder: true };
}

function placeholderProp(id: string): Sheet {
  const cell: [number, number] = [72, 72];
  const anchor: [number, number] = [36, 63];
  const states = id === 'house' ? ['intact', 'visited', 'razed'] : id === 'chest' ? ['closed', 'open'] : ['a'];
  const c = document.createElement('canvas');
  c.width = cell[0];
  c.height = cell[1] * states.length;
  const g = c.getContext('2d')!;
  states.forEach((st, r) => {
    const fx = anchor[0];
    const fy = r * cell[1] + anchor[1];
    const px = (col: string, x: number, y: number, w: number, h: number) => {
      g.fillStyle = col;
      g.fillRect(fx + x, fy + y, w, h);
    };
    switch (id) {
      case 'tree':
        px('#3b2420', -3, -14, 6, 14);
        px('#1f3a2c', -17, -46, 34, 34);
        px('#2f5e33', -15, -44, 30, 28);
        px('#4f8a3a', -11, -42, 18, 14);
        px('#8bbb4a', -7, -40, 6, 4);
        break;
      case 'rock':
        px('#2b3242', -20, -30, 40, 30);
        px('#4f5b70', -18, -28, 36, 26);
        px('#8995a8', -14, -26, 16, 10);
        px('#d3dae4', -10, -25, 6, 3);
        break;
      case 'house':
        px('#3b2420', -20, -38, 40, 38);
        px(st === 'razed' ? '#4a4656' : '#e8e2d6', -18, -24, 36, 22);
        px(st === 'razed' ? '#2e2a3b' : '#9a3a24', -21, -40, 42, 18);
        if (st !== 'razed') px(st === 'visited' ? '#16285a' : '#6a4130', -4, -14, 8, 12);
        break;
      case 'fort':
        px('#2e2a3b', -18, -50, 36, 50);
        px('#a39fa6', -16, -48, 32, 46);
        px('#6e6a78', -16, -48, 32, 6);
        px('#E8743B', 2, -64, 10, 7);
        px('#3b2420', 0, -64, 2, 18);
        px('#1a1625', -4, -12, 8, 10);
        break;
      case 'wagon':
        px('#3b2420', -22, -30, 44, 24);
        px('#c79a68', -20, -40, 40, 18);
        px('#e8e2d6', -18, -42, 36, 14);
        px('#2d1e1a', -18, -8, 8, 8);
        px('#2d1e1a', 10, -8, 8, 8);
        break;
      case 'shrine':
        px('#4a4656', -18, -10, 36, 10);
        px('#e8e2d6', -14, -44, 28, 36);
        px('#a8e4f5', -6, -36, 12, 12);
        px('#d3dae4', -18, -48, 36, 6);
        break;
      case 'ruins':
        px('#4a4656', -18, -18, 12, 18);
        px('#6e6a78', 4, -12, 14, 12);
        px('#a39fa6', -16, -16, 8, 4);
        break;
      case 'chest':
        px('#2d1e1a', -10, -14, 20, 14);
        px(st === 'open' ? '#4f3426' : '#9a6a45', -9, -13, 18, 12);
        px('#c9a24a', -2, -9, 4, 4);
        break;
      default:
        px('#ff00ff', -8, -8, 16, 8);
    }
  });
  const rows = states.map((s) => ({ name: s, frames: 1 }));
  return { id, image: c, cell, anchor, rows, rowIndex: rowIndex(rows), placeholder: true };
}

function placeholderGround(g: string): HTMLCanvasElement {
  const colors: Record<string, string> = {
    river: '#2f5f9e', shallows: '#4aa8e8', plain: '#a0644e', sand: '#d1aa4f', road: '#9a6a45', grass: '#4f8a3a', ash: '#4a4656', wall: '#6e6a78',
  };
  const c = document.createElement('canvas');
  c.width = c.height = TILE * 4;
  const x = c.getContext('2d')!;
  x.fillStyle = colors[g] ?? '#ff00ff';
  for (let i = 0; i < 16; i++) {
    const tx = (i % 4) * TILE;
    const ty = Math.floor(i / 4) * TILE;
    const h = TILE / 2;
    if (i & 1) x.fillRect(tx, ty, h, h);
    if (i & 2) x.fillRect(tx + h, ty, h, h);
    if (i & 4) x.fillRect(tx, ty + h, h, h);
    if (i & 8) x.fillRect(tx + h, ty + h, h, h);
  }
  return c;
}
