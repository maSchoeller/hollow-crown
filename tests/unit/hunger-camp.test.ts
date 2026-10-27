/** Mission 1-5 "Das Hungerlager" and decision E3 (story 9.6): line-up, Varek, children, the outro with Grosk. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCampaign, conditionContext, consequenceLines, createBattle, evalCondition, newCampaign, resolveScene, type CampaignState, type Difficulty, type GameData } from '../../src/core';

let data: GameData;
const fresh = (difficulty: Difficulty = 'normal'): CampaignState => newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const choose = (c: CampaignState, option: string) => applyCampaign(data, c, { type: 'choose', scene: 'scn.m1_5.outro', line: 'c01', option });
const withHaskGrudge = (n: number): CampaignState => {
  const c = fresh();
  c.lieutenants = { hask: { met: true, encounters: 1, grudge: n, routs: 0, signatureDropped: false } };
  return c;
};

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('map m1_5_hungerlager', () => {
  it('has 10 / 12 / 14 hungry foes with the waves, and no Grosk on the board', () => {
    const map = data.maps.m1_5_hungerlager!;
    expect(map.units.some((u) => u.id === 'grosk' || u.lieutenant === 'grosk')).toBe(false);
    for (const [d, n] of [['easy', 10], ['normal', 12], ['hard', 14]] as const) {
      const s = createBattle(data, fresh(d), 'm1_5', ['avatar', 'kael']);
      const start = s.units.filter((u) => u.team === 'enemy' && u.id !== 'varek').length;
      const waves = map.reinforcements.flatMap((r) => r.units).filter((u) => !u.difficulty || u.difficulty.includes(d)).length;
      expect(start + waves, d).toBe(n);
    }
  });

  it('Kael recruits Varek by talking (scene varek_talk); he is no weapon-bearing foe', () => {
    const v = data.maps.m1_5_hungerlager!.units.find((u) => u.id === 'varek')!;
    expect(v.recruit).toEqual({ by: ['kael'], dialogue: 'scn.m1_5.varek_talk' });
    expect(v.items).toEqual([]);
    expect(v.ignoreForRout).toBe(true);
    expect(data.chars.varek!.recruit).toBeUndefined();
  });

  it('survives six rounds: goal survive, no kill needed', () => {
    expect(data.maps.m1_5_hungerlager!.objectives.victory).toEqual({ type: 'survive', turns: 6 });
  });
});

describe('decision E3 in the outro', () => {
  it('spare: Grosk joins, counts as met, Hask grudge -1', () => {
    const r = choose(withHaskGrudge(2), 'spare');
    expect(r.campaign.flags.e03).toBe('spare');
    expect(r.campaign.flags.joined_grosk).toBe(true);
    expect(r.campaign.roster.some((u) => u.id === 'grosk')).toBe(true);
    expect(r.campaign.lieutenants!.hask!.grudge).toBe(1);
    expect(evalCondition(conditionContext(data, r.campaign), { met: 'grosk' })).toBe(true);
  });

  it('bounty: +600 gold, Grosk is met but does not join, Hask grudge stays', () => {
    const c = withHaskGrudge(2);
    const gold = c.gold;
    const r = choose(c, 'bounty');
    expect(r.campaign.flags.e03).toBe('bounty');
    expect(r.campaign.gold).toBe(gold + 600);
    expect(r.campaign.flags.joined_grosk).toBeUndefined();
    expect(r.campaign.roster.some((u) => u.id === 'grosk')).toBe(false);
    expect(r.campaign.lieutenants!.hask!.grudge).toBe(2);
    expect(r.campaign.lieutenants!.grosk).toMatchObject({ met: true, encounters: 1 });
  });

  it('the consequence card shows the visible effects of both answers', () => {
    const lines = resolveScene(data, conditionContext(data, fresh()), 'scn.m1_5.outro');
    const choice = lines.find((l) => l.kind === 'choice' && l.decision)!;
    if (choice.kind !== 'choice') throw new Error('no choice');
    const by = (id: string) => consequenceLines(choice.options.find((o) => o.id === id)!.effects);
    expect(by('spare')).toEqual(expect.arrayContaining([{ kind: 'recruit', unit: 'grosk' }, { kind: 'grudge', lt: 'hask', delta: -1 }]));
    expect(by('bounty')).toEqual(expect.arrayContaining([{ kind: 'gold', amount: 600 }]));
  });

  it('the scene branches follow the flag', () => {
    const ids = (flag: string) => {
      const c = fresh();
      c.flags.e03 = flag;
      return resolveScene(data, conditionContext(data, c), 'scn.m1_5.outro').flatMap((l) => (l.kind === 'line' ? [l.line] : []));
    };
    expect(ids('spare')).toContain('s01');
    expect(ids('spare')).not.toContain('b01');
    expect(ids('bounty')).toContain('b01');
    expect(ids('bounty')).not.toContain('s01');
  });
});
