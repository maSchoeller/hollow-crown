/** Schild der Paktwächter (story 9.11, items.md §5): aura for the neighbours of the bearer; chest reward `chronicle`; N2 as a node. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  availableNodes,
  chronicleView,
  computeStats,
  forecast,
  newCampaign,
  newItem,
  nodeScenes,
  type BattleResult,
  type CampaignState,
  type GameData,
  type Command,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

/** A guard with the relic at (5,5) and a vanguard ally; returns the state and both. */
function setup() {
  const s = arena(data);
  const bearer = place(data, s, 'player', 'marksman', [5, 5], 'iron_bow'); // no class skill that reacts to neighbours
  bearer.equip.offHand = newItem(s, 'pact_warden_shield', data);
  const ally = place(data, s, 'player', 'scout', [6, 5], 'iron_dagger');
  return { s, bearer, ally };
}

describe('Schild der Paktwächter: Schutz für Nachbarn', () => {
  it('is the iron shield in values, sleeping stage 1, unsellable, with the first stage image', () => {
    const r = data.items.pact_warden_shield!;
    const base = data.items.iron_shield!;
    expect([r.kind, r.slot, r.statMods, r.wt]).toEqual([base.kind, base.slot, base.statMods, base.wt]);
    expect(r.tags).toContain('unsellable');
    expect(r.price).toBe(0);
    expect(r.image).toBe('pact_warden_shield_1');
    expect(data.skills[r.grantsSkill!.skill]!.aura).toEqual({ radius: 1 });
  });

  it('gives +2 DEF to allies on directly adjacent tiles, not to the bearer, not further away', () => {
    const { s, bearer, ally } = setup();
    const far = place(data, s, 'player', 'scout', [8, 5], 'iron_dagger');
    const diag = place(data, s, 'player', 'scout', [6, 6], 'iron_dagger');
    const base = (u: typeof ally) => computeStats(data, u).stats.def;
    const now = (u: typeof ally) => computeStats(data, u, { state: s }).stats.def;
    expect(now(ally)).toBe(base(ally) + 2);
    expect(now(far)).toBe(base(far));
    expect(now(diag)).toBe(base(diag) + 2 - 2); // diagonal is not adjacent (Manhattan 2)
    expect(now(bearer)).toBe(base(bearer)); // no aura on himself (base already counts the shield)
  });

  it('works only while the bearer stands: downed, gone or on the other side it gives nothing', () => {
    const { s, bearer, ally } = setup();
    const base = computeStats(data, ally).stats.def;
    bearer.downed = true;
    expect(computeStats(data, ally, { state: s }).stats.def).toBe(base);
    bearer.downed = false;
    bearer.gone = 'dead';
    expect(computeStats(data, ally, { state: s }).stats.def).toBe(base);
    bearer.gone = undefined;
    const foe = place(data, s, 'enemy', 'brigand', [5, 4], 'iron_axe');
    expect(computeStats(data, foe, { state: s }).stats.def).toBe(computeStats(data, foe).stats.def);
    expect(computeStats(data, ally, { state: s }).stats.def).toBe(base + 2);
  });

  it('stacks with a second bearer and follows the tile the unit would fight from (preview)', () => {
    const { s, bearer, ally } = setup();
    const second = place(data, s, 'player', 'marksman', [7, 5], 'iron_bow');
    second.equip.offHand = newItem(s, 'pact_warden_shield', data);
    expect(computeStats(data, ally, { state: s }).stats.def).toBe(computeStats(data, ally).stats.def + 4);
    void bearer;
  });

  it('is part of the fight formula: the same forecast shows the lower damage on the protected ally', () => {
    const { s, ally } = setup();
    const foe = place(data, s, 'enemy', 'brigand', [6, 4], 'iron_axe');
    const protectedHit = forecast(data, s, foe.uid, ally.uid).attacker.damage;
    ally.pos = [9, 4];
    foe.pos = [9, 3];
    const bareHit = forecast(data, s, foe.uid, ally.uid).attacker.damage;
    expect(protectedHit).toBe(Math.max(0, bareHit - 2));
  });
});

describe('Truhenbelohnung chronicle', () => {
  const fresh = (): CampaignState => newCampaign(data, 5, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });

  /** A won mini battle on a copy of the content: a scout opens the chest (or not), the rout objective is met at once. */
  function mission(open: boolean) {
    const d = structuredClone(data);
    const s = arena(d);
    const map = d.maps[s.mapId]!;
    map.objectives.victory = { type: 'rout' };
    map.objects = [{ id: 'c_page', type: 'chest', at: [3, 4], contents: { chronicle: 'a1_watchtower' } }];
    s.objects = [{ id: 'c_page', type: 'chest', at: [3, 4], state: 'closed' }];
    const scout = place(d, s, 'player', 'scout', [3, 3], 'iron_dagger');
    const commands: Command[] = open
      ? [{ type: 'act', unit: scout.uid, to: scout.pos!, action: { kind: 'open', object: 'c_page' } }]
      : [{ type: 'act', unit: scout.uid, to: scout.pos!, action: { kind: 'wait' } }];
    const c = fresh();
    const r = applyCampaign(d, c, { type: 'finishMission', start: s, commands });
    const result = (r.events.find((e) => e.t === 'missionFinished') as { result: BattleResult }).result;
    return { r, result, d };
  }

  it('hands the page over through the effect when the chest was opened and the mission is won', () => {
    const { r, result, d } = mission(true);
    expect(result.outcome).toBe('victory');
    expect(r.campaign.chronicle).toEqual(['a1_watchtower']);
    expect(r.events).toContainEqual({ t: 'chronicleAdded', page: 'a1_watchtower' });
    expect(result.effects).toContainEqual({ chronicle: 'a1_watchtower' });
    expect(chronicleView(d, r.campaign).found).toBe(1);
  });

  it('loses the page for the campaign when the mission is won with the chest shut', () => {
    const { r } = mission(false);
    expect(r.campaign.chronicle).toEqual([]);
    expect(r.events.some((e) => e.t === 'chronicleAdded')).toBe(false);
  });
});

describe('Nebenquest N2 als Knoten', () => {
  it('opens after mission 1-3 (synthetic state: the node comes with another session) and never lapses', () => {
    const d = structuredClone(data);
    d.campaign.nodes.push({ id: 'm1_3', map: 'prologue_paktnacht', titleKey: 'node.prologue.title', kind: 'story', merchantTier: 0, expectedLevel: 3 });
    const c = newCampaign(d, 5, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    c.completed = ['prologue', 'm1_1'];
    expect(availableNodes(d, c).map((n) => n.id)).not.toContain('n2');
    c.completed.push('m1_3', 'ch01', 'n1', 'n3');
    expect(availableNodes(d, c).map((n) => n.id)).toContain('n2');
    c.completed.push('n2');
    expect(availableNodes(d, c).map((n) => n.id)).not.toContain('n2');
  });

  it('pays the ember spark with the victory, the page and the relic only from the chests, plays no memorial variant', () => {
    const n = data.campaign.nodes.find((x) => x.id === 'n2')!;
    expect(n.effects).toEqual([{ item: { def: 'ember_spark' } }]);
    expect(n.memorialIf).toBeUndefined();
    expect(n.place).toBe('wachturm');
    const m = data.maps.n2_wachturm!;
    expect(m.objectives.victory.type).toBe('seize');
    expect(m.objects.find((o) => o.id === 'c_page')!.contents).toMatchObject({ chronicle: 'a1_watchtower', dialogue: 'scn.n2.page' });
    expect(m.objects.find((o) => o.id === 'c_relic')!.contents).toMatchObject({ item: { def: 'pact_warden_shield' }, dialogue: 'scn.n2.relic' });
    expect(nodeScenes(data, null, 'n2')).toEqual({ pre: 'scn.n2.intro', post: 'scn.n2.outro' });
    expect(data.chronicle.a1_watchtower).toBeTruthy();
  });
});
