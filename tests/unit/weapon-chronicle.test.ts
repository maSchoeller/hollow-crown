/**
 * Weapon chronicle (story 16.5): kills on the weapon instance, epithets as data, no effect on values, no RNG draw.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { loadContentFromDisk } from '../../src/content/node';
import { forecast, resolveAttack, type BattleState, type BattleUnit, type GameData, type GameEvent, type Stats } from '../../src/core';
import { epithetText } from '../../src/core/rules/chronicle';
import { arena, place } from '../fixtures/arena';

let data: GameData;
beforeAll(() => {
  data = loadContentFromDisk().data;
});

function setStats(u: BattleUnit, st: Partial<Stats>): BattleUnit {
  Object.assign(u.stats, st);
  u.hp = u.stats.hp;
  return u;
}

/** Sure-hit attacker next to a foe: `foeHp` decides whether the first blow fells it. */
function duel(foeHp: number, weapon = 'iron_sword') {
  const s: BattleState = arena(data);
  s.locked = [];
  const a = setStats(place(data, s, 'player', 'captain', [5, 5], weapon), { hp: 30, str: 10, skl: 60, spd: 5, lck: 0, def: 0, res: 0 });
  const d = setStats(place(data, s, 'enemy', 'brigand', [6, 5]), { hp: foeHp, str: 5, skl: 0, spd: 5, lck: 60, def: 0, res: 0 });
  return { s, a, d };
}
const chronicle = (ev: GameEvent[]) => ev.filter((e): e is Extract<GameEvent, { t: 'chronicle' }> => e.t === 'chronicle');

describe('kills', () => {
  it('a felling blow counts on the weapon and reports it', () => {
    const { s, a, d } = duel(1);
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    expect(d.gone).toBe('dead');
    expect(a.equip.mainHand!.kills).toBe(1);
    expect(a.equip.mainHand!.killsBy).toEqual({ [a.id]: 1 });
    expect(chronicle(ev)).toEqual([{ t: 'chronicle', unit: a.uid, uid: a.equip.mainHand!.uid, kills: 1 }]);
  });

  it('a counter that fells the attacker counts for the defender weapon', () => {
    const s: BattleState = arena(data);
    s.locked = [];
    const me = setStats(place(data, s, 'player', 'captain', [5, 5], 'iron_sword'), { hp: 30, str: 20, skl: 60, spd: 30, lck: 60, def: 5, res: 0 });
    const foe = setStats(place(data, s, 'enemy', 'brigand', [6, 5], 'iron_sword'), { hp: 1, str: 1, skl: 0, spd: 1, lck: 0, def: 0, res: 0 });
    resolveAttack(data, s, foe.uid, me.uid, undefined, []);
    expect(foe.gone).toBe('dead');
    expect(me.equip.mainHand!.kills).toBe(1);
  });

  it('a blow that does not fell the foe counts nothing', () => {
    const { s, a, d } = duel(60);
    resolveAttack(data, s, a.uid, d.uid, undefined, []);
    expect(d.gone).toBeUndefined();
    expect(a.equip.mainHand!.kills).toBeUndefined();
  });

  it('a lieutenant driven off counts and earns a lieutenant epithet at once, only if there is none yet', () => {
    const { s, a, d } = duel(1);
    d.lieutenant = 'hask';
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    expect(d.gone).toBe('fled');
    expect(a.equip.mainHand!.kills).toBe(1);
    expect(a.equip.mainHand!.epithet).toEqual({ kind: 'lieutenant', lt: 'hask' });
    expect(chronicle(ev)[0]!.epithet).toEqual({ kind: 'lieutenant', lt: 'hask' });
    // a second lieutenant does not replace it
    const d2 = setStats(place(data, s, 'enemy', 'brigand', [4, 5]), { hp: 1, lck: 60 });
    d2.lieutenant = 'other';
    a.acted = false;
    const ev2: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d2.uid, undefined, ev2);
    expect(a.equip.mainHand!.kills).toBe(2);
    expect(a.equip.mainHand!.epithet).toEqual({ kind: 'lieutenant', lt: 'hask' });
    expect(chronicle(ev2)[0]!.epithet).toBeUndefined();
  });

  it('the threshold kill earns a holder epithet for the unit with the most kills, once', () => {
    const { s, a, d } = duel(1);
    const n = data.balance.weaponChronicle.epithetKills;
    const inst = a.equip.mainHand!;
    inst.kills = n - 1;
    inst.killsBy = { elder: n - 2, [a.id]: 1 };
    const ev: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d.uid, undefined, ev);
    expect(inst.kills).toBe(n);
    expect(inst.epithet).toMatchObject({ kind: 'holder', by: 'elder' });
    expect(chronicle(ev)[0]!.epithet).toEqual(inst.epithet);
    const first = inst.epithet;
    const d2 = setStats(place(data, s, 'enemy', 'brigand', [4, 5]), { hp: 1, lck: 60 });
    a.acted = false;
    const ev2: GameEvent[] = [];
    resolveAttack(data, s, a.uid, d2.uid, undefined, ev2);
    expect(inst.epithet).toBe(first);
    expect(chronicle(ev2)[0]!.epithet).toBeUndefined();
  });

  it('is deterministic and leaves the RNG alone', () => {
    const run = () => {
      const { s, a, d } = duel(1);
      a.equip.mainHand!.kills = data.balance.weaponChronicle.epithetKills - 1;
      resolveAttack(data, s, a.uid, d.uid, undefined, []);
      return { inst: a.equip.mainHand, rng: JSON.stringify(s.rng) };
    };
    const x = run();
    const y = run();
    expect(x.inst).toEqual(y.inst);
    expect(x.inst!.epithet).toBeDefined();
    expect(x.rng).toBe(y.rng);
  });

  it('does not change values: the forecast is the same with and without kills', () => {
    const { s, a, d } = duel(30);
    const before = JSON.stringify(forecast(data, s, a.uid, d.uid));
    a.equip.mainHand!.kills = 50;
    a.equip.mainHand!.killsBy = { [a.id]: 50 };
    a.equip.mainHand!.epithet = { kind: 'holder', by: a.id, word: 2 };
    expect(JSON.stringify(forecast(data, s, a.uid, d.uid))).toBe(before);
  });

  it('enemy weapons keep no chronicle', () => {
    const s: BattleState = arena(data);
    s.locked = [];
    const me = setStats(place(data, s, 'player', 'captain', [5, 5], 'iron_sword'), { hp: 1, str: 1, skl: 0, spd: 1, lck: 0, def: 0, res: 0 });
    const foe = setStats(place(data, s, 'enemy', 'brigand', [6, 5], 'iron_sword'), { hp: 30, str: 40, skl: 60, spd: 40, lck: 60, def: 0, res: 0 });
    resolveAttack(data, s, foe.uid, me.uid, undefined, []);
    expect(me.downed || me.gone === 'dead').toBe(true);
    expect(foe.equip.mainHand!.kills).toBeUndefined();
  });
});

describe('old saves', () => {
  it('a save of format 3 holds weapons without the fields', () => {
    const rec = JSON.parse(readFileSync(join(process.cwd(), 'tests/fixtures/saves/format3-act1-finale-done.json'), 'utf8')) as { payload?: { campaign?: { roster?: Array<{ equip: Record<string, { kills?: number; epithet?: unknown }> }> } } };
    const roster = rec.payload?.campaign?.roster ?? [];
    expect(roster.length).toBeGreaterThan(0);
    for (const u of roster)
      for (const i of Object.values(u.equip)) {
        expect(i.kills ?? 0).toBe(0);
        expect(i.epithet).toBeUndefined();
      }
  });
});

describe('texts', () => {
  const read = (lang: string) => parse(readFileSync(join(process.cwd(), 'content/core/locales', lang + '.yaml'), 'utf8')) as Record<string, string>;
  const de = read('de');
  const en = read('en');
  const tt = (d: Record<string, string>) => (key: string, p: Record<string, string | number> = {}) => (d[key] ?? key).replace(/\{(\w+)\}/g, (_, k: string) => String(p[k]));
  const AP = String.fromCharCode(39);

  it('has every word of every type in both languages', () => {
    for (const [type, n] of Object.entries(data.balance.weaponChronicle.words))
      for (let i = 0; i < n; i++) {
        expect(de['chronicle.word.' + type + '.' + i], 'de ' + type + ' ' + i).toBeTruthy();
        expect(en['chronicle.word.' + type + '.' + i], 'en ' + type + ' ' + i).toBeTruthy();
      }
  });

  it('builds the epithet text', () => {
    const name = (id: string) => ({ brenna: 'Brenna', lucas: 'Lucas', hask: 'Hask' })[id] ?? id;
    expect(epithetText(tt(de), name, { kind: 'holder', by: 'brenna', word: 0 }, 'sword')).toBe('Brennas Kerbe');
    expect(epithetText(tt(de), name, { kind: 'holder', by: 'lucas', word: 0 }, 'sword')).toBe('Lucas' + AP + ' Kerbe');
    expect(epithetText(tt(de), name, { kind: 'lieutenant', lt: 'hask' }, 'sword')).toBe('Haskbrecher');
    expect(epithetText(tt(en), name, { kind: 'holder', by: 'brenna', word: 0 }, 'sword')).toBe('Brenna' + AP + 's Notch');
    expect(epithetText(tt(en), name, { kind: 'holder', by: 'lucas', word: 0 }, 'sword')).toBe('Lucas' + AP + ' Notch');
    expect(epithetText(tt(en), name, { kind: 'lieutenant', lt: 'hask' }, 'sword')).toBe('Hask-Breaker');
  });
});