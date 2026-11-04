"""Paint guides from the computed terrain: season zones at terrain edges, forests, marsh, rivers.

Usage: python art/world/v4/guide.py <terrain_out_dir> art/world/v4/guide_places.json <out_dir>
Writes guide_a_landscape.png, guide_b_settlements.png and guide_c_roads.png.
"""
import json
import math
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

d, places, outdir = sys.argv[1:4]
out = outdir + "/guide_a_landscape.png"
z = np.load(d + "/height.npy").astype(float)
sea = np.load(d + "/sea.npy")
lakes = np.load(d + "/lakes.npy")
area = np.load(d + "/area.npy")
N = z.shape[0]
S = 1024
zoom = S / N
z = ndimage.zoom(z, zoom, order=3)
sea = ndimage.zoom(sea.astype(float), zoom, order=1) > 0.5
lakes = ndimage.zoom(lakes.astype(float), zoom, order=1) > 0.5
yy, xx = np.mgrid[0:S, 0:S] / (S - 1)
rng = np.random.default_rng(5)
wob = ndimage.gaussian_filter(rng.standard_normal((S, S)), 26)
wob = wob / np.abs(wob).max() * 0.012

# Season edges follow the terrain: the Kamm in the south, the Riegel and its side ridges in the north.
kamm = np.interp(xx, [0, 0.25, 0.6, 1], [0.62, 0.70, 0.665, 0.665]) + wob
riegel = np.interp(xx, [0, 0.2, 0.45, 0.55, 0.75, 1], [0.27, 0.27, 0.30, 0.31, 0.24, 0.20]) + wob
PAL = {
    "summer": [(92, 136, 70), (150, 170, 92), (178, 170, 118)],
    "autumn": [(176, 138, 66), (178, 112, 58), (140, 96, 70)],
    "winter": [(226, 232, 238), (206, 214, 224), (246, 248, 252)],
}


def ramp(cols):
    a = np.clip(z, 0, None)
    return np.stack([np.interp(a, [0, 700, 1600], [c[i] for c in cols]) for i in range(3)], -1)


rgb = ramp(PAL["summer"])
m = yy < kamm
rgb[m] = ramp(PAL["autumn"])[m]
m = yy < riegel
rgb[m] = ramp(PAL["winter"])[m]
peak = z > 1700
rgb[peak] = (rgb[peak] * 0.2 + np.array((244, 246, 250)) * 0.8)

gy, gx = np.gradient(np.maximum(z, 0), 400000 / S)
gx, gy = gx * 2.6, gy * 2.6
az, el = math.radians(315), math.radians(48)
lx, ly, lz = math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)
shade = np.clip((-gx * lx - gy * ly + lz) / np.sqrt(gx * gx + gy * gy + 1), 0, 1)
rgb *= (0.5 + 0.75 * shade)[..., None]
rgb[sea] = (88, 136, 170)
rgb[lakes] = (214, 232, 240)
img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
dr = ImageDraw.Draw(img)

# Rivers from drainage, widths from discharge.
km2 = ndimage.zoom(area / 1e6, zoom, order=1)
w = np.where((km2 > 420) & ~sea & ~lakes, np.sqrt(km2 / 420), 0)
edge = (xx > 0.975) | (yy < 0.02) | (yy > 0.985)
w[edge] = 0
w = ndimage.gaussian_filter(w, 1.1)
arr = np.asarray(img).copy()
arr[w > 0.32] = (64, 118, 165)
img = Image.fromarray(arr)
dr = ImageDraw.Draw(img)

# Forests: dark dots; marsh: hatch. Positions in image fractions.
forests = [(0.74, 0.80, 0.11, 0.07, (46, 92, 52)), (0.70, 0.215, 0.10, 0.05, (72, 102, 96)), (0.26, 0.345, 0.07, 0.05, (120, 92, 44)), (0.84, 0.37, 0.07, 0.05, (120, 76, 44)), (0.53, 0.77, 0.05, 0.04, (46, 92, 52))]
for cx, cy, rx, ry, col in forests:
    for _ in range(int(rx * ry * 26000)):
        a, r = rng.uniform(0, 6.283), math.sqrt(rng.uniform(0, 1))
        px, py = (cx + r * rx * math.cos(a)) * S, (cy + r * ry * math.sin(a)) * S
        if not sea[int(py), int(px)] and not lakes[int(py), int(px)]:
            dr.ellipse((px - 4, py - 4, px + 4, py + 4), fill=col)
for _ in range(240):
    a, r = rng.uniform(0, 6.283), math.sqrt(rng.uniform(0, 1))
    px, py = (0.395 + r * 0.055 * math.cos(a)) * S, (0.815 + r * 0.03 * math.sin(a)) * S
    if not sea[int(py), int(px)]:
        dr.line((px - 5, py, px + 5, py), fill=(70, 96, 72), width=2)
dr.ellipse((0.49 * S - 13, 0.08 * S - 13, 0.49 * S + 13, 0.08 * S + 13), fill=(198, 70, 30), outline=(60, 40, 36), width=3)
img.save(out)
P = json.load(open(places, encoding="utf8"))
base = img.copy()


def line(draw, names, width, col=(96, 60, 30)):
    pts = [(P[n][0] * S, P[n][1] * S) if isinstance(n, str) else (n[0] * S, n[1] * S) for n in names]
    draw.line(pts, fill=col, width=width, joint="curve")


# Variant B: every place as a square, main roads only.
road = ["Aurenhall", "Aureklamm", "Rabenweide", "Kronfeld", "Windscharte", "Paktwacht", "Tobins Hof", "Varnhold"]
line(dr, road, 4)
for k in ["Kontor", "Silberquell", "Salzpass"]:
    line(dr, ["Kronfeld", k], 2)
line(dr, ["Silberquell", "Grauwacht", "Brandhang"], 2)
for name, (x, y, *rest) in P.items():
    r = 11 if rest else 6
    dr.rectangle((x * S - r, y * S - r, x * S + r, y * S + r), fill=(120, 72, 44), outline=(40, 28, 22), width=2)
img.save(outdir + "/guide_b_settlements.png")

# Variant C: the full road net and the border wall, no places.
img = base
dr = ImageDraw.Draw(img)
line(dr, road, 5)
line(dr, ["Kronfeld", "Kontor", [0.33, 0.53], [0.24, 0.58], "Perlhof"], 3)
line(dr, ["Kronfeld", "Silberquell", "Grauwacht", "Kupferhall"], 3)
line(dr, ["Grauwacht", "Brandhang"], 2)
line(dr, ["Kontor", "Salzpass", [0.27, 0.34]], 2)
line(dr, ["Aurenhall", [0.43, 0.285], "Königsgruft"], 2)
line(dr, ["Aurenhall", [0.58, 0.29], [0.66, 0.24], "Vesnas Hütte"], 2)
line(dr, ["Varnhold", "Erlenmoor"], 2)
line(dr, ["Varnhold", "Erlbach", "Hasks Lager"], 2)
line(dr, ["Paktwacht", "Schrein", "Wolfshügel"], 2)
line(dr, ["Schrein", "Wachturm"], 2)
dr.line([(0.955 * S, 0.60 * S), (0.965 * S, 0.70 * S), (0.975 * S, 0.985 * S)], fill=(44, 36, 30), width=6)
img.save(outdir + "/guide_c_roads.png")
