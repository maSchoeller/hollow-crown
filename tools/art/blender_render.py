"""Hollow Crown – sprite pipeline, part 4: poses, animation tables and pass rendering.

Needs the namespace of blender_chibi.py. For every frame three passes are rendered at 4× size:
  <out>/<id>/<row>_<frame>_id.png   role ids (R = id * 2)
  <out>/<id>/<row>_<frame>_n.png    camera-space normals
  <out>/<id>/<row>_<frame>_z.png    view depth (R coarse, G fine)
plus <out>/roles.json (role → id) and <out>/<id>/meta.json (rows, frames, cell, anchor).
pixelize.py turns them into sheet.key.png / sheet.normal.png / sheet.json.

Angles in degrees. Conventions (figure faces -Y):
  arm x < 0 swings the arm forward/up (-90 = horizontal forward, -180 = straight up)
  "aR"/"aL" = absolute weapon angle (0 = up, 90 = forward, 180 = down, -90 = back); the wrist
  rotation is derived as aR - armR.
  lean > 0 = torso tilts forward, head > 0 = nod down, twist > 0 = turn left (towards +X).
"""
import json
import math
import os

import bpy

DIRS = {"s": 0.0, "e": 90.0, "n": 180.0}

UNIT_ROWS = [
    ("idle_s", "idle", "s", 6, "pingpong"),
    ("walk_s", "walk", "s", 10, "loop"),
    ("walk_n", "walk", "n", 10, "loop"),
    ("walk_e", "walk", "e", 10, "loop"),
    ("attack_s", "attack", "s", 12, "once"),
    ("attack_n", "attack", "n", 12, "once"),
    ("attack_e", "attack", "e", 12, "once"),
    ("hit_s", "hit", "s", 12, "once"),
    ("downed_s", "downed", "s", 0, "once"),
]

# ------------------------------------------------------------------------------------------------
# Rest poses per weapon class
# ------------------------------------------------------------------------------------------------

REST = {
    "sword": {"armR": -12, "sprR": 16, "aR": 14, "tR": 34, "armL": 4, "sprL": 9, "over": {"e": {"aR": 40, "tR": 0}}},
    "axe": {"armR": -16, "sprR": 16, "aR": 12, "tR": 30, "armL": 4, "sprL": 10, "over": {"e": {"aR": 34, "tR": 0}}},
    "axe_torch": {"armR": -16, "sprR": 16, "aR": 12, "tR": 30, "armL": -38, "sprL": 18, "aL": 20, "over": {"e": {"aR": 34, "tR": 0}}},
    "lance": {"armR": -12, "sprR": 10, "aR": 4, "armL": 4, "sprL": 9},
    "lance_shield": {"armR": -12, "sprR": 10, "aR": 4, "armL": -28, "sprL": 8, "aL": 28},
    "bow": {"armR": 2, "sprR": 9, "aR": 0, "armL": -12, "sprL": 12, "aL": 12},
    "tome": {"armR": 2, "sprR": 10, "aR": 0, "armL": -52, "sprL": 4, "aL": 40},
    "staff": {"armR": -10, "sprR": 12, "aR": 2, "armL": 2, "sprL": 9},
}


def _f(base, **kw):
    d = dict(base)
    d.update(kw)
    return d


def anim_frames(weapon, anim):
    rest = REST[weapon]
    if anim == "idle":
        return [
            _f(rest, tz=0.0),
            _f(rest, tz=-0.025, armR=rest["armR"] + 1, armL=rest["armL"] + 1, cape=1),
            _f(rest, tz=-0.05, armR=rest["armR"] + 2, armL=rest["armL"] + 2, head=2, cape=2),
            _f(rest, tz=-0.065, armR=rest["armR"] + 3, armL=rest["armL"] + 3, head=3, cape=3),
        ]
    if anim == "walk":
        sw = 26
        wa = 0.5 if weapon in ("sword", "axe", "lance", "staff", "axe_torch", "lance_shield") else 1.0
        la = 0.4 if weapon in ("tome", "axe_torch", "lance_shield") else 1.0
        fr = []
        for k, (leg, hz) in enumerate(((sw, 0.0), (0, 0.055), (-sw, 0.0), (0, 0.055))):
            fr.append(_f(rest, legL=-leg, legR=leg, hz=hz, lean=4,
                         armL=rest["armL"] + leg * 0.75 * la, armR=rest["armR"] - leg * 0.6 * wa,
                         cape=10 + (4 if hz else 0), tail=8 + (6 if hz else 0)))
        return fr
    if anim == "hit":
        return [
            _f(rest, lean=-15, step=-0.16, head=-14, armL=-35, sprL=28, armR=rest["armR"] - 20, sprR=rest["sprR"] + 18, cape=-6, tail=-10, legL=-10, legR=8),
            _f(rest, lean=-7, step=-0.08, head=-6, armL=-14, sprL=18, armR=rest["armR"] - 8, sprR=rest["sprR"] + 8, cape=-2, tail=-4),
        ]
    if anim == "downed":
        return [_f(rest, hz=-0.42, legL=-58, legR=-46, sprLegL=-18, sprLegR=16, lean=40, head=28, armL=-10, sprL=24, armR=-12, sprR=40,
                   aR=150 if weapon not in ("bow", "tome") else rest.get("aR", 0), tR=-60, cape=-30, tail=-20, step=-0.42)]
    if anim == "attack":
        rest = {k: v for k, v in rest.items() if k != "over"}
        return ATTACKS[weapon](rest)
    raise ValueError(anim)


def _sword_attack(r):
    r = dict(r, tR=0)
    return [
        _f(r, armR=-42, aR=62, sprR=12, legL=-6, legR=6),
        _f(r, armR=-150, aR=-55, sprR=28, twist=22, lean=-6, step=-0.04, armL=-25, sprL=20, legL=-10, legR=10, cape=-4),
        _f(r, armR=-178, aR=-110, sprR=32, twist=28, lean=-9, step=-0.06, hz=0.03, armL=-35, sprL=24, legL=-14, legR=14, cape=-6, tail=-6),
        _f(r, armR=-58, aR=128, sprR=-12, twist=-26, lean=18, step=0.32, armL=8, sprL=30, legL=-30, legR=24, cape=24, tail=18, show=["smear"]),
        _f(r, armR=-36, aR=152, sprR=-16, twist=-20, lean=13, step=0.27, armL=6, sprL=24, legL=-26, legR=20, cape=18, tail=12),
        _f(r, armR=-30, aR=70, sprR=6, twist=-4, lean=4, step=0.08, legL=-8, legR=6, cape=6),
    ]


def _axe_attack(r, torch=False):
    r = dict(r, tR=0)
    lft = (lambda **k: {}) if torch else (lambda **k: k)
    return [
        _f(r, armR=-40, aR=40, sprR=10, legL=-6, legR=6, **lft(armL=-40, sprL=-14)),
        _f(r, armR=-160, aR=-80, sprR=8, twist=12, lean=-10, step=-0.06, legL=-10, legR=12, cape=-6, **lft(armL=-160, sprL=-22)),
        _f(r, armR=-188, aR=-135, sprR=6, twist=14, lean=-14, step=-0.08, hz=0.04, legL=-16, legR=16, cape=-8, tail=-8, **lft(armL=-188, sprL=-24)),
        _f(r, armR=-74, aR=132, sprR=-4, twist=-14, lean=20, step=0.3, legL=-32, legR=26, cape=24, tail=20, show=["smear"], **lft(armL=-74, sprL=-26)),
        _f(r, armR=-55, aR=146, sprR=-6, twist=-10, lean=16, step=0.27, legL=-28, legR=22, cape=18, tail=14, **lft(armL=-55, sprL=-22)),
        _f(r, armR=-32, aR=70, sprR=8, twist=-2, lean=6, step=0.08, legL=-8, legR=6, cape=6, **lft(armL=-24, sprL=-8)),
    ]


def _lance_attack(r):
    return [
        _f(r, armR=-55, aR=78, sprR=8, armL=-50, sprL=-10, legL=-6, legR=6),
        _f(r, armR=-22, aR=92, sprR=12, armL=-40, sprL=-6, twist=18, lean=-6, step=-0.1, legL=-12, legR=12, cape=-4),
        _f(r, armR=4, aR=92, sprR=14, armL=-30, sprL=-4, twist=24, lean=-10, step=-0.14, legL=-16, legR=16, cape=-6, tail=-6),
        _f(r, armR=-88, aR=96, sprR=-4, armL=-70, sprL=-16, twist=-14, lean=16, step=0.42, legL=-34, legR=28, cape=24, tail=18, show=["thrust"]),
        _f(r, armR=-80, aR=96, sprR=-2, armL=-64, sprL=-14, twist=-10, lean=12, step=0.34, legL=-28, legR=22, cape=16, tail=12),
        _f(r, armR=-48, aR=72, sprR=6, armL=-30, sprL=-4, twist=-2, lean=4, step=0.1, legL=-8, legR=6, cape=6),
    ]


def _lance_shield_attack(r):
    fr = _lance_attack(r)
    for f in fr:
        f["armL"], f["sprL"], f["aL"] = -45, 4, 45
    return fr


def _bow_attack(r):
    # bow arm (L) points forward, string hand (R) draws back; the body turns side-on
    return [
        _f(r, armL=-70, aL=0, sprL=0, armR=-60, sprR=-10, twist=10, show=["arrow"]),
        _f(r, armL=-88, aL=0, sprL=-4, armR=-86, sprR=-22, twist=18, show=["arrow"], legL=-8, legR=8),
        _f(r, armL=-90, aL=0, sprL=-6, armR=-60, sprR=-6, twist=26, lean=-4, show=["arrow", "drawn"], legL=-10, legR=10, cape=-4),
        _f(r, armL=-92, aL=0, sprL=-6, armR=-40, sprR=34, twist=26, lean=-2, step=0.04, show=["arrowfly"], legL=-10, legR=10, cape=6, tail=6),
        _f(r, armL=-80, aL=0, sprL=-4, armR=-30, sprR=30, twist=18, legL=-8, legR=8, cape=4),
        _f(r, armL=-40, aL=6, sprL=4, armR=-10, sprR=14, twist=6),
    ]


def _tome_attack(r):
    return [
        _f(r, armL=-62, aL=50, armR=-30, sprR=14, show=["glow_hand"], fx={"glow_hand": 0.5}),
        _f(r, armL=-66, aL=52, armR=-120, sprR=28, twist=10, lean=-4, show=["glow_hand"], fx={"glow_hand": 0.8}, cape=-4),
        _f(r, armL=-70, aL=54, armR=-160, sprR=22, twist=14, lean=-8, hz=0.03, show=["glow_hand", "glow_book"], fx={"glow_hand": 1.15}, cape=-8, tail=-6),
        _f(r, armL=-62, aL=50, armR=-92, sprR=-6, twist=-12, lean=14, step=0.18, show=["glow_burst", "glow_book"], fx={"glow_burst": 1.0}, legL=-20, legR=16, cape=18, tail=14),
        _f(r, armL=-60, aL=50, armR=-84, sprR=-4, twist=-8, lean=10, step=0.14, show=["glow_burst"], fx={"glow_burst": 0.6}, legL=-16, legR=12, cape=12),
        _f(r, armL=-56, aL=46, armR=-30, sprR=10, twist=-2, lean=3, step=0.04, cape=4),
    ]


def _staff_attack(r):
    return [
        _f(r, armR=-30, aR=8, sprR=10, armL=-20, sprL=10),
        _f(r, armR=-80, aR=0, sprR=12, armL=-40, sprL=16, lean=-4, show=["glow_staff"], fx={"glow_staff": 0.6}),
        _f(r, armR=-150, aR=-6, sprR=10, armL=-60, sprL=20, lean=-8, hz=0.03, show=["glow_staff"], fx={"glow_staff": 1.0}, cape=-6),
        _f(r, armR=-100, aR=48, sprR=-4, armL=-30, sprL=24, lean=12, step=0.2, twist=-10, show=["glow_staff", "glow_burst"], fx={"glow_staff": 1.2, "glow_burst": 1.0}, legL=-20, legR=16, cape=16, tail=12),
        _f(r, armR=-86, aR=40, sprR=-2, armL=-24, sprL=20, lean=8, step=0.15, show=["glow_burst"], fx={"glow_burst": 0.6}, legL=-14, legR=10, cape=10),
        _f(r, armR=-34, aR=10, sprR=8, armL=-6, sprL=12, lean=2, step=0.04),
    ]


ATTACKS = {
    "sword": _sword_attack,
    "axe": _axe_attack,
    "axe_torch": lambda r: _axe_attack(r, torch=True),
    "lance": _lance_attack,
    "lance_shield": _lance_shield_attack,
    "bow": _bow_attack,
    "tome": _tome_attack,
    "staff": _staff_attack,
}

# ------------------------------------------------------------------------------------------------
# Posing
# ------------------------------------------------------------------------------------------------

PARTS = ("root", "hips", "torso", "chest", "head", "tail", "leg_L", "leg_R", "arm_L", "arm_R", "wrist_L", "wrist_R", "cape", "fx")


def rig(uid):
    return {p: bpy.data.objects.get(f"{uid}_{p}") for p in PARTS}


def unit_objects(uid):
    col = bpy.data.collections[f"U_{uid}"]
    return list(col.all_objects)


def apply_pose(uid, direction, p, frame_idx=0):
    if direction in p.get("over", {}):
        p = dict(p, **p["over"][direction])
    r = rig(uid)
    for k, ob in r.items():
        if ob is None:
            continue
        ob.rotation_euler = (0, 0, 0)
        ob.location = tuple(ob["rest"])
    rad = math.radians
    yaw = rad(DIRS[direction])
    root = r["root"]
    root.rotation_euler.z = yaw
    step = p.get("step", 0.0)
    root.location = (step * math.sin(yaw), -step * math.cos(yaw), 0)
    r["hips"].location.z += p.get("hz", 0.0)
    r["torso"].location.z += p.get("tz", 0.0)
    r["torso"].rotation_euler = (rad(p.get("lean", 0)), 0, rad(p.get("twist", 0)))
    r["head"].rotation_euler.x = rad(p.get("head", 0))
    r["head"].rotation_euler.z = rad(p.get("twist", 0) * -0.4)
    r["leg_L"].rotation_euler = (rad(p.get("legL", 0)), rad(-p.get("sprLegL", 0)), 0)
    r["leg_R"].rotation_euler = (rad(p.get("legR", 0)), rad(p.get("sprLegR", 0)), 0)
    armL, armR = p.get("armL", 0), p.get("armR", 0)
    r["arm_L"].rotation_euler = (rad(armL), rad(-p.get("sprL", 0)), 0)
    r["arm_R"].rotation_euler = (rad(armR), rad(p.get("sprR", 0)), 0)
    if "aR" in p:
        r["wrist_R"].rotation_euler.x = rad(p["aR"] - armR)
    r["wrist_R"].rotation_euler.y = rad(-p.get("tR", 0))
    if "aL" in p:
        r["wrist_L"].rotation_euler.x = rad(p["aL"] - armL)
    r["wrist_L"].rotation_euler.y = rad(p.get("tL", 0))
    if r["cape"] is not None:
        r["cape"].rotation_euler.x = rad(p.get("cape", 0) + p.get("lean", 0) * -0.5)
    if r["tail"] is not None:
        r["tail"].rotation_euler.x = rad(p.get("tail", 0))
    # tagged objects: visibility + optional scale (fx)
    show = set(p.get("show", []))
    if "smear" in show and direction in ("s", "n"):
        show.discard("smear")
        show.add("smear_front")
    fx = p.get("fx", {})
    for ob in unit_objects(uid):
        tag = ob.get("hc_tag")
        if tag:
            ob.hide_render = tag not in show
            if "rest_scale" in ob:
                s = fx.get(tag, 1.0)
                ob.scale = tuple(v * s for v in ob["rest_scale"])
        flick = ob.get("hc_flicker")
        if flick:
            k = [1.0, 1.15, 0.9, 1.08, 0.95, 1.12][frame_idx % 6]
            rs = ob["rest_scale"]
            ob.scale = (rs[0] * (2 - k) ** 0.5, rs[1] * (2 - k) ** 0.5, rs[2] * k)


# ------------------------------------------------------------------------------------------------
# Rendering
# ------------------------------------------------------------------------------------------------


def _render_passes(sc, base):
    vl = sc.view_layers[0]
    for suffix, mat in (("id", None), ("n", bpy.data.materials["HC_normal"]), ("z", bpy.data.materials["HC_depth"])):
        vl.material_override = mat
        sc.render.filepath = f"{base}_{suffix}.png"
        bpy.ops.render.render(write_still=True, scene=sc.name)
    vl.material_override = None


def only(sc, colname):
    for col in sc.collection.children:
        col.hide_render = col.name != colname


def write_roles(out):
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "roles.json"), "w", encoding="utf-8") as f:
        json.dump(role_table(), f, indent=1)


def render_unit(uid, out, rows=None, frames=None):
    sc = get_scene()
    normal_material()
    depth_material()
    setup_render(sc)
    setup_camera(sc, CELL, ANCHOR)
    only(sc, f"U_{uid}")
    meta = json.loads(bpy.data.objects[f"{uid}_root"]["hc_meta"])
    weapon = meta["weapon"]
    d = os.path.join(out, uid)
    os.makedirs(d, exist_ok=True)
    write_roles(out)
    n = 0
    row_meta = []
    for name, anim, direction, fps, loop in UNIT_ROWS:
        fr = anim_frames(weapon, anim)
        row_meta.append({"name": name, "frames": len(fr), "fps": fps, "loop": loop})
        if rows and name not in rows:
            continue
        for i, p in enumerate(fr):
            if frames and i not in frames:
                continue
            apply_pose(uid, direction, p, i)
            bpy.context.view_layer.update()
            _render_passes(sc, os.path.join(d, f"{name}_{i}"))
            n += 1
    apply_pose(uid, "s", REST[weapon], 0)
    with open(os.path.join(d, "meta.json"), "w", encoding="utf-8") as f:
        json.dump({"cell": [CELL, CELL], "anchor": list(ANCHOR), "rows": row_meta, "kind": "unit"}, f, indent=1)
    return n


def render_prop(pid, out, cell=96, anchor=(48, 87), pitch=None):
    """Props: collection P_<pid>, one child empty per state named <pid>_state_<row>."""
    sc = get_scene()
    normal_material()
    depth_material()
    setup_render(sc)
    setup_camera(sc, cell, anchor, pitch or CAM_PITCH_DEG)
    only(sc, f"P_{pid}")
    d = os.path.join(out, pid)
    os.makedirs(d, exist_ok=True)
    write_roles(out)
    col = bpy.data.collections[f"P_{pid}"]
    states = sorted([c for c in col.children], key=lambda c: c.get("order", 0))
    row_meta = []
    for st in states:
        for other in states:
            other.hide_render = other is not st
        row = st["row"]
        _render_passes(sc, os.path.join(d, f"{row}_0"))
        row_meta.append({"name": row, "frames": 1, "fps": 0, "loop": "once"})
    for st in states:
        st.hide_render = False
    with open(os.path.join(d, "meta.json"), "w", encoding="utf-8") as f:
        json.dump({"cell": [cell, cell], "anchor": list(anchor), "rows": row_meta, "kind": "prop"}, f, indent=1)
    setup_camera(sc, CELL, ANCHOR)
    return len(row_meta)
