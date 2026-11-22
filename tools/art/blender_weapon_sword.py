"""Hollow Crown - rune sword (weapon library v2, second piece after the axe).

blender -b --factory-startup --python tools/art/blender_weapon_sword.py -- [<out_dir>]

Writes art/models/weapons-v2/sword.glb. Same look, palette, rune setting (rim + four prongs), V-groove technique and glow
parts (`rune_channel` with UV map `fill`) as tools/art/blender_weapons_v2.py (axe); the shared constants and base helpers are
copied here on purpose (importing that module would run the axe build), the SETTING KIT (stone nodes, rim and claw builders,
lifts) is executed from there. Read its docstring for the STONE NODE CONVENTION.

Frame = old public/assets/models/weapons/sword.glb: origin in the fist, grip along +Z (Blender), pommel at z ~ -0.09, blade
tip at +Z; guard along X, blade width along X, blade face normal along Y (glTF Z). The model is built with the face normal
on X like the axe and turned by 90 degrees about Z at the end, so the rune socket (inner radius SOCKET_R, depth FACE - FLOOR)
is the same geometry as on the axe, only turned about the grip axis.

Objects: `sword` (HC_Vertex), `rune_channel`, `rune_socket2` (small setting on the +u guard arm, both faces, HC_Vertex).
Nodes (empty): socket_rune_a_r / socket_rune_a_l = main setting in the guard centre on the face that was +X / -X before the
90 degree turn (Blender +Y / -Y, glTF -Z / +Z); socket_rune_b_r / _l = small setting on the guard arm (scale 0.55 on the node).
The right node is the stone frame turned by 90 degrees about Z, the left one by 270. Triangles: sword 6 890 + rune_channel 312 + rune_socket2 928 = 8 130.
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


STEEL_D = 0.25 * pal(3) + 0.75 * pal(51) * 0.85
STEEL_M = 0.3 * pal(4) + 0.7 * pal(52) * 0.8
STEEL_L = 0.3 * pal(5) + 0.7 * pal(6)
STEEL_D[3] = STEEL_M[3] = STEEL_L[3] = 1.0
LEATHER_D, LEATHER_M, LEATHER_L = pal(7), pal(8), pal(12)
STONE_D, STONE_L = pal(3), pal(5)
GLOW_DIM = pal(14)


def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_c(a, b, t):
    return a * (1 - t) + b * t


def vnoise(y, z, scale, seed=0):
    def h(i, j):
        n = (i * 374761393 + j * 668265263 + seed * 144665) & 0xFFFFFFFF
        n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
        return ((n ^ (n >> 16)) & 0xFFFF) / 65535.0
    u, v = y / scale, z / scale
    i, j = math.floor(u), math.floor(v)
    fu, fv = smooth(u - i), smooth(v - j)
    return lerp(lerp(h(i, j), h(i + 1, j), fu), lerp(h(i, j + 1), h(i + 1, j + 1), fu), fv)


# ---------------------------------------------------------------- scene helpers (as in the axe script)
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


def shade(ob, angle=50):
    select_only(ob)
    for p in ob.data.polygons:
        p.use_smooth = True
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle))


def lathe(profile, segs, axis="Z", close_ends=True, loop=False):
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
    if axis == "X":
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


# ---------------------------------------------------------------- shared rune setting numbers (identical to the axe)
FACE = 0.0092        # panel face height (|x|)
SOCKET_R = 0.0258    # socket inner radius (diameter 0.0516)
FLOOR = 0.0028       # socket floor |x|   -> depth FACE - FLOOR = 0.0064
GROOVE_HW, GROOVE_DEPTH = 0.0036, 0.0034

# ---------------------------------------------------------------- sword dimensions (local frame: face normal X, width Y, length Z)
GZ = 0.062                       # guard centre = rune socket centre (z)
SOCKET_C = (0.0, GZ)
W = 0.036                        # blade half width
Z0 = GZ + 0.020                  # blade root (inside the guard)
Z_T0, TIP = 0.410, 0.480         # start of the rounded tip, tip
Z_END = 0.405                    # groove end (about 80 % of the visible blade above the guard)
TB = 0.0165                      # blade ridge half thickness
FW = 0.0125                      # fuller half width (flat floor), ramps to the ridge over 0.012
RB = 0.014                       # blade edge rounding radius
GU = 0.074                       # guard half length
GR = 0.043                       # guard boss radius
TG = 0.0132                      # guard arm half thickness
SOCKET2_C = (0.052, GZ)          # small setting on the +u guard arm (u along the pre-turn Y axis, z)

_AXE = os.path.join(HERE, "blender_weapons_v2.py")
_src = open(_AXE, encoding="utf-8").read()
exec(compile(_src[_src.index("# ---------------------------------------------------------------- SETTING KIT"):
                  _src.index("# ---------------------------------------------------------------- axe" + chr(10) + "# haft")], _AXE, "exec"), globals())
FINAL = Matrix.Rotation(math.radians(90), 4, "Z")   # pre-turn frame -> game frame


def ell(s):
    s = min(max(s, 0.0), 1.0)
    return math.sqrt(max(1 - (1 - s) ** 2, 0.0))


def sweep(mains, fracs_fn, extent_fn, thick_fn, place, cap_first=False):
    """Closed heightfield solid: for every main value a a row of cross samples (extent e, fractions c), thickness t(+/-x)."""
    bm = bmesh.new()
    vmap = {}

    def V(p):
        k = (round(p[0], 7), round(p[1], 7), round(p[2], 7))
        if k not in vmap:
            vmap[k] = bm.verts.new(p)
        return vmap[k]

    def face(vs):
        out = []
        for v in vs:
            if not out or out[-1] is not v:
                out.append(v)
        if len(out) > 1 and out[0] is out[-1]:
            out.pop()
        if len(set(out)) < 3 or len(out) != len(set(out)):
            return
        try:
            bm.faces.new(out)
        except ValueError:
            pass

    rows = []
    for a in mains:
        e = extent_fn(a)
        cs = fracs_fn(e)
        top, bot = [], []
        for c in cs:
            y = e * c
            t = thick_fn(a, y, e)
            top.append(V(place(t, a, y)))
            bot.append(V(place(-t, a, y)))
        rows.append((top, bot))
    for (t0, b0), (t1, b1) in zip(rows, rows[1:]):
        for k in range(len(t0) - 1):
            face((t0[k], t0[k + 1], t1[k + 1], t1[k]))
            face((b0[k], b1[k], b1[k + 1], b0[k + 1]))
    if cap_first:
        t0, b0 = rows[0]
        face(t0 + b0[::-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


# ---------------------------------------------------------------- blade
BLADE_YS = [0.0, 0.0036, 0.0075, 0.012, 0.0205, 0.0245, 0.0285, 0.0320, 0.0338, 0.0350, 0.0357, 0.036]


def blade_e(z):
    if z <= Z_T0:
        return W
    q = (z - Z_T0) / (TIP - Z_T0)
    return W * max(1 - q ** 2.0, 0.0) ** 0.55


def blade_fracs(e):
    pos = [y / W for y in BLADE_YS]
    return [-c for c in pos[:0:-1]] + pos


def groove_carve(ay, zr_gate):
    return GROOVE_DEPTH * (1 - ay / GROOVE_HW) * zr_gate if ay < GROOVE_HW else 0.0


def blade_t(z, y, e):
    ay = abs(y)
    d = max(e - ay, 0.0)
    edge = TB * ell(d / RB) * min(1.0, (e / W) / 0.6) ** 0.6
    root = smooth((z - (Z0 + 0.016)) / 0.024)
    rh = FACE + 0.0004 + (TB - FACE - 0.0004) * root
    ff = 1 - smooth((z - 0.37) / 0.07)
    m = ff * (1 - smooth((ay - FW) / 0.008))
    cap = lerp(FACE, rh, 1 - m)
    t = min(edge, cap)
    if d > 0:
        gz = 1 - smooth((z - (Z_END - 0.012)) / 0.012)
        t -= groove_carve(ay, gz) * smooth(t / 0.006)
    return max(t, 0.0)


def build_blade():
    mains = [Z0 + 0.0125 * k for k in range(7)] + [0.18, 0.22, 0.26, 0.30, 0.34, 0.37, 0.385, 0.393, 0.399, 0.405, Z_T0]
    mains += [Z_T0 + (TIP - Z_T0) * math.sin(math.pi / 2 * k / 12) for k in range(1, 13)]
    bm = sweep(mains, blade_fracs, blade_e, blade_t, lambda t, a, y: (t, y, a), cap_first=True)
    return new_obj("blade", mesh_from_bm(bm, "blade"))


# ---------------------------------------------------------------- guard
GUARD_U = [0.0, 0.0036, 0.0072, 0.012, 0.021, 0.030, 0.039, 0.048, 0.055, 0.061, 0.066, 0.0705, 0.073, GU]


def guard_e(u):
    au = abs(u)
    c0 = math.sqrt(max(GR * GR - au * au, 0.0)) if au < GR else 0.0
    arm = 0.0165 + 0.0075 * smooth((au - 0.04) / 0.03)
    e0 = max(c0, arm)
    if au > 0.062:
        q = (au - 0.062) / (GU - 0.062)
        e0 *= max(1 - q * q, 0.0) ** 0.5
    return e0


def guard_fracs(e):
    sc = min(1.0, e / 0.025)
    edge = [1 - (d * sc) / e for d in (0.012, 0.0085, 0.0055, 0.003, 0.0015, 0.0005, 0.0)] if e > 1e-6 else [1.0] * 7
    pos = [0.0, 0.36] + edge
    return [-c for c in pos[:0:-1]] + pos


def guard_t(u, z, e):
    au = abs(u)
    d = max(e - abs(z), 0.0)
    ts = FACE + (TG - FACE) * smooth((au - 0.034) / 0.010)
    te = (ts + 0.0035) * ell(d / 0.012)
    t = min(ts, te)
    if z > 0.02 and d > 0:
        t -= groove_carve(au, smooth((z - 0.02) / 0.003)) * smooth(t / 0.006)
    return max(t, 0.0)


def build_guard():
    us = [-u for u in GUARD_U[:0:-1]] + GUARD_U
    bm = sweep(us, guard_fracs, guard_e, guard_t, lambda t, a, z: (t, a, z + GZ))
    guard = new_obj("guard", mesh_from_bm(bm, "guard"))
    for s in (1, -1):
        c = bmesh.new()
        bmesh.ops.create_cone(c, cap_ends=True, segments=24, radius1=SOCKET_R, radius2=SOCKET_R, depth=0.03,
                              matrix=Matrix.Translation((s * (FLOOR + 0.015), SOCKET_C[0], SOCKET_C[1])) @ Matrix.Rotation(math.radians(90), 4, "Y"))
        boolean(guard, new_obj("socket", mesh_from_bm(c, "socket")))
    return guard


# ---------------------------------------------------------------- grip, pommel
GRIP_Z0, GRIP_Z1, GRIP_R = -0.056, 0.020, 0.0165


def build_grip():
    segs, rings = 16, 24
    bm = bmesh.new()
    grid = []
    for i in range(rings + 1):
        z = lerp(GRIP_Z0, GRIP_Z1, i / rings)
        row = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            ph = (z / 0.024) + a / (2 * math.pi)
            ridge = 0.5 + 0.5 * math.cos(2 * math.pi * ph)
            r = GRIP_R + 0.0026 * ridge ** 1.4
            if i in (0, rings):
                r = GRIP_R - 0.001
            row.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        grid.append(row)
    for a, b in zip(grid, grid[1:]):
        for k in range(segs):
            bm.faces.new((a[k], a[(k + 1) % segs], b[(k + 1) % segs], b[k]))
    bm.faces.new(grid[0][::-1])
    bm.faces.new(grid[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj("grip", mesh_from_bm(bm, "grip"))


def build_pommel():
    prof = [(0.0, -0.0945), (0.010, -0.0940), (0.019, -0.0905), (0.0262, -0.0830), (0.0295, -0.0720), (0.0290, -0.0610),
            (0.0250, -0.0520), (0.0190, -0.0470), (0.0170, -0.0450), (0.0150, -0.0400)]
    return new_obj("pommel", mesh_from_bm(lathe(prof, 24), "pommel"))


# ---------------------------------------------------------------- rune setting (copied from the axe)
def build_setting():
    parts, strips, nodes = [], [], []
    path = np.stack([np.zeros(40), np.linspace(GZ + SOCKET_R * 0.9, Z_END - 0.003, 40)], 1)
    gp = path
    fill = np.linspace(0, 1, len(gp))
    for s in (1, -1):
        M = local_frame((s * (FLOOR - STONE_SINK), SOCKET_C[0], SOCKET_C[1]), 0.0 if s > 0 else math.pi)
        rim_o, claws = setting_parts(M, FACE - FLOOR + STONE_SINK)
        parts += [rim_o] + claws
        nodes.append(add_node("socket_rune_a_r" if s > 0 else "socket_rune_a_l", FINAL @ M))
        strips.append(channel_strip(gp, fill, s))
    s2 = []
    for s in (1, -1):
        loc = (s * (TG - STONE_SINK), SOCKET2_C[0], SOCKET2_C[1])
        rot = 0.0 if s > 0 else math.pi
        rim_o, claws = setting_parts(Matrix.Translation(loc) @ Matrix.Rotation(rot, 4, "Z"), STONE_SINK, SOCKET2_F, 16, 1)
        s2 += [rim_o] + claws
        nodes.append(add_node("socket_rune_b_r" if s > 0 else "socket_rune_b_l", FINAL @ local_frame(loc, rot, SOCKET2_F)))
    return parts, strips, s2


def channel_strip(gp, fill, s):
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


# ---------------------------------------------------------------- colours
def steel_fn(blade):
    def fn(co, n):
        x, y, z = co.x, co.y, co.z
        h = vnoise(y, z, 0.0105, 11) * 0.6 + vnoise(y, z + 0.4 * abs(x) / 0.01, 0.0055, 12) * 0.4
        c = lerp_c(STEEL_D, STEEL_M, 0.3 + 0.45 * h)
        edge = (1 - abs(n.x)) ** 1.3
        c = lerp_c(c, STEEL_L, min(0.85, 0.15 + 1.1 * edge) * (0.65 + 0.35 * h))
        if blade:
            if abs(y) < 0.028 and z > Z0 + 0.04:   # fuller floor darker, ridges stay light
                c = lerp_c(c, STEEL_D, 0.85 * (1 - smooth((abs(x) - FACE - 0.0004) / 0.004)))
        else:
            rs = math.hypot(y - SOCKET_C[0], z - SOCKET_C[1])
            if rs < SOCKET_R + 0.002 and abs(x) < FACE - 0.003:
                c = lerp_c(STEEL_D, STEEL_M, 0.15 + 0.3 * h)
        return c
    return fn


def grip_fn(co, n):
    ang = math.atan2(co.y, co.x)
    ph = (co.z / 0.024) + ang / (2 * math.pi)
    ridge = 0.5 + 0.5 * math.cos(2 * math.pi * ph)
    c = lerp_c(LEATHER_D, LEATHER_M, ridge ** 0.7)
    return lerp_c(c, LEATHER_L, 0.25 * vnoise(co.x * 40, co.z * 40, 1, 3) * ridge)


def pommel_fn(co, n):
    h = vnoise(co.x + co.y, co.z, 0.02, 31)
    t = 0.1 + 0.2 * h + 0.3 * max(n.z * 0.5 + 0.3 * n.y, 0)
    return lerp_c(STEEL_D, STEEL_L, min(t, 0.8))


def setting_fn(co, n):
    h = vnoise(co.y, co.z, 0.006, 15)
    return lerp_c(STEEL_M, STEEL_L, 0.3 + 0.3 * h + (0.4 if abs(co.x) > FACE + 0.005 else 0.0))


# ---------------------------------------------------------------- build + export
def build():
    blade = build_blade()
    guard = build_guard()
    grip = build_grip()
    pommel = build_pommel()
    set_colours(blade, steel_fn(True))
    set_colours(guard, steel_fn(False))
    set_colours(grip, grip_fn)
    set_colours(pommel, pommel_fn)
    parts, strips, s2 = build_setting()
    for p in parts:
        set_colours(p, setting_fn)
    sock2 = make_socket2(s2, setting_fn)
    metal = join([blade, guard, grip, pommel] + parts, "sword")
    shade(metal, 60)
    chan = join(strips, "rune_channel")
    set_colours(chan, lambda co, n: GLOW_DIM)
    for ob in (metal, chan, sock2):          # turn the face normal from X to Y (old sword frame)
        ob.rotation_euler = (0, 0, math.radians(90))
        select_only(ob)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
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
    metal.data.name = "sword"
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


os.makedirs(OUT, exist_ok=True)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
metal, chan, sock2 = build()
make_materials(metal, chan, sock2)
path = os.path.join(OUT, "sword.glb")
bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False, export_vertex_color="ACTIVE",
                          export_animations=False, export_materials="EXPORT")
tris = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in (metal, chan, sock2)}
print(f"[hc] {path}: {sum(tris.values())} triangles {tris}", flush=True)
