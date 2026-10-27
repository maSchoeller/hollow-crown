/** Map units with `requires` (story 9.5): E2 of mission 1-4 lets four foes drop out; set-up, replay, validation, the decision itself. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import { applyCampaign, conditionContext, createBattle, newCampaign, onConditions, resolveScene, type CampaignState, type Difficulty, type GameData } from '../../src/core';
import { clone } from '../../src/core/util';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];

const GONE = ['wr3', 'wr4', 'g3', 'g4'];
const fresh = (difficulty: Difficulty = 'normal'): CampaignState => newCampaign(data, 7, { difficulty, deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const withFenn = (c: CampaignState): CampaignState => applyCampaign(data, c, { type: 'effects', effects: [{ recruit: 'fenn' }] }).campaign;
const foes = (c: CampaignState) => createBattle(data, c, 'm1_4', c.roster.map((r) => r.id)).units.filter((u) => u.team === 'enemy').map((u) => u.uid);

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

describe('units with requires at the creation of the battle', () => {
  it('without the E2 flag the whole line-up stands (normal: 11 foes, the prisoner not counted)', () => {
    const ids = foes(fresh());
    for (const id of GONE) expect(ids).toContain(id);
    expect(ids.filter((id) => id !== 'ysolde')).toHaveLength(11);
  });

  it('with hand_over wr3, wr4, g3 and g4 are gone on every difficulty and nothing else changes', () => {
    for (const d of ['easy', 'normal', 'hard'] as const) {
      const base = foes(fresh(d));
      const c = fresh(d);
      c.flags.e02 = 'hand_over';
      const ids = foes(c);
      for (const id of GONE) expect(ids).not.toContain(id);
      expect(ids).toEqual(base.filter((id) => !GONE.includes(id)));
    }
  });

  it('protect leaves the line-up as it is', () => {
    const c = fresh();
    c.flags.e02 = 'protect';
    expect(foes(c)).toEqual(foes(fresh()));
  });

  it('the start state holds the filtered list and is the same for the same campaign (replay)', () => {
    const a = fresh();
    a.flags.e02 = 'hand_over';
    expect(createBattle(data, clone(a), 'm1_4', ['avatar', 'kael'])).toEqual(createBattle(data, clone(a), 'm1_4', ['avatar', 'kael']));
  });

  it('onConditions keeps units without requires and those whose conditions hold', () => {
    const ctx = conditionContext(data, fresh(), { e02: 'hand_over' });
    const defs = [{ id: 'a' }, { id: 'b', requires: [{ flag: { e02: 'hand_over' } }] }, { id: 'c', requires: [{ not: { flag: { e02: 'hand_over' } } }] }];
    expect(onConditions(ctx, defs).map((d) => d.id)).toEqual(['a', 'b']);
  });
});

describe('decision E2 in the intro of mission 1-4', () => {
  const choose = (c: CampaignState, option: string) => applyCampaign(data, c, { type: 'choose', scene: 'scn.m1_4.intro', line: 'c01', option });

  it('hand_over sets the flag and Fenn leaves before the line-up is built', () => {
    const r = choose(withFenn(fresh()), 'hand_over');
    expect(r.campaign.flags.e02).toBe('hand_over');
    expect(r.campaign.roster.some((u) => u.id === 'fenn')).toBe(false);
    expect(r.campaign.left).toContain('fenn');
    expect(foes(r.campaign)).not.toContain('wr3');
  });

  it('protect sets the flag, Fenn stays, the mission stays hard', () => {
    const r = choose(withFenn(fresh()), 'protect');
    expect(r.campaign.flags.e02).toBe('protect');
    expect(r.campaign.roster.some((u) => u.id === 'fenn')).toBe(true);
    expect(foes(r.campaign)).toContain('wr3');
  });

  it('without Fenn in the company the decision is not asked and no flag is set', () => {
    const lines = resolveScene(data, conditionContext(data, fresh()), 'scn.m1_4.intro');
    expect(lines.some((l) => l.kind === 'choice')).toBe(false);
    expect(lines.some((l) => l.kind === 'line' && l.line === 'n01')).toBe(true);
    const asked = resolveScene(data, conditionContext(data, withFenn(fresh())), 'scn.m1_4.intro');
    expect(asked.some((l) => l.kind === 'choice' && l.decision)).toBe(true);
  });
});

describe('content:check for requires', () => {
  const problems = (edit: (d: GameData) => void): string[] => {
    const d = clone(data);
    edit(d);
    return validateContent(d, locales).map((i) => i.message);
  };

  it('the shipped content is clean', () => {
    expect(validateContent(data, locales)).toEqual([]);
  });

  it('refuses an undeclared flag or value inside requires', () => {
    expect(problems((d) => (d.maps.m1_4_wolfslager!.units.find((u) => u.id === 'wr3')!.requires = [{ flag: 'ghost_flag' }]))).toContainEqual(expect.stringContaining('ghost_flag'));
    expect(problems((d) => (d.maps.m1_4_wolfslager!.units.find((u) => u.id === 'wr3')!.requires = [{ flag: { e02: 'maybe' } }]))).toContainEqual(expect.stringContaining('maybe'));
  });

  it('refuses requires on the boss, a lieutenant, a reinforcement and a unit of a side objective', () => {
    const req = [{ flag: { e02: 'protect' } }] as never;
    const map = (d: GameData) => d.maps.m1_4_wolfslager!;
    expect(problems((d) => (map(d).units.find((u) => u.id === 'osric')!.requires = req))).toContainEqual(expect.stringContaining('boss'));
    expect(problems((d) => (map(d).units.find((u) => u.id === 'ulvric')!.requires = req))).toContainEqual(expect.stringContaining('lieutenant'));
    expect(problems((d) => (map(d).units.find((u) => u.id === 'ysolde')!.requires = req))).toContainEqual(expect.stringContaining('side objective'));
    expect(problems((d) => (map(d).reinforcements[0]!.units[0]!.requires = req))).toContainEqual(expect.stringContaining('only for the line-up'));
  });
});
