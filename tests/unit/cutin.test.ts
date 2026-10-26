import { describe, expect, it } from 'vitest';
import { cutInName, cutInPortrait } from '../../src/app/battle/cutIn';
import { iconsOf } from '../../src/render/board/statusIcons';

describe('cut-in portrait (story 8.6)', () => {
  const built = new Set(['brenna', 'brenna_angry', 'kael']);
  it('takes the angry half figure when there is one', () => {
    expect(cutInPortrait('brenna', built, 'Brenna')).toEqual({ kind: 'half', stem: 'brenna_angry' });
  });
  it('falls back to the neutral figure', () => {
    expect(cutInPortrait('kael', built, 'Kael')).toEqual({ kind: 'half', stem: 'kael' });
  });
  it('falls back to a letter medallion without any half figure, or before the manifest is read', () => {
    expect(cutInPortrait('class_brigand', built, 'brigand')).toEqual({ kind: 'medallion', initial: 'B' });
    expect(cutInPortrait(undefined, built, 'x')).toEqual({ kind: 'medallion', initial: 'X' });
  });
});

describe('cut-in name', () => {
  const text = { skill: (id: string) => `S:${id}`, item: (i: { def: string }) => `I:${i.def}` };
  it('names the skill, else the weapon', () => {
    const w = { uid: 'w', def: 'iron_sword', affixes: [], runes: [], upgrade: 0 } as never;
    expect(cutInName('brand_mark', w, text)).toBe('S:brand_mark');
    expect(cutInName(undefined, w, text)).toBe('I:iron_sword');
    expect(cutInName(undefined, undefined, text)).toBe('');
  });
});

describe('status icons', () => {
  it('shows burning, wet and slowed in a fixed order and nothing for knockback', () => {
    expect(iconsOf([{ id: 'slowed' }, { id: 'burning' }, { id: 'knockback' }])).toEqual(['burning', 'slowed']);
    expect(iconsOf([])).toEqual([]);
  });
});
