/** Growing strength of the lieutenants (story 3.4): level from the company, expected values, tiered weapons, grudge skills. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { Locales } from '../../src/content/load';
import { validateContent } from '../../src/content/validate';
import { roundDiv } from '../../src/core/battle/create';
import {
  activeSkillIds,
  autoplay,
  startBattle,
  createBattle,
  effectiveLevel,
  genericStats,
  lieutenantItems,
  lieutenantLevel,
  lieutenantSkills,
  newCampaign,
  tierUpItem,
  wantedView,
  type BattleUnit,
  type CampaignState,
  type GameData,
  type MapDef,
  type UnitRecord,
} from '../../src/core';

let data: GameData;
let locales: Locales;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const fresh = (): CampaignState => newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

const proClass = () => Object.values(data.classes).find((c) => c.tier === 'pro')!.id;
const baseClass = () => Object.values(data.classes).find((c) => c.tier === 'base')!.id;

/** A company of units with the given levels (a number, or [level, 'pro']). */
function company(levels: Array<number | [number, 'pro']>): Pick<CampaignState, 'roster'> {
  const tpl = fresh().roster[0]!;
  return {
    roster: levels.map((l, i): UnitRecord => {
      const [level, pro] = typeof l === 'number' ? [l, false] : [l[0], true];
      return { ...clone(tpl), id: `u${i}`, level, classId: pro ? proClass() : baseClass() };
    }),
  };
}

describe('lieutenantLevel', () => {
  it('takes the average of the strongest six, plus the grudge', () => {
    expect(lieutenantLevel(data, company([5]), 0)).toBe(5);
    expect(lieutenantLevel(data, company([3, 3, 3]), 0)).toBe(3);
    expect(lieutenantLevel(data, company([4, 4, 4, 4, 4, 4]), 0)).toBe(4);
    // nine units: only the best six count (10, 9, 8, 7, 6, 5 -> 45 / 6 = 7.5 -> 8)
    expect(lieutenantLevel(data, company([1, 2, 3, 10, 9, 8, 7, 6, 5]), 0)).toBe(8);
    expect(lieutenantLevel(data, company([6, 6, 6, 6, 6, 6, 1, 1, 1]), 0)).toBe(6);
  });

  it('counts a pro class 15 levels higher', () => {
    expect(effectiveLevel(data, company([[2, 'pro']]).roster[0]!)).toBe(2 + data.balance.experience.advancedLevelOffset);
    expect(lieutenantLevel(data, company([[2, 'pro']]), 0)).toBe(17);
    // two units: (17 + 3) / 2 = 10
    expect(lieutenantLevel(data, company([[2, 'pro'], 3]), 0)).toBe(10);
  });

  it('rounds x.5 up and everything else to the nearest', () => {
    expect(lieutenantLevel(data, company([3, 4]), 0)).toBe(4); // 3.5
    expect(lieutenantLevel(data, company([3, 3, 4]), 0)).toBe(3); // 3.33
    expect(lieutenantLevel(data, company([3, 4, 4]), 0)).toBe(4); // 3.67
    expect(lieutenantLevel(data, company([3, 3, 3, 3, 3, 4]), 0)).toBe(3); // 3.17
    expect(lieutenantLevel(data, company([3, 3, 3, 4, 4, 4]), 0)).toBe(4); // 3.5 with six
  });

  it('adds the grudge 0-3 and clamps it', () => {
    const c = company([4, 4, 4]);
    expect([0, 1, 2, 3].map((g) => lieutenantLevel(data, c, g))).toEqual([4, 5, 6, 7]);
    expect(lieutenantLevel(data, c, 9)).toBe(7);
    expect(lieutenantLevel(data, c, -2)).toBe(4);
  });

  it('reads the army size from the balance', () => {
    const d = clone(data);
    d.balance.lieutenant.scaling.armySize = 2;
    expect(lieutenantLevel(d, company([10, 8, 1, 1]), 0)).toBe(9);
  });

  it('has a floor of 1 for an empty company', () => {
    expect(lieutenantLevel(data, { roster: [] }, 0)).toBe(1);
  });
});

describe('lieutenantSkills', () => {
  it('unlocks one more grudge skill per notch, in order', () => {
    const hask = data.lieutenants.hask!;
    expect(lieutenantSkills(hask, 0)).toEqual([]);
    expect(lieutenantSkills(hask, 1)).toEqual(['brute_blow']);
    expect(lieutenantSkills(hask, 2)).toEqual(['brute_blow', 'brand_mark']);
    expect(lieutenantSkills(hask, 3)).toEqual(['brute_blow', 'brand_mark', 'fire_eats_all']);
    expect(lieutenantSkills(hask, 7)).toEqual(hask.grudgeSkills);
  });

  it('agrees with the locked and free skills of the profile card', () => {
    for (const lt of Object.values(data.lieutenants)) {
      for (const g of [0, 1, 2, 3]) {
        const c = fresh();
        c.lieutenants = { [lt.id]: { met: true, encounters: 1, grudge: g, routs: g, signatureDropped: false } };
        const free = wantedView(data, c, lt.id)!.skills.filter((s) => s.free).map((s) => s.id);
        expect(free).toEqual(lieutenantSkills(lt, g));
      }
    }
  });
});

describe('weapon tiers', () => {
  it('goes one step up the chain per notch and stops where the chain ends', () => {
    expect([0, 1, 2, 3].map((g) => tierUpItem(data, 'iron_axe', g))).toEqual(['iron_axe', 'steel_axe', 'steel_axe', 'steel_axe']);
    expect(tierUpItem(data, 'iron_bow', 2)).toBe('steel_bow');
    expect(tierUpItem(data, 'hand_axe', 3)).toBe('hand_axe'); // not on the chain: stays
  });

  it('follows a longer chain step by step', () => {
    const d = clone(data);
    d.balance.lieutenant.scaling.tierUp = { iron_axe: 'steel_axe', steel_axe: 'hammer' };
    expect([0, 1, 2, 3].map((g) => tierUpItem(d, 'iron_axe', g))).toEqual(['iron_axe', 'steel_axe', 'hammer', 'hammer']);
  });

  it('keeps non-weapons, upgrades and order, and never carries the signature item', () => {
    const hask = data.lieutenants.hask!;
    const refs = [{ def: 'iron_axe', upgrade: 2 }, { def: hask.signatureItem }, { def: 'vulnerary' }];
    const { items, kept } = lieutenantItems(data, hask, refs, 1);
    expect(items).toEqual([{ def: 'steel_axe', upgrade: 2 }, { def: 'vulnerary' }]);
    expect(kept).toEqual([0, 2]);
  });
});

/** The ch01 battle with Hask after `change` was applied to a copy of the map, built from a company of the given levels. */
function varnhold(levels: number[], grudge: number, change?: (m: MapDef) => void) {
  const d = change ? { ...data, maps: { ...data.maps, ch01_varnhold: clone(data.maps.ch01_varnhold!) } } : data;
  if (change) change(d.maps.ch01_varnhold!);
  const c = fresh();
  c.roster = company(levels).roster;
  c.lieutenants = { hask: { met: true, encounters: 1, grudge, routs: grudge, signatureDropped: false } };
  const s = createBattle(d, c, 'ch01', c.roster.slice(0, 4).map((u) => u.id));
  return { s, c, hask: s.units.find((u) => u.lieutenant === 'hask') as BattleUnit };
}

const haskOf = (m: MapDef) => m.units.find((u) => u.lieutenant === 'hask')!;

describe('the lieutenant on the board', () => {
  it('takes level, values and skills from the company and the grudge', () => {
    const { hask, c } = varnhold([5, 5, 5, 5], 2);
    expect(hask.level).toBe(lieutenantLevel(data, c, 2));
    expect(hask.level).toBe(7);
    expect(hask.stats).toEqual(genericStats(data, 'brigand', 7, data.balance.difficulty.normal.enemyStatPercent, 'nearest'));
    expect(activeSkillIds(data, hask)).toEqual(expect.arrayContaining(['brute_blow', 'brand_mark']));
    expect(activeSkillIds(data, hask)).not.toContain('fire_eats_all');
  });

  it('ignores the level of the map', () => {
    const lo = varnhold([4, 4], 0, (m) => (haskOf(m).level = 1)).hask;
    const hi = varnhold([4, 4], 0, (m) => (haskOf(m).level = 30)).hask;
    expect(lo.level).toBe(4);
    expect(hi.stats).toEqual(lo.stats);
  });

  it('has no grudge skill at grudge 0 and all three at grudge 3', () => {
    const none = varnhold([3, 3], 0).hask;
    const all = varnhold([3, 3], 3).hask;
    for (const sk of data.lieutenants.hask!.grudgeSkills) {
      expect(activeSkillIds(data, none)).not.toContain(sk);
      expect(activeSkillIds(data, all)).toContain(sk);
    }
  });

  it('carries the weapon of the map one tier up per notch, capped, and never the signature item', () => {
    const iron = (m: MapDef) => {
      haskOf(m).items = [{ def: 'iron_axe' }, { def: 'tinder' }, { def: 'vulnerary' }];
    };
    const weapon = (g: number) => varnhold([3, 3], g, iron).hask.equip.mainHand?.def;
    expect([0, 1, 2, 3].map(weapon)).toEqual(['iron_axe', 'steel_axe', 'steel_axe', 'steel_axe']);
    for (const g of [0, 1, 2, 3]) {
      const h = varnhold([3, 3], g, iron).hask;
      const carried = [...Object.values(h.equip), ...h.bag].map((i) => i?.def);
      expect(carried).not.toContain('tinder');
      expect(carried).toContain('vulnerary');
    }
    // a weapon outside the chain stays
    const hand = varnhold([3, 3], 3, (m) => (haskOf(m).items = [{ def: 'hand_axe' }])).hask;
    expect(hand.equip.mainHand?.def).toBe('hand_axe');
  });

  it('is deterministic: the same company builds the same battle, values without dice', () => {
    const a = varnhold([5, 4, 4, 3], 1);
    const b = varnhold([5, 4, 4, 3], 1);
    expect(b.s).toEqual(a.s);
    expect(b.hask.stats).toEqual(a.hask.stats);
  });

  it('replays to the same outcome from the same start', () => {
    const play = () => autoplay(data, startBattle(data, varnhold([4, 4, 3, 3], 2).s).state);
    const a = play();
    expect(play().state).toEqual(a.state);
  });

  it('leaves other enemies at the level of the map', () => {
    const { s } = varnhold([9, 9, 9], 3);
    expect(s.units.find((u) => u.uid === 'e1')!.level).toBe(2);
  });

  it('does not depend on the order of the roster', () => {
    expect(varnhold([2, 6, 4, 8], 0).hask.level).toBe(varnhold([8, 4, 6, 2], 0).hask.level);
  });
});

describe('expected values', () => {
  it('rounds half up', () => {
    expect(roundDiv(5, 10)).toBe(1);
    expect(roundDiv(4, 10)).toBe(0);
    expect(roundDiv(15, 10)).toBe(2);
    const cls = data.classes.brigand!;
    const s = genericStats(data, 'brigand', 5, 0, 'nearest');
    expect(s.str).toBe(Math.min(cls.caps.str, cls.base.str + roundDiv(cls.growth.str * 4, 100)));
  });

  it('gives level 1 the plain class base and never goes above the caps', () => {
    const cls = data.classes.brigand!;
    expect(genericStats(data, 'brigand', 1, 0)).toEqual(cls.base);
    const high = genericStats(data, 'brigand', 99, 50);
    for (const k of Object.keys(cls.caps) as Array<keyof typeof cls.caps>) expect(high[k]).toBeLessThanOrEqual(cls.caps[k]);
  });

  it('rounds down for generic foes and mercenaries as before, to nearest only for lieutenants', () => {
    const cls = data.classes.brigand!;
    const floor = genericStats(data, 'brigand', 5, 0);
    expect(floor.str).toBe(cls.base.str + Math.floor((cls.growth.str * 4) / 100));
    const { s } = varnhold([4, 4], 0, (m) => {
      m.units.push({ id: 'twin', team: 'enemy', class: 'brigand', level: 4, at: [1, 1], items: [], ai: { profile: 'hold' } });
    });
    const twin = s.units.find((u) => u.uid === 'twin')!;
    const hask = s.units.find((u) => u.lieutenant === 'hask')!;
    expect(twin.stats).toEqual(genericStats(data, 'brigand', 4, 0));
    expect(hask.stats).toEqual(genericStats(data, 'brigand', 4, 0, 'nearest'));
  });
});

describe('content check of the chain', () => {
  const problems = (change: (d: GameData) => void): string => {
    const d = clone(data);
    const l = clone(locales);
    for (const lt of Object.values(d.lieutenants)) for (const lang of ['de', 'en']) l[lang]![lt.titleKey] ??= 'Title';
    change(d);
    return validateContent(d, l).map((i) => `${i.file}: ${i.message}`).join('\n');
  };

  it('accepts the chain of the balance', () => {
    expect(problems(() => {})).toBe('');
  });

  it('refuses unknown items, other groups and a step onto itself', () => {
    expect(problems((d) => (d.balance.lieutenant.scaling.tierUp.iron_axe = 'no_such_axe'))).toMatch(/unknown item no_such_axe/);
    expect(problems((d) => (d.balance.lieutenant.scaling.tierUp.iron_axe = 'steel_sword'))).toMatch(/one weapon group/);
    expect(problems((d) => (d.balance.lieutenant.scaling.tierUp.iron_axe = 'iron_axe'))).toMatch(/points at itself/);
  });

  it('refuses a signature item on a map unit of the lieutenant', () => {
    expect(problems((d) => haskOf(d.maps.ch01_varnhold!).items.push({ def: 'tinder' }))).toMatch(/never carries his signature item tinder/);
  });
});
