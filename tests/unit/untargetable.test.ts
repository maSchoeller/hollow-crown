/** Map units with `untargetable` (story 9.6): the children of the hunger camp (mission 1-5) are never attacked by a foe. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { attackTargets, createBattle, itemTargets, newCampaign, runAiPhase, type BattleState, type GameData, type GameEvent } from '../../src/core';

let data: GameData;

const battle = (): BattleState => {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  return createBattle(data, c, 'm1_5', c.roster.map((r) => r.id));
};

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('untargetable children in mission 1-5', () => {
  it('the map has three children on the side of the civilians, flagged untargetable', () => {
    const s = battle();
    const kids = s.units.filter((u) => u.id.startsWith('child'));
    expect(kids).toHaveLength(3);
    for (const k of kids) expect(k).toMatchObject({ team: 'other', untargetable: true, classId: 'civilian' });
  });

  it('a foe next to a child cannot attack it (only the flag keeps it out of the target list)', () => {
    const s = battle();
    const child = s.units.find((u) => u.id === 'child1')!;
    const foe = s.units.find((u) => u.id === 'h1')!;
    foe.pos = [child.pos![0] + 1, child.pos![1]];
    expect(Object.keys(attackTargets(data, s, foe, foe.pos))).not.toContain(child.uid);
    child.untargetable = false;
    expect(Object.keys(attackTargets(data, s, foe, foe.pos))).toContain(child.uid);
  });

  it('damaging items of a foe never offer a child', () => {
    const s = battle();
    const child = s.units.find((u) => u.id === 'child1')!;
    const foe = s.units.find((u) => u.id === 'h1')!;
    foe.pos = [child.pos![0] + 1, child.pos![1]];
    foe.bag.push({ uid: 'bomb', def: 'fire_bomb', charges: 3 } as never);
    expect(itemTargets(data, s, foe, foe.pos, 'bomb')).not.toContain(child.uid);
  });

  it('whole enemy phases leave the children untouched', () => {
    const s = battle();
    const kids = s.units.filter((u) => u.id.startsWith('child'));
    const full = kids.map((k) => k.hp);
    // the foes stand right beside the children, in reach of an attack
    const foes = s.units.filter((u) => u.team === 'enemy' && /^h[0-9]$/.test(u.id));
    kids.forEach((k, i) => {
      const f = foes[i]!;
      f.pos = [k.pos![0], k.pos![1] + 1];
      f.ai = { profile: 'aggressive' };
    });
    for (let round = 0; round < 3; round++) {
      const events: GameEvent[] = [];
      for (const u of s.units) u.acted = false;
      runAiPhase(data, s, 'enemy', events);
      if (s.outcome) break;
    }
    expect(kids.map((k) => k.hp)).toEqual(full);
    expect(kids.every((k) => !k.downed && k.gone === undefined)).toBe(true);
  });
});
