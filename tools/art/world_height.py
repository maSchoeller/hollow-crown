"""World map topography and paint (story 5.2): content/world/valmora.yaml → height map, painted ground texture, heights.

    python tools/art/world_height.py          (part of `pnpm art:world`)

Designed after the concept sheets in art/world/ (art/prompts/world_topography.md): the Silbermeer in the west with rocky
cliffs, sea stacks and small beaches; the Drachengebirge in the north as connected, jagged mountain chains with snow; the
Eisenmark as a raised table land with cliff walls all round, cut by a winding river canyon; the Grenzland as rolling
lowland with small rocky knolls. Layout (coast, regions, places, roads) comes from the tile grid.

Units are tiles (one tile = one Babylon unit). The grid is the map plus `render.yaml world.skirt.width` tiles of sea on
every side. Output (art/world/; the PNGs and the GLB in Git LFS):
- valmora_height.png        16-bit grayscale, RES samples per tile (Blender displaces the mesh with it)
- valmora_height.json       size, resolution and height range for Blender
- valmora_albedo.png        the painted ground, TEX px per tile (grass, autumn grass, layered rock, snow, sand, roads,
                            ash, the sea floor from turquoise to deep blue, ambient occlusion); north row on top
- valmora_heights_game.json heights for the game (props, places, fog), 2 per tile
"""
import json
import os

import numpy as np
import yaml
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'art', 'world')
RES = 4          # mesh samples per tile
TEX = 30         # texture pixels per tile (66 × 50 tiles → 1980 × 1500 px)
HI = 10          # samples per tile of the height field the paint is computed from (upsampled to TEX)
MIN, MAX = -1.0, 6.5
SEA_FLOOR = -0.9
WATER = -0.1
BEACH = 0.06


def rows(block):
    return [r.strip() for r in block.split('\n') if r.strip()]


def lattice_noise(x, y, seed, octaves=4, size=64):
    """Smooth value noise (deterministic), 0..1."""
    rng = np.random.default_rng(seed)
    total = np.zeros_like(x)
    amp, freq, norm = 1.0, 1.0, 0.0
    for _ in range(octaves):
        lat = rng.random((size + 1, size + 1))
        fx = (x * freq) % size
        fy = (y * freq) % size
        x0 = np.floor(fx).astype(int)
        y0 = np.floor(fy).astype(int)
        tx = fx - x0
        ty = fy - y0
        tx = tx * tx * (3 - 2 * tx)
        ty = ty * ty * (3 - 2 * ty)
        a, b, c, d = lat[y0, x0], lat[y0, x0 + 1], lat[y0 + 1, x0], lat[y0 + 1, x0 + 1]
        total += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty)
        norm += amp
        amp *= 0.5
        freq *= 2.0
    return total / norm


def blur(a, sigma):
    """Separable Gaussian blur in samples."""
    if sigma <= 0:
        return a
    r = max(1, int(3 * sigma))
    k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * sigma * sigma))
    k /= k.sum()
    p = np.pad(a, r, mode='edge')
    p = np.apply_along_axis(lambda m: np.convolve(m, k, mode='valid'), 1, p)
    p = np.apply_along_axis(lambda m: np.convolve(m, k, mode='valid'), 0, p)
    return p


def smooth(e0, e1, v):
    t = np.clip((v - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def seg_distance(xs, ys, pts):
    """Distance of every sample to a polyline and the position (0..1) along it."""
    best = np.full_like(xs, 1e9)
    along = np.zeros_like(xs)
    total = sum(np.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:]))
    run = 0.0
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        dx, dy = x1 - x0, y1 - y0
        ln = max(1e-6, np.hypot(dx, dy))
        t = np.clip(((xs - x0) * dx + (ys - y0) * dy) / (ln * ln), 0, 1)
        d = np.hypot(xs - (x0 + t * dx), ys - (y0 + t * dy))
        m = d < best
        best = np.where(m, d, best)
        along = np.where(m, (run + t * ln) / total, along)
        run += ln
    return best, along


class World:
    """The tile grid with its skirt and every per-tile mask the landforms need."""

    def __init__(self):
        self.world = yaml.safe_load(open(os.path.join(ROOT, 'content', 'world', 'valmora.yaml'), encoding='utf8'))
        render = yaml.safe_load(open(os.path.join(ROOT, 'content', 'core', 'render.yaml'), encoding='utf8'))
        self.skirt = s = render['world']['skirt']['width']
        tiles = rows(self.world['tiles'])
        regions = rows(self.world['regionGrid'])
        acts = {r['char']: r['act'] for r in self.world['regions']}
        legend = self.world['legend']
        mw, mh = len(tiles[0]), len(tiles)
        self.gw, self.gh = mw + 2 * s, mh + 2 * s
        self.tid = np.full((self.gh, self.gw), 'river', dtype=object)
        self.act = np.zeros((self.gh, self.gw), dtype=int)
        for y in range(mh):
            for x in range(mw):
                self.tid[y + s, x + s] = legend[tiles[y][x]]
                self.act[y + s, x + s] = acts.get(regions[y][x], 0)
        self.sea = (self.tid == 'river') & (self.act == 0)
        self.river = np.isin(self.tid, ['river', 'shallows', 'bridge']) & ~self.sea
        self.ash = np.zeros((self.gh, self.gw), bool)
        for sign in self.world.get('signs', []):
            for ax, ay, aw, ah in sign['areas']:
                for y in range(ay, ay + ah):
                    for x in range(ax, ax + aw):
                        if self.tid[y + s, x + s] in ('grass', 'plain'):
                            self.ash[y + s, x + s] = True
        # the river's middle line (it winds a little)
        self.river_line = []
        for y in range(self.gh):
            xs = [x for x in range(self.gw) if self.river[y, x]]
            if xs:
                self.river_line.append((sum(xs) / len(xs) + 0.5 + 0.35 * np.sin(y * 0.9), y + 0.5))
        self.ridges = self.make_ridges()

    def make_ridges(self):
        """Mountain chains of the Drachengebirge: a main crest across the north, a lower crest behind it and spurs to the south."""
        rng = np.random.default_rng(17)
        s = self.skirt
        x0, x1 = s - 1.0, self.gw - s + 1.0
        main = [(x, s + 4.2 + 1.2 * np.sin(x * 0.23) + 0.7 * np.sin(x * 0.71 + 1.0)) for x in np.arange(x0, x1, 0.8)]
        back = [(x, s + 1.2 + 0.7 * np.sin(x * 0.37 + 2.0)) for x in np.arange(x0, x1, 0.8)]
        chains = [{'pts': main, 'width': 2.6, 'h': (3.6, 5.8)}, {'pts': back, 'width': 2.0, 'h': (2.8, 4.4)}]
        for sx in np.arange(s + 1.0, self.gw - s - 1, 2.3):
            sy = s + 4.2 + 1.2 * np.sin(sx * 0.23) + 0.7 * np.sin(sx * 0.71 + 1.0)
            ex, ey = sx + rng.uniform(-2.5, 2.5), sy + rng.uniform(3.5, 6.0)
            mid = ((sx + ex) / 2 + rng.uniform(-0.8, 0.8), (sy + ey) / 2)
            chains.append({'pts': [(sx, sy), mid, (ex, ey)], 'width': 1.6, 'h': (3.0, 1.3), 'spur': True})
        return chains


def heights(w, res):
    """Height field at `res` samples per tile (tile corners included), plus the region weights for painting."""
    s = w.skirt
    sw, sh = w.gw * res + 1, w.gh * res + 1
    ys, xs = np.mgrid[0:sh, 0:sw].astype(float) / res
    # region edges and the coast follow a warped grid, so they read as landforms, not as tile steps
    wx = xs + (lattice_noise(xs * 0.45, ys * 0.45, 51) - 0.5) * 2.2
    wy = ys + (lattice_noise(xs * 0.45, ys * 0.45, 52) - 0.5) * 2.2
    wi = np.clip(np.floor(wx).astype(int), 0, w.gw - 1)
    wj = np.clip(np.floor(wy).astype(int), 0, w.gh - 1)
    ti = np.clip(np.floor(xs).astype(int), 0, w.gw - 1)
    tj = np.clip(np.floor(ys).astype(int), 0, w.gh - 1)

    def field(mask, sigma, warped=True):
        return blur((mask[wj, wi] if warped else mask[tj, ti]).astype(float), sigma * res)

    n0 = lattice_noise(xs * 0.18, ys * 0.18, 71)
    n1 = lattice_noise(xs * 0.35, ys * 0.35, 11)
    n2 = lattice_noise(xs * 0.9, ys * 0.9, 23)
    sharp = (1 - np.abs(2 * lattice_noise(xs * 0.5 + 3.1, ys * 0.5 - 1.7, 41, 5) - 1)) ** 2.0
    edge = np.minimum.reduce([xs - s, ys - s, w.gw - s - xs, w.gh - s - ys])
    ragged = edge + (lattice_noise(xs * 0.5, ys * 0.5, 61) - 0.5) * 3.0
    land = field(~w.sea, 0.7) * np.clip(ragged * 0.9 + 0.2, 0, 1)
    a1 = field(w.act == 1, 0.6)
    a2 = np.clip((field(w.act == 2, 0.3) - 0.5) * 3.5 + 0.5, 0, 1)
    a3 = field(w.act == 3, 0.9)
    rng = np.random.default_rng(5)

    # lowland: rolling hills and small rocky knolls
    low = 0.22 + 0.42 * (n0 * 1.1 + n1 * 0.5 + n2 * 0.25) - 0.25
    knolls = np.zeros_like(xs)
    for _ in range(160):
        kx, ky = rng.uniform(s, w.gw - s), rng.uniform(s, w.gh - s)
        if w.act[int(ky), int(kx)] != 1 or w.tid[int(ky), int(kx)] in ('road', 'river', 'village', 'bridge'):
            continue
        r = rng.uniform(0.7, 1.5)
        d = np.hypot(xs - kx, ys - ky) / r
        knolls = np.maximum(knolls, rng.uniform(0.45, 1.05) * np.clip(1 - d, 0, 1) ** 1.6)
    low = low + knolls
    # table land: terraces with cliff bands
    raw = 1.35 + 0.45 * (n1 * 0.7 + n2 * 0.3) * 1.6
    step = 0.38
    k = raw / step
    high = (np.floor(k) + np.clip((k - np.floor(k) - 0.72) / 0.28, 0, 1)) * step
    for (x, y) in [(x, y) for y in range(w.gh) for x in range(w.gw) if w.tid[y, x] == 'mountain' and w.act[y, x] == 2]:
        d = np.hypot(xs - x - 0.5, ys - y - 0.5) / 1.3
        high = np.maximum(high, 1.35 + 0.9 * np.clip(1 - d, 0, 1) ** 1.4)
    # mountains: chains with a jagged crest, peaks where the crest rises, valleys between the chains
    mount = 1.1 + 0.4 * n2
    for c in w.ridges:
        d, t = seg_distance(xs, ys, c['pts'])
        h0, h1 = c['h']
        crest = (h0 + (h1 - h0) * t) if c.get('spur') else (h0 + (h1 - h0) * lattice_noise(t * 22 + h0, t * 5, 83, 3))
        crest = crest + 1.5 * (sharp - 0.45)
        prof = np.clip(1 - d / (c['width'] * (0.85 + 0.3 * n1)), 0, 1) ** 1.15
        mount = np.maximum(mount, 1.1 + (crest - 1.1) * prof)
    # the river cuts the chains: a pass where it leaves the range
    if w.river_line:
        rv, _ = seg_distance(xs, ys, w.river_line)
        mount = np.where(rv < 2.5, np.minimum(mount, 1.1 + (mount - 1.1) * smooth(0.6, 2.5, rv)), mount)

    h = SEA_FLOOR + (BEACH - SEA_FLOOR) * np.clip(land * 1.6 - 0.3, 0, 1)
    inland = np.clip((land - 0.5) * 3, 0, 1)
    tot = a1 + a2 + a3 + 1e-6
    body = (a1 * low + a2 * high + a3 * mount) / tot
    beach = field(w.tid == 'sand', 0.5)
    cliff = np.clip(land * 2.2 - 1.0, 0, 1) * (1 - np.clip(beach * 2, 0, 1)) * (0.35 + 0.4 * n2)
    body = np.maximum(body, cliff * (1 - a2 - a3).clip(0, 1))
    h = h + inland * (body - BEACH) * np.clip(tot, 0, 1)
    for _ in range(16):
        sx, sy = rng.uniform(s + 1, s + 9), rng.uniform(s, w.gh - s)
        if not w.sea[int(sy), int(sx)] or land[int(sy * res), int(sx * res)] > 0.35:
            continue
        d = np.hypot(xs - sx, ys - sy) / rng.uniform(0.35, 0.6)
        h = np.maximum(h, SEA_FLOOR + rng.uniform(0.9, 1.6) * np.clip(1 - d, 0, 1) ** 0.6)
    # the river bed, banks falling into it (a canyon through the table land)
    rv = np.full_like(xs, 99.0)
    if w.river_line:
        rv, _ = seg_distance(xs, ys, w.river_line)
        bed = WATER - 0.3
        width = 0.32 + 0.12 * a1
        banks = np.clip((rv - width) / (0.55 + 0.6 * a1), 0, 1) ** (1.0 - 0.5 * a2)
        h = bed + (h - bed) * banks
    # places sit on level ground
    for loc in w.world['locations']:
        lx, ly = loc['at']
        cx, cy = lx + s + 0.5, ly + s + 0.5
        d = np.hypot(xs - cx, ys - cy)
        wgt = np.clip(1.4 - d, 0, 1) ** 2
        here = h[int(cy * res), int(cx * res)]
        h = h * (1 - wgt) + max(here, BEACH + 0.1) * wgt
    h = np.clip(h, MIN, MAX)
    return h, {'a1': a1, 'a2': a2, 'a3': a3, 'rv': rv, 'xs': xs, 'ys': ys, 'field': field}


def hexc(c):
    return np.array([int(c[i:i + 2], 16) / 255 for i in (1, 3, 5)])


def paint(w, h, aux, res):
    """The ground colours at `res` px per tile: painted look of the concept sheets, lighting left to the game."""
    xs, ys = aux['xs'], aux['ys']
    field = aux['field']
    n_big = lattice_noise(xs * 0.25, ys * 0.25, 101)
    n_mid = lattice_noise(xs * 1.1, ys * 1.1, 102)
    n_fine = lattice_noise(xs * 4.5, ys * 4.5, 103, 3)
    n_speck = lattice_noise(xs * 11, ys * 11, 104, 2)
    gy, gx = np.gradient(h, 1 / res)
    slope = np.hypot(gx, gy)
    lerp = lambda a, b, t: a + (b - a) * t[..., None]

    # meadow of the lowland: yellow-green in the sun, deeper green in patches, sunlit tips
    meadow = lerp(hexc('#5a8a2c'), hexc('#93bb3c'), smooth(0.25, 0.75, n_big))
    meadow = lerp(meadow, hexc('#c2d45a'), smooth(0.55, 0.85, n_mid) * 0.8)
    meadow = lerp(meadow, hexc('#3f6a26'), smooth(0.72, 0.9, n_speck) * 0.55)  # shrubs and tufts
    meadow = meadow * (0.86 + 0.28 * n_fine)[..., None]
    # autumn grass of the table land: ochre to orange, red patches
    autumn = lerp(hexc('#d9a63c'), hexc('#e2802e'), n_big)
    autumn = lerp(autumn, hexc('#b8452a'), np.clip(n_mid - 0.62, 0, 1) * 2.2)
    autumn = autumn * (0.9 + 0.2 * n_fine)[..., None]
    # mountain meadow below the snow: cooler, browner
    alpine = lerp(hexc('#7d8c4a'), hexc('#a89a62'), n_mid) * (0.9 + 0.2 * n_fine)[..., None]
    a1, a2, a3 = aux['a1'], aux['a2'], aux['a3']
    tot = a1 + a2 + a3 + 1e-6
    col = (meadow * a1[..., None] + autumn * a2[..., None] + alpine * a3[..., None]) / tot[..., None]

    # layered rock on steep ground and crests: warm grey-brown with strata, darker in the cracks
    strata = 0.82 + 0.18 * np.sin(h * 11 + n_mid * 6)
    rock = lerp(hexc('#8f7a6c'), hexc('#c4b09d'), n_fine) * strata[..., None]
    rock = rock * (0.85 + 0.15 * n_speck)[..., None]
    rock_m = smooth(0.55, 1.1, slope + 0.3 * (n_mid - 0.5)) + a3 * smooth(1.7, 2.6, h + 0.4 * (n_fine - 0.5))
    col = lerp(col, rock, np.clip(rock_m, 0, 1))
    # snow on the high ground, thinner on steep faces, blue in the hollows
    snow_c = lerp(hexc('#c9d6ea'), hexc('#f4f6fb'), np.clip(n_fine + 0.2, 0, 1))
    snow_m = smooth(2.9, 3.5, h + 0.5 * (n_mid - 0.5)) * (1 - 0.65 * smooth(1.4, 2.4, slope))
    col = lerp(col, snow_c, snow_m * (a3 + 0.2).clip(0, 1))
    # roads: soft dirt paths through the grid's road and bridge tiles
    # narrow paths (about 0.4 tile): the middle of the grid's road tiles, softened
    roads = field(np.isin(w.tid, ['road', 'bridge']), 0.38, warped=False)
    road_m = smooth(0.6, 0.72, roads + 0.05 * (n_fine - 0.5))
    col = lerp(col, lerp(hexc('#c9a26c'), hexc('#e0c08a'), n_fine), road_m * (h > WATER + 0.05))
    # ash of the dragon sign: grey-black ground with embers of colour
    ash_m = smooth(0.35, 0.7, field(w.ash, 0.45) + 0.2 * (n_mid - 0.5))
    col = lerp(col, lerp(hexc('#5e554d'), hexc('#8a7f72'), n_fine), ash_m * 0.7)
    # beaches and the sea floor: sand at the waterline, turquoise in the shallows, deep blue further out
    depth = WATER - h
    sand_m = smooth(WATER + 0.22, WATER + 0.06, h) * (1 - np.clip(rock_m, 0, 1))
    col = lerp(col, lerp(hexc('#e6cf96'), hexc('#f2e2b4'), n_fine), sand_m)
    floor = lerp(lerp(hexc('#7fd6cf'), hexc('#2a9fbe'), smooth(0.0, 0.35, depth)), hexc('#0b4f8c'), smooth(0.3, 0.9, depth))
    col = np.where((depth > 0)[..., None], floor, col)
    # river banks: wet, darker ground
    col = col * (1 - 0.25 * smooth(1.0, 0.3, aux['rv']) * (depth <= 0))[..., None]
    # ambient occlusion from the height field: valleys and cliff feet darker, crests a touch lighter
    cav = blur(h, 1.2 * res) - h
    ao = np.clip(1 - 0.45 * cav, 0.6, 1.12)
    col = col * ao[..., None]
    return np.clip(col, 0, 1)


def main():
    w = World()
    os.makedirs(OUT, exist_ok=True)
    h, _ = heights(w, RES)
    Image.fromarray(((h - MIN) / (MAX - MIN) * 65535).round().astype(np.uint16)).save(os.path.join(OUT, 'valmora_height.png'))
    sh, sw = h.shape
    json.dump({'tilesW': w.gw, 'tilesH': w.gh, 'skirt': w.skirt, 'res': RES, 'samplesW': sw, 'samplesH': sh, 'min': MIN, 'max': MAX, 'water': WATER},
              open(os.path.join(OUT, 'valmora_height.json'), 'w'), indent=1)
    # heights for the game: 2 per tile, 2 decimals
    h2, _ = heights(w, 2)
    json.dump({'res': 2, 'skirt': w.skirt, 'w': h2.shape[1], 'h': h2.shape[0], 'water': WATER, 'data': [round(float(v), 2) for v in h2.ravel()]},
              open(os.path.join(OUT, 'valmora_heights_game.json'), 'w'), separators=(',', ':'))
    # the paint, from a finer height field, upsampled to TEX px per tile
    hh, aux = heights(w, HI)
    col = paint(w, hh, aux, HI)
    img = Image.fromarray((col * 255).round().astype(np.uint8), 'RGB').resize((w.gw * TEX, w.gh * TEX), Image.BICUBIC)
    # fine grain at full size, so the ground does not look smeared up close
    g = np.random.default_rng(9).normal(1.0, 0.035, (img.height, img.width, 1))
    img = Image.fromarray(np.clip(np.asarray(img).astype(float) * g, 0, 255).astype(np.uint8))
    img.save(os.path.join(OUT, 'valmora_albedo.png'))
    print(f'world: {sw}×{sh} samples, height {h.min():.2f}..{h.max():.2f}, paint {img.width}×{img.height}')


if __name__ == '__main__':
    main()
