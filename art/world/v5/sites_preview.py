"""Preview: lay the site images onto their plateaus on the map, plus phone-zoom crops.

Usage: python art/world/v5/sites_preview.py <map.png> <sites.json> <out_dir>
sites.json: [{"file": "...", "x": centre, "bottom": front edge of plateau, "w": width}, ...] in 1254-map pixels.
"""

import json
import sys
from pathlib import Path

from PIL import Image

map_path, sites, out = sys.argv[1:4]
out = Path(out)
im = Image.open(map_path).convert("RGBA")
scale = im.width / 1254
for s in json.loads(Path(sites).read_text(encoding="utf8")):
    a = Image.open(s["file"]).convert("RGBA")
    a = a.crop(a.getbbox())
    w = round(s["w"] * scale)
    h = round(a.height * w / a.width)
    a = a.resize((w, h), Image.LANCZOS)
    im.alpha_composite(a, (round(s["x"] * scale - w / 2), round(s["bottom"] * scale - h)))
im = im.convert("RGB")
im.save(out / "with_sites.png")
im.resize((1254, 1254), Image.LANCZOS).save(out / "with_sites_small.png")
views = []
for cx, cy in ((600, 330), (700, 900)):
    w, h = 1092, 1478
    x, y = round(cx * scale - w / 2), round(cy * scale - h / 2)
    views.append(im.crop((x, y, x + w, y + h)))
sheet = Image.new("RGB", (2214, 1478), (30, 30, 30))
sheet.paste(views[0], (0, 0))
sheet.paste(views[1], (1122, 0))
sheet.save(out / "phones.png")
