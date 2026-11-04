"""Winter group: Aurenhall, canals, ice, Glutdom, Urtempel, sleeping dragon (act 3, N8-N10).

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/winter.py [-- id ...]

Rebuilt after the ChatGPT sheets art/mockups/map-assets/refs/winter_1.png, _2.png, _3.png (art/prompts/map_assets_winter.md).
Textures: art/props/textures/winter_*.png, cut from winter_tex1.png, winter_tex2.png; winter_glass.png from winter_1.png.

Snow comes in two ways: real pillows and drips for the silhouette (`pillow`, `drip`, `foot_lump`), and painted snow in the
material (`box_mat(snow=...)`) wherever a face looks up, which gives the ragged edges of the sheets.
South faces -y. Fixed seeds, deterministic. Writes art/models/props/<id>.glb and art/props/previews/<id>.png.
Sizes: dome_a 2 x 2 tiles, canal_bridge_a, ice_bridge_a and wagon_ring_a about 1.7 x 1 (along x), sleeping_dragon_a about 4 x 3 (x, y; the sheet draws it wide).
Most models carry the paint of their sheet directly (PAINT, winter_paint_<id>.png), so the brush work matches from the board camera; only the
snow-capped fortification pieces are baked from tiled textures, because their shapes are fixed by fortify.py.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import PREVIEWS, bake_texture, export, flat, join, link, mesh_object, reset, tris, unwrap, vertex_colors  # noqa: E402
from facing import face_camera  # noqa: E402
from fortify import SEG, TEX, extrude_y, image_mat, merlons, rounded, slab, slit, tower_parts  # noqa: E402
from houses import beam, box, circle, lin, loft, paint, with_mat  # noqa: E402


# ---------------------------------------------------------------- materials

def box_mat(name, file, scale=1.0, tint=(1, 1, 1), zfade=None, snow=None, blend=0.3, shade=(0.66, 1.14)):
    """Image projected along the three axes (no stretching on any facet), lighter towards the light.
    zfade = (z0, z1, rgba): below z0 the flat colour, above z1 the image (glow from a crack, depth in ice).
    snow = (threshold, width, noise): painted snow on whatever looks up, ragged by noise."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, L = m.node_tree.nodes, m.node_tree.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.9
    geo = n.new('ShaderNodeNewGeometry')
    sc = n.new('ShaderNodeVectorMath')
    sc.operation = 'SCALE'
    L.new(geo.outputs['Position'], sc.inputs[0])
    sc.inputs['Scale'].default_value = scale
    tex = n.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(os.path.join(TEX, file), check_existing=True)
    tex.extension = 'REPEAT'
    tex.projection = 'BOX'
    tex.projection_blend = blend
    L.new(sc.outputs[0], tex.inputs['Vector'])
    dot = n.new('ShaderNodeVectorMath')
    dot.operation = 'DOT_PRODUCT'
    L.new(geo.outputs['Normal'], dot.inputs[0])
    dot.inputs[1].default_value = (0.25, -0.5, 0.83)
    sh = n.new('ShaderNodeMapRange')
    sh.inputs['From Min'].default_value = -1.0
    sh.inputs['To Min'].default_value, sh.inputs['To Max'].default_value = shade
    L.new(dot.outputs['Value'], sh.inputs['Value'])
    mul = n.new('ShaderNodeVectorMath')
    mul.operation = 'SCALE'
    L.new(tex.outputs['Color'], mul.inputs[0])
    L.new(sh.outputs['Result'], mul.inputs['Scale'])
    tn = n.new('ShaderNodeVectorMath')
    tn.operation = 'MULTIPLY'
    L.new(mul.outputs[0], tn.inputs[0])
    tn.inputs[1].default_value = tint
    col = tn.outputs[0]
    sp = n.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Position'], sp.inputs[0])
    if zfade:
        z0, z1, rgba = zfade
        fac = n.new('ShaderNodeMapRange')
        fac.inputs['From Min'].default_value = z0
        fac.inputs['From Max'].default_value = z1
        L.new(sp.outputs['Z'], fac.inputs['Value'])
        mix = n.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        L.new(fac.outputs['Result'], mix.inputs[0])
        mix.inputs[6].default_value = rgba
        L.new(col, mix.inputs[7])
        col = mix.outputs[2]
    if snow:
        th, width, amp = snow
        nsp = n.new('ShaderNodeSeparateXYZ')
        L.new(geo.outputs['Normal'], nsp.inputs[0])
        noise = n.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 7.0
        noise.inputs['Detail'].default_value = 4.0
        L.new(geo.outputs['Position'], noise.inputs['Vector'])
        off = n.new('ShaderNodeMath')
        off.operation = 'MULTIPLY_ADD'
        L.new(noise.outputs['Fac'], off.inputs[0])
        off.inputs[1].default_value = amp * 2
        off.inputs[2].default_value = -amp
        add = n.new('ShaderNodeMath')
        add.operation = 'ADD'
        L.new(nsp.outputs['Z'], add.inputs[0])
        L.new(off.outputs[0], add.inputs[1])
        fac = n.new('ShaderNodeMapRange')
        fac.inputs['From Min'].default_value = th
        fac.inputs['From Max'].default_value = th + width
        L.new(add.outputs[0], fac.inputs['Value'])
        white = n.new('ShaderNodeMix')
        white.data_type = 'RGBA'
        L.new(sh.outputs['Result'], white.inputs[0])
        white.inputs[6].default_value = lin(140, 148, 190)
        white.inputs[7].default_value = lin(250, 248, 250)
        mix = n.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        L.new(fac.outputs['Result'], mix.inputs[0])
        L.new(col, mix.inputs[6])
        L.new(white.outputs[2], mix.inputs[7])
        col = mix.outputs[2]
    L.new(col, bsdf.inputs['Base Color'])
    return m


def plane_mat(name, file, x0, x1, z0, z1):
    """An image placed exactly on a rectangle of the x-z plane (the stained glass)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, L = m.node_tree.nodes, m.node_tree.links
    geo = n.new('ShaderNodeNewGeometry')
    sp = n.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Position'], sp.inputs[0])
    cb = n.new('ShaderNodeCombineXYZ')
    for axis, (a, b), out in (('X', (x0, x1), 'X'), ('Z', (z0, z1), 'Y')):
        mr = n.new('ShaderNodeMapRange')
        mr.inputs['From Min'].default_value = a
        mr.inputs['From Max'].default_value = b
        L.new(sp.outputs[axis], mr.inputs['Value'])
        L.new(mr.outputs['Result'], cb.inputs[out])
    tex = n.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(os.path.join(TEX, file), check_existing=True)
    tex.extension = 'EXTEND'
    L.new(cb.outputs[0], tex.inputs['Vector'])
    L.new(tex.outputs['Color'], n['Principled BSDF'].inputs['Base Color'])
    return m


class W:
    """All materials of the group; one set per model (reset() clears the scene)."""

    def __init__(self):
        self.snow = box_mat('snow', 'winter_snow.png', 1.3, (1.0, 1.0, 1.02), shade=(0.66, 1.06))
        self.cool = box_mat('w_cool', 'winter_stone.png', 1.25)
        self.stone = box_mat('w_stone', 'winter_stone.png', 1.3, (1.12, 1.05, 0.98))
        self.cap = box_mat('w_cap', 'winter_stone.png', 1.7, (1.08, 1.08, 1.1))
        self.grey = box_mat('w_grey', 'winter_stone.png', 1.9, (1.24, 1.14, 0.98))
        self.lime = box_mat('w_lime', 'winter_lime.png', 1.7, (1.0, 0.95, 0.89))
        self.marble = paint('w_marble', [(0.0, lin(176, 136, 104)), (0.45, lin(226, 190, 152)), (1.0, lin(250, 226, 196))], wn=1.0, noise=0.05, nscale=5, stretch=(1, 1, 0.3), seed=24.0)
        self.slate = box_mat('w_slate', 'winter_slate.png', 2.4)
        self.ice = box_mat('w_ice', 'winter_ice.png', 1.1, (0.86, 0.97, 1.0), zfade=(-0.1, 0.5, lin(92, 170, 190)))
        self.oak = box_mat('w_oak', 'kit_oak.png', 1.6, (0.8, 0.74, 0.7))
        self.shingle = box_mat('w_shingle', 'winter_scales.png', 3.2, (1.0, 0.72, 0.46))
        self.canvas = box_mat('w_canvas', 'winter_canvas.png', 1.3)
        self.lava = box_mat('w_lava', 'winter_lava.png', 1.5, (1.25, 1.1, 1.08))
        self.plaster = paint('w_plaster', [(0.0, lin(176, 146, 112)), (0.55, lin(226, 200, 160)), (1.0, lin(248, 232, 200))], wn=0.85, noise=0.06, nscale=11, seed=12.0)
        self.frame = paint('w_frame', [(0.0, lin(62, 36, 20)), (1.0, lin(138, 86, 46))], wn=0.7, noise=0.1, nscale=16, seed=13.0)
        self.iron = paint('w_iron', [(0.0, lin(34, 32, 34)), (1.0, lin(104, 98, 94))], wn=0.85, noise=0.05, nscale=20, seed=14.0)
        self.bronze = box_mat('w_bronze', 'winter_lime.png', 2.0, (0.66, 0.44, 0.24), shade=(0.5, 1.24))
        self.glow = paint('w_glow', [(0.0, lin(255, 164, 54)), (0.6, lin(255, 204, 92)), (1.0, lin(255, 240, 168))], wn=0.5, noise=0.25, nscale=9, seed=16.0, bias=0.2)
        self.ember = paint('w_ember', [(0.0, lin(190, 52, 14)), (0.5, lin(244, 112, 26)), (1.0, lin(255, 190, 64))], wn=0.3, noise=0.3, nscale=7, seed=17.0, bias=0.3)
        self.water = paint('w_water', [(0.0, lin(28, 66, 68)), (0.5, lin(40, 88, 86)), (0.72, lin(58, 112, 104)), (0.86, lin(134, 184, 170)), (1.0, lin(196, 224, 212))], wn=0.1, noise=0.62, nscale=2.2, stretch=(0.7, 6, 1), seed=18.0, bias=0.42)
        self.moss = paint('w_moss', [(0.0, lin(62, 74, 44)), (1.0, lin(112, 118, 66))], wn=0.5, noise=0.25, nscale=16, seed=19.0, bias=0.1)
        self.dark = paint('w_dark', [(0.0, lin(26, 22, 26)), (1.0, lin(60, 48, 46))], wn=0.5, noise=0.05, nscale=10, seed=20.0)
        self.deep = paint('w_deep', [(0.0, lin(18, 52, 74)), (1.0, lin(44, 104, 128))], wn=0.6, noise=0.1, nscale=8, seed=21.0)


# Paint laid over the model along the view of its reference sheet (winter_paint_<id>.png): the sheet's own brush work on real geometry.
# Tilt from straight down and yaw towards the east of that drawing, and where the prop sits in the paint (u0, v0, u1, v1 from the top left).
FULL = (0.0, 0.0, 1.0, 1.0)
PAINT = {
    'city_house_a': (54, 14, FULL),
    'city_house_b': (54, 10, FULL),
    'city_house_c': (54, 12, FULL),
    'street_lantern_a': (54, 0, FULL),
    'palace_column_a': (54, 0, FULL),
    'palace_window_a': (54, 8, FULL),
    'canal_wall_a': (50, 0, FULL),
    'canal_bridge_a': (50, 0, FULL),
    'ice_floe_a': (50, 0, FULL),
    'ice_crack_a': (50, 0, FULL),
    'glacier_crack_a': (50, 0, FULL),
    'ice_spire_a': (54, 0, FULL),
    'urtempel_pillar_a': (54, 0, FULL),
}

# Faces the sheet cannot show (inside of the dome): material name -> a small patch of the paint (u, v from the top left, scale).
PATCHES = {}


def apply_paint(obj, pid):
    """UVs from the view of the sheet, fitted to where the prop sits in the paint; one plain image material instead of the bake."""
    tilt, yaw, box_uv = PAINT[pid][:3]
    t, y = math.radians(tilt), math.radians(yaw)
    cy, sy, ct, st = math.cos(y), math.sin(y), math.cos(t), math.sin(t)
    me = obj.data
    pa = [v.co.x * cy + v.co.y * sy for v in me.vertices]
    pb = [(-v.co.x * sy + v.co.y * cy) * ct + v.co.z * st for v in me.vertices]
    a0, a1, b0, b1 = min(pa), max(pa), min(pb), max(pb)
    u0, v0, u1, v1 = box_uv
    uv = me.uv_layers.new(name='paint')
    me.uv_layers.active = uv
    traced = PAINT[pid][3] if len(PAINT[pid]) > 3 else None
    patches = PATCHES.get(pid, {})
    names = [m.name for m in me.materials]
    for poly in me.polygons:
        patch = patches.get(names[poly.material_index])
        for li in poly.loop_indices if patch else ():
            co = me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = (patch[0] + (co.x + co.y) * patch[2], 1.0 - patch[1] + co.z * patch[2])
    painted = {li for poly in me.polygons if patches.get(names[poly.material_index]) for li in poly.loop_indices}
    for li, loop in enumerate(me.loops):
        if li in painted:
            continue
        i = loop.vertex_index
        if traced:
            uv.data[li].uv = traced(*me.vertices[i].co)
        else:
            uv.data[li].uv = (u0 + (pa[i] - a0) / (a1 - a0) * (u1 - u0), 1.0 - (v1 - (pb[i] - b0) / (b1 - b0) * (v1 - v0)))
    img = bpy.data.images.load(os.path.join(TEX, f'winter_paint_{pid}.png'), check_existing=True)
    img.pack()
    final = bpy.data.materials.new(f'{pid}_mat')
    final.use_nodes = True
    bsdf = final.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.9
    tex = final.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = img
    tex.extension = 'EXTEND'
    final.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    me.materials.clear()
    me.materials.append(final)


def done(obj, pid, size=512, smooth=('snow',), view=(56.0, 12.0)):
    """common.finish, but the materials named in `smooth` stay soft (snow, dragon hide): the rest keeps its facets.
    Models listed in PAINT get the paint of their sheet instead of the bake."""
    face_camera(obj)
    flat(obj)
    names = [s.material.name if s.material else '' for s in obj.material_slots]
    for p in obj.data.polygons:
        if any(names[p.material_index].startswith(k) for k in smooth):
            p.use_smooth = True
    if pid in PAINT:
        apply_paint(obj, pid)
        view = PAINT[pid][:2]
    else:
        unwrap(obj)
        bake_texture(obj, size, pid)
    vertex_colors(obj)
    export(obj, pid)
    shot(obj, pid, tilt=view[0], yaw=view[1])
    print(f'{pid}: {tris(obj)} triangles')


def shot(obj, pid, size=512, tilt=56.0, yaw=12.0):
    """Tightly framed preview from the angle of the reference sheets (flatter than the board camera, turned a little to the east)."""
    os.makedirs(PREVIEWS, exist_ok=True)
    scene = bpy.context.scene
    cam = link(bpy.data.objects.new('cam', bpy.data.cameras.new('cam')))
    cam.data.type = 'ORTHO'
    rot = (Matrix.Rotation(math.radians(yaw), 3, 'Z') @ Matrix.Rotation(math.radians(tilt), 3, 'X'))
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = rot.to_quaternion()
    inv = rot.inverted()
    pts = [inv @ (obj.matrix_world @ v.co) for v in obj.data.vertices]
    x0, x1 = min(p.x for p in pts), max(p.x for p in pts)
    y0, y1 = min(p.y for p in pts), max(p.y for p in pts)
    cam.data.ortho_scale = max(x1 - x0, y1 - y0) * 1.12
    cam.location = rot @ Vector(((x0 + x1) / 2, (y0 + y1) / 2, 20.0))
    cam.data.clip_end = 100.0
    scene.camera = cam
    sun = link(bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')))
    sun.data.energy = 2.1
    sun.data.color = (1.0, 0.95, 0.86)
    sun.rotation_euler = (math.radians(42), 0, math.radians(-35))
    scene.world = scene.world or bpy.data.worlds.new('w')
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.82, 0.76, 0.68, 1)
    bg.inputs['Strength'].default_value = 0.7
    scene.view_settings.view_transform = 'Standard'
    engines = {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items}
    scene.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in engines else 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.film_transparent = False
    scene.render.filepath = os.path.join(PREVIEWS, f'{pid}.png')
    bpy.ops.render.render(write_still=True)
    scene.render.engine = 'CYCLES'


# ---------------------------------------------------------------- snow

def pillow(name, c, sx, sy, z, th, mat, rng, seg=12, rz=0.0, jit=0.1):
    """Soft cushion of snow lying at height z, rounded rectangle sx x sy (half sizes); open at the bottom."""
    ca, sa = math.cos(rz), math.sin(rz)
    rings = [[], [], []]
    for i in range(seg):
        a = 2 * math.pi * i / seg + 0.13
        co, si = math.cos(a), math.sin(a)
        x = math.copysign(abs(co) ** 0.55, co) * sx * (1 + rng.uniform(-jit, jit))
        y = math.copysign(abs(si) ** 0.55, si) * sy * (1 + rng.uniform(-jit, jit))
        for ring, (k, dz) in zip(rings, ((1.0, -th * 0.25), (1.04, th * 0.45), (0.8, th * rng.uniform(0.9, 1.1)))):
            u, v = x * k, y * k
            ring.append((c[0] + ca * u - sa * v, c[1] + sa * u + ca * v, z + dz))
    rings.append([(c[0], c[1], z + th * 1.12)])
    return loft(name, rings, mat, cap=False)


def drip(name, x, y, z, r, length, mat, sides=5):
    """Icicle-like tongue of snow or ice hanging from z."""
    return loft(name, [circle((x, y), r, z, sides), circle((x, y), r * 0.72, z - length * 0.55, sides), [(x, y, z - length)]], mat, cap=False)


def foot_lump(name, x, y, r, h, mat, rng, seg=7):
    """Drift on the ground."""
    k = [rng.uniform(0.85, 1.15) for _ in range(seg)]
    def ring(rr, z):
        return [(x + math.cos(2 * math.pi * i / seg) * rr * k[i], y + math.sin(2 * math.pi * i / seg) * rr * k[i] * 0.85, z) for i in range(seg)]
    return loft(name, [ring(r * 1.1, -0.005), ring(r * 0.85, h * 0.6), ring(r * 0.45, h * 0.95), [(x, y, h)]], mat, cap=False)


def foot_ring(parts, M, prefix, pts, rng, r=(0.06, 0.11), h=(0.04, 0.08)):
    """Flat drifts; each spot gets a second one beside it so they do not read as balls."""
    for i, (x, y) in enumerate(pts):
        rr = rng.uniform(*r) * 1.15
        hh = rng.uniform(*h) * 0.75
        parts.append(foot_lump(f'{prefix}{i}', x, y, rr, hh, M.snow, rng))
        a = rng.uniform(0, 6.28)
        parts.append(foot_lump(f'{prefix}{i}b', x + math.cos(a) * rr * 0.9, y + math.sin(a) * rr * 0.6, rr * 0.7, hh * 0.7, M.snow, rng))


def drift(parts, M, prefix, a, b, rng, n=4, r=(0.07, 0.11), h=(0.03, 0.06)):
    """Overlapping drifts along a wall foot from a to b."""
    for i in range(n):
        t = (i + rng.uniform(0.2, 0.8)) / n
        parts.append(foot_lump(f'{prefix}{i}', a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + rng.uniform(-0.015, 0.015), rng.uniform(*r), rng.uniform(*h), M.snow, rng))


def eave_drips(parts, M, prefix, pts, rng, r=(0.02, 0.035), ln=(0.04, 0.1)):
    for i, (x, y, z) in enumerate(pts):
        parts.append(drip(f'{prefix}{i}', x, y, z, rng.uniform(*r), rng.uniform(*ln), M.snow))


# ---------------------------------------------------------------- small geometry

def torus(name, c, big, small, mat, seg=12, sides=4, axis='y', tilt=0.0):
    """Ring around `axis`; tilt turns it around x afterwards."""
    bm = bmesh.new()
    vs = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        row = []
        for j in range(sides):
            b = 2 * math.pi * j / sides + math.pi / sides
            rad = big + math.cos(b) * small
            off = math.sin(b) * small
            if axis == 'y':
                p = (math.cos(a) * rad, off, math.sin(a) * rad)
            else:
                p = (math.cos(a) * rad, math.sin(a) * rad, off)
            y, z = p[1], p[2]
            ct, st = math.cos(tilt), math.sin(tilt)
            row.append(bm.verts.new((c[0] + p[0], c[1] + ct * y - st * z, c[2] + st * y + ct * z)))
        vs.append(row)
    for i in range(seg):
        for j in range(sides):
            i2, j2 = (i + 1) % seg, (j + 1) % sides
            bm.faces.new((vs[i][j], vs[i2][j], vs[i2][j2], vs[i][j2]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return with_mat(mesh_object(name, bm), mat)


def cyl_axis(name, c, r, half, mat, seg=8, axis='y'):
    """Short cylinder lying along x or y."""
    def ring(d):
        out = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            u, v = math.cos(a) * r, math.sin(a) * r
            out.append((c[0] + d, c[1] + u, c[2] + v) if axis == 'x' else (c[0] + u, c[1] + d, c[2] + v))
        return out
    return loft(name, [ring(-half), ring(half)], mat)


def ball(name, c, r, mat, squash=(1, 1, 1), subdiv=1):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=r)
    for v in bm.verts:
        v.co = Vector((v.co.x * squash[0] + c[0], v.co.y * squash[1] + c[1], v.co.z * squash[2] + c[2]))
    return with_mat(mesh_object(name, bm), mat)


def spike(name, base, tip, r, mat, sides=5):
    """Cone from base to tip."""
    b, t = Vector(base), Vector(tip)
    d = (t - b).normalized()
    u = d.cross(Vector((0.3, 0.2, 1.0))).normalized()
    v = d.cross(u)
    ring = []
    for i in range(sides):
        a = 2 * math.pi * i / sides
        ring.append(tuple(b + u * (math.cos(a) * r) + v * (math.sin(a) * r)))
    return loft(name, [ring, [tuple(t)]], mat, cap=False)


def holed_wall(prefix, x0, x1, half, spring, rise, top, y0, y1, mat, n=8):
    """Wall from x0 to x1 with a round opening, top(x) on top, from convex pieces (the triangulation of a one-piece outline fills the opening)."""
    arc = [(-half * math.cos(math.pi * i / n), spring + rise * math.sin(math.pi * i / n)) for i in range(n + 1)]
    out = []
    def piece(name, pts):
        out.append(extrude_y(f'{prefix}{name}', pts, y0, y1, mat))
    steps = 3
    for sg, a, b in ((-1, x0, -half), (1, half, x1)):
        xs = [a + (b - a) * i / steps for i in range(steps + 1)]
        base = [(xs[0], 0.0), (xs[-1], 0.0)]
        piece(f'p{sg}', base + [(x, top(x)) for x in reversed(xs)])
    for i in range(n):
        (ax, az), (bx, bz) = arc[i], arc[i + 1]
        piece(f's{i}', [(ax, az), (bx, bz), (bx, top(bx)), (ax, top(ax))])
    return out


def face_box(face, at, u, z, su, sz, d, mat, name):
    """Box on a wall plane: face 's' (south, plane y = at), 'w' (west, plane x = at), 'e' (east)."""
    if face == 's':
        return box(name, (u, at - d / 2 + 0.003, z), (su, d, sz), mat)
    if face == 'w':
        return box(name, (at - d / 2 + 0.003, u, z), (d, su, sz), mat)
    return box(name, (at + d / 2 - 0.003, u, z), (d, su, sz), mat)


def face_arch(face, at, u, z0, w, h, d, mat, name, peak=False):
    """Round- or point-topped plate on a wall plane."""
    hw = w / 2
    n = 6
    pts = [(u - hw, z0), (u + hw, z0), (u + hw, z0 + h - hw)]
    if peak:
        pts += [(u + hw * 0.55, z0 + h - hw * 0.42), (u, z0 + h), (u - hw * 0.55, z0 + h - hw * 0.42)]
    else:
        pts += [(u + hw * math.cos(math.pi * i / n), z0 + h - hw + hw * math.sin(math.pi * i / n)) for i in range(1, n)]
    pts.append((u - hw, z0 + h - hw))
    def ring(depth):
        if face == 's':
            return [(a, at - depth, b) for a, b in pts]
        if face == 'w':
            return [(at - depth, a, b) for a, b in pts]
        return [(at + depth, a, b) for a, b in pts]
    return loft(name, [ring(-0.003), ring(d)], mat)


def lit_window(parts, M, face, at, u, z, w, h, name, arch=False):
    """Warm glass, timber frame, cross bars."""
    if arch:
        parts.append(face_arch(face, at, u, z - h / 2 - 0.018, w + 0.05, h + 0.045, 0.012, M.frame, f'{name}f', False))
        parts.append(face_arch(face, at, u, z - h / 2, w, h, 0.02, M.glow, f'{name}g'))
    else:
        parts.append(face_box(face, at, u, z, w + 0.05, h + 0.05, 0.012, M.frame, f'{name}f'))
        parts.append(face_box(face, at, u, z, w, h, 0.02, M.glow, f'{name}g'))
    parts.append(face_box(face, at, u, z, 0.014, h, 0.028, M.frame, f'{name}v'))
    parts.append(face_box(face, at, u, z + (0 if not arch else h * 0.08), w, 0.014, 0.028, M.frame, f'{name}h'))


def door(parts, M, face, at, u, w, h, name, stone=None):
    """Round-topped oak door with a stone surround when `stone` is given."""
    if stone:
        parts.append(face_arch(face, at, u, 0.0, w + 0.1, h + 0.05, 0.022, stone, f'{name}s'))
    parts.append(face_arch(face, at, u, 0.0, w, h, 0.03, M.oak, f'{name}d'))
    parts.append(face_box(face, at, u + w * 0.26, h * 0.42, 0.02, 0.03, 0.04, M.iron, f'{name}k'))
    parts.append(face_box(face, at, u, h * 0.28, w * 0.9, 0.018, 0.034, M.iron, f'{name}b'))


def gable(parts, M, w, d, z0, rise, roof, rng, axis='y', ov=0.075, t=0.05, th=0.08, wall=None, st=None):
    """Steep double-pitch roof: slab of `roof`, thick snow with drips, wall triangles below it. axis = direction of the ridge."""
    half = w / 2 + ov
    slope = rise / (w / 2)
    ez = z0 - ov * slope
    zt = z0 + rise
    lo, hi = -d / 2 - ov, d / 2 + ov

    def P(u, v, z):
        return (u, v, z) if axis == 'y' else (v, u, z)
    prof = [(-half, ez), (0, zt), (half, ez), (half, ez - t), (0, zt - t * 1.3), (-half, ez - t)]
    parts.append(loft('roof', [[P(u, lo, z) for u, z in prof], [P(u, hi, z) for u, z in prof]], roof))
    if wall:
        tri = [(-w / 2, z0 - 0.01), (w / 2, z0 - 0.01), (0, zt - 0.02)]
        parts.append(loft('gw', [[P(u, -d / 2, z) for u, z in tri], [P(u, d / 2, z) for u, z in tri]], wall))
    n = 8
    rings = []
    for i in range(n):
        v = lo * 0.98 + (hi - lo) * 0.98 * i / (n - 1)
        def bump():
            return th * rng.uniform(0.7, 1.35)
        q1, q2, q3 = ez + (zt - ez) * 0.3, ez + (zt - ez) * 0.6, ez + (zt - ez) * 0.85
        rings.append([P(u, v, z) for u, z in [
            (-half * 1.0, ez + 0.0), (-half * 1.03, ez + bump() * 0.7), (-half * 0.7, q1 + bump()), (-half * 0.4, q2 + bump()), (-half * 0.15, q3 + bump()), (0, zt + bump()),
            (half * 0.15, q3 + bump()), (half * 0.4, q2 + bump()), (half * 0.7, q1 + bump()), (half * 1.03, ez + bump() * 0.7), (half, ez + 0.0),
            (half * 0.5, ez + (zt - ez) * 0.5 + 0.005), (0, zt + 0.005), (-half * 0.5, ez + (zt - ez) * 0.5 + 0.005)]])
    parts.append(loft('rsnow', rings, M.snow, cap=False))
    # rolled edge of the snow along the eaves and up the front rake
    count = max(4, int((hi - lo) / 0.21))
    for i in range(count):
        v = lo + (hi - lo) * (i + 0.5) / count
        for sg in (-1, 1):
            r0 = rng.uniform(0.09, 0.125)
            parts.append(pillow(f're{i}{sg}', P(sg * half * 0.97, v, 0)[:2], r0, r0, ez + th * 0.62, th * 0.62, M.snow, rng, seg=7))
    if axis == 'y':
        for sg in (-1, 1):
            for k, t in enumerate((0.25, 0.55, 0.85)):
                u = sg * half * (1 - t)
                r0 = rng.uniform(0.09, 0.115)
                parts.append(pillow(f'ra{k}{sg}', (u, lo + 0.01), r0, r0 * 0.8, ez + (zt - ez) * t + th * 0.62, th * 0.62, M.snow, rng, seg=7))
    # tongues over the eaves and the front rake
    pts = []
    for i in range(7):
        v = lo + (hi - lo) * (i + rng.uniform(0.15, 0.85)) / 7
        for s in (-1, 1):
            if rng.random() < 0.8:
                pts.append(P(s * half * 1.0, v, ez + 0.03))
    if axis == 'y':
        for s in (-1, 1):
            for k in (0.25, 0.5, 0.75):
                u = s * half * k
                pts.append((u, lo - 0.005, zt - (zt - ez) * k + th * 0.45))
    eave_drips(parts, M, 'rd', pts, rng)


def chimney(parts, big, M, x, y, z0, z1, w, rng, mat=None):
    big.append(box('chim', (x, y, (z0 + z1) / 2), (w, w, z1 - z0), mat or M.stone))
    big.append(box('chimc', (x, y, z1 + 0.02), (w + 0.04, w + 0.04, 0.05), M.cap))
    parts.append(pillow('chims', (x, y), w * 0.62, w * 0.62, z1 + 0.045, 0.07, M.snow, rng, seg=8))


# ---------------------------------------------------------------- fortification in snow (same shapes as fortify.py)

class FortMats:
    """What fortify.tower_parts asks for, in cool blue grey."""

    def __init__(self, M):
        self.round = image_mat('w_round', 'winter_stone.png', 'round', 1.25, (0.0, 0.0), 0.44)
        self.block = M.cap
        self.floor = paint('w_floor', [(0.0, lin(110, 118, 136)), (1.0, lin(176, 184, 200))], wn=0.3, noise=0.15, nscale=12, seed=22.0, bias=0.25, pattern=('stones', 7.0, 0.06, 0.5))
        self.iron = M.iron
        self.frame = M.frame


def snowcap_wall_idle():
    reset()
    M = W()
    rng = random.Random(201)
    big = [
        box('kerb', (0, -0.44, 0.03), (1.0, 0.13, 0.06), M.cap, skip=('-z',)),
        box('lip', (0, -0.51, -0.075), (1.01, 0.05, 0.17), M.cool),
    ]
    xs = (-0.335, 0, 0.335)
    merlons(big, M.cap, 'm', [(x, -0.44, rng.uniform(-0.03, 0.03)) for x in xs], 0.19, 0.2, 0.12, 0.05)
    parts = [rounded(join(big, 'stone'), 0.016)]
    for i, x in enumerate(xs):
        parts.append(pillow(f'mc{i}', (x, -0.44), 0.108, 0.07, 0.238, 0.05, M.snow, rng, seg=10))
        eave_drips(parts, M, f'md{i}', [(x + d, -0.515, 0.25) for d in (-0.07, 0.0, 0.06)], rng, r=(0.016, 0.026), ln=(0.03, 0.07))
    strip = []
    for k in range(9):
        x = -0.5 + k / 8
        j = rng.uniform(0.02, 0.06)
        strip.append([(x, -0.522, 0.058), (x, -0.515, 0.06 + j), (x, -0.44, 0.06 + j * 1.2), (x, -0.362, 0.06 + j * 0.5), (x, -0.36, 0.058)])
    parts.append(loft('ks', strip, M.snow))
    eave_drips(parts, M, 'kd', [(x, -0.535, 0.06) for x in (-0.44, -0.17, 0.16, 0.45)], rng, r=(0.016, 0.026), ln=(0.04, 0.09))
    done(join(parts, 'snowcap_wall_idle'), 'snowcap_wall_idle', size=256)


def snowcap_tower_idle():
    reset()
    M = W()
    F = FortMats(M)
    rng = random.Random(202)
    r, top, ring = 0.44, 1.42, 8
    big = tower_parts(F, (0, 0), r, top, 't', ring=ring)
    big += slit(F, 0, -r - 0.005, 0.68, 'a')
    big.append(box('pole', (-0.14, 0.14, top + 0.33), (0.022, 0.022, 0.66), M.frame))
    big.append(box('ball', (-0.14, 0.14, top + 0.68), (0.045, 0.045, 0.045), M.bronze))
    parts = [rounded(join(big, 'stone'), 0.012, segments=1)]
    # crown: pillow on every merlon, floor under a drift, ledges in the gaps
    w = 2 * math.pi * (r + 0.01) / ring * 0.62
    for k in range(ring):
        a = 2 * math.pi * k / ring
        x, y = math.cos(a) * (r + 0.01), math.sin(a) * (r + 0.01)
        parts.append(pillow(f'c{k}', (x, y), w * 0.53, 0.066, top + 0.19 - 0.002, 0.05, M.snow, rng, seg=8, rz=a + math.pi / 2))
        if y < 0.2:
            parts.append(drip(f'cd{k}', x * 1.17, y * 1.17, top + 0.2, 0.02, rng.uniform(0.05, 0.1), M.snow))
    # a drift along the inside of the crown, the flags stay free in the middle
    inner = []
    for z, rr in ((top + 0.002, r - 0.2), (top + 0.04, r - 0.13), (top + 0.05, r - 0.03), (top + 0.003, r + 0.05)):
        inner.append([(math.cos(2 * math.pi * k / 16) * rr * (1 + 0.05 * math.sin(k * 2.4)), math.sin(2 * math.pi * k / 16) * rr * (1 + 0.05 * math.sin(k * 2.4)), z) for k in range(16)])
    parts.append(loft('fl', inner, M.snow, cap=False))
    # flared foot under a drift
    rings = []
    for z, rr in ((0.0, r + 0.17), (0.05, r + 0.15), (0.1, r + 0.11), (0.135, r + 0.05)):
        rings.append([(math.cos(2 * math.pi * k / 20) * rr * (1 + 0.05 * math.sin(k * 1.7)), math.sin(2 * math.pi * k / 20) * rr * (1 + 0.05 * math.sin(k * 1.7)), z * (1 + 0.45 * math.sin(k * 2.9))) for k in range(20)])
    parts.append(loft('footsn', rings, M.snow, cap=False))
    for k in range(7):
        a = -math.pi * (k + 0.5) / 7
        parts.append(foot_lump(f'fl{k}', math.cos(a) * (r + 0.18), math.sin(a) * (r + 0.18), rng.uniform(0.07, 0.11), rng.uniform(0.05, 0.08), M.snow, rng))
    parts.append(box('sl', (0, -r - 0.012, 0.565), (0.12, 0.03, 0.016), M.snow))
    # same pennant as tower_idle
    flag = paint('w_pennant', [(0.0, lin(118, 30, 44)), (1.0, lin(176, 52, 62))], wn=0.6, noise=0.05, nscale=8, seed=23.0)
    parts.append(loft('flag', [[(-0.13, 0.14, top + 0.44), (-0.13, 0.14, top + 0.62), (-0.13, 0.145, top + 0.62), (-0.13, 0.145, top + 0.44)],
                               [(0.2, 0.14, top + 0.5), (0.13, 0.14, top + 0.535), (0.13, 0.145, top + 0.535), (0.2, 0.145, top + 0.5)]], flag))
    done(join(parts, 'snowcap_tower_idle'), 'snowcap_tower_idle', size=512)


# ---------------------------------------------------------------- Aurenhall houses

def house_a():
    """Half timber over stone, gable to the south, tall."""
    reset()
    M = W()
    rng = random.Random(211)
    w, d = 0.84, 0.82
    base, upper, rise = 0.66, 0.68, 0.72
    z1, z2 = base + 0.06, base + 0.06 + upper
    big = [
        box('base', (0, 0, base / 2), (w, d, base), M.stone, skip=('-z',)),
        box('band', (0, 0, base + 0.03), (w + 0.05, d + 0.05, 0.06), M.frame),
        box('band2', (0, 0, z2 + 0.015), (w + 0.09, d + 0.09, 0.05), M.frame),
    ]
    parts = [box('up', (0, 0, (z1 + z2) / 2), (w, d, upper), M.plaster)]
    for f, at in (('s', -d / 2), ('e', w / 2)):
        for u in (-0.4, -0.2, 0.2, 0.4):
            parts.append(face_box(f, at, u, (z1 + z2) / 2, 0.042, upper, 0.022, M.frame, f'p{f}{u}'))
    sy = -d / 2 - 0.012
    for s in (-1, 1):
        parts.append(beam(f'dg{s}', (s * 0.2, sy, z1), (s * 0.4, sy, z2), 0.04, M.frame))
    lit_window(parts, M, 's', -d / 2, 0, (z1 + z2) / 2 + 0.02, 0.24, 0.26, 'wu')
    lit_window(parts, M, 'e', w / 2, 0, (z1 + z2) / 2 + 0.02, 0.16, 0.26, 'wv')
    parts.append(box('wus', (0, -d / 2 - 0.03, (z1 + z2) / 2 - 0.135), (0.32, 0.05, 0.02), M.snow))
    door(parts, M, 's', -d / 2, 0, 0.2, 0.42, 'do')
    lit_window(parts, M, 's', -d / 2, -0.27, 0.27, 0.12, 0.2, 'wl', arch=True)
    lit_window(parts, M, 's', -d / 2, 0.27, 0.27, 0.12, 0.2, 'wr', arch=True)
    lit_window(parts, M, 'e', w / 2, 0.12, 0.3, 0.12, 0.2, 'wb', arch=True)
    gable(parts, M, w, d, z2 + 0.03, rise, M.slate, rng, axis='y', wall=M.plaster)
    # gable timbers
    gz = z2 + 0.04
    gy = -d / 2 - 0.012
    parts.append(beam('gk', (0, gy, gz), (0, gy, gz + rise - 0.06), 0.04, M.frame))
    for s in (-1, 1):
        parts.append(beam(f'gd{s}', (s * w / 2 * 0.9, gy, gz + 0.03), (0, gy, gz + rise * 0.8), 0.036, M.frame))
        parts.append(beam(f'bg{s}', (s * (w / 2 + 0.085), -d / 2 - 0.08, gz - 0.09), (0, -d / 2 - 0.08, gz + rise + 0.012), 0.04, M.frame))
    chimney(parts, big, M, 0.26, 0.24, z2 + 0.25, z2 + rise + 0.2, 0.15, rng)
    drift(parts, M, 'f', (-0.45, -0.46), (-0.12, -0.46), rng, n=3)
    drift(parts, M, 'g', (0.12, -0.46), (0.45, -0.46), rng, n=3)
    drift(parts, M, 'h', (0.46, -0.42), (0.46, 0.2), rng, n=4)
    parts.insert(0, rounded(join(big, 'mas'), 0.012, segments=1))
    done(join(parts, 'city_house_a'), 'city_house_a', size=512)


def house_b():
    """Stone ground floor, cream upper floors, stepped gable to the south."""
    reset()
    M = W()
    rng = random.Random(212)
    w, d = 0.84, 0.82
    base, upper = 0.62, 0.62
    z1, z2 = base + 0.05, base + 0.05 + upper
    big = [
        box('base', (0, 0, base / 2), (w, d, base), M.stone, skip=('-z',)),
    ]
    parts = [box('band', (0, 0, base + 0.025), (w + 0.05, d + 0.05, 0.05), M.frame),
             box('up', (0, 0, (z1 + z2) / 2), (w, d, upper), M.plaster)]
    # quoins up the plaster
    for s in (-1, 1):
        for k in range(4):
            sz = 0.11 if k % 2 else 0.15
            big.append(box(f'q{s}{k}', (s * (w / 2 - sz / 2 + 0.012), -d / 2 + 0.03, z1 + 0.08 + k * 0.145), (sz, 0.09, 0.125), M.grey))
    lit_window(parts, M, 's', -d / 2, -0.15, z1 + 0.27, 0.17, 0.25, 'wa')
    lit_window(parts, M, 's', -d / 2, 0.15, z1 + 0.27, 0.17, 0.25, 'wb')
    lit_window(parts, M, 'e', w / 2, 0.02, z1 + 0.27, 0.15, 0.25, 'wc')
    for i, u in enumerate((-0.15, 0.15)):
        big.append(box(f'sill{i}', (u, -d / 2 - 0.018, z1 + 0.125), (0.24, 0.05, 0.03), M.grey))
        big.append(box(f'lint{i}', (u, -d / 2 - 0.018, z1 + 0.42), (0.24, 0.05, 0.035), M.grey))
        parts.append(pillow(f'ls{i}', (u, -d / 2 - 0.02), 0.13, 0.034, z1 + 0.437, 0.03, M.snow, rng, seg=6))
    door(parts, M, 's', -d / 2, 0, 0.24, 0.44, 'do')
    parts.append(box('dst', (0, -d / 2 - 0.02, 0.012), (0.34, 0.06, 0.024), M.grey))
    # wedge stones around the door
    n = 7
    for i in range(n):
        a0, a1 = math.pi * (i + 0.05) / n, math.pi * (i + 0.95) / n
        cr, wd = 0.12, 0.085
        zc = 0.32
        q = [(-cr * math.cos(a0), zc + cr * math.sin(a0)), (-cr * math.cos(a1), zc + cr * math.sin(a1)),
             (-(cr + wd) * math.cos(a1), zc + (cr + wd) * math.sin(a1)), (-(cr + wd) * math.cos(a0), zc + (cr + wd) * math.sin(a0))]
        parts.append(extrude_y(f'vs{i}', q, -d / 2 - 0.03, -d / 2 + 0.01, M.grey))
    for s in (-1, 1):
        parts.append(box(f'jb{s}', (s * 0.163, -d / 2 - 0.01, 0.16), (0.085, 0.04, 0.32), M.grey))
    # stepped gable: flat steps with snow on each tread, in front of a snowy pitched roof
    steps = [(w / 2, z2), (0.335, z2 + 0.2), (0.215, z2 + 0.4), (0.1, z2 + 0.6)]
    yf0, yf1 = -d / 2 - 0.01, -d / 2 + 0.13
    for k, (hw, z) in enumerate(steps):
        h = 0.2 if k < len(steps) - 1 else 0.17
        parts.append(box(f'st{k}', (0, (yf0 + yf1) / 2, z + h / 2), (hw * 2, yf1 - yf0, h), M.plaster))
        if k:
            for s in (-1, 1):
                big.append(box(f'cq{k}{s}', (s * (hw + 0.018), (yf0 + yf1) / 2 - 0.005, z + 0.015), (0.1, yf1 - yf0 + 0.03, 0.05), M.grey))
                parts.append(pillow(f'sc{k}{s}', (s * (hw + 0.022), (yf0 + yf1) / 2 - 0.005), 0.07, 0.095, z + 0.04, 0.05, M.snow, rng, seg=6))
    big.append(box('tp', (0, (yf0 + yf1) / 2 - 0.005, steps[-1][1] + 0.19), (0.26, yf1 - yf0 + 0.04, 0.05), M.grey))
    parts.append(pillow('tps', (0, (yf0 + yf1) / 2 - 0.005), 0.15, 0.1, steps[-1][1] + 0.215, 0.07, M.snow, rng, seg=10))
    for s in (-1, 1):
        parts.append(pillow(f'sq{s}', (s * (w / 2 + 0.005), (yf0 + yf1) / 2 - 0.005), 0.06, 0.09, z2 + 0.005, 0.05, M.snow, rng, seg=8))
    # small arched slit in the top of the gable
    parts.append(face_arch('s', -d / 2 - 0.01, 0, z2 + 0.28, 0.07, 0.2, 0.012, M.dark, 'gs'))
    gable(parts, M, w - 0.02, d - 0.12, z2 + 0.0, 0.54, M.slate, rng, axis='y', wall=M.plaster, th=0.08)
    drift(parts, M, 'f', (-0.45, -0.46), (-0.2, -0.46), rng, n=3)
    drift(parts, M, 'g', (0.2, -0.46), (0.45, -0.46), rng, n=3)
    drift(parts, M, 'h', (0.46, -0.42), (0.46, 0.2), rng, n=4)
    parts.insert(0, rounded(join(big, 'mas'), 0.01, segments=1))
    done(join(parts, 'city_house_b'), 'city_house_b', size=512)


def house_c():
    """Shingled upper floors overhanging a stone base, ridge east-west so the big snowy slope faces the camera, chimney."""
    reset()
    M = W()
    rng = random.Random(213)
    w, d = 0.8, 0.8
    base, upper = 0.62, 0.72
    z1, z2 = base + 0.08, base + 0.08 + upper
    big = [box('base', (0, 0, base / 2), (w, d, base), M.stone, skip=('-z',))]
    parts = [
        box('band', (0, 0, base + 0.04), (w + 0.1, d + 0.1, 0.08), M.frame),
        box('up', (0, 0, (z1 + z2) / 2), (w + 0.08, d + 0.08, upper), M.shingle),
        box('band2', (0, 0, z2 + 0.015), (w + 0.13, d + 0.13, 0.04), M.frame),
    ]
    sy = -d / 2 - 0.04
    # brackets under the overhang
    for u in (-0.36, 0.0, 0.36):
        parts.append(beam(f'br{u}', (u, -d / 2, base - 0.1), (u, sy - 0.02, base + 0.02), 0.035, M.frame))
    lit_window(parts, M, 's', sy, -0.15, z1 + 0.38, 0.15, 0.24, 'wa')
    lit_window(parts, M, 's', sy, 0.15, z1 + 0.38, 0.15, 0.24, 'wb')
    parts.append(face_box('s', sy, 0, z1 + 0.22, 0.56, 0.035, 0.03, M.frame, 'sl'))
    parts.append(face_box('s', sy, 0, z1 + 0.54, 0.56, 0.03, 0.03, M.frame, 'll'))
    for u in (-0.15, 0.15):
        parts.append(pillow(f'ws{u}', (u, sy - 0.018), 0.1, 0.022, z1 + 0.552, 0.022, M.snow, rng, seg=8))
    # half timbered west end with a cross, as on the sheet
    wx = w / 2 + 0.04
    parts.append(face_box('e', wx, 0, (z1 + z2) / 2, 0.74, upper - 0.08, 0.01, M.plaster, 'wp'))
    for sgn in (-1, 1):
        parts.append(beam(f'wx{sgn}', (wx + 0.016, -0.34 * sgn, z1 + 0.05), (wx + 0.016, 0.34 * sgn, z2 - 0.05), 0.045, M.frame))
    for u in (-0.38, 0.38):
        parts.append(face_box('e', wx, u, (z1 + z2) / 2, 0.05, upper, 0.02, M.frame, f'wc{u}'))
    door(parts, M, 's', -d / 2, 0.14, 0.2, 0.44, 'do')
    lit_window(parts, M, 's', -d / 2, -0.2, 0.3, 0.16, 0.2, 'wl', arch=True)
    gable(parts, M, w + 0.08, d + 0.08, z2 + 0.03, 0.56, M.frame, rng, axis='y', ov=0.09, th=0.1, wall=M.shingle)
    chimney(parts, big, M, 0.26, 0.2, z2 + 0.2, z2 + 0.76, 0.17, rng)
    for sg in (-1, 1):
        parts.append(beam(f'bg{sg}', (sg * (w / 2 + 0.13), -d / 2 - 0.135, z2 - 0.03), (0, -d / 2 - 0.135, z2 + 0.6), 0.05, M.frame))
    drift(parts, M, 'f', (-0.45, -0.45), (-0.02, -0.45), rng, n=4)
    drift(parts, M, 'g', (0.3, -0.45), (0.45, -0.45), rng, n=2)
    drift(parts, M, 'h', (0.45, -0.42), (0.45, 0.2), rng, n=4)
    parts.insert(0, rounded(join(big, 'mas'), 0.012, segments=1))
    done(join(parts, 'city_house_c'), 'city_house_c', size=512)


def city_arch():
    """Alley arch: two narrow gabled house ends joined by a wall with a round arch; the passage stays open. Short in y, so the roofs read as roofs from the board camera."""
    reset()
    M = W()
    rng = random.Random(214)
    half, spring, rise = 0.18, 0.52, 0.25
    wedge = box_mat('w_wedge', 'winter_stone.png', 2.6, (1.36, 1.24, 1.08))
    roofm = box_mat('w_roof', 'winter_slate.png', 2.4, (1.28, 1.16, 1.06))
    roof_snow = box_mat('snow_roof', 'winter_snow.png', 1.3, (1.0, 1.0, 1.02), shade=(0.8, 1.06))
    hw = 0.5
    n = 8
    d0, d1 = -0.16, 0.16
    # wall with the hole, stone all the way up to its snow
    parts = holed_wall('wall', -hw + 0.1, hw - 0.1, half, spring, rise, lambda x: 0.94, d0, d1, M.stone, n=n)
    big = []
    for i in range(n):
        a0, a1 = math.pi * (i + 0.04) / n, math.pi * (i + 0.96) / n
        out = 0.085
        q = [(-half * math.cos(a0), spring + rise * math.sin(a0)), (-half * math.cos(a1), spring + rise * math.sin(a1)),
             (-(half + out) * math.cos(a1), spring + (rise + out) * math.sin(a1)), (-(half + out) * math.cos(a0), spring + (rise + out) * math.sin(a0))]
        big.append(extrude_y(f'v{i}', q, d0 - 0.035, d1 + 0.035, wedge))
    # house ends: lower wall stone, upper plaster, gable towards the south
    dh = 0.16
    for s in (-1, 1):
        x = s * 0.335
        wd = 0.3
        eave, ridge = 1.12, 1.34
        rw, ro = 0.195, 0.02
        parts.append(box(f'pl{s}', (x, 0, (0.62 + eave) / 2), (wd, dh * 2, eave - 0.62), M.plaster))
        big.append(box(f'pb{s}', (x, 0, 0.31), (wd + 0.02, dh * 2 + 0.02, 0.62), M.stone, skip=('-z',)))
        parts.append(face_arch('s', -dh, x, 0.78, 0.075, 0.18, 0.012, M.dark, f'sl{s}'))
        parts.append(face_box('s', -dh, x, 0.635, wd + 0.03, 0.035, 0.02, M.frame, f'bd{s}'))
        tri = [(x - wd / 2, eave - 0.005), (x + wd / 2, eave - 0.005), (x, ridge - 0.03)]
        parts.append(loft(f'tw{s}', [[(u, -dh, z) for u, z in tri], [(u, dh, z) for u, z in tri]], M.plaster))
        ey = dh + ro + 0.03
        prof = [(x - rw, eave - 0.02), (x, ridge), (x + rw, eave - 0.02), (x + rw, eave - 0.06), (x, ridge - 0.04), (x - rw, eave - 0.06)]
        parts.append(loft(f'rf{s}', [[(u, -ey, z) for u, z in prof], [(u, ey, z) for u, z in prof]], roofm))
        # thick snow on the upper two thirds of the slopes; slate shows along the eaves and the verge
        cover = 0.84
        cx, cz = rw * cover, (ridge - eave + 0.02) * cover
        snow = [(x - cx, ridge - cz - 0.005), (x - cx - 0.012, ridge - cz + 0.03), (x, ridge + 0.055), (x + cx + 0.012, ridge - cz + 0.03), (x + cx, ridge - cz - 0.005), (x, ridge - 0.012)]
        rings = []
        for k in range(5):
            y = (-ey - 0.008) + (2 * ey + 0.016) * k / 4
            j = rng.uniform(-0.012, 0.022)
            ww = rng.uniform(-0.016, 0.016)
            rings.append([(u + (ww if i in (0, 1, 4) else -ww if i == 3 else 0), y, z + (j if i in (1, 2, 3) else 0)) for i, (u, z) in enumerate(snow)])
        parts.append(loft(f'rs{s}', rings, roof_snow))
        for k, y in enumerate((-0.14, 0.07)):
            parts.append(drip(f'rd{s}{k}', x - s * 0.13, y * 0.8, ridge - cz + 0.01, 0.024, rng.uniform(0.05, 0.09), M.snow))
        parts.append(drip(f'rf{s}x', x + 0.07, -ey - 0.005, ridge - 0.06, 0.02, 0.07, M.snow))
        parts.append(drip(f'rf{s}y', x - 0.07, -ey - 0.005, ridge - 0.06, 0.02, 0.06, M.snow))
    # snow on the wall between the houses
    parts.append(pillow('top', (0, 0), 0.2, 0.17, 0.94, 0.05, roof_snow, rng, seg=14))
    eave_drips(parts, M, 'td', [(-0.1, -0.17, 0.96), (0.0, -0.18, 0.96), (0.1, -0.17, 0.96)], rng)
    drift(parts, M, 'f', (-0.48, -0.2), (-0.22, -0.2), rng, n=3)
    drift(parts, M, 'g', (0.22, -0.2), (0.48, -0.2), rng, n=3)
    parts.insert(0, rounded(join(big, 'mas'), 0.008, segments=1))
    done(join(parts, 'city_arch_a'), 'city_arch_a', size=512)


def street_lantern():
    """Iron post on a stepped stone foot at the north-west of the tile, scrolled arm, big lantern over the tile edge; the centre stays free."""
    reset()
    M = W()
    rng = random.Random(215)
    ox, oy = -0.24, 0.24
    h = 1.3
    foot = [
        box('foot', (ox, oy, 0.08), (0.34, 0.34, 0.16), M.stone, skip=('-z',)),
        box('foot2', (ox, oy, 0.2), (0.24, 0.24, 0.09), M.stone),
    ]
    parts = [
        rounded(join(foot, 'foot'), 0.016, segments=1),
        loft('post', [circle((ox, oy), 0.075, 0.24, 8), circle((ox, oy), 0.05, 0.36, 8), circle((ox, oy), 0.04, h, 8)], M.iron),
        loft('coll', [circle((ox, oy), 0.07, 0.62, 8), circle((ox, oy), 0.07, 0.68, 8)], M.iron),
        loft('coll2', [circle((ox, oy), 0.065, h - 0.2, 8), circle((ox, oy), 0.065, h - 0.15, 8)], M.iron),
        ball('kn', (ox, oy, h + 0.05), 0.068, M.iron),
    ]

    def spiral(prefix, cx, cz, r0, r1, a0, a1, n, w):
        pts = []
        for i in range(n + 1):
            t = i / n
            a = a0 + (a1 - a0) * t
            rr = r0 + (r1 - r0) * t
            pts.append((cx + math.cos(a) * rr, oy, cz + math.sin(a) * rr))
        for i in range(n):
            parts.append(beam(f'{prefix}{i}', pts[i], pts[i + 1], w, M.iron))
    # upper scroll: from the post up, over to the east, down into a curl
    az = h - 0.14
    spiral('a', ox + 0.26, az - 0.02, 0.26, 0.2, math.pi * 0.95, 0.05, 6, 0.032)
    spiral('c', ox + 0.32, az - 0.02, 0.14, 0.03, 0.05, -math.pi * 1.3, 5, 0.024)
    # lower scroll inside the arm
    spiral('b', ox + 0.12, az - 0.04, 0.09, 0.025, math.pi, -math.pi * 0.8, 5, 0.022)
    lx, lz = ox + 0.46, az - 0.02
    parts.append(beam('hang', (lx, oy, az + 0.03), (lx, oy, lz - 0.08), 0.022, M.iron))
    # lantern: tapered six-sided glass, roof, foot
    parts.append(loft('glass', [circle((lx, oy), 0.085, lz - 0.42, 6), circle((lx, oy), 0.125, lz - 0.14, 6)], M.glow))
    parts.append(loft('rf', [circle((lx, oy), 0.15, lz - 0.145, 6), circle((lx, oy), 0.04, lz - 0.05, 6)], M.iron))
    parts.append(loft('bs', [circle((lx, oy), 0.1, lz - 0.425, 6), circle((lx, oy), 0.05, lz - 0.47, 6), [(lx, oy, lz - 0.52)]], M.iron, cap=False))
    for k in range(6):
        a = 2 * math.pi * k / 6
        parts.append(beam(f'r{k}', (lx + math.cos(a) * 0.088, oy + math.sin(a) * 0.088, lz - 0.42), (lx + math.cos(a) * 0.13, oy + math.sin(a) * 0.13, lz - 0.14), 0.015, M.iron))
    parts.append(pillow('ls', (lx, oy), 0.115, 0.115, lz - 0.09, 0.05, M.snow, rng, seg=8))
    parts.append(pillow('ks', (ox, oy), 0.062, 0.062, h + 0.095, 0.04, M.snow, rng, seg=7))
    parts.append(pillow('as', (ox + 0.28, oy), 0.1, 0.03, az + 0.17, 0.022, M.snow, rng, seg=7))
    parts.append(pillow('fs', (ox, oy), 0.13, 0.13, 0.245, 0.04, M.snow, rng, seg=9))
    foot_ring(parts, M, 'f', [(ox - 0.18, oy - 0.2), (ox + 0.2, oy - 0.2)], rng, r=(0.08, 0.1), h=(0.04, 0.06))
    done(join(parts, 'street_lantern_a'), 'street_lantern_a', size=256)


def palace_column():
    """Pale stone column, stepped base, carved capital with scrolls, block on top."""
    reset()
    M = W()
    rng = random.Random(216)
    big = [
        box('b0', (0, 0, 0.06), (0.7, 0.7, 0.12), M.lime, skip=('-z',)),
        box('b1', (0, 0, 0.17), (0.56, 0.56, 0.11), M.lime),
    ]
    h0, h1 = 0.3, 1.32
    parts = [
        loft('tor', [circle((0, 0), 0.215, 0.22, 12), circle((0, 0), 0.24, 0.26, 12), circle((0, 0), 0.215, 0.31, 12), circle((0, 0), 0.19, 0.35, 12)], M.marble),
        loft('shaft', [circle((0, 0), 0.185, h0, 12), circle((0, 0), 0.19, 0.7, 12), circle((0, 0), 0.165, h1, 12)], M.marble),
        loft('nk', [circle((0, 0), 0.165, h1, 12), circle((0, 0), 0.195, h1 + 0.03, 12), circle((0, 0), 0.195, h1 + 0.055, 12)], M.marble),
        loft('bell', [circle((0, 0), 0.17, h1 + 0.05, 8, 0.39), circle((0, 0), 0.25, h1 + 0.2, 8, 0.39)], M.marble),
    ]
    tp = h1 + 0.2
    big.append(box('ab', (0, 0, tp + 0.05), (0.54, 0.54, 0.1), M.marble))
    # scrolls on the corners and leaves in the middle of each side
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(ball(f'vo{sx}{sy}', (sx * 0.2, sy * 0.2, tp - 0.05), 0.08, M.marble, squash=(1, 1, 0.9)))
    for i, (x, y) in enumerate(((0, -0.2), (-0.2, 0), (0.2, 0))):
        a = math.atan2(y, x)
        parts.append(ball(f'lf{i}', (x * 0.9, y * 0.9, h1 + 0.125), 0.08, M.marble, squash=(0.8 if y else 0.5, 0.5 if y else 0.8, 1.3)))
        parts.append(ball(f'lg{i}', (x * 0.65 + 0.065 * math.sin(a), y * 0.65 - 0.065 * math.cos(a), h1 + 0.1), 0.055, M.marble, squash=(0.8, 0.8, 1.3)))
    parts.append(pillow('cap', (0.01, 0.03), 0.24, 0.2, tp + 0.1, 0.035, M.snow, rng, seg=12))
    eave_drips(parts, M, 'cd', [(-0.16, -0.178, tp + 0.11), (0.03, -0.178, tp + 0.11), (0.19, -0.17, tp + 0.11)], rng, ln=(0.025, 0.05))
    parts.append(pillow('b1s', (-0.13, -0.16), 0.13, 0.11, 0.225, 0.035, M.snow, rng, seg=8))
    parts.append(pillow('b0s', (0.16, -0.29), 0.14, 0.05, 0.12, 0.03, M.snow, rng, seg=8))
    parts.append(pillow('b0t', (-0.29, 0.1), 0.05, 0.15, 0.12, 0.03, M.snow, rng, seg=8))
    foot_ring(parts, M, 'f', [(-0.28, -0.38), (0.29, -0.38)], rng, r=(0.05, 0.07), h=(0.03, 0.05))
    parts.insert(0, rounded(join(big, 'mas'), 0.012, segments=1))
    done(join(parts, 'palace_column_a'), 'palace_column_a', size=512, smooth=('snow', 'w_marble'))


def palace_window():
    """Wall section with a tall pointed window of stained glass; amber, violet and teal, no team colour."""
    reset()
    M = W()
    rng = random.Random(217)
    d = 0.3
    y0, y1 = -d / 2, d / 2
    hw, z0, spring, peak = 0.235, 0.27, 1.0, 1.36
    # opening outline as a pointed arch with an arc on each side
    n = 5
    def arch_pts(w, zs, zp):
        left, right = [], []
        for i in range(1, n):
            t = i / n
            a = t * math.pi / 2
            right.append((w * (math.cos(a) ** 0.8), zs + (zp - zs) * math.sin(a) ** 1.0))
        return right, [(-x, z) for x, z in reversed(right)]
    r, l = arch_pts(hw, spring, peak)
    glass = [(-hw, z0), (hw, z0), (hw, spring)] + r + [(0, peak)] + l + [(-hw, spring)]
    gm = plane_mat('w_glass', 'winter_glass.png', -hw, hw, z0, peak)
    # the mat name keeps the picture flat (no facet light)
    parts = [loft('glass', [[(x, y0 + 0.11, z) for x, z in glass], [(x, y0 + 0.13, z) for x, z in glass]], gm)]
    # surround: thick pointed wall, recess in front of the glass by building it from pieces around the opening
    ow = 0.46
    r2, l2 = arch_pts(ow, spring - 0.02, peak + 0.2)
    outline = [(-ow, 0.1), (ow, 0.1), (ow, spring - 0.02)] + r2 + [(0, peak + 0.2)] + l2 + [(-ow, spring - 0.02)]
    parts.append(extrude_y('back', outline, y0 + 0.13, y1, M.lime))
    big = [
        box('sk', (0, 0, 0.1), (1.0, 0.56, 0.2), M.lime, skip=('-z',)),
        box('sill', (0, y0 - 0.03, 0.235), (0.74, 0.18, 0.07), M.lime),
    ]
    # wedge stones of the frame on the south face
    arc = [(hw, spring)] + r + [(0, peak)]
    arc2 = [(hw + 0.14, spring)] + [(x * (hw + 0.14) / hw, spring + (z - spring) * (peak + 0.15 - spring) / (peak - spring)) for x, z in r] + [(0, peak + 0.15)]
    for s in (-1, 1):
        for i in range(len(arc) - 1):
            q = [(s * arc[i][0], arc[i][1]), (s * arc[i + 1][0], arc[i + 1][1]), (s * arc2[i + 1][0], arc2[i + 1][1]), (s * arc2[i][0], arc2[i][1])]
            big.append(extrude_y(f'vs{s}{i}', q, y0 - 0.045, y0 + 0.14, M.lime))
    # jambs and small columns
    for s in (-1, 1):
        big.append(box(f'jb{s}', (s * (hw + 0.07), (y0 + 0.05), (spring + z0) / 2), (0.14, 0.18, spring - z0), M.lime))
        x = s * (hw + 0.1)
        parts.append(loft(f'co{s}', [circle((x, y0 - 0.075), 0.05, 0.28, 8), circle((x, y0 - 0.075), 0.05, 0.86, 8)], M.lime))
        big.append(box(f'cb{s}', (x, y0 - 0.075, 0.29), (0.15, 0.13, 0.05), M.lime))
        big.append(box(f'cc{s}', (x, y0 - 0.075, 0.905), (0.16, 0.14, 0.09), M.lime))
        big.append(box(f'cd{s}', (x, y0 - 0.075, 0.975), (0.19, 0.16, 0.05), M.lime))
        parts.append(pillow(f'cs{s}', (x, y0 - 0.08), 0.1, 0.09, 1.0, 0.04, M.snow, rng, seg=8))
    # leading on the rim of the glass
    for i in range(len(glass)):
        p, q = glass[i], glass[(i + 1) % len(glass)]
        parts.append(beam(f'ld{i}', (p[0], y0 + 0.105, p[1]), (q[0], y0 + 0.105, q[1]), 0.024, M.frame))
    # snow on the crown of the arch only: the wedge stones stay visible
    for i, (x, z) in enumerate(arc2[2:]):
        for sg in ((-1, 1) if x > 0.01 else (1,)):
            parts.append(pillow(f'as{i}{sg}', (sg * x, -0.02), 0.14, 0.21, z - 0.012, 0.05, M.snow, rng, seg=8))
    eave_drips(parts, M, 'ad', [(-0.16, y0 - 0.05, peak + 0.06), (0.12, y0 - 0.05, peak + 0.06), (0.25, y0 - 0.05, peak - 0.1), (-0.27, y0 - 0.05, peak - 0.12)], rng)
    parts.append(pillow('ss', (-0.2, y0 - 0.04), 0.17, 0.08, 0.27, 0.03, M.snow, rng, seg=8))
    parts.append(pillow('st', (0.25, y0 - 0.04), 0.12, 0.07, 0.27, 0.03, M.snow, rng, seg=8))
    parts.append(pillow('sk1', (-0.32, y0 - 0.12), 0.13, 0.11, 0.2, 0.03, M.snow, rng, seg=8))
    parts.append(pillow('sk2', (0.35, y0 - 0.1), 0.12, 0.1, 0.2, 0.03, M.snow, rng, seg=8))
    foot_ring(parts, M, 'f', [(-0.42, -0.31), (0.1, -0.33), (0.43, -0.31)], rng, r=(0.06, 0.09), h=(0.04, 0.06))
    parts.insert(0, rounded(join(big, 'mas'), 0.008, segments=1))
    done(join(parts, 'palace_window_a'), 'palace_window_a', size=512)


# ---------------------------------------------------------------- canal

def water_strip(name, x0, x1, y0, y1, z, M):
    return box(name, ((x0 + x1) / 2, (y0 + y1) / 2, z / 2), (x1 - x0, y1 - y0, z), M.water, skip=('-z',))


def canal_wall():
    """Straight quay along x, tile edge to tile edge, water strip on the south, big iron ring."""
    reset()
    M = W()
    rng = random.Random(221)
    stone = box_mat('w_grey2', 'winter_stone.png', 1.45, (1.2, 1.1, 0.94), zfade=(0.03, 0.22, lin(88, 94, 58)), snow=(1.08, 0.1, 0.34))
    h = 0.74
    y0 = -0.08
    yn = 0.14
    big = [
        box('body', (0, (y0 + yn) / 2, h / 2), (1.0, yn - y0, h), stone, skip=('-z',)),
        box('coping', (0, (y0 - 0.03 + yn) / 2, h + 0.03), (1.0, yn - y0 + 0.03, 0.06), stone),
    ]
    for x in (-0.33, 0.33):
        big.append(box(f'bl{x}', (x, y0 + 0.1, h + 0.11), (0.2, 0.18, 0.11), stone))
    parts = [rounded(join(big, 'mas'), 0.012, segments=1)]
    parts.append(water_strip('wat', -0.5, 0.5, -0.5, y0 + 0.02, 0.03, M))
    # ring and plate
    parts.append(box('pl', (0, y0 - 0.008, h * 0.62), (0.09, 0.025, 0.12), M.iron))
    parts.append(torus('ring', (0, y0 - 0.03, h * 0.47), 0.095, 0.02, M.iron, seg=12, sides=4))
    done(join(parts, 'canal_wall_a'), 'canal_wall_a', size=512)


def canal_lock():
    """Two quay piers with a heavy, nearly straight mitre gate between them, water on both sides, iron wheels on the piers."""
    reset()
    M = W()
    rng = random.Random(222)
    stone = box_mat('w_grey2', 'winter_stone.png', 1.45, (1.2, 1.1, 0.94), zfade=(0.03, 0.2, lin(88, 94, 58)), snow=(1.12, 0.08, 0.3))
    water = box_mat('w_rip', 'winter_water.png', 1.0, (1.0, 1.04, 1.04), shade=(0.9, 1.04))
    h = 0.66
    big = []
    for s in (-1, 1):
        x = s * 0.385
        big.append(box(f'p{s}', (x, 0.0, h / 2), (0.23, 0.96, h), stone, skip=('-z',)))
        big.append(box(f'c{s}', (x, 0.0, h + 0.03), (0.26, 0.98, 0.06), stone))
    parts = [rounded(join(big, 'mas'), 0.012, segments=1)]
    parts.append(box('wat', (0, 0, 0.012), (1.0, 1.0, 0.024), water, skip=('-z',)))
    parts.append(box('wat2', (0, 0.26, 0.1), (0.54, 0.48, 0.2), water, skip=('-z',)))
    # gate: two oak wings, a shallow mitre towards the north; iron bands, walk on top
    for s in (-1, 1):
        x0, x1 = s * 0.275, 0.0
        y0, y1 = -0.035, 0.0
        L = math.hypot(x1 - x0, y1 - y0)
        a = math.atan2(y1 - y0, x1 - x0)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        parts.append(box(f'w{s}', (cx, cy, 0.31), (L, 0.07, 0.58), M.oak, rot=(0, 0, a)))
        for k, z in enumerate((0.13, 0.31, 0.49)):
            parts.append(box(f'st{s}{k}', (cx, cy - 0.038, z), (L * 0.98, 0.012, 0.045), M.iron, rot=(0, 0, a)))
        parts.append(box(f'tb{s}', (cx, cy, 0.625), (L + 0.01, 0.1, 0.05), M.frame, rot=(0, 0, a)))
        parts.append(box(f'hg{s}', (s * 0.26, -0.05, 0.31), (0.04, 0.03, 0.6), M.iron))
    parts.append(box('mt', (0, -0.004, 0.31), (0.04, 0.09, 0.62), M.frame))
    # wheels on posts
    for s in (-1, 1):
        x = s * 0.385
        parts.append(box(f'bs{s}', (x, 0.0, h + 0.075), (0.13, 0.13, 0.03), M.iron))
        parts.append(loft(f'ps{s}', [circle((x, 0.0), 0.04, h + 0.09, 8), circle((x, 0.0), 0.03, h + 0.24, 8)], M.iron))
        wz = h + 0.27
        parts.append(torus(f'wh{s}', (x, 0.0, wz), 0.105, 0.018, M.iron, seg=14, sides=4, tilt=math.radians(-55)))
        ct, st = math.cos(math.radians(-55)), math.sin(math.radians(-55))
        for k in range(3):
            a = math.pi * k / 3
            u, v = math.cos(a) * 0.105, math.sin(a) * 0.105
            parts.append(beam(f'sp{s}{k}', (x - u, st * v, wz - ct * v), (x + u, -st * v, wz + ct * v), 0.016, M.iron))
        parts.append(ball(f'hb{s}', (x, 0.0, wz), 0.03, M.iron))
        parts.append(pillow(f'st{s}a', (x + s * 0.02, -0.33), 0.1, 0.1, h + 0.06, 0.035, M.snow, rng, seg=10, jit=0.25))
        parts.append(pillow(f'st{s}b', (x - s * 0.02, 0.34), 0.09, 0.1, h + 0.06, 0.035, M.snow, rng, seg=10, jit=0.25))
        eave_drips(parts, M, f'dr{s}', [(x - 0.06, -0.45, h + 0.07), (x + 0.05, -0.45, h + 0.07)], rng, ln=(0.04, 0.08))
    done(join(parts, 'canal_lock_a'), 'canal_lock_a', size=512)


def canal_bridge():
    """Humped stone bridge along x, about 1.6 x 1 tiles: paved deck between snowy parapets, wedge-stone arch on the south."""
    reset()
    M = W()
    rng = random.Random(223)
    stone = box_mat('w_grey2', 'winter_stone.png', 1.8, (1.2, 1.1, 0.94))
    pave = box_mat('w_pave', 'winter_stone.png', 1.5, (1.34, 1.24, 1.1))
    wedge = box_mat('w_wedge', 'winter_stone.png', 3.0, (1.42, 1.3, 1.14))
    L, Y, crown = 0.8, 0.44, 0.48
    half, rise = 0.36, 0.3
    n = 10

    def deck_z(x):
        return 0.08 + (crown - 0.08) * (1 - (abs(x) / L) ** 2.2)
    xs = [-L + 2 * L * i / n for i in range(n + 1)]
    parts = holed_wall('body', -L, L, half, 0.0, rise, deck_z, -Y, Y, stone)
    deck = [(x, deck_z(x) + 0.012) for x in xs] + [(x, deck_z(x) - 0.03) for x in reversed(xs)]
    parts.append(extrude_y('deck', deck, -Y + 0.03, Y - 0.03, pave))
    big = []
    for i in range(8):
        a0, a1 = math.pi * (i + 0.06) / 8, math.pi * (i + 0.94) / 8
        out = 0.1
        q = [(-half * math.cos(a0), rise * math.sin(a0)), (-half * math.cos(a1), rise * math.sin(a1)),
             (-(half + out) * math.cos(a1), (rise + out) * math.sin(a1)), (-(half + out) * math.cos(a0), (rise + out) * math.sin(a0))]
        big.append(extrude_y(f'v{i}', q, -Y - 0.025, -Y + 0.03, wedge))
    for s in (-1, 1):
        y = s * (Y - 0.04)
        top = [(x, deck_z(x) + 0.13) for x in xs]
        low = [(x, deck_z(x) - 0.01) for x in reversed(xs)]
        big.append(extrude_y(f'par{s}', top + low, y - 0.05, y + 0.05, wedge))
        # broken snow along the parapet
        for k in range(1, n, 1):
            x = xs[k] + rng.uniform(-0.03, 0.03)
            if k % 2 == s % 2 or k in (4, 5, 6):
                parts.append(pillow(f'ps{s}{k}', (x, y), rng.uniform(0.11, 0.15), 0.058, deck_z(x) + 0.125, 0.03, M.snow, rng, seg=7))
        for ex in (-1, 1):
            x = ex * (L - 0.03)
            big.append(box(f'end{s}{ex}', (x, y, 0.17), (0.15, 0.15, 0.34), stone, skip=('-z',)))
            parts.append(pillow(f'es{s}{ex}', (x, y), 0.085, 0.085, 0.34, 0.05, M.snow, rng, seg=8))
    eave_drips(parts, M, 'pd', [(x, -Y - 0.012, deck_z(x) + 0.14) for x in (-0.45, -0.2, 0.07, 0.3, 0.5)], rng)
    foot_ring(parts, M, 'f', [(-0.7, -0.46), (0.7, -0.46)], rng, r=(0.06, 0.08), h=(0.03, 0.05))
    parts.insert(0, rounded(join(big, 'mas'), 0.008, segments=1))
    done(join(parts, 'canal_bridge_a'), 'canal_bridge_a', size=512)


# ---------------------------------------------------------------- ice

def jag_ring(c, r, n, rng, z, jit=0.1, off=0.0):
    pts = []
    for i in range(n):
        a = off + 2 * math.pi * (i + rng.uniform(-0.2, 0.2)) / n
        rr = r * (1 + rng.uniform(-jit, jit))
        pts.append((c[0] + math.cos(a) * rr, c[1] + math.sin(a) * rr, z))
    return pts


def ice_floe():
    """Flat floe with a thick cut edge; soft snow on the back, the middle stays free."""
    reset()
    M = W()
    rng = random.Random(231)
    n = 12
    k = [rng.uniform(0.84, 1.1) for _ in range(n)]
    def ring(r, z):
        return [(math.cos(2 * math.pi * i / n) * r * k[i], math.sin(2 * math.pi * i / n) * r * k[i] * 0.92, z) for i in range(n)]
    ice = box_mat('w_ice2', 'winter_ice.png', 1.1, (0.92, 0.98, 1.0), zfade=(-0.05, 0.13, lin(112, 186, 200)), snow=(1.03, 0.04, 0.16), shade=(0.56, 1.14))
    parts = [loft('floe', [ring(0.45, -0.01), ring(0.47, 0.15), ring(0.45, 0.165)], ice)]
    spots = ((0.04, 0.33, 0.2, 0.09), (-0.17, 0.27, 0.13, 0.08), (0.2, 0.27, 0.13, 0.09), (0.33, 0.15, 0.1, 0.1), (0.36, -0.01, 0.07, 0.08), (-0.33, 0.08, 0.06, 0.05))
    for i, (x, y, sx, sy) in enumerate(spots):
        parts.append(pillow(f's{i}', (x, y), sx, sy, 0.165, 0.025 + sx * 0.2, M.snow, rng, seg=10))
    done(join(parts, 'ice_floe_a'), 'ice_floe_a', size=256)


def ice_crack():
    """Lake ice broken around one spot: wedge plates with dark gaps, shards tilted up."""
    reset()
    M = W()
    rng = random.Random(232)
    ice = box_mat('w_ice2', 'winter_ice.png', 1.3, (0.84, 0.98, 1.0), zfade=(-0.02, 0.14, lin(84, 160, 180)), shade=(0.56, 1.14))
    c = (0.03, -0.02)
    parts = [loft('under', [circle(c, 0.44, 0.0, 12), circle(c, 0.44, 0.02, 12)], M.deep)]
    n = 8
    angles = sorted(2 * math.pi * (i + rng.uniform(-0.22, 0.22)) / n for i in range(n))
    mid = [0.2 + rng.uniform(-0.03, 0.05) for _ in range(n)]
    def plate(name, poly, z):
        cx = sum(p[0] for p in poly) / len(poly)
        cy = sum(p[1] for p in poly) / len(poly)
        shr = [(cx + (x - cx) * 0.9, cy + (y - cy) * 0.9) for x, y in poly]
        tx, ty = rng.uniform(-0.09, 0.09), rng.uniform(-0.09, 0.09)
        top = [(x, y, z + (x - cx) * tx * 2 + (y - cy) * ty * 2) for x, y in shr]
        return loft(name, [[(x + (x - cx) * 0.05, y + (y - cy) * 0.05, 0.0) for x, y in shr], top], ice)
    for i in range(n):
        a0, a1 = angles[i], angles[(i + 1) % n] + (2 * math.pi if i == n - 1 else 0)
        am = (a0 + a1) / 2
        R = 0.47
        outer = [(c[0] + math.cos(a) * R * rng.uniform(0.92, 1.03), c[1] + math.sin(a) * R * rng.uniform(0.92, 1.03)) for a in (a0, am, a1)]
        ri = rng.uniform(0.05, 0.09)
        inner = [(c[0] + math.cos(a) * ri, c[1] + math.sin(a) * ri) for a in (a1, a0)]
        z = 0.13 + rng.uniform(-0.012, 0.018)
        if i % 3 != 2:
            # second crack across this wedge
            m0 = (c[0] + math.cos(a0) * mid[i], c[1] + math.sin(a0) * mid[i])
            m1 = (c[0] + math.cos(am) * (mid[i] + 0.04), c[1] + math.sin(am) * (mid[i] + 0.04))
            m2 = (c[0] + math.cos(a1) * mid[(i + 1) % n], c[1] + math.sin(a1) * mid[(i + 1) % n])
            parts.append(plate(f'o{i}', [m0, outer[0], outer[1], outer[2], m2, m1], z))
            parts.append(plate(f'i{i}', [inner[1], m0, m1, m2, inner[0]], z - 0.008))
        else:
            parts.append(plate(f'o{i}', [inner[1], outer[0], outer[1], outer[2], inner[0]], z))
    for i, (x, y, r, h) in enumerate(((-0.17, -0.2, 0.1, 0.26), (0.11, 0.13, 0.08, 0.22), (0.13, -0.14, 0.08, 0.2), (-0.09, 0.05, 0.065, 0.2))):
        a = rng.uniform(0, 6.28)
        base = [(x + math.cos(a + k * 2.09) * r, y + math.sin(a + k * 2.09) * r, 0.05) for k in range(3)]
        tip = (x + rng.uniform(-0.03, 0.03), y + rng.uniform(-0.03, 0.03), 0.05 + h)
        parts.append(loft(f'sh{i}', [base, [tip]], ice, cap=False))
    done(join(parts, 'ice_crack_a'), 'ice_crack_a', size=512)


def glacier_crack():
    """Block of glacier ice filling the tile, split by a wide jagged crevasse from south to north, snow on the lips."""
    reset()
    M = W()
    rng = random.Random(233)
    H = 0.86
    ice = box_mat('w_ice3', 'winter_ice.png', 1.0, (0.86, 0.98, 1.0), zfade=(-0.1, 0.55, lin(108, 182, 198)), shade=(0.5, 1.16))
    inner = box_mat('w_inner', 'winter_ice.png', 1.3, (0.62, 0.86, 0.98), zfade=(0.05, 0.85, lin(14, 46, 76)), shade=(0.5, 1.1))
    # crevasse: y, x of the middle, half width at the top
    lip = [(-0.5, 0.02, 0.17), (-0.32, -0.08, 0.2), (-0.14, -0.02, 0.17), (0.02, -0.14, 0.14), (0.18, 0.02, 0.16), (0.34, 0.14, 0.15), (0.5, 0.06, 0.14)]

    def poly(side, frac):
        """Outline of one half at a height; `frac` narrows the crevasse towards its floor."""
        if side < 0:
            return [(-0.5, -0.5)] + [(x - w * frac, y) for y, x, w in lip] + [(-0.5, 0.5)]
        return [(0.5, -0.5), (0.5, 0.5)] + [(x + w * frac, y) for y, x, w in reversed(lip)]
    parts = []
    for side, tag in ((-1, 'l'), (1, 'r')):
        k = len(poly(side, 1.0))
        jr = [(rng.uniform(-0.02, 0.02), rng.uniform(-0.02, 0.02)) for _ in range(k)]
        def ring(frac, z, j, inset):
            out = []
            for i, (x, y) in enumerate(poly(side, frac)):
                # the outer walls lean in a little
                nx = x - inset * (1 if x > 0.45 else -1 if x < -0.45 else 0)
                ny = y - inset * (1 if y > 0.45 else -1 if y < -0.45 else 0)
                out.append((nx + jr[i][0] * j, ny + jr[i][1] * j, z))
            return out
        ob = loft(f'b{tag}', [ring(0.12, 0.0, 0.3, 0.0), ring(0.5, H * 0.42, 1.5, 0.012), ring(0.82, H * 0.8, 1.2, 0.03), ring(1.0, H, 1.0, 0.05)], ice)
        ob.data.materials.append(inner)
        for p in ob.data.polygons:
            c = p.center
            if p.normal.z < 0.6 and p.normal.x * side < -0.15 and abs(c.x) < 0.42 and c.y > -0.49:
                p.material_index = 1
        parts.append(ob)
        # faceted ribs on the south face
        for i, x in enumerate((side * 0.42, side * 0.28)):
            parts.append(needle(f'rib{tag}{i}', (x, -0.46), rng.uniform(0.09, 0.12), H * rng.uniform(0.62, 0.8), rng, ice, sides=5))
        # snow along the lips and the outer edges
        spots = []
        for y, x, w in lip:
            spots.append((x + side * (w + 0.12), y, rng.uniform(0.13, 0.17)))
        for t in (-0.42, -0.1, 0.22, 0.42):
            spots.append((side * 0.38, t, rng.uniform(0.11, 0.15)))
        spots.append((side * 0.3, 0.42, 0.13))
        for i, (x, y, r) in enumerate(spots):
            parts.append(pillow(f's{tag}{i}', (x, y), r, r * rng.uniform(0.8, 1.05), H - 0.004, 0.042, M.snow, rng, seg=9))
    parts.append(box('floor', (0, 0.05, 0.02), (0.6, 0.86, 0.04), M.deep))
    eave_drips(parts, M, 'sd', [(-0.36, -0.47, H - 0.015), (-0.2, -0.47, H - 0.015), (0.26, -0.47, H - 0.015), (0.4, -0.47, H - 0.015)], rng, r=(0.03, 0.05), ln=(0.08, 0.16))
    done(join(parts, 'glacier_crack_a'), 'glacier_crack_a', size=512)


def needle(name, c, r, h, rng, mat, lean=(0.0, 0.0), sides=6):
    rings = []
    kk = [rng.uniform(0.82, 1.15) for _ in range(sides)]
    off = rng.uniform(0, 6.28)
    for t, s in ((0.0, 1.0), (0.26, 0.92), (0.56, 0.68), (0.8, 0.36)):
        ring = []
        for i in range(sides):
            a = off + 2 * math.pi * i / sides + t * 0.5
            rr = r * s * kk[i] * rng.uniform(0.94, 1.06)
            ring.append((c[0] + math.cos(a) * rr + lean[0] * t, c[1] + math.sin(a) * rr + lean[1] * t, h * t))
        rings.append(ring)
    rings.append([(c[0] + lean[0], c[1] + lean[1], h)])
    return loft(name, rings, mat, cap=False)


def ice_spire():
    """Tall sharp needle with a small one beside it, drifts at the foot, a little snow on the tips."""
    reset()
    M = W()
    rng = random.Random(234)
    ice = box_mat('w_ice4', 'winter_ice.png', 1.05, (0.84, 0.98, 1.0), zfade=(-0.1, 0.8, lin(104, 180, 192)), shade=(0.42, 1.22))
    parts = [
        needle('big', (-0.1, 0.05), 0.3, 1.95, rng, ice, lean=(0.08, 0.03)),
        needle('shard', (-0.27, -0.08), 0.17, 1.05, rng, ice, lean=(0.05, -0.02), sides=5),
        needle('shard2', (0.04, -0.16), 0.16, 0.86, rng, ice, lean=(0.03, 0.0), sides=5),
        needle('shard3', (-0.1, -0.22), 0.11, 0.5, rng, ice, sides=5),
        needle('small', (0.31, -0.14), 0.19, 0.85, rng, ice, sides=5),
    ]
    # snow on the tips
    parts.append(loft('tip', [circle((-0.1 + 0.08 * 0.86, 0.05 + 0.03 * 0.86), 0.075, 1.95 * 0.86, 6), [(-0.02, 0.08, 1.97)]], M.snow, cap=False))
    parts.append(loft('tip2', [circle((0.31, -0.14), 0.07, 0.85 * 0.72, 5), [(0.31, -0.14, 0.86)]], M.snow, cap=False))
    foot_ring(parts, M, 'f', [(-0.36, -0.3), (0.0, -0.36), (0.38, -0.33), (0.42, 0.02), (-0.42, 0.02), (0.15, 0.3)], rng, r=(0.1, 0.14), h=(0.06, 0.1))
    done(join(parts, 'ice_spire_a'), 'ice_spire_a', size=512)


def ice_bridge():
    """Natural arch of blue ice over a gap, along x, about 1.6 x 1 tiles, thick lumpy snow on top, icicles under it."""
    reset()
    M = W()
    rng = random.Random(235)
    ice = box_mat('w_ice5', 'winter_ice.png', 1.7, (0.96, 1.5, 1.62), shade=(0.92, 1.25))
    L, D, top, opening, hole = 0.82, 0.2, 0.8, 0.48, 0.47
    n = 10
    def arc(rx, h, i):
        a = math.pi * i / n
        return (-rx * math.cos(a), h * math.sin(a))
    def roof(x):
        return 0.2 + (top - 0.2) * max(0.0, 1 - (x / L) ** 2) ** 0.6
    rings = []
    for y, grow in ((-D, 0.015), (-D * 0.3, 0.0), (D * 0.3, 0.0), (D, 0.015)):
        ring = [(-L, y, 0.0), (-hole, y, -0.01)]
        for i in range(1, n):
            x, z = arc(hole, opening, i)
            ring.append((x + rng.uniform(-0.014, 0.014), y, z + rng.uniform(-0.014, 0.014)))
        ring += [(hole, y, -0.01), (L, y, 0.0)]
        for i in range(n, -1, -1):
            x = -L * math.cos(math.pi * i / n)
            ring.append((x, y, roof(x) - grow))
        rings.append(ring)
    parts = [loft('arch', rings, ice)]
    # deep blue shadow on the ground under the arch: the opening must read from above, and cut crystal planes on the south face
    under = paint('w_undr', [(0.0, lin(32, 74, 96)), (1.0, lin(58, 112, 132))], wn=0.1, noise=0.2, nscale=8, seed=61.0)
    parts.append(box('under', (0, 0, 0.006), (hole * 2 + 0.02, 2 * D, 0.012), under))
    # one heightfield of snow with soft lumps; its south edge wanders so the ice shows below
    lumps = [(-0.62, 0.02, 0.17), (-0.36, -0.08, 0.15), (-0.14, 0.09, 0.15), (0.08, -0.09, 0.15), (0.3, 0.09, 0.15), (0.55, -0.05, 0.16)]
    def height(x, y):
        return sum(0.11 * math.exp(-((x - lx) ** 2 + (y - ly) ** 2) / (0.5 * lr * lr)) for lx, ly, lr in lumps)
    nx, ys = 24, (-1.0, -0.82, -0.5, -0.15, 0.2, 0.55, 0.85, 1.0)
    wander = [rng.uniform(-0.035, 0.035) for _ in range(nx + 1)]
    rs = []
    for j, v in enumerate(ys):
        low, up = [], []
        for i in range(nx + 1):
            x = -L * 0.99 * math.cos(math.pi * i / nx)
            y = v * (D + 0.02) + (wander[i] if j == 0 else 0.0)
            z = roof(x)
            edge = 1 - abs(v) ** 3
            low.append((x, y, z - 0.015 - (0.02 + wander[i] * 0.5 if j == 0 else 0)))
            up.append((x, y, z - 0.012 + edge * (0.05 + height(x, y))))
        rs.append(low + list(reversed(up)))
    parts.append(loft('blanket', rs, M.snow))
    eave_drips(parts, M, 'sd', [(x, -D - 0.02, roof(x)) for x in (-0.6, -0.34, -0.1, 0.13, 0.36, 0.62)], rng, r=(0.026, 0.04), ln=(0.05, 0.11))
    # icicles under the arch on the south lip
    pale = box_mat('w_ice6', 'winter_ice.png', 2.0, (1.3, 1.7, 1.8), shade=(1.0, 1.2))
    for i, x in enumerate((-0.3, -0.17, -0.05, 0.08, 0.2, 0.31)):
        z = opening * math.sqrt(max(0.0, 1 - (x / hole) ** 2))
        parts.append(drip(f'ic{i}', x * 0.8, -D - 0.005, z * 0.98 + 0.03, 0.03, rng.uniform(0.1, 0.17), pale))
    foot_ring(parts, M, 'f', [(-0.72, -0.27), (0.72, -0.27), (-0.82, 0.08), (0.82, 0.08)], rng, r=(0.06, 0.09), h=(0.04, 0.06))
    done(join(parts, 'ice_bridge_a'), 'ice_bridge_a', size=512)


def rock_plate(name, c, rx, ry, z, rng, mat, n=6):
    """Chunky flat-topped rock: straight flanks, top ring barely pulled in."""
    off = rng.uniform(0, 6.28)
    base, top = [], []
    tx, ty = rng.uniform(-0.25, 0.25), rng.uniform(-0.25, 0.25)
    for k in range(n):
        a = off + 2 * math.pi * (k + rng.uniform(-0.18, 0.18)) / n
        rr = rng.uniform(0.86, 1.12)
        x, y = math.cos(a) * rx * rr, math.sin(a) * ry * rr
        base.append((c[0] + x, c[1] + y, 0.0))
        top.append((c[0] + x * 0.86, c[1] + y * 0.86, z + x * tx + y * ty))
    return loft(name, [base, top], mat)


def ember_rift():
    """Flat: a jagged molten crack through dark rock plates on a scorched bed, glowing without any team colour."""
    reset()
    M = W()
    rng = random.Random(241)
    rock = box_mat('w_lava2', 'winter_lava.png', 2.4, (1.12, 1.0, 0.98), zfade=(0.012, 0.05, lin(236, 104, 28)), shade=(0.5, 1.2))
    far = box_mat('w_lava5', 'winter_lava.png', 2.4, (1.06, 0.96, 0.94), shade=(0.5, 1.2))
    bed = paint('w_bed', [(0.0, lin(30, 24, 26)), (1.0, lin(66, 50, 48))], wn=0.1, noise=0.3, nscale=14, seed=31.0, bias=0.2)
    line = [(-0.47, -0.27), (-0.26, -0.2), (-0.08, -0.05), (0.1, 0.0), (0.28, 0.17), (0.47, 0.27)]
    w = [0.015, 0.04, 0.085, 0.075, 0.04, 0.012]

    def strip(name, scale, z, mat, extra=(0.0,) * 6, wob=0.0):
        a = [(x - 0.45 * (wi * scale + e) + rng.uniform(-wob, wob), y + 0.9 * (wi * scale + e) + rng.uniform(-wob, wob)) for (x, y), wi, e in zip(line, w, extra)]
        b = [(x + 0.45 * (wi * scale + e) + rng.uniform(-wob, wob), y - 0.9 * (wi * scale + e) + rng.uniform(-wob, wob)) for (x, y), wi, e in zip(line, w, extra)]
        poly = a + list(reversed(b))
        return loft(name, [[(x, y, 0.0) for x, y in poly], [(x, y, z) for x, y in poly]], mat)
    # scorched rock bed under everything, then the crack from red rim to pale core
    parts = [strip('bed', 1.0, 0.006, bed, extra=(0.03, 0.15, 0.2, 0.2, 0.15, 0.03), wob=0.018), strip('g0', 2.1, 0.011, M.ember, extra=(0.008,) * 6), strip('g1', 0.85, 0.016, M.glow)]
    k = 0
    for (x, y), wi in zip(line, w):
        for sd in (-1, 1):
            d = wi * 1.3 + 0.07
            px, py = x - 0.45 * sd * d + rng.uniform(-0.02, 0.02), y + 0.9 * sd * d
            if abs(px) < 0.47 and abs(py) < 0.46:
                parts.append(rock_plate(f'sl{k}', (px, py), rng.uniform(0.1, 0.15), rng.uniform(0.07, 0.1), rng.uniform(0.05, 0.1), rng, rock))
                k += 1
            d2 = d + 0.13
            px, py = x - 0.45 * sd * d2 + rng.uniform(-0.03, 0.03), y + 0.9 * sd * d2
            if abs(px) < 0.44 and abs(py) < 0.44 and rng.random() < 0.55:
                parts.append(rock_plate(f'so{k}', (px, py), rng.uniform(0.07, 0.11), rng.uniform(0.05, 0.08), rng.uniform(0.03, 0.06), rng, far))
                k += 1
    for i, (x, y) in enumerate(((0.4, -0.3), (-0.3, -0.44), (0.36, -0.08), (-0.42, 0.1))):
        parts.append(rock_plate(f'pb{i}', (x, y), 0.035, 0.028, 0.03, rng, far, n=5))
    done(join(parts, 'ember_rift_a'), 'ember_rift_a', size=512)


def urtempel_pillar():
    """Very old thick pillar: stepped blocks, carved spiral band and ring reliefs, broken top with snow and icicles."""
    reset()
    M = W()
    rng = random.Random(242)
    st = box_mat('w_old', 'winter_scales.png', 3.6, (1.06, 1.0, 0.92), shade=(0.6, 1.2))
    block = box_mat('w_old3', 'kit_stone.png', 1.9, (0.72, 0.66, 0.62))
    band = paint('w_old2', [(0.0, lin(74, 62, 54)), (0.6, lin(128, 110, 94)), (1.0, lin(178, 160, 138))], wn=0.95, noise=0.05, nscale=14, seed=25.0)
    big = [
        loft('b0', [circle((0, 0), 0.47, 0.0, 8, 0.39), circle((0, 0), 0.47, 0.16, 8, 0.39)], block),
        loft('b1', [circle((0, 0), 0.36, 0.16, 8, 0.39), circle((0, 0), 0.36, 0.285, 8, 0.39)], block),
    ]
    r = 0.23
    z0, z1 = 0.28, 1.3
    parts = [loft('dr', [circle((0, 0), r + 0.02, z0, 10), circle((0, 0), r, z0 + 0.1, 10), circle((0, 0), r * 0.98, z1, 10)], st)]
    # spiral band
    steps = 16
    prev = None
    for i in range(steps + 1):
        t = i / steps
        a = -math.pi * 0.8 + t * 2 * math.pi * 1.2
        z = 0.42 + t * 0.76
        p = (math.cos(a) * (r + 0.008), math.sin(a) * (r + 0.008), z)
        if prev:
            parts.append(beam(f'sp{i}', prev, p, 0.06, band))
        prev = p
    # ring reliefs on the south
    for i, (a, z) in enumerate(((-math.pi / 2 - 0.7, 0.8), (-math.pi / 2, 0.77), (-math.pi / 2 + 0.7, 0.74))):
        x, y = math.cos(a) * (r + 0.005), math.sin(a) * (r + 0.005)
        parts.append(torus(f'rl{i}', (x, y, z), 0.07, 0.02, band, seg=8, sides=3))
        parts.append(ball(f'bo{i}', (x, y, z), 0.026, band))
    # broken top: uneven blocks
    for i, (x, y, sz, zz) in enumerate(((-0.1, 0.0, 0.2, 1.38), (0.1, 0.04, 0.14, 1.34), (0.0, -0.1, 0.15, 1.34), (-0.03, 0.1, 0.26, 1.42))):
        big.append(box(f'tp{i}', (x, y, zz), (0.2, 0.2, sz), block, rot=(rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), rng.uniform(0, 0.7))))
    for i, (x, y, sx, z) in enumerate(((-0.14, -0.02, 0.12, 1.47), (0.12, 0.02, 0.11, 1.4), (-0.04, 0.14, 0.11, 1.54), (0.02, -0.15, 0.09, 1.41))):
        parts.append(pillow(f'ts{i}', (x, y), sx * 0.88, sx * 0.88, z, 0.035, M.snow, rng, seg=8))
    pale = box_mat('w_ice6', 'winter_ice.png', 2.0, (0.8, 0.96, 1.0))
    parts.append(drip('ic0', -0.22, -0.1, 1.42, 0.026, 0.36, pale))
    parts.append(drip('ic1', 0.21, -0.1, 1.33, 0.026, 0.42, pale))
    parts.append(pillow('s0', (-0.16, -0.18), 0.15, 0.12, 0.285, 0.035, M.snow, rng, seg=8))
    parts.append(pillow('s1', (0.2, -0.22), 0.1, 0.07, 0.285, 0.03, M.snow, rng, seg=7))
    parts.insert(0, rounded(join(big, 'mas'), 0.012, segments=1))
    done(join(parts, 'urtempel_pillar_a'), 'urtempel_pillar_a', size=512)


def wagon_ring():
    """Wagon-fort piece, about 1.7 x 1 tiles (two fields along x): heavy wagon with big spoked wheels to the south, pointed stakes, patched canvas, snow."""
    reset()
    M = W()
    rng = random.Random(251)
    oak = box_mat('w_oak2', 'kit_oak.png', 1.9, (0.86, 0.8, 0.74), snow=(1.0, 0.03, 0.2))
    frame = M.frame
    W0, D0 = 1.3, 0.4
    z0, z1 = 0.26, 0.56
    big = [
        box('bed', (0, 0, z0 + 0.03), (W0 + 0.06, D0 + 0.06, 0.06), frame),
        box('body', (0, 0, (z0 + z1) / 2), (W0, D0, z1 - z0), oak, skip=('-z',)),
        box('rail', (0, -D0 / 2 - 0.01, z1), (W0 + 0.06, 0.04, 0.045), frame),
        box('rail2', (0, D0 / 2 + 0.01, z1), (W0 + 0.06, 0.04, 0.045), frame),
        box('rail3', (0, -D0 / 2 - 0.016, z0 + 0.15), (W0, 0.02, 0.03), frame),
    ]
    parts = []
    for x in (-0.5, -0.17, 0.17, 0.5):
        parts.append(box(f'up{x}', (x, -D0 / 2 - 0.016, (z0 + z1) / 2), (0.035, 0.022, z1 - z0), frame))
    # wheels: rim, spokes, hub, pushed south so they stand clear of the body from above
    wheel = box_mat('w_wh', 'kit_oak.png', 2.4, (0.92, 0.8, 0.68))
    for s in (-1, 1):
        cx, cy, cz, R = s * 0.34, -0.3, 0.31, 0.3
        parts.append(torus(f'rim{s}', (cx, cy, cz), R, 0.04, wheel, seg=16, sides=4))
        parts.append(torus(f'tyre{s}', (cx, cy, cz), R + 0.03, 0.016, M.iron, seg=16, sides=4))
        for k in range(4):
            a = math.pi * k / 4 + 0.2
            u, v = math.cos(a) * R, math.sin(a) * R
            parts.append(beam(f'sp{s}{k}', (cx - u, cy, cz - v), (cx + u, cy, cz + v), 0.034, wheel))
        parts.append(cyl_axis(f'hub{s}', (cx, cy - 0.015, cz), 0.06, 0.05, wheel, seg=8))
        parts.append(cyl_axis(f'hb2{s}', (cx, cy - 0.065, cz), 0.032, 0.012, M.iron, seg=6))
    parts.append(box('axle', (0, -0.25, 0.31), (0.9, 0.05, 0.04), frame))
    # stakes with pointed tops at the ends and the back, lashed with rope
    stakes = [(-0.76, 0.1), (-0.72, -0.14), (-0.5, 0.27), (-0.18, 0.3), (0.2, 0.3), (0.74, 0.18), (0.76, -0.1)]
    for i, (x, y) in enumerate(stakes):
        h = rng.uniform(0.72, 0.96)
        r = 0.042
        parts.append(loft(f'st{i}', [circle((x, y), r, 0.0, 6), circle((x, y), r * 0.92, h - 0.13, 6), [(x, y, h)]], oak, cap=False))
        parts.append(loft(f'rp{i}', [circle((x, y), r + 0.012, 0.42, 6), circle((x, y), r + 0.012, 0.47, 6)], M.canvas))
    # canvas sheet thrown over bows, lighter and sagging between them; painted snow on what looks up
    canvas = box_mat('w_can2', 'nature_canvas.png', 1.4, (0.94, 0.8, 0.6), snow=(0.86, 0.05, 0.2))
    patchm = box_mat('w_patch', 'nature_canvas.png', 2.6, (0.84, 0.56, 0.26))
    pts = []
    for fr in range(7):
        t = fr / 6
        x = -0.52 + 1.08 * t
        sag = 0.025 * math.sin(t * math.pi * 3) ** 2
        pts.append([(x, -0.215 + 0.012 * math.sin(t * 9), 0.56), (x, 0.0, 0.8 - sag), (x, 0.14, 0.88 - sag - 0.08 * t), (x, 0.235, 0.6), (x, 0.215, 0.6), (x, 0.13, 0.84 - sag - 0.08 * t), (x, 0.0, 0.76 - sag), (x, -0.195 + 0.012 * math.sin(t * 9), 0.56)])
    parts.append(loft('tilt', pts, canvas))
    def on_sheet(y):
        return 0.56 + (y + 0.215) * (0.8 - 0.56) / 0.215 + 0.012
    parts.append(loft('pat', [[(-0.16, -0.17, on_sheet(-0.17)), (0.2, -0.17, on_sheet(-0.17)), (0.2, -0.02, on_sheet(-0.02)), (-0.16, -0.02, on_sheet(-0.02))],
                              [(-0.16, -0.17, on_sheet(-0.17) + 0.008), (0.2, -0.17, on_sheet(-0.17) + 0.008), (0.2, -0.02, on_sheet(-0.02) + 0.008), (-0.16, -0.02, on_sheet(-0.02) + 0.008)]], patchm))
    # corner of the sheet hanging on the east, bows at the ends
    parts.append(loft('hang', [[(0.56, -0.12, 0.72), (0.56, 0.13, 0.78), (0.58, 0.13, 0.78), (0.58, -0.12, 0.72)], [(0.6, 0.0, 0.42), (0.6, 0.1, 0.42), (0.62, 0.1, 0.42), (0.62, 0.0, 0.42)]], canvas))
    parts.append(beam('bow0', (-0.52, -0.2, z1), (-0.52, 0.14, 0.9), 0.028, frame))
    parts.append(beam('bow1', (0.56, -0.2, z1), (0.56, 0.14, 0.82), 0.028, frame))
    # snowy rubble round the foot
    foot_ring(parts, M, 'f', [(-0.62, -0.32), (0.66, -0.3), (-0.02, -0.34), (-0.62, 0.24), (0.62, 0.26)], rng, r=(0.05, 0.08), h=(0.03, 0.05))
    parts.insert(0, rounded(join(big, 'mas'), 0.008, segments=1))
    done(join(parts, 'wagon_ring_a'), 'wagon_ring_a', size=512)


def refugee_tent():
    """Patched canvas on crooked crossed poles, ridge running north, open to the south-east: dark inside, bedroll and kettle at the door, snow on the ridge."""
    reset()
    M = W()
    rng = random.Random(252)
    canvas = box_mat('w_can2', 'nature_canvas.png', 1.25, (0.96, 0.8, 0.58))
    flap = box_mat('w_flap', 'nature_canvas.png', 1.25, (0.86, 0.68, 0.46))
    shade = paint('w_tin', [(0.0, lin(30, 22, 18)), (1.0, lin(74, 52, 36))], wn=0.1, noise=0.2, nscale=8, seed=33.0)
    pole = box_mat('w_pole', 'kit_oak.png', 2.2, (1.0, 0.84, 0.68))
    y0, y1 = -0.24, 0.3
    zr, hw = 0.82, 0.5
    def slope(side):
        rings = []
        for i in range(9):
            t = i / 8
            y = y0 + (y1 - y0) * t
            sag = -0.05 * math.sin(math.pi * t)
            b = hw * (1.03 - 0.06 * math.sin(t * 14 + side))
            fold = 0.028 * math.sin(t * 25 + side * 1.3)
            hem = 0.018 + 0.016 * math.sin(t * 31)
            rings.append([(side * 0.0, y, zr + sag), (side * hw * 0.28, y, zr * 0.7 + sag * 1.5 + fold * 0.3), (side * hw * 0.62, y, zr * 0.32 + sag * 1.5 + fold), (side * b, y, hem)])
        return rings
    parts = [loft('sl', slope(-1), canvas), loft('sr', slope(1), canvas)]
    # north end closed, floor and inside in deep shadow so the opening reads as a hole
    tri = [(-hw + 0.03, 0.0), (hw - 0.03, 0.0), (0, zr - 0.04)]
    parts.append(loft('back', [[(x, y1 - 0.04, z) for x, z in tri], [(x, y1, z) for x, z in tri]], flap))
    parts.append(loft('in', [[(x, 0.02, z) for x, z in tri], [(x, 0.06, z) for x, z in tri]], shade))
    parts.append(box('floor', (0.0, -0.1, 0.005), (0.86, 0.3, 0.01), shade))
    # west half of the door closed with a large flap, the east half tied back
    parts.append(loft('fl', [[(-hw, y0 - 0.005, 0.0), (0.03, y0 - 0.03, 0.0), (0.0, y0 - 0.005, zr - 0.02)], [(-hw, y0 + 0.025, 0.0), (0.03, y0, 0.0), (0.0, y0 + 0.025, zr - 0.02)]], flap))
    parts.append(loft('fr', [[(hw, y0 - 0.005, 0.0), (0.4, y0 - 0.03, 0.0), (0.2, y0 - 0.01, zr * 0.56)], [(hw, y0 + 0.025, 0.0), (0.4, y0, 0.0), (0.2, y0 + 0.02, zr * 0.56)]], flap))
    # ochre patches: big one on the closed flap, a small one high on the west slope
    patch = box_mat('w_patch', 'nature_canvas.png', 2.2, (0.88, 0.62, 0.26))
    parts.append(loft('pat', [[(-0.3, y0 - 0.04, 0.14), (-0.1, y0 - 0.04, 0.17), (-0.11, y0 - 0.04, 0.4), (-0.25, y0 - 0.04, 0.37)],
                              [(-0.3, y0 - 0.02, 0.14), (-0.1, y0 - 0.02, 0.17), (-0.11, y0 - 0.02, 0.4), (-0.25, y0 - 0.02, 0.37)]], patch))
    q = [(-0.3, -0.06, 0.36), (-0.2, -0.08, 0.52), (-0.2, 0.08, 0.53), (-0.31, 0.06, 0.36)]
    parts.append(loft('psw', [q, [(x - 0.008, y, z + 0.008) for x, y, z in q]], patch))
    # thin crooked poles crossing above the ridge at both ends, stakes at the hem
    for y, tag in ((y0 - 0.02, 'f'), (y1 + 0.01, 'b')):
        for sd in (-1, 1):
            parts.append(beam(f'po{tag}{sd}b', (sd * 0.14, y, zr * 0.76), (-sd * 0.09, y, zr + 0.17), 0.04, pole))
            parts.append(beam(f'po{tag}{sd}a', (sd * (hw + 0.02), y, -0.01), (sd * 0.3, y - 0.008, zr * 0.42), 0.034, pole))
            parts.append(beam(f'po{tag}{sd}c', (sd * 0.3, y - 0.008, zr * 0.42), (sd * 0.14, y, zr * 0.76), 0.034, pole))
        parts.append(loft(f'lash{tag}', [circle((0, y), 0.05, zr - 0.05, 6), circle((0, y), 0.05, zr + 0.0, 6)], M.canvas))
    for i, (x, y) in enumerate(((-0.47, -0.36), (0.5, -0.36), (-0.52, 0.2), (0.52, 0.2))):
        parts.append(loft(f'pg{i}', [circle((x, y), 0.026, 0.0, 5), circle((x, y), 0.024, 0.12, 5), [(x, y, 0.16)]], pole, cap=False))
    # bedroll in the opening and a kettle before it
    roll = box_mat('w_roll', 'nature_canvas.png', 3.0, (0.62, 0.42, 0.3))
    parts.append(cyl_axis('roll0', (0.22, -0.2, 0.08), 0.08, 0.1, roll, seg=8, axis='x'))
    parts.append(cyl_axis('roll1', (0.22, -0.06, 0.08), 0.08, 0.1, roll, seg=8, axis='x'))
    kx, ky = 0.3, -0.4
    parts.append(ball('ket', (kx, ky, 0.08), 0.085, M.iron, squash=(1, 1, 0.92), subdiv=2))
    parts.append(loft('kr', [circle((kx, ky), 0.05, 0.145, 8), circle((kx, ky), 0.056, 0.165, 8)], M.iron))
    # snow lies along the ridge as one thin, ragged cap, with tongues down the slopes
    rings = []
    for i in range(7):
        t = i / 6
        y = y0 - 0.01 + (y1 - y0 + 0.02) * t
        z = zr - 0.05 * math.sin(math.pi * t)
        wl, wr = rng.uniform(0.08, 0.2), rng.uniform(0.08, 0.18)
        rings.append([(-wl, y, z - wl * 0.72 - 0.006), (-wl * 0.5, y, z - wl * 0.34 + 0.018), (0.0, y, z + 0.034), (wr * 0.5, y, z - wr * 0.34 + 0.018), (wr, y, z - wr * 0.72 - 0.006), (0.0, y, z - 0.02)])
    parts.append(loft('ridge', rings, box_mat('w_rsnow', 'winter_snow.png', 1.3, (1.0, 1.0, 1.02), shade=(0.84, 1.06))))
    eave_drips(parts, M, 'rd', [(-0.1, -0.1, zr - 0.1), (0.09, 0.03, zr - 0.1), (-0.09, 0.18, zr - 0.1)], rng, r=(0.024, 0.036), ln=(0.07, 0.14))
    done(join(parts, 'refugee_tent_a'), 'refugee_tent_a', size=512)


# ---------------------------------------------------------------- Glutdom

def dome():
    """Shell of the ruined dome, 2 x 2 tiles: plate shell on a drum, bronze ribs, oculus ring, broken away on the south-east with glow inside."""
    reset()
    M = W()
    rng = random.Random(261)
    R = 0.96
    drum = 0.3
    nlon, nlat = 20, 6
    lat_top = math.radians(74)
    shell = box_mat('w_lava3', 'winter_slate.png', 2.2, (0.98, 0.9, 0.96), shade=(0.5, 1.2))
    glowrock = M.ember
    dark = paint('w_lava4', [(0.0, lin(214, 112, 58)), (0.5, lin(236, 144, 72)), (1.0, lin(255, 196, 112))], z=(0.0, 1.0), wz=-0.7, wn=0.1, noise=0.2, nscale=9, seed=41.0, bias=0.7)

    def sph(lon, lat, r=R):
        return (math.cos(lon) * math.cos(lat) * r, math.sin(lon) * math.cos(lat) * r, drum + math.sin(lat) * r * 1.05)

    def broken(j, i):
        lon = 2 * math.pi * (j + 0.5) / nlon
        deg = math.degrees(lon)
        if deg > 180:
            deg -= 360
        # south-east quarter gone, more towards the east, jagged upper rim
        lim = 3.1 + 1.9 * math.cos(math.radians((deg + 30) * 1.25)) + rng.uniform(-0.7, 0.7)
        return -105 < deg < 45 and i < lim

    bm = bmesh.new()
    verts = {}
    for i in range(nlat + 1):
        lat = lat_top * i / nlat
        for j in range(nlon):
            verts[(i, j)] = bm.verts.new(sph(2 * math.pi * j / nlon, lat))
    for i in range(nlat):
        for j in range(nlon):
            if not broken(j, i):
                j2 = (j + 1) % nlon
                bm.faces.new((verts[(i, j)], verts[(i, j2)], verts[(i + 1, j2)], verts[(i + 1, j)]))
    for v in list(bm.verts):
        if not v.link_faces:
            bm.verts.remove(v)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = with_mat(mesh_object('shell', bm), shell)
    mod = ob.modifiers.new('solid', 'SOLIDIFY')
    mod.thickness = 0.12
    mod.offset = -1
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=mod.name)
    ob.data.materials.append(glowrock)
    ob.data.materials.append(dark)
    for p in ob.data.polygons:
        c = p.center
        rad = Vector((c.x, c.y, (c.z - drum) / 1.05))
        if rad.length < 1e-3:
            continue
        d = p.normal.dot(rad.normalized())
        if d < -0.5:
            p.material_index = 2
        elif d < 0.5:
            p.material_index = 1
    parts = [ob]
    big = []

    # ring at the oculus
    tz = drum + math.sin(lat_top) * R * 1.05
    tr = math.cos(lat_top) * R
    parts.append(torus('ocu', (0, 0, tz + 0.025), tr + 0.02, 0.055, M.bronze, seg=16, sides=4, axis='z'))

    # bronze ribs: rectangular bands along the meridians; those over the break stop where the shell stops
    ribs = [(math.radians(a), e) for a, e in ((180, 1.0), (135, 1.0), (90, 1.0), (225, 1.0), (262, 1.0), (300, 0.42), (45, 0.9))]
    for k, (lon, extent) in enumerate(ribs):
        ca, sa = math.cos(lon), math.sin(lon)
        rings = []
        steps = 5
        for i in range(steps + 1):
            lat = lat_top * (1 - extent + extent * i / steps) if extent < 1 and lon > math.pi else lat_top * extent * i / steps
            if lon < 1 and extent < 1:
                lat = lat_top * (1 - extent * (1 - i / steps))
            w = 0.075
            x, y, z = sph(lon, lat, R + 0.012)
            x2, y2, z2 = sph(lon, lat, R + 0.06)
            rings.append([(x - sa * w, y + ca * w, z), (x + sa * w, y - ca * w, z), (x2 + sa * w, y2 - ca * w, z2), (x2 - sa * w, y2 + ca * w, z2)])
        parts.append(loft(f'rib{k}', rings, M.bronze))
        # bosses where a rib meets the band
        bx, by, bz = sph(lon, lat_top * 0.3, R + 0.07)
        parts.append(ball(f'bo{k}', (bx, by, bz), 0.04, M.bronze, squash=(1, 1, 1)))
    # drum: a stone ring (west and north), pilasters, doorway on the south-west
    stone = box_mat('w_drum', 'winter_lime.png', 2.0, (0.7, 0.5, 0.32))
    n = 20
    keep = [j for j in range(n) if not -110 < ((360 * j / n + 180) % 360 - 180) + 9 < 38]
    for j in keep:
        a0, a1 = 2 * math.pi * j / n, 2 * math.pi * (j + 1) / n
        r0, r1 = R + 0.01, R - 0.08
        q = [(math.cos(a0) * r0, math.sin(a0) * r0), (math.cos(a1) * r0, math.sin(a1) * r0), (math.cos(a1) * r1, math.sin(a1) * r1), (math.cos(a0) * r1, math.sin(a0) * r1)]
        parts.append(loft(f'dr{j}', [[(x, y, 0.0) for x, y in q], [(x, y, drum + 0.01) for x, y in q]], stone))
    big.append(loft('pl0', [circle((0, 0), R + 0.06, drum - 0.04, 20), circle((0, 0), R + 0.03, drum + 0.03, 20), circle((0, 0), R - 0.0, drum + 0.03, 20)], M.bronze) if False else box('nil', (0, 0, -5), (0.01, 0.01, 0.01), M.bronze))
    big.pop()
    for k, deg in enumerate((180, 135, 90, 225, 45)):
        a = math.radians(deg)
        x, y = math.cos(a) * (R + 0.04), math.sin(a) * (R + 0.04)
        big.append(box(f'pi{k}', (x, y, drum * 0.5), (0.14, 0.14, drum), M.bronze, rot=(0, 0, a)))
        big.append(box(f'pc{k}', (x, y, drum + 0.015), (0.18, 0.18, 0.05), M.bronze, rot=(0, 0, a)))
    # doorway
    da = math.radians(248)
    cx, cy = math.cos(da) * (R + 0.02), math.sin(da) * (R + 0.02)
    door_parts = []
    door_parts.append(box('dpl', (0, 0, 0.26), (0.5, 0.2, 0.52), M.bronze))
    door_parts.append(box('dcap', (0, 0, 0.55), (0.56, 0.24, 0.06), M.bronze))
    door_parts.append(face_arch('s', -0.1, 0, 0.0, 0.26, 0.36, 0.012, M.dark, 'dop'))
    door_parts.append(box('dst', (0, -0.14, 0.03), (0.58, 0.14, 0.06), stone))
    dj = join(door_parts, 'door')
    rot = da + math.pi / 2
    ca, sa = math.cos(rot), math.sin(rot)
    for v in dj.data.vertices:
        x, y = v.co.x, v.co.y
        v.co.x, v.co.y = cx + ca * x - sa * y, cy + sa * x + ca * y
    dj.data.update()
    parts.append(dj)

    # chunks at the break: plates that have not fallen yet, and rubble on the floor; glow on the floor inside
    floor = paint('w_dfl', [(0.0, lin(82, 54, 48)), (1.0, lin(148, 98, 72))], wn=0.1, noise=0.3, nscale=12, seed=43.0, bias=0.2)
    parts.append(loft('fglow', [circle((0, 0), R - 0.06, 0.0, 16), circle((0, 0), R - 0.06, 0.02, 16)], floor))
    for i, q in enumerate((((0.06, -0.62), (0.2, -0.3), (0.44, -0.12), (0.5, -0.2), (0.3, -0.36), (0.16, -0.66)), ((0.34, -0.5), (0.5, -0.44), (0.74, -0.42), (0.72, -0.5), (0.5, -0.54), (0.36, -0.58)))):
        parts.append(loft(f'crk{i}', [[(x, y, 0.02) for x, y in q], [(x, y, 0.028) for x, y in q]], M.ember))
        cx, cy = sum(c[0] for c in q) / 6, sum(c[1] for c in q) / 6
        core = [(cx + (x - cx) * 0.45, cy + (y - cy) * 0.45) for x, y in q]
        parts.append(loft(f'crc{i}', [[(x, y, 0.028) for x, y in core], [(x, y, 0.034) for x, y in core]], M.glow))
    rubble = box_mat('w_lava3r', 'winter_slate.png', 2.2, (0.98, 0.9, 0.96), shade=(0.5, 1.2))
    for i in range(10):
        a = math.radians(rng.uniform(-115, 50))
        rr = rng.uniform(0.62, 0.98)
        parts.append(slab(f'rub{i}', (math.cos(a) * rr, math.sin(a) * rr), rng.uniform(0.07, 0.15), rng.uniform(0.06, 0.12), 0.0, rng.uniform(0.06, 0.2), (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3)), rng, rubble))
    for i in range(4):
        deg = rng.uniform(-110, 50)
        lat = lat_top * rng.uniform(0.45, 0.95)
        a = math.radians(deg)
        p = sph(a, lat, R - 0.01)
        parts.append(box(f'ch{i}', p, (rng.uniform(0.1, 0.17), rng.uniform(0.1, 0.17), 0.08), shell, rot=(rng.uniform(-0.5, 0.5), lat * 0.9, a)))
    if big:
        parts.insert(0, rounded(join(big, 'mas'), 0.012, segments=1))
    done(join(parts, 'dome_a'), 'dome_a', size=1024)


# ---------------------------------------------------------------- sleeping dragon

def catmull(pts, count):
    out = []
    n = len(pts) - 1
    for k in range(count):
        t = k / (count - 1) * n
        i = min(int(t), n - 1)
        f = t - i
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, n)]
        out.append(tuple(0.5 * ((2 * b) + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f ** 3) for a, b, c, d in zip(p0, p1, p2, p3)))
    return out


def tube(name, ctrl, count, sides, mat, rng=None, clip=0.0):
    """Tube through (x, y, z, radius) control points; the last rings close to a point. Vertices stay above the ground."""
    pts = catmull(ctrl, count)
    rings = []
    up = Vector((0, 0, 1))
    for i, (x, y, z, r) in enumerate(pts):
        a = Vector(pts[max(i - 1, 0)][:3])
        b = Vector(pts[min(i + 1, count - 1)][:3])
        t = (b - a).normalized()
        u = t.cross(up).normalized()
        v = u.cross(t).normalized()
        ring = []
        for k in range(sides):
            ang = 2 * math.pi * k / sides
            rr = r * (1 + (rng.uniform(-0.025, 0.025) if rng else 0))
            p = Vector((x, y, z)) + u * (math.cos(ang) * rr) + v * (math.sin(ang) * rr)
            p.z = max(p.z, clip)
            ring.append(tuple(p))
        rings.append(ring)
    return loft(name, rings, mat), pts


def blob(name, c, rx, ry, rz, mat, nlat=6, nlon=12, rng=None):
    """Ellipsoid with its bottom cut at z = 0."""
    rings = []
    for i in range(nlat):
        lat = -0.5 + (math.pi / 2 + 0.5) * i / nlat
        ring = []
        for j in range(nlon):
            a = 2 * math.pi * j / nlon
            k = 1 + (rng.uniform(-0.02, 0.02) if rng else 0)
            ring.append((c[0] + math.cos(a) * math.cos(lat) * rx * k, c[1] + math.sin(a) * math.cos(lat) * ry * k, max(0.0, c[2] + math.sin(lat) * rz * k)))
        rings.append(ring)
    rings.append([(c[0], c[1], c[2] + rz)])
    return loft(name, rings, mat, cap=False)


def sleeping_dragon():
    """Curled asleep, about 4 x 3 tiles like the sheet: head on its forepaws at the south, neck round the west, wing folded on the north-east,
    tail back to the snout. All shapes are traced on the sheet (px, py) and take their paint from it."""
    reset()
    rng = random.Random(271)
    A, B, C, D, E = 1000.0, 252.0, 745.0, 151.0, 189.0
    hide = paint('hide', [(0.0, lin(90, 70, 60)), (1.0, lin(150, 120, 100))], wn=0.5)
    # the crop of the sheet in winter_paint_sleeping_dragon_a.png: x 470..1530, y 380..970
    PAINT['sleeping_dragon_a'] = (50.0, 0.0, FULL, lambda x, y, z: ((A + B * x - 470.0) / 1060.0, 1.0 - (C - D * y - E * z - 380.0) / 590.0))

    def at(px, py, z):
        return ((px - A) / B, (C - py - E * z) / D, z)

    def ridge(px, py, r, k=0.8):
        """Tube control point from the top line of the tube on the sheet."""
        z = r * k
        x, y, z = at(px, py + E * r, z)
        return (x, y, z, r)

    def lump(name, px, top_py, rx, ry, rz):
        x, y, _ = at(px, top_py + E * rz * 0.0, rz)
        return blob(name, (x, y, 0.0), rx, ry, rz, hide, rng=rng)

    chain = [ridge(*q) for q in (
        (690, 790, 0.24), (590, 745, 0.28), (560, 680, 0.33), (570, 610, 0.36), (625, 540, 0.38), (730, 505, 0.42), (850, 485, 0.44), (960, 490, 0.46),
        (1120, 540, 0.48), (1280, 570, 0.5), (1400, 615, 0.47), (1450, 680, 0.42), (1410, 745, 0.38), (1300, 775, 0.32), (1180, 805, 0.26),
        (1090, 850, 0.17), (1040, 905, 0.09), (1016, 952, 0.02))]
    tb, spine = tube('body', chain, 50, 12, hide, rng)
    parts = [tb]
    # masses inside the coil
    parts.append(lump('m0', 1120, 570, 1.0, 0.72, 0.82))
    parts.append(lump('m1', 880, 545, 0.56, 0.5, 0.72))
    parts.append(lump('haunch', 1105, 665, 0.42, 0.42, 0.5))
    parts.append(lump('m2', 760, 620, 0.5, 0.42, 0.5))
    # foreleg under the chin, paw with big claws
    leg = [ridge(*q) for q in ((565, 835, 0.2), (620, 845, 0.2), (700, 870, 0.2), (780, 895, 0.17), (825, 915, 0.12))]
    lg, _ = tube('leg', leg, 11, 8, hide, rng)
    parts.append(lg)
    for i, (x0, y0, x1, y1) in enumerate(((785, 915, 800, 962), (825, 905, 852, 958), (858, 900, 885, 942))):
        parts.append(spike(f'cl{i}', at(x0, y0 + 10, 0.12), at(x1, y1, 0.03), 0.07, hide, sides=5))
    # hind paw beside the snout
    hp = [ridge(*q) for q in ((1085, 800, 0.15), (1030, 815, 0.13), (990, 835, 0.1))]
    t2, _ = tube('hp', hp, 6, 8, hide, rng)
    parts.append(t2)
    for i, (x0, y0, x1, y1) in enumerate(((1020, 845, 1005, 880), (1000, 835, 985, 865), (985, 820, 968, 845))):
        parts.append(spike(f'hc{i}', at(x0, y0, 0.08), at(x1, y1, 0.02), 0.05, hide, sides=4))
    # head: sections (px, py of the middle on the sheet, z of the middle, half width, half height)
    sections = [(725, 725, 0.5, 0.26, 0.2), (780, 750, 0.5, 0.36, 0.26), (850, 790, 0.45, 0.36, 0.25), (905, 825, 0.36, 0.26, 0.19), (950, 860, 0.28, 0.2, 0.16), (985, 885, 0.24, 0.17, 0.13), (1005, 905, 0.2, 0.09, 0.07)]
    c0, c1 = Vector(at(*sections[0][:3])), Vector(at(*sections[-1][:3]))
    f = (c1 - c0).normalized()
    side = f.cross(Vector((0, 0, 1))).normalized()
    up = side.cross(f).normalized()
    profile = [(1.0, 0.0), (0.82, 0.55), (0.4, 0.95), (-0.4, 0.95), (-0.82, 0.55), (-1.0, 0.0), (-0.85, -0.7), (0.85, -0.7)]
    rings = []
    for px, py, z, w, h in sections:
        c = Vector(at(px, py, z))
        rings.append([tuple(c + side * (u * w) + Vector((0, 0, 1)) * (v * h)) for u, v in profile])
    parts.append(loft('head', rings, hide))
    # lower jaw under the skull on the ground
    jaw = [(860, 850, 0.14, 0.22), (950, 900, 0.1, 0.17), (1005, 925, 0.07, 0.08)]
    rj = []
    for px, py, z, w in jaw:
        c = Vector(at(px, py, z))
        rj.append([tuple(c + side * (u * w) + Vector((0, 0, 1)) * (v * 0.11)) for u, v in profile])
    parts.append(loft('jaw', rj, hide))
    # brow, crest and horns, traced
    horns = (((700, 690, 0.62), (612, 640, 0.72), 0.12), ((735, 650, 0.68), (698, 605, 0.86), 0.09), ((800, 680, 0.68), (795, 612, 0.92), 0.09), ((680, 770, 0.45), (585, 752, 0.5), 0.1),
             ((830, 700, 0.66), (830, 660, 0.8), 0.06), ((880, 720, 0.6), (870, 690, 0.72), 0.05), ((925, 755, 0.48), (920, 722, 0.6), 0.05), ((760, 700, 0.66), (745, 670, 0.8), 0.06))
    for i, (b, t, r) in enumerate(horns):
        parts.append(spike(f'h{i}', at(*b), at(*t), r, hide, sides=5))
    parts.append(ball('brow', at(860, 800, 0.62), 0.16, hide, squash=(1.3, 1.0, 0.5), subdiv=2))
    # spines down the neck and the tail: leaf shapes on the ridge
    count = len(spine)
    for i in range(1, count - 3, 2):
        x, y, z, r = spine[i]
        px = A + B * x
        if 980 < px < 1370 and y > -0.3:
            continue  # under the wing
        a, b = Vector(spine[i - 1][:3]), Vector(spine[i + 1][:3])
        t = (b - a).normalized()
        base = Vector((x, y, z + r * 0.9))
        ln = 0.08 + r * 0.32
        tip = base + t * (ln * 0.75) + Vector((0, 0, ln))
        parts.append(spike(f'sp{i}', tuple(base), tuple(tip), 0.05 + r * 0.13, hide, sides=4))
    # folded wing, traced: shoulder, finger tips
    Sv = Vector(at(975, 412, 1.3))
    tips = [Vector(at(1402, 582, 0.98)), Vector(at(1332, 712, 0.86)), Vector(at(1212, 695, 0.86)), Vector(at(1030, 610, 0.96))]
    scallops = [Vector(at(1310, 590, 0.98)), Vector(at(1262, 650, 0.9)), Vector(at(1120, 590, 0.98))]
    for k in range(3):
        for n, (p0, p1) in enumerate(((tips[k], scallops[k]), (scallops[k], tips[k + 1]))):
            top = [tuple(Sv), tuple(p0), tuple(p1)]
            low = [tuple(Vector(q) + Vector((0, 0, -0.05))) for q in top]
            parts.append(loft(f'mem{k}{n}', [low, top], hide))
    for k, tip in enumerate(tips):
        mid = Sv + (tip - Sv) * 0.5 + Vector((0, 0, 0.03))
        wd = 0.09 - k * 0.01
        parts.append(tube(f'bone{k}', [tuple(Sv) + (wd,), tuple(mid) + (wd * 0.72,), tuple(tip) + (0.014,)], 5, 5, hide)[0])
    parts.append(spike('wtip', tuple(Sv), at(948, 430, 1.32), 0.08, hide, sides=5))
    parts.append(tube('arm', [tuple(Sv) + (0.09,), at(1005, 480, 1.05) + (0.15,), at(1005, 560, 0.8) + (0.22,)], 5, 7, hide)[0])
    obj = join(parts, 'sleeping_dragon_a')
    done(obj, 'sleeping_dragon_a', size=1024, smooth=('hide',), view=(50.0, 0.0))


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    jobs = {
        'snowcap_wall_idle': snowcap_wall_idle,
        'snowcap_tower_idle': snowcap_tower_idle,
        'city_house_a': house_a,
        'city_house_b': house_b,
        'city_house_c': house_c,
        'city_arch_a': city_arch,
        'street_lantern_a': street_lantern,
        'palace_column_a': palace_column,
        'palace_window_a': palace_window,
        'canal_wall_a': canal_wall,
        'canal_lock_a': canal_lock,
        'canal_bridge_a': canal_bridge,
        'ice_floe_a': ice_floe,
        'ice_crack_a': ice_crack,
        'glacier_crack_a': glacier_crack,
        'ice_spire_a': ice_spire,
        'ice_bridge_a': ice_bridge,
        'ember_rift_a': ember_rift,
        'urtempel_pillar_a': urtempel_pillar,
        'wagon_ring_a': wagon_ring,
        'refugee_tent_a': refugee_tent,
        'dome_a': dome,
        'sleeping_dragon_a': sleeping_dragon,
    }
    for name, fn in jobs.items():
        if not only or name in only:
            fn()
