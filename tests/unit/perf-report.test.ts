import { describe, expect, it } from 'vitest';
import { exceedances, frameStats, markdown, type DeviceReport } from '../perf/report';

const report = (avgFps: number, coldStartMs: number): DeviceReport => ({
  device: 'pixel6a',
  renderer: 'test',
  enemyPhase: { ...frameStats([16.7]), avgFps, units: 40, events: 120, durationMs: 9000, loadMs: 800, drawCallsAvg: 50, drawCallsMax: 80 },
  coldStart: { firstVisitMs: 400, firstInstallMs: 9000, coldStartMs },
});

describe('performance report (story 7.5)', () => {
  it('derives FPS, quantiles and dropped frames from frame times', () => {
    const s = frameStats([16, 16, 17, 17, 50]);
    expect(s.frames).toBe(5);
    expect(s.avgFps).toBe(43.1);
    expect(s.p50Ms).toBe(17);
    expect(s.maxMs).toBe(50);
    expect(s.dropped).toBe(0.2);
    expect(frameStats([])).toMatchObject({ frames: 0, avgFps: 0, maxMs: 0, dropped: 0 });
  });

  it('reports what misses the targets', () => {
    expect(exceedances(report(59.7, 3000))).toEqual([]);
    expect(exceedances(report(48, 6200))).toEqual([
      'pixel6a: enemy phase averages 48 FPS (target 60)',
      'pixel6a: cold start 6200 ms (target < 5000 ms)',
    ]);
  });

  it('writes one table row per device and the verdict', () => {
    const md = markdown([report(60, 3000)], 'note');
    expect(md).toContain('| pixel6a (test) | 60 |');
    expect(md).toContain('✓ alle Ziele gehalten');
    expect(markdown([report(30, 3000)], 'note')).toContain('⚠ pixel6a: enemy phase averages 30 FPS');
  });
});
