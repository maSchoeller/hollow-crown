"""Hollow Crown – acceptance renders of the stances (story 16.10): every stance of a figure in rest and in the fighting stance, with the real weapon models.

blender -b --factory-startup --python tools/art/stance_shots.py -- <out_dir> [--figs lucan,hask] [--only blade,lance_shield] [--clip rest|ready|both] [--view front|side|both]
python tools/art/stance_sheet.py <out_dir> <out.png> [--figs lucan,hask]

Needs art/models/units/<fig>.raw.glb: `python tools/art/tripo_units.py <fig> --keep-raw` leaves it (the model with every clip; the board's .glb has none of the
stance clips). Rest = the first row of rest_<stance>, ready = the last row of ready_in_<stance> (= the first row of ready_<stance>). The weapons hang on the
palm sockets with their `grip` node on the socket frame, like src/render/shared/models.ts attachGear does; a shield stance adds the shield on the left.
One image `<fig>_<stance>_<rest|ready>_<front|side>.png` per cell.
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
clips = argv[argv.index("--clip") + 1] if "--clip" in argv else "both"
views = argv[argv.index("--view") + 1] if "--view" in argv else "front"
SIZE = (300, 400)
FINGERS = ("Thumb", "Index", "Middle", "Ring", "Pinky")

# stance -> [(model, socket)] in rest and in ready (content/core/render.yaml gear)
STANCES = {
    "lance": {"rest": [("lance", "r")], "ready": [("lance", "r")]},
    "staff": {"rest": [("staff", "r")], "ready": [("staff", "r")]},
    "blade": {"rest": [("sword", "r")], "ready": [("sword", "r")]},
    "axe": {"rest": [("axe", "r")], "ready": [("axe", "r")]},
    "bow": {"rest": [("bow", "l")], "ready": [("bow", "l")]},
    "book": {"rest": [("book", "l")], "ready": [("book_open", "l")]},
    "lute": {"rest": [("lute", "l")], "ready": [("lute", "l")]},
    "none": {"rest": [], "ready": []},
}
ORDER = ["lance", "staff", "blade", "axe", "bow", "book", "lute", "none", "lance_shield", "blade_shield", "axe_shield", "staff_shield"]


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
    """{(bone, path): {array index: value}} of an action at a frame."""
    out = {}
    for fc in (cb for ly in action.layers for st in ly.strips for cb in st.channelbags for cb in cb.fcurves):
        if not fc.data_path.startswith("pose.bones["):
            continue
        bone = fc.data_path.split('"')[1]
        path = fc.data_path.rsplit(".", 1)[1]
        out.setdefault((bone, path), {})[fc.array_index] = fc.evaluate(frame)
    return out


def apply(arm, action, frame):
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
    for (bone, path), comps in sample(action, frame).items():
        if bone not in arm.pose.bones:
            continue
        pb = arm.pose.bones[bone]
        cur = list(getattr(pb, path))
        for i, v in comps.items():
            cur[i] = v
        setattr(pb, path, cur)
    bpy.context.view_layer.update()


def hang(model, side):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, "art", "models", "weapons-v2", f"{model}.glb"))
    new = [o for o in bpy.data.objects if o not in before]
    sock = bpy.data.objects[f"grip_{side}"]
    grip = next((o for o in new if o.name == "grip" or o.name.startswith("grip.")), None)
    for o in new:
        if o.parent is None and o is not grip:
            o.parent = sock
            o.matrix_parent_inverse = Matrix.Identity(4)
    if grip:
        grip.parent = sock
        grip.matrix_parent_inverse = Matrix.Identity(4)


def render_cell(fig, stance, pose, view):
    sc = clear()
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, "art", "models", "units", f"{fig}.raw.glb"))
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    base = stance[: -len("_shield")] if stance.endswith("_shield") else stance
    if arm.animation_data:
        arm.animation_data.action = None
        for tr in list(arm.animation_data.nla_tracks):
            arm.animation_data.nla_tracks.remove(tr)
    name = f"rest_{stance}" if pose == "rest" else f"ready_in_{stance}"
    act = bpy.data.actions.get(name)
    if act is None:
        return False
    frame = act.frame_range[0] if pose == "rest" else act.frame_range[1]
    apply(arm, act, frame)
    for model, side in STANCES[base][pose]:
        hang(model, side)
    if stance.endswith("_shield"):
        hang("shield", "l")
    apply(arm, act, frame)
    for o in bpy.data.objects:
        if o.type == "MESH" and o.data.materials:
            for m in o.data.materials:
                if m and m.use_nodes:
                    for n in m.node_tree.nodes:
                        if n.type == "BSDF_PRINCIPLED":
                            n.inputs["Metallic"].default_value = min(n.inputs["Metallic"].default_value, 0.4)
    centre = Vector((0, 0, 0.4))
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 1.0
    d = Vector((-0.55, -1.0, 0.25)).normalized() if view == "front" else Vector((-1.0, -0.05, 0.15)).normalized()
    cam.location = centre + d * 4
    cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.0
    sun.rotation_euler = (0.9, 0.2, 0.6)
    sc.collection.objects.link(sun)
    sc.render.filepath = os.path.join(OUT, f"{fig}_{stance}_{pose}_{view}.png")
    bpy.ops.render.render(write_still=True)
    return True


os.makedirs(OUT, exist_ok=True)
for fig in figs:
    for stance in ORDER:
        if only and stance not in only:
            continue
        for pose in (("rest", "ready") if clips == "both" else (clips,)):
            for view in (("front", "side") if views == "both" else (views,)):
                if not render_cell(fig, stance, pose, view):
                    print(f"[hc] {fig} {stance}: no clip", flush=True)
print("[hc] stance shots done", flush=True)
