import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { firstNode, hireCost, isMercenary, newCampaign, refreshTavern, type GameData } from '../../src/core';
import { armyLevel, hireMercenaries, homeHeuristic, missionFlags, simulateCampaign, type MissionSim } from '../../tools/simCampaign';

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
  rooms: 0,
  deaths: 0,
  turns: 0,
  actions: 0,
  deployed: 0,
  phases: 0,
  phaseSingle: 0,
  phaseMarch: 0,
  phaseSingleMax: 0,
  phaseMarchMax: 0,
  phaseShown: 0,
  phaseShownMax: 0,
  winTurns: [],
  side: {},
  ...over,
});

describe('chained act simulation (story 6.8)', () => {
  it('plays the story missions in campaign order and is deterministic per seed', { timeout: 60000 }, () => {
    const o = { runs: 1, seed: 3, difficulty: 'normal' as const, deathMode: 'standard' as const, maxMissions: 3 };
    const a = simulateCampaign(data, o);
    expect(a.missions).toHaveLength(3);
    expect(a.missions.map((m) => m.node)).toEqual(data.acts[1]!.nodes.filter((n) => n.kind !== 'side').slice(0, a.missions.length).map((n) => n.id));
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
    const spent = { heal: 0, buy: 0, upgrade: 0, rooms: 0, hire: 0 };
    const after = homeHeuristic(data, c, spent);
    expect(after.gold).toBeGreaterThanOrEqual(0);
    expect(spent.buy + spent.upgrade + spent.heal + spent.rooms + spent.hire).toBe(5000 - after.gold);
    expect(spent.upgrade).toBeGreaterThan(0);
  });

  it('hires tavern mercenaries up to the deploy limit of the next mission and keeps the gold reserve (story 11.28)', () => {
    const fresh = () => {
      const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'R', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
      refreshTavern(data, c);
      return c;
    };
    const next = 'm1_8';
    const map = data.maps['m1_8_paktwacht_halten']!;
    const reserve = data.balance.simulation.hire.reserve;
    const rich = fresh();
    rich.gold = 100000;
    const spent = { heal: 0, buy: 0, upgrade: 0, rooms: 0, hire: 0 };
    const { campaign, hired } = hireMercenaries(data, rich, next, spent);
    const offers = rich.tavern.length;
    expect(offers).toBeGreaterThan(0);
    expect(hired).toBe(Math.min(offers, map.deploy.max - rich.roster.length));
    expect(campaign.roster.filter(isMercenary)).toHaveLength(hired);
    expect(spent.hire).toBe(100000 - campaign.gold);
    // the highest offer first
    expect(campaign.roster.find(isMercenary)!.level).toBe(Math.max(...rich.tavern.map((u) => u.level)));
    // same seed, same hires
    expect(hireMercenaries(data, fresh(), next, { heal: 0, buy: 0, upgrade: 0, rooms: 0, hire: 0 }).campaign.roster.map((u) => u.id)).toEqual(
      hireMercenaries(data, fresh(), next, { heal: 0, buy: 0, upgrade: 0, rooms: 0, hire: 0 }).campaign.roster.map((u) => u.id),
    );
    // never below the reserve, never past the limit, nothing without a next mission
    const poor = fresh();
    poor.gold = reserve + Math.min(...poor.tavern.map((u) => hireCost(data, u.level))) - 1;
    expect(hireMercenaries(data, poor, next, spent).hired).toBe(0);
    const full = fresh();
    full.gold = 100000;
    expect(hireMercenaries(data, full, firstNode(data).id, spent).hired).toBe(Math.max(0, Math.min(full.tavern.length, data.maps[firstNode(data).map]!.deploy.max - full.roster.length)));
    expect(hireMercenaries(data, full, undefined, spent).hired).toBe(0);
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

  it('counts only the win rate on winOnly nodes (prologue)', () => {
    expect(data.balance.simulation.winOnly).toContain('prologue');
    expect(missionFlags(data, mission({ node: 'prologue', downs: 0 }), 'normal').downs).toBeUndefined();
    expect(missionFlags(data, mission({ node: 'prologue', downs: 0, wins: 5 }), 'normal').win).toBe('low');
  });
});
