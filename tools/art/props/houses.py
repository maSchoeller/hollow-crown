"""Village house (three states) and farmstead (reference art/props/refs/houses.png, rows 1-4).

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/houses.py

- house_intact: whitewashed cottage with dark timber frame, thick red-brown tile roof (ridge east-west), stone
  chimney on the north slope, lit windows, wooden door on the south front, stone base, bushes at the corners
- house_visited: same house, door swung open with warm light inside, lantern by the door, shutters and a flower box
- house_razed: same footprint burnt out: broken sooty masonry walls with stepped, stony edges, window holes and a
  breach where the door was, charred posts, collapsed roof beams crossing the room, heaps of stones and red roof tiles
  inside and against the walls (smoke comes from the game, not the model)
- farm_idle: farmstead about 1.6 x 0.9 tiles (long side east-west): farmhouse with a thick straw thatch and an
  eyebrow dormer, joined wooden barn with a lower thatch, round haystack, bit of fence, barrels

Writes art/models/props/<id>.glb and art/props/previews/<id>.png. Fixed seeds, so the output is deterministic.
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
    pattern: ('stones', scale, width, dark) darkens voronoi cell edges (mortar);
             ('planks', scale, dark) darkens vertical seams on every wall side (x + y bands)."""
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
        if pattern[0] == 'stones':
            _, scale, width, dark = pattern
            vor = n.new('ShaderNodeTexVoronoi')
            vor.feature = 'DISTANCE_TO_EDGE'
            vor.inputs['Scale'].default_value = scale
            L.new(geo.outputs['Position'], vor.inputs['Vector'])
            mask_src = vor.outputs['Distance']
            lo, hi = 0.0, width
        else:
            _, scale, dark = pattern
            mp = n.new('ShaderNodeMapping')
            mp.inputs['Scale'].default_value = (1, 1, 0)
            L.new(geo.outputs['Position'], mp.inputs['Vector'])
            wav = n.new('ShaderNodeTexWave')
            wav.wave_type = 'BANDS'
            wav.bands_direction = 'DIAGONAL'
            wav.wave_profile = 'SAW'
            wav.inputs['Scale'].default_value = scale
            wav.inputs['Distortion'].default_value = 0.0
            L.new(mp.outputs['Vector'], wav.inputs['Vector'])
            mask_src = wav.outputs['Fac']
            lo, hi = 0.0, 0.14
        mr = n.new('ShaderNodeMapRange')
        mr.inputs['From Min'].default_value = lo
        mr.inputs['From Max'].default_value = hi
        mr.inputs['To Min'].default_value = dark
        mr.inputs['To Max'].default_value = 1.0
        L.new(mask_src, mr.inputs['Value'])
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
        self.plaster = paint('plaster', [(0.0, lin(128, 112, 88)), (0.35, lin(205, 196, 176)), (0.7, lin(236, 230, 214)),
                                         (1.0, lin(248, 245, 236))], z=(0.06, 0.2), wz=0.55, wn=0.3, noise=0.08,
                             nscale=9, seed=1.0, bias=0.1)
        self.timber = paint('timber', [(0.0, lin(52, 32, 20)), (0.5, lin(82, 52, 32)), (1.0, lin(112, 74, 44))],
                            wn=0.5, noise=0.15, nscale=12, stretch=(1, 1, 6), seed=2.0, bias=0.2)
        self.door = paint('door', [(0.0, lin(96, 58, 32)), (0.6, lin(138, 86, 46)), (1.0, lin(168, 108, 60))], wn=0.5,
                          noise=0.12, nscale=14, stretch=(1, 1, 8), seed=3.0, bias=0.2, pattern=('planks', 18.0, 0.55))
        self.glow = paint('glow', [(0.0, lin(240, 140, 40)), (0.6, lin(255, 196, 80)), (1.0, lin(255, 226, 140))],
                          wn=0.6, noise=0.1, nscale=20, seed=4.0, bias=0.2)
        self.stone = paint('stone', [(0.0, lin(96, 92, 86)), (0.5, lin(142, 138, 128)), (1.0, lin(184, 178, 166))],
                           wn=0.4, noise=0.25, nscale=18, seed=5.0, bias=0.25, pattern=('stones', 16.0, 0.09, 0.5))
        self.chimney = paint('chimney', [(0.0, lin(132, 126, 118)), (0.5, lin(186, 180, 168)), (1.0, lin(218, 212, 200))],
                             wn=0.4, noise=0.2, nscale=20, seed=6.0, bias=0.3, pattern=('stones', 22.0, 0.08, 0.6))
        self.soot = flat_mat('soot', lin(26, 22, 20))
        self.deck = paint('deck', [(0.0, lin(70, 30, 22)), (1.0, lin(112, 48, 32))], wn=0.4, noise=0.05, bias=0.3)
        self.tiles = [paint(f'tile{i}', [(0.0, lin(110, 40, 26)), (0.35, c0), (0.7, c1), (1.0, c2)], z=(0.38, 0.75),
                            wz=0.18, wn=0.75, noise=0.06, nscale=10, seed=7.0 + i, bias=-0.05)
                      for i, (c0, c1, c2) in enumerate((
                          (lin(150, 54, 34), lin(186, 74, 46), lin(214, 104, 66)),
                          (lin(138, 48, 32), lin(170, 64, 42), lin(198, 90, 58)),
                          (lin(160, 62, 40), lin(198, 86, 54), lin(226, 120, 78))))]
        self.ridge = paint('ridge', [(0.0, lin(120, 44, 30)), (0.6, lin(176, 70, 46)), (1.0, lin(210, 100, 66))],
                           wn=0.8, noise=0.05, bias=-0.05)
        self.leaf = paint('leaf', [(0.0, lin(26, 62, 12)), (0.4, lin(66, 118, 22)), (0.7, lin(124, 172, 34)),
                                   (1.0, lin(190, 214, 62))], z=(0.0, 0.18), wz=0.45, wn=0.5, noise=0.1, nscale=12,
                          seed=8.0, bias=-0.05)
        self.thatch = paint('thatch', [(0.0, lin(132, 88, 22)), (0.35, lin(196, 146, 36)), (0.7, lin(232, 190, 58)),
                                       (1.0, lin(250, 222, 110))], z=(0.35, 0.75), wz=0.15, wn=0.8, noise=0.3,
                            nscale=6, stretch=(28, 3, 3), seed=9.0, bias=-0.05)
        self.thatch_old = paint('thatch_old', [(0.0, lin(118, 80, 24)), (0.4, lin(176, 128, 36)),
                                               (0.75, lin(214, 168, 56)), (1.0, lin(236, 200, 96))], z=(0.26, 0.53),
                                wz=0.15, wn=0.8, noise=0.3, nscale=6, stretch=(28, 3, 3), seed=10.0, bias=-0.08)
        self.hay = paint('hay', [(0.0, lin(150, 104, 26)), (0.4, lin(214, 164, 44)), (0.75, lin(240, 204, 70)),
                                 (1.0, lin(252, 230, 130))], z=(0.0, 0.32), wz=0.35, wn=0.45, noise=0.2, nscale=8,
                         stretch=(3, 3, 22), seed=11.0, bias=-0.05)
        self.planks = paint('planks', [(0.0, lin(70, 44, 26)), (0.5, lin(106, 68, 40)), (1.0, lin(140, 92, 54))],
                            wn=0.45, noise=0.14, nscale=12, stretch=(1, 1, 8), seed=12.0, bias=0.2,
                            pattern=('planks', 16.0, 0.5))
        self.flower_w = flat_mat('flower_w', lin(246, 244, 232))
        self.flower_r = flat_mat('flower_r', lin(222, 70, 84))
        self.metal = flat_mat('metal', lin(40, 38, 36))
        self.char = paint('char', [(0.0, lin(14, 12, 11)), (0.5, lin(34, 29, 26)), (1.0, lin(66, 56, 48))], wn=0.6,
                          noise=0.18, nscale=16, stretch=(1, 1, 5), seed=13.0, bias=0.0)
        self.sooty = paint('sooty', [(0.0, lin(150, 136, 114)), (0.3, lin(176, 164, 144)), (0.55, lin(112, 100, 88)),
                                     (0.8, lin(46, 40, 36)), (1.0, lin(22, 19, 18))], z=(0.07, 0.42), wz=0.85,
                           wn=0.15, noise=0.18, nscale=8, seed=14.0, bias=0.0)
        self.ash = paint('ash', [(0.0, lin(28, 24, 22)), (0.5, lin(52, 46, 42)), (1.0, lin(88, 80, 72))], wn=0.4,
                         noise=0.3, nscale=14, seed=15.0, bias=0.1)
        self.rubble = paint('rubble', [(0.0, lin(96, 92, 86)), (0.5, lin(140, 136, 128)), (1.0, lin(180, 176, 166))],
                            wn=0.7, noise=0.15, nscale=20, seed=16.0, bias=-0.1)


def with_mat(obj, mat):
    obj.data.materials.append(mat)
    return obj


# ---------------------------------------------------------------- geometry

def _faces_hexa(bm, v):
    for f in ((0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        bm.faces.new([v[i] for i in f])


def hexa(name, pts, mat, skip_bottom=False):
    """Six-sided solid from 8 corners: bottom quad 0-3, top quad 4-7 (same winding)."""
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in pts]
    _faces_hexa(bm, v)
    if skip_bottom:
        bm.faces.remove(next(f for f in bm.faces if set(f.verts) == set(v[:4])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return with_mat(mesh_object(name, bm), mat)


def box(name, c, s, mat, rot=(0, 0, 0), skip=()):
    """Axis box of size s around centre c, rotated by euler rot (radians); skip: face directions to drop
    before rotation, e.g. ('-z', '+y')."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    dirs = {'+x': (1, 0, 0), '-x': (-1, 0, 0), '+y': (0, 1, 0), '-y': (0, -1, 0), '+z': (0, 0, 1), '-z': (0, 0, -1)}
    bm.normal_update()
    drop = [f for f in bm.faces if any(f.normal.dot(Vector(dirs[d])) > 0.9 for d in skip)]
    for f in drop:
        bm.faces.remove(f)
    for v in list(bm.verts):
        if not v.link_faces:
            bm.verts.remove(v)
    e = Euler(rot)
    for v in bm.verts:
        p = Vector((v.co.x * s[0], v.co.y * s[1], v.co.z * s[2]))
        p.rotate(e)
        v.co = p + Vector(c)
    return with_mat(mesh_object(name, bm), mat)


def beam(name, p0, p1, w, mat, roll=0.0):
    """Square beam from p0 to p1."""
    a, b = Vector(p0), Vector(p1)
    ax = (b - a).normalized()
    t = ax.orthogonal().normalized()
    u = ax.cross(t)
    t, u = t * math.cos(roll) + u * math.sin(roll), u * math.cos(roll) - t * math.sin(roll)
    h = w / 2
    ring = [(t * sx + u * sy) * h for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    return hexa(name, [a + r for r in ring] + [b + r for r in ring], mat)


def loft(name, rings, mat, cap=True):
    """Solid through rings of equal vertex count [[xyz, ...], ...]; end caps triangulated (may be concave)."""
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
    """2D polygon extruded along an axis: axis 'x' -> pts (y, z); 'y' -> pts (x, z)."""
    def p3(a, b, d):
        return (d, a, b) if axis == 'x' else (a, d, b)
    return loft(name, [[p3(a, b, d0) for a, b in pts2d], [p3(a, b, d1) for a, b in pts2d]], mat)


def clump(name, c, r, rng, mat, squash=(1.0, 1.0, 0.85), jitter=0.15):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)
    for v in bm.verts:
        d = 1.0 + rng.uniform(-jitter, jitter)
        v.co = Vector((v.co.x * d * squash[0], v.co.y * d * squash[1], v.co.z * d * squash[2])) + Vector(c)
        v.co.z = max(v.co.z, 0.0)
    return with_mat(mesh_object(name, bm), mat)


def bush(name, c, r, rng, mat, n=2):
    parts = []
    for i in range(n):
        a = rng.uniform(0, 2 * math.pi)
        off = Vector((math.cos(a), math.sin(a), 0)) * r * 0.55 if i else Vector()
        rr = r * (1.0 if i == 0 else rng.uniform(0.7, 0.85))
        parts.append(clump(f'{name}{i}', (c[0] + off.x, c[1] + off.y, rr * 0.8), rr, rng, mat, squash=(1.0, 1.0, 1.0)))
    return parts


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


def circle(c, r, z, segs, off=0.0):
    return [(c[0] + math.cos(off + 2 * math.pi * i / segs) * r, c[1] + math.sin(off + 2 * math.pi * i / segs) * r, z)
            for i in range(segs)]


# window and door on a wall face; `face` = 'y' (south front, outward -y at y=at), 'x-' / 'x+' (west / east gable)

def _wall_box(face, at, u, z, su, sz, depth, out, mat, name):
    """Box on a wall face: u = position along the wall, out = how far its front stands proud of the wall."""
    if face == 'y':
        return box(name, (u, at - out + depth / 2, z), (su, depth, sz), mat, skip=('+y',))
    sign = -1 if face == 'x-' else 1
    return box(name, (at + sign * (out - depth / 2), u, z), (depth, su, sz), mat, skip=('+x',) if sign < 0 else ('-x',))


def window(face, at, u, z, w, h, M, name, glass=None, frame=None, bars=True):
    parts = [_wall_box(face, at, u, z, w + 0.03, h + 0.03, 0.03, 0.012, frame or M.timber, f'{name}_frame'),
             _wall_box(face, at, u, z, w, h, 0.03, 0.017, glass or M.glow, f'{name}_glass')]
    if bars:
        parts += [_wall_box(face, at, u, z, w, 0.014, 0.03, 0.023, M.timber, f'{name}_mh'),
                  _wall_box(face, at, u, z, 0.014, h, 0.03, 0.023, M.timber, f'{name}_mv')]
    return parts


# ---------------------------------------------------------------- cottage

W, D = 0.36, 0.26          # half wall size x / y (outer faces)
BASE_Z, WALL_TOP = 0.075, 0.46
EAVE_Y, EAVE_Z, RIDGE_Z = 0.335, 0.4, 0.72
ROOF_X = 0.43


def slope_frame(s):
    """Point function P(x, t, h) on the roof slope s (-1 south, +1 north): t along the slope from the eave, h out."""
    dy, dz = -s * EAVE_Y, RIDGE_Z - EAVE_Z
    ln = math.hypot(dy, dz)
    v = Vector((0, dy / ln, dz / ln))
    nrm = Vector((0, s * dz / ln, EAVE_Y / ln))
    e = Vector((0, s * EAVE_Y, EAVE_Z))

    def P(x, t, h):
        return Vector((x, 0, 0)) + e + v * t + nrm * h
    return P, ln


def tile_roof(M, rng):
    parts = []
    rows, per_row, gap = 4, 7, 0.008
    tw = 2 * ROOF_X / per_row
    for s in (-1, 1):
        P, ln = slope_frame(s)
        # deck under the tiles (dark, shows as the soft overhang edge)
        parts.append(hexa(f'deck{s}', [P(-ROOF_X - 0.01, -0.01, -0.025), P(ROOF_X + 0.01, -0.01, -0.025),
                                       P(ROOF_X + 0.01, ln, -0.025), P(-ROOF_X - 0.01, ln, -0.025),
                                       P(-ROOF_X - 0.01, -0.01, 0.0), P(ROOF_X + 0.01, -0.01, 0.0),
                                       P(ROOF_X + 0.01, ln, 0.0), P(-ROOF_X - 0.01, ln, 0.0)], M.deck))
        step = ln / rows
        for r in range(rows):
            t0 = r * step - (0.03 if r == 0 else 0.0)
            t1 = min(r * step + step * 1.5, ln + 0.01)
            off = (tw / 2) if r % 2 else 0.0
            edges = sorted({-ROOF_X, ROOF_X} | {x for x in (-ROOF_X + off + k * tw for k in range(per_row + 1))
                                                 if -ROOF_X < x < ROOF_X})
            for k, (x0, x1) in enumerate(zip(edges, edges[1:])):
                if x1 - x0 < 0.02:
                    continue
                xa, xb = x0 + gap / 2, x1 - gap / 2
                th0 = 0.055 * rng.uniform(0.85, 1.15)
                th1 = 0.012
                dt = rng.uniform(-0.006, 0.006)
                pts = [P(xa, t0 + dt, 0), P(xb, t0 + dt, 0), P(xb, t1, 0), P(xa, t1, 0),
                       P(xa, t0 + dt, th0), P(xb, t0 + dt, th0 * rng.uniform(0.9, 1.1)), P(xb, t1, th1),
                       P(xa, t1, th1)]
                parts.append(hexa(f'tile{s}_{r}_{k}', pts, rng.choice(M.tiles), skip_bottom=True))
    # ridge: a run of chunky ridge tiles (tent-shaped)
    n = 5
    for k in range(n):
        x0 = -ROOF_X - 0.01 + k * (2 * ROOF_X + 0.02) / n
        x1 = x0 + (2 * ROOF_X + 0.02) / n - 0.006
        zr = RIDGE_Z + 0.005
        pro = [(-0.075, zr - 0.02), (0.0, zr + 0.06), (0.075, zr - 0.02), (0.0, zr + 0.01)]
        parts.append(prism(f'ridge{k}', pro, 'x', x0, x1, M.ridge))
    return parts


def chimney(M, x, y, z0, z1, w=0.11):
    return [box('chim', (x, y, (z0 + z1) / 2), (w, w, z1 - z0), M.chimney, skip=('-z',)),
            box('chim_cap', (x, y, z1 + 0.012), (w + 0.03, w + 0.03, 0.03), M.chimney, skip=('-z',)),
            box('chim_hole', (x, y, z1 + 0.026), (w - 0.035, w - 0.035, 0.004), M.soot, skip=('-z',))]


def cottage_shell(M):
    parts = [box('base', (0, 0, BASE_Z / 2), (2 * W + 0.05, 2 * D + 0.05, BASE_Z), M.stone, skip=('-z',))]
    # walls with gables east and west (ridge runs east-west)
    gable = [(-D, BASE_Z - 0.01), (D, BASE_Z - 0.01), (D, WALL_TOP), (0.0, RIDGE_Z - 0.04), (-D, WALL_TOP)]
    parts.append(prism('walls', gable, 'x', -W, W, M.plaster))
    # timber frame: corner posts, sill and eave beams on the long sides, eave beam + king post on the gables
    tw, tz = 0.034, 0.008
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(box(f'post{sx}{sy}', (sx * (W - tw / 2 + tz), sy * (D - tw / 2 + tz), (BASE_Z + WALL_TOP) / 2),
                             (tw, tw, WALL_TOP - BASE_Z), M.timber, skip=('-z',)))
    for sy in (-1, 1):
        parts.append(box(f'eave{sy}', (0, sy * (D + tz / 2 - 0.01), WALL_TOP - 0.02), (2 * W, 0.02 + tz, 0.035),
                         M.timber, skip=('-y',) if sy > 0 else ('+y',)))
        parts.append(box(f'sill{sy}', (0, sy * (D + tz / 2 - 0.01), BASE_Z + 0.018), (2 * W, 0.02 + tz, 0.03),
                         M.timber, skip=('-y',) if sy > 0 else ('+y',)))
    for sx in (-1, 1):
        parts.append(box(f'geave{sx}', (sx * (W + tz / 2 - 0.01), 0, WALL_TOP - 0.02), (0.02 + tz, 2 * D, 0.035),
                         M.timber, skip=('-x',) if sx > 0 else ('+x',)))
        parts.append(box(f'kpost{sx}', (sx * (W + tz / 2 - 0.01), 0, (WALL_TOP + RIDGE_Z - 0.06) / 2),
                         (0.02 + tz, 0.03, RIDGE_Z - 0.06 - WALL_TOP), M.timber, skip=('-x',) if sx > 0 else ('+x',)))
        parts += window('x-' if sx < 0 else 'x+', sx * W, 0.0, 0.25, 0.09, 0.09, M, f'gwin{sx}')
    parts += window('y', -D, -0.17, 0.25, 0.12, 0.11, M, 'fwin')
    parts.append(box('step', (0.1, -D - 0.045, 0.02), (0.17, 0.07, 0.04), M.stone, skip=('-z',)))
    parts += chimney(M, 0.2, 0.13, 0.45, 0.86)
    return parts


def door_closed(M):
    return [_wall_box('y', -D, 0.1, 0.075 + 0.125, 0.165, 0.25, 0.03, 0.012, M.timber, 'dframe'),
            _wall_box('y', -D, 0.1, 0.075 + 0.115, 0.13, 0.23, 0.03, 0.02, M.door, 'door'),
            box('knob', (0.145, -D - 0.026, 0.19), (0.012, 0.012, 0.012), M.metal)]


def door_open(M):
    hinge = Vector((0.165, -D - 0.02, 0.075))
    leaf = box('door', (0, 0, 0), (0.13, 0.02, 0.23), M.door)
    for v in leaf.data.vertices:
        p = Vector((v.co.x - 0.065, v.co.y, v.co.z + 0.115))  # hinge edge at local x = 0
        p.rotate(Euler((0, 0, math.radians(-105))))
        v.co = p + hinge
    return [_wall_box('y', -D, 0.1, 0.075 + 0.125, 0.165, 0.25, 0.03, 0.012, M.timber, 'dframe'),
            _wall_box('y', -D, 0.1, 0.075 + 0.115, 0.13, 0.23, 0.03, 0.016, M.glow, 'doorway'), leaf]


def corner_bushes(M, rng):
    parts = []
    for i, (c, r) in enumerate((((-0.37, -0.285), 0.085), ((0.37, -0.29), 0.08), ((-0.37, 0.28), 0.075),
                                ((0.365, 0.285), 0.07))):
        parts += bush(f'bush{i}', c, r, rng, M.leaf, n=3)
    return parts


def house(state):
    reset()
    M = Mats()
    parts = cottage_shell(M) + tile_roof(M, random.Random(11)) + corner_bushes(M, random.Random(12))
    if state == 'intact':
        parts += door_closed(M)
    else:
        parts += door_open(M)
        rng = random.Random(13)
        # lantern on a bracket right of the door
        parts.append(box('lbracket', (0.235, -D - 0.035, 0.33), (0.014, 0.07, 0.014), M.metal))
        parts.append(box('lantern', (0.235, -D - 0.065, 0.275), (0.05, 0.05, 0.075), M.glow))
        parts.append(box('lcap', (0.235, -D - 0.065, 0.32), (0.064, 0.064, 0.02), M.metal))
        parts.append(box('lfoot', (0.235, -D - 0.065, 0.233), (0.056, 0.056, 0.012), M.metal))
        # shutters and flower box at the front window
        for sgn in (-1, 1):
            parts.append(_wall_box('y', -D, -0.17 + sgn * 0.102, 0.25, 0.05, 0.14, 0.03, 0.02, M.door, f'shut{sgn}'))
        parts.append(box('fbox', (-0.17, -D - 0.03, 0.175), (0.15, 0.045, 0.035), M.door))
        for k in range(5):
            x = -0.225 + k * 0.028
            parts.append(octa(f'leaf{k}', (x, -D - 0.03, 0.198), 0.022, M.leaf, rng, squash=0.7))
            parts.append(octa(f'fl{k}', (x + 0.006, -D - 0.042, 0.212), 0.012, M.flower_w if k % 2 else M.flower_r,
                              rng))
    obj = join(parts, f'house_{state}')
    finish(obj, f'house_{state}', size=512)


def house_intact():
    house('intact')


def house_visited():
    house('visited')


def stepped(u0, u1, steps, rng, z0=BASE_Z):
    """Wall outline (u, z) from u0 to u1: flat bottom, top made of steps [(u_end, height), ...] left to right with
    small random nicks, so the broken top reads as courses of masonry that fell away block by block."""
    pts = [(u0, z0), (u1, z0)]
    top = []
    u = u0
    for k, (ue, h) in enumerate(steps):
        ue = u1 if k == len(steps) - 1 else ue
        top += [(u, h + rng.uniform(-0.008, 0.008)), (ue, h + rng.uniform(-0.008, 0.008))]
        u = ue
    return pts + top[::-1]


def razed_wall(name, face, at, u0, u1, steps, mat, rng, t=0.045):
    """Broken wall slab on a side: face 'y-' / 'y+' (south / north, u = x) or 'x-' / 'x+' (west / east, u = y)."""
    pro = stepped(u0, u1, steps, rng)
    axis = 'y' if face[0] == 'y' else 'x'
    d0, d1 = (at, at + t) if face[1] == '-' else (at - t, at)
    return prism(name, pro, axis, d0, d1, mat)


def edge_stones(name, face, at, pts, mat, rng, t=0.045):
    """Loose masonry blocks sitting proud on the broken top of a wall (u, z) and jutting out of its ends."""
    parts = []
    for i, (u, z) in enumerate(pts):
        sx, sz = rng.uniform(0.045, 0.07), rng.uniform(0.03, 0.045)
        depth = t + rng.uniform(0.006, 0.02)
        mid = at + (t / 2 if face[1] == '-' else -t / 2)
        c = (u, mid, z) if face[0] == 'y' else (mid, u, z)
        s = (sx, depth, sz) if face[0] == 'y' else (depth, sx, sz)
        parts.append(box(f'{name}{i}', c, s, mat, rot=(rng.uniform(-0.15, 0.15), rng.uniform(-0.15, 0.15),
                                                             rng.uniform(-0.2, 0.2)), skip=('-z',)))
    return parts


def house_razed():
    reset()
    M = Mats()
    rng = random.Random(31)
    t = 0.045
    # burnt plaster over rubble masonry: sooty ramp (dark towards the broken tops) with stone joints showing through
    wall = paint('masonry', [(0.0, lin(150, 136, 114)), (0.3, lin(184, 172, 150)), (0.55, lin(128, 114, 98)),
                             (0.8, lin(60, 52, 46)), (1.0, lin(30, 26, 24))], z=(0.07, 0.46), wz=0.8, wn=0.2,
                 noise=0.22, nscale=9, seed=14.0, bias=0.0, pattern=('stones', 12.0, 0.1, 0.42))
    # rubble heaps: crushed stone and brick-red tile shards (noise picks the colour), rubble joints over it
    heap_mat = paint('heap', [(0.0, lin(48, 42, 38)), (0.3, lin(92, 84, 76)), (0.48, lin(136, 126, 114)),
                              (0.56, lin(150, 62, 40)), (0.64, lin(178, 78, 50)), (0.72, lin(128, 118, 106)),
                              (1.0, lin(176, 166, 152))],
                     wn=0.5, noise=0.5, nscale=22, seed=17.0, bias=-0.05, pattern=('stones', 30.0, 0.12, 0.5))
    block = paint('block', [(0.0, lin(96, 86, 74)), (0.5, lin(146, 134, 116)), (1.0, lin(188, 176, 156))], wn=0.6,
                  noise=0.15, nscale=20, seed=18.0, bias=-0.05)
    parts = [box('base', (0, 0, BASE_Z / 2), (2 * W + 0.05, 2 * D + 0.05, BASE_Z), M.stone, skip=('-z',)),
             box('debris', (0, 0, BASE_Z + 0.02), (2 * W - 0.06, 2 * D - 0.06, 0.05), M.ash, skip=('-z',))]
    # broken masonry walls: stepped tops, a window hole in the front and the west gable, a breach where the door was
    # front (south): tall west end, window hole (sill 0.19, lintel above), breach at the door down to knee height
    parts.append(razed_wall('wf', 'y-', -D, -W, W, [(-0.27, 0.42), (-0.2, 0.38), (-0.1, 0.35), (-0.06, 0.3),
                                                     (-0.02, 0.22), (0.03, 0.14), (0.13, 0.1), (0.19, 0.19),
                                                     (0.25, 0.27), (0.3, 0.35), (W, 0.31)], wall, rng))
    # back (north): mostly standing, ragged top with one deep notch
    parts.append(razed_wall('wb', 'y+', D, -W, W, [(-0.26, 0.34), (-0.16, 0.42), (-0.08, 0.36), (0.0, 0.23),
                                                    (0.07, 0.27), (0.16, 0.38), (0.26, 0.44), (W, 0.37)], wall, rng))
    # west gable: window hole south of the middle, the gable point broken off in steps
    parts.append(razed_wall('ww', 'x-', -W, -D, D, [(-0.17, 0.35), (-0.1, 0.38), (0.05, 0.16), (0.09, 0.3),
                                                     (0.14, 0.47), (0.2, 0.42), (D, 0.37)], wall, rng))
    # east gable: fallen low, a stump at the north corner
    parts.append(razed_wall('we', 'x+', W, -D, D, [(-0.17, 0.29), (-0.07, 0.2), (0.05, 0.14), (0.14, 0.24),
                                                    (D, 0.36)], wall, rng))
    # loose stones on the broken edges (u, z): where steps drop and at the ends
    parts += edge_stones('esf', 'y-', -D, [(-0.3, 0.43), (-0.08, 0.36), (-0.03, 0.31), (0.01, 0.23), (0.16, 0.12),
                                           (0.22, 0.2), (0.28, 0.29)], block, rng)
    parts += edge_stones('esb', 'y+', D, [(-0.2, 0.44), (0.03, 0.25), (0.22, 0.46)], block, rng)
    parts += edge_stones('esw', 'x-', -W, [(-0.12, 0.39), (0.0, 0.17), (0.07, 0.31), (0.12, 0.48)], block, rng)
    parts += edge_stones('ese', 'x+', W, [(-0.12, 0.31), (0.0, 0.16), (0.2, 0.38)], block, rng)
    # burnt-out windows: charred frame and cross, black hole behind
    parts += window('y', -D, -0.17, 0.25, 0.12, 0.11, M, 'fwin', glass=M.soot, frame=M.char)
    parts += window('x-', -W, -0.15, 0.24, 0.09, 0.09, M, 'gwin', glass=M.soot, frame=M.char)
    # charred corner posts at broken heights
    for i, (x, y, h) in enumerate(((-W - 0.004, -D - 0.004, 0.43), (W + 0.004, -D - 0.004, 0.3),
                                   (-W - 0.004, D + 0.004, 0.46), (W + 0.004, D + 0.004, 0.4),
                                   (0.02, -D - 0.004, 0.3))):
        parts.append(box(f'post{i}', (x, y, (BASE_Z + h) / 2), (0.036, 0.036, h - BASE_Z), M.char, skip=('-z',),
                         rot=(0, 0, rng.uniform(-0.1, 0.1))))
    # collapsed roof: rafters fallen into the room, crossing each other, ends resting on the wall tops or sticking up
    for i, (a, b, w) in enumerate((((-0.34, -0.2, 0.12), (0.12, 0.24, 0.47), 0.045),
                                   ((0.33, -0.16, 0.1), (-0.14, 0.25, 0.45), 0.045),
                                   ((-0.38, 0.12, 0.4), (0.37, -0.1, 0.17), 0.042),
                                   ((-0.2, -0.22, 0.12), (0.1, 0.18, 0.44), 0.04),
                                   ((0.06, -0.2, 0.12), (0.36, 0.18, 0.46), 0.04),
                                   ((-0.4, -0.04, 0.36), (0.4, 0.06, 0.3), 0.045),
                                   ((-0.22, 0.24, 0.1), (0.3, 0.24, 0.4), 0.038))):
        parts.append(beam(f'beam{i}', a, b, w, M.char, roll=rng.uniform(0, 1)))
    # rubble heaps of masonry and roof tiles: in the room and against the walls outside; (x, y, rx, ry, height)
    heaps = ((0.0, 0.0, 0.25, 0.17, 0.2), (-0.26, -0.33, 0.14, 0.07, 0.1), (0.07, -0.32, 0.16, 0.08, 0.13),
             (0.39, -0.06, 0.07, 0.2, 0.11), (-0.39, 0.14, 0.07, 0.18, 0.09), (0.26, 0.33, 0.14, 0.07, 0.08),
             (0.37, -0.32, 0.08, 0.07, 0.07))
    for i, (x, y, rx, ry, h) in enumerate(heaps):
        z0 = BASE_Z + 0.03 if abs(x) < W and abs(y) < D else 0.0
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
        for v in bm.verts:
            d = 1.0 + rng.uniform(-0.22, 0.22)
            v.co = Vector((x + v.co.x * rx * d, y + v.co.y * ry * d, max(z0 + v.co.z * h * d, z0)))
        parts.append(with_mat(mesh_object(f'heap{i}', bm), heap_mat))

    def surface(x, y):
        """Height of the heaps / floor under (x, y)."""
        inside = abs(x) < W - 0.02 and abs(y) < D - 0.02
        z = BASE_Z + 0.045 if inside else 0.0
        for hx, hy, rx, ry, h in heaps:
            q = 1 - ((x - hx) / rx) ** 2 - ((y - hy) / ry) ** 2
            if q > 0:
                z0 = BASE_Z + 0.03 if abs(hx) < W and abs(hy) < D else 0.0
                z = max(z, z0 + h * math.sqrt(q) * 1.05)
        return z

    def on_heaps(n, spread=1.0):
        pts = []
        while len(pts) < n:
            hx, hy, rx, ry, h = (rng.choices(heaps, weights=[hp[2] * hp[3] for hp in heaps])[0] if rng.random() < 0.85
                                 else (0, 0, 0.42, 0.38, 0))
            a, r = rng.uniform(0, 2 * math.pi), math.sqrt(rng.random()) * spread
            x, y = hx + math.cos(a) * rx * r, hy + math.sin(a) * ry * r
            if abs(x) > 0.43 or abs(y) > 0.38:
                continue
            # keep pieces out of the wall slabs
            if W - 0.06 < abs(x) < W + 0.03 and abs(y) < D + 0.02 or D - 0.06 < abs(y) < D + 0.03 and abs(x) < W + 0.02:
                continue
            pts.append((x, y, surface(x, y)))
        return pts
    for i, (x, y, z) in enumerate(on_heaps(48)):
        parts.append(box(f'rt{i}', (x, y, z + 0.006), (rng.uniform(0.055, 0.075), rng.uniform(0.04, 0.055), 0.02),
                         rng.choice(M.tiles), rot=(rng.uniform(-0.7, 0.7), rng.uniform(-0.7, 0.7), rng.uniform(0, math.pi)),
                         skip=('-z',)))
    for i, (x, y, z) in enumerate(on_heaps(18)):
        r = rng.uniform(0.025, 0.045)
        parts.append(octa(f'st{i}', (x, y, z + r * 0.3), r, M.rubble, rng, squash=0.75))
    obj = join(parts, 'house_razed')
    for v in obj.data.vertices:  # tumbled pieces rest on the ground, not in it
        v.co.z = max(v.co.z, 0.0)
    finish(obj, 'house_razed', size=512)


# ---------------------------------------------------------------- farmstead

def thatch(name, outer, inner, x0, x1, mat, rng, bevel=0.035, end_scale=0.9, pivot=(0.0, 0.45)):
    """Thick thatch: a closed chevron profile (outer surface + inner surface, in (y, z)) lofted along x, with
    softly pulled-in end rings and a little lumpiness on the inner rings."""
    pro = outer + inner
    xs = [x0, x0 + bevel, (x0 + x1) / 2, x1 - bevel, x1]
    rings = []
    for k, x in enumerate(xs):
        end = k in (0, len(xs) - 1)
        ring = []
        for i, (y, z) in enumerate(pro):
            if end:
                y, z = pivot[0] + (y - pivot[0]) * end_scale, pivot[1] + (z - pivot[1]) * end_scale
            elif i < len(outer):
                y, z = y + rng.uniform(-0.006, 0.006), z + rng.uniform(-0.006, 0.008)
            ring.append((x, y, z))
        rings.append(ring)
    return loft(name, rings, mat)


def farm_idle():
    reset()
    M = Mats()
    rng = random.Random(41)
    parts = []
    # farmhouse (west part)
    hx0, hx1, hd, hbase, htop, hapex = -0.72, -0.08, 0.25, 0.06, 0.4, 0.6
    parts.append(box('hbase', ((hx0 + hx1) / 2, 0, hbase / 2), (hx1 - hx0 + 0.04, 2 * hd + 0.04, hbase), M.stone,
                     skip=('-z',)))
    parts.append(prism('hwalls', [(-hd, hbase - 0.01), (hd, hbase - 0.01), (hd, htop), (0, hapex), (-hd, htop)], 'x',
                       hx0, hx1, M.plaster))
    tw, tz = 0.032, 0.008
    for x in (hx0, hx1):
        for sy in (-1, 1):
            parts.append(box('hpost', (x + (tw / 2 - tz) * (1 if x == hx0 else -1), sy * (hd - tw / 2 + tz),
                                       (hbase + htop) / 2), (tw, tw, htop - hbase), M.timber, skip=('-z',)))
    parts.append(box('heave', ((hx0 + hx1) / 2, -hd - tz / 2 + 0.01, htop - 0.025), (hx1 - hx0, 0.02 + tz, 0.032),
                     M.timber, skip=('+y',)))
    parts.append(box('hsill', ((hx0 + hx1) / 2, -hd - tz / 2 + 0.01, hbase + 0.016), (hx1 - hx0, 0.02 + tz, 0.028),
                     M.timber, skip=('+y',)))
    parts.append(box('hgeave', (hx0 - tz / 2 + 0.01, 0, htop - 0.025), (0.02 + tz, 2 * hd, 0.032), M.timber,
                     skip=('+x',)))
    parts.append(box('hkpost', (hx0 - tz / 2 + 0.01, 0, (htop + hapex) / 2), (0.02 + tz, 0.03, hapex - htop),
                     M.timber, skip=('+x',)))
    parts += window('y', -hd, -0.6, 0.235, 0.09, 0.09, M, 'hw1')
    parts += window('y', -hd, -0.22, 0.235, 0.09, 0.09, M, 'hw2')
    parts += window('x-', hx0, 0.0, 0.25, 0.08, 0.08, M, 'hw3')
    parts += [_wall_box('y', -hd, -0.41, hbase + 0.115, 0.15, 0.23, 0.03, 0.012, M.timber, 'hdframe'),
              _wall_box('y', -hd, -0.41, hbase + 0.105, 0.12, 0.21, 0.03, 0.02, M.door, 'hdoor'),
              box('hstep', (-0.41, -hd - 0.045, 0.02), (0.16, 0.06, 0.04), M.stone, skip=('-z',))]
    outer = [(-0.335, 0.37), (-0.36, 0.42), (-0.33, 0.475), (-0.17, 0.625), (-0.05, 0.73), (0.0, 0.745),
             (0.05, 0.73), (0.17, 0.625), (0.33, 0.475), (0.36, 0.42), (0.335, 0.37)]
    inner = [(0.25, 0.4), (0.0, 0.63), (-0.25, 0.4)]
    parts.append(thatch('hroof', outer, inner, -0.8, -0.02, M.thatch, rng, pivot=(0.0, 0.5)))
    # eyebrow dormer over the door
    dx = -0.41
    parts.append(box('dorm', (dx, -0.2, 0.55), (0.12, 0.2, 0.12), M.plaster, skip=('+y',)))
    parts += window('y', -0.3, dx, 0.545, 0.06, 0.06, M, 'dwin')
    hood_o = [(-0.1, 0.585), (-0.05, 0.65), (0.0, 0.675), (0.05, 0.65), (0.1, 0.585)]
    hood_i = [(0.075, 0.595), (0.0, 0.645), (-0.075, 0.595)]
    parts.append(prism('dhood', [(dx + a, b) for a, b in hood_o + hood_i], 'y', -0.335, -0.1, M.thatch))
    parts += chimney(M, -0.6, 0.06, 0.52, 0.88, w=0.1)
    # barn (east part), wooden planks, lower thatch
    bx0, bx1, bd, btop, bapex = -0.08, 0.46, 0.22, 0.3, 0.46
    parts.append(box('bbase', ((bx0 + bx1) / 2, 0, 0.02), (bx1 - bx0 + 0.02, 2 * bd + 0.02, 0.04), M.stone,
                     skip=('-z',)))
    parts.append(prism('bwalls', [(-bd, 0.03), (bd, 0.03), (bd, btop), (0, bapex), (-bd, btop)], 'x', bx0, bx1,
                       M.planks))
    for x in (bx1,):
        for sy in (-1, 1):
            parts.append(box('bpost', (x - tw / 2 + tz, sy * (bd - tw / 2 + tz), (0.04 + btop) / 2),
                             (tw, tw, btop - 0.04), M.timber, skip=('-z',)))
    bdx = 0.2
    parts.append(_wall_box('y', -bd, bdx, 0.04 + 0.12, 0.25, 0.24, 0.03, 0.012, M.timber, 'bdframe'))
    for s in (-1, 1):
        parts.append(_wall_box('y', -bd, bdx + s * 0.055, 0.04 + 0.11, 0.104, 0.22, 0.03, 0.02, M.door, f'bdoor{s}'))
        parts.append(beam(f'bbrace{s}', (bdx + s * 0.1, -bd - 0.022, 0.065), (bdx + s * 0.012, -bd - 0.022, 0.24),
                          0.016, M.timber))
    bouter = [(-0.32, 0.26), (-0.34, 0.3), (-0.315, 0.34), (-0.15, 0.45), (0.0, 0.53), (0.15, 0.45), (0.315, 0.34),
              (0.34, 0.3), (0.32, 0.26)]
    binner = [(0.24, 0.28), (0.0, 0.44), (-0.24, 0.28)]
    parts.append(thatch('broof', bouter, binner, -0.1, 0.53, M.thatch_old, rng, pivot=(0.0, 0.4)))
    # haystack: faceted dome with a little top knot
    hc, hr, hh = (0.645, -0.16), 0.15, 0.29
    rings = []
    for k, (f, z) in enumerate(((1.0, 0.0), (1.06, 0.08), (0.98, 0.16), (0.75, 0.23), (0.4, 0.28))):
        rings.append([(x + rng.uniform(-0.006, 0.006), y + rng.uniform(-0.006, 0.006), z * hh / 0.29)
                      for x, y, _ in circle(hc, hr * f, 0, 9, off=0.3 * k)])
    rings.append([(hc[0], hc[1], hh + 0.03)])
    parts.append(loft('hay', rings, M.hay, cap=False))
    # fence in front of the haystack, and a short return on the east side
    posts = [(0.3, -0.39), (0.42, -0.4), (0.54, -0.39), (0.66, -0.4), (0.78, -0.38)]
    for i, (x, y) in enumerate(posts):
        parts.append(box(f'fpost{i}', (x, y, 0.07), (0.028, 0.028, 0.14), M.timber, skip=('-z',),
                         rot=(0, 0, rng.uniform(-0.3, 0.3))))
    for i, (a, b) in enumerate(zip(posts, posts[1:])):
        for z in (0.06, 0.115):
            parts.append(beam(f'rail{i}_{z}', (a[0], a[1] - 0.018, z), (b[0], b[1] - 0.018, z), 0.018, M.planks))
    # barrels between house and barn and by the barn door
    for i, (c, r, h) in enumerate((((-0.02, -0.31), 0.045, 0.1), ((0.42, 0.27), 0.038, 0.085))):
        rings = [circle(c, r * 0.88, 0.0, 8), circle(c, r, h * 0.5, 8), circle(c, r * 0.88, h, 8)]
        parts.append(loft(f'barrel{i}', rings, M.door))
    # bushes
    for i, (c, r) in enumerate((((-0.73, -0.28), 0.065), ((-0.73, 0.28), 0.06), ((0.1, -0.3), 0.055),
                                ((0.5, 0.25), 0.06))):
        parts += bush(f'bush{i}', c, r, rng, M.leaf)
    obj = join(parts, 'farm_idle')
    finish(obj, 'farm_idle', size=512)


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    for fn in (house_intact, house_visited, house_razed, farm_idle):
        if not only or fn.__name__ in only:
            fn()
