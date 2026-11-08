/**
 * Level sheet (concept/27-ueberarbeitung/level-werkzeug.md): draws a map in game format as an SVG planning sheet – grid with
 * coordinates, terrain, deploy slots, units by type and level, lieutenants, objectives, places to visit, reinforcements, the
 * planning notes of `design:` (paths, phases, zones, marks), legend and a header with the key figures. Pure functions, no I/O.
 */
import type { z } from 'zod';
import type { mapSchema, mapUnitSchema } from '../../src/content/schemaMap';

export type LevelMap = z.infer<typeof mapSchema>;
type MapUnit = z.infer<typeof mapUnitSchema>;
type Pos = [number, number];
type Area = { rect: [number, number, number, number] } | { tiles: Pos[] };
type Team = MapUnit['team'];
type Difficulty = 'easy' | 'normal' | 'hard';

/** What the sheet looks up outside the map: display names and the ids that exist. */
export interface SheetContext {
  text: (key: string | undefined) => string | undefined;
  className: (id: string) => string;
  /** the class a lieutenant brings when the map leaves `class` out */
  lieutenantClass: (id: string) => string | undefined;
  /** headline above the map name, e.g. the campaign node title */
  title?: string;
}

const C = 30;
const GUTTER = 26;
const PAD = 16;
const MIN_W = 640;
const LINE = 17;

/** terrain look on the sheet: fill and glyph; the board itself is the art direction's business (§3.1) */
export const TERRAIN: Record<string, { fill: string; glyph?: string; dark?: boolean; name: string; level?: number }> = {
  plain: { fill: '#e6dcb8', name: 'Ebene' },
  grass: { fill: '#c3d99a', name: 'Gras' },
  road: { fill: '#d4b47c', name: 'Weg' },
  forest: { fill: '#6f9d58', glyph: '♣', dark: true, name: 'Wald' },
  sand: { fill: '#efe1a8', glyph: '∴', name: 'Sand' },
  mountain: { fill: '#9b8f82', glyph: '▲', dark: true, name: 'Gebirge' },
  shallows: { fill: '#a9d6e3', glyph: '≈', name: 'Furt' },
  river: { fill: '#4f92c4', glyph: '~', dark: true, name: 'Fluss' },
  bridge: { fill: '#9c7448', glyph: '=', dark: true, name: 'Brücke' },
  fort: { fill: '#b9ae9a', glyph: '⛫', name: 'Fort' },
  throne: { fill: '#d9b54a', glyph: '♛', name: 'Thron' },
  gate: { fill: '#8a7a68', glyph: '∏', dark: true, name: 'Tor' },
  village: { fill: '#e9b978', glyph: '⌂', name: 'Haus' },
  ruins: { fill: '#bdb09e', glyph: '⌗', name: 'Ruine' },
  wall: { fill: '#5d5650', dark: true, name: 'Mauer' },
  burning: { fill: '#ec8a4a', glyph: '♨', name: 'Brand' },
  ash: { fill: '#9a9590', name: 'Asche' },
  rockwall: { fill: '#776e66', glyph: '◆', dark: true, name: 'Felsnadel' },
  door: { fill: '#7f5733', glyph: '▯', dark: true, name: 'Tür' },
  door_open: { fill: '#b08a5c', glyph: '▭', name: 'Tür offen' },
  wagon: { fill: '#c9a46c', glyph: '▬', name: 'Wagen' },
  shrine: { fill: '#d9d2c2', glyph: '✚', name: 'Schrein' },
  relief: { fill: '#cfc8bb', glyph: '✦', name: 'Relief' },
  stall: { fill: '#dcae73', glyph: '⌂', name: 'Stand' },
  brazier: { fill: '#c9bfb0', glyph: '✶', name: 'Feuerschale' },
  well: { fill: '#c7b088', glyph: '◎', name: 'Brunnen' },
  field: { fill: '#e2c96e', glyph: '‖', name: 'Feld' },
  fence: { fill: '#c3d99a', glyph: '#', name: 'Zaun' },
  farm: { fill: '#c99a62', glyph: '■', name: 'Hof' },
  building: { fill: '#b5876a', glyph: '■', dark: true, name: 'Gebäude' },
  rampart: { fill: '#a8a095', glyph: '▤', name: 'Wehrgang', level: 1 },
  roof: { fill: '#c9775a', glyph: '⌂', dark: true, name: 'Dach', level: 1 },
  terrace: { fill: '#b4cc8e', name: 'Terrasse', level: 1 },
  tower_top: { fill: '#8f8779', glyph: '▣', dark: true, name: 'Turm', level: 2 },
  crag: { fill: '#a89f8f', glyph: '△', name: 'Felsnase', level: 2 },
  ramp: { fill: '#c6a26a', glyph: '◢', name: 'Rampe' },
  stairs: { fill: '#b89a70', glyph: '≡', name: 'Treppe' },
  ladder: { fill: '#9c6a3a', glyph: '☰', name: 'Leiter (an der Kante)' },
  gate_closed: { fill: '#6b5a48', glyph: '∏', dark: true, name: 'Tor zu' },
  lever: { fill: '#c9bfb0', glyph: '⍿', name: 'Hebel' },
  // story 11.10: every terrain of terrain.yaml has a look (tests/unit/level-sheet.test.ts)
  ballista: { fill: '#8c6a4a', glyph: '➶', dark: true, name: 'Balliste' },
  swamp: { fill: '#8fae8a', glyph: '≈', name: 'Sumpf' },
  creek: { fill: '#5d9cc8', glyph: '~', dark: true, name: 'Priel' },
  boardwalk: { fill: '#a98256', glyph: '=', dark: true, name: 'Steg' },
  footbridge: { fill: '#b68b5a', glyph: '≍', dark: true, name: 'Hängesteg' },
  vault: { fill: '#9d968c', name: 'Gewölbe' },
  sarcophagus: { fill: '#7d766d', glyph: '▭', dark: true, name: 'Sarkophag' },
  torch: { fill: '#a39a8c', glyph: '♆', name: 'Fackel' },
};

const COL = {
  ink: '#3b2a20',
  soft: '#7a6553',
  paper: '#fff8ec',
  paper2: '#f4e9d6',
  grid: 'rgba(59,42,32,0.22)',
  player: '#2f64c8',
  enemy: '#b83a2e',
  other: '#3fa65a',
  gold: '#d9a931',
  lieutenant: '#8a6a10',
  ember: '#e8743b',
  trigger: '#7a4cc2',
};
const TEAM_COLOR: Record<Team, string> = { player: COL.player, enemy: COL.enemy, other: COL.other };
const TEAM_NAME: Record<Team, string> = { player: 'eigene', enemy: 'Gegner', other: 'Dritte' };
const DIFF_SHORT: Record<Difficulty, string> = { easy: 'L', normal: 'N', hard: 'S' };
const AI_NAME: Record<string, string> = {
  aggressive: 'greift an',
  hold: 'hält',
  guard: 'bewacht',
  trigger: 'wartet',
  hunt: 'jagt',
  raider: 'plündert',
  flee: 'flieht',
  support: 'stützt',
  follow: 'folgt',
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (p: Pos) => `[${p[0]},${p[1]}]`;

/** Size class of the rework guardrails (roadmap: small up to ~16×20, medium around 20×25, large 30×40). */
export function sizeClass([w, h]: [number, number]): 'klein' | 'mittel' | 'groß' {
  const n = w * h;
  return n <= 360 ? 'klein' : n <= 800 ? 'mittel' : 'groß';
}

const tilesOf = (a: Area): Pos[] => {
  if ('tiles' in a) return a.tiles;
  const [x0, y0, x1, y1] = a.rect;
  const out: Pos[] = [];
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) out.push([x, y]);
  return out;
};

const appearsOn = (u: MapUnit, d: Difficulty) => !u.difficulty || u.difficulty.includes(d);

/** Enemy counts per difficulty, with the share of reinforcements (waves and trigger spawns). */
export function enemyCounts(map: LevelMap) {
  const spawned = [...map.reinforcements.flatMap((r) => r.units), ...map.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : [])))];
  const count = (list: MapUnit[], d: Difficulty) => list.filter((u) => u.team === 'enemy' && appearsOn(u, d)).length;
  const per = (d: Difficulty) => ({ start: count(map.units, d), later: count(spawned, d) });
  return { easy: per('easy'), normal: per('normal'), hard: per('hard') };
}

/** Wraps text to lines of at most `max` characters, at spaces. */
function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      if (line && line.length + 1 + word.length > max) {
        out.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    out.push(line);
  }
  return out;
}

/** Short class labels for the tokens, unique on one sheet: two letters of the display name. */
function classLabels(ids: string[], ctx: SheetContext): Map<string, string> {
  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const id of [...new Set(ids)].sort()) {
    const name = ctx.className(id).replace(/[^A-Za-zÄÖÜäöüß]/g, '') || id;
    let label = '';
    for (let i = 1; i < name.length && !label; i++) {
      const l = name[0]!.toUpperCase() + name[i]!.toLowerCase();
      if (!used.has(l)) label = l;
    }
    label ||= id.slice(0, 2);
    used.add(label);
    out.set(id, label);
  }
  return out;
}

export interface Sheet {
  svg: string;
  width: number;
  height: number;
  summary: { name: string; size: string; sizeClass: string; deploy: number; enemies: string; ratio: string; victory: string };
  /** prompt template for the mood picture (ChatGPT), derived from the map */
  moodPrompt: string;
}

export function renderSheet(map: LevelMap, ctx: SheetContext): Sheet {
  const [w, h] = map.size;
  const uid = map.id.replace(/[^a-z0-9_]/gi, '_');
  const rows = map.terrain.replace(/\r/g, '').split('\n').filter((r) => r.length > 0);
  const terrainAt = (x: number, y: number) => map.legend[rows[y]?.[x] ?? ''] ?? '?';
  // height level of a tile: what the map says, else what the terrain brings
  const raised = new Map<string, number>();
  for (const l of map.levels ?? []) for (const [x, y] of tilesOf(l.area)) raised.set(`${x},${y}`, l.level);
  const levelAt = (x: number, y: number) => raised.get(`${x},${y}`) ?? TERRAIN[terrainAt(x, y)]?.level ?? 0;
  const anyLevel = rows.some((row, y) => [...row].some((_, x) => levelAt(x, y) > 0));
  const unitName = (id: string | undefined) => {
    if (!id) return 'eine Einheit';
    const u = map.units.find((v) => v.id === id);
    return (ctx.text(u?.nameKey) ?? ctx.text(`unit.${id}.name`) ?? id).replace('{avatar}', 'Rhen');
  };
  const unitClass = (u: MapUnit) => u.class ?? (u.lieutenant ? ctx.lieutenantClass(u.lieutenant) : undefined) ?? '?';

  const name = ctx.text(map.nameKey) ?? map.design?.title ?? map.id;
  const v = map.objectives.victory;
  // story 11.8: minimum and the units that must get out (`must`)
  const escapeExtra = (e: { min?: number; must?: string[] }) => {
    const parts = [...(e.min ? [`mind. ${e.min}`] : []), ...(e.must?.length ? [`mit ${e.must.map(unitName).join(', ')}`] : [])];
    return parts.length ? ` (${parts.join(', ')})` : '';
  };
  const victory = (() => {
    switch (v.type) {
      case 'rout':
        return 'Alle Gegner besiegen';
      case 'boss':
        return `${unitName(v.unit)} besiegen (Boss)`;
      case 'reach':
        return `${unitName(v.unit)} erreicht das Zielgebiet`;
      case 'seize':
        return 'Zielfeld erobern';
      case 'defend':
        return `${unitName(v.unit)} ${v.turns} Runden schützen`;
      case 'survive':
        return `${v.turns} Runden überstehen${v.then ? `, dann über das Zielgebiet fliehen${escapeExtra(v.then)}` : ''}`;
      case 'escape':
        return `Über das Zielgebiet fliehen${escapeExtra(v)}`;
      case 'escort':
        return `${unitName(v.unit)} ins Zielgebiet geleiten`;
      case 'treasure':
        return `${v.chests.length} Truhen in ${v.turns} Runden bergen`;
    }
  })();
  const defeat = map.objectives.defeat.map((d) => (d.type === 'unit_dies' ? `${unitName(d.unit)} fällt` : `Runde ${d.turns} verstrichen`)).join(', ');
  const counts = enemyCounts(map);
  const fmtCount = (c: { start: number; later: number }) => `${c.start + c.later}${c.later ? ` (${c.later} später)` : ''}`;
  const enemies = `L ${fmtCount(counts.easy)} · N ${fmtCount(counts.normal)} · S ${fmtCount(counts.hard)}`;
  const deploy = map.deploy.max;
  const ratio = deploy ? `${((counts.normal.start + counts.normal.later) / deploy).toFixed(1).replace('.', ',')}\u00a0:\u00a01` : '–';
  const others = map.units.filter((u) => u.team === 'other').length;
  const playerUnits = map.units.filter((u) => u.team === 'player').length;

  const width = Math.max(MIN_W, GUTTER + w * C + PAD * 2);
  const textChars = Math.floor((width - PAD * 2) / 7.2);
  const parts: string[] = [];
  let y = PAD;

  // --- header
  const text = (x: number, yy: number, s: string, opts: { size?: number; weight?: number; fill?: string; family?: string; anchor?: string } = {}) =>
    parts.push(
      `<text x="${x}" y="${yy}" font-size="${opts.size ?? 13}" font-weight="${opts.weight ?? 400}" fill="${opts.fill ?? COL.ink}"${opts.family ? ` font-family="${opts.family}"` : ''}${opts.anchor ? ` text-anchor="${opts.anchor}"` : ''}>${esc(s)}</text>`,
    );
  if (ctx.title && ctx.title !== name) {
    y += 12;
    text(PAD, y, ctx.title.toUpperCase(), { size: 11, weight: 600, fill: COL.soft });
  }
  y += 26;
  text(PAD, y, name, { size: 24, weight: 700, family: 'Fraunces, Georgia, serif' });
  y += 20;
  const look = [map.timeOfDay, map.weather].filter(Boolean).join(', ');
  text(PAD, y, `${map.id} · ${w} × ${h} (${w * h} Felder, ${sizeClass(map.size)})${map.fog ? ' · Nebel' : ''}${look ? ` · ${look}` : ''}${map.noDeath ? ' · Lernkarte ohne Tod' : ''}`, {
    size: 12,
    fill: COL.soft,
  });
  const facts: [string, string][] = [
    ['Sieg', victory],
    ['Niederlage', defeat || '–'],
    ['Eigene', `${deploy} aufstellbar${map.deploy.forced.length ? ` (Pflicht: ${map.deploy.forced.map(unitName).join(', ')})` : ''}${playerUnits ? `, ${playerUnits} fest auf der Karte` : ''}${others ? ` · ${others} Dritte` : ''}`],
    ['Gegner', `${enemies} · Verhältnis\u00a0N\u00a0${ratio}`],
  ];
  if (map.objectives.side.length) facts.push(['Nebenziele', map.objectives.side.map((s) => sideText(s, unitName)).join(' · ')]);
  if (map.design?.intent) facts.push(['Absicht', map.design.intent]);
  y += 8;
  for (const [k, val] of facts) {
    const lines = wrap(val, textChars - 12);
    lines.forEach((l, i) => {
      y += LINE;
      if (i === 0) text(PAD, y, k, { size: 12, weight: 700 });
      text(PAD + 84, y, l, { size: 12 });
    });
  }

  // --- board
  y += 22;
  const bx = PAD + GUTTER;
  const by = y + 14;
  const cx = (x: number) => bx + x * C + C / 2;
  const cy = (yy: number) => by + yy * C + C / 2;
  for (let x = 0; x < w; x++) text(cx(x), by - 5, String(x), { size: 9, fill: COL.soft, anchor: 'middle' });
  for (let yy = 0; yy < h; yy++) text(bx - 5, cy(yy) + 3, String(yy), { size: 9, fill: COL.soft, anchor: 'end' });
  const used = new Map<string, number>();
  for (let yy = 0; yy < h; yy++)
    for (let x = 0; x < w; x++) {
      const t = terrainAt(x, yy);
      used.set(t, (used.get(t) ?? 0) + 1);
      const look = TERRAIN[t] ?? { fill: '#cccccc', glyph: '?', name: t };
      parts.push(`<rect x="${bx + x * C}" y="${by + yy * C}" width="${C}" height="${C}" fill="${look.fill}"/>`);
      if (look.glyph) parts.push(`<text x="${cx(x)}" y="${cy(yy) + 5}" font-size="15" text-anchor="middle" fill="${look.dark ? 'rgba(255,255,255,0.55)' : 'rgba(59,42,32,0.45)'}">${esc(look.glyph)}</text>`);
      // the height level: a darker veil per level and its digit in the corner
      const lvl = levelAt(x, yy);
      if (lvl > 0) {
        parts.push(`<rect x="${bx + x * C}" y="${by + yy * C}" width="${C}" height="${C}" fill="rgba(47,63,110,${0.07 * lvl})"/>`);
        parts.push(`<text x="${bx + x * C + C - 3}" y="${by + yy * C + 10}" font-size="9" font-weight="700" text-anchor="end" fill="${COL.ink}" stroke="${COL.paper}" stroke-width="2" paint-order="stroke">${lvl}</text>`);
      }
    }
  for (let x = 0; x <= w; x++) parts.push(`<line x1="${bx + x * C}" y1="${by}" x2="${bx + x * C}" y2="${by + h * C}" stroke="${COL.grid}" stroke-width="${x % 5 === 0 ? 1.2 : 0.5}"/>`);
  for (let yy = 0; yy <= h; yy++) parts.push(`<line x1="${bx}" y1="${by + yy * C}" x2="${bx + w * C}" y2="${by + yy * C}" stroke="${COL.grid}" stroke-width="${yy % 5 === 0 ? 1.2 : 0.5}"/>`);
  parts.push(`<rect x="${bx}" y="${by}" width="${w * C}" height="${h * C}" fill="none" stroke="${COL.ink}" stroke-width="1.5"/>`);
  // ladders (fix 2026-11-08): a bar on the edge of the foot tile they lean against, the tile itself stays its ground
  const step = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] } as const;
  for (const l of map.ladders ?? []) {
    const [dx, dy] = step[l.up];
    const thick = C * 0.22;
    const lx = bx + l.at[0] * C + (dx > 0 ? C - thick : 0);
    const ly = by + l.at[1] * C + (dy > 0 ? C - thick : 0);
    parts.push(`<rect x="${lx}" y="${ly}" width="${dx ? thick : C}" height="${dy ? thick : C}" fill="${TERRAIN.ladder!.fill}"/>`);
    used.set('ladder', (used.get('ladder') ?? 0) + 1);
  }

  const areaOutline = (a: Area, stroke: string, dash: string, fill = 'none', label?: string) => {
    const tiles = tilesOf(a);
    const set = new Set(tiles.map(([x, yy]) => `${x},${yy}`));
    const has = (x: number, yy: number) => set.has(`${x},${yy}`);
    if (fill !== 'none') for (const [x, yy] of tiles) parts.push(`<rect x="${bx + x * C}" y="${by + yy * C}" width="${C}" height="${C}" fill="${fill}"/>`);
    const seg: string[] = [];
    for (const [x, yy] of tiles) {
      const x0 = bx + x * C, y0 = by + yy * C;
      if (!has(x, yy - 1)) seg.push(`M${x0} ${y0}h${C}`);
      if (!has(x, yy + 1)) seg.push(`M${x0} ${y0 + C}h${C}`);
      if (!has(x - 1, yy)) seg.push(`M${x0} ${y0}v${C}`);
      if (!has(x + 1, yy)) seg.push(`M${x0 + C} ${y0}v${C}`);
    }
    parts.push(`<path d="${seg.join('')}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-dasharray="${dash}" stroke-linecap="round"/>`);
    if (label && tiles[0]) {
      const [x, yy] = tiles.reduce((a2, b) => (b[1] < a2[1] || (b[1] === a2[1] && b[0] < a2[0]) ? b : a2));
      parts.push(`<text x="${bx + x * C + 2}" y="${by + yy * C + 9}" font-size="8" font-weight="700" fill="${stroke}" stroke="${COL.paper}" stroke-width="2.5" paint-order="stroke">${esc(label)}</text>`);
    }
  };

  // burning tiles at the start
  for (const e of map.initialEffects) for (const [x, yy] of e.tiles) parts.push(`<rect x="${bx + x * C + 2}" y="${by + yy * C + 2}" width="${C - 4}" height="${C - 4}" fill="none" stroke="${COL.ember}" stroke-width="2" stroke-dasharray="3 2"/>`);
  // design zones
  const phaseLabel = (id: string | undefined) => {
    if (!id) return '';
    const i = map.design?.phases?.findIndex((p) => p.id === id) ?? -1;
    return i >= 0 ? `P${i + 1}` : id;
  };
  for (const z2 of map.design?.zones ?? []) areaOutline(z2.area, COL.soft, '1 4', 'rgba(122,101,83,0.12)', `${z2.label}${z2.phase ? ` ${phaseLabel(z2.phase)}` : ''}`);
  // trigger areas
  for (const t of map.triggers) if (t.when.type === 'unit_enters') areaOutline(t.when.area, COL.trigger, '2 3', 'rgba(122,76,194,0.10)', t.id);
  // objective areas
  const goalArea = 'area' in v ? v.area : undefined;
  if (goalArea) areaOutline(goalArea, COL.gold, '6 3', 'rgba(217,169,49,0.25)', 'ZIEL');
  // deploy slots
  map.deploy.slots.forEach(([x, yy], i) => {
    parts.push(`<rect x="${bx + x * C + 3}" y="${by + yy * C + 3}" width="${C - 6}" height="${C - 6}" rx="4" fill="rgba(47,100,200,0.18)" stroke="${COL.player}" stroke-width="1.6"/>`);
    parts.push(`<text x="${bx + x * C + 6}" y="${by + yy * C + 12}" font-size="8" font-weight="700" fill="${COL.player}">${i + 1}</text>`);
  });
  // objects
  const objGlyph: Record<string, string> = { village: 'B', chest: '◆', door: 'T', lever: 'H', ballista: 'Ba' };
  const goalChests = v.type === 'treasure' ? new Set(v.chests) : new Set<string>();
  for (const o of map.objects) {
    const [x, yy] = o.at;
    const stroke = goalChests.has(o.id) ? COL.gold : o.type === 'village' ? COL.ember : COL.ink;
    parts.push(`<rect x="${bx + x * C + 1.5}" y="${by + yy * C + 1.5}" width="${C - 3}" height="${C - 3}" rx="3" fill="none" stroke="${stroke}" stroke-width="2.4"/>`);
    parts.push(`<text x="${bx + x * C + C - 3}" y="${by + yy * C + C - 4}" font-size="9" font-weight="700" text-anchor="end" fill="${stroke}" stroke="${COL.paper}" stroke-width="2.5" paint-order="stroke">${objGlyph[o.type] ?? '?'}</text>`);
  }

  // design paths (arrows), under the tokens
  parts.unshift(
    `<defs>${(['player', 'enemy', 'other'] as Team[]).map((t) => `<marker id="${uid}-arrow-${t}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${TEAM_COLOR[t]}"/></marker>`).join('')}</defs>`,
  );
  for (const p of map.design?.paths ?? []) {
    const pts = p.points.map(([x, yy]) => `${cx(x)},${cy(yy)}`).join(' ');
    parts.push(`<polyline points="${pts}" fill="none" stroke="${COL.paper}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" opacity="0.8"/>`);
    parts.push(`<polyline points="${pts}" fill="none" stroke="${TEAM_COLOR[p.team]}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="${p.team === 'enemy' ? '7 4' : 'none'}" marker-end="url(#${uid}-arrow-${p.team})"/>`);
    const label = [phaseLabel(p.phase), p.label].filter(Boolean).join(' ');
    const mid = p.points[Math.floor((p.points.length - 1) / 2)]!;
    const nxt = p.points[Math.floor((p.points.length - 1) / 2) + 1] ?? mid;
    if (label) text((cx(mid[0]) + cx(nxt[0])) / 2, (cy(mid[1]) + cy(nxt[1])) / 2 - 6, label, { size: 10, weight: 700, fill: TEAM_COLOR[p.team], anchor: 'middle' });
    if (label) {
      // halo for the label just added
      const last = parts.pop()!;
      parts.push(last.replace('<text ', `<text stroke="${COL.paper}" stroke-width="3" paint-order="stroke" `));
    }
  }

  // units (several on one tile – variants per difficulty – are fanned out)
  const allClasses = [
    ...map.units,
    ...map.reinforcements.flatMap((r) => r.units),
    ...map.triggers.flatMap((t) => t.then.flatMap((a) => (a.action === 'spawn' ? a.units : []))),
  ].map(unitClass);
  const labels = classLabels(allClasses, ctx);
  const onTile = new Map<string, MapUnit[]>();
  for (const u of map.units) onTile.set(fmt(u.at), [...(onTile.get(fmt(u.at)) ?? []), u]);
  for (const list of onTile.values())
    list.forEach((u, i) => {
      const off = list.length > 1 ? (i - (list.length - 1) / 2) * 7 : 0;
      const x = cx(u.at[0]) + off;
      const yy = cy(u.at[1]) + off * 0.4;
      const color = TEAM_COLOR[u.team];
      const important = u.boss || u.lieutenant;
      const goalUnit = 'unit' in v && v.unit === u.id;
      const r = C * 0.37;
      if (goalUnit) parts.push(`<circle cx="${x}" cy="${yy}" r="${r + 4}" fill="none" stroke="${COL.gold}" stroke-width="2.5"/>`);
      parts.push(
        `<circle cx="${x}" cy="${yy}" r="${r}" fill="${color}" stroke="${important ? COL.gold : COL.paper}" stroke-width="${important ? 3 : 1.5}"${u.difficulty ? ' stroke-dasharray="3 2"' : ''}/>`,
      );
      parts.push(`<text x="${x}" y="${yy + 3.5}" font-size="10" font-weight="700" text-anchor="middle" fill="#ffffff">${esc(u.team === 'player' && u.id ? u.id.slice(0, 2).replace(/^./, (c) => c.toUpperCase()) : (labels.get(unitClass(u)) ?? '?'))}</text>`);
      if (u.team !== 'player') {
        parts.push(`<circle cx="${x + r - 1}" cy="${yy + r - 1}" r="6" fill="${COL.paper}" stroke="${color}" stroke-width="1"/>`);
        parts.push(`<text x="${x + r - 1}" y="${yy + r + 2}" font-size="8" font-weight="700" text-anchor="middle" fill="${color}">${u.level}</text>`);
      }
      if (important) parts.push(`<text x="${x}" y="${yy - r + 1}" font-size="11" text-anchor="middle" fill="${COL.gold}" stroke="${COL.ink}" stroke-width="0.6">♛</text>`);
      if (u.difficulty) parts.push(`<text x="${x - r - 1}" y="${yy - r + 5}" font-size="7" font-weight="700" fill="${COL.ink}" stroke="${COL.paper}" stroke-width="2" paint-order="stroke">${u.difficulty.map((d) => DIFF_SHORT[d]).join('')}</text>`);
      if (u.ai?.profile === 'trigger' || u.ai?.profile === 'hold' || u.ai?.profile === 'guard')
        parts.push(`<text x="${x - r - 1}" y="${yy + r + 2}" font-size="8" font-weight="700" fill="${COL.ink}" stroke="${COL.paper}" stroke-width="2" paint-order="stroke">${u.ai.profile === 'trigger' ? 'z' : 'h'}</text>`);
    });

  // reinforcements and trigger spawns
  const spawnMarks = new Map<string, { at: Pos; labels: string[]; team: Team; trigger: boolean }>();
  const addSpawn = (u: MapUnit, label: string, trigger: boolean) => {
    const k = fmt(u.at);
    const m = spawnMarks.get(k) ?? { at: u.at, labels: [], team: u.team, trigger };
    if (!m.labels.includes(label)) m.labels.push(label);
    spawnMarks.set(k, m);
  };
  for (const r of map.reinforcements) for (const u of r.units) addSpawn(u, `R${r.turn}`, false);
  map.triggers.forEach((t, i) => t.then.forEach((a) => a.action === 'spawn' && a.units.forEach((u) => addSpawn(u, `A${i + 1}`, true))));
  for (const m of spawnMarks.values()) {
    // on a tile with a unit the diamond moves to the upper left corner, smaller
    const occupied = onTile.has(fmt(m.at));
    const s = occupied ? C * 0.3 : C * 0.42;
    const x = occupied ? bx + m.at[0] * C + s : cx(m.at[0]);
    const yy = occupied ? by + m.at[1] * C + s : cy(m.at[1]);
    const color = m.trigger ? COL.trigger : TEAM_COLOR[m.team];
    parts.push(`<path d="M${x} ${yy - s}L${x + s} ${yy}L${x} ${yy + s}L${x - s} ${yy}z" fill="${COL.paper}" stroke="${color}" stroke-width="2.2" opacity="0.95"/>`);
    parts.push(`<text x="${x}" y="${yy + 3}" font-size="${occupied || m.labels.join('').length > 4 ? 6.5 : 8.5}" font-weight="700" text-anchor="middle" fill="${color}">${esc(m.labels.join('/'))}</text>`);
  }
  // design marks
  for (const mk of map.design?.marks ?? []) {
    const x = bx + mk.at[0] * C + C - 6;
    const yy = by + mk.at[1] * C + 6;
    parts.push(`<circle cx="${x}" cy="${yy}" r="7" fill="${COL.ink}"/>`);
    parts.push(`<text x="${x}" y="${yy + 3}" font-size="8" font-weight="700" text-anchor="middle" fill="${COL.paper}">${esc(mk.label)}</text>`);
  }
  y = by + h * C;

  // --- legend and lists
  const section = (title: string, lines: string[]) => {
    if (!lines.length) return;
    y += 26;
    text(PAD, y, title.toUpperCase(), { size: 11, weight: 700, fill: COL.soft });
    y += 4;
    for (const l of lines)
      for (const [i, part] of wrap(l, textChars).entries()) {
        y += LINE - 2;
        text(PAD + (i ? 12 : 0), y, part, { size: 12 });
      }
  };
  // symbol row
  y += 20;
  const symbols: [string, string][] = [
    [`<rect x="0" y="-11" width="14" height="14" rx="3" fill="rgba(47,100,200,0.18)" stroke="${COL.player}" stroke-width="1.6"/>`, 'Startfeld'],
    [`<circle cx="7" cy="-4" r="7" fill="${COL.enemy}"/>`, 'Gegner (Zahl = Stufe)'],
    [`<circle cx="7" cy="-4" r="7" fill="${COL.other}"/>`, 'Dritte'],
    [`<circle cx="7" cy="-4" r="6" fill="${COL.enemy}" stroke="${COL.gold}" stroke-width="2.5"/>`, 'Boss/Leutnant'],
    [`<circle cx="7" cy="-4" r="6" fill="${COL.enemy}" stroke="${COL.paper}" stroke-dasharray="3 2" stroke-width="1.5"/>`, 'nur L/N/S'],
    [`<path d="M7 -12L15 -4L7 4L-1 -4z" fill="${COL.paper}" stroke="${COL.enemy}" stroke-width="2"/>`, 'R3 Verstärkung'],
    [`<path d="M7 -12L15 -4L7 4L-1 -4z" fill="${COL.paper}" stroke="${COL.trigger}" stroke-width="2"/>`, 'A1 Auslöser'],
    [`<rect x="0" y="-11" width="14" height="14" fill="rgba(217,169,49,0.25)" stroke="${COL.gold}" stroke-width="2" stroke-dasharray="4 2"/>`, 'Zielgebiet'],
    [`<rect x="0" y="-11" width="14" height="14" rx="2" fill="none" stroke="${COL.ember}" stroke-width="2.4"/>`, 'B Besuchsort'],
    [`<rect x="0" y="-11" width="14" height="14" rx="2" fill="none" stroke="${COL.ink}" stroke-width="2.4"/>`, '◆ Truhe, T Tür, H Hebel'],
    [`<line x1="0" y1="-4" x2="16" y2="-4" stroke="${COL.enemy}" stroke-width="3" stroke-dasharray="5 3"/>`, 'Weg Gegner'],
    [`<line x1="0" y1="-4" x2="16" y2="-4" stroke="${COL.player}" stroke-width="3"/>`, 'Weg eigene'],
    [`<circle cx="7" cy="-4" r="7" fill="${COL.ink}"/>`, 'Marke'],
    [`<text x="3" y="0" font-size="10" font-weight="700" fill="${COL.ink}">z</text>`, 'wartet (h hält)'],
  ];
  let sx = PAD;
  for (const [sym, label] of symbols) {
    const wItem = 24 + label.length * 6.4;
    if (sx + wItem > width - PAD) {
      sx = PAD;
      y += 20;
    }
    parts.push(`<g transform="translate(${sx} ${y})">${sym}</g>`);
    text(sx + 20, y, label, { size: 11 });
    sx += wItem + 10;
  }
  // terrain legend
  y += 12;
  sx = PAD;
  if (anyLevel) {
    y += 8;
    text(PAD, y, 'Ziffer oben rechts im Feld: Höhenstufe (ohne Ziffer Stufe 0).', { size: 11, fill: COL.soft });
    y += 6;
  }
  for (const [t, n] of [...used.entries()].sort((a, b) => b[1] - a[1])) {
    const look = TERRAIN[t] ?? { fill: '#cccccc', name: t };
    const label = `${look.name} ${n}`;
    const wItem = 22 + label.length * 6.4;
    if (sx + wItem > width - PAD || sx === PAD) {
      sx = PAD;
      y += 20;
    }
    parts.push(`<rect x="${sx}" y="${y - 11}" width="14" height="14" fill="${look.fill}" stroke="${COL.grid}"/>`);
    text(sx + 20, y, label, { size: 11 });
    sx += wItem + 10;
  }

  section('Klassen-Kürzel', [[...labels.entries()].map(([id, l]) => `${l} ${ctx.className(id)}`).join(' · ')]);

  const unitLine = (u: MapUnit) => `${ctx.className(unitClass(u))} St.${u.level}`;
  const enemyGroups = new Map<string, { n: number; diff: Set<string> }>();
  const lts: string[] = [];
  for (const u of map.units.filter((x) => x.team !== 'player')) {
    const ai = u.ai ? `${AI_NAME[u.ai.profile] ?? u.ai.profile}${u.ai.then ? ` → ${AI_NAME[u.ai.then] ?? u.ai.then}` : ''}${u.ai.wakeTurn ? ` ab R${u.ai.wakeTurn}` : ''}` : '';
    if (u.boss || u.lieutenant || u.team === 'other') {
      lts.push(`${u.lieutenant ? 'Leutnant ' : u.boss ? 'Boss ' : 'Dritte: '}${unitName(u.id)} ${fmt(u.at)}: ${unitLine(u)}${ai ? `, ${ai}` : ''}${u.recruit ? ', anwerbbar' : ''}`);
      continue;
    }
    const key = `${unitLine(u)}${ai ? ` (${ai})` : ''}`;
    const g = enemyGroups.get(key) ?? { n: 0, diff: new Set() };
    g.n++;
    g.diff.add(u.difficulty ? u.difficulty.map((d) => DIFF_SHORT[d]).join('') : 'alle');
    enemyGroups.set(key, g);
  }
  section('Figuren', [...lts, ...[...enemyGroups.entries()].map(([k, g]) => `${g.n}× ${k}${g.diff.has('alle') ? '' : ` – nur ${[...g.diff].join('/')}`}`)]);

  const spawnLines: string[] = [];
  for (const r of map.reinforcements)
    spawnLines.push(`R${r.turn} (${TEAM_NAME[r.phase]}phase${r.announce ? ', angekündigt' : ''}): ${r.units.map((u) => `${unitLine(u)} ${fmt(u.at)}${u.difficulty ? ` [${u.difficulty.map((d) => DIFF_SHORT[d]).join('')}]` : ''}`).join(', ')}`);
  map.triggers.forEach((t, i) => {
    const spawns = t.then.flatMap((a) => (a.action === 'spawn' ? a.units : []));
    const what = t.then.map((a) => (a.action === 'spawn' ? `${a.units.length} Figuren` : a.action === 'dialogue' ? 'Dialog' : a.action === 'set_ai' ? `KI ${a.units.join(', ')} → ${AI_NAME[a.profile] ?? a.profile}` : a.action === 'set_terrain' ? `Gelände ${a.terrain}` : a.action === 'advance_objective' ? 'Ziel wechselt' : `Flag ${a.flag}`));
    spawnLines.push(`${spawns.length ? `A${i + 1} ` : ''}${t.id}: wenn ${whenText(t.when, unitName)} → ${what.join(', ')}${spawns.length ? ` (${spawns.map((u) => `${unitLine(u)} ${fmt(u.at)}`).join(', ')})` : ''}`);
  });
  section('Verstärkungen und Auslöser', spawnLines);

  section(
    'Besuchsorte und Objekte',
    map.objects.map((o) => `${objGlyph[o.type] ?? o.type} ${o.id} ${fmt(o.at)}: ${rewardText(o.reward ?? o.contents, ctx) || o.type}${goalChests.has(o.id) ? ' (Ziel)' : ''}`),
  );
  section('Phasen', (map.design?.phases ?? []).map((p, i) => `P${i + 1} Runde ${p.turns[0]}–${p.turns[1]}: ${p.label}${p.note ? `. ${p.note}` : ''}`));
  section('Marken', (map.design?.marks ?? []).map((m) => `${m.label} ${fmt(m.at)}: ${m.note}`));
  section('Notizen', [...(map.design?.notes ?? []), ...(map.devNote && !map.design ? [map.devNote.trim()] : [])]);

  y += PAD + 6;
  const height = Math.ceil(y);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Barlow, 'Segoe UI', system-ui, sans-serif" role="img" aria-label="${esc(`Level-Blatt ${name}`)}"><rect width="${width}" height="${height}" fill="${COL.paper}"/>${parts.join('')}</svg>`;

  return {
    svg,
    width,
    height,
    summary: { name, size: `${w} × ${h}`, sizeClass: sizeClass(map.size), deploy, enemies, ratio, victory },
    moodPrompt: moodPrompt(map, name, rows.length ? terrainAt : () => '?'),
  };
}

function sideText(s: LevelMap['objectives']['side'][number], unitName: (id: string | undefined) => string): string {
  switch (s.type) {
    case 'visit_villages':
      return 'alle Häuser besuchen';
    case 'no_downs':
      return 'niemand fällt';
    case 'turn_limit':
      return `in ${s.turns} Runden`;
    case 'kill_with':
      return `Sieg mit ${s.weaponType ?? unitName(s.unit)}`;
    case 'recruit':
      return `${unitName(s.unit)} anwerben`;
    case 'open_chests':
      return 'alle Truhen öffnen';
    case 'protect_npc':
      return `${unitName(s.unit)} schützen`;
  }
}

function whenText(w: LevelMap['triggers'][number]['when'], unitName: (id: string | undefined) => string): string {
  switch (w.type) {
    case 'turn_start':
      return `Runde ${w.turn} beginnt`;
    case 'unit_enters':
      return `${w.unit ? unitName(w.unit) : w.team ? TEAM_NAME[w.team] : 'jemand'} betritt das Gebiet`;
    case 'unit_dies':
      return `${unitName(w.unit)} fällt`;
    case 'object_destroyed':
      return `${w.object} zerstört`;
    case 'object_activated':
      return `${w.object} benutzt`;
    case 'talked':
      return `Gespräch mit ${unitName(w.unit)}`;
    case 'hp_below':
      return `${unitName(w.unit)} unter ${w.percent} % TP`;
    case 'objective_changed':
      return 'das Ziel wechselt';
  }
}

function rewardText(r: LevelMap['objects'][number]['reward'], ctx: SheetContext): string {
  if (!r) return '';
  return [
    r.gold ? `${r.gold} Gold` : '',
    r.item ? (ctx.text(`item.${r.item.def}.name`) ?? r.item.def) : '',
    r.recruit ? `Beitritt ${r.recruit}` : '',
    r.material ? Object.entries(r.material).map(([k, n]) => `${n} ${k}`).join(', ') : '',
    r.chronicle ? 'Chronik' : '',
  ]
    .filter(Boolean)
    .join(', ');
}

/** Describes the map in thirds (north, middle, south × west, centre, east) by its main terrains, for the mood prompt. */
export function describeLayout(map: LevelMap, terrainAt: (x: number, y: number) => string): string[] {
  const [w, h] = map.size;
  const band = (n: number, i: number) => [Math.floor((n * i) / 3), Math.floor((n * (i + 1)) / 3)] as const;
  const rowsName = ['Norden', 'Mitte', 'Süden'];
  const colsName = ['West', 'Mitte', 'Ost'];
  const out: string[] = [];
  for (let r = 0; r < 3; r++) {
    const cells: string[] = [];
    for (let c = 0; c < 3; c++) {
      const [y0, y1] = band(h, r);
      const [x0, x1] = band(w, c);
      const n = new Map<string, number>();
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) n.set(terrainAt(x, y), (n.get(terrainAt(x, y)) ?? 0) + 1);
      const total = (y1 - y0) * (x1 - x0);
      const top = [...n.entries()].sort((a, b) => b[1] - a[1]).filter(([, k], i) => i === 0 || k / total >= 0.15).slice(0, 3);
      cells.push(`${colsName[c]}: ${top.map(([t]) => TERRAIN[t]?.name ?? t).join(', ')}`);
    }
    out.push(`${rowsName[r]} – ${cells.join('; ')}`);
  }
  return out;
}

function moodPrompt(map: LevelMap, name: string, terrainAt: (x: number, y: number) => string): string {
  const [w, h] = map.size;
  const look = [map.timeOfDay && `Tageszeit ${map.timeOfDay}`, map.weather && `Wetter ${map.weather}`].filter(Boolean).join(', ');
  return [
    `Male ein Stimmungsbild für das Level „${name}“ eines Taktik-RPGs (Hollow Crown).`,
    `Vorlage ist das angehängte Level-Blatt: ein Raster von ${w} × ${h} Feldern im Hochformat, Norden oben. Lage von Gelände, Wegen, Wasser, Häusern und Zielen genau nach dem Raster übernehmen; das Bild zeigt die Atmosphäre, verbindlich bleibt das Raster.`,
    'Stil: helles, warmes Spielzeug-Diorama aus leicht gefasten Blöcken, gemalte ruhige Bodentexturen, runde Baumkronen aus zwei bis drei Kugeln, Häuser mit dicken Dächern und warm leuchtenden Fenstern, klares türkisblaues Wasser mit hellen Schaumkanten, weiche Schatten. Schräge Draufsicht von Süden (etwa 35°), ganze Karte im Bild, Umgebung außerhalb der Karte entsättigt.',
    `Aufteilung: ${describeLayout(map, terrainAt).join(' | ')}.`,
    look ? `Licht: ${look}.` : '',
    map.design?.mood ? `Stimmung: ${map.design.mood}` : '',
    'Keine Figuren, keine Schrift, keine Rasterlinien, keine Symbole aus dem Blatt. Format 2:3 hochkant.',
  ]
    .filter(Boolean)
    .join('\n');
}
