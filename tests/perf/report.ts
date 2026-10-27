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

/** One slow frame of the playback and the evidence for its cause (story 7.8: frame trace in tests/perf/bench.ts). */
export interface Spike {
  /** ms since the start of the playback */
  atMs: number;
  /** time since the previous animation frame */
  dtMs: number;
  /** the longest `board.frame` call in the interval and the part of it spent in `scene.render` */
  frameMs: number;
  renderMs: number;
  /** skinned meshes that were switched on (figures entering the view) during the interval */
  newEnabled: number;
  /** shader variants compiled during the interval */
  newEffects: number;
  /** drop of the JS heap during the interval, KB (garbage collection), 0 if none */
  heapFreedKb: number;
  /** longest layout/style work of a long animation frame in the interval, ms (Chromium `long-animation-frame`) */
  layoutMs: number;
  /** duration of the longest long task in the interval, ms */
  longTaskMs: number;
  causes: string[];
}

/**
 * Names the cause of a slow frame from its trace values: shader variants compiled in it, figures switched on in it, a JS heap
 * drop of 1 MB or more (garbage collection), layout/style work of 20 ms or more, a `board.frame` that was itself slow (then the
 * render share decides: `render` = `scene.render`, `frame-js` = the board's own code), else the time went outside the frame.
 */
export function classify(s: Spike): string[] {
  const out: string[] = [];
  if (s.newEffects > 0) out.push('shader');
  if (s.newEnabled > 0) out.push('enable');
  if (s.heapFreedKb >= 1024) out.push('gc');
  if (s.layoutMs >= 20) out.push('layout');
  if (s.frameMs >= s.dtMs * 0.5) out.push(s.renderMs >= s.frameMs * 0.5 ? 'render' : 'frame-js');
  return out.length ? out : ['other'];
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
  /** frames slower than `TARGETS.traceMs` with their cause (absent in reports from before story 7.8) */
  spikes?: Spike[];
  /** the AI's working-out of the phase before the playback, ms (absent in reports from before story 7.8; earlier runs counted it into the first frame) */
  aiMs?: number;
  /** time the board took to load before this run, ms, at this level's CPU throttling (absent in reports from before story 7.8) */
  loadMs?: number;
  /** baked animation textures made at load (story 7.8): models, forward kinematics and upload time (ms) and texture memory (KB) */
  vatModels?: number;
  vatMs?: number;
  vatKb?: number;
  /** time the workers spent on the files, and how many files a worker read (the rest ran on the main thread) */
  vatWorkerMs?: number;
  vatByWorker?: number;
  /** how each shader variant compiled during the playback differs from the closest earlier variant (e.g. `+ALPHABLEND`) */
  newEffectInfo?: string[];
  /** garbage collections in the playback (heap drops of 256 KB or more between frames), the memory they freed (KB) and the layout work of long animation frames (ms) */
  gcEvents?: number;
  gcFreedKb?: number;
  layoutMs?: number;
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
  /** the slowest frame of any run (story 7.8: the 100 ms limit counts for this, not the median) */
  maxAllMs: number;
  dropped: number;
  drawCallsAvg: number | null;
  drawCallsMax: number | null;
  threadMsPerFrame: number | null;
  newEffects: number;
  durationMs: number;
  /** causes of the traced frames over all runs: cause → count */
  causes: Record<string, number>;
  /** the AI's working-out of the phase, median of the runs, ms (null: not measured) */
  aiMs: number | null;
  /** time to load the board at this level, median of the runs, ms (null: not measured) */
  loadMs: number | null;
  /** baked animation textures of the board: models, time (ms) and memory (KB), median of the runs (null: none or not measured) */
  vatModels: number | null;
  vatMs: number | null;
  vatKb: number | null;
  vatWorkerMs: number | null;
  vatByWorker: number | null;
  /** garbage collections per run, median (null: not measured) */
  gcEvents: number | null;
  /** layout work of long animation frames per run, median ms (null: not measured) */
  layoutMs: number | null;
}

const medianOrNull = (values: Array<number | null>): number | null => {
  const v = values.filter((n): n is number => n !== null);
  return v.length ? round(median(v)) : null;
};

/** How often each cause occurs among the traced frames of the runs. */
export function causeCounts(runs: readonly PhaseRun[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const run of runs) for (const s of run.spikes ?? []) for (const c of s.causes) out[c] = (out[c] ?? 0) + 1;
  return out;
}

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
    maxAllMs: r.length ? Math.max(...r.map((x) => x.maxMs)) : 0,
    dropped: round(median(r.map((x) => x.dropped)), 3),
    drawCallsAvg: medianOrNull(r.map((x) => x.drawCallsAvg)),
    drawCallsMax: medianOrNull(r.map((x) => x.drawCallsMax)),
    threadMsPerFrame: medianOrNull(r.map((x) => x.threadMsPerFrame)),
    newEffects: Math.round(median(r.map((x) => x.newEffects))),
    durationMs: Math.round(median(r.map((x) => x.durationMs))),
    causes: causeCounts(r),
    aiMs: medianOrNull(r.map((x) => x.aiMs ?? null)),
    loadMs: medianOrNull(r.map((x) => x.loadMs ?? null)),
    vatModels: medianOrNull(r.map((x) => x.vatModels ?? null)),
    vatMs: medianOrNull(r.map((x) => x.vatMs ?? null)),
    vatKb: medianOrNull(r.map((x) => x.vatKb ?? null)),
    vatWorkerMs: medianOrNull(r.map((x) => x.vatWorkerMs ?? null)),
    vatByWorker: medianOrNull(r.map((x) => x.vatByWorker ?? null)),
    gcEvents: medianOrNull(r.map((x) => x.gcEvents ?? null)),
    layoutMs: medianOrNull(r.map((x) => x.layoutMs ?? null)),
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
      // story 7.8: the slowest frame of all runs, not the median of the runs
      if (s.maxAllMs > TARGETS.maxFrameMs) out.push(`${r.device}: enemy phase at CPU ${stage.cpuSlowdown}× has a frame of ${s.maxAllMs} ms (limit ${TARGETS.maxFrameMs} ms, slowest of ${s.runs} runs)`);
    }
  }
  if (r.coldStart.coldStartMs > TARGETS.coldStartMs) out.push(`${r.device}: cold start ${r.coldStart.coldStartMs} ms (target < ${TARGETS.coldStartMs} ms)`);
  return out;
}

/** Values before story 7.8 (measured after story 8.6), per device and CPU slowdown (tests/perf/baseline.json). */
export interface BaselineStage {
  avgFps: number;
  p95Ms: number;
  maxMs: number;
  /** slowest frame of all runs (absent in baselines from before story 7.8) */
  maxAllMs?: number;
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
      stages[String(stage.cpuSlowdown)] = { avgFps: s.avgFps, p95Ms: s.p95Ms, maxMs: s.maxMs, maxAllMs: s.maxAllMs, dropped: s.dropped, drawCallsAvg: s.drawCallsAvg, threadMsPerFrame: s.threadMsPerFrame };
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
    '| Gerät (Renderer) | CPU | Ziel FPS | Ø FPS (Streuung) | p95 ms | max ms (alle Läufe) | Frames > 25 ms | Thread-CPU ms/Frame | Draw Calls Ø/max | neue Effects | Gegnerphase s | Läufe |',
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
        versus(s.runs > 1 ? `${s.maxMs} (${s.maxAllMs})` : String(s.maxMs), b && (b.maxAllMs !== undefined ? `${b.maxMs} (${b.maxAllMs})` : num(b.maxMs))),
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
  const traced = reports.flatMap((r) => r.stages.flatMap((st) => (st.runs.some((x) => x.spikes) ? [[r, st] as const] : [])));
  if (traced.length) {
    lines.push('', 'Frame-Trace (Frames > ' + TARGETS.traceMs + ' ms über alle Läufe; Ursache aus Trace: shader = neue Shadervariante, enable = Figur eingeschaltet, gc = Heap-Rückgang ≥ 1 MB, layout = Layout ≥ 20 ms, render = scene.render, frame-js = Code des Bretts, other = außerhalb von board.frame):', '', '| Gerät | CPU | Frames > ' + TARGETS.traceMs + ' ms | Ursachen (Anzahl) | größter Frame ms | Speicherbereinigungen je Lauf | Layout ms je Lauf | KI-Rechenzeit der Phase ms (vor dem Abspielen) |', '|---|---|---|---|---|---|---|---|');
    for (const [r, st] of traced) {
      const s = summarize(st);
      const n = st.runs.reduce((t, x) => t + (x.spikes?.length ?? 0), 0);
      const causes = Object.entries(s.causes).sort((a, b) => b[1] - a[1]).map(([c, k]) => `${c} ${k}`).join(', ');
      lines.push(`| ${r.device} | ${st.cpuSlowdown}× | ${n} | ${causes || '–'} | ${s.maxAllMs} | ${num(s.gcEvents)} | ${num(s.layoutMs)} | ${num(s.aiMs)} |`);
    }
  }
  // the board loads once per run, under the throttling of its level: the 4× value is the one story 7.8 bounds (+1 s)
  const loadAt = (r: DeviceReport) => r.stages.filter((st) => st.runs.length).map((st) => `${num(summarize(st).loadMs)} (${st.cpuSlowdown}×)`).join(', ');
  lines.push('', '| Gerät | Kaltstart ms | Erstbesuch bis Titel ms | Brett laden ms (Median je Stufe; Mittel aller Läufe) |', '|---|---|---|---|');
  for (const r of reports) lines.push(`| ${r.device} | ${r.coldStart.coldStartMs} | ${r.coldStart.firstInstallMs} | ${loadAt(r)}; ${Math.round(r.loadMs)} |`);
  // the baked animation textures (story 7.8): forward kinematics and upload of the models the board shows, at each level's throttling
  const vatAt = (r: DeviceReport) => r.stages.filter((st) => st.runs.length && summarize(st).vatModels).map((st) => { const s = summarize(st); return `${num(s.vatModels)} Modelle, Hauptthread ${num(s.vatMs)} ms, Worker ${num(s.vatWorkerMs)} ms (${num(s.vatByWorker)} Dateien), ${num(s.vatKb)} KB (${st.cpuSlowdown}×)`; }).join('; ');
  if (reports.some((r) => vatAt(r))) {
    lines.push('', '| Gerät | VAT beim Laden: Modelle, Hauptthread-Zeit (Texturanlage), Worker-Zeit (Entpacken, Vorwärtskinematik), Texturspeicher |', '|---|---|');
    for (const r of reports) lines.push(`| ${r.device} | ${vatAt(r) || '–'} |`);
  }
  const over = reports.flatMap(exceedances);
  lines.push('', over.length ? over.map((o) => `- ⚠ ${o}`).join('\n') : '- ✓ alle Ziele gehalten');
  return lines.join('\n') + '\n';
}
