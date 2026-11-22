"""Hollow Crown - acceptance sheet for the runed weapons v2 and the 20 rune stones (story 16.6).

blender -b --factory-startup --python tools/art/blender_weapons_v2_sheet.py -- [--set=rest] [--out=<png>] [--weapons=<dir>] [--runes=<dir>]

--set=sig (story 16.8): collection sheet of the 14 signature weapons and relics (art/models/weapons-v2/sig/<id>.glb), front view
of each with its proposed fixed rune in the main setting; --ids=a,b,.. picks pieces (any glb in --weapons also works), --side=1 adds a
side row, --cols=N sets the columns.

--set=rest (story 16.7): one sheet for bow, dagger, staff, book, book_open, lute, focus: row 1 front, row 2 side (fire tier II main,
tier I small), rows 3-5 close-ups of the main setting with fire tier I / II / III, row 6 close-ups of the small setting.

Imports art/models/weapons-v2/{axe,sword,lance,shield}.glb and art/models/runes-v2/*.glb, parents the stones to the
`socket_rune_*` nodes exactly like the game does (stone root takes the node's world matrix, identity local transform) and
renders a grey sheet of 1600 x about 1060 px (EEVEE, vertex colours visible), stitched from tiles:
  row 1   front of each weapon (looking against the main stone's dome, symbol up), fire tier II in the main setting,
          fire tier I in the small setting
  row 2   side of each weapon
  rows 3-4 close-ups of the main setting with fire tier I, II, III (axe, sword, lance, shield each; left to right
          tier I / II / III of the axe, then sword ... in two rows of six tiles)
  rows 5-6 the 20 stones in front view (ids in the order of content/core/runes.yaml: fire/wind/earth/water/light 1-3,
          dark 1, then the four utility runes)
"""
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
arg = lambda k, d: next((a.split("=", 1)[1] for a in argv if a.startswith(f"--{k}=")), d)
SET = arg("set", "core")
OUT = arg("out", os.path.join(ROOT, "art", "mockups", "weapons-v2-sheet-rest.png" if SET == "rest" else "weapons-v2-sheet-sig.png" if SET == "sig" else "weapons-v2-sheet.png"))
WDIR = arg("weapons", os.path.join(ROOT, "art", "models", "weapons-v2", "sig" if SET == "sig" else ""))
RDIR = arg("runes", os.path.join(ROOT, "art", "models", "runes-v2"))
TMP = os.path.join(os.path.dirname(OUT), "_tiles")
WEAPONS = ["axe", "sword", "lance", "shield"]
SIG_RUNES = {"tinder": "fire_rune_2", "bounty": "edge_rune", "wolf_fang": "wind_rune_2", "little_hands": "earth_rune_2",
             "rowenas_lance": "wind_rune_3", "wasp_sting": "precision_rune", "gold_hook": "water_rune_1", "dravns_oath": "dark_rune_1",
             "magpie": "feather_rune", "white_wolf": "water_rune_2", "heirloom": "light_rune_1", "final_curtain": "light_rune_1",
             "pact_warden_shield": "earth_rune_2", "dragon_ember": "fire_rune_2"}
STONES = [f"{e}_rune_{t}" for e in ("fire", "wind", "earth", "water", "light") for t in (1, 2, 3)] + ["dark_rune_1"] \
    + ["precision_rune", "force_rune", "edge_rune", "feather_rune"]

W = 1600
ROW_FRONT, ROW_SIDE, ROW_CLOSE, ROW_STONE = 300, 200, 170, 110


def clear():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for b in list(blk):
            if b.users == 0:
                blk.remove(b)


def load(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]


def mount(weapon_objs, prefix, stone_id):
    """Parent a stone to every node starting with `prefix` (game convention); returns the stone objects."""
    out = []
    for nd in [o for o in weapon_objs if o.type == "EMPTY" and o.name.startswith(prefix)]:
        for o in [o for o in load(os.path.join(RDIR, f"{stone_id}.glb")) if o.parent is None]:
            o.matrix_world = nd.matrix_world
            out.append(o)
    return out


def setup_render(w, h):
    sc = bpy.context.scene
    for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT", "CYCLES"):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            continue
    if sc.render.engine == "CYCLES":
        sc.cycles.samples = 24
    else:
        try:
            sc.eevee.taa_render_samples = 24
        except Exception:
            pass
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    if sc.world is None:
        sc.world = bpy.data.worlds.new("w")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.30, 0.30, 0.31, 1)
    bg.inputs["Strength"].default_value = 1.0
    return sc


def look(sc, loc, right, up, back, ortho):
    """Orthographic camera at `loc` looking along -back with the given axes; two suns that follow the camera."""
    for o in [o for o in sc.objects if o.type in ("LIGHT", "CAMERA")]:
        bpy.data.objects.remove(o, do_unlink=True)
    rot = Matrix((right, up, back)).transposed()          # columns = camera axes
    cd = bpy.data.cameras.new("c")
    cd.type, cd.ortho_scale, cd.clip_start, cd.clip_end = "ORTHO", ortho, 0.01, 10.0
    co = bpy.data.objects.new("c", cd)
    sc.collection.objects.link(co)
    co.matrix_world = Matrix.Translation(loc) @ rot.to_4x4()
    sc.camera = co
    for rx, rz, e in ((-35.0, 30.0, 3.2), (-20.0, -60.0, 1.2)):
        ld = bpy.data.lights.new("l", "SUN")
        ld.energy = e
        lo = bpy.data.objects.new("l", ld)
        sc.collection.objects.link(lo)
        lo.matrix_world = Matrix.Translation(loc) @ rot.to_4x4() @ Matrix.Rotation(math.radians(rz), 4, "Z") @ Matrix.Rotation(math.radians(rx), 4, "X")


def bbox_corners(objs):
    pts = []
    for o in objs:
        if o.type != "MESH":
            continue
        for c in o.bound_box:
            pts.append(o.matrix_world @ Vector(c))
    return pts


def frame(objs, right, up, w, h, pad=1.10):
    pts = bbox_corners(objs)
    rs = [p.dot(right) for p in pts]
    us = [p.dot(up) for p in pts]
    cr, cu = (max(rs) + min(rs)) / 2, (max(us) + min(us)) / 2
    er, eu = (max(rs) - min(rs)) * pad, (max(us) - min(us)) * pad
    ortho = max(er, eu * w / h) if w >= h else max(eu, er * h / w)
    return cr, cu, ortho


def shot(name, w, h):
    os.makedirs(TMP, exist_ok=True)
    path = os.path.join(TMP, name + ".png")
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path


def node_axes(nd):
    m = nd.matrix_world.to_3x3()
    return m.col[0].normalized(), m.col[1].normalized(), m.col[2].normalized()   # dome, (glTF-up is Blender Z) -> ys, up


def paste(canvas, path, x0, y0, w, h):
    im = bpy.data.images.load(path)
    px = np.array(im.pixels[:], np.float32).reshape(im.size[1], im.size[0], 4)
    H = canvas.shape[0]
    canvas[H - y0 - h:H - y0, x0:x0 + w] = px[:h, :w]
    bpy.data.images.remove(im)


def weapon_scene(wid, main_stone, small_stone):
    clear()
    objs = load(os.path.join(WDIR, f"{wid}.glb"))
    metal = [o for o in objs if o.type == "MESH"]
    stones = []
    if main_stone:
        stones += mount(objs, "socket_rune_a", main_stone)
    if small_stone:
        stones += mount(objs, "socket_rune_b", small_stone)
    node = next(o for o in objs if o.type == "EMPTY" and o.name.startswith("socket_rune_a"))
    return objs, metal, stones, node



def main_rest():
    names = ["bow", "dagger", "staff", "book", "book_open", "lute", "focus"]
    nc = len(names)
    tw = W // nc
    row_c = 190
    rows = ROW_FRONT + ROW_SIDE + 4 * row_c
    canvas = np.zeros((rows, W, 4), np.float32)
    canvas[...] = (0.30, 0.30, 0.31, 1.0)
    for i, wid in enumerate(names):
        objs, metal, stones, node = weapon_scene(wid, "fire_rune_2", "fire_rune_1")
        n, ys, up = node_axes(node)
        side = n.cross(up)
        for kind, vdir, row_h, y0 in (("front", n, ROW_FRONT, 0), ("side", side, ROW_SIDE, ROW_FRONT)):
            sc = setup_render(tw, row_h)
            right = up.cross(vdir).normalized()
            cr, cu, ortho = frame(metal, right, up, tw, row_h)
            look(sc, right * cr + up * cu + vdir * 3.0, right, up, vdir, ortho)
            paste(canvas, shot(f"{wid}_{kind}", tw, row_h), i * tw, y0, tw, row_h)
        y = ROW_FRONT + ROW_SIDE
        for t in (1, 2, 3):
            objs, metal, stones, node = weapon_scene(wid, f"fire_rune_{t}", None)
            n, ys, up = node_axes(node)
            sc = setup_render(tw, row_c)
            right = up.cross(n).normalized()
            look(sc, node.matrix_world.translation + n * 3.0, right, up, n, 0.085)
            paste(canvas, shot(f"{wid}_close{t}", tw, row_c), i * tw, y + (t - 1) * row_c, tw, row_c)
        objs, metal, stones, node = weapon_scene(wid, None, "fire_rune_1")
        nb = next(o for o in objs if o.type == "EMPTY" and o.name.startswith("socket_rune_b"))
        n, ys, up = node_axes(nb)
        sc = setup_render(tw, row_c)
        right = up.cross(n).normalized()
        look(sc, nb.matrix_world.translation + n * 3.0, right, up, n, 0.055)
        paste(canvas, shot(f"{wid}_small", tw, row_c), i * tw, y + 3 * row_c, tw, row_c)
    img = bpy.data.images.new("sheet", W, rows, alpha=False)
    img.pixels.foreach_set(canvas.ravel())
    img.filepath_raw = OUT
    img.file_format = "PNG"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    img.save()
    print(f"[hc] sheet {OUT} {W}x{rows}", flush=True)


def main_sig():
    ids = arg("ids", ",".join(SIG_RUNES)).split(",")
    cols = int(arg("cols", "7"))
    side = arg("side", "0") == "1"
    nr = (len(ids) + cols - 1) // cols
    tw, fh, sh = W // cols, 330, 230
    rh = fh + (sh if side else 0)
    canvas = np.zeros((nr * rh, W, 4), np.float32)
    canvas[...] = (0.30, 0.30, 0.31, 1.0)
    for i, wid in enumerate(ids):
        r, c = divmod(i, cols)
        objs, metal, stones, node = weapon_scene(wid, SIG_RUNES.get(wid, "fire_rune_2"), None)
        n, ys, up = node_axes(node)
        kinds = [("front", n, fh, 0)] + ([("side", n.cross(up), sh, fh)] if side else [])
        for kind, vdir, row_h, y0 in kinds:
            sc = setup_render(tw, row_h)
            right = up.cross(vdir).normalized()
            cr, cu, ortho = frame(metal, right, up, tw, row_h)
            look(sc, right * cr + up * cu + vdir * 3.0, right, up, vdir, ortho)
            paste(canvas, shot(f"{wid}_{kind}", tw, row_h), c * tw, r * rh + y0, tw, row_h)
    img = bpy.data.images.new("sheet", W, nr * rh, alpha=False)
    img.pixels.foreach_set(canvas.ravel())
    img.filepath_raw = OUT
    img.file_format = "PNG"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    img.save()
    print(f"[hc] sheet {OUT} {W}x{nr * rh}", flush=True)


def main():
    rows = ROW_FRONT + ROW_SIDE + 2 * ROW_CLOSE + 2 * ROW_STONE
    canvas = np.zeros((rows, W, 4), np.float32)
    canvas[...] = (0.30, 0.30, 0.31, 1.0)
    tw = W // 4
    y = 0
    # --- front and side
    for i, wid in enumerate(WEAPONS):
        objs, metal, stones, node = weapon_scene(wid, "fire_rune_2", "fire_rune_1")
        n, ys, up = node_axes(node)
        side = up.cross(n) if False else n.cross(up)
        for kind, vdir, vright, row_h, y0 in (("front", n, ys, ROW_FRONT, 0), ("side", side, n, ROW_SIDE, ROW_FRONT)):
            sc = setup_render(tw, row_h)
            # right vector so that the view looks along -vdir with `up` up
            right = up.cross(vdir).normalized() if kind == "front" else up.cross(vdir).normalized()
            cr, cu, ortho = frame(metal, right, up, tw, row_h)
            centre = right * cr + up * cu
            look(sc, centre + vdir * 3.0, right, up, vdir, ortho)
            paste(canvas, shot(f"{wid}_{kind}", tw, row_h), i * tw, y0, tw, row_h)
    y = ROW_FRONT + ROW_SIDE
    # --- close-ups of the main setting, tiers I-III
    ctw = W // 6
    k = 0
    for wid in WEAPONS:
        for t in (1, 2, 3):
            objs, metal, stones, node = weapon_scene(wid, f"fire_rune_{t}", None)
            n, ys, up = node_axes(node)
            sc = setup_render(ctw, ROW_CLOSE)
            right = up.cross(n).normalized()
            look(sc, node.matrix_world.translation + n * 3.0, right, up, n, 0.080)
            row, col = divmod(k, 6)
            paste(canvas, shot(f"{wid}_close{t}", ctw, ROW_CLOSE), col * ctw, y + row * ROW_CLOSE, ctw, ROW_CLOSE)
            k += 1
    y += 2 * ROW_CLOSE
    # --- the stones
    clear()
    pitch = 0.0625
    for i, sid in enumerate(STONES):
        col, row = i % 10, i // 10
        for o in [o for o in load(os.path.join(RDIR, f"{sid}.glb")) if o.parent is None]:
            o.matrix_world = Matrix.Translation((0, (col - 4.5) * pitch, -row * pitch)) @ o.matrix_world
    sc = setup_render(W, 2 * ROW_STONE)
    right, up, back = Vector((0, 1, 0)), Vector((0, 0, 1)), Vector((1, 0, 0))
    look(sc, Vector((3, 0, -pitch / 2)), right, up, back, 0.82)
    paste(canvas, shot("stones", W, 2 * ROW_STONE), 0, y, W, 2 * ROW_STONE)
    # --- save
    img = bpy.data.images.new("sheet", W, rows, alpha=False)
    img.pixels.foreach_set(canvas.ravel())
    img.filepath_raw = OUT
    img.file_format = "PNG"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    img.save()
    print(f"[hc] sheet {OUT} {W}x{rows}", flush=True)


main_sig() if SET == "sig" else main_rest() if SET == "rest" else main()
