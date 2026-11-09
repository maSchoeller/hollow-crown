/** Relic stages (story 11.9, items.md §5): the stage is a pure function of the campaign; battle, preview and camp read it. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { validateContent } from '../../src/content/validate';
import {
  activeSkillIds,
  applyCommand,
  computeStats,
  conditionContext,
  createBattle,
  forecast,
  itemStatMods,
  newCampaign,
  newItem,
  normalizeCampaign,
  relicCtx,
  relicStage,
  relicStages,
  replayBattle,
  stagedItemDef,
  type CampaignState,
  type Command,
  type GameData,
} from '../../src/core';
import { seedRng } from '../../src/core/rng';
import { setLocales } from '../../src/i18n';
import { migrate, type SaveRecord } from '../../src/persistence/save';
import { asInstance, itemInfo, rarityOf } from '../../src/ui/itemInfo';
import { isRelic } from '../../src/ui/relicView';
import { arena, place } from '../fixtures/arena';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];
beforeAll(() => {
  ({ data, locales } = loadContentFromDisk());
  setLocales(locales);
});

const fresh = (): CampaignState => newCampaign(data, 5, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
const after16 = (): CampaignState => ({ ...fresh(), completed: ['prologue', 'm1_1', 'm1_2', 'm1_3', 'm1_4', 'm1_5', 'm1_6'] });
const shield = 'pact_warden_shield';

describe('stage as a function of the campaign', () => {
  it('sleeps before 1-6 and awakens once m1_6 is completed', () => {
    expect(relicStage(data, conditionContext(data, fresh()), shield)).toBe(1);
    expect(relicStage(data, conditionContext(data, after16()), shield)).toBe(2);
    expect(relicStages(data, conditionContext(data, fresh()))).toEqual({});
    expect(relicStages(data, conditionContext(data, after16()))).toEqual({ [shield]: 2 });
  });

  it('counts stages in a row: a later stage needs the earlier ones', () => {
    const d = structuredClone(data);
    d.items[shield]!.stages!.push({ when: [{ completed: 'm1_1' }], image: 'pact_warden_shield_3' });
    expect(relicStage(d, conditionContext(d, { ...fresh(), completed: ['m1_1'] }), shield)).toBe(1);
    expect(relicStage(d, conditionContext(d, after16()), shield)).toBe(3);
  });

  it('items without stages are untouched and Drachenglut sleeps with MAG +2', () => {
    const rc = relicCtx(data, after16());
    expect(stagedItemDef(data, 'iron_shield', rc)).toBe(data.items.iron_shield);
    const ember = data.items.dragon_ember!;
    expect([ember.slot, ember.statMods, ember.image, ember.price, ember.stages]).toEqual(['accessory', { mag: 2 }, 'dragon_ember_1', 0, undefined]);
    expect(ember.tags).toContain('unsellable');
    expect(relicCtx(data, null)).toBeNull();
    // both relics carry the hollow-crown frame (PO 2026-11-09), an ordinary legendary item does not
    expect([isRelic(data, shield), isRelic(data, 'dragon_ember'), isRelic(data, 'little_hands')]).toEqual([true, true, false]);
    expect(rarityOf(data, asInstance('dragon_ember'))).toBe('relic');
    expect(itemInfo(data, asInstance('dragon_ember'), null).relic).toMatchObject({ stage: 1, skills: [] });
  });

  it('stage 2 of the shield: DEF 5, image _2, the awakened ward on top of the ward it teaches', () => {
    const c = after16();
    const inst = { uid: 'x', def: shield, upgrade: 0, affixes: [], runes: [] };
    const rc = relicCtx(data, c);
    expect(stagedItemDef(data, inst, rc).image).toBe('pact_warden_shield_2');
    expect(itemStatMods(data, inst, rc).def).toBe(5);
    expect(itemStatMods(data, inst, null).def).toBe(4);
    const unit = { ...c.roster[0]!, equip: { offHand: inst }, loadout: [], mastered: [] };
    expect(activeSkillIds(data, unit, rc)).toEqual(expect.arrayContaining(['warden_ward', 'warden_ward_awake']));
    expect(activeSkillIds(data, unit, null)).not.toContain('warden_ward_awake');
    expect(data.items[shield]!.grantsSkill).toEqual({ skill: 'warden_ward', masteryCost: 45 });
  });
});

describe('battle: stages in the start state', () => {
  it('createBattle keeps the stages of the campaign, and leaves the field out while every relic sleeps', () => {
    const early = fresh();
    expect(createBattle(data, early, 'm1_1', early.roster.map((r) => r.id)).relicStages).toBeUndefined();
    const c = after16();
    expect(createBattle(data, c, 'm1_7', c.roster.map((r) => r.id)).relicStages).toEqual({ [shield]: 2 });
  });

  /** Bearer at (5,5), ally at (6,5) attacks a mage at (6,4), who strikes back with magic. */
  function fight(stage: number | null) {
    const s = arena(data);
    s.locked = [];
    if (stage) s.relicStages = { [shield]: stage };
    const bearer = place(data, s, 'player', 'marksman', [5, 5], 'iron_bow');
    bearer.equip.offHand = newItem(s, shield, data);
    const ally = place(data, s, 'player', 'scout', [6, 5], 'iron_dagger');
    const foe = place(data, s, 'enemy', 'elementalist', [6, 4], 'ember');
    return { s, bearer, ally, foe };
  }

  it('the awakened ward gives neighbours +2 RES and the bearer DEF 5; a missing field (older battle) means asleep', () => {
    const awake = fight(2);
    const asleep = fight(null);
    expect(computeStats(data, awake.ally, { state: awake.s }).stats.res).toBe(computeStats(data, asleep.ally, { state: asleep.s }).stats.res + 2);
    expect(computeStats(data, awake.bearer, { state: awake.s }).stats.def).toBe(computeStats(data, asleep.bearer, { state: asleep.s }).stats.def + 1);
  });

  it('preview = resolution: the counter of the mage deals what the forecast says, 2 less with the awakened shield next door', () => {
    const awake = fight(2);
    const asleep = fight(null);
    const fAwake = forecast(data, awake.s, awake.ally.uid, awake.foe.uid);
    const fAsleep = forecast(data, asleep.s, asleep.ally.uid, asleep.foe.uid);
    expect(fAwake.defender.damage).toBe(Math.max(0, fAsleep.defender.damage - 2));
    let seen = 0;
    for (let seed = 0; seed < 12; seed++) {
      const s = structuredClone(awake.s);
      s.rng = seedRng(1000 + seed);
      const r = applyCommand(data, s, { type: 'act', unit: awake.ally.uid, to: awake.ally.pos!, action: { kind: 'attack', target: awake.foe.uid } });
      for (const e of r.events)
        if (e.t === 'strike' && e.attacker === awake.foe.uid && e.hit && !e.crit) {
          expect(e.dmg).toBe(fAwake.defender.damage);
          seen++;
        }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('replays to the same state from the start snapshot, without the campaign', () => {
    const { s, ally, foe } = fight(2);
    const log: Command[] = [{ type: 'act', unit: ally.uid, to: ally.pos!, action: { kind: 'attack', target: foe.uid } }];
    const once = applyCommand(data, structuredClone(s), log[0]!).state;
    expect(replayBattle(data, structuredClone(s), log)).toEqual(once);
  });
});

describe('act 1 release save', () => {
  it('a release save with m1_6 done shows the shield on stage 2 at once, without a migration', () => {
    const rec = JSON.parse(readFileSync(join(__dirname, '../fixtures/saves/format3-act1-finale-done.json'), 'utf8')) as SaveRecord;
    const c = normalizeCampaign(data, migrate(rec).payload.campaign);
    expect(c.completed).toContain('m1_6');
    const unit = c.roster[0]!;
    unit.equip.offHand = { uid: 'relic', def: shield, upgrade: 0, affixes: [], runes: [] };
    const rc = relicCtx(data, c);
    expect(rc?.relicStages?.[shield]).toBe(2);
    expect(computeStats(data, unit, { relics: rc }).stats.def).toBe(computeStats(data, unit).stats.def + 1);
    const info = itemInfo(data, unit.equip.offHand, rc);
    expect(info.relic).toMatchObject({ stage: 2, skills: [{ name: expect.any(String) }] });
    expect(info.desc).not.toBe(itemInfo(data, unit.equip.offHand, null).desc);
  });
});

describe('content:check', () => {
  const issues = (edit: (d: GameData) => void) => {
    const d = structuredClone(data);
    edit(d);
    return validateContent(d, locales, undefined, new Set(Object.values(d.items).flatMap((i) => [i.image ?? i.id]).concat(['pact_warden_shield_2'])))
      .map((i) => i.message)
      .filter((m) => m.includes('stage'));
  };
  const stage = (d: GameData) => d.items[shield]!.stages![0]!;

  it('accepts the shipped relics', () => {
    expect(issues(() => {})).toEqual([]);
  });

  it('refuses an unknown node, a missing image and a skill that is not passive', () => {
    expect(issues((d) => (stage(d).when = [{ completed: 'nowhere' }])).join()).toMatch(/nowhere/);
    expect(issues((d) => (stage(d).image = 'no_such_image')).join()).toMatch(/no image/);
    expect(issues((d) => (stage(d).skills = ['rally'])).join()).toMatch(/must be passive/);
    expect(issues((d) => (stage(d).skills = ['nope'])).join()).toMatch(/unknown skill nope/);
  });
});
