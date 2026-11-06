import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { GameData, GameEvent, Pos } from '../../src/core';
import { aiPhaseTimes, STRIKE_MS } from '../../tools/enemyPhase';
import { simulateCampaign } from '../../tools/simCampaign';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

const way = (n: number): Pos[] => Array.from({ length: n + 1 }, (_, i) => [i, 0] as Pos);
const walk = (unit: string, tiles: number): GameEvent[] => [
  { t: 'aiTurn', unit },
  { t: 'moved', unit, path: way(tiles) },
  { t: 'exhausted', unit },
];

describe('AI phase time (story 15.10)', () => {
  it('counts only AI phases, one figure per phase', () => {
    const events: GameEvent[] = [
      { t: 'phase', phase: 'player', turn: 1 },
      { t: 'moved', unit: 'me', path: way(5) },
      { t: 'phase', phase: 'enemy', turn: 1 },
      ...walk('a', 3),
      { t: 'phase', phase: 'other', turn: 1 },
      ...walk('o', 1),
      { t: 'phase', phase: 'player', turn: 2 },
    ];
    const p = aiPhaseTimes(data, events);
    const pace = data.render.aiPace;
    expect(p).toHaveLength(1); // enemy and third party together: the wait between two player phases
    const one = (tiles: number) => pace.focusMs + tiles * pace.stepMs + pace.afterMoveMs;
    expect(p[0]!.single).toBe(one(3) + one(1));
  });

  it('walkers of a march go together, a strike stays on its own', () => {
    const pace = data.render.aiPace;
    const events: GameEvent[] = [
      { t: 'phase', phase: 'enemy', turn: 1 },
      ...walk('a', 4),
      ...walk('b', 2),
      ...walk('c', 3),
      { t: 'aiTurn', unit: 'd' },
      { t: 'strike', attacker: 'd', defender: 'me', hit: true, crit: false, dmg: 3, hpAfter: 5, ranged: false, magic: false },
      { t: 'phase', phase: 'player', turn: 2 },
    ];
    const [p] = aiPhaseTimes(data, events);
    const walkMs = (tiles: number) => tiles * pace.stepMs + pace.afterMoveMs;
    const strikeOnly = p!.single - 3 * pace.focusMs - walkMs(4) - walkMs(2) - walkMs(3) - pace.focusMs;
    expect(strikeOnly).toBe(STRIKE_MS + pace.afterStrikeMs);
    expect(p!.march).toBe(walkMs(4) + pace.focusMs + strikeOnly);
    expect(p!.march).toBeLessThan(p!.single);
  });

  it('the chained simulation records rounds, actions and AI phases of the first attempts won', { timeout: 60000 }, () => {
    const [m] = simulateCampaign(data, { runs: 1, seed: 3, difficulty: 'normal', deathMode: 'standard', maxMissions: 1 }).missions;
    expect(m!.wins).toBe(1);
    expect(m!.turns).toBeGreaterThan(0);
    expect(m!.actions).toBeGreaterThan(0);
    expect(m!.deployed).toBeGreaterThan(0);
    expect(m!.phases).toBeGreaterThanOrEqual(m!.turns - 1);
    expect(m!.phaseMarch).toBeLessThanOrEqual(m!.phaseSingle);
    expect(m!.phaseSingleMax).toBeGreaterThan(0);
  });
});
