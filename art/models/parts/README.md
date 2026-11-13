# Anhängeteile der Profi-Wege (Story 10.13)

Je Profi-Weg ein kleines Modell, das das Brett zur Laufzeit an einen Körper-Sockel der Figur hängt – kein zweites
Figurenmodell. Gebaut von Hand in Blender, kein KI-Asset:

```
blender -b --factory-startup --python tools/art/blender_proparts.py -- [art/models/parts] [<id> ...]
```

- **Sockel** (`tools/art/prepare_tripo_unit.py` `sockets()`): `socket_back` in der Mitte des oberen Brustwirbels,
  `socket_head` am Scheitel. Beide achsenparallel zur Figur: **+Y hoch, +Z Blickrichtung, +X links**. Ein Rückenteil
  versetzt sich selbst nach hinten (die Rückenfläche liegt bei etwa z = −0,07), ein Kopfteil sitzt um y = 0.
- **Maßstab** wie die Figuren: 1 = ein Feld vor `board.figureScale`; eine Figur ist 0,8 hoch, ihr Kopf gut 0,26 breit.
  Kopfteile bleiben unter etwa 0,16 über dem Scheitel, damit Lebensleiste und Groll-Wimpel frei bleiben.
- **Farben:** Vertex-Farben aus `art/palette/hollow-64.hex`, Teamtuch als Schlüssel K2 im Vertex-Alpha. Keine Textur.
- **Budget:** `partBudget` in `content/packs.yaml` (600 Dreiecke, ≤ 8 KB gzip), geprüft von `tools/figure-budget.mjs`
  und `tests/unit/pro-parts.test.ts`.
- **Zuordnung:** `content/core/render.yaml` `gear.proParts` (Modell und Sockel je Teil), `proPart` je Profi-Klasse in
  `content/core/classes.yaml`, Name als `part.<classId>.name` in den Locales.

| Klasse | Teil | Sockel | Klasse | Teil | Sockel |
|---|---|---|---|---|---|
| `bulwark` | `tower_shield` Turmschild | back | `bishop` | `mitre` Mitra | head |
| `breaker` | `ram_axe` Rammaxt | back | `battle_priest` | `war_hammer` Kriegshammer | back |
| `blade_dancer` | `second_blade` Zweitklinge | back | `bard` | `great_lute` große Laute | back |
| `duelist` | `feather_beret` Federbarett | head | `standard_bearer` | `back_banner` Rückenbanner | back |
| `sharpshooter` | `feather_hat` Federhut | head | `shadow` | `half_mask` Halbmaske | head |
| `ranger` | `leaf_cloak` Blätterumhang | back | `trapper` | `trap_belt` Fallengurt | back |
| `sage` | `pointed_hat` Spitzhut | head | `grand_strategist` | `general_cloak` Feldherrnumhang | back |
| `hexer` | `raven_collar` Rabenkragen | back | `banner_lord` | `standard` Standarte | back |

## Abnahme

`shots/<teil>.png`: je Teil ein Bild bei 375 × 812 aus der Spielkamera. Erzeugt gegen den laufenden Dev-Server:

```
pnpm dev --port 5173
node tools/art/part-shots.mjs
```

Prüfseite für einzelne Teile: `/tools/art/part-one.html?part=<modell>&socket=back|head[&unit=<figur>][&anim=idle|walk|attack]`.
