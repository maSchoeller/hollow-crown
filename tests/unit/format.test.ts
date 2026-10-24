import { describe, expect, it } from 'vitest';
import { ageParts, playtimeParts } from '../../src/ui/format';

describe('campaign view formatting', () => {
  it('splits play time into hours and minutes', () => {
    expect(playtimeParts(0)).toEqual({ h: 0, m: 0 });
    expect(playtimeParts(65 * 60_000 + 59_000)).toEqual({ h: 1, m: 5 });
    expect(playtimeParts(6 * 3_600_000 + 20 * 60_000)).toEqual({ h: 6, m: 20 });
    expect(playtimeParts(-5)).toEqual({ h: 0, m: 0 });
  });

  it('picks the largest fitting unit for the age of a save', () => {
    expect(ageParts(30_000)).toEqual({ unit: 'now', n: 0 });
    expect(ageParts(5 * 60_000)).toEqual({ unit: 'min', n: 5 });
    expect(ageParts(59 * 60_000)).toEqual({ unit: 'min', n: 59 });
    expect(ageParts(60 * 60_000)).toEqual({ unit: 'hour', n: 1 });
    expect(ageParts(47 * 3_600_000)).toEqual({ unit: 'hour', n: 47 });
    expect(ageParts(72 * 3_600_000)).toEqual({ unit: 'day', n: 3 });
    expect(ageParts(-1000)).toEqual({ unit: 'now', n: 0 });
  });
});
