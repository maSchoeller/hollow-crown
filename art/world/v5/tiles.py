"""Cut the base map into overlapping tiles and compose painted tiles back together.

Usage:
  python art/world/v5/tiles.py cut <base.png> <out_dir>
  python art/world/v5/tiles.py compose <base.png> <tile_dir> <out.png> [--patch name:x0:y0:x1:y1 ...]

Tiles are named r<row>c<col>.png. On compose each painted tile is aligned to the enlarged base by
phase correlation, then cross-faded over the overlaps. Missing tiles fall back to the enlarged base.
A patch is an extra painted tile covering the given base rectangle, laid on top with a soft edge.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

N = 3
CROP = 480
TILE = 1254
STEP = (1254 - CROP) // (N - 1)
SCALE = TILE / CROP


def align(tile, ref):
    """Integer shift of tile onto ref, found by phase correlation on luminance."""
    a = np.asarray(tile.convert("L"), float)
    b = np.asarray(ref.convert("L"), float)
    a, b = a - a.mean(), b - b.mean()
    r = np.fft.ifft2(np.fft.fft2(b) * np.conj(np.fft.fft2(a)))
    y, x = np.unravel_index(np.argmax(np.abs(r)), r.shape)
    h, w = a.shape
    y = y - h if y > h // 2 else y
    x = x - w if x > w // 2 else x
    return int(y), int(x)


def weight(size, feather):
    """Weight ramp falling to zero towards the tile border."""
    d = np.minimum(np.arange(size), np.arange(size)[::-1]).astype(float)
    return np.clip((d + 1) / feather, 0, 1)


def lay(canvas, total, tile, ref, x0, y0, feather):
    dy, dx = align(tile, ref)
    if max(abs(dy), abs(dx)) > 40:
        print(f"  large shift {dy},{dx} ignored at {x0},{y0}")
        dy, dx = 0, 0
    arr = np.asarray(tile.convert("RGB"), float)
    h, w = arr.shape[:2]
    mask = np.outer(weight(h, feather), weight(w, feather))
    ys, xs = y0 + dy, x0 + dx
    cy0, cx0 = max(ys, 0), max(xs, 0)
    cy1, cx1 = min(ys + h, canvas.shape[0]), min(xs + w, canvas.shape[1])
    part = arr[cy0 - ys : cy1 - ys, cx0 - xs : cx1 - xs]
    m = mask[cy0 - ys : cy1 - ys, cx0 - xs : cx1 - xs][..., None]
    canvas[cy0:cy1, cx0:cx1] += part * m
    total[cy0:cy1, cx0:cx1] += m
    return dy, dx


def cut(base, out):
    out.mkdir(parents=True, exist_ok=True)
    im = Image.open(base).convert("RGB")
    for r in range(N):
        for c in range(N):
            x, y = c * STEP, r * STEP
            im.crop((x, y, x + CROP, y + CROP)).resize((TILE, TILE), Image.LANCZOS).save(out / f"r{r}c{c}.png")


def compose(base, tile_dir, out, patches):
    im = Image.open(base).convert("RGB")
    size = round(1254 * SCALE)
    big = im.resize((size, size), Image.LANCZOS)
    canvas = np.zeros((size, size, 3))
    total = np.zeros((size, size, 1))
    feather = round((CROP - STEP) * SCALE / 2)
    for r in range(N):
        for c in range(N):
            p = tile_dir / f"r{r}c{c}.png"
            x, y = round(c * STEP * SCALE), round(r * STEP * SCALE)
            tile = Image.open(p).convert("RGB") if p.exists() else big.crop((x, y, x + TILE, y + TILE))
            print(p.name, lay(canvas, total, tile, big.crop((x, y, x + TILE, y + TILE)), x, y, feather))
    res = canvas / np.maximum(total, 1e-6)
    # Patches go on top with a soft edge, replacing whatever the tiles painted there.
    for spec in patches:
        name, *box = spec.split(":")
        x0, y0, x1, y1 = [round(int(v) * SCALE) for v in box]
        w, h = x1 - x0, y1 - y0
        tile = Image.open(tile_dir / name).convert("RGB").resize((w, h), Image.LANCZOS)
        mask = np.outer(weight(h, 110), weight(w, 110))[..., None]
        res[y0:y1, x0:x1] = res[y0:y1, x0:x1] * (1 - mask) + np.asarray(tile, float) * mask
    Image.fromarray(np.clip(res, 0, 255).astype(np.uint8)).save(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["cut", "compose"])
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--patch", action="append", default=[])
    a = ap.parse_args()
    if a.mode == "cut":
        cut(a.paths[0], Path(a.paths[1]))
    else:
        compose(a.paths[0], Path(a.paths[1]), a.paths[2], a.patch)


if __name__ == "__main__":
    main()
