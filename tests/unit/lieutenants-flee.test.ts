/** Flight at 0 HP (story 3.2): knockOut, objectives, EP, fog filter, forecast, flee line, sight, grudge after the mission, replay. */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import { fleeBark } from '../../src/app/battle/ltLines';
import { fleeSetup } from '../../src/app/state/devLieutenant';
import {
  applyCommand,
  autoplay,
  beginBattle,
  checkObjectives,
  computeStats,
  damageUnit,
  filterEvents,
  finishBattle,
  forecast,
  isVisibleToPlayer,
  knockOut,
  ltFleeLine,
  ltLinesDue,
  newCampaign,
  newItem,
  replayBattle,
  seedRng,
  type BattleState,
  type BattleUnit,
  type CampaignState,
  type GameData,
  type GameEvent,
  type Pos,
} from '../../src/core';

let data: GameData;
const restore: Array<() => void> = [];
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const fresh = (): CampaignState => newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  expect(validateContent(data, loaded.locales)).toEqual([]);
});
afterEach(() => {
  while (restore.length) restore.pop()!();
});

/** The prologue with an open field, one company unit with a sword at [5,5] and one enemy at [5,6] (a lieutenant when `lt`). */
function arena(lt: boolean, fog = false): { s: BattleState; me: BattleUnit; foe: BattleUnit } {
  const c = fresh();
  const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
  for (const u of s.units) {
    u.pos = null;
    u.gone = 'retreated';
  }
  s.outcome = null;
  s.terrain = s.terrain.map(() => 'plain');
  s.objects = [];
  s.loot = [];
  s.timers = {};
  s.phase = 'player';
  const map = data.maps[s.mapId]!;
  const was = map.fog;
  map.fog = fog;
  restore.push(() => (map.fog = was));
  const put = (u: BattleUnit, at: Pos) => {
    u.gone = undefined;
    u.pos = at;
    u.equip = { mainHand: newItem(s, 'iron_sword', data) };
    u.bag = [];
    u.status = [];
    u.buffs = [];
    u.acted = false;
    u.moved = false;
    u.downed = false;
    u.dropUids = [];
    u.hp = computeStats(data, u).maxHp;
    return u;
  };
  const me = put(s.units.find((u) => u.team === 'player')!, [5, 5]);
  const foe = put(s.units.find((u) => u.team === 'enemy')!, [5, 6]);
  foe.ai = { profile: 'hold' };
  if (lt) foe.lieutenant = 'hask';
  return { s, me, foe };
}

const attack = (s: BattleState, me: BattleUnit, foe: BattleUnit) =>
  applyCommand(data, s, { type: 'act', unit: me.uid, to: me.pos!, action: { kind: 'attack', target: foe.uid } });

/** A seed in which `me` drives `foe` off with one blow (hit rolls are random, the forecast is not). */
function hitSeed(s: BattleState, me: BattleUnit, foe: BattleUnit): BattleState {
  for (let seed = 1; seed < 200; seed++) {
    const c = clone(s);
    c.rng = seedRng(seed);
    const r = attack(c, c.units.find((u) => u.uid === me.uid)!, c.units.find((u) => u.uid === foe.uid)!);
    if (r.events.some((e) => e.t === 'fled' || e.t === 'died')) {
      const again = clone(s);
      again.rng = seedRng(seed);
      return again;
    }
  }
  throw new Error('no seed hits');
}

describe('knockOut (AC 1)', () => {
  it('a lieutenant flees: gone fled, fledBy, event fled with the driver, loot dropped, pos kept', () => {
    const { s, me, foe } = arena(true);
    const item = newItem(s, 'vulnerary', data);
    foe.bag = [item];
    foe.dropUids = [item.uid];
    foe.status = [{ id: 'burning', turns: 2 }];
    const events: GameEvent[] = [];
    knockOut(data, s, foe, events, me.uid);
    expect(foe).toMatchObject({ hp: 0, gone: 'fled', fledBy: me.uid, pos: [5, 6], status: [] });
    expect(events.filter((e) => e.t === 'fled' || e.t === 'died')).toEqual([{ t: 'fled', unit: foe.uid, by: me.uid }]);
    expect(events.some((e) => e.t === 'lootDropped')).toBe(true);
    expect(s.loot).toHaveLength(1);
  });

  it('a lieutenant who falls to burn damage has no driver: no by, no fledBy', () => {
    const { s, foe } = arena(true);
    foe.hp = 1;
    const events: GameEvent[] = [];
    expect(damageUnit(data, s, foe, 5, 'burn', events)).toBe(true);
    expect(foe.gone).toBe('fled');
    expect(foe.fledBy).toBeUndefined();
    expect(events.find((e) => e.t === 'fled')).toEqual({ t: 'fled', unit: foe.uid });
  });

  it('an ordinary foe still dies', () => {
    const { s, me, foe } = arena(false);
    const events: GameEvent[] = [];
    knockOut(data, s, foe, events, me.uid);
    expect(foe.gone).toBe('dead');
    expect(events.map((e) => e.t)).toContain('died');
    expect(events.map((e) => e.t)).not.toContain('fled');
    expect(foe.fledBy).toBeUndefined();
  });

  it('the attacker in a fight is the driver, and the flight gives the same EP as a kill', () => {
    const result = (lt: boolean) => {
      const { s, me, foe } = arena(lt);
      foe.hp = 1;
      const c = hitSeed(s, me, foe);
      const r = attack(c, c.units.find((u) => u.uid === me.uid)!, c.units.find((u) => u.uid === foe.uid)!);
      return { foe: r.state.units.find((u) => u.uid === foe.uid)!, me: me.uid, exp: r.events.find((e) => e.t === 'exp' && e.unit === me.uid) };
    };
    const lt = result(true);
    const plain = result(false);
    expect(lt.foe.gone).toBe('fled');
    expect(lt.foe.fledBy).toBe(lt.me);
    expect(plain.foe.gone).toBe('dead');
    expect(lt.exp).toBeDefined();
    // a lieutenant counts as boss-like for EP: the flight gives a kill's EP plus the boss bonus (the plain foe of the map is no boss)
    const bonus = data.balance.experience.bossBonus;
    expect(lt.exp).toEqual({ ...plain.exp, amount: (plain.exp as { amount: number }).amount + bonus, after: (plain.exp as { after: number }).after + bonus });
  });
});

describe('objectives (AC 2)', () => {
  const withGoal = (s: BattleState, victory: unknown) => {
    const map = data.maps[s.mapId]!;
    const was = map.objectives.victory;
    map.objectives.victory = victory as typeof was;
    restore.push(() => (map.objectives.victory = was));
  };

  it('rout: a fled lieutenant is gone from the map, the last foe fleeing wins', () => {
    const { s, foe } = arena(true);
    for (const u of s.units) if (u.team === 'enemy' && u !== foe) u.gone = 'dead';
    withGoal(s, { type: 'rout' });
    const events: GameEvent[] = [];
    checkObjectives(data, s, events);
    expect(s.outcome).toBeNull();
    knockOut(data, s, foe, events);
    checkObjectives(data, s, events);
    expect(s.outcome).toBe('victory');
  });

  it('boss: a fled boss wins like a dead one', () => {
    const { s, foe } = arena(true);
    foe.boss = true;
    withGoal(s, { type: 'boss', unit: foe.id });
    const events: GameEvent[] = [];
    checkObjectives(data, s, events);
    expect(s.outcome).toBeNull();
    knockOut(data, s, foe, events);
    checkObjectives(data, s, events);
    expect(s.outcome).toBe('victory');
  });
});

describe('fog (AC 3, 7)', () => {
  const fled = (foe: BattleUnit): GameEvent => ({ t: 'fled', unit: foe.uid });

  it('filterEvents keeps `fled` of a unit on a seen tile and drops it in the fog', () => {
    const { s, me, foe } = arena(true, true);
    foe.pos = [5, 6];
    expect(filterEvents(data, s, [fled(foe)], 'player')).toEqual([fled(foe)]);
    foe.pos = [10, 11];
    me.pos = [1, 1];
    expect(filterEvents(data, s, [fled(foe)], 'player')).toEqual([]);
  });

  it('isVisibleToPlayer follows the sight: always without fog, under fog only on seen tiles', () => {
    const open = arena(true, false);
    expect(isVisibleToPlayer(data, open.s, open.foe)).toBe(true);
    const fog = arena(true, true);
    fog.foe.pos = [5, 7];
    expect(isVisibleToPlayer(data, fog.s, fog.foe)).toBe(true);
    fog.foe.pos = [10, 11];
    fog.me.pos = [1, 1];
    expect(isVisibleToPlayer(data, fog.s, fog.foe)).toBe(false);
  });

  it('the opening line waits for the first sight, and comes once the company sees him', () => {
    const { s, me, foe } = arena(true, true);
    const c = fresh();
    foe.pos = [10, 11];
    me.pos = [1, 1];
    expect(ltLinesDue(data, c, s, new Set())).toEqual([]);
    me.pos = [9, 10];
    expect(ltLinesDue(data, c, s, new Set()).map((l) => [l.unit, l.line])).toEqual([[foe.uid, 'first']]);
    expect(ltLinesDue(data, c, s, new Set([foe.uid]))).toEqual([]);
  });

  it('a lieutenant who arrives as reinforcement in the fog speaks when he is seen, not before', () => {
    const { s, me, foe } = arena(true, true);
    const c = fresh();
    me.pos = [1, 1];
    foe.pos = [10, 11];
    expect(ltLinesDue(data, c, s, new Set())).toEqual([]);
    foe.pos = [1, 3];
    expect(ltLinesDue(data, c, s, new Set()).map((l) => l.unit)).toEqual([foe.uid]);
  });
});

describe('forecast (AC 4)', () => {
  it('says the lieutenant flees when the blows bring him to 0, not otherwise', () => {
    const { s, me, foe } = arena(true);
    foe.hp = 1;
    const f = forecast(data, s, me.uid, foe.uid);
    expect(f.defenderHpAfter).toBe(0);
    expect(f.defenderFlees).toBe(true);
    expect(f.attackerFlees).toBe(false);
    foe.hp = 500;
    const g = forecast(data, s, me.uid, foe.uid);
    expect(g.defenderHpAfter).toBeGreaterThan(0);
    expect(g.defenderFlees).toBe(false);
  });

  it('an ordinary foe at 0 does not "flee"', () => {
    const { s, me, foe } = arena(false);
    foe.hp = 1;
    const f = forecast(data, s, me.uid, foe.uid);
    expect(f.defenderHpAfter).toBe(0);
    expect(f.defenderFlees).toBe(false);
  });
});

describe('flee line (AC 6)', () => {
  const withRouts = (routs: number): CampaignState => {
    const c = fresh();
    c.lieutenants = { hask: { met: true, encounters: routs, grudge: Math.min(3, routs), routs, signatureDropped: false } };
    return c;
  };

  it('picks by the routs before this one: 0 flee_1, 1 flee_2, 2 flee_3, then from the start', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((n) => ltFleeLine(withRouts(n), 'hask'))).toEqual(['flee_1', 'flee_2', 'flee_3', 'flee_1', 'flee_2', 'flee_3', 'flee_1']);
    expect(ltFleeLine(fresh(), 'hask')).toBe('flee_1');
  });

  it('every lieutenant has the three lines', () => {
    for (const [id, lt] of Object.entries(data.lieutenants)) {
      const scene = data.scenes[lt.scene]!;
      for (const line of ['flee_1', 'flee_2', 'flee_3']) {
        const l = scene.lines.find((x) => x.id === line);
        expect(l && 'text' in l, `${id}.${line}`).toBe(true);
      }
    }
  });

  it('fleeBark: the right line, once per lieutenant, nothing in skip mode, the driver fills {target}', () => {
    const { s, me, foe } = arena(true);
    const c = withRouts(1);
    const spoken = new Set<string>();
    expect(fleeBark(data, c, s, foe.uid, me.uid, spoken, false)).toBeNull();
    const bark = fleeBark(data, c, s, foe.uid, me.uid, spoken, true);
    expect(bark).toMatchObject({ unit: foe.uid, anchor: foe.uid, scene: 'scn.lt.hask', line: 'flee_2' });
    expect(bark!.params?.target).toBeTruthy();
    expect(fleeBark(data, c, s, foe.uid, me.uid, spoken, true)).toBeNull();
    expect(fleeBark(data, null, s, foe.uid, undefined, new Set(), true)).toBeNull();
    expect(fleeBark(data, c, s, me.uid, undefined, new Set(), true)).toBeNull();
  });
});

describe('after the mission (AC 9)', () => {
  it('a lieutenant driven off by a unit of the company raises the grudge by one and points it at the driver', () => {
    const { s, me, foe } = arena(true);
    const events: GameEvent[] = [];
    knockOut(data, s, foe, events, me.uid);
    s.outcome = 'victory';
    for (const u of s.units) if (u.team === 'enemy' && u !== foe && !u.gone) u.gone = 'dead';
    const out = finishBattle(data, fresh(), s).campaign.lieutenants!.hask!;
    expect(out).toMatchObject({ met: true, grudge: 1, routs: 1, target: me.id });
  });
});

describe('replay (AC 9)', () => {
  it('a battle with a lieutenant replays to the same state, and he flees (never dies)', () => {
    const c = fresh();
    const start = beginBattle(data, c, 'prologue', c.roster.map((r) => r.id)).state;
    const foe = start.units.find((u) => u.team === 'enemy')!;
    foe.lieutenant = 'hask';
    // the prepared attack drives him off for sure (a seed in which it does), then the battle plays on to its end
    const setup = fleeSetup(data, start, 'hask');
    expect(setup).not.toBeNull();
    const hit = applyCommand(data, clone(setup!.seeded), setup!.cmd);
    expect(hit.state.units.find((u) => u.uid === foe.uid)!.gone).toBe('fled');
    const run = autoplay(data, hit.state, 600);
    expect(replayBattle(data, setup!.seeded, [setup!.cmd, ...run.log])).toEqual(run.state);
    expect(run.state.units.find((u) => u.uid === foe.uid)!.gone).toBe('fled');
  });
});

describe('dev helper', () => {
  it('fleeSetup finds a seed in which the prepared attack drives the lieutenant off', () => {
    const c = fresh();
    const start = beginBattle(data, c, 'prologue', c.roster.map((r) => r.id)).state;
    const foe = start.units.find((u) => u.team === 'enemy')!;
    foe.lieutenant = 'hask';
    const setup = fleeSetup(data, start, 'hask');
    expect(setup).not.toBeNull();
    const r = applyCommand(data, clone(setup!.seeded), setup!.cmd);
    expect(r.events.some((e) => e.t === 'fled')).toBe(true);
  });
});
