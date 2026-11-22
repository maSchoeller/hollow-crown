/**
 * Story 16.17: the merchant's list for a person (groups, chips, what cannot be worn, convoy mode with heads), the person bar
 * and that "For whom?" is gone. Function components are expanded by hand (no DOM here).
 */
import { readFileSync } from 'node:fs';
import type { ComponentChild, VNode } from 'preact';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { CONVOY_SHOPPER, MERCHANT_GROUPS, clone, merchantList, newCampaign, newItem, type CampaignState, type GameData } from '../../src/core';
import { PersonBar } from '../../src/app/screens/PersonBar';
import { setLocales } from '../../src/i18n';

let data: GameData;
let base: CampaignState;
beforeAll(() => {
  const c = loadContentFromDisk();
  data = c.data;
  setLocales(c.locales);
  base = newCampaign(data, 5, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  base.gold = 5000;
});

/** the `button` elements of a tree (function components are not expanded), in order, with their pressed state */
function buttons(n: ComponentChild): Array<{ pressed: boolean }> {
  const out: Array<{ pressed: boolean }> = [];
  const walk = (x: ComponentChild): void => {
    if (x === null || x === undefined || typeof x === 'boolean' || typeof x === 'string' || typeof x === 'number') return;
    if (Array.isArray(x)) return x.forEach(walk);
    const v = x as VNode<Record<string, unknown>>;
    if (v.type === 'button') out.push({ pressed: v.props['aria-pressed'] === true });
    walk(v.props.children as ComponentChild);
  };
  walk(n);
  return out;
}

describe('merchantList for a person', () => {
  it('groups what the figure can wear by place, in the fixed order, with a plan per row', () => {
    const c = clone(base);
    const u = c.roster[0]!;
    u.classId = 'vanguard';
    const list = merchantList(data, c, u.id);
    expect(list.mode).toBe('unit');
    const order = list.groups.map((g) => MERCHANT_GROUPS.indexOf(g.group));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (const g of list.groups) for (const r of g.rows) expect(r.plan?.slot).toBeTruthy();
    const weapons = list.groups.find((g) => g.group === 'weapon')!.rows;
    expect(weapons.length).toBeGreaterThan(0);
  });

  it('puts what the class cannot hold into the collapsed part, with the equip code', () => {
    const c = clone(base);
    const u = c.roster[0]!;
    u.classId = 'vanguard';
    const list = merchantList(data, c, u.id);
    expect(list.cannot.some((x) => x.error === 'weapon_group')).toBe(true);
    const listed = new Set(list.groups.flatMap((g) => g.rows.map((r) => r.key)));
    for (const x of list.cannot) expect(listed.has(x.row.key)).toBe(false);
  });

  it('gives chips (a change list) against the worn item and "same" when it is worn', () => {
    const c = clone(base);
    const u = c.roster[0]!;
    u.classId = 'vanguard';
    u.equip = {};
    const bare = merchantList(data, c, u.id).groups.find((g) => g.group === 'weapon')!.rows[0]!;
    expect(bare.change!.lines.length).toBeGreaterThan(0);
    u.equip.mainHand = newItem(c, bare.inst.def, data);
    const worn = merchantList(data, c, u.id).groups.find((g) => g.group === 'weapon')!.rows.find((r) => r.inst.def === bare.inst.def)!;
    expect(worn.same).toBe(true);
    expect(worn.change!.lines).toHaveLength(0);
  });

  it('an unknown person counts as the first one', () => {
    expect(merchantList(data, base, 'nobody').unit?.id).toBe(base.roster[0]!.id);
  });
});

describe('merchantList for the convoy', () => {
  it('has no plan and no chips, but the figures that can hold the item', () => {
    const list = merchantList(data, base, CONVOY_SHOPPER);
    expect(list.mode).toBe('convoy');
    expect(list.cannot).toHaveLength(0);
    const rows = list.groups.flatMap((g) => g.rows);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.plan).toBeNull();
      expect(r.change).toBeNull();
    }
    expect(rows.some((r) => r.users.length > 0)).toBe(true);
  });
});

describe('person bar and the old "For whom?"', () => {
  it('shows the troop with the convoy last; the chosen medallion is pressed', () => {
    const u = base.roster[0]!;
    const bar = buttons(PersonBar({ units: base.roster, value: u.id, onChange: () => undefined, convoy: { count: 2, max: 20 } }));
    expect(bar).toHaveLength(base.roster.length + 1);
    expect(bar[0]!.pressed).toBe(true);
    expect(bar[bar.length - 1]!.pressed).toBe(false);
    const onConvoy = buttons(PersonBar({ units: base.roster, value: 'convoy', onChange: () => undefined, convoy: { count: 2, max: 20 } }));
    expect(onConvoy.map((b) => b.pressed)).toEqual([...base.roster.map(() => false), true]);
  });

  it('the key and the component Who are gone', () => {
    for (const f of ['de', 'en']) {
      const yaml = readFileSync(`content/core/locales/${f}.yaml`, 'utf8');
      expect(yaml).not.toContain('ui.room.merchant.who');
      expect(yaml).not.toContain('ui.room.merchant.nobody');
    }
    expect(readFileSync('src/app/screens/Rooms.tsx', 'utf8')).not.toContain('function Who');
    expect(readFileSync('src/app/screens/Merchant.tsx', 'utf8')).not.toContain('merchant.who');
  });
});
