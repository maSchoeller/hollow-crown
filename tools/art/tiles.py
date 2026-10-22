#!/usr/bin/env python3
"""Hollow Crown - floor tileset generator (dual-grid, 48 px).

    python tools/art/tiles.py            # writes art/tiles/*
    python tools/art/tiles.py --check    # also runs the seam self-test

Writes into art/tiles/:
    <ground>.png            4x4 dual-grid atlas (192x192), index = TL1|TR2|BL4|BR8, tile (i%4, i//4)
    <ground>_<f>.png        animated grounds (river, shallows), frames 0..3 (+ <ground>.png = frame 0)
    <ground>_full.png       row of fully covered variants (column 0 == atlas index 15), all tile with each other
    decals.png/.json        ground details, one 48x48 cell each
    objects.png/.json       field-bound objects (bridges, gate, throne, cliff ...)
    preview_map.png         12x10 sample map at 2x, composed exactly like the game should (see compose())

Everything is deterministic (fixed seeds). Only Pillow + numpy are needed.
Art direction: concept/15-art-direction.md (palette Hollow-64, light from the top left,
cool shadows, warm lights). Format: art/README.md.

How the edges work (important for anybody touching this file):
    Every layer mask is a pure function of WORLD position: a field built from the 4 cells under the
    dual tile, sampled at a jittered position, thresholded with noise. All noise is toroidal with
    period 48 in dual-tile coordinates, so neighbouring dual tiles agree pixel-exactly at their seams.
    Layers are nested: mask(higher) >= mask(lower) wherever both share a boundary, so intermediate
    layers (e.g. road under grass at a grass/plain edge) never peek out. Only `plain` (shore foam
    on the water) and `wall` (cast shadow) draw anything outside their own mask.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "art" / "tiles"
T = 48            # field size
HALF = T // 2
M = 24            # canvas margin around a dual tile (= half a cell, the 4 cells are fully known)
S = T + 2 * M     # canvas size

GROUNDS = ["river", "shallows", "plain", "sand", "road", "grass", "ash", "wall"]   # bottom -> top
PRIO = {g: i for i, g in enumerate(GROUNDS)}
FRAMES = {"river": 4, "shallows": 4}
MASK_OF = {"river": "base", "shallows": "base", "plain": "base", "sand": "base", "road": "base",
           "grass": "grass", "ash": "grass", "wall": "wall"}
FULL_VARIANTS = {"plain": 4, "grass": 4, "sand": 4, "road": 4, "ash": 4, "wall": 2}
WALL_FACE = 13    # height of the wall's south face in px
WALL_GROW = 6     # the wall overhangs its cell by this much (face + grow + jitter must stay < 24)


# ---------------------------------------------------------------------------------------------
# palette
# ---------------------------------------------------------------------------------------------
def _palette_file() -> Path:
    for p in (ROOT / "art" / "palette" / "hollow-64.hex", ROOT / "concept" / "art" / "palette" / "hollow-64.hex"):
        if p.exists():
            return p
    raise FileNotFoundError("hollow-64.hex not found")


PALETTE = [l.strip().lower() for l in _palette_file().read_text(encoding="utf-8").splitlines() if l.strip()]
_PALSET = set(PALETTE)


def C(h: str) -> np.ndarray:
    h = h.lower().lstrip("#")
    if h not in _PALSET:
        raise ValueError(f"{h} is not in Hollow-64")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.uint8)


def CA(h: str, a: int = 255) -> tuple:
    c = C(h)
    return (int(c[0]), int(c[1]), int(c[2]), a)


# ---------------------------------------------------------------------------------------------
# toroidal noise helpers (all 48x48, seamless)
# ---------------------------------------------------------------------------------------------
def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def value_noise(r: np.random.Generator, cells, size: int = T) -> np.ndarray:
    """Smooth toroidal value noise; cells = n or (n_x, n_y) for stretched clusters."""
    cx, cy = (cells, cells) if np.isscalar(cells) else cells
    g = r.random((cy, cx))

    def axis(n):
        co = np.arange(size) * n / size
        i0 = np.floor(co).astype(int)
        f = co - i0
        return i0 % n, (i0 + 1) % n, f * f * (3 - 2 * f)

    x0, x1, fx = axis(cx)
    y0, y1, fy = axis(cy)
    fy, fx = fy[:, None], fx[None, :]
    a, b = g[np.ix_(y0, x0)], g[np.ix_(y0, x1)]
    c, d = g[np.ix_(y1, x0)], g[np.ix_(y1, x1)]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fbm(r: np.random.Generator, octaves, size: int = T) -> np.ndarray:
    out = np.zeros((size, size))
    for cells, w in octaves:
        out += w * value_noise(r, cells, size)
    return out


def rank01(a: np.ndarray) -> np.ndarray:
    o = a.ravel().argsort().argsort()
    return (o / (o.size - 1)).reshape(a.shape)


def signed(a: np.ndarray) -> np.ndarray:
    a = a - a.mean()
    return a / np.abs(a).max()


def interior_weight(margin: int = 5, ramp: int = 8) -> np.ndarray:
    i = np.arange(T)
    d = np.minimum(i, T - 1 - i)
    dd = np.minimum(d[:, None], d[None, :])
    w = np.clip((dd - margin) / ramp, 0, 1)
    return w * w * (3 - 2 * w)


def variant_field(gen, seed: int, variant: int) -> np.ndarray:
    """Rank-normalised field; variants differ only inside, the border band equals variant 0."""
    f0 = rank01(gen(rng(seed)))
    if variant == 0:
        return f0
    fk = rank01(gen(rng(seed + 1009 * variant)))
    w = interior_weight()
    return f0 * (1 - w) + fk * w


def mode_filter(lbl: np.ndarray, n: int, iters: int = 1, keep: int = 4) -> np.ndarray:
    """Toroidal majority filter: removes single-pixel noise, keeps clusters."""
    for _ in range(iters):
        counts = np.zeros((n,) + lbl.shape, int)
        for k in range(n):
            m = (lbl == k).astype(int)
            counts[k] = sum(np.roll(m, (dy, dx), (0, 1)) for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        own = np.take_along_axis(counts, lbl[None], 0)[0]
        lbl = np.where(own >= keep, lbl, counts.argmax(0))
    return lbl


def paint(lbl: np.ndarray, cols) -> np.ndarray:
    img = np.zeros(lbl.shape + (3,), np.uint8)
    for k, h in enumerate(cols):
        img[lbl == k] = C(h)
    return img


def stamp(img: np.ndarray, rows, cmap: dict, x: int, y: int, wrap: bool = True) -> None:
    """Stamp a tiny pixel template. '.' = transparent. Wraps toroidally on 48x48 textures."""
    h, w = img.shape[:2]
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == "." or ch == " ":
                continue
            X, Y = x + i, y + j
            if wrap:
                X, Y = X % w, Y % h
            elif not (0 <= X < w and 0 <= Y < h):
                continue
            col = cmap[ch]
            if img.shape[2] == 4:
                img[Y, X] = (*C(col), 255)
            else:
                img[Y, X] = C(col)


def scatter(seed: int, variant: int, n: int, fw: int, fh: int, min_d: float, margin: int = 4):
    """Poisson-ish toroidal scatter of n footprints (fw x fh, top-left anchor).
    Items touching the border band are shared by all variants, interior items differ per variant."""
    def poisson(r, count, existing, interior_only):
        pts = list(existing)
        out = []
        tries = 0
        while len(out) < count and tries < 4000:
            tries += 1
            if interior_only:
                x = int(r.integers(margin, T - margin - fw + 1))
                y = int(r.integers(margin, T - margin - fh + 1))
            else:
                x, y = int(r.integers(0, T)), int(r.integers(0, T))
            ok = True
            for px, py in pts:
                dx = min(abs(px - x), T - abs(px - x))
                dy = min(abs(py - y), T - abs(py - y))
                if dx * dx + dy * dy < min_d * min_d:
                    ok = False
                    break
            if ok:
                pts.append((x, y))
                out.append((x, y))
        return out

    def interior(p):
        x, y = p
        return x >= margin and y >= margin and x + fw <= T - margin and y + fh <= T - margin

    base = poisson(rng(seed), n, [], False)
    if variant == 0:
        return base
    border = [p for p in base if not interior(p)]
    inner = poisson(rng(seed + 7919 * variant), n - len(border), border, True)
    return border + inner


def ihash(*v: int) -> float:
    """Deterministic integer hash -> [0, 1)."""
    h = 2166136261
    for x in v:
        h = ((h ^ (x & 0xFFFFFFFF)) * 16777619) & 0xFFFFFFFF
        h ^= h >> 13
        h = (h * 1274126177) & 0xFFFFFFFF
    return (h & 0xFFFFFF) / 0x1000000


# ---------------------------------------------------------------------------------------------
# dual-grid masks
# ---------------------------------------------------------------------------------------------
_TC = np.arange(S) - M                       # canvas -> tile coordinate (-24 .. 71)
GX, GY = np.meshgrid(_TC.astype(float), _TC.astype(float))
_WR = _TC % T


def tor(a: np.ndarray) -> np.ndarray:
    """Sample a toroidal 48x48 array over the whole canvas."""
    return a[np.ix_(_WR, _WR)]


_nr = rng(1207)


def _jitter(r, amp, octaves):
    a = fbm(r, octaves)
    return np.clip((a - a.mean()) / a.std() * amp, -2.6 * amp, 2.6 * amp)


JX = _jitter(_nr, 3.1, [(2, 0.9), (4, 1.0), (8, 0.7), (16, 0.3), (24, 0.15)])   # boundary jitter, |J| <= 8
JY = _jitter(_nr, 3.1, [(2, 0.9), (4, 1.0), (8, 0.7), (16, 0.3), (24, 0.15)])
NT = _jitter(_nr, 0.07, [(8, 1.0), (16, 0.6), (24, 0.3)])               # threshold noise
_b = _nr.random((T, T))
BLADE = np.where(np.arange(T)[None, :] % 2 == 0, np.where(_b < 0.45, 2, np.where(_b < 0.85, 1, 0)),
                 np.where(_b < 0.2, 1, 0))                          # grass blade height on north edges
BUMP = _nr.random((T, T)) < 0.30                                     # 1px bumps on side edges
DROOP = _nr.random((T, T)) < 0.22                                    # 1px droop on south edges
del _b


def _prof(t: np.ndarray, r: float) -> np.ndarray:
    u = np.clip((t + r) / (2 * r), 0, 1)
    return u * u * (3 - 2 * u)


def field(idx: int, qx: np.ndarray, qy: np.ndarray, r: float) -> np.ndarray:
    """Smoothed coverage of the 4 cells (cell borders at tile coordinate 24)."""
    x1 = _prof(qx - HALF, r)
    y1 = _prof(qy - HALF, r)
    x0, y0 = 1 - x1, 1 - y1
    b = [(idx >> k) & 1 for k in range(4)]
    return b[0] * x0 * y0 + b[1] * x1 * y0 + b[2] * x0 * y1 + b[3] * x1 * y1


def at(m: np.ndarray, dx: int, dy: int) -> np.ndarray:
    """Value of m at (x+dx, y+dy)."""
    return np.roll(m, (-dy, -dx), axis=(0, 1))


def majority(m: np.ndarray) -> np.ndarray:
    n = sum(at(m, dx, dy).astype(int) for dy in (-1, 0, 1) for dx in (-1, 0, 1))
    return n >= 5


def erode_diamond(m: np.ndarray, n: int) -> np.ndarray:
    for _ in range(n):
        m = m & at(m, 1, 0) & at(m, -1, 0) & at(m, 0, 1) & at(m, 0, -1)
    return m


def dilate_diamond(m: np.ndarray, n: int) -> np.ndarray:
    for _ in range(n):
        m = m | at(m, 1, 0) | at(m, -1, 0) | at(m, 0, 1) | at(m, 0, -1)
    return m


def dist_in(m: np.ndarray, maxd: int) -> np.ndarray:
    """4-connected distance of inside pixels to the outside (1 = edge pixel), capped at maxd+1."""
    d = np.where(m, maxd + 1, 0)
    cur = ~m
    for k in range(1, maxd + 1):
        ring = m & (d > k) & (at(cur, 1, 0) | at(cur, -1, 0) | at(cur, 0, 1) | at(cur, 0, -1))
        d[ring] = k
        cur = cur | ring
    return d


def dist_out(m: np.ndarray, maxd: int) -> np.ndarray:
    return dist_in(~m, maxd)


_MASK_CACHE: dict = {}


def masks(idx: int) -> dict:
    if idx in _MASK_CACHE:
        return _MASK_CACHE[idx]
    base = field(idx, GX + tor(JX), GY + tor(JY), 11.0) + tor(NT) > 0.52
    base = majority(majority(base))
    base = dilate_diamond(erode_diamond(base, 2), 2)        # opening: no islands thinner than 5 px
    base = erode_diamond(dilate_diamond(base, 1), 1)        # closing: no pin holes
    north = np.zeros_like(base)
    for k in (1, 2):
        cond = ~base & at(base, 0, k)
        if k == 2:
            cond &= ~at(base, 0, 1)
        north |= cond & (at(tor(BLADE), 0, k) >= k)
    side = ~base & (at(base, 1, 0) | at(base, -1, 0)) & ~at(base, 0, 1) & tor(BUMP)
    droop = ~base & at(base, 0, -1) & tor(DROOP)
    grass = base | north | side | droop
    # wall: nearly straight cell shape, grown by WALL_GROW px; must contain every lower layer -> union
    wx, wy = GX + tor(JX) * 0.35, GY + tor(JY) * 0.35
    core = dilate_diamond(field(idx, wx, wy, 2.5) > 0.5, WALL_GROW)
    core_up = dilate_diamond(field(idx, wx, wy + WALL_FACE, 2.5) > 0.5, WALL_GROW)
    out = {"base": base, "grass": grass, "blade": grass & ~base, "wall": core | grass,
           "wall_core": core, "wall_face": core & ~core_up}
    _MASK_CACHE[idx] = out
    return out


# ---------------------------------------------------------------------------------------------
# ground textures (48x48 RGB, toroidal)
# ---------------------------------------------------------------------------------------------
PEBBLE = [".ab.", "abbc", ".ccd"]
PEBBLE_S = ["ab", "cd"]
PEB_COL = {"a": "e8e2d6", "b": "a39fa6", "c": "6e6a78", "d": "6b5a44"}


def tex_plain(variant: int = 0) -> np.ndarray:
    f = variant_field(lambda r: fbm(r, [(6, 1.0), (12, 0.7), (24, 0.4)]), 101, variant)
    lbl = mode_filter(np.digitize(f, [0.05, 0.80]), 3, 2)
    img = paint(lbl, ["6b5a44", "a8916a", "c79a68"])
    # trodden darker grains in small clusters
    g = variant_field(lambda r: fbm(r, [(24, 1.0)]), 102, variant)
    grains = (g > 0.93) & (lbl == 1)
    img[grains] = C("6b5a44")
    img[np.roll(grains, (1, 1), (0, 1)) & (lbl == 1) & ~grains] = C("c79a68")
    # subtle cracks
    for i, (x, y) in enumerate(scatter(103, variant, 2, 10, 9, 22)):
        r = rng(1030 + x * 48 + y)                              # shape depends on position only
        cx, cy = x, y + 4
        for _ in range(int(r.integers(5, 9))):
            img[cy % T, cx % T] = C("6b5a44")
            img[(cy + 1) % T, cx % T] = C("c79a68") if r.random() < 0.5 else img[(cy + 1) % T, cx % T]
            cx += 1
            cy += int(r.choice([-1, 0, 0, 1]))
            if r.random() < 0.25:
                img[(cy - 1) % T, (cx + 1) % T] = C("6b5a44")
    for x, y in scatter(104, variant, 4, 4, 3, 11):
        stamp(img, PEBBLE, PEB_COL, x, y)
    for x, y in scatter(105, variant, 5, 2, 2, 9):
        stamp(img, PEBBLE_S, {"a": "a39fa6", "b": "6e6a78", "c": "6b5a44", "d": "6b5a44"}, x, y)
    for x, y in scatter(106, variant, 4, 3, 3, 10):          # dry stalks
        stamp(img, ["a.b", ".a.", ".c."], {"a": "d1aa4f", "b": "8a6a2e", "c": "6b5a44"}, x, y)
    return img


TUFTS = [
    [".h...h.", ".lh.hl.", "..lml..", ".ddddd."],
    ["h.h", "lhl", "mlm", ".d."],
    [".h..", "lh.h", "mllm", "dddd"],
    ["..h..", ".hlh.", "lmlml", ".ddd."],
]
TUFT_COL = {"h": "c9e07a", "l": "8bbb4a", "m": "4f8a3a", "d": "2f5e33"}


def tex_grass(variant: int = 0, burnt: bool = False) -> np.ndarray:
    f = variant_field(lambda r: fbm(r, [(6, 1.0), (12, 0.8), (24, 0.35)]), 201, variant)
    lbl = mode_filter(np.digitize(f, [0.12, 0.86]), 3, 2)
    img = paint(lbl, ["2f5e33", "4f8a3a", "8bbb4a"])
    # fine blade texture: short vertical 2px strokes in a slightly darker/lighter tone
    s = variant_field(lambda r: r.random((T, T)), 202, variant)
    stroke = (s > 0.86)
    up = np.roll(stroke, 1, 0)
    img[stroke & (lbl == 1)] = C("2f5e33")
    img[up & (lbl == 1) & ~stroke] = C("8bbb4a")
    img[stroke & (lbl == 2)] = C("4f8a3a")
    img[stroke & (lbl == 0)] = C("1f3a2c")
    for i, (x, y) in enumerate(scatter(203, variant, 11, 7, 4, 10)):
        stamp(img, TUFTS[int(ihash(x, y, 3) * len(TUFTS))], TUFT_COL, x, y)
    for x, y in scatter(204, variant, 3, 1, 1, 14):           # late summer: a few wheat-gold seeds
        img[y, x] = C("d1aa4f")
    return img


def tex_ash(variant: int = 0) -> np.ndarray:
    f = variant_field(lambda r: fbm(r, [(6, 1.0), (12, 0.7), (24, 0.4)]), 701, variant)
    lbl = mode_filter(np.digitize(f, [0.22, 0.91]), 3, 2)
    img = paint(lbl, ["2e2a3b", "4a4656", "6e6a78"])
    s = variant_field(lambda r: r.random((T, T)), 702, variant)
    img[(s > 0.90) & (lbl == 1)] = C("2e2a3b")
    img[(s > 0.93) & (lbl == 0)] = C("1a1625")
    for x, y in scatter(703, variant, 7, 3, 3, 9):            # charred stubble
        stamp(img, ["a..", "b.a", "..b"] if ihash(x, y) < 0.5 else [".a", "ab", "b."],
              {"a": "2d1e1a", "b": "1a1625"}, x, y)
    for x, y in scatter(704, variant, 5, 3, 3, 12):           # embers
        big = ihash(x, y, 9) < 0.45
        stamp(img, [".r.", "rYr", ".r."] if big else ["..", ".o"] if ihash(y, x) < 0.5 else ["o.", ".."],
              {"r": "6b1d1d", "Y": "ffc06b", "o": "e8743b"}, x, y)
        if big:
            img[(y + 1) % T, (x + 2) % T] = C("c2451e")
    return img


def _voronoi(seed: int, variant: int, grid: int = 6, jitter: float = 0.32):
    r = rng(seed)
    step = T / grid
    pts = []
    for j in range(grid):
        for i in range(grid):
            pts.append(((i + 0.5 + r.uniform(-jitter, jitter)) * step, (j + 0.5 + r.uniform(-jitter, jitter)) * step))
    if variant:  # move interior seeds only
        rk = rng(seed + 31 * variant)
        pts = [(x + rk.uniform(-1.6, 1.6), y + rk.uniform(-1.6, 1.6))
               if 14 < x < 34 and 14 < y < 34 else (x, y) for x, y in pts]
    pts = np.array(pts)
    yy, xx = np.mgrid[0:T, 0:T] + 0.5
    dx = np.abs(xx[..., None] - pts[:, 0])
    dy = np.abs(yy[..., None] - pts[:, 1])
    dx = np.minimum(dx, T - dx)
    dy = np.minimum(dy, T - dy)
    d = np.sqrt(dx * dx + dy * dy * 1.25)
    order = np.argsort(d, axis=-1)
    d1 = np.take_along_axis(d, order[..., :1], -1)[..., 0]
    d2 = np.take_along_axis(d, order[..., 1:2], -1)[..., 0]
    return order[..., 0], d1, d2


def tex_road(variant: int = 0) -> np.ndarray:
    cell, d1, d2 = _voronoi(401, variant, 6)
    joint = (d2 - d1) < 1.25
    lbl = np.zeros((T, T), int)
    # per-stone tone
    tone = np.array([ihash(int(k), 4) for k in range(36)])
    st = tone[cell]
    stone = np.where(st < 0.18, 0, np.where(st < 0.85, 1, 2))     # dark / mid / warm stone
    img = np.zeros((T, T, 3), np.uint8)
    body = {0: ("4f5b70", "8995a8", "2b3242"), 1: ("8995a8", "d3dae4", "4f5b70"), 2: ("a8916a", "c79a68", "6b5a44")}
    for k, (mid, hi, lo) in body.items():
        sel = (stone == k) & ~joint
        img[sel] = C(mid)
        # light from top-left: pixels whose up-left neighbour is a joint -> highlight
        jl = np.roll(np.roll(joint, 1, 0), 1, 1) | np.roll(joint, 1, 0)
        jr = np.roll(np.roll(joint, -1, 0), -1, 1) | np.roll(joint, -1, 0)
        img[sel & jl & ~jr] = C(hi)
        img[sel & jr & ~jl] = C(lo)
    # joints: packed dirt, a little moss
    jn = variant_field(lambda r: r.random((T, T)), 402, variant)
    img[joint] = C("6a4130")
    img[joint & (jn > 0.55)] = C("6b5a44")
    img[joint & (jn > 0.96)] = C("4f8a3a")
    return img


def tex_sand(variant: int = 0) -> np.ndarray:
    f = variant_field(lambda r: fbm(r, [(6, 1.0), (12, 0.6), (24, 0.3)]), 501, variant)
    lbl = mode_filter(np.digitize(f, [0.05, 0.80]), 3, 2)
    img = paint(lbl, ["c79a68", "f2d98c", "f5e08f"])
    seg = variant_field(lambda r: fbm(r, [(6, 1.0), (12, 0.5)]), 502, variant)
    r = rng(503)
    xs = np.arange(T)
    for j in range(6):
        ph, ps = r.uniform(0, 2 * np.pi, 2)
        yb = 8 * j + 3 + 1.6 * np.sin(2 * np.pi * 2 * xs / T + ph) + 0.9 * np.sin(2 * np.pi * 3 * xs / T + ps)
        yb = np.round(yb).astype(int)
        for x in xs:
            if seg[yb[x] % T, x] < 0.30:
                continue
            img[yb[x] % T, x] = C("c79a68")
            img[(yb[x] - 1) % T, x] = C("f5e08f")
            if seg[yb[x] % T, x] > 0.85:
                img[(yb[x] + 1) % T, x] = C("d1aa4f")
    g = variant_field(lambda r: r.random((T, T)), 504, variant)
    img[g > 0.985] = C("9a6a45")
    img[(g > 0.97) & (g <= 0.985)] = C("ffc06b")
    return img


def tex_river(frame: int) -> np.ndarray:
    # deep water in long horizontal streaks, current dashes drifting east
    f = rank01(fbm(rng(301), [((3, 12), 1.0), ((6, 24), 0.5), ((12, 48), 0.2)]))
    lbl = mode_filter(np.digitize(f, [0.17, 0.96]), 3, 1)
    img = paint(lbl, ["1d2a5a", "2f5f9e", "4aa8e8"])
    # pattern period 24 px -> 6 px per frame loops in 4 frames
    r = rng(302)
    for _ in range(8):
        x0, y0, ln = int(r.integers(0, 24)), int(r.integers(0, T)), int(r.integers(4, 9))
        bright = r.random() < 0.45
        for rep in (0, 24):
            for i in range(ln):
                x = (x0 + rep + i + frame * 6) % T
                img[y0, x] = C("4aa8e8")
                if i == ln - 1 and bright:
                    img[y0, x] = C("a8e4f5")
                if i < ln - 1:
                    img[(y0 + 1) % T, x] = C("1d2a5a")
    gr = rng(303)
    for i in range(8):                                          # glints that blink
        x, y, ph = int(gr.integers(0, T)), int(gr.integers(0, T)), int(gr.integers(0, 4))
        if (frame + ph) % 4 == 0:
            img[y, x] = C("a8e4f5")
            img[y, (x + 1) % T] = C("4aa8e8")
    return img


def tex_shallows(frame: int) -> np.ndarray:
    f = rank01(fbm(rng(601), [((4, 8), 1.0), ((8, 16), 0.5), ((16, 24), 0.25)]))
    lbl = mode_filter(np.digitize(f, [0.08, 0.93]), 3, 2)
    img = paint(lbl, ["2f5f9e", "4aa8e8", "a8e4f5"])
    for x, y in scatter(602, 0, 6, 4, 3, 11):                 # pebbles on the bed
        stamp(img, [".ab.", "abbc", ".cc."] if ihash(x, y) < 0.6 else ["ab", "bc"],
              {"a": "a8e4f5", "b": "8995a8", "c": "2f5f9e"}, x, y)
    # wavelets: short crests with a trough shadow, drifting 1 px per frame, gone every 4th frame
    for k, (x, y) in enumerate(scatter(603, 0, 13, 6, 2, 9)):
        ph = int(ihash(x, y, 6) * 4)
        st = (frame + ph) % 4
        if st == 3:
            continue
        ln = 3 + int(ihash(x, y, 7) * 3) - (1 if st == 0 else 0)
        xs = x + st
        for i in range(ln):
            img[y % T, (xs + i) % T] = C("a8e4f5")
            img[(y + 1) % T, (xs + i + 1) % T] = C("2f5f9e")
    return img


def tex_wall(variant: int = 0) -> np.ndarray:
    """Wall walk seen from above: large dark flagstones (parapet and face are painted from the mask)."""
    img = np.zeros((T, T, 3), np.uint8)
    yy, xx = np.mgrid[0:T, 0:T]
    row = yy // 12
    off = (row % 2) * 8
    bx = (xx + off) // 16
    lx = (xx + off) % 16
    ly = yy % 12
    img[:] = C("4a4656")
    for rr in range(4):
        for b in range(4):
            t = ihash(rr, b, 11 + (variant if rr in (1, 2) and b in (1, 2) else 0))
            sel = (row == rr) & (bx % 3 == b % 3) & (((xx + off) // 16) == b)
            if t < 0.3:
                img[sel] = C("4a4656")
            elif t > 0.7:
                img[sel] = C("6e6a78")
    img[(ly == 1) & (lx >= 1) & (lx <= 13)] = C("6e6a78")
    img[(lx == 1) & (ly >= 1) & (ly <= 9)] = C("6e6a78")
    img[(ly == 1) & (lx >= 1) & (lx <= 3)] = C("a39fa6")
    img[(ly == 0) | (lx == 0)] = C("2e2a3b")
    s = variant_field(lambda r: r.random((T, T)), 902, variant)
    img[((ly == 0) | (lx == 0)) & (s > 0.9)] = C("2f5e33")     # moss in the joints
    img[(s < 0.025) & (ly > 2) & (lx > 2)] = C("2e2a3b")       # pits
    return img


def texture(layer: str, frame: int = 0, variant: int = 0) -> np.ndarray:
    return {
        "plain": lambda: tex_plain(variant),
        "grass": lambda: tex_grass(variant),
        "ash": lambda: tex_ash(variant),
        "road": lambda: tex_road(variant),
        "sand": lambda: tex_sand(variant),
        "river": lambda: tex_river(frame),
        "shallows": lambda: tex_shallows(frame),
        "wall": lambda: tex_wall(variant),
    }[layer]()


# ---------------------------------------------------------------------------------------------
# edge painting per layer (on the 96x96 canvas; tile = canvas[M:M+T, M:M+T])
# ---------------------------------------------------------------------------------------------
def _edges(m):
    return dict(n=m & ~at(m, 0, -1), s=m & ~at(m, 0, 1), w=m & ~at(m, -1, 0), e=m & ~at(m, 1, 0))


def _set(rgba, sel, col, a=255):
    rgba[sel] = (*C(col), a)


def paint_tile(layer: str, idx: int, frame: int = 0, variant: int = 0, canvas: bool = False) -> np.ndarray:
    mk = masks(idx)
    m = mk[MASK_OF[layer]]
    tex = tor(texture(layer, frame, variant))
    rgba = np.zeros((S, S, 4), np.uint8)
    rgba[m, :3] = tex[m]
    rgba[m, 3] = 255
    E = _edges(m)
    di = dist_in(m, 4)
    pat = tor(rng(77).random((T, T)))

    if layer == "plain":
        # south bank: earth face 3 px where the land drops into water
        down = [m & ~at(m, 0, k) for k in (1, 2, 3)]
        bank = down[0] | down[1] | down[2]
        _set(rgba, down[2] & ~down[1], "6b5a44")
        _set(rgba, down[1] & ~down[0], "6a4130")
        _set(rgba, down[0], "3b2420")
        _set(rgba, bank & ~down[0] & (pat > 0.8), "a39fa6")
        lip = at(bank, 0, 1) & m & ~bank
        _set(rgba, lip, "c79a68")
        _set(rgba, (E["n"] | E["w"] | E["e"]) & ~bank, "6b5a44")
        _set(rgba, (at(E["n"], 0, -1) | at(E["w"], -1, 0)) & m & ~bank & (di == 2), "c79a68")
        # outside: shore foam on the water and a dark reflection under the bank
        do = dist_out(m, 3)
        under = ~m & (at(m, 0, -1) | at(m, 0, -2))
        _set(rgba, under & at(m, 0, -1), "1d2a5a", 150)
        _set(rgba, under & ~at(m, 0, -1), "1d2a5a", 80)
        foam1 = (do == 1) & ~under
        _set(rgba, foam1 & (pat > 0.25), "a8e4f5")
        _set(rgba, foam1 & (pat > 0.88), "e8e2d6")
        foam2 = (do == 2) & ~(under & at(m, 0, -1))
        _set(rgba, foam2 & (pat > 0.62), "a8e4f5", 200)
        _set(rgba, (do == 3) & (pat > 0.90), "a8e4f5", 160)

    elif layer in ("grass", "ash"):
        blade = mk["blade"]
        if layer == "grass":
            out_lo, out_hi, sh, hl, tip, stem = "1f3a2c", "2f5e33", "2f5e33", "8bbb4a", "c9e07a", "4f8a3a"
        else:
            out_lo, out_hi, sh, hl, tip, stem = "1a1625", "2e2a3b", "2e2a3b", "6e6a78", "c2451e", "2d1e1a"
        edge = (di == 1) & ~blade
        _set(rgba, edge & (E["n"] | E["w"]), out_hi)
        _set(rgba, edge & (E["s"] | E["e"]), out_lo)
        _set(rgba, edge & E["s"] & ~at(blade, 0, -1), "4f3426" if layer == "grass" else "2d1e1a")   # turf edge
        inner = (di == 2) & ~blade
        _set(rgba, inner & (at(E["n"], 0, -1) | at(E["w"], -1, 0)) & (pat > 0.3), hl)
        _set(rgba, inner & (at(E["s"], 0, 1) | at(E["e"], 1, 0)), sh)
        # blades: lit tip, darker stem
        btip = blade & ~at(m, 0, -1)
        _set(rgba, blade, stem)
        _set(rgba, btip, tip if layer == "grass" else ("c2451e" if False else "2d1e1a"))
        if layer == "grass":
            _set(rgba, btip & (pat > 0.6), hl)
        else:
            _set(rgba, btip & (pat > 0.85), "e8743b")
            _set(rgba, edge & (pat > 0.93), "c2451e")

    elif layer == "sand":
        edge = di == 1
        _set(rgba, edge & (E["n"] | E["w"]), "c79a68")
        _set(rgba, edge & (E["s"] | E["e"]), "9a6a45")
        _set(rgba, (di == 2) & (at(E["n"], 0, -1) | at(E["w"], -1, 0)), "f5e08f")
        _set(rgba, (di == 2) & (at(E["s"], 0, 1)), "c79a68")

    elif layer == "road":
        edge = di == 1
        _set(rgba, edge, "6b5a44")
        _set(rgba, edge & (E["s"] | E["e"]), "6a4130")
        curb = (di == 2) | ((di == 3) & (pat > 0.5))
        _set(rgba, curb & (pat > 0.55), "a8916a")
        _set(rgba, curb & (pat <= 0.55), "6b5a44")
        _set(rgba, (di == 2) & (pat > 0.9), "c79a68")

    elif layer == "shallows":
        edge = di == 1
        _set(rgba, edge & (E["n"] | E["w"]), "a8e4f5")
        _set(rgba, edge & (E["s"] | E["e"]), "2f5f9e")
        _set(rgba, (di == 2) & (pat > 0.45), "a8e4f5")

    elif layer == "river":
        _set(rgba, di == 1, "1d2a5a")

    elif layer == "wall":
        _paint_wall(rgba, m, mk, di, E, pat)

    return rgba if canvas else rgba[M:M + T, M:M + T]


def _paint_wall(rgba, m, mk, di, E, pat):
    H = WALL_FACE
    face = mk["wall_face"]
    rubble = m & ~mk["wall_core"]
    # face row counted from the bottom (1 = foot of the wall)
    fd = np.zeros(m.shape, int)
    for k in range(H + 2, 0, -1):
        fd[face & ~at(face, 0, k)] = k
    top = mk["wall_core"] & ~face
    tE = _edges(top)
    # --- front face: brick courses following the bottom contour
    course = (fd - 1) // 4
    cy = (fd - 1) % 4
    xx = GX.astype(int) % T
    brick_x = (xx + course * 5) % 9
    tint = np.vectorize(lambda a, b: ihash(int(a), int(b), 5))(course, (xx + course * 5) // 9)
    sel = face & (cy < 3) & (brick_x != 0)
    _set(rgba, sel, "4a4656")
    _set(rgba, sel & (tint > 0.62), "4f5b70")
    _set(rgba, sel & (tint < 0.12), "2e2a3b")
    _set(rgba, sel & (cy == 2) & (brick_x >= 1) & (brick_x <= 5) & (tint >= 0.12), "6e6a78")
    _set(rgba, face & ((cy == 3) | (brick_x == 0)), "2e2a3b")
    _set(rgba, face & (fd == H), "6e6a78")                      # lit top course
    _set(rgba, face & (fd == 1), "1a1625")
    _set(rgba, face & (fd == 2) & (pat > 0.82), "2f5e33")       # moss at the foot
    _set(rgba, face & (E["w"] | E["e"]), "2e2a3b")
    # --- top: parapet (merlons + crenels) along every edge of the wall walk
    tdi = dist_in(top, 5)
    yyc = GY.astype(int) % T
    band = (tdi >= 1) & (tdi <= 4)
    horiz = np.zeros(m.shape, bool)
    for k in range(1, 5):
        horiz |= ~at(top, 0, -k) | ~at(top, 0, k)
    hb, vb = band & horiz, band & ~horiz
    cren = (hb & (xx % 10 < 4)) | (vb & (yyc % 10 < 4))
    merlon = band & ~cren
    _set(rgba, merlon, "a39fa6")
    _set(rgba, merlon & (tdi == 4), "6e6a78")
    _set(rgba, merlon & (tdi == 1) & (tE["n"] | tE["w"]), "e8e2d6")
    _set(rgba, merlon & (tdi == 1) & (tE["s"] | tE["e"]), "6e6a78")
    _set(rgba, merlon & at(cren, 1, 0) & (tdi > 1), "6e6a78")      # merlon side shade
    _set(rgba, cren, "4a4656")
    _set(rgba, cren & (at(merlon, -1, 0) | (tdi == 1)), "2e2a3b")
    _set(rgba, tdi == 5, "2e2a3b")                                 # merlons cast a line onto the walk
    # outline of the whole wall
    _set(rgba, (di == 1) & (E["n"] | E["w"] | E["e"]) & ~face, "1a1625")
    # rubble where lower layers reach past the masonry (keeps the layer nesting intact)
    _set(rgba, rubble, "4a4656")
    _set(rgba, rubble & (pat > 0.55), "6e6a78")
    _set(rgba, rubble & (pat > 0.85), "a39fa6")
    _set(rgba, rubble & (E["s"] | E["e"]), "2e2a3b")
    # cast shadow to the south-east (outside the mask, soft alpha)
    sh = np.zeros(m.shape, bool)
    for dy in range(0, 5):
        for dx in range(0, 4):
            if dx or dy:
                sh |= at(m, -dx, -dy)
    sh &= ~m
    core = ~m & (at(m, 0, -1) | at(m, -1, -1) | at(m, -1, 0))
    rgba[sh & ~core] = (*C("1a1625"), 70)
    rgba[core] = (*C("1a1625"), 120)


# ---------------------------------------------------------------------------------------------
# atlases
# ---------------------------------------------------------------------------------------------
def atlas(layer: str, frame: int = 0) -> Image.Image:
    img = np.zeros((4 * T, 4 * T, 4), np.uint8)
    for i in range(1, 16):
        x, y = (i % 4) * T, (i // 4) * T
        img[y:y + T, x:x + T] = paint_tile(layer, i, frame)
    return Image.fromarray(img, "RGBA")


def full_variants(layer: str) -> Image.Image:
    n = FULL_VARIANTS[layer]
    img = np.zeros((T, n * T, 4), np.uint8)
    for v in range(n):
        img[:, v * T:(v + 1) * T] = paint_tile(layer, 15, 0, v)
    return Image.fromarray(img, "RGBA")


# ---------------------------------------------------------------------------------------------
# decals (48x48 each, one row)
# ---------------------------------------------------------------------------------------------
def _cell():
    return np.zeros((T, T, 4), np.uint8)


def _flowers(colors, seed, n=8):
    """A patch of small 4-petal flowers with leaves; colors = (petal, centre, petal shade)."""
    img = _cell()
    r = rng(seed)
    pts = []
    tries = 0
    while len(pts) < n and tries < 500:
        tries += 1
        x, y = int(r.integers(12, 33)), int(r.integers(13, 32))
        if all(abs(x - a) + abs(y - b) > 5 for a, b in pts):
            pts.append((x, y))
    for x, y in pts:                                         # leaves first
        stamp(img, ["l..", ".ml", "m.."] if (x + y) % 2 else ["..l", "lm.", "..m"],
              {"l": "8bbb4a", "m": "2f5e33"}, x - 1, y + 1, wrap=False)
    for x, y in sorted(pts, key=lambda p: p[1]):
        stamp(img, [".p.", "pcq", ".qs"], {"p": colors[0], "c": colors[1], "q": colors[2], "s": "1f3a2c"},
              x, y, wrap=False)
    return img


def decals():
    out = []   # (name, allowed grounds, image)
    out.append(("flowers_yellow", ["grass"], _flowers(("f2d98c", "d0662f", "d1aa4f"), 11)))
    out.append(("flowers_white", ["grass", "plain"], _flowers(("e8e2d6", "d1aa4f", "a39fa6"), 12)))
    out.append(("flowers_violet", ["grass"], _flowers(("8e5bd9", "f5e08f", "5a3a8e"), 13)))
    G = {"h": "c9e07a", "l": "8bbb4a", "m": "4f8a3a", "d": "2f5e33", "x": "1f3a2c"}
    img = _cell()
    stamp(img, [
        "....h.....h....",
        "..h.l..h..l.h..",
        "..l.lh.l.hl.l..",
        ".hl.ml.lhml.lh.",
        ".lm.mlhmlmlhml.",
        ".lmhmmlmmmmlmm.",
        "lmmlmmmmdmmmmml",
        "mmdmmdmmdmdmmdm",
        "dmddmdddmdddmdd",
        ".xxxxxxxxxxxxx.",
    ], G, 16, 18, wrap=False)
    out.append(("tall_grass", ["grass", "plain"], img))
    img = _cell()
    for (x, y, big) in [(13, 15, True), (24, 19, True), (19, 27, True), (31, 14, False), (12, 29, False),
                        (30, 27, False), (26, 31, False), (35, 21, False)]:
        stamp(img, PEBBLE if big else PEBBLE_S, PEB_COL, x, y, wrap=False)
    out.append(("pebbles", ["plain", "road", "sand"], img))
    img = _cell()
    stamp(img, [
        "....abbbb.....",
        "...abbbbbcc...",
        "..abbbbbcccc..",
        ".abbbbbbccccc.",
        ".bbbbbbcccccd.",
        "abbbbbcccccdd.",
        "bbbbbccccccdd.",
        ".cccccccdddd..",
        "..eeeeeeeeee..",
    ], {"a": "d3dae4", "b": "8995a8", "c": "4f5b70", "d": "2b3242", "e": "4a4656"}, 17, 17, wrap=False)
    stamp(img, ["ab", "cd"], {"a": "8995a8", "b": "4f5b70", "c": "4f5b70", "d": "2b3242"}, 31, 24, wrap=False)
    out.append(("rock", ["plain", "grass", "sand"], img))
    img = _cell()
    for x, y, s in [(16, 17, 1), (26, 21, 1), (20, 27, 0), (30, 29, 0)]:
        if s:
            stamp(img, ["..rrr..", ".rwrrr.", "rrrrwrd", "rrrrrdd", ".bsssb.", "..sss..", "..ssd..", ".xxxx.."],
                  {"r": "c2451e", "w": "e8e2d6", "d": "6b1d1d", "b": "6b1d1d", "s": "f3cba6", "x": "2f5e33"},
                  x, y, wrap=False)
        else:
            stamp(img, [".rrr.", "rwrrd", ".sss.", "..sd.", ".xx.."],
                  {"r": "c2451e", "w": "e8e2d6", "d": "6b1d1d", "s": "f3cba6", "x": "2f5e33"}, x, y, wrap=False)
    out.append(("mushrooms", ["grass"], img))
    img = _cell()
    r = rng(41)

    def crack(x, y, n, dirx):
        for _ in range(n):
            if 0 <= x < T and 0 <= y < T - 1:
                img[y, x] = (*C("6a4130"), 255)
                if img[y + 1, x, 3] == 0:
                    img[y + 1, x] = (*C("c79a68"), 255)
            x += dirx
            y += int(r.choice([-1, 0, 0, 1]))
            if r.random() < 0.18 and n > 4:
                crack(x, y, n // 3, dirx if r.random() < 0.5 else -dirx)
    crack(13, 22, 22, 1)
    crack(24, 18, 9, 1)
    out.append(("cracks", ["plain", "road"], img))
    img = _cell()
    stamp(img, ["y...y..y..", ".y.yy.y..y", "oy.y.oy.yo", ".oyo.yo.o.", "o.o.oo.oo.", "dddddddddd"],
          {"y": "f5e08f", "o": "d1aa4f", "d": "8a6a2e"}, 18, 20, wrap=False)
    out.append(("dry_grass", ["plain", "sand"], img))
    img = _cell()
    stamp(img, [
        "....dddddd.......",
        "..ddbbbbbbddd....",
        ".dbwwbbbbbbbbdd..",
        "dbbbbbbbbbbbbbbd.",
        "dbbbbbbbbbwwbbbbd",
        ".dbbbbbbbbbbbbdd.",
        "..lddbbbbbddddl..",
        "....llddddll.....",
    ], {"d": "4f5b70", "b": "2f5f9e", "w": "a8e4f5", "l": "c79a68"}, 15, 19, wrap=False)
    out.append(("puddle", ["plain", "road"], img))
    img = _cell()
    for x, y, c in [(13, 16, "d0662f"), (27, 15, "d1aa4f"), (20, 24, "9a3a24"), (32, 26, "d0662f"),
                    (15, 30, "d1aa4f"), (25, 31, "9a3a24")]:
        stamp(img, ["..a", ".ab", "abs", "bs."], {"a": c, "b": "9a3a24" if c != "9a3a24" else "5a1f1c", "s": "5a1f1c"},
              x, y, wrap=False)
    out.append(("leaves", ["grass", "plain", "road"], img))
    img = _cell()
    for x, y in [(15, 17), (27, 24), (19, 29)]:
        stamp(img, ["..w..", ".wpw.", "wwpww", "wpwpw", ".ddd."], {"w": "e8e2d6", "p": "f59a8a", "d": "c79a68"},
              x, y, wrap=False)
    stamp(img, ["ab", "bc"], {"a": "a39fa6", "b": "6e6a78", "c": "c79a68"}, 30, 18, wrap=False)
    out.append(("shells", ["sand"], img))
    img = _cell()
    for x, y, hot in [(14, 16, True), (26, 15, False), (20, 24, True), (31, 26, True), (15, 30, False)]:
        stamp(img, [".kkk.", "kkkkk", "kkkkk", ".kkk."], {"k": "1a1625"}, x, y, wrap=False)
        stamp(img, [".a.", "a.."], {"a": "4a4656"}, x + 1, y, wrap=False)
        if hot:
            stamp(img, ["ro", "oY"], {"r": "c2451e", "o": "e8743b", "Y": "ffc06b"}, x + 2, y + 1, wrap=False)
    out.append(("cinders", ["ash"], img))
    img = _cell()
    for x, y in [(13, 16), (25, 22), (16, 28)]:
        stamp(img, ["..lll..", ".lhlll.", "lhllll.", "llll.ld", ".llldd.", "..ddd.."],
              {"l": "4f8a3a", "h": "8bbb4a", "d": "1f3a2c"}, x, y, wrap=False)
    stamp(img, [".w.", "wpw", ".w."], {"w": "e8e2d6", "p": "f59a8a"}, 15, 17, wrap=False)
    out.append(("lily_pads", ["shallows"], img))
    img = _cell()
    stamp(img, ["...b.....b...", "..bl...b.l..b", "..l.l..l.l.bl", ".bl.l.bl.l.l.", ".l..l.l..l.l.",
                ".l.ml.l.ml.l.", "ml.m.ml.m.ml.", "m.mm.m.mm.m.m", "ddddddddddddd"],
          {"b": "7a5236", "l": "8bbb4a", "m": "4f8a3a", "d": "1f3a2c"}, 17, 18, wrap=False)
    out.append(("reeds", ["shallows", "grass"], img))
    img = _cell()
    stamp(img, [".y..y.y..y.", "yoy.oyoy.oy", ".o.yo.o.yo.", ".s.o..s.o..", ".s.s.s..s.s", ".s.s.s.s..s",
                "ddddddddddd"],
          {"y": "f5e08f", "o": "d1aa4f", "s": "8a6a2e", "d": "4f8a3a"}, 18, 19, wrap=False)
    out.append(("wheat", ["grass", "plain"], img))
    return out


# ---------------------------------------------------------------------------------------------
# objects (48x48 cells)
# ---------------------------------------------------------------------------------------------
class Spr:
    def __init__(self):
        self.im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def rect(self, x0, y0, x1, y1, col, a=255):
        self.d.rectangle([x0, y0, x1, y1], fill=CA(col, a))

    def px(self, x, y, col, a=255):
        if 0 <= x < T and 0 <= y < T:
            self.im.putpixel((x, y), CA(col, a))

    def line(self, pts, col, w=1):
        self.d.line(pts, fill=CA(col), width=w)

    def poly(self, pts, col):
        self.d.polygon(pts, fill=CA(col))

    def ellipse(self, box, col, a=255):
        self.d.ellipse(box, fill=CA(col, a))

    def arr(self):
        return np.array(self.im)


def outline(a: np.ndarray, col: str, sides=(1, 1, 1, 1)) -> np.ndarray:
    """Coloured 1px outline around opaque pixels (only on transparent pixels)."""
    op = a[..., 3] == 255
    o = np.zeros_like(op)
    if sides[0]:
        o |= np.roll(op, 1, 0)
    if sides[1]:
        o |= np.roll(op, -1, 0)
    if sides[2]:
        o |= np.roll(op, 1, 1)
    if sides[3]:
        o |= np.roll(op, -1, 1)
    o &= a[..., 3] < 255
    a = a.copy()
    a[o] = (*C(col), 255)
    return a


def drop_shadow(a: np.ndarray, dx=2, dy=2, alpha=90) -> np.ndarray:
    op = a[..., 3] == 255
    sh = np.zeros_like(op)
    for k in range(1, max(dx, dy) + 1):
        sh |= np.roll(np.roll(op, min(k, dy), 0), min(k, dx), 1)
    sh &= a[..., 3] == 0
    a = a.copy()
    a[sh] = (*C("1a1625"), alpha)
    return a


def obj_bridge_h() -> np.ndarray:
    s = Spr()
    s.rect(0, 38, 47, 41, "1d2a5a", 120)                     # shadow on the water
    s.rect(0, 8, 47, 37, "4f3426")                           # gaps between planks
    for i, x in enumerate(range(0, 48, 6)):
        col = "9a6a45" if (i % 3) else "7a5236"
        s.rect(x, 10, x + 4, 35, col)
        s.rect(x, 10, x, 35, "c79a68" if col == "9a6a45" else "9a6a45")
        s.rect(x + 4, 10, x + 4, 35, "7a5236" if col == "9a6a45" else "4f3426")
        s.px(x + 2, 12, "2d1e1a")
        s.px(x + 2, 33, "2d1e1a")
        if ihash(i, 1) < 0.5:
            s.px(x + 2, 20 + int(ihash(i) * 8), "7a5236")
    for y0 in (6, 34):                                       # side beams
        s.rect(0, y0, 47, y0 + 3, "7a5236")
        s.rect(0, y0, 47, y0, "c79a68")
        s.rect(0, y0 + 3, 47, y0 + 3, "4f3426")
    s.rect(0, 38, 47, 39, "2d1e1a")                          # front of the south beam
    for x in (4, 28):                                        # posts
        for y0 in (4, 32):
            s.rect(x, y0, x + 4, y0 + 6, "4f3426")
            s.rect(x, y0, x + 4, y0 + 1, "9a6a45")
            s.px(x, y0, "c79a68")
            s.rect(x + 4, y0 + 2, x + 4, y0 + 6, "2d1e1a")
    return s.arr()


def obj_bridge_v() -> np.ndarray:
    s = Spr()
    s.rect(40, 0, 43, 47, "1d2a5a", 120)
    s.rect(8, 0, 39, 47, "4f3426")
    for i, y in enumerate(range(0, 48, 6)):
        col = "9a6a45" if (i % 3) else "7a5236"
        s.rect(10, y, 37, y + 4, col)
        s.rect(10, y, 37, y, "c79a68" if col == "9a6a45" else "9a6a45")
        s.rect(10, y + 4, 37, y + 4, "7a5236" if col == "9a6a45" else "4f3426")
        s.px(12, y + 2, "2d1e1a")
        s.px(35, y + 2, "2d1e1a")
    for x0 in (6, 36):
        s.rect(x0, 0, x0 + 3, 47, "7a5236")
        s.rect(x0, 0, x0, 47, "c79a68")
        s.rect(x0 + 3, 0, x0 + 3, 47, "4f3426")
    for y in (4, 28):
        for x0 in (4, 34):
            s.rect(x0, y, x0 + 6, y + 5, "4f3426")
            s.rect(x0, y, x0 + 6, y + 1, "9a6a45")
            s.px(x0, y, "c79a68")
            s.rect(x0, y + 5, x0 + 6, y + 6, "2d1e1a")
    return s.arr()


def obj_bridge_stone_h() -> np.ndarray:
    s = Spr()
    s.rect(0, 38, 47, 47, "4f5b70")                          # south face
    s.ellipse((6, 41, 41, 62), "1d2a5a")                    # arch opening (water below)
    s.ellipse((8, 43, 39, 62), "16285a")
    s.rect(0, 46, 5, 47, "2b3242")
    s.rect(42, 46, 47, 47, "2b3242")
    for x in range(0, 48, 8):                                # voussoir lines on the face
        s.rect(x, 38, x, 41, "2b3242")
    s.rect(0, 10, 47, 37, "8995a8")                          # deck flagstones
    for y in range(10, 38, 7):
        s.rect(0, y, 47, y, "4f5b70")
        off = 0 if (y // 7) % 2 else 6
        for x in range(off, 48, 12):
            s.rect(x, y, x, y + 6, "4f5b70")
            s.rect(x + 1, y + 1, x + 4, y + 1, "d3dae4")
    for y0 in (5, 33):                                       # parapets
        s.rect(0, y0, 47, y0 + 4, "d3dae4" if y0 == 5 else "8995a8")
        s.rect(0, y0 + 4, 47, y0 + 4, "4f5b70")
        s.rect(0, y0, 47, y0, "e8e2d6" if y0 == 5 else "d3dae4")
        for x in range(0, 48, 12):
            s.rect(x, y0, x, y0 + 4, "4f5b70")
    s.rect(0, 38, 47, 38, "2b3242")
    return s.arr()


def obj_fort_base() -> np.ndarray:
    s = Spr()
    pts = [(6, 4), (41, 4), (45, 8), (45, 39), (41, 43), (6, 43), (2, 39), (2, 8)]
    s.poly([(x + 1, y + 2) for x, y in pts], "1a1625")
    s.poly(pts, "4a4656")
    inner = [(8, 6), (39, 6), (43, 10), (43, 35), (39, 39), (8, 39), (4, 35), (4, 10)]
    s.poly(inner, "8995a8")
    for y in range(8, 39, 6):
        s.line([(5, y), (42, y)], "4f5b70")
        off = 0 if (y // 6) % 2 else 5
        for x in range(4 + off, 44, 10):
            s.line([(x, y), (x, y + 5)], "4f5b70")
            s.line([(x + 1, y + 1), (x + 4, y + 1)], "d3dae4")
    s.rect(4, 40, 43, 43, "4a4656")                          # front face
    s.rect(4, 40, 43, 40, "6e6a78")
    s.rect(18, 39, 29, 45, "6e6a78")                         # steps
    s.rect(18, 42, 29, 42, "4a4656")
    s.rect(18, 39, 29, 39, "a39fa6")
    s.rect(18, 45, 29, 45, "2e2a3b")
    for x, y in [(4, 6), (39, 6), (4, 33), (39, 33)]:        # corner stones
        s.rect(x, y, x + 4, y + 4, "a39fa6")
        s.rect(x, y, x + 4, y, "e8e2d6")
        s.rect(x + 4, y + 1, x + 4, y + 4, "4a4656")
    a = outline(s.arr(), "2e2a3b")
    return a


def obj_throne() -> np.ndarray:
    s = Spr()
    s.rect(4, 22, 43, 45, "2e2a3b")                          # dais
    s.rect(5, 22, 42, 40, "6e6a78")
    s.rect(5, 22, 42, 22, "a39fa6")
    s.rect(7, 26, 40, 37, "a39fa6")
    s.rect(7, 26, 40, 26, "e8e2d6")
    s.rect(5, 40, 42, 44, "4a4656")                          # step face
    s.rect(5, 41, 42, 41, "6e6a78")
    s.rect(17, 30, 30, 47, "a3172e")                         # carpet
    s.rect(17, 30, 17, 47, "e0455a")
    s.rect(30, 30, 30, 47, "4a1028")
    s.rect(16, 30, 16, 47, "c9a24a")
    s.rect(31, 30, 31, 47, "7a5a1a")
    s.rect(14, 3, 33, 29, "4a1028")                          # throne back
    s.rect(15, 4, 32, 28, "a3172e")
    s.rect(15, 4, 15, 28, "e0455a")
    s.rect(18, 9, 29, 24, "4a1028")
    s.rect(19, 10, 28, 23, "a3172e")
    for x0, x1, ys in [(14, 14, 3), (33, 33, 3)]:
        s.rect(x0, 3, x1, 29, "c9a24a")
    s.rect(14, 3, 33, 3, "f2d98c")
    # hollow crown crest: ring with spikes
    for i, x in enumerate((16, 20, 24, 28, 31)):
        s.rect(x, 0, x, 2, "c9a24a")
        s.px(x, 0, "f2d98c")
    s.rect(15, 2, 32, 3, "c9a24a")
    s.rect(15, 2, 32, 2, "f2d98c")
    s.rect(11, 22, 36, 30, "7a5a1a")                         # seat + armrests
    s.rect(12, 22, 35, 29, "c9a24a")
    s.rect(12, 22, 35, 22, "f2d98c")
    s.rect(16, 23, 31, 29, "a3172e")
    s.rect(16, 23, 31, 23, "e0455a")
    s.rect(10, 18, 14, 31, "7a5a1a")
    s.rect(10, 18, 13, 30, "c9a24a")
    s.rect(10, 18, 13, 18, "f2d98c")
    s.rect(33, 18, 37, 31, "7a5a1a")
    s.rect(34, 18, 37, 30, "c9a24a")
    s.rect(34, 18, 37, 18, "f2d98c")
    s.px(23, 15, "f2d98c")
    s.px(24, 15, "f2d98c")
    s.rect(22, 14, 25, 14, "c9a24a")
    a = outline(s.arr(), "1a1625", sides=(1, 0, 1, 1))
    return drop_shadow(a, 2, 2)


def _wall_segment(s: Spr, face_top: int):
    """Wall piece matching wall.png: dark wall walk, merlons/crenels, brick face below face_top."""
    s.rect(0, 0, 47, face_top - 1, "4a4656")                 # wall walk flagstones
    for y in range(-6, face_top, 12):
        s.rect(0, max(y, 0), 47, max(y, 0), "2e2a3b")
        s.rect(0, y + 1, 47, y + 1, "6e6a78")
        off = 8 if (y // 12) % 2 else 0
        for x in range(off, 48, 16):
            s.rect(x, max(y, 0), x, y + 11, "2e2a3b")
    for y0, outer in ((0, "e8e2d6"), (face_top - 5, "6e6a78")):   # north + south parapet
        s.rect(0, y0, 47, y0 + 3, "a39fa6")
        s.rect(0, y0 if y0 == 0 else y0 + 3, 47, y0 if y0 == 0 else y0 + 3, outer)
        for x in range(0, 48, 10):
            s.rect(x, y0, x + 3, y0 + 3, "4a4656")
            s.rect(x, y0 + (3 if y0 == 0 else 0), x + 3, y0 + (3 if y0 == 0 else 0), "2e2a3b")
            s.rect(x + 4, y0, x + 4, y0 + 3, "6e6a78")
        s.rect(0, y0 + 4 if y0 == 0 else y0 - 1, 47, y0 + 4 if y0 == 0 else y0 - 1, "2e2a3b")
    s.rect(0, face_top, 47, 47, "4a4656")                    # brick face
    for c, y in enumerate(range(face_top + 1, 48, 4)):
        s.rect(0, y + 3, 47, y + 3, "2e2a3b")
        for x in range((c * 5) % 9, 48, 9):
            s.rect(x, y, x, y + 3, "2e2a3b")
            s.rect(x + 1, y, x + 5, y, "6e6a78")
            if ihash(c, x) > 0.7:
                s.rect(x + 1, y + 1, x + 8, y + 2, "4f5b70")
    s.rect(0, face_top, 47, face_top, "6e6a78")


def _gate(open_: bool) -> np.ndarray:
    s = Spr()
    _wall_segment(s, 16)
    # arch frame
    s.ellipse((7, 14, 40, 40), "a39fa6")
    s.rect(7, 27, 40, 47, "a39fa6")
    s.ellipse((10, 17, 37, 40), "2e2a3b")
    s.rect(10, 28, 37, 47, "2e2a3b")
    for x in (7, 8, 39, 40):
        s.rect(x, 27, x, 47, "6e6a78" if x in (8, 40) else "e8e2d6")
    if not open_:
        s.ellipse((11, 18, 36, 40), "7a5236")
        s.rect(11, 28, 36, 47, "7a5236")
        for x in range(11, 37, 5):
            s.rect(x, 18, x, 47, "4f3426")
            s.rect(x + 1, 20, x + 1, 47, "9a6a45")
        s.rect(23, 18, 24, 47, "2d1e1a")
        for y in (25, 38):
            s.rect(11, y, 36, y + 1, "2e2a3b")
            s.rect(11, y, 36, y, "6e6a78")
            for x in (14, 19, 28, 33):
                s.px(x, y, "c9a24a")
        s.rect(20, 31, 21, 33, "c9a24a")
        s.rect(26, 31, 27, 33, "c9a24a")
    else:
        # passage: dark under the arch, floor visible below
        s.ellipse((10, 17, 37, 40), "1a1625")
        s.rect(10, 28, 37, 35, "1a1625")
        s.rect(10, 36, 37, 47, "2e2a3b", 160)
        s.rect(10, 41, 37, 47, "2e2a3b", 90)
        s.d.rectangle([12, 36, 35, 47], fill=(0, 0, 0, 0))
        s.rect(12, 36, 35, 39, "1a1625", 110)
        s.rect(12, 40, 35, 42, "1a1625", 60)
        for x0 in (10, 33):                                  # door leaves folded to the sides
            s.rect(x0, 22, x0 + 4, 47, "7a5236")
            s.rect(x0, 22, x0, 47, "9a6a45")
            s.rect(x0 + 4, 22, x0 + 4, 47, "4f3426")
            s.rect(x0, 26, x0 + 4, 26, "2e2a3b")
            s.rect(x0, 39, x0 + 4, 39, "2e2a3b")
        s.rect(11, 17, 36, 18, "4a4656")                     # raised portcullis teeth
        for x in range(12, 36, 3):
            s.rect(x, 19, x, 21, "4a4656")
    return s.arr()


def _door(open_: bool) -> np.ndarray:
    s = Spr()
    _wall_segment(s, 19)
    s.rect(15, 20, 32, 47, "a39fa6")                         # stone frame
    s.rect(15, 20, 32, 20, "e8e2d6")
    s.rect(17, 23, 30, 47, "2e2a3b")
    if not open_:
        s.rect(18, 24, 29, 47, "9a6a45")
        for x in (20, 23, 26):
            s.rect(x, 24, x, 47, "7a5236")
        s.rect(18, 24, 18, 47, "c79a68")
        s.rect(18, 30, 29, 30, "4f3426")
        s.rect(18, 41, 29, 41, "4f3426")
        s.rect(27, 35, 28, 36, "c9a24a")
    else:
        s.rect(18, 24, 29, 38, "1a1625")
        s.d.rectangle([18, 39, 29, 47], fill=(0, 0, 0, 0))
        s.rect(18, 39, 29, 42, "1a1625", 120)
        s.rect(18, 43, 29, 45, "1a1625", 60)
        s.rect(18, 24, 20, 47, "7a5236")
        s.rect(18, 24, 18, 47, "c79a68")
        s.rect(20, 24, 20, 47, "4f3426")
    return s.arr()


def obj_rockwall() -> np.ndarray:
    """Earth-magic rock spikes breaking out of the ground."""
    s = Spr()
    s.ellipse((3, 36, 46, 47), "1a1625", 80)                # ground shadow
    s.ellipse((6, 38, 42, 46), "3b2420")                    # torn-up soil
    s.ellipse((8, 39, 40, 45), "6a4130")
    spikes = [(10, 42, 7, 24), (37, 42, 6, 26), (19, 44, 9, 40), (29, 44, 8, 33), (24, 46, 6, 18)]
    for bx, by, hw, h in spikes:
        tip = (bx + 1, by - h)
        s.poly([(bx - hw, by), tip, (bx + hw, by)], "3b2420")
        s.poly([(bx - hw + 1, by - 1), tip, (bx + hw - 1, by - 1)], "6a4130")
        s.poly([(bx - hw + 1, by - 1), tip, (bx + 1, by - 1)], "9a6a45")
        s.poly([(bx - hw + 2, by - 2), (tip[0], tip[1] + 3), (bx - hw // 3, by - 2)], "c79a68")
        s.line([tip, (tip[0], tip[1] + 2)], "f2d98c")
        # strata lines
        for k in (0.35, 0.65):
            y = int(by - h * k)
            half = int(hw * (1 - k))
            s.line([(bx - half + 1, y + 1), (bx + half - 1, y)], "6a4130")
    a = outline(s.arr(), "2d1e1a")
    for x, y in [(3, 42), (13, 45), (33, 46), (43, 41), (6, 46), (40, 46)]:   # rubble
        for dx, dy, col in [(0, 0, "c79a68"), (1, 0, "9a6a45"), (0, 1, "9a6a45"), (1, 1, "3b2420")]:
            if 0 <= x + dx < T and 0 <= y + dy < T:
                a[y + dy, x + dx] = (*C(col), 255)
    return a


def obj_cliff() -> np.ndarray:
    """Mountain ground tile: a faceted crag, lit from the top left, grass on the ledges."""
    s = Spr()
    s.ellipse((2, 34, 47, 47), "1a1625", 80)
    mass = [(3, 42), (5, 30), (10, 20), (16, 10), (22, 5), (28, 6), (34, 13), (40, 22), (44, 32), (45, 42),
            (38, 45), (10, 45)]
    s.poly(mass, "4f5b70")
    s.poly([(5, 30), (10, 20), (16, 10), (22, 5), (21, 15), (15, 25), (9, 32)], "d3dae4")       # lit NW face
    s.poly([(22, 5), (28, 6), (34, 13), (29, 21), (21, 15)], "8995a8")                       # top face
    s.poly([(9, 32), (15, 25), (21, 15), (29, 21), (27, 31), (17, 36), (8, 38)], "8995a8")    # front-left
    s.poly([(29, 21), (34, 13), (40, 22), (44, 32), (36, 34), (27, 31)], "4f5b70")            # shaded E face
    s.poly([(3, 42), (8, 38), (17, 36), (27, 31), (36, 34), (44, 32), (45, 42), (38, 45), (10, 45)], "4f5b70")
    s.poly([(27, 31), (36, 34), (44, 32), (45, 42), (38, 45), (30, 44)], "2b3242")            # deep shadow
    for a_, b_ in [((21, 15), (29, 21)), ((29, 21), (27, 31)), ((15, 25), (9, 32)), ((17, 36), (27, 31)),
                   ((21, 15), (22, 5))]:
        s.line([a_, b_], "2b3242")
    s.line([(12, 22), (16, 17)], "e8e2d6")
    s.line([(18, 12), (21, 8)], "e8e2d6")
    for x0, y0, x1, y1 in [(13, 39, 14, 43), (22, 37, 21, 42), (33, 36, 34, 41), (39, 37, 40, 42)]:
        s.line([(x0, y0), (x1, y1)], "2b3242")
    s.line([(12, 29), (16, 31)], "4f5b70")
    s.line([(19, 22), (24, 25)], "4f5b70")
    a = outline(s.arr(), "2b3242")
    G = {"h": "c9e07a", "l": "8bbb4a", "m": "4f8a3a", "d": "2f5e33"}
    for x, y, t in [(23, 13, 0), (14, 30, 1), (30, 25, 0), (5, 40, 1), (40, 41, 0), (24, 39, 1)]:
        stamp(a, [".h.h.", "lmlml", ".ddd."] if t else ["h.h", "mlm", "ddd"], G, x, y, wrap=False)
    return a


OBJECTS = [
    ("bridge_h", obj_bridge_h), ("bridge_v", obj_bridge_v), ("bridge_stone_h", obj_bridge_stone_h),
    ("fort_base", obj_fort_base), ("throne", obj_throne), ("gate_closed", lambda: _gate(False)),
    ("gate_open", lambda: _gate(True)), ("rockwall", obj_rockwall), ("cliff", obj_cliff),
    ("door_closed", lambda: _door(False)), ("door_open", lambda: _door(True)),
]
OBJ_COLS = 6


# ---------------------------------------------------------------------------------------------
# composition (reference implementation for the renderer)
# ---------------------------------------------------------------------------------------------
class Tileset:
    """Loads the generated files from art/tiles (so the preview uses exactly the shipped assets)."""

    def __init__(self, root: Path = OUT):
        self.root = root
        self.atlas = {}
        for g in GROUNDS:
            n = FRAMES.get(g, 1)
            self.atlas[g] = [Image.open(root / (f"{g}_{f}.png" if n > 1 else f"{g}.png")).convert("RGBA")
                             for f in range(n)]
        self.full = {g: Image.open(root / f"{g}_full.png").convert("RGBA")
                     for g in FULL_VARIANTS if (root / f"{g}_full.png").exists()}
        self.decal_img = Image.open(root / "decals.png").convert("RGBA")
        self.decal_meta = json.loads((root / "decals.json").read_text(encoding="utf-8"))
        self.obj_img = Image.open(root / "objects.png").convert("RGBA")
        self.obj_meta = json.loads((root / "objects.json").read_text(encoding="utf-8"))

    def tile(self, ground: str, idx: int, frame: int = 0, variant: int = 0) -> Image.Image:
        if idx == 15 and ground in self.full and variant:
            n = self.full[ground].width // T
            v = variant % n
            return self.full[ground].crop((v * T, 0, v * T + T, T))
        a = self.atlas[ground][frame % len(self.atlas[ground])]
        return a.crop(((idx % 4) * T, (idx // 4) * T, (idx % 4) * T + T, (idx // 4) * T + T))

    def decal(self, name: str) -> Image.Image:
        i = self.decal_meta["names"].index(name)
        return self.decal_img.crop((i * T, 0, i * T + T, T))

    def obj(self, name: str) -> Image.Image:
        c, r = self.obj_meta["items"][name]
        return self.obj_img.crop((c * T, r * T, c * T + T, r * T + T))


def compose(ts: Tileset, grid, frame: int = 0, decal_at=None, objects=None, fx=None) -> Image.Image:
    """Compose a map exactly per the dual-grid rules of art/README.md.

    grid: list of rows of ground ids. Cells outside the map repeat the nearest edge cell.
    For every layer from the lowest present ground upwards, dual tile (dx, dy) for dx in 0..W, dy in 0..H
    covers the corners of cells (dx-1,dy-1)=TL, (dx,dy-1)=TR, (dx-1,dy)=BL, (dx,dy)=BR and is drawn at
    pixel ((dx - 0.5) * 48, (dy - 0.5) * 48). A corner counts as covered if PRIO[cell] >= PRIO[layer].
    The lowest present layer is drawn with index 15 everywhere. Index 15 tiles may use a variant from
    <ground>_full.png chosen by a stable hash of (dx, dy).
    """
    H, W = len(grid), len(grid[0])

    def cell(x, y):
        return grid[min(max(y, 0), H - 1)][min(max(x, 0), W - 1)]

    present = {g for row in grid for g in row}
    lo = min(PRIO[g] for g in present)
    hi = max(PRIO[g] for g in present)
    canvas = Image.new("RGBA", (W * T + T, H * T + T), CA("1a1625"))
    for layer in GROUNDS[lo:hi + 1]:
        p = PRIO[layer]
        for dy in range(H + 1):
            for dx in range(W + 1):
                corners = [cell(dx - 1, dy - 1), cell(dx, dy - 1), cell(dx - 1, dy), cell(dx, dy)]
                idx = 15 if p == lo else sum(1 << k for k, g in enumerate(corners) if PRIO[g] >= p)
                if idx == 0:
                    continue
                variant = int(ihash(dx, dy, p) * 97) if idx == 15 else 0
                canvas.alpha_composite(ts.tile(layer, idx, frame, variant), (dx * T, dy * T))
    canvas = canvas.crop((HALF, HALF, HALF + W * T, HALF + H * T))
    for (x, y), name in (decal_at or {}).items():
        canvas.alpha_composite(ts.decal(name), (x * T, y * T))
    for (x, y), name in sorted((objects or {}).items(), key=lambda kv: kv[0][1]):
        canvas.alpha_composite(ts.obj(name), (x * T, y * T))
    for (x, y), im in (fx or {}).items():
        canvas.alpha_composite(im, (x * T, y * T))
    return canvas


LEGEND = {"~": "river", "s": "shallows", ".": "plain", ":": "sand", "=": "road", ",": "grass", "a": "ash", "#": "wall"}
PREVIEW = [
    ",,,,,##+###,",
    ",,,,.,.=.,#,",
    ",C,,aa.=.,,,",
    ",,aaaa,=..,:",
    "..,,a,,=..::",
    "ss..,..=.:ss",
    "~~sss~~|~sss",
    "~~~~~~~|~~~~",
    "::ss..,=.,K,",
    ":::..F.=,,,,",
]
PREVIEW_OBJ = {"+": ("road", "gate_open"), "|": ("river", "bridge_v"), "C": ("grass", "cliff"),
               "K": ("plain", "rockwall"), "F": ("plain", "fort_base")}


def preview(ts: Tileset, frame: int = 0) -> Image.Image:
    grid, objs = [], {}
    for y, row in enumerate(PREVIEW):
        assert len(row) == 12, row
        out = []
        for x, ch in enumerate(row):
            if ch in PREVIEW_OBJ:
                g, o = PREVIEW_OBJ[ch]
                objs[(x, y)] = o
                out.append(g)
            else:
                out.append(LEGEND[ch])
        grid.append(out)
    meta = ts.decal_meta
    decal_at = {}
    for y in range(len(grid)):
        for x in range(12):
            if (x, y) in objs or ihash(x, y, 42) > 0.38:
                continue
            g = grid[y][x]
            opts = [n for n, allowed in zip(meta["names"], meta["allowed"]) if g in allowed]
            if opts:
                decal_at[(x, y)] = opts[int(ihash(x, y, 43) * len(opts))]
    fx = {}
    fx_png = ROOT / "art" / "fx" / "fx.png"
    if fx_png.exists():
        fxi = Image.open(fx_png).convert("RGBA")
        fxm = json.loads((ROOT / "art" / "fx" / "fx.json").read_text(encoding="utf-8"))
        fr = fxm["anims"]["flame"]
        for k, (x, y) in enumerate([(6, 2), (6, 3), (1, 3)]):
            f = (frame + 2 * k) % fr["frames"]
            fx[(x, y)] = fxi.crop((f * T, fr["row"] * T, f * T + T, fr["row"] * T + T))
        em = fxm["anims"]["embers"]
        for k, (x, y) in enumerate([(3, 3), (5, 2)]):
            f = (frame + k) % em["frames"]
            fx[(x, y)] = fxi.crop((f * T, em["row"] * T, f * T + T, em["row"] * T + T))
    return compose(ts, grid, frame, decal_at, objs, fx)


# ---------------------------------------------------------------------------------------------
# self test: neighbouring dual tiles must agree at their seams
# ---------------------------------------------------------------------------------------------
def seam_check(layers=GROUNDS, band: int = 2) -> int:
    """Each tile is painted on a 96x96 canvas that already contains its neighbours' first pixels.
    For every compatible neighbour pair, each tile's canvas overlap must equal the neighbour's own
    pixels (both directions) - i.e. both tiles agree on the world at their common seam."""
    bad = 0
    for layer in layers:
        cv = {i: paint_tile(layer, i, 0, 0, canvas=True) for i in range(16)}
        own = {i: c[M:M + T, M:M + T].astype(int) for i, c in cv.items()}
        cv = {i: c.astype(int) for i, c in cv.items()}
        for a in range(16):
            for b in range(16):
                if ((a >> 1) & 1) == (b & 1) and ((a >> 3) & 1) == ((b >> 2) & 1):          # a | b
                    d = np.abs(cv[a][M:M + T, M + T:M + T + band] - own[b][:, :band]).sum()
                    d += np.abs(cv[b][M:M + T, M - band:M] - own[a][:, T - band:]).sum()
                    if d:
                        bad += 1
                        print(f"  seam {layer}: {a} | {b}  diff={d}")
                if ((a >> 2) & 1) == (b & 1) and ((a >> 3) & 1) == ((b >> 1) & 1):          # a over b
                    d = np.abs(cv[a][M + T:M + T + band, M:M + T] - own[b][:band]).sum()
                    d += np.abs(cv[b][M - band:M, M:M + T] - own[a][T - band:]).sum()
                    if d:
                        bad += 1
                        print(f"  seam {layer}: {a} / {b}  diff={d}")
    return bad


# ---------------------------------------------------------------------------------------------
def main(argv) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for g in GROUNDS:
        n = FRAMES.get(g, 1)
        for f in range(n):
            im = atlas(g, f)
            im.save(OUT / (f"{g}_{f}.png" if n > 1 else f"{g}.png"))
            if n > 1 and f == 0:
                im.save(OUT / f"{g}.png")
        if g in FULL_VARIANTS:
            full_variants(g).save(OUT / f"{g}_full.png")
    ds = decals()
    sheet = np.zeros((T, T * len(ds), 4), np.uint8)
    for i, (_, _, im) in enumerate(ds):
        sheet[:, i * T:(i + 1) * T] = im
    Image.fromarray(sheet, "RGBA").save(OUT / "decals.png")
    (OUT / "decals.json").write_text(json.dumps({
        "cell": [T, T], "count": len(ds),
        "ground": [d[1][0] for d in ds],
        "allowed": [d[1] for d in ds],
        "names": [d[0] for d in ds],
    }, indent=2) + "\n", encoding="utf-8")
    rows = (len(OBJECTS) + OBJ_COLS - 1) // OBJ_COLS
    osheet = np.zeros((rows * T, OBJ_COLS * T, 4), np.uint8)
    items = {}
    for i, (name, fn) in enumerate(OBJECTS):
        c, r = i % OBJ_COLS, i // OBJ_COLS
        osheet[r * T:(r + 1) * T, c * T:(c + 1) * T] = fn()
        items[name] = [c, r]
    Image.fromarray(osheet, "RGBA").save(OUT / "objects.png")
    (OUT / "objects.json").write_text(json.dumps({"cell": [T, T], "items": items}, indent=2) + "\n",
                                      encoding="utf-8")
    ts = Tileset(OUT)
    pv = preview(ts, 0)
    pv.resize((pv.width * 2, pv.height * 2), Image.NEAREST).save(OUT / "preview_map.png")
    print("tiles written to", OUT)
    if "--check" in argv:
        bad = seam_check()
        for g, n in FULL_VARIANTS.items():                   # variants must share a 3 px border with index 15
            v = np.array(Image.open(OUT / f"{g}_full.png"))
            band = np.ones((T, T), bool)
            band[3:-3, 3:-3] = False
            for k in range(1, n):
                if (v[:, k * T:(k + 1) * T][band] != v[:, :T][band]).any():
                    bad += 1
                    print(f"  variant {g}/{k}: border differs from variant 0")
        print("seam check:", "OK" if not bad else f"{bad} mismatching pairs")
        if bad:
            sys.exit(1)


if __name__ == "__main__":
    main(sys.argv[1:])
