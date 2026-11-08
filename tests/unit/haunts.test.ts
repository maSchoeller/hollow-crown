import { describe, expect, it } from 'vitest';
import { applyCampaign, hash32, hauntMapId, newCampaign, normalizeCampaign, replayCampaign, staleHauntMap, withoutStaleHauntBattle, type CampaignCommand, type CampaignEvent, type CampaignState, type GameData, type MapDef } from '../../src/core';
import { hauntPoolsSchema } from '../../src/content/schemaCampaign';
import { hauntAnchorSchema } from '../../src/content/schemaMap';
import { validateContent } from '../../src/content/validate';
import { loadContentFromDisk } from '../../src/content/node';
import { areaTiles } from '../../src/core/util';

const { data, locales } = loadContentFromDisk();
const HASK = { met: true, encounters: 1, grudge: 0, routs: 1, signatureDropped: false };

/** A campaign that has met Hask and finished P, 1-1 and 1-2 (the prologue has no anchors: noHaunts), on `difficulty`. */
function ready(d: GameData = data, difficulty: 'easy' | 'normal' | 'hard' = 'normal', seed = 7): CampaignState {
  const c = newCampaign(d, seed, { difficulty, deathMode: 'standard' } as never, { name: 'Rhen', portrait: 'avatar_a' } as never);
  return { ...c, completed: ['prologue', 'm1_1', 'm1_2'], lieutenants: { hask: { ...HASK } } };
}

/** `data` with `n` more story nodes on aliases of map 1-1, so that more maps have anchors. */
function bigData(n: number, patch?: (m: MapDef) => void): GameData {
  const base = data.maps.m1_1_steckbriefe!;
  const maps = { ...data.maps };
  const nodes = [...data.acts[1]!.nodes];
  for (let i = 0; i < n; i++) {
    const m = { ...structuredClone(base), id: `x${i}_map` };
    patch?.(m);
    maps[m.id] = m;
    nodes.push({ ...data.acts[1]!.nodes.find((x) => x.id === 'm1_1')!, id: `x${i}`, map: m.id, requires: [] });
  }
  return { ...data, maps, acts: { ...data.acts, 1: { ...data.acts[1]!, nodes } } };
}
const withAll = (c: CampaignState, d: GameData): CampaignState => ({ ...c, completed: d.acts[1]!.nodes.filter((n) => n.kind === 'story' && n.id.startsWith('x')).map((n) => n.id).concat(c.completed) });

const advance = (d: GameData, c: CampaignState, day: number) => applyCampaign(d, c, { type: 'advanceDay', day });
const spawned = (events: CampaignEvent[]) => events.flatMap((e) => (e.t === 'hauntSpawned' ? [e] : []));

describe('hash32', () => {
  it('is deterministic and spreads neighbours', () => {
    expect(hash32(7, 100)).toBe(hash32(7, 100));
    expect(new Set([hash32(7, 100), hash32(7, 101), hash32(8, 100), hash32(100, 7)]).size).toBe(4);
    expect(hash32(-1, -1)).toBeGreaterThanOrEqual(0);
  });
});

describe('haunt generator (story 5.5)', () => {
  it('makes the same haunts from the same seed and day', () => {
    const a = advance(data, ready(), 100);
    const b = advance(data, ready(), 100);
    expect(a.campaign.haunts).toEqual(b.campaign.haunts);
    expect(a.campaign.haunts.length).toBeGreaterThan(0);
    // a different day or seed gives other haunts somewhere
    const days = [101, 102, 103, 104].map((d) => JSON.stringify(advance(data, ready(), d).campaign.haunts));
    expect(new Set([...days, JSON.stringify(a.campaign.haunts)]).size).toBeGreaterThan(1);
  });

  it('replays from the journal', () => {
    const start = ready();
    const log: CampaignCommand[] = [100, 101, 105].map((day) => ({ type: 'advanceDay', day }));
    let c = start;
    for (const cmd of log) c = applyCampaign(data, c, cmd).campaign;
    expect(replayCampaign(data, start, log).haunts).toEqual(c.haunts);
  });

  it('makes 1 to 3 haunts per packet, never two on one map', () => {
    const d = bigData(4);
    const seen = new Set<number>();
    for (let day = 100; day < 160; day++) {
      const r = advance(d, withAll(ready(d, 'normal', day), d), day);
      const n = r.campaign.haunts.length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
      expect(new Set(r.campaign.haunts.map((h) => h.map)).size).toBe(n);
      seen.add(n);
    }
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('is limited by the candidates: only completed story maps with an anchor, none twice', () => {
    const c = ready();
    for (let day = 100; day < 120; day++) {
      const r = advance(data, { ...c, haunts: [] }, day);
      expect(r.campaign.haunts.length).toBeLessThanOrEqual(2);
      for (const h of r.campaign.haunts) expect(['m1_1_steckbriefe', 'm1_2_erlbach']).toContain(h.map);
    }
    // nothing finished, nothing haunted
    expect(advance(data, { ...c, completed: [] }, 100).campaign.haunts).toEqual([]);
    // a map that is haunted already is left alone
    const r1 = advance(data, c, 100).campaign;
    const r2 = advance(data, r1, 101).campaign;
    expect(r2.haunts.length).toBeLessThanOrEqual(2);
    expect(new Set(r2.haunts.map((h) => h.map)).size).toBe(r2.haunts.length);
  });

  it('does not repeat the variant played last, unless a map has only one anchor', () => {
    const last = { m1_2_erlbach: 'rout', m1_1_steckbriefe: 'defend' };
    for (let day = 100; day < 140; day++) {
      const r = advance(data, { ...ready(), hauntLast: last }, day);
      for (const h of r.campaign.haunts) expect(h.variant).not.toBe(last[h.map as keyof typeof last]);
    }
    const one = bigData(0, undefined);
    one.maps.m1_1_steckbriefe = { ...one.maps.m1_1_steckbriefe!, haunts: [one.maps.m1_1_steckbriefe!.haunts![0]!] };
    const only = one.maps.m1_1_steckbriefe!.haunts![0]!.variant;
    const hs = [100, 101, 102, 103, 104, 105].flatMap((day) => advance(one, { ...ready(one), completed: ['m1_1'], hauntLast: { m1_1_steckbriefe: only } }, day).campaign.haunts);
    expect(hs.length).toBeGreaterThan(0);
    expect(hs.every((h) => h.variant === only)).toBe(true);
  });

  it('never picks a lieutenant who joined the company', () => {
    const lts = new Set<string>();
    for (let day = 100; day < 200; day++) {
      const all = Object.fromEntries(['hask', 'morra', 'ulvric', 'grosk'].map((id) => [id, { ...HASK }]));
      const c = { ...ready(), lieutenants: all, flags: { joined_grosk: true as const } };
      for (const h of advance(data, c, day).campaign.haunts) lts.add(h.lt);
    }
    expect(lts.has('grosk')).toBe(false);
    expect([...lts].sort()).toEqual(['hask', 'morra', 'ulvric']);
  });

  it('only lets a lieutenant lead a haunt whom the company has met', () => {
    const lts = new Set<string>();
    for (let day = 100; day < 200; day++) {
      const c = { ...ready(), lieutenants: { hask: { ...HASK }, morra: { ...HASK, met: false } } };
      for (const h of advance(data, c, day).campaign.haunts) lts.add(h.lt);
    }
    expect([...lts]).toEqual(['hask']);
  });

  it('lets the oldest lapse beyond maxOpen', () => {
    const d = bigData(10);
    expect(d.balance.haunt.maxOpen).toBe(6);
    let c = withAll(ready(d), d);
    const ids: string[] = [];
    const expired: string[] = [];
    for (let day = 100; day < 120; day++) {
      const r = advance(d, c, day);
      c = r.campaign;
      ids.push(...spawned(r.events).map((e) => e.id));
      for (const e of r.events) if (e.t === 'hauntExpired') expired.push(e.id);
      expect(c.haunts.length).toBeLessThanOrEqual(6);
    }
    expect(expired.length).toBeGreaterThan(0);
    // oldest first, and what lapsed is gone while the newest stay
    expect(expired).toEqual(ids.slice(0, expired.length));
    expect(c.haunts.map((h) => h.id)).toEqual(ids.slice(expired.length));
    expect(c.haunts.length).toBe(6);
  });

  it('reports the made haunts in dayAdvanced', () => {
    const r = advance(data, ready(), 100);
    const ev = r.events.find((e) => e.t === 'dayAdvanced');
    expect(ev).toMatchObject({ day: 100, packets: [100], haunts: r.campaign.haunts.length });
    expect(spawned(r.events).length).toBe(r.campaign.haunts.length);
    expect(r.campaign.day.pending).toEqual([]);
  });

  it('makes nothing when the clock goes back', () => {
    const c = advance(data, ready(), 100).campaign;
    const r = advance(data, c, 99);
    expect(r.campaign.haunts).toEqual(c.haunts);
    expect(r.events).toEqual([]);
  });

  it('makes the first haunts straight after the first meeting (day stays open until then)', () => {
    const c: CampaignState = { ...ready(), lieutenants: undefined };
    const before = advance(data, c, 100);
    expect(before.campaign.day.last).toBeNull();
    expect(before.campaign.haunts).toEqual([]);
    const after = advance(data, { ...before.campaign, lieutenants: { hask: { ...HASK } } }, 100);
    expect(after.campaign.day.last).toBe(100);
    expect(after.campaign.haunts.length).toBeGreaterThan(0);
  });

  describe('enemies', () => {
    const places = (m: MapDef, anchor: { max?: number }) => Math.max(5, anchor.max ?? m.deploy.max);
    it('are places + 2 including the lieutenant (easy -1, hard +1), on their spawn area', () => {
      const d = bigData(6);
      for (const [diff, delta] of [['easy', -1], ['normal', 0], ['hard', 1]] as const) {
        let checked = 0;
        for (let day = 100; day < 130; day++) {
          const c = advance(d, withAll(ready(d, diff, day), d), day).campaign;
          for (const h of c.haunts) {
            const m = d.maps[h.map]!;
            const a = m.haunts!.find((x) => x.variant === h.variant)!;
            expect(h.enemies.length).toBe(places(m, a) + 2 + delta);
            expect(h.enemies.filter((e) => e.lieutenant).map((e) => e.lieutenant)).toEqual([h.lt]);
            const ats = h.enemies.map((e) => `${e.at}`);
            expect(new Set(ats).size).toBe(ats.length);
            const spawn = new Set(areaTiles(a.enemySpawn).map((p) => `${p}`));
            for (const e of h.enemies) {
              if (e.lieutenant && ['boss', 'rout', 'treasure'].includes(h.variant)) expect(e.at).toEqual(a.target.at);
              else expect(spawn.has(`${e.at}`)).toBe(true);
              if (e.lieutenant) expect(Object.keys(e).sort()).toEqual(['at', 'lieutenant']);
              else {
                expect(e.sprite).toBeTruthy();
                expect(e.nameKey).toBeTruthy();
                expect(e.level).toBeGreaterThanOrEqual(1);
              }
            }
            expect(h.new).toBe(true);
            checked++;
          }
        }
        expect(checked).toBeGreaterThan(10);
      }
    });

    it('take their class and kit from the pool of the lieutenant\'s faction, at the expected army level', () => {
      const c = advance(data, ready(), 100).campaign;
      const pool = data.hauntPools[1]!.factions.border_bands!;
      expect(c.haunts.length).toBeGreaterThan(0);
      for (const h of c.haunts) {
        expect(h.level).toBe(data.acts[1]!.nodes.find((n) => n.id === 'm1_2')!.expectedLevel);
        for (const e of h.enemies.filter((x) => !x.lieutenant)) {
          const t = pool.find((p) => p.class === e.class && p.sprite === e.sprite)!;
          expect(t).toBeDefined();
          expect(e.items).toEqual(t.items);
          expect(e.level).toBe(h.level);
        }
      }
    });
  });
});

describe('haunt content', () => {
  it('shipped anchors and pools pass content:check', () => {
    expect(validateContent(data, locales).map((i) => i.message)).toEqual([]);
    expect(data.maps.m1_2_erlbach!.haunts!.length).toBeGreaterThanOrEqual(2);
    expect(data.maps.m1_1_steckbriefe!.haunts!.length).toBeGreaterThanOrEqual(2);
  });

  it('schema asks each variant for its fields', () => {
    const base = { target: { at: [1, 1] }, enemySpawn: { rect: [0, 0, 2, 2] }, deploy: { rect: [0, 5, 2, 6] } };
    const ok = (a: object) => hauntAnchorSchema.safeParse({ ...base, ...a }).success;
    expect(ok({ variant: 'boss' })).toBe(true);
    expect(ok({ variant: 'rout' })).toBe(true);
    expect(ok({ variant: 'defend', turns: 8 })).toBe(true);
    expect(ok({ variant: 'defend' })).toBe(false);
    expect(ok({ variant: 'treasure', turns: 10, chests: [[2, 3]] })).toBe(true);
    expect(ok({ variant: 'treasure', turns: 10 })).toBe(false);
    expect(ok({ variant: 'treasure', turns: 10, chests: [] })).toBe(false);
    expect(ok({ variant: 'escort', exit: { rect: [0, 7, 1, 7] } })).toBe(true);
    expect(ok({ variant: 'escort', exit: { rect: [0, 7, 1, 7] }, turns: 9 })).toBe(true);
    expect(ok({ variant: 'escort' })).toBe(false);
    expect(ok({ variant: 'boss', exit: { rect: [0, 7, 1, 7] } })).toBe(false);
    expect(ok({ variant: 'boss', chests: [[1, 2]] })).toBe(false);
    expect(ok({ variant: 'boss', turns: 5 })).toBe(false);
    expect(ok({ variant: 'ambush' })).toBe(false);
  });

  it('schema asks pools for whole shares and one-piece chest loot', () => {
    const pool = { factions: { f: [{ class: 'brigand', sprite: 'brigand', nameKey: 'k', items: [], share: 100 }] }, civilian: { class: 'healer', nameKey: 'k' }, chestLoot: [{ gold: 5 }] };
    expect(hauntPoolsSchema.safeParse(pool).success).toBe(true);
    expect(hauntPoolsSchema.safeParse({ ...pool, chestLoot: [{ gold: 5, item: { def: 'vulnerary' } }] }).success).toBe(false);
    expect(hauntPoolsSchema.safeParse({ ...pool, chestLoot: [] }).success).toBe(false);
  });

  const problems = (d: GameData) => validateContent(d, locales).map((i) => i.message);
  const patched = (patch: (m: MapDef) => void): GameData => {
    const m = structuredClone(data.maps.m1_1_steckbriefe!);
    patch(m);
    return { ...data, maps: { ...data.maps, m1_1_steckbriefe: m } };
  };
  const walledIn = (m: MapDef, x: number, y: number): void => {
    // wall the four neighbours of a tile with the building char so that nobody can get there
    const rows = m.terrain.split('\n');
    const set = (px: number, py: number) => {
      const row = rows[py];
      if (row !== undefined && px >= 0 && px < row.length) rows[py] = row.slice(0, px) + 'B' + row.slice(px + 1);
    };
    set(x - 1, y);
    set(x + 1, y);
    set(x, y - 1);
    set(x, y + 1);
    m.terrain = rows.join('\n');
  };

  it('content:check reports a target that cannot be reached', () => {
    const boss = (m: MapDef) => m.haunts!.find((a) => a.variant === 'boss')!;
    const d = patched((m) => walledIn(m, boss(m).target.at[0], boss(m).target.at[1]));
    expect(problems(d).filter((p) => /haunts boss: target not reachable on foot from deploy field/.test(p)).length).toBeGreaterThan(0);
  });

  it('content:check reports an unreachable chest and exit', () => {
    const d = patched((m) => {
      m.haunts = [
        { variant: 'treasure', target: { at: [6, 1] }, enemySpawn: { rect: [3, 2, 10, 3] }, deploy: { rect: [5, 13, 8, 14] }, turns: 8, chests: [[1, 6]] },
        { variant: 'escort', target: { at: [6, 13] }, enemySpawn: { rect: [0, 3, 2, 5] }, deploy: { rect: [4, 9, 9, 9] }, exit: { rect: [7, 0, 7, 0] } },
      ];
      walledIn(m, 1, 6);
      walledIn(m, 7, 0);
    });
    const p = problems(d);
    expect(p.some((x) => /haunts treasure: chest 0 not reachable/.test(x))).toBe(true);
    expect(p.some((x) => /haunts escort: exit not reachable/.test(x))).toBe(true);
  });

  it('content:check reports bad fields, too few places and an anchor twice', () => {
    const p = problems(
      patched((m) => {
        const a = m.haunts!;
        a[0]!.target.at = [50, 50];
        a[1]!.deploy = { rect: [6, 15, 6, 15] }; // 1 field for 5 places (haunt.minPlaces)
        a[2]!.enemySpawn = { rect: [1, 3, 1, 3] }; // 1 spawn field
        a.push({ ...a[1]! });
      }),
    );
    expect(p.some((x) => /target \[50,50\] out of bounds|target 50,50 out of bounds/.test(x))).toBe(true);
    expect(p.some((x) => /1 deploy fields for 5 places/.test(x))).toBe(true);
    expect(p.some((x) => /1 spawn fields for 8 foes on hard/.test(x))).toBe(true);
    expect(p.some((x) => /listed twice \(one anchor per variant\)/.test(x))).toBe(true);
  });

  it('content:check reports target in the deploy area and pools that do not add up', () => {
    const p1 = problems(patched((m) => (m.haunts![0]!.deploy = { rect: [6, 9, 8, 9] })));
    expect(p1.some((x) => /target .* lies in deploy or enemySpawn/.test(x))).toBe(true);
    const bad = structuredClone(data.hauntPools[1]!);
    bad.factions.border_bands![0]!.share = 30;
    bad.factions.border_bands![1]!.class = 'nope';
    bad.civilian.class = 'nope';
    const p2 = problems({ ...data, hauntPools: { 1: bad } });
    expect(p2.some((x) => /shares add up to 90, expected 100/.test(x))).toBe(true);
    expect(p2.some((x) => /unknown class nope/.test(x))).toBe(true);
    expect(p2.some((x) => /civilian: unknown class nope/.test(x))).toBe(true);
    // a lieutenant faction without a pool
    expect(problems({ ...data, hauntPools: { 1: { ...bad, factions: {} } } }).some((x) => /no haunt pool for faction border_bands in act 1/.test(x))).toBe(true);
  });
});

describe('maps with noHaunts (GDD log 2026-11-06): prologue, 1-6 and 1-7 are never haunted', () => {
  /** the anchors the prologue had until 2026-11-06 */
  const OLD: NonNullable<MapDef['haunts']> = [
    { variant: 'rout', target: { at: [6, 7] }, enemySpawn: { rect: [5, 1, 8, 3] }, deploy: { rect: [4, 12, 9, 13] } },
    { variant: 'boss', target: { at: [6, 15] }, enemySpawn: { rect: [4, 12, 9, 13] }, deploy: { rect: [5, 1, 8, 2] } },
    { variant: 'defend', target: { at: [6, 1] }, enemySpawn: { rect: [4, 10, 9, 11] }, deploy: { rect: [5, 2, 8, 3] }, turns: 8 },
  ];
  const withOld = (noHaunts: boolean): GameData => ({ ...data, maps: { ...data.maps, prologue_paktnacht: { ...data.maps.prologue_paktnacht!, noHaunts, haunts: OLD } } });
  const prologueDays = (d: GameData) => {
    const days: number[] = [];
    for (let day = 100; day < 160; day++) if (advance(d, ready(d), day).campaign.haunts.some((h) => h.map === 'prologue_paktnacht')) days.push(day);
    return days;
  };

  it('prologue, 1-6 and 1-7 have noHaunts and no anchors; the other story maps of act 1 keep theirs', () => {
    for (const id of ['prologue_paktnacht', 'm1_6_paktwacht', 'm1_7_gewoelbe']) {
      expect(data.maps[id]!.noHaunts, id).toBe(true);
      expect(data.maps[id]!.haunts ?? [], id).toEqual([]);
    }
    for (const id of ['m1_1_steckbriefe', 'm1_2_erlbach', 'm1_3_silberbach', 'm1_4_wolfslager', 'm1_5_hungerlager']) expect(data.maps[id]!.haunts!.length, id).toBeGreaterThanOrEqual(2);
  });

  it('the dice never pick 1-6 or 1-7 once they are done, even with anchors left in the data (the flag decides)', () => {
    // 1-8 never had anchors; 1-6 and 1-7 get the anchors of 1-1 back for this test, flag on and off
    const anchored = (noHaunts: boolean): GameData => ({
      ...data,
      maps: { ...data.maps, ...Object.fromEntries(['m1_6_paktwacht', 'm1_7_gewoelbe'].map((id) => [id, { ...data.maps[id]!, noHaunts, haunts: data.maps.m1_1_steckbriefe!.haunts }])) },
    });
    const maps = (d: GameData) => {
      const all = { ...ready(d), completed: d.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id) };
      const seen = new Set<string>();
      for (let day = 100; day < 160; day++) for (const h of advance(d, all, day).campaign.haunts) seen.add(h.map);
      return seen;
    };
    expect([...maps(anchored(false))]).toEqual(expect.arrayContaining(['m1_6_paktwacht', 'm1_7_gewoelbe']));
    for (const d of [data, anchored(true)]) for (const id of ['prologue_paktnacht', 'm1_6_paktwacht', 'm1_7_gewoelbe', 'm1_8_paktwacht_halten']) expect(maps(d).has(id), id).toBe(false);
  });

  it('an open 1-6 or 1-7 haunt of an old save lapses on load, with its hauntLast', () => {
    const d: GameData = { ...data, maps: { ...data.maps, m1_6_paktwacht: { ...data.maps.m1_6_paktwacht!, noHaunts: false, haunts: data.maps.m1_1_steckbriefe!.haunts } } };
    const c = { ...ready(d), completed: d.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id) };
    const day = [...Array(60).keys()].map((i) => 100 + i).find((n) => advance(d, c, n).campaign.haunts.some((h) => h.map === 'm1_6_paktwacht'))!;
    const old = { ...advance(d, c, day).campaign, hauntLast: { m1_6_paktwacht: 'boss', m1_7_gewoelbe: 'rout', m1_2_erlbach: 'rout' } };
    const h = old.haunts.find((x) => x.map === 'm1_6_paktwacht')!;
    const now = normalizeCampaign(data, old);
    expect(now.haunts.some((x) => x.map === 'm1_6_paktwacht')).toBe(false);
    expect(now.haunts.length).toBe(old.haunts.length - 1);
    expect(now.hauntLast).toEqual({ m1_2_erlbach: 'rout' });
    expect(staleHauntMap(data, hauntMapId(h.map, h.variant, h.lt))).toBe(true);
  });

  it('the dice never pick the prologue, also on the days that hit it with the old anchors', () => {
    const hit = prologueDays(withOld(false));
    expect(hit.length).toBeGreaterThan(5);
    expect(prologueDays(data)).toEqual([]);
    for (const day of hit) expect(advance(data, ready(), day).campaign.haunts.length).toBeGreaterThan(0);
    // the flag alone keeps the dice off the map, even with anchors left in the data
    expect(prologueDays(withOld(true))).toEqual([]);
  });

  it('content:check refuses haunt anchors on a map with noHaunts', () => {
    expect(validateContent(withOld(true), locales).map((i) => i.message)).toContain('haunts: the map has noHaunts (it is never haunted), it takes no haunt anchors');
    expect(validateContent(withOld(false), locales).some((i) => /noHaunts/.test(i.message))).toBe(false);
  });

  it('an open prologue haunt of an old save lapses on load, the others stay; its running battle is stale', () => {
    const d = withOld(false);
    // a day whose packet haunts the prologue and another map
    const day = prologueDays(d).find((n) => advance(d, ready(d), n).campaign.haunts.length > 1)!;
    const old = { ...advance(d, ready(d), day).campaign, hauntLast: { prologue_paktnacht: 'rout', m1_1_steckbriefe: 'boss' } };
    const gone = old.haunts.find((h) => h.map === 'prologue_paktnacht')!;
    const kept = old.haunts.filter((h) => h.map !== 'prologue_paktnacht');
    expect(kept.length).toBeGreaterThan(0);
    const now = normalizeCampaign(data, old);
    expect(now.haunts).toEqual(kept);
    expect(now.hauntLast).toEqual({ m1_1_steckbriefe: 'boss' });
    expect(staleHauntMap(data, hauntMapId(gone.map, gone.variant, gone.lt))).toBe(true);
    for (const h of kept) expect(staleHauntMap(data, hauntMapId(h.map, h.variant, h.lt))).toBe(false);
    // a map that is not loaded yet (a pack on its way) keeps its haunt
    expect(normalizeCampaign({ ...data, maps: {} }, old).haunts).toEqual(old.haunts);
    expect(staleHauntMap(data, 'm1_1_steckbriefe')).toBe(false);
  });

  it('a haunt whose anchor was taken off a map that stays lapses too', () => {
    expect(data.maps.m1_1_steckbriefe!.haunts!.some((a) => a.variant === 'rout')).toBe(false);
    expect(staleHauntMap(data, hauntMapId('m1_1_steckbriefe', 'rout', 'hask'))).toBe(true);
    expect(staleHauntMap(data, hauntMapId('m1_1_steckbriefe', 'boss', 'hask'))).toBe(false);
  });

  it('a save with a running prologue haunt battle loads without it, a battle on a map that keeps its anchor stays', () => {
    const save = (mapId: string) => ({ campaign: ready(), screen: 'battle', battle: { start: { mapId }, commands: [] } });
    expect(withoutStaleHauntBattle(data, save(hauntMapId('prologue_paktnacht', 'rout', 'hask')))).toEqual({ campaign: ready(), screen: 'battle' });
    for (const id of [hauntMapId('m1_2_erlbach', 'rout', 'hask'), 'prologue_paktnacht', 'm1_1_steckbriefe']) expect(withoutStaleHauntBattle(data, save(id)).battle).toBeDefined();
  });
});
