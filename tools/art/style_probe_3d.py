"""Hollow Crown – 3D style probe for the art direction (concept/23-art-direction, §3–§4).

blender -b --factory-startup --python tools/art/style_probe_3d.py -- <out_dir>

Builds a round-chibi figure kit (one shared body, per-figure head/hair/colours/signature part),
two figures (Kael, a bandit) and a small toy diorama, then renders:
  closeup.png      – both figures, perspective 3/4 view
  diorama_35.png   – board camera, 35° from vertical (D2)
  diorama_50.png   – board camera, 50° from vertical (comparison for the open D2 point)
Look: toon shading (2 light steps, hue-shifted shadows), dark-brown hull outline, soft sun shadows.
Not part of the asset build; it only answers whether the style carries in 3D.
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else "art/mockups/style-3d-2026-10")
os.makedirs(OUT, exist_ok=True)

OUTLINE = "#3A2A22"
FIG_SCALE = 0.42  # figure is built 2.5 units tall (head 1.0), board cell = 1.0


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple((int(h[i:i + 2], 16) / 255.0) ** 2.2 for i in (0, 2, 4))


# ---------------------------------------------------------------- scene

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        pass
scene.view_settings.view_transform = "Standard"
scene.render.film_transparent = False
try:
    scene.eevee.taa_render_samples = 32
except AttributeError:
    pass

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (*hex_rgb("#F3EEE4"), 1)
bg.inputs[1].default_value = 0.35  # fill light; the camera sees the full bone-white below
wn = world.node_tree.nodes
seen = wn.new("ShaderNodeBackground")
seen.inputs[0].default_value = (*hex_rgb("#F3EEE4"), 1)
path = wn.new("ShaderNodeLightPath")
pick = wn.new("ShaderNodeMixShader")
world.node_tree.links.new(path.outputs["Is Camera Ray"], pick.inputs[0])
world.node_tree.links.new(bg.outputs[0], pick.inputs[1])
world.node_tree.links.new(seen.outputs[0], pick.inputs[2])
world.node_tree.links.new(pick.outputs[0], wn["World Output"].inputs[0])

sun_data = bpy.data.lights.new("Sun", "SUN")
sun_data.energy = 2.6
sun_data.angle = math.radians(12)
sun = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(50), math.radians(-30), math.radians(-35))

# ---------------------------------------------------------------- materials

_mats = {}


def toon(name, color, shade=(0.66, 0.64, 0.82), unlit=False, alpha=1.0):
    """Toon material: diffuse -> shader-to-RGB -> 2-step ramp -> mix(shadow, base) -> emission."""
    key = (name, color, unlit, alpha)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    base = hex_rgb(color)
    if unlit:
        emit.inputs["Color"].default_value = (*base, 1)
    else:
        diff = nt.nodes.new("ShaderNodeBsdfDiffuse")
        s2r = nt.nodes.new("ShaderNodeShaderToRGB")
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.interpolation = "CONSTANT"
        ramp.color_ramp.elements[0].position = 0.0
        ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
        ramp.color_ramp.elements[1].position = 0.6
        ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.inputs[6].default_value = (*(c * s for c, s in zip(base, shade)), 1)
        mix.inputs[7].default_value = (*base, 1)
        nt.links.new(diff.outputs[0], s2r.inputs[0])
        nt.links.new(s2r.outputs["Color"], ramp.inputs[0])
        nt.links.new(ramp.outputs["Color"], mix.inputs[0])
        nt.links.new(mix.outputs[2], emit.inputs["Color"])
    if alpha < 1.0:
        tr = nt.nodes.new("ShaderNodeBsdfTransparent")
        mx = nt.nodes.new("ShaderNodeMixShader")
        mx.inputs[0].default_value = alpha
        nt.links.new(tr.outputs[0], mx.inputs[1])
        nt.links.new(emit.outputs[0], mx.inputs[2])
        nt.links.new(mx.outputs[0], out.inputs[0])
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "BLENDED"
    else:
        nt.links.new(emit.outputs[0], out.inputs[0])
    _mats[key] = m
    return m


def outline_mat():
    if "outline" not in _mats:
        m = toon("Outline", OUTLINE, unlit=True)
        m.use_backface_culling = True
        _mats["outline"] = m
    return _mats["outline"]


# ---------------------------------------------------------------- mesh helpers

def _finish(obj, mat, parent, outline):
    obj.data.materials.append(mat)
    if outline:
        obj.data.materials.append(outline_mat())
        sol = obj.modifiers.new("Outline", "SOLIDIFY")
        sol.thickness = outline
        sol.offset = 1.0
        sol.use_flip_normals = True
        sol.use_rim = False
        sol.material_offset = 1
    if parent:
        obj.parent = parent
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def blob(name, loc, scale, color, parent=None, rot=(0, 0, 0), outline=0.035, cut=None, **kw):
    """Ellipsoid; cut(v) -> True deletes that vertex (local, unit sphere coords)."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1.0)
    obj = bpy.context.active_object
    obj.name = name
    if cut:
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if cut(v.co)], context="VERTS")
        bm.to_mesh(obj.data)
        bm.free()
    obj.location, obj.scale, obj.rotation_euler = loc, scale, [math.radians(a) for a in rot]
    return _finish(obj, toon(name, color, **kw), parent, outline)


def box(name, loc, size, color, parent=None, rot=(0, 0, 0), outline=0.0, bevel=0.0, side=None):
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    obj = bpy.context.active_object
    obj.name = name
    obj.location, obj.scale, obj.rotation_euler = loc, size, [math.radians(a) for a in rot]
    _finish(obj, toon(name, color), parent, outline)
    if side:  # non-top faces get the side material
        obj.data.materials.append(toon(name + "_side", side))
        idx = len(obj.data.materials) - 1
        for p in obj.data.polygons:
            if p.normal.z < 0.5:
                p.material_index = idx
        if outline:  # keep outline slot as offset target: move it after side
            pass
    if bevel:
        bv = obj.modifiers.new("Bevel", "BEVEL")
        bv.width = bevel
        bv.segments = 3
        bv.limit_method = "NONE"
        obj.modifiers.move(len(obj.modifiers) - 1, 0)
    for p in obj.data.polygons:
        p.use_smooth = False
    return obj


def cone(name, loc, r1, r2, depth, color, parent=None, rot=(0, 0, 0), verts=32, outline=0.03, cut=None):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth)
    obj = bpy.context.active_object
    obj.name = name
    if cut:
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if cut(v.co)], context="VERTS")
        bm.to_mesh(obj.data)
        bm.free()
    obj.location, obj.rotation_euler = loc, [math.radians(a) for a in rot]
    return _finish(obj, toon(name, color), parent, outline)


def torus(name, loc, major, minor, color, parent=None, scale=(1, 1, 1), outline=0.03, unlit=False):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=40, minor_segments=12)
    obj = bpy.context.active_object
    obj.name = name
    obj.location, obj.scale = loc, scale
    return _finish(obj, toon(name, color, unlit=unlit), parent, outline)


# ---------------------------------------------------------------- figure kit

def build_figure(cfg, loc, facing=0.0):
    """Shared chibi body (2.5 heads) + per-figure head, hair, colours and signature part."""
    root = bpy.data.objects.new(cfg["id"], None)
    scene.collection.objects.link(root)
    c = cfg["colors"]
    n = cfg["id"] + "_"
    # body (shared rumpf)
    blob(n + "legL", (0.15, 0, 0.3), (0.12, 0.12, 0.22), c["pants"], root)
    blob(n + "legR", (-0.15, 0, 0.3), (0.12, 0.12, 0.22), c["pants"], root)
    blob(n + "bootL", (0.15, -0.05, 0.09), (0.15, 0.19, 0.1), c["boots"], root)
    blob(n + "bootR", (-0.15, -0.05, 0.09), (0.15, 0.19, 0.1), c["boots"], root)
    blob(n + "hips", (0, 0, 0.62), (0.36, 0.29, 0.26), c["pants"], root)
    blob(n + "torso", (0, 0, 1.02), (0.4, 0.31, 0.44), c["torso"], root)
    blob(n + "armL", (0.47, -0.02, 1.0), (0.11, 0.11, 0.26), c["sleeve"], root, rot=(0, -12, 0))
    blob(n + "armR", (-0.47, -0.02, 1.0), (0.11, 0.11, 0.26), c["sleeve"], root, rot=(0, 12, 0))
    blob(n + "handL", (0.53, -0.06, 0.72), (0.12, 0.12, 0.12), c["gloves"], root)
    blob(n + "handR", (-0.53, -0.06, 0.72), (0.12, 0.12, 0.12), c["gloves"], root)
    torus(n + "sash", (0, 0, 0.8), 0.36, 0.07, c["sash"], root, scale=(1, 0.82, 1))
    blob(n + "sashTail", (-0.2, -0.27, 0.6), (0.08, 0.04, 0.17), c["sash"], root, rot=(0, 10, 0))
    torus(n + "collar", (0, 0.02, 1.45), 0.22, 0.09, c["collar"], root, scale=(1, 0.9, 1))
    # team cloth: cape behind the body (thickened, open at the front)
    cape = cone(n + "cape", (0, 0.1, 0.92), 0.5, 0.26, 1.05, c["team"], root, cut=lambda v: v.y < -0.12)
    th = cape.modifiers.new("Thick", "SOLIDIFY")
    th.thickness = 0.05
    cape.modifiers.move(len(cape.modifiers) - 1, 0)
    # head
    blob(n + "head", (0, 0, 2.0), (0.5, 0.48, 0.48), c["skin"], root)
    blob(n + "earL", (0.48, 0.02, 1.96), (0.08, 0.06, 0.1), c["skin"], root)
    blob(n + "earR", (-0.48, 0.02, 1.96), (0.08, 0.06, 0.1), c["skin"], root)
    for sx in (1, -1):
        blob(n + f"eye{sx}", (0.17 * sx, -0.43, 1.94), (0.085, 0.05, 0.13), c["eyes"], root, outline=0)
        blob(n + f"hi{sx}", (0.17 * sx - 0.03, -0.475, 1.99), (0.03, 0.02, 0.035), "#FFFFFF", root,
             outline=0, unlit=True)
        blob(n + f"brow{sx}", (0.18 * sx, -0.43, 2.11), (0.1, 0.03, 0.025), c["brows"], root,
             rot=(0, -8 * sx, 0), outline=0)
    blob(n + "mouth", (0, -0.46, 1.77), (0.07, 0.02, 0.018), "#7A3B2E", root, outline=0)
    blob(n + "cheekL", (0.28, -0.39, 1.83), (0.07, 0.03, 0.04), "#F2A08C", root, outline=0)
    blob(n + "cheekR", (-0.28, -0.39, 1.83), (0.07, 0.03, 0.04), "#F2A08C", root, outline=0)
    for part in cfg["parts"]:
        part(n, root, c)
    root.location = loc
    root.scale = (FIG_SCALE,) * 3
    root.rotation_euler = (0, 0, math.radians(facing))
    # ground ring in team colour (unlit, not scaled with the figure)
    ring = torus(cfg["id"] + "_ring", (loc[0], loc[1], loc[2] + 0.015), 0.36, 0.025, c["team"],
                 scale=(1, 1, 0.3), outline=0, unlit=True)
    return root, ring


def hair_cap(n, root, color, front_cut=2.24):
    """Cap over the skull, open at the face below front_cut (local z of the head sphere)."""
    def cut(v):
        z = 2.08 + v.z * 0.5
        return (v.y < -0.25 and z < front_cut) or z < 1.78
    blob(n + "hair", (0, 0.03, 2.08), (0.535, 0.52, 0.5), color, root, cut=cut)


def kael_parts(n, root, c):
    hair_cap(n, root, c["hair"])
    for x, rz in ((-0.24, 20), (-0.04, -5), (0.2, -25)):  # bangs
        blob(n + f"bang{x}", (x, -0.4, 2.27), (0.15, 0.08, 0.17), c["hair"], root, rot=(15, 0, rz))
    blob(n + "tail", (0, 0.47, 1.92), (0.12, 0.11, 0.26), c["hair"], root, rot=(-20, 0, 0))
    box(n + "scar", (0.19, -0.475, 2.09), (0.018, 0.01, 0.13), "#B4574A", root, rot=(0, -25, 0))
    # signature: big pauldron on the left shoulder
    blob(n + "pauldron", (0.4, 0, 1.3), (0.26, 0.28, 0.2), c["steel"], root, rot=(0, -25, 0), cut=lambda v: v.z < -0.3)
    # sword in the right hand
    box(n + "blade", (-0.6, -0.32, 0.98), (0.07, 0.025, 0.85), "#D9DEE5", root, rot=(-28, 0, 0), outline=0.03)
    box(n + "guard", (-0.56, -0.13, 0.62), (0.24, 0.05, 0.05), "#D9A931", root, rot=(-28, 0, 0), outline=0.03)
    box(n + "grip", (-0.53, -0.04, 0.46), (0.05, 0.05, 0.22), "#6B4630", root, rot=(-28, 0, 0), outline=0.03)


def bandit_parts(n, root, c):
    hair_cap(n, root, c["hair"], front_cut=2.12)
    blob(n + "kerchief", (0, 0.02, 2.22), (0.54, 0.53, 0.33), c["kerchief"], root,
         cut=lambda v: v.z < -0.1)
    blob(n + "knot", (0.12, 0.5, 2.12), (0.1, 0.08, 0.16), c["kerchief"], root, rot=(30, 0, 20))
    blob(n + "beard", (0, -0.34, 1.7), (0.32, 0.16, 0.2), c["hair"], root)
    blob(n + "furL", (0.36, 0, 1.33), (0.22, 0.24, 0.13), "#C8A57A", root)
    blob(n + "furR", (-0.36, 0, 1.33), (0.22, 0.24, 0.13), "#C8A57A", root)
    # axe in the right hand
    box(n + "haft", (-0.56, -0.18, 0.9), (0.055, 0.055, 0.95), "#8A5A3C", root, rot=(-20, 0, 0), outline=0.03)
    blob(n + "axehead", (-0.6, -0.33, 1.3), (0.24, 0.04, 0.2), "#C9CED6", root, rot=(-20, 0, 0),
         cut=lambda v: v.x > 0.05)


KAEL = {
    "id": "kael",
    "colors": {"skin": "#F3C9A5", "eyes": "#5A3A1A", "brows": "#3E271C", "hair": "#4A2F22",
               "torso": "#B9BEC6", "steel": "#C3C8CF", "sleeve": "#3F3D44", "gloves": "#6B4630",
               "pants": "#3B3A40", "boots": "#5A3B28", "sash": "#E8743B", "collar": "#6E6C70",
               "team": "#2F64C8"},
    "parts": [kael_parts],
}
BANDIT = {
    "id": "bandit",
    "colors": {"skin": "#E0A880", "eyes": "#2E2420", "brows": "#2E2420", "hair": "#2E2420",
               "torso": "#7A5236", "steel": "#C3C8CF", "sleeve": "#E3D3B5", "gloves": "#5A3B28",
               "pants": "#6F6B3A", "boots": "#4A3222", "sash": "#8E3B2E", "collar": "#6B4B34",
               "team": "#B83A2E", "kerchief": "#8E3B2E"},
    "parts": [bandit_parts],
}

# ---------------------------------------------------------------- diorama

GRASS, GRASS_LIGHT, EARTH, STONE = "#7DB34C", "#93C45A", "#9A6B45", "#9C9A93"
W, D = 7, 7
RIVER_X = 4
HILL = {(0, 5), (1, 5), (0, 6), (1, 6), (2, 6)}


def cell_top(x, y):
    if x == RIVER_X:
        return -0.3
    return 0.35 if (x, y) in HILL else 0.0


def build_diorama(ox, oy):
    for x in range(W):
        for y in range(D):
            top = cell_top(x, y)
            h = top + 0.9
            col = GRASS if (x + y) % 2 else GRASS_LIGHT
            side = STONE if x == RIVER_X or (x, y) in HILL else EARTH
            if x == RIVER_X:
                col = "#8C8A80"
            box(f"cell_{x}_{y}", (ox + x, oy + y, top - h / 2), (0.98, 0.98, h), col,
                bevel=0.07, side=side)
    # water
    box("water", (ox + RIVER_X, oy + (D - 1) / 2, -0.17), (0.98, D, 0.06), "#3FB4D6")
    for y in range(D):
        box(f"foam_{y}", (ox + RIVER_X - 0.47, oy + y, -0.13), (0.06, 0.9, 0.02), "#E8F7FB")
        box(f"foamR_{y}", (ox + RIVER_X + 0.47, oy + y, -0.13), (0.06, 0.9, 0.02), "#E8F7FB")
    # bridge
    for i in range(5):
        box(f"plank_{i}", (ox + RIVER_X, oy + 2 - 0.36 + i * 0.18, 0.03), (1.5, 0.16, 0.06), "#A06B3E",
            outline=0.012, bevel=0.02)
    for sy in (1.55, 2.45):
        box(f"rail_{sy}", (ox + RIVER_X, oy + sy, 0.2), (1.5, 0.05, 0.05), "#7A4E2C", outline=0.012)
    # trees: trunk + round crown blobs
    for i, (tx, ty) in enumerate(((0, 0), (6, 6), (5, 5), (0, 2), (6, 0))):
        top = cell_top(tx, ty)
        box(f"trunk_{i}", (ox + tx, oy + ty, top + 0.2), (0.14, 0.14, 0.4), "#7A4E2C", outline=0.012)
        for j, (dx, dy, dz, r) in enumerate(((0, 0, 0.62, 0.36), (0.16, -0.1, 0.9, 0.26), (-0.15, 0.05, 0.85, 0.24))):
            blob(f"crown_{i}_{j}", (ox + tx + dx, oy + ty + dy, top + dz), (r, r, r * 0.92), "#4E9A3F",
                 outline=0.014)
    # cottage on the hill
    hx, hy, ht = ox + 1, oy + 5, cell_top(1, 5)
    box("house", (hx, hy, ht + 0.32), (0.8, 0.7, 0.64), "#F1E2C6", outline=0.014, bevel=0.03)
    box("door", (hx, hy - 0.355, ht + 0.2), (0.2, 0.02, 0.36), "#7A4E2C")
    for wx in (-0.25, 0.25):
        box(f"win_{wx}", (hx + wx, hy - 0.355, ht + 0.42), (0.16, 0.02, 0.16), "#FFC86A")
    cone("roof", (hx, hy, ht + 0.86), 0.68, 0.0, 0.5, "#B5523B", rot=(0, 0, 45), verts=4, outline=0.014)
    # movement highlight (unlit, translucent)
    for (mx, my) in ((1, 1), (2, 1), (1, 2), (2, 2), (3, 2), (2, 3), (1, 3), (0, 1)):
        box(f"move_{mx}_{my}", (ox + mx, oy + my, 0.012), (0.94, 0.94, 0.01), "#5C8EE6")
        m = toon("move", "#5C8EE6", unlit=True, alpha=0.5)
        bpy.context.active_object.data.materials[0] = m


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def render(path, cam, res):
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("[hc] wrote", path, flush=True)


# close-up set (away from the diorama)
build_figure(KAEL, (-20.4, 0, 0))
build_figure(BANDIT, (-19.5, 0.3, 0), facing=-15)
box("floor", (-20, 0, -0.05), (6, 6, 0.1), "#E9E3D6")

# board
build_diorama(0, 0)
build_figure(KAEL, (2, 2, 0))
build_figure(BANDIT, (5, 3, 0))
k2 = dict(KAEL, id="ally", colors=dict(KAEL["colors"], hair="#B5652F", torso="#8A5A3C", steel="#8A5A3C"))
build_figure(k2, (1, 3, 0))

cam_data = bpy.data.cameras.new("Close")
cam_data.lens = 70
close = bpy.data.objects.new("Close", cam_data)
scene.collection.objects.link(close)
close.location = (-22.2, -4.6, 1.6)
look_at(close, (-19.95, 0.1, 0.62))
render(os.path.join(OUT, "closeup.png"), close, (1200, 1000))

centre = Vector((3, 3, 0))
for tilt in (35, 50):
    cd = bpy.data.cameras.new(f"Board{tilt}")
    cd.type = "ORTHO"
    cd.ortho_scale = 9.0
    cam = bpy.data.objects.new(f"Board{tilt}", cd)
    scene.collection.objects.link(cam)
    t = math.radians(tilt)
    cam.location = centre + Vector((0, -math.sin(t), math.cos(t))) * 30
    cam.rotation_euler = (t, 0, 0)
    render(os.path.join(OUT, f"diorama_{tilt}.png"), cam, (1080, 1200))
