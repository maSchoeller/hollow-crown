/**
 * Worker of the baked animations (story 7.8): inflates and reads a `.vat` file and works out its matrix texture and socket table
 * by forward kinematics (src/render/shared/vat.ts), so none of it takes the main thread's time while the board loads. The main
 * thread keeps what it needs to draw (`meta`: rig, clips, sockets) and gets the rows back as half float bits to upload.
 */
import { buildPoses, inflateVat, parseVat, toHalf, type VatData } from './vat';

export interface ParseRequest {
  type: 'parse';
  id: number;
  bytes: ArrayBuffer;
}
export interface BuildRequest {
  type: 'build';
  id: number;
  ibm: Float32Array;
  slotOf: number[];
  slots: number;
}
export type VatRequest = ParseRequest | BuildRequest;

export type VatReply =
  | { type: 'parsed'; id: number; meta: VatData; ms: number }
  | { type: 'built'; id: number; half: Uint16Array; sockets: Float32Array; ms: number }
  | { type: 'failed'; id: number; message: string };

const kept = new Map<number, VatData>();

const scope = self as unknown as { postMessage(m: VatReply, transfer?: Transferable[]): void; onmessage: ((e: MessageEvent<VatRequest>) => void) | null };

scope.onmessage = async (e) => {
  const r = e.data;
  try {
    if (r.type === 'parse') {
      const t0 = performance.now();
      const data = parseVat(await inflateVat(r.bytes));
      kept.set(r.id, data);
      // the main thread draws with the rig, the clips and the sockets; the rows stay here
      scope.postMessage({ type: 'parsed', id: r.id, meta: { ...data, rotations: new Float32Array(0), translations: new Float32Array(0) }, ms: performance.now() - t0 });
    } else {
      const data = kept.get(r.id);
      if (!data) throw new Error('vat: unknown file');
      const t0 = performance.now();
      const poses = buildPoses(data, r.slotOf, r.slots, r.ibm);
      const half = toHalf(poses.matrices);
      scope.postMessage({ type: 'built', id: r.id, half, sockets: poses.sockets, ms: performance.now() - t0 }, [half.buffer, poses.sockets.buffer]);
    }
  } catch (err) {
    scope.postMessage({ type: 'failed', id: r.id, message: err instanceof Error ? err.message : String(err) });
  }
};
