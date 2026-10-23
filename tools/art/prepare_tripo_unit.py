"""Hollow Crown – prepare a Tripo image-to-3D figure for the battle board (concept/23-art-direction §4.6).

blender -b --factory-startup --python tools/art/prepare_tripo_unit.py -- <in.glb> <out.glb> [--height 0.8] [--tex 512] [--faces 6000]
                                                                             [--anims <library.glb>]

Feet on z = 0, centred on the tile, facing south (Blender -Y, glTF +Z) and scaled to the board height of the
Blender figures (1 glTF unit = 1 tile, figureScale in content/render.yaml applies on top). Keeps only the base
colour map (the board shades with its own material), edge-padded and downsized to --tex pixels. Cloth painted in
key magenta becomes team cloth (neutral texture, team key in vertex alpha; see team_cloth()).

Static figures: --faces decimates the mesh to about that many triangles.
Rigged figures (Tripo auto-rig, Mixamo skeleton, presets exported "in place"): the Tripo presets and AI animations
are mapped by keyword to the board's animations and retimed to its sprite timing (src/render/assets.ts UNIT_ROWS):
attack (and attack_<motion> per weapon group) = 0.5 s with the impact at 0.25 s (hitFrame 3 at 12 fps), hit = 0.5 s; idle, walk and downed (last frame)
keep their length. --anims fills the animations the export lacks from another Tripo export (same Mixamo bone names),
transferred relative to each rig's rest pose (retarget()); a new figure then needs only the Tripo auto-rig.
Hand sockets (sockets()) carry the weapon layer (GA9): the renderer attaches the equipped weapon group at runtime.
Usually run for all figures through `pnpm art:tripo` (tools/art/tripo_units.py).
"""
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst = argv[0], argv[1]
height = float(argv[argv.index("--height") + 1]) if "--height" in argv else 0.8
tex = int(argv[argv.index("--tex") + 1]) if "--tex" in argv else 512
faces = int(argv[argv.index("--faces") + 1]) if "--faces" in argv else 0
anims = argv[argv.index("--anims") + 1] if "--anims" in argv else None

FPS = 12  # board animations are sampled at the sprite rate; halves the animation data
# Tripo preset (English action name prefix) -> board animation
PRESETS = {"idle": "idle", "walk": "walk", "slash": "attack", "hit_to_body_01": "hit", "fall": "downed"}
REQUIRED = set(PRESETS.values())
# attacks per weapon group (art-direction §4.5), attack_<motion>; content/render.yaml gear picks the motion per weapon.
# Optional: without one the renderer plays the sword's attack. AI animations are named after their prompt.
PRESETS.update({"bow shot": "attack_shoot", "axe chop": "attack_chop", "spear thrust": "attack_thrust",
                "cast_a_spell": "attack_cast"})
DOWNWARD = {"attack_chop"}  # impact at the fastest downward hand movement
ATTACK_HALF = 6  # source frames (at FPS) on each side of the impact; squeezed into 3 frames (0.25 s) each
SKIP = ("Thumb", "Index", "Middle", "Ring", "Pinky")  # finger bones: not readable at board size, never keyed
HAND = "mixamorig:RightHand"
TEAM_KEY = 2  # team ramp step for the cloth (K2 = mid tone, src/render/models.ts TEAM_RAMP)
CLOTH_GREY = 0.85  # texture value under the team colour

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
bpy.ops.import_scene.gltf(filepath=src)
arm = next((o for o in bpy.data.objects if o.type == "ARMATURE"), None)
skinned = [o for o in bpy.data.objects if o.type == "MESH" and o.parent is arm and arm is not None]
for o in [o for o in bpy.data.objects if o.type == "MESH" and o not in skinned and arm is not None]:
    bpy.data.objects.remove(o)  # bone display shapes from the importer

def board_actions(objects):
    """Board animation -> action of a Tripo export, keyword-mapped (PRESETS); only actions used by `objects`."""
    used = set()
    for o in objects:
        ad = o.animation_data
        if ad:
            used |= {s.action for t in ad.nla_tracks for s in t.strips if s.action}
            if ad.action:
                used.add(ad.action)
    found = {}
    for act in bpy.data.actions:
        # presets keep their English name, AI animations are named after their prompt ("A quick one-handed sword slash: …")
        key = next((k for k in PRESETS if k in act.name.lower()), None)
        if key and (act in used or not used):
            found[PRESETS[key]] = act
    return found


def impact_frame(rig, action, down=False):
    """Frame of the fastest right-hand movement (the swing's hit) in an action; `down`: fastest downward movement
    (a chop, whose wind-up can be faster than the blow)."""
    lo_f, hi_f = (int(f) for f in action.frame_range)
    rig.animation_data_create()
    for track in rig.animation_data.nla_tracks:  # the importer's tracks would blend under the action
        track.mute = True
    pos = []
    for f in range(lo_f, hi_f + 1):
        rig.animation_data.action = action
        scene.frame_set(f)
        pos.append((rig.matrix_world @ rig.pose.bones[HAND].head).copy())
    speed = [pos[i].z - pos[i + 1].z if down else (pos[i + 1] - pos[i]).length for i in range(len(pos) - 1)]
    rig.animation_data.action = None
    return lo_f + int(np.argmax(speed)) + 1


def retarget(lib, target, action, name):
    """Transfers `action` of armature `lib` onto armature `target`, relative to each rig's own rest pose.

    Tripo rigs share the Mixamo bone names but not their rest poses (arm angles, bone rolls, proportions), so local
    rotations cannot be copied. Per bone, the world rotation away from its rest pose is applied to the target bone's
    own rest orientation; the hips' movement is scaled by the hip height ratio. Both armatures as imported (same
    Tripo axes), before the board orientation.
    """
    names = [b.name for b in target.data.bones if b.name in lib.pose.bones]  # parents before children
    feet = "mixamorig:LeftFoot"
    hip = "mixamorig:Hips"
    ratio = ((target.matrix_world @ target.data.bones[hip].head_local).z - (target.matrix_world @ target.data.bones[feet].head_local).z) / \
            ((lib.matrix_world @ lib.data.bones[hip].head_local).z - (lib.matrix_world @ lib.data.bones[feet].head_local).z)
    s_rest = {n: (lib.matrix_world @ lib.data.bones[n].matrix_local) for n in names}
    t_rest = {n: (target.matrix_world @ target.data.bones[n].matrix_local) for n in names}
    t_arm = target.matrix_world.to_quaternion()
    lib.animation_data_create()
    for track in lib.animation_data.nla_tracks:  # the importer's tracks would blend under the sampled action
        track.mute = True
    lib.animation_data.action = action
    out = bpy.data.actions.new(name)
    target.animation_data_create()
    target.animation_data.action = out
    f0, f1 = action.frame_range
    steps = int(round((f1 - f0) * 2))  # half-frame samples: bake() resamples once more
    for i in range(steps + 1):
        f = f0 + (f1 - f0) * i / max(steps, 1)
        scene.frame_set(int(f), subframe=f - int(f))
        pose = {}  # armature-space pose matrices of the target, filled parent first
        for n in names:
            src = lib.matrix_world @ lib.pose.bones[n].matrix
            delta = src.to_quaternion() @ s_rest[n].to_quaternion().inverted()
            rot = t_arm.inverted() @ (delta @ t_rest[n].to_quaternion())  # target bone rotation in armature space
            bone = target.data.bones[n]
            pb = target.pose.bones[n]
            if bone.parent is None or bone.parent.name not in pose:
                moved = (src.translation - s_rest[n].translation) * ratio
                head = target.matrix_world.inverted() @ (t_rest[n].translation + moved)
                frame = bone.matrix_local
                basis = frame.inverted() @ (Matrix.Translation(head) @ rot.to_matrix().to_4x4())
                keys = ("location", "rotation_quaternion")
            else:
                frame = pose[bone.parent.name] @ (bone.parent.matrix_local.inverted() @ bone.matrix_local)
                basis = (frame.to_quaternion().inverted() @ rot).to_matrix().to_4x4()
                keys = ("rotation_quaternion",)
            pose[n] = frame @ basis
            pb.rotation_mode = "QUATERNION"
            pb.location, pb.rotation_quaternion = basis.to_translation(), basis.to_quaternion()
            for k in keys:
                pb.keyframe_insert(k, frame=f)
    lib.animation_data.action = None
    target.animation_data.action = None
    return out


own, library, hit_at = (board_actions([arm]) if arm else {}), {}, {}
if anims and arm is not None:
    before, before_actions = set(bpy.data.objects), set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=anims)
    lib_objs = [o for o in bpy.data.objects if o not in before]
    lib_arm = next((o for o in lib_objs if o.type == "ARMATURE"), None)
    if lib_arm is None:
        raise SystemExit(f"{anims}: no armature")
    for board, act in board_actions(lib_objs).items():
        if board.startswith("attack") and board not in own:
            hit_at[board] = impact_frame(lib_arm, act, board in DOWNWARD)  # a property of the animation; on another rig the hand's peaks shift
        if board not in own:  # the figure's own Tripo animations win over the library's
            library[board] = retarget(lib_arm, arm, act, f"{board}_library")
    for o in lib_objs:
        bpy.data.objects.remove(o)
    for act in set(bpy.data.actions) - before_actions - set(library.values()):
        bpy.data.actions.remove(act)
    print(f"[hc] animations from {os.path.basename(anims)}: {', '.join(sorted(library)) or 'none'}", flush=True)

if arm is None:
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    for o in bpy.data.objects:
        o.select_set(o in meshes)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if faces and len(obj.data.polygons) > faces:
        dec = obj.modifiers.new("Decimate", "DECIMATE")
        dec.ratio = faces / len(obj.data.polygons)
        dec.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=dec.name)
    root, body = obj, obj
else:
    root, body = arm, skinned[0]


def rest_bounds():
    """World-space bounds of the figure in its rest pose."""
    if arm:
        arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for o in ([body] if not arm else skinned):
        ev = o.evaluated_get(dg)
        m = ev.to_mesh()
        pts += [ev.matrix_world @ v.co for v in m.vertices]
        ev.to_mesh_clear()
    if arm:
        arm.data.pose_position = "POSE"
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


# the board's figures face -Y (glTF +Z), feet on z = 0. Rigged Tripo figures already face -Y (their right hand on -X);
# turn by 180° only if the hands say otherwise. Static exports were taken to face +Y (first test, not re-checked).
if arm:
    hands = [(arm.matrix_world @ arm.data.bones[f"mixamorig:{s}Hand"].head_local).x for s in ("Right", "Left")]
    turn = hands[0] > hands[1]
else:
    turn = True
lo, hi = rest_bounds()
k = height / (hi.z - lo.z)
centre = Matrix.Translation(Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)))
root.matrix_world = Matrix.Rotation(np.pi if turn else 0, 4, "Z") @ Matrix.Scale(k, 4) @ centre @ root.matrix_world
if arm is None:
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def snapshot(action, frame):
    """matrix_basis of every pose bone at a (fractional) frame of an action."""
    arm.animation_data.action = action
    scene.frame_set(int(frame), subframe=frame - int(frame))
    return {pb.name: pb.matrix_basis.copy() for pb in arm.pose.bones}


def span(action):
    """Number of output frames covering an action at FPS."""
    return int(action.frame_range[1] - action.frame_range[0]) + 1


def bake(action, name, t0, t1, frames):
    """Resamples action between source frames t0..t1 into a new action of `frames` frames (from frame 0)."""
    poses = [snapshot(action, t0 + (t1 - t0) * i / (frames - 1)) for i in range(frames)]
    out = bpy.data.actions.new(name)
    arm.animation_data.action = out
    for i, pose in enumerate(poses):
        for pb in arm.pose.bones:
            if any(s in pb.name for s in SKIP):
                continue
            pb.matrix_basis = pose[pb.name]
            pb.rotation_mode = "QUATERNION"
            # only the hips move; every other bone just rotates (Mixamo bones keep their length and scale)
            for path in (("location", "rotation_quaternion") if pb.parent is None else ("rotation_quaternion",)):
                pb.keyframe_insert(path, frame=i)
    out.use_fake_user = True
    return out


if arm:
    arm.animation_data_create()
    found = {**own, **library}
    missing = REQUIRED - set(found)
    if missing:
        raise SystemExit(f"missing Tripo presets for {sorted(missing)} (export them from Tripo or pass --anims)")
    keep = {
        "idle": bake(found["idle"], "idle", *found["idle"].frame_range, span(found["idle"])),
        "walk": bake(found["walk"], "walk", *found["walk"].frame_range, span(found["walk"])),
        "hit": bake(found["hit"], "hit", *found["hit"].frame_range, FPS // 2 + 1),
        "downed": bake(found["downed"], "downed", *found["downed"].frame_range, span(found["downed"])),
    }
    for name in sorted(n for n in found if n.startswith("attack")):
        hit = hit_at.get(name) or impact_frame(arm, found[name], name in DOWNWARD)
        a0, a1 = found[name].frame_range
        t0, t1 = max(a0, hit - ATTACK_HALF), min(a1, hit + ATTACK_HALF)
        keep[name] = bake(found[name], name, t0, t1, FPS // 2 + 1)
        print(f"[hc] {name} impact at source frame {hit}, window {t0:.0f}–{t1:.0f}", flush=True)
    for act in list(bpy.data.actions):
        if act not in keep.values():
            bpy.data.actions.remove(act)
    arm.animation_data.action = None
    for track in list(arm.animation_data.nla_tracks):  # the importer's tracks of the original presets
        arm.animation_data.nla_tracks.remove(track)
    for pb in arm.pose.bones:
        pb.matrix_basis = Matrix()
    for name, act in keep.items():  # one NLA track per animation: the glTF exporter writes one animation each
        track = arm.animation_data.nla_tracks.new()
        track.name = name
        track.strips.new(name, 0, act)

# base colour only
base = None
for m in body.data.materials:
    for n in m.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED" and n.inputs["Base Color"].is_linked:
            base = n.inputs["Base Color"].links[0].from_node.image
if base is None:
    raise SystemExit("no base colour texture")


def pad_islands(image, rounds=24):
    """Edge padding: grow every UV island into the black background, so mipmaps do not darken the seams."""
    w, h = image.size
    px = np.empty(w * h * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    filled = px[..., :3].sum(2) > 0.02
    for _ in range(rounds):
        acc = np.zeros((h, w, 3), np.float32)
        cnt = np.zeros((h, w), np.float32)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            m = np.roll(filled, (dy, dx), (0, 1))
            acc += np.roll(px[..., :3], (dy, dx), (0, 1)) * m[..., None]
            cnt += m
        grow = ~filled & (cnt > 0)
        if not grow.any():
            break
        px[grow, :3] = acc[grow] / cnt[grow, None]
        filled |= grow
    px[..., 3] = 1.0
    image.pixels.foreach_set(px.ravel())


pad_islands(base)
base.scale(tex, tex)


def team_cloth(image, mesh):
    """Key-magenta cloth (#FF00FF in the turnaround) -> neutral texture + team key in vertex alpha.

    The texture keeps a light grey there; the vertices on the cloth get colour (1, 1, 1, (TEAM_KEY + 1) / 8), all
    others (1, 1, 1, 1). src/render/models.ts teamColours() swaps the key for the team ramp, the board's material
    multiplies it with the texture: the same contract as the Blender figures' K0–K3 cloth (export_models.py).
    """
    w, h = image.size
    px = np.empty(w * h * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    key = np.clip((np.minimum(r, b) - g - 0.15) / 0.35, 0, 1)  # 1 on pure magenta, 0 off it, soft at the edges
    px[..., :3] = px[..., :3] * (1 - key[..., None]) + CLOTH_GREY * key[..., None]
    image.pixels.foreach_set(px.ravel())
    hit = np.zeros(len(mesh.vertices))
    seen = np.zeros(len(mesh.vertices))
    uv = mesh.uv_layers.active.data
    for li, loop in enumerate(mesh.loops):
        u, v = uv[li].uv
        hit[loop.vertex_index] += key[min(h - 1, max(0, int(v * h))), min(w - 1, max(0, int(u * w)))]
        seen[loop.vertex_index] += 1
    cloth = hit / np.maximum(seen, 1) > 0.5
    attr = mesh.color_attributes.new("team", "FLOAT_COLOR", "POINT")
    alpha = np.where(cloth, (TEAM_KEY + 1) / 8, 1.0)
    attr.data.foreach_set("color", np.c_[np.ones((len(alpha), 3)), alpha].astype(np.float32).ravel())
    mesh.color_attributes.active_color = attr
    return int(cloth.sum())


cloth_vertices = team_cloth(base, body.data)
mat = bpy.data.materials.new("HC_Tripo")
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
img = nt.nodes.new("ShaderNodeTexImage")
img.image = base
nt.links.new(img.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.9
body.data.materials.clear()
body.data.materials.append(mat)
body.name = "body"


def sockets():
    """Empties `socket_r` / `socket_l` in the fists, parented to the hand bones: the renderer hangs the weapon library
    (tools/art/blender_weapons.py) there by weapon group (GA9). Frame in the rest pose: +Y up along the hand towards the
    forearm, +Z forward across the fist (the grip axis), +X = Y × Z (the figure's left); unit scale in board units."""
    arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    fwd = Vector((0, -1, 0))
    made = []
    for name, side in (("socket_r", "Right"), ("socket_l", "Left")):
        bone = arm.data.bones[f"mixamorig:{side}Hand"]
        m = arm.matrix_world @ bone.matrix_local
        y = -m.col[1].to_3d().normalized()  # bone +Y runs along the fingers, away from the forearm
        z = (fwd - y * fwd.dot(y)).normalized()  # forward across the fist, whatever the bone's roll
        x = y.cross(z)
        grip = arm.matrix_world @ (bone.head_local + (bone.tail_local - bone.head_local) * 0.5)
        frame = Matrix((x, y, z)).transposed().to_4x4()
        frame.translation = grip
        ob = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(ob)
        ob.parent = arm
        ob.parent_type = "BONE"
        ob.parent_bone = bone.name
        ob.matrix_world = frame
        made.append(ob)
    arm.data.pose_position = "POSE"
    return made


if arm:
    sockets()

bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", use_selection=False, export_image_format="JPEG",
                          export_jpeg_quality=88, export_apply=arm is None, export_vertex_color="ACTIVE", export_animations=arm is not None,
                          export_animation_mode="NLA_TRACKS", export_force_sampling=False,
                          export_optimize_animation_size=True)
tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
print(f"[hc] {dst}: {tris} triangles, height {height}, texture {tex}px, rigged {arm is not None}, "
      f"team cloth {cloth_vertices} vertices", flush=True)
