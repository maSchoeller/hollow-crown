"""Shared helpers for the low-poly prop library (props season 1, after ChatGPT reference sheets in art/props/refs/).

Each group script in this folder (`trees.py`, `houses.py`, …) is a Blender script:

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/<group>.py

or all at once with `pnpm art:props` (tools/art/props/run.py). A script builds each asset from primitives with bmesh /
bpy, paints it with a node material, bakes that material into one small base-colour texture, and writes

- art/models/props/<pid>_<state>.glb   the game model (glTF, Y up, one texture embedded, no other materials)
- art/props/previews/<pid>_<state>.png a 3/4 render for review

Conventions (the game's board and world map, src/render/shared/models.ts `loadPropMesh`):
- One tile = 1 Blender unit. Origin = centre of the tile on the ground (z = 0), the model stands on z >= 0, +Y = north
  (the camera looks from the south, so the "front" of a house faces -Y). Footprint inside about 0.85 × 0.85 unless the
  asset is meant to be bigger (wagon, farm, bridge: say so in the group script).
- Budget: trees and bushes ≤ 600 triangles (hundreds of instances on a map), rocks ≤ 400, buildings ≤ 1500.
- Texture: 256 px (512 for buildings), baked from the node material; flat-shaded facets with soft painted gradients.
- Vertex colours: white everywhere; team cloth (flags, banners) marks its faces with alpha (k + 1) / 8 for key k = 0..3
  of the team ramp (dark → light) and white base colour in the texture there, so the game can tint it.
"""
import math
import os

import bpy
import bmesh

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MODELS = os.path.join(ROOT, 'art', 'models', 'props')
PREVIEWS = os.path.join(ROOT, 'art', 'props', 'previews')


def reset():
    """Empty scene with Cycles available for baking."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 16
    return scene


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def mesh_object(name, bm):
    """A new object from a bmesh (the bmesh is freed)."""
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))


def join(objs, name):
    """Joins objects into one (applying transforms); returns the joined object."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(objs) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = name
    obj.data.name = name
    return obj


def flat(obj):
    """Flat-shaded facets (the low-poly look)."""
    for p in obj.data.polygons:
        p.use_smooth = False


def tris(obj):
    return sum(len(p.vertices) - 2 for p in obj.data.polygons)


def unwrap(obj, margin=0.02):
    """Smart UV projection for baking."""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=margin)
    bpy.ops.object.mode_set(mode='OBJECT')


def vertex_colors(obj, team_faces=None):
    """White vertex colours (RGBA) on every corner; `team_faces` = {face index: key 0..3} get alpha (k + 1) / 8."""
    me = obj.data
    attr = me.color_attributes.get('Col') or me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    team_faces = team_faces or {}
    for p in me.polygons:
        a = (team_faces[p.index] + 1) / 8 if p.index in team_faces else 1.0
        for li in p.loop_indices:
            attr.data[li].color = (1.0, 1.0, 1.0, a)


def bake_texture(obj, size=256, name=None):
    """Bakes the object's node material (diffuse colour) into one image and swaps in a plain image material."""
    name = name or obj.name
    img = bpy.data.images.new(f'{name}_albedo', size, size, alpha=False)
    mats = [s.material for s in obj.material_slots if s.material]
    for m in mats:
        node = m.node_tree.nodes.new('ShaderNodeTexImage')
        node.image = img
        m.node_tree.nodes.active = node
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    scene = bpy.context.scene
    scene.render.bake.use_pass_direct = False
    scene.render.bake.use_pass_indirect = False
    scene.render.bake.use_pass_color = True
    scene.render.bake.margin = 4
    bpy.ops.object.bake(type='DIFFUSE')
    img.pack()
    final = bpy.data.materials.new(f'{name}_mat')
    final.use_nodes = True
    bsdf = final.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.9
    tex = final.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = img
    final.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    obj.data.materials.clear()
    obj.data.materials.append(final)
    return img


def export(obj, pid_state):
    """Writes art/models/props/<pid_state>.glb (this object only, texture embedded, vertex colours kept)."""
    os.makedirs(MODELS, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(MODELS, f'{pid_state}.glb'),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_vertex_color='ACTIVE',
        export_image_format='AUTO',
        export_cameras=False,
        export_lights=False,
        export_animations=False,
    )


def preview(obj, pid_state, size=512):
    """3/4 render from the south-west (the board camera's side) into art/props/previews/<pid_state>.png."""
    os.makedirs(PREVIEWS, exist_ok=True)
    scene = bpy.context.scene
    for o in list(scene.objects):
        if o.type in ('CAMERA', 'LIGHT', 'EMPTY'):
            bpy.data.objects.remove(o)
    cam = link(bpy.data.objects.new('cam', bpy.data.cameras.new('cam')))
    cam.data.type = 'ORTHO'
    dims = obj.dimensions
    cam.data.ortho_scale = max(dims.x, dims.y, dims.z) * 1.7 + 0.2
    cam.location = (-2.2, -3.2, 2.6 + dims.z * 0.5)
    target = link(bpy.data.objects.new('target', None))
    target.location = (0, 0, dims.z * 0.45)
    aim = cam.constraints.new('TRACK_TO')
    aim.target = target
    aim.track_axis = 'TRACK_NEGATIVE_Z'
    aim.up_axis = 'UP_Y'
    scene.camera = cam
    sun = link(bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')))
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(-35))
    scene.world = scene.world or bpy.data.worlds.new('w')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.8, 0.8, 0.82, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    scene.view_settings.view_transform = 'Standard'
    scene.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items} else 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.film_transparent = False
    scene.render.filepath = os.path.join(PREVIEWS, f'{pid_state}.png')
    bpy.ops.render.render(write_still=True)
    scene.render.engine = 'CYCLES'


def finish(obj, pid_state, size=256, team_faces=None):
    """Unwrap, bake, vertex colours, export and preview in one go; prints the triangle count."""
    flat(obj)
    unwrap(obj)
    bake_texture(obj, size, pid_state)
    vertex_colors(obj, team_faces)
    export(obj, pid_state)
    preview(obj, pid_state)
    print(f'{pid_state}: {tris(obj)} triangles')
