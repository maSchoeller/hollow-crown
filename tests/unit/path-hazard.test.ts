/** Of two ways of the same cost the path search keeps the one around harmful tiles (fire); reach and cost stay as they are. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  beginBattle,
  newCampaign,
  pathTo,
  posKey,
  reachable,
  type BattleState,
  type BattleUnit,
  type GameData,
  type Pos,
} from '../../src/core';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

/** An open plain field with a single unit of the player on [2, 2]. */
function field(): { s: BattleState; u: BattleUnit } {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  const u = s.units.find((x) => x.team === 'player' && data.classes[x.classId]!.moveType !== 'flier')!;
  s.units = [u];
  s.objects = [];
  delete s.levels;
  s.terrain = s.terrain.map(() => 'plain');
  u.pos = [2, 2];
  return { s, u };
}

const set = (s: BattleState, p: Pos, id: string) => {
  s.terrain[p[1] * s.width + p[0]] = id;
};

/** A harmless terrain that costs this unit as much as a burning tile. */
function sameCostAsFire(u: BattleUnit): string {
  const mt = data.classes[u.classId]!.moveType;
  const fire = data.terrain.burning!.cost[mt];
  const id = Object.values(data.terrain).find((t) => t.id !== 'burning' && t.cost[mt] === fire && !t.connector && !t.opensTo)?.id;
  if (!id) throw new Error(`no terrain costs ${fire} for ${mt}`);
  return id;
}

describe('path search around harmful tiles', () => {
  // both ways to [3, 3] cost the same: over [3, 2] or over [2, 3]; fire lies on one of them, in both orders
  it.each([
    { fire: [3, 2] as Pos, other: [2, 3] as Pos },
    { fire: [2, 3] as Pos, other: [3, 2] as Pos },
  ])('takes the way without fire when both cost the same (fire on $fire)', ({ fire, other }) => {
    const { s, u } = field();
    set(s, fire, 'burning');
    set(s, other, sameCostAsFire(u));
    const reach = reachable(data, s, u);
    const path = pathTo(reach, [3, 3]);
    expect(path).toEqual([[2, 2], other, [3, 3]]);
    expect(reach.get(posKey([3, 3]))!.hazard).toBe(0);
    // the move walks the way the preview shows
    const r = applyCommand(data, s, { type: 'move', unit: u.uid, to: [3, 3] });
    const moved = r.events.find((e) => e.t === 'moved');
    expect(moved && moved.t === 'moved' ? moved.path : null).toEqual(path);
  });

  it('keeps the shorter way through the fire', () => {
    const { s, u } = field();
    set(s, [3, 2], 'burning');
    const reach = reachable(data, s, u);
    expect(pathTo(reach, [4, 2])).toEqual([[2, 2], [3, 2], [4, 2]]);
    expect(reach.get(posKey([4, 2]))!.hazard).toBe(1);
  });

  it('does not change what is reachable or its cost', () => {
    const { s, u } = field();
    const before = reachable(data, s, u);
    set(s, [3, 2], 'burning');
    set(s, [2, 3], sameCostAsFire(u));
    const plain = field();
    set(plain.s, [3, 2], sameCostAsFire(u));
    set(plain.s, [2, 3], sameCostAsFire(u));
    const withFire = reachable(data, s, u);
    const without = reachable(data, plain.s, plain.u);
    expect(before.size).toBeGreaterThan(4);
    expect([...withFire.keys()].sort()).toEqual([...without.keys()].sort());
    for (const [k, n] of without) expect(withFire.get(k)!.cost).toBe(n.cost);
  });
});
