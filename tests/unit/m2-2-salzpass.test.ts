/** Mission 2-2 "Das Siegel im Salzpass" (story 11.13): line-up, fog, rockfall, the seal chest with and without a scout, rearguard, scenes. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { newItem } from '../../src/core/battle/create';
import {
  applyCommand,
  beginPhase,
  conditionContext,
  createBattle,
  newCampaign,
  openTargets,
  reachable,
  resolveScene,
  startBattle,
  terrainAt,
  terrainWarnings,
  visionRadius,
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

/** A campaign in act 2 after 2-1, the company at home in the castle; without `fenn` the scout has left (E2) or fallen. */
function afterM21(difficulty: Difficulty = 'normal', fenn = false): CampaignState {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  const others = c.roster.filter((r) => r.id !== 'fenn');
  const scout = c.roster.find((r) => r.id === 'fenn') ?? { ...c.roster[0]!, id: 'fenn', name: undefined, nameKey: 'unit.fenn.name', classId: 'scout' };
  const roster = fenn ? [...others, scout] : others;
  return { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: [...story, 'm2_1'], roster, left: fenn ? c.left : [...c.left, 'fenn'] };
}

const battle = (d: Difficulty = 'normal', fenn = false): BattleState =>
  startBattle(data, createBattle(data, afterM21(d, fenn), 'm2_2', fenn ? ['avatar', 'lucan', 'fenn'] : ['avatar', 'lucan'])).state;
const map = () => data.maps.m2_2_salzpass!;
const dist = (a: Pos, b: Pos) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const unit = (s: BattleState, id: string): BattleUnit => s.units.find((u) => u.id === id)!;
/** Takes the foes out of the battle. */
function quiet(s: BattleState): BattleState {
  for (const u of s.units) if (u.team === 'enemy') {
    u.pos = null;
    u.gone = 'retreated';
  }
  return s;
}
function phaseStart(s: BattleState, turn: number, phase: Team): GameEvent[] {
  const events: GameEvent[] = [];
  s.turn = turn;
  beginPhase(data, s, phase, events);
  return events;
}
const dialogues = (ev: GameEvent[]) => ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));
const terrains = (s: BattleState, tiles: Pos[]) => tiles.map((p) => terrainAt(s, p));

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map m2_2_salzpass', () => {
  it('is the map of node m2_2 in act 2: open the seal chest within 11 rounds, Avatar or Lucan falling loses, 7 places, fog', () => {
    const node = data.acts[2]!.nodes.find((n) => n.id === 'm2_2')!;
    expect(node).toMatchObject({ map: 'm2_2_salzpass', place: 'salzpass', pre: 'scn.m2_2.intro', post: 'scn.m2_2.outro', requires: [{ completed: 'm2_1' }] });
    expect(map().act).toBe(2);
    expect(map().objectives.victory).toEqual({ type: 'treasure', chests: ['c_seal'], turns: 11 });
    expect(map().objectives.defeat).toEqual([
      { type: 'unit_dies', unit: 'avatar' },
      { type: 'unit_dies', unit: 'lucan' },
    ]);
    expect(map().deploy.max).toBe(7);
    expect(map()).toMatchObject({ fog: true, weather: 'fog', size: [16, 20] });
  });

  it('has 13 / 16 / 19 foes with the rearguard, Grell among them as lieutenant, no riders or fliers', () => {
    for (const [d, n] of [['easy', 13], ['normal', 16], ['hard', 19]] as const) {
      const s = battle(d);
      const start = s.units.filter((u) => u.team === 'enemy').length;
      const waves = map().reinforcements.flatMap((r) => r.units).filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
      expect(start + waves, d).toBe(n);
    }
    expect(map().units.find((u) => u.id === 'grell')).toMatchObject({ lieutenant: 'grell', class: 'skirmisher', team: 'enemy', ai: { profile: 'guard' } });
    for (const u of map().units.filter((x) => x.team === 'enemy')) expect(['scout', 'marksman', 'brigand', 'skirmisher', 'vanguard'], u.id).toContain(u.class);
  });

  it('puts every foe on the position level only through levelOffset: P = 13 after 2-1, start P−3…P−1, rearguard P−2', () => {
    const s = battle();
    expect(s.positionLevel).toBe(13);
    expect(unit(s, 's1').level).toBe(10);
    expect(unit(s, 'k1').level).toBe(12);
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy' && !x.lieutenant)) {
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset).toBeLessThanOrEqual(-1);
    }
  });

  it('drops rock in rounds 3, 5 (warned from round 4) and 8, leaves an occupied tile and keeps the road open from south to north', () => {
    const s = quiet(battle());
    unit(s, 'avatar').pos = [4, 14];
    expect(dialogues(phaseStart(s, 3, 'enemy'))).toEqual(['scn.m2_2.rockfall_south']);
    expect(terrains(s, [[4, 14], [7, 14]])).toEqual(['grass', 'rockwall']);
    expect(terrainWarnings(data, s)).toEqual([]);
    expect(dialogues(phaseStart(s, 4, 'player'))).toEqual(['scn.m2_2.rockfall_warn']);
    expect(terrainWarnings(data, s)).toEqual([{ trigger: 't_rock2', turn: 5, terrain: 'rockwall', tiles: [[12, 6], [12, 7]] }]);
    phaseStart(s, 5, 'enemy');
    expect(terrains(s, [[12, 6], [12, 7]])).toEqual(['rockwall', 'rockwall']);
    expect(dialogues(phaseStart(s, 8, 'enemy'))).toEqual(['scn.m2_2.rockfall_ledge']);
    expect(terrains(s, [[14, 7], [14, 8]])).toEqual(['rockwall', 'rockwall']);
    // after the last rockfall the road still leads from the start area to the seal chest
    const lucan = unit(s, 'lucan');
    lucan.pos = [5, 18];
    expect(reachable(data, s, lucan, [5, 18], 99).has('4,2')).toBe(true);
  });

  it('lets a scout open the seal chest without a key: the seal scene plays, m2_2_seal is set, the mission is won', () => {
    const s = quiet(battle('normal', true));
    const fenn = unit(s, 'fenn');
    fenn.pos = [4, 3];
    expect(openTargets(data, s, fenn, [4, 3]).map((o) => o.id)).toContain('c_seal');
    const r = applyCommand(data, s, { type: 'act', unit: fenn.uid, to: [4, 3], action: { kind: 'open', object: 'c_seal' } });
    expect(r.state.objects.find((o) => o.id === 'c_seal')!.state).toBe('open');
    expect(dialogues(r.events)).toContain('scn.m2_2.seal_found');
    expect(r.state.flags).toContain('m2_2_seal');
    expect(r.state.outcome).toBe('victory');
  });

  it('without a scout the seal chest needs the purser’s key, which he drops', () => {
    expect(map().units.find((u) => u.id === 'purser')).toMatchObject({ items: [{ def: 'iron_sword' }, { def: 'door_key' }], drops: [1] });
    const s = quiet(battle());
    const lucan = unit(s, 'lucan');
    lucan.pos = [4, 2];
    expect(() => applyCommand(data, s, { type: 'act', unit: lucan.uid, to: [4, 2], action: { kind: 'chest' } })).toThrow();
    lucan.bag.push(newItem(s, 'door_key', data));
    const r = applyCommand(data, s, { type: 'act', unit: lucan.uid, to: [4, 2], action: { kind: 'chest' } });
    expect(r.state.flags).toContain('m2_2_seal');
    expect(r.state.outcome).toBe('victory');
  });

  it('is lost when round 11 ends with the seal chest shut', () => {
    const s = quiet(battle());
    s.turn = 11;
    const r = applyCommand(data, s, { type: 'endPhase' });
    expect(r.state.outcome).toBe('defeat');
    expect(r.state.defeatReason).toBe('turns');
  });

  it('has Grell’s rearguard in round 6 from the south edge, announced, 2 on easy/normal and 3 on hard', () => {
    expect(map().reinforcements.map((r) => ({ turn: r.turn, phase: r.phase, rows: [...new Set(r.units.map((u) => u.at[1]))], announce: r.announce }))).toEqual([
      { turn: 6, phase: 'enemy', rows: [19], announce: true },
    ]);
    const n = (d: Difficulty) => map().reinforcements[0]!.units.filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
    expect([n('easy'), n('normal'), n('hard')]).toEqual([2, 2, 3]);
  });

  it('lets scouts and marksmen see 5 tiles in the fog, everyone else 3', () => {
    expect(visionRadius(data, { classId: 'scout' })).toBe(5);
    expect(visionRadius(data, { classId: 'marksman' })).toBe(5);
    expect(visionRadius(data, { classId: 'vanguard' })).toBe(3);
  });

  it('has the chronicle page a2_salzpass and the scouts’ sea chart in the side chests, nobody joins', () => {
    const chest = (id: string) => map().objects.find((o) => o.id === id)!;
    expect(chest('c_page').contents).toEqual({ gold: 300, chronicle: 'a2_salzpass' });
    expect(chest('c_scouts').contents).toEqual({ gold: 200, dialogue: 'scn.m2_2.scouts_chart' });
    expect(chest('c_seal').contents).toBeUndefined();
    expect(data.chronicle.a2_salzpass).toBeDefined();
    expect(map().objectives.side).toEqual([{ id: 's_chests', type: 'open_chests', reward: { item: { def: 'vulnerary' } } }]);
    expect(map().units.some((u) => u.recruit || u.team !== 'enemy')).toBe(false);
  });

  it('pays 2 000 gold, the floor of the act 2 gold curve', () => {
    expect(map().goldReward).toBe(2000);
  });

  it('has two haunt anchors (rout, treasure), none in the start area of the mission', () => {
    const anchors = map().haunts ?? [];
    expect(anchors.map((a) => a.variant)).toEqual(['rout', 'treasure']);
    for (const a of anchors) expect(map().deploy.slots.some((p) => dist(p, a.target.at) < 6), a.variant).toBe(false);
  });
});

describe('scenes of 2-2', () => {
  const lines = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [[l.line, l.speaker] as const] : []));

  it('Fenn speaks in the intro only when he is in the company; the scout line falls back to Tobin, Brenna or Rhen', () => {
    const ids = (c: CampaignState) => lines(c, 'scn.m2_2.intro').map(([id]) => id);
    expect(ids(afterM21())).not.toContain('l07');
    expect(ids(afterM21('normal', true))).toContain('l07');
    const warn = new Map(lines(afterM21(), 'scn.m2_2.rockfall_warn'));
    expect(['tobin', 'avatar']).toContain(warn.get('l02'));
  });

  it('the letter line of the seal scene falls back to Rhen, no one names Halvard', () => {
    const by = new Map(lines(afterM21(), 'scn.m2_2.seal_found'));
    expect(['liora', 'ysolde', 'avatar']).toContain(by.get('l03'));
    for (const id of ['scn.m2_2.seal_found', 'scn.m2_2.outro']) {
      const speakers = new Set(lines(afterM21(), id).map(([, sp]) => sp));
      expect(speakers.has('halvard'), id).toBe(false);
    }
  });

  it('the outro has no decision; Jory speaks only when he joined', () => {
    const c = afterM21();
    const resolved = resolveScene(data, conditionContext(data, c), 'scn.m2_2.outro');
    expect(resolved.some((l) => l.kind === 'choice')).toBe(false);
    expect(lines(c, 'scn.m2_2.outro').map(([id]) => id)).not.toContain('l06');
    const withJory = { ...c, roster: [...c.roster, { ...c.roster[0]!, id: 'jory' }] };
    expect(lines(withJory, 'scn.m2_2.outro').map(([id]) => id)).toContain('l06');
  });
});
