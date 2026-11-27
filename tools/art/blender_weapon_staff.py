"""Hollow Crown - weapon library v2: the rune STAFF (wooden staff, disc head with a horn crown, setting on both head faces).

blender -b --factory-startup --python tools/art/blender_weapon_staff.py -- [<out_dir>]

Writes art/models/weapons-v2/staff.glb. Executes blender_weapons_v2.py (up to its build loop) and blender_weapons_v2_kit.py.
Built from the painted item icons (heal_staff, star_staff); no ChatGPT blueprint yet.

Frame (like the old staff): origin in the right fist (GRIP_SHIFT toward the head, story 16.19), the staff is tilted 60 degrees from the grip axis Z towards Y (mostly upright
along the forearm), the broad faces of the head point to +X / -X. Built straight along Z (z -0.27 .. 0.575) and turned by TILT.
Parts: staff (HC_Vertex: wooden shaft with leather grip, iron butt, collar block, neck, disc head with two horns and a finial),
  rune_channel (V strip + iron beads as two helices (180 degrees apart) winding down the shaft from the collar, UV 1 `fill` 0 .. 1),
  rune_socket2 (small setting on the collar block, both faces).
Nodes: socket_rune_a_r / _l (main setting in the head disc centre, face +X / -X, symbol up along the staff),
  socket_rune_b_r / _l (small setting on the collar block, 0.55). Triangles: see the printed line of the build.
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

GRIP_SHIFT = 0.040                        # story 16.19: the grip origin sits this much nearer the head, so the butt reaches the floor in rest
TILT = Matrix.Rotation(-math.radians(60), 4, "X") @ Matrix.Translation((0, 0, -GRIP_SHIFT))
R_SHAFT = 0.0175
Z_BUTT, Z_TOPSHAFT = -0.26, 0.345
Z_COL0, Z_COL1 = 0.335, 0.388             # collar block (small settings)
Z_HEAD, R_HEAD, T_HEAD = 0.478, 0.048, 0.0145
X_COL = 0.0235


def wood_fn(seed):
    return lambda co, n: lerp_c(WOOD_M, WOOD_L, min(max(0.2 + 0.5 * vnoise(co.z, co.x, 0.02, seed) + 0.2 * n.y, 0.0), 1.0))


def build():
    parts = []
    shaft = sweep(np.array([(0, 0, z) for z in np.linspace(Z_BUTT, Z_TOPSHAFT, 12)]), R_SHAFT, R_SHAFT, 12, (1, 0, 0), None, True, "shaft")
    parts.append(col(shaft, wood_fn(4)))
    prof = [(0.0, -0.085), (0.0185, -0.085), (0.0205, -0.081)]
    for i in range(17):
        prof.append((0.0198 + 0.0012 * (0.5 + 0.5 * math.cos(2 * math.pi * i / 4)), -0.081 + 0.152 * i / 16))
    prof += [(0.0205, 0.075), (0.0185, 0.079), (0.0, 0.079)]
    grip = new_obj("grip", mesh_from_bm(lathe(prof, 12, axis="Z"), "grip"))
    parts.append(col(grip, lambda co, n: lerp_c(LEATHER_D, LEATHER_M, 0.45 + 0.4 * math.cos(2 * math.pi * (co.z + 0.081) / 0.038) * 0.5
                                              + 0.15 * vnoise(co.z * 40, co.y, 1, 6))))
    parts.append(col(ball((0, 0, Z_BUTT - 0.006), 0.0225, (1.0, 1.2)), steel_fn(61, 0.35, 0.3)))
    # collar block with flat faces +-X, neck, head disc, horns, finial
    col_path = np.array([(0, 0, z) for z in np.linspace(Z_COL0, Z_COL1, 5)])
    blk = sweep(col_path, lambda t: 0.034 * taper(t, 0.07), lambda t: X_COL * taper(t, 0.07), 14, (1, 0, 0), SQ(3), True, "block")
    parts.append(col(blk, steel_fn(62, 0.3, 0.35)))
    neck = sweep(np.array([(0, 0, z) for z in np.linspace(Z_COL1 - 0.004, Z_HEAD - 0.03, 4)]),
                 lambda t: 0.0185 - 0.0065 * t, lambda t: 0.0185 - 0.0065 * t, 10, (1, 0, 0), None, True, "neck")
    parts.append(col(neck, steel_fn(63, 0.3, 0.3)))
    T, R = T_HEAD, R_HEAD
    prof = [(0.0, -T), (R - 0.008, -T), (R - 0.002, -T + 0.003), (R, -0.004), (R, 0.004), (R - 0.002, T - 0.003), (R - 0.008, T), (0.0, T)]
    disc = new_obj("disc", mesh_from_bm(lathe(prof, 40, axis="X"), "disc"))
    for v in disc.data.vertices:
        v.co.z += Z_HEAD
    parts.append(col(disc, steel_fn(64, 0.35, 0.3)))
    for sg in (-1, 1):                                            # horns hugging the disc edge
        phis = np.linspace(math.radians(150), math.radians(22), 16)
        hp = np.array([(0.0, sg * 0.0555 * math.sin(p), Z_HEAD + 0.0555 * math.cos(p)) for p in phis])
        horn = sweep(hp, lambda t: 0.0095 - 0.0055 * t, lambda t: 0.0095 - 0.0055 * t, 8, (1, 0, 0), None, True, "horn", 0.004)
        parts.append(col(horn, steel_fn(65, 0.4, 0.3)))
    fin = sweep(np.array([(0, 0, z) for z in np.linspace(Z_HEAD + R - 0.006, Z_HEAD + R + 0.052, 6)]),
                lambda t: 0.012 * (1 - t) ** 0.8 + 0.0008, lambda t: 0.009 * (1 - t) ** 0.8 + 0.0008, 8, (1, 0, 0), SQ(2.6), True, "finial")
    parts.append(col(fin, steel_fn(66, 0.45, 0.3)))
    # settings (both faces)
    sock, cpaths = [], []
    for sg, tag in ((1, "r"), (-1, "l")):
        parts += main_setting((sg * T_HEAD, 0.0, Z_HEAD), (sg, 0, 0), (0, 0, 1), f"socket_rune_a_{tag}", TILT)
        sp, sf = small_setting((sg * X_COL, 0.0, 0.5 * (Z_COL0 + Z_COL1)), (sg, 0, 0), (0, 0, 1), f"socket_rune_b_{tag}", TILT)
        sock += sp
    sock2 = make_socket2(sock, sf)
    turns, z_a, z_b = 2.5, 0.325, 0.10
    for ph in (0.0, math.pi):
        us = np.linspace(0, 1, 60)
        pts = np.array([(R_SHAFT * math.cos(ph + 2 * math.pi * turns * u), R_SHAFT * math.sin(ph + 2 * math.pi * turns * u),
                         z_a + (z_b - z_a) * u) for u in us])
        cpaths.append((pts, np.stack([pts[:, 0], pts[:, 1], 0 * pts[:, 2]], 1)))
    chan, rails = channel(cpaths, hw=0.0028, rail_gap=0.0026, rail_r=0.0019, step=0.008)
    parts += rails
    return parts, chan, sock2


clear_scene()
parts, chan, sock2 = build()
finish("staff", parts, chan, sock2, TILT)
