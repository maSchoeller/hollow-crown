import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyRenames, checkLockedIds, collectIds, mergeLock, renamedId, renamesSchema, type IdSets, type ReleasedIds } from '../../src/content/ids';
import { loadContentFromDisk } from '../../src/content/node';
import { normalizeCampaign } from '../../src/core';
import { migrate, migrationFormats, SAVE_FORMAT, type SaveRecord } from '../../src/persistence/save';
import { saveRecordSchema } from '../../src/persistence/schema';
import { readRenames } from '../../tools/build/packs-plugin';

const dir = join(process.cwd(), 'tests/fixtures/saves');
const fixtures = readdirSync(dir).filter((f) => /^format\d+-.+\.json$/.test(f));
const formatOf = (f: string) => Number(/^format(\d+)-/.exec(f)![1]);

describe('save migrations (architecture §5.15, story 7.4)', () => {
  it('every format before the current one has a migration and a fixture', () => {
    for (let n = 2; n < SAVE_FORMAT; n++) {
      expect(migrationFormats(), `migration from format ${n}`).toContain(n);
      expect(fixtures.some((f) => formatOf(f) === n), `fixture format${n}-*.json`).toBe(true);
    }
  });

  it('every migration has a fixture', () => {
    for (const n of migrationFormats()) expect(fixtures.some((f) => formatOf(f) === n), `fixture format${n}-*.json`).toBe(true);
  });

  it('every fixture from format 2 on migrates to a valid current save', () => {
    for (const f of fixtures.filter((x) => formatOf(x) >= 2)) {
      const rec = JSON.parse(readFileSync(join(dir, f), 'utf8')) as SaveRecord;
      const out = migrate(rec);
      expect(out.format, f).toBe(SAVE_FORMAT);
      expect(saveRecordSchema.safeParse(out).success, f).toBe(true);
    }
  });
});

describe('rename migration 2 → 3 (story 15.6: Kael is Lucan)', () => {
  const { data, locales } = loadContentFromDisk();
  const old = JSON.parse(readFileSync(join(dir, 'format2-kael.json'), 'utf8')) as SaveRecord;
  const text = (key: string) => locales.de?.[key] ?? locales.en?.[key];

  it('reproduces the bug: the old save names a unit whose text and character are gone', () => {
    const kael = old.payload.campaign.roster.find((u) => u.id === 'kael')!;
    expect(kael.nameKey).toBe('unit.kael.name');
    expect(text(kael.nameKey)).toBeUndefined();
    expect(data.chars.kael).toBeUndefined();
  });

  it('replaces kael and the moved scenes everywhere in the save', () => {
    const out = migrate(old);
    expect(JSON.stringify(out)).not.toMatch(/(?<![A-Za-z0-9])kael(?![A-Za-z0-9])/);
    const c = out.payload.campaign;
    const lucan = c.roster.find((u) => u.id === 'lucan')!;
    expect(lucan.nameKey).toBe('unit.lucan.name');
    expect(text(lucan.nameKey)).toBe('Lucan');
    expect(Object.keys(c.supports)).toEqual(expect.arrayContaining(['avatar|lucan', 'brenna|lucan']));
    expect(c.scenesSeen).toEqual(expect.arrayContaining(['scn.bark.lucan', 'scn.n2.varek_talk', 'scn.support.avatar_lucan.A']));
    expect(c.choices['scn.n2.varek_talk#3']).toBe('spare');
    expect(c.choices['scn.support.avatar_lucan.A#5']).toBe('b');
    expect(c.decisions.at(-1)?.scene).toBe('scn.n2.varek_talk');
    expect(c.avatar.name).toBe(old.payload.campaign.avatar.name);
    const b = out.payload.battle!;
    expect(b.start.units.some((u) => u.id === 'lucan')).toBe(true);
    expect(JSON.stringify(b.commands)).toBe(JSON.stringify(old.payload.battle!.commands).replace(/(?<![A-Za-z0-9])kael(?![A-Za-z0-9])/g, 'lucan'));
    expect(migrate(out)).toEqual(out);
  });

  it('refuses a save of a newer format', () => {
    expect(() => migrate({ ...old, format: SAVE_FORMAT + 1 })).toThrow('format');
  });

  it('renames only to IDs that exist (the check content:check runs before the first lock)', () => {
    const none = ids();
    const renames = readRenames(process.cwd());
    expect(Object.keys(renames.chars ?? {})).toContain('kael');
    expect(checkLockedIds({ lockedAt: '', packs: [], ids: none }, collectIds(data), renames)).toEqual([]);
  });

  it('leaves every migrated fixture without unknown characters, texts or support pairs', () => {
    // a content rename without an entry in content/renames.yaml fails here (until content:lock guards released IDs)
    for (const f of fixtures.filter((x) => formatOf(x) >= 2)) {
      const c = migrate(JSON.parse(readFileSync(join(dir, f), 'utf8')) as SaveRecord).payload.campaign;
      for (const u of c.roster) {
        if (u.charId) expect(data.chars[u.charId], `${f}: char ${u.charId}`).toBeDefined();
        if (u.name === undefined) expect(text(u.nameKey), `${f}: ${u.nameKey}`).toBeDefined();
      }
      for (const pair of Object.keys(c.supports)) for (const id of pair.split('|')) expect(id === 'avatar' || !!data.chars[id], `${f}: support ${pair}`).toBe(true);
    }
  });

  it('loads the act 1 finale save with the academy defaults, without a migration (story 10.2)', () => {
    const rec = JSON.parse(readFileSync(join(dir, 'format3-act1-finale-done.json'), 'utf8')) as SaveRecord;
    expect(rec.format).toBe(SAVE_FORMAT);
    const raw = rec.payload.campaign;
    const c = normalizeCampaign(data, migrate(rec).payload.campaign);
    expect(c.roster.length).toBe(raw.roster.length);
    expect(c.roster.map((u) => u.classId)).toEqual(raw.roster.map((u) => u.classId));
    expect(c.roster.every((u) => JSON.stringify(u.promotionGain) === '{}' && u.secondPath === null)).toBe(true);
  });
});

const ids = (over: Partial<IdSets> = {}): IdSets => ({
  chars: [],
  classes: [],
  items: [],
  skills: [],
  affixes: [],
  sets: [],
  nodes: [],
  maps: [],
  flags: [],
  rooms: [],
  scenes: [],
  lieutenants: [],
  ...over,
});
const lock = (over: Partial<IdSets>): ReleasedIds => ({ lockedAt: '2026-10-24', packs: ['core'], ids: ids(over) });

describe('stable IDs (architecture §5.16)', () => {
  it('collects the IDs of the real content', () => {
    const { data } = loadContentFromDisk();
    const got = collectIds(data);
    expect(got.chars).toContain('lucan');
    expect(got.nodes).toEqual(['m1_1', 'm1_2', 'm1_3', 'm1_4', 'm1_5', 'm1_6', 'm1_7', 'm1_8', 'n1', 'n2', 'n3', 'prologue']);
    expect(got.scenes).toContain('scn.prologue.intro');
    expect(collectIds(data, { maps: (m) => m.startsWith('prologue'), scenes: () => false }).maps).toEqual(['prologue_paktnacht']);
  });

  it('keeps earlier locked IDs when locking again', () => {
    const first = mergeLock(null, ids({ items: ['b', 'a'] }), ['core'], '2026-10-24');
    expect(first.ids.items).toEqual(['a', 'b']);
    const second = mergeLock(first, ids({ items: ['c'] }), ['act1'], '2026-11-01');
    expect(second.ids.items).toEqual(['a', 'b', 'c']);
    expect(second.packs).toEqual(['act1', 'core']);
    expect(second.lockedAt).toBe('2026-11-01');
  });

  it('fails on a missing locked ID unless renames.yaml names an existing successor', () => {
    const locked = lock({ items: ['iron_sword', 'old_axe'] });
    expect(checkLockedIds(locked, ids({ items: ['iron_sword', 'old_axe'] }))).toEqual([]);
    expect(checkLockedIds(locked, ids({ items: ['iron_sword'] })).map((i) => i.message)).toEqual([
      'items old_axe is locked but missing; add it to renames.yaml',
    ]);
    expect(checkLockedIds(locked, ids({ items: ['iron_sword', 'axe'] }), { items: { old_axe: 'axe' } })).toEqual([]);
    expect(checkLockedIds(locked, ids({ items: ['iron_sword'] }), { items: { old_axe: 'axe' } }).map((i) => i.file)).toEqual(['renames.yaml', 'renames.yaml']);
  });

  it('follows rename chains and stops on loops', () => {
    const renames = renamesSchema.parse({ items: { a: 'b', b: 'c' }, chars: { x: 'y', y: 'x' } });
    expect(renamedId(renames, 'items', 'a')).toBe('c');
    expect(renamedId(renames, 'items', 'z')).toBe('z');
    expect(['x', 'y']).toContain(renamedId(renames, 'chars', 'x'));
    expect(checkLockedIds(lock({ items: ['a'] }), ids({ items: ['c'] }), renames)).toEqual([]);
    expect(checkLockedIds(lock({ chars: ['x'] }), ids(), renames).length).toBeGreaterThan(0);
    expect(() => renamesSchema.parse({ weapons: {} })).toThrow();
  });

  it('applies renames to values, keys, derived character keys and answer keys, but not to custom names', () => {
    const renames = renamesSchema.parse({ chars: { kael: 'lucan' }, scenes: { 'scn.a': 'scn.b' } });
    const got = applyRenames(
      { id: 'kael', nameKey: 'unit.kael.name', name: 'kael', s: { 'avatar|kael': 1 }, seen: ['scn.a', 'scn.ab'], choices: { 'scn.a#2': 'x' }, other: 'kaelin', n: 3 },
      renames,
    );
    expect(got).toEqual({ id: 'lucan', nameKey: 'unit.lucan.name', name: 'kael', s: { 'avatar|lucan': 1 }, seen: ['scn.b', 'scn.ab'], choices: { 'scn.b#2': 'x' }, other: 'kaelin', n: 3 });
    expect(applyRenames({ a: 'kael' }, {})).toEqual({ a: 'kael' });
  });
});
