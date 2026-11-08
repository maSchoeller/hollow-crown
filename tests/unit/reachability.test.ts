import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { checkReachability } from '../../src/content/validateReach';
import type { GameData } from '../../src/core';
import type { MapDef } from '../../src/core/mapDefs';

let data: GameData;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const messages = (d: GameData, drafts: MapDef[] = []) => checkReachability(d, drafts).map((i) => `${i.file}: ${i.message}`);

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('content reachability (review 2026-11-07, M6)', () => {
  it('finds no dead scene in the content', () => {
    expect(messages(data).filter((m) => m.startsWith('scenes/'))).toEqual([]);
  });

  it('reports a scene nothing names, but not the scenes the code builds from ids', () => {
    const d = clone(data);
    const any = Object.values(d.scenes)[0]!;
    d.scenes['scn.orphan'] = { ...any, id: 'scn.orphan' };
    d.scenes['scn.bark.nobody'] = { ...any, id: 'scn.bark.nobody' };
    const found = messages(d);
    expect(found).toContain('scenes/scn.orphan: scene is never played (no content names it)');
    expect(found).toContain('scenes/scn.bark.nobody: scene is never played (no content names it)');
    expect(found.filter((m) => /^scenes\/scn\.(bark|farewell|lt)\./.test(m) && !m.includes('nobody'))).toEqual([]);
  });

  it('reports flags set but never read, read but never set, and unused', () => {
    const d = clone(data);
    d.flags.t_set = { id: 't_set', kind: 'story' };
    d.flags.t_read = { id: 't_read', kind: 'story' };
    d.flags.t_none = { id: 't_none', kind: 'story' };
    const node = d.acts[1]!.nodes[0]!;
    node.effects = [...(node.effects ?? []), { setFlag: 't_set' }];
    node.requires = [...(node.requires ?? []), { not: { flag: { t_read: true } } }];
    const found = messages(d);
    expect(found).toContain('flags.yaml: flag t_set is set but never read');
    expect(found).toContain('flags.yaml: flag t_read is read but never set');
    expect(found).toContain('flags.yaml: flag t_none is neither set nor read');
  });

  it('counts flags the level drafts set and read, and the joined flags the code sets', () => {
    const d = clone(data);
    d.flags.t_wave = { id: 't_wave', kind: 'battle' };
    const map = clone(Object.values(d.maps)[0]!);
    map.triggers = [{ ...map.triggers[0]!, then: [{ action: 'set_flag', flag: 't_wave' }] } as MapDef['triggers'][number]];
    map.reinforcements = [{ ...(map.reinforcements[0] ?? { units: [] }), unlessFlag: 't_wave' } as MapDef['reinforcements'][number]];
    expect(messages(d).filter((m) => m.includes('t_wave'))).toEqual(['flags.yaml: flag t_wave is neither set nor read']);
    expect(messages(d, [map]).filter((m) => m.includes('t_wave'))).toEqual([]);
    expect(messages(d).filter((m) => m.includes('joined_'))).toEqual([]);
  });
});
