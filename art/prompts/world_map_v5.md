# world_map_v5 – Weltkarte von Valmora im Figurenstil

- **Zweck:** Hintergrund der neuen Weltkarte nach `concept/22-narrative/geografie-valmora.md`. Löst `map_v4.png` ab (Produktinhaber: zu dunkel, zu realistisch, Burgplatz zu groß). Noch nicht ins Spiel eingebunden.
- **Ergebnis:** `art/world/map_v5.png` (3276 × 3276, zusammengesetzt), Stadtbilder `art/world/sites/*.png` (Transparenz), Positionen `art/world/map_places_v5.json` (Quelle der Vorschau: `art/world/v5/sites.json`).
- **Originale, unverändert aus ChatGPT:** Grundbild `art/world/v5/map_new_try2.png` (1254 × 1254), Kacheln und Plateaus `art/world/v5/tiles/`, Stadtbilder `art/world/sites/`. Verworfene Vorstufen: `map_style_try1.png`, `map_new_try1.png`, `castle_patch.png`, `tile_test_output.png`.
- **Datum:** 2026-11-04
- **Dienst:** ChatGPT, Bildgenerierung (Modellversion in der Oberfläche nicht genannt), Tarif Plus, Konto maschoeller, gesteuert über Claude in Chrome.
- **Referenzen:** Komposition `art/world/map_v4.png` (eigenes Bild, vom Produktinhaber als Maßstab für das große Ganze genannt); Figurenstil über `art/mockups/style-2026-11/anchor_rhen.png` und daraus entstandene Kartenausschnitte (eigene Bilder).
- **Menschlicher Anteil:** Konzept, Layout und alle Entscheidungen im Dialog mit dem Produktinhaber. Zusammensetzung per Skript: `art/world/v5/tiles.py` schneidet das Grundbild in 3 × 3 überlappende Kacheln und blendet die nachgemalten Kacheln und Plateaus über die Überlappung (`--patch`). Keine Retusche von Hand.

## Warum Kacheln und Plateaus

- **Kacheln:** Auf dem Handy wird stark gezoomt; bei einem Drittel der Kartenbreite wäre das 1254-Pixel-Bild unscharf. Das 3276-Pixel-Bild ist etwa 3,2 MB als WebP und soll auf Abruf laden.
- **Plateaus:** Die Stadtbilder saßen frei auf der Karte nicht im Gelände. Deshalb ist für jeden wichtigen Ort ein leeres Plateau ins Bild gemalt, auf das das Stadtbild ohne eigenen Untergrund passt. So bleiben Orte später austauschbar (brennend, ausgebaut).

## Prompt: Grundbild

Anhänge: `map_v4.png`, `castle_patch.png`.

> Forget the previous maps. The FIRST attached image is the composition I want: keep exactly its big picture, viewing angle, proportions and all shapes: the same coast with fjord, estuary, peninsula and island, the same high main ridge with glaciers and crater, the same frozen lake and the gorge under it, the same plateaus and hills, the same mountain wall, border wall, rivers, forests, fields, hamlets, and the same very thin roads at their thin width. Do not move, simplify or enlarge anything. Redraw it in the drawing style of the SECOND attached image: friendly round cartoon, clean dark-brown lines, two-tone cel shading with light from the upper left, flat clean colours, round tree crowns, rounded rocks, no texture and no photographic look. From the second image take only line work and rendering, NOT its wide roads, NOT its large trees and NOT its bridges. Keep the fine scale of the first image: very many tiny trees, tiny houses, thin roads; the same small level of detail everywhere. Make it bright and sunny: light clear turquoise sea with small wave lines, fresh green south, warm ochre and rust autumn land, bright white snow, no dark or moody areas, no haze except a little at the far east edge. Two corrections. 1) Home castle site: right next to where the road passes through the grey mountain wall, a short way to the east of the road, cut a small deep niche into the south face of the wall, with rock faces on both sides and behind, and a tiny flat rock shelf inside it like a balcony, with three tiny terraces below it running down to the meadow. A rocky ridge separates it from the road. No building on it. 2) Bridges: a tiny stone arch bridge ONLY at the exact spots where a road crosses a river, with its deck in line with the road and the water passing below it. Never on dry land, at junctions, or lying along a river. No city, castle, fortress, tower, temple, harbour, ship, clouds, people, text, labels or border. Square 1:1.

## Prompt: Kacheln (je eine, 9 Läufe)

Anhang: `art/world/v5/tiles_in/r<z>c<s>.png`. Bei `r0c1` zusätzlich: „The smoke above the crater is only a thin small wisp.“

> The attached image is an enlarged, blurry section of the map you just painted. Redraw exactly this section as a sharp, crisp close-up in the same cartoon style: clean thin dark-brown lines, two-tone cel shading, light from the upper left. Keep the position and size of every coastline, river, road, bridge, forest, field, mountain and house exactly as in the attached image, with the same zoom, so that the section fits back into the big map without seams, especially along all four edges. Roads stay as narrow as they are here, never wider; thin pale dirt tracks, thinner than the rivers. Bridges only where a road really crosses a river: a tiny stone arch with its deck in line with the road and the water passing below. Add fine detail: many small individual trees instead of big ones, small rocks, field furrows, reeds, small paths and fences; on water, small wave lines. Colours slightly calmer and less saturated than before: soft fresh green, warm ochre and soft rust, still bright and sunny. No new buildings, no people, no clouds, no text, no labels, no border. Square 1:1.

## Prompt: Korrektur blinder Brücken (`bridge_patch.png`, Ausschnitt 470,540–670,740)

> Edit the attached section and keep everything else exactly as it is: same zoom, style, line weight, colours, and every river, road, tree, hill and house in its place. Change only this: remove the stone bridge in the upper-left area at the river mouth, and remove the stone bridge in the lower-right area at the river fork. No road crosses the water at either spot. Where they stood, paint plain river water with its banks, continuing the river naturally. Keep the other bridges where a road crosses a river. No people, no text, no labels. Square 1:1.

## Prompt: Plateau (Beispiel Paktwacht, je Ort angepasst)

> Edit the attached map section and keep the style, line weight, colours, zoom and everything near the edges exactly as it is, so it fits back into the map without seams. Change only the small round rock shelf in the niche of the grey mountain wall: make it a larger, flat, EMPTY building plateau for a castle that will be added later, about 40 percent as wide as this image. The niche in the mountain becomes correspondingly wider and deeper, with steep rock faces rising behind and beside the plateau, so that the plateau clearly sits inside the mountain. A clean level surface of pale paved stone with no objects on it, framed in front by a low stone retaining wall with a clear dark-brown outline and a soft contact shadow. Below it three small stepped terraces run down to the meadow, and the thin side track ends at them. The road through the pass stays to the left, separated by a rocky ridge. Nothing stands on the plateau: no buildings, no trees, no rocks. No people, no text, no labels. Square 1:1.

## Prompt: Stadtbild (Beispiel Paktwacht, je Ort angepasst)

Anhang: das zugehörige Plateau.

> Create a single isolated building icon for the empty round stone plateau inside the rock niche in the attached image. Subject: the Paktwacht, a weathered stone castle: one big round keep at the back, two round towers and a gatehouse in the front, a short wall between them, a slate roof on one hall. The footprint is one oval that exactly fills the plateau, the back rises towards the rock behind it. Exactly the drawing style, viewing angle and light of the attached map section. It will be shown small on the map, so use FEW, LARGE, SIMPLE shapes and a THICK dark-brown outline; no tiny details, no brick patterns, no small objects. Its outline must look as heavy as that of the trees in the attached image when it is scaled down to the plateau size. Transparent background. No ground, no base, no rock or grass around it, no shadow outside the building, no people, no text. Square 1:1.

Stadtbilder sind 1254 × 1254 mit Transparenz; Alphawerte unter 16 sind per Skript auf 0 gesetzt, sonst liegen sie falsch. Die frühere Fassung der Burg (`paktwacht_v2.png`, im Git-Verlauf) ist die Vorlage für `paktwacht_v3.png`:

> Create a single isolated building icon for the empty round stone plateau inside the rock niche in the FIRST attached image. Subject: the Paktwacht, based on the castle in the SECOND attached image, but more splendid and noble: warm light limestone walls, a taller main keep with a pointed slate cone roof, slim round towers with pointed blue-grey roofs, a proud arched gatehouse with a carved stone crest above it, long banners in deep red hanging on the towers, a bright window row in the great hall. It stands in front of the rock, the back rises towards it. Still a fortress that guards something old, not a fairy-tale palace, and no gold.

**Motive der übrigen Orte:**

- Aurenhall: the golden royal capital in winter: one big cathedral palace with a large golden dome and a few golden spires in the centre, a simple ring of chunky snow-roofed houses around it, and a stone city wall with a big gate at the front.
- Varnhold: a small border town in late summer: a tight cluster of about eight chunky half-timbered houses with red and brown roofs around a small market square, one modest square watchtower, a low wooden palisade around it.
- Kronfeld: a market town: a few timber-framed houses with red roofs around an open market square with striped market stalls, two large granary barns, no fortress and no walls.
- Kontor: a harbour trading post: two large warehouses with dark wood walls and slate roofs, one big wooden crane, and two short wooden piers.
- Perlhof: a small elegant palace with white walls and teal roofs, one central domed hall and two slim side towers.
- Grauwacht: a grim military fortress of dark grey stone: thick square walls, four square towers with flat battlements and one big square keep, small red pennants.
- Kupferhall: a mining town: a few houses with shiny copper-coloured roofs, two tall wooden mine headframes with big wheels, two brick chimneys without smoke.
- Silberquell: a small monastery with white walls and a dark slate roof: one long hall, a small cloister wing and one tall square bell tower.
- Erlbach: a small farming village: three cottages with golden thatched roofs and one wooden water mill with a big wheel.
- Krähenholm: a smugglers cove camp: three simple wooden huts on stilts with plank roofs, and one wooden jetty; no ship.
- Urtempel: an ancient temple of dark stone: a low stepped base, a row of thick square pillars carrying a heavy flat stone roof, faint glowing orange cracks.

Bei den neun späteren Plateaus nannte der Prompt statt „N percent as wide“ die Spanne („spans only from a to b percent of width and c to d percent of height“), sonst wurden sie zu breit.

## Abnahme

Laufend mit dem Produktinhaber 2026-11-04, je Stufe im Browser-Fenster gezeigt:

- Reine Aufhellung von v4 verworfen, neu gemalt im Figurenstil; `map_new_try1` zu flach, Brücken auf trockenem Land; Komposition von v4 ausdrücklich als Referenz gewählt.
- Grundbild `map_new_try2` als Grundlage bestätigt, mit Feinschliff beim Kacheln (ruhigere Farben, dünner Rauch).
- Naht zwischen zwei Kacheln geprüft, nicht sichtbar. Zwei blinde Brücken gezielt entfernt.
- Erste Stadtbilder (detailreich, eigener Untergrund) schmiegten sich nicht ein. Plateau plus einfachere Bilder an drei Orten bestätigt: „so für alle Orte“; 12 Orte mit Bild, die übrigen als Marker.
- Nach der Gesamtansicht: alle Stadtbilder kleiner, Burg prächtiger, Plateaus dürfen sichtbar bleiben. **Produktinhaber 2026-11-04: abgenommen.**
