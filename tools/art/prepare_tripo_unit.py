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

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst = argv[0], argv[1]
height = float(argv[argv.index("--height") + 1]) if "--height" in argv else 0.8
tex = int(argv[argv.index("--tex") + 1]) if "--tex" in argv else 512
faces = int(argv[argv.index("--faces") + 1]) if "--faces" in argv else 0

FPS = 12  # board animations are sampled at the sprite rate; halves the animation data
# Tripo preset (English action name prefix) -> board animation
PRESETS = {"idle": "idle", "walk": "walk", "slash": "attack", "hit_to_body_01": "hit", "fall": "downed"}
ATTACK_HALF = 6  # source frames (at FPS) on each side of the impact; squeezed into 3 frames (0.25 s) each
SKIP = ("Thumb", "Index", "Middle", "Ring", "Pinky")  # finger bones: not readable at board size, never keyed
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
        # presets keep their English name, AI animations are named after their prompt ("A quick one-handed sword slash: …")
        key = next((k for k in PRESETS if k in act.name.lower()), None)
        if key:
            found[PRESETS[key]] = act
    missing = set(PRESETS.values()) - set(found)
    if missing:
        raise SystemExit(f"missing Tripo presets for {sorted(missing)}")
    hit_at = impact_frame(found["attack"])
    a0, a1 = found["attack"].frame_range
    t0, t1 = max(a0, hit_at - ATTACK_HALF), min(a1, hit_at + ATTACK_HALF)
    keep = {
        "idle": bake(found["idle"], "idle", *found["idle"].frame_range, span(found["idle"])),
        "walk": bake(found["walk"], "walk", *found["walk"].frame_range, span(found["walk"])),
        "attack": bake(found["attack"], "attack", t0, t1, FPS // 2 + 1),
        "hit": bake(found["hit"], "hit", *found["hit"].frame_range, FPS // 2 + 1),
        "downed": bake(found["downed"], "downed", *found["downed"].frame_range, span(found["downed"])),
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


def swatch(image, pick):
    """UV of the calmest texel whose colour satisfies pick(r, g, b) (the weapon reuses the figure's texture)."""
    w, h = image.size
    px = np.empty(w * h * 4, dtype=np.float32)
    image.pixels.foreach_get(px)
    rgb = px.reshape(h, w, 4)[..., :3]
    ok = pick(rgb[..., 0], rgb[..., 1], rgb[..., 2])
    var = np.zeros((h, w), np.float32)
    for dy in (-2, 0, 2):
        for dx in (-2, 0, 2):
            var += np.abs(np.roll(rgb, (dy, dx), (0, 1)) - rgb).sum(2)
    var[~ok] = np.inf
    y, x = np.unravel_index(np.argmin(var), var.shape)
    return (x + 0.5) / w, (y + 0.5) / h


def hand_sword(image):
    """Plain longsword parented to the right hand bone, blade pointing forward in the rest pose (GA9 weapon layer)."""
    def hsv(r, g, b):
        mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
        return mx, (mx - mn) / np.maximum(mx, 1e-4)
    steel = swatch(image, lambda r, g, b: (hsv(r, g, b)[0] > 0.55) & (hsv(r, g, b)[1] < 0.12))
    leather = swatch(image, lambda r, g, b: (r > g) & (g > b) & (hsv(r, g, b)[0] > 0.2) & (hsv(r, g, b)[0] < 0.45) & (hsv(r, g, b)[1] > 0.4))
    arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    bone = arm.data.bones[HAND]
    m = arm.matrix_world @ bone.matrix_local
    axes = [m.col[i].to_3d().normalized() for i in (0, 2)]
    fwd = Vector((0, -1, 0))
    blade = max((a * s for a in axes for s in (1, -1)), key=lambda a: a.dot(fwd))
    fingers = m.col[1].to_3d().normalized()
    side = blade.cross(fingers).normalized()
    grip = arm.matrix_world @ (bone.head_local + (bone.tail_local - bone.head_local) * 0.5)
    s = height  # sizes relative to the figure height
    parts = [  # (centre along blade, length, width, thickness, uv)
        (0.26 * s, 0.40 * s, 0.040 * s, 0.012 * s, steel),   # blade
        (0.05 * s, 0.020 * s, 0.11 * s, 0.022 * s, steel),   # guard
        (-0.035 * s, 0.09 * s, 0.022 * s, 0.022 * s, leather),  # grip
    ]
    verts, faces, uvs = [], [], []
    for c, ln, wd, th in [(p[0], p[1], p[2], p[3]) for p in parts]:
        base_i = len(verts)
        for dz in (-0.5, 0.5):
            for dx in (-0.5, 0.5):
                for dy in (-0.5, 0.5):
                    verts.append(grip + blade * (c + dz * ln) + side * (dx * wd) + fingers * (dy * th))
        faces += [[base_i + i for i in f] for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3))]
    me = bpy.data.meshes.new("weapon")
    me.from_pydata([arm.matrix_world.inverted() @ v for v in verts], [], faces)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)  # outward, whatever the handedness of the hand axes
    bm.to_mesh(me)
    bm.free()
    uv = me.uv_layers.new(name="UVMap")
    for poly, (_, _, _, _, st) in zip(me.polygons, [p for p in parts for _ in range(6)]):
        for li in poly.loop_indices:
            uv.data[li].uv = st
    me.materials.append(mat)
    ob = bpy.data.objects.new("weapon", me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = arm
    ob.parent_type = "BONE"
    ob.parent_bone = HAND
    ob.matrix_world = arm.matrix_world  # vertices are in armature space; keep them where they are
    arm.data.pose_position = "POSE"
    return ob


if arm:
    hand_sword(base)

bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", use_selection=False, export_image_format="JPEG",
                          export_jpeg_quality=88, export_apply=arm is None, export_animations=arm is not None,
                          export_animation_mode="NLA_TRACKS", export_force_sampling=False,
                          export_optimize_animation_size=True)
tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
print(f"[hc] {dst}: {tris} triangles, height {height}, texture {tex}px, rigged {arm is not None}", flush=True)
