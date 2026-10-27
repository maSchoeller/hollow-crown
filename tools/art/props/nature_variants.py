"""Nature variants: more trees, rocks, a village well and a fence gate
(references art/props/refs/trees_variants.png and art/props/refs/rocks_well.png, rows 1-4).

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/nature_variants.py [-- ids]

- tree_d: summer linden, broad round crown of five big faceted clumps on a short forked trunk
- tree_e: slender birch / poplar, white trunk, four stacked egg-shaped clumps
- autumn_c: autumn oak, wide crown of rust, orange and golden clumps
- snowfir_b: tall slim snowy spruce, five small tiers under soft snow caps
- rock_b: tall mossy rock with a mossy crown and a few boulders at its foot
- rock_c: low rock ridge of five flat stones with grass tufts
- well_idle: village well, ring of stone blocks, two posts with a shingled gable roof (ridge along x), bucket
- fence_gate: fence_idle with a small gate in the middle (same length, height, rail heights and orientation)

Writes art/models/props/<id>.glb and art/props/previews/<id>.png. Fixed seeds, so the output is deterministic.
Materials and helpers come from trees.py, trees_seasons.py and nature.py, so all groups share one look.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Euler, Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import finish, join, mesh_object, reset  # noqa: E402
from trees import BARK_DARK, BARK_LIGHT, bark_mat, branch, clump, flat_mat, leaf_mat, lin, tapered, with_mat  # noqa: E402
from trees_seasons import FIR_LEAF, SNOW, birch_mat, fir_tier, tube  # noqa: E402
from nature import (GRASS, RAIL_HW, RAIL_HH, RAIL_OFF, RAIL_Z, WOOD, blade, boulder, fence_mats, hexa, loft, paint,  # noqa: E402
                    plank, post)

# ---------------------------------------------------------------- palettes

LINDEN_LEAF = [(0.0, lin(44, 96, 18)), (0.3, lin(88, 148, 28)), (0.55, lin(132, 190, 36)), (0.8, lin(176, 218, 50)),
               (1.0, lin(212, 238, 76))]
POPLAR_LEAF = [(0.0, lin(60, 110, 20)), (0.3, lin(110, 160, 30)), (0.6, lin(160, 200, 40)), (0.85, lin(196, 226, 56)),
               (1.0, lin(224, 240, 90))]
RUST_LEAF = [(0.0, lin(88, 14, 10)), (0.3, lin(150, 34, 16)), (0.6, lin(200, 62, 22)), (0.85, lin(230, 96, 32)),
             (1.0, lin(246, 130, 44))]
ORANGE_LEAF = [(0.0, lin(130, 40, 10)), (0.3, lin(190, 80, 14)), (0.6, lin(232, 120, 22)), (0.85, lin(248, 160, 34)),
               (1.0, lin(252, 190, 56))]
GOLD_LEAF = [(0.0, lin(160, 92, 10)), (0.3, lin(214, 140, 18)), (0.6, lin(244, 180, 28)), (0.85, lin(252, 210, 48)),
             (1.0, lin(255, 232, 100))]
GREY = [(0.0, lin(74, 72, 70)), (0.35, lin(120, 118, 114)), (0.65, lin(162, 160, 156)), (1.0, lin(204, 202, 196))]
MOSS_BRIGHT = [(0.0, lin(84, 124, 18)), (0.4, lin(128, 188, 30)), (0.75, lin(168, 220, 40)), (1.0, lin(202, 240, 72))]
ROOF = [(0.0, lin(112, 60, 30)), (0.4, lin(150, 86, 44)), (0.75, lin(186, 112, 58)), (1.0, lin(214, 140, 78))]
BEAM = [(0.0, lin(96, 56, 30)), (0.5, lin(140, 86, 46)), (1.0, lin(184, 118, 66))]
BUCKET = [(0.0, lin(60, 38, 24)), (0.5, lin(104, 68, 40)), (1.0, lin(150, 104, 66))]
WELL_STONE = [(0.0, lin(96, 94, 92)), (0.4, lin(150, 148, 144)), (0.75, lin(190, 188, 182)), (1.0, lin(222, 220, 214))]


# ---------------------------------------------------------------- trees

def tree_d():
    reset()
    rng = random.Random(1101)
    leaf = leaf_mat('linden_leaf', LINDEN_LEAF, 0.35, 1.1, w_pos=0.5, w_norm=0.5, noise=0.12, seed=11.0)
    bark = bark_mat('linden_bark', BARK_DARK, BARK_LIGHT)
    parts = []
    trunk = tapered('trunk', [((0, 0, 0), 0.085), ((0, 0, 0.09), 0.068), ((0, 0, 0.3), 0.052), ((0, 0.01, 0.46), 0.044)],
                    6, rng, jitter=0.08, flare={0: 0.06, 2: 0.055, 4: 0.065})
    parts.append(with_mat(trunk, bark))
    parts.append(with_mat(branch('b1', (-0.02, 0, 0.3), (-0.22, -0.02, 0.45), 0.032, 0.016), bark))
    parts.append(with_mat(branch('b2', (0.02, 0, 0.28), (0.21, -0.01, 0.43), 0.03, 0.015), bark))
    parts.append(with_mat(branch('b3', (0.0, 0.01, 0.34), (0.03, 0.17, 0.52), 0.028, 0.014), bark))
    for i, (c, r) in enumerate((((-0.33, -0.03, 0.58), 0.23), ((0.33, -0.02, 0.58), 0.22), ((0.03, 0.21, 0.64), 0.22),
                                ((-0.02, -0.1, 0.78), 0.25), ((0.06, 0.06, 0.92), 0.2))):
        parts.append(with_mat(clump(f'c{i}', c, r, rng, spikes=0.08), leaf))
    obj = join(parts, 'tree_d')
    finish(obj, 'tree_d')


def tree_e():
    reset()
    rng = random.Random(1202)
    leaf = leaf_mat('poplar_leaf', POPLAR_LEAF, 0.4, 1.3, w_pos=0.5, w_norm=0.5, noise=0.12, seed=12.0)
    bark = birch_mat('poplar_bark')
    parts = []
    trunk = tube('trunk', [(0, 0, 0), (0, 0, 0.06), (0.01, 0, 0.35), (-0.005, 0.005, 0.7), (0.0, 0.0, 1.0)],
                 [0.045, 0.036, 0.03, 0.024, 0.015], 6, rng, jitter=0.05, flare={0: 0.02, 3: 0.018})
    parts.append(with_mat(trunk, bark))
    # (centre, radius, trunk point the side branch starts from) - zig-zag column, widest in the middle
    clumps = (((-0.12, 0.02, 0.5), 0.15, (0.0, 0.28)), ((0.12, -0.01, 0.7), 0.16, (0.01, 0.46)),
              ((-0.09, 0.03, 0.92), 0.15, (0.0, 0.66)), ((0.05, 0.0, 1.14), 0.13, (0.0, 0.88)))
    for i, (c, r, root) in enumerate(clumps):
        parts.append(with_mat(clump(f'c{i}', c, r, rng, squash=(0.88, 0.88, 1.3), spikes=0.07), leaf))
        s = Vector((root[0], 0, root[1]))
        e = Vector(c) - (Vector(c) - s).normalized() * r * 0.4
        parts.append(with_mat(branch(f'b{i}', s, e, 0.018, 0.01, segs=4), bark))
    parts.append(with_mat(clump('top', (0.0, 0.0, 1.3), 0.1, rng, subdiv=1, squash=(0.85, 0.85, 1.3), jitter=0.1), leaf))
    obj = join(parts, 'tree_e')
    finish(obj, 'tree_e')


def autumn_c():
    reset()
    rng = random.Random(1303)
    rust = leaf_mat('rust_leaf', RUST_LEAF, 0.35, 1.05, w_pos=0.45, w_norm=0.55, noise=0.1, seed=13.0)
    orange = leaf_mat('orange_leaf', ORANGE_LEAF, 0.35, 1.05, w_pos=0.45, w_norm=0.55, noise=0.1, seed=14.0)
    gold = leaf_mat('gold_leaf', GOLD_LEAF, 0.35, 1.05, w_pos=0.45, w_norm=0.55, noise=0.1, seed=15.0)
    bark = bark_mat('autumn_c_bark', BARK_DARK, BARK_LIGHT)
    parts = []
    trunk = tapered('trunk', [((0, 0, 0), 0.09), ((0, 0, 0.09), 0.072), ((0, 0, 0.3), 0.058), ((0, 0.01, 0.5), 0.046)],
                    6, rng, jitter=0.08, flare={0: 0.065, 2: 0.06, 4: 0.07})
    parts.append(with_mat(trunk, bark))
    parts.append(with_mat(branch('b1', (-0.02, 0, 0.3), (-0.24, -0.02, 0.45), 0.034, 0.017), bark))
    parts.append(with_mat(branch('b2', (0.02, 0, 0.28), (0.24, -0.01, 0.42), 0.032, 0.016), bark))
    parts.append(with_mat(branch('b3', (0.0, 0.01, 0.34), (0.03, 0.17, 0.54), 0.03, 0.015), bark))
    crown = (
        ((-0.3, -0.04, 0.6), 0.23, rust, 2), ((0.29, -0.02, 0.57), 0.2, orange, 2), ((0.0, 0.0, 0.85), 0.25, gold, 2),
        ((0.03, 0.2, 0.64), 0.19, rust, 2), ((0.43, 0.0, 0.42), 0.11, orange, 1), ((-0.08, -0.17, 0.5), 0.13, gold, 1),
    )
    for i, (c, r, m, sd) in enumerate(crown):
        parts.append(with_mat(clump(f'c{i}', c, r, rng, subdiv=sd, spikes=0.08), m))
    obj = join(parts, 'autumn_c')
    finish(obj, 'autumn_c')


def snowfir_b():
    reset()
    rng = random.Random(1404)
    bark = bark_mat('fir_b_bark', BARK_DARK, BARK_LIGHT)
    parts = [with_mat(tapered('trunk', [((0, 0, 0), 0.06), ((0, 0, 0.06), 0.048), ((0, 0, 0.3), 0.04)], 6, rng,
                              jitter=0.05, flare={0: 0.022, 3: 0.018}), bark)]
    tiers = ((0.24, 0.27, 0.32, 8), (0.42, 0.25, 0.26, 8), (0.59, 0.24, 0.21, 8), (0.75, 0.23, 0.16, 8),
             (0.9, 0.3, 0.1, 8))
    for i, (z0, h, r, segs) in enumerate(tiers):
        leaf = leaf_mat(f'fir_b_leaf{i}', FIR_LEAF, z0 - h * 0.06, z0 + h * 0.45, w_pos=0.4, w_norm=0.6, noise=0.05,
                        seed=21.0 + i, bias=-0.05 + 0.04 * i)
        snow = leaf_mat(f'snow_b{i}', SNOW, z0 + h * 0.3, z0 + h, w_pos=0.35, w_norm=0.65, noise=0.04, seed=31.0 + i)
        skirt, cap = fir_tier(f't{i}', z0, h, r, segs, rng)
        parts += [with_mat(skirt, leaf), with_mat(cap, snow)]
    obj = join(parts, 'snowfir_b')
    finish(obj, 'snowfir_b')


# ---------------------------------------------------------------- rocks

MOSS_SOFT = [(0.0, lin(62, 82, 22)), (0.5, lin(100, 124, 32)), (1.0, lin(138, 158, 52))]


def rock_b():
    """Tall angular rock block: few big facets (rings of 8 jittered corners tapering to a ridge), a coherent moss cap on
    top (a shell over the upper rings) and two small moss patches on the front."""
    reset()
    rng = random.Random(1515)
    stone = paint('stone_b', GREY, z=(0.0, 0.9), wz=0.25, wn=0.8, noise=0.1, nscale=7, seed=41.0, bias=-0.1)
    moss = paint('moss_b', MOSS_SOFT, z=(0.5, 0.95), wz=0.3, wn=0.6, noise=0.08, nscale=9, seed=42.0, bias=-0.05)
    n = 7
    # (z, half width x, half depth y, centre x shift)
    prof = ((0.0, 0.33, 0.25, 0.0), (0.18, 0.35, 0.27, 0.01), (0.46, 0.29, 0.22, 0.02), (0.7, 0.2, 0.16, 0.03),
            (0.9, 0.11, 0.09, 0.03))
    rings, jit = [], []
    for z, rx, ry, cx in prof:
        ring, j = [], []
        for i in range(n):
            a = 2 * math.pi * (i + rng.uniform(-0.18, 0.18)) / n + 0.3
            k = rng.uniform(0.8, 1.15)
            j.append((a, k))
            ring.append((cx + math.cos(a) * rx * k, math.sin(a) * ry * k, z + rng.uniform(-0.02, 0.02)))
        rings.append(ring)
        jit.append(j)
    peak = [(0.04, 0.0, 1.03)]
    parts = [loft('block', rings + [peak], stone, cap=True)]
    # moss cap: rings 3.. (upper third) pushed out a little, ending in the same peak, lower edge ragged
    cap = []
    for ri in (3, 4):
        z, rx, ry, cx = prof[ri]
        grow = 1.06
        ring = []
        for i in range(n):
            a, k = jit[ri][i]
            dz = 0.0 if ri > 3 else (0.05 if i % 2 else -0.05)
            ring.append((cx + math.cos(a) * rx * k * grow, math.sin(a) * ry * k * grow, z + dz + 0.015))
        cap.append(ring)
    parts.append(loft('cap', cap + [[(0.04, 0.0, 1.06)]], moss, cap=True, cap_bottom=False))
    # two patches on the front (towards -y) lying on the facets
    parts.append(boulder('m1', (-0.12, -0.17, 0.36), 0.085, rng, moss, subdiv=1, squash=(1.0, 0.45, 0.9), jitter=0.1))
    parts.append(boulder('m2', (0.17, -0.17, 0.16), 0.075, rng, moss, subdiv=1, squash=(1.0, 0.45, 0.8), jitter=0.1))
    obj = join(parts, 'rock_b')
    finish(obj, 'rock_b')


def tuft(prefix, cx, cy, n, h, rng, mat, rad=0.03):
    """Grass tuft: n blades fanned out from (cx, cy), leaning outwards."""
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n + rng.uniform(-0.3, 0.3)
        d = Vector((math.cos(a), math.sin(a), 0))
        hh = h * rng.uniform(0.75, 1.2)
        lean = d * hh * rng.uniform(0.35, 0.7)
        out.append(blade(f'{prefix}{i}', (cx + d.x * rad * 0.4, cy + d.y * rad * 0.4, 0.0), hh, 0.085, (lean.x, lean.y),
                         rng, mat))
    return out


def rock_c():
    reset()
    rng = random.Random(1606)
    stone = paint('stone_c', GREY, z=(0.0, 0.2), wz=0.25, wn=0.75, noise=0.1, nscale=9, seed=43.0, bias=-0.08)
    grass = paint('grass_c', MOSS_BRIGHT, z=(0.0, 0.2), wz=0.55, wn=0.4, noise=0.08, nscale=14, seed=44.0, bias=-0.1)
    parts = [
        boulder('r0', (-0.34, -0.03, 0.07), 0.15, rng, stone, subdiv=1, squash=(1.2, 1.0, 0.6), jitter=0.14),
        boulder('r1', (-0.12, 0.04, 0.08), 0.2, rng, stone, subdiv=2, squash=(1.2, 0.95, 0.6), jitter=0.12),
        boulder('r2', (0.12, -0.04, 0.08), 0.19, rng, stone, subdiv=2, squash=(1.25, 0.95, 0.58), jitter=0.12),
        boulder('r3', (0.34, 0.03, 0.065), 0.14, rng, stone, subdiv=1, squash=(1.2, 1.0, 0.6), jitter=0.14),
        boulder('r4', (0.0, -0.17, 0.045), 0.1, rng, stone, subdiv=1, squash=(1.3, 1.0, 0.55), jitter=0.14),
    ]
    k = 0
    for cx, cy, n, h in ((-0.4, -0.02, 6, 0.24), (-0.2, 0.1, 6, 0.26), (0.0, 0.0, 7, 0.28), (0.22, -0.1, 6, 0.24),
                         (0.4, 0.04, 6, 0.22), (-0.14, -0.16, 6, 0.2), (0.12, 0.12, 6, 0.22)):
        parts += tuft(f'g{k}_', cx, cy, n, h, rng, grass, rad=0.07)
        k += 1
    obj = join(parts, 'rock_c')
    finish(obj, 'rock_c')


# ---------------------------------------------------------------- well

def box(name, x0, x1, y0, y1, z0, z1, mat, taper=1.0):
    """Axis-aligned box (top face scaled by `taper` around its centre)."""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2

    def top(x, y):
        return (cx + (x - cx) * taper, cy + (y - cy) * taper)
    b = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    pts = [(x, y, z0) for x, y in b] + [(*top(x, y), z1) for x, y in b]
    return hexa(name, pts, mat)


def block_ring(prefix, n, r_in, r_out, z0, z1, rng, mats, off):
    """Ring of n stone blocks (wedges) with chamfered, slightly uneven tops."""
    out = []
    for i in range(n):
        a0 = off + 2 * math.pi * i / n
        a1 = off + 2 * math.pi * (i + 1) / n
        gap = (a1 - a0) * 0.02
        a0, a1 = a0 + gap, a1 - gap
        zt = z1 + rng.uniform(-0.008, 0.008)
        rt_in, rt_out = r_in * 1.03, r_out * 0.97

        def p(r, a, z):
            return (math.cos(a) * r, math.sin(a) * r, z)
        pts = [p(r_in, a0, z0), p(r_out, a0, z0), p(r_out, a1, z0), p(r_in, a1, z0),
               p(rt_in, a0 + gap, zt), p(rt_out, a0 + gap, zt), p(rt_out, a1 - gap, zt), p(rt_in, a1 - gap, zt)]
        out.append(hexa(f'{prefix}{i}', pts, rng.choice(mats)))
    return out


def shingle_slope(prefix, sign, ridge_z, ridge_y, drop, run, half_len, rows, cols, rng, mats):
    """One roof slope (rows of cols shingles); sign = +1 slopes towards +y, -1 towards -y. Lower rows lie over the upper."""
    length = math.hypot(drop, run)
    ang = -math.atan2(drop, run)               # slope falls away from the ridge
    row_len = length / rows
    out = []
    for r in range(rows):
        s = (r + 0.5) * row_len
        centre = Vector((0.0, ridge_y + run * s / length, ridge_z - drop * s / length))
        lift = Vector((0.0, drop / length, run / length)) * (0.012 * r)    # lower rows sit proud of the ones above
        cw = 2 * half_len / cols
        for c in range(cols):
            x = -half_len + cw * (c + 0.5)
            wx = cw * 0.5
            ly = row_len * 0.58 * rng.uniform(0.97, 1.04)
            t = 0.014
            local = [(-wx * 0.97, -ly, -t), (wx * 0.97, -ly, -t), (wx * 0.97, ly, -t), (-wx * 0.97, ly, -t),
                     (-wx * 0.97, -ly, t), (wx * 0.97, -ly, t), (wx * 0.97, ly, t), (-wx * 0.97, ly, t)]
            pts = []
            for lx, ly_, lz in local:
                v = Vector((lx, ly_, lz))
                v.rotate(Euler((ang, 0, 0)))
                v += centre + lift + Vector((x, 0, 0))
                pts.append((v.x, v.y * sign, v.z))
            out.append(hexa(f'{prefix}{r}_{c}', pts, rng.choice(mats)))
    return out


def well_idle():
    reset()
    rng = random.Random(1707)
    stones = [paint(f'well_stone{k}', WELL_STONE, z=(0.0, 0.2), wz=0.2, wn=0.55, noise=0.08, nscale=16, seed=51.0 + k,
                    bias=b) for k, b in enumerate((-0.12, -0.02, 0.06))]
    roofs = [paint(f'well_roof{k}', ROOF, wn=0.6, noise=0.12, nscale=9, stretch=(1, 6, 1), seed=61.0 + k, bias=b)
             for k, b in enumerate((-0.1, 0.0, 0.08))]
    beam = paint('well_beam', BEAM, wn=0.6, noise=0.1, nscale=10, stretch=(0.6, 4, 4), seed=64.0, bias=0.0,
                 streaks=(60.0, 0.78, 'x'))
    post_m = paint('well_post', BEAM, z=(0.15, 0.7), wz=0.2, wn=0.55, noise=0.1, nscale=10, stretch=(4, 4, 0.6),
                   seed=65.0, bias=0.0, streaks=(60.0, 0.78, 'z'))
    bucket_m = paint('well_bucket', BUCKET, z=(0.25, 0.4), wz=0.3, wn=0.5, noise=0.08, nscale=14, seed=66.0, bias=0.0,
                     streaks=(50.0, 0.7, 'z'))
    dark = flat_mat('well_dark', lin(26, 26, 32))
    iron = flat_mat('well_iron', lin(58, 56, 60))
    parts = []
    parts += block_ring('lo', 10, 0.2, 0.34, 0.0, 0.09, rng, stones, 0.0)
    parts += block_ring('hi', 9, 0.19, 0.29, 0.09, 0.19, rng, stones, 0.3)
    # water / shaft: dark disc below the rim
    bm = bmesh.new()
    ring = [bm.verts.new((math.cos(2 * math.pi * i / 9) * 0.21, math.sin(2 * math.pi * i / 9) * 0.21, 0.13))
            for i in range(9)]
    bmesh.ops.triangulate(bm, faces=[bm.faces.new(ring)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    parts.append(with_mat(mesh_object('water', bm), dark))
    # two posts on the rim, windlass beam between them
    for sx in (-1, 1):
        parts.append(box(f'post{sx}', sx * 0.245 - 0.027, sx * 0.245 + 0.027, -0.027, 0.027, 0.18, 0.78, post_m, taper=0.9))
    parts.append(box('windlass', -0.3, 0.3, -0.026, 0.026, 0.46, 0.52, beam))
    parts.append(box('iron_l', -0.285, -0.2, -0.032, 0.032, 0.475, 0.505, iron))
    # roof: two shingled slopes (ridge along x), ridge beam
    ridge_z, drop, run = 0.84, 0.2, 0.29
    parts += shingle_slope('sa', 1, ridge_z, 0.0, drop, run, 0.4, 3, 4, rng, roofs)
    parts += shingle_slope('sb', -1, ridge_z, 0.0, drop, run, 0.4, 3, 4, rng, roofs)
    parts.append(box('ridge', -0.42, 0.42, -0.03, 0.03, ridge_z - 0.005, ridge_z + 0.04, beam, taper=0.8))
    # bucket hanging on a rope
    parts.append(box('rope', -0.006, 0.006, -0.006, 0.006, 0.34, 0.47, iron))
    rings = []
    for z, r in ((0.2, 0.062), (0.27, 0.075), (0.34, 0.082)):
        rings.append([(math.cos(2 * math.pi * i / 8 + 0.2) * r, math.sin(2 * math.pi * i / 8 + 0.2) * r, z)
                      for i in range(8)])
    parts.append(loft('bucket', rings, bucket_m, cap=True))
    obj = join(parts, 'well_idle')
    finish(obj, 'well_idle')


# ---------------------------------------------------------------- fence

def fence_gate():
    """fence_idle (posts at -0.4 and 0.4, two rails at RAIL_Z, 0.95 long) with a gate between two extra posts."""
    reset()
    rng = random.Random(1808)
    wood_post, wood_rail = fence_mats()
    iron = flat_mat('gate_iron', lin(54, 52, 56))
    xs = (-0.4, -0.12, 0.16, 0.4)
    parts = []
    for i, x in enumerate(xs):
        parts.append(post(f'post{i}', x, 0.42 + rng.uniform(-0.012, 0.012), 0.048, rng, wood_post))
    # rails of the two fixed sections, ends crossing through the end posts
    for sec, (xa, xb) in enumerate(((-0.475, -0.12), (0.16, 0.475))):
        for j, z in enumerate(RAIL_Z):
            za, zb = z + rng.uniform(-0.008, 0.008), z + rng.uniform(-0.008, 0.008)
            parts.append(plank(f'rail{sec}{j}', (xa if sec == 0 else xa - 0.01, RAIL_OFF, za),
                               (xb + 0.01 if sec == 0 else xb, RAIL_OFF, zb), RAIL_HW, RAIL_HH, wood_rail))
    # the gate leaf between the two middle posts: two rails, two stiles, a diagonal brace, hinges
    gx0, gx1 = -0.095, 0.135
    gy = RAIL_OFF - 0.012
    for j, z in enumerate((0.13, 0.33)):
        parts.append(plank(f'grail{j}', (gx0 - 0.01, gy, z), (gx1 + 0.01, gy, z), 0.02, 0.02, wood_rail))
    for j, x in enumerate((gx0 + 0.015, gx1 - 0.015)):
        parts.append(plank(f'gstile{j}', (x, gy, 0.1), (x, gy, 0.36), 0.02, 0.02, wood_rail))
    parts.append(plank('gbrace', (gx0 + 0.02, gy - 0.022, 0.15), (gx1 - 0.02, gy - 0.022, 0.31), 0.016, 0.016, wood_rail))
    for j, z in enumerate((0.13, 0.33)):
        parts.append(box(f'hinge{j}', gx0 - 0.03, gx0 + 0.05, gy - 0.032, gy - 0.02, z - 0.022, z + 0.022, iron))
    parts.append(box('latch', gx1 - 0.04, gx1 + 0.02, gy - 0.03, gy - 0.02, 0.215, 0.245, iron))
    obj = join(parts, 'fence_gate')
    finish(obj, 'fence_gate')


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    for fn in (tree_d, tree_e, autumn_c, snowfir_b, rock_b, rock_c, well_idle, fence_gate):
        if not only or fn.__name__ in only:
            fn()
