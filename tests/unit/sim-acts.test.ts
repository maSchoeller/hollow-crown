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

/** Story 11.4: the simulation over the acts, on the probe map of story 11.2 (act 2 has no playable maps yet). */
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
  ...over,
});
const sim = (o: CampaignSimOptions) => simulateCampaign(prepareActData(data, o), o);

describe('simulation over the acts (story 11.4)', () => {
  it('gives the same report for the same seed, and skips the nodes without a map', () => {
    const a = sim(opts());
    expect(sim(opts())).toEqual(a);
    expect(a.missions.map((m) => m.node)).toEqual(['m2_1']);
    expect(a.missions[0]!.map).toBe('dev_eisenmark');
    expect(Object.keys(a.skipped)).toEqual(['m2_2', 'm2_3', 'm2_4', 'm2_5', 'm2_6', 'm2_7', 'm2_8']);
    // the company starts act 2 on P of its first mission
    expect(a.entry.runs).toBe(1);
    expect(a.entry.armyLevel).toBe(base);
    expect(a.missions[0]!.expectedLevel).toBe(base);
  });

  it('--position sets P of the target node, and the expected start raises the company to it', () => {
    const a = sim(opts({ position: base + 3 }));
    expect(a.missions[0]!.expectedLevel).toBe(base + 3);
    expect(a.entry.armyLevel).toBe(base + 3);
    // the target is the node of --node; the skipped nodes before it count for P
    const d = sim(opts({ node: 'm2_4', position: base + 1 }));
    expect(d.missions.map((m) => m.node)).toEqual(['m2_4']);
    expect(d.missions[0]!.expectedLevel).toBe(base + 1);
  });

  it('--order puts a mission of a pair first: m2_3 at the first or the second position after m2_1', () => {
    const late = sim(opts({ node: 'm2_3' }));
    const early = sim(opts({ node: 'm2_3', order: ['m2_3'] }));
    // file order plays m2_2 (skipped) before m2_3; with --order m2_3 comes right after m2_1 (skipped)
    expect(late.missions[0]!.expectedLevel).toBe(base + 2);
    expect(early.missions[0]!.expectedLevel).toBe(base + 1);
  });

  it('--flags sets the outcome of a decision for the whole run, only registered flags', () => {
    const seen: Array<CampaignState['flags']> = [];
    const onMission = (_: string, c: CampaignState) => void seen.push({ ...c.flags });
    sim(opts({ onMission }));
    sim(opts({ flags: ['e07=warn'], onMission }));
    expect(seen[0]!.e07).toBeUndefined();
    expect(seen[1]!.e07).toBe('warn');
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
