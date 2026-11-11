/** Side quest N4 "Der Clan im Schnee" (story 11.20): the node and its memorial variant, foes and waves, the elder, Ilka, the crag's sight, the scenes. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  addToRoster,
  createBattle,
  deployInfo,
  nodeScenes,
  posKey,
  visibleTiles,
  type BattleState,
  type CampaignState,
  type Difficulty,
  type GameData,
  type Pos,
} from '../../src/core';
import { newCampaign } from '../../src/core';

let data: GameData;

/** A campaign in act 2 after 2-3, with Ilka in the company (how = in) or fallen (how = dead). */
function afterM23(how: 'in' | 'dead', difficulty: Difficulty = 'normal'): CampaignState {
  const c = newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const story = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
  const s: CampaignState = { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: [...story, 'm2_1', 'm2_2', 'm2_3'] };
  if (how === 'in') addToRoster(data, s, 'ilka');
  else s.fallen = [...s.fallen, { id: 'ilka', nameKey: 'unit.ilka.name', node: 'm2_3' }];
  return s;
}

const map = () => data.maps.n4_clanlager!;
const node = () => data.acts[2]!.nodes.find((n) => n.id === 'n4')!;
const battle = (d: Difficulty = 'normal'): BattleState => createBattle(data, afterM23('in', d), 'n4', ['avatar', 'lucan', 'ilka']);

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('node n4', () => {
  it('plays the clan camp after 2-3, with the memorial variant when Ilka has fallen', () => {
    expect(node()).toMatchObject({ kind: 'side', map: 'n4_clanlager', place: 'clanlager', pre: 'scn.n4.intro', post: 'scn.n4.outro', memorialIf: { dead: 'ilka' } });
    expect(nodeScenes(data, afterM23('in'), 'n4')).toEqual({ pre: 'scn.n4.intro', post: 'scn.n4.outro' });
    expect(nodeScenes(data, afterM23('dead'), 'n4')).toEqual({ pre: 'scn.n4.memorial_intro', post: 'scn.n4.memorial_outro' });
  });

  it('rewards an ember spark and the bow Weißwolf, in both variants (the node effects do not depend on the variant)', () => {
    expect(node().effects).toEqual([{ item: { def: 'ember_spark' } }, { item: { def: 'white_wolf' } }]);
    expect(node().effectsIf ?? []).toEqual([]);
    expect(data.items.white_wolf).toMatchObject({ weaponType: 'bow', rarity: 'legendary', grantsSkill: { skill: 'white_wolf_sight' } });
    expect(data.skills.white_wolf_sight!.effect.visionBonus).toBeGreaterThan(0);
  });

  it('forces Ilka while she lives and drops her from the forced line-up once she has fallen', () => {
    expect(map().deploy).toMatchObject({ max: 8, forced: ['avatar', 'lucan', 'ilka'] });
    expect(deployInfo(data, afterM23('in'), 'n4').forced).toEqual(['avatar', 'lucan', 'ilka']);
    expect(deployInfo(data, afterM23('dead'), 'n4').forced).toEqual(['avatar', 'lucan']);
  });
});

describe('map n4_clanlager', () => {
  it('is survive 9 rounds under fog in early snow; only Avatar or Lucan falling loses', () => {
    expect(map()).toMatchObject({ act: 2, fog: true, weather: 'snow', season: 'winter', size: [20, 24] });
    expect(map().objectives.victory).toEqual({ type: 'survive', turns: 9 });
    expect(map().objectives.defeat).toEqual([
      { type: 'unit_dies', unit: 'avatar' },
      { type: 'unit_dies', unit: 'lucan' },
    ]);
  });

  it('has 17 / 18 / 23 foes with the waves, no lieutenant, all on the position level', () => {
    for (const [d, n] of [['easy', 17], ['normal', 18], ['hard', 23]] as const) {
      const s = battle(d);
      const start = s.units.filter((u) => u.team === 'enemy').length;
      const waves = map().reinforcements.flatMap((r) => r.units).filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
      expect(start + waves, d).toBe(n);
    }
    for (const u of [...map().units, ...map().reinforcements.flatMap((r) => r.units)].filter((x) => x.team === 'enemy')) {
      expect(u.lieutenant, u.id).toBeUndefined();
      expect(u.level, u.id).toBeUndefined();
      expect(u.levelOffset).toBeGreaterThanOrEqual(-3);
      expect(u.levelOffset).toBeLessThanOrEqual(-1);
    }
  });

  it('brings the outposts from all four sides of the forest and the waves in rounds 3 north, 5 south, 7 west', () => {
    const foes = map().units.filter((u) => u.team === 'enemy');
    expect(foes.some((u) => u.at[1] <= 6)).toBe(true);
    expect(foes.some((u) => u.at[1] >= 18)).toBe(true);
    expect(foes.some((u) => u.at[0] <= 3)).toBe(true);
    expect(foes.some((u) => u.at[0] >= 16)).toBe(true);
    const waves = map().reinforcements.map((r) => ({ turn: r.turn, announce: r.announce, at: r.units[0]!.at }));
    expect(waves).toEqual([
      { turn: 3, announce: true, at: [9, 0] },
      { turn: 5, announce: true, at: [9, 23] },
      { turn: 7, announce: true, at: [1, 12] },
    ]);
  });

  it('keeps the clan elder as a third party: her fall fails only the side objective', () => {
    const elder = map().units.find((u) => u.id === 'elder')!;
    expect(elder).toMatchObject({ team: 'other', class: 'civilian', ignoreForRout: true });
    expect(map().objectives.side.find((o) => o.id === 's_elder')).toMatchObject({ type: 'protect_npc', unit: 'elder' });
    expect(map().objectives.defeat.some((o) => 'unit' in o && o.unit === 'elder')).toBe(false);
  });

  it('lets the crag see over the fog: a marksman up there sees the northern outposts the camp does not', () => {
    const s = battle();
    const at = (id: string, p: Pos) => (s.units.find((u) => u.id === id)!.pos = p);
    const north: Pos = [9, 3];
    for (const u of s.units) if (u.team === 'player') u.pos = null;
    at('ilka', [10, 11]);
    expect(visibleTiles(data, s, 'player').has(posKey(north))).toBe(false);
    at('ilka', [4, 5]);
    expect(visibleTiles(data, s, 'player').has(posKey(north))).toBe(true);
    expect(visibleTiles(data, s, 'player').has(posKey([2, 12]))).toBe(true);
  });
});
