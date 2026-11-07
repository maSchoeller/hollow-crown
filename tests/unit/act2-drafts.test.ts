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
import { loadContentFromDisk } from '../../src/content/node';
import { mapSchema } from '../../src/content/schemas';
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
  it('finds the 11 drafts and none of them has a format issue', () => {
    expect(files).toHaveLength(11);
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

  it('2-5: Sable stands only after E7 order, the captain only after warned', () => {
    const order = campaign();
    order.flags.e7_order = true;
    const s1 = battle('s2_2_5_silberquell.yaml', order);
    expect(s1.units.map((u) => u.uid).filter((id) => id === 'sable' || id === 'captain')).toEqual(['sable']);
    const warned = campaign();
    warned.flags.e7_warned = true;
    const s2 = startBattle(data, createBattle(data, warned, s1.mapId, [])).state;
    expect(s2.units.map((u) => u.uid).filter((id) => id === 'sable' || id === 'captain')).toEqual(['captain']);
    expect(s2.units.find((u) => u.uid === 'captain')!.lieutenant).toBeUndefined();
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
});
