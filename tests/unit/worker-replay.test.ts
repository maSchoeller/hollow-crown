/**
 * Story 2.8, AC 2: a battle replayed with the enemy phase going through the worker protocol (structured clone in
 * both directions, `handleRequest`) ends in the same state with the same events as without a worker. Vitest has no
 * `Worker`, so the second half of the file wires the real worker module (src/worker/core.worker.ts) and the real
 * client (src/app/coreWorker.ts) to a stand-in `Worker` that copies messages like a browser does.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { loadContentFromDisk } from '../../src/content/node';
import {
  addToRoster,
  applyCommand,
  autoplay,
  beginBattle,
  newCampaign,
  replayBattle,
  type BattleState,
  type GameData,
  type GameEvent,
} from '../../src/core';
import { handleRequest } from '../../src/worker/handle';
import type { WorkerRequest, WorkerResponse } from '../../src/worker/protocol';

let data: GameData;
const avatar = { name: 'Rhen', pronoun: 'they', portrait: 'avatar_a', affinity: 'wind' } as const;
const FIRST = 'prologue';

/** Opening state of a node with the companions who joined before it, deployed (as `pnpm sim` does). */
function opening(nodeId: string, seed = 11): BattleState {
  const c = newCampaign(data, seed, { difficulty: 'normal', deathMode: 'standard' }, avatar);
  const order = data.campaign.nodes.map((n) => n.id);
  const idx = order.indexOf(nodeId);
  for (const ch of Object.values(data.chars)) {
    const j = order.indexOf(ch.joins);
    if (j >= 0 && j < idx) addToRoster(data, c, ch.id);
  }
  c.completed = order.slice(0, idx);
  return beginBattle(data, c, nodeId, c.roster.map((u) => u.id)).state;
}

beforeAll(() => {
  data = loadContentFromDisk().data;
});

describe('the worker protocol carries a battle (structured clone)', () => {
  it('keeps a battle state unchanged through structuredClone (plain JSON)', () => {
    const s = opening(FIRST);
    expect(structuredClone(s)).toEqual(s);
    const r = applyCommand(data, s, { type: 'endPhase' });
    expect(structuredClone(r.events)).toEqual(r.events);
    expect(structuredClone(r.state)).toEqual(r.state);
  });

  for (const map of ['prologue_caravan', 'ch01_varnhold', 'ch02_silverbrook']) {
    it(`replays ${map} to the same state and events, enemy phases through handleRequest`, () => {
      const node = data.campaign.nodes.find((n) => n.map === map)!;
      const start = opening(node.id);
      const played = autoplay(data, start);
      expect(played.log.filter((c) => c.type === 'endPhase').length).toBeGreaterThan(1);

      let s = start;
      const events: GameEvent[] = [];
      let id = 1;
      for (const cmd of played.log) {
        if (cmd.type === 'endPhase') {
          const req: WorkerRequest = structuredClone({ id: id++, kind: 'apply', packs: [], state: s, command: cmd });
          const res: WorkerResponse = structuredClone(handleRequest(data, req));
          expect(res.id).toBe(req.id);
          if (!res.ok) throw new Error(res.error);
          s = res.state;
          events.push(...res.events);
        } else {
          const r = applyCommand(data, s, cmd);
          s = r.state;
          events.push(...r.events);
        }
      }
      expect(s).toEqual(replayBattle(data, start, played.log));
      expect(s).toEqual(played.state);
      expect(events).toEqual(played.events);
    });
  }

  it('answers a refused command with the code of the core error and leaves the state alone', () => {
    const s = opening(FIRST);
    const before = structuredClone(s);
    const req: WorkerRequest = { id: 5, kind: 'apply', packs: [], state: s, command: { type: 'move', unit: 'nobody', to: [0, 0] } };
    const res = structuredClone(handleRequest(data, req));
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.id).toBe(5);
    expect(res.code).toBeTruthy();
    expect(res.error).toContain(res.code!);
    expect(s).toEqual(before);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// client + worker module, joined by a stand-in for `Worker`

type Listener = (ev: never) => void;
type Scope = { onmessage: ((ev: { data: WorkerRequest }) => void) | null; postMessage(m: WorkerResponse): void };

/** What a browser `Worker` does with messages: structured clone in both directions, delivered asynchronously. */
class FakeWorker {
  static instances: FakeWorker[] = [];
  static mode: 'ok' | 'crash' | 'silent' | 'garbage' | 'throwOnStart' = 'ok';
  static scope: Scope | null = null;
  terminated = false;
  private listeners: Record<string, Listener[]> = {};

  constructor() {
    if (FakeWorker.mode === 'throwOnStart') throw new Error('Worker blocked');
    FakeWorker.instances.push(this);
    // the worker module posts its answers to its own `self`
    FakeWorker.scope!.postMessage = (m) => setTimeout(() => this.emit('message', { data: structuredClone(m) }), 0);
  }
  addEventListener(type: string, fn: Listener) {
    (this.listeners[type] ??= []).push(fn);
  }
  removeEventListener(type: string, fn: Listener) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((f) => f !== fn);
  }
  private emit(type: string, ev: unknown) {
    for (const f of this.listeners[type] ?? []) (f as (e: unknown) => void)(ev);
  }
  postMessage(req: WorkerRequest) {
    const copy = structuredClone(req);
    if (FakeWorker.mode === 'crash') return void setTimeout(() => this.emit('error', { message: 'boom' }), 0);
    if (FakeWorker.mode === 'garbage') return void setTimeout(() => this.emit('messageerror', {}), 0);
    if (FakeWorker.mode === 'silent') return;
    setTimeout(() => FakeWorker.scope!.onmessage?.({ data: copy }), 0);
  }
  terminate() {
    this.terminated = true;
  }
}

async function loadClient() {
  vi.resetModules();
  FakeWorker.instances = [];
  FakeWorker.mode = 'ok';
  vi.stubGlobal('Worker', FakeWorker);
  // the app side first, then a second module graph for the worker side, so each has its own content registry
  const client = await import('../../src/app/coreWorker');
  const browser = await import('../../src/content/browser');
  const packs = await import('virtual:hc-packs');
  vi.resetModules();
  FakeWorker.scope = { onmessage: null, postMessage: () => undefined };
  vi.stubGlobal('self', FakeWorker.scope);
  await import('../../src/worker/core.worker');
  return { client, browser, packs };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('core worker client (src/app/coreWorker.ts) with the real worker module', () => {
  it('computes the enemy phase in the worker; the result equals the synchronous one', async () => {
    const c = await loadClient();
    const s = opening(FIRST);
    const expected = applyCommand(data, s, { type: 'endPhase' });
    const got = await c.client.applyCommandInWorker(data, s, { type: 'endPhase' });
    expect(FakeWorker.instances).toHaveLength(1);
    expect(got).toEqual(expected);
  });

  it('loads the pack of the battle (act 1 maps) inside the worker before it answers', async () => {
    const c = await loadClient();
    c.browser.registerPackContent('act1', await c.packs.loaders.act1!());
    const node = data.campaign.nodes.find((n) => n.map === 'ch02_silverbrook')!;
    const s = opening(node.id);
    const expected = applyCommand(data, s, { type: 'endPhase' });
    expect(await c.client.applyCommandInWorker(data, s, { type: 'endPhase' })).toEqual(expected);
  });

  it('plays a whole battle with every enemy phase in the worker to the same end as the synchronous replay', async () => {
    const c = await loadClient();
    const start = opening(FIRST);
    const played = autoplay(data, start);
    let s = start;
    for (const cmd of played.log) s = cmd.type === 'endPhase' ? (await c.client.applyCommandInWorker(data, s, cmd)).state : applyCommand(data, s, cmd).state;
    expect(s).toEqual(played.state);
    expect(FakeWorker.instances).toHaveLength(1); // one worker for the session
  });

  it('answers requests one after the other', async () => {
    const c = await loadClient();
    const s = opening(FIRST);
    const a = c.client.applyCommandInWorker(data, s, { type: 'endPhase' });
    const b = c.client.applyCommandInWorker(data, s, { type: 'endPhase' });
    expect(await a).toEqual(await b);
  });

  it('rejects with a CoreInvariantError when the core refuses the command (fault screen, as when synchronous)', async () => {
    const c = await loadClient();
    const s = opening(FIRST);
    const err = await c.client.applyCommandInWorker(data, s, { type: 'move', unit: 'nobody', to: [0, 0] }).catch((e) => e);
    // resetModules gave the client its own copy of the class, so compare by shape
    expect(err).toMatchObject({ name: 'CoreInvariantError', code: 'invalid_command' });
    expect(FakeWorker.instances[0]!.terminated).toBe(false); // a rule error is not a worker failure
  });

  for (const mode of ['crash', 'garbage', 'silent'] as const) {
    it(`falls back to the main thread when the worker ${mode === 'silent' ? 'does not answer' : mode === 'crash' ? 'crashes' : 'sends an unreadable message'}`, async () => {
      vi.useFakeTimers();
      const c = await loadClient();
      FakeWorker.mode = mode;
      const s = opening(FIRST);
      const p = c.client.applyCommandInWorker(data, s, { type: 'endPhase' });
      await vi.advanceTimersByTimeAsync(c.client.WORKER_TIMEOUT_MS + 10);
      expect(await p).toEqual(applyCommand(data, s, { type: 'endPhase' }));
      expect(FakeWorker.instances[0]!.terminated).toBe(true);
      // the session stays on the main thread: no second worker
      const again = c.client.applyCommandInWorker(data, s, { type: 'endPhase' });
      await vi.advanceTimersByTimeAsync(10);
      await again;
      expect(FakeWorker.instances).toHaveLength(1);
    });
  }

  it('falls back when a worker cannot be created', async () => {
    const c = await loadClient();
    FakeWorker.mode = 'throwOnStart';
    const s = opening(FIRST);
    expect(await c.client.applyCommandInWorker(data, s, { type: 'endPhase' })).toEqual(applyCommand(data, s, { type: 'endPhase' }));
  });

  it('runs synchronously where Worker does not exist (tests, old browsers)', async () => {
    const c = await loadClient();
    vi.unstubAllGlobals();
    expect('Worker' in globalThis).toBe(false);
    const s = opening(FIRST);
    expect(await c.client.applyCommandInWorker(data, s, { type: 'endPhase' })).toEqual(applyCommand(data, s, { type: 'endPhase' }));
    await expect(c.client.applyCommandInWorker(data, s, { type: 'move', unit: 'nobody', to: [0, 0] })).rejects.toMatchObject({ name: 'CoreInvariantError', code: 'invalid_command' });
  });
});
