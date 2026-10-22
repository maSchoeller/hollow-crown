"""Hollow Crown – painted ground textures for the 3D board (concept/01-decisions.md D6).

python tools/art/ground.py <out_dir>      (also called by build.py)

Every texture is 256 × 256, tiles seamlessly and is generated deterministically from hash noise:
a height field gets coloured, then lit from the north-west (soft baked relief). Ground textures span
2 × 2 board tiles, side textures 1 × 1. Requires NumPy and Pillow.
"""
import os
import sys

import numpy as np
from PIL import Image

S = 256
U32 = np.uint32


def hsh(x, y, z):
    x = np.asarray(x).astype(np.int64) & 0xFFFFFFFF
    y = np.asarray(y).astype(np.int64) & 0xFFFFFFFF
    h = (x * 374761393 + y * 668265263 + int(z) * 2147483647) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    return (h ^ (h >> 16)).astype(np.uint32)


GRID_V, GRID_U = np.mgrid[0:S, 0:S].astype(np.float64) / S


def vnoise(u, v, period, seed):
    x, y = u * period, v * period
    xi, yi = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64)
    xf, yf = x - xi, y - yi

    def h(i, j):
        return (hsh(np.mod(i, period), np.mod(j, period), seed) & 0xFFFF) / 65535.0

    s = lambda t: t * t * (3 - 2 * t)
    a, b, c, d = h(xi, yi), h(xi + 1, yi), h(xi, yi + 1), h(xi + 1, yi + 1)
    uu, vv = s(xf), s(yf)
    return a + (b - a) * uu + (c - a) * vv + (a - b - c + d) * uu * vv


def fbm(u, v, base, octaves, seed):
    total, amp, norm = 0.0, 0.5, 0.0
    for o in range(octaves):
        total = total + amp * vnoise(u, v, base << o, seed + o * 31)
        norm += amp
        amp *= 0.5
    return total / norm


def voronoi(u, v, cells, seed):
    """Periodic Voronoi: F1, F2 (cell units) and the hash of the nearest cell."""
    x, y = u * cells, v * cells
    xi, yi = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64)
    f1 = np.full(x.shape, 9.0)
    f2 = np.full(x.shape, 9.0)
    ident = np.zeros(x.shape, dtype=np.uint32)
    for j in (-1, 0, 1):
        for i in (-1, 0, 1):
            cx, cy = xi + i, yi + j
            hh = hsh(np.mod(cx, cells), np.mod(cy, cells), seed)
            px = cx + 0.15 + ((hh & 255) / 255.0) * 0.7
            py = cy + 0.15 + (((hh >> 8) & 255) / 255.0) * 0.7
            d = np.hypot(px - x, py - y)
            closer = d < f1
            f2 = np.where(closer, f1, np.minimum(f2, d))
            ident = np.where(closer, hh, ident)
            f1 = np.where(closer, d, f1)
    return f1, f2, ident


def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float64)


def mix(a, b, t):
    t = np.asarray(t)[..., None] if np.ndim(t) else t
    return a + (b - a) * t


def paint(height, colour, relief=6.0, ambient=0.62):
    """Bakes north-west light into the colour from the height field's normals."""
    nx = (np.roll(height, 1, axis=1) - np.roll(height, -1, axis=1)) * relief
    ny = (np.roll(height, 1, axis=0) - np.roll(height, -1, axis=0)) * relief
    light = np.array([-0.45, -0.55, 0.7])
    light /= np.linalg.norm(light)
    nl = np.sqrt(nx * nx + ny * ny + 1)
    lit = np.maximum(0, (nx * light[0] + ny * light[1] + light[2]) / nl)
    ao = 0.82 + 0.18 * np.clip(height * 1.4, 0, 1)
    shade = (ambient + (1 - ambient) * 1.25 * lit) * ao
    out = np.clip(colour * shade[..., None], 0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGB")


def strokes(height, colour, count, seed, make):
    """Short strokes into the fields (grass blades)."""
    rng = np.random.default_rng(seed)
    for _ in range(count):
        st = make(rng)
        for t in range(st["len"] + 1):
            x = int(round(st["x"] + np.sin(st["a"]) * t)) % S
            y = int(round(st["y"] - np.cos(st["a"]) * t)) % S
            f = t / st["len"]
            height[y, x] = max(height[y, x], st["h0"] + f * st["h"])
            colour[y, x] = st["c0"] + (st["c1"] - st["c0"]) * f


PAL = {
    "grass": [rgb(h) for h in ("#24452a", "#35652f", "#4f8a3a", "#79ad48", "#a9cf6a")],
    "dirt": [rgb(h) for h in ("#4a382b", "#68513f", "#85694f", "#a2856a", "#bba184")],
    "stone": [rgb(h) for h in ("#5d5966", "#77727e", "#8f8a93", "#a7a2a7", "#857a6e", "#6f6a5f")],
    "sand": [rgb(h) for h in ("#b8925a", "#d2ad6f", "#e3c588", "#f0dba6")],
}
U, V = GRID_U, GRID_V


def tex_grass():
    n, patch = fbm(U, V, 4, 4, 101), fbm(U, V, 2, 2, 202)
    g = PAL["grass"]
    c = np.where((n < 0.45)[..., None], mix(g[1], g[2], n / 0.45), mix(g[2], g[3], (n - 0.45) / 0.55))
    c = mix(c, g[3], sstep(0.6, 0.85, patch) * 0.45)
    h = n * 0.4

    def blade(rng):
        tone = rng.random()
        return {"x": rng.random() * S, "y": rng.random() * S, "a": (rng.random() - 0.5) * 0.9, "len": 3 + int(rng.random() * 6),
                "h0": 0.2, "h": 0.5 + rng.random() * 0.4, "c0": g[0] if tone < 0.3 else g[1], "c1": g[3] if tone < 0.7 else g[4]}

    strokes(h, c, 5200, 7, blade)
    return paint(h, c, relief=9)


def tex_dirt(palette="dirt", seed=303, pebbles=70):
    d = PAL[palette]
    n, m = fbm(U, V, 4, 5, seed), fbm(U, V, 8, 2, seed + 1)
    h = n * 0.5 + m * 0.15
    c = mix(d[1], d[3], sstep(0.25, 0.8, n))
    c = mix(c, d[0], sstep(0.62, 0.8, m) * 0.5)
    rng = np.random.default_rng(seed)
    for _ in range(pebbles):
        px, py, size, tone = rng.random(), rng.random(), 0.006 + rng.random() * 0.014, rng.random()
        dx = np.abs(U - px)
        dy = np.abs(V - py)
        dx, dy = np.minimum(dx, 1 - dx), np.minimum(dy, 1 - dy)
        dist = np.hypot(dx, dy * 1.3) / size
        inside = dist < 1
        h = np.where(inside, h + np.sqrt(np.clip(1 - dist * dist, 0, 1)) * 0.6, h)
        stone = mix(PAL["stone"][1 if tone < 0.5 else 4], d[4], tone * 0.4)
        c = np.where(inside[..., None], stone, c)
    return paint(h, c, relief=7)


def tex_cobble(cells=7, seed=404, tint=1.0):
    f1, f2, ident = voronoi(U, V, cells, seed)
    edge = f2 - f1
    n = fbm(U, V, 16, 3, seed + 1)
    stones = np.stack(PAL["stone"])[ident % len(PAL["stone"])]
    tone = ((ident >> 12) & 255) / 255.0
    mortar = edge < 0.06
    c = np.where(mortar[..., None], mix(PAL["dirt"][0], PAL["dirt"][1], n), mix(stones, PAL["stone"][3], n * 0.35 + tone * 0.2) * tint)
    h = np.where(mortar, 0.0, sstep(0.04, 0.42, edge) * (0.75 + tone * 0.4) + n * 0.12)
    return paint(h, c, relief=10, ambient=0.55)


def tex_sand():
    n, w = fbm(U, V, 4, 4, 505), fbm(U, V, 2, 2, 506)
    ripple = np.sin((V * 22 + w * 5 + U * 3) * np.pi * 2) * 0.5 + 0.5
    fine = vnoise(U, V, 128, 507)
    s = PAL["sand"]
    c = mix(mix(s[1], s[2], n), s[3], ripple * 0.25 + fine * 0.1)
    return paint(ripple * 0.18 + n * 0.25 + fine * 0.05, c, relief=6, ambient=0.68)


def tex_ash():
    n, m = fbm(U, V, 4, 5, 606), vnoise(U, V, 64, 607)
    c = mix(rgb("#2a2630"), rgb("#57525c"), n)
    ember = sstep(0.93, 0.98, m) * sstep(0.45, 0.6, n)
    c = mix(c, rgb("#e8743b"), ember)
    return paint(n * 0.4, c, relief=5, ambient=0.6)


def tex_riverbed():
    img = np.asarray(tex_dirt("dirt", seed=313, pebbles=110), dtype=np.float64)
    murk = rgb("#3a4a48")
    return Image.fromarray(np.clip(img * 0.55 + murk * 0.45, 0, 255).astype(np.uint8), "RGB")


def tex_wall():
    rows, bw = 6, 1 / 3
    row = np.floor(V * rows)
    off = np.where(row % 2 == 1, bw / 2, 0)
    bu = (U + off) / bw
    bx = bu - np.floor(bu)
    by = V * rows - row
    ident = hsh(np.mod(np.floor(bu), 3), row, 77)
    e = np.minimum.reduce([bx * bw * S, (1 - bx) * bw * S, by * S / rows, (1 - by) * S / rows])
    n = fbm(U, V, 8, 4, 608)
    moss = sstep(0.62, 0.78, fbm(U, V, 4, 3, 609)) * (1 - by)
    base = mix(np.stack(PAL["stone"])[ident % 4], PAL["stone"][3], n * 0.35)
    c = np.where((e < 2.5)[..., None], PAL["dirt"][0], mix(base, PAL["grass"][2], moss * 0.55))
    h = np.where(e < 2.5, 0.0, sstep(2.5, 9, e) * 0.8 + n * 0.15)
    return paint(h, c, relief=9, ambient=0.55)


def tex_earth_side():
    n = fbm(U, V, 4, 4, 707)
    band = np.sin((V * 5 + n * 0.8) * np.pi * 2) * 0.5 + 0.5
    f1, _, ident = voronoi(U, V, 10, 708)
    c = mix(PAL["dirt"][0], PAL["dirt"][2], band * 0.7 + n * 0.3)
    h = band * 0.3 + n * 0.3
    pebble = (ident % 7 == 0) & (f1 < 0.32)
    c = np.where(pebble[..., None], mix(PAL["stone"][1], PAL["stone"][3], n), c)
    h = np.where(pebble, h + (0.32 - f1) * 2, h)
    return paint(h, c, relief=8, ambient=0.5)


def tex_rock_side():
    f1, f2, _ = voronoi(U, V, 5, 808)
    n = fbm(U, V, 4, 5, 809)
    crack = sstep(0.02, 0.1, f2 - f1)
    return paint(crack * 0.6 + n * 0.4, mix(PAL["stone"][0], PAL["stone"][3], n * 0.8 * crack + 0.1), relief=9, ambient=0.5)


def tex_planks():
    boards = 4
    b = np.floor(U * boards)
    bu = U * boards - b
    ident = hsh(b, 0, 909)
    grain = vnoise(U * 0.25, V, 32, 910) * 0.6 + vnoise(U, V * 0.1, 64, 911) * 0.4
    gap = (bu < 0.05) | (bu > 0.95)
    nail = (np.abs(bu - 0.5) < 0.05) & ((np.abs(V - 0.1) < 0.012) | (np.abs(V - 0.6) < 0.012))
    base = mix(rgb("#5f3b26"), rgb("#9a6a45"), ((ident & 255) / 255.0) * 0.5 + grain * 0.5)
    c = np.where(gap[..., None], rgb("#2d1e1a"), np.where(nail[..., None], rgb("#3b3640"), base))
    return paint(np.where(gap, 0.0, 0.5 + grain * 0.2), c, relief=6)


def tex_water(phase):
    w = fbm(np.mod(U + phase * 0.25, 1), V, 4, 3, 1010)
    n = fbm(U, np.mod(V + w * 0.3 + phase * 0.25, 1), 4, 4, 1011)
    crest = sstep(0.62, 0.72, n) * (1 - sstep(0.72, 0.8, n))
    c = mix(mix(rgb("#1d3f73"), rgb("#2f6fae"), n), rgb("#bfe8f8"), crest * 0.8)
    return Image.fromarray(np.clip(c, 0, 255).astype(np.uint8), "RGB")


TEXTURES = {
    "grass": tex_grass,
    "dirt": tex_dirt,
    "road": tex_cobble,
    "sand": tex_sand,
    "ash": tex_ash,
    "riverbed": tex_riverbed,
    "stone": lambda: tex_cobble(4, 414, 1.08),
    "wall": tex_wall,
    "earth_side": tex_earth_side,
    "rock_side": tex_rock_side,
    "planks": tex_planks,
    **{f"water_{k}": (lambda k=k: tex_water(k)) for k in range(4)},
}


def build(out):
    os.makedirs(out, exist_ok=True)
    for name, fn in TEXTURES.items():
        fn().save(os.path.join(out, f"{name}.png"), optimize=True)
    return list(TEXTURES)


if __name__ == "__main__":
    print(build(sys.argv[1] if len(sys.argv) > 1 else "ground-out"))
