import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  academyLevel,
  activeSkillIds,
  applyCampaign,
  clone,
  homeRooms,
  loadoutSlots,
  newCampaign,
  newItem,
  normalizeCampaign,
  otherProPath,
  promotionPreview,
  promotionTargets,
  replayCampaign,
  STAT_KEYS,
  validateCampaign,
  type CampaignCommand,
  type CampaignState,
  type GameData,
  type UnitRecord,
} from '../../src/core';

let data: GameData;
let base: CampaignState;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

/** Act 2 in the castle with the academy on `level` (0: none built yet = level 1 by default), `sparks` ember sparks and plenty of gold. */
function castle(opts: { level?: number; sparks?: number; act?: number } = {}, d: GameData = data): CampaignState {
  const c = clone(base);
  c.act = opts.act ?? 2;
  c.home = { kind: 'castle', rooms: opts.level ? { academy: opts.level } : {} };
  c.gold = 10000;
  for (let i = 0; i < (opts.sparks ?? 1); i++) c.convoy.push(newItem(c, 'ember_spark', d));
  return c;
}

/** A unit whose role has two pro paths, raised to the promotion level. */
function twoPathUnit(c: CampaignState, d: GameData = data): UnitRecord {
  const u = c.roster.find((r) => promotionTargets(d, r.classId).length === 2)!;
  u.level = d.balance.levels.promoteFrom;
  return u;
}

/** Applies twice from the same state: same result (determinism). */
function run(c: CampaignState, cmd: CampaignCommand, d: GameData = data) {
  expect(validateCampaign(d, c, cmd)).toBeNull();
  const a = applyCampaign(d, c, cmd);
  expect(applyCampaign(d, clone(c), cmd)).toEqual(a);
  return a;
}

const sparks = (c: CampaignState) => c.convoy.filter((i) => i.def === 'ember_spark').length;

describe('academy (story 10.2)', () => {
  it('the ember spark is the item that promotes', () => {
    expect(data.items.ember_spark!.use).toEqual({ promote: true, minLevel: data.balance.levels.promoteFrom });
    expect(Object.values(data.items).filter((i) => i.use?.promote).map((i) => i.id)).toEqual(['ember_spark']);
  });

  it('exists from act 2 in the castle only', () => {
    expect(homeRooms(data, castle()).some((r) => r.room.id === 'academy' && r.open)).toBe(true);
    expect(academyLevel(data, castle())).toBe(1);
    expect(academyLevel(data, castle({ act: 1 }))).toBe(0);
    const camp = { ...castle(), home: { kind: 'camp' as const, rooms: {} } };
    expect(academyLevel(data, camp)).toBe(0);
  });

  it('promotes for an ember spark: level 1, exp 0, bonus up to the caps, loadout 5', () => {
    const c = castle({ sparks: 2 });
    const u = twoPathUnit(c);
    u.exp = 40;
    const to = promotionTargets(data, u.classId)[0]!;
    const preview = promotionPreview(data, u, to);
    const from = u.classId;
    const r = run(c, { type: 'promote', unit: u.id, classId: to });
    const p = r.campaign.roster.find((x) => x.id === u.id)!;
    expect(p.classId).toBe(to);
    expect(p.level).toBe(1);
    expect(p.exp).toBe(0);
    expect(p.promotionGain).toEqual(preview);
    for (const k of STAT_KEYS) {
      expect(p.stats[k]).toBe(u.stats[k] + (preview[k] ?? 0));
      expect(p.stats[k]).toBeLessThanOrEqual(Math.max(u.stats[k], data.classes[to]!.caps[k]));
    }
    expect(loadoutSlots(data, p)).toBe(data.balance.skills.loadoutAdvanced);
    expect(sparks(r.campaign)).toBe(1);
    expect(r.events).toContainEqual({ t: 'promoted', unit: u.id, from, to, gain: preview });
    expect(r.events.some((e) => e.t === 'itemLost')).toBe(true);
  });

  it('caps the gain at the new class caps', () => {
    const c = castle();
    const u = twoPathUnit(c);
    const to = promotionTargets(data, u.classId)[0]!;
    u.stats.hp = data.classes[to]!.caps.hp - 1;
    expect(promotionPreview(data, u, to).hp ?? 0).toBeLessThanOrEqual(1);
  });

  it('checks promote in the order of the story', () => {
    const c = castle();
    const u = twoPathUnit(c);
    const to = promotionTargets(data, u.classId)[0]!;
    expect(validateCampaign(data, c, { type: 'promote', unit: 'nobody', classId: to })).toBe('unknown_unit');
    expect(validateCampaign(data, c, { type: 'promote', unit: u.id, classId: 'nonsense' })).toBe('unknown_class');
    const low = clone(c);
    low.roster.find((x) => x.id === u.id)!.level = data.balance.levels.promoteFrom - 1;
    expect(validateCampaign(data, low, { type: 'promote', unit: u.id, classId: to })).toBe('not_available');
    // act 1 has no academy
    const act1 = { ...clone(c), act: 1 };
    expect(validateCampaign(data, act1, { type: 'promote', unit: u.id, classId: to })).toBe('not_available');
    expect(validateCampaign(data, { ...clone(c), convoy: [] }, { type: 'promote', unit: u.id, classId: to })).toBe('not_enough_materials');
    // already a pro: the pro class has no path, so the class is unknown for it
    const pro = run(c, { type: 'promote', unit: u.id, classId: to }).campaign;
    pro.convoy.push(newItem(pro, 'ember_spark', data));
    pro.roster.find((x) => x.id === u.id)!.level = data.balance.levels.promoteFrom;
    expect(validateCampaign(data, pro, { type: 'promote', unit: u.id, classId: to })).toBe('unknown_class');
  });

  it('changes the pro path at level 2: gain taken back, new bonus up to its caps, 1 500 gold', () => {
    const c = castle({ level: 2 });
    const u = twoPathUnit(c);
    const [a, b] = promotionTargets(data, u.classId) as [string, string];
    const before = { ...u.stats };
    const pro = run(c, { type: 'promote', unit: u.id, classId: a }).campaign;
    const pu = pro.roster.find((x) => x.id === u.id)!;
    pu.level = 7;
    pu.exp = 33;
    pu.loadout = [...pu.loadout];
    expect(otherProPath(data, a)).toBe(b);
    const r = run(pro, { type: 'changeProPath', unit: u.id, classId: b });
    const p = r.campaign.roster.find((x) => x.id === u.id)!;
    const gain = promotionPreview(data, { stats: before }, b);
    expect(p.classId).toBe(b);
    expect(p.promotionGain).toEqual(gain);
    for (const k of STAT_KEYS) expect(p.stats[k]).toBe(Math.min(data.classes[b]!.caps[k], before[k] + (gain[k] ?? 0)));
    expect(p.level).toBe(7);
    expect(p.exp).toBe(33);
    expect(p.loadout).toEqual(pu.loadout);
    expect(r.campaign.gold).toBe(pro.gold - data.balance.academy.changePathGold);
    expect(r.events).toContainEqual({ t: 'proPathChanged', unit: u.id, from: a, to: b });
    expect(r.events.some((e) => e.t === 'goldChanged')).toBe(true);
    // and back again gives the stats of a direct promotion to a
    const back = run(r.campaign, { type: 'changeProPath', unit: u.id, classId: a }).campaign.roster.find((x) => x.id === u.id)!;
    expect(back.stats).toEqual(pu.stats);
  });

  it('checks changeProPath in the order of the story', () => {
    const c = castle({ level: 2, sparks: 2 });
    const u = twoPathUnit(c);
    const [a, b] = promotionTargets(data, u.classId) as [string, string];
    expect(validateCampaign(data, c, { type: 'changeProPath', unit: u.id, classId: b })).toBe('unknown_class');
    const pro = applyCampaign(data, c, { type: 'promote', unit: u.id, classId: a }).campaign;
    expect(validateCampaign(data, pro, { type: 'changeProPath', unit: u.id, classId: a })).toBe('unknown_class');
    expect(validateCampaign(data, { ...clone(pro), home: { kind: 'castle', rooms: { academy: 1 } } }, { type: 'changeProPath', unit: u.id, classId: b })).toBe('not_available');
    expect(validateCampaign(data, { ...clone(pro), gold: 0 }, { type: 'changeProPath', unit: u.id, classId: b })).toBe('not_enough_gold');
    const learned = clone(pro);
    learned.roster.find((x) => x.id === u.id)!.secondPath = b;
    expect(validateCampaign(data, learned, { type: 'changeProPath', unit: u.id, classId: b })).toBe('not_available');
  });

  it('learns the second path at level 3 for a spark; its pro skills count', () => {
    const skill = Object.keys(data.skills)[0]!;
    const c0 = castle({ level: 3, sparks: 2 });
    const u = twoPathUnit(c0);
    const [a, b] = promotionTargets(data, u.classId) as [string, string];
    const d: GameData = { ...data, classes: { ...data.classes, [b]: { ...data.classes[b]!, proSkills: [skill] } } };
    const pro = run(c0, { type: 'promote', unit: u.id, classId: a }, d).campaign;
    expect(activeSkillIds(d, pro.roster.find((x) => x.id === u.id)!)).not.toContain(skill);
    const r = run(pro, { type: 'learnSecondPath', unit: u.id }, d);
    const p = r.campaign.roster.find((x) => x.id === u.id)!;
    expect(p.secondPath).toBe(b);
    expect(p.classId).toBe(a);
    expect(p.stats).toEqual(pro.roster.find((x) => x.id === u.id)!.stats);
    expect(activeSkillIds(d, p)).toContain(skill);
    expect(sparks(r.campaign)).toBe(0);
    expect(r.events).toContainEqual({ t: 'secondPathLearned', unit: u.id, path: b });
    // errors
    expect(validateCampaign(d, r.campaign, { type: 'learnSecondPath', unit: u.id })).toBe('not_available');
    expect(validateCampaign(d, { ...clone(pro), convoy: [] }, { type: 'learnSecondPath', unit: u.id })).toBe('not_enough_materials');
    expect(validateCampaign(d, { ...clone(pro), home: { kind: 'castle', rooms: { academy: 2 } } }, { type: 'learnSecondPath', unit: u.id })).toBe('not_available');
    expect(validateCampaign(d, c0, { type: 'learnSecondPath', unit: u.id })).toBe('not_available');
    expect(validateCampaign(d, c0, { type: 'learnSecondPath', unit: 'nobody' })).toBe('unknown_unit');
  });

  it('avatar and Lucan promote on their one path, which has no change and no second path', () => {
    const avatar = base.roster[0]!;
    const role = data.classes[avatar.classId]!;
    const path = role.proPaths[0]!;
    // the pro class of the role comes with story 10.3: a fixture class until then
    const d: GameData = data.classes[path] ? data : { ...data, classes: { ...data.classes, [path]: { ...data.classes.bishop!, id: path, proPaths: [] } } };
    const c = castle({ level: 3, sparks: 2 }, d);
    const u = c.roster[0]!;
    u.level = d.balance.levels.promoteFrom;
    const r = run(c, { type: 'promote', unit: u.id, classId: path }, d);
    expect(r.campaign.roster[0]!.classId).toBe(path);
    expect(otherProPath(d, path)).toBeNull();
    expect(validateCampaign(d, r.campaign, { type: 'learnSecondPath', unit: u.id })).toBe('not_available');
  });

  it('replays to the same state', () => {
    const c = castle({ level: 3, sparks: 3 });
    const u = twoPathUnit(c);
    const [a, b] = promotionTargets(data, u.classId) as [string, string];
    const cmds: CampaignCommand[] = [
      { type: 'promote', unit: u.id, classId: a },
      { type: 'learnSecondPath', unit: u.id },
    ];
    let live = normalizeCampaign(data, c);
    for (const cmd of cmds) live = applyCampaign(data, live, cmd).campaign;
    expect(replayCampaign(data, c, cmds)).toEqual(live);
    const two = castle({ level: 2 });
    const tu = twoPathUnit(two);
    const swap: CampaignCommand[] = [
      { type: 'promote', unit: tu.id, classId: a },
      { type: 'changeProPath', unit: tu.id, classId: b },
    ];
    let l2 = normalizeCampaign(data, two);
    for (const cmd of swap) l2 = applyCampaign(data, l2, cmd).campaign;
    expect(replayCampaign(data, two, swap)).toEqual(l2);
    expect(l2.roster.find((x) => x.id === tu.id)!.classId).toBe(b);
  });

  it('old saves get the defaults', () => {
    const old = clone(base);
    for (const u of old.roster) {
      delete u.promotionGain;
      delete u.secondPath;
    }
    const n = normalizeCampaign(data, old);
    expect(n.roster.every((u) => JSON.stringify(u.promotionGain) === '{}' && u.secondPath === null)).toBe(true);
  });
});
