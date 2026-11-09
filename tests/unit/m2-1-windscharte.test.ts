/** Mission 2-1 "Wind über der Eisenmark" (story 11.12): line-up, ballistas and their lesson, waves, Jory, the pass hospice, the scenes. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  ballistaTargets,
  conditionContext,
  createBattle,
  newCampaign,
  resolveScene,
  runTriggers,
  type BattleState,
  type CampaignState,
  type Difficulty,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';

let data: GameData;

/** A campaign at the start of act 2: act 1 done, the company at home in the castle. */
function inAct2(difficulty: Difficulty = 'normal'): CampaignState {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  return { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: story };
}

const battle = (d: Difficulty = 'normal'): BattleState => createBattle(data, inAct2(d), 'm2_1', ['avatar', 'lucan']);
const map = () => data.maps.m2_1_windscharte!;
const dist = (a: Pos, b: Pos) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map m2_1_windscharte', () => {
  it('is the map of node m2_1 in act 2, survive 10 rounds, Avatar or Lucan falling loses', () => {
    const node = data.acts[2]!.nodes.find((n) => n.id === 'm2_1')!;
    expect(node).toMatchObject({ map: 'm2_1_windscharte', place: 'windscharte', pre: 'scn.m2_1.intro', post: 'scn.m2_1.outro' });
    expect(map().objectives.victory).toEqual({ type: 'survive', turns: 10 });
    expect(map().objectives.defeat).toEqual([
      { type: 'unit_dies', unit: 'avatar' },
      { type: 'unit_dies', unit: 'lucan' },
    ]);
    expect(map().deploy.max).toBe(9);
  });

  it('has 20 / 24 / 28 foes with the waves, Brakka among them', () => {
    for (const [d, n] of [['easy', 20], ['normal', 24], ['hard', 28]] as const) {
      const s = battle(d);
      const start = s.units.filter((u) => u.team === 'enemy').length;
      const waves = map().reinforcements.flatMap((r) => r.units).filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
      expect(start + waves, d).toBe(n);
    }
    expect(map().units.find((u) => u.id === 'brakka')).toMatchObject({ lieutenant: 'brakka', team: 'enemy', ai: { profile: 'hold' } });
  });

  it('puts every foe on the position level: start P−3 (guard east P−2), waves P−2, no riders or fliers', () => {
    const s = battle();
    expect(s.positionLevel).toBe(12);
    const m1 = s.units.find((u) => u.uid === 'm1')!;
    expect(m1.level).toBe(9);
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy' && !x.lieutenant)) {
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset).toBeLessThanOrEqual(-2);
      expect(u.nameKey).toBe('unit.free_blade.name');
    }
  });

  it('has the waves in rounds 3, 6 and 9 from the plain in the north and in round 7 from the pass road in the south, all announced', () => {
    const waves = map().reinforcements.map((r) => ({ turn: r.turn, rows: [...new Set(r.units.map((u) => u.at[1]))], announce: r.announce }));
    expect(waves).toEqual([
      { turn: 3, rows: [0], announce: true },
      { turn: 6, rows: [0], announce: true },
      { turn: 7, rows: [24], announce: true },
      { turn: 9, rows: [0], announce: true },
    ]);
  });

  it('lets a company member on foot work either ballista from its rock spur', () => {
    const s = battle();
    const crew = s.units.find((u) => u.id === 'lucan')!;
    // west: from the crag beside the ballista; east: from the crag north of it
    expect(Object.keys(ballistaTargets(data, s, crew, [4, 13]))).toEqual(['b_west']);
    expect(Object.keys(ballistaTargets(data, s, crew, [16, 9]))).toEqual(['b_east']);
    // two tiles off the ballista nobody fires it
    expect(ballistaTargets(data, s, crew, [4, 14])).toEqual({});
  });

  it('plays the ballista lesson once, when a company member reaches a rock spur, not before', () => {
    const s = battle();
    const unit = s.units.find((u) => u.id === 'avatar')!;
    const fire = (at: Pos): string[] => {
      unit.pos = at;
      const ev: GameEvent[] = [];
      runTriggers(data, s, { kind: 'moved', unit }, ev);
      return ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));
    };
    expect(fire([9, 20])).toEqual([]);
    expect(fire([3, 15])).toEqual(['scn.m2_1.tutorial_ballista']);
    expect(fire([16, 11])).toEqual([]);
  });

  it('plays the dragon shadow at the start of the player phase of round 8', () => {
    const s = battle();
    const at = (turn: number, phase: 'player' | 'enemy') => {
      s.turn = turn;
      s.phase = phase;
      const ev: GameEvent[] = [];
      runTriggers(data, s, { kind: 'phase' }, ev);
      return ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));
    };
    expect(at(7, 'player')).toEqual([]);
    expect(at(8, 'enemy')).toEqual([]);
    expect(at(8, 'player')).toEqual(['scn.m2_1.dragon_shadow']);
  });

  it('has Jory as a guest at the wagon who joins only when talked to, on P − 1 with his own weapons', () => {
    const s = battle();
    const jory = s.units.find((u) => u.id === 'jory')!;
    expect(jory).toMatchObject({ team: 'other', guest: true, level: 11, recruit: { by: 'any', dialogue: 'scn.m2_1.jory_talk' } });
    expect([...Object.values(jory.equip).map((i) => i?.def), ...jory.bag.map((i) => i.def)]).toEqual(expect.arrayContaining(['steel_dagger', 'travel_lute']));
    // within reach of the east ballista (3–10, one more from the rock spur)
    expect(dist(jory.pos!, [16, 10])).toBeLessThanOrEqual(11);
    expect(map().objectives.side).toContainEqual({ id: 's_jory', type: 'recruit', unit: 'jory', reward: { gold: 200 } });
  });

  it('has the pass hospice: two fort tiles that heal, within reach of the east ballista', () => {
    const s = battle();
    for (const p of [[12, 17], [13, 17]] as Pos[]) {
      const t = data.terrain[s.terrain[p[1] * s.width + p[0]]!]!;
      expect(t.id).toBe('fort');
      expect(t.heal).toBe(20);
      expect(dist(p, [16, 10])).toBeLessThanOrEqual(11);
    }
  });
});

describe('scenes of 2-1', () => {
  const ids = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [l.line] : []));

  it('the outro offers both pardons through the lancers and Dravn’s envoy (told, no half figure), Maelis not', () => {
    const lines = resolveScene(data, conditionContext(data, inAct2()), 'scn.m2_1.outro');
    const speakers = new Set(lines.flatMap((l) => (l.kind === 'line' && l.speaker ? [l.speaker] : [])));
    expect(speakers.has('brakka') && speakers.has('lucan')).toBe(true);
    for (const who of ['maelis', 'rowena', 'seraphine', 'dravn']) expect(speakers.has(who), who).toBe(false);
    const ids = lines.flatMap((l) => (l.kind === 'line' ? [l.line] : []));
    expect(ids).toEqual(expect.arrayContaining(['l07', 'l07b', 'l08']));
  });

  it('Rhen answers with a stance and a consequence card, no flag and no other effect', () => {
    const c = inAct2();
    const choice = resolveScene(data, conditionContext(data, c), 'scn.m2_1.outro').find((l) => l.kind === 'choice')!;
    if (choice.kind !== 'choice') throw new Error('no choice');
    expect(choice.decision).toBe(true);
    expect(choice.options.map((o) => o.id)).toEqual(['warm', 'sober', 'defiant']);
    for (const o of choice.options) expect(o.effects ?? []).toEqual([]);
    const r = applyCampaign(data, c, { type: 'choose', scene: 'scn.m2_1.outro', line: 'c01', option: 'sober' });
    expect(r.campaign.flags).toEqual(c.flags);
    expect(r.campaign.stance.sober).toBe(c.stance.sober + 1);
  });

  it('Jory speaks in the outro only when he joined; Lucan’s line follows the prevailing stance', () => {
    const c = inAct2();
    expect(ids(c, 'scn.m2_1.outro')).not.toContain('l12');
    const withJory = { ...c, roster: [...c.roster, { ...c.roster[0]!, id: 'jory' }] };
    expect(ids(withJory, 'scn.m2_1.outro')).toContain('l12');
    const lucan = (stance: 'warm' | 'sober' | 'defiant') => ids({ ...c, stance: { warm: 0, sober: 0, defiant: 0, [stance]: 2 } }, 'scn.m2_1.outro').filter((l) => ['lw1', 'ls1', 'ld1'].includes(l));
    expect(lucan('warm')).toEqual(['lw1']);
    expect(lucan('sober')).toEqual(['ls1']);
    expect(lucan('defiant')).toEqual(['ld1']);
  });
});
