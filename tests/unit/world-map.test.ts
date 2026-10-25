import { describe, expect, it } from 'vitest';
import type { WorldDef } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import { clampView, coverScale, focusView, fogTop, moreMissionsFollow, placeOf, screenOf, stepScale, zoomAround } from '../../src/app/screens/worldMapView';

const { data, locales } = loadContentFromDisk();
const size = [1024, 1536] as const;
const phone = { w: 375, h: 812 };
const steps = [1.6, 2.4];

describe('world map view maths', () => {
  it('the cover scale fills both axes; a zoom step makes the picture that many screen widths wide', () => {
    expect(coverScale(phone, size)).toBeCloseTo(812 / 1536); // a phone is taller than the picture's shape
    expect(stepScale(phone, size, steps, 0)).toBeCloseTo((375 * 1.6) / 1024);
    expect(stepScale(phone, size, steps, 1)).toBeCloseTo((375 * 2.4) / 1024);
    expect(stepScale(phone, size, steps, 1, 1.12)).toBeCloseTo(((375 * 2.4) / 1024) * 1.12);
    // a very tall window: never smaller than needed to cover the height
    expect(stepScale({ w: 2000, h: 6000 }, size, steps, 0)).toBeCloseTo(6000 / 1536);
  });

  it('clamping keeps the picture over the whole screen', () => {
    const s = stepScale(phone, size, steps, 0);
    const far = clampView({ x: 500, y: 500, s }, phone, size);
    expect(far.x).toBe(0);
    expect(far.y).toBe(0);
    const away = clampView({ x: -9999, y: -9999, s }, phone, size);
    expect(away.x).toBeCloseTo(phone.w - size[0] * s);
    expect(away.y).toBeCloseTo(phone.h - size[1] * s);
    expect(clampView({ x: 0, y: 0, s: 0.01 }, phone, size).s).toBeCloseTo(coverScale(phone, size));
  });

  it('a pad lets the picture be pushed past its top and bottom edge, never sideways', () => {
    const s = stepScale(phone, size, steps, 0);
    const pad = { top: 80, bottom: 90 };
    expect(clampView({ x: 500, y: 500, s }, phone, size, pad)).toMatchObject({ x: 0, y: 80 });
    const away = clampView({ x: -9999, y: -9999, s }, phone, size, pad);
    expect(away.y).toBeCloseTo(phone.h - 90 - size[1] * s);
    expect(away.x).toBeCloseTo(phone.w - size[0] * s);
  });

  it('focusing puts a place on the resting point of the screen', () => {
    const s = stepScale(phone, size, steps, 1);
    const at: [number, number] = [50, 50];
    const v = focusView(phone, size, s, at, [0.5, 0.3]);
    const [x, y] = screenOf(v, size, at);
    expect(x).toBeCloseTo(phone.w * 0.5);
    expect(y).toBeCloseTo(phone.h * 0.3);
  });

  it('a place near the edge cannot reach the resting point: the view stops at the picture edge', () => {
    const s = stepScale(phone, size, steps, 1);
    const v = focusView(phone, size, s, [2, 98], [0.5, 0.3]);
    expect(v.x).toBe(0);
    expect(v.y).toBeCloseTo(phone.h - size[1] * s);
  });

  it('zooming around a point keeps that spot of the picture under it', () => {
    const v0 = focusView(phone, size, stepScale(phone, size, steps, 0), [50, 50], [0.5, 0.5]);
    const anchor: [number, number] = [phone.w / 2, phone.h / 2];
    const v1 = zoomAround(v0, phone, size, stepScale(phone, size, steps, 1), anchor);
    const px = (v: typeof v0): [number, number] => [(anchor[0] - v.x) / v.s, (anchor[1] - v.y) / v.s];
    expect(px(v1)[0]).toBeCloseTo(px(v0)[0]);
    expect(px(v1)[1]).toBeCloseTo(px(v0)[1]);
    expect(v1.s).toBeGreaterThan(v0.s);
  });
});

describe('world map content', () => {
  const world = data.world;

  it('the plan has 35 places and the home: 25 story missions and 10 side quests over three acts', () => {
    const count = (act: number, kind: string) => world.places.filter((p) => p.act === act && p.kind === kind).length;
    expect([1, 2, 3].map((a) => count(a, 'story'))).toEqual([9, 8, 8]);
    expect([1, 2, 3].map((a) => count(a, 'side'))).toEqual([3, 3, 4]);
    expect(world.places.filter((p) => p.kind === 'home')).toHaveLength(1);
    expect(new Set(world.places.map((p) => p.label)).size).toBe(world.places.length); // labels are unique (the home is H)
  });

  it('every campaign node and the home have a place', () => {
    for (const n of data.campaign.nodes) expect(placeOf(world, { node: n.id }), n.id).toBeDefined();
    expect(placeOf(world, { home: true })?.kind).toBe('home');
  });

  it('the fog of an earlier act reaches down to the end of the next region', () => {
    expect(fogTop(world, 1)).toBe(62.5);
    expect(fogTop(world, 2)).toBe(31);
    expect(fogTop(world, 3)).toBeNull();
  });

  it('content:check accepts the shipped map and refuses a node without a place, two stones too close and a missing region name', () => {
    expect(validateContent(data, locales).filter((i) => i.file.startsWith('world'))).toEqual([]);
    const without = { ...data, world: { ...world, places: world.places.filter((p) => p.node !== 'ch02') } };
    expect(validateContent(without, locales).map((i) => i.message)).toContain('node ch02 has no place on the world map');
    const first = world.places[0]!;
    const crowded: WorldDef = { ...world, places: world.places.map((p, i) => (i === 1 ? { ...p, at: [first.at[0] + 1, first.at[1]] } : p)) };
    expect(validateContent({ ...data, world: crowded }, locales).map((i) => i.message).some((m) => /less than 90 px apart/.test(m))).toBe(true);
    const noName = { de: { ...locales.de }, en: { ...locales.en } };
    delete noName.en!['world.region.eisenmark'];
    expect(validateContent(data, noName).map((i) => i.message)).toContain('missing key world.region.eisenmark');
  });
});

describe('"more missions follow" hint', () => {
  it('shows only with no open node, an unfinished act and no pack loading', () => {
    expect(moreMissionsFollow(0, false, false)).toBe(true);
    expect(moreMissionsFollow(1, false, false)).toBe(false);
    expect(moreMissionsFollow(0, true, false)).toBe(false);
    expect(moreMissionsFollow(0, false, true)).toBe(false);
  });
});
