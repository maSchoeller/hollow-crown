import { unitModelPath } from '../../core';
import { describe, expect, it } from 'vitest';
import { ON_DEMAND_MUSIC } from './cacheName';
import { BATTLE_MUSIC, LATER_MUSIC, failureStatus, formatBytes, gearModels, installProgress, itemImages, laterMusicAssets, missingAssets, missionAssets, placePath, ratio } from './plan';

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
  it('puts a model in the folder of the pack it ships in (manifest unitPacks), else in models/units', () => {
    const unitPacks = { kael: 'core', brigand: 'act1' };
    expect(missionAssets({ units: [{ charId: 'kael', classId: 'captain' }, { classId: 'brigand' }, { classId: 'skirmisher' }], ...base, unitPacks, place: 'p' })).toEqual([
      'core/models/units/kael.glb',
      'locations/p.webp',
      'act1/models/units/brigand.glb',
      'models/units/mercenary.glb',
    ].sort());
    expect(unitModelPath('kael', unitPacks)).toBe('core/models/units/kael.glb');
    expect(unitModelPath('kael')).toBe('models/units/kael.glb');
  });
  it('needs no models when the manifest has none (sprite figures)', () => {
    expect(missionAssets({ units: [{ classId: 'brigand' }], ...base, models: undefined })).toEqual([`locations/${defaultPlace}.webp`]);
  });
});

const noImages = (p: string) => !p.startsWith('items/');

describe('on-demand music, sprites and item images', () => {
  const audio = ['title', 'tap', 'battle_player', 'battle_enemy', 'camp', 'worldmap'];
  it('keeps the build list and the plan in step', () => {
    expect([...BATTLE_MUSIC, ...LATER_MUSIC].sort()).toEqual([...ON_DEMAND_MUSIC].sort());
  });
  it('adds the battle music only when the manifest lists it', () => {
    expect(missionAssets({ units: [], ...base, music: audio })).toEqual(['audio/battle_enemy.mp3', 'audio/battle_player.mp3', `locations/${defaultPlace}.webp`]);
    expect(missionAssets({ units: [], ...base, music: ['title'] })).toEqual([`locations/${defaultPlace}.webp`]);
    expect(missionAssets({ units: [], ...base })).toEqual([`locations/${defaultPlace}.webp`]);
  });
  it('leaves camp and world map music to the background fetch', () => {
    expect(laterMusicAssets(audio)).toEqual(['audio/camp.mp3', 'audio/worldmap.mp3']);
    expect(laterMusicAssets(['camp'])).toEqual(['audio/camp.mp3']);
    expect(laterMusicAssets(undefined)).toEqual([]);
  });
  const sprites = { kael: { normal: true }, archer: {}, ghost: {} };
  it('needs the sprite sheet of a unit that has no model file', () => {
    expect(missionAssets({ units: [{ classId: 'archer' }, { charId: 'kael', classId: 'captain' }], ...base, sprites })).toEqual([
      `locations/${defaultPlace}.webp`,
      'models/units/kael.glb',
      'sprites/units/archer/sheet.png',
    ]);
    expect(missionAssets({ units: [{ classId: 'unknown' }], ...base, sprites })).toEqual([`locations/${defaultPlace}.webp`]);
  });
  it('takes sprite sheets (with normal map) instead of models in the 2D setting', () => {
    expect(missionAssets({ units: [{ charId: 'kael', classId: 'captain' }], ...base, sprites, figures: '2d' })).toEqual([
      `locations/${defaultPlace}.webp`,
      'sprites/units/kael/normal.png',
      'sprites/units/kael/sheet.png',
    ]);
  });
  it('lists the images of the gear the units hold', () => {
    const items = { sword: { kind: 'weapon' as const, image: 'blade' }, ring: { kind: 'accessory' as const } };
    expect(itemImages(['sword', 'ring', 'missing'], items)).toEqual(['items/blade.webp', 'items/ring.webp']);
    expect(missionAssets({ units: [{ classId: 'archer', gearItems: ['sword'] }], ...base, items })).toContain('items/blade.webp');
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
    wooden_shield: { kind: 'shield', group: 'shield' },
    travel_lute: { kind: 'accessory', group: 'lute' },
    ember_focus: { kind: 'accessory', group: 'focus' },
    vulnerary: { kind: 'consumable' },
  } as never;
  const gear = {
    weapons: { sword: { model: 'sword', hand: 'right' }, bow: { model: 'bow', hand: 'left' } },
    offHand: { shield: { model: 'shield', hand: 'left' }, lute: { model: 'lute', hand: 'left' } },
  } as never;
  const weaponModels = ['sword', 'bow', 'shield', 'axe'];

  it('maps equipped items to weapon models, off-hand included, each once', () => {
    expect(gearModels(['iron_sword', 'wooden_shield', 'iron_sword', 'vulnerary', 'ghost'], items, gear).sort()).toEqual(['shield', 'sword']);
    expect(gearModels(['travel_lute', 'ember_focus'], items, gear)).toEqual(['lute']);
  });
  it('the mission plan adds the weapon files of the units with a model', () => {
    const list = missionAssets({
      units: [{ charId: 'kael', classId: 'captain', gearItems: ['iron_sword', 'wooden_shield'] }, { classId: 'brigand', gearItems: ['iron_bow'] }, { classId: 'archer', gearItems: ['iron_bow'] }],
      ...base,
      items,
      gear,
      weaponModels,
    });
    expect(list.filter(noImages)).toEqual([`locations/${defaultPlace}.webp`, 'models/units/brigand.glb', 'models/units/kael.glb', 'models/weapons/bow.glb', 'models/weapons/shield.glb', 'models/weapons/sword.glb']);
  });
  it('a unit without a model file (sprite figure) needs no weapon, and neither does a file the manifest lacks', () => {
    expect(missionAssets({ units: [{ classId: 'archer', gearItems: ['iron_sword'] }], ...base, items, gear, weaponModels }).filter(noImages)).toEqual([`locations/${defaultPlace}.webp`]);
    expect(missionAssets({ units: [{ classId: 'brigand', gearItems: ['iron_sword'] }], ...base, items, gear, weaponModels: ['bow'] }).filter(noImages)).toEqual([`locations/${defaultPlace}.webp`, 'models/units/brigand.glb']);
    expect(missionAssets({ units: [{ classId: 'brigand', gearItems: ['iron_sword'] }], ...base }).filter(noImages)).toEqual([`locations/${defaultPlace}.webp`, 'models/units/brigand.glb']);
  });
});
