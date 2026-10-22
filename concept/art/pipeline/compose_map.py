"""Hollow Crown – Pixel-Pipeline-Beweis (A0), Teil 4: Kartenausschnitt Varnhold (Kap. 1) als Mockup.

python compose_map.py <pix_dir> <out_png> [scale]

Zeigt den „HD-Pixel“-Look aus concept/15-art-direction.md: Pixel-Gelände (prozedurale Platzhalter-Tiles
mit weichen, gerasterten Übergängen), Blender-Requisiten und -Figuren, Overlays, Abenddämmerung als
Ambientlicht und Feuer als Punktlichter mit Normal-Map-Beleuchtung der Figuren.
Nur ein Konzept-Mockup: Im Spiel übernimmt das der Babylon-Renderer.
"""
import math
import os
import random
import sys

import numpy as np
from PIL import Image

T = 32
HERE = os.path.dirname(os.path.abspath(__file__))
PAL = [l.strip() for l in open(os.path.join(HERE, "..", "palette", "hollow-64.hex"), encoding="utf-8") if l.strip()]
C = {h: tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in PAL}

# Ausschnitt aus content/maps/ch01_varnhold.yaml, Zeilen 6–17 (siehe concept/data-samples/maps)
ROWS = [
    "##.H..##..##",
    "#...,,#....#",
    "..,,TT,,..,,",
    ".,TTT,,,.TT,",
    "..,,,,..,,..",
    "##..##..##.H",
    "#H..#....#..",
    "....,,,,....",
    ".,,TT..TT,,.",
    "..,,......,,",
    "...F....F...",
    "............",
]
BURNING = {(4, 7), (5, 7), (6, 6)}           # Kartenzeile 13 → Ausschnitt-Zeile 7
MOVE = {(4, 11), (5, 11), (6, 11), (3, 10), (4, 10), (5, 10), (6, 10), (7, 10), (4, 9), (5, 9), (6, 9),
        (3, 11), (7, 11), (5, 8), (2, 10), (8, 10), (5, 12 - 1)}
ATTACK = {(4, 8), (6, 8), (3, 9), (7, 9), (2, 9), (8, 9), (1, 10), (9, 10)}
DANGER = {(6, 4), (7, 4), (5, 4), (6, 3), (7, 3)}
UNITS = [  # (Unterordner, Variante, Frame, x, y)
    ("kael", "player", "idle_s_0", 5, 10),
    ("bandit", "enemy", "attack_s_2", 6, 5),
    ("bandit", "enemy", "idle_s_1", 2, 2),
    ("bandit", "other", "walk_s_1", 10, 8),
]
PATH = [(5, 10), (5, 9), (5, 8)]
GHOST = (5, 8)


def noise(seed):
    rnd = random.Random(seed)
    return lambda: rnd.random()


def terrain_pixels(w, h):
    """Geländetyp pro Pixel; Ränder zwischen Bodenarten werden mit Rauschen verzahnt (Ersatz für Autotiling)."""
    base = {".": "plain", ",": "grass", "T": "grass", "H": "plain", "F": "plain", "#": "wall"}
    tiles = [[base[c] for c in row] for row in ROWS]
    rnd = np.random.default_rng(7)
    jitter = rnd.integers(-5, 6, size=(h * T // 4 + 1, w * T // 4 + 1, 2)).repeat(4, 0).repeat(4, 1)
    out = np.empty((h * T, w * T), dtype=object)
    for py in range(h * T):
        for px in range(w * T):
            jx, jy = jitter[py, px]
            tx = min(max((px + jx) // T, 0), w - 1)
            ty = min(max((py + jy) // T, 0), h - 1)
            t = tiles[py // T][px // T]
            out[py, px] = t if t == "wall" or tiles[ty][tx] == "wall" else tiles[ty][tx]
    return out


def paint_ground(kind):
    rnd = np.random.default_rng(3)
    h, w = kind.shape
    img = np.zeros((h, w, 3), dtype=np.uint8)
    n = rnd.random((h // 2 + 1, w // 2 + 1)).repeat(2, 0).repeat(2, 1)[:h, :w]
    grass = [C["2f5e33"], C["4f8a3a"], C["8bbb4a"]]
    plain = [C["6b5a44"], C["a8916a"], C["c79a68"]]
    for y in range(h):
        for x in range(w):
            k = kind[y, x]
            if k == "grass":
                img[y, x] = grass[1] if n[y, x] < 0.9 else (grass[2] if n[y, x] < 0.96 else grass[0])
            elif k == "plain":
                img[y, x] = plain[1] if n[y, x] < 0.93 else (plain[0] if n[y, x] < 0.98 else plain[2])
            else:  # Mauer: Steinblöcke
                bx, by = x % 16, y % 10
                off = 8 if (y // 10) % 2 else 0
                edge = by == 0 or (x + off) % 16 == 0
                img[y, x] = C["4a4656"] if edge else (C["a39fa6"] if by < 3 else C["6e6a78"])
    # Grasbüschel
    for _ in range(260):
        x, y = int(rnd.integers(1, w - 1)), int(rnd.integers(2, h - 1))
        if kind[y, x] == "grass":
            img[y, x] = C["c9e07a"]
            img[y - 1, x] = C["8bbb4a"]
    return img


def paste_sprite(canvas, light, sprite, normal, cx, by, lights, ambient):
    """Sprite mit Fußpunkt (cx, by) einsetzen; Beleuchtung über Normal-Map."""
    s = np.asarray(sprite).astype(np.float64)
    nm = np.asarray(normal).astype(np.float64)
    h, w = s.shape[:2]
    ox, oy = int(cx - w / 2), int(by - (h - (h - 32) / 2 - 4))
    for y in range(h):
        for x in range(w):
            if s[y, x, 3] < 60:
                continue
            a = s[y, x, 3] / 255
            X, Y = ox + x, oy + y
            if not (0 <= X < canvas.shape[1] and 0 <= Y < canvas.shape[0]):
                continue
            nrm = nm[y, x, :3] / 255 * 2 - 1
            col = s[y, x, :3] / 255 * ambient
            for lx, ly, lc, rad in lights:
                d = np.array([lx - X, -(ly - Y), 18.0])
                dist = math.hypot(lx - X, ly - Y)
                if dist > rad:
                    continue
                att = (1 - dist / rad) ** 1.5
                lam = max(0.0, float(np.dot(nrm, d / np.linalg.norm(d))))
                col = col + s[y, x, :3] / 255 * lc * att * (0.35 + 0.9 * lam)
            canvas[Y, X] = canvas[Y, X] * (1 - a) + np.clip(col, 0, 1) * 255 * a
            light[Y, X] = 1  # Sprite schon beleuchtet


def main(pix, out_png, scale=3):
    w, h = len(ROWS[0]), len(ROWS)
    kind = terrain_pixels(w, h)
    ground = paint_ground(kind).astype(np.float64)
    # Overlays (Bewegung/Angriff/Gefahr) vor dem Licht, wie im Spiel unter den Figuren
    ov = Image.new("RGBA", (w * T, h * T), (0, 0, 0, 0))
    ova = np.array(ov)
    for (tx, ty), col, a in [(t, C["3d7be0"], 110) for t in MOVE] + [(t, C["d9413a"], 105) for t in ATTACK]:
        ova[ty * T + 1:(ty + 1) * T - 1, tx * T + 1:(tx + 1) * T - 1] = (*col, a)
        ova[ty * T + 1, tx * T + 1:(tx + 1) * T - 1] = (*col, 220)
    for tx, ty in DANGER:
        for y in range(ty * T, (ty + 1) * T):
            for x in range(tx * T, (tx + 1) * T):
                if (x + y) % 8 < 3:
                    ova[y, x] = (*C["d9413a"], 120)
    for (ax, ay), (bx, byy) in zip(PATH, PATH[1:]):
        for t in np.linspace(0, 1, 40):
            x = int((ax + (bx - ax) * t) * T + T / 2)
            y = int((ay + (byy - ay) * t) * T + T / 2)
            ova[y - 2:y + 2, x - 2:x + 2] = (*C["f2d98c"], 255)
    o = ova.astype(np.float64)
    ground = ground * (1 - o[..., 3:] / 255) + o[..., :3] * (o[..., 3:] / 255)

    # Licht: Abenddämmerung + Feuer
    ambient = np.array([0.66, 0.58, 0.78])
    lights = [(x * T + 16, y * T + 18, np.array([0.95, 0.42, 0.12]), 3.4 * T) for x, y in BURNING]
    lights.append((5 * T + 16, 10 * T + 10, np.array([0.25, 0.32, 0.55]), 1.6 * T))  # Auswahl-Glimmen
    yy, xx = np.mgrid[0:h * T, 0:w * T]
    lit = np.ones((h * T, w * T, 3)) * ambient
    for lx, ly, lc, rad in lights[:-1]:
        d = np.hypot(xx - lx, yy - ly) / rad
        band = np.floor(np.clip(1 - d, 0, 1) * 4) / 4   # gestufter Lichtabfall (Pixel-Look)
        lit += band[..., None] ** 1.6 * lc
    canvas = np.clip(ground / 255 * lit, 0, 1) * 255
    light_done = np.zeros((h * T, w * T), dtype=np.uint8)

    def load(sub, variant, frame):
        d = os.path.join(pix, sub, "frames")
        return Image.open(os.path.join(d, f"{frame}.{variant}.png")), Image.open(os.path.join(d, f"{frame}.normal.png"))

    house = load("prop_house", "key", "static_s_0")
    tree = load("prop_tree", "key", "static_s_0")
    drawables = []
    for y, row in enumerate(ROWS):
        for x, c in enumerate(row):
            if c == "H":
                drawables.append((y * T + 30, house, x * T + 16, y * T + 26))
            elif c == "T":
                drawables.append((y * T + 28, tree, x * T + 16, y * T + 26))
    ring = {"player": C["3d7be0"], "enemy": C["d9413a"], "other": C["3fa65a"]}
    for sub, var, fr, x, y in UNITS:
        cx, cy = x * T + 16, y * T + 28
        for a in np.linspace(0, 2 * math.pi, 90):
            px, py = int(round(cx + 10 * math.cos(a))), int(round(cy + 3.5 * math.sin(a)))
            canvas[py, px] = canvas[py, px] * 0.35 + np.array(ring[var]) * 0.65
        drawables.append((y * T + 29, load(sub, var, fr), x * T + 16, y * T + 28))
    gs, gn = load("kael", "player", "idle_s_0")
    ghost = gs.copy()
    ga = np.array(ghost)
    ga[..., 3] = (ga[..., 3] > 0) * 150
    drawables.append((GHOST[1] * T + 29, (Image.fromarray(ga), gn), GHOST[0] * T + 16, GHOST[1] * T + 28))
    for _, (s, n), cx, by in sorted(drawables, key=lambda d: d[0]):
        paste_sprite(canvas, light_done, s, n, cx, by, lights, ambient)

    # Flammen und Funken (Pixel-Partikel)
    rnd = noise(11)
    for bx, by in BURNING:
        for k in range(6):
            fx = bx * T + 5 + k * 4 + int(rnd() * 3)
            fh = 9 + int(rnd() * 12)
            base = by * T + 27
            for dy in range(fh):
                half = max(0, int((1 - dy / fh) * 2.6 + (0.6 if dy < 3 else 0)))
                hot = dy / fh
                col = C["ffc06b"] if hot < 0.35 else (C["e8743b"] if hot < 0.7 else C["c2451e"])
                canvas[base - dy, fx - half:fx + half + 1] = col
        for _ in range(14):
            x = int(bx * T + rnd() * 40 - 4)
            y = int(by * T - rnd() * 40)
            if 0 <= y < h * T and 0 <= x < w * T:
                canvas[y, x] = C["ffc06b"]
    img = Image.fromarray(canvas.astype(np.uint8), "RGB")
    img.save(out_png.replace(".png", "@1x.png"))
    img.resize((img.width * scale, img.height * scale), Image.NEAREST).save(out_png)
    print(out_png, img.size)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 3)
