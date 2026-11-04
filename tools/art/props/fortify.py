"""Fortification kit and rock massif, modelled after the target pictures art/mockups/map-assets/ziel_*.png.

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/fortify.py [-- id ...]

Pieces of one kit; the board picks them from the neighbouring fields (src/render/board/wallKit.ts):
- wallrim_idle: parapet on the south edge of a wall tile (origin at wall top): honey band and three big rounded merlons,
  with a course of stone hanging over the top of the wall face.
- tower_idle: round chunky corner tower, flared foot, corbel band, crown of 8 merlons, flagged floor, arched slit, pennant.
- gatehouse_open, gatehouse_closed: two-tile gatehouse around x = 0: D towers, wedge-stone arch, gable with shield, oak wings
  with rounded tops, iron straps and ring handles.
- gate_idle: one-tile gate, same language.
- door_closed_idle, door_open_idle: stone frame with a round-topped oak door.
- throne_idle: stone throne.
- massif_a, massif_b, massif_c: overlapping angular slabs that fill the tile and hide the tile seam.

Helpers (image_mat, rounded, wing, arch_face, slab) are shared with the other kits of this folder.
Textures: art/props/textures/kit_stone.png, kit_oak.png, cut from the ChatGPT sheet (art/prompts/map_assets_textures.md).
South faces -y (the board turns props by pi). Fixed seeds, deterministic. Writes art/models/props/<id>.glb and previews.
"""
import math
import os
import random
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
from common import ROOT, finish, join, reset  # noqa: E402
from houses import box, circle, lin, loft, paint  # noqa: E402

SEG = 16
TEX = os.path.join(ROOT, 'art', 'props', 'textures')


def image_mat(name, file, mode='wall', scale=1.0, center=(0.0, 0.0), radius=0.4, tint=(1, 1, 1)):
    """Material from an image, projected by position: 'wall' uses (x + y, z), 'round' the angle around `center` and z, 'top' (x, y)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, L = m.node_tree.nodes, m.node_tree.links
    bsdf = n['Principled BSDF']
    geo = n.new('ShaderNodeNewGeometry')
    sp = n.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Position'], sp.inputs[0])
    cb = n.new('ShaderNodeCombineXYZ')

    def math_node(op, a, b):
        k = n.new('ShaderNodeMath')
        k.operation = op
        for i, v in enumerate((a, b)):
            if isinstance(v, (int, float)):
                k.inputs[i].default_value = v
            else:
                L.new(v, k.inputs[i])
        return k.outputs[0]

    if mode == 'round':
        ang = math_node('ARCTAN2', math_node('SUBTRACT', sp.outputs['Y'], center[1]), math_node('SUBTRACT', sp.outputs['X'], center[0]))
        L.new(math_node('MULTIPLY', math_node('MULTIPLY', ang, radius), scale), cb.inputs['X'])
        L.new(math_node('MULTIPLY', sp.outputs['Z'], scale), cb.inputs['Y'])
    elif mode == 'wall':
        L.new(math_node('MULTIPLY', math_node('ADD', sp.outputs['X'], sp.outputs['Y']), scale), cb.inputs['X'])
        L.new(math_node('MULTIPLY', sp.outputs['Z'], scale), cb.inputs['Y'])
    else:
        L.new(math_node('MULTIPLY', sp.outputs['X'], scale), cb.inputs['X'])
        L.new(math_node('MULTIPLY', sp.outputs['Y'], scale), cb.inputs['Y'])
    tex = n.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(os.path.join(TEX, file), check_existing=True)
    tex.extension = 'REPEAT'
    L.new(cb.outputs[0], tex.inputs['Vector'])
    # facets towards the light come out lighter: the painted look of the other props
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
    L.new(tex.outputs['Color'], mix.inputs[0])
    L.new(shade.outputs['Result'], mix.inputs['Scale'])
    tn = n.new('ShaderNodeVectorMath')
    tn.operation = 'MULTIPLY'
    L.new(mix.outputs[0], tn.inputs[0])
    tn.inputs[1].default_value = tint
    L.new(tn.outputs[0], bsdf.inputs['Base Color'])
    return m


class Mats:
    def __init__(self, center=(0.0, 0.0), radius=0.42):
        self.stone = image_mat('kit_stone', 'kit_stone.png', 'wall', 1.05)
        self.round = image_mat('kit_round', 'kit_stone.png', 'round', 1.05, center, radius)
        self.block = paint('kit_block', [(0.0, lin(150, 112, 70)), (0.45, lin(214, 170, 112)), (1.0, lin(250, 222, 168))],
                           wn=0.75, noise=0.12, nscale=18, seed=72.0, bias=0.0)
        self.floor = paint('kit_floor', [(0.0, lin(134, 112, 86)), (0.6, lin(182, 156, 122)), (1.0, lin(210, 188, 152))], wn=0.3,
                           noise=0.2, nscale=12, seed=77.0, bias=0.25, pattern=('stones', 7.0, 0.06, 0.5))
        self.oak = image_mat('kit_oak', 'kit_oak.png', 'wall', 2.0)
        self.frame = paint('kit_frame', [(0.0, lin(70, 40, 22)), (1.0, lin(128, 78, 42))], wn=0.6, noise=0.1, nscale=14, seed=78.0)
        self.iron = paint('kit_iron', [(0.0, lin(36, 34, 36)), (1.0, lin(92, 88, 86))], wn=0.8, noise=0.05, nscale=20, seed=79.0)
        self.pennant = paint('kit_pennant', [(0.0, lin(118, 30, 44)), (1.0, lin(176, 52, 62))], wn=0.6, noise=0.05, nscale=8, seed=80.0)
        self.cushion = paint('kit_cushion', [(0.0, lin(84, 26, 40)), (1.0, lin(150, 48, 62))], wn=0.7, noise=0.05, nscale=8, seed=81.0)
        self.gold = paint('kit_gold', [(0.0, lin(150, 100, 30)), (1.0, lin(250, 208, 96))], wn=0.8, noise=0.04, nscale=8, seed=82.0)
        self.rock = paint('massif', [(0.0, lin(58, 52, 54)), (0.35, lin(98, 88, 84)), (0.7, lin(148, 134, 118)), (1.0, lin(186, 172, 148))],
                          z=(0.0, 0.5), wz=0.3, wn=0.8, noise=0.1, nscale=9, seed=75.0, bias=-0.1)
        self.moss = paint('moss', [(0.0, lin(66, 92, 44)), (1.0, lin(130, 158, 66))], wn=0.5, noise=0.2, nscale=14, seed=76.0, bias=0.1)


def rounded(obj, width=0.014, segments=2, angle=35):
    """Soft chunky edges; applied before the bake."""
    mod = obj.modifiers.new('bevel', 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(angle)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def merlons(parts, mat, name, pts, h, w, d, z):
    for i, (x, y, rz) in enumerate(pts):
        parts.append(box(f'{name}{i}', (x, y, z + h / 2), (w, d, h), mat, rot=(0, 0, rz), skip=('-z',)))


def ring_merlons(parts, mat, prefix, c, r, top, count, h, depth, fill=0.56):
    x, y = c
    w = 2 * math.pi * r / count * fill
    pts = [(x + math.cos(2 * math.pi * k / count) * r, y + math.sin(2 * math.pi * k / count) * r, 2 * math.pi * k / count + math.pi / 2) for k in range(count)]
    merlons(parts, mat, f'{prefix}m', pts, h, w, depth, top)


def extrude_y(name, pts, y0, y1, mat):
    """Polygon in (x, z) extruded along y."""
    return loft(name, [[(x, y0, z) for x, z in pts], [(x, y1, z) for x, z in pts]], mat)


def round_top(w, h, n=6):
    """Outline (x, z) of a wing with a top that falls from the hinge side (x = 0) to the free edge (x = w) in a quarter ellipse."""
    rise = w * 0.32
    pts = [(0, 0), (w, 0), (w, h - rise)]
    for i in range(1, n):
        a = math.pi * 0.5 * i / n
        pts.append((w * math.cos(a), h - rise + math.sin(a) * rise))
    pts.append((0, h))
    return pts


def wing(M, name, hinge, angle, height, width, flip=False):
    """Round-topped oak wing from its hinge, swung by `angle` around z: planks, rim, two iron straps, ring handle."""
    outline = round_top(width, height)
    t = 0.045
    parts = [extrude_y(f'{name}p', outline, -t / 2, t / 2, M.oak)]
    edge = outline[1:]
    for i in range(len(edge) - 1):
        (x0, z0), (x1, z1) = edge[i], edge[i + 1]
        ln = math.hypot(x1 - x0, z1 - z0)
        if ln < 0.001:
            continue
        parts.append(box(f'{name}f{i}', ((x0 + x1) / 2, 0, (z0 + z1) / 2), (ln + 0.012, t + 0.016, 0.03), M.frame, rot=(0, -math.atan2(z1 - z0, x1 - x0), 0)))
    for k, z in enumerate((height * 0.26, height * 0.62)):
        parts.append(box(f'{name}s{k}', (width / 2, -t / 2 - 0.004, z), (width * 0.92, 0.012, 0.035), M.iron))
        parts.append(box(f'{name}t{k}', (width / 2, t / 2 + 0.004, z), (width * 0.92, 0.012, 0.035), M.iron))
    for k, (dx, dz, w, h) in enumerate(((0, 0.028, 0.06, 0.016), (0, -0.028, 0.06, 0.016), (0.028, 0, 0.016, 0.06), (-0.028, 0, 0.016, 0.06))):
        parts.append(box(f'{name}r{k}', (width * 0.78 + dx, -t / 2 - 0.008, height * 0.42 + dz), (w, 0.012, h), M.iron))
        parts.append(box(f'{name}q{k}', (width * 0.78 + dx, t / 2 + 0.008, height * 0.42 + dz), (w, 0.012, h), M.iron))
    obj = join(parts, name)
    ca, sa = math.cos(angle), math.sin(angle)
    for v in obj.data.vertices:
        x, y = (-v.co.x if flip else v.co.x), v.co.y
        v.co.x = hinge[0] + ca * x - sa * y
        v.co.y = hinge[1] + sa * x + ca * y
    if flip:
        # the mirror turned the faces inside out
        obj.data.flip_normals()
    return obj


def with_wings(parts, pid, width):
    """Bevels the masonry only: wings (named w*) have many small parts, the bevel would multiply them."""
    wings = [p for p in parts if p.name in ('wl', 'wr')]
    rest = rounded(join([p for p in parts if p not in wings], f'{pid}_stone'), width, segments=1)
    return join([rest, *wings], pid)


def tower_parts(M, c, r, top, prefix, ring=8, crown=True):
    """Flared foot in two courses, coursed shaft, corbel band, crown with merlons and flag floor."""
    parts = [
        loft(f'{prefix}foot', [circle(c, r + 0.1, -0.03, SEG), circle(c, r + 0.09, 0.09, SEG), circle(c, r + 0.05, 0.13, SEG), circle(c, r + 0.05, 0.22, SEG), circle(c, r, 0.27, SEG)], M.round),
        loft(f'{prefix}shaft', [circle(c, r, 0.26, SEG), circle(c, r, top - 0.2, SEG)], M.round),
        loft(f'{prefix}cor', [circle(c, r, top - 0.2, SEG), circle(c, r + 0.05, top - 0.13, SEG), circle(c, r + 0.05, top, SEG)], M.block),
    ]
    if crown:
        parts.append(loft(f'{prefix}floor', [circle(c, r + 0.04, top - 0.005, SEG), circle(c, r + 0.04, top + 0.003, SEG)], M.floor))
        ring_merlons(parts, M.block, prefix, c, r + 0.01, top, ring, 0.19, 0.11, fill=0.62)
    return parts


def slit(M, x, y, z, prefix):
    """Arched arrow slit on the south front."""
    return [
        box(f'{prefix}fr', (x, y, z), (0.15, 0.02, 0.24), M.block),
        box(f'{prefix}frt', (x, y, z + 0.135), (0.1, 0.02, 0.06), M.block),
        box(f'{prefix}sl', (x, y - 0.014, z - 0.005), (0.07, 0.012, 0.18), M.iron),
        box(f'{prefix}slt', (x, y - 0.014, z + 0.095), (0.045, 0.012, 0.03), M.iron),
    ]


def wallrim_idle():
    reset()
    M = Mats()
    rng = random.Random(81)
    parts = [
        box('kerb', (0, -0.44, 0.03), (1.0, 0.13, 0.06), M.block, skip=('-z',)),
        box('lip', (0, -0.51, -0.075), (1.01, 0.05, 0.17), M.stone),
    ]
    pts = [(x, -0.44, rng.uniform(-0.03, 0.03)) for x in (-0.335, 0, 0.335)]
    merlons(parts, M.block, 'm', pts, 0.19, 0.2, 0.13, 0.05)
    finish(rounded(join(parts, 'wallrim_idle'), 0.016), 'wallrim_idle', size=256)


def tower_idle():
    reset()
    M = Mats()
    top = 1.42
    parts = tower_parts(M, (0, 0), 0.44, top, 't', ring=8)
    parts += slit(M, 0, -0.445, 0.68, 'a')
    parts.append(box('pole', (-0.14, 0.14, top + 0.33), (0.022, 0.022, 0.66), M.frame))
    parts.append(box('ball', (-0.14, 0.14, top + 0.68), (0.045, 0.045, 0.045), M.gold))
    parts.append(loft('flag', [[(-0.13, 0.14, top + 0.44), (-0.13, 0.14, top + 0.62), (-0.13, 0.145, top + 0.62), (-0.13, 0.145, top + 0.44)],
                               [(0.2, 0.14, top + 0.5), (0.13, 0.14, top + 0.535), (0.13, 0.145, top + 0.535), (0.2, 0.145, top + 0.5)]], M.pennant))
    finish(rounded(join(parts, 'tower_idle'), 0.012), 'tower_idle', size=512)


def arch_face(M, half, spring, rise, top, depth, prefix, peak=0.0):
    """Wall with an arched opening (x -half .. half, top of the arch at spring + rise), wedge stones around it, gable on top."""
    n = 7
    outline = [(-half - 0.14, 0.0), (-half, 0.0), (-half, spring)]
    for i in range(1, n):
        a = math.pi * i / n
        outline.append((-half * math.cos(a), spring + rise * math.sin(a)))
    outline += [(half, spring), (half, 0.0), (half + 0.14, 0.0), (half + 0.14, top), (0.0, top + peak), (-half - 0.14, top)]
    parts = [extrude_y(f'{prefix}wall', outline, -depth / 2, depth / 2, M.stone)]
    for i in range(n):
        a0, a1 = math.pi * (i + 0.04) / n, math.pi * (i + 0.96) / n
        out = 0.15
        q = [(-half * math.cos(a0), spring + rise * math.sin(a0)),
             (-half * math.cos(a1), spring + rise * math.sin(a1)),
             (-(half + out) * math.cos(a1), spring + (rise + out) * math.sin(a1)),
             (-(half + out) * math.cos(a0), spring + (rise + out) * math.sin(a0))]
        parts.append(extrude_y(f'{prefix}w{i}', q, -depth / 2 - 0.045, -depth / 2 + 0.02, M.block))
    return parts


def shield(M, x, y, z, s, prefix):
    pts = [(-0.5, 0.5), (0.5, 0.5), (0.5, 0.0), (0.28, -0.35), (0.0, -0.58), (-0.28, -0.35), (-0.5, 0.0)]
    pts = [(x + a * s, z + b * s) for a, b in pts]
    inner = [(x + (a - x) * 0.72, z + (b - z) * 0.72) for a, b in pts]
    return [extrude_y(f'{prefix}o', pts, y - 0.03, y, M.block), extrude_y(f'{prefix}i', inner, y - 0.04, y - 0.02, M.stone)]


def gatehouse(state):
    reset()
    M = Mats((0.78, -0.02), 0.28)
    Ml = Mats((-0.78, -0.02), 0.28)
    top = 1.36
    parts = []
    parts += tower_parts(Ml, (-0.78, -0.02), 0.28, top, 'l', crown=False)
    parts += tower_parts(M, (0.78, -0.02), 0.28, top, 'r', crown=False)
    for s, m in ((-1, Ml), (1, M)):
        c = (s * 0.78, -0.02)
        parts.append(loft(f'cap{s}', [circle(c, 0.325, top - 0.005, SEG), circle(c, 0.325, top + 0.07, SEG), circle(c, 0.26, top + 0.11, SEG), circle(c, 0.26, top + 0.13, SEG)], m.block))
        parts.append(box(f'notch{s}', (c[0], c[1] - 0.2, top + 0.15), (0.2, 0.14, 0.08), m.block))
    parts += arch_face(M, 0.46, 0.5, 0.26, 1.0, 0.36, 'h', peak=0.22)
    parts += shield(M, 0, -0.195, 1.0, 0.22, 'sh')
    for sx in (-1, 1):
        a = math.atan2(0.22, 0.6)
        parts.append(box(f'gb{sx}', (sx * 0.3, -0.05, 1.11), (0.68, 0.34, 0.07), M.block, rot=(0, sx * a, 0)))
    if state == 'open':
        # the wings swing towards the viewer and away from the middle: their faces stay visible from the game camera
        parts.append(wing(M, 'wl', (-0.46, -0.2), math.radians(48), 0.74, 0.44, flip=True))
        parts.append(wing(M, 'wr', (0.46, -0.2), math.radians(-48), 0.74, 0.44))
    else:
        parts.append(wing(M, 'wl', (-0.46, -0.1), 0, 0.74, 0.46))
        parts.append(wing(M, 'wr', (0.46, -0.1), 0, 0.74, 0.46, flip=True))
    pid = f'gatehouse_{state}'
    finish(with_wings(parts, pid, 0.01), pid, size=1024)


def gate_idle():
    reset()
    M = Mats()
    parts = []
    for s in (-1, 1):
        parts.append(box(f'pil{s}', (s * 0.42, 0, 0.5), (0.2, 0.38, 1.0), M.stone, skip=('-z',)))
        parts.append(box(f'cap{s}', (s * 0.42, 0, 1.03), (0.24, 0.42, 0.08), M.block))
    parts += arch_face(M, 0.31, 0.42, 0.22, 0.9, 0.34, 'h', peak=0.14)
    parts += shield(M, 0, -0.18, 0.86, 0.13, 'sh')
    parts.append(wing(M, 'wl', (-0.31, -0.18), math.radians(48), 0.56, 0.28, flip=True))
    parts.append(wing(M, 'wr', (0.31, -0.18), math.radians(-48), 0.56, 0.28))
    finish(with_wings(parts, 'gate_idle', 0.01), 'gate_idle', size=512)


def door(state):
    reset()
    M = Mats()
    parts = arch_face(M, 0.33, 0.42, 0.22, 0.86, 0.24, 'f')
    if state == 'closed':
        parts.append(wing(M, 'wl', (-0.33, -0.05), 0, 0.62, 0.33))
        parts.append(wing(M, 'wr', (0.33, -0.05), 0, 0.62, 0.33, flip=True))
    else:
        parts.append(wing(M, 'wl', (-0.33, -0.12), math.radians(48), 0.62, 0.3, flip=True))
        parts.append(wing(M, 'wr', (0.33, -0.12), math.radians(-48), 0.62, 0.3))
    pid = f'door_{state}_idle'
    finish(with_wings(parts, pid, 0.008), pid, size=512)


def throne_idle():
    reset()
    M = Mats()
    parts = [
        box('dais', (0, 0.02, 0.05), (0.72, 0.68, 0.1), M.block, skip=('-z',)),
        box('seat', (0, 0.04, 0.24), (0.52, 0.46, 0.28), M.stone, skip=('-z',)),
        box('cush', (0, 0.0, 0.4), (0.42, 0.38, 0.06), M.cushion),
        box('back', (0, 0.24, 0.7), (0.56, 0.14, 0.86), M.stone),
        box('backin', (0, 0.165, 0.68), (0.36, 0.02, 0.56), M.cushion),
        box('crest', (0, 0.24, 1.17), (0.34, 0.11, 0.09), M.gold),
    ]
    for s in (-1, 1):
        parts.append(box(f'arm{s}', (s * 0.3, 0.02, 0.5), (0.1, 0.46, 0.08), M.block))
        parts.append(box(f'leg{s}', (s * 0.3, -0.19, 0.3), (0.1, 0.08, 0.36), M.block))
        parts.append(box(f'peak{s}', (s * 0.15, 0.24, 1.26), (0.06, 0.11, 0.1), M.gold))
    parts.append(box('peak0', (0, 0.24, 1.28), (0.07, 0.11, 0.14), M.gold))
    finish(rounded(join(parts, 'throne_idle'), 0.012), 'throne_idle', size=512)


def slab(name, c, rx, ry, z0, z1, tilt, rng, mat):
    """An angular rock plate: 5 to 7 corners, tilted top, the top ring pulled in so the sides read as a chipped ledge."""
    n = rng.randint(5, 7)
    off = rng.uniform(0, 6.28)
    base, top = [], []
    for k in range(n):
        a = off + 2 * math.pi * (k + rng.uniform(-0.2, 0.2)) / n
        rr = rng.uniform(0.85, 1.12)
        base.append((c[0] + math.cos(a) * rx * rr, c[1] + math.sin(a) * ry * rr, z0))
        tp = rng.uniform(0.62, 0.86)
        xt, yt = c[0] + math.cos(a) * rx * rr * tp, c[1] + math.sin(a) * ry * rr * tp
        top.append((xt, yt, z1 + (xt - c[0]) * tilt[0] + (yt - c[1]) * tilt[1] + rng.uniform(-0.015, 0.015)))
    return loft(name, [base, top], mat)


def massif(pid, seed, peak):
    """Big overlapping plates over the whole tile; the outer ones reach past the edge so tile seams disappear."""
    reset()
    M = Mats()
    rng = random.Random(seed)
    parts = []
    for i, (x, y) in enumerate([(-0.3, -0.3), (0.3, -0.3), (-0.3, 0.3), (0.3, 0.3)]):
        parts.append(slab(f'lo{i}', (x + rng.uniform(-0.05, 0.05), y + rng.uniform(-0.05, 0.05)), 0.36, 0.36, -0.02, 0.1 + rng.uniform(0, 0.05), (rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2)), rng, M.rock))
    for i in range(3):
        x, y = rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2)
        parts.append(slab(f'mid{i}', (x, y), rng.uniform(0.2, 0.28), rng.uniform(0.2, 0.28), 0.04, peak * rng.uniform(0.55, 0.8), (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3)), rng, M.rock))
    x, y = rng.uniform(-0.12, 0.12), rng.uniform(-0.12, 0.12)
    parts.append(slab('top', (x, y), 0.16, 0.14, peak * 0.3, peak, (rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4)), rng, M.rock))
    for i in range(rng.randint(0, 2)):
        x, y = rng.uniform(-0.32, 0.32), rng.uniform(-0.32, 0.32)
        parts.append(slab(f'moss{i}', (x, y), 0.08, 0.06, 0.02, 0.14 + rng.uniform(0, 0.04), (0, 0), rng, M.moss))
    finish(join(parts, pid), pid, size=512)


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    jobs = {
        'wallrim_idle': wallrim_idle,
        'tower_idle': tower_idle,
        'gatehouse_open': lambda: gatehouse('open'),
        'gatehouse_closed': lambda: gatehouse('closed'),
        'gate_idle': gate_idle,
        'door_closed_idle': lambda: door('closed'),
        'door_open_idle': lambda: door('open'),
        'throne_idle': throne_idle,
        'massif_a': lambda: massif('massif_a', 91, 0.42),
        'massif_b': lambda: massif('massif_b', 92, 0.5),
        'massif_c': lambda: massif('massif_c', 93, 0.34),
    }
    for name, fn in jobs.items():
        if not only or name in only:
            fn()
