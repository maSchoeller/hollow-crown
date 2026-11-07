/**
 * Combat resolution paths the map tests rarely reach (concept/03 §3, §8, §11): tandem and guard from supports, knockback,
 * on-hit procs (Sol, Impale, Miracle, Vantage), weapon swap, burning on a kill, the boss-kill weapon. Every test sets
 * the numbers so the rolls are certain (100 or 0) and checks that precondition through the same forecast.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  CoreInvariantError,
  equipWeapon,
  expectedDamage,
  forecast,
  newItem,
  pairKey,
  resolveAttack,
  terrainAt,
  type BattleState,
  type BattleUnit,
  type GameData,
  type GameEvent,
  type Stats,
  type SupportRank,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

/** Arena with every mechanic introduced (supports, elements, status). */
function field(): BattleState {
  const s = arena(data);
  s.locked = [];
  return s;
}

/** Overwrites base stats and refills HP to the new maximum. */
function setStats(u: BattleUnit, st: Partial<Stats>): BattleUnit {
  Object.assign(u.stats, st);
  u.hp = u.stats.hp;
  return u;
}

function bond(s: BattleState, a: BattleUnit, b: BattleUnit, rank: SupportRank, points = data.balance.supports.thresholds[rank]) {
  s.supports[pairKey(a.id, b.id)] = { points, rank };
}

/** Sure-hit attacker without crits against a sturdy, unarmed target that cannot counter. */
function duel(s: BattleState, weapon = 'iron_sword', cls = 'captain') {
  const a = setStats(place(data, s, 'player', cls, [5, 5], weapon), { hp: 30, str: 10, mag: 10, skl: 60, spd: 5, lck: 0, def: 0, res: 0 });
  const d = setStats(place(data, s, 'enemy', 'brigand', [6, 5]), { hp: 60, str: 5, skl: 0, spd: 5, lck: 60, def: 2, res: 0 });
  return { a, d };
}

const strikes = (ev: GameEvent[]) => ev.filter((e): e is Extract<GameEvent, { t: 'strike' }> => e.t === 'strike');

describe('tandem (rank B and up, own phase)', () => {
  // the partner must stand next to the attacker and reach the target: an archer one step aside, two tiles from the target
  it('an adjacent B partner adds one strike at half its own damage, shown in the forecast and dealt in the fight', () => {
    const s = field();
    const { a, d } = duel(s);
    const p = setStats(place(data, s, 'player', 'marksman', [5, 4], 'iron_bow'), { hp: 30, str: 12, skl: 60, spd: 5, lck: 0 });
    bond(s, a, p, 'B');
    const own = forecast(data, s, p.uid, d.uid).attacker;
    const f = forecast(data, s, a.uid, d.uid);
    expect(f.attacker.hit).toBe(100);
    expect(own.hit).toBe(100);
    expect(f.tandem).toEqual({ uid: p.uid, damage: Math.floor(own.damage / 2), hit: own.hit });
    expect(f.defenderHpAfter).toBe(d.hp - f.attacker.damage * f.attacker.strikes - f.tandem!.damage);

    const before = s.supports[pairKey(a.id, p.id)]!.points;
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    const tandem = strikes(ev).filter((e) => e.tandem);
    expect(tandem).toHaveLength(1);
    expect(tandem[0]).toMatchObject({ attacker: p.uid, defender: d.uid, hit: true, crit: false, dmg: f.tandem!.damage, ranged: true });
    expect(d.hp).toBe(f.defenderHpAfter);
    const gained = data.balance.supports.pointsTandemHealRescue;
    expect(gained).toBeGreaterThan(0);
    expect(s.supports[pairKey(a.id, p.id)]!.points).toBe(before + gained);
    expect(ev).toContainEqual({ t: 'support', a: a.uid, b: p.uid, points: gained });
  });

  it('no tandem below rank B, in the enemy phase, for an unarmed partner or one out of range', () => {
    const s = field();
    const { a, d } = duel(s);
    const p = place(data, s, 'player', 'marksman', [5, 4], 'iron_bow');
    bond(s, a, p, 'C');
    expect(forecast(data, s, a.uid, d.uid).tandem).toBeUndefined();
    bond(s, a, p, 'B');
    expect(forecast(data, s, a.uid, d.uid).tandem?.uid).toBe(p.uid);
    expect(forecast(data, s, a.uid, d.uid, undefined, undefined, false).tandem).toBeUndefined();
    p.equip = {};
    expect(forecast(data, s, a.uid, d.uid).tandem).toBeUndefined();
    p.equip.mainHand = newItem(s, 'iron_sword', data); // range 1, the target is two tiles away
    expect(forecast(data, s, a.uid, d.uid).tandem).toBeUndefined();
  });

  it('the partner with the higher rank strikes; on equal rank the one dealing more damage', () => {
    const s = field();
    const { a, d } = duel(s);
    const weak = setStats(place(data, s, 'player', 'marksman', [5, 4], 'iron_bow'), { str: 6, skl: 60 });
    const strong = setStats(place(data, s, 'player', 'marksman', [5, 6], 'iron_bow'), { str: 14, skl: 60 });
    bond(s, a, weak, 'A');
    bond(s, a, strong, 'B');
    expect(forecast(data, s, a.uid, d.uid).tandem?.uid).toBe(weak.uid);
    bond(s, a, strong, 'A');
    expect(forecast(data, s, a.uid, d.uid).tandem?.uid).toBe(strong.uid);
  });

  it('a supports rule not yet introduced gives no partner at all', () => {
    const s = field();
    const { a, d } = duel(s);
    const p = place(data, s, 'player', 'scout', [6, 4], 'iron_sword');
    bond(s, a, p, 'S');
    s.locked = ['supports'];
    const f = forecast(data, s, a.uid, d.uid);
    expect(f.tandem).toBeUndefined();
    expect(f.guard).toBeUndefined();
  });
});

describe('guard (rank A and up protects the defender once)', () => {
  it('the forecast names the best adjacent guard with the chance of its rank', () => {
    const s = field();
    const foe = setStats(place(data, s, 'enemy', 'brigand', [4, 5], 'iron_axe'), { skl: 60 });
    const me = place(data, s, 'player', 'scout', [5, 5], 'iron_sword');
    const g1 = place(data, s, 'player', 'scout', [5, 6]);
    const g2 = place(data, s, 'player', 'scout', [5, 4]);
    bond(s, me, g1, 'B');
    expect(forecast(data, s, foe.uid, me.uid, undefined, undefined, false).guard).toBeUndefined();
    bond(s, me, g1, 'A');
    expect(forecast(data, s, foe.uid, me.uid, undefined, undefined, false).guard).toEqual({ uid: g1.uid, chance: data.balance.supports.guardChance.A });
    bond(s, me, g2, 'S');
    expect(forecast(data, s, foe.uid, me.uid, undefined, undefined, false).guard).toEqual({ uid: g2.uid, chance: data.balance.supports.guardChance.S });
  });

  it('a successful guard nulls only the first landed strike of the attacker', () => {
    const sure = { ...data, balance: { ...data.balance, supports: { ...data.balance.supports, guardChance: { A: 100 } } } } as GameData;
    const s = field();
    const foe = setStats(place(data, s, 'enemy', 'brigand', [4, 5], 'iron_axe'), { hp: 40, str: 8, skl: 60, spd: 20, lck: 0 });
    const me = setStats(place(data, s, 'player', 'scout', [5, 5]), { hp: 60, def: 0, spd: 0, lck: 0 });
    const g = place(data, s, 'player', 'scout', [5, 6]);
    bond(s, me, g, 'A');
    const f = forecast(sure, s, foe.uid, me.uid, undefined, undefined, false);
    expect(f.order).toEqual(['a', 'a']);
    expect(f.attacker.hit).toBe(100);
    const ev: GameEvent[] = [];
    resolveAttack(sure, s, foe.uid, me.uid, undefined, ev);
    const [first, second] = strikes(ev);
    expect(first).toMatchObject({ hit: true, dmg: 0, guarded: g.uid });
    expect(second).toMatchObject({ hit: true, guarded: undefined });
    expect(second!.dmg).toBeGreaterThan(0);
    expect(me.hp).toBe(60 - second!.dmg);
  });
});

describe('knockback (wind on hit)', () => {
  /** A gust mage that always hits for at least 1 against a target with 99 HP. */
  function gust(s: BattleState) {
    const a = setStats(place(data, s, 'player', 'elementalist', [5, 5], 'gust'), { mag: 10, skl: 60, lck: 0 });
    const d = setStats(place(data, s, 'enemy', 'brigand', [6, 5]), { hp: 99, res: 0, lck: 60, spd: 0 });
    const f = forecast(data, s, a.uid, d.uid);
    expect(f.attacker.crit).toBe(0);
    expect([f.attacker.hit, f.attacker.status]).toEqual([100, [{ status: 'knockback', chance: 100 }]]);
    expect(f.attacker.damage).toBeGreaterThan(0);
    return { a, d, f };
  }

  it('pushes the target one tile straight away from the attacker', () => {
    const s = field();
    const { a, d } = gust(s);
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    expect(d.pos).toEqual([7, 5]);
    expect(ev).toContainEqual({ t: 'knockback', unit: d.uid, from: [6, 5], to: [7, 5], blocked: false });
  });

  it('pushes along the column when attacker and target share it', () => {
    const s = field();
    const { a, d } = gust(s);
    d.pos = [5, 6];
    resolveAttack(data, s, a.uid, d.uid, undefined, []);
    expect(d.pos).toEqual([5, 7]);
  });

  it('a blocked push costs the target extra damage instead; an untargetable target takes none', () => {
    const s = field();
    const { a, d, f } = gust(s);
    place(data, s, 'enemy', 'brigand', [7, 5]);
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    const extra = data.balance.status.knockbackBlockedDamage;
    expect(d.pos).toEqual([6, 5]);
    expect(ev).toContainEqual({ t: 'knockback', unit: d.uid, from: [6, 5], to: [6, 5], blocked: true });
    expect(ev).toContainEqual({ t: 'damage', unit: d.uid, amount: extra, hpAfter: d.hp, cause: 'item' });
    expect(d.hp).toBe(99 - f.attacker.damage * f.attacker.strikes - extra);

    const s2 = field();
    const g = gust(s2);
    g.d.pos = [s2.width - 1, 5];
    g.a.pos = [s2.width - 2, 5];
    g.d.untargetable = true;
    const ev2: GameEvent[] = [];
    resolveAttack(data, s2, g.a.uid, g.d.uid, undefined, ev2);
    expect(ev2.filter((e) => e.t === 'knockback')).toEqual([{ t: 'knockback', unit: g.d.uid, from: g.d.pos, to: g.d.pos, blocked: true }]);
    expect(ev2.some((e) => e.t === 'damage')).toBe(false);
  });

  it('a blocked push that drops the target to 0 knocks it out', () => {
    const s = field();
    const { a, d, f } = gust(s);
    place(data, s, 'enemy', 'brigand', [7, 5]);
    d.hp = f.attacker.damage * f.attacker.strikes + 1;
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    expect(d.hp).toBe(0);
    expect(d.gone).toBe('dead');
    expect(ev).toContainEqual({ t: 'died', unit: d.uid });
  });

  it('a target of the wind affinity is immune, and without the status rule there is no on-hit status', () => {
    const s = field();
    const { a, d } = gust(s);
    d.affinity = 'wind';
    expect(forecast(data, s, a.uid, d.uid).attacker.status).toEqual([{ status: 'knockback', chance: 0 }]);
    d.affinity = undefined;
    s.locked = ['status'];
    expect(forecast(data, s, a.uid, d.uid).attacker.status).toEqual([]);
  });
});

describe('on-hit and on-lethal procs', () => {
  it('Sol (duelist) heals the attacker by half the damage dealt, never above max HP', () => {
    const s = field();
    const { a, d } = duel(s, 'iron_sword', 'duelist');
    a.stats.skl = 120; // chance = SKL → certain
    a.hp = 5;
    const f = forecast(data, s, a.uid, d.uid);
    expect([f.attacker.hit, f.attacker.crit, f.attacker.strikes, f.defender.canStrike]).toEqual([100, 0, 1, false]);
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    const [st] = strikes(ev);
    expect(st).toMatchObject({ skill: 'sol', dmg: f.attacker.damage });
    expect(a.hp).toBe(5 + Math.floor(f.attacker.damage / 2));

    const s2 = field();
    const b = duel(s2, 'iron_sword', 'duelist');
    b.a.stats.skl = 120;
    b.a.hp = b.a.stats.hp - 1;
    resolveAttack(data, s2, b.a.uid, b.d.uid, undefined, []);
    expect(b.a.hp).toBe(b.a.stats.hp);
  });

  it('Impale (bulwark) adds half the target DEF to the damage when it procs', () => {
    const s = field();
    const { a, d } = duel(s, 'iron_lance', 'bulwark');
    a.stats.skl = 200; // chance = SKL / 2 → certain
    d.stats.def = 8;
    d.stats.lck = 150; // no crits
    const f = forecast(data, s, a.uid, d.uid);
    expect([f.attacker.hit, f.attacker.crit, f.attacker.strikes]).toEqual([100, 0, 1]);
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    expect(strikes(ev)[0]).toMatchObject({ skill: 'impale', dmg: f.attacker.damage + 4 });
    expect(d.hp).toBe(60 - f.attacker.damage - 4);
  });

  it('Miracle (lucky charm) leaves the defender at 1 HP from a lethal strike, but not from 1 HP', () => {
    const s = field();
    const { a, d } = duel(s);
    d.equip.accessory1 = newItem(s, 'lucky_charm', data);
    d.stats.lck = 150; // chance = LCK → certain; also rules out crits
    a.stats.skl = 150;
    const f = forecast(data, s, a.uid, d.uid);
    expect([f.attacker.hit, f.attacker.crit]).toEqual([100, 0]);
    d.hp = f.attacker.damage;
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    expect(strikes(ev)[0]).toMatchObject({ skill: 'miracle', dmg: f.attacker.damage - 1, hpAfter: 1 });
    expect(d.gone).toBeUndefined();

    d.hp = 1;
    resolveAttack(data, s, a.uid, d.uid, undefined, []);
    expect(d.gone).toBe('dead');
  });

  it('Vantage (steel sword) lets a defender below half HP strike first', () => {
    const s = field();
    const foe = setStats(place(data, s, 'enemy', 'brigand', [4, 5], 'iron_axe'), { hp: 40, spd: 5 });
    const me = setStats(place(data, s, 'player', 'captain', [5, 5], 'steel_sword'), { hp: 40, spd: 5 });
    expect(forecast(data, s, foe.uid, me.uid, undefined, undefined, false).order).toEqual(['a', 'd']);
    me.hp = 19;
    const f = forecast(data, s, foe.uid, me.uid, undefined, undefined, false);
    expect(f.order).toEqual(['d', 'a']);
    expect(f.defender.skills).toContain('vantage');
  });
});

describe('weapon swap', () => {
  it('a weapon from the bag goes to the main hand, the old one into the bag', () => {
    const s = field();
    const u = place(data, s, 'player', 'scout', [5, 5], 'iron_sword');
    const old = u.equip.mainHand!;
    const axe = newItem(s, 'iron_axe', data);
    u.bag.push(axe);
    const ev: GameEvent[] = [];
    equipWeapon(data, u, axe.uid, ev);
    expect(u.equip.mainHand).toBe(axe);
    expect(u.bag).toEqual([old]);
    expect(ev).toEqual([{ t: 'equipped', unit: u.uid, item: axe.uid }]);
    equipWeapon(data, u, axe.uid, ev); // already in hand: nothing happens
    expect(ev).toHaveLength(1);
  });

  it('a two-handed weapon also moves the off-hand item into the bag', () => {
    const s = field();
    const u = place(data, s, 'player', 'scout', [5, 5]);
    const shield = newItem(s, 'iron_shield', data);
    u.equip.offHand = shield;
    const bow = newItem(s, 'iron_bow', data);
    u.bag.push(bow);
    equipWeapon(data, u, bow.uid, []);
    expect(u.equip).toEqual({ mainHand: bow });
    expect(u.bag).toEqual([shield]);
  });

  it('refuses a weapon the unit does not carry', () => {
    const s = field();
    const u = place(data, s, 'player', 'scout', [5, 5], 'iron_sword');
    expect(() => equipWeapon(data, u, 'nope', [])).toThrow(CoreInvariantError);
  });

  it('an attack with a bag weapon swaps first and fights with it', () => {
    const s = field();
    const { a, d } = duel(s);
    const axe = newItem(s, 'iron_axe', data);
    a.bag.push(axe);
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, axe.uid, ev);
    expect(ev[0]).toEqual({ t: 'equipped', unit: a.uid, item: axe.uid });
    expect(ev).toContainEqual({ t: 'combat', attacker: a.uid, defender: d.uid, weapon: axe.uid });
  });
});

describe('after the kill', () => {
  it('a fire weapon that kills still sets a flammable tile alight', () => {
    const s = field();
    const { a, d } = duel(s, 'ember', 'elementalist');
    const f = forecast(data, s, a.uid, d.uid);
    expect(f.attacker.hit).toBe(100);
    s.terrain[d.pos![1] * s.width + d.pos![0]] = 'grass';
    expect(terrainAt(s, d.pos!)).toBe('grass');
    d.hp = 1;
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    expect(d.gone).toBe('dead');
    expect(terrainAt(s, d.pos!)).toBe('burning');
    expect(ev).toContainEqual({ t: 'terrain', at: d.pos, terrain: 'burning', cause: 'ignite' });
  });

  it('killing a boss records the weapon type for "defeat with" objectives', () => {
    const s = field();
    const { a, d } = duel(s, 'iron_axe', 'breaker');
    d.boss = true;
    d.hp = 1;
    resolveAttack(data, s, a.uid, d.uid, undefined, []);
    expect(s.stats.bossKilledWith).toBe('axe');
  });
});

describe('expectedDamage (AI helper)', () => {
  it('weights damage by hit and strikes, ignores counters that cannot happen, and computes the kill chance', () => {
    const s = field();
    const { a, d } = duel(s);
    const f = forecast(data, s, a.uid, d.uid);
    const one = { ...f, attacker: { ...f.attacker, damage: 10, hit: 50, strikes: 2 }, defender: { ...f.defender, hpBefore: 10, canStrike: false } };
    expect(expectedDamage(one)).toEqual({ dealt: 10, taken: 0, killChance: 0.75 });
    const two = { ...one, defender: { ...one.defender, hpBefore: 20, canStrike: true, damage: 4, strikes: 1, hit: 50 } };
    expect(expectedDamage(two)).toEqual({ dealt: 10, taken: 2, killChance: 0.25 });
    const none = { ...one, attacker: { ...one.attacker, damage: 0 } };
    expect(expectedDamage(none).killChance).toBe(0);
    const tooTough = { ...one, defender: { ...one.defender, hpBefore: 30 } };
    expect(expectedDamage(tooTough).killChance).toBe(0);
  });
});
