import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import type { GameData } from '../../src/core';
import { mergeCampaignSims, simulateCampaign } from '../../tools/simCampaign';
import { diffSims, flatten } from '../../tools/simDiff';
import { percentile, turnStats } from '../../tools/simMap';
import { applySets, loadContentWithSets, parseSets } from '../../tools/simOverrides';

let data: GameData;

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('pnpm sim tooling (Testlabor S1/S2)', () => {
  it('--set changes balance values for the run only and rejects unknown paths', () => {
    const sets = parseSets(['m1_3', '--set', 'experience.killBase=99', '--runs', '5', '--set', 'simulation.levelTolerance=0.5']);
    expect(sets).toEqual({ 'experience.killBase': 99, 'simulation.levelTolerance': 0.5 });
    const changed = loadContentWithSets(sets).data;
    expect(changed.balance.experience.killBase).toBe(99);
    expect(changed.balance.simulation.levelTolerance).toBe(0.5);
    expect(loadContentFromDisk().data.balance.experience.killBase).toBe(data.balance.experience.killBase);
    expect(() => applySets({ experience: { killBase: 1 } }, { 'experience.killbase': 2 })).toThrow(/no "experience.killbase"/);
    expect(() => parseSets(['--set', 'experience.killBase'])).toThrow(/path=value/);
    expect(() => loadContentWithSets({ 'experience.killBase': 'viele' })).toThrow(/breaks balance.yaml/);
  });

  it('turn percentiles use the nearest rank, p50 is the old median', () => {
    expect(percentile([], 0.5)).toBeNull();
    expect(turnStats([12, 8, 10, 10, 9])).toEqual({ p10: 8, p50: 10, p90: 12, dist: { 8: 1, 9: 1, 10: 2, 12: 1 } });
  });

  it('sim:diff lists only moved values, rates in points, missions by node', () => {
    const a = { kind: 'campaign', missions: [{ node: 'm1_1', winRate: 0.9, gold: 1000, flags: {} }], timing: { seconds: 3 } };
    const b = { kind: 'campaign', missions: [{ node: 'm1_1', winRate: 0.8, gold: 1010, flags: { win: 'low' } }], timing: { seconds: 9 } };
    expect(Object.keys(flatten(a))).toEqual(['missions.m1_1.winRate', 'missions.m1_1.gold', 'missions.m1_1.flags']);
    expect(diffSims(a, b)).toEqual([
      { key: 'missions.m1_1.winRate', a: 0.9, b: 0.8, delta: '-10 pt' },
      { key: 'missions.m1_1.flags', a: '', b: 'win↓', delta: 'changed' },
    ]);
  });

  // plays two runs of the first two missions twice (about 3 s alone), more than the global timeout allows under load
  it('per-run campaign sims merge into exactly the serial result', { timeout: 60000 }, () => {
    const o = { difficulty: 'normal' as const, deathMode: 'standard' as const, maxMissions: 2 };
    const serial = simulateCampaign(data, { ...o, runs: 2, seed: 5 });
    const parts = [0, 1].map((r) => simulateCampaign(data, { ...o, runs: 1, seed: 5 + r }));
    expect(mergeCampaignSims(parts)).toEqual(serial);
    expect(serial.missions[0]!.winTurns.length).toBe(serial.missions[0]!.wins);
  });

  // two CLI processes (content load, worker threads, three battles each): about 8 s alone
  it('the same seed gives the same result serial and on worker threads', { timeout: 120000 }, () => {
    const dir = mkdtempSync(join(tmpdir(), 'hc-sim-'));
    try {
      const run = (workers: number) => {
        const out = join(dir, `w${workers}.json`);
        const args = ['--import', 'tsx', 'tools/simulate.ts', 'm1_1', '--fresh', '--runs', '3', '--seed', '7', '--workers', String(workers), '--json', out];
        execFileSync(process.execPath, args, { stdio: 'pipe' });
        const { timing, ...rest } = JSON.parse(readFileSync(out, 'utf8')) as { timing: { workers: number }; perRun: { ms?: number }[] };
        expect(timing.workers).toBe(workers);
        return { ...rest, perRun: rest.perRun.map(({ ms: _, ...r }) => r) };
      };
      const serial = run(1);
      expect(serial).toMatchObject({ kind: 'map', node: 'm1_1', runs: 3, arrived: 3 });
      expect(Object.keys((serial as unknown as { side: object }).side)).toEqual(['s_villages', 's_fast']);
      expect(run(3)).toEqual(serial);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
