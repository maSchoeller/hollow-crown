/**
 * Baked vertex animation (story 7.8, src/render/shared/vat.ts): the file format of tools/art/bake_vat.py, the row of a clip at a
 * time, and the forward kinematics that turn the stored local poses into the matrices of the animation texture and the weapon sockets.
 */
import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { loadVat } from '../../src/render/shared/vatLoader';
import { buildPoses, clipRow, floatToHalf, halfToFloat, inflateVat, parseVat, toHalf, type VatData } from '../../src/render/shared/vat';

interface Spec {
  names: string[];
  parent: number[];
  restT: number[][];
  restQ: number[][];
  ibm: number[][];
  sockets: { name: string; joint: number; t: number[]; q: number[]; s: number[] }[];
  clips: { name: string; first: number; rows: number; loop: boolean }[];
  /** [row][joint] quaternions and the root translation per row */
  rotations: number[][][];
  translations: number[][];
}

/** Writes a `.vat` file the way tools/art/bake_vat.py does (see its docstring). */
function encode(spec: Spec): Uint8Array {
  const parts: number[] = [];
  const u8 = (v: number) => parts.push(v & 255);
  const u16 = (v: number) => (u8(v), u8(v >> 8));
  const u32 = (v: number) => (u16(v), u16(v >>> 16));
  const f32 = (v: number) => {
    const b = new Uint8Array(new Float32Array([v]).buffer);
    parts.push(...b);
  };
  const str = (s: string) => (u8(s.length), [...s].forEach((c) => u8(c.charCodeAt(0))));
  [0x48, 0x43, 0x56, 0x54].forEach(u8);
  u16(1);
  u16(60);
  u16(spec.names.length);
  u16(spec.sockets.length);
  u16(spec.clips.length);
  u16(0);
  u32(spec.rotations.length);
  spec.names.forEach((n, j) => {
    str(n);
    u16(spec.parent[j]! & 0xffff);
    spec.restT[j]!.forEach(f32);
    spec.restQ[j]!.forEach(f32);
    [1, 1, 1].forEach(f32);
    spec.ibm[j]!.forEach(f32);
  });
  for (const k of spec.sockets) {
    str(k.name);
    u16(k.joint);
    [...k.t, ...k.q, ...k.s].forEach(f32);
  }
  for (const c of spec.clips) {
    str(c.name);
    u32(c.first);
    u32(c.rows);
    u8(c.loop ? 1 : 0);
  }
  while (parts.length % 4) u8(0);
  const R = spec.rotations.length;
  for (let j = 0; j < spec.names.length; j++)
    for (let c = 0; c < 4; c++) {
      const half = spec.rotations.map((row) => floatToHalf(row[j]![c]!));
      half.forEach((h) => u8(h & 255));
      half.forEach((h) => u8(h >> 8));
    }
  for (let r = 0; r < R; r++) spec.translations[r]!.forEach(f32);
  return Uint8Array.from(parts);
}

const IDENTITY_Q = [0, 0, 0, 1];
const quatZ = (deg: number) => [0, 0, Math.sin((deg * Math.PI) / 360), Math.cos((deg * Math.PI) / 360)];

/**
 * A three joint chain (root at (0, 1, 0), child 1 up from it, child 2 up again), glTF column-major inverse binds of the rest
 * pose (a pure translation each), a socket on the last joint, three clips.
 */
function chain(rows: number[][][], translations: number[][], clips: Spec['clips']): Spec {
  const trans = (x: number, y: number, z: number) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
  return {
    names: ['root', 'mid', 'tip'],
    parent: [-1, 0, 1],
    restT: [[0, 1, 0], [0, 1, 0], [0, 1, 0]],
    restQ: [IDENTITY_Q, IDENTITY_Q, IDENTITY_Q],
    // world of the rest pose: root y 1, mid y 2, tip y 3; the inverse binds undo them
    ibm: [trans(0, -1, 0), trans(0, -2, 0), trans(0, -3, 0)],
    sockets: [{ name: 'socket_r', joint: 2, t: [0, 0.5, 0], q: IDENTITY_Q, s: [1.25, 1.25, 1.25] }],
    clips,
    rotations: rows,
    translations,
  };
}

const rest = (): number[][] => [IDENTITY_Q, IDENTITY_Q, IDENTITY_Q];

describe('half floats', () => {
  it('round trip the values the baker stores', () => {
    for (const v of [0, 1, -1, 0.5, 0.123, -0.707, 1e-4, 65504]) {
      expect(halfToFloat(floatToHalf(v))).toBeCloseTo(v, v === 65504 ? 0 : 3);
    }
    expect(halfToFloat(floatToHalf(1e6))).toBe(Infinity);
    expect(toHalf(new Float32Array([1, -2]))).toEqual(Uint16Array.from([0x3c00, 0xc000]));
  });
});

describe('parseVat', () => {
  const clips = [
    { name: 'idle', first: 0, rows: 2, loop: true },
    { name: 'attack', first: 2, rows: 3, loop: false },
    { name: 'downed', first: 5, rows: 1, loop: false },
  ];
  const rows = [rest(), rest(), rest(), rest(), rest(), rest()];
  const spec = chain(rows, rows.map(() => [0, 1, 0]), clips);

  it('reads header, rig, sockets and clips', () => {
    const v = parseVat(encode(spec));
    expect(v.fps).toBe(60);
    expect(v.rows).toBe(6);
    expect(v.names).toEqual(['root', 'mid', 'tip']);
    expect([...v.parent]).toEqual([-1, 0, 1]);
    expect(v.root).toBe(0);
    expect([...v.order]).toEqual([0, 1, 2]);
    expect(v.sockets).toHaveLength(1);
    expect(v.sockets[0]!.s[0]).toBeCloseTo(1.25);
    expect([...v.clips.keys()]).toEqual(['idle', 'attack', 'downed']);
    expect(v.clips.get('attack')).toEqual({ name: 'attack', first: 2, rows: 3, loop: false });
  });

  it('puts parents first whatever the joint order of the file', () => {
    const swapped: Spec = { ...spec, names: ['tip', 'mid', 'root'], parent: [1, 2, -1], restT: spec.restT, restQ: spec.restQ, ibm: [...spec.ibm].reverse(), sockets: [{ ...spec.sockets[0]!, joint: 0 }], rotations: rows.map(() => rest()) };
    const v = parseVat(encode(swapped));
    expect([...v.order]).toEqual([2, 1, 0]);
    expect(v.root).toBe(2);
  });

  it('rejects damaged files', () => {
    const bytes = encode(spec);
    expect(() => parseVat(bytes.subarray(0, 30))).toThrow();
    expect(() => parseVat(bytes.subarray(0, bytes.length - 8))).toThrow(/truncated/);
    const bad = Uint8Array.from(bytes);
    bad[0] = 0;
    expect(() => parseVat(bad)).toThrow(/magic/);
    const loops = Uint8Array.from(bytes);
    new DataView(loops.buffer).setInt16(20 + 1 + 4, 0, true); // the root names itself its parent: no root joint is left
    expect(() => parseVat(loops)).toThrow();
  });

  it('inflates the gzip stream of the file', async () => {
    const bytes = encode(spec);
    const packed = gzipSync(bytes);
    const out = await inflateVat(packed.buffer.slice(packed.byteOffset, packed.byteOffset + packed.byteLength));
    expect([...out]).toEqual([...bytes]);
  });
});

describe('loadVat without a worker', () => {
  it('reads the file and works out the rows on the main thread (the fallback of the worker pool)', async () => {
    const clips = [{ name: 'idle', first: 0, rows: 2, loop: true }];
    const turned = [IDENTITY_Q, quatZ(90), IDENTITY_Q];
    const bytes = encode(chain([rest(), turned], [[0, 1, 0], [0, 1, 0]], clips));
    const packed = gzipSync(bytes);
    const handle = await loadVat(packed.buffer.slice(packed.byteOffset, packed.byteOffset + packed.byteLength));
    expect(handle).not.toBeNull();
    expect(handle!.data.names).toEqual(['root', 'mid', 'tip']);
    const ibm = Float32Array.from(handle!.data.ibm);
    const built = await handle!.build(ibm, [0, 1, 2], 3);
    const direct = buildPoses(parseVat(bytes), [0, 1, 2], 3, ibm);
    expect([...built.half]).toEqual([...toHalf(direct.matrices)]);
    expect([...built.sockets]).toEqual([...direct.sockets]);
    expect(await loadVat(new Uint8Array([1, 2, 3]).buffer)).toBeNull();
  });
});

describe('clipRow', () => {
  const loop = { name: 'idle', first: 10, rows: 120, loop: true };
  const once = { name: 'attack', first: 200, rows: 31, loop: false };

  it('walks the rows at the file rate and wraps a loop', () => {
    expect(clipRow(loop, 0, 60)).toBe(10);
    expect(clipRow(loop, 1 / 60, 60)).toBe(11);
    expect(clipRow(loop, 1.5, 60)).toBe(10 + 90);
    expect(clipRow(loop, 2, 60)).toBe(10); // 120 rows = 2 s: back at the first row
    expect(clipRow(loop, 2 + 1 / 60, 60)).toBe(11);
  });

  it('does not lose a row to rounding at the key frames', () => {
    // the key frames of the board's clips lie 5 rows apart (12 fps keys, 60 fps rows)
    for (let k = 0; k <= 6; k++) expect(clipRow(once, k / 12, 60)).toBe(200 + 5 * k);
  });

  it('stays on the last row of a clip that does not loop, and scales with the speed', () => {
    expect(clipRow(once, 0.5, 60)).toBe(230);
    expect(clipRow(once, 5, 60)).toBe(230);
    expect(clipRow(once, -1, 60)).toBe(200);
    expect(clipRow(once, 0.25, 60, 1.6)).toBe(200 + 24);
    expect(clipRow(once, 1, 60, 1.6)).toBe(230);
  });
});

describe('buildPoses', () => {
  const identityAt = (m: Float32Array, o: number) => {
    const id = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    id.forEach((x, i) => expect(m[o + i]).toBeCloseTo(x, 5));
  };
  const clips = [{ name: 'idle', first: 0, rows: 3, loop: true }];

  it('turns the rest pose into identity matrices, in the slots asked for', () => {
    const v = parseVat(encode(chain([rest(), rest(), rest()], [[0, 1, 0], [0, 1, 0], [0, 1, 0]], clips)));
    const p = buildPoses(v, [2, 0, 1], 4);
    expect(p.slots).toBe(4);
    expect(p.matrices).toHaveLength(3 * 4 * 16);
    for (let r = 0; r < 3; r++) for (let s = 0; s < 4; s++) identityAt(p.matrices, (r * 4 + s) * 16);
  });

  it('follows a rotation down the chain (row-major of Babylon = column-major of glTF)', () => {
    // row 1: the middle joint turns 90 degrees about z; the tip, one unit above it, swings to the side
    const turned = [IDENTITY_Q, quatZ(90), IDENTITY_Q];
    const v = parseVat(encode(chain([rest(), turned, rest()], [[0, 1, 0], [0, 1, 0], [0, 1, 0]], clips)));
    const p = buildPoses(v, [0, 1, 2], 3);
    const tip = (1 * 3 + 2) * 16;
    // a point of the mesh at the tip's rest position (0, 3, 0) lands at (-1, 2, 0): the mid joint (0, 2, 0) is the pivot
    const m = p.matrices;
    const at = (x: number, y: number, z: number) => [0, 1, 2].map((i) => m[tip + i]! * x + m[tip + 4 + i]! * y + m[tip + 8 + i]! * z + m[tip + 12 + i]!);
    const out = at(0, 3, 0);
    expect(out[0]).toBeCloseTo(-1, 3);
    expect(out[1]).toBeCloseTo(2, 3);
    expect(out[2]).toBeCloseTo(0, 3);
    // the root and the mid joint's lower neighbours are unmoved
    identityAt(p.matrices, (1 * 3 + 0) * 16);
  });

  it('moves the root with its translation row and carries the sockets along', () => {
    const v = parseVat(encode(chain([rest(), rest(), rest()], [[0, 1, 0], [2, 1, 0], [0, 1, 0]], clips)));
    const p = buildPoses(v, [0, 1, 2], 3);
    // row 1: the root stands two units to the side, so the root's skin matrix is a translation by two
    const root = (1 * 3 + 0) * 16;
    expect(p.matrices[root + 12]).toBeCloseTo(2, 5);
    // the socket sits 0.5 above the tip's world position (0, 3, 0) in row 0 and two units right of it in row 1
    expect([...p.sockets.slice(0, 3)]).toEqual([0, 3.5, 0].map((x) => expect.closeTo(x, 5)));
    expect(p.sockets[7]).toBeCloseTo(2, 5);
    expect(p.sockets[8]).toBeCloseTo(3.5, 5);
    // the socket turns with its joint: unit quaternion, here the rest rotation
    expect([...p.sockets.slice(3, 7)]).toEqual([0, 0, 0, 1].map((x) => expect.closeTo(x, 5)));
  });

  it('gives a socket the rotation of its joint', () => {
    const turned = [IDENTITY_Q, quatZ(90), IDENTITY_Q];
    const v = parseVat(encode(chain([turned, turned, turned], [[0, 1, 0], [0, 1, 0], [0, 1, 0]], clips)));
    const p = buildPoses(v, [0, 1, 2], 3);
    // the socket's world rotation is the turned middle joint's: 90 degrees about z
    expect([...p.sockets.slice(3, 7)]).toEqual([0, 0, Math.SQRT1_2, Math.SQRT1_2].map((x) => expect.closeTo(x, 3)));
    expect(Math.hypot(...[...p.sockets.slice(3, 7)])).toBeCloseTo(1, 5);
  });
});

/**
 * The files `pnpm art:tripo` baked, when they are there (they live in Git LFS: a checkout without them skips this).
 */
describe('baked figure files', () => {
  const file = 'art/models/units/kael.vat';
  const present = existsSync(file) && readFileSync(file).subarray(0, 2).toString('hex') === '1f8b';
  const maybe = present ? it : it.skip;

  maybe('has the clips of the board with 60 fps rows and a rig that gives identity in the rest pose', async () => {
    const buf = readFileSync(file);
    const v: VatData = parseVat(await inflateVat(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
    expect(v.fps).toBe(60);
    expect(v.names).toHaveLength(22);
    expect(v.sockets.map((s) => s.name).sort()).toEqual(['socket_l', 'socket_r']);
    // durations x 60 (+ 1 unless a loop, which leaves out the row that comes round again); downed shows its last row only
    const rows = (n: string) => v.clips.get(n)!.rows;
    expect(rows('idle')).toBe(Math.round(15.3333 * 60));
    expect(rows('walk')).toBe(Math.round((28 / 12) * 60));
    expect(rows('hit')).toBe(31);
    expect(rows('downed')).toBe(1);
    for (const a of ['attack', 'attack_cast', 'attack_chop', 'attack_shoot', 'attack_thrust']) expect(rows(a)).toBe(31);
    expect(v.clips.get('idle')!.loop).toBe(true);
    expect(v.clips.get('attack')!.loop).toBe(false);
    // the clips tile the rows without gaps
    let next = 0;
    for (const c of [...v.clips.values()].sort((a, b) => a.first - b.first)) {
      expect(c.first).toBe(next);
      next += c.rows;
    }
    expect(next).toBe(v.rows);
    // the bind pose (the rest rotations and the root's rest translation) gives the same matrix for every joint, a pure scale:
    // forward kinematics and inverse binds agree on conventions. The scale is the inverse of the armature node's (the file's
    // inverse binds include it, the node above the joints brings it back at draw time)
    const bind: VatData = {
      ...v,
      rows: 1,
      rotations: Float32Array.from(v.restQ),
      translations: Float32Array.from(v.restT.subarray(v.root * 3, v.root * 3 + 3)),
    };
    const p = buildPoses(bind, [...v.names.keys()], v.names.length);
    const scale = p.matrices[0]!;
    expect(scale).toBeGreaterThan(0.5);
    for (let j = 0; j < v.names.length; j++)
      for (let i = 0; i < 16; i++) {
        const want = i === 15 ? 1 : i % 5 === 0 ? scale : 0;
        expect(Math.abs(p.matrices[j * 16 + i]! - want)).toBeLessThan(2e-3);
      }
  });
});
