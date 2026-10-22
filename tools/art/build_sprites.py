"""Hollow Crown – one-shot sprite build: Blender passes → pixel sheets → previews.

python tools/art/build_sprites.py [--render] [--save-blend] [--raw DIR] [id ...]

  --render      render the Blender passes headless first (needs Blender 5.x; path from $BLENDER or the
                default Windows install path)
  --save-blend  also rebuild everything into art/blender/hc_sprites.blend (no rendering)
  --raw DIR     where the raw passes live (default: <system temp>/hollow-crown-art-raw)
  id ...        units/props to build (default: all)

Outputs: art/sprites/units/<id>/ and art/sprites/props/<id>/ (sheet.key.png, sheet.normal.png,
sheet.json) plus art/sprites/preview_units.png and art/sprites/preview_props.png.
"""
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

UNITS = ["kael", "avatar", "brenna", "tobin", "brigand", "bandit_archer", "grosk", "mira", "hask", "liora", "varek",
         "morra", "mercenary", "archer", "fighter", "mage", "soldier"]
PROPS = ["tree", "house", "fort", "wagon", "shrine", "chest", "rock", "ruins"]
DEFAULT_BLENDER = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"


def blender(args):
    exe = os.environ.get("BLENDER", DEFAULT_BLENDER)
    cmd = [exe, "-b", "--factory-startup", "--python", os.path.join(HERE, "render_cli.py"), "--"] + args
    print("$", " ".join(cmd), flush=True)
    subprocess.run(cmd, check=True)


def main(argv):
    raw = os.path.join(tempfile.gettempdir(), "hollow-crown-art-raw")
    render = "--render" in argv
    save_blend = "--save-blend" in argv
    if "--raw" in argv:
        raw = argv[argv.index("--raw") + 1]
        argv = [a for a in argv if a != raw]
    ids = [a for a in argv if not a.startswith("--")] or UNITS + PROPS
    if render:
        blender([raw] + ids)
    if save_blend:
        blender([raw, "--norender"] + UNITS + PROPS + ["--save", os.path.join(ROOT, "art", "blender", "hc_sprites.blend")])
    import pixelize
    import previews
    out = os.path.join(ROOT, "art", "sprites")
    units = [i for i in ids if i in UNITS]
    props = [i for i in ids if i not in UNITS]
    if units:
        pixelize.main(raw, os.path.join(out, "units"), units)
    if props:
        pixelize.main(raw, os.path.join(out, "props"), props)
    previews.contact(out, os.path.join(out, "preview_units.png"), 2)
    previews.props(out, os.path.join(out, "preview_props.png"), 2)


if __name__ == "__main__":
    main(sys.argv[1:])
