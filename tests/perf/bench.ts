/**
 * Bench page of the performance run (story 7.5), built only with `vite build --mode perf`: the real board renders the
 * reference battle (benchMap.ts) and plays one complete enemy phase; `window.__bench` returns the frame
 * times. `prepare()` loads the battle, `enemyPhase()` is the measured part, so the runner can read the thread's CPU time
 * (CDP) around it. Playwright (tests/perf/perf.spec.ts) drives it with the reference device profile.
 */
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import { loadContent } from '../../src/content/browser';
import { applyCommand, createBattle, newCampaign, startBattle } from '../../src/core';
import { setLocales } from '../../src/i18n';
import { loadPack } from '../../src/packs/load';
import { BoardView } from '../../src/render/board/board';
import { parseLookParam } from '../../src/render/shared/look';
import { BENCH_MAP_ID, benchMap } from './benchMap';

export interface PreparedBattle {
  units: number;
  /** time from the first board frame until the board is ready (models loaded) */
  loadMs: number;
  /** WebGL renderer string: shows whether a GPU or software rendering (SwiftShader) drew the frames */
  renderer: string;
}

export interface EnemyPhaseResult {
  events: number;
  /** wall time of the enemy phase playback */
  durationMs: number;
  /** time between consecutive animation frames during the playback */
  frames: number[];
  /** draw calls per rendered frame (Babylon counter), if readable */
  drawCalls: number[];
  /** shader variants compiled during the playback */
  newEffects: number;
}

/** `look`: time of day and weather of the bench map, e.g. `night,rain` (story 8.6, env PERF_LOOK of the runner); none: the map as it is */
type Options = { quality?: 'low' | 'mid' | 'high'; figures?: '3d' | '2d'; speed?: number; look?: string };

let prepared: { board: BoardView; data: ReturnType<typeof loadContent>['data']; state: ReturnType<typeof startBattle>['state'] } | null = null;

/** Babylon's compiled shader variants (private field of the engine) */
const effectCount = (board: BoardView): number => Object.keys((board.engine as unknown as { _compiledEffects: object })._compiledEffects).length;

/** Loads the reference battle onto the board and lets textures and shaders settle. The measurement starts with `enemyPhase`. */
async function prepare(opts: Options = {}): Promise<PreparedBattle> {
  const loaded = loadContent();
  setLocales(loaded.locales);
  await loadPack('act1').catch(() => undefined); // models and sprites resolve without it; content is not needed
  const data = loaded.data;
  data.maps[BENCH_MAP_ID] = { ...benchMap(), ...parseLookParam(opts.look ?? null) };
  const first = data.campaign.nodes[0]!;
  if (!data.campaign.nodes.some((n) => n.id === 'perf')) {
    data.campaign.nodes.push({ ...first, id: 'perf', map: BENCH_MAP_ID, pre: undefined, post: undefined });
  }
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const state = startBattle(data, createBattle(data, c, 'perf', [])).state;

  const board = new BoardView(document.getElementById('board') as HTMLDivElement, document.getElementById('float') as HTMLDivElement, data, {});
  board.quality = opts.quality ?? 'mid';
  board.figures = opts.figures ?? '3d';
  board.speed = opts.speed ?? 1;
  const t0 = performance.now();
  await board.load(state);
  const loadMs = performance.now() - t0;
  // let textures settle before measuring
  await new Promise((r) => setTimeout(r, 1500));
  prepared = { board, data, state };
  return { units: state.units.length, loadMs, renderer: board.engine.getGlInfo().renderer };
}

/** Plays one complete enemy phase of the prepared battle and returns the frame times. */
async function enemyPhase(): Promise<EnemyPhaseResult> {
  if (!prepared) throw new Error('prepare() first');
  const { board, data, state } = prepared;
  const result = applyCommand(data, state, { type: 'endPhase' });
  const frames: number[] = [];
  const drawCalls: number[] = [];
  // the instrumentation starts a new count every frame; without it Babylon's draw call counter only grows
  const instrumentation = new SceneInstrumentation(board.scene);
  const obs = board.scene.onAfterRenderObservable.add(() => drawCalls.push(instrumentation.drawCallsCounter.current));
  const effects0 = effectCount(board);
  let running = true;
  let last = performance.now();
  const tick = (now: number) => {
    frames.push(now - last);
    last = now;
    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame((now) => {
    last = now;
    requestAnimationFrame(tick);
  });
  const p0 = performance.now();
  await board.play(result.events, result.state);
  const durationMs = performance.now() - p0;
  running = false;
  board.scene.onAfterRenderObservable.remove(obs);
  instrumentation.dispose();
  return { events: result.events.length, durationMs, frames, drawCalls, newEffects: effectCount(board) - effects0 };
}

(window as unknown as { __bench: { prepare: typeof prepare; enemyPhase: typeof enemyPhase } }).__bench = { prepare, enemyPhase };
document.body.dataset.ready = '1';
