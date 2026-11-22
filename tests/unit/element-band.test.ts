/** Element band of the combat forecast (story 16.12): sentence, colour class, factor format, gone without rune. Function components are expanded by hand (no DOM here). */
import type { ComponentChild, VNode } from 'preact';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { GameData, SideForecast } from '../../src/core';
import { ElementBand, ElementFactor, StatusLine } from '../../src/app/screens/ElementBand';
import { lang, setLocales } from '../../src/i18n';

let data: GameData;
beforeAll(() => {
  const c = loadContentFromDisk();
  data = c.data;
  setLocales(c.locales);
});

/** text and class names of a vnode tree, function components called */
function dump(n: ComponentChild): { text: string; classes: string[] } {
  const out = { text: '', classes: [] as string[] };
  const walk = (x: ComponentChild): void => {
    if (x === null || x === undefined || typeof x === 'boolean') return;
    if (typeof x === 'string' || typeof x === 'number') {
      out.text += String(x);
      return;
    }
    if (Array.isArray(x)) return x.forEach(walk);
    const v = x as VNode<Record<string, unknown>>;
    if (typeof v.type === 'function') return walk((v.type as (p: unknown) => ComponentChild)(v.props));
    const cls = v.props.class;
    if (typeof cls === 'string') out.classes.push(...cls.split(' '));
    walk(v.props.children as ComponentChild);
  };
  walk(n);
  return out;
}

const side = (o: Partial<SideForecast>): SideForecast => ({
  uid: 'a',
  canStrike: true,
  damage: 10,
  hit: 100,
  crit: 0,
  strikes: 1,
  effective: false,
  triangle: 0,
  elementMult: 1,
  status: [],
  hpBefore: 20,
  maxHp: 20,
  magic: false,
  skills: [],
  ...o,
});

describe('ElementBand', () => {
  it('advantage: sentence, green class, comma factor', () => {
    lang.value = 'de';
    const r = dump(ElementBand({ enabled: true, side: side({ element: 'fire', elementMult: 1.2, guard: { element: 'wind', tier: 1, source: 'armor' } }) }));
    expect(r.text).toContain('Feuer schlägt Wind · Schaden ×1,2');
    expect(r.classes).toContain('is-pos');
  });
  it('disadvantage and same element: red class', () => {
    lang.value = 'de';
    const w = dump(ElementBand({ enabled: true, side: side({ element: 'fire', elementMult: 0.8, guard: { element: 'water', tier: 2, source: 'armor' } }) }));
    expect(w.text).toContain('Wasser hält Feuer ab · Schaden ×0,8');
    expect(w.classes).toContain('is-neg');
    const s = dump(ElementBand({ enabled: true, side: side({ element: 'fire', elementMult: 0.8, guard: { element: 'fire', tier: 1, source: 'shield' } }) }));
    expect(s.text).toContain('Feuer gegen Feuer · Schaden ×0,8');
    lang.value = 'en';
    const e = dump(ElementBand({ enabled: true, side: side({ element: 'fire', elementMult: 1.2, guard: { element: 'wind', tier: 1, source: 'armor' } }) }));
    expect(e.text).toContain('Fire beats Wind · Damage ×1.2');
    lang.value = 'de';
  });
  it('neutral: cream, no factor', () => {
    const r = dump(ElementBand({ enabled: true, side: side({ element: 'fire' }) }));
    expect(r.text).toContain('Feuer · kein Vorteil, kein Nachteil');
    expect(r.text).not.toContain('Schaden');
    expect(r.classes).toContain('is-neutral');
  });
  it('gone without a weapon element or with the elements mechanic off', () => {
    expect(ElementBand({ enabled: true, side: side({}) })).toBeNull();
    expect(ElementBand({ enabled: false, side: side({ element: 'fire', elementMult: 1.2 }) })).toBeNull();
  });
});

describe('ElementFactor and StatusLine', () => {
  it('the factor mark shows only off 1 and takes the locale decimal', () => {
    expect(ElementFactor({ mult: 1 })).toBeNull();
    const r = dump(ElementFactor({ mult: 0.8 }));
    expect(r.text).toBe('×0,8');
    expect(r.classes).toContain('is-neg');
  });
  it('status line: chance, rounds and burn damage from the forecast; chance 0 hides it', () => {
    const f = side({ status: [{ status: 'burning', chance: 30 }], statusTurns: [{ status: 'burning', rounds: 2, perRound: 3 }] });
    const r = dump(StatusLine({ data, side: f }));
    expect(r.text).toContain('30 % Brennen');
    expect(r.text).toMatch(/2.*3/);
    expect(StatusLine({ data, side: side({ status: [{ status: 'burning', chance: 0 }] }) })).toBeNull();
  });
});
