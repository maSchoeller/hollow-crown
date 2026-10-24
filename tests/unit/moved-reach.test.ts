/** A unit that already moved (convoy, trade) must not be offered a second move: its reach is its own tile. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { applyCommand, beginBattle, destinations, getUnit, newCampaign, reachNow, validate, type GameData } from '../../src/core';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('reach of a unit that already moved', () => {
  it('is only its own tile, and a wait there is valid after a move', () => {
    const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
    const u = s.units.find((x) => x.team === 'player')!;
    const fresh = destinations(s, u, reachNow(data, s, u));
    expect(fresh.length).toBeGreaterThan(1);
    const to = fresh.find((p) => p[0] !== u.pos![0] || p[1] !== u.pos![1])!;

    const moved = applyCommand(data, s, { type: 'move', unit: u.uid, to }).state;
    const mu = getUnit(moved, u.uid);
    expect(mu.moved).toBe(true);
    expect(mu.acted).toBe(false);
    expect(destinations(moved, mu, reachNow(data, moved, mu))).toEqual([mu.pos]);
    expect(validate(data, moved, { type: 'act', unit: mu.uid, to: mu.pos!, action: { kind: 'wait' } })).toBeNull();
    expect(validate(data, moved, { type: 'act', unit: mu.uid, to: fresh[0]!.every((v, i) => v === mu.pos![i]) ? fresh[1]! : fresh[0]!, action: { kind: 'wait' } })).toBe('already_moved');
  });
});
