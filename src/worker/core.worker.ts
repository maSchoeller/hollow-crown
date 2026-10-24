/**
 * The core in a Web Worker (architecture §5.13, AR14): the enemy phase of a large battle runs here, so the main thread
 * keeps drawing. The worker builds its own `GameData` from the same content modules as the app: core from the bundle,
 * the packs of a request through the loaders of `virtual:hc-packs` (it must not import `src/packs`, layer rule).
 * A request is answered once its packs are registered; requests are served one after the other.
 */
import { loaders } from 'virtual:hc-packs';
import { isPackRegistered, loadContent, registerPackContent } from '../content/browser';
import { handleRequest } from './handle';
import type { WorkerRequest, WorkerResponse } from './protocol';

async function serve(req: WorkerRequest): Promise<WorkerResponse> {
  try {
    const { data } = loadContent();
    for (const id of req.packs) {
      if (isPackRegistered(id)) continue;
      const load = loaders[id];
      if (!load) throw new Error(`pack ${id} is not in this build`);
      registerPackContent(id, await load());
    }
    return handleRequest(data, req);
  } catch (e) {
    return { id: req.id, ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

let queue: Promise<void> = Promise.resolve();
self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  queue = queue.then(async () => self.postMessage(await serve(ev.data)));
};
