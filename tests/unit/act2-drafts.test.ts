/**
 * Format leftovers of the act-2 drafts (story 11.10): every draft `concept/27-ueberarbeitung/levels/s2_*.yaml` passes the checks of
 * content:check (open content of later stories aside), and the changing maps run on `set_terrain`, levers and triggers of the draft
 * itself: rockfall (2-2), fire and firebreak (2-4), the cut bridge (2-5), ebb and flood (2-6, N6), the crane walk (2-7) and the
 * bridge gate (2-8). Warnings before a change, conditional forced deploy, lieutenants with `requires` and guests on drafts and on
 * `tests/fixtures/maps/dev_terrain_warn.yaml`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { checkDrafts, draftAct } from '../../src/content/drafts';
import { buildContent } from '../../src/content/load';
import { loadContentFromDisk, readContentFiles } from '../../src/content/node';
import { readPacks } from '../../tools/build/packs-plugin';
import { releasedIdSets } from '../../tools/build/lockIds';
import { mapSchema } from '../../src/content/schemaMap';
import { validateContent } from '../../src/content/validate';
import {
  applyCommand,
  beginPhase,
  createBattle,
  finishBattle,
  newCampaign,
  presentForced,
  runTriggers,
  startBattle,
  terrainAt,
  terrainWarnings,
  type BattleState,
  type CampaignState,
  type GameData,
  type GameEvent,
  type MapDef,
  type Pos,
  type Team,
} from '../../src/core';

const dir = 'concept/27-ueberarbeitung/levels';
const files = readdirSync(dir).filter((f) => draftAct(f) === 2).sort();
let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];
const added: string[] = [];

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});
afterEach(() => {
  for (const id of added.splice(0)) {
    delete data.maps[id];
    data.campaign = { ...data.campaign, nodes: data.campaign.nodes.filter((n) => n.id !== id) };
  }
});

const campaign = (): CampaignState =>
  newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });

/** Adds a map (a draft or a fixture) and a node that plays it; undone after the test. */
function addMap(file: string, act = 2): MapDef {
  const map = { ...mapSchema.parse(parse(readFileSync(file, 'utf8'))), act } as MapDef;
  data.maps[map.id] = map;
  const first = data.campaign.nodes[0]!;
  data.campaign = { ...data.campaign, nodes: [...data.campaign.nodes, { ...first, id: map.id, map: map.id, pre: undefined, post: undefined }] };
  added.push(map.id);
  return map;
}
function battle(file: string, c = campaign()): BattleState {
  const map = addMap(file.includes('/') ? file : join(dir, file));
  return startBattle(data, createBattle(data, c, map.id, [])).state;
}
/** The start of `phase` in round `turn`: reinforcements and triggers of that moment. */
function phaseStart(s: BattleState, turn: number, phase: Team): GameEvent[] {
  const events: GameEvent[] = [];
  s.turn = turn;
  beginPhase(data, s, phase, events);
  return events;
}
const terrains = (s: BattleState, tiles: Pos[]) => tiles.map((p) => terrainAt(s, p));
const rect = (x0: number, y0: number, x1: number, y1: number): Pos[] => {
  const out: Pos[] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};

describe('act-2 drafts in content:check', () => {
  it('finds the drafts of act 2 and none of them has a format issue', () => {
    expect(files.map((f) => f.replace(/\.yaml$/, ''))).toEqual([
      's2_2_1_windscharte',
      's2_2_2_salzpass',
      's2_2_3_rabenweide',
      's2_2_4_brandschneise',
      's2_2_5_silberquell',
      's2_2_6_kraehenholm',
      's2_2_7_kontor',
      's2_2_8_kronfeld',
      's2_n4_clan',
      's2_n5_mine',
      's2_n6_gaukler',
    ]);
    const raw = Object.fromEntries(files.map((f) => [f, parse(readFileSync(join(dir, f), 'utf8'))]));
    const results = checkDrafts(data, locales, raw);
    expect(results.flatMap((r) => r.issues.map((i) => `${r.file}: ${i.message}`))).toEqual([]);
    // what the mission stories still write is counted, not hidden: scenes, figures, lieutenants, names
    expect(results.every((r) => r.open.length > 0)).toBe(true);
  });

  it('reports a format issue of a draft and keeps open content apart', () => {
    const raw = parse(readFileSync(join(dir, 's2_2_2_salzpass.yaml'), 'utf8')) as { triggers: { then: unknown[] }[] };
    const broken = structuredClone(raw);
    broken.triggers[0]!.then.push({ action: 'set_terrain', area: { tiles: [[0, 0]] }, terrain: 'lava' });
    const [r] = checkDrafts(data, locales, { 's2_x.yaml': broken });
    expect(r!.issues.map((i) => i.message)).toContain('t_rock1: set_terrain to unknown terrain lava');
    expect(r!.open.some((i) => i.message.includes('unknown scene'))).toBe(true);
    const [bad] = checkDrafts(data, locales, { 's2_y.yaml': { id: 'x' } });
    expect(bad!.issues.length).toBeGreaterThan(0);
    const [dup] = checkDrafts(data, locales, { 's2_z.yaml': { ...raw, id: Object.keys(data.maps)[0] } });
    expect(dup!.issues[0]!.message).toContain('already content');
    expect(draftAct('muster_mittel_20x25.yaml')).toBeUndefined();
    // no act in the name is an issue, not act 1; two drafts with one map id are an issue
    expect(checkDrafts(data, locales, { 'muster.yaml': raw })[0]!.issues[0]!.message).toContain('s<act>_');
    const twice = checkDrafts(data, locales, { 's2_a.yaml': raw, 's2_b.yaml': raw });
    expect(twice[1]!.issues[0]!.message).toBe('map id s2_2_2_salzpass is also the id of the draft s2_a.yaml');
  });

  it('counts only missing content as open, never the format', () => {
    const map = structuredClone(parse(readFileSync(join(dir, 's2_n6_gaukler.yaml'), 'utf8'))) as { objectives: { victory: { join?: boolean } }; triggers: unknown[] };
    map.objectives.victory.join = true; // the troupe master has no char: a format issue, not missing content
    map.triggers.push({ id: 't_key', when: { type: 'turn_start', turn: 3, phase: 'player' }, then: [{ action: 'set_terrain', area: { tiles: [[0, 0]] }, terrain: 'river', warn: 'ui.no_such_line' }] });
    const [r] = checkDrafts(data, locales, { 's2_n6_gaukler.yaml': map });
    expect(r!.issues.map((i) => i.message)).toEqual(
      expect.arrayContaining(['escort: troupe_master joins afterwards, so it needs a character of the same id (or join: false)', 't_key: missing key ui.no_such_line']),
    );
    // Jory comes with story 11.5: his forced deploy only waits for the character
    expect(r!.open.map((i) => i.message)).toContain('deploy.forced: unknown char jory');
  });

  it('checks warn, guest and the forced deploy of a map', () => {
    const map = structuredClone(addMap('tests/fixtures/maps/dev_terrain_warn.yaml', 1));
    map.triggers.push({ id: 't_early', when: { type: 'turn_start', turn: 1, phase: 'player' }, then: [{ action: 'set_terrain', area: { tiles: [[0, 0]] }, terrain: 'river', warn: 'ui.no_such_line' }] });
    map.triggers.push({ id: 't_moved', when: { type: 'unit_enters', area: { tiles: [[0, 0]] } }, then: [{ action: 'set_terrain', area: { tiles: [[0, 0]] }, terrain: 'river', warn: true }] });
    map.units[0] = { ...map.units[0]!, guest: true };
    map.deploy.forced = ['nobody'];
    const messages = validateContent({ ...data, maps: { ...data.maps, [map.id]: map } }, locales).map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        't_early: a warned set_terrain needs a trigger on turn_start from round 2 on',
        't_early: missing key ui.no_such_line',
        't_moved: a warned set_terrain needs a trigger on turn_start from round 2 on',
        'dev_vanguard: guest is only for units of team other',
        'deploy.forced: unknown char nobody',
      ]),
    );
  });
});

describe('changing maps of act 2 run on set_terrain, levers and triggers', () => {
  it('2-2 Salzpass: rockfall seals the south, then the north narrows (warned a round before)', () => {
    const s = battle('s2_2_2_salzpass.yaml');
    phaseStart(s, 3, 'enemy');
    expect(terrains(s, [[4, 14], [7, 14]])).toEqual(['rockwall', 'rockwall']);
    expect(terrainWarnings(data, s)).toEqual([]);
    phaseStart(s, 4, 'player');
    expect(terrainWarnings(data, s)).toEqual([{ trigger: 't_rock2', turn: 5, terrain: 'rockwall', tiles: [[12, 6], [12, 7]] }]);
    phaseStart(s, 5, 'enemy');
    expect(terrains(s, [[12, 6], [12, 7]])).toEqual(['rockwall', 'rockwall']);
    expect(terrainWarnings(data, s)).toEqual([]);
    phaseStart(s, 8, 'enemy');
    expect(terrains(s, [[14, 7], [14, 8]])).toEqual(['rockwall', 'rockwall']);
  });

  it('2-4 Brandschneise: the forest burns, Brann tears the firebreak, the ash does not burn; Brann is a guest to protect', () => {
    const s = battle('s2_2_4_brandschneise.yaml');
    expect(Object.values(s.timers).some((t) => t.kind === 'burning')).toBe(true);
    const west: Pos[] = [[3, 17], [4, 17], [5, 17], [7, 17], [8, 17], [9, 17], [10, 17], [11, 17], [12, 17], [13, 17]];
    phaseStart(s, 3, 'player');
    expect(new Set(terrains(s, west))).toEqual(new Set(['ash']));
    expect(data.terrain.ash!.flammable).toBe(false);
    phaseStart(s, 6, 'player');
    expect(terrainAt(s, [16, 17])).toBe('ash');
    const brann = s.units.find((u) => u.uid === 'brann')!;
    expect(brann).toMatchObject({ team: 'other', guest: true, ignoreForRout: true });
    const map = data.maps[s.mapId]!;
    expect(map.objectives.victory).toMatchObject({ type: 'defend', unit: 'brann' });
    expect(map.objectives.defeat).toContainEqual({ type: 'unit_dies', unit: 'brann' });
  });

  it('2-5 Silberquell: the west bridge is cut in round 6, warned from round 5', () => {
    const s = battle('s2_2_5_silberquell.yaml');
    phaseStart(s, 5, 'player');
    expect(terrainWarnings(data, s).map((w) => w.trigger)).toEqual(['t_cut']);
    phaseStart(s, 6, 'enemy');
    expect(terrains(s, [[4, 10], [4, 11]])).toEqual(['river', 'river']);
  });

  it('2-6 Krähenholm: ebb opens the sandbank in round 4, the flood takes it in round 9 (warned in 8)', () => {
    const s = battle('s2_2_6_kraehenholm.yaml');
    const bank = rect(16, 8, 18, 15);
    phaseStart(s, 4, 'player');
    expect(new Set(terrains(s, bank))).toEqual(new Set(['sand']));
    phaseStart(s, 8, 'player');
    expect(terrainWarnings(data, s)[0]).toMatchObject({ trigger: 't_flood', turn: 9, terrain: 'river' });
    phaseStart(s, 9, 'player');
    expect(new Set(terrains(s, bank))).toEqual(new Set(['river']));
  });

  it('N6 Gaukler: the tide takes the west walk in round 6, warned from round 5', () => {
    const s = battle('s2_n6_gaukler.yaml');
    phaseStart(s, 4, 'player');
    expect(terrainWarnings(data, s)).toEqual([]);
    phaseStart(s, 5, 'player');
    expect(terrainWarnings(data, s).map((w) => w.tiles)).toEqual([[[2, 14]]]);
    phaseStart(s, 6, 'enemy');
    expect(terrainAt(s, [2, 14])).toBe('river');
  });

  it('2-7 Kontor: the crane lever lays the walk over the dock', () => {
    const s = battle('s2_2_7_kontor.yaml');
    const walk = rect(15, 12, 15, 14);
    expect(terrains(s, walk)).not.toContain('footbridge');
    s.objects.find((o) => o.id === 'l_crane')!.state = 'open';
    const events: GameEvent[] = [];
    runTriggers(data, s, { kind: 'action' }, events);
    expect(new Set(terrains(s, walk))).toEqual(new Set(['footbridge']));
    expect(events.filter((e) => e.t === 'terrain')).toHaveLength(3);
  });

  it('2-8 Kronfeld: Rowena hesitates in round 6 and the bridge gate opens', () => {
    const s = battle('s2_2_8_kronfeld.yaml');
    expect(terrains(s, [[14, 6], [15, 6]])).not.toContain('gate');
    phaseStart(s, 6, 'player');
    expect(terrains(s, [[14, 6], [15, 6]])).toEqual(['gate', 'gate']);
  });
});

describe('the lock and the flag registers', () => {
  it('locks only IDs of released packs: the unreleased act 2 adds nothing', () => {
    const { packs, ids } = releasedIdSets(process.cwd(), data, readPacks(process.cwd()));
    expect(packs).not.toContain('act2');
    expect(ids.flags).toContain('e04');
    expect(ids.flags.filter((f) => ['e7_order', 'e7_warned', 'm2_2_seal'].includes(f))).toEqual([]);
    expect(ids.scenes.filter((x) => x.startsWith('scn.m2_'))).toEqual([]);
    expect(ids.maps.every((m) => data.maps[m]!.act === 1)).toBe(true);
    expect(ids.chars).toContain('lucan');
  });

  it('reports a flag declared in two act registers', () => {
    const files = readContentFiles();
    const act1 = Object.keys(files).find((k) => k.split('\\').join('/').endsWith('acts/act1/flags.yaml'))!;
    const act2 = act1.replace('act1', 'act2');
    const { issues } = buildContent({ ...files, [act2]: [...(files[act2] as unknown[]), { id: 'e04', kind: 'decision', values: ['a', 'b'], season2: false }] });
    expect(issues).toContainEqual({ file: 'acts/act2/flags.yaml', message: 'flag e04 is declared twice (acts/*/flags.yaml)' });
  });
});

describe('forced deploy, lieutenants with requires and guests', () => {
  it('N4: Ilka is forced only while she is in the company', () => {
    const map = addMap(join(dir, 's2_n4_clan.yaml'));
    const c = campaign();
    expect(presentForced(map, c)).toEqual(['avatar', 'lucan']);
    const s = startBattle(data, createBattle(data, c, map.id, [])).state;
    expect(s.units.some((u) => u.id === 'ilka')).toBe(false);
    const withIlka = campaign();
    withIlka.roster.push({ ...structuredClone(withIlka.roster.find((r) => r.id === 'lucan')!), id: 'ilka' });
    expect(presentForced(map, withIlka)).toEqual(['avatar', 'lucan', 'ilka']);
    const s2 = startBattle(data, createBattle(data, withIlka, map.id, [])).state;
    expect(s2.units.some((u) => u.id === 'ilka' && u.team === 'player' && u.pos)).toBe(true);
  });

  it('2-5: exactly one holds the exit: the captain after E7 warned, else Sable (also without E7 or with both flags)', () => {
    const holder = (flags: Record<string, true>) => {
      const c = campaign();
      Object.assign(c.flags, flags);
      if (!data.maps.s2_2_5_silberquell) addMap(join(dir, 's2_2_5_silberquell.yaml'));
      const s = startBattle(data, createBattle(data, c, 's2_2_5_silberquell', [])).state;
      return s.units.map((u) => u.uid).filter((id) => id === 'sable' || id === 'captain');
    };
    expect(holder({})).toEqual(['sable']);
    expect(holder({ e7_order: true })).toEqual(['sable']);
    expect(holder({ e7_warned: true })).toEqual(['captain']);
    expect(holder({ e7_order: true, e7_warned: true })).toEqual(['captain']);
  });

  it('a lieutenant left out by requires gets no plan (Ulvric on a copy of m1_4)', () => {
    const was = data.maps.m1_4_wolfslager!;
    const copy = structuredClone(was);
    copy.units.find((u) => u.id === 'ulvric')!.requires = [{ flag: { e02: 'protect' } }];
    data.maps.m1_4_wolfslager = copy;
    try {
      expect(createBattle(data, campaign(), 'm1_4', []).lieutenantPlan?.ulvric).toBeUndefined();
      const protect = campaign();
      protect.flags.e02 = 'protect';
      const s = createBattle(data, protect, 'm1_4', []);
      expect(s.lieutenantPlan?.ulvric).toBeDefined();
      expect(s.units.some((u) => u.lieutenant === 'ulvric')).toBe(true);
    } finally {
      data.maps.m1_4_wolfslager = was;
    }
  });

  it('a guest is led by the AI, warned ground is marked, and after the victory the guest stays behind', () => {
    const c = campaign();
    const s = battle('tests/fixtures/maps/dev_terrain_warn.yaml', c);
    const liora = s.units.find((u) => u.uid === 'liora')!;
    expect(liora).toMatchObject({ team: 'other', guest: true, generic: false });
    expect(() => applyCommand(data, s, { type: 'act', unit: 'liora', to: liora.pos!, action: { kind: 'wait' } })).toThrow(/not_your_phase/);
    expect(terrainWarnings(data, s)).toEqual([{ trigger: 't_bridge', turn: 2, terrain: 'river', tiles: [[2, 3], [2, 4]] }]);
    const won = structuredClone(s);
    won.outcome = 'victory';
    expect(terrainWarnings(data, won)).toEqual([]);
    expect(finishBattle(data, c, won).campaign.roster.some((r) => r.id === 'liora')).toBe(false);
    // without `guest` the same character joins after the mission, as Liora does in 1-3
    const plain = structuredClone(won);
    delete plain.units.find((u) => u.uid === 'liora')!.guest;
    expect(finishBattle(data, c, plain).campaign.roster.some((r) => r.id === 'liora')).toBe(true);
  });
  it('a guest the company talked over joins; one already in the company is not placed twice; a fallen guest is no fallen companion', () => {
    const c = campaign();
    const s = battle('tests/fixtures/maps/dev_terrain_warn.yaml', c);
    const won = structuredClone(s);
    won.outcome = 'victory';
    const liora = won.units.find((u) => u.uid === 'liora')!;
    liora.team = 'player'; // what talking over does (apply.ts, recruit)
    won.stats.recruited.push('liora');
    const joined = finishBattle(data, c, won).campaign;
    expect(joined.roster.some((r) => r.id === 'liora')).toBe(true);
    // with Liora in the company the map does not place its guest Liora again (placeMapUnits skips a recruited char)
    const again = startBattle(data, createBattle(data, joined, s.mapId, [])).state;
    expect(again.units.filter((u) => u.id === 'liora' && u.team === 'other')).toEqual([]);
    // [ASSUMPTION] a guest who dies is not a fallen companion: the campaign keeps nothing of him, the map's defeat decides
    const lost = structuredClone(s);
    lost.outcome = 'victory';
    const g = lost.units.find((u) => u.uid === 'liora')!;
    g.gone = 'dead';
    g.pos = null;
    const after = finishBattle(data, c, lost).campaign;
    expect(after.fallen.some((f) => f.id === 'liora')).toBe(false);
    expect(after.roster.some((r) => r.id === 'liora')).toBe(false);
  });

  it('no warning for a fired trigger, also with once: false', () => {
    const s = battle('tests/fixtures/maps/dev_terrain_warn.yaml');
    const map = data.maps[s.mapId]!;
    map.triggers[0] = { ...map.triggers[0]!, once: false };
    expect(terrainWarnings(data, s)).toHaveLength(1);
    s.turn = 2;
    s.phase = 'enemy';
    expect(terrainWarnings(data, s)).toHaveLength(1);
    phaseStart(s, 2, 'enemy');
    expect(terrainAt(s, [2, 3])).toBe('river');
    expect(terrainWarnings(data, s)).toEqual([]);
  });
});
