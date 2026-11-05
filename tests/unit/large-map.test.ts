/** Story 15.11: the battle screen's decisions for large maps (src/app/screens/largeMap.ts). */
import { describe, expect, it } from 'vitest';
import { marchTogether, overviewTap } from '../../src/app/screens/largeMap';

describe('a tap in the overview', () => {
  it('jumps to an empty field without choosing it', () => {
    expect(overviewTap(true, false)).toEqual({ zoom: true, tap: false });
  });
  it('jumps to a figure and chooses it as a normal tap does', () => {
    expect(overviewTap(true, true)).toEqual({ zoom: true, tap: true });
  });
  it('is a normal tap outside the overview', () => {
    expect(overviewTap(false, false)).toEqual({ zoom: false, tap: true });
    expect(overviewTap(false, true)).toEqual({ zoom: false, tap: true });
  });
});

describe('foes marching together', () => {
  it('only in the foes’ phases and only with the option „Gemeinsam“', () => {
    expect(marchTogether(true, 'together')).toBe(true);
    expect(marchTogether(true, 'each')).toBe(false);
    expect(marchTogether(false, 'together')).toBe(false);
  });
});
