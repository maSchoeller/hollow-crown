"""Hollow Crown – cinematic reference render of a story film (Epic 16) in Blender (Cycles CPU).

python tools/art/film_render.py <film.yaml> [--out art/previews/films/<name>] [--stills] [--video] [--shots 1,4,8]
                                [--res 720x1280] [--samples 48] [--video-res 360x640] [--video-samples 6] [--fps 24]
                                [--fix <camera_fixes.yaml>]

Parses the film YAML (content/acts/*/films/), its map and the units it needs, writes one JSON job and runs
`blender -b -P tools/art/blender_film.py -- <job.json>`. The unit GLBs are meshopt-compressed for the web; gltfpack
(devDependency) unpacks them into a cache first because Blender's glTF importer cannot read EXT_meshopt_compression.
--stills renders one hero frame per shot (shot_NN_<line>.png) and contact.png, --video the animatic film.mp4.
Default: both. Python 3.12+ with PyYAML and Pillow (tools/art/requirements.txt).
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import time

import numpy as np

import yaml
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GLTFPACK = os.path.join(ROOT, "node_modules", ".bin", "gltfpack.cmd" if os.name == "nt" else "gltfpack")
CACHE = os.path.join(tempfile.gettempdir(), "hc_film_cache")
# actor id -> unit model when the film does not name one (the character Lucan is the figure kael)
DEFAULT_MODEL = {"avatar": "avatar_a"}


def load(path):
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def unpack_unit(model):
    """Meshopt-compressed board figure -> plain GLB Blender can import (cached by mtime)."""
    src = os.path.join(ROOT, "art", "models", "units", model + ".glb")
    dst = os.path.join(CACHE, model + ".glb")
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        os.makedirs(CACHE, exist_ok=True)
        subprocess.run([GLTFPACK, "-noq", "-kn", "-km", "-ke", "-i", src, "-o", dst], check=True, capture_output=True)
    return dst


def poster(path):
    """A wanted poster (four faces and a line): parchment texture for the house walls in the poster shot."""
    w, h = 256, 340
    img = Image.new("RGB", (w, h), (226, 208, 168))
    d = ImageDraw.Draw(img)
    for i in range(0, h, 7):  # paper fibres
        d.line([(0, i), (w, i + 3)], fill=(214, 195, 152), width=1)
    d.rectangle([18, 16, w - 18, 52], fill=(70, 38, 30))
    for i, (cx, cy) in enumerate([(78, 118), (178, 118), (78, 218), (178, 218)]):
        d.rectangle([cx - 44, cy - 44, cx + 44, cy + 44], outline=(90, 60, 45), width=3)
        d.ellipse([cx - 22, cy - 30, cx + 22, cy + 18], fill=(92, 66, 52))
        d.pieslice([cx - 36, cy + 6, cx + 36, cy + 70], 180, 360, fill=(92, 66, 52))
    for y in (284, 300, 316):
        d.line([(30, y), (w - 30, y)], fill=(80, 50, 40), width=5)
    d.rectangle([0, 0, w - 1, h - 1], outline=(170, 140, 100), width=4)
    img.filter(ImageFilter.GaussianBlur(0.6)).save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("film")
    ap.add_argument("--out")
    ap.add_argument("--stills", action="store_true")
    ap.add_argument("--video", action="store_true")
    ap.add_argument("--shots", default="")
    ap.add_argument("--res", default="720x1280")
    ap.add_argument("--samples", type=int, default=48)
    ap.add_argument("--video-res", default="360x640")
    ap.add_argument("--video-samples", type=int, default=6)
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--fix", help="YAML {line: {camera: {...}, hero: 0..1, fstop: n}} merged over the film's shots (default <out>/camera_fixes.yaml)")
    a = ap.parse_args()
    if not a.stills and not a.video:
        a.stills = a.video = True

    film = load(a.film)
    act_dir = os.path.dirname(os.path.dirname(os.path.abspath(a.film)))
    mp = load(os.path.join(act_dir, "maps", film["map"] + ".yaml"))
    name = film["id"].split(".", 1)[1].replace(".", "_")
    out = os.path.abspath(a.out or os.path.join(ROOT, "art", "previews", "films", name))
    os.makedirs(out, exist_ok=True)
    os.makedirs(CACHE, exist_ok=True)

    scene = load(os.path.join(act_dir, "scenes", film["scene"] + ".yaml"))
    speakers = {ln["id"]: (ln.get("speaker") or [None])[0] for ln in scene.get("lines", [])}
    for sh in film["shots"]:
        sh["speaker"] = speakers.get(sh["line"])
    fix_path = a.fix or os.path.join(out, "camera_fixes.yaml")
    fixes = load(fix_path) if os.path.exists(fix_path) else {}
    for sh in film["shots"]:
        fx = (fixes or {}).get(sh["line"], {})
        if "camera" in fx:
            sh["camera"] = {**sh["camera"], **fx["camera"]}
        for k in ("hero", "fstop"):
            if k in fx:
                sh[k] = fx[k]
    actors = []
    for ac in film["actors"]:
        model = ac.get("model") or DEFAULT_MODEL.get(ac["id"], ac["id"])
        actors.append({**ac, "model": model, "glb": unpack_unit(model), "team": ac.get("team", "player")})
    poster_png = os.path.join(CACHE, "poster.png")
    poster(poster_png)

    job = {
        "root": ROOT, "out": out, "film": {**film, "actors": actors},
        "map": {"size": mp["size"], "legend": mp["legend"], "terrain": mp["terrain"].rstrip("\n").split("\n"),
                "timeOfDay": mp.get("timeOfDay"), "weather": mp.get("weather")},
        "poster": poster_png, "stills": a.stills, "video": a.video,
        "shots": [int(s) for s in a.shots.split(",") if s],
        "res": [int(v) for v in a.res.split("x")], "samples": a.samples,
        "videoRes": [int(v) for v in a.video_res.split("x")], "videoSamples": a.video_samples, "fps": a.fps,
    }
    job_path = os.path.join(CACHE, "job.json")
    with open(job_path, "w", encoding="utf-8") as f:
        json.dump(job, f)
    script = os.path.join(ROOT, "tools", "art", "blender_film.py")
    started = time.time()
    r = subprocess.run(["blender", "-b", "--factory-startup", "-P", script, "--", job_path])
    if r.returncode:
        sys.exit(r.returncode)
    if a.stills:
        for f in os.listdir(out):
            if f.startswith("shot_") and f.endswith(".png") and os.path.getmtime(os.path.join(out, f)) >= started:
                finish(os.path.join(out, f))
        contact(out)


def finish(path):
    """Vignette and film grain on a still (done here: the compositor's ellipse mask left a disc in the frame centre)."""
    im = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32) / 255
    h, w = im.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    vig = 1 - 0.32 * np.clip((r - 0.35) / 0.65, 0, 1) ** 1.6
    rng = np.random.default_rng(abs(hash(os.path.basename(path))) % 2**32)
    grain = rng.normal(0, 0.015, (h, w, 1)) * (0.6 + 0.4 * (1 - im.mean(axis=2, keepdims=True)))
    out = np.clip(im * vig[..., None] + grain, 0, 1)
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(path)


def contact(out):
    """All hero stills in one small grid (contact.png)."""
    shots = sorted(f for f in os.listdir(out) if f.startswith("shot_") and f.endswith(".png"))
    if not shots:
        return
    tw, th, cols = 180, 320, 6
    rows = (len(shots) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * 6, rows * th + (rows + 1) * 6), (18, 16, 22))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(shots):
        im = Image.open(os.path.join(out, f)).convert("RGB").resize((tw, th), Image.LANCZOS)
        x, y = 6 + (i % cols) * (tw + 6), 6 + (i // cols) * (th + 6)
        sheet.paste(im, (x, y))
        d.text((x + 5, y + 4), f[5:-4], fill=(250, 240, 210))
    sheet.save(os.path.join(out, "contact.png"))


if __name__ == "__main__":
    main()
