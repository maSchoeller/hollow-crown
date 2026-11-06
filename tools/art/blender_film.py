"""Hollow Crown – cinematic reference render of a story film in Blender 4.2 (Cycles CPU), Epic 16.

Usually run through the wrapper, which parses the YAML and writes the job:
    python tools/art/film_render.py content/acts/act1/films/film.m1_1.intro.yaml [--stills] [--video]
Directly:
    blender -b --factory-startup -P tools/art/blender_film.py -- <job.json>

Builds a diorama of the map (ground from a terrain mask with soft transitions, river, bridge, walls, houses, stalls,
trees, landscape around the board), places the film's actors (board figures with their armature actions walk / idle /
cheer / hit / attack), one camera per shot (portrait, vertical fov, eased move over the shot's ms, then hold) and cuts
them with timeline markers. Coordinates: tile [x, y] -> Blender (x + 0.5, -(y + 0.5), h), camera [x, h, y] the same;
1 tile = 1 Blender unit, the figures stand 0.8 * figureScale (1.3) tiles tall as on the board.
"""
import json
import math
import os
import sys
import time

import bpy
from mathutils import Vector

JOB = json.load(open(sys.argv[sys.argv.index("--") + 1], encoding="utf-8"))
ROOT = JOB["root"]
FILM = JOB["film"]
MAP = JOB["map"]
FPS = JOB["fps"]
PROPS = os.path.join(ROOT, "art", "models", "props")

FIGURE_SCALE = 1.3          # content/core/render.yaml board.figureScale
LEVEL = 0.85                # render.yaml levelHeight
RIVER_BED, SHALLOW_BED, WATER = -0.32, -0.16, -0.09
TEAM = {"player": (0.13, 0.27, 0.56), "enemy": (0.55, 0.13, 0.09)}  # team ui colour, muted for the film look
# landscape around the board (tiles)
X0, X1, Y0, Y1 = -26, 42, -18, 46

# Look: sun of a late-summer early afternoon from the south-south-west, warm; sky fill cooler
SUN_ELEV, SUN_AZ = 27.0, -62.0   # degrees; azimuth 0 = light from the south, negative = from the west
SUN_COLOR, SUN_STRENGTH = (1.0, 0.78, 0.55), 6.5
SKY_STRENGTH = 0.24
HAZE = (0.78, 0.80, 0.82)


def W(x, y, h=0.0):
    return Vector((x + 0.5, -(y + 0.5), h))


def h32(*v):
    """Deterministic hash in [0, 1)."""
    n = 2166136261
    for a in v:
        n = ((n ^ (int(a) & 0xFFFFFFFF)) * 16777619) & 0xFFFFFFFF
    n ^= n >> 13
    n = (n * 1274126177) & 0xFFFFFFFF
    return (n & 0xFFFFFF) / float(0x1000000)


# ---------------------------------------------------------------- terrain
LEG = MAP["legend"]
GRID = MAP["terrain"]
MW, MH = MAP["size"]


def terrain(x, y):
    if 0 <= x < MW and 0 <= y < MH:
        return LEG[GRID[y][x]]
    if y in (13, 14):
        return "river"
    if y == 12:
        return "road"
    if y >= MH and x in (7, 8):
        return "road"
    if y < 0:
        return "forest" if h32(x, y, 3) > 0.78 and y < -3 else "grass"
    near = min(abs(x - 7.5), 30)
    if y >= MH or x < 0 or x >= MW:
        if y in (11, 15) or (abs(x - 7.5) < 3 and y > 12):
            return "grass"
        if y >= MH and 2.5 < near < 14:
            return "forest" if h32(x, y, 7) > 0.55 else "grass"
        return "forest" if h32(x, y, 7) > (0.8 if near < 12 else 0.68) else "grass"
    return "grass"


def height(t, x, y):
    if t in ("wall", "rampart"):
        return LEVEL
    if t == "stairs" and y == 0:
        return LEVEL
    if t == "tower_top":
        return 2 * LEVEL
    if t in ("river", "bridge"):
        return RIVER_BED
    if t == "shallows":
        return SHALLOW_BED
    return 0.0


def is_stone(t, x, y):
    return t in ("wall", "rampart", "tower_top") or (t == "stairs" and y == 0)


# ---------------------------------------------------------------- materials
def node_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links


def mask_image():
    """Terrain mask, one pixel per tile: R dirt road, G grass, B riverbed, A cobbles (town)."""
    w, h = X1 - X0, Y1 - Y0
    img = bpy.data.images.new("terrain_mask", w, h, alpha=True, float_buffer=True)
    px = [0.0] * (w * h * 4)
    for r in range(h):
        y = Y1 - 1 - r
        for i in range(w):
            x = X0 + i
            t = terrain(x, y)
            k = (r * w + i) * 4
            road = t in ("road", "well", "stall")
            town = 0 <= x < MW and 0 <= y <= 12
            px[k] = 1.0 if road and not town else 0.0
            px[k + 1] = 1.0 if t in ("grass", "forest") else 0.0
            px[k + 2] = 1.0 if t in ("river", "bridge", "shallows") else 0.0
            px[k + 3] = 1.0 if road and town else 0.0
    img.pixels.foreach_set(px)
    img.alpha_mode = "CHANNEL_PACKED"
    img.pack()
    return img


def ground_material():
    m, n, l = node_mat("ground")
    out = n["Material Output"]
    bsdf = n["Principled BSDF"]
    geo = n.new("ShaderNodeNewGeometry")
    # soft mask lookup, coordinates distorted by noise so tile borders do not run straight
    dist = n.new("ShaderNodeTexNoise"); dist.inputs["Scale"].default_value = 1.6; dist.inputs["Detail"].default_value = 3
    sub = n.new("ShaderNodeVectorMath"); sub.operation = "SUBTRACT"; sub.inputs[1].default_value = (0.5, 0.5, 0.5)
    l.new(dist.outputs["Color"], sub.inputs[0])
    sc = n.new("ShaderNodeVectorMath"); sc.operation = "SCALE"; sc.inputs["Scale"].default_value = 0.55
    l.new(sub.outputs[0], sc.inputs[0])
    add = n.new("ShaderNodeVectorMath"); add.operation = "ADD"
    l.new(geo.outputs["Position"], dist.inputs["Vector"])
    l.new(geo.outputs["Position"], add.inputs[0]); l.new(sc.outputs[0], add.inputs[1])
    mp = n.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / (X1 - X0), 1 / (Y1 - Y0), 1)
    mp.inputs["Location"].default_value = (-X0 / (X1 - X0), Y1 / (Y1 - Y0), 0)
    l.new(add.outputs[0], mp.inputs["Vector"])
    tex = n.new("ShaderNodeTexImage"); tex.image = mask_image(); tex.interpolation = "Linear"; tex.extension = "EXTEND"
    tex.image.colorspace_settings.name = "Non-Color"
    l.new(mp.outputs[0], tex.inputs["Vector"])
    sep = n.new("ShaderNodeSeparateColor"); l.new(tex.outputs["Color"], sep.inputs[0])

    def sharpen(sock, lo=0.3, hi=0.7):
        r = n.new("ShaderNodeMapRange"); r.inputs["From Min"].default_value = lo; r.inputs["From Max"].default_value = hi
        l.new(sock, r.inputs["Value"])
        return r.outputs["Result"]

    def noise_col(scale, c1, c2, detail=6):
        nz = n.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = scale; nz.inputs["Detail"].default_value = detail
        l.new(geo.outputs["Position"], nz.inputs["Vector"])
        ramp = n.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.35; ramp.color_ramp.elements[0].color = (*c1, 1)
        ramp.color_ramp.elements[1].position = 0.65; ramp.color_ramp.elements[1].color = (*c2, 1)
        l.new(nz.outputs["Fac"], ramp.inputs[0])
        return ramp.outputs[0], nz.outputs["Fac"]

    dirt, dirt_f = noise_col(3.0, (0.30, 0.22, 0.13), (0.45, 0.36, 0.23))
    grass, grass_f = noise_col(1.4, (0.16, 0.24, 0.05), (0.36, 0.38, 0.11), 8)
    # small-scale speckle in the grass (dry blades)
    sp, sp_f = noise_col(40.0, (0.12, 0.19, 0.04), (0.48, 0.45, 0.20), 2)
    gmix = n.new("ShaderNodeMix"); gmix.data_type = "RGBA"; gmix.inputs["Factor"].default_value = 0.35
    l.new(grass, gmix.inputs["A"]); l.new(sp, gmix.inputs["B"])
    road, road_f = noise_col(6.0, (0.42, 0.33, 0.22), (0.56, 0.46, 0.32))
    bed, _ = noise_col(4.0, (0.16, 0.15, 0.09), (0.30, 0.27, 0.17))
    # cobbles: voronoi stones with dark joints
    vor = n.new("ShaderNodeTexVoronoi"); vor.feature = "DISTANCE_TO_EDGE"; vor.inputs["Scale"].default_value = 9.0
    l.new(geo.outputs["Position"], vor.inputs["Vector"])
    joint = n.new("ShaderNodeMapRange"); joint.inputs["From Min"].default_value = 0.0; joint.inputs["From Max"].default_value = 0.09
    l.new(vor.outputs["Distance"], joint.inputs["Value"])
    vcol = n.new("ShaderNodeTexVoronoi"); vcol.inputs["Scale"].default_value = 9.0
    l.new(geo.outputs["Position"], vcol.inputs["Vector"])
    stone = n.new("ShaderNodeValToRGB")
    stone.color_ramp.elements[0].color = (0.33, 0.30, 0.26, 1); stone.color_ramp.elements[1].color = (0.58, 0.53, 0.45, 1)
    l.new(vcol.outputs["Color"], stone.inputs[0])
    cob = n.new("ShaderNodeMix"); cob.data_type = "RGBA"
    cob.inputs["A"].default_value = (0.13, 0.11, 0.09, 1)
    l.new(joint.outputs["Result"], cob.inputs["Factor"]); l.new(stone.outputs[0], cob.inputs["B"])

    c = dirt
    for sock, col in ((sharpen(sep.outputs[1], 0.25, 0.65), gmix.outputs["Result"]), (sharpen(sep.outputs[0]), road),
                      (sharpen(tex.outputs["Alpha"], 0.35, 0.6), cob.outputs["Result"]), (sharpen(sep.outputs[2], 0.2, 0.6), bed)):
        mx = n.new("ShaderNodeMix"); mx.data_type = "RGBA"
        l.new(sock, mx.inputs["Factor"]); l.new(c, mx.inputs["A"]); l.new(col, mx.inputs["B"])
        c = mx.outputs["Result"]
    l.new(c, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.92
    # bump: cobbles in town, fine noise elsewhere
    bmix = n.new("ShaderNodeMix"); bmix.data_type = "FLOAT"
    l.new(sharpen(tex.outputs["Alpha"], 0.35, 0.6), bmix.inputs["Factor"])
    l.new(sp_f, bmix.inputs["A"]); l.new(joint.outputs["Result"], bmix.inputs["B"])
    bump = n.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.35; bump.inputs["Distance"].default_value = 0.02
    l.new(bmix.outputs["Result"], bump.inputs["Height"]); l.new(bump.outputs[0], bsdf.inputs["Normal"])
    return m


def stone_material():
    m, n, l = node_mat("stone")
    bsdf = n["Principled BSDF"]
    geo = n.new("ShaderNodeNewGeometry")
    sepx = n.new("ShaderNodeSeparateXYZ"); l.new(geo.outputs["Position"], sepx.inputs[0])
    a = n.new("ShaderNodeMath"); a.operation = "ADD"; l.new(sepx.outputs[0], a.inputs[0]); l.new(sepx.outputs[1], a.inputs[1])
    comb = n.new("ShaderNodeCombineXYZ"); l.new(a.outputs[0], comb.inputs[0]); l.new(sepx.outputs[2], comb.inputs[1])
    br = n.new("ShaderNodeTexBrick"); br.inputs["Scale"].default_value = 1.0
    br.inputs["Brick Width"].default_value = 0.42; br.inputs["Row Height"].default_value = 0.2; br.inputs["Mortar Size"].default_value = 0.012
    br.inputs["Color1"].default_value = (0.50, 0.46, 0.40, 1); br.inputs["Color2"].default_value = (0.62, 0.57, 0.49, 1)
    br.inputs["Mortar"].default_value = (0.25, 0.23, 0.20, 1)
    l.new(comb.outputs[0], br.inputs["Vector"])
    nz = n.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 5
    l.new(geo.outputs["Position"], nz.inputs["Vector"])
    mx = n.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 0.35
    l.new(br.outputs["Color"], mx.inputs["A"]); l.new(nz.outputs["Color"], mx.inputs["B"])
    l.new(mx.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.85
    bump = n.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.5; bump.invert = True
    l.new(br.outputs["Fac"], bump.inputs["Height"]); l.new(bump.outputs[0], bsdf.inputs["Normal"])
    return m


def bank_material():
    m, n, l = node_mat("bank")
    bsdf = n["Principled BSDF"]
    nz = n.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 8
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.17, 0.12, 0.07, 1); ramp.color_ramp.elements[1].color = (0.33, 0.25, 0.15, 1)
    l.new(nz.outputs["Fac"], ramp.inputs[0]); l.new(ramp.outputs[0], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 1.0
    return m


def water_material():
    m, n, l = node_mat("water")
    bsdf = n["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.35, 0.55, 0.52, 1)
    bsdf.inputs["Roughness"].default_value = 0.03
    bsdf.inputs["IOR"].default_value = 1.333
    bsdf.inputs["Transmission Weight"].default_value = 1.0
    geo = n.new("ShaderNodeNewGeometry")
    nz = n.new("ShaderNodeTexNoise"); nz.noise_dimensions = "4D"; nz.inputs["Scale"].default_value = 3.5; nz.inputs["Detail"].default_value = 4
    l.new(geo.outputs["Position"], nz.inputs["Vector"])
    fc = nz.inputs["W"].driver_add("default_value")
    fc.driver.expression = "frame / 90"
    bump = n.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.12
    l.new(nz.outputs["Fac"], bump.inputs["Height"]); l.new(bump.outputs[0], bsdf.inputs["Normal"])
    vol = n.new("ShaderNodeVolumeAbsorption"); vol.inputs["Color"].default_value = (0.35, 0.6, 0.5, 1); vol.inputs["Density"].default_value = 1.2
    l.new(vol.outputs[0], n["Material Output"].inputs["Volume"])
    return m


# ---------------------------------------------------------------- ground mesh
def build_ground():
    import bmesh
    me = bpy.data.meshes.new("ground")
    bm = bmesh.new()
    H = {}
    for y in range(Y0, Y1):
        for x in range(X0, X1):
            t = terrain(x, y)
            H[(x, y)] = (height(t, x, y), 1 if is_stone(t, x, y) else 0)

    def quad(vs, mat):
        f = bm.faces.new([bm.verts.new(v) for v in vs])
        f.material_index = mat

    for (x, y), (h, st) in H.items():
        bx, by = x, -(y + 1)  # tile spans bx..bx+1, by..by+1
        quad([(bx, by, h), (bx + 1, by, h), (bx + 1, by + 1, h), (bx, by + 1, h)], st)
        for dx, dy, edge in ((1, 0, ((bx + 1, by), (bx + 1, by + 1))), (-1, 0, ((bx, by + 1), (bx, by))),
                             (0, -1, ((bx + 1, by + 1), (bx, by + 1))), (0, 1, ((bx, by), (bx + 1, by)))):
            hn = H.get((x + dx, y + dy), (-1.0, 0))[0]
            if hn < h - 1e-4:
                (ax, ay), (cx, cy) = edge
                quad([(ax, ay, hn), (cx, cy, hn), (cx, cy, h), (ax, ay, h)], st if st else 2)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("ground", me)
    for mat in (ground_material(), stone_material(), bank_material()):
        me.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    # water body over the river rows (closed box for the absorption volume)
    bpy.ops.mesh.primitive_cube_add()
    wb = bpy.context.active_object
    wb.name = "water"
    wb.scale = ((X1 - X0) / 2, 1.02, (WATER - RIVER_BED + 0.01) / 2)
    wb.location = ((X0 + X1) / 2, -14.0, (WATER + RIVER_BED - 0.01) / 2)
    wb.data.materials.append(water_material())
    # distant hills around the valley: break the white horizon, the mist pass turns them blue-grey
    hm, hn, hl = node_mat("hills")
    hn["Principled BSDF"].inputs["Base Color"].default_value = (0.20, 0.26, 0.10, 1)
    hn["Principled BSDF"].inputs["Roughness"].default_value = 1.0
    for i in range(18):
        a = i / 18 * 2 * math.pi + h32(i, 1) * 0.3
        r = 48 + 22 * h32(i, 2)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=(8 + r * math.sin(a), -10 + r * math.cos(a), -2))
        hill = bpy.context.active_object
        hill.scale = (14 + 10 * h32(i, 3), 10 + 8 * h32(i, 4), 5 + 6 * h32(i, 5))
        hill.data.materials.append(hm)
        bpy.ops.object.shade_smooth()
    return ob


# ---------------------------------------------------------------- props
_LIB = {}


def lib(name):
    if name in _LIB:
        return _LIB[name]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(PROPS, name + ".glb"))
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    for o in meshes:
        o.matrix_world = o.matrix_world.copy()
        o.parent = None
    if len(meshes) > 1:
        bpy.ops.object.select_all(action="DESELECT")
        for o in meshes:
            o.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.join()
    ob = meshes[0]
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for o in new:
        if o != ob and o.name in bpy.data.objects:
            bpy.data.objects.remove(o)
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    _LIB[name] = ob
    d = ob.dimensions
    print(f"[film] prop {name}: {d.x:.2f} x {d.y:.2f} x {d.z:.2f}")
    return ob


def place(name, pos, rot=0.0, scale=1.0):
    src = lib(name)
    ob = bpy.data.objects.new(name, src.data)
    ob.location = pos
    ob.rotation_euler = (0, 0, rot)
    ob.scale = (scale, scale, scale) if isinstance(scale, (int, float)) else scale
    bpy.context.scene.collection.objects.link(ob)
    return ob


def yaw_to(dx, dy):
    """Rotation about Z that turns a model facing -Y (south) toward (dx, dy) in Blender coordinates."""
    return math.atan2(dx, -dy)


def build_props():
    walk = ("road", "plain", "grass", "well", "stall")
    houses = ["house_intact", "house_b_intact", "house_c_intact", "house_d_intact"]
    lodge_pos = {}
    for y in range(Y0, Y1):
        for x in range(X0, X1):
            t = terrain(x, y)
            p = W(x, y)
            r = h32(x, y, 11)
            inside = 0 <= x < MW and 0 <= y < MH
            if t == "building":
                # face the nearest open street tile
                best = None
                for dx, dy in ((0, 1), (1, 0), (-1, 0), (0, -1)):
                    tn = terrain(x + dx, y + dy)
                    if tn in walk:
                        score = 2 if tn == "road" else 1
                        if best is None or score > best[0]:
                            best = (score, dx, dy)
                rot = yaw_to(best[1], -best[2]) if best else 0.0
                place(houses[int(r * 4) % 4], p, rot)
            elif t == "village":
                best = (0, 1) if terrain(x, y + 1) in walk else (1, 0) if terrain(x + 1, y) in walk else (-1, 0)
                place("lodge_b_intact", p, yaw_to(best[0], -best[1]))
                lodge_pos[(x, y)] = p
            elif t == "stall":
                place("market_a" if r < 0.5 else "market_b", p, yaw_to(1 if x < 8 else -1, 0))
            elif t == "well":
                place("well_idle", p)
            elif t == "forest":
                if inside:
                    place(["grove_a", "grove_b", "grove_c"][int(r * 3) % 3], p, int(r * 40) * math.pi / 2)
                else:
                    off = Vector(((h32(x, y, 1) - 0.5) * 0.5, (h32(x, y, 2) - 0.5) * 0.5, 0))
                    place("tree_a" if r < 0.5 else "tree_b", p + off, r * 6.28, 0.9 + 0.5 * h32(x, y, 5))
            elif t == "stairs" and y > 0:
                place("stairs_idle", p, 0.0)
            elif t == "grass":
                if r < 0.07:
                    place("bush_a", p + Vector(((h32(x, y, 4) - 0.5) * 0.6, (h32(x, y, 6) - 0.5) * 0.6, 0)), r * 90, 0.6 + 0.4 * h32(x, y, 9))
                elif r < 0.10:
                    place("rocks_small", p + Vector(((h32(x, y, 4) - 0.5) * 0.6, 0, 0)), r * 70, 0.8)
                elif r < 0.22 and abs(x - 7.5) > 1.6:
                    place("tussock_a", p + Vector(((h32(x, y, 4) - 0.5) * 0.7, (h32(x, y, 6) - 0.5) * 0.7, 0)), r * 50, 0.7)
            if t in ("river", "shallows") and y in (13, 14):
                if h32(x, y, 21) < 0.35 and t == "river":
                    yy = 12.62 if y == 13 else 14.38
                    place("reed_a" if r < 0.5 else "reed_b", Vector((x + h32(x, y, 22), -(yy + 0.5) + 0.5, WATER)), r * 40, 0.8)
            # merlons on wall and tower tiles (north and south edges)
            if t in ("wall", "rampart", "tower_top", "stairs") and y == 0:
                top = height(t, x, y)
                for k in range(3):
                    for edge in (-0.06, -0.94):
                        bpy.ops.mesh.primitive_cube_add(size=1, location=(x + 0.17 + k * 0.33, edge, top + 0.1))
                        mer = bpy.context.active_object
                        mer.scale = (0.18, 0.12, 0.2)
                        mer.data.materials.append(bpy.data.materials["stone"])
    # bridge: one span over both river rows, two lanes wide
    br = place("bridge_idle", Vector((8.0, -14.0, 0.0)), math.pi / 2, (1.0, 2.1, 1.0))
    # abutments: the model's open ends read as black holes on the bank
    for yb in (-15.07, -12.93):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(8.0, yb, -0.12))
        ab = bpy.context.active_object
        ab.scale = (1.8, 0.16, 0.5)
        ab.data.materials.append(bpy.data.materials["stone"])
    # dressing along the shore road and the south road
    for name, at, rot in (("barrels_a", (1.2, 11.75), 0.4), ("crates_a", (4.4, 11.3), -0.2), ("crates_a", (11.3, 11.2), 1.2),
                          ("sign_a", (6.3, 15.5), 0.3), ("street_lantern_a", (6.2, 12.2), 0), ("street_lantern_a", (9.8, 12.2), 0),
                          ("barrels_a", (12.4, 11.3), 2.0), ("lantern_post_a", (6.25, 16.9), 0)):
        place(name, Vector((at[0], -at[1], 0)), rot)
    return lodge_pos


def posters(lodge_pos, poster_png):
    """Wanted posters on the lodge at the shore (shot l06) and two on the town houses by the road."""
    m, n, l = node_mat("poster")
    tex = n.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(poster_png)
    bsdf = n["Principled BSDF"]; bsdf.inputs["Roughness"].default_value = 0.8
    l.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    for (x, y), p in lodge_pos.items():
        if y != 11:
            continue
        lo = lib("lodge_b_intact")
        hx, hy = lo.dimensions.x / 2, lo.dimensions.y / 2
        spots = [(-0.25, 0.28, 0.06), (0.05, 0.31, -0.08), (0.28, 0.26, 0.1)]
        for i, (u, z, tilt) in enumerate(spots):  # south face
            bpy.ops.mesh.primitive_plane_add(size=1, location=(p.x + u, p.y - hy - 0.012, z))
            pl = bpy.context.active_object
            pl.scale = (0.13, 0.17, 1); pl.rotation_euler = (math.pi / 2, tilt, 0)
            pl.data.materials.append(m)
        for i, (u, z, tilt) in enumerate([(-0.15, 0.3, -0.05), (0.18, 0.27, 0.07)]):  # east face
            bpy.ops.mesh.primitive_plane_add(size=1, location=(p.x + hx + 0.012, p.y + u, z))
            pl = bpy.context.active_object
            pl.scale = (0.13, 0.17, 1); pl.rotation_euler = (math.pi / 2, tilt, math.pi / 2)
            pl.data.materials.append(m)


# ---------------------------------------------------------------- scatter (grass, flowers) and haze
SCATTER = (-5, 22, 9, 30)  # tiles x0, x1, y0, y1 around the action


def scatter_material():
    m, n, l = node_mat("grass_blades")
    tip = n.new("ShaderNodeAttribute"); tip.attribute_name = "tip"
    var = n.new("ShaderNodeAttribute"); var.attribute_name = "var"
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.05, 0.10, 0.02, 1)
    ramp.color_ramp.elements[1].color = (0.42, 0.45, 0.13, 1)
    e = ramp.color_ramp.elements.new(0.55); e.color = (0.20, 0.32, 0.06, 1)
    l.new(tip.outputs["Fac"], ramp.inputs[0])
    dry = n.new("ShaderNodeMix"); dry.data_type = "RGBA"
    dry.inputs["B"].default_value = (0.55, 0.47, 0.22, 1)
    mr = n.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.55; mr.inputs["From Max"].default_value = 1.0
    l.new(var.outputs["Fac"], mr.inputs["Value"])
    mul = n.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; l.new(mr.outputs["Result"], mul.inputs[0]); l.new(tip.outputs["Fac"], mul.inputs[1])
    l.new(mul.outputs[0], dry.inputs["Factor"]); l.new(ramp.outputs[0], dry.inputs["A"])
    bsdf = n["Principled BSDF"]
    l.new(dry.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.55
    tr = n.new("ShaderNodeBsdfTranslucent"); l.new(dry.outputs["Result"], tr.inputs["Color"])
    mix = n.new("ShaderNodeMixShader"); mix.inputs[0].default_value = 0.35
    l.new(bsdf.outputs[0], mix.inputs[1]); l.new(tr.outputs[0], mix.inputs[2])
    l.new(mix.outputs[0], n["Material Output"].inputs["Surface"])
    return m


def flower_material():
    m, n, l = node_mat("flowers")
    c = n.new("ShaderNodeAttribute"); c.attribute_name = "fcol"
    bsdf = n["Principled BSDF"]
    l.new(c.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.5
    bsdf.inputs["Subsurface Weight"].default_value = 0.3
    bsdf.inputs["Subsurface Radius"].default_value = (0.02, 0.02, 0.02)
    return m


def build_scatter():
    import bmesh
    import random
    rnd = random.Random(7)
    open_t = {"grass": 1.0, "forest": 0.6, "plain": 0.25, "village": 0.0}
    gm, fm = bmesh.new(), bmesh.new()
    tip_g = gm.verts.layers.float.new("tip")
    var_g = gm.verts.layers.float.new("var")
    fcols = [(0.95, 0.92, 0.80), (0.98, 0.78, 0.18), (0.62, 0.45, 0.85), (0.95, 0.55, 0.60)]
    fl_col = []
    x0, x1, y0, y1 = SCATTER
    for ty in range(y0, y1):
        for tx in range(x0, x1):
            t = terrain(tx, ty)
            dens = open_t.get(t, 0.0)
            if ty in (12, 15) and t == "grass":
                dens = 0.7
            if not dens:
                continue
            far = min(abs(tx - 7.5) / 14, 1)
            count = int((70 - 40 * far) * dens)
            for _ in range(count):
                px, py = tx + rnd.random(), ty + rnd.random()
                # stay off the road edge: neighbours that are road thin the grass near the border
                if terrain(int(math.floor(px + (0.25 if px % 1 > 0.75 else -0.25 if px % 1 < 0.25 else 0))), ty) == "road":
                    if rnd.random() < 0.7:
                        continue
                bx, by = px, -py
                var = rnd.random()
                hgt = 0.05 + 0.11 * rnd.random() ** 1.5
                for _b in range(5):
                    a = rnd.random() * 6.283
                    lean = 0.25 + 0.5 * rnd.random()
                    ox, oy = bx + (rnd.random() - 0.5) * 0.06, by + (rnd.random() - 0.5) * 0.06
                    w = 0.009 + 0.006 * rnd.random()
                    ca, sa = math.cos(a), math.sin(a)
                    hb = hgt * (0.7 + 0.5 * rnd.random())
                    v0 = gm.verts.new((ox - sa * w, oy + ca * w, 0)); v1 = gm.verts.new((ox + sa * w, oy - ca * w, 0))
                    mx_, my_ = ox + ca * lean * hb * 0.4, oy + sa * lean * hb * 0.4
                    v2 = gm.verts.new((mx_ + sa * w * 0.6, my_ - ca * w * 0.6, hb * 0.6)); v3 = gm.verts.new((mx_ - sa * w * 0.6, my_ + ca * w * 0.6, hb * 0.6))
                    v4 = gm.verts.new((ox + ca * lean * hb, oy + sa * lean * hb, hb * 0.95))
                    for v, tp in ((v0, 0), (v1, 0), (v2, 0.6), (v3, 0.6), (v4, 1.0)):
                        v[tip_g] = tp; v[var_g] = var
                    gm.faces.new((v0, v1, v2, v3)); gm.faces.new((v3, v2, v4))
                if t in ("grass", "forest") and rnd.random() < 0.05:
                    col = fcols[int(rnd.random() * 4)]
                    sh = 0.07 + 0.08 * rnd.random()
                    cx, cy = bx + 0.05, by
                    # stem
                    s0 = fm.verts.new((cx - 0.004, cy, 0)); s1 = fm.verts.new((cx + 0.004, cy, 0)); s2 = fm.verts.new((cx, cy, sh))
                    fm.faces.new((s0, s1, s2)); fl_col.append((0.18, 0.30, 0.06))
                    r = 0.018 + 0.012 * rnd.random()
                    ctr = fm.verts.new((cx, cy, sh + 0.004))
                    ring = [fm.verts.new((cx + r * math.cos(k * 1.2566), cy + r * math.sin(k * 1.2566), sh - 0.002 + 0.006 * (k % 2))) for k in range(5)]
                    for k in range(5):
                        fm.faces.new((ctr, ring[k], ring[(k + 1) % 5])); fl_col.append(col)
    for name, bm, mat in (("grass_scatter", gm, scatter_material()), ("flowers", fm, flower_material())):
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        if name == "flowers":
            attr = me.color_attributes.new("fcol", "FLOAT_COLOR", "CORNER")
            k = 0
            for poly, c in zip(me.polygons, fl_col):
                for li in poly.loop_indices:
                    attr.data[li].color = (*c, 1)
        bm.free()
        me.materials.append(mat)
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        print(f"[film] {name}: {len(me.polygons)} faces")


def build_haze(density):
    """Volumetric haze over the action: god rays through the town and trees, softened distance."""
    bpy.ops.mesh.primitive_cube_add(location=(8, -14, 3.5))
    hz = bpy.context.active_object
    hz.name = "haze"
    hz.scale = (26, 24, 4.0)
    m, n, l = node_mat("haze")
    n.remove(n["Principled BSDF"])
    pv = n.new("ShaderNodeVolumePrincipled")
    pv.inputs["Density"].default_value = density
    pv.inputs["Anisotropy"].default_value = 0.55
    pv.inputs["Color"].default_value = (1.0, 0.95, 0.88, 1)
    # thinner with height, a little noise so it reads as dust in the light
    geo = n.new("ShaderNodeNewGeometry"); sep = n.new("ShaderNodeSeparateXYZ"); l.new(geo.outputs["Position"], sep.inputs[0])
    fall = n.new("ShaderNodeMapRange"); fall.inputs["From Min"].default_value = 0.0; fall.inputs["From Max"].default_value = 6.0
    fall.inputs["To Min"].default_value = 1.0; fall.inputs["To Max"].default_value = 0.15
    l.new(sep.outputs[2], fall.inputs["Value"])
    nz = n.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.35
    l.new(geo.outputs["Position"], nz.inputs["Vector"])
    mul = n.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; l.new(fall.outputs["Result"], mul.inputs[0]); l.new(nz.outputs["Fac"], mul.inputs[1])
    mul2 = n.new("ShaderNodeMath"); mul2.operation = "MULTIPLY"; mul2.inputs[1].default_value = density * 2
    l.new(mul.outputs[0], mul2.inputs[0]); l.new(mul2.outputs[0], pv.inputs["Density"])
    l.new(pv.outputs[0], n["Material Output"].inputs["Volume"])
    hz.data.materials.append(m)
    return hz


def build_dressing():
    """Hand-placed set dressing around the south road, the shore and the bridge (positions in Blender units)."""
    items = [
        ("fence_idle", (5.2, -16.6), math.pi / 2), ("fence_idle", (5.2, -17.6), math.pi / 2), ("fence_broken", (5.2, -18.6), math.pi / 2),
        ("fence_idle", (10.8, -16.4), math.pi / 2), ("fence_corner", (10.8, -17.4), math.pi / 2),
        ("wagon_idle", (11.6, -18.2), 0.5), ("hay_a", (12.4, -17.3), 0.2), ("hay_a", (12.1, -19.1), 1.3),
        ("rock_b", (4.3, -15.25), 0.3), ("rock_c", (11.3, -15.2), 1.1), ("rocks_small", (6.2, -15.3), 0.0), ("rocks_small", (9.6, -15.3), 2.0),
        ("boat_a", (3.6, -13.7), 0.15), ("mooring_a", (3.4, -12.85), 0.0),
        ("crates_a", (1.3, -12.35), 0.4), ("barrels_a", (12.5, -11.6), 2.0), ("crates_a", (13.4, -11.4), 0.9),
        ("banner_a", (4.5, -0.6, 2 * LEVEL), 0.0), ("banner_a", (12.5, -0.6, 2 * LEVEL), 0.0), ("banner_a", (6.6, -12.4), 0.0), ("banner_a", (9.4, -12.4), 0.0),
        ("bush_a", (5.6, -15.7), 0.4), ("bush_a", (10.3, -15.8), 2.4), ("stump_a", (4.6, -19.3), 0.7),
        ("tree_b", (3.2, -17.8), 0.4), ("tree_a", (13.4, -20.5), 1.4), ("tree_b", (2.2, -21.2), 2.2),
    ]
    for name, at, rot in items:
        try:
            place(name, Vector((at[0], at[1], at[2] if len(at) > 2 else 0.0)), rot)
        except Exception as e:  # a missing prop must not stop the film
            print(f"[film] skip {name}: {e}")


# ---------------------------------------------------------------- actors
def figure_material(mat, team):
    """Board figure material -> Principled with the team cloth (vertex alpha key, see prepare_tripo_unit.team_cloth)."""
    n, l = mat.node_tree.nodes, mat.node_tree.links
    tex = next(nd for nd in n if nd.type == "TEX_IMAGE")
    keep = {tex}
    stack = [tex]
    while stack:  # keep the UV map -> mapping chain of the glTF texture transform
        nd = stack.pop()
        for inp in nd.inputs:
            for lk in inp.links:
                if lk.from_node not in keep:
                    keep.add(lk.from_node)
                    stack.append(lk.from_node)
    for nd in list(n):
        if nd not in keep:
            n.remove(nd)
    out = n.new("ShaderNodeOutputMaterial")
    bsdf = n.new("ShaderNodeBsdfPrincipled")
    l.new(bsdf.outputs[0], out.inputs[0])
    attr = n.new("ShaderNodeVertexColor"); attr.layer_name = "Color"
    key = n.new("ShaderNodeMapRange"); key.inputs["From Min"].default_value = 0.95; key.inputs["From Max"].default_value = 0.6
    l.new(attr.outputs["Alpha"], key.inputs["Value"])
    cloth = n.new("ShaderNodeMix"); cloth.data_type = "RGBA"; cloth.blend_type = "MULTIPLY"; cloth.inputs["Factor"].default_value = 1
    l.new(tex.outputs["Color"], cloth.inputs["A"]); cloth.inputs["B"].default_value = (*[c / 0.85 for c in TEAM[team]], 1)
    mx = n.new("ShaderNodeMix"); mx.data_type = "RGBA"
    l.new(key.outputs["Result"], mx.inputs["Factor"]); l.new(tex.outputs["Color"], mx.inputs["A"]); l.new(cloth.outputs["Result"], mx.inputs["B"])
    l.new(mx.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.78
    bsdf.inputs["Specular IOR Level"].default_value = 0.08
    # a touch of subsurface so the chibi skin and cloth read soft, like painted vinyl
    bsdf.inputs["Subsurface Weight"].default_value = 0.08
    bsdf.inputs["Subsurface Radius"].default_value = (0.05, 0.03, 0.02)
    bsdf.inputs["Subsurface Scale"].default_value = 0.05
    return mat


class Actor:
    def __init__(self, d):
        self.id = d["id"]
        before, before_act = set(bpy.data.objects), set(bpy.data.actions)
        bpy.ops.import_scene.gltf(filepath=d["glb"])
        new = [o for o in bpy.data.objects if o not in before]
        new_act = [a for a in bpy.data.actions if a not in before_act]
        self.arm = next(o for o in new if o.type == "ARMATURE")
        self.root = bpy.data.objects.new("actor_" + self.id, None)
        bpy.context.scene.collection.objects.link(self.root)
        for o in new:
            if o.parent is None:
                o.parent = self.root
            if o.type == "MESH":
                for i, ms in enumerate(o.data.materials):
                    c = ms.copy()
                    o.data.materials[i] = figure_material(c, d.get("team", "player"))
        self.root.scale = (FIGURE_SCALE,) * 3
        self.head = bpy.data.objects.new("head_" + self.id, None)
        bpy.context.scene.collection.objects.link(self.head)
        self.head.parent = self.root
        self.head.location = (0, -0.2, 0.62)  # eyes on the face surface (figure faces -Y), in figure units (x figureScale)
        self.meshes = [o for o in new if o.type == "MESH" and len(o.data.vertices) > 200]
        for o in new:
            if o.type == "MESH" and o not in self.meshes:
                o.hide_render = o.hide_viewport = True
        self.actions = {a.name.rsplit("_Armature", 1)[0]: a for a in new_act}
        ad = self.arm.animation_data_create()
        ad.action = None
        for tr in list(ad.nla_tracks):
            ad.nla_tracks.remove(tr)
        self.pos = Vector((d["at"][0], d["at"][1]))
        self.yaw = {"n": math.pi, "s": 0.0, "e": yaw_to(1, 0), "w": yaw_to(-1, 0)}[d.get("facing", "s")]
        self.segments = []  # (start, end, anim)
        self.key(1)

    def key(self, f):
        self.root.location = W(self.pos.x, self.pos.y)
        self.root.rotation_euler = (0, 0, self.yaw)
        self.root.keyframe_insert("location", frame=f)
        self.root.keyframe_insert("rotation_euler", frame=f)

    def turn(self, f, dx, dy, frames):
        """Turn to face (dx, dy) in tile coordinates (y = south) over `frames`."""
        target = yaw_to(dx, -dy)
        d = (target - self.yaw + math.pi) % (2 * math.pi) - math.pi
        if abs(d) < 1e-3:
            return
        self.key(f)
        self.yaw += d
        self.key(f + frames)

    def move(self, f, path, frames):
        pts = [Vector(p) for p in path]
        lens = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]
        total = sum(lens) or 1
        t = f
        self.pos = pts[0]
        for i, ln in enumerate(lens):
            seg = pts[i + 1] - pts[i]
            self.turn(t, seg.x, seg.y, 5)
            self.key(t)
            t += frames * ln / total
            self.pos = pts[i + 1]
            self.key(t)
        self.segments.append((f, f + frames, "walk"))

    def gesture(self, f, anim):
        a = self.actions.get(anim) or self.actions.get("attack")
        ln = a.frame_range[1] - a.frame_range[0]
        self.segments.append((f, f + ln, anim))

    def build_nla(self, end):
        ad = self.arm.animation_data
        tracks = [ad.nla_tracks.new(), ad.nla_tracks.new()]
        segs = sorted(self.segments)
        full, t = [], 1
        for s, e, a in segs:
            if s > t + 1:
                full.append((t, s, "idle"))
            full.append((max(s, t), e, a))
            t = e
        if t < end:
            full.append((t, end + 1, "idle"))
        blend = 4
        full = [seg for seg in full if seg[1] - seg[0] >= 1]
        last_end = [-1e9, -1e9]
        for i, (s, e, a) in enumerate(full):
            act = self.actions[a]
            ln = act.frame_range[1] - act.frame_range[0]
            s0 = s - (blend if i else 0)
            e0 = e + (blend if i < len(full) - 1 else 0)
            s0 = max(int(round(s0)), math.floor(last_end[i % 2]) + 1)
            st = tracks[i % 2].strips.new(f"{a}_{i}", s0, act)
            st.extrapolation = "NOTHING" if i < len(full) - 1 else "HOLD"
            if a in ("walk", "idle"):
                st.repeat = max(0.05, (e0 - s0) / ln)
            else:
                st.frame_end = e0 if e0 > st.frame_start else st.frame_start + ln
            last_end[i % 2] = st.frame_end
            st.blend_in = blend if i else 0
            st.blend_out = blend if i < len(full) - 1 else 0
            st.use_auto_blend = False


# ---------------------------------------------------------------- shots
def frames(ms):
    return ms / 1000.0 * FPS


def build_film(actors):
    sc = bpy.context.scene
    f = 1.0
    shots = []
    for i, sh in enumerate(FILM["shots"]):
        cam_def = sh["camera"]
        n = frames(cam_def["ms"])
        start = int(round(f))
        cd = bpy.data.cameras.new(f"cam_{i + 1:02d}_{sh['line']}")
        cd.sensor_fit = "VERTICAL"
        cd.sensor_height = 24.0
        cd.angle_y = math.radians(cam_def["fov"])
        cd.clip_start = 0.05
        cd.clip_end = 250
        cam = bpy.data.objects.new(cd.name, cd)
        tgt = bpy.data.objects.new(cd.name + "_to", None)
        sc.collection.objects.link(cam)
        sc.collection.objects.link(tgt)
        con = cam.constraints.new("TRACK_TO")
        con.target = tgt; con.track_axis = "TRACK_NEGATIVE_Z"; con.up_axis = "UP_Y"
        cd.dof.use_dof = True
        cd.dof.focus_object = tgt
        cd.dof.aperture_fstop = sh.get("fstop", 5.6 if cam_def["fov"] >= 45 else 2.4)
        cd.dof.aperture_blades = 7
        fr, to = cam_def["from"], cam_def["to"]
        end = cam_def.get("end", {})

        def put(ob, p, fr_):
            ob.location = Vector((p[0] + 0.5, -(p[2] + 0.5), p[1]))
            ob.keyframe_insert("location", frame=fr_)

        put(cam, fr, start); put(tgt, to, start)
        if end:
            put(cam, end.get("from", fr), start + n); put(tgt, end.get("to", to), start + n)
        m = sc.timeline_markers.new(f"{i + 1:02d}_{sh['line']}", frame=start)
        m.camera = cam
        for mv in sh.get("moves", []):
            actors[mv["actor"]].move(start, mv["path"], frames(mv["ms"]))
        for g in sh.get("gestures", []):
            a = actors[g["actor"]]
            if "face" in g:
                a.turn(start, g["face"][0] - a.pos.x, g["face"][1] - a.pos.y, int(frames(400)))
            if "anim" in g:
                a.gesture(start + 2, g["anim"])
        # focus on the speaker when they are in front of the camera, else on the camera target
        eye = Vector((fr[0] + 0.5, -(fr[2] + 0.5), fr[1]))
        aim = (Vector((to[0] + 0.5, -(to[2] + 0.5), to[1])) - eye).normalized()
        spk = actors.get(sh.get("speaker") or "")
        subject = Vector((to[0] + 0.5, -(to[2] + 0.5), to[1]))
        if spk:
            hp = W(spk.pos.x, spk.pos.y, 0.62 * FIGURE_SCALE)
            v = hp - eye
            if v.length < 5 and aim.angle(v.normalized()) < math.radians(cam_def["fov"] * 0.45):
                cd.dof.focus_object = spk.head
                subject = hp
        if cam_def["fov"] < 40 and "rim" not in sh.get("nolights", ""):
            shot_lights(i, start, start + n + 1, eye, subject)
        shots.append({"line": sh["line"], "start": start, "frames": n, "cam": cam})
        f += n
    end_frame = int(round(f)) - 1
    for a in actors.values():
        a.build_nla(end_frame)
    sc.frame_start, sc.frame_end = 1, end_frame
    return shots


def shot_lights(i, f0, f1, eye, subject):
    """Per-shot character lighting, on only while the shot runs: soft warm key beside the camera (sun side),
    cool fill from the other side, strong warm rim behind the subject."""
    d = subject - eye
    d.z = 0
    d.normalize()
    side = Vector((-d.y, d.x, 0))
    sun_dir = Vector((math.sin(math.radians(-SUN_AZ)), -math.cos(math.radians(-SUN_AZ)), 0))  # toward the sun, horizontally
    if side.dot(sun_dir) < 0:
        side = -side
    spec = [("key", subject - d * 1.6 + side * 1.1 + Vector((0, 0, 0.7)), 2.6, (1.0, 0.86, 0.70), 26.0),
            ("fill", subject - d * 1.4 - side * 1.3 + Vector((0, 0, 0.2)), 1.6, (0.70, 0.80, 1.0), 9.0),
            ("rim", subject + d * 1.3 - side * 0.6 + Vector((0, 0, 0.9)), 0.6, (1.0, 0.80, 0.55), 130.0)]
    tgt = bpy.data.objects.new(f"lt_{i}_to", None)
    tgt.location = subject
    bpy.context.scene.collection.objects.link(tgt)
    for name, pos, size, col, power in spec:
        ld = bpy.data.lights.new(f"{name}_{i}", "AREA")
        ld.size = size; ld.color = col; ld.shape = "DISK"
        ld.use_shadow = name != "fill"
        ob = bpy.data.objects.new(ld.name, ld)
        ob.visible_camera = False  # the disc must not show up in the frame (it sits between camera and figure)
        ob.visible_glossy = name == "rim"
        ob.location = pos
        bpy.context.scene.collection.objects.link(ob)
        c = ob.constraints.new("TRACK_TO"); c.target = tgt; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
        for f, e in ((1, 0.0), (f0, power), (f1, 0.0)):
            ld.energy = e
            ld.keyframe_insert("energy", frame=f)
        for fc in ld.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "CONSTANT"


# ---------------------------------------------------------------- look
def build_world():
    sc = bpy.context.scene
    w = bpy.data.worlds.new("sky")
    sc.world = w
    w.use_nodes = True
    n, l = w.node_tree.nodes, w.node_tree.links
    sky = n.new("ShaderNodeTexSky"); sky.sky_type = "NISHITA"; sky.sun_disc = False
    sky.sun_elevation = math.radians(SUN_ELEV); sky.sun_rotation = math.radians(180 + SUN_AZ)
    sky.altitude = 200; sky.air_density = 1.2; sky.dust_density = 1.2
    bg = n["Background"]; bg.inputs["Strength"].default_value = SKY_STRENGTH
    l.new(sky.outputs[0], bg.inputs[0])
    w.mist_settings.start = 8.0
    w.mist_settings.depth = 70.0
    w.mist_settings.falloff = "QUADRATIC"
    sd = bpy.data.lights.new("sun", "SUN")
    sd.energy = SUN_STRENGTH; sd.color = SUN_COLOR; sd.angle = math.radians(3.0)
    sun = bpy.data.objects.new("sun", sd)
    sun.rotation_euler = (math.radians(90 - SUN_ELEV), 0, math.radians(SUN_AZ))
    sc.collection.objects.link(sun)


def setup_render(res, samples, motion_blur=False):
    sc = bpy.context.scene
    r = sc.render
    r.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.03
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.max_bounces = 5
    sc.cycles.diffuse_bounces = 2
    sc.cycles.glossy_bounces = 2
    sc.cycles.transmission_bounces = 4
    sc.cycles.volume_bounces = 0
    sc.cycles.volume_step_rate = 4.0
    sc.cycles.volume_max_steps = 96
    sc.cycles.transparent_max_bounces = 4
    sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
    sc.cycles.blur_glossy = 1.0
    r.use_persistent_data = True
    r.resolution_x, r.resolution_y = res
    r.resolution_percentage = 100
    r.fps = FPS
    r.film_transparent = False
    r.use_motion_blur = motion_blur
    r.motion_blur_shutter = 0.5
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
    sc.view_settings.exposure = 0.15
    vl = sc.view_layers[0]
    vl.use_pass_mist = True
    compositor(sc)


def compositor(sc):
    sc.use_nodes = True
    n, l = sc.node_tree.nodes, sc.node_tree.links
    for nd in list(n):
        n.remove(nd)
    rl = n.new("CompositorNodeRLayers")
    comp = n.new("CompositorNodeComposite")
    # aerial haze from the mist pass
    mist = n.new("CompositorNodeMath"); mist.operation = "MULTIPLY"; mist.inputs[1].default_value = 0.28
    l.new(rl.outputs["Mist"], mist.inputs[0])
    haze = n.new("CompositorNodeMixRGB"); haze.inputs[2].default_value = (*HAZE, 1)
    l.new(mist.outputs[0], haze.inputs[0]); l.new(rl.outputs["Image"], haze.inputs[1])
    # bloom
    glare = n.new("CompositorNodeGlare"); glare.glare_type = "FOG_GLOW"; glare.quality = "MEDIUM"; glare.threshold = 0.85; glare.mix = -0.82; glare.size = 8
    l.new(haze.outputs[0], glare.inputs[0])
    # grade: cool shadows, warm highlights
    cb = n.new("CompositorNodeColorBalance"); cb.correction_method = "LIFT_GAMMA_GAIN"
    cb.lift = (0.97, 1.0, 1.04); cb.gamma = (1.0, 1.0, 0.98); cb.gain = (1.05, 1.0, 0.93)
    l.new(glare.outputs[0], cb.inputs[1])
    # lens: a hint of chromatic dispersion at the edges
    lens = n.new("CompositorNodeLensdist"); lens.use_fit = True
    lens.inputs["Distortion"].default_value = 0.0; lens.inputs["Dispersion"].default_value = 0.012
    l.new(cb.outputs[0], lens.inputs["Image"])
    l.new(lens.outputs["Image"], comp.inputs[0])


# ---------------------------------------------------------------- main
def main():
    t0 = time.time()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = FPS  # before the figure import: the glTF importer converts action seconds to frames at this rate
    build_world()
    build_ground()
    lodges = build_props()
    posters(lodges, JOB["poster"])
    build_dressing()
    build_scatter()
    haze = build_haze(JOB.get("haze", 0.012))
    actors = {d["id"]: Actor(d) for d in FILM["actors"]}
    for a in actors.values():
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        zs = []
        for o in a.meshes:
            e = o.evaluated_get(dg)
            me = e.to_mesh()
            zs += [(o.matrix_world @ v.co).z for v in me.vertices]
            e.to_mesh_clear()
        print(f"[film] actor {a.id}: height {max(zs) - min(zs):.2f} (min z {min(zs):.2f})")
    shots = build_film(actors)
    print(f"[film] scene built in {time.time() - t0:.1f}s, frames {sc.frame_start}-{sc.frame_end} at {FPS} fps")
    out = JOB["out"]
    if JOB["stills"]:
        setup_render(JOB["res"], JOB["samples"])
        pick = JOB["shots"] or list(range(1, len(shots) + 1))
        for i in pick:
            s = shots[i - 1]
            sc.camera = s["cam"]
            sc.frame_set(min(int(s["start"] + s["frames"] * FILM["shots"][i - 1].get("hero", 0.8)), int(s["start"] + s["frames"]) - 1))
            sc.render.image_settings.file_format = "PNG"
            sc.render.filepath = os.path.join(out, f"shot_{i:02d}_{s['line']}.png")
            t = time.time()
            bpy.ops.render.render(write_still=True)
            print(f"[film] still {i} {s['line']} frame {sc.frame_current}: {time.time() - t:.1f}s")
    if JOB["video"]:
        setup_render(JOB["videoRes"], JOB["videoSamples"], motion_blur=True)
        haze.hide_render = not JOB.get("videoHaze", False)
        r = sc.render
        r.image_settings.file_format = "FFMPEG"
        r.ffmpeg.format = "MPEG4"
        r.ffmpeg.codec = "H264"
        r.ffmpeg.constant_rate_factor = "HIGH"
        r.ffmpeg.ffmpeg_preset = "GOOD"
        r.filepath = os.path.join(out, "film.mp4")
        if JOB.get("frameEnd"):
            sc.frame_end = JOB["frameEnd"]
        t = time.time()
        bpy.ops.render.render(animation=True)
        print(f"[film] video {sc.frame_end} frames: {time.time() - t:.1f}s")
    if JOB.get("blend"):
        bpy.ops.wm.save_as_mainfile(filepath=JOB["blend"])


main()
