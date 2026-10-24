import { describe, expect, it } from 'vitest';
import { DEFAULT_PLACE, failureStatus, formatBytes, installProgress, missingAssets, missionAssets, ratio, unitModelId } from './plan';

const models = ['kael', 'avatar_a', 'avatar_b', 'brigand'];

describe('unitModelId', () => {
  it('prefers the chosen portrait when it has a model', () => {
    expect(unitModelId({ portrait: 'avatar_b', charId: 'rhen', classId: 'tactician' }, models)).toBe('avatar_b');
  });
  it('falls back to sprite, character, then class', () => {
    expect(unitModelId({ portrait: 'nobody', sprite: 'brigand', classId: 'x' }, models)).toBe('brigand');
    expect(unitModelId({ charId: 'kael', classId: 'captain' }, models)).toBe('kael');
    expect(unitModelId({ classId: 'brigand' }, models)).toBe('brigand');
  });
});

describe('missionAssets', () => {
  it('lists the place and each model once, sorted', () => {
    const list = missionAssets({
      units: [{ charId: 'kael', classId: 'captain' }, { charId: 'kael', classId: 'captain' }, { classId: 'brigand' }, { portrait: 'avatar_a', classId: 't' }],
      models,
      place: 'varnhold',
    });
    expect(list).toEqual(['locations/varnhold.webp', 'models/units/avatar_a.glb', 'models/units/brigand.glb', 'models/units/kael.glb']);
  });
  it('uses the default place and skips units without a model file', () => {
    expect(missionAssets({ units: [{ classId: 'archer' }], models })).toEqual([`locations/${DEFAULT_PLACE}.webp`]);
  });
  it('needs no models when the manifest has none (sprite figures)', () => {
    expect(missionAssets({ units: [{ classId: 'brigand' }], models: undefined })).toEqual([`locations/${DEFAULT_PLACE}.webp`]);
  });
});

describe('missingAssets', () => {
  it('keeps what is not cached, in order; a failing check counts as missing', async () => {
    const cached = new Set(['a', 'c']);
    const miss = await missingAssets(['a', 'b', 'c', 'd'], async (p) => {
      if (p === 'd') throw new Error('boom');
      return cached.has(p);
    });
    expect(miss).toEqual(['b', 'd']);
  });
  it('is empty when everything is cached (no loading screen)', async () => {
    expect(await missingAssets(['a'], async () => true)).toEqual([]);
  });
});

describe('numbers', () => {
  it('clamps ratios', () => {
    expect(ratio(0, 0)).toBe(1);
    expect(ratio(1, 4)).toBe(0.25);
    expect(ratio(9, 4)).toBe(1);
    expect(installProgress(3, 6)).toBe(0.5);
  });
  it('formats sizes per locale', () => {
    expect(formatBytes(12.4 * 1024 * 1024, 'de-DE')).toBe('12,4 MB');
    expect(formatBytes(12.4 * 1024 * 1024, 'en-US')).toBe('12.4 MB');
    expect(formatBytes(300 * 1024, 'en-US')).toBe('300 KB');
  });
  it('tells offline from failed', () => {
    expect(failureStatus(false)).toBe('offline');
    expect(failureStatus(true)).toBe('failed');
  });
});
