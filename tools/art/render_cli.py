"""Hollow Crown – headless sprite rendering.

blender -b --factory-startup --python tools/art/render_cli.py -- <raw_dir> <id> [<id> ...] [--save <file.blend>]

Builds the requested units/props from scratch in a fresh scene "HC_Sprites" and renders their passes
into <raw_dir> (see blender_render.py). With --save, all built subjects stay in the scene and the
file is saved (used for art/blender/hc_sprites.blend).
"""
import os
import sys
import time

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
save = None
if "--save" in argv:
    i = argv.index("--save")
    save = argv[i + 1]
    argv = argv[:i] + argv[i + 2:]
norender = "--norender" in argv
argv = [a for a in argv if a != "--norender"]
raw, ids = argv[0], argv[1:]

ns = {"HC_TOOLS": HERE, "__file__": os.path.join(HERE, "blender_load.py")}
exec(compile(open(os.path.join(HERE, "blender_load.py"), encoding="utf-8").read(), "blender_load.py", "exec"), ns)
t0 = time.time()
for sid in ids:
    t = time.time()
    if sid in ns["UNITS"]:
        ns["build_units"]([sid])
        n = 0 if norender else ns["render_unit"](sid, raw)
    else:
        ns["build_props"]([sid])
        n = 0 if norender else ns["render_prop_id"](sid, raw)
    print(f"[hc] {sid}: {n} frames in {time.time() - t:.1f}s", flush=True)
if save:
    sc = ns["get_scene"]()
    for name in [s.name for s in bpy.data.scenes if s.name != ns["SCENE"]]:
        bpy.data.scenes.remove(bpy.data.scenes[name])
    for ob in list(bpy.data.objects):
        if not ob.users_collection:
            bpy.data.objects.remove(ob)
    for col in sc.collection.children:
        col.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(save), compress=True)
    print(f"[hc] saved {save}", flush=True)
print(f"[hc] done in {time.time() - t0:.1f}s", flush=True)
