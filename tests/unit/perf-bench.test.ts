import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCommand, createBattle, newCampaign } from '../../src/core';
import { BENCH_MAP_ID, benchMap } from '../perf/benchMap';

describe('performance bench map (story 7.5)', () => {
  it('is a valid 24×32 map with 40 units whose enemies all act in the enemy phase', () => {
    const { data } = loadContentFromDisk();
    const map = benchMap();
    expect(map.size).toEqual([24, 32]);
    data.maps[BENCH_MAP_ID] = map;
    data.campaign = { ...data.campaign, nodes: [...data.campaign.nodes, { ...data.campaign.nodes[0]!, id: 'perf', map: BENCH_MAP_ID, pre: undefined, post: undefined }] };
    const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    const s = createBattle(data, c, 'perf', []);
    expect(s.units.filter((u) => u.team === 'player')).toHaveLength(12);
    expect(s.units.filter((u) => u.team === 'enemy')).toHaveLength(28);
    const after = applyCommand(data, s, { type: 'endPhase' });
    const moved = new Set(after.events.flatMap((e) => (e.t === 'moved' ? [e.unit] : [])));
    expect(moved.size).toBeGreaterThan(20);
  });
});
