"""Hollow Crown – weapon library v2: the rune SHIELD (heater shield with a boss and a rune setting).

blender -b --factory-startup --python tools/art/blender_weapon_shield.py -- [<out_dir>]

Writes art/models/weapons-v2/shield.glb. Reuses the helpers and the look of blender_weapons_v2.py (the file is executed up
to its build loop, so importing it never builds the axe; it is not modified).

Frame (identical to tools/art/blender_weapons.py shield, built in Blender Z-up, exported with the default glTF Y-up
conversion; hangs on the LEFT hand socket): origin in the fist, +X outward (the shield front / boss side, the old shield's
x = 0 .. 0.08), +Y up the forearm, +Z the grip axis (grip bar along Z). The shield is centred at y = 0.03 with the point
down (y -0.128 .. 0.178), about 0.25 wide (|z| <= 0.125). Units: 1 = one board tile before figureScale.

Look: painted board face split per pale (ochre left / dark umber right; blue, red and green are team colours and stay off the shield) over visible planks, dark-iron rim with gold rivets, a
bright cold-steel boss with the setting (palette art/palette/hollow-64.hex), wooden planks on the back.

Parts (same contract as the axe, see blender_weapons_v2.py for the STONE NODE CONVENTION):
  shield       metal + boards + boss + main setting, material HC_Vertex.
  rune_channel V strip inside a ring groove around the boss, lifted CH_LIFT above the groove floor. UV map 1 (`fill`,
               TEXCOORD_1): U = 0 at the bottom of the ring, rising clockwise seen from the front (from +X) to 1 back at the
               bottom. Light U < 1/3, 2/3, 1 for the tiers I, II, III. UV map 0 is a dummy.
  rune_socket2 small setting (rim + four small claws, 0.55 x) on the plate below the boss ring, HC_Vertex.
Nodes (empty): socket_rune_a (main setting, centre of the boss) and socket_rune_b (small setting). Stone frame: dome along
+X (out of the shield front), symbol up along +Y (up the forearm) = node rotated by -90 degrees about X (Blender); the small
node is also tilted by the plate slope and carries scale 0.55. Triangles: shield 7 404 + rune_channel 256 + rune_socket2 464 = 8 124.
"""
import math
import os
import sys

# --- reuse the axe helpers without running its build loop
_AXE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "blender_weapons_v2.py")
_src = open(_AXE, encoding="utf-8").read()
_src = _src[:_src.index("os.makedirs(OUT")]
_ns = {"__file__": _AXE, "__name__": "blender_weapons_v2_helpers"}
exec(compile(_src, _AXE, "exec"), _ns)
globals().update({k: v for k, v in _ns.items() if not k.startswith("__")})

# ---------------------------------------------------------------- shield geometry (z = lateral, y = up)
CY = 0.03                      # shield centre (y), also the socket centre; z = 0
W = 0.125                      # half width
BACK0, THICK, BMAX = 0.014, 0.0145, 0.014
X_S = 0.060                    # height of the setting face (the axe's FACE) on the boss
FLOOR_S = X_S - (FACE - FLOOR)  # socket floor, same depth as the axe's
RG, GHW, GDEPTH = 0.084, GROOVE_HW, GROOVE_DEPTH   # ring groove radius, half width, depth (as the axe)
NA = 64                        # angular steps of the plate / ring (divisible by 4: the seam is at the bottom)
RIM_A, RIM_B = 0.0092, 0.0105  # rim tube half sizes (in plane, along x)

RIM_D = 0.6 * pal(2) + 0.4 * pal(3)         # dark iron rim
RIM_L = 0.5 * pal(3) + 0.5 * pal(4)
BOSS_D, BOSS_L = pal(26), pal(28)           # bright cold steel boss and setting
BLUE_D, BLUE_L = pal(41), pal(42)           # painted field, left half: ochre (never a team colour, art direction §2.1)
RED_D, RED_L = pal(21), pal(22)             # painted field, right half: dark umber
GOLD_L = 0.4 * pal(19) + 0.6 * pal(44)      # rivets
for _c in (RIM_D, RIM_L, BOSS_D, BOSS_L, BLUE_D, BLUE_L, RED_D, RED_L, GOLD_L):
    _c[3] = 1.0
PLANK_W = 0.0417                            # board width (six boards over the 0.25 width)
SOCKET2_C = (0.0, -0.080)                   # small setting (z, y) on the plate below the boss ring


def plank_seam(z):
    """0 on a seam between two boards, 1 in the middle of a board."""
    u = ((z + W) / PLANK_W) % 1.0
    return smooth(min(u, 1.0 - u) / 0.07)


def bend(z, y):
    return BMAX * max(0.0, 1 - 0.6 * (z / W) ** 2 - 0.4 * ((y - CY) / 0.158) ** 2)


def back_x(z, y):
    return BACK0 + bend(z, y)


def front_x(z, y):
    return back_x(z, y) + THICK


# ---------------------------------------------------------------- outline
def closed_chaikin(pts, n):
    for _ in range(n):
        q = []
        for a, b in zip(pts, np.roll(pts, -1, axis=0)):
            q += [0.75 * a + 0.25 * b, 0.25 * a + 0.75 * b]
        pts = np.array(q)
    return pts


def outline_poly():
    top_r = bez([(0.0, 0.180), (0.05, 0.182), (W, 0.168)], 10)
    side_r = [(W, 0.168), (W, 0.035)]
    bot_r = bez([(W, 0.035), (W, -0.045), (0.05, -0.098), (0.0, -0.128)], 22)
    right = top_r + side_r[1:] + bot_r[1:]            # top middle -> tip on the right (z > 0), going down
    left = [(-z, y) for z, y in right[::-1]]           # tip -> top middle on the left
    pts = np.array(right + left[1:-1])                 # counter-clockwise? (z, y): right side going down = clockwise
    pts = pts[::-1]                                    # make it counter-clockwise in the (z, y) plane
    return closed_chaikin(pts, 2)


def offset_poly(poly, d):
    """Inward offset of a counter-clockwise convex-ish polygon by d (mitre, clamped)."""
    nxt, prv = np.roll(poly, -1, axis=0), np.roll(poly, 1, axis=0)
    e1, e0 = nxt - poly, poly - prv
    e1 /= np.linalg.norm(e1, axis=1)[:, None]
    e0 /= np.linalg.norm(e0, axis=1)[:, None]
    n1 = np.stack([-e1[:, 1], e1[:, 0]], 1)            # left normal = inward for ccw
    n0 = np.stack([-e0[:, 1], e0[:, 0]], 1)
    n = n0 + n1
    n /= np.linalg.norm(n, axis=1)[:, None]
    k = np.maximum((n * n1).sum(1), 0.5)
    return poly + n * (d / k)[:, None]


def resample_closed(poly, m):
    p = np.vstack([poly, poly[:1]])
    seg = np.linalg.norm(np.diff(p, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    ss = np.linspace(0, s[-1], m, endpoint=False)
    return np.stack([np.interp(ss, s, p[:, 0]), np.interp(ss, s, p[:, 1])], 1)


def ray_radius(poly, theta):
    """Distance from (0, CY) to the polygon along the direction theta (in the (z, y) plane)."""
    c = np.array([0.0, CY])
    d = np.array([math.cos(theta), math.sin(theta)])
    a, b = poly, np.roll(poly, -1, axis=0)
    e = b - a
    den = d[0] * (-e[:, 1]) - d[1] * (-e[:, 0])
    ac = a - c
    with np.errstate(divide="ignore", invalid="ignore"):
        t = (ac[:, 0] * (-e[:, 1]) - ac[:, 1] * (-e[:, 0])) / den
        u = (d[0] * ac[:, 1] - d[1] * ac[:, 0]) / den
    ok = (t > 0) & (u >= 0) & (u <= 1)
    return float(t[ok].min())


# ---------------------------------------------------------------- parts
def build_plate(P1):
    """Front + back skins joined at the edge ring under the rim; polar grids around the boss, with the V groove."""
    bm = bmesh.new()
    thetas = [2 * math.pi * k / NA for k in range(NA)]
    R1 = [ray_radius(P1, t) for t in thetas]

    def pos(r, k):
        z = r * math.cos(thetas[k])
        y = CY + r * math.sin(thetas[k])
        return z, y

    def grid(layers, xfun):
        rows = []
        for item in layers:
            if item == 0:
                z, y = 0.0, CY
                rows.append([bm.verts.new((xfun(z, y, 0.0), y, z))])
                continue
            row = []
            for k in range(NA):
                r = item(k) if callable(item) else item
                z, y = pos(r, k)
                row.append(bm.verts.new((xfun(z, y, r), y, z)))
            rows.append(row)
        for a, b in zip(rows, rows[1:]):
            for k in range(NA):
                k2 = (k + 1) % NA
                if len(a) == 1:
                    bm.faces.new((a[0], b[k2], b[k]))
                else:
                    bm.faces.new((a[k], a[k2], b[k2], b[k]))
        return rows

    def dip(r):
        return -GDEPTH * max(0.0, 1 - abs(r - RG) / GHW)

    def fx(z, y, r):
        return front_x(z, y) + dip(r)

    outer = [lambda k, f=f, c0=0.095: c0 + f * (R1[k] - c0) for f in (0.2, 0.4, 0.6, 0.8, 1.0)]
    fr = grid([0, 0.052, 0.0645, 0.0745, RG - GHW, RG, RG + GHW, 0.095] + outer[:-1] + [lambda k: R1[k]], fx)
    bk = grid([0, 0.05, 0.095, lambda k: 0.095 + 0.5 * (R1[k] - 0.095), lambda k: R1[k]], lambda z, y, r: back_x(z, y))
    a, b = fr[-1], bk[-1]
    for k in range(NA):
        k2 = (k + 1) % NA
        bm.faces.new((b[k], b[k2], a[k2], a[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = new_obj("plate", mesh_from_bm(bm, "plate"))

    def col(co, n):
        z, y, x = co.z, co.y, co.x
        h = vnoise(y, z, 0.0105, 11) * 0.6 + vnoise(y, z + 0.4 * x / 0.01, 0.0055, 12) * 0.4
        r = math.hypot(z, y - CY)
        seam = plank_seam(z)
        if x < back_x(z, y) + THICK * 0.5:                      # back: bare boards
            c = lerp_c(WOOD_M, WOOD_L, 0.2 + 0.5 * h)
            return lerp_c(WOOD_D, c, 0.35 + 0.65 * seam)
        d_, l_ = (BLUE_D, BLUE_L) if z > 0.0 else (RED_D, RED_L)    # per pale: z > 0 ochre, z < 0 umber
        c = lerp_c(d_, l_, 0.25 + 0.55 * h)
        c = lerp_c(c, l_, 0.18 * smooth((abs(z) - 0.02) / 0.06))
        c = lerp_c(0.45 * d_ + 0.1 * pal(1), c, 0.45 + 0.55 * seam)  # board seams
        c[3] = 1.0
        if abs(z) < 0.0035:                                          # thin gold line on the pale
            return lerp_c(c, GOLD_L, 0.85)
        if abs(r - RG) < GHW * 1.2:
            c = lerp_c(c, pal(1), 0.6)
        elif r < RG - 0.003:
            c = lerp_c(c, pal(1), 0.3)                               # darker dish around the boss
        return c
    set_colours(ob, col)
    return ob


def build_rim(P1):
    m = 72
    i = int(np.argmin(P1[:, 1]))                                  # start exactly at the tip (symmetric sampling)
    j = (i + 1) % len(P1) if P1[(i + 1) % len(P1), 1] < P1[i - 1, 1] else (i - 1) % len(P1)
    a, b = sorted((i, j)) if abs(i - j) == 1 else (len(P1) - 1, 0)
    tip = 0.5 * (P1[a] + P1[b])
    P1r = np.vstack([tip[None], np.roll(P1, -(a + 1) % len(P1), axis=0)]) if b == (a + 1) % len(P1) else P1
    path = resample_closed(P1r, m)
    bm = bmesh.new()
    segs = 8
    rings = []
    for i, p in enumerate(path):
        t = path[(i + 1) % m] - path[i - 1]
        t /= np.linalg.norm(t)
        nz, ny = t[1], -t[0]                      # in-plane outward (clockwise-normal of a ccw path)
        xc = back_x(p[0], p[1]) + THICK / 2
        ring = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            ring.append(bm.verts.new((xc + RIM_B * math.sin(a), p[1] + ny * RIM_A * math.cos(a), p[0] + nz * RIM_A * math.cos(a))))
        rings.append(ring)
    for i in range(m):
        a, b = rings[i], rings[(i + 1) % m]
        for k in range(segs):
            bm.faces.new((a[k], a[(k + 1) % segs], b[(k + 1) % segs], b[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = new_obj("rim", mesh_from_bm(bm, "rim"))

    def col(co, n):
        z, y, x = co.z, co.y, co.x
        top = (x - (back_x(z, y) + THICK / 2)) / RIM_B
        h = vnoise(y, z, 0.012, 31) * 0.6 + vnoise(y, z, 0.006, 32) * 0.4
        return lerp_c(RIM_D, RIM_L, min(max(0.38 + 0.38 * top + 0.3 * (h - 0.5), 0.0), 1.0))
    set_colours(ob, col)
    return ob, path


def build_rivets(path):
    obs = []
    m = len(path)
    n = 13
    start = int(np.argmin(path[:, 1]))              # the tip
    for j in range(n):
        p = path[(start + round((j + 0.5) * m / n)) % m]
        bm = lathe([(0.0, 0.0), (0.0063, 0.0), (0.0078, 0.0014), (0.0072, 0.0034), (0.0048, 0.0052), (0.0, 0.0058)], 8,
                   axis="X", close_ends=False)
        xt = back_x(p[0], p[1]) + THICK / 2 + RIM_B - 0.0016
        bmesh.ops.translate(bm, vec=(xt, p[1], p[0]), verts=bm.verts)
        obs.append(new_obj("rivet", mesh_from_bm(bm, "rivet")))
    for ob in obs:
        set_colours(ob, lambda co, n: lerp_c(GOLD_L, pal(20), 0.15 + 0.25 * vnoise(co.y, co.z, 0.004, 44)))
    return obs


def build_boss_and_setting():
    prof = [(0.0625, 0.036), (0.0625, 0.0415), (0.0615, 0.0455), (0.0585, 0.0515), (0.0540, 0.0560), (0.0480, 0.0588),
            (0.0420, 0.0598), (0.0375, X_S), (SOCKET_R, X_S), (SOCKET_R, FLOOR_S), (0.0, FLOOR_S)]
    prof = [(r, min(h, X_S)) if i < 7 else (r, h) for i, (r, h) in enumerate(prof)]
    bb = lathe(prof, 36, axis="X", close_ends=False)
    bmesh.ops.translate(bb, vec=(0, CY, 0), verts=bb.verts)
    boss = new_obj("boss", mesh_from_bm(bb, "boss"))

    def bcol(co, n):
        rad = math.hypot(co.y - CY, co.z)
        h = vnoise(co.y, co.z, 0.01, 41)
        if rad < SOCKET_R + 0.001 and co.x < X_S - 0.001:
            c = lerp_c(BOSS_D, BOSS_L, 0.05 + 0.2 * h) * 0.75
            c[3] = 1.0
            return c
        return lerp_c(lerp_c(BOSS_D, BOSS_L, 0.35 + 0.55 * smooth((co.x - 0.045) / 0.015)), pal(6), 0.12 * h)
    set_colours(boss, bcol)
    M = Matrix.Translation((FLOOR_S - STONE_SINK, CY, 0.0)) @ Matrix.Rotation(-math.pi / 2, 4, "X")
    rim_o, claws = setting_parts(M, X_S - FLOOR_S + STONE_SINK)
    add_node("socket_rune_a", M)
    for ob in [rim_o] + claws:
        set_colours(ob, lambda co, n: lerp_c(BOSS_D, BOSS_L, 0.5 + 0.35 * smooth((co.x - X_S) / 0.006) + 0.1 * (vnoise(co.y, co.z, 0.006, 43) - 0.5)))
    return [boss, rim_o] + claws


def build_socket2():
    """Small second setting on the plate below the ring groove (own mesh rune_socket2)."""
    z, y = SOCKET2_C
    h0 = front_x(z, y)
    eps = 0.01                                            # follow the plate slope along y
    tilt = math.atan2(front_x(z, y + eps) - front_x(z, y - eps), 2 * eps)
    M0 = Matrix.Translation((h0 - STONE_SINK, y, z)) @ Matrix.Rotation(tilt, 4, "Z") @ Matrix.Rotation(-math.pi / 2, 4, "X")
    rim_o, claws = setting_parts(M0, STONE_SINK, SOCKET2_F, 16, 1)
    add_node("socket_rune_b", M0 @ Matrix.Diagonal((SOCKET2_F, SOCKET2_F, SOCKET2_F, 1.0)))
    return make_socket2([rim_o] + claws, lambda co, n: lerp_c(BOSS_D, BOSS_L, 0.55 + 0.3 * smooth((co.x - h0) / 0.003)
                                                              + 0.1 * (vnoise(co.y, co.z, 0.006, 43) - 0.5)))


def build_channel():
    """Thin V strip lying in the ring groove; second UV map `fill` runs clockwise (seen from +X) from the bottom."""
    bm = bmesh.new()
    hw = GHW * 0.82
    cols = []
    for i in range(NA + 1):                          # the last column duplicates the first (UV seam at the bottom)
        phi = -math.pi / 2 + 2 * math.pi * i / NA
        row = []
        for off, kind in ((-hw, "e"), (0.0, "a"), (hw, "e")):
            r = RG + off
            z, y = r * math.cos(phi), CY + r * math.sin(phi)
            s = front_x(z, y)
            x = s - GDEPTH + GDEPTH * (hw / GHW) + CH_LIFT * 0.7 if kind == "e" else s - GDEPTH + CH_LIFT
            row.append(bm.verts.new((x, y, z)))
        cols.append(row)
    for a, b in zip(cols, cols[1:]):
        for k in range(2):
            bm.faces.new((a[k], a[k + 1], b[k + 1], b[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.x < 0:
            f.normal_flip()
    uv0 = bm.loops.layers.uv.new("uv0")
    uv1 = bm.loops.layers.uv.new("fill")
    idx = {}
    for i, c in enumerate(cols):
        for v in c:
            idx[v.index] = i / NA
    for f in bm.faces:
        for l in f.loops:
            l[uv0].uv = (0.0, 0.0)
            l[uv1].uv = (float(idx[l.vert.index]), 0.0)
    ob = new_obj("chan", mesh_from_bm(bm, "chan"))
    set_colours(ob, lambda co, n: GLOW_DIM)
    return ob


def build_back():
    parts = []
    xg, hl = 0.004, 0.052
    # grip bar (leather wrap) along Z
    prof = [(0.0, -hl), (0.0074, -hl), (0.0088, -hl + 0.002)]
    nrid = 16
    for i in range(nrid * 4 + 1):
        z = -hl + 0.004 + (2 * hl - 0.008) * i / (nrid * 4)
        prof.append((0.0078 + 0.0012 * (0.5 + 0.5 * math.cos(2 * math.pi * i / 4)), z))
    prof += [(0.0088, hl - 0.002), (0.0074, hl), (0.0, hl)]
    prof = [(r, h) for r, h in prof]
    bar = new_obj("grip", mesh_from_bm(lathe(prof, 10, axis="Z"), "grip"))
    for v in bar.data.vertices:
        v.co.x += xg
    set_colours(bar, lambda co, n: lerp_c(LEATHER_D, LEATHER_M, 0.5 + 0.5 * math.cos(2 * math.pi * (co.z / (2 * hl - 0.008) * nrid)) * 0.8
                                          + 0.2 * vnoise(co.z * 50, math.atan2(co.y, co.x - xg), 1, 5)))
    parts.append(bar)
    for sgn in (-1, 1):
        zb = sgn * (hl + 0.001)
        xb = back_x(zb, 0.0) + 0.0015
        x0 = xg - 0.0098
        bm = box_bm(((x0 + xb) / 2, 0, zb), (xb - x0, 0.026, 0.0115), bevel=0.0042, segs=2)
        ob = new_obj("bracket", mesh_from_bm(bm, "bracket"))
        set_colours(ob, lambda co, n: lerp_c(STEEL_D, STEEL_M, 0.35 + 0.4 * vnoise(co.y, co.z, 0.008, 51)))
        parts.append(ob)
    # arm strap: arched leather band across Z
    ys, hz, hy, ht = 0.092, 0.056, 0.0125, 0.0030
    bm = bmesh.new()
    rings = []
    nz = 24
    xa = 0.0115
    for i in range(nz + 1):
        z = -hz + 2 * hz * i / nz
        xb = back_x(z, ys)
        xc = xa + (xb - xa) * (abs(z) / hz) ** 3.2
        ring = []
        for k in range(8):
            a = 2 * math.pi * k / 8
            ring.append(bm.verts.new((xc + ht * math.sin(a) * 1.15, ys + hy * math.cos(a) ** 1 * (1 if abs(math.cos(a)) < 0.99 else 1), z)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for k in range(8):
            bm.faces.new((a[k], a[(k + 1) % 8], b[(k + 1) % 8], b[k]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    strap = new_obj("strap", mesh_from_bm(bm, "strap"))
    set_colours(strap, lambda co, n: lerp_c(LEATHER_M, LEATHER_L, 0.25 + 0.3 * vnoise(co.z, co.y, 0.01, 61)))
    parts.append(strap)
    for sgn in (-1, 1):
        zb = sgn * (hz + 0.002)
        xb = back_x(zb, ys) + 0.0015
        x0 = xb - 0.0075
        bm = box_bm(((x0 + xb) / 2, ys, zb), (xb - x0, 0.030, 0.0105), bevel=0.0038, segs=2)
        ob = new_obj("bracket", mesh_from_bm(bm, "bracket"))
        set_colours(ob, lambda co, n: lerp_c(STEEL_D, STEEL_M, 0.35 + 0.4 * vnoise(co.y, co.z, 0.008, 52)))
        parts.append(ob)
    return parts


def shield():
    poly = outline_poly()
    P1 = offset_poly(poly, RIM_A)
    plate = build_plate(P1)
    rim, path = build_rim(P1)
    parts = [plate, rim] + build_rivets(path) + build_boss_and_setting() + build_back()
    metal = join(parts, "shield")
    shade(metal, 32)
    chan = build_channel()
    sock2 = build_socket2()
    return metal, chan, sock2


def make_materials(metal, chan, sock2):
    m = bpy.data.materials.new("HC_Vertex")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.8
    metal.data.name = "shield"
    metal.data.materials.clear()
    metal.data.materials.append(m)
    finish_socket2(sock2)
    for ob, name in ((chan, "rune_channel"),):
        ob.data.name = ob.name = name
        mm = bpy.data.materials.new(name)
        mm.use_nodes = True
        b = mm.node_tree.nodes["Principled BSDF"]
        a = mm.node_tree.nodes.new("ShaderNodeVertexColor")
        a.layer_name = "Col"
        mm.node_tree.links.new(a.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.5
        ob.data.materials.append(mm)


for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
os.makedirs(OUT, exist_ok=True)
metal, chan, sock2 = shield()
make_materials(metal, chan, sock2)
path = os.path.join(OUT, "shield.glb")
bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False, export_vertex_color="ACTIVE",
                          export_animations=False, export_materials="EXPORT")
tris = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in (metal, chan, sock2)}
print(f"[hc] {path}: {sum(tris.values())} triangles {tris}", flush=True)
