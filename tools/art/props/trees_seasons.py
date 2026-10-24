"""Seasonal trees (reference art/props/refs/trees_seasons.png, rows 1-4).

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/trees_seasons.py [-- ids]

- autumn_a: autumn broadleaf, short trunk with root flares, crown of three big faceted clumps, orange-red with yellow facets
- autumn_b: autumn birch, slim white trunk with dark marks and small side branches, five golden-yellow clumps
- snowfir_a: snowy fir, four stacked dark-green cone tiers each under a thick soft snow cap, white tip, short trunk
- deadtree_a: bare dead tree, twisted grey-brown trunk with root flares and four short curved branches

Writes art/models/props/<id>.glb and art/props/previews/<id>.png. Fixed seeds, so the output is deterministic.
Materials and the clump / tier helpers come from trees.py (summer trees), so both groups share one look.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import finish, join, mesh_object, reset  # noqa: E402
from trees import BARK_DARK, BARK_LIGHT, _ramp, bark_mat, branch, clump, leaf_mat, lin, tapered, with_mat  # noqa: E402


# ---------------------------------------------------------------- materials

def birch_mat(name):
    """Birch bark: off-white with short dark horizontal dashes (noise squashed along z, hard threshold)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, L = m.node_tree.nodes, m.node_tree.links
    bsdf = n['Principled BSDF']
    geo = n.new('ShaderNodeNewGeometry')
    mp = n.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (9.0, 9.0, 34.0)
    L.new(geo.outputs['Position'], mp.inputs['Vector'])
    tex = n.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 1.0
    tex.inputs['Detail'].default_value = 0.0
    L.new(mp.outputs['Vector'], tex.inputs['Vector'])
    ramp = _ramp(n, [(0.0, lin(240, 236, 226)), (0.5, lin(214, 208, 196)), (0.63, lin(48, 40, 34)), (1.0, lin(48, 40, 34))])
    ramp.color_ramp.interpolation = 'CONSTANT'
    L.new(tex.outputs['Fac'], ramp.inputs['Fac'])
    L.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.9
    return m


# ---------------------------------------------------------------- geometry

def tube(name, pts, radii, segs, rng, jitter=0.0, twist=0.0, flare=None, cap=True):
    """Tapered tube along a polyline (rings follow the path with parallel-transported frames), open bottom, capped tip.
    twist: ring rotation per step (radians) for a wrung, gnarly trunk. flare: {vertex index in ring 0: extra radius}."""
    bm = bmesh.new()
    pts = [Vector(p) for p in pts]
    tangents = []
    for i in range(len(pts)):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, len(pts) - 1)]
        tangents.append((b - a).normalized())
    normal = tangents[0].orthogonal().normalized()
    off = rng.uniform(0, math.pi)
    loops = []
    for i, (c, r) in enumerate(zip(pts, radii)):
        t = tangents[i]
        if i:
            normal = (normal - t * normal.dot(t)).normalized()
        binorm = t.cross(normal)
        loop = []
        for k in range(segs):
            a = off + twist * i + 2 * math.pi * k / segs
            rr = r * (1 + rng.uniform(-jitter, jitter))
            if i == 0 and flare and k in flare:
                rr += flare[k]
            loop.append(bm.verts.new(c + (normal * math.cos(a) + binorm * math.sin(a)) * rr))
        loops.append(loop)
    for l0, l1 in zip(loops, loops[1:]):
        for k in range(segs):
            j = (k + 1) % segs
            bm.faces.new((l0[k], l0[j], l1[j], l1[k]))
    if cap:
        f = bm.faces.new(loops[-1])
        bmesh.ops.triangulate(bm, faces=[f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_object(name, bm)


def fir_tier(name, z0, h, r, segs, rng, snow_rim=0.36):
    """Snowy fir tier as two objects: a green skirt (steep band from under the snow out to a zigzag rim at z0, raised
    underside) and a soft snow cap over it (apex, shoulder, rim of rounded lobes hanging over the skirt, lip tucked
    back in). Returns (skirt, snow)."""
    off = rng.uniform(0, math.pi)
    zs = z0 + h * snow_rim
    # green skirt
    bm = bmesh.new()
    top, rim = [], []
    for i in range(segs):
        a = off + 2 * math.pi * i / segs
        rt = r * 0.74
        top.append(bm.verts.new((math.cos(a) * rt, math.sin(a) * rt, zs + h * 0.08)))
        a2 = a + math.pi / segs
        point = i % 2 == 0
        rr = r * (1.0 if point else 0.9) * (1 + rng.uniform(-0.04, 0.04))
        rim.append(bm.verts.new((math.cos(a2) * rr, math.sin(a2) * rr, z0 - (h * 0.06 if point else -h * 0.03))))
    under = bm.verts.new((0, 0, z0 + h * 0.2))
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((top[i], rim[i], top[j]))
        bm.faces.new((top[j], rim[i], rim[j]))
        bm.faces.new((rim[j], rim[i], under))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    skirt = mesh_object(name + '_g', bm)
    # snow cap
    bm = bmesh.new()
    apex = bm.verts.new((0, 0, z0 + h))
    shoulder, lobes, lip = [], [], []
    for i in range(segs):
        a = off + 2 * math.pi * i / segs
        rs = r * 0.5 * (1 + rng.uniform(-0.05, 0.05))
        shoulder.append(bm.verts.new((math.cos(a) * rs, math.sin(a) * rs, z0 + h * 0.72)))
    n2 = segs * 2
    for i in range(n2):
        a = off + 2 * math.pi * (i - 0.5) / n2
        down = i % 2 == 0  # blob hanging down / shallow notch between two blobs
        rr = r * (0.9 if down else 0.84) * (1 + rng.uniform(-0.03, 0.03))
        z = zs - (h * 0.05 * rng.uniform(0.8, 1.2) if down else -h * 0.04)
        lobes.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, z)))
        rl = rr * 0.78
        lip.append(bm.verts.new((math.cos(a) * rl, math.sin(a) * rl, zs + h * 0.04)))
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((apex, shoulder[i], shoulder[j]))
        l0, l1, l2 = lobes[2 * i], lobes[2 * i + 1], lobes[(2 * i + 2) % n2]
        bm.faces.new((shoulder[i], l0, l1))
        bm.faces.new((shoulder[i], l1, shoulder[j]))
        bm.faces.new((shoulder[j], l1, l2))
    for i in range(n2):
        j = (i + 1) % n2
        bm.faces.new((lobes[j], lobes[i], lip[i], lip[j]))
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return skirt, mesh_object(name + '_s', bm)


# ---------------------------------------------------------------- assets

AUTUMN_LEAF = [(0.0, lin(105, 18, 10)), (0.3, lin(172, 30, 12)), (0.52, lin(216, 58, 16)), (0.72, lin(236, 104, 22)),
               (0.88, lin(245, 160, 34)), (1.0, lin(250, 205, 60))]
BIRCH_LEAF = [(0.0, lin(165, 100, 10)), (0.3, lin(215, 150, 18)), (0.6, lin(240, 190, 28)), (0.85, lin(250, 215, 50)),
              (1.0, lin(255, 238, 120))]
FIR_LEAF = [(0.0, lin(10, 38, 30)), (0.4, lin(18, 66, 50)), (0.75, lin(30, 96, 70)), (1.0, lin(60, 128, 84))]
SNOW = [(0.0, lin(168, 186, 210)), (0.35, lin(205, 218, 234)), (0.7, lin(236, 242, 250)), (1.0, lin(252, 253, 255))]
DEAD_DARK, DEAD_LIGHT = lin(68, 56, 48), lin(128, 112, 100)


def autumn_a():
    reset()
    rng = random.Random(501)
    leaf = leaf_mat('autumn_leaf', AUTUMN_LEAF, 0.35, 1.08, w_pos=0.45, w_norm=0.55, noise=0.18, seed=5.0, bias=-0.06)
    bark = bark_mat('autumn_bark', BARK_DARK, BARK_LIGHT)
    parts = []
    trunk = tapered('trunk', [((0, 0, 0), 0.09), ((0, 0, 0.09), 0.072), ((0, 0, 0.3), 0.058), ((0, 0.01, 0.52), 0.046)],
                    6, rng, jitter=0.08, flare={0: 0.065, 2: 0.06, 4: 0.07})
    parts.append(with_mat(trunk, bark))
    parts.append(with_mat(branch('b1', (-0.02, 0, 0.3), (-0.2, -0.02, 0.46), 0.034, 0.017), bark))
    parts.append(with_mat(branch('b2', (0.02, 0, 0.28), (0.19, -0.01, 0.44), 0.032, 0.016), bark))
    for i, (c, r) in enumerate((((-0.2, -0.04, 0.62), 0.225), ((0.2, -0.02, 0.6), 0.22), ((0.0, 0.07, 0.83), 0.24))):
        parts.append(with_mat(clump(f'c{i}', c, r, rng, spikes=0.08), leaf))
    obj = join(parts, 'autumn_a')
    finish(obj, 'autumn_a')


def autumn_b():
    reset()
    rng = random.Random(602)
    leaf = leaf_mat('birch_leaf', BIRCH_LEAF, 0.45, 1.15, w_pos=0.5, w_norm=0.5, noise=0.14, seed=6.0)
    bark = birch_mat('birch_bark')
    parts = []
    trunk = tube('trunk', [(0, 0, 0), (0, 0, 0.06), (0.01, 0, 0.3), (-0.005, 0.005, 0.6), (0.0, 0.0, 0.9)],
                 [0.042, 0.034, 0.03, 0.024, 0.016], 6, rng, jitter=0.05, flare={0: 0.02, 3: 0.018})
    parts.append(with_mat(trunk, bark))
    clumps = (((-0.21, 0.03, 0.5), 0.12, (0.0, 0.3)), ((0.17, -0.02, 0.66), 0.13, (0.01, 0.48)),
              ((-0.16, 0.02, 0.8), 0.125, (0.0, 0.64)), ((0.04, 0.13, 0.74), 0.12, (0.0, 0.58)),
              ((0.02, -0.02, 0.98), 0.165, None))
    for i, (c, r, root) in enumerate(clumps):
        parts.append(with_mat(clump(f'c{i}', c, r, rng, squash=(1.0, 1.0, 0.95), spikes=0.07), leaf))
        if root:
            # thin side branch from the trunk into the clump's inner side
            s = Vector((root[0], 0, root[1]))
            e = Vector(c) - (Vector(c) - s).normalized() * r * 0.3
            parts.append(with_mat(branch(f'b{i}', s, e, 0.018, 0.01, segs=4), bark))
    obj = join(parts, 'autumn_b')
    finish(obj, 'autumn_b')


def snowfir_a():
    reset()
    rng = random.Random(703)
    bark = bark_mat('fir_bark', BARK_DARK, BARK_LIGHT)
    parts = [with_mat(tapered('trunk', [((0, 0, 0), 0.07), ((0, 0, 0.06), 0.055), ((0, 0, 0.3), 0.045)], 6, rng,
                              jitter=0.05, flare={0: 0.025, 3: 0.02}), bark)]
    # (z0, height, radius, segments) per tier, bottom to top
    tiers = ((0.22, 0.3, 0.41, 10), (0.44, 0.28, 0.33, 10), (0.64, 0.26, 0.25, 8), (0.82, 0.28, 0.16, 8))
    for i, (z0, h, r, segs) in enumerate(tiers):
        leaf = leaf_mat(f'fir_leaf{i}', FIR_LEAF, z0 - h * 0.06, z0 + h * 0.45, w_pos=0.4, w_norm=0.6, noise=0.05,
                        seed=7.0 + i, bias=-0.05 + 0.04 * i)
        snow = leaf_mat(f'snow{i}', SNOW, z0 + h * 0.3, z0 + h, w_pos=0.35, w_norm=0.65, noise=0.04, seed=8.0 + i)
        skirt, cap = fir_tier(f't{i}', z0, h, r, segs, rng)
        parts += [with_mat(skirt, leaf), with_mat(cap, snow)]
    obj = join(parts, 'snowfir_a')
    finish(obj, 'snowfir_a')


def deadtree_a():
    reset()
    rng = random.Random(804)
    bark = bark_mat('dead_bark', DEAD_DARK, DEAD_LIGHT)
    parts = []
    trunk = tube('trunk', [(0, 0, 0), (0.0, 0, 0.07), (0.025, 0.01, 0.22), (-0.01, 0.0, 0.38), (0.01, 0.01, 0.5)],
                 [0.12, 0.1, 0.08, 0.07, 0.06], 7, rng, jitter=0.1, twist=0.4,
                 flare={0: 0.045, 2: 0.04, 4: 0.05, 6: 0.035})
    parts.append(with_mat(trunk, bark))
    # four limbs splitting from the top of the trunk: out, then curling up to a thin tip; (path, radii)
    limbs = (
        ([(-0.01, 0, 0.4), (-0.13, -0.02, 0.47), (-0.25, -0.03, 0.52), (-0.33, -0.04, 0.62), (-0.32, -0.06, 0.74)],
         [0.062, 0.048, 0.034, 0.022, 0.008]),
        ([(0.02, 0, 0.42), (0.14, 0.01, 0.52), (0.25, 0.02, 0.6), (0.33, 0.04, 0.72), (0.38, 0.03, 0.8)],
         [0.062, 0.048, 0.034, 0.022, 0.008]),
        ([(0.0, 0.01, 0.46), (0.03, 0.06, 0.62), (-0.02, 0.1, 0.74), (0.02, 0.13, 0.86), (0.06, 0.13, 0.92)],
         [0.06, 0.045, 0.032, 0.02, 0.008]),
        ([(0.0, -0.01, 0.44), (-0.03, -0.11, 0.55), (-0.02, -0.21, 0.63), (0.04, -0.28, 0.74), (0.07, -0.29, 0.8)],
         [0.056, 0.042, 0.03, 0.019, 0.008]),
    )
    for i, (pts, radii) in enumerate(limbs):
        parts.append(with_mat(tube(f'l{i}', pts, radii, 5, rng, jitter=0.1, twist=0.3), bark))
    # three root stubs reaching out over the ground
    for i, (dx, dy) in enumerate(((0.2, 0.05), (-0.13, 0.17), (-0.12, -0.17))):
        parts.append(with_mat(tube(f'r{i}', [(0, 0, 0.08), (dx * 0.6, dy * 0.6, 0.045), (dx, dy, 0.015)],
                                   [0.06, 0.035, 0.014], 5, rng), bark))
    obj = join(parts, 'deadtree_a')
    finish(obj, 'deadtree_a')


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    for fn in (autumn_a, autumn_b, snowfir_a, deadtree_a):
        if not only or fn.__name__ in only:
            fn()
