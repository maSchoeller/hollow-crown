/**
 * The one function behind a request: the worker (core.worker.ts) and the synchronous fallback of the app
 * (src/app/coreWorker.ts) both call it, so a battle plays out the same with or without a worker. Pure: the game data
 * comes in as a parameter, the answer is plain data.
 */
import { applyCommand, CoreInvariantError, type GameData } from '../core';
import type { WorkerRequest, WorkerResponse } from './protocol';

export function handleRequest(data: GameData, req: WorkerRequest): WorkerResponse {
  try {
    const r = applyCommand(data, req.state, req.command);
    return { id: req.id, ok: true, state: r.state, events: r.events };
  } catch (e) {
    if (e instanceof CoreInvariantError) return { id: req.id, ok: false, error: e.message, code: e.code, ...(e.details ? { details: e.details } : {}) };
    return { id: req.id, ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
