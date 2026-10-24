"""World map terrain in Blender (story 5.2): the height map of tools/art/world_height.py → one landscape mesh.

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b -P tools/art/blender_world.py   (or `pnpm art:world`)

Builds Valmora as one mesh (a grid over map + sea skirt, displaced by art/world/valmora_height.png), cleans it up for
the game (flat sea floor and plains dissolved, smooth shading), gives it planar UVs over the whole grid (the game lays the
painted ground valmora_albedo.png on it) and writes:
- art/world/valmora.glb          the terrain, Y up, one unit = one tile, origin = north-west corner of the map (tile 0, 0)
- art/world/valmora_preview.png  a render from the south (warm light, ground colours) to compare with the concept sheets
"""
import json
import math
import os

import bpy
import bmesh

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORLD = os.path.join(ROOT, 'art', 'world')
meta = json.load(open(os.path.join(WORLD, 'valmora_height.json')))
SW, SH, RES, SKIRT = meta['samplesW'], meta['samplesH'], meta['res'], meta['skirt']
HMIN, HMAX = meta['min'], meta['max']

# ------------------------------------------------------------------ scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

img = bpy.data.images.load(os.path.join(WORLD, 'valmora_height.png'))
img.colorspace_settings.name = 'Non-Color'
px = list(img.pixels)  # RGBA floats, rows bottom-up
iw, ih = img.size


def height(i, j):
    """Sample (i east, j south) of the height map in tiles."""
    row = ih - 1 - j
    return HMIN + px[(row * iw + i) * 4] * (HMAX - HMIN)


# ------------------------------------------------------------------ mesh
# Blender is Z up with north = +Y: tile (tx, ty) of the map (ty grows to the south) sits at Blender (tx, −ty, h). The
# glTF export turns it Y up; the game places the loaded mesh so that it lands on the board's convention (x, h, −y).
bm = bmesh.new()
uv_layer = bm.loops.layers.uv.new('UVMap')
verts = []
for j in range(SH):
    for i in range(SW):
        x = i / RES - SKIRT
        y = -(j / RES - SKIRT)
        verts.append(bm.verts.new((x, y, height(i, j))))
bm.verts.ensure_lookup_table()
for j in range(SH - 1):
    for i in range(SW - 1):
        a = verts[j * SW + i]
        b = verts[j * SW + i + 1]
        c = verts[(j + 1) * SW + i + 1]
        d = verts[(j + 1) * SW + i]
        f = bm.faces.new((a, b, c, d))
        for loop in f.loops:
            v = loop.vert.co
            # u east, v north up (the splat maps have the north row on top)
            loop[uv_layer].uv = ((v.x + SKIRT) / (SW - 1) * RES, 1 - (-v.y + SKIRT) / (SH - 1) * RES)
bm.normal_update()
for f in bm.faces:
    if f.normal.z < 0:
        f.normal_flip()

mesh = bpy.data.meshes.new('valmora')
bm.to_mesh(mesh)
bm.free()
obj = bpy.data.objects.new('valmora', mesh)
scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# fewer triangles where the land is flat (sea floor, plains); UVs are planar, so dissolving keeps them exact
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.dissolve_limited(angle_limit=math.radians(1.2), use_dissolve_boundaries=False)
bpy.ops.mesh.quads_convert_to_tris(quad_method='BEAUTY', ngon_method='BEAUTY')
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.shade_smooth()
tris = sum(len(p.vertices) - 2 for p in mesh.polygons)

# ------------------------------------------------------------------ preview material: the painted ground (valmora_albedo.png)
mat = bpy.data.materials.new('valmora_preview')
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes['Principled BSDF']
bsdf.inputs['Roughness'].default_value = 0.92
albedo = nt.nodes.new('ShaderNodeTexImage')
albedo.image = bpy.data.images.load(os.path.join(WORLD, 'valmora_albedo.png'))
nt.links.new(albedo.outputs['Color'], bsdf.inputs['Base Color'])
obj.data.materials.append(mat)

# water plane at the water level
bpy.ops.mesh.primitive_plane_add(size=1, location=((SW - 1) / RES / 2 - SKIRT, -((SH - 1) / RES / 2 - SKIRT), meta['water']))
water = bpy.context.active_object
water.name = 'preview_water'
water.scale = ((SW - 1) / RES, (SH - 1) / RES, 1)
wm = bpy.data.materials.new('water')
wm.use_nodes = True
wb = wm.node_tree.nodes['Principled BSDF']
wb.inputs['Base Color'].default_value = (0.05, 0.35, 0.55, 1)
wb.inputs['Roughness'].default_value = 0.15
wb.inputs['Alpha'].default_value = 0.55
water.data.materials.append(wm)

# ------------------------------------------------------------------ export (terrain only)
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.export_scene.gltf(
    filepath=os.path.join(WORLD, 'valmora.glb'),
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_materials='NONE',
    export_texcoords=True,
    export_normals=True,
    export_cameras=False,
    export_lights=False,
    export_animations=False,
)

# ------------------------------------------------------------------ preview render from the south, warm sun from the south-west
cx, cy = (SW - 1) / RES / 2 - SKIRT, -((SH - 1) / RES / 2 - SKIRT)
cam_data = bpy.data.cameras.new('cam')
cam_data.type = 'ORTHO'
cam_data.ortho_scale = 70
cam = bpy.data.objects.new('cam', cam_data)
scene.collection.objects.link(cam)
cam.location = (cx, cy - 55, 58)
cam.rotation_euler = (math.radians(45), 0, 0)
scene.camera = cam
sun_data = bpy.data.lights.new('sun', 'SUN')
sun_data.energy = 2.4
sun_data.color = (1.0, 0.93, 0.8)
sun_data.angle = math.radians(8)
sun = bpy.data.objects.new('sun', sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(50), 0, math.radians(-140))
scene.world = bpy.data.worlds.new('w')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.7, 0.85, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
scene.view_settings.view_transform = 'Standard'
for engine in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        continue
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.render.filepath = os.path.join(WORLD, 'valmora_preview.png')
bpy.ops.render.render(write_still=True)
print(f'valmora.glb: {tris} triangles')
