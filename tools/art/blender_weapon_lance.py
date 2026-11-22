"""Hollow Crown – weapon library v2: the rune LANCE (one-handed spear), same look as the approved rune axe.

blender -b --factory-startup --python tools/art/blender_weapon_lance.py -- [<out_dir>]

Writes art/models/weapons-v2/lance.glb (default). Helpers, palette, the rune-setting constants and the SETTING KIT (stone
nodes, rim/claw builders, lifts; read the STONE NODE CONVENTION in its docstring) are taken from blender_weapons_v2.py (only
its definitions are executed, not its axe export), so socket diameter and depth are the axe's by construction. Previews: see
tools/art/blender_weapons_v2_sheet.py.

Frame = the old public/assets/models/weapons/lance.glb (tools/art/blender_weapons.py `lance`): built along Blender +Z with
the grip origin at z = 0 (fist), then tilted 55 deg about X (thrust grip) and moved to x = -0.03, so `hold: -125` in
content/core/render.yaml keeps working. Like the old blade the head is wide along X and flat towards +/-Y (rune faces on
+/-Y in the grip frame). Units: 1 = one board tile before figureScale.

Objects: `lance` (HC_Vertex, includes the main settings and the lower sleeve), `rune_channel` (V strip in the groove, UV map
1 `fill` = 0 at the socket .. 1 at the groove end), `rune_socket2` (small settings on the lower sleeve, HC_Vertex).
Nodes (empty): socket_rune_a_r / _a_l = main setting on the collar face that is +X / -X in the build frame (grip frame +Y /
-Y before the tilt rotation is applied to the node as well), socket_rune_b_r / _b_l = small setting on the sleeve 0.125 below
the collar (scale 0.55 on the node). The right node is the stone frame turned by the game-frame transform, the left one
additionally by 180 degrees about the shaft. Triangles: lance 7 182 + rune_channel 368 + rune_socket2 928 = 8 478.
"""
import math
import os
import sys

_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, "blender_weapons_v2.py"), encoding="utf-8").read()
_src = _src[:_src.index("os.makedirs(OUT, exist_ok=True)")]
_ns = {"__file__": os.path.join(_here, "blender_weapons_v2.py"), "__name__": "hc_weapons_v2"}
exec(compile(_src, "blender_weapons_v2.py", "exec"), _ns)
globals().update({k: v for k, v in _ns.items() if not k.startswith("__")})

import bmesh  # noqa: E402,F811
import bpy  # noqa: E402,F811
import numpy as np  # noqa: E402,F811
from mathutils import Matrix, Vector  # noqa: E402,F811

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
pos = [a for a in args if not a.startswith("--")]
OUT_DIR = pos[0] if pos else os.path.join(ROOT, "art", "models", "weapons-v2")

# ---------------------------------------------------------------- dimensions (grip frame, before the tilt)
SHAFT_R = 0.020
Z_BUTT = -0.262                      # shaft bottom; butt cap below
ZC = 0.322                           # collar centre (rune socket centre)
CX, CY, CZ = 0.0300, 0.050, 0.056
GW, GD = 0.0050, 0.0042           # groove half width at the surface / depth (lance only)    # collar half extents (x = face height, the rune sits on +/-x)
ZR = ZC + CZ                         # collar top
Z_TIP = 0.598
L_HEAD = Z_TIP - ZR
H0 = 0.0295                          # head ridge half thickness at the collar
STONE_DX = CX - FACE                 # the collar face is this much higher than the axe's panel face
S_GROOVE_END = 0.82                  # groove ends at this fraction of the exposed head
EDGE = 0.002
Z_G_START = ZC + SOCKET_R * 0.97
Z_G_END = ZR + S_GROOVE_END * L_HEAD
TILT_X, OFFSET_X = 55.0, -0.03       # old lance frame
ZSL = ZC - 0.125                     # lower sleeve centre (small settings)
CX2 = 0.0245                         # sleeve face height
GAME = Matrix.Translation((OFFSET_X, 0, 0)) @ Matrix.Rotation(math.radians(TILT_X), 4, "X") @ Matrix.Rotation(math.radians(90), 4, "Z")


_LW = None


def leaf_w(s):
    """Half width of the head: narrow waist above the collar, widest at ~28 %, straight taper to a pointed tip."""
    global _LW
    if _LW is None:
        ss = np.linspace(0, 1, 401)
        raw = np.interp(ss, [0, 0.06, 0.28, 0.52, 0.78, 0.93, 1.0], [0.034, 0.040, 0.068, 0.052, 0.027, 0.0095, 0.0])
        k = np.ones(15) / 15
        for _ in range(2):
            pad = np.concatenate([np.full(7, raw[0]), raw, np.full(7, raw[-1])])
            raw = np.convolve(pad, k, "valid")
        raw[-1] = 0.0
        _LW = (ss, raw)
    return 0.034 if s <= 0 else float(np.interp(min(s, 1.0), *_LW))


def leaf_h(s):
    if s <= 0:
        return H0
    return H0 * (1 - min(s, 1.0)) ** 0.55


RW = 0.24   # ridge plateau half width as a fraction of the head half width (a column of the head grid sits exactly there)


def head_x(a, w, h):
    """Half thickness: flat ridge plateau, a crisp crease, then a flat bevel face falling to a thin rounded edge."""
    e = min(0.0032, 0.3 * h)
    p = a / max(w, 1e-9)
    if p <= RW + 1e-6:
        return h
    t = (p - RW) / (1 - RW)
    x = lerp(0.86 * h, e, t)
    if t > 0.9:
        x = max(x, e * math.sqrt(max(1 - ((t - 0.9) / 0.1) ** 2, 0.0)) * 1.0)
    return x


def surface_x(z):
    """Height of the rune face / ridge crest on the centre line at z (collar, then the head ridge)."""
    if z < ZR - 0.011:
        return CX
    return H0 if z < ZR else leaf_h((z - ZR) / L_HEAD)


# ---------------------------------------------------------------- parts
def build_head():
    NR = 32
    PS = [0.0, 0.12, RW, 0.36, 0.50, 0.64, 0.78, 0.90, 0.965, 1.0]
    NC = len(PS) - 1
    bm = bmesh.new()
    rows = [(-0.14, ZR - 0.030)] + [(i / NR * 0.985, None) for i in range(NR + 1)]
    ps = PS
    rings = []
    for s, zfix in rows:
        z = zfix if zfix is not None else ZR + s * L_HEAD
        w, h = leaf_w(s), leaf_h(s)
        ys = [-w * p for p in ps[::-1]] + [w * p for p in ps[1:]]
        top = [bm.verts.new((head_x(abs(y), w, h), y, z)) for y in ys]
        bot = [bm.verts.new((-head_x(abs(y), w, h), y, z)) for y in ys[::-1]]
        rings.append(top + bot)
    tip = bm.verts.new((0.0, 0.0, Z_TIP))
    M = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for k in range(M):
            bm.faces.new((a[k], a[(k + 1) % M], b[(k + 1) % M], b[k]))
    for k in range(M):
        bm.faces.new((rings[-1][k], rings[-1][(k + 1) % M], tip))
    bm.faces.new(rings[0][::-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj("head", mesh_from_bm(bm, "head"))


def build_collar():
    """Slightly bulbous round ferrule around the shaft; its two faces are flattened to |x| = CX (the socket is cut into them)."""
    prof = [(0.0, -0.056), (0.026, -0.056), (0.036, -0.052), (0.0445, -0.044), (0.0485, -0.032), (0.0495, -0.015), (0.0500, 0.0),
            (0.0495, 0.015), (0.0485, 0.032), (0.0445, 0.044), (0.036, 0.052), (0.026, 0.056), (0.0, 0.056)]
    bm = lathe([(r_, ZC + dz) for r_, dz in prof], 32)
    for v in bm.verts:
        v.co.x = max(-CX, min(CX, v.co.x))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj("collar", mesh_from_bm(bm, "collar"))


def build_ferrule():
    za = ZC - 0.040
    prof = [(0.0, za), (0.027, za), (0.0315, za - 0.012), (0.0310, za - 0.026), (0.0255, za - 0.038), (0.0222, za - 0.043),
            (0.0, za - 0.043)]
    return new_obj("ferrule", mesh_from_bm(lathe(prof, 20), "ferrule"))


def build_shaft():
    prof = [(0.0, Z_BUTT), (SHAFT_R - 0.002, Z_BUTT), (SHAFT_R, Z_BUTT + 0.004), (SHAFT_R, ZC), (0.0, ZC)]
    return new_obj("shaft", mesh_from_bm(lathe(prof, 20), "shaft"))


def build_butt():
    z0 = Z_BUTT - 0.004
    prof = [(0.0, z0 - 0.024), (0.011, z0 - 0.0225), (0.0205, z0 - 0.0165), (0.0268, z0 - 0.008), (0.0285, z0 + 0.004),
            (0.0270, z0 + 0.016), (0.0245, z0 + 0.024), (0.0, z0 + 0.024)]
    return new_obj("butt", mesh_from_bm(lathe(prof, 20), "butt"))


def build_leather():
    segs, rings = 16, 22
    z0, z1 = -0.080, 0.082
    bm = bmesh.new()
    grid = []
    for i in range(rings + 1):
        z = lerp(z0, z1, i / rings)
        row = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            ph = (z / 0.030) + a / (2 * math.pi)
            ridge = 0.5 + 0.5 * math.cos(2 * math.pi * ph)
            edge = smooth(min(i, rings - i) / 2.5)
            r = SHAFT_R + 0.0006 + edge * (0.0008 + 0.0026 * ridge ** 1.4)
            row.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        grid.append(row)
    for a, b in zip(grid, grid[1:]):
        for k in range(segs):
            bm.faces.new((a[k], a[(k + 1) % segs], b[(k + 1) % segs], b[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj("leather", mesh_from_bm(bm, "leather"))


def sweep_var(path_z, sign, hw_top, xs):
    """Closed triangular prism along the centre line (y = 0) following the surface heights xs; cutter solid."""
    bm = bmesh.new()
    rings = []
    for z, x in zip(path_z, xs):
        rings.append([bm.verts.new((sign * (x + 0.003), -hw_top, z)), bm.verts.new((sign * (x + 0.003), hw_top, z)),
                      bm.verts.new((sign * (x - GD), 0.0, z))])
    for a, b in zip(rings, rings[1:]):
        for k in range(3):
            k2 = (k + 1) % 3
            bm.faces.new((a[k], a[k2], b[k2], b[k]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def channel_strip_var(path_z, fill, xs, s):
    bm = bmesh.new()
    hw = GW * 0.62
    cols = []
    for z, x in zip(path_z, xs):
        x_e = x - GD + GD * (hw / GW) + CH_LIFT * 0.7
        x_a = x - GD + CH_LIFT
        cols.append([bm.verts.new((s * x_e, -hw, z)), bm.verts.new((s * x_a, 0.0, z)), bm.verts.new((s * x_e, hw, z))])
    for a, b in zip(cols, cols[1:]):
        for k in range(2):
            f = (a[k], a[k + 1], b[k + 1], b[k])
            bm.faces.new(f if s > 0 else f[::-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
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
    return new_obj("chan", mesh_from_bm(bm, "chan"))


def build_sleeve():
    """Second, lower collar (sleeve) carrying the small settings: bulbous like the collar, faces flattened to |x| = CX2."""
    prof = [(0.0, -0.030), (0.028, -0.030), (0.038, -0.026), (0.0425, -0.018), (0.0440, -0.008), (0.0440, 0.008), (0.0425, 0.018),
            (0.038, 0.026), (0.028, 0.030), (0.0, 0.030)]
    bm = lathe([(r_, ZSL + dz) for r_, dz in prof], 24)
    for v in bm.verts:
        v.co.x = max(-CX2, min(CX2, v.co.x))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj("sleeve", mesh_from_bm(bm, "sleeve"))


# ---------------------------------------------------------------- colours
def steel_fn(extra_light=0.0, socket=True):
    def fn(co, n):
        x, y, z = co.x, co.y, co.z
        h = vnoise(y, z, 0.0105, 11) * 0.6 + vnoise(y, z + 0.4 * abs(x) / 0.01, 0.0055, 12) * 0.4
        flat = min(abs(n.x), 1.0)
        edge = 0.6 * (1.0 - smooth((flat - 0.3) / 0.65))          # steep normals = rounded edges / bevel panels
        c = lerp_c(lerp_c(STEEL_D, STEEL_M, 0.30 + 0.45 * h), lerp_c(STEEL_M, STEEL_L, 0.45 + 0.45 * h), edge)
        c = lerp_c(c, STEEL_L, extra_light)
        if Z_G_START - 0.001 < z < Z_G_END + 0.001 and abs(y) < GW + 0.0006 and abs(x) < surface_x(z) - 0.0012:
            return STEEL_D * 0.55 + np.array([0, 0, 0, 0.45])
        if socket and abs(z - ZC) < SOCKET_R + 0.003 and abs(y) < SOCKET_R + 0.003:
            rs = math.hypot(y, z - ZC)
            if rs < SOCKET_R + 0.002 and abs(x) < CX - 0.003:
                c = lerp_c(STEEL_D, STEEL_M, 0.15 + 0.3 * h)
            elif abs(x) > CX + 0.0006 or (rs < 0.0365 and abs(x) > CX - 0.0012 and False):
                c = lerp_c(STEEL_M, STEEL_L, 0.25 + 0.4 * h)
        return c
    return fn


def wood_fn(co, n):
    ang = math.atan2(co.y, co.x)
    grain = vnoise(ang * 0.012, co.z, 0.02, 5) * 0.6 + vnoise(ang * 0.05, co.z * 4, 0.02, 6) * 0.4
    c = lerp_c(WOOD_M, WOOD_L, 0.15 + 0.7 * grain)
    c = lerp_c(c, WOOD_D, 0.45 * (1 - grain) ** 2)
    return c


def leather_fn(co, n):
    ang = math.atan2(co.y, co.x)
    ph = (co.z / 0.030) + ang / (2 * math.pi)
    ridge = 0.5 + 0.5 * math.cos(2 * math.pi * ph)
    c = lerp_c(LEATHER_D, LEATHER_M, ridge ** 0.7)
    return lerp_c(c, LEATHER_L, 0.25 * vnoise(co.x * 40, co.z * 40, 1, 3) * ridge)


# ---------------------------------------------------------------- build
def lance():
    head, collar = build_head(), build_collar()
    xs_all = None
    # socket recesses (both faces) in the collar
    for s in (1, -1):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=SOCKET_R, radius2=SOCKET_R, depth=0.03,
                              matrix=Matrix.Translation((s * (FLOOR + STONE_DX + 0.015), 0, ZC)) @ Matrix.Rotation(math.radians(90), 4, "Y"))
        boolean(collar, new_obj("socket", mesh_from_bm(bm, "socket")))
    # groove: socket -> up the ridge, ends shortly before the tip
    z_start, z_end = Z_G_START, Z_G_END
    n = max(int((z_end - z_start) / 0.0045), 8)
    path_z = np.linspace(z_start, z_end, n + 1)
    fill = (path_z - z_start) / (z_end - z_start)
    xs = [surface_x(z) for z in path_z]
    hw_top = GW + 0.003 * (GW / GD)
    for ob in (collar, head):
        for s in (1, -1):
            boolean(ob, new_obj("g", mesh_from_bm(sweep_var(path_z, s, hw_top, xs), "g")))
    print(f"[hc] head w max {max(leaf_w(i / 100) for i in range(101)):.4f}, w at groove end {leaf_w(S_GROOVE_END):.4f}, "
          f"ridge h there {leaf_h(S_GROOVE_END):.4f}", flush=True)

    shade(head, 16)
    shade(collar, 45)
    set_colours(head, steel_fn(socket=False))
    set_colours(collar, steel_fn())
    steel = [head, collar]
    ferr = build_ferrule()
    shade(ferr, 45)
    set_colours(ferr, steel_fn(0.05, False))
    butt = build_butt()
    set_colours(butt, steel_fn(0.08, False))
    shaft = build_shaft()
    set_colours(shaft, wood_fn)
    leather = build_leather()
    set_colours(leather, leather_fn)
    for o in (butt, shaft, leather):
        shade(o, 45)
    sleeve = build_sleeve()
    shade(sleeve, 45)
    set_colours(sleeve, steel_fn(0.05, False))
    parts = steel + [ferr, butt, shaft, leather, sleeve]
    strips = []
    for s in (1, -1):
        M = local_frame((s * (FLOOR + STONE_DX - STONE_SINK), 0.0, ZC), 0.0 if s > 0 else math.pi)
        rim_o, claws = setting_parts(M, FACE - FLOOR + STONE_SINK, prong_offset_deg=45)   # diagonals: the groove leaves between the upper claws
        for o in [rim_o] + claws:
            set_colours(o, steel_fn(0.25, False))
            shade(o, 40)
        parts += [rim_o] + claws
        add_node("socket_rune_a_r" if s > 0 else "socket_rune_a_l", GAME @ M)
        strips.append(channel_strip_var(path_z, fill, xs, s))
    s2 = []
    for s in (1, -1):
        loc = (s * (CX2 - STONE_SINK), 0.0, ZSL)
        rot = 0.0 if s > 0 else math.pi
        rim_o, claws = setting_parts(Matrix.Translation(loc) @ Matrix.Rotation(rot, 4, "Z"), STONE_SINK, SOCKET2_F, 16, 1)
        s2 += [rim_o] + claws
        add_node("socket_rune_b_r" if s > 0 else "socket_rune_b_l", GAME @ local_frame(loc, rot, SOCKET2_F))
    sock2 = make_socket2(s2, steel_fn(0.3, False))
    metal = join(parts, "lance")
    chan = join(strips, "rune_channel")
    set_colours(chan, lambda co, nn: GLOW_DIM)
    return metal, chan, sock2


def make_materials(metal, chan, sock2):
    m = bpy.data.materials.new("HC_Vertex")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.8
    metal.data.name = "lance"
    metal.data.materials.clear()
    metal.data.materials.append(m)
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


def to_game_frame(obs):
    # width of the head along X like the old blade (flat sides towards +/-Y), then the old thrust-grip tilt and offset
    for o in obs:
        o.data.transform(GAME)
        o.data.update()


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    metal, chan, sock2 = lance()
    make_materials(metal, chan, sock2)
    to_game_frame([metal, chan, sock2])
    path = os.path.join(OUT_DIR, "lance.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False, export_vertex_color="ACTIVE",
                              export_animations=False, export_materials="EXPORT")
    tris = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in (metal, chan, sock2)}
    allv = np.array([v.co[:] for o in (metal, chan, sock2) for v in o.data.vertices])
    print(f"[hc] {path}: {sum(tris.values())} triangles {tris}", flush=True)
    print(f"[hc] bbox game frame min {allv.min(0)} max {allv.max(0)}", flush=True)


main()
