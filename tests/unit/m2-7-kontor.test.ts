/** Mission 2-7 "Das Kontor am Silbermeer" (story 11.18): line-up, Brakka at the ballista, the raised quay, the crane, the key, the chronicle page, the scenes and E8. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  conditionContext,
  createBattle,
  newCampaign,
  resolveScene,
  runTriggers,
  type BattleState,
  type CampaignState,
  type Difficulty,
  type FlagValue,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';

let data: GameData;

/** A campaign in act 2 right before 2-7: act 1 and 2-1 to 2-6 done, the company at home in the castle. */
function inAct2(flags: Record<string, FlagValue> = {}, difficulty: Difficulty = 'normal'): CampaignState {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  const done = [...story, 'm2_1', 'm2_2', 'm2_3', 'm2_4', 'm2_5', 'm2_6'];
  return { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: done, flags: { ...c.flags, ...flags } };
}

/** The company with a companion in it (a copy of the first roster entry under another id). */
const withUnit = (c: CampaignState, id: string): CampaignState => ({ ...c, roster: [...c.roster, { ...c.roster[0]!, id }] });

const battle = (c: CampaignState = inAct2()): BattleState => createBattle(data, c, 'm2_7', ['avatar', 'lucan']);
const map = () => data.maps.m2_7_kontor!;
const terrainAt = (s: BattleState, p: Pos) => data.terrain[s.terrain[p[1] * s.width + p[0]]!]!.id;
const dialogues = (ev: GameEvent[]) => ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map m2_7_kontor', () => {
  it('is the map of node m2_7 at the Kontor: reach the writing room, Avatar or Lucan falling loses, ten deploy, rain', () => {
    const node = data.acts[2]!.nodes.find((n) => n.id === 'm2_7')!;
    expect(node).toMatchObject({ map: 'm2_7_kontor', place: 'kontor', pre: 'scn.m2_7.intro', post: 'scn.m2_7.outro' });
    expect(map().objectives.victory).toEqual({ type: 'reach', area: { rect: [6, 2, 7, 3] } });
    expect(map().objectives.defeat.map((d) => (d.type === 'unit_dies' ? d.unit : d.type))).toEqual(['avatar', 'lucan']);
    expect(map().deploy.max).toBe(10);
    expect(map().act).toBe(2);
    expect(map().weather).toBe('rain');
  });

  it('has 22 / 26 / 30 foes with the waves', () => {
    for (const [d, n] of [['easy', 22], ['normal', 26], ['hard', 30]] as const) {
      const s = battle(inAct2({}, d));
      const start = s.units.filter((u) => u.team === 'enemy').length;
      const waves = map().reinforcements.flatMap((r) => r.units).filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
      expect(start + waves, d).toBe(n);
    }
  });

  it('puts the foes on the position level (P−3 … P−2); no riders or fliers; Brakka the only lieutenant, beside the ballista', () => {
    const s = battle();
    expect(s.units.find((u) => u.uid === 's1')!.level).toBe(s.positionLevel! - 3);
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy' && !x.lieutenant)) {
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset, u.id).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset, u.id).toBeLessThanOrEqual(-2);
      expect(['cavalier', 'flier'].includes(data.classes[u.class]!.moveType), u.id).toBe(false);
    }
    expect(s.units.filter((u) => u.team === 'enemy' && u.lieutenant).map((u) => u.lieutenant)).toEqual(['brakka']);
    expect(map().units.find((u) => u.id === 'brakka')).toMatchObject({ class: data.lieutenants!.brakka!.class, at: [10, 7], ai: { profile: 'hold' } });
    expect(map().objects).toContainEqual({ id: 'b_quay', type: 'ballista', at: [10, 8] });
    expect(terrainAt(s, [10, 8])).toBe('ballista');
  });

  it('raises the north quay to level 1 with stairs up from the bridge and in the east; the quay foot stays on level 0', () => {
    const s = battle();
    const level = (p: Pos) => (map().levels ?? []).find((l) => 'rect' in l.area && p[0] >= l.area.rect[0] && p[0] <= l.area.rect[2] && p[1] >= l.area.rect[1] && p[1] <= l.area.rect[3])?.level ?? 0;
    for (const p of [[9, 6], [10, 8], [16, 6], [7, 10]] as Pos[]) expect(level(p), String(p)).toBe(1);
    for (const p of [[9, 11], [10, 11], [18, 11]] as Pos[]) {
      expect(terrainAt(s, p), String(p)).toBe('stairs');
      expect(level(p), String(p)).toBe(0);
    }
  });

  it('keeps the counting house shut: two front doors and a side door; the purser carries and drops the key', () => {
    const s = battle();
    for (const [id, at] of [['d_front_w', [9, 5]], ['d_front_e', [10, 5]], ['d_side', [14, 3]]] as const) {
      expect(map().objects).toContainEqual({ id, type: 'door', at });
      expect(terrainAt(s, at as unknown as Pos)).toBe('door');
    }
    expect(map().units.find((u) => u.id === 'purser')).toMatchObject({ nameKey: 'unit.purser.name', at: [16, 6], items: [{ def: 'iron_sword' }, { def: 'door_key' }], drops: [1] });
  });

  it('lays a gangway over the basin when the crane lever is pulled', () => {
    const s = battle();
    for (const p of [[15, 12], [15, 13], [15, 14]] as Pos[]) expect(terrainAt(s, p)).toBe('river');
    const ev: GameEvent[] = [];
    runTriggers(data, s, { kind: 'objective' }, ev);
    expect(dialogues(ev)).toEqual([]);
    s.objects.find((o) => o.id === 'l_crane')!.state = 'open';
    runTriggers(data, s, { kind: 'objective' }, ev);
    expect(dialogues(ev)).toEqual(['scn.m2_7.crane']);
    for (const p of [[15, 12], [15, 13], [15, 14]] as Pos[]) expect(terrainAt(s, p)).toBe('footbridge');
  });

  it('has the waves in rounds 3 (west quay), 5 (east quay) and 7 (from the town), all announced', () => {
    const waves = map().reinforcements.map((r) => ({ turn: r.turn, cols: [...new Set(r.units.map((u) => u.at[0]))].sort((a, b) => a - b), announce: r.announce }));
    expect(waves).toEqual([
      { turn: 3, cols: [1], announce: true },
      { turn: 5, cols: [18], announce: true },
      { turn: 7, cols: [9, 10], announce: true },
    ]);
  });

  it('keeps the chronicle page (seed of the pact) in the north-east corner of the writing room; side goals page and 12 rounds', () => {
    expect(map().objects).toContainEqual({ id: 'c_page', type: 'chest', at: [13, 2], contents: { gold: 300, chronicle: 'a2_kontor', dialogue: 'scn.m2_7.page' } });
    expect(data.chronicle.a2_kontor).toBeTruthy();
    expect(map().objectives.side).toEqual([
      { id: 's_page', type: 'open_chests', reward: { item: { def: 'vulnerary' } } },
      { id: 's_fast', type: 'turn_limit', turns: 12, reward: { gold: 400 } },
    ]);
  });

  it('pays 2 000 gold (act 2 corridor 2 000–3 000) and has two haunt anchors', () => {
    expect(map().goldReward).toBe(2000);
    expect((map().haunts ?? []).map((a) => a.variant)).toEqual(['rout', 'treasure']);
  });
});

describe('scenes of 2-7 and decision E8', () => {
  const ids = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [l.line] : []));
  const speakers = (c: CampaignState, scene: string) =>
    new Map(resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [[l.line, l.speaker] as const] : [])));
  const choiceOf = (c: CampaignState) => {
    const ch = resolveScene(data, conditionContext(data, c), 'scn.m2_7.outro').filter((l) => l.kind === 'choice');
    expect(ch).toHaveLength(1);
    const x = ch[0]!;
    if (x.kind !== 'choice') throw new Error('no choice');
    return x;
  };

  it('the node secures the ledgers on victory (maelis_ledgers), whatever E8 decides; N6 opens together with 2-7', () => {
    const nodes = data.acts[2]!.nodes;
    expect(nodes.find((n) => n.id === 'm2_7')!.effects).toEqual([{ setFlag: 'maelis_ledgers' }]);
    expect(nodes.find((n) => n.id === 'n6')!.requires).toEqual(expect.arrayContaining([{ completed: 'm2_5' }, { completed: 'm2_6' }]));
  });

  it('E8 has three stances: warm and defiant give the books to Seraphine (Grell grudge −1), sober sells them back to Maelis for gold', () => {
    const c: CampaignState = { ...inAct2(), lieutenants: { grell: { grudge: 2 } as never } };
    const ch = choiceOf(c);
    expect(ch.decision).toBe(true);
    expect(ch.options.map((o) => [o.id, o.stance])).toEqual([['warm', 'warm'], ['sober', 'sober'], ['defiant', 'defiant']]);
    for (const o of ['warm', 'defiant']) {
      const r = applyCampaign(data, c, { type: 'choose', scene: 'scn.m2_7.outro', line: ch.line, option: o });
      expect(r.campaign.flags.e08, o).toBe('seraphine');
      expect(r.campaign.lieutenants?.grell?.grudge, o).toBe(1);
      expect(r.campaign.gold, o).toBe(c.gold);
    }
    const c01 = data.scenes['scn.m2_7.outro']!.lines.find((l) => l.id === 'c01')!;
    if (!('choice' in c01)) throw new Error('c01 is no choice');
    const sell = c01.choice.find((o) => o.id === 'sober')!;
    const gold = (sell.effects ?? []).flatMap((e) => ('gold' in e ? [e.gold] : []))[0]!;
    expect(gold).toBe(1000);
    const r = applyCampaign(data, c, { type: 'choose', scene: 'scn.m2_7.outro', line: ch.line, option: 'sober' });
    expect(r.campaign.flags.e08).toBe('sell');
    expect(r.campaign.gold).toBe(c.gold + gold);
    expect(r.campaign.lieutenants?.grell?.grudge).toBe(2);
  });

  it('shows the matching aftermath; Brakka brings Maelis’s offer; Nell and Jory speak only when in the company', () => {
    expect(ids(inAct2({ e08: 'seraphine' }), 'scn.m2_7.outro')).toEqual(expect.arrayContaining(['r01', 'r02']));
    expect(ids(inAct2({ e08: 'seraphine' }), 'scn.m2_7.outro')).not.toContain('s01');
    expect(ids(inAct2({ e08: 'sell' }), 'scn.m2_7.outro')).toEqual(expect.arrayContaining(['s01', 's02']));
    expect(speakers(inAct2(), 'scn.m2_7.outro').get('l06')).toBe('brakka');
    expect(ids(inAct2(), 'scn.m2_7.outro')).not.toContain('l03');
    expect(ids(inAct2(), 'scn.m2_7.outro')).not.toContain('l08');
    expect(ids(withUnit(withUnit(inAct2(), 'nell'), 'jory'), 'scn.m2_7.outro')).toEqual(expect.arrayContaining(['l03', 'l08']));
    expect(ids(withUnit(inAct2(), 'jory'), 'scn.m2_7.intro')).toContain('l06');
    expect(ids(inAct2(), 'scn.m2_7.intro')).not.toContain('l06');
  });

  it('the page scene names the same hand on first and last page; somebody always speaks it', () => {
    expect(ids(inAct2(), 'scn.m2_7.page')).toEqual(['l01', 'l02', 'l03']);
    expect(data.scenes['scn.m2_7.page']!.lines.find((l) => l.id === 'l03')).toMatchObject({ text: expect.stringContaining('ersten Seite') });
  });
});
