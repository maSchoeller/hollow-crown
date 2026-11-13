/** End of a published act (story 7.3): the finale ends the act, the backup reminder comes once per act, the next act's pack decides "coming soon". */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { actFinished, applyCampaign, backupDueAct, newCampaign, normalizeCampaign, replayCampaign, validateCampaign, type CampaignNodeDef, type CampaignState, type GameData } from '../../src/core';
import { clone } from '../../src/core/util';
import { hasPackForAct } from '../../src/packs/plan';

let data: GameData;

const node = (id: string, extra: Partial<CampaignNodeDef> = {}): CampaignNodeDef => ({
  id,
  map: 'prologue_paktnacht',
  titleKey: 'node.prologue.title',
  kind: 'story',
  merchantTier: 0,
  expectedLevel: 1,
  ...extra,
});

const fresh = (): CampaignState => newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const remind = (c: CampaignState, act = 1) => applyCampaign(data, c, { type: 'markBackupReminded', act });
const over = (c: CampaignState): CampaignState => ({ ...c, completed: ['a', 'z'] });

beforeAll(() => {
  data = clone(loadContentFromDisk().data);
  // a made-up act (fixtures, not the real act 1): an opening mission, a finale and a side quest
  data.acts[1]!.nodes = [node('a', { fixed: 'first' }), node('z', { fixed: 'finale' }), node('s', { kind: 'side' })];
});

describe('actFinished', () => {
  it('is true once the finale node is completed, and only then', () => {
    expect(actFinished(data, fresh())).toBe(false);
    expect(actFinished(data, { completed: ['a'] })).toBe(false);
    expect(actFinished(data, { completed: ['a', 's'] })).toBe(false);
    expect(actFinished(data, { completed: ['a', 'z'] })).toBe(true);
  });

  it('an act without a finale node is never over', () => {
    const d = clone(data);
    d.acts[1]!.nodes = d.acts[1]!.nodes.filter((n) => n.fixed !== 'finale');
    expect(actFinished(d, { completed: ['a', 'z', 's'] })).toBe(false);
  });
});

describe('next act in the build', () => {
  const list = [
    { act: 1, load: 'precache' as const },
    { act: 1, load: 'background' as const },
  ];
  it('is there when a pack has act + 1', () => {
    expect(hasPackForAct([...list, { act: 2, load: 'background' }], 2)).toBe(true);
  });
  it('does not count a voice pack alone', () => {
    expect(hasPackForAct([...list, { act: 2, load: 'voice' }], 2)).toBe(false);
  });
  it('is missing when no pack has it', () => {
    expect(hasPackForAct(list, 2)).toBe(false);
    expect(hasPackForAct([], 1)).toBe(false);
  });
});

describe('markBackupReminded', () => {
  it('starts empty and is refused before the finale or for an act not reached', () => {
    expect(fresh().backupReminded).toEqual([]);
    expect(validateCampaign(data, fresh(), { type: 'markBackupReminded', act: 1 })).toBe('not_available');
    expect(validateCampaign(data, over(fresh()), { type: 'markBackupReminded', act: 2 })).toBe('not_available');
    expect(validateCampaign(data, over(fresh()), { type: 'markBackupReminded', act: 1 })).toBeNull();
  });

  // the bug of 2026-11-13: with act 2 released the company leaves act 1 the moment its finale is done, so a rule bound to the
  // RUNNING act let the reminder of act 1 fall away for good
  it('stays open for the finished act after the move to the next one', () => {
    const moved: CampaignState = { ...over(fresh()), act: 2 };
    expect(validateCampaign(data, moved, { type: 'markBackupReminded', act: 1 })).toBeNull();
    expect(backupDueAct(data, moved)).toBe(1);
    expect(remind(moved, 1).campaign.backupReminded).toEqual([1]);
  });

  it('backupDueAct names the earliest unreminded finished act, and nothing once noted', () => {
    expect(backupDueAct(data, fresh())).toBeNull();
    expect(backupDueAct(data, over(fresh()))).toBe(1);
    expect(backupDueAct(data, { ...over(fresh()), backupReminded: [1] })).toBeNull();
    // act 2 is running but its finale is not done: only act 1 is due, and after that nothing
    expect(backupDueAct(data, { ...over(fresh()), act: 2, backupReminded: [1] })).toBeNull();
  });

  it('notes the act once with one event; asking again changes nothing', () => {
    const first = remind(over(fresh()));
    expect(first.campaign.backupReminded).toEqual([1]);
    expect(first.events).toContainEqual({ t: 'backupReminded', act: 1 });
    const again = remind(first.campaign);
    expect(again.campaign.backupReminded).toEqual([1]);
    expect(again.events.filter((e) => e.t === 'backupReminded')).toEqual([]);
  });

  it('is deterministic and replays from the journal', () => {
    const c = over(fresh());
    expect(remind(c).campaign).toEqual(remind(c).campaign);
    expect(replayCampaign(data, c, [{ type: 'markBackupReminded', act: 1 }]).backupReminded).toEqual([1]);
  });

  it('a save from before the field gets the default on load', () => {
    const { backupReminded: _gone, ...old } = fresh();
    expect(normalizeCampaign(data, old as unknown as CampaignState).backupReminded).toEqual([]);
    expect(normalizeCampaign(data, { ...fresh(), backupReminded: [1] }).backupReminded).toEqual([1]);
  });
});
