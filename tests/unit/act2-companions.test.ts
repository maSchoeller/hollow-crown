/** Companions, lieutenants and flags of act 2 (story 11.5): join level, Sable's side change, grudge skills, Brakka's ballista, flag register. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  ballistaTargets,
  beginBattle,
  computeStats,
  joinLevel,
  joinLieutenant,
  lieutenantLevel,
  lieutenantSkills,
  ltOpeningLine,
  newCampaign,
  newItem,
  raiseOnJoin,
  recordFromChar,
  skillTotals,
  threatTiles,
  type BattleState,
  type BattleUnit,
  type CampaignEvent,
  type GameData,
  type Pos,
} from '../../src/core';

let data: GameData;
const avatar = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;
const COMPANIONS = ['jory', 'ilka', 'odile', 'amos', 'nell', 'brann', 'sable'];
const LIEUTENANTS = ['rowena', 'brakka', 'grell', 'sable'];

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('companions of act 2', () => {
  it('stand on level 10 with a personal skill, items the content knows and the joins of the mission list', () => {
    for (const id of COMPANIONS) {
      const ch = data.chars[id]!;
      expect(ch.act, id).toBe(2);
      expect(ch.level, id).toBe(10);
      expect(data.skills[ch.personalSkill!]?.source, id).toBe('personal');
      for (const r of ch.items) expect(data.items[r.def], `${id}: ${r.def}`).toBeDefined();
      const sum = Object.values(ch.growth).reduce((a, b) => a + b, 0);
      expect(sum, id).toBeGreaterThanOrEqual(320);
      expect(sum, id).toBeLessThanOrEqual(400);
    }
    expect(Object.fromEntries(COMPANIONS.map((id) => [id, data.chars[id]!.joins]))).toEqual({
      jory: 'm2_1',
      ilka: 'm2_3',
      odile: 'm2_5',
      amos: 'm2_5',
      nell: 'm2_6',
      brann: 'n5',
      sable: 'lieutenant',
    });
  });

  it('join with max(10, P − 1), the stats grown by the expected growth', () => {
    const jory = data.chars.jory!;
    expect(joinLevel(data, jory, 9)).toBe(10);
    expect(joinLevel(data, jory, 12)).toBe(11);
    expect(joinLevel(data, jory, 16)).toBe(15);
    const c = newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, avatar);
    const rec = recordFromChar(data, jory, c, c.avatar);
    expect(raiseOnJoin(data, jory, rec, 14)).toBe(true);
    expect(rec.level).toBe(13);
    // three levels of expected growth without dice
    expect(rec.stats.spd).toBeGreaterThan(jory.base.spd);
    expect(rec.stats.hp).toBe(jory.base.hp + rec.gained.hp!);
    expect(rec.gained.hp).toBeGreaterThan(0);
  });

  it('Sable joins as a lieutenant: the lieutenant rule sets her level, her own signature comes with her', () => {
    const c = newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, avatar);
    for (const r of c.roster) r.level = 14;
    c.lieutenants = { sable: { met: true, encounters: 2, grudge: 2, routs: 2, signatureDropped: false, target: 'lucan' } };
    const events: CampaignEvent[] = [];
    const expected = Math.max(data.chars.sable!.level, lieutenantLevel(data, c, 0));
    joinLieutenant(data, c, 'sable', events);
    const sable = c.roster.find((r) => r.id === 'sable')!;
    expect(sable.level).toBe(expected);
    expect(sable.classId).toBe('duelist');
    expect(c.flags.joined_sable).toBe(true);
    expect(c.lieutenants.sable!.grudge).toBe(0);
    expect([...Object.values(sable.equip), ...sable.bag, ...c.convoy].some((i) => i?.def === 'dravns_oath')).toBe(true);
  });
});

describe('lieutenants of act 2', () => {
  it('are four on foot, without fliers, mounts or a class brakka_wyvern', () => {
    const act2 = Object.values(data.lieutenants).filter((lt) => lt.act === 2);
    expect(act2.map((lt) => lt.id)).toEqual(LIEUTENANTS);
    expect(data.classes.brakka_wyvern).toBeUndefined();
    for (const lt of act2) {
      expect(['foot', 'armored'], lt.id).toContain(data.classes[lt.class]!.moveType);
      expect(data.items[lt.signatureItem]!.rarity, lt.id).toBe('legendary');
      for (const s of lt.grudgeSkills) expect(['dive', 'wing_retreat', 'wyvern_dive', 'scale_hide', 'over_the_lines']).not.toContain(s);
    }
    expect(act2.find((lt) => lt.id === 'sable')!.joins).toBe(true);
    expect(data.balance.lieutenant.bounty.materialByAct['2']).toBe('moonsteel');
  });

  it('hold their grudge skills step by step: none at 0, all three at 3', () => {
    for (const id of LIEUTENANTS) {
      const lt = data.lieutenants[id]!;
      expect(lieutenantSkills(data, lt, 0)).toEqual([]);
      expect(lieutenantSkills(data, lt, 1)).toEqual(lt.grudgeSkills.slice(0, 1));
      expect(lieutenantSkills(data, lt, 3)).toEqual(lt.grudgeSkills);
      for (const s of lt.grudgeSkills) expect(data.skills[s]!.source, s).toBe('grudge');
    }
  });

  it('speak `first` at the first meeting in any mission, a grudge line once met with a grudge', () => {
    const c = newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, avatar);
    const unit = { lieutenant: 'grell' } as BattleUnit;
    expect(ltOpeningLine(data, c, unit)).toMatchObject({ line: 'first' });
    const met = { ...c, lieutenants: { grell: { met: true, encounters: 1, grudge: 2, routs: 2, signatureDropped: false, target: 'lucan' } } };
    expect(ltOpeningLine(data, met, { ...unit, grudge: 2, grudgeTarget: 'lucan' } as BattleUnit)).toMatchObject({ line: 'grudge_2', target: 'lucan' });
  });
});

describe('Brakka at the ballista', () => {
  const BALLISTA: Pos = [5, 2];
  function arena(): { s: BattleState; crew: BattleUnit; foe: BattleUnit } {
    const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, avatar);
    const s = beginBattle(data, c, 'prologue', c.roster.map((u) => u.id)).state;
    s.units.forEach((u) => {
      u.pos = null;
      u.gone = 'retreated';
    });
    s.terrain = s.terrain.map(() => 'plain');
    delete s.levels;
    s.objects = [{ id: 'b1', type: 'ballista', at: BALLISTA, state: 'closed' }];
    s.terrain[BALLISTA[1] * s.width + BALLISTA[0]] = 'ballista';
    const take = (team: 'player' | 'enemy', at: Pos, classId: string): BattleUnit => {
      const u = s.units.find((x) => x.gone === 'retreated' && x.team === team)!;
      Object.assign(u, { gone: undefined, pos: at, classId, equip: {}, bag: [], status: [], buffs: [], moved: false, acted: false, downed: false, loadout: [], mastered: [], personalSkill: undefined, lieutenant: undefined, boss: undefined, recruit: undefined });
      u.ai = team === 'enemy' ? { profile: 'hold' } : undefined;
      u.equip.mainHand = newItem(s, 'iron_bow', data);
      u.hp = computeStats(data, u).maxHp;
      return u;
    };
    const crew = take('enemy', [5, 1], 'marksman');
    // ballista range 3–10 from its tile: a foe 11 tiles away is out of reach without the grudge skill
    const foe = take('player', [5, 13], 'vanguard');
    return { s, crew, foe };
  }
  const learn = (u: BattleUnit, skill: string) => {
    u.loadout.push(skill);
    u.mastered.push(skill);
  };

  it('ballista_reach: the shot reaches one tile further, in targets and danger zone alike', () => {
    const { s, crew, foe } = arena();
    expect(ballistaTargets(data, s, crew, crew.pos!).b1 ?? []).not.toContain(foe.uid);
    expect(threatTiles(data, s, crew).has('5,13')).toBe(false);
    learn(crew, 'ballista_reach');
    expect(ballistaTargets(data, s, crew, crew.pos!).b1).toContain(foe.uid);
    expect(threatTiles(data, s, crew).has('5,13')).toBe(true);
  });

  it('steady_crew: +3 DEF/RES only beside a ballista', () => {
    const { s, crew } = arena();
    learn(crew, 'steady_crew');
    expect(skillTotals(data, { unit: crew, state: s }, 'stats').stats).toEqual({ def: 3, res: 3 });
    crew.pos = [8, 8];
    expect(skillTotals(data, { unit: crew, state: s }, 'stats').stats).toEqual({});
  });
});

describe('flag register of act 2', () => {
  it('declares every flag of the act before a mission uses it; the placeholders of the drafts are gone', () => {
    const want = ['e05', 'e06', 'e07', 'e08', 'joined_sable', 'maelis_ledgers', 'chronicle_read', 'm2_2_seal'];
    for (const f of want) expect(data.flags[f], f).toBeDefined();
    expect(data.flags.e07!.values).toEqual(['warn', 'obey']);
    expect(data.flags.maelis_ledgers!.season2).toBe(true);
    expect(data.flags.chronicle_read!.season2).toBe(true);
    expect(data.flags.e7_order).toBeUndefined();
    expect(data.flags.e7_warned).toBeUndefined();
    // Brandhang burns over e07 obey alone (product owner 2026-11-09)
    expect(data.flags.brandhang_burned).toBeUndefined();
  });
});
