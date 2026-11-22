/**
 * Weapon view and item stage (story 16.14): the stage's motion and fit (pure part), the model a piece shows, the rune's change list
 * against "no rune", the chronicle line, the keys to the rooms, the cache hold of the stage and the texts.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadContentFromDisk } from '../../src/content/node';
import { newCampaign, newItem, weaponProfile, type CampaignState, type GameData, type ItemInstance } from '../../src/core';
import { lang, setLocales, t } from '../../src/i18n';
import { RefCache } from '../../src/render/shared/cache';
import { fitDistance, StageMotion, uprightAngle } from '../../src/render/items/stageMath';
import { chronicleLine, epithetOf, hasRune, nameOfId, roomAccess, runeChange, stageRunes, valuesOf, viewKeys, weaponStageModel, withoutRunes } from '../../src/app/screens/weaponViewModel';

let data: GameData;
let c: CampaignState;
const item = (id: string, patch: Partial<ItemInstance> = {}): ItemInstance => ({ ...newItem(c, id, data), ...patch });

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  setLocales(loaded.locales);
  lang.value = 'de';
  c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

describe('stage motion', () => {
  const def = () => loadContentFromDisk().data.render.itemStage;

  it('spins until the player grabs the model, then stays', () => {
    const m = new StageMotion(def(), 0);
    expect(m.busy()).toBe(true);
    m.step(1);
    expect(m.yaw).toBeGreaterThan(0);
    m.press();
    m.release();
    const yaw = m.yaw;
    m.step(1);
    expect(m.yaw).toBe(yaw);
    expect(m.busy()).toBe(false);
  });

  it('a drag turns by the pixels, the tilt stops at the limit, a fling dies out and the stage falls idle', () => {
    const d = def();
    const m = new StageMotion(d, 0);
    m.press();
    m.drag(100, 0, 16);
    expect(m.yaw).toBeCloseTo((100 * d.dragDegPerPx * Math.PI) / 180, 5);
    m.drag(0, 100000, 16);
    expect(m.pitch).toBeCloseTo((d.tiltLimitDeg * Math.PI) / 180, 5);
    m.drag(0, -100000, 16);
    expect(m.pitch).toBeCloseTo(-(d.tiltLimitDeg * Math.PI) / 180, 5);
    m.drag(60, 0, 16);
    m.release();
    expect(m.busy()).toBe(true);
    for (let i = 0; i < 600 && m.busy(); i++) m.step(1 / 30);
    expect(m.busy()).toBe(false);
  });

  it('a reset glides back to the start pose the short way and then rests', () => {
    const m = new StageMotion(def(), 90);
    m.press();
    m.drag(2000, 300, 16);
    m.release();
    m.reset();
    for (let i = 0; i < 100; i++) m.step(0.05);
    expect(Math.cos(m.yaw)).toBeCloseTo(Math.cos(Math.PI / 2), 3);
    expect(Math.sin(m.yaw)).toBeCloseTo(1, 3);
    expect(m.pitch).toBeCloseTo((def().startPitchDeg * Math.PI) / 180, 5);
    expect(m.busy()).toBe(false);
  });

  it('fits the model into the narrower field of view and stands a tilted long axis up', () => {
    const wide = fitDistance(1, 30, 2, 1);
    const narrow = fitDistance(1, 30, 0.5, 1);
    expect(narrow).toBeGreaterThan(wide);
    expect(fitDistance(1, 30, 2, 1.5)).toBeCloseTo(wide * 1.5, 6);
    // a bar along (y, z) = (cos 40 deg, sin 40 deg), the long end at +: rotating by the result lands it on +Y
    const a = (40 * Math.PI) / 180;
    const pts: number[] = [];
    for (let i = -10; i <= 20; i++) pts.push((i / 10) * Math.cos(a), (i / 10) * Math.sin(a));
    const r = uprightAngle(pts);
    expect(Math.cos(a + r)).toBeCloseTo(1, 3);
    expect(Math.sin(a + r)).toBeCloseTo(0, 3);
    expect(uprightAngle([0, 0, 1, 1])).toBe(0);
  });
});

describe('model of a piece', () => {
  it('weapons and shields with a v2 model get it, everything else shows its image', () => {
    expect(weaponStageModel(data, item('iron_axe'))).toBe('models/weapons-v2/axe.glb');
    expect(weaponStageModel(data, item('steel_sword'))).toBe('models/weapons-v2/sword.glb');
    expect(weaponStageModel(data, item('iron_shield'))).toBe('models/weapons-v2/shield.glb');
    expect(weaponStageModel(data, item('plate_armor'))).toBeNull();
    expect(weaponStageModel(data, item('vulnerary'))).toBeNull();
    const bow = Object.values(data.items).find((d) => d.weaponType === 'bow');
    if (bow) expect(weaponStageModel(data, item(bow.id))).toBeNull();
  });

  it('every model the view names exists in the art folder', () => {
    for (const id of ['iron_axe', 'steel_sword', 'iron_shield']) {
      const path = weaponStageModel(data, item(id))!;
      expect(readFileSync(`art/${path}`).byteLength).toBeGreaterThan(1000);
    }
  });

  it('puts the element rune in the large setting and a second rune in the small one', () => {
    const hammer = item('hammer', { runes: ['fire_rune_2', 'edge_rune'] });
    const r = stageRunes(data, hammer);
    expect(r.main).toMatchObject({ id: 'fire_rune_2', element: 'fire', tier: 2 });
    expect(r.small).toMatchObject({ id: 'edge_rune', element: 'utility' });
    expect(r.smallSlot).toBe(true);
    const one = stageRunes(data, item('iron_axe', { runes: ['wind_rune_1'] }));
    expect(one.main?.id).toBe('wind_rune_1');
    expect(one.smallSlot).toBe(false);
  });
});

describe('values and the rune change', () => {
  const unit = () => c.roster[0]!;

  it('lists the weapon values of the battle formulas', () => {
    const axe = item('iron_axe');
    const lines = valuesOf(data, unit(), axe, 'mainHand').lines;
    const wp = weaponProfile(data, axe);
    const val = (key: string) => lines.find((l) => l.kind === 'stat' && l.key === key);
    expect(val('attack')).toMatchObject({ value: wp.might });
    expect(val('hit')).toMatchObject({ value: wp.hit });
    expect(val('range')).toMatchObject({ value: wp.range[1] });
    expect(val('weight')).toMatchObject({ value: wp.weight });
  });

  it('shows the rune as a change against the same piece without it, matching the profile difference', () => {
    const plain = item('iron_axe');
    const fire = item('iron_axe', { runes: ['fire_rune_1'] });
    expect(withoutRunes(fire).runes).toEqual([null]);
    expect(hasRune(fire)).toBe(true);
    expect(hasRune(plain)).toBe(false);
    const list = runeChange(data, unit(), fire, 'mainHand');
    expect(list.mode).toBe('diff');
    const el = list.lines.find((l) => l.kind === 'element');
    expect(el).toMatchObject({ to: 'fire' });
    expect(el && 'from' in el ? el.from : undefined).toBeUndefined();
    // the same rune as a utility rune changes numbers by the profile difference, nothing else
    const edge = item('hammer', { runes: ['edge_rune'] });
    const crit = runeChange(data, unit(), edge, 'mainHand').lines.find((l) => l.kind === 'stat' && l.key === 'crit');
    const dc = weaponProfile(data, edge).crit - weaponProfile(data, withoutRunes(edge)).crit;
    expect(crit && crit.kind === 'stat' ? crit.delta : 0).toBe(dc);
    expect(dc).toBeGreaterThan(0);
    // a piece with a rune that changes nothing gives an empty list, a piece without a rune too
    expect(runeChange(data, unit(), plain, 'mainHand').lines).toEqual([]);
  });
});

describe('chronicle line', () => {
  it('names kills and epithet, drops what is empty and stays away from a weapon without a chronicle', () => {
    const t0 = (k: string, p?: Record<string, string | number>) => t(k, p);
    expect(chronicleLine(data, c, t0, item('iron_axe'))).toBeUndefined();
    const kills = chronicleLine(data, c, t0, item('iron_axe', { kills: 3 }))!;
    expect(kills).toBe('3 besiegte Gegner');
    const holder = item('iron_axe', { kills: 12, epithet: { kind: 'holder', by: c.roster[0]!.id, word: 0 } });
    const line = chronicleLine(data, c, t0, holder)!;
    expect(line).toContain('12 besiegte Gegner');
    expect(line).toContain(' · ');
    expect(line).toContain(epithetOf(data, c, t0, holder)!);
    expect(line).toContain('Rhen');
    const shield = item('iron_shield', { kills: 5 });
    expect(chronicleLine(data, c, t0, shield)).toBeUndefined();
    lang.value = 'en';
    expect(chronicleLine(data, c, t, item('iron_axe', { kills: 3 }))).toBe('3 foes felled');
    lang.value = 'de';
  });

  it('names a unit by the company member first', () => {
    expect(nameOfId(c, t, c.roster[0]!.id)).toBe('Rhen');
  });
});

describe('keys and rooms', () => {
  it('shows Enchant for a piece with rune settings and Upgrade for an upgradable one', () => {
    expect(viewKeys(data, item('iron_axe'))).toEqual({ enchant: true, upgrade: true });
    expect(viewKeys(data, item('vulnerary')).upgrade).toBe(false);
  });

  it('finds the home room of a function and says whether it is open', () => {
    const castle = { ...c, home: { kind: 'castle' as const, rooms: {} }, act: 2 } as CampaignState;
    const ench = roomAccess(data, castle, 'enchanter');
    expect(ench?.id).toBe('enchanter');
    const camp = { ...c, home: { kind: 'camp' as const, rooms: {} } } as CampaignState;
    expect(roomAccess(data, camp, 'enchanter')).toBeNull();
  });
});

describe('cache hold of the stage', () => {
  it('a holder that releases gives the entries back; a second view loads nothing again', async () => {
    let loads = 0;
    const cache = new RefCache<string>(
      async (k) => {
        loads++;
        return k;
      },
      () => undefined,
      0,
    );
    const board = {};
    const stage = {};
    await cache.use('-:models/weapons-v2/axe.glb', board);
    await cache.use('-:models/weapons-v2/axe.glb', stage);
    await cache.use('-:models/runes-v2/fire_rune_2.glb', stage);
    expect(loads).toBe(2);
    expect(cache.refs('-:models/weapons-v2/axe.glb')).toBe(2);
    cache.release(stage);
    expect(cache.refs('-:models/weapons-v2/axe.glb')).toBe(1);
    expect(cache.refs('-:models/runes-v2/fire_rune_2.glb') ?? 0).toBe(0);
  });
});

describe('texts', () => {
  it('has every weapon view key in German and English, without emoji', () => {
    const keys = readFileSync('content/core/locales/de.yaml', 'utf8')
      .split(/\r?\n/)
      .map((l) => /^(ui\.weaponView\.[\w.]+):/.exec(l)?.[1])
      .filter((k): k is string => !!k);
    expect(keys.length).toBeGreaterThan(15);
    const en = readFileSync('content/core/locales/en.yaml', 'utf8');
    for (const k of keys) {
      expect(en, k).toContain(`${k}:`);
      for (const l of ['de', 'en'] as const) {
        lang.value = l;
        expect(t(k, { n: 1, item: 'x', rune: 'x', tier: 1, name: 'x', epithet: 'x' }), `${l} ${k}`).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
    lang.value = 'de';
  });
});
