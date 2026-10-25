import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  bleedsOut,
  beginBattle,
  deathless,
  finishBattle,
  getUnit,
  knockOut,
  newCampaign,
  startOfPhase,
  type BattleState,
  type BattleUnit,
  type CampaignState,
  type DeathMode,
  type GameData,
  type GameEvent,
} from '../../src/core';

/** Map flag `noDeath` (PO decision 2026-10-25): tutorial companions stay downed and return, Rhen and Kael still lose the mission. */
let data: GameData;

function setup(deathMode: DeathMode): { c: CampaignState; s: BattleState } {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  return { c, s };
}

const companion = (s: BattleState, skip?: BattleUnit): BattleUnit =>
  s.units.find((x) => x.team === 'player' && x.pos && x !== skip && !x.flags.includes('mustSurvive') && !['avatar', 'kael'].includes(x.id))!;

const down = (s: BattleState, u: BattleUnit): GameEvent[] => {
  const events: GameEvent[] = [];
  u.hp = 0;
  knockOut(data, s, u, events);
  return events;
};

describe('noDeath map flag', () => {
  beforeAll(() => {
    data = loadContentFromDisk().data;
  });

  it('is set on the prologue map', () => {
    expect(data.maps[data.campaign.nodes.find((n) => n.id === 'prologue')!.map]!.noDeath).toBe(true);
  });

  it.each<DeathMode>(['standard', 'classic', 'casual'])('downs a companion without death in %s and never bleeds', (mode) => {
    const { s } = setup(mode);
    const u = companion(s);
    const events = down(s, u);
    expect(u.downed).toBe(true);
    expect(u.gone).toBeUndefined();
    expect(events).toContainEqual({ t: 'downed', unit: u.uid });
    expect(deathless(data, s, u)).toBe(true);
    expect(bleedsOut(data, s, u)).toBe(false);
    const more: GameEvent[] = [];
    for (let i = 0; i < data.balance.death.bleedOutTurns + 2; i++) startOfPhase(data, s, 'player', more);
    expect(more.some((e) => e.t === 'bleed' || e.t === 'died')).toBe(false);
    expect(u.downed).toBe(true);
    expect(u.gone).toBeUndefined();
  });

  it('survives further hits and counts the down only once', () => {
    const { s } = setup('standard');
    const u = companion(s);
    down(s, u);
    const events = down(s, u);
    expect(u.gone).toBeUndefined();
    expect(u.downed).toBe(true);
    expect(events).toEqual([]);
    expect(s.stats.downs).toBe(1);
  });

  it('survives two scars (no instant death)', () => {
    const { s } = setup('standard');
    const u = companion(s);
    u.scars = data.campaign.scars.slice(0, data.balance.death.scarsUntilInstantDeath).map((x) => x.id);
    down(s, u);
    expect(u.downed).toBe(true);
    expect(u.gone).toBeUndefined();
  });

  it('keeps Rhen and Kael as before: bleed out and death lose the mission', () => {
    for (const id of ['avatar', 'kael']) {
      const { s } = setup('standard');
      const u = getUnit(s, id);
      expect(deathless(data, s, u)).toBe(false);
      expect(bleedsOut(data, s, u)).toBe(true);
      down(s, u);
      expect(s.outcome).toBe('defeat');
    }
  });

  it('brings a companion left downed back after a won mission, without scar or fallen entry', () => {
    const { c, s } = setup('standard');
    const u = companion(s);
    down(s, u);
    s.outcome = 'victory';
    const { campaign, result } = finishBattle(data, c, s);
    const rec = campaign.roster.find((r) => r.id === u.id)!;
    expect(rec).toBeDefined();
    expect(rec.scars).toHaveLength(0);
    expect(campaign.fallen.some((f) => f.id === u.id)).toBe(false);
    expect(result.fallen).toEqual([]);
    expect(result.scars).toEqual([]);
  });

  it('without the flag the same downed unit still dies after the mission', () => {
    const { c, s } = setup('standard');
    const map = data.maps[s.mapId]!;
    map.noDeath = false;
    try {
      const u = companion(s);
      down(s, u);
      s.outcome = 'victory';
      const { campaign } = finishBattle(data, c, s);
      expect(campaign.roster.some((r) => r.id === u.id)).toBe(false);
    } finally {
      map.noDeath = true;
    }
  });
});
