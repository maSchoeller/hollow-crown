"""Hollow Crown – Pixel-Pipeline-Beweis (A0), Teil 2: Posen setzen und Frames rendern.

Erwartet die Szene aus blender_chibi.py. Rendert pro Frame zwei Durchgänge in 4-facher Größe:
<out>/<subject>/<anim>_<dir>_<frame>_c.png  (Farbe, Toon)
<out>/<subject>/<anim>_<dir>_<frame>_n.png  (Kameraraum-Normalen)
Die Verkleinerung auf 32/48 px und die Palette übernimmt pixelize.py.
"""
import math
import os
import bpy

PX_PER_UNIT = 12.4
SUPERSAMPLE = 4
DIRS = {"s": 0.0, "e": 90.0, "n": 180.0}

# Animationen (siehe concept/16-asset-pipeline.md §4.4). Werte je Frame, Winkel in Grad.
# arm: Rotation um die Querachse; negativ = nach vorn/oben.
ANIMS = {
    "idle": {"dirs": ["s"], "size": 32, "frames": [
        {"hips_z": 0.0, "arm": 0},
        {"hips_z": -0.04, "arm": 3},
        {"hips_z": -0.08, "arm": 6},
        {"hips_z": -0.04, "arm": 3},
    ]},
    "walk": {"dirs": ["s", "e", "n"], "size": 32, "frames": [
        {"leg": 28, "hips_z": 0.0},
        {"leg": 0, "hips_z": 0.07},
        {"leg": -28, "hips_z": 0.0},
        {"leg": 0, "hips_z": 0.07},
    ]},
    "attack": {"dirs": ["s", "e", "n"], "size": 48, "frames": [
        # Schwertwinkel = arm_r + wrist; 90° = Klinge zeigt waagerecht nach vorn
        {"arm_r": -25, "wrist": 0, "lean": 0, "step": 0.0},
        {"arm_r": -150, "wrist": 115, "lean": 6, "step": -0.05},
        {"arm_r": -175, "wrist": 130, "lean": 10, "step": -0.08},
        {"arm_r": -70, "wrist": 165, "lean": -18, "step": 0.35},   # Treffer-Frame (hitFrame: 3)
        {"arm_r": -50, "wrist": 150, "lean": -10, "step": 0.25},
        {"arm_r": -25, "wrist": 30, "lean": 0, "step": 0.05},
    ]},
    "hit": {"dirs": ["s"], "size": 32, "frames": [
        {"lean": 14, "step": -0.12},
        {"lean": 6, "step": -0.06},
    ]},
    "downed": {"dirs": ["s"], "size": 32, "frames": [
        {"hips_z": -0.34, "leg": -85, "lean": -38, "head": -20, "arm": 25},
    ]},
}

PROPS = {"prop_house": 2.0, "prop_tree": 2.2}


def rig(name):
    g = lambda part: bpy.data.objects[f"{name}_{part}"]
    return {p: g(p) for p in ("root", "hips", "torso", "head", "leg_L", "leg_R", "arm_L", "arm_R", "wrist")}


def reset(r):
    for ob in r.values():
        ob.rotation_euler = (0, 0, 0)
    r["hips"].location.z = 0.42
    r["root"].location = (0, 0, 0)


def apply_pose(r, direction, p):
    reset(r)
    yaw = math.radians(DIRS[direction])
    r["root"].rotation_euler.z = yaw
    step = p.get("step", 0.0)
    # „vorn“ ist die Blickrichtung der Figur (Start: -Y)
    r["root"].location = (step * math.sin(yaw), -step * math.cos(yaw), 0)
    r["hips"].location.z = 0.42 + p.get("hips_z", 0.0)
    leg = math.radians(p.get("leg", 0))
    r["leg_L"].rotation_euler.x = leg
    r["leg_R"].rotation_euler.x = -leg if "leg" in p and p.get("hips_z", 0) > -0.2 else leg
    arm = math.radians(p.get("arm", 0))
    r["arm_L"].rotation_euler.x = -leg * 0.7 if "leg" in p else arm
    r["arm_R"].rotation_euler.x = math.radians(p["arm_r"]) if "arm_r" in p else (leg * 0.7 if "leg" in p else arm)
    r["torso"].rotation_euler.x = math.radians(p.get("lean", 0))
    r["head"].rotation_euler.x = math.radians(p.get("head", 0))
    r["wrist"].rotation_euler.x = math.radians(p.get("wrist", 0))


def setup_frame(sc, size):
    sc.camera.data.ortho_scale = size / PX_PER_UNIT
    sc.render.resolution_x = sc.render.resolution_y = size * SUPERSAMPLE


def render_pair(sc, path_base):
    vl = sc.view_layers[0]
    vl.material_override = None
    sc.render.filepath = path_base + "_c.png"
    bpy.ops.render.render(write_still=True, scene=sc.name)
    vl.material_override = bpy.data.materials["HC_normal"]
    sc.render.filepath = path_base + "_n.png"
    bpy.ops.render.render(write_still=True, scene=sc.name)
    vl.material_override = None


def only(sc, name):
    for col in sc.collection.children:
        col.hide_render = col.name != name


def render_unit(sc, name, out):
    only(sc, name)
    r = rig(name)
    os.makedirs(os.path.join(out, name), exist_ok=True)
    count = 0
    for anim, spec in ANIMS.items():
        setup_frame(sc, spec["size"])
        for d in spec["dirs"]:
            for i, p in enumerate(spec["frames"]):
                apply_pose(r, d, p)
                bpy.context.view_layer.update()
                render_pair(sc, os.path.join(out, name, f"{anim}_{d}_{i}"))
                count += 1
    reset(r)
    return count


def render_prop(sc, name, out):
    only(sc, name)
    root = bpy.data.objects[f"{name}_root"]
    root.scale = (PROPS[name],) * 3
    os.makedirs(os.path.join(out, name), exist_ok=True)
    setup_frame(sc, 48)
    bpy.context.view_layer.update()
    render_pair(sc, os.path.join(out, name, "static_s_0"))
    return 1


def render_all(out, units=("kael", "bandit"), props=tuple(PROPS)):
    sc = bpy.data.scenes["HC_Sprites"]
    bpy.context.window.scene = sc
    n = 0
    for u in units:
        n += render_unit(sc, u, out)
    for p in props:
        n += render_prop(sc, p, out)
    return n
