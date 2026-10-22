"""Hollow Crown – sprite pipeline, part 3b: props (trees, house, fort, wagon, shrine, chest, rock, ruins).

Needs the namespace of blender_chibi.py. Each prop is a collection P_<id> with one child collection
per state (row): the child carries the custom props "row" (row name) and "order".
Origin = centre of the 48 px tile on the ground. One tile ≈ 2.58 Blender units wide.
Large props render into 96×96 cells (anchor [48, 87]), the chest into 72×72 (anchor [36, 63]).
"""
import math

TILE = 48 / PX_PER_UNIT  # ≈ 2.58 units

PROP_CELLS = {
    "chest": (72, (36, 63)),
}
PROP_DEFAULT_CELL = (96, (48, 87))


def state(sc, pid, row, order):
    parent = bpy.data.collections.get(f"P_{pid}")
    col = bpy.data.collections.new(f"P_{pid}_{row}")
    parent.children.link(col)
    col["row"] = row
    col["order"] = order
    return col


def prop_root(sc, pid):
    return new_collection(sc, f"P_{pid}")


def blob(col, role, loc, size, seed=0, amp=0.18, seg=18, rot=(0, 0, 0)):
    return shape(col, "sphere", role, loc, size, rot=rot, seg=seg, lumpy=amp, seed=seed)


# ------------------------------------------------------------------------------------------------
# Trees
# ------------------------------------------------------------------------------------------------


def _tree_round(col, seed=0):
    shape(col, "cyl", "bark", (0, 0, 0.55), (0.16, 0.16, 0.55), seg=10, top=0.75)
    for a in (0, 120, 240):  # root flare
        r = math.radians(a + 30)
        shape(col, "cone", "bark", (0.12 * math.cos(r), 0.12 * math.sin(r), 0.08), (0.1, 0.1, 0.12), rot=(0, 0, 0), seg=6)
    shape(col, "box", "bark", (0.25, 0, 1.15), (0.04, 0.04, 0.22), rot=(0, 40, 0))
    blobs = [((0, 0.1, 1.65), (0.82, 0.78, 0.62)), ((-0.42, -0.05, 1.45), (0.55, 0.52, 0.48)), ((0.45, 0.0, 1.5), (0.55, 0.5, 0.48)),
             ((0.05, -0.2, 2.05), (0.6, 0.55, 0.5)), ((-0.2, 0.15, 2.2), (0.45, 0.45, 0.4))]
    for k, (loc, sz) in enumerate(blobs):
        blob(col, "leaf", loc, sz, seed=seed * 10 + k, amp=0.2)
    blob(col, "leaf_dark", (0, 0.3, 1.35), (0.75, 0.4, 0.4), seed=seed + 7, amp=0.15)


def _tree_pine(col, seed=0):
    shape(col, "cyl", "bark", (0, 0, 0.4), (0.13, 0.13, 0.4), seg=10, top=0.8)
    tiers = [(0.55, 0.95, 0.55), (1.15, 0.78, 0.5), (1.7, 0.6, 0.48), (2.2, 0.42, 0.42)]
    for k, (z, r, h) in enumerate(tiers):
        ob = shape(col, "cone", "pine", (0, 0, z + h), (r, r, h), seg=14)
        # jagged skirt for a needle-like silhouette
        for j in range(8):
            a = math.radians(j * 45 + k * 20)
            shape(col, "cone", "pine", (r * 0.85 * math.cos(a), r * 0.85 * math.sin(a), z + 0.05), (0.12, 0.12, 0.16), rot=(math.degrees(math.sin(a)) * 0.0 + 150 * math.sin(a) * 0 + 0, 0, 0), seg=5)
    shape(col, "cone", "pine", (0, 0, 2.95), (0.12, 0.12, 0.2), seg=8)


def _tree_birch(col, seed=0):
    shape(col, "cyl", "birch", (0, 0, 0.7), (0.12, 0.12, 0.7), seg=10, top=0.7)
    for z in (0.35, 0.7, 1.05):
        shape(col, "box", "bark", (0, -0.12, z), (0.07, 0.02, 0.015))
    shape(col, "cyl", "birch", (-0.22, 0, 1.25), (0.05, 0.05, 0.25), rot=(0, -35, 0), seg=6)
    blobs = [((0, 0.05, 1.75), (0.62, 0.58, 0.6)), ((-0.35, 0.0, 1.5), (0.42, 0.42, 0.42)), ((0.35, -0.05, 1.55), (0.4, 0.42, 0.4)),
             ((0.05, -0.1, 2.15), (0.42, 0.42, 0.38))]
    for k, (loc, sz) in enumerate(blobs):
        blob(col, "leaf_hi" if k % 2 else "leaf", loc, sz, seed=seed * 10 + k + 3, amp=0.22)


def build_tree(sc):
    prop_root(sc, "tree")
    for k, (row, fn) in enumerate((("a", _tree_round), ("b", _tree_pine), ("c", _tree_birch))):
        fn(state(sc, "tree", row, k), seed=k + 1)


# ------------------------------------------------------------------------------------------------
# House (village): intact / visited (door open) / razed
# ------------------------------------------------------------------------------------------------


def _house(col, mode):
    W, D, H = 1.05, 0.78, 0.95  # half width, half depth, wall height
    razed = mode == "razed"
    wall = "plaster"
    # stone footing
    shape(col, "box", "stone", (0, 0, 0.08), (W + 0.05, D + 0.05, 0.08), bevel=0.2)
    if not razed:
        shape(col, "box", wall, (0, 0, H / 2 + 0.1), (W, D, H / 2), bevel=0.05)
    else:
        # broken walls: left part high, right part low with jagged top
        shape(col, "box", wall, (-0.45, 0, 0.5), (0.5, D, 0.4), bevel=0.05)
        shape(col, "box", wall, (0.5, 0.1, 0.28), (0.45, D - 0.1, 0.18), rot=(0, 6, 0), bevel=0.05)
        shape(col, "box", "soot", (-0.45, -D - 0.005, 0.55), (0.42, 0.02, 0.3))
    # timber frame on the front
    beams = [(-W, 0.55), (W, 0.55), (-0.32, 0.55), (0.32, 0.55)]
    for x, h in beams:
        if razed and x > 0:
            continue
        shape(col, "box", "timber", (x * 0.97, -D - 0.02, 0.1 + H / 2), (0.045, 0.03, H / 2))
    if not razed:
        shape(col, "box", "timber", (0, -D - 0.02, H + 0.08), (W, 0.03, 0.04))
        shape(col, "box", "timber", (0, -D - 0.02, 0.55), (W, 0.03, 0.035))
    # door (south)
    if mode == "intact":
        shape(col, "box", "timber", (0, -D - 0.03, 0.42), (0.2, 0.03, 0.32), bevel=0.1)
        shape(col, "sphere", "gold", (0.12, -D - 0.07, 0.42), (0.03, 0.03, 0.03), seg=8)
    elif mode == "visited":
        shape(col, "box", "dark", (0, -D - 0.01, 0.42), (0.2, 0.03, 0.32))
        shape(col, "box", "timber", (-0.33, -D - 0.2, 0.42), (0.03, 0.18, 0.32), rot=(0, 0, 25), bevel=0.1)
        shape(col, "box", "ember_glow", (0.0, -D - 0.005, 0.25), (0.14, 0.02, 0.12))  # warm light inside
    else:
        shape(col, "box", "dark", (-0.55, -D - 0.01, 0.38), (0.18, 0.03, 0.28))
    # windows
    for x in (-0.62, 0.62):
        if razed and x > 0:
            continue
        shape(col, "box", "window", (x, -D - 0.02, 0.68), (0.13, 0.03, 0.12))
        shape(col, "box", "timber", (x, -D - 0.04, 0.68), (0.15, 0.02, 0.02))
    # roof: gable along X
    if not razed:
        ridge = H + 0.95
        for s in (1, -1):
            verts = [(-W - 0.15, s * (D + 0.25), H + 0.05), (W + 0.15, s * (D + 0.25), H + 0.05), (W + 0.15, 0, ridge), (-W - 0.15, 0, ridge)]
            poly_mesh(col, "roof", verts, [(0, 1, 2, 3)], solidify=0.12)
            # tile courses: slightly raised strips so the slope reads as a roof, not a flat panel
            for k in range(1, 4):
                t = k / 4.0
                y = s * (D + 0.25) * (1 - t)
                z = H + 0.05 + (ridge - H - 0.05) * t
                shape(col, "box", "roof_tile", (0, y, z + 0.07), (W + 0.16, 0.04, 0.025), rot=(s * -48, 0, 0))
            shape(col, "box", "roof_tile", (0, s * (D + 0.25), H + 0.07), (W + 0.17, 0.05, 0.04), rot=(s * -48, 0, 0))
        shape(col, "cyl", "timber", (0, 0, ridge + 0.05), (0.07, 0.07, W + 0.18), rot=(0, 90, 0), seg=8)
        # gable ends (plaster triangles)
        for x in (-W, W):
            poly_mesh(col, "plaster", [(x, -D, H + 0.1), (x, D, H + 0.1), (x, 0, ridge - 0.05)], [(0, 1, 2)], solidify=0.04)
        shape(col, "box", "stone", (0.55, 0.25, ridge - 0.1), (0.13, 0.13, 0.35), bevel=0.15)  # chimney
        shape(col, "box", "stone_white", (0.55, 0.25, ridge + 0.26), (0.15, 0.15, 0.04))
    else:
        # collapsed burnt roof beams and rubble
        for k, (x, y, z, ry, rz) in enumerate(((-0.4, -0.1, 0.95, 35, 10), (0.1, 0.2, 0.7, -20, -15), (-0.7, 0.3, 1.05, 50, 30))):
            shape(col, "box", "roof_burnt", (x, y, z), (0.6, 0.05, 0.05), rot=(0, ry, rz))
        shape(col, "box", "roof_burnt", (-0.35, 0.1, 0.92), (0.45, 0.45, 0.04), rot=(18, -12, 0))
        for k, (x, y) in enumerate(((0.5, -0.5), (0.75, -0.2), (-0.1, -0.7), (0.3, -0.85))):
            blob(col, "stone" if k % 2 else "soot", (x, y, 0.1), (0.15, 0.13, 0.1), seed=40 + k, amp=0.25, seg=10)
        for (x, y, z) in ((0.2, -0.55, 0.22), (-0.2, 0.1, 0.98), (0.65, -0.1, 0.5)):
            shape(col, "sphere", "ember_glow", (x, y, z), (0.07, 0.07, 0.05), seg=8)


def build_house(sc):
    prop_root(sc, "house")
    for k, mode in enumerate(("intact", "visited", "razed")):
        _house(state(sc, "house", mode, k), mode)


# ------------------------------------------------------------------------------------------------
# Fort: small watchtower with a flag (flag uses the team key colours → faction/team colour)
# ------------------------------------------------------------------------------------------------


def build_fort(sc):
    prop_root(sc, "fort")
    col = state(sc, "fort", "idle", 0)
    # stone base, tapering
    shape(col, "cyl", "stone", (0, 0, 0.55), (0.85, 0.85, 0.55), seg=4, top=0.85, rot=(0, 0, 45))
    shape(col, "box", "stone", (0, 0, 1.35), (0.62, 0.62, 0.3), bevel=0.05)
    for z in (0.35, 0.75):
        shape(col, "box", "rock_dark", (0, -0.69, z), (0.55, 0.02, 0.02))
    shape(col, "box", "dark", (0, -0.73, 0.38), (0.2, 0.03, 0.28))  # gate
    shape(col, "cyl", "dark", (0, -0.73, 0.66), (0.2, 0.2, 0.03), rot=(90, 0, 0), seg=12)
    shape(col, "box", "window", (0, -0.63, 1.38), (0.07, 0.02, 0.14))
    # wooden platform + crenellations
    shape(col, "box", "timber", (0, 0, 1.72), (0.78, 0.78, 0.07))
    for i in range(-2, 3):
        for (x, y) in ((i * 0.32, -0.74), (i * 0.32, 0.74), (-0.74, i * 0.32), (0.74, i * 0.32)):
            if abs(i) == 2 and abs(x) == abs(y):
                pass
            if (i % 2) == 0:
                shape(col, "box", "stone", (x, y, 1.9), (0.11, 0.11, 0.12), bevel=0.1)
    # small roof
    shape(col, "cone", "roof", (0, 0, 2.35), (0.62, 0.62, 0.4), seg=4, rot=(0, 0, 45))
    for (x, y) in ((-0.5, -0.5), (0.5, -0.5), (-0.5, 0.5), (0.5, 0.5)):
        shape(col, "cyl", "timber", (x, y, 2.0), (0.04, 0.04, 0.22), seg=6)
    # flag pole + flag
    shape(col, "cyl", "timber", (0.0, 0.0, 2.95), (0.03, 0.03, 0.45), seg=6)
    verts = [(0, 0, 0), (0.62, 0.0, -0.04), (0.5, 0.0, -0.17), (0.66, 0.0, -0.32), (0, 0, -0.3)]
    poly_mesh(col, "flag", verts, [(0, 1, 2, 4), (2, 3, 4)], loc=(0.03, -0.02, 3.35), solidify=0.03)


# ------------------------------------------------------------------------------------------------
# Wagon: merchant caravan wagon with canvas cover
# ------------------------------------------------------------------------------------------------


def build_wagon(sc):
    prop_root(sc, "wagon")
    col = state(sc, "wagon", "idle", 0)
    L, Wd = 1.0, 0.55
    shape(col, "box", "wood", (0, 0, 0.55), (Wd, L, 0.16), bevel=0.05)
    for y in (-0.6, 0.0, 0.6):
        shape(col, "box", "timber", (Wd + 0.01, y, 0.55), (0.02, 0.04, 0.17))
        shape(col, "box", "timber", (-Wd - 0.01, y, 0.55), (0.02, 0.04, 0.17))
    # wheels
    for x in (Wd + 0.07, -Wd - 0.07):
        for y in (-0.62, 0.62):
            shape(col, "torus", "wood", (x, y, 0.36), (0.33, 0.33, 0.33), rot=(0, 90, 0), minor=0.16, seg=16)
            shape(col, "cyl", "iron", (x * 1.03, y, 0.36), (0.07, 0.07, 0.04), rot=(0, 90, 0), seg=8)
            for a in (0, 60, 120):
                shape(col, "box", "wood_light", (x, y, 0.36), (0.02, 0.025, 0.3), rot=(a, 0, 0))
    # canvas cover: arched half cylinder along Y with ribs
    rows = []
    n = 9
    for yy in (-L + 0.05, -L * 0.3, L * 0.3, L - 0.05):
        row = []
        for j in range(n):
            a = math.pi * j / (n - 1)
            row.append((math.cos(a) * (Wd + 0.04), yy, 0.7 + math.sin(a) * 0.68))
        rows.append(row)
    sheet_mesh(col, "canvas", rows, solidify=0.04)
    for yy in (-L + 0.05, 0.0, L - 0.05):
        shape(col, "torus", "timber", (0, yy, 0.7), (Wd + 0.07, Wd + 0.07, Wd + 0.07), rot=(90, 0, 0), minor=0.05, seg=16, arc=180)
    shape(col, "box", "team_flat", (0.0, -L - 0.04, 1.18), (0.18, 0.02, 0.1))  # merchant pennant / team marker
    # crates at the back opening + shafts in front
    shape(col, "box", "chest_wood", (0.2, -0.85, 0.82), (0.15, 0.12, 0.12), bevel=0.1)
    shape(col, "cyl", "wood", (0.22, -1.45, 0.45), (0.035, 0.035, 0.5), rot=(80, 0, 0), seg=6)
    shape(col, "cyl", "wood", (-0.22, -1.45, 0.45), (0.035, 0.035, 0.5), rot=(80, 0, 0), seg=6)
    sc_objs = list(col.objects)
    # turn the wagon so it stands diagonal-ish, front to the left (reads better from the front)
    pivot = bpy.data.objects.new("wagon_pivot", None)
    col.objects.link(pivot)
    for ob in sc_objs:
        if ob.parent is None:
            ob.parent = pivot
    pivot.rotation_euler = (0, 0, math.radians(-70))
    pivot.scale = (0.95, 0.95, 0.95)


# ------------------------------------------------------------------------------------------------
# Shrine: white stone shrine with silver-blue accents
# ------------------------------------------------------------------------------------------------


def build_shrine(sc):
    prop_root(sc, "shrine")
    col = state(sc, "shrine", "idle", 0)
    shape(col, "box", "stone_white", (0, 0, 0.08), (0.95, 0.85, 0.08), bevel=0.1)
    shape(col, "box", "stone_white", (0, 0.05, 0.22), (0.8, 0.7, 0.07), bevel=0.1)
    shape(col, "box", "stone_white", (0, -0.62, 0.13), (0.45, 0.12, 0.06), bevel=0.1)  # step
    for (x, y) in ((-0.55, -0.45), (0.55, -0.45), (-0.55, 0.5), (0.55, 0.5)):
        shape(col, "cyl", "stone_white", (x, y, 0.75), (0.1, 0.1, 0.48), seg=10)
        shape(col, "box", "stone_white", (x, y, 0.32), (0.13, 0.13, 0.04))
        shape(col, "box", "stone_white", (x, y, 1.24), (0.13, 0.13, 0.04))
    shape(col, "box", "stone_white", (0, 0.02, 1.33), (0.72, 0.62, 0.07), bevel=0.1)
    shape(col, "hemi", "silver_blue", (0, 0.02, 1.38), (0.6, 0.55, 0.42), seg=18)
    shape(col, "cone", "silver_blue", (0, 0.02, 1.93), (0.08, 0.08, 0.16), seg=8)
    shape(col, "torus", "silver", (0, 0.02, 1.4), (0.62, 0.57, 0.6), minor=0.05, seg=18)
    # altar with a glowing crystal (empty crown motif in silver)
    shape(col, "box", "stone_white", (0, 0.1, 0.45), (0.2, 0.18, 0.18), bevel=0.15)
    shape(col, "sphere", "glow", (0, 0.1, 0.72), (0.1, 0.1, 0.13), seg=10)
    shape(col, "torus", "silver", (0, 0.1, 0.68), (0.14, 0.14, 0.14), minor=0.2, seg=12)
    blob(col, "moss", (-0.8, -0.6, 0.12), (0.18, 0.12, 0.08), seed=5, amp=0.3, seg=10)
    blob(col, "grass_tuft", (0.85, 0.4, 0.1), (0.15, 0.12, 0.1), seed=6, amp=0.3, seg=10)


# ------------------------------------------------------------------------------------------------
# Chest: closed / open
# ------------------------------------------------------------------------------------------------


def _chest(col, opened):
    W, D, H = 0.42, 0.3, 0.28
    shape(col, "box", "chest_wood", (0, 0, H / 2 + 0.02), (W, D, H / 2), bevel=0.06)
    for x in (-W * 0.6, W * 0.6):
        shape(col, "box", "gold", (x, 0, H / 2 + 0.02), (0.035, D + 0.015, H / 2 + 0.01))
    if not opened:
        shape(col, "cyl", "chest_wood", (0, 0, H + 0.02), (D, D, W), rot=(0, 90, 0), seg=16)
        for x in (-W * 0.6, W * 0.6):
            shape(col, "torus", "gold", (x, 0, H + 0.02), (D + 0.015, D + 0.015, D), rot=(0, 90, 0), minor=0.1, seg=16, arc=180)
        shape(col, "box", "gold", (0, -D - 0.02, H), (0.06, 0.02, 0.08))
        shape(col, "box", "dark", (0, -D - 0.035, H - 0.01), (0.015, 0.01, 0.025))
    else:
        shape(col, "box", "dark", (0, 0, H + 0.015), (W - 0.03, D - 0.03, 0.01))
        for k, (x, y) in enumerate(((-0.15, -0.05), (0.08, 0.05), (0.2, -0.1), (-0.02, -0.12), (0.0, 0.1))):
            shape(col, "cyl", "gold_coins", (x, y, H + 0.04 + 0.02 * (k % 2)), (0.07, 0.07, 0.025), rot=(10 * k, 0, 0), seg=10)
        shape(col, "sphere", "glow", (0.0, 0.0, H + 0.1), (0.07, 0.07, 0.07), seg=8)
        # lid swung open backwards: curved lid standing up behind the box, inside dark
        shape(col, "box", "chest_wood", (0, D + 0.04, H + D * 0.85), (W, 0.07, D * 0.85), rot=(-12, 0, 0), bevel=0.15)
        shape(col, "box", "dark", (0, D - 0.04, H + D * 0.85), (W - 0.05, 0.02, D * 0.7), rot=(-12, 0, 0))
        for x in (-W * 0.6, W * 0.6):
            shape(col, "box", "gold", (x, D + 0.0, H + D * 0.85), (0.035, 0.08, D * 0.86), rot=(-12, 0, 0))


def build_chest(sc):
    prop_root(sc, "chest")
    for k, mode in enumerate(("closed", "open")):
        _chest(state(sc, "chest", mode, k), mode == "open")


# ------------------------------------------------------------------------------------------------
# Rock outcrop (mountain tile) and ruins
# ------------------------------------------------------------------------------------------------


def build_rock(sc):
    prop_root(sc, "rock")
    col = state(sc, "rock", "idle", 0)
    parts = [((0.0, 0.25, 0.85), (0.85, 0.75, 0.95), 1), ((-0.6, -0.05, 0.5), (0.6, 0.6, 0.6), 2), ((0.62, -0.1, 0.45), (0.58, 0.55, 0.52), 3),
             ((0.15, -0.45, 0.25), (0.55, 0.4, 0.3), 4), ((-0.25, 0.4, 1.55), (0.42, 0.42, 0.55), 5), ((0.3, 0.35, 1.35), (0.4, 0.4, 0.45), 6)]
    parts = [((x, y + 0.2, z), s, d) for (x, y, z), s, d in parts]
    for loc, sz, sd in parts:
        blob(col, "rock" if sd % 3 else "rock_dark", loc, sz, seed=sd, amp=0.22, seg=14)
    for (x, y, z, sd) in ((-0.95, -0.25, 0.08, 11), (0.9, -0.3, 0.08, 12), (-0.1, -0.55, 0.06, 13), (0.45, -0.5, 0.07, 14)):
        blob(col, "grass_tuft", (x, y, z), (0.2, 0.14, 0.12), seed=sd, amp=0.35, seg=10)
    blob(col, "moss", (-0.45, 0.0, 1.05), (0.25, 0.25, 0.08), seed=21, amp=0.3, seg=10)
    blob(col, "moss", (0.5, 0.0, 0.95), (0.2, 0.2, 0.07), seed=22, amp=0.3, seg=10)


def build_ruins(sc):
    prop_root(sc, "ruins")
    col = state(sc, "ruins", "idle", 0)
    shape(col, "box", "stone", (-0.55, 0.2, 0.55), (0.18, 0.75, 0.55), bevel=0.05)          # west wall
    shape(col, "box", "stone", (-0.55, -0.35, 1.2), (0.18, 0.2, 0.12), rot=(0, 0, 0), bevel=0.1)
    shape(col, "box", "stone", (0.05, 0.75, 0.35), (0.62, 0.18, 0.35), bevel=0.05)           # north wall (low)
    shape(col, "box", "stone", (0.4, 0.75, 0.82), (0.25, 0.18, 0.15), rot=(0, 8, 0), bevel=0.1)
    shape(col, "box", "dark", (-0.55, -0.1, 0.55), (0.19, 0.15, 0.25))                        # broken window
    shape(col, "cyl", "stone_white", (0.6, -0.35, 0.4), (0.15, 0.15, 0.4), seg=10)             # column stub
    shape(col, "box", "stone_white", (0.6, -0.35, 0.03), (0.2, 0.2, 0.04))
    shape(col, "cyl", "stone_white", (0.15, -0.55, 0.12), (0.13, 0.13, 0.3), rot=(85, 0, 30), seg=10)  # fallen drum
    for k, (x, y, s) in enumerate(((0.0, 0.1, 0.16), (0.3, 0.3, 0.12), (-0.2, -0.6, 0.11), (0.85, 0.2, 0.13), (-0.85, -0.6, 0.1))):
        blob(col, "stone" if k % 2 else "rock", (x, y, s * 0.6), (s, s * 0.9, s * 0.7), seed=30 + k, amp=0.25, seg=10)
    for (x, y, z, sd) in ((-0.55, 0.2, 1.12, 41), (0.05, 0.75, 0.72, 42), (-0.3, -0.55, 0.05, 43), (0.8, -0.5, 0.05, 44)):
        blob(col, "moss" if z > 0.1 else "grass_tuft", (x, y, z), (0.2, 0.17, 0.08), seed=sd, amp=0.35, seg=10)


PROPS = {
    "tree": build_tree,
    "house": build_house,
    "fort": build_fort,
    "wagon": build_wagon,
    "shrine": build_shrine,
    "chest": build_chest,
    "rock": build_rock,
    "ruins": build_ruins,
}


def build_props(ids=None):
    sc = get_scene()
    setup_render(sc)
    normal_material()
    depth_material()
    built = []
    for pid, fn in PROPS.items():
        if ids and pid not in ids:
            continue
        fn(sc)
        built.append(pid)
    return built


def render_prop_id(pid, out):
    cell, anchor = PROP_CELLS.get(pid, PROP_DEFAULT_CELL)
    return render_prop(pid, out, cell=cell, anchor=anchor)
