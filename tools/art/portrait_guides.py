"""Proportion guides for dialogue portraits (art/prompts/style_master_v2.md).

Two jobs:
  sheet     Contact sheet: every portrait with the guide lines and the anchor's
            outline drawn over it, plus measured widths, so head-to-body drift is
            visible at a glance before anyone reviews faces.
  template  A square proportion template (anchor silhouette in light grey with the
            guide lines) to attach to ChatGPT as a third reference image.

Guide lines are fractions of the image height, measured on rhen_a.png and fenn.png.

Usage:
  python tools/art/portrait_guides.py sheet out.png a.png b.png:heavy ...
  (append ":<build>" to check a portrait against its build template)
  python tools/art/portrait_guides.py template out.png [average|slim|broad|heavy|small|tall]
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
    for arg in paths:
        # "file.png:heavy" compares against that build's template, else the anchors' range
        path, _, build = arg.rpartition(":") if arg.rsplit(":", 1)[-1] in BUILDS else (arg, "", "")
        img = Image.open(path).convert("RGBA")
        mask = alpha(img)
        tile = Image.new("RGBA", (size, size + 40), (238, 238, 238, 255))
        tile.alpha_composite(img.resize((size, size)))
        tile.paste((40, 120, 255, 255), (0, 0), edge)
        draw = ImageDraw.Draw(tile)
        draw_guides(draw, size)
        target = build_mask(build, 300)[0] if build else None
        parts = []
        for frac in WIDTH_ROWS:
            w = width_at(mask, frac)
            if target is not None:
                t = width_at(target, frac)
                lo, hi = t - BUILD_TOLERANCE, t + BUILD_TOLERANCE
            else:
                lo, hi = ANCHOR_RANGE[frac]
            parts.append(f"{int(frac * 100)}%:{w:.2f}{'' if lo <= w <= hi else '!'}")
        name = path.replace("\\", "/").split("/")[-1] + (f" ({build})" if build else "")
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


# Body builds as warps of the anchor silhouette. Head and eye lines stay close to the
# anchor so the style holds; shoulders, torso, belly and size in the frame vary.
#   lines: target fractions for top, chin, belt (the anchor is 0.02 / 0.33 / 0.78)
#   widths: horizontal scale at head, shoulders (0.40), chest (0.60), belt (0.78), bottom
BUILDS = {
    "average": {"lines": (0.02, 0.33, 0.78), "widths": (1.00, 1.00, 1.00, 1.00, 1.00)},
    "slim":    {"lines": (0.02, 0.33, 0.78), "widths": (0.95, 0.78, 0.74, 0.74, 0.76)},
    "broad":   {"lines": (0.02, 0.33, 0.78), "widths": (1.03, 1.28, 1.22, 1.10, 1.08)},
    "heavy":   {"lines": (0.03, 0.34, 0.80), "widths": (1.05, 1.12, 1.38, 1.42, 1.35)},
    "small":   {"lines": (0.08, 0.38, 0.82), "widths": (0.98, 0.95, 0.95, 0.95, 0.95)},
    "tall":    {"lines": (0.01, 0.29, 0.74), "widths": (0.92, 0.95, 0.88, 0.86, 0.86)},
}
WIDTH_KEYS = (0.20, 0.40, 0.60, 0.78, 1.00)
# Allowed deviation from a build template's width; arms, capes and props add spread.
BUILD_TOLERANCE = 0.12


def build_mask(name, size):
    src = alpha(Image.open(ANCHOR).resize((size, size)))
    spec = BUILDS[name]
    top, chin, belt = spec["lines"]
    # Vertical: map target rows to source rows piecewise through top, chin, belt, bottom.
    tgt = [top, chin, belt, 1.0]
    srcl = [0.02, 0.33, 0.78, 1.0]
    out = np.zeros_like(src)
    cx = np.where(src.any(0))[0].mean()
    for y in range(size):
        f = y / size
        if f < top:
            continue
        sy = np.interp(f, tgt, srcl)
        row = src[min(int(sy * size), size - 1)]
        k = np.interp(sy, WIDTH_KEYS, spec["widths"])
        xs = (np.arange(size) - cx) / k + cx
        valid = (xs >= 0) & (xs < size)
        out[y, valid] = row[xs[valid].astype(int)]
    return out, spec


def template(out, build="average", size=1254):
    mask, spec = build_mask(build, size)
    top, chin, belt = spec["lines"]
    lines = [("top", top), ("eyes", top + (chin - top) * 0.58), ("chin", chin),
             ("shoulders", chin + 0.07), ("belt", belt)]
    img = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    img.paste((205, 205, 205, 255), (0, 0), Image.fromarray((mask * 255).astype("uint8")))
    draw = ImageDraw.Draw(img)
    for label, frac in lines:
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
        template(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "average")
