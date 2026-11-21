/** Shield runes (story 16.4): tiers I to III, no weakness, one factor when body and shield share an element, fit checks, preview equals resolution. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { contentRefs } from '../../src/content/validateRefs';
import {
  applyCampaign,
  applyStatus,
  burningTileHit,
  elementMultiplier,
  forecast,
  newCampaign,
  newItem,
  resolveAttack,
  runeFits,
  runeSlotCount,
  validateCampaign,
  type BattleState,
  type BattleUnit,
  type CampaignState,
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

/** Sure-hit attacker with a weapon carrying `rune` against a sturdy defender with `shield` / `body` runes. */
function duel(rune: string, shield: string[], body: string[] = []) {
  const s = arena(data);
  s.locked = [];
  const a = setStats(place(data, s, 'player', 'captain', [5, 5], 'iron_sword'), { hp: 30, str: 12, mag: 10, skl: 60, spd: 5, lck: 0, def: 0, res: 0 });
  a.equip.mainHand!.runes = [rune];
  const d = setStats(place(data, s, 'enemy', 'brigand', [6, 5]), { hp: 99, str: 5, skl: 0, spd: 5, lck: 60, def: 2, res: 0 });
  d.equip = { offHand: inst('wooden_shield', shield), ...(body.length ? { body: inst('chainmail', body) } : {}) };
  return { s, a, d };
}
const dmg = (s: BattleState, a: BattleUnit, d: BattleUnit) => forecast(data, s, a.uid, d.uid).attacker.damage;
const burnChance = (s: BattleState, a: BattleUnit, d: BattleUnit) => forecast(data, s, a.uid, d.uid).attacker.status.find((x) => x.status === 'burning')?.chance;

describe('shield rune tier I: damage factor', () => {
  it('fire I takes the factor from balance against fire, nothing against water', () => {
    const f = data.balance.element.shieldRune.factor;
    expect(elementMultiplier(data, 'fire', undefined, [], { element: 'fire', tier: 1 })).toBe(f);
    expect(elementMultiplier(data, 'water', undefined, [], { element: 'fire', tier: 1 })).toBe(1);
    const bare = duel('fire_rune_1', []);
    const guarded = duel('fire_rune_1', ['fire_rune_1']);
    expect(dmg(guarded.s, guarded.a, guarded.d)).toBeLessThan(dmg(bare.s, bare.a, bare.d));
    const water = duel('fire_rune_1', ['water_rune_1']);
    expect(dmg(water.s, water.a, water.d)).toBe(dmg(bare.s, bare.a, bare.d));
  });

  it('tier I does not protect against the condition', () => {
    const { s, a, d } = duel('fire_rune_2', ['fire_rune_1']);
    expect(burnChance(s, a, d)).toBeGreaterThan(0);
    expect(applyStatus(data, s, d, 'burning', [])).toBe(true);
  });

  it('a locked runes mechanic switches the shield off', () => {
    const { s, a, d } = duel('fire_rune_1', ['fire_rune_1']);
    const on = dmg(s, a, d);
    s.locked = ['runes'];
    a.equip.mainHand!.runes = [];
    d.equip.offHand!.runes = [];
    const off = dmg(s, a, d);
    d.equip.offHand!.runes = ['fire_rune_1'];
    expect(dmg(s, a, d)).toBe(off);
    expect(on).toBeLessThanOrEqual(off);
  });
});

describe('shield rune tier II: immune to the condition', () => {
  it.each([
    ['fire', 'burning'],
    ['water', 'wet'],
    ['earth', 'slowed'],
  ] as const)('%s II refuses %s, tier I does not', (el, status) => {
    const two = duel('fire_rune_1', [`${el}_rune_2`]);
    expect(applyStatus(data, two.s, two.d, status, [])).toBe(false);
    expect(two.d.status).toEqual([]);
    const one = duel('fire_rune_1', [`${el}_rune_1`]);
    expect(applyStatus(data, one.s, one.d, status, [])).toBe(true);
  });

  it('wind II shows chance 0 for the knockback in the forecast, wind I does not', () => {
    const mk = (rune: string) => {
      const s = arena(data);
      s.locked = [];
      const a = setStats(place(data, s, 'player', 'elementalist', [5, 5], 'gust'), { mag: 10, skl: 60, lck: 0 });
      const d = setStats(place(data, s, 'enemy', 'brigand', [6, 5]), { hp: 99, res: 0, lck: 60, spd: 0 });
      d.equip = { offHand: inst('wooden_shield', [rune]) };
      return forecast(data, s, a.uid, d.uid).attacker.status.find((x) => x.status === 'knockback')?.chance;
    };
    expect(mk('wind_rune_1')).toBeGreaterThan(0);
    expect(mk('wind_rune_2')).toBe(0);
  });

  it('the forecast shows chance 0 for the burning weapon status', () => {
    const { s, a, d } = duel('fire_rune_2', ['fire_rune_2']);
    expect(burnChance(s, a, d)).toBe(0);
  });
});

describe('shield rune tier III: immune to the burning field', () => {
  const onFire = (rune: string) => {
    const { s, d } = duel('fire_rune_1', [rune]);
    s.terrain[d.pos![1] * s.width + d.pos![0]] = 'burning';
    const before = d.hp;
    burningTileHit(data, s, d, []);
    return { d, lost: before - d.hp };
  };
  it('fire III takes no damage and no condition, fire II takes the entry damage', () => {
    const three = onFire('fire_rune_3');
    expect(three.lost).toBe(0);
    expect(three.d.status).toEqual([]);
    const two = onFire('fire_rune_2');
    expect(two.lost).toBeGreaterThan(0);
    expect(two.d.status).toEqual([]); // II is immune to burning, but not to the field itself
  });
  it('a water III shield does not protect against fire', () => {
    expect(onFire('water_rune_3').lost).toBeGreaterThan(0);
  });
});

describe('no weakness, one factor', () => {
  const f = () => data.balance.element.shieldRune.factor;
  it('body and shield of the same element count once', () => {
    const g = { element: 'fire', tier: 1 } as const;
    expect(elementMultiplier(data, 'fire', 'fire', [], g)).toBe(f());
    const both = duel('fire_rune_1', ['fire_rune_1'], ['fire_rune_1']);
    const bodyOnly = duel('fire_rune_1', [], ['fire_rune_1']);
    expect(dmg(both.s, both.a, both.d)).toBe(dmg(bodyOnly.s, bodyOnly.a, bodyOnly.d));
  });
  it('a body weak against the element gets the shield factor against exactly that element', () => {
    // fire beats wind: a wind body is weak against fire
    expect(elementMultiplier(data, 'fire', 'wind', [])).toBe(data.balance.element.advantage);
    expect(elementMultiplier(data, 'fire', 'wind', [], { element: 'fire', tier: 1 })).toBe(f());
    expect(elementMultiplier(data, 'water', 'wind', [], { element: 'fire', tier: 1 })).toBe(elementMultiplier(data, 'water', 'wind', []));
  });
  it('a shield alone never makes the wearer more vulnerable', () => {
    for (const el of ['fire', 'water', 'earth', 'wind'] as const)
      for (const att of ['fire', 'water', 'earth', 'wind', 'light', 'dark'] as const)
        expect(elementMultiplier(data, att, undefined, [], { element: el, tier: 1 })).toBeLessThanOrEqual(1);
  });
});

describe('preview equals resolution', () => {
  it.each([[['fire_rune_1']], [['fire_rune_2']], [[]]])('the forecast damage is the damage dealt (shield %j)', (shield) => {
    const { s, a, d } = duel('fire_rune_2', shield);
    const f = forecast(data, s, a.uid, d.uid);
    expect(f.attacker.hit).toBe(100);
    expect(f.attacker.crit).toBe(0);
    const before = d.hp;
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    expect(before - d.hp).toBe(f.attacker.damage * f.attacker.strikes);
    // the status chance of the forecast is what the fight rolls: 0 means no burning after the fight
    if (f.attacker.status.every((x) => x.chance === 0)) expect(d.status).toEqual([]);
  });
});

describe('slot and fit', () => {
  function camp(): CampaignState {
    return newCampaign(data, 5, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  }
  const add = (c: CampaignState, id: string) => {
    const i = newItem(c, id, data);
    c.convoy.push(i);
    return i;
  };

  it('every shield has one slot, an old shield with runes: [] takes an element rune', () => {
    for (const id of ['wooden_shield', 'iron_shield', 'tower_shield']) expect(runeSlotCount(data, inst(id, []))).toBe(1);
    const c = camp();
    const sh = add(c, 'wooden_shield');
    sh.runes = [];
    const fire = add(c, 'fire_rune_2');
    expect(validateCampaign(data, c, { type: 'insertRune', item: sh.uid, rune: fire.uid })).toBeNull();
    const r = applyCampaign(data, c, { type: 'insertRune', item: sh.uid, rune: fire.uid }).campaign;
    expect(r.convoy.find((i) => i.uid === sh.uid)!.runes).toEqual(['fire_rune_2']);
  });

  it('light, dark and utility runes and a second rune are refused', () => {
    const c = camp();
    const sh = add(c, 'iron_shield');
    for (const id of ['light_rune_1', 'dark_rune_1', 'precision_rune']) {
      const r = add(c, id);
      expect(validateCampaign(data, c, { type: 'insertRune', item: sh.uid, rune: r.uid })).toBe('no_slot');
    }
    sh.runes = ['water_rune_1'];
    const fire = add(c, 'fire_rune_1');
    expect(validateCampaign(data, c, { type: 'insertRune', item: sh.uid, rune: fire.uid })).toBe('no_slot');
  });

  it('runeFits: weapons take anything, shield and body only fitting element runes', () => {
    const sword = data.items.iron_sword!;
    const shield = data.items.wooden_shield!;
    const mail = data.items.chainmail!;
    expect(runeFits(data, sword, data.runes.precision_rune!)).toBe(true);
    expect(runeFits(data, shield, data.runes.earth_rune_1!)).toBe(true);
    expect(runeFits(data, shield, data.runes.light_rune_1!)).toBe(false);
    expect(runeFits(data, mail, data.runes.light_rune_1!)).toBe(true);
    expect(runeFits(data, mail, data.runes.precision_rune!)).toBe(false);
  });

  it('content check: an enemy shield takes fitting element runes only', () => {
    const errors: string[] = [];
    const { item } = contentRefs(data, (_f, m) => errors.push(m));
    item('map.yaml', { def: 'iron_shield', runes: ['fire_rune_2'] }, 'enemy a');
    expect(errors).toEqual([]);
    item('map.yaml', { def: 'iron_shield', runes: ['light_rune_1'] }, 'enemy b');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('does not fit the shield');
  });
});
