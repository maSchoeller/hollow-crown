/** Escape objective: the lord leaves last (concept/06 §5), and the simulator can win such a map. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  autoplay,
  availableActions,
  beginBattle,
  newCampaign,
  validate,
  type BattleState,
  type BattleUnit,
  type GameData,
  type Pos,
} from '../../src/core';

let base: GameData;
let data: GameData;

/** Prologue with every unit removed; tests place their own on a flat row, the exit is the row's last tile. */
function arena(min?: number): { s: BattleState; row: Pos[] } {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  for (const u of s.units) {
    u.pos = null;
    u.gone = 'retreated';
  }
  s.outcome = null;
  s.lockedRoles = [];
  let row: Pos[] = [];
  for (let y = 0; y < s.height && !row.length; y++)
    for (let x0 = 0; x0 + 6 <= s.width && !row.length; x0++) {
      const r: Pos[] = Array.from({ length: 6 }, (_, i) => [x0 + i, y] as Pos);
      if (r.every((p) => data.terrain[s.terrain[p[1] * s.width + p[0]]!]?.cost.foot === 1)) row = r;
    }
  const exit = row[5]!;
  const map = base.maps[s.mapId]!;
  data = {
    ...base,
    maps: { ...base.maps, [s.mapId]: { ...map, objectives: { ...map.objectives, defeat: [], victory: { type: 'escape', area: { tiles: [exit] }, ...(min ? { min } : {}) } } } },
  };
  return { s, row };
}

function put(s: BattleState, at: Pos, lord: boolean): BattleUnit {
  const u = s.units.find((x) => x.team === 'player' && x.gone === 'retreated')!;
  u.gone = undefined;
  u.pos = at;
  u.flags = lord ? ['lord'] : [];
  u.downed = false;
  u.acted = false;
  u.moved = false;
  return u;
}

beforeAll(() => {
  base = loadContentFromDisk().data;
  data = base;
});

describe('escape objective', () => {
  it('does not offer escape to the lord while another able unit remains', () => {
    const { s, row } = arena();
    const exit = row[5]!;
    const kael = put(s, exit, true);
    const other = put(s, row[0]!, false);
    expect(availableActions(data, s, kael, exit).some((a) => a.kind === 'escape')).toBe(false);
    expect(validate(data, s, { type: 'act', unit: kael.uid, to: exit, action: { kind: 'escape' } })).toBe('not_allowed');
    expect(() => applyCommand(data, s, { type: 'act', unit: kael.uid, to: exit, action: { kind: 'escape' } })).toThrow();
    // others may leave at once
    const after = applyCommand(data, { ...s, units: s.units.map((u) => (u.uid === other.uid ? { ...u, pos: exit } : u.uid === kael.uid ? { ...u, pos: row[4]! } : u)) }, {
      type: 'act',
      unit: other.uid,
      to: exit,
      action: { kind: 'escape' },
    });
    expect(after.state.units.find((u) => u.uid === other.uid)!.gone).toBe('escaped');
  });

  it('lets the lord escape once alone, or when the rest is downed, and wins', () => {
    const { s, row } = arena();
    const exit = row[5]!;
    const kael = put(s, exit, true);
    const other = put(s, row[0]!, false);
    other.downed = true;
    expect(availableActions(data, s, kael, exit).some((a) => a.kind === 'escape')).toBe(true);
    const r = applyCommand(data, s, { type: 'act', unit: kael.uid, to: exit, action: { kind: 'escape' } });
    expect(r.state.outcome).toBe('victory');
  });

  it('is won by autoplay: the others leave first, the lord last', () => {
    const { s, row } = arena();
    put(s, row[1]!, true);
    put(s, row[0]!, false);
    put(s, row[2]!, false);
    const r = autoplay(data, s);
    expect(r.state.outcome).toBe('victory');
    const order = r.events.filter((e) => e.t === 'escaped').map((e) => (e as { unit: string }).unit);
    expect(order).toHaveLength(3);
    const lordUid = s.units.find((u) => u.flags.includes('lord'))!.uid;
    expect(order[order.length - 1]).toBe(lordUid);
  });

  it('autoplay wins when the lord is the only unit', () => {
    const { s, row } = arena();
    put(s, row[0]!, true);
    expect(autoplay(data, s).state.outcome).toBe('victory');
  });
});
