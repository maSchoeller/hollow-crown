"""Hollow Crown - weapon library v2: the rune BOOK in two states (closed: book.glb, open: book_open.glb).

blender -b --factory-startup --python tools/art/blender_weapon_book.py -- [<out_dir>]

Writes art/models/weapons-v2/book.glb and book_open.glb. Executes blender_weapons_v2.py (up to its build loop) and
blender_weapons_v2_kit.py. Built from the painted item icon (forbidden_compendium); no ChatGPT blueprint yet.

CLOSED (frame of the old book, LEFT hand): spine along Y at the bottom (round spine in the fist, z = 0), the book stands up along Z
(0 .. 0.15), cover faces +X / -X, 0.176 wide (Y), 0.06 thick. Parts: book (HC_Vertex: violet leather covers, cream page block with
banding, round spine with two iron bands, main setting on the front cover), rune_channel (embossed V line from the setting down to
the cover edge, around the edge over three sides, ending before the small setting; no beads, UV 1 `fill` 0 .. 1),
rune_socket2 (small setting in the upper right cover corner). Nodes: socket_rune_a (main, centre of the front cover, dome +X,
symbol up +Z), socket_rune_b (small, 0.55).

OPEN (lies on a flat hand): palm plane y = 0 through the origin, spine along Z at x = 0, the pages face UP (+Y), their top edge is +Z
(the reader's far side, the figure looks along +Z). Covers y 0.004 .. 0.012, page stacks up to y = 0.028, spread 0.264 wide (X),
0.17 long (Z). The main setting sits on the RIGHT page (+X side, centre (0.064, 0)), dome +Y, symbol up +Z; the small setting on the
LEFT page (-0.064, 0). The channel is the embossed line from the setting up to the page border and around the right page (UV 1
`fill` 0 .. 1). The board camera looks from above, so a stone on the page is seen from the front [ASSUMPTION: page instead of the
thin cover edge; the cover edge is 8 mm, too small for the setting].
Both files carry the same node and mesh names (book / book_open, rune_channel, rune_socket2, socket_rune_a, socket_rune_b).
"""
import math
import os
import sys

_here = os.path.dirname(os.path.abspath(__file__))
_ns = {"__file__": os.path.join(_here, "blender_weapons_v2.py"), "__name__": "hc_weapons_v2"}
for _f, _cut in (("blender_weapons_v2.py", "os.makedirs(OUT"), ("blender_weapons_v2_kit.py", None)):
    _s = open(os.path.join(_here, _f), encoding="utf-8").read()
    _s = _s[:_s.index(_cut)] if _cut else _s
    exec(compile(_s, _f, "exec"), _ns)
globals().update({k: v for k, v in _ns.items() if not k.startswith("__")})

IDENT = Matrix.Identity(4)
EMB = dict(hw=0.0032, e_off=0.0008, a_off=0.0022, rails=False)     # embossed line (no beads)


def cover_fn(seed):
    def f(co, n):
        e = min(max(0.35 + 0.3 * vnoise(co.y, co.z, 0.012, seed) + 0.15 * n.x + 0.15 * n.y, 0.0), 1.0)
        return lerp_c(COVER_D, COVER_L, e * 0.8)
    return f


def paper_fn(axis):
    def f(co, n):
        v = getattr(co, axis)
        band = 0.5 + 0.5 * math.cos(v * 2 * math.pi / 0.0032)
        return lerp_c(PAPER_D, PAPER_L, 0.35 + 0.45 * band * 0.8 + 0.15 * vnoise(co.y, co.z, 0.01, 8))
    return f


def book_closed():
    parts = []
    # covers and pages
    for sg in (1, -1):
        cv = new_obj("cover", mesh_from_bm(box_bm((sg * 0.026, 0, 0.075), (0.008, 0.176, 0.150), bevel=0.003, segs=2), "cover"))
        parts.append(col(cv, cover_fn(3 if sg > 0 else 4)))
    pages = new_obj("pages", mesh_from_bm(box_bm((0, 0, 0.072), (0.044, 0.160, 0.144), bevel=0.0015), "pages"))
    parts.append(col(pages, paper_fn("x")))
    spine = sweep(np.array([(0, y, 0.0) for y in np.linspace(-0.088, 0.088, 6)]), 0.030, 0.030, 16, (0, 0, 1), None, True, "spine")
    parts.append(col(spine, cover_fn(5)))
    for y in (-0.050, 0.050):
        band = sweep(np.array([(0, yy, 0.0) for yy in np.linspace(y - 0.007, y + 0.007, 3)]), 0.0325, 0.0325, 16, (0, 0, 1), None, True, "band")
        parts.append(col(band, steel_fn(7, 0.4, 0.3)))
    pos_a = (0.030, 0.0, 0.075)
    parts += main_setting(pos_a, (1, 0, 0), (0, 0, 1), "socket_rune_a", IDENT)
    sp, sf = small_setting((0.030, 0.060, 0.123), (1, 0, 0), (0, 0, 1), "socket_rune_b", IDENT)
    sock2 = make_socket2(sp, sf)
    c = 0.075
    poly = [(0.0, c - 0.034), (0.0, c - 0.060), (-0.073, c - 0.060), (-0.073, c + 0.060), (0.030, c + 0.060)]
    pts = rounded_poly([(0.030, y, z) for y, z in poly], 0.018)
    chan, _ = channel([(pts, (1, 0, 0))], **EMB)
    return parts, chan, sock2


def book_open():
    parts = []
    Y_P = 0.028
    for sg in (1, -1):
        cv = new_obj("cover", mesh_from_bm(box_bm((sg * 0.066, 0.008, 0), (0.132, 0.008, 0.170), bevel=0.0025, segs=2), "cover"))
        parts.append(col(cv, cover_fn(3 if sg > 0 else 4)))
        pg = new_obj("pages", mesh_from_bm(box_bm((sg * 0.064, 0.020, 0), (0.118, 0.016, 0.156), bevel=0.0015), "pages"))
        parts.append(col(pg, paper_fn("y")))
    spine = sweep(np.array([(0, 0.010, z) for z in np.linspace(-0.085, 0.085, 6)]), 0.012, 0.0075, 12, (0, 1, 0), None, True, "spine")
    parts.append(col(spine, cover_fn(5)))
    parts += main_setting((0.064, Y_P, 0.0), (0, 1, 0), (0, 0, 1), "socket_rune_a", IDENT)
    sp, sf = small_setting((-0.064, Y_P, 0.0), (0, 1, 0), (0, 0, 1), "socket_rune_b", IDENT)
    sock2 = make_socket2(sp, sf)
    poly = [(0.064, 0.034), (0.064, 0.067), (0.111, 0.067), (0.111, -0.067), (0.017, -0.067), (0.017, 0.067), (0.048, 0.067)]
    pts = rounded_poly([(x, Y_P, z) for x, z in poly], 0.016)
    chan, _ = channel([(pts, (0, 1, 0))], **EMB)
    return parts, chan, sock2


clear_scene()
p, c, s = book_closed()
finish("book", p, c, s, None)
clear_scene()
p, c, s = book_open()
finish("book_open", p, c, s, None)
