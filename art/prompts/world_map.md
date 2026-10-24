# world_map – flache Weltkarte von Valmora (Hochformat)

- **Dateien:** `art/world/map_flat.png` (Original von ChatGPT), `art/world/map_guide.png` (Layout-Referenz, erzeugt von `tools/art/world_guide.py` aus `art/world/map_layout.json`)
- **Datum:** 2026-10-24
- **Werkzeug:** ChatGPT (Bildgenerierung, Tarif Plus, Konto maschoeller), gesteuert über Claude in Chrome
- **Zweck:** Hintergrundtextur der Weltkarte (Levelauswahl) für 35 Orte: 25 Story-Missionen (Prolog + 8, 8, 8) und 10 Nebenquests. Die Karte zeigt **keine Gebäude, Wege oder Beschriftungen**; Orte, Wege, Nebel und Heimat legt das Spiel darüber, später optional kleine 3D-Modelle (Burg, Lager)
- **Referenzen:** `art/world/map_guide.png` (genaues Layout: Meer, Akt-Zonen, Fluss, 36 Lichtungen) und `art/mockups/locations-s1/weltkarte_valmora.png` (nur Stil, Palette, Stimmung)
- **Iterationen:** siehe unten

## Struktur der Karte (Begründung)

- **Hochformat 2:3 (1024 × 1536):** die App läuft im Hochformat; die Karte wird beim Spielen geschwenkt und zweistufig gezoomt.
- **Reise von Süden nach Norden:** Akt 1 unten (Grenzland, Spätsommer, Start unten rechts), Akt 2 in der Mitte (Eisenmark, Herbst), Akt 3 oben (Aurenhall und Drachengebirge, Winter). Die Akt-Grenzen laufen als weiche Wellenbänder quer, damit der Nebel späterer Akte im Spiel ein einfacher Verlauf von oben ist.
- **Silbermeer im Westen** (Kontor am Silbermeer, Küste), **Grenzmarken im Osten** (Gebirgsrand), **ein Fluss** vom Gebirge im Norden zur Küste im Südwesten trennt Akt 3 sichtbar von Aurenhall und trägt die Karte.
- **36 Lichtungen** (35 Orte + Heimat): freie, flache Stellen, damit später Marker oder kleine 3D-Modelle darauf stehen. Mindestabstand 10 Einheiten (≈ 100 px) für Tipp-Ziele von 44 px und Beschriftungen.
- **Cluster:** Paktwacht (Heimat, 1-6, 1-7, 1-8) und Aurenhall (3-1, 3-5, 3-6, N7, N10) sind große ebene Flächen mit mehreren Lichtungen nebeneinander.
- **Wegführung:** zeichnet das Spiel (gepunktete Linien entlang der Kampagnenkanten), nicht das Bild.

| Zone | Orte |
|---|---|
| Akt 1, Grenzland (unten) | P Karawanenstraße · 1-1 Varnhold · N1 · 1-2 Erlbach · N3 Pachthof · 1-3 Kreuzung · 1-4 Wolfswald · 1-5 Hungerlager (Flussufer) · N2 Wachturm-Hügel · 1-6/1-7/1-8 Paktwacht + Heimat (H) |
| Akt 2, Eisenmark (Mitte) | 2-1 Hochland · 2-2 Salzpass (Engpass) · 2-3 · 2-4 Wyvernhorst (Felsnadeln) · 2-5 Brandhang · 2-6 · 2-7 Kontor (Küstenvorsprung) · 2-8 Kronfeld (weite Ebene) · N4 Hochtal · N5 Mine · N6 Straße |
| Akt 3, Aurenhall und Drachengebirge (oben) | 3-1, 3-5, 3-6, N7, N10 Hauptstadt-Plateau · 3-2 · 3-3 Waldhütte · 3-4 · 3-7 Gebirgspass · 3-8 Urtempel (ganz oben) · N8 · N9 Königsgrab |

## Prompt 1

> Create an image (portrait 2:3, 1024 x 1536): a hand-painted FLAT game world map of the fantasy kingdom of Valmora, seen straight from above (top-down, north up), to be the background texture of a mobile game's level-select screen. Use the first attached image as the exact layout: blue = sea in the west, grey = high mountains, white = snowy winter highland in the north, orange = autumn highland in the middle, green = late-summer lowland in the south, the light-blue line = one main river running from the northern mountains south-west to the sea, white circles = open clearings. Keep the coastline, the three season zones, the mountains and the river where they are in the guide, but paint them as natural, organic landforms with soft, wavy transitions (green fades into orange, orange fades into snow), no hard lines. Use the second attached image ONLY for the art style, colour palette and mood: polished stylised cartoon look, rounded forms, warm saturated natural colours, soft light. Do NOT copy its buildings, ships, bridges, roads, castles or its oblique angle.
>
> Landscape content, north to south: a jagged snowy mountain range across the top edge; below it a snowy highland with frosted fir forests, frozen ponds and a high mountain pass; in the north-west a large, flat, stone-grey terraced plateau with snow-dusted meadows around it (the capital will stand there later, so leave it bare). The middle is an autumn highland: terraced plateaus with cliff edges, red and orange autumn forests, a deep canyon along the river, tall rock spires in the east, a mine hillside, a wide open flat plain in the centre, a narrow rocky pass west of the centre and a rocky headland on the west coast. The south is late-summer lowland: rolling hills, patchwork golden wheat fields, meadows, green forests, small rocky outcrops, a river mouth with sandy beaches and a bay in the south-west; in the middle of the south a broad rocky hill with a flat top (a ruin will stand there later, leave it bare). The sea in the west is turquoise in the shallows and deep blue offshore, with white surf on the rocks and a few small rocky islets, no ships.
>
> Very important: the 36 white circles in the guide are open clearings. Paint each one as a calm, flat, open patch of ground about the size of the circle, matching its surroundings (meadow, trampled earth, stone terrace, snow), with nothing tall on it and the trees pulled back around it, so that a small building or icon can be placed there later. Do NOT draw the circles, numbers or any marker. Do NOT paint any buildings, houses, towers, castles, walls, bridges, ships, roads, paths, banners, people, animals, text, labels, numbers, icons, compass, frame, border or vignette. Medium, even level of detail that stays calm enough for icons on top; soft baked relief shading with light from the north-west, no harsh cast shadows, no black outlines. The picture fills the whole canvas.

## Abnahme

Lauf 1 (1 Versuch, `art/world/map_flat_v1.png`, 1024 × 1536, Original aus ChatGPT heruntergeladen):

- Küste, Fluss, drei Jahreszeiten-Zonen und Gebirge folgen dem Layout ✓; Stil wie das Referenzbild ✓; keine Gebäude, Wege, Schrift oder Marker ✓
- Die 36 Lichtungen liegen fast genau auf den Slots (die meisten weniger als 40 px daneben); drei Orte bekamen von Hand eine andere Stelle: Kronfeld (2-8) in der großen freien Ebene der Mitte, Hungerlager (1-5) an der Sandbucht, Gauklertruppe (N6) am Waldrand. Endpositionen in `art/world/map_placed_v1.json`, kleinster Abstand 102 px
- Schwächen: Lichtungen sind gleichförmig runde Sandflecken; die Ansicht ist schräg statt streng von oben (Felswände seitlich); die Hauptstadt (3-1, 3-5, 3-6, N7, N10) verteilt sich auf mehrere Plateaus statt auf eine große Fläche; 1024 px Breite sind auf Handys mit hoher Pixeldichte nur bei kleinem Zoom scharf (Hochskalieren auf 2048 × 3072 wäre der nächste Schritt)
