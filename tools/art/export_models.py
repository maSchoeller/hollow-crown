"""Hollow Crown – 3D model export for the battle board (concept/01-decisions.md D4, D5, D12, D13).

blender -b --factory-startup --python tools/art/export_models.py -- <out_dir> [<id> ...]

Builds units/props with the sprite pipeline's builders (blender_*.py) and writes glTF binaries:
  <out>/units/<id>.glb            one skinned mesh (a bone per joint and fx mesh), animations idle/walk/attack/hit/downed
  <out>/props/<id>_<state>.glb    one static mesh per prop state (tree_a, house_razed, chest_open …)

Colours: one material that reads the vertex colours (COLOR_0, linear). Each role gets its ramp's mid
tone. Team cloth (key colours K0–K3) keeps a neutral colour and stores the key index in vertex alpha
(alpha = (k + 1) / 8, everything else 1); the renderer swaps in the team ramp.
Units: 1 glTF unit = 1 board tile; figures face +Z after the glTF Y-up conversion (Blender −Y).
"""
import importlib.util
import json
import math
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.join(ROOT, "art", "models")

ns = {"HC_TOOLS": HERE, "__file__": os.path.join(HERE, "blender_load.py")}
exec(compile(open(os.path.join(HERE, "blender_load.py"), encoding="utf-8").read(), "blender_load.py", "exec"), ns)
IDS = argv[1:] or list(ns["UNITS"]) + list(ns["PROPS"])

spec = importlib.util.spec_from_file_location("hc_ramps", os.path.join(HERE, "ramps.py"))
ramps = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ramps)
PALETTE = [l.strip() for l in open(os.path.join(ROOT, "art", "palette", "hollow-64.hex")) if l.strip()]
TILE_UNITS = 48 / ns["PX_PER_UNIT"]  # Blender units per board tile
FPS = 24
# (animation, sprite fps, loop) – timings match the sprite rows in art/sprites/units/*/sheet.json
ANIMS = [("idle", 6, "pingpong"), ("walk", 10, "loop"), ("attack", 12, "once"), ("hit", 12, "once"), ("downed", 1, "once")]
HIDDEN = 1e-4  # scale of a tagged object outside the frames that show it (glTF has no visibility track)
# Props drawn in large numbers (forests, rock fields) are thinned out: round shapes keep their silhouette
# with a third of the triangles. Ratio for Blender's collapse decimation; props not listed keep everything.
PROP_DECIMATE = {"tree": 0.35, "rock": 0.3}


def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def role_rgba(role):
    spec_ = ramps.ROLES[role]
    ramp, kind = spec_["ramp"], spec_.get("kind", "cloth")
    pick = ramp[1] if kind == "eye" else ramp[min(2, len(ramp) - 1)]
    if isinstance(pick, str):  # team key K0..K3
        return (0.5, 0.5, 0.5, (int(pick[1]) + 1) / 8)
    h = PALETTE[pick]
    return tuple(lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


def vertex_material():
    m = bpy.data.materials.get("HC_Vertex")
    if m:
        return m
    m = bpy.data.materials.new("HC_Vertex")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.85
    return m


def baked_mesh(ob, matrix):
    """Evaluated copy of `ob` (modifiers applied), transformed by `matrix`, coloured per face by role."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    me.transform(matrix)
    if matrix.determinant() < 0:
        me.flip_normals()
    roles = [s.material.get("hc_role") if s.material else None for s in ob.material_slots]
    col = me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
    for poly in me.polygons:
        role = roles[poly.material_index] if poly.material_index < len(roles) else None
        rgba = role_rgba(role) if role in ramps.ROLES else (0.6, 0.6, 0.6, 1.0)
        for li in poly.loop_indices:
            col.data[li].color = rgba
    while me.uv_layers:
        me.uv_layers.remove(me.uv_layers[0])
    me.materials.clear()
    me.materials.append(vertex_material())
    return me


def join(objs, name):
    if len(objs) > 1:
        with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs):
            bpy.ops.object.join()
    objs[0].name = name
    return objs[0]


def rest_pose(uid, weapon, animated):
    """Neutral pose with every NLA track muted; fx meshes at full size so they can be baked."""
    for o in animated:
        if o.animation_data:
            o.animation_data.action = None
            for t in o.animation_data.nla_tracks:
                t.mute = True
    ns["apply_pose"](uid, "s", {k: v for k, v in ns["REST"][weapon].items() if k != "over"}, 0)
    for o in animated:
        if o.get("hc_tag"):
            o.scale = tuple(o["rest_scale"])
    bpy.context.view_layer.update()


def skin_unit(uid, weapon, col):
    """Turns the rigid rig into one skinned mesh: a bone per joint and per fx mesh, all meshes joined.

    The joint animations (keyframe_anims, on the empties) are sampled frame by frame onto the bones,
    so the board draws one mesh per figure instead of one per joint.
    """
    from mathutils import Matrix, Vector
    rig = {k: v for k, v in ns["rig"](uid).items() if v is not None}
    meshes = [o for o in col.all_objects if o.type == "MESH"]
    tagged = [o for o in meshes if o.get("hc_tag")]
    animated = list(rig.values()) + tagged
    names = {o.name for o in animated}
    rest_pose(uid, weapon, animated)

    data = bpy.data.armatures.new(f"{uid}_skeleton")
    arm = bpy.data.objects.new(f"{uid}_skeleton", data)
    col.objects.link(arm)
    sc = ns["get_scene"]()
    layer = sc.view_layers[0]
    layer.objects.active = arm
    with bpy.context.temp_override(scene=sc, view_layer=layer, active_object=arm, object=arm, selected_objects=[arm], selected_editable_objects=[arm]):
        bpy.ops.object.mode_set(mode="EDIT")
        for o in animated:
            eb = data.edit_bones.new(o.name)
            eb.head = (0, 0, 0)
            eb.tail = (0, 0.1, 0)
            eb.matrix = o.matrix_world.normalized()
        for o in animated:
            if o.parent is not None and o.parent.name in names:
                data.edit_bones[o.name].parent = data.edit_bones[o.parent.name]
        bpy.ops.object.mode_set(mode="OBJECT")

    # one mesh, every vertex bound to the bone of the joint (or fx mesh) it belonged to
    pieces = []
    for ob in meshes:
        bone = ob.name if ob.get("hc_tag") else (ob.parent.name if ob.parent is not None and ob.parent.name in names else rig["root"].name)
        nob = bpy.data.objects.new(f"{ob.name}_s", baked_mesh(ob, ob.matrix_world.copy()))
        col.objects.link(nob)
        vg = nob.vertex_groups.new(name=bone)
        vg.add(list(range(len(nob.data.vertices))), 1.0, "REPLACE")
        pieces.append(nob)
    body = join(pieces, f"{uid}_body")
    body.parent = arm
    body.matrix_parent_inverse = Matrix.Identity(4)
    mod = body.modifiers.new("skeleton", "ARMATURE")
    mod.object = arm

    # sample the joint animations onto the bones: basis = rest_rel⁻¹ · pose(parent)⁻¹ · pose(bone)
    rest = {b.name: b.matrix_local.copy() for b in data.bones}
    arm.animation_data_create()
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
    for anim, _fps, _loop in ANIMS:
        end = 1.0
        for o in animated:
            track = o.animation_data.nla_tracks.get(anim) if o.animation_data else None
            o.animation_data.action = track.strips[0].action if track else None
            if o.animation_data.action:
                end = max(end, o.animation_data.action.frame_range[1])
        frames = sorted({float(f) for f in range(1, int(end) + 1)} | {end})
        act = bpy.data.actions.new(f"{uid}_{anim}")
        arm.animation_data.action = act
        for f in frames:
            sc.frame_set(int(f), subframe=f - int(f))
            pose = {o.name: o.matrix_world.copy() for o in animated}
            for b in data.bones:
                if b.parent:
                    basis = (rest[b.parent.name].inverted() @ rest[b.name]).inverted() @ pose[b.parent.name].inverted() @ pose[b.name]
                else:
                    basis = rest[b.name].inverted() @ pose[b.name]
                pb = arm.pose.bones[b.name]
                pb.matrix_basis = basis
                for path in ("location", "rotation_quaternion", "scale"):
                    pb.keyframe_insert(path, frame=f)
        track = arm.animation_data.nla_tracks.new()
        track.name = anim
        track.strips.new(anim, 1, act)
        arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)
    for o in meshes:
        bpy.data.objects.remove(o, do_unlink=True)
    for o in rig.values():
        bpy.data.objects.remove(o, do_unlink=True)
    return arm


def keyframe_anims(uid, weapon, meta):
    rig = ns["rig"](uid)
    tagged = [o for o in bpy.data.collections[f"U_{uid}"].all_objects if o.get("hc_tag")]
    animated = [o for o in rig.values() if o is not None] + tagged
    for o in animated:
        o.animation_data_create()
    for anim, fps, loop in ANIMS:
        frames = ns["anim_frames"](weapon, anim)
        if anim == "attack" and meta.get("atk"):
            frames = [dict(f, **meta["atk"].get(str(i), {})) for i, f in enumerate(frames)]
        n = len(frames)
        order = list(range(n))
        if loop == "pingpong" and n > 2:
            order += list(range(n - 2, 0, -1))
        if loop in ("pingpong", "loop") or n == 1:
            order.append(0)  # closes the loop (or gives a still pose a length)
        step = FPS / fps
        for o in animated:
            o.animation_data.action = None
        for j, i in enumerate(order):
            pose = {k: v for k, v in frames[i].items() if k != "over"}
            ns["apply_pose"](uid, "s", pose, i)
            bpy.context.view_layer.update()
            frame = 1 + j * step
            for o in animated:
                if o.get("hc_tag"):
                    s = tuple(o.scale) if not o.hide_render else (HIDDEN, HIDDEN, HIDDEN)
                    o.scale = s
                    o.keyframe_insert("scale", frame=frame)
                    o.hide_render = False
                else:
                    o.keyframe_insert("location", frame=frame)
                    o.keyframe_insert("rotation_euler", frame=frame)
        for o in animated:
            act = o.animation_data.action
            if act is None:
                continue
            act.name = f"{uid}_{anim}_{o.name}"
            if o.get("hc_tag"):
                for fc in getattr(act, "fcurves", []):
                    for kp in fc.keyframe_points:
                        kp.interpolation = "CONSTANT"
            track = o.animation_data.nla_tracks.new()
            track.name = anim
            track.strips.new(anim, 1, act)
            o.animation_data.action = None
    ns["apply_pose"](uid, "s", {k: v for k, v in ns["REST"][weapon].items() if k != "over"}, 0)
    for o in tagged:  # rest pose: fx hidden
        o.scale = (HIDDEN, HIDDEN, HIDDEN)


def wrap(name, objs_root):
    w = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(w)
    w.scale = (1 / TILE_UNITS,) * 3
    for r in objs_root:
        r.parent = w
    return w


def select_tree(root):
    bpy.ops.object.select_all(action="DESELECT")
    stack = [root]
    while stack:
        o = stack.pop()
        o.hide_set(False)
        o.hide_viewport = False
        o.select_set(True)
        stack.extend(o.children)
    bpy.context.view_layer.objects.active = root


def export(path, animations):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_vertex_color="ACTIVE",
        export_animations=animations,
        export_animation_mode="NLA_TRACKS",
        export_optimize_animation_size=True,
        export_cameras=False,
        export_lights=False,
    )


def visible_in_layer(col):
    def find(lc):
        if lc.collection == col:
            return lc
        for c in lc.children:
            r = find(c)
            if r:
                return r
    lc = find(bpy.context.view_layer.layer_collection)
    if lc:
        lc.exclude = False
        lc.hide_viewport = False
    col.hide_viewport = False


def export_unit(uid):
    ns["build_units"]([uid])
    col = bpy.data.collections[f"U_{uid}"]
    visible_in_layer(col)
    root = bpy.data.objects[f"{uid}_root"]
    meta = json.loads(root["hc_meta"])
    keyframe_anims(uid, meta["weapon"], meta)
    arm = skin_unit(uid, meta["weapon"], col)
    w = wrap(f"HC_{uid}", [arm])
    select_tree(w)
    path = os.path.join(OUT, "units", f"{uid}.glb")
    export(path, True)
    return [path]


def export_prop(pid):
    from mathutils import Matrix
    ns["build_props"]([pid])
    col = bpy.data.collections[f"P_{pid}"]
    visible_in_layer(col)
    states = sorted(col.children, key=lambda c: c.get("order", 0))
    paths = []
    for st in states or [None]:
        objs = [o for o in col.objects if o.type == "MESH"] + ([o for o in st.all_objects if o.type == "MESH"] if st else [])
        baked = []
        for ob in objs:
            nob = bpy.data.objects.new(f"{ob.name}_b", baked_mesh(ob, ob.matrix_world.copy()))
            bpy.context.scene.collection.objects.link(nob)
            nob.matrix_world = Matrix.Identity(4)
            baked.append(nob)
        name = f"{pid}_{st['row']}" if st else pid
        mesh = join(baked, f"{name}_mesh")
        if pid in PROP_DECIMATE:
            dec = mesh.modifiers.new("decimate", "DECIMATE")
            dec.decimate_type = "COLLAPSE"
            dec.ratio = PROP_DECIMATE[pid]
        w = wrap(f"HC_{name}", [mesh])
        select_tree(w)
        path = os.path.join(OUT, "props", f"{name}.glb")
        export(path, False)
        paths.append(path)
        for o in [mesh, w]:
            bpy.data.objects.remove(o, do_unlink=True)
    return paths


# the factory start-up scene brings a cube, a camera and a light that must not end up in the files
for ob in list(bpy.data.objects):
    if ob.name in ("Cube", "Camera", "Light"):
        bpy.data.objects.remove(ob, do_unlink=True)
sc = ns["get_scene"]()
if bpy.context.window:
    bpy.context.window.scene = sc
sc.render.fps = FPS
for sid in IDS:
    paths = export_unit(sid) if sid in ns["UNITS"] else export_prop(sid)
    for p in paths:
        print(f"[hc] {os.path.relpath(p, OUT)}: {os.path.getsize(p) / 1024:.0f} KB", flush=True)
