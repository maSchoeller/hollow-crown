/**
 * Baked vertex animation of the board's figures (story 7.8). tools/art/bake_vat.py writes, per image-to-3D figure, a `.vat`
 * file with the local pose of every joint for each of the clips' rows at 60 fps (quaternions as half floats, the root's
 * translation as float) and the rig that goes with it. The file is a gzip stream (the transfer size does not depend on the host).
 *
 * This module is pure (no Babylon, no DOM): it reads the file, picks the row of a clip at a time, and works out by forward
 * kinematics the skin matrices of every row (the contents of the vertex animation texture) and the placement of the hand
 * sockets (weapons) at every row. Everything is defined in glTF terms, so the matrices are what Babylon's skeleton computes for
 * the same pose: `world(joint) x inverseBind(joint)`, stored in glTF's column-major order, which is Babylon's row-major one of
 * its row-vector matrices.
 */

export interface VatClip {
  name: string;
  /** first row of the clip in the tables */
  first: number;
  rows: number;
  loop: boolean;
}

export interface VatSocket {
  name: string;
  /** joint the socket hangs below */
  joint: number;
  t: [number, number, number];
  /** local rotation (x y z w) */
  q: [number, number, number, number];
  /** local scale: the weapon library's frame is in board units, the armature above the joints scales */
  s: [number, number, number];
}

export interface VatData {
  fps: number;
  rows: number;
  names: string[];
  /** parent joint per joint, -1 for the root */
  parent: Int16Array;
  /** rest pose of every joint: translation (x3), rotation (x4) */
  restT: Float32Array;
  restQ: Float32Array;
  /** inverse bind matrices, 16 floats each as the glTF accessor holds them */
  ibm: Float32Array;
  sockets: VatSocket[];
  clips: Map<string, VatClip>;
  /** local rotations (x y z w), row-major: [row][joint][4] */
  rotations: Float32Array;
  /** the root joint's local translation per row */
  translations: Float32Array;
  /** joints in an order that has parents first */
  order: Int16Array;
  root: number;
}

const MAGIC = 0x54564348; // 'HCVT' read little endian

/** Float of a half float (IEEE 754 binary16). */
export function halfToFloat(h: number): number {
  const e = (h >> 10) & 31;
  const f = h & 1023;
  const s = h & 32768 ? -1 : 1;
  if (e === 0) return s * f * 2 ** -24;
  if (e === 31) return f ? NaN : s * Infinity;
  return s * (1 + f / 1024) * 2 ** (e - 15);
}

const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer);

/** Half float bits of a float (round to nearest; values beyond 65504 saturate to infinity, subnormals are kept). */
export function floatToHalf(v: number): number {
  f32[0] = v;
  const x = u32[0]!;
  const sign = (x >>> 16) & 0x8000;
  const exp = (x >>> 23) & 0xff;
  const man = x & 0x7fffff;
  if (exp === 255) return sign | 0x7c00 | (man ? 0x200 : 0);
  const e = exp - 127 + 15;
  if (e >= 31) return sign | 0x7c00;
  if (e <= 0) {
    if (e < -10) return sign;
    const m = (man | 0x800000) >> (1 - e);
    return sign | ((m + 0x1000) >> 13);
  }
  // rounding may carry into the exponent, which is the correct result
  return sign | ((e << 10) + ((man + 0x1000) >> 13));
}

let halves: Float32Array | null = null;
/** Float of every half float bit pattern, built once. */
function halfTable(): Float32Array {
  if (!halves) {
    halves = new Float32Array(65536);
    for (let h = 0; h < 65536; h++) halves[h] = halfToFloat(h);
  }
  return halves;
}

/** Reads a decompressed `.vat` file. Throws on anything unexpected, so a damaged file never reaches the renderer. */
export function parseVat(buf: Uint8Array): VatData {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (buf.length < 20 || dv.getUint32(0, true) !== MAGIC) throw new Error('vat: bad magic');
  if (dv.getUint16(4, true) !== 1) throw new Error(`vat: unsupported version ${dv.getUint16(4, true)}`);
  const fps = dv.getUint16(6, true);
  const J = dv.getUint16(8, true);
  const S = dv.getUint16(10, true);
  const C = dv.getUint16(12, true);
  const layout = dv.getUint16(14, true);
  const R = dv.getUint32(16, true);
  if (layout !== 0 || !fps || !J || !R) throw new Error('vat: unsupported layout');
  let o = 20;
  const text = new TextDecoder();
  const name = (): string => {
    const n = dv.getUint8(o++);
    const s = text.decode(buf.subarray(o, o + n));
    o += n;
    return s;
  };
  const floats = (n: number): number[] => {
    const out: number[] = [];
    for (let i = 0; i < n; i++, o += 4) out.push(dv.getFloat32(o, true));
    return out;
  };
  const names: string[] = [];
  const parent = new Int16Array(J);
  const restT = new Float32Array(J * 3);
  const restQ = new Float32Array(J * 4);
  const ibm = new Float32Array(J * 16);
  for (let j = 0; j < J; j++) {
    names.push(name());
    parent[j] = dv.getInt16(o, true);
    o += 2;
    restT.set(floats(3), j * 3);
    restQ.set(floats(4), j * 4);
    floats(3); // rest scale: the joints keep their size (checked by the baker)
    ibm.set(floats(16), j * 16);
  }
  const sockets: VatSocket[] = [];
  for (let s = 0; s < S; s++) {
    const n = name();
    const joint = dv.getInt16(o, true);
    o += 2;
    const v = floats(10);
    sockets.push({ name: n, joint, t: [v[0]!, v[1]!, v[2]!], q: [v[3]!, v[4]!, v[5]!, v[6]!], s: [v[7]!, v[8]!, v[9]!] });
  }
  const clips = new Map<string, VatClip>();
  for (let c = 0; c < C; c++) {
    const n = name();
    const first = dv.getUint32(o, true);
    const rows = dv.getUint32(o + 4, true);
    const flags = dv.getUint8(o + 8);
    o += 9;
    if (first + rows > R || !rows) throw new Error(`vat: clip ${n} lies outside the rows`);
    clips.set(n, { name: n, first, rows, loop: (flags & 1) === 1 });
  }
  o += -o & 3;
  if (buf.length < o + R * J * 8 + R * 12) throw new Error('vat: truncated');
  const rotations = new Float32Array(R * J * 4);
  const table = halfTable();
  for (let j = 0; j < J; j++)
    for (let c = 0; c < 4; c++) {
      // planar and byte shuffled: R low bytes, then R high bytes
      const lo = o;
      const hi = o + R;
      for (let r = 0; r < R; r++) rotations[(r * J + j) * 4 + c] = table[buf[lo + r]! | (buf[hi + r]! << 8)]!;
      o += R * 2;
    }
  const translations = new Float32Array(R * 3);
  for (let i = 0; i < R * 3; i++, o += 4) translations[i] = dv.getFloat32(o, true);
  // parents first
  const order: number[] = [];
  const seen = new Uint8Array(J);
  const visit = (j: number, depth: number): void => {
    if (seen[j]) return;
    if (depth > J) throw new Error('vat: the joints form a loop');
    if (parent[j]! >= 0) visit(parent[j]!, depth + 1);
    seen[j] = 1;
    order.push(j);
  };
  for (let j = 0; j < J; j++) visit(j, 0);
  const roots = [...parent].filter((p) => p < 0).length;
  if (roots !== 1) throw new Error('vat: expected one root joint');
  return { fps, rows: R, names, parent, restT, restQ, ibm, sockets, clips, rotations, translations, order: Int16Array.from(order), root: [...parent].indexOf(-1) };
}

/** The file's bytes (a gzip stream) as the decompressed ones; the browsers' `DecompressionStream` does it without a library. */
export async function inflateVat(bytes: ArrayBuffer): Promise<Uint8Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Row of a clip `seconds` after it started (at `speed` times its rate). A loop wraps around, anything else stays on its last row.
 * The same rule serves every figure, so the walk cycle and the idle loop stay in step with the time the board gives them.
 */
export function clipRow(clip: VatClip, seconds: number, fps: number, speed = 1): number {
  // a hair above the product, so that 12 key frames at 5 rows each do not land one row short through rounding
  const n = Math.floor(seconds * speed * fps + 1e-6);
  if (clip.loop) return clip.first + (((n % clip.rows) + clip.rows) % clip.rows);
  return clip.first + Math.min(Math.max(n, 0), clip.rows - 1);
}

export interface VatPoses {
  /** skin matrices, `slots * 16` floats per row (a joint's matrix at slot `slotOf[joint]`, unused slots identity) */
  matrices: Float32Array;
  slots: number;
  /** per row and socket: position (x y z) and rotation (x y z w) of the socket below the armature, 7 floats */
  sockets: Float32Array;
}

/**
 * Forward kinematics of every row. `slotOf[joint]` is the column of the joint in the animation texture (the index the
 * vertices carry in their joint attribute). Joints keep their rest scale (the baker checks that it is 1).
 * `ibm`: the inverse bind matrices to multiply with, 16 floats per joint of the file in the order of the glTF accessor. The
 * default is the file's own, which belong to the raw glTF; the shipped model was quantized by gltfpack, which folds the
 * quantization of the vertex positions into the inverse binds, so the renderer passes those of the loaded model.
 */
export function buildPoses(v: VatData, slotOf: ArrayLike<number>, slots: number, ibm: ArrayLike<number> = v.ibm): VatPoses {
  const J = v.names.length;
  const S = v.sockets.length;
  const matrices = new Float32Array(v.rows * slots * 16);
  const sockets = new Float32Array(v.rows * S * 7);
  // identity in every slot first
  for (let r = 0; r < v.rows; r++)
    for (let s = 0; s < slots; s++) {
      const b = (r * slots + s) * 16;
      matrices[b] = matrices[b + 5] = matrices[b + 10] = matrices[b + 15] = 1;
    }
  const Rw = new Float64Array(J * 9); // world rotation of each joint (row-major 3x3), then its position
  const Tw = new Float64Array(J * 3);
  const rot = new Float64Array(9);
  const wr = new Float64Array(9);
  for (let r = 0; r < v.rows; r++) {
    for (let k = 0; k < J; k++) {
      const j = v.order[k]!;
      const q = (r * J + j) * 4;
      let x = v.rotations[q]!;
      let y = v.rotations[q + 1]!;
      let z = v.rotations[q + 2]!;
      let w = v.rotations[q + 3]!;
      const n = 1 / Math.hypot(x, y, z, w);
      x *= n;
      y *= n;
      z *= n;
      w *= n;
      rotationOf(x, y, z, w, rot);
      const t0 = j === v.root ? v.translations[r * 3]! : v.restT[j * 3]!;
      const t1 = j === v.root ? v.translations[r * 3 + 1]! : v.restT[j * 3 + 1]!;
      const t2 = j === v.root ? v.translations[r * 3 + 2]! : v.restT[j * 3 + 2]!;
      const p = v.parent[j]!;
      const m = j * 9;
      if (p < 0) {
        for (let i = 0; i < 9; i++) Rw[m + i] = rot[i]!;
        Tw[j * 3] = t0;
        Tw[j * 3 + 1] = t1;
        Tw[j * 3 + 2] = t2;
      } else {
        const a = p * 9;
        for (let i = 0; i < 3; i++)
          for (let c = 0; c < 3; c++) Rw[m + i * 3 + c] = Rw[a + i * 3]! * rot[c]! + Rw[a + i * 3 + 1]! * rot[3 + c]! + Rw[a + i * 3 + 2]! * rot[6 + c]!;
        Tw[j * 3] = Rw[a]! * t0 + Rw[a + 1]! * t1 + Rw[a + 2]! * t2 + Tw[p * 3]!;
        Tw[j * 3 + 1] = Rw[a + 3]! * t0 + Rw[a + 4]! * t1 + Rw[a + 5]! * t2 + Tw[p * 3 + 1]!;
        Tw[j * 3 + 2] = Rw[a + 6]! * t0 + Rw[a + 7]! * t1 + Rw[a + 8]! * t2 + Tw[p * 3 + 2]!;
      }
      // skin = world x inverseBind; the accessor holds each matrix column by column: element (i, c) is at 4 c + i
      const f = j * 16;
      const o = (r * slots + slotOf[j]!) * 16;
      for (let c = 0; c < 3; c++)
        for (let i = 0; i < 3; i++)
          matrices[o + c * 4 + i] = Rw[m + i * 3]! * ibm[f + c * 4]! + Rw[m + i * 3 + 1]! * ibm[f + c * 4 + 1]! + Rw[m + i * 3 + 2]! * ibm[f + c * 4 + 2]!;
      for (let i = 0; i < 3; i++)
        matrices[o + 12 + i] = Rw[m + i * 3]! * ibm[f + 12]! + Rw[m + i * 3 + 1]! * ibm[f + 13]! + Rw[m + i * 3 + 2]! * ibm[f + 14]! + Tw[j * 3 + i]!;
    }
    for (let s = 0; s < S; s++) {
      const k = v.sockets[s]!;
      const m = k.joint * 9;
      const o = (r * S + s) * 7;
      for (let i = 0; i < 3; i++) sockets[o + i] = Rw[m + i * 3]! * k.t[0] + Rw[m + i * 3 + 1]! * k.t[1] + Rw[m + i * 3 + 2]! * k.t[2] + Tw[k.joint * 3 + i]!;
      // world rotation of the joint x the socket's local rotation
      rotationOf(k.q[0], k.q[1], k.q[2], k.q[3], rot);
      for (let i = 0; i < 3; i++) for (let c = 0; c < 3; c++) wr[i * 3 + c] = Rw[m + i * 3]! * rot[c]! + Rw[m + i * 3 + 1]! * rot[3 + c]! + Rw[m + i * 3 + 2]! * rot[6 + c]!;
      quaternionOf(wr, sockets, o + 3);
    }
  }
  return { matrices, slots, sockets };
}

/** Rotation matrix (row-major 3x3) of a unit quaternion. */
function rotationOf(x: number, y: number, z: number, w: number, out: Float64Array): void {
  out[0] = 1 - 2 * (y * y + z * z);
  out[1] = 2 * (x * y - z * w);
  out[2] = 2 * (x * z + y * w);
  out[3] = 2 * (x * y + z * w);
  out[4] = 1 - 2 * (x * x + z * z);
  out[5] = 2 * (y * z - x * w);
  out[6] = 2 * (x * z - y * w);
  out[7] = 2 * (y * z + x * w);
  out[8] = 1 - 2 * (x * x + y * y);
}

/** Unit quaternion (x y z w) of a rotation matrix (row-major 3x3), written to `out[at..at+3]`. */
function quaternionOf(m: Float64Array, out: Float32Array, at: number): void {
  const tr = m[0]! + m[4]! + m[8]!;
  let x: number, y: number, z: number, w: number;
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2;
    w = s / 4;
    x = (m[7]! - m[5]!) / s;
    y = (m[2]! - m[6]!) / s;
    z = (m[3]! - m[1]!) / s;
  } else if (m[0]! > m[4]! && m[0]! > m[8]!) {
    const s = Math.sqrt(1 + m[0]! - m[4]! - m[8]!) * 2;
    w = (m[7]! - m[5]!) / s;
    x = s / 4;
    y = (m[1]! + m[3]!) / s;
    z = (m[2]! + m[6]!) / s;
  } else if (m[4]! > m[8]!) {
    const s = Math.sqrt(1 + m[4]! - m[0]! - m[8]!) * 2;
    w = (m[2]! - m[6]!) / s;
    x = (m[1]! + m[3]!) / s;
    y = s / 4;
    z = (m[5]! + m[7]!) / s;
  } else {
    const s = Math.sqrt(1 + m[8]! - m[0]! - m[4]!) * 2;
    w = (m[3]! - m[1]!) / s;
    x = (m[2]! + m[6]!) / s;
    y = (m[5]! + m[7]!) / s;
    z = s / 4;
  }
  const n = 1 / Math.hypot(x, y, z, w);
  out[at] = x * n;
  out[at + 1] = y * n;
  out[at + 2] = z * n;
  out[at + 3] = w * n;
}

/** Half float bits of every value (for a half float texture). */
export function toHalf(values: Float32Array): Uint16Array {
  const out = new Uint16Array(values.length);
  for (let i = 0; i < values.length; i++) out[i] = floatToHalf(values[i]!);
  return out;
}
