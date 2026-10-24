import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  beginBattle,
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

let data: GameData;
const MAX = () => data.balance.death.bleedOutTurns;

function setup(deathMode: DeathMode): { c: CampaignState; s: BattleState } {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  return { c, s };
}

/** A deployed player unit that is neither the avatar nor Kael. */
function companion(s: BattleState): BattleUnit {
  const u = s.units.find((x) => x.team === 'player' && x.pos && !x.flags.includes('mustSurvive'));
  if (!u) throw new Error('no companion in the prologue');
  return u;
}

const down = (s: BattleState, u: BattleUnit): GameEvent[] => {
  const events: GameEvent[] = [];
  u.hp = 0;
  knockOut(data, s, u, events);
  return events;
};

describe('bleed-out (story 1.6)', () => {
  beforeAll(() => {
    data = loadContentFromDisk().data;
  });

  it('reads the countdown from balance.death.bleedOutTurns (3, GDD)', () => {
    expect(MAX()).toBe(3);
  });

  it('downs a unit in Standard with a zeroed counter and a downed event', () => {
    const { s } = setup('standard');
    const u = companion(s);
    const events = down(s, u);
    expect(u.downed).toBe(true);
    expect(u.bleed).toBe(0);
    expect(events).toContainEqual({ t: 'downed', unit: u.uid });
  });

  it('counts only the unit\'s own phases and reports the counter', () => {
    const { s } = setup('standard');
    const u = companion(s);
    down(s, u);
    const enemy: GameEvent[] = [];
    startOfPhase(data, s, 'enemy', enemy);
    expect(u.bleed).toBe(0);
    expect(enemy.some((e) => e.t === 'bleed')).toBe(false);
    const own: GameEvent[] = [];
    startOfPhase(data, s, 'player', own);
    expect(u.bleed).toBe(1);
    expect(own).toContainEqual({ t: 'bleed', unit: u.uid, turns: 1, max: MAX() });
    expect(u.downed).toBe(true);
  });

  it('dies when the counter reaches bleedOutTurns', () => {
    const { s } = setup('standard');
    const u = companion(s);
    down(s, u);
    const events: GameEvent[] = [];
    for (let i = 0; i < MAX() - 1; i++) startOfPhase(data, s, 'player', events);
    expect(u.gone).toBeUndefined();
    expect(u.downed).toBe(true);
    startOfPhase(data, s, 'player', events);
    expect(u.gone).toBe('dead');
    expect(u.downed).toBe(false);
    expect(events.filter((e) => e.t === 'bleed')).toHaveLength(MAX());
    expect(events).toContainEqual({ t: 'died', unit: u.uid });
  });

  it('kills a downed unit with any further hit', () => {
    const { s } = setup('standard');
    const u = companion(s);
    down(s, u);
    const events = down(s, u);
    expect(u.gone).toBe('dead');
    expect(events).toContainEqual({ t: 'died', unit: u.uid });
  });

  it('does not bleed after being rescued', () => {
    const { s } = setup('standard');
    const u = companion(s);
    down(s, u);
    u.gone = 'rescued';
    u.downed = false;
    const events: GameEvent[] = [];
    startOfPhase(data, s, 'player', events);
    expect(events.some((e) => e.t === 'bleed')).toBe(false);
    expect(u.gone).toBe('rescued');
  });

  it('a rescued unit comes home with a scar; one that bled out is fallen', () => {
    const { c, s } = setup('standard');
    const saved = companion(s);
    const lost = s.units.find((x) => x.team === 'player' && x.pos && x !== saved && !x.flags.includes('mustSurvive'))!;
    down(s, saved);
    down(s, lost);
    saved.gone = 'rescued';
    saved.downed = false;
    for (let i = 0; i < MAX(); i++) startOfPhase(data, s, 'player', []);
    s.outcome = 'victory';
    const { campaign, result } = finishBattle(data, c, s);
    expect(campaign.roster.find((r) => r.id === saved.id)!.scars).toHaveLength(1);
    expect(result.scars.map((x) => x.id)).toContain(saved.id);
    expect(campaign.roster.some((r) => r.id === lost.id)).toBe(false);
    expect(result.fallen.map((x) => x.id)).toContain(lost.id);
  });

  it('a unit with two scars dies at once instead of bleeding', () => {
    const { s } = setup('standard');
    const u = companion(s);
    u.scars = data.campaign.scars.slice(0, data.balance.death.scarsUntilInstantDeath).map((x) => x.id);
    const events = down(s, u);
    expect(u.gone).toBe('dead');
    expect(u.downed).toBe(false);
    expect(events.some((e) => e.t === 'downed')).toBe(false);
  });

  it('keeps the avatar and Kael at 0 HP a defeat', () => {
    for (const id of ['avatar', 'kael']) {
      const { s } = setup('standard');
      const u = getUnit(s, id);
      down(s, u);
      expect(s.outcome).toBe('defeat');
    }
  });

  it('does not use the counter in Classic (dead at once) or Casual (retreat)', () => {
    const classic = setup('classic');
    const a = companion(classic.s);
    down(classic.s, a);
    expect(a.gone).toBe('dead');
    const casual = setup('casual');
    const b = companion(casual.s);
    const events = down(casual.s, b);
    expect(b.gone).toBe('retreated');
    startOfPhase(data, casual.s, 'player', events);
    expect(events.some((e) => e.t === 'bleed')).toBe(false);
  });

  it('honours a different bleedOutTurns from the data', () => {
    const { s } = setup('standard');
    const u = companion(s);
    down(s, u);
    const old = data.balance.death.bleedOutTurns;
    data.balance.death.bleedOutTurns = 1;
    try {
      startOfPhase(data, s, 'player', []);
      expect(u.gone).toBe('dead');
    } finally {
      data.balance.death.bleedOutTurns = old;
    }
  });
});
