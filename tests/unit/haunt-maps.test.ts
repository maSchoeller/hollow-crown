/**
 * Fix 2026-11-09: a haunt on 1-5 rendered flat (the map's `levels` were left out of the haunt map) and showed no foes (they
 * stood under fog on the far sandbank). Every haunt the content can make is built here and checked for both.
 */
import { describe, expect, it } from 'vitest';
import { createHauntBattle, hauntEnemyCount, hauntMapId, hauntPlaces, makeHaunt, newCampaign, seedRng, visibleTiles, posKey } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';

const { data } = loadContentFromDisk();

const cases = Object.values(data.maps).flatMap((map) =>
  (map.haunts ?? []).flatMap((anchor) => Object.values(data.lieutenants).map((lt) => ({ map, anchor, lt }))),
);

function build(i: number) {
  const { map, anchor, lt } = cases[i]!;
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' } as never, { name: 'Rhen', portrait: 'avatar_a' } as never);
  c.completed = ['prologue', 'm1_1', 'm1_2'];
  c.lieutenants = { [lt.id]: { met: true, encounters: 1, grudge: 0, routs: 1, signatureDropped: false } };
  const h = makeHaunt(data, c, map, anchor, lt, 'h1_0', 1, seedRng(3))!;
  c.haunts = [h];
  return { c, h, s: createHauntBattle(data, c, 'h1_0', []) };
}

describe('every haunt (fix 2026-11-09)', () => {
  it('has haunts to check', () => {
    expect(cases.length).toBeGreaterThan(0);
    expect(cases.some(({ map }) => map.levels?.length)).toBe(true);
  });

  it.each(cases.map((x, i) => [`${x.map.id} ${x.anchor.variant} ${x.lt.id}`, i] as const))('%s: foes on the board, in sight, heights kept', (_, i) => {
    const { map, anchor } = cases[i]!;
    const { c, s } = build(i);
    const enemies = s.units.filter((u) => u.team === 'enemy' && u.pos);
    expect(enemies.length).toBe(hauntEnemyCount(data, hauntPlaces(data, map, anchor), c.settings.difficulty));
    expect(enemies.length).toBeGreaterThan(0);
    const seen = visibleTiles(data, s, 'player');
    for (const u of enemies) expect(seen.has(posKey(u.pos!))).toBe(true);

    const hm = data.maps[hauntMapId(map.id, anchor.variant, cases[i]!.lt.id)]!;
    expect(hm.levels).toEqual(map.levels);
    expect(hm.ladders).toEqual(map.ladders);
    expect(hm.terrain).toBe(map.terrain);
    if (map.levels?.length) expect(Object.values(s.levels ?? {}).some((l) => l > 0)).toBe(true);
  });
});
