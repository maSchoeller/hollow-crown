# burnt_slope_burnt_site – Brandhang, verbrannt (Zustandsbild der Weltkarte)

- **Zweck:** Zustandsvariante `burnt_slope_burnt` des Orts Brandhang auf der Weltkarte (Story 11.3, `content/world/valmora.yaml`, `requires: [{ flag: e7_order }]` = E7 „gehorchen“, Sable folgt Dravns Befehl). Brandhang hat kein eigenes Grundbild (`site.base: false`): Das gemalte Bergdorf der Karte ist der Grundzustand, das verbrannte Bild liegt als Überlagerung darauf.
- **Status:** **offen – Bild noch nicht erzeugt.** Am 2026-11-08 war Claude in Chrome in der Session nicht verbunden, ChatGPT also nicht erreichbar. Bis das Bild kommt, greift der Rückfall aus 15.7: ohne Grundbild zeichnet die Karte nichts, das gemalte Dorf bleibt sichtbar.
- **Dienst (geplant):** ChatGPT, Bildgenerierung, bezahlter Tarif (Plus, Konto maschoeller); Tarif und Konto am Erzeugungstag aus der Seitenleiste hier nachtragen (licensing §6 A1, A2).
- **Referenzen (eigene Bilder):** (1) Ausschnitt der Weltkarte um Brandhang aus `art/world/map_v5.png` (400 × 300 px um Kartenpixel 959/406 der 1254er Karte, auf 800 × 600 vergrößert): zwei rote Häuser mit Bäumen am Fuß der Berge, Weg und Fluss daneben; (2) `art/world/sites/erlbach_burnt.png` als Stilvorbild für „verbrannt“.
- **Originaldatei (nach dem Erzeugen):** `art/world/v5/burnt_slope_burnt_chatgpt.png`, unverändert (licensing §6 A3).
- **Abgeleitet:** `art/world/sites/burnt_slope_burnt.png` (Alphawerte unter 16 auf 0, wie alle Stadtbilder), Laufzeitbild `world/sites/burnt_slope_burnt.webp` über `pnpm art:build` (Paket act2). Lage und Breite: `art/world/map_places_v5.json` (x 959, bottom 406, width 43 der 1254er Karte) und `valmora.yaml` (`foot`, `width`); nach dem ersten Bild per Vorschau einpassen.
- **Menschlicher Anteil:** Motiv und Zeitpunkt vom Produktinhaber (Epic 11, Story 11.3); Prompt, Auswahl und Einpassung im Agenten-Ablauf. Keine Retusche von Hand.

## Prompt

Anhänge: zuerst der Kartenausschnitt, dann `erlbach_burnt.png`.

> Create a single isolated icon to lay over the small mountain hamlet in the middle of the FIRST attached image (two cottages with red roofs among autumn trees, at the foot of the mountains). Subject: the same hamlet after a forest fire swept down the slope: the two cottages with their roofs burnt away to black charred rafters and scorched walls, the trees around them burnt to bare black trunks, a patch of black ash ground and burnt grain terraces around the houses, a few small orange embers, thin grey smoke rising from two places. Same footprint, size and layout as the hamlet in the FIRST image, so it covers it exactly. No flames bigger than the embers, no people, no text. Exactly the drawing style, viewing angle and light of the attached images, burnt look like in the SECOND image. It will be shown small on the map, so use FEW, LARGE, SIMPLE shapes and a THICK dark-brown outline; no tiny details. Transparent background outside the burnt patch, no shadow outside it. Square 1:1.

Iterationen: noch keine.

## Abnahme

- offen (nach dem Erzeugen: Grundriss deckt das gemalte Dorf, Stil wie `erlbach_burnt`, auf der Karte bei 375 × 812 geprüft; licensing §6 A7: generisches Motiv, keine Namen geschützter Werke im Prompt).
