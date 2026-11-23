/**
 * What hangs on a figure (story 16.15, `src/render/shared/unitGear.ts`): the board's battle units and the figure sheet's roster
 * records are dressed by the same code: weapon, off-hand piece, the metal and runes of the items, the stance key.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { newCampaign, newItem, type CampaignState, type GameData, type ItemInstance } from '../../src/core';
import { gearOf, offHandOf, unitStanceKey, weaponOf } from '../../src/render/shared/unitGear';
import { arena, place } from '../fixtures/arena';

let data: GameData;
let c: CampaignState;
const item = (id: string, runes: Array<string | null> = []): ItemInstance => ({ ...newItem(c, id, data), runes });

beforeAll(() => {
  data = loadContentFromDisk().data;
  c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

describe('unit gear (shared by the board and the dress-up doll)', () => {
  it('dresses a roster record and a battle unit with the same pieces', () => {
    const s = arena(data);
    const b = place(data, s, 'player', 'vanguard', [3, 3]);
    b.equip.mainHand = item('iron_axe', ['fire_rune_2', 'edge_rune']);
    b.equip.offHand = item('iron_shield', ['wind_rune_2']);
    const record = { classId: b.classId, equip: { mainHand: b.equip.mainHand, offHand: b.equip.offHand } };
    const pieces = gearOf(data, b);
    expect(gearOf(data, record)).toEqual(pieces);
    expect(unitStanceKey(data, record)).toBe(unitStanceKey(data, b));
    // weapon first, then the off-hand piece, each carrying its runes
    const [w, o] = pieces;
    expect(w && 'rune' in w && w.rune?.main?.element).toBe('fire');
    expect(o && 'rune' in o && o.rune?.main?.element).toBe('wind');
    expect(weaponOf(data, record)).toBeDefined();
    expect(offHandOf(data, record)).toBeDefined();
  });

  it('a shield adds to the stance key, an unarmed figure has none, and a rune changes the pieces', () => {
    const plain = { classId: 'vanguard', equip: { mainHand: item('iron_sword') } };
    expect(unitStanceKey(data, plain)).toMatch(/^[a-z]+$/);
    const shielded = { classId: 'vanguard', equip: { mainHand: item('iron_sword'), offHand: item('iron_shield') } };
    expect(unitStanceKey(data, shielded)).toBe(`${unitStanceKey(data, plain)}_shield`);
    expect(unitStanceKey(data, { classId: 'vanguard', equip: {} })).toBe('none');
    expect(gearOf(data, { classId: 'vanguard', equip: {} }).filter((p) => 'hand' in p)).toEqual([]);
    const runed = { classId: 'vanguard', equip: { mainHand: item('iron_sword', ['fire_rune_1']) } };
    expect(gearOf(data, runed)).not.toEqual(gearOf(data, plain));
  });
});
