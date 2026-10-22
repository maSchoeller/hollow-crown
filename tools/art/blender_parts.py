"""Hollow Crown – sprite pipeline, part 2: reusable chibi body parts, hair styles and weapons.

Needs the namespace of blender_chibi.py (exec both into the same dict).
All coordinates are world space of the rest pose (figure faces -Y, feet at z = 0).
Head centre: R["top"] + 0.34. Head radius ≈ 0.42.
"""
import math


def head_c(R):
    return R["top"] + 0.39


# ------------------------------------------------------------------------------------------------
# Body
# ------------------------------------------------------------------------------------------------


def legs(col, R, pants, boots, r=0.115, boot_role=None, boot_h=0.2, cuff=None, wide=1.0):
    b = R["body"]
    hip = b["hip"]
    for side, leg in (("L", R["leg_L"]), ("R", R["leg_R"])):
        x = b["leg_x"] * (1 if side == "L" else -1)
        shape(col, "cyl", pants, (x, 0, hip * 0.55 + 0.06), (r * wide, r, hip * 0.45), parent=leg, top=1.1)
        shape(col, "box", boots, (x, -0.035, boot_h * 0.5), (r * 1.05 * wide, r * 1.45, boot_h * 0.5), parent=leg, bevel=0.35)
        if cuff:
            shape(col, "cyl", cuff, (x, 0, boot_h + 0.01), (r * 1.25 * wide, r * 1.25, 0.04), parent=leg)


def torso(col, R, role, rx=0.27, ry=0.21, top=0.92, z0=None, z1=None, flare=1.0):
    """Main torso: tapered cylinder hip→shoulder (wider at the chest)."""
    b = R["body"]
    z0 = b["hip"] - 0.06 if z0 is None else z0
    z1 = R["top"] + 0.02 if z1 is None else z1
    shape(col, "cyl", role, (0, 0, (z0 + z1) / 2), (rx * flare, ry, (z1 - z0) / 2), parent=R["torso"], top=top)
    # rounded shoulders / chest
    shape(col, "sphere", role, (0, 0, z1 - 0.1), (rx * 1.02, ry * 1.0, 0.16), parent=R["chest"])


def belt(col, R, role, z=None, rx=0.285, ry=0.225, h=0.045, buckle=None):
    z = R["body"]["hip"] + 0.02 if z is None else z
    shape(col, "cyl", role, (0, 0, z), (rx, ry, h), parent=R["torso"])
    if buckle:
        shape(col, "box", buckle, (0, -ry - 0.01, z), (0.05, 0.02, 0.04), parent=R["torso"])


def skirt(col, R, role, z_top=None, length=0.3, rx=0.3, ry=0.24, flare=1.25, parent="torso"):
    """Tunic / coat skirt below the belt (cone frustum)."""
    zt = R["body"]["hip"] + 0.04 if z_top is None else z_top
    shape(col, "cyl", role, (0, 0, zt - length / 2), (rx * flare, ry * flare, length / 2), parent=R[parent], top=1 / flare)


def arms(col, R, sleeve, hand="skin", r=0.085, hand_r=0.088, glove=None, bare=None, cuff=None, upper=None):
    b = R["body"]
    top = R["top"] - 0.06
    for side in ("L", "R"):
        s = 1 if side == "L" else -1
        x = s * (b["sh"] + 0.02)
        hz = R["hand_" + side][2]
        mid = (top + hz) / 2
        role = bare if bare else sleeve
        shape(col, "cyl", role, (x, 0, mid + 0.02), (r, r, (top - hz) / 2), parent=R["arm_" + side], top=1.12)
        if upper:  # e.g. bare forearm with sleeve on the upper arm
            shape(col, "cyl", upper, (x, 0, top - 0.08), (r * 1.15, r * 1.15, 0.1), parent=R["arm_" + side])
        if cuff:
            shape(col, "cyl", cuff, (x, 0, hz + 0.1), (r * 1.25, r * 1.25, 0.045), parent=R["arm_" + side])
        shape(col, "sphere", glove or hand, R["hand_" + side], (hand_r, hand_r, hand_r), parent=R["wrist_" + side], seg=12)
        # shoulder cap
        shape(col, "sphere", sleeve if not bare else bare, (x, 0, top), (r * 1.25, r * 1.25, r * 1.2), parent=R["arm_" + side], seg=12)


def head(col, R, skin="skin", eye="eye", ears=True, jaw=None, mouth=None, brows=None, eye_white=None, sx=1.0, iris=None):
    hc = head_c(R)
    H = R["head"]
    shape(col, "sphere", skin, (0, 0, hc), (0.42 * sx, 0.40, 0.40), parent=H, seg=20)
    # cheeks/jaw slightly lower front so the face reads as a face, not a ball
    shape(col, "sphere", jaw or skin, (0, -0.06, hc - 0.12), (0.33 * sx, 0.32, 0.26), parent=H)
    if ears:
        for s in (1, -1):
            shape(col, "sphere", skin, (s * 0.41 * sx, 0.02, hc - 0.03), (0.06, 0.07, 0.09), parent=H, seg=8)
    if eye:
        eyes(col, R, eye, eye_white=eye_white, iris=iris)
    if brows:
        for s in (1, -1):
            shape(col, "box", brows, (s * 0.16, -0.36, hc + 0.1), (0.07, 0.04, 0.022), rot=(0, s * 10, 0), parent=H)
    if mouth:
        shape(col, "box", mouth, (0, -0.375, hc - 0.2), (0.05, 0.03, 0.018), parent=H)
    # neck
    shape(col, "cyl", skin, (0, 0.02, R["top"] + 0.02), (0.11, 0.1, 0.08), parent=R["chest"])


def eyes(col, R, role="eye", y=-0.372, dz=-0.05, dx=0.165, eye_white=None, only=None, h=0.12, w=0.05, iris=None):
    """Eye markers. pixelize.py replaces every connected 'eye*' blob by a hand-made pixel template
    (lash / pupil + highlight / iris), so the role only decides position and iris colour."""
    hc = head_c(R)
    role = iris or role
    for s in (1, -1):
        if only and only != s:
            continue
        shape(col, "box", role, (s * dx, y, hc + dz), (w, 0.05, h * 0.5), parent=R["head"])


# ------------------------------------------------------------------------------------------------
# Hair
# ------------------------------------------------------------------------------------------------


def hair_cap(col, R, role, cover=0.0, sx=1.0, back=0.0, high=0.0):
    """Skull cap: covers top/back of the head, leaves the face free (cover moves it forward)."""
    hc = head_c(R)
    shape(col, "sphere", role, (0, 0.1 - cover * 0.1, hc + 0.1 + high), (0.455 * sx, 0.43, 0.38 + high * 0.5), parent=R["head"], seg=24, lumpy=0.09)
    if back:
        shape(col, "sphere", role, (0, 0.18, hc - 0.12), (0.43 * sx, 0.3, 0.32 + back), parent=R["head"])


def fringe(col, R, role, spikes, z=None, y=-0.33, length=0.22, r=0.11, tilt=20):
    """Spiky bangs: list of (x, angle_z, length_mult) cones hanging over the forehead."""
    hc = head_c(R)
    z = hc + 0.3 if z is None else z
    for x, ang, lm in spikes:
        L = length * lm
        shape(col, "cone", role, (x, y + 0.03, z - L * 0.5), (r, r * 0.8, L * 0.7),
              rot=(180 - tilt, ang, 0), parent=R["head"], seg=8)


def side_locks(col, R, role, length=0.3, r=0.1, y=0.04, x=0.41):
    hc = head_c(R)
    for s in (1, -1):
        shape(col, "cone", role, (s * x, y, hc - length * 0.35), (r, r * 0.9, length * 0.65), rot=(180, -s * 6, 0), parent=R["head"], seg=8)


def ponytail(col, R, role, length=0.28, r=0.11, tie=None, z=0.05):
    hc = head_c(R)
    T = R["tail"]
    if tie:
        shape(col, "sphere", tie, (0, 0.42, hc + z), (0.07, 0.05, 0.07), parent=T, seg=8)
    shape(col, "cone", role, (0, 0.47, hc + z - length * 0.45), (r, r, length * 0.6), rot=(195, 0, 0), parent=T, seg=10)


def braid(col, R, role, n=5, start=None, step=(0, 0.04, -0.13), r=0.1, shrink=0.9, streak=None, tie=None):
    """Chain of slightly overlapping spheres (thick braid)."""
    hc = head_c(R)
    x, y, z = start or (0, 0.42, hc - 0.05)
    rr = r
    for i in range(n):
        role_i = streak if (streak and i % 2 == 1) else role
        shape(col, "sphere", role_i, (x, y, z), (rr, rr * 0.85, rr * 1.1), parent=R["tail"], seg=10)
        x, y, z = x + step[0], y + step[1], z + step[2]
        rr *= shrink
    if tie:
        shape(col, "sphere", tie, (x - step[0] * 0.5, y - step[1] * 0.5, z + 0.03), (rr * 0.9, rr * 0.9, rr * 0.6), parent=R["tail"], seg=8)
        shape(col, "cone", role, (x, y, z - 0.04), (rr * 1.1, rr, 0.08), rot=(180, 0, 0), parent=R["tail"], seg=8)


def beard(col, R, role, size=1.0, z=None, y=-0.3):
    hc = head_c(R)
    z = hc - 0.24 if z is None else z
    shape(col, "sphere", role, (0, y, z), (0.28 * size, 0.16 * size, 0.18 * size), parent=R["head"])


# ------------------------------------------------------------------------------------------------
# Weapons (parented to the right wrist unless noted). Oversized for chibi readability.
# Rest pose: weapon points up (+Z) from the hand, blade facing the side (+/-X plane).
# ------------------------------------------------------------------------------------------------


def sword(col, R, blade="blade", guard="gold", grip="leather", length=0.95, width=0.085, pommel=None, side="R", thin=0.028):
    hx, hy, hz = R["hand_" + side]
    W = R["wrist_" + side]
    y = hy - 0.02
    shape(col, "box", blade, (hx, y, hz + 0.14 + length / 2), (thin, width, length / 2), parent=W)
    shape(col, "cone", blade, (hx, y, hz + 0.14 + length + 0.06), (thin, width, 0.07), rot=(0, 0, 0), parent=W, seg=4)
    shape(col, "box", guard, (hx, y, hz + 0.12), (0.05, 0.2, 0.035), parent=W, bevel=0.2)
    shape(col, "cyl", grip, (hx, y, hz), (0.035, 0.035, 0.1), parent=W, seg=8)
    shape(col, "sphere", pommel or guard, (hx, y, hz - 0.12), (0.05, 0.05, 0.05), parent=W, seg=8)


def axe(col, R, head_role="steel", edge="blade", haft="wood", length=0.9, big=1.0, double=False, wrap=None, side="R"):
    hx, hy, hz = R["hand_" + side]
    W = R["wrist_" + side]
    y = hy - 0.02
    top = hz + length * 0.8
    shape(col, "cyl", haft, (hx, y, hz + length * 0.3), (0.04, 0.04, length * 0.55), parent=W, seg=8)
    if wrap:
        shape(col, "cyl", wrap, (hx, y, hz + 0.02), (0.05, 0.05, 0.08), parent=W, seg=8)
    # axe head: wedge pointing forward (-Y in rest pose → the blade faces the enemy in the swing)
    for s in ((1,) if not double else (1, -1)):
        verts = [(0, 0, -0.16 * big), (0, 0, 0.16 * big), (0, -s * 0.34 * big, 0.26 * big), (0, -s * 0.34 * big, -0.26 * big)]
        poly_mesh(col, head_role, verts, [(0, 1, 2, 3)], loc=(hx, y - s * 0.05, top), parent=W, solidify=0.07)
        verts = [(0, -s * 0.30 * big, 0.25 * big), (0, -s * 0.38 * big, 0.29 * big), (0, -s * 0.38 * big, -0.29 * big), (0, -s * 0.30 * big, -0.25 * big)]
        poly_mesh(col, edge, verts, [(0, 1, 2, 3)], loc=(hx, y - s * 0.05, top), parent=W, solidify=0.075)
    shape(col, "cone", head_role, (hx, y, top + 0.2 * big), (0.045, 0.045, 0.09), parent=W, seg=6)


def spear(col, R, shaft="wood", tip="blade", length=1.6, wrap=None, side="R", tip_len=0.26):
    hx, hy, hz = R["hand_" + side]
    W = R["wrist_" + side]
    y = hy - 0.02
    z0 = hz - 0.35
    shape(col, "cyl", shaft, (hx, y, z0 + length / 2), (0.035, 0.035, length / 2), parent=W, seg=8)
    if wrap:
        for k in range(4):
            shape(col, "cyl", wrap, (hx, y, hz - 0.12 + k * 0.16), (0.048, 0.048, 0.035), parent=W, seg=8)
    shape(col, "cone", tip, (hx, y, z0 + length + tip_len / 2), (0.03, 0.1, tip_len / 2 + 0.02), parent=W, seg=4)
    shape(col, "box", "steel_dark", (hx, y, z0 + length - 0.02), (0.05, 0.05, 0.04), parent=W)


def bow(col, R, wood="wood_light", string="string", length=1.0, side="L", grip=None):
    """Bow held in the left hand, limbs vertical, string towards the body (+Y)."""
    hx, hy, hz = R["hand_" + side]
    W = R["wrist_" + side]
    y = hy - 0.06
    n = 9
    pts = []
    for i in range(n):
        t = i / (n - 1) * 2 - 1
        pts.append((t * length / 2, -0.16 * (1 - t * t) + 0.04 * t * t))
    for i in range(n - 1):
        (z0, y0), (z1, y1) = pts[i], pts[i + 1]
        cz, cy = (z0 + z1) / 2, (y0 + y1) / 2
        L = math.hypot(z1 - z0, y1 - y0) / 2 + 0.01
        ang = math.degrees(math.atan2(y1 - y0, z1 - z0))
        rr = 0.04 if abs(cz) < 0.2 else 0.03
        shape(col, "cyl", wood, (hx, y + cy, hz + cz), (rr, rr, L), rot=(-ang, 0, 0), parent=W, seg=6)
    shape(col, "cyl", string, (hx, y + 0.04, hz), (0.012, 0.012, length / 2), parent=W, seg=4, name=f"{W.name}_string")
    if grip:
        shape(col, "cyl", grip, (hx, y - 0.16, hz), (0.05, 0.05, 0.08), parent=W, seg=6)


def quiver(col, R, role="leather", fletch="fletch", x=0.12, tilt=-25):
    zc = R["top"] - 0.25
    shape(col, "cyl", role, (x, 0.3, zc), (0.1, 0.09, 0.3), rot=(10, tilt, 0), parent=R["chest"], seg=10)
    for k, (dx, dz) in enumerate(((0.0, 0.0), (0.06, -0.03), (-0.05, -0.02))):
        shape(col, "cone", fletch, (x + 0.12 + dx, 0.32, zc + 0.36 + dz), (0.04, 0.03, 0.08), rot=(10, tilt, 0), parent=R["chest"], seg=4)


def tome(col, R, cover="tome", page="page", side="L", glow=None):
    hx, hy, hz = R["hand_" + side]
    W = R["wrist_" + side]
    shape(col, "box", cover, (hx + 0.02, hy - 0.12, hz + 0.08), (0.05, 0.16, 0.19), rot=(0, 0, 20), parent=W, bevel=0.15)
    shape(col, "box", page, (hx + 0.06, hy - 0.12, hz + 0.08), (0.03, 0.14, 0.17), rot=(0, 0, 20), parent=W)


def staff(col, R, shaft="wood_light", head_role="gold", gem=None, length=1.55, side="R", crown=True):
    hx, hy, hz = R["hand_" + side]
    W = R["wrist_" + side]
    y = hy - 0.02
    z0 = hz - 0.4
    shape(col, "cyl", shaft, (hx, y, z0 + length / 2), (0.035, 0.035, length / 2), parent=W, seg=8)
    zt = z0 + length
    if crown:
        # empty crown: ring + spikes, nothing inside (motif "hollow crown")
        shape(col, "torus", head_role, (hx, y, zt + 0.06), (0.16, 0.16, 0.16), rot=(0, 0, 0), parent=W, minor=0.28, seg=14)
        for k in range(5):
            a = 2 * math.pi * k / 5
            shape(col, "cone", head_role, (hx + 0.16 * math.cos(a), y + 0.16 * math.sin(a), zt + 0.16), (0.045, 0.045, 0.1), parent=W, seg=6)
    if gem:
        shape(col, "sphere", gem, (hx, y, zt - 0.06), (0.06, 0.06, 0.06), parent=W, seg=8)


def shield(col, R, face="wood", rim="steel", boss="steel", side="L", r=0.3, team_band=None):
    hx, hy, hz = R["hand_" + side]
    W = R["wrist_" + side]
    x = hx + 0.1
    shape(col, "cyl", face, (x, hy, hz + 0.05), (r, r, 0.04), rot=(0, 90, 0), parent=W, seg=16)
    shape(col, "torus", rim, (x + 0.01, hy, hz + 0.05), (r, r, r), rot=(0, 90, 0), parent=W, minor=0.12, seg=16)
    shape(col, "sphere", boss, (x + 0.05, hy, hz + 0.05), (0.06, 0.08, 0.08), parent=W, seg=8)
    if team_band:
        shape(col, "box", team_band, (x + 0.03, hy, hz + 0.05), (0.02, r * 0.95, 0.06), parent=W)


def torch(col, R, side="L", wood="wood", flame="fire"):
    hx, hy, hz = R["hand_" + side]
    W = R["wrist_" + side]
    shape(col, "cyl", wood, (hx, hy - 0.02, hz + 0.15), (0.04, 0.04, 0.28), parent=W, seg=8, top=1.3)
    shape(col, "cyl", "rag", (hx, hy - 0.02, hz + 0.42), (0.065, 0.065, 0.06), parent=W, seg=8)
    f = shape(col, "cone", flame, (hx, hy - 0.02, hz + 0.6), (0.12, 0.12, 0.18), parent=W, seg=10, name=f"{W.name}_flame")
    shape(col, "sphere", "fire_core", (hx, hy - 0.05, hz + 0.52), (0.07, 0.07, 0.08), parent=W, seg=8, name=f"{W.name}_flamecore")
    return f


def crown_spikes(col, R, role, spikes, r=0.11):
    """Messy hair silhouette on the top/back of the head: (x, y, angle_x, angle_y, length)."""
    hc = head_c(R)
    for x, y, ax, ay, L in spikes:
        shape(col, "cone", role, (x, y, hc + 0.3), (r, r, L), rot=(ax, ay, 0), parent=R["head"], seg=8)


# ------------------------------------------------------------------------------------------------
# Headgear & extra hair shapes
# ------------------------------------------------------------------------------------------------


def kettle_hat(col, R, role="steel", brim=0.62, tilt=(0, 14), dome=(0.42, 0.42, 0.34), z=0.2, rim=None):
    """Wide-brimmed kettle hat (tilt = (x°, y°) – Tobin's sits crooked)."""
    hc = head_c(R)
    H = R["head"]
    shape(col, "cyl", role, (0, 0.0, hc + z), (brim, brim * 0.95, 0.035), rot=(tilt[0], tilt[1], 0), parent=H, seg=20)
    shape(col, "hemi", role, (0, 0.0, hc + z + 0.02), dome, rot=(tilt[0], tilt[1], 0), parent=H, seg=18)
    if rim:
        shape(col, "torus", rim, (0, 0.0, hc + z), (brim, brim * 0.95, brim), rot=(tilt[0], tilt[1], 0), parent=H, minor=0.04, seg=20)
    shape(col, "sphere", role, (0, 0.0, hc + z + dome[2] + 0.02), (0.05, 0.05, 0.04), rot=(tilt[0], tilt[1], 0), parent=H, seg=8)


def hood_up(col, R, role, tip=True, back=0.12, size=1.0, rim=None):
    """Raised hood: big shell around the head, face left open in front."""
    hc = head_c(R)
    H = R["head"]
    shape(col, "sphere", role, (0, back, hc + 0.05), (0.49 * size, 0.47 * size, 0.47 * size), parent=H, seg=20)
    if rim:
        shape(col, "torus", rim, (0, -0.28, hc + 0.0), (0.38, 0.38, 0.4), rot=(80, 0, 0), parent=H, minor=0.16, seg=16)
    if tip:
        shape(col, "cone", role, (0, back + 0.42, hc + 0.12), (0.16, 0.16, 0.22), rot=(-115, 0, 0), parent=H, seg=10)
    # shoulder cape of the hood
    shape(col, "cyl", role, (0, 0.03, R["top"] - 0.02), (0.36, 0.3, 0.1), parent=R["chest"], top=0.7)


def hood_down(col, R, role):
    """Hood thrown back: a bunched roll behind the neck."""
    shape(col, "torus", role, (0, 0.18, R["top"] + 0.04), (0.26, 0.22, 0.2), rot=(-20, 0, 0), parent=R["chest"], minor=0.45, seg=14)
    shape(col, "sphere", role, (0, 0.34, R["top"] - 0.05), (0.24, 0.12, 0.2), parent=R["chest"])


def pointed_hat(col, R, role="violet", band=None, brim=0.6, height=0.75, bend=-25):
    hc = head_c(R)
    H = R["head"]
    shape(col, "cyl", role, (0, 0.02, hc + 0.22), (brim, brim * 0.92, 0.03), rot=(-6, 0, 0), parent=H, seg=20)
    shape(col, "cone", role, (0, 0.06, hc + 0.22 + height * 0.42), (0.36, 0.34, height * 0.45), rot=(-6, 0, 0), parent=H, seg=14)
    shape(col, "cone", role, (0, 0.2, hc + 0.22 + height * 0.86), (0.15, 0.15, height * 0.2), rot=(bend, 0, 0), parent=H, seg=10)
    if band:
        shape(col, "cyl", band, (0, 0.03, hc + 0.29), (0.37, 0.35, 0.05), rot=(-6, 0, 0), parent=H, seg=14)


def long_hair(col, R, role, length=0.75, width=0.38, streak=None):
    """Curtain of hair down the back (parented to the tail pivot so it sways)."""
    hc = head_c(R)
    T = R["tail"]
    shape(col, "sphere", role, (0, 0.24, hc - length * 0.45), (width, 0.17, length * 0.62), parent=T, seg=16)
    shape(col, "cone", role, (0, 0.28, hc - length * 0.98), (width * 0.9, 0.14, 0.16), rot=(180, 0, 0), parent=T, seg=12)
    if streak:
        shape(col, "sphere", streak, (0.12, 0.3, hc - length * 0.4), (0.07, 0.13, length * 0.55), parent=T, seg=8)


def bob(col, R, role, long_side=1, streak=None):
    """Asymmetric bob: one side to the chin, the other longer and swept over the eye."""
    hc = head_c(R)
    H = R["head"]
    for s in (1, -1):
        L = 0.42 if s == long_side else 0.28
        shape(col, "sphere", role, (s * 0.33, 0.04, hc - 0.03 - (L - 0.28) * 0.5), (0.17, 0.33, L), parent=H, seg=12)
    shape(col, "sphere", role, (0, 0.2, hc - 0.05), (0.42, 0.26, 0.34), parent=H, seg=14)
    # swept fringe toward the long side
    shape(col, "sphere", role, (long_side * 0.12, -0.28, hc + 0.2), (0.3, 0.14, 0.14), rot=(0, long_side * 20, 0), parent=H, seg=12)
    if streak:
        shape(col, "sphere", streak, (long_side * 0.3, -0.18, hc + 0.12), (0.08, 0.14, 0.22), rot=(0, 0, 0), parent=H, seg=8)


def arrow(col, R, tagname, parent, loc, length=0.75, shaft="wood_light", tip="steel", fletch="fletch"):
    """Arrow pointing forward (-Y) from loc."""
    x, y, z = loc
    a = shape(col, "cyl", shaft, (x, y - length / 2, z), (0.02, 0.02, length / 2), rot=(90, 0, 0), parent=parent, seg=6)
    b = shape(col, "cone", tip, (x, y - length - 0.05, z), (0.05, 0.05, 0.07), rot=(90, 0, 0), parent=parent, seg=4)
    c = shape(col, "box", fletch, (x, y - 0.06, z), (0.05, 0.08, 0.012), parent=parent)
    for ob in (a, b, c):
        tag(ob, tagname)


def bow_fx(col, R):
    hx, hy, hz = R["hand_L"]
    arrow(col, R, "arrow", R["wrist_L"], (hx, hy + 0.38, hz), length=0.62)
    # loosed arrow in flight + speed lines
    arrow(col, R, "arrowfly", R["root"], (-0.0, -0.9, R["top"] - 0.15), length=0.6)
    for dz, L in ((0.06, 0.45), (-0.06, 0.32)):
        tag(shape(col, "box", "smear", (0.0, -0.55, R["top"] - 0.15 + dz), (0.015, L / 2, 0.015), parent=R["root"]), "arrowfly")


def staff_glow(col, R, length=1.55, side="R", role="glow"):
    hx, hy, hz = R["hand_" + side]
    zt = hz - 0.4 + length
    g = shape(col, "sphere", role, (hx, hy - 0.02, zt + 0.1), (0.2, 0.2, 0.2), parent=R["wrist_" + side], seg=12)
    return tag(g, "glow_staff")
