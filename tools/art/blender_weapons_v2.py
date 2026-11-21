"""Hollow Crown – weapon library v2 (probe): high quality, runed weapons for the board figures' hand socket.

blender -b --factory-startup --python tools/art/blender_weapons_v2.py -- [<out_dir>] [<id> ...]

Writes art/models/weapons-v2/<id>.glb (default). Only `axe` exists so far; add sword/shield/spear as functions in
WEAPONS that fill the scene with `Builder` helpers and return the metal object + optional rune parts.

Frame (identical to tools/art/blender_weapons.py / public/assets/models/weapons/axe.glb, built in Blender Z-up and
exported with the default glTF Y-up conversion, so in the glb: Blender Z -> glTF +Y, Blender Y -> glTF -Z):
  origin in the fist, haft along Blender +Z (the grip axis), the blade on the -Y side (glTF +Z), the blade face
  normal along +/-X (blade thickness in X). Units: 1 = one board tile before figureScale. Old axe: z -0.10..0.325.
Colours: vertex colours (COLOR_0, linear) from art/palette/hollow-64.hex, alpha 1 (team key K2 not used).

Parts (separate meshes/materials so the game can light and hide them):
  axe          object + material `HC_Vertex` (vertex colours: steel, wood, leather), includes the main settings (rim + four prongs).
  rune_channel object + material `rune_channel`: thin V-shaped strip inside the engraved groove (both faces), lifted
               CH_LIFT above the groove floor. UV map 1 (glTF TEXCOORD_1, named `fill`): U = fill 0 (at the socket) .. 1
               (far end of the groove), V = 0. UV map 0 is a dummy. Light the first 1/3, 2/3, all of it for tier I, II, III.
  rune_socket2 object + material `HC_Vertex`: the second, small setting (rim + four small prongs, radius 0.55 x SOCKET_R,
               no channel) on both faces; hide it for common items.
  (no placeholder dome any more: the stones come from art/models/runes-v2/<rune>.glb)

Stone nodes (empty glTF nodes, no mesh), the contract for the game (docs of the kit: STONE NODE CONVENTION below):
  socket_rune_a_r / socket_rune_a_l   main setting, face +X (r) / -X (l) of the blade, at the socket centre
  socket_rune_b_r / socket_rune_b_l   small setting on the block (Tuelle) face +X / -X, scale 0.55 on the node

STONE NODE CONVENTION. A stone glb (runes-v2) has its origin at the centre of the flat base, the dome along its local +X
and the symbol "up" along its local +Y (glTF) = Blender +Z. A socket node has exactly that frame: parent the stone's root to
the node with an identity local transform and the stone sits flush in the setting (base STONE_SINK below the socket floor so
it is not coplanar with the metal). Node origin = stone base centre, node +X (dome) points out of the metal, node +Y (glTF)
is the symbol up. In the Blender build frame the right-hand node has identity rotation, the left-hand one is turned 180
degrees about the haft axis (Z) so the dome points out of the other face. The small settings carry scale 0.55 on the node.
Names ending _r / _l are the sides +X / -X of the build frame (axe: blade faces; sword: the faces before the final 90 degree
turn, lance/shield see their docstrings).

Triangles: axe 6 512 + rune_channel 256 + rune_socket2 928 = 7 696 (budget 8 500). Sibling scripts: sword 8 130, lance 8 478, shield 8 124. Stones: 388 (earth_rune_3) .. 1 460 (dark_rune_1), budget 2 000.
"""
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.join(ROOT, "art", "models", "weapons-v2")
PALETTE = [l.strip() for l in open(os.path.join(ROOT, "art", "palette", "hollow-64.hex")) if l.strip()]


def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def pal(i):
    h = PALETTE[i - 1]
    return np.array([lin(int(h[k:k + 2], 16) / 255) for k in (0, 2, 4)] + [1.0])


# warm hammered iron: blends of the violet-grey and the brown-grey ramps of Hollow-64
STEEL_D = 0.25 * pal(3) + 0.75 * pal(51) * 0.85
STEEL_M = 0.3 * pal(4) + 0.7 * pal(52) * 0.8
STEEL_L = 0.3 * pal(5) + 0.7 * pal(6)
STEEL_D[3] = STEEL_M[3] = STEEL_L[3] = 1.0
WOOD_D, WOOD_M, WOOD_L = pal(22), pal(23), pal(24)
LEATHER_D, LEATHER_M, LEATHER_L = pal(7), pal(8), pal(12)
STONE_D, STONE_L = pal(3), pal(5)
GLOW_DIM = pal(14)


def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def lerp(a, b, t):
    return a + (b - a) * t


def vnoise(y, z, scale, seed=0):
    """Smooth 2D value noise 0..1 (hash lattice), for hammered / grain variation."""
    def h(i, j):
        n = (i * 374761393 + j * 668265263 + seed * 144665) & 0xFFFFFFFF
        n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
        return ((n ^ (n >> 16)) & 0xFFFF) / 65535.0
    u, v = y / scale, z / scale
    i, j = math.floor(u), math.floor(v)
    fu, fv = smooth(u - i), smooth(v - j)
    return lerp(lerp(h(i, j), h(i + 1, j), fu), lerp(h(i, j + 1), h(i + 1, j + 1), fu), fv)


# ---------------------------------------------------------------- scene helpers
def new_obj(name, me):
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def mesh_from_bm(bm, name):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def select_only(ob):
    for o in bpy.context.scene.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob


def boolean(ob, cutter, op="DIFFERENCE"):
    print(f"[hc] boolean {op} {ob.name} - {cutter.name}", flush=True)
    select_only(ob)
    m = ob.modifiers.new("b", "BOOLEAN")
    m.operation = op
    m.solver = "MANIFOLD"
    m.object = cutter
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def join(obs, name):
    select_only(obs[0])
    for o in obs:
        o.select_set(True)
    bpy.ops.object.join()
    obs[0].name = name
    return obs[0]


def set_colours(ob, fn):
    """fn(co: Vector, normal: Vector) -> rgba array; stored per corner in the colour attribute `Col`."""
    me = ob.data
    for a in list(me.color_attributes):
        me.color_attributes.remove(a)
    col = me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
    cols = {}
    for li, loop in enumerate(me.loops):
        v = me.vertices[loop.vertex_index]
        if loop.vertex_index not in cols:
            cols[loop.vertex_index] = fn(v.co, v.normal)
        c = cols[loop.vertex_index]
        col.data[li].color = tuple(float(x) for x in c)
    me.color_attributes.active_color = col
    me.color_attributes.render_color_index = list(me.color_attributes).index(col)


def shade(ob, angle=50, flat_fn=None):
    select_only(ob)
    for p in ob.data.polygons:
        p.use_smooth = True
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle))


def lathe(profile, segs, axis="Z", close_ends=True, loop=False):
    """Surface of revolution of [(r, h), ...] around `axis` (r = 0 makes a pole); returns a bmesh."""
    bm = bmesh.new()
    rings = []
    for r, h in profile:
        if r < 1e-9:
            rings.append([bm.verts.new((0, 0, h))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), h))
                          for k in range(segs)])
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if loop else [])
    for a, b in pairs:
        for k in range(segs):
            k2 = (k + 1) % segs
            if len(a) == 1:
                bm.faces.new((a[0], b[k2], b[k]))
            elif len(b) == 1:
                bm.faces.new((a[k], a[k2], b[0]))
            else:
                bm.faces.new((a[k], a[k2], b[k2], b[k]))
    if close_ends:
        for ring in (rings[0], rings[-1]):
            if len(ring) > 2:
                bm.faces.new(ring)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == "X":  # turn Z-axis lathe into an X-axis one (h along +X)
        bmesh.ops.transform(bm, matrix=Matrix.Rotation(math.radians(90), 4, "Y"), verts=bm.verts)
    return bm


def box_bm(c, size, bevel=0.0, segs=1):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    bmesh.ops.translate(bm, vec=c, verts=bm.verts)
    if bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=segs, affect="EDGES")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


# ---------------------------------------------------------------- 2D shape helpers (blade plane: u = Y, v = Z)
def bez(pts, n):
    out = []
    for i in range(n + 1):
        t = i / n
        k = len(pts) - 1
        # de Casteljau
        p = [np.array(q, float) for q in pts]
        while len(p) > 1:
            p = [p[j] * (1 - t) + p[j + 1] * t for j in range(len(p) - 1)]
        out.append(tuple(p[0]))
    return out


def dist_to_poly(pts, poly):
    """Distance of points (N,2) to the closed polyline `poly` (M,2), vectorised over the segments."""
    a = poly
    ab = np.roll(poly, -1, axis=0) - a
    L2 = np.maximum((ab ** 2).sum(1), 1e-12)
    pts = np.asarray(pts, float).reshape(-1, 2)
    ap = pts[:, None, :] - a[None, :, :]
    t = np.clip((ap * ab[None]).sum(2) / L2[None], 0, 1)
    q = ap - t[:, :, None] * ab[None]
    return np.sqrt((q ** 2).sum(2)).min(1)


# ---------------------------------------------------------------- SETTING KIT (also executed by blender_weapon_sword.py)
PRONG_SIZE = (0.0170, 0.0135, 0.0125)   # claw: height (along the face normal), radial, tangential
PRONG_BEVEL = 0.0046
SOCKET2_F = 0.55                        # small setting = main setting x this
STONE_SINK = 0.0004                     # stone base this far below the socket floor (no coplanar faces)
CH_LIFT = 0.0010                        # channel strip above the groove floor (apex); edges CH_LIFT * 0.7


def local_frame(loc, rot_z=0.0, scale=1.0, pre=None):
    """Node matrix: translation `loc`, rotation `rot_z` about Z, uniform scale; `pre` (4x4) is applied last (final frame)."""
    m = Matrix.Translation(loc) @ Matrix.Rotation(rot_z, 4, "Z") @ Matrix.Diagonal((scale, scale, scale, 1.0))
    return pre @ m if pre is not None else m


def add_node(name, matrix):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_type = "ARROWS"
    ob.empty_display_size = 0.02
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = matrix
    return ob


def setting_parts(matrix, h, f=1.0, segs=24, prong_bevel_segs=2, prong_offset_deg=0):
    """Rim + four claws of a setting in the stone frame (dome +X, origin = stone base centre); `h` = height of the metal
    surface above the stone base, f = scale (1 main, SOCKET2_F small). `matrix` places the frame in the weapon.
    Returns (rim object, [claw objects]) with fixed normals."""
    arcs = (0, 30, 60, 90, 120, 150, 180)
    prof = [(f * (SOCKET_R - 0.0005), h - 0.0015 * f)]         + [(f * (SOCKET_R + 0.0050 - 0.0055 * math.cos(math.radians(a))), h + f * (0.0010 + 0.0042 * math.sin(math.radians(a)))) for a in arcs]         + [(f * (SOCKET_R + 0.0105), h - 0.0015 * f)]
    rim = lathe(prof, segs, axis="X", close_ends=False, loop=True)
    bmesh.ops.transform(rim, matrix=matrix, verts=rim.verts)
    bmesh.ops.recalc_face_normals(rim, faces=rim.faces)
    rim_o = new_obj("rim", mesh_from_bm(rim, "rim"))
    claws = []
    for k in range(4):
        a = math.radians(prong_offset_deg + 90 * k)
        bm = box_bm((0, 0, 0), tuple(v * f for v in PRONG_SIZE), bevel=PRONG_BEVEL * f, segs=prong_bevel_segs)
        bmesh.ops.translate(bm, vec=(h + f * 0.0026, f * (SOCKET_R + 0.0003), 0), verts=bm.verts)
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(a, 3, "X"), verts=bm.verts)
        bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        claws.append(new_obj("prong", mesh_from_bm(bm, "prong")))
    return rim_o, claws


def make_socket2(parts, fn_colour, name="rune_socket2"):
    """Join the small-setting pieces into one object `rune_socket2` (material set by the caller's make_materials)."""
    for p in parts:
        set_colours(p, fn_colour)
        shade(p, 40)
    ob = join(parts, name)
    ob.data.name = name
    return ob


def finish_socket2(ob):
    mat_ = bpy.data.materials["HC_Vertex"]
    ob.data.materials.clear()
    ob.data.materials.append(mat_)


# ---------------------------------------------------------------- axe
# haft
HAFT_R = 0.0225
Z_BOTTOM, Z_TOP = -0.10, 0.362
# head
T_TIP, B_TIP, E_FAR = (-0.133, 0.377), (-0.11, 0.181), -0.188
BLOCK_Y, BLOCK_Z0, BLOCK_Z1, BLOCK_X = 0.033, 0.249, 0.339, 0.031
BLOCK_BEVEL = 0.0125      # rounded socket (Tuelle) block, was 0.0095 / 3 segments (boxy)
SOCKET2_C = (0.0, 0.288)  # small setting on the block faces (y, z)
FACE = 0.0092        # panel face height (|x|)
SOCKET_C = (-0.072, 0.284)
SOCKET_R = 0.0258
FLOOR = 0.0028       # socket floor |x|
GROOVE_HW, GROOVE_DEPTH = 0.0036, 0.0034


def blade_outline():
    top = bez([(0.0, BLOCK_Z1), (-0.033, BLOCK_Z1), (-0.07, 0.325), T_TIP], 1)  # placeholder replaced below
    edge = bez([T_TIP, (-0.215, 0.395), (-0.205, 0.16), B_TIP], 40)
    top_c = bez([(-0.033, BLOCK_Z1 - 0.003), (-0.09, 0.300), T_TIP], 14)       # concave scoop block -> upper horn
    bot_c = bez([B_TIP, (-0.10, 0.248), (-0.033, BLOCK_Z0 + 0.001)], 14)
    pts = [(0.0, BLOCK_Z1 - 0.003)] + top_c[:-1] + edge[:-1] + bot_c[:-1] + [(-0.033, BLOCK_Z0 + 0.001), (0.0, BLOCK_Z0 + 0.001)]
    return np.array(pts)


def groove_path(outline):
    """Socket rim -> up and around -> along the cutting edge (offset inward), returns list of (y, z)."""
    edge = np.array(bez([T_TIP, (-0.215, 0.395), (-0.205, 0.16), B_TIP], 200))
    tang = np.gradient(edge, axis=0)
    tang /= np.linalg.norm(tang, axis=1)[:, None]
    nrm = np.stack([-tang[:, 1], tang[:, 0]], 1)            # rotate +90deg
    mid = edge[len(edge) // 2]
    if (np.array([0, 0.28]) - mid) @ nrm[len(edge) // 2] < 0:
        nrm = -nrm                                          # point to the blade interior
    off = edge + nrm * 0.047
    i0, i1 = int(0.64 * 200), int(0.15 * 200)
    arc = off[i1:i0 + 1][::-1]                               # from the lower join up to the upper horn
    up = -tang[i0] if tang[i0][1] < 0 else tang[i0]           # path direction at the join (upwards)
    sc = np.array(SOCKET_C)
    a0 = math.radians(240)
    start = sc + SOCKET_R * 0.9 * np.array([math.cos(a0), math.sin(a0)])
    dir0 = np.array([math.cos(a0 + math.radians(-80)), math.sin(a0 + math.radians(-80))])
    dir0 = np.array([math.cos(math.radians(212)), math.sin(math.radians(212))]); dir0 /= np.linalg.norm(dir0)
    lead = np.array(bez([tuple(start), tuple(start + dir0 * 0.02), tuple(arc[0] - up * 0.02), tuple(arc[0])], 16))
    pts = np.vstack([lead[:-1], arc[::3]])
    return chaikin(pts, 3)


def chaikin(pts, n):
    """Corner cutting (keeps the end points) so sweeps never fold over themselves."""
    for _ in range(n):
        q = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            q += [0.75 * a + 0.25 * b, 0.25 * a + 0.75 * b]
        q.append(pts[-1])
        pts = np.array(q)
    return pts


def resample(pts, step):
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    n = max(int(s[-1] / step), 4)
    ss = np.linspace(0, s[-1], n + 1)
    return np.stack([np.interp(ss, s, pts[:, 0]), np.interp(ss, s, pts[:, 1])], 1), ss / s[-1]


def sweep_groove(path, sign, hw, x_top, x_apex):
    """Closed triangular prism swept along the path on the face at sign*x (cutter solid)."""
    bm = bmesh.new()
    tang = np.gradient(path, axis=0)
    tang /= np.linalg.norm(tang, axis=1)[:, None]
    rings = []
    for p, t in zip(path, tang):
        n = np.array([-t[1], t[0]])
        prof = [(-hw, x_top), (hw, x_top), (0.0, x_apex)]
        rings.append([bm.verts.new((sign * x, p[0] + n[0] * o, p[1] + n[1] * o)) for o, x in prof])
    for a, b in zip(rings, rings[1:]):
        for k in range(3):
            k2 = (k + 1) % 3
            bm.faces.new((a[k], a[k2], b[k2], b[k]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def x_face(d):
    """Blade half-thickness at distance d from the outline: lens bevel, then a slightly recessed panel."""
    bevel = 0.0016 + (FACE + 0.0008 - 0.0016) * smooth(d / 0.03) ** 0.8
    return bevel - 0.0008 * smooth((d - 0.03) / 0.010)


def build_blade():
    outline = blade_outline()
    # 1. dense solid plate, intersected with the outline prism
    nx, nz, sp = 30, 36, 0.0068
    y0, z0 = -0.2057 + 0.00173 + 0.0008, 0.159 + 0.00117 + 0.0013
    bm = bmesh.new()
    for i in range(nz + 1):
        pass
    bmesh.ops.create_grid(bm, x_segments=nx, y_segments=nz, size=1.0)
    bmesh.ops.scale(bm, vec=(nx * sp / 2, nz * sp / 2, 1), verts=bm.verts)
    for v in bm.verts:   # grid lies in XY -> (y, z); shift to the blade bbox
        v.co = Vector((0, v.co.x + y0 + nx * sp / 2, v.co.y + z0 + nz * sp / 2))
    res = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    top = [v for v in res["geom"] if isinstance(v, bmesh.types.BMVert)]
    for v in bm.verts:
        v.co.x = -0.011
    for v in top:
        v.co.x = 0.011
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    plate = new_obj("plate", mesh_from_bm(bm, "plate"))
    # outline prism
    bm = bmesh.new()
    ring = [[bm.verts.new((d, u, v)) for u, v in outline] for d in (-0.02, 0.02)]
    bm.faces.new(ring[0][::-1])
    bm.faces.new(ring[1])
    n = len(outline)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((ring[0][i], ring[0][j], ring[1][j], ring[1][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    boolean(plate, new_obj("outline", mesh_from_bm(bm, "outline")), "INTERSECT")
    # 2. lens taper + recessed panel
    me = plate.data
    co = np.array([v.co[:] for v in me.vertices])
    d = dist_to_poly(co[:, 1:], outline)
    for v, dd in zip(me.vertices, d):
        v.co.x = math.copysign(x_face(dd), v.co.x)
    return plate, outline


def dent_plate(plate, outline, gp):
    """Hammered look: small dents in the blade faces (not near the setting or the groove)."""
    me = plate.data
    co = np.array([v.co[:] for v in me.vertices])
    d = dist_to_poly(co[:, 1:], outline)
    dg = np.full(len(co), 1e9)
    for p in gp:
        dg = np.minimum(dg, np.hypot(co[:, 1] - p[0], co[:, 2] - p[1]))
    rs = np.hypot(co[:, 1] - SOCKET_C[0], co[:, 2] - SOCKET_C[1])
    for i, v in enumerate(me.vertices):
        if abs(v.co.x) < 0.0075 or co[i, 1] > -0.034:
            continue
        w = smooth(d[i] / 0.012) * smooth((rs[i] - SOCKET_R - 0.003) / 0.006) * smooth((dg[i] - GROOVE_HW * 1.4) / 0.004)
        n = vnoise(v.co.y, v.co.z, 0.0125, 21) + 0.5 * vnoise(v.co.y, v.co.z, 0.007, 22) - 0.75
        v.co.x += math.copysign(0.00055 * n * w, v.co.x)


def build_rune_setting(path):
    """Returns (plate cutters applied) pieces: socket recess + groove cut, rim, prongs, stones, channel strips."""
    sy, sz = SOCKET_C
    path_pts, fill = resample(path, 0.0045)
    return path_pts, fill


def axe():
    plate, outline = build_blade()
    path = groove_path(outline)
    gp, fill = resample(path, 0.0045)
    v = np.diff(gp, axis=0)
    ang = np.unwrap(np.arctan2(v[:, 1], v[:, 0]))
    radius = np.linalg.norm(v, axis=1)[1:] / np.maximum(np.abs(np.diff(ang)), 1e-6)
    print(f"[hc] groove path: {len(gp)} pts, length {np.linalg.norm(v, axis=1).sum():.3f}, min bend radius {radius.min():.4f}")
    # socket recess (both faces) and V groove (both faces) cut into the plate
    for s in (1, -1):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=SOCKET_R, radius2=SOCKET_R, depth=0.03,
                              matrix=Matrix.Translation((s * (FLOOR + 0.015), SOCKET_C[0], SOCKET_C[1])) @ Matrix.Rotation(math.radians(90), 4, "Y"))
        boolean(plate, new_obj("socket", mesh_from_bm(bm, "socket")))
    gx_top = FACE + 0.003
    gx_apex = FACE - GROOVE_DEPTH
    hw_top = GROOVE_HW + (gx_top - FACE) * (GROOVE_HW / GROOVE_DEPTH)
    for s in (1, -1):   # one cutter per face (a joined two-solid cutter makes the boolean crawl)
        boolean(plate, new_obj("g", mesh_from_bm(sweep_groove(gp, s, hw_top, gx_top, gx_apex), "g")))
    assert len(plate.data.vertices) > 800, "groove boolean destroyed the blade"

    print('[hc] dent', flush=True)
    dent_plate(plate, outline, gp)
    print('[hc] parts', flush=True)
    parts = [plate]
    # --- rim + prongs, channel strips, stone nodes (both faces)
    strips, nodes = [], []
    for s in (1, -1):
        M = local_frame((s * (FLOOR - STONE_SINK), SOCKET_C[0], SOCKET_C[1]), 0.0 if s > 0 else math.pi)
        rim_o, claws = setting_parts(M, FACE - FLOOR + STONE_SINK)
        parts += [rim_o] + claws
        nodes.append(add_node("socket_rune_a_r" if s > 0 else "socket_rune_a_l", M))
        strips.append(channel_strip(gp, fill, s))

    # --- haft (wood), leather grip, block, rivets
    wood_prof = [(0.0, Z_BOTTOM), (0.0165, Z_BOTTOM + 0.0005), (0.0255, Z_BOTTOM + 0.007), (0.0268, Z_BOTTOM + 0.019),
                 (0.0250, Z_BOTTOM + 0.034), (0.0240, Z_BOTTOM + 0.040), (HAFT_R, -0.04), (HAFT_R, 0.07), (HAFT_R, 0.20),
                 (HAFT_R, 0.30), (HAFT_R, Z_TOP - 0.004), (HAFT_R - 0.002, Z_TOP), (0.0, Z_TOP)]
    haft = new_obj("haft", mesh_from_bm(lathe(wood_prof, 20), "haft"))
    parts.append(haft)
    parts.append(build_leather())
    block = new_obj("block", mesh_from_bm(box_bm((0, 0, (BLOCK_Z0 + BLOCK_Z1) / 2), (BLOCK_X * 2, BLOCK_Y * 2, BLOCK_Z1 - BLOCK_Z0),
                                                bevel=BLOCK_BEVEL, segs=4), "block"))
    parts.append(block)
    for s in (1, -1):
        bm = lathe([(0.0, 0.0), (0.0065, 0.0), (0.0085, 0.0016), (0.0082, 0.0036), (0.0055, 0.0056), (0.0, 0.0062)], 14, axis="X", close_ends=False)
        if s < 0:
            bmesh.ops.transform(bm, matrix=Matrix.Diagonal((-1, 1, 1, 1)), verts=bm.verts)
            bmesh.ops.reverse_faces(bm, faces=bm.faces)
        bmesh.ops.translate(bm, vec=(s * (BLOCK_X - 0.0008), 0.0, 0.322), verts=bm.verts)
        parts.append(new_obj("rivet", mesh_from_bm(bm, "rivet")))

    # --- small second setting on both block faces (own mesh rune_socket2)
    s2 = []
    for s in (1, -1):
        M = local_frame((s * (BLOCK_X - STONE_SINK), SOCKET2_C[0], SOCKET2_C[1]), 0.0 if s > 0 else math.pi, SOCKET2_F)
        rim_o, claws = setting_parts(Matrix.Translation((s * (BLOCK_X - STONE_SINK), SOCKET2_C[0], SOCKET2_C[1]))
                                     @ Matrix.Rotation(0.0 if s > 0 else math.pi, 4, "Z"), STONE_SINK, SOCKET2_F, 16, 1)
        s2 += [rim_o] + claws
        nodes.append(add_node("socket_rune_b_r" if s > 0 else "socket_rune_b_l", M))
    sock2 = make_socket2(s2, lambda co, n: lerp_c(STEEL_M, STEEL_L, 0.45 + 0.35 * smooth((abs(co.x) - BLOCK_X) / 0.004)
                                                  + 0.1 * (vnoise(co.y, co.z, 0.006, 15) - 0.5)))
    print('[hc] join', flush=True)
    metal = join(parts, "axe")
    shade(metal, 32)
    print('[hc] colours', flush=True)
    set_colours(metal, axe_colour(outline, gp))
    print('[hc] colours done', flush=True)
    chan = join(strips, "rune_channel")
    set_colours(chan, lambda co, n: GLOW_DIM)
    return metal, chan, sock2


def lerp_c(a, b, t):
    return a * (1 - t) + b * t


def channel_strip(gp, fill, s):
    """Thin V strip lying a hair above the groove walls; second UV map `fill`."""
    bm = bmesh.new()
    tang = np.gradient(gp, axis=0)
    tang /= np.linalg.norm(tang, axis=1)[:, None]
    hw = GROOVE_HW * 0.82
    x_e = FACE - GROOVE_DEPTH + GROOVE_DEPTH * (hw / GROOVE_HW) + CH_LIFT * 0.7
    x_a = FACE - GROOVE_DEPTH + CH_LIFT
    cols = []
    for p, t in zip(gp, tang):
        n = np.array([-t[1], t[0]])
        cols.append([bm.verts.new((s * x_e, p[0] - n[0] * hw, p[1] - n[1] * hw)),
                     bm.verts.new((s * x_a, p[0], p[1])),
                     bm.verts.new((s * x_e, p[0] + n[0] * hw, p[1] + n[1] * hw))])
    for a, b in zip(cols, cols[1:]):
        for k in range(2):
            f = (a[k], a[k + 1], b[k + 1], b[k])
            bm.faces.new(f if s > 0 else f[::-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:   # outward = away from the blade centre plane
        if f.normal.x * s < 0:
            f.normal_flip()
    uv0 = bm.loops.layers.uv.new("uv0")
    uv1 = bm.loops.layers.uv.new("fill")
    idx = {}
    for i, c in enumerate(cols):
        for v in c:
            idx[v.index] = fill[i]
    for f in bm.faces:
        for l in f.loops:
            l[uv0].uv = (0.0, 0.0)
            l[uv1].uv = (float(idx[l.vert.index]), 0.0)
    me = mesh_from_bm(bm, "chan")
    return new_obj("chan", me)


def build_leather():
    segs, rings = 18, 26
    z0, z1 = -0.062, 0.068
    bm = bmesh.new()
    grid = []
    for i in range(rings + 1):
        z = lerp(z0, z1, i / rings)
        row = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            ph = (z / 0.026) + a / (2 * math.pi)
            ridge = 0.5 + 0.5 * math.cos(2 * math.pi * ph)
            r = HAFT_R + 0.0012 + 0.0024 * ridge ** 1.4
            if i == 0 or i == rings:
                r = HAFT_R + 0.0006
            row.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        grid.append(row)
    for a, b in zip(grid, grid[1:]):
        for k in range(segs):
            bm.faces.new((a[k], a[(k + 1) % segs], b[(k + 1) % segs], b[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj("leather", mesh_from_bm(bm, "leather"))


def axe_colour(outline, gp):
    sy, sz = SOCKET_C

    def fn(co, n):
        y, z, x = co.y, co.z, co.x
        r = math.hypot(x * 0, 0)
        # haft / pommel / leather by position on the haft axis
        rad = math.hypot(co.x, co.y)
        in_head_z = BLOCK_Z0 - 0.01 < z < BLOCK_Z1 + 0.01
        on_axis = rad < HAFT_R + 0.0045
        is_block = abs(x) <= BLOCK_X + 0.001 and abs(y) <= BLOCK_Y + 0.001 and BLOCK_Z0 - 0.001 <= z <= BLOCK_Z1 + 0.001
        if on_axis and not (BLOCK_Z0 - 0.001 <= z <= BLOCK_Z1 + 0.001 and rad > HAFT_R + 0.001) and abs(y) < 0.0285 and abs(x) < 0.0285 \
                and not (abs(x) > 0.012 and y > 0.0 and False):
            if -0.0625 < z < 0.0685 and rad > HAFT_R + 0.0004 and not (z > BLOCK_Z0):
                ang = math.atan2(co.y, co.x)
                ph = (z / 0.026) + ang / (2 * math.pi)
                ridge = 0.5 + 0.5 * math.cos(2 * math.pi * ph)
                c = lerp_c(LEATHER_D, LEATHER_M, ridge ** 0.7)
                c = lerp_c(c, LEATHER_L, 0.25 * vnoise(co.x * 40, z * 40, 1, 3) * ridge)
                return c
            ang = math.atan2(co.y, co.x)
            grain = vnoise(ang * 0.012, z, 0.02, 5) * 0.6 + vnoise(ang * 0.05, z * 4, 0.02, 6) * 0.4
            c = lerp_c(WOOD_M, WOOD_L, 0.15 + 0.7 * grain)
            c = lerp_c(c, WOOD_D, 0.45 * (1 - grain) ** 2)
            if z > 0.35:                       # top end grain a touch lighter
                c = lerp_c(c, WOOD_L, 0.6)
            if z < Z_BOTTOM + 0.003:
                c = lerp_c(c, WOOD_L, 0.5)
            return c
        pt = np.array([[y, z]])
        d = float(dist_to_poly(pt, outline)[0]) if (not is_block and y < 0.012) else 0.0
        h = vnoise(y, z, 0.0105, 11) * 0.6 + vnoise(y, z + 0.4 * abs(x) / 0.01, 0.0055, 12) * 0.4
        if is_block or abs(x) > FACE + 0.0075 or y > -0.001:
            c = lerp_c(STEEL_D, STEEL_M, 0.35 + 0.5 * h)
            # lighter rounded edges of the block
            edge = max(abs(x) - (BLOCK_X - BLOCK_BEVEL), 0) / BLOCK_BEVEL * 0.45 + max(abs(y) - (BLOCK_Y - BLOCK_BEVEL), 0) / BLOCK_BEVEL * 0.45
            return lerp_c(c, STEEL_L, min(edge, 0.55) * (0.6 + 0.4 * h))
        bevel = 1 - smooth((d - 0.014) / 0.02)
        c = lerp_c(lerp_c(STEEL_D, STEEL_M, 0.28 + 0.45 * h), lerp_c(STEEL_M, STEEL_L, 0.55 + 0.45 * h), bevel)
        # darker setting floor, bright metal rim and prongs
        rs = math.hypot(y - sy, z - sz)
        if abs(x) > FACE + 0.0006 and rs < 0.040:
            return lerp_c(STEEL_M, STEEL_L, 0.25 + 0.4 * h + (0.35 if abs(x) > FACE + 0.0045 else 0.0))
        if rs < SOCKET_R + 0.002:
            c = lerp_c(STEEL_D, STEEL_M, 0.15 + 0.3 * h)
        return c

    return fn


def finish_rim_colours():
    pass


WEAPONS = {"axe": axe}


def make_materials(metal, chan, sock2):
    m = bpy.data.materials.new("HC_Vertex")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.8
    metal.data.name = "axe"
    metal.data.materials.clear()
    metal.data.materials.append(m)
    metal.data.update()
    metal.data.attributes.new("material_index", "INT", "FACE") if "material_index" not in metal.data.attributes else None
    for p in metal.data.polygons:
        p.material_index = 0
    finish_socket2(sock2)
    for ob, name in ((chan, "rune_channel"),):
        ob.data.name = name
        mm = bpy.data.materials.new(name)
        mm.use_nodes = True
        b = mm.node_tree.nodes["Principled BSDF"]
        a = mm.node_tree.nodes.new("ShaderNodeVertexColor")
        a.layer_name = "Col"
        mm.node_tree.links.new(a.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.5
        ob.data.materials.append(mm)


os.makedirs(OUT, exist_ok=True)
for wid in argv[1:] or list(WEAPONS):
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    metal, chan, sock2 = WEAPONS[wid]()
    make_materials(metal, chan, sock2)
    path = os.path.join(OUT, f"{wid}.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False, export_vertex_color="ACTIVE",
                              export_animations=False, export_materials="EXPORT")
    tris = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in (metal, chan, sock2)}
    print(f"[hc] {path}: {sum(tris.values())} triangles {tris}", flush=True)
