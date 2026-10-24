/** Skip in a scene stops at the first answer (decision 2026-10-24, story 4.5). */
import { describe, expect, it } from 'vitest';
import { skipTarget, type ResolvedLine } from '../../src/core';

const line = (uid: string): ResolvedLine => ({ kind: 'line', uid, line: uid, key: uid, mood: 'neutral', memorial: false });
const choice = (uid: string): ResolvedLine => ({ kind: 'choice', uid, line: uid, options: [] });

describe('skipTarget', () => {
  it('halts at the first choice after the current line', () => {
    const lines = [line('a'), line('b'), choice('c1'), line('d'), choice('c2')];
    expect(skipTarget(lines, 0)).toBe(2);
    expect(skipTarget(lines, 1)).toBe(2);
  });
  it('after the answer the next press halts at the next choice', () => {
    const lines = [line('a'), choice('c1'), line('d'), line('e'), choice('c2'), line('f')];
    expect(skipTarget(lines, 2)).toBe(4);
  });
  it('stays on a choice that is already shown', () => {
    expect(skipTarget([line('a'), choice('c1')], 1)).toBe(1);
  });
  it('a scene without a further choice ends at once', () => {
    expect(skipTarget([line('a'), line('b')], 0)).toBe(-1);
    expect(skipTarget([line('a'), choice('c1'), line('b')], 2)).toBe(-1);
    expect(skipTarget([], 0)).toBe(-1);
  });
});
