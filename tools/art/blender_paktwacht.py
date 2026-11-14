"""Hollow Crown – the Paktwacht in the mountain flank (art direction §7, reference art/mockups/paktwacht-berg/).

    "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup -P tools/art/blender_paktwacht.py -- [--preview <absolute dir>] [--tier 0123]

Writes art/models/castle/paktwacht.glb (copied to public/assets/models/castle/ by `pnpm art:build`, loaded on demand), quantized
and meshopt-compressed by gltfpack (devDependency); with --preview also one render per tier.

Rock behind and on both sides, an upper ledge (keep, memorial hall, academy, rune tower, vault door), a walled courtyard with
the rooms, terraces, river and mill in front. Primitives and room models come from blender_castle.py.
World: +X right, +Y into the mountain, +Z up. The camera looks from the south and only pans a little, so backs are not modelled.

Part names: `<group>_<tag>`; tag `a` = always, else the digits of the levels it shows at.
- `shell` (rock-side architecture) and `land` (ground, terraces, farms): castle tier 0-3, derived in the game from the sum of
  the room upgrades (0 ruin, 1 secured, 2 fortified, 3 fortress)
- rooms (`smith`, `tavern`, ...) and keepsakes: room level 1-3, models from blender_castle.py, placed here by LAYOUT and baked
The game (src/render/home/castle.ts) only switches parts. 1 Blender unit = 1 world unit of the scene.
"""
import math
import os
import random
import shutil
import subprocess
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blender_castle as bc  # noqa: E402
from blender_castle import (KEEPSAKES, PARTS, ROOMS, Lv, arch_pts, banner, blob, box, bush, cone_roof, crown_relief, cyl, cypress, door, dragon_relief, fence, gable,  # noqa: E402
                            ivy, lantern_post, lantern_wall, mat4, merlons, part, pennant, poly, rgb, round_tower, rubble, scaffold, tree, wall_segment, window)

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'art', 'models', 'castle', 'paktwacht.glb')
GLTFPACK = os.path.join(ROOT, 'node_modules', '.bin', 'gltfpack.cmd' if os.name == 'nt' else 'gltfpack')
ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = ARGV[ARGV.index('--preview') + 1] if '--preview' in ARGV else None
TIERS = [int(c) for c in ARGV[ARGV.index('--tier') + 1]] if '--tier' in ARGV else [0, 1, 2, 3]

bc.PAL.update({
    'cliff': '#8f8074', 'cliff2': '#7c6e64', 'cliff3': '#a39485', 'cliff_dark': '#5a4f47', 'cliff_warm': '#a18a72',
    'water': '#3f97a0', 'water2': '#5fb4b2', 'wheat': '#ecc048', 'wheat2': '#cfa030', 'wheat3': '#f8da6a', 'road': '#c9a06c',
    'meadow': '#8fa644', 'meadow2': '#b0b954', 'meadow3': '#7a9340', 'wild': '#6d8a3c',
    'leaf': '#6f9a36', 'leaf2': '#8fb040', 'leaf_dark': '#547f2c',
})


def sm(a, b, t):
    t = max(0.0, min(1.0, (t - a) / (b - a)))
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


# ------------------------------------------------------------------------------------------------ layout

COURT = (0.0, 5.5, 15.5, 6.8)  # cx, cy, rx, ry of the walled courtyard
COURT_Z = 6.0  # front of the yard; the yard rises towards the back so the camera sees into it
COURT_RISE = 0.16
LEDGE = (-1.0, 18.5, 15.5, 5.2)  # upper ledge
LEDGE_Z = 13.5
RIVER = [(-34, -33), (-18, -34.5), (-8, -33.8), (2, -35.2), (12, -34.2), (22, -36.5), (36, -35.5)]
ROAD = [(0, -1.4), (0.2, -3.5), (-0.8, -6.5), (0.6, -9.8), (3.6, -12.5), (4.2, -16), (2.6, -19.5), (0.4, -23), (0.6, -27), (2.6, -31), (2.6, -38), (3.4, -52)]
PASS = [(13.0, 20.5), (16.5, 22.5), (18.5, 26.0), (17.0, 30.0), (19.5, 35.0)]  # the Wachpass road, up the gap on the right
PASS_Z = [LEDGE_Z, LEDGE_Z + 1.2, LEDGE_Z + 3.5, LEDGE_Z + 7, LEDGE_Z + 12]
ROOM_S = 1.7
# [ASSUMPTION] keepsakes stand bigger than their true size (story 10.14): at 1 : 1 they are a dozen pixels on the reference
# phone and a mourned one cannot be told from a standing one. 1.35 x keeps them smaller than a door and makes them read.
KEEP_S = ROOM_S * 1.35


def court_z(y):
    return COURT_Z + COURT_RISE * (y + 1)


def on_yard(y):
    # rooms sit flush at their front edge, their back sinks into the rising yard
    return court_z(y - 1.5)


LAYOUT = {  # x, y, z, yaw (counter-clockwise), scale
    'smith': (-10.8, 6.2, on_yard(6.2), 14, ROOM_S), 'tavern': (-4.6, 10.0, on_yard(10), 0, ROOM_S), 'merchant': (2.6, 10.0, on_yard(10), 0, ROOM_S),
    'workshop': (7.9, 10.3, on_yard(10.3), -6, ROOM_S * 0.86), 'convoy': (11.6, 5.8, on_yard(5.8), -18, ROOM_S),
    'healer': (-8.6, 2.6, on_yard(2.6), 14, ROOM_S * 0.9), 'training': (7.6, 2.8, on_yard(2.8), -8, ROOM_S), 'campfire': (0.0, 6.4, on_yard(6.4), 0, ROOM_S),
    'memorial': (2.6, 18.2, LEDGE_Z, 0, ROOM_S * 1.25), 'academy': (-12.4, 17.0, LEDGE_Z, 20, ROOM_S), 'enchanter': (8.1, 16.4, LEDGE_Z, -8, ROOM_S),
    # keepsakes (companions' objects, story 10.14), fixed places in the room of their companion
    'axe': (-7.8, 4.8, on_yard(4.8) + 0.2, -20, KEEP_S), 'lute': (-2.9, 5.6, on_yard(5.6) + 0.2, 10, KEEP_S), 'books': (-0.2, 16.4, LEDGE_Z, 0, KEEP_S),
    'cauldron': (-5.4, 4.0, on_yard(4.0) + 0.2, 16, KEEP_S * 0.95),      # Grosk, between forge and campfire
    'dice': (-4.2, 8.4, on_yard(8.4) + 0.2, 4, KEEP_S * 0.95),           # Varek, the table in front of the tavern
    'shield': (10.1, 4.3, on_yard(4.3) + 0.2, -34, KEEP_S * 0.95),       # Tobin, the wagon's side by the gate
    'pelts': (6.1, 1.5, on_yard(1.5) + 0.2, -10, KEEP_S * 0.95),         # Mira, the rim of the shooting range
    'wolfpelt': (4.8, 1.8, on_yard(1.8) + 0.2, 8, KEEP_S * 0.9),         # Ilka, beside Mira's rack
    'trinkets': (6.5, 9.2, on_yard(9.2) + 0.2, -16, KEEP_S * 0.9),       # Fenn, under the workbench
    'seachart': (1.2, 8.8, on_yard(8.8) + 0.2, 6, KEEP_S * 0.9),         # Nell, the shop counter
    'satchel': (-7.4, 1.6, on_yard(1.6) + 0.2, 14, KEEP_S * 0.9),        # Amos, at the healer's door
    'sabre': (-2.7, 1.1, on_yard(1.1) + 0.2, 24, KEEP_S * 0.9),          # Sable, the gate's guard room
    'altar': (4.5, 17.1, LEDGE_Z, -12, KEEP_S * 0.95),                   # Liora, beside the memorial hall's entrance
    'cuirass': (-10.4, 15.8, LEDGE_Z, 24, KEEP_S * 0.95),                # Odile, in front of the academy's door
    'emberstone': (10.3, 18.4, LEDGE_Z, -18, KEEP_S * 0.95),             # Brann, at the rock face by the enchanter
}
LATE_ROOMS = ('enchanter', 'academy', 'workshop', 'training')  # from act 2 (content/core/rooms.yaml): missing at tier 0


def superellipse(rx, ry, cx, cy, t, p=2.6):
    c, s = math.cos(t), math.sin(t)
    return (cx + rx * math.copysign(abs(c) ** (2 / p), c), cy + ry * math.copysign(abs(s) ** (2 / p), s))


def se_val(x, y, c, p=2.6):
    return (abs((x - c[0]) / c[2]) ** p + abs((y - c[1]) / c[3]) ** p) ** (1 / p)


def polyline_dist(pts, x, y):
    best, at = 1e9, 0
    for i, ((a, b), (c, d)) in enumerate(zip(pts, pts[1:])):
        vx, vy = c - a, d - b
        t = max(0, min(1, ((x - a) * vx + (y - b) * vy) / (vx * vx + vy * vy)))
        dist = math.hypot(x - a - t * vx, y - b - t * vy)
        if dist < best:
            best, at = dist, i + t
    return best, at


def noise(x, y):
    return (math.sin(x * 0.37 + 1.3) * math.cos(y * 0.29 - 0.7) + 0.6 * math.sin(x * 0.81 - y * 0.63 + 2.1) + 0.35 * math.sin(x * 1.7 + y * 1.43)) / 1.95


def height(x, y):
    land = 5.0 * sm(-36, -1, y)
    plat = lerp(court_z(y), LEDGE_Z, sm(12.0, 14.6, y))
    base = lerp(land, plat, sm(-2.2, 0.2, y))
    e = (abs(x / 18.5) ** 2.6 + abs((y - 9) / 16) ** 2.6) ** (1 / 2.6)
    front = lerp(sm(12, 22, abs(x)), 1.0, sm(-2, 8, y)) * sm(-20, -4, y)
    side = 0.72 if x < 0 else 1.0
    rock = max(0.0, e - 1.0) * 44 * front * side
    z = base + rock + noise(x, y) * min(1.6, rock * 0.35)
    if y < -3:
        z += noise(x * 0.6, y * 0.6) * 0.3 * (1 - sm(-14, -3, y))
    d, at = polyline_dist(RIVER, x, y)
    if d < 4:
        z = lerp(-0.7, z, sm(1.2, 4, d))
    d, at = polyline_dist(PASS, x, y)
    if d < 3.6:
        i = min(int(at), len(PASS_Z) - 2)
        z = lerp(lerp(PASS_Z[i], PASS_Z[i + 1], at - i), z, sm(1.4, 3.6, d))
    return z


_RNG = random.Random(11)


def quad(p, pts, col, jitter=0.03):
    """A quad with one colour or a colour per corner (list of Vectors)."""
    base = len(p.verts)
    p.verts.extend(Vector(v) for v in pts)
    k = 1 + _RNG.uniform(-jitter, jitter)
    if isinstance(col, str):
        cols = [rgb(col)] * 4
    else:
        cols = col
    p.faces.append((tuple(base + i for i in range(4)), 0, [tuple(min(1.0, c * k) for c in v) for v in cols]))


# ------------------------------------------------------------------------------------------------ mountain and ground


def ground_col(x, y, steep):
    if steep:
        t = 0.5 + 0.5 * noise(x * 1.3, y * 1.3)
        return rgb('cliff_dark').lerp(rgb('cliff2'), t)
    t = 0.5 + 0.5 * noise(x * 0.5 + 4, y * 0.5)
    c = rgb('meadow3').lerp(rgb('meadow'), sm(0.1, 0.5, t)).lerp(rgb('meadow2'), sm(0.5, 0.95, t))
    d, _ = polyline_dist(RIVER, x, y)
    return rgb('sand2').lerp(c, sm(2.3, 3.6, d))


def build_terrain():
    p = part('land_a')
    xs = [-33 + i * 1.5 for i in range(45)]
    ys = [-74 + j * 1.25 for j in range(97)]
    H = {(i, j): height(x, y) for i, x in enumerate(xs) for j, y in enumerate(ys)}
    for i in range(len(xs) - 1):
        for j in range(len(ys) - 1):
            idx = ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))
            v = [(xs[a], ys[b], H[a, b]) for a, b in idx]
            n = (Vector(v[1]) - Vector(v[0])).cross(Vector(v[3]) - Vector(v[0]))
            steep = n.normalized().z < 0.62
            quad(p, v, [ground_col(q[0], q[1], steep) for q in v], jitter=0.015)


def build_water():
    p = part('land_a')
    rocks = part('land_a')
    r = random.Random(14)
    for (a, b), (c, d) in zip(RIVER, RIVER[1:]):
        for k in range(4):
            t0, t1 = k / 4, (k + 1) / 4
            x0, y0, x1, y1 = lerp(a, c, t0), lerp(b, d, t0), lerp(a, c, t1), lerp(b, d, t1)
            w = 2.75
            # three bands for a painted current
            for u0, u1, col in ((-1, -0.35, 'water'), (-0.35, 0.3, 'water2'), (0.3, 1, 'water')):
                quad(p, ((x0, y0 + u0 * w, -0.22), (x1, y1 + u0 * w, -0.22), (x1, y1 + u1 * w, -0.22), (x0, y0 + u1 * w, -0.22)), col, jitter=0.02)
            if r.random() < 0.6:
                sy = r.choice((-1, 1))
                blob(rocks, r.choice(('cliff3', 'cliff')), (x0, y0 + sy * 2.4, -0.1), (r.uniform(0.5, 1.0), r.uniform(0.4, 0.7), r.uniform(0.3, 0.55)), sub=1, lumpy=0.2, seed=r.randint(0, 999))


def _near_pass(x, y):
    return polyline_dist(PASS, x, y)[0] < 2.6


def build_cliffs():
    """Tall faceted slabs on the rock: the mass that reads as the mountain in the game camera. Dark ground shows as crevices."""
    p = part('land_a')
    plants = part('land_a')
    rng = random.Random(21)
    placed = 0
    for _ in range(1400):
        x, y = rng.uniform(-27, 27), rng.uniform(-10, 44)
        if y < 2 and abs(x) < 18:
            continue
        z = height(x, y)
        inside = se_val(x, y, COURT) < 1.1 or se_val(x, y, LEDGE) < 1.05
        slope = (height(x + 1.2, y) - height(x - 1.2, y)) ** 2 + (height(x, y + 1.2) - height(x, y - 1.2)) ** 2
        if inside or slope < 6 or z < 2 or _near_pass(x, y):
            continue
        s = rng.uniform(1.3, 2.9)
        col = rng.choice(('cliff', 'cliff3', 'cliff2', 'cliff_warm'))
        blob(p, col, (x, y, z - s * 0.3), (s, s * 0.75, s * rng.uniform(1.1, 1.7)), sub=1, lumpy=0.2, seed=rng.randint(0, 9999),
             rot=(rng.uniform(-10, 10), rng.uniform(-12, 12), rng.uniform(0, 360)), shade=(0.62, 1.14))
        if rng.random() < 0.18:
            bush(plants, x + rng.uniform(-1, 1), y - s * 0.6, s=rng.uniform(0.5, 0.9), seed=rng.randint(0, 999), M=mat4((0, 0, z + s * 0.5)))
        placed += 1
        if placed >= 170:
            break
    # the rock step between courtyard and ledge, open at the stairs
    for i in range(22):
        x = -16.5 + i * 1.55
        if abs(x + 0.5) < 2.1:
            continue
        s = rng.uniform(1.2, 1.8)
        blob(p, rng.choice(('cliff', 'cliff3', 'cliff2')), (x, 13.2 + rng.uniform(-0.2, 0.3), court_z(13) + 1.4), (s, s * 0.7, 3.6), sub=1, lumpy=0.16, seed=i + 500, shade=(0.62, 1.14))
    # boulders below the wall
    for i, (x, y) in enumerate(((-13, -2.2), (-9.8, -1.7), (11.5, -1.8), (15, -3.2), (-15.5, -4.5), (-6.4, -1.4))):
        s = rng.uniform(1.0, 1.7)
        blob(p, rng.choice(('cliff', 'cliff2', 'cliff3')), (x, y, height(x, y) + 0.2), (s, s * 0.8, s * 0.8), sub=1, lumpy=0.2, seed=i + 600, shade=(0.62, 1.14))


def outline_disc(p, col, col2, c, z, n=40):
    pts = [superellipse(c[2], c[3], c[0], c[1], 2 * math.pi * i / n) for i in range(n)]
    base = len(p.verts)
    p.verts.append(Vector((c[0], c[1], z if z is not None else court_z(c[1]) + 0.05)))
    p.verts.extend(Vector((x, y, z if z is not None else court_z(y) + 0.05)) for x, y in pts)
    a, b = tuple(rgb(col)), tuple(rgb(col2))
    for i in range(n):
        p.faces.append(((base, base + 1 + i, base + 1 + (i + 1) % n), 0, [a, b, b]))


def build_platforms():
    p = part('land_a')
    outline_disc(p, 'cobble3', 'cobble2', COURT, None)
    outline_disc(p, 'cobble', 'cobble2', LEDGE, LEDGE_Z + 0.05)
    r = random.Random(40)
    # a few flagstones so the yard does not read as a flat plate
    for i in range(46):
        a, d = r.uniform(0, 2 * math.pi), r.uniform(0.05, 0.95)
        x, y = COURT[0] + math.cos(a) * d * COURT[2], COURT[1] + math.sin(a) * d * COURT[3]
        box(p, r.choice(('cobble', 'cobble2', 'grout')), (x, y, court_z(y) + 0.02), (r.uniform(0.7, 1.4), r.uniform(0.5, 1.0), 0.09), rot=(0, 0, r.uniform(-20, 20)), bev=0.2)
    z0 = court_z(11)
    for i in range(10):
        t = i / 9
        box(p, 'step', (-0.5, lerp(11.0, 14.6, t), lerp(z0, LEDGE_Z - 0.4, t)), (3.4, 0.56, 0.72), bev=0.1)
    for sx in (-1, 1):
        box(p, 'stone2', (-0.5 + sx * 1.95, 12.8, z0), (0.5, 4.0, LEDGE_Z - z0 + 0.2), bev=0.08)


# ------------------------------------------------------------------------------------------------ walls, gate, keep


def palisade(p, a, b, z, h=2.6, n=9, seed=0):
    r = random.Random(seed)
    for i in range(n):
        t = (i + 0.5) / n
        x, y = lerp(a[0], b[0], t), lerp(a[1], b[1], t)
        hh = h * r.uniform(0.85, 1.05)
        cyl(p, r.choice(('wood', 'wood_dark', 'plank')), (x, y, z), 0.2, hh, seg=5, r2=0.12, bev=0)


def build_wall():
    a_, l01, l0, l1, l23, l3 = (part('shell_' + t) for t in ('a', '01', '0', '1', '23', '3'))
    S, zb, zt = 1.55, 3.2, court_z(3) - 0.2
    M = mat4((0, 0, zb), scale=(S, S, S))
    c = COURT
    n = 15
    ts = [math.radians(lerp(178, 362, i / n)) for i in range(n + 1)]
    ring = [superellipse(c[2], c[3], c[0], c[1], t) for t in ts]

    def low(q):
        return (q[0] / S, q[1] / S)

    for i, (a, b) in enumerate(zip(ring, ring[1:])):
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        if abs(mx) < 2.8:
            continue
        wall_segment(l23, low(a), low(b), h=2.6, t=0.72, seed=200 + i, M=M)
        if i % 3 == 1:
            rubble(l0, mx, my - 0.6, n=8, spread=1.6, s=0.55, seed=210 + i, M=mat4((0, 0, zb + 1.0)))
        else:
            wall_segment(l0, low(a), low(b), h=1.7, t=0.72, broken=True, seed=200 + i, M=M, ivy_p=l0)
        if i % 4 == 1:
            palisade(l1, a, b, zb + 1.2, h=3.4, n=10, seed=i)
        else:
            wall_segment(l1, low(a), low(b), h=2.4, t=0.72, broken=True, seed=400 + i, M=M, ivy_p=l1)
        ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
        if True:
            banner(l3, 0, 0, 0, w=1.0, h=2.2, M=mat4((mx, my - 0.75, zb + 3.7), (0, 0, ang)))
    for k, (x, y) in enumerate((ring[0], ring[-1])):
        Tm = mat4((0, 0, zb))
        round_tower(l23, l23, x, y, r=1.25, h=5.7, seed=50 + k, M=Tm, s=1.42)
        round_tower(l0, l0, x, y, r=1.25, h=3.3, broken=True, seed=50 + k, M=Tm, s=1.42, ivy_p=l0)
        round_tower(l1, l1, x, y, r=1.25, h=5.7, broken=True, seed=50 + k, M=Tm, s=1.42)
        cone_roof(l3, x, y, 8.0 + zb, 2.0, 2.8, seg=12, seed=70 + k, col='terra', accent='terra2')
    scaffold(l1, ring[-1][0] - 2.2, ring[-1][1] - 1.0, 1.4, 1.2, 7.0, M=mat4((0, 0, zb + 1)), levels=3)
    for sx in (-1, 1):
        q = superellipse(c[2], c[3], c[0], c[1], math.radians(90 + sx * -62))
        e = ring[0 if sx < 0 else -1]
        Ms = mat4((0, 0, zt), scale=(S, S, S))
        wall_segment(l23, low(e), low(q), h=2.6, t=0.7, seed=240 + sx, M=Ms)
        wall_segment(l01, low(e), low(q), h=2.6, t=0.7, broken=True, seed=240 + sx, M=Ms, ivy_p=l01)
    _ = a_


def build_gate():
    a, l0, l01, l123, l3 = (part('shell_' + t) for t in ('a', '0', '01', '123', '3'))
    G = mat4((0, -1.2, 3.1), scale=(1.75, 1.75, 1.75))
    half = 2.0
    box(a, 'stone', (0, 0, 0), (2 * half - 0.6, 0.95, 2.55), bev=0.04, M=G)
    box(l123, 'stone2', (0, 0, 2.5), (2 * half - 0.5, 1.05, 0.14), bev=0.3, M=G)
    merlons(l123, (-half + 0.55, 0), (half - 0.55, 0), 2.62, 0.95, M=G, gap=0.7)
    poly(a, 'stone3', arch_pts(1.42, 1.98, True, n=6), (0, -0.5, 0), depth=0.06, M=G)
    # ruin: an open dark gateway; from tier 1: wings with iron bands
    poly(l0, 'wood_dark', arch_pts(1.08, 1.7, True, n=6), (0, -0.55, 0), depth=0.04, M=G)
    poly(l123, 'wood', arch_pts(1.08, 1.7, True, n=6), (0, -0.55, 0), depth=0.04, M=G)
    box(l123, 'wood_dark', (0, -0.6, 0), (0.03, 0.02, 1.5), bev=0, M=G)
    for z in (0.45, 1.15):
        box(l123, 'iron', (0, -0.6, z), (1.0, 0.02, 0.05), bev=0, M=G)
    rubble(l0, 1.8, -3.2, n=6, spread=0.8, s=0.4, seed=78, M=mat4((0, 0, 4.0)))
    ivy(l01, -0.9, -0.5, 2.4, n=6, spread=(0.4, 1.6), seed=77, M=G)
    for sx in (-1, 1):
        P = G @ mat4((sx * half, 0, 0))
        box(a, 'stone_dark', (0, 0, 0), (1.28, 1.28, 0.4), bev=0.15, M=P)
        box(a, 'stone3', (0, 0, 0.32), (1.08, 1.08, 3.2), bev=0.06, M=P)
        box(a, 'stone2', (0, 0, 3.45), (1.26, 1.26, 0.2), bev=0.25, M=P)
        for dx, dy in ((-0.38, -0.38), (0.38, -0.38), (-0.38, 0.38), (0.38, 0.38)):
            box(l123, 'stone', (dx, dy, 3.63), (0.36, 0.36, 0.36), bev=0.2, M=P)
        box(a, 'stone2', (0, -0.56, 0.62), (0.82, 0.06, 2.24), bev=0.1, M=P)
        R = P @ mat4((0, -0.56, 0.78))
        if sx < 0:
            dragon_relief(a, R @ mat4((0.02, 0, 0), (0, 0, 0), (1.25, 1, 1.42)))
        else:
            crown_relief(a, R @ mat4((0, 0, 0.12), (0, 0, 0), (1.25, 1, 1.18)))
        ivy(l01, sx * 0.62, -0.3, 2.9, n=4, spread=(0.08, 1.4), seed=70 + sx, face=sx * 90, M=P)
        banner(l3, sx * (half - 0.95), -0.5, 2.3, w=0.34, h=0.78, M=G)
        lantern_wall(part('shell_23'), sx * (half - 1.05), -0.48, 1.25, M=G)


def build_keep():
    a, l01, l1, l2, l23, l3 = (part('shell_' + t) for t in ('a', '01', '1', '2', '23', '3'))
    tx, ty = -5.5, 19.2
    tr, th = 3.2, 7.2
    T = mat4((tx, ty, LEDGE_Z))
    rr = random.Random(99)
    cyl(a, 'stone_dark', (0, 0, 0), tr * 1.1, 0.5, seg=18, r2=tr * 1.05, M=T, bev=0.15)
    low = 3.9  # the stump of the ruin
    l123 = part('shell_123')
    l0 = part('shell_0')
    cyl(a, 'stone', (0, 0, 0.35), tr * 1.04, low - 0.35, seg=18, r2=tr * 1.02, M=T, bev=0.03)
    cyl(l123, 'stone', (0, 0, low), tr * 1.02, th - low, seg=18, r2=tr, M=T, bev=0.03)
    for i in range(10):
        ang = rr.uniform(math.pi * 1.05, math.pi * 1.95)
        z = rr.uniform(0.8, low - 0.6)
        box(a, rr.choice(('stone3', 'stone2')), (math.cos(ang) * tr * 0.99, math.sin(ang) * tr * 0.99, z), (1.0, 0.3, 0.6), rot=(0, 0, math.degrees(ang) + 90), bev=0.2, M=T)
    window(a, l23, 0, -tr * 1.0, 2.4, w=0.55, h=1.0, M=T)
    for ang, z in ((-125, 4.8), (-55, 4.8), (-90, 5.6), (-150, 3.0), (-30, 3.0)):
        window(l123, l3 if ang in (-150, -30, -90) else l23, 0, -tr * 0.99, z, w=0.55, h=1.0, M=T @ mat4((0, 0, 0), (0, 0, ang + 90)))
    door(a, 0, -tr * 1.0, 0.35, w=0.9, h=1.5, M=T)
    # intact crown (tier 2+), broken stump (0-1)
    cyl(l23, 'stone2', (0, 0, th - 0.05), tr * 1.16, 0.55, seg=18, M=T, bev=0.2)
    for i in range(14):
        ang = 2 * math.pi * (i + 0.5) / 14
        box(l23, 'stone', (math.cos(ang) * tr * 1.08, math.sin(ang) * tr * 1.08, th + 0.45), (0.8, 0.5, 0.65), rot=(0, 0, math.degrees(ang) + 90), bev=0.2, M=T)
    for i in range(9):
        if rr.random() < 0.3:
            continue
        ang = 2 * math.pi * i / 9
        box(l1, 'stone2', (math.cos(ang) * tr * 0.88, math.sin(ang) * tr * 0.88, th - 0.05), (1.3, 0.7, rr.uniform(0.3, 1.1)), rot=(0, 0, math.degrees(ang) + 90), bev=0.2, M=T)
        box(l0, 'stone2', (math.cos(ang) * tr * 0.88, math.sin(ang) * tr * 0.88, low - 0.1), (1.4, 0.8, rr.uniform(0.3, 1.6)), rot=(0, 0, math.degrees(ang) + 90), bev=0.2, M=T)
    ivy(l0, -2.2, -2.0, 3.8, n=10, spread=(0.4, 3.2), seed=101, face=-45, M=T)
    ivy(l0, 2.4, -1.8, 3.6, n=9, spread=(0.4, 3.0), seed=102, face=50, M=T)
    rubble(l0, -1.8, -5.0, n=10, spread=1.8, s=0.55, seed=103, M=T)
    rubble(l0, 3.5, -4.0, n=8, spread=1.3, s=0.5, seed=104, M=T)
    scaffold(l1, 2.8, -1.4, 1.4, 1.2, th + 1.2, M=T, levels=3)
    scaffold(l2, 0, -0.4, 3.6, 3.0, 2.4, M=T @ mat4((0, 0, th + 0.5)), levels=1)
    cone_roof(l3, 0, 0, th + 0.5, tr * 1.1, 4.0, M=T, seg=16, seed=5)
    for ang in (-115, -65):
        banner(l3, 0, -tr * 1.03, th - 0.6, w=0.8, h=1.9, M=T @ mat4((0, 0, 0), (0, 0, ang + 90)))
    # second, smaller tower on the right of the ledge
    R = mat4((12.6, 17.2, LEDGE_Z - 0.2))
    round_tower(l23, l23, 0, 0, r=1.5, h=5.2, seed=31, M=R)
    round_tower(l0, l0, 0, 0, r=1.5, h=2.4, broken=True, seed=31, M=R, ivy_p=l0)
    round_tower(l1, l1, 0, 0, r=1.5, h=5.2, broken=True, seed=31, M=R)
    cone_roof(l3, 0, 0, 5.4, 1.65, 2.6, M=R, seg=14, seed=6, col='terra', accent='terra2')
    # low wall along the ledge edge
    Lm = mat4((0, 0, LEDGE_Z), scale=(1.3, 1.3, 1.3))
    for i, (p0, p1) in enumerate((((-14, 14.4), (-8, 13.9)), ((-8, 13.9), (-2.6, 13.9)), ((1.6, 13.9), (7, 13.9)), ((7, 13.9), (12, 14.5)))):
        q0, q1 = (p0[0] / 1.3, p0[1] / 1.3), (p1[0] / 1.3, p1[1] / 1.3)
        wall_segment(l23, q0, q1, h=0.9, t=0.45, seed=300 + i, M=Lm)
        wall_segment(l1, q0, q1, h=0.9, t=0.45, broken=True, seed=300 + i, M=Lm)
        if i % 2:
            wall_segment(l0, q0, q1, h=0.6, t=0.45, broken=True, seed=300 + i, M=Lm)
    # watch post where the pass road leaves the ledge: palisade gate at tier 2, stone tower with a banner at tier 3
    palisade(l2, (15.2, 25.0), (20.0, 23.0), LEDGE_Z + 1.2, h=3.0, n=11, seed=33)
    Wp = mat4((20.2, 23.4, LEDGE_Z + 1.0))
    round_tower(l3, l3, 0, 0, r=1.35, h=5.0, seed=34, M=Wp)
    cone_roof(l3, 0, 0, 5.2, 1.5, 2.4, M=Wp, seg=12, seed=35)
    wall_segment(l3, (15.2 / 1.3, 25.0 / 1.3), (19.4 / 1.3, 23.4 / 1.3), h=2.0, t=0.5, seed=36, M=mat4((0, 0, LEDGE_Z + 1.2), scale=(1.3, 1.3, 1.3)))


def build_vault():
    """The vault door in the rock face behind the ledge (mission 1-7), the pass road beside it."""
    a = part('shell_a')
    x, y, z = 6.0, 24.4, LEDGE_Z
    M = mat4((x, y, z), scale=(1.9, 1.9, 1.9))
    blob(a, 'cliff_dark', (0, 0.9, 1.1), (2.8, 1.2, 2.6), sub=1, lumpy=0.12, seed=80, M=M)
    poly(a, 'stone2', arch_pts(2.3, 2.9, False, n=7), (0, -0.25, 0), depth=0.5, M=M)
    poly(a, 'stone_dark', arch_pts(1.8, 2.5, False, n=7), (0, -0.3, 0), depth=0.08, M=M)
    poly(a, 'wood_dark', arch_pts(1.45, 2.1, False, n=7), (0, -0.34, 0), depth=0.04, M=M)
    for sx in (-1, 1):
        lantern_wall(part('shell_23'), sx * 1.05, -0.32, 1.5, M=M)


# ------------------------------------------------------------------------------------------------ land


def ribbon(p, pts, w, col, lift=0.08, sub=4):
    def cr(p0, p1, p2, p3, t):
        return tuple(0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t) for a, b, c, d in zip(p0, p1, p2, p3))
    ctrl = [pts[0]] + list(pts) + [pts[-1]]
    path = []
    for i in range(len(pts) - 1):
        for k in range(sub):
            path.append(cr(ctrl[i], ctrl[i + 1], ctrl[i + 2], ctrl[i + 3], k / sub))
    path.append(pts[-1])
    prev = None

    def h(q):
        return max(height(*q), -0.1) + lift

    for a, b in zip(path, path[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L * w, dx / L * w
        cur = ((a[0] - nx, a[1] - ny), (a[0] + nx, a[1] + ny))
        nxt = ((b[0] - nx, b[1] - ny), (b[0] + nx, b[1] + ny))
        l0, r0 = prev or cur
        quad(p, ((*l0, h(l0)), (*nxt[0], h(nxt[0])), (*nxt[1], h(nxt[1])), (*r0, h(r0))), col, jitter=0.03)
        prev = nxt
    return path


TERRACES = [  # field patches: x0, x1, y (back edge), depth, order: when it bears grain (1 = first)
    (2.6, 9.0, -3.0, 6.0, 1), (10.0, 16.6, -3.4, 6.0, 2), (-16.2, -9.4, -3.4, 6.0, 2), (-8.4, -2.4, -3.0, 6.0, 1),
    (6.2, 12.8, -11.2, 6.6, 2), (13.8, 20.2, -11.6, 6.6, 3), (-15.6, -9.2, -11.6, 6.6, 3), (-8.2, -2.6, -11.2, 6.6, 2),
    (6.6, 13.2, -20.0, 6.8, 3), (-14.0, -7.6, -20.0, 6.8, 3),
]


def build_terrace(x0, x1, y, d, order):
    wall = part('land_a')
    grain = part('land_' + {1: '123', 2: '23', 3: '3'}[order])
    wild = part('land_' + {1: '0', 2: '01', 3: '012'}[order])
    z = height((x0 + x1) / 2, y - d / 2) + 0.55
    r = random.Random(int(x0 * 13 + y * 7))
    y0, y1 = y - d, y
    # soil and weeds
    quad(wild, ((x0, y0, z + 0.1), (x1, y0, z + 0.1), (x1, y1, z + 0.1), (x0, y1, z + 0.1)), 'wild', jitter=0.03)
    quad(grain, ((x0, y0, z + 0.1), (x1, y0, z + 0.1), (x1, y1, z + 0.1), (x0, y1, z + 0.1)), 'wheat2', jitter=0.02)
    # grain in rows running into the picture, so the camera looks along the furrows
    rows = max(5, int((x1 - x0) / 0.62))
    for w in range(rows):
        f0, f1 = x0 + (x1 - x0) * w / rows, x0 + (x1 - x0) * (w + 1) / rows
        fm = (f0 + f1) / 2
        ridge = z + 0.44 + r.uniform(-0.04, 0.04)
        top, side, low_ = rgb('wheat3'), rgb('wheat'), rgb('wheat2')
        a, b = y0 + 0.2, y1 - 0.2
        quad(grain, ((f0, a, z + 0.12), (f0, b, z + 0.12), (fm, b, ridge), (fm, a, ridge)), [side, side, top, top], jitter=0.05)
        quad(grain, ((fm, a, ridge), (fm, b, ridge), (f1, b, z + 0.12), (f1, a, z + 0.12)), [top, top, low_, low_], jitter=0.05)
        quad(grain, ((f0, a, z + 0.12), (fm, a, ridge), (f1, a, z + 0.12), (f0, a, z + 0.12)), [side, top, side, side], jitter=0.03)
    # dry stone wall in front and on the sides
    n = max(3, int((x1 - x0) / 1.7))
    for k in range(n):
        a, b = lerp(x0, x1, k / n), lerp(x0, x1, (k + 1) / n)
        whole = part('land_123') if order > 1 and k % 3 == 1 else wall
        if whole is not wall:
            rubble(part('land_0'), (a + b) / 2, y0 - 0.4, n=4, spread=0.6, s=0.34, seed=k + order * 10, M=mat4((0, 0, z - 0.3)))
        box(whole, r.choice(('stone2', 'stone_dark', 'stone2')), ((a + b) / 2, y0 - 0.15, z - 1.2), (b - a + 0.05, 0.55, 1.3), bev=0.14)
        box(whole, 'stone', ((a + b) / 2, y0 - 0.15, z + 0.08), (b - a - 0.05, 0.6, 0.2), bev=0.2)
    box(wall, 'earth', ((x0 + x1) / 2, y - d / 2, z - 1.4), (x1 - x0, d, 1.42), bev=0.04)
    for sx in (x0, x1):
        box(wall, 'stone2', (sx, y - d / 2, z - 0.5), (0.4, d, 0.62), bev=0.14)
    for i in range(5):
        bush(wild, lerp(x0 + 0.8, x1 - 0.8, r.random()), y - r.uniform(0.5, d - 0.5), s=r.uniform(0.45, 0.8), seed=r.randint(0, 999), M=mat4((0, 0, z + 0.1)))


def house(p, x, y, yaw=0, s=1.0, roof='terra', glow=None):
    z = height(x, y)
    M = mat4((x, y, z - 0.1), (0, 0, yaw), (s, s, s))
    box(p, 'stone2', (0, 0, 0), (2.2, 1.6, 0.4), bev=0.1, M=M)
    box(p, 'plaster', (0, 0, 0.3), (2.1, 1.5, 1.0), bev=0.05, M=M)
    gable(p, roof, (0, 0, 1.25), 2.3, 1.6, 0.95, accent=None, seed=int(x * 7), M=M)
    box(p, 'stone2', (0.6, 0.2, 1.3), (0.34, 0.34, 1.15), bev=0.12, M=M)
    door(p, -0.3, -0.76, 0.1, w=0.42, h=0.72, M=M, pointed=False)
    window(p, glow or p, 0.45, -0.76, 0.75, w=0.3, h=0.32, M=M, pointed=False)


def build_mill():
    a, l0, l123 = part('land_a'), part('land_0'), part('land_123')
    x, y = -9.8, -30.0
    z = height(x, y)
    M = mat4((x, y, z - 0.1), (0, 0, 8), (1.6, 1.6, 1.6))
    box(a, 'stone', (0, 0, 0), (2.5, 1.7, 1.2), bev=0.05, M=M)
    gable(l123, 'slate', (0, 0, 1.2), 2.7, 1.9, 1.1, accent=None, seed=9, M=M)
    window(a, l123, 0.6, -0.86, 0.7, w=0.32, h=0.42, M=M, pointed=False)
    W = M @ mat4((-0.5, -1.15, 0.45), (90, 0, 0))
    cyl(l123, 'wood', (0, 0, -0.14), 1.05, 0.28, seg=14, bev=0.08, M=W)
    cyl(l123, 'wood_dark', (0, 0, -0.18), 0.3, 0.36, seg=8, bev=0.1, M=W)
    for i in range(6):
        ang = i * 60
        box(l123, 'wood_dark', (0, 0, -0.16), (1.9, 0.12, 0.32), rot=(0, 0, ang), bev=0.1, M=W)
    # broken: no roof, the wheel lies in the water
    box(l0, 'wood_dark', (0.2, 0, 1.2), (2.3, 0.2, 0.2), rot=(0, 8, 8), bev=0.2, M=M)
    cyl(l0, 'wood_dark', (-0.8, -1.3, -0.3), 0.9, 0.2, seg=9, rot=(12, 18, 0), bev=0.1, M=M)
    rubble(l0, 0.8, -1.2, n=5, spread=0.5, s=0.25, seed=61, M=M)


def build_bridge():
    l0, l1, l23 = part('land_0'), part('land_1'), part('land_23')
    x, y = 2.6, -34.9
    M = mat4((x, y, -0.2))
    for i in range(7):
        t = (i - 3) / 3
        box(l23, 'stone2' if i % 2 else 'stone', (0, t * 3.4, 1.05 * (1 - t * t)), (2.5, 1.2, 0.4), bev=0.12, M=M)
        box(l1, 'plank' if i % 2 else 'wood', (0, t * 3.4, 0.55), (2.1, 1.05, 0.14), bev=0.12, M=M)
        if i % 3 == 0:
            box(l1, 'wood_dark', (0, t * 3.4, -0.2), (2.3, 0.3, 0.8), bev=0.1, M=M)
    for sx in (-1, 1):
        for i in range(7):
            t = (i - 3) / 3
            box(l23, 'stone_dark', (sx * 1.22, t * 3.4, 1.05 * (1 - t * t) + 0.32), (0.26, 1.2, 0.3), bev=0.15, M=M)
    # the ford of the ruin: stepping stones, stumps of the old bridge
    for i in range(6):
        blob(l0, 'cliff2', (2.6 + (i % 2) * 0.5, -37.5 + i * 1.05, -0.15), (0.55, 0.45, 0.3), sub=1, lumpy=0.2, seed=700 + i)
    box(l0, 'stone2', (0, -3.4, 0), (2.4, 1.0, 0.7), bev=0.14, M=M)
    box(l0, 'stone2', (0, 3.4, 0), (2.4, 1.0, 0.7), bev=0.14, M=M)


def build_land():
    a, l123, l23, l3 = part('land_a'), part('land_123'), part('land_23'), part('land_3')
    path = ribbon(a, ROAD, 0.82, 'road')
    ribbon(part('shell_a'), PASS, 0.72, 'road', lift=0.1)
    for t in TERRACES:
        build_terrace(*t)
    house(l123, 7.0, -9.8, -6, s=1.4, glow=l23)
    house(l23, -5.2, -9.8, 8, s=1.4, glow=l3)
    house(l23, 17.6, -19.6, -14, s=1.4, glow=l3)
    house(l3, 8.0, -29.6, -8, s=1.3)
    house(l3, -3.2, -29.2, 8, s=1.3, roof='slate')
    house(l3, 5.6, -31.0, 4, s=1.2, roof='slate')
    house(l3, -0.9, -31.2, -6, s=1.2)
    house(l3, 13.0, -30.2, -12, s=1.3, roof='slate')
    for i, (x, y) in enumerate(((-3.6, -19.4), (-1.4, -19.6), (-3.6, -22.0), (-1.4, -22.2), (16.5, -26.6), (18.8, -26.8))):
        tree(l23 if i < 3 else l3, x, y, s=1.45, seed=800 + i, M=mat4((0, 0, height(x, y))))
    for x, y in ((17.5, -10.2), (9.4, -27.6), (-11.5, -27.8)):
        blob(l3, 'straw', (x, y, height(x, y) + 0.5), (0.75, 0.75, 0.7), sub=1, lumpy=0.06, seed=int(x + 90))
    lw = part('land_0')
    rw = random.Random(77)
    for i in range(16):
        x, y = rw.uniform(-13, 13), rw.uniform(-0.5, 11)
        bush(lw, x, y, s=rw.uniform(0.6, 1.1), seed=rw.randint(0, 999), M=mat4((0, 0, court_z(y))))
    for i in range(9):
        x, y = rw.uniform(-13, 11), rw.uniform(15, 21)
        bush(lw, x, y, s=rw.uniform(0.6, 1.0), seed=rw.randint(0, 999), M=mat4((0, 0, LEDGE_Z)))
    for x, y, z in ((-2.6, 8.5, court_z(8.5)), (5.6, 4.0, court_z(4)), (9.5, 19.0, LEDGE_Z), (-1.0, 16.5, LEDGE_Z)):
        tree(lw, x, y, s=1.5, seed=int(x * 9 + 900), M=mat4((0, 0, z)))
    for f in (0.06, 0.2, 0.33, 0.47, 0.6):
        q = path[int(f * (len(path) - 1))]
        bush(lw, q[0], q[1], s=0.8, seed=int(f * 100), M=mat4((0, 0, height(q[0], q[1]))))
    build_mill()
    build_bridge()
    # lanterns and pennants along the road (tier 3)
    for i, f in enumerate((0.14, 0.3, 0.46, 0.62, 0.74)):
        q = path[int(f * (len(path) - 1))]
        x, y = q[0] + (1.3 if i % 2 else -1.3), q[1] + 0.2
        lantern_post(l3, 0, 0, h=1.5, M=mat4((x, y, height(x, y))))
    r = random.Random(5)
    for x, y in ((-19, -9), (-18, -17), (-20, -24), (-16, -28), (20, -21), (19, -29), (-5, -26), (3.6, -26.5), (-22, -32), (23, -32), (-13, -40), (-5, -43), (8, -42), (15, -40), (-19, -43), (21, -43)):
        tree(a, x, y, s=r.uniform(2.6, 3.6), seed=r.randint(0, 999), M=mat4((0, 0, height(x, y))))
    # the foreground: big dark crowns and boulders in the corners frame the picture
    for x, y, sz in ((-14.5, -49, 5.2), (15.5, -50, 5.6), (-8.5, -52, 4.2), (20, -46, 4.4)):
        tree(a, x, y, s=sz, seed=int(x * 3 + 900), M=mat4((0, 0, height(x, y))))
    for x, y, sz in ((-5, -49, 1.8), (9, -47, 2.2), (-17, -44, 1.6)):
        blob(a, 'cliff2', (x, y, height(x, y)), (sz, sz * 0.8, sz * 0.7), sub=1, lumpy=0.2, seed=int(x + 40), shade=(0.62, 1.14))
    for x, y in ((-2.2, -2.6), (2.0, -2.6), (17.5, -1.0), (-17.5, -1.0)):
        cypress(a, x, y, s=2.4, seed=r.randint(0, 999), M=mat4((0, 0, height(x, y))))
    for i in range(40):
        x, y = r.uniform(-22, 22), r.uniform(-64, -28)
        if polyline_dist(RIVER, x, y)[0] < 3.2 or polyline_dist(ROAD, x, y)[0] < 1.5:
            continue
        bush(a, x, y, s=r.uniform(0.45, 0.8), seed=r.randint(0, 999), M=mat4((0, 0, height(x, y))), flowers=r.choice((None, 'flower_w', 'flower_y')))


def build_outwork():
    """Tier 3 only: the outwork at the foot of the pass road (F4, product owner 2026-11-06) - a picture, no room and no rule."""
    l3 = part('shell_3')
    x, y = PASS[0]
    O = mat4((x + 0.5, y - 0.4, LEDGE_Z), (0, 0, -28), (1.35, 1.35, 1.35))
    # a short wall across the road with a gateway, merlons on top and a banner beside it
    for sx in (-1, 1):
        box(l3, 'stone2', (sx * 1.5, 0, 0), (1.5, 1.0, 1.9), bev=0.06, M=O)
        merlons(l3, (sx * 0.78, 0), (sx * 2.2, 0), 1.9, 1.0, M=O, size=0.34, gap=0.62)
        box(l3, 'stone3', (sx * 2.26, 0, 0), (0.6, 1.1, 2.5), bev=0.1, M=O)
        box(l3, 'stone2', (sx * 2.26, 0, 2.45), (0.76, 1.26, 0.18), bev=0.25, M=O)
        lantern_wall(l3, sx * 1.95, -0.55, 1.1, M=O, rot=0)
    box(l3, 'stone', (0, 0, 1.55), (1.6, 1.0, 0.45), bev=0.08, M=O)
    poly(l3, 'stone3', arch_pts(1.0, 1.5, True, n=6), (0, -0.52, 0), depth=0.05, M=O)
    poly(l3, 'wood', arch_pts(0.78, 1.26, True, n=6), (0, -0.56, 0), depth=0.04, M=O)
    banner(l3, 1.0, -0.53, 1.0, w=0.3, h=0.66, M=O)
    pennant(l3, -2.26, -0.2, 2.6, h=1.1, M=O)


def build_sites():
    """Where the rooms of act 2 will stand, the ruin shows rubble."""
    l0 = part('shell_0')
    for rid in LATE_ROOMS:
        x, y, z, _, _ = LAYOUT[rid]
        rubble(l0, x, y, n=7, spread=1.3, s=0.42, seed=len(rid) * 31 + int(x * 3), M=mat4((0, 0, z)))


# ------------------------------------------------------------------------------------------------ output


def build_all():
    for fn in (build_terrain, build_water, build_cliffs, build_platforms, build_wall, build_gate, build_keep, build_vault, build_land, build_outwork, build_sites):
        before = sum(p.tris() for p in PARTS.values())
        fn()
        print(f'[hc]   {fn.__name__}: {sum(p.tris() for p in PARTS.values()) - before} tris', flush=True)
    for rid, fn in ROOMS.items():
        fn(Lv(rid))
    for kid, fn in KEEPSAKES.items():
        fn(Lv(kid))
    for name, p in PARTS.items():
        spot = LAYOUT.get(name.rsplit('_', 1)[0])
        if spot:
            x, y, z, yaw, sc = spot
            M = mat4((x, y, z), (0, 0, yaw), (sc, sc, sc))
            p.verts = [M @ v for v in p.verts]


CAM_PITCH, CAM_FOV, CAM_DIST, CAM_AIM = 30, 36, 74, (0, -10, 11)


def tag_visible(name, level, tier):
    g, tag = name.rsplit('_', 1)
    if tag == 'a':
        return g in ('shell', 'land') or tier > 0 or g not in LATE_ROOMS
    if g in ('shell', 'land'):
        return str(tier) in tag
    return str(level) in tag and (tier > 0 or g not in LATE_ROOMS)


def preview_materials():
    """The vertex colours hold sRGB values: decode them for Blender's linear renderer (preview only, after the export)."""
    for m in bpy.data.materials:
        nt = m.node_tree
        attr = next(n for n in nt.nodes if n.type == 'VERTEX_COLOR')
        bsdf = nt.nodes['Principled BSDF']
        g = nt.nodes.new('ShaderNodeGamma')
        g.inputs['Gamma'].default_value = 2.2
        nt.links.new(attr.outputs['Color'], g.inputs['Color'])
        nt.links.new(g.outputs['Color'], bsdf.inputs['Base Color'])
        if 'glow' in m.name:
            nt.links.new(g.outputs['Color'], bsdf.inputs['Emission Color'])


def preview(path, objs):
    sc = bpy.context.scene
    preview_materials()
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    cam.data.sensor_fit = 'VERTICAL'
    cam.data.angle = math.radians(CAM_FOV)
    cam.data.clip_end = 400
    pitch = math.radians(CAM_PITCH)
    aim = Vector(CAM_AIM)
    cam.location = aim + Vector((0, -math.cos(pitch), math.sin(pitch))) * CAM_DIST
    cam.rotation_euler = (math.radians(90) - pitch, 0, 0)
    sc.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sc.collection.objects.link(sun)
    sun.data.energy = 2.9
    sun.data.color = (1.0, 0.8, 0.58)
    sun.rotation_euler = (math.radians(62), 0, math.radians(-52))
    sc.world = sc.world or bpy.data.worlds.new('w')
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (1.0, 0.8, 0.62, 1)
    bg.inputs['Strength'].default_value = 0.55
    sc.view_settings.view_transform = 'Standard'
    engines = {e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items}
    sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in engines else 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x, sc.render.resolution_y = 680, 1020
    os.makedirs(path, exist_ok=True)
    for tier in TIERS:
        level = {0: 1, 1: 1, 2: 2, 3: 3}[tier]
        for o in objs:
            o.hide_render = not tag_visible(o.name, level, tier)
        sc.render.filepath = os.path.join(path, f'paktwacht_t{tier}.png')
        bpy.ops.render.render(write_still=True)


def write_glb(objs):
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    raw = OUT[:-4] + '.raw.glb'
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=raw, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_vertex_color='ACTIVE', export_cameras=False, export_lights=False, export_animations=False,
                              export_materials='EXPORT')
    if os.path.exists(GLTFPACK):
        res = subprocess.run([GLTFPACK, '-i', raw, '-o', OUT, '-kn', '-km', '-cc'], capture_output=True, text=True, shell=os.name == 'nt')
        if res.returncode:
            print(res.stdout, res.stderr)
            shutil.copy2(raw, OUT)
        os.remove(raw)
    else:
        print('[hc] gltfpack missing (pnpm install): writing the unpacked file')
        shutil.move(raw, OUT)
    print(f'[hc] {OUT}: {os.path.getsize(OUT) // 1024} KB', flush=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_all()
    lit, glow = bc.material('castle_lit', False), bc.material('castle_glow', True)
    objs = []
    total = 0
    for name in sorted(PARTS):
        p = PARTS[name]
        if not p.faces:
            continue
        objs.append(bc.to_object(p, lit, glow))
        total += p.tris()
    print('[hc] ' + ', '.join(f'{p.name}:{p.tris()}' for p in PARTS.values() if p.name.startswith(('shell', 'land')) and p.faces), flush=True)
    print(f'[hc] total {total} tris', flush=True)
    write_glb(objs)
    if PREVIEW:
        preview(PREVIEW, objs)


main()
