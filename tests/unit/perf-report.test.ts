import { describe, expect, it } from 'vitest';
import { exceedances, frameStats, markdown, median, summarize, toBaseline, type DeviceReport, type PhaseRun } from '../perf/report';

const run = (avgFps: number, over: Partial<PhaseRun> = {}): PhaseRun => ({
  ...frameStats([16.7]),
  avgFps,
  durationMs: 9000,
  rendered: 500,
  drawCallsAvg: 50,
  drawCallsMax: 80,
  threadMsPerFrame: 9.5,
  newEffects: 0,
  ...over,
});

const report = (fps2: number[], fps4: number[], coldStartMs = 3000, renderer = 'ANGLE (NVIDIA)'): DeviceReport => ({
  device: 'pixel6a',
  renderer,
  units: 40,
  events: 120,
  loadMs: 800,
  stages: [
    { cpuSlowdown: 2, targetFps: 60, runs: fps2.map((f) => run(f)) },
    { cpuSlowdown: 4, targetFps: 30, runs: fps4.map((f) => run(f)) },
  ],
  coldStart: { firstVisitMs: 400, firstInstallMs: 9000, coldStartMs },
});

describe('performance report (stories 7.5, 7.7)', () => {
  it('derives FPS, quantiles and dropped frames from frame times', () => {
    const s = frameStats([16, 16, 17, 17, 50]);
    expect(s.frames).toBe(5);
    expect(s.avgFps).toBe(43.1);
    expect(s.p50Ms).toBe(17);
    expect(s.maxMs).toBe(50);
    expect(s.dropped).toBe(0.2);
    expect(frameStats([])).toMatchObject({ frames: 0, avgFps: 0, maxMs: 0, dropped: 0 });
  });

  it('takes the median of the runs and shows the spread', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 10])).toBe(2.5);
    expect(median([])).toBe(0);
    const s = summarize({ cpuSlowdown: 2, targetFps: 60, runs: [run(40, { threadMsPerFrame: 11 }), run(58, { threadMsPerFrame: 9 }), run(52, { threadMsPerFrame: null })] });
    expect(s).toMatchObject({ runs: 3, avgFps: 52, fpsMin: 40, fpsMax: 58, threadMsPerFrame: 10 });
  });

  it('reports what misses the targets of each level', () => {
    expect(exceedances(report([60, 59.7, 61], [31, 30.2, 30], 3000))).toEqual([]);
    expect(exceedances(report([48, 50, 47], [31, 22, 25], 6200))).toEqual([
      'pixel6a: enemy phase at CPU 2× averages 48 FPS (target 60)',
      'pixel6a: enemy phase at CPU 4× averages 25 FPS (target 30)',
      'pixel6a: cold start 6200 ms (target < 5000 ms)',
    ]);
  });

  it('does not warn about FPS on software rendering, but about the cold start', () => {
    const sw = report([10], [3], 6200, 'Google SwiftShader');
    expect(exceedances(sw)).toEqual(['pixel6a: cold start 6200 ms (target < 5000 ms)']);
  });

  it('writes one table row per device and level, with the values before', () => {
    const now = report([60], [31]);
    const baseline = toBaseline([report([40], [8])], 'vorher-Stand');
    expect(baseline.gpu).toBe(true);
    expect(baseline.devices.pixel6a!['4']).toMatchObject({ avgFps: 8, threadMsPerFrame: 9.5 });
    const md = markdown([now], 'note', baseline);
    expect(md).toContain('| pixel6a (ANGLE (NVIDIA)) | 2× | 60 | 60 (vorher 40) |');
    expect(md).toContain('| pixel6a (ANGLE (NVIDIA)) | 4× | 30 | 31 (vorher 8) |');
    expect(md).toContain('✓ alle Ziele gehalten');
    expect(markdown([report([30], [30])], 'note')).toContain('⚠ pixel6a: enemy phase at CPU 2× averages 30 FPS');
    // a GPU baseline says nothing about software rendering
    expect(markdown([report([10], [3], 3000, 'SwiftShader')], 'note', baseline)).not.toContain('vorher');
  });
});
