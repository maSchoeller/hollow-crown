"""House variants (reference art/props/refs/houses_variants.png, rows 1-4) and the visitable lodge.

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/props/houses_variants.py

- house_b_intact: long half-timbered house, deep straw thatch, gable (and door) to the south, chimney
- house_c_intact: two-storey town house: stone ground floor with arched door, half-timbered upper floor, oriel bay
  on the front, blue-grey slate roof, chimney with clay pots
- house_d_intact: small cabin: plank walls, mossy shingle roof (ridge east-west, door in the south wall), log pile
  on the east side
- lodge_intact / lodge_visited / lodge_razed: the inn (the board's "visit" house). Bigger than the cottages, strong
  blue-green roof, front gable wing with arched door, hanging sign, cream banner above the door, warm lantern.
  visited: door ajar with warm light, banner furled, shutters and flower box. razed: burnt out, same footprint as
  house_razed, teal tile shards, charred sign and banner scraps.

Reuses the paints and builders of houses.py. Writes art/models/props/<id>.glb and art/props/previews/<id>.png.
Fixed seeds, so the output is deterministic. Convention as houses.py: tile = 1 unit, origin at the tile centre on the
ground, door / gable to the south (-Y).
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Euler, Vector

sys.path.insert(0, os.path.dirname(__file__))
from common import finish, join, mesh_object, reset  # noqa: E402
from houses import (BASE_Z, Mats, _wall_box, beam, box, chimney, circle, edge_stones, flat_mat, hexa,  # noqa: E402
                    lin, loft, octa, paint, prism, razed_wall, thatch, window, with_mat)


# ---------------------------------------------------------------- helpers

def place(objs, rot=0.0, off=(0.0, 0.0, 0.0)):
    """Rotate meshes about z (radians, counter-clockwise) and move them; (x, y) -> (-y, x) for +90 degrees."""
    c, s = math.cos(rot), math.sin(rot)
    for o in objs:
        for v in o.data.vertices:
            x, y, z = v.co
            v.co = (x * c - y * s + off[0], x * s + y * c + off[1], z + off[2])
    return objs


def slope_frame(eave_y, eave_z, ridge_z, s):
    """P(x, t, h) on roof slope s (-1 south, +1 north): t along the slope from the eave, h out of it."""
    dy, dz = -s * eave_y, ridge_z - eave_z
    ln = math.hypot(dy, dz)
    v = Vector((0, dy / ln, dz / ln))
    nrm = Vector((0, s * dz / ln, eave_y / ln))
    e = Vector((0, s * eave_y, eave_z))

    def P(x, t, h):
        return Vector((x, 0, 0)) + e + v * t + nrm * h
    return P, ln


def shingle_roof(name, mats, ridge_mat, deck_mat, rx, eave_y, eave_z, ridge_z, rows, segs, th, rng, ridge_w=0.075):
    """Gable roof (ridge along x, centred on the origin) of overlapping rows of chunky shingle strips. The fine
    shingle pattern comes from the paint, the strips give the stepped silhouette."""
    parts = []
    for s in (-1, 1):
        P, ln = slope_frame(eave_y, eave_z, ridge_z, s)
        parts.append(hexa(f'{name}deck{s}', [P(-rx - 0.01, -0.01, -0.025), P(rx + 0.01, -0.01, -0.025),
                                             P(rx + 0.01, ln, -0.025), P(-rx - 0.01, ln, -0.025),
                                             P(-rx - 0.01, -0.01, 0.0), P(rx + 0.01, -0.01, 0.0),
                                             P(rx + 0.01, ln, 0.0), P(-rx - 0.01, ln, 0.0)], deck_mat))
        step = ln / rows
        w = 2 * rx / segs
        for r in range(rows):
            t0 = r * step - (0.03 if r == 0 else 0.0)
            t1 = min(r * step + step * 1.5, ln + 0.01)
            off = w / 2 if r % 2 else 0.0
            edges = sorted({-rx, rx} | {x for x in (-rx + off + k * w for k in range(segs + 1)) if -rx < x < rx})
            for k, (x0, x1) in enumerate(zip(edges, edges[1:])):
                if x1 - x0 < 0.02:
                    continue
                xa, xb = x0 + 0.004, x1 - 0.004
                th0 = th * rng.uniform(0.85, 1.15)
                dt = rng.uniform(-0.006, 0.006)
                pts = [P(xa, t0 + dt, 0), P(xb, t0 + dt, 0), P(xb, t1, 0), P(xa, t1, 0),
                       P(xa, t0 + dt, th0), P(xb, t0 + dt, th0 * rng.uniform(0.9, 1.1)), P(xb, t1, 0.012),
                       P(xa, t1, 0.012)]
                parts.append(hexa(f'{name}{s}_{r}_{k}', pts, rng.choice(mats), skip_bottom=True))
    zr = ridge_z + 0.005
    pro = [(-ridge_w, zr - 0.025), (0.0, zr + 0.05), (ridge_w, zr - 0.025)]
    parts.append(prism(f'{name}ridge', pro, 'x', -rx - 0.012, rx + 0.012, ridge_mat))
    return parts


def roof_paints(name, stops, z, pattern, seed, wn=0.75, noise=0.08, nscale=10, n=2):
    return [paint(f'{name}{i}', stops, z=z, wz=0.2, wn=wn, noise=noise, nscale=nscale, seed=seed + i, bias=-0.05,
                  pattern=pattern) for i in range(n)]


def hut(M, W, D, base, top, apex, wall, tw=0.034, tz=0.008):
    """Walls (gable ends east and west, ridge along x) with stone base, corner posts and eave / sill beams."""
    parts = [box('base', (0, 0, base / 2), (2 * W + 0.05, 2 * D + 0.05, base), M.stone, skip=('-z',))]
    parts.append(prism('walls', [(-D, base - 0.01), (D, base - 0.01), (D, top), (0.0, apex), (-D, top)], 'x', -W, W,
                       wall))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(box(f'post{sx}{sy}', (sx * (W - tw / 2 + tz), sy * (D - tw / 2 + tz), (base + top) / 2),
                             (tw, tw, top - base), M.timber, skip=('-z',)))
    for sy in (-1, 1):
        parts.append(box(f'eave{sy}', (0, sy * (D + tz / 2 - 0.01), top - 0.02), (2 * W, 0.02 + tz, 0.035), M.timber,
                         skip=('-y',) if sy > 0 else ('+y',)))
        parts.append(box(f'sill{sy}', (0, sy * (D + tz / 2 - 0.01), base + 0.018), (2 * W, 0.02 + tz, 0.03), M.timber,
                         skip=('-y',) if sy > 0 else ('+y',)))
    for sx in (-1, 1):
        parts.append(box(f'geave{sx}', (sx * (W + tz / 2 - 0.01), 0, top - 0.02), (0.02 + tz, 2 * D, 0.035), M.timber,
                         skip=('-x',) if sx > 0 else ('+x',)))
        parts.append(box(f'kpost{sx}', (sx * (W + tz / 2 - 0.01), 0, (top + apex - 0.06) / 2),
                         (0.02 + tz, 0.03, apex - 0.06 - top), M.timber, skip=('-x',) if sx > 0 else ('+x',)))
    return parts


def studs(M, face, side, at, u0, u1, z0, z1, n, brace=True, w=0.022, pr=0.012):
    """Half-timber studs (and diagonal braces) on a wall face. face 'y' (u = x) or 'x' (u = y); side = outward sign."""
    dd = 0.02
    parts = []
    for i in range(n + 1):
        u = u0 + (u1 - u0) * i / n
        o = at + side * (pr - dd / 2)
        if face == 'y':
            parts.append(box(f'st{i}', (u, o, (z0 + z1) / 2), (w, dd, z1 - z0), M.timber,
                             skip=('+y',) if side < 0 else ('-y',)))
        else:
            parts.append(box(f'st{i}', (o, u, (z0 + z1) / 2), (dd, w, z1 - z0), M.timber,
                             skip=('+x',) if side < 0 else ('-x',)))
    if brace:
        for i in range(n):
            a, b = u0 + (u1 - u0) * i / n, u0 + (u1 - u0) * (i + 1) / n
            za, zb = (z0, z1) if i % 2 == 0 else (z1, z0)
            o = at + side * (pr - 0.006)
            if face == 'y':
                parts.append(beam(f'br{i}', (a, o, za), (b, o, zb), 0.014, M.timber))
            else:
                parts.append(beam(f'br{i}', (o, a, za), (o, b, zb), 0.014, M.timber))
    return parts


def tuft(name, c, r, rng, mat, n=3):
    """Low grass / bush tuft: a few jittered octahedra (8 triangles each)."""
    parts = []
    for i in range(n):
        a = rng.uniform(0, 2 * math.pi)
        off = Vector((math.cos(a), math.sin(a), 0)) * r * 0.6 if i else Vector()
        rr = r * (1.0 if i == 0 else rng.uniform(0.65, 0.85))
        parts.append(octa(f'{name}{i}', (c[0] + off.x, c[1] + off.y, rr * 0.7), rr, mat, rng, squash=0.9))
    return parts


def barrel(M, c, r, h, name='barrel'):
    rings = [circle(c, r * 0.88, 0.0, 6), circle(c, r, h * 0.5, 6), circle(c, r * 0.88, h, 6)]
    return [loft(name, rings, M.door), box(name + 'hoop', (c[0], c[1], h * 0.5), (r * 2.12, r * 2.12, 0.012), M.metal)]


def arch_pts(half, z0, z1, rz, segs=4):
    """Door outline (u, z): rectangle from z0 up to z1 with a rounded top of radius `half`, centred on u = 0."""
    pts = [(-half, z0), (half, z0), (half, z1)]
    for i in range(1, segs):
        a = math.pi * i / segs
        pts.append((half * math.cos(a), z1 + half * 0.9 * math.sin(a)))
    pts.append((-half, z1))
    return pts


def sort_ccw(pts):
    return pts


# ---------------------------------------------------------------- house B: long thatched house

def house_b_intact():
    reset()
    M = Mats()
    rng = random.Random(51)
    W, D, base, top, apex = 0.37, 0.225, 0.07, 0.31, 0.56
    thatch_mat = paint('straw', [(0.0, lin(96, 60, 14)), (0.3, lin(158, 108, 28)), (0.65, lin(200, 150, 42)),
                                 (1.0, lin(230, 192, 84))], z=(0.2, 0.68), wz=0.3, wn=0.8, noise=0.3, nscale=6,
                       stretch=(4, 28, 3), seed=9.0, bias=-0.05)
    parts = hut(M, W, D, base, top, apex, M.plaster)
    # studs on the long walls and the gable ends (the thatch hides the upper part)
    parts += studs(M, 'y', -1, -D, -W + 0.05, W - 0.05, base + 0.03, 0.22, 6, brace=False)
    parts += studs(M, 'y', 1, D, -W + 0.05, W - 0.05, base + 0.03, 0.22, 6, brace=False)
    parts += studs(M, 'x', 1, W, -D + 0.05, D - 0.05, base + 0.03, 0.46, 3, brace=False)
    # door in the south gable (west gable before the final rotation), window above, windows on the long sides
    parts += [_wall_box('x-', -W, 0.0, base + 0.125, 0.16, 0.25, 0.03, 0.012, M.timber, 'dframe'),
              _wall_box('x-', -W, 0.0, base + 0.115, 0.125, 0.23, 0.03, 0.02, M.door, 'door'),
              box('knob', (-W - 0.026, 0.045, 0.19), (0.012, 0.012, 0.012), M.metal),
              box('step', (-W - 0.045, 0.0, 0.02), (0.07, 0.17, 0.04), M.stone, skip=('-z',))]
    parts += window('x-', -W, 0.12, 0.4, 0.07, 0.07, M, 'gwin')
    parts += window('x-', -W, -0.12, 0.4, 0.07, 0.07, M, 'gwin2')
    for u in (-0.22, 0.04, 0.24):
        parts += window('y', -D, u, 0.165, 0.11, 0.08, M, f'fw{u}')
    parts += window('y', D, -0.1, 0.165, 0.11, 0.08, M, 'bw') if False else []
    # deep straw thatch, drooping to the eaves
    outer = [(-0.315, 0.235), (-0.34, 0.285), (-0.315, 0.36), (-0.16, 0.51), (0.0, 0.665), (0.16, 0.51),
             (0.315, 0.36), (0.34, 0.285), (0.315, 0.235)]
    inner = [(0.25, 0.31), (0.0, 0.56), (-0.25, 0.31)]
    parts.append(thatch('roof', outer, inner, -0.43, 0.43, thatch_mat, rng, pivot=(0.0, 0.45)))
    # tiers of thatch: darker courses lying on the slopes, like the layered reference
    for i, (y, z) in enumerate(((0.255, 0.405), (0.13, 0.545))):
        for sy in (-1, 1):
            parts.append(beam(f'tier{i}{sy}', (-0.4, sy * y, z), (0.4, sy * y, z), 0.04, M.thatch_old, roll=math.pi / 4))
    # bundles tied over the ridge
    for i, x in enumerate((-0.3, -0.08, 0.14, 0.34)):
        parts.append(box(f'tie{i}', (x, 0, 0.665), (0.018, 0.1, 0.03), M.timber, rot=(0, 0, rng.uniform(-0.1, 0.1))))
    parts += chimney(M, 0.27, 0.1, 0.5, 0.8, w=0.1)
    # bushes, barrel
    for i, (c, r) in enumerate((((-0.47, -0.27), 0.06), ((-0.46, 0.27), 0.055), ((0.43, -0.28), 0.055),
                                ((0.42, 0.27), 0.05), ((0.0, -0.3), 0.04))):
        parts += tuft(f'bush{i}', c, r, rng, M.leaf)
    parts += barrel(M, (-0.38, 0.25), 0.04, 0.09)
    place(parts, math.pi / 2)
    obj = join(parts, 'house_b_intact')
    finish(obj, 'house_b_intact', size=512)


# ---------------------------------------------------------------- house C: town house

def house_c_intact():
    reset()
    M = Mats()
    rng = random.Random(61)
    W, D = 0.29, 0.245
    base, floor1, floor2 = 0.045, 0.30, 0.52
    slate = roof_paints('slate', [(0.0, lin(48, 56, 80)), (0.35, lin(78, 92, 118)), (0.7, lin(106, 122, 150)),
                                  (1.0, lin(140, 156, 182))], (0.5, 0.9), ('stones', 40.0, 0.08, 0.62), 21.0)
    ridge = paint('sridge', [(0.0, lin(52, 60, 84)), (0.6, lin(90, 104, 132)), (1.0, lin(130, 146, 172))], wn=0.8,
                  noise=0.05, bias=-0.05)
    deck = paint('sdeck', [(0.0, lin(34, 38, 54)), (1.0, lin(60, 68, 92))], wn=0.4, noise=0.05, bias=0.3)
    ashlar = paint('ashlar', [(0.0, lin(104, 98, 88)), (0.5, lin(156, 148, 134)), (1.0, lin(196, 188, 172))], z=(0.04, 0.3),
                   wz=0.25, wn=0.45, noise=0.2, nscale=16, seed=22.0, bias=0.05, pattern=('stones', 18.0, 0.07, 0.5))
    pot = flat_mat('pot', lin(190, 96, 58))
    parts = [box('plinth', (0, 0, base / 2), (2 * W + 0.05, 2 * D + 0.05, base), M.stone, skip=('-z',)),
             box('ground', (0, 0, (base + floor1) / 2), (2 * W, 2 * D, floor1 - base), ashlar, skip=('-z',))]
    # upper floor sticks out a little (jetty): plaster gable walls, timber frame
    u = 0.018
    parts.append(prism('upper', [(-D - u, floor1), (D + u, floor1), (D + u, floor2), (0.0, 0.8), (-D - u, floor2)], 'x',
                       -W - u, W + u, M.plaster))
    parts.append(box('jetty_f', (0, 0, floor1 + 0.01), (2 * W + 2 * u + 0.012, 2 * D + 2 * u + 0.012, 0.03), M.timber,
                     skip=('-z',)))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(box(f'cpost{sx}{sy}', (sx * (W + u - 0.014), sy * (D + u - 0.014), (floor1 + floor2) / 2),
                             (0.034, 0.034, floor2 - floor1), M.timber, skip=('-z',)))
    for sy in (-1, 1):
        parts.append(box(f'ueave{sy}', (0, sy * (D + u), floor2 - 0.015), (2 * W + 0.04, 0.03, 0.03), M.timber))
    # studs on the upper long walls
    parts += studs(M, 'y', -1, -D - u, -W + 0.04, W - 0.04, floor1 + 0.02, floor2 - 0.03, 4)
    parts += studs(M, 'y', 1, D + u, -W + 0.04, W - 0.04, floor1 + 0.02, floor2 - 0.03, 4)
    parts += studs(M, 'x', 1, W + u, -D + 0.04, D - 0.04, floor1 + 0.02, floor2 - 0.03, 2, brace=False)
    for x in (-0.12, 0.12):
        parts += window('y', -D - u, x, 0.41, 0.075, 0.1, M, f'uw{x}')
    parts += window('y', -D, 0.13, 0.19, 0.09, 0.09, M, 'gw1')
    parts += window('y', -D, -0.1, 0.19, 0.09, 0.09, M, 'gw2')
    # arched door in the south gable wall (west end before rotation) with stone surround, steps
    door = arch_pts(0.062, base, 0.2, 0.06)
    parts.append(prism('dsurround', [(a * 1.28, z + (0.018 if z > base else -0.0)) for a, z in door], 'x', -W - 0.014,
                       -W + 0.01, M.chimney))
    parts.append(prism('door', door, 'x', -W - 0.022, -W + 0.01, M.door))
    parts += [box('step', (-W - 0.06, 0.0, 0.02), (0.1, 0.2, 0.04), M.stone, skip=('-z',)),
              box('doorknob', (-W - 0.026, 0.035, 0.12), (0.012, 0.012, 0.012), M.metal)]
    parts += window('x-', -W, 0.19, 0.17, 0.05, 0.07, M, 'sw1') + window('x-', -W, -0.19, 0.17, 0.05, 0.07, M, 'sw2')
    # oriel bay on the upper front
    ox = -W - u - 0.04
    parts.append(box('oriel', (ox, 0, 0.405), (0.09, 0.2, 0.17), M.plaster, skip=('+x',)))
    parts.append(box('oriel_sill', (ox - 0.004, 0, 0.312), (0.1, 0.21, 0.025), M.timber))
    for i, dy in enumerate((-0.12, 0.12)):
        parts.append(beam(f'corbel{i}', (-W - u + 0.0, dy, 0.31), (ox - 0.02, dy, 0.26), 0.02, M.timber))
    parts += window('x-', ox - 0.045 + 0.045 + 0.0, 0.0, 0.41, 0.12, 0.1, M, 'ow') if False else []
    parts += [box('oglass', (ox - 0.047, 0, 0.41), (0.012, 0.15, 0.1), M.glow),
              box('omid', (ox - 0.055, 0, 0.41), (0.008, 0.012, 0.11), M.timber),
              box('ofr', (ox - 0.052, 0, 0.41), (0.008, 0.17, 0.014), M.timber)]
    pyr = [[(ox - 0.065, -0.13, 0.49), (ox + 0.045, -0.13, 0.49), (ox + 0.045, 0.13, 0.49), (ox - 0.065, 0.13, 0.49)],
           [(ox - 0.01, 0.0, 0.62)]]
    parts.append(loft('oroof', pyr, slate[0], cap=False))
    # slate roof (ridge along x, steep)
    parts += shingle_roof('rf', slate, ridge, deck, W + 0.05, D + 0.07, 0.505, 0.9, 6, 3, 0.04, rng)
    parts += chimney(M, 0.12, 0.11, 0.6, 0.98, w=0.09)
    for i, (px, py) in enumerate(((0.095, 0.11), (0.145, 0.11))):
        parts.append(box(f'pot{i}', (px, py, 1.02), (0.032, 0.032, 0.045), pot, skip=('-z',)))
    for i, (c, r) in enumerate((((-0.37, -0.28), 0.05), ((-0.36, 0.27), 0.05), ((0.33, -0.29), 0.045),
                                ((0.34, 0.28), 0.045))):
        parts += tuft(f'bush{i}', c, r, rng, M.leaf)
    place(parts, math.pi / 2)
    obj = join(parts, 'house_c_intact')
    finish(obj, 'house_c_intact', size=512)


# ---------------------------------------------------------------- house D: cabin

def house_d_intact():
    reset()
    M = Mats()
    rng = random.Random(71)
    W, D, base, top, apex = 0.31, 0.22, 0.05, 0.31, 0.5
    moss = roof_paints('moss', [(0.0, lin(52, 56, 24)), (0.3, lin(80, 90, 32)), (0.65, lin(112, 124, 44)),
                                (1.0, lin(150, 156, 74))], (0.3, 0.7), ('stones', 26.0, 0.1, 0.62), 31.0, noise=0.3,
                       nscale=7, n=3)
    ridge = paint('mridge', [(0.0, lin(70, 56, 30)), (0.6, lin(112, 92, 44)), (1.0, lin(150, 130, 70))], wn=0.8,
                  noise=0.12, bias=-0.05)
    deck = paint('mdeck', [(0.0, lin(48, 34, 20)), (1.0, lin(86, 62, 36))], wn=0.4, noise=0.05, bias=0.3)
    wood_end = flat_mat('wood_end', lin(222, 180, 118))
    log = paint('log', [(0.0, lin(70, 44, 26)), (0.6, lin(112, 74, 42)), (1.0, lin(150, 104, 60))], wn=0.5, noise=0.12,
                nscale=14, seed=33.0, bias=0.1)
    parts = hut(M, W, D, base, top, apex, M.planks)
    # roof: deep overhang
    parts += shingle_roof('rf', moss, ridge, deck, W + 0.07, D + 0.095, 0.3, 0.6, 5, 3, 0.04, rng, ridge_w=0.07)
    parts += chimney(M, 0.13, 0.1, 0.5, 0.78, w=0.09)
    # door and window on the south wall, shutters
    parts += [_wall_box('y', -D, -0.12, base + 0.115, 0.16, 0.23, 0.03, 0.012, M.timber, 'dframe'),
              _wall_box('y', -D, -0.12, base + 0.105, 0.125, 0.21, 0.03, 0.02, M.door, 'door'),
              box('knob', (-0.075, -D - 0.026, 0.14), (0.012, 0.012, 0.012), M.metal),
              box('step', (-0.12, -D - 0.05, 0.02), (0.15, 0.07, 0.04), M.stone, skip=('-z',))]
    parts += window('y', -D, 0.12, 0.2, 0.1, 0.1, M, 'fwin')
    for sgn in (-1, 1):
        parts.append(_wall_box('y', -D, 0.12 + sgn * 0.085, 0.2, 0.045, 0.12, 0.03, 0.02, M.door, f'shut{sgn}'))
    parts += window('x-', -W, 0.0, 0.2, 0.08, 0.08, M, 'gwin')
    # log pile on the east side: log ends face south
    rows = ((5, 0.0), (4, 0.5), (3, 1.0), (2, 1.5))
    lr = 0.034
    px = W + 0.07
    for ri, (cnt, shift) in enumerate(rows):
        for k in range(cnt):
            yy = 0.0 if False else 0.0
            cx = px + (k - (cnt - 1) / 2) * lr * 2.0 * 0.0
            # logs run along y; stacked in x (width) and z (height)
            x = px + (k - (cnt - 1) / 2) * lr * 2.0
            z = lr + ri * lr * 1.75
            ring0 = [(x + math.cos(2 * math.pi * i / 6 + 0.3) * lr, -0.17, z + math.sin(2 * math.pi * i / 6 + 0.3) * lr)
                     for i in range(6)]
            ring1 = [(p[0], 0.17 + rng.uniform(-0.01, 0.01), p[2]) for p in ring0]
            parts.append(loft(f'log{ri}_{k}', [ring0, ring1], log))
            parts.append(loft(f'logend{ri}_{k}', [[(p[0], -0.171, p[2]) for p in ring0],
                                                  [(x, -0.172, z)]], wood_end, cap=False))
    for i, (c, r) in enumerate((((-0.34, -0.27), 0.05), ((-0.34, 0.26), 0.05), ((0.25, -0.29), 0.045),
                                ((0.14, 0.27), 0.045))):
        parts += tuft(f'bush{i}', c, r, rng, M.leaf)
    place(parts, 0.0, (-0.06, 0.0, 0.0))
    obj = join(parts, 'house_d_intact')
    finish(obj, 'house_d_intact', size=512)


# ---------------------------------------------------------------- lodge

LW, LD = 0.40, 0.25          # main block half sizes (like house_razed's footprint, slightly wider)
LTOP = 0.4
WING_X, WING_Y = -0.1, -0.14  # wing centre
WING_L, WING_D = 0.19, 0.17   # half length (north-south) and half width (east-west)


class LodgeMats(Mats):
    def __init__(self):
        super().__init__()
        self.teal = roof_paints('teal', [(0.0, lin(12, 64, 70)), (0.3, lin(22, 104, 104)), (0.65, lin(38, 146, 134)),
                                         (1.0, lin(94, 196, 172))], (0.4, 0.85), ('stones', 36.0, 0.08, 0.62), 41.0,
                                n=3)
        self.teal_ridge = paint('tridge', [(0.0, lin(20, 82, 84)), (0.6, lin(44, 130, 120)), (1.0, lin(98, 182, 160))],
                                wn=0.8, noise=0.05, bias=-0.05)
        self.teal_deck = paint('tdeck', [(0.0, lin(18, 40, 44)), (1.0, lin(34, 74, 78))], wn=0.4, noise=0.05,
                               bias=0.3)
        self.warm = paint('warm', [(0.0, lin(150, 124, 92)), (0.35, lin(206, 180, 140)), (0.7, lin(226, 204, 166)),
                                   (1.0, lin(238, 220, 186))], z=(0.1, 0.25), wz=0.4, wn=0.3, noise=0.1, nscale=9,
                          seed=45.0, bias=0.1)
        self.cream = paint('cream', [(0.0, lin(196, 186, 160)), (0.5, lin(232, 224, 200)), (1.0, lin(248, 244, 228))],
                           wn=0.4, noise=0.06, nscale=12, seed=43.0, bias=0.25)
        self.pot = flat_mat('pot', lin(190, 96, 58))
        self.dim = paint('dim', [(0.0, lin(110, 70, 30)), (1.0, lin(170, 112, 50))], wn=0.5, noise=0.06, bias=0.2)
        self.sign = paint('sign', [(0.0, lin(84, 52, 28)), (0.6, lin(124, 80, 42)), (1.0, lin(160, 110, 60))], wn=0.5,
                          noise=0.1, nscale=14, stretch=(1, 1, 6), seed=44.0, bias=0.2)
        self.gold = flat_mat('gold', lin(214, 170, 70))
        self.teal_shard = flat_mat('teal_shard', lin(36, 120, 112))


def lodge_wing_parts(M, state):
    """Front gable wing, local frame (ridge along x, front = west end); placed afterwards."""
    L, Dw = WING_L, WING_D
    base, top, apex = 0.1, LTOP, 0.7
    parts = [box('wbase', (0, 0, base / 2), (2 * L + 0.05, 2 * Dw + 0.05, base), M.stone, skip=('-z',)),
             prism('wwalls', [(-Dw, base - 0.01), (Dw, base - 0.01), (Dw, top), (0.0, apex), (-Dw, top)], 'x', -L, L,
                   M.warm)]
    tw, tz = 0.034, 0.008
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(box(f'wpost{sx}{sy}', (sx * (L - tw / 2 + tz), sy * (Dw - tw / 2 + tz), (base + top) / 2),
                             (tw, tw, top - base), M.timber, skip=('-z',)))
    parts.append(box('wgeave', (-L - tz / 2 + 0.01, 0, top - 0.02), (0.02 + tz, 2 * Dw, 0.035), M.timber,
                     skip=('+x',)))
    parts.append(box('wkpost', (-L - tz / 2 + 0.01, 0, (top + apex - 0.06) / 2), (0.02 + tz, 0.03, apex - 0.06 - top),
                     M.timber, skip=('+x',)))
    # diagonal struts in the gable, like the reference
    parts.append(beam('wstrutL', (-L - 0.004, -Dw + 0.02, top + 0.01), (-L - 0.004, -0.03, apex - 0.1), 0.02, M.timber))
    parts.append(beam('wstrutR', (-L - 0.004, Dw - 0.02, top + 0.01), (-L - 0.004, 0.03, apex - 0.1), 0.02, M.timber))
    parts.append(box('wstep', (-L - 0.045, 0.0, 0.02), (0.08, 0.2, 0.04), M.stone, skip=('-z',)))
    parts.append(box('wstep2', (-L - 0.085, 0.0, 0.012), (0.06, 0.24, 0.024), M.stone, skip=('-z',)))
    door = arch_pts(0.07, base, 0.27, 0.07)
    parts.append(prism('arch', [(a * 1.3, z + (0.02 if z > base else 0.0)) for a, z in door], 'x', -L - 0.016,
                       -L + 0.012, M.chimney))
    if state == 'visited':
        parts.append(prism('doorway', door, 'x', -L - 0.026, -L + 0.012, M.glow))
        # leaf ajar: hinged on the north-side jamb (+u), swung outwards by 40 degrees
        th = math.radians(78)
        hx, hy = -L - 0.02, 0.07
        leaf = box('leaf', (0, 0, 0), (0.14, 0.018, 0.26), M.door)
        for v in leaf.data.vertices:
            p = Vector((v.co.x - 0.07, v.co.y, v.co.z))
            # leaf along local -y from the hinge; rotate outwards (towards -x)
            ang = -(math.pi / 2 - th)
            c, s = math.cos(ang), math.sin(ang)
            q = Vector((p.x * 0, 0, 0))
            lx, ly = p.x, p.y   # lx along the leaf width, ly thickness
            # leaf direction vector d = (-sin(th), -cos(th)) in (x, y)
            dx, dy = -math.sin(th), -math.cos(th)
            nx, ny = -dy, dx
            u = lx + 0.07
            v.co = Vector((hx + dx * u + nx * ly, hy + dy * u + ny * ly, base + 0.003 + v.co.z + 0.13))
        parts.append(leaf)
        parts.append(box('spill', (-L - 0.09, 0.0, 0.049), (0.1, 0.13, 0.004), M.glow))
    else:
        parts.append(prism('door', door, 'x', -L - 0.022, -L + 0.012, M.door))
        parts.append(box('knob', (-L - 0.03, 0.045, 0.19), (0.012, 0.012, 0.012), M.metal))
    # banner above the door on a rod
    parts.append(box('rod', (-L - 0.036, 0, 0.592), (0.016, 0.15, 0.016), M.timber))
    if state == 'visited':
        parts.append(box('furl', (-L - 0.04, 0, 0.58), (0.022, 0.13, 0.022), M.cream))
    else:
        flag = [(-0.058, 0.585), (0.058, 0.585), (0.058, 0.4), (0.0, 0.43), (-0.058, 0.4)]
        trim = [(a * 1.18, z + (0.014 if z > 0.5 else -0.012 if a else -0.02)) for a, z in flag]
        parts.append(prism('banner_t', trim, 'x', -L - 0.03, -L - 0.02, M.timber))
        parts.append(prism('banner', flag, 'x', -L - 0.038, -L - 0.028, M.cream))
        parts.append(prism('banner_m', [(-0.014, 0.55), (0.014, 0.55), (0.014, 0.5), (-0.014, 0.5)], 'x', -L - 0.042,
                           -L - 0.036, M.gold))
    # lantern on a bracket east of the door
    lamp = M.dim if state == 'visited' else M.glow
    parts.append(box('lbracket', (-L - 0.04, -0.125, 0.33), (0.07, 0.014, 0.014), M.metal))
    parts.append(box('lantern', (-L - 0.065, -0.125, 0.285), (0.05, 0.05, 0.07), lamp))
    parts.append(box('lcap', (-L - 0.065, -0.125, 0.325), (0.062, 0.062, 0.018), M.metal))
    parts.append(box('lfoot', (-L - 0.065, -0.125, 0.245), (0.056, 0.056, 0.012), M.metal))
    parts += window('y', -Dw, 0.0, 0.25, 0.1, 0.1, M, 'wwin') if False else []
    return parts


def lodge_build(state):
    reset()
    M = LodgeMats()
    rng = random.Random(81)
    base = 0.1
    top, apex = LTOP, 0.78
    parts = hut(M, LW, LD, base, top, apex, M.warm)
    # stone ground course of the main block is the base; timber studs on the front and back
    parts += studs(M, 'y', 1, LD, -LW + 0.05, LW - 0.05, base + 0.03, top - 0.04, 3, brace=False)
    parts += studs(M, 'x', 1, LW, -LD + 0.05, LD - 0.05, base + 0.03, top - 0.04, 2, brace=False)
    parts += studs(M, 'x', -1, -LW, -LD + 0.05, LD - 0.05, base + 0.03, top - 0.04, 2, brace=False)
    # front window pair east of the wing, shutters
    for x in (0.2, 0.35):
        parts += window('y', -LD, x, 0.24, 0.1, 0.11, M, f'fw{x}')
        for sgn in (-1, 1):
            parts.append(_wall_box('y', -LD, x + sgn * 0.07, 0.24, 0.03, 0.13, 0.03, 0.02, M.door, f'sh{x}{sgn}'))
    parts += studs(M, 'y', -1, -LD, 0.07, LW - 0.03, base + 0.03, top - 0.04, 3, brace=False)
    parts += window('x+', LW, 0.0, 0.24, 0.09, 0.1, M, 'ew', bars=False)
    parts += window('x-', -LW, 0.0, 0.24, 0.09, 0.1, M, 'ww', bars=False)
    # roofs: main (ridge along x) and the wing's, plus a dormer
    parts += shingle_roof('rm', M.teal, M.teal_ridge, M.teal_deck, LW + 0.055, LD + 0.075, 0.375, 0.84, 4, 2, 0.04,
                          rng, ridge_w=0.08)
    parts += chimney(M, 0.3, 0.1, 0.62, 1.04, w=0.1)
    for i, px in enumerate((0.275, 0.325)):
        parts.append(box(f'pot{i}', (px, 0.1, 1.085), (0.034, 0.034, 0.05), M.pot, skip=('-z',)))
    # dormer on the south slope, east of the wing: walls + roof (ridge along x, rotated to face south)
    dm = [box('dwall', (0.0, 0.0, 0.0), (0.0001, 0.0001, 0.0001), M.plaster)]
    dm = [prism('dwalls', [(-0.065, 0.46), (0.065, 0.46), (0.065, 0.62), (0.0, 0.7), (-0.065, 0.62)], 'x', -0.12, 0.1,
                M.plaster)]
    dm += [box('dframe_t', (-0.121, 0.0, 0.625), (0.014, 0.15, 0.022), M.timber)]
    dm += window('x-', -0.12, 0.0, 0.55, 0.07, 0.09, M, 'dwin', bars=False)
    dm += shingle_roof('rd', M.teal, M.teal_ridge, M.teal_deck, 0.14, 0.095, 0.605, 0.745, 2, 2, 0.03, rng, ridge_w=0.05)
    place(dm, math.pi / 2, (0.24, -0.13 + 0.06, 0.0))
    parts += dm
    # wing, door, banner, lantern
    wing = lodge_wing_parts(M, state)
    wing += shingle_roof('rw', M.teal, M.teal_ridge, M.teal_deck, WING_L + 0.05, WING_D + 0.07, 0.375, 0.74, 4, 2,
                         0.04, rng, ridge_w=0.075)
    place(wing, math.pi / 2, (WING_X, WING_Y, 0.0))
    parts += wing
    # hanging sign on an arm off the west side of the wing
    sx0, sy = WING_X - WING_D, WING_Y - 0.1
    parts.append(box('arm', (sx0 - 0.08, sy, 0.41), (0.17, 0.018, 0.018), M.timber))
    parts.append(beam('armbrace', (sx0, sy, 0.33), (sx0 - 0.11, sy, 0.405), 0.016, M.timber))
    parts.append(box('chain', (sx0 - 0.085, sy, 0.375), (0.12, 0.006, 0.05), M.metal, skip=('-z', '+z')))
    parts.append(box('board', (sx0 - 0.085, sy, 0.3), (0.13, 0.016, 0.115), M.sign))
    parts.append(box('crest', (sx0 - 0.085, sy - 0.01, 0.3), (0.07, 0.006, 0.065), M.gold))
    # barrels, bushes
    parts += barrel(M, (0.43, -0.3), 0.04, 0.09)
    
    for i, (c, r) in enumerate((((-0.46, -0.2), 0.055), ((-0.44, 0.27), 0.05), ((0.46, 0.26), 0.05),
                                ((-0.22, -0.4), 0.04))):
        parts += tuft(f'bush{i}', c, r, rng, M.leaf, n=2)
    if state == 'visited':
        for sgn in (-1, 1):
            pass
        parts.append(box('fbox', (0.275, -LD - 0.03, 0.17), (0.2, 0.045, 0.035), M.door))
        for k in range(6):
            x = 0.2 + k * 0.03
            parts.append(octa(f'leaf{k}', (x, -LD - 0.03, 0.195), 0.02, M.leaf, rng, squash=0.7))
            parts.append(octa(f'fl{k}', (x + 0.005, -LD - 0.042, 0.208), 0.011, M.flower_w if k % 2 else M.flower_r,
                              rng))
    return parts


def lodge(state):
    parts = lodge_build(state)
    obj = join(parts, f'lodge_{state}')
    finish(obj, f'lodge_{state}', size=512)


def lodge_intact():
    lodge('intact')


def lodge_visited():
    lodge('visited')


def lodge_razed():
    reset()
    M = LodgeMats()
    rng = random.Random(91)
    t = 0.045
    W, D = LW, LD
    wall = paint('masonry', [(0.0, lin(150, 136, 114)), (0.3, lin(184, 172, 150)), (0.55, lin(128, 114, 98)),
                             (0.8, lin(60, 52, 46)), (1.0, lin(30, 26, 24))], z=(0.07, 0.46), wz=0.8, wn=0.2,
                 noise=0.22, nscale=9, seed=14.0, bias=0.0, pattern=('stones', 12.0, 0.1, 0.42))
    heap_mat = paint('heap', [(0.0, lin(48, 42, 38)), (0.3, lin(92, 84, 76)), (0.48, lin(136, 126, 114)),
                              (0.56, lin(36, 112, 108)), (0.64, lin(40, 132, 120)), (0.72, lin(128, 118, 106)),
                              (1.0, lin(176, 166, 152))],
                     wn=0.5, noise=0.5, nscale=22, seed=17.0, bias=-0.05, pattern=('stones', 30.0, 0.12, 0.5))
    block = paint('block', [(0.0, lin(96, 86, 74)), (0.5, lin(146, 134, 116)), (1.0, lin(188, 176, 156))], wn=0.6,
                  noise=0.15, nscale=20, seed=18.0, bias=-0.05)
    scorched = paint('scorch', [(0.0, lin(60, 48, 38)), (0.5, lin(120, 108, 90)), (1.0, lin(176, 168, 148))], wn=0.4,
                     noise=0.3, nscale=10, seed=19.0, bias=0.0)
    parts = [box('base', (0, 0, BASE_Z / 2), (2 * W + 0.05, 2 * D + 0.05, BASE_Z), M.stone, skip=('-z',)),
             box('debris', (0, 0, BASE_Z + 0.02), (2 * W - 0.06, 2 * D - 0.06, 0.05), M.ash, skip=('-z',))]
    # main block: front wall in two pieces (the wing stands in front of the middle), back, gables
    parts.append(razed_wall('wf1', 'y-', -D, -W, -0.27, [(-0.37, 0.33), (-0.3, 0.38), (-0.27, 0.26)], wall, rng))
    parts.append(razed_wall('wf2', 'y-', -D, 0.07, W, [(0.15, 0.2), (0.22, 0.12), (0.3, 0.3), (0.35, 0.4), (W, 0.34)],
                            wall, rng))
    parts.append(razed_wall('wb', 'y+', D, -W, W, [(-0.3, 0.34), (-0.18, 0.43), (-0.08, 0.36), (0.0, 0.22),
                                                    (0.08, 0.28), (0.18, 0.4), (0.3, 0.46), (W, 0.37)], wall, rng))
    parts.append(razed_wall('ww', 'x-', -W, -D, D, [(-0.17, 0.35), (-0.1, 0.4), (0.05, 0.17), (0.09, 0.3),
                                                     (0.14, 0.46), (0.2, 0.42), (D, 0.37)], wall, rng))
    parts.append(razed_wall('we', 'x+', W, -D, D, [(-0.17, 0.3), (-0.07, 0.2), (0.05, 0.14), (0.14, 0.24),
                                                    (D, 0.36)], wall, rng))
    # the wing stub: front wall with the arched doorway (jambs of unequal height), side stubs
    wy = WING_Y - WING_L  # world y of the wing front
    parts.append(razed_wall('wgl', 'y-', wy, WING_X - WING_D, WING_X - 0.075, [(WING_X - 0.1, 0.4),
                                                                              (WING_X - 0.075, 0.3)], wall, rng))
    parts.append(razed_wall('wgr', 'y-', wy, WING_X + 0.075, WING_X + WING_D, [(WING_X + 0.11, 0.16),
                                                                               (WING_X + WING_D, 0.24)], wall, rng))
    parts.append(razed_wall('wsw', 'x-', WING_X - WING_D, wy, -D, [(wy + 0.04, 0.3), (-D, 0.2)], wall, rng))
    parts.append(razed_wall('wse', 'x+', WING_X + WING_D, wy, -D, [(wy + 0.05, 0.14), (-D, 0.1)], wall, rng))
    # arch stones standing on the west jamb
    for i, (dx, z, s) in enumerate(((-0.075, 0.36, 0.05), (-0.055, 0.405, 0.045))):
        parts.append(box(f'arch{i}', (WING_X + dx, wy + 0.02, z), (s, 0.05, 0.04), M.chimney, rot=(0, 0.1, 0.12)))
    parts += edge_stones('esf', 'y-', -D, [(-0.37, 0.4), (-0.28, 0.28), (0.24, 0.13), (0.34, 0.37)], block, rng)
    parts += edge_stones('esb', 'y+', D, [(-0.22, 0.44), (0.03, 0.24), (0.22, 0.46)], block, rng)
    parts += edge_stones('esw', 'x-', -W, [(-0.12, 0.42), (0.0, 0.18), (0.12, 0.47)], block, rng)
    parts += window('x+', W, 0.0, 0.22, 0.09, 0.1, M, 'ewin', glass=M.soot, frame=M.char)
    # charred posts
    for i, (x, y, h) in enumerate(((-W - 0.004, -D - 0.004, 0.43), (W + 0.004, -D - 0.004, 0.3),
                                   (-W - 0.004, D + 0.004, 0.46), (W + 0.004, D + 0.004, 0.4))):
        parts.append(box(f'post{i}', (x, y, (BASE_Z + h) / 2), (0.036, 0.036, h - BASE_Z), M.char, skip=('-z',),
                         rot=(0, 0, rng.uniform(-0.1, 0.1))))
    # collapsed roof beams
    for i, (a, b, w) in enumerate((((-0.36, -0.2, 0.12), (0.12, 0.24, 0.47), 0.045),
                                   ((0.38, -0.16, 0.1), (-0.14, 0.25, 0.45), 0.045),
                                   ((-0.4, 0.12, 0.4), (0.4, -0.1, 0.17), 0.042),
                                   ((-0.2, -0.22, 0.12), (0.1, 0.18, 0.44), 0.04),
                                   ((0.06, -0.2, 0.12), (0.36, 0.18, 0.46), 0.04),
                                   ((-0.42, -0.04, 0.36), (0.42, 0.06, 0.3), 0.045),
                                   ((WING_X - 0.1, wy + 0.03, 0.1), (WING_X + 0.06, -0.12, 0.34), 0.04))):
        parts.append(beam(f'beam{i}', a, b, w, M.char, roll=rng.uniform(0, 1)))
    # the sign lying burnt on the ground in front of the wing, the arm stub, a banner scrap
    sx0 = WING_X - WING_D
    parts.append(box('sign_fallen', (sx0 - 0.08, wy - 0.07, 0.025), (0.1, 0.1, 0.014), M.char,
                     rot=(0.1, 0.05, 0.4)))
    parts.append(box('sign_crest', (sx0 - 0.08, wy - 0.07, 0.035), (0.05, 0.05, 0.005), scorched, rot=(0.1, 0.05, 0.4)))
    parts.append(box('arm_stub', (sx0 - 0.03, wy + 0.04, 0.3), (0.1, 0.016, 0.016), M.char))
    parts.append(box('banner_scrap', (WING_X + 0.02, wy - 0.06, 0.012), (0.09, 0.07, 0.006), scorched,
                     rot=(0, 0, 0.5)))
    # rubble heaps with teal tile shards
    heaps = ((0.0, 0.0, 0.26, 0.17, 0.2), (-0.3, -0.33, 0.14, 0.07, 0.1), (0.3, -0.31, 0.16, 0.08, 0.12),
             (0.43, -0.06, 0.07, 0.2, 0.11), (-0.43, 0.14, 0.07, 0.18, 0.09), (0.26, 0.33, 0.14, 0.07, 0.08),
             (WING_X, wy - 0.02, 0.1, 0.07, 0.08))
    for i, (x, y, rx, ry, h) in enumerate(heaps):
        z0 = BASE_Z + 0.03 if abs(x) < W and abs(y) < D else 0.0
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
        for v in bm.verts:
            d = 1.0 + rng.uniform(-0.22, 0.22)
            v.co = Vector((x + v.co.x * rx * d, y + v.co.y * ry * d, max(z0 + v.co.z * h * d, z0)))
        parts.append(with_mat(mesh_object(f'heap{i}', bm), heap_mat))

    def surface(x, y):
        inside = abs(x) < W - 0.02 and abs(y) < D - 0.02
        z = BASE_Z + 0.045 if inside else 0.0
        for hx, hy, rx, ry, h in heaps:
            q = 1 - ((x - hx) / rx) ** 2 - ((y - hy) / ry) ** 2
            if q > 0:
                z0 = BASE_Z + 0.03 if abs(hx) < W and abs(hy) < D else 0.0
                z = max(z, z0 + h * math.sqrt(q) * 1.05)
        return z

    def on_heaps(n):
        pts = []
        while len(pts) < n:
            hx, hy, rx, ry, h = (rng.choices(heaps, weights=[hp[2] * hp[3] for hp in heaps])[0] if rng.random() < 0.85
                                 else (0, 0, 0.45, 0.36, 0))
            a, r = rng.uniform(0, 2 * math.pi), math.sqrt(rng.random())
            x, y = hx + math.cos(a) * rx * r, hy + math.sin(a) * ry * r
            if abs(x) > 0.47 or abs(y) > 0.4:
                continue
            if W - 0.06 < abs(x) < W + 0.03 and abs(y) < D + 0.02 or D - 0.06 < abs(y) < D + 0.03 and abs(x) < W + 0.02:
                continue
            pts.append((x, y, surface(x, y)))
        return pts
    for i, (x, y, z) in enumerate(on_heaps(30)):
        parts.append(box(f'rt{i}', (x, y, z + 0.006), (rng.uniform(0.055, 0.075), rng.uniform(0.04, 0.055), 0.02),
                         rng.choice(M.teal), rot=(rng.uniform(-0.7, 0.7), rng.uniform(-0.7, 0.7),
                                                  rng.uniform(0, math.pi)), skip=('-z',)))
    for i, (x, y, z) in enumerate(on_heaps(14)):
        r = rng.uniform(0.025, 0.045)
        parts.append(octa(f'st{i}', (x, y, z + r * 0.3), r, M.rubble, rng, squash=0.75))
    obj = join(parts, 'lodge_razed')
    for v in obj.data.vertices:
        v.co.z = max(v.co.z, 0.0)
    finish(obj, 'lodge_razed', size=512)


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    for fn in (house_b_intact, house_c_intact, house_d_intact, lodge_intact, lodge_visited, lodge_razed):
        if not only or fn.__name__ in only:
            fn()
