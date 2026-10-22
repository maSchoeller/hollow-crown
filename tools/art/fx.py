#!/usr/bin/env python3
"""Hollow Crown - effect sprite sheet generator.

    python tools/art/fx.py          # writes art/fx/fx.png + fx.json (+ fx_preview.png, 3x on dark)

One row per animation, 48x48 cells, frames left to right. Particles are pixel-snapped squares
(1-2 px) in Hollow-64 colours with hard alpha; only glows (flame base, heal, level-up, light) use
soft alpha. Deterministic (fixed seeds). Effects stay short (<= 600 ms at 1x, see
concept/15-art-direction.md section 8). Directional effects (fire_bolt, arrow) point east; the
renderer rotates/mirrors them.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tiles import C, ROOT, rng  # noqa: E402  (palette + helpers shared with the tileset)

OUT = ROOT / "art" / "fx"
T = 48
YY, XX = np.mgrid[0:T, 0:T]


# ---------------------------------------------------------------------------------------------
class Cell:
    def __init__(self):
        self.a = np.zeros((T, T, 4), np.uint8)

    def px(self, x, y, col, a=255):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < T and 0 <= y < T:
            self.a[y, x] = (*C(col), a)

    def sq(self, x, y, s, col, a=255):
        x, y = int(round(x)), int(round(y))
        for j in range(s):
            for i in range(s):
                self.px(x + i, y + j, col, a)

    def fill(self, mask, col, a=255):
        self.a[mask] = (*C(col), a)

    def glow(self, cx, cy, rx, ry, col, amax):
        """Soft additive-looking glow, only where nothing opaque is drawn yet."""
        d = np.sqrt(((XX - cx) / rx) ** 2 + ((YY - cy) / ry) ** 2)
        al = (np.clip(1 - d, 0, 1) ** 2 * amax).astype(int)
        sel = (al > 0) & (self.a[..., 3] < 255)
        cur = self.a[..., 3].astype(int)
        newa = np.maximum(cur, al)
        self.a[sel, :3] = C(col)
        self.a[sel, 3] = newa[sel]

    def line(self, x0, y0, x1, y1, col, a=255):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for k in range(n):
            t = k / max(n - 1, 1)
            self.px(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, col, a)

    def outline(self, col):
        op = self.a[..., 3] == 255
        o = (np.roll(op, 1, 0) | np.roll(op, -1, 0) | np.roll(op, 1, 1) | np.roll(op, -1, 1)) & ~op
        self.a[o] = (*C(col), 255)


def ring(cx, cy, r, w=1.0):
    d = np.hypot(XX - cx, YY - cy)
    return np.abs(d - r) <= w / 2 + 0.25


def ering(cx, cy, rx, ry):
    """1px elliptic ring (flat ground ring)."""
    d = np.hypot((XX - cx) / rx, (YY - cy) / ry)
    inner = np.hypot((XX - cx) / max(rx - 1.2, 0.5), (YY - cy) / max(ry - 1.2, 0.5))
    return (d <= 1.0) & (inner > 1.0)


def disc(cx, cy, r):
    return np.hypot(XX - cx, YY - cy) <= r


def star(cx, cy, r_out, r_in, points=8, rot=0.0):
    ang = np.arctan2(YY - cy, XX - cx) - rot
    d = np.hypot(XX - cx, YY - cy)
    k = (np.cos(ang * points / 2) ** 2)              # 1 at the spikes
    lim = r_in + (r_out - r_in) * k ** 6
    return d <= lim


# ---------------------------------------------------------------------------------------------
# animations
# ---------------------------------------------------------------------------------------------
def flame(n=6):
    """Tile-sized burning field: a low fire bed plus 6 tongues breathing out of phase; loops."""
    tongues = [(6, 20, 6.5, 0.0), (14, 30, 8.0, 1.7), (23, 25, 7.5, 3.1), (31, 34, 8.0, 4.4), (40, 22, 7.0, 2.2),
               (19, 16, 5.0, 5.3)]
    frames = []
    for t in range(n):
        c = Cell()
        ph = 2 * math.pi * t / n
        c.glow(24, 41, 27, 11, "e8743b", 140)
        base = 46
        inten = np.zeros((T, T))
        # fire bed with a wavy top
        bed = 7 + 2.2 * np.sin(XX * 0.45 + ph) + 1.2 * np.sin(XX * 0.9 - 2 * ph)
        ub = (base - YY) / bed
        bottom = 44 + (np.sin(XX * 0.7 + ph) > -0.2) + (np.abs(XX - 23.5) < 17)
        inten = np.where((ub >= 0) & (ub <= 1) & (YY <= bottom) & (np.abs(XX - 23.5) <= 21.5 - (YY > 43) * 2),
                         1.05 - 0.6 * ub, 0)
        for x0, H, W, p in tongues:
            h = H * (0.8 + 0.2 * math.sin(ph + p))
            u = (base - YY) / h
            ok = (u >= 0) & (u <= 1)
            xc = x0 + 1.8 * np.sin(ph + p + u * 4.0) * u
            w = W * np.power(np.clip(1 - u, 0, 1), 0.9) * np.minimum(1, 0.5 + u * 3)
            v = np.where(ok & (w > 0.3), 1 - np.abs(XX - xc) / np.maximum(w, 0.3), 0)
            inten = np.maximum(inten, np.where(v > 0, v * (1.25 - 0.6 * u), 0))
            ly = base - h - 3 - ((t + int(p * 2)) % 3) * 3       # detached licks
            lx = x0 + (1 if (t + int(p)) % 2 else -1)
            if ((t + int(p * 3)) % 3) != 2:
                c.sq(lx, ly, 2, "e8743b")
                c.px(lx, ly - 1, "c2451e")
        c.fill((inten > 0) & (inten <= 0.22), "6b1d1d")
        c.fill((inten > 0.22) & (inten <= 0.45), "c2451e")
        c.fill((inten > 0.45) & (inten <= 0.72), "e8743b")
        c.fill(inten > 0.72, "ffc06b")
        c.fill((inten > 0.95) & (YY > 34), "f5e08f")
        r = rng(900 + t)
        for k in range(5):                                  # sparks
            sx = int(r.integers(4, 44))
            sy = int(4 + (k * 7 + t * 5) % 20)
            c.px(sx, sy, "ffc06b" if k % 2 else "e8743b")
        frames.append(c.a)
    return frames


def embers(n=4):
    """Glowing cinders drifting up from the ground (burning status / ash); loops."""
    r = rng(911)
    pts = [(int(r.integers(6, 42)), int(r.integers(8, 46)), int(r.integers(0, 4)), k % 3 == 0) for k in range(13)]
    frames = []
    for t in range(n):
        c = Cell()
        c.glow(24, 44, 18, 4, "c2451e", 80)
        for i, (x, y, ph, big) in enumerate(pts):
            yy = 6 + (y - 6 - t * 8) % 40
            xx = x + int(round(1.5 * math.sin((t + ph) * 1.6)))
            st = (t + ph) % 4
            col = ["ffc06b", "e8743b", "c2451e", "e8743b"][st]
            if big and st < 2:
                c.glow(xx + 0.5, yy + 0.5, 3.5, 3.5, "e8743b", 90)
                c.sq(xx, yy, 2, col)
                c.px(xx, yy, "f5e08f" if st == 0 else col)
            else:
                c.px(xx, yy, col)
                if st == 0:
                    c.px(xx, yy + 1, "c2451e")
        frames.append(c.a)
    return frames


def hit_spark(n=4):
    frames = []
    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1), (0.7, 0.7), (-0.7, -0.7), (0.7, -0.7), (-0.7, 0.7)]
    for t in range(n):
        c = Cell()
        if t == 0:
            c.fill(star(24, 24, 7, 1.5, 4), "e8e2d6")
            c.fill(disc(24, 24, 1.5), "f5e08f")
        else:
            for k, (dx, dy) in enumerate(dirs):
                if k >= 6 and t == 3:
                    continue
                r0, r1 = 3 + t * 4, 5 + t * 5 - (2 if k >= 4 else 0)
                col = "e8e2d6" if t == 1 else ("ffc06b" if t == 2 else "e8743b")
                c.line(24 + dx * r0, 24 + dy * r0, 24 + dx * r1, 24 + dy * r1, col)
                if t == 3:
                    c.px(24 + dx * (r1 + 2), 24 + dy * (r1 + 2), "c2451e")
            if t == 1:
                c.fill(disc(24, 24, 2), "f5e08f")
        frames.append(c.a)
    return frames


def hit_star_crit(n=5):
    frames = []
    for t in range(n):
        c = Cell()
        rot = t * 0.12
        if t < 3:
            ro = [9, 18, 21][t]
            c.fill(star(24, 24, ro + 2, ro * 0.32 + 1, 8, rot), "e8743b")
            c.fill(star(24, 24, ro, ro * 0.3, 8, rot), "ffc06b")
            c.fill(star(24, 24, ro * 0.75, ro * 0.22, 8, rot), "f2d98c")
            c.fill(disc(24, 24, ro * 0.22 + 1), "e8e2d6")
            if t >= 1:
                c.fill(ring(24, 24, ro + 4, 1), "f5e08f" if t == 1 else "ffc06b")
        else:
            c.fill(ring(24, 24, 21 + (t - 3) * 2, 1) & ((np.arctan2(YY - 24, XX - 24) * 4).astype(int) % 2 == 0),
                   "e8743b" if t == 3 else "c2451e")
            for k in range(8):
                a = k * math.pi / 4 + 0.4
                r = 12 + (t - 3) * 5
                c.sq(24 + math.cos(a) * r, 24 + math.sin(a) * r, 2 if t == 3 else 1, "ffc06b" if t == 3 else "e8743b")
            if t == 3:
                c.fill(star(24, 24, 7, 2, 4, 0.3), "f2d98c")
        frames.append(c.a)
    return frames


def heal(n=6):
    """Green rising sparkles with a soft glow; loops."""
    parts = [(14, 0, 1), (22, 2, 0), (30, 4, 1), (18, 3, 0), (34, 1, 0), (26, 5, 1), (10, 2, 0), (38, 4, 1),
             (24, 1, 0), (16, 5, 0), (32, 3, 1)]
    frames = []
    for t in range(n):
        c = Cell()
        pulse = 0.8 + 0.2 * math.sin(2 * math.pi * t / n)
        c.glow(24, 38, 20, 8, "8bbb4a", int(170 * pulse))
        c.glow(24, 26, 12, 20, "c9e07a", int(90 * pulse))
        c.fill(ering(24, 40, 13 + (t % 3), 4 + (t % 3) * 0.4) & ((XX + t) % 3 != 0), "c9e07a")
        for i, (x, ph, plus) in enumerate(parts):
            age = (t + ph) % n
            y = 42 - age * 6 - (i % 2) * 2
            xx = x + int(round(math.sin(age * 1.3 + i)))
            col = "e8e2d6" if age < 2 else ("c9e07a" if age < 4 else "8bbb4a")
            if plus and age < 5:
                arm = "c9e07a" if age < 3 else "4f8a3a"
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    c.px(xx + dx, y + dy, arm)
                if age < 2:
                    for dx, dy in ((2, 0), (-2, 0), (0, 2), (0, -2)):
                        c.px(xx + dx, y + dy, "8bbb4a")
                c.px(xx, y, col)
            else:
                c.sq(xx, y, 2 if age < 3 else 1, col)
        frames.append(c.a)
    return frames


def smoke(n=6):
    """Cloudy puffs rising and growing (chimneys, burnt fields); loops."""
    frames = []
    lobes = [(0, 0, 1.0), (-0.8, 0.35, 0.7), (0.8, 0.3, 0.75), (0.2, -0.6, 0.6)]
    for t in range(n):
        c = Cell()
        puffs = []
        for k in range(3):
            age = (t + 2 * k) % n
            x = 24 + (k - 1) * 3 + age * (0.9 if k % 2 else -0.6)
            y = 42 - age * 6.2
            r = 3.2 + age * 0.85
            puffs.append((age, x, y, r, k))
        for age, x, y, r, k in sorted(puffs, key=lambda p: -p[0]):
            body = np.zeros((T, T), bool)
            lit = np.zeros((T, T), bool)
            for lx, ly, lr in lobes:
                cx, cy, rr = x + lx * r, y + ly * r, lr * r
                body |= disc(cx, cy, rr)
                lit |= disc(cx - rr * 0.35, cy - rr * 0.35, rr * 0.8)
            if age == 5:                                    # dissolving: random 2px holes, frayed edge
                holes = rng(920 + k).random((T // 2, T // 2)).repeat(2, 0).repeat(2, 1) < 0.4
                body &= ~holes | disc(x, y, r * 0.45)
            dark, mid, light = (("2e2a3b", "4a4656", "6e6a78") if age < 2 else
                                ("4a4656", "6e6a78", "a39fa6") if age < 4 else ("6e6a78", "a39fa6", "e8e2d6"))
            c.fill(body, dark)
            c.fill(body & lit, mid)
            hl = np.zeros((T, T), bool)
            for lx, ly, lr in lobes[:2]:
                hl |= disc(x + lx * r - lr * r * 0.45, y + ly * r - lr * r * 0.45, lr * r * 0.35)
            c.fill(body & hl, light)
        frames.append(c.a)
    return frames


def levelup(n=6):
    frames = []
    widths = [2, 5, 8, 9, 7, 3]
    for t in range(n):
        c = Cell()
        w = widths[t]
        top = max(0, 40 - t * 14)
        c.glow(24, 40, 16, 6, "ffc06b", 140 if t < 5 else 60)
        c.glow(24, 24, w + 4, 30, "f2d98c", 120 if t < 5 else 50)
        core = (np.abs(XX - 23.5) <= w / 2) & (YY >= top) & (YY <= 42)
        c.fill(core, "f2d98c")
        c.fill(core & (np.abs(XX - 23.5) <= max(0.5, w / 2 - 2)), "f5e08f")
        c.fill(core & (np.abs(XX - 23.5) <= max(0.5, w / 2 - 3.5)), "e8e2d6")
        c.fill(ering(24, 42, 7 + t * 2.5, 2.5 + t * 0.6) & ~core, "ffc06b")
        for k in range(6):                                  # rising diamonds
            age = (t + k) % n
            x = [12, 36, 16, 32, 9, 39][k]
            y = 44 - age * 7
            if y < top + 2 and t < 2:
                continue
            col = "e8e2d6" if age % 2 else "f2d98c"
            c.px(x, y - 1, col)
            c.px(x - 1, y, col)
            c.px(x + 1, y, col)
            c.px(x, y + 1, col)
            c.px(x, y, "ffc06b")
        frames.append(c.a)
    return frames


def fire_bolt(n=4):
    frames = []
    for t in range(n):
        c = Cell()
        hx, hy = 32, 24
        c.glow(hx, hy, 12, 9, "e8743b", 110)
        r = rng(950 + t)
        for k in range(7):                                  # trail blobs
            x = hx - 6 - k * 3.2 - (t % 2)
            y = hy + int(round(1.6 * math.sin(k * 1.3 + t * 1.7)))
            s = 3 if k < 2 else (2 if k < 5 else 1)
            c.sq(x - s / 2, y - s / 2, s, ["ffc06b", "e8743b", "e8743b", "c2451e", "c2451e", "6b1d1d", "6b1d1d"][k])
        body = disc(hx, hy, 5.2) | ((XX < hx) & (XX > hx - 10) & (np.abs(YY - hy) < (XX - (hx - 10)) * 0.5))
        c.fill(body, "c2451e")
        c.fill(disc(hx + 0.5, hy, 4), "e8743b")
        c.fill(disc(hx + 1, hy - 0.5, 2.5), "ffc06b")
        c.fill(disc(hx + 1.5, hy - 1, 1.2), "f5e08f")
        for k in range(3):
            c.px(hx - 4 - int(r.integers(0, 16)), hy + int(r.integers(-6, 7)), "ffc06b")
        frames.append(c.a)
    return frames


def wind_slash(n=4):
    frames = []
    for t in range(n):
        c = Cell()
        for k, (cx, cy, r, a0) in enumerate([(18, 30, 16, -0.2), (28, 20, 13, 0.2)]):
            if k == 1 and t == 0:
                continue
            ang = np.arctan2(YY - cy, XX - cx)
            d = np.hypot(XX - cx, YY - cy)
            span = [0.9, 1.9, 2.4, 2.4][t]
            start = -math.pi * 0.75 + a0 + (0.4 if t == 3 else 0)
            a = (ang - start) % (2 * math.pi)
            arc = (a <= span)
            thick = np.where(arc, 2.2 * np.sin(np.clip(a / span, 0, 1) * math.pi), 0)
            band = arc & (np.abs(d - r) <= thick * (0.5 if t == 3 else 1))
            c.fill(band, "8bbb4a" if t == 3 else "c9e07a")
            c.fill(band & (np.abs(d - r) <= thick * 0.35), "e8e2d6" if t < 3 else "c9e07a")
        if t >= 1:                                          # leaves
            for k, (x, y) in enumerate([(36, 30), (12, 16), (40, 14)][:t]):
                xx, yy = x + t * 2, y - t
                c.px(xx, yy, "4f8a3a")
                c.px(xx + 1, yy, "8bbb4a")
                c.px(xx + 1, yy - 1, "8bbb4a")
        frames.append(c.a)
    return frames


def water_burst(n=4):
    frames = []
    for t in range(n):
        c = Cell()
        if t == 0:
            c.fill(disc(24, 24, 8), "2f5f9e")
            c.fill(disc(23, 23, 6.5), "4aa8e8")
            c.fill(disc(21, 21, 2.5), "a8e4f5")
            c.px(20, 20, "e8e2d6")
            c.outline("1d2a5a")
        elif t == 1:
            blob = disc(24, 24, 11) & ~((np.abs(np.arctan2(YY - 24, XX - 24) * 6 % (2 * math.pi) - 3) < 0.5)
                                        & ~disc(24, 24, 7))
            c.fill(blob, "4aa8e8")
            c.fill(disc(24, 24, 6), "a8e4f5")
            c.fill(ring(24, 24, 10, 1), "2f5f9e")
            c.fill(disc(24, 24, 3), "e8e2d6")
        else:
            r = 10 + (t - 1) * 7
            for k in range(10):
                a = k * 2 * math.pi / 10 + 0.3
                rr = r * (0.75 + 0.25 * ((k * 7) % 3))
                x, y = 24 + math.cos(a) * rr, 24 + math.sin(a) * rr + (t - 2) * 3
                c.sq(x, y, 2 if t == 2 else 1, "a8e4f5" if k % 2 else "4aa8e8")
                if t == 2:
                    c.px(x - math.cos(a) * 2, y - math.sin(a) * 2, "2f5f9e")
            if t == 2:
                c.fill(ring(24, 24, 9, 1) & ((XX + YY) % 2 == 0), "a8e4f5")
        frames.append(c.a)
    return frames


def earth_spikes(n=4):
    frames = []
    spikes = [(14, 8, 20), (24, 10, 30), (34, 8, 22), (19, 6, 13), (30, 6, 14)]
    for t in range(n):
        c = Cell()
        grow = [0.0, 0.45, 1.0, 1.0][t]
        c.fill(disc(24, 43, 0) | ((np.hypot((XX - 24) / 20, (YY - 43) / 4) <= 1)), "3b2420", 120)
        if t == 0:
            for x0, x1 in [(10, 20), (22, 34), (28, 40)]:
                c.line(x0, 43, x1, 41 + (x0 % 3), "2d1e1a")
        for k, (x, w, h) in enumerate(sorted(spikes, key=lambda s: s[2])):
            hh = h * grow
            if hh < 1:
                continue
            base = 44
            u = (base - YY) / hh
            half = (w / 2) * (1 - u)
            body = (u >= 0) & (u <= 1) & (np.abs(XX - x) <= half)
            c.fill(body, "6a4130")
            c.fill(body & (XX <= x), "9a6a45")
            c.fill(body & (XX <= x - half * 0.45) & (u < 0.85), "c79a68")
            c.fill(body & (np.abs(XX - x) < 0.6) & (u > 0.8), "f2d98c")
            c.fill(body & ((XX - x) > half * 0.55), "3b2420")
        if t >= 2:                                          # dust + debris
            for k, (x, y) in enumerate([(8, 38), (40, 37), (12, 30), (37, 28), (24, 6)]):
                dy = (t - 2) * 3
                c.sq(x + (k % 2) * (t - 2) * 2, y + dy - 6 * (t - 2) * (k == 4), 2 if t == 2 else 1,
                     "a8916a" if k % 2 else "9a6a45")
            c.glow(24, 42, 22, 5, "a8916a", 90 if t == 2 else 50)
        frames.append(c.a)
    for f in frames:
        cc = Cell()
        cc.a = f
        op = f[..., 3] == 255
        o = (np.roll(op, 1, 0) | np.roll(op, -1, 0) | np.roll(op, 1, 1) | np.roll(op, -1, 1)) & ~op & (YY < 44)
        f[o] = (*C("2d1e1a"), 255)
    return frames


def light_pillar(n=5):
    frames = []
    for t in range(n):
        c = Cell()
        w = [1, 4, 9, 7, 3][t]
        bottom = [24, 44, 44, 44, 44][t]
        c.glow(24, 22, w + 5, 34, "f2d98c", [40, 100, 150, 110, 50][t])
        if t >= 1:
            c.glow(24, 44, 14, 4, "ffc06b", 120)
        core = (np.abs(XX - 23.5) <= w / 2) & (YY <= bottom)
        c.fill(core, "f2d98c")
        c.fill(core & (np.abs(XX - 23.5) <= max(0.5, w / 2 - 1.5)), "f5e08f")
        c.fill(core & (np.abs(XX - 23.5) <= max(0.5, w / 2 - 3)), "e8e2d6")
        if t >= 2:
            for k in range(6):
                a = k * math.pi / 3 + t * 0.5
                r = 8 + (t - 2) * 5
                x, y = 24 + math.cos(a) * r, 30 + math.sin(a) * r * 0.6 - (t - 2) * 4
                for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
                    c.px(x + dx, y + dy, "f2d98c")
                c.px(x, y, "e8e2d6")
        if t >= 1:
            c.fill(ering(24, 44, 6 + t * 3, 2 + t * 0.6) & ~core, "f2d98c")
        frames.append(c.a)
    return frames


def dark_tendrils(n=4):
    frames = []
    roots = [(12, 0.0, 26), (22, 1.3, 34), (31, 2.4, 30), (39, 0.7, 22)]
    for t in range(n):
        c = Cell()
        c.glow(24, 42, 20, 6, "2b1a4a", 150)
        grow = [0.35, 0.75, 1.0, 0.9][t]
        for x0, p, h in roots:
            L = h * grow
            steps = int(L)
            for s in range(steps):
                u = s / max(h, 1)
                x = x0 + 3.5 * math.sin(p + u * 7 + t * 0.6) * u
                y = 44 - s
                w = 2 if u < 0.5 else 1
                col = "2b1a4a" if s < 4 else ("5a3a8e" if s < steps - 3 else "8e5bd9")
                c.sq(x - w / 2, y, w, col)
            # curl tip
            tx = x0 + 3.5 * math.sin(p + (steps / max(h, 1)) * 7 + t * 0.6) * (steps / max(h, 1))
            c.px(tx + 1, 44 - steps, "8e5bd9")
            c.px(tx + 2, 44 - steps + 1, "5a3a8e")
        for k in range(4):                                  # motes
            y = 40 - ((t * 6 + k * 9) % 34)
            c.px(10 + k * 9, y, "8e5bd9" if k % 2 else "5a3a8e")
        frames.append(c.a)
    return frames


def arrow(n=1):
    c = Cell()
    c.line(10, 24, 36, 24, "9a6a45")
    c.line(11, 25, 36, 25, "4f3426")
    c.line(12, 24, 34, 24, "c79a68")
    for i in range(6):                                      # head
        c.line(36 + i, 24 - (3 - i // 2) + 1, 36 + i, 24 + (3 - i // 2), "a39fa6")
    c.line(36, 22, 40, 24, "e8e2d6")
    for i, x in enumerate(range(8, 14)):                    # fletching
        c.px(x, 22 + i // 3, "e8e2d6")
        c.px(x, 27 - i // 3, "c2451e")
        c.px(x, 23 + i // 3, "e8e2d6" if i < 4 else "c2451e")
    c.outline("2e2a3b")
    return [c.a]


def downed_pulse(n=4):
    frames = []
    heart = [".aa.aa.", "abbabba", "abbbbba", ".abbba.", "..aba..", "...a..."]
    for t in range(n):
        c = Cell()
        r = 5 + t * 3
        c.fill(ring(24, 24, r, 1) & ((t < 3) | ((XX + YY) % 2 == 0)), "a39fa6" if t < 2 else "6e6a78")
        for j, row in enumerate(heart):
            for i, ch in enumerate(row):
                if ch != ".":
                    c.px(21 + i, 21 + j, "6e6a78" if ch == "a" else ("e8e2d6" if t == 0 else "a39fa6"))
        frames.append(c.a)
    return frames


ANIMS = [  # name, generator, frames, fps, loop
    ("flame", flame, 6, 12, "loop"),
    ("embers", embers, 4, 8, "loop"),
    ("hit_spark", hit_spark, 4, 15, "once"),
    ("hit_star_crit", hit_star_crit, 5, 12, "once"),
    ("heal", heal, 6, 10, "loop"),
    ("smoke", smoke, 6, 8, "loop"),
    ("levelup", levelup, 6, 10, "once"),
    ("fire_bolt", fire_bolt, 4, 12, "loop"),
    ("wind_slash", wind_slash, 4, 12, "once"),
    ("water_burst", water_burst, 4, 12, "once"),
    ("earth_spikes", earth_spikes, 4, 12, "once"),
    ("light_pillar", light_pillar, 5, 10, "once"),
    ("dark_tendrils", dark_tendrils, 4, 10, "loop"),
    ("arrow", arrow, 1, 1, "once"),
    ("downed_pulse", downed_pulse, 4, 6, "loop"),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    cols = max(a[2] for a in ANIMS)
    sheet = np.zeros((len(ANIMS) * T, cols * T, 4), np.uint8)
    meta = {"cell": [T, T], "anims": {}}
    for row, (name, gen, n, fps, loop) in enumerate(ANIMS):
        frames = gen(n)
        assert len(frames) == n, name
        for f, a in enumerate(frames):
            sheet[row * T:(row + 1) * T, f * T:(f + 1) * T] = a
        meta["anims"][name] = {"row": row, "frames": n, "fps": fps, "loop": loop}
    Image.fromarray(sheet, "RGBA").save(OUT / "fx.png")
    (OUT / "fx.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    # preview on the night-blue battle UI colour, 2x
    bg = Image.new("RGBA", (sheet.shape[1], sheet.shape[0]), (20, 27, 45, 255))
    bg.alpha_composite(Image.fromarray(sheet, "RGBA"))
    bg.resize((bg.width * 2, bg.height * 2), Image.NEAREST).save(OUT / "fx_preview.png")
    print("fx written to", OUT)


if __name__ == "__main__":
    main()
