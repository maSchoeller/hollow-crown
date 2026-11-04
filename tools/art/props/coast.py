"""Coast, harbour and highland props of act 2, rebuilt from the ChatGPT sheets art/mockups/map-assets/refs/coast_1..3.png.

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/coast.py [-- id ...]

Textures: art/props/textures/coast_*.png (cut from refs/coast_tex1.png and coast_tex2.png, art/prompts/map_assets_coast.md).
South faces -y. One tile = 1 unit, origin in the middle of the footprint. Fixed seeds, deterministic.

Footprints: ship_a 4 x 2, boat_b 2 x 1, warehouse_b 2 x 1, monastery_a 2 x 2, all others 1 tile.
The quay deck stays low (z = 0.06) so figures stand on it; its masonry reaches below z = 0 into the water.
"""
import math
import os
import random
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import ROOT, finish, join, reset  # noqa: E402
from facing import face_camera  # noqa: E402
from fortify import rounded  # noqa: E402
from houses import _ramp, beam, box, circle, clump, hexa, lin, loft, octa  # noqa: E402

TEX = os.path.join(ROOT, 'art', 'props', 'textures')


def done(obj, pid, size=256):
    """finish(), then the same camera angle again, framed tight on the asset on a warm ground: the gallery compares it with the sheet."""
    face_camera(obj)
    finish(obj, pid, size)
    scene = bpy.context.scene
    bpy.context.view_layer.update()
    cam = scene.camera
    inv = cam.matrix_world.inverted()
    pts = [inv @ (obj.matrix_world @ v.co) for v in obj.data.vertices]
    xs, ys = [p.x for p in pts], [p.y for p in pts]
    cam.data.ortho_scale = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.14
    cam.data.shift_x = (max(xs) + min(xs)) / 2 / cam.data.ortho_scale
    cam.data.shift_y = (max(ys) + min(ys)) / 2 / cam.data.ortho_scale
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = lin(250, 240, 226)
    scene.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items} else 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = scene.render.resolution_y = 640
    bpy.ops.render.render(write_still=True)


def rgb(r, g, b):
    return lin(r, g, b)


def pm(name, file=None, u=(1, 1, 0), v=(0, 0, 1), scale=1.5, col=None, ramp=None, rampz=(0.0, 1.0), tint=(1, 1, 1), noise=0.0, nscale=12.0,
       lichen=0.0, lscale=7.0, patch=None, ao=0.5, aod=0.14, zd=None, shade=(0.66, 1.12)):
    """Painted material: colour from a projected image (u, v axes), a height ramp or a flat colour, then lichen and plaster patches
    from noise, a tilt towards the light, contact shadow (ambient occlusion) and a darker foot (zd = (z0, z1, factor at z0))."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, L = m.node_tree.nodes, m.node_tree.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.9
    geo = n.new('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    sp = n.new('ShaderNodeSeparateXYZ')
    L.new(pos, sp.inputs[0])

    def mapr(val, a, b, c, d):
        k = n.new('ShaderNodeMapRange')
        k.inputs['From Min'].default_value = a
        k.inputs['From Max'].default_value = b
        k.inputs['To Min'].default_value = c
        k.inputs['To Max'].default_value = d
        L.new(val, k.inputs['Value'])
        return k.outputs['Result']

    def scaled(color, fac):
        k = n.new('ShaderNodeVectorMath')
        k.operation = 'SCALE'
        L.new(color, k.inputs[0])
        L.new(fac, k.inputs['Scale'])
        return k.outputs[0]

    def noise_at(sc, seed):
        k = n.new('ShaderNodeTexNoise')
        k.inputs['Scale'].default_value = sc
        k.inputs['Detail'].default_value = 3.0
        off = n.new('ShaderNodeVectorMath')
        off.operation = 'ADD'
        off.inputs[1].default_value = (seed, seed * 0.7, seed * 0.3)
        L.new(pos, off.inputs[0])
        L.new(off.outputs[0], k.inputs['Vector'])
        return k.outputs[0]

    def mixed(a, color, mask):
        k = n.new('ShaderNodeMix')
        k.data_type = 'RGBA'
        L.new(mask, k.inputs['Factor'])
        L.new(a, k.inputs[6])
        k.inputs[7].default_value = color
        return k.outputs[2]

    if file:
        tex = n.new('ShaderNodeTexImage')
        tex.image = bpy.data.images.load(os.path.join(TEX, file), check_existing=True)
        tex.extension = 'REPEAT'
        cb = n.new('ShaderNodeCombineXYZ')
        for axis, vec in (('X', u), ('Y', v)):
            d = n.new('ShaderNodeVectorMath')
            d.operation = 'DOT_PRODUCT'
            L.new(pos, d.inputs[0])
            d.inputs[1].default_value = vec
            s = n.new('ShaderNodeMath')
            s.operation = 'MULTIPLY'
            L.new(d.outputs['Value'], s.inputs[0])
            s.inputs[1].default_value = scale
            L.new(s.outputs[0], cb.inputs[axis])
        L.new(cb.outputs[0], tex.inputs['Vector'])
        out = tex.outputs['Color']
    elif ramp:
        r = _ramp(n, ramp)
        L.new(mapr(sp.outputs['Z'], rampz[0], rampz[1], 0.0, 1.0), r.inputs['Fac'])
        out = r.outputs['Color']
    else:
        c = n.new('ShaderNodeRGB')
        c.outputs[0].default_value = col
        out = c.outputs[0]
    if tint != (1, 1, 1):
        t = n.new('ShaderNodeVectorMath')
        t.operation = 'MULTIPLY'
        L.new(out, t.inputs[0])
        t.inputs[1].default_value = tint
        out = t.outputs[0]
    if noise:
        out = scaled(out, mapr(noise_at(nscale, 3.1), 0.3, 0.7, 1 - noise, 1 + noise))
    if lichen:
        out = mixed(out, rgb(196, 148, 48), mapr(noise_at(lscale, 11.3), 0.66 - lichen * 0.2, 0.74 - lichen * 0.2, 0.0, 0.8))
    if patch:
        pc, ps, thr = patch
        out = mixed(out, pc, mapr(noise_at(ps, 21.7), thr - 0.03, thr + 0.03, 0.0, 1.0))
    d = n.new('ShaderNodeVectorMath')
    d.operation = 'DOT_PRODUCT'
    L.new(geo.outputs['Normal'], d.inputs[0])
    d.inputs[1].default_value = (-0.2, -0.5, 0.84)
    out = scaled(out, mapr(d.outputs['Value'], -1.0, 1.0, shade[0], shade[1]))
    if ao:
        occ = n.new('ShaderNodeAmbientOcclusion')
        occ.samples = 6
        occ.only_local = True
        occ.inputs['Distance'].default_value = aod
        out = scaled(out, mapr(occ.outputs['AO'], 0.0, 1.0, 1.0 - ao, 1.0))
    if zd:
        out = scaled(out, mapr(sp.outputs['Z'], zd[0], zd[1], zd[2], 1.0))
    L.new(out, bsdf.inputs['Base Color'])
    return m


SHEAR_U, SHEAR_V = (1, 0.75, 0), (0, 0.7, 1)


class M:
    """All materials of the group; made per asset because every asset starts with an empty scene."""

    def __init__(self):
        self.masonry = pm('masonry', 'coast_masonry.png', scale=1.5, tint=(0.75, 1.05, 1.5), aod=0.1, lichen=0.2, lscale=11)
        self.pale = pm('pale', 'coast_masonry.png', scale=1.5, tint=(1.5, 2.2, 2.8), aod=0.1, lichen=0.1, lscale=11)
        self.field = pm('field', 'coast_field.png', scale=1.1)
        self.plaster = pm('plaster', 'coast_field.png', scale=1.1, patch=(rgb(234, 220, 190), 7.0, 0.43))
        self.block = pm('block', col=rgb(176, 146, 112), noise=0.22, nscale=20, lichen=0.6, lscale=11, aod=0.08, ao=0.45)
        self.pale_block = pm('pale_block', col=rgb(222, 196, 156), noise=0.1, nscale=16, lichen=0.2, lscale=9, aod=0.08, ao=0.35)
        self.deck = pm('deck', 'coast_planks.png', (1, 0, 0), (0, 1, 0), 1.5, tint=(0.95, 1.2, 1.6), aod=0.1)
        self.deck_y = pm('deck_y', 'coast_planks.png', (0, 1, 0), (1, 0, 0), 1.5, tint=(0.95, 1.2, 1.6), aod=0.1)
        self.oak = pm('oak', 'coast_planks.png', scale=1.8, tint=(0.95, 1.2, 1.6))
        self.oak_v = pm('oak_v', 'coast_planks.png', (0, 0, 1), (1, 1, 0), 2.2, tint=(0.88, 1.1, 1.4))
        self.oak_dark = pm('oak_dark', 'coast_planks.png', (0, 0, 1), (1, 1, 0), 2.2, tint=(0.38, 0.42, 0.56))
        self.frame = pm('frame', col=rgb(112, 72, 42), noise=0.14, nscale=30, ao=0.3, aod=0.06)
        self.beam = pm('beam', col=rgb(174, 118, 66), noise=0.12, nscale=24, ao=0.3, aod=0.06)
        self.iron = pm('iron', col=rgb(84, 74, 68), noise=0.12, nscale=22, ao=0.2)
        self.glass = pm('glass', col=rgb(58, 44, 40), ao=0, shade=(0.9, 1.1))
        self.rope = pm('rope', col=rgb(190, 142, 80), noise=0.18, nscale=50, ao=0.3, aod=0.05, shade=(0.6, 1.16))
        self.slate = pm('slate', 'coast_slate.png', (1, 1, 0), (1, -1, 0.3), 1.3, tint=(0.8, 0.84, 0.82), lichen=0.42, lscale=11, ao=0.45, aod=0.05)
        self.slate_under = pm('slate_under', col=rgb(50, 44, 50), ao=0)
        self.rock = pm('rock', 'coast_rock.png', SHEAR_U, SHEAR_V, 1.7, tint=(0.86, 0.9, 0.98), lichen=0.3, lscale=12, aod=0.16, ao=0.72)
        self.rock_pale = pm('rock_pale', 'coast_rock.png', SHEAR_U, SHEAR_V, 2.2, tint=(1.0, 1.08, 1.2), lichen=0.25, lscale=12, ao=0.5)
        self.stone = pm('stone', col=rgb(156, 138, 128), noise=0.14, nscale=14, lichen=0.4, lscale=9, ao=0.45, aod=0.08)
        self.grass = pm('grass', col=rgb(188, 140, 50), noise=0.22, nscale=18, patch=(rgb(146, 112, 44), 9.0, 0.62), ao=0.3, aod=0.08, shade=(0.8, 1.1))
        self.tuft = pm('tuft', ramp=[(0.0, rgb(150, 108, 40)), (1.0, rgb(232, 182, 76))], rampz=(0.0, 1.0), ao=0)
        self.amber = pm('amber', col=rgb(214, 124, 32), noise=0.22, nscale=20, ao=0.3, aod=0.05)
        self.flower = pm('flower', col=rgb(240, 226, 190), ao=0, shade=(0.85, 1.05))
        self.water = pm('water', 'coast_water.png', (1, 0, 0), (0, 0.5, 1), 2.0, tint=(1.15, 1.18, 1.18), ao=0, shade=(0.9, 1.05))
        self.pool = pm('pool', 'coast_water.png', (1, 0, 0), (0, 1, 0), 1.6, tint=(1.2, 1.2, 1.18), ao=0.25, aod=0.08, shade=(0.9, 1.05))
        self.foam = pm('foam', col=rgb(244, 244, 238), ao=0, shade=(0.88, 1.05))
        self.canvas = pm('canvas', col=rgb(214, 178, 122), noise=0.08, nscale=9, ao=0.4)
        self.canvas_dark = pm('canvas_dark', col=rgb(176, 140, 92), noise=0.1, nscale=12, ao=0.3)
        self.cream = pm('cream', col=rgb(240, 220, 180), noise=0.05, nscale=9, ao=0.35)
        self.ochre = pm('ochre', col=rgb(224, 150, 58), noise=0.06, nscale=9, ao=0.35)
        self.gold = pm('gold', col=rgb(216, 154, 54), noise=0.06, nscale=9, ao=0.2)
        self.mustard = pm('mustard', col=rgb(232, 176, 62), noise=0.05, nscale=9, ao=0)
        self.velvet = pm('velvet', 'coast_velvet.png', (1, 1, 0), (0, 0, 1), 2.2, tint=(0.82, 0.78, 0.86), ao=0.35)
        self.lining = pm('lining', col=rgb(232, 190, 122), noise=0.08, nscale=20, ao=0.35)
        self.sand = pm('sand', 'coast_sand.png', (1, 0, 0), (0, 1, 0), 1.0, tint=(1.0, 0.95, 0.86), ao=0)
        self.wet = pm('wet', col=rgb(176, 150, 116), noise=0.08, nscale=12, ao=0)
        self.puddle = pm('puddle', col=rgb(176, 174, 164), noise=0.05, nscale=6, ao=0)
        self.weed = pm('weed', col=rgb(104, 76, 28), noise=0.16, nscale=24, ao=0)
        self.dark = pm('dark', col=rgb(44, 32, 26), ao=0)
        self.tent_in = pm('tent_in', col=rgb(116, 86, 58), noise=0.1, nscale=9, ao=0.4)
        self.sack = pm('sack', col=rgb(186, 146, 94), noise=0.1, nscale=30, ao=0.4)
        self.flame_o = pm('flame_o', ramp=[(0.0, rgb(232, 110, 26)), (0.55, rgb(248, 150, 40)), (1.0, rgb(250, 190, 70))], rampz=(0.8, 1.55), ao=0, shade=(1.0, 1.0))
        self.flame_i = pm('flame_i', ramp=[(0.0, rgb(255, 214, 90)), (1.0, rgb(255, 244, 170))], rampz=(0.8, 1.25), ao=0, shade=(1.0, 1.0))


# ---------------------------------------------------------------- geometry helpers

def cyl(name, c, r, z0, z1, mat, segs=10, r1=None):
    return loft(name, [circle(c, r, z0, segs), circle(c, r if r1 is None else r1, z1, segs)], mat)


def drum(name, p0, p1, r, mat, segs=10, prof=((0.0, 1.0), (1.0, 1.0)), cap=True):
    """Cylinder on any axis; prof = (t along the axis, radius factor)."""
    a, b = Vector(p0), Vector(p1)
    d = (b - a).normalized()
    t = d.orthogonal().normalized()
    w = d.cross(t).normalized()
    rings = []
    for k, f in prof:
        c = a.lerp(b, k)
        rings.append([tuple(c + (t * math.cos(2 * math.pi * i / segs) + w * math.sin(2 * math.pi * i / segs)) * r * f) for i in range(segs)])
    return loft(name, rings, mat, cap=cap)


def tube(name, pts, r, mat, sides=5, radii=None, twist=0.0):
    """Tube through a polyline, parallel-transported frames."""
    pts = [Vector(p) for p in pts]
    tan0 = (pts[1] - pts[0]).normalized()
    nor = tan0.orthogonal().normalized()
    rings = []
    for i, p in enumerate(pts):
        tan = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        nor = (nor - tan * nor.dot(tan)).normalized()
        bin_ = tan.cross(nor)
        rr = r * (radii[i] if radii else 1.0)
        off = twist * i
        rings.append([tuple(p + (nor * math.cos(off + 2 * math.pi * k / sides) + bin_ * math.sin(off + 2 * math.pi * k / sides)) * rr) for k in range(sides)])
    return loft(name, rings, mat)


def rope(name, pts, r, mat, pitch=0.05, sides=4):
    """Beaded rope: the radius pinches every other ring and the rings turn, which reads as a twist."""
    pts = [Vector(p) for p in pts]
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        n = max(1, round((b - a).length / pitch))
        out += [a.lerp(b, (k + 1) / n) for k in range(n)]
    radii = [1.0 if i % 2 == 0 else 0.72 for i in range(len(out))]
    return tube(name, out, r, mat, sides, radii, twist=0.6)


def sag(p0, p1, s, n=8):
    a, b = Vector(p0), Vector(p1)
    return [tuple(a.lerp(b, i / n) - Vector((0, 0, s * 4 * (i / n) * (1 - i / n)))) for i in range(n + 1)]


def hoop(c, r, n=14, axis='z', z=0.0):
    """Closed circle as a polyline."""
    pts = []
    for i in range(n + 1):
        a = 2 * math.pi * i / n
        if axis == 'z':
            pts.append((c[0] + math.cos(a) * r, c[1] + math.sin(a) * r, c[2] + z))
        else:
            pts.append((c[0] + math.cos(a) * r, c[1], c[2] + math.sin(a) * r))
    return pts


def sphere(name, c, r, mat, rng, squash=(1, 1, 1), jitter=0.0):
    return clump(name, c, r, rng, mat, squash=squash, jitter=jitter)


def boulder(name, c, rx, ry, z0, z1, rng, mat, n=6, tilt=0.25, top=(0.38, 0.55)):
    """Angular chipped rock: base, belly, a smaller tilted top."""
    off = rng.uniform(0, 6.28)
    dirs = [off + 2 * math.pi * (k + rng.uniform(-0.2, 0.2)) / n for k in range(n)]
    rad = [rng.uniform(0.82, 1.15) for _ in range(n)]
    tx, ty = rng.uniform(-tilt, tilt), rng.uniform(-tilt, tilt)
    rings = []
    h = z1 - z0
    for f, z in ((1.0, z0), (rng.uniform(0.98, 1.1), z0 + h * rng.uniform(0.3, 0.45)), (rng.uniform(0.68, 0.84), z0 + h * rng.uniform(0.72, 0.84)), (rng.uniform(*top), z1)):
        ring = []
        for a, rr in zip(dirs, rad):
            x, y = c[0] + math.cos(a) * rx * rr * f, c[1] + math.sin(a) * ry * rr * f
            ring.append((x + tx * (z - z0) * 0.4, y + ty * (z - z0) * 0.4, z + (x - c[0]) * tx * (z - z0) / max(h, 0.01) + rng.uniform(-0.01, 0.01)))
        rings.append(ring)
    return loft(name, rings, mat)


def column(name, cx, cy, w, d, z0, z1, rng, mat):
    """Tall angular rock pillar of a cliff face."""
    n = 5
    rot = rng.uniform(-0.25, 0.25)
    base = [(-1.0, -1.0), (0.0, -1.2), (1.0, -1.0), (1.05, 1.0), (-1.05, 1.0)]
    rings = []
    for f, z in ((1.0, z0), (1.02, z0 + (z1 - z0) * 0.55), (0.9, z1 - 0.05), (0.72, z1)):
        ring = []
        for k in range(n):
            x, y = base[k][0] * w / 2 * f, base[k][1] * d / 2 * f
            x, y = x * math.cos(rot) - y * math.sin(rot), x * math.sin(rot) + y * math.cos(rot)
            ring.append((cx + x + rng.uniform(-0.008, 0.008), cy + y + rng.uniform(-0.008, 0.008), z + rng.uniform(-0.012, 0.012)))
        rings.append(ring)
    return loft(name, rings, mat)


def tuft(parts, name, c, h, rng, mat, spikes=3, r=0.03):
    for k in range(spikes):
        a = rng.uniform(0, 6.28)
        x, y = c[0] + math.cos(a) * r * 0.7, c[1] + math.sin(a) * r * 0.7
        tipx, tipy = x + math.cos(a) * r * 1.2, y + math.sin(a) * r * 1.2
        b = [(x + math.cos(a + i * 2.09) * r * 0.5, y + math.sin(a + i * 2.09) * r * 0.5, c[2]) for i in range(3)]
        parts.append(loft(f'{name}{k}', [b, [(tipx, tipy, c[2] + h * rng.uniform(0.7, 1.15))]], mat, cap=False))


def flowers(parts, name, c, rng, mat, count=4, r=0.018, spread=0.035):
    for k in range(count):
        p = (c[0] + rng.uniform(-spread, spread), c[1] + rng.uniform(-spread, spread), c[2] + rng.uniform(0.0, 0.02))
        parts.append(octa(f'{name}{k}', p, r, mat, rng))


def nail(parts, name, p, mat, r=0.008, axis='z'):
    x, y, z = p
    if axis == 'z':
        b = [(x - r, y - r, z), (x + r, y - r, z), (x + r, y + r, z), (x - r, y + r, z)]
        parts.append(loft(name, [b, [(x, y, z + r)]], mat, cap=False))
    else:
        b = [(x - r, y, z - r), (x + r, y, z - r), (x + r, y, z + r), (x - r, y, z + r)]
        parts.append(loft(name, [b, [(x, y - r, z)]], mat, cap=False))


class F:
    """A wall face: a along the face, z up, d outwards."""

    def __init__(self, o, u, n):
        self.o, self.u, self.n = Vector(o), Vector(u), Vector(n)

    def p(self, a, z, d=0.0):
        return tuple(self.o + self.u * a + self.n * d + Vector((0, 0, z)))

    def plate(self, name, pts, d0, d1, mat):
        return loft(name, [[self.p(a, z, d0) for a, z in pts], [self.p(a, z, d1) for a, z in pts]], mat)

    def rect(self, name, a0, a1, z0, z1, d0, d1, mat):
        return self.plate(name, [(a0, z0), (a1, z0), (a1, z1), (a0, z1)], d0, d1, mat)


def south(y=0.0):
    return F((0, y, 0), (1, 0, 0), (0, -1, 0))


def west(x=0.0):
    return F((x, 0, 0), (0, -1, 0), (-1, 0, 0))


def east(x=0.0):
    return F((x, 0, 0), (0, 1, 0), (1, 0, 0))


def arch_pts(a0, a1, z0, spring, rise, n=5):
    c, h = (a0 + a1) / 2, (a1 - a0) / 2
    pts = [(a0, z0), (a1, z0)]
    for i in range(n + 1):
        t = math.pi * i / n
        pts.append((c + h * math.cos(t), spring + rise * math.sin(t)))
    return pts


def stone_arch(parts, f, name, a0, a1, spring, rise, z0, mat, out=0.06, d=0.03, n=5, jambs=2):
    c, h = (a0 + a1) / 2, (a1 - a0) / 2
    for i in range(n):
        t0, t1 = math.pi * (i + 0.05) / n, math.pi * (i + 0.95) / n
        q = [(c + h * math.cos(t0), spring + rise * math.sin(t0)), (c + (h + out) * math.cos(t0), spring + (rise + out) * math.sin(t0)),
             (c + (h + out) * math.cos(t1), spring + (rise + out) * math.sin(t1)), (c + h * math.cos(t1), spring + rise * math.sin(t1))]
        parts.append(f.plate(f'{name}v{i}', q, 0, d, mat))
    step = (spring - z0) / jambs
    for k in range(jambs):
        for s, a in ((0, a0 - out), (1, a1)):
            parts.append(f.rect(f'{name}j{k}{s}', a, a + out, z0 + k * step + 0.004, z0 + (k + 1) * step - 0.004, 0, d, mat))


def door(parts, f, m, name, a0, a1, z0, spring, rise, double=False, handles=True):
    parts.append(f.plate(f'{name}p', arch_pts(a0, a1, z0, spring, rise), 0, 0.012, m.oak_v))
    for k, z in enumerate((z0 + (spring - z0) * 0.25, z0 + (spring - z0) * 0.8)):
        if double:
            parts.append(f.rect(f'{name}sl{k}', a0, (a0 + a1) / 2 - 0.05, z, z + 0.022, 0.012, 0.02, m.iron))
            parts.append(f.rect(f'{name}sr{k}', (a0 + a1) / 2 + 0.05, a1, z, z + 0.022, 0.012, 0.02, m.iron))
        else:
            parts.append(f.rect(f'{name}s{k}', a0, a1 - 0.03, z, z + 0.022, 0.012, 0.02, m.iron))
    if double:
        parts.append(f.rect(f'{name}m', (a0 + a1) / 2 - 0.008, (a0 + a1) / 2 + 0.008, z0, spring + rise, 0.012, 0.018, m.frame))
    if handles:
        for k, a in enumerate(((a0 + a1) / 2 - 0.05, (a0 + a1) / 2 + 0.05) if double else ((a1 - 0.06),)):
            c = f.p(a, z0 + (spring - z0) * 0.55, 0.024)
            pts = [tuple(Vector(c) + f.u * math.cos(2 * math.pi * i / 6) * 0.024 + Vector((0, 0, math.sin(2 * math.pi * i / 6) * 0.024))) for i in range(7)]
            parts.append(tube(f'{name}h{k}', pts, 0.006, m.iron, sides=3))


def window(parts, f, m, name, a, z, w, h, arched=False, surround=None, bars=True):
    sur = surround or m.block
    if arched:
        parts.append(f.plate(f'{name}f', arch_pts(a - w / 2 - 0.03, a + w / 2 + 0.03, z - 0.03, z + h - w * 0.4, w * 0.5 + 0.03, n=4), 0, 0.018, sur))
        parts.append(f.plate(f'{name}g', arch_pts(a - w / 2, a + w / 2, z, z + h - w * 0.45, w * 0.45, n=4), 0.018, 0.021, m.glass))
    else:
        parts.append(f.rect(f'{name}f', a - w / 2 - 0.028, a + w / 2 + 0.028, z - 0.028, z + h + 0.028, 0, 0.018, sur))
        parts.append(f.rect(f'{name}g', a - w / 2, a + w / 2, z, z + h, 0.018, 0.021, m.glass))
    if bars:
        parts.append(f.rect(f'{name}a', a - 0.006, a + 0.006, z, z + h, 0.021, 0.027, m.beam))
        parts.append(f.rect(f'{name}b', a - w / 2, a + w / 2, z + h * 0.48, z + h * 0.48 + 0.012, 0.021, 0.027, m.beam))


def roof(parts, m, name, ax, a0, a1, hw, c, ze, zr, rows, tiles, rng, th=0.05):
    """Heavy slate roof of real overlapping tiles. ax = ridge axis ('x' or 'y'); c = cross position of the ridge."""
    def pt(a, s, t, lift):
        cross = c + s * hw * t
        z = zr + (ze - zr) * t + lift
        return (a, cross, z) if ax == 'x' else (cross, a, z)

    length = a1 - a0
    for s in (-1, 1):
        parts.append(hexa(f'{name}u{s}', [pt(a0, s, 0, -0.03), pt(a1, s, 0, -0.03), pt(a1, s, 1, -0.03), pt(a0, s, 1, -0.03),
                                         pt(a0, s, 0, 0), pt(a1, s, 0, 0), pt(a1, s, 1, 0), pt(a0, s, 1, 0)], m.slate_under))
        for r in range(rows):
            t0, t1 = r / rows, min(1.0, (r + 1.2) / rows) + (0.015 if r == rows - 1 else 0)
            shift = 0.5 if r % 2 else 0.0
            for i in range(tiles + (1 if r % 2 else 0)):
                b0 = max(a0, a0 + length * (i - shift) / tiles)
                b1 = min(a1, a0 + length * (i + 1 - shift) / tiles)
                gap = length / tiles * 0.04
                b0, b1 = b0 + gap, b1 - gap
                ln = rng.uniform(-0.012, 0.012)
                lf = th * rng.uniform(0.8, 1.2)
                t1j = t1 + ln / hw
                parts.append(hexa(f'{name}t{s}{r}{i}', [pt(b0, s, t0, 0), pt(b1, s, t0, 0), pt(b1, s, t1j, 0), pt(b0, s, t1j, 0),
                                                       pt(b0, s, t0, 0.006), pt(b1, s, t0, 0.006), pt(b1 - 0.004, s, t1j, lf), pt(b0 + 0.004, s, t1j, lf)], m.slate, skip_bottom=True))
    parts.append(beam(f'{name}ridge', pt(a0 - 0.01, 1, 0, 0.012), pt(a1 + 0.01, 1, 0, 0.012), 0.06, m.slate, roll=math.pi / 4))


def verge(parts, m, name, ax, a, hw, c, ze, zr, w=0.05, finial=True):
    """Barge boards along one gable end and the square block on the peak."""
    def pt(s, t):
        cross = c + s * hw * t
        z = zr + (ze - zr) * t + 0.02
        return (a, cross, z) if ax == 'x' else (cross, a, z)
    for s in (-1, 1):
        parts.append(beam(f'{name}b{s}', pt(s, 0), pt(s, 1.02), w, m.beam))
    if finial:
        peak = pt(1, 0)
        parts.append(box(f'{name}f', (peak[0], peak[1], peak[2] + 0.03), (0.08, 0.08, 0.1), m.beam))


def gable(f, name, a0, a1, z0, zr, d0, d1, mat):
    return f.plate(name, [(a0, z0), (a1, z0), ((a0 + a1) / 2, zr)], d0, d1, mat)


def shrubs(parts, name, pts, rng, m, r=0.045):
    for i, (x, y) in enumerate(pts):
        parts.append(sphere(f'{name}{i}', (x, y, r * 0.7), r, m.amber, rng, squash=(1.1, 1.1, 0.9), jitter=0.2))


def bevel_join(parts, name, width=0.012):
    return rounded(join(parts, name), width, segments=1)


# ---------------------------------------------------------------- harbour

def rim_blocks(parts, m, name, pts):
    for i, (x, y, sx, sy, z1) in enumerate(pts):
        parts.append(box(f'{name}{i}', (x, y, (z1 + 0.04) / 2), (sx, sy, z1 - 0.04), m.block, skip=('-z',)))


def quay_body(m, name, faces):
    parts = [
        box(f'{name}c', (0, 0, -0.2), (1.0, 1.0, 0.52), m.masonry, skip=('-z', '+z')),
        box(f'{name}d', (0, 0, 0.045), (0.99, 0.99, 0.03), m.deck),
    ]
    return parts


def fender(parts, m, f, name, a0, a1, z):
    parts.append(f.rect(name, a0, a1, z, z + 0.11, 0, 0.055, m.frame))
    parts.append(f.rect(f'{name}t', a0 + 0.008, a1 - 0.008, z + 0.08, z + 0.1, 0.055, 0.058, m.beam))
    for k, a in enumerate((a0 + 0.05, (a0 + a1) / 2, a1 - 0.05)):
        parts.append(octa(f'{name}n{k}', f.p(a, z + 0.055, 0.058), 0.02, m.iron, random.Random(k)))


def deck_seams(parts, m, name, y0, y1, x0, x1, rows=5):
    """Real shallow joints in the deck: dark strips between the planks."""
    for k in range(1, rows):
        y = y0 + (y1 - y0) * k / rows
        parts.append(box(f'{name}{k}', ((x0 + x1) / 2, y, 0.062), (x1 - x0, 0.012, 0.004), m.frame))


def quay_straight():
    reset()
    m = M()
    parts = quay_body(m, 'q', 'S')
    deck_seams(parts, m, 'seam', -0.36, 0.4, -0.41, 0.41)
    blocks = []
    xs = [-0.4, -0.2, 0.0, 0.2, 0.4]
    rng = random.Random(3)
    rim_blocks(blocks, m, 's', [(x, -0.44, 0.19, 0.12, 0.2 + rng.uniform(-0.012, 0.012)) for x in xs])
    rim_blocks(blocks, m, 'w', [(-0.45, y, 0.09, 0.19, 0.13) for y in (-0.26, -0.06, 0.14, 0.34)])
    rim_blocks(blocks, m, 'e', [(0.45, y, 0.09, 0.19, 0.13) for y in (-0.26, -0.06, 0.14, 0.34)])
    rim_blocks(blocks, m, 'n', [(x, 0.45, 0.19, 0.09, 0.1) for x in (-0.2, 0.0, 0.2)])
    rim_blocks(blocks, m, 'c', [(-0.42, 0.42, 0.16, 0.16, 0.2), (0.42, 0.42, 0.16, 0.16, 0.2)])
    parts.append(bevel_join(blocks, 'blocks', 0.018))
    fender(parts, m, south(-0.5), 'fend', -0.44, 0.44, -0.17)
    done(join(parts, 'quay_straight'), 'quay_straight', size=512)


def quay_corner():
    reset()
    m = M()
    parts = quay_body(m, 'q', 'SE')
    deck_seams(parts, m, 'seam', -0.36, 0.4, -0.42, 0.36)
    blocks = []
    rim_blocks(blocks, m, 's', [(x, -0.44, 0.19, 0.12, 0.2) for x in (-0.4, -0.2, 0.0, 0.2)])
    rim_blocks(blocks, m, 'e', [(0.44, y, 0.12, 0.19, 0.2) for y in (-0.2, 0.0, 0.2, 0.4)])
    rim_blocks(blocks, m, 'c', [(0.42, -0.42, 0.17, 0.17, 0.27), (-0.42, 0.42, 0.16, 0.16, 0.2)])
    rim_blocks(blocks, m, 'w', [(-0.45, y, 0.09, 0.19, 0.13) for y in (-0.26, -0.06, 0.14)])
    rim_blocks(blocks, m, 'n', [(x, 0.45, 0.19, 0.09, 0.1) for x in (-0.2, 0.0, 0.2)])
    parts.append(bevel_join(blocks, 'blocks', 0.018))
    fender(parts, m, south(-0.5), 'fs', -0.42, 0.28, -0.17)
    fender(parts, m, east(0.5), 'fe', -0.28, 0.42, -0.17)
    done(join(parts, 'quay_corner'), 'quay_corner', size=512)


def quoins(parts, f, m, name, a, z0, z1, side, n=4, w=0.1):
    """Big corner stones; side = +1 means the stone grows towards +a."""
    step = (z1 - z0) / n
    for k in range(n):
        ww = w * (1.0 if k % 2 == 0 else 0.72)
        a0, a1 = (a, a + ww) if side > 0 else (a - ww, a)
        parts.append(f.rect(f'{name}{k}', a0, a1, z0 + k * step + 0.004, z0 + (k + 1) * step - 0.004, 0, 0.024, m.block))


def warehouse_a():
    reset()
    m = M()
    rng = random.Random(11)
    hw = 0.43
    z1, zj, zt, zr = 0.56, 0.62, 1.02, 1.52
    parts = [box('stone', (0, 0, z1 / 2), (2 * hw, 2 * hw, z1), m.masonry, skip=('-z',)),
             box('upper', (0, 0, (zj + zt) / 2), (2 * hw + 0.06, 2 * hw + 0.06, zt - zj), m.oak_v)]
    S, W, N, E = south(-hw), west(-hw), F((0, hw, 0), (-1, 0, 0), (0, 1, 0)), east(hw)
    door(parts, S, m, 'door', -0.21, 0.21, 0.0, 0.33, 0.13, double=True)
    stone_arch(parts, S, 'arch', -0.21, 0.21, 0.33, 0.13, 0.0, m.block, out=0.07)
    for f, nm in ((S, 's'), (W, 'w')):
        quoins(parts, f, m, f'{nm}ql', -hw, 0, z1, 1)
        quoins(parts, f, m, f'{nm}qr', hw, 0, z1, -1)
    window(parts, W, m, 'wl', 0.0, 0.24, 0.13, 0.16, arched=True)
    stone_arch(parts, W, 'wla', -0.08, 0.08, 0.34, 0.08, 0.2, m.block, out=0.04, d=0.024, n=4, jambs=1)
    # jetty: band of beams under the overhang, joist ends on the south
    parts.append(box('band', (0, 0, z1 + 0.03), (2 * hw + 0.1, 2 * hw + 0.1, 0.05), m.beam))
    parts.append(box('band2', (0, 0, zj + 0.01), (2 * hw + 0.08, 2 * hw + 0.08, 0.03), m.frame))
    for k, a in enumerate((-0.33, -0.11, 0.11, 0.33)):
        parts.append(S.rect(f'joist{k}', a - 0.022, a + 0.022, z1 - 0.05, z1, 0, 0.05, m.frame))
    U = south(-hw - 0.03)
    UW = west(-hw - 0.03)
    for f, nm in ((U, 'u'), (UW, 'v')):
        for a in (-hw - 0.01, hw - 0.01):
            parts.append(f.rect(f'{nm}post{a}', a, a + 0.05, zj, zt, 0, 0.018, m.beam))
        parts.append(f.rect(f'{nm}top', -hw - 0.02, hw + 0.02, zt - 0.045, zt, 0, 0.018, m.beam))
        parts.append(f.rect(f'{nm}mid', -0.02, 0.02, zj, zt, 0, 0.018, m.beam))
    for k, a in enumerate((-0.2, 0.2)):
        window(parts, U, m, f'up{k}', a, 0.74, 0.13, 0.16, surround=m.beam)
    window(parts, UW, m, 'upw', 0.2, 0.74, 0.13, 0.16, surround=m.beam)
    parts.append(beam('brace', U.p(-0.42, zj, 0.022), U.p(-0.27, zt - 0.04, 0.022), 0.022, m.beam))
    parts.append(beam('brace2', U.p(0.42, zj, 0.022), U.p(0.27, zt - 0.04, 0.022), 0.022, m.beam))
    # gable
    for d, nm, f in ((0, 'gs', U), (0, 'gn', F((0, hw + 0.03, 0), (1, 0, 0), (0, 1, 0)))):
        parts.append(gable(f, nm, -hw - 0.03, hw + 0.03, zt, zr, -0.02, 0.01, m.oak_v))
    window(parts, U, m, 'gw', 0.0, zt + 0.08, 0.1, 0.12, surround=m.beam)
    parts.append(U.rect('gpost', -0.015, 0.015, zt + 0.22, zr - 0.04, 0.01, 0.024, m.beam))
    roof(parts, m, 'r', 'y', -hw - 0.1, hw + 0.1, hw + 0.13, 0, zt - 0.12, zr + 0.03, 5, 5, rng)
    verge(parts, m, 'vs', 'y', -hw - 0.1, hw + 0.13, 0, zt - 0.12, zr + 0.03)
    verge(parts, m, 'vn', 'y', hw + 0.1, hw + 0.13, 0, zt - 0.12, zr + 0.03)
    done(join(parts, 'warehouse_a'), 'warehouse_a', size=512)


def warehouse_b():
    reset()
    m = M()
    rng = random.Random(12)
    hx, hy = 0.9, 0.43
    z1, zr = 0.56, 1.16
    parts = [box('stone', (0, 0, z1 / 2), (2 * hx, 2 * hy, z1), m.masonry, skip=('-z',))]
    S, W = south(-hy), west(-hx)
    Wg = F((-hx, 0, 0), (0, -1, 0), (-1, 0, 0))
    E = east(hx)
    parts.append(gable(Wg, 'gw', -hy, hy, z1, zr - 0.03, -0.02, 0.0, m.masonry))
    parts.append(gable(E, 'ge', -hy, hy, z1, zr - 0.03, -0.02, 0.0, m.masonry))
    for f, nm, a0, a1 in ((S, 's', -hx, hx), (W, 'w', -hy, hy)):
        quoins(parts, f, m, f'{nm}l', a0, 0, z1, 1)
        quoins(parts, f, m, f'{nm}r', a1, 0, z1, -1)
    door(parts, S, m, 'door', -0.14, 0.14, 0.0, 0.33, 0.05, handles=False)
    S2 = south(-hy)
    for s in (-1, 1):
        parts.append(S2.rect(f'dj{s}', s * 0.14 - (0.05 if s < 0 else 0), s * 0.14 + (0.05 if s > 0 else 0), 0.0, 0.4, 0, 0.022, m.block))
    parts.append(S2.rect('lintel', -0.2, 0.2, 0.38, 0.45, 0, 0.026, m.block))
    for k, a in enumerate((-0.56, 0.56)):
        window(parts, S, m, f'w{k}', a, 0.2, 0.16, 0.14, arched=True)
        stone_arch(parts, S, f'wa{k}', a - 0.1, a + 0.1, 0.3, 0.09, 0.18, m.block, out=0.045, d=0.026, n=4, jambs=1)
    window(parts, W, m, 'wg', 0.0, 0.22, 0.14, 0.14, arched=True)
    stone_arch(parts, W, 'wga', -0.09, 0.09, 0.32, 0.08, 0.2, m.block, out=0.045, d=0.026, n=4, jambs=1)
    roof(parts, m, 'r', 'x', -hx - 0.07, hx + 0.07, hy + 0.13, 0, z1 - 0.1, zr, 4, 10, rng, th=0.055)
    verge(parts, m, 'vw', 'x', -hx - 0.07, hy + 0.13, 0, z1 - 0.1, zr)
    verge(parts, m, 've', 'x', hx + 0.07, hy + 0.13, 0, z1 - 0.1, zr)
    # dormer with loft hatch and hoist
    dz0, dz1, dzr = 0.6, 0.85, 1.08
    y0 = -hy - 0.1
    D = south(y0)
    parts.append(box('dorm', (0, y0 + 0.2, (dz0 + dz1) / 2), (0.4, 0.4, dz1 - dz0), m.oak_v, skip=('-z',)))
    parts.append(loft('dg', [[D.p(-0.2, dz1, 0), D.p(0.2, dz1, 0), D.p(0, dzr, 0)], [D.p(-0.2, dz1, -0.46), D.p(0.2, dz1, -0.46), D.p(0, dzr, -0.46)]], m.oak_v))
    parts.append(D.plate('hatch', arch_pts(-0.12, 0.12, dz0 - 0.01, dz1 - 0.04, 0.12), 0, 0.012, m.oak_dark))
    for a in (-0.215, 0.185):
        parts.append(D.rect(f'dp{a}', a, a + 0.03, dz0 - 0.04, dz1 + 0.01, 0, 0.02, m.beam))
    parts.append(D.rect('sill', -0.24, 0.24, dz0 - 0.07, dz0 - 0.02, -0.02, 0.05, m.beam))
    for s in (-1, 1):
        parts.append(beam(f'drf{s}', D.p(s * 0.26, dz1 - 0.03, 0.04), D.p(0, dzr + 0.03, 0.04), 0.04, m.beam))
        parts.append(beam(f'drr{s}', D.p(s * 0.27, dz1 + 0.01, 0.06), D.p(0, dzr + 0.05, 0.06), 0.03, m.slate))
        for k in range(3):
            t = (k + 0.5) / 3
            a0, z0 = s * 0.27 * (1 - t), dzr + 0.05 - (dzr + 0.04 - dz1) * (1 - t)
            parts.append(beam(f'drt{s}{k}', (a0, y0 + 0.07, z0), (a0, y0 + 0.42, z0 - 0.02), 0.09, m.slate))
    hb = (0, y0 - 0.2, dzr - 0.01)
    parts.append(beam('hoist', (0, y0 + 0.05, dzr - 0.01), hb, 0.05, m.beam))
    parts.append(beam('hoistb', (0, y0 + 0.02, dz1 - 0.05), (0, y0 - 0.14, dzr - 0.02), 0.03, m.beam))
    parts.append(drum('pulley', (0.02, hb[1] + 0.02, hb[2] - 0.09), (-0.02, hb[1] + 0.02, hb[2] - 0.09), 0.04, m.frame, segs=8))
    parts.append(rope('hr', [(0, hb[1], hb[2] + 0.02), (0.012, hb[1], hb[2] - 0.1), (0.012, hb[1], hb[2] - 0.3)], 0.012, m.rope, pitch=0.03))
    pts = [(0.012, hb[1], hb[2] - 0.3), (0.012, hb[1], hb[2] - 0.36), (0.03, hb[1] - 0.012, hb[2] - 0.39), (0.0, hb[1] - 0.03, hb[2] - 0.4), (-0.02, hb[1] - 0.02, hb[2] - 0.37)]
    parts.append(tube('hook', pts, 0.008, m.iron, sides=4))
    done(join(parts, 'warehouse_b'), 'warehouse_b', size=512)


def crane_idle():
    """Chunky harbour crane: heavy timber cross on corner stones, post, jib to the east, treadwheel on the south-west."""
    reset()
    m = M()
    parts = []
    bx = 0.1
    for x, y in ((-0.34, -0.38), (0.46, -0.38), (-0.34, 0.38), (0.46, 0.38)):
        parts.append(box(f'cs{x}{y}', (x, y, 0.08), (0.18, 0.18, 0.16), m.block, skip=('-z',)))
    parts.append(box('b1', (bx, 0, 0.08), (0.72, 0.18, 0.12), m.oak))
    parts.append(box('b2', (bx, 0, 0.08), (0.18, 0.72, 0.12), m.oak))
    parts.append(box('b3', (bx, -0.38, 0.1), (0.64, 0.13, 0.1), m.oak))
    parts.append(box('b4', (bx, 0.38, 0.1), (0.64, 0.13, 0.1), m.oak))
    parts.append(box('b5', (-0.34, 0, 0.1), (0.13, 0.62, 0.1), m.oak))
    parts.append(box('b6', (0.46, 0, 0.1), (0.13, 0.62, 0.1), m.oak))
    top = 1.42
    parts.append(box('post', (bx, 0, 0.1 + (top - 0.1) / 2), (0.23, 0.23, top - 0.1), m.oak_v))
    parts.append(box('cap', (bx, 0, top + 0.03), (0.27, 0.27, 0.07), m.beam))
    parts.append(box('ring1', (bx, 0, 0.3), (0.3, 0.3, 0.11), m.beam))
    parts.append(box('ring2', (bx, 0, 0.92), (0.28, 0.28, 0.1), m.beam))
    for k, (x, y) in enumerate(((-0.26, -0.3), (0.4, -0.3), (-0.26, 0.3), (0.4, 0.3))):
        parts.append(beam(f'st{k}', (x, y, 0.14), (bx + (x - bx) * 0.2, y * 0.2, 0.7), 0.11, m.beam))
    head = (0.84, 0, 1.58)
    parts.append(beam('jib', (0.03, 0, 1.2), head, 0.14, m.beam))
    parts.append(beam('jibb', (0.2, 0, 0.84), (0.56, 0, 1.38), 0.1, m.beam))
    parts.append(box('jibh', (head[0] - 0.01, 0, head[2]), (0.15, 0.16, 0.15), m.frame))
    # treadwheel
    wy, wr = -0.24, 0.37
    wc = (-0.26, wy, 0.42)
    for off in (-0.065, 0.065):
        pts = [(wc[0] + math.cos(2 * math.pi * i / 16) * wr, wy + off, wc[2] + math.sin(2 * math.pi * i / 16) * wr) for i in range(17)]
        parts.append(tube(f'rim{off}', pts, 0.04, m.beam, sides=4))
    for i in range(6):
        a = 2 * math.pi * i / 6 + 0.26
        parts.append(beam(f'spoke{i}', (wc[0], wy - 0.065, wc[2]), (wc[0] + math.cos(a) * wr, wy - 0.065, wc[2] + math.sin(a) * wr), 0.05, m.beam))
    for i in range(16):
        a = 2 * math.pi * i / 16
        ca, sa = math.cos(a), math.sin(a)
        parts.append(box(f'pad{i}', (wc[0] + ca * (wr + 0.03), wy, wc[2] + sa * (wr + 0.03)), (0.05, 0.16, 0.05), m.frame, rot=(0, -a, 0)))
    parts.append(drum('axle', (wc[0], wy - 0.13, wc[2]), (wc[0], 0.05, wc[2]), 0.045, m.frame, segs=8))
    parts.append(beam('axle2', (wc[0], 0.03, wc[2]), (bx, 0.03, wc[2] + 0.02), 0.08, m.frame))
    parts.append(drum('hub', (wc[0], wy - 0.125, wc[2]), (wc[0], wy - 0.065, wc[2]), 0.08, m.iron, segs=8))
    # rope along the jib, wrapped at the head, pulley block and hook
    parts.append(rope('r0', [(bx, -0.1, 1.2), (0.45, -0.09, 1.44), (0.8, -0.09, 1.63)], 0.024, m.rope, pitch=0.05))
    pts = [(head[0] - 0.08, 0.1 * math.cos(2 * math.pi * i / 8), head[2] + 0.1 * math.sin(2 * math.pi * i / 8)) for i in range(9)]
    parts.append(tube('wrap', pts, 0.024, m.rope, sides=4))
    px, pz = head[0] + 0.02, head[2] - 0.24
    parts.append(rope('r1', [(px, 0, head[2] - 0.05), (px, 0, pz)], 0.022, m.rope, pitch=0.04))
    parts.append(drum('block', (px, -0.05, pz), (px, 0.05, pz), 0.085, m.frame, segs=10))
    parts.append(drum('blockc', (px, -0.058, pz), (px, 0.058, pz), 0.025, m.iron, segs=6))
    parts.append(rope('r2', [(px, 0, pz - 0.07), (px, 0, pz - 0.44)], 0.022, m.rope, pitch=0.04))
    hz = pz - 0.44
    hook = [(px, 0, hz), (px, 0, hz - 0.07), (px + 0.045, 0, hz - 0.12), (px + 0.0, 0, hz - 0.19), (px - 0.07, 0, hz - 0.15), (px - 0.07, 0, hz - 0.09)]
    parts.append(tube('hook', hook, 0.022, m.iron, sides=4))
    done(join(parts, 'crane_idle'), 'crane_idle', size=512)


def hull(name, m_outer, L, B, zk, zg, floor, n=14, sharp=2.4, sheer=0.2, flatb=0.26, th=0.05, rise=0.62):
    """Hollow hull along x with a wall thickness and a floor; returns (object, port rail points, starboard rail points, inner floor outline)."""
    rings, port, star, decks = [], [], [], []
    for i in range(n + 1):
        t = -1 + 2 * i / n
        wd = max(0.05, 1 - abs(t) ** sharp) ** 0.62
        x = t * L / 2
        top = zg + sheer * t * t
        bot = zk + (zg - zk) * rise * abs(t) ** 2.4
        y = B / 2 * wd
        h = top - bot
        fl = min(top - 0.02, floor + (top - floor) * 0.5 * abs(t) ** 4)
        w = min(th, y * 0.5)
        rings.append([(x, y, top), (x, y * 0.99, bot + h * 0.62), (x, y * 0.72, bot + h * 0.2), (x, y * flatb, bot), (x, -y * flatb, bot),
                      (x, -y * 0.72, bot + h * 0.2), (x, -y * 0.99, bot + h * 0.62), (x, -y, top), (x, -y + w, top), (x, -y + w, fl), (x, y - w, fl), (x, y - w, top)])
        port.append((x, y, top))
        star.append((x, -y, top))
        decks.append((x, y - w, fl))
    return loft(name, rings, m_outer), port, star, decks


def deck_plate(name, decks, mat, lift=0.006):
    rings = [[(x, y, z + lift), (x, -y, z + lift), (x, -y, z + lift - 0.012), (x, y, z + lift - 0.012)] for x, y, z in decks]
    return loft(name, rings, mat)


def fence(parts, m, name, x0, x1, y0, y1, z, h, faces=(0, 1, 2, 3)):
    """Crenellated timber fence of a ship castle: thick rail with tall and short posts around a rectangle."""
    corners = ((x0, y0), (x1, y0), (x1, y1), (x0, y1))
    for k in faces:
        a, b = corners[k], corners[(k + 1) % 4]
        ln = math.hypot(b[0] - a[0], b[1] - a[1])
        cnt = max(2, round(ln / 0.17))
        for i in range(cnt + 1):
            t = i / cnt
            px, py = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
            tall = h if i % 2 == 0 else h * 0.6
            parts.append(box(f'{name}m{k}{i}', (px, py, z + tall / 2), (0.075, 0.075, tall), m.beam, skip=('-z',)))
        parts.append(beam(f'{name}r{k}', (a[0], a[1], z + h * 0.5), (b[0], b[1], z + h * 0.5), 0.05, m.frame))
    parts.append(box(f'{name}f', ((x0 + x1) / 2, (y0 + y1) / 2, z - 0.005), (x1 - x0, y1 - y0, 0.03), m.deck))


def ship_a():
    """Stout cog on four by two tiles: deep tarred hull, castles fore and aft, single mast with furled sail. Bow to the west."""
    reset()
    m = M()
    tarred = pm('tarred', 'coast_planks.png', (1, 0, 0), (0, 0.4, 1), 1.9, tint=(0.42, 0.5, 0.62), zd=(0.05, 0.7, 0.55), ao=0.45, aod=0.08)
    L, B = 3.5, 1.56
    zg = 0.92
    obj, port, star, decks = hull('hull', tarred, L, B, 0.0, zg, 0.6, n=16, sharp=3.0, sheer=0.36, th=0.07, rise=0.55)
    parts = [obj, deck_plate('deck', decks, m.deck)]
    parts.append(tube('gs', [(x, y - 0.012, z + 0.012) for x, y, z in star], 0.05, m.beam, sides=4))
    parts.append(tube('gn', [(x, y + 0.012, z + 0.012) for x, y, z in port], 0.05, m.beam, sides=4))
    wale = [(x, y * 0.995 - 0.018, z - 0.3) for x, y, z in star]
    parts.append(tube('wale', wale, 0.038, m.frame, sides=4))
    parts.append(tube('waln', [(x, -y, z) for x, y, z in wale], 0.038, m.frame, sides=4))
    for k, i in enumerate((3, 5, 7, 9, 11, 13)):
        x, y, z = star[i]
        wd = abs(y)
        t = x / (L / 2)
        zb = 0.55 * zg * abs(t) ** 2.4 + 0.2
        bot = 0.55 * zg * abs(t) ** 2.4
        h = z - bot
        for sgn in (-1, 1):
            parts.append(tube(f'rib{k}{sgn}', [(x, sgn * (wd * 0.76 + 0.012), bot + h * 0.26), (x, sgn * (wd * 0.99 + 0.012), bot + h * 0.62), (x, sgn * (wd + 0.012), z)], 0.028, m.frame, sides=4))
        for zz in (z - 0.1,):
            nail(parts, f'n{k}{zz}', (x, -wd - 0.04, zz), m.iron, 0.016, axis='y')
    # stem and stern posts
    parts.append(tube('stem', [(-L / 2 - 0.0, 0, 0.5), (-L / 2 - 0.02, 0, 1.34)], 0.07, m.frame, sides=4))
    parts.append(tube('stern', [(L / 2 + 0.0, 0, 0.5), (L / 2 + 0.02, 0, 1.36)], 0.07, m.frame, sides=4))
    # aft castle: cabin with door and windows, fence on top
    cx0, cx1 = 0.56, 1.5
    cy = 0.46
    zc = 1.42
    parts.append(box('cab', ((cx0 + cx1) / 2, 0, (0.6 + zc) / 2), (cx1 - cx0, 2 * cy, zc - 0.6), m.oak_v, skip=('-z',)))
    C = west(cx0)
    door(parts, C, m, 'cd', -0.13, 0.13, 0.61, 0.98, 0.13, handles=False)
    window(parts, C, m, 'cw', 0.32, 1.0, 0.12, 0.14, arched=True, surround=m.beam, bars=False)
    window(parts, C, m, 'cw2', -0.32, 1.0, 0.12, 0.14, arched=True, surround=m.beam, bars=False)
    CS = south(-cy)
    window(parts, CS, m, 'csw', 1.03, 1.06, 0.14, 0.16, arched=True, surround=m.beam, bars=False)
    parts.append(box('capb', ((cx0 + cx1) / 2, 0, zc), (cx1 - cx0 + 0.08, 2 * cy + 0.08, 0.06), m.beam))
    fence(parts, m, 'af', cx0, cx1, -cy, cy, zc + 0.025, 0.28)
    # fore castle, lower
    fx0, fx1 = -1.56, -0.86
    fy = 0.4
    zf = 1.22
    parts.append(box('fcab', ((fx0 + fx1) / 2, 0, (0.6 + zf) / 2), (fx1 - fx0, 2 * fy, zf - 0.6), m.oak_v, skip=('-z',)))
    parts.append(box('fcap', ((fx0 + fx1) / 2, 0, zf), (fx1 - fx0 + 0.07, 2 * fy + 0.07, 0.06), m.beam))
    fence(parts, m, 'ff', fx0, fx1, -fy, fy, zf + 0.025, 0.26)
    # mast, crow's nest, yard, furled sail, rigging
    mx = -0.15
    mt = 3.3
    parts.append(cyl('mast', (mx, 0), 0.09, 0.6, mt, m.beam, segs=8, r1=0.07))
    parts.append(box('mcap', (mx, 0, mt + 0.03), (0.13, 0.13, 0.07), m.frame))
    parts.append(cyl('mfoot', (mx, 0), 0.15, 0.6, 0.74, m.frame, segs=8))
    nz = 2.92
    parts.append(cyl('nest', (mx, 0), 0.15, nz, nz + 0.05, m.frame, segs=10, r1=0.22))
    for i in range(8):
        a = 2 * math.pi * i / 8
        parts.append(box(f'nb{i}', (mx + math.cos(a) * 0.22, math.sin(a) * 0.22, nz + 0.13), (0.045, 0.045, 0.18), m.beam))
    parts.append(tube('nr', [(mx + math.cos(2 * math.pi * i / 10) * 0.22, math.sin(2 * math.pi * i / 10) * 0.22, nz + 0.22) for i in range(11)], 0.024, m.frame, sides=3))
    yz = 2.42
    ya, yb = (mx - 1.3, -0.14, yz - 0.06), (mx + 1.3, 0.14, yz + 0.06)
    parts.append(drum('yard', ya, yb, 0.055, m.frame, segs=8))
    N = 16
    rings = []
    for i in range(N + 1):
        t = i / N
        p = Vector(ya).lerp(Vector(yb), 0.05 + 0.9 * t)
        swag = abs(math.sin(math.pi * t * 4))
        drop = 0.3 + 0.34 * swag
        rings.append([tuple(p + Vector((0, -0.04, -0.01))), tuple(p + Vector((0, -0.13 - 0.07 * swag, -drop * 0.55))), tuple(p + Vector((0, -0.07 - 0.05 * swag, -drop))), tuple(p + Vector((0, 0.04, -drop * 0.6)))])
    parts.append(loft('sail', rings, m.canvas))
    for k in range(5):
        t = 0.05 + 0.9 * k / 4
        p = Vector(ya).lerp(Vector(yb), t)
        parts.append(rope(f'gask{k}', [p + Vector((0, -0.07, 0.07)), p + Vector((0, -0.11, -0.16)), p + Vector((0, -0.06, -0.32))], 0.02, m.rope, pitch=0.1, sides=3))
    for k, (x, y) in enumerate(((mx - 0.5, -0.68), (mx + 0.5, -0.7), (mx - 0.5, 0.66), (mx + 0.5, 0.68))):
        parts.append(rope(f'rg{k}', [(mx, 0, nz - 0.03), (x, y, zg + 0.04)], 0.018, m.rope, pitch=0.22, sides=3))
    done(join(parts, 'ship_a'), 'ship_a', size=1024)


def boat_a():
    """Rowing boat along x, about one tile long: deep hull, broad thwarts, oars out on both sides."""
    reset()
    m = M()
    wood = pm('hullw', 'coast_planks.png', (1, 0, 0), (0, 0.3, 1), 3.0, tint=(0.9, 1.1, 1.4), zd=(0.0, 0.2, 0.72), ao=0.4, aod=0.05)
    L, B = 1.04, 0.5
    obj, port, star, decks = hull('hull', wood, L, B, 0.0, 0.25, 0.08, n=12, sharp=2.2, sheer=0.08, flatb=0.3, th=0.036, rise=0.4)
    parts = [obj, deck_plate('floor', decks, m.deck)]
    parts.append(tube('gs', [(x, y - 0.002, z + 0.01) for x, y, z in star], 0.026, m.beam, sides=4))
    parts.append(tube('gn', [(x, y + 0.002, z + 0.01) for x, y, z in port], 0.026, m.beam, sides=4))
    for k, x in enumerate((-0.2, 0.13)):
        parts.append(box(f'th{k}', (x, 0, 0.19), (0.11, 0.42, 0.03), m.beam))
    parts.append(box('ks', (0.34, 0, 0.17), (0.08, 0.24, 0.026), m.beam))
    parts.append(box('rib', (-0.05, 0, 0.11), (0.03, 0.34, 0.02), m.frame))
    for k, x in enumerate((-L / 2, L / 2)):
        parts.append(box(f'post{k}', (x, 0, 0.21), (0.07, 0.1, 0.2), m.frame))
        parts.append(box(f'plate{k}', (x, 0, 0.1), (0.076, 0.106, 0.04), m.iron))
    for k, (y0, x1, y1) in enumerate(((-0.25, 0.32, -0.46), (0.25, 0.36, 0.46))):
        p0 = (-0.08, y0, 0.27)
        p1 = (x1, y1, 0.05)
        parts.append(beam(f'oar{k}', p0, p1, 0.024, m.beam))
        d = (Vector(p1) - Vector(p0)).normalized()
        c = Vector(p1) + d * 0.06
        parts.append(hexa(f'bl{k}', [c + Vector((-0.07, -0.032, -0.006)), c + Vector((0.07, -0.032, -0.016)), c + Vector((0.07, 0.032, -0.016)), c + Vector((-0.07, 0.032, -0.006)),
                                     c + Vector((-0.07, -0.032, 0.008)), c + Vector((0.07, -0.032, -0.004)), c + Vector((0.07, 0.032, -0.004)), c + Vector((-0.07, 0.032, 0.008))], m.oak))
    done(join(parts, 'boat_a'), 'boat_a', size=512)


def crate(parts, m, name, c, s, h, rot=0.0, cross_top=False):
    """Crate with edge battens and X braces on the sides the camera sees; rotates around c by rot."""
    start = len(parts)
    cx, cy, cz = c
    hs = s / 2
    t = s * 0.12
    parts.append(box(f'{name}b', (0, 0, h / 2), (s - t * 0.5, s - t * 0.5, h - t * 0.5), m.oak_v, skip=('-z',)))
    for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        parts.append(box(f'{name}v{sx}{sy}', (sx * (hs - t / 2), sy * (hs - t / 2), h / 2), (t, t, h), m.beam, skip=('-z',)))
    parts.append(box(f'{name}x0', (0, -hs + t / 2, t / 2), (s - t, t, t), m.beam))
    parts.append(box(f'{name}y0', (-hs + t / 2, 0, t / 2), (t, s - t, t), m.beam))
    for k, sy in enumerate((-1, 1)):
        parts.append(box(f'{name}x{k}t', (0, sy * (hs - t / 2), h - t / 2), (s - t, t, t), m.beam))
        parts.append(box(f'{name}y{k}t', (sy * (hs - t / 2), 0, h - t / 2), (t, s - t, t), m.beam))
    q = hs - t * 1.1
    inner = t * 0.55
    for k, (a, b) in enumerate((((-q, t), (q, h - t)), ((q, t), (-q, h - t)))):
        parts.append(beam(f'{name}xs{k}', (a[0], -hs + t * 0.2, a[1]), (b[0], -hs + t * 0.2, b[1]), inner, m.frame))
        parts.append(beam(f'{name}xw{k}', (-hs + t * 0.2, a[0], a[1]), (-hs + t * 0.2, b[0], b[1]), inner, m.frame))
        if cross_top:
            parts.append(beam(f'{name}xt{k}', (a[0], a[0] if k == 0 else -a[0], h - t * 0.2), (b[0], b[0] if k == 0 else -b[0], h - t * 0.2), inner, m.frame))
    ca, sa = math.cos(rot), math.sin(rot)
    for o in parts[start:]:
        for v in o.data.vertices:
            x, y = v.co.x, v.co.y
            v.co.x = cx + ca * x - sa * y
            v.co.y = cy + sa * x + ca * y
            v.co.z += cz


def boat_b():
    reset()
    m = M()
    wood = pm('hullb', 'coast_planks.png', (1, 0, 0), (0, 0.3, 1), 2.4, tint=(0.82, 1.0, 1.3), zd=(0.0, 0.28, 0.7), ao=0.4, aod=0.06)
    L, B = 1.92, 0.76
    obj, port, star, decks = hull('hull', wood, L, B, 0.0, 0.3, 0.1, n=14, sharp=4.2, sheer=0.05, flatb=0.5, th=0.045, rise=0.35)
    parts = [obj, deck_plate('floor', decks, m.deck)]
    parts.append(tube('gs', [(x, y - 0.002, z + 0.01) for x, y, z in star], 0.028, m.beam, sides=4))
    parts.append(tube('gn', [(x, y + 0.002, z + 0.01) for x, y, z in port], 0.028, m.beam, sides=4))
    for k, x in enumerate((-L / 2 + 0.03, L / 2 - 0.03)):
        parts.append(box(f'post{k}', (x, 0, 0.27), (0.08, 0.13, 0.22), m.frame))
    parts.append(box('th', (-0.56, 0, 0.22), (0.12, 0.62, 0.03), m.beam))
    for k, x in enumerate((-0.34, -0.72)):
        for sgn in (-1, 1):
            parts.append(box(f'knee{k}{sgn}', (x, sgn * 0.35, 0.34), (0.06, 0.04, 0.1), m.frame))
    crate(parts, m, 'c0', (-0.14, -0.08, 0.1), 0.28, 0.24, 0.1)
    crate(parts, m, 'c1', (0.17, 0.07, 0.1), 0.26, 0.26, -0.12)
    crate(parts, m, 'c2', (0.04, -0.14, 0.1), 0.2, 0.18, 0.3)
    # awning on six posts at the east end, patched canvas with a scalloped south hem
    x0, x1 = 0.34, 0.9
    w = 0.33
    for x in (x0, (x0 + x1) / 2, x1):
        for sgn in (-1, 1):
            parts.append(box(f'ap{x}{sgn}', (x, sgn * w, 0.42), (0.04, 0.04, 0.36), m.beam))
    n = 8
    rings = []
    for i in range(n + 1):
        t = i / n
        x = x0 - 0.04 + (x1 - x0 + 0.08) * t
        sc = 0.012 * math.sin(t * math.pi * 6)
        rings.append([(x, -w - 0.1 + sc, 0.46 + sc), (x, -w * 0.62, 0.7), (x, 0, 0.8), (x, w * 0.62, 0.7), (x, w + 0.1, 0.46),
                      (x, w * 0.62, 0.68), (x, 0, 0.78), (x, -w * 0.62, 0.68)])
    parts.append(loft('awn', rings, m.canvas))
    for k, (x, y, s) in enumerate(((0.62, -0.25, 0.1), (0.5, -0.02, 0.07))):
        z = 0.8 - abs(y) * 0.48
        dz = 0.03
        parts.append(hexa(f'pt{k}', [(x - s, y - s, z - dz - 0.02), (x + s, y - s, z - dz - 0.02), (x + s, y + s, z + dz - 0.02), (x - s, y + s, z + dz - 0.02),
                                     (x - s, y - s, z - dz + 0.01), (x + s, y - s, z - dz + 0.01), (x + s, y + s, z + dz + 0.01), (x - s, y + s, z + dz + 0.01)], m.canvas_dark))
    parts.append(rope('tie0', [(x0, -w, 0.58), (x0 - 0.01, -w - 0.03, 0.46)], 0.018, m.rope, pitch=0.03, sides=3))
    parts.append(rope('tie1', [(x0, w, 0.58), (x0 - 0.01, w + 0.03, 0.46)], 0.018, m.rope, pitch=0.03, sides=3))
    done(join(parts, 'boat_b'), 'boat_b', size=512)


def mooring_a():
    """Deco: stands in the north-west of the tile, the middle stays free."""
    reset()
    m = M()
    cx, cy = -0.2, 0.2
    r = 0.14
    h = 0.44
    post = pm('postw', 'coast_planks.png', (0, 0, 1), (1, 1, 0), 2.8, tint=(0.95, 1.2, 1.5), lichen=0.3, lscale=14, ao=0.3)
    parts = [cyl('post', (cx, cy), r, 0.0, h, post, segs=12)]
    parts.append(cyl('top', (cx, cy), r * 0.985, h, h + 0.022, m.deck_y, segs=12, r1=r * 0.82))
    for k, a in enumerate((0.3, 1.5, 2.6, 4.0, 5.2)):
        parts.append(box(f'crk{k}', (cx + math.cos(a) * r * 0.42, cy + math.sin(a) * r * 0.42, h + 0.023), (r * 0.84, 0.006, 0.002), m.frame, rot=(0, 0, a)))
    y = cy - r - 0.005
    parts.append(box('plate', (cx, y + 0.004, 0.34), (0.13, 0.02, 0.13), m.iron))
    parts.append(box('eye', (cx, y - 0.012, 0.32), (0.05, 0.04, 0.07), m.iron))
    pts = [(cx + math.cos(2 * math.pi * i / 12) * 0.078, y - 0.03, 0.26 + math.sin(2 * math.pi * i / 12) * 0.078) for i in range(13)]
    parts.append(tube('ring', pts, 0.02, m.iron, sides=5))
    for k, (rr, z) in enumerate(((r + 0.07, 0.04), (r + 0.075, 0.095), (r + 0.045, 0.145))):
        n = 20
        pts = [(cx + math.cos(0.4 * k + 2 * math.pi * i / n) * rr, cy + math.sin(0.4 * k + 2 * math.pi * i / n) * rr, z + 0.004 * math.sin(i)) for i in range(n + 1)]
        parts.append(tube(f'c{k}', pts, 0.038, m.rope, sides=4, radii=[1.0 if i % 2 == 0 else 0.7 for i in range(n + 1)], twist=0.7))
    done(join(parts, 'mooring_a'), 'mooring_a', size=512)


def crates_a():
    """Deco on the back half of the tile: two crates, a third on top, tied with thick rope."""
    reset()
    m = M()
    parts = []
    crate(parts, m, 'a', (-0.2, 0.2, 0.0), 0.34, 0.3)
    crate(parts, m, 'b', (0.18, 0.2, 0.0), 0.35, 0.3, 0.03)
    crate(parts, m, 'c', (-0.01, 0.22, 0.3), 0.36, 0.3, -0.06, cross_top=True)
    parts.append(rope('r0', [(-0.1, 0.02, 0.62), (-0.14, 0.015, 0.45), (-0.16, 0.015, 0.3), (-0.22, 0.015, 0.03)], 0.024, m.rope, pitch=0.07))
    parts.append(rope('r1', [(0.08, 0.02, 0.62), (0.14, 0.015, 0.42), (0.2, 0.015, 0.3)], 0.024, m.rope, pitch=0.07))
    parts.append(rope('r2', [(-0.1, 0.03, 0.62), (0.0, 0.2, 0.625), (0.08, 0.03, 0.62)], 0.024, m.rope, pitch=0.08))
    parts.append(sphere('kn', (-0.01, 0.06, 0.635), 0.04, m.rope, random.Random(2), squash=(1.2, 1, 0.8)))
    done(join(parts, 'crates_a'), 'crates_a', size=512)


def barrel(parts, m, name, a, b, r, stave, lid):
    prof = ((0.0, 0.84), (0.25, 0.97), (0.5, 1.05), (0.75, 0.97), (1.0, 0.84))
    parts.append(drum(f'{name}b', a, b, r, stave, segs=10, prof=prof))
    A, B = Vector(a), Vector(b)
    for k, (t, f) in enumerate(((0.12, 0.94), (0.3, 1.02), (0.7, 1.02), (0.88, 0.94))):
        parts.append(drum(f'{name}h{k}', A.lerp(B, t - 0.035), A.lerp(B, t + 0.035), r * f, m.iron, segs=10, cap=False))
    d = (B - A).normalized()
    parts.append(drum(f'{name}l1', B - d * 0.012, B + d * 0.003, r * 0.76, lid, segs=10))


def barrels_a():
    """Deco on the back half of the tile: two standing barrels, one lying in front."""
    reset()
    m = M()
    stave = pm('stave', 'coast_planks.png', (0, 0, 1), (1, 1, 0), 2.8, tint=(0.88, 1.1, 1.4), ao=0.35)
    parts = []
    barrel(parts, m, 'a', (-0.2, 0.26, 0.0), (-0.2, 0.26, 0.5), 0.2, stave, m.deck)
    barrel(parts, m, 'b', (0.2, 0.22, 0.0), (0.2, 0.22, 0.48), 0.195, stave, m.deck)
    barrel(parts, m, 'c', (0.18, -0.08, 0.175), (-0.15, -0.2, 0.175), 0.175, stave, m.deck_y)
    done(join(parts, 'barrels_a'), 'barrels_a', size=512)


# ---------------------------------------------------------------- market

def curtain(parts, m, name, x_post, x_in, y0, ztop, ztie, xtie, zbot, xbot, mat, depth=0.02, thick=0.03):
    """Pleated curtain from the top beam, gathered at the tie, falling to the floor."""
    pleats = 4
    rings = []
    for (x0, x1, z, amp) in ((x_post, x_in, ztop, 1.0), (x_post, xtie, ztie, 0.8), (x_post, xbot, zbot, 1.0)):
        outer, inner = [], []
        n = pleats * 2
        for i in range(n + 1):
            x = x0 + (x1 - x0) * i / n
            y = y0 - (depth * amp if i % 2 else 0.0)
            outer.append((x, y, z))
            inner.append((x, y + thick, z))
        rings.append(outer + inner[::-1])
    parts.append(loft(name, [rings[0], tuple(rings[1]), rings[2]], mat))


def stage_a():
    """Blocks its tile. Low plank platform, tall frame across the middle, heavy curtains drawn to the sides, pennants on top."""
    reset()
    m = M()
    hx, hy = 0.46, 0.36
    z = 0.22
    deck = pm('deckv', 'coast_planks.png', (0, 1, 0), (1, 0, 0), 2.2, tint=(0.95, 1.2, 1.6), aod=0.1)
    parts = [box('deck', (0, -0.04, z - 0.02), (2 * hx, 2 * hy, 0.06), deck)]
    for k in range(1, 7):
        x = -hx + 2 * hx * k / 7
        parts.append(box(f'seam{k}', (x, -0.04, z + 0.011), (0.01, 2 * hy - 0.02, 0.004), m.frame))
    parts.append(box('rail', (0, -hy - 0.04, z - 0.08), (2 * hx + 0.03, 0.06, 0.1), m.beam))
    parts.append(box('rail2', (0, hy - 0.04, z - 0.08), (2 * hx + 0.03, 0.06, 0.1), m.beam))
    parts.append(box('rail3', (-hx, -0.04, z - 0.08), (0.06, 2 * hy, 0.1), m.beam))
    parts.append(box('rail4', (hx, -0.04, z - 0.08), (0.06, 2 * hy, 0.1), m.beam))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(box(f'leg{sx}{sy}', (sx * (hx - 0.03), sy * (hy - 0.04) - 0.04, (z - 0.05) / 2), (0.1, 0.1, z - 0.05), m.frame, skip=('-z',)))
        parts.append(beam(f'br{sx}', (sx * (hx - 0.1), -hy - 0.04, 0.14), (sx * 0.22, -hy - 0.04, 0.03), 0.04, m.frame))
        for k, y in enumerate((-hy - 0.0, hy - 0.08)):
            nail(parts, f'n{sx}{k}', (sx * (hx - 0.05), y, z + 0.012), m.iron, 0.012)
    ytop = 0.2
    ztop = 1.14
    for sx in (-1, 1):
        x = sx * (hx - 0.03)
        parts.append(box(f'post{sx}', (x, ytop, (z + ztop) / 2), (0.09, 0.09, ztop - z), m.beam))
        parts.append(cyl(f'fin{sx}', (x, ytop), 0.026, ztop + 0.03, ztop + 0.16, m.gold, segs=6))
        parts.append(sphere(f'ball{sx}', (x, ytop, ztop + 0.2), 0.045, m.gold, random.Random(1)))
        pts = [[(x + 0.02, ytop, ztop + 0.17), (x + 0.02, ytop, ztop + 0.05), (x + 0.02, ytop + 0.008, ztop + 0.05), (x + 0.02, ytop + 0.008, ztop + 0.17)],
               [(x + 0.12, ytop - 0.016, ztop + 0.165), (x + 0.12, ytop - 0.016, ztop + 0.065), (x + 0.12, ytop - 0.008, ztop + 0.065), (x + 0.12, ytop - 0.008, ztop + 0.165)],
               [(x + 0.25, ytop + 0.016, ztop + 0.165), (x + 0.25, ytop + 0.016, ztop + 0.14), (x + 0.25, ytop + 0.024, ztop + 0.14), (x + 0.25, ytop + 0.024, ztop + 0.165)]]
        parts.append(loft(f'pen{sx}', pts, m.mustard))
    parts.append(box('top', (0, ytop, ztop - 0.01), (2 * hx + 0.04, 0.1, 0.11), m.beam))
    for sx in (-1, 1):
        nail(parts, f'tn{sx}', (sx * 0.4, ytop - 0.05, ztop - 0.01), m.iron, 0.012, axis='y')
    for sx in (-1, 1):
        px = sx * (hx - 0.06)
        curtain(parts, m, f'lin{sx}', px, sx * 0.0, ytop - 0.06, ztop - 0.06, 0.56, sx * 0.22, z, sx * 0.14, m.lining, depth=0.06)
        curtain(parts, m, f'vel{sx}', px + sx * 0.02, sx * 0.12, ytop - 0.13, ztop - 0.06, 0.58, sx * 0.28, z - 0.12, sx * 0.2, m.velvet, depth=0.07)
        tx = sx * 0.3
        pts = [(tx + sx * 0.1 * math.cos(2 * math.pi * i / 8), ytop - 0.15 + 0.06 * math.sin(2 * math.pi * i / 8), 0.56) for i in range(9)]
        parts.append(tube(f'tie{sx}', pts, 0.024, m.gold, sides=4))
        parts.append(cyl(f'tas{sx}', (tx - sx * 0.07, ytop - 0.22), 0.016, 0.56, 0.48, m.gold, segs=5))
        parts.append(cyl(f'tass{sx}', (tx - sx * 0.07, ytop - 0.22), 0.022, 0.48, 0.3, m.gold, segs=6, r1=0.05))
    done(join(parts, 'stage_a'), 'stage_a', size=512)


def tent_market_a():
    reset()
    m = M()
    rng = random.Random(41)
    n = 12
    R, Rb = 0.45, 0.5
    ze, zt = 0.68, 1.22
    off = 0.0
    parts = []

    def on(r, i, z):
        a = off + 2 * math.pi * i / n
        return (math.cos(a) * r, math.sin(a) * r, z)

    front = {8, 9}  # the two segments facing south
    for i in range(n):
        mat = m.ochre if i % 2 else m.cream
        j = i + 1
        parts.append(loft(f'rf{i}', [[on(R + 0.02, i, ze), on(R + 0.02, j, ze), on(R * 0.5, j, ze + (zt - ze) * 0.56), on(R * 0.5, i, ze + (zt - ze) * 0.56)],
                                     [on(R + 0.01, i, ze), on(R + 0.01, j, ze), on(R * 0.5 - 0.01, j, ze + (zt - ze) * 0.54), on(R * 0.5 - 0.01, i, ze + (zt - ze) * 0.54)]], mat))
        parts.append(loft(f'rt{i}', [[on(R * 0.5, i, ze + (zt - ze) * 0.56), on(R * 0.5, j, ze + (zt - ze) * 0.56), on(0.04, j, zt), on(0.04, i, zt)],
                                     [on(R * 0.5 - 0.01, i, ze + (zt - ze) * 0.54), on(R * 0.5 - 0.01, j, ze + (zt - ze) * 0.54), on(0.03, j, zt - 0.02), on(0.03, i, zt - 0.02)]], mat))
        # scalloped valance
        hem = []
        for k in range(5):
            t = k / 4
            a = off + 2 * math.pi * (i + t) / n
            hem.append((math.cos(a) * (R + 0.045), math.sin(a) * (R + 0.045), ze - 0.05 - 0.075 * math.sin(math.pi * t)))
        top = [on(R + 0.03, i, ze + 0.015), on(R + 0.03, j, ze + 0.015)]
        parts.append(loft(f'val{i}', [[top[0], top[1], *hem[::-1]], [tuple(Vector(p) * Vector((0.96, 0.96, 1))) for p in (top[0], top[1], *hem[::-1])]], m.ochre if i % 2 == 0 else m.cream))
        # wall
        if i not in front:
            mat2 = m.cream if i % 2 else m.ochre
            parts.append(loft(f'w{i}', [[on(R, i, ze), on(R, j, ze), on(Rb, j, 0.0), on(Rb, i, 0.0)], [on(R - 0.02, i, ze), on(R - 0.02, j, ze), on(Rb - 0.02, j, 0.0), on(Rb - 0.02, i, 0.0)]], mat2))
    parts.append(sphere('ball', (0, 0, zt + 0.055), 0.06, m.gold, rng))
    parts.append(cyl('neck', (0, 0), 0.05, zt - 0.02, zt + 0.02, m.gold, segs=8))
    # dark inside and floor, front posts
    parts.append(box('in', (0, -0.06, ze / 2 + 0.05), (0.84, 0.03, ze + 0.1), m.tent_in))
    parts.append(box('inr', (0, -0.3, ze + 0.02), (0.84, 0.5, 0.02), m.tent_in))
    a0 = off + 2 * math.pi * 8 / n
    a1 = off + 2 * math.pi * 10 / n
    fl, fr = on(Rb, 8, 0.0), on(Rb, 10, 0.0)
    for k, p in enumerate((fl, fr)):
        parts.append(box(f'fp{k}', (p[0], p[1], ze / 2), (0.04, 0.04, ze), m.frame, skip=('-z',)))
    parts.append(box('flr', (0, -0.3, 0.012), (0.5, 0.3, 0.024), m.sack))
    # goods in the opening
    stave = pm('stave', 'coast_planks.png', (0, 0, 1), (1, 1, 0), 3.5, tint=(0.7, 0.85, 1.05), ao=0.3)
    parts.append(drum('b0', (-0.16, -0.3, 0.02), (-0.16, -0.3, 0.26), 0.085, stave, segs=8, prof=((0, 0.86), (0.5, 1.04), (1, 0.86))))
    parts.append(drum('b0h', (-0.16, -0.3, 0.12), (-0.16, -0.3, 0.16), 0.09, m.iron, segs=8))
    parts.append(box('bench', (0.04, -0.24, 0.22), (0.34, 0.13, 0.03), m.beam))
    for s in (-1, 1):
        parts.append(box(f'bl{s}', (0.04 + s * 0.14, -0.24, 0.105), (0.03, 0.1, 0.21), m.frame))
    parts.append(box('crate', (-0.02, -0.24, 0.3), (0.14, 0.11, 0.13), m.oak_v))
    parts.append(drum('b1', (0.12, -0.24, 0.235), (0.12, -0.24, 0.37), 0.06, stave, segs=8, prof=((0, 0.86), (0.5, 1.04), (1, 0.86))))
    parts.append(sphere('sack', (0.2, -0.38, 0.1), 0.1, m.sack, rng, squash=(1.0, 0.95, 1.05), jitter=0.05))
    parts.append(cyl('sneck', (0.2, -0.38), 0.035, 0.18, 0.24, m.sack, segs=6, r1=0.04))
    # guy ropes and pegs
    for k, (a, px, py) in enumerate(((2.4, -0.62, -0.1), (3.6, -0.56, -0.5), (5.8, 0.55, -0.5))):
        ax, ay = math.cos(a) * (R + 0.03), math.sin(a) * (R + 0.03)
        a2 = {0: (-0.34, -0.06), 1: (-0.36, -0.2), 2: (0.36, -0.2)}[k]
        parts.append(rope(f'gr{k}', [(a2[0], a2[1], ze - 0.03), (px, py, 0.05)], 0.016, m.rope, pitch=0.07, sides=3))
        parts.append(box(f'peg{k}', (px, py, 0.04), (0.045, 0.045, 0.08), m.frame))
    done(join(parts, 'tent_market_a'), 'tent_market_a', size=512)


# ---------------------------------------------------------------- rope bridge

def plank(parts, m, name, y, w, d, z, rng, nails=True):
    hw = w / 2
    dz = 0.022
    j = lambda: rng.uniform(-0.008, 0.008)
    parts.append(hexa(name, [(-hw + j(), y - d / 2, z - dz), (hw + j(), y - d / 2, z - dz), (hw + j(), y + d / 2, z - dz), (-hw + j(), y + d / 2, z - dz),
                             (-hw + j(), y - d / 2, z + dz), (hw + j(), y - d / 2, z + dz), (hw + j(), y + d / 2, z + dz), (-hw + j(), y + d / 2, z + dz)], m.deck))
    if nails:
        nail(parts, f'{name}n0', (-hw + 0.04, y, z + dz), m.iron, 0.012)
        nail(parts, f'{name}n1', (hw - 0.04, y, z + dz), m.iron, 0.012)


def rope_bridge_straight():
    """Walkable, one tile north-south; no floor between the planks. Rails reach the tile edges so tiles join up."""
    reset()
    m = M()
    rng = random.Random(51)
    parts = []
    n = 6
    sg = 0.03
    for i in range(n):
        y = -0.5 + (i + 0.5) / n
        z = 0.06 - sg * 4 * ((i + 0.5) / n) * (1 - (i + 0.5) / n)
        plank(parts, m, f'p{i}', y, 0.62 + rng.uniform(-0.02, 0.02), 0.115, z, rng)
    for sx in (-1, 1):
        x = sx * 0.33
        parts.append(rope(f'fr{sx}', sag((x, -0.5, 0.05), (x, 0.5, 0.05), sg), 0.03, m.rope, pitch=0.11))
        parts.append(rope(f'tr{sx}', sag((x, -0.5, 0.46), (x, 0.5, 0.46), sg * 1.4), 0.036, m.rope, pitch=0.09))
        for k, y in enumerate((-0.17, 0.17)):
            t = y + 0.5
            parts.append(rope(f'h{sx}{k}', [(x, y, 0.46 - sg * 1.4 * 4 * t * (1 - t)), (x, y, 0.05 - sg * 4 * t * (1 - t))], 0.018, m.rope, pitch=0.1, sides=3))
        for k, y in enumerate((-0.47, 0.47)):
            parts.append(rope(f'e{sx}{k}', [(x, y, 0.5), (x, y, 0.03)], 0.026, m.rope, pitch=0.1))
            parts.append(octa(f'kn{sx}{k}', (x, y, 0.5), 0.05, m.rope, rng, squash=1.1))
    done(join(parts, 'rope_bridge_straight'), 'rope_bridge_straight', size=512)


def rope_bridge_end():
    """Anchor at the north edge of the gap: two thick posts on a rock ledge, the first planks run south. The board turns it for the other end."""
    reset()
    m = M()
    rng = random.Random(52)
    parts = []
    for i, (x, y, rx, ry, h) in enumerate(((-0.34, 0.26, 0.2, 0.22, 0.22), (0.34, 0.26, 0.2, 0.22, 0.24), (0.0, 0.34, 0.22, 0.16, 0.18), (-0.42, -0.02, 0.1, 0.13, 0.15), (0.42, -0.02, 0.1, 0.13, 0.17))):
        parts.append(boulder(f'rk{i}', (x, y), rx, ry, 0.0, h, rng, m.rock, top=(0.6, 0.75)))
    parts.append(hexa('top', [(-0.32, 0.05, 0.0), (0.32, 0.05, 0.0), (0.42, 0.48, 0.0), (-0.42, 0.48, 0.0),
                              (-0.3, 0.07, 0.15), (0.3, 0.07, 0.15), (0.36, 0.44, 0.19), (-0.36, 0.44, 0.19)], m.rock_pale))
    post = pm('postw', 'coast_planks.png', (0, 0, 1), (1, 1, 0), 2.6, tint=(0.9, 1.15, 1.45), ao=0.3)
    zt = 0.84
    for s in (-1, 1):
        x, y = s * 0.27, 0.27
        parts.append(cyl(f'post{s}', (x, y), 0.105, 0.1, zt, post, segs=8))
        parts.append(cyl(f'top{s}', (x, y), 0.105, zt, zt + 0.014, m.deck, segs=8, r1=0.09))
        for k, z in enumerate((0.56, 0.63)):
            parts.append(tube(f'wr{s}{k}', hoop((x, y, z), 0.115, n=8), 0.034, m.rope, sides=3, radii=[1.0 if i % 2 == 0 else 0.76 for i in range(9)], twist=0.5))
        parts.append(rope(f'tr{s}', [(x, y - 0.1, 0.58), (s * 0.33, -0.5, 0.42)], 0.03, m.rope, pitch=0.13))
        parts.append(rope(f'fr{s}', [(x, y - 0.1, 0.17), (s * 0.33, -0.5, 0.05)], 0.026, m.rope, pitch=0.16))
        parts.append(rope(f'h{s}', [(s * 0.31, -0.2, 0.51), (s * 0.31, -0.2, 0.1)], 0.018, m.rope, pitch=0.1, sides=3))
        parts.append(octa(f'kn{s}', (s * 0.33, -0.47, 0.42), 0.045, m.rope, rng, squash=1.1))
    for i in range(4):
        plank(parts, m, f'p{i}', -0.43 + i * 0.165, 0.6, 0.12, 0.06 + i * 0.022, rng)
    done(join(parts, 'rope_bridge_end'), 'rope_bridge_end', size=512)


# ---------------------------------------------------------------- highland

def grass_top(parts, m, rng, x0, x1, y0, y1, z, name='g', tufts=10, fringe=True):
    """Golden grass plate with a shaggy fringe along the south and tufts on top."""
    parts.append(box(f'{name}p', ((x0 + x1) / 2, (y0 + y1) / 2, z + 0.012), (x1 - x0, y1 - y0, 0.045), m.grass))
    for k in range(tufts):
        tuft(parts, f'{name}t{k}', (rng.uniform(x0 + 0.05, x1 - 0.05), rng.uniform(y0 + 0.05, y1 - 0.05), z + 0.03), 0.06, rng, m.tuft)


def waterfall_a():
    """Sperrend, one tile: stepped rock on three levels, a two-stage fall down the middle into a foaming pool at the south edge. Streaked water and foam at every break, so it reads as moving from above."""
    reset()
    m = M()
    rng = random.Random(61)
    m.rock = pm('rockl', 'coast_rock.png', SHEAR_U, SHEAR_V, 1.7, tint=(1.14, 1.08, 1.06), lichen=0.34, lscale=12, aod=0.14, ao=0.8)
    fall = pm('fall', 'coast_fall.png', (1, 0, 0), (0, 0.6, 0.8), 1.5, ao=0, shade=(0.96, 1.04))
    run = pm('run', 'coast_fall.png', (1, 0, 0), (0, 1, 0), 1.5, tint=(0.8, 0.88, 0.94), ao=0, shade=(0.96, 1.04))
    basin = pm('basin', 'coast_ripple.png', (1, 0, 0), (0, 1, 0), 1.3, ao=0, shade=(0.96, 1.04))
    parts = []
    tiers = [(-0.28, 0.44), (0.04, 0.78), (0.33, 1.06)]
    for t, (y, zt) in enumerate(tiers):
        for s, x in enumerate((-0.36, 0.36)):
            parts.append(column(f'c{t}{s}', x, y, 0.27, 0.42, 0.0, zt + rng.uniform(-0.02, 0.03), rng, m.rock))
    parts.append(column('lo0', -0.42, -0.42, 0.16, 0.13, 0.0, 0.2, rng, m.rock))
    parts.append(column('lo1', 0.42, -0.42, 0.16, 0.13, 0.0, 0.26, rng, m.rock))
    parts.append(box('back', (0, 0.34, 0.5), (0.98, 0.32, 1.0), m.rock, skip=('-z',)))
    parts.append(box('bed1', (0, -0.015, 0.31), (0.56, 0.37, 0.62), m.rock, skip=('-z',)))
    parts.append(boulder('crown', (-0.08, 0.38), 0.22, 0.12, 0.98, 1.26, rng, m.rock, top=(0.5, 0.65)))
    parts.append(boulder('r0', (0.3, 0.38), 0.14, 0.1, 1.04, 1.18, rng, m.rock))
    # the fall narrows at the top and spreads downwards, boulders break the straight banks
    top, mid = 0.94, 0.62
    y1, y2, y3 = 0.17, -0.2, -0.32
    wt, wm, wb = 0.15, 0.19, 0.23
    parts.append(hexa('run', [(-wt, y1, top), (wt, y1, top), (wt, 0.36, top + 0.02), (-wt, 0.36, top + 0.02),
                              (-wt, y1, top + 0.012), (wt, y1, top + 0.012), (wt, 0.36, top + 0.032), (-wt, 0.36, top + 0.032)], run))
    parts.append(loft('fall1', [[(-wt, y1 + 0.01, top + 0.012), (wt, y1 + 0.01, top + 0.012), (wt, y1 + 0.04, top + 0.012), (-wt, y1 + 0.04, top + 0.012)],
                                [(-wt, y1 - 0.025, top - 0.01), (wt, y1 - 0.025, top - 0.01), (wt, y1, top - 0.01), (-wt, y1, top - 0.01)],
                                [(-wm, y2 + 0.045, mid + 0.01), (wm, y2 + 0.045, mid + 0.01), (wm, y2 + 0.08, mid + 0.01), (-wm, y2 + 0.08, mid + 0.01)]], fall))
    parts.append(hexa('run2', [(-wm, y2, mid), (wm, y2, mid), (wm, y2 + 0.1, mid), (-wm, y2 + 0.1, mid),
                               (-wm, y2, mid + 0.015), (wm, y2, mid + 0.015), (wm, y2 + 0.1, mid + 0.015), (-wm, y2 + 0.1, mid + 0.015)], run))
    parts.append(loft('fall2', [[(-wm, y2 + 0.01, mid + 0.015), (wm, y2 + 0.01, mid + 0.015), (wm, y2 + 0.04, mid + 0.015), (-wm, y2 + 0.04, mid + 0.015)],
                                [(-wm, y2 - 0.025, mid - 0.01), (wm, y2 - 0.025, mid - 0.01), (wm, y2, mid - 0.01), (-wm, y2, mid - 0.01)],
                                [(-wb, y3, 0.05), (wb, y3, 0.05), (wb, y3 + 0.05, 0.05), (-wb, y3 + 0.05, 0.05)]], fall))
    # foam: a lip where the water tips over, a churning band where it lands
    for k in range(7):
        x = -wt + 2 * wt * k / 6
        parts.append(octa(f'fl{k}', (x, y1 - 0.005, top + 0.012), rng.uniform(0.018, 0.026), m.foam, rng, squash=0.6))
    for k in range(9):
        x = -wm + 2 * wm * k / 8
        parts.append(octa(f'fm{k}', (x, y2 + rng.uniform(0.04, 0.09), mid + 0.012), rng.uniform(0.03, 0.044), m.foam, rng, squash=0.7))
    for k in range(7):
        x = -wm + 2 * wm * k / 6
        parts.append(octa(f'fn{k}', (x, y2 + 0.006, mid + 0.012), rng.uniform(0.016, 0.024), m.foam, rng, squash=0.6))
    for k in range(13):
        x = -wb - 0.06 + (2 * wb + 0.12) * k / 12
        parts.append(octa(f'fb{k}', (x, y3 - rng.uniform(-0.02, 0.05), 0.045), rng.uniform(0.038, 0.06), m.foam, rng, squash=0.7))
    # boulders over the banks
    for k, (x, y, r, z0, z1) in enumerate(((-0.2, 0.02, 0.075, top - 0.2, 0.88), (0.21, 0.08, 0.07, top - 0.2, 0.9), (-0.23, -0.14, 0.07, mid - 0.2, mid + 0.06), (0.24, -0.1, 0.075, mid - 0.2, mid + 0.08), (-0.29, -0.3, 0.075, 0.0, 0.2), (0.3, -0.3, 0.08, 0.0, 0.24), (-0.2, 0.3, 0.06, top - 0.04, top + 0.08), (0.19, 0.27, 0.06, top - 0.04, top + 0.07))):
        parts.append(boulder(f'bk{k}', (x, y), r, r * 1.2, z0, z1, rng, m.rock, top=(0.55, 0.7)))
    parts.append(boulder('r1', (-0.26, -0.47), 0.07, 0.05, 0.0, 0.1, rng, m.rock))
    parts.append(boulder('r2', (0.28, -0.47), 0.07, 0.05, 0.0, 0.12, rng, m.rock))
    ring = [(0.42 * math.cos(2 * math.pi * i / 14) * (1 + 0.08 * math.sin(i * 2.2)), -0.36 + 0.13 * math.sin(2 * math.pi * i / 14), 0.0) for i in range(14)]
    parts.append(loft('pool', [ring, [(x, y, 0.03) for x, y, _ in ring]], basin))
    for k, (x, y, z, r) in enumerate(((-0.36, 0.26, 1.06, 0.15), (0.36, 0.24, 1.08, 0.14), (-0.37, -0.28, 0.45, 0.13), (0.37, -0.28, 0.45, 0.13), (-0.37, 0.03, 0.79, 0.13), (0.37, 0.03, 0.79, 0.13))):
        parts.append(boulder(f'gp{k}', (x, y), r, r, z - 0.02, z + 0.02, rng, m.grass, top=(0.85, 0.95)))
        for j in range(3):
            tuft(parts, f'gt{k}{j}', (x + rng.uniform(-0.09, 0.09), y + rng.uniform(-0.09, 0.09), z + 0.012), 0.08, rng, m.tuft, spikes=2)
    flowers(parts, 'fa', (0.3, 0.2, 1.1), rng, m.flower, r=0.022)
    flowers(parts, 'fb', (-0.32, -0.3, 0.48), rng, m.flower, r=0.022)
    flowers(parts, 'fc', (0.32, 0.03, 0.82), rng, m.flower, r=0.022)
    parts.append(sphere('am', (-0.34, 0.3, 1.1), 0.05, m.amber, rng, squash=(1.2, 1.1, 0.8), jitter=0.2))
    parts.append(sphere('am2', (-0.42, 0.05, 0.83), 0.04, m.amber, rng, squash=(1.2, 1.1, 0.8), jitter=0.2))
    done(join(parts, 'waterfall_a'), 'waterfall_a', size=512)


def ivy(parts, m, rng, f, a0, a1, z0, z1, count=46):
    vine = [f.p(a0 + (a1 - a0) * 0.35, z0, 0.02), f.p(a0 + (a1 - a0) * 0.55, (z0 + z1) * 0.5, 0.025), f.p(a0 + (a1 - a0) * 0.75, z1, 0.02)]
    parts.append(tube('vine', vine, 0.01, m.frame, sides=3))
    for k in range(count):
        t = rng.random() ** 0.7
        a = a0 + (a1 - a0) * rng.uniform(0.0, 1.0) * (1 - 0.4 * t) + (a1 - a0) * 0.32 * t
        z = z0 + (z1 - z0) * t
        s = rng.uniform(0.032, 0.052)
        ang = rng.uniform(0, 6.28)
        pts = [f.p(a + math.cos(ang + i * 1.57) * s, z + math.sin(ang + i * 1.57) * s, 0.024 + rng.uniform(0, 0.012)) for i in range(4)]
        parts.append(hexa_flat(f'lf{k}', pts, m.amber))


def hexa_flat(name, pts, mat):
    c = Vector(pts[0]).lerp(Vector(pts[2]), 0.5)
    return loft(name, [pts, [tuple(c)]], mat, cap=False)


def monastery_a():
    """Two by two tiles, gable and door on the south, bell gable over the door."""
    reset()
    m = M()
    rng = random.Random(62)
    hx, hy = 0.72, 0.86
    z1, zr = 0.92, 1.72
    parts = [box('walls', (0, 0, z1 / 2), (2 * hx, 2 * hy, z1), m.pale, skip=('-z',))]
    S, W = south(-hy), west(-hx)
    N = F((0, hy, 0), (1, 0, 0), (0, 1, 0))
    parts.append(gable(S, 'gs', -hx, hx, z1, zr, -0.02, 0.0, m.pale))
    parts.append(gable(N, 'gn', -hx, hx, z1, zr, -0.02, 0.0, m.pale))
    # plinth
    parts.append(box('pl', (0, 0, 0.05), (2 * hx + 0.05, 2 * hy + 0.05, 0.1), m.block, skip=('-z',)))
    # door, deep stone arch, steps
    door(parts, S, m, 'door', -0.2, 0.2, 0.0, 0.5, 0.2, double=True, handles=True)
    stone_arch(parts, S, 'arch', -0.2, 0.2, 0.5, 0.2, 0.08, m.pale_block, out=0.1, d=0.05, n=7, jambs=3)
    for k, (w, d, z) in enumerate(((0.72, 0.2, 0.03), (0.54, 0.12, 0.09))):
        parts.append(box(f'st{k}', (0, -hy - d / 2, z), (w, d, 0.06 if k == 0 else 0.06), m.pale_block, skip=('-z',)))
    for k, a in enumerate((-0.48, 0.48)):
        window(parts, S, m, f'sw{k}', a, 0.42, 0.14, 0.26, arched=True, surround=m.pale_block, bars=True)
    window(parts, S, m, 'up', 0.0, 1.08, 0.12, 0.22, arched=True, surround=m.pale_block, bars=True)
    for k, a in enumerate((-0.5, 0.0, 0.5)):
        window(parts, W, m, f'wn{k}', a, 0.42, 0.14, 0.28, arched=True, surround=m.pale_block, bars=True)
    # buttresses on the west side and the corners
    for k, a in enumerate((-0.25, 0.25)):
        parts.append(W.rect(f'bu{k}', a - 0.05, a + 0.05, 0.0, 0.72, 0, 0.07, m.pale_block))
    roof(parts, m, 'r', 'y', -hy - 0.03, hy + 0.09, hx + 0.13, 0, z1 - 0.1, zr + 0.03, 6, 8, rng, th=0.07)
    verge(parts, m, 'vs', 'y', -hy - 0.03, hx + 0.13, 0, z1 - 0.1, zr + 0.03, finial=False)
    verge(parts, m, 'vn', 'y', hy + 0.09, hx + 0.13, 0, z1 - 0.1, zr + 0.03, finial=False)
    # bell gable above the south peak
    by = -hy - 0.015
    bw = 0.27
    bz0, bz1 = zr - 0.22, zr + 0.5
    B = south(by)
    parts.append(B.rect('bbase', -bw - 0.04, bw + 0.04, bz0 - 0.04, bz0 + 0.06, -0.03, 0.04, m.pale_block))
    for s in (-1, 1):
        parts.append(box(f'bp{s}', (s * (bw - 0.03), by + 0.0, (bz0 + bz1) / 2), (0.12, 0.18, bz1 - bz0), m.pale, skip=()))
    for i in range(5):
        t0, t1 = math.pi * (i + 0.03) / 5, math.pi * (i + 0.97) / 5
        h = bw - 0.08
        q = [(h * math.cos(t0), bz1 - 0.12 + h * 0.8 * math.sin(t0)), ((h + 0.07) * math.cos(t0), bz1 - 0.12 + (h * 0.8 + 0.07) * math.sin(t0)),
             ((h + 0.07) * math.cos(t1), bz1 - 0.12 + (h * 0.8 + 0.07) * math.sin(t1)), (h * math.cos(t1), bz1 - 0.12 + h * 0.8 * math.sin(t1))]
        parts.append(B.plate(f'bv{i}', q, -0.07, 0.07, m.pale_block))
    parts.append(loft('bcap', [[B.p(-bw - 0.05, bz1 + 0.02, -0.1), B.p(bw + 0.05, bz1 + 0.02, -0.1), B.p(0, bz1 + 0.17, -0.1)],
                               [B.p(-bw - 0.05, bz1 + 0.02, 0.1), B.p(bw + 0.05, bz1 + 0.02, 0.1), B.p(0, bz1 + 0.17, 0.1)]], m.pale_block))
    # plain stone finial where the sheet has a cross: no religious sign until the narrative asks for one
    parts.append(box('fb', (0, by, bz1 + 0.2), (0.07, 0.07, 0.08), m.pale_block))
    parts.append(sphere('fs', (0, by, bz1 + 0.27), 0.05, m.pale_block, rng))
    # bell
    bell = [circle((0, by), r, z, 10) for r, z in ((0.13, bz0 + 0.12), (0.095, bz0 + 0.17), (0.07, bz0 + 0.26), (0.062, bz0 + 0.33), (0.026, bz0 + 0.37))]
    parts.append(loft('bell', bell, m.gold))
    parts.append(box('byoke', (0, by, bz0 + 0.38), (0.26, 0.04, 0.04), m.frame))
    # ivy on the south-east corner and amber plants at the foot
    ivy(parts, m, rng, S, 0.3, 0.72, 0.08, 1.02, count=60)
    shrubs(parts, 'sh', [(-0.7, -hy - 0.03), (-0.34, -hy - 0.04), (0.42, -hy - 0.04), (0.72, -hy - 0.03), (-hx - 0.03, -0.72), (-hx - 0.03, 0.72)], rng, m, 0.045)
    done(join(parts, 'monastery_a'), 'monastery_a', size=1024)


def chimney(parts, m, name, x, y, z0, z1, w=0.14):
    parts.append(box(f'{name}b', (x, y, (z0 + z1) / 2), (w, w, z1 - z0), m.masonry))
    parts.append(box(f'{name}c', (x, y, z1 + 0.02), (w + 0.04, w + 0.04, 0.05), m.pale_block))
    parts.append(box(f'{name}h', (x, y, z1 + 0.046), (w * 0.55, w * 0.55, 0.006), m.dark))


def foot_stones(parts, m, name, pts, rng):
    for i, (x, y, r) in enumerate(pts):
        parts.append(boulder(f'{name}{i}', (x, y), r, r * 0.85, 0.0, r * 1.2, rng, m.stone))


def house_slate_a():
    """Gable to the south: fieldstone ground floor, dark timber gable, heavy slate."""
    reset()
    m = M()
    rng = random.Random(63)
    hx, hy = 0.44, 0.42
    z1, zr = 0.52, 1.04
    parts = [box('walls', (0, 0, z1 / 2), (2 * hx, 2 * hy, z1), m.field, skip=('-z',))]
    S, W = south(-hy), west(-hx)
    N = F((0, hy, 0), (1, 0, 0), (0, 1, 0))
    parts.append(gable(S, 'gs', -hx, hx, z1, zr, -0.03, 0.0, m.oak_dark))
    parts.append(gable(N, 'gn', -hx, hx, z1, zr, -0.03, 0.0, m.oak_dark))
    parts.append(S.rect('beam', -hx - 0.03, hx + 0.03, z1 - 0.03, z1 + 0.035, 0, 0.03, m.beam))
    for k, a in enumerate((-0.2, 0.2)):
        parts.append(S.plate(f'gst{k}', [(a - 0.018, z1 + 0.03), (a + 0.018, z1 + 0.03), (a + 0.018, z1 + 0.28), (a - 0.018, z1 + 0.28)], 0, 0.016, m.frame))
    window(parts, S, m, 'gw', 0.0, 0.6, 0.16, 0.14, surround=m.beam)
    door(parts, S, m, 'door', -0.1, 0.1, 0.03, 0.38, 0.01, handles=True)
    parts.append(S.rect('lint', -0.15, 0.15, 0.39, 0.44, 0, 0.03, m.beam))
    for s in (-1, 1):
        parts.append(S.rect(f'dj{s}', s * 0.1 - (0.025 if s > 0 else 0), s * 0.1 + (0.025 if s < 0 else 0), 0.03, 0.42, 0, 0.022, m.frame))
    for k, a in enumerate((-0.28, 0.28)):
        window(parts, S, m, f'sw{k}', a, 0.2, 0.12, 0.14, surround=m.beam)
    window(parts, W, m, 'ww', 0.08, 0.22, 0.13, 0.14, surround=m.beam)
    parts.append(box('step', (0, -hy - 0.04, 0.02), (0.3, 0.1, 0.04), m.pale_block, skip=('-z',)))
    roof(parts, m, 'r', 'y', -hy - 0.1, hy + 0.08, hx + 0.13, 0, z1 - 0.1, zr + 0.02, 4, 5, rng, th=0.07)
    verge(parts, m, 'vs', 'y', -hy - 0.1, hx + 0.13, 0, z1 - 0.1, zr + 0.02, finial=False)
    verge(parts, m, 'vn', 'y', hy + 0.08, hx + 0.13, 0, z1 - 0.1, zr + 0.02, finial=False)
    chimney(parts, m, 'ch', 0.17, 0.2, 0.74, 1.24, 0.18)
    foot_stones(parts, m, 'fs', [(-0.42, -0.43, 0.05), (-0.25, -0.44, 0.04), (0.3, -0.44, 0.045), (0.44, -0.42, 0.05), (-0.44, -0.2, 0.04), (-0.44, 0.1, 0.05), (-0.43, 0.38, 0.04)], rng)
    shrubs(parts, 'sh', [(-0.37, -0.48), (0.38, -0.48)], rng, m, 0.035)
    done(join(parts, 'house_slate_a'), 'house_slate_a', size=512)


def house_slate_b():
    """Broad and low with the eaves to the south, whitewashed fieldstone, plank lean-to at the east."""
    reset()
    m = M()
    rng = random.Random(64)
    x0, x1 = -0.5, 0.22
    cx = (x0 + x1) / 2
    hy = 0.36
    z1, zr = 0.44, 0.9
    parts = [box('walls', (cx, 0, z1 / 2), (x1 - x0, 2 * hy, z1), m.plaster, skip=('-z',))]
    S, W, E = south(-hy), west(x0), east(x1)
    parts.append(gable(W, 'gw', -hy, hy, z1, zr, -0.02, 0.0, m.plaster))
    parts.append(gable(E, 'ge', -hy, hy, z1, zr, -0.02, 0.0, m.plaster))
    door(parts, S, m, 'door', cx - 0.085, cx + 0.085, 0.03, 0.37, 0.01, handles=True)
    parts.append(S.rect('lint', cx - 0.13, cx + 0.13, 0.385, 0.435, 0, 0.026, m.pale_block))
    for k, a in enumerate((cx - 0.21, cx + 0.21)):
        window(parts, S, m, f'w{k}', a, 0.2, 0.11, 0.13, surround=m.pale_block)
    window(parts, W, m, 'ww', 0.0, 0.2, 0.12, 0.13, surround=m.pale_block)
    parts.append(box('step', (cx, -hy - 0.04, 0.02), (0.26, 0.1, 0.04), m.pale_block, skip=('-z',)))
    roof(parts, m, 'r', 'x', x0 - 0.1, x1 + 0.04, hy + 0.13, 0, z1 - 0.1, zr, 4, 6, rng, th=0.07)
    verge(parts, m, 'vw', 'x', x0 - 0.1, hy + 0.13, 0, z1 - 0.1, zr, finial=False)
    chimney(parts, m, 'ch', x0 + 0.1, 0.05, 0.66, 1.1, 0.17)
    # lean-to at the east: plank walls and a shingled plank roof falling east
    lx0, lx1 = x1, 0.5
    ly0, ly1 = -0.34, 0.3
    zh, zl = 0.58, 0.36
    wall = pm('leanw', 'coast_planks.png', (0, 0, 1), (1, 1, 0), 2.2, tint=(0.62, 0.72, 0.9))
    parts.append(loft('lean', [[(lx0, ly0, 0), (lx1, ly0, 0), (lx1, ly1, 0), (lx0, ly1, 0)], [(lx0, ly0, zh), (lx1, ly0, zl), (lx1, ly1, zl), (lx0, ly1, zh)]], wall))
    L = south(ly0)
    parts.append(L.rect('ldoor', lx0 + 0.05, lx1 - 0.05, 0.02, 0.34, 0, 0.012, m.oak_v))
    parts.append(L.rect('ls0', lx0 + 0.05, lx1 - 0.05, 0.08, 0.105, 0.012, 0.018, m.beam))
    parts.append(L.rect('ls1', lx0 + 0.05, lx1 - 0.05, 0.27, 0.295, 0.012, 0.018, m.beam))
    parts.append(beam('lbr', L.p(lx0 + 0.06, 0.09, 0.016), L.p(lx1 - 0.06, 0.28, 0.016), 0.022, m.beam))
    parts.append(L.rect('lc0', lx0 + 0.0, lx0 + 0.04, 0.0, zh - 0.02, 0, 0.02, m.frame))
    parts.append(L.rect('lc1', lx1 - 0.04, lx1, 0.0, zl, 0, 0.02, m.frame))
    plank_top = pm('leanr', 'coast_planks.png', (0.0, 1, 0), (1, 0, 0), 1.8, tint=(0.7, 0.85, 1.05), aod=0.05)
    n = 6
    for k in range(n):
        t0, t1 = k / n, (k + 1.1) / n
        xa, xb = lx0 - 0.02 + (lx1 - lx0 + 0.09) * t0, lx0 - 0.02 + (lx1 - lx0 + 0.09) * t1
        za, zb = zh + 0.05 + (zl - zh) * t0, zh + 0.05 + (zl - zh) * t1
        parts.append(hexa(f'ls{k}', [(xa, ly0 - 0.05, za - 0.01), (xb, ly0 - 0.05, zb - 0.01), (xb, ly1 + 0.05, zb - 0.01), (xa, ly1 + 0.05, za - 0.01),
                                     (xa, ly0 - 0.05, za + 0.012), (xb, ly0 - 0.05, zb + 0.025), (xb, ly1 + 0.05, zb + 0.025), (xa, ly1 + 0.05, za + 0.012)], plank_top))
    foot_stones(parts, m, 'fs', [(x0 - 0.01, -0.42, 0.05), (x0 + 0.13, -0.42, 0.035), (x1 - 0.03, -0.42, 0.04), (x0 - 0.02, -0.14, 0.045), (x0 - 0.02, 0.2, 0.04)], rng)
    shrubs(parts, 'sh', [(x0 + 0.03, -0.46), (x1 - 0.1, -0.46)], rng, m, 0.033)
    done(join(parts, 'house_slate_b'), 'house_slate_b', size=512)


def watch_fire_a():
    """Blocks its tile: stone ring, short iron post, wide iron basket with logs and big painted flames."""
    reset()
    m = M()
    rng = random.Random(65)
    parts = []
    n = 9
    for i in range(n):
        a = 2 * math.pi * i / n + 0.15
        x, y = math.cos(a) * 0.37, math.sin(a) * 0.36
        parts.append(boulder(f'st{i}', (x, y), rng.uniform(0.11, 0.13), rng.uniform(0.1, 0.12), 0.0, rng.uniform(0.13, 0.2), rng, m.stone, n=5, top=(0.55, 0.7)))
    parts.append(cyl('floor', (0, 0), 0.34, 0.0, 0.03, m.stone, segs=10))
    parts.append(cyl('foot', (0, 0), 0.17, 0.03, 0.07, m.iron, segs=8))
    parts.append(cyl('foot2', (0, 0), 0.11, 0.07, 0.12, m.iron, segs=8))
    parts.append(cyl('post', (0, 0), 0.07, 0.12, 0.46, m.frame, segs=8))
    parts.append(cyl('c0', (0, 0), 0.09, 0.16, 0.2, m.iron, segs=8))
    parts.append(cyl('c1', (0, 0), 0.09, 0.4, 0.44, m.iron, segs=8))
    parts.append(loft('cup', [circle((0, 0), 0.08, 0.46, 10), circle((0, 0), 0.22, 0.56, 10), circle((0, 0), 0.24, 0.585, 10)], m.iron))
    k = 10
    for i in range(k):
        a = 2 * math.pi * i / k
        c, s = math.cos(a), math.sin(a)
        pts = [(c * 0.22, s * 0.22, 0.56), (c * 0.335, s * 0.335, 0.68), (c * 0.355, s * 0.355, 0.9)]
        parts.append(tube(f'rib{i}', pts, 0.022, m.iron, sides=3))
    parts.append(tube('h0', hoop((0, 0, 0.72), 0.34, n=12), 0.024, m.iron, sides=3))
    parts.append(tube('h1', hoop((0, 0, 0.9), 0.36, n=14), 0.034, m.iron, sides=4))
    for i, (a, z) in enumerate(((0.3, 0.64), (1.4, 0.66), (2.5, 0.64), (0.9, 0.76), (2.0, 0.78))):
        c, s = math.cos(a) * 0.25, math.sin(a) * 0.25
        parts.append(beam(f'log{i}', (-c, -s, z), (c, s, z + 0.05), 0.1, m.oak if i % 2 else m.beam))
    tongues = [((0.0, 0.03), 0.25, 1.62, 0.04, m.flame_o), ((-0.18, -0.02), 0.13, 1.28, -0.05, m.flame_o), ((0.19, -0.02), 0.14, 1.36, 0.05, m.flame_o), ((0.03, 0.16), 0.14, 1.3, 0.0, m.flame_o),
               ((-0.02, -0.1), 0.15, 1.28, 0.02, m.flame_i), ((0.11, -0.12), 0.08, 1.06, -0.02, m.flame_i), ((-0.13, -0.12), 0.07, 1.02, 0.02, m.flame_i)]
    for i, ((x, y), r, zt, lean, mat) in enumerate(tongues):
        z0 = 0.72
        rings = []
        for t, f in ((0.0, 0.8), (0.22, 1.0), (0.5, 0.72), (0.76, 0.36)):
            z = z0 + (zt - z0) * t
            rings.append(circle((x + lean * math.sin(t * 5.0), y), r * f, z, 6, off=i * 0.4))
        rings.append([(x + lean * 1.2, y, zt)])
        parts.append(loft(f'fl{i}', rings, mat, cap=False))
    done(join(parts, 'watch_fire_a'), 'watch_fire_a', size=512)


def cliff(pid, seed, east_face):
    """Sperrend: rock fills the tile, meadow and stones on top in the colour of the board's grass; deep rock columns break off to the south (and the east on the corner)."""
    reset()
    m = M()
    rng = random.Random(seed)
    m.rock = pm('rockl', 'coast_rock.png', SHEAR_U, SHEAR_V, 1.7, tint=(1.14, 1.08, 1.06), lichen=0.34, lscale=12, aod=0.14, ao=0.8)
    meadow = pm('meadow', col=rgb(116, 148, 40), noise=0.2, nscale=16, patch=(rgb(146, 160, 48), 8.0, 0.6), ao=0.3, aod=0.08, shade=(0.86, 1.08))
    blade = pm('mtuft', ramp=[(0.0, rgb(132, 164, 52)), (1.0, rgb(204, 200, 78))], rampz=(0.0, 1.0), ao=0, shade=(0.92, 1.06))
    top = 0.86
    xb = 0.28 if east_face else 0.49
    parts = [box('body', ((xb - 0.49) / 2, 0.095, top / 2), (xb + 0.49, 0.79, top), m.rock, skip=('-z',))]
    x1 = 0.34 if east_face else 0.5
    y0 = -0.34
    parts.append(hexa('gr', [(-0.5, y0, top - 0.005), (x1, y0, top - 0.005), (x1, 0.5, top - 0.005), (-0.5, 0.5, top - 0.005),
                             (-0.5, y0 - 0.01, top + 0.03), (x1 + 0.0, y0 - 0.01, top + 0.03), (x1 + 0.0, 0.5, top + 0.03), (-0.5, 0.5, top + 0.03)], meadow))
    n = 4
    x_end = 0.3 if east_face else 0.5
    step = (x_end + 0.5) / n
    for i in range(n):
        x = -0.5 + (i + 0.5) * step
        parts.append(column(f'sc{i}', x, -0.29 + (0.0 if i % 2 else -0.05), step * 0.98, 0.3, 0.0, top - rng.uniform(0.0, 0.06), rng, m.rock))
    if east_face:
        for i in range(n):
            y = -0.3 + (i + 0.5) * 0.8 / n
            parts.append(column(f'ec{i}', 0.33 + (0.0 if i % 2 else 0.04), y, 0.3, 0.8 / n * 0.98, 0.0, top - rng.uniform(0.0, 0.05), rng, m.rock))
        parts.append(column('corner', 0.36, -0.36, 0.3, 0.28, 0.0, top - 0.03, rng, m.rock))
    low = [(-0.2, -0.45, 0.27, 0.1, 0.42), (0.14, -0.46, 0.24, 0.09, 0.22), (-0.42, -0.46, 0.15, 0.08, 0.16)]
    if east_face:
        low += [(0.44, 0.14, 0.11, 0.24, 0.34), (0.45, -0.22, 0.1, 0.18, 0.2)]
    for i, (x, y, w, d, h) in enumerate(low):
        parts.append(column(f'lo{i}', x, y, w, d, 0.0, h, rng, m.rock))
    parts.append(boulder('t0', (-0.24, 0.26), 0.17, 0.14, top + 0.01, top + 0.17, rng, m.rock_pale, top=(0.5, 0.65)))
    parts.append(boulder('t1', (-0.08, -0.04), 0.07, 0.06, top + 0.01, top + 0.09, rng, m.rock_pale))
    parts.append(boulder('t2', (0.08 if east_face else 0.2, -0.16), 0.08, 0.07, top + 0.01, top + 0.09, rng, m.rock_pale))
    for k in range(10):
        tuft(parts, f'gt{k}', (rng.uniform(-0.44, x1 - 0.05), rng.uniform(-0.28, 0.44), top + 0.025), 0.085, rng, blade, spikes=2)
    for k in range(11):
        tuft(parts, f'ft{k}', (-0.46 + (x1 + 0.42) * k / 10, y0 + 0.012, top + 0.02), 0.09, rng, blade, spikes=2)
    if east_face:
        for k in range(6):
            tuft(parts, f'fe{k}', (x1 - 0.012, -0.3 + 0.75 * k / 5, top + 0.02), 0.09, rng, blade, spikes=2)
    for k, (x, y, r) in enumerate(((-0.42, 0.04, 0.05), (0.28 if not east_face else 0.2, 0.34, 0.045))):
        parts.append(sphere(f'am{k}', (x, y, top + 0.055), r, m.amber, rng, squash=(1.1, 1.1, 0.8), jitter=0.2))
    flowers(parts, 'fa', (0.16 if not east_face else 0.05, 0.14, top + 0.045), rng, m.flower, 5, r=0.024, spread=0.05)
    done(join(parts, pid), pid, size=512)


def rockfall_a():
    """Sperrend: a wide, low heap of broken angular boulders filling the tile, rubble and dust at its foot."""
    reset()
    m = M()
    rng = random.Random(66)
    m.rock = pm('rockl', 'coast_rock.png', SHEAR_U, SHEAR_V, 1.7, tint=(1.14, 1.08, 1.06), lichen=0.34, lscale=12, aod=0.14, ao=0.8)
    parts = [
        boulder('main', (0.04, 0.14), 0.27, 0.2, 0.0, 0.62, rng, m.rock, n=6, tilt=0.42, top=(0.42, 0.55)),
        boulder('back', (-0.26, 0.28), 0.2, 0.15, 0.0, 0.42, rng, m.rock, n=6, tilt=0.3, top=(0.55, 0.7)),
        boulder('back2', (0.33, 0.26), 0.16, 0.14, 0.0, 0.36, rng, m.rock, n=6, tilt=0.3, top=(0.55, 0.7)),
        boulder('a', (-0.14, -0.14), 0.25, 0.17, 0.0, 0.36, rng, m.rock, n=6, tilt=0.3, top=(0.7, 0.82)),
        boulder('b', (-0.4, 0.02), 0.13, 0.15, 0.0, 0.3, rng, m.rock, n=6, top=(0.62, 0.74)),
        boulder('c', (0.34, -0.03), 0.17, 0.16, 0.0, 0.4, rng, m.rock, n=6, tilt=0.3, top=(0.62, 0.74)),
        boulder('d', (0.16, -0.31), 0.15, 0.11, 0.0, 0.22, rng, m.rock, n=6, top=(0.7, 0.82)),
        boulder('e', (0.43, -0.25), 0.075, 0.07, 0.0, 0.13, rng, m.rock),
        boulder('f', (-0.41, -0.22), 0.08, 0.07, 0.0, 0.14, rng, m.rock),
        boulder('g', (-0.22, -0.38), 0.07, 0.06, 0.0, 0.11, rng, m.rock),
    ]
    for k in range(24):
        a = rng.uniform(math.pi * 0.85, math.pi * 2.15)
        r = rng.uniform(0.3, 0.52)
        s = rng.uniform(0.022, 0.055)
        parts.append(octa(f'p{k}', (math.cos(a) * r, math.sin(a) * r * 0.92, s * 0.32), s * 1.15, m.stone, rng, squash=0.5))
    ring = [(math.cos(2 * math.pi * i / 12) * 0.5 * (1 + 0.06 * math.sin(i * 2.7)), math.sin(2 * math.pi * i / 12) * 0.48 * (1 + 0.06 * math.cos(i * 1.9)), 0.0) for i in range(12)]
    dust = pm('dust', col=rgb(176, 138, 88), noise=0.18, nscale=30, ao=0.3)
    parts.append(loft('dust', [ring, [(x * 0.94, y * 0.94, 0.012) for x, y, _ in ring]], dust))
    done(join(parts, 'rockfall_a'), 'rockfall_a', size=512)


def sandbar_a():
    """Flat and walkable: warm sand in wind ripples with a wet rim, tide pools, branching weed, pebbles and one shell."""
    reset()
    m = M()
    rng = random.Random(67)
    sand = pm('sand2', col=rgb(216, 178, 120), noise=0.1, nscale=9, patch=(rgb(198, 158, 102), 5.0, 0.6), ao=0.1, aod=0.05, shade=(0.92, 1.06))
    wet = pm('wet2', col=rgb(160, 126, 84), noise=0.14, nscale=16, ao=0, shade=(0.92, 1.04))
    crest = pm('crest', col=rgb(244, 218, 164), ao=0, shade=(0.95, 1.05))
    trough = pm('trough', col=rgb(186, 148, 94), ao=0, shade=(0.95, 1.05))
    weed = pm('weed2', col=rgb(82, 62, 28), noise=0.2, nscale=30, ao=0, shade=(0.86, 1.12))
    weedl = pm('weed3', col=rgb(124, 92, 38), noise=0.2, nscale=30, ao=0, shade=(0.86, 1.12))
    n = 22
    radius = []
    for i in range(n):
        a = 2 * math.pi * i / n
        radius.append(0.46 + 0.05 * math.sin(a * 3 + 0.6) + 0.03 * math.sin(a * 5 + 1.7))
    outline = [(math.cos(2 * math.pi * i / n) * radius[i], math.sin(2 * math.pi * i / n) * radius[i]) for i in range(n)]
    parts = [loft('rim', [[(x, y, 0.0) for x, y in outline], [(x, y, 0.012) for x, y in outline]], wet)]
    parts.append(loft('top', [[(x * 0.97, y * 0.97, 0.012) for x, y in outline], [(x * 0.91, y * 0.91, 0.03) for x, y in outline]], sand))
    # tide pools in the hollows
    for k, (cx, cy, rx, ry) in enumerate(((-0.28, 0.04, 0.13, 0.05), (0.12, -0.34, 0.14, 0.045), (-0.08, 0.34, 0.1, 0.035))):
        ring = [(cx + math.cos(2 * math.pi * i / 9) * rx * (1 + 0.15 * math.sin(i * 2.1)), cy + math.sin(2 * math.pi * i / 9) * ry, 0.031) for i in range(9)]
        parts.append(loft(f'prd{k}', [[(cx + (x - cx) * 1.2, cy + (y - cy) * 1.3, 0.031) for x, y, _ in ring], [(cx + (x - cx) * 1.2, cy + (y - cy) * 1.3, 0.0325) for x, y, _ in ring]], trough))
        parts.append(loft(f'pud{k}', [ring, [(x, y, 0.035) for x, y, _ in ring]], m.puddle))
    # wind ripples right across the bar: a pale crest with a dark trough on its south side
    for k in range(7):
        y = -0.27 + k * 0.09
        half = math.sqrt(max(0.02, 0.17 - y * y)) * rng.uniform(0.78, 0.98)
        cx = rng.uniform(-0.03, 0.07)
        pts = [(cx - half + half * 2 * i / 3, y + 0.014 * math.sin(i * 2.3 + k) + (cx - half + half * 2 * i / 3) * 0.09) for i in range(4)]
        parts.append(tube(f'rt{k}', [(x, py - 0.012, 0.03) for x, py in pts], 0.009, trough, sides=3))
        parts.append(tube(f'ri{k}', [(x, py, 0.031) for x, py in pts], 0.012, crest, sides=3))
    # weed: short limp strands from one holdfast with fat fronds along them
    for k, (cx, cy, sz) in enumerate(((-0.08, 0.2, 0.9), (0.26, 0.04, 1.0), (-0.17, -0.2, 1.05))):
        for s in range(4):
            a = rng.uniform(0, 6.28) if s == 0 else a + rng.uniform(1.1, 2.0)
            mat = weed if s % 2 else weedl
            pts, x, y, h = [], cx, cy, a
            for i in range(3):
                pts.append((x, y, 0.036))
                h += rng.uniform(-0.5, 0.5)
                st = 0.04 * sz
                x, y = x + math.cos(h) * st, y + math.sin(h) * st
                q = h + (1 if i % 2 else -1) * rng.uniform(0.7, 1.1)
                parts.append(octa(f'wl{k}{s}{i}', (x + math.cos(q) * 0.022 * sz, y + math.sin(q) * 0.022 * sz, 0.037), 0.026 * sz, weedl if i % 2 else weed, rng, squash=0.4))
            pts.append((x, y, 0.034))
            parts.append(tube(f'wd{k}{s}', pts, 0.018, mat, sides=3, radii=[1.3, 1.1, 0.8, 0.4]))
    # pebbles
    for k in range(7):
        a = rng.uniform(0, 6.28)
        r = rng.uniform(0.22, 0.42)
        parts.append(octa(f'pb{k}', (math.cos(a) * r, math.sin(a) * r, 0.035), rng.uniform(0.014, 0.026), m.stone, rng, squash=0.7))
    # shell
    sh = [(0.28, -0.22, 0.04)]
    fan = [(0.28 + math.cos(0.6 + i * 0.32) * 0.05, -0.22 + math.sin(0.6 + i * 0.32) * 0.05, 0.05 + 0.012 * (i % 2)) for i in range(7)]
    parts.append(loft('shell', [fan, [sh[0]]], m.flower, cap=False))
    parts.append(box('shb', (0.28, -0.22, 0.04), (0.016, 0.016, 0.012), m.flower))
    done(join(parts, 'sandbar_a'), 'sandbar_a', size=512)


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    jobs = {
        'quay_straight': quay_straight,
        'quay_corner': quay_corner,
        'warehouse_a': warehouse_a,
        'warehouse_b': warehouse_b,
        'crane_idle': crane_idle,
        'ship_a': ship_a,
        'boat_a': boat_a,
        'boat_b': boat_b,
        'mooring_a': mooring_a,
        'crates_a': crates_a,
        'barrels_a': barrels_a,
        'stage_a': stage_a,
        'tent_market_a': tent_market_a,
        'rope_bridge_straight': rope_bridge_straight,
        'rope_bridge_end': rope_bridge_end,
        'waterfall_a': waterfall_a,
        'monastery_a': monastery_a,
        'house_slate_a': house_slate_a,
        'house_slate_b': house_slate_b,
        'watch_fire_a': watch_fire_a,
        'cliff_edge_a': lambda: cliff('cliff_edge_a', 71, False),
        'cliff_corner_a': lambda: cliff('cliff_corner_a', 72, True),
        'rockfall_a': rockfall_a,
        'sandbar_a': sandbar_a,
    }
    for name, fn in jobs.items():
        if not only or name in only:
            fn()
