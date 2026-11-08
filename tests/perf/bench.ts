/**
 * Bench page of the performance run (story 7.5), built only with `vite build --mode perf`: the real board renders the
 * reference battle (benchMap.ts) and plays one complete enemy phase; `window.__bench` returns the frame
 * times. `prepare()` loads the battle, `enemyPhase()` is the measured part, so the runner can read the thread's CPU time
 * (CDP) around it. Playwright (tests/perf/perf.spec.ts) drives it with the reference device profile.
 * Story 7.8: `enemyPhase()` also traces every frame slower than `TRACE_MS` (what ran in it: figures switched on, shader
 * variants, garbage collection, layout) so the cause of a spike is shown, not guessed.
 */
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import { loadContent } from '../../src/content/browser';
import { addToRoster, applyCommand, createBattle, levelUp, newCampaign, startBattle, type BattleState, type MapDef } from '../../src/core';
import { mapSchema } from '../../src/content/schemaMap';
import type { Season } from '../../src/core/defs';
import { setLocales } from '../../src/i18n';
import { loadPack } from '../../src/packs/load';
import { BoardView } from '../../src/render/board/board';
import { vatBuild } from '../../src/render/shared/models';
import { vatLoad } from '../../src/render/shared/vatLoader';
import { parseLookParam } from '../../src/render/shared/look';
import { BENCH_MAP_ID, benchMap } from './benchMap';
import { classify, type Spike } from './report';
import { TARGETS } from './profile';

export interface PreparedBattle {
  units: number;
  /** time from the first board frame until the board is ready (models loaded) */
  loadMs: number;
  /** WebGL renderer string: shows whether a GPU or software rendering (SwiftShader) drew the frames */
  renderer: string;
  /** baked animation textures the board made at load (story 7.8): models, main thread time of the texture upload (ms), texture memory (KB), time the workers spent (ms), files a worker read */
  vat: { models: number; ms: number; kb: number; workerMs: number; byWorker: number };
}

export interface EnemyPhaseResult {
  events: number;
  /** wall time of the enemy phase playback */
  durationMs: number;
  /** story 15.11: wall time per event type (from one event to the next, the last one to the end of the playback), ms */
  byEvent: Record<string, number>;
  /** time between consecutive animation frames during the playback */
  frames: number[];
  /** draw calls per rendered frame (Babylon counter), if readable */
  drawCalls: number[];
  /** shader variants compiled during the playback */
  newEffects: number;
  /** every animation frame slower than `TARGETS.traceMs`, with what the board and the browser did around it (story 7.8) */
  spikes: Spike[];
  /** the AI's working-out of the phase before the playback, ms (not part of the frames) */
  aiMs: number;
  /** how each shader variant compiled during the playback differs from the closest earlier one (diagnosis, story 7.8) */
  newEffectInfo: string[];
  /** garbage collections seen in the playback (a drop of the JS heap of 256 KB or more between two frames) and the memory they freed, KB */
  gcEvents: number;
  gcFreedKb: number;
  /** style and layout work of all long animation frames in the playback, ms */
  layoutMs: number;
}

/** `look`: time of day and weather of the bench map, e.g. `night,rain` (story 8.6, env PERF_LOOK of the runner); none: the map as it is.
 * `warm`: overrides `board.warm` of render.yaml (story 7.8, env PERF_WARM): 0 = shaders as before 7.8, 1 = + flash/fade variants, 2 = + warm-up draw (the default).
 * `vat`: overrides `board.vat` (env PERF_VAT): false = every figure plays its skeleton, to compare the two paths.
 * `vatWorker`: false (env PERF_VATWORKER=0) = the baked animations are read and worked out on the main thread, not in workers.
 * `map` (story 15.11, env PERF_LARGE): a level draft of `concept/27-ueberarbeitung/levels/` instead of the reference battle, played
 * with the company of the act at node `m1_6` deployed in full and every foe set to advance (the worst case of a phase).
 * `march`: foes that only walk go together (option „Gegnerzüge: Gemeinsam“); off = one by one as before 15.11.
 * `state` (story 15.11, env PERF_PHASE): a battle of the act at the start of its enemy phase (`tools/phase-state.ts`), played as it is.
 * `budget`: false plays that phase without the time budget of `render.yaml aiPace` (as before), to compare.
 * `whole`: the phase is watched on the zoom step "whole map" (the overview of story 15.11) instead of the opening view
 * `season`: the board in that season (story 15.15: autumn ground, snow ground and snow caps), else the map's own */
type Options = { quality?: 'low' | 'mid' | 'high'; figures?: '3d' | '2d'; speed?: number; look?: string; warm?: 0 | 1 | 2; vat?: boolean; vatWorker?: boolean; map?: string; march?: boolean; whole?: boolean; season?: Season; state?: BattleState; budget?: boolean };

/** the level drafts (story 15.11), parsed on demand; only the perf build has them */
const drafts = import.meta.glob('../../concept/27-ueberarbeitung/levels/*.yaml');

/** A level draft with every foe on the advance (profile `aggressive`, no wake-up trigger), for the worst case of an enemy phase. */
async function draftMap(id: string): Promise<MapDef> {
  const load = drafts[`../../concept/27-ueberarbeitung/levels/${id}.yaml`];
  if (!load) throw new Error(`no level draft ${id}`);
  const map = mapSchema.parse(((await load()) as { default: unknown }).default) as MapDef;
  return { ...map, id: BENCH_MAP_ID, act: 1, units: map.units.map((u) => (u.team === 'enemy' ? { ...u, ai: { profile: 'aggressive' as const } } : u)) } as MapDef;
}

let prepared: { board: BoardView; data: ReturnType<typeof loadContent>['data']; state: ReturnType<typeof startBattle>['state'] } | null = null;

/** Babylon's compiled shader variants (private field of the engine) */
type CompiledEffect = { name: unknown; defines: string | null };
const compiled = (board: BoardView): Record<string, CompiledEffect> => (board.engine as unknown as { _compiledEffects: Record<string, CompiledEffect> })._compiledEffects;
const effectCount = (board: BoardView): number => Object.keys(compiled(board)).length;

const defineTokens = (e: CompiledEffect): Set<string> => new Set((e.defines ?? '').split('\n').map((s) => s.replace('#define ', '').trim()).filter(Boolean));
const nameOf = (e: CompiledEffect): string => (typeof e.name === 'string' ? e.name : JSON.stringify(e.name));

/**
 * What the shader variants compiled since `before` differ in from the closest variant of the same shader that existed
 * before: `+X` = a define it has and the closest lacks, `-X` = the reverse. Shows which material setting made the variant.
 */
function describeNewEffects(board: BoardView, before: ReadonlySet<string>): string[] {
  const all = compiled(board);
  const old = Object.entries(all).filter(([k]) => before.has(k));
  return Object.entries(all)
    .filter(([k]) => !before.has(k))
    .map(([, e]) => {
      const mine = defineTokens(e);
      let best: { name: string; tokens: Set<string>; common: number } | null = null;
      for (const [, o] of old) {
        if (nameOf(o) !== nameOf(e)) continue;
        const tokens = defineTokens(o);
        const common = [...mine].filter((t) => tokens.has(t)).length;
        if (!best || common > best.common) best = { name: nameOf(o), tokens, common };
      }
      if (!best) return `${nameOf(e).slice(0, 80)}: no earlier variant of this shader`;
      const plus = [...mine].filter((t) => !best!.tokens.has(t));
      const minus = [...best.tokens].filter((t) => !mine.has(t));
      return `${nameOf(e).slice(0, 80)}: ${[...plus.map((t) => '+' + t), ...minus.map((t) => '-' + t)].join(' ') || '(same defines)'}`;
    });
}

/** Loads the reference battle onto the board and lets textures and shaders settle. The measurement starts with `enemyPhase`. */
async function prepare(opts: Options = {}): Promise<PreparedBattle> {
  const loaded = loadContent();
  setLocales(loaded.locales);
  await loadPack('act1').catch(() => undefined); // models and sprites resolve without it; content is not needed
  const data = loaded.data;
  if (opts.budget === false) data.render.aiPace.maxBoost = 1;
  if (opts.state) return prepareBoard(data, opts.state, opts);
  data.maps[BENCH_MAP_ID] = { ...(opts.map ? await draftMap(opts.map) : benchMap()), ...parseLookParam(opts.look ?? null), ...(opts.season ? { season: opts.season } : {}) };
  const nodes = data.acts[1]!.nodes;
  // a draft is played at the place of 1-6 in the act: who has joined by then and their level (as `__hc.devNode` does)
  const at = opts.map ? nodes.findIndex((n) => n.id === 'm1_6') : 0;
  if (at < 0) throw new Error('the campaign has no node m1_6 to take the company from');
  if (!nodes.some((n) => n.id === 'perf')) {
    nodes.push({ ...nodes[Math.max(0, at)]!, id: 'perf', map: BENCH_MAP_ID, pre: undefined, post: undefined });
  }
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  let deploy: string[] = [];
  if (opts.map && at > 0) {
    const order = nodes.map((n) => n.id);
    for (const ch of Object.values(data.chars)) {
      const j = order.indexOf(ch.joins);
      if (j >= 0 && j < at) addToRoster(data, c, ch.id);
    }
    for (const u of c.roster) while (u.level < nodes[at]!.expectedLevel) levelUp(data, u, c.rng);
    c.completed = order.slice(0, at);
    deploy = c.roster.map((u) => u.id).slice(0, data.maps[BENCH_MAP_ID]!.deploy.max);
  }
  return prepareBoard(data, startBattle(data, createBattle(data, c, 'perf', deploy)).state, opts);
}

/** Puts the battle on a new board, lets textures and shaders settle and keeps it for the measurement. */
async function prepareBoard(data: ReturnType<typeof loadContent>['data'], state: BattleState, opts: Options): Promise<PreparedBattle> {
  if (!data.maps[state.mapId]) throw new Error(`no map ${state.mapId} in the loaded content`);
  const board = new BoardView(document.getElementById('board') as HTMLDivElement, document.getElementById('float') as HTMLDivElement, data, {});
  board.quality = opts.quality ?? 'mid';
  board.figures = opts.figures ?? '3d';
  board.speed = opts.speed ?? 1;
  board.march = opts.march ?? false;
  if (opts.warm !== undefined) data.render.board.warm = opts.warm;
  if (opts.vat !== undefined) data.render.board.vat = opts.vat;
  vatBuild.models = vatBuild.ms = vatBuild.bytes = 0;
  if (opts.vatWorker !== undefined) vatLoad.workers = opts.vatWorker;
  vatLoad.workerMs = vatLoad.mainMs = vatLoad.files = vatLoad.byWorker = 0;
  const t0 = performance.now();
  await board.load(state);
  const loadMs = performance.now() - t0;
  if (opts.whole) board.wholeMap(true);
  // let textures settle before measuring
  await new Promise((r) => setTimeout(r, 1500));
  prepared = { board, data, state };
  return { units: state.units.length, loadMs, renderer: board.engine.getGlInfo().renderer, vat: { models: vatBuild.models, ms: Math.round(vatBuild.ms), kb: Math.round(vatBuild.bytes / 1024), workerMs: Math.round(vatLoad.workerMs), byWorker: vatLoad.byWorker } };
}

/** One call of `board.frame`, recorded for the trace. */
interface HostFrame {
  start: number;
  ms: number;
  renderMs: number;
  newEnabled: number;
  effects: number;
  heapFreedKb: number;
}

/** Used JS heap, bytes (Chromium; the runner starts it with precise memory info), 0 where unknown. */
const heapUsed = (): number => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;

/** The enemy phase worked out by the core (events and final state), waiting for `enemyPhase()` to play it. */
let planned: { events: ReturnType<typeof applyCommand>['events']; state: ReturnType<typeof applyCommand>['state']; aiMs: number } | null = null;

/**
 * Works out the enemy phase (the AI of all enemies, `applyCommand`) and lets the page settle two animation frames. The AI is a
 * stall of its own (NFR3, `pnpm bench:ai`) before the board plays anything; measured inside the playback it showed up as the
 * first frame of 450 to 1750 ms and as thread time per frame (story 7.8, frame trace of run A). Returns its duration.
 */
async function startEnemyPhase(): Promise<{ aiMs: number }> {
  if (!prepared) throw new Error('prepare() first');
  const { data, state } = prepared;
  const t0 = performance.now();
  const result = applyCommand(data, state, { type: 'endPhase' });
  const aiMs = performance.now() - t0;
  planned = { events: result.events, state: result.state, aiMs };
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return { aiMs };
}

/** Plays the enemy phase worked out by `startEnemyPhase()` and returns the frame times and the trace of the slow frames. */
async function enemyPhase(): Promise<EnemyPhaseResult> {
  if (!prepared || !planned) throw new Error('prepare() and startEnemyPhase() first');
  const { board } = prepared;
  const result = planned;
  planned = null;
  const frames: number[] = [];
  const stamps: Array<[number, number]> = []; // [frame timestamp, previous frame timestamp]
  const drawCalls: number[] = [];
  // the instrumentation starts a new count every frame; without it Babylon's draw call counter only grows
  const instrumentation = new SceneInstrumentation(board.scene);
  const obs = board.scene.onAfterRenderObservable.add(() => drawCalls.push(instrumentation.drawCallsCounter.current));

  // frame trace: the board's own frame call (time, render part, figures switched on, shader variants, heap) and the browser's long tasks
  const hostFrames: HostFrame[] = [];
  let renderStart = 0;
  let renderMs = 0;
  const before = board.scene.onBeforeRenderObservable.add(() => (renderStart = performance.now()));
  const after = board.scene.onAfterRenderObservable.add(() => (renderMs = performance.now() - renderStart));
  const skinned = board.scene.meshes.filter((m) => m.skeleton);
  const wasOn = new Map(skinned.map((m) => [m, m.isEnabled(false)]));
  const originalFrame = board.frame.bind(board);
  let lastHeap = heapUsed();
  board.frame = (now: number) => {
    const t = performance.now();
    renderMs = 0;
    const heap0 = heapUsed();
    originalFrame(now);
    const ms = performance.now() - t;
    let newEnabled = 0;
    for (const m of skinned) {
      const on = m.isEnabled(false);
      if (on && !wasOn.get(m)) newEnabled++;
      wasOn.set(m, on);
    }
    const heap = heapUsed();
    hostFrames.push({ start: t, ms, renderMs, newEnabled, effects: effectCount(board), heapFreedKb: Math.max(0, Math.round((Math.max(lastHeap, heap0) - heap) / 1024)) });
    lastHeap = heap;
  };
  const longTasks: Array<{ start: number; ms: number }> = [];
  const layouts: Array<{ start: number; end: number; ms: number }> = [];
  const observers: PerformanceObserver[] = [];
  const observe = (type: string, fn: (e: PerformanceEntry) => void) => {
    try {
      const o = new PerformanceObserver((list) => list.getEntries().forEach(fn));
      o.observe({ type, buffered: false });
      observers.push(o);
    } catch {
      /* the browser does not know this entry type */
    }
  };
  observe('longtask', (e) => longTasks.push({ start: e.startTime, ms: e.duration }));
  observe('long-animation-frame', (e) => {
    const f = e as PerformanceEntry & { styleAndLayoutStart?: number };
    const ls = f.styleAndLayoutStart ?? 0;
    if (ls > 0) layouts.push({ start: e.startTime, end: e.startTime + e.duration, ms: e.startTime + e.duration - ls });
  });

  const effects0 = effectCount(board);
  const effectKeys0 = new Set(Object.keys(compiled(board)));
  let running = true;
  let last = performance.now();
  const tick = (now: number) => {
    frames.push(now - last);
    stamps.push([now, last]);
    last = now;
    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame((now) => {
    last = now;
    requestAnimationFrame(tick);
  });
  // the board notes every event it plays (`notePhase`): the time until the next one is that event's
  const eventStamps: Array<[string, number]> = [];
  // (a march run is noted once, at its first turn: its time counts under `aiTurn`)
  type Note = (ev: typeof result.events, n: number, ...rest: unknown[]) => void;
  const note = (board as unknown as { notePhase: Note }).notePhase.bind(board);
  (board as unknown as { notePhase: Note }).notePhase = (ev, n, ...rest) => {
    eventStamps.push([ev[n]!.t, performance.now()]);
    note(ev, n, ...rest);
  };
  const p0 = performance.now();
  await board.play(result.events, result.state);
  const durationMs = performance.now() - p0;
  const byEvent: Record<string, number> = {};
  eventStamps.forEach(([t, at], i) => (byEvent[t] = (byEvent[t] ?? 0) + Math.round((eventStamps[i + 1]?.[1] ?? p0 + durationMs) - at)));
  running = false;
  // the observers deliver their entries asynchronously
  await new Promise((r) => setTimeout(r, 100));
  for (const o of observers) o.disconnect();
  board.frame = originalFrame;
  board.scene.onAfterRenderObservable.remove(obs);
  board.scene.onBeforeRenderObservable.remove(before);
  board.scene.onAfterRenderObservable.remove(after);
  instrumentation.dispose();

  // a long interval between two animation frames is caused by what ran in it: the host frames, long tasks and layout inside it
  const spikes: Spike[] = [];
  stamps.forEach(([now, prev], i) => {
    const dt = frames[i]!;
    if (dt <= TARGETS.traceMs) return;
    // animation frame timestamps and performance.now() share a time base; the callback of the previous frame starts at about `prev`
    const inside = hostFrames.filter((h) => h.start >= prev - 4 && h.start < now - 4);
    const slowest = inside.reduce<HostFrame | null>((a, h) => (!a || h.ms > a.ms ? h : a), null);
    const first = inside[0];
    const effectsBefore = first ? (hostFrames[hostFrames.indexOf(first) - 1]?.effects ?? effects0) : effects0;
    const lt = longTasks.filter((t) => t.start < now && t.start + t.ms > prev);
    const lay = layouts.filter((l) => l.start < now && l.end > prev);
    const spike: Spike = {
      atMs: Math.round(now - p0),
      dtMs: Math.round(dt),
      frameMs: Math.round(slowest?.ms ?? 0),
      renderMs: Math.round(slowest?.renderMs ?? 0),
      newEnabled: inside.reduce((n, h) => n + h.newEnabled, 0),
      newEffects: (inside[inside.length - 1]?.effects ?? effectsBefore) - effectsBefore,
      heapFreedKb: inside.reduce((n, h) => n + h.heapFreedKb, 0),
      layoutMs: Math.round(lay.reduce((m, l) => Math.max(m, l.ms), 0)),
      longTaskMs: Math.round(lt.reduce((m, t) => Math.max(m, t.ms), 0)),
      causes: [],
    };
    spike.causes = classify(spike);
    spikes.push(spike);
  });
  return { events: result.events.length, durationMs, byEvent, frames, drawCalls, newEffects: effectCount(board) - effects0, spikes, aiMs: result.aiMs, newEffectInfo: describeNewEffects(board, effectKeys0),
    gcEvents: hostFrames.filter((h) => h.heapFreedKb >= 256).length,
    gcFreedKb: hostFrames.reduce((n, h) => n + (h.heapFreedKb >= 256 ? h.heapFreedKb : 0), 0),
    layoutMs: Math.round(layouts.reduce((n, l) => n + l.ms, 0)),
  };
}

export interface CastleResult {
  loadMs: number;
  renderer: string;
  /** time between consecutive animation frames while the camera glides over the castle */
  frames: number[];
  drawCalls: number;
  meshes: number;
  vertices: number;
}

/**
 * The 3D castle of the home (story 15.11): every room at its highest level, walls and keep at the highest tier, smoke and fire
 * burning; the camera glides from side to side for `ms` while the frames are counted (the castle always draws, story 10.x).
 */
async function castle(opts: { quality?: 'low' | 'mid' | 'high'; ms?: number } = {}): Promise<CastleResult> {
  const loaded = loadContent();
  setLocales(loaded.locales);
  await loadPack('act1').catch(() => undefined);
  const { CastleView, CASTLE_ROOMS } = await import('../../src/render/home/castle');
  const view = new CastleView(document.getElementById('board') as HTMLDivElement, loaded.data, { onRoom: () => undefined }, opts.quality ?? 'mid');
  const t0 = performance.now();
  if (!(await view.build())) throw new Error('the castle model did not load');
  for (const id of CASTLE_ROOMS) view.setLevel(id, 3);
  view.setTier(3);
  const loadMs = performance.now() - t0;
  await new Promise((r) => setTimeout(r, 1500));
  // the pan is the player's drag; the bench moves it like a slow drag across the castle
  const pan = view as unknown as { panX: number };
  const frames: number[] = [];
  const ms = opts.ms ?? 6000;
  await new Promise<void>((resolve) => {
    let last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (last) frames.push(now - last);
      last = now;
      pan.panX = Math.sin(((now - start) / ms) * Math.PI * 2) * 12;
      if (now - start < ms) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  const stats = view.stats();
  return { loadMs, renderer: (view as unknown as { host: { engine: { getGlInfo(): { renderer: string } } } }).host.engine.getGlInfo().renderer, frames, drawCalls: stats.drawCalls, meshes: stats.meshes, vertices: stats.vertices };
}

(window as unknown as { __bench: { prepare: typeof prepare; startEnemyPhase: typeof startEnemyPhase; enemyPhase: typeof enemyPhase; castle: typeof castle } }).__bench = { prepare, startEnemyPhase, enemyPhase, castle };
document.body.dataset.ready = '1';
