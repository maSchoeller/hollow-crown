# map_assets_coast – Referenzblätter für Küste, Hafen und Hochland (Akt 2)

- **Dateien:** `art/mockups/map-assets/refs/coast_1.png`, `coast_2.png`, `coast_3.png` (Requisiten, 1536 x 1024), `coast_tex1.png`, `coast_tex2.png` (Texturen, 1254 x 1254)
- **Abgeleitet:** `art/props/textures/coast_masonry.png`, `coast_planks.png`, `coast_slate.png`, `coast_rock.png`, `coast_field.png`, `coast_sand.png`, `coast_velvet.png`, `coast_water.png` (zugeschnitten, Kanten überblendet, 512 x 512)
- **Datum:** 2026-11-04
- **Werkzeug:** ChatGPT (Bildgenerierung, Tarif Plus, Konto maschoeller), gesteuert über Claude in Chrome
- **Original-Ablageort:** die Dateien unter `art/mockups/map-assets/refs/` sind die unveränderten Originaldownloads
- **Zweck:** Vorlagen für den Nachbau in Blender (`tools/art/props/coast.py`). Die Blätter selbst werden nicht ausgeliefert, die Texturen fließen in die Bake-Texturen der Modelle ein.
- **Referenzen:** `coast_1` bis `coast_3` mit `art/mockups/map-assets/ziel_paktwacht.png` als Stilvorlage, `coast_tex1` mit `coast_1.png`, `coast_tex2` ohne Bild
- **Iterationen:** je 1
- **Abnahme:** offen

## Gemeinsamer Rahmen der Requisiten-Prompts

> Create an image, 1536x1024 (landscape): an asset sheet of 8 separate game props on a plain light neutral background, seen from a high 3/4 camera about 35 degrees from straight down, south side towards the viewer, rounded chunky low-poly toy diorama, hand-painted textures, warm light, professional studio quality, no text, no people, evenly spaced. The attached picture is only the style reference for material painting and light. The 8 props, in 2 rows of 4, each clearly separated: […] No blue, no bright red, no bright green on any prop; muted ochre, tan, oak brown, slate grey.

## coast_1 (Stimmung „autumn harbour mood“)

> (1) one straight square section of harbour quay: big grey-brown stone blocks at the front, a timber plank deck on top, a thick wooden fender beam along the south face. (2) one square corner section of the same quay, the stone edge turning around a corner. (3) a chunky harbour warehouse with weathered timber upper floor over a stone ground floor, steep dark blue-grey slate roof, big double loading door. (4) a second warehouse, longer and lower, stone walls, slate roof, a hoist beam over a loft hatch. (5) a medieval wooden harbour crane: square timber base, tall post, long slanting jib, rope and hook, a treadwheel at the side. (6) a large stout medieval merchant cog, single mast with furled dull tan sail, high fore and aft castles, dark tarred hull planks, seen on its own without water. (7) a small wooden rowing boat with two oars. (8) a long narrow flat canal barge with a low awning of patched canvas and crates on deck.

## coast_2 (Stimmung „autumn harbour and highland mood“, ohne Bodenplatten)

> (1) a stout wooden mooring post with an iron ring and coiled thick rope around its foot. (2) a small stack of three weathered wooden cargo crates with rope. (3) a small group of three oak barrels with iron hoops, one lying on its side. (4) a small travelling players stage: low square timber platform, two posts carrying a heavy dark plum and ochre curtain drawn to the sides, little pennants in mustard. (5) a market tent: square canvas tent in cream and ochre stripes with open front, peaked top, ropes and pegs. (6) one straight section of a rope suspension bridge: wooden plank walkway with gaps seen lengthwise running north to south, thick hand ropes on both sides, small sag. (7) the end of the same rope bridge: two stout anchor posts driven into a small rock ledge, ropes tied off, first planks starting. (8) a highland signal fire: chunky stone ring base with an iron basket on a short post, stacked logs burning with stylised orange painted flames.

## coast_3 (Stimmung „autumn highland mood“, ohne Bodenplatten, zulässig nur blasses Wasser)

> (1) a small waterfall piece: a stepped block of grey-brown rock with a foaming pale water stream falling over two ledges into a small pool, stylised painted water and foam, one square tile. (2) a highland monastery building: thick pale grey stone walls, steep dark slate roof, small round-arched windows, a little bell gable on top, arched oak door on the south, amber autumn ivy on one corner. (3) a small highland village house: rough fieldstone lower walls, dark timber upper gable, heavy dark slate roof, squat stone chimney, small oak door. (4) a second highland house: broader and lower, whitewashed stone walls weathered at the corners, slate roof with a lean-to shed of planks at its side. (5) a straight cliff edge piece on a square tile: rock massif filling the tile, top with dry autumn grass tufts, the south half breaks off in a sharp steep stepped rock face going down, clearly a drop. (6) a cliff outer corner piece: the same rock with grass on top, breaking off in sharp steep rock faces on both the south and the east side. (7) rockfall debris: a heap of sharp broken angular boulders and rubble with dust-coloured small stones, low and wide. (8) a low-tide sandbar: a flat irregular pale wet sand bank with ripple marks, small dark green-brown seaweed clumps, a few pebbles and a shell, very flat.

## coast_tex1

> Create an image, 1024x1024 (square): a 2x2 sheet of four seamless hand-painted game textures, flat straight-on view, separated by a clean white gap, no text, soft painterly toy diorama style, warm light, professional studio quality. Match the painted materials of the attached picture exactly. Top left: warm grey-brown quay stone masonry in rounded chunky blocks with darker joints and ochre lichen patches. Top right: warm oak planks running horizontally, cracks and grain, small dark iron nails, weathered honey-brown. Bottom left: dark plum-grey slate roof tiles in overlapping rows, rounded lower edges, a few ochre lichen flecks. Bottom right: rough grey-brown cliff rock with angular cracks, mustard lichen, no grass.

## coast_tex2

> Create an image, 1024x1024 (square): a 2x2 sheet of four seamless hand-painted game textures, flat straight-on view, separated by a clean white gap, no text, soft painterly toy diorama style, warm light, professional studio quality. Top left: fieldstone wall of rough rounded irregular stones in warm grey and tan with deep dark joints, a little ochre lichen. Top right: pale wet sand with soft diagonal ripple marks and small pebbles, muted beige and tan. Bottom left: dark plum velvet curtain cloth with soft vertical folds and subtle highlights. Bottom right: stylised foaming river water flowing downwards, pale blue-grey and white foam streaks, painterly, not saturated.

## Abweichungen vom Blatt im Nachbau

- `monastery_a`: steinerner Knauf statt des Kreuzes auf dem Glockengiebel.
- `boat_a`: Riemen sind im Modell angeschlagen und liegen außen auf, nicht neben dem Boot am Boden.
- `quay_*`: Deck auf z = 0,06, damit Figuren darauf stehen; das Mauerwerk reicht unter z = 0 ins Wasser.
- `mooring_a`, `crates_a`, `barrels_a`: stehen im hinteren Teil des Felds, die Feldmitte bleibt frei.

## Prozedurale Texturen

`coast_fall, coast_ripple` stammen nicht von ChatGPT, sondern aus `tools/art/props/map_asset_textures.py` (Nachbesserungsrunde 2026-11-04).
