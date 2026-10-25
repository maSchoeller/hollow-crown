/**
 * Asset loading for the board: manifest, sprite sheets, FX (models: models.ts, ground: terrain3d.ts). Missing sprites fall back to
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
  fx: boolean;
  units: Record<string, { cell: [number, number]; anchor: [number, number]; rows: SheetRow[]; normal?: boolean }>;
  /** 3D models (tools/art/export_models.py): unit ids (`unitPacks`: the pack each ships in, tools/art/model_packs.py) and prop states per prop id */
  models?: { units: string[]; unitPacks?: Record<string, string>; props: Record<string, string[]>; weapons?: string[] };
  /** painted ground textures of the 3D board (tools/art/ground.py) */
  ground?: string[];
  /** stems of the scene half figures (`halves/<stem>.webp`, mood variants `<id>_<mood>`) */
  halves?: string[];
  audio?: string[];
}

export interface FxInfo {
  image: HTMLImageElement | HTMLCanvasElement;
  cell: [number, number];
  anims: Record<string, { row: number; frames: number; fps: number; loop?: string }>;
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
    (m) => m ?? { tileSize: TILE, fx: false, units: {} },
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
  tactician: '#2a52b0', captain: '#6e6a78', skirmisher: '#5a3a8e', vanguard: '#a8916a', scout: '#7a5236',
  marksman: '#2f5e33', elementalist: '#a3172e', healer: '#e8e2d6', minstrel: '#c7a035', brigand: '#6b5a44', knight: '#8995a8',
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
