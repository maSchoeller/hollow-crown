/** Story 10.4: the effects of the pro paths work the same in the preview, the resolution and the AI. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  availableActions,
  castArea,
  classPreview,
  computeStats,
  expectedDamage,
  forecast,
  healTiles,
  seedRng,
  staffHeal,
  pairKey,
  resolveAttack,
  resolveCast,
  terrainAt,
  validate,
  weaponRange,
  type BattleState,
  type BattleUnit,
  type GameData,
  type GameEvent,
  type Stats,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

function field(): BattleState {
  const s = arena(data);
  s.locked = [];
  s.phase = 'player';
  return s;
}

function setStats(u: BattleUnit, st: Partial<Stats>): BattleUnit {
  Object.assign(u.stats, st);
  u.hp = u.stats.hp;
  return u;
}

const SURE = { hp: 40, str: 10, mag: 10, skl: 100, spd: 5, lck: 100, def: 0, res: 0 };

describe('content of the pro paths (story 10.4)', () => {
  it('every playable pro class has 1–2 pro skills, the old six carry their role skill, bard and standard bearer are playable', () => {
    for (const c of Object.values(data.classes).filter((x) => x.tier === 'pro' && x.playable)) {
      expect(c.proSkills?.length ?? 0, c.id).toBeGreaterThanOrEqual(1);
      expect(c.skill, c.id).toBe(data.classes[c.role]!.skill);
    }
    expect([data.classes.bard!.playable, data.classes.standard_bearer!.playable]).toEqual([true, true]);
    expect(data.classes.breaker!.skill).toBe('phalanx');
    expect(data.classes.brigand!.skill).toBe('climber');
  });
});

describe('Bollwerk: guard of the neighbours', () => {
  it('an ally next to a bulwark has 10 % guard through him; with an S support at most 30 % together', () => {
    const s = field();
    const a = setStats(place(data, s, 'enemy', 'captain', [5, 5], 'iron_sword'), SURE);
    const d = setStats(place(data, s, 'player', 'captain', [6, 5]), { hp: 60, def: 0, spd: 5 });
    const wall = place(data, s, 'player', 'bulwark', [7, 5]);
    expect(forecast(data, s, a.uid, d.uid).guard).toEqual({ uid: wall.uid, chance: 10 });
    const partner = place(data, s, 'player', 'captain', [6, 6]);
    s.supports[pairKey(d.id, partner.id)] = { points: data.balance.supports.thresholds.S, rank: 'S' };
    expect(forecast(data, s, a.uid, d.uid).guard).toEqual({ uid: wall.uid, chance: data.balance.supports.guardMaxTotal });
    // the bulwark himself has no guard from his own skill
    expect(forecast(data, s, a.uid, wall.uid).guard).toBeUndefined();
  });

  it('the guard voids the first landed strike and lowers the AI value of the attack', () => {
    const s = field();
    const a = setStats(place(data, s, 'enemy', 'captain', [5, 5], 'iron_sword'), SURE);
    const d = setStats(place(data, s, 'player', 'captain', [6, 5]), { hp: 60, def: 0, spd: 5 });
    place(data, s, 'player', 'bulwark', [7, 5]);
    const f = forecast(data, s, a.uid, d.uid);
    const e = expectedDamage(f);
    expect(e.dealt).toBeCloseTo((f.attacker.damage * (f.attacker.strikes - 0.1) * f.attacker.hit) / 100);
    expect(e.dealt).toBeLessThan(expectedDamage({ ...f, guard: undefined }).dealt);
    let guarded = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const t = field();
      t.rng = seedRng(seed);
      const ta = setStats(place(data, t, 'enemy', 'captain', [5, 5], 'iron_sword'), SURE);
      const td = setStats(place(data, t, 'player', 'captain', [6, 5]), { hp: 60, def: 0, spd: 5 });
      place(data, t, 'player', 'bulwark', [7, 5]);
      const ev: GameEvent[] = [];
      resolveAttack(data, t, ta.uid, td.uid, undefined, ev);
      if (ev.some((x) => x.t === 'strike' && x.guarded)) guarded++;
    }
    expect(guarded).toBeGreaterThan(0);
    expect(guarded).toBeLessThan(20);
  });
});

describe('Sturmbrecher: knockback', () => {
  it('the forecast names the field, the fight pushes the target there; blocked costs the extra damage', () => {
    const s = field();
    const a = setStats(place(data, s, 'player', 'breaker', [5, 5], 'iron_axe'), SURE);
    const d = setStats(place(data, s, 'enemy', 'brigand', [6, 5]), { hp: 90, def: 0, spd: 5, lck: 100 });
    const f = forecast(data, s, a.uid, d.uid);
    expect(f.attacker.status).toContainEqual({ status: 'knockback', chance: 100 });
    expect(f.attacker.knockback).toEqual({ to: [7, 5], blocked: false });
    resolveAttack(data, s, a.uid, d.uid, undefined, []);
    expect(d.pos).toEqual([7, 5]);

    place(data, s, 'enemy', 'brigand', [8, 5]);
    a.pos = [6, 5];
    const g = forecast(data, s, a.uid, d.uid);
    expect(g.attacker.knockback).toEqual({ to: [8, 5], blocked: true });
    const ev: GameEvent[] = [];
    const hp = d.hp;
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    expect(d.pos).toEqual([7, 5]);
    expect(hp - d.hp).toBe(g.attacker.damage * g.attacker.strikes + data.balance.status.knockbackBlockedDamage);
  });
});

describe('Duellant: counter first', () => {
  it('his counter strikes before the attack, in the forecast and the fight; the AI sees the risk', () => {
    const s = field();
    const a = setStats(place(data, s, 'enemy', 'brigand', [5, 5], 'iron_axe'), { ...SURE, hp: 5, spd: 5 });
    const d = setStats(place(data, s, 'player', 'duelist', [6, 5], 'iron_sword'), { ...SURE, spd: 5 });
    const f = forecast(data, s, a.uid, d.uid);
    expect(f.order[0]).toBe('d');
    expect(expectedDamage(f).dealt).toBe(0);
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    const first = ev.find((x): x is Extract<GameEvent, { t: 'strike' }> => x.t === 'strike')!;
    expect(first.attacker).toBe(d.uid);
  });
});

describe('Scharfschütze: range with a cap', () => {
  it('+1 range with bows, but never more than 4, Zielen included', () => {
    const s = field();
    const u = place(data, s, 'player', 'sharpshooter', [5, 5], 'iron_bow');
    const own = data.items.iron_bow!.rng![1];
    expect(weaponRange(data, s, u, u.equip.mainHand!.uid)[1]).toBe(Math.min(4, own + 1));
    expect(weaponRange(data, s, u, u.equip.mainHand!.uid, 3)[1]).toBe(4);
    const m = place(data, s, 'player', 'marksman', [3, 3], 'iron_bow');
    expect(weaponRange(data, s, m, m.equip.mainHand!.uid, 3)[1]).toBe(own + 3);
  });
});

describe('Weiser: wide casting', () => {
  it('earth raises a wall on the target and every free field around it; preview = resolution', () => {
    const s = field();
    const u = place(data, s, 'player', 'sage', [5, 5], 'rockfall');
    place(data, s, 'enemy', 'brigand', [7, 6]);
    const area = castArea(data, s, u, [7, 5])!;
    expect(area.centers).toHaveLength(4); // [7,5], [8,5], [7,4] and [6,5]; [7,6] holds a foe
    resolveCast(data, s, u, [7, 5], []);
    for (const p of area.centers) expect(terrainAt(s, p)).toBe('rockwall');
    expect(terrainAt(s, [7, 6])).toBe('plain');
    const elem = place(data, s, 'player', 'elementalist', [2, 2], 'rockfall');
    expect(castArea(data, s, elem, [2, 4])!.centers).toEqual([[2, 4]]);
  });
});

describe('Bischof: wide healing', () => {
  it('heals every hurt ally next to the target by the same amount; EXP grows per further target', () => {
    const s = field();
    const u = place(data, s, 'player', 'bishop', [5, 5], 'heal_staff');
    const t = place(data, s, 'player', 'captain', [6, 5]);
    const n = place(data, s, 'player', 'captain', [7, 5]);
    const far = place(data, s, 'player', 'captain', [8, 5]);
    for (const x of [t, n, far]) x.hp = 1;
    expect(healTiles(data, s, u, t.uid)).toEqual([t.pos, n.pos]);
    const r = applyCommand(data, s, { type: 'act', unit: u.uid, to: u.pos!, action: { kind: 'staff', target: t.uid } });
    const after = r.state.units;
    const hp = (id: string) => after.find((x) => x.uid === id)!.hp;
    expect(hp(t.uid)).toBe(hp(n.uid));
    expect(hp(t.uid)).toBeGreaterThan(1);
    expect(hp(far.uid)).toBe(1);
    expect(r.events.filter((e) => e.t === 'heal')).toHaveLength(2);
    const b = data.balance.experience;
    expect(staffHeal(data, s, u, t, u.equip.mainHand!).exp).toBe(b.heal + b.healExtraTarget);
    u.classId = 'healer';
    expect(staffHeal(data, s, u, t, u.equip.mainHand!)).toMatchObject({ exp: b.heal, radius: 0 });
  });
});

describe('Barde: cheer at range and on two allies', () => {
  it('reaches allies up to 2 away and may cheer a second one; a minstrel does not', () => {
    const s = field();
    const bard = place(data, s, 'player', 'bard', [5, 5], 'iron_dagger');
    const a1 = place(data, s, 'player', 'captain', [7, 5]);
    const a2 = place(data, s, 'player', 'captain', [5, 6]);
    const opt = availableActions(data, s, bard, bard.pos!).find((o) => o.kind === 'cheer');
    expect(opt?.targets?.sort()).toEqual([a1.uid, a2.uid].sort());
    expect(classPreview(data, s, bard, bard.pos!, { kind: 'cheer', target: a1.uid })).toMatchObject({ more: 1 });
    expect(classPreview(data, s, bard, bard.pos!, { kind: 'cheer', target: a1.uid, second: a2.uid })).toMatchObject({ more: 0, second: a2.uid });
    const cmd = { type: 'act' as const, unit: bard.uid, to: bard.pos!, action: { kind: 'cheer' as const, target: a1.uid, second: a2.uid } };
    expect(validate(data, s, cmd)).toBeNull();
    expect(validate(data, s, { ...cmd, action: { ...cmd.action, second: a1.uid } })).toBe('invalid_target');
    const r = applyCommand(data, s, cmd);
    for (const id of [a1.uid, a2.uid]) expect(r.state.units.find((x) => x.uid === id)!.buffs.some((x) => x.source === 'cheer')).toBe(true);

    const t = field();
    const min = place(data, t, 'player', 'minstrel', [5, 5], 'iron_dagger');
    const b1 = place(data, t, 'player', 'captain', [7, 5]);
    const b2 = place(data, t, 'player', 'captain', [5, 6]);
    expect(availableActions(data, t, min, min.pos!).find((o) => o.kind === 'cheer')?.targets).toEqual([b2.uid]);
    expect(validate(data, t, { type: 'act', unit: min.uid, to: min.pos!, action: { kind: 'cheer', target: b2.uid, second: b1.uid } })).toBe('invalid_target');
  });
});

describe('Bannerträger: aura on the neighbours', () => {
  it('neighbours ignore grief and gain +5 avoid, the bearer himself not; the forecast uses the same numbers', () => {
    const s = field();
    const bearer = place(data, s, 'player', 'standard_bearer', [5, 5], 'iron_dagger');
    const n = setStats(place(data, s, 'player', 'captain', [6, 5], 'iron_sword'), { ...SURE, skl: 0, lck: 0, spd: 10 });
    const foe = setStats(place(data, s, 'enemy', 'brigand', [7, 5], 'iron_axe'), { ...SURE, skl: 0, lck: 0, spd: 20 });
    n.grief = 2;
    bearer.grief = 2;
    const withAura = computeStats(data, n, { state: s });
    const own = computeStats(data, bearer, { state: s });
    bearer.pos = [1, 1];
    const without = computeStats(data, n, { state: s });
    expect(withAura.avoid - without.avoid).toBe(5);
    expect(withAura.hit - without.hit).toBe(data.balance.supports.griefHitPenalty);
    expect(own.skills.ignoreGrief).toBe(false);
    bearer.pos = [5, 5];
    const f = forecast(data, s, foe.uid, n.uid);
    bearer.pos = [1, 1];
    const g = forecast(data, s, foe.uid, n.uid);
    expect([f.attacker.hit, f.defender.hit].every((x) => x > 0 && x < 100)).toBe(true);
    expect(g.attacker.hit - f.attacker.hit).toBe(5);
    expect(f.defender.hit - g.defender.hit).toBe(data.balance.supports.griefHitPenalty);
  });
});
