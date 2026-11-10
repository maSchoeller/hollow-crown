/**
 * Story 11.11: every order the act 2 graph allows, checked against the rules of the mission list (missionsliste-s1.md,
 * "Regeln", "Akt 2" and "Prüfungen"), like act1-campaign-order.test.ts for act 1. The nodes are placeholders until their
 * mission story builds the map, so a goal comes from the map when there is one and from the draft otherwise.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { loadContentFromDisk } from '../../src/content/node';
import { availableNodes, newCampaign, type CampaignState, type GameData, type MapDef } from '../../src/core';

let data: GameData;
let walked: Walk;

/** Node → draft of the reworked levels (draft ids differ from the provisional map ids of the nodes). */
const drafts: Record<string, string> = {
  m2_1: 's2_2_1_windscharte',
  m2_2: 's2_2_2_salzpass',
  m2_3: 's2_2_3_rabenweide',
  m2_4: 's2_2_4_brandschneise',
  m2_5: 's2_2_5_silberquell',
  m2_6: 's2_2_6_kraehenholm',
  m2_7: 's2_2_7_kontor',
  m2_8: 's2_2_8_kronfeld',
};
const draft = (id: string) =>
  parse(readFileSync(join(process.cwd(), 'concept', '27-ueberarbeitung', 'levels', `${drafts[id]}.yaml`), 'utf8')) as {
    objectives: { victory: { type: string } };
  };

const act2Nodes = () => data.acts[2]!.nodes;
const node = (id: string) => act2Nodes().find((n) => n.id === id)!;
const actOneStory = () => data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);

/** A campaign in act 2 at its start: act 1 done to its finale, the company at home in the castle; `done` = act-2 nodes played. */
function inAct2(done: string[] = []): CampaignState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  return { ...c, act: 2, home: { kind: 'castle', rooms: {} }, completed: [...actOneStory(), ...done] };
}

/** Puts a companion into the company (`in`), among the fallen (`dead`), among the gone (`left`) or nowhere (`none`). */
function withUnit(c: CampaignState, id: string, how: 'in' | 'dead' | 'left' | 'none'): CampaignState {
  c.roster = c.roster.filter((r) => r.id !== id);
  if (how === 'in') c.roster.push({ ...c.roster[0]!, id });
  if (how === 'dead') c.fallen = [...c.fallen, { id, nameKey: `unit.${id}.name`, node: 'm2_1' }];
  if (how === 'left') c.left = [...c.left, id];
  return c;
}

/**
 * The goal of a story node: from its map once built, from the draft before. A built map keeps the goal of its draft
 * (maps carry no reference to their draft, so the goal itself is compared): no mission story changes a goal silently.
 */
function goal(id: string): string {
  const planned = draft(id).objectives.victory.type;
  const map = data.maps[node(id).map];
  if (!map) return planned;
  expect(map.objectives.victory.type, `${id}: goal of the map against its draft`).toBe(planned);
  return map.objectives.victory.type;
}

interface Walk {
  orders: string[][];
  /** the most story missions of act 2 open at once over every step of every order */
  mostOpen: number;
}

/** Every order of the act-2 story missions the graph allows (side quests left out, they never gate a story node). */
function walk(d: GameData = data, open: (c: CampaignState) => string[] = (c) => storyOpen(d, c)): Walk {
  const out: Walk = { orders: [], mostOpen: 0 };
  const step = (done: string[]) => {
    const ids = open(inAct2(done));
    out.mostOpen = Math.max(out.mostOpen, ids.length);
    if (!ids.length) out.orders.push(done);
    for (const id of ids) step([...done, id]);
  };
  step([]);
  return out;
}

const own = (d: GameData) => new Set(d.acts[2]!.nodes.map((n) => n.id));
const storyOpen = (d: GameData, c: CampaignState) =>
  availableNodes(d, c)
    .filter((n) => n.kind === 'story' && own(d).has(n.id))
    .map((n) => n.id);

beforeAll(() => {
  data = { ...loadContentFromDisk().data, releasedActs: [1, 2] };
  walked = walk();
});

describe('act 2 campaign order (story 11.11)', () => {
  it('allows exactly 2-1, the pair 2-2/2-3 either way, 2-4, the pair 2-5/2-6 either way, 2-7, 2-8', () => {
    const pairs = (a: string[], b: string[]) => [
      ['m2_1', ...a, 'm2_4', ...b, 'm2_7', 'm2_8'],
    ];
    const ab = ['m2_2', 'm2_3'];
    const cd = ['m2_5', 'm2_6'];
    const expected = [ab, [...ab].reverse()].flatMap((a) => [cd, [...cd].reverse()].flatMap((b) => pairs(a, b)));
    expect(walked.orders.map((o) => o.join(' ')).sort()).toEqual(expected.map((o) => o.join(' ')).sort());
    expect(walked.orders).toHaveLength(4);
  });

  it('every order plays every story mission of the act once and ends with the finale', () => {
    const story = act2Nodes()
      .filter((n) => n.kind === 'story')
      .map((n) => n.id)
      .sort();
    expect(story).toHaveLength(8);
    for (const order of walked.orders) {
      expect([...order].sort()).toEqual(story);
      expect(node(order.at(-1)!).fixed).toBe('finale');
    }
  });

  it('never has more than 2 story missions open at once', () => {
    expect(walked.mostOpen).toBe(2);
  });

  it('every story node has a map or a draft to take its goal from', () => {
    for (const n of act2Nodes().filter((x) => x.kind === 'story')) expect(!!data.maps[n.map] || !!drafts[n.id], n.id).toBe(true);
    expect(Object.keys(drafts).sort()).toEqual(
      act2Nodes()
        .filter((n) => n.kind === 'story')
        .map((n) => n.id)
        .sort(),
    );
  });

  it('the goals run survive · {treasure, boss} · defend · {escort, rout} · reach · escape', () => {
    expect(['m2_1', 'm2_2', 'm2_3', 'm2_4', 'm2_5', 'm2_6', 'm2_7', 'm2_8'].map(goal)).toEqual([
      'survive',
      'treasure',
      'boss',
      'defend',
      'escort',
      'rout',
      'reach',
      'escape',
    ]);
  });

  it('no order has the same goal twice in a row, also across a pair', () => {
    for (const order of walked.orders)
      for (let i = 1; i < order.length; i++) expect(goal(order[i]!), `${order[i - 1]} → ${order[i]}`).not.toBe(goal(order[i - 1]!));
  });
});

describe('side quests of act 2 (story 11.11, product owner 2026-11-09)', () => {
  const opens = (done: string[], quest: string, unit?: [string, 'in' | 'dead' | 'left' | 'none']) => {
    const c = inAct2(done);
    if (unit) withUnit(c, ...unit);
    return availableNodes(data, c).some((n) => n.id === quest);
  };
  const upTo = (order: string[], id: string) => order.slice(0, order.indexOf(id) + 1);

  it('are side quests, not story missions', () => {
    for (const q of ['n4', 'n5', 'n6']) expect(node(q).kind).toBe('side');
  });

  it('N4 opens after 2-3 with Ilka in the company or fallen, stays closed when she has gone', () => {
    for (const order of walked.orders) {
      const after = upTo(order, 'm2_3');
      expect(opens(after.slice(0, -1), 'n4', ['ilka', 'in'])).toBe(false);
      expect(opens(after, 'n4', ['ilka', 'in'])).toBe(true);
      expect(opens(after, 'n4', ['ilka', 'dead'])).toBe(true);
      expect(opens(after, 'n4', ['ilka', 'left'])).toBe(false);
      expect(opens(after, 'n4', ['ilka', 'none'])).toBe(false);
    }
  });

  it('N5 opens after 2-4 without a further condition', () => {
    for (const order of walked.orders) {
      const after = upTo(order, 'm2_4');
      expect(opens(after.slice(0, -1), 'n5')).toBe(false);
      expect(opens(after, 'n5')).toBe(true);
    }
  });

  it('N6 opens together with 2-7 (after 2-5 and 2-6) with Jory in the company or fallen, stays closed when he has gone', () => {
    for (const order of walked.orders) {
      const with27 = upTo(order, 'm2_7').slice(0, -1);
      expect(storyOpen(data, inAct2(with27))).toEqual(['m2_7']);
      expect(opens(with27.slice(0, -1), 'n6', ['jory', 'in'])).toBe(false);
      expect(opens(with27, 'n6', ['jory', 'in'])).toBe(true);
      expect(opens(with27, 'n6', ['jory', 'dead'])).toBe(true);
      expect(opens(with27, 'n6', ['jory', 'left'])).toBe(false);
      expect(opens(with27, 'n6', ['jory', 'none'])).toBe(false);
    }
  });

  it('an opened side quest of act 2 stays on offer in every later step of every order and after 2-8', () => {
    // the last story node each quest waits for: N6 opens once both 2-5 and 2-6 are done, whichever came second
    const trigger: Record<string, string[]> = { n4: ['m2_3'], n5: ['m2_4'], n6: ['m2_5', 'm2_6'] };
    for (const order of walked.orders)
      for (const [quest, from] of Object.entries(trigger)) {
        const start = Math.max(...from.map((id) => order.indexOf(id)));
        for (let i = start + 1; i <= order.length; i++)
          expect(opens(order.slice(0, i), quest, quest === 'n4' ? ['ilka', 'in'] : quest === 'n6' ? ['jory', 'in'] : undefined), `${quest} after ${order.slice(0, i).join(',')}`).toBe(true);
      }
  });

  it('a played side quest closes, and no side quest gates a story mission', () => {
    const order = walked.orders[0]!;
    const c = withUnit(withUnit(inAct2([...order.slice(0, -1), 'n4', 'n5', 'n6']), 'ilka', 'in'), 'jory', 'in');
    const ids = availableNodes(data, c).map((n) => n.id);
    expect(ids).not.toContain('n4');
    expect(ids).toContain('m2_8');
    expect(walk(data, (x) => storyOpen(data, withUnit(withUnit(x, 'ilka', 'none'), 'jory', 'none'))).orders).toEqual(walked.orders);
  });

  it('the open side quests of act 1 (N1–N3) stay on offer in every step of act 2', () => {
    for (const order of walked.orders)
      for (let i = 0; i <= order.length; i++) {
        const c = withUnit(inAct2(order.slice(0, i)), 'tobin', 'in');
        c.quests = ['n1'];
        const ids = availableNodes(data, c).map((n) => n.id);
        for (const q of ['n1', 'n2', 'n3']) expect(ids, `${q} after ${order.slice(0, i).join(',')}`).toContain(q);
      }
  });
});

describe('placeholders of act 2 on the world map (story 11.11)', () => {
  let mapInBuild: (id: string) => boolean;
  let sessionMaps: Record<string, MapDef>;
  const added: string[] = [];

  beforeAll(async () => {
    mapInBuild = (await import('../../src/app/state/packs')).mapInBuild;
    sessionMaps = (await import('../../src/app/state/session')).data.maps;
  });

  afterEach(() => {
    for (const id of added.splice(0)) delete sessionMaps[id];
  });

  /** What the world map offers: the open nodes whose map is in the build (WorldMap.tsx). */
  const offered = (done: string[]) =>
    availableNodes(data, withUnit(withUnit(inAct2(done), 'ilka', 'in'), 'jory', 'in'))
      .filter((n) => own(data).has(n.id) && mapInBuild(n.map))
      .map((n) => n.id);

  it('no node of act 2 has a map in the build today, so the world map offers none', () => {
    for (const n of act2Nodes()) expect(mapInBuild(n.map), n.id).toBe(false);
    for (const order of walked.orders) for (let i = 0; i <= order.length; i++) expect(offered(order.slice(0, i))).toEqual([]);
  });

  it('with a map for one node of a pair only that one is offered; the next node waits until both are played', () => {
    const m22 = node('m2_2').map;
    sessionMaps[m22] = data.maps[data.acts[1]!.nodes[0]!.map]!;
    added.push(m22);
    expect(mapInBuild(m22)).toBe(true);
    expect(offered(['m2_1'])).toEqual(['m2_2']);
    // m2_3 is not in the build (act 2 unreleased, its map since story 11.14 only on disk): after 2-2 nothing is on offer, 2-4 opens only once 2-3 is played as well
    expect(offered(['m2_1', 'm2_2'])).toEqual([]);
    expect(storyOpen(data, inAct2(['m2_1', 'm2_2']))).toEqual(['m2_3']);
    expect(storyOpen(data, inAct2(['m2_1', 'm2_2', 'm2_3']))).toEqual(['m2_4']);
  });
});
