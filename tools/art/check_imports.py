"""CI guard: every third-party package imported by tools/art scripts must be installable and importable.

python tools/art/check_imports.py

Scans all .py files under tools/art with ast (lazy imports inside functions count, no tool code is run), skips the
standard library, local modules and the Blender-only modules, and imports everything else. Exit 1 lists the missing ones.
"""
import ast
import importlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BLENDER = {"bpy", "bmesh", "mathutils", "bpy_extras", "gpu"}

files = sorted(ROOT.rglob("*.py"))
local = {p.stem for p in files} | {p.name for p in ROOT.rglob("*") if p.is_dir()}

needed: dict[str, set[str]] = {}
for path in files:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names = [a.name for a in node.names]
        elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
            names = [node.module]
        else:
            continue
        for name in names:
            top = name.split(".")[0]
            if top in sys.stdlib_module_names or top in local or top in BLENDER:
                continue
            needed.setdefault(top, set()).add(path.relative_to(ROOT).as_posix())

missing = 0
for top in sorted(needed):
    try:
        importlib.import_module(top)
        print(f"ok       {top}")
    except ImportError as err:
        missing += 1
        print(f"MISSING  {top} ({err}); used in {', '.join(sorted(needed[top]))}")
        print("         -> add it to tools/art/requirements.txt")

sys.exit(1 if missing else 0)
