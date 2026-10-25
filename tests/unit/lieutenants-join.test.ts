/** A lieutenant changes sides (story 3.7): Grosk as a companion, the effect `recruit: { lt }`, exclusion, grudge, army limit, wanted list. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import {
  activeLieutenants,
  applyCampaign,
  armyCount,
  armyOverLimit,
  beginBattle,
  consequenceLines,
  createBattle,
  dismissError,
  finishBattle,
  hireError,
  isJoined,
  ltOpeningLine,
  mercenaryRoom,
  newCampaign,
  newItem,
  normalizeCampaign,
  validateCampaign,
  wantedList,
  wantedView,
  type BattleState,
  type CampaignEvent,
  type CampaignState,
  type Effect,
  type GameData,
  type SceneDef,
  type UnitRecord,
} from '../../src/core';
import { clone } from '../../src/core/util';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];

const fresh = (): CampaignState => newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const JOIN: Effect[] = [{ recruit: { lt: 'grosk' } }];
const join = (c: CampaignState, effects: Effect[] = JOIN) => applyCampaign(data, c, { type: 'effects', effects });
/** A company whose strongest units stand at `level`. */
const atLevel = (level: number): CampaignState => {
  const c = fresh();
  for (const u of c.roster) u.level = level;
  return c;
};
const roundDiv = (n: number, d: number) => Math.floor((2 * n + d) / (2 * d));

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

describe('content (AC 1)', () => {
  it('Grosk is a companion of his lieutenant id with the decided values', () => {
    const g = data.chars.grosk!;
    expect(g).toMatchObject({ class: 'vanguard', affinity: 'earth', level: 5, personalSkill: 'for_the_little_ones', joins: 'lieutenant' });
    expect(g.base).toEqual({ hp: 30, str: 9, mag: 0, skl: 5, spd: 3, lck: 3, def: 7, res: 1 });
    expect(g.growth).toEqual({ hp: 90, str: 50, mag: 0, skl: 35, spd: 25, lck: 30, def: 40, res: 10 });
    expect(g.items.map((i) => i.def)).toEqual(['iron_axe', 'little_hands', 'vulnerary']);
    expect(data.skills.for_the_little_ones).toMatchObject({ source: 'personal', trigger: 'on_attack', condition: { adjacentAllies: 1 }, effect: { hitBonus: 10, damageBonus: 2 } });
    expect(data.flags.joined_grosk).toBeDefined();
    expect(data.supports['grosk|tobin']).toMatchObject({ core: false, talks: { C: 'scn.support.grosk_tobin.C', B: 'scn.support.grosk_tobin.B', A: 'scn.support.grosk_tobin.A' } });
  });

  it('he does not start in a campaign, and the shipped content is clean', () => {
    expect(fresh().roster.some((r) => r.id === 'grosk')).toBe(false);
    expect(validateContent(data, locales)).toEqual([]);
  });

  it('Ulvric is a wolf rider whose signature and grudge skills fit the class', () => {
    const u = data.lieutenants.ulvric!;
    expect(u.class).toBe('wolf_rider');
    expect(data.classes.wolf_rider!.weaponGroups).toContain(data.items[u.signatureItem]!.group);
    expect(data.items[u.signatureItem]!.group).toBe('lance');
  });
});

describe('the effect (AC 2, 3, 6)', () => {
  it('validates the lieutenant: unknown, no join, fallen, plain id of a lieutenant', () => {
    const c = fresh();
    expect(validateCampaign(data, c, { type: 'effects', effects: JOIN })).toBeNull();
    expect(validateCampaign(data, c, { type: 'effects', effects: [{ recruit: { lt: 'nobody' } }] })).toBe('unknown_unit');
    expect(validateCampaign(data, c, { type: 'effects', effects: [{ recruit: { lt: 'hask' } }] })).toBe('effect_invalid');
    expect(validateCampaign(data, c, { type: 'effects', effects: [{ recruit: 'grosk' }] })).toBe('effect_invalid');
    const dead = clone(c);
    dead.fallen.push({ id: 'grosk', nameKey: 'unit.grosk.name', node: 'ch01' });
    expect(validateCampaign(data, dead, { type: 'effects', effects: JOIN })).toBe('effect_invalid');
  });

  it('content:check names a wrong lt reference', () => {
    const problems = (e: unknown) => {
      const d = clone(data);
      d.scenes['scn.prologue.intro']!.lines.push({ id: 'x2', choice: [{ id: 'a', stance: 'warm', text: 'x', effects: [e] }, { id: 'b', stance: 'sober', text: 'y' }] } as never);
      // the bare test answer lacks texts and a title; only the messages about the effect count here
      return validateContent(d, locales).map((i) => i.message).filter((m) => /recruit|lieutenant/.test(m));
    };
    expect(problems({ recruit: { lt: 'grosk' } })).toEqual([]);
    expect(problems({ recruit: { lt: 'ghost' } })).toContainEqual(expect.stringContaining('unknown lieutenant ghost'));
    expect(problems({ recruit: { lt: 'hask' } })).toContainEqual(expect.stringContaining('lieutenant hask does not join'));
    expect(problems({ recruit: 'grosk' })).toContainEqual(expect.stringContaining('is a lieutenant'));
  });

  it('joins at the strength of the company without grudge, stats as the expected values from level 5', () => {
    const c = atLevel(10);
    c.lieutenants = { grosk: { met: true, encounters: 1, grudge: 3, routs: 2, signatureDropped: false } };
    const g = join(c).campaign.roster.find((r) => r.id === 'grosk')!;
    expect(g.level).toBe(10); // grudge 3 does not count
    const mod = data.classes.vanguard!.growthMod;
    const caps = data.classes.vanguard!.caps;
    for (const k of Object.keys(g.stats) as Array<keyof typeof g.stats>) {
      const rate = Math.max(0, data.chars.grosk!.growth[k] + (mod[k] ?? 0));
      expect(g.stats[k], k).toBe(Math.min(caps[k], data.chars.grosk!.base[k] + roundDiv(rate * 5, 100)));
      expect(g.expected[k], k).toBeCloseTo((rate * 5) / 100, 6);
      expect(g.gained[k], k).toBe(g.stats[k] - data.chars.grosk!.base[k]);
    }
    expect(g).toMatchObject({ charId: 'grosk', classId: 'vanguard', exp: 0, affinity: 'earth', personalSkill: 'for_the_little_ones', nameKey: 'unit.grosk.name' });
  });

  it('a weak company still gives him his base level and base stats', () => {
    const g = join(fresh()).campaign.roster.find((r) => r.id === 'grosk')!;
    expect(g.level).toBe(5);
    expect(g.stats).toEqual(data.chars.grosk!.base);
    expect(g.gained).toEqual({ hp: 0, str: 0, mag: 0, skl: 0, spd: 0, lck: 0, def: 0, res: 0 });
  });

  it('carries his start gear including the signature item', () => {
    const g = join(fresh()).campaign.roster.find((r) => r.id === 'grosk')!;
    expect(g.equip.mainHand?.def).toBe('iron_axe');
    expect(g.equip.offHand?.def).toBe('little_hands');
    expect(g.bag.map((i) => i.def)).toEqual(['vulnerary']);
  });

  it('takes the signature item the company holds already instead of a second one', () => {
    for (const where of ['convoy', 'hand'] as const) {
      const c = fresh();
      const loot = newItem(c, 'little_hands', data);
      if (where === 'convoy') c.convoy.push(loot);
      else c.roster.find((r) => r.id === 'tobin')!.equip.offHand = loot;
      const after = join(c).campaign;
      const g = after.roster.find((r) => r.id === 'grosk')!;
      expect(g.equip.offHand?.uid, where).toBe(loot.uid);
      const all = [...after.convoy, ...after.roster.flatMap((r) => [...Object.values(r.equip), ...r.bag])].filter((i) => i?.def === 'little_hands');
      expect(all, where).toHaveLength(1);
    }
  });

  it('sets the flag and reports companionJoined instead of unitJoined, once', () => {
    const r = join(fresh());
    const t = r.events.map((e) => e.t);
    expect(r.events).toContainEqual({ t: 'companionJoined', unit: 'grosk' });
    expect(t).not.toContain('unitJoined');
    expect(r.events).toContainEqual({ t: 'flagSet', flag: 'joined_grosk', value: true });
    expect(r.campaign.flags.joined_grosk).toBe(true);
    // a second recruit changes nothing
    const again = join(r.campaign);
    expect(again.events).toEqual([]);
    expect(again.campaign.roster.filter((x) => x.id === 'grosk')).toHaveLength(1);
    expect(again.campaign).toEqual(r.campaign);
  });

  it('a scene answer can bring him over (decision E3 of epic 9), and the consequence card names him', () => {
    const scene: SceneDef = {
      id: 'scn.test.e3',
      lines: [{ id: 'c01', title: 'Grosk', choice: [{ id: 'take', stance: 'warm', text: 'Komm mit.', summary: 'Grosk schliesst sich an', effects: JOIN }, { id: 'no', stance: 'sober', text: 'Geh.', summary: 'Grosk bleibt' }] }],
    };
    const d = clone(data);
    d.scenes[scene.id] = scene;
    const c = fresh();
    const r = applyCampaign(d, c, { type: 'choose', scene: scene.id, line: 'c01', option: 'take' });
    expect(isJoined(r.campaign, 'grosk')).toBe(true);
    expect(r.campaign.roster.some((x) => x.id === 'grosk')).toBe(true);
    expect(r.events.map((e) => e.t)).toContain('companionJoined');
    expect(consequenceLines(JOIN)).toContainEqual({ kind: 'recruit', unit: 'grosk' });
  });

  it('the plain recruit of a companion still reports unitJoined', () => {
    const r = join(fresh(), [{ recruit: 'mira' }]);
    expect(r.events).toEqual([{ t: 'unitJoined', unit: 'mira' }]);
  });
});

describe('exclusion (AC 4)', () => {
  it('isJoined reads the flag; activeLieutenants leaves the joined out, in content order', () => {
    const c = fresh();
    expect(isJoined(c, 'grosk')).toBe(false);
    expect(activeLieutenants(data, c).map((l) => l.id)).toEqual(['hask', 'morra', 'ulvric', 'grosk']);
    const after = join(c).campaign;
    expect(isJoined(after, 'grosk')).toBe(true);
    expect(isJoined(after, 'hask')).toBe(false);
    expect(activeLieutenants(data, after).map((l) => l.id)).toEqual(['hask', 'morra', 'ulvric']);
  });

  /** A won prologue with Grosk (lieutenant) on the map, driven off by Kael. */
  const wonWithGrosk = (c: CampaignState): BattleState => {
    const s = beginBattle(data, c, 'prologue', c.roster.map((r) => r.id)).state;
    const lt = clone(s.units.find((u) => u.team === 'enemy')!);
    lt.uid = 'lt1';
    lt.lieutenant = 'grosk';
    lt.gone = 'fled';
    lt.fledBy = s.units.find((u) => u.id === 'kael')!.uid;
    lt.pos = null;
    s.units.push(lt);
    s.outcome = 'victory';
    return s;
  };

  it('a joined lieutenant earns no encounter, no bounty and no opening line', () => {
    const c = join(fresh()).campaign;
    const gold = c.gold;
    const out = finishBattle(data, c, wonWithGrosk(c));
    expect(out.result.bounty).toEqual([]);
    expect(out.campaign.gold).toBe(gold + out.result.gold);
    expect(out.campaign.lieutenants!.grosk).toMatchObject({ grudge: 0, routs: 0 });
    const unit = { lieutenant: 'grosk' } as never;
    expect(ltOpeningLine(c, unit)).toBeNull();
    // an enemy lieutenant who did not join still pays
    const foe = fresh();
    expect(finishBattle(data, foe, wonWithGrosk(foe)).result.bounty).toHaveLength(1);
  });

  it('a map unit of a joined lieutenant is not built', () => {
    const d = clone(data);
    const node = d.campaign.nodes.find((n) => n.id === 'ch01')!;
    const map = d.maps[node.map]!;
    const hask = map.units.find((u) => u.lieutenant === 'hask')!;
    map.units.push({ ...hask, id: 'grosk_unit', lieutenant: 'grosk' });
    const count = (c: CampaignState, who: string) => createBattle(d, c, 'ch01', c.roster.map((r) => r.id)).units.filter((u) => u.lieutenant === who).length;
    const c = fresh();
    expect(count(c, 'grosk')).toBe(1);
    const after = join(c).campaign;
    expect(count({ ...after }, 'grosk')).toBe(0);
    expect(count(after, 'hask')).toBe(1); // the others stay
  });
});

describe('the grudge lapses (AC 5)', () => {
  it('his own grudge and target are gone, the grudge against him loses its target', () => {
    const c = atLevel(6);
    c.lieutenants = {
      grosk: { met: true, encounters: 2, grudge: 2, target: 'kael', routs: 2, signatureDropped: false },
      hask: { met: true, encounters: 1, grudge: 1, target: 'grosk', routs: 1, signatureDropped: false },
      morra: { met: true, encounters: 1, grudge: 1, target: 'kael', routs: 1, signatureDropped: false },
    };
    const r = join(c);
    expect(r.campaign.lieutenants!.grosk).toEqual({ met: true, encounters: 2, grudge: 0, routs: 2, signatureDropped: false });
    expect(r.campaign.lieutenants!.hask).toEqual({ met: true, encounters: 1, grudge: 1, routs: 1, signatureDropped: false });
    expect(r.campaign.lieutenants!.morra!.target).toBe('kael');
    expect(r.events).toContainEqual({ t: 'grudgeChanged', lt: 'grosk', grudge: 0 });
    // with no target the opening line of hask picks nothing
    const hask = { lieutenant: 'hask', grudge: 1 } as never;
    expect(ltOpeningLine(r.campaign, hask)).toBeNull();
  });
});

describe('army limit (AC 7)', () => {
  /** A company at its limits: 20 companions (the avatar, Kael … and stand-ins), `mercs` hired mercenaries. */
  const full = (mercs: number): CampaignState => {
    const c = fresh();
    const proto = c.roster.find((r) => r.id === 'tobin')!;
    let i = 0;
    while (armyCount(c).companions < data.balance.economy.armyLimit) c.roster.push({ ...clone(proto), id: `stand${i}`, charId: `stand${i++}` } as UnitRecord);
    for (let m = 0; m < mercs; m++) {
      const rec = clone(proto) as UnitRecord;
      c.roster.push({ ...rec, id: `merc${100 + m}`, charId: undefined, equip: { mainHand: newItem(c, 'iron_lance', data) }, bag: [] });
    }
    return c;
  };

  it('the company fits at its limits', () => {
    const c = full(data.balance.economy.mercenaryLimit);
    expect(armyCount(c)).toEqual({ companions: 20, mercenaries: 6 });
    expect(armyOverLimit(data, c)).toBeNull();
    expect(mercenaryRoom(data, c)).toBe(6);
  });

  it('he joins anyway; then one mercenary has to go before the next mission', () => {
    const c = full(6);
    expect(validateCampaign(data, c, { type: 'effects', effects: JOIN })).toBeNull();
    const over = join(c).campaign;
    expect(armyCount(over)).toEqual({ companions: 21, mercenaries: 6 });
    expect(armyOverLimit(data, over)).toEqual({ companions: 1, dismiss: 1 });
    expect(mercenaryRoom(data, over)).toBe(5);
    // the tavern cannot hire into the place he took
    over.tavern = [clone(over.roster[0]!)];
    over.tavern[0]!.id = 'merc999';
    expect(hireError(data, over, 'merc999')).toBe('army_full');
  });

  it('dismissing a mercenary frees the mission; his gear goes to the convoy; companions cannot be dismissed', () => {
    const over = join(full(6)).campaign;
    expect(dismissError(over, 'merc100')).toBeNull();
    expect(dismissError(over, 'tobin')).toBe('not_available');
    expect(dismissError(over, 'nobody')).toBe('unknown_unit');
    expect(validateCampaign(data, over, { type: 'dismiss', unit: 'tobin' })).toBe('not_available');
    const convoy = over.convoy.length;
    const r = applyCampaign(data, over, { type: 'dismiss', unit: 'merc100' });
    expect(r.events).toContainEqual({ t: 'unitLeft', unit: 'merc100' });
    expect(r.campaign.roster.some((u) => u.id === 'merc100')).toBe(false);
    expect(r.campaign.convoy).toHaveLength(convoy + 1);
    expect(armyOverLimit(data, r.campaign)).toBeNull();
  });

  it('companions over the limit with no mercenary left to dismiss block nothing', () => {
    const over = join(full(0)).campaign;
    expect(armyCount(over).companions).toBe(21);
    expect(armyOverLimit(data, over)).toBeNull();
  });

  it('mercenaries over their own limit are dismissed down to it', () => {
    const c = full(7);
    expect(armyOverLimit(data, c)).toEqual({ companions: 0, dismiss: 1 });
  });
});

describe('wanted list (decision 2026-10-25)', () => {
  it('a joined lieutenant stays with his meetings, without grudge and bounty target, marked as joined', () => {
    const c = atLevel(6);
    c.lieutenants = { grosk: { met: true, encounters: 2, grudge: 2, target: 'kael', routs: 3, signatureDropped: false } };
    expect(wantedView(data, c, 'grosk')).toMatchObject({ joined: false, grudge: 2 });
    const after = join(c).campaign;
    const v = wantedView(data, after, 'grosk')!;
    expect(v).toMatchObject({ joined: true, grudge: 0, encounters: 2, routs: 3, met: true, target: { kind: 'none' } });
    expect(wantedList(data, after).map((x) => x.id)).toEqual(['grosk']);
    // joined without ever having been met still appears
    expect(wantedList(data, join(fresh()).campaign).map((x) => [x.id, x.joined])).toEqual([['grosk', true]]);
    expect(wantedList(data, fresh())).toEqual([]);
  });
});

describe('saves (AC 9)', () => {
  it('a campaign with a joined lieutenant survives a save round trip; older saves get the new pair', () => {
    const after = join(atLevel(8)).campaign;
    const loaded = normalizeCampaign(data, JSON.parse(JSON.stringify(after)) as CampaignState);
    expect(loaded.flags.joined_grosk).toBe(true);
    expect(loaded.roster.find((r) => r.id === 'grosk')).toEqual(after.roster.find((r) => r.id === 'grosk'));
    const old = clone(fresh());
    delete old.supports['grosk|tobin'];
    expect(normalizeCampaign(data, old).supports['grosk|tobin']).toEqual({ points: 0, rank: null });
  });

  it('events are plain JSON', () => {
    const events: CampaignEvent[] = join(fresh()).events;
    expect(JSON.parse(JSON.stringify(events))).toEqual(events);
  });
});
