/**
 * Story 16.10: stance keys, clip fallback and the deterministic gesture plan (src/render/shared/stance.ts), with synthetic clips
 * (the real files are Git LFS pointers in CI).
 */
import { describe, expect, it } from 'vitest';
import { gestureLoops, hashName, readyInRow, resolveStance, RestTimeline, stanceKeyOf, startOffset } from '../../src/render/shared/stance';
import type { VatClip } from '../../src/render/shared/vat';

function clips(...names: string[]): Map<string, VatClip> {
  let first = 0;
  return new Map(
    names.map((name) => {
      const c: VatClip = { name, first, rows: 4, loop: /^(rest|ready_(?!in)|idle)/.test(name), fps: 4 };
      first += 4;
      return [name, c];
    }),
  );
}

describe('stanceKeyOf', () => {
  it('takes the main weapon, a shield adds, an off-hand stance replaces, no weapon is none', () => {
    expect(stanceKeyOf({ stance: 'blade' })).toBe('blade');
    expect(stanceKeyOf({ stance: 'blade' }, { stanceMod: 'shield' })).toBe('blade_shield');
    expect(stanceKeyOf({ stance: 'blade' }, { stance: 'lute' })).toBe('lute');
    expect(stanceKeyOf({ stance: 'staff' }, { stance: 'book' })).toBe('book');
    expect(stanceKeyOf(undefined)).toBe('none');
    expect(stanceKeyOf({})).toBe('none');
  });
});

describe('resolveStance', () => {
  const all = clips('idle', 'rest_none', 'rest_blade', 'ready_blade', 'ready_in_blade', 'gesture_blade_look', 'gesture_blade_shift', 'rest_blade_shield', 'ready_blade_shield', 'ready_in_blade_shield');

  it('finds the clips of the key', () => {
    const r = resolveStance(all, 'blade');
    expect(r.key).toBe('blade');
    expect(r.rest?.name).toBe('rest_blade');
    expect(r.ready?.name).toBe('ready_blade');
    expect(r.readyIn?.name).toBe('ready_in_blade');
    expect(r.gestures.map((g) => g.name)).toEqual(['gesture_blade_look', 'gesture_blade_shift']);
  });
  it('falls back from the shield variant to the plain stance, then to none, then to idle', () => {
    expect(resolveStance(all, 'blade_shield').rest?.name).toBe('rest_blade_shield');
    expect(resolveStance(clips('rest_axe', 'rest_none', 'idle'), 'axe_shield').key).toBe('axe');
    const none = resolveStance(clips('rest_none', 'idle'), 'bow');
    expect(none.key).toBe('none');
    expect(none.ready).toBeUndefined();
    const old = resolveStance(clips('idle', 'walk'), 'bow');
    expect(old.key).toBe('');
    expect(old.rest?.name).toBe('idle');
    expect(old.gestures).toEqual([]);
  });
});

describe('gesture plan', () => {
  const every: [number, number] = [6, 10];

  it('hashes names deterministically and apart', () => {
    expect(hashName('unit:a')).toBe(hashName('unit:a'));
    expect(hashName('unit:a')).not.toBe(hashName('unit:b'));
    for (const s of ['a', 'bb', 'ccc']) {
      const o = startOffset(hashName(s), 4);
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThan(4);
    }
  });

  it('picks one or two loops that keep the gap between gesture starts in range', () => {
    for (let n = 0; n < 50; n++) {
      const l = gestureLoops(hashName('x'), n, 4, 2, every);
      expect([1, 2]).toContain(l);
      expect(2 + l * 4).toBeGreaterThanOrEqual(6);
      expect(2 + l * 4).toBeLessThanOrEqual(10);
    }
    // with a short rest loop, other counts are tried until the range fits
    expect(gestureLoops(1, 0, 1.5, 1, every)).toBeGreaterThanOrEqual(4);
  });

  it('plays rest loops, a gesture, rest loops, and the gesture starts are 6 to 10 seconds apart', () => {
    const g = [1.5, 2, 1.75];
    const tl = new RestTimeline(hashName('Lucan'), 4, g, every, 1.3);
    const starts: number[] = [];
    let last = -1;
    for (let t = 0; t < 200; t += 0.05) {
      const f = tl.at(t);
      if (f.gesture >= 0 && last < 0) starts.push(t);
      last = f.gesture;
      if (f.gesture >= 0) {
        expect(f.local).toBeGreaterThanOrEqual(-1e-9);
        expect(f.local).toBeLessThan(g[f.gesture]! + 1e-9);
      }
    }
    expect(starts.length).toBeGreaterThan(15);
    for (let i = 1; i < starts.length; i++) {
      const gap = starts[i]! - starts[i - 1]!;
      expect(gap).toBeGreaterThan(6 - 0.1);
      expect(gap).toBeLessThan(10 + 0.1);
    }
  });

  it('is the same for the same seed and differs between figures', () => {
    const run = (name: string) => {
      const tl = new RestTimeline(hashName(name), 4, [1.5, 2, 1.75], every, startOffset(hashName(name), 4));
      const out: number[] = [];
      for (let t = 0; t < 120; t += 0.25) out.push(tl.at(t).gesture);
      return out.join();
    };
    expect(run('Mira')).toBe(run('Mira'));
    expect(run('Mira')).not.toBe(run('Brann'));
  });

  it('rests forever without gesture clips', () => {
    const tl = new RestTimeline(5, 4, [], every);
    expect(tl.at(1000)).toEqual({ gesture: -1, local: 1000 });
  });
});

describe('readyInRow', () => {
  it('maps progress to the rows of the switch clip', () => {
    const c: VatClip = { name: 'ready_in_blade', first: 10, rows: 16, loop: false, fps: 60 };
    expect(readyInRow(c, 0)).toBe(10);
    expect(readyInRow(c, 1)).toBe(25);
    expect(readyInRow(c, 0.5)).toBe(18);
    expect(readyInRow(c, 2)).toBe(25);
  });
});
