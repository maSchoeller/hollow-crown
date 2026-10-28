/** A `trigger` foe on a defend/survive map wakes by itself, so waiting out the clock is not a way to win (mission 1-2, GDD Gegner-KI). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { asleep, beginBattle, dist, newCampaign, runAiPhase, wakesByTime, type BattleState, type GameData } from '../../src/core';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

function begin(nodeId: string, mapOf: string): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  c.completed = data.campaign.nodes.map((n) => n.id).slice(0, data.campaign.nodes.findIndex((n) => n.id === nodeId));
  const s = beginBattle(data, c, nodeId, c.roster.map((u) => u.id)).state;
  expect(s.mapId).toBe(mapOf);
  return s;
}

describe('sleeper wake on defend', () => {
  it('wakes at the unit’s own wakeTurn, else at half of the mission rounds', () => {
    const s = begin('m1_2', 'm1_2_erlbach');
    const r4 = s.units.find((u) => u.id === 'r4')!; // wakeTurn 5
    const hask = s.units.find((u) => u.id === 'hask')!; // wakeTurn 6
    s.turn = 4;
    expect(wakesByTime(data, s, r4)).toBe(false);
    expect(asleep(data, s, r4)).toBe(true);
    s.turn = 5;
    expect(asleep(data, s, r4)).toBe(false);
    expect(asleep(data, s, hask)).toBe(true);
    s.turn = 6;
    expect(asleep(data, s, hask)).toBe(false);
    delete r4.ai!.wakeTurn; // default: ceil(8 × 50 %) = 4
    s.turn = 4;
    expect(wakesByTime(data, s, r4)).toBe(true);
  });

  it('a sleeper that is due leaves its post and walks towards the company, with the player doing nothing', () => {
    const s = begin('m1_2', 'm1_2_erlbach');
    const r4 = s.units.find((u) => u.id === 'r4')!;
    const from = [...r4.pos!] as [number, number];
    const elder = s.units.find((u) => u.id === 'elder')!;
    s.turn = 3;
    runAiPhase(data, s, 'enemy', []);
    expect(r4.ai!.profile).toBe('trigger'); // still asleep
    expect(r4.pos).toEqual(from);
    for (const u of s.units) u.acted = false;
    s.turn = 5;
    runAiPhase(data, s, 'enemy', []);
    expect(r4.ai!.profile).toBe('aggressive');
    expect(dist(r4.pos!, elder.pos!)).toBeLessThan(dist(from, elder.pos!));
  });

  it('sleepers keep sleeping on a map that is not defend or survive', () => {
    const s = begin('prologue', 'prologue_paktnacht');
    const sleeper = s.units.find((u) => u.team === 'enemy' && u.ai?.profile === 'trigger')!;
    s.turn = 50;
    expect(asleep(data, s, sleeper)).toBe(true);
  });
});
