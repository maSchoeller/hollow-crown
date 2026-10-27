/** Story 9.4: the shop tier opens by the number of finished story missions (`merchant[].storyCount`), and an escorted NPC joins exactly once. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { addToRoster, autoplay, beginBattle, clone, currentTier, finishBattle, newCampaign, type GameData } from '../../src/core';

let data: GameData;
const avatar = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('shop tier by story mission count', () => {
  it('opens tier 2 with the fourth finished story mission, whichever it is', () => {
    const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, avatar);
    c.completed = ['prologue'];
    expect(currentTier(data, c)).toBe(0);
    c.completed = ['prologue', 'm1_1', 'm1_2'];
    expect(currentTier(data, c)).toBe(1);
    c.completed = ['prologue', 'm1_1', 'm1_3', 'm1_2'];
    expect(currentTier(data, c)).toBe(2);
    c.completed = ['prologue', 'm1_1', 'm1_3', 'm1_2'].reverse();
    expect(currentTier(data, c)).toBe(2);
  });

  it('keeps the merchantTier of a node as an alternative way to a tier', () => {
    const d = clone(data);
    d.campaign.nodes.find((n) => n.id === 'm1_1')!.merchantTier = 2;
    const c = newCampaign(d, 1, { difficulty: 'normal', deathMode: 'standard' }, avatar);
    c.completed = ['prologue', 'm1_1'];
    expect(currentTier(d, c)).toBe(2);
  });
});

describe('mission 1-3: Liora joins after the escort', () => {
  it('joins once, appears in the result, and a replay does not add her again', () => {
    const c = newCampaign(data, 3, { difficulty: 'easy', deathMode: 'standard' }, avatar);
    for (const ch of Object.values(data.chars)) if (ch.joins === 'prologue' || ch.joins === 'm1_1' || ch.joins === 'm1_2') addToRoster(data, c, ch.id);
    c.completed = ['prologue', 'm1_1'];
    const start = beginBattle(data, c, 'm1_3', c.roster.map((u) => u.id)).state;
    const { state } = autoplay(data, start);
    expect(state.outcome).toBe('victory');
    const first = finishBattle(data, c, state);
    expect(first.campaign.roster.filter((r) => r.id === 'liora')).toHaveLength(1);
    expect(first.result.recruited).toContain('liora');
    const again = finishBattle(data, first.campaign, state);
    expect(again.campaign.roster.filter((r) => r.id === 'liora')).toHaveLength(1);
  });
});
