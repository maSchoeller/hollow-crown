/** Story 9.8: node m1_7 (reachability, flag wardens_chronicle on victory only), the sealed chronicle entry, map facts (relief terrain, triggers, key supply). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  addToRoster,
  applyCampaign,
  autoplay,
  availableNodes,
  beginBattle,
  chronicleView,
  newCampaign,
  normalizeCampaign,
  type CampaignState,
  type GameData,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'easy', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  for (const id of ['kael', 'brenna', 'tobin', 'fenn', 'mira', 'liora', 'varek']) addToRoster(data, base, id);
  base.completed = ['prologue', 'm1_1', 'ch01', 'ch02', 'm1_6'];
});

describe('node m1_7', () => {
  it('follows m1_6 and is the only node open after it; the world map place is bound to it', () => {
    const node = data.campaign.nodes.find((n) => n.id === 'm1_7')!;
    expect(node.requires).toEqual([{ completed: 'm1_6' }]);
    expect(node.effects).toEqual([{ setFlag: 'wardens_chronicle' }]);
    expect(availableNodes(data, base).map((n) => n.id)).toEqual(['m1_7']);
    // the finale follows (story 9.9): the only node open after 1-7
    expect(availableNodes(data, { ...base, completed: [...base.completed, 'm1_7'] }).map((n) => n.id)).toEqual(['m1_8']);
    expect(availableNodes(data, { ...base, completed: ['prologue', 'm1_1', 'ch01', 'ch02'] }).map((n) => n.id)).not.toContain('m1_7');
  });

  it('sets wardens_chronicle on a victory only, never on the collapse', () => {
    let won: CampaignState | null = null;
    for (let seed = 1; seed < 20 && !won; seed++) {
      const start = beginBattle(data, { ...base, seed }, 'm1_7', base.roster.map((u) => u.id)).state;
      const played = autoplay(data, start);
      if (played.state.outcome !== 'victory') continue;
      won = applyCampaign(data, { ...base, seed }, { type: 'finishMission', start, commands: played.log }).campaign;
    }
    expect(won).not.toBeNull();
    expect(won!.flags.wardens_chronicle).toBe(true);
    expect(won!.completed).toContain('m1_7');
    // the collapse: nobody acts, the turn limit ends the battle in defeat and the campaign stays as it was
    const start = beginBattle(data, base, 'm1_7', base.roster.map((u) => u.id)).state;
    const lost = autoplay(data, { ...start, turn: 15 });
    expect(lost.state.outcome).toBe('defeat');
    expect(lost.state.defeatReason).toBe('turns');
    expect(base.flags.wardens_chronicle).toBeUndefined();
  });
});

describe('sealed chronicle entry', () => {
  it('appears with the flag and counts neither as found nor in the total', () => {
    const before = chronicleView(data, base);
    expect(before.acts[0]!.sealed).toEqual([]);
    const c = applyCampaign(data, base, { type: 'effects', effects: [{ setFlag: 'wardens_chronicle' }] }).campaign;
    const v = chronicleView(data, c);
    expect(v.acts.find((a) => a.act === 1)!.sealed).toEqual(['wardens_chronicle']);
    expect(v.found).toBe(before.found);
    expect(v.total).toBe(before.total);
    expect(v.total).toBe(data.balance.chronicle.seasonPages);
    expect(v.acts.find((a) => a.act === 1)!.pages).toEqual([]);
  });

  it('survives saving and loading', () => {
    const c = applyCampaign(data, base, { type: 'effects', effects: [{ setFlag: 'wardens_chronicle' }] }).campaign;
    const loaded = normalizeCampaign(data, JSON.parse(JSON.stringify(c)));
    expect(chronicleView(data, loaded).acts[0]!.sealed).toEqual(['wardens_chronicle']);
  });
});

describe('map m1_7_gewoelbe', () => {
  it('is a treasure hunt of five chests in 14 turns without a placeholder defeat or s_chests; the chronicle chest holds nothing', () => {
    const m = data.maps['m1_7_gewoelbe']!;
    expect(m.objectives.victory).toEqual({ type: 'treasure', chests: ['c_west', 'c_east', 'c_crypt_w', 'c_crypt_e', 'c_chronicle'], turns: 14 });
    expect(m.objectives.defeat.some((d) => d.type === 'turn_limit')).toBe(false);
    expect(m.objectives.side.some((s) => s.id === 's_chests')).toBe(false);
    expect(m.objects.find((o) => o.id === 'c_chronicle')!.contents).toBeUndefined();
  });

  it('has relief terrain that does not heal, and one-time triggers', () => {
    expect(data.terrain.relief!.heal).toBe(0);
    const m = data.maps['m1_7_gewoelbe']!;
    expect(m.terrain).not.toContain('shrine');
    expect(m.triggers.map((t) => t.id).sort()).toEqual(['t_chronicle', 't_collapse', 't_relief_crypt', 't_relief_west']);
    expect(m.triggers.find((t) => t.id === 't_collapse')!.when).toEqual({ type: 'turn_start', turn: 2, phase: 'player' });
  });

  it('supplies more keys than locks without a scout, on every difficulty', () => {
    const m = data.maps['m1_7_gewoelbe']!;
    const locks = m.objects.filter((o) => o.type === 'door' || o.type === 'chest').length - 1; // c_chronicle holds nothing, but needs a key too
    const all = [...m.units, ...m.reinforcements.flatMap((r) => r.units)].filter((u) => u.team === 'enemy');
    for (const d of ['easy', 'normal', 'hard'] as const) {
      const keys = all
        .filter((u) => !u.difficulty || u.difficulty.includes(d))
        .reduce((n, u) => n + (u.drops ?? []).filter((i) => u.items[i]?.def === 'door_key').length, 0);
      expect(keys).toBeGreaterThan(locks + 1);
    }
  });
});
