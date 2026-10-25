"""Hollow Crown – silhouette test of the board figures (concept/23-art-direction §4.2 "Silhouettentest", §4.3).

python tools/art/silhouettes.py [<id> ...]            (all Act-1 figures when no id is given)
pnpm art:silhouettes [<id> ...]
BLENDER=<path to blender> if Blender is not on PATH (default: Blender 5.2 under Program Files). Needs Pillow.

Every figure art/models/units/<id>.glb is posed in the first frame of its `idle` animation (rest pose), gets the weapon
group it typically carries on its hand sockets (see GEAR below), and is rendered (a) filled black and (b) in colour,
each from the front and from a 3/4 view (figure turned 45 degrees), with an orthographic camera tilted like the board
camera (content/core/render.yaml camera.tiltDeg, measured from the vertical). The contact sheet groups the figures
into company, lieutenants and generic enemies:
  art/previews/silhouettes_act1.png         true size at zoom "Mittel" on a 375 px wide phone (CSS pixels)
  art/previews/silhouettes_act1_large.png   the same sheet rendered at 3x for review
(art/previews/ is new: no preview folder existed. Like all art/**/*.png it is tracked by Git LFS.)

Scale (src/render/board.ts pptFor / basis, content/core/render.yaml):
  ppt = min(screen width, screen height) / zoomSteps[1]            = 375 / 10      = 37.5 px per tile
  the camera is orthographic, tilted by tiltDeg from the vertical, so a vertical world length is foreshortened by
  sin(tiltDeg) and a ground length by cos(tiltDeg)
  figure height on screen = model height * board.figureScale * sin(tiltDeg) * ppt
                          = 1.0 * 1.3 * sin(35 deg) * 37.5      ~ 28 px for the body (measured model height about 1.0 tile)
The script does not use this number to scale anything: the render itself uses ppt (orthographic scale = tiles per cell,
figure scaled by figureScale), so the silhouettes have exactly the on-screen size; the formula is printed per figure
next to the measured height of the black silhouette (weapon, hair and the ground depth of the feet included, hence taller). Device pixels are CSS pixels
times the pixel ratio (up to 2.5 on "Hoch", content/core/render.yaml quality).

Weapons: the figures carry their weapon only at runtime (src/render/board.ts gearOf): the first equippable weapon of the
unit's item list gives the weapon group (items.yaml weaponType -> render.yaml gear.weapons -> art/models/weapons/<model>.glb,
sockets socket_r / socket_l, rotated by `hold` degrees about the socket X axis outside an attack), a shield or other
off-hand item adds render.yaml gear.offHand. The item list comes from content (derive_gear()):
  - story figures: content/acts/act1/units.yaml (the avatar for avatar_a / avatar_b)
  - Act-1 bosses and generic enemies: the first unit with `sprite: <id>` and `items` in content/acts/act1/maps/*.yaml
  - figures without any unit data in content (wolf_rider, temple_guard): a lance, as agreed for this test (FALLBACK)
  - figures without data and without an agreed fallback (fenn, ulvric): no weapon, flagged "no data" on the sheet
"""
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
UNITS = os.path.join(ROOT, "art", "models", "units")
WEAPONS = os.path.join(ROOT, "art", "models", "weapons")
OUT = os.path.join(ROOT, "art", "previews")

# sheet groups (story 8.3 AC 1): company, lieutenants, generic enemies
GROUPS = [
    ("Company", ["avatar_a", "avatar_b", "kael", "brenna", "tobin", "fenn", "mira", "liora", "ysolde", "varek"]),
    ("Lieutenants", ["grosk", "hask", "morra", "ulvric"]),
    ("Generic enemies", ["brigand", "bandit_archer", "soldier", "wolf_rider", "mercenary", "temple_guard"]),
]
# no unit data in content for these: agreed fallback weapon group (None = no weapon, flagged on the sheet)
FALLBACK = {"wolf_rider": "lance", "temple_guard": "lance"}
CELL_TILES = 1.92          # width and height of one cell in tiles (72 px at ppt 37.5)
GROUND_FROM_BOTTOM = 0.15  # the foot point sits this fraction of the cell above its bottom edge
PHONE_WIDTH = 375          # CSS px of the shorter screen side the test is run for


def load_yaml(path):
    import yaml
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_render():
    return load_yaml(os.path.join(ROOT, "content", "core", "render.yaml"))


def derive_gear(fid):
    """-> dict(items=[item ids], source=str, pieces=[{model, hand, hold}], note=str) for one figure id."""
    render = load_render()
    items = {i["id"]: i for i in load_yaml(os.path.join(ROOT, "content", "core", "items.yaml"))}
    gear = render["gear"]
    src, item_ids = None, None
    units = load_yaml(os.path.join(ROOT, "content", "acts", "act1", "units.yaml"))
    unit_id = "avatar" if fid in ("avatar_a", "avatar_b") else fid
    for u in units:
        if u["id"] == unit_id:
            item_ids = [r["def"] for r in u.get("items", [])]
            src = "units.yaml:" + unit_id
    if item_ids is None:
        for path in sorted(glob.glob(os.path.join(ROOT, "content", "acts", "act1", "maps", "*.yaml"))):
            m = load_yaml(path)
            pools = [m.get("units", [])] + [w.get("units", []) for w in m.get("reinforcements", []) if isinstance(w, dict)]
            for pool in pools:
                for u in pool or []:
                    if u.get("sprite") == fid and u.get("items"):
                        item_ids = [r["def"] for r in u["items"]]
                        src = f"maps/{os.path.basename(path)}:{u.get('id', '?')}"
                        break
                if item_ids:
                    break
            if item_ids:
                break
    pieces, note = [], ""
    if item_ids is None:
        if fid in FALLBACK and FALLBACK[fid]:
            w = FALLBACK[fid]
            pieces.append({**gear["weapons"][w], "group": w})
            src, note = f"FALLBACK {w} (no unit data)", "no data, lance assumed"
        else:
            src, note = "no data", "no data, no weapon"
        return {"items": [], "source": src, "pieces": pieces, "note": note}
    # same pick as autoEquip: first item of the slot; off-hand only if its hand differs (src/render/board.ts gearOf)
    main = next((items[i] for i in item_ids if items[i].get("slot") == "mainHand" and items[i].get("weaponType")), None)
    if main:
        pieces.append({**gear["weapons"][main["weaponType"]], "group": main["weaponType"]})
    off = next((items[i] for i in item_ids if items[i].get("slot") == "offHand" and items[i].get("group") in gear["offHand"]), None)
    if off:
        piece = {**gear["offHand"][off["group"]], "group": off["group"]}
        if not any(p["hand"] == piece["hand"] for p in pieces):
            pieces.append(piece)
    return {"items": item_ids, "source": src, "pieces": pieces, "note": ""}


# --------------------------------------------------------------------------------------------- Blender worker
def worker(argv):
    """Runs inside Blender: renders every job of the JSON file argv[0] into PNGs (see render_figure)."""
    import math

    import bpy
    from mathutils import Vector

    job = json.load(open(argv[0], encoding="utf-8"))
    tilt = math.radians(job["tiltDeg"])

    def clear():
        bpy.ops.wm.read_factory_settings(use_empty=True)

    def setup_camera(scene, px, ortho):
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
        scene.collection.objects.link(cam)
        cam.data.type = "ORTHO"
        cam.data.ortho_scale = ortho
        cam.data.shift_y = 0.5 - GROUND_FROM_BOTTOM  # foot point (world origin) to GROUND_FROM_BOTTOM above the cell bottom
        cam.rotation_euler = (tilt, 0, 0)  # looks north and down, tiltDeg from the vertical like the board camera
        cam.location = (0, -20 * math.sin(tilt), 20 * math.cos(tilt))
        scene.camera = cam
        scene.render.resolution_x = scene.render.resolution_y = px
        scene.render.resolution_percentage = 100
        scene.render.film_transparent = True
        scene.render.image_settings.file_format = "PNG"
        scene.render.image_settings.color_mode = "RGBA"
        scene.view_settings.view_transform = "Standard"

    def load_figure(fid, pieces):
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(UNITS, f"{fid}.glb"))
        new = [o for o in bpy.data.objects if o not in before]
        arm = next(o for o in new if o.type == "ARMATURE")
        for o in new:  # bone display shapes of the importer
            if o.type == "MESH" and o.parent is not arm:
                bpy.data.objects.remove(o)
        ad = arm.animation_data
        for t in list(ad.nla_tracks):
            ad.nla_tracks.remove(t)
        idle = bpy.data.actions["idle"]
        ad.action = idle
        bpy.context.scene.frame_set(int(idle.frame_range[0]))  # rest frame of the idle loop
        for p in pieces:
            socket = bpy.data.objects.get("socket_r" if p["hand"] == "right" else "socket_l")
            wb = set(bpy.data.objects)
            bpy.ops.import_scene.gltf(filepath=os.path.join(WEAPONS, f"{p['model']}.glb"))
            grip = bpy.data.objects.new("grip", None)
            bpy.context.scene.collection.objects.link(grip)
            grip.parent = socket  # identity parent inverse: the weapon is authored in the socket frame
            grip.rotation_euler = (math.radians(p.get("hold", 0)), 0, 0)  # content/core/render.yaml gear `hold`
            for o in [o for o in bpy.data.objects if o not in wb]:
                if o.parent is None:
                    o.parent = grip
                    o.matrix_parent_inverse.identity()
        return arm

    def set_pose(arm, yaw_deg, scale):
        arm.rotation_mode = "XYZ"  # the importer leaves quaternions
        arm.scale = (scale, scale, scale)
        arm.rotation_euler = (0, 0, math.radians(yaw_deg))
        bpy.context.view_layer.update()

    def shading(scene, black):
        scene.render.engine = "BLENDER_WORKBENCH"
        sh = scene.display.shading
        scene.display.render_aa = "8"
        sh.show_cavity = sh.show_shadows = sh.show_object_outline = sh.show_specular_highlight = False
        if black:
            sh.light, sh.color_type, sh.single_color = "FLAT", "SINGLE", (0, 0, 0)
        else:
            sh.light, sh.color_type = "STUDIO", "TEXTURE"
            sh.studio_light = "Default"
            sh.show_backface_culling = False

    def vertex_colours_to_materials():
        """Workbench colours need a viewport colour: the weapons' colour lives in vertex colours, so average it."""
        for o in bpy.data.objects:
            if o.type != "MESH" or not o.data.color_attributes:
                continue
            ca = o.data.color_attributes.active_color or o.data.color_attributes[0]
            n = len(ca.data)
            if not n or o.data.materials and o.data.materials[0].use_nodes and any(
                    nd.type == "TEX_IMAGE" for nd in o.data.materials[0].node_tree.nodes):
                continue
            cols = [c.color for c in ca.data]
            avg = [sum(c[i] for c in cols) / n for i in range(3)]
            mat = bpy.data.materials.new("avg")
            mat.diffuse_color = (*avg, 1)
            o.data.materials.clear()
            o.data.materials.append(mat)

    px1 = job["px"]
    for item in job["figures"]:
        fid = item["id"]
        for mult in job["mults"]:
            px = int(round(px1 * mult))
            clear()
            scene = bpy.context.scene
            setup_camera(scene, px, job["cellTiles"])
            arm = load_figure(fid, item["pieces"])
            vertex_colours_to_materials()
            for view, yaw in (("front", 0), ("q", 45)):
                set_pose(arm, yaw, job["figureScale"])
                for kind in ("sil", "col"):
                    shading(scene, kind == "sil")
                    scene.render.filepath = os.path.join(job["out"], f"{fid}_{view}_{kind}_{mult}x.png")
                    bpy.ops.render.render(write_still=True)
            # body height at rest in tiles (before figureScale): evaluated skinned meshes in world space
            dg = bpy.context.evaluated_depsgraph_get()
            zs = []
            for o in bpy.data.objects:
                if o.type == "MESH" and o.parent is arm:
                    ev = o.evaluated_get(dg)
                    me = ev.to_mesh()
                    zs += [(ev.matrix_world @ v.co).z for v in me.vertices]
                    ev.to_mesh_clear()
            item["modelHeight"] = round((max(zs) - min(zs)) / job["figureScale"], 4) if zs else 0
    json.dump(job["figures"], open(os.path.join(job["out"], "worker.json"), "w"), indent=1)


# --------------------------------------------------------------------------------------------- driver
def main():
    ids_arg = sys.argv[1:]
    all_ids = [i for _, g in GROUPS for i in g]
    ids = ids_arg or all_ids
    missing = [i for i in ids if not os.path.exists(os.path.join(UNITS, f"{i}.glb"))]
    if missing:
        sys.exit(f"no art/models/units/<id>.glb for: {', '.join(missing)}")
    blender = os.environ.get("BLENDER") or shutil.which("blender") or \
        r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
    if not os.path.exists(blender) and not shutil.which(blender):
        sys.exit("Blender not found: put it on PATH or set BLENDER")
    render = load_render()
    cam, scale = render["camera"], render["board"]["figureScale"]
    import math
    ppt = PHONE_WIDTH / cam["zoomSteps"][1]
    px = int(round(CELL_TILES * ppt))
    figures = []
    for fid in ids:
        g = derive_gear(fid)
        figures.append({"id": fid, **g})
        print(f"[hc] {fid:14s} gear {','.join(p['model'] + '@' + p['hand'] for p in g['pieces']) or '-':22s} from {g['source']}"
              f" items={g['items']}")
    tmp = tempfile.mkdtemp(prefix="hc_sil_")
    job = {"tiltDeg": cam["tiltDeg"], "px": px, "cellTiles": px / ppt, "mults": [1, 3], "figureScale": scale,
           "figures": figures, "out": tmp}
    jpath = os.path.join(tmp, "job.json")
    json.dump(job, open(jpath, "w"))
    res = subprocess.run([blender, "-b", "--factory-startup", "--python-exit-code", "1", "--python", os.path.abspath(__file__), "--", jpath],
                         capture_output=True, text=True)
    if res.returncode:
        sys.exit(f"Blender failed\n{res.stdout[-3000:]}\n{res.stderr[-2000:]}")
    figures = json.load(open(os.path.join(tmp, "worker.json")))
    compose(tmp, figures, ppt, px, scale, cam["tiltDeg"], math.sin(math.radians(cam["tiltDeg"])))
    shutil.rmtree(tmp, ignore_errors=True)


def compose(tmp, figures, ppt, px, scale, tilt, sin_t):
    from PIL import Image, ImageDraw, ImageFont
    os.makedirs(OUT, exist_ok=True)
    by_id = {f["id"]: f for f in figures}
    BG, PANEL, INK = (222, 217, 204), (236, 232, 222), (40, 36, 30)
    print(f"[hc] zoom Mittel: {PHONE_WIDTH} px / {ppt and PHONE_WIDTH / ppt:.0f} columns = {ppt} px per tile, cell {px} px, "
          f"figureScale {scale}, tilt {tilt} deg (vertical foreshortening sin = {sin_t:.3f})")
    for mult, name in ((1, "silhouettes_act1.png"), (3, "silhouettes_act1_large.png")):
        m = mult
        cell = px * m
        pad, head, label = 6 * m, 14 * m, 12 * m
        font = ImageFont.load_default(size=9 * m if m > 1 else 10)
        bold = ImageFont.load_default(size=11 * m)
        tile_w = 4 * cell + 3 * pad
        per_row = 4
        rows = []  # (group title, [figures])
        for title, g in GROUPS:
            sel = [i for i in g if i in by_id]
            if sel:
                rows.append((title, sel))
        height = pad
        for title, sel in rows:
            height += head + ((len(sel) + per_row - 1) // per_row) * (label + cell + pad * 2)
        width = per_row * (tile_w + pad * 2) + pad
        sheet = Image.new("RGB", (width, height + pad), BG)
        d = ImageDraw.Draw(sheet)
        y = pad
        for title, sel in rows:
            d.text((pad, y), f"{title}  (columns: front black | 3/4 black | front colour | 3/4 colour; true size = zoom Mittel x{m})",
                   fill=INK, font=bold)
            y += head
            for n, fid in enumerate(sel):
                x0 = pad + (n % per_row) * (tile_w + pad * 2)
                y0 = y + (n // per_row) * (label + cell + pad * 2)
                f = by_id[fid]
                tag = fid + ("  [" + ",".join(p["model"] for p in f["pieces"]) + "]" if f["pieces"] else "  [no weapon]")
                if f["note"]:
                    tag += "  " + f["note"]
                d.text((x0, y0), tag, fill=INK, font=font)
                for k, (view, kind) in enumerate((("front", "sil"), ("q", "sil"), ("front", "col"), ("q", "col"))):
                    im = Image.open(os.path.join(tmp, f"{fid}_{view}_{kind}_{m}x.png")).convert("RGBA")
                    cx = x0 + k * (cell + pad)
                    d.rectangle([cx, y0 + label, cx + cell - 1, y0 + label + cell - 1], fill=PANEL)
                    sheet.paste(im, (cx, y0 + label), im)
                    if kind == "sil" and view == "front" and m == 1:
                        bb = im.getchannel("A").point(lambda a: 255 if a > 127 else 0).getbbox()
                        f["silhouetteHeightPx"] = (bb[3] - bb[1]) if bb else 0
            y += ((len(sel) + per_row - 1) // per_row) * (label + cell + pad * 2)
        out = os.path.join(OUT, name)
        sheet.save(out)
        print(f"[hc] wrote {out} ({sheet.width}x{sheet.height})")
    for f in figures:
        formula = f["modelHeight"] * scale * sin_t * ppt
        print(f"[hc] {f['id']:14s} body height {f['modelHeight']:.3f} tile -> formula {formula:5.1f} px (body only), "
              f"black silhouette incl. weapon {f.get('silhouetteHeightPx', 0)} px")


if __name__ == "__main__":
    try:
        import bpy  # noqa: F401
        inside_blender = True
    except ImportError:
        inside_blender = False
    if inside_blender:
        worker(sys.argv[sys.argv.index("--") + 1:])
    else:
        main()
