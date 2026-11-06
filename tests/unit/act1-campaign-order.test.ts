/** Story 15.2: every order the act 1 graph allows, checked against the rules of the mission list (missionsliste-s1.md, "Regeln" and "Prüfungen"). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { availableNodes, conditionContext, newCampaign, resolveScene, type CampaignState, type GameData } from '../../src/core';

let data: GameData;
let walked: Walk;

const fresh = (): CampaignState => newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const isStory = (id: string) => data.campaign.nodes.find((n) => n.id === id)!.kind === 'story';
const goal = (id: string) => data.maps[data.campaign.nodes.find((n) => n.id === id)!.map]!.objectives.victory.type;

interface Walk {
  orders: string[][];
  /** the most story missions open at once over every step of every order */
  mostOpen: number;
}

/** Every order of the story missions the graph allows (side quests left out, they never gate a story node). */
function walk(): Walk {
  const out: Walk = { orders: [], mostOpen: 0 };
  const step = (completed: string[]) => {
    const c = fresh();
    c.completed = completed;
    const open = availableNodes(data, c).filter((n) => n.kind === 'story');
    out.mostOpen = Math.max(out.mostOpen, open.length);
    if (!open.length) out.orders.push(completed);
    for (const n of open) step([...completed, n.id]);
  };
  step([]);
  return out;
}

beforeAll(() => {
  data = loadContentFromDisk().data;
  walked = walk();
});

describe('act 1 campaign order (story 15.2)', () => {
  it('allows exactly P, 1-1, the pair 1-2 and 1-3 either way round, then 1-4 to 1-8', () => {
    const tail = ['m1_4', 'm1_5', 'm1_6', 'm1_7', 'm1_8'];
    expect(walked.orders).toEqual([
      ['prologue', 'm1_1', 'm1_2', 'm1_3', ...tail],
      ['prologue', 'm1_1', 'm1_3', 'm1_2', ...tail],
    ]);
  });

  it('every order plays every story mission of the act once and ends with the finale', () => {
    const story = data.campaign.nodes.filter((n) => n.kind === 'story').map((n) => n.id).sort();
    for (const order of walked.orders) {
      expect([...order].sort()).toEqual(story);
      expect(data.campaign.nodes.find((n) => n.id === order.at(-1))!.fixed).toBe('finale');
    }
  });

  it('never has more than 2 story missions open at once', () => {
    expect(walked.mostOpen).toBe(2);
  });

  it('no order has the same goal twice in a row, also across the pair', () => {
    for (const order of walked.orders)
      for (let i = 1; i < order.length; i++) expect(goal(order[i]!), `${order[i - 1]} → ${order[i]}`).not.toBe(goal(order[i - 1]!));
  });

  it('opens the side quests where the list puts them: N1 after 1-4 with E2 "protect", N2 after 1-5, N3 after 1-6', () => {
    const after = (id: string) => {
      const order = walked.orders[0]!;
      return order.slice(0, order.indexOf(id) + 1);
    };
    const opens = (completed: string[], quest: string, flags: CampaignState['flags'] = {}, tobin = true) => {
      const c = fresh();
      c.completed = completed;
      c.flags = flags;
      // N3 needs Tobin in the company, alive or fallen; gone (not in the company) closes it
      c.roster = c.roster.filter((r) => r.id !== 'tobin');
      if (tobin) c.roster.push({ ...c.roster[0]!, id: 'tobin' });
      return availableNodes(data, c).some((n) => n.id === quest);
    };
    const before = (id: string) => after(id).slice(0, -1);
    expect(opens(before('m1_4'), 'n1', { e02: 'protect' })).toBe(false);
    expect(opens(after('m1_4'), 'n1', { e02: 'protect' })).toBe(true);
    expect(opens(after('m1_4'), 'n1')).toBe(false);
    expect(opens(before('m1_5'), 'n2')).toBe(false);
    expect(opens(after('m1_5'), 'n2')).toBe(true);
    expect(opens(before('m1_6'), 'n3')).toBe(false);
    expect(opens(after('m1_6'), 'n3')).toBe(true);
    expect(opens(after('m1_6'), 'n3', {}, false)).toBe(false);
    for (const q of ['n1', 'n2', 'n3']) expect(isStory(q)).toBe(false);
  });

  it('runs through every scene of every node without Varek: no line falls to him, none goes empty', () => {
    // the check can bite: with Varek in the company the N2 outro gives him a line
    const withVarek = fresh();
    withVarek.roster.push({ ...withVarek.roster[0]!, id: 'varek' });
    expect(resolveScene(data, conditionContext(data, withVarek), 'scn.n2.outro').some((l) => l.kind === 'line' && l.speaker === 'varek')).toBe(true);
    for (const order of walked.orders) {
      const c = fresh();
      for (const id of [...order, 'n1', 'n2', 'n3']) {
        const node = data.campaign.nodes.find((n) => n.id === id)!;
        expect(c.roster.some((r) => r.id === 'varek')).toBe(false);
        for (const scene of [node.pre, node.post].filter((s): s is string => !!s)) {
          const lines = resolveScene(data, conditionContext(data, c), scene);
          expect(lines.length, scene).toBeGreaterThan(0);
          expect(lines.filter((l) => l.kind === 'line' && l.speaker === 'varek'), scene).toEqual([]);
        }
        c.completed.push(id);
      }
    }
  });
});
