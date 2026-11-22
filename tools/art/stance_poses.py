"""Hollow Crown – stances of the board figures: rest, gestures, ready (story 16.10, concept/23-art-direction §4.5 "Ruhe, Haltung und Kampfhaltung").

Pure data, no Blender: tools/art/prepare_tripo_unit.py solves the arms (and the legs) of every figure onto these targets per frame (two-bone IK in
the body's own measures, so one table fits every figure), bakes the result as FK keys and writes the clips below; tools/art/bake_vat.py gives the
slow ones a lower rate; tools/art/tripo_units.py picks the stances of a figure from content/ (classes -> weapon groups -> `stance` of
content/core/render.yaml gear).

Clips per stance <s> (stance key = weapon art, optionally `_shield`; `none` = no weapon, every figure has it):
  rest_<s>        loop of one breath (BREATH_S), the weapon stays where it is
  gesture_<s>_<g> look | shift | regrip: start and end on the first row of rest_<s> (the player starts them at a loop boundary)
  ready_<s>       loop in the fighting stance, quicker breath (READY_S)
  ready_in_<s>    SWITCH_S from the first row of rest_<s> to the first row of ready_<s> (the runtime plays it backwards for the way back)
`idle` = rest_none (calm breathing, no sway). rest, gesture and ready clips are baked at SLOW_FPS rows a second (.vat version 2), ready_in and the
board's action clips (walk, attack*, hit, ...) at 60.

Body measures (taken from the rig in its rest pose, so they follow every figure's build; the board figures are chibi, an arm reaches only about 0.15):
  side   in half shoulder widths from the body's centre line, 1.0 = straight below the shoulder, positive = outwards on the hand's own side
  fwd    in arm lengths (upper arm + forearm) forwards of the shoulder
  up     in arm lengths above the shoulder (negative: below it); a hand within about 0.9 of the shoulder is reachable
Directions are (side, fwd, up) triples in the same axes (outwards on the hand's own side, so the left hand's table is the mirror image of the right
hand's). Per hand: `at` = where the palm socket (`grip_r` / `grip_l`) lies; `w` = two features of what the hand holds, as unit vectors in the grip frame
of the weapon models (x palm normal, y across the fist from little finger to thumb, z along the hand; the models carry their `grip` node in that
frame, tools/art/weapon_grip_nodes.py): the weapon's own axis (a shaft's tip, a book's spine) and a second one across it; `d1`, `d2` = the world
directions those two features point along (`d2` is made perpendicular to `d1`). The hand is turned so the features meet them. A lance lies diagonally
across the palm (its model axis is (0, 0.57, 0.82)), so the grip axis y is not the weapon's.

Fingers per hand follow the grip kinds of tools/art/grip_poses.py (GRIP below); they are baked into every clip of the figure.
"""

BREATH_S = 4.0  # one breath of the rest clips (chest and shoulders rise and fall once)
READY_S = 2.0  # one breath in the fighting stance (quicker, shallower)
SLOW_FPS = 30  # rows a second of rest_*, gesture_*, ready_* (the .vat's other clips: 60)
SWITCH_S = 0.25  # rest -> ready (content/core/render.yaml board.stance.switchS holds the same value for the runtime)
GESTURE_S = {"look": 2.0, "shift": 1.8, "regrip": 1.5}  # whole numbers of rows at SLOW_FPS

BREATH_SPINE_DEG = 1.4  # spine rocks forward / back by this much at the deepest breath
BREATH_SHRUG_DEG = 1.8  # shoulders rise by this much
BREATH_RISE = 0.0035  # hips and everything above rise by this share of the figure height

# stance -> (right hand grip kind, left hand grip kind); `none` = the rig's relaxed hand (nothing baked)
GRIP = {
    "lance": ("fist", "none"),
    "staff": ("fist", "none"),
    "blade": ("fist", "none"),
    "axe": ("fist", "none"),
    "bow": ("none", "bow"),
    "book": ("flat", "flat"),
    "lute": ("flat", "lute"),
    "none": ("none", "none"),
}
# with a shield on the left forearm (strap): the left hand makes a fist, `_shield` keys are built from the base stances below
GRIP_SHIELD = ("fist", "fist")
SHIELD_BASES = ("lance", "staff", "blade", "axe")  # [ASSUMPTION A1] a shield only comes with these

# features of the held models in their grip frame (measured on art/models/weapons-v2/*.glb): (axis, across)
W_FREE = ((0.0, 1.0, 0.0), (0.0, 0.0, 1.0))  # an empty hand: the thumb side, the fingers
W_BLADE = ((0.0, 1.0, 0.0), (0.0, 0.0, 1.0))  # sword, dagger: tip, flat side
W_AXE = ((0.0, 1.0, 0.0), (0.0, 0.0, 1.0))  # head end, edge
W_LANCE = ((0.0, 0.57, 0.82), (1.0, 0.0, 0.0))  # tip (diagonally across the palm), palm side
W_STAFF = ((0.0, 0.5, -0.87), (1.0, 0.0, 0.0))  # head (rune end), palm side
W_BOW = ((0.0, 0.67, -0.74), (0.0, 0.74, 0.67))  # a limb, towards the string side
W_BOOK = ((0.0, 1.0, 0.0), (1.0, 0.0, 0.0))  # closed: spine up, cover normal
W_BOOK_OPEN = ((0.0, 0.0, 1.0), (0.0, 1.0, 0.0))  # open: the page normal (reading side), the book's up
W_LUTE = ((0.0, 1.0, 0.0), (1.0, 0.0, 0.0))  # neck towards the head stock, face normal
W_SHIELD = ((0.0, 1.0, 0.0), (1.0, 0.0, 0.0))  # up, face normal
W_PALM = ((1.0, 0.0, 0.0), (0.0, 0.0, 1.0))  # an open hand: the palm normal, the fingers


def hand(at, d1, d2, w=W_FREE):
    return {"at": at, "d1": d1, "d2": d2, "w": w}


# the arm hangs, thumb forward, palm to the thigh
HANG = hand((1.30, 0.0, -0.88), (0.0, 1.0, 0.0), (0.0, 0.0, -1.0))

# body of a stance: lean (forward, degrees, spine), lower (hips down, figure heights), turn (hips yaw towards the weapon side, degrees)
BODY_REST = {"lean": 0.0, "lower": 0.006, "turn": 0.0}
BODY_READY = {"lean": 7.0, "lower": 0.032, "turn": 10.0}

# stances that stand differently in the fighting stance: the lute player and the unarmed stay as they are, the caster and the archer lean less
BODY_READY_OF = {
    "lute": BODY_REST,
    "none": BODY_REST,
    "book": {"lean": 3.0, "lower": 0.014, "turn": 0.0},
    "bow": {"lean": 4.0, "lower": 0.022, "turn": 10.0},
}
# the hips turn the right side to the front; an archer stands with the left side forward (the bow hand), the caster faces the front
TURN_SIGN = {"bow": -1.0}

# stance -> {"rest": {"r": hand, "l": hand}, "ready": {...}}; a missing hand = HANG; the ready table may leave a hand out to keep it as in rest.
# A planted lance or staff cannot touch the floor: the figure's arm (0.15) reaches down to 0.32 above it, the shaft ends 0.18 / 0.16 below its grip node
# (art/models/weapons-v2/lance.glb, staff.glb); the hand hangs as low as the arm allows.
POSE = {
    "lance": {
        "rest": {"r": hand((1.60, 0.0, -0.84), (0.0, 0.0, 1.0), (-1.0, 0.0, 0.0), W_LANCE)},
        "ready": {"r": hand((0.85, 0.46, -0.68), (0.0, 1.0, 0.05), (-1.0, 0.0, 0.0), W_LANCE)},
    },
    "staff": {
        "rest": {"r": hand((1.60, 0.0, -0.84), (0.0, 0.0, 1.0), (-1.0, 0.0, 0.0), W_STAFF)},
        "ready": {"r": hand((0.85, 0.40, -0.62), (0.0, 0.65, 0.76), (-1.0, 0.0, 0.0), W_STAFF)},
    },
    "blade": {
        "rest": {"r": hand((1.05, 0.40, -0.74), (-0.05, 0.1, 1.0), (1.0, 0.0, 0.0), W_BLADE)},
        "ready": {"r": hand((0.78, 0.58, -0.52), (-0.2, 0.75, 0.65), (1.0, 0.0, 0.2), W_BLADE)},
    },
    "axe": {
        "rest": {"r": hand((0.85, 0.48, -0.36), (0.35, -0.8, 0.5), (0.0, 0.0, -1.0), W_AXE)},
        "ready": {"r": hand((0.80, 0.58, -0.16), (0.1, 0.35, 1.0), (0.0, 1.0, 0.0), W_AXE)},
    },
    "bow": {
        "rest": {"l": hand((1.25, 0.06, -0.84), (0.0, 0.0, 1.0), (0.0, 1.0, 0.0), W_BOW)},
        "ready": {"l": hand((0.72, 0.84, -0.18), (0.0, 0.0, 1.0), (0.0, 1.0, 0.0), W_BOW)},
    },
    "book": {
        # closed at the hip, spine up, the cover to the body; open on the flat hand in front, the pages to the figure, the right hand casts
        "rest": {"l": hand((0.98, 0.38, -0.74), (0.0, 0.0, 1.0), (-1.0, 0.0, 0.0), W_BOOK)},
        "ready": {"l": hand((0.58, 0.50, -0.50), (0.0, -0.5, 0.85), (0.0, 0.85, 0.5), W_BOOK_OPEN),
                  "r": hand((0.82, 0.60, -0.30), (0.0, 1.0, 0.2), (0.0, 0.2, 1.0), W_PALM)},
    },
    "lute": {
        # the left hand at the neck, the right at the body of the lute, in front of the belly (the same in ready)
        "rest": {"l": hand((0.60, 0.56, -0.40), (-0.55, 0.2, 0.8), (0.2, 1.0, 0.0), W_LUTE),
                 "r": hand((0.40, 0.50, -0.62), (0.0, -0.5, -0.85), (-1.0, 0.0, 0.2), W_PALM)},
        "ready": {},
    },
    "none": {"rest": {}, "ready": {}},
}
# the shield arm: the forearm across the outer side, the strap hand a little in front of the body (rest), further forward (ready)
SHIELD_HAND = {
    "rest": hand((1.05, 0.30, -0.62), (0.0, 0.0, 1.0), (1.0, 0.0, 0.0), W_SHIELD),
    "ready": hand((0.78, 0.50, -0.42), (0.0, 0.1, 1.0), (0.3, 1.0, 0.0), W_SHIELD),
}

# gestures: peak values (degrees, figure heights); the envelope is a smooth bump over the clip's length
LOOK_YAW_DEG = 26.0
LOOK_PITCH_DEG = 3.0
SHIFT_SIDE = 0.012  # hips slide sideways
SHIFT_ROLL_DEG = 2.5
REGRIP_OPEN = 0.55  # share of the finger curl that opens at the peak of the regrip
REGRIP_SHRUG_DEG = 2.0


def stance_hands(stance, phase):
    """-> {"r": hand, "l": hand} of a stance key (`blade_shield` ...) in `rest` or `ready`; missing hands hang; `ready` keeps the rest hand it does not name."""
    base, shield = (stance[: -len("_shield")], True) if stance.endswith("_shield") else (stance, False)
    table = POSE[base]
    out = {"r": HANG, "l": HANG}
    out.update(table["rest"])
    if phase == "ready":
        out.update(table["ready"])
    if shield:
        out["l"] = SHIELD_HAND[phase]
    return out


def stance_body(stance, phase):
    """-> {"lean", "lower", "turn"} of a base stance (without `_shield`) in `rest` or `ready`."""
    if phase == "ready":
        return BODY_READY_OF.get(stance, BODY_READY)
    return BODY_REST


def grip_kinds(stance):
    """-> (right, left) grip kind of a stance key."""
    if stance.endswith("_shield"):
        return (GRIP[stance[: -len("_shield")]][0], GRIP_SHIELD[1])
    return GRIP[stance]


def clip_fps(name):
    """Rows a second of a clip in the .vat (version 2): the slow ones at SLOW_FPS."""
    if name.startswith(("rest_", "gesture_")) or (name.startswith("ready_") and not name.startswith("ready_in_")):
        return SLOW_FPS
    return 60


def is_loop(name):
    return name in ("idle", "walk") or name.startswith("rest_") or (name.startswith("ready_") and not name.startswith("ready_in_"))


def is_stance_clip(name):
    return name.startswith(("rest_", "gesture_", "ready_"))
