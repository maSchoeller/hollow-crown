/** Story 10.7: Lektionen der Gedächtnishalle – content, `inheritHeritage` per hall level, Gerrit, mercenaries, effect in battle, replay. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { HERITAGE_ROLES } from '../../src/content/validateUnits';
import {
  activeSkillIds,
  applyCampaign,
  clone,
  computeStats,
  forecast,
  heritageChoices,
  heritageStone,
  memorialStones,
  newCampaign,
  normalizeCampaign,
  replayCampaign,
  resolveAttack,
  seedRng,
  validateCampaign,
  type BattleState,
  type BattleUnit,
  type CampaignCommand,
  type CampaignState,
  type GameData,
  type GameEvent,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

const FENN = 'fallen:fenn';
const MERC = 'fallen:merc9';
const GERRIT = 'fixed:gerrit';

/** Act 2 in the castle (memorial hall at `level`); Fenn (scout) and a mercenary marksman have fallen, a mercenary rides along. */
function hall(level = 1, act = 2): CampaignState {
  const c = clone(base);
  c.act = act;
  c.completed.push('prologue');
  c.home = { kind: 'castle', rooms: level > 1 ? { memorial: level } : {} };
  c.fallen.push({ id: 'fenn', nameKey: 'unit.fenn.name', node: 'm1_3', classId: 'scout', portrait: 'fenn' });
  c.fallen.push({ id: 'merc9', nameKey: 'unit.merc.name', name: 'Odo', node: 'm1_4', classId: 'marksman', mercenary: true });
  c.fallen.push({ id: 'ghost', nameKey: 'unit.ghost.name', node: 'm1_4' });
  const merc = clone(c.roster.find((u) => u.id === 'tobin')!);
  delete merc.charId;
  merc.id = 'merc1';
  c.roster.push(merc);
  return normalizeCampaign(data, c);
}

const pass = (from: string, to: string, skill: string): CampaignCommand => ({ type: 'inheritHeritage', from, to, skill });

/** Validates, applies twice from the same state (determinism) and returns the result. */
function run(c: CampaignState, cmd: CampaignCommand) {
  expect(validateCampaign(data, c, cmd)).toBeNull();
  const a = applyCampaign(data, c, cmd);
  expect(applyCampaign(data, clone(c), cmd)).toEqual(a);
  return a;
}

const stone = (c: CampaignState, key: string) => memorialStones(data, c).find((s) => s.key === key)!;

describe('content (story 10.7)', () => {
  it('every core role has two passive lessons of source heritage; Gerrit carries Schildwall', () => {
    expect(Object.keys(data.heritage).sort()).toEqual([...HERITAGE_ROLES].sort());
    for (const h of Object.values(data.heritage)) {
      expect(h.lessons).toHaveLength(2);
      for (const id of h.lessons) {
        expect(data.skills[id]!.source, id).toBe('heritage');
        expect(data.skills[id]!.trigger, id).not.toBe('action');
      }
    }
    expect(data.memorials.gerrit!.heritage).toBe('heritage_shield_wall');
    expect(data.balance.memorial).toEqual({ heritagePerAct: 1, heritageChoiceByLevel: ['fixed', 'role', 'all'] });
  });
});

describe('inheritHeritage', () => {
  it('offers per hall level: the fixed lesson, both of the role, all fourteen; Gerrit keeps his own until level 3', () => {
    expect(heritageChoices(data, hall(1), stone(hall(1), FENN))).toEqual(['heritage_light_step']);
    expect(heritageChoices(data, hall(2), stone(hall(2), FENN))).toEqual(['heritage_light_step', 'heritage_cover']);
    expect(heritageChoices(data, hall(3), stone(hall(3), FENN))).toHaveLength(14);
    expect(heritageChoices(data, hall(1), stone(hall(1), GERRIT))).toEqual(['heritage_shield_wall']);
    expect(heritageChoices(data, hall(2), stone(hall(2), GERRIT))).toEqual(['heritage_shield_wall']);
    expect(heritageChoices(data, hall(3), stone(hall(3), GERRIT))).toHaveLength(14);
    expect(validateCampaign(data, hall(1), pass(FENN, 'tobin', 'heritage_cover'))).toBe('unknown_choice');
    expect(validateCampaign(data, hall(2), pass(FENN, 'tobin', 'heritage_cover'))).toBeNull();
    expect(validateCampaign(data, hall(2), pass(FENN, 'tobin', 'heritage_luck'))).toBe('unknown_choice');
    expect(validateCampaign(data, hall(3), pass(FENN, 'tobin', 'heritage_luck'))).toBeNull();
    expect(validateCampaign(data, hall(2), pass(GERRIT, 'tobin', 'heritage_tough'))).toBe('unknown_choice');
    expect(validateCampaign(data, hall(3), pass(GERRIT, 'tobin', 'heritage_tough'))).toBeNull();
  });

  it('passes Fenn’s lesson to Tobin: record, event, active skill without a loadout place', () => {
    const r = run(hall(1), pass(FENN, 'tobin', 'heritage_light_step'));
    const tobin = r.campaign.roster.find((u) => u.id === 'tobin')!;
    expect(tobin.heritage).toEqual({ skill: 'heritage_light_step', from: FENN });
    expect(tobin.loadout).not.toContain('heritage_light_step');
    expect(activeSkillIds(data, tobin, null)).toContain('heritage_light_step');
    expect(r.campaign.heritageGiven).toEqual([{ act: 2, from: FENN, to: 'tobin', skill: 'heritage_light_step' }]);
    expect(r.events).toContainEqual({ t: 'heritageInherited', from: FENN, to: 'tobin', skill: 'heritage_light_step' });
    expect(heritageStone(data, r.campaign, FENN)?.nameKey).toBe('unit.fenn.name');
  });

  it('Gerrit and a mercenary’s stone pass on; the avatar and Lucan receive, a mercenary does not', () => {
    expect(run(hall(1), pass(GERRIT, 'avatar', 'heritage_shield_wall')).campaign.roster.find((u) => u.id === 'avatar')!.heritage?.skill).toBe('heritage_shield_wall');
    expect(run(hall(1), pass(MERC, 'lucan', 'heritage_steady_hand')).campaign.roster.find((u) => u.id === 'lucan')!.heritage?.from).toBe(MERC);
    expect(validateCampaign(data, hall(1), pass(FENN, 'merc1', 'heritage_light_step'))).toBe('unknown_unit');
    expect(validateCampaign(data, hall(1), pass(FENN, 'nobody', 'heritage_light_step'))).toBe('unknown_unit');
  });

  it('refuses in order: act 1, a second lesson in the act, a stone that gave, a stone without a role, a second lesson on a unit', () => {
    expect(validateCampaign(data, hall(1, 1), pass(FENN, 'tobin', 'heritage_light_step'))).toBe('not_available');
    expect(validateCampaign(data, hall(1), pass('fallen:ghost', 'tobin', 'heritage_light_step'))).toBe('not_available');
    expect(validateCampaign(data, hall(1), pass('fallen:nobody', 'tobin', 'heritage_light_step'))).toBe('not_available');
    const once = run(hall(1), pass(FENN, 'tobin', 'heritage_light_step')).campaign;
    expect(validateCampaign(data, once, pass(GERRIT, 'brenna', 'heritage_shield_wall'))).toBe('not_available');
    // the next act: a new lesson, but neither from the same stone nor onto the same unit; act 2 is not caught up
    const next = clone(once);
    next.act = 3;
    expect(validateCampaign(data, next, pass(FENN, 'brenna', 'heritage_light_step'))).toBe('not_available');
    expect(validateCampaign(data, next, pass(GERRIT, 'tobin', 'heritage_shield_wall'))).toBe('not_available');
    expect(validateCampaign(data, next, pass(GERRIT, 'brenna', 'heritage_shield_wall'))).toBeNull();
    // the unknown receiver comes first, before any other check
    expect(validateCampaign(data, hall(1, 1), pass(FENN, 'merc1', 'heritage_cover'))).toBe('unknown_unit');
  });

  it('old saves load with the defaults; lessons stay over acts', () => {
    const old = clone(hall(1)) as Partial<CampaignState>;
    delete old.heritageGiven;
    for (const u of old.roster!) delete u.heritage;
    const c = normalizeCampaign(data, old as CampaignState);
    expect(c.heritageGiven).toEqual([]);
    expect(c.roster.every((u) => u.heritage === null)).toBe(true);
    const kept = run(c, pass(FENN, 'tobin', 'heritage_light_step')).campaign;
    kept.act = 3;
    expect(normalizeCampaign(data, kept).roster.find((u) => u.id === 'tobin')!.heritage?.skill).toBe('heritage_light_step');
  });

  it('replays: start state + journal give the same campaign', () => {
    const c = hall(3);
    const cmds: CampaignCommand[] = [pass(MERC, 'avatar', 'heritage_cheer')];
    let live = c;
    for (const cmd of cmds) live = run(live, cmd).campaign;
    expect(replayCampaign(data, c, cmds)).toEqual(live);
  });
});

describe('the lesson in battle', () => {
  function field(): BattleState {
    const s = arena(data);
    s.locked = [];
    s.phase = 'player';
    return s;
  }
  const sure = (u: BattleUnit) => {
    Object.assign(u.stats, { hp: 40, str: 10, mag: 0, skl: 0, spd: 5, lck: 0, def: 0, res: 0 });
    u.hp = 40;
    return u;
  };

  it('Ruhige Hand adds +5 hit in the forecast, and the resolution hits more often with the same rolls', () => {
    const duel = (seed: number, lesson: boolean) => {
      const s = field();
      s.rng = seedRng(seed);
      const a = sure(place(data, s, 'player', 'captain', [5, 5], 'iron_sword'));
      const d = sure(place(data, s, 'enemy', 'brigand', [6, 5], 'iron_axe'));
      d.stats.spd = 25;
      d.stats.hp = d.hp = 99;
      if (lesson) a.heritage = { skill: 'heritage_steady_hand', from: FENN };
      return { s, a, d };
    };
    const x = duel(1, false);
    const y = duel(1, true);
    const before = forecast(data, x.s, x.a.uid, x.d.uid).attacker.hit;
    expect(before).toBeGreaterThan(5);
    expect(before).toBeLessThan(95);
    expect(forecast(data, y.s, y.a.uid, y.d.uid).attacker.hit - before).toBe(5);
    const hits = (seed: number, lesson: boolean) => {
      const { s, a, d } = duel(seed, lesson);
      const ev: GameEvent[] = [];
      resolveAttack(data, s, a.uid, d.uid, undefined, ev);
      return ev.filter((e) => e.t === 'strike' && e.attacker === a.uid && e.hit).length;
    };
    let more = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const [h0, h1] = [hits(seed, false), hits(seed, true)];
      expect(h1).toBeGreaterThanOrEqual(h0);
      if (h1 > h0) more++;
    }
    expect(more).toBeGreaterThan(0);
  });

  it('Zäh adds max HP; Zuruf gives neighbours +5 hit, not the bearer', () => {
    const s = field();
    const u = place(data, s, 'player', 'captain', [5, 5], 'iron_sword');
    const hp = computeStats(data, u, { state: s }).maxHp;
    u.heritage = { skill: 'heritage_tough', from: GERRIT };
    expect(computeStats(data, u, { state: s }).maxHp).toBe(hp + 3);
    const bard = place(data, s, 'player', 'minstrel', [6, 5], 'iron_dagger');
    const n = computeStats(data, u, { state: s }).hit;
    const own = computeStats(data, bard, { state: s }).hit;
    bard.heritage = { skill: 'heritage_cheer', from: MERC };
    expect(computeStats(data, u, { state: s }).hit - n).toBe(5);
    expect(computeStats(data, bard, { state: s }).hit).toBe(own);
  });
});
