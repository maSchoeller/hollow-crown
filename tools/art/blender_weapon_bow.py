"""Hollow Crown - weapon library v2: the rune BOW (recurve bow, setting in the riser plate).

blender -b --factory-startup --python tools/art/blender_weapon_bow.py -- [<out_dir>]

Writes art/models/weapons-v2/bow.glb. Executes blender_weapons_v2.py up to its build loop plus blender_weapons_v2_kit.py (shared
helpers). Built from the painted item icons (iron_bow, longbow), no ChatGPT blueprint yet (art/prompts/weapon_rune_concept.md).

Frame (like the old bow, tools/art/blender_weapons.py): origin in the LEFT fist, the bow plane is Y-Z (limbs seen from +X), tilted
45 degrees from the grip axis Z towards Y (up and forward), the belly (grip) towards -Y, the tips and the string on the +Y side.
Built straight along Z and turned by TILT at the end. Total length 0.52, depth 0.105.
Parts: bow (HC_Vertex: wooden limbs, leather grip, steel tip caps, cream string, riser plate with the main setting),
  rune_channel (V strip + two iron beads along the UPPER limb from the main setting to the tip cap, UV 1 `fill` 0 .. 1),
  rune_socket2 (small setting on the plate of the lower limb).
Nodes: socket_rune_a (main setting on the +X face of the upper riser plate, symbol up along the limb), socket_rune_b (small, 0.55).
Triangles: see the printed line of the build (budget 8 500).
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

HALF, BELLY, FLICK = 0.26, 0.14, 0.035
TILT = Matrix.Rotation(-math.radians(45), 4, "X")
S_UP, S_LO = 0.105, -0.105                 # centres of the two plates along the limb axis


def ybow(s):
    a = abs(s) / HALF
    return BELLY * a * a - FLICK * smooth((a - 0.74) / 0.26)


def bump(s, a0, a1, a2, a3):
    return smooth((s - a0) / (a1 - a0)) * (1 - smooth((s - a2) / (a3 - a2)))


def plate_up(s):
    return bump(s, 0.03, 0.05, 0.16, 0.18)


def plate_lo(s):
    return bump(s, -0.145, -0.125, -0.085, -0.065)


def ra_s(s):
    a = abs(s) / HALF
    return 0.0105 + 0.0065 * (1 - a) + 0.030 * plate_up(s) + 0.012 * plate_lo(s)


def rb_s(s):
    a = abs(s) / HALF
    return 0.0100 + 0.0020 * (1 - a) + 0.0030 * plate_up(s) + 0.0020 * plate_lo(s)


def tang(s):
    e = 1e-3
    return np.array([0.0, ybow(s + e) - ybow(s - e), 2 * e])


def build():
    ss = np.linspace(-HALF, HALF, 53)
    path = np.array([(0.0, ybow(s), s) for s in ss])
    wood = lambda co, n: lerp_c(WOOD_M, WOOD_L, min(max(0.25 + 0.5 * vnoise(co.z, co.y, 0.02, 5) + 0.25 * n.x, 0.0), 1.0))
    limb = col(sweep(path, lambda t: ra_s((2 * t - 1) * HALF), lambda t: rb_s((2 * t - 1) * HALF), 14, (1, 0, 0), SQ(3.5),
                     True, "limb"), wood)
    parts = [limb]
    # leather grip around the limb in the fist
    prof = [(0.0, -0.050), (0.0185, -0.050), (0.0205, -0.046)]
    for i in range(19):
        z = -0.046 + 0.078 * i / 18
        prof.append((0.0198 + 0.0012 * (0.5 + 0.5 * math.cos(2 * math.pi * i / 3)), z))
    prof += [(0.0205, 0.032), (0.0185, 0.036), (0.0, 0.036)]
    grip = new_obj("grip", mesh_from_bm(lathe(prof, 12, axis="Z"), "grip"))
    for v in grip.data.vertices:
        v.co.y += ybow(v.co.z)
    parts.append(col(grip, lambda co, n: lerp_c(LEATHER_D, LEATHER_M, 0.45 + 0.4 * math.cos(2 * math.pi * (co.z + 0.046) / 0.026) * 0.5
                                              + 0.15 * vnoise(co.z * 40, co.y, 1, 6))))
    # steel tip caps (nocks) and the string
    for sg in (-1, 1):
        s = sg * (HALF - 0.004)
        cap = ball((0.0, ybow(s), s), 0.0135, (1.0, 1.25))
        parts.append(col(cap, steel_fn(52, 0.4, 0.3)))
    a, b = np.array([0.0, ybow(-HALF), -HALF]), np.array([0.0, ybow(HALF), HALF])
    parts.append(col(tube(a, b, 0.0024, segs=5, name="string"), lambda co, n: STRING_C))
    # settings
    pos_a = (rb_s(S_UP), ybow(S_UP), S_UP)
    pos_b = (rb_s(S_LO), ybow(S_LO), S_LO)
    parts += main_setting(pos_a, (1, 0, 0), tang(S_UP), "socket_rune_a", TILT)
    sp, sf = small_setting(pos_b, (1, 0, 0), tang(S_LO), "socket_rune_b", TILT)
    sock2 = make_socket2(sp, sf)
    # channel along the upper limb
    cs = np.linspace(S_UP + 0.030, HALF - 0.020, 40)
    cpath = np.array([(rb_s(s), ybow(s), s) for s in cs])
    chan, rails = channel([(cpath, (1, 0, 0))])
    parts += rails
    return parts, chan, sock2


clear_scene()
parts, chan, sock2 = build()
finish("bow", parts, chan, sock2, TILT)
