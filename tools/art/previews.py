"""Hollow Crown – sprite previews (not loaded by the game).

python tools/art/previews.py contact <sprites_dir> <out.png> [scale]
    Contact sheet of all units in <sprites_dir>/units: per unit idle_s, walk_e, attack_e (hit frame),
    attack_s (hit frame) and walk_n in the player ramp (blue), then idle_s + attack_e in the enemy ramp (red).
python tools/art/previews.py gifs <sprites_dir>/units/<id> <out_dir> [scale] [team]
    Animated GIFs per row (team = player | enemy | other).
python tools/art/previews.py props <sprites_dir> <out.png> [scale]
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

KEY = [(64, 0, 64), (128, 0, 128), (192, 0, 192), (255, 0, 255)]
TEAM = {
    "player": [(0x16, 0x28, 0x5A), (0x2A, 0x52, 0xB0), (0x3D, 0x7B, 0xE0), (0x8F, 0xBA, 0xF5)],
    "enemy": [(0x4A, 0x10, 0x18), (0x9E, 0x2A, 0x2A), (0xD9, 0x41, 0x3A), (0xF5, 0x9A, 0x8A)],
    "other": [(0x12, 0x3A, 0x24), (0x2A, 0x7A, 0x3E), (0x3F, 0xA6, 0x5A), (0x9B, 0xE0, 0x8F)],
}
GRASS = (104, 136, 76, 255)
TILE = (116, 150, 86, 255)


def swap(img, team):
    a = np.array(img.convert("RGBA"))
    for k, t in zip(KEY, TEAM[team]):
        m = (a[..., 0] == k[0]) & (a[..., 1] == k[1]) & (a[..., 2] == k[2]) & (a[..., 3] > 0)
        a[m, :3] = t
    return Image.fromarray(a, "RGBA")


def load(sdir):
    meta = json.load(open(os.path.join(sdir, "sheet.json"), encoding="utf-8"))
    return meta, Image.open(os.path.join(sdir, "sheet.key.png")).convert("RGBA")


def cell(meta, sheet, row, frame):
    names = [r["name"] for r in meta["rows"]]
    cw, ch = meta["cell"]
    ri = names.index(row)
    return sheet.crop((frame * cw, ri * ch, frame * cw + cw, ri * ch + ch))


def on_tile(im, meta, ring=None):
    cw, ch = meta["cell"]
    ax, ay = meta["anchor"]
    bg = Image.new("RGBA", (cw, ch), GRASS)
    bg.paste(Image.new("RGBA", (48, 48), TILE), (ax - 24, ay - 42))
    if ring:
        d = ImageDraw.Draw(bg)
        d.ellipse((ax - 13, ay - 4, ax + 13, ay + 4), outline=ring, width=1)
    bg.alpha_composite(im)
    return bg


def contact(sprites, out, scale=3):
    udir = os.path.join(sprites, "units")
    ids = sorted(d for d in os.listdir(udir) if os.path.exists(os.path.join(udir, d, "sheet.json")))
    order = ["kael", "avatar", "brenna", "tobin", "mira", "liora", "varek", "brigand", "bandit_archer", "grosk", "hask", "morra",
             "mercenary", "archer", "fighter", "mage", "soldier"]
    ids = [i for i in order if i in ids] + [i for i in ids if i not in order]
    shots = [("player", "idle_s", 0), ("player", "walk_e", 1), ("player", "attack_e", 3), ("player", "attack_s", 3), ("player", "walk_n", 0),
             ("enemy", "idle_s", 0), ("enemy", "attack_e", 3)]
    cw = 72
    label_h = 10
    cols = 2
    blk_w = len(shots) * cw
    blk_h = cw + label_h
    rows = (len(ids) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * blk_w + (cols - 1) * 8, rows * blk_h), (40, 44, 52, 255))
    d = ImageDraw.Draw(sheet)
    for k, uid in enumerate(ids):
        meta, img = load(os.path.join(udir, uid))
        bx, by = (k % cols) * (blk_w + 8), (k // cols) * blk_h
        d.text((bx + 2, by), uid, fill=(232, 226, 214, 255))
        for j, (team, row, fr) in enumerate(shots):
            c = swap(cell(meta, img, row, fr), team)
            ring = TEAM[team][2] if row == "idle_s" else None
            sheet.alpha_composite(on_tile(c, meta, ring), (bx + j * cw, by + label_h))
    sheet = sheet.resize((sheet.width * scale, sheet.height * scale), Image.NEAREST)
    sheet.save(out, optimize=True)
    return out


def props(sprites, out, scale=3):
    pdir = os.path.join(sprites, "props")
    ids = sorted(d for d in os.listdir(pdir) if os.path.exists(os.path.join(pdir, d, "sheet.json")))
    tiles = []
    for pid in ids:
        meta, img = load(os.path.join(pdir, pid))
        cw, ch = meta["cell"]
        for ri, r in enumerate(meta["rows"]):
            c = swap(img.crop((0, ri * ch, cw, ri * ch + ch)), "player")
            bg = Image.new("RGBA", (96, 106), (40, 44, 52, 255))
            t = on_tile(c, meta)
            bg.paste(t, ((96 - cw) // 2, 10 + (96 - ch)))
            ImageDraw.Draw(bg).text((2, 0), f"{pid}:{r['name']}", fill=(232, 226, 214, 255))
            tiles.append(bg)
    cols = 6
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * 96, rows * 106), (40, 44, 52, 255))
    for k, t in enumerate(tiles):
        sheet.paste(t, ((k % cols) * 96, (k // cols) * 106))
    sheet.resize((sheet.width * scale, sheet.height * scale), Image.NEAREST).save(out, optimize=True)


def gifs(udir, out, scale=5, team="player"):
    meta, img = load(udir)
    uid = os.path.basename(os.path.normpath(udir))
    os.makedirs(out, exist_ok=True)
    for r in meta["rows"]:
        frames = [on_tile(swap(cell(meta, img, r["name"], i), team), meta) for i in range(r["frames"])]
        if r.get("loop") == "pingpong" and len(frames) > 2:
            frames = frames + frames[-2:0:-1]
        frames = [f.resize((f.width * scale, f.height * scale), Image.NEAREST).convert("P", palette=Image.ADAPTIVE) for f in frames]
        dur = int(1000 / max(1, r["fps"]))
        if r.get("loop") == "once":
            dur_list = [dur] * (len(frames) - 1) + [600]
        else:
            dur_list = [dur] * len(frames)
        frames[0].save(os.path.join(out, f"{uid}_{r['name']}.gif"), save_all=True, append_images=frames[1:], duration=dur_list, loop=0, disposal=2)


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "contact":
        contact(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 3)
    elif cmd == "props":
        props(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 3)
    elif cmd == "gifs":
        gifs(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 5, sys.argv[5] if len(sys.argv) > 5 else "player")
