import { describe, expect, it } from 'vitest';
import { failureStatus, formatBytes, gearModels, installProgress, missingAssets, missionAssets, placePath, ratio } from './plan';

const models = ['kael', 'avatar_a', 'avatar_b', 'brigand', 'mercenary'];
const classes = { skirmisher: { art: 'mercenary' }, archer: {}, brigand: {} };
const defaultPlace = 'lager_unterwegs';
const base = { models, classes, defaultPlace };

describe('missionAssets', () => {
  it('lists the place and each model once, sorted', () => {
    const list = missionAssets({
      units: [{ charId: 'kael', classId: 'captain' }, { charId: 'kael', classId: 'captain' }, { classId: 'brigand' }, { portrait: 'avatar_a', classId: 't' }],
      models,
      classes,
      defaultPlace,
      place: 'varnhold',
    });
    expect(list).toEqual(['locations/varnhold.webp', 'models/units/avatar_a.glb', 'models/units/brigand.glb', 'models/units/kael.glb']);
  });
  it('uses the default place and skips units without a model file', () => {
    expect(missionAssets({ units: [{ classId: 'archer' }], ...base })).toEqual([`locations/${defaultPlace}.webp`]);
  });
  it('draws a hired tavern mercenary with the figure its class names', () => {
    expect(missionAssets({ units: [{ classId: 'skirmisher' }], ...base })).toEqual([`locations/${defaultPlace}.webp`, 'models/units/mercenary.glb']);
  });
  it('needs no models when the manifest has none (sprite figures)', () => {
    expect(missionAssets({ units: [{ classId: 'brigand' }], ...base, models: undefined })).toEqual([`locations/${defaultPlace}.webp`]);
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
    expect(formatBytes(12.4 * 1024 * 1024, 'de-DE')).toEqual({ n: '12,4', unitKey: 'ui.size.mb' });
    expect(formatBytes(12.4 * 1024 * 1024, 'en-US')).toEqual({ n: '12.4', unitKey: 'ui.size.mb' });
    expect(formatBytes(300 * 1024, 'en-US')).toEqual({ n: '300', unitKey: 'ui.size.kb' });
  });
  it('tells offline from failed', () => {
    expect(failureStatus(false)).toBe('offline');
    expect(failureStatus(true)).toBe('failed');
  });
});

describe('placePath', () => {
  it('a location lives in locations, a background keeps its folder', () => {
    expect(placePath('varnhold')).toBe('locations/varnhold.webp');
    expect(placePath('backgrounds/bg_caravan_road')).toBe('backgrounds/bg_caravan_road.webp');
  });
  it('the mission list names the background image', () => {
    expect(missionAssets({ units: [], ...base, place: 'backgrounds/bg_varnhold_burning' })).toEqual(['backgrounds/bg_varnhold_burning.webp']);
  });
});

describe('weapon models', () => {
  const items = {
    iron_sword: { weaponType: 'sword', kind: 'weapon' },
    iron_bow: { weaponType: 'bow', kind: 'weapon' },
    wooden_shield: { kind: 'shield' },
    vulnerary: { kind: 'consumable' },
  } as never;
  const gear = {
    weapons: { sword: { model: 'sword', hand: 'right' }, bow: { model: 'bow', hand: 'left' } },
    offHand: { shield: { model: 'shield', hand: 'left' } },
  } as never;
  const weaponModels = ['sword', 'bow', 'shield', 'axe'];

  it('maps equipped items to weapon models, off-hand included, each once', () => {
    expect(gearModels(['iron_sword', 'wooden_shield', 'iron_sword', 'vulnerary', 'ghost'], items, gear).sort()).toEqual(['shield', 'sword']);
  });
  it('the mission plan adds the weapon files of the units with a model', () => {
    const list = missionAssets({
      units: [{ charId: 'kael', classId: 'captain', gearItems: ['iron_sword', 'wooden_shield'] }, { classId: 'brigand', gearItems: ['iron_bow'] }, { classId: 'archer', gearItems: ['iron_bow'] }],
      ...base,
      items,
      gear,
      weaponModels,
    });
    expect(list).toEqual([`locations/${defaultPlace}.webp`, 'models/units/brigand.glb', 'models/units/kael.glb', 'models/weapons/bow.glb', 'models/weapons/shield.glb', 'models/weapons/sword.glb']);
  });
  it('a unit without a model file (sprite figure) needs no weapon, and neither does a file the manifest lacks', () => {
    expect(missionAssets({ units: [{ classId: 'archer', gearItems: ['iron_sword'] }], ...base, items, gear, weaponModels })).toEqual([`locations/${defaultPlace}.webp`]);
    expect(missionAssets({ units: [{ classId: 'brigand', gearItems: ['iron_sword'] }], ...base, items, gear, weaponModels: ['bow'] })).toEqual([`locations/${defaultPlace}.webp`, 'models/units/brigand.glb']);
    expect(missionAssets({ units: [{ classId: 'brigand', gearItems: ['iron_sword'] }], ...base })).toEqual([`locations/${defaultPlace}.webp`, 'models/units/brigand.glb']);
  });
});
