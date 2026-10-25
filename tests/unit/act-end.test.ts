/** End of a published act (story 7.3): the finale ends the act, the backup reminder comes once per act, the next act's pack decides "coming soon". */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { actFinished, applyCampaign, newCampaign, normalizeCampaign, replayCampaign, validateCampaign, type CampaignNodeDef, type CampaignState, type GameData } from '../../src/core';
import { clone } from '../../src/core/util';
import { hasPackForAct } from '../../src/packs/plan';

let data: GameData;

const node = (id: string, extra: Partial<CampaignNodeDef> = {}): CampaignNodeDef => ({
  id,
  map: 'prologue_caravan',
  titleKey: 'node.prologue.title',
  kind: 'story',
  pos: [50, 50],
  merchantTier: 0,
  expectedLevel: 1,
  ...extra,
});

const fresh = (): CampaignState => newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const remind = (c: CampaignState, act = data.campaign.act) => applyCampaign(data, c, { type: 'markBackupReminded', act });
const over = (c: CampaignState): CampaignState => ({ ...c, completed: ['a', 'z'] });

beforeAll(() => {
  data = clone(loadContentFromDisk().data);
  // a made-up act (fixtures, not the real act 1): an opening mission, a finale and a side quest
  data.campaign.nodes = [node('a', { fixed: 'first' }), node('z', { fixed: 'finale' }), node('s', { kind: 'side' })];
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
    d.campaign.nodes = d.campaign.nodes.filter((n) => n.fixed !== 'finale');
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
  it('starts empty and is refused before the finale or for another act', () => {
    expect(fresh().backupReminded).toEqual([]);
    expect(validateCampaign(data, fresh(), { type: 'markBackupReminded', act: data.campaign.act })).toBe('not_available');
    expect(validateCampaign(data, over(fresh()), { type: 'markBackupReminded', act: data.campaign.act + 1 })).toBe('not_available');
    expect(validateCampaign(data, over(fresh()), { type: 'markBackupReminded', act: data.campaign.act })).toBeNull();
  });

  it('notes the act once with one event; asking again changes nothing', () => {
    const first = remind(over(fresh()));
    expect(first.campaign.backupReminded).toEqual([data.campaign.act]);
    expect(first.events).toContainEqual({ t: 'backupReminded', act: data.campaign.act });
    const again = remind(first.campaign);
    expect(again.campaign.backupReminded).toEqual([data.campaign.act]);
    expect(again.events.filter((e) => e.t === 'backupReminded')).toEqual([]);
  });

  it('is deterministic and replays from the journal', () => {
    const c = over(fresh());
    expect(remind(c).campaign).toEqual(remind(c).campaign);
    expect(replayCampaign(data, c, [{ type: 'markBackupReminded', act: data.campaign.act }]).backupReminded).toEqual([data.campaign.act]);
  });

  it('a save from before the field gets the default on load', () => {
    const { backupReminded: _gone, ...old } = fresh();
    expect(normalizeCampaign(data, old as unknown as CampaignState).backupReminded).toEqual([]);
    expect(normalizeCampaign(data, { ...fresh(), backupReminded: [1] }).backupReminded).toEqual([1]);
  });
});
