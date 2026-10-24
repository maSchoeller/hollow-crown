"""Rocks, wheat field and fence (reference art/props/refs/rocks_field_fence.png, rows 1-4).

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/nature.py

- rock_idle: boulder group for mountain / rock tiles: one big rounded faceted grey-brown rock, two smaller ones leaning
  on it (south-west), moss patches on the tops (about 0.9 wide, 0.8 tall)
- rocks_small: four pebbles half sunk into a tuft of grass blades (about 0.5 wide, low)
- field_idle: square wheat patch (about 0.9 x 0.9, knee high): four rows of golden wheat running north-south with
  spiky ear tops and painted stalks, dark furrows between them, thin earthen rim
- fence_idle: rustic fence segment along x (about 0.95 long): three faceted posts with chamfered tops, two rails
- fence_corner: L corner of the same fence: post at the tile centre, arms along +x and +y out to the tile edge
- fence_broken: fence_idle damaged: east post leaning out, upper east rail snapped and fallen to the ground

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


def _noise(n, L, geo, scale, stretch, seed, detail=2.0):
    mp = n.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = stretch
    L.new(geo.outputs['Position'], mp.inputs['Vector'])
    tex = n.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = scale
    tex.inputs['Detail'].default_value = detail
    if 'W' in tex.inputs:
        tex.noise_dimensions = '4D'
        tex.inputs['W'].default_value = seed
    L.new(mp.outputs['Vector'], tex.inputs['Vector'])
    return tex.outputs['Fac']


def paint(name, stops, z=None, wz=0.0, wn=0.35, noise=0.1, nscale=6.0, stretch=(1, 1, 1), seed=0.0, bias=0.0,
          moss=None, streaks=None):
    """Painted gradient material: ramp over (height share + facet-towards-light share + soft noise).
    moss: (stops, nz_min, nz_max, scale, seed) paints moss patches on upward facing facets (normal z between the
          limits fades the moss in, broken up by blotchy noise);
    streaks: (scale, dark, axis[, distortion[, fade]]) darkens thin bands across `axis` (wheat stalks, wood grain);
             distortion (default 0.6) wobbles them, low values keep them straight; fade = (z0, z1) lets the bands die out
             between these heights (stalks below, plain ears on top)."""
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
    dot = n.new('ShaderNodeVectorMath')
    dot.operation = 'DOT_PRODUCT'
    L.new(geo.outputs['Normal'], dot.inputs[0])
    dot.inputs[1].default_value = LIGHT
    if wn:
        mr = n.new('ShaderNodeMapRange')
        mr.inputs['From Min'].default_value = -1.0
        mr.inputs['To Max'].default_value = wn
        L.new(dot.outputs['Value'], mr.inputs['Value'])
        terms.append(mr.outputs['Result'])
    if noise:
        fac = _noise(n, L, geo, nscale, stretch, seed)
        nm = n.new('ShaderNodeMath')
        nm.operation = 'MULTIPLY_ADD'
        L.new(fac, nm.inputs[0])
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
    if streaks:
        scale, dark, axis = streaks[:3]
        distortion = streaks[3] if len(streaks) > 3 else 0.6
        fade = streaks[4] if len(streaks) > 4 else None
        mp = n.new('ShaderNodeMapping')
        # bands vary across the axis only: squash the streak axis to zero, wobble a little with noise
        mp.inputs['Scale'].default_value = tuple(0.0 if a == axis else 1.0 for a in 'xyz')
        L.new(geo.outputs['Position'], mp.inputs['Vector'])
        wav = n.new('ShaderNodeTexWave')
        wav.wave_type = 'BANDS'
        wav.bands_direction = 'DIAGONAL'
        wav.wave_profile = 'SIN'
        wav.inputs['Scale'].default_value = scale
        wav.inputs['Distortion'].default_value = distortion
        wav.inputs['Detail'].default_value = 1.0
        L.new(mp.outputs['Vector'], wav.inputs['Vector'])
        mr = n.new('ShaderNodeMapRange')
        mr.inputs['From Min'].default_value = 0.0
        mr.inputs['From Max'].default_value = 0.45
        mr.inputs['To Min'].default_value = dark
        mr.inputs['To Max'].default_value = 1.0
        L.new(wav.outputs['Fac'], mr.inputs['Value'])
        if fade:
            # the darkest band value rises from `dark` to 1 between the fade heights
            spz = n.new('ShaderNodeSeparateXYZ')
            L.new(geo.outputs['Position'], spz.inputs[0])
            fz = n.new('ShaderNodeMapRange')
            fz.inputs['From Min'].default_value, fz.inputs['From Max'].default_value = fade
            fz.inputs['To Min'].default_value = dark
            fz.inputs['To Max'].default_value = 1.0
            L.new(spz.outputs['Z'], fz.inputs['Value'])
            L.new(fz.outputs['Result'], mr.inputs['To Min'])
        sc = n.new('ShaderNodeVectorMath')
        sc.operation = 'SCALE'
        L.new(col, sc.inputs[0])
        L.new(mr.outputs['Result'], sc.inputs['Scale'])
        col = sc.outputs['Vector']
    if moss:
        mstops, nz0, nz1, mscale, mseed = moss
        sn = n.new('ShaderNodeSeparateXYZ')
        L.new(geo.outputs['Normal'], sn.inputs[0])
        up = n.new('ShaderNodeMapRange')
        up.inputs['From Min'].default_value = nz0
        up.inputs['From Max'].default_value = nz1
        L.new(sn.outputs['Z'], up.inputs['Value'])
        blot = _noise(n, L, geo, mscale, (1, 1, 1), mseed, detail=3.0)
        add = n.new('ShaderNodeMath')
        add.operation = 'MULTIPLY_ADD'
        L.new(up.outputs['Result'], add.inputs[0])
        add.inputs[1].default_value = 0.4
        L.new(blot, add.inputs[2])
        mask = n.new('ShaderNodeMapRange')
        mask.inputs['From Min'].default_value = 0.86
        mask.inputs['From Max'].default_value = 0.89
        L.new(add.outputs[0], mask.inputs['Value'])
        # moss colour: its own light ramp (facets towards the sun lighter)
        lr = n.new('ShaderNodeMapRange')
        lr.inputs['From Min'].default_value = -0.2
        L.new(dot.outputs['Value'], lr.inputs['Value'])
        mramp = _ramp(n, mstops)
        L.new(lr.outputs['Result'], mramp.inputs['Fac'])
        mix = n.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        L.new(mask.outputs['Result'], mix.inputs['Factor'])
        L.new(col, mix.inputs['A'])
        L.new(mramp.outputs['Color'], mix.inputs['B'])
        col = mix.outputs['Result']
    L.new(col, bsdf.inputs['Base Color'])
    return m


def with_mat(obj, mat):
    obj.data.materials.append(mat)
    return obj


STONE = [(0.0, lin(70, 60, 54)), (0.35, lin(108, 94, 84)), (0.65, lin(146, 128, 114)), (1.0, lin(188, 170, 152))]
MOSS = [(0.0, lin(78, 104, 22)), (0.5, lin(122, 148, 32)), (1.0, lin(164, 182, 56))]
GRASS = [(0.0, lin(52, 96, 18)), (0.4, lin(98, 150, 28)), (0.75, lin(150, 192, 40)), (1.0, lin(206, 222, 80))]
WHEAT = [(0.0, lin(150, 88, 14)), (0.3, lin(212, 140, 20)), (0.6, lin(240, 182, 30)), (0.85, lin(252, 212, 58)),
         (1.0, lin(255, 232, 120))]
EARTH = [(0.0, lin(70, 42, 26)), (0.5, lin(104, 64, 40)), (1.0, lin(138, 88, 56))]
FURROW = [(0.0, lin(52, 32, 20)), (1.0, lin(86, 54, 34))]
WOOD = [(0.0, lin(70, 46, 30)), (0.4, lin(104, 72, 48)), (0.75, lin(138, 100, 70)), (1.0, lin(164, 124, 92))]


# ---------------------------------------------------------------- geometry

def boulder(name, center, radius, rng, mat, subdiv=2, squash=(1.0, 1.0, 1.0), jitter=0.1, tilt=None, floor=0.0):
    """Faceted rock: ico sphere with displaced vertices, flattened where it sits below the ground."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=radius)
    for v in bm.verts:
        d = 1.0 + rng.uniform(-jitter, jitter)
        p = Vector((v.co.x * d * squash[0], v.co.y * d * squash[1], v.co.z * d * squash[2]))
        if tilt:
            p.rotate(tilt)
        p += Vector(center)
        p.z = max(p.z, floor)
        v.co = p
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.004)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=0.002)
    return with_mat(mesh_object(name, bm), mat)


def blade(name, base, height, width, lean, rng, mat):
    """Grass blade: thin three-sided spike (3 triangles) leaning outwards."""
    bm = bmesh.new()
    b = Vector(base)
    off = rng.uniform(0, math.pi)
    ring = [bm.verts.new(b + Vector((math.cos(off + k * 2.094) * width, math.sin(off + k * 2.094) * width * 0.5, 0)))
            for k in range(3)]
    tip = bm.verts.new(b + Vector((lean[0], lean[1], height)))
    for k in range(3):
        bm.faces.new((ring[k], ring[(k + 1) % 3], tip))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return with_mat(mesh_object(name, bm), mat)


def hexa(name, pts, mat):
    """Six-sided solid from 8 corners: bottom quad 0-3, top quad 4-7 (same winding)."""
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in pts]
    for f in ((0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return with_mat(mesh_object(name, bm), mat)


def loft(name, rings, mat, cap=True, cap_bottom=True):
    """Solid through rings of equal vertex count; ring of one point closes into a tip."""
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
    caps = []
    if cap and cap_bottom:
        caps.append(bm.faces.new(loops[0]))
    if cap and len(loops[-1]) > 2:
        caps.append(bm.faces.new(loops[-1]))
    if caps:
        bmesh.ops.triangulate(bm, faces=caps)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return with_mat(mesh_object(name, bm), mat)


# ---------------------------------------------------------------- assets

def rock_idle():
    reset()
    rng = random.Random(501)
    stone = paint('stone', STONE, z=(0.0, 0.8), wz=0.2, wn=0.75, noise=0.12, nscale=7, seed=1.0, bias=-0.12,
                  moss=(MOSS, 0.3, 0.8, 10.0, 11.0))
    parts = [
        boulder('big', (0.08, 0.06, 0.39), 0.39, rng, stone, squash=(1.06, 0.92, 0.98), jitter=0.13),
        boulder('mid', (-0.28, -0.1, 0.13), 0.17, rng, stone, squash=(1.0, 0.95, 1.0), jitter=0.12),
        boulder('small', (-0.05, -0.26, 0.07), 0.11, rng, stone, subdiv=1, squash=(1.15, 1.0, 0.9), jitter=0.12),
    ]
    obj = join(parts, 'rock_idle')
    finish(obj, 'rock_idle')


def rocks_small():
    reset()
    rng = random.Random(502)
    stone = paint('pebble', STONE, z=(0.0, 0.16), wz=0.2, wn=0.65, noise=0.1, nscale=12, seed=2.0, bias=0.0)
    grass = paint('grass', GRASS, z=(0.0, 0.16), wz=0.55, wn=0.4, noise=0.1, nscale=14, seed=3.0, bias=-0.1)
    parts = [
        boulder('p0', (0.01, 0.02, 0.07), 0.095, rng, stone, subdiv=1, squash=(1.0, 0.95, 0.95), jitter=0.16),
        boulder('p1', (-0.1, -0.07, 0.03), 0.06, rng, stone, subdiv=1, jitter=0.16),
        boulder('p2', (0.1, -0.06, 0.03), 0.055, rng, stone, subdiv=1, jitter=0.16),
        boulder('p3', (0.0, -0.13, 0.03), 0.068, rng, stone, subdiv=1, squash=(1.1, 1.0, 0.9), jitter=0.16),
    ]
    # tuft: blades on two rings around the pebbles, leaning outwards, taller at the back
    k = 0
    for ring_r, count, h in ((0.1, 12, 0.1), (0.15, 16, 0.085), (0.19, 14, 0.06)):
        for i in range(count):
            a = 2 * math.pi * (i + rng.uniform(-0.3, 0.3)) / count + ring_r * 7
            d = Vector((math.cos(a), math.sin(a), 0))
            r = ring_r * rng.uniform(0.85, 1.1)
            hh = h * rng.uniform(0.75, 1.15) * (1.0 + 0.15 * d.y)
            lean = d * hh * rng.uniform(0.5, 0.85)
            parts.append(blade(f'g{k}', (d.x * r, d.y * r * 0.9 - 0.03, 0.0), hh, 0.03, (lean.x, lean.y), rng, grass))
            k += 1
    obj = join(parts, 'rocks_small')
    finish(obj, 'rocks_small')


def field_idle():
    reset()
    rng = random.Random(503)
    wheat = paint('wheat', WHEAT, z=(0.04, 0.22), wz=0.8, wn=0.5, noise=0.1, nscale=10, seed=4.0, bias=-0.27,
                  streaks=(16.0, 0.55, 'z', 0.15, (0.12, 0.2)))
    earth = paint('earth', EARTH, wn=0.5, noise=0.12, nscale=14, seed=5.0, bias=0.15)
    furrow = paint('furrow', FURROW, wn=0.2, noise=0.25, nscale=18, seed=6.0, bias=0.2)
    half, rim_h, top = 0.45, 0.035, 0.04
    parts = [
        # earthen slab with a thin raised rim, dark furrow floor inside
        hexa('slab', [(-half, -half, 0), (half, -half, 0), (half, half, 0), (-half, half, 0),
                      (-half, -half, rim_h), (half, -half, rim_h), (half, half, rim_h), (-half, half, rim_h)], earth),
        hexa('floor', [(-half + 0.025, -half + 0.025, rim_h - 0.01), (half - 0.025, -half + 0.025, rim_h - 0.01),
                       (half - 0.025, half - 0.025, rim_h - 0.01), (-half + 0.025, half - 0.025, rim_h - 0.01),
                       (-half + 0.025, -half + 0.025, top), (half - 0.025, -half + 0.025, top),
                       (half - 0.025, half - 0.025, top), (-half + 0.025, half - 0.025, top)], furrow),
    ]
    rows, segs = 4, 14
    pitch = (2 * half - 0.07) / rows
    w = pitch * 0.42
    y0, y1 = -half + 0.05, half - 0.05
    for r in range(rows):
        cx = -half + 0.035 + pitch * (r + 0.5)
        rings = []
        for s in range(segs + 1):
            y = y0 + (y1 - y0) * s / segs
            wob = rng.uniform(-0.006, 0.006)
            # ear tips: ridge and shoulders alternate up / down out of phase, so the facets turn into spiky diamonds
            up = s % 2 == 0
            tip = (0.225 if up else 0.165) + rng.uniform(-0.012, 0.01)
            shl = (0.15 if up else 0.195) + rng.uniform(-0.012, 0.01)
            out = (0.55 if up else 0.78) * w
            side = (1.0 if up else 1.12) * w
            prof = [(-w * 0.85, top - 0.005), (-side, 0.1 + rng.uniform(-0.01, 0.01)), (-out, shl), (0.0, tip),
                    (out, shl + rng.uniform(-0.01, 0.01)), (side, 0.1 + rng.uniform(-0.01, 0.01)),
                    (w * 0.85, top - 0.005)]
            rings.append([(cx + px + wob, y, pz) for px, pz in prof])
        # quads across the rings (loft along y, open bottom)
        bm = bmesh.new()
        loops = [[bm.verts.new(p) for p in ring] for ring in rings]
        for l0, l1 in zip(loops, loops[1:]):
            for i in range(len(l0) - 1):
                bm.faces.new((l0[i], l0[i + 1], l1[i + 1], l1[i]))
        for lp in (loops[0], loops[-1]):
            f = bm.faces.new(lp)
            bmesh.ops.triangulate(bm, faces=[f])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        parts.append(with_mat(mesh_object(f'row{r}', bm), wheat))
    obj = join(parts, 'field_idle')
    finish(obj, 'field_idle', size=512)  # 512 px so the painted stalks survive the bake


def post(name, x, h, r, rng, mat, segs=6, y=0.0):
    """Fence post: faceted prism with a chamfered top."""
    off = rng.uniform(0, math.pi)

    def ring(z, rr):
        return [(x + math.cos(off + 2 * math.pi * i / segs) * rr, y + math.sin(off + 2 * math.pi * i / segs) * rr, z)
                for i in range(segs)]
    lean = rng.uniform(-0.01, 0.01)
    top = [(px + lean, py, pz) for px, py, pz in ring(h, r * 0.62)]
    return loft(name, [ring(0.0, r * 1.05), ring(h * 0.45, r), [(px + lean, py, pz) for px, py, pz in ring(h - 0.04, r)],
                       top], mat, cap_bottom=False)


def fence_idle():
    reset()
    rng = random.Random(504)
    wood_post = paint('post', WOOD, z=(0.0, 0.42), wz=0.25, wn=0.55, noise=0.12, nscale=10, stretch=(4, 4, 0.6),
                      seed=7.0, bias=-0.05, streaks=(70.0, 0.75, 'z'))
    wood_rail = paint('rail', WOOD, wn=0.55, noise=0.12, nscale=10, stretch=(0.6, 4, 4), seed=8.0, bias=0.05,
                      streaks=(80.0, 0.78, 'x'))
    parts = []
    xs = (-0.4, 0.0, 0.4)
    for i, x in enumerate(xs):
        parts.append(post(f'post{i}', x, 0.42 + rng.uniform(-0.015, 0.015), 0.048, rng, wood_post))
    # two rails in front of the posts' centre line, each a slightly kinked beam with ends sticking out past the posts
    for j, z in enumerate((0.15, 0.29)):
        pts = [(-0.475, z + rng.uniform(-0.01, 0.01)), (0.0, z + rng.uniform(-0.012, 0.012)),
               (0.475, z + rng.uniform(-0.01, 0.01))]
        hw, hh, yc = 0.018, 0.024, -0.012
        for k in range(2):
            (xa, za), (xb, zb) = pts[k], pts[k + 1]
            xa, xb = (xa, xb + 0.01) if k == 0 else (xa - 0.01, xb)
            parts.append(hexa(f'rail{j}{k}', [
                (xa, yc - hw, za - hh), (xb, yc - hw, zb - hh), (xb, yc + hw, zb - hh), (xa, yc + hw, za - hh),
                (xa, yc - hw, za + hh), (xb, yc - hw, zb + hh), (xb, yc + hw, zb + hh), (xa, yc + hw, za + hh)],
                wood_rail))
    obj = join(parts, 'fence_idle')
    finish(obj, 'fence_idle')


def fence_mats():
    wood_post = paint('post', WOOD, z=(0.0, 0.42), wz=0.25, wn=0.55, noise=0.12, nscale=10, stretch=(4, 4, 0.6),
                      seed=7.0, bias=-0.05, streaks=(70.0, 0.75, 'z'))
    wood_rail = paint('rail', WOOD, wn=0.55, noise=0.12, nscale=10, stretch=(0.6, 4, 4), seed=8.0, bias=0.05,
                      streaks=(80.0, 0.78, 'x'))
    return wood_post, wood_rail


def plank(name, a, b, hw, hh, mat, rng=None, jag=0.0):
    """Rail beam from a to b (any direction, its width side kept level); jag > 0 splinters the b end: its four corners
    end at different lengths and the end face closes in a spike (a snapped rail)."""
    a, b = Vector(a), Vector(b)
    ax = (b - a).normalized()
    side = ax.cross(Vector((0, 0, 1)))
    side = side.normalized() if side.length > 1e-6 else Vector((0, 1, 0))
    up = side.cross(ax).normalized()
    corners = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    ring_a = [a + side * sx * hw + up * sy * hh for sx, sy in corners]
    ring_b = [b + side * sx * hw + up * sy * hh + (ax * rng.uniform(-jag, jag) if jag else Vector()) for sx, sy in corners]
    if not jag:
        # bottom quad 0-3 = a end, top quad 4-7 = b end: hexa wants matching winding, which these rings have
        return hexa(name, ring_a + ring_b, mat)
    tip = b + ax * jag * 1.6 + side * rng.uniform(-0.5, 0.5) * hw + up * rng.uniform(-0.5, 0.5) * hh
    return loft(name, [ring_a, ring_b, [tip]], mat)


def lean_post(name, x, h, r, rng, mat, tilt, y=0.0):
    """Fence post tipped over around its foot by the euler `tilt` (radians)."""
    obj = post(name, 0.0, h, r, rng, mat)
    e = Euler(tilt)
    for v in obj.data.vertices:
        p = v.co.copy()
        p.rotate(e)
        v.co = p + Vector((x, y, 0.0))
        v.co.z = max(v.co.z, 0.0)  # the foot stays on the ground
    return obj


RAIL_Z = (0.15, 0.29)        # rail heights of every fence piece (so pieces line up across tiles)
RAIL_HW, RAIL_HH, RAIL_OFF = 0.018, 0.024, -0.012


def fence_corner():
    """L corner: a post at the tile centre, arms along +x and +y with posts at 0.4 (where a straight segment would
    have its end posts) and rails running out to the tile edge, so straight segments on the next tiles meet it.
    The rail ends cross through the corner post and stick out a little on its outer side (log-cabin style)."""
    reset()
    rng = random.Random(505)
    wood_post, wood_rail = fence_mats()
    parts = [post('post_c', 0.0, 0.43 + rng.uniform(-0.01, 0.01), 0.05, rng, wood_post),
             post('post_x', 0.4, 0.42 + rng.uniform(-0.015, 0.015), 0.048, rng, wood_post),
             post('post_y', 0.0, 0.42 + rng.uniform(-0.015, 0.015), 0.048, rng, wood_post, y=0.4)]
    for j, z in enumerate(RAIL_Z):
        za, zb = z + rng.uniform(-0.01, 0.01), z + rng.uniform(-0.01, 0.01)
        parts.append(plank(f'railx{j}', (-0.075, RAIL_OFF, za), (0.475, RAIL_OFF, zb), RAIL_HW, RAIL_HH, wood_rail))
        za, zb = z + rng.uniform(-0.01, 0.01), z + rng.uniform(-0.01, 0.01)
        parts.append(plank(f'raily{j}', (RAIL_OFF, -0.075, za), (RAIL_OFF, 0.475, zb), RAIL_HW, RAIL_HH, wood_rail))
    obj = join(parts, 'fence_corner')
    finish(obj, 'fence_corner')


def fence_broken():
    """Straight segment like fence_idle, damaged: the east post leans out (east and a little forward), the upper east rail
    snapped at the leaning post and fell, its broken end on the ground; a splintered stub still hangs on the post."""
    reset()
    rng = random.Random(506)
    wood_post, wood_rail = fence_mats()
    tilt = (math.radians(8), math.radians(14), 0.0)       # around x (leans forward, -y) and y (leans east, +x)
    parts = [post('post0', -0.4, 0.42 + rng.uniform(-0.015, 0.015), 0.048, rng, wood_post),
             post('post1', 0.0, 0.42 + rng.uniform(-0.015, 0.015), 0.048, rng, wood_post),
             lean_post('post2', 0.4, 0.41, 0.048, rng, wood_post, tilt)]

    def on_post2(z):
        """Where the leaning post's axis is at height z (before tilt), plus the rail's offset to the front."""
        p = Vector((0.0, 0.0, z))
        p.rotate(Euler(tilt))
        return Vector((0.4, RAIL_OFF, 0.0)) + p
    # west half intact (both rails), as on fence_idle
    for j, z in enumerate(RAIL_Z):
        parts.append(plank(f'railw{j}', (-0.475, RAIL_OFF, z + rng.uniform(-0.01, 0.01)),
                           (0.01, RAIL_OFF, z + rng.uniform(-0.012, 0.012)), RAIL_HW, RAIL_HH, wood_rail))
    # lower east rail still spans to the leaning post (pulled along with it), sticking out past it
    lo = on_post2(RAIL_Z[0])
    a = Vector((-0.01, RAIL_OFF, RAIL_Z[0] + rng.uniform(-0.01, 0.01)))
    d = (lo - a).normalized()
    parts.append(plank('raile0', a, lo + d * 0.05, RAIL_HW, RAIL_HH, wood_rail))
    # upper east rail: snapped near the leaning post; the long piece hangs from the middle post down to the ground
    fallen = plank('raile1', (-0.01, RAIL_OFF, RAIL_Z[1] + 0.005), (0.34, -0.13, 0.042), RAIL_HW, RAIL_HH,
                   wood_rail, rng, jag=0.03)
    for v in fallen.data.vertices:  # the splintered end rests on the ground, not in it
        v.co.z = max(v.co.z, 0.0)
    parts.append(fallen)
    # splintered stub left on the leaning post (short, pointing back west)
    hi = on_post2(RAIL_Z[1] - 0.02)
    parts.append(plank('stub', hi + Vector((0.035, 0.0, 0.006)), hi + Vector((-0.07, 0.0, -0.014)), RAIL_HW, RAIL_HH,
                       wood_rail, rng, jag=0.025))
    obj = join(parts, 'fence_broken')
    finish(obj, 'fence_broken')


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    for fn in (rock_idle, rocks_small, field_idle, fence_idle, fence_corner, fence_broken):
        if not only or fn.__name__ in only:
            fn()
