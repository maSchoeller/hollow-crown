/** The simulator player for `defend` (story 9.9 follow-up): the line it holds in front of the ward, found without map coordinates. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { wardLine } from '../../src/core/ai/wardLine';
import { autoCommand } from '../../src/core/ai/autoplay';
import { beginBattle, newCampaign, type GameData } from '../../src/core';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

function start(mapId: string) {
  const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  return beginBattle(data, c, mapId, c.roster.map((u) => u.id)).state;
}

describe('wardLine', () => {
  it('finds the narrow line in front of the steward of 1-8 (inner gate), with the keep behind it', () => {
    const s = start('m1_8');
    const ward = s.units.find((u) => u.id === 'steward')!;
    const line = wardLine(data, s, ward.pos!, s.units.filter((u) => u.team === 'enemy' && u.pos).map((u) => u.pos!))!;
    expect(line).not.toBeNull();
    expect(line.cut.length).toBeLessThanOrEqual(data.balance.ai.wardLineMax);
    // every tile of the line lies north of the outer wall and the keep behind it holds the ward
    expect(line.cut.every(([, y]) => y <= 5)).toBe(true);
    expect(line.inside.has(`${ward.pos![0]},${ward.pos![1]}`)).toBe(true);
  });

  it('has no line in an open village (1-2): the company crowds the elder as before', () => {
    const s = start('m1_2');
    const ward = s.units.find((u) => u.id === 'elder')!;
    expect(wardLine(data, s, ward.pos!, s.units.filter((u) => u.team === 'enemy' && u.pos).map((u) => u.pos!))).toBeNull();
  });

  it('plays deterministically: the same state gives the same command', () => {
    const s = start('m1_8');
    expect(autoCommand(data, s)).toEqual(autoCommand(data, s));
  });
});
