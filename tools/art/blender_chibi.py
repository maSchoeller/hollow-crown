"""Hollow Crown – sprite pipeline (48 px grid), part 1: scene, role materials, mesh helpers, chibi rig.

Runs inside Blender 5.x (e.g. via MCP: exec(open(PATH).read(), ns)). Builds/uses the scene "HC_Sprites".

Concept (see concept/16-asset-pipeline.md §4 and art/README.md):
- Every material is a *role* (skin, hair_brown, steel, team, ...). Blender renders only data passes:
  1. ID pass   – flat emission, R = (id % 128) * 2, B = (id // 128) * 64 (Raw view, no dither, 1 sample);
     ids = position in ramps.ROLES
  2. normal    – camera-space normals as colour (n * 0.5 + 0.5)
  3. depth     – view-Z depth / DEPTH_RANGE (16-bit PNG)
  All shading (toon levels, hue-shifted ramps, outlines, team key colours) happens in pixelize.py,
  so the palette is exact and per-role.
- Figure faces -Y (south, towards the camera), feet at z = 0. Figure-left = +X (screen right).
- Camera: orthographic, 30° elevation, 18.6 px per Blender unit (= 1.5 × the 32 px proof),
  cell 72 × 72 px, feet at cell y = 63 (anchor [36, 63]).
"""
import json
import math

import bmesh
import bpy
from mathutils import Matrix, Vector

SCENE = "HC_Sprites"
PX_PER_UNIT = 18.6
CAM_PITCH_DEG = 30.0
CELL = 72
ANCHOR = (36, 63)
DEPTH_NEAR = 15.0  # depth pass: v = (viewZ - DEPTH_NEAR) / DEPTH_RANGE, R = v, G = fract(v * 256)
DEPTH_RANGE = 20.0
CAM_DIST = 25.0

# ---------------------------------------------------------------------------------------------
# Scene
# ---------------------------------------------------------------------------------------------


def get_scene():
    sc = bpy.data.scenes.get(SCENE) or bpy.data.scenes.new(SCENE)
    if bpy.context.window is not None:
        bpy.context.window.scene = sc
    return sc


def setup_render(sc):
    r = sc.render
    r.engine = "BLENDER_EEVEE"
    r.film_transparent = True
    r.filter_size = 0.0
    r.dither_intensity = 0.0
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA"
    r.image_settings.color_depth = "8"
    r.use_compositing = False
    r.use_sequencer = False
    try:
        sc.eevee.taa_render_samples = 1
    except AttributeError:
        pass
    sc.view_settings.view_transform = "Raw"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0.0
    sc.view_settings.gamma = 1.0
    w = sc.world or bpy.data.worlds.new("HC_world")
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[1].default_value = 0.0


def setup_camera(sc, cell=CELL, anchor=ANCHOR, pitch_deg=CAM_PITCH_DEG):
    """Camera so that world origin lands on `anchor` inside a `cell`×`cell` frame."""
    cam = bpy.data.objects.get("HC_cam")
    if cam is None:
        cam = bpy.data.objects.new("HC_cam", bpy.data.cameras.new("HC_cam"))
        sc.collection.objects.link(cam)
    elif cam.name not in sc.collection.objects:
        sc.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = cell / PX_PER_UNIT
    cam.data.clip_start = 0.1
    cam.data.clip_end = 200.0
    pitch = math.radians(pitch_deg)
    # pixel offsets of the anchor from the frame centre (y down in image space)
    off_x = (anchor[0] - cell / 2) / PX_PER_UNIT
    off_y = (anchor[1] - cell / 2) / PX_PER_UNIT
    # camera right = +X, camera up = (0, sin p, cos p) projected → world point at frame centre:
    centre = Vector((-off_x, 0.0, 0.0)) + Vector((0.0, math.sin(pitch), math.cos(pitch))) * off_y
    fwd = Vector((0.0, math.cos(pitch), -math.sin(pitch)))
    cam.location = centre - fwd * CAM_DIST
    cam.rotation_euler = (math.radians(90 - pitch_deg), 0.0, 0.0)
    sc.camera = cam
    sc.render.resolution_x = sc.render.resolution_y = cell * SUPERSAMPLE
    return cam


SUPERSAMPLE = 4

# ---------------------------------------------------------------------------------------------
# Role materials
# ---------------------------------------------------------------------------------------------


def _ramp_roles():
    """Role ids are the 1-based position in ramps.ROLES (deterministic across Blender processes)."""
    import importlib.util
    import os
    here = globals().get("HC_TOOLS") or os.path.dirname(os.path.abspath(__file__))
    spec = importlib.util.spec_from_file_location("hc_ramps", os.path.join(here, "ramps.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return {name: i + 1 for i, name in enumerate(mod.ROLES)}


_ROLE_IDS = {}


def role_table():
    if not _ROLE_IDS:
        _ROLE_IDS.update(_ramp_roles())
    return dict(_ROLE_IDS)


def role_mat(role):
    name = f"R_{role}"
    mat = bpy.data.materials.get(name)
    tab = role_table()
    if role not in tab:
        raise KeyError(f"role '{role}' is not defined in ramps.py")
    rid = tab[role]
    if mat and mat.get("hc_id") == rid:
        return mat
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    emit = nt.nodes.new("ShaderNodeEmission")
    # id encoding: R = (id % 128) * 2, B = (id // 128) * 64
    emit.inputs[0].default_value = ((rid % 128) * 2 / 255.0, 128 / 255.0, (rid // 128) * 64 / 255.0, 1.0)
    emit.inputs[1].default_value = 1.0
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(emit.outputs[0], out.inputs[0])
    mat["hc_role"] = role
    mat["hc_id"] = rid
    return mat


def normal_material():
    mat = bpy.data.materials.get("HC_normal") or bpy.data.materials.new("HC_normal")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    vt = nt.nodes.new("ShaderNodeVectorTransform")
    vt.vector_type = "NORMAL"
    vt.convert_from = "WORLD"
    vt.convert_to = "CAMERA"
    mad = nt.nodes.new("ShaderNodeVectorMath")
    mad.operation = "MULTIPLY_ADD"
    mad.inputs[1].default_value = (0.5, 0.5, -0.5)  # camera space looks along +Z → flip so "facing" = +Z
    mad.inputs[2].default_value = (0.5, 0.5, 0.5)
    emit = nt.nodes.new("ShaderNodeEmission")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(geo.outputs["Normal"], vt.inputs[0])
    nt.links.new(vt.outputs[0], mad.inputs[0])
    nt.links.new(mad.outputs[0], emit.inputs[0])
    nt.links.new(emit.outputs[0], out.inputs[0])
    return mat


def depth_material():
    """View-Z depth split into coarse (R) and fine (G) 8-bit channels."""
    mat = bpy.data.materials.get("HC_depth") or bpy.data.materials.new("HC_depth")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    cd = nt.nodes.new("ShaderNodeCameraData")
    sub = nt.nodes.new("ShaderNodeMath")
    sub.operation = "SUBTRACT"
    sub.inputs[1].default_value = DEPTH_NEAR
    div = nt.nodes.new("ShaderNodeMath")
    div.operation = "DIVIDE"
    div.inputs[1].default_value = DEPTH_RANGE
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = 255.0
    fr = nt.nodes.new("ShaderNodeMath")
    fr.operation = "FRACT"
    flo = nt.nodes.new("ShaderNodeMath")
    flo.operation = "FLOOR"
    coarse = nt.nodes.new("ShaderNodeMath")
    coarse.operation = "DIVIDE"
    coarse.inputs[1].default_value = 255.0
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    emit = nt.nodes.new("ShaderNodeEmission")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    L = nt.links.new
    L(cd.outputs["View Z Depth"], sub.inputs[0])
    L(sub.outputs[0], div.inputs[0])
    L(div.outputs[0], mul.inputs[0])
    L(mul.outputs[0], flo.inputs[0])
    L(mul.outputs[0], fr.inputs[0])
    L(flo.outputs[0], coarse.inputs[0])
    L(coarse.outputs[0], comb.inputs[0])
    L(fr.outputs[0], comb.inputs[1])
    L(comb.outputs[0], emit.inputs[0])
    L(emit.outputs[0], out.inputs[0])
    return mat


# ---------------------------------------------------------------------------------------------
# Mesh helpers (bmesh, no operators → fast and context free)
# ---------------------------------------------------------------------------------------------


def new_collection(sc, name):
    old = bpy.data.collections.get(name)
    if old:
        for ob in list(old.all_objects):
            bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(old)
    col = bpy.data.collections.new(name)
    sc.collection.children.link(col)
    return col


def _mesh_object(col, name, bm, role, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    me.materials.append(role_mat(role))
    return ob


def set_parent(ob, parent, loc, rot=(0, 0, 0), scale=(1, 1, 1)):
    """`loc` is given in world space of the rest pose; children keep their world transform."""
    ob.location = loc
    ob.rotation_euler = [math.radians(a) for a in rot]
    ob.scale = scale
    if parent is not None:
        ob.parent = parent
        bpy.context.view_layer.update()
        ob.matrix_parent_inverse = parent.matrix_world.inverted()
    return ob


_COUNTER = [0]


def _name(base):
    _COUNTER[0] += 1
    return f"{base}.{_COUNTER[0]:04d}"


def shape(col, kind, role, loc, size=(1, 1, 1), rot=(0, 0, 0), parent=None, name=None, seg=16, smooth=None, **kw):
    """kind: sphere | box | cyl | cone | torus | hemi.  `size` = half extents (radius style)."""
    bm = bmesh.new()
    if kind == "sphere":
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(6, seg // 2), radius=1.0)
        amp = kw.get("lumpy", 0.0)
        if amp:
            from mathutils import noise
            off = Vector((kw.get("seed", 0) * 3.1, 1.7, 0.4))
            for v in bm.verts:
                v.co *= 1.0 + amp * noise.noise(v.co * 2.2 + off)
    elif kind == "hemi":
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(6, seg // 2), radius=1.0)
        cut = [v for v in bm.verts if v.co.z < -1e-4]
        bmesh.ops.delete(bm, geom=cut, context="VERTS")
        edges = [e for e in bm.edges if e.is_boundary]
        bmesh.ops.edgeloop_fill(bm, edges=edges)
    elif kind == "box":
        bmesh.ops.create_cube(bm, size=2.0)
        bev = kw.get("bevel", 0.0)
        if bev:
            bmesh.ops.bevel(bm, geom=list(bm.edges) + list(bm.verts), offset=bev, segments=2, affect="EDGES")
    elif kind == "cyl":
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=1.0, radius2=kw.get("top", 1.0), depth=2.0)
    elif kind == "cone":
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=1.0, radius2=kw.get("top", 0.0), depth=2.0)
    elif kind == "torus":
        _torus(bm, kw.get("minor", 0.25), seg, kw.get("arc", 360.0))
    else:
        raise ValueError(kind)
    if smooth is None:
        smooth = kind not in ("box",)
    ob = _mesh_object(col, name or _name(role), bm, role, smooth)
    return set_parent(ob, parent, loc, rot, size)


def _torus(bm, minor, seg, arc):
    rings = []
    n_major = seg if arc >= 360 else max(4, int(seg * arc / 360) + 1)
    n_minor = 8
    for i in range(n_major):
        a = math.radians(arc) * i / (n_major if arc >= 360 else n_major - 1)
        ring = []
        for j in range(n_minor):
            b = 2 * math.pi * j / n_minor
            r = 1.0 + minor * math.cos(b)
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), minor * math.sin(b))))
        rings.append(ring)
    count = n_major if arc >= 360 else n_major - 1
    for i in range(count):
        r0, r1 = rings[i], rings[(i + 1) % n_major]
        for j in range(n_minor):
            bm.faces.new((r0[j], r0[(j + 1) % n_minor], r1[(j + 1) % n_minor], r1[j]))


def poly_mesh(col, role, verts, faces, loc=(0, 0, 0), parent=None, smooth=False, solidify=0.0, name=None):
    """Arbitrary mesh from verts/faces (local coordinates relative to loc)."""
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in verts]
    for f in faces:
        bm.faces.new([vs[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = _mesh_object(col, name or _name(role), bm, role, smooth)
    if solidify:
        m = ob.modifiers.new("solid", "SOLIDIFY")
        m.thickness = solidify
        m.offset = 0
    return set_parent(ob, parent, loc)


def sheet_mesh(col, role, rows, loc=(0, 0, 0), parent=None, smooth=True, solidify=0.03, name=None):
    """Grid surface from a list of rows of points (each row same length) – capes, cloaks, hair curtains."""
    verts, faces = [], []
    w = len(rows[0])
    for r in rows:
        verts.extend(r)
    for i in range(len(rows) - 1):
        for j in range(w - 1):
            a = i * w + j
            faces.append((a, a + 1, a + w + 1, a + w))
    return poly_mesh(col, role, verts, faces, loc, parent, smooth, solidify, name)


def cape_rows(top_z, bottom_z, width_top, width_bottom, back_y, bulge, hem=None, n=9, levels=6,
              wrap=1.0, flare=0.12):
    """Rows of points for a cape hanging behind the figure (local coords, origin at feet).

    hem: list of n z-offsets (positive = shorter) for a tattered / shaped hem.
    wrap: how far the cape curls around the sides (0 = flat, 1 = half cylinder).
    """
    rows = []
    for li in range(levels):
        t = li / (levels - 1)
        z = top_z + (bottom_z - top_z) * t
        w = width_top + (width_bottom - width_top) * t
        row = []
        for j in range(n):
            u = j / (n - 1) * 2 - 1  # -1..1
            ang = u * math.pi / 2 * wrap
            x = math.sin(ang) * w
            y = back_y + (1 - math.cos(ang)) * -w * 0.55 + bulge * (1 - u * u) + flare * t
            zz = z
            if hem is not None and li == levels - 1:
                zz = z + hem[j]
            row.append((x, y, zz))
        rows.append(row)
    return rows


def empty(col, name, loc, parent=None):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_size = 0.1
    col.objects.link(ob)
    set_parent(ob, parent, loc)
    ob["rest"] = list(loc)
    return ob


def tag(ob, name, flicker=False):
    """Tagged objects are hidden unless a pose lists the tag in "show"; fx scales them."""
    ob["hc_tag"] = name
    ob["rest_scale"] = list(ob.scale)
    if flicker:
        ob["hc_flicker"] = 1
    return ob


def flicker(ob):
    ob["rest_scale"] = list(ob.scale)
    ob["hc_flicker"] = 1
    return ob


# ---------------------------------------------------------------------------------------------
# Chibi rig (empties) – shared by all humanoid units
# ---------------------------------------------------------------------------------------------

BODY_DEFAULT = {
    "hip": 0.60,        # hip height
    "torso": 0.60,      # hip → shoulder line
    "sh": 0.35,         # shoulder half width (arm pivot x)
    "head_r": 0.42,     # head radius (≈ 15.6 px diameter)
    "leg_x": 0.13,
    "arm_len": 0.44,
    "scale": 1.0,
}


def build_rig(col, uid, body=None):
    b = dict(BODY_DEFAULT)
    b.update(body or {})
    hip, top = b["hip"], b["hip"] + b["torso"]
    R = {"body": b}
    R["root"] = empty(col, f"{uid}_root", (0, 0, 0))
    R["hips"] = empty(col, f"{uid}_hips", (0, 0, hip), R["root"])
    R["leg_L"] = empty(col, f"{uid}_leg_L", (b["leg_x"], 0, hip), R["hips"])
    R["leg_R"] = empty(col, f"{uid}_leg_R", (-b["leg_x"], 0, hip), R["hips"])
    R["torso"] = empty(col, f"{uid}_torso", (0, 0, hip), R["hips"])
    R["chest"] = empty(col, f"{uid}_chest", (0, 0, top - 0.25), R["torso"])
    R["head"] = empty(col, f"{uid}_head", (0, 0, top - 0.04), R["chest"])
    R["tail"] = empty(col, f"{uid}_tail", (0, 0.3, top + 0.35), R["head"])
    R["arm_L"] = empty(col, f"{uid}_arm_L", (b["sh"], 0, top - 0.06), R["chest"])
    R["arm_R"] = empty(col, f"{uid}_arm_R", (-b["sh"], 0, top - 0.06), R["chest"])
    hz = top - 0.06 - b["arm_len"]
    R["hand_L"] = (b["sh"] + 0.03, -0.02, hz)
    R["hand_R"] = (-b["sh"] - 0.03, -0.02, hz)
    R["wrist_L"] = empty(col, f"{uid}_wrist_L", R["hand_L"], R["arm_L"])
    R["wrist_R"] = empty(col, f"{uid}_wrist_R", R["hand_R"], R["arm_R"])
    R["cape"] = empty(col, f"{uid}_cape", (0, 0.2, top - 0.04), R["chest"])
    R["fx"] = empty(col, f"{uid}_fx", (0, 0, 0), R["root"])
    R["top"] = top
    return R


def finish_unit(col, uid, R, weapon, extra=None):
    """Store rig metadata on the root so the render script can pose it."""
    meta = {"weapon": weapon, "top": R["top"], "body": R["body"]}
    meta.update(extra or {})
    R["root"]["hc_meta"] = json.dumps(meta)
    if R["body"].get("scale", 1.0) != 1.0:
        s = R["body"]["scale"]
        R["root"].scale = (s, s, s)
    return R
