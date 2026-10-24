"""Summer trees and bush (reference art/props/refs/trees_summer.png, rows 1-4).

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/trees.py

- tree_a: round broadleaf oak, thick short trunk with root flares and two branch stubs, crown of overlapping clumps
- tree_b: taller beech, slim forked trunk, stacked egg-shaped crown of small clumps with a golden top
- tree_c: pine, four stacked faceted cone tiers, dark blue-green, short trunk
- bush_a: low bush of three leafy blobs with small red berry clusters

Writes art/models/props/<id>.glb and art/props/previews/<id>.png. Fixed seeds, so the output is deterministic.
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


def lin(r, g, b):
    """sRGB 0-255 to linear RGBA."""
    def c(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (c(r), c(g), c(b), 1.0)


# ---------------------------------------------------------------- materials

def _ramp(nodes, stops):
    ramp = nodes.new('ShaderNodeValToRGB')
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = stops[0]
    els[1].position, els[1].color = stops[-1]
    for pos, col in stops[1:-1]:
        e = els.new(pos)
        e.color = col
    return ramp


def leaf_mat(name, stops, zmin, zmax, w_pos=0.55, w_norm=0.45, noise=0.12, seed=0.0, bias=0.0):
    """Leaf gradient: dark underside, sunlit top (height + facet normal), soft large noise."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    n, L = nt.nodes, nt.links
    bsdf = n['Principled BSDF']
    geo = n.new('ShaderNodeNewGeometry')
    sp = n.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Position'], sp.inputs[0])
    dot = n.new('ShaderNodeVectorMath')
    dot.operation = 'DOT_PRODUCT'
    L.new(geo.outputs['Normal'], dot.inputs[0])
    dot.inputs[1].default_value = Vector((-0.35, -0.45, 0.82)).normalized()
    mr_p = n.new('ShaderNodeMapRange')
    mr_p.inputs['From Min'].default_value = zmin
    mr_p.inputs['From Max'].default_value = zmax
    L.new(sp.outputs['Z'], mr_p.inputs['Value'])
    mr_n = n.new('ShaderNodeMapRange')
    mr_n.inputs['From Min'].default_value = -1.0
    mr_n.inputs['From Max'].default_value = 1.0
    L.new(dot.outputs['Value'], mr_n.inputs['Value'])
    a = n.new('ShaderNodeMath')
    a.operation = 'MULTIPLY_ADD'
    L.new(mr_p.outputs['Result'], a.inputs[0])
    a.inputs[1].default_value = w_pos
    b = n.new('ShaderNodeMath')
    b.operation = 'MULTIPLY'
    L.new(mr_n.outputs['Result'], b.inputs[0])
    b.inputs[1].default_value = w_norm
    L.new(b.outputs[0], a.inputs[2])
    tex = n.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 4.0
    tex.inputs['Detail'].default_value = 1.0
    if 'W' in tex.inputs:
        tex.noise_dimensions = '4D'
        tex.inputs['W'].default_value = seed
    L.new(geo.outputs['Position'], tex.inputs['Vector'])
    nm = n.new('ShaderNodeMath')
    nm.operation = 'MULTIPLY_ADD'
    L.new(tex.outputs['Fac'], nm.inputs[0])
    nm.inputs[1].default_value = noise * 2
    nm.inputs[2].default_value = -noise + bias
    s = n.new('ShaderNodeMath')
    s.operation = 'ADD'
    s.use_clamp = True
    L.new(a.outputs[0], s.inputs[0])
    L.new(nm.outputs[0], s.inputs[1])
    ramp = _ramp(n, stops)
    L.new(s.outputs[0], ramp.inputs['Fac'])
    L.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.9
    return m


def bark_mat(name, dark, light):
    """Bark: brown with soft vertical streaks (noise stretched along z)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    n, L = nt.nodes, nt.links
    bsdf = n['Principled BSDF']
    geo = n.new('ShaderNodeNewGeometry')
    mp = n.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (14.0, 14.0, 1.5)
    L.new(geo.outputs['Position'], mp.inputs['Vector'])
    tex = n.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 2.0
    tex.inputs['Detail'].default_value = 1.0
    L.new(mp.outputs['Vector'], tex.inputs['Vector'])
    sn = n.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Normal'], sn.inputs[0])
    # a touch lighter on facets turned towards the camera side, darker low down
    sp = n.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Position'], sp.inputs[0])
    mr = n.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 0.3
    mr.inputs['From Max'].default_value = 0.7
    L.new(tex.outputs['Fac'], mr.inputs['Value'])
    ramp = _ramp(n, [(0.0, dark), (1.0, light)])
    L.new(mr.outputs['Result'], ramp.inputs['Fac'])
    L.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    return m


def flat_mat(name, col):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = col
    return m


BARK_DARK, BARK_LIGHT = lin(92, 52, 28), lin(150, 90, 48)


def with_mat(obj, mat):
    obj.data.materials.append(mat)
    return obj


# ---------------------------------------------------------------- geometry

def clump(name, center, radius, rng, subdiv=2, squash=(1.0, 1.0, 0.9), jitter=0.12, spikes=0.0, spike_share=0.3):
    """Faceted leaf clump: ico sphere with randomly displaced vertices; `spikes` pushes a share of them out further
    (leaf tips, chunkier facets)."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=radius)
    for v in bm.verts:
        d = 1.0 + rng.uniform(-jitter, jitter)
        if spikes and rng.random() < spike_share:
            d += spikes * rng.uniform(0.6, 1.0)
        v.co = Vector((v.co.x * d * squash[0], v.co.y * d * squash[1], v.co.z * d * squash[2]))
        v.co += Vector(center)
    return mesh_object(name, bm)


def tapered(name, rings, segs, rng, jitter=0.0, flare=None, tilt=None):
    """Tube through rings [(center xyz, radius)], capped top, open bottom (on the ground or hidden in the trunk).
    flare: {vertex index in ring 0: extra radius} for root flares."""
    bm = bmesh.new()
    loops = []
    off = rng.uniform(0, math.pi)
    for ri, (c, r) in enumerate(rings):
        loop = []
        for i in range(segs):
            a = off + 2 * math.pi * i / segs
            rr = r * (1 + rng.uniform(-jitter, jitter))
            if ri == 0 and flare and i in flare:
                rr += flare[i]
            loop.append(bm.verts.new((c[0] + math.cos(a) * rr, c[1] + math.sin(a) * rr, c[2])))
        loops.append(loop)
    for l0, l1 in zip(loops, loops[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((l0[i], l0[j], l1[j], l1[i]))
    bm.faces.new(loops[-1])
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    return mesh_object(name, bm)


def branch(name, start, end, r0, r1, segs=5):
    """Short tapered branch stub from start to end (two rings, capped tip)."""
    bm = bmesh.new()
    s, e = Vector(start), Vector(end)
    axis = (e - s).normalized()
    t = axis.orthogonal().normalized()
    u = axis.cross(t)
    loops = []
    for c, r in ((s, r0), (e, r1)):
        loops.append([bm.verts.new(c + (t * math.cos(2 * math.pi * i / segs) + u * math.sin(2 * math.pi * i / segs)) * r)
                      for i in range(segs)])
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((loops[0][i], loops[0][j], loops[1][j], loops[1][i]))
    bm.faces.new(loops[1])
    return mesh_object(name, bm)


def cone_tier(name, z0, h, r, segs, rng, droop=0.05):
    """Pine tier: apex, mid ring, zigzag rim, raised underside."""
    bm = bmesh.new()
    apex = bm.verts.new((0, 0, z0 + h))
    off = rng.uniform(0, math.pi)
    mid, rim = [], []
    for i in range(segs):
        a = off + 2 * math.pi * i / segs
        rm = r * 0.62 * (1 + rng.uniform(-0.06, 0.06))
        mid.append(bm.verts.new((math.cos(a) * rm, math.sin(a) * rm, z0 + h * 0.42)))
        a2 = a + math.pi / segs
        point = i % 2 == 0
        rr = r * (1.0 if point else 0.86) * (1 + rng.uniform(-0.04, 0.04))
        zr = z0 - (h * 0.1 if point else -h * 0.02) + rng.uniform(-0.01, 0.01)
        rim.append(bm.verts.new((math.cos(a2) * rr, math.sin(a2) * rr, zr)))
    under = bm.verts.new((0, 0, z0 + droop))
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((apex, mid[i], mid[j]))
        bm.faces.new((mid[i], rim[i], mid[j]))
        bm.faces.new((mid[j], rim[i], rim[j]))
        bm.faces.new((rim[j], rim[i], under))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_object(name, bm)


def octa(name, center, r, rng):
    """Small berry (octahedron, 8 triangles)."""
    bm = bmesh.new()
    c = Vector(center)
    pts = [Vector(p) * r * (1 + rng.uniform(-0.15, 0.15)) + c for p in
           ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))]
    v = [bm.verts.new(p) for p in pts]
    for a, b in ((0, 2), (2, 1), (1, 3), (3, 0)):
        bm.faces.new((v[a], v[b], v[4]))
        bm.faces.new((v[b], v[a], v[5]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_object(name, bm)


# ---------------------------------------------------------------- assets

OAK_LEAF = [(0.0, lin(30, 70, 14)), (0.3, lin(62, 112, 20)), (0.55, lin(112, 158, 26)), (0.8, lin(165, 198, 36)),
            (1.0, lin(210, 222, 58))]
BEECH_LEAF = [(0.0, lin(48, 88, 16)), (0.3, lin(105, 150, 26)), (0.55, lin(170, 192, 32)), (0.75, lin(222, 205, 34)),
              (0.9, lin(245, 185, 28)), (1.0, lin(250, 165, 24))]
PINE_LEAF = [(0.0, lin(10, 40, 40)), (0.35, lin(20, 72, 66)), (0.65, lin(36, 108, 84)), (0.88, lin(70, 145, 92)),
             (1.0, lin(130, 175, 85))]
BUSH_LEAF = [(0.0, lin(26, 62, 12)), (0.4, lin(66, 118, 22)), (0.7, lin(130, 178, 34)), (1.0, lin(200, 220, 66))]


def tree_a():
    reset()
    rng = random.Random(101)
    leaf = leaf_mat('oak_leaf', OAK_LEAF, 0.35, 1.05, seed=1.0)
    bark = bark_mat('oak_bark', BARK_DARK, BARK_LIGHT)
    parts = []
    trunk = tapered('trunk', [((0, 0, 0), 0.085), ((0, 0, 0.1), 0.07), ((0, 0, 0.3), 0.055), ((0, 0.01, 0.5), 0.045)],
                    6, rng, jitter=0.08, flare={0: 0.06, 2: 0.055, 4: 0.065})
    parts.append(with_mat(trunk, bark))
    parts.append(with_mat(branch('b1', (-0.02, 0, 0.3), (-0.17, -0.02, 0.43), 0.032, 0.016), bark))
    parts.append(with_mat(branch('b2', (0.02, 0, 0.27), (0.16, -0.01, 0.4), 0.03, 0.015), bark))
    for i, (c, r) in enumerate((((-0.19, -0.06, 0.6), 0.215), ((0.19, -0.04, 0.6), 0.21),
                                ((0.0, 0.17, 0.62), 0.2), ((0.0, 0.0, 0.8), 0.235))):
        parts.append(with_mat(clump(f'c{i}', c, r, rng, spikes=0.08), leaf))
    obj = join(parts, 'tree_a')
    finish(obj, 'tree_a')


def tree_b():
    reset()
    rng = random.Random(202)
    leaf = leaf_mat('beech_leaf', BEECH_LEAF, 0.45, 1.22, w_pos=0.7, w_norm=0.3, seed=2.0)
    bark = bark_mat('beech_bark', BARK_DARK, BARK_LIGHT)
    parts = []
    trunk = tapered('trunk', [((0, 0, 0), 0.05), ((0, 0, 0.08), 0.04), ((0.005, 0, 0.34), 0.033), ((0.01, 0, 0.62), 0.024)],
                    6, rng, jitter=0.06, flare={1: 0.03, 3: 0.025, 5: 0.03})
    parts.append(with_mat(trunk, bark))
    parts.append(with_mat(branch('f1', (0.0, 0, 0.3), (-0.13, -0.01, 0.5), 0.024, 0.014), bark))
    parts.append(with_mat(branch('f2', (0.01, 0, 0.36), (0.13, 0.0, 0.53), 0.022, 0.013), bark))
    clumps = (((-0.19, -0.04, 0.58), 0.175), ((0.19, -0.01, 0.6), 0.17), ((0.0, 0.13, 0.64), 0.17),
              ((-0.08, -0.06, 0.82), 0.16), ((0.09, 0.04, 0.85), 0.155), ((0.0, -0.01, 1.03), 0.15))
    for i, (c, r) in enumerate(clumps):
        parts.append(with_mat(clump(f'c{i}', c, r, rng, squash=(1.0, 1.0, 0.92), spikes=0.08), leaf))
    obj = join(parts, 'tree_b')
    finish(obj, 'tree_b')


def tree_c():
    reset()
    rng = random.Random(303)
    bark = bark_mat('pine_bark', BARK_DARK, BARK_LIGHT)
    parts = [with_mat(tapered('trunk', [((0, 0, 0), 0.07), ((0, 0, 0.06), 0.055), ((0, 0, 0.32), 0.045)], 6, rng,
                              jitter=0.05, flare={0: 0.025, 3: 0.02}), bark)]
    tiers = ((0.26, 0.32, 0.42, 12), (0.48, 0.29, 0.33, 12), (0.68, 0.26, 0.24, 10), (0.86, 0.28, 0.13, 8))
    for i, (z0, h, r, segs) in enumerate(tiers):
        # one gradient per tier (shadowed rim, lit shoulder), lower tiers a little darker
        leaf = leaf_mat(f'pine_leaf{i}', PINE_LEAF, z0 - h * 0.1, z0 + h, w_pos=0.5, w_norm=0.5, noise=0.05,
                        seed=3.0 + i, bias=-0.12 + 0.07 * i)
        parts.append(with_mat(cone_tier(f't{i}', z0, h, r, segs, rng, droop=0.1 if i < 3 else 0.05), leaf))
    obj = join(parts, 'tree_c')
    finish(obj, 'tree_c')


def bush_a():
    reset()
    rng = random.Random(404)
    leaf = leaf_mat('bush_leaf', BUSH_LEAF, 0.0, 0.4, w_pos=0.5, w_norm=0.5, seed=4.0, bias=-0.05)
    berry = flat_mat('berry', lin(196, 38, 30))
    parts = []
    blobs = (((-0.16, -0.05, 0.16), 0.17), ((0.17, -0.06, 0.15), 0.16), ((0.0, 0.1, 0.2), 0.18))
    for i, (c, r) in enumerate(blobs):
        parts.append(with_mat(clump(f'c{i}', c, r * 0.95, rng, squash=(1.0, 1.0, 0.95), jitter=0.1,
                                    spikes=0.16, spike_share=0.3), leaf))
    # berry clusters (3 berries each) sitting on the surface, mostly on the south / top side
    spots = ((0, -0.5, 0.25), (0, 0.6, -0.1), (1, -0.3, 0.45), (1, 0.8, 0.1), (2, -0.7, 0.55), (2, 0.4, 0.7))
    for k, (bi, ang, el) in enumerate(spots):
        c, r = blobs[bi]
        az = -math.pi / 2 + ang  # around the south direction
        d = Vector((math.cos(az) * math.cos(el), math.sin(az) * math.cos(el), math.sin(el)))
        base = Vector(c) + d * r * 1.0
        t = d.orthogonal().normalized()
        u = d.cross(t)
        for j in range(3):
            a = 2 * math.pi * j / 3 + rng.uniform(0, 0.5)
            p = base + (t * math.cos(a) + u * math.sin(a)) * 0.022
            parts.append(with_mat(octa(f'b{k}_{j}', p, 0.02, rng), berry))
    obj = join(parts, 'bush_a')
    finish(obj, 'bush_a')


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    for fn in (tree_a, tree_b, tree_c, bush_a):
        if not only or fn.__name__ in only:
            fn()
