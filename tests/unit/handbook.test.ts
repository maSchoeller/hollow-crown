import { beforeAll, describe, expect, it } from 'vitest';
import {
  cycleOrder,
  entryAnchors,
  entryByAnchor,
  formatHandbookValue,
  handbookParams,
  normalizeSearch,
  resolveHandbookRef,
  searchHandbook,
  type GameData,
  type HandbookDef,
  type HandbookEntryDef,
} from '../../src/core';
import type { Locales } from '../../src/content/load';
import { loadContentFromDisk } from '../../src/content/node';
import { validateHandbook } from '../../src/content/validateHandbook';
import { hasIcon } from '../../src/ui/icons';

let data: GameData;
let locales: Locales;
beforeAll(() => {
  ({ data, locales } = loadContentFromDisk());
});

const issues = (d: GameData, l: Locales = locales) => {
  const out: string[] = [];
  validateHandbook(d, l, (file, message) => out.push(`${file}: ${message}`));
  return out;
};
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const withHandbook = (hb: HandbookDef): GameData => ({ ...data, handbook: hb });
const entry = (over: Partial<HandbookEntryDef>): HandbookEntryDef => ({
  id: 'x',
  category: 'combat',
  graphic: 'icon',
  values: [],
  see: [],
  ...over,
});

describe('handbook value paths (story 14.1)', () => {
  it('resolves paths into balance, terrain and classes', () => {
    expect(resolveHandbookRef(data, 'balance.triangle.hit')).toBe(data.balance.triangle.hit);
    expect(resolveHandbookRef(data, 'terrain.forest.avoid')).toBe(data.terrain.forest!.avoid);
    expect(resolveHandbookRef(data, 'classes.vanguard.mov')).toBe(data.classes.vanguard!.mov);
    expect(resolveHandbookRef(data, 'balance.economy.upgradeCost.0.gold')).toBe(300);
  });

  it('gives null for "none" and undefined for paths that do not end at a number', () => {
    expect(resolveHandbookRef(data, 'terrain.mountain.cost.foot')).toBeNull();
    expect(resolveHandbookRef(data, 'balance.triangle.nope')).toBeUndefined();
    expect(resolveHandbookRef(data, 'balance.triangle')).toBeUndefined();
    expect(resolveHandbookRef(data, 'balance.triangle.beats.sword')).toBeUndefined();
    expect(resolveHandbookRef(data, 'balance.combat.twoRnHit')).toBeUndefined();
    expect(resolveHandbookRef(data, 'balance.triangle.hit.deeper')).toBeUndefined();
    expect(resolveHandbookRef(data, 'balance.toString')).toBeUndefined();
  });

  it('writes values in every format, with the minus sign and "–" for none', () => {
    expect(formatHandbookValue(15, 'plain', 'de-DE')).toBe('15');
    expect(formatHandbookValue(-10, 'plain', 'de-DE')).toBe('−10');
    expect(formatHandbookValue(15, 'signed', 'de-DE')).toBe('+15');
    expect(formatHandbookValue(-1, 'signed', 'de-DE')).toBe('−1');
    expect(formatHandbookValue(0, 'signed', 'de-DE')).toBe('0');
    expect(formatHandbookValue(20, 'percent', 'de-DE')).toBe('20%');
    expect(formatHandbookValue(40, 'signedPercent', 'de-DE')).toBe('+40%');
    expect(formatHandbookValue(1.2, 'factor', 'de-DE')).toBe('×1,2');
    expect(formatHandbookValue(1.2, 'factor', 'en-US')).toBe('×1.2');
    expect(formatHandbookValue(1.2, 'factorPercent', 'de-DE')).toBe('+20%');
    expect(formatHandbookValue(0.8, 'factorPercent', 'de-DE')).toBe('−20%');
    expect(formatHandbookValue(0.1, 'share', 'de-DE')).toBe('10%');
    expect(formatHandbookValue(2500, 'plain', 'de-DE')).toBe('2.500');
    expect(formatHandbookValue(null, 'plain', 'de-DE')).toBe('–');
    expect(formatHandbookValue(undefined, 'signed', 'de-DE')).toBe('–');
  });

  it('fills the text parameters of an entry from its values', () => {
    const tri = data.handbook!.entries.find((e) => e.id === 'triangle')!;
    expect(handbookParams(data, tri, 'de-DE')).toEqual({
      hit: `+${data.balance.triangle.hit}`,
      dmg: `+${data.balance.triangle.damage}`,
    });
  });

  it('orders a beats map as a cycle', () => {
    expect(cycleOrder({ sword: 'axe', axe: 'lance', lance: 'sword' })).toEqual(['sword', 'axe', 'lance']);
    expect(cycleOrder(data.balance.element.cycle)).toEqual(['fire', 'wind', 'earth', 'water']);
    expect(cycleOrder({})).toEqual([]);
  });
});

describe('handbook anchors and search', () => {
  it('gives terrain, class and lesson entries their anchors implicitly', () => {
    expect(
      entryAnchors(entry({ anchor: 'forecast', terrain: ['forest', 'sand'], class: 'vanguard', lesson: 'scn.a' })),
    ).toEqual(['forecast', 'terrain.forest', 'terrain.sand', 'class.vanguard', 'lesson.scn.a']);
    expect(entryAnchors(entry({}))).toEqual([]);
  });

  it('finds the entry of every "?" the battle shows', () => {
    const hb = data.handbook;
    expect(entryByAnchor(hb, 'forecast')?.id).toBe('forecast');
    for (const s of ['burning', 'wet', 'slowed', 'knockback']) expect(entryByAnchor(hb, `status.${s}`)).toBeDefined();
    for (const id of Object.keys(data.terrain)) expect(entryByAnchor(hb, `terrain.${id}`), id).toBeDefined();
    for (const scene of [
      'scn.prologue.tutorial_move',
      'scn.prologue.tutorial_danger',
      'scn.prologue.tutorial_heal',
      'scn.m1_1.tutorial_triangle',
    ])
      expect(entryByAnchor(hb, `lesson.${scene}`), scene).toBeDefined();
    expect(entryByAnchor(hb, 'nothing')).toBeUndefined();
    expect(entryByAnchor(undefined, 'forecast')).toBeUndefined();
  });

  it('normalises case, umlauts and ß', () => {
    expect(normalizeSearch('  Größe ')).toBe('grosse');
    expect(normalizeSearch('Rückstoß')).toBe('ruckstoss');
  });

  it('searches titles and keywords, title hits first', () => {
    const hb: HandbookDef = {
      categories: [{ id: 'combat', icon: 'attack' }],
      entries: [entry({ id: 'a' }), entry({ id: 'b' }), entry({ id: 'c' })],
    };
    const texts: Record<string, string> = {
      'handbook.entry.a.title': 'Waffendreieck',
      'handbook.entry.a.keywords': 'Schwert, Axt',
      'handbook.entry.b.title': 'Schwertkampf',
      'handbook.entry.b.keywords': 'Klinge',
      'handbook.entry.c.title': 'Groll',
      'handbook.entry.c.keywords': 'Rache, Wimpel',
    };
    const t = (k: string) => texts[k] ?? '';
    expect(searchHandbook(hb, 'schwert', t).map((e) => e.id)).toEqual(['b', 'a']);
    expect(searchHandbook(hb, 'GROLL', t).map((e) => e.id)).toEqual(['c']);
    expect(searchHandbook(hb, 'rache wimpel', t).map((e) => e.id)).toEqual(['c']);
    expect(searchHandbook(hb, 'rache axt', t)).toEqual([]);
    expect(searchHandbook(hb, '   ', t)).toEqual([]);
  });

  it('finds "Groll" in the real German texts', () => {
    const t = (k: string) => locales.de![k] ?? '';
    expect(searchHandbook(data.handbook!, 'Groll', t)[0]?.id).toBe('grudge');
  });
});

describe('handbook content check (story 14.1, 14.5)', () => {
  it('accepts the shipped handbook', () => {
    expect(issues(data)).toEqual([]);
  });

  it('every icon the handbook names is drawn', () => {
    const hb = data.handbook!;
    const names = [
      ...hb.categories.map((c) => c.icon),
      ...hb.entries.flatMap((e) => [e.icon, ...e.values.map((v) => v.icon)]),
    ].filter((x): x is string => !!x);
    expect(names.filter((n) => !hasIcon(n))).toEqual([]);
  });

  it('refuses a value path that does not resolve', () => {
    const hb = clone(data.handbook!);
    hb.entries.find((e) => e.id === 'triangle')!.values[0]!.ref = 'balance.triangle.hitt';
    expect(issues(withHandbook(hb))).toContain(
      'handbook.yaml: entry triangle: value hit: balance.triangle.hitt does not resolve to a number',
    );
  });

  it('refuses missing texts, unknown cross references and doubled anchors', () => {
    const hb = clone(data.handbook!);
    hb.entries.push(entry({ id: 'extra', see: ['nowhere'], anchor: 'forecast' }));
    const found = issues(withHandbook(hb));
    expect(found).toContain('locales/de: entry extra: missing key handbook.entry.extra.title');
    expect(found).toContain('locales/en: entry extra: missing key handbook.entry.extra.where');
    expect(found).toContain('handbook.yaml: entry extra: unknown cross reference nowhere');
    expect(found).toContain('handbook.yaml: entry extra: context anchor forecast is also used by forecast');
  });

  it('wants a profile for every playable class and every terrain', () => {
    const hb = clone(data.handbook!);
    hb.entries = hb.entries.filter((e) => e.class !== 'scout' && e.id !== 'fog' && e.id !== 'rockwall');
    hb.entries.forEach((e) => (e.see = e.see.filter((s) => s !== 'class_scout' && s !== 'fog' && s !== 'rockwall')));
    const found = issues(withHandbook(hb));
    expect(found).toContain('handbook.yaml: playable class scout has no profile (class entry)');
    expect(found).toContain('handbook.yaml: terrain rockwall has no handbook entry');
  });

  it('refuses a profile of a class that is not playable', () => {
    const hb = clone(data.handbook!);
    hb.entries.find((e) => e.id === 'class_scout')!.class = 'brigand';
    expect(issues(withHandbook(hb))).toContain('handbook.yaml: entry class_scout: class brigand is not playable');
  });

  it('wants a "?" for the forecast and every status', () => {
    const hb = clone(data.handbook!);
    delete hb.entries.find((e) => e.id === 'status_wet')!.anchor;
    expect(issues(withHandbook(hb))).toContain('handbook.yaml: no entry has the context anchor status.wet');
  });

  it('refuses digits and unknown placeholders in entry texts', () => {
    const l = clone(locales);
    l.de!['handbook.entry.triangle.text'] = 'Vorteil: +15 Treffer, {nope}';
    const found = issues(data, l);
    expect(found).toContain(
      'locales/de: handbook.entry.triangle.text: numbers come from values ({id}), not from the text',
    );
    expect(found).toContain('locales/de: handbook.entry.triangle.text: placeholder {nope} is no value of triangle');
  });
});
