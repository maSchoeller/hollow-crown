/** Conditions, effects, flag register and act curve (stories 4.1 and 4.2; architecture §5.3, §5.9). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import { buildContent } from '../../src/content/load';
import { conditionSchema, effectSchema, campaignSchema } from '../../src/content/schemas';
import { validateContent } from '../../src/content/validate';
import {
  applyCampaign,
  applyEffects,
  clone,
  conditionContext,
  dominantStance,
  evalCondition,
  evalConditions,
  newCampaign,
  normalizeCampaign,
  validateCampaign,
  type CampaignEvent,
  type CampaignState,
  type Condition,
  type ConditionContext,
  type Effect,
  type GameData,
} from '../../src/core';
import type { Locales } from '../../src/content/load';

let data: GameData;
let locales: Locales;
let base: CampaignState;

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
  base = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
});

const ctxOf = (c: CampaignState): ConditionContext => conditionContext(data, c);
const holds = (c: CampaignState, cond: Condition) => evalCondition(ctxOf(c), cond);

/** Runs effects through the campaign command and checks determinism. */
function run(c: CampaignState, effects: Effect[]) {
  expect(validateCampaign(data, c, { type: 'effects', effects })).toBeNull();
  const a = applyCampaign(data, c, { type: 'effects', effects });
  expect(applyCampaign(data, clone(c), { type: 'effects', effects })).toEqual(a);
  return a;
}

describe('conditions (architecture §5.3)', () => {
  it('flag: set, or equal to a value', () => {
    const c = clone(base);
    c.flags.avatar_honest = true;
    c.flags.e02 = 'protect';
    expect(holds(c, { flag: 'avatar_honest' })).toBe(true);
    expect(holds(c, { flag: 'avatar_proud' })).toBe(false);
    expect(holds(c, { flag: { e02: 'protect' } })).toBe(true);
    expect(holds(c, { flag: { e02: 'spare' } })).toBe(false);
    expect(holds(c, { flag: { avatar_honest: true } })).toBe(true);
    expect(holds(c, { flag: { avatar_proud: true } })).toBe(false);
  });

  it('alive, dead and left follow the roster, the fallen and the departed', () => {
    const c = clone(base);
    c.fallen.push({ id: 'tobin', nameKey: 'unit.tobin.name', node: 'prologue' });
    c.roster = c.roster.filter((r) => r.id !== 'tobin');
    c.left.push('brenna');
    c.roster = c.roster.filter((r) => r.id !== 'brenna');
    expect(holds(c, { alive: 'kael' })).toBe(true);
    expect(holds(c, { alive: 'tobin' })).toBe(false);
    expect(holds(c, { alive: 'brenna' })).toBe(false);
    expect(holds(c, { dead: 'tobin' })).toBe(true);
    expect(holds(c, { dead: 'kael' })).toBe(false);
    expect(holds(c, { left: 'brenna' })).toBe(true);
    expect(holds(c, { left: 'kael' })).toBe(false);
  });

  it('completed and storyCount count finished story missions', () => {
    const c = clone(base);
    expect(holds(c, { completed: 'prologue' })).toBe(false);
    expect(holds(c, { storyCount: { min: 0 } })).toBe(true);
    expect(holds(c, { storyCount: { min: 1 } })).toBe(false);
    c.completed.push('prologue', 'ch01');
    expect(holds(c, { completed: 'prologue' })).toBe(true);
    expect(holds(c, { completed: 'ch02' })).toBe(false);
    expect(holds(c, { storyCount: { min: 2 } })).toBe(true);
    expect(holds(c, { storyCount: { min: 3 } })).toBe(false);
    expect(holds(c, { storyCount: { max: 2 } })).toBe(true);
    expect(holds(c, { storyCount: { min: 1, max: 1 } })).toBe(false);
  });

  it('act is true from the given act on', () => {
    expect(data.campaign.act).toBe(1);
    expect(holds(base, { act: 1 })).toBe(true);
    expect(holds(base, { act: 2 })).toBe(false);
    expect(evalCondition({ ...ctxOf(base), act: 2 }, { act: 2 })).toBe(true);
  });

  it('support needs at least the rank, in either order of the pair', () => {
    const c = clone(base);
    expect(holds(c, { support: { pair: ['kael', 'brenna'], rank: 'C' } })).toBe(false);
    c.supports['brenna|kael']!.rank = 'B';
    expect(holds(c, { support: { pair: ['kael', 'brenna'], rank: 'C' } })).toBe(true);
    expect(holds(c, { support: { pair: ['brenna', 'kael'], rank: 'B' } })).toBe(true);
    expect(holds(c, { support: { pair: ['brenna', 'kael'], rank: 'A' } })).toBe(false);
    expect(holds(c, { support: { pair: ['tobin', 'mira'], rank: 'C' } })).toBe(false);
  });

  it('stance is the prevailing one, a tie goes warm > sober > defiant, no points = none', () => {
    const c = clone(base);
    expect(dominantStance(c.stance)).toBeNull();
    expect(holds(c, { stance: 'warm' })).toBe(false);
    c.stance = { warm: 1, sober: 2, defiant: 2 };
    expect(holds(c, { stance: 'sober' })).toBe(true);
    expect(holds(c, { stance: 'defiant' })).toBe(false);
    c.stance = { warm: 2, sober: 2, defiant: 2 };
    expect(dominantStance(c.stance)).toBe('warm');
    expect(holds(c, { stance: 'warm' })).toBe(true);
  });

  it('chronicle counts pages or asks for specific ones', () => {
    const c = clone(base);
    c.chronicle = ['p1', 'p2'];
    expect(holds(c, { chronicle: { min: 2 } })).toBe(true);
    expect(holds(c, { chronicle: { min: 3 } })).toBe(false);
    expect(holds(c, { chronicle: ['p1', 'p2'] })).toBe(true);
    expect(holds(c, { chronicle: ['p1', 'p3'] })).toBe(false);
  });

  it('any is OR, not negates, a list is AND', () => {
    const c = clone(base);
    c.flags.avatar_honest = true;
    const yes: Condition = { flag: 'avatar_honest' };
    const no: Condition = { flag: 'avatar_proud' };
    expect(holds(c, { any: [no, yes] })).toBe(true);
    expect(holds(c, { any: [no, no] })).toBe(false);
    expect(holds(c, { not: no })).toBe(true);
    expect(holds(c, { not: yes })).toBe(false);
    expect(evalConditions(ctxOf(c), [yes, { not: no }])).toBe(true);
    expect(evalConditions(ctxOf(c), [yes, no])).toBe(false);
    expect(evalConditions(ctxOf(c), [])).toBe(true);
    expect(evalConditions(ctxOf(c), undefined)).toBe(true);
    expect(evalConditions(ctxOf(c), yes)).toBe(true);
  });

  it('met holds once the company has met the lieutenant (story 3.3)', () => {
    expect(holds(base, { met: 'hask' })).toBe(false);
    const met = { ...base, lieutenants: { hask: { met: true, encounters: 1, grudge: 0, routs: 0, signatureDropped: false } } };
    expect(holds(met, { met: 'hask' })).toBe(true);
    expect(holds(met, { met: 'morra' })).toBe(false);
  });

  it('never changes anything', () => {
    const c = clone(base);
    c.flags.avatar_honest = true;
    const frozen = JSON.stringify(c);
    for (const cond of [{ flag: 'avatar_honest' }, { alive: 'kael' }, { any: [{ dead: 'kael' }, { not: { act: 2 } }] }] as Condition[]) holds(c, cond);
    expect(JSON.stringify(c)).toBe(frozen);
  });

  it('an empty context (no campaign) is an empty story', () => {
    const ctx = conditionContext(data, null);
    expect(evalCondition(ctx, { alive: 'kael' })).toBe(false);
    expect(evalCondition(ctx, { flag: 'avatar_honest' })).toBe(false);
    expect(evalCondition(conditionContext(data, null, { avatar_honest: true }), { flag: 'avatar_honest' })).toBe(true);
  });
});

describe('effects (architecture §5.3)', () => {
  it('setFlag sets true or a value', () => {
    const r = run(base, [{ setFlag: 'avatar_honest' }]);
    expect(r.campaign.flags).toEqual({ avatar_honest: true });
    expect(r.events).toEqual([{ t: 'flagSet', flag: 'avatar_honest', value: true }]);
    expect(base.flags).toEqual({});
  });

  it('setFlag refuses undeclared flags and values the register does not allow', () => {
    expect(validateCampaign(data, base, { type: 'effects', effects: [{ setFlag: 'nope' }] })).toBe('effect_invalid');
    expect(validateCampaign(data, base, { type: 'effects', effects: [{ setFlag: { avatar_honest: 'x' } }] })).toBe('effect_invalid');
    const withValues = { ...data, flags: { ...data.flags, e02: { id: 'e02', kind: 'decision' as const, values: ['protect', 'spare'] } } };
    expect(validateCampaign(withValues, base, { type: 'effects', effects: [{ setFlag: { e02: 'protect' } }] })).toBeNull();
    expect(validateCampaign(withValues, base, { type: 'effects', effects: [{ setFlag: { e02: 'burn' } }] })).toBe('effect_invalid');
    expect(applyCampaign(withValues, base, { type: 'effects', effects: [{ setFlag: { e02: 'spare' } }] }).campaign.flags).toEqual({ e02: 'spare' });
  });

  it('recruit adds a companion once; leave removes one and hands over the gear', () => {
    const joined = run(base, [{ recruit: 'liora' }]);
    expect(joined.campaign.roster.some((r) => r.id === 'liora')).toBe(true);
    expect(joined.events).toEqual([{ t: 'unitJoined', unit: 'liora' }]);
    expect(run(joined.campaign, [{ recruit: 'liora' }]).events).toEqual([]);

    const gear = joined.campaign.roster.find((r) => r.id === 'liora')!.equip;
    const carried = Object.values(gear).length + joined.campaign.roster.find((r) => r.id === 'liora')!.bag.length;
    const gone = run(joined.campaign, [{ leave: 'liora' }]);
    expect(gone.campaign.roster.some((r) => r.id === 'liora')).toBe(false);
    expect(gone.campaign.left).toEqual(['liora']);
    expect(gone.campaign.convoy.length).toBe(joined.campaign.convoy.length + carried);
    expect(gone.events).toEqual([{ t: 'unitLeft', unit: 'liora' }]);
    // coming back clears the departure
    expect(run(gone.campaign, [{ recruit: 'liora' }]).campaign.left).toEqual([]);
  });

  it('recruit and leave check their target', () => {
    const cmd = (effects: Effect[]) => validateCampaign(data, base, { type: 'effects', effects });
    expect(cmd([{ recruit: 'nobody' }])).toBe('unknown_unit');
    expect(cmd([{ leave: 'liora' }])).toBe('unknown_unit'); // not in the company
    expect(cmd([{ recruit: { lt: 'hask' } }])).toBe('effect_unsupported');
    const dead = clone(base);
    dead.roster = dead.roster.filter((r) => r.id !== 'tobin');
    dead.fallen.push({ id: 'tobin', nameKey: 'unit.tobin.name', node: 'prologue' });
    expect(validateCampaign(data, dead, { type: 'effects', effects: [{ recruit: 'tobin' }] })).toBe('effect_invalid');
  });

  it('gold and material change the stock and never go below zero', () => {
    const r = run(base, [{ gold: 50 }, { gold: -20 }, { material: { arcane_dust: 3, iron_ore: 1 } }]);
    expect(r.campaign.gold).toBe(base.gold + 30);
    expect(r.campaign.materials).toEqual({ arcane_dust: 3, iron_ore: 1 });
    expect(r.events).toEqual([
      { t: 'goldChanged', delta: 30, gold: base.gold + 30 },
      { t: 'materialChanged', id: 'arcane_dust', delta: 3 },
      { t: 'materialChanged', id: 'iron_ore', delta: 1 },
    ]);
    const cmd = (effects: Effect[]) => validateCampaign(data, base, { type: 'effects', effects });
    expect(cmd([{ gold: -(base.gold + 1) }])).toBe('not_enough_gold');
    expect(cmd([{ gold: 10 }, { gold: -(base.gold + 11) }])).toBe('not_enough_gold');
    expect(cmd([{ material: { arcane_dust: -1 } }])).toBe('not_enough_materials');
    expect(cmd([{ material: { not_an_item: 1 } }])).toBe('unknown_item');
  });

  it('item puts a new item into the convoy', () => {
    const r = run(base, [{ item: { def: 'iron_sword' } }]);
    expect(r.campaign.convoy.length).toBe(base.convoy.length + 1);
    expect(r.campaign.convoy.at(-1)!.def).toBe('iron_sword');
    expect(r.events).toEqual([{ t: 'itemGained', uid: r.campaign.convoy.at(-1)!.uid, def: 'iron_sword' }]);
    expect(validateCampaign(data, base, { type: 'effects', effects: [{ item: { def: 'nope' } }] })).toBe('unknown_item');
  });

  it('stance counts up, chronicle collects each page once', () => {
    const s = run(base, [{ stance: 'warm' }, { stance: 'warm' }, { stance: 'defiant' }, { chronicle: 'p1' }, { chronicle: 'p1' }]);
    expect(s.campaign.stance).toEqual({ warm: 2, sober: 0, defiant: 1 });
    expect(s.campaign.chronicle).toEqual(['p1']);
    expect(s.events.map((e) => e.t)).toEqual(['stanceGained', 'stanceGained', 'stanceGained', 'chronicleAdded']);
    expect(dominantStance(s.campaign.stance)).toBe('warm');
  });

  it('priceMod and villageAid are refused until their state exists', () => {
    const unsupported: Effect[] = [
      { priceMod: { pct: -10, act: 2 } },
      { villageAid: true },
    ];
    for (const e of unsupported) {
      expect(validateCampaign(data, base, { type: 'effects', effects: [e] })).toBe('effect_unsupported');
      expect(() => applyEffects(data, clone(base), [e], [])).toThrow(/not yet supported/);
    }
  });

  it('effects change the campaign only inside a command (the input stays untouched)', () => {
    const frozen = JSON.stringify(base);
    const events: CampaignEvent[] = [];
    applyCampaign(data, base, { type: 'effects', effects: [{ gold: 5 }, { recruit: 'liora' }, { stance: 'sober' }] });
    expect(JSON.stringify(base)).toBe(frozen);
    expect(events).toEqual([]);
  });
});

describe('schemas', () => {
  it('a condition or effect has exactly one key', () => {
    expect(conditionSchema.safeParse({ alive: 'kael' }).success).toBe(true);
    expect(conditionSchema.safeParse({ alive: 'kael', dead: 'tobin' }).success).toBe(false);
    expect(conditionSchema.safeParse({}).success).toBe(false);
    expect(conditionSchema.safeParse({ nonsense: 1 }).success).toBe(false);
    expect(conditionSchema.safeParse({ flag: { a: 1, b: 2 } }).success).toBe(false);
    expect(conditionSchema.safeParse({ flag: { e02: 'protect' } }).success).toBe(true);
    expect(conditionSchema.safeParse({ storyCount: {} }).success).toBe(false);
    expect(conditionSchema.safeParse({ storyCount: { min: 3 } }).success).toBe(true);
    expect(conditionSchema.safeParse({ support: { pair: ['brenna', 'kael'], rank: 'B' } }).success).toBe(true);
    expect(conditionSchema.safeParse({ support: { pair: ['brenna', 'kael'], rank: 'X' } }).success).toBe(false);
    expect(conditionSchema.safeParse({ stance: 'warm' }).success).toBe(true);
    expect(conditionSchema.safeParse({ stance: 'angry' }).success).toBe(false);
    expect(conditionSchema.safeParse({ chronicle: { min: 12 } }).success).toBe(true);
    expect(conditionSchema.safeParse({ chronicle: ['p1'] }).success).toBe(true);
    expect(conditionSchema.safeParse({ any: [{ alive: 'liora' }, { not: { dead: 'ysolde' } }] }).success).toBe(true);
    expect(conditionSchema.safeParse({ any: [{ alive: 'liora', dead: 'x' }] }).success).toBe(false);
    expect(effectSchema.safeParse({ gold: 10, material: {} }).success).toBe(false);
    expect(effectSchema.safeParse({ stance: 'warm' }).success).toBe(true);
    expect(effectSchema.safeParse({ grudge: { lt: 'hask', delta: -1 } }).success).toBe(true);
    expect(effectSchema.safeParse({ priceMod: { pct: -10, act: 2 } }).success).toBe(true);
    expect(effectSchema.safeParse({ setHome: 'castle' }).success).toBe(true);
    expect(effectSchema.safeParse({ setHome: 'tower' }).success).toBe(false);
    expect(effectSchema.safeParse({ item: { def: 'iron_sword' } }).success).toBe(true);
  });

  it('recruit and leave refuse the avatar and Kael', () => {
    for (const id of ['avatar', 'kael']) {
      expect(effectSchema.safeParse({ recruit: id }).success).toBe(false);
      expect(effectSchema.safeParse({ leave: id }).success).toBe(false);
    }
    expect(effectSchema.safeParse({ recruit: 'liora' }).success).toBe(true);
    expect(effectSchema.safeParse({ recruit: { lt: 'hask' } }).success).toBe(true);
    expect(effectSchema.safeParse({ leave: 'brenna' }).success).toBe(true);
  });
});

describe('content references (content:check)', () => {
  const problems = (d: GameData) => validateContent(d, locales).map((i) => `${i.file}: ${i.message}`);
  const speech = (cond: unknown) => ({ id: 'x1', mood: 'neutral', text: 'x', requires: [cond] });
  const choose = (e: unknown) => ({ id: 'x2', choice: [{ id: 'a', stance: 'warm', text: 'x', effects: [e] }, { id: 'b', stance: 'sober', text: 'y' }] });
  const withDialogue = (line: unknown): GameData => {
    const d = clone(data);
    d.scenes['scn.prologue.intro']!.lines.push(line as never);
    return d;
  };

  it('the shipped content is clean', () => {
    expect(problems(data)).toEqual([]);
  });

  it('an undeclared flag fails, in conditions, answers and map triggers', () => {
    expect(problems(withDialogue(speech({ flag: 'ghost' })))).toContainEqual(expect.stringContaining('undeclared flag ghost'));
    expect(problems(withDialogue(choose({ setFlag: 'ghost' })))).toContainEqual(expect.stringContaining('undeclared flag ghost'));
    const d = clone(data);
    d.maps.prologue_paktnacht!.triggers.push({ id: 't_ghost', when: { type: 'turn_start', turn: 1, phase: 'player' }, then: [{ action: 'set_flag', flag: 'ghost' }] });
    expect(problems(d)).toContainEqual(expect.stringContaining('undeclared flag ghost'));
  });

  it('unknown companions, nodes, pairs, items and materials fail', () => {
    const msgs = (cond: unknown) => problems(withDialogue(speech(cond)));
    expect(msgs({ alive: 'ghost' })).toContainEqual(expect.stringContaining('unknown companion ghost'));
    expect(msgs({ completed: 'm9_9' })).toContainEqual(expect.stringContaining('unknown node m9_9'));
    expect(msgs({ support: { pair: ['kael', 'tobin'], rank: 'C' } })).toContainEqual(expect.stringContaining('unknown support pair'));
    expect(msgs({ not: { any: [{ dead: 'ghost' }] } })).toContainEqual(expect.stringContaining('unknown companion ghost'));
    const eff = (e: unknown) => problems(withDialogue(choose(e)));
    expect(eff({ recruit: 'ghost' })).toContainEqual(expect.stringContaining('unknown companion ghost'));
    expect(eff({ item: { def: 'ghost' } })).toContainEqual(expect.stringContaining('unknown item ghost'));
    expect(eff({ material: { ghost: 1 } })).toContainEqual(expect.stringContaining('unknown material ghost'));
    expect(eff({ openQuest: 'ch01' })).toContainEqual(expect.stringContaining('openQuest ch01 is not a side quest'));
  });

  it('keys that are not supported yet fail with a clear message', () => {
    for (const e of [{ priceMod: { pct: 1, act: 2 } }, { villageAid: true }, { recruit: { lt: 'hask' } }]) {
      const m = problems(withDialogue(choose(e)));
      expect(m).toContainEqual(expect.stringContaining(`effect ${Object.keys(e)[0]!} is not yet supported`));
    }
  });

  it('room conditions are checked', () => {
    const d = clone(data);
    d.rooms.smith!.requires = [{ completed: 'm9_9' }];
    expect(problems(d)).toContainEqual(expect.stringContaining('smith.requires: unknown node m9_9'));
  });
});

describe('expectedLevel (story 4.1)', () => {
  const nodes = () => clone(data.campaign.nodes);
  const problems = (mutate: (d: GameData) => void) => {
    const d = clone(data);
    mutate(d);
    return validateContent(d, locales).map((i) => i.message);
  };

  it('every node of act 1 carries one and the curve never falls', () => {
    const levels = nodes().map((n) => n.expectedLevel);
    expect(levels.every((l) => Number.isInteger(l) && l >= 1)).toBe(true);
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
    expect(levels[0]).toBe(1);
  });

  it('a falling curve fails content:check', () => {
    const msgs = problems((d) => (d.campaign.nodes[2]!.expectedLevel = 1));
    expect(msgs).toContainEqual(expect.stringContaining('expectedLevel 1 falls below 2'));
    const next = problems((d) => (d.campaign.nodes[1]!.expectedLevel = 9));
    expect(next).toContainEqual(expect.stringContaining('lower expectedLevel'));
  });

  it('a missing expectedLevel fails the schema', () => {
    const raw = JSON.parse(JSON.stringify(data.campaign)) as { nodes: Array<Record<string, unknown>> };
    delete raw.nodes[0]!.expectedLevel;
    expect(campaignSchema.safeParse(raw).success).toBe(false);
  });
});

describe('content layout (story 4.1)', () => {
  it('the loader finds core, act 1 and the locales', () => {
    expect(Object.keys(data.maps).sort()).toEqual(expect.arrayContaining(['ch01_varnhold', 'ch02_silverbrook', 'm1_1_steckbriefe', 'prologue_paktnacht']));
    expect(Object.keys(data.scenes).length).toBeGreaterThan(30);
    expect(data.chars.kael).toBeDefined();
    expect(data.flags.avatar_honest).toBeDefined();
    expect(locales.de!['dlg.scn.prologue.intro.l01']).toBeTruthy();
    expect(locales.en!['dlg.scn.prologue.intro.l01']).toBeTruthy();
    expect(locales.de!['item.iron_sword.name']).toBeTruthy();
  });

  it('a missing core or act file is reported', () => {
    const issues = buildContent({}).issues.map((i) => i.file);
    expect(issues).toContain('core/balance.yaml');
    expect(issues).toContain('acts/act1/campaign.yaml');
    expect(issues).toContain('acts/act1/units.yaml');
    expect(issues).toContain('acts/act1/flags.yaml');
  });
});

describe('saves from before the fields existed', () => {
  it('normalizeCampaign turns a flag list into a record and fills the new fields', () => {
    const old = JSON.parse(readFileSync(join(process.cwd(), 'tests/fixtures/saves/format2-auto.json'), 'utf8')) as { payload: { campaign: CampaignState } };
    const legacy = clone(old.payload.campaign) as unknown as { flags: unknown; left?: unknown };
    legacy.flags = ['avatar_honest', 'ch02_hold'];
    delete legacy.left;
    const c = normalizeCampaign(data, legacy as unknown as CampaignState);
    expect(c.flags).toEqual({ avatar_honest: true, ch02_hold: true });
    expect(c.left).toEqual([]);
    expect(c.stance).toEqual({ warm: 0, sober: 0, defiant: 0 });
    expect(c.chronicle).toEqual([]);
    // an up-to-date campaign comes through unchanged
    const cur = clone(base);
    cur.flags.avatar_honest = true;
    expect(normalizeCampaign(data, cur)).toEqual(cur);
  });
});
