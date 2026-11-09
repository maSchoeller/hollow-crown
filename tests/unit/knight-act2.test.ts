/**
 * Story 11.7: the knight of the Silver Lance (class `knight`, on foot, steel lance) is checked on level 8 to 20, the span of act 2. He
 * shrugs off a sword of his own level but stays open to an axe (weapon triangle), to magic (low RES) and to the armour-piercer
 * (effective against `armored`). Lab scenario: tests/fixtures/lab/ritter-akt2.yaml (`pnpm lab ritter-akt2 --forecast lab_axe lab_knight`).
 */
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { forecast, type GameData } from '../../src/core';
import { buildLab } from '../../src/lab/scenario';
import { fixtureMapsFromDisk } from '../../src/lab/node';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

type Raw = { add: Array<{ id: string; level: number }> };
const raw = (): Raw => parse(readFileSync('tests/fixtures/lab/ritter-akt2.yaml', 'utf8')) as Raw;

/** Damage a full exchange would deal to the knight (every strike hits) and that of one strike. */
function blow(level: number, attacker: string) {
  const sc = raw();
  for (const u of sc.add) u.level = level;
  const { state } = buildLab(structuredClone(data), sc, fixtureMapsFromDisk(), 'ritter-akt2');
  const knight = state.units.find((u) => u.uid === 'lab_knight')!;
  const f = forecast(data, state, attacker, 'lab_knight');
  return { hit: f.attacker.damage, total: knight.hp - f.defenderHpAfter, hp: knight.hp };
}

describe('knight of act 2 on level 8 to 20', () => {
  for (const level of [8, 12, 16, 20]) {
    it(`level ${level}: a sword barely scratches him, axe, magic and armour-piercer hurt`, () => {
      const sword = blow(level, 'lab_sword');
      expect(sword.hit).toBeLessThanOrEqual(3);
      for (const a of ['lab_axe', 'lab_mage', 'lab_piercer']) {
        const b = blow(level, a);
        // at least four more per strike than the sword, and one exchange takes a quarter of his HP or more
        expect(b.hit, a).toBeGreaterThanOrEqual(sword.hit + 4);
        expect(b.total, a).toBeGreaterThanOrEqual(Math.ceil(b.hp / 4));
      }
    });
  }
});
