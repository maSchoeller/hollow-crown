"""Hollow Crown - signature weapons and relics (story 16.8): the group models of weapons-v2 plus one feature each.

blender -b --factory-startup --python tools/art/blender_weapon_signatures.py -- [<item id> ...]

Writes art/models/weapons-v2/sig/<itemId>.glb for the 14 pieces below (default: all). Each weapon runs the build of its group script
(axe: blender_weapons_v2.py, sword/lance/shield/bow/dagger/lute: blender_weapon_<group>.py; the scripts are executed up to their export
tail, nothing in them is changed), recolours the wrap / wood / steel by overriding the palette constants of the group, adds a FEATURE
mesh that is joined into the metal mesh (named like the base group model) and exports. The contract of the group model stays
untouched: metal mesh with HC_Vertex, `rune_channel` (UV 1 `fill`), `rune_socket2`, nodes `socket_rune_a*` / `socket_rune_b*`, no
`rune_stone`; the frame is the one of the group model; features never lie over a setting or a channel. Triangle budget 8 500 per file
(the base parts are thinned with a planar dissolve / light decimation where the feature does not fit).

  tinder              axe      charred notch cut into the edge (real boolean cut, ember glow), ember-orange wrap
  bounty              bow      crossbow: the bow limbs as prod, wooden stock with nut, gold coin pommel
  wolf_fang           lance    curved ivory wolf-tooth spearhead, two fang barbs, grey fur wrap with tufts
  little_hands        shield   three raised child hand prints on the board around the ring groove
  rowenas_lance       lance    two winged fins below the head
  wasp_sting          bow      crossbow with a yellow/black ringed abdomen stock and a long sting bolt
  gold_hook           sword    golden boarding hook at the +X guard end, sabre curve of the blade
  dravns_oath         sword    black oath cloth around the +X guard arm with a tail, seal ring on the pommel faces
  magpie              dagger   magpie head as pommel, black/white wrap
  white_wolf          bow      white wolf head on the upper limb tip, silver tint
  heirloom            lance    engraved family mark (plaque) on the lower shaft, worn pale wrap
  final_curtain       lute     crimson curtain corner with a gold tassel at the pegbox
  pact_warden_shield  shield   pact seal ring (gold, with sigil teeth) around the boss, inside the ring groove
  dragon_ember        relic    dragon scale pendant (NOT a weapon): scale plate with setting, short channel `fill` around the scale,
                               chain upward; origin = pendant centre, +X = dome side, +Z = chain; mesh `dragon_ember`, node `socket_rune_a`

Colours come from art/palette/hollow-64.hex; team colours (blue, red, green) stay off the large areas.
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUTDIR = os.path.join(ROOT, "art", "models", "weapons-v2", "sig")
IDS = [a for a in (sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []) if not a.startswith("--")]


def run_src(path, cut, ns, last=False):
    """Execute a script's source up to (not including) the marker `cut` in the dict `ns`."""
    s = open(path, encoding="utf-8").read()
    if cut:
        s = s[:s.rindex(cut)] if last else s[:s.index(cut)]
    exec(compile(s, os.path.basename(path), "exec"), ns)


# --- my own helper namespace = axe kit + shared kit (sweep, tube, channel, finish ...)
K = {"__file__": os.path.join(HERE, "blender_weapons_v2.py"), "__name__": "hc_sig_kit"}
run_src(os.path.join(HERE, "blender_weapons_v2.py"), "os.makedirs(OUT", K)
run_src(os.path.join(HERE, "blender_weapons_v2_kit.py"), None, K)
K["OUT"] = OUTDIR
globals().update({k: v for k, v in K.items() if not k.startswith("__") and k not in ("OUT", "HERE", "ROOT", "argv")})

# ------------------------------------------------------------------------------------------------ palette
CHAR = (pal(1), pal(2), pal(3))
EMBER = (pal(15), pal(16), pal(17))
GOLD = (pal(18), pal(19), pal(44))
IVORY = (pal(9), pal(10), pal(6))
CRIM = (pal(45), pal(46), pal(47))
YELLOW = (pal(19), pal(20))
SILVER = (pal(5), pal(27), pal(28))
FUR_W = (pal(5), pal(6))
BRASS = (pal(18), pal(19))
for _t in (CHAR, EMBER, GOLD, IVORY, CRIM, YELLOW, SILVER, FUR_W, BRASS):
    for _c in _t:
        _c[3] = 1.0


def rc(D, L, seed=0, k=0.5):
    """Colour fn: ramp D..L by the normal and a little noise."""
    def f(co, n):
        return lerp_c(D, L, min(max(k + 0.3 * n.z + 0.2 * n.x + 0.3 * (vnoise(co.y, co.z, 0.006, seed) - 0.5), 0.0), 1.0))
    return f


def flat(c):
    return lambda co, n: c


def feat(ob, fn, angle=40):
    shade(ob, angle)
    set_colours(ob, fn)
    return ob


# ------------------------------------------------------------------------------------------------ geometry helpers
def unit3(v):
    v = np.asarray(v, float)
    return v / max(np.linalg.norm(v), 1e-12)


def basis(fwd, up):
    """Matrix with columns side, up, fwd (local x = side = up x fwd, y = up, z = fwd)."""
    f = unit3(fwd)
    u = np.asarray(up, float)
    u = unit3(u - f * np.dot(u, f))
    s = np.cross(u, f)
    return Matrix(((s[0], u[0], f[0]), (s[1], u[1], f[1]), (s[2], u[2], f[2]))).to_4x4()


def ell3(c, radii, rot=None, segs=10, name="ell"):
    """Ellipsoid: local radii (x, y, z), `rot` = 4x4 basis (local -> world), centre c."""
    r = 1.0
    prof = [(0.0, -r)] + [(r * math.sin(math.radians(a)), -r * math.cos(math.radians(a))) for a in range(36, 145, 36)] + [(0.0, r)]
    bm = lathe(prof, segs, axis="Z", close_ends=False)
    M = Matrix.Translation(tuple(c)) @ (rot if rot is not None else Matrix.Identity(4)) @ Matrix.Diagonal((radii[0], radii[1], radii[2], 1.0))
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, mesh_from_bm(bm, name))


def torus(c, R, r, axis=(0, 0, 1), segs=16, rsegs=6, squash=1.0, name="torus"):
    """Ring of major radius R, minor radius r around the direction `axis` through c (squash scales the minor radius along the axis)."""
    bm = bmesh.new()
    rings = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        ring = []
        for k in range(rsegs):
            b = 2 * math.pi * k / rsegs
            ring.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * squash * math.sin(b))))
        rings.append(ring)
    for i in range(segs):
        a, b = rings[i], rings[(i + 1) % segs]
        for k in range(rsegs):
            k2 = (k + 1) % rsegs
            bm.faces.new((a[k], a[k2], b[k2], b[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ax = unit3(axis)
    t = np.array([1.0, 0, 0]) if abs(ax[0]) < 0.9 else np.array([0, 1.0, 0])
    sdir = unit3(np.cross(ax, t))
    M = basis(ax, sdir)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(tuple(c)) @ M, verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, mesh_from_bm(bm, name))


def prism(pts, thick, mp, name="prism"):
    """Solid from a 2D polygon `pts` [(u, v)] extruded by `thick`: mp(u, v, w) -> 3D point, w = 0 .. thick."""
    bm = bmesh.new()
    lo = [bm.verts.new(tuple(mp(u, v, 0.0))) for u, v in pts]
    hi = [bm.verts.new(tuple(mp(u, v, thick))) for u, v in pts]
    n = len(pts)
    bm.faces.new(lo[::-1])
    bm.faces.new(hi)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, mesh_from_bm(bm, name))


def band(c, axis, r, h, ratio=(1.0, 1.0), segs=14, name="band", grow=0.0012):
    """Short ring (hoop) around `axis` through c: radius r, height h along the axis, elliptic by `ratio` (local x, y)."""
    prof = [(r - grow, -h / 2), (r, -h / 2 + 0.0008), (r, h / 2 - 0.0008), (r - grow, h / 2)]
    bm = lathe(prof, segs, axis="Z", close_ends=False)
    ax = unit3(axis)
    t = np.array([1.0, 0, 0]) if abs(ax[0]) < 0.9 else np.array([0, 1.0, 0])
    M = basis(ax, unit3(np.cross(ax, t)))
    bmesh.ops.transform(bm, matrix=Matrix.Translation(tuple(c)) @ M @ Matrix.Diagonal((ratio[0], ratio[1], 1.0, 1.0)), verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, mesh_from_bm(bm, name))


def tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def thin(ob, target):
    """Reduce `ob` to about `target` triangles: planar dissolve first, then a light collapse decimation."""
    if tris(ob) <= target:
        return
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(1.0), verts=bm.verts, edges=bm.edges, use_dissolve_boundaries=False)
    bm.to_mesh(ob.data)
    bm.free()
    ob.data.update()
    n = tris(ob)
    if n > target:
        select_only(ob)
        m = ob.modifiers.new("d", "DECIMATE")
        m.ratio = max(target / n, 0.3)
        m.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=m.name)
    print(f"[hc] thinned {ob.name}: -> {tris(ob)} (target {target})", flush=True)


def tint_region(ob, centre, radius, fn, dims=(1, 2)):
    """Recolour every corner whose vertex lies within `radius` of `centre` (2D over axes `dims`): fn(colour, d01) -> colour."""
    me = ob.data
    ca = me.color_attributes.active_color
    a, b = dims
    for li, loop in enumerate(me.loops):
        co = me.vertices[loop.vertex_index].co
        d = math.hypot(co[a] - centre[0], co[b] - centre[1])
        if d < radius:
            c = np.array(ca.data[li].color[:])
            ca.data[li].color = tuple(float(x) for x in fn(c, d / radius))


def override(ns, **kw):
    for k, v in kw.items():
        ns[k] = v
        if "_ns" in ns:
            ns["_ns"][k] = v


def ramp3(t3):
    return dict(D=t3[0], M=t3[1], L=t3[2] if len(t3) > 2 else t3[1])


# ------------------------------------------------------------------------------------------------ feature builders
# Every builder gets the context `X` (namespace of the group script + the metal if it is a single mesh) and returns the list of
# coloured feature objects in the OPERATING frame of the group (see the dict GROUPS).
def f_tinder(X):
    ns = X["ns"]
    edge = ns["bez"]([ns["T_TIP"], (-0.215, 0.395), (-0.205, 0.16), ns["B_TIP"]], 40)
    ey, ez = edge[26]
    X["notch"] = (ey, ez)
    # a V notch cut through the blade at the edge (cut on the loose plate part, then rejoined)
    wedge = prism([(ey - 0.035, ez - 0.030), (ey + 0.046, ez), (ey - 0.035, ez + 0.030)], 0.06, lambda u, v, w: (w - 0.03, u, v), "notch")
    X["metal"] = cut_plate(X["metal"], wedge)
    glow = lambda c, d: lerp_c(lerp_c(EMBER[1], EMBER[2], 0.3), CHAR[0], min(max((d - 0.35) / 0.4, 0.0), 1.0)) if d < 0.5 else lerp_c(CHAR[0], c, min(max((d - 0.5) / 0.5, 0.0), 1.0))
    tint_region(X["metal"], (ey, ez), 0.048, glow)
    return []


def cut_plate(metal, cutter):
    """Boolean-cut the loose part of `metal` that reaches furthest to -Y (the axe plate), keep the rest."""
    select_only(metal)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")
    pieces = [o for o in bpy.context.scene.objects if o.type == "MESH" and o.name.startswith(metal.name)]
    plate = min(pieces, key=lambda o: min(v.co.y for v in o.data.vertices))
    boolean(plate, cutter)
    return join(pieces, metal.name)


def crossbow(X, kind):
    """Crossbow on the bow frame (straight, pre-tilt: limbs along Z, string side +Y): stock from the limb centre to +Y."""
    wood = lambda co, n: lerp_c(WOOD_M, WOOD_L, min(max(0.3 + 0.4 * vnoise(co.y, co.x, 0.02, 5) + 0.2 * n.z, 0.0), 1.0))
    out = []
    if kind == "bounty":
        path = np.array([(0.0, y, 0.0) for y in np.linspace(-0.018, 0.272, 12)])
        stock = sweep(path, lambda t: 0.0135 - 0.003 * t, lambda t: 0.0125 - 0.002 * t, 10, (1, 0, 0), SQ(3.2), True, "stock", 0.004)
        out.append(feat(stock, wood))
        # leather butt cap and coin pommel
        out.append(feat(ell3((0, 0.262, 0), (0.0125, 0.012, 0.0135), None, 8, "butt"), rc(LEATHER_D, LEATHER_M, 3)))
        coin = lathe([(0.0, -0.0036), (0.0205, -0.0036), (0.0225, -0.0014), (0.0225, 0.0014), (0.0205, 0.0036), (0.0, 0.0036)], 24, close_ends=False)
        bmesh.ops.transform(coin, matrix=Matrix.Translation((0, 0.292, 0)) @ Matrix.Rotation(math.radians(90), 4, "Y"), verts=coin.verts)
        bmesh.ops.recalc_face_normals(coin, faces=coin.faces)
        out.append(feat(new_obj("coin", mesh_from_bm(coin, "coin")), rc(GOLD[0], GOLD[2], 7, 0.65)))
        for sx in (0, 1):   # embossed cross on the coin faces
            for bw, bh in ((0.0035, 0.015), (0.015, 0.0035)):
                bm = box_bm((0.0, 0.0, 0.0), (0.0028, bw, bh), 0.0004, 1)
                bmesh.ops.translate(bm, vec=((0.0048 if sx == 0 else -0.0048), 0.292, 0.0), verts=bm.verts)
                out.append(feat(new_obj("star", mesh_from_bm(bm, "star")), flat(GOLD[2])))
    else:  # wasp_sting: slim abdomen stock with rings
        path = np.array([(0.0, y, 0.0) for y in np.linspace(-0.018, 0.300, 16)])
        bulge = lambda t: 0.4 + 0.6 * math.sin(math.pi * min(t * 1.25, 1.0)) if t < 0.8 else 0.4 * (1 - (t - 0.8) / 0.2) + 0.05
        stock = sweep(path, lambda t: 0.006 + 0.0085 * bulge(t), lambda t: 0.006 + 0.0085 * bulge(t), 10, (1, 0, 0), None, True, "stock", 0.012)

        def ringed(co, n):
            ph = (co.y + 0.018) / 0.318
            return YELLOW[1] if int(ph * 11) % 2 == 0 else CHAR[0]
        out.append(feat(stock, ringed))
        # long sting bolt in the flight groove on top (+X), pointing to -Y; yellow/black fletching at the back
        bolt = tube((0.0125, 0.215, 0.0), (0.0125, -0.30, 0.0), 0.0032, 0.0032, 6, "bolt", 0.0)
        out.append(feat(bolt, lambda co, n: CHAR[1] if int((co.y + 0.30) / 0.03) % 2 == 0 else YELLOW[0]))
        tip = tube((0.0125, -0.30, 0.0), (0.0125, -0.395, 0.0), 0.0058, 0.0006, 6, "sting", 0.0)
        out.append(feat(tip, rc(CHAR[0], CHAR[2], 11)))
        for k in range(3):
            a = 2 * math.pi * k / 3 + math.pi / 2
            p0 = np.array((0.0125, 0.20, 0.0))
            p1 = p0 + np.array((0.012 * math.cos(a), 0.0, 0.012 * math.sin(a))) + (0, 0.02, 0)
            out.append(feat(tube(p0, p1, 0.0024, 0.0008, 4, "vane"), flat(YELLOW[1])))
    # nut (latch) on the string line
    nut = box_bm((0.013, 0.103, 0.0), (0.008, 0.016, 0.022), 0.003, 1)
    out.append(feat(new_obj("nut", mesh_from_bm(nut, "nut")), rc(BOSS_D, BOSS_L, 13)))
    return out


def f_bounty(X):
    return crossbow(X, "bounty")


def f_wasp(X):
    return crossbow(X, "wasp")


def wolf_head(ctr, fwd, up, s, fur, name="wolf"):
    """Wolf head (profile along `fwd`, ears towards `up`, eyes on +/-X) of scale s."""
    M = basis(fwd, up)
    out = []
    out.append(feat(ell3(ctr, (0.0125 * s, 0.0125 * s, 0.0155 * s), M, 10, "skull"), rc(fur[0], fur[1], 21, 0.6)))
    sn = Matrix.Translation(tuple(ctr)) @ M
    p0 = (sn @ Vector((0, -0.002 * s, 0.008 * s)))[:]
    p1 = (sn @ Vector((0, -0.004 * s, 0.040 * s)))[:]
    out.append(feat(tube(p0, p1, 0.0095 * s, 0.0050 * s, 8, "snout"), rc(fur[0], fur[1], 22, 0.65)))
    out.append(feat(ell3((sn @ Vector((0, -0.001 * s, 0.0415 * s)))[:], (0.0045 * s, 0.0040 * s, 0.0045 * s), M, 6, "nose"), flat(CHAR[0])))
    for sg in (-1, 1):
        a = (sn @ Vector((sg * 0.0075 * s, 0.009 * s, -0.003 * s)))[:]
        b = (sn @ Vector((sg * 0.0095 * s, 0.032 * s, -0.012 * s)))[:]
        out.append(feat(tube(a, b, 0.0058 * s, 0.0008 * s, 5, "ear"), rc(fur[0], fur[1], 23, 0.55)))
        e = (sn @ Vector((sg * 0.0112 * s, 0.003 * s, 0.014 * s)))[:]
        out.append(feat(ell3(e, (0.0016 * s, 0.0026 * s, 0.0032 * s), M, 6, "eye"), flat(CHAR[0])))
    return out


def f_white_wolf(X):
    ns = X["ns"]
    HALF = ns["HALF"]
    tip = np.array([0.0, ns["ybow"](HALF), HALF])
    tg = unit3(ns["tang"](HALF))
    ctr = tip + tg * 0.026
    out = wolf_head(ctr, tg, (0, 1, 0), 1.25, (pal(5) * 0.5 + pal(6) * 0.5, pal(6)))
    # silver collar where the head meets the limb
    out.append(feat(band(tip + tg * 0.004, tg, 0.0148, 0.007, (1, 1), 14, "collar"), rc(SILVER[0], SILVER[2], 5, 0.6)))
    return out


def f_wolf_fang(X):
    ns = X["ns"]
    ZR, L = ns["ZR"], ns["L_HEAD"]
    lw, lh = ns["leaf_w"], ns["leaf_h"]
    s0 = 0.84
    z0 = ZR + s0 * L
    w0, h0 = lw(s0), lh(s0)
    pts = [(0.0, 0.034 * (u ** 2), z0 - 0.004 + 0.108 * u) for u in np.linspace(0, 1, 9)]
    path = np.array(pts)
    tooth = sweep(path, lambda t: (w0 + 0.0025) * (1 - t) ** 0.85 + 0.0006, lambda t: (h0 + 0.0035) * (1 - t) ** 0.85 + 0.0006, 10,
                  (1, 0, 0), None, True, "tooth", 0.002)
    out = [feat(tooth, rc(IVORY[0], IVORY[2], 31, 0.6))]
    for sg in (-1, 1):   # fang barbs at the collar, curving outwards and up
        pp = np.array([(0.0, sg * (0.040 + 0.045 * u ** 1.3), 0.378 - 0.004 + 0.075 * u) for u in np.linspace(0, 1, 7)])
        barb = sweep(pp, lambda t: 0.0095 * (1 - t) ** 0.9 + 0.0005, lambda t: 0.0075 * (1 - t) ** 0.9 + 0.0005, 8, (1, 0, 0), None, True, "barb", 0.002)
        out.append(feat(barb, rc(IVORY[0], IVORY[2], 32, 0.6)))
    # fur tufts at both ends of the grip wrap
    for z, dz in ((0.080, 1.0), (-0.078, -1.0)):
        for k in range(8):
            a = 2 * math.pi * (k + 0.5 * (dz > 0)) / 8
            p0 = np.array((0.0205 * math.cos(a), 0.0205 * math.sin(a), z - dz * 0.004))
            p1 = np.array((0.0300 * math.cos(a), 0.0300 * math.sin(a), z + dz * 0.026))
            out.append(feat(tube(p0, p1, 0.0045, 0.0007, 4, "tuft"), rc(FUR_W[0], FUR_W[1], 33 + k, 0.55)))
    return out


def f_rowena(X):
    pts = [(0.044, 0.338), (0.090, 0.340), (0.128, 0.356), (0.158, 0.384), (0.132, 0.386), (0.150, 0.416), (0.122, 0.414),
           (0.136, 0.448), (0.100, 0.424), (0.044, 0.392)]
    out = []
    for sg in (-1, 1):
        ob = prism([(sg * u, v) for u, v in pts][::sg], 0.0056, lambda u, v, w: (w - 0.0028, u, v), "fin")
        out.append(feat(ob, rc(IVORY[2], pal(20), 41, 0.6), 50))
    return out


def f_heirloom(X):
    out = []
    for z in (-0.118, -0.222):
        out.append(feat(band((0, 0, z), (0, 0, 1), 0.0222, 0.007, (1, 1), 16, "brassband", 0.0016), rc(BRASS[0], BRASS[1], 51, 0.55)))
    for sg in (-1, 1):
        cyl = lambda u: sg * math.sqrt(max(0.0204 ** 2 - u * u, 0.0))
        pl = prism([(0, 0.036), (0.0165, 0.0), (0, -0.036), (-0.0165, 0.0)], 0.0036, lambda u, v, w: (cyl(u) + sg * w * 0.9, u, -0.170 + v), "plaque")
        out.append(feat(pl, rc(BRASS[0], BRASS[1], 52, 0.6), 50))
        # engraved mark: stem, two branches and a dot, dark inlay
        for (u0, v0, u1, v1) in ((0, -0.024, 0, 0.020), (0, 0.000, -0.011, 0.015), (0, 0.000, 0.011, 0.015), (-0.008, -0.012, 0.008, -0.012)):
            d = np.array([u1 - u0, v1 - v0])
            ln_len = np.linalg.norm(d)
            nrm = np.array([-d[1], d[0]]) / ln_len * 0.0011
            q = [(u0 + nrm[0], v0 + nrm[1]), (u1 + nrm[0], v1 + nrm[1]), (u1 - nrm[0], v1 - nrm[1]), (u0 - nrm[0], v0 - nrm[1])]
            out.append(feat(prism(q, 0.0012, lambda u, v, w: (cyl(u) + sg * (0.0030 + w), u, -0.170 + v), "mark"), flat(CHAR[0]), 80))
        out.append(feat(ell3((cyl(0.0) + sg * 0.0036, 0.0, -0.170 + 0.0265), (0.0016, 0.0030, 0.0030), None, 6, "dot"), flat(CHAR[0])))
    return out


def f_little_hands(X):
    ns = X["ns"]
    fx, CY = ns["front_x"], ns["CY"]
    # right-hand outline (u right, v up), palm 1 wide, fingers up
    base = [(-0.42, -1.0), (0.42, -1.0), (0.56, -0.30), (0.90, 0.02), (1.14, 0.30), (1.02, 0.50), (0.74, 0.30), (0.60, 0.40)]
    for uc, w, h in ((0.43, 0.23, 1.42), (0.15, 0.23, 1.58), (-0.13, 0.23, 1.50), (-0.40, 0.20, 1.18)):
        base += [(uc + w / 2, 0.55), (uc + w / 2, h - 0.12), (uc, h), (uc - w / 2, h - 0.12), (uc - w / 2, 0.55)]
    base += [(-0.58, 0.40), (-0.52, -0.30)]
    out = []
    sc = 0.0175
    for (hz, hy, rot) in ((0.0, CY + 0.121, 0.0), (0.096, CY + 0.083, -35.0), (-0.096, CY + 0.083, 35.0)):
        a = math.radians(rot)
        pts = [(math.cos(a) * u - math.sin(a) * v, math.sin(a) * u + math.cos(a) * v) for u, v in base]
        x0 = fx(hz, hy)
        ob = prism([(u * sc, v * sc) for u, v in pts], 0.0042, lambda u, v, w: (fx(hz + u, hy + v) + w - 0.001, hy + v, hz + u), "hand")
        out.append(feat(ob, rc(pal(43), pal(44), 61, 0.6), 60))
    return out


def f_pact(X):
    ns = X["ns"]
    fx, CY = ns["front_x"], ns["CY"]
    out = []
    R0, R1 = 0.0655, 0.0765
    segs = 48
    bm = bmesh.new()
    rin, rout, rtop = [], [], []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        for lst, r, dz in ((rin, R0, 0.0016), (rout, R1, 0.0016), (rtop, (R0 + R1) / 2, 0.0036)):
            z, y = r * math.cos(a), CY + r * math.sin(a)
            lst.append(bm.verts.new((fx(z, y) + dz, y, z)))
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((rin[i], rtop[i], rtop[j], rin[j]))
        bm.faces.new((rtop[i], rout[i], rout[j], rtop[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.x < 0:
            f.normal_flip()
    out.append(feat(new_obj("seal", mesh_from_bm(bm, "seal")), rc(GOLD[0], GOLD[2], 71, 0.6)))
    # twelve sigil teeth (small raised wedges) on the ring
    for k in range(12):
        a = 2 * math.pi * k / 12
        r = (R0 + R1) / 2
        zc, yc = r * math.cos(a), CY + r * math.sin(a)

        def mp(u, v, w, zc=zc, yc=yc, a=a):
            zz = zc - u * math.sin(a) + v * math.cos(a)
            yy = yc + u * math.cos(a) + v * math.sin(a)
            return (fx(zz, yy) + 0.0034 + w, yy, zz)
        wedge = prism([(-0.0030, -0.0035), (0.0030, -0.0035), (0.0, 0.0040)], 0.0030, mp, "tooth")
        out.append(feat(wedge, rc(pal(48), pal(50), 72, 0.55), 70))
    return out


def f_gold_hook(X):
    gold = rc(GOLD[0], GOLD[2], 81, 0.6)
    c = np.array([0.083, 0.0, 0.093])
    r = 0.031
    pts = []
    for a in np.linspace(0, 250, 22):
        t = math.radians(a)
        pts.append((c[0] + r * math.sin(t), 0.0, c[2] - r * math.cos(t)))
    path = np.array(pts)
    hook = sweep(path, lambda t: 0.0070 * (1 - t) ** 0.7 + 0.0012, lambda t: 0.0075 * (1 - t) ** 0.7 + 0.0012, 8, (0, 1, 0), None, True, "hook", 0.002)
    out = [feat(hook, gold)]
    out.append(feat(ell3((0.071, 0.0, 0.062), (0.0115, 0.0115, 0.0115), None, 8, "endcap"), gold))
    # sabre curve of the blade: bend metal and channel towards -X above z 0.12
    k = 0.034
    for ob in (X["metal"], X["chan"]):
        for v in ob.data.vertices:
            if v.co.z > 0.12:
                v.co.x -= k * ((v.co.z - 0.12) / 0.36) ** 2
        ob.data.update()
    return out


def f_dravn(X):
    cloth = lambda co, n: lerp_c(CHAR[0], CHAR[2], min(max(0.35 + 0.4 * vnoise(co.x, co.z, 0.012, 91) + 0.2 * n.y, 0.0), 1.0))
    out = []
    for x0, hgt in ((0.047, 0.012), (0.063, 0.011)):
        out.append(feat(band((x0, 0.0, 0.062), (1, 0, 0), 0.0265, hgt, (1.0, 0.72), 16, "oathband", 0.003), cloth))
    path = np.array([(0.055 + 0.004 * math.sin(7 * u), 0.019 + 0.013 * math.sin(5 * u + 0.6), 0.040 - 0.092 * u) for u in np.linspace(0, 1, 10)])
    tail = sweep(path, lambda t: 0.0125 * (1 - 0.55 * t) + 0.0005, 0.0026, 8, (0, 1, 0), None, True, "oathtail", 0.0)
    out.append(feat(tail, cloth))
    path2 = np.array([(0.040 + 0.003 * math.sin(6 * u), -0.018 - 0.010 * math.sin(4 * u), 0.040 - 0.060 * u) for u in np.linspace(0, 1, 8)])
    out.append(feat(sweep(path2, lambda t: 0.0095 * (1 - 0.5 * t) + 0.0005, 0.0024, 8, (0, 1, 0), None, True, "oathtail2", 0.0), cloth))
    # seal rings on both pommel faces (pommel sphere radius ~0.029 around z -0.066)
    for sg in (-1, 1):
        y = sg * 0.0255
        out.append(feat(torus((0.0, y, -0.068), 0.0135, 0.0030, (0, sg, 0), 18, 6), rc(GOLD[0], GOLD[2], 92, 0.6)))
        disc = lathe([(0.0, 0.0), (0.0105, 0.0), (0.0105, 0.0032), (0.0, 0.0032)], 16, close_ends=False)
        bmesh.ops.transform(disc, matrix=Matrix.Translation((0.0, sg * 0.0272, -0.068)) @ basis((0, sg, 0), (0, 0, 1)), verts=disc.verts)
        bmesh.ops.recalc_face_normals(disc, faces=disc.faces)
        out.append(feat(new_obj("seal", mesh_from_bm(disc, "seal")), rc(CHAR[0], CHAR[2], 93, 0.3)))
        out.append(feat(ell3((0.0, sg * 0.0302, -0.068), (0.0030, 0.0016, 0.0070), None, 6, "sealbar"), rc(GOLD[1], GOLD[2], 94, 0.7)))
    return out


def f_magpie(X):
    # dagger pre-turn frame: faces +/-X, guard along Y, pommel below z -0.05; the head profile looks along +Y
    out = []
    ctr = np.array([0.0, 0.0, -0.078])
    M = basis((0, 1, 0), (0, 0, 1))
    blk = (pal(1), pal(3))
    out.append(feat(ell3(ctr, (0.0185, 0.0185, 0.0165), M, 10, "head"), rc(blk[0], blk[1], 101, 0.45)))
    out.append(feat(tube(ctr + (0, 0.010, 0.002), ctr + (0, 0.052, -0.006), 0.0105, 0.0010, 8, "beak"), rc(pal(2), pal(4), 102, 0.55)))
    out.append(feat(ell3(ctr + (0, 0.0, -0.011), (0.0150, 0.0145, 0.0080), M, 8, "breast"), rc(pal(5), pal(6), 103, 0.65)))
    for sg in (-1, 1):
        out.append(feat(ell3(ctr + (sg * 0.0165, 0.010, 0.005), (0.0034, 0.0034, 0.0034), None, 6, "eye"), flat(pal(6))))
        out.append(feat(ell3(ctr + (sg * 0.0185, 0.0108, 0.0052), (0.0016, 0.0017, 0.0017), None, 5, "pupil"), flat(CHAR[0])))
    out.append(feat(tube(ctr + (0, -0.006, 0.013), ctr + (0, -0.020, 0.026), 0.0070, 0.0008, 6, "crest"), flat(pal(2))))
    # black / white helical wrap on the grip (all part corners that lie on the grip cylinder)
    for o in X["parts"]:
        ca = o.data.color_attributes.active_color
        for li, loop in enumerate(o.data.loops):
            co = o.data.vertices[loop.vertex_index].co
            if -0.046 < co.z < 0.024 and math.hypot(co.x, co.y) < 0.0235 and o.name.startswith("grip"):
                ph = co.z / 0.024 + math.atan2(co.y, co.x) / (2 * math.pi)
                k = int(math.floor(ph * 2.0)) % 2
                base = pal(6) if k else pal(1)
                k2 = 0.9 + 0.1 * vnoise(co.x * 40, co.z * 40, 1, 3)
                ca.data[li].color = (float(base[0] * k2), float(base[1] * k2), float(base[2] * k2), 1.0)
    return out


def f_curtain(X):
    ns = X["ns"]
    crim = lambda co, n: lerp_c(CRIM[0], CRIM[2], min(max(0.4 + 0.45 * math.sin(co.y * 140 + 1.0) * 0.5 + 0.2 * n.x, 0.0), 1.0))
    # cloth: draped corner hanging from the pegbox end, folds across the width
    path = np.array([(0.004 * math.sin(11 * u), -0.046 - 0.008 * u, -0.092 - 0.110 * u) for u in np.linspace(0, 1, 12)])
    cloth = sweep(path, lambda t: 0.036 * (1 - 0.85 * t ** 1.3) + 0.002, 0.0026, 12, (1, 0, 0), None, True, "curtain", 0.0)
    out = [feat(cloth, crim, 60)]
    # gold cord tied around the pegbox and the tassel at the corner
    out.append(feat(band((0.0, -0.044, -0.092), (0, -0.045, -0.065), 0.0215, 0.006, (1.0, 1.0), 14, "cord", 0.002), rc(GOLD[0], GOLD[2], 111, 0.6)))
    tip = path[-1]
    out.append(feat(tube(tip + (0, 0, 0.002), tip + (0, 0.0, -0.022), 0.0016, 0.0016, 5, "tcord"), flat(GOLD[1])))
    out.append(feat(ell3(tip + (0, 0, -0.030), (0.0078, 0.0078, 0.0078), None, 8, "tball"), rc(GOLD[0], GOLD[2], 112, 0.6)))
    for k in range(8):
        a = 2 * math.pi * k / 8
        out.append(feat(tube(tip + (0.004 * math.cos(a), 0.004 * math.sin(a), -0.034), tip + (0.007 * math.cos(a), 0.007 * math.sin(a), -0.066), 0.0022, 0.0006, 4, "fringe"), rc(CRIM[1], CRIM[2], 113 + k, 0.6)))
    return out


# ------------------------------------------------------------------------------------------------ groups
GROUPS = {
    "axe": dict(src="blender_weapons_v2.py", cut="\nos.makedirs(OUT", last=False, kind="legacy", fn="axe", name="axe"),
    "sword": dict(src="blender_weapon_sword.py", cut="\nos.makedirs(OUT", last=False, kind="legacy", fn="build", name="sword"),
    "lance": dict(src="blender_weapon_lance.py", cut="\nmain()", last=True, kind="legacy", fn="lance", name="lance", game=True),
    "shield": dict(src="blender_weapon_shield.py", cut="\nfor o in list(bpy.data.objects):\n    bpy.data.objects.remove(o, do_unlink=True)\nos.makedirs(OUT",
                   last=False, kind="legacy", fn="shield", name="shield"),
    "bow": dict(src="blender_weapon_bow.py", cut="\nclear_scene()\nparts", last=False, kind="parts", fn="build", name="bow", post="TILT"),
    "dagger": dict(src="blender_weapon_dagger.py", cut="\nclear_scene()\nparts", last=False, kind="parts", fn="build", name="dagger", post="FINAL"),
    "lute": dict(src="blender_weapon_lute.py", cut="\nclear_scene()\nparts", last=False, kind="parts", fn="build", name="lute", post=None),
}

LEATHER = lambda t: dict(LEATHER_D=t[0], LEATHER_M=t[1], LEATHER_L=t[2])
ITEMS = {
    "tinder": dict(group="axe", over=LEATHER((pal(14), pal(15), pal(16))), feats=f_tinder),
    "bounty": dict(group="bow", over={}, feats=f_bounty),
    "wolf_fang": dict(group="lance", over=LEATHER((pal(3), pal(4), pal(5))), feats=f_wolf_fang),
    "little_hands": dict(group="shield", over={}, feats=f_little_hands),
    "rowenas_lance": dict(group="lance", over={}, feats=f_rowena),
    "wasp_sting": dict(group="bow", over=dict(LEATHER((pal(1), pal(2), pal(19)))), feats=f_wasp),
    "gold_hook": dict(group="sword", over=LEATHER((pal(18), pal(19), pal(44))), feats=f_gold_hook),
    "dravns_oath": dict(group="sword", over=LEATHER((pal(1), pal(2), pal(3))), feats=f_dravn),
    "magpie": dict(group="dagger", over=LEATHER((pal(1), pal(6), pal(5))), feats=f_magpie),
    "white_wolf": dict(group="bow", over=dict(WOOD_D=pal(4), WOOD_M=pal(5), WOOD_L=pal(6)), feats=f_white_wolf),
    "heirloom": dict(group="lance", over=LEATHER((0.5 * pal(7) + 0.5 * pal(51), pal(52), pal(24))), feats=f_heirloom),
    "final_curtain": dict(group="lute", over={}, feats=f_curtain),
    "pact_warden_shield": dict(group="shield", over={}, feats=f_pact),
}


def clear():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for b in list(blk):
            if b.users == 0:
                blk.remove(b)


def export(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False, export_vertex_color="ACTIVE",
                              export_animations=False, export_materials="EXPORT")


def report(path, objs):
    t = {o.name: tris(o) for o in objs}
    allv = np.array([v.co[:] for o in objs for v in o.data.vertices])
    print(f"[hc] {path}: {sum(t.values())} triangles {t}; bbox min {allv.min(0).round(3)} max {allv.max(0).round(3)}", flush=True)
    assert sum(t.values()) <= 8500, "triangle budget exceeded"


def build_item(iid):
    it = ITEMS[iid]
    g = GROUPS[it["group"]]
    clear()
    ns = {"__file__": os.path.join(HERE, g["src"]), "__name__": "hc_sig_group"}
    run_src(os.path.join(HERE, g["src"]), g["cut"], ns, g["last"])
    override(ns, **it["over"])
    X = {"ns": ns}
    if g["kind"] == "legacy":
        metal, chan, sock2 = ns[g["fn"]]()
        X.update(metal=metal, chan=chan, sock2=sock2)
        feats = it["feats"](X)
        metal = X["metal"]
        other = tris(chan) + tris(sock2)
        ft = sum(tris(o) for o in feats)
        thin(metal, 8500 - 40 - other - ft)
        metal = join([metal] + feats, g["name"]) if feats else metal
        metal.name = g["name"]
        ns["make_materials"](metal, chan, sock2)
        if g.get("game"):
            ns["to_game_frame"]([metal, chan, sock2])
        objs = [metal, chan, sock2]
    else:
        parts, chan, sock2 = ns[g["fn"]]()
        X.update(parts=parts, chan=chan, sock2=sock2, metal=None)
        feats = it["feats"](X)
        other = tris(chan) + tris(sock2)
        ft = sum(tris(o) for o in feats)
        base = sum(tris(o) for o in parts)
        if base + other + ft > 8460:
            for o in sorted(parts, key=tris, reverse=True)[:6]:
                thin(o, int(tris(o) * (8460 - other - ft) / base))
        post = ns[g["post"]] if g.get("post") else None
        K["finish"](g["name"], parts + feats, chan, sock2, post, out_name=iid)
        return
    path = os.path.join(OUTDIR, f"{iid}.glb")
    export(path)
    report(path, objs)


def build_dragon_ember():
    clear()
    parts = []
    post = Matrix.Identity(4)
    TOP = 0.0065
    # the scale: rounded drop (wide above, pointed below), flat top under the setting
    prof = [(0.0, -0.0085), (0.050, -0.0085), (0.056, -0.0045), (0.057, 0.0), (0.055, 0.0042), (0.052, TOP), (0.0, TOP)]
    bm = lathe(prof, 40, axis="X", close_ends=False)
    for v in bm.verts:
        z = v.co.z
        up = z * 1.22
        taper = 1.0 - 0.52 * smooth((-up - 0.012) / 0.060) if up < 0 else 1.0
        v.co.y *= taper
        v.co.z = up
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    scale = new_obj("scale", mesh_from_bm(bm, "scale"))
    parts.append(col(scale, lambda co, n: lerp_c(CHAR[1], CHAR[2], min(max(0.35 + 0.35 * n.x + 0.3 * vnoise(co.y, co.z, 0.01, 121), 0.0), 1.0))))
    # scale ridges: three small raised chevrons below the setting, two horns above (kept clear of the setting and the channel)
    for k, (yy, zz, ln) in enumerate(((-0.022, 0.0555, 0.016), (0.022, 0.0555, 0.016), (0.0, 0.060, 0.011))):
        horn = tube((TOP - 0.001, yy, zz), (TOP + 0.011, yy * 1.25, zz + ln), 0.0046, 0.0008, 6, "horn")
        parts.append(col(horn, rc(EMBER[0], EMBER[1], 122 + k, 0.5)))
    # gold rim following the outline
    outline = []
    for i in range(40):
        a = 2 * math.pi * i / 40
        yy, zz = 0.0568 * math.cos(a), 0.0568 * math.sin(a) * 1.22
        taper = 1.0 - 0.52 * smooth((-zz - 0.012) / 0.060) if zz < 0 else 1.0
        outline.append((0.0012, yy * taper, zz))
    outline.append(outline[0])
    rim = sweep(np.array(outline), 0.0034, 0.0034, 6, (1, 0, 0), None, True, "rim", 0.0)
    parts.append(col(rim, rc(GOLD[0], GOLD[2], 123, 0.6)))
    # setting in the centre and the short channel around the lower scale
    parts += main_setting((TOP, 0.0, 0.0), (1, 0, 0), (0, 0, 1), "socket_rune_a", post)
    arc = []
    for a in np.linspace(200, 340, 28):
        t = math.radians(a)
        arc.append((TOP, 0.0485 * math.cos(t), 0.0485 * math.sin(t)))
    chan, rails = channel([(np.array(arc), (1, 0, 0))], hw=0.0028, rails=False)
    # bail and chain, upward (links alternate their plane)
    ztop = 0.0568 * 1.22
    parts.append(col(torus((0.0, 0.0, ztop + 0.0045), 0.0105, 0.0030, (0, 1, 0), 14, 6), rc(GOLD[0], GOLD[2], 124, 0.6)))
    for i in range(10):
        zc = ztop + 0.0215 + 0.0125 * i
        ax = (1, 0, 0) if i % 2 == 0 else (0, 1, 0)
        parts.append(col(torus((0.0, 0.0, zc), 0.0072, 0.0019, ax, 10, 5, 1.0, "link"), rc(BOSS_D, BOSS_L, 125 + i, 0.55)))
    K["finish"]("dragon_ember", parts, chan, None, None, out_name="dragon_ember")


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    for iid in IDS or list(ITEMS) + ["dragon_ember"]:
        print(f"[hc] --- {iid}", flush=True)
        if iid == "dragon_ember":
            build_dragon_ember()
        else:
            build_item(iid)


main()
