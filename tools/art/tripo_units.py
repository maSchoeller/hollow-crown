"""Hollow Crown – rebuild every image-to-3D board figure (concept/23-art-direction §4.6).

pnpm art:tripo [<id> ...]        (needs Blender; BLENDER=<path to blender> if it is not on PATH)

For each art/models/source/<id>_board_tripo.glb (Tripo export: rig, animations, team cloth in key magenta)
runs tools/art/prepare_tripo_unit.py and writes art/models/units/<id>.glb, which `pnpm art:build` copies
into public/assets like the Blender figures. tools/art/export_models.py skips these ids.
"""
import glob
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SOURCE = os.path.join(ROOT, "art", "models", "source")
UNITS = os.path.join(ROOT, "art", "models", "units")

blender = os.environ.get("BLENDER") or shutil.which("blender")
if not blender:
    sys.exit("Blender not found: put it on PATH or set BLENDER")
ids = sys.argv[1:] or sorted(os.path.basename(p)[: -len("_board_tripo.glb")]
                             for p in glob.glob(os.path.join(SOURCE, "*_board_tripo.glb")))
for uid in ids:
    src = os.path.join(SOURCE, f"{uid}_board_tripo.glb")
    dst = os.path.join(UNITS, f"{uid}.glb")
    res = subprocess.run([blender, "-b", "--factory-startup", "--python-exit-code", "1", "--python", os.path.join(HERE, "prepare_tripo_unit.py"),
                          "--", src, dst], capture_output=True, text=True)
    lines = [l for l in res.stdout.splitlines() if l.startswith("[hc]")]
    if res.returncode or not lines:
        sys.exit(f"{uid}: failed\n{res.stdout[-2000:]}\n{res.stderr[-2000:]}")
    print("\n".join(lines))
