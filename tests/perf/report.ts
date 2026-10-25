/** Frame statistics and the report of the performance run (stories 7.5, 7.7). Pure, so the numbers are unit-tested. */
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

/** Median of a list (mean of the middle pair for an even count); 0 for an empty list. */
export function median(values: readonly number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/** One playback of the enemy phase. */
export interface PhaseRun extends FrameStats {
  durationMs: number;
  /** frames Babylon rendered during the phase (the host caps the rate; animation frames are not all rendered) */
  rendered: number;
  drawCallsAvg: number | null;
  drawCallsMax: number | null;
  /** main thread CPU time per rendered frame (CDP `Performance.getMetrics` ThreadTime), ms */
  threadMsPerFrame: number | null;
  /** shader variants compiled during the phase (the board compiles them at load, so the phase should start none) */
  newEffects: number;
}

/** All runs of one throttling level. */
export interface StageReport {
  cpuSlowdown: number;
  /** FPS target of the level; null: reported only */
  targetFps: number | null;
  runs: PhaseRun[];
}

export interface DeviceReport {
  device: string;
  /** WebGL renderer of the run */
  renderer: string;
  units: number;
  events: number;
  loadMs: number;
  stages: StageReport[];
  coldStart: { firstVisitMs: number; firstInstallMs: number; coldStartMs: number };
}

/** The median of a level's runs (each metric on its own), with the spread of the FPS. */
export interface StageSummary {
  cpuSlowdown: number;
  targetFps: number | null;
  runs: number;
  avgFps: number;
  fpsMin: number;
  fpsMax: number;
  p95Ms: number;
  maxMs: number;
  dropped: number;
  drawCallsAvg: number | null;
  drawCallsMax: number | null;
  threadMsPerFrame: number | null;
  newEffects: number;
  durationMs: number;
}

const medianOrNull = (values: Array<number | null>): number | null => {
  const v = values.filter((n): n is number => n !== null);
  return v.length ? round(median(v)) : null;
};

export function summarize(stage: StageReport): StageSummary {
  const r = stage.runs;
  const fps = r.map((x) => x.avgFps);
  return {
    cpuSlowdown: stage.cpuSlowdown,
    targetFps: stage.targetFps,
    runs: r.length,
    avgFps: round(median(fps)),
    fpsMin: fps.length ? Math.min(...fps) : 0,
    fpsMax: fps.length ? Math.max(...fps) : 0,
    p95Ms: round(median(r.map((x) => x.p95Ms))),
    maxMs: round(median(r.map((x) => x.maxMs))),
    dropped: round(median(r.map((x) => x.dropped)), 3),
    drawCallsAvg: medianOrNull(r.map((x) => x.drawCallsAvg)),
    drawCallsMax: medianOrNull(r.map((x) => x.drawCallsMax)),
    threadMsPerFrame: medianOrNull(r.map((x) => x.threadMsPerFrame)),
    newEffects: Math.round(median(r.map((x) => x.newEffects))),
    durationMs: Math.round(median(r.map((x) => x.durationMs))),
  };
}

/** Is this WebGL renderer a GPU? Software rendering (SwiftShader and the like) draws another load; its FPS is only reported. */
export function isGpu(renderer: string): boolean {
  return !/swiftshader|llvmpipe|software|basic render/i.test(renderer);
}

/** What exceeds the targets, as sentences for the CI log; empty when everything holds. FPS counts on a GPU only. */
export function exceedances(r: DeviceReport): string[] {
  const out: string[] = [];
  if (isGpu(r.renderer)) {
    for (const stage of r.stages) {
      if (stage.targetFps === null || !stage.runs.length) continue;
      const s = summarize(stage);
      // a 60 Hz loop never reports exactly 60: allow half a frame per second of jitter
      if (s.avgFps < stage.targetFps - 0.5) out.push(`${r.device}: enemy phase at CPU ${stage.cpuSlowdown}× averages ${s.avgFps} FPS (target ${stage.targetFps})`);
    }
  }
  if (r.coldStart.coldStartMs > TARGETS.coldStartMs) out.push(`${r.device}: cold start ${r.coldStart.coldStartMs} ms (target < ${TARGETS.coldStartMs} ms)`);
  return out;
}

/** Values before story 7.7, per device and CPU slowdown (tests/perf/baseline.json). */
export interface BaselineStage {
  avgFps: number;
  p95Ms: number;
  maxMs: number;
  dropped: number;
  drawCallsAvg: number | null;
  threadMsPerFrame: number | null;
}
export interface Baseline {
  note: string;
  /** measured with a GPU (SwiftShader values are not comparable with it, so they get no baseline) */
  gpu: boolean;
  /** device → CPU slowdown ("2", "4") → values */
  devices: Record<string, Record<string, BaselineStage>>;
}

export function toBaseline(reports: readonly DeviceReport[], note: string): Baseline {
  const devices: Baseline['devices'] = {};
  for (const r of reports) {
    const stages: Record<string, BaselineStage> = {};
    for (const stage of r.stages) {
      const s = summarize(stage);
      stages[String(stage.cpuSlowdown)] = { avgFps: s.avgFps, p95Ms: s.p95Ms, maxMs: s.maxMs, dropped: s.dropped, drawCallsAvg: s.drawCallsAvg, threadMsPerFrame: s.threadMsPerFrame };
    }
    devices[r.device] = stages;
  }
  return { note, gpu: reports.some((r) => isGpu(r.renderer)), devices };
}

const num = (n: number | null | undefined): string => (n === null || n === undefined ? '–' : String(n));
/** `now (vorher before)`; without a baseline just `now` */
const versus = (now: string, before: string | undefined): string => (before === undefined ? now : `${now} (vorher ${before})`);

/** Markdown table of all devices and levels, for the job summary and the release check (story 9.14). */
export function markdown(reports: readonly DeviceReport[], note: string, baseline?: Baseline): string {
  const lines = [
    '# Leistungsmessung',
    '',
    note,
    '',
    '| Gerät (Renderer) | CPU | Ziel FPS | Ø FPS (Streuung) | p95 ms | max ms | Frames > 25 ms | Thread-CPU ms/Frame | Draw Calls Ø/max | neue Effects | Gegnerphase s | Läufe |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const r of reports) {
    for (const stage of r.stages) {
      if (!stage.runs.length) continue;
      const s = summarize(stage);
      const b = baseline && baseline.gpu === isGpu(r.renderer) ? baseline.devices[r.device]?.[String(stage.cpuSlowdown)] : undefined;
      const dc = s.drawCallsAvg === null ? '–' : `${s.drawCallsAvg}/${s.drawCallsMax}`;
      const spread = s.runs > 1 ? ` (${s.fpsMin}–${s.fpsMax})` : '';
      const cells = [
        `${r.device} (${r.renderer})`,
        `${stage.cpuSlowdown}×`,
        num(stage.targetFps),
        versus(`${s.avgFps}${spread}`, b && num(b.avgFps)),
        versus(String(s.p95Ms), b && num(b.p95Ms)),
        versus(String(s.maxMs), b && num(b.maxMs)),
        versus(`${round(s.dropped * 100)} %`, b && `${round(b.dropped * 100)} %`),
        versus(num(s.threadMsPerFrame), b && num(b.threadMsPerFrame)),
        versus(dc, b && num(b.drawCallsAvg)),
        String(s.newEffects),
        String(round(s.durationMs / 1000)),
        String(s.runs),
      ];
      lines.push(`| ${cells.join(' | ')} |`);
    }
  }
  lines.push('', '| Gerät | Kaltstart ms | Erstbesuch bis Titel ms | Brett laden ms |', '|---|---|---|---|');
  for (const r of reports) lines.push(`| ${r.device} | ${r.coldStart.coldStartMs} | ${r.coldStart.firstInstallMs} | ${Math.round(r.loadMs)} |`);
  const over = reports.flatMap(exceedances);
  lines.push('', over.length ? over.map((o) => `- ⚠ ${o}`).join('\n') : '- ✓ alle Ziele gehalten');
  return lines.join('\n') + '\n';
}
