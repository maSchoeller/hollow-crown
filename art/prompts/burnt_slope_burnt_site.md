# burnt_slope_burnt_site – Brandhang, verbrannt (Zustandsbild der Weltkarte)

- **Zweck:** Zustandsvariante `burnt_slope_burnt` des Orts Brandhang auf der Weltkarte (Story 11.3/11.15, `content/world/valmora.yaml`, `requires: [{ flag: { e07: obey } }]` = E7 „gehorchen“, der Befehl wird ausgeführt, Brandhang brennt). Brandhang hat kein eigenes Grundbild (`site.base: false`): Das gemalte Bergdorf der Karte ist der Grundzustand, das verbrannte Bild liegt als Überlagerung darauf.
- **Datum:** 2026-11-10
- **Dienst:** ChatGPT, Bildgenerierung (Modellversion in der Oberfläche nicht genannt), **Tarif Plus, Konto maschoeller** (Anzeige im Profilmenü am Erzeugungstag), gesteuert über Claude in Chrome.
- **Referenzen (eigene Bilder):** (1) Ausschnitt der Weltkarte um Brandhang aus `art/world/map_v5.png` (120 × 90 Einheiten der 1254er Karte um 959/386, auf 800 × 600 skaliert): zwei weiße Häuser mit roten Dächern zwischen grünen Büschen, Weg und Fluss daneben, Herbstwald darüber; (2) `art/world/sites/erlbach_burnt.png` (auf 640 × 616 verkleinert) als Stilvorbild für „verbrannt“.
- **Originaldatei, unverändert:** `art/world/v5/burnt_slope_burnt_chatgpt.png` (1254 × 1254, RGBA; per Blob-Download aus dem Chat gesichert).
- **Abgeleitet:** `art/world/sites/burnt_slope_burnt.png` – Alphawerte unter 16 auf 0 (wie alle Stadtbilder); Laufzeitbild `world/sites/burnt_slope_burnt.webp` über `pnpm art:build` (Paket act2). Lage und Breite: `art/world/map_places_v5.json` (x 959, bottom 406, width 43) und `valmora.yaml` (`foot`, `width`).
- **Menschlicher Anteil:** Motiv und Zeitpunkt vom Produktinhaber (Epic 11); Prompt, Auswahl und Einpassung (Vorschau per Skript: Inhalt zugeschnitten, auf 43 Einheiten Breite auf den Kartenausschnitt gelegt) im Agenten-Ablauf. Keine Retusche von Hand.

## Prompt

Anhänge: zuerst der Kartenausschnitt, dann `erlbach_burnt.png`.

> Create an image: a single isolated icon to lay over the small hamlet in the middle of the FIRST attached image (two white cottages with red roofs among a few green bushes, on yellow-green grass between the autumn forest, the dirt road and the blue river). Subject: the same hamlet after a fire swept down the slope: the two cottages with their red roofs burnt away to black charred rafters and scorched dark walls, the bushes around them burnt to bare black stumps, a patch of black-grey ash ground around the houses, a few small orange embers, thin grey smoke rising from two places. Same footprint, size, layout and viewing angle as the hamlet in the FIRST image, so it covers it exactly. No flames bigger than the embers, no people, no text, no logos. Exactly the drawing style, viewing angle and light of the attached images, burnt look like in the SECOND image. It will be shown small on the map, so use FEW, LARGE, SIMPLE shapes and a THICK dark-brown outline; no tiny details. Transparent background outside the burnt patch, no shadow outside it. Square 1:1.

Eine Iteration, erster Wurf übernommen.

## Prüfung gegen licensing §6

- A1/A2: bezahlter Tarif (Plus, Konto maschoeller) am Erzeugungstag, Protokoll mit Dienst, Prompt, Referenzen, Original, menschlichem Anteil.
- A3: Original unverändert unter `art/world/v5/burnt_slope_burnt_chatgpt.png` ablegen (LFS).
- A7: generisches Motiv, keine Namen geschützter Werke, Marken oder Personen im Prompt; keine Schrift, keine Logos im Bild.

## Abnahme

- offen. Agentenprüfung 2026-11-10: zwei Häuser mit verkohlten Dachsparren, rußgeschwärzten Wänden, Glut, zwei Rauchfahnen, Ascheboden, kahle Strünke; dicker dunkelbrauner Umriss wie `erlbach_burnt`. Auf dem Kartenausschnitt mit Breite 43 / bottom 406 deckt es das gemalte Dorf vollständig ab (etwas breiter als das Dorf). Noch nicht im Spiel bei 375 × 812 geprüft.
