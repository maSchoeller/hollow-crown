"""Hollow Crown – finger poses per grip kind (story 16.9, concept/23-art-direction §4.5 "Haltung je Waffenart").

Pure data, no Blender: tools/art/prepare_tripo_unit.py bakes each kind into a single-frame clip `grip_<kind>` (grip_clips()),
tools/art/bake_vat.py writes it into the figure's .vat, and the weapon library names the kind in content/core/render.yaml.

Angles are in degrees and describe a rotation in the hand's own frame, so one table fits every figure whatever its bones' roll:
  curl   about the axis that closes the four fingers towards the palm (positive = closing); all joints of a finger share it
  swing  the thumb's first joint about the palm normal, towards the fingers (positive = across the palm)
Joint 1 is the finger's root, 3 its last joint before the tip (the `4` tips are folded away in the rig).

  fist   fist round a shaft or hilt (sword, dagger, axe, lance, staff, shield grip)
  flat   flat open hand under the open book / the focus: fingers together, a little relaxed
  bow    grip centre of the bow: fist, the index finger a little open along the riser
  lute   the neck of the lute: half fist
  none   relaxed rest pose of the rig (no clip is baked)
"""

FINGERS = ("Index", "Middle", "Ring", "Pinky")

# kind -> finger -> (joint 1, joint 2, joint 3) curl
CURL = {
    "fist": {"Index": (62, 78, 44), "Middle": (66, 82, 46), "Ring": (70, 84, 48), "Pinky": (74, 86, 50), "Thumb": (14, 26, 18)},
    "flat": {"Index": (6, 4, 2), "Middle": (8, 5, 3), "Ring": (10, 6, 3), "Pinky": (12, 8, 4), "Thumb": (0, 0, 0)},
    "bow": {"Index": (30, 22, 12), "Middle": (62, 78, 44), "Ring": (66, 82, 46), "Pinky": (70, 84, 48), "Thumb": (12, 22, 14)},
    "lute": {"Index": (38, 46, 26), "Middle": (40, 48, 28), "Ring": (42, 50, 30), "Pinky": (44, 52, 32), "Thumb": (8, 14, 10)},
}
# thumb root joint about the palm normal, towards the fingers (the thumb lies along the handle, the swing closes it over)
SWING = {"fist": 28, "flat": 0, "bow": 24, "lute": 14}

KINDS = tuple(CURL)  # kinds that get a `grip_<kind>` clip


def finger_pose(kind):
    """-> {(finger, joint 1..3): (curl degrees, swing degrees)} of one kind; empty for `none` and unknown kinds."""
    if kind not in CURL:
        return {}
    out = {}
    for finger, angles in CURL[kind].items():
        for i, a in enumerate(angles):
            out[(finger, i + 1)] = (a, SWING[kind] if (finger == "Thumb" and i == 0) else 0)
    return out
