/**
 * QA act 2 (2026-11-13): the three dead ends the automated run found, each as an invariant.
 * 1. A side quest hanging on a companion opens even when that companion was never recruited (`not: { recruited: … }`);
 *    N4 and N6 are checked order by order in act2-campaign-order.test.ts, the condition itself here.
 * 2. A `treasure` map brings one key per chest (or a scout of its own), so a key spent on the wrong chest never takes
 *    the victory away (2-2 "Das Siegel im Salzpass" had one key for three chests).
 * 3. The deploy slots of a haunt are picked for every move type of the company, not for `foot` alone.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import type { Locales } from '../../src/content/load';
import {
  buildHauntMap,
  companyMoveTypes,
  conditionContext,
  evalConditions,
  newCampaign,
  posKey,
  type CampaignState,
  type GameData,
  type MapDef,
} from '../../src/core';

let data: GameData;
let locales: Locales;
beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

const campaign = (): CampaignState =>
  newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });

describe('the condition recruited (QA act 2, 2026-11-13)', () => {
  const holds = (c: CampaignState, id: string) => evalConditions(conditionContext(data, c), [{ recruited: id }]);

  it('is true for a companion in the roster, among the fallen or among the gone, false for one who never joined', () => {
    const c = campaign();
    expect(holds(c, 'ilka')).toBe(false);
    expect(holds({ ...c, roster: [...c.roster, { ...c.roster[0]!, id: 'ilka' }] }, 'ilka')).toBe(true);
    expect(holds({ ...c, fallen: [{ id: 'ilka', nameKey: 'unit.ilka.name', node: 'm2_1' }] }, 'ilka')).toBe(true);
    expect(holds({ ...c, left: ['ilka'] }, 'ilka')).toBe(true);
  });

  it('opens N4 and N6 for a company that never spoke to Ilka or Jory', () => {
    const c = campaign();
    for (const [node, who] of [
      ['n4', 'ilka'],
      ['n6', 'jory'],
    ] as const) {
      const requires = data.acts[2]!.nodes.find((n) => n.id === node)!.requires!;
      const companion = requires.filter((r) => JSON.stringify(r).includes(who));
      expect(companion.length, `${node} has a condition on ${who}`).toBe(1);
      expect(evalConditions(conditionContext(data, c), companion), `${node} opens without ${who}`).toBe(true);
    }
  });
});

describe('treasure maps bring one key per chest (QA act 2, 2026-11-13)', () => {
  /** Key charges the map itself hands out: player units, forced characters, village rewards and foes that drop one on every difficulty. */
  const keys = (map: MapDef): number => {
    const charges = (defs: readonly { def: string }[]) =>
      defs.reduce((n, r) => n + (data.items[r.def]?.use?.open?.includes('chest') ? (data.items[r.def]?.charges ?? 1) : 0), 0);
    const everywhere = (d?: string[]) => !d || (['easy', 'normal', 'hard'] as const).every((x) => d.includes(x));
    return (
      map.units.filter((u) => u.team === 'player').reduce((n, u) => n + charges(u.items), 0) +
      map.deploy.forced.reduce((n, id) => n + charges(data.chars[id]?.items ?? []), 0) +
      map.objects.reduce((n, o) => n + (o.type === 'village' && o.reward?.item ? charges([o.reward.item]) : 0), 0) +
      map.units
        .filter((u) => u.team === 'enemy' && everywhere(u.difficulty))
        .reduce((n, u) => n + (u.drops ?? []).reduce((m, i) => m + (u.items[i] ? charges([u.items[i]!]) : 0), 0), 0)
    );
  };
  const treasureMaps = () => Object.values(data.maps).filter((m) => !m.id.includes('~') && m.objectives.victory.type === 'treasure');

  it('every treasure map of the content has at least as many keys as chests', () => {
    expect(treasureMaps().length).toBeGreaterThan(0);
    for (const map of treasureMaps()) {
      const chests = map.objects.filter((o) => o.type === 'chest').length;
      const scout = map.units.some((u) => u.team === 'player' && data.classes[u.class]?.classAction?.id === 'open_steal');
      if (!scout) expect(keys(map), `${map.id}: ${chests} chests`).toBeGreaterThanOrEqual(chests);
    }
  });

  it('content:check rejects a treasure map with fewer keys than chests', () => {
    const m2_2 = data.maps.m2_2_salzpass!;
    const stripped: MapDef = {
      ...m2_2,
      units: m2_2.units.map((u) => (u.id === 'purser' ? u : { ...u, items: u.items.filter((i) => i.def !== 'door_key'), drops: [] })),
    };
    const messages = validateContent({ ...data, maps: { ...data.maps, [m2_2.id]: stripped } }, locales).map((i) => i.message);
    expect(messages.filter((m) => m.includes('key(s) for'))).toEqual(['treasure: 1 key(s) for 3 chests (a key is spent on the wrong chest and the victory is gone); bring one key per chest or a scout']);
    expect(validateContent(data, locales).map((i) => i.message).filter((m) => m.includes('key(s) for'))).toEqual([]);
  });
});

describe('haunt deploy slots follow the move types of the company (QA act 2, 2026-11-13)', () => {
  /** A tiny board whose deploy area mixes plain ground with shallows (`foot` 3, `armored` closed). */
  const board = (): MapDef => ({
    id: 'dev_haunt_slots',
    act: 1,
    nameKey: 'map.m1_1.name',
    size: [6, 6],
    fog: false,
    legend: { '.': 'plain', '~': 'shallows' },
    terrain: ['..~...', '......', '......', '......', '......', '......'].join('\n'),
    objects: [],
    initialEffects: [],
    deploy: { max: 5, forced: [], slots: [[0, 5]] },
    units: [],
    pairs: [],
    reinforcements: [],
    objectives: { victory: { type: 'rout' }, defeat: [], side: [] },
    triggers: [],
    goldReward: 0,
    haunts: [{ variant: 'rout', target: { at: [3, 3] }, enemySpawn: { rect: [0, 3, 5, 3] }, deploy: { rect: [0, 0, 5, 0] } }],
  });

  it('leaves out a tile only some of the company could stand on', () => {
    const map = board();
    const d = { ...data, maps: { ...data.maps, [map.id]: map } };
    const lt = Object.keys(d.lieutenants)[0]!;
    const slots = buildHauntMap(d, map.id, 'rout', lt)!.deploy.slots.map(posKey);
    // shallows is open to foot but closed to armour: it is no slot for a list the whole company deploys from
    expect(companyMoveTypes(d)).toContain('armored');
    expect(slots).not.toContain('2,0');
    expect(slots).toEqual(['0,0', '1,0', '3,0', '4,0', '5,0']);
  });
});
