"""Hollow Crown – Pixel-Pipeline-Beweis (A0), Teil 1: Szene, Toon-Material, Chibi-Figuren, Requisiten.

Läuft in Blender 5.x (z. B. per MCP: exec(open(PATH).read())). Baut eine eigene Szene
"HC_Sprites" auf und lässt andere Szenen unangetastet.

Konventionen (siehe concept/16-asset-pipeline.md §4):
- Figur schaut nach -Y (Süden, zur Kamera), Füße auf z = 0.
- Materialrollen statt Farben; die Rolle "team" ist Magenta und wird später per Palettentausch ersetzt.
- Kamera orthografisch, 30° Neigung, 12.4 px pro Blender-Einheit.
"""
import math
import bpy

SCENE = "HC_Sprites"
PX_PER_UNIT = 12.4
CAM_PITCH_DEG = 30.0
FEET_OFFSET_PX = 12.0  # Füße liegen 12 px unter der Bildmitte (32er-Frame: Zeile 28)

# Materialrollen → Grundfarbe (sRGB hex). Werte nahe an Hollow-64, die Quantisierung erledigt den Rest.
ROLE_COLORS = {
    "skin": "d89a74",
    "hair_kael": "4f3426",
    "hair_bandit": "2d1e1a",
    "eye": "2d1e1a",
    "steel": "8995a8",
    "blade": "e8eef5",
    "steel_dark": "4f5b70",
    "ash": "6e6a78",
    "leather": "6a4130",
    "leather_light": "9a6a45",
    "gold": "c9a24a",
    "cloth_bandit": "a8916a",
    "wood": "6a4130",
    "roof": "9a3a24",
    "plaster": "e8e2d6",
    "stone": "a39fa6",
    "leaf": "4f8a3a",
    "leaf_dark": "2f5e33",
    "team": "ff00ff",
}


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(h):
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


def get_scene():
    sc = bpy.data.scenes.get(SCENE) or bpy.data.scenes.new(SCENE)
    bpy.context.window.scene = sc
    return sc


def clear_scene(sc):
    for ob in list(sc.collection.all_objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for col in list(sc.collection.children):
        bpy.data.collections.remove(col)


def toon_material(role):
    name = f"HC_{role}"
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    diff = nt.nodes.new("ShaderNodeBsdfDiffuse")
    s2rgb = nt.nodes.new("ShaderNodeShaderToRGB")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    mix = nt.nodes.new("ShaderNodeMix")
    emit = nt.nodes.new("ShaderNodeEmission")
    # 3 Stufen: Schatten / Mitte / Licht
    cr = ramp.color_ramp
    cr.interpolation = "CONSTANT"
    cr.elements[0].position = 0.0
    cr.elements[0].color = (0.50, 0.50, 0.50, 1)
    cr.elements[1].position = 0.12
    cr.elements[1].color = (0.78, 0.78, 0.78, 1)
    e = cr.elements.new(0.45)
    e.color = (1.0, 1.0, 1.0, 1)
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs[0].default_value = 1.0
    mix.inputs[6].default_value = hex_rgba(ROLE_COLORS[role])
    nt.links.new(diff.outputs[0], s2rgb.inputs[0])
    nt.links.new(s2rgb.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], mix.inputs[7])
    nt.links.new(mix.outputs[2], emit.inputs[0])
    nt.links.new(emit.outputs[0], out.inputs[0])
    return mat


def normal_material():
    """Override-Material: Kameraraum-Normalen als Farbe (OpenGL-Konvention)."""
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
    mad.inputs[1].default_value = (0.5, 0.5, -0.5)  # Blender-Kamera schaut nach -Z → Z umdrehen
    mad.inputs[2].default_value = (0.5, 0.5, 0.5)
    emit = nt.nodes.new("ShaderNodeEmission")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(geo.outputs["Normal"], vt.inputs[0])
    nt.links.new(vt.outputs[0], mad.inputs[0])
    nt.links.new(mad.outputs[0], emit.inputs[0])
    nt.links.new(emit.outputs[0], out.inputs[0])
    return mat


def collection(sc, name):
    col = bpy.data.collections.new(name)
    sc.collection.children.link(col)
    return col


def prim(col, kind, role, loc, scale=(1, 1, 1), rot=(0, 0, 0), parent=None, name=None, **kw):
    fn = {
        "sphere": bpy.ops.mesh.primitive_uv_sphere_add,
        "cube": bpy.ops.mesh.primitive_cube_add,
        "cyl": bpy.ops.mesh.primitive_cylinder_add,
        "cone": bpy.ops.mesh.primitive_cone_add,
    }[kind]
    if kind == "sphere":
        kw.setdefault("segments", 20)
        kw.setdefault("ring_count", 10)
    if kind in ("cyl", "cone"):
        kw.setdefault("vertices", 16)
    fn(location=(0, 0, 0), **kw)
    ob = bpy.context.active_object
    for c in ob.users_collection:
        c.objects.unlink(ob)
    col.objects.link(ob)
    ob.scale = scale
    ob.rotation_euler = [math.radians(a) for a in rot]
    ob.data.materials.append(toon_material(role))
    if kind in ("sphere", "cyl", "cone"):
        for p in ob.data.polygons:
            p.use_smooth = True
    if name:
        ob.name = name
    set_parent(ob, parent, loc)
    return ob


def empty(col, name, loc, parent=None):
    ob = bpy.data.objects.new(name, None)
    col.objects.link(ob)
    set_parent(ob, parent, loc)
    return ob


def set_parent(ob, parent, loc):
    """loc ist immer in Weltkoordinaten der Ruhepose angegeben."""
    if parent:
        ob.parent = parent
        bpy.context.view_layer.update()
        ob.matrix_parent_inverse = parent.matrix_world.inverted()
    ob.location = loc


def build_humanoid(sc, name, variant):
    """Chibi ~2,5 Köpfe. variant: 'kael' oder 'bandit'."""
    col = collection(sc, name)
    root = empty(col, f"{name}_root", (0, 0, 0))
    hips = empty(col, f"{name}_hips", (0, 0, 0.42), root)
    # Beine mit Drehpunkt an der Hüfte
    leg_l = empty(col, f"{name}_leg_L", (0.12, 0, 0.42), hips)
    leg_r = empty(col, f"{name}_leg_R", (-0.12, 0, 0.42), hips)
    for leg, x in ((leg_l, 0.12), (leg_r, -0.12)):
        prim(col, "cyl", "leather", (x, 0, 0.24), (0.11, 0.11, 0.18), parent=leg, depth=2, radius=1)
        prim(col, "cube", "leather" if variant == "kael" else "leather_light", (x, -0.04, 0.07), (0.12, 0.17, 0.07), parent=leg)
    torso = empty(col, f"{name}_torso", (0, 0, 0.42), hips)
    body_role = "steel" if variant == "kael" else "cloth_bandit"
    prim(col, "cyl", body_role, (0, 0, 0.66), (0.29, 0.24, 0.26), parent=torso, depth=2, radius=1)
    prim(col, "cyl", "leather", (0, 0, 0.44), (0.30, 0.25, 0.05), parent=torso, depth=2, radius=1)  # Gürtel
    # Teamtuch: Kael Schärpe quer über die Brust, Bandit Halstuch
    if variant == "kael":
        prim(col, "cube", "team", (0, -0.2, 0.66), (0.32, 0.06, 0.06), rot=(0, 35, 0), parent=torso)
        # Umhang hinten
        prim(col, "cone", "ash", (0, 0.2, 0.55), (0.40, 0.16, 0.46), parent=torso, depth=2, radius1=1, radius2=0.7)
        # großes Schulterstück links (Figur-links = +X)
        prim(col, "sphere", "steel", (0.31, 0, 0.86), (0.2, 0.2, 0.15), parent=torso)
    else:
        prim(col, "cyl", "team", (0, 0, 0.9), (0.24, 0.21, 0.06), parent=torso, depth=2, radius=1)
    # Arme mit Drehpunkt an der Schulter
    arm_l = empty(col, f"{name}_arm_L", (0.34, 0, 0.84), torso)
    arm_r = empty(col, f"{name}_arm_R", (-0.34, 0, 0.84), torso)
    arm_role = "steel_dark" if variant == "kael" else "skin"
    for arm, x in ((arm_l, 0.36), (arm_r, -0.36)):
        prim(col, "cyl", arm_role, (x, 0, 0.66), (0.08, 0.08, 0.18), parent=arm, depth=2, radius=1)
        prim(col, "sphere", "leather", (x, 0, 0.47), (0.09, 0.09, 0.09), parent=arm)
    # Waffe in der rechten Hand (Figur-rechts = -X), Spitze nach oben
    hand = (-0.36, -0.04, 0.47)
    wrist = empty(col, f"{name}_wrist", hand, arm_r)  # eigener Drehpunkt für die Waffe
    if variant == "kael":
        # Chibi-Waffen sind übergroß, damit die Waffenart auf 32 px lesbar bleibt
        prim(col, "cube", "blade", (hand[0], hand[1] - 0.04, hand[2] + 0.62), (0.075, 0.03, 0.5), parent=wrist)
        prim(col, "cube", "gold", (hand[0], hand[1] - 0.04, hand[2] + 0.11), (0.18, 0.05, 0.04), parent=wrist)
        prim(col, "cube", "leather", (hand[0], hand[1] - 0.02, hand[2] - 0.02), (0.025, 0.025, 0.08), parent=wrist)
    else:  # Axt
        prim(col, "cube", "wood", (hand[0], hand[1] - 0.04, hand[2] + 0.34), (0.04, 0.04, 0.44), parent=wrist)
        prim(col, "cube", "steel", (hand[0] - 0.16, hand[1] - 0.04, hand[2] + 0.68), (0.2, 0.04, 0.16), parent=wrist)
    # Kopf
    head = empty(col, f"{name}_head", (0, 0, 0.96), torso)
    prim(col, "sphere", "skin", (0, 0, 1.36), (0.42, 0.40, 0.40), parent=head)
    if variant == "kael":
        prim(col, "sphere", "hair_kael", (0, 0.07, 1.47), (0.44, 0.40, 0.36), parent=head)
        prim(col, "sphere", "hair_kael", (0, 0.42, 1.30), (0.12, 0.12, 0.16), parent=head)  # Zopf
    else:
        prim(col, "sphere", "hair_bandit", (0, 0.06, 1.44), (0.44, 0.41, 0.36), parent=head)
        prim(col, "cyl", "team", (0, 0.02, 1.52), (0.44, 0.41, 0.06), parent=head, depth=2, radius=1)  # Kopftuch
        prim(col, "sphere", "hair_bandit", (0, -0.3, 1.18), (0.22, 0.12, 0.14), parent=head)  # Bart
    for x in (0.14, -0.14):
        prim(col, "cube", "eye", (x, -0.39, 1.34), (0.035, 0.02, 0.07), parent=head)
    return {"root": root, "hips": hips, "torso": torso, "head": head,
            "leg_l": leg_l, "leg_r": leg_r, "arm_l": arm_l, "arm_r": arm_r, "wrist": wrist}


def build_house(sc):
    col = collection(sc, "prop_house")
    root = empty(col, "prop_house_root", (0, 0, 0))
    prim(col, "cube", "plaster", (0, 0, 0.42), (0.62, 0.5, 0.42), parent=root)
    prim(col, "cube", "wood", (0, -0.51, 0.3), (0.16, 0.02, 0.3), parent=root)  # Tür nach Süden
    roof = prim(col, "cyl", "roof", (0, 0, 0.98), (0.72, 0.62, 0.36), rot=(0, 90, 0), parent=root, vertices=3, depth=2, radius=1)
    roof.rotation_euler = (math.radians(90), 0, math.radians(90))
    roof.scale = (0.72, 0.42, 0.62)
    roof.location = (0, 0, 1.0)
    prim(col, "cube", "stone", (0.36, 0.18, 1.2), (0.09, 0.09, 0.2), parent=root)  # Kamin
    return root


def build_tree(sc):
    col = collection(sc, "prop_tree")
    root = empty(col, "prop_tree_root", (0, 0, 0))
    prim(col, "cyl", "wood", (0, 0, 0.3), (0.09, 0.09, 0.3), parent=root, depth=2, radius=1)
    prim(col, "sphere", "leaf_dark", (0, 0.05, 0.85), (0.5, 0.45, 0.42), parent=root)
    prim(col, "sphere", "leaf", (-0.08, -0.08, 1.05), (0.38, 0.34, 0.32), parent=root)
    return root


def setup_camera_light(sc):
    cam_data = bpy.data.cameras.new("HC_cam")
    cam_data.type = "ORTHO"
    cam = bpy.data.objects.new("HC_cam", cam_data)
    sc.collection.objects.link(cam)
    pitch = math.radians(CAM_PITCH_DEG)
    target_z = FEET_OFFSET_PX / PX_PER_UNIT / math.cos(pitch)
    d = 20.0
    cam.location = (0, -d * math.cos(pitch), target_z + d * math.sin(pitch))
    cam.rotation_euler = (math.radians(90 - CAM_PITCH_DEG), 0, 0)
    sc.camera = cam
    sun_data = bpy.data.lights.new("HC_sun", "SUN")
    sun_data.energy = 3.0
    sun = bpy.data.objects.new("HC_sun", sun_data)
    sc.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(40), math.radians(-35), math.radians(-20))  # Licht von oben links vorn
    w = sc.world or bpy.data.worlds.new("HC_world")
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.0
    r = sc.render
    r.engine = "BLENDER_EEVEE"
    r.film_transparent = True
    r.filter_size = 0.0
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    return cam


def build_all():
    sc = get_scene()
    clear_scene(sc)
    setup_camera_light(sc)
    rigs = {"kael": build_humanoid(sc, "kael", "kael"), "bandit": build_humanoid(sc, "bandit", "bandit")}
    build_house(sc)
    build_tree(sc)
    normal_material()
    return sc, rigs


if __name__ == "__main__" or True:
    _sc, _rigs = build_all()
    result = {"scene": _sc.name, "objects": len(_sc.collection.all_objects)}
