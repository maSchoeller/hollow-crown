/** The position level of act 2 (story 11.2, architecture §5.4): `nodeLevel`, `levelOffset`, join level, haunt fallback. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { loadContentFromDisk } from '../../src/content/node';
import { mapSchema } from '../../src/content/schemaMap';
import { validateUnitLevels } from '../../src/content/validateLevels';
import { validateContent } from '../../src/content/validate';
import {
  addToRoster,
  createBattle,
  hauntLevel,
  joinLevel,
  nodeLevel,
  positionNow,
  refreshTavern,
  spawnUnits,
  newCampaign,
  type CampaignNodeDef,
  type CampaignState,
  type GameData,
  type GameEvent,
  type MapDef,
} from '../../src/core';

let data: GameData;
let locales: ReturnType<typeof loadContentFromDisk>['locales'];

const avatar = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;
const BASE = 12; // positionLevel.base in acts/act2/campaign.yaml (story 11.4, product owner 2026-11-09)
const FIXTURE = 'dev_eisenmark';

/** Act 2 with the opening, the first pair, a side quest (one with `levelBonus`) and the fixture map as nodes. */
function actTwo(): GameData {
  const d = structuredClone(data);
  const raw = parseYaml(readFileSync(join(process.cwd(), 'tests', 'fixtures', 'maps', `${FIXTURE}.yaml`), 'utf8'));
  d.maps[FIXTURE] = { ...mapSchema.parse(raw), act: 2 } as MapDef;
  const node = (id: string, extra: Partial<CampaignNodeDef> = {}): CampaignNodeDef => ({ id, map: FIXTURE, titleKey: 'node.prologue.title', kind: 'story', merchantTier: 0, ...extra });
  d.acts[2]!.nodes = [
    node('m2_1', { fixed: 'first' }),
    node('m2_2', { requires: [{ completed: 'm2_1' }] }),
    node('m2_3', { requires: [{ completed: 'm2_1' }] }),
    node('n4', { kind: 'side', requires: [{ completed: 'm2_3' }] }),
    node('n5', { kind: 'side', requires: [{ completed: 'm2_3' }], levelBonus: 1 }),
  ];
  d.releasedActs = [1, 2];
  return d;
}

const actOneStory = () => data.acts[1]!.nodes.filter((n) => n.kind === 'story').map((n) => n.id);
/** A campaign in act 2 with all of act 1 and `done` of act 2 completed. */
function inActTwo(d: GameData, done: string[] = []): CampaignState {
  const c = newCampaign(d, 3, { difficulty: 'normal', deathMode: 'standard' }, avatar);
  return { ...c, act: 2, completed: [...actOneStory(), ...done] };
}
const n2 = (d: GameData, id: string) => d.acts[2]!.nodes.find((n) => n.id === id)!;

beforeAll(() => {
  const loaded = loadContentFromDisk();
  data = loaded.data;
  locales = loaded.locales;
});

describe('nodeLevel', () => {
  it('act 1 keeps expectedLevel, whatever is done', () => {
    const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, avatar);
    for (const n of data.acts[1]!.nodes) {
      expect(nodeLevel(data, c, n)).toBe(n.expectedLevel);
      expect(nodeLevel(data, { ...c, completed: actOneStory() }, n)).toBe(n.expectedLevel);
    }
  });

  it('act 2 starts at positionLevel.base (campaign.yaml)', () => {
    expect(data.acts[2]!.positionLevel).toEqual({ base: BASE });
    const d = actTwo();
    expect(nodeLevel(d, inActTwo(d), n2(d, 'm2_1'))).toBe(BASE);
  });

  it('both positions of a pair: the second one played is one higher', () => {
    const d = actTwo();
    const open = inActTwo(d, ['m2_1']);
    expect(nodeLevel(d, open, n2(d, 'm2_2'))).toBe(BASE + 1);
    expect(nodeLevel(d, open, n2(d, 'm2_3'))).toBe(BASE + 1);
    expect(nodeLevel(d, inActTwo(d, ['m2_1', 'm2_2']), n2(d, 'm2_3'))).toBe(BASE + 2);
    expect(nodeLevel(d, inActTwo(d, ['m2_1', 'm2_3']), n2(d, 'm2_2'))).toBe(BASE + 2);
  });

  it('a side quest early and late, with its levelBonus', () => {
    const d = actTwo();
    const early = inActTwo(d, ['m2_1', 'm2_3']);
    const late = inActTwo(d, ['m2_1', 'm2_3', 'm2_2']);
    expect(nodeLevel(d, early, n2(d, 'n4'))).toBe(BASE + 2);
    expect(nodeLevel(d, late, n2(d, 'n4'))).toBe(BASE + 3);
    expect(nodeLevel(d, late, n2(d, 'n5'))).toBe(BASE + 4);
    // a side quest done does not count for the position
    expect(nodeLevel(d, inActTwo(d, ['m2_1', 'm2_3', 'n4']), n2(d, 'm2_2'))).toBe(BASE + 2);
  });

  it('a side quest of act 1 keeps its expectedLevel in act 2', () => {
    const d = actTwo();
    const n1 = d.acts[1]!.nodes.find((n) => n.kind === 'side')!;
    expect(nodeLevel(d, inActTwo(d, ['m2_1']), n1)).toBe(n1.expectedLevel);
  });

  it('the tavern offers act-2 mercenaries around P', () => {
    const d = actTwo();
    const c = inActTwo(d, ['m2_1']);
    refreshTavern(d, c);
    const spread = d.balance.economy.tavern.levelSpread;
    for (const u of c.tavern) {
      expect(u.level).toBeLessThanOrEqual(BASE + 1);
      expect(u.level).toBeGreaterThanOrEqual(BASE + 1 - spread);
    }
  });
});

describe('levelOffset', () => {
  it('createBattle puts P into the start state and the foes on P + offset', () => {
    const d = actTwo();
    const c = inActTwo(d, ['m2_1']);
    const s = createBattle(d, c, 'm2_2', []);
    const P = BASE + 1;
    expect(s.positionLevel).toBe(P);
    const lv = (id: string) => s.units.find((u) => u.uid === id)!.level;
    expect(lv('dev_soldier_a')).toBe(P - 3);
    expect(lv('dev_elite')).toBe(P - 1);
    expect(lv('dev_captain')).toBe(P + 2);
    expect(lv('dev_vanguard')).toBe(P);
    // replay-safe: the same campaign builds the same battle
    expect(createBattle(d, c, 'm2_2', [])).toEqual(s);
  });

  it('waves and spawn triggers stand on the P of the battle', () => {
    const d = actTwo();
    const s = createBattle(d, inActTwo(d), 'm2_1', []);
    const map = d.maps[FIXTURE]!;
    const events: GameEvent[] = [];
    spawnUnits(d, s, map.reinforcements[0]!.units, true, events);
    const spawn = map.triggers[0]!.then[0]!;
    if (spawn.action !== 'spawn') throw new Error('fixture: spawn trigger expected');
    spawnUnits(d, s, spawn.units, false, events);
    expect(s.units.find((u) => u.uid === 'dev_wave')!.level).toBe(BASE - 2);
    expect(s.units.find((u) => u.uid === 'dev_ambush')!.level).toBe(BASE - 2);
  });

  it('a battle of act 1 has no positionLevel (start states unchanged)', () => {
    const c = newCampaign(data, 1, { difficulty: 'normal', deathMode: 'standard' }, avatar);
    const s = createBattle(data, c, 'prologue', c.roster.map((u) => u.id));
    expect('positionLevel' in s).toBe(false);
  });

  it('content:check: required on foes of act-2 maps, within -3..+2, never on act-1 maps', () => {
    const d = actTwo();
    const msgs: string[] = [];
    const err = (_f: string, m: string) => msgs.push(m);
    validateUnitLevels(d, d.maps[FIXTURE]!, err);
    expect(msgs).toEqual([]);
    const bad = structuredClone(d.maps[FIXTURE]!);
    bad.units[3] = { ...bad.units[3]!, levelOffset: 3 };
    bad.units[4] = { ...bad.units[4]!, levelOffset: undefined, level: 8 };
    bad.reinforcements[0]!.units[0] = { ...bad.reinforcements[0]!.units[0]!, levelOffset: undefined };
    validateUnitLevels(d, bad, err);
    expect(msgs).toEqual(
      expect.arrayContaining([
        'dev_soldier_a: levelOffset 3 outside -3..2',
        'dev_soldier_b: levelOffset missing (act 2 has a positionLevel)',
        'dev_wave: levelOffset missing (act 2 has a positionLevel)',
        'dev_wave: level or levelOffset missing',
      ]),
    );
    msgs.length = 0;
    validateUnitLevels(d, { ...d.maps[FIXTURE]!, act: 1 }, err);
    expect(msgs).toContain('dev_soldier_a: levelOffset needs a positionLevel in act 1');
  });

  it('content:check: expectedLevel is required only in an act without positionLevel', () => {
    const d = actTwo();
    const issues = validateContent(d, locales).map((i) => i.message);
    expect(issues.filter((m) => /expectedLevel|levelBonus/.test(m))).toEqual([]);
    delete d.acts[1]!.nodes[1]!.expectedLevel;
    d.acts[1]!.nodes[2]!.levelBonus = 1;
    const after = validateContent(d, locales).map((i) => i.message);
    expect(after).toContainEqual(expect.stringContaining(`${d.acts[1]!.nodes[1]!.id}: expectedLevel missing`));
    expect(after).toContainEqual(expect.stringContaining(`${d.acts[1]!.nodes[2]!.id}: levelBonus needs a positionLevel`));
  });
});

describe('join level', () => {
  it('a companion of act 2 joins with max(level, P - 1), stats on the expected growth', () => {
    const d = actTwo();
    const c = inActTwo(d, ['m2_1', 'm2_2']);
    const P = positionNow(d, c)!;
    expect(P).toBe(BASE + 2);
    const def = d.chars.jory!;
    expect(def.act).toBe(2);
    expect(joinLevel(d, def, P)).toBe(Math.max(def.level, P - 1));
    addToRoster(d, c, 'jory');
    const rec = c.roster.find((u) => u.id === 'jory')!;
    expect(rec.level).toBe(P - 1);
    // no dice: a second campaign gets the same record
    const again = inActTwo(d, ['m2_1', 'm2_2']);
    addToRoster(d, again, 'jory');
    expect(again.roster.find((u) => u.id === 'jory')!.stats).toEqual(rec.stats);
    for (const k of Object.keys(def.base) as (keyof typeof def.base)[]) expect(rec.stats[k]).toBeGreaterThanOrEqual(def.base[k]);
    expect(rec.stats.hp).toBeGreaterThan(def.base.hp);
  });

  it('a companion above P - 1 keeps his level; a companion of act 1 joins as before', () => {
    const d = actTwo();
    const c = inActTwo(d);
    expect(joinLevel(d, { act: 2, level: 15 }, BASE)).toBe(15);
    const fenn = d.chars.fenn!;
    addToRoster(d, c, 'fenn');
    expect(c.roster.find((u) => u.id === 'fenn')!.level).toBe(fenn.level);
  });

  it('a story character on an act-2 board stands on his join level', () => {
    const d = actTwo();
    const map = d.maps[FIXTURE]!;
    map.units.push({ char: 'jory', team: 'other', at: [0, 9], items: [] } as unknown as MapDef['units'][number]);
    const s = createBattle(d, inActTwo(d), 'm2_1', []);
    const jory = s.units.find((u) => u.id === 'jory')!;
    expect(jory.level).toBe(BASE - 1);
    expect(jory.hp).toBeGreaterThan(d.chars.jory!.base.hp);
  });
});

describe('haunt level in act 2', () => {
  it('without a story map in act 2 it takes the last act with maps, not level 1', () => {
    const d = actTwo();
    for (const n of d.acts[2]!.nodes) n.map = 'm2_without_map';
    const c = inActTwo(d);
    const finale = d.acts[1]!.nodes.find((n) => n.fixed === 'finale')!;
    expect(hauntLevel(d, c)).toBe(finale.expectedLevel);
  });

  it('with a playable story node of act 2 it is that node level', () => {
    const d = actTwo();
    expect(hauntLevel(d, inActTwo(d, ['m2_1']))).toBe(BASE + 1);
  });
});
