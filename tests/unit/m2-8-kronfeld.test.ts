/** Mission 2-8 "Kronfeld" (story 11.19): the act-2 finale – hold, then break out over the Aure; the four lieutenants, the gate, the ford, the scenes after E5–E8, relic stages and the end of the act. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  actFinished,
  availableNodes,
  conditionContext,
  createBattle,
  enterNextAct,
  newCampaign,
  relicStage,
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

/** A campaign in act 2 right before 2-8: act 1 and 2-1 to 2-7 done, the company at home in the castle. */
function inAct2(flags: Record<string, FlagValue> = {}, difficulty: Difficulty = 'normal'): CampaignState {
  const c = newCampaign(data, 8, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  const done = [...story, 'm2_1', 'm2_2', 'm2_3', 'm2_4', 'm2_5', 'm2_6', 'm2_7'];
  return { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: done, flags: { ...c.flags, ...flags } };
}

/** The company with a companion in it (a copy of the first roster entry under another id). */
const withUnit = (c: CampaignState, id: string): CampaignState => ({ ...c, roster: [...c.roster, { ...c.roster[0]!, id }] });

const battle = (c: CampaignState = inAct2()): BattleState => createBattle(data, c, 'm2_8', ['avatar', 'lucan']);
const map = () => data.maps.m2_8_kronfeld!;
const terrainAt = (s: BattleState, p: Pos) => data.terrain[s.terrain[p[1] * s.width + p[0]]!]!.id;
const dialogues = (ev: GameEvent[]) => ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map m2_8_kronfeld', () => {
  it('is the finale of act 2 at Kronfeld: hold 5 rounds, then 6 out over the Aure with Rhen and Lucan; fifteen deploy', () => {
    const node = data.acts[2]!.nodes.find((n) => n.id === 'm2_8')!;
    expect(node).toMatchObject({ fixed: 'finale', map: 'm2_8_kronfeld', place: 'kronfeld', pre: 'scn.m2_8.intro', post: 'scn.m2_8.outro' });
    expect(node.effects).toEqual([{ item: { def: 'ember_spark' } }, { item: { def: 'ember_spark' } }]);
    expect(map().objectives.victory).toEqual({ type: 'survive', turns: 5, then: { type: 'escape', area: { rect: [0, 0, 29, 1] }, min: 6, must: ['avatar', 'lucan'] } });
    expect(map().objectives.defeat.map((d) => (d.type === 'unit_dies' ? d.unit : d.type))).toEqual(['avatar', 'lucan']);
    expect(map().deploy.max).toBe(15);
    expect(map().act).toBe(2);
    expect([map().size, map().timeOfDay]).toEqual([[30, 40], 'evening']);
  });

  // story 11.27: thinned for the balance (before 36 / 40 / 46)
  it('has 20 / 26 / 33 foes with the waves', () => {
    for (const [d, n] of [['easy', 20], ['normal', 26], ['hard', 33]] as const) {
      const s = battle(inAct2({}, d));
      const start = s.units.filter((u) => u.team === 'enemy').length;
      const waves = map().reinforcements.flatMap((r) => r.units).filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
      expect(start + waves, d).toBe(n);
    }
  });

  it('puts the foes on the position level (P−3 … P−1); no riders or fliers; four lieutenants, Sable or the captain in the south', () => {
    const s = battle();
    expect(s.units.find((u) => u.uid === 'w1')!.level).toBe(s.positionLevel! - 3);
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy' && !x.lieutenant)) {
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset, u.id).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset, u.id).toBeLessThanOrEqual(u.id === 'captain' ? 1 : -1);
      expect(['cavalier', 'flier'].includes(data.classes[u.class]!.moveType), u.id).toBe(false);
    }
    for (const lt of ['rowena', 'grell', 'brakka', 'sable']) expect(map().units.find((u) => u.id === lt)!.class, lt).toBe(data.lieutenants![lt]!.class);
    expect(s.units.filter((u) => u.team === 'enemy' && u.lieutenant).map((u) => u.lieutenant)).toEqual(['rowena', 'grell', 'brakka', 'sable']);
    const warned = battle(inAct2({ e07: 'warn' }));
    expect(warned.units.filter((u) => u.team === 'enemy' && u.lieutenant).map((u) => u.lieutenant)).toEqual(['rowena', 'grell', 'brakka']);
    expect(warned.units.some((u) => u.uid === 'captain')).toBe(true);
    expect(s.units.some((u) => u.uid === 'captain')).toBe(false);
  });

  it('stands the company on the terrace (level 1); Brakka’s ballista sits on the crag of the east hill (level 2)', () => {
    const s = battle();
    for (const p of map().deploy.slots) expect(terrainAt(s, p), String(p)).toBe('terrace');
    expect(map().objects).toContainEqual({ id: 'b_hill', type: 'ballista', at: [24, 13] });
    expect(terrainAt(s, [24, 13])).toBe('ballista');
    expect(terrainAt(s, [23, 13])).toBe('crag');
    expect(map().levels).toEqual(expect.arrayContaining([{ level: 2, area: { tiles: [[24, 13]] } }]));
    expect(map().units.find((u) => u.id === 'brakka')).toMatchObject({ at: [23, 13], ai: { profile: 'hold' } });
  });

  it('keeps the bridge gate shut until round 6: Rowena hesitates, the gate opens, she and her lances hold still', () => {
    const s = battle();
    for (const p of [[14, 6], [15, 6]] as Pos[]) expect(terrainAt(s, p)).toBe('gate_closed');
    const ev: GameEvent[] = [];
    runTriggers(data, s, { kind: 'phase' }, ev);
    expect(dialogues(ev)).toEqual(['scn.m2_8.hollow_crown']);
    s.turn = 6;
    s.phase = 'player';
    runTriggers(data, s, { kind: 'phase' }, ev);
    expect(dialogues(ev)).toEqual(['scn.m2_8.hollow_crown', 'scn.m2_8.rowena_hesitates']);
    for (const p of [[14, 6], [15, 6]] as Pos[]) expect(terrainAt(s, p)).toBe('gate');
    for (const id of ['rowena', 'n1', 'n2']) expect(s.units.find((u) => u.uid === id)!.ai?.profile, id).toBe('hold');
  });

  it('starts the escape at once when a unit of the company wades into the ford', () => {
    const s = battle();
    expect(s.objectivePhase ?? 0).toBe(0);
    const rhen = s.units.find((u) => u.team === 'player')!;
    rhen.pos = [24, 3];
    const ev: GameEvent[] = [];
    runTriggers(data, s, { kind: 'moved', unit: rhen }, ev);
    expect(dialogues(ev)).toContain('scn.m2_8.ford');
    expect(s.objectivePhase).toBe(1);
  });

  it('has the waves in rounds 3 (west), 5 (east), 7 (south) and 9 (lances at the ford), all announced', () => {
    const waves = map().reinforcements.map((r) => ({ turn: r.turn, announce: r.announce, at: r.units.map((u) => u.at) }));
    expect(waves.map((w) => [w.turn, w.announce])).toEqual([[3, true], [5, true], [7, true], [9, true]]);
    expect(waves[0]!.at.every((p) => p[0] === 0)).toBe(true);
    expect(waves[1]!.at.every((p) => p[0] === 29)).toBe(true);
    expect(waves[2]!.at.every((p) => p[1] === 39)).toBe(true);
    expect(waves[3]!.at.every((p) => p[0] >= 23 && p[0] <= 25 && p[1] <= 7)).toBe(true);
  });

  it('pays 3 000 gold (top of the act-2 corridor), side goals 800 and 500, and has two haunt anchors', () => {
    const [lo, hi] = data.balance.simulation.gold.perAct['2']!;
    expect(map().goldReward).toBeGreaterThanOrEqual(lo);
    expect(map().goldReward).toBeLessThanOrEqual(hi);
    expect(map().objectives.side.map((x) => x.reward)).toEqual([{ gold: 800 }, { gold: 500 }]);
    expect((map().haunts ?? []).map((a) => a.variant)).toEqual(['rout', 'treasure']);
  });
});

describe('scenes of 2-8 after E5–E8', () => {
  const ids = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [l.line] : []));
  const speakers = (c: CampaignState, scene: string) =>
    new Map(resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [[l.line, l.speaker] as const] : [])));

  it('E5: Odile speaks for the company if she stayed, stands silent at Seraphine’s side if she returned', () => {
    const stay = withUnit(inAct2({ e05: 'stay' }), 'odile');
    expect(ids(stay, 'scn.m2_8.intro')).toContain('l04');
    expect(ids(stay, 'scn.m2_8.hollow_crown')).toContain('l08');
    expect(ids(stay, 'scn.m2_8.hollow_crown')).not.toContain('l07');
    const back = inAct2({ e05: 'return' });
    expect(ids(back, 'scn.m2_8.intro')).toEqual(expect.arrayContaining(['l05']));
    expect(ids(back, 'scn.m2_8.hollow_crown')).toContain('l07');
    expect(ids(back, 'scn.m2_8.hollow_crown')).not.toContain('l08');
  });

  it('E6 pardon shows Varek under Dravn’s banners; E7 warn lets Sable speak in the company', () => {
    expect(ids(inAct2({ e06: 'pardon' }), 'scn.m2_8.intro')).toContain('l07');
    expect(ids(inAct2({ e06: 'stay' }), 'scn.m2_8.intro')).not.toContain('l07');
    expect(ids(withUnit(inAct2({ e07: 'warn', joined_sable: true }), 'sable'), 'scn.m2_8.intro')).toContain('l06');
    expect(ids(inAct2({ e07: 'obey' }), 'scn.m2_8.intro')).not.toContain('l06');
  });

  it('E8: Seraphine names the books she got, or the proof that was sold', () => {
    const given = ids(inAct2({ maelis_ledgers: true, e08: 'seraphine' }), 'scn.m2_8.hollow_crown');
    expect(given).toContain('l03');
    expect(given).not.toContain('l04');
    const sold = ids(inAct2({ maelis_ledgers: true, e08: 'sell' }), 'scn.m2_8.hollow_crown');
    expect(sold).toContain('l04');
    expect(sold).not.toContain('l03');
    expect(speakers(inAct2(), 'scn.m2_8.hollow_crown').get('l02')).toBe('seraphine');
  });

  it('Rowena hesitates in round 6 and speaks again at the end of Kronfeld; the outro says the crown was hollow', () => {
    expect(speakers(inAct2(), 'scn.m2_8.rowena_hesitates').get('l02')).toBe('rowena');
    expect(speakers(inAct2(), 'scn.m2_8.outro').get('l03')).toBe('rowena');
    expect(data.scenes['scn.m2_8.outro']!.lines.find((l) => l.id === 'l08')).toMatchObject({ text: expect.stringContaining('Die Krone war hohl') });
    expect(ids(inAct2(), 'scn.m2_8.outro')).not.toContain('l06');
    expect(ids(inAct2({ chronicle_read: true }), 'scn.m2_8.outro')).toEqual(expect.arrayContaining(['l06', 'l07']));
    expect(ids(inAct2(), 'scn.m2_8.outro')).not.toContain('l10');
    expect(ids(withUnit(withUnit(inAct2(), 'amos'), 'brann'), 'scn.m2_8.outro')).toEqual(expect.arrayContaining(['l10', 'l11']));
  });
});

describe('end of act 2', () => {
  it('awakens the relics: the warden shield to stage 3, the dragon ember to stage 2', () => {
    const before = conditionContext(data, inAct2());
    const after = conditionContext(data, { ...inAct2(), completed: [...inAct2().completed, 'm2_8'] });
    expect([relicStage(data, before, 'pact_warden_shield'), relicStage(data, before, 'dragon_ember')]).toEqual([2, 1]);
    expect([relicStage(data, after, 'pact_warden_shield'), relicStage(data, after, 'dragon_ember')]).toEqual([3, 2]);
  });

  it('opens the finale only after 2-7; afterwards the act is over and stays act 2 while act 3 is not in the build (story 11.1)', () => {
    const before = { ...inAct2(), completed: inAct2().completed.filter((id) => id !== 'm2_7') };
    expect(availableNodes(data, before).map((n) => n.id)).not.toContain('m2_8');
    expect(availableNodes(data, inAct2()).map((n) => n.id)).toContain('m2_8');
    const done: CampaignState = { ...inAct2(), completed: [...inAct2().completed, 'm2_8'] };
    expect(actFinished(data, done)).toBe(true);
    const events: Parameters<typeof enterNextAct>[2] = [];
    expect(enterNextAct(data, done, events)).toBe(false);
    expect(done.act).toBe(2);
    expect(events).toEqual([]);
    expect(availableNodes(data, done).some((n) => n.kind === 'story')).toBe(false);
  });
});
