/** Loading stored settings (story 13.1): older or partial stores get the defaults of the board display options. */
import { describe, expect, it } from 'vitest';
import { defaultSettings, mergeSettings } from '../../src/app/state/settings';

describe('settings merge', () => {
  const def = defaultSettings('de');

  it('gives the defaults for an empty store', () => {
    expect(mergeSettings(def, {})).toEqual(def);
  });

  it('fills the board display fields a legacy store lacks and keeps what it has', () => {
    const legacy = { lang: 'en' as const, speed: 2 as const, music: 0.3, enemyPaceRev: 2 };
    const s = mergeSettings(def, legacy);
    expect(s.grid).toBe('subtle');
    expect(s.hpBars).toBe('always');
    expect(s.enemyStrip).toBe(false);
    expect(s.lang).toBe('en');
    expect(s.speed).toBe(2);
    expect(s.music).toBe(0.3);
  });

  it('resets the enemy pace of a store from before the pace revision', () => {
    expect(mergeSettings(def, { enemySpeed: 2 }).enemySpeed).toBe(def.enemySpeed);
  });
});
