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
  reachable,
  applyCommand,
  type BattleState,
  type CampaignState,
  type GameData,
} from '../../src/core';
import { clone, neighbors } from '../../src/core/util';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'easy', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  for (const id of ['lucan', 'brenna', 'tobin', 'fenn', 'mira', 'liora', 'varek']) addToRoster(data, base, id);
  base.completed = ['prologue', 'm1_1', 'm1_2', 'm1_3', 'm1_4', 'm1_5', 'm1_6'];
});

describe('node m1_7', () => {
  it('follows m1_6 and is the only node open after it; the world map place is bound to it', () => {
    const node = data.campaign.nodes.find((n) => n.id === 'm1_7')!;
    expect(node.requires).toEqual([{ completed: 'm1_6' }]);
    expect(node.effects).toEqual([{ setFlag: 'wardens_chronicle' }]);
    expect(availableNodes(data, base).filter((n) => n.kind !== 'side').map((n) => n.id)).toEqual(['m1_7']);
    // the finale follows (story 9.9): the only node open after 1-7
    expect(availableNodes(data, { ...base, completed: [...base.completed, 'm1_7'] }).filter((n) => n.kind !== 'side').map((n) => n.id)).toEqual(['m1_8']);
    expect(availableNodes(data, { ...base, completed: ['prologue', 'm1_1', 'm1_2', 'm1_3', 'm1_4', 'm1_5'] }).filter((n) => n.kind !== 'side').map((n) => n.id)).not.toContain('m1_7');
  });

  it('sets wardens_chronicle on a victory only, never on the collapse', () => {
    let won: CampaignState | null = null;
    // starts at the first seed autoplay won (2026-11-06); seeds 1 to 4 lost and cost four whole battles. A balancing change that
    // makes seed 5 lose only moves the search on, the range is as wide as before.
    for (let seed = 5; seed < 24 && !won; seed++) {
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
    const lost = autoplay(data, { ...start, turn: 9 });
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

describe('the collapse', () => {
  const battle = () => {
    const s = beginBattle(data, base, 'm1_7', base.roster.map((u) => u.id)).state;
    for (const u of s.units) if (u.team === 'enemy') Object.assign(u, { gone: 'dead', pos: null });
    return s;
  };
  /** the state after `turn` has begun */
  const at = (s: BattleState, turn: number) => {
    const n = clone(s);
    n.turn = turn - 1;
    n.phase = 'player';
    return applyCommand(data, n, { type: 'endPhase' }).state;
  };
  const ter = (s: BattleState, x: number, y: number) => s.terrain[y * s.width + x];

  it('quakes in round 4 and brings the chambers down from the north, one part a round', () => {
    const s = battle();
    const r4 = at(s, 4);
    expect(r4.firedTriggers).toContain('t_quake');
    expect(ter(r4, 4, 2)).not.toBe('rockwall');
    const r5 = at(r4, 5);
    expect(ter(r5, 4, 2)).toBe('rockwall');
    expect(ter(r5, 11, 3)).toBe('rockwall');
    expect(ter(r5, 2, 7)).not.toBe('rockwall');
    const r6 = at(r5, 6);
    expect(ter(r6, 2, 7)).toBe('rockwall');
    expect(ter(r6, 13, 7)).toBe('rockwall');
    expect(ter(r6, 2, 13)).not.toBe('rockwall');
    const r7 = at(r6, 7);
    expect(ter(r7, 2, 13)).toBe('rockwall');
    expect(ter(r7, 13, 13)).toBe('rockwall');
  });

  it('keeps the main corridor and the way to the chronicle open to the end', () => {
    let s = battle();
    for (const turn of [4, 5, 6, 7]) s = at(s, turn);
    for (let y = 1; y <= 18; y++) expect(ter(s, 7, y), `7,${y}`).not.toBe('rockwall');
    const lucan = s.units.find((u) => u.id === 'lucan')!;
    lucan.pos = [7, 18];
    lucan.acted = false;
    lucan.moved = false;
    expect([...reachable(data, s, lucan, [7, 18], 30).keys()]).toContain('7,2');
  });

  it('leaves a tile under a figure standing, and pushes nobody', () => {
    const s = battle();
    const lucan = s.units.find((u) => u.id === 'lucan')!;
    lucan.pos = [4, 2];
    const r5 = at(s, 5);
    expect(r5.units.find((u) => u.id === 'lucan')!.pos).toEqual([4, 2]);
    expect(ter(r5, 4, 2)).not.toBe('rockwall');
    expect(ter(r5, 4, 3)).toBe('rockwall');
  });

  it('buries a side chest for good: nobody reaches it, the chronicle still wins the battle', () => {
    let s = battle();
    for (const turn of [4, 5, 6, 7]) s = at(s, turn);
    const u = s.units.find((x) => x.id === 'fenn')!;
    u.pos = [7, 13];
    const tiles = [...reachable(data, s, u, [7, 13], 40).keys()];
    for (const c of ['c_w1', 'c_e1', 'c_w2', 'c_e2']) {
      const at = s.objects.find((o) => o.id === c)!.at;
      expect(tiles).not.toContain(`${at[0]},${at[1]}`);
      for (const n of neighbors(at)) expect(tiles).not.toContain(`${n[0]},${n[1]}`);
    }
    expect(s.objects.find((o) => o.id === 'c_chronicle')!.state).toBe('closed');
    expect(tiles).toContain('7,2');
  });
});

describe('map m1_7_gewoelbe', () => {
  it('is a treasure hunt for the chronicle alone in 8 turns without a placeholder defeat; the other chests are the side goal; the chronicle chest holds nothing', () => {
    const m = data.maps['m1_7_gewoelbe']!;
    expect(m.objectives.victory).toEqual({ type: 'treasure', chests: ['c_chronicle'], turns: 8 });
    expect(m.objectives.defeat.some((d) => d.type === 'turn_limit')).toBe(false);
    expect(m.objectives.side.some((s) => s.id === 's_chests' && s.type === 'open_chests')).toBe(true);
    expect(m.objects.find((o) => o.id === 'c_chronicle')!.contents).toBeUndefined();
    expect(m.levels ?? []).toEqual([]);
  });

  it('has relief terrain that does not heal, and one-time triggers', () => {
    expect(data.terrain.relief!.heal).toBe(0);
    const m = data.maps['m1_7_gewoelbe']!;
    expect(m.terrain).not.toContain('shrine');
    expect(m.triggers.map((t) => t.id).sort()).toEqual(['t_chronicle', 't_collapse_king', 't_collapse_lower', 't_collapse_upper', 't_quake', 't_relief_crypt', 't_relief_west']);
    expect(m.triggers.find((t) => t.id === 't_quake')!.when).toEqual({ type: 'turn_start', turn: 4, phase: 'player' });
    const tile = (x: number, y: number) => m.legend[m.terrain.split('\n')[y]![x]!];
    expect([tile(1, 6), tile(14, 12)]).toEqual(['relief', 'relief']);
    const area = (id: string) => (m.triggers.find((t) => t.id === id)!.when as { area: unknown }).area;
    expect(area('t_relief_west')).toEqual({ rect: [1, 6, 1, 6] });
    expect(area('t_relief_crypt')).toEqual({ rect: [14, 12, 14, 12] });
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
