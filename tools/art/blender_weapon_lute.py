"""Hollow Crown - weapon library v2: the rune LUTE (pear-shaped body with a flat soundboard, setting at the rosette).

blender -b --factory-startup --python tools/art/blender_weapon_lute.py -- [<out_dir>]

Writes art/models/weapons-v2/lute.glb. Executes blender_weapons_v2.py (up to its build loop) and blender_weapons_v2_kit.py.
Built from the painted item icons (travel_lute, silver_lute); no ChatGPT blueprint yet.

Frame (like the old lute, LEFT hand): origin in the fist, the neck along the grip axis Z (z -0.03 .. 0.16, top at x 0.0155), the
body in front of the fist (z 0.115 .. 0.41, soundboard plane x = +0.030, the round back bowl towards -X), the pegbox bent back
behind the fist. Parts: lute (HC_Vertex: wooden body with rib stripes, soundboard, neck, pegbox with six steel pegs, rosette ring,
main setting in the rosette), rune_channel (V strip + iron beads from the rosette along the neck to the pegbox, UV 1 `fill` 0 .. 1),
rune_socket2 (small setting on the soundboard at the tail). Nodes: socket_rune_a (main, soundboard centre z 0.262, dome +X, symbol
up +Z), socket_rune_b (small, z 0.358, 0.55).
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
ZB0, ZB1 = 0.115, 0.41                 # body start / end
NECK_X = 0.0155
Z_ROS, Z_SMALL = 0.262, 0.358


def tb(z):
    return (z - ZB0) / (ZB1 - ZB0)


def body_ra(t):
    if t < 0.65:
        return 0.033 + 0.065 * smooth(t / 0.65)
    return 0.098 * math.sqrt(max(1 - ((t - 0.65) / 0.35) ** 2, 0.0))


def body_rb(t):
    r = NECK_X + (0.050 - NECK_X) * smooth(t / 0.22)
    return r * (1.0 if t < 0.93 else math.sqrt(max(1 - ((t - 0.93) / 0.07) ** 2, 0.0)))


def body_xc(t):
    return -0.020 * smooth(t / 0.22)


def front_x(z):
    if z < ZB0:
        return NECK_X
    t = tb(z)
    return body_xc(t) + body_rb(t)


def body_sec(th):
    c, s = math.cos(th), math.sin(th)
    if s >= 0:                                           # flat soundboard side (+X): squircle
        return math.copysign(abs(c) ** 0.5, c), abs(s) ** 0.5
    return c, s                                          # round back bowl


def build():
    parts = []
    zs = np.linspace(ZB0, ZB1, 40)
    path = np.array([(body_xc(tb(z)), 0.0, z) for z in zs])
    # the sweep's N axis is +X (hint) so v>0 is the soundboard
    def bodycol(co, n):
        ang = math.atan2(co.x + 0.02, co.y)
        if n.x > 0.6:
            return lerp_c(WOOD_M, WOOD_L, 0.45 + 0.4 * vnoise(co.y, co.z, 0.02, 12))
        stripe = 0.5 + 0.5 * math.cos(ang * 14)
        return lerp_c(WOOD_D, WOOD_M, 0.25 + 0.55 * stripe)
    body = sweep(path, lambda t: body_ra(t), lambda t: body_rb(t), 24, (1, 0, 0), body_sec, True, "body")
    parts.append(col(body, bodycol))
    neck = sweep(np.array([(0, 0, z) for z in np.linspace(-0.03, 0.16, 10)]), 0.0165, NECK_X, 12, (1, 0, 0), SQ(3), True, "neck")
    parts.append(col(neck, lambda co, n: lerp_c(WOOD_D, WOOD_M, 0.35 + 0.35 * vnoise(co.z, co.y, 0.02, 13) + 0.2 * n.x)))
    hp = np.array([(0.0, -0.045 * u, -0.03 - 0.065 * u) for u in np.linspace(0, 1, 6)])
    head = sweep(hp, lambda t: 0.0185 - 0.002 * t, lambda t: 0.0185 - 0.002 * t, 12, (1, 0, 0), None, True, "pegbox", 0.010)
    parts.append(col(head, lambda co, n: lerp_c(WOOD_D, WOOD_M, 0.4 + 0.3 * n.y)))
    for u in (0.2, 0.5, 0.8):
        p = hp[int(round(u * 5))]
        for sg in (-1, 1):
            parts.append(col(tube(p + (sg * 0.014, 0, 0), p + (sg * 0.036, 0, 0), 0.0065, segs=6, name="peg"), steel_fn(71, 0.4, 0.3)))
            parts.append(col(tube(p + (sg * 0.036, 0, 0), p + (sg * 0.041, 0, 0), 0.0115, segs=8, name="pegcap"), steel_fn(72, 0.5, 0.3)))
    # rosette ring around the main setting
    FX = front_x(Z_ROS)
    M0 = frame_matrix((FX, 0.0, Z_ROS), (1, 0, 0), (0, 0, 1))
    ring = lathe([(0.0430, -0.001), (0.0430, 0.0016), (0.0475, 0.0024), (0.0555, 0.0016), (0.0565, -0.001)], 36, axis="X",
                 close_ends=False, loop=True)
    bmesh.ops.transform(ring, matrix=M0, verts=ring.verts)
    bmesh.ops.recalc_face_normals(ring, faces=ring.faces)
    parts.append(col(new_obj("rosette", mesh_from_bm(ring, "rosette")), steel_fn(73, 0.3, 0.3)))
    parts += main_setting((FX, 0.0, Z_ROS), (1, 0, 0), (0, 0, 1), "socket_rune_a", IDENT)
    sp, sf = small_setting((front_x(Z_SMALL), 0.0, Z_SMALL), (1, 0, 0), (0, 0, 1), "socket_rune_b", IDENT)
    sock2 = make_socket2(sp, sf)
    cz = np.linspace(Z_ROS - 0.034, -0.005, 60)
    cpath = np.array([(front_x(z), 0.0, z) for z in cz])
    chan, rails = channel([(cpath, (1, 0, 0))], hw=0.0028, rail_gap=0.0026, rail_r=0.0019)
    parts += rails
    return parts, chan, sock2


clear_scene()
parts, chan, sock2 = build()
finish("lute", parts, chan, sock2, None)
