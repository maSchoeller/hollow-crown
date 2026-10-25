/** Node effects (campaign.yaml `effects`, architecture 5.4, story 9.2): applied on a victory by finishMission, checked by content:check. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { Locales } from '../../src/content/load';
import { campaignSchema } from '../../src/content/schemas';
import { validateContent } from '../../src/content/validate';
import { applyCampaign, autoplay, beginBattle, missionResultView, newCampaign, type BattleResult, type CampaignState, type GameData } from '../../src/core';

let data: GameData;
let locales: Locales;
let c: CampaignState;

/** Plays m1_1 with autoplay (a few seeds, the first win counts) and finishes it as the finishMission command. */
function finish(d: GameData, from: CampaignState) {
  for (let seed = 1; seed < 20; seed++) {
    const start = beginBattle(d, { ...from, seed }, 'm1_1', from.roster.map((u) => u.id)).state;
    const played = autoplay(d, start);
    if (played.state.outcome !== 'victory') continue;
    const r = applyCampaign(d, from, { type: 'finishMission', start, commands: played.log });
    const done = r.events.find((e) => e.t === 'missionFinished');
    return { campaign: r.campaign, result: (done as { result: BattleResult }).result, events: r.events };
  }
  throw new Error('m1_1 not won by autoplay');
}

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
  c = newCampaign(data, 5, { difficulty: 'easy', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  c.completed = ['prologue'];
});

describe('node effects', () => {
  it('m1_1 recruits Fenn on a victory and lists him with the other recruits', () => {
    expect(data.campaign.nodes.find((n) => n.id === 'm1_1')!.effects).toEqual([{ recruit: 'fenn' }]);
    expect(c.roster.some((u) => u.id === 'fenn')).toBe(false);
    const r = finish(data, c);
    expect(r.campaign.roster.some((u) => u.id === 'fenn')).toBe(true);
    expect(r.events).toContainEqual({ t: 'unitJoined', unit: 'fenn' });
    expect(r.result.recruited).toContain('fenn');
    expect(r.result.effects).toEqual([{ recruit: 'fenn' }]);
    expect(missionResultView(r.result).recruited).toContain('fenn');
  });

  it('applies the list in order (gold, item, recruit) and a list that no longer fits is skipped', () => {
    const d = structuredClone(data);
    const node = d.campaign.nodes.find((n) => n.id === 'm1_1')!;
    node.effects = [{ gold: 111 }, { item: { def: 'vulnerary' } }, { recruit: 'fenn' }];
    const plain = finish(data, c).campaign;
    const r = finish(d, c).campaign;
    expect(r.gold).toBe(plain.gold + 111);
    expect(r.convoy.length).toBe(plain.convoy.length + 1);
    node.effects = [{ leave: 'fenn' }];
    const skipped = finish(d, c);
    expect(skipped.campaign.completed).toContain('m1_1');
    expect(skipped.result.effects).toBeUndefined();
  });

  it('is part of the node schema', () => {
    const raw = { act: 1, startGold: 0, defaultPlace: 'x', nodes: [], merchant: [], scars: [] };
    const node = { id: 'a', map: 'm', titleKey: 'k', pos: [1, 1], merchantTier: 0, expectedLevel: 1 };
    expect(campaignSchema.safeParse({ ...raw, nodes: [{ ...node, effects: [{ recruit: 'fenn' }] }] }).success).toBe(true);
    expect(campaignSchema.safeParse({ ...raw, nodes: [{ ...node, effects: [{ nonsense: 1 }] }] }).success).toBe(false);
  });

  it('content:check rejects unsupported and unknown node effects like scene effects', () => {
    const problems = (effects: unknown[]) => {
      const d = structuredClone(data);
      d.campaign.nodes.find((n) => n.id === 'm1_1')!.effects = effects as never;
      return validateContent(d, locales).map((i) => i.message);
    };
    expect(problems([{ grudge: { lt: 'x', delta: 1 } }])).toContainEqual(expect.stringContaining('m1_1 effects: effect grudge is not yet supported'));
    expect(problems([{ recruit: 'nobody' }])).toContainEqual(expect.stringContaining('m1_1 effects: unknown companion nobody'));
    expect(problems([{ setFlag: 'no_such_flag' }]).length).toBeGreaterThan(0);
    expect(problems([{ recruit: 'fenn' }])).toEqual([]);
  });
});
