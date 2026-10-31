"""Hollow Crown – the home castle Paktwacht as a 3D diorama (concept/23-art-direction §7), after the ChatGPT modelling
references in art/mockups/castle3d-refs/ (layout: paktwacht_diorama_l1-3.png, buildings: sheet_*.png).

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/blender_castle.py [-- --preview <dir>]

Builds every part from primitives (bmesh: bevelled boxes, cylinders, cones, blobs, extruded outlines) in the rounded,
chunky diorama look of the board props, and writes ONE file

- art/models/castle/paktwacht.glb   (copied to public/assets/models/castle/ by `pnpm art:build`; loaded on demand)

with one mesh object per part. A part is named `<group>_<levels>`:
- group: `shell` (island, walls, towers, gate, keep), a room id (convoy, merchant, smith, healer, tavern, campfire, memorial,
  enchanter, academy, workshop, training) or a keepsake (`axe`, `lute`, `books`)
- levels: `a` always, `1` only at build-up level 1 (ruin: scaffolding, tarps, rubble), `23` from level 2 (roofs, doors, lit
  windows), `3` only at level 3 (banners, lanterns, extras), `2` only at level 2
The shell is modelled in place (island centre = origin); rooms and keepsakes stand at the origin, front towards -Y (the
camera side), and the game places them (src/render/home/castle.ts). 1 Blender unit = 1 world unit of the castle scene.

Look: no textures. Colour sits in the vertex colours (stored as sRGB values, the scene shades in gamma space like the
board), one flat colour per face with a soft painted gradient (darker, slightly cooler at the bottom of each block, lighter
tops) and a little per-face jitter. Two materials: `castle_lit` and `castle_glow` (windows, fire, lanterns, runes: drawn
unlit). Stone masonry is a few large bevelled blocks (the references are far too detailed for a phone). Ember orange
banners (#E8743B); no team colours (blue/red, art direction §2.1), no crosses on the memorial hall.

Afterwards gltfpack (devDependency) quantizes and meshopt-compresses the file. Fixed seeds: the output is deterministic.
"""
import math
import os
import random
import shutil
import subprocess
import sys

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT_DIR = os.path.join(ROOT, 'art', 'models', 'castle')
OUT = os.path.join(OUT_DIR, 'paktwacht.glb')
GLTFPACK = os.path.join(ROOT, 'node_modules', '.bin', 'gltfpack.cmd' if os.name == 'nt' else 'gltfpack')
ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = ARGV[ARGV.index('--preview') + 1] if '--preview' in ARGV else None

# ------------------------------------------------------------------------------------------------ palette (sRGB hex)

PAL = {
    'stone': '#dcc6a0', 'stone2': '#cfb690', 'stone3': '#e8d6b4', 'stone_new': '#efe2c6', 'stone_dark': '#ab9472',
    'mortar': '#9c8466', 'relief': '#f0e0c0', 'step': '#d2bc98',
    'rock': '#a0704c', 'rock2': '#8c5e3e', 'rock_dark': '#6e4632', 'earth': '#7c5236',
    'grass': '#94b24a', 'grass2': '#a8c456', 'grass_dark': '#759339', 'moss': '#86a83e',
    'ivy': '#6e9a2c', 'ivy2': '#8fb83a', 'leaf': '#7fa83a', 'leaf2': '#a2c24a', 'leaf_dark': '#5d8a2c', 'cypress': '#4f7a34',
    'bark': '#6a4630', 'wood': '#8e5c34', 'wood_light': '#b47c46', 'wood_dark': '#5e3c24', 'plank': '#a06a3c',
    'plaster': '#efe3c8', 'slate': '#5a6690', 'slate2': '#6a76a0', 'terra': '#c6643a', 'terra2': '#da7a4a',
    'canvas': '#ecdfc0', 'canvas2': '#d8c79e', 'banner': '#e8743b', 'banner_dark': '#b9532a', 'cream': '#f5e8c8',
    'iron': '#4c4a48', 'iron2': '#77736c', 'steel': '#a9a7a2', 'gold': '#d8a640', 'brass': '#c08a3a',
    'cobble': '#dcc69e', 'cobble2': '#ceb48a', 'cobble3': '#e6d4b0', 'grout': '#a99272', 'sand': '#e2c78f', 'sand2': '#d4b67c',
    'straw': '#ddb75c', 'straw2': '#c99f45', 'soil': '#6c4a32',
    'lavender': '#9c82d4', 'flower_w': '#f6f1e2', 'flower_y': '#f3d058', 'flower_p': '#e391ad', 'herb': '#7aa848',
    'glow': '#ffc865', 'glow2': '#ffe09a', 'fire': '#ff8c2c', 'fire2': '#ffd04a', 'rune': '#f7d96b', 'rune2': '#b48cf0',
    'shelf': '#7a4a2a', 'book_p': '#6e4a8a', 'book_g': '#55703c', 'book_m': '#8a3f2c', 'book_c': '#eadcb6', 'parch': '#f0e2bc',
    'leather': '#9a5a30', 'pot': '#3c3a3a', 'fruit_o': '#f0a040', 'fruit_g': '#a6c44a', 'fruit_y': '#f2d25a',
}


def rgb(name):
    h = PAL.get(name, name).lstrip('#')
    return Vector((int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255))


COOL = Vector((0.86, 0.86, 1.04))  # hue shift of the shaded bottom (art direction §3: shadows cooler and more violet)
RNG = random.Random(7)


# ------------------------------------------------------------------------------------------------ parts and primitives


class Part:
    """Geometry of one exported mesh: plain lists (vertices, faces with material and per-corner colours)."""

    def __init__(self, name):
        self.name = name
        self.verts = []
        self.faces = []  # (vertex indices, material 0 lit | 1 glow, [rgb per corner])

    def emit(self, bm, M, col, glow=False, shade=(0.8, 1.04), jitter=0.035):
        bm.normal_update()
        bm.verts.index_update()
        co = [M @ v.co for v in bm.verts]
        if not co:
            return
        zmin = min(c.z for c in co)
        zmax = max(c.z for c in co)
        span = max(zmax - zmin, 1e-4)
        base = len(self.verts)
        self.verts.extend(co)
        c0 = rgb(col) if isinstance(col, str) else Vector(col)
        rot = M.to_3x3()
        for f in bm.faces:
            n = (rot @ f.normal)
            n = n.normalized() if n.length > 1e-8 else Vector((0, 0, 1))
            if glow:
                k_face = 1.0
            else:
                k_face = 1 + RNG.uniform(-jitter, jitter)
                if n.z > 0.72:
                    k_face *= 1.06
                elif n.z < -0.5:
                    k_face *= 0.72
            corners = []
            for v in f.verts:
                if glow:
                    corners.append(tuple(c0))
                    continue
                t = (co[v.index].z - zmin) / span
                k = (shade[0] + (shade[1] - shade[0]) * t) * k_face
                c = c0 * k
                if t < 0.5:
                    m = (0.5 - t) * 0.5
                    c = Vector((c.x * (1 - m + m * COOL.x), c.y * (1 - m + m * COOL.y), c.z * (1 - m + m * COOL.z)))
                corners.append((min(c.x, 1), min(c.y, 1), min(c.z, 1)))
            self.faces.append((tuple(base + v.index for v in f.verts), 1 if glow else 0, corners))
        bm.free()

    def tris(self):
        return sum(len(f[0]) - 2 for f in self.faces)


def mat4(loc=(0, 0, 0), rot=(0, 0, 0), scale=None):
    M = Matrix.Translation(Vector(loc)) @ Euler([math.radians(a) for a in rot], 'XYZ').to_matrix().to_4x4()
    if scale is not None:
        M = M @ Matrix.Diagonal(Vector((*scale, 1)))
    return M


def _bevel(bm, edges, off):
    if off > 1e-4 and edges:
        bmesh.ops.bevel(bm, geom=list(edges), offset=off, offset_type='OFFSET', segments=1, profile=0.5,
                        affect='EDGES', clamp_overlap=True)


def box(p, col, loc, size, rot=(0, 0, 0), bev=0.15, glow=False, shade=(0.8, 1.04), M=None):
    """Bevelled box, `loc` = centre of the bottom face, `size` = full dimensions, `bev` = share of the smallest side."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    sx, sy, sz = size
    for v in bm.verts:
        v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz + sz / 2))
    if min(size) >= 0.1:  # a bevel on smaller parts is not visible on a phone, only costly
        _bevel(bm, bm.edges, min(size) * bev)
    p.emit(bm, (M or Matrix()) @ mat4(loc, rot), col, glow, shade)


def cyl(p, col, loc, r, h, seg=10, r2=None, rot=(0, 0, 0), bev=0.12, glow=False, shade=(0.8, 1.04), M=None):
    """Cylinder (or frustum) standing on `loc`; bevelled rims."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    for v in bm.verts:
        v.co.z += h / 2
    rims = [e for e in bm.edges if any(len(f.verts) > 4 for f in e.link_faces)]
    _bevel(bm, rims, min(r, r2 if r2 else r, h) * bev)
    p.emit(bm, (M or Matrix()) @ mat4(loc, rot), col, glow, shade)


def cone(p, col, loc, r, h, seg=10, rot=(0, 0, 0), glow=False, shade=(0.82, 1.06), M=None):
    bm = bmesh.new()
    ring = [bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), 0)) for i in range(seg)]
    apex = bm.verts.new((0, 0, h))
    bm.faces.new(list(reversed(ring)))
    for i in range(seg):
        bm.faces.new((ring[i], ring[(i + 1) % seg], apex))
    p.emit(bm, (M or Matrix()) @ mat4(loc, rot), col, glow, shade)


def blob(p, col, loc, size, sub=1, lumpy=0.12, seed=0, rot=(0, 0, 0), glow=False, shade=(0.78, 1.06), M=None):
    """Lumpy ellipsoid (tree crowns, bushes, ivy, rocks): `size` = radii."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0)
    r = random.Random(seed)
    for v in bm.verts:
        k = 1 + r.uniform(-lumpy, lumpy)
        v.co = Vector((v.co.x * size[0] * k, v.co.y * size[1] * k, v.co.z * size[2] * k))
    p.emit(bm, (M or Matrix()) @ mat4(loc, rot), col, glow, shade)


def poly(p, col, pts, loc, depth=0.06, rot=(0, 0, 0), glow=False, shade=(0.86, 1.02), M=None):
    """Outline `pts` [(x, z)] in the XZ plane, extruded from y = 0 to y = +depth (the face at y = 0 looks to -Y)."""
    bm = bmesh.new()
    front = [bm.verts.new((x, 0, z)) for x, z in pts]
    back = [bm.verts.new((x, depth, z)) for x, z in pts]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((front[j], front[i], back[i], back[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    p.emit(bm, (M or Matrix()) @ mat4(loc, rot), col, glow, shade)


def beam(p, col, a, b, t=0.07, bev=0.2, M=None):
    """Square beam from point a to point b."""
    a, b = Vector(a), Vector(b)
    d = b - a
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * t, v.co.y * t, v.co.z * d.length + d.length / 2))
    _bevel(bm, bm.edges, t * bev)
    p.emit(bm, (M or Matrix()) @ Matrix.Translation(a) @ q.to_matrix().to_4x4(), col, False, (0.85, 1.02))


def arch_pts(w, h, pointed=True, n=5):
    """Door/window outline: rectangle with a pointed (gothic, two arcs) or round top, bottom centre at (0, 0)."""
    hw = w / 2
    if pointed:
        R = w * 0.8
        amax = math.acos((R - hw) / R)
        spring = max(0.03, h - R * math.sin(amax))
        side = [((hw - R) + R * math.cos(amax * i / n), spring + R * math.sin(amax * i / n)) for i in range(n + 1)]
    else:
        spring = max(0.03, h - hw)
        side = [(hw * math.cos(math.pi / 2 * i / n), spring + hw * math.sin(math.pi / 2 * i / n)) for i in range(n + 1)]
    pts = [(-hw, 0), (hw, 0)] + side
    pts += [(-x, z) for x, z in reversed(side[:-1])]
    return pts


def disc_pts(r, n=12):
    return [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]


# ------------------------------------------------------------------------------------------------ building blocks
# All take a world/room matrix M (default identity) so a block can be built rotated and moved.


def gable(p, col, c, w, d, h, over=0.22, thick=0.16, ridge='wood_dark', accent=None, seed=0, M=None, along='x'):
    """Thick gable roof: two slabs meeting at the ridge (ridge along x, or along y with along='y'); eave height c[2]."""
    cx, cy, z0 = c
    R = mat4((cx, cy, z0), (0, 0, 90 if along == 'y' else 0))
    M = (M or Matrix()) @ R
    half = d / 2
    ang = math.degrees(math.atan2(h, half))
    slope = math.hypot(h, half)
    rnd = random.Random(seed)
    for s in (-1, 1):
        # slab centre: middle of eave-ridge line, pushed outwards by half the thickness and towards the eave by over/2
        dirv = Vector((0, -s * half, h)).normalized()
        nrm = Vector((0, s * h, half)).normalized()
        mid = Vector((0, s * half / 2, h / 2)) - dirv * (over / 2)
        box(p, col, tuple(mid), (w + 2 * over, slope + over, thick), rot=(-s * ang, 0, 0), bev=0.25, M=M)
        if accent:
            for k in range(3):
                u = rnd.uniform(-w / 2 + 0.2, w / 2 - 0.2)
                t = rnd.uniform(0.25, 0.75)
                pt = Vector((u, s * half * (1 - t), h * t)) + nrm * (thick * 0.95) - Vector((0, 0, 0.01))
                box(p, accent, tuple(pt), (0.24, 0.2, 0.05), rot=(-s * ang, 0, 0), bev=0.2, M=M)
    beam(p, ridge, (-w / 2 - over, 0, h + thick * 0.75), (w / 2 + over, 0, h + thick * 0.75), t=0.14, M=M)


def gable_wall(p, col, c, d, h, x_off, thick=0.12, M=None, along='x'):
    """Triangular gable end filling the roof at x = x_off (local)."""
    cx, cy, z0 = c
    R = mat4((cx, cy, z0), (0, 0, 90 if along == 'y' else 0))
    pts = [(-d * 0.46, 0), (d * 0.46, 0), (0, h * 0.9)]
    poly(p, col, pts, (x_off + thick / 2, 0, 0), depth=thick, rot=(0, 0, 90), M=(M or Matrix()) @ R)


def rafters(p, c, w, d, h, n=4, M=None, col='wood', along='x', skip=()):
    """Bare roof timbers of a ruined gable roof."""
    cx, cy, z0 = c
    R = (M or Matrix()) @ mat4((cx, cy, z0), (0, 0, 90 if along == 'y' else 0))
    for i in range(n):
        if i in skip:
            continue
        x = -w / 2 + w * i / (n - 1)
        beam(p, col, (x, -d / 2, 0), (x, 0, h), t=0.08, M=R)
        if i % 2 == 0:
            beam(p, col, (x, d / 2, 0), (x, 0, h), t=0.08, M=R)
    beam(p, 'wood_dark', (-w / 2, 0, h), (w / 2 * 0.6, 0, h), t=0.1, M=R)


def window(base, lit, x, y, z, w=0.26, h=0.42, pointed=True, M=None, frame='stone3', rot=0):
    """Window on a wall facing -Y at depth y: stone frame and dark pane in `base`, glowing pane in `lit` (may be None)."""
    R = (M or Matrix()) @ mat4((x, y, z), (0, 0, rot))
    poly(base, frame, arch_pts(w + 0.1, h + 0.08, pointed), (0, -0.03, -0.04), depth=0.05, M=R)
    poly(base, 'wood_dark', arch_pts(w, h, pointed), (0, -0.05, 0), depth=0.03, M=R)
    if lit is not None:
        poly(lit, 'glow', arch_pts(w - 0.05, h - 0.05, pointed), (0, -0.065, 0.025), depth=0.02, glow=True, M=R)
        box(lit, 'wood_dark', (0, -0.075, 0.025 + (h - 0.05) * 0.45), (w - 0.04, 0.02, 0.03), bev=0, M=R)


def round_window(base, lit, x, y, z, r=0.16, M=None):
    R = (M or Matrix()) @ mat4((x, y, z))
    poly(base, 'stone3', disc_pts(r + 0.06, 12), (0, -0.03, 0), depth=0.05, M=R)
    poly(base, 'wood_dark', disc_pts(r, 12), (0, -0.05, 0), depth=0.03, M=R)
    if lit is not None:
        poly(lit, 'glow', disc_pts(r - 0.03, 12), (0, -0.065, 0), depth=0.02, glow=True, M=R)
        box(lit, 'wood_dark', (0, -0.075, -r + 0.03), (0.03, 0.02, 2 * r - 0.06), bev=0, M=R)
        box(lit, 'wood_dark', (0, -0.075, -0.015), (2 * r - 0.06, 0.02, 0.03), bev=0, M=R)


def door(p, x, y, z, w=0.42, h=0.7, pointed=True, M=None, col='wood', frame='stone3', rot=0, open_glow=None):
    R = (M or Matrix()) @ mat4((x, y, z), (0, 0, rot))
    poly(p, frame, arch_pts(w + 0.14, h + 0.08, pointed), (0, -0.03, 0), depth=0.05, M=R)
    if open_glow is not None:
        poly(open_glow, 'glow', arch_pts(w, h, pointed), (0, -0.05, 0), depth=0.03, glow=True, M=R)
        return
    poly(p, col, arch_pts(w, h, pointed), (0, -0.06, 0), depth=0.04, M=R)
    for k in (-1, 1):
        box(p, 'iron', (0, -0.075, h * (0.3 if k < 0 else 0.62)), (w * 0.9, 0.02, 0.035), bev=0, M=R)
    box(p, 'wood_dark', (0, -0.072, 0), (0.025, 0.02, h * 0.85), bev=0, M=R)


def banner(p, x, y, z, w=0.36, h=0.72, M=None, rot=0):
    """Hanging ember banner on a rod (top of the rod at z), facing -Y, with a light chevron motif."""
    R = (M or Matrix()) @ mat4((x, y, z), (0, 0, rot))
    cyl(p, 'wood_dark', (-w / 2 - 0.08, -0.06, 0.0), 0.025, w + 0.16, seg=6, rot=(0, 90, 0), M=R)
    for sx in (-1, 1):
        blob(p, 'brass', (sx * (w / 2 + 0.08), -0.06, 0), (0.04, 0.04, 0.04), sub=1, lumpy=0, M=R)
    pts = [(-w / 2, 0), (w / 2, 0), (w / 2, -h), (0, -h + 0.14), (-w / 2, -h)]
    poly(p, 'banner', pts, (0, -0.09, -0.02), depth=0.035, M=R)
    chev = [(-w * 0.28, -h * 0.35), (0, -h * 0.5), (w * 0.28, -h * 0.35), (w * 0.28, -h * 0.47), (0, -h * 0.62), (-w * 0.28, -h * 0.47)]
    poly(p, 'cream', chev, (0, -0.1, -0.02), depth=0.012, M=R)
    blob(p, 'cream', (0, -0.1, -0.02 - h * 0.25), (w * 0.09, 0.012, w * 0.09), sub=1, lumpy=0, M=R)


def pennant(p, x, y, z, h=0.7, M=None, rot=0):
    R = (M or Matrix()) @ mat4((x, y, z), (0, 0, rot))
    cyl(p, 'wood_dark', (0, 0, 0), 0.03, h, seg=6, M=R)
    blob(p, 'gold', (0, 0, h + 0.03), (0.05, 0.05, 0.05), sub=1, lumpy=0, M=R)
    poly(p, 'banner', [(0.03, h - 0.02), (0.5, h - 0.12), (0.36, h - 0.18), (0.48, h - 0.26), (0.03, h - 0.3)], (0, -0.015, 0), depth=0.03, M=R)


def lantern_post(p, x, y, h=0.95, M=None):
    R = (M or Matrix()) @ mat4((x, y, 0))
    box(p, 'stone2', (0, 0, 0), (0.16, 0.16, 0.08), bev=0.25, M=R)
    cyl(p, 'iron', (0, 0, 0.06), 0.035, h - 0.2, seg=6, M=R)
    box(p, 'iron', (0, 0, h - 0.18), (0.18, 0.18, 0.03), bev=0.2, M=R)
    box(p, 'glow', (0, 0, h - 0.15), (0.13, 0.13, 0.18), bev=0.1, glow=True, M=R)
    cone(p, 'iron', (0, 0, h + 0.03), 0.13, 0.12, seg=4, rot=(0, 0, 45), M=R)


def lantern_wall(p, x, y, z, M=None, rot=0):
    """Small lantern on a bracket, on a wall facing -Y at depth y."""
    R = (M or Matrix()) @ mat4((x, y, z), (0, 0, rot))
    box(p, 'iron', (0, -0.08, 0.1), (0.04, 0.16, 0.04), bev=0, M=R)
    box(p, 'glow', (0, -0.16, -0.1), (0.1, 0.1, 0.16), bev=0.1, glow=True, M=R)
    cone(p, 'iron', (0, -0.16, 0.06), 0.1, 0.09, seg=4, rot=(0, 0, 45), M=R)


def barrel(p, x, y, r=0.17, h=0.36, M=None, z=0):
    R = (M or Matrix()) @ mat4((x, y, z))
    cyl(p, 'wood', (0, 0, 0), r * 0.9, h / 2, seg=10, r2=r, M=R, bev=0.05)
    cyl(p, 'wood', (0, 0, h / 2), r, h / 2, seg=10, r2=r * 0.9, M=R, bev=0.05)
    for z_ in (h * 0.18, h * 0.76):
        cyl(p, 'iron2', (0, 0, z_), r * 0.98, 0.04, seg=10, M=R, bev=0)


def crate(p, x, y, s=0.3, rot=0, M=None, z=0):
    R = (M or Matrix()) @ mat4((x, y, z), (0, 0, rot))
    box(p, 'wood_light', (0, 0, 0), (s, s, s), bev=0.08, M=R)
    for sy in (-1, 1):
        box(p, 'wood', (0, sy * s / 2, s * 0.42), (s * 1.02, 0.03, 0.05), bev=0, M=R)


def sack(p, x, y, s=0.16, M=None, seed=0):
    R = (M or Matrix()) @ mat4((x, y, 0))
    blob(p, 'canvas2', (0, 0, s * 0.9), (s, s * 0.85, s), sub=1, lumpy=0.1, seed=seed, M=R)
    blob(p, 'canvas2', (0, 0, s * 1.9), (s * 0.35, s * 0.35, s * 0.3), sub=1, lumpy=0.1, seed=seed + 1, M=R)


def rubble(p, cx, cy, n=5, spread=0.4, s=0.16, seed=0, M=None, col=('stone', 'stone2', 'stone_dark')):
    r = random.Random(seed)
    for i in range(n):
        x = cx + r.uniform(-spread, spread)
        y = cy + r.uniform(-spread, spread) * 0.7
        k = s * r.uniform(0.7, 1.3)
        box(p, col[i % len(col)], (x, y, -0.02), (k * 1.3, k, k * 0.9), rot=(r.uniform(-12, 12), r.uniform(-12, 12), r.uniform(0, 90)), bev=0.22, M=M)


def ivy(p, x, y, z, n=4, spread=(0.3, 0.6), seed=0, M=None, face=0):
    """Clump of ivy on a wall face looking towards angle `face` (degrees around Z, 0 = -Y)."""
    r = random.Random(seed)
    R = (M or Matrix()) @ mat4((x, y, z), (0, 0, face))
    for i in range(n):
        dx = r.uniform(-spread[0], spread[0])
        dz = -r.uniform(0, spread[1])
        s = r.uniform(0.11, 0.2)
        blob(p, 'ivy' if i % 2 else 'ivy2', (dx, -0.02, dz), (s, s * 0.45, s * 1.15), sub=1, lumpy=0.25, seed=seed * 13 + i, M=R)


def tree(p, x, y, s=1.0, seed=0, M=None):
    r = random.Random(seed)
    R = (M or Matrix()) @ mat4((x, y, 0), (0, 0, r.uniform(0, 360)), (s, s, s))
    cyl(p, 'bark', (0, 0, 0), 0.11, 0.7, seg=7, r2=0.08, M=R)
    blob(p, 'leaf', (0, 0, 0.95), (0.48, 0.46, 0.4), sub=2, lumpy=0.1, seed=seed, M=R)
    blob(p, 'leaf2', (0.2, -0.12, 1.25), (0.32, 0.3, 0.28), sub=1, lumpy=0.12, seed=seed + 1, M=R)
    blob(p, 'leaf_dark', (-0.24, 0.12, 0.85), (0.32, 0.3, 0.27), sub=1, lumpy=0.12, seed=seed + 2, M=R)


def cypress(p, x, y, s=1.0, seed=0, M=None):
    R = (M or Matrix()) @ mat4((x, y, 0), (0, 0, 0), (s, s, s))
    cyl(p, 'bark', (0, 0, 0), 0.05, 0.2, seg=6, M=R)
    blob(p, 'cypress', (0, 0, 0.6), (0.17, 0.17, 0.48), sub=1, lumpy=0.08, seed=seed, M=R)


def bush(p, x, y, s=0.3, seed=0, M=None, col='leaf', flowers=None):
    r = random.Random(seed)
    R = (M or Matrix()) @ mat4((x, y, 0))
    blob(p, col, (0, 0, s * 0.6), (s, s * 0.9, s * 0.75), sub=1, lumpy=0.15, seed=seed, M=R)
    blob(p, 'leaf_dark', (s * 0.6, s * 0.2, s * 0.4), (s * 0.6, s * 0.55, s * 0.5), sub=1, lumpy=0.15, seed=seed + 1, M=R)
    if flowers:
        for i in range(4):
            a = r.uniform(0, 6.28)
            blob(p, flowers, (math.cos(a) * s * 0.7, math.sin(a) * s * 0.7, s * 0.9 + r.uniform(0, s * 0.3)), (0.05, 0.05, 0.04), sub=1, lumpy=0, M=R)


def scaffold(p, x, y, w, d, h, M=None, rot=0, levels=2):
    R = (M or Matrix()) @ mat4((x, y, 0), (0, 0, rot))
    for px, py in ((-w / 2, -d / 2), (w / 2, -d / 2), (-w / 2, d / 2), (w / 2, d / 2)):
        beam(p, 'wood_light', (px, py, 0), (px, py, h), t=0.06, M=R)
    for k in range(1, levels + 1):
        z = h * k / (levels + 0.3)
        beam(p, 'wood_light', (-w / 2 - 0.05, -d / 2, z), (w / 2 + 0.05, -d / 2, z), t=0.05, M=R)
        beam(p, 'wood_light', (-w / 2, -d / 2 - 0.05, z), (-w / 2, d / 2 + 0.05, z), t=0.05, M=R)
        beam(p, 'wood_light', (w / 2, -d / 2 - 0.05, z), (w / 2, d / 2 + 0.05, z), t=0.05, M=R)
        box(p, 'plank', (0, -d / 2 - 0.12, z + 0.03), (w, 0.26, 0.04), bev=0.1, M=R)
    beam(p, 'wood_light', (-w / 2, -d / 2 - 0.03, 0.05), (w / 2, -d / 2 - 0.03, h / (levels + 0.3)), t=0.045, M=R)


def tarp(p, x, y, z, w, h, M=None, rot=(0, 0, 0), sag=0.08, col='canvas'):
    """Canvas sheet (a slightly sagging, thin slab) hanging from its top edge, facing -Y."""
    R = (M or Matrix()) @ mat4((x, y, z), rot)
    pts = [(-w / 2, 0), (w / 2, 0), (w / 2 - 0.05, -h), (w * 0.15, -h + 0.08), (-w * 0.1, -h - 0.04), (-w / 2 + 0.04, -h + 0.03)]
    poly(p, col, pts, (0, -sag, 0), depth=0.03, M=R)


def merlons(p, a, b, z, t, col='stone', size=0.42, gap=0.82, M=None, jag=None):
    """Row of crenellation blocks along the line a→b (2D points) at height z, wall thickness t."""
    a, b = Vector((*a, 0)), Vector((*b, 0))
    d = b - a
    L = d.length
    ang = math.degrees(math.atan2(d.y, d.x))
    n = max(1, int(L / gap))
    for i in range(n):
        if jag and jag.random() < 0.45:
            continue
        c = a + d * ((i + 0.5) / n)
        box(p, col, (c.x, c.y, z), (size, t + 0.04, 0.4), rot=(0, 0, ang), bev=0.18, M=M)


def wall_segment(p, a, b, h=2.2, t=0.7, broken=False, seed=0, M=None, ivy_p=None):
    """Curtain wall between two ground points: one body block, a few big protruding stones, crenellations."""
    r = random.Random(seed)
    a2, b2 = Vector((*a, 0)), Vector((*b, 0))
    d = b2 - a2
    L = d.length
    ang = math.degrees(math.atan2(d.y, d.x))
    c = (a2 + b2) / 2
    hh = h * (r.uniform(0.5, 0.82) if broken else 1.0)
    tone = r.choice(('stone', 'stone2', 'stone3'))
    box(p, tone, (c.x, c.y, 0), (L + t * 0.35, t, hh), rot=(0, 0, ang), bev=0.06, M=M)
    box(p, 'stone_dark', (c.x, c.y, 0), (L + t * 0.4, t + 0.12, 0.3), rot=(0, 0, ang), bev=0.2, M=M)
    u = d.normalized()
    for k in range(2):
        f = r.uniform(-0.35, 0.35)
        z = r.uniform(0.35, hh - 0.6) if hh > 1.0 else 0.3
        bs = (r.uniform(0.42, 0.6), t + 0.1, r.uniform(0.3, 0.42))
        q = c + u * (f * L)
        box(p, r.choice(('stone3', 'stone', 'stone_new' if not broken else 'stone2')), (q.x, q.y, z), bs, rot=(0, 0, ang), bev=0.2, M=M)
    if broken:
        # jagged top: a few stepped blocks, no walkway
        for k in range(r.randint(1, 3)):
            f = r.uniform(-0.4, 0.4)
            q = c + u * (f * L)
            box(p, 'stone2', (q.x, q.y, hh - 0.05), (r.uniform(0.35, 0.6), t * 0.9, r.uniform(0.2, 0.45)), rot=(r.uniform(-6, 6), 0, ang), bev=0.2, M=M)
    else:
        box(p, 'stone2', (c.x, c.y, hh - 0.02), (L + t * 0.3, t + 0.1, 0.12), rot=(0, 0, ang), bev=0.3, M=M)
        merlons(p, (a2 - u * (-0.1)).to_2d(), (b2 - u * 0.1).to_2d(), hh + 0.08, t, M=M)
    if ivy_p is not None and r.random() < 0.55:
        q = c + u * r.uniform(-0.3, 0.3) * L
        nrm = Vector((-u.y, u.x, 0))
        s = 1 if nrm.y < 0 else -1  # only on the face the camera sees (towards -Y)
        pt = q + nrm * (s * (t / 2 + 0.02))
        ivy(ivy_p, pt.x, pt.y, hh - 0.1, n=4, spread=(0.3, min(1.2, hh - 0.3)), seed=seed * 7 + s, face=ang + (0 if s < 0 else 180), M=M)


def round_tower(p, lit, x, y, r=0.95, h=3.0, broken=False, seed=0, M=None, win_face=0, ivy_p=None):
    R = (M or Matrix()) @ mat4((x, y, 0))
    rr = random.Random(seed)
    hh = h * (0.78 if broken else 1.0)
    cyl(p, 'stone_dark', (0, 0, 0), r * 1.12, 0.4, seg=14, r2=r * 1.06, M=R, bev=0.15)
    cyl(p, 'stone', (0, 0, 0.3), r * 1.04, hh - 0.3, seg=14, r2=r, M=R, bev=0.03)
    # band of big blocks half-way up
    for i in range(5):
        a = rr.uniform(0, 2 * math.pi)
        z = rr.uniform(0.6, hh - 0.6)
        box(p, rr.choice(('stone3', 'stone2')), (math.cos(a) * r * 0.98, math.sin(a) * r * 0.98, z), (0.42, 0.22, 0.32),
            rot=(0, 0, math.degrees(a) + 90), bev=0.2, M=R)
    if broken:
        for i in range(6):
            if rr.random() < 0.35:
                continue
            a = 2 * math.pi * i / 6 + rr.uniform(-0.2, 0.2)
            box(p, 'stone2', (math.cos(a) * r * 0.82, math.sin(a) * r * 0.82, hh - 0.05), (0.5, 0.36, rr.uniform(0.25, 0.6)),
                rot=(0, 0, math.degrees(a) + 90), bev=0.2, M=R)
    else:
        cyl(p, 'stone2', (0, 0, hh - 0.05), r * 1.14, 0.3, seg=14, M=R, bev=0.2)
        cyl(p, 'cobble2', (0, 0, hh + 0.2), r * 1.0, 0.04, seg=14, M=R, bev=0)
        n = 8
        for i in range(n):
            a = 2 * math.pi * (i + 0.5) / n
            box(p, 'stone', (math.cos(a) * r * 1.0, math.sin(a) * r * 1.0, hh + 0.22), (0.38, 0.3, 0.38),
                rot=(0, 0, math.degrees(a) + 90), bev=0.2, M=R)
    W = R @ mat4((0, 0, 0), (0, 0, win_face))
    window(p, lit, 0, -r * 1.0, hh * 0.55, w=0.24, h=0.44, M=W)
    if ivy_p is not None:
        a = rr.uniform(0, 360)
        ivy(ivy_p, math.cos(math.radians(a)) * r, math.sin(math.radians(a)) * r, hh - 0.2, n=5, spread=(0.25, hh * 0.6), seed=seed, face=a + 90, M=R)


def cone_roof(p, x, y, z, r, h, M=None, seg=12, col='slate', accent='terra', seed=0, flag=True):
    R = (M or Matrix()) @ mat4((x, y, z))
    cyl(p, 'wood_dark', (0, 0, -0.05), r * 1.02, 0.12, seg=seg, M=R, bev=0.1)
    cone(p, col, (0, 0, 0.05), r * 1.06, h, seg=seg, M=R)
    rr = random.Random(seed)
    if accent:
        for i in range(4):
            a = rr.uniform(0, 2 * math.pi)
            t = rr.uniform(0.2, 0.6)
            rad = r * 1.06 * (1 - t) + 0.02
            tilt = -(90 - math.degrees(math.atan2(h, r * 1.06)))
            box(p, accent, (math.cos(a) * rad, math.sin(a) * rad, 0.05 + h * t), (0.2, 0.05, 0.16),
                rot=(tilt, 0, math.degrees(a) + 90), bev=0.2, M=R)
    blob(p, 'gold', (0, 0, h + 0.1), (0.07, 0.07, 0.07), sub=1, lumpy=0, M=R)
    if flag:
        pennant(p, 0, 0, h + 0.05, h=0.6, M=R)


def stairs(p, x, y, w, n=3, step=0.14, depth=0.2, M=None, col='step', rot=0):
    R = (M or Matrix()) @ mat4((x, y, 0), (0, 0, rot))
    for i in range(n):
        box(p, col, (0, -(n - i) * depth / 2, 0), (w, (n - i) * depth, step * (i + 1)), bev=0.15, M=R)


def fence(p, pts, M=None, post='wood_dark', rail='wood', h=0.42, broken=None, stone_posts=False):
    """Posts at the given points, two rails between neighbours; `broken` = random.Random to drop or tilt rails."""
    for i, (x, y) in enumerate(pts):
        if stone_posts and i % 2 == 0:
            box(p, 'stone2', (x, y, 0), (0.2, 0.2, h + 0.12), bev=0.18, M=M)
        else:
            box(p, post, (x, y, 0), (0.08, 0.08, h + 0.04), bev=0.2, M=M)
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        for z in (h * 0.45, h * 0.85):
            if broken and broken.random() < 0.4:
                continue
            dz = broken.uniform(-0.15, 0.15) if broken else 0
            beam(p, rail, (a[0], a[1], z), (b[0], b[1], z + dz), t=0.06, M=M)


# ------------------------------------------------------------------------------------------------ registry

PARTS = {}


def part(name):
    if name not in PARTS:
        PARTS[name] = Part(name)
    return PARTS[name]


class Lv:
    """The level parts of one group: a (always), l1, l2, l23, l3."""

    def __init__(self, group):
        self.a = part(f'{group}_a')
        self.l1 = part(f'{group}_1')
        self.l23 = part(f'{group}_23')
        self.l3 = part(f'{group}_3')
        self.group = group

    @property
    def l2(self):
        return part(f'{self.group}_2')


# ------------------------------------------------------------------------------------------------ island and shell

ISLAND_R = 10.8
WALL_R = 9.4
WALL_T = 0.7
GATE_HALF = 2.15  # pillar centre distance from the gate axis
TOWERS = [-21, 18, 112, 145, 201]  # wall towers, degrees (0 = +X / right, 90 = +Y / back)
KEEP_TOWER = (3.5, 7.86, 1.6)  # the big round tower (x, y, r)
KEEP_HALL = (-0.7, 6.9)


def build_island(L):
    a = L.a
    rr = random.Random(11)
    # grass top: polar rings, faces jittered between three greens
    bm = bmesh.new()
    rings = [0, 2.5, 5.0, 7.0, 8.6, 9.8, ISLAND_R]
    seg = 48
    grid = []
    for i, r in enumerate(rings):
        row = []
        n = 1 if r == 0 else seg
        for j in range(n):
            ang = 2 * math.pi * j / seg
            z = 0.0 if r == 0 else rr.uniform(-0.02, 0.03)
            row.append(bm.verts.new((r * math.cos(ang), r * math.sin(ang), z)))
        grid.append(row)
    for j in range(seg):
        bm.faces.new((grid[0][0], grid[1][j], grid[1][(j + 1) % seg]))
    for i in range(1, len(rings) - 1):
        for j in range(seg):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][(j + 1) % seg], grid[i][(j + 1) % seg]))
    a.emit(bm, Matrix(), 'grass', shade=(1.0, 1.0), jitter=0.06)
    # rocky skirt: a ring of chunky earth blocks under the edge, then an irregular inverted cone
    n = 40
    for i in range(n):
        ang = 2 * math.pi * (i + rr.uniform(-0.15, 0.15)) / n
        rad = ISLAND_R - 0.45
        hgt = rr.uniform(1.1, 1.7)
        box(a, rr.choice(('rock', 'rock2', 'rock')), (math.cos(ang) * rad, math.sin(ang) * rad, -hgt + 0.02),
            (1.9, 1.3, hgt), rot=(rr.uniform(-4, 4), rr.uniform(-4, 4), math.degrees(ang) + 90), bev=0.16, shade=(0.72, 1.0))
    bm = bmesh.new()
    levels = [(ISLAND_R - 0.7, -1.2), (ISLAND_R - 1.9, -2.4), (7.0, -3.4), (4.2, -4.4), (1.6, -5.0)]
    seg2 = 20
    rows = []
    for r, z in levels:
        rows.append([bm.verts.new(((r + rr.uniform(-0.4, 0.4)) * math.cos(2 * math.pi * (j + 0.5 * (len(rows) % 2)) / seg2),
                                   (r + rr.uniform(-0.4, 0.4)) * math.sin(2 * math.pi * (j + 0.5 * (len(rows) % 2)) / seg2),
                                   z + rr.uniform(-0.25, 0.25))) for j in range(seg2)])
    for i in range(len(rows) - 1):
        for j in range(seg2):
            bm.faces.new((rows[i][(j + 1) % seg2], rows[i][j], rows[i + 1][j], rows[i + 1][(j + 1) % seg2]))
    tip = bm.verts.new((0.3, -0.2, -5.6))
    for j in range(seg2):
        bm.faces.new((rows[-1][(j + 1) % seg2], rows[-1][j], tip))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    a.emit(bm, Matrix(), 'rock2', shade=(0.55, 1.0), jitter=0.08)
    # grass lip over the edge
    for i in range(54):
        ang = 2 * math.pi * (i + rr.uniform(-0.3, 0.3)) / 54
        rad = ISLAND_R - 0.15
        blob(a, rr.choice(('grass', 'moss', 'grass_dark')), (math.cos(ang) * rad, math.sin(ang) * rad, -0.14),
             (0.62, 0.4, 0.2), sub=1, lumpy=0.08, seed=300 + i, rot=(0, 0, math.degrees(ang)), shade=(0.85, 1.0))
    # courtyard: earthy grout disc and cobbles, path to the gate
    cx, cy = 0.0, 0.6
    cyl(a, 'grout', (cx, cy, 0.0), 5.7, 0.03, seg=40, bev=0)
    box(a, 'grout', (0, -7.3, 0.0), (2.0, 4.6, 0.03), bev=0)

    def cobble(x, y, w, d, ang, col):
        bm = bmesh.new()
        h = 0.07
        ins = 0.07
        vb = [bm.verts.new((sx * w / 2, sy * d / 2, 0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        vt = [bm.verts.new((sx * (w / 2 - ins), sy * (d / 2 - ins), h)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        bm.faces.new(vt)
        for k in range(4):
            bm.faces.new((vb[k], vb[(k + 1) % 4], vt[(k + 1) % 4], vt[k]))
        a.emit(bm, mat4((x, y, 0.0), (0, 0, ang)), col, shade=(0.85, 1.05), jitter=0.05)

    tones = ('cobble', 'cobble2', 'cobble3', 'cobble')
    cobble(cx, cy, 0.62, 0.62, 0, 'cobble3')
    r = 0.62
    while r < 5.5:
        n = max(6, int(2 * math.pi * r / 0.66))
        off = rr.uniform(0, 1)
        for j in range(n):
            ang = 2 * math.pi * (j + off) / n
            cobble(cx + math.cos(ang) * r, cy + math.sin(ang) * r, 2 * math.pi * r / n - 0.04, 0.58, math.degrees(ang) + 90, rr.choice(tones))
        r += 0.6
    y = -5.0
    while y > -9.5:
        for x in (-0.66, 0.0, 0.66):
            cobble(x + rr.uniform(-0.04, 0.04) + (0.2 if int(-y / 0.6) % 2 else 0), y, 0.62, 0.56, rr.uniform(-4, 4), rr.choice(tones))
        y -= 0.6
    # path stones in front of the gate down to the rim
    for k, yy in enumerate((-10.0, -10.5)):
        for x in (-0.5, 0.3):
            cobble(x + 0.15 * k, yy, 0.64, 0.5, rr.uniform(-8, 8), rr.choice(tones))
    # trees, bushes, boulders and flowers on the rim and against the walls
    for k, deg in enumerate((-62, -42, -6, 32, 48, 84, 100, 128, 166, 188, 218, 234, 304, 322)):
        rad = (WALL_R + ISLAND_R) / 2 + 0.05
        tree(a, math.cos(math.radians(deg)) * rad, math.sin(math.radians(deg)) * rad, s=rr.uniform(0.95, 1.2), seed=500 + k)
    for k, (x, y) in enumerate(((3.8, -4.6), (-2.6, -6.4), (2.7, -6.5), (7.4, -5.0), (-7.6, -4.6), (-1.9, 8.5), (6.9, 6.2))):
        tree(a, x, y, s=0.95, seed=520 + k)
    for k in range(26):
        deg = rr.uniform(240, 300) if k < 10 else rr.uniform(0, 360)
        if 262 < deg < 278:
            continue
        rad = rr.uniform(WALL_R + 0.55, ISLAND_R - 0.35)
        x, y = math.cos(math.radians(deg)) * rad, math.sin(math.radians(deg)) * rad
        if k % 3 == 0:
            blob(a, rr.choice(('stone', 'stone2')), (x, y, 0.08), (0.28, 0.24, 0.2), sub=1, lumpy=0.2, seed=600 + k)
        else:
            bush(a, x, y, s=rr.uniform(0.2, 0.3), seed=620 + k, flowers=rr.choice((None, 'flower_w', 'flower_y', 'lavender')))
    for k in range(28):
        ang = rr.uniform(0, 2 * math.pi)
        rad = rr.uniform(5.9, 8.8)
        x, y = math.cos(ang) * rad, math.sin(ang) * rad
        blob(a, rr.choice(('flower_w', 'flower_y', 'flower_p', 'lavender', 'grass2')), (x, y, 0.03), (0.06, 0.06, 0.05), sub=1, lumpy=0, seed=k)


def _ring_spans():
    """Wall pieces between the structures on the ring: list of (start deg, end deg)."""
    stops = []
    for t in TOWERS:
        stops.append((t % 360, math.degrees(0.9 / WALL_R)))
    stops.append((math.degrees(math.atan2(KEEP_TOWER[1], KEEP_TOWER[0])), math.degrees(1.3 / WALL_R)))
    stops.append((270, math.degrees((GATE_HALF + 0.55) / WALL_R)))
    stops.sort()
    spans = []
    for i in range(len(stops)):
        a0 = stops[i][0] + stops[i][1]
        a1 = stops[(i + 1) % len(stops)][0] - stops[(i + 1) % len(stops)][1]
        if a1 < a0:
            a1 += 360
        spans.append((a0, a1))
    return spans


def build_walls(L):
    ruin, whole = L.l1, L.l23
    seed = 0
    for a0, a1 in _ring_spans():
        n = max(1, round(math.radians(a1 - a0) * WALL_R / 2.3))
        for i in range(n):
            t0 = math.radians(a0 + (a1 - a0) * i / n)
            t1 = math.radians(a0 + (a1 - a0) * (i + 1) / n)
            pa = (math.cos(t0) * WALL_R, math.sin(t0) * WALL_R)
            pb = (math.cos(t1) * WALL_R, math.sin(t1) * WALL_R)
            seed += 1
            wall_segment(whole, pa, pb, broken=False, seed=seed, ivy_p=whole)
            wall_segment(ruin, pa, pb, broken=True, seed=seed + 1000, ivy_p=ruin)
            if seed % 3 == 0:
                mid = Vector(((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, 0))
                inward = -mid.normalized()
                q = mid + inward * 0.9
                rubble(ruin, q.x, q.y, n=4, spread=0.45, seed=seed)
            # banners on the outer face of the front half (visible from the camera)
            mid_deg = math.degrees((t0 + t1) / 2) % 360
            if 200 < mid_deg < 340 and seed % 2 == 0:
                out = Vector((math.cos((t0 + t1) / 2), math.sin((t0 + t1) / 2), 0))
                q = out * (WALL_R + WALL_T / 2 + 0.02)
                banner(L.l3, q.x, q.y, 1.95, w=0.42, h=0.85, rot=mid_deg - 270)
    for k, deg in enumerate(TOWERS):
        x, y = math.cos(math.radians(deg)) * WALL_R, math.sin(math.radians(deg)) * WALL_R
        round_tower(whole, L.l23, x, y, r=0.95, h=3.0, seed=40 + k, ivy_p=whole)
        round_tower(ruin, None, x, y, r=0.95, h=3.0, broken=True, seed=60 + k, ivy_p=ruin)
        # pennant on the tower top and a banner on its camera side
        pennant(L.l3, x, y, 3.25, h=0.85)
        banner(L.l3, x, y - 0.98, 2.4, w=0.38, h=0.8)


def dragon_relief(p, M):
    """Stylised rearing dragon (S-shaped body of overlapping discs, wing, head), raised on a panel facing -Y."""
    pts = []
    for i in range(13):
        t = i / 12
        pts.append((0.17 * math.sin(t * math.pi * 1.7 + 0.4), 0.18 + 1.05 * t, 0.125 - 0.045 * t))
    for k, (x, z, r) in enumerate(pts):
        cyl(p, 'relief', (x, 0, z), r, 0.06, seg=8, rot=(90, 0, 0), bev=0.25, M=M)
    hx, hz = pts[-1][0], pts[-1][1]
    blob(p, 'relief', (hx - 0.02, -0.04, hz + 0.08), (0.12, 0.05, 0.09), sub=1, lumpy=0, M=M)
    box(p, 'relief', (hx - 0.16, -0.06, hz + 0.03), (0.16, 0.06, 0.07), rot=(0, -12, 0), bev=0.3, M=M)
    poly(p, 'relief', [(hx + 0.02, hz + 0.12), (hx + 0.16, hz + 0.3), (hx + 0.08, hz + 0.1)], (0, -0.06, 0), depth=0.05, M=M)
    # wing
    poly(p, 'relief', [(0.05, 0.75), (0.36, 1.08), (0.33, 0.86), (0.4, 0.78), (0.3, 0.7), (0.34, 0.6), (0.12, 0.62)], (0, -0.06, 0), depth=0.05, M=M)
    # tail curl and claws
    for k, (x, z) in enumerate(((-0.08, 0.12), (-0.2, 0.1), (-0.27, 0.18), (-0.24, 0.27))):
        cyl(p, 'relief', (x, 0, z), 0.05, 0.06, seg=8, rot=(90, 0, 0), bev=0.25, M=M)
    box(p, 'relief', (0.18, -0.06, 0.42), (0.12, 0.05, 0.05), rot=(0, 25, 0), bev=0.3, M=M)


def crown_relief(p, M):
    pts = [(-0.3, 0.0), (0.3, 0.0), (0.3, 0.14), (0.38, 0.46), (0.17, 0.26), (0.0, 0.52), (-0.17, 0.26), (-0.38, 0.46), (-0.3, 0.14)]
    poly(p, 'relief', pts, (0, -0.06, 0.62), depth=0.06, M=M)
    for x, z in ((0.38, 0.5), (0.0, 0.56), (-0.38, 0.5)):
        blob(p, 'relief', (x, -0.04, 0.62 + z), (0.05, 0.04, 0.05), sub=1, lumpy=0, M=M)
    box(p, 'stone3', (0, -0.075, 0.66), (0.5, 0.02, 0.05), bev=0, M=M)
    # diamond and leaf ornaments below
    poly(p, 'relief', [(0, 0.2), (0.14, 0.38), (0, 0.56), (-0.14, 0.38)], (0, -0.06, 0.0), depth=0.05, M=M)
    poly(p, 'relief', [(0, 1.32), (0.12, 1.42), (0, 1.52), (-0.12, 1.42)], (0, -0.06, 0.0), depth=0.05, M=M)


def build_gate(L):
    a = L.a
    G = mat4((0, -WALL_R, 0))
    # gatehouse wall between the pillars, with a pointed gateway
    box(a, 'stone', (0, 0, 0), (2 * GATE_HALF - 0.6, 0.95, 2.55), bev=0.04, M=G)
    box(a, 'stone_dark', (0, 0, 0), (2 * GATE_HALF - 0.4, 1.05, 0.3), bev=0.2, M=G)
    box(a, 'stone2', (0, 0, 2.5), (2 * GATE_HALF - 0.5, 1.05, 0.14), bev=0.3, M=G)
    merlons(a, (-GATE_HALF + 0.55, 0), (GATE_HALF - 0.55, 0), 2.62, 0.95, M=G, gap=0.7)
    poly(a, 'stone3', arch_pts(1.42, 1.98, True, n=6), (0, -0.5, 0), depth=0.06, M=G)
    poly(a, 'stone2', arch_pts(1.18, 1.78, True, n=6), (0, -0.53, 0), depth=0.04, M=G)
    poly(a, 'wood', arch_pts(1.08, 1.7, True, n=6), (0, -0.55, 0), depth=0.04, M=G)
    box(a, 'wood_dark', (0, -0.6, 0), (0.03, 0.02, 1.5), bev=0, M=G)
    for z in (0.45, 1.15):
        box(a, 'iron', (0, -0.6, z), (1.0, 0.02, 0.05), bev=0, M=G)
    for sx in (-1, 1):
        blob(a, 'iron2', (sx * 0.14, -0.62, 0.8), (0.05, 0.03, 0.05), sub=1, lumpy=0, M=G)
    # the two engraved pillars: dragon (left), crown (right)
    for sx in (-1, 1):
        P = G @ mat4((sx * GATE_HALF, 0, 0))
        box(a, 'stone_dark', (0, 0, 0), (1.28, 1.28, 0.4), bev=0.15, M=P)
        box(a, 'stone3', (0, 0, 0.32), (1.08, 1.08, 3.2), bev=0.06, M=P)
        box(a, 'stone2', (0, 0, 3.45), (1.26, 1.26, 0.2), bev=0.25, M=P)
        for dx, dy in ((-0.38, -0.38), (0.38, -0.38), (-0.38, 0.38), (0.38, 0.38)):
            box(a, 'stone', (dx, dy, 3.63), (0.36, 0.36, 0.36), bev=0.2, M=P)
        box(a, 'stone2', (0, -0.56, 0.62), (0.82, 0.06, 2.24), bev=0.1, M=P)
        R = P @ mat4((0, -0.56, 0.78))
        if sx < 0:
            dragon_relief(a, R @ mat4((0.02, 0, 0), (0, 0, 0), (1.25, 1, 1.42)))
        else:
            crown_relief(a, R @ mat4((0, 0, 0.12), (0, 0, 0), (1.25, 1, 1.18)))
        ivy(a, sx * 0.62, -0.3, 2.9, n=4, spread=(0.08, 1.4), seed=70 + sx, face=sx * 90, M=P)
        # level 3: banner on the pillar's inner side and a lantern by the gate
        banner(L.l3, sx * (GATE_HALF - 0.95), -WALL_R - 0.5, 2.3, w=0.34, h=0.78)
        lantern_wall(L.l3, sx * (GATE_HALF - 1.05), -WALL_R - 0.48, 1.25)
        lantern_post(L.l3, sx * 1.15, -WALL_R - 1.2, h=1.0)
    for k, (x, y) in enumerate(((-1.2, -8.0), (1.2, -8.0), (-1.2, -6.1), (1.2, -6.1), (-3.6, -2.6), (3.6, -2.4), (-2.6, 3.6), (2.8, 4.4))):
        lantern_post(L.l3, x, y, h=1.0)
    ivy(L.l1, -0.9, -WALL_R - 0.5, 2.4, n=6, spread=(0.4, 1.6), seed=77)
    rubble(L.l1, 1.6, -WALL_R - 1.0, n=5, spread=0.5, seed=78)
    rubble(L.l1, -2.9, -WALL_R + 1.0, n=4, spread=0.4, seed=79)


def build_keep(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    K = mat4((KEEP_HALL[0], KEEP_HALL[1], 0))
    W, D, H = 3.3, 2.3, 2.3
    box(a, 'stone_dark', (0, 0, 0), (W + 0.2, D + 0.2, 0.3), bev=0.2, M=K)
    box(a, 'stone', (0, 0, 0.2), (W, D, H - 0.2), bev=0.04, M=K)
    for sx in (-1, 1):  # corner buttresses
        for sy in (-1, 1):
            box(a, 'stone3', (sx * W / 2, sy * D / 2, 0), (0.42, 0.42, H + 0.25), bev=0.15, M=K)
            box(a, 'stone2', (sx * W / 2, sy * D / 2, H + 0.25), (0.5, 0.5, 0.14), bev=0.25, M=K)
    # front cross gable (pointed) with the big gothic doorway
    poly(a, 'stone3', [(-0.95, 0), (0.95, 0), (0.95, H + 0.1), (0, H + 1.25), (-0.95, H + 0.1)], (0, -D / 2 - 0.25, 0), depth=0.3, M=K)
    stairs(a, 0, -D / 2 - 0.3, 1.5, n=3, M=K)
    poly(a, 'stone2', arch_pts(1.12, 1.9, True, n=6), (0, -D / 2 - 0.28, 0.42), depth=0.04, M=K)
    poly(a, 'shelf', arch_pts(0.92, 1.72, True, n=6), (0, -D / 2 - 0.3, 0.42), depth=0.03, M=K)
    win = K
    for sx in (-1, 1):
        window(a, l23, sx * 1.25, -D / 2, 1.0, w=0.32, h=0.72, M=win)
    window(a, l23, 0, -D / 2 - 0.25, H + 0.35, w=0.22, h=0.42, M=win)
    for sx in (-1, 1):
        ivy(a, sx * 1.62, -D / 2 - 0.22, 2.3, n=5, spread=(0.15, 1.6), seed=90 + sx, M=K)
    # level 2+: glowing hall behind the doorway (books), roof with chimney
    poly(l23, 'glow', arch_pts(0.86, 1.66, True, n=6), (0, -D / 2 - 0.31, 0.42), depth=0.01, glow=True, M=K)
    for z in (0.75, 1.15, 1.5):
        box(l23, 'shelf', (0, -D / 2 - 0.325, z), (0.7, 0.02, 0.04), bev=0, M=K)
        for i in range(6):
            box(l23, ('book_p', 'book_g', 'book_m', 'book_c')[i % 4], (-0.27 + i * 0.11, -D / 2 - 0.33, z + 0.04), (0.08, 0.02, 0.2), bev=0, M=K)
    gable(l23, 'slate', (0, 0, H + 0.02), W + 0.1, D + 0.1, 1.5, accent='terra', seed=3, M=K)
    gable(l23, 'slate', (0, -D / 2 - 0.15, H + 0.08), 2.0, 1.0, 1.15, over=0.12, accent='terra', seed=4, M=K, along='y')
    for sx in (-1, 1):
        gable_wall(l23, 'stone3', (0, 0, H + 0.02), D + 0.1, 1.48, sx * (W / 2 - 0.06), M=K)
    box(l23, 'stone2', (1.0, 0.45, H + 0.6), (0.42, 0.42, 1.4), bev=0.15, M=K)
    box(l23, 'stone', (1.0, 0.45, H + 1.95), (0.5, 0.5, 0.14), bev=0.25, M=K)
    blob(l23, 'gold', (0, -D / 2 - 0.25, H + 1.4), (0.07, 0.07, 0.07), sub=1, lumpy=0, M=K)
    # level 1: roof gone, rafters, broken top, scaffold, tarp, rubble
    rafters(l1, (0, 0, H + 0.02), W - 0.2, D, 1.4, n=5, M=K, skip=(3,))
    box(l1, 'slate', (-0.95, -0.5, H + 0.45), (1.2, 1.25, 0.14), rot=(32, 0, 0), bev=0.25, M=K)
    for i in range(4):
        box(l1, 'stone2', (-1.3 + i * 0.85, 0.9, H), (0.5, 0.4, 0.25 + 0.15 * (i % 2)), bev=0.2, M=K)
    scaffold(l1, 1.7, -0.25, 0.9, 0.7, 3.2, M=K)
    tarp(l1, 0.5, 0.2, H + 1.0, 1.2, 0.8, M=K, rot=(25, 0, 0))
    rubble(l1, -1.4, -D / 2 - 0.8, n=6, spread=0.5, seed=95, M=K)
    rubble(l1, 1.5, -D / 2 - 0.7, n=4, spread=0.4, seed=96, M=K)
    # level 3: banners beside the door, wall lanterns, pennants
    for sx in (-1, 1):
        banner(l3, sx * 0.72, -D / 2 - 0.27, 2.25, w=0.3, h=0.8, M=K)
        lantern_wall(l3, sx * 0.72, -D / 2 - 0.25, 1.15, M=K)
        pennant(l3, sx * W / 2, -D / 2, H + 0.4, h=0.6, M=K)
    # the big round tower
    tx, ty, tr = KEEP_TOWER
    T = mat4((tx, ty, 0))
    th = 4.6
    cyl(a, 'stone_dark', (0, 0, 0), tr * 1.12, 0.45, seg=18, r2=tr * 1.06, M=T, bev=0.15)
    cyl(a, 'stone', (0, 0, 0.35), tr * 1.05, th - 0.35, seg=18, r2=tr, M=T, bev=0.03)
    rr = random.Random(99)
    for i in range(8):
        ang = rr.uniform(math.pi * 1.05, math.pi * 1.95)
        z = rr.uniform(0.6, th - 0.6)
        box(a, rr.choice(('stone3', 'stone2')), (math.cos(ang) * tr * 0.99, math.sin(ang) * tr * 0.99, z), (0.55, 0.24, 0.38),
            rot=(0, 0, math.degrees(ang) + 90), bev=0.2, M=T)
    for i, (ang, z) in enumerate(((-90, 1.4), (-125, 2.9), (-60, 3.0), (-90, 3.6))):
        W2 = T @ mat4((0, 0, 0), (0, 0, ang + 90))
        window(a, l23, 0, -tr * 0.99, z, w=0.3, h=0.6, M=W2)
    door(a, -0.5, -tr * 0.95, 0.35, w=0.5, h=0.85, M=T @ mat4((0, 0, 0), (0, 0, -18)))
    ivy(a, -1.2, -1.0, 4.2, n=7, spread=(0.2, 3.2), seed=101, face=-45, M=T)
    ivy(a, 1.3, -0.9, 4.0, n=6, spread=(0.2, 2.6), seed=102, face=50, M=T)
    # intact top (level 2+) vs broken top (level 1)
    cyl(l23, 'stone2', (0, 0, th - 0.05), tr * 1.14, 0.34, seg=18, M=T, bev=0.2)
    cyl(l23, 'cobble2', (0, 0, th + 0.25), tr * 1.02, 0.04, seg=18, M=T, bev=0)
    for i in range(10):
        ang = 2 * math.pi * (i + 0.5) / 10
        box(l23, 'stone', (math.cos(ang) * tr * 1.02, math.sin(ang) * tr * 1.02, th + 0.27), (0.46, 0.34, 0.44), rot=(0, 0, math.degrees(ang) + 90), bev=0.2, M=T)
    for i in range(7):
        if rr.random() < 0.3:
            continue
        ang = 2 * math.pi * i / 7
        box(l1, 'stone2', (math.cos(ang) * tr * 0.85, math.sin(ang) * tr * 0.85, th - 0.05), (0.6, 0.4, rr.uniform(0.2, 0.55)), rot=(0, 0, math.degrees(ang) + 90), bev=0.2, M=T)
    scaffold(l1, 1.55, 0.2, 0.7, 0.7, th + 0.6, M=T, levels=3)
    scaffold(L.l2, 0, -0.3, 1.9, 1.6, 1.4, M=T @ mat4((0, 0, th + 0.25)), levels=1)
    cone_roof(l3, 0, 0, th + 0.25, tr * 1.08, 2.6, M=T, seg=16, seed=5)
    for ang in (-115, -65):
        W2 = T @ mat4((0, 0, 0), (0, 0, ang + 90))
        banner(l3, 0, -tr * 1.02, th - 0.4, w=0.42, h=1.0, M=W2)


# ------------------------------------------------------------------------------------------------ rooms (origin, front -Y)


def room_convoy(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    W, D, H = 2.8, 1.9, 1.45
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(a, 'stone2', (sx * W / 2, sy * D / 2, 0), (0.42, 0.42, 0.2), bev=0.2)
            box(a, 'stone', (sx * W / 2, sy * D / 2, 0.15), (0.36, 0.36, H - 0.15), bev=0.12)
    box(a, 'wood_dark', (0, D / 2, 0), (W - 0.3, 0.14, H), bev=0.06)
    for x in (-0.55, 0.55):
        box(a, 'wood', (x, -D / 2, 0), (0.14, 0.14, H), bev=0.15)
    beam(a, 'wood', (-W / 2, -D / 2, H - 0.05), (W / 2, -D / 2, H - 0.05), t=0.16)
    beam(a, 'wood', (-W / 2, D / 2, H - 0.05), (W / 2, D / 2, H - 0.05), t=0.14)
    box(a, 'cobble2', (0, 0, 0), (W - 0.2, D - 0.2, 0.05), bev=0)
    # the covered wagon inside
    Wg = mat4((-0.15, 0.05, 0), (0, 0, 8))
    box(a, 'wood', (0, 0, 0.32), (1.25, 0.66, 0.3), bev=0.1, M=Wg)
    cyl(a, 'canvas', (-0.6, 0, 0.6), 0.36, 1.2, seg=10, rot=(0, 90, 0), bev=0.05, M=Wg)
    for x in (-0.42, 0.42):
        for y in (-0.36, 0.36):
            cyl(a, 'wood_dark', (x, y - 0.04 * (1 if y > 0 else -1), 0.24), 0.24, 0.08, seg=10, rot=(90, 0, 0), bev=0.2, M=Wg)
            cyl(a, 'iron', (x, y * 1.12, 0.24), 0.06, 0.06, seg=6, rot=(90, 0, 0), bev=0, M=Wg)
    beam(a, 'wood', (-0.62, 0, 0.3), (-1.1, -0.15, 0.12), t=0.05, M=Wg)
    barrel(a, 1.05, 0.35)
    crate(a, 1.0, -0.25, 0.32, rot=12)
    # level 1: rafters with a few slates, tarp, rubble, scaffold
    rafters(l1, (0, 0, H + 0.05), W, D + 0.2, 0.9, n=5, skip=(1,))
    box(l1, 'slate', (0.8, 0.45, H + 0.42), (1.1, 1.0, 0.12), rot=(-30, 0, 0), bev=0.25)
    tarp(l1, -0.6, -D / 2 - 0.05, H + 0.1, 1.0, 0.75, rot=(15, 0, 4))
    rubble(l1, -1.2, -1.25, n=5, spread=0.4, seed=1)
    rubble(l1, 1.3, 0.1, n=3, spread=0.3, seed=2)
    box(l1, 'stone2', (W / 2 + 0.2, -D / 2 - 0.1, 0), (0.36, 0.36, 0.3), rot=(70, 0, 20), bev=0.15)
    # level 2+: slate roof
    gable(l23, 'slate', (0, 0, H + 0.05), W + 0.1, D + 0.25, 0.95, accent='terra', seed=11)
    for sx in (-1, 1):
        gable_wall(l23, 'wood', (0, 0, H + 0.05), D + 0.2, 0.93, sx * (W / 2 - 0.02))
        blob(l23, 'gold', (sx * (W / 2 + 0.15), 0, H + 1.12), (0.06, 0.06, 0.06), sub=1, lumpy=0)
    # level 3: banners on the front pillars, lanterns, more goods
    for sx in (-1, 1):
        banner(l3, sx * W / 2, -D / 2 - 0.2, H - 0.12, w=0.28, h=0.7)
    lantern_wall(l3, -0.55, -D / 2 - 0.05, H - 0.4)
    lantern_wall(l3, 0.55, -D / 2 - 0.05, H - 0.4)
    barrel(l3, -1.6, -0.9)
    crate(l3, 1.65, -0.95, 0.3, rot=-10)
    crate(l3, 1.65, -0.95, 0.24, rot=20, z=0.3)
    sack(l3, 1.25, -1.15, seed=3)
    sack(l3, -1.3, -1.2, seed=4)


def room_merchant(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    W, D, H = 2.3, 1.3, 1.5
    box(a, 'stone_dark', (0, 0.25, 0), (W + 0.15, D + 0.15, 0.22), bev=0.2)
    box(a, 'stone', (0, 0.25, 0.15), (W, D, H - 0.15), bev=0.05)
    for sx in (-1, 1):
        box(a, 'stone3', (sx * W / 2, -0.4, 0), (0.34, 0.34, H + 0.2), bev=0.15)
    box(a, 'wood_dark', (0, -0.41, 0.0), (W - 0.5, 0.06, 1.1), bev=0)
    box(a, 'stone2', (-0.85, 0.25, H), (0.38, 0.38, 1.25), bev=0.15)
    # counter
    box(a, 'wood', (0, -0.62, 0), (W - 0.3, 0.42, 0.6), bev=0.08)
    box(a, 'wood_light', (0, -0.62, 0.58), (W - 0.2, 0.5, 0.06), bev=0.2)
    barrel(a, W / 2 + 0.3, -0.6)
    barrel(a, -W / 2 - 0.3, -0.45, r=0.15, h=0.3)
    ivy(a, -W / 2 - 0.15, -0.55, H + 0.1, n=4, spread=(0.06, 1.0), seed=5, face=-90)
    # level 1
    for i, (x, droop) in enumerate(((-0.6, 30), (0.45, 55))):
        tarp(l1, x, -0.42, 1.55, 0.7, 0.55, rot=(droop, 0, 0), col='canvas2')
    rafters(l1, (0, 0.25, H), W, D + 0.2, 0.8, n=4, skip=(2,))
    scaffold(l1, W / 2 + 0.05, 0.25, 0.5, 1.2, 2.0)
    rubble(l1, -0.4, -1.2, n=5, spread=0.5, seed=6)
    # level 2+: roof, striped awning, window, goods, hanging sign
    gable(l23, 'slate', (0, 0.25, H), W + 0.1, D + 0.3, 0.85, accent='terra', seed=12)
    for sx in (-1, 1):
        gable_wall(l23, 'stone3', (0, 0.25, H), D + 0.2, 0.84, sx * (W / 2 - 0.05))
    n = 7
    for i in range(n):
        x = -W / 2 + 0.1 + (W - 0.2) * (i + 0.5) / n
        box(l23, 'banner' if i % 2 == 0 else 'cream', (x, -0.8, 1.2), ((W - 0.2) / n + 0.01, 0.8, 0.06), rot=(-22, 0, 0), bev=0.1)
        poly(l23, 'banner' if i % 2 == 0 else 'cream', [(-(W - 0.2) / n / 2, 0), ((W - 0.2) / n / 2, 0), (0, -0.14)], (x, -1.17, 1.06), depth=0.04)
    for i in range(8):
        x = -0.85 + i * 0.24
        blob(l23, ('fruit_o', 'fruit_g', 'fruit_y', 'fruit_o')[i % 4], (x, -0.62, 0.7), (0.09, 0.09, 0.08), sub=1, lumpy=0.05, seed=i)
    crate(l23, 0.75, -0.6, 0.2, z=0.64)
    S = mat4((W / 2 + 0.25, -0.35, 1.6))
    box(l23, 'iron', (0, 0, 0), (0.5, 0.04, 0.04), bev=0, M=S)
    box(l23, 'wood', (0.12, 0, -0.42), (0.36, 0.06, 0.32), bev=0.12, M=S)
    blob(l23, 'gold', (0.12, -0.04, -0.27), (0.07, 0.02, 0.07), sub=1, lumpy=0, M=S)
    # level 3
    lantern_wall(l3, -W / 2 + 0.15, -0.6, 1.05)
    lantern_wall(l3, W / 2 - 0.15, -0.6, 1.05)
    pennant(l3, -0.85, 0.25, H + 1.25, h=0.6)
    crate(l3, -W / 2 - 0.3, -0.95, 0.3, rot=15)
    sack(l3, W / 2 + 0.2, -1.05, seed=7)
    barrel(l3, W / 2 + 0.55, -0.15)


def room_smith(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    W, D, H = 2.6, 1.8, 1.4
    box(a, 'cobble2', (0, 0, 0), (W - 0.2, D - 0.2, 0.05), bev=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(a, 'stone', (sx * W / 2, sy * D / 2, 0), (0.36, 0.36, H), bev=0.12)
    box(a, 'stone', (0, D / 2, 0), (W - 0.3, 0.3, H), bev=0.05)
    # hearth with arched opening and the big chimney
    box(a, 'stone3', (-0.2, D / 2 - 0.45, 0), (1.1, 0.7, 0.95), bev=0.08)
    poly(a, 'stone_dark', arch_pts(0.55, 0.55, False), (-0.2, D / 2 - 0.82, 0.12), depth=0.04)
    box(a, 'stone2', (0.95, D / 2 - 0.05, 0), (0.62, 0.62, 3.0), bev=0.1)
    box(a, 'stone', (0.95, D / 2 - 0.05, 3.0), (0.72, 0.72, 0.16), bev=0.25)
    # anvil on a stump, firewood, barrel, tools on the wall
    cyl(a, 'wood', (-0.55, -0.55, 0), 0.2, 0.38, seg=9, bev=0.1)
    box(a, 'iron', (-0.55, -0.55, 0.38), (0.22, 0.14, 0.14), bev=0.15)
    box(a, 'iron2', (-0.55, -0.55, 0.5), (0.46, 0.18, 0.08), bev=0.2)
    cone(a, 'iron2', (-0.32, -0.55, 0.54), 0.08, 0.16, seg=4, rot=(0, 90, 0))
    for i in range(6):
        cyl(a, 'wood_light', (W / 2 - 0.55 + (i % 3) * 0.15, -0.6, 0.08 + (i // 3) * 0.15), 0.07, 0.5, seg=6, rot=(90, 0, 0), bev=0.1)
    barrel(a, W / 2 + 0.25, -0.7)
    for i in range(3):
        box(a, 'iron', (-0.95 + i * 0.25, D / 2 - 0.16, 0.9), (0.05, 0.03, 0.35), bev=0)
    ivy(a, W / 2 + 0.2, D / 2 - 0.2, H, n=3, spread=(0.05, 0.9), seed=13, face=90)
    # level 1
    rafters(l1, (0, 0, H), W, D + 0.2, 0.85, n=4, skip=(1,))
    tarp(l1, 0.2, -D / 2, H + 0.1, 1.2, 0.6, rot=(20, 0, -5), col='canvas2')
    scaffold(l1, 0.95, D / 2 - 0.05, 0.85, 0.85, 3.1)
    rubble(l1, 0.6, -1.25, n=5, spread=0.45, seed=14)
    poly(l1, 'wood_dark', arch_pts(0.42, 0.42, False), (-0.2, D / 2 - 0.84, 0.15), depth=0.02)
    # level 2+: terracotta roof, glowing hearth
    gable(l23, 'terra', (0, 0, H), W + 0.1, D + 0.25, 0.9, accent='terra2', seed=13, ridge='terra2')
    for sx in (-1, 1):
        gable_wall(l23, 'wood', (0, 0, H), D + 0.2, 0.88, sx * (W / 2 - 0.03))
    poly(l23, 'fire', arch_pts(0.44, 0.44, False), (-0.2, D / 2 - 0.85, 0.14), depth=0.02, glow=True)
    blob(l23, 'fire2', (-0.2, D / 2 - 0.7, 0.2), (0.16, 0.08, 0.12), sub=1, lumpy=0.2, glow=True)
    # level 3
    banner(l3, -W / 2, -D / 2 - 0.2, H - 0.1, w=0.28, h=0.66)
    lantern_wall(l3, 0.3, -D / 2 - 0.05, H - 0.3)
    lantern_post(l3, -W / 2 - 0.35, -D / 2 - 0.2, h=1.0)
    crate(l3, -W / 2 - 0.25, 0.4, 0.3, rot=8)


def room_healer(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    C = mat4((0.55, 0.2, 0))
    W, D, H = 1.7, 1.4, 1.3
    box(a, 'stone_dark', (0, 0, 0), (W + 0.12, D + 0.12, 0.2), bev=0.2, M=C)
    box(a, 'stone', (0, 0, 0.12), (W, D, H - 0.12), bev=0.05, M=C)
    box(a, 'stone2', (-0.5, 0.25, H), (0.34, 0.34, 1.2), bev=0.15, M=C)
    door(a, 0, -D / 2, 0.12, w=0.4, h=0.66, pointed=False, M=C)
    round_window(a, l23, 0, -D / 2, 1.05, r=0.15, M=C)
    stairs(a, 0, -D / 2 - 0.02, 0.62, n=1, step=0.12, M=C)
    ivy(a, W / 2 + 0.02, -D / 2 + 0.05, H, n=4, spread=(0.05, 1.0), seed=15, face=90, M=C)
    # herb garden on the left
    G = mat4((-1.1, -0.15, 0))
    box(a, 'soil', (0, 0, 0), (1.3, 1.2, 0.1), bev=0.1, M=G)
    pts = [(-0.7, -0.65), (-0.25, -0.65), (0.25, -0.65), (0.7, -0.65), (0.7, 0.0), (0.7, 0.62)]
    fence(a, pts, M=G, h=0.36)
    fence(a, [(-0.7, -0.65), (-0.7, 0.0), (-0.7, 0.62)], M=G, h=0.36)
    # level 1: weeds, broken roof, tarp
    for i in range(5):
        blob(l1, 'grass_dark', (-1.5 + (i % 3) * 0.35, -0.5 + (i // 3) * 0.5, 0.12), (0.12, 0.1, 0.08), sub=1, lumpy=0.3, seed=i)
    rafters(l1, (0, 0, H), W, D + 0.2, 0.85, n=4, M=C, skip=(2,))
    box(l1, 'slate', (-0.35, -0.35, H + 0.35), (0.9, 0.9, 0.12), rot=(36, 0, 0), bev=0.25, M=C)
    tarp(l1, 0.35, -0.25, H + 0.65, 0.8, 0.6, M=C, rot=(40, 0, 0))
    rubble(l1, 0.6, -1.0, n=4, spread=0.35, seed=16, M=C)
    # level 2+: roof, planted herbs and lavender
    gable(l23, 'slate', (0, 0, H), W + 0.1, D + 0.25, 0.95, accent='terra', seed=14, M=C)
    for sx in (-1, 1):
        gable_wall(l23, 'stone3', (0, 0, H), D + 0.2, 0.94, sx * (W / 2 - 0.05), M=C)
    for i in range(3):
        for j in range(3):
            x, y = -0.42 + i * 0.42, -0.38 + j * 0.38
            if (i + j) % 2:
                blob(l23, 'herb', (x, y, 0.15), (0.13, 0.12, 0.1), sub=1, lumpy=0.2, seed=20 + i * 3 + j, M=G)
            else:
                blob(l23, 'leaf_dark', (x, y, 0.13), (0.1, 0.1, 0.08), sub=1, lumpy=0.2, seed=30 + i * 3 + j, M=G)
                for k in range(3):
                    cone(l23, 'lavender', (x - 0.05 + k * 0.05, y, 0.16), 0.04, 0.24, seg=4, M=G)
    # level 3: lanterns, flower box, sacks of herbs
    lantern_wall(l3, -0.34, -D / 2, 0.75, M=C)
    lantern_wall(l3, 0.34, -D / 2, 0.75, M=C)
    box(l3, 'wood', (0, -D / 2 - 0.1, 0.84), (0.4, 0.12, 0.1), bev=0.15, M=C)
    for k in range(4):
        blob(l3, ('flower_p', 'flower_w', 'flower_y', 'flower_p')[k], (-0.15 + k * 0.1, -D / 2 - 0.1, 0.97), (0.06, 0.05, 0.05), sub=1, lumpy=0, M=C)
    barrel(l3, W / 2 + 0.25, -0.5, M=C)
    bush(l3, W / 2 + 0.2, 0.55, s=0.22, seed=17, flowers='flower_p', M=C)


def room_tavern(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    W, D = 2.5, 1.5
    H1, H2 = 1.05, 0.85
    box(a, 'stone_dark', (0, 0, 0), (W + 0.12, D + 0.12, 0.2), bev=0.2)
    box(a, 'stone', (0, 0, 0.12), (W, D, H1 - 0.12), bev=0.05)
    door(a, 0, -D / 2, 0.12, w=0.44, h=0.72, pointed=False)
    for sx in (-1, 1):
        window(a, l23, sx * 0.75, -D / 2, 0.42, w=0.32, h=0.34, pointed=False)
    box(a, 'stone2', (-W / 2 + 0.2, 0.3, 0), (0.48, 0.48, H1 + H2 + 1.35), bev=0.12)
    barrel(a, -0.55, -D / 2 - 0.3)
    barrel(a, 0.55, -D / 2 - 0.3, r=0.15, h=0.3)
    box(a, 'wood', (1.05, -D / 2 - 0.25, 0), (0.6, 0.2, 0.22), bev=0.15)
    ivy(a, -W / 2 - 0.02, -D / 2 + 0.1, H1, n=3, spread=(0.05, 0.8), seed=18, face=-90)
    # level 1: upper floor only as a frame, tarps, scaffold, rubble
    for sx in (-1, 0, 1):
        beam(l1, 'wood_dark', (sx * (W / 2 - 0.1), -D / 2 + 0.05, H1), (sx * (W / 2 - 0.1), -D / 2 + 0.05, H1 + H2), t=0.1)
    beam(l1, 'wood_dark', (-W / 2, -D / 2 + 0.05, H1 + H2), (W / 2 * 0.3, -D / 2 + 0.05, H1 + H2), t=0.1)
    box(l1, 'plaster', (-0.7, 0, H1), (1.0, D - 0.1, H2 * 0.7), bev=0.04)
    tarp(l1, 0.6, -D / 2 - 0.02, H1 + H2, 1.0, 0.8, rot=(8, 0, 0))
    rafters(l1, (0, 0, H1 + H2), W, D + 0.2, 0.95, n=4, skip=(2,))
    scaffold(l1, W / 2 + 0.1, 0, 0.5, 1.3, 2.3)
    rubble(l1, 1.2, -1.2, n=4, spread=0.35, seed=19)
    # level 2+: timber-framed upper floor, terracotta roof with dormers, hanging sign
    box(l23, 'plaster', (0, 0, H1), (W + 0.08, D + 0.08, H2), bev=0.04)
    for x in (-W / 2, -0.4, 0.4, W / 2):
        box(l23, 'wood_dark', (x, -D / 2 - 0.06, H1), (0.1, 0.06, H2), bev=0.1)
    box(l23, 'wood_dark', (0, -D / 2 - 0.06, H1), (W + 0.12, 0.08, 0.1), bev=0.1)
    beam(l23, 'wood_dark', (-0.4, -D / 2 - 0.07, H1 + 0.05), (-W / 2 + 0.05, -D / 2 - 0.07, H1 + H2 - 0.05), t=0.07)
    beam(l23, 'wood_dark', (0.4, -D / 2 - 0.07, H1 + 0.05), (W / 2 - 0.05, -D / 2 - 0.07, H1 + H2 - 0.05), t=0.07)
    for x in (-0.8, 0.0, 0.8):
        window(l23, l23, x, -D / 2 - 0.04, H1 + 0.25, w=0.28, h=0.34, pointed=False, frame='wood_dark')
    gable(l23, 'terra', (0, 0, H1 + H2), W + 0.1, D + 0.25, 1.05, accent='terra2', seed=15, ridge='terra2')
    for sx in (-1, 1):
        gable_wall(l23, 'plaster', (0, 0, H1 + H2), D + 0.2, 1.03, sx * (W / 2 - 0.03))
    for x in (-0.55, 0.55):
        box(l23, 'plaster', (x, -0.45, H1 + H2 + 0.05), (0.42, 0.5, 0.42), bev=0.06)
        gable(l23, 'terra', (x, -0.45, H1 + H2 + 0.47), 0.5, 0.56, 0.3, over=0.06, thick=0.08, accent=None, along='y', ridge='terra2')
        window(l23, l23, x, -0.71, H1 + H2 + 0.12, w=0.18, h=0.22, pointed=False, frame='wood_dark')
    S = mat4((W / 2 + 0.05, -D / 2 + 0.2, H1 + 0.5))
    box(l23, 'iron', (0.2, 0, 0), (0.5, 0.04, 0.04), bev=0, M=S)
    box(l23, 'wood', (0.3, 0, -0.42), (0.36, 0.06, 0.34), bev=0.12, M=S)
    cyl(l23, 'cream', (0.3, -0.05, -0.36), 0.07, 0.17, seg=8, rot=(0, 0, 0), M=S)
    # level 3
    lantern_wall(l3, -0.38, -D / 2, 0.7)
    lantern_wall(l3, 0.38, -D / 2, 0.7)
    banner(l3, -W / 2 - 0.02, -D / 2 - 0.02, H1 + H2 - 0.05, w=0.3, h=0.7, rot=0)
    bush(l3, W / 2 + 0.3, -0.35, s=0.2, seed=21, flowers='flower_y')


def room_campfire(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    rr = random.Random(22)
    # fire ring (always), fire (small at level 1)
    for i in range(10):
        ang = 2 * math.pi * i / 10
        box(a, rr.choice(('stone', 'stone2', 'stone3')), (math.cos(ang) * 0.48, math.sin(ang) * 0.48, 0), (0.28, 0.22, 0.2),
            rot=(0, 0, math.degrees(ang) + 90), bev=0.3)
    cyl(a, 'iron', (0, 0, 0), 0.38, 0.04, seg=10, bev=0)
    for k in range(3):
        beam(a, 'wood_dark', (math.cos(k * 2.1) * 0.3, math.sin(k * 2.1) * 0.3, 0.04), (math.cos(k * 2.1 + 3) * 0.25, math.sin(k * 2.1 + 3) * 0.25, 0.14), t=0.09)
    cone(l1, 'fire', (0, 0, 0.05), 0.14, 0.32, seg=6, glow=True)
    cone(l1, 'fire2', (0.02, -0.03, 0.05), 0.08, 0.22, seg=5, glow=True)
    cone(l23, 'fire', (0, 0, 0.05), 0.26, 0.62, seg=7, glow=True)
    cone(l23, 'fire', (0.14, 0.08, 0.05), 0.15, 0.42, seg=6, glow=True)
    cone(l23, 'fire', (-0.13, 0.06, 0.05), 0.14, 0.38, seg=6, glow=True)
    cone(l23, 'fire2', (0.0, -0.05, 0.05), 0.15, 0.45, seg=6, glow=True)
    # level 1: one log, scattered stones
    cyl(l1, 'wood', (-0.6, 0.85, 0.15), 0.15, 0.9, seg=8, rot=(0, 90, 15), bev=0.15)
    rubble(l1, 0.9, 0.2, n=4, spread=0.4, seed=23)
    rubble(l1, -0.7, -0.6, n=3, spread=0.3, seed=24)
    # level 2+: three log benches
    for k, ang in enumerate((90, 210, 330)):
        rad = math.radians(ang)
        x, y = math.cos(rad) * 1.05, math.sin(rad) * 1.05
        R = mat4((x, y, 0), (0, 0, ang + 90))
        cyl(l23, 'wood', (-0.45, 0, 0.17), 0.17, 0.9, seg=8, rot=(0, 90, 0), bev=0.15, M=R)
        cyl(l23, 'wood_light', (-0.46, 0, 0.17), 0.13, 0.02, seg=8, rot=(0, 90, 0), bev=0, M=R)
        cyl(l23, 'wood_light', (0.45, 0, 0.17), 0.13, 0.02, seg=8, rot=(0, 90, 0), bev=0, M=R)
    # level 3: tripod with a pot, firewood stack, lanterns
    for k in range(3):
        ang = 2 * math.pi * k / 3 + 0.4
        beam(l3, 'wood_dark', (math.cos(ang) * 0.6, math.sin(ang) * 0.6, 0), (0, 0, 1.2), t=0.06)
    beam(l3, 'iron', (0, 0, 1.2), (0, 0, 0.82), t=0.02)
    blob(l3, 'pot', (0, 0, 0.72), (0.2, 0.2, 0.16), sub=1, lumpy=0)
    for i in range(6):
        cyl(l3, 'wood_light', (-1.55 + (i % 3) * 0.16, 0.25, 0.08 + (i // 3) * 0.15), 0.075, 0.45, seg=6, rot=(90, 0, 0), bev=0.1)
    lantern_post(l3, 1.5, 0.6)
    lantern_post(l3, -1.3, -0.9)


def room_memorial(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    W, D, H = 1.7, 2.0, 1.45
    B = mat4((0, 0.35, 0))
    box(a, 'stone_dark', (0, 0, 0), (W + 0.12, D + 0.12, 0.2), bev=0.2, M=B)
    box(a, 'stone', (0, 0, 0.12), (W, D, H - 0.12), bev=0.05, M=B)
    for sx in (-1, 1):
        box(a, 'stone3', (sx * W / 2, -D / 2, 0), (0.3, 0.3, H + 0.1), bev=0.15, M=B)
    poly(a, 'stone3', [(-W / 2, 0), (W / 2, 0), (0, 1.05)], (0, -D / 2 - 0.02, H), depth=0.14, M=B)
    door(a, 0, -D / 2, 0.12, w=0.42, h=0.75, M=B)
    round_window(a, l23, 0, -D / 2 - 0.02, H + 0.35, r=0.2, M=B)
    for y in (-0.3, 0.45):
        W2 = B @ mat4((W / 2, y, 0), (0, 0, 90))
        window(a, l23, 0, 0, 0.75, w=0.22, h=0.44, M=W2)
    # bell gable on the front (no cross)
    G = B @ mat4((0, -D / 2 - 0.08, H + 1.0))
    for sx in (-1, 1):
        box(a, 'stone3', (sx * 0.17, 0, 0), (0.1, 0.18, 0.42), bev=0.15, M=G)
    poly(a, 'stone3', arch_pts(0.44, 0.24, True, n=3), (0, -0.09, 0.4), depth=0.18, M=G)
    blob(a, 'gold', (0, 0, 0.82), (0.06, 0.06, 0.06), sub=1, lumpy=0, M=G)
    cypress(a, -W / 2 - 0.35, -0.5, s=1.1, seed=25)
    cypress(a, W / 2 + 0.35, -0.5, s=1.0, seed=26)
    ivy(a, -W / 2 - 0.02, -D / 2 + 0.4, H, n=3, spread=(0.05, 0.9), seed=27, face=-90, M=B)

    def grave(p, x, y, tilt=0, col='stone2'):
        R = mat4((x, y, 0), (tilt, 0, 0))
        box(p, col, (0, 0, 0), (0.24, 0.1, 0.28), bev=0.15, M=R)
        cyl(p, col, (0, -0.05, 0.28), 0.12, 0.1, seg=10, rot=(-90, 0, 0), bev=0.2, M=R)
        box(p, 'stone_dark', (0, -0.055, 0.12), (0.12, 0.01, 0.14), bev=0, M=R)

    for k, x in enumerate((-0.9, 0.9, -0.5)):
        grave(l1, x, -1.15 - 0.05 * k, tilt=(-14, 10, 18)[k])
    rafters(l1, (0, 0.35, H), D, W + 0.2, 0.95, n=4, along='y', skip=(1,))
    scaffold(l1, W / 2 + 0.25, 0.4, 0.5, 1.4, 2.4)
    tarp(l1, -0.3, 0.3, H + 0.8, 0.9, 0.7, rot=(70, 0, 90))
    rubble(l1, -0.6, -1.5, n=5, spread=0.45, seed=28)
    # level 2+: roof along Y, tidy row of graves
    gable(l23, 'slate', (0, 0.35, H), D + 0.15, W + 0.25, 1.0, accent='terra', seed=16, along='y')
    for k, x in enumerate((-1.05, -0.58, 0.58, 1.05, -0.12)):
        grave(l23, x, -1.2 if k < 4 else -1.65, col=('stone2', 'stone3')[k % 2])
    # level 3: candles at the graves, lanterns
    for k, x in enumerate((-1.05, -0.58, 0.58, 1.05, -0.12)):
        for dx in (-0.1, 0.1):
            y = (-1.2 if k < 4 else -1.65) - 0.15
            cyl(l3, 'cream', (x + dx, y, 0), 0.03, 0.08 + 0.03 * (k % 2), seg=6, bev=0)
            blob(l3, 'glow2', (x + dx, y, 0.12 + 0.03 * (k % 2)), (0.025, 0.025, 0.04), sub=1, lumpy=0, glow=True)
    lantern_wall(l3, -0.34, -D / 2 + 0.35, 0.85)
    lantern_wall(l3, 0.34, -D / 2 + 0.35, 0.85)


def room_enchanter(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    r, h = 0.55, 2.5
    cyl(a, 'stone_dark', (0, 0, 0), r * 1.2, 0.3, seg=12, r2=r * 1.1, bev=0.15)
    cyl(a, 'stone3', (0, 0, 0.2), r * 1.04, h - 0.2, seg=12, r2=r * 0.96, bev=0.03)
    door(a, 0, -r * 0.98, 0.2, w=0.34, h=0.6, pointed=False)
    for z, ang in ((1.25, 0), (1.95, -30)):
        window(a, l23, 0, -r * 0.97, z, w=0.16, h=0.3, M=mat4((0, 0, 0), (0, 0, ang)))
    ivy(a, r * 0.9, -0.3, 2.1, n=4, spread=(0.08, 1.6), seed=29, face=60)
    # rune circle in front (dull stone at level 1-2, glowing at level 3)
    C = mat4((0.75, -1.05, 0))
    cyl(a, 'stone2', (0, 0, 0), 0.72, 0.05, seg=16, bev=0.2, M=C)
    cyl(a, 'stone3', (0, 0, 0.05), 0.5, 0.04, seg=16, bev=0.2, M=C)
    rr = random.Random(30)
    for i in range(6):
        ang = 2 * math.pi * i / 6
        box(a, 'stone', (math.cos(ang) * 0.85, math.sin(ang) * 0.85, 0), (0.16, 0.16, 0.22 + rr.uniform(0, 0.12)), rot=(0, 0, math.degrees(ang)), bev=0.25, M=C)
    # level 1: broken top, scaffold, tarp
    for i in range(5):
        ang = 2 * math.pi * i / 5
        box(l1, 'stone2', (math.cos(ang) * r * 0.8, math.sin(ang) * r * 0.8, h - 0.05), (0.3, 0.24, 0.15 + 0.12 * (i % 2)), rot=(0, 0, math.degrees(ang)), bev=0.2)
    scaffold(l1, 0.05, 0.0, 1.4, 1.4, 2.9, levels=3)
    tarp(l1, 0.0, -r - 0.1, 2.2, 0.7, 0.9, rot=(8, 0, 0))
    rubble(l1, 0.5, -1.5, n=4, spread=0.3, seed=31)
    # level 2+: balcony, conical roof, dim rune ring
    B = mat4((-r - 0.05, 0, 1.55))
    cyl(l23, 'wood', (0, 0, 0), 0.38, 0.08, seg=8, bev=0.15, M=B)
    for i in range(5):
        ang = math.pi * 0.5 + math.pi * i / 4
        beam(l23, 'wood_dark', (math.cos(ang) * 0.34, math.sin(ang) * 0.34, 0.06), (math.cos(ang) * 0.34, math.sin(ang) * 0.34, 0.36), t=0.04, M=B)
    beam(l23, 'wood_dark', (0, 0.34, 0.36), (-0.34, 0, 0.36), t=0.05, M=B)
    beam(l23, 'wood_dark', (-0.34, 0, 0.36), (0, -0.34, 0.36), t=0.05, M=B)
    beam(l23, 'wood_dark', (0.0, 0.0, -0.05), (0.25, 0, -0.35), t=0.05, M=B)
    cone_roof(l23, 0, 0, h, r * 1.3, 1.25, seg=12, seed=8, flag=False)
    cyl(l23, 'rune2', (0, 0, 0.05), 0.62, 0.03, seg=16, bev=0, M=C)
    cyl(l23, 'stone3', (0, 0, 0.05), 0.5, 0.045, seg=16, bev=0.2, M=C)
    # level 3: glowing runes on the circle and the tower, lanterns, pennant
    cyl(l3, 'rune', (0, 0, 0.055), 0.61, 0.035, seg=16, bev=0, glow=True, M=C)
    cyl(l3, 'stone3', (0, 0, 0.055), 0.5, 0.046, seg=16, bev=0.2, M=C)
    star = []
    for i in range(10):
        ang = math.pi / 2 + math.pi * i / 5
        rad = 0.36 if i % 2 == 0 else 0.15
        star.append((math.cos(ang) * rad, math.sin(ang) * rad))
    poly(l3, 'rune2', star, (0, 0.0, 0.11), depth=0.012, rot=(-90, 0, 0), glow=True, M=C)
    for z, ang in ((0.75, -20), (1.6, 25)):
        R = mat4((0, 0, 0), (0, 0, ang))
        poly(l3, 'rune', disc_pts(0.09, 8), (0, -r * 1.0 - 0.01, z), depth=0.02, glow=True, M=R)
        poly(l3, 'rune2', disc_pts(0.04, 6), (0, -r * 1.0 - 0.025, z), depth=0.012, glow=True, M=R)
    pennant(l3, 0, 0, h + 1.3, h=0.5)
    lantern_wall(l3, 0.28, -r * 0.92, 0.95)


def room_academy(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    W, D, H = 2.8, 1.7, 1.6
    box(a, 'stone_dark', (0, 0, 0), (W + 0.12, D + 0.12, 0.22), bev=0.2)
    box(a, 'stone', (0, 0, 0.15), (W, D, H - 0.15), bev=0.05)
    for sx in (-1, 1):
        box(a, 'stone3', (sx * W / 2, -D / 2, 0), (0.3, 0.3, H + 0.2), bev=0.15)
        cone(a, 'stone3', (sx * W / 2, -D / 2, H + 0.2), 0.14, 0.32, seg=4, rot=(0, 0, 45))
    poly(a, 'stone3', [(-0.6, 0), (0.6, 0), (0.6, H + 0.1), (0, H + 1.1), (-0.6, H + 0.1)], (0, -D / 2 - 0.18, 0), depth=0.2)
    door(a, 0, -D / 2 - 0.18, 0.15, w=0.44, h=0.78)
    stairs(a, 0, -D / 2 - 0.2, 0.8, n=2, step=0.08)
    for sx in (-1, 1):
        for x in (0.95, ):
            window(a, l23, sx * x, -D / 2, 0.45, w=0.3, h=0.85)
    window(a, l23, 0, -D / 2 - 0.18, H - 0.38, w=0.36, h=0.8)
    # turret at the right-back corner
    T = mat4((W / 2 - 0.15, D / 2 - 0.1, 0))
    cyl(a, 'stone3', (0, 0, 0), 0.38, H + 0.9, seg=10, bev=0.03, M=T)
    window(a, l23, 0, -0.37, H + 0.35, w=0.13, h=0.24, M=T)
    cypress(a, -W / 2 - 0.3, -0.2, s=1.15, seed=32)
    ivy(a, 0.55, -D / 2 - 0.02, H, n=4, spread=(0.08, 1.2), seed=33)
    # level 1
    rafters(l1, (0, 0, H), W, D + 0.2, 1.1, n=5, skip=(1, 3))
    tarp(l1, -0.6, -D / 2 - 0.05, H + 0.6, 0.9, 0.7, rot=(18, 0, 0))
    tarp(l1, 0.8, -0.2, H + 0.85, 0.8, 0.6, rot=(55, 0, 0))
    scaffold(l1, -W / 2 + 0.3, 0, 0.6, 1.5, 2.4)
    rubble(l1, 0.9, -1.25, n=5, spread=0.45, seed=34)
    for i in range(3):
        box(l1, ('book_p', 'book_g', 'book_m')[i], (-0.9 + i * 0.25, -1.2, 0.0), (0.2, 0.14, 0.06), rot=(0, 0, i * 30), bev=0.1)
    # level 2+: roof with front gable, turret roof, bookshelves behind the big window
    gable(l23, 'slate', (0, 0, H), W + 0.1, D + 0.25, 1.15, accent='terra', seed=17)
    gable(l23, 'slate', (0, -D / 2 - 0.1, H + 0.05), 0.85, 1.25, 1.0, over=0.1, accent=None, along='y')
    for sx in (-1, 1):
        gable_wall(l23, 'stone3', (0, 0, H), D + 0.2, 1.13, sx * (W / 2 - 0.05))
    cone_roof(l23, W / 2 - 0.15, D / 2 - 0.1, H + 0.9, 0.48, 0.9, seg=10, seed=9, flag=False)
    for i in range(4):
        box(l23, ('book_p', 'book_g', 'book_m', 'book_c')[i], (-0.08 + (i % 2) * 0.12, -D / 2 - 0.26, H - 0.2 + (i // 2) * 0.28), (0.08, 0.02, 0.18), bev=0, M=None)
    # level 3: bench, globe, banners, lanterns
    B = mat4((-0.9, -D / 2 - 0.45, 0))
    box(l3, 'wood', (0, 0, 0.22), (0.7, 0.24, 0.06), bev=0.2, M=B)
    for sx in (-1, 1):
        box(l3, 'wood_dark', (sx * 0.28, 0, 0), (0.07, 0.2, 0.22), bev=0.2, M=B)
    G = mat4((1.0, -D / 2 - 0.5, 0))
    for k in range(3):
        ang = 2 * math.pi * k / 3
        beam(l3, 'wood_dark', (math.cos(ang) * 0.14, math.sin(ang) * 0.14, 0), (0, 0, 0.42), t=0.035, M=G)
    blob(l3, 'gold', (0, 0, 0.56), (0.14, 0.14, 0.14), sub=2, lumpy=0, M=G)
    cyl(l3, 'brass', (0, 0, 0.42), 0.17, 0.02, seg=10, rot=(70, 0, 0), bev=0, M=G)
    for sx in (-1, 1):
        banner(l3, sx * 0.45, -D / 2 - 0.2, H + 0.05, w=0.24, h=0.6)
        lantern_wall(l3, sx * 0.42, -D / 2 - 0.18, 0.8)
    pennant(l3, W / 2 - 0.15, D / 2 - 0.1, H + 1.85, h=0.55)


def room_workshop(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    W, D, H = 2.6, 1.6, 1.35
    box(a, 'cobble2', (0, 0, 0), (W - 0.1, D - 0.1, 0.05), bev=0)
    for sx in (-1, 1):
        box(a, 'stone2', (sx * W / 2, D / 2, 0), (0.34, 0.34, 0.5), bev=0.2)
        box(a, 'stone2', (sx * W / 2, -D / 2, 0), (0.3, 0.3, 0.25), bev=0.2)
        box(a, 'wood', (sx * W / 2, -D / 2, 0.2), (0.14, 0.14, H - 0.2), bev=0.15)
        box(a, 'wood', (sx * W / 2, D / 2, 0.45), (0.14, 0.14, H - 0.45), bev=0.15)
    box(a, 'wood_dark', (0, D / 2, 0), (W - 0.3, 0.1, H), bev=0.05)
    for x in (-0.7, 0.0, 0.7):
        box(a, 'plank', (x, D / 2 - 0.06, 0.1), (0.03, 0.02, H - 0.2), bev=0)
    beam(a, 'wood', (-W / 2, -D / 2, H), (W / 2, -D / 2, H), t=0.14)
    beam(a, 'wood', (-W / 2, D / 2, H), (W / 2, D / 2, H), t=0.14)
    for sx in (-1, 1):
        beam(a, 'wood', (sx * W / 2, -D / 2, H - 0.45), (sx * (W / 2 - 0.45), -D / 2, H), t=0.08)
    # workbench with tools, planks, saw horse, grindstone
    box(a, 'wood_light', (0, 0.35, 0.5), (1.5, 0.5, 0.08), bev=0.2)
    for sx in (-1, 1):
        box(a, 'wood_dark', (sx * 0.65, 0.35, 0), (0.08, 0.42, 0.5), bev=0.2)
    for i in range(4):
        box(a, 'iron2', (-0.6 + i * 0.36, D / 2 - 0.08, 0.72), (0.05, 0.03, 0.28), bev=0)
    box(a, 'iron', (0.3, 0.32, 0.58), (0.3, 0.08, 0.06), bev=0.2)
    S = mat4((0.45, -0.6, 0))
    beam(a, 'wood_light', (-0.3, 0, 0.42), (0.3, 0, 0.42), t=0.08, M=S)
    for sx in (-1, 1):
        for sy in (-1, 1):
            beam(a, 'wood_dark', (sx * 0.25, 0, 0.42), (sx * 0.3, sy * 0.18, 0), t=0.05, M=S)
    Gs = mat4((-0.95, -0.45, 0))
    for sy in (-1, 1):
        box(a, 'wood_dark', (0, sy * 0.1, 0), (0.06, 0.05, 0.42), bev=0.2, M=Gs)
    cyl(a, 'stone3', (0, -0.06, 0.42), 0.3, 0.12, seg=12, rot=(-90, 0, 0), bev=0.2, M=Gs)
    # level 1: rafters, tarp, scattered planks, rubble
    rafters(l1, (0, 0, H), W, D + 0.25, 0.75, n=5, skip=(1,))
    tarp(l1, 0.3, -0.1, H + 0.45, 1.3, 0.8, rot=(62, 0, 0))
    for i in range(3):
        box(l1, 'plank', (1.0 + i * 0.1, -1.0, 0.0), (0.9, 0.14, 0.04), rot=(0, 0, 20 + i * 25), bev=0.1)
    rubble(l1, -1.1, -1.15, n=4, spread=0.35, seed=35)
    # level 2+: roof, plank stack
    gable(l23, 'slate', (0, 0, H), W + 0.1, D + 0.25, 0.75, accent='terra', seed=18)
    for i in range(4):
        box(l23, 'plank', (W / 2 + 0.25, -0.1 + i * 0.06, 0), (0.12, 0.04, 1.2), rot=(0, -14, 0), bev=0.1)
    # level 3
    lantern_wall(l3, 0, -D / 2 + 0.05, H - 0.25)
    crate(l3, -W / 2 - 0.3, -0.5, 0.3, rot=12)
    crate(l3, -W / 2 - 0.3, -0.1, 0.26, rot=-8)
    pennant(l3, W / 2 + 0.1, -D / 2, H + 0.85, h=0.55)


def room_training(L):
    a, l1, l23, l3 = L.a, L.l1, L.l23, L.l3
    W, D = 3.0, 2.5
    box(a, 'sand', (0, 0, 0), (W, D, 0.06), bev=0.2)
    rr = random.Random(36)
    for i in range(8):
        blob(a, 'sand2', (rr.uniform(-1.2, 1.2), rr.uniform(-1.0, 1.0), 0.05), (0.2, 0.15, 0.02), sub=1, lumpy=0.2, seed=40 + i)
    ring = [(-W / 2, -D / 2), (-0.5, -D / 2), (-0.5, -D / 2)]
    front_l = [(-W / 2, -D / 2), (-0.95, -D / 2), (-0.4, -D / 2)]
    front_r = [(0.4, -D / 2), (0.95, -D / 2), (W / 2, -D / 2)]
    side_r = [(W / 2, -D / 2), (W / 2, -0.4), (W / 2, 0.4), (W / 2, D / 2)]
    back = [(W / 2, D / 2), (0.75, D / 2), (0.0, D / 2), (-0.75, D / 2), (-W / 2, D / 2)]
    side_l = [(-W / 2, D / 2), (-W / 2, 0.4), (-W / 2, -0.4), (-W / 2, -D / 2)]
    del ring

    def dummy(p, x, y, tilt=(0, 0, 0)):
        R = mat4((x, y, 0), tilt)
        cyl(p, 'wood_dark', (0, 0, 0), 0.05, 0.4, seg=6, M=R)
        cyl(p, 'straw', (0, 0, 0.35), 0.15, 0.4, seg=8, r2=0.17, bev=0.2, M=R)
        cyl(p, 'straw2', (-0.3, 0, 0.6), 0.06, 0.6, seg=6, rot=(0, 90, 0), bev=0.2, M=R)
        blob(p, 'straw', (0, 0, 0.92), (0.13, 0.13, 0.13), sub=1, lumpy=0.12, seed=int(x * 10), M=R)
        cyl(p, 'straw2', (0, 0, 0.5), 0.17, 0.04, seg=8, M=R, bev=0)

    # level 1: broken fence, one dummy fallen, rubble and weeds
    br = random.Random(37)
    for pts in (front_l, side_l, back):
        fence(l1, pts, broken=br, stone_posts=True)
    dummy(l1, 0.3, 0.2, tilt=(0, 75, 20))
    rubble(l1, 1.1, -0.9, n=5, spread=0.4, seed=38)
    for i in range(5):
        blob(l1, 'grass_dark', (br.uniform(-1.3, 1.3), br.uniform(-1.0, 1.0), 0.07), (0.14, 0.12, 0.07), sub=1, lumpy=0.3, seed=60 + i)
    # level 2+: complete fence with a gate, three dummies
    for pts in (front_l, front_r, side_r, back, side_l):
        fence(l23, pts, stone_posts=True)
    G = mat4((0, -D / 2, 0))
    for sx in (-1, 1):
        box(l23, 'wood', (sx * 0.2, 0, 0.05), (0.38, 0.06, 0.4), rot=(0, 0, sx * 8), bev=0.1, M=G)
    for k, (x, y) in enumerate(((-0.75, 0.3), (0.0, 0.55), (0.75, 0.25))):
        dummy(l23, x, y)
    # level 3: archery target (no team colours), weapon rack, pennant
    T = mat4((1.0, -0.35, 0), (0, 0, -25))
    for sx in (-1, 1):
        beam(l3, 'wood_dark', (sx * 0.2, 0.1, 0), (0, 0, 0.75), t=0.05, M=T)
    cyl(l3, 'straw', (0, -0.02, 0.55), 0.3, 0.12, seg=14, rot=(90, 0, 0), bev=0.2, M=T)
    cyl(l3, 'cream', (0, -0.1, 0.55), 0.2, 0.05, seg=14, rot=(90, 0, 0), bev=0, M=T)
    cyl(l3, 'leather', (0, -0.12, 0.55), 0.09, 0.04, seg=10, rot=(90, 0, 0), bev=0, M=T)
    Rk = mat4((-1.05, -0.4, 0), (0, 0, 20))
    for sx in (-1, 1):
        box(l3, 'wood_dark', (sx * 0.3, 0, 0), (0.06, 0.12, 0.7), bev=0.2, M=Rk)
    beam(l3, 'wood', (-0.33, 0, 0.6), (0.33, 0, 0.6), t=0.05, M=Rk)
    beam(l3, 'wood', (-0.33, 0, 0.2), (0.33, 0, 0.2), t=0.05, M=Rk)
    for i in range(4):
        x = -0.2 + i * 0.13
        beam(l3, 'wood_light' if i % 2 else 'steel', (x, -0.04, 0.05), (x + 0.03, -0.06, 0.85 + 0.08 * (i % 2)), t=0.035, M=Rk)
    pennant(l3, -W / 2, -D / 2, 0.0, h=1.4)


# ------------------------------------------------------------------------------------------------ keepsakes (§7)


def keepsake_axe(L):
    """Brenna's double axe in a banded wooden stand."""
    a = L.a
    box(a, 'wood', (0, 0, 0), (0.56, 0.3, 0.18), bev=0.15)
    for sx in (-1, 1):
        box(a, 'iron', (sx * 0.2, 0, 0), (0.07, 0.32, 0.2), bev=0.1)
    box(a, 'steel', (0.17, 0.0, 0.18), (0.12, 0.12, 0.06), bev=0.2)
    cyl(a, 'wood', (0, 0, 0.12), 0.045, 0.85, seg=8, bev=0.2)
    cyl(a, 'leather', (0, 0, 0.3), 0.055, 0.22, seg=8, bev=0.2)
    cyl(a, 'iron', (0, 0, 0.82), 0.065, 0.16, seg=8, bev=0.2)
    blob(a, 'wood', (0, 0, 1.02), (0.06, 0.06, 0.06), sub=1, lumpy=0)
    for sx in (-1, 1):
        pts = [(0.05, -0.12), (0.18, -0.2), (0.3, -0.28), (0.34, -0.1), (0.36, 0.0), (0.34, 0.1), (0.3, 0.28), (0.18, 0.2), (0.05, 0.12)]
        pts = [(sx * x, z) for x, z in pts]
        if sx < 0:
            pts = list(reversed(pts))
        poly(a, 'steel', pts, (0, -0.02, 0.9), depth=0.04)


def keepsake_lute(L):
    """Jory's lute leaning against a barrel, a mug on the barrel, the feathered hat on the neck."""
    a = L.a
    barrel(a, 0.12, 0.05, r=0.2, h=0.44)
    cyl(a, 'cream', (0.16, 0.05, 0.44), 0.06, 0.12, seg=8, bev=0.2)
    S = mat4((-0.22, -0.12, 0.0), (0, -22, 0))
    blob(a, 'wood_light', (0, 0, 0.22), (0.17, 0.08, 0.22), sub=2, lumpy=0, M=S)
    cyl(a, 'wood_dark', (0, -0.08, 0.26), 0.05, 0.01, seg=10, rot=(90, 0, 0), bev=0, M=S)
    box(a, 'wood', (0, 0, 0.38), (0.06, 0.04, 0.42), bev=0.2, M=S)
    box(a, 'wood_dark', (0, 0.0, 0.78), (0.08, 0.05, 0.12), rot=(18, 0, 0), bev=0.2, M=S)
    for dx in (-0.015, 0.015):
        box(a, 'cream', (dx, -0.03, 0.2), (0.006, 0.006, 0.6), bev=0, M=S)
    H = mat4((0.0, -0.05, 0.86))
    cyl(a, 'leather', (0, 0, 0), 0.2, 0.03, seg=12, rot=(14, 0, 0), bev=0.2, M=H)
    cyl(a, 'wood_dark', (0, 0, 0.02), 0.1, 0.13, seg=10, r2=0.08, rot=(14, 0, 0), bev=0.2, M=H)
    poly(a, 'banner', [(0, 0), (0.06, 0.1), (0.04, 0.28), (-0.02, 0.12)], (0.08, 0.02, 0.06), depth=0.02, rot=(0, 0, 30), M=H)


def keepsake_books(L):
    """Ysolde's book stack with spectacles, a candle and a scroll."""
    a = L.a
    for i, (col, w, d, rot) in enumerate((('book_m', 0.5, 0.36, 3), ('book_g', 0.46, 0.33, -4), ('book_c', 0.44, 0.32, 6), ('book_p', 0.4, 0.3, -2))):
        z = i * 0.1
        R = mat4((0, 0, z), (0, 0, rot))
        box(a, col, (0, 0, 0), (w, d, 0.1), bev=0.15, M=R)
        box(a, 'parch', (0.02, -0.005, 0.015), (w - 0.03, d - 0.0, 0.07), bev=0.05, M=R)
        box(a, 'gold', (0, -d / 2 - 0.005, 0.03), (0.06, 0.01, 0.05), bev=0, M=R)
    for sx in (-1, 1):
        cyl(a, 'brass', (sx * 0.08, -0.02, 0.4), 0.065, 0.02, seg=10, bev=0)
        cyl(a, 'glow2', (sx * 0.08, -0.02, 0.41), 0.045, 0.015, seg=10, bev=0)
    cyl(a, 'iron', (-0.4, -0.05, 0), 0.08, 0.03, seg=10, bev=0)
    cyl(a, 'cream', (-0.4, -0.05, 0.03), 0.045, 0.14, seg=8, bev=0)
    blob(a, 'glow2', (-0.4, -0.05, 0.22), (0.025, 0.025, 0.045), sub=1, lumpy=0, glow=True)
    cyl(a, 'parch', (0.2, -0.32, 0.05), 0.05, 0.3, seg=8, rot=(0, 90, 20), bev=0.2)
    box(a, 'leather', (0.33, -0.27, 0.0), (0.04, 0.11, 0.11), rot=(0, 0, 20), bev=0)


ROOMS = {
    'convoy': room_convoy, 'merchant': room_merchant, 'smith': room_smith, 'healer': room_healer, 'tavern': room_tavern,
    'campfire': room_campfire, 'memorial': room_memorial, 'enchanter': room_enchanter, 'academy': room_academy,
    'workshop': room_workshop, 'training': room_training,
}
KEEPSAKES = {'axe': keepsake_axe, 'lute': keepsake_lute, 'books': keepsake_books}


# ------------------------------------------------------------------------------------------------ scene, export


def material(name, emit):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    attr = nt.nodes.new('ShaderNodeVertexColor')
    attr.layer_name = 'Col'
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.9
    if emit:
        nt.links.new(attr.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 1.0
    return m


def to_object(p, lit, glow):
    me = bpy.data.meshes.new(p.name)
    me.from_pydata([tuple(v) for v in p.verts], [], [f[0] for f in p.faces])
    me.materials.append(lit)
    me.materials.append(glow)
    me.polygons.foreach_set('material_index', [f[1] for f in p.faces])
    attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    flat = []
    for f in p.faces:
        for c in f[2]:
            flat.extend((c[0], c[1], c[2], 1.0))
    attr.data.foreach_set('color', flat)
    me.color_attributes.active_color = attr
    me.validate(clean_customdata=False)
    me.update()
    ob = bpy.data.objects.new(p.name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def build_all():
    shell = Lv('shell')
    for fn in (build_island, build_walls, build_gate, build_keep):
        before = sum(len(p.faces) for p in PARTS.values())
        fn(shell)
        print(f'[hc]   {fn.__name__}: {sum(len(p.faces) for p in PARTS.values()) - before} faces (all levels)', flush=True)
    for rid, fn in ROOMS.items():
        fn(Lv(rid))
    for kid, fn in KEEPSAKES.items():
        fn(Lv(kid))


def preview_materials():
    """The vertex colours hold sRGB values: decode them for Blender's linear renderer (preview only, after the export)."""
    for m in bpy.data.materials:
        nt = m.node_tree
        attr = next(n for n in nt.nodes if n.type == 'VERTEX_COLOR')
        bsdf = nt.nodes['Principled BSDF']
        g = nt.nodes.new('ShaderNodeGamma')
        g.inputs['Gamma'].default_value = 2.2
        nt.links.new(attr.outputs['Color'], g.inputs['Color'])
        nt.links.new(g.outputs['Color'], bsdf.inputs['Base Color'])
        if 'glow' in m.name:
            nt.links.new(g.outputs['Color'], bsdf.inputs['Emission Color'])


def visible(name, level):
    tag = name.rsplit('_', 1)[1]
    return tag == 'a' or (tag == '1' and level == 1) or (tag == '23' and level >= 2) or (tag == '3' and level == 3) or (tag == '2' and level == 2)


def preview_rooms(path, objs, sc, cam):
    """One 3/4 render per room and level (rooms/<id>_l<n>.png), for review."""
    os.makedirs(os.path.join(path, 'rooms'), exist_ok=True)
    sc.render.resolution_x = sc.render.resolution_y = 420
    cam.data.ortho_scale = 5.2
    pitch = math.radians(38)
    for g in list(ROOMS) + list(KEEPSAKES):
        for level in (1, 2, 3):
            for o in objs:
                o.hide_render = not (o.name.rsplit('_', 1)[0] == g and visible(o.name, level))
                if o.name.rsplit('_', 1)[0] == g:
                    o.location = (0, 0, 0)
                    o.rotation_euler = (0, 0, math.radians(-25))
            cam.location = (0, -30 * math.cos(pitch), 30 * math.sin(pitch) + 1.0)
            cam.rotation_euler = (math.radians(90) - pitch, 0, 0)
            sc.render.filepath = os.path.join(path, 'rooms', f'{g}_l{level}.png')
            bpy.ops.render.render(write_still=True)


def preview(path, objs):
    sc = bpy.context.scene
    preview_materials()
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 25
    pitch = math.radians(47)
    cam.location = (0, -40 * math.cos(pitch), 40 * math.sin(pitch))
    cam.rotation_euler = (math.radians(90) - pitch, 0, 0)
    sc.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sc.collection.objects.link(sun)
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(50), 0, math.radians(-40))
    sc.world = sc.world or bpy.data.worlds.new('w')
    sc.world.use_nodes = True
    sc.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.85, 0.82, 0.8, 1)
    sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
    sc.view_settings.view_transform = 'Standard'
    engines = {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items}
    sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in engines else 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x = sc.render.resolution_y = 1100
    for level in (1, 2, 3):
        for o in objs:
            o.hide_render = not visible(o.name, level)
        sc.render.filepath = os.path.join(path, f'castle_l{level}.png')
        bpy.ops.render.render(write_still=True)
    if '--rooms' in ARGV:
        preview_rooms(path, objs, sc, cam)


# rooms at their layout spots (x, y, yaw in degrees, counter-clockwise) – the same table as LAYOUT in src/render/home/castle.ts
PREVIEW_LAYOUT = {
    'convoy': (-7.2, 1.0, 30), 'workshop': (-4.3, 2.8, 18), 'merchant': (-1.8, 2.0, 8), 'campfire': (0.0, -0.4, 0),
    'tavern': (2.2, 3.4, -8), 'smith': (5.0, 1.4, -22), 'academy': (5.9, 4.6, -24), 'healer': (6.6, -1.8, -32),
    'training': (-4.6, -3.0, 16), 'memorial': (-4.2, 5.9, 10), 'enchanter': (-6.6, 4.0, 22),
    'axe': (3.4, -0.4, -20), 'lute': (-1.3, -1.4, 10), 'books': (4.2, 3.2, 0),
}


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_all()
    lit = material('castle_lit', False)
    glow = material('castle_glow', True)
    objs = []
    total_v = 0
    for name in sorted(PARTS):
        p = PARTS[name]
        if not p.faces:
            continue
        ob = to_object(p, lit, glow)
        objs.append(ob)
        corners = sum(len(f[0]) for f in p.faces)
        total_v += corners
        print(f'[hc] {name}: {p.tris()} triangles, ~{corners} vertices (flat)', flush=True)
    print(f'[hc] total ~{total_v} vertices', flush=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    raw = OUT[:-4] + '.raw.glb'
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=raw, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_vertex_color='ACTIVE', export_cameras=False, export_lights=False, export_animations=False,
                              export_materials='EXPORT')
    if os.path.exists(GLTFPACK):
        res = subprocess.run([GLTFPACK, '-i', raw, '-o', OUT, '-kn', '-km', '-cc'], capture_output=True, text=True)
        if res.returncode:
            print(res.stdout, res.stderr)
            shutil.copy2(raw, OUT)
        os.remove(raw)
    else:
        print('[hc] gltfpack missing (pnpm install): writing the unpacked file')
        shutil.move(raw, OUT)
    print(f'[hc] {OUT}: {os.path.getsize(OUT) // 1024} KB', flush=True)
    if PREVIEW:
        for o in objs:
            g = o.name.rsplit('_', 1)[0]
            if g in PREVIEW_LAYOUT:
                x, y, rot = PREVIEW_LAYOUT[g]
                o.location = (x, y, 0)
                o.rotation_euler = (0, 0, math.radians(rot))
        preview(PREVIEW, objs)


main()
