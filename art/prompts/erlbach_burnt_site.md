# erlbach_burnt_site – Stadtbild Erlbach, verbrannt

- **Zweck:** Zustandsvariante `erlbach_burnt` des Stadtbilds Erlbach auf der Weltkarte, nach Mission 1-2 (Produktinhaber 2026-11-06; `content/world/valmora.yaml`, `requires: [{ completed: m1_2 }]`).
- **Datum:** 2026-11-06
- **Dienst:** ChatGPT, Bildgenerierung (Modellversion in der Oberfläche nicht genannt), **Tarif Plus, Konto maschoeller** (Anzeige in der Seitenleiste am Erzeugungstag), gesteuert über Claude in Chrome.
- **Referenzen (eigene Bilder):** (1) Ausschnitt der Weltkarte um das Plateau von Erlbach aus `art/world/map_v5.png` (640 × 520 px), (2) `art/world/sites/erlbach.png` (Grundbild).
- **Originaldatei, unverändert:** `art/world/v5/erlbach_burnt_chatgpt.png` (1278 × 1230, RGBA; Download „Verbranntes Dorf mit zerbrochener Wassermühle.png“).
- **Abgeleitet:** `art/world/sites/erlbach_burnt.png` – Alphawerte unter 16 auf 0 (wie alle Stadtbilder); Laufzeitbild `world/sites/erlbach_burnt.webp` über `pnpm art:build`.
- **Menschlicher Anteil:** Motiv und Zeitpunkt vom Produktinhaber; Prompt, Auswahl und Einpassung (Vorschau per Skript, Breite 70 von 1254 wie das Grundbild) im Agenten-Ablauf. Keine Retusche von Hand.

## Prompt

Anhänge: zuerst der Kartenausschnitt mit dem Plateau, dann `erlbach.png`.

> Create a single isolated building icon for the empty plateau of the village in the FIRST attached image. Subject: the village Erlbach right after a bandit raid, the same village as in the SECOND attached image, now BURNT: the three cottages have their golden thatched roofs burnt away to black charred rafters, the walls are scorched dark, one cottage is partly collapsed, the wooden water mill is blackened and its big wheel is broken, a few small orange embers glow, thin grey smoke rises from two places. Same footprint, size and layout as the village in the SECOND image. No fire flames bigger than the embers, no people, no text. Exactly the drawing style, viewing angle and light of the attached images. It will be shown small on the map, so use FEW, LARGE, SIMPLE shapes and a THICK dark-brown outline; no tiny details. Transparent background. No ground, no base, no grass around it, no shadow outside the buildings. Square 1:1.

Eine Iteration, erster Wurf übernommen.

## Abnahme

- 2026-11-06, Agent (Abnahme an Agenten delegiert): gleicher Grundriss, Stil und Umriss wie das Grundbild; Dächer verkohlt, Mühlrad gebrochen, Glut und dünner Rauch. Auf dem Plateau geprüft.
- Licensing §6 A7: generisches Motiv, keine Namen geschützter Werke im Prompt.
- Der Produktinhaber sieht das Bild im PR; Änderungswünsche gehen in eine neue Iteration.
