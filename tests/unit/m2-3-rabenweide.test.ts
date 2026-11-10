/** Mission 2-3 "Die Rabenweide" (story 11.14): line-up, Rowena (boss and lieutenant, flees = victory), fords and footbridge, Ilka, waves, scenes. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  availableActions,
  beginPhase,
  checkObjectives,
  conditionContext,
  createBattle,
  knockOut,
  lieutenantLevel,
  newCampaign,
  reachable,
  resolveScene,
  startBattle,
  terrainAt,
  type BattleState,
  type BattleUnit,
  type CampaignState,
  type Difficulty,
  type GameData,
  type GameEvent,
  type Pos,
  type Team,
} from '../../src/core';

let data: GameData;

/** A campaign in act 2 after 2-1 (`late`: after 2-2 as well), the company at home in the castle. */
function inAct2(difficulty: Difficulty = 'normal', late = false): CampaignState {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  return { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: [...story, 'm2_1', ...(late ? ['m2_2'] : [])] };
}

const battle = (d: Difficulty = 'normal', late = false): BattleState => startBattle(data, createBattle(data, inAct2(d, late), 'm2_3', ['avatar', 'lucan'])).state;
const map = () => data.maps.m2_3_rabenweide!;
const unit = (s: BattleState, id: string): BattleUnit => s.units.find((u) => u.id === id)!;
const dialogues = (ev: GameEvent[]) => ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));
function phaseStart(s: BattleState, turn: number, phase: Team): GameEvent[] {
  const events: GameEvent[] = [];
  s.turn = turn;
  beginPhase(data, s, phase, events);
  return events;
}

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map m2_3_rabenweide', () => {
  it('is the map of node m2_3 in act 2: beat the boss Rowena, Avatar or Lucan falling loses, 9 places, noon and clear', () => {
    const node = data.acts[2]!.nodes.find((n) => n.id === 'm2_3')!;
    expect(node).toMatchObject({ map: 'm2_3_rabenweide', place: 'rabenweide', pre: 'scn.m2_3.intro', post: 'scn.m2_3.outro', requires: [{ completed: 'm2_1' }] });
    expect(map()).toMatchObject({ act: 2, size: [22, 26], timeOfDay: 'noon', weather: 'clear' });
    expect(map().objectives.victory).toEqual({ type: 'boss', unit: 'rowena' });
    expect(map().objectives.defeat).toEqual([
      { type: 'unit_dies', unit: 'avatar' },
      { type: 'unit_dies', unit: 'lucan' },
    ]);
    expect(map().deploy.max).toBe(9);
  });

  it('has 20 / 24 / 28 foes with the waves and Ilka, no riders or fliers', () => {
    for (const [d, n] of [['easy', 20], ['normal', 24], ['hard', 28]] as const) {
      const s = battle(d);
      const start = s.units.filter((u) => u.team === 'enemy').length;
      const waves = map().reinforcements.flatMap((r) => r.units).filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
      expect(start + waves, d).toBe(n);
    }
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy'))
      expect(['knight', 'vanguard', 'skirmisher', 'marksman', 'healer'], u.id).toContain(u.class);
  });

  it('puts every foe on the position level only through levelOffset (P−3…P−1), Rowena on the lieutenant level; P = 13 after 2-1, 14 after 2-2', () => {
    const s = battle();
    expect(s.positionLevel).toBe(13);
    expect(battle('normal', true).positionLevel).toBe(14);
    expect(unit(s, 's1').level).toBe(10);
    expect(unit(s, 'k1').level).toBe(11);
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy' && !x.lieutenant && !x.char)) {
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset).toBeLessThanOrEqual(-1);
      expect(['unit.lance_knight.name', 'unit.lance_squire.name'], u.id).toContain(u.nameKey);
    }
    expect(unit(s, 'rowena').level).toBe(lieutenantLevel(data, inAct2(), 0));
  });

  it('has Rowena as boss and lieutenant in the stud yard, waking when someone comes close and then holding the yard', () => {
    expect(map().units.find((u) => u.id === 'rowena')).toMatchObject({ class: 'knight', boss: true, lieutenant: 'rowena', at: [10, 3], items: [{ def: 'steel_lance' }], ai: { profile: 'trigger', radius: 5, then: 'guard' } });
  });

  it('is won when Rowena falls to 0 HP: she flees as a lieutenant instead of dying', () => {
    const s = battle();
    const rowena = unit(s, 'rowena');
    const events: GameEvent[] = [];
    checkObjectives(data, s, events);
    expect(s.outcome).toBeNull();
    knockOut(data, s, rowena, events, unit(s, 'avatar').uid);
    expect(rowena.gone).toBe('fled');
    checkObjectives(data, s, events);
    expect(s.outcome).toBe('victory');
  });

  it('sends the waves in round 3 from the east and round 5 from the west on the south bank, round 7 out of the yard in the north, all announced', () => {
    const waves = map().reinforcements.map((r) => ({ turn: r.turn, cols: [...new Set(r.units.map((u) => u.at[0]))], rows: [...new Set(r.units.map((u) => u.at[1]))], announce: r.announce }));
    expect(waves).toEqual([
      { turn: 3, cols: [21], rows: [19, 17, 15], announce: true },
      { turn: 5, cols: [0], rows: [17, 18, 19], announce: true },
      { turn: 7, cols: [10, 11], rows: [0], announce: true },
    ]);
  });

  it('keeps three fords that armoured units cannot wade, and a footbridge by the road that brings them to the north bank (F5 = C)', () => {
    const s = battle();
    expect([[3, 12], [4, 13], [9, 12], [11, 13], [17, 12], [18, 13]].map((p) => terrainAt(s, p as Pos))).toEqual(Array(6).fill('shallows'));
    expect([[10, 12], [10, 13]].map((p) => terrainAt(s, p as Pos))).toEqual(['footbridge', 'footbridge']);
    for (const u of s.units) if (u.team === 'enemy') u.pos = null;
    const lucan = unit(s, 'lucan');
    lucan.classId = 'vanguard';
    lucan.pos = [10, 14];
    const reach = reachable(data, s, lucan, [10, 14], 99);
    expect(reach.has('10,11')).toBe(true);
    expect(reach.has('9,12') || reach.has('4,12') || reach.has('17,12')).toBe(false);
  });

  it('fences the paddocks with paddock fence and gates that block like a fence; the gaps stay open', () => {
    const s = battle();
    expect([[1, 5], [4, 5], [7, 6], [16, 5]].map((p) => terrainAt(s, p as Pos))).toEqual(['paddock', 'paddock_gate', 'paddock', 'paddock_gate']);
    expect([[7, 7], [13, 7], [4, 9], [16, 9]].map((p) => terrainAt(s, p as Pos))).toEqual(['grass', 'grass', 'grass', 'grass']);
    for (const t of ['paddock', 'paddock_gate']) expect(data.terrain[t]!.cost).toEqual(data.terrain.fence!.cost);
  });

  it('has Ilka as a foe in the wood on the north-east bank who joins only when talked to, by anyone, on P − 1 with her own weapons', () => {
    const s = battle();
    const ilka = unit(s, 'ilka');
    expect(ilka).toMatchObject({ team: 'enemy', pos: [18, 11], level: 12, recruit: { by: 'any', dialogue: 'scn.m2_3.ilka_talk' } });
    expect([...Object.values(ilka.equip).map((i) => i?.def), ...ilka.bag.map((i) => i.def)]).toEqual(expect.arrayContaining(['steel_bow']));
    const mira = unit(s, 'lucan');
    mira.pos = [17, 11];
    expect(availableActions(data, s, mira, [17, 11]).find((a) => a.kind === 'talk')?.targets).toEqual([ilka.uid]);
    const r = applyCommand(data, s, { type: 'act', unit: mira.uid, to: [17, 11], action: { kind: 'talk', target: ilka.uid } });
    expect(unit(r.state, 'ilka').team).toBe('player');
    expect(dialogues(r.events)).toContain('scn.m2_3.ilka_talk');
    expect(map().objectives.side).toContainEqual({ id: 's_ilka', type: 'recruit', unit: 'ilka', reward: { gold: 300 } });
  });

  it('plays the water hint once, at the start of the player phase of round 2', () => {
    const s = battle();
    expect(dialogues(phaseStart(s, 2, 'enemy'))).toEqual([]);
    expect(dialogues(phaseStart(s, 2, 'player'))).toEqual(['scn.m2_3.water_hint']);
    expect(dialogues(phaseStart(s, 3, 'player'))).toEqual([]);
  });

  it('pays 2 000 gold and has two haunt anchors, rout on the south pasture and defend in the stud yard (F8 = A)', () => {
    expect(map().goldReward).toBe(2000);
    expect((map().haunts ?? []).map((a) => a.variant)).toEqual(['rout', 'defend']);
    expect(map().objectives.side).toContainEqual({ id: 's_stables', type: 'visit_villages', reward: { item: { def: 'vulnerary' } } });
  });

  it('sets the stables, barns and hay of the gallery in the stud yard (F6 = D)', () => {
    expect(new Set((map().propVariants ?? []).map((p) => p.model))).toEqual(new Set(['stable_a', 'barn_a', 'hay_a']));
    expect(data.render.board.variants.house.find((v) => v.model === 'stable_a')).toEqual({ model: 'stable_a', weight: 0, wide: true });
  });
});

describe('scenes of 2-3', () => {
  const lines = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [l] : []));
  const ids = (c: CampaignState, scene: string) => lines(c, scene).map((l) => l.line);
  const withIlka = (c: CampaignState): CampaignState => ({ ...c, roster: [...c.roster, { ...c.roster[0]!, id: 'ilka' }] });
  /** the German text of a line of a scene */
  const textOf = (scene: string, id: string): string => {
    const l = data.scenes[scene]!.lines.find((x) => x.id === id);
    return l && 'text' in l ? l.text : '';
  };

  it('the intro brings Dravn’s order through his envoy, with the small lie that the crown granted the horses long ago (F4 = A)', () => {
    const intro = lines(inAct2(), 'scn.m2_3.intro');
    const envoy = intro.filter((l) => l.speaker === 'dravn_envoy').map((l) => l.line);
    expect(envoy).toEqual(['l02', 'l03', 'l05']);
    expect(textOf('scn.m2_3.intro', 'l03')).toContain('längst zugesprochen');
  });

  it('the outro: Rowena gives up, has Lucan tended instead of taking him prisoner (F2 = A) and uncovers the lie; Ilka speaks only when she joined', () => {
    const c = inAct2();
    const outro = lines(c, 'scn.m2_3.outro');
    const by = new Map(outro.map((l) => [l.line, l.speaker] as const));
    expect([by.get('l02'), by.get('l04'), by.get('l07')]).toEqual(['rowena', 'rowena', 'rowena']);
    const text = (id: string) => textOf('scn.m2_3.outro', id);
    expect(text('l02')).toContain('gebe das Gestüt');
    expect(text('l03')).toContain('Lucan');
    expect(text('l04')).toContain('keinen Verwundeten gefangen');
    expect(text('l07')).toContain('verweigert');
    expect(ids(c, 'scn.m2_3.outro')).not.toContain('l10');
    expect(ids(withIlka(c), 'scn.m2_3.outro')).toContain('l10');
    expect(data.scenes['scn.m2_3.outro']).toMatchObject({ background: 'rabenweide' });
  });

  it('Rowena’s flee line no longer says she never gives up (F1 = A)', () => {
    expect(textOf('scn.lt.rowena', 'flee_2')).not.toContain('aufgibt');
  });
});
