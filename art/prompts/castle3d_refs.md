# castle3d_refs – Modellier-Referenzen für das 3D-Burg-Diorama (Paktwacht)

Referenzbilder für den Neubau der Burgteile in Blender (Epic 10, Heimat-Burg als 3D-Diorama, Art Direction §7). Anlass: Der 3D-Testaufbau (`src/render/home/castle.ts`, Screenshots in `_bmad-output/planning-artifacts/handoff-epic10/`) wirkt zu kastig gegenüber den gemalten Vorlagen. Die Bilder übertragen die Architektur von `paktwacht_ruine.png` und `paktwacht_heimat.png` (Rundturm, Efeu, Spitzbögen, Drachen- und Kronenpfeiler, glutorangefarbene Banner `#E8743B`) in den runden, klobigen Spielzeug-Diorama-Stil. Sie sind **Arbeitsreferenzen**, keine Spiel-Assets; ins Spiel kommen nur die in Blender gebauten Modelle.

- **Dateien:** `art/mockups/castle3d-refs/*.png` (unveränderte Originale, Git LFS; A3), Übersicht in `art/mockups/castle3d-refs/README.md`
- **Datum:** 2026-10-31
- **Werkzeug:** ChatGPT (Bildgenerierung), gesteuert über Claude in Chrome; Download per `fetch` der Bildquelle im Chat (Original-PNG, unverändert)
- **Tarif und Konto zum Erzeugungsdatum (A1):** ChatGPT **Plus**, Konto `maschoeller` (Seitenleiste der Oberfläche, 2026-10-31); keine Modell-Versionsnummer sichtbar (Denkaufwand „Medium“)
- **Chat:** https://chatgpt.com/c/6ae5977a-2770-83eb-be79-55029d6b342b (alle Bilder im selben Chat, damit die Burg konsistent bleibt)
- **Referenzen:** `art/mockups/locations-s1/paktwacht_ruine.png`, `art/mockups/locations-s1/paktwacht_heimat.png` (Anhänge der ersten Nachricht)
- **Menschlicher Anteil (A2):** Bildidee, Raumliste, Prompts, Auswahl und Abnahme; keine Nachbearbeitung. Der prägende Eigenanteil entsteht erst beim Modellieren in Blender (dort dokumentieren).
- **A7:** Prompts ohne Namen geschützter Werke, Marken, Studios, Spiele oder Künstler; Gefährten nur über ihre Gegenstände beschrieben, ohne Namen

| Nr. | Datei | Größe | Iterationen |
|---|---|---|---|
| 1 | `paktwacht_diorama_l1.png` | 1254 × 1254 | 1 |
| 2 | `paktwacht_diorama_l2.png` | 1254 × 1254 | 1 |
| 3 | `paktwacht_diorama_l3.png` | 1254 × 1254 | 1 |
| 4 | `sheet_walls_towers.png` | 1536 × 1024 | 1 |
| 5 | `sheet_keep.png` | 1536 × 1024 | 1 |
| 6 | `sheet_rooms_a.png` | 1536 × 1024 | 1 |
| 7 | `sheet_rooms_b.png` | 1536 × 1024 | 1 |
| 8 | `sheet_rooms_c.png` | 1536 × 1024 | 1 |
| 9 | `sheet_companion_props_v1.png`, `sheet_companion_props.png` | 1536 × 1024 | 2 |

## 1 – Diorama Stufe 1 (Nachricht 1, mit beiden Anhängen)

> Create an image. The two attached paintings show our castle, the PAKTWACHT (left: the overgrown ruin, right: the restored home castle). I need MODELLING REFERENCES so we can build this castle as a small 3D diorama for a mobile tactics game. Keep the architecture of the paintings: light warm-grey sandstone blocks, a big round tower with crenellations, ivy and climbing plants, pointed gothic arches and gothic windows, two square stone pillars engraved with a dragon relief and a crown relief, slate-blue and terracotta roofs, ember-orange banners (#E8743B). But draw it in a rounded, chunky, toy-like 3D diorama style: warm, friendly, rounded cartoon shapes, soft bevelled edges, few large forms instead of many small details, thick roofs, chunky stone blocks, round tree crowns made of 2-3 balls, clean readable silhouettes, soft cel-like shading, warm evening light from the left, hand-painted texture feel. No text, no letters, no people. IMAGE 1 (level 1, ruin): the whole Paktwacht as a ROUND FLOATING ISLAND diorama (a thick round slab of earth and rock underneath, grass on top), seen from a 3/4 top-down view at about 35-40 degrees like a strategy game camera, square image, plain soft light background. Layout: outer curtain wall with crenellations running around the edge, a gatehouse with a pointed gothic gate at the front (bottom of the image) flanked by the dragon pillar and the crown pillar, round corner towers, the large keep with the round tower at the back, and a cobblestone courtyard in the middle. Around the courtyard eleven small recognisable buildings: a wagon shed / storehouse with a covered wagon, a merchant stall with an awning, a forge with a stone chimney and anvil, an infirmary with a fenced herb garden, a tavern with a hanging sign shape (no letters), a campfire ring with logs to sit on in the centre, a chapel-like memorial hall with a few small grave stones, a small slim rune tower with a pointed roof, a lecture hall / library with tall gothic windows, a craft workshop shed with workbench and planks, and a fenced training yard with straw dummies. This is LEVEL 1: everything is a ruin being reclaimed - broken walls, missing roofs, wooden scaffolding, canvas tarps over holes, piles of stones, lots of ivy, the campfire is small, no banners yet.

**Abnahme:** Runde schwebende Insel, Kamera passt, Tor mit Drachen- und Kronenpfeiler vorn, Rundturm mit Gerüst hinten, Lagerfeuer in der Mitte; alle Räume erkennbar (Wagenschuppen links, Stand, Schmiede rechts mit Esse, Kräutergarten, Gräber vor der Halle, Runenturm links hinten, Übungsplatz links vorn). Formensprache klobig und rund, aber steinreicher als das Spiel tragen kann: Mauern als einzelne Quader lesen, für Blender auf große Blöcke vereinfachen.

## 2 – Diorama Stufe 2 (Nachricht 2)

> Very good, keep exactly this style. IMAGE 2 (level 2): the SAME diorama, same round island, same camera angle, same layout and the same position of every building, tower, wall and the gate with the dragon and crown pillars. Now it is LEVEL 2, repaired: walls patched with lighter new stone blocks, all buildings have new thick roofs (slate-blue and terracotta), new wooden doors and shutters, warm glowing lit windows, the scaffolding is gone except on the top of the big round tower, no more tarps, the stone rubble cleared, the courtyard cobblestones tidy, a little less ivy but still some, the herb garden planted, the training yard fence complete. Still no banners and no lanterns yet. Warm evening light, no text, no letters, no people, square image, plain soft light background.

**Abnahme:** Layout deckungsgleich mit Stufe 1, neue Dächer, leuchtende Fenster, Gerüst nur noch am Rundturm; sehr gut als Vorher/Nachher-Paar.

## 3 – Diorama Stufe 3 (Nachricht 3)

> Perfect. IMAGE 3 (level 3): the SAME diorama again, same island, same camera, same layout and positions, everything from level 2 kept. Now it is LEVEL 3, fully alive: the big round tower is finished with a conical slate-blue roof and no scaffolding, ember-orange banners (#E8743B) hanging from the towers, the gatehouse and the keep, small pennants on the roof tips, warm glowing lanterns on posts along the courtyard and at the gate, a big bright campfire with sparks, grey-white smoke curling from the forge chimney, the tavern chimney and the infirmary, flower boxes and barrels, crates and sacks at the storehouse and the merchant stall, a glowing rune circle at the rune tower, books visible in the library windows, the memorial hall with small candles at the grave stones. Lively and cosy, warm evening light, no text, no letters, no people, square image, plain soft light background.

**Abnahme:** Layout gleich, Kegeldach auf dem Rundturm, Banner an allen Türmen und am Tor, Laternen, Rauch, Runenkreis; Banner tragen ein helles Ährenmotiv (für das Modell ggf. durch das Kompanie-Emblem ersetzen).

## 4 – Bogen A: Mauer, Rundturm, Tor (Nachricht 4)

> Excellent. Now the MODELLING SHEETS for the 3D artist, in exactly the same style, materials and colours as the level 3 diorama. A modelling sheet shows single isolated pieces on a plain white/very light grey background, each piece drawn three times side by side in one row: orthographic FRONT view, orthographic SIDE view and a 3/4 perspective view, all at the same scale, with even neutral lighting, soft shadows only under the objects, clear silhouettes, no ground scenery, no text, no letters, no numbers, no arrows, no people. SHEET A, three rows: row 1 = one straight segment of the outer curtain wall with crenellations (chunky stone blocks, a little ivy, wall-walk visible in the side view, one ember-orange banner); row 2 = the round corner tower (thick cylinder slightly wider at the base, crenellated top, one gothic slit window, one banner); row 3 = the gatehouse with the pointed gothic gate arch and wooden doors, flanked by the two square pillars, the left with the engraved dragon relief and the right with the engraved crown relief, two lanterns. Wide landscape image.

**Abnahme:** Drei klare Zeilen, Turm mit leichtem Sockelanlauf, Torpfeiler mit Drache und Krone sehr gut lesbar. Die „Seitenansichten“ sind eher schräge Ansichten als echte Orthografie; Proportionen aus Front und 3/4 abnehmen.

## 5 – Bogen B: Bergfried (Nachricht 5)

> Very good. SHEET B, same sheet rules (plain white/light grey background, same style, no text, no letters, no people): the KEEP at the back of the castle as one piece, seen at level 3: the big round tower with crenellations and a conical slate-blue roof with a small pennant, joined to the main hall with the large pointed gothic entrance arch (like the arch in the attached paintings), tall gothic windows with warm light, a short flight of stone steps in front, thick ivy and climbing plants on the walls, ember-orange banners. Top row: orthographic FRONT view, orthographic SIDE view and a 3/4 perspective view at the same scale. Bottom row, smaller: the same keep at level 1 as a ruin in 3/4 view (broken crenellations, roof missing, wooden scaffolding around the round tower, canvas tarp over the hall roof, rubble, lots of ivy). Wide landscape image.

**Abnahme:** Halle mit Spitzbogenportal und Rundturm mit Kegeldach in drei Ansichten, darunter die Ruinenfassung mit Gerüst und Plane; sehr gut nutzbar.

## 6 – Bogen C: Konvoi, Händler, Schmied, Heiler (Nachricht 6)

> Great. SHEET C, same sheet rules and style (plain white/light grey background, no text, no letters, no numbers, no people), the room buildings from the diorama, each at LEVEL 3. Four rows, one building per row. In each row from left to right: orthographic FRONT view, orthographic SIDE view, 3/4 perspective view, and at the far right a SMALLER 3/4 view of the same building at LEVEL 1 as a ruin (missing roof, scaffolding, canvas tarp, rubble, ivy). Row 1 = the wagon shed / storehouse: open timber-framed shed with a thick slate roof, a covered wagon inside, crates, barrels and sacks. Row 2 = the merchant stall: small stone-and-timber shop with a striped ember-orange and cream awning, a counter with goods, a hanging sign shape without letters. Row 3 = the forge: open timber smithy with a terracotta roof, a big square stone chimney with smoke, a glowing furnace, an anvil on a log, a water barrel. Row 4 = the infirmary: small stone cottage with a slate roof, a round window, a door with a lantern, a fenced herb garden with lavender and green herbs beside it. Image as large as possible.

**Abnahme:** Alle vier Gebäude mit drei Ansichten und Ruinen-Einschub; Formen klar und klobig. Das Wasserfass der Schmiede ist blau – beim Modellieren nicht in Teamblau einfärben.

## 7 – Bogen D: Taverne, Lagerfeuer, Gedächtnishalle, Verzauberer (Nachricht 7)

> Perfect, exactly like this. SHEET D, identical layout and rules (four rows; per row: orthographic FRONT, orthographic SIDE, 3/4 view at level 3, and a smaller 3/4 view at level 1 ruin at the far right; plain white/light grey background, no text, no letters, no numbers, no people). Row 1 = the tavern: two-storey timber-framed stone house with a thick terracotta roof, a chimney with smoke, warm windows, a hanging sign shape without letters, two barrels and a bench by the door. Row 2 = the campfire: a stone fire ring with a big bright fire, three chunky log benches around it, a small stack of firewood and a cooking pot on a tripod (level 1 version: a small fire, scattered stones, one log). Row 3 = the memorial hall: a small chapel-like stone hall with a pointed gothic door, a gothic rose window, a slate roof with a small bell gable, and a row of small rounded grave stones with candles in front. Row 4 = the enchanter's rune tower: a slim round stone tower with a pointed slate-blue roof, a small balcony, glowing turquoise-gold rune symbols (simple shapes, not letters) on the stones, and a glowing rune circle on the ground in front. Image as large as possible.

**Abnahme:** Gut nutzbar. **Abweichung:** Die Gedächtnishalle trägt Kreuze auf Giebel und Grabsteinen; beim Modellieren weglassen bzw. durch Krone oder Glutfunken ersetzen (Welt hat den Pakt, kein Kreuz).

## 8 – Bogen E: Akademie, Werkstatt, Übungsplatz (Nachricht 8)

> Very nice. SHEET E, identical layout and rules (per row: orthographic FRONT, orthographic SIDE, 3/4 view at level 3, smaller 3/4 view at level 1 ruin at the far right; plain white/light grey background, no text, no letters, no numbers, no people, no religious symbols such as crosses). Three rows. Row 1 = the academy: a stone lecture hall / library with tall pointed gothic windows showing bookshelves, a slate-blue roof with a small round turret, a gothic door with steps, a reading bench and a small globe or telescope on a stand outside. Row 2 = the workshop: a timber craft shed with a lean-to roof, a big workbench with tools, stacked planks, a saw horse, a grindstone wheel and a few crates. Row 3 = the training ground: a square sandy yard with a chunky wooden fence, three straw training dummies on posts, a round archery target, a weapon rack with wooden practice swords and spears, and a small ember-orange pennant on a pole. Image as large as possible.

**Abnahme:** Gut nutzbar. Die Zielscheibe hat blaue und rote Ringe (Teamfarben); beim Modellieren in Erdtönen/Glutorange halten (Art Direction §2.1).

## 9 – Bogen F: Gefährten-Gegenstände (Nachrichten 9 und 10)

Nachricht 9 (Fassung 1, `sheet_companion_props_v1.png`):

> Great. Last one, SHEET F: three small companion objects that stand at fixed places in the castle, same style and sheet rules (plain white/light grey background, no text, no letters, no numbers, no people). Three rows, per row: orthographic FRONT view, orthographic SIDE view and a 3/4 perspective view at the same scale. Row 1 = a sturdy wooden weapon stand holding one big chunky double-bladed battle axe with rounded blade tips, a thick handle wrapped in ember-orange leather (#E8743B), a small whetstone on the stand's base. Row 2 = a round-bellied wooden lute with a feathered floppy hat hanging on its neck, leaning against an oak barrel, a small mug on the barrel lid. Row 3 = a tidy stack of four thick books in different colours (dark violet, parchment, green, red-brown) with brass corners, a pair of round glasses lying on top, a candle stub and a rolled scroll beside them. Chunky toy-like proportions, few large shapes. Wide landscape image.

**Abnahme Fassung 1:** Laute (Jory) und Bücherstapel (Ysolde) sehr gut; die Axt (Brenna) liegt waagerecht mit je einem Kopf an beiden Enden des Stiels – liest sich nicht als Doppelaxt. Daher Nachricht 10.

Nachricht 10 (Fassung 2, `sheet_companion_props.png`):

> Rows 2 and 3 are perfect, keep them exactly. Please redo the whole sheet with only row 1 changed: the battle axe must be ONE axe standing UPRIGHT in the stand - a single long thick handle pointing down into a wooden stand block, and at the TOP of the handle one axe head with two crescent blades, one to the left and one to the right (a classic double-bladed axe head), rounded blade tips, ember-orange leather grip wrap (#E8743B) on the lower handle, a small whetstone on the base. Same sheet rules, same three views per row, no text, no letters.

**Abnahme Fassung 2:** Axt jetzt aufrecht im Holzblock, ein Stiel mit doppelseitigem Kopf, glutorangefarbene Griffwicklung, Wetzstein auf dem Sockel; Zeilen 2 und 3 unverändert übernommen. Die 3/4-Ansicht der Axt ist fast frontal, die Seitenansicht zeigt die Blattdicke. Fassung 1 bleibt als Original erhalten (A3).
