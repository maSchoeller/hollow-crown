/** Village aid (decision E1, story 9.3): healing potions hold a charge more during the act; civilians carry no weapon. */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCampaign,
  attackTargets,
  beginBattle,
  finishBattle,
  getUnit,
  maxCharges,
  newCampaign,
  normalizeCampaign,
  validateCampaign,
  type CampaignState,
  type GameData,
} from '../../src/core';
import { clone } from '../../src/core/util';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 3, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

const aid = (c: CampaignState) => applyCampaign(data, c, { type: 'effects', effects: [{ villageAid: { act: 1 } }] }).campaign;
const potionCharges = (s: ReturnType<typeof beginBattle>['state']) => s.units.filter((u) => u.team === 'player').flatMap((u) => u.bag).filter((i) => i.def === 'vulnerary').map((i) => i.charges);

describe('effect villageAid', () => {
  it('is valid, remembers the act and leaves everything else alone', () => {
    expect(base.villageAid).toBeNull();
    expect(validateCampaign(data, base, { type: 'effects', effects: [{ villageAid: { act: 1 } }] })).toBeNull();
    expect(aid(base).villageAid).toBe(1);
  });

  it('older saves get no village aid', () => {
    const old = clone(base) as unknown as Record<string, unknown>;
    delete old.villageAid;
    expect(normalizeCampaign(data, old as unknown as CampaignState).villageAid).toBeNull();
  });

  it('a healing potion holds one charge more in this act, other consumables do not (value from balance.yaml)', () => {
    const bonus = data.balance.economy.villageAid.healCharges;
    expect(bonus).toBe(1);
    expect(maxCharges(data, 1, data.items.vulnerary!)).toBe(data.items.vulnerary!.charges! + bonus);
    expect(maxCharges(data, null, data.items.vulnerary!)).toBe(data.items.vulnerary!.charges);
    expect(maxCharges(data, 2, data.items.vulnerary!)).toBe(data.items.vulnerary!.charges); // another act's aid does not count
    expect(maxCharges(data, 1, data.items.remedy_salve!)).toBe(data.items.remedy_salve!.charges);
  });

  it('the battle starts with full potions topped up, and they refill to that after the mission', () => {
    const plain = potionCharges(beginBattle(data, base, 'm1_1', base.roster.map((r) => r.id)).state);
    expect(plain.length).toBeGreaterThan(0);
    expect(plain.every((c) => c === 3)).toBe(true);
    const c = aid(base);
    const s = beginBattle(data, c, 'm1_1', c.roster.map((r) => r.id)).state;
    expect(potionCharges(s).every((n) => n === 4)).toBe(true);
    s.units.find((u) => u.uid === 'kael')!.bag.find((i) => i.def === 'vulnerary')!.charges = 1;
    s.outcome = 'victory';
    const done = finishBattle(data, c, s).campaign;
    expect(done.roster.find((r) => r.id === 'kael')!.bag.find((i) => i.def === 'vulnerary')!.charges).toBe(4);
  });
});

describe('civilian', () => {
  it('carries no weapon and cannot attack', () => {
    expect(data.classes.civilian!.weaponGroups).toEqual([]);
    const s = beginBattle(data, base, 'm1_2', base.roster.map((r) => r.id)).state;
    const elder = getUnit(s, 'elder');
    expect(elder.classId).toBe('civilian');
    elder.pos = [7, 9];
    const foe = s.units.find((u) => u.id === 'r1')!;
    foe.pos = [7, 10];
    expect(Object.keys(attackTargets(data, s, elder, elder.pos))).toEqual([]);
  });
});

describe('Mira after mission 1-2 (node effectsIf)', () => {
  const win = (razed: boolean) => {
    const c = clone(base);
    c.completed = ['prologue', 'm1_1'];
    const s = beginBattle(data, c, 'm1_2', c.roster.map((r) => r.id)).state;
    s.outcome = 'victory';
    if (razed) s.flags.push('mira_house_razed');
    return applyCampaign(data, c, { type: 'finishMission', start: s, commands: [] });
  };
  it('joins when her house did not burn, even unvisited, and is listed as new', () => {
    const r = win(false);
    expect(r.campaign.roster.some((u) => u.id === 'mira')).toBe(true);
    const done = r.events.find((e) => e.t === 'missionFinished') as { result: { recruited: string[] } };
    expect(done.result.recruited).toContain('mira');
  });
  it('is gone for good when the house burned', () => {
    expect(win(true).campaign.roster.some((u) => u.id === 'mira')).toBe(false);
  });
});
