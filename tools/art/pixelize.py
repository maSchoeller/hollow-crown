"""Hollow Crown – sprite pipeline, part 5: render passes → pixel sprite sheets.

python tools/art/pixelize.py <raw_dir> <out_dir> [id ...]

<raw_dir> is what blender_render.py wrote (roles.json + <id>/<row>_<frame>_{id,n,z}.png + meta.json).
For each subject this writes <out_dir>/<id>/sheet.key.png, sheet.normal.png, sheet.json.

Per frame:
 1. decode role ids (4× size), 4×4 majority vote with per-role priority (eyes, buttons win their block)
 2. average the normals / depth of the winning role per block
 3. toon shading: n·L against per-kind thresholds → ramp step (shadow / mid / light / highlight),
    screen-space contact shadows from the depth pass (under the chin, below the pauldron, under bangs)
 4. clean-up of single-pixel shading speckles, interior lines where parts overlap at a depth step
 5. coloured 1 px outline (darkest step of the adjacent role's ramp; lighter "selout" on the lit side)
 6. ramp steps → Hollow-64 colours; team role → key colours #400040 #800080 #C000C0 #FF00FF
"""
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ramps import EYE_FRONT, EYE_SIDE, KIND, LIGHT, ROLES  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PALETTE_FILE = os.path.join(ROOT, "art", "palette", "hollow-64.hex")
SS = 4
KEY_RGB = {"K0": (64, 0, 64), "K1": (128, 0, 128), "K2": (192, 0, 192), "K3": (255, 0, 255)}
TEAM_RGB = {
    "player": [(0x16, 0x28, 0x5A), (0x2A, 0x52, 0xB0), (0x3D, 0x7B, 0xE0), (0x8F, 0xBA, 0xF5)],
    "enemy": [(0x4A, 0x10, 0x18), (0x9E, 0x2A, 0x2A), (0xD9, 0x41, 0x3A), (0xF5, 0x9A, 0x8A)],
    "other": [(0x12, 0x3A, 0x24), (0x2A, 0x7A, 0x3E), (0x3F, 0xA6, 0x5A), (0x9B, 0xE0, 0x8F)],
}
DEPTH_NEAR, DEPTH_RANGE = 15.0, 20.0

# tuning
CAST_STEPS = ((-1, -1, 0.22), (0, -1, 0.22), (-1, -2, 0.32), (0, -2, 0.3))  # (dx, dy, min depth gap)
INNER_LINE_GAP = 0.28   # depth step (Blender units) that draws an interior line on the far side
SELOUT = True


def load_palette():
    with open(PALETTE_FILE, encoding="utf-8") as f:
        hexes = [l.strip() for l in f if l.strip()]
    return [tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in hexes]


PAL = load_palette()


def ramp_rgb(entry):
    if isinstance(entry, str):
        return KEY_RGB[entry]
    return PAL[entry]


class RoleInfo:
    def __init__(self, roles_json):
        self.by_id = {}
        for name, rid in roles_json.items():
            spec = ROLES.get(name)
            if spec is None:
                print(f"  ! role '{name}' missing in ramps.py – using cloth_dark")
                spec = ROLES["cloth_dark"]
            ramp = list(spec["ramp"])
            if len(ramp) == 4:
                ramp.append(ramp[3])
            self.by_id[rid] = {
                "name": name,
                "ramp": ramp,
                "kind": spec.get("kind", "cloth"),
                "prio": spec.get("prio", 1),
                "outline": spec.get("outline", True),
            }


def load_pass(path):
    return np.array(Image.open(path).convert("RGBA"))


def decode(raw_id, raw_n, raw_z):
    alpha = raw_id[..., 3] > 127
    rid = np.where(alpha, np.round(raw_id[..., 0] / 2).astype(np.int32) + 128 * np.round(raw_id[..., 2] / 64).astype(np.int32), 0)
    n = raw_n[..., :3].astype(np.float64) / 255.0 * 2 - 1
    z = (raw_z[..., 0].astype(np.float64) + raw_z[..., 1] / 255.0) / 255.0 * DEPTH_RANGE + DEPTH_NEAR
    return rid, n, z


def downsample(rid, n, z, roles):
    H, W = rid.shape[0] // SS, rid.shape[1] // SS
    out = np.zeros((H, W), np.int32)
    nout = np.zeros((H, W, 3))
    zout = np.full((H, W), 1e9)
    blocks = rid.reshape(H, SS, W, SS).transpose(0, 2, 1, 3).reshape(H, W, SS * SS)
    nb = n.reshape(H, SS, W, SS, 3).transpose(0, 2, 1, 3, 4).reshape(H, W, SS * SS, 3)
    zb = z.reshape(H, SS, W, SS).transpose(0, 2, 1, 3).reshape(H, W, SS * SS)
    for y in range(H):
        for x in range(W):
            blk = blocks[y, x]
            nz = blk[blk > 0]
            if len(nz) * 2 < SS * SS:
                # thin high-priority details (blade, string, eyes) may survive a sparse block
                if len(nz) == 0:
                    continue
                ids, cnt = np.unique(nz, return_counts=True)
                best = None
                for i, c in zip(ids, cnt):
                    pr = roles.by_id.get(int(i), {}).get("prio", 1)
                    if pr >= 2 and c * pr >= 10:
                        best = int(i)
                if best is None:
                    continue
                pick = best
            else:
                ids, cnt = np.unique(nz, return_counts=True)
                score = [c * roles.by_id.get(int(i), {}).get("prio", 1) if (c >= 2 or len(ids) == 1) else c for i, c in zip(ids, cnt)]
                pick = int(ids[int(np.argmax(score))])
            m = blk == pick
            out[y, x] = pick
            v = nb[y, x][m].mean(0)
            nout[y, x] = v / (np.linalg.norm(v) + 1e-9)
            zout[y, x] = zb[y, x][m].min()
    return out, nout, zout


def shade(idx, nout, zout, roles):
    """Ramp step per pixel: 1 shadow, 2 mid, 3 light, 4 highlight (0 = outline, used later)."""
    H, W = idx.shape
    L = np.array(LIGHT, float)
    L /= np.linalg.norm(L)
    lvl = np.zeros((H, W), np.int32)
    for y in range(H):
        for x in range(W):
            i = idx[y, x]
            if i == 0:
                continue
            info = roles.by_id[i]
            k = KIND.get(info["kind"])
            if k is None:
                lvl[y, x] = 2
                continue
            d = nout[y, x, 2] if info["kind"] == "glow" else float(nout[y, x] @ L)
            if d < k["t1"]:
                v = 1
            elif d < k["t2"]:
                v = 2
            else:
                v = 3
            if d >= k["t3"]:
                v = 4
            lvl[y, x] = v
    # contact shadows: something clearly in front, above/left of this pixel, shades it
    base = lvl.copy()
    for y in range(H):
        for x in range(W):
            i = idx[y, x]
            if i == 0 or base[y, x] <= 1 or KIND.get(roles.by_id[i]["kind"]) is None or roles.by_id[i]["kind"] == "glow":
                continue
            for dx, dy, gap in CAST_STEPS:
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and idx[yy, xx] != 0 and idx[yy, xx] != i:
                    if zout[yy, xx] < zout[y, x] - gap and roles.by_id[idx[yy, xx]]["kind"] not in ("glow",) and roles.by_id[idx[yy, xx]]["outline"]:
                        lvl[y, x] = max(1, min(lvl[y, x], 1 if base[y, x] <= 2 else 2))
                        break
    # despeckle: lone pixels whose same-role neighbours agree on another step
    for _ in range(2):
        new = lvl.copy()
        for y in range(H):
            for x in range(W):
                i = idx[y, x]
                if i == 0 or roles.by_id[i]["kind"] == "flat":
                    continue
                nb = [lvl[yy, xx] for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1))
                      if 0 <= yy < H and 0 <= xx < W and idx[yy, xx] == i]
                if len(nb) >= 3 and lvl[y, x] not in nb:
                    vals, cnt = np.unique(nb, return_counts=True)
                    if cnt.max() >= len(nb) - 1:
                        new[y, x] = vals[np.argmax(cnt)]
        lvl = new
    # interior lines: the far side of a depth step between different roles gets the outline step
    lines = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            i = idx[y, x]
            if i == 0 or not roles.by_id[i]["outline"] or roles.by_id[i]["kind"] == "flat":
                continue
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < H and 0 <= xx < W:
                    j = idx[yy, xx]
                    if j and j != i and roles.by_id[j]["outline"] and roles.by_id[j]["kind"] not in ("glow",) \
                            and zout[yy, xx] < zout[y, x] - INNER_LINE_GAP:
                        lines[y, x] = True
                        break
    lvl[lines] = 0
    return lvl


def outline(idx, lvl, nout, roles):
    """Returns colour-index image (role, step) incl. 1 px coloured outline around the silhouette."""
    H, W = idx.shape
    oidx = idx.copy()
    olvl = lvl.copy()
    for y in range(H):
        for x in range(W):
            if idx[y, x] != 0:
                continue
            best = None
            for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and idx[yy, xx] != 0:
                    info = roles.by_id[idx[yy, xx]]
                    if not info["outline"]:
                        continue
                    lum = sum(ramp_rgb(info["ramp"][0]))
                    # lit side (outline pixel above/left of a lit pixel) → softer outline step
                    step = 0
                    if SELOUT and lvl[yy, xx] >= 3 and (dx > 0 or dy > 0):
                        step = 1
                    cand = (lum + step * 1000, idx[yy, xx], step, (dx, dy))
                    if best is None or cand[0] < best[0]:
                        best = cand
            if best:
                oidx[y, x] = best[1]
                olvl[y, x] = best[2] if best[2] == 0 else -1  # -1 marks selout (rendered as step 1)
                ddx, ddy = best[3]
                nout[y, x] = nout[y + ddy, x + ddx] * 0.5 + np.array([-ddx, ddy, 0.0]) * 0.5
                nout[y, x] /= np.linalg.norm(nout[y, x]) + 1e-9
    return oidx, olvl


def stamp_eyes(oidx, roles):
    """Replace eye-marker blobs by templates. Returns override map (palette index or -1)."""
    H, W = oidx.shape
    ov = np.full((H, W), -1, np.int32)
    is_eye = np.zeros((H, W), bool)
    for rid, info in roles.by_id.items():
        if info["kind"] == "eye":
            is_eye |= oidx == rid
    seen = np.zeros((H, W), bool)
    blobs = []
    for y in range(H):
        for x in range(W):
            if is_eye[y, x] and not seen[y, x]:
                stack, pts = [(y, x)], []
                seen[y, x] = True
                while stack:
                    cy, cx = stack.pop()
                    pts.append((cy, cx))
                    for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                        if 0 <= ny < H and 0 <= nx < W and is_eye[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            stack.append((ny, nx))
                blobs.append(pts)
    if not blobs:
        return ov, is_eye
    front = len(blobs) >= 2
    for pts in blobs:
        ys = [p[0] for p in pts]
        xs = [p[1] for p in pts]
        ramp = roles.by_id[oidx[pts[0]]]["ramp"]
        tpl = EYE_FRONT if front else EYE_SIDE
        tw = len(tpl[0])
        cx = int(round((min(xs) + max(xs)) / 2 - (tw - 1) / 2))
        y0 = min(ys)
        # erase the marker (fill with the surrounding skin is done by the caller: marker → neighbour role)
        for (py, px) in pts:
            ov[py, px] = -2
        for ty, row in enumerate(tpl):
            for tx, ch in enumerate(row):
                yy, xx = y0 + ty, cx + tx
                if not (0 <= yy < H and 0 <= xx < W) or ch == ".":
                    continue
                e = {"L": ramp[0], "P": ramp[1], "I": ramp[2], "H": ramp[3]}.get(ch)
                if e is not None:
                    ov[yy, xx] = e
    return ov, is_eye


def fill_markers(oidx, olvl, ov):
    """Marker pixels not covered by the template take the most common neighbouring role/step."""
    H, W = oidx.shape
    for y in range(H):
        for x in range(W):
            if ov[y, x] == -2:
                cand = [(oidx[yy, xx], olvl[yy, xx]) for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1), (y - 2, x), (y, x - 2), (y, x + 2))
                        if 0 <= yy < H and 0 <= xx < W and ov[yy, xx] == -1 and oidx[yy, xx] != 0]
                if cand:
                    best = max(set(cand), key=cand.count)
                    oidx[y, x], olvl[y, x] = best
                ov[y, x] = -1


def to_rgba(oidx, olvl, roles, team="key", ov=None):
    H, W = oidx.shape
    img = np.zeros((H, W, 4), np.uint8)
    for y in range(H):
        for x in range(W):
            i = oidx[y, x]
            if i == 0:
                continue
            if ov is not None and ov[y, x] >= 0:
                img[y, x, :3] = PAL[ov[y, x]]
                img[y, x, 3] = 255
                continue
            ramp = roles.by_id[i]["ramp"]
            step = olvl[y, x]
            if step == -1:
                step = 1
            e = ramp[step]
            if isinstance(e, str) and team != "key":
                rgb = TEAM_RGB[team][int(e[1])]
            else:
                rgb = ramp_rgb(e)
            img[y, x, :3] = rgb
            img[y, x, 3] = 255
    return img


def normal_rgba(oidx, nout):
    n = ((nout + 1) / 2 * 255).clip(0, 255).astype(np.uint8)
    a = np.where(oidx != 0, 255, 0).astype(np.uint8)
    n[oidx == 0] = 0
    return np.dstack([n, a])


def process_frame(raw_dir, base, roles):
    rid, n, z = decode(load_pass(f"{base}_id.png"), load_pass(f"{base}_n.png"), load_pass(f"{base}_z.png"))
    idx, nout, zout = downsample(rid, n, z, roles)
    lvl = shade(idx, nout, zout, roles)
    oidx, olvl = outline(idx, lvl, nout, roles)
    ov, _ = stamp_eyes(oidx, roles)
    fill_markers(oidx, olvl, ov)
    return oidx, olvl, nout, ov


def process_subject(raw, out, sid, roles):
    sdir = os.path.join(raw, sid)
    with open(os.path.join(sdir, "meta.json"), encoding="utf-8") as f:
        meta = json.load(f)
    cw, ch = meta["cell"]
    rows = meta["rows"]
    cols = max(r["frames"] for r in rows)
    sheets = {v: np.zeros((ch * len(rows), cw * cols, 4), np.uint8) for v in ("key", "player", "enemy", "normal")}
    colors = set()
    for ri, row in enumerate(rows):
        for fi in range(row["frames"]):
            base = os.path.join(sdir, f"{row['name']}_{fi}")
            if not os.path.exists(base + "_id.png"):
                continue
            oidx, olvl, nout, ov = process_frame(raw, base, roles)
            for v in ("key", "player", "enemy"):
                im = to_rgba(oidx, olvl, roles, v, ov)
                sheets[v][ri * ch:(ri + 1) * ch, fi * cw:(fi + 1) * cw] = im
            sheets["normal"][ri * ch:(ri + 1) * ch, fi * cw:(fi + 1) * cw] = normal_rgba(oidx, nout)
    reduce_colors(sheets, MAX_COLORS)
    key = sheets["key"]
    op = key[..., 3] > 0
    for c in {tuple(v) for v in key[op][:, :3].tolist()}:
        if c not in KEY_RGB.values():
            colors.add(c)
    odir = os.path.join(out, sid)
    os.makedirs(odir, exist_ok=True)
    Image.fromarray(sheets["key"], "RGBA").save(os.path.join(odir, "sheet.key.png"), optimize=True)
    Image.fromarray(sheets["normal"], "RGBA").save(os.path.join(odir, "sheet.normal.png"), optimize=True)
    rows_out = []
    for r in rows:
        ro = {"name": r["name"], "frames": r["frames"], "fps": r["fps"] or 1, "loop": r["loop"]}
        if r["name"].startswith("attack"):
            ro["hitFrame"] = 3
        rows_out.append(ro)
    with open(os.path.join(odir, "sheet.json"), "w", encoding="utf-8") as f:
        json.dump({"cell": [cw, ch], "anchor": meta["anchor"], "rows": rows_out}, f, indent=2)
        f.write("\n")
    # previews (not part of the deliverable format): team-swapped sheets
    pdir = os.path.join(raw, "_preview")
    os.makedirs(pdir, exist_ok=True)
    for v in ("player", "enemy"):
        Image.fromarray(sheets[v], "RGBA").save(os.path.join(pdir, f"{sid}.{v}.png"))
    bad = [c for c in colors if c not in PAL]
    return {"colors": len(colors), "offPalette": len(bad)}


MAX_COLORS = 20


def _oklab(rgb):
    c = np.asarray(rgb, float) / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566], [0.0883024619, 0.2817188376, 0.6299787005]])
    m2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468], [1.9779984951, -2.4285922050, 0.4505937099], [0.0259040371, 0.7827717662, -0.8086757660]])
    return np.cbrt(c @ m1.T) @ m2.T


def reduce_colors(sheets, limit):
    """Keep at most `limit` non-team colours per figure: the rarest colour is merged into the
    perceptually nearest remaining one (OKLab) until the budget fits. Applied to all variants."""
    key = sheets["key"]
    op = key[..., 3] > 0
    keyset = set(KEY_RGB.values())
    cols, counts = np.unique(key[op][:, :3], axis=0, return_counts=True)
    hist = {tuple(int(v) for v in c): int(n) for c, n in zip(cols, counts) if tuple(int(v) for v in c) not in keyset}
    remap = {}
    while len(hist) > limit:
        rare = min(hist, key=hist.get)
        others = [c for c in hist if c != rare]
        lab = _oklab(rare)
        dist = [float(((_oklab(o) - lab) ** 2).sum()) for o in others]
        tgt = others[int(np.argmin(dist))]
        hist[tgt] += hist.pop(rare)
        for k, v in list(remap.items()):
            if v == rare:
                remap[k] = tgt
        remap[rare] = tgt
    if not remap:
        return
    key = key.copy()
    for v in ("key", "player", "enemy"):
        im = sheets[v]
        for src, dst in remap.items():
            m = (key[..., 0] == src[0]) & (key[..., 1] == src[1]) & (key[..., 2] == src[2]) & op
            im[m, :3] = dst


def main(raw, out, ids):
    # role ids = 1-based position in ramps.ROLES (same rule as blender_chibi.role_table)
    roles = RoleInfo({name: i + 1 for i, name in enumerate(ROLES)})
    subjects = ids or sorted(d for d in os.listdir(raw) if os.path.isdir(os.path.join(raw, d)) and not d.startswith("_"))
    report = {}
    for sid in subjects:
        report[sid] = process_subject(raw, out, sid, roles)
        print(sid, report[sid], flush=True)
    return report


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3:])
