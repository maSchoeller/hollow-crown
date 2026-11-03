"""Tectonic terrain sketch for the Valmora world map.

Builds an uplift field from hand-placed tectonic features (fold belts, plateaus,
basins, volcanoes), erodes it with the stream-power law (implicit FastScape step,
priority-flood routing) and then tilts the coast down so that valleys drown.
Rivers run downhill and merge by construction, headlands are the ridge ends,
bays the drowned valleys.

Herleitung der Layout-Vorlage, kein Asset-Werkzeug. Braucht zusaetzlich numba und scipy.

Usage: python art/world/v4/terrain.py art/world/v4/terrain_scenario.json <out_dir> [--size 512]
Output: height.npy (m), area.npy (drainage m2), receiver.npy, sea.npy, lakes.npy, relief.png
"""

import argparse
import heapq
import json
import math
from pathlib import Path

import numpy as np
from numba import njit
from PIL import Image
from scipy import ndimage


def fractal_noise(size, seed, octaves=8, persistence=0.55, base=4):
    """Value noise summed over octaves, normalised to -1..1."""
    rng = np.random.default_rng(seed)
    out = np.zeros((size, size))
    amp = 1.0
    for o in range(octaves):
        cells = base * 2**o
        if cells >= size:
            break
        grid = rng.standard_normal((cells + 2, cells + 2))
        xs = np.linspace(0, cells, size)
        i = np.minimum(xs.astype(int), cells)
        f = xs - i
        f = f * f * (3 - 2 * f)
        row = grid[i, :] * (1 - f)[:, None] + grid[i + 1, :] * f[:, None]
        out += amp * (row[:, i] * (1 - f) + row[:, i + 1] * f)
        amp *= persistence
    return out / np.abs(out).max()


def distance_to_polyline(xx, yy, pts):
    """Distance field to a polyline plus the position along it (0..1)."""
    pts = np.asarray(pts, float)
    best = np.full(xx.shape, 1e9)
    along = np.zeros(xx.shape)
    seg_len = np.hypot(*(pts[1:] - pts[:-1]).T)
    total = seg_len.sum()
    done = 0.0
    for k in range(len(pts) - 1):
        a, b = pts[k], pts[k + 1]
        ab = b - a
        t = np.clip(((xx - a[0]) * ab[0] + (yy - a[1]) * ab[1]) / (ab @ ab), 0, 1)
        d = np.hypot(xx - (a[0] + t * ab[0]), yy - (a[1] + t * ab[1]))
        mask = d < best
        best[mask] = d[mask]
        along[mask] = ((done + t * seg_len[k]) / total)[mask]
        done += seg_len[k]
    return best, along


def build_uplift(cfg, size):
    """Uplift field in units of uplift_m_per_yr, on warped coordinates."""
    seed = cfg.get("seed", 1)
    amount = cfg.get("warp", 0.018)
    yy, xx = np.mgrid[0:size, 0:size] / (size - 1)
    xw = xx + amount * fractal_noise(size, seed, 6, 0.5, 3)
    yw = yy + amount * fractal_noise(size, seed + 1, 6, 0.5, 3)
    uplift = np.full((size, size), float(cfg.get("base_uplift", 0.06)))
    for r in cfg.get("ridges", []):
        d, along = distance_to_polyline(xw, yw, r["path"])
        strength = np.interp(along, np.linspace(0, 1, len(r["strength"])), r["strength"])
        uplift += np.exp(-((d / r["width"]) ** 2)) * strength
    for b in cfg.get("blocks", []):
        cx, cy, rx, ry = b["ellipse"]
        ang = math.radians(b.get("angle", 0))
        u = (xw - cx) * math.cos(ang) + (yw - cy) * math.sin(ang)
        v = -(xw - cx) * math.sin(ang) + (yw - cy) * math.cos(ang)
        q = np.sqrt((u / rx) ** 2 + (v / ry) ** 2)
        uplift += b["value"] * np.clip((1.15 - q) / 0.3, 0, 1)
    for x, y, r, s in cfg.get("cones", []):
        uplift += s * np.exp(-((np.hypot(xw - x, yw - y) / r) ** 2))
    coast_fade = np.clip((xw - 0.18) / 0.2, 0, 1)
    uplift += cfg.get("hill_noise", 0.0) * coast_fade * (fractal_noise(size, seed + 11, 6, 0.55, 12) + 1)
    uplift *= 1 + cfg.get("rock_variation", 0.35) * fractal_noise(size, seed + 7, 7, 0.55, 6)
    # Pre-cut river valleys: the story needs these rivers exactly here.
    for ch in cfg.get("channels", []):
        d, _ = distance_to_polyline(xw, yw, ch["path"])
        uplift *= 1 - ch.get("cut", 0.92) * np.exp(-((d / ch["width"]) ** 2))
    return np.clip(uplift, 0, None), xw, yw


def edge_mask(size, cfg):
    """Fixed-height cells: the paleo coast in the west plus open map edges."""
    fixed = np.zeros((size, size), bool)
    level = np.zeros((size, size))
    edges = cfg["edges"]
    coast = cfg.get("paleo_sea", -180.0)
    # North, east and south continue beyond the map at the given heights.
    xs = np.linspace(0, 1, size)
    ys = np.linspace(0, 1, size)
    fixed[0, :] = True
    level[0, :] = np.interp(xs, *zip(*edges["north"]))
    fixed[-1, :] = True
    level[-1, :] = np.interp(xs, *zip(*edges["south"]))
    fixed[:, -1] = True
    level[:, -1] = np.interp(ys, *zip(*edges["east"]))
    fixed[:, 0] = True
    level[:, 0] = coast
    return fixed, level


def flood_order(z, fixed):
    """Priority flood; returns routing order and receivers, base level first."""
    ny, nx = z.shape
    return _flood(z.ravel(), fixed.ravel(), nx, ny)


@njit(cache=True)
def _flood(z, fixed, nx, ny):
    n = z.size
    seen = fixed.copy()
    filled = z.copy()
    receiver = np.full(n, -1, dtype=np.int64)
    order = np.zeros(n, dtype=np.int64)
    pq = [(z[i], int(i)) for i in np.nonzero(fixed)[0]]
    heapq.heapify(pq)
    count = 0
    dy = (-1, -1, -1, 0, 0, 1, 1, 1)
    dx = (-1, 0, 1, -1, 1, -1, 0, 1)
    while pq:
        h, i = heapq.heappop(pq)
        order[count] = i
        count += 1
        y, x = i // nx, i % nx
        for k in range(8):
            v, u = y + dy[k], x + dx[k]
            if 0 <= v < ny and 0 <= u < nx:
                j = v * nx + u
                if not seen[j]:
                    seen[j] = True
                    filled[j] = max(z[j], h + 0.01)
                    receiver[j] = i
                    heapq.heappush(pq, (filled[j], j))
    # Steepest descent on the filled surface; keeps the flood tree free of cycles.
    for c in range(count):
        i = order[c]
        if receiver[i] < 0:
            continue
        y, x = i // nx, i % nx
        best = 0.0
        r = receiver[i]
        for k in range(8):
            v, u = y + dy[k], x + dx[k]
            if 0 <= v < ny and 0 <= u < nx:
                j = v * nx + u
                drop = (filled[i] - filled[j]) / (1.414 if dy[k] != 0 and dx[k] != 0 else 1.0)
                if drop > best:
                    best = drop
                    r = j
        receiver[i] = r
    return order[:count], receiver, filled


@njit(cache=True)
def _stream_power(z, rate, order, receiver, nx, cell, kf, m, dt, fixed):
    area = np.full(z.size, cell * cell)
    for k in range(len(order) - 1, -1, -1):
        i = order[k]
        r = receiver[i]
        if r >= 0:
            area[r] += area[i]
    for k in range(len(order)):
        i = order[k]
        r = receiver[i]
        if fixed[i] or r < 0:
            continue
        z[i] += rate[i] * dt
        diag = i // nx != r // nx and i % nx != r % nx
        dist = cell * (1.414 if diag else 1.0)
        f = kf * area[i] ** m * dt / dist
        z[i] = max((z[i] + f * z[r]) / (1 + f), z[r] + 0.01)
    return area


def simulate(cfg, size):
    uplift, xw, yw = build_uplift(cfg, size)
    fixed, level = edge_mask(size, cfg)
    cell = cfg.get("extent_km", 400) * 1000 / size
    noise = fractal_noise(size, cfg.get("seed", 1) + 3, 8, 0.6, 4)
    z = 20 + cfg.get("init_noise", 30) * (noise + 1) + uplift * 300
    for ch in cfg.get("channels", []):
        d, along = distance_to_polyline(xw, yw, ch["path"])
        floor = np.interp(along, [0, 1], ch["heights"])
        z = np.where(d < ch["width"] * 0.7, np.minimum(z, floor), z)
    z[fixed] = level[fixed]
    rate = uplift * cfg.get("uplift_m_per_yr", 0.004)
    kf, m, dt = cfg.get("kf", 8e-6), cfg.get("m", 0.45), cfg.get("dt", 8000)
    diff = cfg.get("diffusion", 0.06)
    ny, nx = z.shape
    for _ in range(cfg.get("steps", 150)):
        order, recv, _filled = flood_order(z, fixed)
        flat = z.ravel()
        _stream_power(flat, rate.ravel(), order, recv, nx, cell, kf, m, dt, fixed.ravel())
        z = flat.reshape(ny, nx)
        lap = np.roll(z, 1, 0) + np.roll(z, -1, 0) + np.roll(z, 1, 1) + np.roll(z, -1, 1) - 4 * z
        z[~fixed] += (diff * lap)[~fixed]
    order, recv, _filled = flood_order(z, fixed)
    area = _stream_power(z.ravel().copy(), rate.ravel() * 0, order, recv, nx, cell, kf, m, 0.0, fixed.ravel())
    return z, area.reshape(ny, nx), recv, order, cell, xw, yw


def finish(z, recv, order, cfg, xw, yw):
    """Tilt the coast down, carve fjords, then find sea and dammed lakes."""
    size = z.shape[0]
    z = z.copy()
    tilt = cfg.get("coast_tilt", {"x0": 0.4, "metres": 300.0})
    z -= tilt["metres"] * np.clip((tilt["x0"] - xw) / tilt["x0"], 0, 1)
    lift = cfg.get("inland_lift", {"x0": 0.3, "x1": 0.5, "metres": 0.0})
    z += lift["metres"] * np.clip((xw - lift["x0"]) / (lift["x1"] - lift["x0"]), 0, 1)
    for f in cfg.get("fjords", []):
        d, _ = distance_to_polyline(xw, yw, f["path"])
        z = np.where(d < f["width"] * 1.6, z - f["depth"] * np.exp(-((d / f["width"]) ** 4)), z)
    sigma = cfg.get("coast_smooth", 0.0)
    if sigma:
        blend = np.clip((0.40 - xw) / 0.12, 0, 1)
        z = z * (1 - blend) + ndimage.gaussian_filter(z, sigma) * blend
    sea = z <= 0
    labels, _ = ndimage.label(sea)
    west = set(labels[:, 0].tolist()) - {0}
    sea = np.isin(labels, list(west))
    lakes = np.zeros_like(sea)
    for lake in cfg.get("lakes", []):
        lx, ly = int(lake["outlet"][0] * (size - 1)), int(lake["outlet"][1] * (size - 1))
        lakes |= dam_lake(z, recv, order, lx, ly, lake["rise"], lake.get("reach", 60))
    for cx, cy, rx, ry in cfg.get("lake_basins", []):
        lakes |= ((xw - cx) / rx) ** 2 + ((yw - cy) / ry) ** 2 < 1
    return z, sea, lakes


def dam_lake(z, recv, order, x, y, rise, reach):
    """Everything upstream of the dam and below its crest fills with water."""
    size = z.shape[0]
    # Dams sit on rivers: snap to the lowest-lying cell of the valley floor nearby.
    window = z[max(y - 6, 0) : y + 7, max(x - 6, 0) : x + 7]
    wy, wx = np.unravel_index(np.argmin(window), window.shape)
    y, x = max(y - 6, 0) + wy, max(x - 6, 0) + wx
    outlet = y * size + x
    up = np.zeros(z.size, bool)
    up[outlet] = True
    for i in order:
        r = recv[i]
        if r >= 0 and up[r]:
            up[i] = True
    water = up.reshape(z.shape) & (z < z[y, x] + rise)
    labels, _ = ndimage.label(water)
    keep = labels == labels[y, x]
    yy, xx = np.mgrid[0:size, 0:size]
    return keep & (np.hypot(xx - x, yy - y) < reach)


STOPS = [(0, (108, 142, 92)), (120, (130, 156, 96)), (450, (170, 170, 112)), (1000, (160, 134, 98)), (1800, (126, 108, 94)), (2600, (206, 202, 198)), (3600, (250, 250, 252))]


def render(z, sea, lakes, area, cell, cfg, scale=2):
    size = z.shape[0]
    alt = np.clip(z, 0, None)
    stops = np.array([s[0] for s in STOPS], float)
    cols = np.array([s[1] for s in STOPS], float)
    rgb = np.stack([np.interp(alt, stops, cols[:, c]) for c in range(3)], axis=-1)
    gy, gx = np.gradient(np.maximum(z, 0), cell)
    gx, gy = gx * 3.5, gy * 3.5
    az, el = math.radians(315), math.radians(45)
    lx, ly, lz = math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)
    shade = np.clip((-gx * lx - gy * ly + lz) / np.sqrt(gx * gx + gy * gy + 1), 0, 1)
    rgb *= (0.42 + 0.9 * shade)[..., None]
    shore = ndimage.gaussian_filter((~sea).astype(float), size * 0.012)
    deep, shallow = np.array((58, 98, 140.0)), np.array((112, 158, 180.0))
    water = deep + (shallow - deep) * np.clip(shore * 2.4, 0, 1)[..., None]
    rgb[sea] = water[sea]
    rgb[lakes] = (150, 196, 214)
    img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).resize((size * scale, size * scale), Image.LANCZOS)
    arr = np.asarray(img).copy()
    km2 = area / 1e6
    thresh = cfg.get("river_km2", 500)
    w = np.where((km2 > thresh) & ~sea & ~lakes, np.sqrt(km2 / thresh), 0.0).astype(np.float32)
    w = np.asarray(Image.fromarray(w).resize((size * scale, size * scale), Image.BILINEAR))
    arr[w > 0.3] = (0.2 * arr[w > 0.3] + 0.8 * np.array((58, 108, 158))).astype(np.uint8)
    return Image.fromarray(arr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scenario")
    ap.add_argument("out")
    ap.add_argument("--size", type=int, default=512)
    a = ap.parse_args()
    cfg = json.loads(Path(a.scenario).read_text(encoding="utf8"))
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    raw, area, recv, order, cell, xw, yw = simulate(cfg, a.size)
    z, sea, lakes = finish(raw, recv, order, cfg, xw, yw)
    np.save(out / "height.npy", z.astype(np.float32))
    np.save(out / "area.npy", area.astype(np.float32))
    np.save(out / "receiver.npy", recv)
    np.save(out / "sea.npy", sea)
    np.save(out / "lakes.npy", lakes)
    render(z, sea, lakes, area, cell, cfg).save(out / "relief.png")
    print(f"{cfg.get('name')}: max {z.max():.0f} m, sea {sea.mean():.0%}, lake cells {lakes.sum()}, biggest river {area.max() / 1e6:.0f} km2")


if __name__ == "__main__":
    main()
