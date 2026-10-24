/** Frame statistics and the report of the performance run (story 7.5). Pure, so the numbers are unit-tested. */
import { TARGETS } from './profile';

export interface FrameStats {
  frames: number;
  avgFps: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  /** share of frames slower than `TARGETS.droppedFrameMs` (0..1) */
  dropped: number;
}

const quantile = (sorted: number[], q: number): number => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]! : 0);
const round = (n: number, d = 1): number => Math.round(n * 10 ** d) / 10 ** d;

export function frameStats(frames: readonly number[]): FrameStats {
  const sorted = [...frames].sort((a, b) => a - b);
  const total = frames.reduce((s, f) => s + f, 0);
  return {
    frames: frames.length,
    avgFps: total > 0 ? round((frames.length * 1000) / total) : 0,
    p50Ms: round(quantile(sorted, 0.5)),
    p95Ms: round(quantile(sorted, 0.95)),
    maxMs: round(sorted[sorted.length - 1] ?? 0),
    dropped: frames.length ? round(frames.filter((f) => f > TARGETS.droppedFrameMs).length / frames.length, 3) : 0,
  };
}

export interface DeviceReport {
  device: string;
  /** WebGL renderer of the run */
  renderer: string;
  enemyPhase: FrameStats & { units: number; events: number; durationMs: number; loadMs: number; drawCallsAvg: number | null; drawCallsMax: number | null };
  coldStart: { firstVisitMs: number; firstInstallMs: number; coldStartMs: number };
}

/** What exceeds the targets, as sentences for the CI log; empty when everything holds. */
export function exceedances(r: DeviceReport): string[] {
  const out: string[] = [];
  // a 60 Hz loop never reports exactly 60: allow half a frame per second of jitter
  if (r.enemyPhase.avgFps < TARGETS.fps - 0.5) out.push(`${r.device}: enemy phase averages ${r.enemyPhase.avgFps} FPS (target ${TARGETS.fps})`);
  if (r.coldStart.coldStartMs > TARGETS.coldStartMs) out.push(`${r.device}: cold start ${r.coldStart.coldStartMs} ms (target < ${TARGETS.coldStartMs} ms)`);
  return out;
}

/** Markdown table of all devices, for the job summary and the release check (story 9.14). */
export function markdown(reports: readonly DeviceReport[], note: string): string {
  const lines = [
    '# Leistungsmessung',
    '',
    note,
    '',
    '| Gerät (Renderer) | Ø FPS | p95 ms | max ms | Frames > 25 ms | Gegnerphase s | Draw Calls Ø/max | Kaltstart ms | Erstbesuch bis Titel ms |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const r of reports) {
    const e = r.enemyPhase;
    const dc = e.drawCallsAvg === null ? '–' : `${e.drawCallsAvg}/${e.drawCallsMax}`;
    lines.push(
      `| ${r.device} (${r.renderer}) | ${e.avgFps} | ${e.p95Ms} | ${e.maxMs} | ${round(e.dropped * 100)} % | ${round(e.durationMs / 1000)} | ${dc} | ${r.coldStart.coldStartMs} | ${r.coldStart.firstInstallMs} |`,
    );
  }
  const over = reports.flatMap(exceedances);
  lines.push('', over.length ? over.map((o) => `- ⚠ ${o}`).join('\n') : '- ✓ alle Ziele gehalten');
  return lines.join('\n') + '\n';
}
