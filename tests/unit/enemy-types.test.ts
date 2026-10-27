/** Act 1 enemy types (story 2.9): brigand (axe), mercenary = skirmisher (sword), wolf rider on foot (lance). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { GameData, MapUnitDef } from '../../src/core';
import type { Locales } from '../../src/content/load';

let data: GameData;
let locales: Locales;
beforeAll(() => {
  ({ data, locales } = loadContentFromDisk());
});

const enemies = (mapId: string): MapUnitDef[] => {
  const m = data.maps[mapId]!;
  return [...m.units, ...m.reinforcements.flatMap((r) => r.units)].filter((u) => u.team === 'enemy');
};

describe('act 1 enemy classes', () => {
  it('wolf_rider is an enemy-only role class on foot with a lance and no mounted effectiveness', () => {
    const c = data.classes.wolf_rider!;
    expect(c).toMatchObject({ id: 'wolf_rider', role: 'wolf_rider', tier: 'base', moveType: 'foot', playable: false });
    expect(c.weaponGroups).toEqual(['lance']);
    expect(c.classAction).toBeUndefined();
    expect(c.tags).not.toContain('mounted');
    expect(c.mov).toBeGreaterThanOrEqual(data.classes.brigand!.mov);
    expect(c.base.spd).toBeGreaterThan(data.classes.skirmisher!.base.spd);
    expect(c.base.def).toBeLessThanOrEqual(data.classes.skirmisher!.base.def);
    expect(data.classes.mercenary).toBeUndefined(); // the id stays a legacy id of skirmisher
    expect(data.classes.skirmisher!.legacyIds).toContain('mercenary');
  });

  it('keeps the three types apart by weapon group', () => {
    expect(data.classes.brigand!.weaponGroups).toEqual(['axe']);
    expect(data.classes.skirmisher!.weaponGroups).toEqual(['sword', 'dagger']);
    expect(data.classes.wolf_rider!.weaponGroups).toEqual(['lance']);
  });

  it('names the class in both locales', () => {
    expect(locales.de!['class.wolf_rider.name']).toBe('Wolfsreiter');
    expect(locales.en!['class.wolf_rider.name']).toBeTruthy();
  });

  it('gives every wolf rider on the shipped maps aggressive profiles and a lance, never mounted-effective gear', () => {
    for (const id of Object.keys(data.maps)) {
      const riders = enemies(id).filter((u) => u.class === 'wolf_rider');
      for (const u of riders) {
        expect(['aggressive', 'hunt']).toContain(u.ai?.profile);
        expect(u.items.map((i) => data.items[i.def]!.group)).toEqual(['lance']);
        for (const i of u.items) expect(data.items[i.def]!.effectiveVs ?? []).not.toContain('mounted');
      }
    }
    expect(enemies('prologue_paktnacht').some((u) => u.class === 'wolf_rider')).toBe(false);
  });

  it('content loading reports no issues', () => {
    expect(loadContentFromDisk().issues).toEqual([]);
  });
});
