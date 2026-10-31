/** Numbers behind the board's legibility aids (epic 13): threat counts, the chosen field's foes, kill markers, peril warnings, the foe phase recap. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  beginBattle,
  computeStats,
  damageAtHit,
  forecast,
  killMarks,
  newCampaign,
  newItem,
  perilWarnings,
  phaseRecap,
  posKey,
  threatCounts,
  threatMap,
  threatTiles,
  tileThreats,
  type BattleState,
  type BattleUnit,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

/** Prologue state with every unit taken off the map; the tests place their own on open plain. */
function arena(): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  for (const u of s.units) u.pos = null;
  s.units.forEach((u) => (u.gone = 'retreated'));
  s.outcome = null;
  s.lockedRoles = [];
  s.locked = [];
  s.terrain = s.terrain.map(() => 'plain');
  return s;
}

function place(s: BattleState, team: 'player' | 'enemy', classId: string, at: Pos, weapon?: string): BattleUnit {
  const u = s.units.find((x) => x.gone === 'retreated' && x.pos === null && x.team === team);
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
  u.usedPerMap = {};
  u.personalSkill = undefined;
  u.lieutenant = undefined;
  u.flags = [];
  u.ai = team === 'enemy' ? { profile: 'aggressive' } : undefined;
  u.hp = computeStats(data, u).maxHp;
  if (weapon) u.equip.mainHand = newItem(s, weapon, data);
  return u;
}

/** HP the forecast of `a` on `d` from `from` takes when every strike hits, including a first critical strike. */
function lossWith(s: BattleState, a: BattleUnit, d: BattleUnit, from: Pos, crit: boolean): number {
  const f = forecast(data, s, a.uid, d.uid, a.equip.mainHand!.uid, from);
  let hp = d.hp;
  let first = crit;
  let ahp = a.hp;
  for (const who of f.order) {
    if (hp <= 0 || ahp <= 0) break;
    if (who === 'a') {
      hp -= first ? f.attacker.damage * data.balance.combat.critMultiplier : f.attacker.damage;
      first = false;
    } else if (f.defender.canStrike) ahp -= f.defender.damage;
  }
  return d.hp - Math.max(0, hp);
}

describe('threat counts (story 13.5)', () => {
  it('counts every foe that can attack a field, hold/guard without moving', () => {
    const s = arena();
    place(s, 'player', 'skirmisher', [1, 1], 'iron_sword');
    const a = place(s, 'enemy', 'brigand', [6, 6], 'iron_axe');
    const b = place(s, 'enemy', 'brigand', [8, 6], 'iron_axe');
    const counts = threatCounts(data, s, 'player');
    const za = threatTiles(data, s, a);
    const zb = threatTiles(data, s, b);
    for (const [k, n] of counts) expect(n).toBe((za.has(k) ? 1 : 0) + (zb.has(k) ? 1 : 0));
    expect(counts.get('7,6')).toBe(2);
    b.ai = { profile: 'hold' };
    const held = threatCounts(data, s, 'player');
    expect([...threatTiles(data, s, b, true)].every((k) => held.has(k))).toBe(true);
    expect(held.get('8,9') ?? 0).toBe(za.has('8,9') ? 1 : 0);
  });

  it('leaves sleeping foes out and gives their fields as a dashed edge', () => {
    const s = arena();
    place(s, 'player', 'skirmisher', [1, 1], 'iron_sword');
    const a = place(s, 'enemy', 'brigand', [10, 10], 'iron_axe');
    a.ai = { profile: 'trigger', radius: 2, then: 'aggressive' };
    const m = threatMap(data, s, 'player');
    expect(m.byTile.size).toBe(0);
    expect(m.sleeping.size).toBe(threatTiles(data, s, a).size);
    a.ai.awake = true;
    a.ai.profile = 'aggressive';
    expect(threatMap(data, s, 'player').byTile.size).toBeGreaterThan(0);
  });

  it('counts only the chosen foes with `only`', () => {
    const s = arena();
    place(s, 'player', 'skirmisher', [1, 1], 'iron_sword');
    const a = place(s, 'enemy', 'brigand', [6, 6], 'iron_axe');
    place(s, 'enemy', 'brigand', [8, 6], 'iron_axe');
    const only = threatCounts(data, s, 'player', [a.uid]);
    expect(Math.max(...only.values())).toBe(1);
    expect(only.size).toBe(threatTiles(data, s, a).size);
  });
});

describe('foes that reach the chosen field (story 13.6)', () => {
  it('names each foe whose zone holds the field, the mover standing there', () => {
    const s = arena();
    const me = place(s, 'player', 'skirmisher', [1, 1], 'iron_sword');
    const a = place(s, 'enemy', 'brigand', [6, 6], 'iron_axe');
    const b = place(s, 'enemy', 'brigand', [12, 12], 'iron_axe');
    const near: Pos = [6, 4];
    expect(tileThreats(data, s, me, near)).toEqual([a.uid]);
    expect(tileThreats(data, s, me, [1, 1])).toEqual([]);
    expect(me.pos).toEqual([1, 1]);
    b.pos = [6, 2];
    expect(tileThreats(data, s, me, near).sort()).toEqual([a.uid, b.uid].sort());
  });
});

describe('kill markers (story 13.4)', () => {
  function duel(weapon = 'iron_sword', foeWeapon = 'iron_axe', cls = 'skirmisher', foeCls = 'brigand') {
    const s = arena();
    const me = place(s, 'player', cls, [3, 5], weapon);
    const foe = place(s, 'enemy', foeCls, [6, 5], foeWeapon);
    return { s, me, foe };
  }

  it('marks a foe that falls at hit, and not one with a point more', () => {
    const { s, me, foe } = duel();
    const loss = lossWith(s, me, foe, [5, 5], false);
    foe.hp = loss;
    expect(killMarks(data, s, me)).toEqual([{ target: foe.uid, kind: 'hit', flees: false }]);
    foe.hp = loss + 1;
    expect(killMarks(data, s, me).find((k) => k.kind === 'hit')).toBeUndefined();
  });

  it('counts the double attack (strikes from the forecast)', () => {
    const { s, me, foe } = duel('slim_sword');
    // far faster than the foe: the attacker strikes twice whatever the class values are
    me.stats = { ...me.stats, spd: computeStats(data, foe).as + data.balance.combat.doubleAttackThreshold + 20 };
    const f = forecast(data, s, me.uid, foe.uid, me.equip.mainHand!.uid, [5, 5]);
    expect(f.attacker.strikes).toBeGreaterThan(1);
    foe.hp = f.attacker.damage * f.attacker.strikes;
    expect(killMarks(data, s, me)[0]?.kind).toBe('hit');
    expect(damageAtHit(data, f)).toBe(Math.min(foe.hp, f.attacker.damage * f.attacker.strikes));
  });

  it('marks a foe that falls only with a critical hit as half', () => {
    const { s, me, foe } = duel('iron_dagger');
    const f = forecast(data, s, me.uid, foe.uid, me.equip.mainHand!.uid, [5, 5]);
    expect(f.attacker.crit).toBeGreaterThan(0);
    foe.hp = lossWith(s, me, foe, [5, 5], false) + 1;
    expect(lossWith(s, me, foe, [5, 5], true)).toBeGreaterThanOrEqual(foe.hp);
    expect(killMarks(data, s, me)).toEqual([{ target: foe.uid, kind: 'crit', flees: false }]);
  });

  it('follows the weapon triangle of the forecast', () => {
    // an axe beats a lance: the triangle bonus is in the numbers the marker counts with
    const { s, me, foe } = duel('iron_axe', 'iron_lance', 'vanguard', 'knight');
    const lance = lossWith(s, me, foe, [5, 5], false);
    foe.hp = lance;
    expect(killMarks(data, s, me)[0]?.kind).toBe('hit');
    const f = forecast(data, s, me.uid, foe.uid, me.equip.mainHand!.uid, [5, 5]);
    expect(f.attacker.triangle).toBe(1);
  });

  it('follows the element multiplier of the forecast', () => {
    const s = arena();
    const me = place(s, 'player', 'elementalist', [3, 5], 'ember');
    const foe = place(s, 'enemy', 'brigand', [6, 5], 'iron_axe');
    // fire beats wind (balance.yaml element.cycle): the multiplier is in the numbers the marker counts with
    foe.affinity = 'wind';
    const f = forecast(data, s, me.uid, foe.uid, me.equip.mainHand!.uid, [4, 5]);
    expect(f.attacker.elementMult).not.toBe(1);
    foe.hp = damageAtHit(data, { ...f, defender: { ...f.defender, hpBefore: 999 } });
    expect(killMarks(data, s, me)[0]?.kind).toBe('hit');
  });

  it('shows the flee mark for a lieutenant', () => {
    const { s, me, foe } = duel();
    foe.lieutenant = 'garr';
    foe.hp = 1;
    expect(killMarks(data, s, me)).toEqual([{ target: foe.uid, kind: 'hit', flees: true }]);
  });

  it('gives nothing for a unit that has acted or foes out of reach', () => {
    const { s, me, foe } = duel();
    foe.pos = [15, 15];
    foe.hp = 1;
    expect(killMarks(data, s, me)).toEqual([]);
    foe.pos = [6, 5];
    me.acted = true;
    expect(killMarks(data, s, me)).toEqual([]);
  });
});

describe('peril warnings (story 13.6)', () => {
  it('warns when the damage at hit of all foes that reach a unit takes its HP', () => {
    const s = arena();
    const me = place(s, 'player', 'skirmisher', [5, 5], 'iron_sword');
    const a = place(s, 'enemy', 'brigand', [8, 5], 'iron_axe');
    const b = place(s, 'enemy', 'brigand', [5, 8], 'iron_axe');
    const da = damageAtHit(data, forecast(data, s, a.uid, me.uid, a.equip.mainHand!.uid, [6, 5]));
    const db = damageAtHit(data, forecast(data, s, b.uid, me.uid, b.equip.mainHand!.uid, [5, 6]));
    me.hp = da + db;
    expect(perilWarnings(data, s)).toEqual([me.uid]);
    me.hp = da + db + 1;
    expect(perilWarnings(data, s)).toEqual([]);
    // a sleeping foe does not count
    me.hp = da + db;
    b.ai = { profile: 'trigger', radius: 1, then: 'aggressive' };
    expect(perilWarnings(data, s)).toEqual([]);
  });
});

describe('foe phase recap (story 13.7)', () => {
  it('lists downed and fallen first, then strikes, then reinforcements and woken foes', () => {
    const before = arena();
    const me = place(before, 'player', 'skirmisher', [5, 5], 'iron_sword');
    const you = place(before, 'player', 'skirmisher', [2, 2], 'iron_sword');
    const them = place(before, 'player', 'skirmisher', [9, 2], 'iron_sword');
    const foe = place(before, 'enemy', 'brigand', [8, 5], 'iron_axe');
    const sleeper = place(before, 'enemy', 'brigand', [12, 12], 'iron_axe');
    sleeper.ai = { profile: 'trigger', radius: 2, then: 'aggressive' };
    const after = structuredClone(before);
    const meA = after.units.find((u) => u.uid === me.uid)!;
    meA.hp = 0;
    meA.downed = true;
    meA.bleed = 0;
    after.units.find((u) => u.uid === you.uid)!.hp = you.hp - 4;
    const sl = after.units.find((u) => u.uid === sleeper.uid)!;
    sl.ai = { profile: 'aggressive', awake: true };
    const events: GameEvent[] = [
      { t: 'strike', attacker: foe.uid, defender: you.uid, hit: true, crit: false, dmg: 4, hpAfter: you.hp - 4, ranged: false, magic: false },
      { t: 'strike', attacker: foe.uid, defender: them.uid, hit: false, crit: false, dmg: 0, hpAfter: them.hp, ranged: false, magic: false },
      { t: 'strike', attacker: foe.uid, defender: me.uid, hit: true, crit: false, dmg: me.hp, hpAfter: 0, ranged: false, magic: false },
      { t: 'downed', unit: me.uid },
      { t: 'spawned', unit: foe.uid, reinforcement: true, at: [8, 5] },
    ];
    const rows = phaseRecap(data, before, after, events);
    expect(rows.map((r) => r.kind)).toEqual(['downed', 'hit', 'hit', 'reinforce', 'woke']);
    expect(rows[0]).toEqual({ kind: 'downed', unit: me.uid, left: data.balance.death.bleedOutTurns });
    expect(rows[1]).toEqual({ kind: 'hit', unit: you.uid, before: you.hp, after: you.hp - 4, dodged: false });
    expect(rows[2]).toEqual({ kind: 'hit', unit: them.uid, before: them.hp, after: them.hp, dodged: true });
    expect(rows[4]).toMatchObject({ kind: 'woke', unit: sleeper.uid, at: [12, 12] });
  });

  it('is empty when nothing happened', () => {
    const s = arena();
    place(s, 'player', 'skirmisher', [5, 5], 'iron_sword');
    expect(phaseRecap(data, s, structuredClone(s), [{ t: 'phase', phase: 'player', turn: 2 }])).toEqual([]);
  });

  it('says fallen for a death (classic) and drops the downed row then', () => {
    const before = arena();
    const me = place(before, 'player', 'skirmisher', [5, 5], 'iron_sword');
    const after = structuredClone(before);
    after.units.find((u) => u.uid === me.uid)!.gone = 'dead';
    const rows = phaseRecap(data, before, after, [{ t: 'downed', unit: me.uid }, { t: 'died', unit: me.uid }]);
    expect(rows).toEqual([{ kind: 'died', unit: me.uid }]);
    expect(posKey([1, 2])).toBe('1,2');
  });
});
