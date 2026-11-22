/**
 * Story 16.6: the pure rules of the rune weapons' look (src/render/shared/runeLook.ts): fill per tier, glow state from the
 * overlays, metal tint, the rebuild key, where which rune sits; plus the channel ramp and the full-glow set of the battle screen.
 */
import { describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { glowUids } from '../../src/app/screens/battleMode';
import { fillThreshold, glowPartOf, glowState, glowStrength, gearRunesOf, hexRgb, lighten, pulseFactor, runeColour, runeKey, runeLookOf, tintMetal } from '../../src/render/shared/runeLook';
import { rampData } from '../../src/render/shared/runeGlow';

const { data } = loadContentFromDisk();
const def = data.render.gear.rune;

describe('rune glow values', () => {
  it('fills the channel by a third, two thirds and all by tier', () => {
    expect(fillThreshold(def, 1)).toBeCloseTo(1 / 3, 3);
    expect(fillThreshold(def, 2)).toBeCloseTo(2 / 3, 3);
    expect(fillThreshold(def, 3)).toBe(1);
    expect(fillThreshold(def, 0)).toBe(fillThreshold(def, 1));
    expect(fillThreshold(def, 9)).toBe(1);
  });

  it('lights the ramp up to the threshold and leaves a dark floor beyond it, all lit at tier III', () => {
    const colour = hexRgb(def.colors.fire);
    const px = (d: Uint8Array, i: number) => d[i * 4]!;
    const one = rampData(def, colour, 1, 1);
    expect(px(one, 0)).toBe(Math.round(colour[0] * 255));
    expect(px(one, 63)).toBeLessThan(px(one, 0) * (def.floor + 0.02));
    const two = rampData(def, colour, 1, 2);
    expect(px(two, 30)).toBe(px(two, 0)); // below two thirds: lit
    expect(px(two, 50)).toBeLessThan(px(two, 0));
    const three = rampData(def, colour, 1, 3);
    expect(new Set(Array.from({ length: 64 }, (_, i) => px(three, i))).size).toBe(1);
    // the dim state is the same ramp at a lower strength
    expect(px(rampData(def, colour, def.state.dim, 3), 0)).toBeLessThan(px(three, 0));
  });

  it('glows full for the uids of the overlays and dimmed for all others', () => {
    expect(glowState(new Set(['a']), 'a')).toBe('full');
    expect(glowState(new Set(['a']), 'b')).toBe('dim');
    expect(glowState(undefined, 'a')).toBe('dim');
    expect(glowStrength(def, 'dim')).toBeLessThan(glowStrength(def, 'full'));
  });

  it('pulses between full strength and 1 - amplitude over its period', () => {
    expect(pulseFactor(def, 0)).toBeCloseTo(1, 5);
    expect(pulseFactor(def, def.pulse.periodMs / 2)).toBeCloseTo(1 - def.pulse.amplitude, 5);
    expect(pulseFactor(def, def.pulse.periodMs)).toBeCloseTo(1, 5);
  });

  it('colours every element and the auxiliary runes', () => {
    for (const r of Object.values(data.runes)) expect(runeColour(def, runeLookOf(data.runes, r.id)!)).toHaveLength(3);
    const c = lighten([0.2, 0.4, 0.6], 0.5);
    expect(c[0]).toBeCloseTo(0.6);
  });

  it('names the glow parts of a mesh by its node name', () => {
    expect(glowPartOf('unit:u1:player:axe:rune_channel')).toBe('channel');
    expect(glowPartOf('unit:u1:player:axe:socket_rune_a_l:fire_rune_3:rune_symbol.003')).toBe('symbol');
    expect(glowPartOf('x:fire_rune_3_rune_gold.001')).toBe('gold');
    expect(glowPartOf('x:rune_core.001')).toBe('core');
    expect(glowPartOf('x:rune_stone')).toBe('stone');
    expect(glowPartOf('unit:u1:player:axe:axe')).toBeUndefined();
    expect(glowPartOf('x:rune_socket2')).toBeUndefined();
  });
});

describe('metal tint', () => {
  const grey = [0.5, 0.5, 0.52] as const;
  const brightness = (c: readonly number[]) => c[0]! + c[1]! + c[2]!;

  it('tells iron, steel and silver apart on the same grey, silver lightest', () => {
    const iron = tintMetal(grey, 'iron', def);
    const steel = tintMetal(grey, 'steel', def);
    const silver = tintMetal(grey, 'silver', def);
    expect(brightness(iron)).toBeLessThan(brightness(steel));
    expect(brightness(steel)).toBeLessThan(brightness(silver));
    expect(steel[2]).toBeGreaterThan(steel[0]); // steel is the cooler one
    expect(iron[0]).toBeGreaterThan(iron[2] - 0.0001 - 0.03); // iron stays warm grey
  });

  it('leaves saturated colours (wood, leather) as they are', () => {
    const wood = [0.55, 0.32, 0.12] as const;
    for (const m of ['iron', 'steel', 'silver'] as const) expect(tintMetal(wood, m, def)).toEqual([...wood]);
  });

  it('keeps every component within 0-1', () => {
    for (const c of tintMetal([1, 1, 1], 'silver', def)) expect(c).toBeLessThanOrEqual(1);
  });
});

describe('runes in the settings', () => {
  const ids = (...r: (string | null)[]) => gearRunesOf(data.runes, r, 2, 'iron');

  it('puts the element rune in the main setting and the auxiliary rune in the small one', () => {
    const r = ids('precision_rune', 'fire_rune_2');
    expect(r.main).toEqual({ id: 'fire_rune_2', element: 'fire', tier: 2 });
    expect(r.small).toEqual({ id: 'precision_rune', element: 'utility', tier: 1 });
    expect(r.smallSlot).toBe(true);
    expect(r.metal).toBe('iron');
  });

  it('shows no small setting on an item with one slot, and its rune sits in the main one', () => {
    const r = gearRunesOf(data.runes, ['force_rune'], 1, undefined);
    expect(r.smallSlot).toBe(false);
    expect(r.main?.id).toBe('force_rune');
    expect(r.small).toBeNull();
    expect(r.metal).toBe('steel');
  });

  it('leaves the settings empty without runes, and skips an unknown id', () => {
    const r = ids(null, 'nope');
    expect(r.main).toBeNull();
    expect(r.small).toBeNull();
    expect(r.smallSlot).toBe(true);
  });

  it('builds the figure anew when metal, rune or setting changes (rebuild key)', () => {
    const keys = [
      runeKey(undefined),
      runeKey(ids()),
      runeKey(ids('fire_rune_1')),
      runeKey(ids('fire_rune_2')),
      runeKey(gearRunesOf(data.runes, ['fire_rune_1'], 2, 'silver')),
      runeKey(gearRunesOf(data.runes, ['fire_rune_1'], 1, 'iron')),
      runeKey(ids('fire_rune_1', 'edge_rune')),
    ];
    expect(new Set(keys).size).toBe(keys.length);
    expect(runeKey(ids('fire_rune_1'))).toBe(runeKey(ids('fire_rune_1')));
  });
});

describe('full glow of the battle screen', () => {
  const to: [number, number] = [1, 1];
  it('names the chosen figure, in the forecast also the target, never anyone in idle', () => {
    expect([...glowUids({ k: 'idle' })]).toEqual([]);
    expect([...glowUids({ k: 'selected', uid: 'a' })]).toEqual(['a']);
    expect([...glowUids({ k: 'moved', uid: 'a', to })]).toEqual(['a']);
    expect([...glowUids({ k: 'forecast', uid: 'a', to, target: 'e1' })].sort()).toEqual(['a', 'e1']);
  });
});
