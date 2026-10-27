/** Campaign graph of an act (story 4.3, architecture §5.4): availability, staged rules, roles, side quests. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { minStoryCount, validateContent } from '../../src/content/validate';
import type { Locales } from '../../src/content/load';
import {
  applyCampaign,
  availableNodes,
  beginBattle,
  classActionId,
  firstNode,
  isAvailable,
  lockedMechanics,
  lockedRoles,
  newCampaign,
  nodeLinks,
  nodeScenes,
  normalizeCampaign,
  storyCount,
  validateCampaign,
  type CampaignNodeDef,
  type CampaignState,
  type GameData,
} from '../../src/core';
import { clone } from '../../src/core/util';

let real: GameData;
let locales: Locales;
/** a made-up act on the PoC maps: fixed first, a free middle of two, a finale and two side quests */
let data: GameData;

const node = (id: string, extra: Partial<CampaignNodeDef>): CampaignNodeDef => ({
  id,
  map: 'prologue_paktnacht',
  titleKey: 'node.prologue.title',
  kind: 'story',
  merchantTier: 0,
  expectedLevel: 1,
  ...extra,
});

const fresh = (): CampaignState => newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const ids = (c: CampaignState) => availableNodes(data, c).map((n) => n.id);

beforeAll(() => {
  const loaded = loadContentFromDisk();
  real = loaded.data;
  locales = loaded.locales;
  data = clone(real);
  data.campaign.nodes = [
    node('a', { fixed: 'first', pre: 'scn.prologue.intro', post: 'scn.prologue.outro' }),
    node('b', { requires: [{ completed: 'a' }], expectedLevel: 2 }),
    node('c', { requires: [{ completed: 'a' }], expectedLevel: 2 }),
    node('z', { fixed: 'finale', expectedLevel: 4 }),
    node('s1', { kind: 'side', requires: [{ flag: 'avatar_honest' }], memorialIf: { dead: 'mira' }, post: 'scn.m1_2.outro', memorial: { post: 'scn.m1_3.outro' } }),
    node('s2', { kind: 'side' }),
  ];
  data.campaign.mechanics = { triangle: 1, magic: 2, elements: 3, supports: 3 };
});

describe('availableNodes', () => {
  it('offers only the fixed first mission at the start of the act', () => {
    const c = fresh();
    expect(ids(c)).toEqual(['a']);
    expect(firstNode(data).id).toBe('a');
  });

  it('then every node whose conditions hold; the finale only after all other story nodes', () => {
    const c = fresh();
    c.completed = ['a'];
    expect(ids(c)).toEqual(['b', 'c']);
    c.completed = ['a', 'c'];
    expect(ids(c)).toEqual(['b']);
    c.completed = ['a', 'c', 'b'];
    expect(ids(c)).toEqual(['z']);
    c.completed.push('z');
    expect(ids(c)).toEqual([]);
  });

  it('never offers a completed node again', () => {
    const c = fresh();
    c.completed = ['a', 'b'];
    expect(isAvailable(data, c, 'a')).toBe(false);
    expect(isAvailable(data, c, 'b')).toBe(false);
    expect(isAvailable(data, c, 'c')).toBe(true);
    expect(isAvailable(data, c, 'nope')).toBe(false);
  });

  it('opens a side quest by its own conditions, or by the effect openQuest', () => {
    let c = fresh();
    c.completed = ['a'];
    expect(ids(c)).not.toContain('s1');
    c = applyCampaign(data, c, { type: 'effects', effects: [{ setFlag: 'avatar_honest' }] }).campaign;
    expect(ids(c)).toContain('s1');
    expect(ids(c)).not.toContain('s2'); // no requires: only openQuest opens it
    const r = applyCampaign(data, c, { type: 'effects', effects: [{ openQuest: 's2' }] });
    expect(r.events).toContainEqual({ t: 'questOpened', node: 's2' });
    expect(ids(r.campaign)).toContain('s2');
    // twice is harmless
    expect(applyCampaign(data, r.campaign, { type: 'effects', effects: [{ openQuest: 's2' }] }).events.some((e) => e.t === 'questOpened')).toBe(false);
    expect(validateCampaign(data, c, { type: 'effects', effects: [{ openQuest: 'b' }] })).toBe('effect_invalid');
    r.campaign.completed.push('s2');
    expect(ids(r.campaign)).not.toContain('s2');
  });

  it('keeps the first mission alone even when a side quest would already be open', () => {
    const c = fresh();
    c.quests = ['s2'];
    expect(ids(c)).toEqual(['a']);
  });

  it('a finished side quest does not count for storyCount or the finale', () => {
    const c = fresh();
    c.completed = ['a', 's2'];
    expect(storyCount(data, c.completed)).toBe(1);
    expect(ids(c)).not.toContain('z');
  });

  it('the world map draws a path along each completed requirement', () => {
    expect(nodeLinks(data)).toEqual([
      ['a', 'b'],
      ['a', 'c'],
    ]);
  });
});

describe('memorial variant (memorialIf)', () => {
  it('plays the memorial scene when the quest trigger has fallen', () => {
    const c = fresh();
    expect(nodeScenes(data, c, 's1')).toEqual({ pre: undefined, post: 'scn.m1_2.outro' });
    c.fallen.push({ id: 'mira', nameKey: 'unit.mira.name', node: 'a' });
    expect(nodeScenes(data, c, 's1')).toEqual({ pre: undefined, post: 'scn.m1_3.outro' });
    expect(nodeScenes(data, c, 'a')).toEqual({ pre: 'scn.prologue.intro', post: 'scn.prologue.outro' });
    expect(nodeScenes(data, c, 'nope')).toEqual({});
  });
});

describe('staged rules count story missions (GDD)', () => {
  it('locks the triangle until 1, magic until 2, elements and supports until 3 story missions', () => {
    const c = fresh();
    expect(lockedMechanics(data, c).sort()).toEqual(['elements', 'magic', 'supports', 'triangle']);
    c.completed = ['a'];
    expect(lockedMechanics(data, c).sort()).toEqual(['elements', 'magic', 'supports']);
    c.completed = ['a', 'c']; // any order of the free middle
    expect(lockedMechanics(data, c).sort()).toEqual(['elements', 'supports']);
    c.completed = ['a', 'c', 's2']; // side quests do not count
    expect(lockedMechanics(data, c).sort()).toEqual(['elements', 'supports']);
    c.completed = ['a', 'c', 'b'];
    expect(lockedMechanics(data, c)).toEqual([]);
  });

  it('the battle takes the locks of the moment it starts', () => {
    const c = fresh();
    expect(beginBattle(real, c, 'prologue', ['kael']).state.locked).toContain('triangle');
    c.completed = ['prologue'];
    expect(beginBattle(real, c, 'm1_2', ['kael']).state.locked).not.toContain('triangle');
  });
});

describe('class actions per role (c.rolesSeen)', () => {
  it('a new campaign has seen the roles of its starting company', () => {
    const c = fresh();
    expect(c.rolesSeen.sort()).toEqual(['captain', 'tactician', 'vanguard']);
    expect(lockedRoles(data, c)).toContain('marksman');
    expect(lockedRoles(data, c)).not.toContain('vanguard');
  });

  it('a role opens with the first companion who brings it and stays open after they fall', () => {
    let c = fresh();
    c = applyCampaign(data, c, { type: 'effects', effects: [{ recruit: 'mira' }] }).campaign;
    expect(c.rolesSeen).toContain('marksman');
    expect(lockedRoles(data, c)).not.toContain('marksman');
    c = applyCampaign(data, c, { type: 'effects', effects: [{ leave: 'mira' }] }).campaign;
    expect(lockedRoles(data, c)).not.toContain('marksman');
  });

  it('a locked role has no class action in battle', () => {
    const c = fresh();
    const s = beginBattle(real, c, 'prologue', c.roster.map((u) => u.id)).state;
    expect(s.lockedRoles).toContain('marksman');
    const u = s.units.find((x) => x.team === 'player')!;
    const marksman = { ...u, classId: 'marksman' };
    expect(classActionId(real, marksman)).toBe('aim');
    expect(classActionId(real, marksman, s)).toBeUndefined();
    expect(classActionId(real, marksman, { ...s, lockedRoles: [] })).toBe('aim');
    expect(classActionId(real, marksman, { ...s, lockedRoles: undefined })).toBe('aim'); // older saves: nothing locked
  });
});

describe('commands check the graph', () => {
  it('refuse to finish a node that is not available', () => {
    const c = fresh();
    const start = beginBattle(data, c, 'a', ['kael']).state;
    expect(validateCampaign(data, c, { type: 'finishMission', start, commands: [] })).toBeNull();
    const done = { ...clone(c), completed: ['a'] };
    expect(validateCampaign(data, done, { type: 'finishMission', start, commands: [] })).toBe('node_unavailable');
  });
});

describe('older saves', () => {
  it('drop the stored list of available nodes and get rolesSeen and quests', () => {
    const c = fresh();
    const old = { ...clone(c), available: ['ch01'] } as unknown as Record<string, unknown>;
    delete old.rolesSeen;
    delete old.quests;
    const n = normalizeCampaign(data, old as unknown as CampaignState);
    expect('available' in n).toBe(false);
    expect(n.quests).toEqual([]);
    expect(n.rolesSeen.sort()).toEqual(['captain', 'tactician', 'vanguard']);
  });
});

describe('content:check of the graph', () => {
  const problems = (mutate: (d: GameData) => void) => {
    const d = clone(real);
    mutate(d);
    return validateContent(d, locales).map((i) => i.message);
  };

  it('the act 1 graph passes', () => {
    expect(problems(() => {})).toEqual([]);
  });

  it('needs exactly one first node and at most one finale', () => {
    expect(problems((d) => (d.campaign.nodes[1]!.fixed = 'first'))).toContainEqual(expect.stringContaining('exactly one node must be fixed: first'));
    expect(
      problems((d) => {
        d.campaign.nodes[1]!.fixed = 'finale';
        d.campaign.nodes[2]!.fixed = 'finale';
      }),
    ).toContainEqual('at most one node can be fixed: finale');
  });

  it('checks requires, memorial scenes and side quests', () => {
    expect(problems((d) => (d.campaign.nodes[1]!.requires = [{ completed: 'm9_9' }]))).toContainEqual(expect.stringContaining('unknown node m9_9'));
    expect(problems((d) => (d.campaign.nodes[1]!.memorialIf = { dead: 'mira' }))).toEqual(
      expect.arrayContaining([expect.stringContaining('memorialIf belongs to side quests'), expect.stringContaining('needs a memorial scene')]),
    );
    expect(problems((d) => (d.campaign.nodes[1]!.memorial = { post: 'scn.m1_2.outro' }))).toContainEqual(expect.stringContaining('memorial scenes need memorialIf'));
    expect(problems((d) => d.campaign.nodes.push(node('lonely', { kind: 'side' })))).toContainEqual(expect.stringContaining('side quest without requires'));
    expect(problems((d) => d.campaign.nodes.push(node('fx', { kind: 'side', fixed: 'finale', requires: [{ completed: 'm1_1' }] })))).toContainEqual(expect.stringContaining('only story nodes can be fixed'));
    expect(problems((d) => (d.campaign.nodes[0]!.requires = [{ completed: 'm1_1' }]))).toContainEqual(expect.stringContaining('fixed first node has no requires'));
  });

  it('expectedLevel never falls along a requirement', () => {
    expect(problems((d) => (d.campaign.nodes[2]!.expectedLevel = 1))).toEqual(expect.arrayContaining([expect.stringContaining('lower expectedLevel than m1_1')]));
  });

  it('minStoryCount: what a node can start with at the least', () => {
    const at = (id: string) => minStoryCount(data, data.campaign.nodes.find((n) => n.id === id)!);
    expect([at('a'), at('b'), at('c'), at('z'), at('s1')]).toEqual([0, 1, 1, 3, 0]);
  });
});
