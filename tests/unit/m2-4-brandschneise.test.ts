/** Mission 2-4 "Die Brandschneise" (story 11.15): line-up, the fire front (ignite, F1 = A), the firebreak, Brann as guest, Sable watching, looters, E7, scenes. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  applyEffects,
  beginPhase,
  checkObjectives,
  conditionContext,
  createBattle,
  finishBattle,
  knockOut,
  lieutenantLevel,
  newCampaign,
  resolveScene,
  runAiPhase,
  seedRng,
  shopPrice,
  startBattle,
  terrainAt,
  terrainWarnings,
  tickTerrain,
  type BattleState,
  type BattleUnit,
  type CampaignEvent,
  type CampaignState,
  type Difficulty,
  type GameData,
  type GameEvent,
  type Pos,
  type Team,
} from '../../src/core';
import { siteImage } from '../../src/app/screens/worldMapView';

let data: GameData;

/** A campaign in act 2 after 2-1, 2-2 and 2-3, the company at home in the castle. */
function inAct2(difficulty: Difficulty = 'normal'): CampaignState {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  return { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: [...story, 'm2_1', 'm2_2', 'm2_3'] };
}

const battle = (d: Difficulty = 'normal'): BattleState => startBattle(data, createBattle(data, inAct2(d), 'm2_4', ['avatar', 'lucan'])).state;
const map = () => data.maps.m2_4_brandschneise!;
const unit = (s: BattleState, id: string): BattleUnit => s.units.find((u) => u.id === id)!;
const dialogues = (ev: GameEvent[]) => ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));
function phaseStart(s: BattleState, turn: number, phase: Team): GameEvent[] {
  const events: GameEvent[] = [];
  s.turn = turn;
  beginPhase(data, s, phase, events);
  return events;
}
/** Plays the rounds up to `turn` the way the battle does: round start (fire spreads and burns down), then the player phase begins. */
function roundsTo(s: BattleState, turn: number): void {
  while (s.turn < turn) {
    s.turn += 1;
    tickTerrain(data, s, []);
    beginPhase(data, s, 'player', []);
  }
}
const row = (y: number, x0: number, x1: number): Pos[] => Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y] as Pos);
const BREAK_WEST = [...row(17, 3, 5), ...row(17, 7, 13)];
const BREAK_EAST = [...row(17, 16, 22), ...row(17, 24, 26)];

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map m2_4_brandschneise', () => {
  it('is the map of node m2_4 in act 2: defend Brann 12 rounds, Avatar, Lucan or Brann falling loses, 12 places, evening and ash', () => {
    const node = data.acts[2]!.nodes.find((n) => n.id === 'm2_4')!;
    expect(node).toMatchObject({ map: 'm2_4_brandschneise', place: 'brandschneise', pre: 'scn.m2_4.intro', post: 'scn.m2_4.outro', requires: [{ completed: 'm2_2' }, { completed: 'm2_3' }] });
    expect(map()).toMatchObject({ act: 2, size: [30, 40], timeOfDay: 'evening', weather: 'ash' });
    expect(map().objectives.victory).toEqual({ type: 'defend', unit: 'brann', turns: 12 });
    expect(map().objectives.defeat).toEqual([
      { type: 'unit_dies', unit: 'avatar' },
      { type: 'unit_dies', unit: 'lucan' },
      { type: 'unit_dies', unit: 'brann' },
    ]);
    expect(map().deploy.max).toBe(12);
  });

  it('has 29 / 33 / 44 foes with the waves, no riders or fliers (story 11.27: fewer archers on easy and normal)', () => {
    for (const [d, n] of [['easy', 29], ['normal', 33], ['hard', 44]] as const) {
      const s = battle(d);
      const start = s.units.filter((u) => u.team === 'enemy').length;
      const waves = map().reinforcements.flatMap((r) => r.units).filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
      expect(start + waves, d).toBe(n);
    }
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy'))
      expect(['vanguard', 'brigand', 'skirmisher', 'marksman'], u.id).toContain(u.class);
  });

  it('puts every foe on P = 15 only through levelOffset (P−3…P−1), Grell on the lieutenant level as skirmisher with a steel sword', () => {
    const s = battle();
    expect(s.positionLevel).toBe(15);
    expect(unit(s, 'n1').level).toBe(12);
    expect(unit(s, 'h0')).toBeUndefined();
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy' && !x.lieutenant)) {
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset).toBeLessThanOrEqual(-1);
      expect(u.nameKey).toBe('unit.looter.name');
    }
    const grell = map().reinforcements.find((r) => r.turn === 6)!.units.find((u) => u.id === 'grell')!;
    expect(grell).toMatchObject({ lieutenant: 'grell', class: 'skirmisher', items: [{ def: 'steel_sword' }] });
    const st = battle();
    st.turn = 6;
    beginPhase(data, st, 'enemy', []);
    expect(unit(st, 'grell').level).toBe(lieutenantLevel(data, inAct2(), 0));
  });

  it('has three levels: the upper terrace on 2, the village on 1, the lower fields on 0, joined by ramps and stairs', () => {
    const s = battle();
    const lv = (p: Pos) => s.levels?.[`${p[0]},${p[1]}`] ?? data.terrain[terrainAt(s, p)]!.level ?? 0;
    expect([lv([5, 10]), lv([15, 22]), lv([15, 33])]).toEqual([2, 1, 0]);
    expect([[6, 17], [14, 17], [15, 17], [23, 17]].map((p) => terrainAt(s, p as Pos))).toEqual(['ramp', 'ramp', 'ramp', 'ramp']);
    expect([[10, 27], [19, 27]].map((p) => terrainAt(s, p as Pos))).toEqual(['stairs', 'stairs']);
  });

  it('opens the firebreak at the start of rounds 3 (west) and 6 (east) as ash; the ramps stay, a burning tile goes out', () => {
    const s = battle();
    for (const p of [...BREAK_WEST, ...BREAK_EAST]) expect(terrainAt(s, p)).toBe('grass');
    const events: GameEvent[] = [];
    // a burning tile of the break (from a spark) is put out by it
    s.terrain[17 * 30 + 8] = 'burning';
    s.timers['8,17'] = { kind: 'burning', turns: 2, revertTo: 'grass' };
    s.turn = 3;
    beginPhase(data, s, 'player', events);
    expect(dialogues(events)).toEqual(['scn.m2_4.brann_break_west']);
    for (const p of BREAK_WEST) expect(terrainAt(s, p), String(p)).toBe('ash');
    expect(s.timers['8,17']).toBeUndefined();
    for (const p of BREAK_EAST) expect(terrainAt(s, p)).toBe('grass');
    expect(dialogues(phaseStart(s, 6, 'player'))).toEqual(['scn.m2_4.brann_break_east']);
    for (const p of BREAK_EAST) expect(terrainAt(s, p), String(p)).toBe('ash');
    expect([[6, 17], [14, 17], [15, 17], [23, 17]].map((p) => terrainAt(s, p as Pos))).toEqual(['ramp', 'ramp', 'ramp', 'ramp']);
  });

  it('plays Brann’s scenes only while he stands on the board; the ground breaks anyway', () => {
    const s = battle();
    unit(s, 'brann').pos = null;
    unit(s, 'brann').gone = 'dead';
    expect(dialogues(phaseStart(s, 3, 'player'))).toEqual([]);
    expect(terrainAt(s, [8, 17])).toBe('ash');
  });

  it('burns from round 1 in the north, the front eats south (west at the edge in round 4, east in round 7), announced a round before (F1 = A)', () => {
    const s = battle();
    expect(terrainAt(s, [4, 3])).toBe('burning');
    // round 1: the lines for round 2 already show, one per half of the front, with burning as the terrain
    expect(terrainWarnings(data, s).map((w) => [w.trigger, w.turn, w.terrain])).toEqual([
      ['t_fire_w2', 2, 'burning'],
      ['t_fire_e2', 2, 'burning'],
    ]);
    roundsTo(s, 4);
    expect(row(16, 4, 13).every((p) => terrainAt(s, p) === 'burning')).toBe(true);
    expect(row(16, 16, 25).some((p) => terrainAt(s, p) === 'burning')).toBe(false);
    // the clearing of Sable is plain and never catches fire; the road does not burn either
    for (const p of [[19, 6], [21, 7], [23, 8], [14, 6], [15, 12]] as Pos[]) expect(terrainAt(s, p), String(p)).not.toBe('burning');
    roundsTo(s, 7);
    expect(row(16, 16, 25).every((p) => terrainAt(s, p) === 'burning')).toBe(true);
  });

  it('never lets the fire past the firebreak, whatever the seed (spread is seeded, the same seed burns the same tiles)', () => {
    const burntSouth = (seed: number): string[] => {
      const s = battle();
      s.rng = seedRng(seed);
      roundsTo(s, 14);
      const out: string[] = [];
      for (let y = 17; y < 40; y++) for (let x = 0; x < 30; x++) if (['burning', 'ash'].includes(terrainAt(s, [x, y])) && !(y === 17)) out.push(`${x},${y}`);
      return out;
    };
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) expect(burntSouth(seed), `seed ${seed}`).toEqual([]);
    const a = battle();
    const b = battle();
    roundsTo(a, 10);
    roundsTo(b, 10);
    expect(a.terrain).toEqual(b.terrain);
  });

  it('has Brann as a guest on the shrine, not to be steered; he falling loses, and he does not join after the mission', () => {
    const s = battle();
    const brann = unit(s, 'brann');
    expect(brann).toMatchObject({ team: 'other', guest: true, pos: [15, 22] });
    expect(terrainAt(s, [15, 22])).toBe('shrine');
    expect(brann.ai?.profile).toBe('hold');
    expect(() => applyCommand(data, s, { type: 'move', unit: brann.uid, to: [15, 21], path: [[15, 22], [15, 21]] })).toThrow();
    const lost = battle();
    const events: GameEvent[] = [];
    knockOut(data, lost, unit(lost, 'brann'), events, unit(lost, 'avatar').uid);
    unit(lost, 'brann').gone = 'dead';
    checkObjectives(data, lost, events);
    expect(lost.outcome).toBe('defeat');
    const won = battle();
    won.outcome = 'victory';
    const { campaign } = finishBattle(data, inAct2(), won);
    expect(campaign.roster.map((r) => r.id)).not.toContain('brann');
    expect(campaign.roster.map((r) => r.id)).not.toContain('sable');
  });

  it('has Sable on the plain clearing, untargetable and unarmed, who never strikes, and leaves in round 7 after her scene (F4 = D)', () => {
    const s = battle();
    const sable = unit(s, 'sable');
    expect(sable).toMatchObject({ team: 'other', untargetable: true, pos: [21, 7] });
    expect(map().units.find((u) => u.id === 'sable')!.char).toBeUndefined();
    expect([...Object.values(sable.equip), ...sable.bag].filter(Boolean)).toEqual([]);
    for (const p of [[19, 6], [23, 8]] as Pos[]) expect(terrainAt(s, p)).toBe('plain');
    // a looter right next to her: her phase passes without a blow
    const n3 = unit(s, 'n3');
    n3.pos = [21, 8];
    const hp = n3.hp;
    const events: GameEvent[] = [];
    beginPhase(data, s, 'other', events);
    runAiPhase(data, s, 'other', events);
    expect(n3.hp).toBe(hp);
    expect(events.some((e) => e.t === 'combat')).toBe(false);
    // round 7: her scene, then she is gone in her own phase
    expect(dialogues(phaseStart(s, 7, 'player'))).toEqual(['scn.m2_4.sable_watches']);
    beginPhase(data, s, 'other', []);
    runAiPhase(data, s, 'other', []);
    expect(unit(s, 'sable').gone).toBe('escaped');
  });

  it('sends the flank looters (raider) at the four houses, and a looter burns a house he reaches down', () => {
    const raiders = map().units.filter((u) => u.ai?.profile === 'raider').map((u) => u.id);
    expect(raiders).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7']);
    expect(map().objects.filter((o) => o.type === 'village').map((o) => o.id)).toEqual(['v_nw', 'v_ne', 'v_sw', 'v_se']);
    const s = battle();
    for (const u of s.units) if (u.team !== 'enemy' && u.id !== 'brann') u.pos = null;
    const r0 = unit(s, 'r0');
    r0.pos = [7, 20];
    for (const u of s.units) if (u.team === 'enemy' && u !== r0) u.pos = null;
    // he steps onto the house in one enemy phase and burns it down in the next
    for (let i = 0; i < 2; i++) {
      beginPhase(data, s, 'enemy', []);
      runAiPhase(data, s, 'enemy', []);
    }
    expect(s.objects.find((o) => o.id === 'v_nw')!.state).toBe('razed');
    expect(terrainAt(s, [8, 20])).toBe('ruins');
  });

  it('sends the waves R3 north, R5 west, R6 Grell north, R8 south, R9 north, R10 east, all announced', () => {
    expect(map().reinforcements.map((r) => [r.turn, r.announce])).toEqual([[3, true], [5, true], [6, true], [8, true], [9, true], [10, true]]);
    const s = battle();
    expect(dialogues(phaseStart(s, 6, 'enemy'))).toEqual(['scn.m2_4.grell_battle']);
  });

  it('keeps the chronicle page a2_brandhang in the charcoal chest, a key with a0, 2 500 gold and two haunt anchors away from the start (F5 = B, F6 = A)', () => {
    expect(map().objects.find((o) => o.id === 'c_page')).toMatchObject({ type: 'chest', at: [10, 4], contents: { gold: 300, chronicle: 'a2_brandhang', dialogue: 'scn.m2_4.page' } });
    expect(data.chronicle.a2_brandhang).toMatchObject({ act: 2 });
    expect(map().units.find((u) => u.id === 'a0')).toMatchObject({ items: [{ def: 'iron_bow' }, { def: 'door_key' }], drops: [1] });
    expect(map().goldReward).toBe(2500);
    expect(map().objectives.side.map((o) => o.type)).toEqual(['visit_villages', 'open_chests']);
    const anchors = map().haunts ?? [];
    expect(anchors.map((a) => a.variant)).toEqual(['rout', 'treasure']);
    for (const a of anchors) {
      const [x0, y0, x1, y1] = 'rect' in a.deploy! ? a.deploy.rect : [0, 0, 0, 0];
      // not on the village square, the start of the mission
      expect(x1 < 11 || x0 > 18 || y1 < 20 || y0 > 24).toBe(true);
      expect([x0, y0, x1, y1].length).toBe(4);
    }
  });
});

describe('scenes of 2-4 and decision E7', () => {
  const lines = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [l] : []));
  const choices = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'choice' ? [l] : []));
  const withFlag = (c: CampaignState, v: 'warn' | 'obey'): CampaignState => ({ ...c, flags: { ...c.flags, e07: v } });
  const option = (id: string) => {
    const c = choices(inAct2(), 'scn.m2_4.outro')[0]!;
    return c.options.find((o) => o.id === id)!;
  };

  it('E7 has two answers with stance and consequence card: warn (warm) and obey (sober)', () => {
    const [e7, letter] = choices(inAct2(), 'scn.m2_4.outro');
    expect(e7!.decision).toBe(true);
    expect(e7!.options.map((o) => [o.id, o.stance])).toEqual([['warn', 'warm'], ['obey', 'sober']]);
    const def = data.scenes['scn.m2_4.outro']!.lines.find((l) => l.id === 'c01');
    for (const o of def && 'choice' in def ? def.choice : []) expect(o.summary, o.id).toBeTruthy();
    expect(def && 'title' in def ? def.title : '').toContain('Brandhang');
    // F3 = A: Maelis’s letter, Rhen answers with a stance only (no flag)
    expect(letter!.options.map((o) => o.id)).toEqual(['warm', 'sober', 'defiant']);
    for (const o of letter!.options) expect(o.effects ?? []).toEqual([]);
  });

  it('warn: Sable joins with her grudge gone, joined_sable set', () => {
    const c = inAct2();
    const events: CampaignEvent[] = [];
    applyEffects(data, c, option('warn').effects ?? [], events);
    expect(c.flags.e07).toBe('warn');
    expect(c.flags.joined_sable).toBe(true);
    expect(c.roster.map((r) => r.id)).toContain('sable');
    expect(c.lieutenants?.sable?.grudge).toBe(0);
    expect(c.priceMods).toEqual([]);
  });

  it('obey: −10 % in act 2, Brandhang burns on the world map, Sable stays a lieutenant and only met', () => {
    const c = inAct2();
    const before = shopPrice(data, c, 1000);
    applyEffects(data, c, option('obey').effects ?? [], []);
    expect(c.flags.e07).toBe('obey');
    expect(c.roster.map((r) => r.id)).not.toContain('sable');
    expect(c.flags.joined_sable).toBeUndefined();
    expect(c.lieutenants?.sable).toBeDefined();
    expect(shopPrice(data, c, 1000)).toBe(Math.round(before * 0.9));
    const place = data.world.places.find((p) => p.id === 'burnt_slope')!;
    expect(siteImage(place, conditionContext(data, c))).toBe('burnt_slope_burnt');
    expect(siteImage(place, conditionContext(data, withFlag(inAct2(), 'warn')))).toBe('none');
  });

  it('the outro shows only the branch that was chosen; Brann flees to Copperhall, the border army hunts the company in both', () => {
    for (const v of ['warn', 'obey'] as const) {
      const ids = lines(withFlag(inAct2(), v), 'scn.m2_4.outro').map((l) => l.line);
      expect(ids.some((i) => i.startsWith('w0'))).toBe(v === 'warn');
      expect(ids.some((i) => i.startsWith('b0'))).toBe(v === 'obey');
      expect(ids).toEqual(expect.arrayContaining(['l04', 'h01', 'h02', 'h04']));
    }
    const text = (id: string) => {
      const l = data.scenes['scn.m2_4.outro']!.lines.find((x) => x.id === id);
      return l && 'text' in l ? l.text : '';
    };
    expect(text('l03')).toContain('Hexenkind');
    expect(text('l04')).toContain('Kupferhall');
    expect(text('l12')).toContain('Drachen hält nur Feuer auf');
    expect(data.scenes['scn.m2_4.outro']).toMatchObject({ background: 'brandschneise' });
    expect(data.scenes['scn.m2_4.intro']).toMatchObject({ background: 'brandschneise' });
  });

  it('companion lines fall back to Lucan or Rhen when the companion is not there', () => {
    const c = inAct2();
    const by = new Map(lines(c, 'scn.m2_4.sable_watches').map((l) => [l.line, l.speaker] as const));
    expect(['varek', 'lucan']).toContain(by.get('l03'));
    const outro = new Map(lines(c, 'scn.m2_4.outro').map((l) => [l.line, l.speaker] as const));
    expect(outro.get('l13')).toBeDefined();
    // Grell’s scene names the duchess: the first trace from Dravn to Maelis
    const g = data.scenes['scn.m2_4.grell_battle']!.lines.find((x) => x.id === 'l04');
    expect(g && 'text' in g ? g.text : '').toContain('Herzogin');
  });
});
