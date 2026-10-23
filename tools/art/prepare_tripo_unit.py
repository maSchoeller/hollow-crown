"""Hollow Crown – prepare a Tripo image-to-3D figure for the battle board (concept/23-art-direction §4.6).

blender -b --factory-startup --python tools/art/prepare_tripo_unit.py -- <in.glb> <out.glb> [--height 0.8] [--tex 512] [--faces 6000]

Feet on z = 0, centred on the tile, facing south (Blender -Y, glTF +Z) and scaled to the board height of the
Blender figures (1 glTF unit = 1 tile, figureScale in content/render.yaml applies on top). Keeps only the base
colour map (the board shades with its own material), edge-padded and downsized to --tex pixels.

Static figures: --faces decimates the mesh to about that many triangles.
Rigged figures (Tripo auto-rig, Mixamo skeleton, presets exported "in place"): the Tripo presets are renamed to the
board's animations and retimed to its sprite timing (src/render/assets.ts UNIT_ROWS): attack = 0.5 s with the
impact at 0.25 s (hitFrame 3 at 12 fps), hit = 0.5 s; idle, walk and downed (last frame) keep their length.
"""
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst = argv[0], argv[1]
height = float(argv[argv.index("--height") + 1]) if "--height" in argv else 0.8
tex = int(argv[argv.index("--tex") + 1]) if "--tex" in argv else 512
faces = int(argv[argv.index("--faces") + 1]) if "--faces" in argv else 0

FPS = 24
# Tripo preset (English action name prefix) -> board animation
PRESETS = {"idle": "idle", "walk": "walk", "slash": "attack", "hit_to_body_01": "hit", "fall": "downed"}
ATTACK_HALF = 12  # source frames on each side of the impact; squeezed into 6 frames (0.25 s) each
HAND = "mixamorig:RightHand"

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
bpy.ops.import_scene.gltf(filepath=src)
arm = next((o for o in bpy.data.objects if o.type == "ARMATURE"), None)
skinned = [o for o in bpy.data.objects if o.type == "MESH" and o.parent is arm and arm is not None]
for o in [o for o in bpy.data.objects if o.type == "MESH" and o not in skinned and arm is not None]:
    bpy.data.objects.remove(o)  # bone display shapes from the importer

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


# Tripo figures face +Y in Blender; the board's figures face -Y (glTF +Z): turn by 180°, feet to z = 0
lo, hi = rest_bounds()
k = height / (hi.z - lo.z)
centre = Matrix.Translation(Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)))
root.matrix_world = Matrix.Rotation(np.pi, 4, "Z") @ Matrix.Scale(k, 4) @ centre @ root.matrix_world
if arm is None:
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def snapshot(action, frame):
    """matrix_basis of every pose bone at a (fractional) frame of an action."""
    arm.animation_data.action = action
    scene.frame_set(int(frame), subframe=frame - int(frame))
    return {pb.name: pb.matrix_basis.copy() for pb in arm.pose.bones}


def bake(action, name, t0, t1, frames):
    """Resamples action between source frames t0..t1 into a new action of `frames` frames (from frame 0)."""
    poses = [snapshot(action, t0 + (t1 - t0) * i / (frames - 1)) for i in range(frames)]
    out = bpy.data.actions.new(name)
    arm.animation_data.action = out
    for i, pose in enumerate(poses):
        for pb in arm.pose.bones:
            pb.matrix_basis = pose[pb.name]
            pb.rotation_mode = "QUATERNION"
            for path in ("location", "rotation_quaternion", "scale"):
                pb.keyframe_insert(path, frame=i)
    out.use_fake_user = True
    return out


def impact_frame(action):
    """Frame of the fastest right-hand movement (the swing's hit) in an action."""
    lo_f, hi_f = (int(f) for f in action.frame_range)
    pos = []
    for f in range(lo_f, hi_f + 1):
        arm.animation_data.action = action
        scene.frame_set(f)
        pos.append((arm.matrix_world @ arm.pose.bones[HAND].head).copy())
    speed = [(pos[i + 1] - pos[i]).length for i in range(len(pos) - 1)]
    return lo_f + int(np.argmax(speed)) + 1


if arm:
    arm.animation_data_create()
    found = {}
    for act in list(bpy.data.actions):
        key = act.name.split(".")[0]
        if key in PRESETS:
            found[PRESETS[key]] = act
    missing = set(PRESETS.values()) - set(found)
    if missing:
        raise SystemExit(f"missing Tripo presets for {sorted(missing)}")
    hit_at = impact_frame(found["attack"])
    a0, a1 = found["attack"].frame_range
    t0, t1 = max(a0, hit_at - ATTACK_HALF), min(a1, hit_at + ATTACK_HALF)
    keep = {
        "idle": bake(found["idle"], "idle", *found["idle"].frame_range, int(found["idle"].frame_range[1] - found["idle"].frame_range[0]) + 1),
        "walk": bake(found["walk"], "walk", *found["walk"].frame_range, int(found["walk"].frame_range[1] - found["walk"].frame_range[0]) + 1),
        "attack": bake(found["attack"], "attack", t0, t1, 13),
        "hit": bake(found["hit"], "hit", *found["hit"].frame_range, 13),
        "downed": bake(found["downed"], "downed", *found["downed"].frame_range, int(found["downed"].frame_range[1] - found["downed"].frame_range[0]) + 1),
    }
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
    print(f"[hc] attack impact at source frame {hit_at}, window {t0:.0f}–{t1:.0f}", flush=True)

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

bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", use_selection=False, export_image_format="JPEG",
                          export_jpeg_quality=88, export_apply=arm is None, export_animations=arm is not None,
                          export_animation_mode="NLA_TRACKS", export_force_sampling=True)
tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
print(f"[hc] {dst}: {tris} triangles, height {height}, texture {tex}px, rigged {arm is not None}", flush=True)
