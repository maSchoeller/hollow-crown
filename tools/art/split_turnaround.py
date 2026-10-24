"""Hollow Crown – split a turnaround sheet into its views for Tripo multi-view (concept/23-art-direction §4.6).

python tools/art/split_turnaround.py art/turnarounds/<id>_board/sheet.png [--size 1024]

Writes front.png, side.png, back.png next to the sheet: each view cropped and centred on a square in the sheet's
background colour. The sheet is cut into thirds at the emptiest column near each third; views that overlap there (a
hand reaching under the next view's hair) are separated by keeping only the largest connected figure in each part.
The side view goes unmirrored into Tripo's field for the side it shows (a figure looking to the right shows its right
side).
"""
import os
import sys
from collections import deque

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
cuts = []
for k in (1, 2):
    lo, hi = int(w * (k / 3 - 0.08)), int(w * (k / 3 + 0.08))
    cuts.append(lo + int(np.argmin(cols[lo:hi])))
STEP = 4  # labelling on a coarser grid is plenty to tell figures apart


def largest_figure(mask):
    """Mask of the largest 4-connected component of `mask` (labelled on a grid of STEP pixels)."""
    h, w = mask.shape
    small = mask[: h - h % STEP, : w - w % STEP].reshape(h // STEP, STEP, w // STEP, STEP).any((1, 3))
    label = np.zeros(small.shape, np.int32)
    sizes = [0]
    for y, x in zip(*np.nonzero(small)):
        if label[y, x]:
            continue
        n = len(sizes)
        label[y, x] = n
        queue, count = deque([(y, x)]), 0
        while queue:
            cy, cx = queue.popleft()
            count += 1
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < small.shape[0] and 0 <= nx < small.shape[1] and small[ny, nx] and not label[ny, nx]:
                    label[ny, nx] = n
                    queue.append((ny, nx))
        sizes.append(count)
    keep = np.kron(label == int(np.argmax(sizes)), np.ones((STEP, STEP), bool))
    out = np.zeros_like(mask)
    out[: keep.shape[0], : keep.shape[1]] = keep
    return mask & out


out = os.path.dirname(sheet)
MARGIN = 80  # each part reaches past its cut, so a hand across it stays whole; the neighbour's bits are not its largest
for name, (x0, x1) in zip(("front", "side", "back"), [(0, cuts[0]), (cuts[0], cuts[1]), (cuts[1], w)]):
    x0, x1 = max(0, x0 - MARGIN), min(w, x1 + MARGIN)
    mine = largest_figure(fig[:, x0:x1])
    ys, xs = np.nonzero(mine)
    view = px[:, x0:x1].copy()
    view[~mine] = bg  # stray bits of a neighbouring view
    crop = Image.fromarray(view.astype(np.uint8)).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    side = int(max(crop.size) * 1.1)
    canvas = Image.new("RGB", (side, side), tuple(int(c) for c in bg))
    canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
    canvas.resize((size, size), Image.LANCZOS).save(os.path.join(out, f"{name}.png"))
    print(f"{name}: columns {x0}–{x1}, figure {x0 + xs.min()}–{x0 + xs.max() + 1} × {ys.min()}–{ys.max() + 1}")
