# world_map_v4 – Weltkarte von Valmora

- **Zweck:** Hintergrund der neuen Weltkarte nach der Geografie in `concept/22-narrative/geografie-valmora.md`. Orte legt das Spiel als Ebene darüber (`art/world/map_places_v4.json`); noch nicht ins Spiel eingebunden.
- **Original:** `art/world/map_v4.png` (1254 × 1254, unverändert aus ChatGPT). Vorstufen: `art/world/v4/probe_a_landscape.png`, `probe_b_inhabited.png`, `try_1.png`.
- **Datum:** 2026-11-03
- **Dienst:** ChatGPT, Bildgenerierung (Modellversion in der Oberfläche nicht genannt), Tarif Plus, Konto maschoeller, gesteuert über Claude in Chrome. Ein Chat „Fantasyweltkarte Erstellen“.
- **Referenzen:** Layout aus eigenen Vorlagen `art/world/v4/guide_a_landscape.png`, `guide_b_settlements.png`, `guide_c_roads.png`. Nur Stil, Palette, Stimmung: `art/world/map_concept_v3.png` (eigenes früheres ChatGPT-Bild).
- **Menschlicher Anteil:** Konzept, Ortswahl und alle Stilentscheidungen vom Produktinhaber im Dialog. Die Vorlage entstand aus einer berechneten Erosion nach handgesetzten Vorgaben (`art/world/v4/terrain.py`, `terrain_scenario.json`, `guide.py`, `guide_places.json`). Das Original ist nicht nachbearbeitet.

## Prompt 1: Probe A, nur Landschaft

Anhänge: `guide_a_landscape.png`, `map_concept_v3.png`.

> Create an image (square 1:1, 1024 x 1024): a hand-painted illustrated fantasy world map of a kingdom, seen from a high bird's-eye view, almost top-down, north up, for a cozy but serious tactics RPG. Use the FIRST attached image as the EXACT layout: follow its coastline, islands, river courses, lake and mountain ridges precisely, do not move or simplify them. Blue = sea. Pale blue-white oval = large frozen lake. Blue lines = rivers, keep every river, they join each other and run to the sea. White zone in the north = winter: snowy basin, the great snow mountain range along the top with one dark crater glowing orange where the red dot is. Orange-rust zone in the middle = autumn highland: rust and ochre plateaus, copper hills in the east, a narrow canyon along the eastern tributary, a wide fertile golden plain where the rivers meet. Green zone in the south = late summer: green meadows, golden fields, dense forests. Dots = forests in the colour of their season. Dark hatching near the south-western bay = marsh in a river delta. Make these features clearly readable: a sharp, rocky mountain wall runs from west to east exactly along the border between orange and green, separating the south from the highland; a deep narrow fjord with steep snowy cliffs cuts in from the west in the north-west; the wide river estuary in the west; a long peninsula below it ending in a point, and a separate island off the south-west. Between the frozen lake and the highland a low wall of hills is broken by one narrow gorge where the river leaves the lake. The seasons change abruptly at these terrain edges. Use the SECOND attached image only for painting style, palette and mood, NOT for layout. Pure landscape only: NO buildings, NO towns, NO castles, NO roads, NO ships, NO text, NO labels, NO borders, NO compass rose, no UI.

## Prompt 2: Probe B, bewohnt

Anhang: `guide_b_settlements.png`.

> Now paint the same map again with the same style and the same landscape, but this time as an inhabited land, using the newly attached image as the layout. Each brown square marks a settlement or landmark at exactly that spot, brown lines mark roads. Paint small but clear details there: a golden capital city on the south shore of the frozen lake, a fortress with a gate in the gorge below the lake, a castle built into the southern flank of the mountain wall with terraces below it, a harbour town at the estuary with a few ships, a small palace at the tip of the peninsula, a fortress at the foot of the eastern copper hills, a bridge town on the southern river, small villages, farms and a monastery at the other squares. Add a few more tiny unnamed farms and hamlets along the roads so the land feels lived in, and small bridges where roads cross rivers. A dirt road follows the brown lines. Keep everything small so the landscape stays dominant. No clouds, no text, no labels, no borders, no compass rose, no UI.

## Prompt 3: erster Endkandidat

Anhang: `guide_c_roads.png`.

> Paint the final version of this map, using the newly attached image as the exact layout for coast, rivers, lake and roads. Keep the same hand-painted style and level of detail, with these changes. 1) Calmer colours: same seasons but more muted, earthy and natural, less saturated orange, softer greens, a gentle painterly feel with a serious mood. 2) Real mountain structure in the north: one high main ridge with a few big snow peaks and glaciers running from west to east, lower foothills and valleys in front of it, not rows of equal spikes. The dark volcanic crater glowing softly orange sits at the red dot within the main ridge, with only a thin wisp of smoke. 3) Brown lines are dirt roads, paint them as thin, natural, slightly winding roads, with small stone bridges where they cross rivers. Paint only very few tiny unnamed farms and hamlets along the roads, far from the road junctions. 4) IMPORTANT: no city, no castle, no fortress, no palace, no tower, no temple, no harbour, no ships anywhere. The road junctions and road ends stay open natural ground, because the game places its own markers there. At the top of the middle road between orange and green, where the road crosses the rocky mountain wall, show a narrow pass and below its south side a rocky flank with terraces and fields, without any building. 5) The dark line along the east edge is an old stone border wall on low hills: intact in the north part, broken with gaps in the south part. Beyond it the land fades into haze. Also a low wall of hills below the frozen lake, broken by one narrow gorge with the river. No clouds, no text, no labels, no borders, no compass rose, no UI.

## Prompt 4: abgenommene Fassung

> Very good. Keep this image exactly as it is, same layout, colours, mountains, coast, rivers and roads, and change only two things. 1) Directly south of the frozen lake add a clearly visible, steep, rocky wall of hills running from west to east across the land, about as thick as the mountain wall further south but lower, with snow on its north side and autumn colours on its south side. The river and the road squeeze through one single very narrow, deep gorge with steep cliffs in the middle of this wall. 2) Add a few more tiny unnamed farms and hamlets of two or three small houses with little fields, scattered along the roads across all regions, about twenty in total, none of them at road junctions or road ends. Still no city, no castle, no fortress, no tower, no temple, no harbour and no ships. No clouds, no text, no labels.

## Abnahme

Vier Läufe, je ein Versuch. Produktinhaber 2026-11-03: **abgenommen**.

- Probe A und B: Layout sehr genau getroffen. Entscheidung am Vergleich: Wege und Weiler gemalt, Missionsorte als Ebene; Farben ruhiger; Gebirge mit Hauptkamm statt gleicher Zacken.
- Lauf 3: Farben, Hauptkamm, Gletscher, Pass, Terrassen und Grenzwall ✓; Klamm kaum sichtbar, sehr wenige Höfe.
- Lauf 4: Riegel und Klamm klar erkennbar, Weiler entlang der Straßen ✓. Leichter Dunst am Ostrand gewollt.
- Bekannte Schwächen: Wolfshügel kaum felsig, Salzpass kein sichtbarer schmaler Pass.
