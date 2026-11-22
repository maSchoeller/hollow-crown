"""Hollow Crown – rebuild every image-to-3D board figure (concept/23-art-direction §4.6).

pnpm art:tripo [<id> ...]        (needs Blender; BLENDER=<path to blender> if it is not on PATH)

For each art/models/source/<id>_board_tripo.glb (Tripo export: rig, animations, team cloth in key magenta)
runs tools/art/prepare_tripo_unit.py and writes art/models/units/<id>.glb, which `pnpm art:build` copies
into public/assets like the Blender figures. tools/art/export_models.py skips these ids.
Animations a figure's export lacks come from the humanoid library ANIM_LIBRARY (Lucan's old Tripo export lucan_anims_base.glb with the AI
slash, plus his flee and cheer export), transferred rest-pose-relative; so a new figure only needs the Tripo auto-rig.
Each packed figure is measured against the figure budget (tools/figure-budget.mjs: triangles, texture, gzip size).
tools/art/bake_vat.py then bakes the board animations of the raw figure into art/models/units/<id>.vat (story 7.8: 60 fps local poses, the
renderer plays them as vertex animation); the figure budget counts the .vat file with the model.
Then gltfpack (meshoptimizer, devDependency) quantizes and meshopt-compresses the figure (about half the transfer size);
src/render/models.ts decodes it with the bundled decoder. Named nodes (bones, hand sockets) and vertex colours stay.
Stances (story 16.10): figure_stances() reads which stances a figure needs from content/ (the classes that show it -> their weapon groups ->
`stance` / `stanceMod` of content/core/render.yaml gear) and hands the list to prepare_tripo_unit.py (`--stances`), which builds the clips of
tools/art/stance_poses.py. The model gltfpack packs is the lean one (without the stance clips; they live in the .vat only).
--keep-raw leaves art/models/units/<id>.raw.glb (all clips; tools/art/stance_shots.py renders them) next to the figure.
"""
import glob
import os
import shutil
import subprocess
import sys

import yaml

import stance_poses

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SOURCE = os.path.join(ROOT, "art", "models", "source")
UNITS = os.path.join(ROOT, "art", "models", "units")
# first file wins on a name clash; the second holds the AI animations flee and cheer (named "...retreat...", "...victory cheer...");
# its name must not end in _board_tripo.glb or it would be built as a figure
ANIM_LIBRARY = [os.path.join(SOURCE, "lucan_anims_base.glb"), os.path.join(SOURCE, "lucan_anims_flee_cheer.glb")]
GLTFPACK = os.path.join(ROOT, "node_modules", ".bin", "gltfpack.cmd" if os.name == "nt" else "gltfpack")

CONTENT = os.path.join(ROOT, "content")


def load_yaml(*parts):
    with open(os.path.join(CONTENT, *parts), encoding="utf8") as f:
        return yaml.safe_load(f)


def figure_stances():
    """-> {figure id: [stance keys]}: the stances of the classes that show each figure, in a stable order, `none` last.

    A figure is shown by the class whose `art` (or id) it is, by a character (content/acts/*/units.yaml, lieutenants.yaml) of that id or
    `portrait`, and by map units naming it as `sprite` / `portrait`; each of those classes counts with its pro paths (`proPaths`). A class gives
    the stance of every main weapon group it may carry (weapon type -> `stance` of render.yaml gear.weapons; the group -> type from items.yaml), plus
    `<stance>_shield` where it also carries a shield, plus the stance of an off-hand group that sets its own (lute, focus: it replaces the
    weapon's). [ASSUMPTION A3] a figure only gets what its classes can carry.
    """
    classes = {c["id"]: c for c in load_yaml("core", "classes.yaml")}
    gear = load_yaml("core", "render.yaml")["gear"]
    group_type = {}
    for it in load_yaml("core", "items.yaml"):
        if it.get("kind") == "weapon" and it.get("group"):
            group_type[it["group"]] = it.get("weaponType", it["group"])

    def closure(cid, seen):
        if cid in classes and cid not in seen:
            seen.add(cid)
            for nxt in classes[cid].get("proPaths") or []:
                closure(nxt, seen)
        return seen

    shown = {}  # figure id -> class ids

    def show(fig, cid):
        if fig and cid in classes:
            shown.setdefault(fig, set()).update(closure(cid, set()))

    for cid, c in classes.items():
        show(c.get("art") or cid, cid)
    for pattern in ("acts/*/units.yaml", "acts/*/lieutenants.yaml"):
        for path in glob.glob(os.path.join(CONTENT, pattern)):
            with open(path, encoding="utf8") as f:
                for u in yaml.safe_load(f) or []:
                    for fig in {u.get("id"), u.get("portrait"), u.get("model"), u.get("sprite")}:
                        show(fig, u.get("class"))
    for path in glob.glob(os.path.join(CONTENT, "acts/*/maps/*.yaml")):
        with open(path, encoding="utf8") as f:
            for u in (yaml.safe_load(f) or {}).get("units") or []:
                for fig in {u.get("sprite"), u.get("portrait")}:
                    show(fig, u.get("class"))

    def stances_of(cid):
        groups = classes[cid].get("weaponGroups") or []
        out = []
        shield = "shield" in groups
        for g in groups:
            off = gear["offHand"].get(g)
            if off:
                if off.get("stance") and off["stance"] not in out:
                    out.append(off["stance"])
                continue
            main = gear["weapons"].get(group_type.get(g, g))
            st = main.get("stance") if main else None
            if st:
                for key in ([st, st + "_shield"] if shield and st in stance_poses.SHIELD_BASES else [st]):
                    if key not in out:
                        out.append(key)
        return out

    result = {}
    for fig, cids in shown.items():
        keys = []
        for cid in sorted(cids):
            for k in stances_of(cid):
                if k not in keys:
                    keys.append(k)
        result[fig] = sorted(keys, key=lambda k: (k.endswith("_shield"), k)) + ["none"]
    if "avatar_a" in result:  # the player picks one of two portraits, the class is the same
        result.setdefault("avatar_b", result["avatar_a"])
    return result  # figures no content shows yet (future characters) are missing: they get `none` only [ASSUMPTION]


blender = os.environ.get("BLENDER") or shutil.which("blender")
if not blender:
    sys.exit("Blender not found: put it on PATH or set BLENDER")
keep_raw = "--keep-raw" in sys.argv
args = [a for a in sys.argv[1:] if a != "--keep-raw"]
stances = figure_stances()
ids = args or sorted(os.path.basename(p)[: -len("_board_tripo.glb")]
                             for p in glob.glob(os.path.join(SOURCE, "*_board_tripo.glb")))
for uid in ids:
    src = os.path.join(SOURCE, f"{uid}_board_tripo.glb")
    dst = os.path.join(UNITS, f"{uid}.glb")
    raw = os.path.join(UNITS, f"{uid}.raw.glb")
    lean = os.path.join(UNITS, f"{uid}.lean.glb")
    keys = stances.get(uid, ["none"])
    res = subprocess.run([blender, "-b", "--factory-startup", "--python-exit-code", "1", "--python", os.path.join(HERE, "prepare_tripo_unit.py"),
                          "--", src, raw, "--stances", ",".join(keys), "--lean", lean] + [x for lib in ANIM_LIBRARY for x in ("--anims", lib)], capture_output=True, text=True)
    lines = [l for l in res.stdout.splitlines() if l.startswith("[hc]")]
    lines.insert(0, f"[hc] {uid}: stances {', '.join(keys)}")
    if res.returncode or not lines:
        sys.exit(f"{uid}: failed\n{res.stdout[-2000:]}\n{res.stderr[-2000:]}")
    vat = os.path.join(UNITS, f"{uid}.vat")
    baked = subprocess.run([sys.executable, os.path.join(HERE, "bake_vat.py"), raw, vat], capture_output=True, text=True)
    if baked.returncode:
        sys.exit(f"{uid}: bake_vat failed\n{baked.stdout[-2000:]}\n{baked.stderr[-2000:]}")
    lines += [l for l in baked.stdout.splitlines() if l.startswith("[hc]")]
    # -kn keeps bones and sockets, -km the material with the base colour map, -af 12 the board's animation rate
    pack = subprocess.run([GLTFPACK, "-i", lean, "-o", dst, "-kn", "-km", "-c", "-af", "12"], capture_output=True, text=True)
    if pack.returncode:
        sys.exit(f"{uid}: gltfpack failed (pnpm install?)\n{pack.stdout[-2000:]}\n{pack.stderr[-2000:]}")
    os.remove(lean)
    if not keep_raw:
        os.remove(raw)
    print("\n".join(lines))
    print(f"[hc] {dst}: packed {os.path.getsize(dst) // 1024} KB", flush=True)
    # triangles, base-colour texture and transfer size against figureBudget of content/packs.yaml (warns, never fails)
    budget = subprocess.run(["node", os.path.join(ROOT, "tools", "figure-budget.mjs"), dst], capture_output=True, text=True, cwd=ROOT)
    print("\n".join(f"[hc] {l}" for l in (budget.stdout + budget.stderr).splitlines() if l.strip()), flush=True)
