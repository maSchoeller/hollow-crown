"""Proportion guides for dialogue portraits (art/prompts/style_master_v2.md).

Two jobs:
  sheet     Contact sheet: every portrait with the guide lines and the anchor's
            outline drawn over it, plus measured widths, so head-to-body drift is
            visible at a glance before anyone reviews faces.
  template  A square proportion template (anchor silhouette in light grey with the
            guide lines) to attach to ChatGPT as a third reference image.

Guide lines are fractions of the image height, measured on rhen_a.png and fenn.png.

Usage:
  python tools/art/portrait_guides.py sheet out.png a.png b.png ...
  python tools/art/portrait_guides.py template out.png
"""

import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ANCHOR = "art/mockups/characters-s1/rhen_a.png"
# (label, fraction of image height)
GUIDES = [("top", 0.02), ("eyes", 0.20), ("chin", 0.33), ("shoulders", 0.40), ("belt", 0.78)]
# Body width (alpha extent) at these heights; the anchors sit roughly in these ranges.
WIDTH_ROWS = [0.40, 0.60, 0.78]
ANCHOR_RANGE = {0.40: (0.42, 0.68), 0.60: (0.60, 0.76), 0.78: (0.60, 0.84)}


def alpha(img):
    return np.asarray(img.convert("RGBA"))[:, :, 3] > 40


def width_at(mask, frac):
    row = mask[min(int(frac * mask.shape[0]), mask.shape[0] - 1)]
    xs = np.where(row)[0]
    return (xs[-1] - xs[0]) / mask.shape[1] if len(xs) else 0.0


def outline(size):
    mask = Image.fromarray((alpha(Image.open(ANCHOR)) * 255).astype("uint8")).resize((size, size))
    return mask.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 60 else 0)


def draw_guides(draw, size, colour=(220, 40, 40, 255)):
    for label, frac in GUIDES:
        y = int(frac * size)
        draw.line([(0, y), (size, y)], fill=colour, width=2)
        draw.text((4, y + 2), label, fill=colour)


def sheet(out, paths, size=420):
    edge = outline(size)
    tiles = []
    for path in paths:
        img = Image.open(path).convert("RGBA")
        mask = alpha(img)
        tile = Image.new("RGBA", (size, size + 40), (238, 238, 238, 255))
        tile.alpha_composite(img.resize((size, size)))
        tile.paste((40, 120, 255, 255), (0, 0), edge)
        draw = ImageDraw.Draw(tile)
        draw_guides(draw, size)
        parts = []
        for frac in WIDTH_ROWS:
            w = width_at(mask, frac)
            lo, hi = ANCHOR_RANGE[frac]
            parts.append(f"{int(frac * 100)}%:{w:.2f}{'' if lo <= w <= hi else '!'}")
        name = path.replace("\\", "/").split("/")[-1]
        draw.text((4, size + 4), name, fill=(20, 20, 20, 255))
        draw.text((4, size + 20), "  ".join(parts), fill=(20, 20, 20, 255))
        tiles.append(tile)
        print(name, " ".join(parts))
    cols = min(len(tiles), 4)
    rows = (len(tiles) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * size, rows * (size + 40)), (255, 255, 255))
    for i, tile in enumerate(tiles):
        canvas.paste(tile.convert("RGB"), ((i % cols) * size, (i // cols) * (size + 40)))
    canvas.save(out)


def template(out, size=1254):
    mask = Image.fromarray((alpha(Image.open(ANCHOR)) * 255).astype("uint8")).resize((size, size))
    img = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    img.paste((205, 205, 205, 255), (0, 0), mask)
    draw = ImageDraw.Draw(img)
    for label, frac in GUIDES:
        y = int(frac * size)
        draw.line([(0, y), (size, y)], fill=(220, 40, 40, 255), width=4)
        draw.text((12, y + 6), label.upper(), fill=(220, 40, 40, 255))
    img.convert("RGB").save(out)


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in ("sheet", "template"):
        sys.exit(__doc__)
    if sys.argv[1] == "sheet":
        sheet(sys.argv[2], sys.argv[3:])
    else:
        template(sys.argv[2])
