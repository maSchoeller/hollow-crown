"""Hollow Crown – attached parts of the pro paths (story 10.13, concept/23-art-direction §4.2 and §4.6).

blender -b --factory-startup --python tools/art/blender_proparts.py -- [<out_dir>] [<id> ...]

One small glTF per pro path (art/models/parts/<id>.glb). The renderer hangs it on a figure's body socket at runtime
(src/render/shared/models.ts), chosen by the `proPart` of the unit's class (content/core/render.yaml `gear.proParts`),
instead of building a second figure per pro path.

Socket frame (tools/art/prepare_tripo_unit.py sockets(), body sockets): +Y world up, +Z the figure's facing, +X its
left. `socket_back` sits in the middle of the upper chest, so a part on the back offsets itself towards -Z (the back
surface is at about z = -0.07); `socket_head` sits on the crown, so a hat sits around y = 0 and a mask hangs down and
forward. Units: 1 = one board tile before figureScale, like the figures (a figure is 0.8 tall, its head about 0.26
across). A head part stays below about 0.16 above the crown so it does not reach into the HP bar and the grudge
pennant (content/core/render.yaml `legibility.hpBar.lift`).

Colours: vertex colours (COLOR_0, linear) from Hollow-64, team cloth as key K2 in vertex alpha like the figures and
the weapon library. Round chibi look: chunky parts, smooth round ends, a few hundred triangles each.
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.join(ROOT, "art", "models", "parts")
PALETTE = [l.strip() for l in open(os.path.join(ROOT, "art", "palette", "hollow-64.hex")) if l.strip()]
TEAM = (0.85, 0.85, 0.85, 3 / 8)  # team key K2 (src/render/shared/models.ts teamColours)


def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def pal(i):
    """Hollow-64 colour (1-based like art/palette/hollow-64.hex lines) in linear RGBA."""
    h = PALETTE[i - 1]
    return tuple(lin(int(h[k:k + 2], 16) / 255) for k in (0, 2, 4)) + (1.0,)


STEEL, STEEL_DARK, GOLD, GOLD_LIGHT = pal(27), pal(26), pal(43), pal(44)
LEATHER, LEATHER_DARK, WOOD, WOOD_LIGHT = pal(22), pal(21), pal(22), pal(23)
CREAM, SLATE, INK, FEATHER = pal(6), pal(25), pal(2), pal(3)
LEAF, LEAF_DARK, VIOLET, WINE = pal(31), pal(30), pal(49), pal(38)

parts = []


def add(me, rgba, smooth=False):
    """Adds a mesh part with one vertex colour."""
    col = me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
    for c in col.data:
        c.color = rgba
    for p in me.polygons:
        p.use_smooth = smooth
    ob = bpy.data.objects.new("part", me)
    bpy.context.scene.collection.objects.link(ob)
    parts.append(ob)
    return ob


def bm_mesh(build):
    bm = bmesh.new()
    build(bm)
    me = bpy.data.meshes.new("part")
    bm.to_mesh(me)
    bm.free()
    return me


def cylinder(a, b, r, rgba, segs=10, r2=None):
    """Capped cylinder (or cone with r2) from point a to point b."""
    a, b = Vector(a), Vector(b)
    axis = b - a
    rot = axis.to_track_quat("Z", "Y").to_matrix().to_4x4()
    me = bm_mesh(lambda bm: bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r, radius2=r if r2 is None else r2,
                                                  depth=axis.length, matrix=Matrix.Translation((a + b) / 2) @ rot))
    return add(me, rgba, smooth=True)


def sphere(c, r, rgba, scale=(1, 1, 1), subdiv=2):
    me = bm_mesh(lambda bm: bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=r,
                                                       matrix=Matrix.Translation(c) @ Matrix.Diagonal((*scale, 1))))
    return add(me, rgba, smooth=True)


def box(c, size, rgba, bevel=0.0, rot=None):
    def build(bm):
        m = Matrix.Translation(c) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((*size, 1))
        bmesh.ops.create_cube(bm, size=1, matrix=m)
        if bevel:
            bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=2, affect="EDGES")
    return add(bm_mesh(build), rgba, smooth=bevel > 0)


def plate(outline, depth, rgba, at=(0, 0, 0), rot=None):
    """Flat shape: polygon `outline` of (x, y) extruded by `depth` along Z, centred on `at`."""
    def build(bm):
        ring = []
        for d in (-depth / 2, depth / 2):
            ring.append([bm.verts.new((x, y, d)) for x, y in outline])
        bm.faces.new(ring[0][::-1])
        bm.faces.new(ring[1])
        n = len(outline)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ring[0][i], ring[0][j], ring[1][j], ring[1][i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bmesh.ops.transform(bm, matrix=rot or Matrix.Identity(4), verts=bm.verts[:])
        bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts[:])
    return add(bm_mesh(build), rgba)


def shield_outline(hw, top, bottom):
    """Rounded tower-shield outline: straight sides, round top edge, tapered foot."""
    return [(-hw, top - 0.03), (-hw * 0.72, top), (hw * 0.72, top), (hw, top - 0.03),
            (hw, bottom + 0.1), (hw * 0.55, bottom + 0.02), (0, bottom), (-hw * 0.55, bottom + 0.02), (-hw, bottom + 0.1)]


def diag(length, tilt, at):
    """A line across the back: `tilt` degrees from vertical in the x–y plane, centred on `at`.
    Returns foot, head and the unit direction (the figure's up is +Y, so tilt 0 stands upright)."""
    d = Vector((math.sin(math.radians(tilt)), math.cos(math.radians(tilt)), 0))
    return Vector(at) - d * length / 2, Vector(at) + d * length / 2, d


def across(d):
    """The in-plane normal of a `diag` direction and the frame that turns a plate onto the shaft: plate x -> the
    normal, plate y -> along the shaft, plate z -> n x d. The third column has to be n x d, or the frame mirrors and
    every normal flips (the part then renders unlit)."""
    n = Vector((-d.y, d.x, 0))
    k = n.cross(d)
    return n, Matrix(((n.x, d.x, k.x), (n.y, d.y, k.y), (n.z, d.z, k.z))).to_4x4()


def shaft(length, tilt, at, r, rgba, segs=8):
    """A `diag` shaft built as a cylinder; returns what `diag` returns."""
    a, b, d = diag(length, tilt, at)
    cylinder(a, b, r, rgba, segs=segs)
    return a, b, d


BACK = -0.085  # the back surface of the chest, a hair clear of it


# ---------------------------------------------------------------------------------------------- back socket


def tower_shield():
    """Bulwark: a tall shield slung over the back, team cloth face in a bright steel rim.
    The camera looks at the back from 35 degrees off vertical, so the shield reaches above the shoulders and the rim
    is STEEL, not STEEL_DARK: a dark rim on the dark body read as nothing (abnahme 2026-11-14)."""
    plate(shield_outline(0.1, 0.21, -0.17), 0.02, STEEL, at=(0, 0.02, BACK - 0.012))
    plate(shield_outline(0.08, 0.188, -0.15), 0.028, TEAM, at=(0, 0.02, BACK - 0.004))
    plate([(-0.016, 0.17), (0.016, 0.17), (0.016, -0.12), (-0.016, -0.12)], 0.03, STEEL, at=(0, 0.02, BACK - 0.022))
    sphere((0, 0.03, BACK - 0.034), 0.036, GOLD, scale=(1, 1, 0.5))
    sphere((0, 0.03, BACK - 0.046), 0.016, GOLD_LIGHT, scale=(1, 1, 0.5))
    box((0, 0.11, BACK + 0.012), (0.16, 0.02, 0.026), LEATHER, bevel=0.005)  # strap over the shoulders


def ram_axe():
    """Breaker: a heavy ram axe across the back, the broad head up on the figure's left."""
    a, b, d = shaft(0.37, 28, (0.0, 0.05, BACK - 0.02), 0.015, WOOD)
    sphere(a, 0.021, STEEL_DARK)
    n, rot = across(d)
    top = b - d * 0.07
    # broad crescent head: it spreads along the shaft's normal (plate x) and along the shaft (plate y)
    arc = [(-0.025, 0.055), (-0.025, -0.075)] + [(-0.03 - 0.085 * math.cos(t), 0.085 * math.sin(t))
                                                 for t in [(-0.5 + i / 5) * math.pi for i in range(6)]]
    plate(arc, 0.03, STEEL, at=top, rot=rot)
    plate([(0.03, 0.045), (0.03, -0.045), (0.1, 0.0)], 0.024, STEEL_DARK, at=top, rot=rot)
    box(top, (0.055, 0.075, 0.05), STEEL_DARK, bevel=0.008, rot=rot)


def second_blade():
    """Blade dancer: a second blade in its scabbard, hilt high over the right shoulder.
    Hilt, guard and pommel are a third larger than in story 10.13: at 375 x 812 the old ones were a few pixels
    (abnahme 2026-11-14)."""
    a, b, d = shaft(0.38, -34, (0.01, 0.055, BACK - 0.015), 0.024, LEATHER_DARK)
    for s in (0.3, 0.55, 0.8):
        p = a + (b - a) * s
        cylinder(p - d * 0.01, p + d * 0.01, 0.033, GOLD, segs=8)
    hilt = b + d * 0.02
    n, _ = across(d)
    cylinder(hilt, hilt + d * 0.085, 0.018, WINE, segs=8)
    cylinder(hilt - n * 0.058, hilt + n * 0.058, 0.017, GOLD, segs=8)
    sphere(hilt + d * 0.1, 0.026, GOLD_LIGHT)
    box((0, 0.09, BACK + 0.015), (0.19, 0.02, 0.028), LEATHER, bevel=0.005)


def leaf_cloak():
    """Ranger: a short mantle of layered leaf plates over the shoulders.
    Lifted and widened against story 10.13, and the lowest row dropped: the mantle used to cover the whole body, so
    the figure under it was gone (abnahme 2026-11-14)."""
    leaf = [(-0.055, 0.03), (0.0, 0.055), (0.055, 0.03), (0.04, -0.045), (0.0, -0.07), (-0.04, -0.045)]
    for row, (y, span, n, col) in enumerate(((0.155, 0.1, 3, LEAF), (0.07, 0.115, 4, LEAF_DARK), (-0.015, 0.1, 3, LEAF))):
        for i in range(n):
            x = (i - (n - 1) / 2) * span
            plate(leaf, 0.016, col, at=(x, y, BACK - 0.006 * row))
    cylinder((-0.13, 0.205, BACK + 0.03), (0.13, 0.205, BACK + 0.03), 0.03, WOOD, segs=8)  # collar roll
    sphere((0, 0.225, BACK + 0.055), 0.024, GOLD, scale=(1, 0.6, 1))


def raven_collar():
    """Hexer: a high collar of raven feathers rising behind the neck."""
    for i in range(7):
        a = math.radians(-66 + i * 22)
        base = Vector((math.sin(a) * 0.105, 0.185, BACK + 0.05 - math.cos(a) * 0.035))
        tip = base + Vector((math.sin(a) * 0.06, 0.135 - abs(i - 3) * 0.014, -0.045))
        cylinder(base, tip, 0.028, INK if i % 2 else FEATHER, segs=6, r2=0.007)
    cylinder((-0.105, 0.175, BACK + 0.045), (0.105, 0.175, BACK + 0.045), 0.03, INK, segs=8)
    for s in (-1, 1):
        sphere((s * 0.08, 0.17, BACK + 0.075), 0.02, VIOLET)


def war_hammer():
    """Battle priest: a war hammer on the back, boxy head up on the right."""
    a, b, d = shaft(0.36, -26, (0.0, 0.045, BACK - 0.02), 0.016, WOOD)
    sphere(a, 0.022, STEEL_DARK)
    head = b - d * 0.05
    n, rot = across(d)
    box(head, (0.1, 0.085, 0.085), STEEL, bevel=0.012, rot=rot)
    plate([(0.05, 0.03), (0.05, -0.03), (0.105, 0.0)], 0.05, STEEL_DARK, at=head, rot=rot)
    cylinder(head + d * 0.055, head + d * 0.085, 0.022, GOLD, segs=8)


def great_lute():
    """Bard: a great lute on the back, neck up over the left shoulder.
    The body carries a cream soundboard towards the camera and a dark rim: two plain wood domes read as a sack
    (abnahme 2026-11-14)."""
    sphere((0.0, -0.06, BACK - 0.03), 0.112, WOOD, scale=(1.0, 1.1, 0.42))
    sphere((0.0, 0.045, BACK - 0.026), 0.08, WOOD, scale=(1.0, 1.0, 0.42))
    sphere((0.0, -0.055, BACK - 0.062), 0.094, WOOD_LIGHT, scale=(1.0, 1.15, 0.2))  # soundboard
    sphere((0.0, 0.045, BACK - 0.056), 0.066, WOOD_LIGHT, scale=(1.0, 1.0, 0.2))
    sphere((0.0, -0.04, BACK - 0.078), 0.034, INK, scale=(1, 1, 0.25))  # rosette
    a, b, d = shaft(0.42, 22, (0.03, 0.11, BACK - 0.02), 0.017, WOOD)
    cylinder(b - d * 0.02, b + d * 0.07, 0.019, WOOD_LIGHT, segs=8)
    for s in (0.42, 0.6, 0.78):
        q = a + (b - a) * s
        cylinder(q - d * 0.006, q + d * 0.006, 0.022, GOLD, segs=6)
    box((0.012, -0.02, BACK - 0.084), (0.008, 0.22, 0.01), CREAM)  # strings
    for s in (-1, 1):
        cylinder(b + d * 0.035 + Vector((s * 0.015, 0, 0)), b + d * 0.035 + Vector((s * 0.034, 0, 0)), 0.009, GOLD_LIGHT, segs=5)


def back_banner():
    """Standard bearer: a banner on a short pole up the back, team cloth."""
    cylinder((-0.01, -0.12, BACK - 0.02), (-0.01, 0.26, BACK - 0.02), 0.014, WOOD, segs=8)
    sphere((-0.01, 0.275, BACK - 0.02), 0.02, GOLD)
    plate([(0.0, 0.22), (0.13, 0.2), (0.13, 0.0), (0.065, 0.05), (0.0, -0.02)], 0.012, TEAM, at=(0.0, 0.0, BACK - 0.035))
    plate([(0.0, 0.23), (0.135, 0.21), (0.135, 0.18), (0.0, 0.2)], 0.014, GOLD, at=(0.0, 0.0, BACK - 0.04))
    box((0, 0.1, BACK + 0.015), (0.16, 0.02, 0.026), LEATHER, bevel=0.005)


def trap_belt():
    """Trapper: a strap of folded traps across the back.
    Bright steel and half again as large as in story 10.13; the dark traps on the dark strap were not readable
    (abnahme 2026-11-14)."""
    _, _, d = diag(0.44, 34, (0.0, 0.015, BACK))
    n, rot = across(d)
    plate([(-0.042, 0.22), (0.042, 0.22), (0.042, -0.22), (-0.042, -0.22)], 0.022, LEATHER_DARK, at=(0.0, 0.015, BACK - 0.01), rot=rot)
    for s in (-0.15, 0.0, 0.15):
        p = Vector((0.0, 0.015, BACK - 0.03)) + d * s
        cylinder(p + Vector((0, 0, 0.004)), p - Vector((0, 0, 0.022)), 0.047, STEEL, segs=10)
        cylinder(p - Vector((0, 0, 0.02)), p - Vector((0, 0, 0.032)), 0.034, STEEL_DARK, segs=10)
        cylinder(p - Vector((0, 0, 0.03)), p - Vector((0, 0, 0.04)), 0.018, GOLD, segs=8)
    for s in (-0.075, 0.075):
        p = Vector((0.0, 0.015, BACK - 0.022)) + d * s
        box(p, (0.034, 0.055, 0.032), WOOD, bevel=0.006, rot=rot)


def general_cloak():
    """Grand strategist: a long wine cloak down the back with a thin gold edge.
    Three tries: a dark slab over the whole figure, then a signboard with a band down the middle, now wine cloth with
    a gold outline. The colour does the work – a dark cloak on the dark back cannot be read at 375 x 812, whatever its
    shape (abnahme 2026-11-14)."""
    outer = [(-0.112, 0.182), (0.112, 0.182), (0.096, -0.03), (0.066, -0.178), (-0.066, -0.178), (-0.096, -0.03)]
    inner = [(-0.098, 0.17), (0.098, 0.17), (0.083, -0.03), (0.055, -0.166), (-0.055, -0.166), (-0.083, -0.03)]
    # no fold lines: dark stripes on the cloth turned it back into a shield face
    plate(outer, 0.018, GOLD, at=(0, 0, BACK - 0.006))
    plate(inner, 0.022, WINE, at=(0, 0, BACK - 0.014))
    cylinder((-0.11, 0.192, BACK + 0.015), (0.11, 0.192, BACK + 0.015), 0.028, WINE, segs=10)
    for s in (-1, 1):
        sphere((s * 0.104, 0.176, BACK - 0.03), 0.018, GOLD)
    cylinder((0.1, -0.01, BACK - 0.05), (0.1, -0.11, BACK - 0.05), 0.026, LEATHER_DARK, segs=8)  # map case at the hip


def standard():
    """Banner lord: a tall standard with a crossbar and a square team flag."""
    cylinder((-0.01, -0.14, BACK - 0.025), (-0.01, 0.3, BACK - 0.025), 0.015, WOOD, segs=8)
    cylinder((-0.09, 0.27, BACK - 0.025), (0.07, 0.27, BACK - 0.025), 0.01, GOLD, segs=6)
    cylinder((-0.01, 0.31, BACK - 0.025), (-0.01, 0.36, BACK - 0.025), 0.015, GOLD, segs=8, r2=0.0)
    plate([(-0.085, 0.27), (0.065, 0.27), (0.065, 0.1), (-0.01, 0.13), (-0.085, 0.1)], 0.012, TEAM, at=(0, 0, BACK - 0.04))
    plate([(-0.085, 0.11), (0.065, 0.11), (0.065, 0.088), (-0.085, 0.088)], 0.014, GOLD, at=(0, 0, BACK - 0.045))
    for s in (-0.08, 0.06):
        sphere((s, 0.27, BACK - 0.045), 0.011, GOLD_LIGHT)
    box((0, 0.1, BACK + 0.015), (0.16, 0.02, 0.026), LEATHER, bevel=0.005)


# ---------------------------------------------------------------------------------------------- head socket


def feather_hat_shape(brim, crown_r, crown_h, cloth, band, feather_col, tilt=-8):
    """Shared build of the two feathered hats: brim disc, low crown, band and a feather swept back.
    `tilt` rocks the whole hat about X (a hair forward over the brow)."""
    first = len(parts)
    cylinder((0, 0.0, 0.005), (0, 0.02, 0.005), brim, cloth, segs=18)
    cylinder((0, 0.008, 0.005), (0, 0.008 + crown_h, 0.005), crown_r, cloth, segs=14)
    sphere((0, 0.014 + crown_h, 0.005), crown_r * 0.98, cloth, scale=(1, 0.45, 1))
    cylinder((0, 0.016, 0.005), (0, 0.034, 0.005), crown_r * 1.06, band, segs=14)
    base = Vector((crown_r * 0.8, 0.022, -0.01))
    cylinder(base, base + Vector((0.03, crown_h + 0.06, -0.07)), 0.014, feather_col, segs=6, r2=0.004)
    for ob in parts[first:]:
        ob.data.transform(Matrix.Rotation(math.radians(tilt), 4, "X"))


def feather_beret():
    """Duelist: a soft beret pulled to one side with a short feather."""
    sphere((0.01, 0.03, 0.0), 0.092, WINE, scale=(1.0, 0.42, 1.0))
    sphere((0.01, 0.048, -0.01), 0.062, WINE, scale=(1.0, 0.4, 1.0))
    cylinder((0.01, 0.012, 0.0), (0.01, 0.03, 0.0), 0.082, WINE, segs=16)
    sphere((0.026, 0.058, -0.005), 0.018, GOLD)
    base = Vector((0.062, 0.046, -0.015))
    cylinder(base, base + Vector((0.026, 0.085, -0.065)), 0.013, CREAM, segs=6, r2=0.004)
    lift_head_parts(0)


def feather_hat():
    """Sharpshooter: a wide feathered hat (the longbow comes from the weapon)."""
    first = len(parts)
    feather_hat_shape(0.128, 0.08, 0.05, LEAF_DARK, LEATHER, CREAM)
    lift_head_parts(first)


def pointed_hat():
    """Sage: a pointed hat, the tip bent backwards so it stays clear of the HP bar."""
    cylinder((0, 0.0, 0.0), (0, 0.02, 0.0), 0.128, VIOLET, segs=18)
    cylinder((0, 0.016, 0.0), (0, 0.1, -0.02), 0.076, VIOLET, segs=14, r2=0.044)
    cylinder((0, 0.1, -0.02), (0, 0.14, -0.075), 0.04, VIOLET, segs=12, r2=0.01)
    sphere((0, 0.142, -0.085), 0.015, GOLD)
    cylinder((0, 0.02, 0.0), (0, 0.042, 0.0), 0.083, SLATE, segs=14)
    # three rune studs on the band, spread over the front half
    for a in (-40, 0, 40):
        r = math.radians(a)
        sphere((math.sin(r) * 0.081, 0.031, math.cos(r) * 0.081), 0.012, GOLD_LIGHT)
    lift_head_parts(0)


def mitre():
    """Bishop: a mitre with a gold band and two short lappets behind.
    The orphrey band runs up the back panel as well: the camera looks at the back of the head, so the front band alone
    left a blank sheet (abnahme 2026-11-14). The cap is taller and carries a rounded ridge."""
    first = len(parts)
    plate([(-0.07, 0.0), (0.07, 0.0), (0.07, 0.062), (0.0, 0.215), (-0.07, 0.062)], 0.062, CREAM, at=(0, 0, 0.0))
    sphere((0, 0.07, 0.0), 0.034, CREAM, scale=(1.0, 2.4, 0.6))  # the ridge between the panels
    for z in (0.036, -0.036):
        plate([(-0.016, -0.002), (0.016, -0.002), (0.016, 0.15), (0.0, 0.212), (-0.016, 0.15)], 0.012, GOLD_LIGHT, at=(0, 0, z))
    cylinder((0, -0.002, 0.0), (0, 0.028, 0.0), 0.075, GOLD, segs=14)
    plate([(-0.013, 0.02), (0.013, 0.02), (0.013, -0.08), (-0.013, -0.08)], 0.01, GOLD, at=(-0.026, 0.0, -0.046))
    plate([(-0.013, 0.02), (0.013, 0.02), (0.013, -0.07), (-0.013, -0.07)], 0.01, GOLD, at=(0.026, 0.0, -0.042))
    lift_head_parts(first)


def half_mask():
    """Shadow: a porcelain half mask over the upper face (the crown socket, so it hangs down and forward)."""
    sphere((0, -0.09, 0.08), 0.092, CREAM, scale=(1.0, 0.6, 0.45))
    for s in (-1, 1):
        box((s * 0.038, -0.085, 0.112), (0.03, 0.015, 0.018), INK, bevel=0.004)
    plate([(-0.086, -0.012), (0.086, -0.012), (0.07, -0.042), (-0.07, -0.042)], 0.012, INK, at=(0, 0, 0.05))
    sphere((0, -0.035, 0.092), 0.014, SLATE)


HEAD_LIFT = 0.012  # `socket_head` sits on the top of the head mesh; a head part clears it by a hair


def lift_head_parts(first):
    for ob in parts[first:]:
        ob.data.transform(Matrix.Translation((0, HEAD_LIFT, 0)))


PARTS = {"tower_shield": tower_shield, "ram_axe": ram_axe, "second_blade": second_blade, "leaf_cloak": leaf_cloak,
         "raven_collar": raven_collar, "war_hammer": war_hammer, "great_lute": great_lute, "back_banner": back_banner,
         "trap_belt": trap_belt, "general_cloak": general_cloak, "standard": standard,
         "feather_beret": feather_beret, "feather_hat": feather_hat, "pointed_hat": pointed_hat, "mitre": mitre,
         "half_mask": half_mask}


def vertex_material():
    m = bpy.data.materials.get("HC_Vertex") or bpy.data.materials.new("HC_Vertex")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if not bsdf.inputs["Base Color"].is_linked:
        attr = nt.nodes.new("ShaderNodeVertexColor")
        attr.layer_name = "Col"
        nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.85
    return m


os.makedirs(OUT, exist_ok=True)
for pid in argv[1:] or list(PARTS):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    parts.clear()
    PARTS[pid]()
    with bpy.context.temp_override(active_object=parts[0], selected_editable_objects=parts):
        bpy.ops.object.join()
    ob = parts[0]
    ob.name = pid
    ob.data.materials.append(vertex_material())
    path = os.path.join(OUT, f"{pid}.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False, export_vertex_color="ACTIVE",
                              export_animations=False, export_materials="EXPORT")
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    print(f"[hc] {path}: {tris} triangles", flush=True)
