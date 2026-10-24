"""Landmarks: watchtower fort, chapel ruins, roadside shrine, stone bridge (reference art/props/refs/landmarks.png,
rows 1-4).

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/landmarks.py

- fort_idle: small round stone watchtower on a square stone plinth, wooden balcony ring with stone crenels, pointed
  dark slate roof, lit window above the door on the south front, banner on a pole on top. The banner is team cloth
  (white in the texture, faces marked with team key 2) so the game tints it in the team colour.
- ruins_idle: broken stone walls of a small chapel: tall gable remnant with a gothic arched window on the south side,
  low broken walls around a dirt floor, ivy and moss, fallen blocks.
- shrine_idle: roadside shrine on a stepped plinth, small gabled stone-slab roof (ridge north-south) over a niche with
  a statue and a glowing candle, flowers in front; the niche opens to the south.
- bridge_idle: short arched stone bridge along the x axis, about 2.0 x 0.8 tiles (bigger than one tile on purpose),
  low parapets with end posts; deck top about 0.35 above z = 0 (slight hump), abutments reach down to z = -0.4 so
  they sink into the river banks, the arch (crown about z = 0.22) spans x = -0.56 .. 0.56 for a small river.

Writes art/models/props/<id>.glb and art/props/previews/<id>.png. Fixed seeds, so the output is deterministic.
Paint and primitive helpers come from houses.py (same look as the village houses).
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
from houses import beam, box, circle, hexa, lin, loft, octa, paint, prism, flat_mat, with_mat  # noqa: E402


# ---------------------------------------------------------------- materials

class Mats:
    def __init__(self):
        self.stone = paint('stone', [(0.0, lin(104, 96, 86)), (0.45, lin(152, 142, 126)), (1.0, lin(204, 194, 174))],
                           wn=0.45, noise=0.22, nscale=14, seed=21.0, bias=0.22, pattern=('stones', 12.0, 0.07, 0.4))
        self.block = paint('block', [(0.0, lin(112, 104, 94)), (0.5, lin(166, 156, 140)), (1.0, lin(214, 206, 188))],
                           wn=0.7, noise=0.15, nscale=20, seed=22.0, bias=-0.05)
        self.paving = paint('paving', [(0.0, lin(116, 108, 96)), (0.5, lin(160, 150, 134)), (1.0, lin(200, 192, 174))],
                            wn=0.3, noise=0.2, nscale=12, seed=23.0, bias=0.3, pattern=('stones', 8.0, 0.06, 0.55))
        self.niche = paint('niche', [(0.0, lin(40, 36, 32)), (1.0, lin(78, 72, 64))], wn=0.3, noise=0.15, nscale=14,
                           seed=24.0, bias=0.3, pattern=('stones', 14.0, 0.06, 0.6))
        self.statue = paint('statue', [(0.0, lin(150, 144, 132)), (0.5, lin(206, 200, 186)), (1.0, lin(236, 232, 220))],
                            wn=0.8, noise=0.05, nscale=20, seed=25.0, bias=-0.05)
        self.wood = paint('wood', [(0.0, lin(70, 38, 20)), (0.5, lin(116, 68, 36)), (1.0, lin(156, 98, 54))], wn=0.5,
                          noise=0.14, nscale=12, stretch=(1, 1, 6), seed=26.0, bias=0.2, pattern=('planks', 22.0, 0.55))
        self.door = paint('door', [(0.0, lin(84, 50, 28)), (0.6, lin(122, 76, 42)), (1.0, lin(150, 96, 54))], wn=0.5,
                          noise=0.12, nscale=14, stretch=(1, 1, 8), seed=27.0, bias=0.2, pattern=('planks', 30.0, 0.55))
        self.slate = paint('slate', [(0.0, lin(36, 38, 46)), (0.5, lin(62, 66, 78)), (1.0, lin(104, 110, 124))],
                           z=(0.86, 1.22), wz=0.15, wn=0.7, noise=0.12, nscale=16, seed=28.0, bias=0.0,
                           pattern=('stones', 18.0, 0.07, 0.45))
        self.glow = paint('glow', [(0.0, lin(240, 140, 40)), (0.6, lin(255, 196, 80)), (1.0, lin(255, 226, 140))],
                          wn=0.6, noise=0.1, nscale=20, seed=29.0, bias=0.2)
        self.flame = flat_mat('flame', lin(255, 220, 120))
        self.wax = paint('wax', [(0.0, lin(214, 196, 160)), (1.0, lin(250, 240, 214))], wn=0.6, noise=0.0, bias=0.2)
        self.hole = flat_mat('hole', lin(30, 26, 24))
        self.metal = flat_mat('metal', lin(40, 38, 36))
        self.cloth = flat_mat('cloth', lin(255, 255, 255))
        self.dirt = paint('dirt', [(0.0, lin(76, 54, 34)), (0.5, lin(110, 80, 50)), (1.0, lin(140, 106, 70))], wn=0.2,
                          noise=0.3, nscale=10, seed=30.0, bias=0.25)
        self.leaf = paint('leaf', [(0.0, lin(26, 62, 12)), (0.4, lin(66, 118, 22)), (0.7, lin(124, 172, 34)),
                                   (1.0, lin(190, 214, 62))], wn=0.6, noise=0.12, nscale=12, seed=31.0, bias=0.05)
        self.ivy = paint('ivy', [(0.0, lin(22, 56, 14)), (0.45, lin(52, 104, 26)), (1.0, lin(110, 160, 40))], wn=0.6,
                         noise=0.2, nscale=16, seed=32.0, bias=0.05)
        self.flowers = [flat_mat('fl_r', lin(222, 64, 48)), flat_mat('fl_w', lin(246, 244, 232)),
                        flat_mat('fl_y', lin(246, 196, 50))]


# ---------------------------------------------------------------- helpers

def blob(name, c, r, rng, mat, squash=(1.0, 1.0, 0.8), jitter=0.18, floor=None):
    """Low-poly leafy clump (icosahedron, 20 triangles)."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)
    for v in bm.verts:
        d = 1.0 + rng.uniform(-jitter, jitter)
        v.co = Vector((v.co.x * d * squash[0], v.co.y * d * squash[1], v.co.z * d * squash[2])) + Vector(c)
        if floor is not None:
            v.co.z = max(v.co.z, floor)
    return with_mat(mesh_object(name, bm), mat)


def rock(name, c, s, rng, mat, tilt=0.35):
    """Fallen block: a box with random tilt and spin."""
    return box(name, c, s, mat, rot=(rng.uniform(-tilt, tilt), rng.uniform(-tilt, tilt), rng.uniform(0, math.pi)))


def facet_box(name, ang, rf, z, w, h, depth, out, mat):
    """Box on the flat tower facet whose outward normal points at angle `ang` (deg) at distance rf."""
    a = math.radians(ang)
    d = rf + out - depth / 2
    return box(name, (math.cos(a) * d, math.sin(a) * d, z), (depth, w, h), mat, rot=(0, 0, a))


def pointed_arch(cx, z0, w, h, n=4):
    """Gothic window outline in (u, z): straight jambs from z0, two arcs meeting at the apex z0 + h."""
    hw = w / 2
    zs = z0 + h - w * 0.95  # springing line
    pts = [(cx - hw, z0), (cx + hw, z0), (cx + hw, zs)]
    r = w  # equilateral arch: each arc centred on the opposite jamb
    apex_a = math.acos(hw / r)
    for k in range(1, n):
        a = apex_a * k / n
        pts.append((cx - hw + r * math.cos(a), zs + r * math.sin(a) * (h - (zs - z0)) / (r * math.sin(apex_a))))
    pts.append((cx, z0 + h))
    for k in range(n - 1, 0, -1):
        a = apex_a * k / n
        pts.append((cx + hw - r * math.cos(a), zs + r * math.sin(a) * (h - (zs - z0)) / (r * math.sin(apex_a))))
    pts.append((cx - hw, zs))
    return pts


def team_faces_of(obj, prefix='cloth', key=2):
    names = [s.material.name if s.material else '' for s in obj.material_slots]
    return {p.index: key for p in obj.data.polygons if names[p.material_index].startswith(prefix)}


# ---------------------------------------------------------------- fort

SEG = 10
OFF = math.radians(-72)  # a flat facet faces south (-y)


def fort_idle():
    reset()
    M = Mats()
    rng = random.Random(51)
    parts = []
    r, rf = 0.24, 0.24 * math.cos(math.pi / SEG)
    # square plinth of chunky blocks
    parts.append(box('plinth', (0, 0, 0.04), (0.66, 0.66, 0.08), M.stone, skip=('-z',)))
    for i in range(12):
        side = i // 3
        t = (i % 3 - 1) * 0.22
        x, y = [(t, -0.33), (0.33, t), (t, 0.33), (-0.33, t)][side]
        parts.append(box(f'pb{i}', (x, y, 0.045), (0.15 if side % 2 == 0 else 0.1, 0.1 if side % 2 == 0 else 0.15,
                                                   0.09 + rng.uniform(-0.01, 0.015)), M.block,
                         rot=(0, 0, rng.uniform(-0.08, 0.08)), skip=('-z',)))
    # round tower: foot course, shaft
    parts.append(loft('foot', [circle((0, 0), r + 0.035, 0.07, SEG, OFF), circle((0, 0), r + 0.035, 0.17, SEG, OFF),
                               circle((0, 0), r, 0.19, SEG, OFF)], M.stone))
    parts.append(loft('shaft', [circle((0, 0), r, 0.18, SEG, OFF), circle((0, 0), r, 0.78, SEG, OFF)], M.stone))
    # corbels under the balcony
    for k in range(SEG):
        a = math.degrees(OFF) + 360 * (k + 0.5) / SEG
        parts.append(facet_box(f'corb{k}', a, rf, 0.705, 0.04, 0.07, 0.07, 0.06, M.wood))
    # wooden balcony ring with stone merlons
    parts.append(loft('balc', [circle((0, 0), r + 0.05, 0.74, SEG, OFF), circle((0, 0), r + 0.075, 0.76, SEG, OFF),
                               circle((0, 0), r + 0.075, 0.86, SEG, OFF)], M.wood))
    rm = (r + 0.06) * math.cos(math.pi / SEG)
    for k in range(SEG):
        a = math.degrees(OFF) + 360 * (k + 0.5) / SEG
        parts.append(facet_box(f'merl{k}', a, rm, 0.9, 0.075, 0.08, 0.06, 0.03, M.block))
    # slate roof in two tiers
    parts.append(loft('roof1', [circle((0, 0), r + 0.055, 0.84, SEG, OFF), circle((0, 0), r + 0.065, 0.88, SEG, OFF),
                                circle((0, 0), 0.17, 1.03, SEG, OFF)], M.slate))
    parts.append(loft('roof2', [circle((0, 0), 0.19, 1.0, SEG, OFF), circle((0, 0), 0.19, 1.02, SEG, OFF),
                                [(0, 0, 1.24)]], M.slate, cap=False))
    # pole, finial, team banner (pennant waving east)
    parts.append(beam('pole', (0, 0, 1.18), (0, 0, 1.37), 0.022, M.wood))
    parts.append(octa('finial', (0, 0, 1.38), 0.018, M.wood, rng))
    xs = [0.012, 0.09, 0.17, 0.25]
    rings = []
    for i, x in enumerate(xs):
        y = 0.018 * math.sin(i * 1.9)
        hh = 0.065 - 0.012 * i
        zc = 1.295 - 0.006 * i
        rings.append([(x, y - 0.006, zc - hh), (x, y + 0.006, zc - hh), (x, y + 0.006, zc + hh),
                      (x, y - 0.006, zc + hh)])
    parts.append(loft('banner', rings, M.cloth))
    # south front: door with frame and steps, lit window, dark slits east and west
    parts.append(facet_box('dframe', -90, rf, 0.3, 0.13, 0.24, 0.03, 0.012, M.block))
    parts.append(facet_box('door', -90, rf, 0.29, 0.1, 0.21, 0.03, 0.02, M.door))
    parts.append(facet_box('lintel', -90, rf, 0.43, 0.16, 0.035, 0.03, 0.02, M.block))
    parts.append(box('knob', (0.03, -rf - 0.026, 0.28), (0.012, 0.012, 0.012), M.metal))
    parts.append(box('step1', (0, -rf - 0.07, 0.11), (0.18, 0.08, 0.04), M.block, skip=('-z',)))
    parts.append(box('step2', (0, -rf - 0.12, 0.09), (0.2, 0.06, 0.03), M.block, skip=('-z',)))
    parts.append(facet_box('wframe', -90, rf, 0.57, 0.09, 0.1, 0.03, 0.012, M.wood))
    parts.append(facet_box('wglass', -90, rf, 0.57, 0.07, 0.08, 0.03, 0.017, M.glow))
    parts.append(facet_box('wbarh', -90, rf, 0.57, 0.07, 0.012, 0.03, 0.022, M.wood))
    parts.append(facet_box('wbarv', -90, rf, 0.57, 0.012, 0.08, 0.03, 0.022, M.wood))
    for a in (-18, 198, 90):
        parts.append(facet_box(f'slit{a}', a, rf, 0.52, 0.03, 0.09, 0.03, 0.012, M.hole))
    # bushes at the plinth corners
    for i, (c, rr) in enumerate((((-0.3, -0.29), 0.1), ((0.3, -0.29), 0.1), ((-0.31, 0.3), 0.085),
                                 ((0.31, 0.3), 0.08), ((-0.2, -0.24), 0.075), ((0.2, -0.24), 0.07),
                                 ((-0.25, 0.05), 0.07), ((0.26, -0.02), 0.065))):
        parts.append(blob(f'bush{i}', (c[0], c[1], 0.06 + rr * 0.6), rr, rng, M.leaf, floor=0.0))
        parts.append(blob(f'bushb{i}', (c[0] + 0.06, c[1] + 0.03, 0.05 + rr * 0.45), rr * 0.75, rng, M.leaf,
                          floor=0.0))
    obj = join(parts, 'fort_idle')
    tf = team_faces_of(obj)
    finish(obj, 'fort_idle', size=512, team_faces=tf)
    print(f'fort_idle: {len(tf)} team faces')


# ---------------------------------------------------------------- ruins

def ruins_idle():
    reset()
    M = Mats()
    rng = random.Random(61)
    parts = []
    X, Y, T = 0.32, 0.24, 0.07
    parts.append(box('floor', (0, 0, 0.012), (2 * X - 0.02, 2 * Y - 0.02, 0.024), M.dirt, skip=('-z',)))
    # south wall: tall gable remnant (west) with the gothic window, low broken stub (east)
    south_w = [(-X, 0.0), (0.03, 0.0), (0.03, 0.2), (0.0, 0.3), (0.02, 0.4), (-0.04, 0.5), (-0.1, 0.6),
               (-0.14, 0.68), (-0.22, 0.6), (-X, 0.5)]
    south_e = [(0.1, 0.0), (X, 0.0), (X, 0.32), (0.27, 0.27), (0.24, 0.3), (0.2, 0.17), (0.14, 0.14), (0.1, 0.07)]
    west = [(-Y, 0.0), (Y, 0.0), (Y, 0.13), (0.14, 0.19), (0.05, 0.16), (-0.04, 0.3), (-0.12, 0.33),
            (-0.17, 0.44), (-Y, 0.48)]
    north = [(-X, 0.0), (X, 0.0), (X, 0.22), (0.22, 0.27), (0.12, 0.17), (0.0, 0.2), (-0.14, 0.12),
             (-0.24, 0.16), (-X, 0.14)]
    east = [(-Y, 0.0), (Y, 0.0), (Y, 0.2), (0.12, 0.26), (0.04, 0.17), (-0.06, 0.22), (-0.14, 0.36),
            (-0.2, 0.33), (-Y, 0.34)]
    parts.append(prism('south_w', south_w, 'y', -Y, -Y + T, M.stone))
    parts.append(prism('south_e', south_e, 'y', -Y, -Y + T, M.stone))
    parts.append(prism('west', west, 'x', -X, -X + T, M.stone))
    parts.append(prism('north', north, 'y', Y - T, Y, M.stone))
    parts.append(prism('east', east, 'x', X - T, X, M.stone))
    # gothic window: light stone surround, dark opening, mullion
    frame = pointed_arch(-0.14, 0.2, 0.15, 0.32, n=3)
    hole = pointed_arch(-0.14, 0.23, 0.1, 0.26, n=3)
    parts.append(prism('wframe', frame, 'y', -Y - 0.012, -Y + T + 0.012, M.block))
    parts.append(prism('whole', hole, 'y', -Y - 0.018, -Y + T + 0.018, M.hole))
    parts.append(box('mullion', (-0.14, -Y + T / 2, 0.35), (0.014, T + 0.045, 0.22), M.block))
    parts.append(box('sill', (-0.14, -Y + T / 2, 0.205), (0.19, T + 0.05, 0.03), M.block))
    # loose blocks on wall tops and corner quoins
    for i, (c, s) in enumerate((((-X + 0.03, -Y + 0.03, 0.5), (0.08, 0.08, 0.06)),
                                ((X - 0.03, -Y + 0.03, 0.33), (0.08, 0.08, 0.05)),
                                ((X - 0.035, -0.14, 0.36), (0.075, 0.07, 0.05)),
                                ((0.22, Y - 0.035, 0.28), (0.08, 0.075, 0.05)),
                                ((-0.13, -Y + 0.03, 0.66), (0.07, 0.08, 0.05)))):
        parts.append(rock(f'top{i}', c, s, rng, M.block, tilt=0.15))
    # fallen blocks: heaps against the walls outside, a few inside, the gap in the south wall
    spots = [(-0.38, -0.3), (-0.3, -0.32), (-0.37, -0.12), (0.06, -0.31), (0.12, -0.33), (0.0, -0.35),
             (0.25, -0.32), (0.37, -0.28), (0.375, -0.05), (0.37, 0.15), (0.3, 0.31), (0.1, 0.32), (-0.15, 0.31),
             (-0.35, 0.3), (-0.38, 0.1), (0.07, -0.22), (-0.05, 0.02), (0.12, 0.08), (0.15, -0.1), (-0.15, 0.1)]
    for i, (x, y) in enumerate(spots):
        s = rng.uniform(0.05, 0.085)
        parts.append(rock(f'fb{i}', (x, y, s * 0.4), (s, s * rng.uniform(0.8, 1.1), s * rng.uniform(0.6, 0.9)), rng,
                          M.block))
    for i in range(5):
        x, y = rng.uniform(-0.38, 0.38), rng.choice((-0.36, 0.35)) + rng.uniform(-0.02, 0.02)
        parts.append(octa(f'pebble{i}', (x, y, 0.012), rng.uniform(0.02, 0.03), M.block, rng, squash=0.7))
    # ivy: runs of flat leafy clumps climbing the walls (pressed against the face), moss tufts on wall tops,
    # low clumps at the wall feet
    runs = [((-X - 0.012, -Y - 0.012), (0.0, 0.0), 0.05, 0.5, 0.06),     # south-west corner, up the gable
            ((-0.25, -Y - 0.012), (0.0, -1.0), 0.42, 0.58, 0.045),
            ((-X - 0.012, 0.02), (-1.0, 0.0), 0.05, 0.26, 0.055),           # west face
            ((0.03, -Y - 0.012), (0.0, -1.0), 0.06, 0.3, 0.05),             # broken edge by the window
            ((X + 0.012, -0.16), (1.0, 0.0), 0.05, 0.28, 0.055),            # east face
            ((0.2, Y + 0.012), (0.0, 1.0), 0.05, 0.2, 0.055)]               # north face
    k = 0
    for (cx, cy), (nx, ny), za, zb, rr in runs:
        n = max(1, round((zb - za) / (rr * 1.9)))
        for i in range(n + 1):
            z = za + (zb - za) * i / n
            jx, jy = rng.uniform(-0.02, 0.02), rng.uniform(-0.02, 0.02)
            sq = (0.55 if nx else 1.1, 0.55 if ny else 1.1, 1.05)
            if not nx and not ny:
                sq = (0.8, 0.8, 0.95)
            r = rr * rng.uniform(0.8, 1.15) * (1.0 - 0.3 * i / n)
            parts.append(blob(f'ivy{k}', (cx + jx * (not nx), cy + jy * (not ny), z), r, rng,
                              M.ivy if k % 3 else M.leaf, squash=sq, floor=0.0))
            k += 1
    for i, (x, y, z, rr) in enumerate(((-X + 0.035, -0.1, 0.33, 0.04), (-X + 0.035, 0.12, 0.19, 0.04),
                                       (0.0, Y - 0.035, 0.2, 0.04), (X - 0.035, 0.1, 0.25, 0.04),
                                       (0.29, -Y + 0.035, 0.29, 0.035), (-0.2, Y - 0.035, 0.15, 0.04),
                                       (-0.38, -0.32, 0.0, 0.055), (0.37, -0.34, 0.0, 0.05), (-0.38, 0.25, 0.0, 0.05),
                                       (0.37, 0.3, 0.0, 0.05), (-0.12, 0.0, 0.02, 0.05), (0.18, 0.14, 0.02, 0.045))):
        parts.append(blob(f'moss{i}', (x, y, z + rr * 0.35), rr, rng, M.leaf if i % 2 else M.ivy,
                          squash=(1.0, 1.0, 0.6), floor=0.0))
    obj = join(parts, 'ruins_idle')
    finish(obj, 'ruins_idle', size=512)


# ---------------------------------------------------------------- shrine

def shrine_idle():
    reset()
    M = Mats()
    rng = random.Random(71)
    parts = []
    # stepped plinth
    parts.append(box('step1', (0, 0.0, 0.035), (0.52, 0.44, 0.07), M.stone, skip=('-z',)))
    parts.append(box('step2', (0, 0.03, 0.105), (0.42, 0.34, 0.07), M.stone, skip=('-z',)))
    z0, z1 = 0.14, 0.5
    # niche: back wall, side pillars, dark inner panel, lintel and gable front
    parts.append(box('back', (0, 0.15, (z0 + z1) / 2), (0.36, 0.06, z1 - z0), M.stone, skip=('-z',)))
    for s in (-1, 1):
        parts.append(box(f'pillar{s}', (s * 0.15, 0.02, (z0 + z1) / 2), (0.07, 0.24, z1 - z0), M.stone, skip=('-z',)))
    parts.append(box('inner', (0, 0.115, (z0 + z1) / 2 + 0.01), (0.24, 0.012, z1 - z0 - 0.02), M.niche))
    parts.append(box('ledge', (0, 0.0, z0 + 0.015), (0.24, 0.24, 0.03), M.block, skip=('-z',)))
    parts.append(box('lintel', (0, 0.03, z1 + 0.025), (0.38, 0.29, 0.05), M.block, skip=('-z',)))
    parts.append(prism('gable', [(-0.19, z1 + 0.05), (0.19, z1 + 0.05), (0.0, 0.72)], 'y', -0.11, 0.18, M.stone))
    # roof of chunky stone slabs, ridge north-south, gable to the south
    rz, ex = 0.72, 0.25
    ez = rz - (rz - z1 - 0.05) / 0.19 * ex  # underside runs along the gable edges
    for s in (-1, 1):
        for k, (y0, y1) in enumerate(((-0.17, -0.055), (-0.05, 0.065), (0.07, 0.21))):
            th = 0.065 + rng.uniform(-0.006, 0.006)
            eave = (s * ex, ez)
            ridge = (0.0, rz)
            ln = math.hypot(ex, rz - ez)
            nx, nz = s * (rz - ez) / ln, ex / ln  # outward slope normal
            b = [(eave[0], y0, eave[1]), (eave[0], y1, eave[1]), (ridge[0], y1, ridge[1]), (ridge[0], y0, ridge[1])]
            t = [(p[0] + nx * th, p[1], p[2] + nz * th) for p in b]
            parts.append(hexa(f'slab{s}_{k}', b + t, M.block))
    parts.append(prism('ridgecap', [(-0.05, rz + 0.04), (0.05, rz + 0.04), (0.04, rz + 0.1), (-0.04, rz + 0.1)], 'y',
                       -0.18, 0.22, M.block))
    # statue: robed figure with a hood
    sc = (0.0, 0.06)
    rings = [circle(sc, 0.06, z0 + 0.03, 8), circle(sc, 0.052, z0 + 0.12, 8), circle(sc, 0.045, z0 + 0.2, 8),
             circle(sc, 0.03, z0 + 0.235, 8)]
    parts.append(loft('robe', rings, M.statue))
    parts.append(blob('head', (sc[0], sc[1] - 0.004, z0 + 0.262), 0.034, random.Random(3), M.statue,
                      squash=(0.9, 0.9, 1.05), jitter=0.05))
    parts.append(box('hands', (sc[0], sc[1] - 0.045, z0 + 0.15), (0.04, 0.03, 0.035), M.statue))
    # candle with flame (glows), a second small one on the step
    for i, (cx, cy, cz, h) in enumerate(((0.075, -0.06, z0 + 0.03, 0.06), (0.17, -0.18, 0.07, 0.045))):
        parts.append(loft(f'candle{i}', [circle((cx, cy), 0.014, cz, 6), circle((cx, cy), 0.014, cz + h, 6)], M.wax))
        parts.append(octa(f'flame{i}', (cx, cy, cz + h + 0.018), 0.014, M.glow, random.Random(4 + i), squash=1.7))
    # flowers in front, left and right of the steps
    for i, (c, rr) in enumerate((((-0.23, -0.24), 0.07), ((-0.12, -0.27), 0.05), ((0.24, -0.23), 0.065),
                                 ((0.29, -0.08), 0.055), ((-0.28, -0.07), 0.055))):
        parts.append(blob(f'fleaf{i}', (c[0], c[1], rr * 0.6), rr, rng, M.leaf, floor=0.0))
        for k in range(3):
            a = rng.uniform(0, 2 * math.pi)
            p = (c[0] + math.cos(a) * rr * 0.6, c[1] + math.sin(a) * rr * 0.6 - 0.01, rr * 1.15)
            parts.append(octa(f'flower{i}_{k}', p, 0.018, M.flowers[(i + k) % 3], rng, squash=0.7))
    obj = join(parts, 'shrine_idle')
    finish(obj, 'shrine_idle', size=512)


# ---------------------------------------------------------------- bridge

L_HALF, W_HALF = 1.0, 0.37
ARCH_X, ARCH_SPRING, ARCH_CROWN = 0.6, -0.15, 0.24
BOTTOM = -0.4


def deck_z(x):
    return 0.32 + 0.06 * math.cos(math.pi * x / (2 * L_HALF))


def arch_pt(t, grow=0.0):
    """Point on the arch intrados (t = 0 east springing .. 1 west), `grow` = offset outward."""
    a = math.pi * t
    return (math.cos(a) * (ARCH_X + grow), ARCH_SPRING + math.sin(a) * (ARCH_CROWN - ARCH_SPRING + grow))


def strip_solid(name, lower, upper, y0, y1, mat):
    """Solid between a lower and an upper chain of (x, z) points with matching x, extruded from y0 to y1."""
    bm = bmesh.new()
    outline = lower + list(reversed(upper))
    va = [bm.verts.new((x, y0, z)) for x, z in outline]
    vb = [bm.verts.new((x, y1, z)) for x, z in outline]
    n, m = len(outline), len(lower)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((va[i], va[j], vb[j], vb[i]))
    for v in (va, vb):
        for i in range(m - 1):
            bm.faces.new((v[i], v[i + 1], v[n - 2 - i], v[n - 1 - i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return with_mat(mesh_object(name, bm), mat)


def bridge_idle():
    reset()
    M = Mats()
    rng = random.Random(81)
    parts = []
    xs = [-L_HALF + 2 * L_HALF * i / 10 for i in range(11)]
    na = 9
    # body: two abutments and the spandrel over the arch, each strip a convex quad across the width
    for sx in (-1, 1):
        xa, xb = sorted((sx * L_HALF, sx * ARCH_X))
        pts = [(xa, BOTTOM), (xb, BOTTOM), (xb, deck_z(xb)), (xa, deck_z(xa))]
        parts.append(hexa(f'abut{sx}', [(x, -W_HALF, z) for x, z in pts] + [(x, W_HALF, z) for x, z in pts],
                          M.stone))
    lower = [arch_pt(1 - k / na) for k in range(na + 1)]
    parts.append(strip_solid('spandrel', lower, [(x, deck_z(x)) for x, _ in lower], -W_HALF, W_HALF, M.stone))
    # paving on top (slightly proud so the deck reads as flagstones)
    for i, (x0, x1) in enumerate(zip(xs, xs[1:])):
        z0, z1 = deck_z(x0), deck_z(x1)
        parts.append(hexa(f'pave{i}', [(x0, -W_HALF + 0.08, z0 - 0.01), (x1, -W_HALF + 0.08, z1 - 0.01),
                                       (x1, W_HALF - 0.08, z1 - 0.01), (x0, W_HALF - 0.08, z0 - 0.01),
                                       (x0, -W_HALF + 0.08, z0 + 0.008), (x1, -W_HALF + 0.08, z1 + 0.008),
                                       (x1, W_HALF - 0.08, z1 + 0.008), (x0, W_HALF - 0.08, z0 + 0.008)], M.paving))
    # voussoirs round the arch on both faces
    for s in (-1, 1):
        for k in range(na):
            t0, t1 = k / na + 0.004, (k + 1) / na - 0.004
            a0, a1 = arch_pt(t0), arch_pt(t1)
            b0, b1 = arch_pt(t0, 0.085), arch_pt(t1, 0.085)
            yi, yo = s * (W_HALF - 0.02), s * (W_HALF + 0.02)
            ring = [(a0[0], a0[1]), (a1[0], a1[1]), (b1[0], b1[1]), (b0[0], b0[1])]
            parts.append(hexa(f'vous{s}_{k}', [(x, yi, z) for x, z in ring] + [(x, yo, z) for x, z in ring], M.block))
    # parapets following the hump, with chunky caps
    for s in (-1, 1):
        yi, yo = s * (W_HALF - 0.08), s * W_HALF
        for i, (x0, x1) in enumerate(zip(xs[1:-1], xs[2:-1])):
            z0, z1 = deck_z(x0), deck_z(x1)
            h = 0.11
            parts.append(hexa(f'par{s}_{i}', [(x0, yi, z0 - 0.02), (x1, yi, z1 - 0.02), (x1, yo, z1 - 0.02),
                                              (x0, yo, z0 - 0.02), (x0, yi, z0 + h), (x1, yi, z1 + h),
                                              (x1, yo, z1 + h), (x0, yo, z0 + h)], M.stone))
            xm = (x0 + x1) / 2
            parts.append(box(f'cap{s}_{i}', (xm, (yi + yo) / 2, deck_z(xm) + h + 0.02),
                             (x1 - x0 - 0.012, 0.1, 0.04), M.block,
                             rot=(0, -math.atan2(z1 - z0, x1 - x0), rng.uniform(-0.03, 0.03))))
    # end posts: stacked blocks at the four corners, reaching down into the banks
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (L_HALF - 0.08), sy * (W_HALF - 0.03)
            top = deck_z(x) + 0.2
            parts.append(box(f'post{sx}{sy}', (x, y, (BOTTOM + top - 0.05) / 2), (0.16, 0.12, top - 0.05 - BOTTOM),
                             M.stone))
            parts.append(box(f'pcap{sx}{sy}', (x, y, top - 0.02), (0.18, 0.14, 0.06), M.block,
                             rot=(0, 0, rng.uniform(-0.05, 0.05))))
    obj = join(parts, 'bridge_idle')
    finish(obj, 'bridge_idle', size=512)


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    for fn in (fort_idle, ruins_idle, shrine_idle, bridge_idle):
        if not only or fn.__name__ in only:
            fn()
