/**
 * Messages between the app and the core worker (architecture §5.13, AR14). Everything is plain JSON, so structured
 * clone carries it; no functions, `Map`s or class instances. A new kind of request gets a member of `WorkerRequest`
 * and a synchronous fallback in `handleRequest` (architecture §8.5).
 */
import type { BattleState, Command, GameEvent } from '../core';

export interface WorkerRequest {
  /** counter of the client; the answer carries the same number */
  id: number;
  kind: 'apply';
  /** content packs (other than core) the command needs, e.g. the pack that holds the battle's map */
  packs: string[];
  state: BattleState;
  command: Command;
}

export type WorkerResponse =
  | { id: number; ok: true; state: BattleState; events: GameEvent[] }
  /**
   * `error` is the message. `code` and `details` are set when the core refused the command with a
   * `CoreInvariantError` (a rule violation; the app shows the fault screen). Without `code` the worker itself
   * failed (content did not load, a bug): the app then repeats the request on the main thread.
   */
  | { id: number; ok: false; error: string; code?: string; details?: Record<string, unknown> };
