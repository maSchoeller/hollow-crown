/** Side quest N5 "Glut unter dem Berg" (story 11.21): treasure hunt, door or gate into the bone hall, Brann joins only when talked over. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  addToRoster,
  applyCommand,
  availableActions,
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
  type ItemInstance,
  type Pos,
} from '../../src/core';

let data: GameData;
const MAP = 'n5_kupfermine';

/** A campaign in act 2 after 2-4 (2-1 to 2-4 done), the company at home in the castle; `extra` companions join the roster. */
function afterM24(difficulty: Difficulty = 'normal', ...extra: string[]): CampaignState {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  const out: CampaignState = { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: [...story, 'm2_1', 'm2_2', 'm2_3', 'm2_4'] };
  for (const id of extra) addToRoster(data, out, id);
  return out;
}

const battle = (d: Difficulty = 'normal', ...extra: string[]): BattleState => createBattle(data, afterM24(d, ...extra), 'n5', ['avatar', 'lucan', ...extra]);
const map = () => data.maps[MAP]!;
const tile = (s: BattleState, [x, y]: Pos) => s.terrain[y * s.width + x];
const place = (s: BattleState, id: string, at: Pos) => {
  const u = s.units.find((x) => x.id === id)!;
  u.pos = at;
  u.acted = false;
  u.moved = false;
  return u;
};
const key = (uid: string): ItemInstance => ({ uid, def: 'door_key', upgrade: 0, affixes: [], runes: [], charges: 1 });

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map n5_kupfermine', () => {
  it('is the map of side node n5 after 2-4: four chests in 12 rounds, a glow spark as the reward, Avatar or Lucan falling loses', () => {
    const node = data.acts[2]!.nodes.find((n) => n.id === 'n5')!;
    expect(node).toMatchObject({ kind: 'side', map: MAP, place: 'kupfermine', pre: 'scn.n5.intro', post: 'scn.n5.outro', requires: [{ completed: 'm2_4' }] });
    expect(node.effects).toEqual([{ item: { def: 'ember_spark' } }]);
    expect(map()).toMatchObject({ act: 2, size: [16, 20], fog: true, interior: true, timeOfDay: 'indoor' });
    expect(map().objectives.victory).toEqual({ type: 'treasure', chests: ['c_ember', 'c_rune', 'c_page', 'c_moon'], turns: 12 });
    expect(map().objectives.defeat).toEqual([
      { type: 'unit_dies', unit: 'avatar' },
      { type: 'unit_dies', unit: 'lucan' },
    ]);
    expect(map().deploy).toMatchObject({ max: 7, forced: ['avatar', 'lucan'] });
  });

  it('has 12 / 15 / 18 foes with the wave from the entrance in round 4, all on P−3 to P−1', () => {
    const count = (d: Difficulty) => battle(d).units.filter((u) => u.team === 'enemy').length + map().reinforcements.flatMap((r) => r.units).length;
    expect([count('easy'), count('normal'), count('hard')]).toEqual([12, 15, 18]);
    expect(map().reinforcements.map((r) => [r.turn, r.phase, r.announce])).toEqual([[4, 'enemy', true]]);
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy')) {
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset, u.id).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset, u.id).toBeLessThanOrEqual(-1);
    }
    // P after 2-1 to 2-4: base 12 + 4 story nodes
    const s = battle();
    expect(s.units.find((u) => u.id === 'foreman')!.level).toBe(15);
    expect(s.units.find((u) => u.id === 'a1')!.level).toBe(13);
  });

  it('holds the four chests: Dragon Ember (with its scene), Earth Rune III, a chronicle page of act 2, moonsteel', () => {
    const contents = Object.fromEntries(map().objects.filter((o) => o.type === 'chest').map((o) => [o.id, o.contents]));
    expect(contents).toEqual({
      c_ember: { item: { def: 'dragon_ember' }, dialogue: 'scn.n5.relic' },
      c_rune: { item: { def: 'earth_rune_3' } },
      c_page: { chronicle: 'a2_mine' },
      c_moon: { material: { moonsteel: 3 } },
    });
    expect(data.chronicle.a2_mine).toMatchObject({ act: 2 });
    expect(data.runes.earth_rune_3?.tier).toBe(3);
  });

  it('the foreman drops the key to the middle door, and more looters carry keys so the hunt never hangs on a scout', () => {
    const keys = map().units.filter((u) => u.team === 'enemy' && (u.drops ?? []).some((i) => u.items[i]?.def === 'door_key'));
    expect(keys.map((u) => u.id)).toEqual(['a2', 'foreman', 'c1', 'd1', 'd2']);
  });

  it('a key opens both wings of the middle door; Fenn opens it without one', () => {
    const s = battle('normal', 'fenn');
    const lucan = place(s, 'lucan', [7, 9]);
    expect(availableActions(data, s, lucan, [7, 9]).some((a) => a.kind === 'door')).toBe(false);
    lucan.bag.push(key('k_test'));
    const opened = applyCommand(data, s, { type: 'act', unit: lucan.uid, to: [7, 9], action: { kind: 'door', object: 'd_mid_w' } }).state;
    expect([tile(opened, [7, 8]), tile(opened, [8, 8])]).toEqual(['door_open', 'door_open']);

    const s2 = battle('normal', 'fenn');
    const fenn = place(s2, 'fenn', [8, 9]);
    const r = applyCommand(data, s2, { type: 'act', unit: fenn.uid, to: [8, 9], action: { kind: 'open', object: 'd_mid_e' } }).state;
    expect([tile(r, [7, 8]), tile(r, [8, 8])]).toEqual(['door_open', 'door_open']);
  });

  it('the lever in the east tunnel lifts the gate to the bone hall, and no key opens the gate', () => {
    const s = battle();
    expect(tile(s, [12, 9])).toBe('gate_closed');
    expect(map().objects.some((o) => o.at[0] === 12 && o.at[1] === 9)).toBe(false);
    const u = place(s, 'lucan', [14, 13]);
    const r = applyCommand(data, s, { type: 'act', unit: u.uid, to: [14, 13], action: { kind: 'lever', object: 'l_gate' } }).state;
    expect(tile(r, [12, 9])).toBe('gate');
  });

  it('plays the dragon bones once, when a company member enters the bone hall', () => {
    const s = battle();
    const unit = s.units.find((u) => u.id === 'avatar')!;
    const fire = (at: Pos): string[] => {
      unit.pos = at;
      const ev: GameEvent[] = [];
      runTriggers(data, s, { kind: 'moved', unit }, ev);
      return ev.flatMap((e) => (e.t === 'dialogue' ? [e.id] : []));
    };
    expect(fire([7, 9])).toEqual([]);
    expect(fire([7, 4])).toEqual(['scn.n5.bones']);
    expect(fire([12, 2])).toEqual([]);
  });

  it('has Brann as a guest in the west tunnel on P − 1 with his own spells', () => {
    const s = battle();
    const brann = s.units.find((u) => u.id === 'brann')!;
    expect(brann).toMatchObject({ team: 'other', guest: true, level: 15, recruit: { by: ['ilka', 'lucan'], dialogue: 'scn.n5.brann_talk' } });
    expect([...Object.values(brann.equip).map((i) => i?.def), ...brann.bag.map((i) => i.def)]).toEqual(expect.arrayContaining(['stone_fist', 'rockfall']));
    expect(map().objectives.side).toContainEqual({ id: 's_brann', type: 'recruit', unit: 'brann', reward: { gold: 300 } });
    expect(data.chars.brann!.joins).toBe('n5');
  });

  it('only Ilka or Lucan talk Brann over; the avatar cannot', () => {
    const s = battle('normal', 'ilka');
    const brann = s.units.find((u) => u.id === 'brann')!;
    const avatar = place(s, 'avatar', [2, 13]);
    expect(availableActions(data, s, avatar, [2, 13]).some((a) => a.kind === 'talk')).toBe(false);
    avatar.pos = [9, 17];
    const ilka = place(s, 'ilka', [2, 13]);
    const r = applyCommand(data, s, { type: 'act', unit: ilka.uid, to: [2, 13], action: { kind: 'talk', target: brann.uid } });
    expect(r.state.units.find((u) => u.id === 'brann')!.team).toBe('player');
    expect(r.events).toContainEqual({ t: 'dialogue', id: 'scn.n5.brann_talk' });

    // without Ilka Lucan does it
    const s2 = battle();
    const lucan = place(s2, 'lucan', [1, 12]);
    const talk = availableActions(data, s2, lucan, [1, 12]).find((a) => a.kind === 'talk');
    expect(talk?.targets).toEqual([s2.units.find((u) => u.id === 'brann')!.uid]);
  });

  it('has no haunt anchors: haunts play on story maps only, like N1–N3', () => {
    expect(map().haunts).toBeUndefined();
  });
});

describe('scenes of N5', () => {
  const ids = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' ? [l.line] : []));
  const speakers = (c: CampaignState, scene: string) => resolveScene(data, conditionContext(data, c), scene).flatMap((l) => (l.kind === 'line' && l.speaker ? [[l.line, l.speaker]] : []));

  it('the outro tells either that Brann came along or that his trail fades; Ilka speaks only with both of them', () => {
    const without = afterM24();
    expect(ids(without, 'scn.n5.outro')).toEqual(['l01', 'l04', 'l05', 'l06', 'l07']);
    const withBrann = afterM24('normal', 'brann');
    expect(ids(withBrann, 'scn.n5.outro')).toEqual(['l01', 'l02', 'l06', 'l07']);
    expect(ids(afterM24('normal', 'brann', 'ilka'), 'scn.n5.outro')).toEqual(['l01', 'l02', 'l03', 'l06', 'l07']);
  });

  it('the talk speaks through Ilka when she is in the company, else through Lucan with the same words', () => {
    const withIlka = Object.fromEntries(speakers(afterM24('normal', 'ilka'), 'scn.n5.brann_talk'));
    expect([withIlka.l03, withIlka.l05, withIlka.l03b]).toEqual(['ilka', 'ilka', undefined]);
    const without = Object.fromEntries(speakers(afterM24(), 'scn.n5.brann_talk'));
    expect([without.l03, without.l03b, without.l05b]).toEqual([undefined, 'lucan', 'lucan']);
    const text = (id: string) => data.scenes['scn.n5.brann_talk']!.lines.flatMap((l) => (l.id === id && 'text' in l ? [l.text] : []))[0];
    expect(text('l03b')).toBe(text('l03'));
    expect(text('l05b')).toBe(text('l05'));
  });
});
