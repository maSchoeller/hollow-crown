import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ON_DEMAND_MUSIC } from '../app/loading/cacheName';
import { packOf, parsePacks } from '../content/packs';
import { backoffMs, byteRatio, duePacks, packBytes, packCacheName, packIdOfCache, planDownload, staleCaches } from './plan';

const f = (path: string, hash: string, size = 10) => ({ path, hash, size });

describe('pack caches', () => {
  it('names a cache by pack and hash and reads the pack back', () => {
    expect(packCacheName('act1', 'ab12')).toBe('hc-pack-act1-ab12');
    expect(packIdOfCache('hc-pack-act1-ab12')).toBe('act1');
    expect(packIdOfCache('hc-pack-voice.act1.de-ff')).toBe('voice.act1.de');
    expect(packIdOfCache('hc-on-demand')).toBeNull();
    expect(packIdOfCache('hc-pack-nohash')).toBeNull();
  });
  it('finds older versions of the same pack only', () => {
    const names = ['hc-pack-act1-old', 'hc-pack-act1-new', 'hc-pack-act2-x', 'workbox-precache-v2', 'hc-on-demand'];
    expect(staleCaches(names, 'act1', 'new')).toEqual(['hc-pack-act1-old']);
    expect(staleCaches(names, 'act2', 'x')).toEqual([]);
  });
});

describe('planDownload', () => {
  it('fetches everything the first time', () => {
    expect(planDownload([f('a', '1'), f('b', '2')])).toEqual({ reuse: [], fetch: [f('a', '1'), f('b', '2')] });
  });
  it('copies unchanged files from the older version and fetches the changed and new ones', () => {
    const plan = planDownload([f('a', '1'), f('b', '3'), f('c', '4')], [f('a', '1'), f('b', '2'), f('gone', '9')]);
    expect(plan.reuse.map((x) => x.path)).toEqual(['a']);
    expect(plan.fetch.map((x) => x.path)).toEqual(['b', 'c']);
  });
  it('skips files an interrupted attempt already stored', () => {
    const plan = planDownload([f('a', '1'), f('b', '2')], [], new Set(['a']));
    expect(plan.fetch.map((x) => x.path)).toEqual(['b']);
    expect(plan.reuse).toEqual([]);
  });
});

describe('duePacks', () => {
  const packs = [
    { id: 'core', load: 'precache' as const, act: 1 },
    { id: 'act1', load: 'background' as const, act: 1 },
    { id: 'act2', load: 'background' as const, act: 2 },
    { id: 'voice.act1.de', load: 'voice' as const, act: 1, lang: 'de' as const },
    { id: 'voice.act1.en', load: 'voice' as const, act: 1, lang: 'en' as const },
  ];
  it('lists the act packs reached so far, then the voice of the chosen language', () => {
    expect(duePacks(packs, 1, 'de').map((p) => p.id)).toEqual(['act1', 'voice.act1.de']);
    expect(duePacks(packs, 2, 'en').map((p) => p.id)).toEqual(['act1', 'act2', 'voice.act1.en']);
  });
});

describe('backoff and progress', () => {
  it('doubles the pause up to the maximum', () => {
    expect([1, 2, 3, 4, 10].map((n) => backoffMs(n, 2000, 10000))).toEqual([2000, 4000, 8000, 10000, 10000]);
    expect(backoffMs(0, 2000, 10000)).toBe(2000);
  });
  it('measures progress by bytes', () => {
    expect(byteRatio(5, 10)).toBe(0.5);
    expect(byteRatio(15, 10)).toBe(1);
    expect(byteRatio(0, 0)).toBe(1);
    expect(packBytes({ files: [f('a', '1', 3), f('b', '2', 4)] })).toBe(7);
  });
});

describe('packs.yaml and the loading plan', () => {
  it('puts the music that loads on demand (story 7.6) into act1', () => {
    const packs = parsePacks(parse(readFileSync(join(process.cwd(), 'content', 'packs.yaml'), 'utf8')));
    for (const m of ON_DEMAND_MUSIC) expect(packOf(packs, `audio/${m}.mp3`, 'assets').id).toBe('act1');
    expect(packOf(packs, 'audio/title.mp3', 'assets').id).toBe('core');
  });
});
