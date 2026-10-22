"""Hollow Crown – role → Hollow-64 ramp table (used by pixelize.py).

Each role: ramp = [outline, shadow, mid, light(, highlight)] as palette indices (0..51) or "K0".."K3"
for the team key colours (#400040 #800080 #C000C0 #FF00FF). Ramps are hue-shifted on purpose:
shadows lean cool/violet, lights lean warm. Outlines are the darkest *coloured* step, never black.

kind:  cloth (default) | skin | hair | metal | flat | glow
prio:  weight in the 4×4 majority vote (small details like eyes win their block)
outline: False → no exterior outline (smears, glows)

Palette index cheat sheet (art/palette/hollow-64.hex):
  0 1a1625  1 2e2a3b  2 4a4656  3 6e6a78  4 a39fa6  5 e8e2d6        neutral violet-grey → warm white
  6 5c3a33  7 a0644e  8 d89a74  9 f3cba6                            skin
 10 2d1e1a 11 4f3426 12 7a5236                                      dark brown
 13 5a1f1c 14 9a3a24 15 d0662f 16 f0a05a                            red-brown / copper
 17 8a6a2e 18 d1aa4f 19 f5e08f                                      ochre / straw
 20 3b2420 21 6a4130 22 9a6a45 23 c79a68                            leather
 24 2b3242 25 4f5b70 26 8995a8 27 d3dae4                            steel
 28 1f3a2c 29 2f5e33 30 4f8a3a 31 8bbb4a 32 c9e07a                  green
 33 1d2a5a 34 2f5f9e 35 4aa8e8 36 a8e4f5                            blue
 37 6b1d1d 38 c2451e 39 e8743b 40 ffc06b                            ember
 41 7a5a1a 42 c9a24a 43 f2d98c                                      gold
 44 4a1028 45 a3172e 46 e0455a                                      crimson
 47 2b1a4a 48 5a3a8e 49 8e5bd9                                      purple
 50 6b5a44 51 a8916a                                                khaki
"""

K = ["K0", "K1", "K2", "K3"]

ROLES = {
    # --- skin & faces -------------------------------------------------------------------------
    "skin": {"ramp": [6, 7, 8, 9], "kind": "skin"},
    "skin_tan": {"ramp": [20, 6, 7, 8], "kind": "skin"},
    "skin_pale": {"ramp": [6, 8, 9, 5], "kind": "skin"},
    "skin_grey": {"ramp": [6, 7, 8, 8], "kind": "skin"},
    "stubble": {"ramp": [6, 7, 8, 8], "kind": "skin"},
    "scar": {"ramp": [13, 7, 7, 7], "kind": "flat", "prio": 3},
    "eye": {"ramp": [10, 10, 12, 5], "kind": "eye", "prio": 8},
    # eye markers: ramp = [lash, pupil, iris, highlight]; pixelize stamps a template per eye blob
    "eye_amber": {"ramp": [10, 10, 17, 5], "kind": "eye", "prio": 8},
    "eye_brown": {"ramp": [10, 10, 12, 5], "kind": "eye", "prio": 8},
    "eye_green": {"ramp": [10, 28, 30, 5], "kind": "eye", "prio": 8},
    "eye_blue": {"ramp": [10, 33, 34, 5], "kind": "eye", "prio": 8},
    "eye_violet": {"ramp": [0, 47, 48, 5], "kind": "eye", "prio": 8},
    "eye_gold": {"ramp": [10, 41, 42, 5], "kind": "eye", "prio": 8},
    "eye_grey": {"ramp": [0, 24, 26, 5], "kind": "eye", "prio": 8},
    "eye_dark": {"ramp": [10, 10, 11, 5], "kind": "eye", "prio": 8},
    "eye_red": {"ramp": [10, 37, 38, 40], "kind": "eye", "prio": 8},
    "tattoo": {"ramp": [13, 14, 14, 14], "kind": "flat", "prio": 3},
    "freckle": {"ramp": [7, 7, 7, 7], "kind": "flat", "prio": 1},
    "eye_milky": {"ramp": [10, 3, 27, 5], "kind": "eye", "prio": 8},
    "eye_white": {"ramp": [4, 5, 5, 5], "kind": "flat", "prio": 4},
    "mouth": {"ramp": [6, 6, 6, 6], "kind": "flat", "prio": 5},
    "blush": {"ramp": [7, 7, 7, 7], "kind": "flat", "prio": 3},
    # --- hair ---------------------------------------------------------------------------------
    "hair_brown": {"ramp": [0, 10, 11, 21, 22], "kind": "hair"},
    "hair_black": {"ramp": [0, 0, 1, 2, 3], "kind": "hair"},
    "hair_black_violet": {"ramp": [0, 0, 47, 48, 3], "kind": "hair"},
    "hair_red": {"ramp": [13, 37, 14, 15, 16], "kind": "hair"},
    "hair_grey": {"ramp": [1, 3, 4, 27, 5], "kind": "hair"},
    "hair_straw": {"ramp": [41, 17, 18, 19, 5], "kind": "hair"},
    "hair_silver": {"ramp": [3, 26, 27, 5, 5], "kind": "hair"},
    "hair_green": {"ramp": [28, 29, 30, 31], "kind": "hair", "prio": 2},
    "hair_auburn": {"ramp": [10, 13, 14, 15], "kind": "hair"},
    "hair_ginger": {"ramp": [13, 14, 15, 16], "kind": "hair"},
    # --- cloth --------------------------------------------------------------------------------
    "cloth_dark": {"ramp": [0, 1, 2, 3]},
    "cloth_brown": {"ramp": [10, 11, 21, 22]},
    "ash": {"ramp": [1, 2, 3, 4]},
    "linen": {"ramp": [50, 51, 23, 5]},
    "cream": {"ramp": [50, 4, 5, 5]},
    "white": {"ramp": [3, 4, 27, 5]},
    "olive": {"ramp": [28, 50, 17, 51]},
    "green_cloth": {"ramp": [28, 29, 30, 31]},
    "leafy": {"ramp": [28, 29, 30, 31], "prio": 2},
    "leaf_hi": {"ramp": [29, 30, 31, 32], "prio": 2},
    "night": {"ramp": [0, 1, 33, 34]},
    "night_lining": {"ramp": [0, 33, 34, 34]},
    "plum": {"ramp": [47, 44, 48, 49]},
    "plum_dark": {"ramp": [0, 47, 44, 48]},
    "crimson": {"ramp": [44, 44, 45, 46]},
    "violet": {"ramp": [47, 47, 48, 49]},
    "rags_brown": {"ramp": [20, 21, 50, 22]},
    "rags_olive": {"ramp": [28, 50, 17, 51]},
    "rust": {"ramp": [13, 37, 14, 15]},
    "fur": {"ramp": [50, 51, 23, 5], "kind": "hair"},
    "fur_dark": {"ramp": [10, 20, 21, 22], "kind": "hair"},
    "fur_grey": {"ramp": [1, 2, 3, 4], "kind": "hair"},
    "rag": {"ramp": [20, 50, 51, 51]},
    "parchment": {"ramp": [50, 51, 43, 5]},
    "page": {"ramp": [50, 51, 5, 5]},
    "tome": {"ramp": [44, 44, 45, 46]},
    "tome_blue": {"ramp": [33, 33, 34, 35]},
    # --- leather & wood -----------------------------------------------------------------------
    "leather": {"ramp": [10, 21, 22, 23]},
    "leather_light": {"ramp": [10, 22, 23, 23]},
    "leather_dark": {"ramp": [10, 11, 21, 22]},
    "leather_black": {"ramp": [0, 0, 1, 2]},
    "wood": {"ramp": [10, 20, 21, 22]},
    "wood_light": {"ramp": [20, 21, 22, 23]},
    "string": {"ramp": [50, 5, 5, 5], "kind": "flat", "prio": 3},
    "fletch": {"ramp": [13, 5, 5, 5], "kind": "flat", "prio": 2},
    "wrap": {"ramp": [50, 51, 23, 5], "prio": 2},
    # --- metal --------------------------------------------------------------------------------
    "steel": {"ramp": [24, 25, 26, 27, 5], "kind": "metal"},
    "hat_steel": {"ramp": [24, 25, 26, 26, 27], "kind": "metal"},
    "steel_dark": {"ramp": [0, 24, 25, 26, 27], "kind": "metal"},
    "iron": {"ramp": [0, 1, 2, 3, 4], "kind": "metal"},
    "blade": {"ramp": [24, 26, 27, 5, 5], "kind": "metal", "prio": 2},
    "scratch": {"ramp": [24, 5, 5, 5], "kind": "flat", "prio": 4},
    "gold": {"ramp": [10, 17, 42, 43, 43], "kind": "metal", "prio": 2},
    "silver": {"ramp": [25, 26, 27, 5, 5], "kind": "metal", "prio": 2},
    "button": {"ramp": [41, 42, 43, 43], "kind": "flat", "prio": 5},
    # --- effects ------------------------------------------------------------------------------
    "smear": {"ramp": [27, 5, 5, 5], "kind": "flat", "outline": False},
    "glow": {"ramp": [42, 43, 19, 5], "kind": "glow", "outline": False},
    "glow_core": {"ramp": [5, 5, 5, 5], "kind": "flat", "outline": False, "prio": 2},
    "glow_green": {"ramp": [30, 31, 32, 5], "kind": "glow", "outline": False},
    "fire": {"ramp": [38, 39, 40, 19], "kind": "glow", "outline": True},
    "fire_core": {"ramp": [40, 19, 19, 5], "kind": "flat", "prio": 2},
    # --- team key ------------------------------------------------------------------------------
    "team": {"ramp": [K[0], K[1], K[2], K[2], K[3]], "kind": "cloth"},
    "team_flat": {"ramp": [K[0], K[2], K[2], K[2]], "kind": "flat"},
    # --- props ----------------------------------------------------------------------------------
    "bark": {"ramp": [10, 20, 21, 22]},
    "birch": {"ramp": [3, 4, 27, 5]},
    "leaf": {"ramp": [28, 29, 30, 31, 32], "kind": "hair"},
    "leaf_dark": {"ramp": [28, 28, 29, 30], "kind": "hair"},
    "pine": {"ramp": [28, 28, 29, 30, 31], "kind": "hair"},
    "roof": {"ramp": [13, 37, 14, 15]},
    "roof_burnt": {"ramp": [0, 1, 2, 13]},
    "thatch": {"ramp": [41, 17, 18, 19]},
    "plaster": {"ramp": [50, 51, 23, 5]},
    "plaster_white": {"ramp": [3, 4, 27, 5]},
    "timber": {"ramp": [10, 20, 21, 22]},
    "stone": {"ramp": [1, 2, 3, 4, 5]},
    "stone_warm": {"ramp": [6, 50, 51, 23]},
    "stone_white": {"ramp": [3, 4, 27, 5, 5]},
    "moss": {"ramp": [28, 29, 30, 31], "prio": 2},
    "rock": {"ramp": [1, 2, 3, 4, 5]},
    "rock_dark": {"ramp": [0, 1, 2, 3]},
    "grass_tuft": {"ramp": [28, 29, 30, 31]},
    "canvas": {"ramp": [50, 51, 23, 5]},
    "soot": {"ramp": [0, 0, 1, 2]},
    "ember_glow": {"ramp": [37, 38, 39, 40], "kind": "flat", "prio": 3},
    "dark": {"ramp": [0, 0, 0, 0], "kind": "flat"},
    "window": {"ramp": [0, 33, 33, 34], "kind": "flat", "prio": 2},
    "silver_blue": {"ramp": [33, 34, 35, 36, 5], "kind": "metal", "prio": 2},
    "flag": {"ramp": [K[0], K[1], K[2], K[2], K[3]]},
    "chest_wood": {"ramp": [20, 21, 22, 23]},
    "gold_coins": {"ramp": [41, 42, 43, 19], "kind": "metal", "prio": 2},
}

# light direction (camera space: x right, y up, z towards the viewer) – from the top left, a bit in front
LIGHT = (-0.55, 0.62, 0.56)

# shading thresholds on n·L per kind: (shadow < t1 <= mid < t2 <= light), highlight above t3
KIND = {
    "cloth": {"t1": 0.12, "t2": 0.62, "t3": 0.95},
    "skin": {"t1": 0.0, "t2": 0.6, "t3": 2.0},
    "hair": {"t1": 0.14, "t2": 0.62, "t3": 0.9},
    "metal": {"t1": 0.18, "t2": 0.55, "t3": 0.86},
    "glow": {"t1": -2.0, "t2": 0.45, "t3": 0.85},
    "flat": None,
    "eye": None,
}

# Eye templates (rows top → bottom): L lash, P pupil, I iris, H highlight, S skin (keep), . = keep
EYE_FRONT = ["LL", "PH", "II"]
EYE_SIDE = ["L", "P", "I"]
