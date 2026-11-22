"""Hollow Crown - weapon library v2: the rune FOCUS (round crystal holder with a crystal crown, setting in the centre).

blender -b --factory-startup --python tools/art/blender_weapon_focus.py -- [<out_dir>]

Writes art/models/weapons-v2/focus.glb. Executes blender_weapons_v2.py (up to its build loop) and blender_weapons_v2_kit.py.
Built from the painted item icons (crystal_focus, moonsteel_orb, ember_focus); no ChatGPT blueprint yet. The focus had no old model.

Frame (LEFT hand, about the size of the old book): origin in the fist, a leather-wrapped grip bar along Z (z -0.05 .. 0.05) at the
origin, a stem along +X to a round holder disc (radius 0.0725, axis X, back x 0.040, front x 0.074, centre y 0.03, z 0) that faces
outward (+X). Five pale crystal spikes stand around the disc rim in the Y-Z plane (none towards the lower front, where the small
setting sits on an ear-shaped pad). Parts: focus (HC_Vertex), rune_channel (V strip + iron beads: from the main setting down, then
once around the crystal holder as a ring of radius 0.0575, UV 1 `fill` 0 .. 1), rune_socket2 (small setting on the pad).
Nodes: socket_rune_a (main, disc centre, dome +X, symbol up +Y), socket_rune_b (small, on the pad at (y -0.029, z 0.059), 0.55).
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

IDENT = Matrix.Identity(4)
CY = 0.03                              # disc centre (y), z = 0
XB, XF = 0.040, 0.074                  # disc back / front
R_D = 0.0725
R_RING = 0.0575


def dirv(psi):
    return Vector((0.0, math.cos(psi), math.sin(psi)))


def gold(seed):
    return lambda co, n: lerp_c(STEEL_M, STEEL_L, min(max(0.4 + 0.35 * vnoise(co.y, co.z, 0.01, seed) + 0.2 * n.x, 0.0), 1.0))


def build():
    parts = []
    prof = [(0.0, XB), (0.060, XB), (0.0690, XB + 0.004), (R_D, XB + 0.012), (R_D, XF - 0.008), (0.0690, XF - 0.003),
            (0.0665, XF - 0.0005), (0.0640, XF), (0.0, XF)]
    disc = new_obj("disc", mesh_from_bm(lathe(prof, 40, axis="X"), "disc"))
    for v in disc.data.vertices:
        v.co.y += CY
    parts.append(col(disc, gold(81)))
    # ear pad for the small setting, lower front
    dpad = dirv(math.radians(135))
    pc = Vector((0.0, CY, 0.0)) + dpad * 0.083
    pad = new_obj("pad", mesh_from_bm(lathe([(0.0, XB + 0.004), (0.0225, XB + 0.004), (0.0270, XB + 0.009), (0.0270, XF - 0.004),
                                              (0.0245, XF - 0.0005), (0.0225, XF), (0.0, XF)], 24, axis="X"), "pad"))
    for v in pad.data.vertices:
        v.co.y += pc.y
        v.co.z += pc.z
    parts.append(col(pad, gold(82)))
    for psi in (0, 55, -55, -115, 180):
        d = dirv(math.radians(psi))
        if d.dot(dpad) > 0.55:
            continue
        bm = lathe([(0.0, 0.0), (0.0130, 0.004), (0.0130, 0.024), (0.0, 0.046)], 6, axis="Z", close_ends=True)
        bmesh.ops.transform(bm, matrix=Vector((0, 0, 1)).rotation_difference(d).to_matrix().to_4x4(), verts=bm.verts)
        bmesh.ops.translate(bm, vec=tuple(Vector((XB + 0.017, CY, 0)) + d * 0.064), verts=bm.verts)
        cr = new_obj("crystal", mesh_from_bm(bm, "crystal"))
        parts.append(col(cr, lambda co, n: lerp_c(CRYSTAL_D, CRYSTAL_L, min(max(0.5 + 0.4 * n.x + 0.2 * n.y, 0.0), 1.0))))
    # grip bar and stem
    prof = [(0.0, -0.052), (0.0150, -0.052), (0.0172, -0.047)]
    for i in range(25):
        prof.append((0.0162 + 0.0014 * (0.5 + 0.5 * math.cos(2 * math.pi * i / 6)), -0.047 + 0.094 * i / 24))
    prof += [(0.0172, 0.047), (0.0150, 0.052), (0.0, 0.052)]
    grip = new_obj("grip", mesh_from_bm(lathe(prof, 12, axis="Z"), "grip"))
    parts.append(col(grip, lambda co, n: lerp_c(LEATHER_D, LEATHER_M, 0.45 + 0.4 * math.cos(2 * math.pi * (co.z + 0.047) / 0.016) * 0.5
                                              + 0.15 * vnoise(co.z * 40, co.y, 1, 6))))
    parts.append(col(tube((0.004, 0.0, 0.0), (XB + 0.006, 0.0, 0.0), 0.0135, segs=10, name="stem", hint=(0, 1, 0)),
                     lambda co, n: lerp_c(LEATHER_D, LEATHER_M, 0.5)))
    # settings
    parts += main_setting((XF, CY, 0.0), (1, 0, 0), (0, 1, 0), "socket_rune_a", IDENT)
    sp, sf = small_setting((XF, pc.y, pc.z), (1, 0, 0), (0, 1, 0), "socket_rune_b", IDENT)
    sock2 = make_socket2(sp, sf)
    pts = []
    for psi in np.linspace(math.radians(180), math.radians(180 + 340), 86):
        k = (psi - math.radians(180)) / math.radians(70)
        r = 0.034 + (R_RING - 0.034) * smooth(k)
        d = dirv(psi)
        pts.append((XF, CY + r * d.y, r * d.z))
    chan, rails = channel([(np.array(pts), (1, 0, 0))], hw=0.0028, rail_gap=0.0026, rail_r=0.0019, step=0.008)
    parts += rails
    return parts, chan, sock2


clear_scene()
parts, chan, sock2 = build()
finish("focus", parts, chan, sock2, None)
