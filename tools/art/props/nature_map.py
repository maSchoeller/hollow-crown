"""Map nature kit for act 1 (south and moor), rebuilt after the ChatGPT sheets art/mockups/map-assets/refs/nature_*.png.

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/nature_map.py [-- id ...]

(nature.py is the older prop library of season 1; this kit lives next to it.)
- grove_a/b/c, grove_autumn_a, grove_snow_a: walkable forest tile, 2 to 3 clump trees on the back and side edges, centre free.
- fir_a, deadtree_b, stump_a: single trees and a stump.
- bush_low_a, reed_a, reed_b, lily_a, tussock_a: flat dressing for meadow and swamp.
- boardwalk_straight, boardwalk_corner, boardwalk_end: slim jetty on posts; open towards -y (corner also +x), one tile.
- boulder_a: one big blocking rock. wolf_cave_a: blocking den with bones in front.
- camp_tent_a, camp_rack_a: the patched tent and the drying rack of the moor camp.

Textures art/props/textures/nature_*.png (ChatGPT sheet, art/prompts/map_assets_nature.md). Ambient occlusion and a hidden
ground plane are baked in, so clumps and feet get the soft contact shading of the reference.
South faces -y. Fixed seeds, deterministic. Writes art/models/props/<id>.glb and art/props/previews/<id>.png;
with the environment variable HC_SHOT_DIR also a game-camera render (35 degrees from straight down) per id.
"""
import math
import os
import random
import sys

import bpy
import bmesh
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import ROOT, bake_texture, export, flat, join, link, mesh_object, preview, reset, tris, unwrap, vertex_colors  # noqa: E402
from facing import face_camera  # noqa: E402
from houses import box, lin, loft, paint  # noqa: E402

TEX = os.path.join(ROOT, 'art', 'props', 'textures')
LIGHT = Vector((-0.35, -0.45, 0.82)).normalized()


# ---------------------------------------------------------------- materials

def _base_link(m):
    bsdf = m.node_tree.nodes['Principled BSDF']
    return bsdf, bsdf.inputs['Base Color'].links[0].from_socket


def mix_rgb(m, fac, a, b):
    n, L = m.node_tree.nodes, m.node_tree.links
    k = n.new('ShaderNodeMix')
    k.data_type = 'RGBA'
    L.new(fac, k.inputs[0])
    for idx, v in ((6, a), (7, b)):
        if isinstance(v, tuple):
            k.inputs[idx].default_value = v
        else:
            L.new(v, k.inputs[idx])
    return k.outputs[2]


def with_ao(m, dist=0.14, floor=0.38):
    """Multiplies the colour with ambient occlusion: dark seams between clumps, baked."""
    n, L = m.node_tree.nodes, m.node_tree.links
    bsdf, src = _base_link(m)
    ao = n.new('ShaderNodeAmbientOcclusion')
    ao.samples = 8
    ao.inputs['Distance'].default_value = dist
    mr = n.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = floor
    L.new(ao.outputs['AO'], mr.inputs['Value'])
    sc = n.new('ShaderNodeVectorMath')
    sc.operation = 'SCALE'
    L.new(src, sc.inputs[0])
    L.new(mr.outputs['Result'], sc.inputs['Scale'])
    L.new(sc.outputs[0], bsdf.inputs['Base Color'])
    return m


def with_moss(m, col=None, scale=11.0, cover=0.5, z=None, up=None, seed=3.0):
    """Moss patches from noise; z=(z0, z1): full below z0, none above z1 (or the reverse if z0 > z1); up: only on faces looking up."""
    n, L = m.node_tree.nodes, m.node_tree.links
    bsdf, src = _base_link(m)
    col = col or lin(128, 134, 46)
    geo = n.new('ShaderNodeNewGeometry')
    tex = n.new('ShaderNodeTexNoise')
    tex.noise_dimensions = '4D'
    tex.inputs['W'].default_value = seed
    tex.inputs['Scale'].default_value = scale
    tex.inputs['Detail'].default_value = 4.0
    L.new(geo.outputs['Position'], tex.inputs['Vector'])
    mr = n.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 1.0 - cover - 0.04
    mr.inputs['From Max'].default_value = 1.0 - cover + 0.04
    L.new(tex.outputs['Fac'], mr.inputs['Value'])
    fac = mr.outputs['Result']

    def times(a, b):
        k = n.new('ShaderNodeMath')
        k.operation = 'MULTIPLY'
        L.new(a, k.inputs[0])
        L.new(b, k.inputs[1])
        return k.outputs[0]

    if z is not None:
        sp = n.new('ShaderNodeSeparateXYZ')
        L.new(geo.outputs['Position'], sp.inputs[0])
        zr = n.new('ShaderNodeMapRange')
        zr.inputs['From Min'].default_value, zr.inputs['From Max'].default_value = z
        zr.inputs['To Min'].default_value, zr.inputs['To Max'].default_value = 1.0, 0.0
        L.new(sp.outputs['Z'], zr.inputs['Value'])
        fac = times(fac, zr.outputs['Result'])
    if up is not None:
        sp = n.new('ShaderNodeSeparateXYZ')
        L.new(geo.outputs['Normal'], sp.inputs[0])
        ur = n.new('ShaderNodeMapRange')
        ur.inputs['From Min'].default_value, ur.inputs['From Max'].default_value = up
        L.new(sp.outputs['Z'], ur.inputs['Value'])
        fac = times(fac, ur.outputs['Result'])
    L.new(mix_rgb(m, fac, src, col), bsdf.inputs['Base Color'])
    return m


def img(name, file, u=(1, 0.5, 0), v=(0, 0.8, 1), scale=1.0, tint=(1, 1, 1), lo=0.66, hi=1.14, pivot=None):
    """Image projected linearly: tex = (dot(u, p), dot(v, p)) * scale. pivot: angle around this point gives u (for trunks)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, L = m.node_tree.nodes, m.node_tree.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.9
    geo = n.new('ShaderNodeNewGeometry')

    def dot(vec):
        d = n.new('ShaderNodeVectorMath')
        d.operation = 'DOT_PRODUCT'
        L.new(geo.outputs['Position'], d.inputs[0])
        d.inputs[1].default_value = vec
        return d.outputs['Value']

    def mul(a, f):
        k = n.new('ShaderNodeMath')
        k.operation = 'MULTIPLY'
        L.new(a, k.inputs[0])
        k.inputs[1].default_value = f
        return k.outputs[0]

    cb = n.new('ShaderNodeCombineXYZ')
    if pivot:
        sp = n.new('ShaderNodeSeparateXYZ')
        L.new(geo.outputs['Position'], sp.inputs[0])
        at = n.new('ShaderNodeMath')
        at.operation = 'ARCTAN2'

        def sub(a, b):
            k = n.new('ShaderNodeMath')
            k.operation = 'SUBTRACT'
            L.new(a, k.inputs[0])
            k.inputs[1].default_value = b
            return k.outputs[0]
        L.new(sub(sp.outputs['Y'], pivot[1]), at.inputs[0])
        L.new(sub(sp.outputs['X'], pivot[0]), at.inputs[1])
        L.new(mul(at.outputs[0], pivot[2] * scale), cb.inputs['X'])
    else:
        L.new(mul(dot(u), scale), cb.inputs['X'])
    L.new(mul(dot(v), scale), cb.inputs['Y'])
    tex = n.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(os.path.join(TEX, file), check_existing=True)
    tex.extension = 'REPEAT'
    L.new(cb.outputs[0], tex.inputs['Vector'])
    d = n.new('ShaderNodeVectorMath')
    d.operation = 'DOT_PRODUCT'
    L.new(geo.outputs['Normal'], d.inputs[0])
    d.inputs[1].default_value = LIGHT
    sh = n.new('ShaderNodeMapRange')
    sh.inputs['From Min'].default_value = -1.0
    sh.inputs['To Min'].default_value = lo
    sh.inputs['To Max'].default_value = hi
    L.new(d.outputs['Value'], sh.inputs['Value'])
    s1 = n.new('ShaderNodeVectorMath')
    s1.operation = 'SCALE'
    L.new(tex.outputs['Color'], s1.inputs[0])
    L.new(sh.outputs['Result'], s1.inputs['Scale'])
    s2 = n.new('ShaderNodeVectorMath')
    s2.operation = 'MULTIPLY'
    L.new(s1.outputs[0], s2.inputs[0])
    s2.inputs[1].default_value = tint
    L.new(s2.outputs[0], bsdf.inputs['Base Color'])
    return m


def solid(name, dark, light, wn=0.8, noise=0.08, nscale=10.0, seed=1.0, z=None, wz=0.0, bias=0.0):
    return paint(name, [(0.0, lin(*dark)), (1.0, lin(*light))], z=z, wz=wz, wn=wn, noise=noise, nscale=nscale, seed=seed, bias=bias)


def mud_mat():
    return with_ao(paint('mud', [(0.0, lin(70, 54, 36)), (0.5, lin(112, 88, 58)), (1.0, lin(148, 120, 80))], wn=0.3, noise=0.28, nscale=26, seed=4.0, bias=0.32), 0.1, 0.5)


def rope_mat():
    return paint('rope', [(0.0, lin(122, 88, 48)), (1.0, lin(214, 176, 112))], wn=0.7, noise=0.05, nscale=30, seed=9.0, pattern=('planks', 70.0, 0.62))


# ---------------------------------------------------------------- geometry

def ico(name, c, r, rng, mat, squash=(1, 1, 1), jitter=0.05, subdiv=1):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=r)
    rz = rng.uniform(0, 6.28)
    for v in bm.verts:
        d = 1.0 + rng.uniform(-jitter, jitter)
        x, y = v.co.x * math.cos(rz) - v.co.y * math.sin(rz), v.co.x * math.sin(rz) + v.co.y * math.cos(rz)
        v.co = Vector((x * d * squash[0] + c[0], y * d * squash[1] + c[1], v.co.z * d * squash[2] + c[2]))
    o = mesh_object(name, bm)
    o.data.materials.append(mat)
    return o


def tube(name, path, mat, segs=6, cap=True, rng=None, jitter=0.0, flare=None):
    """Tube along [(xyz, radius), ...] with parallel transported frames, tip capped, foot open."""
    pts = [Vector(p) for p, _ in path]
    bm = bmesh.new()
    t0 = (pts[1] - pts[0]).normalized()
    a = t0.orthogonal().normalized()
    b = t0.cross(a)
    loops = []
    for i, (p, (_, r)) in enumerate(zip(pts, path)):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        a = (a - t * a.dot(t)).normalized()
        b = t.cross(a)
        loop = []
        for k in range(segs):
            ang = 2 * math.pi * k / segs
            rr = r * (1 + (rng.uniform(-jitter, jitter) if rng else 0))
            if i == 0 and flare and k in flare:
                rr += flare[k]
            loop.append(bm.verts.new(p + (a * math.cos(ang) + b * math.sin(ang)) * rr))
        loops.append(loop)
    for l0, l1 in zip(loops, loops[1:]):
        for k in range(segs):
            j = (k + 1) % segs
            bm.faces.new((l0[k], l0[j], l1[j], l1[k]))
    if cap:
        f = bm.faces.new(loops[-1])
        bmesh.ops.triangulate(bm, faces=[f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_object(name, bm)
    o.data.materials.append(mat)
    return o


def limb(name, p0, p1, r0, r1, mat, bend=(0, 0, 0), n=3, segs=5):
    """Tapered branch with a slight bend."""
    a, b, off = Vector(p0), Vector(p1), Vector(bend)
    path = []
    for i in range(n + 1):
        t = i / n
        path.append((tuple(a.lerp(b, t) + off * math.sin(math.pi * t)), r0 + (r1 - r0) * t))
    return tube(name, path, mat, segs)


def gem(name, c, radii, rng, mat, cuts=16, zmin=None, bevel=0.0, f=(0.86, 0.98)):
    """Convex rock: a box cut by tangent planes of an ellipsoid; big flat facets, few triangles."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=2.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * radii[0], v.co.y * radii[1], v.co.z * radii[2]))
    ga = math.pi * (3 - math.sqrt(5))
    for i in range(cuts):
        zz = 1 - 2 * (i + 0.5) / cuts
        rad = math.sqrt(1 - zz * zz)
        ang = ga * i + rng.uniform(-0.3, 0.3)
        d = Vector((rad * math.cos(ang), rad * math.sin(ang), zz))
        d = (d + Vector((rng.uniform(-.12, .12), rng.uniform(-.12, .12), rng.uniform(-.12, .12)))).normalized()
        p = Vector((d.x * radii[0], d.y * radii[1], d.z * radii[2]))
        no = Vector((d.x / radii[0], d.y / radii[1], d.z / radii[2])).normalized()
        co = p * rng.uniform(*f)
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no, clear_outer=True)
        bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
    for v in bm.verts:
        v.co += Vector(c)
        if zmin is not None and v.co.z < zmin:
            v.co.z = zmin
    bmesh.ops.triangulate(bm, faces=[f_ for f_ in bm.faces if len(f_.verts) > 8])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_object(name, bm)
    o.data.materials.append(mat)
    if bevel:
        mod = o.modifiers.new('bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = 1
        mod.limit_method = 'ANGLE'
        mod.angle_limit = math.radians(18)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o


def plate(name, pts, mat, thick=0.0):
    """Flat polygon through given 3D points (fan, works for star-shaped outlines); optional thickness downwards."""
    bm = bmesh.new()
    ring = [bm.verts.new(p) for p in pts]
    f = bm.faces.new(ring)
    if thick:
        ret = bmesh.ops.extrude_face_region(bm, geom=[f])
        for v in ret['geom']:
            if isinstance(v, bmesh.types.BMVert):
                v.co.z -= thick
    bmesh.ops.triangulate(bm, faces=[x for x in bm.faces if len(x.verts) > 4], quad_method='BEAUTY', ngon_method='EAR_CLIP')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_object(name, bm)
    o.data.materials.append(mat)
    return o


def blob(c, r, rng, n=12, z=0.006, wob=0.22, sy=1.0):
    return [(c[0] + math.cos(2 * math.pi * i / n) * r * rng.uniform(1 - wob, 1 + wob), c[1] + math.sin(2 * math.pi * i / n) * r * sy * rng.uniform(1 - wob, 1 + wob), z) for i in range(n)]


def blade(name, base, azim, h, lean, w, mat, curl=0.0, n=4):
    """A folded grass or reed blade: 4 sections, V profile, ends in a tip that bends outwards."""
    out = Vector((math.cos(azim), math.sin(azim), 0))
    side = Vector((-out.y, out.x, 0))
    bm = bmesh.new()
    rows = []
    for i in range(n):
        t = i / n
        p = Vector(base) + out * (lean * t * t) + Vector((0, 0, h * (t - curl * t * t * t)))
        ww = w * (1 - t * t) * (0.75 + 0.25 * math.sin(math.pi * min(1, t * 2)))
        rows.append((bm.verts.new(p - side * ww), bm.verts.new(p + out * ww * 0.45), bm.verts.new(p + side * ww)))
    tip = bm.verts.new(Vector(base) + out * lean + Vector((0, 0, h * (1 - curl))))
    for r0, r1 in zip(rows, rows[1:]):
        bm.faces.new((r0[0], r0[1], r1[1], r1[0]))
        bm.faces.new((r0[1], r0[2], r1[2], r1[1]))
    bm.faces.new((rows[-1][0], rows[-1][1], tip))
    bm.faces.new((rows[-1][1], rows[-1][2], tip))
    o = mesh_object(name, bm)
    o.data.materials.append(mat)
    return o


# ---------------------------------------------------------------- finish with contact shading

def finish(obj, pid, size=256, samples=48):
    face_camera(obj)
    flat(obj)
    unwrap(obj)
    scene = bpy.context.scene
    scene.cycles.samples = samples
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=4.0)
    ground = mesh_object('aoground', bm)
    bake_texture(obj, size, pid)
    bpy.data.objects.remove(ground)
    vertex_colors(obj)
    export(obj, pid)
    preview(obj, pid)
    out = os.environ.get('HC_SHOT_DIR')
    if out:
        cam = scene.camera
        h = 4.0
        target = next(o for o in scene.objects if o.name.startswith('target'))
        dims = obj.dimensions
        tilt = math.radians(float(os.environ.get('HC_SHOT_TILT', '35')))
        cam.data.ortho_scale = max(1.5, max(dims.x, dims.y, dims.z) * 1.4)
        target.location = (0, 0, dims.z * 0.42)
        cam.location = (0, -math.sin(tilt) * h, math.cos(tilt) * h + target.location.z)
        scene.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items} else 'BLENDER_EEVEE_NEXT'
        scene.render.filepath = os.path.join(out, f'{pid}.png')
        bpy.ops.render.render(write_still=True)
    print(f'{pid}: {tris(obj)} triangles')


# ---------------------------------------------------------------- broadleaf trees

GOLD = [(0.0, (58, 74, 22)), (0.28, (98, 112, 30)), (0.5, (132, 138, 36)), (0.7, (190, 160, 42)), (0.86, (236, 176, 44)), (1.0, (250, 196, 66))]
SUMMER = [(0.0, (48, 84, 28)), (0.3, (78, 116, 36)), (0.6, (116, 152, 46)), (0.82, (158, 182, 60)), (1.0, (196, 204, 84))]
MIXED = [(0.0, (56, 86, 26)), (0.32, (94, 128, 36)), (0.58, (138, 156, 46)), (0.8, (198, 176, 48)), (1.0, (244, 192, 60))]
FRESH = [(0.0, (46, 86, 30)), (0.35, (84, 128, 40)), (0.65, (126, 164, 52)), (1.0, (178, 198, 76))]
OLIVE = [(0.0, (70, 84, 24)), (0.4, (108, 124, 32)), (0.7, (144, 158, 44)), (1.0, (186, 188, 64))]
ORANGE = [(0.0, (120, 66, 18)), (0.35, (180, 104, 24)), (0.65, (226, 142, 32)), (1.0, (248, 186, 66))]
RUST = [(0.0, (92, 36, 20)), (0.35, (146, 58, 26)), (0.65, (190, 84, 36)), (1.0, (226, 124, 62))]
SNOWLEAF = [(0.0, (52, 60, 22)), (0.4, (84, 92, 30)), (0.75, (116, 122, 44)), (1.0, (146, 150, 66))]


def leaf(name, ramp, z0, z1, seed, wz=0.82, wn=0.26):
    stops = [(p, lin(*[v * 0.86 for v in c])) for p, c in ramp]
    return with_ao(paint(name, stops, z=(z0, z1), wz=wz, wn=wn, noise=0.05, nscale=7, seed=seed, bias=-0.1), 0.11, 0.42)


def cull_inside(objs, shrink=0.8):
    """Removes clump faces buried in a neighbouring clump or turned away from every camera (objs: [(object, centre, radius)]). Groves are authored for the fixed camera from the south."""
    for o, _, _ in objs:
        bm = bmesh.new()
        bm.from_mesh(o.data)
        drop = []
        for f in bm.faces:
            p = f.calc_center_median()
            nz = f.normal
            if nz.dot(Vector((0, -0.57, 0.82))) < -0.12 and nz.dot(Vector((-0.46, -0.67, 0.58))) < -0.12:
                drop.append(f)
                continue
            for other, c2, r2 in objs:
                if other is not o and (p - Vector(c2)).length < r2 * shrink:
                    drop.append(f)
                    break
        bmesh.ops.delete(bm, geom=drop, context='FACES')
        bm.to_mesh(o.data)
        bm.free()


def round_tree(pid, c, h, r, ramp, rng, parts, seed, bark=None, clumps=None, top_bias=0.0, subdiv=2):
    """Short forked trunk and a ball of faceted clumps: ring below, ring above, crown on top, as in the sheet."""
    trunk_top = h - r * 1.5
    bark = bark or with_ao(with_moss(img(f'{pid}b', 'nature_driftwood.png', scale=2.6, tint=(0.66, 0.47, 0.32), pivot=(c[0], c[1], 0.1)), cover=0.0), 0.12, 0.3)
    w = 0.04 + r * 0.14
    parts.append(tube(f'{pid}t', [((c[0], c[1], 0), w * 1.2), ((c[0], c[1], w * 1.0), w * 0.98), ((c[0], c[1], trunk_top * 0.7), w * 0.8), ((c[0], c[1], trunk_top * 1.15), w * 0.72)], bark, 7, rng=rng, jitter=0.06))
    for k in range(3):
        a = k * 2.2 + rng.uniform(0, 0.6) + 0.3
        parts.append(tube(f'{pid}r{k}', [((c[0] + math.cos(a) * w * 0.5, c[1] + math.sin(a) * w * 0.5, w * 1.1), w * 0.6), ((c[0] + math.cos(a) * w * 1.5, c[1] + math.sin(a) * w * 1.5, w * 0.3), w * 0.46), ((c[0] + math.cos(a) * w * 2.0, c[1] + math.sin(a) * w * 2.0, 0.008), w * 0.22)], bark, 4))
    for k in range(2):
        a = k * 3.1 + rng.uniform(0, 0.5)
        parts.append(limb(f'{pid}f{k}', (c[0], c[1], trunk_top * 0.75), (c[0] + math.cos(a) * r * 0.5, c[1] + math.sin(a) * r * 0.5, trunk_top * 1.2), w * 0.55, w * 0.3, bark, n=1, segs=5))
    mat = leaf(f'{pid}l', ramp, h - r * 1.75, h - r * 0.05 - top_bias, seed)
    n_low, n_mid, n_top = clumps or (6, 4, 1)
    zc = h - r
    rc = r * 0.5
    off = rng.uniform(0, 6.28)
    balls = []

    def ball(name, x, y, z, rr):
        o = ico(name, (x, y, z), rr, rng, mat, jitter=0.035, subdiv=subdiv)
        balls.append((o, (x, y, z), rr))
        parts.append(o)

    for k in range(n_low):
        a = off + 2 * math.pi * k / n_low
        ball(f'{pid}c{k}', c[0] + math.cos(a) * r * 0.62, c[1] + math.sin(a) * r * 0.62, zc - r * 0.3, rc * rng.uniform(0.92, 1.08))
    for k in range(n_mid):
        a = off + 0.5 + 2 * math.pi * k / n_mid
        ball(f'{pid}d{k}', c[0] + math.cos(a) * r * 0.42, c[1] + math.sin(a) * r * 0.42, zc + r * 0.22, rc * rng.uniform(0.94, 1.1))
    for k in range(n_top):
        a = off + 1.1 * k
        rad = 0.0 if n_top == 1 else r * 0.18
        ball(f'{pid}e{k}', c[0] + math.cos(a) * rad, c[1] + math.sin(a) * rad, zc + r * 0.58, rc * 0.98)
    cull_inside(balls)
    parts.append(ico(f'{pid}core', (c[0], c[1], zc - r * 0.05), r * 0.72, rng, mat, jitter=0.0))
    return mat


def grove(pid, seed, trees, size=512):
    """trees: list of (x, y, height, crown radius, palette, clump counts)."""
    reset()
    rng = random.Random(seed)
    parts = []
    for i, (x, y, h, r, ramp, cl) in enumerate(trees):
        round_tree(f'g{i}', (x, y), h, r, ramp, rng, parts, seed + i * 3.1, clumps=cl, subdiv=2)
    return parts, rng


def grove_a():
    parts, _ = grove('grove_a', 201, [(0.12, 0.34, 1.12, 0.38, GOLD, (6, 4, 1)), (-0.33, 0.08, 0.86, 0.29, GOLD, (5, 3, 1)), (-0.36, -0.32, 0.5, 0.17, MIXED, (4, 2, 1))])
    finish(join(parts, 'grove_a'), 'grove_a', size=512)


def grove_b():
    parts, _ = grove('grove_b', 202, [(0.14, 0.32, 1.2, 0.41, SUMMER, (7, 4, 1)), (-0.33, -0.12, 0.66, 0.21, OLIVE, (4, 2, 1))])
    finish(join(parts, 'grove_b'), 'grove_b', size=512)


def grove_c():
    parts, _ = grove('grove_c', 203, [(0.0, 0.37, 0.95, 0.27, GOLD, (5, 3, 1)), (-0.36, 0.1, 0.72, 0.21, FRESH, (4, 2, 1)), (0.36, 0.08, 0.72, 0.21, FRESH, (4, 2, 1))])
    finish(join(parts, 'grove_c'), 'grove_c', size=512)


def grove_autumn_a():
    parts, rng = grove('grove_autumn_a', 204, [(0.22, 0.34, 1.12, 0.36, RUST, (6, 4, 1)), (-0.24, 0.24, 0.92, 0.3, ORANGE, (5, 3, 1)), (-0.37, -0.28, 0.5, 0.17, RUST, (4, 2, 1))])
    gold = solid('fallen', (176, 92, 24), (240, 160, 52), wn=0.4)
    for k, (x, y) in enumerate(((0.04, -0.3), (-0.12, -0.42), (-0.2, -0.36), (0.26, -0.06), (0.36, 0.0), (0.42, -0.14), (0.3, 0.1), (-0.04, 0.02))):
        parts.append(leaf_plate(f'lf{k}', (x, y, 0.012), rng.uniform(0, 3.14), 0.08, rng.uniform(0.03, 0.04), rng.uniform(0.018, 0.024), gold))
    finish(join(parts, 'grove_autumn_a'), 'grove_autumn_a', size=512)


def snow_cap(parts, c, h, r, mat, rng, prefix):
    """Overlapping white lobes on the upper half of a crown, hanging down at the rim."""
    zc = h - r
    k = 5 if r > 0.2 else 4
    off = rng.uniform(0, 6.28)
    sd = 2
    balls = [(ico(f'{prefix}top', (c[0], c[1], zc + r * 0.62), r * 0.62, rng, mat, squash=(1.12, 1.12, 0.68), jitter=0.03, subdiv=sd), (c[0], c[1], zc + r * 0.62), r * 0.55)]
    for i in range(k):
        a = off + 2 * math.pi * i / k
        q = (c[0] + math.cos(a) * r * 0.66, c[1] + math.sin(a) * r * 0.66, zc + r * 0.22)
        balls.append((ico(f'{prefix}{i}', q, r * 0.42, rng, mat, squash=(1.14, 1.14, 0.62), jitter=0.03, subdiv=sd), q, r * 0.3))
    cull_inside(balls, 0.72)
    parts.extend(b[0] for b in balls)


def grove_snow_a():
    trees = [(0.12, 0.34, 1.12, 0.38, (6, 1, 0)), (-0.33, 0.08, 0.86, 0.29, (5, 1, 0)), (-0.36, -0.32, 0.5, 0.17, (4, 1, 0))]
    parts, rng = grove('grove_snow_a', 205, [(x, y, h, r, SNOWLEAF, cl) for x, y, h, r, cl in trees])
    snow = with_ao(paint('snow', [(0.0, lin(150, 158, 182)), (0.5, lin(198, 202, 216)), (1.0, lin(232, 232, 232))], wn=0.85, noise=0.02, nscale=8, seed=6.0, bias=0.02), 0.09, 0.62)
    for i, (x, y, h, r, _) in enumerate(trees):
        snow_cap(parts, (x, y), h, r, snow, rng, f's{i}')
        parts.append(plate(f'sf{i}', blob((x + 0.02, y - 0.04), r * 0.3 + 0.06, rng, 9, z=0.012), snow))
    finish(join(parts, 'grove_snow_a'), 'grove_snow_a', size=512)


# ---------------------------------------------------------------- fir, dead tree, stump

def fir_tier(name, z0, h, r, mat, rng, lobes=7):
    """Fat scalloped skirt: apex, shoulder ring, a rounded rim of five points per lobe. Open underneath, the camera never looks there."""
    bm = bmesh.new()
    apex = bm.verts.new((0, 0, z0 + h))
    off = rng.uniform(0, 6.28)
    per = 5
    mid, rim = [], []
    for i in range(lobes):
        a = off + 2 * math.pi * (i + 0.5) / lobes
        mid.append(bm.verts.new((math.cos(a) * r * 0.7, math.sin(a) * r * 0.7, z0 + h * 0.34)))
    for i in range(lobes):
        for k in range(per):
            t = k / per
            a = off + 2 * math.pi * (i + t) / lobes
            arc = math.sin(math.pi * t)
            rr = r * (0.76 + 0.24 * arc)
            rim.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, z0 + h * (0.06 - 0.16 * arc))))
    n = len(rim)
    for i in range(lobes):
        j = (i + 1) % lobes
        bm.faces.new((apex, mid[i], mid[j]))
        for k in range(per):
            bm.faces.new((mid[i], rim[i * per + k], rim[(i * per + k + 1) % n]))
        bm.faces.new((mid[i], rim[(i * per + per) % n], mid[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    o = mesh_object(name, bm)
    o.data.materials.append(mat)
    return o


def fir_a():
    reset()
    rng = random.Random(211)
    bark = with_ao(img('b', 'nature_bark.png', scale=2.6, tint=(0.82, 0.66, 0.54), pivot=(0, 0, 0.1)), 0.14, 0.3)
    green = with_ao(paint('fir', [(0.0, lin(42, 72, 20)), (0.4, lin(70, 102, 26)), (0.7, lin(98, 128, 32)), (1.0, lin(132, 156, 46))], wn=0.85, noise=0.04, nscale=8, seed=7.0, bias=-0.06), 0.12, 0.42)
    parts = [tube('t', [((0, 0, 0), 0.17), ((0, 0, 0.07), 0.13), ((0, 0, 0.36), 0.11)], bark, 8, rng=rng, jitter=0.07, flare={0: 0.05, 3: 0.04, 5: 0.05})]
    for i, (z, h, r) in enumerate(((0.3, 0.28, 0.47), (0.54, 0.27, 0.39), (0.76, 0.25, 0.3), (0.96, 0.22, 0.2))):
        parts.append(fir_tier(f'tier{i}', z, h, r, green, rng))
    parts.append(tube('tip', [((0, 0, 1.11), 0.09), ((0, 0, 1.22), 0.05), ((0, 0, 1.31), 0.006)], green, 6))
    finish(join(parts, 'fir_a'), 'fir_a', size=256)


def deadtree_b():
    reset()
    rng = random.Random(212)
    wood = with_ao(with_moss(img('w', 'nature_driftwood.png', scale=3.0, lo=0.72, hi=1.12, pivot=(0, 0, 0.12)), z=(0.05, 0.22), cover=0.48, scale=16), 0.1, 0.42)
    parts = [tube('trunk', [((0.01, 0.0, 0.0), 0.15), ((0.0, 0.0, 0.1), 0.125), ((-0.03, 0.01, 0.28), 0.095), ((0.0, 0.02, 0.48), 0.08), ((0.05, 0.03, 0.68), 0.066), ((0.09, 0.05, 0.9), 0.05), ((0.12, 0.07, 1.12), 0.03), ((0.11, 0.08, 1.3), 0.012)], wood, 8, rng=rng, jitter=0.08)]
    # west fork, east fork, low south-east stub, tips: all steep, they must stand clear of the trunk from above
    parts.append(tube('w', [((-0.01, 0.02, 0.46), 0.066), ((-0.12, 0.0, 0.62), 0.052), ((-0.25, -0.03, 0.82), 0.036), ((-0.36, -0.05, 0.96), 0.016)], wood, 6))
    parts.append(limb('w2', (-0.24, -0.03, 0.8), (-0.38, -0.08, 0.8), 0.026, 0.01, wood, n=1, segs=5))
    parts.append(limb('w3', (-0.14, 0.0, 0.64), (-0.2, 0.06, 0.88), 0.026, 0.012, wood, n=1, segs=5))
    parts.append(tube('e', [((0.07, 0.04, 0.78), 0.046), ((0.2, 0.03, 0.92), 0.034), ((0.34, 0.02, 1.06), 0.012)], wood, 6))
    parts.append(limb('e2', (0.19, 0.03, 0.9), (0.31, -0.02, 0.9), 0.02, 0.008, wood, n=1, segs=4))
    parts.append(tube('s', [((0.03, 0.01, 0.34), 0.058), ((0.15, -0.05, 0.44), 0.04), ((0.28, -0.1, 0.56), 0.013)], wood, 6))
    parts.append(limb('tw', (0.11, 0.07, 1.12), (0.02, 0.09, 1.24), 0.016, 0.006, wood, n=1, segs=4))
    for k in range(5):
        a = k * 1.26 + 0.2
        l = rng.uniform(0.24, 0.3)
        parts.append(tube(f'r{k}', [((math.cos(a) * 0.08, math.sin(a) * 0.08, 0.14), 0.06), ((math.cos(a) * l * 0.62, math.sin(a) * l * 0.62, 0.06), 0.052), ((math.cos(a) * l * 0.9, math.sin(a) * l * 0.9, 0.028), 0.034), ((math.cos(a) * l, math.sin(a) * l, 0.016), 0.02)], wood, 6))
    finish(join(parts, 'deadtree_b'), 'deadtree_b', size=256)


def stump_a():
    reset()
    rng = random.Random(213)
    wood = with_ao(with_moss(img('w', 'nature_driftwood.png', scale=2.4, tint=(0.98, 0.8, 0.62), pivot=(0, 0, 0.14)), col=lin(126, 130, 44), z=(0.08, 0.24), cover=0.46, scale=8), 0.09, 0.38)
    top = img('top', 'nature_stumptop.png', u=(1, 0, 0), v=(0, 1, 0), scale=1.2, lo=0.82, hi=1.14)
    rim = solid('rim', (138, 92, 54), (208, 160, 104), wn=0.8)
    R = 0.3
    segs = 14
    def ring(r, z, jit=0.09):
        return [(math.cos(2 * math.pi * i / segs) * r * (1 - jit if i % 2 else 1 + jit * 0.4), math.sin(2 * math.pi * i / segs) * r * (1 - jit if i % 2 else 1 + jit * 0.4), z) for i in range(segs)]
    parts = [loft('body', [ring(R * 1.2, 0.0), ring(R * 1.04, 0.1), ring(R, 0.34)], wood, cap=False)]
    circ = [(math.cos(2 * math.pi * i / segs) * R * 0.99, math.sin(2 * math.pi * i / segs) * R * 0.99, 0.34) for i in range(segs)]
    inner = [(x * 0.94, y * 0.94, 0.355) for x, y, _ in circ]
    parts.append(loft('lip', [circ, inner], rim, cap=False))
    parts.append(plate('top', inner, top))
    for k in range(7):
        a = k * 0.9 + 0.35
        l = rng.uniform(0.42, 0.5)
        parts.append(tube(f'r{k}', [((math.cos(a) * 0.17, math.sin(a) * 0.17, 0.2), 0.09), ((math.cos(a) * l * 0.66, math.sin(a) * l * 0.66, 0.1), 0.085), ((math.cos(a) * l * 0.92, math.sin(a) * l * 0.92, 0.042), 0.055), ((math.cos(a) * l, math.sin(a) * l, 0.022), 0.026)], wood, 6))
    finish(join(parts, 'stump_a'), 'stump_a', size=256)


# ---------------------------------------------------------------- flat dressing

def leaf_plate(name, c, a, tilt, L, w, mat):
    """An oval leaf folded along its midrib, 6 triangles."""
    dx, dy = math.cos(a), math.sin(a)
    sx, sy = -dy, dx
    pts = [(-L, 0, 0), (-L * 0.25, w, 0), (L * 0.45, w * 0.8, 0), (L, 0, 0), (L * 0.45, -w * 0.8, 0), (-L * 0.25, -w, 0)]
    mid = [(-L * 0.25, 0, 0.012), (L * 0.45, 0, 0.012)]
    bm = bmesh.new()

    def place(p):
        u, v, h = p
        return bm.verts.new((c[0] + dx * u + sx * v, c[1] + dy * u + sy * v, c[2] + u * tilt + h))
    r = [place(p) for p in pts]
    m = [place(p) for p in mid]
    for f in ((r[0], m[0], r[1]), (r[1], m[0], m[1], r[2]), (r[2], m[1], r[3]), (r[3], m[1], r[4]), (r[4], m[1], m[0], r[5]), (r[5], m[0], r[0])):
        bm.faces.new(f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    o = mesh_object(name, bm)
    o.data.materials.append(mat)
    return o


def flower(parts, c, r, petal, heart, prefix, n=5, rot=0.0, lift=0.012, rng=None):
    for i in range(n):
        a = rot + 2 * math.pi * i / n
        px, py = c[0] + math.cos(a) * r * 0.62, c[1] + math.sin(a) * r * 0.62
        parts.append(leaf_plate(f'{prefix}{i}', (px, py, c[2] + lift), a, 0.35, r * 0.55, r * 0.42, petal))
    parts.append(ico(f'{prefix}h', (c[0], c[1], c[2] + lift * 2), r * 0.24, rng, heart, squash=(1, 1, 0.5), jitter=0.0))


def bush_low_a():
    reset()
    rng = random.Random(221)
    under = with_ao(solid('u', (34, 52, 20), (76, 92, 34), wn=0.6), 0.1, 0.5)
    lf = paint('lf', [(0.0, lin(58, 72, 24)), (0.45, lin(90, 102, 32)), (0.8, lin(124, 128, 44)), (1.0, lin(154, 150, 60))], wn=0.45, z=(0.03, 0.17), wz=0.35, noise=0.14, nscale=16, seed=3.0, bias=-0.05)
    petal = solid('p', (226, 190, 176), (252, 238, 226), wn=0.35, noise=0.02, bias=0.35)
    heart = solid('h', (200, 150, 50), (236, 192, 80), wn=0.5)
    parts = [ico('mound', (0, 0, 0.03), 0.31, rng, under, squash=(1.1, 0.92, 0.36), jitter=0.05, subdiv=1)]
    tops = []
    k = 0
    for ring, cnt, rr, z in ((0, 11, 0.33, 0.06), (1, 8, 0.21, 0.125), (2, 4, 0.08, 0.165)):
        for i in range(cnt):
            a = 2 * math.pi * i / cnt + ring * 0.4 + rng.uniform(-0.15, 0.15)
            x, y = math.cos(a) * rr * 1.08, math.sin(a) * rr * 0.9
            parts.append(leaf_plate(f'l{k}', (x, y, z + rng.uniform(-0.006, 0.01)), a + rng.uniform(-0.6, 0.6), -0.42 + ring * 0.12, rng.uniform(0.095, 0.115), rng.uniform(0.07, 0.085), lf))
            k += 1
            tops.append((x, y, z))
    for i, (x, y, z) in enumerate(((-0.1, -0.15, 0.15), (0.03, 0.03, 0.195), (0.19, -0.07, 0.145), (-0.22, 0.05, 0.125), (0.14, 0.15, 0.135))):
        flower(parts, (x, y, z), 0.052, petal, heart, f'f{i}', rot=i * 0.7, rng=rng)
    finish(join(parts, 'bush_low_a'), 'bush_low_a', size=256)


def reed(pid, seed, n_blades, hmin, hmax, spread, lean, cats, patch, w):
    """Slim upright pale-olive blades in a tight clump, seen from above they must not fan out into a star; dark brown cat-tails stand clear of them."""
    reset()
    rng = random.Random(seed)
    mat = with_ao(paint('blade', [(0.0, lin(116, 128, 46)), (0.4, lin(156, 158, 58)), (0.72, lin(198, 182, 72)), (1.0, lin(236, 206, 104))], z=(0.0, hmax * 0.7), wz=0.9, wn=0.25, noise=0.05, nscale=18, seed=8.0, bias=0.02), 0.07, 0.8)
    cat = solid('cat', (104, 58, 26), (186, 112, 58), wn=0.85)
    stem = solid('stem', (120, 122, 44), (176, 170, 66), wn=0.6)
    parts = [plate('mud', blob((0, 0), patch, rng, 20, wob=0.2), mud_mat())]
    for i in range(n_blades):
        a = i * 2.399 + rng.uniform(-0.3, 0.3)
        rr = spread * math.sqrt((i + 0.5) / n_blades)
        h = rng.uniform(hmin, hmax) * (1 - 0.35 * (rr / spread) ** 2)
        parts.append(blade(f'b{i}', (math.cos(a) * rr, math.sin(a) * rr * 0.85, 0.004), a + rng.uniform(-0.3, 0.3), h, lean * rng.uniform(0.5, 1.2) * (0.3 + rr / spread), w * rng.uniform(0.85, 1.15), mat, curl=rng.uniform(0.04, 0.14)))
    for i, (x, y, top, tx) in enumerate(cats):
        parts.append(tube(f'st{i}', [((x, y, 0), 0.01), ((x + tx * 0.6, y, top * 0.65), 0.009), ((x + tx, y, top), 0.007)], stem, 4))
        parts.append(tube(f'ct{i}', [((x + tx, y, top - 0.005), 0.016), ((x + tx * 1.01, y, top + 0.014), 0.036), ((x + tx * 1.03, y, top + 0.11), 0.036), ((x + tx * 1.05, y, top + 0.135), 0.016), ((x + tx * 1.05, y, top + 0.18), 0.004)], cat, 6))
    finish(join(parts, pid), pid, size=256)


def lily_a():
    reset()
    rng = random.Random(231)
    pad = with_ao(paint('pad', [(0.0, lin(78, 92, 28)), (0.5, lin(116, 128, 40)), (1.0, lin(150, 154, 60))], wn=0.3, noise=0.24, nscale=14, seed=2.0, bias=0.36), 0.05, 0.7)
    side = solid('side', (46, 56, 20), (76, 86, 30), wn=0.5)
    petal = solid('pe', (226, 150, 160), (252, 226, 222), wn=0.55, bias=0.15)
    heart = solid('he', (214, 160, 48), (244, 208, 92), wn=0.5)
    parts = []
    for i, (x, y, r, a, fl) in enumerate(((0.2, 0.2, 0.25, 3.6, True), (-0.21, -0.12, 0.2, 0.6, True), (-0.3, 0.24, 0.12, 5.2, False), (0.3, -0.17, 0.115, 2.2, False), (0.03, -0.36, 0.09, 1.2, False))):
        n = 13
        pts = [(x, y, 0.026)]
        for k in range(n):
            t = a + 0.26 + (2 * math.pi - 0.52) * k / (n - 1)
            pts.append((x + math.cos(t) * r, y + math.sin(t) * r * 0.92, 0.026))
        parts.append(plate(f'p{i}', pts, pad))
        lo = [(px, py, 0.004) for px, py, _ in pts]
        parts.append(loft(f's{i}', [lo, [(px, py, 0.025) for px, py, _ in pts]], side, cap=False))
        if fl:
            c = (x + 0.02, y + 0.01, 0.034)
            flower(parts, c, 0.09, petal, heart, f'fa{i}', n=6, rot=0.2, lift=0.012, rng=rng)
            flower(parts, c, 0.062, petal, heart, f'fb{i}', n=5, rot=0.7, lift=0.036, rng=rng)
    finish(join(parts, 'lily_a'), 'lily_a', size=256)


def tussock_a():
    """Low grassy bog hummock: a soft mound under short olive-gold grass that falls over its flanks, a few tufts and heather, peat and stones at the foot."""
    reset()
    rng = random.Random(241)
    earth = with_ao(paint('e', [(0.0, lin(78, 62, 34)), (0.5, lin(116, 100, 46)), (1.0, lin(146, 136, 58))], z=(0.0, 0.2), wz=0.8, wn=0.3, noise=0.14, nscale=16, seed=2.0), 0.08, 0.6)
    turf = with_ao(paint('tf', [(0.0, lin(112, 112, 40)), (0.45, lin(146, 136, 48)), (0.8, lin(180, 158, 58)), (1.0, lin(206, 178, 74))], wn=0.4, noise=0.4, nscale=9, seed=4.0, bias=0.1), 0.06, 0.8)
    grass = with_ao(paint('g', [(0.0, lin(120, 118, 42)), (0.45, lin(158, 146, 50)), (0.8, lin(192, 168, 62)), (1.0, lin(222, 192, 84))], z=(0.06, 0.34), wz=0.7, wn=0.3, noise=0.14, nscale=12, seed=5.0, bias=0.04), 0.05, 0.8)
    tuft = with_ao(paint('t', [(0.0, lin(116, 124, 44)), (1.0, lin(204, 196, 80))], z=(0.15, 0.42), wz=0.85, wn=0.2, noise=0.04, nscale=12, seed=7.0, bias=0.05), 0.05, 0.85)
    heath = solid('h', (150, 86, 136), (232, 164, 210), wn=0.4, noise=0.05, bias=0.12)
    stone = with_ao(img('st', 'nature_rocksoft.png', scale=2.0, lo=0.62, hi=1.2), 0.05, 0.7)
    turf = with_ao(paint('tf', [(0.0, lin(92, 96, 36)), (0.4, lin(136, 128, 44)), (0.7, lin(176, 154, 56)), (1.0, lin(214, 186, 84))], wn=0.35, noise=0.75, nscale=6, seed=4.0, bias=0.05), 0.06, 0.8)
    parts = [plate('foot', blob((0, -0.01), 0.46, rng, 18, wob=0.1), mud_mat())]
    H, R = 0.25, 0.41
    lumps = [(rng.uniform(0, 6.28), rng.uniform(0.12, 0.3), rng.uniform(0.02, 0.05)) for _ in range(9)]

    def top(x, y):
        base = H * math.sqrt(max(0.0, 1 - (x * x + y * y) / (R * R)))
        return base + sum(h * math.exp(-((x - math.cos(a) * r) ** 2 + (y - math.sin(a) * r) ** 2) / 0.012) for a, r, h in lumps) * min(1.0, base / 0.08)

    # the mound as a lumpy cap, nothing below the ground; a ragged outline, peat showing between the skirts
    rings = []
    for k, t in enumerate((1.0, 0.94, 0.82, 0.64, 0.42, 0.2)):
        ring = []
        for i in range(18):
            a = 2 * math.pi * i / 18
            w = 1.0 + (0.07 * math.sin(a * 3 + 1.0) + 0.05 * math.sin(a * 5)) * (0.4 + 0.6 * t)
            x, y = math.cos(a) * R * t * w, math.sin(a) * R * t * w * 0.94
            ring.append((x, y, top(x * 0.98, y * 0.98) if t < 1.0 else 0.008))
        rings.append(ring)
    rings.append([(0.0, 0.0, top(0.0, 0.0) + 0.004)])
    mound = loft('mound', rings, turf, cap=False)
    # an open cap: recalc cannot tell the outside, so point every face away from a spot under the ground
    bm = bmesh.new()
    bm.from_mesh(mound.data)
    bmesh.ops.reverse_faces(bm, faces=[f for f in bm.faces if f.normal.dot(f.calc_center_median() - Vector((0, 0, -0.3))) < 0])
    bm.to_mesh(mound.data)
    bm.free()
    parts.append(mound)
    for i, (x, y, r) in enumerate(((-0.27, -0.24, 0.1), (0.04, -0.35, 0.09), (0.3, -0.22, 0.1))):
        parts.append(ico(f'lb{i}', (x, y, 0.015), r, rng, earth, squash=(1.0, 0.9, 0.6), jitter=0.05))
    # skirts of grass falling over the flank
    for i in range(34):
        a = 2 * math.pi * i / 34 + rng.uniform(-0.08, 0.08)
        rr = rng.uniform(0.27, 0.36)
        x, y = math.cos(a) * rr, math.sin(a) * rr * 0.94
        parts.append(blade(f'g{i}', (x, y, top(x, y) + 0.008), a + rng.uniform(-0.3, 0.3), rng.uniform(0.02, 0.05), rng.uniform(0.1, 0.14), rng.uniform(0.026, 0.036), grass, curl=0.5, n=3))
    # upright tufts on the crown, in small fans
    for i, (x, y) in enumerate(((-0.24, 0.17), (0.25, 0.14), (0.03, 0.26), (-0.28, -0.06), (0.04, 0.02), (0.2, -0.12), (-0.1, -0.16))):
        for k in range(5):
            a = 2 * math.pi * k / 5 + rng.uniform(-0.3, 0.3)
            big = i < 4
            parts.append(blade(f'tu{i}{k}', (x + math.cos(a) * 0.012, y + math.sin(a) * 0.012, top(x, y) - 0.004), a, rng.uniform(0.13, 0.2) if big else rng.uniform(0.07, 0.1), 0.06 if big else 0.04, 0.019, tuft, curl=0.08, n=3))
    # heather: clusters of pale pink spikes
    heath = solid('h', (178, 104, 158), (250, 186, 226), wn=0.3, noise=0.05, bias=0.3)
    for i, (x, y) in enumerate(((-0.13, 0.05), (0.14, 0.1), (-0.03, -0.24), (0.27, -0.03), (-0.3, 0.03))):
        z = top(x, y)
        for k in range(5):
            sx, sy = x + rng.uniform(-0.035, 0.035), y + rng.uniform(-0.035, 0.035)
            parts.append(blade(f'he{i}{k}', (sx, sy, z - 0.004), rng.uniform(0, 6.28), rng.uniform(0.11, 0.15), 0.014, 0.026, heath, curl=0.0, n=2))
    for i, (x, y, r) in enumerate(((-0.37, -0.31, 0.06), (-0.14, -0.43, 0.04), (0.19, -0.41, 0.05))):
        parts.append(gem(f's{i}', (x, y, 0.0), (r * 1.25, r, r * 0.85), rng, stone, cuts=7, zmin=0.0))
    finish(join(parts, 'tussock_a'), 'tussock_a', size=512)


# ---------------------------------------------------------------- boardwalk

DECK = 0.16
POST = 0.36
HALF = 0.34


def wood_mats():
    return (
        with_ao(with_moss(img('pl', 'nature_planks.png', u=(1, 0, 0), v=(0, 1, 0), scale=1.45, lo=0.78, hi=1.14, tint=(1.0, 0.88, 0.72)), col=lin(104, 106, 42), scale=9, cover=0.3, seed=2.0), 0.05, 0.42),
        with_ao(with_moss(img('pl2', 'nature_planks.png', u=(0, 1, 0), v=(1, 0, 0), scale=1.45, lo=0.78, hi=1.14, tint=(1.0, 0.88, 0.72)), col=lin(104, 106, 42), scale=9, cover=0.3, seed=6.0), 0.05, 0.42),
        with_ao(with_moss(img('po', 'nature_driftwood.png', scale=2.6, tint=(0.8, 0.62, 0.4), pivot=(0, 0, 0.1)), col=lin(88, 90, 34), z=(0.03, 0.13), cover=0.86, scale=24), 0.06, 0.5),
        solid('cut', (168, 126, 78), (222, 186, 128), wn=0.5, bias=0.1),
        rope_mat(),
        with_ao(solid('beam', (46, 34, 22), (86, 62, 40), wn=0.7), 0.06, 0.55),
    )


def post(parts, M, x, y, h, name, ring=None):
    _, _, po, cut, rope, _ = M
    r = 0.052
    parts.append(tube(f'{name}p', [((x, y, 0), r * 1.1), ((x, y, h * 0.5), r), ((x, y, h - 0.012), r)], po, 8, cap=False))
    top = [(x + math.cos(2 * math.pi * k / 8) * r, y + math.sin(2 * math.pi * k / 8) * r, h - 0.012) for k in range(8)]
    t2 = [(x + (px - x) * 0.82, y + (py - y) * 0.82, h) for px, py, _ in top]
    parts.append(loft(f'{name}t', [top, t2], cut, cap=True))
    if ring:
        for k, z in enumerate((ring, ring - 0.028)):
            parts.append(tube(f'{name}r{k}', [((x, y, z - 0.015), r + 0.012), ((x, y, z + 0.015), r + 0.012)], rope, 8))


def rope_span(parts, M, p0, p1, z, sag, name, n=7):
    path = []
    for i in range(n + 1):
        t = i / n
        path.append(((p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, z - sag * 4 * t * (1 - t)), 0.014))
    parts.append(tube(name, path, M[4], 5))


def planks_y(parts, M, x0, x1, y0, y1, rng, name, count):
    """Planks across the walk (long along x), one after the other along y."""
    step = (y1 - y0) / count
    for i in range(count):
        cy = y0 + step * (i + 0.5)
        parts.append(box(f'{name}{i}', ((x0 + x1) / 2 + rng.uniform(-0.008, 0.008), cy, DECK - 0.012 + rng.uniform(-0.002, 0.002)), (x1 - x0 + rng.uniform(-0.012, 0.012), step - 0.009, 0.026), M[0], rot=(0, 0, rng.uniform(-0.012, 0.012))))


def planks_x(parts, M, x0, x1, y0, y1, rng, name, count):
    step = (x1 - x0) / count
    for i in range(count):
        cx = x0 + step * (i + 0.5)
        parts.append(box(f'{name}{i}', (cx, (y0 + y1) / 2 + rng.uniform(-0.008, 0.008), DECK - 0.012 + rng.uniform(-0.002, 0.002)), (step - 0.009, y1 - y0 + rng.uniform(-0.012, 0.012), 0.026), M[1], rot=(0, 0, rng.uniform(-0.012, 0.012))))


def stringer(parts, M, p0, p1, name):
    cx, cy = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
    sx, sy = abs(p1[0] - p0[0]) or 0.045, abs(p1[1] - p0[1]) or 0.045
    parts.append(box(name, (cx, cy, DECK - 0.05), (sx, sy, 0.05), M[5]))


def boardwalk_straight():
    reset()
    M = wood_mats()
    rng = random.Random(251)
    parts = []
    planks_y(parts, M, -HALF, HALF, -0.5, 0.5, rng, 'k', 9)
    for s in (-1, 1):
        stringer(parts, M, (s * HALF * 0.72, -0.5), (s * HALF * 0.72, 0.5), f'st{s}')
    z = POST - 0.05
    pts = [(HALF + 0.03, -0.42), (HALF + 0.03, 0.42), (-HALF - 0.03, -0.42), (-HALF - 0.03, 0.42)]
    for i, (x, y) in enumerate(pts):
        post(parts, M, x, y, POST, f'p{i}', ring=z if x > 0 else None)
    rope_span(parts, M, pts[0], pts[1], z, 0.085, 'r')
    finish(join(parts, 'boardwalk_straight'), 'boardwalk_straight', size=512)


def boardwalk_corner():
    """Walk comes in from the south and turns east; the north arm plate has boards running north to south."""
    reset()
    M = wood_mats()
    rng = random.Random(252)
    parts = []
    planks_y(parts, M, -HALF, HALF, -0.5, -0.26, rng, 'k', 2)
    planks_y(parts, M, -HALF, 0.02, -0.26, HALF, rng, 'n', 5)
    planks_x(parts, M, 0.02, 0.5, -0.26, HALF, rng, 'e', 4)
    for s in (-1, 1):
        stringer(parts, M, (s * HALF * 0.72, -0.5), (s * HALF * 0.72, HALF), f'st{s}')
    stringer(parts, M, (0, HALF * 0.72), (0.5, HALF * 0.72), 'sn')
    stringer(parts, M, (0, -0.19), (0.5, -0.19), 'ss')
    z = POST - 0.05
    pts = [(-HALF - 0.03, -0.42), (HALF + 0.03, -0.42), (0.42, -0.29), (-HALF - 0.03, HALF + 0.03), (0.42, HALF + 0.03)]
    for i, (x, y) in enumerate(pts):
        post(parts, M, x, y, POST, f'p{i}', ring=z if i >= 3 else None)
    rope_span(parts, M, pts[3], pts[4], z, 0.085, 'r')
    finish(join(parts, 'boardwalk_corner'), 'boardwalk_corner', size=512)


def boardwalk_end():
    reset()
    M = wood_mats()
    rng = random.Random(253)
    parts = []
    planks_y(parts, M, -HALF, HALF, -0.5, 0.3, rng, 'k', 7)
    for s in (-1, 1):
        stringer(parts, M, (s * HALF * 0.72, -0.5), (s * HALF * 0.72, 0.3), f'st{s}')
    tall = POST + 0.1
    z = tall - 0.05
    n0, n1 = (-HALF - 0.01, 0.33), (HALF + 0.01, 0.33)
    post(parts, M, *n0, tall, 'a', ring=z)
    post(parts, M, *n1, tall, 'b', ring=z)
    rope_span(parts, M, n0, n1, z, 0.1, 'r')
    post(parts, M, -HALF - 0.03, -0.42, POST, 'c')
    post(parts, M, HALF + 0.03, -0.42, POST, 'd')
    finish(join(parts, 'boardwalk_end'), 'boardwalk_end', size=512)


# ---------------------------------------------------------------- rock

def rock_mat(moss_up=(0.25, 0.75), cover=0.42):
    return with_ao(with_moss(img('rock', 'nature_rocksoft.png', scale=0.9, lo=0.42, hi=1.12, tint=(0.92, 0.9, 0.84)), col=lin(124, 118, 46), scale=5, cover=cover, up=moss_up, seed=5.0), 0.1, 0.45)


def dry_grass(parts, c, n, h, spread, rng, mat, prefix):
    for i in range(n):
        a = i * 2.399 + rng.uniform(-0.4, 0.4)
        rr = spread * rng.uniform(0.1, 1.0)
        parts.append(blade(f'{prefix}{i}', (c[0] + math.cos(a) * rr, c[1] + math.sin(a) * rr, c[2]), a, h * rng.uniform(0.65, 1.1), h * 0.42, 0.028, mat, curl=0.12))


def grass_mat(top=(214, 172, 66)):
    return with_ao(paint('dry', [(0.0, lin(96, 96, 36)), (0.5, lin(152, 136, 50)), (1.0, lin(*top))], z=(0.0, 0.2), wz=0.8, wn=0.25, noise=0.05, nscale=18, seed=4.0, bias=0.0), 0.06, 0.6)


def boulder_a():
    reset()
    rng = random.Random(264)
    rock = rock_mat()
    gr = grass_mat()
    small = with_ao(img('st', 'nature_rock.png', scale=2.8), 0.05, 0.55)
    parts = [gem('b', (0, 0.0, 0.22), (0.61, 0.59, 0.8), rng, rock, cuts=26, zmin=0.0, bevel=0.02, f=(0.95, 1.0))]
    gtop = solid('mt', (96, 100, 34), (146, 146, 56), wn=0.5)
    # grass on the crown and at the foot, like the reference
    dry_grass(parts, (0.06, 0.06, 0.96), 9, 0.16, 0.05, rng, gr, 't')
    dry_grass(parts, (-0.46, -0.36, 0.0), 10, 0.22, 0.08, rng, gr, 'a')
    dry_grass(parts, (0.3, -0.5, 0.0), 10, 0.22, 0.1, rng, gr, 'c')
    dry_grass(parts, (0.54, -0.2, 0.0), 7, 0.2, 0.05, rng, gr, 'd')
    for i, (x, y, r) in enumerate(((-0.47, -0.36, 0.055), (0.16, -0.5, 0.045))):
        parts.append(gem(f's{i}', (x, y, 0.0), (r * 1.2, r, r), rng, small, cuts=7, zmin=0.0))
    finish(join(parts, 'boulder_a'), 'boulder_a', size=512)


def bone_mat():
    return with_ao(solid('bone', (176, 150, 110), (240, 226, 190), wn=0.75, noise=0.03, bias=0.05), 0.04, 0.6)


def bone(parts, p0, p1, r, mat, name):
    a, b = Vector(p0), Vector(p1)
    parts.append(tube(name, [(tuple(a), r), (tuple(b), r)], mat, 5))
    rng0 = random.Random(1)
    for k, e in enumerate((a, b)):
        side = (b - a).normalized().cross(Vector((0, 0, 1))).normalized()
        parts.append(ico(f'{name}x{k}', tuple(e + side * r * 0.8), r * 1.45, rng0, mat, jitter=0.0))
        parts.append(ico(f'{name}y{k}', tuple(e - side * r * 0.8), r * 1.45, rng0, mat, jitter=0.0))


def wolf_cave_a():
    reset()
    rng = random.Random(271)
    rock = rock_mat(cover=0.4)
    dirt = with_ao(paint('dirt', [(0.0, lin(102, 72, 44)), (0.5, lin(146, 110, 70)), (1.0, lin(182, 146, 98))], wn=0.25, noise=0.26, nscale=20, seed=6.0, bias=0.36), 0.08, 0.55)
    dark = solid('dark', (6, 5, 6), (24, 20, 20), wn=0.5, noise=0.02)
    floor = paint('fl', [(0.0, lin(10, 8, 8)), (1.0, lin(118, 86, 56))], z=None, wn=0.0, noise=0.0)
    gr = grass_mat()
    bn = bone_mat()
    parts = [plate('dirt', blob((0, -0.06), 0.53, rng, 16, wob=0.08, sy=0.92), dirt)]
    # dark throat: a low dome behind the opening, its front face is what you look into
    parts.append(gem('throat', (0, 0.06, 0.2), (0.4, 0.28, 0.42), rng, dark, cuts=12, zmin=0.0))
    # arch: wedge blocks around the opening, then an outer layer and the crown
    half, rise = 0.31, 0.58
    fy = -0.2
    n = 7
    for i in range(n):
        a = math.pi * (i + 0.5) / n
        x, z = -math.cos(a) * (half + 0.13), math.sin(a) * (rise + 0.1)
        parts.append(gem(f'a{i}', (x, fy, z), (0.15, 0.14, 0.14), rng, rock, cuts=11, zmin=0.0, bevel=0.007))
    parts.append(gem('dome', (0, 0.3, 0.28), (0.6, 0.3, 0.78), rng, rock, cuts=24, zmin=0.0, bevel=0.012, f=(0.92, 1.0)))
    for i, (x, y, z, rx, ry, rz) in enumerate((
        (-0.47, 0.0, 0.2, 0.13, 0.26, 0.26), (0.47, 0.0, 0.2, 0.13, 0.26, 0.26),
        (-0.4, -0.02, 0.6, 0.17, 0.17, 0.2), (0.41, -0.02, 0.6, 0.17, 0.17, 0.2), (0.0, -0.1, 0.86, 0.34, 0.2, 0.2), (-0.26, -0.14, 0.76, 0.18, 0.16, 0.16), (0.27, -0.14, 0.76, 0.18, 0.16, 0.16),
    )):
        parts.append(gem(f'o{i}', (x, y, z), (rx, ry, rz), rng, rock, cuts=13, zmin=0.0))
    # dirt lit into the mouth
    parts.append(plate('mouth', [(-0.29, fy - 0.08, 0.01), (0.29, fy - 0.08, 0.01), (0.24, 0.0, 0.01), (-0.24, 0.0, 0.01)], solid('m', (40, 30, 24), (76, 58, 42), wn=0.0, noise=0.1, nscale=24, bias=0.4)))
    # ribcage: spine and five hoops
    sp = (-0.1, -0.38)
    parts.append(tube('spine', [((sp[0] - 0.13, sp[1] + 0.04, 0.12), 0.012), ((sp[0] + 0.12, sp[1] + 0.04, 0.11), 0.012)], bn, 5))
    for k in range(5):
        x = sp[0] - 0.11 + k * 0.055
        f = 1.0 - abs(k - 2) * 0.12
        for side in (-1, 1):
            q = lambda u, v: ((x + u * 0.3, sp[1] + 0.04 + side * u * f, v * f), 0.008)
            parts.append(tube(f'rb{k}{side}', [q(0.0, 0.12), q(0.07, 0.11), q(0.1, 0.06), q(0.075, 0.012)], bn, 4))
    # skull: rounded cranium, snout, dark eye, teeth
    sk = (0.26, -0.4)
    parts.append(ico('skull', (sk[0] + 0.03, sk[1] + 0.03, 0.05), 0.078, rng, bn, squash=(1.0, 1.0, 0.85), jitter=0.04, subdiv=2))
    parts.append(tube('snout', [((sk[0] + 0.01, sk[1], 0.055), 0.04), ((sk[0] - 0.07, sk[1] - 0.035, 0.035), 0.03), ((sk[0] - 0.13, sk[1] - 0.05, 0.022), 0.02)], bn, 5))
    eye = solid('eye', (18, 12, 10), (36, 26, 20), wn=0.2)
    parts.append(ico('eye', (sk[0] - 0.005, sk[1] - 0.05, 0.08), 0.017, rng, eye, jitter=0.0))
    for k in range(4):
        parts.append(limb(f'tt{k}', (sk[0] - 0.12 + k * 0.025, sk[1] - 0.066 + k * 0.012, 0.022), (sk[0] - 0.12 + k * 0.025, sk[1] - 0.068 + k * 0.012, 0.004), 0.006, 0.003, bn, n=1, segs=3))
    bone(parts, (-0.4, -0.3, 0.018), (-0.28, -0.38, 0.018), 0.009, bn, 'b1')
    bone(parts, (0.04, -0.27, 0.014), (0.13, -0.31, 0.014), 0.007, bn, 'b2')
    bone(parts, (0.0, -0.45, 0.012), (0.09, -0.42, 0.012), 0.006, bn, 'b3')
    dry_grass(parts, (-0.45, -0.1, 0.0), 8, 0.22, 0.05, rng, gr, 'ga')
    dry_grass(parts, (0.45, -0.17, 0.0), 8, 0.22, 0.05, rng, gr, 'gb')
    finish(join(parts, 'wolf_cave_a'), 'wolf_cave_a', size=512)


# ---------------------------------------------------------------- camp

def tattered(p0, p1, z, n, rng, amp=0.05):
    """Points from p0 to p1 along the hem, with a torn zigzag."""
    pts = []
    for i in range(n + 1):
        t = i / n
        pts.append((p0[0] + (p1[0] - p0[0]) * t + rng.uniform(-0.008, 0.008), p0[1] + (p1[1] - p0[1]) * t + rng.uniform(-0.008, 0.008), z + (0 if i % 2 == 0 else rng.uniform(amp * 0.5, amp))))
    return pts


def fan(name, apex, hem, mat, mid=0.55, bulge=None):
    """Canvas sheet from an apex down to a hem. A row between them gives it folds."""
    bm = bmesh.new()
    a = bm.verts.new(apex)
    hv = [bm.verts.new(p) for p in hem]
    row = []
    for i, p in enumerate(hem):
        q = Vector(apex).lerp(Vector(p), mid)
        if bulge and i % 2 == 1:
            q += Vector(bulge)
        row.append(bm.verts.new(q))
    for i in range(len(hem) - 1):
        bm.faces.new((a, row[i], row[i + 1]))
        bm.faces.new((row[i], hv[i], hv[i + 1], row[i + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_object(name, bm)
    o.data.materials.append(mat)
    return o


def on_slope(apex, base_a, base_b, u, v):
    """Point on the triangle apex/base_a/base_b, u across, v down from the apex; slightly raised outwards later."""
    A, B, C = Vector(apex), Vector(base_a), Vector(base_b)
    h = A.lerp(B.lerp(C, u), v)
    return h


def patch(parts, apex, a, b, u0, u1, v0, v1, mat, stitch, name, rng):
    a, b = (a[0], a[1], 0), (b[0], b[1], 0)
    A, B, C = Vector(apex), Vector(a), Vector(b)
    n = (B - A).cross(C - A).normalized()
    # outward: away from the tent axis
    if n.dot((B + C) / 2 - Vector((A.x, A.y, (B.z + C.z) / 2))) < 0:
        n = -n
    corners = [on_slope(apex, a, b, u0, v0), on_slope(apex, a, b, u1, v0 + rng.uniform(-0.02, 0.02)), on_slope(apex, a, b, u1, v1), on_slope(apex, a, b, u0, v1 + rng.uniform(-0.02, 0.02))]
    pts = [tuple(c + n * 0.04) for c in corners]
    parts.append(plate(name, pts, mat))
    for k in range(4):
        p, q = corners[k], corners[(k + 1) % 4]
        for t in (0.25, 0.75):
            c = p.lerp(q, t) + n * 0.045
            d = (q - p).normalized() * 0.004
            e = n.cross(q - p).normalized() * 0.014
            parts.append(plate(f'{name}s{k}{t}', [tuple(c - e - d), tuple(c - e + d), tuple(c + e + d), tuple(c + e - d)], stitch))


def camp_tent_a():
    reset()
    rng = random.Random(281)
    cloth = with_ao(img('canvas', 'nature_canvas.png', scale=1.15, lo=0.66, hi=1.1, tint=(0.97, 0.95, 0.88)), 0.1, 0.55)
    inner = paint('inner', [(0.0, lin(24, 18, 14)), (1.0, lin(66, 48, 32))], wn=0.0, noise=0.2, nscale=8, seed=3.0, bias=0.35)
    floorm = paint('inf', [(0.0, lin(64, 48, 34)), (1.0, lin(132, 104, 72))], wn=0.0, noise=0.2, nscale=20, seed=4.0, bias=0.4)
    pole = with_ao(img('pole', 'nature_driftwood.png', scale=3.0, tint=(0.82, 0.62, 0.42), pivot=(0, 0, 0.1)), 0.06, 0.5)
    rope = rope_mat()
    slate = with_ao(solid('slate', (92, 94, 108), (150, 150, 162), wn=0.7), 0.05, 0.75)
    rose = with_ao(solid('rose', (128, 74, 76), (190, 124, 118), wn=0.7), 0.05, 0.75)
    ochre = with_ao(solid('ochre', (150, 112, 54), (214, 170, 96), wn=0.7), 0.05, 0.75)
    stitch = solid('st', (82, 60, 40), (120, 92, 62), wn=0.2)
    apex = (0, 0.06, 0.92)
    w, e, ne, nw = (-0.62, -0.26), (0.62, -0.26), (0.46, 0.44), (-0.46, 0.44)
    doorl, doorr = (-0.15, -0.46), (0.15, -0.46)
    parts = []
    parts.append(fan('west', apex, tattered(nw, w, 0.0, 6, rng, 0.07), cloth, bulge=(-0.02, 0, 0)))
    parts.append(fan('east', apex, tattered(e, ne, 0.0, 6, rng, 0.07), cloth, bulge=(0.02, 0, 0)))
    parts.append(fan('north', apex, tattered(ne, nw, 0.0, 5, rng, 0.04), cloth))
    parts.append(fan('fl', apex, tattered(w, doorl, 0.0, 6, rng, 0.06), cloth))
    parts.append(fan('fr', apex, tattered(doorr, e, 0.0, 6, rng, 0.06), cloth))
    # seams and sag lines from the apex, canvas is sewn from strips
    seam = solid('seam', (120, 94, 62), (168, 138, 96), wn=0.3)
    for k, (bx, by) in enumerate(((-0.34, -0.38), (0.34, -0.38), (-0.54, 0.09), (0.54, 0.09))):
        mx, my = bx * 0.55, apex[1] + (by - apex[1]) * 0.55
        parts.append(tube(f'sm{k}', [((apex[0] + bx * 0.08, apex[1] + (by - apex[1]) * 0.08, apex[2] - 0.05), 0.006), ((mx * 1.04, my * 1.04, apex[2] * 0.46), 0.007), ((bx * 1.01, by * 1.01, 0.01), 0.006)], seam, 3))
    # folded-back flap edges, the lit inside of the canvas
    fold = with_ao(img('foldc', 'nature_canvas.png', scale=1.2, lo=0.82, hi=1.14, tint=(0.9, 0.82, 0.68)), 0.06, 0.7)
    parts.append(plate('foldl', [(apex[0] - 0.012, apex[1] - 0.09, apex[2] - 0.2), (-0.15, -0.47, 0.0), (-0.3, -0.42, 0.05)], fold))
    parts.append(plate('foldr', [(apex[0] + 0.012, apex[1] - 0.09, apex[2] - 0.2), (0.3, -0.42, 0.05), (0.15, -0.47, 0.0)], fold))
    # inside: dark back plate and ground, so the opening reads as depth
    parts.append(plate('inback', [(-0.34, 0.1, 0.0), (0.34, 0.1, 0.0), (0.0, 0.1, 0.68)], inner))
    parts.append(plate('infloor', [(-0.34, 0.1, 0.008), (0.34, 0.1, 0.008), (0.16, -0.46, 0.008), (-0.16, -0.46, 0.008)], floorm))
    # patches on the two front faces
    patch(parts, apex, w, doorl, 0.08, 0.72, 0.42, 0.66, slate, stitch, 'p1', rng)
    patch(parts, apex, w, doorl, 0.34, 0.95, 0.72, 0.94, ochre, stitch, 'p3', rng)
    patch(parts, apex, doorr, e, 0.2, 0.92, 0.42, 0.72, rose, stitch, 'p2', rng)
    # crossed poles above the apex, tied with rope
    for s in (-1, 1):
        parts.append(tube(f'x{s}', [((apex[0] - s * 0.05, apex[1], apex[2] - 0.14), 0.024), ((apex[0] + s * 0.07, apex[1], apex[2] + 0.13), 0.021)], pole, 6))
    parts.append(tube('knot', [((0, apex[1], apex[2] - 0.05), 0.044), ((0, apex[1], apex[2] + 0.015), 0.044)], rope, 6))
    # edge poles along the front
    parts.append(tube('pl', [((-0.15, -0.385, 0.0), 0.016), ((apex[0] - 0.02, apex[1] - 0.03, apex[2] - 0.08), 0.014)], pole, 5))
    parts.append(tube('pr', [((0.15, -0.385, 0.0), 0.016), ((apex[0] + 0.02, apex[1] - 0.03, apex[2] - 0.08), 0.014)], pole, 5))
    # guy ropes and pegs
    for i, (x, y) in enumerate(((-0.6, -0.42), (0.6, -0.42), (0.54, 0.47), (-0.54, 0.47))):
        parts.append(tube(f'peg{i}', [((x, y, 0), 0.02), ((x, y, 0.075), 0.018)], pole, 5))
        parts.append(tube(f'pgr{i}', [((x, y, 0.05), 0.024), ((x, y, 0.07), 0.024)], rope, 5))
        parts.append(tube(f'gy{i}', [((x * 0.62, y * 0.62 + 0.02, 0.34), 0.006), ((x, y, 0.065), 0.006)], rope, 3))
    finish(join(parts, 'camp_tent_a'), 'camp_tent_a', size=512)


def hanging(name, x0, x1, ztop, length, y, mat, rng, teeth=4):
    """A worn cloth hanging from the pole, with a torn hem and a soft wave."""
    n = teeth * 2
    top = [(x0 + (x1 - x0) * i / n, y, ztop) for i in range(n + 1)]
    bot = [(x0 + (x1 - x0) * i / n + rng.uniform(-0.005, 0.005), y + (0.002 if i % 2 else -0.002), ztop - length * (rng.uniform(0.92, 1.05) if i % 2 else rng.uniform(0.66, 0.82))) for i in range(n + 1)]
    bm = bmesh.new()
    t = [bm.verts.new(p) for p in top]
    b = [bm.verts.new(p) for p in bot]
    for i in range(n):
        bm.faces.new((t[i], b[i], b[i + 1], t[i + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.y > 0:
            f.normal_flip()
    o = mesh_object(name, bm)
    o.data.materials.append(mat)
    return o


def camp_rack_a():
    reset()
    rng = random.Random(291)
    pole = with_ao(img('pole', 'nature_driftwood.png', scale=3.0, tint=(0.92, 0.7, 0.48), pivot=(0, 0, 0.1)), 0.05, 0.45)
    rope = rope_mat()
    cut = solid('cut', (168, 126, 78), (222, 186, 128), wn=0.5, bias=0.1)
    parts = []
    H = 0.84
    for s in (-1, 1):
        x = s * 0.4
        for k in (-1, 1):
            parts.append(tube(f'l{s}{k}', [((x + k * 0.08 + s * 0.03, k * 0.14, 0.0), 0.037), ((x - k * 0.035, -k * 0.035, H + 0.1), 0.031)], pole, 6))
        parts.append(tube(f'k{s}', [((x - 0.02, 0, H - 0.05), 0.05), ((x + 0.02, 0, H + 0.005), 0.05)], rope, 6))
    parts.append(tube('bar', [((-0.5, 0, H - 0.02), 0.033), ((0.5, 0, H - 0.02), 0.033)], pole, 6))
    for x in (-0.5, 0.5):
        parts.append(plate(f'c{x}', [(x + (0.001 if x > 0 else -0.001), math.cos(2 * math.pi * k / 6) * 0.033, H - 0.02 + math.sin(2 * math.pi * k / 6) * 0.033) for k in range(6)], cut))
    cream = with_ao(img('cl', 'nature_canvas.png', u=(1, 0, 0), v=(0, 0, 1), scale=1.8, lo=0.8, hi=1.14), 0.06, 0.65)
    rose = with_ao(solid('rose', (124, 74, 72), (186, 122, 114), wn=0.3, noise=0.1, nscale=30), 0.06, 0.65)
    slate = with_ao(solid('slate', (88, 90, 104), (146, 146, 158), wn=0.3, noise=0.1, nscale=30), 0.06, 0.65)
    hide = with_ao(paint('hide', [(0.0, lin(130, 88, 50)), (0.55, lin(186, 140, 88)), (1.0, lin(228, 196, 140))], wn=0.25, noise=0.26, nscale=16, seed=6.0, bias=0.38), 0.06, 0.65)
    y = -0.03
    y = -0.04
    parts.append(hanging('c1', -0.33, -0.17, H + 0.012, 0.5, y, cream, rng, teeth=4))
    parts.append(hanging('c2', -0.16, -0.05, H + 0.012, 0.42, y, rose, rng, teeth=3))
    parts.append(hanging('c3', -0.04, 0.09, H + 0.012, 0.48, y, slate, rng, teeth=3))
    # the hide: a broad outline with legs
    hx, hz = 0.235, H + 0.012
    out = [(-0.12, 0.0), (0.12, 0.0), (0.17, -0.06), (0.125, -0.12), (0.16, -0.24), (0.135, -0.33), (0.075, -0.38), (0.045, -0.46), (0.0, -0.42), (-0.045, -0.46), (-0.075, -0.38), (-0.135, -0.33), (-0.16, -0.24), (-0.125, -0.12), (-0.17, -0.06)]
    parts.append(plate('hide', [(hx + a, y - 0.005, hz + b) for a, b in out], hide))
    finish(join(parts, 'camp_rack_a'), 'camp_rack_a', size=512)


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    jobs = {
        'grove_a': grove_a,
        'grove_b': grove_b,
        'grove_c': grove_c,
        'grove_autumn_a': grove_autumn_a,
        'grove_snow_a': grove_snow_a,
        'fir_a': fir_a,
        'deadtree_b': deadtree_b,
        'stump_a': stump_a,
        'bush_low_a': bush_low_a,
        'reed_a': lambda: reed('reed_a', 232, 30, 0.6, 0.86, 0.13, 0.15, [(-0.06, 0.03, 0.78, -0.08), (0.03, 0.05, 0.9, 0.03), (0.09, 0.0, 0.68, 0.12)], 0.22, 0.042),
        'reed_b': lambda: reed('reed_b', 233, 26, 0.34, 0.54, 0.16, 0.2, [(0.0, 0.04, 0.58, -0.02), (0.09, 0.02, 0.48, 0.08)], 0.24, 0.04),
        'lily_a': lily_a,
        'tussock_a': tussock_a,
        'boardwalk_straight': boardwalk_straight,
        'boardwalk_corner': boardwalk_corner,
        'boardwalk_end': boardwalk_end,
        'boulder_a': boulder_a,
        'camp_tent_a': camp_tent_a,
        'camp_rack_a': camp_rack_a,
        'wolf_cave_a': wolf_cave_a,
    }
    for name, fn in jobs.items():
        if not only or name in only:
            fn()
