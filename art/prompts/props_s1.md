# props_s1 – Referenzblätter der Requisiten-Bibliothek (Low-Poly)

- **Dateien:** `art/props/refs/{trees_summer,trees_seasons,rocks_field_fence,houses,landmarks,camp}.png` (Ausschnitte der Bildansicht in ChatGPT, 1456 × 819; Originale im ChatGPT-Verlauf „Create Asset Reference Sheet“, nicht heruntergeladen)
- **Datum:** 2026-10-24
- **Werkzeug:** ChatGPT (Bildgenerierung, Tarif Plus, Konto maschoeller), gesteuert über Claude in Chrome
- **Zweck:** Vorlagen zum Nachbau in Blender (`tools/art/props/*.py`, Low-Poly, kleine gebackene Textur); die Bilder werden nicht ausgeliefert
- **Referenz:** `art/world/concept_style_ref.png` (Ausschnitt des Weltkarten-Konzepts) für den Stil
- **Iterationen:** je Blatt 1
- **Menschlicher Anteil:** Nachbau in Blender (Opus-Subagenten, Skripte im Repo)

## Blätter (Zeilen = Assets, Spalten = vorne, Seite, oben, 3/4)

| Blatt | Assets (IDs) |
|---|---|
| trees_summer | Eiche `tree_a`, Buche `tree_b`, Kiefer `tree_c`, Busch `bush_a` |
| trees_seasons | Herbstbaum `autumn_a`, Herbstbirke `autumn_b`, verschneite Tanne `snowfir_a`, toter Baum `deadtree_a` |
| rocks_field_fence | Felsgruppe `rock_idle`, kleine Steine `rocks_small`, Kornfeld `field_idle`, Zaun `fence_idle` |
| houses | Dorfhaus `house_intact`, `house_visited`, `house_razed`, Bauernhof `farm_idle` |
| landmarks | Wachturm `fort_idle` (Banner fürs Teamtuch), Ruine `ruins_idle`, Schrein `shrine_idle`, Steinbrücke `bridge_idle` |
| camp | Planwagen `wagon_idle`, Zelt `tent_idle` (Banner), Lagerfeuer `campfire_idle`, Truhe `chest_closed`, `chest_open` |

## Prompt (Blatt 1, die übrigen „same style, layout and background“ mit eigenen Zeilen)

> Create an image (landscape 16:9): a low-poly 3D asset reference sheet for a game modeller who will rebuild the assets in Blender. Style: like the trees in the attached image - stylized low-poly toy-diorama look, chunky rounded forms built from a few large faceted shapes, soft hand-painted texture on the facets (gentle gradients, light leaf and bark detail), warm natural saturated colours, light from the top left. Plain light grey background, clean even studio lighting, no ground except a small soft contact shadow. Show 4 assets in 4 rows; in each row the same asset in 4 views: front, side, top-down (orthographic) and a 3/4 perspective view. […] Simple silhouettes that read well from far above; few polygons. No text, no labels, no frame.

## Abnahme

Alle sechs Blätter im gewünschten Stil, vier Ansichten je Asset ✓. Banner von Turm und Zelt cremeweiß (Teamtuch) ✓.
