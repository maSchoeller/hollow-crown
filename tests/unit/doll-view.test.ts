/**
 * The figure sheet as a dress-up doll (story 16.15): the six places, the rune dot, the performance values (the combat forecast's own
 * formulas), the strongest stats, the element chips, the bag and its commands, the stage's numbers and yaw-only motion, the texts.
 * Nothing here needs a model file (in CI they are Git LFS pointers) or a canvas.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  forecast,
  newCampaign,
  newItem,
  unitPerformance,
  type CampaignState,
  type GameData,
  type ItemInstance,
  type UnitRecord,
} from '../../src/core';
import { lang, setLocales, t } from '../../src/i18n';
import { StageMotion } from '../../src/render/items/stageMath';
import { STAT_ICON } from '../../src/ui/ChangeList';
import { hasIcon } from '../../src/ui/icons';
import {
  bagCandidates,
  bagEquipCommand,
  bagPlaces,
  bagReturnCommand,
  convoyIsFull,
  dollSlots,
  dressKey,
  elementChips,
  keyRing,
  LEFT_SLOTS,
  performanceCells,
  pickedItem,
  RIGHT_SLOTS,
  runeDotOf,
  strongestStats,
} from '../../src/app/screens/dollViewModel';
import { arena, place } from '../fixtures/arena';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];
let c: CampaignState;
let unit: UnitRecord;
const item = (id: string, runes: Array<string | null> = []): ItemInstance => ({ ...newItem(c, id, data), runes });

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
  setLocales(locales);
  lang.value = 'de';
});
const fresh = () => {
  c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  unit = c.roster[0]!;
  unit.equip = {};
  unit.bag = [];
};

describe('the six places and the rune dot', () => {
  it('left main hand, head, body; right off hand and two accessories; the dot only with a rune', () => {
    fresh();
    unit.equip.mainHand = item('iron_axe', ['fire_rune_2']);
    unit.equip.offHand = item('iron_shield');
    const left = dollSlots(data, unit, LEFT_SLOTS);
    const right = dollSlots(data, unit, RIGHT_SLOTS);
    expect(left.map((s) => s.slot)).toEqual(['mainHand', 'head', 'body']);
    expect(right.map((s) => s.slot)).toEqual(['offHand', 'accessory1', 'accessory2']);
    expect(left[0]!.item?.def).toBe('iron_axe');
    expect(left[0]!.rune?.element).toBe('fire');
    expect(left[1]!.item).toBeUndefined();
    expect(left[1]!.rune).toBeNull();
    expect(right[0]!.item?.def).toBe('iron_shield');
    expect(right[0]!.rune).toBeNull();
    expect(runeDotOf(data, item('iron_shield', ['wind_rune_2']))?.element).toBe('wind');
  });

  it('the stage rebuilds when the model or the runes change, not for other things', () => {
    fresh();
    unit.equip.mainHand = item('iron_axe');
    const a = dressKey(unit);
    unit.bag.push(item('vulnerary'));
    expect(dressKey(unit)).toBe(a);
    unit.equip.mainHand = item('iron_axe', ['fire_rune_1']);
    expect(dressKey(unit)).not.toBe(a);
  });
});

describe('performance grid', () => {
  it('has the eight values with an icon each, and none for a figure without a weapon', () => {
    fresh();
    const bare = performanceCells(data, unit);
    expect(bare.map((p) => p.key)).toEqual(['hp', 'attack', 'hit', 'crit', 'avoid', 'defense', 'move', 'range']);
    for (const p of bare) expect(hasIcon(STAT_ICON[p.key]), p.key).toBe(true);
    expect(bare.find((p) => p.key === 'attack')!.none).toBe(true);
    unit.equip.mainHand = item('iron_axe');
    const armed = performanceCells(data, unit);
    expect(armed.find((p) => p.key === 'attack')!.none).toBe(false);
    expect(armed.find((p) => p.key === 'range')!.value).toMatch(/^\d(–\d)?$/);
  });

  it('shows what the combat forecast says against a neutral enemy (same formulas, no copy)', () => {
    for (const [cls, weapon] of [
      ['vanguard', 'iron_sword'],
      ['vanguard', 'iron_axe'],
      ['elementalist', 'ember'],
    ] as const) {
      const s = arena(data);
      const a = place(data, s, 'player', cls, [5, 5], weapon);
      const d = place(data, s, 'enemy', 'vanguard', [6, 5]);
      Object.assign(d.stats, { hp: 60, str: 0, skl: 0, spd: 0, lck: 0, def: 0, res: 0 });
      d.hp = 60;
      d.equip = {};
      const f = forecast(data, s, a.uid, d.uid).attacker;
      const p = unitPerformance(data, a as unknown as UnitRecord);
      expect(p.attack, `${cls} ${weapon} damage`).toBe(f.damage);
      expect(p.hit, `${cls} ${weapon} hit`).toBe(f.hit);
      expect(p.crit, `${cls} ${weapon} crit`).toBe(f.crit);
    }
  });
});

describe('strongest stats and element chips', () => {
  it('marks the three highest, ties by order, never a zero', () => {
    const s = { hp: 30, str: 9, mag: 2, skl: 9, spd: 4, lck: 0, def: 7, res: 0 };
    expect(strongestStats(s)).toEqual(['str', 'skl', 'def']);
    expect(strongestStats({ ...s, str: 0, skl: 0, def: 0, mag: 0, spd: 0 })).toEqual([]);
  });

  it('reads weapon, shield and armour element from the combat formulas', () => {
    fresh();
    unit.equip.mainHand = item('iron_axe', ['fire_rune_2']);
    unit.equip.offHand = item('iron_shield', ['wind_rune_2']);
    unit.equip.body = item('leather_vest', ['water_rune_1']);
    const chips = elementChips(data, unit);
    expect(chips.map((x) => x.source)).toEqual(['weapon', 'shield', 'armor']);
    expect(chips[0]).toMatchObject({ element: 'fire', tier: 2 });
    expect(chips[1]).toMatchObject({ element: 'wind' });
    expect(chips[2]!.element).toBe('water');
    fresh();
    expect(elementChips(data, unit).map((x) => x.source)).toEqual(['armor']);
  });
});

describe('the bag', () => {
  it('has the places of the balance; keys sit apart and are not places', () => {
    fresh();
    unit.bag.push(item('vulnerary'), item('door_key'));
    const places = bagPlaces(data, unit);
    expect(places).toHaveLength(data.balance.bag.size);
    expect(places[0]!.item?.def).toBe('vulnerary');
    expect(places[1]!.item).toBeUndefined();
    expect(keyRing(data, unit).map((k) => k.def)).toEqual(['door_key']);
    expect(pickedItem(data, unit, { kind: 'bag', index: 0 })?.def).toBe('vulnerary');
    expect(pickedItem(data, unit, { kind: 'bag', index: 2 })).toBeUndefined();
  });

  it('an empty place offers the convoy; a tap equips with slot bag; a full place returns its item', () => {
    fresh();
    c.convoy.push(item('vulnerary'));
    const cands = bagCandidates(data, c, unit);
    const pick = cands.find((x) => !x.error)!;
    expect(pick).toBeDefined();
    const cmd = bagEquipCommand(unit, pick.inst.uid);
    expect(cmd).toEqual({ type: 'equip', unit: unit.id, uid: pick.inst.uid, slot: 'bag' });
    const after = applyCampaign(data, c, cmd).campaign;
    const me = after.roster.find((u) => u.id === unit.id)!;
    expect(bagPlaces(data, me)[0]!.item?.uid).toBe(pick.inst.uid);
    expect(after.convoy.some((i) => i.uid === pick.inst.uid)).toBe(false);
    const back = bagReturnCommand(pick.inst.uid);
    expect(back).toEqual({ type: 'unequip', uid: pick.inst.uid });
    const again = applyCampaign(data, after, back).campaign;
    expect(bagPlaces(data, again.roster.find((u) => u.id === unit.id)!)[0]!.item).toBeUndefined();
    expect(again.convoy.some((i) => i.uid === pick.inst.uid)).toBe(true);
  });

  it('a full convoy dims the way back', () => {
    fresh();
    expect(convoyIsFull(data, c)).toBe(false);
    while (c.convoy.length < data.balance.economy.convoySize) c.convoy.push(item('vulnerary'));
    expect(convoyIsFull(data, c)).toBe(true);
  });
});

describe('the unit stage numbers and motion', () => {
  it('render.yaml loads with its values in range', () => {
    const d = data.render.unitStage;
    expect(d.fov).toBeGreaterThan(5);
    expect(d.margin).toBeGreaterThanOrEqual(1);
    expect(d.aimFraction).toBeGreaterThan(0);
    expect(d.aimFraction).toBeLessThan(1);
    expect(d.spinDegPerSec).toBe(0);
    expect(d.dragDegPerPx).toBeGreaterThan(0);
  });

  it('turns about the vertical axis only: the pitch never moves and a quiet stage is not busy', () => {
    const d = data.render.unitStage;
    const m = new StageMotion({ ...d, startPitchDeg: 0, tiltLimitDeg: 0 }, d.startYawDeg);
    expect(m.busy()).toBe(false);
    m.press();
    m.drag(100, 500, 16);
    expect(m.yaw).toBeCloseTo(((d.startYawDeg + 100 * d.dragDegPerPx) * Math.PI) / 180, 5);
    expect(m.pitch).toBe(0);
    m.release();
    for (let i = 0; i < 400; i++) m.step(0.05);
    expect(m.busy()).toBe(false);
    m.reset();
    for (let i = 0; i < 60; i++) m.step(0.05);
    // the reset turns the short way round: the same angle, maybe a full turn away
    expect(Math.cos(m.yaw - (d.startYawDeg * Math.PI) / 180)).toBeCloseTo(1, 4);
  });
});

describe('texts', () => {
  const keys = (l: Record<string, string> | undefined) => Object.keys(l ?? {}).filter((k) => k.startsWith('ui.doll.'));
  it('every ui.doll key exists in German and English, without emojis', () => {
    const de = keys(locales.de);
    expect(de.length).toBeGreaterThan(20);
    expect(keys(locales.en).sort()).toEqual([...de].sort());
    for (const k of de) for (const l of ['de', 'en'] as const) expect(locales[l]?.[k], `${l} ${k}`).not.toMatch(/\p{Extended_Pictographic}/u);
    lang.value = 'de';
    expect(t('ui.doll.swap')).toBe('Wechseln');
  });
});
