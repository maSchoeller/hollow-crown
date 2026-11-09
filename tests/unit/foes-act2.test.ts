/**
 * Story 11.7: foes and haunts of act 2. The pools of act 2 have no fliers and no riders and use steel; `pegasus_knight` is kept for
 * season 2 (content:check); a haunt of act 2 on a map of act 1 has its foes on `hauntLevel`, the act-2 civilian and chests, and the
 * board shows autumn because the battle carries the campaign's act. Act 1 stays as it was.
 */
import { describe, expect, it } from 'vitest';
import { createHauntBattle, hauntLevel, hauntPoolsFor, makeHaunt, newCampaign, seedRng, type CampaignState, type GameData, type HauntVariant } from '../../src/core';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import { battleSeason } from '../../src/content/season';

const { data, locales } = loadContentFromDisk();
const MET = { met: true, encounters: 1, grudge: 0, routs: 0, signatureDropped: false };

function act2Haunt(d: GameData, lt: string, variant: HauntVariant, map = 'm1_2_erlbach'): CampaignState {
  const c = newCampaign(d, 5, { difficulty: 'normal', deathMode: 'standard' } as never, { name: 'Rhen', portrait: 'avatar_a' } as never);
  c.act = 2;
  c.completed = d.acts[1]!.nodes.map((n) => n.id);
  c.lieutenants = { [lt]: { ...MET } };
  const anchor = d.maps[map]!.haunts!.find((a) => a.variant === variant)!;
  c.haunts = [makeHaunt(d, c, d.maps[map]!, anchor, d.lieutenants[lt]!, 'h1_0', 1, seedRng(4))!];
  return c;
}

describe('foes of act 2 (story 11.7)', () => {
  it('pools of act 2: the four factions, on foot, steel weapons, the knight in the Silver Lance', () => {
    const pools = data.hauntPools[2]!;
    expect(Object.keys(pools.factions).sort()).toEqual(['free_blades', 'iron_march', 'silver_lance', 'silver_sea']);
    for (const types of Object.values(pools.factions))
      for (const t of types) {
        expect(['flier', 'mounted']).not.toContain(data.classes[t.class]!.moveType);
        expect(t.items.every((i) => i.def.startsWith('steel_'))).toBe(true);
      }
    expect(pools.factions.silver_lance!.some((t) => t.class === 'knight')).toBe(true);
    expect(data.classes.pegasus_knight?.season2).toBe(true);
    expect(data.classes.cavalier).toBeUndefined();
  });

  it('content:check keeps pegasus_knight off every pool and map and fliers out of act 2', () => {
    expect(validateContent(data, locales)).toEqual([]);
    const d = structuredClone(data);
    d.hauntPools[2]!.factions.silver_lance![0]!.class = 'pegasus_knight';
    d.hauntPools[2]!.factions.silver_sea![0]!.class = 'drake_young';
    const msgs = validateContent(d, locales).map((i) => i.message);
    expect(msgs.some((m) => m.includes('pegasus_knight is kept for season 2'))).toBe(true);
    expect(msgs.some((m) => m.includes('drake_young (flier) does not occur from act 2 on'))).toBe(true);
  });

  it('a haunt of act 2 on a map of act 1: foes on hauntLevel, the lieutenant armed, act-2 civilian and chests, autumn', () => {
    const c = act2Haunt(data, 'rowena', 'defend');
    const h = c.haunts[0]!;
    const level = hauntLevel(data, c);
    expect(h.enemies.filter((e) => !e.lieutenant).every((e) => e.level === level && data.hauntPools[2]!.factions.silver_lance!.some((t) => t.class === e.class))).toBe(true);
    const s = createHauntBattle(data, c, h.id, c.roster.map((u) => u.id));
    expect(s.act).toBe(2);
    expect(s.hauntLevel).toBe(level);
    const rowena = s.units.find((u) => u.id === 'rowena')!;
    expect(rowena.equip.mainHand?.def).toMatch(/lance/);
    expect(s.units.some((u) => u.team === 'other')).toBe(true);
    const map = data.maps[s.mapId]!;
    expect(map.act).toBe(1);
    expect(battleSeason(data.render, map, s)).toBe('autumn');
    expect(hauntPoolsFor(data, 1, 'rowena')).toBe(data.hauntPools[2]);
  });

  it('treasure of act 2 holds the act-2 loot', () => {
    const c = act2Haunt(data, 'grell', 'treasure');
    const s = createHauntBattle(data, c, c.haunts[0]!.id, c.roster.map((u) => u.id));
    const chests = data.maps[s.mapId]!.objects.filter((o) => o.type === 'chest');
    expect(chests[0]!.contents).toEqual({ gold: data.hauntPools[2]!.chestLoot[0]!.gold });
  });

  it('act 1 is unchanged: an act-1 lieutenant in act 1 brings the act-1 pools and summer', () => {
    expect(hauntPoolsFor(data, 1, 'hask')).toBe(data.hauntPools[1]);
    expect(battleSeason(data.render, data.maps.m1_2_erlbach!, {})).toBe('summer');
    expect(battleSeason(data.render, data.maps.m1_2_erlbach!, { act: 2 })).toBe('autumn');
  });
});
