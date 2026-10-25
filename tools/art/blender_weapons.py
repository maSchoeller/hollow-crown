"""Hollow Crown – weapon library of the board figures (GA9, concept/23-art-direction §4.2).

blender -b --factory-startup --python tools/art/blender_weapons.py -- [<out_dir>] [<id> ...]

One small glTF per weapon group: sword, dagger, lance, axe, bow, book, staff, shield, lute (art/models/weapons/<id>.glb). The
renderer hangs them on a figure's hand socket at runtime (src/render/models.ts), chosen by the equipped weapon's
group (content/render.yaml `weapons`), instead of baking a weapon into every figure.

Socket frame (tools/art/prepare_tripo_unit.py sockets()): origin in the fist, +Z the grip axis pointing forward in
the rest pose, +Y up along the forearm, +X = Y × Z (the figure's left, i.e. outward for the left hand).
Units: 1 = one board tile before figureScale, like the figures (Kael is 0.8 tall).
Colours: vertex colours (COLOR_0, linear) from Hollow-64, team cloth as key K2 in vertex alpha like the figures.
Round chibi look: chunky parts, smooth round ends, few hundred triangles each.
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
OUT = argv[0] if argv else os.path.join(ROOT, "art", "models", "weapons")
PALETTE = [l.strip() for l in open(os.path.join(ROOT, "art", "palette", "hollow-64.hex")) if l.strip()]
TEAM = (0.85, 0.85, 0.85, 3 / 8)  # team key K2 (src/render/models.ts teamColours)


def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def pal(i):
    """Hollow-64 colour (1-based like art/palette/hollow-64.hex lines) in linear RGBA."""
    h = PALETTE[i - 1]
    return tuple(lin(int(h[k:k + 2], 16) / 255) for k in (0, 2, 4)) + (1.0,)


STEEL, STEEL_DARK, GOLD, LEATHER, WOOD, WOOD_LIGHT = pal(27), pal(26), pal(43), pal(22), pal(22), pal(23)
PAPER, CRYSTAL, COVER, STRING = pal(6), pal(37), pal(14), pal(10)

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


def sphere(c, r, rgba, scale=(1, 1, 1)):
    me = bm_mesh(lambda bm: bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r,
                                                        matrix=Matrix.Translation(c) @ Matrix.Diagonal((*scale, 1))))
    return add(me, rgba, smooth=True)


def box(c, size, rgba, bevel=0.0):
    def build(bm):
        bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation(c) @ Matrix.Diagonal((*size, 1)))
        if bevel:
            bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=2, affect="EDGES")
    return add(bm_mesh(build), rgba, smooth=bevel > 0)


def prism(outline, depth, rgba, axis="X"):
    """Flat shape: polygon `outline` of (u, v) extruded by `depth`, centred on the plane x = 0 (u = y, v = z) or y = 0."""
    def build(bm):
        ring = []
        for d in (-depth / 2, depth / 2):
            ring.append([bm.verts.new((d, u, v) if axis == "X" else (u, d, v)) for u, v in outline])
        bm.faces.new(ring[0][::-1])
        bm.faces.new(ring[1])
        n = len(outline)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ring[0][i], ring[0][j], ring[1][j], ring[1][i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add(bm_mesh(build), rgba)


def blade(z0, z1, width, thick, tip, rgba):
    """Sword blade along +Z, flat side up (width along X), diamond section, pointed tip."""
    def build(bm):
        sec = [(width / 2, 0), (0, thick / 2), (-width / 2, 0), (0, -thick / 2)]
        lo = [bm.verts.new((x, y, z0)) for x, y in sec]
        hi = [bm.verts.new((x, y, z1)) for x, y in sec]
        point = bm.verts.new((0, 0, z1 + tip))
        bm.faces.new(lo[::-1])
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
            bm.faces.new((hi[i], hi[j], point))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add(bm_mesh(build), rgba)


def along(d, n, s, off=0.0):
    """Point at distance s along direction d plus off along n."""
    return tuple(d * s + n * off)


def sword():
    cylinder((0, 0, -0.05), (0, 0, 0.045), 0.016, LEATHER)
    sphere((0, 0, -0.065), 0.024, GOLD)
    box((0, 0, 0.055), (0.13, 0.03, 0.026), GOLD, bevel=0.008)
    blade(0.066, 0.36, 0.066, 0.02, 0.06, STEEL)


def dagger():
    # a short chunky blade in the sword's grip (a quick stab reads at board size only when the blade stays stubby)
    cylinder((0, 0, -0.035), (0, 0, 0.03), 0.016, LEATHER)
    sphere((0, 0, -0.05), 0.022, GOLD)
    box((0, 0, 0.04), (0.1, 0.03, 0.022), GOLD, bevel=0.007)
    blade(0.05, 0.17, 0.06, 0.022, 0.05, STEEL)


def lance():
    first = len(parts)
    cylinder((0, 0, -0.26), (0, 0, 0.5), 0.017, WOOD)
    sphere((0, 0, -0.27), 0.022, STEEL_DARK)
    cylinder((0, 0, 0.49), (0, 0, 0.52), 0.024, GOLD)
    blade(0.52, 0.58, 0.07, 0.024, 0.09, STEEL)
    prism([(0.0, 0.47), (0.0, 0.36), (-0.1, 0.43)], 0.008, TEAM)  # pennant below the tip, hanging down
    # built in the thrust grip: the thrust punches the fist forward, so the lance runs 55° from the grip axis towards
    # the fingers and points forward; outside attacks the renderer turns it upright (content/render.yaml gear hold).
    # Beside the forearm (-X: outward of the right hand), so the upright lance does not cut through it.
    for ob in parts[first:]:
        ob.data.transform(Matrix.Translation((-0.03, 0, 0)) @ Matrix.Rotation(math.radians(55), 4, "X"))


def axe():
    cylinder((0, 0, -0.1), (0, 0, 0.3), 0.018, WOOD)
    sphere((0, 0, 0.305), 0.02, STEEL_DARK)
    # head: a broad rounded crescent on the lower side (the edge leads in a downward chop), a short spike above
    arc = [(-0.02, 0.17)] + [(-0.1 - 0.07 * math.cos(t), 0.25 + 0.1 * math.sin(t))
                             for t in [(-0.5 + i / 6) * math.pi for i in range(7)]] + [(-0.02, 0.29)]
    prism(arc, 0.026, STEEL)
    prism([(-0.02, 0.215), (-0.02, 0.255), (0.06, 0.235)], 0.02, STEEL_DARK)
    box((0, -0.012, 0.235), (0.05, 0.05, 0.08), STEEL_DARK, bevel=0.01)


def bow():
    d = Vector((0, math.sin(math.radians(45)), math.cos(math.radians(45))))  # up and forward
    n = Vector((0, -d.z, d.y))  # the bow bulges away from the archer
    half, bulge, segs = 0.25, 0.07, 6
    pts = [along(d, n, s, bulge * (1 - (s / half) ** 2) - bulge) for s in [half * (i / segs * 2 - 1) for i in range(segs + 1)]]
    for i in range(segs):
        r = 0.015 - 0.006 * abs(i - segs / 2 + 0.5) / (segs / 2)
        cylinder(pts[i], pts[i + 1], r, WOOD_LIGHT, segs=8)
    for p in (pts[0], pts[-1]):
        sphere(p, 0.014, WOOD)
    cylinder(along(d, n, -0.035), along(d, n, 0.035), 0.02, LEATHER)
    cylinder(pts[0], pts[-1], 0.004, STRING, segs=4)


def book():
    box((0, 0.0, 0.05), (0.055, 0.16, 0.13), COVER, bevel=0.008)
    box((0, 0.0, 0.056), (0.042, 0.148, 0.128), PAPER)  # pages show on the three open edges
    for x in (-0.03, 0.03):
        sphere((x, 0.0, 0.05), 0.022, GOLD, scale=(0.35, 1, 1))  # emblem on both covers
    box((0, 0.0, -0.014), (0.062, 0.166, 0.024), COVER, bevel=0.008)  # round spine in the fist
    for y in (-0.05, 0.05):
        box((0, y, -0.014), (0.066, 0.014, 0.028), GOLD)  # spine bands


def staff():
    d = Vector((0, math.sin(math.radians(60)), math.cos(math.radians(60))))  # mostly upright when the arm hangs
    cylinder(along(d, d, -0.26), along(d, d, 0.42), 0.017, WOOD)
    sphere(along(d, d, -0.27), 0.02, WOOD_LIGHT)
    cylinder(along(d, d, 0.41), along(d, d, 0.44), 0.026, GOLD)
    sphere(along(d, d, 0.49), 0.05, CRYSTAL, scale=(0.8, 1.0, 0.8))
    for side in (-1, 1):
        cylinder(along(d, d, 0.43), Vector(along(d, d, 0.5)) + Vector((side * 0.045, 0, 0)), 0.008, GOLD, segs=6)


def shield():
    c = Vector((0.04, 0.03, 0.0))  # outward of the left fist, a little up the forearm
    x = Vector((1, 0, 0))
    cylinder(c - x * 0.016, c + x * 0.016, 0.14, STEEL_DARK, segs=16)
    cylinder(c - x * 0.02, c + x * 0.02, 0.118, TEAM, segs=16)
    for s in (-1, 1):
        sphere(c + x * 0.02 * s, 0.035, STEEL, scale=(0.6, 1, 1))


def lute():
    # held by the neck in the left fist, the neck along the grip axis, the pear-shaped body out in front with its flat
    # sides facing outward / inward (like the shield, so it reads from the side), the head bent back behind the fist
    def bout(z, r, sy, sz):
        me = bm_mesh(lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=r,
                                                           matrix=Matrix.Translation((0, 0, z)) @ Matrix.Diagonal((0.55, sy, sz, 1))))
        add(me, WOOD_LIGHT, smooth=True)
    bout(0.27, 0.1, 1.0, 1.15)  # lower bout
    bout(0.17, 0.07, 0.95, 1.0)  # upper bout
    cylinder((0, 0, -0.03), (0, 0, 0.3), 0.017, WOOD, segs=8)  # neck, through the body
    cylinder((0.0, 0, 0.1), (0.0, 0, 0.2), 0.02, STEEL_DARK, segs=8)  # fretboard
    for s in (-1, 1):
        cylinder((0.055 * s, 0, 0.27), (0.066 * s, 0, 0.27), 0.032, GOLD, segs=8)  # sound hole rosette on both faces
    cylinder((0, 0, -0.03), (0, -0.04, -0.09), 0.019, WOOD, segs=8)  # head bent back
    for s in (-1, 1):
        cylinder((0.022 * s, -0.04, -0.09), (0.04 * s, -0.04, -0.09), 0.011, GOLD, segs=5)  # tuning pegs
    box((0.03, 0, 0.17), (0.005, 0.012, 0.28), STRING)  # strings along the neck and over the body


WEAPONS = {"sword": sword, "dagger": dagger, "lance": lance, "axe": axe, "bow": bow, "book": book, "staff": staff,
           "shield": shield, "lute": lute}


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
for wid in argv[1:] or list(WEAPONS):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    parts.clear()
    WEAPONS[wid]()
    with bpy.context.temp_override(active_object=parts[0], selected_editable_objects=parts):
        bpy.ops.object.join()
    ob = parts[0]
    ob.name = wid
    ob.data.materials.append(vertex_material())
    path = os.path.join(OUT, f"{wid}.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False, export_vertex_color="ACTIVE",
                              export_animations=False, export_materials="EXPORT")
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    print(f"[hc] {path}: {tris} triangles", flush=True)
