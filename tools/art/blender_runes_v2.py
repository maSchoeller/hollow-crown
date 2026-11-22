"""Hollow Crown – rune stones v2: the gems that sit in the round sockets of the runed weapons (blender_weapons_v2.py).

blender -b --factory-startup --python tools/art/blender_runes_v2.py -- [<out_dir>] [--render=<dir>] [--only=id,id]

Writes art/models/runes-v2/<id>.glb (default), one per id of content/core/runes.yaml (20 stones), and with --render
also the preview images fire_tiers.png / all_runes.png / in_axe*.png into <dir>.

Frame in the glb (glTF Y-up, like the weapons): origin = centre of the FLAT BASE of the stone, the dome points along
+X (the weapon's blade-face axis), the symbol's "up" is +Y (= the haft axis of the weapon, Blender +Z), the symbol is
readable looking from +X towards -X. Base radius 0.0252 (diameter 0.0504 = socket radius 0.0258 - 0.0006).
The weapons (tools/art/blender_weapons_v2.py and siblings) export empty nodes `socket_rune_a_*` / `socket_rune_b_*` with
exactly this frame (origin = base centre, +X out of the metal, +Y symbol up; the left/second face is the same frame turned 180
degrees about the haft axis, small settings carry scale 0.55): parent the stone's root to the node with an identity local
transform. The nodes sit STONE_SINK = 0.0004 below the socket floor, so the base is not coplanar with the metal.
Heights: tier I 0.0080, tier II 0.0140 (utility runes too: the faceted bevel ring is 0.0045 high), tier III 0.0150.

Parts (separate objects/materials so the game can light them):
  rune_stone   body, base colour = element colour (utility: silver-white)
  rune_symbol  the carved symbol's floor, a lighter tint of the element colour (glow it brighter than the body)
  rune_gold    tier III only: thin gold inlay line along the symbol
  rune_core    tier III only: small bright core inside the crystal (hidden unless the stone is made translucent)
Tier I: smooth low cabochon + shallow carving. Tier II: taller dome with a clearly faceted 12-sided bevel ring (a lit band
seen from the front), bigger, bolder and deeper carving with a brighter symbol floor.
Tier III: cut crystal dome (facets, flat table) with gold-inlaid symbol. Symbols are real carved pockets (boolean cut),
the floor mesh follows the dome surface lowered by the carving depth.
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
pos = [a for a in argv if not a.startswith("--")]
OUT = pos[0] if pos else os.path.join(ROOT, "art", "models", "runes-v2")
RENDER = next((a.split("=", 1)[1] for a in argv if a.startswith("--render=")), None)
ONLY = next((a.split("=", 1)[1].split(",") for a in argv if a.startswith("--only=")), None)

R = 0.0252           # base radius (socket radius 0.0258 - 0.0006, as the axe's placeholder stone)
SEGS = 20
COLOURS = {"fire": "F2603A", "wind": "7BD389", "earth": "B9874B", "water": "4AA8E8", "light": "F7D96B",
           "dark": "8E5BD9", "utility": "E9E4D8"}
GOLD = "E3B23C"
ELEMENT_RUNES = [(f"{e}_rune_{t}", e, t) for e in ("fire", "wind", "earth", "water", "light") for t in (1, 2, 3)] \
    + [("dark_rune_1", "dark", 1)]
UTILITY = [("precision_rune", "crosshair"), ("force_rune", "hammer"), ("edge_rune", "blade"), ("feather_rune", "feather")]
SYMBOL_OF = {"fire": "flame", "wind": "swirl", "earth": "peak", "water": "wave", "light": "star", "dark": "moon"}
# side height, bevel height, cap height, carving depth, symbol half size, stroke width factor
TIER = {1: dict(hs=0.0030, hb=0.0, hc=0.0050, d=0.00055, S=0.0098, wf=1.0, tint=0.20),
        2: dict(hs=0.0035, hb=0.0045, hc=0.0060, d=0.00110, S=0.0112, wf=1.3, tint=0.55),
        3: dict(hs=0.0035, hb=0.0, hc=0.0115, d=0.00095, S=0.0088, wf=1.0, tint=0.35)}


def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgb(h):
    return [lin(int(h[k:k + 2], 16) / 255) for k in (0, 2, 4)]


def tint(h, t):
    return [x + (1 - x) * t for x in rgb(h)]


# ---------------------------------------------------------------- symbols (normalised -1..1, y up)
def chaikin(pts, n=2):
    for _ in range(n):
        out = []
        for i in range(len(pts)):
            a, b = pts[i], pts[(i + 1) % len(pts)]
            out += [(0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]), (0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1])]
        pts = out
    return pts


def rot(pts, deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return [(x * c - y * s, x * s + y * c) for x, y in pts]


def circle(r, n=18):
    return [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def symbol(name):
    """-> dict(fills=[polygon...], strokes=[(pts, closed, width)...]); fills and strokes are both carved."""
    if name == "flame":
        return dict(fills=[chaikin([(0.10, 1.0), (0.42, 0.50), (0.64, -0.10), (0.54, -0.62), (0.2, -0.95), (-0.2, -0.95),
                                    (-0.56, -0.62), (-0.62, -0.12), (-0.40, 0.28), (-0.22, 0.02), (-0.06, 0.48)], 2)], strokes=[])
    if name == "swirl":
        pts = []
        for i in range(25):
            t = i / 24
            a = t * 1.7 * 2 * math.pi + 0.4
            r = 0.10 + 0.82 * t
            pts.append((r * math.cos(a), r * math.sin(a)))
        return dict(fills=[], strokes=[(pts, False, 0.24)])
    if name == "peak":
        return dict(fills=[[(-0.95, -0.7), (-0.32, 0.5), (-0.08, 0.18), (0.22, 0.95), (0.95, -0.7)]], strokes=[])
    if name == "wave":
        strokes = []
        for oy in (0.36, -0.36):
            strokes.append(([(x / 14 * 0.95, oy + 0.26 * math.sin(x / 14 * 0.95 * 2 * math.pi * 0.85)) for x in range(-14, 15, 2)],
                            False, 0.24))
        return dict(fills=[], strokes=strokes)
    if name == "star":
        pts = []
        for i in range(8):
            r = 1.0 if i % 2 == 0 else 0.26
            a = math.radians(90 + 45 * i)
            pts.append((r * math.cos(a), r * math.sin(a)))
        return dict(fills=[pts], strokes=[])
    if name == "moon":
        ro, ri, c = 0.92, 0.78, (0.46, 0.14)
        outer, inner = [], []
        for k in range(60):
            a = math.radians(k * 6)
            po = (ro * math.cos(a), ro * math.sin(a))
            pi_ = (c[0] + ri * math.cos(a), c[1] + ri * math.sin(a))
            if math.hypot(po[0] - c[0], po[1] - c[1]) > ri:
                outer.append((a, po))
            if math.hypot(pi_[0], pi_[1]) < ro:
                inner.append((a, pi_))
        # outer arc runs counter-clockwise from one cusp to the other (a contiguous run, possibly wrapping 0), inner arc back
        def run(items):
            ang = [a for a, _ in items]
            gaps = [(ang[(i + 1) % len(ang)] - ang[i]) % (2 * math.pi) for i in range(len(ang))]
            s = (gaps.index(max(gaps)) + 1) % len(ang)
            return [items[(s + i) % len(items)][1] for i in range(len(items))]
        return dict(fills=[rot(run(outer) + run(inner)[::-1], 20)], strokes=[])
    if name == "crosshair":
        w = 0.17
        return dict(fills=[], strokes=[(circle(0.60), True, w), ([(-0.98, 0), (-0.30, 0)], False, w), ([(0.30, 0), (0.98, 0)], False, w),
                                       ([(0, -0.98), (0, -0.30)], False, w), ([(0, 0.30), (0, 0.98)], False, w)])
    if name == "hammer":
        head = rot([(-0.85, 0.28), (0.85, 0.28), (0.85, 0.92), (-0.85, 0.92)], -30)
        shaft = rot([(-0.15, -0.95), (0.15, -0.95), (0.15, 0.4), (-0.15, 0.4)], -30)
        return dict(fills=[head, shaft], strokes=[])
    if name == "blade":
        return dict(fills=[[(0.0, 1.0), (0.22, 0.45), (0.22, -0.22), (0.58, -0.22), (0.58, -0.40), (0.14, -0.40), (0.14, -0.92),
                            (-0.14, -0.92), (-0.14, -0.40), (-0.58, -0.40), (-0.58, -0.22), (-0.22, -0.22), (-0.22, 0.45)]], strokes=[])
    if name == "feather":
        a0, a1 = Vector((-0.55, -0.8)), Vector((0.7, 0.95))
        u = (a1 - a0).normalized()
        n = Vector((-u.y, u.x))
        left, right = [], []
        for i in range(0, 9):
            t = 0.22 + 0.78 * i / 8
            w = 0.40 * math.sin(math.pi * (t - 0.05) / 0.95) ** 0.7
            p = a0 + (a1 - a0) * t
            left.append(tuple(p + n * w))
            right.append(tuple(p - n * w))
        return dict(fills=[left + right[::-1]], strokes=[([tuple(a0 - u * 0.30), tuple(a0 + (a1 - a0) * 0.45)], False, 0.14)])
    raise KeyError(name)


# ---------------------------------------------------------------- geometry helpers
def mk(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def lathe(prof, segs):
    """prof: [(r, z, ring rotation 0|0.5)] from the base centre (r=0) to the apex (r=0). Closed solid."""
    bm = bmesh.new()
    step = 2 * math.pi / segs
    rings = []
    for r, z, off in prof:
        if r < 1e-9:
            rings.append(([bm.verts.new((0, 0, z))], 0.0))
        else:
            rings.append(([bm.verts.new((r * math.cos((i + off) * step), r * math.sin((i + off) * step), z)) for i in range(segs)], off))
    for (A, oa), (B, ob) in zip(rings, rings[1:]):
        if len(A) == 1 or len(B) == 1:
            F, P = (B, A) if len(A) == 1 else (A, B)
            for i in range(segs):
                bm.faces.new((P[0], F[i], F[(i + 1) % segs]))
        elif oa == ob:
            for i in range(segs):
                bm.faces.new((A[i], A[(i + 1) % segs], B[(i + 1) % segs], B[i]))
        else:
            i, j = 0, (-1 if ob > oa else 0)
            for _ in range(2 * segs):
                if i + 1 + oa <= j + 1 + ob:
                    bm.faces.new((A[i % segs], A[(i + 1) % segs], B[j % segs]))
                    i += 1
                else:
                    bm.faces.new((A[i % segs], B[(j + 1) % segs], B[j % segs]))
                    j += 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def profile(tier, dz=0.0):
    p = TIER[tier]
    hs, hb, hc = p["hs"], p["hb"], p["hc"]
    if tier == 3:   # cut crystal: skirt, crown rings with alternating rotation, flat table
        pts = [(0.0, 0.0, 0), (R, 0.0, 0), (R, hs, 0), (0.84 * R, hs + 0.0036, 0.5), (0.62 * R, hs + 0.0078, 0),
               (0.44 * R, hc + hs, 0.5), (0.0, hc + hs, 0)]
    else:
        pts = [(0.0, 0.0, 0), (R, 0.0, 0), (R, hs, 0)]
        r0, z0 = R, hs
        if hb:   # faceted bevel ring: zig-zag triangle band
            r0, z0 = 0.76 * R, hs + hb
            pts.append((r0, z0, 0.5))
        n = 6
        for i in range(1, n):
            t = i / n * math.pi / 2
            pts.append((r0 * math.cos(t), z0 + hc * math.sin(t), 0))
        pts.append((0.0, z0 + hc, 0))
    return [(r, z + dz, o) for r, z, o in pts]


def dome_height(tier, r):
    pr = profile(tier)
    for (r0, z0, _), (r1, z1, _) in zip(pr, pr[1:]):
        if r1 < r0 and r1 <= r <= r0:
            return z1 + (z0 - z1) * (r - r1) / (r0 - r1)
    return pr[-1][1]


def dome_obj(tier, dz=0.0, name="dome"):
    return mk(name, lathe(profile(tier, dz), {1: SEGS, 2: 12, 3: 16}[tier]))


def prism(pts, z0, z1):
    bm = bmesh.new()
    lo = [bm.verts.new((x, y, z0)) for x, y in pts]
    hi = [bm.verts.new((x, y, z1)) for x, y in pts]
    n = len(pts)
    for i in range(n):
        bm.faces.new((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]))
    bm.faces.new(lo[::-1])
    bm.faces.new(hi)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def stroke_bm(bm, pts, closed, w, z0, z1, cyl=10):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:] + ([pts[0]] if closed else [])):
        L = math.hypot(x1 - x0, y1 - y0)
        if L < 1e-9:
            continue
        m = Matrix.Translation(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)) @ Matrix.Rotation(math.atan2(y1 - y0, x1 - x0), 4, "Z") \
            @ Matrix.Diagonal((L, w, z1 - z0, 1))
        bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    for x, y in (pts if closed else [pts[0], pts[-1]]):
        bmesh.ops.create_cone(bm, cap_ends=True, segments=cyl, radius1=w / 2, radius2=w / 2, depth=z1 - z0,
                              matrix=Matrix.Translation((x, y, (z0 + z1) / 2)))


def ribbon_bm(bm, pts, closed, w, z0, z1):
    """Prism of a constant-width band along a polyline (mitred corners)."""
    n = len(pts)
    P = [Vector(p) for p in pts]
    lo, hi = [], []
    for i in range(n):
        a = P[i - 1] if (i > 0 or closed) else None
        b = P[(i + 1) % n] if (i < n - 1 or closed) else None
        t0 = (P[i] - a).normalized() if a is not None else (b - P[i]).normalized()
        t1 = (b - P[i]).normalized() if b is not None else t0
        n0, n1 = Vector((-t0.y, t0.x)), Vector((-t1.y, t1.x))
        m = (n0 + n1)
        m = m.normalized() * min((w / 2) / max(m.normalized().dot(n0), 0.35), w) if m.length > 1e-9 else n0 * (w / 2)
        lo.append((bm.verts.new((P[i].x + m.x, P[i].y + m.y, z0)), bm.verts.new((P[i].x + m.x, P[i].y + m.y, z1))))
        hi.append((bm.verts.new((P[i].x - m.x, P[i].y - m.y, z0)), bm.verts.new((P[i].x - m.x, P[i].y - m.y, z1))))
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        j = (i + 1) % n
        bm.faces.new((lo[i][1], lo[j][1], hi[j][1], hi[i][1]))   # top
        bm.faces.new((lo[i][0], hi[i][0], hi[j][0], lo[j][0]))   # bottom
        bm.faces.new((lo[i][0], lo[j][0], lo[j][1], lo[i][1]))
        bm.faces.new((hi[i][0], hi[i][1], hi[j][1], hi[j][0]))
    if not closed:
        for k in (0, n - 1):
            bm.faces.new((lo[k][0], lo[k][1], hi[k][1], hi[k][0]))


def cutter(sym, S, wf, z0, z1, gold=False, gw=0.0):
    """Joined solid (one object, overlaps resolved by the later self-intersecting boolean) of all strokes and
    fills of the symbol, vertical walls from z0 to z1. gold: thin line along strokes and fill outlines."""
    bm = bmesh.new()
    for poly in sym["fills"]:
        pp = [(x * S, y * S) for x, y in poly]
        if gold:
            ribbon_bm(bm, pp, True, gw, z0, z1)
        else:
            tmp = prism(pp, z0, z1)
            me = bpy.data.meshes.new("t")
            tmp.to_mesh(me)
            tmp.free()
            bm.from_mesh(me)
            bpy.data.meshes.remove(me)
    for pts, closed, w in sym["strokes"]:
        pp = [(x * S, y * S) for x, y in pts]
        if gold:
            ribbon_bm(bm, pp, closed, gw, z0, z1)
        else:
            ribbon_bm(bm, pp, closed, w * wf * S, z0, z1)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return mk("cutter", bm)


def boolean(a, b, op, use_self=False):
    m = a.modifiers.new("b", "BOOLEAN")
    m.operation, m.object, m.solver, m.use_self = op, b, "EXACT", use_self
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(a.evaluated_get(dg))
    a.modifiers.remove(m)
    me.materials.clear()
    for p in me.polygons:
        p.material_index = 0
    old = a.data
    a.data = me
    bpy.data.meshes.remove(old)
    return a


def remove(*obs):
    for o in obs:
        me = o.data
        bpy.data.objects.remove(o, do_unlink=True)
        if me.users == 0:
            bpy.data.meshes.remove(me)


def shade(ob, angle):
    for p in ob.data.polygons:
        p.use_smooth = angle > 0
    if angle > 0:
        with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
            bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle))


def mat(name, colour, emit, strength, metal=0.0, rough=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = colour + [1.0]
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Emission Color"].default_value = emit + [1.0]
    b.inputs["Emission Strength"].default_value = strength
    return m


def build(rid, element, tier, sym_name):
    """Dome along +Z, base at z=0, symbol up = +Y. Returns {part: object}."""
    p = TIER[tier]
    S, d, wf = p["S"], p["d"], p["wf"]
    top = p["hs"] + p["hb"] + p["hc"]
    base = rgb(COLOURS[element])
    sym = symbol(sym_name)
    dome = dome_obj(tier)
    # carving: remove what of the symbol prism sticks out above the dome lowered by d (a pocket with vertical walls),
    # put a thin floor mesh (rune_symbol) into the pocket
    cut = cutter(sym, S, wf, -0.02, 0.05)
    lay = dome_obj(tier, -d, "lowered")
    boolean(cut, lay, "DIFFERENCE", True)
    boolean(dome, cut, "DIFFERENCE", True)
    remove(cut, lay)
    zlow = dome_height(tier, S * 1.15) - d - 0.0005
    fcut = cutter(sym, S, wf, zlow, 0.05)
    A = dome_obj(tier, -d + 0.00006, "A")
    boolean(A, fcut, "INTERSECT", True)
    remove(fcut)
    parts = {"rune_stone": dome, "rune_symbol": A}
    shade(dome, {1: 40, 2: 18, 3: 0}[tier])
    shade(A, 40)
    dome.data.materials.append(mat("rune_stone", base, base, 0.04, rough=0.25 if tier == 3 else 0.4))
    A.data.materials.append(mat("rune_symbol", tint(COLOURS[element], p["tint"]), tint(COLOURS[element], p["tint"] + 0.1), 0.45 + 0.35 * (tier == 2)))
    if tier == 3:
        gold = cutter(sym, S, wf, top - d, top + 0.00012, gold=True, gw=0.0011)
        shade(gold, 0)
        gold.data.materials.append(mat("rune_gold", rgb(GOLD), rgb(GOLD), 0.5, metal=0.9, rough=0.3))
        parts["rune_gold"] = gold
        cb = bmesh.new()
        bmesh.ops.create_icosphere(cb, subdivisions=1, radius=0.0050, matrix=Matrix.Translation((0, 0, top * 0.5)))
        core = mk("rune_core", cb)
        shade(core, 0)
        core.data.materials.append(mat("rune_core", tint(COLOURS[element], 0.8), tint(COLOURS[element], 0.8), 4.0))
        parts["rune_core"] = core
    for k, o in parts.items():
        o.name = k
        o.data.name = f"{rid}_{k}"
    return parts


def tris(parts):
    return {k: sum(len(p.vertices) - 2 for p in o.data.polygons) for k, o in parts.items()}


# local (x,y,z) -> (z,x,y): dome +Z -> +X, symbol up +Y -> +Z (Blender); the glTF exporter then maps Blender Z -> glTF +Y
M_EXPORT = Matrix(((0, 0, 1, 0), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1)))


def export(rid, parts):
    dups = []
    for k, o in parts.items():
        me = o.data.copy()
        me.transform(M_EXPORT)
        d = bpy.data.objects.new(k, me)
        bpy.context.scene.collection.objects.link(d)
        dups.append(d)
    for o in bpy.context.scene.objects:
        o.select_set(o in dups)
    path = os.path.join(OUT, f"{rid}.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_animations=False,
                              export_materials="EXPORT", export_yup=True)
    remove(*dups)
    return path


# ---------------------------------------------------------------- renders
def render_setup(w, h):
    sc = bpy.context.scene
    for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT", "CYCLES"):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            continue
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    if sc.world is None:
        sc.world = bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.62, 0.62, 0.63, 1)
    bg.inputs["Strength"].default_value = 0.9
    for o in [o for o in sc.objects if o.type in ("LIGHT", "CAMERA")]:
        bpy.data.objects.remove(o, do_unlink=True)
    for loc, e in (((0.5, -0.4, 0.5), 3.5), ((-0.6, 0.3, 0.5), 1.0)):
        ld = bpy.data.lights.new("l", "SUN")
        ld.energy = e
        lo = bpy.data.objects.new("l", ld)
        sc.collection.objects.link(lo)
        lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return sc


def camera(sc, loc, target, ortho=None, lens=90):
    cd = bpy.data.cameras.new("c")
    if ortho:
        cd.type, cd.ortho_scale = "ORTHO", ortho
    else:
        cd.lens = lens
    cd.clip_start, cd.clip_end = 0.005, 5.0
    co = bpy.data.objects.new("c", cd)
    sc.collection.objects.link(co)
    co.location = loc
    co.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    sc.camera = co


def shot(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def place(parts, loc, rotz=0.0):
    for o in parts.values():
        o.location = loc
        o.rotation_euler = (0, 0, rotz)
        o.hide_render = False


def render_all(built):
    os.makedirs(RENDER, exist_ok=True)
    for parts in built.values():
        for o in parts.values():
            o.hide_render = True
    sc = render_setup(1500, 560)
    fire = [f"fire_rune_{t}" for t in (1, 2, 3)]
    if all(r in built for r in fire):
        for i, rid in enumerate(fire):
            place(built[rid], (i * 0.07, 0, 0), math.radians(-25))
        camera(sc, (0.07, -0.42, 0.20), (0.07, 0, 0.005), lens=80)
        shot(os.path.join(RENDER, "fire_tiers.png"))
        for rid in fire:
            for o in built[rid].values():
                o.hide_render = True
    ids = list(built)
    cols = 5
    rows = (len(ids) + cols - 1) // cols
    sc = render_setup(1500, 300 * rows)
    for i, rid in enumerate(ids):
        place(built[rid], ((i % cols) * 0.066, -(i // cols) * 0.066, 0))
    cx, cy = (cols - 1) * 0.033, -(rows - 1) * 0.033
    camera(sc, (cx, cy, 0.5), (cx, cy, 0), ortho=0.066 * cols + 0.005)
    shot(os.path.join(RENDER, "all_runes.png"))


def render_in_axe():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, "art", "models", "weapons-v2", "axe.glb"))
    nodes = [o for o in bpy.data.objects if o.name.startswith("socket_rune_a")]
    for nd in nodes:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, "fire_rune_3.glb"))
        for o in [o for o in bpy.data.objects if o not in before and o.parent is None]:
            o.matrix_world = nd.matrix_world
    sc = render_setup(1400, 1400)
    camera(sc, (0.5, -0.12, 0.29), (0, -0.12, 0.29), ortho=0.46)
    shot(os.path.join(RENDER, "in_axe.png"))
    camera(sc, (0.5, -0.072, 0.284), (0, -0.072, 0.284), ortho=0.11)
    shot(os.path.join(RENDER, "in_axe_close.png"))
    camera(sc, (0.22, -0.30, 0.40), (0, -0.075, 0.285), lens=70)
    shot(os.path.join(RENDER, "in_axe_angle.png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    jobs = [(rid, el, t, SYMBOL_OF[el]) for rid, el, t in ELEMENT_RUNES] + [(rid, "utility", 2, s) for rid, s in UTILITY]
    built = {}
    for rid, el, t, s in jobs:
        if ONLY and rid not in ONLY:
            continue
        parts = build(rid, el, t, s)
        path = export(rid, parts)
        built[rid] = parts
        print(f"[hc] {path}: {sum(tris(parts).values())} tris {tris(parts)}", flush=True)
    if RENDER:
        render_all(built)
        if not ONLY or "fire_rune_3" in ONLY:
            render_in_axe()
