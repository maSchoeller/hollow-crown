"""Village, farm and land props, modelled after the ChatGPT sheets art/mockups/map-assets/refs/village_1..3.png.

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/village.py [-- id ...]

Fields: field_open, field_burnt (no frame, soil visible, tile centre free). Land: hay_a, vine_a, terrace_a, fence_wicker_a,
paddock_straight, paddock_corner, paddock_gate, sign_a, lantern_post_a. Buildings: mill_idle, barn_a, stable_a (two tiles),
market_a, market_b, house_town_a, house_town_b, lodge_b_intact, lodge_b_visited, lodge_b_razed, roof_tile_idle.

Textures: art/props/textures/village_*.png, cut from refs/village_tex.png (art/prompts/map_assets_village.md).
South faces -y. Fixed seeds, deterministic. Writes art/models/props/<id>.glb and previews.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import bake_texture, export, flat, join, mesh_object, preview, reset, tris, unwrap, vertex_colors  # noqa: E402
from facing import face_camera  # noqa: E402
from fortify import extrude_y, image_mat, rounded  # noqa: E402
from houses import box, circle, lin, loft, paint  # noqa: E402


def tone(name, dark, light, seed, wn=0.8, noise=0.08, nscale=12.0, stretch=(1, 1, 1), bias=0.0):
    light = tuple(v * 0.86 for v in light)
    return paint(name, [(0.0, lin(*dark)), (1.0, lin(*light))], wn=wn, noise=noise, nscale=nscale, seed=seed, stretch=stretch, bias=bias)


def crevices(obj, distance=0.09, floor=0.34):
    """Multiplies an ambient occlusion term into every base colour, the bake keeps it: painted dark seams under scales, eaves and beams."""
    for slot in obj.material_slots:
        m = slot.material
        if m.name.startswith(('v_lit', 'v_ember')):
            continue
        n, L = m.node_tree.nodes, m.node_tree.links
        inp = n['Principled BSDF'].inputs['Base Color']
        if not inp.links:
            continue
        src = inp.links[0].from_socket
        ao = n.new('ShaderNodeAmbientOcclusion')
        ao.samples = 8
        ao.only_local = True
        ao.inputs['Distance'].default_value = distance
        mr = n.new('ShaderNodeMapRange')
        mr.inputs['To Min'].default_value = floor
        L.new(ao.outputs['AO'], mr.inputs['Value'])
        mul = n.new('ShaderNodeVectorMath')
        mul.operation = 'SCALE'
        L.new(src, mul.inputs[0])
        L.new(mr.outputs['Result'], mul.inputs['Scale'])
        L.new(mul.outputs[0], inp)


# Preview angle: the sheets look from about 58 degrees; VILLAGE_TILT=35 renders the real game camera for checks.
TILT = float(os.environ.get('VILLAGE_TILT', 58))


def done(obj, pid, size=256):
    """finish() with crevice shading, then the preview again straight from the south, comparable with the reference."""
    bpy.context.scene.cycles.samples = 24
    face_camera(obj)
    crevices(obj)
    # common.finish with a tighter UV margin: sharper bake, and tiny pieces keep their colour
    flat(obj)
    names = [m.name for m in obj.data.materials]
    for p in obj.data.polygons:
        if names[p.material_index].startswith('v_grain'):
            p.use_smooth = True
    unwrap(obj, margin=0.008)
    bake_texture(obj, size, pid)
    vertex_colors(obj)
    export(obj, pid)
    preview(obj, pid)
    print(f'{pid}: {tris(obj)} triangles')
    scene = bpy.context.scene
    cam = scene.camera
    pts = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    tilt = math.radians(TILT)
    us = [p.x for p in pts]
    vs = [p.y * math.cos(tilt) + p.z * math.sin(tilt) for p in pts]
    cam.data.ortho_scale = max(max(us) - min(us), max(vs) - min(vs)) * 1.12
    cen = sum(pts, Vector()) / 8
    bpy.data.objects['target'].location = cen
    cam.location = cen + Vector((0, -math.sin(tilt), math.cos(tilt))) * 8
    scene.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items} else 'BLENDER_EEVEE_NEXT'
    bpy.ops.render.render(write_still=True)
    scene.render.engine = 'CYCLES'


class V:
    def __init__(self):
        self.stone = image_mat('v_stone', 'village_stone.png', 'wall', 2.6, tint=(0.74, 0.7, 0.64))
        self.soot = image_mat('v_soot', 'village_stone.png', 'wall', 2.6, tint=(0.34, 0.3, 0.27))
        self.thatch = image_mat('v_thatch', 'village_thatch.png', 'wall', 3.0, tint=(0.82, 0.76, 0.66))
        self.thatch2 = image_mat('v_thatch2', 'village_thatch.png', 'wall', 3.0, tint=(0.7, 0.6, 0.46))
        straw = [(0.0, lin(118, 68, 16)), (0.42, lin(190, 122, 32)), (1.0, lin(236, 176, 72))]
        self.thx = [paint(f'v_thx{i}', straw, wn=0.6, noise=0.38, nscale=4, seed=60.0 + i, stretch=(9, 0.7, 0.7), bias=0.06 + i * 0.05) for i in range(2)]
        self.thy = [paint(f'v_thy{i}', straw, wn=0.6, noise=0.38, nscale=4, seed=62.0 + i, stretch=(0.7, 9, 0.7), bias=0.06 + i * 0.05) for i in range(2)]
        self.oak = image_mat('v_oak', 'village_oak.png', 'wall', 2.4, tint=(0.6, 0.47, 0.37))
        self.oak_top = image_mat('v_oak_top', 'village_oak.png', 'top', 2.4, tint=(0.5, 0.38, 0.28))
        self.tile = [tone('v_tile0', (158, 70, 30), (246, 136, 66), 1.0), tone('v_tile1', (168, 76, 32), (254, 150, 76), 2.0),
                     tone('v_tile2', (144, 62, 30), (232, 124, 60), 3.0)]
        self.plum = [tone('v_plum0', (58, 38, 42), (128, 88, 86), 4.0), tone('v_plum1', (66, 42, 42), (140, 98, 90), 5.0),
                     tone('v_plum2', (50, 34, 40), (116, 80, 82), 6.0)]
        self.must = [tone('v_must0', (168, 112, 28), (248, 196, 74), 7.0), tone('v_must1', (176, 122, 34), (252, 206, 88), 8.0),
                     tone('v_must2', (156, 102, 28), (238, 182, 66), 9.0)]
        self.timber = tone('v_timber', (58, 30, 15), (132, 78, 40), 10.0, stretch=(6, 6, 1), noise=0.14, nscale=8)
        self.ridge = tone('v_ridge', (96, 56, 26), (186, 124, 66), 11.0, noise=0.1)
        self.block = tone('v_block', (146, 116, 80), (240, 216, 172), 12.0, noise=0.12, nscale=16)
        self.plaster = tone('v_plaster', (176, 146, 106), (250, 234, 200), 13.0, wn=0.7, noise=0.12, nscale=7)
        self.ochre = tone('v_ochre', (186, 122, 40), (255, 218, 120), 14.0, wn=0.7, noise=0.12, nscale=7)
        self.iron = tone('v_iron', (34, 32, 34), (96, 92, 90), 15.0, noise=0.05)
        self.dark = tone('v_dark', (20, 14, 12), (50, 36, 28), 16.0, wn=0.4, noise=0.05)
        self.glass = tone('v_glass', (120, 136, 136), (190, 204, 196), 17.0, wn=0.5, noise=0.06)
        self.lit = paint('v_lit', [(0.0, lin(255, 150, 20)), (1.0, lin(255, 206, 70))], wn=0.3, noise=0.2, nscale=8, seed=18.0, bias=0.3)
        self.bstone = tone('v_bstone', (104, 78, 50), (222, 186, 130), 55.0, noise=0.14, nscale=12)
        self.gstone = tone('v_gstone', (104, 90, 72), (216, 198, 164), 54.0, noise=0.12, nscale=14)
        self.brass = tone('v_brass', (84, 56, 28), (176, 132, 72), 52.0, noise=0.06)
        self.ember = tone('v_ember', (230, 96, 20), (255, 186, 70), 19.0, wn=0.3, noise=0.1, bias=0.4)
        self.char = tone('v_char', (18, 15, 15), (72, 62, 58), 20.0, noise=0.12, nscale=20)
        self.charwood = tone('v_charwood', (20, 16, 15), (84, 62, 50), 21.0, noise=0.14, nscale=14, stretch=(5, 5, 1))
        self.soil = tone('v_soil', (92, 58, 32), (160, 112, 66), 22.0, wn=0.3, noise=0.22, nscale=18, bias=0.2)
        self.ash = tone('v_ash', (48, 40, 36), (118, 102, 90), 23.0, wn=0.3, noise=0.28, nscale=22, bias=0.2)
        self.earth = tone('v_earth', (112, 74, 40), (176, 128, 80), 24.0, wn=0.3, noise=0.2, nscale=14, bias=0.25)
        self.pebble = tone('v_pebble', (120, 100, 78), (216, 196, 164), 25.0)
        self.flag = tone('v_flag', (150, 124, 94), (224, 202, 164), 26.0, wn=0.3, noise=0.1, nscale=10, bias=0.4)
        self.grain = paint('v_grain', [(0.0, lin(178, 112, 24)), (0.55, lin(226, 164, 44)), (1.0, lin(250, 210, 96))], wn=0.8, noise=0.05, nscale=30, seed=27.0)
        self.straw = tone('v_straw', (176, 118, 30), (232, 180, 62), 28.0, noise=0.08, nscale=30)
        self.grass = tone('v_grass', (92, 104, 34), (168, 168, 62), 29.0, noise=0.08)
        self.leaf = tone('v_leaf', (84, 98, 28), (176, 178, 66), 30.0, noise=0.08)
        self.grape = tone('v_grape', (56, 36, 72), (150, 110, 160), 31.0, noise=0.05)
        self.vine = tone('v_vine', (62, 38, 24), (128, 84, 54), 32.0, noise=0.12, stretch=(5, 5, 1))
        self.white = paint('v_white', [(0.0, lin(136, 100, 66)), (0.3, lin(204, 174, 136)), (0.5, lin(234, 218, 188)), (1.0, lin(250, 242, 222))],
                           wn=0.62, noise=0.34, nscale=18, seed=33.0, stretch=(1, 1, 0.1), bias=0.1)
        self.rope = tone('v_rope', (150, 112, 62), (226, 192, 130), 34.0, noise=0.1, nscale=30)
        self.linen = tone('v_linen', (186, 156, 112), (250, 234, 200), 35.0, wn=0.7, noise=0.05)
        self.bread = tone('v_bread', (160, 92, 38), (240, 180, 98), 36.0)
        self.apple = tone('v_apple', (150, 66, 30), (232, 130, 60), 37.0, noise=0.1)
        self.wicker = tone('v_wicker', (120, 76, 36), (214, 158, 86), 38.0, noise=0.12, nscale=30)
        self.carrot = tone('v_carrot', (190, 90, 24), (246, 150, 56), 39.0)
        self.cabbage = tone('v_cabbage', (112, 126, 58), (200, 208, 130), 40.0)
        self.potato = tone('v_potato', (150, 112, 62), (226, 192, 130), 41.0)
        self.orange = tone('v_orange', (176, 86, 34), (240, 148, 76), 42.0, wn=0.7, noise=0.05, nscale=9)
        self.mauve = tone('v_mauve', (92, 52, 62), (172, 116, 124), 43.0, wn=0.7, noise=0.05, nscale=9)
        self.cream = tone('v_cream', (196, 170, 126), (252, 240, 210), 44.0, wn=0.7, noise=0.04, nscale=9)
        self.mustard = tone('v_mustard', (190, 124, 30), (250, 190, 70), 45.0, wn=0.7, noise=0.04, nscale=9)
        self.parch = tone('v_parch', (176, 136, 78), (240, 212, 150), 46.0, wn=0.5, noise=0.1, nscale=10)
        self.lichen = paint('v_lichen', [(0.0, lin(74, 56, 40)), (0.5, lin(122, 94, 66)), (0.72, lin(150, 124, 80)), (1.0, lin(190, 170, 70))],
                            wn=0.55, noise=0.3, nscale=16, seed=47.0)
        self.moss = tone('v_moss', (92, 96, 36), (164, 160, 66), 48.0, noise=0.12)
        self.flower = tone('v_flower', (216, 196, 140), (255, 248, 220), 49.0)
        self.sack = tone('v_sack', (170, 142, 104), (240, 222, 186), 50.0)


class Bag:
    """Many small pieces per material in one mesh each, faster and lighter than one object per piece."""

    def __init__(self, prefix):
        self.prefix = prefix
        self.bms = {}

    def bm(self, mat):
        return self.bms.setdefault(mat, bmesh.new())

    def objs(self):
        out = []
        for i, (mat, bm) in enumerate(self.bms.items()):
            bmesh.ops.triangulate(bm, faces=bm.faces)
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            obj = mesh_object(f'{self.prefix}{i}', bm)
            obj.data.materials.append(mat)
            out.append(obj)
        return out


def plate(bm, O, U, V_, N, outline, wf, skirt):
    """Scale-like plate: outline (u, v), the first and last point are the top edge. wf(u, v): height of the front."""
    def p(u, v, w):
        return O + U * u + V_ * v + N * w
    front = [bm.verts.new(p(u, v, wf(u, v))) for u, v in outline]
    back = [bm.verts.new(p(u, v, skirt)) for u, v in outline]
    bm.faces.new(front)
    for i in range(len(outline) - 1):
        bm.faces.new((front[i], front[i + 1], back[i + 1], back[i]))


def scales(bag, O, U, V_, rows, cols, mats, rng, thick=0.03, over=1.4, ch=0.3, roll=0.012, jag=0.0):
    """Rows of overlapping rounded scales on a rectangle O + U + V_ (U along the eave, V_ from eave up)."""
    O, U, V_ = Vector(O), Vector(U), Vector(V_)
    lu, lv = U.length, V_.length
    U, V_ = U / lu, V_ / lv
    N = U.cross(V_).normalized()
    if N.z < 0:
        N = -N
    du, dv = lu / cols, lv / rows
    for r in range(rows):
        vb = r * dv - (dv * 0.08 if r == 0 else 0)
        vt = min(vb + dv * over, lv)
        off = du / 2 if r % 2 else 0.0
        for c in range(-1, cols + 1):
            a = c * du + off + du * 0.02 + rng.uniform(-jag, jag) * du
            b = a + du * 0.96
            a, b = max(a, 0.0), min(b, lu)
            if b - a < du * 0.35:
                continue
            k = min(ch * (b - a), dv * 0.45)
            drop = rng.uniform(0, jag) * dv
            outline = [(a, vt), (a, vb + k), (a + k, vb - drop), (b - k, vb - drop), (b, vb + k), (b, vt)]
            tilt, t = rng.uniform(-roll, roll), thick * rng.uniform(0.85, 1.15)
            mid = (a + b) / 2
            wf = lambda u, v, tl=tilt, tk=t, m=mid, vb0=vb, vt0=vt: tk * (1.0 - 0.75 * (v - vb0) / (vt0 - vb0)) + tl * (u - m) / max(b - a, 0.01)
            plate(bag.bm(rng.choice(mats)), O, U, V_, N, outline, wf, -thick * 0.15)


def roof(parts, name, c, along, across, ze, zr, axis, mats, rows, cols, rng, body, thick=0.03, over=1.4, ch=0.3, jag=0.0, back=None, lip=0.03):
    """Gable roof with real scales. c: centre, along/across: half sizes with overhang, ze/zr: eave and ridge height."""
    cx, cy = c
    h = zr - ze
    bag = Bag(f'{name}s')
    if axis == 'x':
        scales(bag, (cx - along, cy - across, ze), (2 * along, 0, 0), (0, across, h), rows, cols, mats, rng, thick, over, ch, jag=jag)
        r2, c2 = back or (rows, cols)
        scales(bag, (cx + along, cy + across, ze), (-2 * along, 0, 0), (0, -across, h), r2, c2, mats, rng, thick, over, ch, jag=jag)
        rings = [[(x, cy - across, ze - lip), (x, cy + across, ze - lip), (x, cy + across, ze), (x, cy, zr), (x, cy - across, ze)] for x in (cx - along, cx + along)]
    else:
        scales(bag, (cx - across, cy + along, ze), (0, -2 * along, 0), (across, 0, h), rows, cols, mats, rng, thick, over, ch, jag=jag)
        r2, c2 = back or (rows, cols)
        scales(bag, (cx + across, cy - along, ze), (0, 2 * along, 0), (-across, 0, h), r2, c2, mats, rng, thick, over, ch, jag=jag)
        rings = [[(cx - across, y, ze - lip), (cx + across, y, ze - lip), (cx + across, y, ze), (cx, y, zr), (cx - across, y, ze)] for y in (cy - along, cy + along)]
    parts.append(loft(f'{name}b', rings, body))
    parts.extend(bag.objs())


def rod(name, p0, p1, r, mat, seg=6, r1=None):
    """Round bar from p0 to p1, optional taper."""
    a, b = Vector(p0), Vector(p1)
    ax = (b - a).normalized()
    t = ax.orthogonal().normalized()
    u = ax.cross(t)
    r1 = r if r1 is None else r1
    ring = lambda c, rr: [tuple(c + (t * math.cos(2 * math.pi * i / seg) + u * math.sin(2 * math.pi * i / seg)) * rr) for i in range(seg)]
    return loft(name, [ring(a, r), ring(b, r1)], mat)


def block(name, c, s, mat, w=0.012, skip=(), rot=(0, 0, 0)):
    return rounded(box(name, c, s, mat, skip=skip, rot=rot), w, segments=1)


def fbox(name, face, at, u, out, z, su, sd, sz, mat):
    """Box on a wall: u along the wall, `out` how far its centre stands in front of the wall plane `at`."""
    if face == 's':
        return box(name, (u, at - out, z), (su, sd, sz), mat)
    if face == 'n':
        return box(name, (u, at + out, z), (su, sd, sz), mat)
    if face == 'w':
        return box(name, (at - out, u, z), (sd, su, sz), mat)
    return box(name, (at + out, u, z), (sd, su, sz), mat)


def window(parts, M, face, at, u, z, w, h, glass, pre, sill=True, arch=False):
    parts.append(fbox(f'{pre}f', face, at, u, 0.006, z, w + 0.05, 0.02, h + 0.05, M.timber))
    parts.append(fbox(f'{pre}g', face, at, u, 0.016, z, w, 0.012, h, glass))
    parts.append(fbox(f'{pre}v', face, at, u, 0.024, z, 0.016, 0.012, h, M.timber))
    parts.append(fbox(f'{pre}h', face, at, u, 0.024, z, w, 0.012, 0.016, M.timber))
    if arch:
        parts.append(fbox(f'{pre}a', face, at, u, 0.008, z + h / 2 + 0.03, w * 0.64, 0.022, 0.03, M.timber))
    if sill:
        parts.append(fbox(f'{pre}s', face, at, u, 0.022, z - h / 2 - 0.028, w + 0.08, 0.04, 0.024, M.timber))


def arch_outline(u, w, h, n=6):
    r = w / 2
    pts = [(u - r, 0.0), (u + r, 0.0)]
    for i in range(n + 1):
        a = math.pi * i / n
        pts.append((u + r * math.cos(a), h - r + r * math.sin(a)))
    return pts


def arch_door(parts, M, at, u, w, h, pre, stones=True, mat=None, z0=0.0, ring=0.05, panel=True):
    """South wall door: oak leaf with round top, wedge stones and jamb blocks."""
    r = w / 2
    spring = h - r
    if panel:
        parts.append(extrude_y(f'{pre}d', [(x, z + z0) for x, z in arch_outline(u, w, h)], at - 0.012, at + 0.004, M.oak))
        parts.append(box(f'{pre}h', (u + r * 0.5, at - 0.018, z0 + spring * 0.62), (0.024, 0.012, 0.03), M.iron))
    if not stones:
        return
    n = 5
    for i in range(n):
        a0, a1 = math.pi * (i + 0.05) / n, math.pi * (i + 0.95) / n
        q = [(u + r * math.cos(a0), z0 + spring + r * math.sin(a0)), (u + r * math.cos(a1), z0 + spring + r * math.sin(a1)),
             (u + (r + ring) * math.cos(a1), z0 + spring + (r + ring) * math.sin(a1)), (u + (r + ring) * math.cos(a0), z0 + spring + (r + ring) * math.sin(a0))]
        parts.append(rounded(extrude_y(f'{pre}w{i}', q, at - 0.03, at + 0.01, M.block), 0.006, segments=1))
    bh = spring / 2
    for s in (-1, 1):
        for k in range(2):
            parts.append(block(f'{pre}j{s}{k}', (u + s * (r + ring * 0.5), at - 0.01, z0 + bh * (k + 0.5)), (ring + (0.012 if k == 0 else 0), 0.04, bh * 0.94), M.block, 0.006))


def chimney(parts, M, x, y, z0, z1, w, pre, mat=None, cap=None):
    mat = mat or M.stone
    parts.append(block(f'{pre}c', (x, y, (z0 + z1) / 2), (w, w, z1 - z0), mat, 0.008))
    parts.append(block(f'{pre}t', (x, y, z1 + 0.018), (w + 0.03, w + 0.03, 0.05), cap or M.block, 0.008))
    parts.append(box(f'{pre}i', (x, y, z1 + 0.04), (w * 0.5, w * 0.5, 0.012), M.dark))


def quoins(parts, M, x, y, n, sx, sy, sz, pre, rng, z0=0.0, mat=None):
    z = z0
    for k in range(n):
        h = sz * rng.uniform(0.9, 1.1)
        parts.append(block(f'{pre}{k}', (x, y, z + h / 2), (sx * rng.uniform(0.92, 1.08), sy * rng.uniform(0.92, 1.08), h), mat or M.block, 0.008))
        z += h


def foot(parts, M, x0, x1, y, h, n, rng, pre, mat=None, d=0.05, gaps=()):
    """A row of chunky foot stones along x at y."""
    w = (x1 - x0) / n
    for i in range(n):
        cx = x0 + w * (i + 0.5)
        if any(a < cx < b for a, b in gaps):
            continue
        parts.append(block(f'{pre}{i}', (cx, y, h / 2 * rng.uniform(0.9, 1.1)), (w * 0.94, d, h * rng.uniform(0.85, 1.15)), mat or M.block, 0.007))


def octa_bits(bag, mat, pts, rng, r=0.02, squash=0.6):
    bm = bag.bm(mat)
    for x, y, z in pts:
        rr = r * rng.uniform(0.7, 1.3)
        ps = [(rr, 0, 0), (-rr, 0, 0), (0, rr, 0), (0, -rr, 0), (0, 0, rr * squash), (0, 0, -rr * squash * 0.3)]
        v = [bm.verts.new((x + a * rng.uniform(0.8, 1.2), y + b * rng.uniform(0.8, 1.2), z + c)) for a, b, c in ps]
        for a, b in ((0, 2), (2, 1), (1, 3), (3, 0)):
            bm.faces.new((v[a], v[b], v[4]))
            bm.faces.new((v[b], v[a], v[5]))


def sphere(name, c, r, mat, rng=None, squash=(1, 1, 1), sub=1, jitter=0.08):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    for v in bm.verts:
        d = 1 + (rng.uniform(-jitter, jitter) if rng else 0)
        v.co = Vector((v.co.x * d * squash[0], v.co.y * d * squash[1], v.co.z * d * squash[2])) + Vector(c)
    obj = mesh_object(name, bm)
    obj.data.materials.append(mat)
    return obj


def patch(name, mat, hx, hy, rng, n=16, z=0.012, c=(0, 0), cut=0.8):
    """Irregular flat ground patch: a rounded rectangle with a wandering edge."""
    rt, rb = [], []
    for i in range(n):
        a = 2 * math.pi * i / n
        ca, sa = math.cos(a), math.sin(a)
        # superellipse
        k = (abs(ca) ** 4 + abs(sa) ** 4) ** -0.25
        d = rng.uniform(cut, 1.0)
        x, y = c[0] + ca * k * hx * d, c[1] + sa * k * hy * d
        rb.append((x, y, -0.01))
        rt.append((c[0] + (x - c[0]) * 0.97, c[1] + (y - c[1]) * 0.97, z))
    return loft(name, [rb, rt], mat)


def tufts(parts, M, pts, rng, pre, mat=None, h=0.05):
    """Little grass tufts: three thin blades each."""
    bag = Bag(pre)
    bm = bag.bm(mat or M.grass)
    for x, y in pts:
        for k in range(3):
            a = rng.uniform(0, 6.28)
            tip = (x + math.cos(a) * 0.022, y + math.sin(a) * 0.022, h * rng.uniform(0.8, 1.2))
            base = [(x + math.cos(a + i * 2.1) * 0.012, y + math.sin(a + i * 2.1) * 0.012, 0.0) for i in range(3)]
            v = [bm.verts.new(p) for p in base]
            t = bm.verts.new(tip)
            for i in range(3):
                bm.faces.new((v[i], v[(i + 1) % 3], t))
    parts.extend(bag.objs())


def xform(obj, rz=0.0, t=(0, 0, 0), s=1.0):
    ca, sa = math.cos(rz), math.sin(rz)
    for v in obj.data.vertices:
        x, y, z = v.co * s
        v.co = (ca * x - sa * y + t[0], sa * x + ca * y + t[1], z + t[2])
    return obj


# ---------------------------------------------------------------- fields

def kernel(bm, c, ax, r, ln):
    """Plump grain: five-sided spindle, shaded soft (see `done`), so it reads as round and not as a cut gem."""
    c, ax = Vector(c), Vector(ax).normalized()
    t = ax.orthogonal().normalized()
    u = ax.cross(t)
    ring = [bm.verts.new(c + (t * math.cos(i * 1.2566) + u * math.sin(i * 1.2566)) * r) for i in range(5)]
    a, b = bm.verts.new(c + ax * ln), bm.verts.new(c - ax * ln)
    for i in range(5):
        j = (i + 1) % 5
        bm.faces.new((ring[i], ring[j], a))
        bm.faces.new((ring[j], ring[i], b))


def ear(bm, x, y, z0, h, lean, pairs, r):
    """Wheat ear: pairs of plump kernels up the stem, one on top."""
    d = Vector((lean[0], lean[1], 1.0)).normalized()
    side = Vector((1, 0, 0))
    for i in range(pairs):
        t = (i + 0.3) / (pairs + 0.5)
        cc = Vector((x, y, z0)) + d * h * t
        rr = r * (1.0 - 0.18 * t)
        for s in (-1, 1):
            kernel(bm, cc + side * s * rr * 1.05 + Vector((0, 0, rr * 0.2)), d + side * s * 0.5, rr, rr * 1.6)
    kernel(bm, Vector((x, y, z0)) + d * h * 0.96, d, r * 0.85, r * 1.8)


def wheat(bag, M, x, y, h, rng, r=0.024, pairs=2, spread=0.05, z=0.0, stem=0.014):
    bm = bag.bm(M.grain)
    ear(bm, x, y, z + h * 0.34, h * 0.68, (rng.uniform(-0.06, 0.06), rng.uniform(-0.1, 0.05)), pairs, r)
    for s in (-1, 1):
        ear(bm, x + s * spread, y + rng.uniform(-0.02, 0.02), z + h * 0.2, h * 0.5, (s * 0.22, rng.uniform(-0.1, 0.1)), 1, r * 0.95)
    st = bag.bm(M.straw)
    for s in (-1, 0, 1):
        base = [(x + s * 0.016 + math.cos(i * 2.094) * stem, y + math.sin(i * 2.094) * stem, z) for i in range(3)]
        v = [st.verts.new(p) for p in base]
        tip = st.verts.new((x + s * spread * 1.5, y, z + (h * 0.42 if s else h * 0.62)))
        for i in range(3):
            st.faces.new((v[i], v[(i + 1) % 3], tip))


ROWS = (-0.36, -0.18, 0.18, 0.36)
BIG_ROWS = (-0.28, 0.28)


def field_open():
    reset()
    M = V()
    rng = random.Random(201)
    parts = [patch('soil', M.soil, 0.49, 0.49, rng, n=18, cut=0.88)]
    bag = Bag('w')
    for x in BIG_ROWS:
        for k in range(5):
            y = -0.4 + k * 0.2 + rng.uniform(-0.012, 0.012)
            wheat(bag, M, x + rng.uniform(-0.012, 0.012), y, rng.uniform(0.46, 0.52), rng, r=0.044, pairs=4, spread=0.085)
    octa_bits(bag, M.pebble, [(rng.uniform(-0.08, 0.08), rng.uniform(-0.4, 0.4), 0.014) for _ in range(5)], rng, 0.016)
    parts.extend(bag.objs())
    done(join(parts, 'field_open'), 'field_open', size=512)


def field_burnt():
    reset()
    M = V()
    rng = random.Random(202)
    parts = [patch('soil', M.ash, 0.49, 0.49, rng, n=18, cut=0.88)]
    bag = Bag('w')
    bm = bag.bm(M.char)
    for x in BIG_ROWS:
        for k in range(4):
            y = -0.36 + k * 0.24 + rng.uniform(-0.015, 0.015)
            for i in range(5):
                bx, by = x + (i - 2) * 0.034 + rng.uniform(-0.008, 0.008), y + rng.uniform(-0.02, 0.02)
                h = rng.uniform(0.14, 0.26)
                r0, r1 = rng.uniform(0.022, 0.03), rng.uniform(0.008, 0.015)
                tx, ty = bx + (i - 1) * 0.015 + rng.uniform(-0.01, 0.01), by + rng.uniform(-0.01, 0.01)
                b = [bm.verts.new((bx + dx * r0, by + dy * r0, 0.0)) for dx, dy in ((1, 1), (-1, 1), (-1, -1), (1, -1))]
                t = [bm.verts.new((tx + dx * r1, ty + dy * r1, h)) for dx, dy in ((1, 1), (-1, 1), (-1, -1), (1, -1))]
                for j in range(4):
                    bm.faces.new((b[j], b[(j + 1) % 4], t[(j + 1) % 4], t[j]))
                bm.faces.new(t)
    octa_bits(bag, M.pebble, [(rng.uniform(-0.46, 0.46), rng.uniform(-0.44, 0.44), 0.014) for _ in range(6)], rng, 0.016)
    octa_bits(bag, M.char, [(rng.uniform(-0.44, 0.44), rng.uniform(-0.44, 0.44), 0.014) for _ in range(14)], rng, 0.024)
    parts.extend(bag.objs())
    # embers: flat glowing spots with a darker rim, between the stubble
    for i, (x, y) in enumerate(((-0.27, -0.24), (0.05, 0.08), (0.27, -0.03), (-0.06, -0.3), (0.28, 0.25), (-0.28, 0.0), (0.08, -0.15), (-0.02, 0.33))):
        r = rng.uniform(0.03, 0.045)
        parts.append(loft(f'em{i}', [circle((x, y), r, 0.006, 6), circle((x, y), r * 0.7, 0.02, 6)], M.ember))
    done(join(parts, 'field_burnt'), 'field_burnt', size=512)


# ---------------------------------------------------------------- land

def hay_a():
    reset()
    M = V()
    rng = random.Random(203)
    hay = paint('v_hay', [(0.0, lin(170, 108, 28)), (0.4, lin(222, 158, 48)), (0.75, lin(246, 194, 78)), (1.0, lin(255, 226, 132))], wn=0.45, noise=0.62, nscale=5, seed=51.0, stretch=(26, 26, 0.5), bias=0.1)
    hay2 = paint('v_hay2', [(0.0, lin(118, 70, 18)), (0.45, lin(178, 118, 32)), (1.0, lin(222, 166, 66))], wn=0.45, noise=0.5, nscale=5, seed=53.0, stretch=(26, 26, 0.5), bias=0.08)
    prof = [(0.46, 0.13), (0.47, 0.32), (0.38, 0.54), (0.24, 0.72), (0.1, 0.87)]
    rings = [circle((0, 0), r * 0.92, z, 12) for r, z in prof]
    rings.append(circle((0, 0), 0.05, 0.9, 12))
    parts = [loft('body', rings, hay2, cap=True)]
    bag = Bag('t')
    # each course is a skirt with a fine torn fringe; shadow falls on the course below
    for lvl, teeth in enumerate((42, 38, 30, 20)):
        (r0, z0), (r1, z1) = prof[lvl], prof[lvl + 1]
        bm = bag.bm(hay)
        n = teeth * 2
        off = rng.uniform(0, 1)
        top_ring = [bm.verts.new((math.cos(2 * math.pi * (i + off) / teeth) * r1 * 0.98, math.sin(2 * math.pi * (i + off) / teeth) * r1 * 0.98, z1 + 0.03)) for i in range(teeth)]
        hem = []
        for i in range(n):
            a = 2 * math.pi * (i / 2 + off) / teeth
            long = i % 2 == 0
            drop = rng.uniform(0.07, 0.14) if long else rng.uniform(0.0, 0.035)
            rr = r0 * (1.1 if long else 1.05)
            hem.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, z0 - drop)))
        for i in range(teeth):
            j = (i + 1) % teeth
            h0, h1, h2 = hem[2 * i], hem[2 * i + 1], hem[(2 * i + 2) % n]
            bm.faces.new((top_ring[i], h0, h1))
            bm.faces.new((top_ring[i], h1, top_ring[j]))
            bm.faces.new((top_ring[j], h1, h2))
    parts.extend(bag.objs())
    # top knot: bound bundle spreading upwards, rope ring
    parts.append(rod('rope', (0, 0, 0.87), (0, 0, 0.92), 0.075, M.rope, seg=8))
    bm_t = Bag('k')
    bm = bm_t.bm(M.thatch)
    for i in range(7):
        a = 2 * math.pi * i / 7
        ca, sa = math.cos(a), math.sin(a)
        p0 = Vector((ca * 0.03, sa * 0.03, 0.88))
        p1 = Vector((ca * 0.11, sa * 0.11, 1.05 + rng.uniform(-0.02, 0.03)))
        t = Vector((-sa, ca, 0)) * 0.024
        v = [bm.verts.new(p) for p in (p0 - t, p0 + t, p1 + t * 1.3, p1 - t * 1.3, p0 - t * 0.7 - Vector((ca, sa, 0)) * 0.02, p0 + t * 0.7 - Vector((ca, sa, 0)) * 0.02, p1 + t - Vector((ca, sa, 0)) * 0.03, p1 - t - Vector((ca, sa, 0)) * 0.03)]
        for f in ((0, 1, 2, 3), (5, 4, 7, 6), (1, 5, 6, 2), (4, 0, 3, 7), (3, 2, 6, 7)):
            bm.faces.new([v[i2] for i2 in f])
    parts.extend(bm_t.objs())
    # props: two leaning sticks on the south, one on the north
    parts.append(rod('st0', (-0.3, -0.48, 0.0), (-0.2, -0.3, 0.2), 0.03, M.timber))
    parts.append(rod('st1', (0.3, -0.48, 0.0), (0.2, -0.3, 0.2), 0.03, M.timber))
    parts.append(rod('st2', (-0.46, 0.05, 0.0), (-0.3, 0.05, 0.2), 0.03, M.timber))
    done(join(parts, 'hay_a'), 'hay_a', size=512)


def vine_row(parts, bag, M, y, rng, pre):
    for s in (-1, 1):
        parts.append(rod(f'{pre}p{s}', (s * 0.38, y, 0.0), (s * 0.38, y, 0.5), 0.042, M.timber, seg=7))
        parts.append(loft(f'{pre}c{s}', [circle((s * 0.38, y), 0.042, 0.5, 7), circle((s * 0.38, y), 0.022, 0.512, 7)], M.oak_top))
        parts.append(rod(f'{pre}b{s}', (s * 0.38, y, 0.345), (s * 0.38, y, 0.385), 0.05, M.iron, seg=7))
    parts.append(rod(f'{pre}w0', (-0.38, y - 0.03, 0.365), (0.38, y - 0.03, 0.365), 0.013, M.iron, seg=4))
    for k, sx in enumerate((-0.19, 0.17)):
        pts = [(sx, y, 0.0), (sx + 0.03, y, 0.1), (sx + 0.018, y + 0.01, 0.2), (sx - 0.012, y, 0.29), (sx + 0.005, y - 0.01, 0.37)]
        for i in range(4):
            parts.append(rod(f'{pre}s{k}{i}', pts[i], pts[i + 1], 0.04 - i * 0.005, M.vine, seg=5, r1=0.035 - i * 0.005))
        for s in (-1, 1):
            parts.append(rod(f'{pre}a{k}{s}', pts[4], (sx + s * 0.12, y - 0.015, 0.39), 0.016, M.vine, seg=4))
        # grape bunch below the wire
        gx, gy = sx + (0.09 if k == 0 else -0.09), y - 0.06
        for lvl, (cnt, rad, gz) in enumerate(((3, 0.034, 0.3), (3, 0.03, 0.26), (2, 0.016, 0.225), (1, 0.0, 0.19))):
            for i in range(cnt):
                a = 2.09 * i + lvl
                octa_bits(bag, M.grape, [(gx + math.cos(a) * rad, gy + math.sin(a) * rad * 0.6, gz)], rng, 0.031, squash=1.0)
    # leaves: five-pointed flat plates along the wire
    bm = bag.bm(M.leaf)
    for i in range(5):
        x = -0.29 + i * 0.145 + rng.uniform(-0.02, 0.02)
        z = 0.43 + (0.05 if i % 2 else 0) + rng.uniform(-0.01, 0.01)
        cc = Vector((x, y - 0.02, z))
        r = rng.uniform(0.09, 0.108)
        tilt = rng.uniform(0.4, 0.75)
        rot = rng.uniform(0, 6.28)
        rim = []
        for j in range(10):
            a = rot + j * math.pi / 5
            rr = r if j % 2 == 0 else r * 0.6
            rim.append(cc + Vector((math.cos(a) * rr, math.sin(a) * rr * math.cos(tilt), math.sin(a) * rr * math.sin(tilt))))
        top = [bm.verts.new(p + Vector((0, 0, 0.006))) for p in rim]
        bm.faces.new(top)


def vine_a():
    reset()
    M = V()
    rng = random.Random(204)
    parts = [patch('soil', M.earth, 0.47, 0.47, rng, n=16, cut=0.88)]
    bag = Bag('v')
    vine_row(parts, bag, M, 0.29, rng, 'n')
    vine_row(parts, bag, M, -0.27, rng, 's')
    octa_bits(bag, M.pebble, [(rng.uniform(-0.3, 0.3), rng.uniform(-0.12, 0.12), 0.014) for _ in range(3)], rng, 0.016)
    parts.extend(bag.objs())
    done(join(parts, 'vine_a'), 'vine_a', size=512)


def fence_wicker_a():
    reset()
    M = V()
    rng = random.Random(205)
    parts = []
    for s in (-1, 1):
        parts.append(rod(f'post{s}', (s * 0.44, 0, 0.0), (s * 0.44, 0, 0.48), 0.052, M.timber, seg=8))
        parts.append(loft(f'cap{s}', [circle((s * 0.44, 0), 0.052, 0.48, 8), circle((s * 0.44, 0), 0.03, 0.5, 8)], M.oak_top))
        parts.append(rod(f'band{s}', (s * 0.44, 0, 0.3), (s * 0.44, 0, 0.335), 0.062, M.rope, seg=8))
        parts.append(rod(f'bandl{s}', (s * 0.44, 0, 0.09), (s * 0.44, 0, 0.125), 0.062, M.rope, seg=8))
    stakes = [-0.26, -0.09, 0.09, 0.26]
    for i, x in enumerate(stakes):
        parts.append(rod(f'st{i}', (x, 0, 0.0), (x, 0, 0.42 + (i % 2) * 0.02), 0.022, M.timber, seg=6))
    # woven rods: every course weaves in and out around the stakes
    xs = [-0.46, *stakes, 0.46]
    bag = Bag('rods')
    bm = bag.bm(M.wicker)
    for c in range(7):
        z = 0.075 + c * 0.052
        sign = 1 if c % 2 else -1
        pts = []
        for i in range(len(xs) - 1):
            pts.append((xs[i], sign * (1 if i % 2 else -1) * 0.02))
        pts.append((xs[-1], sign * 0.02))
        rad = 0.036
        ring = [(math.cos(i * 1.2566) * rad * 0.8, math.sin(i * 1.2566) * rad) for i in range(5)]
        sect = [[bm.verts.new((x, y + a, z + b)) for a, b in ring] for x, y in pts]
        for va, vb in zip(sect, sect[1:]):
            for j in range(5):
                bm.faces.new((va[j], va[(j + 1) % 5], vb[(j + 1) % 5], vb[j]))
    parts.extend(bag.objs())
    tufts(parts, M, [(-0.4, -0.09), (-0.36, -0.08), (0.4, -0.09), (0.36, -0.08)], rng, 'tf', h=0.07)
    done(join(parts, 'fence_wicker_a'), 'fence_wicker_a', size=256)


def white_post(parts, M, x, y, pre, rng, h=0.56):
    parts.append(rounded(box(f'{pre}p', (x, y, h / 2), (0.115, 0.115, h), M.white), 0.022, segments=2))
    parts.append(loft(f'{pre}t', [[(x - 0.04, y - 0.04, h - 0.002), (x + 0.04, y - 0.04, h - 0.002), (x + 0.04, y + 0.04, h - 0.002), (x - 0.04, y + 0.04, h - 0.002)],
                                   [(x - 0.024, y - 0.024, h + 0.018), (x + 0.024, y - 0.024, h + 0.018), (x + 0.024, y + 0.024, h + 0.018), (x - 0.024, y + 0.024, h + 0.018)]], M.white))
    for z in (0.17, 0.4):
        parts.append(box(f'{pre}n{z}', (x, y - 0.06, z), (0.02, 0.012, 0.02), M.iron))
    tufts(parts, M, [(x + 0.06, y - 0.06), (x - 0.06, y - 0.06), (x, y - 0.075)], rng, f'{pre}g', h=0.075)


def white_rail(parts, M, p0, p1, z, pre):
    x0, y0 = p0
    x1, y1 = p1
    c = ((x0 + x1) / 2, (y0 + y1) / 2, z)
    ln = math.hypot(x1 - x0, y1 - y0)
    if abs(y1 - y0) < abs(x1 - x0):
        parts.append(block(pre, c, (ln, 0.06, 0.095), M.white, 0.014))
    else:
        parts.append(block(pre, c, (0.06, ln, 0.095), M.white, 0.014))


def paddock_straight():
    reset()
    M = V()
    rng = random.Random(206)
    parts = []
    for s in (-1, 1):
        white_post(parts, M, s * 0.34, 0, f'p{s}', rng)
    for z in (0.17, 0.4):
        white_rail(parts, M, (-0.5, -0.01), (0.5, -0.01), z, f'r{z}')
    done(join(parts, 'paddock_straight'), 'paddock_straight', size=256)


def paddock_corner():
    """Rails to the west and the north, tall post at the corner."""
    reset()
    M = V()
    rng = random.Random(207)
    parts = []
    white_post(parts, M, 0, 0, 'c', rng, h=0.62)
    white_post(parts, M, -0.36, 0, 'w', rng)
    white_post(parts, M, 0, 0.36, 'n', rng)
    for z in (0.17, 0.4):
        white_rail(parts, M, (-0.5, 0), (0.03, 0), z, f'a{z}')
        white_rail(parts, M, (0, 0.5), (0, -0.03), z, f'b{z}')
    done(join(parts, 'paddock_corner'), 'paddock_corner', size=256)


def paddock_gate():
    """Two posts with rail stubs, plank gate hanging closed between them, in line with the fence."""
    reset()
    M = V()
    rng = random.Random(208)
    parts = []
    white_post(parts, M, -0.32, 0, 'w', rng)
    white_post(parts, M, 0.32, 0, 'e', rng)
    for z in (0.17, 0.4):
        white_rail(parts, M, (-0.5, -0.01), (-0.3, -0.01), z, f'l{z}')
        white_rail(parts, M, (0.3, -0.01), (0.5, -0.01), z, f'r{z}')
    # gate leaf built along +x from the hinge, then rotated
    w = 0.5
    leaf = []
    for i in range(4):
        leaf.append(block(f'g{i}', (0.06 + w * (i + 0.5) / 4.3, 0, 0.27), (w / 4.5, 0.03, 0.38), M.white, 0.006))
    for k, z in enumerate((0.1, 0.44)):
        leaf.append(block(f'gr{k}', (0.05 + w / 2, -0.024, z), (w, 0.022, 0.062), M.white, 0.006))
    leaf.append(block('gstile', (0.08, -0.024, 0.27), (0.075, 0.026, 0.42), M.white, 0.006))
    leaf.append(block('gfree', (w + 0.03, -0.024, 0.27), (0.075, 0.026, 0.42), M.white, 0.006))
    ang = math.atan2(0.28, w - 0.1)
    leaf.append(block('gd', (0.05 + w / 2, -0.03, 0.27), (0.46, 0.02, 0.05), M.white, 0.005, rot=(0, -ang, 0)))
    for k, z in enumerate((0.13, 0.41)):
        leaf.append(box(f'h{k}', (0.05, -0.04, z), (0.15, 0.014, 0.05), M.iron))
    leaf.append(rod('rg', (w - 0.03, -0.05, 0.24), (w - 0.03, -0.05, 0.3), 0.034, M.iron, seg=6))
    obj = join(leaf, 'gleaf')
    xform(obj, 0.0, (-0.3, -0.005, 0))
    parts.append(obj)
    done(join(parts, 'paddock_gate'), 'paddock_gate', size=256)


def sign_a():
    reset()
    M = V()
    rng = random.Random(209)
    parts = []
    for s in (-1, 1):
        parts.append(block(f'post{s}', (s * 0.32, 0.03, 0.46), (0.095, 0.095, 0.92), M.timber, 0.012))
    parts.append(block('board', (0, 0.03, 0.58), (0.6, 0.05, 0.46), M.oak, 0.006))
    parts.append(block('sill', (0, 0.0, 0.33), (0.74, 0.06, 0.055), M.timber, 0.008))
    parts.append(block('lintel', (0, 0.0, 0.82), (0.74, 0.06, 0.055), M.timber, 0.008))
    parts.append(box('bolt0', (-0.3, -0.035, 0.33), (0.022, 0.012, 0.022), M.iron))
    parts.append(box('bolt1', (0.3, -0.035, 0.33), (0.022, 0.012, 0.022), M.iron))
    # three blank sheets with pins
    for i, (x, z, w, h, rz) in enumerate(((-0.11, 0.59, 0.26, 0.3, 0.03), (0.18, 0.66, 0.17, 0.18, -0.05), (0.1, 0.47, 0.16, 0.18, 0.06))):
        parts.append(box(f'sh{i}', (x, -0.002 - i * 0.002, z), (w, 0.006, h), M.parch, rot=(0, rz, 0)))
        parts.append(box(f'pin{i}', (x, -0.01 - i * 0.002, z + h / 2 - 0.02), (0.022, 0.006, 0.022), M.iron))
    # wooden shingle roof, shallow towards the south
    roof(parts, 'r', (0, 0.04), 0.47, 0.16, 0.93, 1.1, 'x', [M.lichen], 3, 6, rng, M.timber, thick=0.03, over=1.45, ch=0.14, back=(2, 4), lip=0.03)
    parts.append(block('ridge', (0, 0.04, 1.11), (0.88, 0.055, 0.04), M.timber, 0.006))
    for s in (-1, 1):
        parts.append(block(f'rc{s}', (s * 0.43, 0.04, 1.12), (0.09, 0.09, 0.07), M.oak_top, 0.01))
    tufts(parts, M, [(-0.36, -0.05), (0.36, -0.05), (-0.28, -0.05), (0.28, -0.05)], rng, 'tf', h=0.07)
    done(join(parts, 'sign_a'), 'sign_a', size=512)


def lantern_post_a():
    reset()
    M = V()
    rng = random.Random(210)
    parts = []
    # stone foot: drum of big stones, moss on top
    parts.append(loft('drum', [circle((0, 0), 0.15, 0.0, 8), circle((0, 0), 0.14, 0.12, 8), circle((0, 0), 0.1, 0.23, 8)], M.gstone))
    for ring, (rad, z, n, r) in enumerate(((0.135, 0.055, 6, 0.08), (0.09, 0.165, 5, 0.066))):
        for i in range(n):
            a = i * 2 * math.pi / n + ring * 0.4
            parts.append(sphere(f'st{ring}{i}', (math.cos(a) * rad, math.sin(a) * rad, z), r, M.gstone, rng, (1, 1, 0.8)))
    parts.append(loft('moss', [circle((0, 0), 0.11, 0.215, 7), circle((0, 0), 0.075, 0.245, 7)], M.moss))
    parts.append(block('post', (0, 0, 0.66), (0.13, 0.13, 0.8), M.timber, 0.014))
    parts.append(block('cap', (0, 0, 1.08), (0.15, 0.15, 0.06), M.oak_top, 0.014))
    parts.append(block('collar', (0, 0, 0.66), (0.145, 0.145, 0.05), M.iron, 0.005))
    parts.append(block('bolt', (0.0, -0.075, 0.66), (0.035, 0.012, 0.035), M.iron, 0.004))
    # iron arm with a curled end
    pts = [(0.06, 0, 1.0), (0.24, 0, 1.0), (0.32, 0, 0.98), (0.36, 0, 0.93), (0.34, 0, 0.89), (0.3, 0, 0.9)]
    for i in range(len(pts) - 1):
        parts.append(rod(f'arm{i}', pts[i], pts[i + 1], 0.017, M.iron, seg=5))
    parts.append(rod('brace', (0.06, 0, 0.8), (0.2, 0, 0.99), 0.015, M.iron, seg=4))
    # hanging lantern, six-sided, brass frame, glowing body
    lx, lz = 0.34, 0.68
    parts.append(rod('hang', (lx, 0, lz + 0.17), (lx, 0, 0.89), 0.01, M.iron, seg=4))
    parts.append(loft('lhat', [circle((lx, 0), 0.105, lz + 0.1, 6), circle((lx, 0), 0.03, lz + 0.17, 6)], M.brass))
    parts.append(loft('lbody', [circle((lx, 0), 0.07, lz - 0.1, 6), circle((lx, 0), 0.098, lz + 0.1, 6)], M.lit))
    parts.append(loft('lbase', [circle((lx, 0), 0.05, lz - 0.13, 6), circle((lx, 0), 0.085, lz - 0.1, 6)], M.brass))
    for i in range(6):
        a = i * math.pi / 3
        parts.append(rod(f'lb{i}', (lx + math.cos(a) * 0.074, math.sin(a) * 0.074, lz - 0.1), (lx + math.cos(a) * 0.102, math.sin(a) * 0.102, lz + 0.1), 0.008, M.brass, seg=3))
    tufts(parts, M, [(-0.2, -0.17), (0.2, -0.17)], rng, 'tf', h=0.07)
    done(join(parts, 'lantern_post_a'), 'lantern_post_a', size=512)


# ---------------------------------------------------------------- water mill

def water_wheel(M, r, w):
    """Axis along x, built around the origin."""
    parts = []
    seg = 10
    rim_d = 0.05
    for s in (-1, 1):
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5) / seg
            ln = 2 * math.pi * r / seg * 1.06
            parts.append(box(f'rim{s}{i}', (s * w / 2, math.cos(a) * r, math.sin(a) * r), (0.035, ln, rim_d), M.timber, rot=(a + math.pi / 2, 0, 0)))
        for i in range(3):
            a = math.pi * i / 3 + 0.26
            parts.append(box(f'sp{s}{i}', (s * w / 2, 0, 0), (0.03, 2 * r, 0.038), M.timber, rot=(a, 0, 0)))
    for i in range(seg):
        a = 2 * math.pi * i / seg
        parts.append(box(f'pad{i}', (0, math.cos(a) * (r + 0.015), math.sin(a) * (r + 0.015)), (w + 0.02, 0.09, 0.028), M.oak, rot=(a, 0, 0)))
    parts.append(rod('hub', (-w / 2 - 0.1, 0, 0), (w / 2 + 0.06, 0, 0), 0.05, M.ridge, seg=8))
    return join(parts, 'wheel')


def mill_idle():
    reset()
    M = V()
    rng = random.Random(211)
    parts = []
    x0, x1, ys, yn = -0.5, 0.12, -0.34, 0.42
    h = 0.5
    parts.append(block('wall', ((x0 + x1) / 2, (ys + yn) / 2, h / 2), (x1 - x0, yn - ys, h), M.stone, 0.01, skip=('-z',)))
    # gable fill and thick thatch
    zr = 1.08
    roof(parts, 'r', ((x0 + x1) / 2 - 0.0, (ys + yn) / 2), (x1 - x0) / 2 + 0.07, (yn - ys) / 2 + 0.06, h - 0.02, zr, 'x', M.thx, 6, 10, rng,
         M.plaster, thick=0.05, over=1.5, ch=0.42, jag=0.18, back=(2, 3), lip=0.05)
    parts.append(rod('ridge', (x0 - 0.1, (ys + yn) / 2, zr + 0.015), (x1 + 0.1, (ys + yn) / 2, zr + 0.015), 0.052, M.thx[0], seg=6))
    for i, x in enumerate((-0.42, -0.2, 0.02)):
        parts.append(rod(f'tie{i}', (x - 0.012, (ys + yn) / 2, zr + 0.015), (x + 0.012, (ys + yn) / 2, zr + 0.015), 0.05, M.ridge, seg=6))
    for s, x in enumerate((x0 - 0.1, x1 + 0.1)):
        parts.append(rod(f'end{s}', (x - 0.012, (ys + yn) / 2, zr + 0.015), (x + 0.012, (ys + yn) / 2, zr + 0.015), 0.055, M.ridge, seg=6))
    # east gable wall under the thatch: plaster triangle with a beam
    y_c = (ys + yn) / 2
    parts.append(loft('gab', [[(x, ys, h), (x, yn, h), (x, y_c, zr - 0.05)] for x in (x0 + 0.005, x1 - 0.005)], M.plaster))
    parts.append(box('jamb', (x1 + 0.006, y_c, h + 0.01), (0.03, yn - ys, 0.04), M.timber))
    # door with big stone arch, step, window with sill
    arch_door(parts, M, ys, -0.09, 0.2, 0.42, 'd', ring=0.06)
    parts.append(block('step0', (-0.09, ys - 0.06, 0.018), (0.34, 0.1, 0.036), M.block, 0.006))
    parts.append(block('step1', (-0.09, ys - 0.125, 0.012), (0.28, 0.06, 0.024), M.block, 0.005))
    window(parts, M, 's', ys, -0.35, 0.28, 0.14, 0.16, M.glass, 'w0')
    # corner stones
    quoins(parts, M, x0 + 0.01, ys + 0.01, 3, 0.1, 0.1, 0.1, 'q0', rng)
    quoins(parts, M, x1 - 0.01, ys + 0.01, 3, 0.1, 0.1, 0.1, 'q1', rng)
    foot(parts, M, x0 + 0.08, -0.23, ys - 0.012, 0.09, 1, rng, 'f0')
    foot(parts, M, 0.06, x1 - 0.05, ys - 0.012, 0.07, 1, rng, 'f1')
    chimney(parts, M, -0.34, 0.1, 0.65, 1.2, 0.17, 'ch', mat=M.gstone, cap=M.gstone)
    # wheel, face turned to the south-east so the game camera sees it as a wheel
    rz = math.radians(-34)
    n = Vector((math.cos(rz), math.sin(rz), 0))
    wc = Vector((0.31, -0.1, 0.33))
    wheel = xform(water_wheel(M, 0.3, 0.13), rz, wc)
    parts.append(wheel)
    # stone pier on the far side of the wheel and a low base against the house
    pier = wc + n * 0.14 + Vector((0, 0, -0.2))
    parts.append(block('pier', tuple(pier), (0.13, 0.13, 0.26), M.gstone, 0.008, rot=(0, 0, rz)))
    parts.append(block('piert', tuple(pier + Vector((0, 0, 0.14))), (0.16, 0.16, 0.04), M.block, 0.008, rot=(0, 0, rz)))
    parts.append(block('base', (0.17, -0.2, 0.045), (0.14, 0.2, 0.09), M.block, 0.008))
    # flume on a trestle, runs in the wheel's plane, from the top of the wheel to the north-east
    d = Vector((-n.y, n.x, 0))
    zf = wc.z + 0.3 + 0.07
    start = wc + d * 0.02
    a, b = (start.x, start.y), (start.x + d.x * 0.62, start.y + d.y * 0.62)
    mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    ln = 0.64
    flume = [box('fb', (0, 0, -0.03), (ln, 0.13, 0.03), M.timber),
             box('fa', (0, -0.058, 0.012), (ln, 0.024, 0.07), M.timber), box('fc', (0, 0.058, 0.012), (ln, 0.024, 0.07), M.timber),
             box('fw', (0, 0, -0.008), (ln - 0.01, 0.09, 0.012), M.iron)]
    for i in (-0.22, 0.08, 0.26):
        flume.append(box(f'fh{i}', (i, 0, 0.012), (0.03, 0.15, 0.09), M.oak))
    fo = xform(join(flume, 'flume'), math.atan2(d.y, d.x), (mid[0], mid[1], zf))
    parts.append(fo)
    for i, t in enumerate((0.42, 0.62)):
        px, py = start.x + d.x * t, start.y + d.y * t
        parts.append(block(f'tp{i}', (px, py, (zf - 0.04) / 2), (0.07, 0.07, zf - 0.04), M.timber, 0.008, rot=(0, 0, rz)))
    parts.append(block('tpf', (start.x + d.x * 0.62, start.y + d.y * 0.62, 0.03), (0.12, 0.12, 0.06), M.block, 0.008, rot=(0, 0, rz)))
    px, py = start.x + d.x * 0.62, start.y + d.y * 0.62
    parts.append(rod('br', (px - d.x * 0.15, py - d.y * 0.15, zf - 0.04), (px, py, zf - 0.2), 0.02, M.timber, seg=4))
    done(join(parts, 'mill_idle'), 'mill_idle', size=512)


# ---------------------------------------------------------------- barn

def barn_a():
    reset()
    M = V()
    rng = random.Random(212)
    parts = []
    hw, ys, yn = 0.42, -0.4, 0.42
    h = 0.52
    zr = 1.2
    parts.append(box('body', (0, (ys + yn) / 2, h / 2), (2 * hw, yn - ys, h), M.oak, skip=('-z',)))
    # south gable of planks (pentagon)
    parts.append(extrude_y('gab', [(-hw, 0.0), (hw, 0.0), (hw, h), (0, zr - 0.04), (-hw, h)], ys - 0.004, ys + 0.05, M.oak))
    parts.append(extrude_y('gabn', [(-hw, h), (hw, h), (0, zr - 0.04)], yn - 0.05, yn, M.oak))
    # corner posts and a tie beam
    for s in (-1, 1):
        parts.append(block(f'cp{s}', (s * (hw - 0.012), ys - 0.012, h / 2), (0.075, 0.05, h), M.timber, 0.008))
    parts.append(block('tie', (0, ys - 0.016, h + 0.012), (2 * hw + 0.05, 0.05, 0.05), M.timber, 0.008))
    # double door
    dh = 0.46
    parts.append(box('dback', (0, ys - 0.012, dh / 2), (0.62, 0.012, dh), M.timber))
    for s in (-1, 1):
        cx = s * 0.158
        parts.append(block(f'leaf{s}', (cx, ys - 0.022, dh / 2), (0.29, 0.016, dh - 0.03), M.oak, 0.004))
        for k, z in enumerate((0.05, 0.42)):
            parts.append(block(f'bar{s}{k}', (cx, ys - 0.034, z), (0.29, 0.016, 0.042), M.timber, 0.004))
            parts.append(box(f'hin{s}{k}', (s * 0.27, ys - 0.046, z), (0.13, 0.012, 0.026), M.iron))
        parts.append(block(f'sti{s}', (s * 0.295, ys - 0.034, dh / 2), (0.036, 0.016, dh), M.timber, 0.004))
        ang = math.atan2(0.34, 0.24) * s
        parts.append(block(f'dia{s}', (cx, ys - 0.034, dh / 2 - 0.01), (0.036, 0.014, 0.4), M.timber, 0.004, rot=(0, ang, 0)))
        parts.append(rod(f'rg{s}', (s * 0.035, ys - 0.052, 0.17), (s * 0.035, ys - 0.052, 0.21), 0.024, M.iron, seg=6))
    # small louvred vent in the gable
    parts.append(box('vf', (0, ys - 0.012, 0.78), (0.21, 0.016, 0.25), M.timber))
    parts.append(box('vd', (0, ys - 0.021, 0.78), (0.15, 0.006, 0.18), M.dark))
    for k in range(4):
        parts.append(box(f'vl{k}', (0, ys - 0.026, 0.715 + k * 0.044), (0.15, 0.01, 0.018), M.oak))
    parts.append(box('vs', (0, ys - 0.03, 0.645), (0.25, 0.04, 0.024), M.timber))
    # foot stones
    for s in (-1, 1):
        for k in range(2):
            parts.append(block(f'f{s}{k}', (s * (hw - 0.04 - k * 0.1), ys - 0.02, 0.045), (0.11, 0.07, 0.09), M.block, 0.008))
    for s in (-1, 1):
        for k in range(3):
            parts.append(block(f'fw{s}{k}', (s * (hw + 0.01), ys + 0.2 + k * 0.25, 0.04), (0.05, 0.22, 0.08), M.block, 0.007))
    # big thatch, ridge north-south
    roof(parts, 'r', (0, (ys + yn) / 2), (yn - ys) / 2 + 0.05, hw + 0.1, h - 0.05, zr, 'y', M.thy, 6, 8, rng, M.oak, thick=0.06, over=1.5, ch=0.42, jag=0.12, back=(3, 4), lip=0.05)
    # barge bundles down both rakes of the south gable, ridge log with ties
    ye = ys - 0.09
    for s in (-1, 1):
        steps = 6
        for i in range(steps):
            t0, t1 = i / steps, (i + 1) / steps
            p0 = (s * (hw + 0.11) * (1 - t0), ye, h - 0.04 + (zr - h + 0.05) * t0)
            p1 = (s * (hw + 0.11) * (1 - t1), ye, h - 0.04 + (zr - h + 0.05) * t1)
            parts.append(rod(f'bg{s}{i}', p0, p1, 0.058, M.thx[1], seg=5, r1=0.05))
    ry = (ys + yn) / 2
    parts.append(rod('ridge', (0, ys - 0.13, zr + 0.022), (0, yn + 0.1, zr + 0.022), 0.055, M.thy[0], seg=7))
    for i, y in enumerate((ys - 0.13, ys + 0.1, ry + 0.2, yn + 0.1)):
        parts.append(rod(f'tie{i}', (0, y - 0.012, zr + 0.022), (0, y + 0.012, zr + 0.022), 0.066, M.ridge, seg=7))
    done(join(parts, 'barn_a'), 'barn_a', size=512)


# ---------------------------------------------------------------- stable

def stable_a():
    reset()
    M = V()
    rng = random.Random(213)
    parts = []
    hw, ys, yn = 0.94, -0.3, 0.3
    h = 0.5
    zr = 0.98
    parts.append(box('body', (0, 0, h / 2), (2 * hw, yn - ys, h), M.plaster, skip=('-z',)))
    # three bays
    bays = (-0.62, -0.17, 0.28)
    for i, cx in enumerate(bays):
        w = 0.36
        parts.append(box(f'in{i}', (cx, ys - 0.004, 0.25), (w, 0.012, 0.36), M.dark))
        parts.append(box(f'hay{i}', (cx, ys - 0.012, 0.25), (w - 0.02, 0.012, 0.09), M.thatch))
        # half door with an X
        parts.append(block(f'door{i}', (cx, ys - 0.024, 0.125), (w - 0.01, 0.022, 0.21), M.oak, 0.004))
        for k, z in enumerate((0.03, 0.22)):
            parts.append(block(f'dr{i}{k}', (cx, ys - 0.036, z), (w, 0.016, 0.032), M.timber, 0.003))
        for s in (-1, 1):
            parts.append(block(f'dst{i}{s}', (cx + s * (w / 2 - 0.012), ys - 0.036, 0.125), (0.03, 0.016, 0.21), M.timber, 0.003))
            parts.append(block(f'dx{i}{s}', (cx, ys - 0.038, 0.125), (0.026, 0.012, 0.36), M.timber, 0.003, rot=(0, s * math.atan2(0.3, 0.16), 0)))
    # posts, braces, plate
    for i, x in enumerate((-0.86, -0.395, 0.055, 0.51, 0.94)):
        parts.append(block(f'post{i}', (x, ys - 0.018, h / 2), (0.075, 0.05, h), M.timber, 0.008))
        for k in (-1, 1):
            if (x + k * 0.1 > -0.94) and (x + k * 0.1 < 0.96):
                parts.append(box(f'br{i}{k}', (x + k * 0.05, ys - 0.016, 0.415), (0.14, 0.04, 0.036), M.timber, rot=(0, k * 0.62, 0)))
        parts.append(box(f'fs{i}', (x, ys - 0.022, 0.05), (0.115, 0.08, 0.1), M.block))
    parts.append(block('plate', (0, ys - 0.022, h + 0.008), (2 * hw + 0.06, 0.056, 0.05), M.timber, 0.008))
    parts.append(block('lint', (0, ys - 0.016, 0.435), (1.34, 0.03, 0.03), M.timber, 0.004))
    # east part: plaster bay with stone footing and a hay rack
    parts.append(box('estone', (0.73, ys - 0.006, 0.075), (0.4, 0.02, 0.15), M.stone))
    parts.append(block('rack', (0.73, ys - 0.06, 0.22), (0.3, 0.08, 0.018), M.timber, 0.003))
    for s in (-1, 1):
        parts.append(block(f'rs{s}', (0.73 + s * 0.15, ys - 0.06, 0.26), (0.018, 0.09, 0.085), M.timber, 0.003))
    parts.append(block('rf', (0.73, ys - 0.1, 0.25), (0.31, 0.016, 0.05), M.oak, 0.003))
    for s in (-1, 1):
        parts.append(sphere(f'hb{s}', (0.73 + s * 0.065, ys - 0.06, 0.29), 0.058, M.thatch, rng, (1.05, 0.7, 0.8)))
    # west side
    parts.append(block('wsoff', (-hw - 0.004, 0, 0.05), (0.04, yn - ys, 0.1), M.block, 0.006))
    # tile roof
    roof(parts, 'r', (0, 0), hw + 0.07, (yn - ys) / 2 + 0.07, h + 0.015, zr, 'x', M.tile, 4, 13, rng, M.plaster, thick=0.04, over=1.4, ch=0.2, back=(2, 8), lip=0.035)
    for s in (-1, 1):
        for sl in (-1, 1):
            parts.append(box(f'vg{s}{sl}', (s * (hw + 0.075), sl * 0.19, (h + zr) / 2 + 0.02), (0.05, 0.56, 0.05), M.timber, rot=(sl * -math.atan2(zr - h, 0.37), 0, 0)))
        parts.append(block(f'rc{s}', (s * (hw + 0.05), 0, zr + 0.05), (0.09, 0.09, 0.1), M.timber, 0.008))
    parts.append(rod('ridge', (-hw - 0.04, 0, zr + 0.012), (hw + 0.04, 0, zr + 0.012), 0.036, M.tile[1], seg=6))
    done(join(parts, 'stable_a'), 'stable_a', size=512)


# ---------------------------------------------------------------- town houses

def house_town_a():
    reset()
    M = V()
    rng = random.Random(214)
    parts = []
    hw, hd = 0.4, 0.4
    h0 = 0.4
    h1 = 0.8
    zr = 1.42
    # ground floor stone, upper floor plaster with overhang
    parts.append(box('gf', (0, 0, h0 / 2), (2 * hw, 2 * hd, h0), M.stone, skip=('-z',)))
    over = 0.04
    parts.append(box('uf', (0, 0, (h0 + h1) / 2), (2 * (hw + over), 2 * (hd + over), h1 - h0), M.plaster, skip=()))
    ys = -hd - over
    parts.append(block('jetty', (0, ys - 0.008, h0 + 0.006), (2 * (hw + over) + 0.04, 0.05, 0.05), M.timber, 0.008))
    parts.append(block('jettyw', (-hw - over - 0.008, 0, h0 + 0.006), (0.05, 2 * hd + 0.1, 0.05), M.timber, 0.008))
    parts.append(block('plate', (0, ys - 0.006, h1 - 0.012), (2 * (hw + over) + 0.03, 0.04, 0.04), M.timber, 0.006))
    parts.append(block('platew', (-hw - over - 0.006, 0, h1 - 0.012), (0.04, 2 * hd + 0.1, 0.04), M.timber, 0.006))
    # timber frame south: corner posts, two middle posts, diagonal braces at the ends
    for i, x in enumerate((-hw - over + 0.01, -0.13, 0.13, hw + over - 0.01)):
        parts.append(box(f'p{i}', (x, ys - 0.006, (h0 + h1) / 2), (0.042, 0.022, h1 - h0), M.timber))
    for s in (-1, 1):
        parts.append(box(f'dg{s}', (s * 0.355, ys - 0.006, (h0 + h1) / 2), (0.034, 0.018, 0.42), M.timber, rot=(0, -s * 0.5, 0)))
    # upper windows between the posts
    window(parts, M, 's', ys, -0.235, 0.61, 0.13, 0.15, M.glass, 'u0')
    window(parts, M, 's', ys, 0.235, 0.61, 0.13, 0.15, M.glass, 'u1')
    window(parts, M, 'w', -hw - over, -0.1, 0.61, 0.13, 0.15, M.glass, 'u2')
    # door, window, corner stones
    arch_door(parts, M, -hd, -0.12, 0.17, 0.32, 'd', ring=0.05)
    window(parts, M, 's', -hd, 0.2, 0.22, 0.13, 0.14, M.glass, 'g0')
    window(parts, M, 'w', -hw, 0.05, 0.22, 0.12, 0.13, M.glass, 'g1')
    for s in (-1, 1):
        quoins(parts, M, s * (hw - 0.005), -hd + 0.005, 2, 0.09, 0.09, 0.14, f'q{s}', rng)
    foot(parts, M, -hw + 0.04, -0.26, -hd - 0.015, 0.08, 2, rng, 'f0')
    foot(parts, M, 0.03, hw - 0.04, -hd - 0.015, 0.08, 3, rng, 'f1')
    # corbels under the jetty
    for s in (-1, 1):
        parts.append(box(f'cb{s}', (s * (hw - 0.03), -hd - 0.012, h0 - 0.05), (0.03, 0.05, 0.1), M.timber))
    # roof
    roof(parts, 'r', (0, 0), hw + over + 0.075, hd + over + 0.055, h1 - 0.01, zr, 'x', M.tile, 6, 8, rng, M.plaster, thick=0.04, over=1.4, ch=0.22, back=(2, 5), lip=0.04)
    parts.append(rod('ridge', (-hw - 0.11, 0, zr + 0.014), (hw + 0.11, 0, zr + 0.014), 0.042, M.tile[1], seg=6))
    for s in (-1, 1):
        parts.append(block(f'rcap{s}', (s * (hw + 0.11), 0, zr + 0.03), (0.06, 0.08, 0.07), M.tile[0], 0.008))
    # dormer on the south slope
    dz0 = 1.03
    dy, dx = -0.28, 0.1
    parts.append(block('dormw', (dx, dy + 0.1, dz0 + 0.095), (0.26, 0.26, 0.19), M.plaster, 0.004))
    window(parts, M, 's', dy - 0.03, dx, dz0 + 0.095, 0.12, 0.11, M.glass, 'dw', sill=True)
    for sd in (-1, 1):
        parts.append(box(f'dp{sd}', (dx + sd * 0.135, dy - 0.034, dz0 + 0.095), (0.034, 0.024, 0.2), M.timber))
    parts.append(extrude_y('dgab', [(dx - 0.15, dz0 + 0.19), (dx + 0.15, dz0 + 0.19), (dx, dz0 + 0.31)], dy - 0.03, dy + 0.0, M.plaster))
    roof(parts, 'dr', (dx, dy + 0.11), 0.18, 0.19, dz0 + 0.17, dz0 + 0.34, 'y', M.tile, 3, 3, rng, M.plaster, thick=0.03, over=1.4, ch=0.22, back=(2, 3), lip=0.02)
    parts.append(rod('dridge', (dx, dy - 0.075, dz0 + 0.35), (dx, dy + 0.3, dz0 + 0.35), 0.028, M.tile[1], seg=5))
    chimney(parts, M, -0.31, 0.02, 1.0, 1.58, 0.17, 'ch', mat=M.gstone, cap=M.gstone)
    done(join(parts, 'house_town_a'), 'house_town_a', size=512)


def house_town_b():
    reset()
    M = V()
    rng = random.Random(215)
    parts = []
    hw, hd = 0.42, 0.4
    h0 = 0.38
    h1 = 0.68
    zr = 1.32
    parts.append(box('gf', (0, 0, h0 / 2), (2 * hw, 2 * hd, h0), M.ochre, skip=('-z',)))
    parts.append(box('gs', (0, -hd - 0.003, 0.12), (2 * hw, 0.012, 0.24), M.stone))
    parts.append(box('uf', (0, 0, (h0 + h1) / 2), (2 * hw, 2 * hd, h1 - h0), M.ochre))
    ys = -hd
    # plates and posts of the frame
    parts.append(block('jetty', (0, ys - 0.018, h0 + 0.004), (2 * hw + 0.05, 0.05, 0.05), M.timber, 0.008))
    parts.append(block('plate', (0, ys - 0.016, h1 + 0.004), (2 * hw + 0.05, 0.045, 0.045), M.timber, 0.008))
    for i, x in enumerate((-hw + 0.01, -0.25, -0.1, 0.1, 0.25, hw - 0.01)):
        parts.append(box(f'p{i}', (x, ys - 0.01, (h0 + h1) / 2), (0.04, 0.022, h1 - h0), M.timber))
    for s in (-1, 1):
        parts.append(box(f'po{s}', (s * (hw - 0.005), ys - 0.012, h0 / 2), (0.04, 0.03, h0), M.timber))
        quoins(parts, M, s * (hw - 0.015), ys - 0.005, 2, 0.1, 0.09, 0.09, f'q{s}', rng)
    # stepped gable: ochre polygon, heavy honey capstones
    steps = [(hw + 0.015, h1), (hw - 0.0, h1 + 0.09), (0.3, h1 + 0.09), (0.3, h1 + 0.24), (0.185, h1 + 0.24), (0.185, h1 + 0.4), (0.09, h1 + 0.4), (0.09, zr - 0.03)]
    out = [(x, z) for x, z in steps] + [(-x, z) for x, z in reversed(steps)]
    parts.append(extrude_y('gab', out, ys - 0.012, ys + 0.09, M.ochre))
    for s in (-1, 1):
        for i, (x, z, w) in enumerate(((hw - 0.03, h1 + 0.09, 0.2), (0.25, h1 + 0.24, 0.17), (0.14, h1 + 0.4, 0.15))):
            parts.append(block(f'cs{s}{i}', (s * x, ys + 0.03, z + 0.02), (w, 0.13, 0.055), M.block, 0.01))
    parts.append(block('top', (0, ys + 0.03, zr + 0.0), (0.24, 0.14, 0.065), M.block, 0.01))
    parts.append(block('top2', (0, ys + 0.03, zr + 0.06), (0.15, 0.13, 0.06), M.block, 0.01))
    # plum roof behind the gable, ridge north-south
    roof(parts, 'r', (0, 0.05), hd + 0.02, hw + 0.075, h1 - 0.04, zr - 0.04, 'y', M.plum, 6, 7, rng, M.ochre, thick=0.04, over=1.4, ch=0.22, back=(4, 6), lip=0.04)
    parts.append(rod('ridge', (0, ys + 0.1, zr - 0.03), (0, hd + 0.08, zr - 0.03), 0.035, M.plum[1], seg=6))
    chimney(parts, M, 0.27, 0.16, 0.88, 1.32, 0.15, 'ch', mat=M.gstone, cap=M.gstone)
    # windows and door
    window(parts, M, 's', ys - 0.012, 0.0, h1 + 0.2, 0.13, 0.15, M.glass, 'u0')
    window(parts, M, 's', ys, -0.28, 0.2, 0.12, 0.13, M.glass, 'g0')
    window(parts, M, 's', ys, 0.28, 0.2, 0.12, 0.13, M.glass, 'g1')
    window(parts, M, 'w', -hw, 0.05, 0.22, 0.12, 0.13, M.glass, 'g2')
    window(parts, M, 'w', -hw, 0.05, 0.53, 0.12, 0.13, M.glass, 'u2')
    arch_door(parts, M, ys, 0.0, 0.18, 0.31, 'd', ring=0.055)
    # east side beam bracket with a blank shield sign
    parts.append(box('br0', (hw + 0.11, -0.1, 0.5), (0.25, 0.035, 0.03), M.timber))
    parts.append(box('br1', (hw + 0.05, -0.1, 0.44), (0.12, 0.022, 0.024), M.iron, rot=(0, -0.8, 0)))
    for s in (-1, 1):
        parts.append(box(f'lk{s}', (hw + 0.14 + s * 0.05, -0.1, 0.465), (0.008, 0.008, 0.05), M.iron))
    sh = [(-0.08, 0.0), (0.08, 0.0), (0.08, -0.09), (0.04, -0.14), (0.0, -0.17), (-0.04, -0.14), (-0.08, -0.09)]
    parts.append(rounded(extrude_y('shd', [(hw + 0.14 + a, 0.44 + b) for a, b in sh], -0.115, -0.085, M.oak), 0.006, segments=1))
    done(join(parts, 'house_town_b'), 'house_town_b', size=512)


# ---------------------------------------------------------------- market stalls

def awning(parts, x0, x1, mats, yb, zb, yf, zf, lip, pre):
    """Bands of cloth along x from the back bar down to the front bar with a scalloped lip. Each band sags and bulges."""
    n = len(mats)
    w = (x1 - x0) / n
    t = 0.012
    for i, mat in enumerate(mats):
        a = x0 + i * w
        cols = [(a, 0.0, 0.55), (a + w * 0.28, 0.018, 1.0), (a + w * 0.72, 0.018, 1.0), (a + w, 0.0, 0.55)]
        rings = []
        for x, sag, lp in cols:
            ym, zm = (yb + yf) / 2, (zb + zf) / 2 - 0.018
            top = [(x, yb, zb), (x, ym, zm - sag), (x, yf, zf), (x, yf - 0.012, zf - lip * lp)]
            bot = [(x, yf - 0.012 + t, zf - lip * lp), (x, yf + t, zf - t), (x, ym, zm - sag - t), (x, yb, zb - t)]
            rings.append(top + bot)
        parts.append(loft(f'{pre}{i}', rings, mat))


def stall_frame(parts, M, pre, rng, hx=0.37, yf=-0.2, yb=0.26, zf=0.8, zb=0.98):
    """Four round posts, front and back bars with rope lashings and big end knobs, counter."""
    for s in (-1, 1):
        parts.append(rod(f'{pre}pf{s}', (s * hx, yf, 0.0), (s * hx, yf, zf + 0.06), 0.058, M.timber, seg=8))
        parts.append(rod(f'{pre}pb{s}', (s * hx, yb, 0.0), (s * hx, yb, zb + 0.06), 0.05, M.timber, seg=8))
        parts.append(loft(f'{pre}cf{s}', [circle((s * hx, yf), 0.062, zf + 0.06, 8), circle((s * hx, yf), 0.04, zf + 0.09, 8)], M.ridge))
        parts.append(loft(f'{pre}cb{s}', [circle((s * hx, yb), 0.054, zb + 0.06, 8), circle((s * hx, yb), 0.034, zb + 0.09, 8)], M.ridge))
        parts.append(rod(f'{pre}lf{s}', (s * hx, yf, zf - 0.035), (s * hx, yf, zf + 0.04), 0.072, M.rope, seg=8))
        parts.append(rod(f'{pre}lb{s}', (s * hx, yb, zb - 0.035), (s * hx, yb, zb + 0.04), 0.064, M.rope, seg=8))
        parts.append(rod(f'{pre}sb{s}', (s * hx, yf, zf - 0.015), (s * hx, yb, zb - 0.015), 0.024, M.timber, seg=5))
        parts.append(box(f'{pre}bd{s}', (s * (hx - 0.06), yf, zf - 0.08), (0.17, 0.03, 0.035), M.timber, rot=(0, s * 0.75, 0)))
    parts.append(rod(f'{pre}bf', (-hx - 0.09, yf, zf), (hx + 0.09, yf, zf), 0.032, M.timber, seg=6))
    parts.append(rod(f'{pre}bb', (-hx - 0.04, yb, zb), (hx + 0.04, yb, zb), 0.028, M.timber, seg=6))
    # counter: top, plank front with a thick bottom rail
    parts.append(block(f'{pre}top', (0, -0.06, 0.37), (2 * hx + 0.02, 0.42, 0.045), M.oak_top, 0.008))
    parts.append(box(f'{pre}front', (0, -0.262, 0.18), (2 * hx - 0.06, 0.024, 0.32), M.oak))
    parts.append(box(f'{pre}cb', (0, -0.06, 0.18), (2 * hx - 0.04, 0.38, 0.3), M.oak, skip=('+z', '-z')))
    parts.append(block(f'{pre}rail', (0, -0.276, 0.04), (2 * hx - 0.04, 0.024, 0.05), M.timber, 0.005))
    parts.append(block(f'{pre}rail2', (0, -0.276, 0.325), (2 * hx - 0.04, 0.024, 0.04), M.timber, 0.005))


def basket(parts, M, c, r, z, pre, h=0.075, seg=10):
    x, y = c
    parts.append(loft(f'{pre}o', [circle(c, r * 0.72, z, seg), circle(c, r, z + h, seg), circle(c, r * 1.03, z + h + 0.016, seg), circle(c, r * 0.9, z + h + 0.016, seg)], M.wicker))
    parts.append(loft(f'{pre}i', [circle(c, r * 0.9, z + h + 0.005, seg), circle(c, r * 0.9, z + h + 0.012, seg)], M.dark))


def market_a():
    reset()
    M = V()
    rng = random.Random(216)
    parts = []
    stall_frame(parts, M, 'a', rng)
    bands = [M.mustard, M.cream, M.mustard, M.cream, M.mustard, M.cream]
    awning(parts, -0.42, 0.42, bands, 0.26, 0.985, -0.2, 0.82, 0.14, 'aw')
    # bread basket and apple basket
    basket(parts, M, (-0.17, -0.1), 0.15, 0.395, 'bb')
    for i, (dx, dy, sq) in enumerate(((-0.07, 0.03, 1.0), (0.05, 0.05, 1.0), (0.0, -0.05, 1.05), (0.08, -0.04, 0.9), (-0.08, -0.06, 0.9))):
        parts.append(sphere(f'br{i}', (-0.17 + dx, -0.1 + dy, 0.51), 0.062, M.bread, rng, (1.15 * sq, 0.9, 0.72)))
    basket(parts, M, (0.17, -0.1), 0.125, 0.395, 'ab')
    for i, (dx, dy) in enumerate(((-0.05, 0.02), (0.05, 0.03), (0.0, -0.05), (0.07, -0.04), (-0.06, -0.05))):
        parts.append(sphere(f'ap{i}', (0.17 + dx, -0.1 + dy, 0.5), 0.044, M.apple, rng, jitter=0.03))
    parts.append(sphere('ap5', (0.175, -0.095, 0.545), 0.044, M.apple, rng, jitter=0.03))
    # cloth over the counter edge
    cloth = [box('cl0', (0.0, -0.17, 0.396), (0.13, 0.17, 0.008), M.linen), box('cl1', (0.0, -0.272, 0.27), (0.13, 0.008, 0.25), M.linen)]
    for s in (-1, 1):
        cloth.append(box(f'cs{s}', (s * 0.038, -0.277, 0.27), (0.016, 0.006, 0.25), M.mustard))
        cloth.append(box(f'ct{s}', (s * 0.038, -0.17, 0.401), (0.016, 0.17, 0.004), M.mustard))
    parts.extend(cloth)
    # barrel on the west
    bc = (-0.44, -0.3)
    parts.append(loft('bar', [circle(bc, 0.075, 0.0, 10), circle(bc, 0.09, 0.1, 10), circle(bc, 0.075, 0.2, 10)], M.oak))
    parts.append(loft('barT', [circle(bc, 0.07, 0.2, 10), circle(bc, 0.07, 0.204, 10)], M.oak_top))
    for z, r in ((0.05, 0.088), (0.15, 0.088)):
        parts.append(rod(f'bh{z}', (bc[0], bc[1], z - 0.012), (bc[0], bc[1], z + 0.012), r, M.iron, seg=10))
    done(join(parts, 'market_a'), 'market_a', size=512)


def crate(parts, M, c, w, d, h, z, pre):
    x, y = c
    parts.append(box(f'{pre}f', (x, y - d / 2, z + h / 2), (w, 0.016, h), M.oak))
    parts.append(box(f'{pre}b', (x, y + d / 2, z + h / 2), (w, 0.016, h), M.oak))
    for s in (-1, 1):
        parts.append(box(f'{pre}s{s}', (x + s * w / 2, y, z + h / 2), (0.016, d, h), M.oak))
    parts.append(box(f'{pre}d', (x, y, z + 0.012), (w, d, 0.018), M.timber))
    parts.append(box(f'{pre}i', (x, y, z + h * 0.72), (w - 0.02, d - 0.02, 0.008), M.dark))
    parts.append(box(f'{pre}r', (x, y - d / 2 - 0.006, z + h - 0.012), (w + 0.01, 0.01, 0.022), M.timber))


def market_b():
    reset()
    M = V()
    rng = random.Random(217)
    parts = []
    stall_frame(parts, M, 'b', rng)
    awning(parts, -0.42, 0.42, [M.orange, M.mauve, M.cream, M.mauve], 0.26, 0.985, -0.2, 0.82, 0.13, 'aw')
    # stitches between the patches
    for i, x in enumerate((-0.21, 0.0, 0.21)):
        for k in range(3):
            parts.append(box(f'st{i}{k}', (x, -0.21 + k * 0.17, 0.83 + k * 0.058), (0.05, 0.012, 0.01), M.rope))
    # three crates with goods, potatoes - carrots - cabbages
    zt = 0.393
    crate(parts, M, (-0.235, -0.1), 0.215, 0.2, 0.08, zt, 'c0')
    crate(parts, M, (0.0, -0.1), 0.215, 0.2, 0.08, zt, 'c1')
    crate(parts, M, (0.235, -0.1), 0.215, 0.2, 0.08, zt, 'c2')
    for i, (dx, dy) in enumerate(((-0.055, 0.04), (0.04, 0.05), (-0.03, -0.04), (0.055, -0.04), (0.0, 0.005))):
        parts.append(sphere(f'po{i}', (-0.235 + dx, -0.1 + dy, 0.49), 0.052, M.potato, rng, (1.1, 0.9, 0.8)))
    bag = Bag('car')
    bm = bag.bm(M.carrot)
    lf = bag.bm(M.leaf)
    for i in range(6):
        cx = -0.07 + (i % 3) * 0.07
        cy = -0.15 + (i // 3) * 0.09
        base = Vector((cx, cy + 0.04, 0.49))
        tip = Vector((cx + rng.uniform(-0.02, 0.02), cy - 0.05, 0.47))
        ax = (tip - base).normalized()
        t = ax.orthogonal().normalized()
        u = ax.cross(t)
        ring = [bm.verts.new(base + (t * math.cos(j * 1.57) + u * math.sin(j * 1.57)) * 0.03) for j in range(4)]
        top = bm.verts.new(tip)
        for j in range(4):
            bm.faces.new((ring[j], ring[(j + 1) % 4], top))
        bm.faces.new(ring)
        lv = [lf.verts.new(base + Vector((dx, 0, dz))) for dx, dz in ((-0.012, 0), (0.012, 0), (0.0, 0.016))]
        lt = lf.verts.new(base + Vector((rng.uniform(-0.02, 0.02), 0.06, 0.05)))
        for j in range(3):
            lf.faces.new((lv[j], lv[(j + 1) % 3], lt))
    parts.extend(bag.objs())
    for i, (dx, dy, r) in enumerate(((-0.052, 0.03, 0.062), (0.052, 0.035, 0.064), (0.0, -0.045, 0.066))):
        parts.append(sphere(f'cb{i}', (0.235 + dx, -0.1 + dy, 0.5), r, M.cabbage, rng, (1, 1, 0.9)))
    # hanging cloth on the east, small crate on the ground
    parts.append(loft('hc', [[(0.38, -0.25, 0.76), (0.46, -0.25, 0.76), (0.46, -0.23, 0.76), (0.38, -0.23, 0.76)],
                             [(0.38, -0.26, 0.56), (0.47, -0.26, 0.54), (0.47, -0.23, 0.54), (0.38, -0.23, 0.56)],
                             [(0.4, -0.25, 0.34), (0.5, -0.25, 0.38), (0.5, -0.235, 0.38), (0.4, -0.235, 0.34)]], M.linen))
    parts.append(rod('hcr', (0.42, -0.24, 0.72), (0.42, -0.24, 0.76), 0.05, M.rope, seg=6))
    crate(parts, M, (0.42, -0.38), 0.13, 0.13, 0.09, 0.0, 'c3')
    for i, (dx, dy) in enumerate(((-0.025, 0.02), (0.03, 0.015), (0.0, -0.03))):
        parts.append(sphere(f'p3{i}', (0.42 + dx, -0.38 + dy, 0.095), 0.028, M.potato, rng, (1.1, 0.9, 0.8)))
    done(join(parts, 'market_b'), 'market_b', size=512)


# ---------------------------------------------------------------- visitor lodge

def stepping(parts, M, rng, pre):
    for i, (y, r) in enumerate(((-0.14, 0.04), (-0.285, 0.045), (-0.445, 0.05))):
        c = (rng.uniform(-0.01, 0.01), y)
        rx = r * 2.1
        rings = []
        for rr, z in ((1.0, 0.0), (1.0, 0.02), (0.88, 0.034)):
            rings.append([(c[0] + math.cos(a * math.pi / 5) * rx * rr, c[1] + math.sin(a * math.pi / 5) * r * rr, z) for a in range(10)])
        parts.append(loft(f'{pre}{i}', rings, M.flag))


def lodge_ground(parts, M, rng):
    stepping(parts, M, rng, 'ss')
    bag = Bag('gb')
    octa_bits(bag, M.pebble, [(-0.3, -0.2, 0.012), (0.28, -0.25, 0.012), (-0.21, -0.38, 0.012), (0.19, -0.39, 0.012), (0.33, -0.09, 0.012), (-0.34, -0.03, 0.012)], rng, 0.018)
    parts.extend(bag.objs())
    for i, (x, y) in enumerate(((-0.39, -0.33), (0.39, -0.33))):
        tufts(parts, M, [(x, y), (x + 0.04, y + 0.03), (x - 0.03, y + 0.04)], rng, f'gt{i}', h=0.06)
        fl = Bag(f'fl{i}')
        octa_bits(fl, M.flower, [(x, y, 0.07), (x + 0.035, y - 0.015, 0.06), (x - 0.03, y + 0.01, 0.065)], rng, 0.018, squash=0.7)
        parts.extend(fl.objs())


def lodge_porch_frame(parts, M, mat=None, zp=0.05):
    """Plank floor with two porch posts on stone plinths, the frame of all three states."""
    parts.append(block('porchf', (0, 0.09, zp / 2), (0.86, 0.2, zp), M.oak_top, 0.006))
    for s in (-1, 1):
        parts.append(block(f'pl{s}', (s * 0.2, 0.0, 0.055), (0.11, 0.11, 0.11), M.block, 0.01))


def lodge_shell(parts, M, rng, state):
    ys, yn = 0.2, 0.47
    hw = 0.47
    h = 0.52
    # plaster on a stone footing, honey timber posts
    parts.append(box('wall', (0, (ys + yn) / 2, h / 2), (2 * hw, yn - ys, h), M.plaster, skip=('-z',)))
    parts.append(box('wfoot', (0, ys - 0.006, 0.05), (2 * hw + 0.01, 0.014, 0.1), M.stone))
    for s in (-1, 1):
        parts.append(block(f'cp{s}', (s * (hw - 0.01), ys - 0.012, h / 2), (0.05, 0.05, h), M.ridge, 0.008))
    parts.append(block('plate', (0, ys - 0.012, h - 0.008), (2 * hw + 0.03, 0.05, 0.04), M.ridge, 0.008))
    # lit windows with rounded tops
    glass = M.lit
    for s in (-1, 1):
        window(parts, M, 's', ys, s * 0.33, 0.3, 0.14, 0.15, glass, f'w{s}', sill=True, arch=True)
    window(parts, M, 'w', -hw, 0.33, 0.27, 0.11, 0.12, glass, 'ww')
    # big roof, ridge east-west
    zr = 0.98
    cy = 0.31
    roof(parts, 'r', (0, cy), hw + 0.04, 0.2, h - 0.02, zr, 'x', M.must, 4, 8, rng, M.plaster, thick=0.042, over=1.45, ch=0.2, back=(3, 6), lip=0.04)
    parts.append(rod('ridge', (-hw - 0.05, cy, zr + 0.016), (hw + 0.05, cy, zr + 0.016), 0.036, M.ridge, seg=6))
    for i in range(5):
        x = -0.4 + i * 0.2
        parts.append(rod(f'rt{i}', (x - 0.008, cy, zr + 0.016), (x + 0.008, cy, zr + 0.016), 0.042, M.timber, seg=6))
    chimney(parts, M, 0.32, 0.36, 0.78, 1.18, 0.16, 'ch')
    # porch: cross gable roof over the door, ridge north-south, with big bargeboards, posts, braces
    pz = 0.52
    for s in (-1, 1):
        parts.append(block(f'pp{s}', (s * 0.2, 0.0, (0.1 + pz) / 2), (0.06, 0.06, pz - 0.1), M.ridge, 0.008))
        parts.append(box(f'ppb{s}', (s * 0.15, -0.006, pz - 0.05), (0.13, 0.03, 0.03), M.ridge, rot=(0, s * 0.75, 0)))
        parts.append(box(f'pps{s}', (s * 0.2, 0.1, pz - 0.0), (0.05, 0.24, 0.04), M.ridge))
    parts.append(block('ppl', (0, 0.0, pz + 0.006), (0.52, 0.056, 0.05), M.ridge, 0.008))
    roof(parts, 'pr', (0, 0.1), 0.17, 0.3, pz + 0.01, 0.8, 'y', M.must, 3, 3, rng, M.must[2], thick=0.036, over=1.45, ch=0.2, back=(3, 3), lip=0.025)
    for s in (-1, 1):
        parts.append(box(f'bg{s}', (s * 0.155, -0.075, 0.66), (0.36, 0.04, 0.036), M.ridge, rot=(0, s * math.atan2(0.26, 0.3), 0)))
    parts.append(rod('prl', (0, -0.1, 0.81), (0, 0.28, 0.81), 0.034, M.ridge, seg=6))
    # hanging lantern
    lz = 0.4
    parts.append(box('lh', (0, -0.012, 0.5), (0.012, 0.012, 0.06), M.iron))
    parts.append(loft('lhat', [circle((0, -0.012), 0.052, lz + 0.05, 6), circle((0, -0.012), 0.01, lz + 0.09, 6)], M.iron))
    parts.append(loft('lb', [circle((0, -0.012), 0.032, lz - 0.05, 6), circle((0, -0.012), 0.044, lz + 0.05, 6)], M.lit))
    parts.append(loft('lfo', [circle((0, -0.012), 0.024, lz - 0.065, 6), circle((0, -0.012), 0.038, lz - 0.05, 6)], M.iron))
    if state == 'intact':
        # arched double door, closed
        parts.append(extrude_y('doorf', arch_outline(0, 0.3, 0.4), ys - 0.01, ys + 0.005, M.ridge))
        parts.append(extrude_y('door', [(x * 0.87, z * 0.97) for x, z in arch_outline(0, 0.3, 0.4)], ys - 0.02, ys - 0.008, M.oak))
        parts.append(box('dsplit', (0, ys - 0.022, 0.18), (0.012, 0.006, 0.34), M.timber))
        for k, z in enumerate((0.1, 0.27)):
            parts.append(box(f'ds{k}', (0, ys - 0.024, z), (0.24, 0.006, 0.022), M.iron))
        for s in (-1, 1):
            parts.append(rod(f'dr{s}', (s * 0.035, ys - 0.03, 0.17), (s * 0.035, ys - 0.03, 0.2), 0.018, M.iron, seg=6))
    else:
        # open door: warm room, floor light, both wings swung out
        parts.append(extrude_y('doorf', arch_outline(0, 0.3, 0.4), ys - 0.01, ys + 0.005, M.ridge))
        parts.append(extrude_y('room', [(x * 0.87, z * 0.97) for x, z in arch_outline(0, 0.3, 0.4)], ys - 0.016, ys - 0.008, M.lit))
        parts.append(box('rs', (0, ys - 0.018, 0.2), (0.17, 0.004, 0.018), M.ridge))
        parts.append(box('rs2', (0, ys - 0.018, 0.13), (0.17, 0.004, 0.012), M.ridge))
        for s in (-1, 1):
            parts.append(box(f'dw{s}', (s * 0.2, ys - 0.07, 0.19), (0.016, 0.13, 0.36), M.oak))
        parts.append(box('flight', (0, 0.09, 0.054), (0.24, 0.2, 0.006), M.lit))
        # flower boxes, sack, bench, ochre pennant
        for s in (-1, 1):
            parts.append(box(f'fb{s}', (s * 0.33, ys - 0.035, 0.2), (0.18, 0.06, 0.042), M.timber))
            fb = Bag(f'fb{s}')
            octa_bits(fb, M.leaf, [(s * 0.33 + (k - 1.5) * 0.045, ys - 0.038, 0.232) for k in range(4)], rng, 0.03, squash=0.9)
            octa_bits(fb, M.flower, [(s * 0.33 + (k - 1.5) * 0.045 + 0.008, ys - 0.056, 0.25) for k in range(4)], rng, 0.02, squash=0.9)
            parts.extend(fb.objs())
        sc = (-0.31, 0.065)
        parts.append(loft('sack', [circle(sc, 0.04, 0.05, 8), circle(sc, 0.062, 0.09, 8), circle(sc, 0.052, 0.14, 8), circle(sc, 0.018, 0.17, 8), circle(sc, 0.03, 0.2, 8)], M.sack))
        parts.append(rod('sr', (sc[0], sc[1], 0.163), (sc[0], sc[1], 0.178), 0.024, M.rope, seg=6))
        parts.append(block('bench', (0.33, 0.04, 0.13), (0.2, 0.08, 0.024), M.oak_top, 0.004))
        for s in (-1, 1):
            parts.append(box(f'bl{s}', (0.33 + s * 0.08, 0.04, 0.09), (0.02, 0.07, 0.08), M.timber))
        parts.append(rod('flagp', (0.2, -0.04, 0.2), (0.2, -0.04, 0.42), 0.007, M.iron, seg=4))
        parts.append(box('flagb', (0.25, -0.04, 0.42), (0.11, 0.01, 0.012), M.iron))
        parts.append(loft('flag', [[(0.205, -0.042, 0.42), (0.305, -0.042, 0.42), (0.305, -0.036, 0.42), (0.205, -0.036, 0.42)],
                                   [(0.205, -0.042, 0.3), (0.255, -0.042, 0.24), (0.255, -0.036, 0.24), (0.205, -0.036, 0.3)]], M.mustard))


def lodge_b_intact():
    reset()
    M = V()
    rng = random.Random(218)
    parts = []
    lodge_porch_frame(parts, M)
    lodge_shell(parts, M, rng, 'intact')
    lodge_ground(parts, M, rng)
    done(join(parts, 'lodge_b_intact'), 'lodge_b_intact', size=512)


def lodge_b_visited():
    reset()
    M = V()
    rng = random.Random(218)
    parts = []
    lodge_porch_frame(parts, M)
    lodge_shell(parts, M, rng, 'visited')
    lodge_ground(parts, M, rng)
    done(join(parts, 'lodge_b_visited'), 'lodge_b_visited', size=512)


def lodge_b_razed():
    reset()
    M = V()
    rng = random.Random(219)
    parts = []
    ys, yn = 0.2, 0.47
    hw = 0.47
    # charred floor and ash
    parts.append(patch('floor', M.ash, 0.47, 0.25, rng, n=14, c=(0, 0.24), cut=0.92))
    parts.append(block('porchf', (0, 0.09, 0.02), (0.56, 0.16, 0.04), M.charwood, 0.004))
    # broken stone walls with stepped tops
    heights_back = [0.34, 0.28, 0.22, 0.17, 0.14, 0.2, 0.3, 0.26]
    for i, ht in enumerate(heights_back):
        x = -hw + (i + 0.5) * (2 * hw / 8)
        parts.append(block(f'wn{i}', (x, yn - 0.02, ht / 2), (2 * hw / 8 * 0.98, 0.09, ht), M.stone if i % 3 else M.soot, 0.012))
    for s, heights in ((-1, (0.36, 0.3, 0.22, 0.16)), (1, (0.3, 0.34, 0.2, 0.26))):
        for i, ht in enumerate(heights):
            y = ys + (i + 0.5) * 0.07
            parts.append(block(f'ws{s}{i}', (s * (hw - 0.03), y, ht / 2), (0.09, 0.07, ht), M.stone if (i + s) % 2 else M.soot, 0.01))
    # south front, broken: stumps left and right of the door gap
    for s, xs_h in ((-1, ((0.4, 0.3), (0.3, 0.2), (0.2, 0.1))), (1, ((0.41, 0.34), (0.31, 0.15), (0.21, 0.08)))):
        for i, (x, ht) in enumerate(xs_h):
            parts.append(block(f'fs{s}{i}', (s * x, ys, ht / 2), (0.1, 0.085, ht), M.stone if i % 2 else M.soot, 0.012))
    # loose capstones on the wall tops
    for i, (x, y, z, r) in enumerate(((-0.42, 0.22, 0.33, 0.1), (0.42, 0.2, 0.37, 0.1), (-0.33, 0.45, 0.35, 0.09), (0.33, 0.46, 0.34, 0.09), (0.45, 0.36, 0.3, 0.08))):
        parts.append(block(f'cap{i}', (x, y, z), (r, r * 0.9, r * 0.7), M.block, 0.012, rot=(0, 0, rng.uniform(-0.3, 0.3))))
    # rubble inside and in front
    for i in range(10):
        x, y = rng.uniform(-0.36, 0.36), rng.uniform(0.24, 0.42)
        r = rng.uniform(0.04, 0.07)
        parts.append(block(f'rb{i}', (x, y, r * 0.5), (r * 1.3, r, r * 0.8), M.block if i % 3 else M.soot, 0.01, rot=(rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.uniform(0, 3))))
    # charred sooty chimney still standing
    parts.append(block('chb', (0.32, yn - 0.06, 0.32), (0.18, 0.18, 0.64), M.soot, 0.008))
    parts.append(block('chu', (0.32, yn - 0.06, 0.82), (0.17, 0.17, 0.36), M.stone, 0.008))
    parts.append(block('cht', (0.32, yn - 0.06, 1.0), (0.2, 0.2, 0.05), M.soot, 0.008))
    parts.append(box('chi', (0.32, yn - 0.06, 1.03), (0.09, 0.09, 0.012), M.dark))
    # porch posts and A-frames of burnt beams
    for s in (-1, 1):
        parts.append(block(f'pl{s}', (s * 0.2, 0.0, 0.055), (0.11, 0.11, 0.11), M.block, 0.01))
        parts.append(block(f'pp{s}', (s * 0.2, 0.0, 0.3), (0.062, 0.062, 0.4), M.charwood, 0.006))
        parts.append(box(f'ppb{s}', (s * 0.15, 0.0, 0.42), (0.13, 0.034, 0.034), M.charwood, rot=(0, s * 0.75, 0)))
    parts.append(block('plate', (0.06, 0.0, 0.51), (0.54, 0.06, 0.05), M.charwood, 0.006, rot=(0, 0.04, 0)))

    def afr(y, pre):
        for s in (-1, 1):
            parts.append(box(f'{pre}a{s}', (s * 0.17, y, 0.66), (0.5, 0.05, 0.052), M.charwood, rot=(0, s * math.atan2(0.3, 0.36), 0)))
        parts.append(box(f'{pre}k', (0, y, 0.66), (0.046, 0.05, 0.34), M.charwood))
    afr(-0.0, 'f0')
    afr(0.3, 'f1')
    # purlins, broken and crooked; jagged rafter ends rise past the ridge
    parts.append(box('rd', (0.0, 0.15, 0.82), (0.05, 0.42, 0.05), M.charwood, rot=(0.12, 0, 0)))
    parts.append(box('prl', (-0.18, 0.15, 0.68), (0.044, 0.42, 0.044), M.charwood, rot=(-0.05, 0, 0)))
    parts.append(box('prr', (0.19, 0.15, 0.68), (0.044, 0.42, 0.044), M.charwood, rot=(0.08, 0, 0)))
    for i, (x, h) in enumerate(((-0.1, 0.93), (0.1, 0.92))):
        parts.append(box(f'jag{i}', (x, 0.28, h - 0.1), (0.04, 0.05, 0.2), M.charwood, rot=(0, 0.35 * (1 if i else -1), 0)))
    # fallen beams crossing on the floor, with embers
    parts.append(box('fb0', (0.0, 0.2, 0.06), (0.52, 0.06, 0.05), M.charwood, rot=(0, 0.1, 0.34)))
    parts.append(box('fb1', (0.02, 0.2, 0.09), (0.46, 0.06, 0.05), M.charwood, rot=(0, -0.08, -0.5)))
    parts.append(box('emb', (0.03, 0.2, 0.116), (0.05, 0.03, 0.006), M.ember))
    # stepping stones and flowers stay
    lodge_ground(parts, M, rng)
    done(join(parts, 'lodge_b_razed'), 'lodge_b_razed', size=512)


# ---------------------------------------------------------------- walkable roof, terrace

def roof_tile_idle():
    """One walkable tile of rooftop: the slope rises from the parapet on the south to the ridge on the north, fills the tile."""
    reset()
    M = V()
    rng = random.Random(220)
    parts = []
    z0, z1 = 0.24, 0.5
    # body: wedge under the tiles
    prof = [(-0.5, 0.0), (0.5, 0.0), (0.5, z1), (-0.42, z0)]
    parts.append(loft('body', [[(x, y, z) for y, z in prof] for x in (-0.5, 0.5)], M.stone))
    bag = Bag('t')
    scales(bag, (-0.5, -0.42, z0), (1.0, 0, 0), (0, 0.9, z1 - z0), 7, 8, M.tile, rng, thick=0.036, over=1.4, ch=0.18, roll=0.02)
    parts.extend(bag.objs())
    # ridge with rolled tiles
    for i in range(6):
        x = -0.5 + (i + 0.5) / 6
        parts.append(rod(f'rd{i}', (x - 0.083, 0.46, z1 + 0.018), (x + 0.083, 0.46, z1 + 0.018), 0.042, M.tile[i % 3], seg=6, r1=0.036))
    # south parapet: band of blocks with merlons, on a coursed face
    parts.append(box('face', (0, -0.47, 0.13), (1.0, 0.06, 0.26), M.stone, skip=('-z',)))
    for i in range(6):
        x = -0.5 + (i + 0.5) / 6
        parts.append(block(f'pa{i}', (x, -0.46, 0.285), (1 / 6 * 0.95, 0.08, 0.05), M.block, 0.008))
    for i, x in enumerate((-0.44, -0.145, 0.145, 0.44)):
        parts.append(block(f'mer{i}', (x, -0.46, 0.34), (0.12, 0.09, 0.08), M.block, 0.012))
    # chimney stub in the north-east corner
    chimney(parts, M, 0.34, 0.33, 0.42, 0.72, 0.2, 'ch')
    done(join(parts, 'roof_tile_idle'), 'roof_tile_idle', size=512)


def terrace_a():
    """Hillside tile: dry-stone wall on the south, soil strip with wheat (middle free), higher narrow step at the back."""
    reset()
    M = V()
    rng = random.Random(221)
    parts = []
    z1, z2 = 0.32, 0.46
    parts.append(box('core', (0, 0, z1 / 2), (1.0, 1.0, z1 - 0.01), M.stone, skip=('-z',)))
    parts.append(box('soil', (0, -0.04, z1 - 0.004), (0.98, 0.84, 0.014), M.soil))
    # back step
    parts.append(box('back', (0, 0.44, (z1 + z2) / 2), (1.0, 0.12, z2 - z1), M.earth))
    # south wall: two courses of boulders and flat capstones
    xs = [-0.42, -0.2, 0.0, 0.2, 0.42]
    for i, x in enumerate(xs):
        parts.append(sphere(f'b0{i}', (x + rng.uniform(-0.02, 0.02), -0.47, 0.085), 0.125, M.bstone, rng, (1.05, 0.7, 0.8), sub=2, jitter=0.05))
    for i, x in enumerate((-0.31, -0.1, 0.1, 0.31)):
        parts.append(sphere(f'b1{i}', (x, -0.465, 0.205), 0.1, M.bstone, rng, (1.1, 0.7, 0.75), sub=1, jitter=0.05))
    for i, (x, w) in enumerate(((-0.42, 0.17), (-0.2, 0.25), (0.05, 0.22), (0.27, 0.2), (0.44, 0.13))):
        parts.append(block(f'cs{i}', (x, -0.45, z1 + 0.012), (w, 0.13, 0.085), M.bstone, 0.016))
    # back wall of slabs, with end blocks on both sides
    for i, (x, w) in enumerate(((-0.42, 0.14), (-0.21, 0.24), (0.03, 0.22), (0.25, 0.2), (0.43, 0.14))):
        parts.append(block(f'ms{i}', (x, 0.375, z1 + 0.07), (w, 0.1, 0.1 + (0.05 if i in (0, 4) else 0)), M.bstone, 0.014))
    tufts_pts = [(-0.08, -0.37), (0.15, -0.38), (0.42, 0.36)]
    # wheat on the strip: four rows, middle free
    bag = Bag('w')
    for x in ROWS:
        for k in range(3):
            y = -0.27 + k * 0.215
            wheat(bag, M, x, y, 0.38, rng, r=0.03, pairs=2, spread=0.05, z=z1, stem=0.02)
    parts.extend(bag.objs())
    back = Bag('wb')
    for i in range(5):
        wheat(back, M, -0.4 + i * 0.2, 0.455, 0.28, rng, r=0.024, pairs=2, spread=0.04, z=z2, stem=0.02)
    parts.extend(back.objs())
    moss = Bag('m')
    octa_bits(moss, M.moss, [(-0.32, -0.525, 0.14), (0.1, -0.53, 0.14), (0.31, -0.53, 0.22), (-0.1, -0.53, 0.26)], rng, 0.03, squash=0.5)
    parts.extend(moss.objs())
    done(join(parts, 'terrace_a'), 'terrace_a', size=512)


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    jobs = {
        'field_open': field_open,
        'field_burnt': field_burnt,
        'hay_a': hay_a,
        'vine_a': vine_a,
        'fence_wicker_a': fence_wicker_a,
        'paddock_straight': paddock_straight,
        'paddock_corner': paddock_corner,
        'paddock_gate': paddock_gate,
        'sign_a': sign_a,
        'lantern_post_a': lantern_post_a,
        'mill_idle': mill_idle,
        'barn_a': barn_a,
        'stable_a': stable_a,
        'house_town_a': house_town_a,
        'house_town_b': house_town_b,
        'market_a': market_a,
        'market_b': market_b,
        'lodge_b_intact': lodge_b_intact,
        'lodge_b_visited': lodge_b_visited,
        'lodge_b_razed': lodge_b_razed,
        'roof_tile_idle': roof_tile_idle,
        'terrace_a': terrace_a,
    }
    for name, fn in jobs.items():
        if not only or name in only:
            fn()
