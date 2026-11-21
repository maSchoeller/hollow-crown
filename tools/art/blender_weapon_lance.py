"""Hollow Crown – weapon library v2: the rune LANCE (one-handed spear), same look as the approved rune axe.

blender -b --factory-startup --python tools/art/blender_weapon_lance.py -- [<out_dir>] [--render <dir>]

Writes art/models/weapons-v2/lance.glb (default) and, with --render, the preview images (front, side, head_closeup,
tiers, old_vs_new) into <dir>. Helpers, palette and the rune-setting constants are taken from blender_weapons_v2.py
(only its definitions are executed, not its axe export), so socket diameter and depth are the axe's by construction.

Frame = the old public/assets/models/weapons/lance.glb (tools/art/blender_weapons.py `lance`): built along Blender +Z with
the grip origin at z = 0 (fist), then tilted 55 deg about X (thrust grip) and moved to x = -0.03, so `hold: -125` in
content/core/render.yaml keeps working. Like the old blade the head is wide along X and flat towards +/-Y (rune faces on
+/-Y in the grip frame). Units: 1 = one board tile before figureScale.

Glow parts as in the axe (see blender_weapons_v2.py docstring): `rune_stone` (two domes, flush in the setting),
`rune_channel` (V strip in the groove, UV map 1 `fill` = 0 at the socket .. 1 at the groove end), everything else is the
object `lance` with the material HC_Vertex. The stones are the axe's stones moved out by STONE_DX (the collar face is
higher than the axe's blade panel); their shape, diameter and depth are unchanged.
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
RENDER = args[args.index("--render") + 1] if "--render" in args else None
pos = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or args[i - 1] != "--render")]
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
        x_e = x - GD + GD * (hw / GW) + 0.0003
        x_a = x - GD + 0.0006
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


def setting_parts(s):
    """Rim, four prongs and the stone for the face on side s: the axe's geometry, lifted by STONE_DX."""
    parts = []
    arc_pts = [(SOCKET_R + 0.0050 - 0.0055 * math.cos(math.radians(a)), CX + 0.0006 + 0.0030 * math.sin(math.radians(a)))
               for a in (0, 30, 60, 90, 120, 150, 180)]
    rim = lathe([(SOCKET_R - 0.0005, CX - 0.0015)] + arc_pts + [(SOCKET_R + 0.0105, CX - 0.0015)], 24, axis="X",
                close_ends=False, loop=True)
    bmesh.ops.transform(rim, matrix=Matrix.Diagonal((s, 1, 1, 1)), verts=rim.verts)
    bmesh.ops.recalc_face_normals(rim, faces=rim.faces)
    bmesh.ops.translate(rim, vec=(0, 0, ZC), verts=rim.verts)
    rim_o = new_obj("rim", mesh_from_bm(rim, "rim"))
    prongs = []
    for k in range(4):
        a = math.radians(45 + 90 * k)            # diagonals: the groove leaves between the two upper prongs
        bm = box_bm((0, 0, 0), (0.0170, 0.0125, 0.0120), bevel=0.0045, segs=3)
        bmesh.ops.translate(bm, vec=(CX + 0.0012, SOCKET_R + 0.0012, 0), verts=bm.verts)
        bmesh.ops.transform(bm, matrix=Matrix.Diagonal((s, 1, 1, 1)), verts=bm.verts)
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(a, 3, "X"), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(0, 0, ZC), verts=bm.verts)
        prongs.append(new_obj("prong", mesh_from_bm(bm, "prong")))
    # stone: identical to the axe's (short flat side, then a domed cap), moved out by STONE_DX
    h0, h1 = FLOOR + STONE_DX, FLOOR + 0.0042 + STONE_DX
    cap_h = 0.0075
    prof = [(0.0, h0), (SOCKET_R - 0.0006, h0), (SOCKET_R - 0.0006, h1)]
    Rs = ((SOCKET_R - 0.0006) ** 2 + cap_h ** 2) / (2 * cap_h)
    for i in range(1, 7):
        prof.append((Rs * math.sin(math.asin((SOCKET_R - 0.0006) / Rs) * (1 - i / 6)),
                     h1 + Rs * math.cos(math.asin((SOCKET_R - 0.0006) / Rs) * (1 - i / 6)) - (Rs - cap_h)))
    prof[-1] = (0.0, h1 + cap_h)
    sb = lathe(prof, 20, axis="X")
    if s < 0:
        bmesh.ops.transform(sb, matrix=Matrix.Diagonal((-1, 1, 1, 1)), verts=sb.verts)
        bmesh.ops.reverse_faces(sb, faces=sb.faces)
    bmesh.ops.translate(sb, vec=(0, 0, ZC), verts=sb.verts)
    stone = new_obj("stone", mesh_from_bm(sb, "stone"))
    return [rim_o] + prongs, stone


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
    parts = steel + [ferr, butt, shaft, leather]
    stones, strips = [], []
    for s in (1, -1):
        rp, stone = setting_parts(s)
        for o in rp:
            set_colours(o, steel_fn(0.25, False))
        parts += rp
        for o in rp:
            shade(o, 40)
        stones.append(stone)
        strips.append(channel_strip_var(path_z, fill, xs, s))
    metal = join(parts, "lance")
    stone = join(stones, "rune_stone")
    shade(stone, 60)
    set_colours(stone, lambda co, nn: lerp_c(STONE_D, STONE_L, smooth((abs(co.x) - 0.0075 - STONE_DX) / 0.005)))
    chan = join(strips, "rune_channel")
    set_colours(chan, lambda co, nn: GLOW_DIM)
    return metal, stone, chan


def make_materials(metal, stone, chan):
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
    for ob, name in ((stone, "rune_stone"), (chan, "rune_channel")):
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
    M = Matrix.Translation((OFFSET_X, 0, 0)) @ Matrix.Rotation(math.radians(TILT_X), 4, "X") @ Matrix.Rotation(math.radians(90), 4, "Z")
    for o in obs:
        o.data.transform(M)
        o.data.update()


# ---------------------------------------------------------------- previews
FIRE = (0xF2 / 255, 0x60 / 255, 0x3A / 255)


def srgb_lin(c):
    return tuple(lin(x) for x in c)


def glow_materials(tier, stone, chan):
    fire = srgb_lin(FIRE) + (1.0,)
    ms = stone.data.materials[0]
    mc = chan.data.materials[0]
    for m in (ms, mc):
        m.node_tree.nodes.clear()
    # stone
    nt = ms.node_tree
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    if tier == 0:
        b = nt.nodes.new("ShaderNodeBsdfPrincipled")
        a = nt.nodes.new("ShaderNodeVertexColor")
        a.layer_name = "Col"
        nt.links.new(a.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.4
        nt.links.new(b.outputs[0], out.inputs[0])
    else:
        e = nt.nodes.new("ShaderNodeEmission")
        e.inputs["Color"].default_value = fire
        e.inputs["Strength"].default_value = (2.0, 3.5, 6.0)[tier - 1]
        nt.links.new(e.outputs[0], out.inputs[0])
    # channel: lit where fill < tier/3
    nt = mc.node_tree
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    uv = nt.nodes.new("ShaderNodeUVMap")
    uv.uv_map = "fill"
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(uv.outputs["UV"], sep.inputs[0])
    lt = nt.nodes.new("ShaderNodeMath")
    lt.operation = "LESS_THAN"
    nt.links.new(sep.outputs["X"], lt.inputs[0])
    lt.inputs[1].default_value = tier / 3 + 1e-4
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = fire
    em.inputs["Strength"].default_value = (3.0, 4.0, 5.0)[max(tier - 1, 0)]
    dark = nt.nodes.new("ShaderNodeBsdfPrincipled")
    dark.inputs["Base Color"].default_value = GLOW_DIM
    dark.inputs["Roughness"].default_value = 0.5
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(lt.outputs[0], mix.inputs[0])
    nt.links.new(dark.outputs[0], mix.inputs[1])
    nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])


def setup_render(w, h):
    sc = bpy.context.scene
    for name in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            sc.render.engine = name
            break
        except TypeError:
            continue
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    wd = bpy.data.worlds.new("w")
    wd.use_nodes = True
    bg = wd.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.30, 0.31, 0.34, 1)
    bg.inputs["Strength"].default_value = 1.0
    sc.world = wd
    for o in list(bpy.data.objects):
        if o.type in ("LIGHT", "CAMERA"):
            bpy.data.objects.remove(o, do_unlink=True)
    for loc, energy in (((0.8, -0.6, 1.0), 1.2), ((-0.7, 0.5, 0.6), 0.5)):
        ld = bpy.data.lights.new("sun", "SUN")
        ld.energy = energy
        ld.angle = math.radians(25)
        lo = bpy.data.objects.new("sun", ld)
        bpy.context.scene.collection.objects.link(lo)
        d = -Vector(loc)
        lo.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def shoot(path, loc, target, ortho=None, lens=70, up_hint=None):
    sc = bpy.context.scene
    for o in [o for o in bpy.data.objects if o.type == "CAMERA"]:
        bpy.data.objects.remove(o, do_unlink=True)
    cd = bpy.data.cameras.new("cam")
    if ortho:
        cd.type = "ORTHO"
        cd.ortho_scale = ortho
    else:
        cd.lens = lens
    co = bpy.data.objects.new("cam", cd)
    bpy.context.scene.collection.objects.link(co)
    co.location = Vector(loc)
    co.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    sc.camera = co
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def render_all(metal, stone, chan, rot_fn):
    """Upright previews (grip frame, rune faces turned to +/-X before the final frame is applied)."""
    os.makedirs(RENDER, exist_ok=True)
    setup_render(720, 1000)
    glow_materials(0, stone, chan)
    zm = 0.17
    shoot(os.path.join(RENDER, "front.png"), (1.6, 0, zm), (0, 0, zm), ortho=1.0)
    shoot(os.path.join(RENDER, "side.png"), (0, -1.6, zm), (0, 0, zm), ortho=1.0)
    setup_render(1000, 1000)
    shoot(os.path.join(RENDER, "head_closeup.png"), (0.62, -0.34, ZC + 0.09), (0, 0, ZC + 0.085), lens=90)
    tiers = []
    for t in range(4):
        glow_materials(t, stone, chan)
        p = os.path.join(RENDER, f"_tier{t}.png")
        setup_render(500, 760)
        shoot(p, (0.70, -0.20, ZC + 0.09), (0, 0, ZC + 0.09), ortho=0.34)
        tiers.append(p)
    return tiers


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    metal, stone, chan = lance()
    make_materials(metal, stone, chan)
    tiers = []
    if RENDER:
        tiers = render_all(metal, stone, chan, None)
        # restore plain game materials for the export
        make_game_materials_again(stone, chan)
    to_game_frame([metal, stone, chan])
    path = os.path.join(OUT_DIR, "lance.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False, export_vertex_color="ACTIVE",
                              export_animations=False, export_materials="EXPORT")
    tris = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in (metal, stone, chan)}
    allv = np.array([v.co[:] for o in (metal, stone, chan) for v in o.data.vertices])
    print(f"[hc] {path}: {sum(tris.values())} triangles {tris}", flush=True)
    print(f"[hc] bbox game frame min {allv.min(0)} max {allv.max(0)}", flush=True)
    if RENDER:
        old_vs_new(metal, stone, chan)
        compose_tiers(tiers)


def make_game_materials_again(stone, chan):
    for ob, name in ((stone, "rune_stone"), (chan, "rune_channel")):
        mm = ob.data.materials[0]
        mm.node_tree.nodes.clear()
        b = mm.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
        a = mm.node_tree.nodes.new("ShaderNodeVertexColor")
        a.layer_name = "Col"
        mm.node_tree.links.new(a.outputs["Color"], b.inputs["Base Color"])
        o = mm.node_tree.nodes.new("ShaderNodeOutputMaterial")
        mm.node_tree.links.new(b.outputs[0], o.inputs[0])
        b.inputs["Roughness"].default_value = 0.5


def old_vs_new(metal, stone, chan):
    glow_materials(0, stone, chan)
    old_path = os.path.join(ROOT, "public", "assets", "models", "weapons", "lance.glb")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=old_path)
    olds = [o for o in bpy.data.objects if o not in before]
    for o in olds:
        if o.parent is None:
            o.location.y += 0.0
    for o in (metal, stone, chan):
        o.location.y += 0.42      # the new one to the right of the old one in the side view
    setup_render(1200, 900)
    shoot(os.path.join(RENDER, "old_vs_new.png"), (2.0, 0.0, 0.10), (0, 0.0, 0.10), ortho=1.5)
    for o in (metal, stone, chan):
        o.location.y -= 0.42


def compose_tiers(files):
    try:
        imgs = [bpy.data.images.load(f) for f in files]
        w, h = imgs[0].size
        out = np.zeros((h, w * 4, 4), np.float32)
        for i, im in enumerate(imgs):
            px = np.array(im.pixels[:], np.float32).reshape(h, w, 4)
            out[:, i * w:(i + 1) * w] = px
        res = bpy.data.images.new("tiers", w * 4, h)
        res.pixels = out.ravel()
        res.filepath_raw = os.path.join(RENDER, "tiers.png")
        res.file_format = "PNG"
        res.save()
    except Exception as ex:
        print("[hc] tiers compose failed", ex)


main()
