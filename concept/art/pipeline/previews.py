"""Hollow Crown – Pixel-Pipeline-Beweis (A0), Teil 5: Vorschauen für Konzept und Styleguide.

python previews.py <pix_dir> <out_dir>

Erzeugt animierte GIFs (Idle, Laufen, Angriff), einen Teamfarben-Vergleich und kopiert die Sprite-Sheets.
"""
import os
import shutil
import sys

from PIL import Image

SCALE = 6
BG = (122, 150, 84, 255)  # Gras, damit Umriss und Teamtuch sichtbar sind


def frames(pix, sub, variant, anim, d, n):
    return [Image.open(os.path.join(pix, sub, "frames", f"{anim}_{d}_{i}.{variant}.png")) for i in range(n)]


def to_cells(imgs, cell=48):
    out = []
    for im in imgs:
        c = Image.new("RGBA", (cell, cell), BG)
        off = (cell - im.width) // 2
        c.alpha_composite(im, (off, off))
        out.append(c.resize((cell * SCALE, cell * SCALE), Image.NEAREST).convert("P", palette=Image.ADAPTIVE))
    return out


def gif(path, imgs, fps, pingpong=False):
    seq = imgs + imgs[-2:0:-1] if pingpong else imgs
    seq[0].save(path, save_all=True, append_images=seq[1:], duration=int(1000 / fps), loop=0, disposal=2)


def main(pix, out):
    os.makedirs(out, exist_ok=True)
    gif(os.path.join(out, "kael_idle.gif"), to_cells(frames(pix, "kael", "player", "idle", "s", 4)), 6, pingpong=True)
    for d in ("s", "e", "n"):
        gif(os.path.join(out, f"kael_walk_{d}.gif"), to_cells(frames(pix, "kael", "player", "walk", d, 4)), 8)
        gif(os.path.join(out, f"kael_attack_{d}.gif"), to_cells(frames(pix, "kael", "player", "attack", d, 6)), 10)
    gif(os.path.join(out, "bandit_attack_e.gif"), to_cells(frames(pix, "bandit", "enemy", "attack", "e", 6)), 10)
    # Teamfarben-Vergleich: Schlüssel (Magenta) → Spieler / Gegner / Dritte
    row = Image.new("RGBA", (4 * 40, 40), BG)
    for i, v in enumerate(("key", "player", "enemy", "other")):
        row.alpha_composite(Image.open(os.path.join(pix, "kael", "frames", f"idle_s_0.{v}.png")), (i * 40 + 4, 4))
    row.resize((row.width * SCALE, row.height * SCALE), Image.NEAREST).save(os.path.join(out, "kael_teams.png"))
    # Normal-Map neben Farbe
    pair = Image.new("RGBA", (80, 40), (40, 40, 48, 255))
    pair.alpha_composite(Image.open(os.path.join(pix, "kael", "frames", "idle_s_0.player.png")), (4, 4))
    pair.alpha_composite(Image.open(os.path.join(pix, "kael", "frames", "idle_s_0.normal.png")), (44, 4))
    pair.resize((pair.width * SCALE, pair.height * SCALE), Image.NEAREST).save(os.path.join(out, "kael_normal.png"))
    for sub in ("kael", "bandit", "prop_house", "prop_tree"):
        dst = os.path.join(out, "sheets", sub)
        os.makedirs(dst, exist_ok=True)
        for f in os.listdir(os.path.join(pix, sub)):
            if f.startswith("sheet."):
                shutil.copy(os.path.join(pix, sub, f), dst)
    shutil.copy(os.path.join(pix, "report.json"), out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
