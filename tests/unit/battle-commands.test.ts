/**
 * Battle commands (architecture §8): `validate` refuses every illegal command with its reason and `applyCommand` throws
 * on it without touching the state; the free commands (equip, trade, convoy) and the item, staff, rally and command
 * actions change exactly what they promise.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  CoreInvariantError,
  newItem,
  terrainAt,
  validate,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameData,
} from '../../src/core';
import { clone } from '../../src/core/util';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

const unit = (s: BattleState, uid: string): BattleUnit => s.units.find((u) => u.uid === uid)!;

/** Two adjacent player units and an enemy two tiles off on an open field. */
function setup() {
  const s = arena(data);
  s.locked = [];
  const a = place(data, s, 'player', 'captain', [5, 5], 'iron_sword');
  const b = place(data, s, 'player', 'vanguard', [5, 6], 'iron_axe');
  const foe = place(data, s, 'enemy', 'brigand', [7, 5], 'iron_axe');
  return { s, a, b, foe };
}

describe('validate: every illegal command has its reason', () => {
  it('nothing goes after the battle is over, and only the player ends the player phase', () => {
    const { s, a } = setup();
    expect(validate(data, s, { type: 'endPhase' })).toBeNull();
    s.phase = 'enemy';
    expect(validate(data, s, { type: 'endPhase' })).toBe('not_your_phase');
    expect(validate(data, s, { type: 'move', unit: a.uid, to: [5, 4] })).toBe('not_your_phase');
    s.phase = 'player';
    s.outcome = 'victory';
    expect(validate(data, s, { type: 'move', unit: a.uid, to: [5, 4] })).toBe('battle_over');
  });

  it('unknown, gone or downed units and enemy units cannot be commanded', () => {
    const { s, a, foe } = setup();
    expect(validate(data, s, { type: 'move', unit: 'ghost', to: [5, 4] })).toBe('unknown_unit');
    expect(validate(data, s, { type: 'move', unit: foe.uid, to: [7, 4] })).toBe('not_your_phase');
    a.downed = true;
    expect(validate(data, s, { type: 'move', unit: a.uid, to: [5, 4] })).toBe('unknown_unit');
  });

  it('moves: once per turn, only to reachable and free tiles, along a path that ends at the goal', () => {
    const { s, a, b } = setup();
    expect(validate(data, s, { type: 'move', unit: a.uid, to: [5, 4] })).toBeNull();
    expect(validate(data, s, { type: 'move', unit: a.uid, to: [5, 5] })).toBeNull(); // staying is always fine
    expect(validate(data, s, { type: 'move', unit: a.uid, to: [5, 6] })).toBe('occupied');
    expect(validate(data, s, { type: 'move', unit: a.uid, to: [5, 5 + 30] })).toBe('unreachable');
    expect(validate(data, s, { type: 'move', unit: a.uid, to: [5, 3], path: [[5, 5], [5, 4]] })).toBe('unreachable');
    expect(validate(data, s, { type: 'move', unit: a.uid, to: [5, 4], path: [[5, 5], [5, 4]] })).toBeNull();
    a.moved = true;
    expect(validate(data, s, { type: 'move', unit: a.uid, to: [5, 4] })).toBe('already_moved');
    expect(validate(data, s, { type: 'act', unit: a.uid, to: [5, 4], path: [[5, 5], [5, 4]], action: { kind: 'wait' } })).toBe('already_moved');
    b.acted = true;
    expect(validate(data, s, { type: 'move', unit: b.uid, to: [4, 6] })).toBe('unit_exhausted');
  });

  it('attacks: only a target in reach, only with a weapon that reaches it, only actions on offer', () => {
    const { s, a, b, foe } = setup();
    const atk = (target: string, weapon?: string): Command => ({ type: 'act', unit: a.uid, to: [6, 5], action: { kind: 'attack', target, weapon } });
    expect(validate(data, s, atk(foe.uid))).toBeNull();
    expect(validate(data, s, atk(b.uid))).toBe('invalid_target');
    expect(validate(data, s, atk(foe.uid, b.equip.mainHand!.uid))).toBe('out_of_range');
    expect(validate(data, s, { type: 'act', unit: a.uid, to: [6, 5], action: { kind: 'staff', target: b.uid } })).toBe('not_allowed');
    expect(validate(data, s, { type: 'act', unit: a.uid, to: [6, 5], action: { kind: 'door', object: 'none' } })).toBe('not_allowed');
  });

  it('a refused command throws and leaves the state as it was', () => {
    const { s, foe } = setup();
    const before = clone(s);
    expect(() => applyCommand(data, s, { type: 'move', unit: foe.uid, to: [7, 4] })).toThrow(CoreInvariantError);
    try {
      applyCommand(data, s, { type: 'move', unit: foe.uid, to: [7, 4] });
    } catch (e) {
      expect((e as CoreInvariantError).message).toContain('invalid_command');
    }
    expect(s).toEqual(before);
  });

  it('equip: only carried items, only into a slot the unit may use', () => {
    const { s, a } = setup();
    expect(validate(data, s, { type: 'equip', unit: a.uid, item: 'nope', slot: 'bag' })).toBe('invalid_target');
    expect(validate(data, s, { type: 'equip', unit: a.uid, item: a.equip.mainHand!.uid, slot: 'bag' })).toBeNull();
    const staff = newItem(s, 'heal_staff', data);
    a.bag.push(staff);
    expect(validate(data, s, { type: 'equip', unit: a.uid, item: staff.uid, slot: 'mainHand' })).toBe('cannot_equip');
  });

  it('trade: once per turn, with an adjacent active ally of the own team', () => {
    const { s, a, b, foe } = setup();
    const trade = (w: string): Command => ({ type: 'trade', unit: a.uid, with: w, ops: [] });
    expect(validate(data, s, trade(b.uid))).toBeNull();
    expect(validate(data, s, trade(foe.uid))).toBe('invalid_target');
    expect(validate(data, s, trade('ghost'))).toBe('invalid_target');
    b.pos = [5, 8];
    expect(validate(data, s, trade(b.uid))).toBe('not_adjacent');
    b.pos = [5, 6];
    a.freeUsed.trade = true;
    expect(validate(data, s, trade(b.uid))).toBe('already_used');
  });

  it('convoy: once per turn, only on or next to the convoy carrier', () => {
    const { s, a, b } = setup();
    const cmd: Command = { type: 'convoy', unit: a.uid, put: a.equip.mainHand!.uid };
    expect(validate(data, s, cmd)).toBe('not_adjacent');
    b.flags.push('convoyAccess');
    expect(validate(data, s, cmd)).toBeNull();
    a.freeUsed.convoy = true;
    expect(validate(data, s, cmd)).toBe('already_used');
  });
});

describe('free commands', () => {
  it('trade moves items both ways, skips items the receiver cannot equip, and uses up the trade', () => {
    const { s, a, b } = setup();
    const sword = a.equip.mainHand!;
    const lance = newItem(s, 'iron_lance', data);
    const staff = newItem(s, 'heal_staff', data);
    b.bag.push(lance, staff);
    const r = applyCommand(data, s, {
      type: 'trade',
      unit: a.uid,
      with: b.uid,
      ops: [
        { item: sword.uid, to: b.uid, slot: 'bag' },
        { item: lance.uid, to: a.uid, slot: 'mainHand' },
        { item: staff.uid, to: a.uid, slot: 'mainHand' }, // a captain cannot wield a staff: skipped
        { item: 'gone', to: a.uid, slot: 'bag' },
      ],
    });
    const ra = unit(r.state, a.uid);
    const rb = unit(r.state, b.uid);
    expect(ra.equip.mainHand?.uid).toBe(lance.uid);
    expect(rb.bag.map((i) => i.uid).sort()).toEqual([staff.uid, sword.uid].sort());
    expect(ra.freeUsed.trade).toBe(true);
    expect(r.events).toContainEqual({ t: 'equipped', unit: a.uid, item: 'trade' });
    expect(unit(s, a.uid).equip.mainHand?.uid).toBe(sword.uid); // the old state is untouched
  });

  it('convoy puts an item away and takes another, a full bag sends the taken item back', () => {
    const { s, a, b } = setup();
    b.flags.push('convoyAccess');
    const lance = newItem(s, 'iron_lance', data);
    s.convoy.push(lance);
    const sword = a.equip.mainHand!;
    const r = applyCommand(data, s, { type: 'convoy', unit: a.uid, put: sword.uid, take: lance.uid, slot: 'mainHand' }).state;
    expect(unit(r, a.uid).equip.mainHand?.uid).toBe(lance.uid);
    expect(r.convoy.map((i) => i.uid)).toEqual([...s.convoy.filter((i) => i.uid !== lance.uid).map((i) => i.uid), sword.uid]);
    expect(unit(r, a.uid).freeUsed.convoy).toBe(true);

    const s2 = setup();
    s2.b.flags.push('convoyAccess');
    for (let i = 0; i < data.balance.bag.size; i++) s2.a.bag.push(newItem(s2.s, 'iron_lance', data));
    const extra = newItem(s2.s, 'iron_axe', data);
    s2.s.convoy.push(extra);
    const r2 = applyCommand(data, s2.s, { type: 'convoy', unit: s2.a.uid, take: extra.uid }).state;
    expect(r2.convoy.map((i) => i.uid).sort()).toEqual(s2.s.convoy.map((i) => i.uid).sort());
    expect(unit(r2, s2.a.uid).bag).toHaveLength(data.balance.bag.size);
  });

  it('taking from the convoy straight into a slot follows the equip rules', () => {
    const { s, a, b } = setup();
    b.flags.push('convoyAccess');
    const axe = newItem(s, 'iron_axe', data); // captain: sword, lance, shield
    s.convoy.push(axe);
    expect(validate(data, s, { type: 'convoy', unit: a.uid, take: axe.uid, slot: 'mainHand' })).toBe('cannot_equip');
    expect(validate(data, s, { type: 'convoy', unit: a.uid, take: axe.uid, slot: 'bag' })).toBeNull();
    expect(validate(data, s, { type: 'convoy', unit: a.uid, take: 'nope', slot: 'mainHand' })).toBe('invalid_target');
  });

  it('a two-handed weapon cannot be equipped beside a shield; a swap into a full bag is tolerated', () => {
    const { s, b: v } = setup(); // the vanguard: axe and shield
    v.equip.offHand = newItem(s, 'iron_shield', data);
    const hammer = newItem(s, 'hammer', data);
    v.bag.push(hammer);
    expect(validate(data, s, { type: 'equip', unit: v.uid, item: hammer.uid, slot: 'mainHand' })).toBe('cannot_equip');

    const lances = [1, 2].map(() => newItem(s, 'iron_lance', data));
    v.bag.push(...lances);
    expect(v.bag).toHaveLength(data.balance.bag.size);
    const axe = v.equip.mainHand!;
    const r = applyCommand(data, s, { type: 'equip', unit: v.uid, item: lances[0]!.uid, slot: 'mainHand' });
    const rv = unit(r.state, v.uid);
    expect(rv.equip.mainHand?.uid).toBe(lances[0]!.uid);
    expect(rv.bag.map((i) => i.uid)).toContain(axe.uid);
    expect(rv.acted).toBe(false); // equipping is free
    expect(r.events).toContainEqual({ t: 'equipped', unit: v.uid, item: lances[0]!.uid });
  });
});

describe('item, staff and class-skill actions', () => {
  it('a fire bomb hurts, sets the target burning and the grass alight, and is used up', () => {
    const { s, a, foe } = setup();
    const bomb = newItem(s, 'fire_bomb', data);
    a.bag.push(bomb);
    s.terrain[foe.pos![1] * s.width + foe.pos![0]] = 'grass';
    const hp = foe.hp;
    const r = applyCommand(data, s, { type: 'act', unit: a.uid, to: [5, 5], action: { kind: 'item', item: bomb.uid, target: foe.uid } });
    const rf = unit(r.state, foe.uid);
    expect(rf.hp).toBe(hp - 8);
    expect(rf.status.map((x) => x.id)).toContain('burning');
    expect(terrainAt(r.state, foe.pos!)).toBe('burning');
    expect(unit(r.state, a.uid).bag).toEqual([]);
    expect(r.events).toContainEqual({ t: 'itemUsed', unit: a.uid, item: 'fire_bomb', target: foe.uid });
  });

  it('a haste scroll gives an ally +2 MOV until the end of the round; the salve cures every status', () => {
    const { s, a, b } = setup();
    const scroll = newItem(s, 'haste_scroll', data);
    a.bag.push(scroll);
    const r = applyCommand(data, s, { type: 'act', unit: a.uid, to: [5, 5], action: { kind: 'item', item: scroll.uid, target: b.uid } });
    expect(unit(r.state, b.uid).buffs).toEqual([{ source: 'haste_scroll', mov: 2, untilTurn: s.turn, untilPhase: 'player' }]);

    const t = setup();
    const salve = newItem(t.s, 'remedy_salve', data);
    t.a.bag.push(salve);
    t.a.status = [
      { id: 'burning', turns: 2 },
      { id: 'wet', turns: 1 },
    ] as BattleUnit['status'];
    const r2 = applyCommand(data, t.s, { type: 'act', unit: t.a.uid, to: [5, 5], action: { kind: 'item', item: salve.uid } });
    expect(unit(r2.state, t.a.uid).status).toEqual([]);
    expect(r2.events.filter((e) => e.t === 'status')).toEqual([
      { t: 'status', unit: t.a.uid, status: 'burning', on: false },
      { t: 'status', unit: t.a.uid, status: 'wet', on: false },
    ]);
    expect(unit(r2.state, t.a.uid).bag[0]!.charges).toBe(salve.charges! - 1);
  });

  it('the remedy staff heals heal + MAG up to max HP and cures the status of the target', () => {
    const { s, b } = setup();
    const healer = place(data, s, 'player', 'healer', [4, 6], 'remedy_staff');
    healer.stats.mag = 3;
    const max = b.hp;
    b.hp = max - 4;
    b.status = [{ id: 'slowed', turns: 1 }] as BattleUnit['status'];
    const r = applyCommand(data, s, { type: 'act', unit: healer.uid, to: [4, 6], action: { kind: 'staff', target: b.uid } });
    const rb = unit(r.state, b.uid);
    expect(rb.hp).toBe(max); // 5 + 3 would overheal: capped
    expect(rb.status).toEqual([]);
    expect(r.events).toContainEqual({ t: 'heal', unit: b.uid, amount: 4, hpAfter: max, by: healer.uid, cause: 'staff' });
  });

  it('rally buffs every ally within its radius once per map', () => {
    const { s, a, b } = setup();
    const cap = place(data, s, 'player', 'captain', [4, 5], 'iron_sword');
    a.pos = [6, 5]; // distance 2: inside
    b.pos = [4, 8]; // distance 3: outside
    const r = applyCommand(data, s, { type: 'act', unit: cap.uid, to: [4, 5], action: { kind: 'rally' } });
    const rally = r.events.find((e) => e.t === 'rally') as Extract<(typeof r.events)[number], { t: 'rally' }>;
    expect(rally.affected.sort()).toEqual([a.uid, cap.uid].sort());
    expect(unit(r.state, a.uid).buffs).toEqual([{ source: 'rally', damage: 2, hit: 10, untilTurn: s.turn + 1, untilPhase: 'enemy' }]);
    expect(unit(r.state, b.uid).buffs).toEqual([]);
    expect(unit(r.state, cap.uid).usedPerMap.rally).toBe(1);
  });

  it('the tactician refreshes an exhausted adjacent ally', () => {
    const { s, b } = setup();
    const tac = place(data, s, 'player', 'tactician', [4, 6], 'iron_sword');
    b.acted = true;
    b.moved = true;
    expect(validate(data, s, { type: 'act', unit: tac.uid, to: [4, 6], action: { kind: 'command', target: 'ghost' } })).toBe('invalid_target');
    const r = applyCommand(data, s, { type: 'act', unit: tac.uid, to: [4, 6], action: { kind: 'command', target: b.uid } });
    expect([unit(r.state, b.uid).acted, unit(r.state, b.uid).moved]).toEqual([false, false]);
    expect(r.events).toContainEqual({ t: 'refreshed', unit: b.uid, by: tac.uid });
    expect(unit(r.state, tac.uid).usedPerMap.tactician_command).toBe(1);
  });
});
