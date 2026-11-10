/** Side quest N6 "Die Gauklertruppe" (story 11.22): node and memorial variant, escort of the troupe master, the tide, the boats, the lute. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  addToRoster,
  availableNodes,
  beginPhase,
  cheerReach,
  conditionContext,
  createBattle,
  deployInfo,
  newCampaign,
  nodeScenes,
  resolveScene,
  runTriggers,
  terrainAt,
  terrainWarnings,
  type BattleState,
  type CampaignState,
  type Difficulty,
  type GameData,
  type GameEvent,
  type Team,
} from '../../src/core';

let data: GameData;
const MAP = 'n6_auemarkt';

/** A campaign in act 2 after 2-1 to 2-6, Jory in the company (in), fallen (dead) or gone (left); `extra` companions join the roster. */
function afterM26(how: 'in' | 'dead' | 'left', difficulty: Difficulty = 'normal', ...extra: string[]): CampaignState {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  const s: CampaignState = { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: [...story, 'm2_1', 'm2_2', 'm2_3', 'm2_4', 'm2_5', 'm2_6'] };
  if (how === 'dead') s.fallen = [...s.fallen, { id: 'jory', nameKey: 'unit.jory.name', node: 'm2_4' }];
  if (how === 'left') s.left = [...s.left, 'jory'];
  if (how === 'in') addToRoster(data, s, 'jory');
  for (const id of extra) addToRoster(data, s, id);
  return s;
}

const map = () => data.maps[MAP]!;
const node = () => data.acts[2]!.nodes.find((n) => n.id === 'n6')!;
const battle = (d: Difficulty = 'normal'): BattleState => createBattle(data, afterM26('in', d), 'n6', ['avatar', 'lucan', 'jory']);
function phaseStart(s: BattleState, turn: number, phase: Team): GameEvent[] {
  const events: GameEvent[] = [];
  s.turn = turn;
  beginPhase(data, s, phase, events);
  return events;
}
const dialogues = (ev: GameEvent[]) => ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('node n6', () => {
  it('opens with 2-7 while Jory is in the company or has fallen, with the memorial variant when he has fallen; gone keeps it closed', () => {
    expect(node()).toMatchObject({ kind: 'side', map: MAP, place: 'auemarkt', pre: 'scn.n6.intro', post: 'scn.n6.outro', memorialIf: { dead: 'jory' } });
    const open = (c: CampaignState) => availableNodes(data, c).some((n) => n.id === 'n6');
    expect([open(afterM26('in')), open(afterM26('dead')), open(afterM26('left'))]).toEqual([true, true, false]);
    expect(nodeScenes(data, afterM26('in'), 'n6')).toEqual({ pre: 'scn.n6.intro', post: 'scn.n6.outro' });
    expect(nodeScenes(data, afterM26('dead'), 'n6')).toEqual({ pre: 'scn.n6.memorial_intro', post: 'scn.n6.memorial_outro' });
  });

  it('rewards the lute Final Curtain in both variants; it cheers two allies through cheerTargets (story 10.4)', () => {
    expect(node().effects).toEqual([{ item: { def: 'final_curtain' } }]);
    expect(node().effectsIf ?? []).toEqual([]);
    expect(data.items.final_curtain).toMatchObject({ kind: 'accessory', slot: 'offHand', group: 'lute', rarity: 'legendary', grantsSkill: { skill: 'final_curtain' } });
    expect(data.skills.final_curtain!.effect).toEqual({ cheerTargets: 2 });

    const s = battle();
    const jory = s.units.find((u) => u.id === 'jory')!;
    expect(cheerReach(data, s, jory).targets).toBe(1);
    jory.equip.offHand = { uid: 'lute_test', def: 'final_curtain', upgrade: 0, affixes: [], runes: [] };
    expect(cheerReach(data, s, jory)).toEqual({ range: 1, targets: 2 });
  });

  it('forces Jory while he lives and drops him from the forced line-up once he has fallen', () => {
    expect(map().deploy).toMatchObject({ max: 7, forced: ['avatar', 'lucan', 'jory'] });
    expect(deployInfo(data, afterM26('in'), 'n6').forced).toEqual(['avatar', 'lucan', 'jory']);
    expect(deployInfo(data, afterM26('dead'), 'n6').forced).toEqual(['avatar', 'lucan']);
  });
});

describe('map n6_auemarkt', () => {
  it('is an escort: the troupe master follows the company to the boat and does not join; she, Avatar or Lucan falling loses', () => {
    expect(map()).toMatchObject({ act: 2, size: [14, 18] });
    expect(map().haunts).toBeUndefined();
    expect(map().objectives.victory).toEqual({ type: 'escort', unit: 'troupe_master', area: { rect: [1, 15, 4, 17] }, join: false });
    expect(map().objectives.defeat.map((d) => ('unit' in d ? d.unit : d.type))).toEqual(['avatar', 'lucan', 'troupe_master']);
    const master = battle().units.find((u) => u.id === 'troupe_master')!;
    expect(master).toMatchObject({ team: 'other', classId: 'minstrel', pos: [10, 5], ai: { profile: 'follow' }, level: 15 });
  });

  it('has 13 / 16 / 19 foes with boats in rounds 3 (east) and 5 (west), all on P−3 to P−1', () => {
    const count = (d: Difficulty) => battle(d).units.filter((u) => u.team === 'enemy').length + map().reinforcements.flatMap((r) => r.units).length;
    expect([count('easy'), count('normal'), count('hard')]).toEqual([13, 16, 19]);
    expect(map().reinforcements.map((r) => [r.turn, r.phase, r.announce, r.units.length])).toEqual([
      [3, 'enemy', true, 3],
      [5, 'enemy', true, 2],
    ]);
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy')) {
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset, u.id).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset, u.id).toBeLessThanOrEqual(-1);
      expect(u.lieutenant, u.id).toBeUndefined();
    }
    // P after 2-1 to 2-6: base 12 + 6 story nodes
    const s = battle();
    expect(s.units.find((u) => u.id === 'boss')!.level).toBe(17);
    expect(s.units.find((u) => u.id === 'a1')!.level).toBe(15);
  });

  it('the stage is a terrace on level 1 with stairs; the tide takes the west footbridge in round 6, warned from round 5', () => {
    const s = battle();
    expect([terrainAt(s, [8, 5]), terrainAt(s, [10, 5])]).toEqual(['stairs', 'terrace']);
    expect(data.terrain.terrace!.level).toBe(1);
    expect([terrainAt(s, [2, 14]), terrainAt(s, [6, 14]), terrainAt(s, [7, 14])]).toEqual(['footbridge', 'bridge', 'bridge']);
    phaseStart(s, 4, 'player');
    expect(terrainWarnings(data, s)).toEqual([]);
    expect(dialogues(phaseStart(s, 5, 'player'))).toEqual(['scn.n6.tide_warn']);
    expect(terrainWarnings(data, s)).toEqual([{ trigger: 't_tide', turn: 6, terrain: 'river', tiles: [[2, 14]] }]);
    phaseStart(s, 5, 'enemy');
    expect(terrainAt(s, [2, 14])).toBe('footbridge');
    phaseStart(s, 6, 'player');
    expect([terrainAt(s, [2, 14]), terrainAt(s, [6, 14])]).toEqual(['river', 'bridge']);
  });

  it('plays the talk with the master once, when a company member steps onto the stage', () => {
    const s = battle();
    const avatar = s.units.find((u) => u.id === 'avatar')!;
    const fire = (at: [number, number]): string[] => {
      avatar.pos = at;
      const ev: GameEvent[] = [];
      runTriggers(data, s, { kind: 'moved', unit: avatar }, ev);
      return dialogues(ev);
    };
    expect(fire([6, 8])).toEqual([]);
    expect(fire([9, 5])).toEqual(['scn.n6.master_talk']);
    expect(fire([11, 4])).toEqual([]);
  });
});

describe('scenes of N6', () => {
  const ids = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [l.line] : []));

  it('the master talk speaks through Jory while he lives, else through Lucan', () => {
    expect(ids(afterM26('in'), 'scn.n6.master_talk')).toEqual(['l01', 'l02', 'l03', 'l04', 'l07']);
    expect(ids(afterM26('dead'), 'scn.n6.master_talk')).toEqual(['l01', 'l05', 'l06', 'l07']);
  });

  it('Nell warns of the tide only once she has joined', () => {
    expect(ids(afterM26('in'), 'scn.n6.tide_warn')).toEqual(['l01', 'l03']);
    expect(ids(afterM26('in', 'normal', 'nell'), 'scn.n6.tide_warn')).toEqual(['l01', 'l02']);
    expect(ids(afterM26('in'), 'scn.n6.intro')).not.toContain('l05');
    expect(ids(afterM26('in', 'normal', 'nell'), 'scn.n6.intro')).toContain('l05');
  });
});
