"""Joins the images of tools/art/grip_shots.py into one acceptance sheet (story 16.9).

    python tools/art/grip_sheet.py <shots_dir> <out.png> [--figs lucan,hask]

Rows = weapon kinds, columns = figure x (rest, attack 0.25 s). Needs Pillow.
"""
import sys

from PIL import Image, ImageDraw

WEAPONS = ["sword", "dagger", "axe", "lance", "staff", "bow", "book", "shield", "lute", "focus"]
src, dst = sys.argv[1], sys.argv[2]
figs = sys.argv[sys.argv.index("--figs") + 1].split(",") if "--figs" in sys.argv else ["lucan", "hask"]
cells = [(f, p) for f in figs for p in ("rest", "attack")]
w, h = Image.open(f"{src}/{figs[0]}_sword_rest.png").size
sheet = Image.new("RGB", (60 + w * len(cells), 24 + h * len(WEAPONS)), (200, 204, 208))
d = ImageDraw.Draw(sheet)
for c, (f, p) in enumerate(cells):
    d.text((60 + c * w + 8, 6), f"{f} {p}", fill=(20, 20, 20))
for r, wk in enumerate(WEAPONS):
    d.text((6, 24 + r * h + h // 2), wk, fill=(20, 20, 20))
    for c, (f, p) in enumerate(cells):
        sheet.paste(Image.open(f"{src}/{f}_{wk}_{p}.png"), (60 + c * w, 24 + r * h))
sheet.save(dst)
