/** Item detail sheet: every item gets a description and readable values, worked out by the same rule code as the battle. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { weaponProfile, type GameData, type ItemInstance } from '../../src/core';
import { lang, setLocales } from '../../src/i18n';
import { asInstance, itemInfo } from '../../src/ui/itemInfo';

let data: GameData;

beforeAll(() => {
  const c = loadContentFromDisk();
  data = c.data;
  setLocales(c.locales);
});

const texts = (info: ReturnType<typeof itemInfo>): string[] => [
  info.type,
  info.desc,
  ...info.facts.flatMap((f) => [f.label, f.value, f.hint ?? '']),
  ...info.effects,
  ...(info.skill ? [info.skill.name, info.skill.desc] : []),
  ...(info.set ? [info.set.name, ...info.set.pieces, ...info.set.bonuses] : []),
  ...info.notes,
];

describe('itemInfo', () => {
  it('has no missing text for any item in either language', () => {
    for (const l of ['de', 'en'] as const) {
      lang.value = l;
      for (const id of Object.keys(data.items)) {
        const all = texts(itemInfo(data, id));
        const missing = all.filter((s) => /\b(ui|item|skill|set|terrain)\.[a-z_]+/.test(s) || s.includes('{'));
        expect(missing, `${l} ${id}`).toEqual([]);
      }
    }
    lang.value = 'de';
  });

  it('shows the weapon values of the rule code, including affixes and upgrades', () => {
    const inst: ItemInstance = { uid: 'x', def: 'iron_sword', upgrade: 2, affixes: ['accurate'], runes: [] };
    const info = itemInfo(data, inst);
    const w = weaponProfile(data, inst);
    expect(info.facts.find((f) => f.key === 'mt')?.value).toBe(`${w.might}`);
    expect(info.facts.find((f) => f.key === 'hit')?.value).toBe(`${w.hit}`);
    expect(info.affixes).toHaveLength(1);
  });

  it('explains effects, the skill, the set and the price', () => {
    lang.value = 'de';
    const bow = itemInfo(data, 'longbow');
    expect(bow.effects.some((e) => e.includes('Flieger'))).toBe(true);
    expect(bow.skill?.cost).toBe(data.items.longbow!.grantsSkill!.masteryCost);
    const helm = itemInfo(data, 'iron_helm');
    expect(helm.set?.pieces).toHaveLength(data.sets.ashen_watch!.pieces.length);
    expect(helm.facts.find((f) => f.key === 'def')).toMatchObject({ value: '+2', tone: 'up' });
    expect(helm.buy).toBe(data.items.iron_helm!.price);
    const potion = itemInfo(data, 'vulnerary');
    expect(potion.facts.find((f) => f.key === 'charges')?.value).toBe('3/3');
    expect(itemInfo(data, 'ashen_blade').sell).toBe(0);
  });

  it('turns a bare id into an instance without affixes or runes', () => {
    expect(asInstance('torch')).toEqual({ uid: '', def: 'torch', upgrade: 0, affixes: [], runes: [] });
  });
});
