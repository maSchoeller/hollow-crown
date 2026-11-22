"""Hollow Crown - weapon library v2: shared kit of the "rest" groups (bow, dagger, staff, book, lute, focus; story 16.7).

Not run on its own. The blender_weapon_<group>.py scripts execute blender_weapons_v2.py (up to its build loop) and then this
file in the same namespace, so everything here may use the helpers and constants of blender_weapons_v2.py (SOCKET_R,
STONE_SINK, SOCKET2_F, CH_LIFT, setting_parts, make_socket2, add_node, lathe, box_bm, chaikin, set_colours, shade, join, ...).

What it adds (no constants of the axe kit are copied):
  frame_matrix   stone frame at a point of the weapon: +X = dome (out of the metal), +Z = symbol up (see STONE NODE CONVENTION)
  puck           the boss of a main setting: flat top, pocket of radius SOCKET_R, skirt that sinks into the body
  main_setting / small_setting   puck + rim + four claws (+ the empty node) / small rim + claws on the plain surface
  sweep          tube of any section along a 3D path (rounded limbs, shafts, blades without groove, ...)
  channel        thin V strip (material rune_channel, UV map 1 `fill` 0 .. 1 along each path) with optional rails: two thin
                 beads left and right of the strip so that it reads as an inlaid channel (the axe/sword carve a real groove)
  finish         joins the parts, builds the materials, applies the final transform, exports the glb
Rules for the bodies: a puck needs a flat solid under it (its skirt is open at the bottom); small settings sit on a flat zone.
"""
BOSS_D, BOSS_L = pal(26), pal(28)             # cold steel of the settings (same as the shield boss)
RAIL_D, RAIL_L = 0.6 * pal(2) + 0.4 * pal(3), 0.5 * pal(3) + 0.5 * pal(4)   # dark iron beads of the channels
PAPER_L, PAPER_D = pal(6), 0.5 * pal(6) + 0.5 * pal(24)
COVER_D, COVER_M, COVER_L = pal(48), 0.5 * pal(48) + 0.5 * pal(49), pal(49)   # deep violet leather (never a team colour)
CRYSTAL_D, CRYSTAL_L = pal(27), pal(28)
STRING_C = pal(10)
for _c in (BOSS_D, BOSS_L, RAIL_D, RAIL_L, PAPER_L, PAPER_D, COVER_D, COVER_M, COVER_L, CRYSTAL_D, CRYSTAL_L, STRING_C):
    _c[3] = 1.0
PUCK_TOP = 0.0068                              # metal surface above the stone base (= X_S - FLOOR_S + STONE_SINK of the shield)
PUCK_LIFT = 0.0008                             # frame origin this far above the body surface (floor never coplanar with it)


def _unit(v):
    v = np.asarray(v, float)
    return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-12)


def frame_matrix(pos, out, up):
    """Stone frame (unscaled): origin `pos`, +X = out, +Z = `up` made orthogonal to it, +Y = Z x X."""
    X = _unit(out)
    u = np.asarray(up, float)
    Z = _unit(u - X * np.dot(u, X))
    Y = np.cross(Z, X)
    return Matrix(((X[0], Y[0], Z[0], pos[0]), (X[1], Y[1], Z[1], pos[1]), (X[2], Y[2], Z[2], pos[2]), (0, 0, 0, 1)))


def col(ob, fn):
    set_colours(ob, fn)
    return ob


def metal_fn(seed=43):
    def f(co, n):
        return lerp_c(BOSS_D, BOSS_L, min(max(0.55 + 0.5 * (vnoise(co.y, co.z, 0.006, seed) - 0.5) + 0.15 * n.z, 0.0), 1.0))
    return f


def steel_fn(seed=51, lo=0.3, k=0.4):
    def f(co, n):
        return lerp_c(STEEL_D, STEEL_M, min(max(lo + k * vnoise(co.y, co.z, 0.008, seed) + 0.2 * n.z, 0.0), 1.0))
    return f


def puck(M, out):
    prof = [(0.0, 0.0004), (SOCKET_R, 0.0004), (SOCKET_R, PUCK_TOP), (0.0375, PUCK_TOP), (0.0393, PUCK_TOP - 0.0010),
            (0.0407, PUCK_TOP - 0.0040), (0.0415, PUCK_TOP - 0.0075), (0.0415, -0.0070)]
    bm = lathe(prof, 36, axis="X", close_ends=False)
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = Vector(tuple(out))
    top = max(bm.faces, key=lambda f: f.calc_center_median().dot(o))
    if top.normal.dot(o) < 0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
    return new_obj("puck", mesh_from_bm(bm, "puck"))


def main_setting(pos, out, up, node, post, fn=None):
    """Main setting on a flat body surface at `pos` facing `out`: [puck, rim, claws...] (coloured) + the empty node."""
    M = frame_matrix(np.asarray(pos, float) + _unit(out) * PUCK_LIFT, out, up)
    rim_o, claws = setting_parts(M, PUCK_TOP)
    parts = [puck(M, out), rim_o] + claws
    for p in parts:
        col(p, fn or metal_fn())
    add_node(node, post @ M)
    return parts


def small_setting(pos, out, up, node, post, fn=None):
    """Small setting (rim + claws, 0.55 x) lying on the plain surface at `pos`; returns the object parts (not joined)."""
    M = frame_matrix(np.asarray(pos, float) - _unit(out) * STONE_SINK, out, up)
    rim_o, claws = setting_parts(M, STONE_SINK, SOCKET2_F, 16, 1)
    add_node(node, post @ (M @ Matrix.Diagonal((SOCKET2_F, SOCKET2_F, SOCKET2_F, 1.0))))
    return [rim_o] + claws, (fn or metal_fn())


def SQ(n):
    """Super-ellipse section function (n = 2 ellipse, 4 rounded square)."""
    e = 2.0 / n
    return lambda th: (math.copysign(abs(math.cos(th)) ** e, math.cos(th)), math.copysign(abs(math.sin(th)) ** e, math.sin(th)))


def taper(t, edge=0.1, floor=0.04):
    """1 in the middle, rounds to `floor` over the first/last `edge` of the length (a rounded end)."""
    e = min(t, 1.0 - t) / edge
    return 1.0 if e >= 1 else max(math.sqrt(max(1.0 - (1.0 - e) ** 2, 0.0)), floor)


def arclen_t(path):
    seg = np.linalg.norm(np.diff(path, axis=0), axis=1)
    s = np.concatenate([[0.0], np.cumsum(seg)])
    return s / s[-1]


def path_frames(path, hint):
    T = _unit(np.gradient(path, axis=0))
    H = np.broadcast_to(np.asarray(hint, float), path.shape)
    S = _unit(np.cross(H, T))
    N = np.cross(T, S)
    return T, S, N


def sweep(path, ra, rb, segs=12, hint=(1, 0, 0), sec=None, caps=True, name="sw", cap_len=0.0):
    """Solid along `path` (N x 3): section = ellipse/`sec` with radii ra (along side S = hint x T) and rb (along N = T x S, the
    `hint` side); ra/rb are numbers or functions of the arc-length fraction. Closed with fans at both ends."""
    path = np.asarray(path, float)
    t = arclen_t(path)
    T, S, N = path_frames(path, hint)
    sec = sec or (lambda th: (math.cos(th), math.sin(th)))
    fa = ra if callable(ra) else (lambda x, v=ra: v)
    fb = rb if callable(rb) else (lambda x, v=rb: v)
    bm = bmesh.new()
    rings = []
    for i, p in enumerate(path):
        a, b = fa(t[i]), fb(t[i])
        ring = []
        for k in range(segs):
            u, v = sec(2 * math.pi * k / segs)
            ring.append(bm.verts.new(tuple(p + S[i] * (a * u) + N[i] * (b * v))))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(segs):
            k2 = (k + 1) % segs
            bm.faces.new((r0[k], r0[k2], r1[k2], r1[k]))
    if caps:
        for ring, i, sg in ((rings[0], 0, -1), (rings[-1], len(path) - 1, 1)):
            apex = bm.verts.new(tuple(path[i] + T[i] * sg * cap_len))
            for k in range(segs):
                bm.faces.new((ring[k], ring[(k + 1) % segs], apex))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_obj(name, mesh_from_bm(bm, name))


def tube(p0, p1, r0, r1=None, segs=8, name="tube", cap_len=0.0, hint=(1, 0, 0)):
    path = np.linspace(np.asarray(p0, float), np.asarray(p1, float), 3)
    if abs(np.dot(_unit(path[2] - path[0]), _unit(hint))) > 0.95:
        hint = (0, 1, 0)
    r1 = r0 if r1 is None else r1
    return sweep(path, lambda t: r0 + (r1 - r0) * t, lambda t: r0 + (r1 - r0) * t, segs, hint, None, True, name, cap_len)


def ball(c, r, ratio=(1.0, 1.0), segs=10, name="ball"):
    """Sphere/ellipsoid around `c` (axis Z; ratio = (xy, z) stretch)."""
    prof = [(0.0, -r * ratio[1])] + [(r * ratio[0] * math.sin(math.radians(a)), -r * ratio[1] * math.cos(math.radians(a)))
                                     for a in range(30, 151, 30)] + [(0.0, r * ratio[1])]
    bm = lathe(prof, segs, axis="Z", close_ends=False)
    bmesh.ops.translate(bm, vec=tuple(c), verts=bm.verts)
    return new_obj(name, mesh_from_bm(bm, name))


def rounded_poly(pts, r, n=4):
    """Corner-rounded copy of a polyline (end points kept); r = corner radius."""
    pts = [np.asarray(p, float) for p in pts]
    out = [pts[0]]
    for a, b, c in zip(pts, pts[1:], pts[2:]):
        d0, d1 = _unit(a - b), _unit(c - b)
        k = min(r, 0.45 * np.linalg.norm(a - b), 0.45 * np.linalg.norm(c - b))
        p0, p1 = b + d0 * k, b + d1 * k
        for i in range(n + 1):
            u = i / n
            out.append((1 - u) ** 2 * p0 + 2 * u * (1 - u) * b + u ** 2 * p1)
    out.append(pts[-1])
    return np.array(out)


def resample_nd(pts, step):
    pts = np.asarray(pts, float)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0.0], np.cumsum(seg)])
    n = max(int(s[-1] / step), 4)
    ss = np.linspace(0, s[-1], n + 1)
    return np.stack([np.interp(ss, s, pts[:, j]) for j in range(pts.shape[1])], 1), ss / s[-1]


def channel(paths, hw=0.0030, e_off=0.0008, a_off=0.0014, rails=True, rail_r=0.0021, rail_gap=0.0028, step=0.007):
    """paths = [(centre line on the surface (N x 3), outward hint (3 or N x 3)), ...]; every path gets fill 0 .. 1 from its first
    to its last point. Returns (rune_channel-to-be object, [rail objects]); the strip lies a hair above the surface."""
    bm = bmesh.new()
    uv0 = bm.loops.layers.uv.new("uv0")
    uv1 = bm.loops.layers.uv.new("fill")
    fill, vn = {}, {}
    rail_obs = []
    for path, hint in paths:
        pts, t = resample_nd(path, step)
        h = np.asarray(hint, float)
        if h.ndim == 2:
            h = np.stack([np.interp(t, arclen_t(np.asarray(path, float)), h[:, j]) for j in range(3)], 1)
        T, S, N = path_frames(pts, h)
        cols = []
        for i, p in enumerate(pts):
            vs = [bm.verts.new(tuple(p - S[i] * hw + N[i] * e_off)), bm.verts.new(tuple(p + N[i] * a_off)),
                  bm.verts.new(tuple(p + S[i] * hw + N[i] * e_off))]
            for v in vs:
                fill[v], vn[v] = float(t[i]), N[i]
            cols.append(vs)
        for a, b in zip(cols, cols[1:]):
            for k in range(2):
                bm.faces.new((a[k], a[k + 1], b[k + 1], b[k]))
        if rails:
            for sg in (-1, 1):
                rail_obs.append(sweep(pts + sg * S * (hw + rail_gap) - N * 0.0004, rail_r, rail_r, 6, N, None, True, "rail"))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        n = sum((Vector(tuple(vn[v])) for v in f.verts), Vector((0, 0, 0)))
        if f.normal.dot(n) < 0:
            f.normal_flip()
    for f in bm.faces:
        for l in f.loops:
            l[uv0].uv = (0.0, 0.0)
            l[uv1].uv = (fill[l.vert], 0.0)
    ob = new_obj("chan", mesh_from_bm(bm, "chan"))
    set_colours(ob, lambda co, n: GLOW_DIM)
    for r in rail_obs:
        col(r, lambda co, n: lerp_c(RAIL_D, RAIL_L, min(max(0.45 + 0.3 * n.z + 0.2 * (vnoise(co.y, co.z, 0.006, 9) - 0.5), 0.0), 1.0)))
    return ob, rail_obs


def mat_vertex(name="HC_Vertex", rough=0.8):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    return m


def finish(model, parts, chan, sock2, post=None, shade_deg=40, out_name=None):
    """parts: every body part (all coloured); chan: the strip object; sock2: the joined `rune_socket2` object or None.
    `post` (4x4) is applied to the geometry (the nodes were created with it already); exports <OUT>/<model>.glb."""
    metal = join(parts, model)
    shade(metal, shade_deg)
    metal.data.name = model
    metal.data.materials.clear()
    metal.data.materials.append(mat_vertex())
    chan.name = chan.data.name = "rune_channel"
    mm = mat_vertex("rune_channel", 0.5)
    chan.data.materials.append(mm)
    objs = [metal, chan]
    if sock2 is not None:
        sock2.name = sock2.data.name = "rune_socket2"
        sock2.data.materials.clear()
        sock2.data.materials.append(bpy.data.materials["HC_Vertex"])
        objs.append(sock2)
    if post is not None:
        for o in objs:
            o.data.transform(post)
            o.data.update()
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{out_name or model}.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False, export_vertex_color="ACTIVE",
                              export_animations=False, export_materials="EXPORT")
    tris = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs}
    bb = [metal.matrix_world @ Vector(c) for c in metal.bound_box]
    ext = [(min(b[i] for b in bb), max(b[i] for b in bb)) for i in range(3)]
    print(f"[hc] {path}: {sum(tris.values())} triangles {tris}; bbox x {ext[0][0]:.3f}..{ext[0][1]:.3f} "
          f"y {ext[1][0]:.3f}..{ext[1][1]:.3f} z {ext[2][0]:.3f}..{ext[2][1]:.3f}", flush=True)
    return tris


def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
