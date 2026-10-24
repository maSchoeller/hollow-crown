/**
 * Client of the core worker (architecture §5.13, AR14, story 2.8). One worker for the whole session, created on the
 * first request; one request at a time (later ones queue). The worker computes `applyCommand` for a command the
 * main thread would otherwise need a long time for (the enemy phase of a large battle) and answers with the new state
 * and the events. Without `Worker`, or when the worker fails (load error, crash, unreadable message, no answer in
 * time), the same request runs on the main thread through the same `handleRequest`: state and events are identical,
 * because the rules and the RNG in the state are the same.
 */
import { packs as builtPacks } from 'virtual:hc-packs';
import { CoreInvariantError, type ApplyResult, type BattleState, type Command, type GameData } from '../core';
import { isPackRegistered } from '../content/browser';
import { handleRequest } from '../worker/handle';
import type { WorkerRequest, WorkerResponse } from '../worker/protocol';
import { log } from './log';

/**
 * How long the worker may take before the main thread repeats the request. Not a game value: the enemy phase of the
 * large reference battle takes well under a second even on a phone, so this only catches a worker that hangs.
 */
export const WORKER_TIMEOUT_MS = 30_000;

let worker: Worker | null = null;
/** after a failure the session stays on the main thread (a worker that crashed once is not trusted again) */
let disabled = false;
let nextId = 1;
/** requests wait here so only one is with the worker at a time */
let tail: Promise<unknown> = Promise.resolve();

/** Packs the worker has to register for a request: every loaded content pack with maps or scenes (no voice packs). */
function loadedPacks(): string[] {
  return builtPacks.filter((p) => p.id !== 'core' && !p.lang && isPackRegistered(p.id)).map((p) => p.id);
}

function stop(reason: string, detail?: unknown): void {
  log.warn('worker', `core worker failed, computing on the main thread (${reason})`, detail);
  disabled = true;
  worker?.terminate();
  worker = null;
}

/** Sends one request to the worker; resolves with its answer, or `null` when the worker failed (it is then switched off). */
function ask(req: WorkerRequest): Promise<WorkerResponse | null> {
  return new Promise((resolve) => {
    let w: Worker;
    try {
      if (!worker) {
        worker = new Worker(new URL('../worker/core.worker.ts', import.meta.url), { type: 'module' });
        // a failure between two requests (script gone after an update, crash): the next request goes to the main thread
        worker.addEventListener('error', (ev) => stop('error', ev.message));
      }
      w = worker;
    } catch (e) {
      stop('cannot start', e);
      return resolve(null);
    }
    const done = (res: WorkerResponse | null) => {
      clearTimeout(timer);
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      w.removeEventListener('messageerror', onMessageError);
      resolve(res);
    };
    const onMessage = (ev: MessageEvent<WorkerResponse>) => {
      if (ev.data.id === req.id) done(ev.data);
    };
    const onError = (ev: ErrorEvent) => {
      stop('error', ev.message);
      done(null);
    };
    const onMessageError = () => {
      stop('unreadable message');
      done(null);
    };
    const timer = setTimeout(() => {
      stop('timeout');
      done(null);
    }, WORKER_TIMEOUT_MS);
    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.addEventListener('messageerror', onMessageError);
    w.postMessage(req);
  });
}

async function serve(data: GameData, state: BattleState, command: Command): Promise<ApplyResult> {
  const req: WorkerRequest = { id: nextId++, kind: 'apply', packs: loadedPacks(), state, command };
  let res: WorkerResponse | null = null;
  if (!disabled && typeof Worker !== 'undefined') {
    res = await ask(req);
    // `ok: false` without a code: the worker itself broke (content, bug); the main thread repeats the request and
    // meets the same error if it is a genuine one
    if (res && !res.ok && !res.code) {
      log.warn('worker', `core worker could not answer, computing on the main thread: ${res.error}`);
      res = null;
    }
  }
  res ??= handleRequest(data, req);
  if (res.ok) return { state: res.state, events: res.events };
  if (res.code) throw new CoreInvariantError(res.code, res.details);
  throw new Error(res.error);
}

/**
 * `applyCommand(data, state, command)` in the worker. Rejects with a `CoreInvariantError` when the core refuses the
 * command, exactly as the synchronous call throws. `data` is only used by the main-thread fallback.
 */
export function applyCommandInWorker(data: GameData, state: BattleState, command: Command): Promise<ApplyResult> {
  const result = tail.then(() => serve(data, state, command));
  tail = result.catch(() => undefined);
  return result;
}
