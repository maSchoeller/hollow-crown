/** Mission 2-6 "Gold für Banditen" (story 11.17): line-up, Sable or the captain, the tides, Nell, the proof, the scenes, E6 and the burnt village. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  conditionContext,
  createBattle,
  newCampaign,
  nodeEpilogues,
  resolveScene,
  runTriggers,
  terrainWarnings,
  type BattleState,
  type CampaignState,
  type Difficulty,
  type FlagValue,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';

let data: GameData;

/** A campaign in act 2 right before 2-6: act 1 and 2-1 to 2-4 done (2-5 too when `after25`), the company at home in the castle. */
function inAct2(flags: Record<string, FlagValue> = {}, difficulty: Difficulty = 'normal', after25 = false): CampaignState {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  const done = [...story, 'm2_1', 'm2_2', 'm2_3', 'm2_4', ...(after25 ? ['m2_5'] : [])];
  return { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: done, flags: { ...c.flags, ...flags } };
}

/** The company with a companion in it (a copy of the first roster entry under another id). */
const withUnit = (c: CampaignState, id: string): CampaignState => ({ ...c, roster: [...c.roster, { ...c.roster[0]!, id }] });
const academy = (c: CampaignState, level: number): CampaignState => ({ ...c, home: { kind: 'castle', rooms: { academy: level } } });

const battle = (c: CampaignState = inAct2()): BattleState => createBattle(data, c, 'm2_6', ['avatar', 'lucan']);
const map = () => data.maps.m2_6_kraehenholm!;
const terrainAt = (s: BattleState, p: Pos) => data.terrain[s.terrain[p[1] * s.width + p[0]]!]!.id;
const dialogues = (ev: GameEvent[]) => ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map m2_6_kraehenholm', () => {
  it('is the map of node m2_6 at Krähenholm: rout, Avatar or Lucan falling loses, ten deploy', () => {
    const node = data.acts[2]!.nodes.find((n) => n.id === 'm2_6')!;
    expect(node).toMatchObject({ map: 'm2_6_kraehenholm', place: 'kraehenholm', pre: 'scn.m2_6.intro', post: 'scn.m2_6.outro' });
    expect(map().objectives.victory).toEqual({ type: 'rout' });
    expect(map().objectives.defeat.map((d) => (d.type === 'unit_dies' ? d.unit : d.type))).toEqual(['avatar', 'lucan']);
    expect(map().deploy.max).toBe(10);
    expect(map().act).toBe(2);
  });

  it('has 24 / 27 / 32 foes with the waves', () => {
    for (const [d, n] of [['easy', 24], ['normal', 27], ['hard', 32]] as const) {
      const s = battle(inAct2({}, d));
      const start = s.units.filter((u) => u.team === 'enemy').length;
      const waves = map().reinforcements.flatMap((r) => r.units).filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
      expect(start + waves, d).toBe(n);
    }
  });

  it('puts the foes on the position level (P−3 … P−2, the captain P+1); no riders or fliers; two lieutenants, Grell and Sable', () => {
    const s = battle();
    expect(s.units.find((u) => u.uid === 'a1')!.level).toBe(s.positionLevel! - 3);
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy' && !x.lieutenant)) {
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset, u.id).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset, u.id).toBeLessThanOrEqual(u.id === 'captain' ? 1 : -2);
      expect(['cavalier', 'flier'].includes(data.classes[u.class]!.moveType), u.id).toBe(false);
    }
    expect(s.units.filter((u) => u.team === 'enemy' && u.lieutenant).map((u) => u.lieutenant).sort()).toEqual(['grell', 'sable']);
    expect(map().units.find((u) => u.id === 'grell')).toMatchObject({ class: data.lieutenants!.grell!.class, at: [13, 5], ai: { profile: 'guard' } });
  });

  it('puts Sable on the crag without E7 or after obey, the captain of the Border Army after warn – never both; both carry the key', () => {
    const at = (flags: Record<string, FlagValue>) => battle(inAct2(flags)).units.filter((u) => u.pos && u.pos[0] === 8 && u.pos[1] === 12).map((u) => u.id);
    expect(at({})).toEqual(['sable']);
    expect(at({ e07: 'obey' })).toEqual(['sable']);
    expect(at({ e07: 'warn' })).toEqual(['captain']);
    const captain = map().units.find((u) => u.id === 'captain')!;
    expect(captain.lieutenant).toBeUndefined();
    expect(captain).toMatchObject({ class: 'duelist', nameKey: 'unit.border_captain.name', items: [{ def: 'steel_sword' }, { def: 'door_key' }], drops: [1] });
    expect(map().units.find((u) => u.id === 'sable')).toMatchObject({ lieutenant: 'sable', class: 'duelist', items: [{ def: 'steel_sword' }, { def: 'door_key' }], drops: [1] });
  });

  it('has the plateau on level 1 and the crag on level 2 with the gold chest on it; vanguards guard the ramp', () => {
    const s = battle();
    expect(data.terrain[s.terrain[9 * s.width + 6]!]!).toMatchObject({ id: 'terrace', level: 1 });
    expect(terrainAt(s, [9, 11])).toBe('crag');
    expect(map().objects).toContainEqual(expect.objectContaining({ id: 'c_gold', type: 'chest', at: [9, 11] }));
    expect(terrainAt(s, [8, 15])).toBe('ramp');
    for (const id of ['b1', 'b2']) expect(map().units.find((u) => u.id === id)).toMatchObject({ class: 'vanguard', ai: { profile: 'guard' } });
  });

  it('has the waves in rounds 3 (boats west), 6 (from the ship) and 8 (boats east), all announced', () => {
    const waves = map().reinforcements.map((r) => ({ turn: r.turn, cols: [...new Set(r.units.map((u) => u.at[0]))].sort((a, b) => a - b), announce: r.announce }));
    expect(waves).toEqual([
      { turn: 3, cols: [1], announce: true },
      { turn: 6, cols: [11, 16], announce: true },
      { turn: 8, cols: [20], announce: true },
    ]);
  });

  it('lays the sandbank dry from round 4, warns of the tide in round 8 and floods it again in round 9', () => {
    const s = battle();
    const at = (turn: number, phase: 'player' | 'enemy') => {
      s.turn = turn;
      s.phase = phase;
      const ev: GameEvent[] = [];
      runTriggers(data, s, { kind: 'phase' }, ev);
      return dialogues(ev);
    };
    expect(terrainAt(s, [17, 10])).toBe('river');
    expect(at(3, 'player')).toEqual([]);
    expect(at(4, 'player')).toEqual(['scn.m2_6.ebb']);
    for (const p of [[16, 8], [18, 15], [17, 12]] as Pos[]) expect(terrainAt(s, p)).toBe('sand');
    s.turn = 7;
    expect(terrainWarnings(data, s)).toEqual([]);
    expect(at(8, 'player')).toEqual(['scn.m2_6.flood_warn']);
    expect(terrainWarnings(data, s).map((w) => ({ turn: w.turn, terrain: w.terrain }))).toEqual([{ turn: 9, terrain: 'river' }]);
    expect(terrainAt(s, [17, 12])).toBe('sand');
    at(9, 'player');
    expect(terrainAt(s, [17, 12])).toBe('river');
  });

  it('plays the proof scene once, when a company member first steps onto the crag', () => {
    const s = battle();
    const unit = s.units.find((u) => u.id === 'avatar')!;
    const fire = (p: Pos) => {
      unit.pos = p;
      const ev: GameEvent[] = [];
      runTriggers(data, s, { kind: 'moved', unit }, ev);
      return dialogues(ev);
    };
    expect(fire([8, 14])).toEqual([]);
    expect(fire([9, 12])).toEqual(['scn.m2_6.gold_proof']);
    expect(fire([10, 11])).toEqual([]);
  });

  it('has Nell as a guest in the north-west who joins only when talked to, on P − 1; side goals Nell and the gold', () => {
    const s = battle();
    const nell = s.units.find((u) => u.id === 'nell')!;
    expect(nell).toMatchObject({ team: 'other', guest: true, pos: [3, 5], level: s.positionLevel! - 1, recruit: { by: 'any', dialogue: 'scn.m2_6.nell_talk' } });
    expect(map().objectives.side).toEqual([
      { id: 's_nell', type: 'recruit', unit: 'nell', reward: { gold: 300 } },
      { id: 's_gold', type: 'open_chests', reward: { item: { def: 'vulnerary' } } },
    ]);
  });

  it('pays 2 000 gold (act 2 corridor 2 000–3 000) and has two haunt anchors', () => {
    expect(map().goldReward).toBe(2000);
    expect((map().haunts ?? []).map((a) => a.variant)).toEqual(['rout', 'treasure']);
  });
});

describe('scenes of 2-6, decision E6 and the burnt village', () => {
  const ids = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [l.line] : []));
  const speakers = (c: CampaignState, scene: string) =>
    new Map(resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [[l.line, l.speaker] as const] : [])));
  const choices = (c: CampaignState) => resolveScene(data, conditionContext(data, c), 'scn.m2_6.outro').filter((l) => l.kind === 'choice');
  const choiceOf = (c: CampaignState) => {
    const ch = choices(c);
    expect(ch).toHaveLength(1);
    const x = ch[0]!;
    if (x.kind !== 'choice') throw new Error('no choice');
    return x;
  };
  const withVarek = (flags: Record<string, FlagValue> = {}, after25 = false) => withUnit(inAct2(flags, 'normal', after25), 'varek');

  it('Maelis drops the company through her letter; Nell speaks only once she has joined', () => {
    const by = speakers(inAct2(), 'scn.m2_6.outro');
    expect(by.get('l03')).toBe('maelis');
    expect(by.get('l04')).toBe('maelis');
    expect(ids(inAct2(), 'scn.m2_6.outro')).not.toContain('l02');
    expect(ids(withUnit(inAct2(), 'nell'), 'scn.m2_6.outro')).toEqual(expect.arrayContaining(['l02', 'l07']));
  });

  it('after E7 warn Sable incriminates Dravn in the proof scene, otherwise Lucan reads the mark', () => {
    expect(speakers(inAct2({ e07: 'warn' }), 'scn.m2_6.gold_proof').get('l02')).toBe('sable');
    expect(ids(inAct2({ e07: 'warn' }), 'scn.m2_6.gold_proof')).not.toContain('l04');
    expect(ids(inAct2(), 'scn.m2_6.gold_proof')).toEqual(['l01', 'l04']);
    expect(ids(inAct2({ e07: 'obey' }), 'scn.m2_6.gold_proof')).toEqual(['l01', 'l04']);
  });

  it('without Varek E6 falls away without a scene: no envoy, no choice', () => {
    expect(choices(inAct2())).toHaveLength(0);
    for (const l of ['l08', 'l09', 'l10', 'l11', 'l12']) expect(ids(inAct2(), 'scn.m2_6.outro'), l).not.toContain(l);
    expect(speakers(withVarek(), 'scn.m2_6.outro').get('l09')).toBe('dravn_envoy');
  });

  it('E6 is a decision with three stances: warm and defiant keep Varek and lower Sable’s grudge, sober sends him back pardoned', () => {
    const c: CampaignState = { ...withVarek(), lieutenants: { sable: { grudge: 2 } as never } };
    const ch = choiceOf(c);
    expect(ch.decision).toBe(true);
    expect(ch.options.map((o) => [o.id, o.stance])).toEqual([['warm', 'warm'], ['sober', 'sober'], ['defiant', 'defiant']]);
    for (const o of ['warm', 'defiant']) {
      const r = applyCampaign(data, c, { type: 'choose', scene: 'scn.m2_6.outro', line: ch.line, option: o });
      expect(r.campaign.flags.e06, o).toBe('stay');
      expect(r.campaign.roster.some((u) => u.id === 'varek'), o).toBe(true);
      expect(r.campaign.lieutenants?.sable?.grudge, o).toBe(1);
    }
    const varek = c.roster.find((u) => u.id === 'varek')!;
    const carried = Object.values(varek.equip).filter(Boolean).length + varek.bag.length;
    const r = applyCampaign(data, c, { type: 'choose', scene: 'scn.m2_6.outro', line: ch.line, option: 'sober' });
    expect(r.campaign.flags.e06).toBe('pardon');
    expect(r.campaign.left).toContain('varek');
    expect(r.campaign.convoy.length).toBe(c.convoy.length + carried);
    expect(ids(withVarek({ e06: 'pardon' }), 'scn.m2_6.outro')).toEqual(expect.arrayContaining(['r01', 'r02']));
    expect(ids(withVarek({ e06: 'stay' }), 'scn.m2_6.outro')).toEqual(expect.arrayContaining(['s01', 's02']));
  });

  it('names the loss of academy level 3 only when E6 is the second decision, the academy is below 3 and Odile is gone (F3)', () => {
    const lineOf = (c: CampaignState) => choiceOf(c).line;
    // 2-5 done, Odile gone (E5 return), academy below 3: the hint
    expect(lineOf(withVarek({ e05: 'return' }, true))).toBe('c01_capped');
    expect(lineOf(academy(withVarek({}, true), 2))).toBe('c01_capped');
    expect(data.scenes['scn.m2_6.outro']!.lines.find((l) => l.id === 'c01_capped')).toMatchObject({
      choice: expect.arrayContaining([expect.objectContaining({ id: 'sober', summary: expect.stringContaining('Stufe 3') })]),
    });
    // academy on level 3, Odile still there, or 2-5 still open (E6 comes first): no hint
    expect(lineOf(academy(withVarek({}, true), 3))).toBe('c01');
    expect(lineOf(withUnit(withVarek({}, true), 'odile'))).toBe('c01');
    expect(lineOf(withVarek())).toBe('c01');
    expect(data.scenes['scn.m2_6.outro']!.lines.find((l) => l.id === 'c01')).not.toMatchObject({
      choice: expect.arrayContaining([expect.objectContaining({ summary: expect.stringContaining('Stufe 3') })]),
    });
  });

  it('plays the burnt village on the way back only after E7 warn (never two burning villages)', () => {
    expect(nodeEpilogues(data, inAct2({ e07: 'warn' }), 'm2_6')).toEqual(['scn.m2_6.burnt_village']);
    expect(nodeEpilogues(data, inAct2({ e07: 'obey' }), 'm2_6')).toEqual([]);
    expect(nodeEpilogues(data, inAct2(), 'm2_6')).toEqual([]);
    expect(nodeEpilogues(data, inAct2({ e07: 'warn' }), 'm2_5')).toEqual([]);
    expect(nodeEpilogues(data, inAct2(), 'nope')).toEqual([]);
    expect(data.scenes['scn.m2_6.burnt_village']).toMatchObject({ background: 'aschedorf' });
    expect(speakers(inAct2({ e07: 'warn' }), 'scn.m2_6.burnt_village').get('l04')).toBe('sable');
  });

  it('the intro: Sable recognises her old post only after she changed sides', () => {
    expect(ids(inAct2(), 'scn.m2_6.intro')).toContain('l04');
    expect(ids(inAct2(), 'scn.m2_6.intro')).not.toContain('l05');
    expect(ids(inAct2({ e07: 'warn' }), 'scn.m2_6.intro')).toContain('l05');
    expect(ids(inAct2({ e07: 'warn' }), 'scn.m2_6.intro')).not.toContain('l04');
  });
});
