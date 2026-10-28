/** `survive` and `defend` end before the round limit once no foe is left and none can still arrive (waves, spawn triggers). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { checkObjectives, createBattle, newCampaign, type BattleState, type GameData, type GameEvent } from '../../src/core';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

function battle(nodeId: string): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  return createBattle(data, c, nodeId, ['avatar', 'kael']);
}
/** Takes every foe off the board, as if all were beaten. */
function clearFoes(s: BattleState): void {
  for (const u of s.units) if (u.team === 'enemy' && !u.ignoreForRout) u.gone = 'dead';
}
function check(s: BattleState, phaseStart = false): GameEvent[] {
  const events: GameEvent[] = [];
  checkObjectives(data, s, events, phaseStart);
  return events;
}

describe('early victory of survive and defend', () => {
  it('survive: not while foes stand, not while a wave is still due', () => {
    const s = battle('m1_5');
    expect(check(s)).toEqual([]);
    clearFoes(s);
    s.turn = 2; // the wave of round 3 is still to come
    expect(check(s)).toEqual([]);
    expect(s.outcome).toBeNull();
  });

  it('survive: won as soon as the last foe falls and the last wave is through, Varek (ignoreForRout) does not count', () => {
    const s = battle('m1_5');
    clearFoes(s);
    s.turn = 3;
    s.phase = 'player';
    s.reinforcementsDone = data.maps.m1_5_hungerlager!.reinforcements.map((_, i) => i);
    expect(s.units.some((u) => u.id === 'varek' && u.gone !== 'dead')).toBe(true);
    expect(check(s)).toEqual([{ t: 'battleEnd', outcome: 'victory', reason: undefined }]);
    expect(s.outcome).toBe('victory');
  });

  it('defend: a foe still on the map keeps the battle going', () => {
    const s = battle('m1_8');
    s.turn = 9;
    s.reinforcementsDone = data.maps.m1_8_paktwacht_halten!.reinforcements.map((_, i) => i);
    check(s);
    expect(s.outcome).toBeNull();
  });

  it('defend: won early after the last wave when all foes are beaten', () => {
    const s = battle('m1_8');
    clearFoes(s);
    s.turn = 9;
    s.reinforcementsDone = data.maps.m1_8_paktwacht_halten!.reinforcements.map((_, i) => i);
    check(s);
    expect(s.outcome).toBe('victory');
  });

  it('defend: a lost ward still loses first', () => {
    const s = battle('m1_8');
    clearFoes(s);
    s.turn = 9;
    s.reinforcementsDone = data.maps.m1_8_paktwacht_halten!.reinforcements.map((_, i) => i);
    s.units.find((u) => u.id === 'steward')!.gone = 'dead';
    check(s);
    expect(s.outcome).toBe('defeat');
  });

  it('a spawn trigger that can still fire holds the victory back; a timed one in the past does not', () => {
    const s = battle('m1_8');
    const map = data.maps.m1_8_paktwacht_halten!;
    const was = map.triggers;
    try {
      map.triggers = [{ id: 't_spawn', when: { type: 'turn_start', turn: 5, phase: 'enemy' }, then: [{ action: 'spawn', units: [] }] }];
      clearFoes(s);
      s.turn = 4;
      s.reinforcementsDone = map.reinforcements.map((_, i) => i);
      check(s);
      expect(s.outcome).toBeNull();
      s.turn = 6;
      check(s);
      expect(s.outcome).toBe('victory');
    } finally {
      map.triggers = was;
    }
  });
});
