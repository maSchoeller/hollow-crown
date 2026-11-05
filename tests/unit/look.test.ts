import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { mapSchema, renderSchema } from '../../src/content/schemas';
import { validateContent } from '../../src/content/validate';
import { iconStatuses, unshippedGalleryModels, validateBoardModels, validatePropVariants, validateStatusIcons, validateWeather } from '../../src/content/validateLook';
import { TIMES_OF_DAY, WEATHERS } from '../../src/core/defs';
import type { MapDef } from '../../src/core/mapDefs';
import { newFigureLook } from '../../src/render/shared/figurePlugin';
import { DEFAULT_AMBIENT, DEFAULT_SKY, DEFAULT_SUN, lookOverride, mixHex, parseLookParam, resolveLook, retint, weatherPlan } from '../../src/render/shared/look';

const { data, locales } = loadContentFromDisk();
const render = data.render;
const baseMap = (over: Partial<MapDef> = {}): Pick<MapDef, 'act' | 'ambient' | 'sun' | 'timeOfDay' | 'weather'> => ({ act: 1, ...over });

describe('render.yaml look (story 8.6)', () => {
  it('has all four times of day, all five weathers and the acts 1 to 3', () => {
    expect(Object.keys(render.look.timeOfDay).sort()).toEqual([...TIMES_OF_DAY].sort());
    expect(Object.keys(render.look.weather).sort()).toEqual([...WEATHERS].sort());
    expect(Object.keys(render.look.season).sort()).toEqual(['1', '2', '3']);
  });

  it('keeps the figure floors of art direction 2.5 (85 / 100 / 80 / 60 %)', () => {
    const f = render.look.timeOfDay;
    expect([f.morning.figureFloor, f.noon.figureFloor, f.evening.figureFloor, f.night.figureFloor]).toEqual([0.85, 1, 0.8, 0.6]);
  });

  it('has the team colours of art direction 2.1', () => {
    const t = render.look.teams;
    expect(t.player).toEqual({ ui: '#2F64C8', ramp: ['#1E3F86', '#2F64C8', '#5C8EE6', '#A9C6F4'] });
    expect(t.enemy).toEqual({ ui: '#B83A2E', ramp: ['#7A2219', '#B83A2E', '#DB6A5C', '#F2B2A8'] });
    expect(t.other).toEqual({ ui: '#3FA65A', ramp: ['#25693A', '#3FA65A', '#74C98A', '#BFE6C9'] });
  });

  it('allows the weathers in the acts of art direction 2.5', () => {
    const w = render.look.weather;
    expect(w.clear.acts).toEqual([1, 2, 3]);
    expect(w.rain.acts).toEqual([1, 2]);
    expect(w.fog.acts).toEqual([1, 2]);
    expect(w.ash.acts).toEqual([1, 3]);
    expect(w.snow.acts).toEqual([3]);
  });

  it('puts the night at a weak rim light and stronger point lights, the day at none', () => {
    expect(render.look.timeOfDay.night.rim.strength).toBeGreaterThan(0);
    expect(render.look.timeOfDay.night.pointBoost).toBeGreaterThan(1);
    for (const t of ['morning', 'noon', 'evening'] as const) expect(render.look.timeOfDay[t].rim.strength).toBe(0);
  });
});

describe('mapSchema timeOfDay and weather', () => {
  const raw = () => ({ id: 't', nameKey: 'k', size: [4, 4], legend: {}, terrain: '....\n....\n....\n....', deploy: { max: 1, forced: [], slots: [] }, units: [], objectives: { victory: { type: 'rout' }, defeat: [] } });
  it('accepts the listed values and their absence', () => {
    expect(mapSchema.safeParse(raw()).success).toBe(true);
    const m = mapSchema.parse({ ...raw(), timeOfDay: 'evening', weather: 'rain' });
    expect(m.timeOfDay).toBe('evening');
    expect(m.weather).toBe('rain');
  });
  it('refuses unknown values', () => {
    expect(mapSchema.safeParse({ ...raw(), timeOfDay: 'dusk' }).success).toBe(false);
    expect(mapSchema.safeParse({ ...raw(), weather: 'hail' }).success).toBe(false);
  });
  it('lets one field of sun and ambient stand alone', () => {
    expect(mapSchema.safeParse({ ...raw(), sun: { intensity: 0.7 }, ambient: { color: '#112233' } }).success).toBe(true);
  });
});

describe('resolveLook', () => {
  it('without time of day and weather gives the plain defaults, or what the map says', () => {
    const none = resolveLook(render, baseMap());
    expect(none.ambient).toEqual(DEFAULT_AMBIENT);
    expect(none.sun).toEqual(DEFAULT_SUN);
    expect(none.sky).toBe(DEFAULT_SKY);
    expect(none.figureFloor).toBe(0);
    expect(none.rim.strength).toBe(0);
    expect(none.pointBoost).toBe(1);
    expect(none.weather).toBe('clear');
    const own = { color: '#3a4a7a', intensity: 0.55 };
    const sun = { color: '#9fb4ff', intensity: 0.45, azimuthDeg: 10, elevationDeg: 30 };
    const withMap = resolveLook(render, baseMap({ ambient: own, sun }));
    expect(withMap.ambient).toEqual(own);
    expect(withMap.sun).toEqual(sun);
    expect(withMap.sky).toBe(DEFAULT_SKY);
  });

  it('a map without time of day ignores the season of its act', () => {
    for (const act of [1, 2, 3]) expect(resolveLook(render, baseMap({ act })).sun).toEqual(DEFAULT_SUN);
  });

  it('uses the preset as the base: noon is not evening', () => {
    const noon = resolveLook(render, baseMap({ timeOfDay: 'noon', act: 9 }));
    const evening = resolveLook(render, baseMap({ timeOfDay: 'evening', act: 9 }));
    expect(noon.sun.elevationDeg).toBe(render.look.timeOfDay.noon.sun.elevationDeg);
    expect(evening.sun.azimuthDeg).toBe(270);
    expect(noon.sky).toBe(render.look.timeOfDay.noon.sky);
    expect(noon.figureFloor).toBeCloseTo(1 * render.look.figureReference);
  });

  it('lets the map override the preset field by field, after the season', () => {
    const l = resolveLook(render, baseMap({ timeOfDay: 'evening', act: 1, sun: { intensity: 0.5 } }));
    expect(l.sun.intensity).toBe(0.5);
    // colour and direction still come from the preset (colour shifted by the season of act 1)
    expect(l.sun.azimuthDeg).toBe(render.look.timeOfDay.evening.sun.azimuthDeg);
    expect(l.sun.color).not.toBe('#ff9a50');
    const forced = resolveLook(render, baseMap({ timeOfDay: 'evening', act: 1, sun: { elevationDeg: 33 }, ambient: { color: '#112233' } }));
    expect(forced.sun.elevationDeg).toBe(33);
    expect(forced.ambient.color).toBe('#112233');
    expect(forced.ambient.intensity).toBe(render.look.timeOfDay.evening.ambient.intensity);
  });

  it('puts the season of the act above the preset: tint and sun height', () => {
    const s1 = render.look.season['1']!;
    const plain = render.look.timeOfDay.noon;
    const l = resolveLook(render, baseMap({ timeOfDay: 'noon', act: 1 }));
    expect(l.sun.elevationDeg).toBe(Math.min(90, plain.sun.elevationDeg + s1.sunElevationOffsetDeg));
    expect(l.sun.color).toBe(mixHex(plain.sun.color, s1.tint, s1.strength));
    expect(l.ambient.color).toBe(mixHex(plain.ambient.color, s1.tint, s1.strength));
    const winter = resolveLook(render, baseMap({ timeOfDay: 'noon', act: 3 }));
    expect(winter.sun.elevationDeg).toBeLessThan(l.sun.elevationDeg);
  });

  it('grades light and sky by the weather without changing the time of day', () => {
    const dry = resolveLook(render, baseMap({ timeOfDay: 'night', act: 1 }));
    const rain = resolveLook(render, baseMap({ timeOfDay: 'night', act: 1, weather: 'rain' }));
    expect(rain.ambient.intensity).toBeCloseTo(dry.ambient.intensity * render.look.weather.rain.grade!.ambientScale);
    expect(rain.sky).not.toBe(dry.sky);
    expect(rain.sun).toEqual(dry.sun);
    // a night sky stays a night sky under rain
    const lum = (h: string) => parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16);
    expect(lum(rain.sky)).toBeLessThan(lum(resolveLook(render, baseMap({ timeOfDay: 'noon' })).sky));
  });

  it('clear changes nothing', () => {
    const a = resolveLook(render, baseMap({ timeOfDay: 'evening' }));
    const b = resolveLook(render, baseMap({ timeOfDay: 'evening', weather: 'clear' }));
    expect(b).toEqual(a);
  });

  it('retint keeps the brightness of the base', () => {
    expect(retint('#101010', '#ffffff', 1)).toBe('#101010');
    expect(retint('#101010', '#ffffff', 0)).toBe('#101010');
  });
});

describe('weatherPlan (quality levels)', () => {
  it('draws no particles on low and half on mid', () => {
    for (const w of ['rain', 'ash', 'snow'] as const) {
      const def = render.look.weather[w];
      expect(weatherPlan(def, 'high').particles).toBe(def.particles!.high);
      expect(weatherPlan(def, 'mid').particles).toBe(Math.floor(def.particles!.high / 2));
      expect(weatherPlan(def, 'low').particles).toBe(0);
    }
  });
  it('keeps mist and wet shine on low, drops layers and puddles', () => {
    const rain = weatherPlan(render.look.weather.rain, 'low');
    expect(rain.wet).not.toBeNull();
    expect(rain.puddles).toBeNull();
    const fog = weatherPlan(render.look.weather.fog, 'low');
    expect(fog.mist).not.toBeNull();
    expect(fog.ground).toBeNull();
    expect(weatherPlan(render.look.weather.fog, 'mid').ground).not.toBeNull();
    const clear = weatherPlan(render.look.weather.clear, 'high');
    expect(clear).toEqual({ particles: 0, wet: null, mist: null, ground: null, puddles: null });
  });
});

describe('?look= debug parameter', () => {
  it('parses time of day and weather in any order, ignoring unknown words', () => {
    expect(parseLookParam('evening,rain')).toEqual({ timeOfDay: 'evening', weather: 'rain' });
    expect(parseLookParam('snow,night')).toEqual({ timeOfDay: 'night', weather: 'snow' });
    expect(parseLookParam('night')).toEqual({ timeOfDay: 'night' });
    expect(parseLookParam('dusk,hail')).toEqual({});
    expect(parseLookParam(null)).toEqual({});
  });
  it('works only in a dev build or with ?debug', () => {
    expect(lookOverride('?look=night,rain', false)).toEqual({});
    expect(lookOverride('?look=night,rain', true)).toEqual({ timeOfDay: 'night', weather: 'rain' });
    expect(lookOverride('?debug&look=night,rain', false)).toEqual({ timeOfDay: 'night', weather: 'rain' });
  });
});

describe('content:check rules for the look', () => {
  const withWeather = (id: string, act: number, weather: MapDef['weather']) => ({ ...data, maps: { [id]: { ...Object.values(data.maps)[0]!, id, act, weather } } });
  it('flags a weather outside its acts as an error, clear everywhere', () => {
    expect(validateWeather(withWeather('m', 3, 'rain')).map((i) => i.message)).toEqual([expect.stringContaining('rain does not occur in act 3')]);
    expect(validateWeather(withWeather('m', 1, 'snow'))).toHaveLength(1);
    expect(validateWeather(withWeather('m', 1, 'rain'))).toEqual([]);
    expect(validateWeather(withWeather('m', 2, 'clear'))).toEqual([]);
    expect(validateWeather(withWeather('m', 3, 'snow'))).toEqual([]);
  });
  it('the shipped maps pass', () => {
    expect(validateContent(data, locales).filter((i) => i.message.includes('weather'))).toEqual([]);
  });
  it('wants an icon for each stored status, not for knockback', () => {
    expect(iconStatuses(data)).toEqual(['burning', 'slowed', 'wet']);
    expect(validateStatusIcons(data, new Set(['burning', 'wet', 'slowed']))).toEqual([]);
    expect(validateStatusIcons(data, new Set(['burning'])).map((i) => i.message)).toEqual([expect.stringContaining('slowed'), expect.stringContaining('wet')]);
    expect(validateStatusIcons(data)).toEqual([]);
  });
});

describe('content:check rules for prop variants', () => {
  const base = Object.values(data.maps)[0]!;
  const withVariants = (at: [number, number], model: string) => ({ ...data, maps: { m: { ...base, id: 'm', act: 1, propVariants: [{ at, model }] } } });
  const rows = base.terrain.split(/\r?\n/).filter((r) => r.length > 0);
  const find = (prop: string) => {
    for (let y = 0; y < rows.length; y++)
      for (let x = 0; x < rows[y]!.length; x++) if (data.terrain[base.legend[rows[y]![x]!]!]?.prop === prop) return [x, y] as [number, number];
    return null;
  };

  it('accepts a model of the list for the prop on the field', () => {
    const t = find('tree');
    expect(t).not.toBeNull();
    expect(validatePropVariants(withVariants(t!, 'grove_a'))).toEqual([]);
  });
  it('flags a model of another class, a field without a variant prop and a field off the map', () => {
    const t = find('tree')!;
    expect(validatePropVariants(withVariants(t, 'house_b_intact')).map((i) => i.message)).toEqual([expect.stringContaining('not a tree variant')]);
    expect(validatePropVariants(withVariants([999, 999], 'tree_a')).map((i) => i.message)).toEqual([expect.stringContaining('not on the map')]);
  });
  it('the shipped content passes', () => {
    expect(validatePropVariants(data)).toEqual([]);
  });
  it('a hand-placed (weight 0) model is a valid override for its class', () => {
    const s = find('house');
    expect(s).not.toBeNull();
    expect(validatePropVariants(withVariants(s!, 'mill_idle'))).toEqual([]);
  });
});

describe('render.yaml variant weights (story 15.8)', () => {
  const raw = () => parse(readFileSync(join(process.cwd(), 'content', 'core', 'render.yaml'), 'utf8')) as { board: { variants: { stall: { model: string; weight: number }[] } } };
  const withStall = (stall: { model: string; weight: number }[]) => {
    const r = raw();
    r.board.variants.stall = stall;
    return renderSchema.safeParse(r);
  };
  it('accepts weight 0 next to a rolled model', () => {
    expect(withStall([{ model: 'market_a', weight: 1 }, { model: 'camp_tent_a', weight: 0 }]).success).toBe(true);
  });
  it('refuses a list with nothing to roll and a negative weight', () => {
    const none = withStall([{ model: 'camp_tent_a', weight: 0 }]);
    expect(none.success).toBe(false);
    expect(JSON.stringify(none.error?.issues)).toContain('at least one variant needs a weight above 0');
    expect(withStall([{ model: 'market_a', weight: 1 }, { model: 'camp_tent_a', weight: -1 }]).success).toBe(false);
  });
});

describe('content:check: board models exist and ship (story 15.8)', () => {
  const names = () => {
    const b = render.board;
    const out = new Set<string>();
    for (const l of Object.values(b.variants)) for (const list of Array.isArray(l) ? [l] : Object.values(l)) for (const e of list) out.add(e.model);
    for (const d of Object.values(b.decor)) out.add(d.model);
    for (const list of Object.values(b.decorOn)) for (const d of list) out.add(d.model);
    for (const m of Object.values(b.propFallback)) out.add(m);
    for (const t of Object.values(data.terrain)) if (t.prop) out.add(`${t.prop}_idle`);
    for (const e of b.variants.lodge) for (const s of ['visited', 'razed']) out.add(e.model.replace(/intact$/, s));
    return out;
  };
  it('passes when every named model is a file and none is held back', () => {
    expect(validateBoardModels(data, names(), new Set())).toEqual([]);
  });
  it('flags a missing file and a gallery model without ships', () => {
    const files = names();
    files.delete('market_a');
    const msgs = validateBoardModels(data, files, new Set(['mill_idle'])).map((i) => i.message);
    expect(msgs).toHaveLength(2);
    expect(msgs).toEqual(expect.arrayContaining([expect.stringContaining('missing model market_a'), expect.stringContaining('mill_idle is a gallery model without ships')]));
  });
  it('flags a missing state of a visitable house and a missing `<prop>_idle` of a terrain prop', () => {
    const files = names();
    files.delete('lodge_b_razed');
    files.delete('brazier_b_idle');
    expect(validateBoardModels(data, files, new Set()).map((i) => i.message)).toEqual(
      expect.arrayContaining([expect.stringContaining('missing model lodge_b_razed'), expect.stringContaining('missing model brazier_b_idle')]),
    );
  });
  it('the real gallery: shipped models are out of the unshipped set, the rest of a group without ships is in', () => {
    const dir = join(process.cwd(), 'concept', '23-art-direction', 'map-assets', 'groups');
    const groups = readdirSync(dir).filter((f) => f.endsWith('.yaml')).map((f) => parse(readFileSync(join(dir, f), 'utf8')) as unknown);
    const out = unshippedGalleryModels(groups);
    for (const m of ['market_a', 'market_b', 'camp_tent_a', 'mill_idle', 'wallrim_idle', 'grove_a']) expect(out.has(m)).toBe(false);
    for (const m of ['house_town_a', 'chest_b_closed', 'barn_a']) expect(out.has(m)).toBe(true);
    expect(unshippedGalleryModels([{ ships: true, items: [{ id: 'a' }] }, { items: [{ id: 'b' }, { id: 'c', ships: true }] }])).toEqual(new Set(['b']));
  });
  it('checks the models a map sets by hand', () => {
    const base = Object.values(data.maps)[0]!;
    const one = { ...data, maps: { m: { ...base, id: 'm', propVariants: [{ at: [0, 0] as [number, number], model: 'ghost_idle' }] } } };
    expect(validateBoardModels(one, names(), new Set()).map((i) => i.file)).toEqual(['maps/m']);
  });
});

describe('cloth steps (decision 2026-10-26)', () => {
  it('draws the key K2 of image-to-3D cloth in the K1 step, the UI colour', () => {
    
    const l = newFigureLook(render.look);
    expect(l.teams.player[2]).toBe(render.look.teams.player.ui);
    expect(l.teams.enemy[2]).toBe(render.look.teams.enemy.ui);
    expect(l.teams.other[2]).toBe(render.look.teams.other.ui);
  });
});
