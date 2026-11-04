import { describe, expect, it } from 'vitest';
import { castleTier, type CampaignState, type GameData } from '../../src/core';

/** only what `castleTier` reads */
function setup(levels: Record<string, number>): { data: GameData; c: CampaignState } {
  const rooms = Object.fromEntries(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => [id, { id }]));
  const data = { rooms, balance: { castle: { tierAt: [1, 6, 14] } } } as unknown as GameData;
  const c = { home: { kind: 'castle', rooms: levels } } as unknown as CampaignState;
  return { data, c };
}

describe('castleTier', () => {
  it('is the ruin without any upgrade', () => {
    const { data, c } = setup({});
    expect(castleTier(data, c)).toBe(0);
  });

  it('counts the levels above 1 of all rooms, up to the thresholds', () => {
    const cases: Array<[Record<string, number>, number]> = [
      [{ a: 2 }, 1],
      [{ a: 3, b: 3, c: 2 }, 1],
      [{ a: 3, b: 3, c: 3 }, 2],
      [{ a: 3, b: 3, c: 3, d: 3, e: 3, f: 3, g: 2 }, 2],
      [{ a: 3, b: 3, c: 3, d: 3, e: 3, f: 3, g: 3 }, 3],
    ];
    for (const [levels, tier] of cases) {
      const { data, c } = setup(levels);
      expect(castleTier(data, c), JSON.stringify(levels)).toBe(tier);
    }
  });
});
