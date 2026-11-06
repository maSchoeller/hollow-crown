"""Vaults, temples, interactive objects and height pieces, modelled after the ChatGPT sheets art/mockups/map-assets/refs/interior_*.png.

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/interior.py [-- id ...]

Crypt: sarcophagus_a, relief_a, pillar_a, pillar_broken_a, pillar_temple_a, rubble_a, torch_idle, brazier_b_idle, banner_a.
Interactive: lever_up, lever_down, chest_b_closed, chest_b_open, ballista_idle.
Height rule: ramp_idle, stairs_idle, ladder_idle climb inside one tile from z = 0 at the south edge to the wall top z = 0.85 at the north edge.
Palace: bookshelf_a (works as wall), carpet_a (flat). Mine: mine_cart_idle, mine_track_a, mine_support_a, mine_entrance_a, dragon_bones_a (2 tiles wide).

Textures: art/props/textures/interior_*.png, cut from the sheets interior_tex1.png, interior_tex2.png, plus kit_stone.png, kit_oak.png.
South faces -y. Fixed seeds. Writes art/models/props/<id>.glb and previews; the height pieces show a wall block in the preview only.
If the environment variable HC_SOUTH_DIR is set, a second render from the game's camera angle (35 degrees, due south) lands there.
"""
import math
import os
import random
import sys

import bpy
import bmesh
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import bake_texture, export, flat, join, mesh_object, preview, reset, tris, unwrap, vertex_colors  # noqa: E402
from facing import face_camera  # noqa: E402
from fortify import TEX, Mats, extrude_y, image_mat, rounded, slab  # noqa: E402
from houses import beam, box, circle, flat_mat, lin, loft, paint, prism, with_mat  # noqa: E402

WALL_H = 0.85


def _shaded(m, n, L, geo, color, tint):
    """Facets towards the light come out lighter, the same painted look as fortify.image_mat."""
    dot = n.new('ShaderNodeVectorMath')
    dot.operation = 'DOT_PRODUCT'
    L.new(geo.outputs['Normal'], dot.inputs[0])
    dot.inputs[1].default_value = (0.25, -0.5, 0.83)
    shade = n.new('ShaderNodeMapRange')
    shade.inputs['From Min'].default_value = -1.0
    shade.inputs['To Min'].default_value = 0.62
    shade.inputs['To Max'].default_value = 1.12
    L.new(dot.outputs['Value'], shade.inputs['Value'])
    mix = n.new('ShaderNodeVectorMath')
    mix.operation = 'SCALE'
    L.new(color, mix.inputs[0])
    L.new(shade.outputs['Result'], mix.inputs['Scale'])
    tn = n.new('ShaderNodeVectorMath')
    tn.operation = 'MULTIPLY'
    L.new(mix.outputs[0], tn.inputs[0])
    tn.inputs[1].default_value = tint
    L.new(tn.outputs[0], n['Principled BSDF'].inputs['Base Color'])


def _op(n, L, op, a, b):
    k = n.new('ShaderNodeMath')
    k.operation = op
    for i, v in enumerate((a, b)):
        if isinstance(v, (int, float)):
            k.inputs[i].default_value = v
        else:
            L.new(v, k.inputs[i])
    return k.outputs[0]


def tri_mat(name, file, scale=1.5, tint=(1, 1, 1), off=(0.0, 0.0), glow=None):
    """Image projected on walls by (x + y, z) and on upward faces by (x, y), so tops do not smear."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, L = m.node_tree.nodes, m.node_tree.links
    geo = n.new('ShaderNodeNewGeometry')
    sp = n.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Position'], sp.inputs[0])
    sn = n.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Normal'], sn.inputs[0])
    img = bpy.data.images.load(os.path.join(TEX, file), check_existing=True)
    wall = n.new('ShaderNodeCombineXYZ')
    L.new(_op(n, L, 'ADD', _op(n, L, 'MULTIPLY', _op(n, L, 'ADD', sp.outputs['X'], sp.outputs['Y']), scale), off[0]), wall.inputs['X'])
    L.new(_op(n, L, 'ADD', _op(n, L, 'MULTIPLY', sp.outputs['Z'], scale), off[1]), wall.inputs['Y'])
    top = n.new('ShaderNodeCombineXYZ')
    L.new(_op(n, L, 'ADD', _op(n, L, 'MULTIPLY', sp.outputs['X'], scale), off[0]), top.inputs['X'])
    L.new(_op(n, L, 'ADD', _op(n, L, 'MULTIPLY', sp.outputs['Y'], scale), off[1]), top.inputs['Y'])
    t0 = n.new('ShaderNodeTexImage')
    t0.image = img
    t1 = n.new('ShaderNodeTexImage')
    t1.image = img
    L.new(wall.outputs[0], t0.inputs['Vector'])
    L.new(top.outputs[0], t1.inputs['Vector'])
    mix = n.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    L.new(_op(n, L, 'GREATER_THAN', _op(n, L, 'ABSOLUTE', sn.outputs['Z'], 0.0), 0.7), mix.inputs[0])
    L.new(t0.outputs['Color'], mix.inputs[6])
    L.new(t1.outputs['Color'], mix.inputs[7])
    color = mix.outputs[2]
    if glow:
        # warm pool of light painted around a flame: glow = ((x, y, z), radius, (r, g, b))
        dist = n.new('ShaderNodeVectorMath')
        dist.operation = 'DISTANCE'
        L.new(geo.outputs['Position'], dist.inputs[0])
        dist.inputs[1].default_value = glow[0]
        fall = n.new('ShaderNodeMapRange')
        fall.inputs['From Min'].default_value = 0.0
        fall.inputs['From Max'].default_value = glow[1]
        fall.inputs['To Min'].default_value = 1.0
        fall.inputs['To Max'].default_value = 0.0
        L.new(dist.outputs['Value'], fall.inputs['Value'])
        mul = n.new('ShaderNodeVectorMath')
        mul.operation = 'MULTIPLY'
        L.new(color, mul.inputs[0])
        mul.inputs[1].default_value = glow[2]
        g = n.new('ShaderNodeMix')
        g.data_type = 'RGBA'
        L.new(fall.outputs['Result'], g.inputs[0])
        L.new(color, g.inputs[6])
        L.new(mul.outputs[0], g.inputs[7])
        color = g.outputs[2]
    _shaded(m, n, L, geo, color, tint)
    return m


def panel_mat(name, file, rect, plane='xz', tint=(1, 1, 1)):
    """One image stretched over rect (a0, b0, a1, b1) of the plane 'xz' (front) or 'xy' (top); repeats outside."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, L = m.node_tree.nodes, m.node_tree.links
    geo = n.new('ShaderNodeNewGeometry')
    sp = n.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Position'], sp.inputs[0])
    a = sp.outputs['X']
    b = sp.outputs['Z'] if plane == 'xz' else sp.outputs['Y']
    cb = n.new('ShaderNodeCombineXYZ')
    L.new(_op(n, L, 'DIVIDE', _op(n, L, 'SUBTRACT', a, rect[0]), rect[2] - rect[0]), cb.inputs['X'])
    L.new(_op(n, L, 'DIVIDE', _op(n, L, 'SUBTRACT', b, rect[1]), rect[3] - rect[1]), cb.inputs['Y'])
    tex = n.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(os.path.join(TEX, file), check_existing=True)
    L.new(cb.outputs[0], tex.inputs['Vector'])
    _shaded(m, n, L, geo, tex.outputs['Color'], tint)
    return m


class IM(Mats):
    """fortify.Mats plus the interior textures and paints."""

    def __init__(self, center=(0.0, 0.0), radius=0.25):
        super().__init__(center, radius)
        self.crypt = tri_mat('crypt', 'interior_crypt.png', 0.72)
        self.crypt2 = tri_mat('crypt2', 'interior_crypt.png', 0.6, (1.2, 1.17, 1.14), (0.37, 0.21))
        self.carve = paint('carve', [(0.0, lin(84, 62, 58)), (0.55, lin(132, 102, 92)), (1.0, lin(186, 150, 130))], wn=0.95, noise=0.1, nscale=14, seed=95.0)
        self.crypt_round = image_mat('crypt_round', 'interior_crypt.png', 'round', 0.8, center, radius)
        self.sand = tri_mat('sand', 'kit_stone.png', 0.75, (0.9, 0.76, 0.58))
        self.sand2 = paint('sand2', [(0.0, lin(118, 78, 40)), (0.45, lin(186, 130, 72)), (1.0, lin(232, 182, 120))], wn=0.85, noise=0.16, nscale=16, seed=98.0)
        self.marble = tri_mat('marble', 'interior_marble.png', 0.9, (0.92, 0.78, 0.64))
        self.marble_round = image_mat('marble_round', 'interior_marble.png', 'round', 0.9, center, radius, (0.92, 0.78, 0.64))
        self.cave = tri_mat('cave', 'interior_rock.png', 1.1, (0.74, 0.68, 0.76))
        self.woodh = tri_mat('woodh', 'interior_oak.png', 1.6)
        self.woodv = tri_mat('woodv', 'kit_oak.png', 1.8)
        self.wooddark = tri_mat('wooddark', 'interior_oak.png', 1.6, (0.62, 0.56, 0.52))
        self.woodm = tri_mat('woodm', 'interior_oak.png', 1.3, (0.78, 0.66, 0.58))
        self.woodr = tri_mat('woodr', 'interior_oak.png', 1.3, (0.74, 0.54, 0.42))
        self.pave = paint('pave', [(0.0, lin(120, 84, 52)), (1.0, lin(186, 140, 94))], wn=0.5, noise=0.2, nscale=20, seed=100.0)
        self.rail = paint('rail', [(0.0, lin(50, 40, 40)), (0.6, lin(82, 68, 66)), (1.0, lin(130, 112, 106))], wn=0.9, noise=0.08, nscale=18, seed=101.0)
        self.gold2 = paint('gold2', [(0.0, lin(120, 72, 16)), (0.5, lin(190, 126, 32)), (0.85, lin(226, 166, 54)), (1.0, lin(250, 212, 110))], wn=1.0, noise=0.05, nscale=10, seed=83.0)
        self.iron2 = paint('iron2', [(0.0, lin(52, 46, 44)), (0.6, lin(92, 84, 78)), (1.0, lin(142, 130, 120))], wn=0.85, noise=0.07, nscale=16, seed=84.0)
        self.rust = paint('rust', [(0.0, lin(60, 38, 30)), (0.6, lin(108, 68, 48)), (1.0, lin(150, 100, 72))], wn=0.85, noise=0.1, nscale=14, seed=85.0)
        self.rope = paint('rope', [(0.0, lin(142, 100, 54)), (1.0, lin(226, 184, 118))], wn=0.6, noise=0.2, nscale=30, seed=86.0)
        self.bone = paint('bone', [(0.0, lin(118, 90, 58)), (0.5, lin(184, 152, 108)), (1.0, lin(238, 216, 172))], wn=1.0, noise=0.12, nscale=9, seed=87.0)
        self.black = flat_mat('black', lin(10, 8, 12))
        self.dark = paint('dark', [(0.0, lin(26, 20, 22)), (1.0, lin(52, 40, 40))], wn=0.5, noise=0.1, nscale=12, seed=88.0)
        self.coal = paint('coal', [(0.0, lin(26, 22, 24)), (1.0, lin(70, 60, 62))], wn=0.8, noise=0.1, nscale=14, seed=89.0)
        self.ember = paint('ember', [(0.0, lin(190, 52, 16)), (1.0, lin(255, 150, 40))], wn=0.6, noise=0.25, nscale=10, seed=90.0)
        self.flame_o = paint('flame_o', [(0.0, lin(226, 84, 20)), (1.0, lin(255, 150, 36))], wn=0.6, noise=0.08, nscale=6, seed=91.0)
        self.flame_i = paint('flame_i', [(0.0, lin(255, 180, 50)), (1.0, lin(255, 226, 110))], wn=0.6, noise=0.05, nscale=6, seed=96.0)
        self.glass = flat_mat('glass', lin(255, 196, 90))
        self.ore = paint('ore', [(0.0, lin(34, 26, 44)), (0.6, lin(66, 50, 74)), (1.0, lin(112, 84, 108))], wn=0.95, noise=0.08, nscale=10, seed=92.0)
        self.copper = paint('copper', [(0.0, lin(170, 92, 40)), (1.0, lin(250, 170, 90))], wn=0.7, noise=0.05, nscale=9, seed=93.0)
        self.socket = flat_mat('socket', lin(44, 32, 26))


# ---------------------------------------------------------------- geometry helpers

def lathe(name, c, profile, mat, seg=12, off=0.0, cap=True):
    """Solid of revolution around z through c, profile = [(radius, z), ...] from bottom to top."""
    return loft(name, [circle(c, r, z, seg, off) for r, z in profile], mat, cap=cap)


def lathe_y(name, c, profile, mat, seg=10):
    """Solid of revolution around an axis along y at (x, z) = c; profile = [(radius, y), ...]."""
    rings = [[(c[0] + math.cos(2 * math.pi * i / seg) * r, y, c[1] + math.sin(2 * math.pi * i / seg) * r) for i in range(seg)] for r, y in profile]
    return loft(name, rings, mat)


def lathe_x(name, c, profile, mat, seg=10):
    """Solid of revolution around an axis along x at (y, z) = c; profile = [(radius, x), ...]."""
    rings = [[(x, c[0] + math.cos(2 * math.pi * i / seg) * r, c[1] + math.sin(2 * math.pi * i / seg) * r) for i in range(seg)] for r, x in profile]
    return loft(name, rings, mat)


def ball(name, c, r, mat, sub=2, squash=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    for v in bm.verts:
        v.co = Vector((v.co.x * squash[0], v.co.y * squash[1], v.co.z * squash[2])) + Vector(c)
    return with_mat(mesh_object(name, bm), mat)


def boulder(name, c, rx, ry, h, rng, mat, n=7):
    """Big rounded chipped block: wide foot, bulging middle, facetted top."""
    off = rng.uniform(0, 6.28)
    jit = [(off + 2 * math.pi * (k + rng.uniform(-0.18, 0.18)) / n, rng.uniform(0.88, 1.1)) for k in range(n)]
    rings = []
    for f, g in ((0.0, 1.0), (0.45, 1.02), (0.82, 0.78), (1.0, 0.42)):
        rings.append([(c[0] + math.cos(a) * rx * rr * g, c[1] + math.sin(a) * ry * rr * g, -0.01 + (h + 0.01) * f + (rng.uniform(-0.012, 0.012) if f > 0.5 else 0)) for a, rr in jit])
    return loft(name, rings, mat)


def tube(name, pts, radii, mat, sides=6):
    """Tube through points with radius per point (or one radius); parallel-transported frames; last radius 0 makes a tip."""
    pts = [Vector(p) for p in pts]
    if isinstance(radii, (int, float)):
        radii = [radii] * len(pts)
    t0 = (pts[1] - pts[0]).normalized()
    u = t0.orthogonal().normalized()
    rings = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        u = (u - t * u.dot(t)).normalized()
        v = t.cross(u)
        if radii[i] <= 0:
            rings.append([tuple(p)])
        else:
            rings.append([tuple(p + (u * math.cos(2 * math.pi * k / sides) + v * math.sin(2 * math.pi * k / sides)) * radii[i]) for k in range(sides)])
    return loft(name, rings, mat, cap=len(rings[-1]) > 1)


def rivet(name, c, r, mat, axis='y'):
    """A low-poly dome head on a south or top face."""
    if axis == 'y':
        rings = [[(c[0] + math.cos(2 * math.pi * k / 6) * r, c[1] + 0.006, c[2] + math.sin(2 * math.pi * k / 6) * r) for k in range(6)], [(c[0], c[1] - r * 0.7, c[2])]]
    else:
        rings = [[(c[0] + math.cos(2 * math.pi * k / 6) * r, c[1] + math.sin(2 * math.pi * k / 6) * r, c[2] - 0.006) for k in range(6)], [(c[0], c[1], c[2] + r * 0.7)]]
    return loft(name, rings, mat, cap=False)


def crown_pts(x, z, s):
    pts = [(-0.5, 0.16), (0.5, 0.16), (0.62, 0.62), (0.3, 0.38), (0.0, 0.78), (-0.3, 0.38), (-0.62, 0.62)]
    return [(x + a * s, z + b * s) for a, b in pts]


def crown(parts, mat, x, y, z, s, depth=0.018, prefix='cr'):
    """Flat gold crown with a band and three balls on a south face at y."""
    parts.append(extrude_y(f'{prefix}a', crown_pts(x, z, s), y - depth, y, mat))
    parts.append(box(f'{prefix}b', (x, y - depth / 2, z + 0.05 * s), (1.04 * s, depth, 0.1 * s), mat))
    for k, (a, b) in enumerate(((-0.62, 0.68), (0.0, 0.84), (0.62, 0.68))):
        parts.append(ball(f'{prefix}c{k}', (x + a * s, y - depth / 2, z + b * s), 0.09 * s, mat, sub=1))


def flame(parts, M, c, h, r, prefix='fl', lean=(0.03, -0.01)):
    """Painted fire: a broad outer tongue and a small bright core towards the viewer."""
    x, y, z = c
    def rings(rr, hh, seg=6):
        out = []
        for k, (f, g) in enumerate(((0.0, 0.7), (0.22, 1.0), (0.5, 0.62), (0.75, 0.3))):
            out.append(circle((x + lean[0] * f, y + lean[1] * f), rr * g, z + hh * f, seg, 0.3 * k))
        out.append([(x + lean[0] * 2.2, y + lean[1] * 2.2, z + hh)])
        return out
    parts.append(loft(f'{prefix}o', rings(r, h), M.flame_o, cap=False))
    parts.append(loft(f'{prefix}i', [[(a, b - r * 0.55, d) for a, b, d in ring] for ring in rings(r * 0.55, h * 0.55)], M.flame_i, cap=False))


def finish2(obj, pid, size=512, ghost=None):
    """fortify's finish plus a preview helper piece (not exported) and the optional render from the game's angle."""
    face_camera(obj)
    flat(obj)
    # bone is soft: it reads as bone only with round shading
    names = [m.name for m in obj.data.materials]
    for p in obj.data.polygons:
        if names[p.material_index].startswith('bone'):
            p.use_smooth = True
    unwrap(obj)
    bake_texture(obj, size, pid)
    vertex_colors(obj)
    export(obj, pid)
    if ghost:
        ghost()
    preview(obj, pid)
    south = os.environ.get('HC_SOUTH_DIR')
    if south:
        scene = bpy.context.scene
        d = 6.0
        z = max(obj.dimensions.z * 0.42, 0.3)
        cam = scene.objects['cam']
        cam.constraints.clear()
        cam.location = (0, -math.sin(math.radians(35)) * d, z + math.cos(math.radians(35)) * d)
        cam.rotation_euler = (math.radians(35), 0, 0)
        scene.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items} else 'BLENDER_EEVEE_NEXT'
        scene.render.filepath = os.path.join(south, f'{pid}.png')
        bpy.ops.render.render(write_still=True)
        scene.render.engine = 'CYCLES'
    print(f'{pid}: {tris(obj)} triangles')


def wall_ghost():
    """Preview only: the wall of height 0.85 the piece leans against and a bit of ground."""
    wall = tri_mat('ghost_wall', 'kit_stone.png', 1.4, (0.86, 0.84, 0.82))
    box('ghost_w', (0, 0.76, WALL_H / 2), (1.5, 0.52, WALL_H), wall)
    box('ghost_g', (0, 0.1, -0.02), (1.5, 1.8, 0.04), flat_mat('ghost_g', lin(136, 126, 104)))


# ---------------------------------------------------------------- crypt

def laurel(parts, mat, z, side, prefix):
    """Five pairs of gold leaves curving outwards and up from under the crown."""
    for k in range(5):
        px = side * (0.13 + k * 0.024)
        pz = z + 0.02 + k * 0.022
        for j, up in enumerate((1, -1)):
            q = [(px - side * 0.018, pz), (px + side * (0.004 if up > 0 else 0.018), pz + up * 0.03), (px + side * 0.02, pz + up * 0.004)]
            parts.append(extrude_y(f'{prefix}{k}{j}', q, -0.455, -0.44, mat))


def sarcophagus_a():
    reset()
    M = IM()
    y0 = -0.03
    stone = [
        box('base', (0, y0, 0.05), (0.84, 0.94, 0.1), M.crypt, skip=('-z',)),
        box('chest', (0, y0, 0.25), (0.72, 0.82, 0.3), M.crypt, skip=('-z',)),
        box('slab', (0, y0, 0.42), (0.8, 0.9, 0.07), M.crypt2),
        box('tray', (0, y0, 0.47), (0.68, 0.78, 0.04), M.crypt),
    ]
    for sx in (-1, 1):
        stone.append(box(f'pS{sx}', (sx * 0.31, y0 - 0.41, 0.25), (0.1, 0.05, 0.3), M.crypt2))
        stone.append(box(f'rim{sx}', (sx * 0.36, y0, 0.5), (0.08, 0.88, 0.05), M.crypt2))
    stone.append(box('rimS', (0, y0 - 0.42, 0.5), (0.8, 0.08, 0.05), M.crypt2))
    stone.append(box('rimN', (0, y0 + 0.42, 0.5), (0.8, 0.08, 0.05), M.crypt2))
    stone.append(box('pillow', (0, y0 + 0.28, 0.51), (0.34, 0.2, 0.06), M.crypt2))
    stone = rounded(join(stone, 'sar_stone'), 0.012, segments=1)
    # effigy: head north (the far end), feet south
    S = M.carve
    def body(y, wx, zt):
        return [(-wx, y0 + y, 0.48), (wx, y0 + y, 0.48), (wx, y0 + y, 0.48 + (zt - 0.48) * 0.55), (wx * 0.62, y0 + y, zt), (-wx * 0.62, y0 + y, zt), (-wx, y0 + y, 0.48 + (zt - 0.48) * 0.55)]
    fig = [
        loft('robe', [body(-0.385, 0.1, 0.545), body(-0.25, 0.13, 0.565), body(-0.05, 0.155, 0.585), body(0.1, 0.185, 0.61), body(0.165, 0.17, 0.6)], S),
        box('feetL', (-0.05, y0 - 0.37, 0.57), (0.07, 0.05, 0.09), S),
        box('feetR', (0.05, y0 - 0.37, 0.57), (0.07, 0.05, 0.09), S),
        ball('head', (0, y0 + 0.26, 0.58), 0.09, S, sub=2, squash=(1, 1.1, 0.9)),
        tube('armL', [(-0.17, y0 + 0.11, 0.59), (-0.17, y0 + 0.01, 0.62), (-0.03, y0 - 0.03, 0.645)], [0.05, 0.045, 0.04], S),
        tube('armR', [(0.17, y0 + 0.11, 0.59), (0.17, y0 + 0.01, 0.62), (0.03, y0 - 0.03, 0.645)], [0.05, 0.045, 0.04], S),
        box('blade', (0, y0 - 0.215, 0.6), (0.05, 0.3, 0.02), M.iron2),
        ball('fists', (0, y0 - 0.03, 0.655), 0.052, S, sub=1),
        box('guard', (0, y0 - 0.07, 0.625), (0.18, 0.032, 0.03), M.gold2),
    ]
    # crown: a ring around the head, seen from above and from the south, points to the north
    ring = []
    for i in range(10):
        a = 2 * math.pi * i / 10
        ring.append((math.cos(a) * 0.1, y0 + 0.33, 0.585 + math.sin(a) * 0.095))
    outer = [(x, y0 + 0.415 if i % 2 == 0 else y0 + 0.37, z) for i, (x, _, z) in enumerate(ring)]
    fig.append(loft('crown', [[(x, y - 0.06, z) for x, y, z in ring], ring, outer], M.gold2, cap=False))
    # emblem on the south face
    crown(fig, M.gold2, 0, -0.455, 0.18, 0.2, prefix='em')
    laurel(fig, M.gold2, 0.17, -1, 'la')
    laurel(fig, M.gold2, 0.17, 1, 'lb')
    finish2(join([stone, *fig], 'sarcophagus_a'), 'sarcophagus_a', 512)


def relief_a():
    """Tomb relief: a thick slab against the north side of the tile, arched niche with a carved kneeling knight."""
    reset()
    M = IM()
    front = 0.13
    x0, x1, z0, z1 = -0.33, 0.33, 0.12, 0.84
    P = panel_mat('relief', 'interior_relief.png', (x0, z0, x1, z1))
    stone = [
        box('base', (0, 0.28, 0.06), (0.98, 0.42, 0.12), M.crypt, skip=('-z',)),
        box('back', (0, 0.36, 0.55), (0.78, 0.26, 0.9), M.crypt, skip=('-z',)),
        box('lint', (0, 0.3, 0.97), (0.88, 0.32, 0.08), M.crypt2),
    ]
    for k, x in enumerate((-0.31, 0.0, 0.31)):
        stone.append(box(f'cap{k}', (x, 0.3, 1.07), (0.31, 0.38, 0.12), M.crypt2))
    for s in (-1, 1):
        stone.append(box(f'pil{s}', (s * 0.41, 0.3, 0.52), (0.14, 0.32, 0.82), M.crypt))
        stone.append(box(f'plb{s}', (s * 0.41, 0.3, 0.2), (0.17, 0.35, 0.14), M.crypt2))
    # arch of wedge stones above the niche
    n = 6
    for i in range(n):
        a0, a1 = math.pi * (i + 0.05) / n, math.pi * (i + 0.95) / n
        r0, r1, sz = 0.33, 0.42, 0.62
        q = [(-r0 * math.cos(a0), sz + r0 * 0.72 * math.sin(a0)), (-r0 * math.cos(a1), sz + r0 * 0.72 * math.sin(a1)),
             (-r1 * math.cos(a1), sz + r1 * 0.72 * math.sin(a1)), (-r1 * math.cos(a0), sz + r1 * 0.72 * math.sin(a0))]
        stone.append(extrude_y(f'arc{i}', q, front - 0.03, front + 0.1, M.crypt2))
    for s in (-1, 1):
        stone.append(extrude_y(f'sp{s}', [(s * 0.33, 0.62), (s * 0.34, 0.93), (s * 0.05, 0.93)], front + 0.02, front + 0.12, M.crypt))
    stone = rounded(join(stone, 'rel_stone'), 0.012, segments=1)
    niche = box('niche', (0, front + 0.11, (z0 + z1) / 2), (x1 - x0, 0.02, z1 - z0), P)
    # the knight stands out of the niche: outline of the panel image, same projection
    out = [(0.02, 0.05), (0.2, 0.42), (0.3, 0.72), (0.38, 0.78), (0.42, 0.84), (0.42, 0.9), (0.5, 0.97), (0.66, 0.97), (0.72, 0.88), (0.66, 0.76), (0.72, 0.72), (0.84, 0.67),
           (0.83, 0.6), (0.91, 0.52), (0.91, 0.47), (0.84, 0.47), (0.84, 0.05), (0.78, 0.04), (0.4, 0.04)]
    out = [(x0 + u * (x1 - x0), z0 + v * (z1 - z0)) for u, v in out]
    knight = extrude_y('knight', out, front + 0.06, front + 0.1, P)
    finish2(join([stone, niche, knight], 'relief_a'), 'relief_a', 512)


def pillar_shaft(M, top, prefix, seam=0.012, r=0.205):
    prof = [(r, 0.28)]
    n = 3
    z = 0.28
    step = (top - 0.28) / n
    for i in range(n):
        prof += [(r, z + 0.012), (r + 0.012, z + 0.035), (r + 0.012, z + step - 0.035), (r - 0.004, z + step - seam)]
        z += step
    return lathe(f'{prefix}shaft', (0, 0), prof, M.crypt_round, seg=12)


def pillar_foot(M, parts):
    parts.append(box('b0', (0, 0, 0.055), (0.78, 0.78, 0.11), M.crypt, skip=('-z',)))
    parts.append(box('b1', (0, 0, 0.16), (0.64, 0.64, 0.1), M.crypt2))
    parts.append(lathe('ring', (0, 0), [(0.27, 0.2), (0.27, 0.25), (0.23, 0.3)], M.crypt_round, seg=12))


def pillar_a():
    reset()
    M = IM()
    top = 1.18
    parts = []
    pillar_foot(M, parts)
    parts.append(pillar_shaft(M, top, 'p'))
    parts.append(lathe('capt', (0, 0), [(0.2, top - 0.01), (0.26, top + 0.04), (0.26, top + 0.08)], M.crypt_round, seg=12))
    parts.append(box('aba', (0, 0, top + 0.13), (0.56, 0.56, 0.11), M.crypt2))
    finish2(rounded(join(parts, 'pillar_a'), 0.012, segments=1, angle=40), 'pillar_a', 512)


def pillar_broken_a():
    reset()
    cx = -0.14
    M = IM((cx, 0.1), 0.25)
    rng = random.Random(51)
    c = (cx, 0.1)
    parts = [
        box('b0', (cx, 0.1, 0.05), (0.66, 0.66, 0.1), M.crypt, skip=('-z',)),
        lathe('ring', c, [(0.29, 0.1), (0.29, 0.15), (0.24, 0.2), (0.235, 0.26)], M.crypt_round, seg=12),
    ]
    h = 0.72
    seg = 12
    tips = [0.18, 0.07, -0.02, -0.08, 0.0, -0.09, -0.14, -0.2, -0.08, 0.0, 0.1, 0.22]
    top = [(cx + x * 0.92, 0.1 + y * 0.92, h + tips[i]) for i, (x, y, _) in enumerate(circle((0, 0), 0.215, 0.0, seg))]
    parts.append(loft('shaft', [circle(c, 0.215, 0.26, seg), circle(c, 0.215, 0.5, seg), circle(c, 0.222, 0.53, seg), top], M.crypt_round))
    stone = rounded(join(parts, 'br_stone'), 0.012, segments=1, angle=40)
    bits = [lathe_x('drum', (-0.14, 0.17), [(0.15, 0.13), (0.17, 0.16), (0.17, 0.42), (0.15, 0.46)], M.crypt, seg=10)]
    for i, (x, y, s) in enumerate(((-0.3, -0.36, 0.1), (-0.05, -0.4, 0.075), (0.36, 0.3, 0.09), (0.12, -0.42, 0.05))):
        bits.append(slab(f'ch{i}', (x, y), s, s * 0.85, -0.01, s * 0.95 + 0.02, (0.2, -0.2), rng, M.crypt2))
    finish2(join([stone, *bits], 'pillar_broken_a'), 'pillar_broken_a', 512)


def volute(parts, M, s, z, y, prefix):
    """Gold scroll at the corner of the capital."""
    pts = []
    for i in range(10):
        a = math.radians(100) - i * math.radians(66)
        r = 0.09 - i * 0.0068
        pts.append((s * (0.2 + math.cos(a) * r), y, z + math.sin(a) * r))
    parts.append(tube(prefix, pts, [0.03 - i * 0.0018 for i in range(10)], M.gold2, sides=5))


def pillar_temple_a():
    """Slender fluted marble column on a round stepped base, gold rings and scrolls, eight-cornered abacus."""
    reset()
    M = IM()
    n = 13
    r0, r1 = 0.185, 0.135
    def fluted(z, k=1.0):
        return [(math.cos(math.pi * i / n) * (r0 if i % 2 == 0 else r1) * k, math.sin(math.pi * i / n) * (r0 if i % 2 == 0 else r1) * k, z) for i in range(2 * n)]
    top = 1.28
    parts = [
        lathe('b0', (0, 0), [(0.37, 0.0), (0.37, 0.07), (0.32, 0.1)], M.marble_round, seg=16),
        lathe('b1', (0, 0), [(0.3, 0.1), (0.28, 0.16), (0.235, 0.2)], M.marble_round, seg=16),
        lathe('cap', (0, 0), [(0.165, top + 0.02), (0.2, top + 0.09), (0.25, top + 0.15)], M.marble_round, seg=12),
        loft('aba', [circle((0, 0), 0.31, top + 0.15, 8, math.pi / 8), circle((0, 0), 0.31, top + 0.22, 8, math.pi / 8), circle((0, 0), 0.28, top + 0.24, 8, math.pi / 8)], M.marble),
    ]
    stone = rounded(join(parts, 'tm_stone'), 0.01, segments=1, angle=40)
    shaft = loft('shaft', [fluted(0.22, 1.1), fluted(0.7, 1.02), fluted(top, 0.95)], M.marble_round)
    gold = [
        lathe('g0', (0, 0), [(0.21, 0.19), (0.24, 0.21), (0.24, 0.25), (0.205, 0.27)], M.gold2, seg=12),
        lathe('g1', (0, 0), [(0.165, top - 0.03), (0.2, top - 0.01), (0.2, top + 0.01), (0.165, top + 0.04)], M.gold2, seg=12),
    ]
    volute(gold, M, -1, top + 0.08, -0.17, 'vl')
    volute(gold, M, 1, top + 0.08, -0.17, 'vr')
    # acanthus: three gold leaves on the south of the capital
    for k, (x, h) in enumerate(((-0.075, 0.09), (0.0, 0.13), (0.075, 0.09))):
        gold.append(extrude_y(f'lf{k}', [(x - 0.045, top + 0.03), (x + 0.045, top + 0.03), (x + 0.025, top + 0.03 + h * 0.7), (x, top + 0.03 + h), (x - 0.025, top + 0.03 + h * 0.7)], -0.24, -0.19, M.gold2))
    finish2(join([stone, shaft, *gold], 'pillar_temple_a'), 'pillar_temple_a', 512)


def rubble_a():
    """Low: three big chipped blocks around the north and east, the middle of the tile stays walkable."""
    reset()
    M = IM()
    rng = random.Random(29)
    parts = [
        boulder('a', (-0.1, 0.25), 0.27, 0.2, 0.3, rng, M.crypt2),
        boulder('b', (0.27, 0.05), 0.2, 0.24, 0.22, rng, M.crypt),
        boulder('c', (-0.35, -0.08), 0.13, 0.12, 0.13, rng, M.crypt),
        boulder('d', (-0.1, -0.36), 0.08, 0.07, 0.07, rng, M.crypt2, n=5),
        boulder('e', (0.1, -0.38), 0.05, 0.05, 0.05, rng, M.crypt, n=5),
        boulder('f', (0.4, -0.3), 0.07, 0.06, 0.07, rng, M.crypt2, n=5),
    ]
    finish2(join(parts, 'rubble_a'), 'rubble_a', 256)


def torch_idle():
    """Iron torch on a small block of masonry on the north side of the tile."""
    reset()
    M = IM()
    lit = tri_mat('lit', 'interior_crypt.png', 0.72, off=(0.2, 0.1), glow=((0.03, 0.33, 0.78), 0.5, (2.1, 1.25, 0.6)))
    stone = [
        box('wall', (0, 0.41, 0.48), (0.66, 0.16, 0.96), lit, skip=('-z',)),
        box('t0', (-0.17, 0.41, 0.99), (0.32, 0.18, 0.1), lit),
        box('t1', (0.18, 0.41, 1.02), (0.3, 0.18, 0.15), lit),
        box('foot', (0, 0.39, 0.05), (0.72, 0.22, 0.1), M.crypt2, skip=('-z',)),
    ]
    stone = rounded(join(stone, 'to_stone'), 0.014, segments=1)
    y = 0.14
    iron = [
        box('plate', (-0.1, 0.32, 0.5), (0.1, 0.02, 0.26), M.rust),
        tube('arm', [(-0.1, 0.32, 0.46), (-0.02, 0.24, 0.46), (0.03, y + 0.03, 0.56)], 0.022, M.rust, sides=5),
        lathe('cup', (0.03, y), [(0.024, 0.53), (0.055, 0.57), (0.085, 0.66), (0.1, 0.72), (0.085, 0.72), (0.05, 0.62)], M.rust, seg=8),
        lathe('band', (0.03, y), [(0.09, 0.665), (0.098, 0.68), (0.098, 0.7), (0.09, 0.71)], M.gold2, seg=8),
        ball('coal', (0.03, y, 0.71), 0.07, M.ember, sub=1),
        rivet('r0', (-0.1, 0.31, 0.6), 0.016, M.iron2),
        rivet('r1', (-0.1, 0.31, 0.4), 0.016, M.iron2),
    ]
    flame(iron, M, (0.03, y, 0.71), 0.34, 0.07, 'f0', (0.02, 0.0))
    flame(iron, M, (0.075, y - 0.01, 0.71), 0.22, 0.05, 'f1', (0.025, 0.0))
    flame(iron, M, (-0.02, y - 0.02, 0.71), 0.2, 0.045, 'f2', (-0.02, 0.0))
    finish2(join([stone, *iron], 'torch_idle'), 'torch_idle', 512)


def brazier_b_idle():
    """Iron bowl on three scrolled legs, full of coals with low flames."""
    reset()
    M = IM()
    z0 = 0.3
    parts = [
        lathe('bowl', (0, 0), [(0.12, z0), (0.28, z0 + 0.06), (0.37, z0 + 0.17), (0.39, z0 + 0.27), (0.35, z0 + 0.3), (0.31, z0 + 0.2)], M.rust, seg=12),
        lathe('rim', (0, 0), [(0.37, z0 + 0.235), (0.41, z0 + 0.25), (0.41, z0 + 0.29), (0.35, z0 + 0.305)], M.rust, seg=12, cap=False),
        lathe('belt', (0, 0), [(0.325, z0 + 0.09), (0.36, z0 + 0.1), (0.375, z0 + 0.15), (0.365, z0 + 0.16)], M.dark, seg=12, cap=False),
        lathe('foot', (0, 0), [(0.08, 0.0), (0.09, 0.03), (0.05, 0.1), (0.07, z0 - 0.04), (0.14, z0 + 0.01)], M.rust, seg=8),
        lathe('glow', (0, 0), [(0.32, z0 + 0.19), (0.32, z0 + 0.205)], paint('emberd', [(0.0, lin(120, 30, 14)), (1.0, lin(210, 76, 20))], wn=0.1, noise=0.4, nscale=16, seed=97.0), seg=12),
    ]
    for i in range(6):
        a = 2 * math.pi * i / 6 + 0.26
        ca, sa = math.cos(a), math.sin(a)
        parts.append(tube(f'st{i}', [(ca * 0.25, sa * 0.25, z0 + 0.05), (ca * 0.35, sa * 0.35, z0 + 0.14), (ca * 0.4, sa * 0.4, z0 + 0.27)], 0.024, M.dark, sides=3))
    for i in range(3):
        a = math.radians(-90 + i * 120 + 30)
        ca, sa = math.cos(a), math.sin(a)
        pts = [(ca * 0.17, sa * 0.17, z0 + 0.03), (ca * 0.3, sa * 0.3, z0 - 0.02), (ca * 0.37, sa * 0.37, z0 - 0.12), (ca * 0.37, sa * 0.37, 0.09), (ca * 0.41, sa * 0.41, 0.03),
               (ca * 0.47, sa * 0.47, 0.035), (ca * 0.49, sa * 0.49, 0.08), (ca * 0.45, sa * 0.45, 0.1), (ca * 0.43, sa * 0.43, 0.075)]
        parts.append(tube(f'leg{i}', pts, [0.042, 0.042, 0.04, 0.038, 0.038, 0.036, 0.034, 0.028, 0.02], M.rust, sides=4))
    rng = random.Random(7)
    for i in range(12):
        a = 2 * math.pi * i / (8 if i < 8 else 4) + rng.uniform(-0.2, 0.2)
        r = 0.235 if i < 8 else 0.09
        parts.append(ball(f'coal{i}', (math.cos(a) * r, math.sin(a) * r, z0 + 0.22 + (0.03 if i >= 8 else 0)), 0.08 + rng.uniform(0, 0.025), M.coal if i % 3 else M.ember, sub=1, squash=(1.1, 1.1, 0.7)))
    flame(parts, M, (-0.1, 0.05, z0 + 0.25), 0.34, 0.075, 'f0', (0.02, 0.0))
    flame(parts, M, (0.12, 0.02, z0 + 0.25), 0.26, 0.06, 'f1', (0.03, 0.0))
    flame(parts, M, (0.0, -0.12, z0 + 0.25), 0.2, 0.05, 'f2', (-0.02, 0.0))
    finish2(join(parts, 'brazier_b_idle'), 'brazier_b_idle', 512)


def banner_a():
    """Hanging banner on a post, against the north side of the tile: wine plum, gold crown, no team colour."""
    reset()
    M = IM()
    y = 0.34
    x0, x1 = -0.2, 0.3
    z1, zb = 1.0, 0.24
    tail = 0.14
    P = panel_mat('banner', 'interior_banner.png', (x0 - 0.02, z1 - 0.56, x1 + 0.02, z1 - 0.04), 'xz', (0.92, 0.88, 0.95))
    n = 5
    top = [(x0 + (x1 - x0) * i / n, z1) for i in range(n + 1)]
    bot = [(x1, zb), ((x0 + x1) / 2, zb + tail), (x0, zb)]
    cloth = extrude_y('cloth', top + bot, y - 0.012, y + 0.012, P)
    for v in cloth.data.vertices:
        v.co.y += math.sin((v.co.x - x0) * 13) * 0.016 * (1.2 - (v.co.z - zb) / (z1 - zb))
    mid = (x0 + x1) / 2
    parts = [
        box('post', (-0.34, y, 0.6), (0.075, 0.075, 1.0), M.woodv),
        box('head', (-0.34, y, 1.135), (0.1, 0.1, 0.07), M.woodh),
        box('stone', (-0.34, y, 0.06), (0.2, 0.2, 0.12), M.sand, skip=('-z',)),
        box('collar0', (-0.34, y, 0.15), (0.1, 0.1, 0.06), M.iron2),
        box('collar1', (-0.34, y, 1.04), (0.11, 0.11, 0.08), M.iron2),
        tube('rod', [(-0.42, y, 1.04), (0.38, y, 1.04)], 0.02, M.iron2),
        ball('end', (0.385, y, 1.04), 0.035, M.iron2, sub=1),
        box('h0', (x0 + 0.08, y, 1.02), (0.05, 0.04, 0.07), M.cushion),
        box('h1', (x1 - 0.08, y, 1.02), (0.05, 0.04, 0.07), M.cushion),
        # gold hem along the swallow tail and the top
        beam('hem0', (x0, y - 0.016, zb), (mid, y - 0.016, zb + tail), 0.02, M.gold2),
        beam('hem1', (mid, y - 0.016, zb + tail), (x1, y - 0.016, zb), 0.02, M.gold2),
        beam('hem2', (x0, y - 0.016, zb), (x0, y - 0.016, z1), 0.018, M.gold2),
        beam('hem3', (x1, y - 0.016, zb), (x1, y - 0.016, z1), 0.018, M.gold2),
    ]
    finish2(join([cloth, *parts], 'banner_a'), 'banner_a', 512)


# ---------------------------------------------------------------- interactive

def block_cluster(parts, M, w, h, prefix):
    """Base of big rounded blocks in two courses around a core."""
    parts.append(box(f'{prefix}core', (0, 0, h * 0.5), (w * 0.82, w * 0.82, h), M.sand, skip=('-z',)))
    q = w * 0.5 - 0.06
    for i, (x, y) in enumerate(((-q, -q), (q, -q), (-q, q), (q, q))):
        parts.append(box(f'{prefix}c{i}', (x, y, h * 0.42), (0.17, 0.17, h * 0.84), M.sand2, skip=('-z',)))
    for i, (x, y, sx, sy) in enumerate(((0, -q - 0.01, w * 0.46, 0.13), (0, q + 0.01, w * 0.46, 0.13), (-q - 0.01, 0, 0.13, w * 0.46), (q + 0.01, 0, 0.13, w * 0.46))):
        parts.append(box(f'{prefix}s{i}', (x, y, h * 0.27), (sx, sy, h * 0.54), M.sand, skip=('-z',)))


def lever(state):
    """A big gold knob on an iron arm, in a gold collar on a sandstone block: the brightest thing on any map, visible from far."""
    reset()
    M = IM()
    pid = f'lever_{state}'
    h = 0.32
    stone = []
    block_cluster(stone, M, 0.78, h, 'b')
    stone = rounded(join(stone, 'lv_stone'), 0.018, segments=1)
    ang = math.radians(32)
    L = 0.56
    base = Vector((0, 0.0, h + (0.0 if state == 'up' else 0.13)))
    tip = base + Vector((0, math.sin(ang) * L, math.cos(ang) * L))
    if state == 'down':
        tip = Vector((0, -0.4, 0.2))
    gold = [
        lathe('collar', (0, 0), [(0.25, h - 0.015), (0.27, h + 0.01), (0.27, h + 0.055), (0.21, h + 0.07), (0.15, h + 0.065), (0.15, h - 0.015)], M.gold2, seg=12),
        lathe('hole', (0, 0), [(0.155, h + 0.03), (0.155, h + 0.035)], M.dark, seg=12),
        ball('knob', tuple(tip + (tip - base).normalized() * 0.06), 0.13, M.gold2, sub=3),
    ]
    for i in range(3):
        a = 2 * math.pi * i / 3 + 0.5
        gold.append(rivet(f'rv{i}', (math.cos(a) * 0.21, math.sin(a) * 0.21, h + 0.075), 0.024, M.iron2, axis='z'))
    u = (tip - base).normalized()
    side = Vector((1, 0, 0))
    nrm = u.cross(side)
    w0, w1, d = 0.075, 0.06, 0.045
    start = base - u * 0.03
    arm = loft('arm', [
        [tuple(start + side * sx * w0 + nrm * sn * d) for sx, sn in ((-1, -1), (1, -1), (1, 1), (-1, 1))],
        [tuple(tip + side * sx * w1 + nrm * sn * d * 0.8) for sx, sn in ((-1, -1), (1, -1), (1, 1), (-1, 1))],
    ], M.iron2)
    finish2(join([stone, *gold, arm], pid), pid, 512)


def lid_arc(w_y, h, y0=0.0, z0=0.0, n=7, inner=0.0):
    """Half-barrel outline in (y, z) from the south edge over the top to the north edge."""
    out = []
    for i in range(n + 1):
        a = math.pi * i / n
        out.append((y0 - math.cos(a) * w_y, z0 + math.sin(a) * h))
    if inner:
        for i in range(n, -1, -1):
            a = math.pi * i / n
            out.append((y0 - math.cos(a) * (w_y - inner), z0 + math.sin(a) * (h - inner)))
    return out


def chest(state):
    """Honey oak, wide gold bands, big gold lock plate; open: heaped coins and a goblet."""
    reset()
    M = IM()
    pid = f'chest_b_{state}'
    wx, wy, hb = 0.72, 0.5, 0.3
    z0 = 0.03
    top = z0 + hb
    wood = []
    gold = []
    if state == 'closed':
        wood.append(box('body', (0, 0, z0 + hb / 2), (wx, wy, hb), M.woodh, skip=('-z',)))
    else:
        wood.append(box('floor', (0, 0, z0 + 0.04), (wx, wy, 0.08), M.woodh, skip=('-z',)))
        wood.append(box('front', (0, -wy / 2 + 0.03, z0 + hb / 2), (wx, 0.06, hb), M.woodh, skip=('-z',)))
        wood.append(box('backw', (0, wy / 2 - 0.03, z0 + hb / 2), (wx, 0.06, hb), M.woodh, skip=('-z',)))
        wood.append(box('westw', (-wx / 2 + 0.03, 0, z0 + hb / 2), (0.06, wy, hb), M.woodh, skip=('-z',)))
        wood.append(box('eastw', (wx / 2 - 0.03, 0, z0 + hb / 2), (0.06, wy, hb), M.woodh, skip=('-z',)))
    wood = rounded(join(wood, 'ch_wood'), 0.01, segments=1)
    # gold frame
    gold.append(box('rimB', (0, 0, z0 + 0.025), (wx + 0.05, wy + 0.05, 0.05), M.gold2, skip=('-z',)))
    for x in (-1, 1):
        for y in (-1, 1):
            gold.append(box(f'cn{x}{y}', (x * (wx / 2 - 0.02), y * (wy / 2 - 0.02), z0 + hb / 2), (0.085, 0.085, hb), M.gold2))
    gold.append(box('rimTs', (0, -wy / 2 - 0.005, top - 0.02), (wx + 0.03, 0.03, 0.05), M.gold2))
    gold.append(box('rimTw', (-wx / 2, 0, top - 0.02), (0.03, wy, 0.05), M.gold2))
    gold.append(box('rimTe', (wx / 2, 0, top - 0.02), (0.03, wy, 0.05), M.gold2))
    gold = [rounded(join(gold, 'ch_gold'), 0.009, segments=1)]
    # lock plate
    plate = [(0.0, 0.2), (0.075, 0.17), (0.095, 0.1), (0.095, 0.02), (0.0, -0.06), (-0.095, 0.02), (-0.095, 0.1), (-0.075, 0.17)]
    px, pz = 0, top - 0.25 + 0.03
    gold.append(extrude_y('plate', [(px + a, pz + b) for a, b in plate], -wy / 2 - 0.03, -wy / 2 + 0.005, M.gold2))
    gold.append(extrude_y('hole', [(px - 0.016, pz + 0.0), (px + 0.016, pz + 0.0), (px + 0.008, pz + 0.05), (px + 0.024, pz + 0.075), (px + 0.012, pz + 0.105), (px - 0.012, pz + 0.105), (px - 0.024, pz + 0.075), (px - 0.008, pz + 0.05)], -wy / 2 - 0.036, -wy / 2 - 0.02, M.black))
    for sx in (-1, 1):
        for k, z in enumerate((z0 + 0.06, top - 0.09)):
            gold.append(rivet(f'rs{sx}{k}', (sx * (wx / 2 - 0.02), -wy / 2 - 0.066, z), 0.024, M.dark))
    # lid
    def place(pts):
        if state == 'closed':
            return [(a, b + top) for a, b in pts]
        # hinged at the north edge: swung back past the vertical
        hy, hz = wy / 2 + 0.01, top
        ang = math.radians(112)
        res = []
        for a, b in pts:
            da, db = a - (wy / 2 + 0.01), b
            res.append((hy + da * math.cos(ang) + db * math.sin(ang), hz - da * math.sin(ang) + db * math.cos(ang)))
        return res
    shell = lid_arc(wy / 2 + 0.01, 0.2, inner=0.045)
    lid = [prism('lid', place(shell), 'x', -wx / 2 + 0.02, wx / 2 - 0.02, M.woodh)]
    for k, s in enumerate((-1, 0, 1)):
        x = s * (wx / 2 - 0.035)
        w = 0.05 if s else 0.04
        rim = lid_arc(wy / 2 + 0.03, 0.22, inner=0.065 if s else 0.032)
        lid.append(prism(f'band{k}', place(rim), 'x', x - w, x + w, M.gold2))
    if state == 'open':
        lidin = lid_arc(wy / 2 - 0.035, 0.155)
        lid.append(prism('lidback', place(lidin), 'x', -wx / 2 + 0.05, -wx / 2 + 0.055, M.woodh))
        lid.append(prism('lidbackb', place(lidin), 'x', wx / 2 - 0.055, wx / 2 - 0.05, M.woodh))
        # coins: a bright gold heap, covered in real overlapping coins with a darker edge
        heapm = paint('heapg', [(0.0, lin(128, 82, 20)), (1.0, lin(206, 148, 42))], wn=0.6, noise=0.3, nscale=22, seed=99.0)
        heap = lathe('heap', (0, 0), [(0.2, z0 + 0.1), (0.2, z0 + 0.22), (0.15, z0 + 0.275), (0.05, z0 + 0.295)], heapm, seg=8)
        for v in heap.data.vertices:
            v.co.x *= 1.55
        lid.append(heap)
        rng = random.Random(4)
        face = paint('coinf', [(0.0, lin(214, 150, 38)), (0.6, lin(246, 196, 70)), (1.0, lin(255, 230, 130))], wn=1.0, noise=0.1, nscale=40, seed=71.0, bias=0.15)
        edge = flat_mat('coine', lin(150, 96, 22))
        spots = []
        for ring, (cnt, rad, zz) in enumerate(((11, 0.28, 0.23), (8, 0.18, 0.272), (4, 0.08, 0.3))):
            for i in range(cnt):
                a = 2 * math.pi * (i + rng.uniform(-0.2, 0.2)) / cnt + ring * 0.4
                spots.append((math.cos(a) * rad * rng.uniform(0.92, 1.08), math.sin(a) * rad * 0.62 * rng.uniform(0.9, 1.1) - 0.02, z0 + zz + rng.uniform(-0.008, 0.008)))
        for i, (x, y, z) in enumerate(spots):
            cr = rng.uniform(0.046, 0.06)
            tx, ty = rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4)
            ang = [2 * math.pi * k / 7 for k in range(7)]
            ring0 = [(x + math.cos(t) * cr, y + math.sin(t) * cr, z + math.cos(t) * tx * cr + math.sin(t) * ty * cr) for t in ang]
            ring1 = [(p[0], p[1], p[2] + 0.014) for p in ring0]
            ring2 = [(x + (p[0] - x) * 0.72, y + (p[1] - y) * 0.72, p[2] + 0.002) for p in ring1]
            lid.append(loft(f'coine{i}', [ring0, ring1], edge, cap=False))
            lid.append(loft(f'coinf{i}', [ring1, ring2], face))
        # goblet
        lid.append(lathe('gob', (0.14, 0.04), [(0.065, z0 + 0.31), (0.065, z0 + 0.325), (0.02, z0 + 0.35), (0.022, z0 + 0.46), (0.085, z0 + 0.52), (0.095, z0 + 0.6), (0.075, z0 + 0.6), (0.06, z0 + 0.54)], M.gold2, seg=10))
    finish2(join([wood, *gold, *lid], pid), pid, 512)


def ballista_idle():
    """Oak ballista on a round pedestal of big blocks, bolt to the south, iron bow, rope, crank wheel at the back."""
    reset()
    M = IM()
    h = 0.26
    ped = [lathe('core', (0, 0), [(0.36, 0.0), (0.36, h - 0.02), (0.3, h)], M.sand_round if hasattr(M, 'sand_round') else M.sand, seg=16)]
    for i in range(8):
        a = 2 * math.pi * i / 8 + 0.39
        ped.append(box(f'bl{i}', (math.cos(a) * 0.35, math.sin(a) * 0.35, h * 0.44), (0.285, 0.16, h * 0.88), M.sand2, rot=(0, 0, a + math.pi / 2), skip=('-z',)))
    ped = rounded(join(ped, 'ba_stone'), 0.016, segments=1)
    # turntable and frame; everything tilts slightly up towards the south
    pitch = math.radians(8)
    def P(x, y, z):
        return (x, y, h + 0.22 + z + (-y) * math.tan(pitch))
    wood = [
        lathe('turn', (0, 0), [(0.2, h - 0.005), (0.2, h + 0.03), (0.16, h + 0.05)], M.iron2, seg=12),
        box('post', (0, 0.02, h + 0.11), (0.16, 0.26, 0.14), M.wooddark),
        beam('stock', P(0, 0.42, -0.02), P(0, -0.36, -0.02), 0.09, M.woodh),
    ]
    for s in (-1, 1):
        wood.append(beam(f'rail{s}', P(s * 0.1, 0.34, 0.01), P(s * 0.1, -0.3, 0.01), 0.075, M.woodh))
        wood.append(beam(f'up{s}', P(s * 0.12, -0.14, -0.18), P(s * 0.12, -0.14, 0.14), 0.07, M.wooddark))
        wood.append(beam(f'bk{s}', P(s * 0.17, 0.34, -0.03), P(s * 0.17, 0.34, 0.15), 0.07, M.wooddark))
    wood.append(beam('xb0', P(-0.16, -0.14, 0.1), P(0.16, -0.14, 0.1), 0.07, M.woodh))
    wood.append(beam('xb1', P(-0.2, 0.34, 0.13), P(0.2, 0.34, 0.13), 0.075, M.woodh))
    wood = [rounded(join(wood, 'ba_wood'), 0.008, segments=1, angle=40)]
    # bow: a flat iron arc with tips swept north
    pts = []
    for i in range(9):
        t = -1 + 2 * i / 8
        pts.append(P(t * 0.47, -0.2 + 0.2 * t * t, 0.03))
    bow = [tube('bow', pts, 0.04, M.iron2, sides=4)]
    for s in (-1, 1):
        bow.append(box(f'tip{s}', P(s * 0.47, 0.0, 0.03), (0.075, 0.075, 0.095), M.dark))
        bow.append(beam(f'str{s}', P(s * 0.47, 0.0, 0.03), P(0, 0.17, 0.08), 0.032, M.rope))
    bow.append(box('collar', P(0, -0.2, 0.03), (0.2, 0.1, 0.1), M.iron2))
    # bolt with a big iron head
    bow.append(beam('bolt', P(0, 0.17, 0.08), P(0, -0.34, 0.08), 0.028, M.frame))
    bow.append(loft('head', [
        [P(-0.07, -0.33, 0.08), P(0, -0.33, 0.1), P(0.07, -0.33, 0.08), P(0, -0.33, 0.06)],
        [P(0, -0.47, 0.08)],
    ], M.iron2, cap=False))
    # crank wheel at the back on the east side
    wx = 0.26
    wy, wz = 0.34, P(0, 0.34, 0.13)[2]
    bow.append(lathe_x('hub', (wy, wz), [(0.018, 0.2), (0.018, wx + 0.02)], M.iron2, seg=6))
    bow.append(lathe_x('disc', (wy, wz), [(0.055, wx - 0.012), (0.055, wx + 0.016)], M.iron2, seg=8))
    for i in range(6):
        a = 2 * math.pi * i / 6 + 0.3
        ca, sa = math.cos(a), math.sin(a)
        bow.append(beam(f'sp{i}', (wx, wy + ca * 0.04, wz + sa * 0.04), (wx, wy + ca * 0.14, wz + sa * 0.14), 0.036, M.woodm))
        bow.append(ball(f'hd{i}', (wx, wy + ca * 0.16, wz + sa * 0.16), 0.032, M.woodh, sub=1))
    finish2(join([ped, *wood, *bow], 'ballista_idle'), 'ballista_idle', 512)


# ---------------------------------------------------------------- height pieces
# Their shape along the rise (steps, where the slope starts and ends) is copied in content/core/render.yaml board.connectors:
# a figure stands on that surface (story 15.13). Change both together.

def ramp_idle():
    """Continuous paved slope for everybody (carts and horses): smooth, wide, low stone curbs."""
    reset()
    M = IM()
    rng = random.Random(9)
    h = WALL_H
    ang = math.atan2(h, 1.0)
    def Z(y):
        return (y + 0.5) * h
    wedge = loft('wedge', [
        [(-0.37, -0.5, 0.0), (0.37, -0.5, 0.0), (0.37, -0.5, 0.012), (-0.37, -0.5, 0.012)],
        [(-0.37, 0.5, 0.0), (0.37, 0.5, 0.0), (0.37, 0.5, h), (-0.37, 0.5, h)],
    ], paint('earth', [(0.0, lin(146, 98, 54)), (0.5, lin(180, 128, 74)), (1.0, lin(208, 158, 100))], wn=0.25, noise=0.28, nscale=26, seed=94.0))
    parts = [wedge]
    stones = []
    # paving stones lying in the slope
    cols = [(-0.15, -0.38), (0.1, -0.3), (-0.05, -0.14), (0.17, -0.05), (-0.17, 0.05), (0.04, 0.17), (-0.13, 0.3), (0.15, 0.32), (-0.2, -0.22), (0.2, -0.47 + 0.07)]
    for i, (x, y) in enumerate(cols):
        w, d = rng.uniform(0.13, 0.19), rng.uniform(0.09, 0.14)
        stones.append(box(f'pv{i}', (x, y, Z(y) + 0.006), (w * 1.15, d * 1.1 / math.cos(ang), 0.02), M.pave, rot=(ang, 0, rng.uniform(-0.15, 0.15))))
    for s in (-1, 1):
        # solid side wall under the curb and the curb itself of big blocks along the slope
        parts.append(loft(f'side{s}', [
            [(s * 0.36, -0.5, 0.0), (s * 0.5, -0.5, 0.0), (s * 0.5, -0.5, 0.11), (s * 0.36, -0.5, 0.11)],
            [(s * 0.36, 0.5, 0.0), (s * 0.5, 0.5, 0.0), (s * 0.5, 0.5, h + 0.03), (s * 0.36, 0.5, h + 0.03)],
        ], M.sand))
        n = 5
        for i in range(n):
            y = -0.5 + (i + 0.5) / n
            stones.append(box(f'cb{s}{i}', (s * 0.43, y, Z(y) + 0.09), (0.15, 0.185 / math.cos(ang), 0.11), M.sand2, rot=(ang, 0, 0)))
    parts.append(box('sill', (0, -0.485, 0.012), (1.0, 0.04, 0.026), M.sand))
    stones = rounded(join(stones, 'rp_stones'), 0.012, segments=1)
    finish2(join([stones, *parts], 'ramp_idle'), 'ramp_idle', 512, ghost=wall_ghost)


def stairs_idle():
    """Five big steps for walkers, no horses; light tread edges so every step reads from above; low stepped side walls."""
    reset()
    M = IM()
    n = 5
    h = WALL_H
    rise, run = h / n, 1.0 / n
    riser = tri_mat('riser', 'kit_stone.png', 0.75, (0.66, 0.52, 0.38))
    parts = []
    for i in range(n):
        y0 = -0.5 + i * run
        z = rise * (i + 1)
        parts.append(box(f'st{i}', (0, (y0 + 0.5) / 2, z / 2), (0.74, 0.5 - y0, z), riser, skip=('-z',)))
        parts.append(box(f'tr{i}', (0, y0 + run / 2 + 0.03, z - 0.004), (0.74, run - 0.06, 0.016), M.sand))
        parts.append(box(f'ed{i}', (0, y0 + 0.045, z - 0.015), (0.76, 0.1, 0.05), M.sand2))
    for s in (-1, 1):
        for i in range(n):
            y0 = -0.5 + i * run
            z = rise * (i + 1)
            parts.append(box(f'sw{s}{i}', (s * 0.44, y0 + run / 2, (z + 0.09) / 2), (0.12, run + 0.002, z + 0.09), M.sand, skip=('-z',)))
            parts.append(box(f'sc{s}{i}', (s * 0.44, y0 + run / 2, z + 0.1), (0.14, run - 0.012, 0.07), M.sand2))
    finish2(rounded(join(parts, 'stairs_idle'), 0.012, segments=1), 'stairs_idle', 512, ghost=wall_ghost)


def ladder_idle():
    """Narrow log ladder in the middle of the tile, only on foot: the ground stays visible on both sides."""
    reset()
    M = IM()
    foot, topz = -0.26, WALL_H + 0.14
    def Y(z):
        return foot + z * (0.47 - foot) / WALL_H
    parts = []
    for s in (-1, 1):
        parts.append(tube(f'rail{s}', [(s * 0.17, Y(0.0), 0.0), (s * 0.17, Y(topz / 2), topz / 2), (s * 0.17, Y(topz), topz)], 0.042, M.woodr, sides=7))
        parts.append(ball(f'cap{s}', (s * 0.17, Y(topz), topz), 0.042, M.woodr, sub=1))
    n = 5
    for i in range(n):
        z = 0.12 + i * 0.165
        y = Y(z) - 0.012
        parts.append(tube(f'rung{i}', [(-0.235, y, z), (0.235, y, z)], 0.034, M.woodr, sides=6))
        for s in (-1, 1):
            parts.append(box(f'ta{s}{i}', (s * 0.17, y - 0.035, z), (0.13, 0.02, 0.026), M.rope, rot=(0, math.radians(38), 0)))
            parts.append(box(f'tb{s}{i}', (s * 0.17, y - 0.035, z), (0.13, 0.02, 0.026), M.rope, rot=(0, math.radians(-38), 0)))
    finish2(join(parts, 'ladder_idle'), 'ladder_idle', 512, ghost=wall_ghost)


# ---------------------------------------------------------------- palace

def bookshelf_a():
    """A shelf as a wall (N7): full tile wide, taller than a figure, but shallow: from the board camera the books dominate, the top is a framed board with a few things on it."""
    reset()
    M = IM()
    h = 1.06
    f = -0.26  # south face of the carcass
    b = 0.16
    d = b - f
    oak = [
        box('body', (0, (f + b) / 2 + 0.03, h / 2), (0.98, d - 0.06, h), M.wooddark, skip=('-z',)),
        box('topb', (0, (f + b) / 2, h + 0.025), (1.0, d + 0.04, 0.05), M.woodm),
        box('plinth', (0, f - 0.03, 0.05), (1.0, 0.09, 0.1), M.woodm, skip=('-z',)),
    ]
    for s in (-1, 1):
        oak.append(box(f'post{s}', (s * 0.46, f + 0.0, h / 2), (0.08, 0.14, h), M.woodm, skip=('-z',)))
        oak.append(box(f'cap{s}', (s * 0.45, f + 0.0, h + 0.07), (0.11, 0.16, 0.1), M.woodm))
    zs = [0.1, 0.42, 0.72, 1.0]
    for i, z in enumerate(zs[1:]):
        oak.append(box(f'sh{i}', (0, f + 0.03, z), (0.86, 0.1, 0.038), M.woodm))
    # framed top: moulding round a darker inset
    oak.append(box('rimS', (0, f - 0.0, h + 0.065), (0.8, 0.05, 0.03), M.woodm))
    oak.append(box('rimN', (0, b + 0.0, h + 0.065), (0.98, 0.05, 0.03), M.woodm))
    oak.append(box('rimW', (-0.47, (f + b) / 2, h + 0.065), (0.05, d, 0.03), M.woodm))
    oak.append(box('rimE', (0.47, (f + b) / 2, h + 0.065), (0.05, d, 0.03), M.woodm))
    oak = rounded(join(oak, 'bs_oak'), 0.012, segments=1)
    parts = []
    # gable with a gold crown
    arc = []
    for i in range(9):
        a = math.pi * i / 8
        arc.append((-math.cos(a) * 0.36, h + 0.03 + math.sin(a) * 0.17))
    parts.append(extrude_y('gable', arc, f - 0.045, f + 0.055, M.woodm))
    crown(parts, M.gold2, 0, f - 0.05, h + 0.045, 0.15, prefix='cr')
    # book rows: the image repeats along the row with an offset per row
    for i in range(3):
        z0, z1 = zs[i] + 0.025, zs[i + 1] - 0.03
        off = (0.0, 0.27, 0.55)[i]
        B = panel_mat(f'books{i}', 'interior_books.png', (-0.42 + off, z0, 0.3 + off, z1), 'xz', (1.05, 1.0, 1.02))
        parts.append(box(f'row{i}', (0, f + 0.08, (z0 + z1) / 2), (0.84, 0.18, z1 - z0), B))
    # one leaning book per row breaks the line: first or second spine of the image
    for i, (x, tilt, first) in enumerate(((0.3, -0.3, 1), (-0.22, 0.25, 0), (0.14, -0.28, 1))):
        z0, z1 = zs[i] + 0.025, zs[i + 1] - 0.03
        u0 = x - 0.04 - first * 0.085
        B = panel_mat(f'lean{i}', 'interior_books.png', (u0, z0, u0 + 0.51, z1), 'xz', (1.05, 1.0, 1.02))
        parts.append(box(f'lb{i}', (x, f + 0.025, (z0 + z1) / 2 - 0.012), (0.075, 0.09, (z1 - z0) * 0.84), B, rot=(0, tilt, 0)))
    # on top: a stack of lying books and a scroll roll, so the board is not bare
    red = flat_mat('bk_red', lin(122, 40, 44))
    ochre = flat_mat('bk_och', lin(186, 128, 54))
    for k, (x, y, w, dp, th, m, r) in enumerate(((0.24, 0.02, 0.2, 0.14, 0.035, red, 0.1), (0.25, 0.02, 0.17, 0.12, 0.03, ochre, -0.12), (-0.26, 0.03, 0.17, 0.12, 0.035, ochre, 0.2))):
        z = h + 0.05 + (0.0175 if k != 1 else 0.05)
        parts.append(box(f'lie{k}', (x, y, z), (w, dp, th), m, rot=(0, 0, r)))
    parch = flat_mat('bk_par', lin(226, 204, 158))
    parts.append(beam('scroll', (-0.12, -0.04, h + 0.07), (0.08, -0.02, h + 0.07), 0.04, parch))
    finish2(join([oak, *parts], 'bookshelf_a'), 'bookshelf_a', 512)


def carpet_a():
    """Flat woven runner over the whole tile length, fringes on both ends; wine, gold, no team colour."""
    reset()
    M = IM()
    w, l = 0.82, 0.92
    P = panel_mat('carpet', 'interior_carpet.png', (-w / 2, -l / 2, w / 2, l / 2), 'xy', (0.74, 0.66, 0.92))
    parts = [box('c', (0, 0, 0.012), (w, l, 0.024), P, skip=('-z',))]
    for y, tag in ((-0.48, 's'), (0.48, 'n')):
        for i in range(13):
            x = -w / 2 + (i + 0.5) * w / 13
            parts.append(box(f'f{tag}{i}', (x, y, 0.008), (w / 13 * 0.72, 0.05, 0.016), M.gold2, skip=('-z',)))
    finish2(join(parts, 'carpet_a'), 'carpet_a', 256)


# ---------------------------------------------------------------- mine

def mine_cart_idle():
    reset()
    M = IM()
    rng = random.Random(33)
    z0, z1 = 0.17, 0.46
    def ring(wx, wy, z):
        return [(-wx, -wy, z), (wx, -wy, z), (wx, wy, z), (-wx, wy, z)]
    tub = loft('tub', [ring(0.24, 0.32, z0), ring(0.31, 0.39, z1), ring(0.27, 0.35, z1), ring(0.24, 0.32, z1 - 0.05)], M.woodr)
    parts = [tub]
    for s in (-1, 1):
        # iron straps on the south and north ends and rim
        parts.append(beam(f'stS{s}', (s * 0.15, -0.325, z0 - 0.01), (s * 0.19, -0.4, z1 + 0.012), 0.05, M.rail))
        parts.append(beam(f'stN{s}', (s * 0.15, 0.325, z0 - 0.01), (s * 0.19, 0.4, z1 + 0.012), 0.05, M.rail))
        parts.append(beam(f'stW{s}', (s * 0.245, 0, z0 - 0.01), (s * 0.325, 0, z1 + 0.012), 0.05, M.rail))
    parts.append(box('under', (0, 0, z0 - 0.015), (0.42, 0.68, 0.05), M.rail))
    parts.append(box('rS', (0, -0.395, z1 - 0.01), (0.66, 0.035, 0.04), M.rail))
    parts.append(box('rN', (0, 0.395, z1 - 0.01), (0.66, 0.035, 0.04), M.rail))
    for y in (-0.22, 0.22):
        parts.append(lathe_x(f'ax{y}', (y, 0.118), [(0.022, -0.32), (0.022, 0.32)], M.dark, seg=6))
        for s in (-1, 1):
            x = s * 0.27
            a, b = (x - 0.03, x + 0.03) if s < 0 else (x - 0.03, x + 0.03)
            parts.append(lathe_x(f'wh{y}{s}', (y, 0.118), [(0.105, a), (0.118, a + 0.012), (0.118, b - 0.012), (0.105, b)], M.rail, seg=10))
            hub = x + s * 0.033
            parts.append(lathe_x(f'hb{y}{s}', (y, 0.118), [(0.038, hub - 0.012), (0.03, hub + 0.012)], M.rust, seg=6))
    # ore heap of big angular lumps
    ore = []
    for i, (x, y, z, r) in enumerate(((0, 0.0, 0.62, 0.17), (-0.15, -0.17, 0.54, 0.12), (0.14, -0.2, 0.54, 0.12), (-0.16, 0.17, 0.54, 0.12), (0.16, 0.16, 0.54, 0.12), (0, -0.24, 0.52, 0.11), (0.0, 0.26, 0.52, 0.1), (-0.2, 0, 0.53, 0.1), (0.2, 0, 0.53, 0.1))):
        o = ball(f'ore{i}', (x, y, z), r, M.ore, sub=1, squash=(1.0, 1.0, 0.95))
        for v in o.data.vertices:
            v.co += Vector((rng.uniform(-0.018, 0.018), rng.uniform(-0.018, 0.018), rng.uniform(-0.018, 0.018)))
        ore.append(o)
    for i, (x, y, z) in enumerate(((-0.08, -0.16, 0.655), (0.09, 0.03, 0.76), (0.2, -0.22, 0.63))):
        ore.append(ball(f'cu{i}', (x, y, z), 0.016, M.copper, sub=1))
    finish2(join([*parts, *ore], 'mine_cart_idle'), 'mine_cart_idle', 512)


def rail_parts(M, y0, y1, n, off=0.0):
    parts = []
    step = (y1 - y0) / n
    for i in range(n):
        y = y0 + (i + 0.5) * step + off
        parts.append(box(f'sl{i}', (0, y, 0.025), (0.74, 0.13, 0.05), M.woodr, skip=('-z',)))
        for s in (-1, 1):
            parts.append(rivet(f'bl{s}{i}a', (s * 0.2 - 0.07, y, 0.054), 0.024, M.dark, axis='z'))
            parts.append(rivet(f'bl{s}{i}b', (s * 0.2 + 0.07, y, 0.054), 0.024, M.dark, axis='z'))
    for s in (-1, 1):
        parts.append(box(f'rail{s}', (s * 0.2, (y0 + y1) / 2, 0.08), (0.075, y1 - y0, 0.06), M.rail))
    return parts


def mine_track_a():
    reset()
    M = IM()
    finish2(join(rail_parts(M, -0.5, 0.5, 4), 'mine_track_a'), 'mine_track_a', 256)


def lantern(parts, M, x, y, z):
    parts.append(tube('hook', [(x, y, z + 0.2), (x + 0.016, y, z + 0.15), (x, y, z + 0.1)], 0.012, M.rail, sides=4))
    parts.append(loft('lroof', [circle((x, y), 0.085, z + 0.04, 6), circle((x, y), 0.035, z + 0.11, 6)], M.rail))
    parts.append(lathe('lglass', (x, y), [(0.058, z - 0.13), (0.065, z + 0.04)], M.glass, seg=6))
    parts.append(lathe('lbase', (x, y), [(0.08, z - 0.155), (0.08, z - 0.12)], M.rail, seg=6))
    for i in range(3):
        a = 2 * math.pi * i / 3 - math.pi / 2
        parts.append(beam(f'lb{i}', (x + math.cos(a) * 0.07, y + math.sin(a) * 0.07, z - 0.13), (x + math.cos(a) * 0.078, y + math.sin(a) * 0.078, z + 0.05), 0.016, M.rail))


def mine_support_a():
    """Two thick flared posts, heavy lintel with iron wraps, braces, lantern; the middle is open and walkable."""
    reset()
    M = IM()
    top = 0.98
    parts = []
    for s in (-1, 1):
        x = s * 0.39
        parts.append(loft(f'post{s}', [
            [(x - 0.11, -0.12, 0.0), (x + 0.11, -0.12, 0.0), (x + 0.11, 0.12, 0.0), (x - 0.11, 0.12, 0.0)],
            [(x - 0.08, -0.09, 0.14), (x + 0.08, -0.09, 0.14), (x + 0.08, 0.09, 0.14), (x - 0.08, 0.09, 0.14)],
            [(x - 0.075, -0.085, top), (x + 0.075, -0.085, top), (x + 0.075, 0.085, top), (x - 0.075, 0.085, top)],
        ], M.woodv))
        parts.append(beam(f'br{s}', (s * 0.33, 0, top - 0.26), (s * 0.13, 0, top + 0.01), 0.07, M.woodm))
    parts.append(box('lintel', (0, 0, top + 0.08), (1.0, 0.2, 0.17), M.woodm))
    wood = rounded(join(parts, 'su_wood'), 0.013, segments=1)
    iron = []
    for s in (-1, 1):
        x = s * 0.33
        iron.append(box(f'wr{s}', (x, 0, top + 0.08), (0.1, 0.225, 0.2), M.rail))
        for dz in (-0.05, 0.05):
            iron.append(rivet(f'rv{s}{dz}', (x, -0.114, top + 0.08 + dz), 0.016, M.dark))
    lantern(iron, M, 0.17, 0, top - 0.2)
    finish2(join([wood, *iron], 'mine_support_a'), 'mine_support_a', 512)


def mine_entrance_a():
    """Lump of dark rock over the whole tile, timber portal on the south, black mouth, rails running out."""
    reset()
    M = IM()
    rng = random.Random(61)
    rock = []
    # shell around the mouth: the opening is x -0.24 .. 0.24, up to z = 0.72, on the south side
    spots = [(-0.46, -0.26, 0.18, 0.2, 0.42), (0.46, -0.26, 0.18, 0.2, 0.38), (-0.44, 0.08, 0.24, 0.32, 0.74), (0.44, 0.08, 0.24, 0.32, 0.7), (-0.2, 0.3, 0.3, 0.24, 1.0), (0.22, 0.3, 0.3, 0.24, 0.94),
             (-0.33, -0.08, 0.17, 0.2, 0.92), (0.33, -0.08, 0.17, 0.2, 0.88), (0.0, -0.02, 0.32, 0.27, 1.14), (-0.48, -0.42, 0.11, 0.1, 0.2), (0.47, -0.43, 0.12, 0.1, 0.17)]
    for i, (x, y, rx, ry, top) in enumerate(spots):
        if top < 0.9:
            rock.append(boulder(f'r{i}', (x, y), rx, ry, top, rng, M.cave))
        else:
            rock.append(slab(f'r{i}', (x, y), rx, ry, 0.68, top, (rng.uniform(-0.2, 0.2), rng.uniform(-0.15, 0.1)), rng, M.cave))
    rock.append(box('backwall', (0, 0.34, 0.45), (0.8, 0.3, 0.9), M.cave, skip=('-z',)))
    wood = []
    y = -0.26
    for s in (-1, 1):
        wood.append(box(f'post{s}', (s * 0.29, y, 0.37), (0.12, 0.13, 0.74), M.woodv, skip=('-z',)))
        wood.append(beam(f'br{s}', (s * 0.24, y - 0.01, 0.53), (s * 0.1, y - 0.01, 0.72), 0.055, M.woodm))
    wood.append(box('lintel', (0, y, 0.79), (0.84, 0.16, 0.14), M.woodm))
    wood = rounded(join(wood, 'en_wood'), 0.012, segments=1)
    rest = [
        box('back', (0, 0.08, 0.37), (0.56, 0.1, 0.74), M.black, skip=('-z',)),
        box('ceil', (0, -0.09, 0.76), (0.56, 0.36, 0.04), M.dark),
        box('fl0', (0, -0.2, 0.004), (0.5, 0.16, 0.008), M.dark),
        box('fl1', (0, -0.02, 0.004), (0.5, 0.2, 0.008), M.black),
    ]
    for s in (-1, 1):
        rest.append(box(f'in{s}', (s * 0.255, -0.08, 0.37), (0.05, 0.36, 0.74), M.wooddark))
        rest.append(box(f'wr{s}', (s * 0.29, y, 0.79), (0.1, 0.18, 0.17), M.rail))
        rest.append(rivet(f'rv{s}', (s * 0.29, y - 0.09, 0.79), 0.02, M.dark))
    rest += [p for p in rail_parts(M, -0.5, 0.03, 3)]
    finish2(join([*rock, wood, *rest], 'mine_entrance_a'), 'mine_entrance_a', 512)


def dragon_bones_a():
    """Two tiles wide (x -1 .. 1), origin in the middle: a rock lump with a horned skull on the west and ribs on the east."""
    reset()
    M = IM()
    rng = random.Random(77)
    rock = []
    spots = [(-0.1, 0.22, 0.45, 0.26, 0.95), (0.45, 0.2, 0.4, 0.28, 0.82), (-0.6, 0.22, 0.32, 0.24, 0.72), (0.86, 0.1, 0.17, 0.3, 0.5), (-0.82, 0.05, 0.16, 0.3, 0.42),
             (-0.72, -0.32, 0.2, 0.15, 0.2), (-0.32, -0.32, 0.26, 0.16, 0.26), (0.14, -0.36, 0.26, 0.13, 0.34), (0.55, -0.34, 0.22, 0.14, 0.28), (0.86, -0.32, 0.12, 0.12, 0.17), (0.3, -0.05, 0.42, 0.2, 0.46)]
    for i, (x, y, rx, ry, top) in enumerate(spots):
        rock.append(slab(f'r{i}', (x, y), rx, ry, -0.01, top, (rng.uniform(-0.2, 0.2), rng.uniform(-0.15, 0.1)), rng, M.cave))
    B = M.bone
    bones = []
    # skull: cross sections along the snout, from the back of the head (east) to the nose (west)
    def sect(x, wy, zb, zt, yc=-0.12):
        return [(x, yc - wy, zb + (zt - zb) * 0.25), (x, yc - wy * 0.5, zb), (x, yc + wy * 0.5, zb), (x, yc + wy, zb + (zt - zb) * 0.25),
                (x, yc + wy * 0.85, zb + (zt - zb) * 0.75), (x, yc + wy * 0.3, zt), (x, yc - wy * 0.3, zt), (x, yc - wy * 0.85, zb + (zt - zb) * 0.75)]
    head = [loft('skull', [sect(-0.08, 0.13, 0.36, 0.58), sect(-0.18, 0.21, 0.3, 0.7), sect(-0.33, 0.24, 0.3, 0.72), sect(-0.46, 0.17, 0.32, 0.6), sect(-0.58, 0.115, 0.32, 0.47), sect(-0.74, 0.1, 0.31, 0.43), sect(-0.86, 0.115, 0.3, 0.44), sect(-0.97, 0.06, 0.32, 0.38)], B)]
    head.append(loft('jaw', [sect(-0.2, 0.15, 0.08, 0.2), sect(-0.5, 0.125, 0.07, 0.17), sect(-0.74, 0.1, 0.04, 0.14), sect(-0.9, 0.07, 0.04, 0.12)], B))
    head.append(beam('hinge', (-0.25, -0.14, 0.14), (-0.27, -0.14, 0.34), 0.11, B))
    # the two big sockets look up and to the south, a heavy ridge over each, cheek arch below
    for yy in (-0.2, 0.0):
        head.append(ball(f'eye{yy}', (-0.33, yy - 0.0, 0.67), 0.085, M.socket, sub=2, squash=(1.25, 0.8, 0.5)))
        head.append(tube(f'brow{yy}', [(-0.48, yy - 0.02, 0.63), (-0.34, yy - 0.09 if yy < 0 else yy + 0.09, 0.73), (-0.18, yy - 0.02, 0.7)], [0.022, 0.036, 0.024], B, sides=5))
    head.append(tube('cheek', [(-0.52, -0.2, 0.4), (-0.34, -0.29, 0.44), (-0.14, -0.25, 0.42)], [0.024, 0.038, 0.03], B, sides=5))
    head.append(ball('fen', (-0.33, -0.27, 0.53), 0.07, M.socket, sub=2, squash=(1.2, 0.45, 0.7)))
    # nostrils on top of the snout, a groove between the nasal bones
    for yy in (-0.17, -0.07):
        head.append(ball(f'nose{yy}', (-0.87, yy, 0.435), 0.034, M.socket, sub=1, squash=(1.3, 0.7, 0.5)))
    head.append(tube('nasal', [(-0.82, -0.12, 0.445), (-0.66, -0.12, 0.47), (-0.48, -0.12, 0.6)], [0.012, 0.018, 0.022], M.socket, sides=4))
    # teeth
    for i in range(6):
        x = -0.48 - i * 0.085
        head.append(loft(f'tu{i}', [circle((x, -0.2), 0.03, 0.33, 4), [(x - 0.01, -0.21, 0.33 - 0.12 - (0.03 if i % 2 else 0))]], B, cap=False))
    for i in range(5):
        x = -0.52 - i * 0.085
        head.append(loft(f'tl{i}', [circle((x, -0.2), 0.026, 0.13, 4), [(x + 0.006, -0.21, 0.23)]], B, cap=False))
    # horns: thick, curved, with growth rings
    for k, (y, lift) in enumerate(((-0.18, 0.0), (0.1, 0.1))):
        pts = [(-0.14, y, 0.58), (0.02, y + 0.03, 0.72), (0.15, y + 0.07, 0.86 + lift), (0.24, y + 0.1, 1.03 + lift), (0.25, y + 0.11, 1.18 + lift), (0.19, y + 0.11, 1.3 + lift)]
        head.append(tube(f'horn{k}', pts, [0.095, 0.09, 0.07, 0.05, 0.028, 0.0], B, sides=6))
    # the head turns towards the south-west, so the camera sees its side
    ang = math.radians(24)
    ca, sa = math.cos(ang), math.sin(ang)
    px, py = -0.2, -0.1
    for o in head:
        for v in o.data.vertices:
            dx, dy = v.co.x - px, v.co.y - py
            v.co.x = px + ca * dx + sa * dy
            v.co.y = py - sa * dx + ca * dy
    bones += head
    # spine with plates
    spine = [(0.05 + i * 0.14, 0.04, 0.7 - i * 0.03 + 0.02 * math.sin(i)) for i in range(7)]
    bones.append(tube('spine', spine, [0.065, 0.065, 0.06, 0.056, 0.05, 0.045, 0.036], B, sides=5))
    for i, (x, y, z) in enumerate(spine):
        bones.append(loft(f'plate{i}', [[(x - 0.06, y - 0.04, z), (x + 0.06, y - 0.04, z), (x + 0.06, y + 0.04, z), (x - 0.06, y + 0.04, z)], [(x + 0.03, y, z + 0.15 - i * 0.008)]], B, cap=False))
    # ribs: thick curved arcs from the spine towards the south, sweeping back to the tail, so from above they read as a cage and not as a fence
    for i in range(5):
        x0 = 0.1 + i * 0.16
        z0 = spine[i + 1][2]
        h = z0 - 0.1
        depth = 0.4 + 0.03 * (2 - abs(i - 2))
        pts = []
        for k in range(8):
            t = k / 7
            a = math.pi * 0.5 * t
            pts.append((x0 - 0.05 * math.sin(a * 2) + 0.2 * t * t, 0.04 - math.sin(a) * depth, z0 + 0.05 + 0.06 * math.sin(a * 2) - (1 - math.cos(a)) * h))
        bones.append(tube(f'rib{i}', pts, [0.045, 0.055, 0.06, 0.058, 0.052, 0.045, 0.036, 0.024], B, sides=6))
    # low rocks in front of the rib ends and the jaw
    for i, (x, y, rx, ry, top) in enumerate(((0.1, -0.42, 0.2, 0.09, 0.22), (0.44, -0.42, 0.18, 0.09, 0.2), (0.74, -0.38, 0.14, 0.1, 0.18), (-0.5, -0.45, 0.16, 0.06, 0.09))):
        rock.append(boulder(f'f{i}', (x, y), rx, ry, top, rng, M.cave))
    finish2(join([*rock, *bones], 'dragon_bones_a'), 'dragon_bones_a', 1024)


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    jobs = {
        'sarcophagus_a': sarcophagus_a,
        'relief_a': relief_a,
        'pillar_a': pillar_a,
        'pillar_broken_a': pillar_broken_a,
        'pillar_temple_a': pillar_temple_a,
        'rubble_a': rubble_a,
        'torch_idle': torch_idle,
        'brazier_b_idle': brazier_b_idle,
        'banner_a': banner_a,
        'lever_up': lambda: lever('up'),
        'lever_down': lambda: lever('down'),
        'chest_b_closed': lambda: chest('closed'),
        'chest_b_open': lambda: chest('open'),
        'ballista_idle': ballista_idle,
        'ramp_idle': ramp_idle,
        'stairs_idle': stairs_idle,
        'ladder_idle': ladder_idle,
        'bookshelf_a': bookshelf_a,
        'carpet_a': carpet_a,
        'mine_cart_idle': mine_cart_idle,
        'mine_track_a': mine_track_a,
        'mine_support_a': mine_support_a,
        'mine_entrance_a': mine_entrance_a,
        'dragon_bones_a': dragon_bones_a,
    }
    for name, fn in jobs.items():
        if not only or name in only:
            fn()
