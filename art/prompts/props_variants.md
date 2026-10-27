# props_variants – Referenzblätter für Varianten der Requisiten-Bibliothek (Low-Poly)

- **Dateien:** `art/props/refs/{houses_variants,trees_variants,rocks_well}.png` (je 1672 × 941, Download der Bilddatei aus der ChatGPT-Bildansicht; Dateigrößen 2,17 MB / 1,67 MB / 1,66 MB; Original = diese Datei, unverändert; Verlauf „Create asset reference sheet“ in ChatGPT)
- **Datum:** 2026-10-27
- **Werkzeug:** ChatGPT (Bildgenerierung, Tarif Plus, Konto maschoeller; Modellversion nicht angezeigt), gesteuert über Claude in Chrome
- **Zweck:** Vorlagen zum Nachbau in Blender (`tools/art/props/*.py`, Low-Poly, kleine gebackene Textur); die Bilder werden nicht ausgeliefert
- **Referenz:** `art/world/concept_style_ref.png` (Ausschnitt des Weltkarten-Konzepts, nur im ersten Prompt angehängt; die weiteren Blätter im selben Gespräch)
- **Iterationen:** houses_variants 1, trees_variants 2 (erste Fassung zu malerisch/realistisch, verworfen), rocks_well 1
- **Menschlicher Anteil:** keiner an den Referenzblättern (unverändert); Nachbau in Blender folgt

## Blätter (Zeilen = Assets, Spalten = vorne, Seite, oben, 3/4)

| Blatt | Assets (IDs) |
|---|---|
| houses_variants | `house_b` langes Fachwerkhaus mit Strohdach, `house_c` Stadthaus, `house_d` Kate mit Holzstapel, `lodge` Besuchshaus (Herberge, blaugrünes Dach) |
| trees_variants | `tree_d` Sommer-Linde, `tree_e` Birke/Pappel, `autumn_c` Herbst-Eiche, `snowfir_b` schlanke verschneite Fichte |
| rocks_well | `rock_b` hoher Fels mit Moos, `rock_c` flacher Felsrücken mit Gras, `well_idle` Brunnen, `fence_gate` Zaun mit Tor |

## Prompts (wörtlich)

### houses_variants (mit angehängtem Referenzbild)

> Create an image (landscape 16:9): a low-poly 3D asset reference sheet for a game modeller who will rebuild the assets in Blender. Style: like the trees in the attached image - stylized low-poly toy-diorama look, chunky rounded forms built from a few large faceted shapes, soft hand-painted texture on the facets (gentle gradients, light wood and plaster detail), warm natural saturated colours, light from the top left. Plain light grey background, clean even studio lighting, no ground except a small soft contact shadow. Show 4 assets in 4 rows; in each row the same asset in 4 views: front, side, top-down (orthographic) and a 3/4 perspective view. Each building is compact, about one tile in size. Row 1: a long half-timbered house with a deep thatched roof, gable end facing the front. Row 2: a two-storey town house with a stone base, half-timbered upper floor, a slate roof and a small bay window, fitting a border town with a market. Row 3: a small cottage with timber walls and a turf or wooden-shingle roof, a stack of firewood beside it. Row 4: an inn / lodge, slightly larger than the others, with a strong deep teal-green roof, a hanging signboard on a bracket above the door, a cream-white banner on the gable, a lantern with warm light next to the open door and a pale stone threshold; it must be clearly distinguishable from the other three. No orange colours on the inn. Simple silhouettes that read well from far above; few polygons. No text, no labels, no frame.

### trees_variants, Fassung 1 (verworfen: malerische Blätter statt Facetten)

> Create a new image, same style, layout and background as before (landscape 16:9, 4 assets in 4 rows, each in 4 views: front, side, top-down orthographic, 3/4 perspective; no text, no labels, no frame; rounded chunky chibi-like low-poly forms, readable silhouettes from far above). Row 1: a summer linden tree with a wide round crown. Row 2: a slim, tall, light summer birch or poplar tree. Row 3: a wide autumn oak in rust and yellow tones. Row 4: a tall, slim snow-covered fir tree (different from a stubby snowy fir: slender and high, with snow on the branches).

### trees_variants, Fassung 2 (übernommen)

> Redo this sheet, but the trees must be true low-poly 3D models: crowns built from a few large clearly faceted blobs (icosphere-like clumps with visible flat facets and hard polygon edges, 3 to 5 clumps per crown), simple chunky faceted trunks, smooth gradient colouring per facet, no individual leaves, no painterly foliage texture. Same rows as before (linden, slim birch/poplar, autumn oak in rust and yellow, tall slim snow fir), same 16:9 layout with 4 views per row, light grey background, no text.

### rocks_well

> Now a new sheet in the same true low-poly faceted style (chunky rounded faceted forms, smooth gradient colouring per facet, light grey background, 16:9, 4 rows, 4 views per row: front, side, top-down orthographic, 3/4 perspective; no text, no labels, no frame). Row 1: a tall mossy rock, upright chunky boulder with green moss on top. Row 2: a flat low rock ridge with grass tufts on top. Row 3: a village well: round stone rim, small wooden roof on two posts, a bucket hanging on a rope. Row 4: a wooden fence section (same style as a simple low wooden fence with posts and two rails) with a small wooden gate in the middle.

## Auffälligkeiten (Selbstbeobachtung, keine Abnahme)

- houses_variants: wirkt etwas realistischer/detailreicher als `houses.png` (weniger Chibi); Lodge mit tealgrünem Dach, Ausleger-Schild (wirkt wie braunes Fass/Schild), weißes Banner hängt über der Tür statt am Giebel, Laterne links der Tür. Draufsicht der Lodge zeigt das Banner nach unten ragend.
- trees_variants: Fassung 2 passt zu `trees_seasons.png`; Eiche weniger breit als gewünscht; Fichte von oben sternförmig.
- rocks_well: Zaun als Zaun mit Tor, aber Tor nur als Kreuzstrebenfeld erkennbar, Seitenansicht schmal; Brunnen ohne Seil sichtbar zwischen Pfosten (Eimer hängt).
- Kein Text im Bild, vier Zeilen und vier Spalten jeweils korrekt.

## Abnahme

- [ ] houses_variants
- [ ] trees_variants
- [ ] rocks_well
