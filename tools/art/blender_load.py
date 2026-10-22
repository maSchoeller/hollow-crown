"""Load the Hollow Crown sprite pipeline into one namespace inside Blender.

    ns = {}; exec(open(r"<repo>/tools/art/blender_load.py").read(), ns)
    ns["build_units"](["kael"]); ns["render_unit"]("kael", r"<raw_dir>")
"""
import os

_HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else globals().get("HC_TOOLS")
if not _HERE:
    _HERE = r"C:\_Data\01_sourcecode\github\hollow-crown\tools\art"
for _f in ("blender_chibi.py", "blender_parts.py", "blender_units.py", "blender_props.py", "blender_render.py"):
    _p = os.path.join(_HERE, _f)
    if os.path.exists(_p):
        exec(compile(open(_p, encoding="utf-8").read(), _p, "exec"), globals())
