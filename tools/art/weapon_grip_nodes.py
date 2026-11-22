"""Hollow Crown – name the grip point of every weapon model (story 16.9).

    python tools/art/weapon_grip_nodes.py [<dir or .glb> ...]      default: art/models/weapons-v2 (incl. sig/)

The weapon library (tools/art/blender_weapon_*.py, blender_weapon_signatures.py) builds every model with its origin in the fist and the
grip axis along glTF +Y (shaft end -> tip, the book's spine up), the cutting edge / broad side along +Z, +X = Y x Z: exactly the frame of
the palm sockets `grip_r` / `grip_l` of the figures (tools/art/prepare_tripo_unit.py sockets()). The grip point therefore is the model's
origin; this script only names it: an empty node `grip` with an identity transform at the top of the scene. A model that needs another
point (a tilt, a different hand position) builds it into this node instead of a rotation in render.yaml. Idempotent; run it after the
weapon scripts. The rune nodes `socket_rune_*` are not touched.
"""
import glob
import json
import os
import struct
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))


def add_grip(path):
    b = open(path, "rb").read()
    n = struct.unpack("<I", b[12:16])[0]
    js = json.loads(b[20:20 + n])
    if any(x.get("name") == "grip" for x in js["nodes"]):
        return False
    js["nodes"].append({"name": "grip"})
    js["scenes"][js.get("scene", 0)]["nodes"].append(len(js["nodes"]) - 1)
    raw = json.dumps(js, separators=(",", ":")).encode()
    raw += b" " * (-len(raw) % 4)
    rest = b[20 + n:]
    out = b[:12] + struct.pack("<I", len(raw)) + b"JSON" + raw + rest
    out = out[:8] + struct.pack("<I", len(out)) + out[12:]
    open(path, "wb").write(out)
    return True


def main(args):
    files = []
    for a in args or [os.path.join(ROOT, "art", "models", "weapons-v2")]:
        files += [a] if a.endswith(".glb") else sorted(glob.glob(os.path.join(a, "**", "*.glb"), recursive=True))
    files = [f for f in files if os.sep + "runes-v2" + os.sep not in f]
    changed = sum(add_grip(f) for f in files)
    print(f"[hc] grip nodes: {changed} of {len(files)} models changed")


if __name__ == "__main__":
    main(sys.argv[1:])
