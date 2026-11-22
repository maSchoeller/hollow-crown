"""Hollow Crown – acceptance renders of the grips (story 16.9): every weapon kind in the hand of a figure, rest pose and attack frame.

blender -b --factory-startup --python tools/art/grip_shots.py -- <out_dir> [--figs lucan,hask] [--only sword,bow]

Per figure and weapon one image `<fig>_<weapon>_<rest|attack>.png` in <out_dir>; tools/art/grip_sheet.py joins them into one sheet.
Poses as the board plays them: rest = the idle clip's first frame, attack = the weapon's attack clip at 0.25 s (the placeholder combat
stance until story 16.10), the fingers closed with the grip_<kind> clip of the weapon's grip kind, the weapon hung on the palm socket
(its `grip` node on the socket frame, like src/render/shared/models.ts attachGear does).
"""
import os
import sys

import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
figs = (argv[argv.index("--figs") + 1] if "--figs" in argv else "lucan,hask").split(",")
only = argv[argv.index("--only") + 1].split(",") if "--only" in argv else None
SIZE = (300, 400)
FINGERS = ("Thumb", "Index", "Middle", "Ring", "Pinky")

# weapon key -> (model file, hand, grip kind, attack clip)   (content/core/render.yaml gear)
WEAPONS = {
    "sword": ("sword", "r", "fist", "attack"),
    "dagger": ("dagger", "r", "fist", "attack"),
    "axe": ("axe", "r", "fist", "attack_chop"),
    "lance": ("lance", "r", "fist", "attack_thrust"),
    "staff": ("staff", "r", "fist", "attack_cast"),
    "bow": ("bow", "l", "bow", "attack_shoot"),
    "book": ("book_open", "l", "flat", "attack_cast"),
    "shield": ("shield", "l", "fist", "attack"),
    "lute": ("lute", "l", "lute", "attack"),
    "focus": ("focus", "l", "flat", "attack_cast"),
}


def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = SIZE
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.78, 0.8, 0.82, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 1.1
    sc.world = w
    return sc


def sample(action, frame):
    """{bone: {path index: value}} of an action at a frame."""
    out = {}
    for fc in (cb for ly in action.layers for st in ly.strips for cb in st.channelbags for cb in cb.fcurves):
        if not fc.data_path.startswith("pose.bones["):
            continue
        bone = fc.data_path.split('"')[1]
        path = fc.data_path.rsplit(".", 1)[1]
        out.setdefault((bone, path), {})[fc.array_index] = fc.evaluate(frame)
    return out


def apply(arm, base_name, t, grips):
    fps = bpy.context.scene.render.fps
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
    for (bone, path), comps in sample(bpy.data.actions[base_name], t * fps).items():
        if any(f in bone for f in FINGERS) or bone not in arm.pose.bones:
            continue
        pb = arm.pose.bones[bone]
        cur = list(getattr(pb, path))
        for i, v in comps.items():
            cur[i] = v
        setattr(pb, path, cur)
    for side, kind in grips.items():
        if kind in (None, "none"):
            continue
        for (bone, path), comps in sample(bpy.data.actions[f"grip_{kind}"], 0).items():
            if ("Left" if side == "l" else "Right") + "Hand" in bone and any(f in bone for f in FINGERS):
                pb = arm.pose.bones[bone]
                cur = list(getattr(pb, path))
                for i, v in comps.items():
                    cur[i] = v
                setattr(pb, path, cur)
    bpy.context.view_layer.update()


def render_cell(fig, wkey, pose):
    sc = clear()
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, "art", "models", "units", f"{fig}.glb"))
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    if arm.animation_data:
        arm.animation_data.action = None
        for tr in list(arm.animation_data.nla_tracks):
            arm.animation_data.nla_tracks.remove(tr)
    model, hand, kind, attack = WEAPONS[wkey]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, "art", "models", "weapons-v2", f"{model}.glb"))
    new = [o for o in bpy.data.objects if o not in before]
    sock = bpy.data.objects[f"grip_{hand}"]
    grip = next((o for o in new if o.name == "grip" or o.name.startswith("grip.")), None)
    for o in new:
        if o.parent is None and o is not grip:
            o.parent = sock
            o.matrix_parent_inverse = Matrix.Identity(4)
    if grip:
        grip.parent = sock
        grip.matrix_parent_inverse = Matrix.Identity(4)
    base, t = ("idle", 0.0) if pose == "rest" else (attack if attack in bpy.data.actions else "attack", 0.25)
    apply(arm, base, t, {hand: kind})
    m3 = sock.matrix_world.to_3x3()
    print(f"[hc] {fig} {wkey} {pose}: grip axis {tuple(round(v, 2) for v in m3.col[2].normalized())} edge {tuple(round(v, 2) for v in (-m3.col[1]).normalized())}", flush=True)
    for o in bpy.data.objects:
        if o.type == "MESH" and o.data.materials:
            for m in o.data.materials:
                if m and m.use_nodes:
                    for n in m.node_tree.nodes:
                        if n.type == "BSDF_PRINCIPLED":
                            n.inputs["Metallic"].default_value = min(n.inputs["Metallic"].default_value, 0.4)
    # camera: front three-quarter from the figure's right side (figure faces -Y), centred on the held weapon and the body
    centre = Vector((0, 0, 0.42))
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 1.5 if wkey in ("lance", "staff") else 1.1
    d = Vector((-0.55, -1.0, 0.25)).normalized()
    cam.location = centre + d * 4
    cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.0
    sun.rotation_euler = (0.9, 0.2, 0.6)
    sc.collection.objects.link(sun)
    sc.render.filepath = os.path.join(OUT, f"{fig}_{wkey}_{pose}.png")
    bpy.ops.render.render(write_still=True)


os.makedirs(OUT, exist_ok=True)
for fig in figs:
    for wkey in WEAPONS:
        if only and wkey not in only:
            continue
        for pose in ("rest", "attack"):
            render_cell(fig, wkey, pose)
print("[hc] grip shots done", flush=True)
