"""Hollow Crown – sprite pipeline, part 3: unit models (story characters + generic classes).

Needs the namespaces of blender_chibi.py and blender_parts.py. Each builder creates the collection
U_<id> with a rig (empties) and role-coloured primitives. Roles map to palette ramps in ramps.py.
Briefings: concept/15-art-direction.md §6.
"""
import math


# ------------------------------------------------------------------------------------------------
# Effects shared by several units (tagged, shown only on some frames)
# ------------------------------------------------------------------------------------------------


def smear_arc(col, R, role="smear", r0=0.95, r1=1.38, a0=-35, a1=145, tilt=28, cx=-0.22, cz=None, n=12, x_off=0.0):
    """Crescent swing trail in the figure's sagittal plane, tilted so it reads from the front too.
    Angles: 0 = up, 90 = forward (-Y), 180 = down."""
    cz = R["top"] if cz is None else cz
    verts, faces = [], []
    for i in range(n):
        t = i / (n - 1)
        a = math.radians(a0 + (a1 - a0) * t)
        w = math.sin(math.pi * min(1.0, t * 1.15)) ** 0.7  # thick in the middle, pointed ends
        ri, ro = r1 - (r1 - r0) * w, r1
        for rr in (ri, ro):
            y, z = -math.sin(a) * rr, math.cos(a) * rr
            # tilt around the forward axis (y) so the arc sweeps diagonally across the body
            tt = math.radians(tilt)
            x = -z * math.sin(tt)
            z2 = z * math.cos(tt)
            verts.append((x + x_off, y, z2))
    for i in range(n - 1):
        a = i * 2
        faces.append((a, a + 1, a + 3, a + 2))
    ob = poly_mesh(col, role, verts, faces, loc=(cx, 0, cz), parent=R["root"], solidify=0.02)
    return tag(ob, "smear")


def smear_front(col, R, role="smear", r0=0.7, r1=1.05, a0=-10, a1=160, cz=None, n=12, y=-0.55, cx=-0.15):
    """Crescent in the frontal (XZ) plane for the s/n views: sweeps from overhead down the weapon side."""
    cz = R["top"] - 0.05 if cz is None else cz
    verts, faces = [], []
    for i in range(n):
        t = i / (n - 1)
        a = math.radians(a0 + (a1 - a0) * t)
        w = math.sin(math.pi * min(1.0, t * 1.15)) ** 0.7
        for rr in (r1 - (r1 - r0) * w, r1):
            verts.append((-math.sin(a) * rr, 0.0, math.cos(a) * rr))
    for i in range(n - 1):
        a = i * 2
        faces.append((a, a + 1, a + 3, a + 2))
    ob = poly_mesh(col, role, verts, faces, loc=(cx, y, cz), parent=R["root"], solidify=0.02)
    return tag(ob, "smear_front")


def smears(col, R, **kw):
    smear_arc(col, R, **kw)
    smear_front(col, R)


def thrust_lines(col, R, role="smear", z=None):
    z = R["top"] - 0.2 if z is None else z
    for dx, dz, L in ((0.0, 0.0, 0.7), (0.12, 0.1, 0.45), (-0.1, -0.08, 0.5)):
        ob = shape(col, "box", role, (-0.3 + dx, -1.05, z + dz), (0.02, L / 2, 0.02), parent=R["root"])
        tag(ob, "thrust")


def glow_fx(col, R, kind, role="glow", core="glow_core"):
    """Magic glows: on the casting hand, on the book, a burst in front of the caster."""
    out = []
    if kind in ("hand", "all"):
        hx, hy, hz = R["hand_R"]
        a = shape(col, "sphere", role, (hx, hy - 0.05, hz + 0.05), (0.14, 0.14, 0.14), parent=R["wrist_R"], seg=12)
        out.append(tag(a, "glow_hand"))
    if kind in ("book", "all"):
        hx, hy, hz = R["hand_L"]
        b = shape(col, "sphere", role, (hx + 0.05, hy - 0.12, hz + 0.3), (0.12, 0.12, 0.12), parent=R["wrist_L"], seg=12)
        out.append(tag(b, "glow_book"))
    if kind in ("burst", "all", "staff"):
        c = shape(col, "sphere", role, (-0.15, -0.95, R["top"] - 0.1), (0.3, 0.3, 0.3), parent=R["root"], seg=14)
        out.append(tag(c, "glow_burst"))
        d = shape(col, "sphere", core, (-0.15, -1.0, R["top"] - 0.1), (0.17, 0.17, 0.17), parent=R["root"], seg=10)
        out.append(tag(d, "glow_burst"))
    return out


# ------------------------------------------------------------------------------------------------
# Kael – captain. Longsword, ash cape, big left pauldron, scratched lance emblem, team sash.
# ------------------------------------------------------------------------------------------------


def build_kael(sc):
    uid = "kael"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid)
    top, hip = R["top"], R["body"]["hip"]
    hc = head_c(R)
    legs(col, R, "cloth_brown", "leather", cuff="leather_light")
    torso(col, R, "cloth_dark", rx=0.25, ry=0.2)
    # breastplate (old Silver Lance armour) with scratched-out lance emblem
    shape(col, "cyl", "steel", (0, -0.01, top - 0.24), (0.29, 0.235, 0.24), parent=R["chest"], top=0.85)
    shape(col, "sphere", "steel", (0, -0.03, top - 0.12), (0.28, 0.22, 0.16), parent=R["chest"])
    shape(col, "box", "scratch", (0.04, -0.245, top - 0.2), (0.02, 0.02, 0.1), rot=(0, 12, 0), parent=R["chest"])
    shape(col, "box", "scratch", (0.02, -0.245, top - 0.22), (0.07, 0.02, 0.018), rot=(0, -30, 0), parent=R["chest"])
    # team sash: diagonal over the chest + knot and hanging end at the right hip
    shape(col, "box", "team", (0.0, -0.215, top - 0.27), (0.34, 0.06, 0.06), rot=(0, 38, 0), parent=R["chest"], bevel=0.3)
    belt(col, R, "leather_dark", buckle="gold")
    shape(col, "cyl", "team", (0, 0, hip + 0.09), (0.29, 0.235, 0.045), parent=R["torso"])
    shape(col, "box", "team", (-0.2, -0.17, hip - 0.1), (0.05, 0.03, 0.14), rot=(8, 0, -10), parent=R["torso"], bevel=0.3)
    skirt(col, R, "leather", length=0.15, rx=0.28, ry=0.22, flare=1.12)
    # arms: dark sleeves, long leather bracers, gloves
    arms(col, R, "cloth_dark", glove="leather_dark", r=0.092)
    for side in ("L", "R"):
        hx, hy, hz = R["hand_" + side]
        shape(col, "cyl", "leather", (hx, 0, hz + 0.13), (0.105, 0.105, 0.12), parent=R["arm_" + side], top=1.12)
    # big pauldron on the LEFT shoulder (+X), layered plates
    shape(col, "hemi", "steel", (R["body"]["sh"] + 0.05, 0, top - 0.02), (0.25, 0.24, 0.2), rot=(0, 18, 0), parent=R["arm_L"])
    shape(col, "hemi", "steel", (R["body"]["sh"] + 0.1, 0, top - 0.14), (0.21, 0.21, 0.13), rot=(0, 26, 0), parent=R["arm_L"])
    shape(col, "sphere", "gold", (R["body"]["sh"] + 0.07, -0.2, top + 0.03), (0.035, 0.035, 0.035), parent=R["arm_L"], seg=8)
    # small right shoulder guard
    shape(col, "hemi", "steel_dark", (-R["body"]["sh"] - 0.03, 0, top - 0.04), (0.14, 0.15, 0.1), rot=(0, -15, 0), parent=R["arm_R"])
    # ash cape, tattered hem, hangs from the shoulders; collar bunched around the neck
    hem = [0.05, -0.02, 0.09, 0.0, 0.06, -0.03, 0.08, 0.01, 0.06]
    rows = cape_rows(top - 0.0, 0.18, 0.3, 0.42, 0.22, 0.06, hem=hem, wrap=0.85, flare=0.1)
    sheet_mesh(col, "ash", rows, parent=R["cape"], solidify=0.035)
    shape(col, "torus", "ash", (0, 0.03, top + 0.02), (0.25, 0.22, 0.2), parent=R["chest"], minor=0.42, seg=14)
    # head
    head(col, R, "skin", "eye", jaw="stubble", iris="eye_amber", brows="hair_brown")
    hair_cap(col, R, "hair_brown", back=0.04)
    crown_spikes(col, R, "hair_brown", [(0.22, 0.12, -25, 40, 0.18), (-0.2, 0.18, -35, -38, 0.2)], r=0.14)
    fringe(col, R, "hair_brown", [(-0.25, -14, 1.0), (-0.09, 6, 1.1), (0.08, -8, 0.85), (0.24, 16, 1.0)], length=0.17, r=0.12, tilt=24)
    side_locks(col, R, "hair_brown", length=0.24, r=0.09, x=0.4)
    ponytail(col, R, "hair_brown", length=0.26, r=0.09, tie="leather_dark", z=-0.02)
    # longsword
    sword(col, R, blade="blade", guard="gold", grip="leather_dark", length=0.95, width=0.085)
    smears(col, R)
    return finish_unit(col, uid, R, "sword")


# ------------------------------------------------------------------------------------------------
# Avatar "Rhen" – tactician. Night-blue long coat with silver trim, map satchel, hood back. Sword.
# ------------------------------------------------------------------------------------------------


def build_avatar(sc):
    uid = "avatar"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.34})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "cloth_dark", "leather_dark", r=0.105)
    torso(col, R, "night", rx=0.25, ry=0.2)
    # coat front: silver trim down the middle + buttons, collar
    shape(col, "box", "silver", (0, -0.21, top - 0.3), (0.03, 0.02, 0.3), parent=R["chest"])
    shape(col, "torus", "night", (0, 0.0, top + 0.03), (0.22, 0.2, 0.2), parent=R["chest"], minor=0.35, seg=14)
    # broken academy pin (left chest)
    shape(col, "sphere", "silver", (0.13, -0.22, top - 0.14), (0.035, 0.03, 0.035), parent=R["chest"], seg=8)
    # long coat skirt to the knees with silver hem
    skirt(col, R, "night", z_top=hip + 0.06, length=0.46, rx=0.27, ry=0.22, flare=1.32)
    shape(col, "torus", "silver", (0, 0, hip + 0.06 - 0.45), (0.355, 0.29, 0.3), parent=R["torso"], minor=0.07, seg=18)
    shape(col, "box", "silver", (0, -0.27, hip - 0.18), (0.03, 0.03, 0.22), rot=(-12, 0, 0), parent=R["torso"])
    # team scarf + belt
    shape(col, "torus", "team", (0, -0.02, top - 0.02), (0.2, 0.18, 0.18), parent=R["chest"], minor=0.42, seg=14)
    shape(col, "box", "team", (0.1, -0.2, top - 0.22), (0.05, 0.03, 0.15), rot=(6, 0, 12), parent=R["chest"], bevel=0.3)
    belt(col, R, "leather_dark", z=hip + 0.08, buckle="silver")
    # map satchel on the left hip, strap across the chest, rolled map sticking out
    shape(col, "box", "leather", (0.3, -0.05, hip - 0.02), (0.08, 0.15, 0.12), parent=R["torso"], bevel=0.3)
    shape(col, "box", "leather_light", (0.3, -0.12, hip + 0.06), (0.085, 0.1, 0.04), parent=R["torso"], bevel=0.3)
    shape(col, "cyl", "parchment", (0.32, 0.02, hip + 0.14), (0.04, 0.04, 0.1), rot=(10, 10, 0), parent=R["torso"], seg=8)
    shape(col, "box", "leather_dark", (0.02, -0.215, top - 0.26), (0.36, 0.04, 0.03), rot=(0, 45, 0), parent=R["chest"])
    arms(col, R, "night", glove="leather_dark", cuff="silver", r=0.095)
    # hood thrown back
    hood_down(col, R, "night")
    head(col, R, "skin", "eye", iris="eye_grey", brows="hair_black")
    hair_cap(col, R, "hair_black", back=0.05)
    fringe(col, R, "hair_black", [(-0.22, -18, 0.9), (-0.05, 4, 1.05), (0.13, 10, 0.95), (0.27, 20, 0.8)], length=0.17, r=0.12, tilt=24)
    side_locks(col, R, "hair_black", length=0.32, r=0.1, x=0.39, y=-0.0)
    shape(col, "sphere", "hair_black", (0, 0.32, head_c(R) - 0.12), (0.3, 0.14, 0.24), parent=R["head"])
    sword(col, R, blade="blade", guard="silver", grip="leather_dark", length=0.85, width=0.08)
    smears(col, R)
    return finish_unit(col, uid, R, "sword")


# ------------------------------------------------------------------------------------------------
# Brenna – fighter. Broad, red braid with grey streaks, fur collar, bare tattooed arms, big axe.
# ------------------------------------------------------------------------------------------------


def build_brenna(sc):
    uid = "brenna"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.42, "leg_x": 0.15, "hip": 0.58, "torso": 0.62})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "olive", "leather", r=0.13, cuff="fur")
    torso(col, R, "leather_dark", rx=0.33, ry=0.24)
    shape(col, "box", "leather", (0, -0.24, top - 0.3), (0.06, 0.02, 0.22), parent=R["chest"])
    belt(col, R, "leather", rx=0.34, ry=0.26, h=0.06, buckle="steel")
    skirt(col, R, "fur", length=0.2, rx=0.33, ry=0.26, flare=1.1)
    # big fur collar over the shoulders
    shape(col, "torus", "fur", (0, 0.02, top - 0.02), (0.34, 0.28, 0.26), parent=R["chest"], minor=0.42, seg=16)
    # bare muscular arms, burn-scar tattoos, team armbands (her orange ribbons), leather gloves
    arms(col, R, "skin", glove="leather_dark", r=0.11, hand_r=0.1, bare="skin")
    for side in ("L", "R"):
        s = 1 if side == "L" else -1
        x = s * (R["body"]["sh"] + 0.02)
        shape(col, "cyl", "team", (x, 0, top - 0.2), (0.125, 0.125, 0.045), parent=R["arm_" + side])
        shape(col, "box", "tattoo", (x + s * 0.08, -0.06, top - 0.1), (0.03, 0.04, 0.05), parent=R["arm_" + side])
        hx, hy, hz = R["hand_" + side]
        shape(col, "cyl", "leather_dark", (hx, 0, hz + 0.1), (0.12, 0.12, 0.08), parent=R["arm_" + side], top=1.1)
    head(col, R, "skin", "eye", iris="eye_brown", brows="hair_red", jaw="skin")
    shape(col, "box", "freckle", (0.0, -0.39, head_c(R) - 0.13), (0.2, 0.02, 0.012), parent=R["head"])
    hair_cap(col, R, "hair_red", back=0.06, high=0.03)
    fringe(col, R, "hair_red", [(-0.26, -22, 0.8), (-0.1, -8, 0.6), (0.2, 16, 0.75)], length=0.17, r=0.14, tilt=34)
    shape(col, "sphere", "hair_grey", (-0.2, -0.16, head_c(R) + 0.26), (0.1, 0.18, 0.08), rot=(0, -30, 0), parent=R["head"], seg=10)
    side_locks(col, R, "hair_red", length=0.2, r=0.11, x=0.4)
    # thick braid over the right shoulder, grey streaks woven in
    braid(col, R, "hair_red", n=6, start=(-0.34, -0.02, head_c(R) - 0.22), step=(-0.02, -0.035, -0.11), r=0.12, shrink=0.9, streak="hair_grey", tie="leather_dark")
    axe(col, R, head_role="steel", edge="blade", haft="wood", length=1.05, big=1.2, double=True, wrap="team")
    smears(col, R)
    return finish_unit(col, uid, R, "axe")


# ------------------------------------------------------------------------------------------------
# Tobin – soldier. Lanky, straw-blond, oversized crooked kettle hat, wrapped spear, wooden shield.
# ------------------------------------------------------------------------------------------------


def build_tobin(sc):
    uid = "tobin"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.31, "leg_x": 0.11, "hip": 0.66, "torso": 0.56})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "olive", "leather", r=0.095, cuff="leather_light")
    for side in ("L", "R"):
        x = R["body"]["leg_x"] * (1 if side == "L" else -1)
        shape(col, "cyl", "wrap", (x, 0, 0.3), (0.1, 0.1, 0.08), parent=R["leg_" + side])
    torso(col, R, "linen", rx=0.25, ry=0.2)
    # oversized gambeson: long quilted skirt, toggles
    skirt(col, R, "linen", z_top=hip + 0.1, length=0.36, rx=0.26, ry=0.21, flare=1.22)
    for k in range(3):
        shape(col, "box", "leather_dark", (0, -0.215, top - 0.12 - k * 0.14), (0.05, 0.02, 0.02), parent=R["chest"])
    belt(col, R, "leather", z=hip + 0.08, rx=0.27, ry=0.22, buckle="steel")
    shape(col, "box", "leather", (0.24, -0.08, hip - 0.0), (0.06, 0.1, 0.08), parent=R["torso"], bevel=0.3)
    # green scarf with a flapping tail
    shape(col, "torus", "green_cloth", (0, 0.0, top - 0.04), (0.21, 0.19, 0.18), parent=R["chest"], minor=0.42, seg=14)
    shape(col, "box", "green_cloth", (-0.14, -0.12, top - 0.2), (0.06, 0.03, 0.14), rot=(10, 0, -18), parent=R["chest"], bevel=0.3)
    arms(col, R, "linen", glove="leather_dark", r=0.09)
    # team armband on the left arm
    shape(col, "cyl", "team", (R["body"]["sh"] + 0.02, 0, top - 0.2), (0.11, 0.11, 0.05), parent=R["arm_L"])
    head(col, R, "skin", "eye", iris="eye_green", mouth=None)
    hair_cap(col, R, "hair_straw", back=0.05)
    fringe(col, R, "hair_straw", [(-0.28, -30, 0.9), (-0.12, -6, 1.05), (0.06, 12, 0.95), (0.24, 28, 1.0)], length=0.18, r=0.12, tilt=30)
    crown_spikes(col, R, "hair_straw", [(0.36, 0.05, -10, 80, 0.16), (-0.36, 0.1, -10, -80, 0.16), (0.2, 0.3, -60, 50, 0.16), (-0.18, 0.32, -70, -40, 0.16)], r=0.1)
    kettle_hat(col, R, "hat_steel", brim=0.6, tilt=(-6, 15), dome=(0.42, 0.42, 0.3), z=0.27, rim="steel_dark")
    spear(col, R, shaft="wood_light", tip="blade", length=1.75, wrap="wrap")
    # round wooden shield on the left arm
    hx, hy, hz = R["hand_L"]
    W = R["wrist_L"]
    shape(col, "cyl", "wood_light", (hx + 0.04, hy - 0.12, hz + 0.08), (0.27, 0.27, 0.035), rot=(90, 0, 0), parent=W, seg=18)
    shape(col, "torus", "steel_dark", (hx + 0.04, hy - 0.14, hz + 0.08), (0.27, 0.27, 0.27), rot=(90, 0, 0), parent=W, minor=0.1, seg=18)
    shape(col, "sphere", "steel", (hx + 0.04, hy - 0.17, hz + 0.08), (0.07, 0.05, 0.07), parent=W, seg=10)
    thrust_lines(col, R)
    return finish_unit(col, uid, R, "lance_shield")


# ------------------------------------------------------------------------------------------------
# Generic bandit (brigand) – headscarf (team), beard, fur vest, axe; earth-brown / olive rags.
# ------------------------------------------------------------------------------------------------


def build_brigand(sc, uid="brigand"):
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.39, "leg_x": 0.14})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "rags_olive", "leather_dark", r=0.12, cuff="rag")
    torso(col, R, "rags_brown", rx=0.3, ry=0.23)
    # fur vest open at the front
    for s in (1, -1):
        shape(col, "box", "fur_dark", (s * 0.18, -0.08, top - 0.28), (0.13, 0.17, 0.28), rot=(0, 0, s * 8), parent=R["chest"], bevel=0.4)
    shape(col, "torus", "fur_dark", (0, 0.02, top - 0.02), (0.29, 0.25, 0.22), parent=R["chest"], minor=0.38, seg=14)
    belt(col, R, "leather_dark", rx=0.31, ry=0.24, buckle="iron")
    skirt(col, R, "rags_brown", length=0.18, rx=0.3, ry=0.24, flare=1.12)
    shape(col, "box", "rust", (0.2, -0.2, hip - 0.06), (0.07, 0.03, 0.08), parent=R["torso"])  # patch
    arms(col, R, "skin_tan", glove="leather_dark", r=0.1, bare="skin_tan")
    for side in ("L", "R"):
        hx, hy, hz = R["hand_" + side]
        shape(col, "cyl", "rag", (hx, 0, hz + 0.11), (0.115, 0.115, 0.07), parent=R["arm_" + side], top=1.1)
    head(col, R, "skin_tan", "eye", iris="eye_dark", brows="hair_black")
    hair_cap(col, R, "hair_black", back=0.02)
    beard(col, R, "hair_black", size=1.1, y=-0.27)
    shape(col, "box", "hair_black", (0, -0.39, head_c(R) - 0.12), (0.14, 0.03, 0.03), parent=R["head"])  # moustache
    # headscarf (team) with knot tails at the back
    hc = head_c(R)
    shape(col, "sphere", "team", (0, 0.06, hc + 0.13), (0.45, 0.44, 0.33), parent=R["head"], seg=18)
    shape(col, "cyl", "team", (0, 0.02, hc + 0.1), (0.45, 0.43, 0.06), parent=R["head"], seg=18)
    shape(col, "box", "team", (0.08, 0.45, hc - 0.02), (0.05, 0.03, 0.16), rot=(-20, 0, 12), parent=R["tail"])
    shape(col, "box", "team", (-0.06, 0.44, hc - 0.05), (0.05, 0.03, 0.13), rot=(-15, 0, -14), parent=R["tail"])
    axe(col, R, head_role="iron", edge="blade", haft="wood", length=0.9, big=1.0)
    smears(col, R)
    return finish_unit(col, uid, R, "axe")


# ------------------------------------------------------------------------------------------------
# Bandit archer – hood, team mask over the lower face, quiver, bow.
# ------------------------------------------------------------------------------------------------


def build_bandit_archer(sc, uid="bandit_archer"):
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.33})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "rags_brown", "leather_dark", r=0.105, cuff="rag")
    torso(col, R, "leather", rx=0.26, ry=0.21)
    belt(col, R, "leather_dark", buckle="iron")
    skirt(col, R, "rags_olive", length=0.28, rx=0.27, ry=0.22, flare=1.2)
    arms(col, R, "rags_olive", glove="leather_dark", r=0.09, cuff="rag")
    quiver(col, R, role="leather_dark", fletch="fletch")
    shape(col, "box", "leather_dark", (0.0, -0.215, top - 0.25), (0.34, 0.035, 0.03), rot=(0, -45, 0), parent=R["chest"])
    head(col, R, "skin_tan", "eye", iris="eye_dark", brows="hair_black")
    # mask (team) over nose and mouth
    shape(col, "sphere", "team", (0, -0.1, head_c(R) - 0.16), (0.37, 0.33, 0.2), parent=R["head"])
    hood_up(col, R, "rags_olive", tip=True)
    bow(col, R, wood="wood", string="string", length=1.0)
    bow_fx(col, R)
    return finish_unit(col, uid, R, "bow")


# ------------------------------------------------------------------------------------------------
# Grosk – bandit boss. Huge, bald, two-braided chin beard, fur coat, iron jaw guard, big axe.
# ------------------------------------------------------------------------------------------------


def build_grosk(sc):
    uid = "grosk"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.44, "leg_x": 0.16, "hip": 0.56, "torso": 0.64, "scale": 1.24})
    top, hip = R["top"], R["body"]["hip"]
    hc = head_c(R)
    legs(col, R, "rags_brown", "leather_dark", r=0.14, cuff="fur_dark")
    torso(col, R, "leather_dark", rx=0.36, ry=0.27, flare=1.05)
    shape(col, "sphere", "skin_tan", (0, -0.2, top - 0.2), (0.16, 0.06, 0.14), parent=R["chest"])  # bare chest
    # heavy fur coat: shoulders + long sides
    shape(col, "torus", "fur_dark", (0, 0.03, top - 0.03), (0.38, 0.31, 0.3), parent=R["chest"], minor=0.45, seg=16)
    for s in (1, -1):
        shape(col, "box", "fur_dark", (s * 0.27, 0.0, top - 0.42), (0.13, 0.27, 0.42), rot=(0, 0, s * 6), parent=R["chest"], bevel=0.4)
    rows = cape_rows(top - 0.05, 0.12, 0.38, 0.5, 0.24, 0.05, hem=[0.04, 0.0, 0.06, 0.02, 0.05, 0.0, 0.06, 0.01, 0.04], wrap=0.9, flare=0.12)
    sheet_mesh(col, "fur_dark", rows, parent=R["cape"], solidify=0.05)
    belt(col, R, "leather", rx=0.37, ry=0.28, h=0.07, buckle="iron")
    shape(col, "cyl", "team", (0, 0, hip + 0.11), (0.37, 0.28, 0.05), parent=R["torso"])
    shape(col, "box", "team", (0.16, -0.25, hip - 0.12), (0.07, 0.03, 0.17), rot=(6, 0, 8), parent=R["torso"], bevel=0.3)
    arms(col, R, "skin_tan", glove="leather_dark", r=0.12, hand_r=0.11, bare="skin_tan")
    for side in ("L", "R"):
        hx, hy, hz = R["hand_" + side]
        shape(col, "cyl", "iron", (hx, 0, hz + 0.12), (0.13, 0.13, 0.09), parent=R["arm_" + side], top=1.1)
    # bald head with heavy brow, iron jaw guard, two braided beard tails
    head(col, R, "skin_tan", "eye", iris="eye_dark", brows="hair_ginger")
    shape(col, "sphere", "scar", (0.18, -0.3, hc + 0.22), (0.05, 0.02, 0.1), rot=(0, 30, 0), parent=R["head"])
    shape(col, "cyl", "iron", (0, -0.12, hc - 0.2), (0.36, 0.3, 0.1), parent=R["head"], seg=16)
    shape(col, "box", "iron", (0, -0.4, hc - 0.2), (0.16, 0.03, 0.08), parent=R["head"], bevel=0.3)
    for s in (1, -1):
        braid(col, R, "hair_ginger", n=4, start=(s * 0.1, -0.33, hc - 0.32), step=(s * 0.01, -0.02, -0.1), r=0.075, shrink=0.88, tie="iron")
    axe(col, R, head_role="iron", edge="blade", haft="wood", length=1.15, big=1.35, double=False, wrap="leather")
    smears(col, R)
    return finish_unit(col, uid, R, "axe")


# ------------------------------------------------------------------------------------------------
# Mira – archer. Asymmetric black bob with green streak, leaf-woven poacher cloak, longbow.
# ------------------------------------------------------------------------------------------------


def build_mira(sc):
    uid = "mira"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.32, "leg_x": 0.12})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "leather_dark", "leather", r=0.1, cuff="leather_light")
    torso(col, R, "cream", rx=0.24, ry=0.19)
    shape(col, "cyl", "leather", (0, -0.01, top - 0.32), (0.25, 0.2, 0.17), parent=R["chest"])  # bodice
    belt(col, R, "leather_dark", buckle="steel")
    shape(col, "cyl", "team", (0, 0, hip + 0.12), (0.255, 0.205, 0.04), parent=R["torso"])
    skirt(col, R, "leather", length=0.2, rx=0.25, ry=0.2, flare=1.15)
    arms(col, R, "cream", glove="leather_dark", r=0.085, cuff="leather")
    # poacher cloak with woven leaves: wraps the shoulders, hangs to the knees
    rows = cape_rows(top + 0.02, 0.3, 0.33, 0.44, 0.2, 0.05, hem=[0.06, -0.03, 0.05, -0.02, 0.07, -0.04, 0.05, -0.02, 0.06], wrap=1.0, flare=0.08)
    sheet_mesh(col, "leafy", rows, parent=R["cape"], solidify=0.04)
    for (x, z) in ((0.25, top - 0.2), (-0.28, top - 0.35), (0.1, top - 0.55), (-0.15, 0.55), (0.3, 0.45), (-0.05, top - 0.1)):
        shape(col, "sphere", "leaf_hi", (x, 0.35, z), (0.08, 0.05, 0.06), rot=(0, 30, 0), parent=R["cape"], seg=8)
    shape(col, "torus", "leafy", (0, 0.03, top + 0.0), (0.24, 0.21, 0.2), parent=R["chest"], minor=0.42, seg=14)
    hood_down(col, R, "leafy")
    quiver(col, R, role="leather", fletch="fletch", x=-0.1, tilt=25)
    head(col, R, "skin_pale", "eye", iris="eye_green", brows="hair_black")
    hair_cap(col, R, "hair_black", back=0.0)
    bob(col, R, "hair_black", long_side=1, streak="hair_green")
    bow(col, R, wood="wood", string="string", length=1.25, grip="leather_dark")
    bow_fx(col, R)
    return finish_unit(col, uid, R, "bow")


# ------------------------------------------------------------------------------------------------
# Hask – marauder captain. Gaunt, blackened leather half mask, burning torch + axe.
# ------------------------------------------------------------------------------------------------


def build_hask(sc):
    uid = "hask"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.32, "leg_x": 0.11, "hip": 0.66, "torso": 0.58})
    top, hip = R["top"], R["body"]["hip"]
    hc = head_c(R)
    legs(col, R, "leather_black", "leather_dark", r=0.09, cuff="rust")
    torso(col, R, "leather_black", rx=0.23, ry=0.18)
    # ragged rust coat, open, long tails
    for s in (1, -1):
        shape(col, "box", "rust", (s * 0.16, -0.06, top - 0.32), (0.1, 0.16, 0.32), rot=(0, 0, s * 5), parent=R["chest"], bevel=0.3)
    rows = cape_rows(top - 0.05, 0.22, 0.25, 0.34, 0.16, 0.03, hem=[0.08, -0.04, 0.1, 0.0, 0.12, -0.02, 0.09, -0.05, 0.08], wrap=0.9, flare=0.06)
    sheet_mesh(col, "rust", rows, parent=R["cape"], solidify=0.03)
    shape(col, "box", "team", (0.0, -0.2, top - 0.25), (0.3, 0.04, 0.05), rot=(0, -38, 0), parent=R["chest"], bevel=0.3)
    belt(col, R, "leather_dark", rx=0.25, ry=0.2, buckle="iron")
    shape(col, "box", "team", (0.14, -0.17, hip - 0.12), (0.05, 0.03, 0.16), rot=(8, 0, 10), parent=R["torso"], bevel=0.3)
    arms(col, R, "leather_black", glove="leather_dark", r=0.08, cuff="rust")
    head(col, R, "skin_grey", "eye", iris="eye_red", brows="hair_black", sx=0.95)
    shape(col, "sphere", "scar", (-0.2, -0.3, hc + 0.12), (0.1, 0.04, 0.12), parent=R["head"])  # burn scar
    # blackened leather half mask over the lower face
    shape(col, "sphere", "leather_black", (0, -0.1, hc - 0.16), (0.37, 0.33, 0.2), parent=R["head"])
    shape(col, "box", "iron", (0.0, -0.42, hc - 0.16), (0.12, 0.02, 0.02), parent=R["head"])
    hair_cap(col, R, "hair_black", back=0.03, sx=0.97)
    crown_spikes(col, R, "hair_black", [(-0.25, 0.1, -15, -50, 0.22), (0.25, 0.1, -15, 50, 0.22), (0.0, 0.28, -70, 0, 0.25), (-0.12, -0.1, 20, -20, 0.16)], r=0.1)
    axe(col, R, head_role="iron", edge="blade", haft="wood", length=0.85, big=0.95)
    flicker(torch(col, R, side="L"))
    smears(col, R)
    return finish_unit(col, uid, R, "axe_torch")


# ------------------------------------------------------------------------------------------------
# Liora – cleric. Long silver-white hair, white-gold robe, staff with an empty crown.
# ------------------------------------------------------------------------------------------------


def build_liora(sc):
    uid = "liora"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.31, "leg_x": 0.1})
    top, hip = R["top"], R["body"]["hip"]
    hc = head_c(R)
    legs(col, R, "white", "white", r=0.09)
    torso(col, R, "white", rx=0.23, ry=0.19)
    # long robe to the ground with gold hem (dragon-scale pattern hinted by a band)
    skirt(col, R, "white", z_top=hip + 0.08, length=hip + 0.04, rx=0.24, ry=0.2, flare=1.6)
    shape(col, "torus", "gold", (0, 0, 0.06), (0.37, 0.31, 0.3), parent=R["torso"], minor=0.08, seg=20)
    belt(col, R, "gold", z=hip + 0.1, rx=0.245, ry=0.2, h=0.035)
    # team stole hanging down the front
    for s in (1, -1):
        shape(col, "box", "team", (s * 0.1, -0.22, top - 0.42), (0.045, 0.025, 0.42), rot=(-6, 0, s * 3), parent=R["chest"])
    shape(col, "torus", "team", (0, -0.02, top - 0.02), (0.18, 0.16, 0.16), parent=R["chest"], minor=0.35, seg=14)
    # wide sleeves
    arms(col, R, "white", hand="skin_pale", r=0.085, cuff="gold")
    for side in ("L", "R"):
        hx, hy, hz = R["hand_" + side]
        shape(col, "cyl", "white", (hx, 0, hz + 0.16), (0.13, 0.13, 0.1), parent=R["arm_" + side], top=0.75)
    head(col, R, "skin_pale", "eye", iris="eye_gold", brows="hair_silver")
    hair_cap(col, R, "hair_silver", back=0.06)
    fringe(col, R, "hair_silver", [(-0.24, -12, 0.9), (-0.06, 4, 1.0), (0.12, 10, 0.95), (0.27, 18, 0.9)], length=0.17, r=0.12, tilt=22)
    side_locks(col, R, "hair_silver", length=0.5, r=0.11, x=0.37, y=-0.05)
    long_hair(col, R, "hair_silver", length=0.85, width=0.36)
    shape(col, "torus", "gold", (0, 0.03, hc + 0.26), (0.4, 0.38, 0.4), rot=(-8, 0, 0), parent=R["head"], minor=0.05, seg=20)  # circlet
    staff(col, R, shaft="wood_light", head_role="gold", gem=None, length=1.6, crown=True)
    staff_glow(col, R, length=1.6)
    glow_fx(col, R, "burst")
    return finish_unit(col, uid, R, "staff")


# ------------------------------------------------------------------------------------------------
# Varek – mercenary. Black wolf hair, plum duelling coat with gold buttons, half cape, slim sword.
# ------------------------------------------------------------------------------------------------


def build_varek(sc):
    uid = "varek"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.33, "leg_x": 0.12})
    top, hip = R["top"], R["body"]["hip"]
    hc = head_c(R)
    legs(col, R, "cloth_dark", "leather_black", r=0.1, boot_h=0.26)
    torso(col, R, "plum", rx=0.24, ry=0.19)
    for k in range(3):
        for s in (1, -1):
            shape(col, "sphere", "button", (s * 0.08, -0.205, top - 0.14 - k * 0.12), (0.03, 0.02, 0.03), parent=R["chest"], seg=8)
    skirt(col, R, "plum", z_top=hip + 0.06, length=0.3, rx=0.25, ry=0.2, flare=1.25)
    belt(col, R, "leather_black", z=hip + 0.08, rx=0.25, ry=0.2, buckle="gold")
    shape(col, "cyl", "team", (0, 0, hip + 0.14), (0.25, 0.2, 0.035), parent=R["torso"])
    shape(col, "box", "team", (-0.18, -0.15, hip - 0.04), (0.04, 0.03, 0.12), rot=(6, 0, -8), parent=R["torso"])
    shape(col, "torus", "plum_dark", (0, 0.0, top + 0.02), (0.2, 0.18, 0.2), parent=R["chest"], minor=0.4, seg=14)
    arms(col, R, "plum", glove="leather_black", r=0.085, cuff="gold")
    # half cape over the left shoulder
    rows = cape_rows(top + 0.02, 0.45, 0.22, 0.3, 0.12, 0.04, n=7, wrap=0.9, flare=0.06)
    rows = [[(x + 0.16, y, z) for (x, y, z) in r] for r in rows]
    sheet_mesh(col, "plum_dark", rows, parent=R["cape"], solidify=0.035)
    shape(col, "hemi", "plum_dark", (R["body"]["sh"] + 0.02, 0, top - 0.02), (0.17, 0.18, 0.12), rot=(0, 15, 0), parent=R["arm_L"])
    head(col, R, "skin", "eye", iris="eye_violet", brows="hair_black")
    shape(col, "box", "button", (-0.43, -0.02, hc - 0.16), (0.025, 0.025, 0.03), parent=R["head"])  # dice earring
    hair_cap(col, R, "hair_black_violet", back=0.06, high=0.02)
    fringe(col, R, "hair_black_violet", [(-0.26, -20, 1.0), (-0.08, -4, 1.15), (0.1, 10, 1.0), (0.27, 24, 0.95)], length=0.18, r=0.12, tilt=28)
    crown_spikes(col, R, "hair_black_violet", [(-0.3, 0.12, -10, -65, 0.22), (0.3, 0.12, -10, 65, 0.22), (-0.15, 0.32, -70, -25, 0.22), (0.15, 0.32, -70, 25, 0.22), (0.0, 0.15, -30, 0, 0.18)], r=0.11)
    side_locks(col, R, "hair_black_violet", length=0.26, r=0.1, x=0.4)
    sword(col, R, blade="blade", guard="gold", grip="leather_black", length=0.92, width=0.05, thin=0.022)
    smears(col, R)
    return finish_unit(col, uid, R, "sword")


# ------------------------------------------------------------------------------------------------
# Morra – mercenary boss. Wiry, grey short hair, eyepatch with a carved coin, sword.
# ------------------------------------------------------------------------------------------------


def build_morra(sc):
    uid = "morra"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.33, "leg_x": 0.12, "hip": 0.62})
    top, hip = R["top"], R["body"]["hip"]
    hc = head_c(R)
    legs(col, R, "cloth_brown", "leather_dark", r=0.1, cuff="steel_dark")
    torso(col, R, "leather", rx=0.25, ry=0.2)
    shape(col, "cyl", "steel_dark", (0, -0.01, top - 0.22), (0.27, 0.22, 0.2), parent=R["chest"], top=0.85)  # brigandine
    for k in range(2):
        shape(col, "box", "steel", (0, -0.225, top - 0.14 - k * 0.12), (0.2, 0.015, 0.012), parent=R["chest"])
    belt(col, R, "leather_dark", buckle="gold")
    skirt(col, R, "leather", length=0.22, rx=0.26, ry=0.21, flare=1.15)
    shape(col, "box", "team", (0.0, -0.2, top - 0.26), (0.33, 0.045, 0.05), rot=(0, 40, 0), parent=R["chest"], bevel=0.3)
    shape(col, "torus", "team", (0, -0.0, top + 0.01), (0.2, 0.18, 0.18), parent=R["chest"], minor=0.38, seg=14)
    arms(col, R, "leather", glove="leather_dark", r=0.085, cuff="steel_dark")
    shape(col, "hemi", "steel_dark", (R["body"]["sh"] + 0.03, 0, top - 0.03), (0.16, 0.16, 0.11), rot=(0, 15, 0), parent=R["arm_L"])
    shape(col, "hemi", "steel_dark", (-R["body"]["sh"] - 0.03, 0, top - 0.03), (0.16, 0.16, 0.11), rot=(0, -15, 0), parent=R["arm_R"])
    head(col, R, "skin_grey", None, brows="hair_grey", sx=0.96)
    eyes(col, R, "eye_grey", only=-1)  # right eye (screen left); left eye under the patch
    shape(col, "box", "leather_black", (0.16, -0.37, hc - 0.03), (0.09, 0.05, 0.085), parent=R["head"], bevel=0.3)
    shape(col, "sphere", "button", (0.16, -0.425, hc - 0.03), (0.03, 0.01, 0.03), parent=R["head"], seg=8)
    shape(col, "box", "leather_black", (0.0, -0.33, hc + 0.1), (0.4, 0.02, 0.02), rot=(0, -25, 0), parent=R["head"])
    hair_cap(col, R, "hair_grey", back=0.0, sx=0.98)
    fringe(col, R, "hair_grey", [(-0.25, -20, 0.6), (-0.08, -6, 0.5), (0.1, 10, 0.55)], length=0.15, r=0.12, tilt=40)
    crown_spikes(col, R, "hair_grey", [(-0.2, 0.15, -30, -40, 0.14), (0.2, 0.15, -30, 40, 0.14), (0.0, 0.3, -70, 0, 0.14)], r=0.1)
    sword(col, R, blade="blade", guard="steel", grip="leather_dark", length=0.9, width=0.08)
    smears(col, R)
    return finish_unit(col, uid, R, "sword")


# ------------------------------------------------------------------------------------------------
# Generic mercenary classes
# ------------------------------------------------------------------------------------------------


def build_mercenary(sc):
    uid = "mercenary"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.33, "leg_x": 0.12})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "cloth_brown", "leather_dark", r=0.1, cuff="leather")
    torso(col, R, "leather", rx=0.24, ry=0.19)
    shape(col, "box", "leather_dark", (0.0, -0.2, top - 0.25), (0.33, 0.035, 0.03), rot=(0, 40, 0), parent=R["chest"])
    belt(col, R, "leather_dark", buckle="steel")
    skirt(col, R, "cloth_brown", length=0.24, rx=0.25, ry=0.2, flare=1.18)
    arms(col, R, "cloth_brown", glove="leather_dark", r=0.085, cuff="leather")
    # half cape (team) over the left shoulder – the class silhouette
    rows = cape_rows(top + 0.02, 0.42, 0.22, 0.3, 0.12, 0.05, n=7, wrap=0.95, flare=0.08, hem=[0.0, 0.03, 0.0, 0.04, 0.0, 0.03, 0.0])
    rows = [[(x + 0.17, y, z) for (x, y, z) in r] for r in rows]
    sheet_mesh(col, "team", rows, parent=R["cape"], solidify=0.035)
    shape(col, "hemi", "team", (R["body"]["sh"] + 0.02, 0, top - 0.02), (0.17, 0.18, 0.12), rot=(0, 15, 0), parent=R["arm_L"])
    shape(col, "sphere", "steel", (0.2, -0.17, top - 0.02), (0.04, 0.03, 0.04), parent=R["chest"], seg=8)  # clasp
    # sheath at the hip
    shape(col, "box", "leather_dark", (0.27, 0.0, hip - 0.12), (0.03, 0.05, 0.24), rot=(25, 0, 0), parent=R["torso"])
    head(col, R, "skin", "eye", iris="eye_brown", brows="hair_auburn")
    hair_cap(col, R, "hair_auburn", back=0.03)
    fringe(col, R, "hair_auburn", [(-0.25, -16, 0.9), (-0.08, 0, 1.0), (0.1, 12, 0.95), (0.26, 20, 0.85)], length=0.17, r=0.12, tilt=26)
    side_locks(col, R, "hair_auburn", length=0.22, r=0.09, x=0.4)
    sword(col, R, blade="blade", guard="steel", grip="leather_dark", length=0.88, width=0.075)
    smears(col, R)
    return finish_unit(col, uid, R, "sword")


def build_archer(sc):
    uid = "archer"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.32, "leg_x": 0.12})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "cloth_brown", "leather", r=0.1, cuff="leather_light")
    torso(col, R, "green_cloth", rx=0.24, ry=0.19)
    shape(col, "cyl", "leather", (0, -0.01, top - 0.3), (0.25, 0.2, 0.16), parent=R["chest"])
    belt(col, R, "leather_dark", buckle="steel")
    skirt(col, R, "green_cloth", length=0.26, rx=0.25, ry=0.2, flare=1.2)
    arms(col, R, "green_cloth", glove="leather_dark", r=0.085, cuff="leather")
    shape(col, "cyl", "leather_light", (R["body"]["sh"] + 0.02, 0, R["hand_L"][2] + 0.14), (0.1, 0.1, 0.1), parent=R["arm_L"])  # bracer
    quiver(col, R, role="leather", fletch="fletch")
    shape(col, "box", "leather_dark", (0.0, -0.215, top - 0.25), (0.34, 0.035, 0.03), rot=(0, -45, 0), parent=R["chest"])
    head(col, R, "skin", "eye", iris="eye_green", brows="hair_brown")
    fringe(col, R, "hair_brown", [(-0.15, -10, 0.9), (0.05, 6, 1.0), (0.2, 14, 0.85)], length=0.15, r=0.11, tilt=24, z=head_c(R) + 0.26)
    hood_up(col, R, "team", tip=True)
    bow(col, R, wood="wood_light", string="string", length=1.05)
    bow_fx(col, R)
    return finish_unit(col, uid, R, "bow")


def build_fighter(sc):
    uid = "fighter"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.41, "leg_x": 0.15, "hip": 0.58, "torso": 0.62})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "cloth_brown", "leather_dark", r=0.13, cuff="fur")
    torso(col, R, "leather", rx=0.32, ry=0.24)
    shape(col, "box", "leather_dark", (0.0, -0.22, top - 0.25), (0.38, 0.04, 0.035), rot=(0, 42, 0), parent=R["chest"])
    shape(col, "sphere", "steel", (0.2, -0.17, top - 0.08), (0.06, 0.04, 0.06), parent=R["chest"], seg=8)
    belt(col, R, "leather_dark", rx=0.33, ry=0.25, h=0.06, buckle="steel")
    skirt(col, R, "fur", length=0.18, rx=0.33, ry=0.25, flare=1.1)
    shape(col, "hemi", "fur", (R["body"]["sh"] + 0.02, 0, top - 0.0), (0.2, 0.2, 0.14), rot=(0, 15, 0), parent=R["arm_L"])
    arms(col, R, "skin_tan", glove="leather_dark", r=0.11, hand_r=0.1, bare="skin_tan")
    for side in ("L", "R"):
        hx, hy, hz = R["hand_" + side]
        shape(col, "cyl", "leather", (hx, 0, hz + 0.1), (0.12, 0.12, 0.08), parent=R["arm_" + side], top=1.1)
    head(col, R, "skin_tan", "eye", iris="eye_dark", brows="hair_black")
    hair_cap(col, R, "hair_black", back=0.0, high=-0.02)
    crown_spikes(col, R, "hair_black", [(0.0, 0.05, -10, 0, 0.18), (0.0, 0.25, -50, 0, 0.18), (0.0, -0.15, 30, 0, 0.14)], r=0.12)
    hc = head_c(R)
    shape(col, "cyl", "team", (0, 0.02, hc + 0.15), (0.45, 0.43, 0.05), rot=(-4, 0, 0), parent=R["head"], seg=18)  # headband
    shape(col, "box", "team", (0.05, 0.44, hc + 0.06), (0.04, 0.03, 0.12), rot=(-25, 0, 14), parent=R["tail"])
    beard(col, R, "hair_black", size=0.85, y=-0.3)
    axe(col, R, head_role="steel", edge="blade", haft="wood", length=1.0, big=1.12, wrap="leather")
    smears(col, R)
    return finish_unit(col, uid, R, "axe")


def build_mage(sc):
    uid = "mage"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.31, "leg_x": 0.1})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "violet", "leather_dark", r=0.09)
    torso(col, R, "violet", rx=0.23, ry=0.19)
    skirt(col, R, "violet", z_top=hip + 0.08, length=hip - 0.02, rx=0.24, ry=0.2, flare=1.5)
    shape(col, "torus", "gold", (0, 0, 0.12), (0.35, 0.3, 0.3), parent=R["torso"], minor=0.07, seg=18)
    shape(col, "cyl", "team", (0, 0, hip + 0.1), (0.245, 0.2, 0.055), parent=R["torso"])
    shape(col, "box", "team", (0.12, -0.2, hip - 0.12), (0.045, 0.03, 0.18), rot=(4, 0, 6), parent=R["torso"])
    # high collar
    shape(col, "cyl", "violet", (0, 0.05, top + 0.1), (0.26, 0.22, 0.14), parent=R["chest"], top=1.3, seg=14)
    shape(col, "box", "gold", (0, -0.2, top - 0.2), (0.03, 0.02, 0.2), parent=R["chest"])
    # wide bell sleeves
    arms(col, R, "violet", hand="skin", r=0.085, cuff="gold")
    for side in ("L", "R"):
        hx, hy, hz = R["hand_" + side]
        shape(col, "cyl", "violet", (hx, 0, hz + 0.15), (0.15, 0.15, 0.11), parent=R["arm_" + side], top=0.65)
    head(col, R, "skin", "eye", iris="eye_blue", brows="hair_ginger")
    hair_cap(col, R, "hair_ginger", back=0.06)
    side_locks(col, R, "hair_ginger", length=0.36, r=0.11, x=0.39, y=-0.02)
    fringe(col, R, "hair_ginger", [(-0.2, -12, 0.9), (0.0, 0, 1.0), (0.2, 12, 0.9)], length=0.15, r=0.12, tilt=22)
    pointed_hat(col, R, "violet", band="gold", brim=0.62, height=0.78)
    tome(col, R, cover="tome", page="page")
    glow_fx(col, R, "all")
    return finish_unit(col, uid, R, "tome")


def build_soldier(sc):
    uid = "soldier"
    col = new_collection(sc, f"U_{uid}")
    R = build_rig(col, uid, {"sh": 0.33, "leg_x": 0.12})
    top, hip = R["top"], R["body"]["hip"]
    legs(col, R, "cloth_brown", "leather_dark", r=0.1, cuff="steel_dark")
    torso(col, R, "linen", rx=0.25, ry=0.2)
    # tabard (team) over the gambeson
    shape(col, "box", "team", (0, -0.17, top - 0.36), (0.19, 0.06, 0.34), parent=R["chest"], bevel=0.2)
    shape(col, "box", "team", (0, -0.2, hip - 0.16), (0.17, 0.04, 0.18), rot=(-8, 0, 0), parent=R["torso"])
    shape(col, "box", "team", (0, 0.18, top - 0.36), (0.19, 0.06, 0.34), parent=R["chest"], bevel=0.2)
    belt(col, R, "leather_dark", buckle="steel")
    skirt(col, R, "linen", length=0.24, rx=0.26, ry=0.21, flare=1.15)
    shape(col, "torus", "steel_dark", (0, 0.0, top + 0.02), (0.22, 0.19, 0.2), parent=R["chest"], minor=0.35, seg=14)  # gorget
    arms(col, R, "linen", glove="leather_dark", r=0.09, cuff="leather")
    head(col, R, "skin", "eye", iris="eye_brown", brows="hair_brown")
    hair_cap(col, R, "hair_brown", back=0.03)
    fringe(col, R, "hair_brown", [(-0.22, -16, 0.8), (0.0, 0, 0.9), (0.22, 16, 0.8)], length=0.15, r=0.12, tilt=26)
    kettle_hat(col, R, "hat_steel", brim=0.55, tilt=(-4, 0), dome=(0.42, 0.42, 0.3), z=0.25, rim="steel_dark")
    spear(col, R, shaft="wood", tip="blade", length=1.8)
    thrust_lines(col, R)
    return finish_unit(col, uid, R, "lance")


UNITS = {
    "kael": build_kael,
    "avatar": build_avatar,
    "brenna": build_brenna,
    "tobin": build_tobin,
    "brigand": build_brigand,
    "bandit_archer": build_bandit_archer,
    "grosk": build_grosk,
    "mira": build_mira,
    "hask": build_hask,
    "liora": build_liora,
    "varek": build_varek,
    "morra": build_morra,
    "mercenary": build_mercenary,
    "archer": build_archer,
    "fighter": build_fighter,
    "mage": build_mage,
    "soldier": build_soldier,
}


def build_units(ids=None):
    sc = get_scene()
    setup_render(sc)
    setup_camera(sc)
    normal_material()
    depth_material()
    built = []
    for uid, fn in UNITS.items():
        if ids and uid not in ids:
            continue
        fn(sc)
        built.append(uid)
    return built
