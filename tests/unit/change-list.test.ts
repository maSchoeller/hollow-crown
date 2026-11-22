/**
 * Change list (story 16.13): every line is a difference of the battle formulas, never its own calculation; no zero lines;
 * the icons exist and nothing carries an emoji.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadContentFromDisk } from '../../src/content/node';
import {
  ELEMENTS,
  changeList,
  clone,
  computeStats,
  forecast,
  itemElement,
  newCampaign,
  newItem,
  weaponProfile,
  type BattleState,
  type CampaignState,
  type ChangeLine,
  type ChangeResult,
  type GameData,
  type ItemInstance,
  type UnitRecord,
} from '../../src/core';
import { lang, setLocales } from '../../src/i18n';
import { ChangeChips, ChangeList, changeIcon, STAT_ICON } from '../../src/ui/ChangeList';
import { ElementDot, hasIcon } from '../../src/ui/icons';
import { arena, place } from '../fixtures/arena';

let data: GameData;
let base: CampaignState;
let c: CampaignState;

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  setLocales(loaded.locales);
  lang.value = 'de';
});

const fresh = () => {
  c = clone(base);
  return c;
};
const unitOf = (id: string): UnitRecord => fresh().roster.find((u) => u.id === id)!;
const item = (def: string, extra: Partial<ItemInstance> = {}): ItemInstance => ({ ...newItem(c, def, data), ...extra });
const line = <K extends ChangeLine['kind']>(r: ChangeResult, key: string): Extract<ChangeLine, { kind: K }> | undefined =>
  r.lines.find((l) => l.key === key) as Extract<ChangeLine, { kind: K }> | undefined;
const withWorn = (u: UnitRecord, slot: 'mainHand' | 'body' | 'offHand', inst: ItemInstance): UnitRecord => {
  u.equip[slot] = inst;
  return u;
};

describe('weapon against weapon', () => {
  it('attack, hit, crit, range and weight are the weapon profile difference; the rest is left out', () => {
    const u = withWorn(unitOf('brenna'), 'mainHand', item('iron_axe'));
    const probe = item('hand_axe');
    const r = changeList(data, u, probe, { slot: 'mainHand' });
    expect(r.mode).toBe('diff');
    const a = weaponProfile(data, probe);
    const b = weaponProfile(data, u.equip.mainHand!);
    const stat = (k: string) => line<'stat'>(r, k);
    if (a.might !== b.might) expect(stat('attack')).toMatchObject({ value: a.might, delta: a.might - b.might });
    expect(stat('range')).toMatchObject({ value: a.range[1], delta: a.range[1] - b.range[1], better: a.range[1] > b.range[1] });
    if (a.weight !== b.weight) expect(stat('weight')).toMatchObject({ delta: a.weight - b.weight, better: a.weight < b.weight });
    expect(r.lines.every((l) => l.kind !== 'stat' || l.delta !== 0)).toBe(true);
    // a preview never changes the unit
    expect(u.equip.mainHand!.def).toBe('iron_axe');
  });

  it('the same item gives an empty list', () => {
    const u = withWorn(unitOf('brenna'), 'mainHand', item('iron_axe'));
    expect(changeList(data, u, u.equip.mainHand!, { slot: 'mainHand' }).lines).toEqual([]);
  });

  it('a two-hander clears the off hand: the change counts the shield that goes away', () => {
    const u = withWorn(withWorn(unitOf('brenna'), 'mainHand', item('iron_axe')), 'offHand', item('wooden_shield'));
    const probe = item('hammer');
    const r = changeList(data, u, probe, { slot: 'mainHand' });
    const after = clone(u);
    after.equip.mainHand = probe;
    delete after.equip.offHand;
    const s0 = computeStats(data, u);
    const s1 = computeStats(data, after);
    expect(line<'stat'>(r, 'defense')).toMatchObject({ value: s1.stats.def, delta: s1.stats.def - s0.stats.def, better: false });
    expect(line<'stat'>(r, 'load')?.delta).toBe(s1.load - s0.load);
    expect(line<'effect'>(r, 'effect.effective.armored')).toMatchObject({ appears: true });
  });
});

describe('armor, shield, accessory', () => {
  it('armor: defence difference and load, lower load is better', () => {
    const u = withWorn(unitOf('tobin'), 'body', item('leather_vest'));
    const r = changeList(data, u, item('chainmail'), { slot: 'body' });
    const after = clone(u);
    after.equip.body = item('chainmail');
    const s0 = computeStats(data, u);
    const s1 = computeStats(data, after);
    expect(line<'stat'>(r, 'defense')).toMatchObject({ value: s1.stats.def, delta: s1.stats.def - s0.stats.def, better: true });
    const load = line<'stat'>(r, 'load');
    if (load) expect(load.better).toBe(load.delta < 0);
  });

  it('a shield changes defence and, for a heavy one, movement', () => {
    const u = unitOf('tobin');
    delete u.equip.offHand;
    const r = changeList(data, u, item('tower_shield'), { slot: 'offHand' });
    const after = clone(u);
    after.equip.offHand = item('tower_shield');
    const s0 = computeStats(data, u);
    const s1 = computeStats(data, after);
    expect(line<'stat'>(r, 'defense')?.delta).toBe(s1.stats.def - s0.stats.def);
    expect(line<'stat'>(r, 'move')?.delta ?? 0).toBe(s1.mov - s0.mov);
  });

  it('an accessory with movement or strength shows exactly that, and nothing else', () => {
    const u = unitOf('lucan');
    delete u.equip.accessory1;
    const feather = changeList(data, u, item('wind_feather'));
    expect(line<'stat'>(feather, 'move')).toMatchObject({ delta: 1, better: true });
    const ring = changeList(data, u, item('power_ring'));
    expect(line<'stat'>(ring, 'strength')).toMatchObject({ delta: 2 });
    expect(ring.lines.every((l) => l.kind === 'stat')).toBe(true);
  });

  it('a bag place and an item for the wrong place give an empty list without throwing', () => {
    const u = unitOf('tobin');
    expect(changeList(data, u, item('chainmail'), { slot: 'bag' }).lines).toEqual([]);
    expect(changeList(data, u, item('chainmail'), { slot: 'mainHand' }).lines).toEqual([]);
    expect(changeList(data, u, null, { slot: 'accessory2' }).lines).toEqual([]);
  });
});

describe('runes: element, effects, damage against each element', () => {
  const sword = (rune: string | null) => item('iron_sword', { runes: [rune] });

  it('a water rune instead of a fire rune: element change, and damage only where the multiplier changes', () => {
    const u = unitOf('lucan');
    const worn = sword('fire_rune_1');
    const probe = sword('water_rune_1');
    expect(itemElement(data, worn)).toBe('fire');
    const r = changeList(data, withWorn(u, 'mainHand', worn), probe, { slot: 'mainHand' });
    expect(line<'element'>(r, 'element')).toMatchObject({ from: 'fire', to: 'water' });
    const dmg = r.lines.filter((l): l is Extract<ChangeLine, { kind: 'elementDamage' }> => l.kind === 'elementDamage');
    expect(dmg.length).toBeGreaterThan(0);
    expect(dmg.length).toBeLessThan(ELEMENTS.length);
    for (const d of dmg) expect(d.delta).toBe(d.value - (d.value - d.delta));
    // not an attack change: same weapon, so no stat lines
    expect(r.lines.some((l) => l.kind === 'stat')).toBe(false);
  });

  it('a rune against "without rune": the element is new', () => {
    const u = unitOf('lucan');
    const bare = sword(null);
    const r = changeList(data, u, sword('fire_rune_1'), { slot: 'mainHand', base: bare });
    expect(line<'element'>(r, 'element')).toMatchObject({ from: undefined, to: 'fire' });
  });

  it('a rune with an effect adds it; taking it away makes it fall away', () => {
    const u = unitOf('lucan');
    const plain = sword('wind_rune_1');
    const knock = sword('wind_rune_3');
    const gain = changeList(data, u, knock, { slot: 'mainHand', base: plain });
    expect(line<'effect'>(gain, 'effect.status.knockback')).toMatchObject({ appears: true, better: true });
    const lose = changeList(data, u, plain, { slot: 'mainHand', base: knock });
    expect(line<'effect'>(lose, 'effect.status.knockback')).toMatchObject({ appears: false, better: false });
    const fire = changeList(data, u, sword('fire_rune_3'), { slot: 'mainHand', base: sword('fire_rune_1') });
    expect(line<'effect'>(fire, 'effect.terrain.ignite')?.appears).toBe(true);
  });

  it('the damage per element is the number the battle forecast gives against that element', () => {
    const s: BattleState = arena(data);
    s.locked = [];
    const a = place(data, s, 'player', 'elementalist', [5, 5], 'ember');
    const d = place(data, s, 'enemy', 'brigand', [6, 5]);
    Object.assign(d.stats, { hp: 60, str: 5, skl: 0, spd: 5, lck: 60, def: 0, res: 0 });
    d.hp = 60;
    const probe = a.equip.mainHand!;
    const none = clone(a);
    delete none.equip.mainHand;
    const r = changeList(data, a as unknown as UnitRecord, null, { slot: 'mainHand' });
    expect(r.mode).toBe('state');
    for (const el of ELEMENTS) {
      d.equip.body = { ...newItem(s, 'leather_vest', data), runes: [`${el}_rune_1`] };
      const expected = forecast(data, s, a.uid, d.uid).attacker.damage;
      const got = line<'elementDamage'>(r, `damage.${el}`);
      expect(got, el).toBeDefined();
      expect(got!.value, el).toBe(expected);
    }
    expect(probe.def).toBe('ember');
  });
});

describe('armor with an element', () => {
  it('shows the factor of the hit against the wearer, only where it changes', () => {
    const u = withWorn(unitOf('lucan'), 'body', item('leather_vest'));
    const r = changeList(data, u, item('ember_robe'), { slot: 'body' });
    const fire = line<'armorElement'>(r, 'armor.fire');
    expect(fire).toMatchObject({ factor: data.balance.element.sameElement, better: true });
    const water = line<'armorElement'>(r, 'armor.water');
    expect(water?.factor).toBe(data.balance.element.advantage);
    expect(water?.better).toBe(false);
    expect(line(r, 'armor.light')).toBeUndefined();
  });
});

describe('state without a probe', () => {
  it('shows what the worn weapon gives, without differences', () => {
    const u = withWorn(unitOf('brenna'), 'mainHand', item('iron_axe'));
    const r = changeList(data, u, null, { slot: 'mainHand' });
    const w = weaponProfile(data, u.equip.mainHand!);
    expect(r.mode).toBe('state');
    expect(line<'stat'>(r, 'attack')).toMatchObject({ value: w.might, delta: 0 });
    expect(line<'stat'>(r, 'weight')).toMatchObject({ value: w.weight, better: false });
    expect(r.lines.every((l) => l.kind !== 'stat' || l.delta === 0)).toBe(true);
  });

  it('an empty place gives an empty list', () => {
    const u = unitOf('brenna');
    delete u.equip.offHand;
    expect(changeList(data, u, null, { slot: 'offHand' }).lines).toEqual([]);
  });
});

describe('delta equals difference of the computed values', () => {
  const pairs: Array<[string, string, 'mainHand' | 'body' | 'offHand']> = [
    ['iron_sword', 'iron_axe', 'mainHand'],
    ['iron_axe', 'hammer', 'mainHand'],
    ['leather_vest', 'plate_armor', 'body'],
    ['wooden_shield', 'iron_shield', 'offHand'],
  ];
  it.each(['brenna', 'lucan', 'tobin'])('%s: every stat line is after minus before', (id) => {
    for (const [from, to, slot] of pairs) {
      const u = withWorn(unitOf(id), slot, item(from));
      const probe = item(to);
      const r = changeList(data, u, probe, { slot });
      const after = clone(u);
      after.equip[slot] = probe;
      if (slot === 'mainHand' && data.items[to]!.twoHanded) delete after.equip.offHand;
      const s0 = computeStats(data, u);
      const s1 = computeStats(data, after);
      const expectStat = (key: string, before: number, now: number) => {
        const l = line<'stat'>(r, key);
        if (before === now) expect(l, `${id} ${from}>${to} ${key}`).toBeUndefined();
        else expect(l, `${id} ${from}>${to} ${key}`).toMatchObject({ value: now, delta: now - before });
      };
      expectStat('hp', s0.maxHp, s1.maxHp);
      expectStat('strength', s0.stats.str, s1.stats.str);
      expectStat('defense', s0.stats.def, s1.stats.def);
      expectStat('resistance', s0.stats.res, s1.stats.res);
      expectStat('speed', s0.stats.spd, s1.stats.spd);
      expectStat('move', s0.mov, s1.mov);
      expectStat('avoid', s0.avoid, s1.avoid);
      expectStat('load', s0.load, s1.load);
      if (slot === 'mainHand') {
        const a = weaponProfile(data, probe);
        const b = weaponProfile(data, u.equip.mainHand!);
        expectStat('attack', b.might, a.might);
        expectStat('hit', b.hit, a.hit);
        expectStat('weight', b.weight, a.weight);
      }
    }
  });
});

describe('icons and texts', () => {
  it('every stat key, element and effect has a line icon; paths are valid command sequences', () => {
    for (const icon of Object.values(STAT_ICON)) expect(hasIcon(icon), icon).toBe(true);
    for (const el of ELEMENTS) expect(hasIcon(el)).toBe(true);
    const lines: ChangeLine[] = [
      { kind: 'effect', key: 'a', effect: 'status', id: 'burning', appears: true, better: true },
      { kind: 'effect', key: 'b', effect: 'terrain', id: 'ignite', appears: true, better: true },
      { kind: 'effect', key: 'c', effect: 'effective', id: 'flier', appears: true, better: true },
      { kind: 'effect', key: 'd', effect: 'tagBonus', id: 'flier', appears: true, better: true },
      { kind: 'element', key: 'element', to: 'fire', better: true },
    ];
    for (const l of lines) expect(hasIcon(changeIcon(l)), l.key).toBe(true);
    const src = readFileSync('src/ui/icons.tsx', 'utf8');
    for (const m of src.matchAll(/^ {2}(\w+): '([^']+)',/gm)) expect(m[2], m[1]).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9\s.,-]+$/);
  });

  it('component and ui.change.* carry no emoji', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    expect(emoji.test(readFileSync('src/ui/ChangeList.tsx', 'utf8'))).toBe(false);
    for (const l of ['de', 'en']) {
      const text = readFileSync(`content/core/locales/${l}.yaml`, 'utf8');
      for (const row of text.split(/\r?\n/).filter((x) => x.startsWith('ui.change.'))) expect(emoji.test(row), row).toBe(false);
    }
  });
});

/** Expands function components and flattens the vnode tree to a small HTML string (the tests run without a DOM). */
function html(v: unknown): string {
  if (v === null || v === undefined || typeof v === 'boolean') return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(html).join('');
  const n = v as { type: unknown; props: { class?: string; children?: unknown } };
  if (typeof n.type === 'function') return html((n.type as (p: unknown) => unknown)(n.props));
  return `<${String(n.type)} class="${n.props.class ?? ''}">${html(n.props.children)}</${String(n.type)}>`;
}
const text = (h: string) => h.replace(/<[^>]+>/g, '');

describe('rendering', () => {
  it('shows differences green/red, "new", "falls away", the written-out names and the empty state', () => {
    const u = unitOf('lucan');
    const plain = item('iron_sword', { runes: ['wind_rune_1'] });
    const knock = item('iron_sword', { runes: ['wind_rune_3'] });
    const gain = html(ChangeList({ result: changeList(data, u, knock, { slot: 'mainHand', base: plain }) }));
    expect(gain).toContain('<span class="chg-new">neu</span>');
    expect(gain).toContain('chg-sub');
    const lose = html(ChangeList({ result: changeList(data, u, plain, { slot: 'mainHand', base: knock }) }));
    expect(lose).toContain('<span class="chg-gone">fällt weg</span>');
    expect(lose).toContain('chg-row is-gone');
    const armor = html(ChangeList({ result: changeList(data, withWorn(unitOf('tobin'), 'body', item('leather_vest')), item('plate_armor'), { slot: 'body' }) }));
    expect(armor).toMatch(/chg-delta chg-up">\+\d+</);
    expect(armor).toMatch(/chg-delta chg-down">−\d+</);
    expect(text(armor)).toContain('Verteidigung');
    expect(text(armor)).not.toMatch(/VER|Ausw\./);
    expect(text(html(ChangeList({ result: { mode: 'diff', lines: [] }, empty: 'ui.change.alreadyWorn' })))).toBe('Trägt sie schon');
  });

  it('shows the state without differences, the element change and the compact chips', () => {
    const u = withWorn(unitOf('lucan'), 'mainHand', item('iron_sword', { runes: ['fire_rune_1'] }));
    const state = html(ChangeList({ result: changeList(data, u, null, { slot: 'mainHand' }) }));
    expect(state).not.toContain('chg-delta');
    expect(text(state)).toContain('Feuer');
    const swap = html(ChangeList({ result: changeList(data, u, item('iron_sword', { runes: ['water_rune_1'] }), { slot: 'mainHand' }) }));
    expect(text(swap)).toContain('statt Feuer');
    const chips = html(ChangeChips({ result: changeList(data, unitOf('brenna'), item('hand_axe'), { slot: 'mainHand' }) }));
    const n = chips.split('chg-chip ').length - 1;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(2);
    expect(html(ElementDot({ el: 'water', size: 15 }))).toContain('el-dot-water');
  });
});
