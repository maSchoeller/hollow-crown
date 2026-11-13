import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { CampaignState, GameData } from '../../src/core';
import {
  missionFlags,
  prepareActData,
  simulateCampaign,
  type CampaignSimOptions,
  type MissionSim,
} from '../../tools/simCampaign';

/** Story 11.4: the simulation over the acts, on the probe map of story 11.2, played at node m2_1 in place of its map (story 11.12) unless a test names another node. */
let data: GameData;
let base: number;

beforeAll(() => {
  data = loadContentFromDisk().data;
  base = data.acts[2]!.positionLevel!.base;
});

const MAP = 'tests/fixtures/maps/dev_eisenmark.yaml';
const opts = (over: Partial<CampaignSimOptions> = {}): CampaignSimOptions => ({
  runs: 1,
  seed: 5,
  difficulty: 'normal',
  deathMode: 'standard',
  act: 2,
  start: 'expected',
  mapFile: MAP,
  node: 'm2_1',
  ...over,
});
/**
 * Story 11.15: the map of 2-4 (G 30×40, 12 against 38) is left out here, one battle of it takes several seconds; its node is then skipped like a
 * placeholder, and tests/unit/m2-4-brandschneise.test.ts checks the map itself.
 */
const withoutBrandschneise = (d: GameData): GameData => {
  const maps = { ...d.maps };
  delete maps.m2_4_brandschneise;
  return { ...d, maps };
};
const sim = (o: CampaignSimOptions) => simulateCampaign(withoutBrandschneise(prepareActData(data, o)), o);
/** the mission played on the probe map */
const probe = (r: ReturnType<typeof sim>): MissionSim => r.missions.find((m) => m.map === 'dev_eisenmark')!;

// Each of these plays whole battles of the probe map (at m2_1) and of 2-2 and 2-3 (real maps since stories 11.13, 11.14): 9–10.5 s alone
// (story 11.14, was 2.3–8 s with 2-2 only), about twice that under coverage on a busy machine, hence the own timeout.
// 2-5 has its real map since story 11.16: maxMissions stops each run before it.
describe('simulation over the acts (story 11.4)', { timeout: 45_000 }, () => {
  it('gives the same report for the same seed, and skips the nodes without a map', () => {
    const a = sim(opts({ maxMissions: 3 }));
    expect(sim(opts({ maxMissions: 3 }))).toEqual(a);
    expect(a.missions.map((m) => m.node)).toEqual(['m2_1', 'm2_2', 'm2_3']);
    expect(a.missions[0]!.map).toBe('dev_eisenmark');
    expect(a.missions[1]!.map).toBe('m2_2_salzpass');
    expect(a.missions[2]!.map).toBe('m2_3_rabenweide');
    // the placeholders up to the next real map (m2_5) are skipped, the run stops there
    expect(Object.keys(a.skipped)).toEqual(['m2_4']);
    // the company starts act 2 on P of its first mission
    expect(a.entry.runs).toBe(1);
    expect(a.entry.armyLevel).toBe(base);
    expect(a.missions[0]!.expectedLevel).toBe(base);
  });

  it('--position sets P of the target node, and the expected start raises the company to it', () => {
    const a = sim(opts({ position: base + 3, maxMissions: 1 }));
    expect(a.missions[0]!.expectedLevel).toBe(base + 3);
    expect(a.entry.armyLevel).toBe(base + 3);
    // the target is the node of --node; the skipped nodes before it count for P
    const d = sim(opts({ node: 'm2_4', position: base + 1, maxMissions: 4 }));
    expect(probe(d).node).toBe('m2_4');
    expect(probe(d).expectedLevel).toBe(base + 1);
  });

  it('--order puts a mission of a pair first: m2_3 at the first or the second position after m2_1', () => {
    const late = sim(opts({ node: 'm2_3', maxMissions: 3 }));
    const early = sim(opts({ node: 'm2_3', order: ['m2_3'], maxMissions: 3 }));
    // file order plays m2_2 before m2_3; with --order m2_3 comes right after m2_1
    expect(probe(late).expectedLevel).toBe(base + 2);
    expect(probe(early).expectedLevel).toBe(base + 1);
  });

  it('--flags sets the outcome of a decision for the whole run, only registered flags', () => {
    const seen: Array<CampaignState['flags']> = [];
    const onMission = (_: string, c: CampaignState) => void seen.push({ ...c.flags });
    sim(opts({ onMission, maxMissions: 1 }));
    const first = seen.length;
    sim(opts({ flags: ['e07=warn'], onMission, maxMissions: 1 }));
    expect(seen[0]!.e07).toBeUndefined();
    expect(seen[first]!.e07).toBe('warn');
    expect(() => sim(opts({ flags: ['e7_warned'] }))).toThrow(/no flag "e7_warned"/);
    expect(() => sim(opts({ flags: ['e07=maybe'] }))).toThrow(/e07 takes warn, obey/);
  });

  it('act 1 keeps its data; options of a later act need one', () => {
    const o = { difficulty: 'normal' as const, deathMode: 'standard' as const };
    expect(prepareActData(data, o)).toBe(data);
    expect(prepareActData(data, { ...o, act: 2 }).releasedActs).toEqual([1, 2]);
    expect(data.releasedActs).toEqual([1]);
    expect(() => prepareActData(data, { ...o, position: 12 })).toThrow(/later act/);
    expect(() => simulateCampaign(data, { ...o, runs: 1, seed: 1, start: 'expected' })).toThrow(/later act/);
  });

  it('checks a mission of act 2 against the gold curve of act 2', () => {
    const [lo2] = data.balance.simulation.gold.perAct['2']!;
    const m: MissionSim = {
      node: 'm2_1',
      map: 'dev_eisenmark',
      expectedLevel: base,
      reached: 1,
      wins: 1,
      downs: 1,
      gold: lo2 - 1,
      sideGold: 0,
      rooms: 0,
      cleared: 1,
      armyLevel: base,
      deaths: 0,
      turns: 0,
      actions: 0,
      deployed: 0,
      phases: 0,
      phaseSingle: 0,
      phaseMarch: 0,
      phaseSingleMax: 0,
      phaseMarchMax: 0,
      phaseShown: 0,
      phaseShownMax: 0,
      winTurns: [],
      side: {},
    };
    const d = prepareActData(data, { act: 2, difficulty: 'normal', deathMode: 'standard', mapFile: MAP });
    expect(missionFlags(d, m, 'normal').gold).toBe('low');
    // inside the act-2 curve, though far above the act-1 one
    expect(missionFlags(d, { ...m, gold: lo2 }, 'normal').gold).toBeUndefined();
  });
});
