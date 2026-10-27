/** The simulator player carries downed allies off the field (Standard: they bleed out otherwise). */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { autoCommand } from '../../src/core/ai/autoplay';
import { beginBattle, newCampaign, type GameData } from '../../src/core';
import type { BattleState } from '../../src/core/state';
import { dist } from '../../src/core/util';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

function start(mapId: string): BattleState {
  const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  return beginBattle(data, c, mapId, c.roster.map((u) => u.id)).state;
}

describe('autoCommand rescue', () => {
  it('rescues a downed ally lying next to a free unit', () => {
    const s = structuredClone(start('m1_2'));
    s.units = s.units.filter((u) => u.team === 'player' || !u.pos);
    const players = s.units.filter((u) => u.team === 'player' && u.pos);
    const downed = players[players.length - 1]!;
    downed.downed = true;
    downed.hp = 0;
    const cmd = autoCommand(data, s);
    expect(cmd.type).toBe('act');
    if (cmd.type !== 'act') return;
    expect(['rescue', 'farRescue']).toContain(cmd.action.kind);
    expect((cmd.action as { target: string }).target).toBe(downed.uid);
    expect(dist(cmd.to, downed.pos!)).toBeLessThanOrEqual(2);
  });

  it('is deterministic', () => {
    const s = structuredClone(start('m1_2'));
    s.units.filter((u) => u.team === 'player' && u.pos).at(-1)!.downed = true;
    expect(autoCommand(data, s)).toEqual(autoCommand(data, s));
  });
});
