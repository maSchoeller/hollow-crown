/** Loading stored settings (story 13.1): older or partial stores get the defaults of the board display options. */
import { describe, expect, it } from 'vitest';
import { defaultSettings, mergeSettings } from '../../src/app/state/settings';

describe('settings merge', () => {
  const def = defaultSettings('de');

  it('gives the defaults for an empty store', () => {
    expect(mergeSettings(def, {})).toEqual(def);
  });

  it('fills the board display fields a legacy store lacks and keeps what it has', () => {
    const legacy = { lang: 'en' as const, speed: 2 as const, music: 0.3, enemyPaceRev: 3 };
    const s = mergeSettings(def, legacy);
    expect(s.grid).toBe('subtle');
    expect(s.hpBars).toBe('always');
    expect(s.enemyStrip).toBe(false);
    expect(s.lang).toBe('en');
    expect(s.speed).toBe(2);
    expect(s.music).toBe(0.3);
  });

  it('defaults to 2x enemy speed and marching together', () => {
    expect(def.enemySpeed).toBe(2);
    expect(def.enemyMarch).toBe('together');
  });

  it('lifts the enemy pace of a store from before the pace revision to 2x', () => {
    expect(mergeSettings(def, { enemySpeed: 1 }).enemySpeed).toBe(2);
    expect(mergeSettings(def, { enemySpeed: 1, enemyPaceRev: 2 }).enemySpeed).toBe(2);
    expect(mergeSettings(def, { enemySpeed: 3, enemyPaceRev: 2 }).enemySpeed).toBe(2);
  });

  it('keeps the choice of a store with the current revision', () => {
    expect(mergeSettings(def, { enemySpeed: 1, enemyPaceRev: 3 }).enemySpeed).toBe(1);
    expect(mergeSettings(def, { enemySpeed: 3, enemyPaceRev: 3 }).enemySpeed).toBe(3);
  });

  it('keeps 1x after migrating, saving and reloading', () => {
    const migrated = mergeSettings(def, { enemySpeed: 1 });
    const chosen = { ...migrated, enemySpeed: 1 as const };
    const reloaded = mergeSettings(def, JSON.parse(JSON.stringify(chosen)) as typeof chosen);
    expect(reloaded.enemySpeed).toBe(1);
  });

  it('lets the foes march together unless the player chose one by one (story 15.11)', () => {
    expect(def.enemyMarch).toBe('together');
    expect(mergeSettings(def, { enemyPaceRev: 3 }).enemyMarch).toBe('together');
    expect(mergeSettings(def, { enemyPaceRev: 3, enemyMarch: 'each' }).enemyMarch).toBe('each');
    // a value this version does not know
    expect(mergeSettings(def, { enemyPaceRev: 3, enemyMarch: 'fast' as never }).enemyMarch).toBe('together');
  });
});
