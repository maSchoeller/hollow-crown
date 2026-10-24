"""Hollow Crown – rebuild every image-to-3D board figure (concept/23-art-direction §4.6).

pnpm art:tripo [<id> ...]        (needs Blender; BLENDER=<path to blender> if it is not on PATH)

For each art/models/source/<id>_board_tripo.glb (Tripo export: rig, animations, team cloth in key magenta)
runs tools/art/prepare_tripo_unit.py and writes art/models/units/<id>.glb, which `pnpm art:build` copies
into public/assets like the Blender figures. tools/art/export_models.py skips these ids.
Animations a figure's export lacks come from the humanoid library ANIM_LIBRARY (Kael's Tripo export with the AI
slash), transferred rest-pose-relative; so a new figure only needs the Tripo auto-rig.
Then gltfpack (meshoptimizer, devDependency) quantizes and meshopt-compresses the figure (about half the transfer size);
src/render/models.ts decodes it with the bundled decoder. Named nodes (bones, hand sockets) and vertex colours stay.
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
ANIM_LIBRARY = os.path.join(SOURCE, "kael_board_tripo.glb")
GLTFPACK = os.path.join(ROOT, "node_modules", ".bin", "gltfpack.cmd" if os.name == "nt" else "gltfpack")

blender = os.environ.get("BLENDER") or shutil.which("blender")
if not blender:
    sys.exit("Blender not found: put it on PATH or set BLENDER")
ids = sys.argv[1:] or sorted(os.path.basename(p)[: -len("_board_tripo.glb")]
                             for p in glob.glob(os.path.join(SOURCE, "*_board_tripo.glb")))
for uid in ids:
    src = os.path.join(SOURCE, f"{uid}_board_tripo.glb")
    dst = os.path.join(UNITS, f"{uid}.glb")
    raw = os.path.join(UNITS, f"{uid}.raw.glb")
    res = subprocess.run([blender, "-b", "--factory-startup", "--python-exit-code", "1", "--python", os.path.join(HERE, "prepare_tripo_unit.py"),
                          "--", src, raw, "--anims", ANIM_LIBRARY], capture_output=True, text=True)
    lines = [l for l in res.stdout.splitlines() if l.startswith("[hc]")]
    if res.returncode or not lines:
        sys.exit(f"{uid}: failed\n{res.stdout[-2000:]}\n{res.stderr[-2000:]}")
    # -kn keeps bones and sockets, -km the material with the base colour map, -af 12 the board's animation rate
    pack = subprocess.run([GLTFPACK, "-i", raw, "-o", dst, "-kn", "-km", "-c", "-af", "12"], capture_output=True, text=True)
    if pack.returncode:
        sys.exit(f"{uid}: gltfpack failed (pnpm install?)\n{pack.stdout[-2000:]}\n{pack.stderr[-2000:]}")
    os.remove(raw)
    print("\n".join(lines))
    print(f"[hc] {dst}: packed {os.path.getsize(dst) // 1024} KB", flush=True)
