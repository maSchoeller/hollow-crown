/**
 * Loads `.vat` files (story 7.8): the bytes come over the network on the main thread, the inflating, reading and the forward
 * kinematics of the matrix texture run in a small pool of module workers, several models at a time and while the model files load.
 * If a worker cannot be made (or fails), the same functions run on the main thread: the result is the same, only slower there.
 */
import { buildPoses, inflateVat, parseVat, toHalf, type VatData } from './vat';
import type { VatReply, VatRequest } from './vatWorker';

/** What the board needs of a loaded file: the rig, clips and sockets, and the rows of the matrix texture on request. */
export interface VatHandle {
  data: VatData;
  /** The texture rows (half float bits, `slots * 4` texels wide) and the socket table; `ibm` is in the order of `data.names`. */
  build(ibm: Float32Array, slotOf: number[], slots: number): Promise<{ half: Uint16Array; sockets: Float32Array; ms: number }>;
}

/** Counters for the perf bench: time the workers and the main thread spent on files (ms) and how many came by worker; `workers` false (bench option PERF_VATWORKER=0) keeps everything on the main thread to compare. */
export const vatLoad = { workerMs: 0, mainMs: 0, files: 0, byWorker: 0, workers: true };

let pool: Worker[] | null = null;
let poolBroken = false;
let nextId = 1;
let turn = 0;
const waiting = new Map<number, { resolve: (r: VatReply) => void; reject: (e: unknown) => void; worker: Worker }>();

function workers(): Worker[] | null {
  if (!vatLoad.workers || poolBroken || typeof Worker === 'undefined') return null;
  if (!pool) {
    try {
      const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
      pool = Array.from({ length: Math.max(1, Math.min(3, cores - 1)) }, () => {
        const w = new Worker(new URL('./vatWorker.ts', import.meta.url), { type: 'module' });
        w.onmessage = (e: MessageEvent<VatReply>) => {
          const p = waiting.get(e.data.id);
          if (!p) return;
          waiting.delete(e.data.id);
          if (e.data.type === 'failed') p.reject(new Error(e.data.message));
          else p.resolve(e.data);
        };
        w.onerror = () => {
          // a worker that cannot start or dies: everything waiting on it and everything after runs on the main thread
          poolBroken = true;
          for (const [id, p] of waiting) {
            if (p.worker === w) {
              waiting.delete(id);
              p.reject(new Error('vat worker failed'));
            }
          }
        };
        return w;
      });
    } catch {
      poolBroken = true;
      pool = null;
    }
  }
  return pool;
}

function ask(worker: Worker, id: number, request: VatRequest, transfer: Transferable[] = []): Promise<VatReply> {
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject, worker });
    worker.postMessage(request, transfer);
  });
}

/** Reads the file's bytes into a handle; null if they cannot be read as a baked animation. */
export async function loadVat(bytes: ArrayBuffer): Promise<VatHandle | null> {
  vatLoad.files++;
  const ws = workers();
  if (ws) {
    const id = nextId++;
    const worker = ws[turn++ % ws.length]!;
    try {
      const reply = await ask(worker, id, { type: 'parse', id, bytes: bytes.slice(0) }, []);
      if (reply.type === 'parsed') {
        vatLoad.byWorker++;
        vatLoad.workerMs += reply.ms;
        const meta = reply.meta;
        return {
          data: meta,
          build: async (ibm, slotOf, slots) => {
            try {
              const r = await ask(worker, id, { type: 'build', id, ibm, slotOf, slots });
              if (r.type !== 'built') throw new Error('vat: unexpected reply');
              vatLoad.workerMs += r.ms;
              return { half: r.half, sockets: r.sockets, ms: r.ms };
            } catch {
              return buildOnMain(bytes, ibm, slotOf, slots);
            }
          },
        };
      }
    } catch {
      /* fall through to the main thread */
    }
  }
  try {
    const t0 = performance.now();
    const data = parseVat(await inflateVat(bytes));
    vatLoad.mainMs += performance.now() - t0;
    return { data, build: async (ibm, slotOf, slots) => withRows(data, ibm, slotOf, slots) };
  } catch {
    return null;
  }
}

function withRows(data: VatData, ibm: Float32Array, slotOf: number[], slots: number) {
  const t0 = performance.now();
  const poses = buildPoses(data, slotOf, slots, ibm);
  const half = toHalf(poses.matrices);
  const ms = performance.now() - t0;
  vatLoad.mainMs += ms;
  return { half, sockets: poses.sockets, ms };
}

async function buildOnMain(bytes: ArrayBuffer, ibm: Float32Array, slotOf: number[], slots: number) {
  return withRows(parseVat(await inflateVat(bytes)), ibm, slotOf, slots);
}
