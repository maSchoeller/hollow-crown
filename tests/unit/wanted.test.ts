/** Wanted posters (story 3.6): the view of a lieutenant, the list of the known ones, and what a long press opens. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { bountyGold, longPressView, newCampaign, wantedList, wantedView, type CampaignState, type GameData } from '../../src/core';

let data: GameData;
const fresh = (): CampaignState => newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const knows = (c: CampaignState, id: string, grudge: number, target?: string, over: Partial<NonNullable<CampaignState['lieutenants']>[string]> = {}) => {
  (c.lieutenants ??= {})[id] = { met: true, encounters: 2, grudge, routs: grudge, signatureDropped: false, ...(target ? { target } : {}), ...over };
};

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('wantedView', () => {
  it('is null for an unknown id', () => {
    expect(wantedView(data, fresh(), 'nobody')).toBeNull();
  });

  it('shows a lieutenant not met yet with grudge 0, no counts and no target', () => {
    const v = wantedView(data, fresh(), 'hask')!;
    expect(v).toMatchObject({ id: 'hask', met: false, grudge: 0, encounters: 0, routs: 0, target: { kind: 'none' }, classId: 'brigand', titleKey: 'lt.hask.title', nameKey: 'unit.hask.name' });
    expect(v.level).toBeUndefined();
    expect(v.fleeRuleKey).toBe('ui.wanted.rule.flee');
  });

  it('takes bounty and material from the balance (formula of story 3.5)', () => {
    const cfg = data.balance.lieutenant.bounty;
    for (const g of [0, 1, 2, 3]) {
      const c = fresh();
      knows(c, 'hask', g, 'kael');
      const v = wantedView(data, c, 'hask')!;
      expect(v.bounty).toBe(bountyGold(data, g));
      expect(v.bounty).toBe(cfg.goldPerLevel * (g + 1));
    }
    const v = wantedView(data, fresh(), 'morra')!;
    expect(v.material).toEqual({ id: cfg.materialByAct[String(data.campaign.act)], min: cfg.materials.min, max: cfg.materials.max });
  });

  it('unlocks as many grudge skills as the grudge, in the order of the content', () => {
    for (const g of [0, 1, 2, 3]) {
      const c = fresh();
      knows(c, 'morra', g, 'kael');
      const v = wantedView(data, c, 'morra')!;
      expect(v.skills.map((s) => s.id)).toEqual(data.lieutenants.morra!.grudgeSkills);
      expect(v.skills.map((s) => s.free)).toEqual([g >= 1, g >= 2, g >= 3]);
      expect(v.skills.map((s) => s.grudge)).toEqual([1, 2, 3]);
    }
  });

  it('points at a target who is still in the company, who has fallen, who left, or at none', () => {
    const c = fresh();
    const kael = c.roster.find((r) => r.id === 'kael')!;
    knows(c, 'hask', 2, 'kael');
    expect(wantedView(data, c, 'hask')!.target).toMatchObject({ kind: 'alive', id: 'kael', nameKey: kael.nameKey });
    c.roster = c.roster.filter((r) => r.id !== 'kael');
    c.fallen.push({ id: 'kael', nameKey: kael.nameKey, node: 'prologue' });
    expect(wantedView(data, c, 'hask')!.target).toMatchObject({ kind: 'fallen', id: 'kael' });
    c.fallen = [];
    expect(wantedView(data, c, 'hask')!.target).toMatchObject({ kind: 'gone', id: 'kael' });
    knows(c, 'hask', 2);
    expect(wantedView(data, c, 'hask')!.target).toEqual({ kind: 'none' });
    knows(c, 'hask', 0, 'kael');
    expect(wantedView(data, c, 'hask')!.target).toEqual({ kind: 'none' });
  });

  it('counts meetings and routs from the campaign, level grudge and target from the unit on the board', () => {
    const c = fresh();
    knows(c, 'hask', 1, 'kael', { encounters: 3, routs: 2 });
    const v = wantedView(data, c, 'hask', { level: 6, grudge: 3, grudgeTarget: 'brenna' })!;
    expect(v).toMatchObject({ level: 6, grudge: 3, encounters: 3, routs: 2, met: true, bounty: bountyGold(data, 3) });
    expect(v.target).toMatchObject({ id: 'brenna' });
    expect(v.skills.every((s) => s.free)).toBe(true);
    // a lieutenant first seen in this battle: the counts are those before it
    const first = wantedView(data, fresh(), 'morra', { level: 4 })!;
    expect(first).toMatchObject({ level: 4, met: false, encounters: 0, grudge: 0, target: { kind: 'none' } });
  });

  it('keeps the grudge inside 0-3', () => {
    expect(wantedView(data, fresh(), 'hask', { level: 1, grudge: 9 })!.grudge).toBe(3);
  });
});

describe('wantedList', () => {
  it('lists only the lieutenants that were met, in the order of the content', () => {
    const c = fresh();
    expect(wantedList(data, c)).toEqual([]);
    knows(c, 'morra', 0, undefined, { encounters: 1 });
    knows(c, 'hask', 2, 'kael');
    (c.lieutenants ??= {}).ulvric = { met: false, encounters: 0, grudge: 0, routs: 0, signatureDropped: false };
    const order = Object.keys(data.lieutenants);
    const ids = wantedList(data, c).map((v) => v.id);
    expect(ids).toEqual(order.filter((id) => id === 'hask' || id === 'morra'));
    expect(ids).not.toContain('ulvric');
  });
});

describe('longPressView', () => {
  it('opens the poster for a lieutenant of the other side and the unit card for everyone else', () => {
    expect(longPressView(data, { lieutenant: 'hask', team: 'enemy' })).toBe('wanted');
    expect(longPressView(data, { lieutenant: 'hask', team: 'other' })).toBe('wanted');
    expect(longPressView(data, { team: 'enemy' })).toBe('info');
    expect(longPressView(data, { team: 'player' })).toBe('info');
    expect(longPressView(data, { lieutenant: 'hask', team: 'player' })).toBe('info');
    expect(longPressView(data, { lieutenant: 'unknown', team: 'enemy' })).toBe('info');
  });
});
