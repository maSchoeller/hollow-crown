/** Forecast of the element band (story 16.12): factor, rune tier, guard source, status rounds; the forecast equals the resolution. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyStatus,
  burnDamage,
  forecast,
  resolveAttack,
  startOfPhase,
  type BattleState,
  type BattleUnit,
  type GameData,
  type GameEvent,
  type ItemInstance,
  type Stats,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

const inst = (def: string, runes: string[]): ItemInstance => ({ uid: `${def}-${runes.join('')}`, def, upgrade: 0, affixes: [], runes });
const setStats = (u: BattleUnit, st: Partial<Stats>): BattleUnit => {
  Object.assign(u.stats, st);
  u.hp = u.stats.hp;
  return u;
};

function duel(weaponRune: string | undefined, o: { shield?: string[]; body?: string[] } = {}) {
  const s = arena(data);
  s.locked = [];
  const a = setStats(place(data, s, 'player', 'captain', [5, 5], 'iron_sword'), { hp: 30, str: 12, mag: 10, skl: 60, spd: 5, lck: 0, def: 0, res: 0 });
  a.equip.mainHand!.runes = weaponRune ? [weaponRune] : [];
  const d = setStats(place(data, s, 'enemy', 'brigand', [6, 5]), { hp: 99, str: 5, skl: 0, spd: 5, lck: 60, def: 2, res: 0 });
  d.equip = {
    ...(o.shield ? { offHand: inst('wooden_shield', o.shield) } : {}),
    ...(o.body ? { body: inst('chainmail', o.body) } : {}),
  };
  return { s, a, d };
}

/** damage the real attack deals (sure hit, no crit) */
function dealt(s: BattleState, a: BattleUnit, d: BattleUnit): number {
  const before = d.hp;
  resolveAttack(data, s, a.uid, d.uid, undefined, [] as GameEvent[]);
  return before - d.hp;
}

const CASES: Array<[string, string, { shield?: string[]; body?: string[] }, string]> = [
  ['advantage (fire vs wind body)', 'fire_rune_2', { body: ['wind_rune_1'] }, 'advantage'],
  ['disadvantage (fire vs water body)', 'fire_rune_2', { body: ['water_rune_1'] }, 'disadvantage'],
  ['same element (fire vs fire body)', 'fire_rune_2', { body: ['fire_rune_1'] }, 'sameElement'],
  ['shield rune (fire vs fire shield)', 'fire_rune_2', { shield: ['fire_rune_1'] }, 'shieldFactor'],
  ['neutral (no protection)', 'fire_rune_2', {}, 'neutral'],
];

describe('forecast factor equals the factor of the resolution', () => {
  const expected = (k: string) => {
    const e = data.balance.element;
    return k === 'advantage' ? e.advantage : k === 'disadvantage' ? e.disadvantage : k === 'sameElement' ? e.sameElement : k === 'shieldFactor' ? e.shieldRune.factor : 1;
  };
  it.each(CASES)('%s', (_n, rune, eq, k) => {
    const { s, a, d } = duel(rune, eq);
    const f = forecast(data, s, a.uid, d.uid);
    expect(f.attacker.elementMult).toBe(expected(k));
    expect(f.attacker.hit).toBe(100);
    expect(f.attacker.crit).toBe(0);
    expect(dealt(s, a, d)).toBe(f.attacker.damage * f.attacker.strikes);
    // the factor decides the damage: the same duel without protection deals the neutral amount
    const bare = duel(rune, { ...(eq.shield ? { shield: [] } : {}), ...(eq.body ? { body: [] } : {}) });
    const neutral = forecast(data, bare.s, bare.a.uid, bare.d.uid).attacker;
    expect(neutral.elementMult).toBe(1);
    if (f.attacker.elementMult < 1) expect(f.attacker.damage).toBeLessThan(neutral.damage);
    if (f.attacker.elementMult > 1) expect(f.attacker.damage).toBeGreaterThan(neutral.damage);
  });
});

describe('forecast carries tier and guard', () => {
  it('weapon rune tier, none without rune', () => {
    const t3 = duel('fire_rune_3');
    expect(forecast(data, t3.s, t3.a.uid, t3.d.uid).attacker.elementTier).toBe(3);
    const none = duel(undefined);
    const f = forecast(data, none.s, none.a.uid, none.d.uid).attacker;
    expect(f.elementTier).toBeUndefined();
    expect(f.element).toBeUndefined();
    expect(f.guard).toBeUndefined();
    // a protecting rune still shows (the chip of the target), without a weapon element
    const armored = duel(undefined, { body: ['water_rune_1'] });
    expect(forecast(data, armored.s, armored.a.uid, armored.d.uid).attacker.guard).toEqual({ element: 'water', tier: 1, source: 'armor' });
  });
  it('guard names source and tier of the protecting element', () => {
    const sh = duel('fire_rune_2', { shield: ['fire_rune_2'] });
    expect(forecast(data, sh.s, sh.a.uid, sh.d.uid).attacker.guard).toEqual({ element: 'fire', tier: 2, source: 'shield' });
    const body = duel('fire_rune_2', { body: ['water_rune_3'] });
    expect(forecast(data, body.s, body.a.uid, body.d.uid).attacker.guard).toEqual({ element: 'water', tier: 3, source: 'armor' });
  });
  it('body and shield of the same element: the armor is shown', () => {
    const { s, a, d } = duel('fire_rune_1', { shield: ['fire_rune_1'], body: ['fire_rune_1'] });
    expect(forecast(data, s, a.uid, d.uid).attacker.guard?.source).toBe('armor');
  });
  it('the shield is shown when its factor beats the body', () => {
    // a wind body is weak against fire; the shield caps the factor
    const { s, a, d } = duel('fire_rune_1', { shield: ['fire_rune_1'], body: ['wind_rune_1'] });
    const f = forecast(data, s, a.uid, d.uid).attacker;
    expect(f.guard?.source).toBe('shield');
    expect(f.elementMult).toBe(data.balance.element.shieldRune.factor);
  });
  it('without the elements mechanic: no guard, factor 1', () => {
    const { s, a, d } = duel('fire_rune_2', { body: ['wind_rune_1'] });
    s.locked = ['elements'];
    const f = forecast(data, s, a.uid, d.uid).attacker;
    expect(f.guard).toBeUndefined();
    expect(f.elementMult).toBe(1);
  });
});

describe('forecast status rounds', () => {
  it('burning: rounds from balance, per round equals the burn of the first round', () => {
    const { s, a, d } = duel('fire_rune_2');
    const f = forecast(data, s, a.uid, d.uid).attacker;
    const burn = f.statusTurns?.find((x) => x.status === 'burning');
    expect(burn).toEqual({ status: 'burning', rounds: data.balance.status.durationRounds, perRound: burnDamage(data, d.stats.hp) });
    expect(applyStatus(data, s, d, 'burning', [])).toBe(true);
    const before = d.hp;
    startOfPhase(data, s, 'enemy', []);
    expect(before - d.hp).toBe(burn!.perRound);
  });
  it('earth II shows rounds without burn damage, knockback has none; shield II drops the entry', () => {
    const earth = duel('earth_rune_2');
    const w = forecast(data, earth.s, earth.a.uid, earth.d.uid).attacker.statusTurns!;
    expect(w).toEqual([{ status: 'slowed', rounds: data.balance.status.durationRounds }]);
    const wind = duel('wind_rune_3');
    expect(forecast(data, wind.s, wind.a.uid, wind.d.uid).attacker.statusTurns).toBeUndefined();
    const imm = duel('fire_rune_2', { shield: ['fire_rune_2'] });
    expect(forecast(data, imm.s, imm.a.uid, imm.d.uid).attacker.statusTurns).toBeUndefined();
  });
});
