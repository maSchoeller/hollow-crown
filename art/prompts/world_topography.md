# world_topography – Designbilder der Weltkarte (Topografie)

- **Dateien:** `art/world/concept_oblique_screen.jpg`, `art/world/concept_relief_screen.jpg` (Bildschirmfotos der Bildansicht in ChatGPT, 1568 × 765; die Originale liegen im ChatGPT-Verlauf „Fantasy Terrain Design“ und wurden nicht heruntergeladen)
- **Datum:** 2026-10-24
- **Werkzeug:** ChatGPT (Bildgenerierung, Tarif Plus, Konto maschoeller), gesteuert über Claude in Chrome
- **Zweck:** Nur Vorlage zum Modellieren; die Bilder werden nicht ausgeliefert. Ausgeliefert wird das daraus gebaute Gelände (`pnpm art:world`).
- **Referenzen:** `art/world/valmora_layout_ref.png` (Skizze des Kachelrasters, aus `content/world/valmora.yaml` erzeugt) und `art/mockups/locations-s1/weltkarte_valmora.png` (Stimmung, Farben)
- **Iterationen:** 2 Bilder, je 1 Versuch
- **Menschlicher Anteil:** Höhenkarte und Bodentextur sind prozedural aus dem Raster gebaut (`tools/art/world_height.py`), Mesh und Vorschau in Blender (`tools/art/blender_world.py`); die Bilder dienten nur als Vorbild für die Landformen.

## Prompt 1 (Schrägansicht)

> Create an image (landscape 16:9): a terrain design sheet for a 3D modeller, showing the TOPOGRAPHY of a fantasy island kingdom as a miniature tabletop diorama seen from a 45-degree bird's-eye view from the south. Use the first attached image as the exact layout (it is a tile map: blue = sea and river, white/grey = high snowy mountains, orange/olive = autumn highland, green = late-summer lowland, beige = roads, white circles = towns) and the second attached image only for mood and colours. Make the landform very readable: in the north a tall jagged mountain range with snowy peaks and deep valleys; in the middle-west an elevated highland plateau with steep cliff edges, rolling ridges and terraces, cut by a deep river gorge that runs from the mountains south-west to the sea; in the south and east a lowland of gentle rolling hills, a few low ridges and wide valleys; the west coast drops to the sea with rocky cliffs and small beaches. Show the terrain mostly bare (few trees, no buildings) so the shapes of hills, slopes, cliffs and valleys are clear, with soft warm sunlight from the south-west and strong soft shadows that reveal the relief. Style: clean, rounded, toy-like stylized landscape, warm saturated but natural colours. No text, no labels, no frame.

## Prompt 2 (Relief von oben)

> Great. Now a second design sheet of the SAME landscape for the modeller, seen straight from above (top-down orthographic, north up), landscape 16:9, framed exactly like my first attached tile map so positions match: a shaded relief map. Show only the landform: hill-shading with light from the north-west, soft elevation tints (sea dark blue, coast and lowland light green, plateau ochre-orange, mountains grey with white snow on the highest peaks), and thin pale contour lines every step of height so I can read how high every place is. Make the separate cone-shaped peaks of the northern range, the stepped cliff terraces of the plateau, the narrow river gorge with its waterfall, the rolling lowland hills with small rocky crests, and the rocky west coast with sea stacks clearly visible. No trees, no buildings, no roads, no text, no labels, no frame.

## Abnahme

- Bild 1: gezackte Schneegipfel, Tafelland mit geschichteten Felswänden, Canyon mit Wasserfall, Hügelland mit Felsnasen, Steilküste mit Felsnadeln ✓
- Bild 2: zusammenhängende Grate statt Einzelkegel, Tafelberge mit Felswänden rundum, gewundener Canyon, viele kleine Felskuppen ✓ – danach Bergketten statt Kegel modelliert (Rückmeldung Produktinhaber).
