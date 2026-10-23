"""Hollow Crown – split a turnaround sheet into its views for Tripo multi-view (concept/23-art-direction §4.6).

python tools/art/split_turnaround.py art/turnarounds/<id>_board/sheet.png [--size 1024]

Writes front.png, side.png, back.png next to the sheet: each view cropped and centred on a square in the sheet's
background colour. Views are separated at background gaps; where two views touch, at the column with the fewest
figure pixels between them. The side view goes unmirrored into Tripo's field for the side it shows (a figure looking
to the right shows its right side).
"""
import os
import sys

import numpy as np
from PIL import Image

sheet = sys.argv[1]
size = int(sys.argv[sys.argv.index("--size") + 1]) if "--size" in sys.argv else 1024
im = Image.open(sheet).convert("RGB")
px = np.asarray(im).astype(np.int32)
bg = np.median(np.concatenate([px[:8].reshape(-1, 3), px[-8:].reshape(-1, 3)]), axis=0)
fig = np.abs(px - bg).sum(2) > 30
cols = fig.sum(0)
w = len(cols)
# three views: cut at the emptiest column inside each third's border zone
cuts = []
for k in (1, 2):
    lo, hi = int(w * (k / 3 - 0.08)), int(w * (k / 3 + 0.08))
    cuts.append(lo + int(np.argmin(cols[lo:hi])))
bounds = [(0, cuts[0]), (cuts[0], cuts[1]), (cuts[1], w)]
out = os.path.dirname(sheet)
for name, (x0, x1) in zip(("front", "side", "back"), bounds):
    part = fig[:, x0:x1]
    ys, xs = np.nonzero(part)
    box = (x0 + xs.min(), ys.min(), x0 + xs.max() + 1, ys.max() + 1)
    crop = im.crop(box)
    side = int(max(crop.size) * 1.1)
    canvas = Image.new("RGB", (side, side), tuple(int(c) for c in bg))
    canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
    canvas.resize((size, size), Image.LANCZOS).save(os.path.join(out, f"{name}.png"))
    print(f"{name}: columns {x0}–{x1}, figure {box}")
