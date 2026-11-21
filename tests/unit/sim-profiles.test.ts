import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { autoplay, beginBattle, firstNode, newCampaign, type BattleState, type GameData } from '../../src/core';
import { homeHeuristic, homeProfile, simProfile } from '../../tools/simCampaign';

let data: GameData;
let start: BattleState;

const AVATAR = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;
const campaign = () => newCampaign(data, 5, { difficulty: 'normal', deathMode: 'standard' }, { ...AVATAR });
const spent = () => ({ heal: 0, buy: 0, upgrade: 0, rooms: 0, hire: 0, craft: 0, sparks: 0 });

beforeAll(() => {
  data = loadContentFromDisk().data;
  const c = campaign();
  start = beginBattle(data, c, firstNode(data).id, c.roster.map((u) => u.id)).state;
});

describe('simulated player profiles (pnpm sim --profile)', () => {
  it('lists the approved profiles and rejects an unknown one', () => {
    expect(Object.keys(data.balance.simulation.profiles)).toEqual(['standard', 'cautious', 'aggressive', 'novice', 'optimizer', 'collector']);
    expect(simProfile(data, undefined)).toBeUndefined();
    expect(() => simProfile(data, 'reckless')).toThrow(/unknown profile reckless/);
  });

  it('standard plays exactly as without a profile, in battle and at home', () => {
    const standard = simProfile(data, 'standard')!;
    expect(autoplay(data, start, 2000, standard.battle).log).toEqual(autoplay(data, start).log);
    expect(homeHeuristic(data, campaign(), spent(), undefined, homeProfile(standard, 5))).toEqual(homeHeuristic(data, campaign(), spent()));
  });

  it('the novice is deterministic per seed, makes mistakes and leaves the battle RNG to the combat', () => {
    const novice = simProfile(data, 'novice')!.battle;
    const rng0 = [...start.rng];
    const a = autoplay(data, start, 2000, novice);
    expect(autoplay(data, start, 2000, novice).log).toEqual(a.log);
    expect(a.log).not.toEqual(autoplay(data, start).log);
    // the mistakes come from a stream of their own: the start state's RNG is only read
    expect(start.rng).toEqual(rng0);
  });
});
