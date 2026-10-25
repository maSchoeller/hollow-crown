"""Layout guide of the flat world map: coarse zones plus numbered clearings, drawn from art/world/map_layout.json.

The guide is only a reference picture for ChatGPT (art/prompts/world_map.md); it is not shipped. It also checks the
layout: spacing of the places, distance to the coast and to the river.

    python tools/art/world_guide.py            # writes art/world/map_guide.png and prints the checks
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
LAYOUT = ROOT / 'art' / 'world' / 'map_layout.json'
OUT = ROOT / 'art' / 'world' / 'map_guide.png'
W, H = 1024, 1536

SEA = (47, 143, 196)
SUMMER = (134, 184, 74)
AUTUMN = (224, 138, 44)
WINTER = (236, 243, 248)
ROCK = (140, 143, 152)
RIVER = (90, 190, 225)
CLEAR = (255, 255, 255)


def polyline_x(points, y):
    """x of a polyline (monotone in y) at height y."""
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if y0 <= y <= y1:
            return x0 + (x1 - x0) * (y - y0) / (y1 - y0) if y1 != y0 else x0
    return points[-1][0]


def dist_to_polyline(p, points):
    best = 1e9
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        dx, dy = x1 - x0, y1 - y0
        t = max(0, min(1, ((p[0] - x0) * dx + (p[1] - y0) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(p[0] - (x0 + t * dx), p[1] - (y0 + t * dy)))
    return best


def main():
    d = json.loads(LAYOUT.read_text(encoding='utf-8'))
    k = W / d['size'][0]  # px per unit
    places = d['places']
    coast, river, bands = d['coast'], d['river'], d['bands']

    # --- checks -------------------------------------------------------------------------------------------------
    bad = 0
    for i, a in enumerate(places):
        for b in places[i + 1:]:
            gap = math.hypot(a['at'][0] - b['at'][0], a['at'][1] - b['at'][1])
            if gap < d['minSpacing']:
                print(f"too close ({gap:.1f}): {a['label']} - {b['label']}")
                bad += 1
        inland = a['at'][0] - polyline_x(coast, a['at'][1])
        if inland < 6:
            print(f"near the coast ({inland:.1f}): {a['label']}")
            bad += 1
        riv = dist_to_polyline(a['at'], river)
        if riv < 5:
            print(f"near the river ({riv:.1f}): {a['label']}")
            bad += 1
        if not (4 <= a['at'][0] <= d['size'][0] - 4 and 4 <= a['at'][1] <= d['size'][1] - 4):
            print(f"near the edge: {a['label']}")
            bad += 1
    count = {a: sum(1 for p in places if p['act'] == a and p['kind'] != 'home') for a in (1, 2, 3)}
    print('places per act', count, 'total', sum(count.values()), 'problems', bad)

    # --- zones ----------------------------------------------------------------------------------------------------
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    ux, uy = xs / k, ys / k  # in units
    wave = bands['wave']
    b3 = bands['winterToAutumn'] + wave * np.sin(ux / 9.0)
    b2 = bands['autumnToSummer'] + wave * np.sin(ux / 11.0 + 1.0)
    img = np.zeros((H, W, 3), np.float32)
    img[:] = SUMMER
    img[uy < b2] = AUTUMN
    img[uy < b3] = WINTER
    # mountains: northern range and a low ridge on the eastern edge
    top = 12 + 4 * np.sin(ux / 5.0) + 3 * np.sin(ux / 2.3)
    img[(uy < top) & (ux > 14)] = ROCK
    img[(ux > 94) & (uy < 70)] = ROCK
    # sea west of the coast
    cx = np.interp(uy, [p[1] for p in coast], [p[0] for p in coast])
    img[ux < cx] = SEA
    base = Image.fromarray(img.astype(np.uint8)).filter(ImageFilter.GaussianBlur(9))

    draw = ImageDraw.Draw(base)
    pts = [(x * k, y * k) for x, y in river]
    draw.line(pts, fill=RIVER, width=int(3.2 * k), joint='curve')
    try:
        font = ImageFont.truetype('arialbd.ttf', 26)
    except OSError:
        font = ImageFont.load_default()
    r = 3.4 * k
    for p in places:
        x, y = p['at'][0] * k, p['at'][1] * k
        draw.ellipse([x - r, y - r, x + r, y + r], fill=CLEAR, outline=(60, 60, 60), width=3)
        draw.text((x, y), p['label'], fill=(30, 30, 30), font=font, anchor='mm')
    base.save(OUT)
    print('written', OUT)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
