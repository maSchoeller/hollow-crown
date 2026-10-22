"""Hollow Crown – Pixel-Pipeline-Beweis (A0), Teil 3: Renders → Pixel-Sprites.

python pixelize.py <raw_dir> <out_dir>

Für jeden Frame (4-fach gerendert, *_c.png + *_n.png):
1. Farben auf Hollow-64 abbilden (OKLab), Magenta = Teamtuch-Schlüssel (3 Helligkeitsstufen)
2. 4×4-Blöcke per Mehrheit verkleinern (Alpha und Farbe), Normalen mitteln
3. Farbige Außenlinie (abgedunkelte Nachbarfarbe, Teamtuch → dunkelste Teamstufe)
4. Ausgabe: Schlüssel-Version + Varianten player/enemy/other + Normal-Map, Sprite-Sheets
Siehe concept/16-asset-pipeline.md §4.3.
"""
import json
import os
import sys
from collections import Counter

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PALETTE_FILE = os.path.join(HERE, "..", "palette", "hollow-64.hex")
SS = 4
BASE_COUNT = 52  # 0..51 frei nutzbar, 52..63 = Team-Rampen (je 4: dunkel → hell)
TEAM_START = {"player": 52, "enemy": 56, "other": 60}
TEAM_KEY = 100   # interne Indizes 100..103 = Teamtuch-Stufen 0..3
KEY_RGB = [(64, 0, 64), (128, 0, 128), (192, 0, 192), (255, 0, 255)]


def load_palette():
    with open(PALETTE_FILE, encoding="utf-8") as f:
        hexes = [l.strip() for l in f if l.strip()]
    return np.array([[int(h[i:i + 2], 16) for i in (0, 2, 4)] for h in hexes], dtype=np.uint8)


def srgb_to_oklab(rgb):
    c = rgb.astype(np.float64) / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929],
                   [0.2119034982, 0.6806995451, 0.1073969566],
                   [0.0883024619, 0.2817188376, 0.6299787005]])
    lms = np.cbrt(c @ m1.T)
    m2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468],
                   [1.9779984951, -2.4285922050, 0.4505937099],
                   [0.0259040371, 0.7827717662, -0.8086757660]])
    return lms @ m2.T


PAL = load_palette()
PAL_LAB = srgb_to_oklab(PAL)
BASE_LAB = PAL_LAB[:BASE_COUNT]


def nearest_base(lab):
    d = ((lab[..., None, :] - BASE_LAB[None, ...]) ** 2).sum(-1)
    return d.argmin(-1)


def classify(rgba):
    """Index-Bild in voller Auflösung: -1 transparent, 0..51 Palette, 100..103 Teamtuch."""
    rgb = rgba[..., :3].astype(np.int32)
    alpha = rgba[..., 3] > 127
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # Magenta: Rot und Blau etwa gleich, Grün deutlich darunter (Haare/Leder haben b < g und fallen raus)
    team = alpha & (r > 50) & (np.abs(r - b) < 40) & (r - g > 45) & (b - g > 45)
    idx = np.full(alpha.shape, -1, dtype=np.int32)
    base = alpha & ~team
    if base.any():
        idx[base] = nearest_base(srgb_to_oklab(rgba[..., :3][base]))
    # Toon-Stufen 1.0 / 0.78 / 0.5 → Teamstufen 2 (Mitte, Kernfarbe) / 1 / 0; Stufe 3 bleibt Glanzlicht-Reserve
    lvl = np.where(r > 225, 2, np.where(r > 165, 1, 0))
    idx[team] = TEAM_KEY + lvl[team]
    return idx


def downsample(idx, normal):
    h, w = idx.shape[0] // SS, idx.shape[1] // SS
    out = np.full((h, w), -1, dtype=np.int32)
    nout = np.zeros((h, w, 3), dtype=np.float64)
    nrm = normal[..., :3].astype(np.float64) / 255.0 * 2 - 1
    for y in range(h):
        for x in range(w):
            blk = idx[y * SS:(y + 1) * SS, x * SS:(x + 1) * SS].ravel()
            opaque = blk[blk >= 0]
            if len(opaque) * 2 >= SS * SS:
                out[y, x] = Counter(opaque.tolist()).most_common(1)[0][0]
                nb = nrm[y * SS:(y + 1) * SS, x * SS:(x + 1) * SS].reshape(-1, 3)[blk >= 0].mean(0)
                nout[y, x] = nb / (np.linalg.norm(nb) + 1e-9)
    return out, nout


DARKEN_CACHE = {}


def darker(i):
    if i >= TEAM_KEY:
        return TEAM_KEY
    if i not in DARKEN_CACHE:
        lab = PAL_LAB[i].copy()
        lab[0] *= 0.55
        lab[1:] *= 0.85
        cand = nearest_base(lab[None, :])[0]
        DARKEN_CACHE[i] = int(cand)
    return DARKEN_CACHE[i]


def outline(idx, nout):
    h, w = idx.shape
    res = idx.copy()
    for y in range(h):
        for x in range(w):
            if idx[y, x] >= 0:
                continue
            neigh = [idx[yy, xx] for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1))
                     if 0 <= yy < h and 0 <= xx < w and idx[yy, xx] >= 0]
            if neigh:
                # dunkelste Nachbarfarbe als Basis, damit die Linie die Form „umschließt“
                pick = min(neigh, key=lambda i: PAL_LAB[i, 0] if i < TEAM_KEY else 0.2)
                res[y, x] = darker(int(pick))
                nout[y, x] = (0, 0, 1)
    return res


def to_image(idx, team):
    h, w = idx.shape
    img = np.zeros((h, w, 4), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            i = idx[y, x]
            if i < 0:
                continue
            if i >= TEAM_KEY:
                lvl = i - TEAM_KEY
                img[y, x, :3] = KEY_RGB[lvl] if team == "key" else PAL[TEAM_START[team] + lvl]
            else:
                img[y, x, :3] = PAL[i]
            img[y, x, 3] = 255
    return Image.fromarray(img, "RGBA")


def normal_image(idx, nout):
    n = ((nout + 1) / 2 * 255).clip(0, 255).astype(np.uint8)
    a = np.where(idx >= 0, 255, 0).astype(np.uint8)
    return Image.fromarray(np.dstack([n, a]), "RGBA")


def process_frame(cpath, npath):
    c = np.array(Image.open(cpath).convert("RGBA"))
    n = np.array(Image.open(npath).convert("RGBA"))
    idx, nout = downsample(classify(c), n)
    idx = outline(idx, nout)
    return idx, nout


def main(raw, out):
    report = {}
    for subject in sorted(os.listdir(raw)):
        sdir = os.path.join(raw, subject)
        frames = sorted({f[:-6] for f in os.listdir(sdir) if f.endswith("_c.png")})
        odir = os.path.join(out, subject)
        os.makedirs(os.path.join(odir, "frames"), exist_ok=True)
        colors = set()
        meta = {}
        for fr in frames:
            idx, nout = process_frame(os.path.join(sdir, fr + "_c.png"), os.path.join(sdir, fr + "_n.png"))
            colors |= {int(i) for i in np.unique(idx) if 0 <= i < TEAM_KEY}
            for team in ("key", "player", "enemy", "other"):
                to_image(idx, team).save(os.path.join(odir, "frames", f"{fr}.{team}.png"))
            normal_image(idx, nout).save(os.path.join(odir, "frames", f"{fr}.normal.png"))
            meta[fr] = list(idx.shape)
        build_sheets(odir, meta)
        report[subject] = {"frames": len(frames), "paletteColors": len(colors)}
    with open(os.path.join(out, "report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))


def build_sheets(odir, meta):
    """Ein Sheet pro Variante: Zeile = Animation+Richtung, Spalte = Frame, Zellen 48×48 (32er zentriert, Fußpunkt gleich)."""
    rows = {}
    for fr in meta:
        anim, d, i = fr.rsplit("_", 2)
        rows.setdefault(f"{anim}_{d}", []).append((int(i), fr))
    order = sorted(rows, key=lambda k: (["idle", "walk", "attack", "hit", "downed", "static"].index(k.rsplit("_", 1)[0]), k))
    cols = max(len(v) for v in rows.values())
    for variant in ("key", "player", "enemy", "other", "normal"):
        sheet = Image.new("RGBA", (cols * 48, len(order) * 48), (0, 0, 0, 0))
        for r, key in enumerate(order):
            for i, fr in sorted(rows[key]):
                im = Image.open(os.path.join(odir, "frames", f"{fr}.{variant}.png"))
                off = (48 - im.width) // 2
                sheet.paste(im, (i * 48 + off, r * 48 + off))
        sheet.save(os.path.join(odir, f"sheet.{variant}.png"))
    with open(os.path.join(odir, "sheet.json"), "w", encoding="utf-8") as f:
        json.dump({"cell": [48, 48], "rows": order, "anchor32": [16, 28], "anchor48": [24, 36]}, f, indent=2)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
