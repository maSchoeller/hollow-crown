/**
 * Story 10.11: tavern, healer and smith of levels 2 and 3 – the wished-for role, grief of 2 instead of 3 missions,
 * strengthening healing potions, every error code and the level thresholds.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  applyCommand,
  applyCampaign,
  beginBattle,
  clone,
  computeStats,
  finishBattle,
  firstNode,
  getUnit,
  griefMissions,
  isHealingPotion,
  newCampaign,
  newItem,
  pairKey,
  potionUpgradeCost,
  potionUpgradeError,
  potionUpgradeOpen,
  refreshTavern,
  replayCampaign,
  roomLevelOf,
  tavernOfferCount,
  tavernWishError,
  tavernWishOpen,
  tavernWishRoles,
  validateCampaign,
  type BattleState,
  type CampaignCommand,
  type CampaignState,
  type GameData,
  type ItemInstance,
} from '../../src/core';
import { arena, place } from '../fixtures/arena';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** Act 2 in the castle with the given room levels; `act: 1` gives the camp of act 1 (every room at level 1). */
function castle(rooms: Record<string, number> = {}, act = 2): CampaignState {
  const c = clone(base);
  c.act = act;
  c.home = act >= 2 ? { kind: 'castle', rooms } : { kind: 'camp', rooms: {} };
  return c;
}

/** Validates, applies twice from the same state (determinism) and returns the result. */
function run(c: CampaignState, cmd: CampaignCommand) {
  expect(validateCampaign(data, c, cmd)).toBeNull();
  const a = applyCampaign(data, c, cmd);
  expect(applyCampaign(data, clone(c), cmd)).toEqual(a);
  return a;
}

const roleOf = (classId: string): string | undefined => data.classes[classId]?.role;

describe('the wished-for role of the tavern (levels)', () => {
  it('the camp of act 1 and a tavern of level 2 know no wish', () => {
    for (const c of [castle({}, 1), castle({ tavern: 2 })]) {
      expect(tavernWishOpen(data, c)).toBe(false);
      expect(validateCampaign(data, c, { type: 'setTavernWish', role: 'vanguard' })).toBe('not_available');
      // not even clearing a wish is offered below the level
      expect(validateCampaign(data, c, { type: 'setTavernWish', role: null })).toBe('not_available');
    }
    expect(roomLevelOf(data, castle({}, 1), 'tavern')).toBe(1);
  });

  it('level 3 opens it, and only roles the tavern really offers', () => {
    const c = castle({ tavern: 3 });
    expect(tavernWishOpen(data, c)).toBe(true);
    const roles = tavernWishRoles(data, c);
    expect(roles.length).toBeGreaterThan(1);
    // the roles of the tavern's classes, no duplicate
    expect(new Set(roles).size).toBe(roles.length);
    for (const role of roles) expect(validateCampaign(data, c, { type: 'setTavernWish', role })).toBeNull();
    expect(validateCampaign(data, c, { type: 'setTavernWish', role: 'dragon' })).toBe('unknown_choice');
    expect(tavernWishError(data, c, 'dragon')).toBe('unknown_choice');
    expect(validateCampaign(data, c, { type: 'setTavernWish', role: null })).toBeNull();
  });

  it("the healer's classes are only wished for once their condition holds", () => {
    const early = castle({ tavern: 3 });
    early.completed = [];
    const late = castle({ tavern: 3 });
    late.completed = data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
    expect(tavernWishRoles(data, late).length).toBeGreaterThanOrEqual(tavernWishRoles(data, early).length);
    for (const role of tavernWishRoles(data, early)) expect(tavernWishRoles(data, late)).toContain(role);
  });
});

describe('the wished-for role in the next round of offers', () => {
  it('sets and clears the wish, nothing else', () => {
    const c = castle({ tavern: 3 });
    expect(c.tavernWish).toBeNull();
    const set = run(c, { type: 'setTavernWish', role: 'marksman' });
    expect(set.campaign.tavernWish).toBe('marksman');
    expect(set.events).toEqual([]);
    expect({ ...set.campaign, tavernWish: null }).toEqual(c);
    expect(run(set.campaign, { type: 'setTavernWish', role: null }).campaign.tavernWish).toBeNull();
  });

  it('every wished-for role is among the next offers and is used up', () => {
    const start = castle({ tavern: 3 });
    for (const role of tavernWishRoles(data, start)) {
      const c = clone(start);
      c.tavernWish = role;
      refreshTavern(data, c);
      expect(c.tavern).toHaveLength(tavernOfferCount(data, c));
      expect(c.tavern.map((u) => roleOf(u.classId))).toContain(role);
      expect(c.tavernWish).toBeNull();
      // names stay unique while the list has names left (the replaced offer is gone before the new one is drawn)
      expect(new Set(c.tavern.map((u) => u.nameKey)).size).toBe(c.tavern.length);
      expect(new Set(c.tavern.map((u) => u.id)).size).toBe(c.tavern.length);
    }
  });

  it('without a wish nothing changes, and the round after the wish is free again', () => {
    const plain = castle({ tavern: 3 });
    refreshTavern(data, plain);
    const wished = castle({ tavern: 3 });
    wished.tavernWish = 'healer';
    refreshTavern(data, wished);
    refreshTavern(data, wished);
    expect(wished.tavernWish).toBeNull();
    expect(plain.tavern.length).toBe(wished.tavern.length);
  });

  it('a replay gives the same offers', () => {
    const c = castle({ tavern: 3 });
    const cmds: CampaignCommand[] = [{ type: 'setTavernWish', role: 'marksman' }];
    const once = replayCampaign(data, c, cmds);
    expect(replayCampaign(data, c, cmds)).toEqual(once);
    const a = clone(once);
    const b = clone(once);
    refreshTavern(data, a);
    refreshTavern(data, b);
    expect(a).toEqual(b);
  });
});

describe('grief by healer level (story 10.11)', () => {
  /** Every fixed pair of `id` at rank C, so a death causes grief. */
  function rankedWith(c: CampaignState, id: string): CampaignState {
    const out = clone(c);
    for (const [a, b] of Object.values(data.supports).map((p) => p.pair)) {
      if (a === id || b === id) out.supports[pairKey(a, b)] = { points: 0, rank: 'C' };
    }
    return out;
  }

  /** Prologue battle won with `dead` fallen. */
  function wonWith(c: CampaignState, dead: string[]) {
    const s = beginBattle(data, c, firstNode(data).id, c.roster.map((r) => r.id)).state;
    for (const id of dead) getUnit(s, id).gone = 'dead';
    s.outcome = 'victory';
    return finishBattle(data, c, s);
  }

  const partnersOf = (id: string): string[] =>
    Object.values(data.supports).map((p) => p.pair).filter((p) => p.includes(id)).map((p) => (p[0] === id ? p[1]! : p[0]!));

  it('reads the number per healer level, the camp as level 1', () => {
    const by = data.balance.supports.griefMissionsByHealerLevel;
    expect(by).toEqual([3, 3, 2]);
    expect(griefMissions(data, castle({}, 1))).toBe(by[0]);
    expect(griefMissions(data, castle({ healer: 2 }))).toBe(by[1]);
    expect(griefMissions(data, castle({ healer: 3 }))).toBe(by[2]);
  });

  it('new grief lasts 2 instead of 3 missions at a healer of level 3', () => {
    for (const [rooms, missions] of [[{}, 3], [{ healer: 3 }, 2]] as const) {
      const c = rankedWith(castle(rooms), 'brenna');
      const { campaign } = wonWith(c, ['brenna']);
      const alive = partnersOf('brenna').filter((id) => campaign.roster.some((r) => r.id === id));
      expect(alive.length).toBeGreaterThan(0);
      for (const id of alive) expect(campaign.roster.find((r) => r.id === id)!.grief).toBe(missions);
    }
  });

  it('running grief is not shortened: it keeps counting down from its own number', () => {
    const c = rankedWith(castle({ healer: 3 }), 'brenna');
    const partner = partnersOf('brenna').find((id) => c.roster.some((r) => r.id === id))!;
    c.roster.find((r) => r.id === partner)!.grief = 5;
    const { campaign } = wonWith(c, ['brenna']);
    // the mission counts one off the running grief (5 -> 4); the new grief of 2 missions does not cut it short
    expect(campaign.roster.find((r) => r.id === partner)!.grief).toBe(4);
  });
});

describe('strengthening a healing potion at the smith', () => {
  /** Act `act` with a healing potion in the convoy and enough gold. */
  function withPotion(act = 2, gold = 5000): { c: CampaignState; potion: ItemInstance } {
    const c = castle({}, act);
    c.gold = gold;
    const potion = newItem(c, 'vulnerary', data);
    c.convoy.push(potion);
    return { c, potion };
  }

  it('is a healing potion, nothing else', () => {
    const c = castle();
    expect(isHealingPotion(data, newItem(c, 'vulnerary', data))).toBe(true);
    for (const def of ['iron_sword', 'heal_staff', 'leather_vest']) expect(isHealingPotion(data, newItem(c, def, data))).toBe(false);
  });

  it('act 1 refuses it on every smith level', () => {
    for (const rooms of [{}, { smith: 2 }, { smith: 3 }] as Array<Record<string, number>>) {
      const { c, potion } = withPotion(1);
      c.home = { kind: 'castle', rooms };
      expect(potionUpgradeOpen(data, c)).toBe(false);
      expect(validateCampaign(data, c, { type: 'upgradePotion', item: potion.uid })).toBe('not_available');
    }
  });

  it('from act 2 it costs 400, then 900, and stops at +2', () => {
    const steps = data.balance.economy.potionUpgrade;
    expect(steps.map((s) => s.gold)).toEqual([400, 900]);
    const start = withPotion();
    const potion = start.potion;
    let c = start.c;
    const gold = c.gold;
    expect(potionUpgradeOpen(data, c)).toBe(true);
    for (const [i, step] of steps.entries()) {
      const inst = c.convoy.find((x) => x.uid === potion.uid)!;
      expect(potionUpgradeCost(data, inst)).toEqual(step);
      const r = run(c, { type: 'upgradePotion', item: potion.uid });
      c = r.campaign;
      expect(c.convoy.find((x) => x.uid === potion.uid)!.upgrade).toBe(i + 1);
      expect(r.events).toContainEqual({ t: 'itemChanged', uid: potion.uid });
    }
    expect(c.gold).toBe(gold - steps[0]!.gold - steps[1]!.gold);
    expect(potionUpgradeCost(data, c.convoy.find((x) => x.uid === potion.uid)!)).toBeUndefined();
    expect(validateCampaign(data, c, { type: 'upgradePotion', item: potion.uid })).toBe('not_available');
  });

  it('refuses in this order: unknown item, availability, gold', () => {
    const { c } = withPotion();
    expect(validateCampaign(data, c, { type: 'upgradePotion', item: 'nothing' })).toBe('unknown_item');
    expect(potionUpgradeError(data, c, 'nothing')).toBe('unknown_item');
    const sword = newItem(c, 'iron_sword', data);
    c.convoy.push(sword);
    expect(validateCampaign(data, c, { type: 'upgradePotion', item: sword.uid })).toBe('not_available');
    const poor = withPotion(2, 399);
    expect(validateCampaign(data, poor.c, { type: 'upgradePotion', item: poor.potion.uid })).toBe('not_enough_gold');
    // the refused command changes nothing
    expect(poor.c.convoy.find((x) => x.uid === poor.potion.uid)!.upgrade).toBe(0);
  });

  it('every step heals 5 more in battle', () => {
    const heal = data.balance.economy.potionUpgrade[0]!.heal;
    const base = data.items.vulnerary!.use!.heal!;
    for (const upgrade of [0, 1, 2]) {
      const s: BattleState = arena(data);
      s.locked = [];
      const u = place(data, s, 'player', 'captain', [5, 5], 'iron_sword');
      u.hp = 1;
      const potion = newItem(s, 'vulnerary', data);
      potion.upgrade = upgrade;
      u.bag.push(potion);
      const r = applyCommand(data, s, { type: 'act', unit: u.uid, to: [5, 5], action: { kind: 'item', item: potion.uid } });
      const max = computeStats(data, u).maxHp;
      expect(r.state.units.find((x) => x.uid === u.uid)!.hp).toBe(Math.min(max, 1 + base + upgrade * heal));
    }
  });

  it('a replay gives the same potion', () => {
    const { c, potion } = withPotion();
    const cmds: CampaignCommand[] = [{ type: 'upgradePotion', item: potion.uid }, { type: 'upgradePotion', item: potion.uid }];
    expect(replayCampaign(data, c, cmds)).toEqual(replayCampaign(data, c, cmds));
    expect(replayCampaign(data, c, cmds).convoy.find((x) => x.uid === potion.uid)!.upgrade).toBe(2);
  });
});
