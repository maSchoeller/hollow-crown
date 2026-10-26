import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { firstNode, newCampaign, type GameData } from '../../src/core';
import { armyLevel, homeHeuristic, missionFlags, simulateCampaign, type MissionSim } from '../../tools/simCampaign';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

const mission = (over: Partial<MissionSim> = {}): MissionSim => ({
  node: 'm1_2',
  map: 'm1_2_erlbach',
  expectedLevel: 2,
  reached: 10,
  wins: 9,
  downs: 8,
  gold: 12000,
  sideGold: 2000,
  cleared: 10,
  armyLevel: 20,
  deaths: 0,
  ...over,
});

describe('chained act simulation (story 6.8)', () => {
  it('plays the story missions in campaign order and is deterministic per seed', { timeout: 60000 }, () => {
    const o = { runs: 1, seed: 3, difficulty: 'normal' as const, deathMode: 'standard' as const };
    const a = simulateCampaign(data, o);
    expect(a.missions.map((m) => m.node)).toEqual(data.campaign.nodes.slice(0, a.missions.length).map((n) => n.id));
    expect(a.missions[0]!.node).toBe(firstNode(data).id);
    expect(simulateCampaign(data, o)).toEqual(a);
  });

  it('army level is the average of the strongest armySize units', () => {
    const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'R', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    c.roster.forEach((u, i) => (u.level = i + 1));
    const n = Math.min(c.roster.length, data.balance.simulation.armySize);
    const levels = c.roster.map((u) => u.level).sort((a, b) => b - a).slice(0, n);
    expect(armyLevel(data, c)).toBeCloseTo(levels.reduce((a, b) => a + b, 0) / n);
  });

  it('the home heuristic buys healing and upgrades with the gold it has, never below zero', () => {
    const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'R', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    c.gold = 5000;
    c.materials = { ...c.materials, iron_ore: 10 };
    const spent = { heal: 0, buy: 0, upgrade: 0 };
    const after = homeHeuristic(data, c, spent);
    expect(after.gold).toBeGreaterThanOrEqual(0);
    expect(spent.buy + spent.upgrade + spent.heal).toBe(5000 - after.gold);
    expect(spent.upgrade).toBeGreaterThan(0);
  });

  it('marks missions outside the NFR12 corridor and the GDD gold curve', () => {
    expect(missionFlags(data, mission(), 'normal')).toEqual({});
    expect(missionFlags(data, mission({ wins: 5 }), 'normal').win).toBe('low');
    expect(missionFlags(data, mission({ downs: 2 }), 'normal').downs).toBe('low');
    expect(missionFlags(data, mission({ downs: 20 }), 'normal').downs).toBe('high');
    expect(missionFlags(data, mission({ downs: 0, wins: 10 }), 'easy')).toEqual({});
    expect(missionFlags(data, mission({ wins: 10 }), 'hard').win).toBe('high');
    expect(missionFlags(data, mission({ gold: 5000, sideGold: 0 }), 'normal').gold).toBe('low');
    expect(missionFlags(data, mission({ gold: 30000, sideGold: 0 }), 'normal').gold).toBe('high');
    expect(missionFlags(data, mission({ armyLevel: 50 }), 'normal').level).toBe('high');
  });
});
