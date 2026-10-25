import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCommand, beginBattle, finishBattle, getUnit, grantExp, newCampaign, seedRng, type CampaignState, type GameData, type GameEvent } from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

describe('result of a unit recruited mid-battle', () => {
  it('shows the level-up of a companion who joined through a village', () => {
    const c = { ...base, roster: base.roster.filter((r) => r.id !== 'mira') };
    let s = beginBattle(data, c, 'ch01', c.roster.map((r) => r.id)).state;
    const village = s.objects.find((o) => o.id === 'v_east')!;
    const visitor = s.units.find((u) => u.team === 'player' && u.pos)!;
    visitor.pos = [village.at[0], village.at[1]];
    s = applyCommand(data, s, { type: 'act', unit: visitor.uid, to: village.at, action: { kind: 'visit' } }).state;
    const mira = getUnit(s, 'mira');
    const joined = mira.level;
    expect(mira.fromRoster).toBe(false);
    grantExp(data, mira, data.balance.experience.levelUpAt + 7, seedRng(3), [] as GameEvent[]);
    expect(mira.level).toBe(joined + 1);
    s.outcome = 'victory';
    const { campaign, result } = finishBattle(data, c, s);
    const entry = result.units.find((u) => u.id === 'mira')!;
    expect(result.recruited).toContain('mira');
    expect(entry.levelBefore).toBe(joined);
    expect(entry.levelAfter).toBe(joined + 1);
    expect(entry.levelBefore).toBeLessThan(entry.levelAfter);
    expect(campaign.roster.find((r) => r.id === 'mira')!.level).toBe(joined + 1);
  });

  it('does not list a node-effect recruit, who was never in the battle', () => {
    const s = beginBattle(data, base, 'm1_1', base.roster.map((r) => r.id)).state;
    s.outcome = 'victory';
    const { result } = finishBattle(data, base, s);
    expect(result.units.some((u) => u.id === 'fenn')).toBe(false);
  });
});
