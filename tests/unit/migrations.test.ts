import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkLockedIds, collectIds, mergeLock, renamedId, renamesSchema, type IdSets, type ReleasedIds } from '../../src/content/ids';
import { loadContentFromDisk } from '../../src/content/node';
import { migrate, migrationFormats, SAVE_FORMAT, type SaveRecord } from '../../src/persistence/save';
import { saveRecordSchema } from '../../src/persistence/schema';

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
    expect(got.chars).toContain('kael');
    expect(got.nodes).toEqual(['ch02', 'm1_1', 'm1_2', 'm1_6', 'm1_7', 'm1_8', 'prologue']);
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
});
