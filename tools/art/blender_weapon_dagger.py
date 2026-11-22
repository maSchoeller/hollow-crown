"""Hollow Crown - weapon library v2: the rune DAGGER (stubby leaf blade with a fuller, setting in the cross-guard).

blender -b --factory-startup --python tools/art/blender_weapon_dagger.py -- [<out_dir>]

Writes art/models/weapons-v2/dagger.glb. Executes blender_weapons_v2.py (up to its build loop) and blender_weapons_v2_kit.py.
Built from the painted item icons (iron_dagger, stiletto); no ChatGPT blueprint yet.

Frame (like the sword): built with the flat faces on +X / -X, blade along +Z, then turned by FINAL (90 degrees about Z) so the flat
faces point to +/-Y like the old dagger; origin in the right fist, grip along Z. Guard centre = setting centre at z = 0.062.
Parts: dagger (HC_Vertex: steel blade with a real V fuller on both faces, guard with a round boss, leather grip, pommel),
  rune_channel (V strip + iron beads in the fuller, both faces, UV 1 `fill` 0 at the guard .. 1 near the tip),
  rune_socket2 (small setting on the +Y guard arm, both faces).
Nodes (pre-turn faces): socket_rune_a_r / _l (main setting in the guard centre, face +X / -X), socket_rune_b_r / _l (small, 0.55).
"""
import math
import os
import sys

_here = os.path.dirname(os.path.abspath(__file__))
_ns = {"__file__": os.path.join(_here, "blender_weapons_v2.py"), "__name__": "hc_weapons_v2"}
for _f, _cut in (("blender_weapons_v2.py", "os.makedirs(OUT"), ("blender_weapons_v2_kit.py", None)):
    _s = open(os.path.join(_here, _f), encoding="utf-8").read()
    _s = _s[:_s.index(_cut)] if _cut else _s
    exec(compile(_s, _f, "exec"), _ns)
globals().update({k: v for k, v in _ns.items() if not k.startswith("__")})

FINAL = Matrix.Rotation(math.radians(90), 4, "Z")
GZ = 0.062                    # guard / setting centre (z)
GX = 0.0125                   # guard arm half thickness (setting face)
ARM_Y, SMALL_Y = 0.088, 0.0605
Z0, Z1, ZT = 0.07, 0.17, 0.245          # blade root, start of the taper, tip
BW, BH = 0.031, 0.0105                  # blade half width / half thickness
GW, GD = 0.0055, 0.0030                 # fuller half width / depth
Z_G0, Z_G1 = 0.098, 0.205               # fuller (strip) range


def bw(z):
    if z <= Z1:
        return BW
    u = (z - Z1) / (ZT - Z1)
    return BW * max(1 - u ** 2.2, 0.0) ** 0.6


def bh(z):
    return BH * (bw(z) / BW) ** 0.5


def gd(z):
    return GD * smooth((z - 0.095) / 0.02) * (1 - smooth((z - 0.205) / 0.02))


def blade():
    zs = np.linspace(Z0, ZT - 0.002, 40)
    bm = bmesh.new()
    rings = []
    for z in zs:
        w, h, d = bw(z), bh(z), gd(z)
        gw = min(GW, 0.4 * w)
        dv = min(d, 0.8 * h)
        top = [(-w, 0.0), (-0.62 * w, 0.8 * h), (-gw, h), (0.0, h - dv), (gw, h), (0.62 * w, 0.8 * h), (w, 0.0)]
        bot = [(0.62 * w, -0.8 * h), (gw, -h), (0.0, -(h - dv)), (-gw, -h), (-0.62 * w, -0.8 * h)]
        rings.append([bm.verts.new((x, y, z)) for y, x in top + bot])
    n = len(rings[0])
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(n):
            bm.faces.new((r0[k], r0[(k + 1) % n], r1[(k + 1) % n], r1[k]))
    for ring, z, sg in ((rings[0], Z0, -1), (rings[-1], ZT, 1)):
        apex = bm.verts.new((0, 0, z if sg < 0 else ZT))
        for k in range(n):
            bm.faces.new((ring[k], ring[(k + 1) % n], apex))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = new_obj("blade", mesh_from_bm(bm, "blade"))
    return col(ob, lambda co, nn: lerp_c(STEEL_M, STEEL_L, min(max(0.3 + 0.35 * abs(co.x) / BH + 0.25 * vnoise(co.y, co.z, 0.01, 3)
                                                                   - 0.5 * (1 - min(abs(co.y) / 0.02, 1)) * 0.2, 0.0), 1.0)))


def build():
    parts = [blade()]
    # leather grip + pommel
    prof = [(0.0, -0.052), (0.0150, -0.052), (0.0170, -0.047)]
    for i in range(25):
        z = -0.047 + 0.096 * i / 24
        prof.append((0.0160 + 0.0016 * (0.5 + 0.5 * math.cos(2 * math.pi * i / 6)), z))
    prof += [(0.0170, 0.050), (0.0150, 0.054), (0.0, 0.054)]
    grip = new_obj("grip", mesh_from_bm(lathe(prof, 12, axis="Z"), "grip"))
    parts.append(col(grip, lambda co, n: lerp_c(LEATHER_D, LEATHER_M, 0.5 + 0.4 * math.cos(2 * math.pi * (co.z + 0.047) / 0.016) * 0.5
                                              + 0.1 * vnoise(co.z * 40, co.y, 1, 6))))
    parts.append(col(ball((0, 0, -0.064), 0.0235, (1.0, 0.9)), steel_fn(53, 0.35, 0.3)))
    # guard: arm bar along Y with rounded ends, round boss in the middle
    path = np.array([(0.0, y, GZ) for y in np.linspace(-ARM_Y, ARM_Y, 21)])
    arm = sweep(path, lambda t: 0.0185 * taper(t, 0.09), lambda t: GX * taper(t, 0.09), 12, (1, 0, 0), SQ(3), True, "arm")
    parts.append(col(arm, steel_fn(54, 0.3, 0.35)))
    prof = [(0.0, -GX), (0.034, -GX), (0.0395, -GX + 0.0035), (0.0405, 0.0), (0.0395, GX - 0.0035), (0.034, GX), (0.0, GX)]
    core = new_obj("core", mesh_from_bm(lathe(prof, 36, axis="X"), "core"))
    for v in core.data.vertices:
        v.co.z += GZ
    parts.append(col(core, steel_fn(55, 0.35, 0.3)))
    sock = []
    cpaths = []
    for sg, tag in ((1, "r"), (-1, "l")):
        parts += main_setting((sg * GX, 0.0, GZ), (sg, 0, 0), (0, 0, 1), f"socket_rune_a_{tag}", FINAL)
        sp, sf = small_setting((sg * GX, SMALL_Y, GZ), (sg, 0, 0), (0, 0, 1), f"socket_rune_b_{tag}", FINAL)
        sock += sp
        zs = np.linspace(GZ + 0.033, Z_G1, 36)
        cpaths.append((np.array([(sg * (bh(z) - gd(z)), 0.0, z) for z in zs]), (sg, 0, 0)))
    sock2 = make_socket2(sock, sf)
    chan, rails = channel(cpaths, hw=0.0045, e_off=GD * (0.0045 / GW) + 0.0007, a_off=0.0010, rails=False)
    return parts, chan, sock2


clear_scene()
parts, chan, sock2 = build()
finish("dagger", parts, chan, sock2, FINAL)
