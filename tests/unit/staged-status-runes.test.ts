/** Staged mechanics `status` and `runes` (Story 9.6 follow-up): both apply from the 3rd completed story mission, in any order. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyStatus,
  armorAffinity,
  autoplay,
  beginBattle,
  computeStats,
  forecast,
  getUnit,
  lockedMechanics,
  newCampaign,
  weaponProfile,
  type BattleState,
  type CampaignState,
  type GameData,
  type GameEvent,
} from '../../src/core';

let data: GameData;
let campaign: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  campaign = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

const battle = (locked: BattleState['locked']): BattleState => {
  const s = beginBattle(data, campaign, 'prologue', campaign.roster.map((u) => u.id)).state;
  const kael = getUnit(s, 'kael');
  const foe = s.units.find((u) => u.id === 'tg2')!;
  foe.pos = [kael.pos![0], kael.pos![1] - 1];
  kael.equip.mainHand!.runes = ['fire_rune_2'];
  return { ...s, locked };
};

describe('status and runes are staged by completed story missions', () => {
  it('both are locked until the 3rd story mission, whatever the order of the missions', () => {
    const at = (...completed: string[]) => lockedMechanics(data, { ...campaign, completed });
    expect(at()).toEqual(expect.arrayContaining(['status', 'runes']));
    expect(at('prologue', 'm1_1')).toEqual(expect.arrayContaining(['status', 'runes']));
    expect(at('prologue', 'm1_1', 'm1_2')).not.toContain('status');
    expect(at('prologue', 'm1_1', 'm1_2')).not.toContain('runes');
    expect(at('m1_3', 'prologue', 'm1_1')).not.toContain('status');
    expect(at('m1_3', 'prologue', 'm1_1')).not.toContain('runes');
  });

  it('a status is not applied while locked, and is applied once introduced', () => {
    const kael = (s: BattleState) => getUnit(s, 'kael');
    const events: GameEvent[] = [];
    const locked = battle(['status']);
    expect(applyStatus(data, locked, kael(locked), 'wet', events)).toBe(false);
    expect(kael(locked).status).toEqual([]);
    expect(events).toEqual([]);
    const open = battle([]);
    expect(applyStatus(data, open, kael(open), 'wet', events)).toBe(true);
    expect(kael(open).status.map((x) => x.id)).toEqual(['wet']);
  });

  it('the forecast offers no status chance while status is locked (elements stay on), and one when open', () => {
    const f = (locked: BattleState['locked']) => {
      const s = battle(locked);
      return forecast(data, s, 'kael', s.units.find((u) => u.id === 'tg2')!.uid).attacker;
    };
    expect(f(['status']).element).toBe('fire');
    expect(f(['status']).status).toEqual([]);
    expect(f([]).status).toEqual([{ status: 'burning', chance: data.balance.status.rune2StatusChance }]);
  });

  it('a set rune has no effect while runes are locked: no element, no status, no affinity', () => {
    const s = battle(['runes']);
    const w = getUnit(s, 'kael').equip.mainHand!;
    expect(weaponProfile(data, w).element).toBe('fire'); // without a battle state the rune counts (camp, shop)
    expect(weaponProfile(data, w, s).element).toBeUndefined();
    const f = forecast(data, s, 'kael', s.units.find((u) => u.id === 'tg2')!.uid).attacker;
    expect(f.element).toBeUndefined();
    expect(f.status).toEqual([]);
    expect(weaponProfile(data, w, { locked: [] }).element).toBe('fire');
    const kael = getUnit(s, 'kael');
    kael.equip.body = { uid: 'vest', def: 'leather_vest', upgrade: 0, affixes: [], runes: ['wind_rune_1'] };
    expect(armorAffinity(data, kael)).toBe('wind');
    expect(armorAffinity(data, kael, s)).toBeUndefined();
    expect(computeStats(data, kael, { state: s }).affinity).toBe(kael.affinity);
  });

  it('a battle with the new locks replays identically', () => {
    const run = () => autoplay(data, beginBattle(data, campaign, 'prologue', campaign.roster.map((u) => u.id)).state).state;
    const a = run();
    const b = run();
    expect(a.locked).toEqual(expect.arrayContaining(['status', 'runes']));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
