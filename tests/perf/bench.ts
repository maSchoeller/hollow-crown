/**
 * Bench page of the performance run (story 7.5), built only with `vite build --mode perf`: the real board renders the
 * reference battle (benchMap.ts) and plays one complete enemy phase; `window.__bench.enemyPhase()` returns the frame
 * times. Playwright (tests/perf/perf.spec.ts) drives it with the reference device profile.
 */
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import { loadContent } from '../../src/content/browser';
import { applyCommand, createBattle, newCampaign, startBattle } from '../../src/core';
import { setLocales } from '../../src/i18n';
import { loadPack } from '../../src/packs/load';
import { BoardView } from '../../src/render/board/board';
import { BENCH_MAP_ID, benchMap } from './benchMap';

export interface EnemyPhaseResult {
  units: number;
  events: number;
  /** time from the first board frame until the board is ready (models loaded, s) */
  loadMs: number;
  /** wall time of the enemy phase playback */
  durationMs: number;
  /** time between consecutive animation frames during the playback */
  frames: number[];
  /** draw calls per rendered frame (Babylon counter), if readable */
  drawCalls: number[];
  /** WebGL renderer string: shows whether a GPU or software rendering (SwiftShader) drew the frames */
  renderer: string;
}

async function enemyPhase(opts: { quality?: 'low' | 'mid' | 'high'; figures?: '3d' | '2d'; speed?: number } = {}): Promise<EnemyPhaseResult> {
  const loaded = loadContent();
  setLocales(loaded.locales);
  await loadPack('act1').catch(() => undefined); // models and sprites resolve without it; content is not needed
  const data = loaded.data;
  data.maps[BENCH_MAP_ID] = benchMap();
  const first = data.campaign.nodes[0]!;
  if (!data.campaign.nodes.some((n) => n.id === 'perf')) {
    data.campaign.nodes.push({ ...first, id: 'perf', map: BENCH_MAP_ID, pre: undefined, post: undefined });
  }
  const c = newCampaign(data, 7, { difficulty: 'normal', deathMode: 'standard' }, { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' });
  const s = startBattle(data, createBattle(data, c, 'perf', [])).state;

  const board = new BoardView(document.getElementById('board') as HTMLDivElement, document.getElementById('float') as HTMLDivElement, data, {});
  board.quality = opts.quality ?? 'mid';
  board.figures = opts.figures ?? '3d';
  board.speed = opts.speed ?? 1;
  const t0 = performance.now();
  await board.load(s);
  const loadMs = performance.now() - t0;
  // let textures and shaders settle before measuring
  await new Promise((r) => setTimeout(r, 1500));

  const result = applyCommand(data, s, { type: 'endPhase' });
  const frames: number[] = [];
  const drawCalls: number[] = [];
  // the instrumentation starts a new count every frame; without it Babylon's draw call counter only grows
  const instrumentation = new SceneInstrumentation(board.scene);
  const obs = board.scene.onAfterRenderObservable.add(() => drawCalls.push(instrumentation.drawCallsCounter.current));
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
  return { units: s.units.length, events: result.events.length, loadMs, durationMs, frames, drawCalls, renderer: board.engine.getGlInfo().renderer };
}

(window as unknown as { __bench: { enemyPhase: typeof enemyPhase } }).__bench = { enemyPhase };
document.body.dataset.ready = '1';
