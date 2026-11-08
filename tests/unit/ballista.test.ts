/** Balliste (story 11.6): crew beside it, range 3–10 from its tile, height, fog, no counter, preview = resolution, AI rule, replay. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { mapSchema } from '../../src/content/schemaMap';
import { validateContent } from '../../src/content/validate';
import {
  applyCommand,
  autoCommand,
  autoplay,
  beginBattle,
  availableActions,
  ballistaForecast,
  ballistaTargets,
  canEquip,
  computeStats,
  contextEntries,
  crewSpots,
  conditionMet,
  dangerZone,
  forecast,
  weaponProfile,
  moveCost,
  newCampaign,
  newItem,
  posKey,
  reachable,
  replayBattle,
  seedRng,
  type BattleState,
  type BattleUnit,
  type Command,
  type GameData,
  type GameEvent,
  type MapDef,
  type Pos,
} from '../../src/core';

let data: GameData;
const restore: Array<() => void> = [];

beforeAll(() => {
  data = loadContentFromDisk().data;
});
afterEach(() => {
  while (restore.length) restore.pop()!();
});

const BALLISTA: Pos = [5, 2];

/** Prologue state with an open field, no unit on the map, and one ballista `b1` on [5,2] (terrain `ballista`). */
function arena(fog = false): BattleState {
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  for (const u of s.units) u.pos = null;
  s.units.forEach((u) => (u.gone = 'retreated'));
  s.outcome = null;
  s.lockedRoles = [];
  s.terrain = s.terrain.map(() => 'plain');
  delete s.levels;
  s.loot = [];
  s.timers = {};
  s.objects = [{ id: 'b1', type: 'ballista', at: BALLISTA, state: 'closed' }];
  setTile(s, BALLISTA, 'ballista');
  const map = data.maps[s.mapId]!;
  const was = { fog: map.fog, triggers: map.triggers, reinforcements: map.reinforcements };
  map.fog = fog;
  map.triggers = [];
  map.reinforcements = [];
  restore.push(() => Object.assign(map, was));
  return s;
}

function place(s: BattleState, team: BattleUnit['team'], classId: string, at: Pos, weapon?: string, profile?: NonNullable<BattleUnit['ai']>['profile']): BattleUnit {
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
  u.usedPerMap = {};
  u.personalSkill = undefined;
  u.flags = [];
  u.recruit = undefined;
  u.lieutenant = undefined;
  u.boss = undefined;
  u.ai = u.team === 'enemy' ? { profile: profile ?? 'hold' } : undefined;
  u.hp = computeStats(data, u).maxHp;
  if (weapon) u.equip.mainHand = newItem(s, weapon, data);
  return u;
}

const setTile = (s: BattleState, p: Pos, terrain: string) => (s.terrain[p[1] * s.width + p[0]] = terrain);
const targetsOf = (s: BattleState, u: BattleUnit, pos: Pos = u.pos!) => ballistaTargets(data, s, u, pos).b1 ?? [];
const shotsOf = (events: GameEvent[]) => events.filter((e) => e.t === 'combat' && e.weapon === 'ballista:b1');

describe('content of the ballista', () => {
  it('takes its numbers from the item ballista_bolt (items.yaml) and its crew from balance.yaml', () => {
    const d = data.items[data.balance.ballista.item]!;
    expect(data.balance.ballista.item).toBe('ballista_bolt');
    expect({ mt: d.mt, hit: d.hit, crit: d.crit, rng: d.rng, group: d.group, tags: d.tags?.includes('fixed') }).toEqual({ mt: 12, hit: 70, crit: 0, rng: [3, 10], group: 'siege', tags: true });
    expect(data.balance.ballista.crew).toEqual(['foot', 'armored']);
  });
  it('is outside the weapon triangle and no unit can hold its bolt', () => {
    const s = arena();
    const u = place(s, 'player', 'marksman', [1, 1]);
    expect(canEquip(data, u, newItem(s, 'ballista_bolt', data), 'mainHand')).toBe('wrong_slot');
    expect(data.balance.triangle).not.toHaveProperty('siege');
  });
  it('stands on no map of act 1', () => {
    for (const m of Object.values(data.maps)) if (m.act === 1) expect(m.objects.filter((o) => o.type === 'ballista')).toEqual([]);
  });
});

describe('crew and tile', () => {
  it('offers the shot to a unit of any team on a neighbouring tile, not from two tiles away or diagonally', () => {
    const s = arena();
    const crew = place(s, 'player', 'vanguard', [5, 3], 'iron_sword');
    place(s, 'enemy', 'brigand', [5, 8], 'iron_axe');
    const opt = availableActions(data, s, crew, crew.pos!).find((o) => o.kind === 'ballista');
    expect(opt).toMatchObject({ kind: 'ballista', object: 'b1' });
    expect(availableActions(data, s, crew, [5, 4]).some((o) => o.kind === 'ballista')).toBe(false);
    expect(availableActions(data, s, crew, [6, 3]).some((o) => o.kind === 'ballista')).toBe(false);
    const foe = place(s, 'enemy', 'brigand', [4, 2], 'iron_axe');
    place(s, 'player', 'vanguard', [5, 12], 'iron_sword');
    expect(targetsOf(s, foe)).toHaveLength(1);
  });
  it('lets no rider or flier work it (balance.ballista.crew)', () => {
    const s = arena();
    place(s, 'enemy', 'brigand', [5, 8], 'iron_axe');
    expect(targetsOf(s, place(s, 'player', 'pegasus_knight', [5, 3], 'iron_lance'))).toEqual([]);
    expect(targetsOf(s, place(s, 'player', 'knight', [4, 2], 'iron_lance'))).toHaveLength(1);
  });
  it('blocks its own tile for every move type', () => {
    const s = arena();
    const u = place(s, 'player', 'pegasus_knight', [5, 4], 'iron_lance');
    expect(moveCost(data, s, u, BALLISTA)).toBeNull();
    expect(reachable(data, s, u).has(posKey(BALLISTA))).toBe(false);
  });
  it('shows a context band "ballista" with its locale keys', () => {
    const s = arena();
    const crew = place(s, 'player', 'vanguard', [5, 3], 'iron_sword');
    place(s, 'enemy', 'brigand', [5, 8], 'iron_axe');
    const band = contextEntries(data, s, availableActions(data, s, crew, crew.pos!)).find((e) => e.kind === 'ballista');
    expect(band).toMatchObject({ id: 'ballista:b1', reason: { key: 'ui.ctx.ballistaSub' } });
  });
});

describe('range from the ballista tile', () => {
  it('reaches 3 to 10 tiles on one level: not 2, not 11', () => {
    const s = arena();
    const crew = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
    const at2 = place(s, 'enemy', 'brigand', [5, 4], 'iron_axe');
    const at3 = place(s, 'enemy', 'brigand', [5, 5], 'iron_axe');
    const at10 = place(s, 'enemy', 'brigand', [5, 12], 'iron_axe');
    const at11 = place(s, 'enemy', 'brigand', [5, 13], 'iron_axe');
    const t = targetsOf(s, crew);
    expect(t).toContain(at3.uid);
    expect(t).toContain(at10.uid);
    expect(t).not.toContain(at2.uid);
    expect(t).not.toContain(at11.uid);
  });
  it('reaches one tile further from a higher level onto a lower one (elevation.rangedBonus), not from below', () => {
    const s = arena();
    // the crew stands on the ballista's level (a wall walk beside it)
    s.levels = { [posKey(BALLISTA)]: 1, [posKey([4, 2])]: 1 };
    const crew = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
    const at11 = place(s, 'enemy', 'brigand', [5, 13], 'iron_axe');
    const at12 = place(s, 'enemy', 'brigand', [5, 14], 'iron_axe');
    expect(targetsOf(s, crew)).toEqual([at11.uid]);
    expect(data.balance.elevation.rangedBonus).toBe(1);
    s.levels = { [posKey([5, 13])]: 1 };
    expect(targetsOf(s, crew)).toEqual([]);
    expect(targetsOf(s, crew)).not.toContain(at12.uid);
  });
  it('under fog the player crew aims only at foes it sees; the AI sees all as for any attack', () => {
    const s = arena(true);
    const crew = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
    const near = place(s, 'enemy', 'brigand', [4, 5], 'iron_axe');
    const far = place(s, 'enemy', 'brigand', [5, 11], 'iron_axe');
    expect(targetsOf(s, crew)).toEqual([near.uid]);
    expect(targetsOf(s, crew)).not.toContain(far.uid);
    const foeCrew = place(s, 'enemy', 'brigand', [6, 2], 'iron_axe');
    const mark = place(s, 'player', 'vanguard', [5, 12], 'iron_sword');
    expect(targetsOf(s, foeCrew)).toContain(mark.uid);
  });
});

describe('the shot', () => {
  it('deals mt + STR of the crew − DEF, one strike, no counter, no double, and the preview is the resolution', () => {
    for (let seed = 1; seed < 40; seed++) {
      const s = arena();
      s.rng = seedRng(seed);
      const crew = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
      const foe = place(s, 'enemy', 'marksman', [5, 6], 'longbow');
      const f = ballistaForecast(data, s, crew.uid, 'b1', foe.uid);
      const cs = computeStats(data, crew);
      const fs = computeStats(data, foe);
      expect(f.attacker.damage).toBe(Math.max(0, cs.stats.str + 12 - fs.stats.def));
      expect(f.defender.canStrike).toBe(false);
      expect(f.order).toEqual(['a']);
      expect(f.tandem).toBeUndefined();
      expect(f.distance).toBe(4);
      const r = applyCommand(data, s, { type: 'act', unit: crew.uid, to: crew.pos!, action: { kind: 'ballista', object: 'b1', target: foe.uid } });
      const strikes = r.events.filter((e) => e.t === 'strike');
      expect(strikes).toHaveLength(1);
      expect(strikes[0]).toMatchObject({ attacker: crew.uid, defender: foe.uid, ranged: true });
      expect(shotsOf(r.events)).toHaveLength(1);
      const hit = strikes[0]!.t === 'strike' && strikes[0]!.hit && !strikes[0]!.crit;
      if (hit) {
        expect(strikes[0]).toMatchObject({ dmg: f.attacker.damage, hpAfter: f.defenderHpAfter });
        expect(r.state.units.find((u) => u.uid === crew.uid)!.hp).toBe(crew.hp);
        expect(r.state.units.find((u) => u.uid === crew.uid)!.acted).toBe(true);
        return;
      }
    }
    throw new Error('no plain hit in 40 seeds');
  });
  it('uses the same numbers as forecast with the siege option', () => {
    const s = arena();
    const crew = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
    const foe = place(s, 'enemy', 'brigand', [5, 6], 'iron_axe');
    const viaForecast = forecast(data, s, crew.uid, foe.uid, undefined, undefined, true, { siege: { weapon: newItemLike('b1'), from: BALLISTA } });
    expect(ballistaForecast(data, s, crew.uid, 'b1', foe.uid)).toEqual(viaForecast);
  });
  it('drives a lieutenant off at 0 HP instead of killing him; the preview says he flees', () => {
    for (let seed = 1; seed < 40; seed++) {
      const s = arena();
      s.rng = seedRng(seed);
      const crew = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
      const lt = place(s, 'enemy', 'brigand', [5, 7], 'iron_axe');
      lt.lieutenant = 'hask';
      lt.hp = 1;
      expect(ballistaForecast(data, s, crew.uid, 'b1', lt.uid).defenderFlees).toBe(true);
      const r = applyCommand(data, s, { type: 'act', unit: crew.uid, to: crew.pos!, action: { kind: 'ballista', object: 'b1', target: lt.uid } });
      const after = r.state.units.find((u) => u.uid === lt.uid)!;
      if (after.hp === 0) {
        expect(after.gone).toBe('fled');
        return;
      }
    }
    throw new Error('no hit in 40 seeds');
  });
  it('fires once per phase: a second crew waits for the next phase, unlimited bolts afterwards', () => {
    const s = arena();
    const a = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
    const b = place(s, 'player', 'vanguard', [6, 2], 'iron_sword');
    const foe = place(s, 'enemy', 'brigand', [5, 9], 'iron_axe');
    foe.hp = 999;
    let st = applyCommand(data, s, { type: 'act', unit: a.uid, to: a.pos!, action: { kind: 'ballista', object: 'b1', target: foe.uid } }).state;
    expect(st.objects[0]!.state).toBe('open');
    expect(() => applyCommand(data, st, { type: 'act', unit: b.uid, to: b.pos!, action: { kind: 'ballista', object: 'b1', target: foe.uid } })).toThrow();
    st = applyCommand(data, st, { type: 'endPhase' }).state;
    expect(st.phase).toBe('player');
    expect(st.objects[0]!.state).toBe('closed');
    expect(targetsOf(st, st.units.find((u) => u.uid === b.uid)!)).toContain(foe.uid);
  });
  it('refuses a target out of reach and an unknown ballista', () => {
    const s = arena();
    const crew = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
    const near = place(s, 'enemy', 'brigand', [5, 3], 'iron_axe');
    expect(() => applyCommand(data, s, { type: 'act', unit: crew.uid, to: crew.pos!, action: { kind: 'ballista', object: 'b1', target: near.uid } })).toThrow(/invalid_command/);
    place(s, 'enemy', 'brigand', [5, 9], 'iron_axe');
    expect(() => applyCommand(data, s, { type: 'act', unit: crew.uid, to: crew.pos!, action: { kind: 'ballista', object: 'nope', target: near.uid } })).toThrow(/invalid_command/);
  });
});

function newItemLike(objectId: string) {
  return { uid: `ballista:${objectId}`, def: 'ballista_bolt', upgrade: 0, affixes: [], runes: [] };
}

describe('AI, autoplay and danger zone', () => {
  const enemyPhase = (s: BattleState) => applyCommand(data, s, { type: 'endPhase' });
  it('a foe beside the ballista fires it when the shot beats his attack', () => {
    const s = arena();
    place(s, 'enemy', 'brigand', [4, 2], undefined, 'aggressive');
    const target = place(s, 'player', 'vanguard', [5, 9], 'iron_sword');
    target.hp = 999;
    expect(shotsOf(enemyPhase(s).events)).toHaveLength(1);
  });
  it('a hold foe walks to the ballista to fire it; an aggressive one away from it does not', () => {
    const s = arena();
    const hold = place(s, 'enemy', 'brigand', [3, 2], undefined, 'hold');
    expect(crewSpots(data, s, hold).length).toBeGreaterThan(0);
    const target = place(s, 'player', 'vanguard', [5, 12], 'iron_sword');
    target.hp = 999;
    const r = enemyPhase(s);
    expect(shotsOf(r.events)).toHaveLength(1);
    const s2 = arena();
    const agg = place(s2, 'enemy', 'brigand', [3, 2], undefined, 'aggressive');
    expect(crewSpots(data, s2, agg)).toEqual([]);
    agg.ai = undefined; // a foe without a profile is aggressive, too
    expect(crewSpots(data, s2, agg)).toEqual([]);
    place(s2, 'player', 'vanguard', [5, 12], 'iron_sword').hp = 999;
    expect(shotsOf(enemyPhase(s2).events)).toEqual([]);
  });
  it('a fleeing foe beside it never fires', () => {
    const s = arena();
    const u = place(s, 'enemy', 'brigand', [4, 2], undefined, 'flee');
    expect(crewSpots(data, s, u)).toEqual([]);
  });
  it('the danger zone counts a crew with the reach of the ballista', () => {
    const s = arena();
    place(s, 'enemy', 'brigand', [4, 2], undefined, 'guard');
    const zone = dangerZone(data, s, 'player');
    expect(zone.has(posKey([5, 12]))).toBe(true);
    expect(zone.has(posKey([5, 13]))).toBe(false);
    const s2 = arena();
    place(s2, 'enemy', 'brigand', [4, 2], undefined, 'flee');
    expect(dangerZone(data, s2, 'player').has(posKey([5, 12]))).toBe(false);
  });
  it('the autoplay fires the ballista when the shot is better than the best attack', () => {
    const s = arena();
    const crew = place(s, 'player', 'vanguard', [4, 2]);
    // the prologue is an escape map: every unit walks to the exit unless a plan scores high, as a sure kill does
    place(s, 'enemy', 'brigand', [5, 8], 'iron_axe').hp = 2;
    const cmd = autoCommand(data, s);
    expect(cmd).toMatchObject({ type: 'act', unit: crew.uid, action: { kind: 'ballista', object: 'b1' } });
  });
});

describe('replay', () => {
  it('a log with shots of both sides replays to the same state', () => {
    const s = arena();
    s.rng = seedRng(11);
    const crew = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
    place(s, 'enemy', 'brigand', [6, 2], undefined, 'hold');
    const foe = place(s, 'enemy', 'brigand', [5, 9], 'iron_axe');
    foe.hp = 999;
    const log: Command[] = [{ type: 'act', unit: crew.uid, to: crew.pos!, action: { kind: 'ballista', object: 'b1', target: foe.uid } }, { type: 'endPhase' }];
    let st = s;
    for (const c of log) st = applyCommand(data, st, c).state;
    expect(replayBattle(data, s, log)).toEqual(st);
  });
});

describe('probe map dev_ballista', () => {
  let locales: ReturnType<typeof loadContentFromDisk>['locales'];
  let campaignBefore: GameData['campaign'];
  beforeAll(() => {
    const loaded = loadContentFromDisk();
    data = loaded.data;
    locales = loaded.locales;
    const raw = parse(readFileSync(join(process.cwd(), 'tests', 'fixtures', 'maps', 'dev_ballista.yaml'), 'utf8'));
    data.maps.dev_ballista = { ...mapSchema.parse(raw), act: 1 } as MapDef;
    campaignBefore = data.campaign;
    const first = data.campaign.nodes[0]!;
    data.campaign = { ...data.campaign, nodes: [...data.campaign.nodes, { ...first, id: 'dev_ballista', map: 'dev_ballista', pre: undefined, post: undefined }] };
  });
  afterAll(() => {
    delete data.maps.dev_ballista;
    data.campaign = campaignBefore;
  });
  const start = () => {
    const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
    return beginBattle(data, c, 'dev_ballista', []).state;
  };

  it('passes the content check, and a ballista without its terrain fails it', () => {
    expect(validateContent(data, locales).filter((i) => i.file.includes('dev_ballista'))).toEqual([]);
    const map = data.maps.dev_ballista!;
    const bad = { ...map, objects: [...map.objects, { id: 'loose', type: 'ballista' as const, at: [0, 0] as Pos }] };
    const issues = validateContent({ ...data, maps: { ...data.maps, dev_ballista: bad } }, locales).filter((i) => i.file.includes('dev_ballista'));
    expect(issues.map((i) => i.message)).toEqual(['loose: a ballista object needs the terrain "ballista" on its tile']);
  });

  it('the hold crew climbs to the ballista on the wall walk and fires from above; a replay of the phase is identical', () => {
    const s = start();
    const log: Command[] = [{ type: 'endPhase' }];
    const r = applyCommand(data, s, log[0]!);
    expect(r.events.some((e) => e.t === 'combat' && e.attacker === 'dev_crew' && e.weapon === 'ballista:dev_ballista_n')).toBe(true);
    expect(replayBattle(data, s, log)).toEqual(r.state);
  });

  it('autoplay wins the probe map from the start with a shot of its own ballista, deterministically', () => {
    const a = autoplay(data, start(), 600);
    const b = autoplay(data, start(), 600);
    expect(a.log).toEqual(b.log);
    expect(a.state.outcome).toBe('victory');
    expect(a.events.some((e) => e.t === 'combat' && e.weapon === 'ballista:dev_ballista_s')).toBe(true);
  });

  it('refuses a bad ballista: unknown or unfixed item, terrain without object, links to it, object_activated on it', () => {
    const map = data.maps.dev_ballista!;
    const check = (d: GameData) => validateContent(d, locales).map((i) => i.message);
    const lone = { ...map, objects: map.objects.filter((o) => o.id !== 'dev_ballista_s') };
    expect(check({ ...data, maps: { ...data.maps, dev_ballista: lone } })).toContain('terrain ballista at 4,9 without a ballista object');
    const linked = { ...map, objects: [...map.objects.map((o) => (o.id === 'dev_ballista_n' ? o : o)), { id: 'dev_lever', type: 'lever' as const, at: [0, 0] as Pos, links: ['dev_ballista_n'] }] };
    expect(check({ ...data, maps: { ...data.maps, dev_ballista: linked } })).toContain('dev_lever: links the ballista dev_ballista_n, which nothing opens');
    const trig = { ...map, triggers: [{ id: 't_fire', when: { type: 'object_activated' as const, object: 'dev_ballista_n' }, then: [] }] };
    expect(check({ ...data, maps: { ...data.maps, dev_ballista: trig } as GameData['maps'] })).toContain('t_fire: object_activated never fires for a ballista');
    const bolt = data.items.ballista_bolt!;
    expect(check({ ...data, items: { ...data.items, ballista_bolt: { ...bolt, tags: [] } } })).toContain('ballista.item: ballista_bolt needs the tag fixed');
    expect(check({ ...data, balance: { ...data.balance, ballista: { ...data.balance.ballista, item: 'nope' } } })).toContain('ballista.item: unknown item nope');
  });
});

describe('review follow-ups', () => {
  const enemyPhase = (s: BattleState) => applyCommand(data, s, { type: 'endPhase' });

  it('a ballista kill of a boss counts as siege, never as bow (kill_with)', () => {
    for (let seed = 1; seed < 40; seed++) {
      const s = arena();
      s.rng = seedRng(seed);
      const crew = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
      const boss = place(s, 'enemy', 'brigand', [5, 7], 'iron_axe');
      boss.boss = true;
      boss.hp = 1;
      const r = applyCommand(data, s, { type: 'act', unit: crew.uid, to: crew.pos!, action: { kind: 'ballista', object: 'b1', target: boss.uid } });
      if (r.state.units.find((u) => u.uid === boss.uid)!.hp === 0) {
        expect(r.state.stats.bossKilledWith).toBe('siege');
        return;
      }
    }
    throw new Error('no hit in 40 seeds');
  });

  it('skills bound to a weapon type do not count for the bolt', () => {
    const s = arena();
    const crew = place(s, 'player', 'marksman', [4, 2], 'iron_bow');
    const bolt = weaponProfile(data, newItemLike('b1'));
    expect(bolt.fixed).toBe(true);
    expect(conditionMet(data, { weaponType: 'bow' }, { unit: crew, ownWeapon: bolt })).toBe(false);
    expect(conditionMet(data, { weaponType: 'bow' }, { unit: crew, ownWeapon: weaponProfile(data, crew.equip.mainHand!) })).toBe(true);
    // a personal "+5 STR with a bow" leaves the shot alone
    data.skills.test_bow_str = { id: 'test_bow_str', source: 'personal', trigger: 'passive', condition: { weaponType: 'bow' }, effect: { stats: { str: 5 } } } as GameData['skills'][string];
    restore.push(() => delete data.skills.test_bow_str);
    const foe = place(s, 'enemy', 'brigand', [5, 7], 'iron_axe');
    const before = ballistaForecast(data, s, crew.uid, 'b1', foe.uid).attacker.damage;
    crew.personalSkill = 'test_bow_str';
    expect(ballistaForecast(data, s, crew.uid, 'b1', foe.uid).attacker.damage).toBe(before);
  });

  it('a crew one level below the ballista cannot work it', () => {
    const s = arena();
    s.levels = { [posKey(BALLISTA)]: 1 };
    const low = place(s, 'player', 'vanguard', [4, 2], 'iron_sword');
    place(s, 'enemy', 'brigand', [5, 8], 'iron_axe');
    expect(targetsOf(s, low)).toEqual([]);
    s.levels = { [posKey(BALLISTA)]: 1, [posKey([4, 2])]: 1 };
    expect(targetsOf(s, low)).toHaveLength(1);
  });

  it('lets no rider work it', () => {
    const s = arena();
    data.classes.test_rider = { ...data.classes.vanguard!, id: 'test_rider', moveType: 'mounted' };
    restore.push(() => delete data.classes.test_rider);
    place(s, 'enemy', 'brigand', [5, 8], 'iron_axe');
    expect(targetsOf(s, place(s, 'player', 'test_rider', [4, 2], 'iron_lance'))).toEqual([]);
  });

  it('keeps the bolt out of every bag', () => {
    const s = arena();
    const u = place(s, 'player', 'vanguard', [1, 1]);
    expect(canEquip(data, u, newItem(s, 'ballista_bolt', data), 'bag')).toBe('wrong_slot');
  });

  it('under fog the preview after a move sees from the crew\'s new tile', () => {
    const s = arena(true);
    const crew = place(s, 'player', 'vanguard', [4, 7], 'iron_sword');
    const foe = place(s, 'enemy', 'brigand', [3, 0], 'iron_axe');
    expect(targetsOf(s, crew, [4, 2])).toEqual([foe.uid]);
    expect(crew.pos).toEqual([4, 7]);
  });

  it('a foe beside it fires with any waking profile but flee; a sleeping trigger foe does not', () => {
    for (const profile of ['guard', 'support', 'raider', 'follow', 'hunt'] as const) {
      const s = arena();
      const u = place(s, 'enemy', 'brigand', [4, 2], undefined, profile);
      expect(crewSpots(data, s, u).length).toBe(1);
    }
    const s = arena();
    const sleeper = place(s, 'enemy', 'brigand', [4, 2], undefined, 'trigger');
    expect(crewSpots(data, s, sleeper)).toEqual([]);
  });

  it('a healer beside it heals first', () => {
    const s = arena();
    place(s, 'enemy', 'healer', [4, 2], 'heal_staff', 'guard');
    const hurt = place(s, 'enemy', 'brigand', [3, 2], 'iron_axe', 'guard');
    hurt.hp = 3;
    place(s, 'player', 'vanguard', [5, 9], 'iron_sword').hp = 999;
    const r = enemyPhase(s);
    expect(shotsOf(r.events)).toEqual([]);
    expect(r.state.units.find((u) => u.uid === hurt.uid)!.hp).toBeGreaterThan(3);
  });

  it('a hunter shoots only at its target while the ballista reaches it', () => {
    const s = arena();
    const prey = place(s, 'player', 'vanguard', [5, 12], 'iron_sword');
    const other = place(s, 'player', 'marksman', [5, 6], 'iron_bow');
    other.hp = 1;
    prey.hp = 999;
    const hunter = place(s, 'enemy', 'brigand', [4, 2], undefined, 'hunt');
    hunter.ai = { profile: 'hunt', target: prey.id };
    const shots = enemyPhase(s).events.filter((e) => e.t === 'combat' && e.weapon === 'ballista:b1');
    expect(shots).toHaveLength(1);
    expect(shots[0]).toMatchObject({ defender: prey.uid });
  });

  it('an armed crew with a better blow at hand strikes instead of shooting; with a weak blow it shoots', () => {
    // better blow: a nearly dead foe beside it
    const s = arena();
    place(s, 'enemy', 'brigand', [4, 2], 'iron_axe', 'guard');
    const near = place(s, 'player', 'vanguard', [3, 2], 'iron_sword');
    near.hp = 1;
    place(s, 'player', 'vanguard', [5, 9], 'iron_sword').hp = 999;
    const r = enemyPhase(s);
    expect(shotsOf(r.events)).toEqual([]);
    expect(r.events.some((e) => e.t === 'combat' && e.defender === near.uid)).toBe(true);
    // mirror: the foe beside it is sturdy, the one in reach of the ballista nearly dead
    const s2 = arena();
    place(s2, 'enemy', 'brigand', [4, 2], 'iron_axe', 'guard');
    place(s2, 'player', 'vanguard', [3, 2], 'iron_sword').hp = 999;
    const far = place(s2, 'player', 'marksman', [5, 9], 'iron_bow');
    far.hp = 1;
    const r2 = enemyPhase(s2);
    expect(shotsOf(r2.events)).toHaveLength(1);
    expect(shotsOf(r2.events)[0]).toMatchObject({ defender: far.uid });
  });

  it('the autoplay weighs the shot against an armed crew\'s blow, and spares a recruitable foe', () => {
    const s = arena();
    // a rout map: on the prologue's escape map every unit heads for the exit unless a plan scores very high
    const map = data.maps[s.mapId]!;
    const objectives = map.objectives;
    map.objectives = { ...objectives, victory: { type: 'rout' } };
    restore.push(() => (map.objectives = objectives));
    const crew = place(s, 'player', 'vanguard', [4, 2], 'iron_lance');
    const weak = place(s, 'enemy', 'brigand', [3, 2], 'iron_axe');
    weak.hp = 1;
    // the foe in the ballista's reach is an armoured knight: the bolt does little there
    place(s, 'enemy', 'knight', [5, 9], 'iron_lance');
    expect(autoCommand(data, s)).toMatchObject({ unit: crew.uid, action: { kind: 'attack', target: weak.uid } });
    weak.pos = null;
    weak.gone = 'retreated';
    const far = s.units.find((u) => u.pos && u.team === 'enemy')!;
    far.hp = 2;
    expect(autoCommand(data, s)).toMatchObject({ unit: crew.uid, action: { kind: 'ballista', target: far.uid } });
    far.recruit = { by: 'any' } as BattleUnit['recruit'];
    const cmd = autoCommand(data, s);
    expect(cmd.type === 'act' && cmd.action.kind === 'ballista').toBe(false);
  });
});
