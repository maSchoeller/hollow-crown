"""Camp props: covered wagon, tent, campfire and treasure chest (reference art/props/refs/camp.png, rows 1-5).

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/camp.py [-- ids]

- wagon_idle: covered wagon about 1.15 x 0.75 tiles (long side east-west), cream canvas on hoops over a plank box,
  four big spoked wheels, shaft with a crossbar to the west (-X), a barrel lashed to the south side at the rear
- tent_idle: A-frame canvas tent (ridge north-south, opening south), ropes to pegs, bedroll in front, a banner on the
  front pole (team cloth, key 2)
- campfire_idle: ring of stones, crossed logs, faceted flames painted orange to yellow, a log seat to the east
- chest_closed / chest_open: wooden chest with iron bands, corner fittings, lock (south) and side rings; open: lid
  swung back, heaped gold coins

Writes art/models/props/<id>.glb and art/props/previews/<id>.png. Fixed seeds, so the output is deterministic.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import finish, join, mesh_object, reset  # noqa: E402


def lin(r, g, b):
    """sRGB 0-255 to linear RGBA."""
    def c(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (c(r), c(g), c(b), 1.0)


# ---------------------------------------------------------------- materials

LIGHT = Vector((-0.35, -0.45, 0.82)).normalized()


def _ramp(nodes, stops):
    ramp = nodes.new('ShaderNodeValToRGB')
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = stops[0]
    els[1].position, els[1].color = stops[-1]
    for pos, col in stops[1:-1]:
        e = els.new(pos)
        e.color = col
    return ramp


def paint(name, stops, z=None, wz=0.0, wn=0.35, noise=0.1, nscale=6.0, stretch=(1, 1, 1), seed=0.0, bias=0.0,
          pattern=None):
    """Painted gradient material: ramp over (height share + facet-towards-light share + soft noise).
    pattern: ('hplanks', scale, dark) darkens horizontal plank seams (bands over z)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, L = m.node_tree.nodes, m.node_tree.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.9
    geo = n.new('ShaderNodeNewGeometry')
    terms = []
    if z is not None and wz:
        sp = n.new('ShaderNodeSeparateXYZ')
        L.new(geo.outputs['Position'], sp.inputs[0])
        mr = n.new('ShaderNodeMapRange')
        mr.inputs['From Min'].default_value, mr.inputs['From Max'].default_value = z
        mr.inputs['To Max'].default_value = wz
        L.new(sp.outputs['Z'], mr.inputs['Value'])
        terms.append(mr.outputs['Result'])
    if wn:
        dot = n.new('ShaderNodeVectorMath')
        dot.operation = 'DOT_PRODUCT'
        L.new(geo.outputs['Normal'], dot.inputs[0])
        dot.inputs[1].default_value = LIGHT
        mr = n.new('ShaderNodeMapRange')
        mr.inputs['From Min'].default_value = -1.0
        mr.inputs['To Max'].default_value = wn
        L.new(dot.outputs['Value'], mr.inputs['Value'])
        terms.append(mr.outputs['Result'])
    if noise:
        mp = n.new('ShaderNodeMapping')
        mp.inputs['Scale'].default_value = stretch
        L.new(geo.outputs['Position'], mp.inputs['Vector'])
        tex = n.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = nscale
        tex.inputs['Detail'].default_value = 2.0
        if 'W' in tex.inputs:
            tex.noise_dimensions = '4D'
            tex.inputs['W'].default_value = seed
        L.new(mp.outputs['Vector'], tex.inputs['Vector'])
        nm = n.new('ShaderNodeMath')
        nm.operation = 'MULTIPLY_ADD'
        L.new(tex.outputs['Fac'], nm.inputs[0])
        nm.inputs[1].default_value = noise * 2
        nm.inputs[2].default_value = -noise
        terms.append(nm.outputs[0])
    acc = n.new('ShaderNodeValue')
    acc.outputs[0].default_value = bias + (0.5 if not terms else 0.0)
    out = acc.outputs[0]
    for t in terms:
        s = n.new('ShaderNodeMath')
        s.operation = 'ADD'
        L.new(out, s.inputs[0])
        L.new(t, s.inputs[1])
        out = s.outputs[0]
    cl = n.new('ShaderNodeClamp')
    L.new(out, cl.inputs['Value'])
    ramp = _ramp(n, stops)
    L.new(cl.outputs['Result'], ramp.inputs['Fac'])
    col = ramp.outputs['Color']
    if pattern:
        _, scale, dark = pattern
        mp = n.new('ShaderNodeMapping')
        mp.inputs['Scale'].default_value = (0, 0, 1)
        L.new(geo.outputs['Position'], mp.inputs['Vector'])
        wav = n.new('ShaderNodeTexWave')
        wav.wave_type = 'BANDS'
        wav.bands_direction = 'Z'
        wav.wave_profile = 'SAW'
        wav.inputs['Scale'].default_value = scale
        wav.inputs['Distortion'].default_value = 0.0
        L.new(mp.outputs['Vector'], wav.inputs['Vector'])
        mr = n.new('ShaderNodeMapRange')
        mr.inputs['From Min'].default_value = 0.0
        mr.inputs['From Max'].default_value = 0.12
        mr.inputs['To Min'].default_value = dark
        mr.inputs['To Max'].default_value = 1.0
        L.new(wav.outputs['Fac'], mr.inputs['Value'])
        sc = n.new('ShaderNodeVectorMath')
        sc.operation = 'SCALE'
        L.new(col, sc.inputs[0])
        L.new(mr.outputs['Result'], sc.inputs['Scale'])
        col = sc.outputs['Vector']
    L.new(col, bsdf.inputs['Base Color'])
    return m


def flat_mat(name, col):
    return paint(name, [(0.0, col), (1.0, col)], wn=0, noise=0)


class Mats:
    """All paints of the group (one set per asset, built after reset())."""

    def __init__(self):
        self.wood = paint('wood', [(0.0, lin(74, 42, 22)), (0.5, lin(122, 74, 40)), (1.0, lin(164, 106, 60))],
                          wn=0.5, noise=0.14, nscale=12, stretch=(8, 8, 1), seed=1.0, bias=0.2,
                          pattern=('hplanks', 9.0, 0.5))
        self.timber = paint('timber', [(0.0, lin(52, 30, 18)), (0.5, lin(86, 52, 30)), (1.0, lin(122, 80, 46))],
                            wn=0.5, noise=0.15, nscale=12, stretch=(1, 1, 6), seed=2.0, bias=0.2)
        self.iron = paint('iron', [(0.0, lin(36, 38, 44)), (0.5, lin(70, 74, 82)), (1.0, lin(124, 128, 136))],
                          wn=0.7, noise=0.08, nscale=20, seed=3.0, bias=0.0)
        self.canvas = paint('canvas', [(0.0, lin(150, 128, 96)), (0.4, lin(212, 194, 160)), (0.75, lin(236, 222, 192)),
                                       (1.0, lin(248, 240, 220))], z=(0.2, 0.85), wz=0.25, wn=0.55, noise=0.06,
                            nscale=8, seed=4.0, bias=0.0)
        self.hoop = paint('hoop', [(0.0, lin(130, 104, 70)), (0.5, lin(178, 150, 110)), (1.0, lin(208, 184, 144))],
                          wn=0.6, noise=0.05, bias=0.0)
        self.rope = paint('rope', [(0.0, lin(120, 92, 56)), (1.0, lin(186, 152, 102))], wn=0.4, noise=0.1, bias=0.3)
        self.dark = paint('dark', [(0.0, lin(30, 22, 16)), (1.0, lin(58, 42, 30))], wn=0.3, noise=0.1, bias=0.2)
        self.barrel = paint('barrel', [(0.0, lin(96, 56, 28)), (0.6, lin(146, 92, 48)), (1.0, lin(178, 118, 64))],
                            wn=0.5, noise=0.12, nscale=14, stretch=(1, 1, 8), seed=5.0, bias=0.2)
        self.leather = paint('leather', [(0.0, lin(90, 40, 24)), (0.5, lin(142, 68, 40)), (1.0, lin(178, 98, 60))],
                             wn=0.5, noise=0.1, nscale=10, seed=6.0, bias=0.2)
        self.stone = paint('stone', [(0.0, lin(92, 90, 88)), (0.5, lin(146, 144, 140)), (1.0, lin(200, 198, 192))],
                           wn=0.75, noise=0.15, nscale=16, seed=7.0, bias=-0.05)
        self.log = paint('log', [(0.0, lin(70, 38, 20)), (0.5, lin(120, 68, 34)), (1.0, lin(160, 98, 52))],
                         wn=0.55, noise=0.15, nscale=10, stretch=(6, 6, 6), seed=8.0, bias=0.15)
        self.endgrain = paint('endgrain', [(0.0, lin(168, 112, 62)), (1.0, lin(220, 170, 110))], wn=0.3, noise=0.15,
                              nscale=30, seed=9.0, bias=0.3)
        self.char = paint('char', [(0.0, lin(30, 20, 16)), (0.5, lin(70, 40, 24)), (1.0, lin(150, 70, 30))],
                          z=(0.02, 0.18), wz=-0.4, wn=0.4, noise=0.15, nscale=14, seed=10.0, bias=0.55)
        self.fire = paint('fire', [(0.0, lin(228, 72, 18)), (0.35, lin(248, 140, 28)), (0.7, lin(255, 206, 64)),
                                   (1.0, lin(255, 246, 190))], z=(0.06, 0.36), wz=0.95, wn=0.15, noise=0.05,
                          nscale=10, seed=11.0, bias=0.0)
        self.ember = flat_mat('ember', lin(255, 120, 30))
        self.gold = paint('gold', [(0.0, lin(160, 104, 16)), (0.4, lin(224, 166, 30)), (0.75, lin(250, 210, 60)),
                                   (1.0, lin(255, 240, 150))], wn=0.8, noise=0.1, nscale=40, seed=12.0, bias=0.0)
        self.cloth = flat_mat('cloth', (1.0, 1.0, 1.0, 1.0))  # team cloth: white, tinted by the game


def with_mat(obj, mat):
    obj.data.materials.append(mat)
    return obj


# ---------------------------------------------------------------- geometry

def hexa(name, pts, mat):
    """Six-sided solid from 8 corners: bottom quad 0-3, top quad 4-7 (same winding)."""
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in pts]
    for f in ((0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return with_mat(mesh_object(name, bm), mat)


def box(name, c, s, mat, rot=(0, 0, 0), skip=()):
    """Axis box of size s around centre c, rotated by euler rot (radians); skip: face directions to drop."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    dirs = {'+x': (1, 0, 0), '-x': (-1, 0, 0), '+y': (0, 1, 0), '-y': (0, -1, 0), '+z': (0, 0, 1), '-z': (0, 0, -1)}
    bm.normal_update()
    for f in [f for f in bm.faces if any(f.normal.dot(Vector(dirs[d])) > 0.9 for d in skip)]:
        bm.faces.remove(f)
    for v in [v for v in bm.verts if not v.link_faces]:
        bm.verts.remove(v)
    e = Euler(rot)
    for v in bm.verts:
        p = Vector((v.co.x * s[0], v.co.y * s[1], v.co.z * s[2]))
        p.rotate(e)
        v.co = p + Vector(c)
    return with_mat(mesh_object(name, bm), mat)


def _frame(a, b):
    ax = (b - a).normalized()
    t = ax.orthogonal().normalized()
    return ax, t, ax.cross(t)


def beam(name, p0, p1, w, mat):
    """Square beam from p0 to p1."""
    a, b = Vector(p0), Vector(p1)
    _, t, u = _frame(a, b)
    ring = [(t * sx + u * sy) * (w / 2) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    return hexa(name, [a + r for r in ring] + [b + r for r in ring], mat)


def loft(name, rings, mat, cap=True):
    """Solid through rings of equal vertex count; a last ring of one vertex makes an apex (then cap=False)."""
    bm = bmesh.new()
    loops = [[bm.verts.new(p) for p in r] for r in rings]
    k = len(rings[0])
    for l0, l1 in zip(loops, loops[1:]):
        for i in range(k):
            j = (i + 1) % k
            if len(l1) == 1:
                bm.faces.new((l0[i], l0[j], l1[0]))
            else:
                bm.faces.new((l0[i], l0[j], l1[j], l1[i]))
    if cap:
        caps = [bm.faces.new(loops[0]), bm.faces.new(loops[-1])]
        bmesh.ops.triangulate(bm, faces=caps)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return with_mat(mesh_object(name, bm), mat)


def prism(name, pts2d, axis, d0, d1, mat):
    """2D polygon extruded along an axis: 'x' -> pts (y, z); 'y' -> pts (x, z); 'z' -> pts (x, y)."""
    def p3(a, b, d):
        return {'x': (d, a, b), 'y': (a, d, b), 'z': (a, b, d)}[axis]
    return loft(name, [[p3(a, b, d0) for a, b in pts2d], [p3(a, b, d1) for a, b in pts2d]], mat)


def cyl(name, p0, p1, r, segs, mat, off=0.0, cap=True):
    """Round log / post from p0 to p1."""
    a, b = Vector(p0), Vector(p1)
    _, t, u = _frame(a, b)
    ring = [(t * math.cos(off + 2 * math.pi * i / segs) + u * math.sin(off + 2 * math.pi * i / segs)) * r
            for i in range(segs)]
    return loft(name, [[a + q for q in ring], [b + q for q in ring]], mat, cap=cap)


def circle(c, r, z, segs, off=0.0):
    return [(c[0] + math.cos(off + 2 * math.pi * i / segs) * r, c[1] + math.sin(off + 2 * math.pi * i / segs) * r, z)
            for i in range(segs)]


def ring(name, c, axis, r0, r1, w, segs, mat, off=0.0):
    """Flat ring (wheel rim, handle) around centre c; axis 'y' = in the x-z plane, 'x' = in the y-z plane."""
    bm = bmesh.new()
    loops = []
    for i in range(segs):
        a = off + 2 * math.pi * i / segs
        ca, sa = math.cos(a), math.sin(a)
        q = []
        for rr, d in ((r1, -w / 2), (r1, w / 2), (r0, w / 2), (r0, -w / 2)):
            if axis == 'y':
                q.append(bm.verts.new((c[0] + ca * rr, c[1] + d, c[2] + sa * rr)))
            else:
                q.append(bm.verts.new((c[0] + d, c[1] + ca * rr, c[2] + sa * rr)))
        loops.append(q)
    for i in range(segs):
        l0, l1 = loops[i], loops[(i + 1) % segs]
        for k in range(4):
            m = (k + 1) % 4
            bm.faces.new((l0[k], l0[m], l1[m], l1[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return with_mat(mesh_object(name, bm), mat)


def octa(name, c, r, mat, rng, squash=1.0):
    bm = bmesh.new()
    pts = [Vector(p) * r * (1 + rng.uniform(-0.2, 0.2)) for p in
           ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))]
    v = [bm.verts.new(Vector((p.x, p.y, p.z * squash)) + Vector(c)) for p in pts]
    for a, b in ((0, 2), (2, 1), (1, 3), (3, 0)):
        bm.faces.new((v[a], v[b], v[4]))
        bm.faces.new((v[b], v[a], v[5]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return with_mat(mesh_object(name, bm), mat)


def rotate_x(objs, pivot, angle):
    """Rotates the mesh data of objs around the x axis through pivot (y, z)."""
    m = Matrix.Rotation(angle, 4, 'X')
    pv = Vector((0, pivot[0], pivot[1]))
    for o in objs:
        for v in o.data.vertices:
            v.co = m @ (v.co - pv) + pv


def team_faces(obj, mat_name, key=2):
    """Faces of obj that carry the material `mat_name` -> {face index: key} for finish()."""
    idx = [i for i, s in enumerate(obj.material_slots) if s.material and s.material.name == mat_name]
    return {p.index: key for p in obj.data.polygons if p.material_index in idx}


# ---------------------------------------------------------------- wagon

def arch(a, b, z0, n=9, e=0.7):
    """Rounded-box arch over y in [-a, a], from z0 up to z0 + b; points from +y to -y."""
    pts = []
    for k in range(n):
        t = math.pi * k / (n - 1)
        c, s = math.cos(t), math.sin(t)
        pts.append((a * math.copysign(abs(c) ** e, c), z0 + b * abs(s) ** e))
    return pts


def wheel(name, c, r, M):
    parts = [ring(f'{name}_rim', c, 'y', r - 0.03, r, 0.035, 10, M.timber, off=math.pi / 10),
             loft(f'{name}_tyre', [[(c[0] + math.cos(a) * (r + 0.004), c[1] + d, c[2] + math.sin(a) * (r + 0.004))
                                    for a in (math.pi / 10 + 2 * math.pi * i / 10 for i in range(10))]
                                   for d in (-0.015, 0.015)], M.iron, cap=False),
             cyl(f'{name}_hub', (c[0], c[1] - 0.04, c[2]), (c[0], c[1] + 0.04, c[2]), 0.04, 6, M.timber)]
    for k in range(3):
        a = k * math.pi / 3 + math.pi / 6
        parts.append(box(f'{name}_spoke{k}', c, (2 * (r - 0.025), 0.018, 0.022), M.timber, rot=(0, a, 0)))
    return parts


def wagon_idle():
    reset()
    M = Mats()
    parts = []
    x0, x1, hw, zb, zt = -0.27, 0.43, 0.24, 0.22, 0.44
    # plank box with dark corner posts and top rails, an under-frame and the axles
    parts.append(box('body', ((x0 + x1) / 2, 0, (zb + zt) / 2), (x1 - x0, 2 * hw, zt - zb), M.wood))
    for x in (x0, x1):
        for sy in (-1, 1):
            parts.append(box('post', (x, sy * hw, (zb + zt) / 2 + 0.01), (0.04, 0.04, zt - zb + 0.04), M.timber))
            parts.append(box('corner', (x, sy * hw, zb + 0.02), (0.05, 0.05, 0.04), M.iron))
    for sy in (-1, 1):
        parts.append(box('rail', ((x0 + x1) / 2, sy * (hw + 0.004), zt), (x1 - x0, 0.03, 0.03), M.timber))
        parts.append(box('sill', ((x0 + x1) / 2, sy * (hw + 0.004), zb + 0.015), (x1 - x0, 0.03, 0.03), M.timber))
    parts.append(box('frame', ((x0 + x1) / 2, 0, zb - 0.02), (x1 - x0 + 0.04, 0.2, 0.04), M.timber, skip=('+z',)))
    wr = 0.19
    wx = (-0.1, 0.3)
    for i, x in enumerate(wx):
        parts.append(beam(f'axle{i}', (x, -0.3, wr), (x, 0.3, wr), 0.04, M.timber))
        for sy in (-1, 1):
            parts += wheel(f'wheel{i}{sy}', (x, sy * 0.31, wr + 0.004), wr, M)
    # canvas top: thick arch lofted along x with flared ends, three hoop bands, dark inside
    a, b, zc = 0.27, 0.4, zt - 0.02
    outer = arch(a, b, zc)
    inner = list(reversed(arch(a - 0.018, b - 0.018, zc)))
    xs = [(x0 - 0.06, 1.07), (x0 + 0.01, 1.0), ((x0 + x1) / 2, 0.97), (x1 - 0.01, 1.0), (x1 + 0.06, 1.07)]

    def scale_at(x):
        for (xa, sa), (xb, sb) in zip(xs, xs[1:]):
            if xa <= x <= xb:
                return sa + (sb - sa) * (x - xa) / (xb - xa)
        return 1.0

    def scaled(pts, s, grow=0.0):
        return [(y * s * (1 + grow), zc + (z - zc) * s * (1 + grow)) for y, z in pts]

    rings = [[(x, y, z) for y, z in scaled(outer + inner, s)] for x, s in xs]
    parts.append(loft('canvas', rings, M.canvas))
    for i, x in enumerate((x0 + 0.08, (x0 + x1) / 2, x1 - 0.08)):
        s = scale_at(x)
        pro = scaled(outer, s, 0.03) + list(reversed(scaled(outer, s, 0.0)))
        parts.append(prism(f'hoop{i}', pro, 'x', x - 0.016, x + 0.016, M.hoop))
    for i, x in enumerate((x0 + 0.1, x1 - 0.1)):
        pro = [(y, z) for y, z in scaled(inner, 0.99)]
        parts.append(prism(f'inside{i}', pro, 'x', x - 0.005, x + 0.005, M.dark))
    # shaft to the west with a crossbar and iron cap
    parts.append(beam('shaft', (x0 + 0.05, 0, zb - 0.01), (-0.64, 0, 0.15), 0.04, M.timber))
    parts.append(beam('shaft_brace0', (x0 + 0.02, -0.09, zb - 0.02), (x0 - 0.16, 0, 0.19), 0.03, M.timber))
    parts.append(beam('shaft_brace1', (x0 + 0.02, 0.09, zb - 0.02), (x0 - 0.16, 0, 0.19), 0.03, M.timber))
    parts.append(beam('crossbar', (-0.6, -0.08, 0.155), (-0.6, 0.08, 0.155), 0.03, M.timber))
    parts.append(box('shaft_cap', (-0.645, 0, 0.15), (0.03, 0.05, 0.05), M.iron))
    # barrel lashed to the south side at the rear, on a little bracket
    bc, br, bz0, bh = (0.31, -0.31), 0.068, zt - 0.06, 0.17
    parts.append(box('bracket', (bc[0], -hw - 0.04, bz0 - 0.01), (0.15, 0.1, 0.025), M.timber))
    parts.append(loft('barrel', [circle(bc, br * 0.86, bz0, 8), circle(bc, br, bz0 + bh * 0.5, 8),
                                 circle(bc, br * 0.86, bz0 + bh, 8)], M.barrel))
    for k, z in enumerate((0.18, 0.82)):
        parts.append(loft(f'bhoop{k}', [circle(bc, br * 0.97, bz0 + bh * z - 0.012, 8),
                                        circle(bc, br * 0.97, bz0 + bh * z + 0.012, 8)], M.iron, cap=False))
    parts.append(loft('lash', [circle(bc, br * 1.03, bz0 + bh * 0.5 - 0.01, 8),
                               circle(bc, br * 1.03, bz0 + bh * 0.5 + 0.01, 8)], M.rope, cap=False))
    obj = join(parts, 'wagon_idle')
    finish(obj, 'wagon_idle', size=512)


# ---------------------------------------------------------------- tent

def tent_idle():
    reset()
    M = Mats()
    rng = random.Random(21)
    parts = []
    hx, yf, yb, zr, th = 0.34, -0.26, 0.29, 0.52, 0.016
    # two canvas slopes (eaves a little longer than the ridge) and the closed back gable
    for s in (-1, 1):
        ex = s * hx
        nx = Vector((s * zr, 0, hx)).normalized() * th
        lo = [Vector((ex, yf - 0.03, 0.0)), Vector((ex, yb + 0.03, 0.0)), Vector((0, yb, zr)), Vector((0, yf, zr))]
        parts.append(hexa(f'slope{s}', lo + [p + nx for p in lo], M.canvas))
    parts.append(prism('back', [(-hx + 0.01, 0.0), (hx - 0.01, 0.0), (0.0, zr - 0.01)], 'y', yb - 0.02, yb, M.canvas))
    # front: canvas gable with a dark opening, flap edges tied back with rope
    parts.append(prism('front', [(-hx + 0.01, 0.0), (hx - 0.01, 0.0), (0.0, zr - 0.01)], 'y', yf, yf + 0.02,
                       M.canvas))
    parts.append(prism('opening', [(-0.13, 0.0), (0.13, 0.0), (0.0, zr - 0.07)], 'y', yf - 0.006, yf, M.dark))
    for s in (-1, 1):
        parts.append(prism(f'flap{s}', [(s * 0.13, 0.0), (s * 0.2, 0.0), (s * 0.03, zr - 0.06)], 'y', yf - 0.016,
                           yf - 0.004, M.canvas))
        parts.append(beam(f'tie{s}', (s * 0.12, yf - 0.02, 0.2), (s * 0.18, yf - 0.02, 0.2), 0.014, M.rope))
    # ridge pole, front pole (carries the banner) and back pole with knob
    parts.append(beam('ridge', (0, yf - 0.05, zr + 0.01), (0, yb + 0.05, zr + 0.01), 0.026, M.timber))
    parts.append(beam('pole_f', (0, yf - 0.04, 0.0), (0, yf - 0.04, 0.84), 0.026, M.timber))
    parts.append(beam('pole_b', (0, yb + 0.04, 0.0), (0, yb + 0.04, zr + 0.04), 0.026, M.timber))
    parts.append(octa('knob_f', (0, yf - 0.04, 0.85), 0.022, M.timber, rng))
    parts.append(octa('knob_b', (0, yb + 0.04, zr + 0.05), 0.022, M.timber, rng))
    # banner: notched cloth on the front pole, waving east (team cloth, key 2)
    fy = yf - 0.04
    pts = [(0.012, 0.64), (0.13, 0.645), (0.25, 0.65), (0.21, 0.715), (0.25, 0.78), (0.13, 0.785), (0.012, 0.79)]
    flag = prism('flag', pts, 'y', fy - 0.005, fy + 0.005, M.cloth)
    for v in flag.data.vertices:
        v.co.y += 0.025 * math.sin(v.co.x * 22)
    parts.append(flag)
    # guy ropes from the pole tops to pegs, and stakes at the canvas corners
    for (ya, za), yp in (((yf - 0.04, zr), -0.43), ((yb + 0.04, zr), 0.44)):
        for s in (-1, 1):
            peg = (s * 0.42, yp, 0.0)
            parts.append(beam(f'rope{yp}{s}', (0, ya, za), (peg[0], peg[1], 0.045), 0.009, M.rope))
            parts.append(box(f'peg{yp}{s}', (peg[0], peg[1], 0.03), (0.024, 0.024, 0.06), M.timber,
                             rot=(0, -s * 0.3, 0), skip=('-z',)))
    for s in (-1, 1):
        for y in (yf - 0.03, yb + 0.03):
            parts.append(box(f'stake{s}{y}', (s * (hx + 0.02), y, 0.04), (0.022, 0.022, 0.08), M.timber,
                             skip=('-z',)))
    # bedroll in front of the opening, with two straps
    by, br = yf - 0.12, 0.045
    parts.append(cyl('bedroll', (-0.13, by, br), (0.13, by, br), br, 8, M.leather, off=math.pi / 8))
    for x in (-0.07, 0.07):
        parts.append(cyl(f'strap{x}', (x - 0.012, by, br), (x + 0.012, by, br), br + 0.005, 8, M.dark,
                         off=math.pi / 8, cap=False))
    obj = join(parts, 'tent_idle')
    finish(obj, 'tent_idle', size=256, team_faces=team_faces(obj, 'cloth', 2))


# ---------------------------------------------------------------- campfire

def campfire_idle():
    reset()
    M = Mats()
    rng = random.Random(31)
    parts = []
    fc = (-0.08, 0.0)
    # ring of chunky stones
    n = 10
    for i in range(n):
        a = 2 * math.pi * i / n + rng.uniform(-0.08, 0.08)
        c = (fc[0] + math.cos(a) * 0.2, fc[1] + math.sin(a) * 0.2)
        r, h = rng.uniform(0.048, 0.06), rng.uniform(0.06, 0.08)
        off = rng.uniform(0, 1)
        rings = [[(x + rng.uniform(-0.006, 0.006), y + rng.uniform(-0.006, 0.006), z)
                  for x, y, z in circle(c, r * f, h * zf, 6, off=off + 0.3 * k)]
                 for k, (f, zf) in enumerate(((0.9, 0.0), (1.0, 0.45), (0.7, 0.9)))]
        rings.append([(c[0], c[1], h)])
        parts.append(loft(f'stone{i}', rings, M.stone, cap=False))
    # embers and crossed logs
    parts.append(loft('embers', [circle(fc, 0.13, 0.0, 8), circle(fc, 0.1, 0.03, 8)], M.ember))
    for i in range(5):
        a = 2 * math.pi * i / 5 + 0.3
        p0 = (fc[0] + math.cos(a) * 0.15, fc[1] + math.sin(a) * 0.15, 0.03)
        p1 = (fc[0] - math.cos(a) * 0.03, fc[1] - math.sin(a) * 0.03, 0.15)
        parts.append(cyl(f'log{i}', p0, p1, 0.024, 6, M.char))
    # faceted flames: twisted five-sided cones, a tall one and two side tongues
    for i, (dx, dy, r, h, lean) in enumerate(((0.0, 0.0, 0.08, 0.38, 0.02), (-0.05, -0.03, 0.055, 0.25, -0.05),
                                              (0.055, 0.02, 0.055, 0.27, 0.05))):
        c = Vector((fc[0] + dx, fc[1] + dy, 0.06))
        off = rng.uniform(0, 1)
        rings = []
        for k, (f, zf, sh) in enumerate(((1.0, 0.0, 0.0), (0.85, 0.35, 0.3), (0.5, 0.7, 0.7))):
            rings.append([(x + lean * sh, y, z) for x, y, z in circle(c, r * f, c.z + h * zf, 5, off=off + 0.45 * k)])
        rings.append([(c.x + lean * 1.4, c.y, c.z + h)])
        parts.append(loft(f'flame{i}', rings, M.fire, cap=False))
    # log seat to the east, lying north-south, with light end grain
    sx, sr, sl = 0.25, 0.062, 0.14
    parts.append(cyl('seat', (sx, -sl, sr), (sx, sl, sr), sr, 7, M.log, cap=False))
    for y in (-sl, sl):
        parts.append(cyl(f'seat_end{y}', (sx, y - 0.004 * (1 if y > 0 else -1), sr), (sx, y + 0.004 * (1 if y > 0 else -1), sr),
                         sr - 0.004, 7, M.endgrain))
    obj = join(parts, 'campfire_idle')
    finish(obj, 'campfire_idle', size=256)


# ---------------------------------------------------------------- chest

CW, CD, CH, CL = 0.27, 0.17, 0.27, 0.16  # half width (x), half depth (y), body height, lid rise


def lid_profile(grow=0.0):
    """Closed (y, z) profile of the domed lid, base at the seam."""
    return [(-CD - grow, CH), (CD + grow, CH)] + [(y, z) for y, z in arch(CD + grow, CL + grow, CH, n=9, e=0.8)[1:-1]]


def chest(state):
    reset()
    M = Mats()
    rng = random.Random(41)
    parts, lid = [], []
    t = 0.028
    if state == 'closed':
        parts.append(box('body', (0, 0, CH / 2), (2 * CW, 2 * CD, CH), M.wood, skip=('-z',)))
    else:
        parts.append(box('fill', (0, 0, (CH - 0.03) / 2), (2 * CW - 0.01, 2 * CD - 0.01, CH - 0.03), M.gold,
                         skip=('-z',)))
        for sy in (-1, 1):
            parts.append(box(f'wall_y{sy}', (0, sy * (CD - t / 2), CH / 2), (2 * CW, t, CH), M.wood, skip=('-z',)))
        for sx in (-1, 1):
            parts.append(box(f'wall_x{sx}', (sx * (CW - t / 2), 0, CH / 2), (t, 2 * CD - 2 * t, CH), M.wood,
                             skip=('-z',)))
        # heap of gold and loose coins on top
        heap = []
        for f, z in ((1.0, CH - 0.03), (0.85, CH + 0.01), (0.5, CH + 0.035)):
            heap.append([(x * (CW - t) / (CD - t) * f, y * f, z) for x, y, _ in circle((0, 0), CD - t, 0, 10)])
        parts.append(loft('heap', heap, M.gold))
        for i in range(9):
            a, d = rng.uniform(0, 2 * math.pi), rng.uniform(0.2, 0.95)
            x, y = math.cos(a) * d * (CW - 0.05), math.sin(a) * d * (CD - 0.05)
            z = CH + 0.05 - 0.04 * d
            coin = cyl(f'coin{i}', (0, 0, -0.004), (0, 0, 0.004), 0.03, 6, M.gold, off=rng.uniform(0, 1))
            m = Matrix.Translation((x, y, z)) @ Euler((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), 0)).to_matrix().to_4x4()
            for v in coin.data.vertices:
                v.co = m @ v.co
            parts.append(coin)
    # body ironwork: seam and foot belts, corner strips, end bands
    e = 0.006
    for name, z, h in (('belt_top', CH - 0.018, 0.036), ('belt_foot', 0.016, 0.032)):
        for sy in (-1, 1):
            parts.append(box(f'{name}{sy}', (0, sy * (CD - 0.008 + e), z), (2 * CW + 2 * e, 0.016 + 2 * e, h), M.iron,
                             skip=('-z',)))
        for sx in (-1, 1):
            parts.append(box(f'{name}x{sx}', (sx * (CW - 0.008 + e), 0, z), (0.016 + 2 * e, 2 * CD, h), M.iron,
                             skip=('-z',)))
    for sx in (-1, 1):
        parts.append(box(f'band{sx}', (sx * (CW - 0.05), 0, CH / 2), (0.04, 2 * CD + 2 * e, CH), M.iron,
                         skip=('-z',)))
        for sy in (-1, 1):
            parts.append(box(f'cstrip{sx}{sy}', (sx * (CW - 0.008), sy * (CD - 0.008), CH / 2), (0.03, 0.03, CH),
                             M.iron, skip=('-z',)))
        # ring handle on the end
        parts.append(box(f'hplate{sx}', (sx * (CW + e), 0, CH * 0.62), (0.01, 0.05, 0.05), M.iron))
        parts.append(ring(f'handle{sx}', (sx * (CW + 0.014), 0, CH * 0.5), 'x', 0.028, 0.04, 0.012, 6, M.iron,
                          off=math.pi / 6))
    # lock plate on the front with keyhole (the hasp sits on the lid)
    parts.append(box('lockplate', (0, -CD - e, CH - 0.06), (0.075, 0.016, 0.085), M.iron))
    parts.append(box('keyhole', (0, -CD - e - 0.009, CH - 0.07), (0.016, 0.004, 0.032), M.dark))
    # lid: domed wood with three iron bands and the hasp
    lid.append(prism('lid', lid_profile(), 'x', -CW, CW, M.wood))
    for x in (-(CW - 0.05), 0.0, CW - 0.05):
        lid.append(prism(f'lband{x}', lid_profile(e), 'x', x - 0.02, x + 0.02, M.iron))
    lid.append(prism('lrim', lid_profile(e), 'x', -CW - e, -CW + 0.02, M.iron))
    lid.append(prism('lrim2', lid_profile(e), 'x', CW - 0.02, CW + e, M.iron))
    lid.append(box('hasp', (0, -CD - e - 0.004, CH + 0.025), (0.045, 0.012, 0.07), M.iron))
    if state == 'open':
        rotate_x(lid, (CD, CH), math.radians(-105))
    obj = join(parts + lid, f'chest_{state}')
    finish(obj, f'chest_{state}', size=256)


def chest_closed():
    chest('closed')


def chest_open():
    chest('open')


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    for fn in (wagon_idle, tent_idle, campfire_idle, chest_closed, chest_open):
        if not only or fn.__name__ in only:
            fn()
