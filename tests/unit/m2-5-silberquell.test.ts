/** Mission 2-5 "Die verstoßene Leibwache" (story 11.16): line-up, Sable or the captain, the west bridge, Odile's escort, Amos, the scenes and E5. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  checkObjectives,
  conditionContext,
  createBattle,
  newCampaign,
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

/** A campaign in act 2 right before 2-5: act 1 and 2-1 to 2-4 done, the company at home in the castle. */
function inAct2(flags: Record<string, FlagValue> = {}, difficulty: Difficulty = 'normal'): CampaignState {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  return { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: [...story, 'm2_1', 'm2_2', 'm2_3', 'm2_4'], flags: { ...c.flags, ...flags } };
}

/** The company with a companion in it (a copy of the first roster entry under another id). */
const withUnit = (c: CampaignState, id: string): CampaignState => ({ ...c, roster: [...c.roster, { ...c.roster[0]!, id }] });

const battle = (c: CampaignState = inAct2()): BattleState => createBattle(data, c, 'm2_5', ['avatar', 'lucan']);
const map = () => data.maps.m2_5_silberquell!;
const terrainAt = (s: BattleState, p: Pos) => data.terrain[s.terrain[p[1] * s.width + p[0]]!]!.id;
const dialogues = (ev: GameEvent[]) => ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map m2_5_silberquell', () => {
  it('is the map of node m2_5 at Silberquell: escort Odile to the exit, Avatar, Lucan or Odile falling loses', () => {
    const node = data.acts[2]!.nodes.find((n) => n.id === 'm2_5')!;
    expect(node).toMatchObject({ map: 'm2_5_silberquell', place: 'silberquell', pre: 'scn.m2_5.intro', post: 'scn.m2_5.outro' });
    expect(map().objectives.victory).toEqual({ type: 'escort', unit: 'odile', area: { rect: [8, 0, 11, 1] } });
    expect(map().objectives.defeat.map((d) => (d.type === 'unit_dies' ? d.unit : d.type))).toEqual(['avatar', 'lucan', 'odile']);
    expect(map().deploy.max).toBe(9);
    expect(map().act).toBe(2);
  });

  it('has 18 / 22 / 26 foes with the waves, exactly one of them at the exit', () => {
    for (const [d, n] of [['easy', 18], ['normal', 22], ['hard', 26]] as const) {
      const s = battle(inAct2({}, d));
      const start = s.units.filter((u) => u.team === 'enemy').length;
      const waves = map().reinforcements.flatMap((r) => r.units).filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
      expect(start + waves, d).toBe(n);
    }
  });

  it('puts the foes on the position level: start P−3, waves P−2 (hard elite P−2), the captain P+1; no riders or fliers', () => {
    const s = battle();
    const y1 = s.units.find((u) => u.uid === 'y1')!;
    expect(y1.level).toBe(s.positionLevel! - 3);
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy' && !x.lieutenant)) {
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset, u.id).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset, u.id).toBeLessThanOrEqual(u.id === 'captain' ? 1 : -2);
      expect(['cavalier', 'flier'].includes(data.classes[u.class]!.moveType), u.id).toBe(false);
    }
  });

  it('puts Sable at the exit without E7 or after obey, the captain of the Border Army after warn – never both', () => {
    const at = (flags: Record<string, FlagValue>) => battle(inAct2(flags)).units.filter((u) => u.pos && u.pos[0] === 9 && u.pos[1] === 4).map((u) => u.id);
    expect(at({})).toEqual(['sable']);
    expect(at({ e07: 'obey' })).toEqual(['sable']);
    expect(at({ e07: 'warn' })).toEqual(['captain']);
    const captain = map().units.find((u) => u.id === 'captain')!;
    expect(captain.lieutenant).toBeUndefined();
    expect(captain).toMatchObject({ class: 'duelist', nameKey: 'unit.border_captain.name', items: [{ def: 'steel_sword' }] });
    expect(map().units.find((u) => u.id === 'sable')).toMatchObject({ lieutenant: 'sable', class: 'duelist', items: [{ def: 'steel_sword' }] });
  });

  it('has the waves in rounds 3 (behind the wall), 5 (south rim of the gorge) and 7 (exit), all announced', () => {
    const waves = map().reinforcements.map((r) => ({ turn: r.turn, rows: [...new Set(r.units.map((u) => u.at[1]))].sort(), announce: r.announce }));
    expect(waves).toEqual([
      { turn: 3, rows: [23, 24], announce: true },
      { turn: 5, rows: [13], announce: true },
      { turn: 7, rows: [0], announce: true },
    ]);
  });

  it('has the north rim one level up, with marksmen holding it and knights guarding the ramps', () => {
    const s = battle();
    expect(map().levels).toEqual([{ level: 1, area: { rect: [0, 0, 19, 7] } }]);
    for (const id of ['r1', 'r2']) expect(s.units.find((u) => u.uid === id)).toMatchObject({ classId: 'marksman' });
    expect(map().units.find((u) => u.id === 'k1')).toMatchObject({ class: 'knight', at: [4, 7], ai: { profile: 'guard' } });
    expect(map().units.find((u) => u.id === 'k2')).toMatchObject({ class: 'knight', at: [15, 7], ai: { profile: 'guard' } });
  });

  it('warns of the west bridge from round 5 (scene and marked tiles) and cuts it in the enemy phase of round 6, the east bridge stays', () => {
    const s = battle();
    const at = (turn: number, phase: 'player' | 'enemy') => {
      s.turn = turn;
      s.phase = phase;
      const ev: GameEvent[] = [];
      runTriggers(data, s, { kind: 'phase' }, ev);
      return ev;
    };
    s.turn = 4;
    expect(terrainWarnings(data, s)).toEqual([]);
    expect(dialogues(at(4, 'player'))).toEqual([]);
    expect(dialogues(at(5, 'player'))).toEqual(['scn.m2_5.bridge_warn']);
    expect(terrainWarnings(data, s).map((w) => ({ turn: w.turn, terrain: w.terrain, tiles: w.tiles }))).toEqual([{ turn: 6, terrain: 'river', tiles: [[4, 10], [4, 11]] }]);
    expect(terrainAt(s, [4, 10])).toBe('footbridge');
    at(6, 'player');
    expect(terrainAt(s, [4, 10])).toBe('footbridge');
    at(6, 'enemy');
    expect(terrainAt(s, [4, 10])).toBe('river');
    expect(terrainAt(s, [4, 11])).toBe('river');
    for (const y of [9, 10, 11, 12]) expect(terrainAt(s, [15, y])).toBe('footbridge');
  });

  it('plays the meeting with Odile once, when a company member reaches the yard around her', () => {
    const s = battle();
    const unit = s.units.find((u) => u.id === 'avatar')!;
    const fire = (p: Pos) => {
      unit.pos = p;
      const ev: GameEvent[] = [];
      runTriggers(data, s, { kind: 'moved', unit }, ev);
      return dialogues(ev);
    };
    expect(fire([9, 22])).toEqual([]);
    expect(fire([9, 18])).toEqual(['scn.m2_5.odile_meet']);
    expect(fire([10, 17])).toEqual([]);
  });

  it('has Odile following the company on P − 1; she wins the mission at the exit and losing her loses it', () => {
    const s = battle();
    const odile = s.units.find((u) => u.id === 'odile')!;
    expect(odile).toMatchObject({ team: 'other', level: s.positionLevel! - 1 });
    expect(odile.ai?.profile).toBe('follow');
    expect(Object.values(odile.equip).map((i) => i?.def)).toContain('steel_sword');
    odile.pos = [9, 1];
    const ev: GameEvent[] = [];
    checkObjectives(data, s, ev);
    expect(s.outcome).toBe('victory');

    const lost = battle();
    lost.units.find((u) => u.id === 'odile')!.downed = true;
    checkObjectives(data, lost, []);
    expect(lost.outcome).toBe('defeat');
  });

  it('has Amos as a guest at the hospice who joins only when talked to, on P − 1; side goals Amos and 11 rounds', () => {
    const s = battle();
    const amos = s.units.find((u) => u.id === 'amos')!;
    expect(amos).toMatchObject({ team: 'other', guest: true, level: s.positionLevel! - 1, recruit: { by: 'any', dialogue: 'scn.m2_5.amos_talk' } });
    expect(map().objectives.side).toEqual([
      { id: 's_amos', type: 'recruit', unit: 'amos', reward: { gold: 300 } },
      { id: 's_fast', type: 'turn_limit', turns: 11, reward: { gold: 300 } },
    ]);
    expect(map().objects).toContainEqual(expect.objectContaining({ id: 'v_hospice', type: 'village', at: [13, 19] }));
  });

  it('pays 2 000 gold (act 2 corridor 2 000–3 000) and has two haunt anchors away from the start', () => {
    expect(map().goldReward).toBe(2000);
    expect((map().haunts ?? []).map((a) => a.variant)).toEqual(['escort', 'rout']);
  });
});

describe('scenes of 2-5 and decision E5', () => {
  const ids = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [l.line] : []));
  const choiceOf = (c: CampaignState) => {
    const ch = resolveScene(data, conditionContext(data, c), 'scn.m2_5.outro').filter((l) => l.kind === 'choice');
    expect(ch).toHaveLength(1);
    const x = ch[0]!;
    if (x.kind !== 'choice') throw new Error('no choice');
    return x;
  };
  const withOdile = (flags: Record<string, FlagValue> = {}) => withUnit(inAct2(flags), 'odile');

  it('Odile tells of Halvard’s letters (seed voice) and a lance rider brings Seraphine’s call', () => {
    const lines = resolveScene(data, conditionContext(data, withOdile()), 'scn.m2_5.outro');
    const by = new Map(lines.flatMap((l) => (l.kind === 'line' ? [[l.line, l.speaker] as const] : [])));
    expect(by.get('l06')).toBe('odile');
    expect(data.scenes['scn.m2_5.outro']!.lines.find((l) => l.id === 'l06')).toMatchObject({ text: expect.stringContaining('Er schreibt ihr nachts, nach Gesprächen mit der Krone.') });
    expect(by.get('l12')).toBe('lance_rider');
    expect([...by.values()]).not.toContain('seraphine');
  });

  it('E5 is a decision with three stances: warm and defiant keep Odile, sober sends her back', () => {
    const c = withOdile();
    const ch = choiceOf(c);
    expect(ch.decision).toBe(true);
    expect(ch.options.map((o) => [o.id, o.stance])).toEqual([['warm', 'warm'], ['sober', 'sober'], ['defiant', 'defiant']]);
    for (const o of ['warm', 'defiant']) {
      const r = applyCampaign(data, c, { type: 'choose', scene: 'scn.m2_5.outro', line: ch.line, option: o });
      expect(r.campaign.flags.e05, o).toBe('stay');
      expect(r.campaign.roster.some((u) => u.id === 'odile'), o).toBe(true);
    }
  });

  it('return: Odile leaves with a farewell line, her equipment goes into the convoy, e05 is set', () => {
    const c = withOdile();
    const odile = c.roster.find((u) => u.id === 'odile')!;
    const carried = Object.values(odile.equip).filter(Boolean).length + odile.bag.length;
    const r = applyCampaign(data, c, { type: 'choose', scene: 'scn.m2_5.outro', line: choiceOf(c).line, option: 'sober' });
    expect(r.campaign.flags.e05).toBe('return');
    expect(r.campaign.roster.some((u) => u.id === 'odile')).toBe(false);
    expect(r.campaign.left).toContain('odile');
    expect(r.campaign.convoy.length).toBe(c.convoy.length + carried);
    expect(ids(withOdile({ e05: 'return' }), 'scn.m2_5.outro')).toEqual(expect.arrayContaining(['r01', 'r02', 'r03']));
    expect(ids(withOdile({ e05: 'return' }), 'scn.m2_5.outro')).not.toContain('s01');
    expect(ids(withOdile({ e05: 'stay' }), 'scn.m2_5.outro')).toContain('s01');
  });

  it('names the loss of academy level 3 on the return card only when the academy is below 3 and Varek is not in the company (F3)', () => {
    const summaryOf = (c: CampaignState) => {
      const ch = choiceOf(c);
      return { line: ch.line, key: ch.options.find((o) => o.id === 'sober')!.summaryKey };
    };
    // no Varek, academy level 1 or 2: the hint
    expect(summaryOf(withOdile()).line).toBe('c01_capped');
    expect(summaryOf({ ...withOdile(), home: { kind: 'castle', rooms: { academy: 2 } } }).line).toBe('c01_capped');
    expect(data.scenes['scn.m2_5.outro']!.lines.find((l) => l.id === 'c01_capped')).toMatchObject({
      choice: expect.arrayContaining([expect.objectContaining({ id: 'sober', summary: expect.stringContaining('Stufe 3') })]),
    });
    // academy already on level 3, or Varek still there: no hint
    expect(summaryOf({ ...withOdile(), home: { kind: 'castle', rooms: { academy: 3 } } }).line).toBe('c01');
    expect(summaryOf(withUnit(withOdile(), 'varek')).line).toBe('c01');
    expect(data.scenes['scn.m2_5.outro']!.lines.find((l) => l.id === 'c01')).not.toMatchObject({
      choice: expect.arrayContaining([expect.objectContaining({ summary: expect.stringContaining('Stufe 3') })]),
    });
  });

  it('Sable speaks only after she changed sides at E7; Varek greets Odile only when he is in the company', () => {
    expect(ids(inAct2(), 'scn.m2_5.intro')).toContain('l04');
    expect(ids(inAct2(), 'scn.m2_5.intro')).not.toContain('l05');
    expect(ids(inAct2({ e07: 'warn' }), 'scn.m2_5.intro')).toEqual(expect.arrayContaining(['l05']));
    expect(ids(inAct2({ e07: 'warn' }), 'scn.m2_5.intro')).not.toContain('l04');
    expect(ids(withOdile(), 'scn.m2_5.outro')).not.toContain('l10');
    expect(ids(withOdile({ e07: 'warn' }), 'scn.m2_5.outro')).toContain('l10');
    expect(ids(withOdile(), 'scn.m2_5.outro')).not.toContain('l09');
    expect(ids(withUnit(withOdile(), 'varek'), 'scn.m2_5.outro')).toContain('l09');
  });
});
