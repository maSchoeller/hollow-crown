"""Hollow Crown – bake the board animations of a rigged figure into a .vat file (story 7.8, concept/24-architecture/decision-log.md).

    python tools/art/bake_vat.py <figure.raw.glb> <figure.vat>

The raw glTF is what tools/art/prepare_tripo_unit.py writes (22 joints, one skin, one animation per board animation, keys at 12 fps).
Every clip is sampled at 60 frames a second (slerp of the rotations, lerp of the hips' translation, like the glTF loader of the
board does at runtime) and written as the local pose of each joint per row: 22 quaternions (half float) plus the hips' translation
(float). The renderer builds the matrix texture of the vertex animation (src/render/shared/vat.ts) from it by forward kinematics
when the figure is loaded, and the hand sockets (weapon placement) with it. The file also carries the rig it needs for that
(joint names, parents, rest pose, inverse bind matrices, the sockets' local transforms), so the loader needs no glTF skeleton data.

File (little endian, then deflated as a gzip stream: the transfer size does not depend on how the host compresses):
    char[4] 'HCVT'   u16 version(1)   u16 fps   u16 joints J   u16 sockets S   u16 clips C   u16 layout(0)   u32 rows R
    J x   { u8 nameLen, name, i16 parent, f32 t[3], f32 q[4], f32 s[3], f32 inverseBind[16] }   rest pose is the glTF node's, the
                                                                                                   matrix as the glTF accessor holds it
    S x   { u8 nameLen, name, i16 joint, f32 t[3], f32 q[4], f32 s[3] }                          local transform below the joint
    C x   { u8 nameLen, name, u32 firstRow, u32 rows, u8 flags (1 = loops) }
    pad to 4 bytes
    rotations   f16, planar: for joint j, component c (x y z w): R values over the rows, bytes shuffled (all low bytes, then all high)
    translation f32 x 3 per row (the root joint's local translation)
Clip rows: a clip of T seconds has round(T x fps) + 1 rows (first to last key); a loop leaves out the last row (it equals the first);
`downed` keeps only its last row (the board shows the fallen pose, never the fall). Stats go to stdout as `[hc]` lines.
"""
import gzip
import json
import os
import struct
import sys

import numpy as np

FPS = 60
LOOPS = {"idle", "walk"}
LAST_ROW_ONLY = {"downed"}
MAGIC = b"HCVT"
VERSION = 1


def read_glb(path):
    with open(path, "rb") as f:
        b = f.read()
    n = struct.unpack("<I", b[12:16])[0]
    js = json.loads(b[20:20 + n])
    o = 20 + n
    bn = struct.unpack("<I", b[o:o + 4])[0]
    return js, b[o + 8:o + 8 + bn]


def accessor(js, bin_, i):
    a = js["accessors"][i]
    v = js["bufferViews"][a["bufferView"]]
    n = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}[a["type"]]
    ct = {5126: np.float32, 5123: np.uint16, 5121: np.uint8}[a["componentType"]]
    off = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    stride = v.get("byteStride", 0)
    if stride and stride != n * np.dtype(ct).itemsize:
        raise SystemExit("interleaved accessor")
    return np.frombuffer(bin_, dtype=ct, count=a["count"] * n, offset=off).reshape(a["count"], n).astype(np.float64)


def slerp(a, b, t):
    """Shortest-path slerp of quaternions a, b (x y z w), t in [0, 1]; the same as Babylon's Quaternion.Slerp."""
    d = float(np.dot(a, b))
    if d < 0:
        b, d = -b, -d
    if d > 0.9995:
        q = a + (b - a) * t
    else:
        th = np.arccos(d)
        s = np.sin(th)
        q = a * (np.sin((1 - t) * th) / s) + b * (np.sin(t * th) / s)
    return q / np.linalg.norm(q)


class Rig:
    """The skeleton of the raw glTF: joints in skin order, rest pose, inverse bind matrices, hand sockets."""

    def __init__(self, js, bin_):
        skin = js["skins"][0]
        self.nodes = js["nodes"]
        self.joint_nodes = skin["joints"]
        self.index = {n: i for i, n in enumerate(self.joint_nodes)}
        self.names = [self.nodes[n]["name"] for n in self.joint_nodes]
        parent = {c: p for p, node in enumerate(self.nodes) for c in node.get("children", [])}
        self.parent = [self.index.get(parent.get(n), -1) for n in self.joint_nodes]
        if self.parent.count(-1) != 1:
            raise SystemExit(f"expected one root joint, found {self.parent.count(-1)}")
        self.root = self.parent.index(-1)
        self.rest_t = np.array([self.nodes[n].get("translation", [0, 0, 0]) for n in self.joint_nodes], dtype=np.float64)
        self.rest_q = np.array([self.nodes[n].get("rotation", [0, 0, 0, 1]) for n in self.joint_nodes], dtype=np.float64)
        self.rest_s = np.array([self.nodes[n].get("scale", [1, 1, 1]) for n in self.joint_nodes], dtype=np.float64)
        if np.abs(self.rest_s - 1).max() > 1e-3:
            raise SystemExit("a joint is scaled: the .vat format keeps the joints' size at 1")
        self.ibm = accessor(js, bin_, skin["inverseBindMatrices"])  # glTF order, as the accessor holds them
        # sockets: nodes that are no joint, hang below one and carry a name starting with socket_
        self.sockets = []
        for ni, node in enumerate(self.nodes):
            if ni in self.index or not node.get("name", "").startswith("socket_") or ni not in parent:
                continue
            if parent[ni] not in self.index:
                raise SystemExit(f"{node['name']} does not hang below a joint")
            self.sockets.append((node["name"], self.index[parent[ni]], node.get("translation", [0, 0, 0]), node.get("rotation", [0, 0, 0, 1]), node.get("scale", [1, 1, 1])))
        # world scale of everything above the root joint (the armature node): board units of a joint-space length
        up, k = parent.get(self.joint_nodes[self.root]), 1.0
        while up is not None:
            k *= float(np.mean(self.nodes[up].get("scale", [1, 1, 1])))
            up = parent.get(up)
        self.world_scale = k


def clip_tracks(js, bin_, rig, anim):
    """-> (duration, rotation keys per joint [(times, quats, step)] or None, hips translation keys (times, values, step))"""
    rot = [None] * len(rig.names)
    trans = None
    t_end = 0.0
    for ch in anim["channels"]:
        node = ch["target"]["node"]
        if node not in rig.index:
            continue
        j = rig.index[node]
        s = anim["samplers"][ch["sampler"]]
        step = s.get("interpolation", "LINEAR") == "STEP"  # the exporter writes constant channels as two equal STEP keys
        if s.get("interpolation", "LINEAR") not in ("LINEAR", "STEP"):
            raise SystemExit(f"{anim['name']}: only LINEAR and STEP interpolation is baked")
        times = accessor(js, bin_, s["input"])[:, 0]
        vals = accessor(js, bin_, s["output"])
        t_end = max(t_end, float(times[-1]))
        path = ch["target"]["path"]
        if path == "rotation":
            rot[j] = (times, vals, step)
        elif path == "translation":
            if j == rig.root:
                trans = (times, vals, step)
            elif np.abs(vals - rig.rest_t[j]).max() > 1e-4:
                raise SystemExit(f"{anim['name']}: joint {rig.names[j]} moves, only the root's translation is baked")
        elif path == "scale" and np.abs(vals - rig.rest_s[j]).max() > 1e-3:
            raise SystemExit(f"{anim['name']}: joint {rig.names[j]} scales, scale is not baked")
    return t_end, rot, trans


def sample_rotation(track, rest, t):
    if track is None:
        return rest
    times, vals, step = track
    if t <= times[0]:
        return vals[0]
    if t >= times[-1]:
        return vals[-1]
    k = int(np.searchsorted(times, t, side="right")) - 1
    if step:
        return vals[k]
    return slerp(vals[k], vals[k + 1], (t - times[k]) / (times[k + 1] - times[k]))


def sample_translation(track, rest, t):
    if track is None:
        return rest
    times, vals, step = track
    if t <= times[0]:
        return vals[0]
    if t >= times[-1]:
        return vals[-1]
    k = int(np.searchsorted(times, t, side="right")) - 1
    if step:
        return vals[k]
    f = (t - times[k]) / (times[k + 1] - times[k])
    return vals[k] * (1 - f) + vals[k + 1] * f


def bake(raw_path):
    """-> (rig, clips [(name, first row, rows, loops)], rotations (R, J, 4) float64, translations (R, 3) float64)"""
    js, bin_ = read_glb(raw_path)
    rig = Rig(js, bin_)
    clips, rots, trans, row = [], [], [], 0
    for anim in js["animations"]:
        name = anim["name"]
        dur, rot_tracks, hips = clip_tracks(js, bin_, rig, anim)
        last = int(round(dur * FPS))
        if abs(dur * FPS - last) > 1e-3:
            raise SystemExit(f"{name}: {dur:.5f} s is not a whole number of frames at {FPS} fps")
        loop = name in LOOPS
        first = last if name in LAST_ROW_ONLY else 0
        stop = last if loop else last + 1  # a loop ends before its first row comes again
        stop = max(stop, first + 1)
        for i in range(first, stop):
            t = i / FPS
            q = np.array([sample_rotation(rot_tracks[j], rig.rest_q[j], t) for j in range(len(rig.names))])
            rots.append(q)
            trans.append(sample_translation(hips, rig.rest_t[rig.root], t))
        clips.append((name, row, stop - first, loop))
        row += stop - first
    rots = np.array(rots)
    # keep neighbouring rows in one hemisphere (smaller steps compress better; the rotation is the same)
    for name, r0, n, _ in clips:
        for k in range(r0 + 1, r0 + n):
            flip = np.einsum("jc,jc->j", rots[k], rots[k - 1]) < 0
            rots[k][flip] *= -1
    return rig, clips, rots, np.array(trans)


def encode(rig, clips, rots, trans):
    R, J = len(rots), len(rig.names)
    out = bytearray()
    out += MAGIC + struct.pack("<HHHHHHI", VERSION, FPS, J, len(rig.sockets), len(clips), 0, R)

    def name(n):
        b = n.encode()
        return struct.pack("<B", len(b)) + b

    for j in range(J):
        out += name(rig.names[j]) + struct.pack("<h", rig.parent[j])
        out += struct.pack("<3f4f3f", *rig.rest_t[j], *rig.rest_q[j], *rig.rest_s[j])
        out += np.asarray(rig.ibm[j], dtype="<f4").tobytes()
    for n, joint, t, q, s in rig.sockets:
        out += name(n) + struct.pack("<h", joint) + struct.pack("<3f4f3f", *t, *q, *s)
    for n, first, count, loop in clips:
        out += name(n) + struct.pack("<IIB", first, count, 1 if loop else 0)
    out += b"\0" * (-len(out) % 4)
    half = rots.astype("<f2")  # (R, J, 4)
    for j in range(J):
        for c in range(4):
            raw = half[:, j, c].tobytes()
            out += raw[0::2] + raw[1::2]  # low bytes, then high bytes
    out += np.asarray(trans, dtype="<f4").tobytes()
    return bytes(out)


# ---- verification: the file against the keys, in board units -------------------------------------------------------------

def quat_matrix(q, t, s=(1, 1, 1)):
    x, y, z, w = q / np.linalg.norm(q)
    m = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 0],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 0],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y), 0],
                  [0, 0, 0, 1]])
    m[:3, :3] *= np.asarray(s)[None, :]
    m[:3, 3] = t
    return m


def skin_matrices(rig, rot, root_t):
    """Skin matrices (column-vector convention) of one pose, joints in skin order; the joints' order puts parents anywhere."""
    world = [None] * len(rig.names)

    def fk(j):
        if world[j] is None:
            t = root_t if j == rig.root else rig.rest_t[j]
            local = quat_matrix(rot[j], t, rig.rest_s[j])
            world[j] = local if rig.parent[j] < 0 else fk(rig.parent[j]) @ local
        return world[j]

    return [fk(j) @ rig.ibm[j].reshape(4, 4).T for j in range(len(rig.names))]


def verify(raw_path, rig, clips, rots, trans, decoded_rots):
    """Largest vertex deviation (board units) of the stored rows from the float sampling, once through the half-float rotations of the file
    and once through the half-float matrix texture the renderer builds from them (sampled rows, every third vertex)."""
    js, bin_ = read_glb(raw_path)
    prim = js["meshes"][0]["primitives"][0]["attributes"]
    pos = accessor(js, bin_, prim["POSITION"])
    idx = accessor(js, bin_, prim["JOINTS_0"]).astype(int)
    wts = accessor(js, bin_, prim["WEIGHTS_0"])
    pos4 = np.c_[pos, np.ones(len(pos))]
    sel = np.arange(0, len(pos), 3)
    worst = 0.0
    rows = np.arange(len(rots))[:: max(1, len(rots) // 150)]

    def skinned(m):  # (J, 4, 4) -> positions of the selected vertices
        return sum(wts[sel, k, None] * np.einsum("vij,vj->vi", m[idx[sel, k]], pos4[sel]) for k in range(4))[:, :3]

    for r in rows:
        a = skinned(np.array(skin_matrices(rig, rots[r], trans[r])))
        # the renderer keeps the skin matrices of every row in a half float texture
        b = skinned(np.array(skin_matrices(rig, decoded_rots[r], trans[r])).astype(np.float16).astype(np.float64))
        worst = max(worst, float(np.abs(a - b).max()))
    return worst * rig.world_scale


def main(raw_path, out_path):
    js, _ = read_glb(raw_path)
    if not js.get("skins"):  # a static figure has nothing to play
        if os.path.exists(out_path):
            os.remove(out_path)
        print(f"[hc] {raw_path}: no skeleton, nothing to bake", flush=True)
        return
    rig, clips, rots, trans = bake(raw_path)
    data = encode(rig, clips, rots, trans)
    packed = gzip.compress(data, 9, mtime=0)
    with open(out_path, "wb") as f:
        f.write(packed)
    decoded = rots.astype("<f2").astype(np.float64)
    dev = verify(raw_path, rig, clips, rots, trans, decoded)
    summary = ", ".join(f"{n} {c}{'*' if lp else ''}" for n, _, c, lp in clips)
    print(f"[hc] {out_path}: {len(rots)} rows ({summary}), {len(data) // 1024} KB raw, {len(packed) // 1024} KB packed, "
          f"vertex deviation (half float rows and texture) {dev:.5f}", flush=True)
    if dev > 0.002:
        raise SystemExit(f"half float rotations move vertices by {dev} board units (limit 0.002)")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
