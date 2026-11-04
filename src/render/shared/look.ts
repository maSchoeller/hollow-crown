/**
 * The look of a battle board (story 8.6, concept/23-art-direction §2.4, §2.5): time of day, season of the act and weather
 * resolved into what the scene needs. Pure (no Babylon), so the order of precedence can be tested:
 *
 *   without `timeOfDay`   the map's own light on the plain defaults – the board looks exactly as it did before;
 *   with `timeOfDay`      the preset, then the season of the act above it, then the map's `ambient` and `sun` field by field;
 *   `weather`             grades ambient strength and sky of what came out (also without a time of day), the rest is particles,
 *                         mist, wet shine and puddles (`weatherPlan`).
 */
import { TIMES_OF_DAY, WEATHERS, type TimeOfDay, type Weather } from '../../core/defs';
import type { MapDef } from '../../core/mapDefs';
import type { RenderDef, WeatherDef } from '../../core/renderDefs';

type Quality = 'high' | 'mid' | 'low';

export interface AmbientDef {
  color: string;
  intensity: number;
}

export interface SunDef {
  color: string;
  intensity: number;
  /** compass bearing: 0 = north (+Z), 90 = east (+X) */
  azimuthDeg: number;
  elevationDeg: number;
}

export const DEFAULT_AMBIENT: AmbientDef = { color: '#ffffff', intensity: 1 };
export const DEFAULT_SUN: SunDef = { color: '#fff4e0', intensity: 1, azimuthDeg: 300, elevationDeg: 50 };
/** the board's background before this story (0.06, 0.07, 0.11) */
export const DEFAULT_SKY = '#0f121c';

export interface ResolvedLook {
  ambient: AmbientDef;
  sun: SunDef;
  /** scene background colour */
  sky: string;
  /** minimum brightness of a figure as a multiple of its base colour; 0 = none (no time of day) */
  figureFloor: number;
  /** rim light on figures; strength 0 = off */
  rim: { color: string; strength: number };
  /** factor on the strength of point lights */
  pointBoost: number;
  timeOfDay: TimeOfDay | null;
  weather: Weather;
  /** the weather's recipe (parts are picked per quality level by `weatherPlan`) */
  weatherDef: WeatherDef;
}

const rgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const hex = (c: readonly number[]): string =>
  '#' +
  c
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
const luma = (c: readonly number[]): number => 0.299 * c[0]! + 0.587 * c[1]! + 0.114 * c[2]!;

/** `a` towards `b` by `t` (0–1), per channel. */
export function mixHex(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return hex(x.map((v, i) => v + (y[i]! - v) * t));
}

/** The hue of `tint` at the brightness of `base`, mixed into `base` by `mix`: grey rain over a night sky stays dark. */
export function retint(base: string, tint: string, mix: number): string {
  const b = rgb(base);
  const t = rgb(tint);
  const k = luma(b) / Math.max(1e-4, luma(t));
  return hex(b.map((v, i) => v + (t[i]! * k - v) * mix));
}

const clampDeg = (v: number) => Math.min(90, Math.max(1, v));

/** The light of `map` under `render.look`; see the file header for the order. */
export function resolveLook(render: RenderDef, map: Pick<MapDef, 'act' | 'ambient' | 'sun' | 'timeOfDay' | 'weather'>): ResolvedLook {
  const look = render.look;
  const weather = map.weather ?? 'clear';
  const weatherDef = look.weather[weather];
  let ambient: AmbientDef = { ...DEFAULT_AMBIENT };
  let sun: SunDef = { ...DEFAULT_SUN };
  let sky = DEFAULT_SKY;
  let figureFloor = 0;
  let rim = { color: '#ffffff', strength: 0 };
  let pointBoost = 1;
  const tod = map.timeOfDay;
  if (tod) {
    const p = look.timeOfDay[tod];
    ambient = { ...p.ambient };
    sun = { ...p.sun };
    sky = p.sky;
    figureFloor = p.figureFloor * look.figureReference;
    rim = { ...p.rim };
    pointBoost = p.pointBoost;
    // the season of the act lies over the preset
    const season = look.season[String(map.act)];
    if (season) {
      ambient.color = mixHex(ambient.color, season.tint, season.strength);
      sun.color = mixHex(sun.color, season.tint, season.strength);
      sky = mixHex(sky, season.tint, season.strength);
      sun.elevationDeg = clampDeg(sun.elevationDeg + season.sunElevationOffsetDeg);
    }
  }
  // the map's own values win, field by field
  if (map.ambient?.color !== undefined) ambient.color = map.ambient.color;
  if (map.ambient?.intensity !== undefined) ambient.intensity = map.ambient.intensity;
  if (map.sun?.color !== undefined) sun.color = map.sun.color;
  if (map.sun?.intensity !== undefined) sun.intensity = map.sun.intensity;
  if (map.sun?.azimuthDeg !== undefined) sun.azimuthDeg = map.sun.azimuthDeg;
  if (map.sun?.elevationDeg !== undefined) sun.elevationDeg = map.sun.elevationDeg;
  const grade = weatherDef.grade;
  if (grade) {
    ambient.intensity *= grade.ambientScale;
    sky = retint(sky, grade.sky, grade.skyMix);
  }
  return { ambient, sun, sky, figureFloor, rim, pointBoost, timeOfDay: tod ?? null, weather, weatherDef };
}

/** What of a weather is drawn at a quality level (story 8.6): `low` keeps light, sky, mist and wet shine, no particles, layers or puddles. */
export interface WeatherPlan {
  /** number of falling particles; 0 = none */
  particles: number;
  wet: NonNullable<WeatherDef['wet']> | null;
  mist: NonNullable<WeatherDef['mist']> | null;
  ground: NonNullable<WeatherDef['ground']> | null;
  puddles: NonNullable<WeatherDef['puddles']> | null;
}

export function weatherPlan(def: WeatherDef, quality: Quality): WeatherPlan {
  const low = quality === 'low';
  return {
    particles: def.particles?.[quality] ?? 0,
    wet: def.wet ?? null,
    mist: def.mist ?? null,
    ground: low ? null : (def.ground && def.ground.layers > 0 ? def.ground : null),
    puddles: low ? null : (def.puddles && def.puddles.count > 0 ? def.puddles : null),
  };
}

/** `?look=evening,rain` (either part may be left out): the time of day and weather to try a map with. Unknown words are ignored. */
export function parseLookParam(value: string | null): { timeOfDay?: TimeOfDay; weather?: Weather } {
  const out: { timeOfDay?: TimeOfDay; weather?: Weather } = {};
  for (const w of (value ?? '').toLowerCase().split(/[,;\s]+/)) {
    if ((TIMES_OF_DAY as readonly string[]).includes(w)) out.timeOfDay = w as TimeOfDay;
    else if ((WEATHERS as readonly string[]).includes(w)) out.weather = w as Weather;
  }
  return out;
}

/**
 * The look override of the page URL: only in a dev build or with `?debug`; a production build ignores `?look=` otherwise
 * (the board then shows what the map says).
 */
export function lookOverride(search: string, dev: boolean): { timeOfDay?: TimeOfDay; weather?: Weather } {
  const q = new URLSearchParams(search);
  if (!dev && !q.has('debug')) return {};
  return parseLookParam(q.get('look'));
}
