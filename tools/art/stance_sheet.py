"""Joins the images of tools/art/stance_shots.py into one acceptance sheet (story 16.10).

    python tools/art/stance_sheet.py <shots_dir> <out.png> [--figs lucan,hask] [--views front,side]

Rows = stances present in the folder, columns = figure x (rest, ready) x view. Needs Pillow.
"""
import os
import sys

from PIL import Image, ImageDraw

ORDER = ["lance", "staff", "blade", "axe", "bow", "book", "lute", "none", "lance_shield", "blade_shield", "axe_shield", "staff_shield"]
src, dst = sys.argv[1], sys.argv[2]
figs = sys.argv[sys.argv.index("--figs") + 1].split(",") if "--figs" in sys.argv else ["lucan", "hask"]
views = sys.argv[sys.argv.index("--views") + 1].split(",") if "--views" in sys.argv else ["front"]
cells = [(f, p, v) for f in figs for p in ("rest", "ready") for v in views]
rows = [s for s in ORDER if any(os.path.exists(f"{src}/{f}_{s}_{p}_{v}.png") for f, p, v in cells)]
w, h = Image.open(next(f"{src}/{f}_{s}_{p}_{v}.png" for s in rows for f, p, v in cells if os.path.exists(f"{src}/{f}_{s}_{p}_{v}.png"))).size
sheet = Image.new("RGB", (90 + w * len(cells), 24 + h * len(rows)), (200, 204, 208))
d = ImageDraw.Draw(sheet)
for c, (f, p, v) in enumerate(cells):
    d.text((90 + c * w + 8, 6), f"{f} {p} {v}", fill=(20, 20, 20))
for r, st in enumerate(rows):
    d.text((6, 24 + r * h + h // 2), st, fill=(20, 20, 20))
    for c, (f, p, v) in enumerate(cells):
        path = f"{src}/{f}_{st}_{p}_{v}.png"
        if os.path.exists(path):
            sheet.paste(Image.open(path), (90 + c * w, 24 + r * h))
sheet.save(dst)
