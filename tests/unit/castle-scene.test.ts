/**
 * Story 10.14: what the castle shows. `castleScene` is a pure view of the campaign — the level of every room, the castle
 * tier and the state of every companion's keepsake (there, mourned, gone, never joined).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { CASTLE_PLACES, castleScene, clone, memorialStones, newCampaign, type CampaignState, type GameData } from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** the castle of act 2 with the given room levels */
function castle(rooms: Record<string, number> = {}): CampaignState {
  const c = clone(base);
  c.act = 2;
  c.home = { kind: 'castle', rooms };
  return c;
}

const stateOf = (c: CampaignState, char: string) => castleScene(data, c).keepsakes.find((k) => k.char === char);

describe('castleScene (story 10.14)', () => {
  it('gives every companion but the Avatar and Lucan a place of the castle model', () => {
    const scene = castleScene(data, castle());
    expect(scene.keepsakes).toHaveLength(15);
    expect(scene.keepsakes.map((k) => k.id).sort()).toEqual([...CASTLE_PLACES].sort());
    expect(scene.keepsakes.map((k) => k.char)).not.toContain('avatar');
    expect(scene.keepsakes.map((k) => k.char)).not.toContain('lucan');
    expect(data.chars.avatar!.homeObject).toBeUndefined();
    expect(data.chars.lucan!.homeObject).toBeUndefined();
  });

  it('shows the keepsake of a companion who is with the company and nothing of one who never joined', () => {
    const c = castle();
    expect(stateOf(c, 'brenna')).toEqual({ id: 'axe', char: 'brenna', state: 'present', stone: false });
    // Sable joins in act 2 and is not in the roster of a fresh campaign
    expect(stateOf(c, 'sable')).toEqual({ id: 'sabre', char: 'sable', state: 'none', stone: false });
  });

  it('leaves the keepsake of a fallen companion lying, mourned, and the memorial hall has his stone', () => {
    const c = castle();
    c.roster = c.roster.filter((u) => u.id !== 'brenna');
    c.fallen.push({ id: 'brenna', nameKey: 'unit.brenna.name', node: 'm1_2' });
    expect(stateOf(c, 'brenna')).toEqual({ id: 'axe', char: 'brenna', state: 'mourned', stone: true });
    expect(memorialStones(data, c).some((s) => s.key === 'fallen:brenna')).toBe(true);
  });

  it('takes the keepsake of a companion who left away, without a stone', () => {
    const c = castle();
    c.roster = c.roster.filter((u) => u.id !== 'varek');
    c.left.push('varek');
    expect(stateOf(c, 'varek')).toEqual({ id: 'dice', char: 'varek', state: 'gone', stone: false });
    expect(memorialStones(data, c).some((s) => s.key === 'fallen:varek')).toBe(false);
  });

  it('counts a fallen companion as fallen even when he is listed as left as well', () => {
    const c = castle();
    c.roster = c.roster.filter((u) => u.id !== 'varek');
    c.left.push('varek');
    c.fallen.push({ id: 'varek', nameKey: 'unit.varek.name', node: 'm1_3' });
    expect(stateOf(c, 'varek')?.state).toBe('mourned');
  });

  it('gives mercenaries no place', () => {
    const c = castle();
    c.fallen.push({ id: 'merc1', nameKey: 'unit.merc.name', node: 'm1_2', mercenary: true });
    const scene = castleScene(data, c);
    expect(scene.keepsakes.some((k) => k.char === 'merc1')).toBe(false);
    expect(scene.keepsakes).toHaveLength(15);
  });

  it('gives every castle room its level, 0 for one the act does not have yet, and the castle tier', () => {
    const scene = castleScene(data, castle({ smith: 3, tavern: 2 }));
    expect(scene.rooms.smith).toBe(3);
    expect(scene.rooms.tavern).toBe(2);
    // a room of the castle that is not built up yet still shows at level 1
    expect(scene.rooms.campfire).toBe(1);
    expect(scene.tier).toBe(1);
    // the camp of act 1 has no castle rooms at all
    const camp = castleScene(data, base);
    expect(camp.tier).toBe(0);
    expect(camp.rooms.academy).toBe(0);
  });

  it('reads nothing but the home, the roster, the fallen and those who left', () => {
    const c = castle({ smith: 2 });
    const before = castleScene(data, c);
    c.gold += 500;
    c.heritageGiven.push({ stone: 'fallen:brenna', to: 'tobin', heritage: 'grit' } as unknown as (typeof c.heritageGiven)[number]);
    expect(castleScene(data, c)).toEqual(before);
  });
});
