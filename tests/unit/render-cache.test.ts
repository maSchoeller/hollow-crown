import { describe, expect, it } from 'vitest';
import { RefCache } from '../../src/render/shared/cache';

/** A cache over fake files that counts loads and frees (story 5.1). */
function fakeCache(keepUnused: number) {
  const loads: string[] = [];
  const freed: string[] = [];
  const cache = new RefCache<string>(
    async (key) => {
      loads.push(key);
      return key;
    },
    (v) => freed.push(v),
    keepUnused,
  );
  return { cache, loads, freed };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('shared asset cache (story 5.1)', () => {
  it('loads a file once for all scenes that use it', async () => {
    const { cache, loads } = fakeCache(10);
    const board = {};
    const world = {};
    await cache.use('models/units/kael.glb', board);
    await cache.use('models/units/kael.glb', board);
    await cache.use('models/units/kael.glb', world);
    expect(loads).toEqual(['models/units/kael.glb']);
    expect(cache.refs('models/units/kael.glb')).toBe(2);
  });

  it('keeps a released file for the next scene: board → world map → board loads nothing again', async () => {
    const { cache, loads, freed } = fakeCache(10);
    const board1 = {};
    await cache.use('a', board1);
    await cache.use('b', board1);
    cache.release(board1);
    expect(cache.refs('a')).toBe(0);
    const world = {};
    await cache.use('ground/grass.png', world);
    cache.release(world);
    const board2 = {};
    await cache.use('a', board2);
    await cache.use('b', board2);
    expect(loads).toEqual(['a', 'b', 'ground/grass.png']);
    expect(freed).toEqual([]);
  });

  it('frees the longest unused files beyond keepUnused, never one in use', async () => {
    const { cache, freed } = fakeCache(1);
    const first = {};
    const second = {};
    await cache.use('old', first);
    cache.release(first);
    await cache.use('newer', second);
    await cache.use('shared', second);
    const third = {};
    await cache.use('shared', third);
    cache.release(second);
    await tick();
    // unused now: old (since the first release) and newer; one may stay, the older goes; shared is still held
    expect(freed).toEqual(['old']);
    expect(cache.has('newer')).toBe(true);
    expect(cache.refs('shared')).toBe(1);
  });

  it('frees everything on clear', async () => {
    const { cache, freed } = fakeCache(5);
    await cache.use('a', {});
    await cache.use('b', {});
    cache.clear();
    await tick();
    expect(freed.sort()).toEqual(['a', 'b']);
    expect(cache.has('a')).toBe(false);
  });

  it('survives a failed load', async () => {
    const cache = new RefCache<string>(() => Promise.reject(new Error('offline')), () => undefined, 0);
    const holder = {};
    await expect(cache.use('x', holder)).rejects.toThrow('offline');
    cache.release(holder);
    await tick();
    expect(cache.has('x')).toBe(false);
  });
});
