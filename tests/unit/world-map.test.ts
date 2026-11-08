import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { conditionContext, newCampaign, type WorldDef, type WorldPlace } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import { clampView, coverScale, focusView, fogAreas, fogMask, homeAt, labelOf, levelFor, mapNotice, moreMissionsFollow, pickLevel, placeOf, roadsOf, screenOf, siteImage, stepScale, stonesOf, zoomAround } from '../../src/app/screens/worldMapView';

const { data, locales } = loadContentFromDisk();
const size = [1024, 1536] as const; // the view maths take any picture size
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
  const slots = world.places.flatMap((p) => p.slots.map((s) => ({ ...s, place: p.id, act: p.act })));

  it('the v5 map comes in resolution levels up to the full source and plans 35 slots: 25 story missions and 10 side quests', () => {
    expect(world.size).toEqual([3276, 3276]);
    expect(world.levels.at(-1)).toBe(world.size[0]);
    // the prologue is a slot of Aurenhall, which lies in the region of act 3
    const count = (act: number, side: boolean) => slots.filter((s) => s.act === act && s.label.startsWith('N') === side).length;
    expect([1, 2, 3].map((a) => count(a, false))).toEqual([8, 8, 9]);
    expect([1, 2, 3].map((a) => count(a, true))).toEqual([3, 3, 4]);
    expect(new Set(slots.map((s) => s.label)).size).toBe(slots.length);
  });

  it('places the nodes of act 1 after the new order (missionsliste-s1.md)', () => {
    const at = (node: string) => placeOf(world, node)?.id;
    expect(at('prologue')).toBe('aurenhall');
    expect([at('m1_1'), at('n1')]).toEqual(['varnhold', 'varnhold']);
    expect([at('m1_2'), at('m1_3'), at('m1_4'), at('m1_5')]).toEqual(['erlbach', 'hawthorn_shrine', 'wolf_hills', 'alder_moor']);
    expect([at('m1_6'), at('m1_7'), at('m1_8')]).toEqual(['paktwacht', 'paktwacht', 'paktwacht']);
    expect([at('n2'), at('n3')]).toEqual(['border_tower', 'tobin_farm']);
    expect(labelOf(world, 'm1_7')).toBe('1-7');
    expect(labelOf(world, 'nowhere')).toBeNull();
    for (const n of data.acts[1]!.nodes) expect(placeOf(world, n.id), n.id).toBeDefined();
  });

  it('twelve places carry a town picture on their plateau', () => {
    expect(world.places.filter((p) => p.site).map((p) => p.id).sort()).toEqual(
      ['aurenhall', 'copperhall', 'crater', 'crow_holm', 'erlbach', 'greywatch', 'kontor', 'kronfeld', 'paktwacht', 'pearl_court', 'silverspring', 'varnhold'],
    );
  });

  it('the home stone stands at the camp until the castle is the home', () => {
    expect(homeAt(world, 'camp')).not.toEqual(homeAt(world, 'castle'));
  });

  it('the fog covers the areas of every later act', () => {
    const areas = (act: number) => world.regions.filter((r) => r.act === act).flatMap((r) => r.areas);
    expect(fogAreas(world, 1)).toEqual([...areas(2), ...areas(3)]);
    expect(fogAreas(world, 2)).toEqual(areas(3));
    expect(fogAreas(world, 3)).toEqual([]);
  });

  it('content:check accepts the shipped map and refuses a node without a place or placed twice, two stones too close, a bad variant and a missing region name', () => {
    expect(validateContent(data, locales).filter((i) => i.file.startsWith('world'))).toEqual([]);
    const unbind = (p: WorldPlace): WorldPlace => ({ ...p, slots: p.slots.map((s) => (s.node === 'm1_3' ? { label: s.label } : s)) });
    const without = { ...data, world: { ...world, places: world.places.map(unbind) } };
    expect(validateContent(without, locales).map((i) => i.message)).toContain('node m1_3 has no place on the world map');
    const twice: WorldDef = { ...world, places: world.places.map((p) => (p.id === 'erlbach' ? { ...p, slots: [...p.slots, { label: 'X1', node: 'm1_1' }] } : p)) };
    expect(validateContent({ ...data, world: twice }, locales).map((i) => i.message)).toContain('node m1_1 is placed twice');
    const v = world.places.find((p) => p.id === 'varnhold')!;
    const crowded: WorldDef = { ...world, places: world.places.map((p) => (p.id === 'erlbach' ? { ...p, at: [v.at[0] + 1, v.at[1]] } : p)) };
    expect(validateContent({ ...data, world: crowded }, locales).map((i) => i.message).some((m) => /varnhold and erlbach are less than/.test(m))).toBe(true);
    const badVariant: WorldDef = {
      ...world,
      places: world.places.map((p) => (p.id === 'erlbach' ? { ...p, site: { ...p.site!, variants: [{ image: 'erlbach_burnt', requires: [{ completed: 'm9_9' }] }] } } : p)),
    };
    expect(validateContent({ ...data, world: badVariant }, locales).map((i) => i.message)).toContain('erlbach: site variant 1: unknown node m9_9');
    const noName = { de: { ...locales.de }, en: { ...locales.en } };
    delete noName.en!['world.region.eisenmark'];
    expect(validateContent(data, noName).map((i) => i.message)).toContain('missing key world.region.eisenmark');
    // roads: the same pair twice in one kind (either order) is refused, a road and the flight on one pair are fine, the flight is one line
    const roads = (extra: WorldDef['roads']): string[] => validateContent({ ...data, world: { ...world, roads: [...world.roads, ...extra] } }, locales).map((i) => i.message);
    expect(roads([['erlbach', 'varnhold']])).toContain('road erlbach-varnhold: drawn twice');
    expect(roads([['aurenhall', 'aure_gorge']]).some((m) => /aurenhall-aure_gorge/.test(m))).toBe(true);
    expect(roads([['erlbach', 'hawthorn_shrine', 'escape']])).toContain('escape route breaks before erlbach');
  }, 40_000); // eight full content checks
});

describe('stones and town pictures', () => {
  const world = data.world;
  const home: [number, number] = [50, 50];

  it('one stone per place: open nodes before the one completed last, open ones fanned out', () => {
    const varnhold = placeOf(world, 'm1_1')!.at;
    expect(stonesOf(world, ['m1_1'], ['m1_1'], [], home)).toEqual([{ node: 'm1_1', at: varnhold, done: false, fan: 0 }]);
    // N1 opens at Varnhold after 1-1 is done: only the open N1 stands there
    expect(stonesOf(world, ['m1_1', 'n1'], ['n1'], ['m1_1'], home)).toEqual([{ node: 'n1', at: varnhold, done: false, fan: 0 }]);
    // both done: the one completed last
    expect(stonesOf(world, ['m1_1', 'n1'], [], ['n1', 'm1_1'], home).map((s) => s.node)).toEqual(['m1_1']);
    // two open at one place fan out
    expect(stonesOf(world, ['m1_1', 'n1'], ['m1_1', 'n1'], [], home).map((s) => s.fan)).toEqual([-0.5, 0.5]);
    // a node without a place falls back to the home stone instead of disappearing
    expect(stonesOf(world, ['ghost'], ['ghost'], [], home)).toEqual([{ node: 'ghost', at: home, done: false, fan: 0 }]);
    // done means completed: a shown node that is neither open nor completed is not drawn as done
    expect(stonesOf(world, ['m1_2'], [], [], home)[0]!.done).toBe(false);
  });

  it('a town picture takes the first variant whose conditions hold, otherwise the base picture', () => {
    const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    const erlbach = world.places.find((p) => p.id === 'erlbach')!;
    expect(siteImage(erlbach, conditionContext(data, c))).toBe('erlbach');
    const burnt: WorldPlace = { ...erlbach, site: { ...erlbach.site!, variants: [{ image: 'erlbach_burnt', requires: [{ completed: 'm1_2' }] }] } };
    expect(siteImage(burnt, conditionContext(data, c))).toBe('erlbach');
    const after = conditionContext(data, { ...c, completed: ['prologue', 'm1_1', 'm1_2'] });
    expect(siteImage(burnt, after)).toBe('erlbach_burnt');
    // a variant that failed to load falls back to the base picture, a missing base to the place sign (null)
    expect(siteImage(burnt, after, ['erlbach_burnt'])).toBe('erlbach');
    expect(siteImage(burnt, after, ['erlbach_burnt', 'erlbach'])).toBeNull();
  });

  it('the road network joins every place, without crossings and long diagonals (story 15.12)', () => {
    const at = new Map(world.places.map((p) => [p.id, p.at]));
    const roads = world.roads.filter((r) => (r[2] ?? 'road') === 'road');
    // every place reachable
    const reach = new Set([world.places[0]!.id]);
    for (let grown = true; grown; ) {
      grown = false;
      for (const [a, b] of roads)
        if (reach.has(a) !== reach.has(b)) {
          reach.add(a).add(b);
          grown = true;
        }
    }
    expect(reach.size).toBe(world.places.length);
    // no road crosses another
    const side = (p: readonly number[], q: readonly number[], r: readonly number[]) => Math.sign((q[0]! - p[0]!) * (r[1]! - p[1]!) - (q[1]! - p[1]!) * (r[0]! - p[0]!));
    for (const [i, [a, b]] of roads.entries())
      for (const [c, d] of roads.slice(i + 1)) {
        if (new Set([a, b, c, d]).size < 4) continue;
        const [pa, pb, pc, pd] = [a, b, c, d].map((id) => at.get(id)!) as Array<readonly [number, number]>;
        const crosses = side(pa!, pb!, pc!) * side(pa!, pb!, pd!) < 0 && side(pc!, pd!, pa!) * side(pc!, pd!, pb!) < 0;
        expect(crosses, `${a}-${b} × ${c}-${d}`).toBe(false);
      }
    // no road across the map: at most a quarter of its width
    for (const [a, b] of roads) expect(Math.hypot(at.get(a)![0] - at.get(b)![0], at.get(a)![1] - at.get(b)![1]), `${a}-${b}`).toBeLessThanOrEqual(26);
    // the roads of geografie-valmora.md are part of it: the pass road and the way from the Paktwacht to Varnhold
    const has = (a: string, b: string) => roads.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    expect(has('kronfeld', 'wind_gap') && has('wind_gap', 'paktwacht') && has('paktwacht', 'tobin_farm') && has('tobin_farm', 'varnhold')).toBe(true);
  });

  it('draws no road into the fog of a later act and dims roads towards places not unlocked yet', () => {
    const act1 = roadsOf(world, 1, new Set(['varnhold', 'erlbach'])).filter((r) => r.kind === 'road');
    const act1Places = new Set(world.places.filter((p) => p.act === 1).map((p) => p.at.join()));
    expect(act1.length).toBeGreaterThan(0);
    for (const r of act1) expect(act1Places.has(r.a.join()) && act1Places.has(r.b.join())).toBe(true);
    const varnhold = world.places.find((p) => p.id === 'varnhold')!.at.join();
    const erlbach = world.places.find((p) => p.id === 'erlbach')!.at.join();
    const between = act1.find((r) => [r.a.join(), r.b.join()].sort().join() === [varnhold, erlbach].sort().join())!;
    expect(between.dim).toBe(false);
    expect(act1.filter((r) => r !== between).every((r) => r.dim)).toBe(true);
    // in act 3 every road shows, except where the flight runs along it
    const flight = new Set(world.roads.filter((r) => r[2] === 'escape').map(([x, y]) => [x, y].sort().join('|')));
    const hidden = world.roads.filter((r) => (r[2] ?? 'road') === 'road' && flight.has([r[0], r[1]].sort().join('|'))).length;
    expect(roadsOf(world, 3, new Set()).length).toBe(world.roads.length - hidden);
  });

  it('draws the flight of the prologue as its own line from Aurenhall to Varnhold, through the fog and never dimmed', () => {
    const escape = world.roads.filter((r) => r[2] === 'escape');
    // one chain from Aurenhall through the Aureklamm and over the pass to Varnhold
    expect(escape[0]![0]).toBe('aurenhall');
    expect(escape.at(-1)![1]).toBe('varnhold');
    expect(escape.map((r) => r[0])).toContain('aure_gorge');
    expect(escape.map((r) => r[1])).toContain('wind_gap');
    for (const [i, r] of escape.entries()) if (i > 0) expect(r[0]).toBe(escape[i - 1]![1]);
    const all = roadsOf(world, 3, new Set());
    const drawn = all.filter((r) => r.kind === 'escape');
    expect(drawn).toHaveLength(escape.length);
    expect(drawn.every((r) => !r.dim)).toBe(true);
    // where the flight runs along a road, only the flight is drawn
    const key = (r: { a: readonly number[]; b: readonly number[] }) => [r.a.join(), r.b.join()].sort().join('|');
    const flightKeys = new Set(drawn.map(key));
    expect(all.filter((r) => r.kind === 'road' && flightKeys.has(key(r)))).toEqual([]);
  });

  it('Erlbach burns after 1-2 and Aurenhall is besieged from 3-5 on (four story missions of act 3 done)', () => {
    const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    const erlbach = world.places.find((p) => p.id === 'erlbach')!;
    const auren = world.places.find((p) => p.id === 'aurenhall')!;
    expect(siteImage(erlbach, conditionContext(data, c))).toBe('erlbach');
    expect(siteImage(erlbach, conditionContext(data, { ...c, completed: ['prologue', 'm1_1', 'm1_2'] }))).toBe('erlbach_burnt');
    // a picture not delivered yet falls back to the base picture
    expect(siteImage(erlbach, conditionContext(data, { ...c, completed: ['prologue', 'm1_1', 'm1_2'] }), ['erlbach_burnt'])).toBe('erlbach');
    const ctx = conditionContext(data, c);
    expect(siteImage(auren, ctx)).toBe('aurenhall');
    expect(siteImage(auren, { ...ctx, act: 3, storyCount: 3 })).toBe('aurenhall');
    expect(siteImage(auren, { ...ctx, act: 3, storyCount: 4 })).toBe('aurenhall_siege');
    // earlier acts never, however many missions are done (storyCount counts the missions of the loaded act's campaign)
    expect(siteImage(auren, { ...ctx, act: 2, storyCount: 20 })).toBe('aurenhall');
  });

  it('the Paktwacht is a ruin at the start and built from castle tier 1 on (story 15.12)', () => {
    const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    const pakt = world.places.find((p) => p.id === 'paktwacht')!;
    expect(siteImage(pakt, conditionContext(data, c))).toBe('paktwacht');
    // after 1-6 the home is the castle, still a ruin (art direction §7)
    const castle = { ...c, completed: ['prologue', 'm1_1', 'm1_6'], home: { ...c.home, kind: 'castle' as const } };
    expect(siteImage(pakt, conditionContext(data, castle))).toBe('paktwacht');
    const firstTier = data.balance.castle.tierAt[0]!;
    const room = Object.keys(data.rooms)[0]!;
    const built = { ...castle, home: { ...castle.home, rooms: { [room]: 1 + firstTier } } };
    expect(siteImage(pakt, conditionContext(data, built))).toBe('paktwacht_built');
    expect(siteImage(pakt, conditionContext(data, built), ['paktwacht_built'])).toBe('paktwacht');
  });

  it('the fog mask is dense inside its areas, clear outside, soft at the edge and dense along the picture border', () => {
    const top: Array<[number, number]> = [[0, 0], [100, 0], [100, 50], [0, 50]];
    const n = 40;
    const m = fogMask([top], n, 2);
    const at = (x: number, y: number) => m[y * n + x]!;
    expect(at(20, 5)).toBeCloseTo(1); // deep inside
    expect(at(0, 0)).toBeCloseTo(1); // the corner stays dense (clamped edge)
    expect(at(20, 35)).toBeCloseTo(0); // far outside
    expect(at(20, 19)).toBeGreaterThan(0.5); // just inside the edge
    expect(at(20, 20)).toBeLessThan(0.5); // just outside
    expect(at(20, 20)).toBeGreaterThan(0);
    expect(fogMask([top], n, 0)[25 * n]).toBe(0);
    expect(fogMask([], n, 2).every((v) => v === 0)).toBe(true);
  });

  it('the stone layer sits in picture pixels times the scale and moves by the view offset', () => {
    const v = { x: -120, y: 40, s: 0.3 };
    const [lx, ly] = screenOf({ x: 0, y: 0, s: v.s }, size, [25, 50]);
    expect(screenOf(v, size, [25, 50])).toEqual([lx + v.x, ly + v.y]);
  });

  it('loads the smallest level that is not upscaled, the largest when none is big enough', () => {
    expect(pickLevel([1024, 2048, 3276], 900)).toBe(1024);
    expect(pickLevel([1024, 2048, 3276], 2048)).toBe(2048);
    expect(pickLevel([1024, 2048, 3276], 2400)).toBe(3276);
    expect(pickLevel([1024, 2048, 3276], 5000)).toBe(3276);
  });

  it('the loading notice: gone once the overview or the sharp level shows, "missing" only when both failed', () => {
    expect(mapNotice('loading', 'loading')).toBe('loading');
    expect(mapNotice('ready', 'loading')).toBeNull();
    expect(mapNotice('loading', 'ready')).toBeNull();
    expect(mapNotice('failed', 'loading')).toBe('loading');
    expect(mapNotice('failed', 'ready')).toBeNull();
    expect(mapNotice('failed', 'failed')).toBe('missing');
  });
});

describe('world map assets and zoom', () => {
  const world = data.world;
  const v5 = JSON.parse(readFileSync('art/world/map_places_v5.json', 'utf8')) as {
    size: [number, number];
    places: Array<{ id: string; site?: { x: number; bottom: number; width: number } }>;
  };
  const pc = (v: number) => (v / 1254) * 100;

  it('the town pictures match art/world/map_places_v5.json, from which tools/art/build.py builds them', () => {
    const withSite = v5.places.filter((p) => p.site);
    expect(world.places.filter((p) => p.site).map((p) => p.id).sort()).toEqual(withSite.map((p) => p.id).sort());
    for (const j of withSite) {
      const site = world.places.find((p) => p.id === j.id)!.site!;
      expect(site.foot[0], j.id).toBeCloseTo(pc(j.site!.x), 1);
      expect(site.foot[1], j.id).toBeCloseTo(pc(j.site!.bottom), 1);
      expect(site.width, j.id).toBeCloseTo(pc(j.site!.width), 1);
    }
    expect(world.size).toEqual(v5.size);
  });

  it('the build writes the levels the map asks for', () => {
    const build = readFileSync('tools/art/build.py', 'utf8');
    expect(build).toContain(`WORLD_LEVELS = [${world.levels.join(', ')}] `);
    expect(build).toContain(`f'${world.image}_{w}'`);
    expect(build).toContain(`'${world.image}' if i == 0`);
  });

  it('every town picture variant has a source in map_places_v5.json, so the build writes it', () => {
    const json = JSON.parse(readFileSync('art/world/map_places_v5.json', 'utf8')) as { places: Array<{ id: string; site?: { variants?: Array<{ id: string }> } }> };
    for (const p of world.places)
      for (const v of p.site?.variants ?? [])
        expect(json.places.find((j) => j.id === p.id)?.site?.variants?.map((x) => x.id), `${p.id}: ${v.image}`).toContain(v.image);
  });

  it('on a phone the overview covers the screen and the near zoom with a tap stays within 1.1 × the source at DPR 3', () => {
    const { zoomSteps, focusZoom } = data.render.worldMap;
    const square = world.size;
    expect(stepScale(phone, square, zoomSteps, 0)).toBeCloseTo((phone.w * zoomSteps[0]!) / square[0]); // the step itself, not the cover clamp
    expect(phone.w * zoomSteps[0]!).toBeGreaterThanOrEqual(phone.h); // a square picture: the overview step covers the height
    const nearDevicePx = stepScale(phone, square, zoomSteps, 1, focusZoom) * square[0] * 3;
    expect(nearDevicePx / square[0]).toBeLessThanOrEqual(1.1);
    // the level the screen loads (story 15.12): the full source at DPR 3, and never more than 1.1 × upscaled at DPR 1–3
    expect(levelFor(world, phone, data.render.worldMap, 3)).toBe(square[0]);
    for (const dpr of [1, 1.5, 2, 2.625, 3]) {
      const lv = levelFor(world, phone, data.render.worldMap, dpr);
      expect((stepScale(phone, square, zoomSteps, 1, focusZoom) * square[0] * dpr) / lv, `DPR ${dpr}`).toBeLessThanOrEqual(1.1);
    }
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
