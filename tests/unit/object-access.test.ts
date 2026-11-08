import { describe, expect, it } from 'vitest';
import type { MapDef } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { mapTerr, validateObjectAccess } from '../../src/content/validateWalk';

const { data } = loadContentFromDisk();

/** Problems of the object check for m1_5 with `patch` applied to a copy of it. */
function problems(patch: (m: MapDef) => void): string[] {
  const m = structuredClone(data.maps.m1_5_hungerlager!) as MapDef;
  patch(m);
  const out: string[] = [];
  validateObjectAccess(data, m, mapTerr(data, m), (_f, msg) => out.push(msg));
  return out;
}

const chest = (m: MapDef) => m.objects.find((o) => o.id === 'c_stores')!;

describe('content:check – objects the company uses must be reachable (PO find m1_5, 2026-11-08)', () => {
  it('the shipped m1_5 is clean: c_stores stands beside the supply tent', () => {
    expect(chest(data.maps.m1_5_hungerlager as MapDef).at).toEqual([7, 0]);
    expect(problems(() => {})).toEqual([]);
  });

  it('a chest in a tent is reported (it opens only from its own tile)', () => {
    expect(problems((m) => (chest(m).at = [8, 0]))).toEqual([expect.stringMatching(/c_stores: chest on stall at 8,0/)]);
  });

  it('a chest on a walkable tile the company cannot walk to is reported', () => {
    // the creek west of the north-west swamp isle: walled in by water
    const rows = (m: MapDef) => m.terrain.replace(/\r/g, '').split('\n');
    const p = problems((m) => {
      const r = rows(m);
      r[0] = '~,~' + r[0]!.slice(3);
      r[1] = '~~~' + r[1]!.slice(3);
      m.terrain = r.join('\n');
      chest(m).at = [1, 0];
    });
    expect(p).toEqual([expect.stringMatching(/c_stores: chest at 1,0 not reachable on foot/)]);
  });

  it('a chest under a civilian who holds his tile is reported', () => {
    expect(problems((m) => (chest(m).at = [12, 1]))).toEqual([expect.stringMatching(/lies under a civilian/)]);
  });
});
