/** Context bands (story 2.7): order, one band per target, reasons, nothing without a possibility, nothing from the fog. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  availableActions,
  beginBattle,
  bleedLeft,
  computeStats,
  contextEntries,
  newCampaign,
  newItem,
  visibleState,
  type ActionOption,
  type BattleState,
  type BattleUnit,
  type GameData,
  type Pos,
} from '../../src/core';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

function arena(): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  for (const u of s.units) u.pos = null;
  s.units.forEach((u) => (u.gone = 'retreated'));
  s.outcome = null;
  s.lockedRoles = [];
  s.terrain = s.terrain.map(() => 'plain');
  s.objects = [];
  s.loot = [];
  s.timers = {};
  return s;
}

function place(s: BattleState, team: 'player' | 'enemy', classId: string, at: Pos): BattleUnit {
  const u = s.units.find((x) => x.gone === 'retreated' && x.pos === null && (team === 'player' ? x.team === 'player' : x.team === 'enemy'));
  if (!u) throw new Error('out of units');
  u.gone = undefined;
  u.pos = at;
  u.classId = classId;
  u.equip = {};
  u.bag = [];
  u.acted = false;
  u.moved = false;
  u.downed = false;
  u.status = [];
  u.buffs = [];
  u.flags = [];
  u.hp = computeStats(data, u).maxHp;
  return u;
}

const down = (u: BattleUnit, bleed: number) => {
  u.downed = true;
  u.bleed = bleed;
};
const bands = (s: BattleState, u: BattleUnit, opts?: ActionOption[]) => contextEntries(data, s, opts ?? availableActions(data, s, u, u.pos!));

describe('contextEntries', () => {
  it('gives no band when the tile offers nothing but the dock', () => {
    const s = arena();
    const u = place(s, 'player', 'vanguard', [3, 3]);
    expect(bands(s, u)).toEqual([]);
  });

  it('puts the most urgent downed ally first and names how many own phases are left', () => {
    const s = arena();
    const u = place(s, 'player', 'healer', [3, 3]);
    const a = place(s, 'player', 'vanguard', [4, 3]);
    const b = place(s, 'player', 'scout', [2, 3]);
    down(a, 0);
    down(b, 1);
    const e = bands(s, u);
    expect(e.map((x) => x.id)).toEqual([`rescue:${b.uid}`, `rescue:${a.uid}`]);
    expect(e[0]!.option.targets).toEqual([b.uid]);
    expect(e[0]!.reason).toEqual({ key: 'ui.ctx.rescueSub', params: { n: data.balance.death.bleedOutTurns - 1 } });
    expect(bleedLeft(data, a)).toBe(data.balance.death.bleedOutTurns);
  });

  it('uses the singular text for the last phase', () => {
    const s = arena();
    const u = place(s, 'player', 'healer', [3, 3]);
    const a = place(s, 'player', 'vanguard', [4, 3]);
    down(a, data.balance.death.bleedOutTurns - 1);
    expect(bands(s, u)[0]!.reason).toEqual({ key: 'ui.ctx.rescueSub1', params: { n: 1 } });
  });

  it('orders Bergen before Ansprechen before Besuchen before Öffnen, then the older bands', () => {
    const s = arena();
    const u = place(s, 'player', 'scout', [3, 3]);
    const ally = place(s, 'player', 'vanguard', [2, 3]);
    down(ally, 0);
    const foe = place(s, 'enemy', 'vanguard', [4, 3]);
    foe.recruit = { by: 'any' } as BattleUnit['recruit'];
    s.objects.push({ id: 'v1', type: 'village', at: [3, 3], state: 'closed' });
    s.objects.push({ id: 'c1', type: 'chest', at: [3, 4], state: 'closed' });
    const kinds = bands(s, u).map((x) => x.kind);
    expect(kinds.slice(0, 4)).toEqual(['rescue', 'talk', 'visit', 'open']);
    // sorting is independent of the order the options come in
    const shuffled = [...availableActions(data, s, u, u.pos!)].reverse();
    expect(bands(s, u, shuffled).map((x) => x.kind)).toEqual(kinds);
  });

  it('offers Öffnen with a key to anyone and names the key, the scout the lock', () => {
    const s = arena();
    const knight = place(s, 'player', 'vanguard', [3, 3]);
    s.objects.push({ id: 'c1', type: 'chest', at: [3, 3], state: 'closed' });
    expect(bands(s, knight)).toEqual([]);
    knight.bag.push(newItem(s, 'door_key', data));
    expect(bands(s, knight).map((x) => [x.kind, x.reason!.key])).toEqual([['chest', 'ui.ctx.chestSub']]);
    const scout = place(s, 'player', 'scout', [3, 4]);
    expect(bands(s, scout).filter((x) => x.kind === 'open').map((x) => [x.kind, x.reason!.key])).toEqual([['open', 'ui.ctx.open.chestSub']]);
  });

  it('shows nothing from the fog', () => {
    const s = arena();
    const u = place(s, 'player', 'healer', [0, 0]);
    const a = place(s, 'player', 'vanguard', [1, 0]);
    down(a, 0);
    expect(bands(s, u)).toHaveLength(1);
    // the UI builds its options on the visible state: with the ally hidden there is no band
    const hidden = { ...s, units: s.units.filter((x) => x.uid !== a.uid) };
    expect(contextEntries(data, hidden, availableActions(data, hidden, u, u.pos!))).toEqual([]);
    expect(visibleState(data, s, 'player')).toBe(s);
  });
});
